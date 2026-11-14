import type { ClipboardEvent, KeyboardEvent } from 'react'

/**
 * Reglas compartidas para los campos de texto de los formularios.
 * Los "sanitize*" filtran lo que se escribe o pega; las expresiones VALID_* validan al guardar.
 */

/** Nombres y apellidos: palabras de letras (con tildes y ñ) separadas por un solo espacio. */
export const VALID_PERSON_NAME = /^[\p{L}\p{M}]+(?: [\p{L}\p{M}]+)*$/u

/** Celular peruano: 9 dígitos y empieza con 9. */
export const VALID_PHONE = /^9\d{8}$/

/** Dirección: letras, números, espacios y . , # - / ° º (debe empezar con letra o número). */
export const VALID_ADDRESS = /^[\p{L}\p{M}\d][\p{L}\p{M}\d .,#/°º-]*$/u

/** Nombre de plan: letras, números, espacios y + - . (debe empezar con letra o número). */
export const VALID_PLAN_NAME = /^[\p{L}\p{M}\d][\p{L}\p{M}\d +.-]*$/u

/** Unidad de un objetivo: letras, % y / (kg, %, km, km/h). */
export const VALID_UNIT = /^[\p{L}\p{M}%/]+$/u

/** Fecha de nacimiento más antigua permitida (igual que en el registro). */
export const MIN_BIRTH_DATE = '1950-01-01'
export const MIN_BIRTH_DATE_MESSAGE = 'La fecha de nacimiento debe ser desde el año 1950.'

/** Fecha local de hoy en formato AAAA-MM-DD (para el atributo max). */
export function todayDateKey() {
  return new Date().toLocaleDateString('en-CA')
}

export const PERSON_NAME_MESSAGE = 'Solo se permiten letras y espacios.'
export const PHONE_MESSAGE = 'El teléfono debe tener 9 dígitos y comenzar con 9.'
export const ADDRESS_MESSAGE = 'La dirección solo puede tener letras, números, espacios y . , # - / °'
export const PLAN_NAME_MESSAGE = 'El nombre solo puede tener letras, números, espacios y + - .'
export const UNIT_MESSAGE = 'La unidad solo puede tener letras, % y / (ej.: kg, %, km/h).'

/** Quita dobles espacios y el espacio inicial (el final se recorta al guardar). */
function tidySpaces(value: string) {
  return value.replace(/ {2,}/g, ' ').replace(/^ /, '')
}

/** Solo dígitos, recortado a `maxDigits`. */
export function sanitizeDigits(value: string, maxDigits: number) {
  return value.replace(/\D/g, '').slice(0, maxDigits)
}

export function sanitizePhone(value: string) {
  return sanitizeDigits(value, 9)
}

/** Teléfonos antiguos guardados como "+51 987 654 321" → "987654321". */
export function normalizePhone(value: string | undefined | null) {
  const digits = (value ?? '').replace(/\D/g, '')
  return digits.length === 11 && digits.startsWith('51') ? digits.slice(2) : digits.slice(0, 9)
}

export function sanitizePersonName(value: string) {
  return tidySpaces(value.replace(/[^\p{L}\p{M} ]/gu, ''))
}

export function sanitizeAddress(value: string) {
  return tidySpaces(value.replace(/[^\p{L}\p{M}\d .,#/°º-]/gu, ''))
}

export function sanitizePlanName(value: string) {
  return tidySpaces(value.replace(/[^\p{L}\p{M}\d +.-]/gu, ''))
}

/** Buscador de socios por nombre o DNI: solo letras, números y espacios. */
export function sanitizeSearchTerm(value: string) {
  return tidySpaces(value.replace(/[^\p{L}\p{M}\d ]/gu, ''))
}

/** Buscador de planes: solo letras y espacios. */
export function sanitizeLettersSearch(value: string) {
  return tidySpaces(value.replace(/[^\p{L}\p{M} ]/gu, ''))
}

/** Buscador del listado de socios (también busca por correo): letras, números, espacios y @ . _ - */
export function sanitizeClientListSearch(value: string) {
  return tidySpaces(value.replace(/[^\p{L}\p{M}\d @._-]/gu, ''))
}

export function sanitizeUnit(value: string) {
  return value.replace(/[^\p{L}\p{M}%/]/gu, '')
}

const BLOCKED_NUMBER_KEYS = new Set(['e', 'E', '+', '-'])

/**
 * Para <input type="number">: el navegador deja escribir "e", "+" y "-" (1e5, -3).
 * Estas funciones bloquean esas teclas y lo que se pegue que no sea un número positivo.
 */
export function numberInputGuards(allowDecimal: boolean) {
  const validPaste = allowDecimal ? /^\d*(?:[.,]\d*)?$/ : /^\d*$/
  return {
    onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
      if (BLOCKED_NUMBER_KEYS.has(event.key) || (!allowDecimal && (event.key === '.' || event.key === ','))) {
        event.preventDefault()
      }
    },
    onPaste(event: ClipboardEvent<HTMLInputElement>) {
      if (!validPaste.test(event.clipboardData.getData('text').trim())) event.preventDefault()
    },
  }
}
