// @ts-nocheck
import { vi, beforeEach, afterEach, describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import ReportsPage from '@/pages/reports/ReportsPage'
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

const mockWidgets = [
  { id: 1, name: 'Total Clientes', type: 'metric', width: 1, height: 1, query: { metric: 'totalClients' } },
  { id: 2, name: 'Ingresos Mes', type: 'metric', width: 1, height: 1, query: { metric: 'revenueMonth' } },
  { id: 3, name: 'Tendencia Clientes', type: 'line', width: 2, height: 1, query: { metric: 'clientsTrend' } },
  { id: 4, name: 'Distribución Planes', type: 'pie', width: 1, height: 1, query: { metric: 'planDistribution' } },
]

const mockWidgetData = {
  1: { columns: ['value'], rows: [[150]] },
  2: { columns: ['value'], rows: [['$1,500.00']] },
  3: { columns: ['date', 'value'], rows: [['2024-01', 10], ['2024-02', 15], ['2024-03', 12]] },
  4: { columns: ['label', 'value'], rows: [['Plan Básico', 50], ['Plan Premium', 30], ['Plan Anual', 20]] },
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

describe('ReportsPage - Integration Tests', () => {
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

  const renderReportsPage = (overrides?: {
    widgets?: ReturnType<typeof createMockQuery>
    widgetQueries?: ReturnType<typeof createMockQuery>[]
  }) => {
    const widgetsMock = overrides?.widgets ?? createMockQuery({
      data: mockWidgets,
      isLoading: false,
      isFetching: false,
      isSuccess: true,
      status: 'success',
    })

    const widgetQueriesMock = overrides?.widgetQueries ?? mockWidgets.map((w) =>
      createMockQuery({
        data: mockWidgetData[w.id as keyof typeof mockWidgetData],
        isLoading: false,
        isFetching: false,
        isSuccess: true,
        status: 'success',
      })
    )

    vi.spyOn(useApiModule, 'useWidgets').mockReturnValue(widgetsMock as ReturnType<typeof useApiModule.useWidgets>)
    vi.spyOn(useApiModule, 'useAllWidgets').mockReturnValue(widgetQueriesMock as ReturnType<typeof useApiModule.useAllWidgets>)

    return render(<ReportsPage />, { wrapper: createWrapper() })
  }

  describe('Render inicial', () => {
    it('renders page title', () => {
      renderReportsPage()
      expect(screen.getByText('Reportes y Analíticas')).toBeInTheDocument()
    })

    it('renders widgets grid when data available', () => {
      renderReportsPage()
      // Widget grid has aria-label="Cuadro de métricas"
      expect(screen.getByLabelText('Cuadro de métricas')).toBeInTheDocument()
    })

    it('renders all enabled widgets', () => {
      renderReportsPage()
      expect(screen.getByText('Total Clientes')).toBeInTheDocument()
      expect(screen.getByText('Ingresos Mes')).toBeInTheDocument()
      expect(screen.getByText('Tendencia Clientes')).toBeInTheDocument()
      expect(screen.getByText('Distribución Planes')).toBeInTheDocument()
    })

    it('renders metric widget values', () => {
      renderReportsPage()
      expect(screen.getByText('150')).toBeInTheDocument()
      expect(screen.getByText('$1,500.00')).toBeInTheDocument()
    })

    it('renders chart placeholders for chart widgets', () => {
      renderReportsPage()
      expect(screen.getByText('Gráfico de líneas: 3 puntos de datos')).toBeInTheDocument()
      expect(screen.getByText('Gráfico de pastel: 3 segmentos')).toBeInTheDocument()
    })

    it('renders table preview for table widget', () => {
      // Add a table widget for this test
      const tableWidgets = [
        ...mockWidgets,
        { id: 5, name: 'Tabla de Prueba', type: 'table', width: 2, height: 1, query: { metric: 'testTable' } },
      ]
      const tableData = { ...mockWidgetData, 5: { columns: ['A', 'B'], rows: [[1, 2], [3, 4]] } }

      renderReportsPage({
        widgets: createMockQuery({ data: tableWidgets, isLoading: false, isFetching: false, isSuccess: true, status: 'success' }),
        widgetQueries: [
          ...mockWidgets.map((w) => createMockQuery({ data: mockWidgetData[w.id as keyof typeof mockWidgetData], isLoading: false, isFetching: false, isSuccess: true, status: 'success' })),
          createMockQuery({ data: tableData[5], isLoading: false, isFetching: false, isSuccess: true, status: 'success' }),
        ],
      })
      expect(screen.getByText('Tabla de Prueba')).toBeInTheDocument()
      expect(screen.getByText('A')).toBeInTheDocument()
      expect(screen.getByText('B')).toBeInTheDocument()
    })
  })

  describe('Loading State', () => {
    it('shows loading skeletons while widgets loading', () => {
      renderReportsPage({
        widgets: createMockQuery({ data: mockWidgets, isLoading: true }),
        widgetQueries: mockWidgets.map(() => createMockQuery({ isLoading: true })),
      })
      expect(screen.getByLabelText('Cargando reportes')).toBeInTheDocument()
    })

    it('shows loading state when widget queries loading', () => {
      renderReportsPage({
        widgets: createMockQuery({ data: mockWidgets, isLoading: false, isFetching: false, isSuccess: true, status: 'success' }),
        widgetQueries: mockWidgets.map(() => createMockQuery({ isLoading: true })),
      })
      expect(screen.getByLabelText('Cargando reportes')).toBeInTheDocument()
    })

    it('does not show widget content during loading', () => {
      renderReportsPage({
        widgets: createMockQuery({ data: mockWidgets, isLoading: true }),
        widgetQueries: mockWidgets.map(() => createMockQuery({ isLoading: true })),
      })
      expect(screen.queryByText('Total Clientes')).not.toBeInTheDocument()
      expect(screen.queryByText('150')).not.toBeInTheDocument()
    })
  })

  describe('Empty State', () => {
    it('shows empty state when no widgets configured', () => {
      renderReportsPage({
        widgets: createMockQuery({ data: [], isLoading: false, isFetching: false, isSuccess: true, status: 'success' }),
      })
      expect(screen.getByText('No hay reportes ni métricas configuradas.')).toBeInTheDocument()
    })
  })

  describe('Error State', () => {
    it('shows error alert when widgets query fails', () => {
      renderReportsPage({
        widgets: createMockErrorQuery('Failed to fetch widgets'),
      })
      expect(screen.getByRole('alert')).toBeInTheDocument()
      expect(screen.getByText('Error')).toBeInTheDocument()
      expect(screen.getByText('Failed to fetch widgets')).toBeInTheDocument()
    })

    it('shows error when individual widget query fails', () => {
      const widgetQueriesWithError = [
        createMockQuery({ data: mockWidgetData[1], isLoading: false, isFetching: false, isSuccess: true, status: 'success' }),
        createMockErrorQuery('Failed to fetch widget 2'),
        createMockQuery({ data: mockWidgetData[3], isLoading: false, isFetching: false, isSuccess: true, status: 'success' }),
        createMockQuery({ data: mockWidgetData[4], isLoading: false, isFetching: false, isSuccess: true, status: 'success' }),
      ]
      renderReportsPage({
        widgetQueries: widgetQueriesWithError,
      })
      expect(screen.getByRole('alert')).toBeInTheDocument()
      expect(screen.getByText('Error')).toBeInTheDocument()
    })

    it('page does not crash on error', () => {
      renderReportsPage({
        widgets: createMockErrorQuery('Network error'),
      })
      expect(screen.getByText('Reportes y Analíticas')).toBeInTheDocument()
    })

    it('shows page-level error and widgets grid when any widget query fails', () => {
      const widgetQueriesWithError = [
        createMockQuery({ data: mockWidgetData[1], isLoading: false, isFetching: false, isSuccess: true, status: 'success' }),
        createMockErrorQuery('Failed to fetch widget 2'),
        createMockQuery({ data: mockWidgetData[3], isLoading: false, isFetching: false, isSuccess: true, status: 'success' }),
        createMockQuery({ data: mockWidgetData[4], isLoading: false, isFetching: false, isSuccess: true, status: 'success' }),
      ]
      renderReportsPage({
        widgetQueries: widgetQueriesWithError,
      })
      // Page shows error alert AND widgets grid (with individual widget errors)
      expect(screen.getByRole('alert')).toBeInTheDocument()
      expect(screen.getByText('Error')).toBeInTheDocument()
      // Error message appears in both page alert and widget error
      expect(screen.getAllByText('Failed to fetch widget 2').length).toBe(2)
      // Widgets grid IS rendered with individual widget errors
      expect(screen.getByLabelText('Cuadro de métricas')).toBeInTheDocument()
      // Error appears in the page alert
      const errorElements = screen.getAllByText('Failed to fetch widget 2')
      expect(errorElements.length).toBeGreaterThan(0)
    })
  })
})