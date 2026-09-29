import type { ButtonHTMLAttributes, ReactNode } from 'react'
import '@/styles/components/Button.css'

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline'
export type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Variante visual del botón */
  variant?: ButtonVariant
  /** Tamaño del botón */
  size?: ButtonSize
  /** Si el botón está en estado de carga */
  loading?: boolean
  /** Contenido personalizado del botón */
  children: ReactNode
  /** Deshabilitar el botón */
  disabled?: boolean
}

/**
 * Button — Componente de botón unificado con variantes y tamaños.
 * Centraliza estilos y comportamiento (loading, disabled, focus-visible).
 */
export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  children,
  className = '',
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading

  const classNames = [
    'btn',
    `btn-${variant}`,
    `btn-${size}`,
    loading ? 'btn-loading' : '',
    isDisabled ? 'btn-disabled' : '',
    className,
  ].filter(Boolean).join(' ')

  return (
    <button
      className={classNames}
      disabled={isDisabled}
      aria-busy={loading}
      aria-disabled={isDisabled}
      {...props}
    >
      {loading && <span className="btn-spinner" aria-hidden="true" />}
      <span className="btn-content">{children}</span>
    </button>
  )
}