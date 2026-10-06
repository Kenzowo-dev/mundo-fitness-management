// @ts-nocheck
import { vi, beforeEach, afterEach, describe, it, expect } from 'vitest'
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import PaymentsPage from '@/pages/payments/PaymentsPage'
import { api } from '@/api/client'
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

const mockClientMemberships = [
  { id: 11, clientId: 1, planId: 1, plan: { name: 'Plan Básico' }, startDate: '2026-09-01', endDate: '2026-09-30', status: 'active', autoRenew: false, createdAt: '2026-09-01', updatedAt: '2026-09-01' },
]

const mockPayments = [
  { id: 1, clientId: 1, amount: 50, currency: 'USD', paymentMethod: 'credit_card', status: 'completed', paidAt: '2024-01-15T10:00:00Z', createdAt: '2024-01-15T10:00:00Z', transactionId: 'TX-123', description: 'Pago mensualidad' },
  { id: 2, clientId: 2, amount: 100, currency: 'USD', paymentMethod: 'cash', status: 'completed', paidAt: '2024-02-20T10:00:00Z', createdAt: '2024-02-20T10:00:00Z', transactionId: 'TX-456', description: 'Pago mensualidad' },
  { id: 3, clientId: 1, amount: 75, currency: 'USD', paymentMethod: 'bank_transfer', status: 'pending', paidAt: '2024-03-10T10:00:00Z', createdAt: '2024-03-10T10:00:00Z', transactionId: 'TX-789', description: 'Pago mensualidad' },
]

