import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import ThemeToggle from '@/components/ThemeToggle'

describe('ThemeToggle', () => {
  beforeEach(() => {
    document.documentElement.dataset.theme = 'light'
    vi.mocked(localStorage.getItem).mockReset()
    vi.mocked(localStorage.setItem).mockReset()
  })

  it('keeps both controls synchronized and preserves selection when remounted', () => {
    const first = render(<ThemeToggle />)
    const second = render(<ThemeToggle />)
    fireEvent.click(screen.getAllByRole('button', { name: 'Activar tema oscuro' })[0])
    expect(localStorage.setItem).toHaveBeenCalledWith('mf-theme-v1', 'dark')
    expect(screen.getAllByRole('button', { name: 'Activar tema claro' })).toHaveLength(2)
    first.unmount()
    second.unmount()
    render(<ThemeToggle />)
    expect(screen.getByRole('button', { name: 'Activar tema claro' })).toBeInTheDocument()
  })

  it('lets the user change theme when persistent storage is denied', () => {
    vi.mocked(localStorage.setItem).mockImplementation(() => { throw new DOMException('Denied', 'SecurityError') })
    render(<ThemeToggle />)
    fireEvent.click(screen.getByRole('button', { name: 'Activar tema oscuro' }))
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark')
    expect(screen.getByRole('button', { name: 'Activar tema claro' })).toBeInTheDocument()
  })

  it('responds to a saved preference from another tab', () => {
    render(<ThemeToggle />)
    act(() => window.dispatchEvent(new StorageEvent('storage', { key: 'mf-theme-v1', newValue: 'dark' })))
    expect(screen.getByRole('button', { name: 'Activar tema claro' })).toBeInTheDocument()
  })
})
