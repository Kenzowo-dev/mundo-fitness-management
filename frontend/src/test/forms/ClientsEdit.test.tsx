// @ts-nocheck
import { vi, beforeEach, afterEach, describe, it, expect } from 'vitest'
import { render, screen, fireEvent, waitFor, act, within } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import ClientsPage from '@/pages/clients/ClientsPage'
import * as useApiModule from '@/hooks/useApi'
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

const openEditModal = async (clientId: number) => {
  // Find the edit button for the specific client
  const editButton = screen.getByRole('button', { name: new RegExp(`Editar ${clientId === 1 ? 'Juan' : 'María'}`) })
  await act(async () => {
    fireEvent.click(editButton)
  })
  // Wait for modal to open
  await waitFor(() => {
    expect(screen.getByRole('dialog', { hidden: true })).toBeInTheDocument()
  }, { timeout: 3000 })
  fireEvent.click(within(screen.getByRole('dialog', { hidden: true })).getByText(/Datos adicionales/))
}

const getDialog = () => {
  return screen.getByRole('dialog', { hidden: true })
}

describe('ClientsPage - Edit Client', () => {
  let mockUpdateClient: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()

    mockUpdateClient = vi.fn().mockResolvedValue(undefined)

    vi.spyOn(useApiModule, 'useUpdateClient').mockReturnValue({
      mutateAsync: mockUpdateClient,
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
    } as ReturnType<typeof useApiModule.useUpdateClient>)

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

  describe('Open Edit Modal', () => {
    it('opens edit modal when clicking Editar button for first client', async () => {
      renderPage()
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

      await openEditModal(1)

      expect(screen.getByRole('dialog', { hidden: true })).toBeInTheDocument()
    })

    it('opens edit modal when clicking Editar button for second client', async () => {
      renderPage()

      await openEditModal(2)

      expect(screen.getByRole('dialog', { hidden: true })).toBeInTheDocument()
    })

    it('renders pre-filled form with current client data', async () => {
      renderPage()
      await openEditModal(1)
      const dialog = within(getDialog())

      expect(dialog.getByPlaceholderText('Ej: 71234567')).toHaveValue('71234567')
      expect(dialog.getByPlaceholderText('Ej: Juan')).toHaveValue('Juan')
      expect(dialog.getByPlaceholderText('Ej: Pérez')).toHaveValue('Pérez')
      expect(dialog.getByPlaceholderText('socio@correo.com')).toHaveValue('juan@test.com')
      expect(dialog.getByPlaceholderText('+51987654321')).toHaveValue('987654321')
      expect(dialog.getByPlaceholderText('Av. Las Camelias 450')).toHaveValue('Av. Las Camelias 450')
      expect(dialog.getByLabelText('Género')).toHaveValue('masculino')
    })
  })

  describe('Validation', () => {
    it('shows error when required fields are empty on submit', async () => {
      renderPage()
      await openEditModal(1)
      const dialog = within(getDialog())

      // Clear required fields
      fireEvent.change(dialog.getByPlaceholderText('Ej: 71234567'), { target: { value: '' } })
      fireEvent.change(dialog.getByPlaceholderText('Ej: Juan'), { target: { value: '' } })
      fireEvent.change(dialog.getByPlaceholderText('Ej: Pérez'), { target: { value: '' } })

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios', hidden: true }))
      })

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Corrige los campos señalados antes de guardar.')
      })
    })

    it('shows error for missing DNI', async () => {
      renderPage()
      await openEditModal(1)
      const dialog = within(getDialog())

      fireEvent.change(dialog.getByPlaceholderText('Ej: 71234567'), { target: { value: '' } })
      fireEvent.change(dialog.getByPlaceholderText('Ej: Juan'), { target: { value: 'Juan' } })
      fireEvent.change(dialog.getByPlaceholderText('Ej: Pérez'), { target: { value: 'Pérez' } })

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios', hidden: true }))
      })

      await waitFor(() => {
        expect(within(getDialog()).getByText('Ingresa un DNI de 8 dígitos.')).toBeInTheDocument()
      })
    })

    it('shows error for missing Nombres', async () => {
      renderPage()
      await openEditModal(1)
      const dialog = within(getDialog())

      fireEvent.change(dialog.getByPlaceholderText('Ej: 71234567'), { target: { value: '71234567' } })
      fireEvent.change(dialog.getByPlaceholderText('Ej: Juan'), { target: { value: '' } })
      fireEvent.change(dialog.getByPlaceholderText('Ej: Pérez'), { target: { value: 'Pérez' } })

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios', hidden: true }))
      })

      await waitFor(() => {
        expect(within(getDialog()).getByText('Ingresa los nombres del socio.')).toBeInTheDocument()
      })
    })

    it('shows error for missing Apellidos', async () => {
      renderPage()
      await openEditModal(1)
      const dialog = within(getDialog())

      fireEvent.change(dialog.getByPlaceholderText('Ej: 71234567'), { target: { value: '71234567' } })
      fireEvent.change(dialog.getByPlaceholderText('Ej: Juan'), { target: { value: 'Juan' } })
      fireEvent.change(dialog.getByPlaceholderText('Ej: Pérez'), { target: { value: '' } })

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios', hidden: true }))
      })

      await waitFor(() => {
        expect(within(getDialog()).getByText('Ingresa los apellidos del socio.')).toBeInTheDocument()
      })
    })
  })

  describe('Valid submit', () => {
    it('calls updateClient with correct client ID and updated data', async () => {
      mockUpdateClient.mockResolvedValue(undefined)
      renderPage()
      await openEditModal(1)
      const dialog = within(getDialog())

      // Modify some fields
      fireEvent.change(dialog.getByPlaceholderText('Ej: Juan'), { target: { value: 'Carlos' } })
      fireEvent.change(dialog.getByPlaceholderText('socio@correo.com'), { target: { value: 'carlos@test.com' } })

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios', hidden: true }))
      })

      await waitFor(() => {
        expect(mockUpdateClient).toHaveBeenCalledWith({
          id: 1,
          data: {
            dni: '71234567',
            firstName: 'Carlos',
            lastName: 'Pérez',
            email: 'carlos@test.com',
            phone: '987654321',
            birthDate: '1990-01-01',
            gender: 'masculino',
            address: 'Av. Las Camelias 450',
            status: 'active',
          },
        })
      })
    })

    it('updates the correct client (verifies ID is passed correctly)', async () => {
      mockUpdateClient.mockResolvedValue(undefined)
      renderPage()
      await openEditModal(2) // Edit second client (María)
      const dialog = within(getDialog())

      fireEvent.change(dialog.getByPlaceholderText('Ej: Juan'), { target: { value: 'Ana' } })

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios', hidden: true }))
      })

      await waitFor(() => {
        expect(mockUpdateClient).toHaveBeenCalledWith(
          expect.objectContaining({ id: 2 })
        )
      })
    })

    it('closes modal after successful submit', async () => {
      mockUpdateClient.mockResolvedValue(undefined)
      renderPage()
      await openEditModal(1)

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios', hidden: true }))
      })

      await waitFor(() => {
        expect(screen.queryByRole('dialog', { hidden: true })).not.toBeInTheDocument()
      })
    })

    it('shows error message on failure', async () => {
      mockUpdateClient.mockRejectedValue(new Error('Error al actualizar cliente'))
      renderPage()
      await openEditModal(1)

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios', hidden: true }))
      })

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Error al actualizar cliente')
      })
    })
  })

  describe('Cancel', () => {
    it('closes modal on cancel click', async () => {
      renderPage()
      await openEditModal(1)

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Cancelar', hidden: true }))
      })

      await waitFor(() => {
        expect(screen.queryByRole('dialog', { hidden: true })).not.toBeInTheDocument()
      })
    })
  })
})
