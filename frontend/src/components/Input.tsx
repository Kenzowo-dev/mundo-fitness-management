import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes, ForwardRefExoticComponent, RefAttributes } from 'react'
import '@/styles/components/Input.css'

export type InputSize = 'sm' | 'md' | 'lg'

interface BaseInputProps {
  size?: InputSize
  error?: string
  helperText?: string
  id: string
  disabled?: boolean
  className?: string
}

interface InputProps extends BaseInputProps, Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'id' | 'disabled'> {}
interface SelectProps extends BaseInputProps, Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size' | 'id' | 'disabled'> {}
interface TextareaProps extends BaseInputProps, Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'size' | 'id' | 'disabled'> {}

const Input = ((props: InputProps, ref: React.Ref<HTMLInputElement>) => {
  const { size = 'md', error, helperText, id, disabled = false, className = '', ...rest } = props
  const errorId = error ? `${id}-error` : undefined
  const helperId = helperText ? `${id}-helper` : undefined

  const describedBy = [errorId, helperId].filter(Boolean).join(' ') || undefined

  return (
    <div className={`input-wrapper ${error ? 'input-wrapper-error' : ''} ${className}`}>
      <input
        ref={ref}
        id={id}
        disabled={disabled}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={describedBy}
        className={`input input-${size} ${error ? 'input-error' : ''}`}
        {...rest}
      />
    </div>
  )
}) as ForwardRefExoticComponent<InputProps & RefAttributes<HTMLInputElement>>

Input.displayName = 'Input'

const Select = ((props: SelectProps, ref: React.Ref<HTMLSelectElement>) => {
  const { size = 'md', error, helperText, id, disabled = false, className = '', children, ...rest } = props
  const errorId = error ? `${id}-error` : undefined
  const helperId = helperText ? `${id}-helper` : undefined

  const describedBy = [errorId, helperId].filter(Boolean).join(' ') || undefined

  return (
    <div className={`input-wrapper ${error ? 'input-wrapper-error' : ''} ${className}`}>
      <select
        ref={ref}
        id={id}
        disabled={disabled}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={describedBy}
        className={`input input-${size} input-select ${error ? 'input-error' : ''}`}
        {...rest}
      >
        {children}
      </select>
    </div>
  )
}) as ForwardRefExoticComponent<SelectProps & RefAttributes<HTMLSelectElement>>

Select.displayName = 'Select'

const Textarea = ((props: TextareaProps, ref: React.Ref<HTMLTextAreaElement>) => {
  const { size = 'md', error, helperText, id, disabled = false, className = '', ...rest } = props
  const errorId = error ? `${id}-error` : undefined
  const helperId = helperText ? `${id}-helper` : undefined

  const describedBy = [errorId, helperId].filter(Boolean).join(' ') || undefined

  return (
    <div className={`input-wrapper ${error ? 'input-wrapper-error' : ''} ${className}`}>
      <textarea
        ref={ref}
        id={id}
        disabled={disabled}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={describedBy}
        className={`input input-${size} input-textarea ${error ? 'input-error' : ''}`}
        {...rest}
      />
    </div>
  )
}) as ForwardRefExoticComponent<TextareaProps & RefAttributes<HTMLTextAreaElement>>

Textarea.displayName = 'Textarea'

export { Input, Select, Textarea }
