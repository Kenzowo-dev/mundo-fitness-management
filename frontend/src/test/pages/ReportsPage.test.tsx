// @ts-nocheck
import { vi, beforeEach, describe, it, expect } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import ReportsPage from '@/pages/reports/ReportsPage'
import * as useApiModule from '@/hooks/useApi'

const query = (data, overrides = {}) => ({ data, isLoading: false, isError: false, error: null, ...overrides })

describe('ReportsPage', () => {
  beforeEach(() => vi.restoreAllMocks())

  const renderPage = ({ clients, memberships, payments } = {}) => {
    vi.spyOn(useApiModule, 'useClientReports').mockReturnValue(clients ?? query({
      clientsByMonth: [{ month: '2026-08', count: 4 }, { month: '2026-09', count: 7 }],
      clientsByStatus: [{ status: 'active', count: 20 }, { status: 'inactive', count: 2 }],
    }))
    vi.spyOn(useApiModule, 'useMembershipReports').mockReturnValue(memberships ?? query({
      membershipsByStatus: [{ status: 'active', count: 12 }, { status: 'expired', count: 5 }],
      visitsByDay: [{ date: '2026-09-28', count: 8 }, { date: '2026-09-29', count: 11 }],
    }))
    vi.spyOn(useApiModule, 'usePaymentReports').mockReturnValue(payments ?? query([
      { month: '2026-08', currency: 'PEN', amount: 400 },
      { month: '2026-09', currency: 'PEN', amount: 500 },
      { month: '2026-08', currency: 'USD', amount: 30 },
      { month: '2026-09', currency: 'USD', amount: 50 },
    ]))
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    return render(<QueryClientProvider client={client}><ReportsPage /></QueryClientProvider>)
  }

  it('shows factual reports for clients, membership status, attendance and each currency', () => {
    renderPage()
    expect(screen.getByRole('heading', { name: 'Informes operativos' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Nuevos socios por mes' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Socios por estado' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Membresías por estado' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Check-ins por día' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Ingresos por mes (PEN)' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Ingresos por mes (USD)' })).toBeInTheDocument()
  })

  it('provides an accessible chart summary and tabular values', () => {
    renderPage()
    expect(screen.getByRole('img', { name: /Nuevos socios por mes.*4.*7/i })).toBeInTheDocument()
    fireEvent.click(screen.getAllByText('Ver datos en tabla')[0])
    const table = screen.getAllByRole('table')[0]
    expect(within(table).getByText('Ago.')).toBeInTheDocument()
    expect(within(table).getByText('Set.')).toBeInTheDocument()
  })

  it('shows loading placeholders while reports are loading', () => {
    renderPage({ clients: query(undefined, { isLoading: true }), memberships: query(undefined, { isLoading: true }), payments: query(undefined, { isLoading: true }) })
    expect(screen.getByLabelText('Cargando informes')).toHaveAttribute('aria-busy', 'true')
  })

  it('shows the service error and retains reports that loaded successfully', () => {
    renderPage({ clients: query(undefined, { isError: true, error: new Error('Error de clientes') }) })
    expect(screen.getByRole('alert')).toHaveTextContent('Error de clientes')
    expect(screen.getByRole('heading', { name: 'Check-ins por día' })).toBeInTheDocument()
  })

  it('explains when there are no completed payments in the selected period', () => {
    renderPage({ payments: query([]) })
    expect(screen.getByText('No hay pagos completados para mostrar todavía.')).toBeInTheDocument()
  })
})
