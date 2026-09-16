import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import LoginInput from './LoginInput'
import { iniciarSesion } from '../../services/authService'
import '../../styles/auth/LoginForm.css'

function LoginForm() {
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!email || !password) {
      setError('Ingresa tu correo y contraseña.')
      return
    }

    try {
      const usuario = iniciarSesion(email, password)

      setError('')

      if (usuario.role === 'admin') {
        navigate('/membresias')
      } else {
        navigate('/usuario')
      }
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message)
      } else {
        setError('No se pudo iniciar sesión.')
      }
    }
  }

  return (
    <form className="login-form" onSubmit={handleSubmit}>
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

      {error && <p className="form-error">{error}</p>}

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