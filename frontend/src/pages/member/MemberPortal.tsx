import { useState, type FormEvent, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { api } from '../../api/client'
import { useAuth } from '../../context/useAuth'
import { useCreateMembershipRenewalRequest, useMyMembershipRenewalRequests, useUpdateOwnClientProfile } from '../../hooks/useApi'
import type { Client, ClientMembership, MembershipPlan, Payment } from '../../types/api'
import Alert from '../../components/Alert'
import Button from '../../components/Button'
import FormField from '../../components/FormField'
import Skeleton from '../../components/Skeleton'
import '@/styles/dashboard/MemberPortal.css'

type ContactDetails = Pick<Client, 'phone' | 'address' | 'emergencyContactName' | 'emergencyContactPhone'>

function formatDate(value?: string) {
  if (!value) return 'Sin fecha'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return 'Fecha no disponible'
  return new Intl.DateTimeFormat('es-PE', { dateStyle: 'long' }).format(parsed)
}

function formatMoney(amount: number, currency: string) {
  try { return new Intl.NumberFormat('es-PE', { style: 'currency', currency }).format(amount) }
  catch { return `${currency} ${amount.toFixed(2)}` }
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    active: 'Activa', expired: 'Vencida', cancelled: 'Cancelada', completed: 'Pagado', pending: 'Pendiente',
    failed: 'Fallido', refunded: 'Reembolsado', contacted: 'En atención', closed: 'Cerrada',
  }
  return labels[status] ?? status
}

function SectionSkeleton({ rows = 2 }: { rows?: number }) {
  return <div className="member-skeleton-list" aria-hidden="true">{Array.from({ length: rows }, (_, index) => <Skeleton key={index} height="44px" />)}</div>
}

function PortalSection({ id, title, children, action }: { id: string; title: string; children: ReactNode; action?: ReactNode }) {
  return <section className="member-card" aria-labelledby={id}><header className="member-section-header"><h2 id={id}>{title}</h2>{action}</header>{children}</section>
}

