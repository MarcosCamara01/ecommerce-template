# Auditoria de vulnerabilidades de dependencias (2026-08-24)

## Resumen ejecutivo

Alcance: rama `feat/verifiable-auth-catalog-fulfillment`, commit inicial
`ac34373cbd5d769ced1551ce9f443b4a11bd050c`, npm con
`package-lock.json` v3.

El baseline reproducido con `npm audit --omit=dev --json` contenia 19 entradas
de paquetes vulnerables: 12 high, 5 moderate y 2 low. Tras upgrades dirigidos,
sin `npm audit fix`, sin cambiar de package manager y sin degradar paquetes, el
resultado es 0 entradas. Se eliminaron las 19 entradas y los 43 advisories
individuales del baseline.

Un segundo pase sobre `npm audit` sin omitir devDependencies encontro 33
entradas adicionales de tooling: 1 critical, 18 high, 11 moderate y 3 low.
La mayoria procedia del CLI local `vercel@56.2.1`, que no estaba referenciado
por ningun script ni import del repositorio. Tras retirarlo y actualizar cuatro
transitivas compatibles de ESLint, el audit completo tambien queda en cero.

Las dos causas que inicialmente requerian una decision adicional quedaron
resueltas sin degradaciones:

1. `nodemailer@9.0.5` cierra los seis advisories que permanecian en la linea 7.
   El contrato reducido de correo compila sin cambios y no usa los flujos
   afectados por los breaking changes de las lineas 8 y 9.
2. Drizzle Kit permanece en la ultima version estable `0.31.10`. Un override
   scoped hace que `@esbuild-kit/core-utils@3.3.2` use el esbuild corregido
   `0.25.12`, que ya era dependencia directa de Drizzle Kit. Una instalacion
   limpia confirma un unico esbuild 0.25.12 para ambas rutas, y
   `drizzle-kit check` sigue cargando la configuracion y validando las snapshots.

No se hicieron cambios de esquema, datos, servicios externos, commit ni push.

## Evidencia del repositorio

### Comandos y versiones

Se ejecutaron en el commit inicial, antes de modificar dependencias:

- `npm audit --omit=dev --json`: exit 1; 19 entradas (12 high, 5 moderate,
  2 low).
- `npm outdated --json`: entre los datos relevantes, `next` 16.2.10 ->
  16.3.2, `nodemailer` 7.0.10 -> 9.0.5, `@supabase/supabase-js` 2.49.4 ->
  2.112.3 y Drizzle Kit sin version estable posterior a 0.31.10.
- `npm explain` para cada paquete afectado. Las rutas se resumen abajo.
- Lectura de `package.json`, `package-lock.json`, imports y configuracion real.

Versiones bloqueadas al inicio:

| Paquete | Version | Ruta real |
|---|---:|---|
| `next` | 16.2.10 | directa |
| `nodemailer` | 7.0.10 | directa |
| `@supabase/supabase-js` / `@supabase/auth-js` | 2.49.4 / 2.69.1 | directa / transitiva |
| `sharp` | 0.34.5 | opcional de Next |
| `postcss` | 8.4.31 (Next) y 8.4.49 (Tailwind) | transitiva |
| `lodash`, `js-cookie`, `@babel/runtime` | 4.17.21, 3.0.5, 7.23.8 | via `ahooks`; runtime de Babel tambien via `react-error-boundary` |
| `defu` | 6.1.4 | via `better-auth@1.6.28` |
| `glob` / `minimatch` / `brace-expansion` | 10.4.5 / 9.0.5 / 2.0.2 | `tailwindcss -> sucrase -> glob` |
| `picomatch` | 2.3.1 | `tailwindcss -> chokidar/fast-glob` |
| `nanoid` | 3.3.7 | via PostCSS |
| `esbuild` | 0.18.20 y 0.27.7 vulnerables | via Drizzle Kit legacy y `tsx` |

### Rutas de ejecucion relevantes

