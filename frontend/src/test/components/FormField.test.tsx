// @ts-nocheck
import { vi, describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import FormField from '@/components/FormField'

describe('FormField', () => {
  const defaultProps = {
    label: 'Test Label',
    id: 'test-field',
  }

  it('renders label', () => {
    render(<FormField {...defaultProps} />)
    expect(screen.getByLabelText('Test Label')).toBeInTheDocument()
  })

  it('renders required indicator', () => {
    render(<FormField {...defaultProps} required />)
    expect(screen.getByText('*')).toBeInTheDocument()
  })

  it('renders input for text type', () => {
    render(<FormField {...defaultProps} type="text" />)
    expect(screen.getByLabelText('Test Label')).toBeInTheDocument()
  })

  it('renders select for select type', () => {
    render(<FormField {...defaultProps} type="select" options={[{ value: '1', label: 'Option 1' }]} />)
    expect(screen.getByLabelText('Test Label')).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Option 1' })).toBeInTheDocument()
  })

  it('renders textarea for textarea type', () => {
    render(<FormField {...defaultProps} type="textarea" />)
    expect(screen.getByLabelText('Test Label')).toBeInTheDocument()
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('shows error message', () => {
    render(<FormField {...defaultProps} error="This field is required" />)
    expect(screen.getAllByText('This field is required')).toHaveLength(2) // Input + FormField
  })

  it('shows helper text', () => {
    render(<FormField {...defaultProps} helperText="Helper text" />)
    expect(screen.getAllByText('Helper text')).toHaveLength(2) // Input + FormField
  })

  it('hides helper text when error is present', () => {
    render(<FormField {...defaultProps} error="Error" helperText="Helper" />)
    expect(screen.getAllByText('Error')).toHaveLength(2)
    // FormField's helper text should not be rendered when error is present
    expect(screen.queryByText('Helper')).not.toBeInTheDocument()
  })

  it('calls onChange with value', () => {
    const handleChange = vi.fn()
    render(<FormField {...defaultProps} onChange={handleChange} value="test" />)
    fireEvent.change(screen.getByLabelText('Test Label'), { target: { value: 'new value' } })
    expect(handleChange).toHaveBeenCalledWith('new value')
  })

  it('calls onBlur', () => {
    const handleBlur = vi.fn()
    render(<FormField {...defaultProps} onBlur={handleBlur} />)
    fireEvent.blur(screen.getByLabelText('Test Label'))
    expect(handleBlur).toHaveBeenCalledTimes(1)
  })

  it('applies disabled state', () => {
    render(<FormField {...defaultProps} disabled />)
    expect(screen.getByLabelText('Test Label')).toBeDisabled()
  })

  it('renders empty option label for select', () => {
    render(<FormField {...defaultProps} type="select" options={[{ value: '1', label: 'Option 1' }]} emptyOptionLabel="-- Select --" />)
    expect(screen.getByRole('option', { name: '-- Select --' })).toBeInTheDocument()
  })

  it('applies error class to container', () => {
    const { container } = render(<FormField {...defaultProps} error="Error" />)
    expect(container.firstChild).toHaveClass('form-field-error')
  })

  it('forwards additional className', () => {
    const { container } = render(<FormField {...defaultProps} className="custom-class" />)
    expect(container.firstChild).toHaveClass('custom-class')
  })

  it('associates label with input via htmlFor', () => {
    render(<FormField {...defaultProps} id="test-id" />)
    const label = screen.getByText('Test Label').closest('label')
    expect(label).toHaveAttribute('for', 'test-id')
  })

  it('renders input with correct type', () => {
    const { rerender } = render(<FormField {...defaultProps} type="email" />)
    expect(screen.getByLabelText('Test Label')).toHaveAttribute('type', 'email')

    rerender(<FormField {...defaultProps} type="password" />)
    expect(screen.getByLabelText('Test Label')).toHaveAttribute('type', 'password')

    rerender(<FormField {...defaultProps} type="tel" />)
    expect(screen.getByLabelText('Test Label')).toHaveAttribute('type', 'tel')

    rerender(<FormField {...defaultProps} type="number" />)
    expect(screen.getByLabelText('Test Label')).toHaveAttribute('type', 'number')

    rerender(<FormField {...defaultProps} type="date" />)
    expect(screen.getByLabelText('Test Label')).toHaveAttribute('type', 'date')
  })
})