import { useEffect, useState } from 'react'
import '../../styles/membresias/FormularioMembresia.css'

export interface MembresiaFormData {
  clientId: string
  plan: string
  startDate: string
  endDate: string
  price: string
  status: string
}

interface FormularioMembresiaProps {
  initialData?: Partial<MembresiaFormData>
  onSubmit: (data: MembresiaFormData) => void
  submitLabel?: string
}

const PLANES = ['Mensual', 'Trimestral', 'Semestral', 'Anual']
const ESTADOS = ['activa', 'vencida', 'cancelada']

function FormularioMembresia({
  initialData,
  onSubmit,
  submitLabel = 'Guardar',
}: FormularioMembresiaProps) {
  const [clientId, setClientId] = useState(initialData?.clientId ?? '')
  const [plan, setPlan] = useState(initialData?.plan ?? PLANES[0])
  const [startDate, setStartDate] = useState(initialData?.startDate ?? '')
  const [endDate, setEndDate] = useState(initialData?.endDate ?? '')
  const [price, setPrice] = useState(initialData?.price ?? '')
  const [status, setStatus] = useState(initialData?.status ?? ESTADOS[0])

  // Si initialData llega después (ej. cargando datos desde la API), rellena el formulario
  useEffect(() => {
    if (!initialData) return

    setClientId(initialData.clientId ?? '')
    setPlan(initialData.plan ?? PLANES[0])
    setStartDate(initialData.startDate ?? '')
    setEndDate(initialData.endDate ?? '')
    setPrice(initialData.price ?? '')
    setStatus(initialData.status ?? ESTADOS[0])
  }, [initialData])

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    onSubmit({ clientId, plan, startDate, endDate, price, status })
  }

  return (
    <form className="formulario-membresia" onSubmit={handleSubmit}>
      <label>
        ID del cliente
        <input
          type="number"
          min="1"
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
          required
        />
      </label>

      <label>
        Plan
        <select value={plan} onChange={(e) => setPlan(e.target.value)}>
          {PLANES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </label>

      <label>
        Fecha de inicio
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          required
        />
      </label>

      <label>
        Fecha de fin
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          required
        />
      </label>

      <label>
        Precio (S/)
        <input
          type="number"
          step="0.01"
          min="0"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          required
        />
      </label>

      <label>
        Estado
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          {ESTADOS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>

      <button type="submit">{submitLabel}</button>
    </form>
  )
}

export default FormularioMembresia
