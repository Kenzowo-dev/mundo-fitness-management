import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  eliminarUsuario,
  obtenerUsuariosAdmin,
  type Usuario,
} from '../services/authService'
import {
  getMembresias,
  type Membresia,
} from '../services/membresiaService'
import '../styles/Usuarios.css'

function Usuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>(() =>
    obtenerUsuariosAdmin(),
  )

  const [membresias, setMembresias] = useState<Membresia[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function cargarMembresias() {
      try {
        const datos = await getMembresias()
        setMembresias(datos)
      } catch {
        setMembresias([])
      } finally {
        setLoading(false)
      }
    }

    cargarMembresias()
  }, [])

  function obtenerMembresiaUsuario(
    usuarioId: number,
  ): Membresia | undefined {
    return membresias.find(
      (membresia) => membresia.user_id === usuarioId,
    )
  }

  function handleEliminar(usuario: Usuario) {
    const confirmar = window.confirm(
      `¿Seguro que deseas eliminar a ${usuario.fullName}?`,
    )

    if (!confirmar) return

    try {
      eliminarUsuario(usuario.id)

      setUsuarios((usuariosActuales) =>
        usuariosActuales.filter(
          (item) => item.id !== usuario.id,
        ),
      )
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : 'No se pudo eliminar el usuario',
      )
    }
  }

  return (
    <div className="pagina-usuarios">
      <header>
        <div>
          <h1>Mundo Fitness</h1>
          <p>Administración de usuarios</p>
        </div>

        <Link to="/membresias">
          Administrar membresías
        </Link>
      </header>

      <main>
        <div className="usuarios-header">
          <div>
            <h2>Usuarios</h2>

            <p>
              Gestiona los usuarios registrados en Mundo Fitness.
            </p>
          </div>

          <Link to="/">
            Volver al inicio
          </Link>
        </div>

        {loading ? (
          <section className="usuarios-vacio">
            <p>Cargando información...</p>
          </section>
        ) : usuarios.length === 0 ? (
          <section className="usuarios-vacio">
            <h3>No hay usuarios registrados</h3>

            <p>
              Cuando un usuario se registre aparecerá aquí.
            </p>
          </section>
        ) : (
          <section className="tabla-usuarios">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nombre</th>
                  <th>Correo</th>
                  <th>Teléfono</th>
                  <th>Rol</th>
                  <th>Membresía</th>
                  <th>Acciones</th>
                </tr>
              </thead>

              <tbody>
                {usuarios.map((usuario) => {
                  const membresia = obtenerMembresiaUsuario(
                    usuario.id,
                  )

                  return (
                    <tr key={usuario.id}>
                      <td>{usuario.id}</td>

                      <td>{usuario.fullName}</td>

                      <td>{usuario.email}</td>

                      <td>{usuario.phone}</td>

                      <td>
                        <span
                          className={`rol rol-${usuario.role}`}
                        >
                          {usuario.role}
                        </span>
                      </td>

                      <td>
                        {usuario.role === 'admin' ? (
                          <span>Administrador</span>
                        ) : membresia ? (
                          <span>
                            {membresia.plan}
                          </span>
                        ) : (
                          <span>
                            Sin membresía
                          </span>
                        )}
                      </td>

                      <td>
                        {usuario.role === 'admin' ? (
                          <span>Administrador</span>
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              handleEliminar(usuario)
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
      </main>
    </div>
  )
}

export default Usuarios
