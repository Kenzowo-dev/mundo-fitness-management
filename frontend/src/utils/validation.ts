// Reglas de validación compartidas por los formularios de registro.

// Nombres y apellidos: solo letras (incluye tildes y ñ) separadas por un espacio.
const NAME_PATTERN = /^\p{L}+(?: \p{L}+)*$/u
const MIN_BIRTH_DATE = '1900-01-01'

/** Quita todo lo que no sea letra o espacio mientras el usuario escribe. */
export function sanitizeNameInput(value: string): string {
  return value.replace(/[^\p{L} ]/gu, '').replace(/ {2,}/g, ' ').replace(/^ /, '')
}

export function isValidName(value: string): boolean {
  return NAME_PATTERN.test(value.trim())
}

/** Fecha de hoy en formato YYYY-MM-DD, según la hora local. */
export function todayIsoDate(): string {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}

/** Devuelve un mensaje si la fecha de nacimiento no es válida; vacío se considera válido. */
export function getBirthDateError(value: string): string | null {
  if (!value) return null
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(new Date(`${value}T00:00:00`).getTime())) {
    return 'Ingresa una fecha válida.'
  }
  if (value > todayIsoDate()) return 'La fecha de nacimiento no puede ser futura.'
  if (value < MIN_BIRTH_DATE) return 'Ingresa una fecha de nacimiento posterior a 1900.'
  return null
}

export const BIRTH_DATE_MIN = MIN_BIRTH_DATE