export default function MemberPortal() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [profileForm, setProfileForm] = useState<ContactDetails>({ phone: '', address: '', emergencyContactName: '', emergencyContactPhone: '' })
  const [profileMessage, setProfileMessage] = useState<string | null>(null)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [renewalPlanId, setRenewalPlanId] = useState('')
  const [renewalNote, setRenewalNote] = useState('')
  const [renewalMessage, setRenewalMessage] = useState<string | null>(null)
  const [renewalError, setRenewalError] = useState<string | null>(null)

  const clientQuery = useQuery<Client>({
    queryKey: ['member-portal', 'client', user?.id],
    queryFn: () => api.getClientByUserId(user!.id),
    enabled: !!user?.id,
    retry: false,
  })
  const clientId = clientQuery.data?.id
  const updateProfileMutation = useUpdateOwnClientProfile(user?.id)
  const membershipsQuery = useQuery<ClientMembership[]>({
    queryKey: ['member-portal', 'memberships', clientId],
    queryFn: () => api.getClientMemberships(clientId!),
    enabled: !!clientId,
  })
  const plansQuery = useQuery<MembershipPlan[]>({
    queryKey: ['member-portal', 'plans'],
    queryFn: () => api.getMembershipPlans(true),
  })
  const renewalRequestsQuery = useMyMembershipRenewalRequests()
  const createRenewalRequest = useCreateMembershipRenewalRequest()
  const paymentsQuery = useQuery<{ data: Payment[] }>({
    queryKey: ['member-portal', 'payments', clientId],
    queryFn: () => api.getClientPayments(clientId!),
    enabled: !!clientId,
  })

  const today = new Date().toISOString().slice(0, 10)
  const activeMembership = membershipsQuery.data?.find((membership) =>
    membership.status === 'active' && membership.startDate.slice(0, 10) <= today && membership.endDate.slice(0, 10) >= today,
  )
  const openRenewalRequest = renewalRequestsQuery.data?.find((request) => request.status !== 'closed')

  const submitRenewalRequest = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setRenewalError(null)
    setRenewalMessage(null)
    if (!renewalPlanId) { setRenewalError('Selecciona un plan para continuar.'); return }
    try {
      await createRenewalRequest.mutateAsync({ planId: Number(renewalPlanId), memberNote: renewalNote.trim() || undefined })
      setRenewalPlanId('')
      setRenewalNote('')
      setRenewalMessage('Solicitud enviada. Recepción se pondrá en contacto contigo.')
    } catch {
      setRenewalError('No pudimos enviar la solicitud. Comprueba tu conexión e inténtalo de nuevo.')
    }
  }

  const beginProfileEdit = () => {
    if (!clientQuery.data) return
    setProfileForm({
      phone: clientQuery.data.phone ?? '',
      address: clientQuery.data.address ?? '',
      emergencyContactName: clientQuery.data.emergencyContactName ?? '',
      emergencyContactPhone: clientQuery.data.emergencyContactPhone ?? '',
    })
    setProfileMessage(null)
    setProfileError(null)
    setIsEditingProfile(true)
  }

  const saveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setProfileError(null)
    setProfileMessage(null)
    try {
      await updateProfileMutation.mutateAsync(profileForm)
      setIsEditingProfile(false)
      setProfileMessage('Tus datos de contacto se actualizaron.')
    } catch {
      setProfileError('No pudimos actualizar tus datos. Comprueba tu conexión e inténtalo de nuevo.')
    }
  }

  return (
    <main className="member-portal">
      <header className="member-portal-header">
        <div>
          <p className="member-eyebrow">MUNDO FITNESS · PORTAL DEL SOCIO</p>
          <h1>Hola, {user?.firstName}</h1>
          <p>Consulta tu membresía y mantén tus datos al día.</p>
        </div>
        <Button type="button" variant="secondary" onClick={() => { logout(); navigate('/') }}>Cerrar sesión</Button>
      </header>

      {clientQuery.isLoading && <section className="member-card" aria-label="Cargando tu perfil" aria-busy="true"><SectionSkeleton rows={3} /></section>}
      {clientQuery.isError && (
        <section className="member-card" aria-label="Error al cargar el perfil">
          <Alert type="error" title="No pudimos cargar tu perfil" message="Vuelve a intentarlo. Si el problema continúa, contacta con recepción para revisar tu cuenta." />
          <Button variant="secondary" onClick={() => void clientQuery.refetch()}>Volver a intentar</Button>
        </section>
      )}

      {clientQuery.data && (
        <>
          <section className="member-card membership-status" aria-labelledby="membership-heading" aria-busy={membershipsQuery.isLoading}>
            <div className="membership-summary">
              <p className="member-eyebrow">TU MEMBRESÍA</p>
              <h2 id="membership-heading">{membershipsQuery.isLoading ? 'Consultando vigencia…' : activeMembership?.plan?.name ?? 'Sin membresía vigente'}</h2>
              {membershipsQuery.isLoading && <Skeleton className="membership-status-skeleton" height="18px" width="55%" />}
              {activeMembership && <p>Válida hasta el {formatDate(activeMembership.endDate)}</p>}
              {!activeMembership && !membershipsQuery.isLoading && <p>Solicita una renovación y recepción te ayudará a activarla.</p>}
            </div>
            <span className={`membership-badge ${membershipsQuery.isLoading ? 'is-loading' : activeMembership ? 'is-active' : 'is-inactive'}`}>
              {membershipsQuery.isLoading ? 'Consultando' : activeMembership ? 'Vigente' : 'Sin vigencia'}
            </span>
          </section>

          <PortalSection id="profile-heading" title="Mis datos" action={!isEditingProfile && <Button type="button" variant="secondary" onClick={beginProfileEdit}>Actualizar datos</Button>}>
            {profileMessage && <Alert type="success" message={profileMessage} dismissible onDismiss={() => setProfileMessage(null)} />}
            {profileError && <Alert type="error" message={profileError} dismissible onDismiss={() => setProfileError(null)} />}
            {isEditingProfile ? (
              <form className="member-profile-form" onSubmit={saveProfile}>
                <FormField id="member-phone" name="phone" label="Teléfono" type="tel" maxLength={20} value={profileForm.phone ?? ''} onChange={(phone) => setProfileForm((current) => ({ ...current, phone }))} autoComplete="tel" />
                <FormField id="member-address" name="address" label="Dirección" value={profileForm.address ?? ''} onChange={(address) => setProfileForm((current) => ({ ...current, address }))} autoComplete="street-address" />
                <FormField id="emergency-name" name="emergencyContactName" label="Nombre de contacto de emergencia" maxLength={100} value={profileForm.emergencyContactName ?? ''} onChange={(emergencyContactName) => setProfileForm((current) => ({ ...current, emergencyContactName }))} />
                <FormField id="emergency-phone" name="emergencyContactPhone" label="Teléfono de contacto de emergencia" type="tel" maxLength={20} value={profileForm.emergencyContactPhone ?? ''} onChange={(emergencyContactPhone) => setProfileForm((current) => ({ ...current, emergencyContactPhone }))} />
                <div className="member-profile-actions">
                  <Button type="button" variant="secondary" onClick={() => setIsEditingProfile(false)}>Cancelar</Button>
                  <Button type="submit" loading={updateProfileMutation.isPending}>Guardar datos</Button>
                </div>
              </form>
            ) : (
              <dl className="member-details">
                <div><dt>Nombre</dt><dd>{clientQuery.data.firstName} {clientQuery.data.lastName}</dd></div>
                <div><dt>Correo</dt><dd>{clientQuery.data.email || user?.email}</dd></div>
                <div><dt>Documento</dt><dd>{clientQuery.data.dni}</dd></div>
                <div><dt>Teléfono</dt><dd>{clientQuery.data.phone || 'No registrado'}</dd></div>
                <div><dt>Dirección</dt><dd>{clientQuery.data.address || 'No registrada'}</dd></div>
                <div><dt>Contacto de emergencia</dt><dd>{clientQuery.data.emergencyContactName || 'No registrado'}</dd></div>
                <div><dt>Teléfono de emergencia</dt><dd>{clientQuery.data.emergencyContactPhone || 'No registrado'}</dd></div>
              </dl>
            )}
          </PortalSection>

          <PortalSection id="history-heading" title="Historial de membresías">
            {membershipsQuery.isLoading && <SectionSkeleton rows={2} />}
            {membershipsQuery.isError && <Alert type="error" message="No pudimos cargar tu historial." />}
            {membershipsQuery.isError && <Button variant="secondary" onClick={() => void membershipsQuery.refetch()}>Reintentar</Button>}
            {!membershipsQuery.isLoading && !membershipsQuery.isError && !membershipsQuery.data?.length && <p className="member-muted">Aún no tienes membresías registradas.</p>}
            {!!membershipsQuery.data?.length && <ul className="member-membership-list">{membershipsQuery.data.map((membership) => (
              <li key={membership.id}><strong>{membership.plan?.name ?? 'Plan de membresía'}</strong><span>{formatDate(membership.startDate)} – {formatDate(membership.endDate)}</span><span>{statusLabel(membership.status)}</span></li>
            ))}</ul>}
          </PortalSection>

          <PortalSection id="plans-heading" title="Planes y renovaciones">
            {plansQuery.isLoading && <SectionSkeleton rows={2} />}
            {plansQuery.isError && <Alert type="error" message="No pudimos cargar los planes." />}
            {plansQuery.isError && <Button variant="secondary" onClick={() => void plansQuery.refetch()}>Reintentar</Button>}
            {!plansQuery.isLoading && !plansQuery.isError && !plansQuery.data?.length && <p className="member-muted">No hay planes disponibles en este momento. Consulta en recepción.</p>}
            {!!plansQuery.data?.length && <ul className="member-membership-list">{plansQuery.data.map((plan) => (
              <li key={plan.id}><strong>{plan.name}</strong><span>{plan.durationDays} días · {formatMoney(plan.price, plan.currency)}</span><span>{plan.description || 'Consulta condiciones en recepción'}</span></li>
            ))}</ul>}
            <p className="member-muted">La solicitud no procesa pagos ni activa la membresía. Recepción confirmará los detalles.</p>
            {renewalMessage && <Alert type="success" message={renewalMessage} dismissible onDismiss={() => setRenewalMessage(null)} />}
            {renewalError && <Alert type="error" message={renewalError} dismissible onDismiss={() => setRenewalError(null)} />}
            {renewalRequestsQuery.isError && <Alert type="error" message="No pudimos cargar tus solicitudes." />}
            {renewalRequestsQuery.isError && <Button variant="secondary" onClick={() => void renewalRequestsQuery.refetch()}>Reintentar solicitudes</Button>}
            {renewalRequestsQuery.isLoading ? <SectionSkeleton rows={1} /> : openRenewalRequest ? (
              <p className="member-request-status" role="status">Solicitud de {openRenewalRequest.planName}: {statusLabel(openRenewalRequest.status)}.</p>
            ) : (
              <form className="member-profile-form renewal-request-form" onSubmit={submitRenewalRequest}>
                <FormField id="renewal-plan" name="planId" label="Plan solicitado" type="select" value={renewalPlanId} onChange={setRenewalPlanId} required emptyOptionLabel="Selecciona un plan" options={(plansQuery.data ?? []).map((plan) => ({ value: String(plan.id), label: `${plan.name} · ${formatMoney(plan.price, plan.currency)}` }))} />
                <FormField id="renewal-note" name="memberNote" label="Comentario para recepción (opcional)" maxLength={500} value={renewalNote} onChange={setRenewalNote} />
                <div className="member-profile-actions"><Button type="submit" loading={createRenewalRequest.isPending} disabled={!plansQuery.data?.length || plansQuery.isLoading || renewalRequestsQuery.isError}>Solicitar renovación</Button></div>
              </form>
            )}
            {!!renewalRequestsQuery.data?.length && <ul className="member-membership-list member-request-history" aria-label="Historial de solicitudes">{renewalRequestsQuery.data.map((request) => (
              <li key={request.id}><strong>{request.planName}</strong><span>{formatDate(request.requestedAt)}</span><span>{statusLabel(request.status)}</span></li>
            ))}</ul>}
          </PortalSection>

          <PortalSection id="payments-heading" title="Mis pagos">
            {paymentsQuery.isLoading && <SectionSkeleton rows={2} />}
            {paymentsQuery.isError && <Alert type="error" message="No pudimos cargar tus pagos." />}
            {paymentsQuery.isError && <Button variant="secondary" onClick={() => void paymentsQuery.refetch()}>Reintentar</Button>}
            {!paymentsQuery.isLoading && !paymentsQuery.isError && !paymentsQuery.data?.data.length && <p className="member-muted">Aún no tienes pagos registrados.</p>}
            {!!paymentsQuery.data?.data.length && <ul className="member-membership-list">{paymentsQuery.data.data.map((payment) => (
              <li key={payment.id}><strong>{formatMoney(payment.amount, payment.currency)}</strong><span>{formatDate(payment.paidAt || payment.createdAt)}</span><span>{statusLabel(payment.status)}</span></li>
            ))}</ul>}
          </PortalSection>
        </>
      )}
    </main>
  )
}
