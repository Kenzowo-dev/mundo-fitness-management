import { useState, useMemo } from 'react'
import { CalendarDays, CircleCheck, Clock3, Plus, ScanLine, UserRoundCheck } from 'lucide'
import MorphIcon from '../../components/MorphIcon'
import { useClients, useMembershipPlans, useAllMemberships, useCreateMembership, useCheckIn, useMembershipRenewalRequests, useUpdateMembershipRenewalRequest, useCreateMembershipPlan, useUpdateMembershipPlan } from '../../hooks/useApi'
import type { Client, ClientMembership, CreateMembershipPlanInput, MembershipPlan, MembershipRenewalRequest } from '../../types/api'
import StatusBadge from '../../components/StatusBadge'
import Button from '../../components/Button'
import FormField from '../../components/FormField'
import Modal from '../../components/Modal'
import Alert from '../../components/Alert'
import Tabs, { TabPanel } from '../../components/Tabs'
import TableContainer from '../../components/TableContainer'
import PageHeader from '../../components/PageHeader'
import PlanFormModal from '../../components/PlanFormModal'
import { useAuth } from '../../context/useAuth'
import '../../styles/dashboard/MembershipsPage.css'

const dateKey = (date: Date) => [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-')

function daysFromToday(value: string) {
  const [year, month, day] = value.slice(0, 10).split('-').map(Number)
  if (!year || !month || !day) return Number.POSITIVE_INFINITY
  const target = Date.UTC(year, month - 1, day)
  const today = new Date()
  const current = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
  return Math.round((target - current) / 86_400_000)
}

function displayDate(value: string) {
  const [year, month, day] = value.slice(0, 10).split('-').map(Number)
  if (!year || !month || !day) return '—'
  return new Intl.DateTimeFormat('es-PE', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(year, month - 1, day))
}

export default function MembershipsPage() {
  const [activeTab, setActiveTab] = useState<'plans' | 'memberships' | 'requests'>('plans')
  const [isCheckInOpen, setIsCheckInOpen] = useState(false)
  const [isAssignOpen, setIsAssignOpen] = useState(false)
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false)
  const [editingPlan, setEditingPlan] = useState<MembershipPlan | null>(null)
  const [selectedClientId, setSelectedClientId] = useState<number | ''>('')
  const [selectedPlanId, setSelectedPlanId] = useState<number | ''>('')
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const { data: clientsData, error: clientsError } = useClients(1, 100)
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const { data: plansData, isLoading: plansLoading, error: plansError } = useMembershipPlans(!isAdmin)

  const allClients: Client[] = useMemo(() => clientsData?.data ?? [], [clientsData?.data])
  const clientNames = useMemo(() => {
    const map: Record<number, string> = {}
    allClients.forEach((c) => { map[c.id] = `${c.firstName} ${c.lastName} (${c.dni})` })
    return map
  }, [allClients])

  const membershipsQuery = useAllMemberships()
  const allMemberships: ClientMembership[] = useMemo(() => membershipsQuery.data ?? [], [membershipsQuery.data])

  const plans: MembershipPlan[] = useMemo(() => plansData ?? [], [plansData])

  const createMembershipMutation = useCreateMembership()
  const checkInMutation = useCheckIn()
  const renewalRequestsQuery = useMembershipRenewalRequests()
  const updateRenewalRequest = useUpdateMembershipRenewalRequest()
  const createPlanMutation = useCreateMembershipPlan()
  const updatePlanMutation = useUpdateMembershipPlan()
  const error = clientsError || plansError || membershipsQuery.error || renewalRequestsQuery.error

  const todayKey = dateKey(new Date())
  const activeMemberships = allMemberships.filter((membership) => membership.status === 'active' && membership.startDate.slice(0, 10) <= todayKey && membership.endDate.slice(0, 10) >= todayKey)
  const endingSoon = activeMemberships.filter((membership) => daysFromToday(membership.endDate) <= 7)
  const openRenewalRequests = renewalRequestsQuery.data?.filter((request) => request.status !== 'closed').length ?? 0

  const handleCheckInSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedClientId) {
      setActionError('Selecciona un socio para registrar el ingreso.')
      return
    }

    try {
      setActionError(null)
      const clientMem = allMemberships.find((m) =>
        m.clientId === Number(selectedClientId) &&
        m.status === 'active' &&
        m.startDate.slice(0, 10) <= todayKey &&
        m.endDate.slice(0, 10) >= todayKey
      )
      if (!clientMem) {
        setActionError('Este socio no tiene una membresía vigente. Asigna o renueva una membresía antes de registrar el ingreso.')
        return
      }

      await checkInMutation.mutateAsync({ clientId: Number(selectedClientId), clientMembershipId: clientMem.id })
      setActionSuccess('Ingreso registrado. El acceso al gimnasio está habilitado.')
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
      setActionError('Selecciona un socio y un plan de membresía.')
      return
    }

    try {
      setActionError(null)
      const selPlan = plans.find((p) => p.id === Number(selectedPlanId))
      const duration = selPlan?.durationDays || 30
      const start = new Date()
      const startDate = dateKey(start)
      const endDateObj = new Date()
      endDateObj.setDate(endDateObj.getDate() + duration)
      const endDate = dateKey(endDateObj)

      await createMembershipMutation.mutateAsync({
        clientId: Number(selectedClientId),
        planId: Number(selectedPlanId),
        startDate,
        endDate,
        status: 'active',
        autoRenew: true,
      })

      setActionSuccess('Membresía asignada correctamente al socio.')
      setIsAssignOpen(false)
      setSelectedClientId('')
      setSelectedPlanId('')
      setTimeout(() => setActionSuccess(null), 4000)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Error al asignar la membresía')
    }
  }

  const handleSavePlan = async (data: CreateMembershipPlanInput) => {
    try {
      setActionError(null)
      if (editingPlan) {
        await updatePlanMutation.mutateAsync({ id: editingPlan.id, data })
        setActionSuccess('Plan actualizado correctamente.')
      } else {
        await createPlanMutation.mutateAsync(data)
        setActionSuccess('Plan creado correctamente.')
      }
      setIsPlanModalOpen(false)
      setEditingPlan(null)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'No se pudo guardar el plan.')
    }
  }

  const handleTogglePlan = async (plan: MembershipPlan) => {
    try {
      setActionError(null)
      await updatePlanMutation.mutateAsync({ id: plan.id, data: { isActive: !plan.isActive } })
      setActionSuccess(plan.isActive ? 'Plan desactivado. Las membresías existentes se conservan.' : 'Plan activado correctamente.')
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'No se pudo cambiar el estado del plan.')
    }
  }

  const formatPrice = (price: number | string, currency: string) => new Intl.NumberFormat('es-PE', { style: 'currency', currency }).format(Number(price))

  const planColumns = [
    { key: 'name', header: 'Nombre' },
    { key: 'durationDays', header: 'Duración', render: (plan: MembershipPlan) => `${plan.durationDays} días` },
    { key: 'price', header: 'Precio', render: (plan: MembershipPlan) => formatPrice(plan.price, plan.currency) },
    { key: 'maxVisitsPerWeek', header: 'Visitas/semana', render: (plan: MembershipPlan) => plan.maxVisitsPerWeek || 'Ilimitado' },
    { key: 'includesClasses', header: 'Clases', render: (plan: MembershipPlan) => <span aria-label={plan.includesClasses ? 'Incluidas' : 'No incluidas'}>{plan.includesClasses ? 'Sí' : 'No'}</span> },
    { key: 'includesSauna', header: 'Sauna', render: (plan: MembershipPlan) => <span aria-label={plan.includesSauna ? 'Incluida' : 'No incluida'}>{plan.includesSauna ? 'Sí' : 'No'}</span> },
    { key: 'isActive', header: 'Estado', render: (plan: MembershipPlan) => <StatusBadge status={plan.isActive ? 'active' : 'inactive'} /> },
    ...(isAdmin ? [{ key: 'actions', header: 'Acciones', render: (plan: MembershipPlan) => <div className="renewal-request-actions"><Button variant="secondary" onClick={() => { setEditingPlan(plan); setActionError(null); setIsPlanModalOpen(true) }}>Editar</Button><Button variant="secondary" disabled={updatePlanMutation.isPending} onClick={() => void handleTogglePlan(plan)}>{plan.isActive ? 'Desactivar' : 'Activar'}</Button></div> }] : []),
  ]

  const membershipColumns = [
    { key: 'clientName', header: 'Socio', render: (m: ClientMembership) => <strong>{clientNames[m.clientId] || `Socio #${m.clientId}`}</strong> },
    { key: 'planName', header: 'Plan Adquirido', render: (m: ClientMembership) => m.plan?.name || 'Plan Estándar' },
    { key: 'startDate', header: 'Inicio', render: (m: ClientMembership) => displayDate(m.startDate) },
    { key: 'endDate', header: 'Vence', render: (m: ClientMembership) => displayDate(m.endDate) },
    { key: 'status', header: 'Estado', render: (m: ClientMembership) => <StatusBadge status={m.status} /> },
    { key: 'autoRenew', header: 'Auto-renovar', render: (m: ClientMembership) => m.autoRenew ? 'Sí' : 'No' },
  ]

  const renewalRequestColumns = [
    { key: 'clientName', header: 'Socio', render: (request: MembershipRenewalRequest) => <><strong>{request.clientName || `Socio #${request.clientId}`}</strong><br />{request.clientEmail || request.clientDni}</> },
    { key: 'planName', header: 'Plan solicitado' },
    { key: 'requestedAt', header: 'Fecha', render: (request: MembershipRenewalRequest) => new Date(request.requestedAt).toLocaleString('es-PE') },
    { key: 'memberNote', header: 'Comentario', render: (request: MembershipRenewalRequest) => request.memberNote || '—' },
    { key: 'status', header: 'Estado', render: (request: MembershipRenewalRequest) => <StatusBadge status={request.status === 'pending' ? 'pending' : request.status === 'contacted' ? 'active' : 'inactive'} label={request.status === 'pending' ? 'Pendiente' : request.status === 'contacted' ? 'Contactada' : 'Cerrada'} /> },
    { key: 'actions', header: 'Acciones', render: (request: MembershipRenewalRequest) => request.status === 'closed' ? '—' : <div className="renewal-request-actions"><Button variant="secondary" disabled={updateRenewalRequest.isPending || request.status === 'contacted'} onClick={() => updateRenewalRequest.mutate({ id: request.id, data: { status: 'contacted' } })}>Marcar contactada</Button><Button variant="secondary" disabled={updateRenewalRequest.isPending} onClick={() => updateRenewalRequest.mutate({ id: request.id, data: { status: 'closed' } })}>Cerrar</Button></div> },
  ]

  return (
    <div className="memberships-page">
      <PageHeader
        title="Membresías"
        description="Planes, vigencias y control de acceso de los socios."
        actions={[
          {
            label: 'Registrar ingreso',
            onClick: () => { setActionError(null); setIsCheckInOpen(true) },
            ariaLabel: 'Registrar ingreso de socio',
            variant: 'primary',
            icon: <MorphIcon icon={ScanLine} size={18} aria-hidden="true" />,
          },
          {
            label: 'Asignar membresía',
            onClick: () => { setActionError(null); setIsAssignOpen(true) },
            ariaLabel: 'Asignar membresía a socio',
            variant: 'secondary',
            icon: <MorphIcon icon={Plus} size={18} aria-hidden="true" />,
          },
        ]}
      />

      <section className="membership-overview" aria-label="Resumen de membresías" aria-live="polite" aria-busy={membershipsQuery.isLoading || renewalRequestsQuery.isLoading}>
        <article className="membership-metric">
          <span className="membership-metric-icon"><MorphIcon icon={CircleCheck} size={18} aria-hidden="true" /></span>
          <div><p>Vigentes hoy</p>{membershipsQuery.isLoading ? <span className="membership-metric-skeleton" aria-label="Cargando vigencias" /> : <strong>{membershipsQuery.isError ? '—' : activeMemberships.length}</strong>}</div>
        </article>
        <article className="membership-metric">
          <span className="membership-metric-icon"><MorphIcon icon={CalendarDays} size={18} aria-hidden="true" /></span>
          <div><p>Vencen en 7 días</p>{membershipsQuery.isLoading ? <span className="membership-metric-skeleton" aria-label="Cargando vencimientos" /> : <strong>{membershipsQuery.isError ? '—' : endingSoon.length}</strong>}</div>
        </article>
        <article className="membership-metric">
          <span className="membership-metric-icon"><MorphIcon icon={Clock3} size={18} aria-hidden="true" /></span>
          <div><p>Solicitudes por atender</p>{renewalRequestsQuery.isLoading ? <span className="membership-metric-skeleton" aria-label="Cargando solicitudes" /> : <strong>{renewalRequestsQuery.isError ? '—' : openRenewalRequests}</strong>}</div>
        </article>
      </section>

      {actionSuccess && <Alert type="success" message={actionSuccess} onDismiss={() => setActionSuccess(null)} dismissible />}
      {actionError && !isCheckInOpen && !isAssignOpen && !isPlanModalOpen && (
        <Alert type="error" message={actionError} onDismiss={() => setActionError(null)} dismissible />
      )}
      {error && <Alert type="error" title="Error cargando datos" message={error instanceof Error ? error.message : 'Error desconocido'} />}

      <Tabs
        tabs={[
          { id: 'plans', label: 'Planes', count: plans.length },
          { id: 'memberships', label: 'Membresías', count: allMemberships.length },
          { id: 'requests', label: 'Solicitudes web', count: openRenewalRequests },
        ]}
        activeTab={activeTab}
        onChange={(tabId: string) => setActiveTab(tabId as 'plans' | 'memberships' | 'requests')}
        ariaLabel="Secciones de membresías"
      />

      <TabPanel id="plans" activeTab={activeTab}>
        <div className="membership-section-heading">
          <div><h2>Planes disponibles</h2><p>Define precio, duración y servicios incluidos en cada opción.</p></div>
          {isAdmin && <Button variant="secondary" onClick={() => { setEditingPlan(null); setActionError(null); setIsPlanModalOpen(true) }}><MorphIcon icon={Plus} size={18} aria-hidden="true" />Crear plan</Button>}
        </div>
        {isAdmin && <p className="membership-note">Al desactivar un plan se detienen nuevas asignaciones; las membresías existentes se conservan.</p>}
        <TableContainer
          data={plans}
          loading={plansLoading}
          columns={planColumns}
          rowKey="id"
          emptyState={{
            icon: <MorphIcon icon={UserRoundCheck} size={24} aria-hidden="true" />,
            title: 'Aún no hay planes',
            description: isAdmin ? 'Crea el primer plan para que recepción pueda asignar membresías.' : 'El equipo administrador todavía no ha publicado planes.',
            ...(isAdmin ? { action: { label: 'Crear plan', onClick: () => { setEditingPlan(null); setActionError(null); setIsPlanModalOpen(true) }, variant: 'primary' as const } } : {}),
          }}
        />
      </TabPanel>

      <TabPanel id="memberships" activeTab={activeTab}>
        <TableContainer
          data={allMemberships}
          loading={membershipsQuery.isLoading}
          columns={membershipColumns}
          rowKey="id"
          emptyState={{
            icon: <MorphIcon icon={CalendarDays} size={24} aria-hidden="true" />,
            title: 'Aún no hay membresías asignadas',
            description: 'Asigna un plan a un socio para iniciar su vigencia.',
            action: { label: 'Asignar membresía', onClick: () => { setActionError(null); setIsAssignOpen(true) }, variant: 'primary' },
          }}
        />
      </TabPanel>

      <TabPanel id="requests" activeTab={activeTab}>
        <div className="membership-section-heading">
          <div><h2>Solicitudes de renovación</h2><p>Da seguimiento a lo que los socios enviaron desde su portal.</p></div>
        </div>
        <p className="membership-note">Marcar una solicitud como atendida registra el seguimiento de recepción. La renovación y el pago se gestionan por separado.</p>
        {renewalRequestsQuery.isError && <Alert type="error" message="No se pudieron cargar las solicitudes web." />}
        {updateRenewalRequest.isError && <Alert type="error" message={updateRenewalRequest.error instanceof Error ? updateRenewalRequest.error.message : 'No se pudo actualizar la solicitud.'} />}
        <TableContainer data={renewalRequestsQuery.data ?? []} loading={renewalRequestsQuery.isLoading} columns={renewalRequestColumns} rowKey="id" emptyState={{ icon: <MorphIcon icon={Clock3} size={24} aria-hidden="true" />, title: 'No hay solicitudes pendientes', description: 'Las solicitudes de renovación de los socios aparecerán aquí.' }} />
      </TabPanel>

      <Modal
        open={isCheckInOpen}
        onClose={() => setIsCheckInOpen(false)}
        title="Registrar ingreso de socio"
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
        title="Asignar membresía"
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
              options={plans.filter((plan) => plan.isActive).map(p => ({ value: String(p.id), label: `${p.name} - ${formatPrice(p.price, p.currency)} (${p.durationDays} días)` }))}
              emptyOptionLabel="-- Seleccionar plan --"
              required
            />
          </div>
        </form>
      </Modal>
      {isPlanModalOpen && <PlanFormModal key={editingPlan?.id ?? 'new'} plan={editingPlan ?? undefined} isSaving={createPlanMutation.isPending || updatePlanMutation.isPending} error={actionError} onClose={() => { setIsPlanModalOpen(false); setEditingPlan(null); setActionError(null) }} onSave={handleSavePlan} />}
    </div>
  )
}
