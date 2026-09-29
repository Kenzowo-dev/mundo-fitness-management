// @ts-nocheck
import { vi, describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Modal from '@/components/Modal'

describe('Modal', () => {
  const createDefaultProps = () => ({
    open: true,
    onClose: vi.fn(),
    title: 'Test Modal',
    children: <div>Modal content</div>,
  })

  const getDialog = () => screen.getByRole('dialog', { hidden: true })

  it('renders when open', () => {
    render(<Modal {...createDefaultProps()} />)
    expect(getDialog()).toBeInTheDocument()
    expect(screen.getByText('Test Modal')).toBeInTheDocument()
    expect(screen.getByText('Modal content')).toBeInTheDocument()
  })

  it('does not render when closed', () => {
    render(<Modal {...createDefaultProps()} open={false} />)
    expect(screen.queryByRole('dialog', { hidden: true })).not.toBeInTheDocument()
  })

  it('calls onClose when close button clicked', () => {
    const onClose = vi.fn()
    render(<Modal {...createDefaultProps()} onClose={onClose} />)
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar', hidden: true }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when Escape pressed', () => {
    const onClose = vi.fn()
    render(<Modal {...createDefaultProps()} onClose={onClose} />)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('does not close on Escape when closeOnEscape=false', () => {
    const onClose = vi.fn()
    render(<Modal {...createDefaultProps()} closeOnEscape={false} onClose={onClose} />)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).not.toHaveBeenCalled()
  })

  it('calls onClose when overlay clicked', () => {
    const onClose = vi.fn()
    render(<Modal {...createDefaultProps()} onClose={onClose} />)
    fireEvent.click(screen.getByTestId('modal-overlay'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('does not close on overlay click when closeOnOverlayClick=false', () => {
    const onClose = vi.fn()
    render(<Modal {...createDefaultProps()} closeOnOverlayClick={false} onClose={onClose} />)
    fireEvent.click(screen.getByTestId('modal-overlay'))
    expect(onClose).not.toHaveBeenCalled()
  })

  it('renders footer when provided', () => {
    render(<Modal {...createDefaultProps()} footer={<button>Footer</button>} />)
    expect(screen.getByText('Footer')).toBeInTheDocument()
  })

  it('applies size class', () => {
    const { rerender } = render(<Modal {...createDefaultProps()} size="sm" />)
    expect(screen.getByRole('dialog', { hidden: true })).toHaveClass('modal-sm')

    rerender(<Modal {...createDefaultProps()} size="lg" />)
    expect(screen.getByRole('dialog', { hidden: true })).toHaveClass('modal-lg')

    rerender(<Modal {...createDefaultProps()} size="xl" />)
    expect(screen.getByRole('dialog', { hidden: true })).toHaveClass('modal-xl')

    rerender(<Modal {...createDefaultProps()} size="full" />)
    expect(screen.getByRole('dialog', { hidden: true })).toHaveClass('modal-full')
  })

  it('has correct ARIA attributes', () => {
    render(<Modal {...createDefaultProps()} />)
    const dialog = screen.getByRole('dialog', { hidden: true })
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveAttribute('aria-labelledby', 'modal-title')
  })

  it('renders close button with aria-label', () => {
    render(<Modal {...createDefaultProps()} closeLabel="Close modal" />)
    expect(screen.getByRole('button', { name: 'Close modal', hidden: true })).toBeInTheDocument()
  })

  it('hides close button when showCloseButton=false', () => {
    render(<Modal {...createDefaultProps()} showCloseButton={false} />)
    expect(screen.queryByRole('button', { name: 'Cerrar', hidden: true })).not.toBeInTheDocument()
  })

  it('stops propagation on modal content click', () => {
    const onClose = vi.fn()
    render(<Modal {...createDefaultProps()} onClose={onClose} />)
    fireEvent.click(screen.getByRole('dialog', { hidden: true }))
    expect(onClose).not.toHaveBeenCalled()
  })

  it('prevents body scroll when open', () => {
    render(<Modal {...createDefaultProps()} />)
    expect(document.body.style.overflow).toBe('hidden')
  })

  it('restores body scroll on close', () => {
    const { unmount } = render(<Modal {...createDefaultProps()} />)
    unmount()
    expect(document.body.style.overflow).toBe('')
  })

  it('forwards additional className', () => {
    render(<Modal {...createDefaultProps()} className="custom-modal" />)
    expect(screen.getByRole('dialog', { hidden: true })).toHaveClass('custom-modal')
  })
})