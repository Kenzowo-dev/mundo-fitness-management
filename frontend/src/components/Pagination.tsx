import '@/styles/components/Pagination.css'

interface PaginationProps {
  /** Página actual (1-based) */
  currentPage: number
  /** Total de páginas */
  totalPages: number
  /** Total de items (opcional) */
  totalItems?: number
  /** Callback al cambiar página */
  onPageChange: (page: number) => void
  /** Deshabilitado (loading) */
  disabled?: boolean
  /** Etiqueta para el componente (aria-label) */
  ariaLabel?: string
}

/**
 * Pagination — Componente de paginación accesible con prev/next y info de página.
 */
export default function Pagination({
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
  disabled = false,
  ariaLabel = 'Paginación de resultados',
}: PaginationProps) {
  if (totalPages <= 1) return null

  return (
    <nav className="pagination" role="navigation" aria-label={ariaLabel}>
      <button
        className="btn btn-secondary btn-sm"
        disabled={disabled || currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        aria-label="Página anterior"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        <span>Anterior</span>
      </button>

      <span className="pagination-info" aria-live="polite">
        {totalItems !== undefined
          ? `Página ${currentPage} de ${totalPages} (${totalItems} total)`
          : `Página ${currentPage} de ${totalPages}`}
      </span>

      <button
        className="btn btn-secondary btn-sm"
        disabled={disabled || currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        aria-label="Página siguiente"
      >
        <span>Siguiente</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
    </nav>
  )
}