// @ts-nocheck
import { vi, beforeEach, afterEach, describe, it, expect } from 'vitest'
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import MembershipsPage from '@/pages/memberships/MembershipsPage'
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

const mockClients = [
  { id: 1, dni: '71234567', firstName: 'Juan', lastName: 'Pérez', email: 'juan@test.com', phone: '987654321', birthDate: '1990-01-01', gender: 'masculino', address: 'Av. Las Camelias 450', status: 'active', createdAt: '2024-01-15T10:00:00Z', joinedAt: '2024-01-15', emergencyContactName: '', emergencyContactPhone: '', notes: '' },
  { id: 2, dni: '72345678', firstName: 'María', lastName: 'García', email: 'maria@test.com', phone: '987654322', birthDate: '1992-05-20', gender: 'femenino', address: 'Calle Falsa 123', status: 'active', createdAt: '2024-02-20T10:00:00Z', joinedAt: '2024-02-20', emergencyContactName: '', emergencyContactPhone: '', notes: '' },
]

const mockPlans = [
  { id: 1, name: 'Plan Básico', description: 'Plan básico', durationDays: 30, price: 50, currency: 'USD', features: [], maxVisitsPerWeek: 3, includesPersonalTrainer: false, includesClasses: true, includesSauna: false, isActive: true, sortOrder: 1, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 2, name: 'Plan Premium', description: 'Plan premium', durationDays: 90, price: 120, currency: 'USD', features: [], maxVisitsPerWeek: 5, includesPersonalTrainer: true, includesClasses: true, includesSauna: true, isActive: true, sortOrder: 2, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
]

const mockMemberships = [
  { id: 1, clientId: 1, planId: 1, plan: mockPlans[0], startDate: new Date(Date.now() - 86400000).toISOString().slice(0, 10), endDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10), status: 'active', autoRenew: true, createdAt: '2024-01-15T10:00:00Z', updatedAt: '2024-01-15T10:00:00Z' },
  { id: 2, clientId: 2, planId: 2, plan: mockPlans[1], startDate: new Date(Date.now() - 86400000).toISOString().slice(0, 10), endDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10), status: 'active', autoRenew: true, createdAt: '2024-02-20T10:00:00Z', updatedAt: '2024-02-20T10:00:00Z' },
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

const createMockQuery = (overrides: Record<string, unknown> = {}) => ({
  data: undefined,
  isLoading: true,
  isFetching: true,
  isSuccess: false,
  isError: false,
  error: null,
  refetch: vi.fn(),
  failureCount: 0,
  failureReason: null,
  status: 'loading',
  dataUpdatedAt: 0,
  errorUpdatedAt: 0,
  ...overrides,
})

const createMockErrorQuery = (errorMessage: string) => createMockQuery({
  isLoading: false,
  isFetching: false,
  isSuccess: false,
  isError: true,
  status: 'error',
  error: new Error(errorMessage),
})

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

