import { useNavigate } from 'react-router-dom'
import VMembershipForm, {
  type MembershipFormData,
} from '../../componentes/membresias/VMembershipForm'
import { createMembership } from '../../services/membresiaService'
import { STRINGS } from '../../constants/strings'

function MembershipRegistration() {
  const navigate = useNavigate()

  // Registra una nueva membresía con los datos del formulario.
  async function handleSubmit(
    data: MembershipFormData,
  ) {
    try {
      await createMembership({
        userId: Number(data.userId),
        clientId: Number(data.clientId),
        plan: data.plan,
        startDate: data.startDate,
        endDate: data.endDate,
        price: Number(data.price),
        status: data.status,
      })

      navigate('/membresias')
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : STRINGS.membership.createError,
      )
    }
  }

  return (
    <div className="pagina-registrar-membresia">
      <h1>Registrar nueva membresía</h1>

      <VMembershipForm
        onSubmit={handleSubmit}
        submitLabel="Registrar"
      />
    </div>
  )
}

export default MembershipRegistration