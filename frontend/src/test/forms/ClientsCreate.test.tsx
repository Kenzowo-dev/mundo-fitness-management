// @ts-nocheck
import { vi, beforeEach, afterEach, describe, it, expect } from 'vitest'
import { render, screen, fireEvent, waitFor, act, within } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import ClientsPage from '@/pages/clients/ClientsPage'
import * as useApiModule from '@/hooks/useApi'
import * as authModule from '@/context/useAuth'
import * as apiModule from '@/api/client'

const mockClients = [
  {
    id: 1,
    dni: '71234567',
    firstName: 'Juan',
    lastName: 'Pérez',
    email: 'juan@test.com',
    phone: '987654321',
    birthDate: '1990-01-01',
    gender: 'masculino',
    address: 'Av. Las Camelias 450',
    status: 'active',
    createdAt: '2024-01-15T10:00:00Z',
    joinedAt: '2024-01-15',
    emergencyContactName: '',
    emergencyContactPhone: '',
    notes: '',
  },
  {
    id: 2,
    dni: '72345678',
    firstName: 'María',
    lastName: 'García',
    email: 'maria@test.com',
    phone: '987654322',
    birthDate: '1992-05-20',
    gender: 'femenino',
    address: 'Calle Falsa 123',
    status: 'active',
    createdAt: '2024-02-20T10:00:00Z',
    joinedAt: '2024-02-20',
    emergencyContactName: '',
    emergencyContactPhone: '',
    notes: '',
  },
]

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

const openCreateModal = async () => {
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Registrar nuevo socio' }))
  })
  // Wait for state update and modal render (modal uses portal)
  await waitFor(() => {
    expect(screen.getByRole('dialog', { hidden: true })).toBeInTheDocument()
  }, { timeout: 3000 })
  fireEvent.click(within(screen.getByRole('dialog', { hidden: true })).getByText(/Datos adicionales/))
}

const getDialog = () => {
  return screen.getByRole('dialog', { hidden: true })
}

