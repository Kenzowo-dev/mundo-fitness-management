import { Link } from 'react-router-dom'
import ListaMembresias from '../../componentes/membresias/ListaMembresias'
import '../../styles/membresias/Membresias.css'

function Membresias() {
  return (
    <div className="pagina-membresias">
      <div className="pagina-header">
        <h1>Membresías</h1>
        <Link to="/membresias/nueva" className="btn-nueva-membresia">
          + Nueva membresía
        </Link>
      </div>

      <ListaMembresias />
    </div>
  )
}

export default Membresias
