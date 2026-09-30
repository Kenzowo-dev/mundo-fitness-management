import Alert from '../../components/Alert';
import Button from '../../components/Button';
import MorphIcon from '../../components/MorphIcon';
import Skeleton from '../../components/Skeleton.js';
import PageHeader from '../../components/PageHeader';
import { RefreshCw } from 'lucide';
import { useClientReports, useMembershipReports, usePaymentReports } from '../../hooks/useApi';
import '../../styles/dashboard/ReportsPage.css';

type ChartPoint = { label: string; value: number };

function monthLabel(month: string) {
  const [year, number] = month.split('-').map(Number);
  if (!year || !number || number > 12) return '—';
  return new Intl.DateTimeFormat('es-PE', { month: 'short', year: '2-digit' }).format(new Date(year, number - 1, 1));
}

function dayLabel(date: string) {
  const [year, month, day] = date.slice(0, 10).split('-').map(Number);
  if (!year || !month || !day) return '—';
  return new Intl.DateTimeFormat('es-PE', { weekday: 'short', day: 'numeric' }).format(new Date(year, month - 1, day));
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    active: 'Activos', inactive: 'Inactivos', suspended: 'Suspendidos',
    cancelled: 'Canceladas', expired: 'Vencidas', frozen: 'Congeladas', scheduled: 'Programadas',
  };
  return labels[status] ?? status;
}

function formatCurrency(value: number, currency: string) {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency }).format(value);
}

function ReportSkeleton({ label, count = 2 }: { label: string; count?: number }) {
  return (
    <div className="reports-service-grid" aria-label={label} aria-busy="true">
      {Array.from({ length: count }, (_, index) => (
        <div className="report-card" key={index}>
          <Skeleton width="180px" height={24} ariaLabel="Cargando título del informe" />
          <Skeleton width="100%" height={180} ariaLabel="Cargando gráfico" />
        </div>
      ))}
    </div>
  );
}

function ReportError({ title, error, onRetry }: { title: string; error: Error | null; onRetry: () => void }) {
  return (
    <div className="report-query-error">
      <Alert type="error" title={`No se pudieron cargar ${title.toLowerCase()}`} message={error?.message || 'Inténtalo de nuevo.'} />
      <Button variant="secondary" onClick={onRetry}>
        <MorphIcon icon={RefreshCw} size={16} aria-hidden="true" />
        Reintentar {title.toLowerCase()}
      </Button>
    </div>
  );
}

function BarChart({ title, data, formatValue = (value: number) => String(value) }: {
  title: string;
  data: ChartPoint[];
  formatValue?: (value: number) => string;
}) {
  const width = 500;
  const height = 240;
  const baseline = 190;
  const maxValue = Math.max(1, ...data.map((point) => point.value));
  const slot = data.length > 0 ? width / data.length : width;
  const barWidth = Math.min(52, slot * 0.58);
  const accessibleDescription = data.map((point) => `${point.label}: ${formatValue(point.value)}`).join('; ');

  return (
    <section className="report-card">
      <h3>{title}</h3>
      {data.length === 0 ? <p className="report-empty">No hay datos para este periodo.</p> : <>
        <svg className="report-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${title}. ${accessibleDescription}`}>
          <line x1="0" y1={baseline} x2={width} y2={baseline} className="chart-axis" />
          {data.map((point, index) => {
            const barHeight = point.value === 0 ? 2 : Math.max(3, (point.value / maxValue) * 142);
            const x = index * slot + (slot - barWidth) / 2;
            const y = baseline - barHeight;
            return (
              <g key={`${point.label}-${index}`}>
                <rect x={x} y={y} width={barWidth} height={barHeight} rx="4" className="chart-bar" />
                <text x={x + barWidth / 2} y={Math.max(16, y - 7)} textAnchor="middle" className="chart-value">{formatValue(point.value)}</text>
                <text x={x + barWidth / 2} y="215" textAnchor="middle" className="chart-label">{point.label}</text>
              </g>
            );
          })}
        </svg>
        <details className="report-data-details">
          <summary>Ver datos en tabla</summary>
          <table>
            <thead><tr><th>Periodo</th><th>Valor</th></tr></thead>
            <tbody>{data.map((point, index) => <tr key={`${point.label}-${index}`}><td>{point.label}</td><td>{formatValue(point.value)}</td></tr>)}</tbody>
          </table>
        </details>
      </>}
    </section>
  );
}

export default function ReportsPage() {
  const clients = useClientReports();
  const memberships = useMembershipReports();
  const payments = usePaymentReports();
  return (
    <div className="reports-page">
      <PageHeader title="Informes" description="Consulta tendencias de socios, membresías, asistencia e ingresos." />
      <p className="reports-period-note">Los gráficos muestran los últimos seis meses o los últimos siete días. Los ingresos se presentan por moneda.</p>
      <div className="reports-grid">
        <section className="reports-section" aria-labelledby="reports-clients-title" aria-busy={Boolean(clients.isFetching && clients.data)}>
          <h2 id="reports-clients-title">Socios</h2>
          {clients.isLoading && <ReportSkeleton label="Cargando informes de socios" />}
          {clients.isError && <ReportError title="informes de socios" error={clients.error} onRetry={() => void clients.refetch()} />}
          {clients.data && <div className="reports-service-grid">
            <BarChart title="Nuevos socios por mes" data={clients.data.clientsByMonth.map((row) => ({ label: monthLabel(row.month), value: row.count }))} />
            <BarChart title="Socios por estado" data={clients.data.clientsByStatus.map((row) => ({ label: statusLabel(row.status), value: row.count }))} />
          </div>}
        </section>

        <section className="reports-section" aria-labelledby="reports-memberships-title" aria-busy={Boolean(memberships.isFetching && memberships.data)}>
          <h2 id="reports-memberships-title">Membresías y asistencia</h2>
          {memberships.isLoading && <ReportSkeleton label="Cargando informes de membresías" />}
          {memberships.isError && <ReportError title="informes de membresías" error={memberships.error} onRetry={() => void memberships.refetch()} />}
          {memberships.data && <div className="reports-service-grid">
            <BarChart title="Membresías por estado" data={memberships.data.membershipsByStatus.map((row) => ({ label: statusLabel(row.status), value: row.count }))} />
            <BarChart title="Check-ins por día" data={memberships.data.visitsByDay.map((row) => ({ label: dayLabel(row.date), value: row.count }))} />
          </div>}
        </section>

        <section className="reports-section" aria-labelledby="reports-payments-title" aria-busy={Boolean(payments.isFetching && payments.data)}>
          <h2 id="reports-payments-title">Ingresos</h2>
          {payments.isLoading && <ReportSkeleton label="Cargando informes de ingresos" count={1} />}
          {payments.isError && <ReportError title="informes de ingresos" error={payments.error} onRetry={() => void payments.refetch()} />}
          {payments.data && (payments.data.length === 0 ? <div className="reports-service-grid"><section className="report-card"><h3>Ingresos cobrados por mes</h3><p className="report-empty">No hay pagos completados para mostrar todavía.</p></section></div> :
            <div className="reports-service-grid">{[...new Set(payments.data.map((row) => row.currency))].map((currency) => (
              <BarChart key={currency} title={`Ingresos por mes (${currency})`} data={payments.data.filter((row) => row.currency === currency).map((row) => ({ label: monthLabel(row.month), value: row.amount }))} formatValue={(value) => formatCurrency(value, currency)} />
            ))}</div>)}
        </section>
      </div>
      <p className="reports-source-note">Datos agregados desde los registros de la base de datos. No se ejecutan consultas personalizadas.</p>
    </div>
  );
}
