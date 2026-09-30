import Alert from '../../components/Alert';
import Skeleton from '../../components/Skeleton.js';
import PageHeader from '../../components/PageHeader';
import { useClientReports, useMembershipReports, usePaymentReports } from '../../hooks/useApi';
import '../../styles/dashboard/ReportsPage.css';

type ChartPoint = { label: string; value: number };

function monthLabel(month: string) {
  const [year, number] = month.split('-').map(Number);
  return new Date(year, number - 1, 1).toLocaleDateString('es-PE', { month: 'short' });
}

function dayLabel(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString('es-PE', { weekday: 'short' });
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

function BarChart({ title, data, formatValue = (value: number) => String(value) }: {
  title: string;
  data: ChartPoint[];
  formatValue?: (value: number) => string;
}) {
  const width = 620;
  const height = 240;
  const baseline = 190;
  const maxValue = Math.max(1, ...data.map((point) => point.value));
  const slot = data.length > 0 ? width / data.length : width;
  const barWidth = Math.min(52, slot * 0.58);
  const accessibleDescription = data.map((point) => `${point.label}: ${formatValue(point.value)}`).join('; ');

  return (
    <section className="report-card">
      <h2>{title}</h2>
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
  const error = clients.error || memberships.error || payments.error;
  const isLoading = clients.isLoading || memberships.isLoading || payments.isLoading;

  return (
    <div className="reports-page">
      <PageHeader title="Informes operativos" description="Tendencias de socios, membresías, asistencia e ingresos recientes." />
      {error && <Alert type="error" title="No se pudieron cargar todos los informes" message={error.message || 'Revisa la conexión e inténtalo de nuevo.'} dismissible />}
      <p className="reports-period-note">Los gráficos muestran los últimos seis meses o los últimos siete días. Los ingresos se presentan por moneda.</p>
      {isLoading ? <div className="reports-grid" aria-label="Cargando informes" aria-busy="true">
        {Array.from({ length: 5 }, (_, index) => <div className="report-card" key={index}><Skeleton width="180px" height={24} /><Skeleton width="100%" height={180} /></div>)}
      </div> : <div className="reports-grid">
        {clients.data && <BarChart title="Nuevos socios por mes" data={clients.data.clientsByMonth.map((row) => ({ label: monthLabel(row.month), value: row.count }))} />}
        {clients.data && <BarChart title="Socios por estado" data={clients.data.clientsByStatus.map((row) => ({ label: statusLabel(row.status), value: row.count }))} />}
        {memberships.data && <BarChart title="Membresías por estado" data={memberships.data.membershipsByStatus.map((row) => ({ label: statusLabel(row.status), value: row.count }))} />}
        {memberships.data && <BarChart title="Check-ins por día" data={memberships.data.visitsByDay.map((row) => ({ label: dayLabel(row.date), value: row.count }))} />}
        {payments.data && (payments.data.length === 0 ? <section className="report-card"><h2>Ingresos cobrados por mes</h2><p className="report-empty">No hay pagos completados para mostrar todavía.</p></section> :
          [...new Set(payments.data.map((row) => row.currency))].map((currency) => (
            <BarChart key={currency} title={`Ingresos por mes (${currency})`} data={payments.data.filter((row) => row.currency === currency).map((row) => ({ label: monthLabel(row.month), value: row.amount }))} formatValue={(value) => formatCurrency(value, currency)} />
          )))}
      </div>}
      <p className="reports-source-note">Datos agregados desde los registros de la base de datos. No se ejecutan consultas personalizadas.</p>
    </div>
  );
}
