import type { Client } from '../types/api.js'
import FormField from './FormField'
import { BIRTH_DATE_MIN, sanitizeNameInput, todayIsoDate } from '../utils/validation'

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

const numericFieldLengths: Partial<Record<ClientFormField, number>> = {
  dni: 8,
  phone: 9,
  emergencyContactPhone: 9,
}

// Todos los "Datos principales" son obligatorios; los "Datos adicionales" son opcionales.
const requiredFields: ClientFormField[] = ['dni', 'firstName', 'lastName', 'email', 'phone']

interface ClientFormFieldsProps {
  idPrefix: 'create' | 'edit'
  values: ClientFormValues
  errors?: ClientFormErrors
  onChange: (field: ClientFormField, value: string) => void
  includeStatus?: boolean
}

export default function ClientFormFields({
  idPrefix,
  values,
  errors = {},
  onChange,
  includeStatus = false,
}: ClientFormFieldsProps) {
  const field = (name: ClientFormField, label: string, type: 'text' | 'email' | 'tel' | 'date' | 'select' | 'textarea', placeholder?: string) => {
    const maxLength = numericFieldLengths[name]

    return (
      <FormField
        label={label}
        type={type}
        id={`${idPrefix}-${name === 'firstName' ? 'name' : name === 'lastName' ? 'lastname' : name}`}
        name={name}
        value={values[name] ?? ''}
        onChange={(value) => onChange(name, maxLength
          ? value.replace(/\D/g, '').slice(0, maxLength)
          : name === 'firstName' || name === 'lastName' || name === 'emergencyContactName' ? sanitizeNameInput(value) : value)}
        min={name === 'birthDate' ? BIRTH_DATE_MIN : undefined}
        max={name === 'birthDate' ? todayIsoDate() : undefined}
        required={requiredFields.includes(name)}
        placeholder={type === 'select' ? undefined : placeholder}
        error={errors[name]}
        inputMode={maxLength ? 'numeric' : undefined}
        maxLength={maxLength}
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
  }

  return (
    <>
      <fieldset className="client-form-section">
        <legend>Datos principales</legend>
        <div className="client-form-grid">
          {field('dni', 'DNI', 'text', 'Ej: 71234567')}
          {field('firstName', 'Nombres', 'text', 'Ej: Juan')}
          {field('lastName', 'Apellidos', 'text', 'Ej: Pérez')}
          {field('email', 'Correo electrónico', 'email', 'socio@correo.com')}
          {field('phone', 'Teléfono', 'tel', '987654321')}
          {includeStatus && field('status', 'Estado del socio', 'select')}
        </div>
      </fieldset>

      <details className="client-optional-fields">
        <summary>Datos adicionales <span>(opcionales)</span></summary>
        <div className="client-form-grid">
          {field('birthDate', 'Fecha de nacimiento', 'date')}
          {field('gender', 'Género', 'select')}
          {field('address', 'Dirección', 'text', 'Av. Las Camelias 450')}
          {field('emergencyContactName', 'Contacto de emergencia', 'text', 'Nombre y apellido')}
          {field('emergencyContactPhone', 'Teléfono de emergencia', 'tel', 'Ej: 987654321')}
          {field('medicalConditions', 'Información médica relevante', 'textarea')}
          {field('notes', 'Notas internas', 'textarea')}
        </div>
      </details>
    </>
  )
}
