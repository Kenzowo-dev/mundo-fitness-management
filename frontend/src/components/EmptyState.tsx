import type { ReactNode } from 'react'
import Button from './Button'
import '@/styles/components/EmptyState.css'

interface EmptyStateProps {
  /** Icono SVG o componente */
  icon?: ReactNode
  /** Título principal */
  title: string
  /** Descripción */
  description?: string
  /** Acción primaria (botón) */
  action?: {
    label: string
    onClick: () => void
    variant?: 'primary' | 'secondary' | 'outline'
  }
  /** Acción secundaria (enlace/texto) */
  secondaryAction?: {
    label: string
    onClick: () => void
  }
  /** Tamaño del estado vacío */
  size?: 'sm' | 'md' | 'lg'
  /** Clase CSS adicional */
  className?: string
}

/**
 * EmptyState — Estado vacío reutilizable con icono, título, descripción y acciones.
 */
export default function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  size = 'md',
  className = '',
}: EmptyStateProps) {
  const sizeClasses = {
    sm: 'empty-state-sm',
    md: 'empty-state-md',
    lg: 'empty-state-lg',
  }

  return (
    <div className={`empty-state ${sizeClasses[size]} ${className}`} role="status" aria-label={title}>
      {icon && <div className="empty-state-icon" aria-hidden="true">{icon}</div>}
      <h3 className="empty-state-title">{title}</h3>
      {description && <p className="empty-state-description">{description}</p>}
      {(action || secondaryAction) && (
        <div className="empty-state-actions">
          {action && (
            <Button variant={action.variant || 'primary'} onClick={action.onClick}>
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button variant="ghost" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}