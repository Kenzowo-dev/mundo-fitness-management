import { useMemo } from 'react'
import { useWidgets, useAllWidgets } from '../../hooks/useApi'
import type { DashboardWidget, WidgetData } from '../../types/api'
import type { UseQueryResult } from '@tanstack/react-query'
import Skeleton from '../../components/Skeleton'
import Alert from '../../components/Alert'
import PageHeader from '../../components/PageHeader'
import EmptyState from '../../components/EmptyState'
import '../../styles/dashboard/ReportsPage.css'

export default function ReportsPage() {
  const { data: widgetsData, isLoading: widgetsLoading, error: widgetsError } = useWidgets()

  const allWidgets: DashboardWidget[] = useMemo(() => widgetsData ?? [], [widgetsData])
  const widgetQueries: UseQueryResult<WidgetData, Error>[] = useAllWidgets(allWidgets)

  const widgetDataMap = useMemo(() => {
    const map: Record<number, WidgetData | { error: string }> = {}
    widgetQueries.forEach((q, i) => {
      const widget = allWidgets[i]
      if (!widget) return
      if (q.data) map[widget.id] = q.data
      if (q.error) map[widget.id] = { error: q.error instanceof Error ? q.error.message : 'Error al cargar' }
    })
    return map
  }, [widgetQueries, allWidgets])

  const isLoading = widgetsLoading || widgetQueries.some(q => q.isLoading)
  const error = widgetsError || widgetQueries.find(q => q.error)?.error

  const enabledWidgets = allWidgets

  const renderWidget = (widget: DashboardWidget) => {
    const data = widgetDataMap[widget.id]
    if (!data) return <div className="widget-loading">Cargando...</div>
    if ('error' in data) return <div className="widget-error">{data.error}</div>

    const widgetDataTyped = data as WidgetData

    return (
      <div className="widget" style={{ gridColumn: `span ${widget.width}`, gridRow: `span ${widget.height}` }}>
        <div className="widget-header">
          <h3>{widget.name}</h3>
        </div>
        <div className="widget-content">
          {widget.type === 'metric' && widgetDataTyped.rows && widgetDataTyped.rows.length > 0 && (
            <div className="metric-value">
              {String(widgetDataTyped.columns.includes('value') ? widgetDataTyped.rows[0][widgetDataTyped.columns.indexOf('value')] : widgetDataTyped.rows[0][0])}
            </div>
          )}
          {widget.type === 'line' && widgetDataTyped.rows && (
            <div className="chart-placeholder">Gráfico de líneas: {widgetDataTyped.rows.length} puntos de datos</div>
          )}
          {widget.type === 'pie' && widgetDataTyped.rows && (
            <div className="chart-placeholder">Gráfico de pastel: {widgetDataTyped.rows.length} segmentos</div>
          )}
          {widget.type === 'bar' && widgetDataTyped.rows && (
            <div className="chart-placeholder">Gráfico de barras: {widgetDataTyped.rows.length} barras</div>
          )}
          {widget.type === 'heatmap' && widgetDataTyped.rows && (
            <div className="chart-placeholder">Mapa de calor: {widgetDataTyped.rows.length} celdas</div>
          )}
          {widget.type === 'table' && widgetDataTyped.rows && (
            <div className="table-preview">
              <table>
                <thead><tr>{widgetDataTyped.columns.map((c: string) => <th key={c}>{c}</th>)}</tr></thead>
                <tbody>
                  {widgetDataTyped.rows.slice(0, 5).map((row: unknown[], i: number) => (
                    <tr key={i}>{row.map((cell: unknown, j: number) => <td key={j}>{String(cell)}</td>)}</tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="reports-page">
      <PageHeader title="Reportes y Analíticas" />

      {error && <Alert type="error" title="Error" message={error instanceof Error ? error.message : 'Error desconocido'} />}

      {isLoading ? (
        <div className="loading" aria-label="Cargando reportes" aria-live="polite">
          <Skeleton width="100%" height={24} style={{ marginBottom: 12 }} />
          <Skeleton width="60%" height={24} style={{ marginBottom: 12 }} />
          <Skeleton width="80%" height={24} />
        </div>
      ) : enabledWidgets.length === 0 ? (
        <EmptyState
          icon={<span className="empty-icon" aria-hidden="true">📊</span>}
          title="No hay reportes ni métricas configuradas."
        />
      ) : (
        <div className="widgets-grid" aria-label="Cuadro de métricas">
          {enabledWidgets.map((widget) => renderWidget(widget))}
        </div>
      )}
    </div>
  )
}