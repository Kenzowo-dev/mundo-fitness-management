import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import LoginInput from './LoginInput'
import { STRINGS } from '../../constants/strings'
import { login } from '../../services/authService'
import '../../styles/auth/LoginForm.css'

function LoginForm() {
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] =
    useState('')

  const [error, setError] =
    useState('')

  // Valida las credenciales e inicia la sesión del usuario.
  function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    if (!email || !password) {
      setError(
        STRINGS.auth.loginRequiredFields,
      )
      return
    }

    try {
      const user = login(
        email,
        password,
      )

      setError('')

      if (user.role === 'admin') {
        navigate('/dashboard')
      } else {
        navigate('/usuario')
      }
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message)
      } else {
        setError(
          STRINGS.auth.loginError,
        )
      }
    }
  }

  return (
    <form
      className="login-form"
      onSubmit={handleSubmit}
    >
      <LoginInput
        label="Correo electrónico"
        type="email"
        id="email"
        placeholder="Ingresa tu correo"
        value={email}
        onChange={setEmail}
      />

      <LoginInput
        label="Contraseña"
        type="password"
        id="password"
        placeholder="Ingresa tu contraseña"
        value={password}
        onChange={setPassword}
      />

      {error && (
        <p className="form-error">
          {error}
        </p>
      )}

      <button
        type="submit"
        className="login-button"
      >
        Ingresar
      </button>
    </form>
  )
}

export default LoginForm