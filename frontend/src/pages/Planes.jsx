import { useEffect, useState } from 'react'
import {
  getPlanes,
  createPlan,
  updatePlan,
  deletePlan,
  togglePlanActivo,
  contarMembresiasDePlan,
} from '../services/planService'
import '../styles/planes/Planes.css'

const FORM_VACIO = {
  nombre: '',
  duracionMeses: '1',
  precio: '',
  descripcion: '',
  beneficios: '', // un beneficio por línea
  activo: true,
}

function Planes() {
  const [planes, setPlanes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [modalAbierto, setModalAbierto] = useState(false)
  const [planEditando, setPlanEditando] = useState(null)
  const [form, setForm] = useState(FORM_VACIO)
  const [errorForm, setErrorForm] = useState('')

  useEffect(() => {
    async function cargar() {
      try {
        setPlanes(await getPlanes())
      } catch {
        setError('No se pudieron cargar los planes.')
      } finally {
        setLoading(false)
      }
    }

    cargar()
  }, [])

  function abrirNuevo() {
    setPlanEditando(null)
    setForm(FORM_VACIO)
    setErrorForm('')
    setModalAbierto(true)
  }

  function abrirEditar(plan) {
    setPlanEditando(plan)
    setForm({
      nombre: plan.nombre,
      duracionMeses: String(plan.duracionMeses),
      precio: String(plan.precio),
      descripcion: plan.descripcion,
      beneficios: plan.beneficios.join('\n'),
      activo: plan.activo,
    })
    setErrorForm('')
    setModalAbierto(true)
  }

  function cerrarModal() {
    setModalAbierto(false)
  }

  function handleChange(campo, valor) {
    setForm((actual) => ({ ...actual, [campo]: valor }))
  }

  async function handleSubmit(event) {
    event.preventDefault()

    const datos = {
      ...form,
      beneficios: form.beneficios
        .split('\n')
        .map((b) => b.trim())
        .filter(Boolean),
    }

    try {
      if (planEditando) {
        const actualizado = await updatePlan(planEditando.id, datos)
        setPlanes((prev) =>
          prev.map((p) => (p.id === actualizado.id ? actualizado : p)),
        )
      } else {
        const nuevo = await createPlan(datos)
        setPlanes((prev) => [...prev, nuevo])
      }

      cerrarModal()
    } catch (err) {
      setErrorForm(err.message)
    }
  }

  async function handleToggle(plan) {
    try {
      const actualizado = await togglePlanActivo(plan.id)
      setPlanes((prev) =>
        prev.map((p) => (p.id === actualizado.id ? actualizado : p)),
      )
    } catch (err) {
      alert(err.message)
    }
  }

  async function handleEliminar(plan) {
    const confirmado = window.confirm(
      `¿Seguro que deseas eliminar el plan ${plan.nombre}?`,
    )

    if (!confirmado) return

    try {
      await deletePlan(plan.id)
      setPlanes((prev) => prev.filter((p) => p.id !== plan.id))
    } catch (err) {
      alert(err.message)
    }
  }

  function precioPorMes(plan) {
    return (plan.precio / plan.duracionMeses).toFixed(2)
  }

  if (loading) return <p>Cargando planes...</p>
  if (error) return <p className="planes-error">{error}</p>

  return (
    <section className="planes">
      <div className="planes-header">
        <h2>Planes</h2>
        <button className="planes-btn planes-btn-primario" onClick={abrirNuevo}>
          + Nuevo plan
        </button>
      </div>

      {planes.length === 0 && (
        <p className="planes-vacio">
          Aún no hay planes. Crea el primero con “Nuevo plan”.
        </p>
      )}

      <div className="planes-grid">
        {planes.map((plan) => {
          const enUso = contarMembresiasDePlan(plan.nombre)

          return (
            <article
              key={plan.id}
              className={`planes-card ${plan.activo ? '' : 'planes-card-inactivo'}`}
            >
              <div className="planes-card-top">
                <h3>{plan.nombre}</h3>
                <span
                  className={`planes-estado ${
                    plan.activo ? 'planes-estado-activo' : 'planes-estado-inactivo'
                  }`}
                >
                  {plan.activo ? 'Activo' : 'Inactivo'}
                </span>
              </div>

              <p className="planes-precio">
                S/ {Number(plan.precio).toFixed(2)}
                <small>
                  {' '}
                  por {plan.duracionMeses}{' '}
                  {plan.duracionMeses === 1 ? 'mes' : 'meses'}
                </small>
              </p>

              {plan.duracionMeses > 1 && (
                <p className="planes-permes">S/ {precioPorMes(plan)} al mes</p>
              )}

              {plan.descripcion && (
                <p className="planes-descripcion">{plan.descripcion}</p>
              )}

              {plan.beneficios.length > 0 && (
                <ul className="planes-beneficios">
                  {plan.beneficios.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              )}

              <p className="planes-uso">
                {enUso === 0
                  ? 'Sin membresías'
                  : `${enUso} ${enUso === 1 ? 'membresía' : 'membresías'}`}
              </p>

              <div className="planes-acciones">
                <button className="planes-btn" onClick={() => abrirEditar(plan)}>
                  Editar
                </button>
                <button className="planes-btn" onClick={() => handleToggle(plan)}>
                  {plan.activo ? 'Desactivar' : 'Activar'}
                </button>
                <button
                  className="planes-btn planes-btn-peligro"
                  onClick={() => handleEliminar(plan)}
                >
                  Eliminar
                </button>
              </div>
            </article>
          )
        })}
      </div>

      {modalAbierto && (
        <div className="planes-overlay" onClick={cerrarModal}>
          <form
            className="planes-modal"
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleSubmit}
          >
            <h3>{planEditando ? 'Editar plan' : 'Nuevo plan'}</h3>

            <label>
              Nombre
              <input
                type="text"
                value={form.nombre}
                onChange={(e) => handleChange('nombre', e.target.value)}
                required
              />
            </label>

            <div className="planes-fila">
              <label>
                Duración (meses)
                <input
                  type="number"
                  min="1"
                  value={form.duracionMeses}
                  onChange={(e) => handleChange('duracionMeses', e.target.value)}
                  required
                />
              </label>

              <label>
                Precio (S/)
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.precio}
                  onChange={(e) => handleChange('precio', e.target.value)}
                  required
                />
              </label>
            </div>

            <label>
              Descripción
              <input
                type="text"
                value={form.descripcion}
                onChange={(e) => handleChange('descripcion', e.target.value)}
              />
            </label>

            <label>
              Beneficios (uno por línea)
              <textarea
                rows="4"
                value={form.beneficios}
                onChange={(e) => handleChange('beneficios', e.target.value)}
              />
            </label>

            <label className="planes-check">
              <input
                type="checkbox"
                checked={form.activo}
                onChange={(e) => handleChange('activo', e.target.checked)}
              />
              Plan activo
            </label>

            {errorForm && <p className="planes-error">{errorForm}</p>}

            <div className="planes-acciones">
              <button
                type="button"
                className="planes-btn"
                onClick={cerrarModal}
              >
                Cancelar
              </button>
              <button type="submit" className="planes-btn planes-btn-primario">
                {planEditando ? 'Guardar cambios' : 'Crear plan'}
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  )
}

export default Planes