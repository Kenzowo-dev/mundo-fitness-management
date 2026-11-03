import AuthShell from "../../components/AuthShell";
import { Link, useLocation } from "react-router-dom";
import Alert from "../../components/Alert";
import LoginForm from "../../componentes/auth/LoginForm";
import "@/styles/auth/Login.css";

export default function Login() {
  const location = useLocation();
  const notice = (location.state as { notice?: string } | null)?.notice;

  return (
    <AuthShell>
      <main className="auth-container" role="main">
        <div className="auth-card">
          <header className="auth-header">
            <p className="auth-eyebrow">TU ESPACIO EN MUNDO FITNESS</p>
            <h1 className="auth-title">Qué bueno verte.</h1>
            <p className="auth-description">
              Entra para consultar tu membresía o continuar con la atención del
              gimnasio.
            </p>
          </header>

          {notice && <Alert type="success" message={notice} />}

          <LoginForm />

          <footer className="auth-footer">
            <Link to="/forgot-password" className="forgot-password-link">
              ¿Olvidaste tu contraseña?
            </Link>
            <Link to="/registro" className="auth-back-link">
              ¿Primera vez aquí? Crear cuenta de socio
            </Link>
            <Link to="/" className="auth-back-link">
              ← Volver al inicio
            </Link>
          </footer>
        </div>
      </main>
    </AuthShell>
  );
}
