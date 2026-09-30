import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { CircleDollarSign, ReceiptText, RefreshCw, WalletCards } from 'lucide'
import { api } from '../../api/client'
import type { CreatePaymentInput } from '../../types/api'
import MorphIcon from '../../components/MorphIcon'
import { useClients, usePayments, useInvoices, useCreatePayment } from '../../hooks/useApi'
import StatusBadge from '../../components/StatusBadge'
import Button from '../../components/Button'
import FormField from '../../components/FormField'
import Modal from '../../components/Modal'
import Alert from '../../components/Alert'
import Tabs, { TabPanel } from '../../components/Tabs'
import TableContainer from '../../components/TableContainer'
import PageHeader from '../../components/PageHeader'
import Pagination from '../../components/Pagination'
import Skeleton from '../../components/Skeleton'
import '../../styles/dashboard/PaymentsPage.css'

const paymentMethods: Record<string, string> = {
  cash: 'Efectivo',
  bank_transfer: 'Transferencia bancaria',
  digital_wallet: 'Billetera (Yape/Plin)',
  credit_card: 'Tarjeta (terminal)',
  debit_card: 'Tarjeta de débito (terminal)',
}

function formatMoney(amount: number | string, currency: string) {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency }).format(Number(amount))
}

function formatDate(value: string) {
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value)
  const [year, month, day] = value.slice(0, 10).split('-').map(Number)
  const date = dateOnly && year && month && day ? new Date(year, month - 1, day) : new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('es-PE', { day: 'numeric', month: 'short', year: 'numeric' }).format(date)
}

type PaymentFormState = Omit<CreatePaymentInput, 'clientId' | 'membershipId' | 'amount' | 'transactionId'> & {
  clientId: string;
  membershipId: string;
  amount: string;
  description: string;
}

