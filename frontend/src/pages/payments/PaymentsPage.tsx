import { useState, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../api/client'
import type { CreatePaymentInput } from '../../types/api'
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
import '../../styles/dashboard/PaymentsPage.css'

type PaymentFormState = Omit<CreatePaymentInput, 'clientId' | 'membershipId' | 'amount' | 'transactionId'> & {
  clientId: string;
  membershipId: string;
  amount: string;
  description: string;
}

export default function PaymentsPage() {
  const [activeTab, setActiveTab] = useState<'payments' | 'invoices'>('payments')
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 })
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

  const { data: clientsData } = useClients(1, 100)
  const { data: paymentsData, isLoading: paymentsLoading, error: paymentsError, refetch: refetchPayments } = usePayments(pagination.page, 20)
  const { data: invoicesData, isLoading: invoicesLoading, error: invoicesError } = useInvoices(1, 100)

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

  const error = paymentsError || invoicesError

  const createPaymentMutation = useCreatePayment()

  const fetchData = useCallback(() => {
    refetchPayments()
  }, [refetchPayments])

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
      setTimeout(() => setPaymentSuccess(null), 4000)
      fetchData()
    } catch (err) {
      setPaymentError(err instanceof Error ? err.message : 'Error al procesar el pago')
    }
  }

  const paymentColumns = [
    { key: 'clientLabel', header: 'Socio / Cliente', render: (p: typeof payments[0]) => {
      const clientObj = allClients.find(c => c.id === p.clientId)
      const clientLabel = p.clientName ?? (clientObj ? `${clientObj.firstName} ${clientObj.lastName}` : `Socio #${p.clientId}`)
      return <strong>{clientLabel}</strong>
    }},
    { key: 'amount', header: 'Monto', render: (p: typeof payments[0]) => `${Number(p.amount).toFixed(2)} ${p.currency}` },
    { key: 'paymentMethod', header: 'Método', render: (p: typeof payments[0]) => p.paymentMethod.toUpperCase() },
    { key: 'status', header: 'Estado', render: (p: typeof payments[0]) => <StatusBadge status={p.status} /> },
    { key: 'paidAt', header: 'Fecha', render: (p: typeof payments[0]) => p.paidAt ? new Date(p.paidAt).toLocaleDateString() : new Date(p.createdAt).toLocaleDateString() },
    { key: 'transactionId', header: 'Transacción / Recibo', render: (p: typeof payments[0]) => <code>{p.transactionId || `REC-${p.id}`}</code> },
  ]

  const invoiceColumns = [
    { key: 'invoiceNumber', header: 'Número de Factura', render: (inv: typeof invoices[0]) => <code>{inv.invoiceNumber}</code> },
    { key: 'clientId', header: 'Socio', render: (inv: typeof invoices[0]) => `Socio #${inv.clientId}` },
    { key: 'amount', header: 'Monto Total', render: (inv: typeof invoices[0]) => `${Number(inv.amount).toFixed(2)} ${inv.currency}` },
    { key: 'dueDate', header: 'Vencimiento', render: (inv: typeof invoices[0]) => new Date(inv.dueDate).toLocaleDateString() },
    { key: 'status', header: 'Estado', render: (inv: typeof invoices[0]) => <StatusBadge status={inv.status} /> },
  ]

  return (
    <div className="payments-page">
      <PageHeader
        title="Pagos y comprobantes"
        actions={[
          {
            label: 'Registrar Pago',
            onClick: () => { setPaymentError(null); setIsPaymentModalOpen(true); },
            ariaLabel: 'Registrar nuevo cobro',
            variant: 'primary',
          },
        ]}
      />

      {paymentSuccess && <Alert type="success" message={paymentSuccess} onDismiss={() => setPaymentSuccess(null)} dismissible />}
      {error && <Alert type="error" title="Error" message={error instanceof Error ? error.message : 'Error desconocido'} />}

      <Tabs
        tabs={[
          { id: 'payments', label: 'Historial de Pagos', count: payments.length },
          { id: 'invoices', label: 'Facturas registradas', count: invoices.length },
        ]}
        activeTab={activeTab}
        onChange={(tabId: string) => { setActiveTab(tabId as 'payments' | 'invoices'); setPagination({ page: 1, totalPages: 1 }); }}
        ariaLabel="Secciones de pagos y facturación"
      />

      <TabPanel id="payments" activeTab={activeTab}>
        <TableContainer
          data={payments}
          loading={paymentsLoading}
          columns={paymentColumns}
          rowKey="id"
          emptyState={{
            icon: <span aria-hidden="true">💰</span>,
            title: 'No hay pagos registrados aún en el sistema.',
            action: { label: 'Registrar primer cobro', onClick: () => setIsPaymentModalOpen(true), variant: 'primary' },
          }}
        />
        {totalPages > 1 && (
          <Pagination
            currentPage={pagination.page}
            totalPages={totalPages}
            totalItems={paymentsData?.pagination.total ?? 0}
            onPageChange={(page) => setPagination(prev => ({ ...prev, page: page }))}
          />
        )}
      </TabPanel>

      <TabPanel id="invoices" activeTab={activeTab}>
        <TableContainer
          data={invoices}
          loading={invoicesLoading}
          columns={invoiceColumns}
          rowKey="id"
          emptyState={{
            icon: <span aria-hidden="true">📄</span>,
            title: 'No hay facturas emitidas en el periodo seleccionado.',
          }}
        />
      </TabPanel>

      <Modal
        open={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title="Registrar Pago / Cobro"
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
            <p>Registra un pago recibido fuera de la web. Esta acción no realiza cargos electrónicos.</p>

            <FormField
              label="Socio / Cliente *"
              type="select"
              id="payment-client"
              value={newPayment.clientId}
              onChange={(value) => setNewPayment({ ...newPayment, clientId: value, membershipId: '' })}
              options={allClients.map(c => ({ value: String(c.id), label: `${c.firstName} ${c.lastName} (DNI: ${c.dni})` }))}
              emptyOptionLabel="-- Seleccionar socio --"
              required
            />

            {newPayment.clientId && <FormField
              label="Membresía asociada *"
              type="select"
              id="payment-membership"
              value={newPayment.membershipId}
              onChange={(value) => setNewPayment({ ...newPayment, membershipId: value })}
              options={clientMemberships.map((membership: { id: number; plan?: { name?: string }; startDate: string; endDate: string; status: string }) => ({
                value: String(membership.id),
                label: `${membership.plan?.name ?? `Membresía #${membership.id}`} · ${membership.status} · ${membership.startDate} – ${membership.endDate}`,
              }))}
              emptyOptionLabel={membershipsQuery.isLoading ? 'Cargando membresías…' : '-- Seleccionar membresía --'}
              disabled={membershipsQuery.isLoading || membershipsQuery.isError || clientMemberships.length === 0}
              required
            />}
            {membershipsQuery.isError && <Alert type="error" message="No se pudieron cargar las membresías del socio." />}
            {newPayment.clientId && !membershipsQuery.isLoading && !membershipsQuery.isError && clientMemberships.length === 0 && <Alert type="error" message="Este socio no tiene membresías registradas. Asigna primero una membresía." />}

            <div className="form-grid-2">
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

            <FormField
              label="Descripción o Concepto"
              type="text"
              id="payment-desc"
              value={newPayment.description}
              onChange={(value) => setNewPayment({ ...newPayment, description: value })}
              placeholder="Ej: Pago mensualidad Plan Estándar Marzo"
            />
          </div>
        </form>
      </Modal>
    </div>
  )
}