- Next usa App Router, Proxy y Server Actions:
  `src/proxy.ts:6`, `src/app/actions.ts:1` y
  `src/app/(user)/orders/action.ts:1`.
- No hay `i18n.locales`, `rewrites()`, `redirects()`, custom server ni runtime
  Edge. Tampoco existe el patron vulnerable
  `fetch(new Request(...), differentInit)`.
- El optimizador de imagen si se usa (`src/components/products/ProductImage.tsx:38`)
  y `next.config.js:29` define `remotePatterns`, pero el despliegue declarado es
  Vercel (`vercel.json`) y el advisory oficial excluye Vercel. En self-hosting
  habria exposicion adicional.
- Nodemailer es server-only (`src/lib/email/mailer.ts:1`) y solo recibe
  `from`, `to`, `subject`, `html`, `replyTo` y `messageId`
  (`src/lib/email/mailer.ts:124-140`). El transporte usa SMTP password
  (`src/lib/email/mailer.ts:99-115`), no OAuth2.
- Supabase JS solo crea un cliente server-only de Storage con sesiones y refresh
  deshabilitados (`src/lib/storage/supabase.ts:1-13`); no usa Supabase Auth.
- La aplicacion importa exclusivamente `useThrottleFn` de ahooks
  (`src/components/cart/AddToCart.tsx:5`,
  `src/components/cart/ProductCartInfo.tsx:4`,
  `src/components/wishlist/WishlistButton.tsx:6`). Ese hook usa
  `lodash/throttle`, no `template`, `unset` u `omit`; `useCookieState` no se usa.
- Drizzle Kit se usa como CLI de generacion (`package.json` script
  `db:generate`) y desde `drizzle.config.ts`; no hay ningun `esbuild.serve()`,
  `servedir` ni `esbuild --serve` en el repositorio.

## Tabla por advisory

La severidad es la del advisory, no la severidad agregada que npm asigna al
paquete padre. "No alcanzable" significa que falta una precondicion concreta en
el codigo inspeccionado; no significa que deba conservarse una version
vulnerable si existe un parche compatible.

