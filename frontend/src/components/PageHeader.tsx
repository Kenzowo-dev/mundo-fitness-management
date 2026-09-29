import type { ReactNode } from 'react'
import Button from './Button'
import '@/styles/components/PageHeader.css'

interface PageHeaderProps {
  /** Título principal de la página */
  title: string
  /** Descripción/subtítulo opcional */
  description?: string
  /** Acciones principales (botones) */
  actions?: Array<{
    label: string
    onClick: () => void
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
    icon?: ReactNode
    ariaLabel?: string
  }>
  /** Clase CSS adicional */
  className?: string
}

/**
 * PageHeader — Cabecera de página consistente con título, descripción y acciones.
 */
export default function PageHeader({
  title,
  description,
  actions,
  className = '',
}: PageHeaderProps) {
  return (
    <header className={`page-header ${className}`}>
      <div className="page-header-content">
        <h1 className="page-header-title">{title}</h1>
        {description && <p className="page-header-description">{description}</p>}
      </div>
      {actions && actions.length > 0 && (
        <div className="page-header-actions" role="group" aria-label="Acciones de página">
          {actions.map((action, index) => (
            <Button
              key={index}
              variant={action.variant || 'primary'}
              onClick={action.onClick}
              aria-label={action.ariaLabel}
            >
              {action.icon}
              {action.label}
            </Button>
          ))}
        </div>
      )}
    </header>
  )
}