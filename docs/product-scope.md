# Alcance funcional local: Mundo Fitness

## Objetivo

Gestionar socios y la vigencia de sus membresías en Mundo Fitness. Los dos grupos de uso principales son recepción y socios que acceden por la web. El administrador mantiene la configuración y las cuentas internas.

## Flujos principales

## Acceso mediante API Gateway

El frontend usa el Gateway en `http://localhost:3000` como único punto de entrada a la API. Los namespaces activos son:

| Namespace | Servicio | Uso |
|---|---|---|
| `/api/auth/*` | auth-service | Sesión, cuenta y roles |
| `/api/clients/*` | client-service | Socios y perfil propio |
| `/api/memberships/*` | membership-service | Planes, membresías, renovaciones y asistencia |
| `/api/payments/*` | payment-service | Pagos, facturas e historial |

Los planes se consultan bajo `/api/memberships/plans`; los informes operativos viven en `/api/clients/reports`, `/api/memberships/reports` y `/api/payments/reports`. El MVP no publica servicios o namespaces separados `/api/plans/*` ni `/api/reports/*`.

### Recepción

1. Iniciar sesión en el área de trabajo.
2. Buscar un socio por documento, nombre o correo; revisar sus datos y su membresía vigente o vencida.
3. Registrar al socio si aún no existe, evitando duplicarlo.
4. Asignar un plan, registrar renovación/cancelación y anotar el pago recibido con método y referencia cuando corresponda.
5. Consultar la vigencia antes de admitir el ingreso y registrar check-in cuando se use esa función.

### Socio

1. Crear una cuenta o iniciar sesión.
2. Consultar y corregir sus datos permitidos.
3. Ver únicamente sus propias membresías, vigencia y pagos.
4. Consultar los planes disponibles y solicitar información o renovación.

En el alcance local propuesto, una solicitud web no activa una membresía ni marca un pago como recibido. Recepción confirma la operación. La activación automática requiere integrar y verificar un proveedor de pagos; el proyecto no debe fingir ese proceso.

### Administrador

Gestionar planes y cuentas internas, y resolver tareas de configuración. Mantener el acceso administrativo separado de las tareas cotidianas de recepción.

## Matriz de acceso propuesta

| Acción | Socio | Recepción | Administrador |
|---|---:|---:|---:|
| Consultar/editar su propio perfil | Sí | Sí, para atención | Sí |
| Consultar otros socios | No | Sí | Sí |
| Crear/editar perfiles de socios | No | Sí | Sí |
| Ver membresías propias | Sí | Sí | Sí |
| Asignar, renovar o cancelar membresía | Solicitar | Sí | Sí |
| Registrar/confirmar pago manual | No | Sí | Sí |
| Ver pagos propios | Sí | Sí, para atención | Sí |
| Gestionar planes | No | Consultar | Sí |
| Administrar cuentas y permisos internos | No | No | Sí |
| Entrenamientos, ejercicios y analítica avanzada | Fuera del MVP | Fuera del MVP | Fuera del MVP |

Los controles de API deben aplicar esta matriz además de ocultar enlaces en la interfaz. El socio debe quedar limitado por propiedad del recurso en cada lectura y escritura.

## Incluido en el MVP local

- Inicio de sesión, registro de socios y recuperación de cuenta.
- Perfiles de socios, planes, asignación y ciclo de vida de membresías.
- Registro e historial de pagos manuales con estados explícitos.
- Consulta web privada del socio y comprobación de vigencia para recepción.
- Panel operativo pequeño que priorice búsqueda, vencimientos y tareas frecuentes.
- Informes operativos predeterminados de socios, estados de membresía, asistencia e ingresos por periodo fijo; los ingresos conservan su moneda.
- Datos semilla reproducibles para probar localmente, con credenciales documentadas como solo locales.

## Fuera del MVP local

- Cobros reales con tarjeta, renovaciones automáticas, facturación fiscal o conciliación bancaria.
- Rutinas, ejercicios, entrenador personal y gestión de entrenamiento.
- Constructor de reportes configurables o ejecución de SQL arbitrario desde la aplicación.
- Despliegue público, multi-sucursal y funciones que no apoyen la gestión de membresías.

Estos módulos existentes se deben retirar del recorrido principal o dejar fuera del producto ejecutable durante la fase de implementación; no se deben borrar datos o código sin revisar dependencias y migraciones.

## Hallazgos que condicionan la implementación

- La ruta `/` muestra la portada pública. El panel de recepción queda bajo `/dashboard` y el portal de socios bajo `/portal`; el login redirige según el rol.
- El menú y las rutas ahora muestran la operación de membresías a recepción y configuración solo a administración. Los módulos de entrenamiento e informes quedan fuera del recorrido de la aplicación.
- Las APIs tienen verificaciones de propiedad en algunos recursos, pero la autorización se repite por servicio y usa roles/permisos que deben verificarse endpoint por endpoint. No asumir que ocultar una pantalla protege los datos.
- El servicio de planes incluye entrenamiento y el servicio de reportes incluye consultas/widgets; ambos exceden el objetivo de membresías y deben evaluarse para retirarlos del MVP.
- La cuenta seed `admin@mundofitness.com` es una cuenta de demostración local. La documentación debe advertir que la inicialización puede restablecer sus credenciales.
- Se corrigieron los chequeos de propiedad para relacionar membresías y pagos con el socio propietario; se añadió un endpoint de historial de pagos asociado al socio autenticado.

## Criterios de aceptación del alcance

- Recepción puede completar búsqueda/alta, asignación o renovación, registro de pago manual y consulta de vigencia sin navegar por módulos ajenos.
- Un socio puede iniciar sesión desde la web y consultar solo su información, sin acceder a herramientas de recepción.
- Una llamada API con identidad de socio no puede leer o modificar datos de otro socio ni confirmar pagos.
- La vigencia se determina por reglas consistentes de estado y fechas, en backend y frontend.
- Los mensajes y acciones muestran claramente cuándo una renovación está solicitada, pendiente de recepción o confirmada.
