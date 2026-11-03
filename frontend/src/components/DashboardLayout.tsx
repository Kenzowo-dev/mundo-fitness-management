import RouteSkeleton from './RouteSkeleton';
import Brand from "./Brand";
import ThemeToggle from "./ThemeToggle";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import "../styles/dashboard/DashboardLayout.css";
import { useState, useEffect, useRef, useSyncExternalStore, Suspense } from "react";
import { useFocusScope } from "../hooks/useFocusScope";

function subscribeCompactLayout(onChange: () => void) {
  const media = window.matchMedia("(max-width: 1024px)");
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}
const isCompactLayout = () => window.matchMedia("(max-width: 1024px)").matches;

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);
  const mainRef = useRef<HTMLElement>(null);
  const compact = useSyncExternalStore(subscribeCompactLayout, isCompactLayout);
  useFocusScope({
    active: sidebarOpen && compact,
    container: sidebarRef,
    background: mainRef,
  });

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Close sidebar on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && sidebarOpen) {
        setSidebarOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [sidebarOpen]);

  const allNavItems = [
    { path: "/dashboard", label: "Dashboard", icon: "dashboard" },
    { path: "/clientes", label: "Socios", icon: "users" },
    { path: "/membresias", label: "Membresías", icon: "credit-card" },
    { path: "/pagos", label: "Pagos", icon: "dollar-sign" },
    { path: "/informes", label: "Informes", icon: "bar-chart-2" },
    { path: "/configuracion", label: "Configuración", icon: "settings" },
  ];
  const navItems = allNavItems.filter((item) => {
    if (user?.role === "admin") return true;
    return [
      "/dashboard",
      "/clientes",
      "/membresias",
      "/pagos",
      "/informes",
    ].includes(item.path);
  });

  const currentLabel =
    navItems.find((i) => location.pathname === i.path)?.label ||
    "Área de recepción";

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);
  const closeSidebar = () => setSidebarOpen(false);

  const icons: Record<string, React.ReactNode> = {
    dashboard: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
      >
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
    users: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
      >
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    "credit-card": (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
      >
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <line x1="2" y1="10" x2="22" y2="10" />
      </svg>
    ),
    "clipboard-list": (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
      >
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
        <line x1="9" y1="14" x2="15" y2="14" />
        <line x1="9" y1="10" x2="15" y2="10" />
        <line x1="9" y1="18" x2="15" y2="18" />
      </svg>
    ),
    "dollar-sign": (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
      >
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
    "bar-chart-2": (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
      >
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
    settings: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06-.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
  };

  return (
    <div className="dashboard-layout">
      {/* Skip link para saltar la navegación principal (WCAG 2.4.1) */}
      <a href="#main-content" className="skip-link">
        Saltar al contenido principal
      </a>

      {/* Overlay oscuro para mobile cuando el sidebar está abierto */}
      {sidebarOpen && (
        <button
          type="button"
          className="sidebar-overlay"
          aria-label="Cerrar navegación"
          onClick={closeSidebar}
        />
      )}

      <aside
        ref={sidebarRef}
        tabIndex={-1}
        id="sidebar"
        className={`sidebar ${sidebarOpen ? "open" : ""}`}
        aria-label="Navegación principal"
      >
        <button
          type="button"
          className="sidebar-close"
          onClick={closeSidebar}
          aria-label="Cerrar menú"
        >
          ×
        </button>
        <div className="sidebar-header">
          <Brand />
          <p className="sidebar-section-label">
            {user?.role === "admin" ? "Administración" : "Recepción"}
          </p>
        </div>
        <nav className="sidebar-nav" aria-label="Menú de navegación">
          <ul>
            {navItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `nav-link ${isActive ? "active" : ""}`
                  }
                  onClick={closeSidebar}
                >
                  <span className="nav-icon" aria-hidden="true">
                    {icons[item.icon]}
                  </span>
                  <span className="nav-label">{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar" aria-hidden="true">
              {user?.firstName?.[0]}
              {user?.lastName?.[0]}
            </div>
            <div className="user-details">
              <span className="user-name">
                {user?.firstName} {user?.lastName}
              </span>
              <span className="user-role">
                {user?.role === "admin" ? "Administrador" : "Recepcionista"}
              </span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="logout-btn"
            aria-label="Cerrar sesión"
          >
            Cerrar sesión
          </button>
        </div>
      </aside>
      <main ref={mainRef} className="main-content" id="main-content">
        <header className="top-bar">
          <button
            className="menu-toggle"
            onClick={toggleSidebar}
            aria-label={
              sidebarOpen ? "Cerrar menú" : "Abrir menú de navegación"
            }
            aria-expanded={sidebarOpen}
            aria-controls="sidebar"
          >
            {sidebarOpen ? (
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
          </button>
          <h1 className="page-title">{currentLabel}</h1>
          <ThemeToggle />
        </header>
        <div className="content-area">
          <Suspense fallback={<RouteSkeleton />}><Outlet /></Suspense>
        </div>
      </main>
    </div>
  );
}
