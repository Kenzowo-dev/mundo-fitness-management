import membershipsInitialData from '../data/membresias.json'
import { STRINGS } from '../constants/strings'

export interface Membership {
  id: number
  user_id?: number
  client_id: number
  plan: string
  start_date: string
  end_date: string
  price: number
  status: string
}

export interface MembershipData {
  userId?: number
  clientId: number
  plan: string
  startDate: string
  endDate: string
  price: number
  status: string
}

const STORAGE_KEY = 'membresias'

// Obtiene las membresías almacenadas localmente o carga los datos iniciales.
const getStoredMemberships = (): Membership[] => {
  const storedMemberships = localStorage.getItem(STORAGE_KEY)

  if (storedMemberships) {
    return JSON.parse(storedMemberships) as Membership[]
  }

  const initialMemberships =
    membershipsInitialData as Membership[]

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(initialMemberships),
  )

  return initialMemberships
}

// Guarda las membresías en el almacenamiento local.
const saveMemberships = (
  memberships: Membership[],
): void => {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(memberships),
  )
}

// Obtiene todas las membresías.
export const getMemberships = async (): Promise<
  Membership[]
> => {
  return getStoredMemberships()
}

// Obtiene una membresía mediante su identificador.
export const getMembershipById = async (
  id: number,
): Promise<Membership> => {
  const memberships = getStoredMemberships()

  const membership = memberships.find(
    (item) => item.id === id,
  )

  if (!membership) {
    throw new Error(
      'Membresía no encontrada',
    )
  }

  return membership
}

// Crea una nueva membresía y evita duplicar membresías activas.
export const createMembership = async (
  data: MembershipData,
): Promise<Membership> => {
  const memberships = getStoredMemberships()

  if (data.userId !== undefined) {
    const hasActiveMembership =
      memberships.some(
        (membership) =>
          membership.user_id === data.userId &&
          membership.status === 'activa',
      )

    if (hasActiveMembership) {
      throw new Error(
        STRINGS.membership.notFound,
      )
    }
  }

  const newId =
    memberships.length > 0
      ? Math.max(
          ...memberships.map(
            (membership) => membership.id,
          ),
        ) + 1
      : 1

  const newMembership: Membership = {
    id: newId,
    user_id: data.userId,
    client_id: data.clientId,
    plan: data.plan,
    start_date: data.startDate,
    end_date: data.endDate,
    price: data.price,
    status: data.status,
  }

  saveMemberships([
    ...memberships,
    newMembership,
  ])

  return newMembership
}

// Actualiza una membresía existente sin permitir duplicar membresías activas.
export const updateMembership = async (
  id: number,
  data: MembershipData,
): Promise<Membership> => {
  const memberships = getStoredMemberships()

  const index = memberships.findIndex(
    (membership) => membership.id === id,
  )

  if (index === -1) {
    throw new Error(
      STRINGS.membership.notFound,
    )
  }

  if (data.userId !== undefined) {
    const hasAnotherActiveMembership =
      memberships.some(
        (membership) =>
          membership.id !== id &&
          membership.user_id === data.userId &&
          membership.status === 'activa',
      )

    if (hasAnotherActiveMembership) {
      throw new Error(
        STRINGS.membership.anotherActiveMembershipExists,
      )
    }
  }

  const updatedMembership: Membership = {
    id,
    user_id: data.userId,
    client_id: data.clientId,
    plan: data.plan,
    start_date: data.startDate,
    end_date: data.endDate,
    price: data.price,
    status: data.status,
  }

  const updatedMemberships = [
    ...memberships,
  ]

  updatedMemberships[index] =
    updatedMembership

  saveMemberships(
    updatedMemberships,
  )

  return updatedMembership
}

// Elimina una membresía del almacenamiento local.
export const deleteMembership = async (
  id: number,
): Promise<void> => {
  const memberships = getStoredMemberships()

  const membershipExists = memberships.some(
    (membership) => membership.id === id,
  )

  if (!membershipExists) {
    throw new Error(
      STRINGS.membership.notFound,
    )
  }

  const remainingMemberships =
    memberships.filter(
      (membership) => membership.id !== id,
    )

  saveMemberships(
    remainingMemberships,
  )
}