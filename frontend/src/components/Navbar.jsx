import { useNavigate } from 'react-router-dom'
import { logout } from '../services/authService'
import './Navbar.css'

function Navbar() {
  const navigate = useNavigate()

  // Cierra la sesión y redirige al inicio de sesión.
  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className="admin-navbar">
      <div>
        <h1>Panel de administración</h1>
        <p>Gestiona Mundo Fitness desde aquí</p>
      </div>

      <button
        className="logout-button"
        onClick={handleLogout}
      >
        Cerrar sesión
      </button>
    </header>
  )
}

export default Navbar