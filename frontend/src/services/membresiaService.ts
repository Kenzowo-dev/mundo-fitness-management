import membresiasIniciales from '../data/membresias.json'

export interface Membresia {
  id: number
  user_id?: number
  client_id: number
  plan: string
  start_date: string
  end_date: string
  price: number
  status: string
}

export interface MembresiaData {
  userId?: number
  clientId: number
  plan: string
  startDate: string
  endDate: string
  price: number
  status: string
}

const STORAGE_KEY = 'membresias'

function obtenerMembresias(): Membresia[] {
  const guardadas = localStorage.getItem(STORAGE_KEY)

  if (guardadas) {
    return JSON.parse(guardadas) as Membresia[]
  }

  const iniciales = membresiasIniciales as Membresia[]

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(iniciales),
  )

  return iniciales
}

function guardarMembresias(
  membresias: Membresia[],
) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(membresias),
  )
}

export async function getMembresias(): Promise<Membresia[]> {
  return obtenerMembresias()
}

export async function getMembresiaById(
  id: number,
): Promise<Membresia> {
  const membresias = obtenerMembresias()

  const membresia = membresias.find(
    (m) => m.id === id,
  )

  if (!membresia) {
    throw new Error(
      'Membresía no encontrada',
    )
  }

  return membresia
}

export async function createMembresia(
  data: MembresiaData,
): Promise<Membresia> {
  const membresias = obtenerMembresias()

  if (data.userId !== undefined) {
    const yaTieneMembresia = membresias.some(
      (membresia) =>
        membresia.user_id === data.userId &&
        membresia.status === 'activa',
    )

    if (yaTieneMembresia) {
      throw new Error(
        'El usuario ya tiene una membresía activa',
      )
    }
  }

  const nuevoId =
    membresias.length > 0
      ? Math.max(
          ...membresias.map(
            (m) => m.id,
          ),
        ) + 1
      : 1

  const nueva: Membresia = {
    id: nuevoId,
    user_id: data.userId,
    client_id: data.clientId,
    plan: data.plan,
    start_date: data.startDate,
    end_date: data.endDate,
    price: data.price,
    status: data.status,
  }

  guardarMembresias([
    ...membresias,
    nueva,
  ])

  return nueva
}

export async function updateMembresia(
  id: number,
  data: MembresiaData,
): Promise<Membresia> {
  const membresias = obtenerMembresias()

  const index = membresias.findIndex(
    (m) => m.id === id,
  )

  if (index === -1) {
    throw new Error(
      'Membresía no encontrada',
    )
  }

  if (data.userId !== undefined) {
    const otraMembresiaActiva =
      membresias.some(
        (membresia) =>
          membresia.id !== id &&
          membresia.user_id === data.userId &&
          membresia.status === 'activa',
      )

    if (otraMembresiaActiva) {
      throw new Error(
        'El usuario ya tiene otra membresía activa',
      )
    }
  }

  const actualizada: Membresia = {
    id,
    user_id: data.userId,
    client_id: data.clientId,
    plan: data.plan,
    start_date: data.startDate,
    end_date: data.endDate,
    price: data.price,
    status: data.status,
  }

  const nuevasMembresias = [
    ...membresias,
  ]

  nuevasMembresias[index] =
    actualizada

  guardarMembresias(
    nuevasMembresias,
  )

  return actualizada
}

export async function deleteMembresia(
  id: number,
): Promise<void> {
  const membresias = obtenerMembresias()

  const existe = membresias.some(
    (m) => m.id === id,
  )

  if (!existe) {
    throw new Error(
      'Membresía no encontrada',
    )
  }

  const nuevasMembresias =
    membresias.filter(
      (m) => m.id !== id,
    )

  guardarMembresias(
    nuevasMembresias,
  )
}

