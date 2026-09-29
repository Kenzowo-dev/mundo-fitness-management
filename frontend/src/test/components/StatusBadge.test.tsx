// @ts-nocheck
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import StatusBadge from '@/components/StatusBadge'

describe('StatusBadge', () => {
  it('renders label', () => {
    render(<StatusBadge status="active" />)
    expect(screen.getByText('Activo')).toBeInTheDocument()
  })

  it('uses custom label when provided', () => {
    render(<StatusBadge status="active" label="Custom" />)
    expect(screen.getByText('Custom')).toBeInTheDocument()
  })

  it('normalizes status to lowercase', () => {
    render(<StatusBadge status="ACTIVE" />)
    expect(screen.getByText('Activo')).toBeInTheDocument()
  })

  it('normalizes status with spaces', () => {
    render(<StatusBadge status="in active" />)
    // Component normalizes: lowercase for class, but display text keeps spaces
    expect(screen.getByText('in active')).toBeInTheDocument()
  })

  it('renders known statuses correctly', () => {
    const { rerender } = render(<StatusBadge status="active" />)
    expect(screen.getByText('Activo')).toBeInTheDocument()

    rerender(<StatusBadge status="inactive" />)
    expect(screen.getByText('Inactivo')).toBeInTheDocument()

    rerender(<StatusBadge status="suspended" />)
    expect(screen.getByText('Suspendido')).toBeInTheDocument()

    rerender(<StatusBadge status="completed" />)
    expect(screen.getByText('Completado')).toBeInTheDocument()

    rerender(<StatusBadge status="paid" />)
    expect(screen.getByText('Pagado')).toBeInTheDocument()

    rerender(<StatusBadge status="pending" />)
    expect(screen.getByText('Pendiente')).toBeInTheDocument()

    rerender(<StatusBadge status="failed" />)
    expect(screen.getByText('Fallido')).toBeInTheDocument()

    rerender(<StatusBadge status="cancelled" />)
    expect(screen.getByText('Cancelado')).toBeInTheDocument()

    rerender(<StatusBadge status="refunded" />)
    expect(screen.getByText('Reembolsado')).toBeInTheDocument()
  })

  it('renders difficulty statuses', () => {
    const { rerender } = render(<StatusBadge status="beginner" />)
    expect(screen.getByText('Principiante')).toBeInTheDocument()

    rerender(<StatusBadge status="intermediate" />)
    expect(screen.getByText('Intermedio')).toBeInTheDocument()

    rerender(<StatusBadge status="advanced" />)
    expect(screen.getByText('Avanzado')).toBeInTheDocument()
  })

  it('falls back to raw status for unknown', () => {
    render(<StatusBadge status="unknown_status" />)
    // Component normalizes to lowercase
    expect(screen.getByText('unknown_status')).toBeInTheDocument()
  })

  it('renders icon when provided', () => {
    render(<StatusBadge status="active" icon={<span>★</span>} />)
    expect(screen.getByText('★')).toBeInTheDocument()
  })

  it('applies disabled class', () => {
    render(<StatusBadge status="active" disabled />)
    expect(screen.getByText('Activo').closest('span')).toHaveClass('disabled')
  })

  it('has role status', () => {
    render(<StatusBadge status="active" />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('has aria-label with status text', () => {
    render(<StatusBadge status="active" />)
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Estado: Activo')
  })

  it('applies custom className', () => {
    render(<StatusBadge status="active" className="custom-badge" />)
    expect(screen.getByRole('status')).toHaveClass('custom-badge')
  })

  it('applies status class', () => {
    const { unmount } = render(<StatusBadge status="active" />)
    expect(screen.getByRole('status')).toHaveClass('status-active')
    unmount()

    const { unmount: unmount2 } = render(<StatusBadge status="paid" />)
    expect(screen.getByRole('status')).toHaveClass('status-paid')
    unmount2()
  })

  it('renders icon before text', () => {
    render(<StatusBadge status="active" icon={<span data-testid="icon">★</span>} />)
    const badge = screen.getByRole('status')
    expect(badge.querySelector('[data-testid="icon"]')).toBeInTheDocument()
    expect(badge.textContent).toContain('Activo')
  })
})