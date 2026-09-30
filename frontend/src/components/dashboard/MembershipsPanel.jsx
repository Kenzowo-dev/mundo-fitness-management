import { useEffect, useState } from 'react'
import {
  getMemberships,
  getMembershipById,
  createMembership,
  updateMembership,
  deleteMembership,
} from '../../services/membresiaService'
import { getUsersForAdmin } from '../../services/authService'
import VMembershipForm from '../../componentes/membresias/VMembershipForm'
import MembershipCard from '../../componentes/membresias/MembershipCard'
import { STRINGS } from '../../constants/strings'
import '../../styles/membresias/Membresias.css'

// Genera el código visible de una membresía.
function getMembershipCode(id) {
  return `M${String(id).padStart(4, '0')}`
}

// Genera el código visible de un usuario.
function getUserCode(id) {
  return `U${String(id).padStart(4, '0')}`
}

function MembershipsPanel() {
  const [memberships, setMemberships] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [view, setView] = useState('lista')
  const [selectedMembership, setSelectedMembership] =
    useState(null)

  // Carga las membresías y los usuarios registrados.
  async function loadData() {
    try {
      setLoading(true)

      const [membershipData, userData] =
        await Promise.all([
          getMemberships(),
          getUsersForAdmin(),
        ])

      setMemberships(membershipData)
      setUsers(userData)
      setError('')
    } catch {
      setError(
        STRINGS.membership.loadError,
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Busca un usuario mediante su identificador.
  function getUser(id) {
    return users.find((user) => user.id === id)
  }

  // Abre el formulario para registrar una membresía.
  function handleNew() {
    setSelectedMembership(null)
    setView('nueva')
  }

  // Carga una membresía y abre el formulario de edición.
  async function handleEdit(id) {
    try {
      const membership =
        await getMembershipById(id)

      setSelectedMembership(membership)
      setView('editar')
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : STRINGS.membership.loadOneError,
      )
    }
  }

  // Carga una membresía y muestra su detalle.
  async function handleDetail(id) {
    try {
      const membership =
        await getMembershipById(id)

      setSelectedMembership(membership)
      setView('detalle')
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : STRINGS.membership.loadOneError,
      )
    }
  }

  // Elimina una membresía después de confirmar la acción.
  async function handleDelete(id) {
    const confirmed = window.confirm(
      STRINGS.membership.deleteConfirmation,
    )

    if (!confirmed) return

    try {
      await deleteMembership(id)

      setMemberships((currentMemberships) =>
        currentMemberships.filter(
          (membership) => membership.id !== id,
        ),
      )

      if (
        selectedMembership &&
        selectedMembership.id === id
      ) {
        setSelectedMembership(null)
        setView('lista')
      }
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : STRINGS.membership.deleteError,
      )
    }
  }

  // Registra una nueva membresía.
  async function handleCreate(data) {
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

      await loadData()
      setView('lista')
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : STRINGS.membership.createError,
      )
    }
  }

  // Actualiza una membresía existente.
  async function handleUpdate(data) {
    if (!selectedMembership) return

    try {
      await updateMembership(
        selectedMembership.id,
        {
          userId: Number(data.userId),
          clientId: Number(data.clientId),
          plan: data.plan,
          startDate: data.startDate,
          endDate: data.endDate,
          price: Number(data.price),
          status: data.status,
        },
      )

      await loadData()
      setSelectedMembership(null)
      setView('lista')
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : STRINGS.membership.updateError,
      )
    }
  }

  // Regresa a la lista de membresías.
  function backToList() {
    setSelectedMembership(null)
    setView('lista')
  }

  if (loading) {
    return (
      <section className="panel-membresias">
        <h2>Membresías</h2>
        <p>Cargando membresías...</p>
      </section>
    )
  }

  if (error) {
    return (
      <section className="panel-membresias">
        <h2>Membresías</h2>
        <p className="error-message">{error}</p>
      </section>
    )
  }

  if (view === 'nueva') {
    return (
      <section className="panel-membresias">
        <div className="pagina-header">
          <div>
            <h2>Nueva membresía</h2>

            <p>
              Registra una nueva membresía para un
              usuario.
            </p>
          </div>

          <button
            type="button"
            className="btn-nueva-membresia"
            onClick={backToList}
          >
            Volver
          </button>
        </div>

        <VMembershipForm
          onSubmit={handleCreate}
          submitLabel="Registrar membresía"
        />
      </section>
    )
  }

  if (
    view === 'editar' &&
    selectedMembership
  ) {
    return (
      <section className="panel-membresias">
        <div className="pagina-header">
          <div>
            <h2>
              Editar{' '}
              {getMembershipCode(
                selectedMembership.id,
              )}
            </h2>

            <p>
              Modifica los datos de la membresía.
            </p>
          </div>

          <button
            type="button"
            className="btn-nueva-membresia"
            onClick={backToList}
          >
            Volver
          </button>
        </div>

        <VMembershipForm
          key={`editar-${selectedMembership.id}`}
          initialData={{
            userId: selectedMembership.user_id
              ? String(
                  selectedMembership.user_id,
                )
              : '',
            clientId: String(
              selectedMembership.client_id,
            ),
            plan: selectedMembership.plan,
            startDate:
              selectedMembership.start_date?.slice(
                0,
                10,
              ),
            endDate:
              selectedMembership.end_date?.slice(
                0,
                10,
              ),
            price: String(
              selectedMembership.price,
            ),
            status: selectedMembership.status,
          }}
          onSubmit={handleUpdate}
          submitLabel="Guardar cambios"
        />
      </section>
    )
  }

  if (
    view === 'detalle' &&
    selectedMembership
  ) {
    const user = getUser(
      selectedMembership.user_id,
    )

    return (
      <section className="panel-membresias">
        <div className="pagina-header">
          <div>
            <h2>
              Detalle{' '}
              {getMembershipCode(
                selectedMembership.id,
              )}
            </h2>

            <p>
              Información de la membresía
              seleccionada.
            </p>
          </div>

          <button
            type="button"
            className="btn-nueva-membresia"
            onClick={backToList}
          >
            Volver
          </button>
        </div>

        <div className="detalle-lista">
          <li>
            <strong>Código</strong>

            <span>
              {getMembershipCode(
                selectedMembership.id,
              )}
            </span>
          </li>

          <li>
            <strong>Usuario</strong>

            <span>
              {user
                ? `${getUserCode(user.id)} - ${user.fullName}`
                : 'Sin usuario asociado'}
            </span>
          </li>

          <li>
            <strong>Correo</strong>

            <span>
              {user ? user.email : '—'}
            </span>
          </li>

          <li>
            <strong>ID del cliente</strong>

            <span>
              {selectedMembership.client_id}
            </span>
          </li>

          <li>
            <strong>Plan</strong>

            <span>
              {selectedMembership.plan}
            </span>
          </li>

          <li>
            <strong>Fecha de inicio</strong>

            <span>
              {selectedMembership.start_date}
            </span>
          </li>

          <li>
            <strong>Fecha de fin</strong>

            <span>
              {selectedMembership.end_date}
            </span>
          </li>

          <li>
            <strong>Precio</strong>

            <span>
              S/{' '}
              {Number(
                selectedMembership.price,
              ).toFixed(2)}
            </span>
          </li>

          <li>
            <strong>Estado</strong>

            <span>
              {selectedMembership.status}
            </span>
          </li>
        </div>

        <div className="detalle-acciones">
          <button
            type="button"
            onClick={() =>
              handleEdit(
                selectedMembership.id,
              )
            }
          >
            Editar
          </button>

          <button
            type="button"
            className="btn-eliminar"
            onClick={() =>
              handleDelete(
                selectedMembership.id,
              )
            }
          >
            Eliminar
          </button>
        </div>
      </section>
    )
  }

  return (
    <section className="panel-membresias">
      <div className="pagina-header">
        <div>
          <h2>Membresías</h2>

          <p>
            Gestiona las membresías de Mundo
            Fitness.
          </p>
        </div>

        <button
          type="button"
          className="btn-nueva-membresia"
          onClick={handleNew}
        >
          + Nueva membresía
        </button>
      </div>

      {memberships.length === 0 ? (
        <section className="usuarios-vacio">
          <h3>No hay membresías registradas</h3>

          <p>
            Cuando registres una membresía
            aparecerá aquí.
          </p>
        </section>
      ) : (
        <div className="lista-membresias">
          {memberships.map((membership) => {
            const user = getUser(
              membership.user_id,
            )

            return (
              <div
                className="tarjeta-membresia-con-usuario"
                key={membership.id}
              >
                <div className="membresia-identificacion">
                  <strong>
                    {getMembershipCode(
                      membership.id,
                    )}
                  </strong>

                  <span>
                    {user
                      ? `${getUserCode(user.id)} - ${user.fullName}`
                      : 'Sin usuario asociado'}
                  </span>
                </div>

                <div className="tarjeta-membresia-wrapper">
                  <MembershipCard
                    id={membership.id}
                    clientLabel={`Cliente #${membership.client_id}`}
                    plan={membership.plan}
                    startDate={
                      membership.start_date
                    }
                    endDate={
                      membership.end_date
                    }
                    status={membership.status}
                    onVerDetalle={handleDetail}
                    onEditar={handleEdit}
                    onDelete={handleDelete}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}

export default MembershipsPanel