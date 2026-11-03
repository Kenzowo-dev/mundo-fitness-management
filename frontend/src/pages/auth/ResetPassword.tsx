import AuthShell from "../../components/AuthShell";
import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useResetPassword } from "@/hooks/useApi";
import "@/styles/auth/ResetPassword.css";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const resetPasswordMutation = useResetPassword();

  const inputType = showPassword ? "text" : "password";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password) {
      setError("La contraseña es obligatoria");
      return;
    }

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres");
      return;
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    if (!token) {
      setError("Token de recuperación no válido o expirado");
      return;
    }

    setError("");
    setLoading(true);

    try {
      await resetPasswordMutation.mutateAsync({ token, newPassword: password });
      setSuccess(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Error al restablecer la contraseña",
      );
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <AuthShell>
        <main className="auth-container" role="main">
          <div className="auth-card error-state">
            <header className="auth-header">
              <h1 className="auth-title">Enlace no válido</h1>
              <p className="auth-description">
                El enlace de recuperación ha expirado o no es válido. Solicita
                uno nuevo.
              </p>
            </header>

            <footer className="auth-footer">
              <Link to="/forgot-password" className="auth-submit">
                Solicitar nuevo enlace
              </Link>
              <Link to="/login" className="auth-back-link">
                ← Volver al inicio de sesión
              </Link>
            </footer>
          </div>
        </main>
      </AuthShell>
    );
  }

  if (success) {
    return (
      <AuthShell>
        <main className="auth-container" role="main">
          <div className="auth-card success-state">
            <header className="auth-header">
              <h1 className="auth-title">¡Contraseña actualizada!</h1>
              <p className="auth-description">
                Tu contraseña ha sido restablecida correctamente. Ya puedes
                iniciar sesión con tu nueva contraseña.
              </p>
            </header>

            <footer className="auth-footer">
              <Link to="/login" className="auth-submit">
                Iniciar sesión
              </Link>
            </footer>
          </div>
        </main>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <main className="auth-container" role="main">
        <div className="auth-card">
          <header className="auth-header">
            <h1 className="auth-title">Restablecer contraseña</h1>
            <p className="auth-description">
              Ingresa tu nueva contraseña. Debe tener al menos 8 caracteres.
            </p>
          </header>

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            {error && (
              <div
                className="auth-error auth-error--global"
                role="alert"
                aria-live="assertive"
              >
                {error}
              </div>
            )}

            <div className="auth-form-group">
              <label htmlFor="password" className="auth-label">
                Nueva contraseña
              </label>
              <div className="auth-input-wrapper">
                <input
                  id="password"
                  name="password"
                  type={inputType}
                  placeholder="Mínimo 8 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="auth-input"
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={
                    showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                  }
                  aria-pressed={showPassword}
                  disabled={loading}
                >
                  {showPassword ? (
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      aria-hidden="true"
                    >
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      aria-hidden="true"
                    >
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="auth-form-group">
              <label htmlFor="confirmPassword" className="auth-label">
                Confirmar nueva contraseña
              </label>
              <div className="auth-input-wrapper">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={inputType}
                  placeholder="Repite tu nueva contraseña"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                  className="auth-input"
                  autoComplete="new-password"
                  required
                />
              </div>
            </div>

            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? "Restableciendo..." : "Restablecer contraseña"}
            </button>
          </form>

          <footer className="auth-footer">
            <Link to="/login" className="auth-back-link">
              ← Volver al inicio de sesión
            </Link>
          </footer>
        </div>
      </main>
    </AuthShell>
  );
}
