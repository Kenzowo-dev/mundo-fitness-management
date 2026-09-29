import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './context/useAuth'
import Login from './pages/auth/Login.tsx'
import Register from './components/Register.tsx'
import ForgotPassword from './pages/auth/ForgotPassword.tsx'
import ResetPassword from './pages/auth/ResetPassword.tsx'
import DashboardLayout from './components/DashboardLayout.tsx'
import LandingPage from './pages/LandingPage.tsx'
import ClientsPage from './pages/clients/ClientsPage.tsx'
import MembershipsPage from './pages/memberships/MembershipsPage.tsx'
import PlansPage from './pages/plans/PlansPage.tsx'
import PaymentsPage from './pages/payments/PaymentsPage.tsx'
import ReportsPage from './pages/reports/ReportsPage.tsx'
import SettingsPage from './pages/settings/SettingsPage.tsx'
import DashboardOverview from './pages/dashboard/DashboardOverview.tsx'
import './App.css'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Cargando...</p>
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Cargando...</p>
      </div>
    );
  }

  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <>{children}</>;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/registro" element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
      <Route path="/reset-password" element={<PublicRoute><ResetPassword /></PublicRoute>} />
      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardOverview />} />
        <Route path="clientes" element={<ClientsPage />} />
        <Route path="membresias" element={<MembershipsPage />} />
        <Route path="planes" element={<PlansPage />} />
        <Route path="pagos" element={<PaymentsPage />} />
        <Route path="reportes" element={<ReportsPage />} />
        <Route path="configuracion" element={<SettingsPage />} />
      </Route>
    </Routes>
  );
}

export default App;