import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { useAuth } from '../../context/useAuth';
import { useCreateMembershipRenewalRequest, useMyMembershipRenewalRequests, useUpdateOwnClientProfile } from '../../hooks/useApi';
import type { Client, ClientMembership, MembershipPlan, Payment } from '../../types/api';
import './MemberPortal.css';

type ContactDetails = Pick<Client, 'phone' | 'address' | 'emergencyContactName' | 'emergencyContactPhone'>;

function date(value?: string) {
  if (!value) return 'Sin fecha';
  return new Intl.DateTimeFormat('es-PE', { dateStyle: 'long' }).format(new Date(value));
}

export default function MemberPortal() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState<ContactDetails>({ phone: '', address: '', emergencyContactName: '', emergencyContactPhone: '' });
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const clientQuery = useQuery<Client>({
    queryKey: ['member-portal', 'client', user?.id],
    queryFn: () => api.getClientByUserId(user!.id),
    enabled: !!user?.id,
    retry: false,
  });
  const clientId = clientQuery.data?.id;
  const updateProfileMutation = useUpdateOwnClientProfile(user?.id);
  const membershipsQuery = useQuery<ClientMembership[]>({
    queryKey: ['member-portal', 'memberships', clientId],
    queryFn: () => api.getClientMemberships(clientId!) as Promise<ClientMembership[]>,
    enabled: !!clientId,
  });
  const plansQuery = useQuery<MembershipPlan[]>({
    queryKey: ['member-portal', 'plans'],
    queryFn: () => api.getMembershipPlans(true) as Promise<MembershipPlan[]>,
  });
  const renewalRequestsQuery = useMyMembershipRenewalRequests();
  const createRenewalRequest = useCreateMembershipRenewalRequest();
  const [renewalPlanId, setRenewalPlanId] = useState('');
  const [renewalNote, setRenewalNote] = useState('');
  const [renewalMessage, setRenewalMessage] = useState<string | null>(null);
  const [renewalError, setRenewalError] = useState<string | null>(null);
  const paymentsQuery = useQuery<{ data: Payment[] }>({
    queryKey: ['member-portal', 'payments', clientId],
    queryFn: () => api.getClientPayments(clientId!),
    enabled: !!clientId,
  });
  const activeMembership = membershipsQuery.data?.find((membership) => {
    const today = new Date().toISOString().slice(0, 10);
    return membership.status === 'active' && membership.startDate.slice(0, 10) <= today && membership.endDate.slice(0, 10) >= today;
  });
  const openRenewalRequest = renewalRequestsQuery.data?.find((request) => request.status !== 'closed');

  const submitRenewalRequest = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setRenewalError(null);
    setRenewalMessage(null);
    if (!renewalPlanId) { setRenewalError('Selecciona un plan para continuar.'); return; }
    try {
      await createRenewalRequest.mutateAsync({ planId: Number(renewalPlanId), memberNote: renewalNote.trim() || undefined });
      setRenewalPlanId('');
      setRenewalNote('');
      setRenewalMessage('Solicitud enviada. Recepción se pondrá en contacto contigo.');
    } catch (error) {
      setRenewalError(error instanceof Error ? error.message : 'No pudimos enviar la solicitud. Inténtalo de nuevo.');
    }
  };

  const beginProfileEdit = () => {
    if (!clientQuery.data) return;
    setProfileForm({
      phone: clientQuery.data.phone ?? '',
      address: clientQuery.data.address ?? '',
      emergencyContactName: clientQuery.data.emergencyContactName ?? '',
      emergencyContactPhone: clientQuery.data.emergencyContactPhone ?? '',
    });
    setProfileMessage(null);
    setProfileError(null);
    setIsEditingProfile(true);
  };

  const saveProfile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setProfileError(null);
    setProfileMessage(null);
    try {
      await updateProfileMutation.mutateAsync(profileForm);
      setIsEditingProfile(false);
      setProfileMessage('Tus datos de contacto se actualizaron.');
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : 'No pudimos actualizar tus datos. Inténtalo de nuevo.');
    }
  };

  return (
    <main className="member-portal">
      <header className="member-portal-header">
        <div>
          <p className="member-eyebrow">MUNDO FITNESS · PORTAL DEL SOCIO</p>
          <h1>Hola, {user?.firstName}</h1>
          <p>Consulta tu membresía y mantén tus datos al día.</p>
        </div>
        <button type="button" className="member-logout" onClick={() => { logout(); navigate('/'); }}>Cerrar sesión</button>
      </header>

      {clientQuery.isLoading && <p role="status">Cargando tu información…</p>}
      {clientQuery.isError && (
        <section className="member-card" role="alert">
          <h2>No encontramos tu perfil de socio</h2>
          <p>Tu cuenta está activa, pero todavía no tiene un perfil asociado. Contacta con recepción para completar el registro.</p>
        </section>
      )}
      {clientQuery.data && (
        <>
          <section className="member-card membership-status" aria-labelledby="membership-heading">
            <div>
              <p className="member-eyebrow">TU MEMBRESÍA</p>
              <h2 id="membership-heading">
                {membershipsQuery.isLoading ? 'Consultando vigencia…' : activeMembership?.plan?.name ?? 'Sin membresía vigente'}
              </h2>
              {activeMembership && <p>Válida hasta el {date(activeMembership.endDate)}</p>}
              {!activeMembership && !membershipsQuery.isLoading && <p>Acércate a recepción para consultar los planes y activar tu membresía.</p>}
            </div>
            <span className={`membership-badge ${activeMembership ? 'is-active' : 'is-inactive'}`}>
              {activeMembership ? 'Vigente' : 'Pendiente'}
            </span>
          </section>

          <section className="member-card" aria-labelledby="profile-heading">
            <div className="member-profile-heading">
              <h2 id="profile-heading">Mis datos</h2>
              {!isEditingProfile && <button type="button" className="member-secondary-button" onClick={beginProfileEdit}>Actualizar datos</button>}
            </div>
            {profileMessage && <p role="status" className="member-success-message">{profileMessage}</p>}
            {profileError && <p role="alert" className="member-error-message">{profileError}</p>}
            {isEditingProfile ? (
              <form className="member-profile-form" onSubmit={saveProfile}>
                <label>Teléfono<input type="tel" maxLength={20} value={profileForm.phone ?? ''} onChange={(event) => setProfileForm((current) => ({ ...current, phone: event.target.value }))} /></label>
                <label>Dirección<input type="text" value={profileForm.address ?? ''} onChange={(event) => setProfileForm((current) => ({ ...current, address: event.target.value }))} /></label>
                <label>Nombre de contacto de emergencia<input type="text" maxLength={100} value={profileForm.emergencyContactName ?? ''} onChange={(event) => setProfileForm((current) => ({ ...current, emergencyContactName: event.target.value }))} /></label>
                <label>Teléfono de contacto de emergencia<input type="tel" maxLength={20} value={profileForm.emergencyContactPhone ?? ''} onChange={(event) => setProfileForm((current) => ({ ...current, emergencyContactPhone: event.target.value }))} /></label>
                <div className="member-profile-actions">
                  <button type="button" className="member-secondary-button" onClick={() => setIsEditingProfile(false)}>Cancelar</button>
                  <button type="submit" className="member-primary-button" disabled={updateProfileMutation.isPending}>{updateProfileMutation.isPending ? 'Guardando…' : 'Guardar datos'}</button>
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
          </section>

          <section className="member-card" aria-labelledby="history-heading">
            <h2 id="history-heading">Historial de membresías</h2>
            {membershipsQuery.isLoading && <p role="status">Cargando historial…</p>}
            {membershipsQuery.isError && <p role="alert">No pudimos cargar tu historial. Inténtalo más tarde.</p>}
            {!membershipsQuery.isLoading && !membershipsQuery.isError && membershipsQuery.data?.length === 0 && <p>Aún no tienes membresías registradas.</p>}
            {!!membershipsQuery.data?.length && (
              <ul className="member-membership-list">
                {membershipsQuery.data.map((membership) => (
                  <li key={membership.id}>
                    <strong>{membership.plan?.name ?? 'Plan de membresía'}</strong>
                    <span>{date(membership.startDate)} – {date(membership.endDate)}</span>
                    <span>{membership.status === 'active' ? 'Activa' : membership.status}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section className="member-card" aria-labelledby="plans-heading">
            <h2 id="plans-heading">Planes disponibles</h2>
            {plansQuery.isLoading && <p role="status">Cargando planes…</p>}
            {plansQuery.isError && <p role="alert">No pudimos cargar los planes. Inténtalo más tarde.</p>}
            {!plansQuery.isLoading && !plansQuery.isError && plansQuery.data?.length === 0 && <p>No hay planes disponibles en este momento.</p>}
            {!!plansQuery.data?.length && (
              <ul className="member-membership-list">
                {plansQuery.data.map((plan) => (
                  <li key={plan.id}>
                    <strong>{plan.name}</strong>
                    <span>{plan.durationDays} días · {new Intl.NumberFormat('es-PE', { style: 'currency', currency: plan.currency }).format(plan.price)}</span>
                    <span>{plan.description || 'Consulta condiciones en recepción'}</span>
                  </li>
                ))}
              </ul>
            )}
            <p>Envía tu solicitud desde aquí. Recepción confirmará los detalles; este formulario no procesa pagos ni activa membresías.</p>
            {renewalMessage && <p role="status" className="member-success-message">{renewalMessage}</p>}
            {renewalError && <p role="alert" className="member-error-message">{renewalError}</p>}
            {renewalRequestsQuery.isError && <p role="alert">No pudimos cargar tus solicitudes.</p>}
            {openRenewalRequest ? (
              <p role="status">Solicitud de {openRenewalRequest.planName}: {openRenewalRequest.status === 'pending' ? 'pendiente de revisión' : 'recepción ya la está atendiendo'}.</p>
            ) : (
              <form className="member-profile-form renewal-request-form" onSubmit={submitRenewalRequest}>
                <label>Plan solicitado<select required value={renewalPlanId} onChange={(event) => setRenewalPlanId(event.target.value)}>
                  <option value="">Selecciona un plan</option>
                  {(plansQuery.data ?? []).map((plan) => <option key={plan.id} value={plan.id}>{plan.name} · {new Intl.NumberFormat('es-PE', { style: 'currency', currency: plan.currency }).format(plan.price)}</option>)}
                </select></label>
                <label>Comentario para recepción (opcional)<input maxLength={500} value={renewalNote} onChange={(event) => setRenewalNote(event.target.value)} /></label>
                <div className="member-profile-actions"><button className="member-primary-button" type="submit" disabled={createRenewalRequest.isPending || !plansQuery.data?.length}>{createRenewalRequest.isPending ? 'Enviando…' : 'Solicitar renovación'}</button></div>
              </form>
            )}
            {!!renewalRequestsQuery.data?.length && <ul className="member-membership-list" aria-label="Historial de solicitudes">
              {renewalRequestsQuery.data.map((request) => <li key={request.id}><strong>{request.planName}</strong><span>{date(request.requestedAt)}</span><span>{request.status === 'pending' ? 'Pendiente' : request.status === 'contacted' ? 'En atención' : 'Cerrada'}</span></li>)}
            </ul>}
          </section>
          <section className="member-card" aria-labelledby="payments-heading">
            <h2 id="payments-heading">Mis pagos</h2>
            {paymentsQuery.isLoading && <p role="status">Cargando pagos…</p>}
            {paymentsQuery.isError && <p role="alert">No pudimos cargar tus pagos. Inténtalo más tarde.</p>}
            {!paymentsQuery.isLoading && !paymentsQuery.isError && paymentsQuery.data?.data.length === 0 && <p>Aún no tienes pagos registrados.</p>}
            {!!paymentsQuery.data?.data.length && (
              <ul className="member-membership-list">
                {paymentsQuery.data.data.map((payment) => (
                  <li key={payment.id}>
                    <strong>{new Intl.NumberFormat('es-PE', { style: 'currency', currency: payment.currency }).format(payment.amount)}</strong>
                    <span>{date(payment.paidAt || payment.createdAt)}</span>
                    <span>{payment.status === 'completed' ? 'Pagado' : payment.status === 'pending' ? 'Pendiente' : payment.status}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </main>
  );
}
