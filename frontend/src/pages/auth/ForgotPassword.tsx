import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForgotPassword } from '@/hooks/useApi'
import '@/styles/auth/ForgotPassword.css'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const forgotPasswordMutation = useForgotPassword()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await forgotPasswordMutation.mutateAsync(email)
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al solicitar recuperación')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <main className="auth-container" role="main">
        <div className="auth-card success-state">
          <header className="auth-header">
            <img
              src="/assets/Logo.png"
              alt=""
              className="auth-logo"
              aria-hidden="true"
            />
            <h1 className="auth-title">¡Correo enviado!</h1>
            <p className="auth-description">
              Si la cuenta existe, recibirás un enlace para restablecer tu contraseña
              en los próximos minutos. Revisa tu bandeja de entrada y la carpeta de spam.
            </p>
          </header>

          <footer className="auth-footer">
            <Link to="/login" className="auth-back-link">
              ← Volver al inicio de sesión
            </Link>
          </footer>
        </div>
      </main>
    )
  }

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
          <h1 className="auth-title">Recuperar contraseña</h1>
          <p className="auth-description">
            Ingresa tu correo electrónico y te enviaremos un enlace
            para restablecer tu contraseña.
          </p>
        </header>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {error && (
            <div className="auth-error auth-error--global" role="alert" aria-live="assertive">
              {error}
            </div>
          )}

          <div className="auth-form-group">
            <label htmlFor="email" className="auth-label">
              Correo electrónico
            </label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="ejemplo@correo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={(e) => {
                const value = e.target.value
                if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                  // Validación básica inline, el backend validará la existencia
                }
              }}
              disabled={loading}
              className="auth-input"
              autoComplete="email"
              required
            />
          </div>

          <button
            type="submit"
            className="auth-submit"
            disabled={loading}
          >
            {loading ? 'Enviando...' : 'Enviar enlace de recuperación'}
          </button>
        </form>

        <footer className="auth-footer">
          <Link to="/login" className="auth-back-link">
            ← Volver al inicio de sesión
          </Link>
        </footer>
      </div>
    </main>
  )
}