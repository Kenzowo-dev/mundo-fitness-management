import '../../styles/membresias/TarjetaMembresia.css'

interface TarjetaMembresiaProps {
  id: number
  clientLabel: string
  plan: string
  startDate: string
  endDate: string
  status: string
  onVerDetalle: (id: number) => void
  onEditar: (id: number) => void
  onEliminar: (id: number) => void
}

function TarjetaMembresia({
  id,
  clientLabel,
  plan,
  startDate,
  endDate,
  status,
  onVerDetalle,
  onEditar,
  onEliminar,
}: TarjetaMembresiaProps) {
  return (
    <div className={`tarjeta-membresia estado-${status}`}>
      <div className="tarjeta-header">
        <h3>{clientLabel}</h3>
        <span className={`badge badge-${status}`}>{status}</span>
      </div>

      <p className="tarjeta-plan">Plan: {plan}</p>
      <p className="tarjeta-fechas">
        {startDate} — {endDate}
      </p>

      <div className="tarjeta-acciones">
        <button type="button" onClick={() => onVerDetalle(id)}>
          Ver detalle
        </button>
        <button type="button" onClick={() => onEditar(id)}>
          Editar
        </button>
        <button type="button" className="btn-eliminar" onClick={() => onEliminar(id)}>
          Eliminar
        </button>
      </div>
    </div>
  )
}

export default TarjetaMembresia
