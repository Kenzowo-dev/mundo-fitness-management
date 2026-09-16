import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TarjetaMembresia from './TarjetaMembresia'
import { getMembresias, deleteMembresia } from '../../services/membresiaService'
import '../../styles/membresias/Membresias.css'

interface Membresia {
  id: number
  client_id: number
  plan: string
  start_date: string
  end_date: string
  price: number
  status: string
}

function ListaMembresias() {
  const [membresias, setMembresias] = useState<Membresia[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    cargarMembresias()
  }, [])

  async function cargarMembresias() {
    try {
      setLoading(true)
      const data = await getMembresias()
      setMembresias(data)
      setError('')
    } catch {
      setError(
        'No se pudieron cargar las membresías. Verifica que el servidor backend esté corriendo.'
      )
    } finally {
      setLoading(false)
    }
  }

  async function handleEliminar(id: number) {
    const confirmado = window.confirm('¿Seguro que deseas eliminar esta membresía?')
    if (!confirmado) return

    try {
      await deleteMembresia(id)
      setMembresias((prev) => prev.filter((m) => m.id !== id))
    } catch {
      alert('No se pudo eliminar la membresía')
    }
  }

  if (loading) return <p>Cargando membresías...</p>
  if (error) return <p className="error-message">{error}</p>

  return (
    <div className="lista-membresias">
      {membresias.length === 0 && <p>No hay membresías registradas todavía.</p>}

      {membresias.map((m) => (
        <TarjetaMembresia
          key={m.id}
          id={m.id}
          clientLabel={`Cliente #${m.client_id}`}
          plan={m.plan}
          startDate={m.start_date}
          endDate={m.end_date}
          status={m.status}
          onVerDetalle={(id) => navigate(`/membresias/${id}`)}
          onEditar={(id) => navigate(`/membresias/${id}/editar`)}
          onEliminar={handleEliminar}
        />
      ))}
    </div>
  )
}

export default ListaMembresias
