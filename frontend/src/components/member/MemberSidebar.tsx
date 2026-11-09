
import { NavLink } from "react-router-dom";
import Brand from "../Brand";

interface MemberSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const menuItems = [
  {
    label: "Inicio",
    path: "/portal",
    icon: "home",
    end: true,
  },
  {
    label: "Mi membresía",
    path: "/portal/membresia",
    icon: "membership",
  },
  {
    label: "Pagos y compras",
    path: "/portal/pagos",
    icon: "payments",
  },
  {
    label: "Mis comprobantes",
    path: "/portal/comprobantes",
    icon: "receipt",
  },
  {
    label: "Recomendador fitness",
    path: "/portal/recomendador",
    icon: "fitness",
  },
  {
    label: "Notificaciones",
    path: "/portal/notificaciones",
    icon: "bell",
  },
  {
    label: "Mi perfil",
    path: "/portal/perfil",
    icon: "user",
  },
  {
    label: "Soporte",
    path: "/portal/soporte",
    icon: "help",
  },
];

function MenuIcon({ name }: { name: string }) {
  const paths: Record<string, React.ReactNode> = {
    home: <><path d="m3 10 9-7 9 7" /><path d="M5 9v11h14V9" /><path d="M9 20v-6h6v6" /></>,
    membership: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 10h18M7 15h4" /></>,
    payments: <><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20M6 15h3" /></>,
    receipt: <><path d="M5 3h14v18l-3-2-4 2-4-2-3 2z" /><path d="M9 8h6M9 12h6M9 16h3" /></>,
    fitness: <><path d="M6 5v14M18 5v14M3 9v6M21 9v6M6 12h12" /></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></>,
    user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
    help: <><circle cx="12" cy="12" r="9" /><path d="M9.5 9a2.5 2.5 0 1 1 4.3 1.7c-1.1 1-1.8 1.3-1.8 3.3M12 17.5v.1" /></>,
  };

  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}

export default function MemberSidebar({
  isOpen,
  onClose,
}: MemberSidebarProps) {
  return (
    <>
      <button
        type="button"
        className={`member-sidebar-overlay ${isOpen ? "is-visible" : ""}`}
        aria-label="Cerrar menú"
        onClick={onClose}
        tabIndex={isOpen ? 0 : -1}
      />

      <aside className={`member-sidebar ${isOpen ? "is-open" : ""}`}>
        <div className="member-sidebar-brand">
          <Brand />
          <span>PORTAL DEL SOCIO</span>
        </div>

        <nav className="member-sidebar-nav" aria-label="Menú del socio">
          <p className="member-sidebar-label">MENÚ PRINCIPAL</p>

          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) =>
                `member-nav-link ${isActive ? "is-active" : ""}`
              }
              onClick={onClose}
            >
              <MenuIcon name={item.icon} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="member-sidebar-footer">
          <span>MUUNDO FITNESS</span>
          <small>Tu bienestar, nuestra motivación.</small>
        </div>
      </aside>
    </>
  );
}
