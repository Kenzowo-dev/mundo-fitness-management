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
const MemberProfilePage = lazy(
  () => import("./pages/member/MemberProfilePage.tsx"),
);
const MemberLayout = lazy(
  () => import("./components/member/MemberLayout.tsx"),
);
import "./App.css";
import { useEffect } from "react";

// Título de documento por ruta (WCAG 2.4.2 — Título de página).
const pageTitles: Record<string, string> = {
  "/": "Mundo Fitness · Inicio",
  "/login": "Mundo Fitness · Iniciar sesión",
  "/registro": "Mundo Fitness · Crear cuenta de socio",
  "/portal": "Mundo Fitness · Portal del socio",
  "/sin-acceso": "Mundo Fitness · Acceso no disponible",
  "/dashboard": "Mundo Fitness · Dashboard",
  "/clientes": "Mundo Fitness · Socios",
  "/membresias": "Mundo Fitness · Membresías",
  "/pagos": "Mundo Fitness · Pagos",
  "/informes": "Mundo Fitness · Informes",
  "/configuracion": "Mundo Fitness · Configuración",
};

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

function MemberRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) return <RouteSkeleton />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return user?.role === "member" ? (
    <>{children}</>
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

function MemberPlaceholder({ title }: { title: string }) {
  return (
    <section
      style={{
        padding: "2rem",
        background: "var(--bg-elevated-1)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--radius-xl)",
      }}
    >
      <p className="member-eyebrow">PORTAL DEL SOCIO</p>
      <h2>{title}</h2>
      <p className="member-muted">
        Esta sección está en preparación. Próximamente encontrarás aquí
        toda la información y funcionalidades correspondientes.
      </p>
    </section>
  );
}

function App() {
  const { pathname } = useLocation();
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  useEffect(() => {
    document.title = pageTitles[pathname] ?? pageTitles["/"];
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
        {import.meta.env.DEV && (
          <>
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
          </>
        )}
        <Route
  path="/portal"
  element={
    <MemberRoute>
      <MemberLayout />
    </MemberRoute>
  }
>
  <Route index element={<MemberPortal />} />
  <Route
    path="membresia"
    element={<MemberPlaceholder title="Mi membresía" />}
  />
  <Route
    path="pagos"
    element={<MemberPlaceholder title="Pagos y compras" />}
  />
  <Route
    path="comprobantes"
    element={<MemberPlaceholder title="Mis comprobantes" />}
  />
  <Route
    path="recomendador"
    element={<MemberPlaceholder title="Recomendador fitness" />}
  />
  <Route
    path="notificaciones"
    element={<MemberPlaceholder title="Notificaciones" />}
  />
  <Route
  path="perfil"
  element={<MemberProfilePage />}
  />
  <Route
    path="soporte"
    element={<MemberPlaceholder title="Soporte" />}
  />
</Route>
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
