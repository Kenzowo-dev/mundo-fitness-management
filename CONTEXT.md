# Mundo Fitness: lenguaje del dominio

Este archivo fija el significado de los términos del producto. Los flujos y límites funcionales están en [`docs/product-scope.md`](docs/product-scope.md).

## Términos

- **Usuario**: cuenta de autenticación con correo, credenciales y rol. Puede iniciar sesión en el sistema.
- **Socio**: persona que recibe los servicios del gimnasio. En el sistema actual, su perfil operativo es un registro `Client` asociado a una cuenta `User`; no son conceptos intercambiables.
- **Plan**: oferta reusable del gimnasio con precio, duración y condiciones.
- **Membresía**: relación de un socio con un plan durante un periodo, con estado y fechas propios.
- **Pago**: registro de cobro asociado al socio o a una membresía. Registrar un pago manual no equivale a confirmar un pago electrónico.
- **Recepción**: empleado que atiende operaciones diarias de socios, membresías y cobros.
- **Administrador**: empleado con permisos de configuración y gestión de cuentas internas; no es un tercer usuario objetivo del producto.

## Límites del lenguaje

- La interfaz debe decir **Socios** cuando hable de personas del gimnasio y **Usuarios** cuando hable de cuentas y acceso.
- **Activo** describe el estado de una membresía; la vigencia se calcula también con sus fechas. No se debe inferir vigencia solo de la etiqueta de estado.
- **Renovación solicitada** y **renovación confirmada** son estados distintos. La confirmación requiere una operación de recepción o un proveedor de pago integrado.
