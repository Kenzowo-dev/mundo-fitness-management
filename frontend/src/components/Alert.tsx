import type { ReactNode } from 'react'
import '@/styles/components/Alert.css'

export type AlertType = 'success' | 'error' | 'warning' | 'info'

interface AlertProps {
  /** Tipo de alerta */
  type: AlertType
  /** Título (opcional) */
  title?: string
  /** Mensaje principal */
  message: ReactNode
  /** Si se puede cerrar */
  dismissible?: boolean
  /** Callback al cerrar */
  onDismiss?: () => void
  /** Texto del botón de cerrar */
  dismissLabel?: string
  /** Clase CSS adicional */
  className?: string
  /** Rol ARIA (assertive para errores, polite para otros) */
  role?: 'alert' | 'status'
}

/**
 * Alert — Componente de alerta/mensaje accesible para errores, éxitos, advertencias e info.
 */
export default function Alert({
  type,
  title,
  message,
  dismissible = false,
  onDismiss,
  dismissLabel = 'Descartar',
  className = '',
  role,
}: AlertProps) {
  const typeClasses = {
    success: 'alert-success',
    error: 'alert-error',
    warning: 'alert-warning',
    info: 'alert-info',
  }

  const alertRole = role || (type === 'error' ? 'alert' : 'status')
  const ariaLive = type === 'error' ? 'assertive' : 'polite'

  const icons: Record<AlertType, ReactNode> = {
    success: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    ),
    error: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <line x1="15" y1="9" x2="9" y2="15" />
        <line x1="9" y1="9" x2="15" y2="15" />
      </svg>
    ),
    warning: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L21.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
    info: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
    ),
  }

  return (
    <div
      className={`alert ${typeClasses[type]} ${className}`}
      role={alertRole}
      aria-live={ariaLive}
      aria-atomic="true"
    >
      <div className="alert-icon" aria-hidden="true">
        {icons[type]}
      </div>
      <div className="alert-content">
        {title && <h4 className="alert-title">{title}</h4>}
        <div className="alert-message">{message}</div>
      </div>
      {dismissible && (
        <button
          type="button"
          className="alert-dismiss"
          onClick={onDismiss}
          aria-label={dismissLabel}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}
    </div>
  )
}