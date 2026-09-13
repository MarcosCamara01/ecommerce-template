# Comercio electrónico

Lenguaje compartido para identificar quién actúa sobre los datos y distinguir las acciones de una persona de las operaciones internas de la aplicación.

## Identidad

**Principal**:
Identidad verificada en cuyo nombre se realiza una operación. Puede representar a un usuario o al propio sistema, pero nunca es un identificador aportado sin verificar.
_Evitar_: userId, usuario autenticado

**Principal de sistema**:
Principal no humano que representa una operación interna confiable, como el cumplimiento de un pedido confirmado. No suplanta a un usuario ni convierte una operación de sistema en una operación de propiedad del usuario.
_Evitar_: usuario del sistema, bypass

**Capacidad**:
Permiso de un principal para realizar una clase de acción, independientemente de que sea propietario de los datos afectados.
_Evitar_: rol, ser administrador

## Catálogo

**Identidad de catálogo durable**:
Producto o variante cuya identidad persiste aunque deje de estar disponible para nuevas compras. El archivado la oculta del catálogo público, pero los checkouts y pedidos históricos todavía pueden resolverla; una edición nunca sustituye silenciosamente esa identidad.
_Evitar_: borrar variante, recrear producto histórico

## Pedidos

**Cumplimiento de pedido**:
Proceso que convierte un pago confirmado en un pedido completo y persistido. Repetirlo no crea otro pedido y un fallo nunca reduce silenciosamente lo comprado.
_Evitar_: procesar webhook, completar checkout

**Recibo de evento**:
Registro inmutable de que la aplicación recibió un evento externo. Conserva el historial de recepción, aunque varios eventos conduzcan al mismo cumplimiento de pedido.
_Evitar_: trabajo, pedido

**Trabajo de cumplimiento**:
Obligación durable de convertir una sesión de pago confirmada en un pedido completo. Permanece pendiente hasta completarse o recibir una resolución humana explícita.
_Evitar_: evento, intento

**Efecto de cumplimiento**:
Entrega externa durable e independiente que nace de un trabajo completado. Cada correo al cliente o al comercio conserva su propio estado y reintentos. SMTP se trata honestamente como una frontera de entrega al menos una vez: una caída después de que el servidor acepte el mensaje, pero antes de persistir la finalización, puede producir un reenvío con el mismo `Message-ID`.
_Evitar_: efecto exactamente una vez, lote de correos

## Sincronizacion de catalogo

**Mutacion sincronizada de catalogo**:
Intencion durable que mantiene un producto oculto mientras coordina el catalogo local y
Stripe. Solo se publica cuando Stripe y la finalizacion local quedan confirmados.
_Evitar_: actualizacion best-effort, catalogo parcialmente publicado

**Operacion que requiere atencion**:
Mutacion que agoto reintentos o encontro un error determinista y conserva objetivo,
resultado externo, intentos, error y auditoria hasta una decision autorizada.
_Evitar_: borrar el intento, fallo definitivo sin evidencia