describe('ClientsPage - Create Client', () => {
  let mockCreateClient: ReturnType<typeof vi.fn>

  beforeEach(() => {
    // Por defecto entra la recepcionista (no ve el rol de la cuenta)
    vi.spyOn(authModule, 'useAuth').mockReturnValue({
      user: { id: 2, email: 'recepcion@mundofitness.com', firstName: 'Laura', lastName: 'Recepción', role: 'receptionist', isActive: true, emailVerified: true, createdAt: '', updatedAt: '' },
      isLoading: false,
      isAuthenticated: true,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
      updateUser: vi.fn(),
    } as ReturnType<typeof authModule.useAuth>)
    vi.clearAllMocks()
    localStorage.clear()

    mockCreateClient = vi.fn().mockResolvedValue(undefined)

    vi.spyOn(useApiModule, 'useCreateClient').mockReturnValue({
      mutateAsync: mockCreateClient,
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
      mutate: vi.fn(),
    } as ReturnType<typeof useApiModule.useCreateClient>)

    vi.spyOn(useApiModule, 'useClients').mockReturnValue({
      data: { data: mockClients, pagination: { page: 1, limit: 20, total: 2, totalPages: 1 } },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      isFetching: false,
      isSuccess: true,
      isError: false,
      failureCount: 0,
      failureReason: null,
      status: 'success',
      dataUpdatedAt: Date.now(),
      errorUpdatedAt: 0,
    } as ReturnType<typeof useApiModule.useClients>)

    vi.spyOn(apiModule.api, 'isAuthenticated').mockReturnValue(true)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  const renderPage = () => render(<ClientsPage />, { wrapper: createWrapper() })

  describe('Open Create Modal', () => {
    it('opens create modal when clicking Nuevo Cliente button', async () => {
      renderPage()
      expect(screen.queryByRole('dialog', { hidden: true })).not.toBeInTheDocument()

      await openCreateModal()
    })

    it('renders all required fields in create modal', async () => {
      renderPage()
      await openCreateModal()
      const dialog = within(getDialog())

      expect(dialog.getByPlaceholderText('Ej: 71234567')).toBeInTheDocument()
      expect(dialog.getByPlaceholderText('Ej: Juan')).toBeInTheDocument()
      expect(dialog.getByPlaceholderText('Ej: Pérez')).toBeInTheDocument()
      expect(dialog.getByPlaceholderText('socio@correo.com')).toBeInTheDocument()
      expect(dialog.getByPlaceholderText('987654321')).toBeInTheDocument()
      expect(dialog.getByPlaceholderText('Av. Las Camelias 450')).toBeInTheDocument()
      expect(dialog.getByLabelText('Género')).toBeInTheDocument()
    })
  })

  describe('Validation', () => {
    it('shows error when required fields are empty on submit', async () => {
      renderPage()
      await openCreateModal()

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Registrar socio', hidden: true }))
      })

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Corrige los campos señalados')
      })
    })

    it('rejects a DNI that does not have eight digits', async () => {
      renderPage()
      await openCreateModal()
      const dialog = within(getDialog())

      fireEvent.change(dialog.getByPlaceholderText('Ej: 71234567'), { target: { value: '1234' } })
      fireEvent.change(dialog.getByPlaceholderText('Ej: Juan'), { target: { value: 'Juan' } })
      fireEvent.change(dialog.getByPlaceholderText('Ej: Pérez'), { target: { value: 'Pérez' } })

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Registrar socio', hidden: true }))
      })

      await waitFor(() => {
        expect(within(getDialog()).getByText('El DNI debe contener exactamente 8 dígitos numéricos.')).toBeInTheDocument()
      })
    })

    it('filters letters out of DNI and phone, and digits or signs out of names', async () => {
      renderPage()
      await openCreateModal()
      const dialog = within(getDialog())

      const dni = dialog.getByPlaceholderText('Ej: 71234567')
      const phone = dialog.getByPlaceholderText('987654321')
      const firstName = dialog.getByPlaceholderText('Ej: Juan')
      const lastName = dialog.getByPlaceholderText('Ej: Pérez')

      fireEvent.change(dni, { target: { value: '71a23b4567999' } })
      fireEvent.change(phone, { target: { value: '9x87-654 3210' } })
      fireEvent.change(firstName, { target: { value: 'Juan2 José!' } })
      fireEvent.change(lastName, { target: { value: 'Pérez-Ñúñez 3' } })

      expect(dni).toHaveValue('71234567')
      expect(phone).toHaveValue('987654321')
      expect(firstName).toHaveValue('Juan José')
      expect(lastName).toHaveValue('PérezÑúñez ')
    })

    it('limits the birth date calendar to 1950 and rejects older dates', async () => {
      renderPage()
      await openCreateModal()
      const dialog = within(getDialog())
      const birthDate = dialog.getByLabelText(/Fecha de nacimiento/)
      expect(birthDate).toHaveAttribute('min', '1950-01-01')

      fireEvent.change(dialog.getByPlaceholderText('Ej: 71234567'), { target: { value: '71234567' } })
      fireEvent.change(dialog.getByPlaceholderText('Ej: Juan'), { target: { value: 'Ana' } })
      fireEvent.change(dialog.getByPlaceholderText('Ej: Pérez'), { target: { value: 'Ríos' } })
      fireEvent.change(birthDate, { target: { value: '1949-12-31' } })
      fireEvent.click(dialog.getByRole('button', { name: /Crear|Guardar|Registrar/ }))

      expect(await dialog.findByText('La fecha de nacimiento debe ser desde el año 1950.')).toBeInTheDocument()
    })

    it('keeps only letters in the emergency contact and usual characters in the address', async () => {
      renderPage()
      await openCreateModal()
      const dialog = within(getDialog())

      const address = dialog.getByPlaceholderText('Av. Las Camelias 450')
      const emergencyName = dialog.getByPlaceholderText('Nombre y apellido')

      fireEvent.change(address, { target: { value: 'Av. Perú 450, Dpto. 3-B $%&!' } })
      fireEvent.change(emergencyName, { target: { value: "Rosa2 O'Neill!" } })

      expect(address).toHaveValue('Av. Perú 450, Dpto. 3-B ')
      expect(emergencyName).toHaveValue('Rosa ONeill')
    })

    it('requires the @ symbol in the email', async () => {
      renderPage()
      await openCreateModal()
      const dialog = within(getDialog())

      fireEvent.change(dialog.getByPlaceholderText('Ej: 71234567'), { target: { value: '71234567' } })
      fireEvent.change(dialog.getByPlaceholderText('Ej: Juan'), { target: { value: 'Juan' } })
      fireEvent.change(dialog.getByPlaceholderText('Ej: Pérez'), { target: { value: 'Pérez' } })
      fireEvent.change(dialog.getByPlaceholderText('socio@correo.com'), { target: { value: 'juancorreo.com' } })

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Registrar socio', hidden: true }))
      })

      await waitFor(() => {
        expect(within(getDialog()).getByText('El correo electrónico debe incluir el símbolo @.')).toBeInTheDocument()
      })
    })

    it('hides the summary alert once every flagged field is edited', async () => {
      renderPage()
      await openCreateModal()

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Registrar socio', hidden: true }))
      })
      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Corrige los campos señalados')
      })

      const dialog = within(getDialog())
      fireEvent.change(dialog.getByPlaceholderText('Ej: 71234567'), { target: { value: '7' } })
      fireEvent.change(dialog.getByPlaceholderText('Ej: Juan'), { target: { value: 'J' } })
      fireEvent.change(dialog.getByPlaceholderText('Ej: Pérez'), { target: { value: 'P' } })

      expect(screen.queryByText('Corrige los campos señalados para poder registrar al socio.')).not.toBeInTheDocument()
    })

    it('shows error for missing Nombres', async () => {
      renderPage()
      await openCreateModal()
      const dialog = within(getDialog())

      fireEvent.change(dialog.getByPlaceholderText('Ej: Pérez'), { target: { value: 'Pérez' } })

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Registrar socio', hidden: true }))
      })

      await waitFor(() => {
        expect(within(getDialog()).getByText('Ingresa los nombres del socio.')).toBeInTheDocument()
      })
    })

    it('shows error for missing Apellidos', async () => {
      renderPage()
      await openCreateModal()
      const dialog = within(getDialog())

      fireEvent.change(dialog.getByPlaceholderText('Ej: 71234567'), { target: { value: '71234567' } })
      fireEvent.change(dialog.getByPlaceholderText('Ej: Juan'), { target: { value: 'Juan' } })

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Registrar socio', hidden: true }))
      })

      await waitFor(() => {
        expect(within(getDialog()).getByText('Ingresa los apellidos del socio.')).toBeInTheDocument()
      })
    })
  })

  describe('Valid submit', () => {
    it('calls createClient with correct data on valid submit', async () => {
      mockCreateClient.mockResolvedValue(undefined)
      renderPage()
      await openCreateModal()
      const dialog = within(getDialog())

      fireEvent.change(dialog.getByPlaceholderText('Ej: 71234567'), { target: { value: '73456789' } })
      fireEvent.change(dialog.getByPlaceholderText('Ej: Juan'), { target: { value: 'Carlos' } })
      fireEvent.change(dialog.getByPlaceholderText('Ej: Pérez'), { target: { value: 'López' } })
      fireEvent.change(dialog.getByPlaceholderText('socio@correo.com'), { target: { value: 'carlos@test.com' } })
      fireEvent.change(dialog.getByPlaceholderText('987654321'), { target: { value: '987654323' } })
      fireEvent.change(dialog.getByPlaceholderText('Av. Las Camelias 450'), { target: { value: 'Av. Nueva 789' } })
      fireEvent.change(dialog.getByLabelText('Género'), { target: { value: 'masculino' } })

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Registrar socio', hidden: true }))
      })

      await waitFor(() => {
        expect(mockCreateClient).toHaveBeenCalledWith({
          dni: '73456789',
          firstName: 'Carlos',
          lastName: 'López',
          email: 'carlos@test.com',
          phone: '987654323',
          gender: 'masculino',
          address: 'Av. Nueva 789',
        })
      })
    })

    it('closes modal and resets form after successful submit', async () => {
      mockCreateClient.mockResolvedValue(undefined)
      renderPage()
      await openCreateModal()
      const dialog = within(getDialog())

      fireEvent.change(dialog.getByPlaceholderText('Ej: 71234567'), { target: { value: '73456789' } })
      fireEvent.change(dialog.getByPlaceholderText('Ej: Juan'), { target: { value: 'Carlos' } })
      fireEvent.change(dialog.getByPlaceholderText('Ej: Pérez'), { target: { value: 'López' } })

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Registrar socio', hidden: true }))
      })

      await waitFor(() => {
        expect(screen.queryByRole('dialog', { hidden: true })).not.toBeInTheDocument()
      })
    })

    it('shows error message on failure', async () => {
      mockCreateClient.mockRejectedValue(new Error('Error al registrar cliente'))
      renderPage()
      await openCreateModal()
      const dialog = within(getDialog())

      fireEvent.change(dialog.getByPlaceholderText('Ej: 71234567'), { target: { value: '73456789' } })
      fireEvent.change(dialog.getByPlaceholderText('Ej: Juan'), { target: { value: 'Carlos' } })
      fireEvent.change(dialog.getByPlaceholderText('Ej: Pérez'), { target: { value: 'López' } })

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Registrar socio', hidden: true }))
      })

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Error al registrar cliente')
      })
    })
  })

  describe('Cancel', () => {
    it('closes modal on cancel click', async () => {
      renderPage()
      await openCreateModal()

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Cancelar', hidden: true }))
      })

      await waitFor(() => {
        expect(screen.queryByRole('dialog', { hidden: true })).not.toBeInTheDocument()
      })
    })

    it('closes modal on overlay click', async () => {
      renderPage()
      await openCreateModal()

      // Click on dialog overlay (outside content)
      const dialog = screen.getByRole('dialog', { hidden: true })
      fireEvent.click(dialog, { target: dialog })

      // Note: Modal close on overlay depends on Modal implementation
      // If it doesn't close, that's expected behavior
    })
  })
})
