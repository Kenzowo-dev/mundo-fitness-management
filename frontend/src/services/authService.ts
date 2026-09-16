import usuariosIniciales from '../data/usuarios.json'

export interface Usuario {
  id: number
  fullName: string
  email: string
  password?: string
  role: 'admin' | 'lite'
  phone: string
  birthDate: string
  gender: string
}

export interface RegistroUsuario {
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

function obtenerUsuarios(): Usuario[] {
  const guardados = localStorage.getItem(STORAGE_KEY)

  if (guardados) {
    return JSON.parse(guardados) as Usuario[]
  }

  const iniciales = usuariosIniciales as Usuario[]

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(iniciales),
  )

  return iniciales
}

function guardarUsuarios(usuarios: Usuario[]) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(usuarios),
  )
}

export function registrarUsuario(
  data: RegistroUsuario,
): Usuario {
  const usuarios = obtenerUsuarios()

  const existe = usuarios.some(
    (usuario) =>
      usuario.email.toLowerCase() === data.email.toLowerCase(),
  )

  if (existe) {
    throw new Error('Ya existe un usuario con ese correo')
  }

  const nuevoId =
    usuarios.length > 0
      ? Math.max(...usuarios.map((usuario) => usuario.id)) + 1
      : 1

  const nuevoUsuario: Usuario = {
    id: nuevoId,
    fullName: `${data.firstName} ${data.lastName}`,
    email: data.email,
    password: data.password,
    role: 'lite',
    phone: data.phone,
    birthDate: data.birthDate,
    gender: data.gender,
  }

  guardarUsuarios([...usuarios, nuevoUsuario])

  return nuevoUsuario
}

export function iniciarSesion(
  email: string,
  password: string,
): Usuario {
  const usuarios = obtenerUsuarios()

  const usuario = usuarios.find(
    (item) =>
      item.email.toLowerCase() === email.toLowerCase() &&
      item.password === password,
  )

  if (!usuario) {
    throw new Error('Correo o contraseña incorrectos')
  }

  const usuarioSesion: Usuario = {
    id: usuario.id,
    fullName: usuario.fullName,
    email: usuario.email,
    role: usuario.role,
    phone: usuario.phone,
    birthDate: usuario.birthDate,
    gender: usuario.gender,
  }

  localStorage.setItem(
    CURRENT_USER_KEY,
    JSON.stringify(usuarioSesion),
  )

  return usuarioSesion
}

export function obtenerUsuarioActual(): Usuario | null {
  const usuario = localStorage.getItem(CURRENT_USER_KEY)

  if (!usuario) {
    return null
  }

  return JSON.parse(usuario) as Usuario
}

export function cerrarSesion() {
  localStorage.removeItem(CURRENT_USER_KEY)
}

export function obtenerUsuariosAdmin(): Usuario[] {
  return obtenerUsuarios()
}

export function eliminarUsuario(id: number): void {
  const usuarios = obtenerUsuarios()

  const existe = usuarios.some(
    (usuario) => usuario.id === id,
  )

  if (!existe) {
    throw new Error('Usuario no encontrado')
  }

  const nuevosUsuarios = usuarios.filter(
    (usuario) => usuario.id !== id,
  )

  guardarUsuarios(nuevosUsuarios)
}
