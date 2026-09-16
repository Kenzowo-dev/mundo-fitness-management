import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TarjetaMembresia from './TarjetaMembresia'
import {
  getMembresias,
  deleteMembresia,
  type Membresia,
} from '../../services/membresiaService'
import '../../styles/membresias/Membresias.css'

function ListaMembresias() {
  const [membresias, setMembresias] = useState<Membresia[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const navigate = useNavigate()

  useEffect(() => {
    let activo = true

    async function cargarMembresias() {
      try {
        const data = await getMembresias()

        if (!activo) return

        setMembresias(data)
        setError('')
      } catch {
        if (!activo) return

        setError('No se pudieron cargar las membresías.')
      } finally {
        if (activo) {
          setLoading(false)
        }
      }
    }

    cargarMembresias()

    return () => {
      activo = false
    }
  }, [])

  async function handleEliminar(id: number) {
    const confirmado = window.confirm(
      '¿Seguro que deseas eliminar esta membresía?'
    )

    if (!confirmado) return

    try {
      await deleteMembresia(id)

      setMembresias((prev) => prev.filter((m) => m.id !== id))
    } catch {
      alert('No se pudo eliminar la membresía')
    }
  }

  if (loading) {
    return <p>Cargando membresías...</p>
  }

  if (error) {
    return <p className="error-message">{error}</p>
  }

  return (
    <div className="lista-membresias">
      {membresias.length === 0 && (
        <p>No hay membresías registradas todavía.</p>
      )}

      {membresias.map((membresia) => (
        <TarjetaMembresia
          key={membresia.id}
          id={membresia.id}
          clientLabel={`Cliente #${membresia.client_id}`}
          plan={membresia.plan}
          startDate={membresia.start_date}
          endDate={membresia.end_date}
          status={membresia.status}
          onVerDetalle={(id) => navigate(`/membresias/${id}`)}
          onEditar={(id) => navigate(`/membresias/${id}/editar`)}
          onEliminar={handleEliminar}
        />
      ))}
    </div>
  )
}

export default ListaMembresias