describe('MembershipsPage - Integration Tests', () => {
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

  const renderMembershipsPage = (overrides?: {
    clients?: ReturnType<typeof createMockQuery>
    plans?: ReturnType<typeof createMockQuery>
    memberships?: ReturnType<typeof createMockQuery>
    createMutation?: ReturnType<typeof createMockMutation>
    checkInMutation?: ReturnType<typeof createMockMutation>
    renewalRequests?: ReturnType<typeof createMockQuery>
    updateRenewalMutation?: ReturnType<typeof createMockMutation>
  }) => {
    const clientsMock = overrides?.clients ?? createMockQuery({
      data: { data: mockClients, pagination: { page: 1, limit: 100, total: 2, totalPages: 1 } },
      isLoading: false,
      isFetching: false,
      isSuccess: true,
      status: 'success',
    })

    const plansMock = overrides?.plans ?? createMockQuery({
      data: mockPlans,
      isLoading: false,
      isFetching: false,
      isSuccess: true,
      status: 'success',
    })

    const membershipsMock = overrides?.memberships ?? createMockQuery({
      data: mockMemberships,
      isLoading: false,
      isFetching: false,
      isSuccess: true,
      status: 'success',
    })

    const createMock = overrides?.createMutation ?? createMockMutation()
    const checkInMock = overrides?.checkInMutation ?? createMockMutation()

    vi.spyOn(useApiModule, 'useClients').mockReturnValue(clientsMock as ReturnType<typeof useApiModule.useClients>)
    vi.spyOn(useApiModule, 'useMembershipPlans').mockReturnValue(plansMock as ReturnType<typeof useApiModule.useMembershipPlans>)
    vi.spyOn(useApiModule, 'useAllMemberships').mockReturnValue(membershipsMock as ReturnType<typeof useApiModule.useAllMemberships>)
    vi.spyOn(useApiModule, 'useCreateMembership').mockReturnValue(createMock as ReturnType<typeof useApiModule.useCreateMembership>)
    vi.spyOn(useApiModule, 'useCheckIn').mockReturnValue(checkInMock as ReturnType<typeof useApiModule.useCheckIn>)
    vi.spyOn(useApiModule, 'useMembershipRenewalRequests').mockReturnValue((overrides?.renewalRequests ?? createMockQuery({ data: [], isLoading: false, isFetching: false, isSuccess: true, status: 'success' })) as ReturnType<typeof useApiModule.useMembershipRenewalRequests>)
    vi.spyOn(useApiModule, 'useUpdateMembershipRenewalRequest').mockReturnValue((overrides?.updateRenewalMutation ?? createMockMutation()) as ReturnType<typeof useApiModule.useUpdateMembershipRenewalRequest>)
    vi.spyOn(useApiModule, 'useCreateMembershipPlan').mockReturnValue(createMockMutation() as ReturnType<typeof useApiModule.useCreateMembershipPlan>)
    vi.spyOn(useApiModule, 'useUpdateMembershipPlan').mockReturnValue(createMockMutation() as ReturnType<typeof useApiModule.useUpdateMembershipPlan>)

    return render(<MembershipsPage />, { wrapper: createWrapper() })
  }

  const openCheckInModal = async () => {
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Registrar Check-In de socio' }))
    })
    await waitFor(() => {
      expect(screen.getByRole('dialog', { hidden: true })).toBeInTheDocument()
    }, { timeout: 3000 })
  }

  const openAssignModal = async () => {
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Asignar Membresía a socio' }))
    })
    await waitFor(() => {
      expect(screen.getByRole('dialog', { hidden: true })).toBeInTheDocument()
    }, { timeout: 3000 })
  }

  const switchToMembershipsTab = async () => {
    await act(async () => {
      fireEvent.click(screen.getByRole('tab', { name: 'Suscripciones de clientes' }))
    })
    await waitFor(() => {
      expect(screen.getByRole('tab', { name: 'Suscripciones de clientes' })).toBeInTheDocument()
    }, { timeout: 3000 })
  }

  describe('Render inicial / Listado', () => {
    it('renders page title', () => {
      renderMembershipsPage()
      expect(screen.getByText('Gestión de Membresías y Control de Acceso')).toBeInTheDocument()
    })

    it('shows the web renewal inbox and lets reception mark a request as contacted', async () => {
      const updateMutation = createMockMutation()
      renderMembershipsPage({
        renewalRequests: createMockQuery({
          data: [{ id: 8, clientId: 1, clientName: 'Juan Pérez', clientEmail: 'juan@test.com', planId: 1, planName: 'Plan Básico', status: 'pending', requestedAt: '2026-09-29T12:00:00Z' }],
          isLoading: false, isFetching: false, isSuccess: true, status: 'success',
        }),
        updateRenewalMutation: updateMutation,
      })
      fireEvent.click(screen.getByRole('tab', { name: /Solicitudes web/ }))
      expect(await screen.findByText('Juan Pérez')).toBeInTheDocument()
      expect(screen.getByText(/no crea membresías ni registra pagos/i)).toBeInTheDocument()
      fireEvent.click(screen.getByRole('button', { name: 'Marcar contactada' }))
      expect(updateMutation.mutate).toHaveBeenCalledWith({ id: 8, data: { status: 'contacted' } })
    })

    it('renders tabs for plans and memberships', () => {
      renderMembershipsPage()
      expect(screen.getByRole('tab', { name: 'Planes de membresía' })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: 'Suscripciones de clientes' })).toBeInTheDocument()
    })

    it('renders action buttons in header', () => {
      renderMembershipsPage()
      expect(screen.getByRole('button', { name: 'Registrar Check-In de socio' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Asignar Membresía a socio' })).toBeInTheDocument()
    })

    it('shows plans tab with columns', () => {
      renderMembershipsPage()
      expect(screen.getByText('Nombre')).toBeInTheDocument()
      expect(screen.getByText('Duración')).toBeInTheDocument()
      expect(screen.getByText('Precio')).toBeInTheDocument()
      expect(screen.getByText('Visitas/semana')).toBeInTheDocument()
      expect(screen.getByText('Clases')).toBeInTheDocument()
      expect(screen.getByText('Sauna')).toBeInTheDocument()
      expect(screen.getByText('Estado')).toBeInTheDocument()
    })

    it('lets administrators open the plan creation form', async () => {
      renderMembershipsPage()
      fireEvent.click(screen.getByRole('button', { name: 'Crear plan de membresía' }))
      expect(await screen.findByRole('dialog', { hidden: true })).toBeInTheDocument()
      expect(screen.getByLabelText(/Nombre del plan/)).toBeInTheDocument()
    })

    it('shows memberships tab when switched', async () => {
      renderMembershipsPage()
      await switchToMembershipsTab()
      expect(screen.getByText('Cliente / Socio')).toBeInTheDocument()
      expect(screen.getByText('Plan Adquirido')).toBeInTheDocument()
      expect(screen.getByText('Fecha Inicio')).toBeInTheDocument()
      expect(screen.getByText('Fecha Fin')).toBeInTheDocument()
      expect(screen.getByText('Estado')).toBeInTheDocument()
      expect(screen.getByText('Auto-renovar')).toBeInTheDocument()
    })
  })

  describe('Loading State', () => {
    it('shows loading state for plans tab', () => {
      renderMembershipsPage({
        clients: createMockQuery({ data: { data: mockClients, pagination: { page: 1, limit: 100, total: 2, totalPages: 1 } } }),
        plans: createMockQuery(),
        memberships: createMockQuery(),
      })
      const loadingRows = screen.getAllByLabelText('Cargando fila')
      expect(loadingRows.length).toBeGreaterThan(0)
    })

    it('shows plans when the client list is still loading', () => {
      renderMembershipsPage({
        clients: createMockQuery(),
        plans: createMockQuery({
          data: mockPlans,
          isLoading: false,
          isFetching: false,
          isSuccess: true,
          status: 'success',
        }),
        memberships: createMockQuery({ data: [], isLoading: false, isFetching: false, isSuccess: true, status: 'success' }),
      })

      expect(screen.getByText(mockPlans[0].name)).toBeInTheDocument()
      expect(screen.queryByLabelText('Cargando fila')).not.toBeInTheDocument()
    })

    it('shows loading state for memberships tab', async () => {
      renderMembershipsPage({
        clients: createMockQuery({ data: { data: mockClients, pagination: { page: 1, limit: 100, total: 2, totalPages: 1 } } }),
        plans: createMockQuery({ data: mockPlans }),
        memberships: createMockQuery(),
      })
      await switchToMembershipsTab()
      const loadingRows = screen.getAllByLabelText('Cargando fila')
      expect(loadingRows.length).toBeGreaterThan(0)
    })
  })

  describe('Error State', () => {
    it('shows error alert when clients query fails', () => {
      renderMembershipsPage({
        clients: createMockErrorQuery('Failed to fetch clients'),
      })
      expect(screen.getByRole('alert')).toBeInTheDocument()
      expect(screen.getByText('Error cargando datos')).toBeInTheDocument()
    })

    it('shows error alert when plans query fails', () => {
      renderMembershipsPage({
        plans: createMockErrorQuery('Failed to fetch plans'),
      })
      expect(screen.getByRole('alert')).toBeInTheDocument()
      expect(screen.getByText('Error cargando datos')).toBeInTheDocument()
    })

    it('shows error alert when memberships query fails', () => {
      renderMembershipsPage({
        memberships: createMockErrorQuery('Failed to fetch memberships'),
      })
      expect(screen.getByRole('alert')).toBeInTheDocument()
      expect(screen.getByText('Error cargando datos')).toBeInTheDocument()
    })

    it('page does not crash on error', () => {
      renderMembershipsPage({
        clients: createMockErrorQuery('Network error'),
      })
      expect(screen.getByText('Gestión de Membresías y Control de Acceso')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Registrar Check-In de socio' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Asignar Membresía a socio' })).toBeInTheDocument()
    })
  })

  describe('Check-in Flow', () => {
    it('opens check-in modal', async () => {
      renderMembershipsPage()
      await openCheckInModal()
      expect(screen.getByText('Control de Acceso: Registrar Check-In')).toBeInTheDocument()
    })

    it('renders client select in check-in modal', async () => {
      renderMembershipsPage()
      await openCheckInModal()
      // FormField label includes required asterisk, use partial match
      expect(screen.getByLabelText(/Seleccione el Socio/)).toBeInTheDocument()
      // Verify select has options
      const select = screen.getByLabelText(/Seleccione el Socio/)
      expect(select).toBeInTheDocument()
      expect(select.querySelectorAll('option').length).toBeGreaterThan(0)
    })

    it('calls checkIn mutation on valid submit', async () => {
      const mockCheckIn = createMockMutation({ mutateAsync: vi.fn().mockResolvedValue(undefined) })
      renderMembershipsPage({ checkInMutation: mockCheckIn })
      await openCheckInModal()

      // Use screen.getByLabelText since label is associated with select in dialog
      fireEvent.change(screen.getByLabelText(/Seleccione el Socio/), { target: { value: '1' } })

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Registrar Ingreso', hidden: true }))
      })

      await waitFor(() => {
        expect(mockCheckIn.mutateAsync).toHaveBeenCalledWith(expect.objectContaining({
          clientId: 1,
          clientMembershipId: 1,
        }))
      })
    })

    it('shows success message after check-in', async () => {
      const mockCheckIn = createMockMutation({ mutateAsync: vi.fn().mockResolvedValue(undefined) })
      renderMembershipsPage({ checkInMutation: mockCheckIn })
      await openCheckInModal()

      fireEvent.change(screen.getByLabelText(/Seleccione el Socio/), { target: { value: '1' } })

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Registrar Ingreso', hidden: true }))
      })

      await waitFor(() => {
        expect(screen.getByText('¡Check-in registrado exitosamente! Acceso concedido al gimnasio.')).toBeInTheDocument()
      })
    })

    it('shows error on check-in failure', async () => {
      const mockCheckIn = createMockMutation({ mutateAsync: vi.fn().mockRejectedValue(new Error('Error al registrar el check-in')) })
      renderMembershipsPage({ checkInMutation: mockCheckIn })
      await openCheckInModal()

      fireEvent.change(screen.getByLabelText(/Seleccione el Socio/), { target: { value: '1' } })

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Registrar Ingreso', hidden: true }))
      })

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
        // Multiple error alerts might exist
        expect(screen.getAllByText('Error al registrar el check-in').length).toBeGreaterThan(0)
      })
    })

    it('closes modal on cancel', async () => {
      renderMembershipsPage()
      await openCheckInModal()

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Cancelar', hidden: true }))
      })

      await waitFor(() => {
        expect(screen.queryByRole('dialog', { hidden: true })).not.toBeInTheDocument()
      })
    })
  })

  describe('Assign Membership Flow', () => {
    it('opens assign membership modal', async () => {
      renderMembershipsPage()
      await openAssignModal()
      expect(screen.getByText('Asignar Membresía a Socio')).toBeInTheDocument()
    })

    it('renders client and plan selects in assign modal', async () => {
      renderMembershipsPage()
      await openAssignModal()

      expect(screen.getByLabelText(/Seleccione el Socio/)).toBeInTheDocument()
      expect(screen.getByLabelText(/Seleccione el Plan/)).toBeInTheDocument()
      // Verify selects have options
      const clientSelect = screen.getByLabelText(/Seleccione el Socio/)
      const planSelect = screen.getByLabelText(/Seleccione el Plan/)
      expect(clientSelect.querySelectorAll('option').length).toBeGreaterThan(0)
      expect(planSelect.querySelectorAll('option').length).toBeGreaterThan(0)
    })

    it('calls createMembership mutation with correct data', async () => {
      const mockCreate = createMockMutation({ mutateAsync: vi.fn().mockResolvedValue(undefined) })
      renderMembershipsPage({ createMutation: mockCreate })
      await openAssignModal()

      fireEvent.change(screen.getByLabelText(/Seleccione el Socio/), { target: { value: '1' } })
      fireEvent.change(screen.getByLabelText(/Seleccione el Plan/), { target: { value: '2' } })

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Activar Membresía', hidden: true }))
      })

      await waitFor(() => {
        expect(mockCreate.mutateAsync).toHaveBeenCalledWith(expect.objectContaining({
          clientId: 1,
          planId: 2,
          status: 'active',
          autoRenew: true,
        }))
      })
    })

    it('shows success message after assignment', async () => {
      const mockCreate = createMockMutation({ mutateAsync: vi.fn().mockResolvedValue(undefined) })
      renderMembershipsPage({ createMutation: mockCreate })
      await openAssignModal()

      fireEvent.change(screen.getByLabelText(/Seleccione el Socio/), { target: { value: '1' } })
      fireEvent.change(screen.getByLabelText(/Seleccione el Plan/), { target: { value: '2' } })

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Activar Membresía', hidden: true }))
      })

      await waitFor(() => {
        expect(screen.getByText('¡Membresía asignada exitosamente al cliente!')).toBeInTheDocument()
      })
    })

    it('shows error on assignment failure', async () => {
      const mockCreate = createMockMutation({ mutateAsync: vi.fn().mockRejectedValue(new Error('Error al asignar la membresía')) })
      renderMembershipsPage({ createMutation: mockCreate })
      await openAssignModal()

      fireEvent.change(screen.getByLabelText(/Seleccione el Socio/), { target: { value: '1' } })
      fireEvent.change(screen.getByLabelText(/Seleccione el Plan/), { target: { value: '2' } })

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Activar Membresía', hidden: true }))
      })

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
        // Multiple error alerts might exist
        expect(screen.getAllByText('Error al asignar la membresía').length).toBeGreaterThan(0)
      })
    })

    it('closes modal on cancel', async () => {
      renderMembershipsPage()
      await openAssignModal()

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Cancelar', hidden: true }))
      })

      await waitFor(() => {
        expect(screen.queryByRole('dialog', { hidden: true })).not.toBeInTheDocument()
      })
    })
  })

  describe('Tab Navigation', () => {
    it('switches between plans and memberships tabs', async () => {
      renderMembershipsPage()
      expect(screen.getByRole('tab', { name: 'Planes de membresía' })).toBeInTheDocument()

      await switchToMembershipsTab()
      expect(screen.getByRole('tab', { name: 'Suscripciones de clientes' })).toBeInTheDocument()

      await act(async () => {
        fireEvent.click(screen.getByRole('tab', { name: 'Planes de membresía' }))
      })
      await waitFor(() => {
        expect(screen.getByRole('tab', { name: 'Planes de membresía' })).toBeInTheDocument()
      })
    })
  })
})
