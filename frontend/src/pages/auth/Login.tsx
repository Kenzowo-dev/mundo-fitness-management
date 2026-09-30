import { Link, useLocation } from 'react-router-dom'
import Alert from '../../components/Alert'
import LoginForm from '../../componentes/auth/LoginForm'
import '@/styles/auth/Login.css'

export default function Login() {
  const location = useLocation()
  const notice = (location.state as { notice?: string } | null)?.notice

  return (
    <main className="auth-container" role="main">
      <div className="auth-card">
        <header className="auth-header">
          <img
            src="/assets/Logo.png"
            alt=""
            className="auth-logo"
            aria-hidden="true"
          />
          <h1 className="auth-title">Mundo Fitness</h1>
          <p className="auth-description">
            Ingresa a tu cuenta para acceder al panel de control.
          </p>
        </header>

        {notice && <Alert type="success" message={notice} />}

        <LoginForm />

        <footer className="auth-footer">
          <Link to="/forgot-password" className="forgot-password-link">
            ¿Olvidaste tu contraseña?
          </Link>
          <div className="login-footer-divider" />
          <Link to="/" className="auth-back-link">
            ← Volver al inicio
          </Link>
        </footer>
      </div>
    </main>
  )
}
