// @ts-nocheck
import { vi, beforeEach, afterEach, describe, it, expect } from 'vitest'
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import SettingsPage from '@/pages/settings/SettingsPage'
import * as useApiModule from '@/hooks/useApi'
import * as authModule from '@/context/useAuth'

const mockUser = {
  id: 1,
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  role: 'admin',
  isActive: true,
  emailVerified: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{children}</BrowserRouter>
    </QueryClientProvider>
  )
}

const createMockMutation = (overrides: Record<string, unknown> = {}) => ({
  mutateAsync: vi.fn().mockResolvedValue(undefined),
  mutate: vi.fn(),
  isPending: false,
  isSuccess: false,
  isError: false,
  isIdle: true,
  status: 'idle',
  data: undefined,
  error: null,
  variables: undefined,
  context: undefined,
  reset: vi.fn(),
  failureCount: 0,
  failureReason: null,
  submittedAt: 0,
  ...overrides,
})

describe('SettingsPage - Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()

    vi.spyOn(authModule, 'useAuth').mockReturnValue({
      user: mockUser,
      isLoading: false,
      isAuthenticated: true,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
      updateUser: vi.fn(),
    } as ReturnType<typeof authModule.useAuth>)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  const renderSettingsPage = (overrides?: {
    updateMutation?: ReturnType<typeof createMockMutation>
    passwordMutation?: ReturnType<typeof createMockMutation>
  }) => {
    const updateMock = overrides?.updateMutation ?? createMockMutation()
    const passwordMock = overrides?.passwordMutation ?? createMockMutation()

    vi.spyOn(useApiModule, 'useUpdateCurrentUser').mockReturnValue(updateMock as ReturnType<typeof useApiModule.useUpdateCurrentUser>)
    vi.spyOn(useApiModule, 'useChangePassword').mockReturnValue(passwordMock as ReturnType<typeof useApiModule.useChangePassword>)

    return render(<SettingsPage />, { wrapper: createWrapper() })
  }

  const switchTab = async (tabName: string) => {
    await act(async () => {
      fireEvent.click(screen.getByRole('tab', { name: tabName }))
    })
    await waitFor(() => {
      expect(screen.getByRole('tab', { name: tabName })).toHaveAttribute('aria-selected', 'true')
    }, { timeout: 3000 })
  }

  describe('Render inicial', () => {
    it('renders page title', () => {
      renderSettingsPage()
      expect(screen.getByText('Configuración')).toBeInTheDocument()
    })

    it('renders three tabs: Perfil, Seguridad, Preferencias', () => {
      renderSettingsPage()
      expect(screen.getByRole('tab', { name: 'Perfil' })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: 'Seguridad' })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: 'Preferencias' })).toBeInTheDocument()
    })

    it('shows Perfil tab by default', () => {
      renderSettingsPage()
      expect(screen.getByRole('tab', { name: 'Perfil' })).toHaveAttribute('aria-selected', 'true')
      expect(screen.getByRole('tabpanel', { name: 'Perfil' })).toBeInTheDocument()
    })

    it('renders profile form fields', () => {
      renderSettingsPage()
      expect(screen.getByLabelText(/Nombre/)).toBeInTheDocument()
      expect(screen.getByLabelText(/Apellido/)).toBeInTheDocument()
      expect(screen.getByLabelText(/Email/)).toBeInTheDocument()
      expect(screen.getByLabelText(/Rol/)).toBeInTheDocument()
      expect(screen.getByLabelText(/Teléfono/)).toBeInTheDocument()
      expect(screen.getByLabelText(/Fecha de nacimiento/)).toBeInTheDocument()
      expect(screen.getByLabelText(/Género/)).toBeInTheDocument()
    })

    it('shows disabled email and role fields', () => {
      renderSettingsPage()
      expect(screen.getByLabelText('Email')).toBeDisabled()
      expect(screen.getByLabelText('Rol')).toBeDisabled()
      expect(screen.getByLabelText('Email')).toHaveValue('test@example.com')
      expect(screen.getByLabelText('Rol')).toHaveValue('admin')
    })

    it('renders profile submit button', () => {
      renderSettingsPage()
      expect(screen.getByRole('button', { name: 'Guardar cambios' })).toBeInTheDocument()
    })
  })

  describe('Tab Navigation', () => {
    it('switches to Seguridad tab', async () => {
      renderSettingsPage()
      await switchTab('Seguridad')
      expect(screen.getByRole('tab', { name: 'Seguridad' })).toHaveAttribute('aria-selected', 'true')
      expect(screen.getByRole('tabpanel', { name: 'Seguridad' })).toBeInTheDocument()
    })

    it('switches to Preferencias tab', async () => {
      renderSettingsPage()
      await switchTab('Preferencias')
      expect(screen.getByRole('tab', { name: 'Preferencias' })).toHaveAttribute('aria-selected', 'true')
      expect(screen.getByRole('tabpanel', { name: 'Preferencias' })).toBeInTheDocument()
    })

    it('switches back to Perfil tab', async () => {
      renderSettingsPage()
      await switchTab('Seguridad')
      await switchTab('Perfil')
      expect(screen.getByRole('tab', { name: 'Perfil' })).toHaveAttribute('aria-selected', 'true')
    })

    it('shows password form in Seguridad tab', async () => {
      renderSettingsPage()
      await switchTab('Seguridad')
      expect(screen.getByLabelText(/Contraseña actual/)).toBeInTheDocument()
      expect(screen.getByLabelText(/Nueva contraseña/)).toBeInTheDocument()
      expect(screen.getByLabelText(/Confirmar nueva contraseña/)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Cambiar contraseña' })).toBeInTheDocument()
    })

    it('shows preferences content in Preferencias tab', async () => {
      renderSettingsPage()
      await switchTab('Preferencias')
      expect(screen.getByText('Preferencias de notificaciones')).toBeInTheDocument()
      expect(screen.getByText('Apariencia')).toBeInTheDocument()
      expect(screen.getByText('Notificaciones por email')).toBeInTheDocument()
      expect(screen.getByText('Recordatorios de pagos')).toBeInTheDocument()
      expect(screen.getByText('Renovaciones de membresía')).toBeInTheDocument()
      expect(screen.getByText('Promociones y ofertas')).toBeInTheDocument()
      expect(screen.getByText('Tema:')).toBeInTheDocument()
      expect(screen.getByRole('combobox').closest('select')).toBeInTheDocument()
    })
  })

  describe('Profile Form Interactions', () => {
    it('allows editing profile fields', async () => {
      renderSettingsPage()
      const nameInput = screen.getByLabelText(/Nombre/)
      fireEvent.change(nameInput, { target: { value: 'Nuevo Nombre' } })
      expect(nameInput).toHaveValue('Nuevo Nombre')
    })

    it('allows editing last name', async () => {
      renderSettingsPage()
      const lastNameInput = screen.getByLabelText(/Apellido/)
      fireEvent.change(lastNameInput, { target: { value: 'Nuevo Apellido' } })
      expect(lastNameInput).toHaveValue('Nuevo Apellido')
    })

    it('allows selecting gender', async () => {
      renderSettingsPage()
      const genderSelect = screen.getByLabelText('Género')
      fireEvent.change(genderSelect, { target: { value: 'masculino' } })
      expect(genderSelect).toHaveValue('masculino')
    })

    it('calls updateUser mutation on profile submit', async () => {
      const mockUpdate = createMockMutation({ mutateAsync: vi.fn().mockResolvedValue(undefined) })
      renderSettingsPage({ updateMutation: mockUpdate })

      fireEvent.change(screen.getByLabelText(/Nombre/), { target: { value: 'Actualizado' } })
      fireEvent.change(screen.getByLabelText(/Apellido/), { target: { value: 'Usuario' } })

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))
      })

      await waitFor(() => {
        expect(mockUpdate.mutateAsync).toHaveBeenCalledWith(expect.objectContaining({
          firstName: 'Actualizado',
          lastName: 'Usuario',
        }))
      })
    })

    it('shows success message after profile update', async () => {
      const mockUpdate = createMockMutation({ mutateAsync: vi.fn().mockResolvedValue(undefined) })
      renderSettingsPage({ updateMutation: mockUpdate })

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))
      })

      await waitFor(() => {
        expect(screen.getByText('Perfil actualizado correctamente')).toBeInTheDocument()
      })
    })
  })

  describe('Password Form Interactions', () => {
    it('shows validation error when passwords do not match', async () => {
      renderSettingsPage()
      await switchTab('Seguridad')

      fireEvent.change(screen.getByLabelText(/Contraseña actual/), { target: { value: 'current123' } })
      fireEvent.change(screen.getByLabelText(/Nueva contraseña/), { target: { value: 'newpass123' } })
      fireEvent.change(screen.getByLabelText(/Confirmar nueva contraseña/), { target: { value: 'different456' } })

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Cambiar contraseña' }))
      })

      await waitFor(() => {
        expect(screen.getByText('Las contraseñas no coinciden')).toBeInTheDocument()
      })
    })

    it('shows validation error when new password too short', async () => {
      renderSettingsPage()
      await switchTab('Seguridad')

      fireEvent.change(screen.getByLabelText(/Contraseña actual/), { target: { value: 'current123' } })
      fireEvent.change(screen.getByLabelText(/Nueva contraseña/), { target: { value: 'short' } })
      fireEvent.change(screen.getByLabelText(/Confirmar nueva contraseña/), { target: { value: 'short' } })

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Cambiar contraseña' }))
      })

      await waitFor(() => {
        expect(screen.getByText('La contraseña debe tener al menos 8 caracteres')).toBeInTheDocument()
      })
    })

    it('calls changePassword mutation on valid submit', async () => {
      const mockPassword = createMockMutation({ mutateAsync: vi.fn().mockResolvedValue(undefined) })
      renderSettingsPage({ passwordMutation: mockPassword })
      await switchTab('Seguridad')

      fireEvent.change(screen.getByLabelText(/Contraseña actual/), { target: { value: 'current123' } })
      fireEvent.change(screen.getByLabelText(/Nueva contraseña/), { target: { value: 'newpassword123' } })
      fireEvent.change(screen.getByLabelText(/Confirmar nueva contraseña/), { target: { value: 'newpassword123' } })

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Cambiar contraseña' }))
      })

      await waitFor(() => {
        expect(mockPassword.mutateAsync).toHaveBeenCalledWith(expect.objectContaining({
          currentPassword: 'current123',
          newPassword: 'newpassword123',
        }))
      })
    })

    it('shows success message after password change', async () => {
      const mockPassword = createMockMutation({ mutateAsync: vi.fn().mockResolvedValue(undefined) })
      renderSettingsPage({ passwordMutation: mockPassword })
      await switchTab('Seguridad')

      fireEvent.change(screen.getByLabelText(/Contraseña actual/), { target: { value: 'current123' } })
      fireEvent.change(screen.getByLabelText(/Nueva contraseña/), { target: { value: 'newpassword123' } })
      fireEvent.change(screen.getByLabelText(/Confirmar nueva contraseña/), { target: { value: 'newpassword123' } })

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Cambiar contraseña' }))
      })

      await waitFor(() => {
        expect(screen.getByText('Contraseña cambiada correctamente')).toBeInTheDocument()
      })
      expect(screen.getByLabelText(/Contraseña actual/)).toHaveValue('')
      expect(screen.getByLabelText(/Nueva contraseña/)).toHaveValue('')
      expect(screen.getByLabelText(/Confirmar nueva contraseña/)).toHaveValue('')
    })
  })

  describe('Preferences Tab', () => {
    it('renders notification checkboxes', async () => {
      renderSettingsPage()
      await switchTab('Preferencias')

      const checkboxes = screen.getAllByRole('checkbox')
      expect(checkboxes.length).toBe(4)
      expect(screen.getByText('Notificaciones por email')).toBeInTheDocument()
      expect(screen.getByText('Recordatorios de pagos')).toBeInTheDocument()
      expect(screen.getByText('Renovaciones de membresía')).toBeInTheDocument()
      expect(screen.getByText('Promociones y ofertas')).toBeInTheDocument()
    })

    it('renders theme selector', async () => {
      renderSettingsPage()
      await switchTab('Preferencias')

      const themeSelect = screen.getByRole('combobox').closest('select')
      expect(themeSelect).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'Oscuro' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'Claro' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'Sistema' })).toBeInTheDocument()
    })

    it('allows changing theme selection', async () => {
      renderSettingsPage()
      await switchTab('Preferencias')

      const themeSelect = screen.getByRole('combobox').closest('select')
      fireEvent.change(themeSelect, { target: { value: 'light' } })
      expect(themeSelect).toHaveValue('light')
    })
  })

  describe('Success/Error Messages', () => {
    it('shows dismissible success message', async () => {
      const mockUpdate = createMockMutation({ mutateAsync: vi.fn().mockResolvedValue(undefined) })
      renderSettingsPage({ updateMutation: mockUpdate })

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))
      })

      await waitFor(() => {
        // Success messages use role="status" in Alert component
        expect(screen.getByRole('status')).toBeInTheDocument()
        expect(screen.getByText('Perfil actualizado correctamente')).toBeInTheDocument()
      })

      const dismissButton = screen.getByRole('button', { name: 'Descartar' })
      expect(dismissButton).toBeInTheDocument()

      act(() => {
        fireEvent.click(dismissButton)
      })
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })

    it('shows error message on profile update failure', async () => {
      const mockUpdate = createMockMutation({ mutateAsync: vi.fn().mockRejectedValue(new Error('Error al actualizar perfil')) })
      renderSettingsPage({ updateMutation: mockUpdate })

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))
      })

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
        expect(screen.getByText('Error al actualizar perfil')).toBeInTheDocument()
      })
    })

    it('shows error message on password change failure', async () => {
      const mockPassword = createMockMutation({ mutateAsync: vi.fn().mockRejectedValue(new Error('Error al cambiar contraseña')) })
      renderSettingsPage({ passwordMutation: mockPassword })
      await switchTab('Seguridad')

      fireEvent.change(screen.getByLabelText(/Contraseña actual/), { target: { value: 'current123' } })
      fireEvent.change(screen.getByLabelText(/Nueva contraseña/), { target: { value: 'newpassword123' } })
      fireEvent.change(screen.getByLabelText(/Confirmar nueva contraseña/), { target: { value: 'newpassword123' } })

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Cambiar contraseña' }))
      })

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
        expect(screen.getByText('Error al cambiar contraseña')).toBeInTheDocument()
      })
    })
  })
})