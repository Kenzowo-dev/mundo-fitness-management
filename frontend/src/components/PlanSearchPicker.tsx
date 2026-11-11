import { useMemo, useState } from 'react'
import { Dumbbell } from 'lucide'
import MorphIcon from './MorphIcon'
import SearchPicker from './SearchPicker'
import type { MembershipPlan } from '../types/api'

interface PlanSearchPickerProps {
  /** Prefijo para los ids del campo (ej: "assign" → "assign-plan"). */
  id: string
  label?: string
  /** Planes disponibles (ya cargados en la página). Solo se muestran los activos. */
  plans: MembershipPlan[]
  selectedPlan: MembershipPlan | null
  onSelect: (plan: MembershipPlan | null) => void
  loading?: boolean
  error?: string
}

const normalize = (value: string) => value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

const formatPrice = (price: number | string, currency: string) =>
  new Intl.NumberFormat('es-PE', { style: 'currency', currency }).format(Number(price))

function inclusions(plan: MembershipPlan) {
  return [
    plan.includesClasses && 'Clases',
    plan.includesSauna && 'Sauna',
    plan.includesPersonalTrainer && 'Entrenador',
  ].filter(Boolean).join(', ')
}

/**
 * Buscador de planes de membresía con lupa, con el mismo diseño que el de socios.
 * Los planes son pocos y ya están cargados, así que se filtran en el navegador
 * por nombre (sin importar tildes ni mayúsculas).
 */
export default function PlanSearchPicker({
  id,
  label = 'Plan',
  plans,
  selectedPlan,
  onSelect,
  loading = false,
  error,
}: PlanSearchPickerProps) {
  const [term, setTerm] = useState('')

  const results = useMemo(() => {
    const active = plans.filter((plan) => plan.isActive)
    const query = normalize(term.trim())
    return query ? active.filter((plan) => normalize(plan.name).includes(query)) : active
  }, [plans, term])

  return (
    <SearchPicker<MembershipPlan>
      inputId={`${id}-plan`}
      label={label}
      placeholder="Buscar plan por nombre"
      helperText="Elige de la lista o escribe el nombre del plan para filtrar."
      listHeading="Planes disponibles"
      itemNoun="plan"
      selected={selectedPlan}
      onSelect={onSelect}
      items={results}
      getKey={(plan) => plan.id}
      view={(plan) => {
        const extras = inclusions(plan)
        return {
          avatar: <MorphIcon icon={Dumbbell} size={16} />,
          title: plan.name,
          subtitle: `${formatPrice(plan.price, plan.currency)} · ${plan.durationDays} días`,
          tag: extras ? { text: extras, tone: 'neutral' } : null,
        }
      }}
      term={term}
      onTermChange={setTerm}
      loading={loading}
      emptyText={(t) => (t ? `Ningún plan coincide con “${t}”.` : 'No hay planes activos. Crea uno en la pestaña Planes.')}
      error={error}
    />
  )
}
