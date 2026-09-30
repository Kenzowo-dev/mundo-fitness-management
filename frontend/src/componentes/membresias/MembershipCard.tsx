import '../../styles/membresias/MembershipCard.css'

interface MembershipCardProps {
  id: number
  clientLabel: string
  plan: string
  startDate: string
  endDate: string
  price: number
  status: string
  onView: (id: number) => void
  onEdit: (id: number) => void
  onDelete: (id: number) => void
}

function MembershipCard({
  id,
  clientLabel,
  plan,
  startDate,
  endDate,
  price,
  status,
  onView,
  onEdit,
  onDelete,
}: MembershipCardProps) {
  return (
    <div className={`tarjeta-membresia estado-${status}`}>
      <div className="tarjeta-membresia-header">
        <h3>{plan}</h3>
        <span className="tarjeta-membresia-status">
          {status}
        </span>
      </div>

      <div className="tarjeta-membresia-body">
        <p>
          <strong>Cliente:</strong> {clientLabel}
        </p>

        <p>
          <strong>Inicio:</strong> {startDate}
        </p>

        <p>
          <strong>Fin:</strong> {endDate}
        </p>

        <p>
          <strong>Precio:</strong> S/ {price}
        </p>
      </div>

      <div className="tarjeta-membresia-actions">
        <button
          type="button"
          className="btn-ver"
          onClick={() => onView(id)}
        >
          Ver
        </button>

        <button
          type="button"
          className="btn-editar"
          onClick={() => onEdit(id)}
        >
          Editar
        </button>

        <button
          type="button"
          className="btn-eliminar"
          onClick={() => onDelete(id)}
        >
          Eliminar
        </button>
      </div>
    </div>
  )
}

export default MembershipCard