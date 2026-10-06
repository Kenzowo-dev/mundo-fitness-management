import { lazy, Suspense, useLayoutEffect } from "react";
import RouteSkeleton from "./components/RouteSkeleton";
import {
  Navigate,
  Route,
  Routes,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { selectedPlanId } from "./utils/planSelection";
import { useAuth } from "./context/useAuth";
const Login = lazy(() => import("./pages/auth/Login.tsx"));
const Register = lazy(() => import("./components/Register.tsx"));
const ForgotPassword = lazy(() => import("./pages/auth/ForgotPassword.tsx"));
const ResetPassword = lazy(() => import("./pages/auth/ResetPassword.tsx"));
import DashboardLayout from "./components/DashboardLayout.tsx";
import LandingPage from "./pages/LandingPage.tsx";
const ClientsPage = lazy(() => import("./pages/clients/ClientsPage.tsx"));
const MembershipsPage = lazy(
  () => import("./pages/memberships/MembershipsPage.tsx"),
);
const PaymentsPage = lazy(() => import("./pages/payments/PaymentsPage.tsx"));
const ReportsPage = lazy(() => import("./pages/reports/ReportsPage.tsx"));
const SettingsPage = lazy(() => import("./pages/settings/SettingsPage.tsx"));
const DashboardOverview = lazy(
  () => import("./pages/dashboard/DashboardOverview.tsx"),
);
const MemberPortal = lazy(() => import("./pages/member/MemberPortal.tsx"));
import "./App.css";

function homeForRole(role?: string) {
  if (role === "member") return "/portal";
  if (role === "admin" || role === "receptionist") return "/dashboard";
  return "/sin-acceso";
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();
  const planId = selectedPlanId(location.search);

  if (isLoading) {
    return <RouteSkeleton />;
  }

  const destination =
    homeForRole(user?.role) +
    (user?.role === "member" && planId ? `?plan=${planId}` : "");
  return isAuthenticated ? (
    <Navigate to={destination} replace />
  ) : (
    <>{children}</>
  );
}

function HomeRoute() {
  const { isAuthenticated, isLoading, user } = useAuth();
  if (isLoading) return <RouteSkeleton />;
  if (!isAuthenticated) return <LandingPage />;
  return <Navigate to={homeForRole(user?.role)} replace />;
}

function StaffRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isAuthenticated } = useAuth();
  if (isLoading) return <RouteSkeleton />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role === "member") return <Navigate to="/portal" replace />;
  return user?.role === "admin" || user?.role === "receptionist" ? (
    <>{children}</>
  ) : (
    <Navigate to="/sin-acceso" replace />
  );
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isAuthenticated } = useAuth();
  if (isLoading) return <RouteSkeleton />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return user?.role === "admin" ? (
    <>{children}</>
  ) : (
    <Navigate to="/dashboard" replace />
  );
}

function MemberRoute() {
  const { user, isLoading, isAuthenticated } = useAuth();
  if (isLoading) return <RouteSkeleton />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return user?.role === "member" ? (
    <MemberPortal />
  ) : (
    <Navigate to={homeForRole(user?.role)} replace />
  );
}

function AccessNotice() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  return (
    <main className="loading-screen">
      <section>
        <h1>Acceso no disponible</h1>
        <p>
          Esta cuenta no tiene un espacio habilitado en el sistema de
          membresías.
        </p>
        <button
          type="button"
          onClick={() => {
            logout();
            navigate("/");
          }}
        >
          Cerrar sesión
        </button>
      </section>
    </main>
  );
}

function App() {
  const { pathname } = useLocation();
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return (
    <Suspense fallback={<RouteSkeleton />}>
      <Routes>
        <Route path="/" element={<HomeRoute />} />
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/registro"
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <PublicRoute>
              <ForgotPassword />
            </PublicRoute>
          }
        />
        <Route
          path="/reset-password"
          element={
            <PublicRoute>
              <ResetPassword />
            </PublicRoute>
          }
        />
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
          <Route
            path="configuracion"
            element={
              <AdminRoute>
                <SettingsPage />
              </AdminRoute>
            }
          />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

export default App;
