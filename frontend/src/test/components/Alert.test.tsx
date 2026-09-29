// @ts-nocheck
import { vi, describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Alert from '@/components/Alert'

describe('Alert', () => {
  it('renders message', () => {
    render(<Alert type="success" message="Success message" />)
    expect(screen.getByText('Success message')).toBeInTheDocument()
  })

  it('renders title', () => {
    render(<Alert type="error" title="Error" message="Something went wrong" />)
    expect(screen.getByText('Error')).toBeInTheDocument()
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
  })

  it('renders different types', () => {
    const { rerender } = render(<Alert type="success" message="OK" />)
    expect(screen.getByRole('status')).toBeInTheDocument()

    rerender(<Alert type="error" message="Error" />)
    expect(screen.getByRole('alert')).toBeInTheDocument()

    rerender(<Alert type="warning" message="Warning" />)
    expect(screen.getByRole('status')).toBeInTheDocument()

    rerender(<Alert type="info" message="Info" />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('error type uses role="alert"', () => {
    render(<Alert type="error" message="Error" />)
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('non-error types use role="status"', () => {
    const { rerender } = render(<Alert type="success" message="OK" />)
    expect(screen.getByRole('status')).toBeInTheDocument()

    rerender(<Alert type="warning" message="Warning" />)
    expect(screen.getByRole('status')).toBeInTheDocument()

    rerender(<Alert type="info" message="Info" />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('allows custom role', () => {
    render(<Alert type="success" message="OK" role="alert" />)
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('has correct aria-live for error', () => {
    render(<Alert type="error" message="Error" />)
    expect(screen.getByRole('alert')).toHaveAttribute('aria-live', 'assertive')
  })

  it('has correct aria-live for non-error', () => {
    render(<Alert type="success" message="OK" />)
    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite')
  })

  it('has aria-atomic', () => {
    render(<Alert type="success" message="OK" />)
    expect(screen.getByRole('status')).toHaveAttribute('aria-atomic', 'true')
  })

  it('shows dismiss button when dismissible', () => {
    render(<Alert type="success" message="OK" dismissible />)
    expect(screen.getByRole('button', { name: 'Descartar' })).toBeInTheDocument()
  })

  it('calls onDismiss when dismiss button clicked', () => {
    const onDismiss = vi.fn()
    render(<Alert type="success" message="OK" dismissible onDismiss={onDismiss} />)
    fireEvent.click(screen.getByRole('button', { name: 'Descartar' }))
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it('uses custom dismiss label', () => {
    render(<Alert type="success" message="OK" dismissible dismissLabel="Close" />)
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument()
  })

  it('does not show dismiss button when not dismissible', () => {
    render(<Alert type="success" message="OK" />)
    expect(screen.queryByRole('button', { name: 'Descartar' })).not.toBeInTheDocument()
  })

  it('renders icon for each type', () => {
    const { rerender, container } = render(<Alert type="success" message="OK" />)
    expect(container.querySelector('svg')).toBeInTheDocument()

    rerender(<Alert type="error" message="Error" />)
    expect(container.querySelector('svg')).toBeInTheDocument()

    rerender(<Alert type="warning" message="Warning" />)
    expect(container.querySelector('svg')).toBeInTheDocument()

    rerender(<Alert type="info" message="Info" />)
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('renders ReactNode message', () => {
    render(<Alert type="success" message={<strong>Bold message</strong>} />)
    expect(screen.getByText('Bold message')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    render(<Alert type="success" message="OK" className="custom-alert" />)
    expect(screen.getByRole('status')).toHaveClass('custom-alert')
  })

  it('icon has aria-hidden', () => {
    render(<Alert type="success" message="OK" />)
    const icon = screen.getByRole('status').querySelector('[aria-hidden="true"]')
    expect(icon).toBeInTheDocument()
  })

  it('applies type class', () => {
    const { rerender } = render(<Alert type="success" message="OK" />)
    expect(screen.getByRole('status')).toHaveClass('alert-success')

    rerender(<Alert type="error" message="Error" />)
    expect(screen.getByRole('alert')).toHaveClass('alert-error')

    rerender(<Alert type="warning" message="Warning" />)
    expect(screen.getByRole('status')).toHaveClass('alert-warning')

    rerender(<Alert type="info" message="Info" />)
    expect(screen.getByRole('status')).toHaveClass('alert-info')
  })
})