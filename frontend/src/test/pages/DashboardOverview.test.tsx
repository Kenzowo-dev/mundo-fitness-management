// @ts-nocheck
import { vi, beforeEach, afterEach, describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import DashboardOverview from '@/pages/dashboard/DashboardOverview'
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

const mockClientsData = {
  data: [
    { id: 1, dni: '71234567', firstName: 'Juan', lastName: 'Pérez', status: 'active', createdAt: '2024-01-15T10:00:00Z' },
    { id: 2, dni: '72345678', firstName: 'María', lastName: 'García', status: 'active', createdAt: '2024-02-20T10:00:00Z' },
  ],
  pagination: { page: 1, limit: 1, total: 150, totalPages: 150 },
}

const mockPlansData = [
  { id: 1, name: 'Plan Básico', price: 50, isActive: true, durationDays: 30 },
  { id: 2, name: 'Plan Premium', price: 100, isActive: true, durationDays: 90 },
  { id: 3, name: 'Plan Anual', price: 500, isActive: true, durationDays: 365 },
]

const mockPaymentsData = {
  data: [
    { id: 1, amount: 50, status: 'completed', currency: 'USD' },
    { id: 2, amount: 100, status: 'completed', currency: 'USD' },
    { id: 3, amount: 75, status: 'pending', currency: 'USD' },
  ],
  pagination: { page: 1, limit: 50, total: 3, totalPages: 1 },
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

describe('DashboardOverview - Integration Tests', () => {
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

  const renderDashboard = (overrides?: {
    clients?: ReturnType<typeof createMockQuery>
    plans?: ReturnType<typeof createMockQuery>
    payments?: ReturnType<typeof createMockQuery>
  }) => {
    const clientsMock = overrides?.clients ?? createMockQuery({ data: mockClientsData, isLoading: false, isFetching: false, isSuccess: true, status: 'success' })
    const plansMock = overrides?.plans ?? createMockQuery({ data: mockPlansData, isLoading: false, isFetching: false, isSuccess: true, status: 'success' })
    const paymentsMock = overrides?.payments ?? createMockQuery({ data: mockPaymentsData, isLoading: false, isFetching: false, isSuccess: true, status: 'success' })

    vi.spyOn(useApiModule, 'useClients').mockReturnValue(clientsMock as ReturnType<typeof useApiModule.useClients>)
    vi.spyOn(useApiModule, 'useMembershipPlans').mockReturnValue(plansMock as ReturnType<typeof useApiModule.useMembershipPlans>)
    vi.spyOn(useApiModule, 'usePayments').mockReturnValue(paymentsMock as ReturnType<typeof useApiModule.usePayments>)

    return render(<DashboardOverview />, { wrapper: createWrapper() })
  }

  describe('Initial Render', () => {
    it('renders welcome title with user name', () => {
      renderDashboard()
      expect(screen.getByText('¡Bienvenido, Test User!')).toBeInTheDocument()
    })

    it('renders user role in welcome section', () => {
      renderDashboard()
      expect(screen.getByText('ADMIN')).toBeInTheDocument()
      expect(screen.getByText(/Rol activo/)).toBeInTheDocument()
    })

    it('renders four stat cards', () => {
      renderDashboard()
      const statCards = screen.getAllByText(/Socios Registrados|Planes de Membresía|Ingresos Recaudados|Estado del Sistema/)
      expect(statCards.length).toBe(4)
    })

    it('renders stat card for Socios Registrados', () => {
      renderDashboard()
      expect(screen.getByText('Socios Registrados')).toBeInTheDocument()
    })

    it('renders stat card for Planes de Membresía', () => {
      renderDashboard()
      expect(screen.getByText('Planes de Membresía')).toBeInTheDocument()
    })

    it('renders stat card for Ingresos Recaudados', () => {
      renderDashboard()
      expect(screen.getByText('Ingresos Recaudados')).toBeInTheDocument()
    })

    it('renders stat card for Estado del Sistema', () => {
      renderDashboard()
      expect(screen.getByText('Estado del Sistema')).toBeInTheDocument()
    })

    it('renders four action cards with navigation links', () => {
      renderDashboard()
      expect(screen.getByRole('link', { name: /Gestión de Clientes/i })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /Membresías y Accesos/i })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /Planes de Entrenamiento/i })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /Caja y Facturación/i })).toBeInTheDocument()
    })

    it('renders action card descriptions', () => {
      renderDashboard()
      expect(screen.getByText('Registrar socios, ver historiales y medidas corporales.')).toBeInTheDocument()
      expect(screen.getByText('Consultar planes, controlar check-in y suscripciones.')).toBeInTheDocument()
      expect(screen.getByText('Biblioteca de ejercicios y rutinas personalizadas.')).toBeInTheDocument()
      expect(screen.getByText('Consultar pagos realizados, emitir y verificar facturas.')).toBeInTheDocument()
    })
  })

  describe('Loading State', () => {
    it('shows skeleton placeholders while loading', () => {
      renderDashboard({
        clients: createMockQuery({ data: mockClientsData }),
        plans: createMockQuery({ data: mockPlansData }),
        payments: createMockQuery({ data: mockPaymentsData }),
      })

      const skeletons = screen.getAllByLabelText('Cargando contenido')
      expect(skeletons.length).toBeGreaterThanOrEqual(3)
    })

    it('does not show final metric values during loading', () => {
      renderDashboard({
        clients: createMockQuery({ data: mockClientsData }),
        plans: createMockQuery({ data: mockPlansData }),
        payments: createMockQuery({ data: mockPaymentsData }),
      })

      expect(screen.queryByText('150')).not.toBeInTheDocument()
      expect(screen.queryByText('3')).not.toBeInTheDocument()
      expect(screen.queryByText('$225.00')).not.toBeInTheDocument()
    })

    it('shows loading state initially for all queries', () => {
      renderDashboard({
        clients: createMockQuery({ data: mockClientsData }),
        plans: createMockQuery({ data: mockPlansData }),
        payments: createMockQuery({ data: mockPaymentsData }),
      })

      expect(screen.getByText('Socios Registrados')).toBeInTheDocument()
      expect(screen.getByText('Planes de Membresía')).toBeInTheDocument()
      expect(screen.getByText('Ingresos Recaudados')).toBeInTheDocument()
    })
  })

  describe('Success State - Data Display', () => {
    it('shows correct clients count (150)', () => {
      renderDashboard()
      expect(screen.getByText('150')).toBeInTheDocument()
    })

    it('shows correct plans count (3)', () => {
      renderDashboard()
      expect(screen.getByText('3')).toBeInTheDocument()
    })

    it('shows correct payments total ($150.00) - only completed payments', () => {
      renderDashboard()
      expect(screen.getByText('$150.00')).toBeInTheDocument()
    })

    it('shows system status as Operativo 100%', () => {
      renderDashboard()
      expect(screen.getByText('Operativo 100%')).toBeInTheDocument()
    })

    it('does not show error alert when all queries succeed', () => {
      renderDashboard()
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })

    it('action cards remain available and clickable', () => {
      renderDashboard()
      expect(screen.getByRole('link', { name: /Gestión de Clientes/i })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /Membresías y Accesos/i })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /Planes de Entrenamiento/i })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /Caja y Facturación/i })).toBeInTheDocument()
    })
  })

  describe('Error State', () => {
    it('shows error alert when clients query fails', () => {
      renderDashboard({
        clients: createMockErrorQuery('Failed to fetch clients'),
        plans: createMockQuery({ ...mockPlansData, isLoading: false, isFetching: false, isSuccess: true, status: 'success' }),
        payments: createMockQuery({ ...mockPaymentsData, isLoading: false, isFetching: false, isSuccess: true, status: 'success' }),
      })

      expect(screen.getByRole('alert')).toBeInTheDocument()
      expect(screen.getByText('Error cargando métricas del dashboard')).toBeInTheDocument()
      expect(screen.getByText('Failed to fetch clients')).toBeInTheDocument()
    })

    it('shows error alert when plans query fails', () => {
      renderDashboard({
        clients: createMockQuery({ data: mockClientsData, isLoading: false, isFetching: false, isSuccess: true, status: 'success' }),
        plans: createMockErrorQuery('Failed to fetch plans'),
        payments: createMockQuery({ data: mockPaymentsData, isLoading: false, isFetching: false, isSuccess: true, status: 'success' }),
      })

      expect(screen.getByRole('alert')).toBeInTheDocument()
      expect(screen.getByText('Error cargando métricas del dashboard')).toBeInTheDocument()
    })

    it('shows error alert when payments query fails', () => {
      renderDashboard({
        clients: createMockQuery({ data: mockClientsData, isLoading: false, isFetching: false, isSuccess: true, status: 'success' }),
        plans: createMockQuery({ data: mockPlansData, isLoading: false, isFetching: false, isSuccess: true, status: 'success' }),
        payments: createMockErrorQuery('Failed to fetch payments'),
      })

      expect(screen.getByRole('alert')).toBeInTheDocument()
      expect(screen.getByText('Error cargando métricas del dashboard')).toBeInTheDocument()
    })

    it('does not break dashboard layout on error', () => {
      renderDashboard({
        clients: createMockErrorQuery('Network error'),
        plans: createMockErrorQuery('Network error'),
        payments: createMockErrorQuery('Network error'),
      })

      expect(screen.getByText('¡Bienvenido, Test User!')).toBeInTheDocument()
      expect(screen.getByText('Socios Registrados')).toBeInTheDocument()
      expect(screen.getByText('Planes de Membresía')).toBeInTheDocument()
      expect(screen.getByText('Ingresos Recaudados')).toBeInTheDocument()
      expect(screen.getByText('Estado del Sistema')).toBeInTheDocument()
    })

    it('action cards remain available on error', () => {
      renderDashboard({
        clients: createMockErrorQuery('Network error'),
        plans: createMockErrorQuery('Network error'),
        payments: createMockErrorQuery('Network error'),
      })

      expect(screen.getByRole('link', { name: /Gestión de Clientes/i })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /Membresías y Accesos/i })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /Planes de Entrenamiento/i })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /Caja y Facturación/i })).toBeInTheDocument()
    })

    it('error alert is dismissible', () => {
      renderDashboard({
        clients: createMockErrorQuery('Network error'),
        plans: createMockQuery({ ...mockPlansData, isLoading: false, isFetching: false, isSuccess: true, status: 'success' }),
        payments: createMockQuery({ ...mockPaymentsData, isLoading: false, isFetching: false, isSuccess: true, status: 'success' }),
      })

      const dismissButton = screen.getByRole('button', { name: 'Descartar' })
      expect(dismissButton).toBeInTheDocument()
    })
  })

  describe('Empty Data State', () => {
    it('shows zero values when data arrays are empty', () => {
      renderDashboard({
        clients: createMockQuery({ data: { data: [], pagination: { page: 1, limit: 1, total: 0, totalPages: 0 } }, isLoading: false, isFetching: false, isSuccess: true, status: 'success' }),
        plans: createMockQuery({ data: [], isLoading: false, isFetching: false, isSuccess: true, status: 'success' }),
        payments: createMockQuery({ data: { data: [], pagination: { page: 1, limit: 50, total: 0, totalPages: 0 } }, isLoading: false, isFetching: false, isSuccess: true, status: 'success' }),
      })

      const zeros = screen.getAllByText('0')
      expect(zeros.length).toBeGreaterThanOrEqual(2)
      expect(screen.getByText('$0.00')).toBeInTheDocument()
    })

    it('shows Operativo 100% regardless of data', () => {
      renderDashboard({
        clients: createMockQuery({ data: { data: [], pagination: { page: 1, limit: 1, total: 0, totalPages: 0 } }, isLoading: false, isFetching: false, isSuccess: true, status: 'success' }),
        plans: createMockQuery({ data: [], isLoading: false, isFetching: false, isSuccess: true, status: 'success' }),
        payments: createMockQuery({ data: { data: [], pagination: { page: 1, limit: 50, total: 0, totalPages: 0 } }, isLoading: false, isFetching: false, isSuccess: true, status: 'success' }),
      })

      expect(screen.getByText('Operativo 100%')).toBeInTheDocument()
    })
  })

  describe('Navigation', () => {
    it('has link to /clientes', () => {
      renderDashboard()
      const link = screen.getByRole('link', { name: /Gestión de Clientes/i })
      expect(link).toHaveAttribute('href', '/clientes')
    })

    it('has link to /membresias', () => {
      renderDashboard()
      const link = screen.getByRole('link', { name: /Membresías y Accesos/i })
      expect(link).toHaveAttribute('href', '/membresias')
    })

    it('has link to /planes', () => {
      renderDashboard()
      const link = screen.getByRole('link', { name: /Planes de Entrenamiento/i })
      expect(link).toHaveAttribute('href', '/planes')
    })

    it('has link to /pagos', () => {
      renderDashboard()
      const link = screen.getByRole('link', { name: /Caja y Facturación/i })
      expect(link).toHaveAttribute('href', '/pagos')
    })
  })
})