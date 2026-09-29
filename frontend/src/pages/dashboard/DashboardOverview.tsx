import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import { useClients, useMembershipPlans, usePayments } from '../../hooks/useApi';
import Skeleton from '../../components/Skeleton.js';
import Alert from '../../components/Alert';
import '../../styles/dashboard/DashboardOverview.css';

export default function DashboardOverview() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  const { data: clientsData, isLoading: clientsLoading, error: clientsError } = useClients(1, 1)
  const { data: plansData, isLoading: plansLoading, error: plansError } = useMembershipPlans(true)
  const { data: paymentsData, isLoading: paymentsLoading, error: paymentsError } = usePayments(1, 50)

  const stats = {
    clientsCount: clientsData?.pagination.total ?? 0,
    membershipsCount: plansData?.length ?? 0,
    plansCount: plansData?.length ?? 0,
    paymentsTotal: (paymentsData?.data ?? [])
      .filter((p) => p.status === 'completed')
      .reduce((acc, p) => acc + (Number(p.amount) || 0), 0),
  }

  const dashboardError = clientsError || plansError || paymentsError

  useEffect(() => {
    const checkLoading = () => {
      if (!clientsLoading && !plansLoading && !paymentsLoading) {
        setLoading(false)
      }
    }
    checkLoading()
  }, [clientsLoading, plansLoading, paymentsLoading])

  return (
    <div className="dashboard-overview">
      {dashboardError && (
        <Alert
          type="error"
          title="Error cargando métricas del dashboard"
          message={dashboardError instanceof Error ? dashboardError.message : 'No se pudieron cargar las métricas del dashboard. Algunas estadísticas pueden no estar disponibles.'}
          dismissible
        />
      )}
      <div className="overview-welcome">
        <h2>¡Bienvenido, {user?.firstName} {user?.lastName}!</h2>
        <p>Panel de Control general del sistema Mundo Fitness. Rol activo: <strong>{user?.role?.toUpperCase()}</strong></p>
      </div>

      <div className="overview-stats-grid">
        <div className="stat-card">
          <div className="stat-icon" aria-hidden="true">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" focusable="false">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div className="stat-info">
            <h3>Socios Registrados</h3>
            {loading ? <Skeleton width="60px" height={28} /> : <div className="stat-value">{stats.clientsCount}</div>}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" aria-hidden="true">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" focusable="false">
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
              <line x1="1" y1="10" x2="23" y2="10" />
            </svg>
          </div>
          <div className="stat-info">
            <h3>Planes de Membresía</h3>
            {loading ? <Skeleton width="60px" height={28} /> : <div className="stat-value">{stats.membershipsCount}</div>}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" aria-hidden="true">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" focusable="false">
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          <div className="stat-info">
            <h3>Ingresos Recaudados</h3>
            {loading ? <Skeleton width="80px" height={28} /> : <div className="stat-value">${stats.paymentsTotal.toFixed(2)}</div>}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" aria-hidden="true">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" focusable="false">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
          </div>
          <div className="stat-info">
            <h3>Estado del Sistema</h3>
            <div className="stat-value" style={{ color: '#16a34a', fontSize: '1.1rem' }}>Operativo 100%</div>
          </div>
        </div>
      </div>

      <div className="overview-actions-section">
        <h3>Acciones Rápidas de Gestión</h3>
        <div className="quick-actions-grid">
          <Link to="/clientes" className="action-card">
            <span className="action-card-icon" aria-hidden="true">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" focusable="false">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </span>
            <span className="action-card-title">Gestión de Clientes</span>
            <span className="action-card-desc">Registrar socios, ver historiales y medidas corporales.</span>
          </Link>

          <Link to="/membresias" className="action-card">
            <span className="action-card-icon" aria-hidden="true">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" focusable="false">
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                <line x1="1" y1="10" x2="23" y2="10" />
              </svg>
            </span>
            <span className="action-card-title">Membresías y Accesos</span>
            <span className="action-card-desc">Consultar planes, controlar check-in y suscripciones.</span>
          </Link>

          <Link to="/planes" className="action-card">
            <span className="action-card-icon" aria-hidden="true">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" focusable="false">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </span>
            <span className="action-card-title">Planes de Entrenamiento</span>
            <span className="action-card-desc">Biblioteca de ejercicios y rutinas personalizadas.</span>
          </Link>

          <Link to="/pagos" className="action-card">
            <span className="action-card-icon" aria-hidden="true">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" focusable="false">
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </span>
            <span className="action-card-title">Caja y Facturación</span>
            <span className="action-card-desc">Consultar pagos realizados, emitir y verificar facturas.</span>
          </Link>
        </div>
      </div>
    </div>
  );
}