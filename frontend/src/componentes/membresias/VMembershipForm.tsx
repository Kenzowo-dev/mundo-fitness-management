import { useState } from 'react'
import '../../styles/membresias/VMembershipForm.css'
import {
  getUsersForAdmin,
  type User,
} from '../../services/authService'
import { getActivePlans } from '../../services/planService'
import { STRINGS } from '../../constants/strings'

export interface MembershipFormData {
  userId: string
  clientId: string
  plan: string
  startDate: string
  endDate: string
  price: string
  status: string
}

interface MembershipFormProps {
  initialData?: Partial<MembershipFormData>
  onSubmit: (data: MembershipFormData) => void
  submitLabel?: string
}

interface Plan {
  id: number
  codigo: string
  nombre: string
  duracion: number
  unidadDuracion: 'dias' | 'meses'
  precio: number
  activo: boolean
}

const MEMBERSHIP_STATUSES = [
  'activa',
  'vencida',
  'cancelada',
]

function calculateEndDate(
  startDate: string,
  plan: Plan | undefined,
) {
  if (!startDate || !plan) {
    return ''
  }

  const date = new Date(
    `${startDate}T00:00:00`,
  )

  if (plan.unidadDuracion === 'dias') {
    date.setDate(
      date.getDate() + plan.duracion,
    )
  } else {
    date.setMonth(
      date.getMonth() + plan.duracion,
    )
  }

  return date
    .toISOString()
    .slice(0, 10)
}

function VMembershipForm({
  initialData,
  onSubmit,
  submitLabel = 'Guardar',
}: MembershipFormProps) {
  const [users] = useState<User[]>(() =>
    getUsersForAdmin(),
  )

  const [plans] = useState<Plan[]>(() =>
    getActivePlans(),
  )

  const [userId, setUserId] = useState(
    initialData?.userId ?? '',
  )

  const [clientId, setClientId] = useState(
    initialData?.clientId ?? '',
  )

  const [plan, setPlan] = useState(
    initialData?.plan ?? '',
  )

  const [startDate, setStartDate] = useState(
    initialData?.startDate ?? '',
  )

  const [status, setStatus] = useState(
    initialData?.status ?? MEMBERSHIP_STATUSES[0],
  )

  const selectedPlan = plans.find(
    (item) => item.nombre === plan,
  )

  const endDate = calculateEndDate(
    startDate,
    selectedPlan,
  )

  const price = selectedPlan
    ? String(selectedPlan.precio)
    : ''

  // Valida los datos y registra la membresía.
  function handleSubmit(
    event: React.FormEvent,
  ) {
    event.preventDefault()

    if (!selectedPlan) {
      alert(STRINGS.membership.invalidPlan)
      return
    }

    if (!endDate) {
      alert(
        STRINGS.membership.calculateEndDateError,
      )
      return
    }

    onSubmit({
      userId,
      clientId,
      plan: selectedPlan.nombre,
      startDate,
      endDate,
      price,
      status,
    })
  }

  return (
    <form
      className="formulario-membresia"
      onSubmit={handleSubmit}
    >
      <label>
        Usuario

        <select
          value={userId}
          onChange={(event) =>
            setUserId(event.target.value)
          }
          required
        >
          <option value="">
            Selecciona un usuario
          </option>

          {users
            .filter(
              (user) => user.role === 'lite',
            )
            .map((user) => (
              <option
                key={user.id}
                value={user.id}
              >
                {user.fullName} - {user.email}
              </option>
            ))}
        </select>
      </label>

      <label>
        ID del cliente

        <input
          type="number"
          min="1"
          value={clientId}
          onChange={(event) =>
            setClientId(event.target.value)
          }
          required
        />
      </label>

      <label>
        Plan

        <select
          value={plan}
          onChange={(event) =>
            setPlan(event.target.value)
          }
          required
        >
          <option value="">
            Selecciona un plan
          </option>

          {plans.map((item) => (
            <option
              key={item.id}
              value={item.nombre}
            >
              {item.nombre} - S/{' '}
              {Number(item.precio).toFixed(2)}
            </option>
          ))}
        </select>
      </label>

      {selectedPlan && (
        <div className="membresia-plan-info">
          <p>
            <strong>Duración:</strong>{' '}
            {selectedPlan.duracion}{' '}
            {selectedPlan.unidadDuracion ===
            'dias'
              ? selectedPlan.duracion === 1
                ? 'día'
                : 'días'
              : selectedPlan.duracion === 1
                ? 'mes'
                : 'meses'}
          </p>

          <p>
            <strong>Precio:</strong>{' '}
            S/{' '}
            {Number(
              selectedPlan.precio,
            ).toFixed(2)}
          </p>
        </div>
      )}

      <label>
        Fecha de inicio

        <input
          type="date"
          value={startDate}
          onChange={(event) =>
            setStartDate(event.target.value)
          }
          required
        />
      </label>

      <label>
        Fecha de fin

        <input
          type="date"
          value={endDate}
          readOnly
        />
      </label>

      <label>
        Estado

        <select
          value={status}
          onChange={(event) =>
            setStatus(event.target.value)
          }
        >
          {MEMBERSHIP_STATUSES.map(
            (statusValue) => (
              <option
                key={statusValue}
                value={statusValue}
              >
                {statusValue}
              </option>
            ),
          )}
        </select>
      </label>

      <button type="submit">
        {submitLabel}
      </button>
    </form>
  )
}

export default VMembershipForm