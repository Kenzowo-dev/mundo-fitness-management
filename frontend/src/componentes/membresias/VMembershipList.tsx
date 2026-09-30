import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import MembershipCard from './MembershipCard'
import {
  getMemberships,
  deleteMembership,
  type Membership,
} from '../../services/membresiaService'
import { STRINGS } from '../../constants/strings'
import '../../styles/membresias/Membresias.css'

function VMembershipList() {
  const [memberships, setMemberships] =
    useState<Membership[]>([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const navigate = useNavigate()

  useEffect(() => {
    let active = true

    // Carga las membresías registradas.
    async function loadMemberships() {
      try {
        const data = await getMemberships()

        if (!active) return

        setMemberships(data)
        setError('')
      } catch {
        if (!active) return

        setError(
          STRINGS.membership.loadError,
        )
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    loadMemberships()

    return () => {
      active = false
    }
  }, [])

  // Confirma y elimina la membresía seleccionada.
  async function handleDelete(id: number) {
    const confirmed = window.confirm(
      STRINGS.membership.deleteConfirmation,
    )

    if (!confirmed) return

    try {
      await deleteMembership(id)

      setMemberships(
        (previousMemberships) =>
          previousMemberships.filter(
            (membership) =>
              membership.id !== id,
          ),
      )
    } catch {
      alert(
        STRINGS.membership.deleteError,
      )
    }
  }

  if (loading) {
    return <p>Cargando membresías...</p>
  }

  if (error) {
    return (
      <p className="error-message">
        {error}
      </p>
    )
  }

  return (
    <div className="lista-membresias">
      {memberships.length === 0 && (
        <p>
          No hay membresías registradas
          todavía.
        </p>
      )}

      {memberships.map((membership) => (
        <MembershipCard
          key={membership.id}
          id={membership.id}
          clientLabel={`Cliente #${membership.client_id}`}
          plan={membership.plan}
          startDate={membership.start_date}
          endDate={membership.end_date}
          price={membership.price}
          status={membership.status}
          onView={(membershipId) =>
            navigate(
              `/membresias/${membershipId}`,
            )
          }
          onEdit={(membershipId) =>
            navigate(
              `/membresias/${membershipId}/editar`,
            )
          }
          onDelete={handleDelete}
        />
      ))}
    </div>
  )
}

export default VMembershipList