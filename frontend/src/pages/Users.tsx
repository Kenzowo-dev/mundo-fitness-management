import { useEffect, useState } from 'react'
import {
  removeUser,
  getUsersForAdmin,
  type User as UserRecord,
} from '../services/authService'
import {
  getMemberships,
  type Membership,
} from '../services/membresiaService'
import { STRINGS } from '../constants/strings'
import '../styles/Usuarios.css'

// Genera el código visual del usuario.
function getUserCode(id: number) {
  return `U${String(id).padStart(4, '0')}`
}

function Users() {
  const [users, setUsers] = useState<UserRecord[]>(() =>
    getUsersForAdmin(),
  )

  const [memberships, setMemberships] =
    useState<Membership[]>([])

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Carga las membresías registradas.
    async function loadMemberships() {
      try {
        const data = await getMemberships()
        setMemberships(data)
      } catch {
        setMemberships([])
      } finally {
        setLoading(false)
      }
    }

    loadMemberships()
  }, [])

  // Obtiene la membresía asociada a un usuario.
  function getUserMembership(
    userId: number,
  ): Membership | undefined {
    return memberships.find(
      (membership) =>
        membership.user_id === userId,
    )
  }

  // Confirma y elimina el usuario seleccionado.
  function handleDelete(user: UserRecord) {
    const confirmed = window.confirm(
      STRINGS.user.deleteConfirmation(
        user.fullName,
      ),
    )

    if (!confirmed) return

    try {
      removeUser(user.id)

      setUsers((currentUsers) =>
        currentUsers.filter(
          (item) => item.id !== user.id,
        ),
      )
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : STRINGS.user.deleteError,
      )
    }
  }

  return (
    <section className="usuarios-panel">
      <div className="usuarios-header">
        <div>
          <h2>Usuarios</h2>

          <p>
            Gestiona los usuarios registrados
            en Mundo Fitness.
          </p>
        </div>
      </div>

      {loading ? (
        <section className="usuarios-vacio">
          <p>Cargando información...</p>
        </section>
      ) : users.length === 0 ? (
        <section className="usuarios-vacio">
          <h3>
            No hay usuarios registrados
          </h3>

          <p>
            Cuando un usuario se registre
            aparecerá aquí.
          </p>
        </section>
      ) : (
        <section className="tabla-usuarios">
          <table>
            <thead>
              <tr>
                <th>Código</th>
                <th>Nombre</th>
                <th>Correo</th>
                <th>Teléfono</th>
                <th>Rol</th>
                <th>Membresía</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {users.map((user) => {
                const membership =
                  getUserMembership(user.id)

                return (
                  <tr key={user.id}>
                    <td>
                      {getUserCode(user.id)}
                    </td>

                    <td>
                      {user.fullName}
                    </td>

                    <td>
                      {user.email}
                    </td>

                    <td>
                      {user.phone}
                    </td>

                    <td>
                      <span
                        className={`rol rol-${user.role}`}
                      >
                        {user.role}
                      </span>
                    </td>

                    <td>
                      {user.role === 'admin' ? (
                        <span>
                          Administrador
                        </span>
                      ) : membership ? (
                        <span>
                          {membership.plan}
                        </span>
                      ) : (
                        <span>
                          Sin membresía
                        </span>
                      )}
                    </td>

                    <td>
                      {user.role === 'admin' ? (
                        <span>
                          Administrador
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            handleDelete(user)
                          }
                        >
                          Eliminar
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </section>
      )}
    </section>
  )
}

export default Users