import { Navigate, Outlet } from 'react-router-dom'
import { obtenerUsuarioActual } from '../services/authService'

interface RutaProtegidaProps {
  roles?: ('admin' | 'lite')[]
}

function RutaProtegida({
  roles,
}: RutaProtegidaProps) {
  const usuario = obtenerUsuarioActual()

  if (!usuario) {
    return <Navigate to="/login" replace />
  }

  if (
    roles &&
    !roles.includes(usuario.role)
  ) {
    if (usuario.role === 'lite') {
      return <Navigate to="/usuario" replace />
    }

    return <Navigate to="/" replace />
  }

  return <Outlet />
}

export default RutaProtegida
