import type { ReactNode } from 'react'
import '@/styles/components/StatusBadge.css'

export type StatusType =
  | 'active'
  | 'inactive'
  | 'suspended'
  | 'completed'
  | 'paid'
  | 'pending'
  | 'failed'
  | 'cancelled'
  | 'refunded'
  | 'beginner'
  | 'intermediate'
  | 'advanced'

interface StatusBadgeProps {
  /** Estado interno que determina el color del badge. */
  status: string
  /** Texto legible mostrado en el badge. */
  label?: string
  /** Icono opcional (no decorativo). */
  icon?: ReactNode
  /** Si el badge debe estar deshabilitado visualmente. */
  disabled?: boolean
  /** Clase CSS adicional. */
  className?: string
}

/*
 * StatusBadge — Componente reutilizable de estados.
 * Centraliza colores y contraste (WCAG AA) para status de clientes,
 * pagos, membresías y dificultad de planes. Evita la duplicación de
 * .status-badge/.difficulty-badge en cada hoja de estilos. (WCAG 1.4.3)
 */
export default function StatusBadge({ status, label, icon, disabled, className }: StatusBadgeProps) {
  const normalized = status.toLowerCase().replace(/\s+/g, '-')
  const classes = [
    'status-badge',
    `status-${normalized}`,
    disabled ? 'disabled' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ')

  const displayLabel = label ?? status
  // Traducción legible de estados comunes (normaliza el texto del badge)
  const readableLabels: Record<string, string> = {
    active: 'Activo',
    inactive: 'Inactivo',
    suspended: 'Suspendido',
    completed: 'Completado',
    paid: 'Pagado',
    pending: 'Pendiente',
    failed: 'Fallido',
    cancelled: 'Cancelado',
    refunded: 'Reembolsado',
    beginner: 'Principiante',
    intermediate: 'Intermedio',
    advanced: 'Avanzado',
  }
  const text = readableLabels[displayLabel.toLowerCase()] ?? displayLabel

  return (
    <span className={classes} role="status" aria-label={`Estado: ${text}`}>
      {icon}
      {text}
    </span>
  )
}
