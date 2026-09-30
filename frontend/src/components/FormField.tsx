import { Input, Select, Textarea } from './Input'
import '@/styles/components/FormField.css'

export type FieldType = 'text' | 'search' | 'email' | 'password' | 'tel' | 'number' | 'date' | 'select' | 'textarea'

interface FormFieldProps {
  label: string
  type?: FieldType
  id: string
  name?: string
  value?: string
  onChange?: (value: string) => void
  onBlur?: () => void
  placeholder?: string
  error?: string
  helperText?: string
  required?: boolean
  disabled?: boolean
  options?: Array<{ value: string; label: string }>
  emptyOptionLabel?: string
  autoComplete?: string
  maxLength?: number
  className?: string
}

export default function FormField({
  label,
  type = 'text',
  id,
  name,
  value = '',
  onChange,
  onBlur,
  placeholder,
  error,
  helperText,
  required = false,
  disabled = false,
  options,
  emptyOptionLabel,
  autoComplete,
  maxLength,
  className = '',
}: FormFieldProps) {
  const renderInput = () => {
    const commonProps = {
      id,
      name: name || id,
      value,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => onChange?.(e.target.value),
      onBlur,
      placeholder,
      disabled,
      error,
      helperText,
      className: 'form-field-input',
    }

    switch (type) {
      case 'select':
        return (
          <Select {...commonProps} error={error} helperText={helperText}>
            {emptyOptionLabel && <option value="">{emptyOptionLabel}</option>}
            {options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        )
      case 'textarea':
        return <Textarea {...commonProps} maxLength={maxLength} />
      default:
        return <Input {...commonProps} type={type} autoComplete={autoComplete} maxLength={maxLength} />
    }
  }

  return (
    <div className={`form-field ${error ? 'form-field-error' : ''} ${className}`}>
      <label htmlFor={id} className="form-field-label">
        {label}
        {required && <span className="form-field-required" aria-hidden="true">*</span>}
      </label>

      <div className="form-field-wrapper">
        {renderInput()}
      </div>

      {error && (
        <p id={`${id}-error`} className="form-field-error-message" aria-live="polite" aria-atomic="true">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p id={`${id}-helper`} className="form-field-helper-text">
          {helperText}
        </p>
      )}
    </div>
  )
}
