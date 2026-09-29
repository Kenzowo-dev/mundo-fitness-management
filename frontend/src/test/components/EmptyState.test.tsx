// @ts-nocheck
import { vi, describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import EmptyState from '@/components/EmptyState'

describe('EmptyState', () => {
  it('renders title', () => {
    render(<EmptyState title="No data" />)
    expect(screen.getByRole('heading', { name: 'No data' })).toBeInTheDocument()
  })

  it('renders description', () => {
    render(<EmptyState title="No data" description="There is nothing here" />)
    expect(screen.getByText('There is nothing here')).toBeInTheDocument()
  })

  it('renders icon when provided', () => {
    render(<EmptyState title="No data" icon={<span>📦</span>} />)
    expect(screen.getByText('📦')).toBeInTheDocument()
  })

  it('icon is decorative (aria-hidden)', () => {
    render(<EmptyState title="No data" icon={<span>📦</span>} />)
    const icon = screen.getByText('📦').parentElement
    expect(icon).toHaveAttribute('aria-hidden', 'true')
  })

  it('renders primary action button', () => {
    const handleClick = vi.fn()
    render(<EmptyState title="No data" action={{ label: 'Add item', onClick: handleClick }} />)
    expect(screen.getByRole('button', { name: 'Add item' })).toBeInTheDocument()
  })

  it('calls action onClick', () => {
    const handleClick = vi.fn()
    render(<EmptyState title="No data" action={{ label: 'Add item', onClick: handleClick }} />)
    fireEvent.click(screen.getByRole('button', { name: 'Add item' }))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('uses action variant', () => {
    const { container } = render(<EmptyState title="No data" action={{ label: 'Add', onClick: vi.fn(), variant: 'secondary' }} />)
    expect(container.querySelector('button')).toHaveClass('btn-secondary')
  })

  it('renders secondary action', () => {
    render(<EmptyState title="No data" secondaryAction={{ label: 'Learn more', onClick: vi.fn() }} />)
    expect(screen.getByRole('button', { name: 'Learn more' })).toBeInTheDocument()
  })

  it('secondary action uses ghost variant', () => {
    const { container } = render(<EmptyState title="No data" secondaryAction={{ label: 'Learn', onClick: vi.fn() }} />)
    expect(container.querySelector('button')).toHaveClass('btn-ghost')
  })

  it('renders both actions', () => {
    render(<EmptyState title="No data" action={{ label: 'Primary', onClick: vi.fn() }} secondaryAction={{ label: 'Secondary', onClick: vi.fn() }} />)
    expect(screen.getByRole('button', { name: 'Primary' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Secondary' })).toBeInTheDocument()
  })

  it('applies size classes', () => {
    const { rerender } = render(<EmptyState title="No data" size="sm" />)
    expect(screen.getByRole('status')).toHaveClass('empty-state-sm')

    rerender(<EmptyState title="No data" size="md" />)
    expect(screen.getByRole('status')).toHaveClass('empty-state-md')

    rerender(<EmptyState title="No data" size="lg" />)
    expect(screen.getByRole('status')).toHaveClass('empty-state-lg')
  })

  it('has role status', () => {
    render(<EmptyState title="No data" />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('has aria-label with title', () => {
    render(<EmptyState title="No data found" />)
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'No data found')
  })

  it('applies custom className', () => {
    render(<EmptyState title="No data" className="custom-empty" />)
    expect(screen.getByRole('status')).toHaveClass('custom-empty')
  })

  it('does not render actions div when no actions', () => {
    render(<EmptyState title="No data" />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('does not render description when not provided', () => {
    render(<EmptyState title="No data" />)
    expect(screen.queryByText('There is nothing here')).not.toBeInTheDocument()
  })

  it('does not render icon when not provided', () => {
    render(<EmptyState title="No data" />)
    expect(screen.queryByText('📦')).not.toBeInTheDocument()
  })
})