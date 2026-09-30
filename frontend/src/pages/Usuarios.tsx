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

  function obtenerIniciales(nombre: string) {
    return nombre
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((parte) => parte[0])
      .join('')
      .toUpperCase()
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

  const administradores = usuarios.filter(
    (usuario) => usuario.role === 'admin',
  ).length

  const usuariosActivos = usuarios.filter(
    (usuario) => usuario.role !== 'admin',
  ).length

  const usuariosConMembresia = usuarios.filter((usuario) => {
    if (usuario.role === 'admin') return false

    return Boolean(obtenerMembresiaUsuario(usuario.id))
  }).length

  return (
    <div className="pagina-usuarios">
      <header className="usuarios-topbar">
        <div className="marca">
          <div className="marca-icono">MF</div>

          <div>
            <h1>Mundo Fitness</h1>
            <span>Panel administrativo</span>
          </div>
        </div>

        <div className="topbar-acciones">
          <Link
            className="btn-membresias"
            to="/membresias"
          >
            <span>💳</span>
            Administrar membresías
          </Link>

          <Link
            className="btn-inicio"
            to="/"
          >
            Inicio
          </Link>
        </div>
      </header>

      <main className="usuarios-main">
        <section className="usuarios-intro">
          <div>
            <span className="seccion-label">
              ADMINISTRACIÓN
            </span>

            <h2>Usuarios</h2>

            <p>
              Gestiona los usuarios registrados en
              <strong> Mundo Fitness</strong>.
            </p>
          </div>
        </section>

        <section className="usuarios-stats">
          <div className="stat-card">
            <div className="stat-icon usuarios-icon">
              👥
            </div>

            <div>
              <span>Total usuarios</span>
              <strong>{usuarios.length}</strong>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon activos-icon">
              ✓
            </div>

            <div>
              <span>Usuarios registrados</span>
              <strong>{usuariosActivos}</strong>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon membresia-icon">
              💳
            </div>

            <div>
              <span>Con membresía</span>
              <strong>{usuariosConMembresia}</strong>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon admin-icon">
              🛡
            </div>

            <div>
              <span>Administradores</span>
              <strong>{administradores}</strong>
            </div>
          </div>
        </section>

        <section className="usuarios-panel">
          <div className="panel-header">
            <div>
              <h3>Usuarios registrados</h3>

              <p>
                Consulta y administra las cuentas de
                Mundo Fitness.
              </p>
            </div>

            <span className="contador-usuarios">
              {usuarios.length}{' '}
              {usuarios.length === 1
                ? 'usuario'
                : 'usuarios'}
            </span>
          </div>

          {loading ? (
            <div className="usuarios-vacio">
              <div className="loading-spinner"></div>

              <h3>Cargando usuarios</h3>

              <p>
                Estamos obteniendo la información...
              </p>
            </div>
          ) : usuarios.length === 0 ? (
            <div className="usuarios-vacio">
              <div className="vacio-icon">👥</div>

              <h3>No hay usuarios registrados</h3>

              <p>
                Cuando un usuario se registre
                aparecerá aquí.
              </p>
            </div>
          ) : (
            <div className="tabla-responsive">
              <table>
                <thead>
                  <tr>
                    <th>Usuario</th>
                    <th>Correo</th>
                    <th>Teléfono</th>
                    <th>Rol</th>
                    <th>Membresía</th>
                    <th>Acciones</th>
                  </tr>
                </thead>

                <tbody>
                  {usuarios.map((usuario) => {
                    const membresia =
                      obtenerMembresiaUsuario(usuario.id)

                    return (
                      <tr key={usuario.id}>
                        <td>
                          <div className="usuario-info">
                            <div className="usuario-avatar">
                              {obtenerIniciales(
                                usuario.fullName,
                              )}
                            </div>

                            <div>
                              <strong>
                                {usuario.fullName}
                              </strong>

                              <span>
                                ID #{usuario.id}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td>
                          <span className="dato-correo">
                            {usuario.email}
                          </span>
                        </td>

                        <td>
                          <span className="dato-telefono">
                            {usuario.phone || 'No registrado'}
                          </span>
                        </td>

                        <td>
                          <span
                            className={`rol-badge rol-${usuario.role}`}
                          >
                            <span className="badge-dot"></span>

                            {usuario.role === 'admin'
                              ? 'Administrador'
                              : 'Usuario'}
                          </span>
                        </td>

                        <td>
                          {usuario.role === 'admin' ? (
                            <span className="membresia-admin">
                              🛡 Administrador
                            </span>
                          ) : membresia ? (
                            <span className="membresia-activa">
                              <span className="badge-dot"></span>
                              {membresia.plan}
                            </span>
                          ) : (
                            <span className="membresia-vacia">
                              Sin membresía
                            </span>
                          )}
                        </td>

                        <td>
                          {usuario.role === 'admin' ? (
                            <span className="accion-protegida">
                              🔒 Protegido
                            </span>
                          ) : (
                            <button
                              className="btn-eliminar"
                              type="button"
                              onClick={() =>
                                handleEliminar(usuario)
                              }
                              title="Eliminar usuario"
                            >
                              🗑
                              <span>Eliminar</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

export default Usuarios
