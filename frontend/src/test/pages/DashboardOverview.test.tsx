// @ts-nocheck
import { vi, beforeEach, describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import DashboardOverview from '@/pages/dashboard/DashboardOverview'
import * as useApiModule from '@/hooks/useApi'
import * as authModule from '@/context/useAuth'

const mockUser = { id: 1, email: 'test@example.com', firstName: 'Test', lastName: 'User', role: 'admin' }
const createQuery = (data, overrides = {}) => ({
  data,
  isLoading: false,
  isError: false,
  error: null,
  ...overrides,
})

describe('DashboardOverview', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.spyOn(authModule, 'useAuth').mockReturnValue({ user: mockUser })
  })

  const renderDashboard = ({ clients, memberships, payments } = {}) => {
    vi.spyOn(useApiModule, 'useClientDashboardStats').mockReturnValue(clients ?? createQuery({ totalClients: 10, activeClients: 8 }))
    vi.spyOn(useApiModule, 'useMembershipDashboardStats').mockReturnValue(memberships ?? createQuery({ activeMemberships: 6, visitsToday: 3 }))
    vi.spyOn(useApiModule, 'usePaymentDashboardStats').mockReturnValue(payments ?? createQuery({ revenueThisMonth: [{ currency: 'PEN', amount: 250 }, { currency: 'USD', amount: 30 }] }))
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    return render(<QueryClientProvider client={queryClient}><BrowserRouter><DashboardOverview /></BrowserRouter></QueryClientProvider>)
  }

  it('welcomes the signed-in employee and shows the operational metrics', () => {
    renderDashboard()
    expect(screen.getByText('¡Bienvenido, Test User!')).toBeInTheDocument()
    expect(screen.getByText('administración')).toBeInTheDocument()
    expect(screen.getByText('Socios activos')).toBeInTheDocument()
    expect(screen.getByText('Membresías vigentes')).toBeInTheDocument()
    expect(screen.getByText('Check-ins de hoy')).toBeInTheDocument()
    expect(screen.getByText('Ingresos cobrados este mes')).toBeInTheDocument()
  })

  it('displays the aggregate values returned by the services and keeps currencies separate', () => {
    renderDashboard()
    expect(screen.getByText('8')).toBeInTheDocument()
    expect(screen.getByText('6')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText(/S\/\s?250\.00/)).toBeInTheDocument()
    expect(screen.getByLabelText('Ingresos cobrados este mes')).toHaveTextContent('USD')
    expect(screen.getByLabelText('Ingresos cobrados este mes')).toHaveTextContent('30.00')
  })

  it('shows skeletons while metrics load', () => {
    renderDashboard({
      clients: createQuery(undefined, { isLoading: true }),
      memberships: createQuery(undefined, { isLoading: true }),
      payments: createQuery(undefined, { isLoading: true }),
    })
    expect(document.querySelectorAll('.skeleton[aria-hidden="true"]')).toHaveLength(4)
  })

  it('shows a useful alert and marks failed metrics unavailable', () => {
    renderDashboard({ clients: createQuery(undefined, { isError: true, error: new Error('Servicio de clientes no disponible') }) })
    expect(screen.getByRole('alert')).toHaveTextContent('No se pudieron cargar todas las métricas')
    expect(screen.getByText('—')).toBeInTheDocument()
    expect(screen.getByText('Servicio de clientes no disponible')).toBeInTheDocument()
  })

  it('shows a clear empty revenue state without inventing a currency', () => {
    renderDashboard({ payments: createQuery({ revenueThisMonth: [] }) })
    expect(screen.getByText('Sin ingresos este mes')).toBeInTheDocument()
  })

  it('keeps the main reception routes available', () => {
    renderDashboard()
    expect(screen.getByRole('link', { name: /Gestionar socios/i })).toHaveAttribute('href', '/clientes')
    expect(screen.getByRole('link', { name: /Membresías y Accesos/i })).toHaveAttribute('href', '/membresias')
    expect(screen.getByRole('link', { name: /^Pagos/i })).toHaveAttribute('href', '/pagos')
  })
})
