import type { Client } from '../types/api.js'
import FormField from './FormField'

type ClientFormField =
  | 'dni'
  | 'firstName'
  | 'lastName'
  | 'email'
  | 'phone'
  | 'birthDate'
  | 'gender'
  | 'address'
  | 'emergencyContactName'
  | 'emergencyContactPhone'
  | 'medicalConditions'
  | 'notes'
  | 'status'

export type ClientFormValues = Partial<Pick<Client, ClientFormField>>
export type ClientFormErrors = Partial<Record<ClientFormField, string>>

interface ClientFormFieldsProps {
  idPrefix: 'create' | 'edit'
  values: ClientFormValues
  errors?: ClientFormErrors
  onChange: (field: ClientFormField, value: string) => void
  includeStatus?: boolean
}

const DIGIT_FIELDS: Partial<Record<ClientFormField, number>> = {
  dni: 8,
  phone: 9,
  emergencyContactPhone: 9,
}

const NAME_FIELDS: ReadonlySet<ClientFormField> = new Set(['firstName', 'lastName', 'emergencyContactName'])

/**
 * Filtra lo que se escribe o pega en los campos restringidos:
 * - DNI y teléfonos: solo dígitos, recortados a su longitud máxima.
 * - Nombres y apellidos: solo letras (con tildes y ñ), espacios, apóstrofo y guion.
 */
function sanitizeFieldValue(field: ClientFormField, value: string): string {
  const maxDigits = DIGIT_FIELDS[field]
  if (maxDigits !== undefined) {
    return value.replace(/\D/g, '').slice(0, maxDigits)
  }
  if (NAME_FIELDS.has(field)) {
    return value.replace(/[^\p{L}\p{M} '’-]/gu, '')
  }
  if (field === 'email') {
    return value.replace(/\s/g, '')
  }
  return value
}

export default function ClientFormFields({
  idPrefix,
  values,
  errors = {},
  onChange,
  includeStatus = false,
}: ClientFormFieldsProps) {
      const field = (
      name: ClientFormField,
      label: string,
      type: 'text' | 'email' | 'tel' | 'date' | 'select' | 'textarea',
      placeholder?: string,
      restrictions?: {
        maxLength?: number
        inputMode?: 'numeric' | 'text' | 'tel'
        pattern?: string
        max?: string
      },
    ) => (
    <FormField
      label={label}
      type={type}
      id={`${idPrefix}-${name === 'firstName' ? 'name' : name === 'lastName' ? 'lastname' : name}`}
      name={name}
      value={values[name] ?? ''}
      onChange={(value) => onChange(name, sanitizeFieldValue(name, value))}
      required={name === 'dni' || name === 'firstName' || name === 'lastName'}
      placeholder={type === 'select' ? undefined : placeholder}
      error={errors[name]}
      maxLength={restrictions?.maxLength}
      inputMode={restrictions?.inputMode}
      pattern={restrictions?.pattern}
      max={restrictions?.max}
      autoComplete={name === 'firstName' ? 'given-name'
        : name === 'lastName' ? 'family-name'
          : name === 'email' ? 'email'
            : name === 'phone' ? 'tel'
              : name === 'address' ? 'street-address' : undefined}
      options={name === 'gender' ? [
        { value: '', label: 'No especificado' },
        { value: 'masculino', label: 'Masculino' },
        { value: 'femenino', label: 'Femenino' },
        { value: 'otro', label: 'Otro' },
      ] : name === 'status' ? [
        { value: 'active', label: 'Activo' },
        { value: 'inactive', label: 'Inactivo' },
        { value: 'suspended', label: 'Suspendido' },
      ] : undefined}
    />
  )

  return (
    <>
      <fieldset className="client-form-section">
        <legend>Datos principales</legend>
        <div className="client-form-grid">
          {field('dni', 'DNI', 'text', 'Ej: 71234567', {
        maxLength: 8,
        inputMode: 'numeric',
        pattern: '[0-9]{8}',
      })}

      {field('firstName', 'Nombres', 'text', 'Ej: Juan', {
        maxLength: 80,
      })}

      {field('lastName', 'Apellidos', 'text', 'Ej: Pérez', {
        maxLength: 80,
      })}

      {field('email', 'Correo electrónico', 'email', 'socio@correo.com', {
        maxLength: 254,
      })}

      {field('phone', 'Teléfono', 'tel', '987654321', {
        maxLength: 9,
        inputMode: 'numeric',
        pattern: '9[0-9]{8}',
      })}
          {includeStatus && field('status', 'Estado del socio', 'select')}
        </div>
      </fieldset>

      <details className="client-optional-fields">
        <summary>Datos adicionales <span>(opcionales)</span></summary>
        <div className="client-form-grid">
          {field('birthDate', 'Fecha de nacimiento', 'date', undefined, {
            max: new Date().toLocaleDateString('en-CA'),
          })}
          {field('gender', 'Género', 'select')}
          {field('address', 'Dirección', 'text', 'Av. Las Camelias 450')}
          {field('emergencyContactName', 'Contacto de emergencia', 'text', 'Nombre y apellido')}
          {field('emergencyContactPhone', 'Teléfono de emergencia', 'tel', 'Ej: 987654321', {
            maxLength: 9,
            inputMode: 'numeric',
            pattern: '9[0-9]{8}',
          })}
          {field('medicalConditions', 'Información médica relevante', 'textarea')}
          {field('notes', 'Notas internas', 'textarea')}
        </div>
      </details>
    </>
  )
}
