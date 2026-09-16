import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  cerrarSesion,
  obtenerUsuarioActual,
} from '../services/authService'
import {
  createMembresia,
  getMembresias,
  type Membresia,
} from '../services/membresiaService'

const PLANES = [
  {
    nombre: 'Mensual',
    precio: 50,
    meses: 1,
    descripcion: 'Acceso al gimnasio durante 1 mes.',
  },
  {
    nombre: 'Trimestral',
    precio: 135,
    meses: 3,
    descripcion: 'Acceso al gimnasio durante 3 meses.',
  },
  {
    nombre: 'Semestral',
    precio: 250,
    meses: 6,
    descripcion: 'Acceso al gimnasio durante 6 meses.',
  },
  {
    nombre: 'Anual',
    precio: 500,
    meses: 12,
    descripcion: 'Acceso al gimnasio durante 12 meses.',
  },
]

function Usuario() {
  const usuario = obtenerUsuarioActual()

  const [membresia, setMembresia] = useState<Membresia | null>(null)
  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    async function cargarMembresia() {
      if (!usuario) {
        setLoading(false)
        return
      }

      try {
        const membresias = await getMembresias()

        const propia = membresias.find(
          (item) => item.user_id === usuario.id,
        )

        setMembresia(propia ?? null)
      } catch {
        setMembresia(null)
      } finally {
        setLoading(false)
      }
    }

    cargarMembresia()
  }, [usuario])

  function handleCerrarSesion() {
    cerrarSesion()
    window.location.href = '/login'
  }

  async function handleElegirPlan(
    planNombre: string,
    precio: number,
    meses: number,
  ) {
    if (!usuario) return

    const confirmar = window.confirm(
      `¿Deseas seleccionar el plan ${planNombre} por S/ ${precio}?`,
    )

    if (!confirmar) return

    setGuardando(true)

    try {
      const fechaInicio = new Date()

      const fechaFin = new Date(fechaInicio)
      fechaFin.setMonth(fechaFin.getMonth() + meses)

      const nuevaMembresia = await createMembresia({
        userId: usuario.id,
        clientId: usuario.id,
        plan: planNombre,
        startDate: fechaInicio.toISOString().slice(0, 10),
        endDate: fechaFin.toISOString().slice(0, 10),
        price: precio,
        status: 'activa',
      })

      setMembresia(nuevaMembresia)

      alert('Membresía registrada correctamente')
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : 'No se pudo registrar la membresía',
      )
    } finally {
      setGuardando(false)
    }
  }

  if (!usuario) {
    return (
      <div className="pagina-usuario">
        <h1>Sesión no iniciada</h1>

        <Link to="/login">
          Iniciar sesión
        </Link>
      </div>
    )
  }

  return (
    <div className="pagina-usuario">
      <header>
        <div>
          <h1>Mundo Fitness</h1>
          <p>Mi cuenta</p>
        </div>

        <button
          type="button"
          onClick={handleCerrarSesion}
        >
          Cerrar sesión
        </button>
      </header>

      <main>
        <section>
          <h2>¡Bienvenido, {usuario.fullName}!</h2>

          <p>
            Has iniciado sesión como usuario Lite.
          </p>
        </section>

        <section>
          <h3>Mis datos</h3>

          <p>
            <strong>Nombre:</strong> {usuario.fullName}
          </p>

          <p>
            <strong>Correo:</strong> {usuario.email}
          </p>

          <p>
            <strong>Teléfono:</strong> {usuario.phone}
          </p>

          <p>
            <strong>Fecha de nacimiento:</strong>{' '}
            {usuario.birthDate}
          </p>
        </section>

        <section>
          <h3>Mi membresía</h3>

          {loading ? (
            <p>Cargando información...</p>
          ) : membresia ? (
            <div>
              <p>
                <strong>Plan:</strong> {membresia.plan}
              </p>

              <p>
                <strong>Fecha de inicio:</strong>{' '}
                {membresia.start_date}
              </p>

              <p>
                <strong>Fecha de vencimiento:</strong>{' '}
                {membresia.end_date}
              </p>

              <p>
                <strong>Precio:</strong> S/ {membresia.price}
              </p>

              <p>
                <strong>Estado:</strong> {membresia.status}
              </p>
            </div>
          ) : (
            <div>
              <p>
                Actualmente no tienes una membresía activa.
              </p>

              <p>
                Elige uno de nuestros planes para comenzar.
              </p>
            </div>
          )}
        </section>

        {!membresia && (
          <section>
            <h3>Planes disponibles</h3>

            <div>
              {PLANES.map((plan) => (
                <article key={plan.nombre}>
                  <h4>{plan.nombre}</h4>

                  <p>{plan.descripcion}</p>

                  <p>
                    <strong>S/ {plan.precio}</strong>
                  </p>

                  <button
                    type="button"
                    disabled={guardando}
                    onClick={() =>
                      handleElegirPlan(
                        plan.nombre,
                        plan.precio,
                        plan.meses,
                      )
                    }
                  >
                    {guardando
                      ? 'Registrando...'
                      : 'Elegir plan'}
                  </button>
                </article>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}

export default Usuario
