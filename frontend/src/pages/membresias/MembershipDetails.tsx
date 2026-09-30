import { useEffect, useState } from 'react'
import {
  Link,
  useNavigate,
  useParams,
} from 'react-router-dom'
import {
  getMembershipById,
  deleteMembership,
  type Membership,
} from '../../services/membresiaService'
import { STRINGS } from '../../constants/strings'

function MembershipDetails() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [membership, setMembership] =
    useState<Membership | null>(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    // Carga la membresía seleccionada.
    async function loadMembership() {
      try {
        const data =
          await getMembershipById(
            Number(id),
          )

        setMembership(data)
      } catch {
        setError(
          STRINGS.membership.loadOneError,
        )
      } finally {
        setLoading(false)
      }
    }

    loadMembership()
  }, [id])

  // Confirma y elimina la membresía seleccionada.
  async function handleDelete() {
    const confirmed =
      window.confirm(
        STRINGS.membership.deleteConfirmation,
      )

    if (!confirmed) return

    try {
      await deleteMembership(
        Number(id),
      )

      navigate('/membresias')
    } catch {
      alert(
        STRINGS.membership.deleteError,
      )
    }
  }

  if (loading) {
    return <p>Cargando...</p>
  }

  if (error) {
    return (
      <p className="error-message">
        {error}
      </p>
    )
  }

  if (!membership) {
    return null
  }

  return (
    <div className="pagina-detalle-membresia">
      <h1>Detalle de membresía</h1>

      <ul className="detalle-lista">
        <li>
          <strong>ID:</strong>{' '}
          {membership.id}
        </li>

        <li>
          <strong>Cliente:</strong>{' '}
          #{membership.client_id}
        </li>

        <li>
          <strong>Plan:</strong>{' '}
          {membership.plan}
        </li>

        <li>
          <strong>Inicio:</strong>{' '}
          {membership.start_date}
        </li>

        <li>
          <strong>Fin:</strong>{' '}
          {membership.end_date}
        </li>

        <li>
          <strong>Precio:</strong>{' '}
          S/ {membership.price}
        </li>

        <li>
          <strong>Estado:</strong>{' '}
          {membership.status}
        </li>
      </ul>

      <div className="detalle-acciones">
        <Link
          to={`/membresias/${membership.id}/editar`}
        >
          Editar
        </Link>

        <button
          type="button"
          onClick={handleDelete}
          className="btn-eliminar"
        >
          Eliminar
        </button>

        <Link to="/membresias">
          Volver
        </Link>
      </div>
    </div>
  )
}

export default MembershipDetails