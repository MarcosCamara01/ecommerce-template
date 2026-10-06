# Auditoria de vulnerabilidades de dependencias (2026-10-06)

## Resumen

Alcance: rama `claude/frosty-hofstadter-93c529`, sobre el commit `d5b2665`,
npm con `package-lock.json` v3, Next.js 16.3.8 y Tailwind 3.4.18.

Tres advisories publicados o actualizados entre el 2026-10-05 y el 2026-10-06
hacen fallar el gate de CI (`npm audit --audit-level=low`, con y sin
`--omit=dev`) sobre un lock que no habia cambiado. npm contaba 6 entradas
(3 high, 3 moderate): las tres de la tabla y, solo como padres, `next`,
`postcss-nested` y `tailwindcss`. Con los cambios de abajo quedan 0.

No cambia codigo de la aplicacion, ni la version de Next, ni la de Tailwind.
Los comandos y umbrales del audit siguen igual. `zod` sigue en 4.4.3 en la raiz.

Las pruebas largas (comparacion de builds, `next/image` y e2e) se hicieron con
este mismo cambio sobre la punta local de la rama ese dia, nueve commits por
delante de `d5b2665` y aun sin publicar. El baseline se repitio despues sobre
`d5b2665`, que es donde queda el commit.

## Tabla por advisory

