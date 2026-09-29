import type { CSSProperties } from 'react'
import '@/styles/components/Skeleton.css'

interface SkeletonProps {
  /** Ancho del skeleton (px, %, rem, etc). */
  width?: string | number
  /** Alto del skeleton. */
  height?: string | number
  /** Si se trata de un círculo (avatar/ícono). */
  circle?: boolean
  /** Clase CSS adicional. */
  className?: string
  /** Estilos en línea adicionales. */
  style?: CSSProperties
  /** Texto alternativo accesible descriptivo del placeholder. */
  ariaLabel?: string
}

/*
 * Skeleton — Indicador visual de carga con animación pulsante.
 * Se usa durante el fetch de datos para mantener la estructura del
 * layout y comunicar estado ocupado (aria-busy) al usuario. (WCAG 1.4.13)
 */
export default function Skeleton({
  width = '100%',
  height = '16px',
  circle = false,
  className = '',
  style,
  ariaLabel = 'Cargando contenido',
}: SkeletonProps) {
  const styles: CSSProperties = {
    width,
    height,
    borderRadius: circle ? '50%' : '6px',
    ...style,
  }

  return (
    <div
      className={`skeleton ${className}`}
      style={styles}
      aria-label={ariaLabel}
      aria-roledescription="cargando"
    />
  )
}
