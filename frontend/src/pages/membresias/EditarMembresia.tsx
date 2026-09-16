import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import FormularioMembresia, {
  type MembresiaFormData,
} from '../../componentes/membresias/FormularioMembresia'
import {
  getMembresiaById,
  updateMembresia,
} from '../../services/membresiaService'

function EditarMembresia() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [initialData, setInitialData] =
    useState<Partial<MembresiaFormData>>()

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function cargar() {
      try {
        const m = await getMembresiaById(Number(id))

        setInitialData({
          userId: m.user_id ? String(m.user_id) : '',
          clientId: String(m.client_id),
          plan: m.plan,
          startDate: m.start_date?.slice(0, 10),
          endDate: m.end_date?.slice(0, 10),
          price: String(m.price),
          status: m.status,
        })
      } catch {
        alert('No se pudo cargar la membresía')
        navigate('/membresias')
      } finally {
        setLoading(false)
      }
    }

    cargar()
  }, [id, navigate])

  async function handleSubmit(data: MembresiaFormData) {
    try {
      await updateMembresia(Number(id), {
        userId: Number(data.userId),
        clientId: Number(data.clientId),
        plan: data.plan,
        startDate: data.startDate,
        endDate: data.endDate,
        price: Number(data.price),
        status: data.status,
      })

      navigate('/membresias')
    } catch {
      alert('No se pudo actualizar la membresía')
    }
  }

  if (loading) {
    return <p>Cargando...</p>
  }

  return (
    <div className="pagina-editar-membresia">
      <h1>Editar membresía</h1>

        <FormularioMembresia
        key={initialData ? `membresia-${id}` : 'cargando'}
        initialData={initialData}
         onSubmit={handleSubmit}
           submitLabel="Guardar cambios"
/>
    </div>
  )
}

export default EditarMembresia