// @ts-nocheck
import { vi, describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Pagination from '@/components/Pagination'

describe('Pagination', () => {
  const defaultProps = {
    currentPage: 2,
    totalPages: 5,
    totalItems: 50,
    onPageChange: vi.fn(),
  }

  it('renders when totalPages > 1', () => {
    render(<Pagination {...defaultProps} />)
    expect(screen.getByRole('navigation')).toBeInTheDocument()
  })

  it('does not render when totalPages <= 1', () => {
    render(<Pagination {...defaultProps} totalPages={1} />)
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
  })

  it('shows previous button', () => {
    render(<Pagination {...defaultProps} />)
    expect(screen.getByRole('button', { name: 'Página anterior' })).toBeInTheDocument()
  })

  it('shows next button', () => {
    render(<Pagination {...defaultProps} />)
    expect(screen.getByRole('button', { name: 'Página siguiente' })).toBeInTheDocument()
  })

  it('shows page info', () => {
    render(<Pagination {...defaultProps} />)
    expect(screen.getByText(/Página 2 de 5 \(50 total\)/)).toBeInTheDocument()
  })

  it('shows page info without totalItems', () => {
    render(<Pagination {...defaultProps} totalItems={undefined} />)
    expect(screen.getByText(/Página 2 de 5/)).toBeInTheDocument()
  })

  it('calls onPageChange with previous page', () => {
    render(<Pagination {...defaultProps} />)
    fireEvent.click(screen.getByRole('button', { name: 'Página anterior' }))
    expect(defaultProps.onPageChange).toHaveBeenCalledWith(1)
  })

  it('calls onPageChange with next page', () => {
    render(<Pagination {...defaultProps} />)
    fireEvent.click(screen.getByRole('button', { name: 'Página siguiente' }))
    expect(defaultProps.onPageChange).toHaveBeenCalledWith(3)
  })

  it('disables previous button on first page', () => {
    render(<Pagination {...defaultProps} currentPage={1} />)
    expect(screen.getByRole('button', { name: 'Página anterior' })).toBeDisabled()
  })

  it('disables next button on last page', () => {
    render(<Pagination {...defaultProps} currentPage={5} />)
    expect(screen.getByRole('button', { name: 'Página siguiente' })).toBeDisabled()
  })

  it('disables both buttons when disabled prop is true', () => {
    render(<Pagination {...defaultProps} disabled />)
    expect(screen.getByRole('button', { name: 'Página anterior' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Página siguiente' })).toBeDisabled()
  })

  it('does not call onPageChange when disabled', () => {
    const onPageChange = vi.fn()
    render(<Pagination {...defaultProps} disabled onPageChange={onPageChange} />)
    fireEvent.click(screen.getByRole('button', { name: 'Página anterior' }))
    expect(onPageChange).not.toHaveBeenCalled()
  })

  it('has correct aria-label', () => {
    render(<Pagination {...defaultProps} ariaLabel="Custom pagination" />)
    expect(screen.getByRole('navigation')).toHaveAttribute('aria-label', 'Custom pagination')
  })

  it('has aria-live on page info', () => {
    render(<Pagination {...defaultProps} />)
    expect(screen.getByText(/Página 2 de 5 \(50 total\)/)).toHaveAttribute('aria-live', 'polite')
  })

  it('applies correct button classes', () => {
    render(<Pagination {...defaultProps} />)
    expect(screen.getByRole('button', { name: 'Página anterior' })).toHaveClass('btn-secondary')
    expect(screen.getByRole('button', { name: 'Página siguiente' })).toHaveClass('btn-secondary')
    expect(screen.getByRole('button', { name: 'Página anterior' })).toHaveClass('btn-sm')
  })

  it('handles edge case: single page with totalItems', () => {
    render(<Pagination currentPage={1} totalPages={1} totalItems={10} onPageChange={vi.fn()} />)
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
  })

  it('uses secondary variant buttons', () => {
    render(<Pagination {...defaultProps} />)
    const prevBtn = screen.getByRole('button', { name: 'Página anterior' })
    const nextBtn = screen.getByRole('button', { name: 'Página siguiente' })
    expect(prevBtn).toHaveClass('btn-secondary')
    expect(nextBtn).toHaveClass('btn-secondary')
  })
})