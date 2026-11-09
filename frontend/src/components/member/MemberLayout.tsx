
import { useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import MemberSidebar from "./MemberSidebar";
import MemberHeader from "./MemberHeader";
import { useMemberAvatar } from "./useMemberAvatar";
import "@/styles/member/MemberLayout.css";


const pageTitles: Record<string, string> = {
  "/portal": "Inicio",
  "/portal/membresia": "Mi membresía",
  "/portal/pagos": "Pagos y compras",
  "/portal/comprobantes": "Mis comprobantes",
  "/portal/recomendador": "Recomendador fitness",
  "/portal/notificaciones": "Notificaciones",
  "/portal/perfil": "Mi perfil",
  "/portal/soporte": "Soporte",
};

export default function MemberLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const { avatarUrl } = useMemberAvatar(user?.id);
  const navigate = useNavigate();
  const location = useLocation();

  const title = pageTitles[location.pathname] || "Portal del socio";

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  return (
    <div className="member-layout">
      <MemberSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="member-main">

      <MemberHeader
        onMenuToggle={() => setSidebarOpen((current) => !current)}
        title={title}
        firstName={user?.firstName}
        avatarUrl={avatarUrl}
        onLogout={handleLogout}
        />


        <main className="member-content" id="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
