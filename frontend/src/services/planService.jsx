// Mismo patrón que membresiaService.ts: datos en localStorage.

const STORAGE_KEY = 'planes'

const PLANES_INICIALES = [
  {
    id: 1,
    nombre: 'Mensual',
    duracionMeses: 1,
    precio: 50,
    descripcion: 'Acceso completo al gimnasio por un mes.',
    beneficios: ['Acceso a todas las áreas', 'Casillero'],
    activo: true,
  },
  {
    id: 2,
    nombre: 'Trimestral',
    duracionMeses: 3,
    precio: 135,
    descripcion: 'Tres meses de entrenamiento con ahorro.',
    beneficios: ['Acceso a todas las áreas', 'Casillero', 'Evaluación física'],
    activo: true,
  },
  {
    id: 3,
    nombre: 'Semestral',
    duracionMeses: 6,
    precio: 240,
    descripcion: 'Seis meses para crear el hábito.',
    beneficios: [
      'Acceso a todas las áreas',
      'Casillero',
      'Evaluación física',
      'Rutina personalizada',
    ],
    activo: true,
  },
  {
    id: 4,
    nombre: 'Anual',
    duracionMeses: 12,
    precio: 450,
    descripcion: 'El mejor precio por mes para todo el año.',
    beneficios: [
      'Acceso a todas las áreas',
      'Casillero',
      'Evaluación física',
      'Rutina personalizada',
      'Un invitado por mes',
    ],
    activo: true,
  },
]

function obtenerPlanes() {
  const guardados = localStorage.getItem(STORAGE_KEY)

  if (guardados) {
    return JSON.parse(guardados)
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(PLANES_INICIALES))
  return PLANES_INICIALES
}

function guardarPlanes(planes) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(planes))
}

// Cuenta cuántas membresías usan un plan (por nombre).
export function contarMembresiasDePlan(nombrePlan) {
  const guardadas = localStorage.getItem('membresias')
  if (!guardadas) return 0

  const membresias = JSON.parse(guardadas)
  return membresias.filter((m) => m.plan === nombrePlan).length
}

export async function getPlanes() {
  return obtenerPlanes()
}

export async function getPlanById(id) {
  const plan = obtenerPlanes().find((p) => p.id === id)

  if (!plan) {
    throw new Error('Plan no encontrado')
  }

  return plan
}

export async function createPlan(data) {
  const planes = obtenerPlanes()

  const nombreRepetido = planes.some(
    (p) => p.nombre.toLowerCase() === data.nombre.trim().toLowerCase(),
  )

  if (nombreRepetido) {
    throw new Error('Ya existe un plan con ese nombre')
  }

  const nuevoId =
    planes.length > 0 ? Math.max(...planes.map((p) => p.id)) + 1 : 1

  const nuevo = {
    id: nuevoId,
    nombre: data.nombre.trim(),
    duracionMeses: Number(data.duracionMeses),
    precio: Number(data.precio),
    descripcion: data.descripcion?.trim() ?? '',
    beneficios: data.beneficios ?? [],
    activo: data.activo ?? true,
  }

  guardarPlanes([...planes, nuevo])
  return nuevo
}

export async function updatePlan(id, data) {
  const planes = obtenerPlanes()
  const index = planes.findIndex((p) => p.id === id)

  if (index === -1) {
    throw new Error('Plan no encontrado')
  }

  const nombreRepetido = planes.some(
    (p) =>
      p.id !== id &&
      p.nombre.toLowerCase() === data.nombre.trim().toLowerCase(),
  )

  if (nombreRepetido) {
    throw new Error('Ya existe otro plan con ese nombre')
  }

  const actualizado = {
    id,
    nombre: data.nombre.trim(),
    duracionMeses: Number(data.duracionMeses),
    precio: Number(data.precio),
    descripcion: data.descripcion?.trim() ?? '',
    beneficios: data.beneficios ?? [],
    activo: data.activo ?? true,
  }

  const nuevos = [...planes]
  nuevos[index] = actualizado
  guardarPlanes(nuevos)

  return actualizado
}

export async function togglePlanActivo(id) {
  const planes = obtenerPlanes()
  const plan = planes.find((p) => p.id === id)

  if (!plan) {
    throw new Error('Plan no encontrado')
  }

  const actualizado = { ...plan, activo: !plan.activo }
  guardarPlanes(planes.map((p) => (p.id === id ? actualizado : p)))

  return actualizado
}

export async function deletePlan(id) {
  const planes = obtenerPlanes()
  const plan = planes.find((p) => p.id === id)

  if (!plan) {
    throw new Error('Plan no encontrado')
  }

  if (contarMembresiasDePlan(plan.nombre) > 0) {
    throw new Error(
      'No se puede eliminar: hay membresías que usan este plan. Desactívalo en su lugar.',
    )
  }

  guardarPlanes(planes.filter((p) => p.id !== id))
}