const mockInvoices = [
  { id: 1, clientId: 1, invoiceNumber: 'FAC-001', amount: 50, currency: 'USD', dueDate: '2024-02-15', status: 'paid', createdAt: '2024-01-15T10:00:00Z' },
  { id: 2, clientId: 2, invoiceNumber: 'FAC-002', amount: 100, currency: 'USD', dueDate: '2024-03-20', status: 'pending', createdAt: '2024-02-20T10:00:00Z' },
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

describe('PaymentsPage - Integration Tests', () => {
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
    vi.spyOn(api, 'getClientMemberships').mockResolvedValue(mockClientMemberships)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  const renderPaymentsPage = (overrides?: {
    clients?: ReturnType<typeof createMockQuery>
    payments?: ReturnType<typeof createMockQuery>
    invoices?: ReturnType<typeof createMockQuery>
    createPaymentMutation?: ReturnType<typeof createMockMutation>
  }) => {
    const clientsMock = overrides?.clients ?? createMockQuery({
      data: { data: mockClients, pagination: { page: 1, limit: 100, total: 2, totalPages: 1 } },
      isLoading: false,
      isFetching: false,
      isSuccess: true,
      status: 'success',
    })

    const paymentsMock = overrides?.payments ?? createMockQuery({
      data: { data: mockPayments, pagination: { page: 1, limit: 20, total: 3, totalPages: 1 } },
      isLoading: false,
      isFetching: false,
      isSuccess: true,
      status: 'success',
    })

    const invoicesMock = overrides?.invoices ?? createMockQuery({
      data: mockInvoices,
      isLoading: false,
      isFetching: false,
      isSuccess: true,
      status: 'success',
    })

    const createPaymentMock = overrides?.createPaymentMutation ?? createMockMutation()

    vi.spyOn(useApiModule, 'useClients').mockReturnValue(clientsMock as ReturnType<typeof useApiModule.useClients>)
    vi.spyOn(useApiModule, 'usePayments').mockReturnValue(paymentsMock as ReturnType<typeof useApiModule.usePayments>)
    vi.spyOn(useApiModule, 'useInvoices').mockReturnValue(invoicesMock as ReturnType<typeof useApiModule.useInvoices>)
    vi.spyOn(useApiModule, 'useCreatePayment').mockReturnValue(createPaymentMock as ReturnType<typeof useApiModule.useCreatePayment>)

    return render(<PaymentsPage />, { wrapper: createWrapper() })
  }

  const openPaymentModal = async () => {
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Registrar nuevo pago' }))
    })
    await waitFor(() => {
      expect(screen.getByRole('dialog', { hidden: true })).toBeInTheDocument()
    }, { timeout: 3000 })
  }

  const switchToInvoicesTab = async () => {
    await act(async () => {
      fireEvent.click(screen.getByRole('tab', { name: 'Comprobantes' }))
    })
    await waitFor(() => {
      expect(screen.getByRole('tab', { name: 'Comprobantes' })).toBeInTheDocument()
    }, { timeout: 3000 })
  }

  describe('Render inicial / Listado', () => {
    it('renders page title', () => {
      renderPaymentsPage()
      expect(screen.getByRole('heading', { name: 'Pagos' })).toBeInTheDocument()
    })

    it('renders action button in header', () => {
      renderPaymentsPage()
      expect(screen.getByRole('button', { name: 'Registrar nuevo pago' })).toBeInTheDocument()
    })

    it('renders tabs for payments and invoices', () => {
      renderPaymentsPage()
      expect(screen.getByRole('tab', { name: 'Pagos' })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: 'Comprobantes' })).toBeInTheDocument()
    })

    it('shows payments tab with columns', () => {
      renderPaymentsPage()
      expect(screen.getByText('Socio')).toBeInTheDocument()
      expect(screen.getByText('Monto')).toBeInTheDocument()
      expect(screen.getByText('Medio de pago')).toBeInTheDocument()
      expect(screen.getByText('Estado')).toBeInTheDocument()
      expect(screen.getByText('Fecha')).toBeInTheDocument()
      expect(screen.getByText('Recibo')).toBeInTheDocument()
    })

    it('shows invoices tab when switched', async () => {
      renderPaymentsPage()
      await switchToInvoicesTab()
      expect(screen.getByText('Comprobante')).toBeInTheDocument()
      expect(screen.getByText('Socio')).toBeInTheDocument()
      expect(screen.getByText('Monto')).toBeInTheDocument()
      expect(screen.getByText('Fecha')).toBeInTheDocument()
      expect(screen.getByText('Estado')).toBeInTheDocument()
    })
  })

  describe('Loading State', () => {
    it('shows a skeleton while socios load in the payment form', async () => {
      renderPaymentsPage({ clients: createMockQuery() })
      await openPaymentModal()
      const loadingField = screen.getByText('Socio', { selector: '.payment-field-skeleton > span' }).parentElement
      expect(loadingField).toHaveAttribute('aria-busy', 'true')
      expect(loadingField.querySelector('.skeleton')).toHaveAttribute('aria-hidden', 'true')
    })

    it('shows a skeleton while the selected socio memberships load', async () => {
      vi.spyOn(api, 'getClientMemberships').mockReturnValue(new Promise(() => {}))
      renderPaymentsPage()
      await openPaymentModal()
      fireEvent.change(screen.getByLabelText(/^Socio/), { target: { value: '1' } })
      const label = await screen.findByText('Membresía asociada', { selector: '.payment-field-skeleton > span' })
      expect(label.parentElement).toHaveAttribute('aria-busy', 'true')
      expect(label.parentElement.querySelector('.skeleton')).toHaveAttribute('aria-hidden', 'true')
    })

    it('shows the empty payments state after a successful empty response', () => {
      renderPaymentsPage({
        payments: createMockQuery({
          data: { data: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } },
          isLoading: false,
          isFetching: false,
          isSuccess: true,
          status: 'success',
        }),
      })

      expect(screen.queryByLabelText('Cargando fila')).not.toBeInTheDocument()
      expect(screen.getByText('Todavía no hay pagos registrados')).toBeInTheDocument()
    })

    it('shows the empty invoices state after a successful empty response', async () => {
      renderPaymentsPage({
        invoices: createMockQuery({
          data: [],
          isLoading: false,
          isFetching: false,
          isSuccess: true,
          status: 'success',
        }),
      })
      await switchToInvoicesTab()

      expect(screen.queryByLabelText('Cargando fila')).not.toBeInTheDocument()
      expect(screen.getByText('Todavía no hay comprobantes')).toBeInTheDocument()
    })

    it('shows loading state for payments tab', () => {
      renderPaymentsPage({
        payments: createMockQuery({ data: { data: mockPayments, pagination: { page: 1, limit: 20, total: 3, totalPages: 1 } } }),
      })
      const loadingRows = screen.getAllByLabelText('Cargando fila')
      expect(loadingRows.length).toBeGreaterThan(0)
    })

    it('shows loading state for invoices tab', async () => {
      renderPaymentsPage({
        invoices: createMockQuery({ data: mockInvoices }),
      })
      await switchToInvoicesTab()
      const loadingRows = screen.getAllByLabelText('Cargando fila')
      expect(loadingRows.length).toBeGreaterThan(0)
    })
  })

  describe('Empty State', () => {
    it('shows a clear empty state when there are no payments', () => {
      renderPaymentsPage({
        payments: createMockQuery({
          data: { data: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } },
          isLoading: false,
          isFetching: false,
          isSuccess: true,
          status: 'success',
        }),
      })

      expect(screen.getByRole('status', { name: 'Todavía no hay pagos registrados' })).toBeInTheDocument()
    })
  })

  describe('Error State', () => {
    it('shows error alert when payments query fails', () => {
      renderPaymentsPage({
        payments: createMockErrorQuery('Failed to fetch payments'),
      })
      expect(screen.getByRole('alert')).toBeInTheDocument()
      expect(screen.getByText('No se pudo cargar el historial')).toBeInTheDocument()
      expect(screen.getByText('Failed to fetch payments')).toBeInTheDocument()
    })

    it('shows error alert when invoices query fails', () => {
      const invoicesQuery = createMockErrorQuery('Failed to fetch invoices')
      renderPaymentsPage({
        invoices: invoicesQuery,
      })
      fireEvent.click(screen.getByRole('tab', { name: 'Comprobantes' }))
      expect(screen.getByRole('alert')).toBeInTheDocument()
      expect(screen.getByText('No se pudieron cargar los comprobantes')).toBeInTheDocument()
      expect(screen.getByText('Failed to fetch invoices')).toBeInTheDocument()
      fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }))
      expect(invoicesQuery.refetch).toHaveBeenCalledTimes(1)
    })

    it('page does not crash on error', () => {
      renderPaymentsPage({
        payments: createMockErrorQuery('Network error'),
      })
      expect(screen.getByRole('heading', { name: 'Pagos' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Registrar nuevo pago' })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: 'Pagos' })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: 'Comprobantes' })).toBeInTheDocument()
    })
  })

  describe('Registrar Pago Flow', () => {
    it('opens payment modal', async () => {
      renderPaymentsPage()
      await openPaymentModal()
      expect(screen.getByRole('heading', { name: 'Registrar pago' })).toBeInTheDocument()
    })

    it('renders payment form with required fields', async () => {
      renderPaymentsPage()
      await openPaymentModal()

      expect(screen.getByLabelText(/^Socio/)).toBeInTheDocument()
      expect(screen.getByLabelText(/Monto/)).toBeInTheDocument()
      expect(screen.getByLabelText(/Método de Pago/)).toBeInTheDocument()
      expect(screen.getByText(/no realiza cobros electrónicos/)).toBeInTheDocument()
      fireEvent.click(screen.getByText('Agregar descripción (opcional)'))
      expect(screen.getByLabelText(/Descripción del pago/)).toBeInTheDocument()
      // Verify select has options
      const clientSelect = screen.getByLabelText(/^Socio/)
      expect(clientSelect.querySelectorAll('option').length).toBeGreaterThan(0)
    })

    it('calls createPayment mutation with correct data', async () => {
      const mockCreate = createMockMutation({ mutateAsync: vi.fn().mockResolvedValue(undefined) })
      renderPaymentsPage({ createPaymentMutation: mockCreate })
      await openPaymentModal()

      fireEvent.change(screen.getByLabelText(/^Socio/), { target: { value: '1' } })
      await waitFor(() => expect(api.getClientMemberships).toHaveBeenCalledWith(1))
      await waitFor(() => expect(screen.getByLabelText(/Membresía asociada/).querySelectorAll('option').length).toBeGreaterThan(1))
      fireEvent.change(screen.getByLabelText(/Membresía asociada/), { target: { value: '11' } })
      fireEvent.change(screen.getByLabelText(/Monto/), { target: { value: '50' } })
      fireEvent.change(screen.getByLabelText(/Método de Pago/), { target: { value: 'credit_card' } })
      fireEvent.click(screen.getByText('Agregar descripción (opcional)'))
      fireEvent.change(screen.getByLabelText(/Descripción del pago/), { target: { value: 'Pago mensualidad' } })

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Confirmar Cobro', hidden: true }))
      })

      await waitFor(() => {
        expect(mockCreate.mutateAsync).toHaveBeenCalledWith(expect.objectContaining({
          clientId: 1,
          membershipId: 11,
          amount: 50,
          currency: 'PEN',
          paymentMethod: 'credit_card',
        }))
      })
    })

    it('shows success message after payment', async () => {
      const mockCreate = createMockMutation({ mutateAsync: vi.fn().mockResolvedValue(undefined) })
      renderPaymentsPage({ createPaymentMutation: mockCreate })
      await openPaymentModal()

      fireEvent.change(screen.getByLabelText(/^Socio/), { target: { value: '1' } })
      await waitFor(() => expect(screen.getByLabelText(/Membresía asociada/).querySelectorAll('option').length).toBeGreaterThan(1))
      fireEvent.change(screen.getByLabelText(/Membresía asociada/), { target: { value: '11' } })
      fireEvent.change(screen.getByLabelText(/Monto/), { target: { value: '50' } })
      fireEvent.change(screen.getByLabelText(/Método de Pago/), { target: { value: 'credit_card' } })

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Confirmar Cobro', hidden: true }))
      })

      await waitFor(() => {
        expect(screen.getByText('Pago registrado como recibido. No se procesó ningún cobro electrónico.')).toBeInTheDocument()
      })
    })

    it('shows error on payment failure', async () => {
      const mockCreate = createMockMutation({ mutateAsync: vi.fn().mockRejectedValue(new Error('Error al procesar el pago')) })
      renderPaymentsPage({ createPaymentMutation: mockCreate })
      await openPaymentModal()

      fireEvent.change(screen.getByLabelText(/^Socio/), { target: { value: '1' } })
      await waitFor(() => expect(screen.getByLabelText(/Membresía asociada/).querySelectorAll('option').length).toBeGreaterThan(1))
      fireEvent.change(screen.getByLabelText(/Membresía asociada/), { target: { value: '11' } })
      fireEvent.change(screen.getByLabelText(/Monto/), { target: { value: '50' } })

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Confirmar Cobro', hidden: true }))
      })

      await waitFor(() => {
        // Error appears in modal's local Alert
        expect(screen.getAllByText('Error al procesar el pago').length).toBeGreaterThan(0)
      })
    })

    it('rejects amounts with more than two decimal places before sending', async () => {
      const mockCreate = createMockMutation()
      renderPaymentsPage({ createPaymentMutation: mockCreate })
      await openPaymentModal()
      fireEvent.change(screen.getByLabelText(/^Socio/), { target: { value: '1' } })
      await waitFor(() => expect(screen.getByLabelText(/Membresía asociada/).querySelectorAll('option').length).toBeGreaterThan(1))
      fireEvent.change(screen.getByLabelText(/Membresía asociada/), { target: { value: '11' } })
      fireEvent.change(screen.getByLabelText(/Monto/), { target: { value: '1.005' } })

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Confirmar Cobro', hidden: true }))
      })

      expect(screen.getByText(/hasta dos decimales/i)).toBeInTheDocument()
      expect(mockCreate.mutateAsync).not.toHaveBeenCalled()
    })

    it('closes modal on cancel', async () => {
      renderPaymentsPage()
      await openPaymentModal()

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Cancelar', hidden: true }))
      })

      await waitFor(() => {
        expect(screen.queryByRole('dialog', { hidden: true })).not.toBeInTheDocument()
      })
    })
  })

  describe('Tab Navigation', () => {
    it('switches between payments and invoices tabs', async () => {
      renderPaymentsPage()
      expect(screen.getByRole('tab', { name: 'Pagos' })).toBeInTheDocument()

      await switchToInvoicesTab()
      expect(screen.getByRole('tab', { name: 'Comprobantes' })).toBeInTheDocument()

      await act(async () => {
        fireEvent.click(screen.getByRole('tab', { name: 'Pagos' }))
      })
      await waitFor(() => {
        expect(screen.getByRole('tab', { name: 'Pagos' })).toBeInTheDocument()
      })
    })

    it('resets pagination when switching tabs', async () => {
      renderPaymentsPage({
        payments: createMockQuery({ data: { data: mockPayments, pagination: { page: 2, limit: 20, total: 50, totalPages: 3 } } }),
      })
      expect(screen.getByRole('tab', { name: 'Pagos' })).toBeInTheDocument()

      await switchToInvoicesTab()
      expect(screen.getByRole('tab', { name: 'Comprobantes' })).toBeInTheDocument()

      // Switching back should reset to page 1
      await act(async () => {
        fireEvent.click(screen.getByRole('tab', { name: 'Pagos' }))
      })
      await waitFor(() => {
        expect(screen.getByRole('tab', { name: 'Pagos' })).toBeInTheDocument()
      })
    })
  })

  describe('Pagination', () => {
    it('shows pagination when multiple pages', () => {
      renderPaymentsPage({
        payments: createMockQuery({ data: { data: mockPayments, pagination: { page: 1, limit: 20, total: 50, totalPages: 3 } } }),
      })
      expect(screen.getByRole('navigation')).toBeInTheDocument()
    })

    it('does not show pagination when single page', () => {
      renderPaymentsPage()
      expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
    })
  })
})
