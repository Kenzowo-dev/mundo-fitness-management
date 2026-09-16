import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getMembresiaById, deleteMembresia } from '../../services/membresiaService'

interface Membresia {
  id: number
  client_id: number
  plan: string
  start_date: string
  end_date: string
  price: number
  status: string
}

function DetalleMembresia() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [membresia, setMembresia] = useState<Membresia | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function cargar() {
      try {
        const data = await getMembresiaById(Number(id))
        setMembresia(data)
      } catch {
        setError('No se pudo cargar la membresía')
      } finally {
        setLoading(false)
      }
    }

    cargar()
  }, [id])

  async function handleEliminar() {
    const confirmado = window.confirm('¿Seguro que deseas eliminar esta membresía?')
    if (!confirmado) return

    try {
      await deleteMembresia(Number(id))
      navigate('/membresias')
    } catch {
      alert('No se pudo eliminar la membresía')
    }
  }

  if (loading) return <p>Cargando...</p>
  if (error) return <p className="error-message">{error}</p>
  if (!membresia) return null

  return (
    <div className="pagina-detalle-membresia">
      <h1>Detalle de membresía</h1>

      <ul className="detalle-lista">
        <li>
          <strong>ID:</strong> {membresia.id}
        </li>
        <li>
          <strong>Cliente:</strong> #{membresia.client_id}
        </li>
        <li>
          <strong>Plan:</strong> {membresia.plan}
        </li>
        <li>
          <strong>Inicio:</strong> {membresia.start_date}
        </li>
        <li>
          <strong>Fin:</strong> {membresia.end_date}
        </li>
        <li>
          <strong>Precio:</strong> S/ {membresia.price}
        </li>
        <li>
          <strong>Estado:</strong> {membresia.status}
        </li>
      </ul>

      <div className="detalle-acciones">
        <Link to={`/membresias/${membresia.id}/editar`}>Editar</Link>
        <button type="button" onClick={handleEliminar} className="btn-eliminar">
          Eliminar
        </button>
        <Link to="/membresias">Volver</Link>
      </div>
    </div>
  )
}

export default DetalleMembresia
