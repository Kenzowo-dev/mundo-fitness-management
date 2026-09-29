import { useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/useAuth'
import '@/styles/auth/Register.css'

export default function Register() {
  const navigate = useNavigate()
  const { register } = useAuth()

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    birthDate: '',
    gender: '',
  })

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }))

    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const next = { ...prev }
        delete next[name]
        return next
      })
    }

    if (error) {
      setError('')
    }
  }

  const validateField = (name: string, value: string): string | null => {
    switch (name) {
      case 'firstName':
      case 'lastName':
        if (!value.trim()) return 'Este campo es obligatorio'
        return null
      case 'email':
        if (!value.trim()) return 'El correo es obligatorio'
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Formato de correo inválido'
        return null
      case 'password':
        if (!value) return 'La contraseña es obligatoria'
        if (value.length < 8) return 'Mínimo 8 caracteres'
        return null
      case 'confirmPassword':
        if (!value) return 'Confirma tu contraseña'
        if (value !== formData.password) return 'Las contraseñas no coinciden'
        return null
      case 'phone':
        if (!value.trim()) return 'El teléfono es obligatorio'
        return null
      case 'birthDate':
        if (!value) return 'La fecha de nacimiento es obligatoria'
        return null
      case 'gender':
        if (!value) return 'Selecciona una opción'
        return null
      default:
        return null
    }
  }

  const handleBlur = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target
    const fieldError = validateField(name, value)
    if (fieldError) {
      setFieldErrors((prev) => ({ ...prev, [name]: fieldError }))
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const newFieldErrors: Record<string, string> = {}
    let hasErrors = false

    ;(Object.keys(formData) as Array<keyof typeof formData>).forEach((key) => {
      const fieldError = validateField(key, formData[key])
      if (fieldError) {
        newFieldErrors[key] = fieldError
        hasErrors = true
      }
    })

    if (hasErrors) {
      setFieldErrors(newFieldErrors)
      setError('Por favor, corrige los errores del formulario.')
      return
    }

    setError('')
    setLoading(true)

    try {
      await register({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        birthDate: formData.birthDate,
        gender: formData.gender,
      })
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrar')
    } finally {
      setLoading(false)
    }
  }

  const inputType = showPassword ? 'text' : 'password'

  if (success) {
    return (
      <main className="auth-container" role="main">
        <div className="auth-card success-state">
          <header className="auth-header">
            <img
              src="/src/assets/Logo.png"
              alt=""
              className="auth-logo"
              aria-hidden="true"
            />
            <h1>¡Registro exitoso!</h1>
            <p>
              Tu cuenta ha sido creada correctamente. Ya puedes comenzar a
              disfrutar de tu experiencia en Mundo Fitness.
            </p>
          </header>

          <footer className="auth-footer">
            <button
              type="button"
              className="auth-submit"
              onClick={() => navigate('/')}
            >
              Volver al inicio
            </button>
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
            src="/src/assets/Logo.png"
            alt=""
            className="auth-logo"
            aria-hidden="true"
          />
          <h1 className="auth-title">Crear una cuenta</h1>
          <p className="auth-description">
            Completa tus datos para comenzar tu experiencia.
          </p>
        </header>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {error && (
            <div className="auth-error auth-error--global" role="alert" aria-live="assertive">
              {error}
            </div>
          )}

          <div className="auth-form-row">
            <div className="auth-form-group">
              <label htmlFor="firstName" className="auth-label">
                Nombre
              </label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                placeholder="Ingresa tu nombre"
                value={formData.firstName}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={loading}
                className="auth-input"
                aria-invalid={fieldErrors.firstName ? 'true' : 'false'}
                aria-describedby={fieldErrors.firstName ? 'firstName-error' : undefined}
                autoComplete="given-name"
              />
              {fieldErrors.firstName && (
                <p id="firstName-error" className="auth-field-error" role="alert">
                  {fieldErrors.firstName}
                </p>
              )}
            </div>

            <div className="auth-form-group">
              <label htmlFor="lastName" className="auth-label">
                Apellido
              </label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                placeholder="Ingresa tu apellido"
                value={formData.lastName}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={loading}
                className="auth-input"
                aria-invalid={fieldErrors.lastName ? 'true' : 'false'}
                aria-describedby={fieldErrors.lastName ? 'lastName-error' : undefined}
                autoComplete="family-name"
              />
              {fieldErrors.lastName && (
                <p id="lastName-error" className="auth-field-error" role="alert">
                  {fieldErrors.lastName}
                </p>
              )}
            </div>
          </div>

          <div className="auth-form-group">
            <label htmlFor="email" className="auth-label">
              Correo electrónico
            </label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="ejemplo@correo.com"
              value={formData.email}
              onChange={handleChange}
              onBlur={handleBlur}
              disabled={loading}
              className="auth-input"
              aria-invalid={fieldErrors.email ? 'true' : 'false'}
              aria-describedby={fieldErrors.email ? 'email-error' : undefined}
              autoComplete="email"
            />
            {fieldErrors.email && (
              <p id="email-error" className="auth-field-error" role="alert">
                {fieldErrors.email}
              </p>
            )}
          </div>

          <div className="auth-form-row">
            <div className="auth-form-group">
              <label htmlFor="password" className="auth-label">
                Contraseña
              </label>
              <div className="auth-input-wrapper">
                <input
                  id="password"
                  name="password"
                  type={inputType}
                  placeholder="Mínimo 8 caracteres"
                  value={formData.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={loading}
                  className="auth-input"
                  aria-invalid={fieldErrors.password ? 'true' : 'false'}
                  aria-describedby={fieldErrors.password ? 'password-error' : undefined}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  aria-pressed={showPassword}
                  disabled={loading}
                >
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              {fieldErrors.password && (
                <p id="password-error" className="auth-field-error" role="alert">
                  {fieldErrors.password}
                </p>
              )}
            </div>

            <div className="auth-form-group">
              <label htmlFor="confirmPassword" className="auth-label">
                Confirmar contraseña
              </label>
              <div className="auth-input-wrapper">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={inputType}
                  placeholder="Repite tu contraseña"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={loading}
                  className="auth-input"
                  aria-invalid={fieldErrors.confirmPassword ? 'true' : 'false'}
                  aria-describedby={fieldErrors.confirmPassword ? 'confirmPassword-error' : undefined}
                  autoComplete="new-password"
                />
              </div>
              {fieldErrors.confirmPassword && (
                <p id="confirmPassword-error" className="auth-field-error" role="alert">
                  {fieldErrors.confirmPassword}
                </p>
              )}
            </div>
          </div>

          <div className="auth-form-row">
            <div className="auth-form-group">
              <label htmlFor="phone" className="auth-label">
                Número de teléfono
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                placeholder="Ej. 987654321"
                value={formData.phone}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={loading}
                className="auth-input"
                aria-invalid={fieldErrors.phone ? 'true' : 'false'}
                aria-describedby={fieldErrors.phone ? 'phone-error' : undefined}
                autoComplete="tel"
              />
              {fieldErrors.phone && (
                <p id="phone-error" className="auth-field-error" role="alert">
                  {fieldErrors.phone}
                </p>
              )}
            </div>

            <div className="auth-form-group">
              <label htmlFor="birthDate" className="auth-label">
                Fecha de nacimiento
              </label>
              <input
                id="birthDate"
                name="birthDate"
                type="date"
                value={formData.birthDate}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={loading}
                className="auth-input"
                aria-invalid={fieldErrors.birthDate ? 'true' : 'false'}
                aria-describedby={fieldErrors.birthDate ? 'birthDate-error' : undefined}
                autoComplete="bday"
              />
              {fieldErrors.birthDate && (
                <p id="birthDate-error" className="auth-field-error" role="alert">
                  {fieldErrors.birthDate}
                </p>
              )}
            </div>
          </div>

          <div className="auth-form-group">
            <label htmlFor="gender" className="auth-label">
              Género
            </label>
            <select
              id="gender"
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              onBlur={handleBlur}
              disabled={loading}
              className="auth-input auth-select"
              aria-invalid={fieldErrors.gender ? 'true' : 'false'}
              aria-describedby={fieldErrors.gender ? 'gender-error' : undefined}
            >
              <option value="">Selecciona una opción</option>
              <option value="masculino">Masculino</option>
              <option value="femenino">Femenino</option>
              <option value="otro">Otro</option>
            </select>
            {fieldErrors.gender && (
              <p id="gender-error" className="auth-field-error" role="alert">
                {fieldErrors.gender}
              </p>
            )}
          </div>

          <button
            type="submit"
            className="auth-submit"
            disabled={loading}
          >
            {loading ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>
        </form>

        <footer className="auth-footer">
          <button
            type="button"
            className="auth-back-link"
            onClick={() => navigate('/')}
            disabled={loading}
          >
            ← Volver al inicio
          </button>
        </footer>
      </div>
    </main>
  )
}