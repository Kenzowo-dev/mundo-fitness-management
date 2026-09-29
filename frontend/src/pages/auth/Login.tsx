import { Link } from 'react-router-dom'
import LoginForm from '../../componentes/auth/LoginForm'
import '@/styles/auth/Login.css'

export default function Login() {
  return (
    <main className="auth-container" role="main">
      <div className="auth-card">
        <header className="auth-header">
          <img
            src="/src/assets/Logo.png"
            alt=""
            className="auth-logo"
            aria-hidden="true"
          />
          <h1 className="auth-title">Mundo Fitness</h1>
          <p className="auth-description">
            Ingresa a tu cuenta para acceder al panel de control.
          </p>
        </header>

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