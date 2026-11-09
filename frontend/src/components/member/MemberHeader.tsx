
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ThemeToggle from "../ThemeToggle";

interface MemberHeaderProps {
  onMenuToggle: () => void;
  title: string;
  firstName?: string;
  avatarUrl?: string | null;
  onLogout: () => void;
}

export default function MemberHeader({
  onMenuToggle,
  title,
  firstName,
  avatarUrl,
  onLogout,
}: MemberHeaderProps) {
  const navigate = useNavigate();
  const [failedAvatarUrl, setFailedAvatarUrl] = useState<string | null>(null);

  const showAvatar = Boolean(avatarUrl && avatarUrl !== failedAvatarUrl);

  return (
    <header className="member-header">
      <div className="member-header-left">
        <button
          type="button"
          className="member-icon-button member-menu-toggle"
          onClick={onMenuToggle}
          aria-label="Abrir menú de navegación"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div className="member-header-heading">
          <span>PORTAL DEL SOCIO</span>
          <h1>{title}</h1>
        </div>
      </div>

      <div className="member-header-actions">
        <ThemeToggle />

        <button
          type="button"
          className="member-icon-button"
          onClick={() => navigate("/portal/notificaciones")}
          aria-label="Ver notificaciones"
          title="Notificaciones"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
            <path d="M10 21h4" />
          </svg>
          <span className="member-notification-bell" />
        </button>

        <button
          type="button"
          className="member-user-button"
          onClick={() => navigate("/portal/perfil")}
          aria-label="Ir a mi perfil"
          title="Mi perfil"
        >
          <span className="member-avatar">
            {showAvatar ? (
              <img
                src={avatarUrl!}
                alt=""
                className="member-avatar-image"
                onError={() => setFailedAvatarUrl(avatarUrl!)}
              />
            ) : (
              firstName?.charAt(0).toUpperCase() || "S"
            )}
          </span>

          <span className="member-user-name">
            {firstName || "Socio"}
          </span>
        </button>

        <button
          type="button"
          className="member-logout-button"
          onClick={onLogout}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M10 17l5-5-5-5M15 12H3" />
            <path d="M12 3h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7" />
          </svg>
          <span>Cerrar sesión</span>
        </button>
      </div>
    </header>
  );
}
