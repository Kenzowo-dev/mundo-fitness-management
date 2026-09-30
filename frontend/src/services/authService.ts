import usersInitialData from '../data/usuarios.json'
import { STRINGS } from '../constants/strings'

export interface User {
  id: number
  fullName: string
  email: string
  password?: string
  role: 'admin' | 'lite'
  phone: string
  birthDate: string
  gender: string
}

export interface UserRegistration {
  firstName: string
  lastName: string
  email: string
  password: string
  phone: string
  birthDate: string
  gender: string
}

const STORAGE_KEY = 'usuarios'
const CURRENT_USER_KEY = 'usuarioActual'

// Obtiene los usuarios almacenados o carga los datos iniciales.
function getUsers(): User[] {
  const storedUsers =
    localStorage.getItem(STORAGE_KEY)

  if (storedUsers) {
    return JSON.parse(storedUsers) as User[]
  }

  const initialUsers =
    usersInitialData as User[]

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(initialUsers),
  )

  return initialUsers
}

// Guarda los usuarios en el almacenamiento local.
function saveUsers(users: User[]): void {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(users),
  )
}

// Registra un nuevo usuario.
export function registerUser(
  data: UserRegistration,
): User {
  const users = getUsers()

  const exists = users.some(
    (user) =>
      user.email.toLowerCase() ===
      data.email.toLowerCase(),
  )

  if (exists) {
    throw new Error(
      STRINGS.user.duplicateEmail,
    )
  }

  const newId =
    users.length > 0
      ? Math.max(
          ...users.map(
            (user) => user.id,
          ),
        ) + 1
      : 1

  const newUser: User = {
    id: newId,
    fullName: `${data.firstName} ${data.lastName}`,
    email: data.email,
    password: data.password,
    role: 'lite',
    phone: data.phone,
    birthDate: data.birthDate,
    gender: data.gender,
  }

  saveUsers([
    ...users,
    newUser,
  ])

  return newUser
}

// Inicia sesión con las credenciales proporcionadas.
export function login(
  email: string,
  password: string,
): User {
  const users = getUsers()

  const user = users.find(
    (item) =>
      item.email.toLowerCase() ===
        email.toLowerCase() &&
      item.password === password,
  )

  if (!user) {
    throw new Error(
      STRINGS.user.invalidCredentials,
    )
  }

  const sessionUser: User = {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    phone: user.phone,
    birthDate: user.birthDate,
    gender: user.gender,
  }

  localStorage.setItem(
    CURRENT_USER_KEY,
    JSON.stringify(sessionUser),
  )

  return sessionUser
}

// Obtiene el usuario que tiene la sesión activa.
export function getCurrentUser(): User | null {
  const storedUser =
    localStorage.getItem(
      CURRENT_USER_KEY,
    )

  if (!storedUser) {
    return null
  }

  return JSON.parse(storedUser) as User
}

// Cierra la sesión del usuario actual.
export function logout(): void {
  localStorage.removeItem(
    CURRENT_USER_KEY,
  )
}

// Obtiene todos los usuarios registrados.
export function getUsersForAdmin(): User[] {
  return getUsers()
}

// Elimina temporalmente un usuario del almacenamiento local.
export function removeUser(
  id: number,
): void {
  const users = getUsers()

  const exists = users.some(
    (user) => user.id === id,
  )

  if (!exists) {
    throw new Error(
      STRINGS.user.notFound,
    )
  }

  const remainingUsers =
    users.filter(
      (user) => user.id !== id,
    )

  saveUsers(remainingUsers)
}