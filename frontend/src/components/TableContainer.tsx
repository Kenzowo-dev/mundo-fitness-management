import type { ReactNode, HTMLAttributes } from 'react'
import EmptyState from './EmptyState'
import '@/styles/components/TableContainer.css'

interface Column<T> {
  key: string
  header: string
  render?: (row: T, index: number) => ReactNode
  className?: string
}

interface TableContainerProps<T> extends HTMLAttributes<HTMLDivElement> {
  /** Datos a mostrar */
  data: T[]
  /** Definición de columnas */
  columns: Column<T>[]
  /** Clave única por fila */
  rowKey: keyof T | ((row: T) => string)
  /** Estado de carga */
  loading?: boolean
  /** Número de filas skeleton durante carga */
  skeletonRows?: number
  /** Estado vacío personalizado */
  emptyState?: {
    icon?: ReactNode
    title: string
    description?: string
    action?: {
      label: string
      onClick: () => void
      variant?: 'primary' | 'secondary' | 'outline'
    }
  }
  /** Callback al click en fila */
  onRowClick?: (row: T) => void
  /** Clase CSS para la tabla */
  tableClassName?: string
  /** Clase CSS para el tbody */
  tbodyClassName?: string
}

/**
 * TableContainer — Contenedor de tabla responsive con loading, empty state y accesibilidad.
 */
export default function TableContainer<T>({
  data,
  columns,
  rowKey,
  loading = false,
  skeletonRows = 5,
  emptyState,
  onRowClick,
  tableClassName = '',
  tbodyClassName = '',
  ...props
}: TableContainerProps<T>) {
  const getRowKey = (row: T) => (typeof rowKey === 'function' ? rowKey(row) : String(row[rowKey as keyof T]))

  if (loading) {
    return (
      <div className="table-container" {...props} aria-busy="true" aria-live="polite">
        <table className={`data-table ${tableClassName}`}>
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key} scope="col" className={col.className}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className={tbodyClassName}>
            {Array.from({ length: skeletonRows }).map((_, i) => (
              <tr key={`skeleton-${i}`}>
                <td colSpan={columns.length}>
                  <div className="skeleton-row" aria-label="Cargando fila" style={{ height: '48px' }} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="table-container" {...props}>
        <table className={`data-table ${tableClassName}`}>
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key} scope="col" className={col.className}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className={tbodyClassName}>
            <tr>
              <td colSpan={columns.length} className="empty-row">
                <EmptyState
                  icon={emptyState?.icon as ReactNode | undefined}
                  title={emptyState?.title ?? 'No hay datos disponibles'}
                  description={emptyState?.description}
                  action={emptyState?.action}
                  size="md"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    )
  }

  const renderHeader = () => (
    <thead>
      <tr>
        {columns.map((col) => (
          <th key={col.key} scope="col" className={col.className}>
            {col.header}
          </th>
        ))}
      </tr>
    </thead>
  )

  const renderBody = () => (
    <tbody className={tbodyClassName}>
      {data.map((row, index) => (
        <tr
          key={getRowKey(row)}
          onClick={onRowClick ? () => onRowClick(row) : undefined}
          className={onRowClick ? 'clickable' : ''}
          style={{ cursor: onRowClick ? 'pointer' : 'default' }}
        >
          {columns.map((col) => (
            <td key={col.key} className={col.className}>
              {col.render ? col.render(row, index) : String((row as Record<string, unknown>)[col.key] ?? '-')}
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  )

  return (
    <div className="table-container" {...props}>
      <table className={`data-table ${tableClassName}`}>
        {renderHeader()}
        {renderBody()}
      </table>
    </div>
  )
}