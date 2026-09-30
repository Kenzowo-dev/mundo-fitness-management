import { useEffect, useState } from 'react'
import {
  useNavigate,
  useParams,
} from 'react-router-dom'
import VMembershipForm, {
  type MembershipFormData,
} from '../../componentes/membresias/VMembershipForm'
import {
  getMembershipById,
  updateMembership,
} from '../../services/membresiaService'
import { STRINGS } from '../../constants/strings'

function MembershipEdit() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [initialData, setInitialData] =
    useState<
      Partial<MembershipFormData>
    >()

  const [loading, setLoading] =
    useState(true)

  useEffect(() => {
    // Carga los datos de la membresía seleccionada.
    async function loadMembership() {
      try {
        const membership =
          await getMembershipById(
            Number(id),
          )

        setInitialData({
          userId: membership.user_id
            ? String(
                membership.user_id,
              )
            : '',
          clientId: String(
            membership.client_id,
          ),
          plan: membership.plan,
          startDate:
            membership.start_date?.slice(
              0,
              10,
            ),
          endDate:
            membership.end_date?.slice(
              0,
              10,
            ),
          price: String(
            membership.price,
          ),
          status: membership.status,
        })
      } catch {
        alert(
          STRINGS.membership.loadOneError,
        )

        navigate('/membresias')
      } finally {
        setLoading(false)
      }
    }

    loadMembership()
  }, [id, navigate])

  // Actualiza la membresía con los datos del formulario.
  async function handleSubmit(
    data: MembershipFormData,
  ) {
    try {
      await updateMembership(
        Number(id),
        {
          userId: Number(
            data.userId,
          ),
          clientId: Number(
            data.clientId,
          ),
          plan: data.plan,
          startDate:
            data.startDate,
          endDate: data.endDate,
          price: Number(
            data.price,
          ),
          status: data.status,
        },
      )

      navigate('/membresias')
    } catch {
      alert(
        STRINGS.membership.updateError,
      )
    }
  }

  if (loading) {
    return <p>Cargando...</p>
  }

  return (
    <div className="pagina-editar-membresia">
      <h1>Editar membresía</h1>

      <VMembershipForm
        key={
          initialData
            ? `membership-${id}`
            : 'loading'
        }
        initialData={initialData}
        onSubmit={handleSubmit}
        submitLabel="Guardar cambios"
      />
    </div>
  )
}

export default MembershipEdit