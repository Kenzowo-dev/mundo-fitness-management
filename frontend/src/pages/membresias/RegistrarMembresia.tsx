import { useNavigate } from 'react-router-dom'
import FormularioMembresia, {
  type MembresiaFormData,
} from '../../componentes/membresias/FormularioMembresia'
import { createMembresia } from '../../services/membresiaService'

function RegistrarMembresia() {
  const navigate = useNavigate()

  async function handleSubmit(data: MembresiaFormData) {
    try {
      await createMembresia({
        clientId: Number(data.clientId),
        plan: data.plan,
        startDate: data.startDate,
        endDate: data.endDate,
        price: Number(data.price),
        status: data.status,
      })
      navigate('/membresias')
    } catch {
      alert('No se pudo registrar la membresía')
    }
  }

  return (
    <div className="pagina-registrar-membresia">
      <h1>Registrar nueva membresía</h1>
      <FormularioMembresia onSubmit={handleSubmit} submitLabel="Registrar" />
    </div>
  )
}

export default RegistrarMembresia
