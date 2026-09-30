import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  getCurrentUser,
  logout,
} from '../services/authService'
import {
  createMembership,
  getMemberships,
  type Membership,
} from '../services/membresiaService'
import { STRINGS } from '../constants/strings'

const PLANS = [
  {
    name: 'Mensual',
    price: 50,
    months: 1,
    description:
      'Acceso al gimnasio durante 1 mes.',
  },
  {
    name: 'Trimestral',
    price: 135,
    months: 3,
    description:
      'Acceso al gimnasio durante 3 meses.',
  },
  {
    name: 'Semestral',
    price: 250,
    months: 6,
    description:
      'Acceso al gimnasio durante 6 meses.',
  },
  {
    name: 'Anual',
    price: 500,
    months: 12,
    description:
      'Acceso al gimnasio durante 12 meses.',
  },
]

function User() {
  const currentUser = getCurrentUser()

  const [membership, setMembership] =
    useState<Membership | null>(null)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    // Carga la membresía asociada al usuario actual.
    async function loadMembership() {
      if (!currentUser) {
        setLoading(false)
        return
      }

      try {
        const memberships =
          await getMemberships()

        const userMembership =
          memberships.find(
            (item) =>
              item.user_id === currentUser.id,
          )

        setMembership(
          userMembership ?? null,
        )
      } catch {
        setMembership(null)
      } finally {
        setLoading(false)
      }
    }

    loadMembership()
  }, [currentUser])

  // Cierra la sesión del usuario actual.
  function handleLogout() {
    logout()
    window.location.href = '/login'
  }

  // Registra la membresía correspondiente al plan seleccionado.
  async function handleChoosePlan(
    planName: string,
    price: number,
    months: number,
  ) {
    if (!currentUser) return

    const confirmed =
      window.confirm(
        STRINGS.user.planConfirmation(
          planName,
          price,
        ),
      )

    if (!confirmed) return

    setSaving(true)

    try {
      const startDate = new Date()

      const endDate = new Date(
        startDate,
      )

      endDate.setMonth(
        endDate.getMonth() + months,
      )

      const newMembership =
        await createMembership({
          userId: currentUser.id,
          clientId: currentUser.id,
          plan: planName,
          startDate: startDate
            .toISOString()
            .slice(0, 10),
          endDate: endDate
            .toISOString()
            .slice(0, 10),
          price,
          status: 'activa',
        })

      setMembership(newMembership)

      alert(
        STRINGS.user.membershipSuccess,
      )
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : STRINGS.user.membershipError,
      )
    } finally {
      setSaving(false)
    }
  }

  if (!currentUser) {
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
          onClick={handleLogout}
        >
          Cerrar sesión
        </button>
      </header>

      <main>
        <section>
          <h2>
            ¡Bienvenido,{' '}
            {currentUser.fullName}!
          </h2>

          <p>
            Has iniciado sesión como usuario
            Lite.
          </p>
        </section>

        <section>
          <h3>Mis datos</h3>

          <p>
            <strong>Nombre:</strong>{' '}
            {currentUser.fullName}
          </p>

          <p>
            <strong>Correo:</strong>{' '}
            {currentUser.email}
          </p>

          <p>
            <strong>Teléfono:</strong>{' '}
            {currentUser.phone}
          </p>

          <p>
            <strong>
              Fecha de nacimiento:
            </strong>{' '}
            {currentUser.birthDate}
          </p>
        </section>

        <section>
          <h3>Mi membresía</h3>

          {loading ? (
            <p>
              Cargando información...
            </p>
          ) : membership ? (
            <div>
              <p>
                <strong>Plan:</strong>{' '}
                {membership.plan}
              </p>

              <p>
                <strong>
                  Fecha de inicio:
                </strong>{' '}
                {membership.start_date}
              </p>

              <p>
                <strong>
                  Fecha de vencimiento:
                </strong>{' '}
                {membership.end_date}
              </p>

              <p>
                <strong>Precio:</strong>{' '}
                S/ {membership.price}
              </p>

              <p>
                <strong>Estado:</strong>{' '}
                {membership.status}
              </p>
            </div>
          ) : (
            <div>
              <p>
                Actualmente no tienes una
                membresía activa.
              </p>

              <p>
                Elige uno de nuestros planes
                para comenzar.
              </p>
            </div>
          )}
        </section>

        {!membership && (
          <section>
            <h3>
              Planes disponibles
            </h3>

            <div>
              {PLANS.map((plan) => (
                <article
                  key={plan.name}
                >
                  <h4>
                    {plan.name}
                  </h4>

                  <p>
                    {plan.description}
                  </p>

                  <p>
                    <strong>
                      S/ {plan.price}
                    </strong>
                  </p>

                  <button
                    type="button"
                    disabled={saving}
                    onClick={() =>
                      handleChoosePlan(
                        plan.name,
                        plan.price,
                        plan.months,
                      )
                    }
                  >
                    {saving
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

export default User