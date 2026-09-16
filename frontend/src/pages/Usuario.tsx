import { Link } from 'react-router-dom'
import { cerrarSesion, obtenerUsuarioActual } from '../services/authService'

function Usuario() {
  const usuario = obtenerUsuarioActual()

  function handleCerrarSesion() {
    cerrarSesion()
    window.location.href = '/login'
  }

  if (!usuario) {
    return (
      <div>
        <h1>Sesión no iniciada</h1>
        <Link to="/login">Iniciar sesión</Link>
      </div>
    )
  }

  return (
    <div className="pagina-usuario">
      <header>
        <h1>Mundo Fitness</h1>

        <button type="button" onClick={handleCerrarSesion}>
          Cerrar sesión
        </button>
      </header>

      <main>
        <h2>¡Bienvenido, {usuario.fullName}!</h2>

        <p>
          Has iniciado sesión como usuario Lite.
        </p>

        <section>
          <h3>Mi cuenta</h3>

          <p>
            <strong>Nombre:</strong> {usuario.fullName}
          </p>

          <p>
            <strong>Correo:</strong> {usuario.email}
          </p>

          <p>
            <strong>Teléfono:</strong> {usuario.phone}
          </p>
        </section>

        <section>
          <h3>Mi membresía</h3>

          <p>
            Todavía vamos a conectar aquí la membresía del usuario.
          </p>

          <Link to="/membresias">
            Ver membresías
          </Link>
        </section>
      </main>
    </div>
  )
}

export default Usuario