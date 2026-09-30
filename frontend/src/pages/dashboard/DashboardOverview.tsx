import { Link } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import { useClientDashboardStats, useMembershipDashboardStats, usePaymentDashboardStats } from '../../hooks/useApi';
import Skeleton from '../../components/Skeleton.js';
import Alert from '../../components/Alert';
import '../../styles/dashboard/DashboardOverview.css';

function formatRevenue(revenue: Array<{ currency: string; amount: number }> = []) {
  if (revenue.length === 0) return 'Sin ingresos este mes';
  return revenue.map(({ currency, amount }) =>
    new Intl.NumberFormat('es-PE', { style: 'currency', currency }).format(amount)
  ).join(' · ');
}

export default function DashboardOverview() {
  const { user } = useAuth();
  const clientsQuery = useClientDashboardStats();
  const membershipsQuery = useMembershipDashboardStats();
  const paymentsQuery = usePaymentDashboardStats();
  const queries = [clientsQuery, membershipsQuery, paymentsQuery];
  const dashboardError = queries.find((query) => query.error)?.error;

  const cards = [
    { label: 'Socios activos', value: clientsQuery.data?.activeClients, loading: clientsQuery.isLoading, error: clientsQuery.isError },
    { label: 'Membresías vigentes', value: membershipsQuery.data?.activeMemberships, loading: membershipsQuery.isLoading, error: membershipsQuery.isError },
    { label: 'Check-ins de hoy', value: membershipsQuery.data?.visitsToday, loading: membershipsQuery.isLoading, error: membershipsQuery.isError },
    { label: 'Ingresos cobrados este mes', value: formatRevenue(paymentsQuery.data?.revenueThisMonth), loading: paymentsQuery.isLoading, error: paymentsQuery.isError },
  ];

  return (
    <div className="dashboard-overview">
      {dashboardError && (
        <Alert
          type="error"
          title="No se pudieron cargar todas las métricas"
          message={dashboardError.message || 'Revisa la conexión e inténtalo de nuevo.'}
          dismissible
        />
      )}
      <div className="overview-welcome">
        <h2>¡Bienvenido, {user?.firstName} {user?.lastName}!</h2>
        <p>Resumen operativo de Mundo Fitness. Rol activo: <strong>{user?.role?.toUpperCase()}</strong></p>
      </div>

      <div className="overview-stats-grid" aria-label="Indicadores del gimnasio">
        {cards.map(({ label, value, loading, error }) => (
          <div className="stat-card" key={label}>
            <div className="stat-info">
              <h3>{label}</h3>
              {loading ? <Skeleton width="120px" height={28} /> : (
                <div className="stat-value" aria-label={label}>{error ? '—' : value}</div>
              )}
            </div>
          </div>
        ))}
      </div>
      <p className="dashboard-stats-caption">Cifras calculadas desde los registros actuales de la base de datos.</p>

      <div className="overview-actions-section">
        <h3>Acciones rápidas</h3>
        <div className="quick-actions-grid">
          <Link to="/clientes" className="action-card">
            <span className="action-card-title">Gestión de Clientes</span>
            <span className="action-card-desc">Buscar socios, revisar sus datos y registrar nuevos clientes.</span>
          </Link>
          <Link to="/membresias" className="action-card">
            <span className="action-card-title">Membresías y Accesos</span>
            <span className="action-card-desc">Consultar planes, controlar check-in y suscripciones.</span>
          </Link>
          <Link to="/pagos" className="action-card">
            <span className="action-card-title">Pagos</span>
            <span className="action-card-desc">Consultar los pagos registrados y su estado.</span>
          </Link>
          <Link to="/informes" className="action-card">
            <span className="action-card-title">Informes</span>
            <span className="action-card-desc">Revisar tendencias de socios, membresías, asistencia e ingresos.</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
