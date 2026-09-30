import { Link } from 'react-router-dom'
import VMembershipList from '../../componentes/membresias/VMembershipList'
import '../../styles/membresias/Membresias.css'

function Memberships() {
  return (
    <div className="pagina-membresias">
      <div className="pagina-header">
        <h1>Membresías</h1>

        <Link
          to="/membresias/nueva"
          className="btn-nueva-membresia"
        >
          + Nueva membresía
        </Link>
      </div>

      <VMembershipList />
    </div>
  )
}

export default Memberships