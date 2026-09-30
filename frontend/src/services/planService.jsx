import initialPlans from '../data/planes.json'
import { STRINGS } from '../constants/strings'

const STORAGE_KEY = 'planes'

// Obtiene los planes almacenados o carga los datos iniciales.
export function getPlans() {
  const storedPlans = localStorage.getItem(STORAGE_KEY)

  if (storedPlans) {
    return JSON.parse(storedPlans)
  }

  const plans = initialPlans

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(plans),
  )

  return plans
}

// Guarda los planes en el almacenamiento local.
function savePlans(plans) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(plans),
  )
}

// Obtiene únicamente los planes activos.
export function getActivePlans() {
  return getPlans().filter(
    (plan) => plan.activo,
  )
}

// Obtiene un plan mediante su identificador.
export function getPlanById(id) {
  const plans = getPlans()

  return plans.find(
    (plan) => plan.id === id,
  )
}

// Obtiene un plan mediante su nombre.
export function getPlanByName(name) {
  const plans = getPlans()

  return plans.find(
    (plan) =>
      plan.nombre.toLowerCase() ===
      name.toLowerCase(),
  )
}

// Crea un nuevo plan y genera su código de negocio.
export function createPlan(data) {
  const plans = getPlans()

  const nameExists = plans.some(
    (plan) =>
      plan.nombre.toLowerCase() ===
      data.nombre.toLowerCase(),
  )

  if (nameExists) {
    throw new Error(
      STRINGS.plan.duplicateOtherName,
    )
  }

  const newId =
    plans.length > 0
      ? Math.max(
          ...plans.map((plan) => plan.id),
        ) + 1
      : 1

  const newCode = `P${String(
    newId,
  ).padStart(4, '0')}`

  const newPlan = {
    id: newId,
    codigo: newCode,
    nombre: data.nombre,
    duracion: Number(data.duracion),
    unidadDuracion: data.unidadDuracion,
    precio: Number(data.precio),
    activo: data.activo ?? true,
  }

  savePlans([
    ...plans,
    newPlan,
  ])

  return newPlan
}

// Actualiza los datos de un plan existente.
export function updatePlan(id, data) {
  const plans = getPlans()

  const index = plans.findIndex(
    (plan) => plan.id === id,
  )

  if (index === -1) {
    throw new Error(
      STRINGS.plan.notFound,
    )
  }

  const nameExists = plans.some(
    (plan) =>
      plan.id !== id &&
      plan.nombre.toLowerCase() ===
        data.nombre.toLowerCase(),
  )

  if (nameExists) {
    throw new Error(
      'Ya existe otro plan con ese nombre',
    )
  }

  const updatedPlan = {
    ...plans[index],
    nombre: data.nombre,
    duracion: Number(data.duracion),
    unidadDuracion:
      data.unidadDuracion,
    precio: Number(data.precio),
    activo: data.activo,
  }

  const updatedPlans = [
    ...plans,
  ]

  updatedPlans[index] =
    updatedPlan

  savePlans(updatedPlans)

  return updatedPlan
}

// Cambia el estado activo de un plan sin eliminarlo.
export function togglePlanStatus(id) {
  const plans = getPlans()

  const index = plans.findIndex(
    (plan) => plan.id === id,
  )

  if (index === -1) {
    throw new Error(
      STRINGS.plan.duplicateName,
    )
  }

  const updatedPlan = {
    ...plans[index],
    activo: !plans[index].activo,
  }

  const updatedPlans = [
    ...plans,
  ]

  updatedPlans[index] =
    updatedPlan

  savePlans(updatedPlans)

  return updatedPlan
}