| Advisory | Sev. | Dependencia | Explotabilidad en esta app | Resolucion |
|---|---|---|---|---|
| [GHSA-6gpp-xcg3-4w24](https://github.com/advisories/GHSA-6gpp-xcg3-4w24) | High | Next, directa | No se cumple la precondicion de una unica entrada en `config.i18n.locales`; no hay i18n configurado. Si usa Proxy. | Corregido en 16.2.11; instalado 16.3.2. |
| [GHSA-m99w-x7hq-7vfj](https://github.com/advisories/GHSA-m99w-x7hq-7vfj) | High | Next, directa | Alcanzable: App Router y al menos una Server Action. Permite DoS remoto sin autenticar. | Corregido en 16.2.11; instalado 16.3.2. |
| [GHSA-89xv-2m56-2m9x](https://github.com/advisories/GHSA-89xv-2m56-2m9x) | High | Next, directa | No alcanzable en el despliegue declarado: Vercel fija Host; no hay custom server. | Corregido en 16.2.11; instalado 16.3.2. |
| [GHSA-68g3-v927-f742](https://github.com/advisories/GHSA-68g3-v927-f742) | Moderate | Next, directa | No se encontro `fetch(new Request(init), differentInit)` en servidor. | Corregido en 16.2.11; instalado 16.3.2. |
| [GHSA-4633-3j49-mh5q](https://github.com/advisories/GHSA-4633-3j49-mh5q) | Moderate | Next, directa | No se hacen fetch server-side con cuerpo y charset no UTF-8. | Corregido en 16.2.11; instalado 16.3.2. |
| [GHSA-4c39-4ccg-62r3](https://github.com/advisories/GHSA-4c39-4ccg-62r3) | Moderate | Next, directa | No alcanzable: ninguna Server Action usa runtime Edge. | Corregido en 16.2.11; instalado 16.3.2. |
| [GHSA-p9j2-gv94-2wf4](https://github.com/advisories/GHSA-p9j2-gv94-2wf4) | High | Next, directa | No alcanzable: `next.config.js` no define rewrites/redirects con host dinamico. | Corregido en 16.2.11; instalado 16.3.2. |
| [GHSA-q8wf-6r8g-63ch](https://github.com/advisories/GHSA-q8wf-6r8g-63ch) | Moderate | Next, directa | Vercel no esta afectado segun el advisory. En self-hosting si seria relevante porque hay `remotePatterns` y loader por defecto. | Corregido en 16.2.11; instalado 16.3.2. |
| [GHSA-955p-x3mx-jcvp](https://github.com/advisories/GHSA-955p-x3mx-jcvp) | Moderate | Next, directa | Alcanzable como enumeracion: hay Server Actions. Las acciones de pedidos autentican dentro del boundary; las demas exponen catalogo publico. | Corregido en 16.2.11; instalado 16.3.2. |
| [GHSA-f88m-g3jw-g9cj](https://github.com/advisories/GHSA-f88m-g3jw-g9cj) | High | Sharp, transitiva opcional de Next | Vercel no ejecuta este optimizador local. En self-hosting, entradas de imagen no confiables si serian relevantes; los uploads de catalogo solo comprueban `File`/tamano y requieren capacidad admin. | Corregido en 0.35.0; instalado 0.35.3 por Next 16.3.2. |
| [GHSA-qx2v-qp2m-jg93](https://github.com/advisories/GHSA-qx2v-qp2m-jg93) | Moderate | PostCSS, transitiva | No alcanzable: solo build de CSS del repo; no se procesa CSS de usuarios ni se incrusta su salida en `<style>`. | Corregido en 8.5.10; instalado 8.5.23. |
| [GHSA-6g55-p6wh-862q](https://github.com/advisories/GHSA-6g55-p6wh-862q) | High | PostCSS, transitiva | No alcanzable: no existe servicio que procese CSS no confiable. | Corregido inicialmente en 8.5.12; el arreglo completo de la familia queda en 8.5.23, instalado. |
| [GHSA-r28c-9q8g-f849](https://github.com/advisories/GHSA-r28c-9q8g-f849) | High | PostCSS, transitiva | No alcanzable: no hay `sourceMappingURL` controlado por usuarios en un pipeline runtime. | Corregido en 8.5.18; instalado 8.5.23. |
| [GHSA-fxqj-rqcc-2cmp](https://github.com/advisories/GHSA-fxqj-rqcc-2cmp) | Moderate | PostCSS, transitiva | No alcanzable por la misma frontera de confianza; es el bypass del arreglo anterior cuando falta `from`. | Corregido en 8.5.23; instalado. |
| [GHSA-8r88-6cj9-9fh5](https://github.com/advisories/GHSA-8r88-6cj9-9fh5) | Low | Auth JS, transitiva de Supabase JS | No alcanzable: la app usa Supabase solo para Storage; no llama `getUserById`, `deleteUser`, `updateUserById`, `listFactors` ni `deleteFactor`. | Auth JS corregido en 2.70.0; instalado mediante Supabase JS 2.50.0. |
| [GHSA-737v-mqg7-c878](https://github.com/advisories/GHSA-737v-mqg7-c878) | High | `defu`, transitiva de Better Auth | No se identifico input de usuario sin sanear como primer argumento: `oauth-proxy`, que mezcla query/body, no esta configurado; las demas llamadas inspeccionadas mezclan opciones, hooks y contextos internos. | Corregido en 6.1.5 mediante override exacto. |
| [GHSA-r5fr-rjxr-66jc](https://github.com/advisories/GHSA-r5fr-rjxr-66jc) | High | Lodash, transitiva de ahooks | No alcanzable: no se usa `_.template`; ahooks solo llega a `lodash/throttle`. | Corregido en 4.18.0; override 4.18.1. |
| [GHSA-f23m-r3pf-42rh](https://github.com/advisories/GHSA-f23m-r3pf-42rh) | Moderate | Lodash, transitiva | No alcanzable: no se usan `_.unset` ni `_.omit`. | Corregido en 4.18.0; override 4.18.1. |
| [GHSA-xxjr-mmjv-4gpg](https://github.com/advisories/GHSA-xxjr-mmjv-4gpg) | Moderate | Lodash, transitiva | No alcanzable: no se usan `_.unset` ni `_.omit`. | Corregido en 4.17.23; override 4.18.1 tambien cubre el bypass posterior. |
| [GHSA-qjx8-664m-686j](https://github.com/advisories/GHSA-qjx8-664m-686j) | High | `js-cookie`, transitiva de ahooks | No alcanzable: la app no usa `useCookieState` ni pasa atributos JSON a js-cookie. | Corregido en 3.0.7; override 3.0.8. |
| [GHSA-968p-4wvh-cqc8](https://github.com/advisories/GHSA-968p-4wvh-cqc8) | Moderate | Babel runtime, transitiva | No se encontro codigo generado con named capture + `.replace` + reemplazo no confiable; ahooks usa helpers de tipo/interoperabilidad. | Corregido en 7.26.10 mediante override exacto. |
| [GHSA-5j98-mcp5-4vw2](https://github.com/advisories/GHSA-5j98-mcp5-4vw2) | High | `glob`, transitiva de Tailwind/Sucrase | No alcanzable: solo afecta al CLI `glob -c/--cmd`; no existe ese comando en scripts. | Corregido en 10.5.0; instalado. |
| [GHSA-3ppc-4f35-3m26](https://github.com/advisories/GHSA-3ppc-4f35-3m26) | High | `minimatch`, transitiva de glob | No alcanzable: patrones de build controlados por desarrolladores, no por peticiones. | Para linea 9, corregido en 9.0.6; instalado 9.0.9. |
| [GHSA-7r86-cg39-jmmj](https://github.com/advisories/GHSA-7r86-cg39-jmmj) | High | `minimatch`, transitiva | No alcanzable por la misma frontera de confianza. | Para linea 9, corregido en 9.0.7; instalado 9.0.9. |
| [GHSA-23c5-xmqv-rm74](https://github.com/advisories/GHSA-23c5-xmqv-rm74) | High | `minimatch`, transitiva | No alcanzable por la misma frontera de confianza. | Para linea 9, corregido en 9.0.7; instalado 9.0.9. |
| [GHSA-f886-m6hf-6m8v](https://github.com/advisories/GHSA-f886-m6hf-6m8v) | Moderate | `brace-expansion`, transitiva | No alcanzable: no se aceptan patrones glob no confiables. | Para linea 2, corregido en 2.0.3; instalado 2.1.4. |
| [GHSA-3jxr-9vmj-r5cp](https://github.com/advisories/GHSA-3jxr-9vmj-r5cp) | High | `brace-expansion`, transitiva | No alcanzable por la misma frontera de confianza. | Para linea 2, corregido en 2.1.2; instalado 2.1.4. |
| [GHSA-mh99-v99m-4gvg](https://github.com/advisories/GHSA-mh99-v99m-4gvg) | High | `brace-expansion`, transitiva | No alcanzable por la misma frontera de confianza. | Para linea 2, corregido en 2.1.3; instalado 2.1.4. |
| [GHSA-rgw5-rvv9-x895](https://github.com/advisories/GHSA-rgw5-rvv9-x895) | High | `brace-expansion`, transitiva | No alcanzable por la misma frontera de confianza. | Para linea 2, corregido en 2.1.4; instalado. |
| [GHSA-3v7f-55p6-f55p](https://github.com/advisories/GHSA-3v7f-55p6-f55p) | Moderate | `picomatch`, transitiva de Tailwind | No alcanzable: los globs son configuracion de build controlada por el repo. | Corregido en 2.3.2; instalado. |
| [GHSA-c2c7-rcm5-vvqj](https://github.com/advisories/GHSA-c2c7-rcm5-vvqj) | High | `picomatch`, transitiva | No alcanzable por la misma frontera de confianza. | Corregido en 2.3.2; instalado. |
| [GHSA-mwcw-c2x4-8c55](https://github.com/advisories/GHSA-mwcw-c2x4-8c55) | Moderate | `nanoid`, transitiva de PostCSS | No alcanzable: no hay import directo ni tamano no entero controlado por usuario. | Para linea 3, corregido en 3.3.8; instalado 3.3.18. |
| [GHSA-28wg-ghj8-5hjv](https://github.com/advisories/GHSA-28wg-ghj8-5hjv) | High | `nanoid`, transitiva | No alcanzable: exige generador no seguro con tamano negativo controlado. | Corregido en 3.3.16; instalado 3.3.18. |
| [GHSA-2v37-7h3g-55p8](https://github.com/advisories/GHSA-2v37-7h3g-55p8) | High | `nanoid`, transitiva | No alcanzable: exige custom generator con tamano cero controlado. | Corregido en 3.3.18; instalado. |
| [GHSA-g7r4-m6w7-qqqr](https://github.com/advisories/GHSA-g7r4-m6w7-qqqr) | Low | esbuild, transitiva de `tsx` | No alcanzable: solo servidor dev de esbuild en Windows, no usado. | Corregido en 0.28.1; `tsx@4.23.12` resolvio esbuild 0.28.2. |
| [GHSA-67mh-4wv8-2f99](https://github.com/advisories/GHSA-67mh-4wv8-2f99) | Moderate | esbuild, transitiva de Drizzle Kit | No alcanzable: solo `serve`; Drizzle se usa como CLI de esquema y no expone un servidor esbuild. | Corregido en esbuild 0.25.0; override scoped a 0.25.12, verificado con instalacion limpia. |
| [GHSA-rcmh-qjqh-p98v](https://github.com/advisories/GHSA-rcmh-qjqh-p98v) | High | Nodemailer, directa | Era la unica ruta Nodemailer plausible porque `to`/`replyTo` pasan por addressparser, aunque las entradas se validan como email. | Corregido en 7.0.11; instalado 9.0.5. |
| [GHSA-c7w3-x93f-qmm8](https://github.com/advisories/GHSA-c7w3-x93f-qmm8) | Low | Nodemailer, directa | No alcanzable: `sendMail` nunca recibe `envelope`, menos aun `envelope.size`. | Corregido en 8.0.4; instalado 9.0.5. |
| [GHSA-vvjj-xcjg-gr5g](https://github.com/advisories/GHSA-vvjj-xcjg-gr5g) | Moderate | Nodemailer, directa | No alcanzable: el transporte no define `name`; host/servicio son configuracion del servidor. | Corregido en 8.0.5; instalado 9.0.5. |
| [GHSA-268h-hp4c-crq3](https://github.com/advisories/GHSA-268h-hp4c-crq3) | Moderate | Nodemailer, directa | No alcanzable: la app no pasa opcion `list` ni comentarios List-*. | Corregido en 8.0.9; instalado 9.0.5. |
| [GHSA-wqvq-jvpq-h66f](https://github.com/advisories/GHSA-wqvq-jvpq-h66f) | Moderate | Nodemailer, directa | No alcanzable: no usa `jsonTransport`, attachments, `path` ni `href`. | Corregido en 8.0.9; instalado 9.0.5. |
| [GHSA-r7g4-qg5f-qqm2](https://github.com/advisories/GHSA-r7g4-qg5f-qqm2) | Moderate | Nodemailer, directa | No alcanzable: autenticacion SMTP por usuario/password, no OAuth2 token fetch. | Corregido en 8.0.8; instalado 9.0.5. |
| [GHSA-p6gq-j5cr-w38f](https://github.com/advisories/GHSA-p6gq-j5cr-w38f) | High | Nodemailer, directa | No alcanzable: la app no acepta ni pasa la opcion `raw`, ni configura acceso a fichero/URL. | Corregido en 9.0.1; instalado 9.0.5. |

## Cambios implementados

Los cambios efectivos en dependencias son:

- `next`: 16.2.10 -> 16.3.2. Este salto tambien actualiza sus dependencias
  soportadas a `sharp@0.35.3`, `postcss@8.5.23` y `nanoid@3.3.18`; usar solo
  Next 16.2.11 habria dejado Sharp y PostCSS vulnerables.
- `@supabase/supabase-js`: 2.49.4 -> 2.50.0, el primer release que incluye
  `@supabase/auth-js@2.70.0`. Se evito el latest 2.112.3 porque exige Node 22 y
  no era necesario para este advisory.
- `nodemailer`: 7.0.10 -> 9.0.5 y `@types/nodemailer` -> 8.0.1. El contrato
  reducido de `src/lib/email/mailer.ts` no requirio cambios.
- `tsx`: 4.21.0 -> 4.23.12, resolviendo esbuild 0.28.2.
- Overrides exactos: `@babel/runtime@7.26.10`,
  `@esbuild-kit/core-utils@3.3.2 -> esbuild@0.25.12`, `defu@6.1.5`,
  `js-cookie@3.0.8`, `lodash@4.18.1`.
- Renovacion dirigida del lock: `glob@10.5.0`, `minimatch@9.0.9`,
  `brace-expansion@2.1.4`, `picomatch@2.3.2`.
- Eliminacion de la devDependency no utilizada `vercel@56.2.1`, retirando su
  arbol de builders y el `tar@7.5.7` critical sin afectar `vercel.json` ni el
  script `vercel-build`.
- Actualizaciones compatibles del tooling ESLint: `@babel/core@7.29.7`,
  `ajv@6.15.0`, `flatted@3.4.4` y `js-yaml@4.3.1`.
- Alineacion de `eslint-config-next` y `@next/eslint-plugin-next` con Next.js
  16.3.2.
- Eliminacion de `@types/bcryptjs`; `bcryptjs@3.0.2` publica sus propios tipos.
- Actualizacion de Browserslist a `caniuse-lite@1.0.30001809` y
  `baseline-browser-mapping@2.11.18`, sin cambios en los navegadores objetivo.

Archivos modificados por esta remediacion y su evidencia:

- `package.json`
- `package-lock.json`
- `docs/security/dependency-audit-2026-08-24.md`

## Vulnerabilidades restantes

No quedan vulnerabilidades en `npm audit`, incluyendo devDependencies.

Se evaluo Drizzle Kit 1.0.0-rc.4, pero se rechazo porque importa
`drizzle-orm/_relations`, una exportacion ausente en `drizzle-orm@0.45.2`, y npm
marca el peer de Better Auth como invalido. Hacer viable ese RC exigiria migrar
tambien Drizzle ORM y Better Auth a sus lineas RC/nuevas. El override scoped
resuelve la dependencia vulnerable real manteniendo el stack estable.

No se acepta la propuesta de npm de `drizzle-kit@0.18.1`: es una degradacion
incompatible y su manifest declara `esbuild@^0.15.18`, tambien vulnerable.

## Estado final reproducido

Tanto `npm audit --omit=dev --json` como `npm audit --json` despues de los
cambios: 0 critical, 0 high, 0 moderate, 0 low, 0 total.

## Validacion final

- `npm ci`: exit 0; instalacion limpia de 670 paquetes.
- `npm test`: exit 0; 287 tests, 287 pass, 0 fail.
- `npm run typecheck`: exit 0.
- `npm run lint`: exit 0.
- `npm run verify:architecture`: exit 0; `Architecture boundary: PASS`.
- `npm run verify:release`: exit 0; `Release evidence gate: PASS`.
- `npx drizzle-kit check --config=drizzle.config.ts`: exit 0.
- `npx react-doctor@0.9.12 --verbose --scope full`: exit 0; 100/100.
- `npx update-browserslist-db@latest`: exit 0; base actualizada y sin cambios
  en los navegadores objetivo.
- `npm run build`: exit 0; Next.js 16.3.2 compilo y genero 36 paginas.
- `npm audit`: exit 0; 0 vulnerabilidades incluyendo devDependencies.
- `npm audit --omit=dev`: exit 0; 0 vulnerabilidades.
- `npm ls --all`: exit 0; arbol de dependencias valido.
- `git diff --check`: exit 0.

Avisos no bloqueantes observados: los tests imprimen warnings preexistentes
`MODULE_TYPELESS_PACKAGE_JSON` y un error simulado esperado; el build avisa de
un lockfile padre fuera del repositorio. El aviso de Browserslist antiguo ya no
aparece despues de actualizar su base de datos.

## Fuentes primarias adicionales

- [Next.js 16.2.11 security release](https://github.com/vercel/next.js/releases/tag/v16.2.11)
  y [Next.js 16.3.2](https://github.com/vercel/next.js/releases/tag/v16.3.2).
- [Guia oficial de upgrades de Next.js](https://nextjs.org/docs/app/getting-started/upgrading)
  y [update-browserslist-db](https://github.com/browserslist/update-db).
- [Sharp advisory del mantenedor](https://github.com/lovell/sharp/security/advisories/GHSA-f88m-g3jw-g9cj)
  y [Sharp 0.35.0](https://github.com/lovell/sharp/releases/tag/v0.35.0).
- [PostCSS 8.5.23](https://github.com/postcss/postcss/releases/tag/8.5.23).
- [Supabase JS 2.50.0](https://github.com/supabase/supabase-js/releases/tag/v2.50.0),
  que eleva Auth JS a 2.70.0.
- [Nodemailer changelog oficial](https://github.com/nodemailer/nodemailer/blob/master/CHANGELOG.md)
  y [Nodemailer 9.0.5](https://github.com/nodemailer/nodemailer/releases/tag/v9.0.5).
- [Drizzle Kit 0.31.10 manifest oficial](https://github.com/drizzle-team/drizzle-orm/blob/drizzle-kit%400.31.10/drizzle-kit/package.json)
  y [release 0.31.10](https://github.com/drizzle-team/drizzle-orm/releases/tag/drizzle-kit%400.31.10),
  junto con el [issue upstream #5481](https://github.com/drizzle-team/drizzle-orm/issues/5481).
- [Overrides en la documentacion oficial de npm](https://docs.npmjs.com/files/package.json/#overrides)
  y [bug de lock existente npm/cli #4232](https://github.com/npm/cli/issues/4232).
- [node-tar decompression DoS](https://github.com/advisories/GHSA-23hp-3jrh-7fpw)
  y [node-tar recursion DoS](https://github.com/advisories/GHSA-r292-9mhp-454m).
- [Babel Core file read](https://github.com/advisories/GHSA-4x5r-pxfx-6jf8),
  [flatted prototype pollution](https://github.com/advisories/GHSA-rf6f-7fwh-wjgh),
  [AJV ReDoS](https://github.com/advisories/GHSA-2g4f-4pwh-qvx6) y
  [js-yaml quadratic CPU](https://github.com/advisories/GHSA-5p4m-2wfm-xmqj).
- [defu 6.1.5](https://github.com/unjs/defu/releases/tag/v6.1.5),
  [Babel 7.26.10](https://github.com/babel/babel/releases/tag/v7.26.10),
  [Lodash 4.18.0](https://github.com/lodash/lodash/releases/tag/4.18.0),
  [Nano ID 3.3.18](https://github.com/ai/nanoid/releases/tag/3.3.18),
  [esbuild 0.25.0](https://github.com/evanw/esbuild/releases/tag/v0.25.0) y
  [esbuild 0.28.1](https://github.com/evanw/esbuild/releases/tag/v0.28.1).
