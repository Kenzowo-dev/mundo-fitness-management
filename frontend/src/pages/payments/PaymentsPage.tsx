import { useState, useCallback } from 'react'
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

export default function PaymentsPage() {
  const [activeTab, setActiveTab] = useState<'payments' | 'invoices'>('payments')
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 })
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [paymentSuccess, setPaymentSuccess] = useState<string | null>(null)
  const [paymentError, setPaymentError] = useState<string | null>(null)
  const [newPayment, setNewPayment] = useState({
    clientId: '',
    amount: '',
    currency: 'USD',
    paymentMethod: 'credit_card',
    description: '',
  })

  const { data: clientsData } = useClients(1, 100)
  const { data: paymentsData, error: paymentsError, refetch: refetchPayments } = usePayments(pagination.page, 20)
  const { data: invoicesData, error: invoicesError } = useInvoices(1, 100)

  const allClients = clientsData?.data ?? []
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
    if (!newPayment.clientId || !newPayment.amount || Number(newPayment.amount) <= 0) {
      setPaymentError('Seleccione un socio e ingrese un monto válido mayor a 0.')
      return
    }

    try {
      setPaymentError(null)

      await createPaymentMutation.mutateAsync({
        clientId: Number(newPayment.clientId),
        amount: Number(newPayment.amount),
        currency: newPayment.currency,
        paymentMethod: newPayment.paymentMethod,
        status: 'completed',
        description: newPayment.description || 'Cobro de membresía en recepción',
        transactionId: `TX-${Date.now()}`,
      })

      setPaymentSuccess('¡Pago registrado y procesado exitosamente!')
      setIsPaymentModalOpen(false)
      setNewPayment({
        clientId: '',
        amount: '',
        currency: 'USD',
        paymentMethod: 'credit_card',
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
      const clientLabel = clientObj ? `${clientObj.firstName} ${clientObj.lastName}` : `Socio #${p.clientId}`
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
        title="Caja, Cobros y Facturación"
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
          { id: 'invoices', label: 'Facturas Electrónicas', count: invoices.length },
        ]}
        activeTab={activeTab}
        onChange={(tabId: string) => { setActiveTab(tabId as 'payments' | 'invoices'); setPagination({ page: 1, totalPages: 1 }); }}
        ariaLabel="Secciones de pagos y facturación"
      />

      <TabPanel id="payments" activeTab={activeTab}>
        <TableContainer
          data={payments}
          loading={paymentsError !== undefined}
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
          loading={invoicesError !== undefined}
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

            <FormField
              label="Socio / Cliente *"
              type="select"
              id="payment-client"
              value={newPayment.clientId}
              onChange={(value) => setNewPayment({ ...newPayment, clientId: value })}
              options={allClients.map(c => ({ value: String(c.id), label: `${c.firstName} ${c.lastName} (DNI: ${c.dni})` }))}
              emptyOptionLabel="-- Seleccionar socio --"
              required
            />

            <div className="form-grid-2">
              <FormField
                label="Monto ($) *"
                type="number"
                id="payment-amount"
                value={newPayment.amount}
                onChange={(value) => setNewPayment({ ...newPayment, amount: value })}
                placeholder="Ej: 49.99"
                required
              />
              <FormField
                label="Método de Pago *"
                type="select"
                id="payment-method"
                value={newPayment.paymentMethod}
                onChange={(value) => setNewPayment({ ...newPayment, paymentMethod: value })}
                options={[
                  { value: 'credit_card', label: 'Tarjeta de Crédito / Débito' },
                  { value: 'cash', label: 'Efectivo' },
                  { value: 'bank_transfer', label: 'Transferencia Bancaria' },
                  { value: 'yape_plin', label: 'Billetera Digital (Yape/Plin)' },
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