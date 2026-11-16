import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import SettingsPage from '@/pages/settings/SettingsPage'
import Login from '@/pages/auth/Login'
import * as authModule from '@/context/useAuth'
import * as apiHooks from '@/hooks/useApi'

const user = {
  id: 1, email: 'admin@example.com', firstName: 'Ana', lastName: 'Pérez', phone: '999123456',
  birthDate: '1990-01-02T00:00:00.000Z', gender: 'femenino', role: 'admin', isActive: true,
  emailVerified: true, createdAt: '', updatedAt: '',
}

function setup(path = '/configuracion') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/configuracion" element={<SettingsPage />} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('SettingsPage', () => {
  const update = { mutateAsync: vi.fn(), isPending: false }
  const password = { mutateAsync: vi.fn(), isPending: false }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(authModule, 'useAuth').mockReturnValue({ user, isLoading: false } as ReturnType<typeof authModule.useAuth>)
    vi.spyOn(apiHooks, 'useUpdateCurrentUser').mockReturnValue(update as unknown as ReturnType<typeof apiHooks.useUpdateCurrentUser>)
    vi.spyOn(apiHooks, 'useChangePassword').mockReturnValue(password as unknown as ReturnType<typeof apiHooks.useChangePassword>)
  })

  it('shows only working account sections and current profile values', () => {
    setup()
    expect(screen.getByRole('heading', { name: 'Configuración' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Perfil' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Seguridad' })).toBeInTheDocument()
    expect(screen.queryByRole('tab', { name: 'Preferencias' })).not.toBeInTheDocument()
    expect(screen.getByLabelText('Teléfono')).toHaveValue('999123456')
    expect(screen.getByLabelText('Fecha de nacimiento')).toHaveValue('1990-01-02')
    expect(screen.getByText('admin@example.com')).toBeInTheDocument()
    expect(screen.getByText('Administrador')).toBeInTheDocument()
  })

  it('omits an empty birth date while saving and keeps success feedback visible', async () => {
    update.mutateAsync.mockResolvedValue(user)
    setup()
    fireEvent.change(screen.getByLabelText('Fecha de nacimiento'), { target: { value: '' } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))
    await waitFor(() => expect(update.mutateAsync).toHaveBeenCalled())
    expect(update.mutateAsync.mock.calls[0][0]).not.toHaveProperty('birthDate')
    expect(await screen.findByText('Perfil actualizado correctamente.')).toBeInTheDocument()
  })

  it('requires matching valid passwords then asks for a fresh login', async () => {
    password.mutateAsync.mockResolvedValue(undefined)
    setup()
    fireEvent.click(screen.getByRole('tab', { name: 'Seguridad' }))
    fireEvent.change(screen.getByLabelText(/Contraseña actual/), { target: { value: 'Current123!' } })
    fireEvent.change(screen.getByLabelText(/Nueva contraseña/), { target: { value: 'NewPass123!' } })
    fireEvent.change(screen.getByLabelText(/Confirmar nueva contraseña/), { target: { value: 'NewPass123!' } })
    fireEvent.click(screen.getByRole('button', { name: 'Cambiar contraseña' }))
    expect(await screen.findByText('Contraseña actualizada. Inicia sesión con tu nueva contraseña.')).toBeInTheDocument()
  })

  it('only lets letters in the names and digits in the phone', () => {
    setup()
    const firstName = screen.getByLabelText(/^Nombre/)
    const lastName = screen.getByLabelText(/^Apellido/)
    const phone = screen.getByLabelText('Teléfono')
    fireEvent.change(firstName, { target: { value: 'Ana2 María$' } })
    fireEvent.change(lastName, { target: { value: 'Pérez-López 3' } })
    fireEvent.change(phone, { target: { value: '+51 987-654-321' } })
    expect(firstName).toHaveValue('Ana María')
    expect(lastName).toHaveValue('PérezLópez ')
    expect(phone).toHaveValue('519876543')
  })

  it('shows field errors and does not save an invalid phone', async () => {
    setup()
    fireEvent.change(screen.getByLabelText('Teléfono'), { target: { value: '12345' } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))
    expect(await screen.findByText('El teléfono debe tener 9 dígitos y comenzar con 9.')).toBeInTheDocument()
    expect(update.mutateAsync).not.toHaveBeenCalled()
  })

  it('limits the birth date calendar to 1950 and rejects older dates', async () => {
    setup()
    const birthDate = screen.getByLabelText('Fecha de nacimiento')
    expect(birthDate).toHaveAttribute('min', '1950-01-01')
    fireEvent.change(birthDate, { target: { value: '1949-12-31' } })
    // El navegador ya lo marca como inválido; además lo valida el formulario al enviarse.
    expect((birthDate as HTMLInputElement).validity.rangeUnderflow).toBe(true)
    fireEvent.submit(screen.getByRole('button', { name: 'Guardar cambios' }).closest('form')!)
    expect(await screen.findByText('La fecha de nacimiento debe ser desde el año 1950.')).toBeInTheDocument()
    expect(update.mutateAsync).not.toHaveBeenCalled()
  })

  it('shows old phones saved as +51 without the prefix', () => {
    vi.spyOn(authModule, 'useAuth').mockReturnValue({ user: { ...user, phone: '+51987654321' }, isLoading: false } as ReturnType<typeof authModule.useAuth>)
    setup()
    expect(screen.getByLabelText('Teléfono')).toHaveValue('987654321')
  })
})