export default function PaymentsPage() {
  const [activeTab, setActiveTab] = useState<'payments' | 'invoices'>('payments')
  const [page, setPage] = useState(1)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [paymentSuccess, setPaymentSuccess] = useState<string | null>(null)
  const [paymentError, setPaymentError] = useState<string | null>(null)
  const [newPayment, setNewPayment] = useState<PaymentFormState>({
    clientId: '',
    membershipId: '',
    amount: '',
    currency: 'PEN',
    paymentMethod: 'cash',
    description: '',
  })

  const { data: clientsData, isLoading: clientsLoading, isError: clientsIsError, error: clientsError, refetch: refetchClients } = useClients(1, 100)
  const { data: paymentsData, isLoading: paymentsLoading, isError: paymentsIsError, error: paymentsError, refetch: refetchPayments } = usePayments(page, 20)
  const { data: invoicesData, isLoading: invoicesLoading, isError: invoicesIsError, error: invoicesError, refetch: refetchInvoices } = useInvoices(1, 100)

  const allClients = clientsData?.data ?? []
  const selectedClientId = Number(newPayment.clientId)
  const membershipsQuery = useQuery({
    queryKey: ['clientMemberships', selectedClientId],
    queryFn: () => api.getClientMemberships(selectedClientId),
    enabled: isPaymentModalOpen && selectedClientId > 0,
    retry: false,
  })
  const clientMemberships = Array.isArray(membershipsQuery.data) ? membershipsQuery.data : []
  const payments = paymentsData?.data ?? []
  const invoices = invoicesData?.data ?? []
  const totalPages = paymentsData?.pagination.totalPages ?? 1

  const createPaymentMutation = useCreatePayment()

  const handleCreatePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const amount = Number(newPayment.amount)
    if (!newPayment.clientId || !newPayment.membershipId || !Number.isFinite(amount) || amount <= 0 || Math.round(amount * 100) !== amount * 100) {
      setPaymentError('Seleccione un socio y una membresía, e ingrese un monto válido con hasta dos decimales.')
      return
    }

    try {
      setPaymentError(null)

      await createPaymentMutation.mutateAsync({
        clientId: Number(newPayment.clientId),
        membershipId: Number(newPayment.membershipId),
        amount,
        currency: newPayment.currency,
        paymentMethod: newPayment.paymentMethod,
        description: newPayment.description.trim() || 'Pago de membresía registrado en recepción',
      })

      setPaymentSuccess('Pago registrado como recibido. No se procesó ningún cobro electrónico.')
      setIsPaymentModalOpen(false)
      setNewPayment({
        clientId: '',
        membershipId: '',
        amount: '',
        currency: 'PEN',
        paymentMethod: 'cash',
        description: '',
      })
    } catch (err) {
      setPaymentError(err instanceof Error ? err.message : 'Error al procesar el pago')
    }
  }

  const paymentColumns = [
    { key: 'clientLabel', header: 'Socio', render: (p: typeof payments[0]) => {
      const clientObj = allClients.find(c => c.id === p.clientId)
      const clientLabel = p.clientName ?? (clientObj ? `${clientObj.firstName} ${clientObj.lastName}` : `Socio #${p.clientId}`)
      return <strong>{clientLabel}</strong>
    }},
    { key: 'amount', header: 'Monto', render: (p: typeof payments[0]) => formatMoney(p.amount, p.currency) },
    { key: 'paymentMethod', header: 'Medio de pago', render: (p: typeof payments[0]) => paymentMethods[p.paymentMethod] ?? p.paymentMethod },
    { key: 'status', header: 'Estado', render: (p: typeof payments[0]) => <StatusBadge status={p.status} /> },
    { key: 'paidAt', header: 'Fecha', render: (p: typeof payments[0]) => formatDate(p.paidAt || p.createdAt) },
    { key: 'transactionId', header: 'Recibo', render: (p: typeof payments[0]) => <code>{p.transactionId || `REC-${p.id}`}</code> },
  ]

  const invoiceColumns = [
    { key: 'invoiceNumber', header: 'Comprobante', render: (inv: typeof invoices[0]) => <code>{inv.invoiceNumber}</code> },
    { key: 'clientId', header: 'Socio', render: (inv: typeof invoices[0]) => {
      const client = allClients.find((item) => item.id === inv.clientId)
      return client ? `${client.firstName} ${client.lastName}` : `Socio #${inv.clientId}`
    } },
    { key: 'amount', header: 'Monto', render: (inv: typeof invoices[0]) => formatMoney(inv.amount, inv.currency) },
    { key: 'dueDate', header: 'Fecha', render: (inv: typeof invoices[0]) => formatDate(inv.dueDate) },
    { key: 'status', header: 'Estado', render: (inv: typeof invoices[0]) => <StatusBadge status={inv.status} /> },
  ]

  return (
    <div className="payments-page">
      <PageHeader
        title="Pagos"
        description="Registra los pagos recibidos y consulta sus comprobantes."
        actions={[
          {
            label: 'Registrar pago',
            onClick: () => { setPaymentError(null); setIsPaymentModalOpen(true); },
            ariaLabel: 'Registrar nuevo pago',
            variant: 'primary',
            icon: <MorphIcon icon={CircleDollarSign} size={18} aria-hidden="true" />,
          },
        ]}
      />

      {paymentSuccess && <Alert type="success" message={paymentSuccess} onDismiss={() => setPaymentSuccess(null)} dismissible />}
      <Tabs
        tabs={[
          { id: 'payments', label: 'Pagos', count: paymentsData?.pagination.total ?? payments.length },
          { id: 'invoices', label: 'Comprobantes', count: invoices.length },
        ]}
        activeTab={activeTab}
        onChange={(tabId: string) => { setActiveTab(tabId as 'payments' | 'invoices'); setPage(1); }}
        ariaLabel="Secciones de pagos y facturación"
      />

      <TabPanel id="payments" activeTab={activeTab}>
        {paymentsIsError ? <div className="payment-query-error"><Alert type="error" title="No se pudo cargar el historial" message={paymentsError instanceof Error ? paymentsError.message : 'Inténtalo de nuevo.'} /><Button variant="secondary" onClick={() => void refetchPayments()}><MorphIcon icon={RefreshCw} size={16} aria-hidden="true" />Reintentar</Button></div> : <TableContainer
          data={payments}
          loading={paymentsLoading}
          columns={paymentColumns}
          rowKey="id"
          emptyState={{
            icon: <MorphIcon icon={WalletCards} size={24} aria-hidden="true" />,
            title: 'Todavía no hay pagos registrados',
            description: 'Los pagos recibidos aparecerán aquí para que puedas consultarlos.',
            action: { label: 'Registrar pago', onClick: () => { setPaymentError(null); setIsPaymentModalOpen(true) }, variant: 'primary' },
          }}
        />}
        {totalPages > 1 && (
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={paymentsData?.pagination.total ?? 0}
            onPageChange={setPage}
          />
        )}
      </TabPanel>

      <TabPanel id="invoices" activeTab={activeTab}>
        {invoicesIsError ? <div className="payment-query-error"><Alert type="error" title="No se pudieron cargar los comprobantes" message={invoicesError instanceof Error ? invoicesError.message : 'Inténtalo de nuevo.'} /><Button variant="secondary" onClick={() => void refetchInvoices()}><MorphIcon icon={RefreshCw} size={16} aria-hidden="true" />Reintentar</Button></div> : <TableContainer
          data={invoices}
          loading={invoicesLoading}
          columns={invoiceColumns}
          rowKey="id"
          emptyState={{
            icon: <MorphIcon icon={ReceiptText} size={24} aria-hidden="true" />,
            title: 'Todavía no hay comprobantes',
            description: 'Los comprobantes asociados a los pagos aparecerán aquí.',
          }}
        />}
      </TabPanel>

      <Modal
        open={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title="Registrar pago"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsPaymentModalOpen(false)}>Cancelar</Button>
            <Button variant="primary" disabled={createPaymentMutation.isPending} onClick={handleCreatePaymentSubmit}>
              {createPaymentMutation.isPending ? 'Registrando...' : 'Confirmar Cobro'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreatePaymentSubmit}>
          <div className="modal-body">
            {paymentError && <Alert type="error" message={paymentError} onDismiss={() => setPaymentError(null)} dismissible />}
            <p className="payment-form-note">Registra un pago que ya recibió recepción. Este formulario no realiza cobros electrónicos.</p>

            {clientsIsError && <div className="payment-query-error"><Alert type="error" title="No se pudieron cargar los socios" message={clientsError instanceof Error ? clientsError.message : 'Inténtalo de nuevo.'} /><Button variant="secondary" onClick={() => void refetchClients()}>Reintentar</Button></div>}
            {clientsLoading && <div className="payment-field-skeleton" aria-busy="true"><span>Socio</span><Skeleton height={44} ariaLabel="Cargando socios" /></div>}
            {!clientsLoading && !clientsIsError && allClients.length === 0 && <Alert type="warning" message="Aún no hay socios. Registra primero a un socio antes de registrar un pago." />}
            {!clientsLoading && !clientsIsError && allClients.length > 0 && <FormField
              label="Socio"
              type="select"
              id="payment-client"
              value={newPayment.clientId}
              onChange={(value) => setNewPayment({ ...newPayment, clientId: value, membershipId: '' })}
              options={allClients.map(c => ({ value: String(c.id), label: `${c.firstName} ${c.lastName} · DNI ${c.dni}` }))}
              emptyOptionLabel="Selecciona un socio"
              required
            />}

            {newPayment.clientId && membershipsQuery.isLoading && <div className="payment-field-skeleton" aria-busy="true"><span>Membresía asociada</span><Skeleton height={44} ariaLabel="Cargando membresías del socio" /></div>}
            {newPayment.clientId && !membershipsQuery.isLoading && !membershipsQuery.isError && clientMemberships.length > 0 && <FormField
              label="Membresía asociada"
              type="select"
              id="payment-membership"
              value={newPayment.membershipId}
              onChange={(value) => setNewPayment({ ...newPayment, membershipId: value })}
              options={clientMemberships.map((membership: { id: number; plan?: { name?: string }; startDate: string; endDate: string; status: string }) => ({
                value: String(membership.id),
                label: `${membership.plan?.name ?? `Membresía #${membership.id}`} · ${membership.status} · ${membership.startDate} – ${membership.endDate}`,
              }))}
              emptyOptionLabel="Selecciona una membresía"
              disabled={membershipsQuery.isLoading || membershipsQuery.isError || clientMemberships.length === 0}
              required
            />}
            {membershipsQuery.isError && <div className="payment-query-error"><Alert type="error" title="No se pudieron cargar las membresías" message={membershipsQuery.error instanceof Error ? membershipsQuery.error.message : 'Inténtalo de nuevo.'} /><Button variant="secondary" onClick={() => void membershipsQuery.refetch()}>Reintentar</Button></div>}
            {newPayment.clientId && !membershipsQuery.isLoading && !membershipsQuery.isError && clientMemberships.length === 0 && <Alert type="warning" message="Este socio aún no tiene membresías. Asígnale una antes de registrar el pago." />}

            <div className="payment-form-grid">
              <FormField
                label="Monto *"
                type="number"
                id="payment-amount"
                value={newPayment.amount}
                onChange={(value) => setNewPayment({ ...newPayment, amount: value })}
                placeholder="Ej: 49.90"
                required
              />
              <FormField
                label="Moneda *"
                type="select"
                id="payment-currency"
                value={newPayment.currency}
                onChange={(value) => setNewPayment({ ...newPayment, currency: value === 'USD' ? 'USD' : 'PEN' })}
                options={[{ value: 'PEN', label: 'Soles peruanos (PEN)' }, { value: 'USD', label: 'Dólares estadounidenses (USD)' }]}
                required
              />
              <FormField
                label="Método de Pago *"
                type="select"
                id="payment-method"
                value={newPayment.paymentMethod}
                onChange={(value) => setNewPayment({ ...newPayment, paymentMethod: (['cash', 'bank_transfer', 'digital_wallet', 'credit_card', 'debit_card'] as const).find((method) => method === value) ?? 'cash' })}
                options={[
                  { value: 'cash', label: 'Efectivo' },
                  { value: 'bank_transfer', label: 'Transferencia Bancaria' },
                  { value: 'digital_wallet', label: 'Billetera digital (Yape/Plin)' },
                  { value: 'credit_card', label: 'Tarjeta registrada en terminal' },
                ]}
                required
              />
            </div>

            <details className="payment-optional-fields">
              <summary>Agregar descripción (opcional)</summary>
              <FormField
                label="Descripción del pago"
                type="text"
                id="payment-desc"
                value={newPayment.description}
                onChange={(value) => setNewPayment({ ...newPayment, description: value })}
                placeholder="Ej.: Mensualidad de septiembre"
              />
            </details>
          </div>
        </form>
      </Modal>
    </div>
  )
}