| Advisory | Sev. | Dependencia | Explotabilidad en esta app | Resolucion |
|---|---|---|---|---|
| [GHSA-wq5f-xc86-pv6w](https://github.com/advisories/GHSA-wq5f-xc86-pv6w) | High | `sharp` < 0.35.5, opcional de Next (`^0.35.4`), fijada en 0.35.4 por el override | No alcanzable: el fallo esta en librsvg y solo se llega decodificando SVG. La app no importa `sharp`; el optimizador de `next/image` rechaza fuentes SVG (HTTP 400, no hay `dangerouslyAllowSVG`) y las subidas del catalogo solo admiten JPEG, PNG y WebP. Vercel, ademas, no ejecuta este optimizador local. | Override `sharp` 0.35.4 -> 0.35.5 (libvips 8.18.7, librsvg 2.63.2). |
| [GHSA-68fv-2mgg-jv7q](https://github.com/advisories/GHSA-68fv-2mgg-jv7q) | High | `source-map-js` 1.0.0 - 1.2.1, via `postcss@8.5.23` (`^1.2.1`) y `magicast` (dev) | No alcanzable: solo se usa al compilar el CSS del repo; nadie le pasa source maps indexados no confiables. | Renovacion dirigida del lock a 1.2.2, dentro del rango. Sin override. |
| [GHSA-rj75-hqrm-r3gf](https://github.com/advisories/GHSA-rj75-hqrm-r3gf) | Moderate | `postcss-selector-parser` < 7.1.6, via `tailwindcss@3.4.18` (`^6.1.2`) y `postcss-nested@6.2.0` (`^6.1.1`) | No alcanzable: solo parsea selectores del repo en build. El propio advisory excluye el uso en build sobre fuentes confiables. | Override exacto a 7.1.6. Ver la decision abajo. |

## Decision sobre postcss-selector-parser

No existe una 6.x corregida: el tag `legacy-v6` sigue en 6.1.4 y el advisory
cubre todo lo anterior a 7.1.6. Tailwind 3.4.19 (`v3-lts`) sigue pidiendo
`^6.1.2`, asi que `npm audit fix` solo ofrece Tailwind 4.3.3, que queda fuera
de este cambio. Las opciones eran forzar la 7.1.6 o mantener una copia privada
con el parche, como se hizo con `braces`. Aqui upstream si publica el arreglo,
asi que se fuerza la version oficial y no se mantiene un fork.

El override obliga a Tailwind 3 y a `postcss-nested` 6 a usar un major que no
declaran. Evidencia de que funcionan igual:

- Entre la 6.1.2 y la 7.1.1, las ultimas de cada linea compiladas con Babel,
  solo cambian `Container#insertBefore`, `insertAfter` y `prepend`: aceptan
  varios nodos y ajustan de otra forma el indice de una iteracion en curso
  (7.0.0 y 7.1.0). Lo posterior son arreglos que la 6 tambien recibio (6.1.3,
  6.1.4), correcciones del parser (7.1.5, 7.1.6) y el paso de Babel a `tsc`,
  que impide comparar el `dist` linea a linea. Por eso el resto es empirico.
- `postcss-nested` 7.0.x usa el parser 7 con el mismo codigo de selectores
  que la 6.2.0 instalada.
- La suite de Tailwind 3.4.18 (tag `v3.4.18`) pasa igual con 6.1.4 y con
  7.1.6: 86 suites, 1055 tests. En la segunda ejecucion tanto Tailwind como
  `postcss-nested` resolvian la 7.1.6.
- Diferencial con dos instalaciones que solo difieren en el parser: 16
  escenarios (el config, las fuentes y el CSS reales del proyecto, mas 15
  configuraciones con 125.752 candidatos: variantes apiladas y arbitrarias,
  `@apply`, `important`, `prefix`, separador propio, modos de `darkMode` y
  selectores compuestos con la clase en cada posicion) dan salida identica
  byte a byte: 319 MB por lado. El cambio de 7.0.0 se ejercita de verdad: en
  un solo escenario 376.575 inserciones ajustan el indice de iteracion con la
  regla nueva donde la 6.x aplicaba la otra, sin cambiar la salida.
- En el proyecto: el CSS que genera Tailwind es identico con un parser y con
  el otro, tanto en `d5b2665` como en la punta local. Entre dos builds de
  produccion de esa punta, uno con el lock anterior y otro con el nuevo, y la misma
  `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` para que el build sea reproducible, son
  identicos 862 de 876 ficheros, entre ellos los 38 chunks de cliente (con el
  CSS) y los 398 de servidor. De los 14 restantes, 11 son prerender que cambia
  en cada build y 3 se deben al cambio: el bundle interno de PostCSS que usa
  el build, su mapa, y la traza de ficheros del servidor, que nombra los
  binarios de `sharp`.

Retirar el override cuando Tailwind pase a la v4, cuando Tailwind 3 o
`postcss-nested` acepten `^7`, o si se publica una 6.x corregida (en ese caso,
fijar esa). Mientras exista, cualquier subida de Tailwind 3 debe repetir la
comparacion del CSS generado.

## Cambios implementados

- `package.json`, `overrides`: `sharp` 0.35.4 -> 0.35.5 y nuevo
  `postcss-selector-parser` 7.1.6.
- `package-lock.json`: 29 entradas. `sharp` y sus 26 paquetes `@img/*`
  (0.35.5, libvips 1.3.4, todas las plataformas conservadas),
  `postcss-selector-parser` 7.1.6 y `source-map-js` 1.2.2. Nada mas se mueve.

El override de `sharp` ya no hace falta para llegar a una version corregida:
Next 16.3.8 declara `^0.35.4` y el lock fija la 0.35.5. Se mantiene, subido,
por coherencia con los demas overrides exactos; al fijar la version, el
proximo advisory de `sharp` volvera a exigir subirlo a mano.

## Validacion

Con Node 24.19 y npm 11.17, sobre una instalacion limpia (`npm ci`) de
`d5b2665` con este cambio:

- `npm ci`: 722 paquetes; npm informa de 0 vulnerabilidades.
- `npm test`: 455 tests, 0 fallos.
- `npm run typecheck`, `npm run lint`, `npm run verify:architecture`,
  `npm run verify:release` y `drizzle-kit check`: exit 0.
- `npm run build`: exit 0; 36 paginas.
- `npm run doctor`: 100/100.

Sobre la punta local, donde el mismo baseline tambien paso (461 tests) y
`npm ci` bajo de 6 vulnerabilidades a 0:

- `next/image` con `sharp` 0.35.5, en un build de produccion contra el
  catalogo local de QA: las 26 fotos de producto de la portada y las
  secciones se sirven como AVIF, WebP y JPEG validos a 384, 828 y 1920 px
  (234 respuestas decodificadas, con `max-age` de 31 dias). Las 156 AVIF y
  WebP son identicas byte a byte a las del mismo commit con `sharp` 0.35.4.
- La suite e2e de la rama, aun sin publicar ese dia: `storefront` y `product`
  pasan contra ese build (20 tests), incluido el de las fotos en AVIF y el
  visor de fotos.

## Fuentes primarias

- [Advisory de sharp](https://github.com/lovell/sharp/security/advisories/GHSA-wq5f-xc86-pv6w)
  y [sharp 0.35.5](https://github.com/lovell/sharp/releases/tag/v0.35.5).
- [source-map-js 1.2.2](https://github.com/7rulnik/source-map-js/releases/tag/v1.2.2).
- [Advisory de postcss-selector-parser](https://github.com/postcss/postcss-selector-parser/security/advisories/GHSA-rj75-hqrm-r3gf),
  [7.1.6](https://github.com/postcss/postcss-selector-parser/releases/tag/7.1.6)
  y su [changelog](https://github.com/postcss/postcss-selector-parser/blob/master/CHANGELOG.md).
- [Tailwind CSS v3.4.18](https://github.com/tailwindlabs/tailwindcss/tree/v3.4.18).
- [Overrides en la documentacion de npm](https://docs.npmjs.com/cli/v11/configuring-npm/package-json#overrides).
