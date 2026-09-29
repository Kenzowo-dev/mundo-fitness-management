import { useState, useCallback, useMemo } from 'react'
import { useClients, useMembershipPlans, useAllClientMemberships, useCreateMembership, useCheckIn } from '../../hooks/useApi'
import type { Client, ClientMembership, MembershipPlan } from '../../types/api'
import type { UseQueryResult } from '@tanstack/react-query'
import StatusBadge from '../../components/StatusBadge'
import Button from '../../components/Button'
import FormField from '../../components/FormField'
import Modal from '../../components/Modal'
import Alert from '../../components/Alert'
import Tabs, { TabPanel } from '../../components/Tabs'
import TableContainer from '../../components/TableContainer'
import PageHeader from '../../components/PageHeader'
import '../../styles/dashboard/MembershipsPage.css'

export default function MembershipsPage() {
  const [activeTab, setActiveTab] = useState<'plans' | 'memberships'>('plans')
  const [isCheckInOpen, setIsCheckInOpen] = useState(false)
  const [isAssignOpen, setIsAssignOpen] = useState(false)
  const [selectedClientId, setSelectedClientId] = useState<number | ''>('')
  const [selectedPlanId, setSelectedPlanId] = useState<number | ''>('')
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const { data: clientsData, isLoading: clientsLoading, error: clientsError, refetch: refetchClients } = useClients(1, 100)
  const { data: plansData, error: plansError } = useMembershipPlans(true)

  const allClients: Client[] = useMemo(() => clientsData?.data ?? [], [clientsData?.data])
  const clientIds = useMemo(() => allClients.map(c => c.id), [allClients])
  const clientNames = useMemo(() => {
    const map: Record<number, string> = {}
    allClients.forEach((c) => { map[c.id] = `${c.firstName} ${c.lastName} (${c.dni})` })
    return map
  }, [allClients])

  const membershipsQueries: UseQueryResult<ClientMembership[], Error>[] = useAllClientMemberships(clientIds, !clientsLoading)

  const allMemberships: ClientMembership[] = useMemo(() =>
    membershipsQueries.flatMap((q) => q.data ?? []),
    [membershipsQueries]
  )

  const plans: MembershipPlan[] = useMemo(() => plansData ?? [], [plansData])

  const error = clientsError || plansError || membershipsQueries.find((q) => q.error)?.error

  const createMembershipMutation = useCreateMembership()
  const checkInMutation = useCheckIn()

  const fetchData = useCallback(() => {
    refetchClients()
    membershipsQueries.forEach((q) => q.refetch())
  }, [refetchClients, membershipsQueries])

  const handleCheckInSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedClientId) {
      setActionError('Seleccione un cliente para registrar el acceso.')
      return
    }

    try {
      setActionError(null)
      const clientMem = allMemberships.find((m) => m.clientId === Number(selectedClientId) && m.status === 'active')
      const membershipId = clientMem ? clientMem.id : 1

      await checkInMutation.mutateAsync({ clientId: Number(selectedClientId), membershipId })
      setActionSuccess('¡Check-in registrado exitosamente! Acceso concedido al gimnasio.')
      setIsCheckInOpen(false)
      setSelectedClientId('')
      setTimeout(() => setActionSuccess(null), 4000)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Error al registrar el check-in')
    }
  }

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedClientId || !selectedPlanId) {
      setActionError('Seleccione un cliente y un plan de membresía.')
      return
    }

    try {
      setActionError(null)
      const selPlan = plans.find((p) => p.id === Number(selectedPlanId))
      const duration = selPlan?.durationDays || 30
      const startDate = new Date().toISOString().split('T')[0]
      const endDateObj = new Date()
      endDateObj.setDate(endDateObj.getDate() + duration)
      const endDate = endDateObj.toISOString().split('T')[0]

      await createMembershipMutation.mutateAsync({
        clientId: Number(selectedClientId),
        planId: Number(selectedPlanId),
        startDate,
        endDate,
        status: 'active',
        autoRenew: true,
      })

      setActionSuccess('¡Membresía asignada exitosamente al cliente!')
      setIsAssignOpen(false)
      setSelectedClientId('')
      setSelectedPlanId('')
      setTimeout(() => setActionSuccess(null), 4000)
      fetchData()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Error al asignar la membresía')
    }
  }

  const planColumns = [
    { key: 'name', header: 'Nombre' },
    { key: 'durationDays', header: 'Duración', render: (plan: MembershipPlan) => `${plan.durationDays} días` },
    { key: 'price', header: 'Precio', render: (plan: MembershipPlan) => `${Number(plan.price).toFixed(2)} ${plan.currency}` },
    { key: 'maxVisitsPerWeek', header: 'Visitas/semana', render: (plan: MembershipPlan) => plan.maxVisitsPerWeek || 'Ilimitado' },
    { key: 'includesPersonalTrainer', header: 'Entrenador', render: (plan: MembershipPlan) => plan.includesPersonalTrainer ? '✓' : '✗' },
    { key: 'includesClasses', header: 'Clases', render: (plan: MembershipPlan) => plan.includesClasses ? '✓' : '✗' },
    { key: 'includesSauna', header: 'Sauna', render: (plan: MembershipPlan) => plan.includesSauna ? '✓' : '✗' },
    { key: 'isActive', header: 'Estado', render: (plan: MembershipPlan) => <StatusBadge status={plan.isActive ? 'active' : 'inactive'} /> },
  ]

  const membershipColumns = [
    { key: 'clientName', header: 'Cliente / Socio', render: (m: ClientMembership) => <strong>{clientNames[m.clientId] || `Cliente #${m.clientId}`}</strong> },
    { key: 'planName', header: 'Plan Adquirido', render: (m: ClientMembership) => m.plan?.name || 'Plan Estándar' },
    { key: 'startDate', header: 'Fecha Inicio', render: (m: ClientMembership) => new Date(m.startDate).toLocaleDateString() },
    { key: 'endDate', header: 'Fecha Fin', render: (m: ClientMembership) => new Date(m.endDate).toLocaleDateString() },
    { key: 'status', header: 'Estado', render: (m: ClientMembership) => <StatusBadge status={m.status} /> },
    { key: 'autoRenew', header: 'Auto-renovar', render: (m: ClientMembership) => m.autoRenew ? 'Sí' : 'No' },
  ]

  return (
    <div className="memberships-page">
      <PageHeader
        title="Gestión de Membresías y Control de Acceso"
        actions={[
          {
            label: 'Registrar Check-in',
            onClick: () => { setActionError(null); setIsCheckInOpen(true) },
            ariaLabel: 'Registrar Check-In de socio',
            variant: 'primary',
          },
          {
            label: 'Asignar Membresía',
            onClick: () => { setActionError(null); setIsAssignOpen(true) },
            ariaLabel: 'Asignar Membresía a socio',
            variant: 'secondary',
          },
        ]}
      />

      {actionSuccess && <Alert type="success" message={actionSuccess} onDismiss={() => setActionSuccess(null)} dismissible />}
      {actionError && <Alert type="error" message={actionError} onDismiss={() => setActionError(null)} dismissible />}
      {error && <Alert type="error" title="Error cargando datos" message={error instanceof Error ? error.message : 'Error desconocido'} />}

      <Tabs
        tabs={[
          { id: 'plans', label: 'Planes de membresía', count: plans.length },
          { id: 'memberships', label: 'Suscripciones de clientes', count: allMemberships.length },
        ]}
        activeTab={activeTab}
        onChange={(tabId: string) => setActiveTab(tabId as 'plans' | 'memberships')}
        ariaLabel="Secciones de membresías"
      />

      <TabPanel id="plans" activeTab={activeTab}>
        <TableContainer
          data={plans}
          loading={clientsLoading || plansError !== undefined}
          columns={planColumns}
          rowKey="id"
          emptyState={{
            icon: <span aria-hidden="true">📦</span>,
            title: 'No hay planes de membresía disponibles.',
          }}
        />
      </TabPanel>

      <TabPanel id="memberships" activeTab={activeTab}>
        <TableContainer
          data={allMemberships}
          loading={clientsLoading || membershipsQueries.some(q => q.isLoading)}
          columns={membershipColumns}
          rowKey="id"
          emptyState={{
            icon: <span aria-hidden="true">💳</span>,
            title: 'No hay suscripciones de clientes registradas.',
          }}
        />
      </TabPanel>

      <Modal
        open={isCheckInOpen}
        onClose={() => setIsCheckInOpen(false)}
        title="Control de Acceso: Registrar Check-In"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsCheckInOpen(false)}>Cancelar</Button>
            <Button variant="primary" disabled={checkInMutation.isPending} onClick={handleCheckInSubmit}>
              {checkInMutation.isPending ? 'Registrando...' : 'Registrar Ingreso'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleCheckInSubmit}>
          <div className="modal-body">
            {actionError && isCheckInOpen && <Alert type="error" message={actionError} onDismiss={() => setActionError(null)} dismissible />}
            <FormField
              label="Seleccione el Socio *"
              type="select"
              id="checkin-client"
              value={String(selectedClientId)}
              onChange={(value) => setSelectedClientId(Number(value) || '')}
              options={allClients.map(c => ({ value: String(c.id), label: `${c.firstName} ${c.lastName} - DNI: ${c.dni}` }))}
              emptyOptionLabel="-- Seleccionar socio --"
              required
            />
          </div>
        </form>
      </Modal>

      <Modal
        open={isAssignOpen}
        onClose={() => setIsAssignOpen(false)}
        title="Asignar Membresía a Socio"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsAssignOpen(false)}>Cancelar</Button>
            <Button variant="primary" disabled={createMembershipMutation.isPending} onClick={handleAssignSubmit}>
              {createMembershipMutation.isPending ? 'Activando...' : 'Activar Membresía'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleAssignSubmit}>
          <div className="modal-body">
            {actionError && isAssignOpen && <Alert type="error" message={actionError} onDismiss={() => setActionError(null)} dismissible />}
            <FormField
              label="Seleccione el Socio *"
              type="select"
              id="assign-client"
              value={String(selectedClientId)}
              onChange={(value) => setSelectedClientId(Number(value) || '')}
              options={allClients.map(c => ({ value: String(c.id), label: `${c.firstName} ${c.lastName} - DNI: ${c.dni}` }))}
              emptyOptionLabel="-- Seleccionar socio --"
              required
            />
            <FormField
              label="Seleccione el Plan *"
              type="select"
              id="assign-plan"
              value={String(selectedPlanId)}
              onChange={(value) => setSelectedPlanId(Number(value) || '')}
              options={plans.map(p => ({ value: String(p.id), label: `${p.name} - $${Number(p.price).toFixed(2)} (${p.durationDays} días)` }))}
              emptyOptionLabel="-- Seleccionar plan --"
              required
            />
          </div>
        </form>
      </Modal>
    </div>
  )
}