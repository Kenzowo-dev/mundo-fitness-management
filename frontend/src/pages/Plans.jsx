import { useEffect, useState } from 'react'
import {
  getPlans,
  createPlan,
  updatePlan,
  togglePlanStatus,
} from '../services/planService'
import { STRINGS } from '../constants/strings'
import '../styles/planes/Planes.css'

function Plans() {
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [view, setView] =
    useState('lista')

  const [selectedPlan, setSelectedPlan] =
    useState(null)

  const [name, setName] =
    useState('')

  const [duration, setDuration] =
    useState('')

  const [durationUnit, setDurationUnit] =
    useState('meses')

  const [price, setPrice] =
    useState('')

  // Carga los planes registrados.
  function loadPlans() {
    try {
      setLoading(true)

      const data = getPlans()

      setPlans(data)
      setError('')
    } catch {
      setError(
        STRINGS.plan.loadError,
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPlans()
  }, [])

  // Limpia los campos del formulario.
  function clearForm() {
    setName('')
    setDuration('')
    setDurationUnit('meses')
    setPrice('')
  }

  // Prepara el formulario para crear un plan.
  function handleNew() {
    clearForm()
    setSelectedPlan(null)
    setView('nuevo')
  }

  // Carga los datos del plan seleccionado para editarlo.
  function handleEdit(plan) {
    setSelectedPlan(plan)

    setName(plan.nombre)

    setDuration(
      String(plan.duracion),
    )

    setDurationUnit(
      plan.unidadDuracion ?? 'meses',
    )

    setPrice(
      String(plan.precio),
    )

    setView('editar')
  }

  // Regresa a la lista de planes.
  function backToList() {
    clearForm()
    setSelectedPlan(null)
    setView('lista')
  }

  // Valida los datos introducidos en el formulario.
  function validateForm() {
    if (!name.trim()) {
      alert(
        STRINGS.plan.invalidName,
      )
      return false
    }

    const durationNumber =
      Number(duration)

    if (
      !Number.isInteger(
        durationNumber,
      ) ||
      durationNumber <= 0
    ) {
      alert(
        STRINGS.plan.invalidDuration,
      )
      return false
    }

    const priceNumber =
      Number(price)

    if (
      Number.isNaN(priceNumber) ||
      priceNumber < 0
    ) {
      alert(
        STRINGS.plan.invalidPrice,
      )
      return false
    }

    return true
  }

  // Valida y registra un nuevo plan.
  function handleCreate(event) {
    event.preventDefault()

    if (!validateForm()) {
      return
    }

    try {
      createPlan({
        nombre: name.trim(),
        duracion: Number(duration),
        unidadDuracion: durationUnit,
        precio: Number(price),
        activo: true,
      })

      loadPlans()
      backToList()
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : STRINGS.plan.createError,
      )
    }
  }

  // Valida y actualiza el plan seleccionado.
  function handleUpdate(event) {
    event.preventDefault()

    if (!selectedPlan) {
      return
    }

    if (!validateForm()) {
      return
    }

    try {
      updatePlan(
        selectedPlan.id,
        {
          nombre: name.trim(),
          duracion: Number(duration),
          unidadDuracion: durationUnit,
          precio: Number(price),
          activo:
            selectedPlan.activo,
        },
      )

      loadPlans()
      backToList()
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : STRINGS.plan.updateError,
      )
    }
  }

  // Confirma y cambia el estado del plan.
  function handleToggleStatus(plan) {
    const action = plan.activo
      ? 'desactivar'
      : 'activar'

    const confirmed =
      window.confirm(
        STRINGS.plan.toggleStatusConfirmation(
          action,
          plan.nombre,
        ),
      )

    if (!confirmed) {
      return
    }

    try {
      togglePlanStatus(plan.id)
      loadPlans()
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : STRINGS.plan.toggleStatusError,
      )
    }
  }

  // Genera el texto de duración mostrado en la tarjeta.
  function getDurationText(plan) {
    const unit =
      plan.unidadDuracion ===
      'dias'
        ? plan.duracion === 1
          ? 'día'
          : 'días'
        : plan.duracion === 1
          ? 'mes'
          : 'meses'

    return `${plan.duracion} ${unit}`
  }

  if (loading) {
    return (
      <section className="planes-panel">
        <h2>Planes</h2>

        <p>
          Cargando planes...
        </p>
      </section>
    )
  }

  if (error) {
    return (
      <section className="planes-panel">
        <h2>Planes</h2>

        <p>{error}</p>
      </section>
    )
  }

  if (
    view === 'nuevo' ||
    view === 'editar'
  ) {
    const editing =
      view === 'editar'

    return (
      <section className="planes-panel">
        <div className="planes-header">
          <div>
            <h2>
              {editing
                ? 'Editar plan'
                : 'Nuevo plan'}
            </h2>

            <p>
              {editing
                ? 'Modifica los datos del plan.'
                : 'Registra un nuevo plan para Mundo Fitness.'}
            </p>
          </div>

          <button
            type="button"
            className="btn-plan-principal"
            onClick={
              backToList
            }
          >
            Volver
          </button>
        </div>

        <div className="plan-form-container">
          <form
            className="plan-form"
            onSubmit={
              editing
                ? handleUpdate
                : handleCreate
            }
          >
            <label>
              Nombre del plan

              <input
                type="text"
                value={name}
                onChange={(
                  event,
                ) =>
                  setName(
                    event.target.value,
                  )
                }
                placeholder="Ej. Mensual"
                required
              />
            </label>

            <label>
              Duración

              <input
                type="number"
                min="1"
                step="1"
                value={duration}
                onChange={(
                  event,
                ) =>
                  setDuration(
                    event.target.value,
                  )
                }
                placeholder="Ej. 15"
                required
              />
            </label>

            <label>
              Unidad de duración

              <select
                value={
                  durationUnit
                }
                onChange={(
                  event,
                ) =>
                  setDurationUnit(
                    event.target.value,
                  )
                }
              >
                <option value="dias">
                  Días
                </option>

                <option value="meses">
                  Meses
                </option>
              </select>
            </label>

            <label>
              Precio (S/)

              <input
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(
                  event,
                ) =>
                  setPrice(
                    event.target.value,
                  )
                }
                placeholder="Ej. 50"
                required
              />
            </label>

            <div className="plan-form-actions">
              <button type="submit">
                {editing
                  ? 'Guardar cambios'
                  : 'Crear plan'}
              </button>

              <button
                type="button"
                className="btn-secundario"
                onClick={
                  backToList
                }
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </section>
    )
  }

  return (
    <section className="planes-panel">
      <div className="planes-header">
        <div>
          <h2>Planes</h2>

          <p>
            Gestiona los planes disponibles
            en Mundo Fitness.
          </p>
        </div>

        <button
          type="button"
          className="btn-plan-principal"
          onClick={handleNew}
        >
          + Nuevo plan
        </button>
      </div>

      {plans.length === 0 ? (
        <div className="planes-vacio">
          <h3>
            No hay planes registrados
          </h3>

          <p>
            Cuando registres un plan
            aparecerá aquí.
          </p>
        </div>
      ) : (
        <div className="planes-grid">
          {plans.map((plan) => (
            <article
              key={plan.id}
              className={`plan-card ${
                !plan.activo
                  ? 'inactivo'
                  : ''
              }`}
            >
              <div className="plan-card-header">
                <span className="plan-codigo">
                  {plan.codigo}
                </span>

                <span
                  className={`plan-estado ${
                    plan.activo
                      ? 'activo'
                      : 'inactivo'
                  }`}
                >
                  {plan.activo
                    ? 'Activo'
                    : 'Inactivo'}
                </span>
              </div>

              <h3>
                {plan.nombre}
              </h3>

              <p className="plan-duracion">
                Duración:{' '}
                {getDurationText(
                  plan,
                )}
              </p>

              <p className="plan-precio">
                S/{' '}
                {Number(
                  plan.precio,
                ).toFixed(2)}
              </p>

              <div className="plan-acciones">
                <button
                  type="button"
                  onClick={() =>
                    handleEdit(
                      plan,
                    )
                  }
                >
                  Editar
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleToggleStatus(
                      plan,
                    )
                  }
                >
                  {plan.activo
                    ? 'Desactivar'
                    : 'Activar'}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

export default Plans