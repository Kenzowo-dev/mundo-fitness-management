import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import { useAuth } from './context/useAuth'
import Login from './pages/auth/Login.tsx'
import Register from './components/Register.tsx'
import ForgotPassword from './pages/auth/ForgotPassword.tsx'
import ResetPassword from './pages/auth/ResetPassword.tsx'
import DashboardLayout from './components/DashboardLayout.tsx'
import LandingPage from './pages/LandingPage.tsx'
import ClientsPage from './pages/clients/ClientsPage.tsx'
import MembershipsPage from './pages/memberships/MembershipsPage.tsx'
import PaymentsPage from './pages/payments/PaymentsPage.tsx'
import ReportsPage from './pages/reports/ReportsPage.tsx'
import SettingsPage from './pages/settings/SettingsPage.tsx'
import DashboardOverview from './pages/dashboard/DashboardOverview.tsx'
import MemberPortal from './pages/member/MemberPortal.tsx'
import './App.css'

function homeForRole(role?: string) {
  if (role === 'member') return '/portal';
  if (role === 'admin' || role === 'receptionist') return '/dashboard';
  return '/sin-acceso';
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Cargando...</p>
      </div>
    );
  }

  return isAuthenticated ? <Navigate to={homeForRole(user?.role)} replace /> : <>{children}</>;
}

function HomeRoute() {
  const { isAuthenticated, isLoading, user } = useAuth();
  if (isLoading) return <div className="loading-screen"><p>Cargando...</p></div>;
  if (!isAuthenticated) return <LandingPage />;
  return <Navigate to={homeForRole(user?.role)} replace />;
}

function StaffRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isAuthenticated } = useAuth();
  if (isLoading) return <div className="loading-screen"><p>Cargando...</p></div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role === 'member') return <Navigate to="/portal" replace />;
  return user?.role === 'admin' || user?.role === 'receptionist'
    ? <>{children}</>
    : <Navigate to="/sin-acceso" replace />;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isAuthenticated } = useAuth();
  if (isLoading) return <div className="loading-screen"><p>Cargando...</p></div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return user?.role === 'admin' ? <>{children}</> : <Navigate to="/dashboard" replace />;
}

function MemberRoute() {
  const { user, isLoading, isAuthenticated } = useAuth();
  if (isLoading) return <div className="loading-screen"><p>Cargando...</p></div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return user?.role === 'member' ? <MemberPortal /> : <Navigate to={homeForRole(user?.role)} replace />;
}

function AccessNotice() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  return <main className="loading-screen"><section><h1>Acceso no disponible</h1><p>Esta cuenta no tiene un espacio habilitado en el sistema de membresías.</p><button type="button" onClick={() => { logout(); navigate('/'); }}>Cerrar sesión</button></section></main>;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeRoute />} />
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/registro" element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
      <Route path="/reset-password" element={<PublicRoute><ResetPassword /></PublicRoute>} />
      <Route path="/portal" element={<MemberRoute />} />
      <Route path="/sin-acceso" element={<AccessNotice />} />
      <Route
        element={
          <StaffRoute>
            <DashboardLayout />
          </StaffRoute>
        }
      >
        <Route path="dashboard" element={<DashboardOverview />} />
        <Route path="clientes" element={<ClientsPage />} />
        <Route path="membresias" element={<MembershipsPage />} />
        <Route path="pagos" element={<PaymentsPage />} />
        <Route path="informes" element={<ReportsPage />} />
        <Route path="configuracion" element={<AdminRoute><SettingsPage /></AdminRoute>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
