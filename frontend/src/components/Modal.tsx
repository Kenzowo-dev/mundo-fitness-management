import type { ReactNode } from 'react'
import { useEffect, useCallback } from 'react'
import Button from './Button'
import '@/styles/components/Modal.css'

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full'

interface ModalProps {
  /** Si el modal está abierto */
  open: boolean
  /** Callback al cerrar */
  onClose: () => void
  /** Título del modal */
  title: string
  /** Contenido del modal */
  children: ReactNode
  /** Tamaño del modal */
  size?: ModalSize
  /** Mostrar botón de cerrar en header */
  showCloseButton?: boolean
  /** Texto del botón de cerrar (aria-label) */
  closeLabel?: string
  /** Contenido del footer (botones de acción) */
  footer?: ReactNode
  /** Si se puede cerrar con Escape */
  closeOnEscape?: boolean
  /** Si se puede cerrar clickeando el overlay */
  closeOnOverlayClick?: boolean
  /** Clase CSS adicional */
  className?: string
}

/**
 * Modal — Componente de modal accesible con focus trap, Escape, overlay click.
 * Usa portal nativo (se renderiza al final de body).
 */
export default function Modal({
  open,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
  closeLabel = 'Cerrar',
  footer,
  closeOnEscape = true,
  closeOnOverlayClick = true,
  className = '',
}: ModalProps) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!closeOnEscape) return
    if (e.key === 'Escape') onClose()
  }, [closeOnEscape, onClose])

  useEffect(() => {
    if (!open) return
    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [open, closeOnEscape, handleKeyDown])

  if (!open) return null

  const modalClasses = [
    'modal',
    `modal-${size}`,
    className,
  ].filter(Boolean).join(' ')

  return (
    <div className="modal-overlay" onClick={closeOnOverlayClick ? onClose : undefined} aria-hidden="true" data-testid="modal-overlay">
      <div
        className={modalClasses}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2 id="modal-title" className="modal-title">{title}</h2>
          {showCloseButton && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              aria-label={closeLabel}
              className="modal-close"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </Button>
          )}
        </div>

        <div className="modal-body">
          {children}
        </div>

        {footer && (
          <div className="modal-footer">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}