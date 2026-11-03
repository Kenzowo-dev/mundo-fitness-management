import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import MemberPortal from '@/pages/member/MemberPortal';
import { api } from '@/api/client';
import * as authModule from '@/context/useAuth';

const memberUser = {
  id: 42,
  email: 'member@example.test',
  firstName: 'Socio',
  lastName: 'Prueba',
  role: 'member',
  isActive: true,
  emailVerified: true,
  createdAt: '2026-09-01T00:00:00.000Z',
  updatedAt: '2026-09-01T00:00:00.000Z',
};

const memberClient = {
  id: 12,
  userId: memberUser.id,
  dni: '12345678',
  firstName: 'Socio',
  lastName: 'Prueba',
  email: memberUser.email,
  phone: '+51987654321',
  address: 'Calle Uno 123',
  status: 'active',
  joinedAt: '2026-09-01',
  createdAt: '2026-09-01T00:00:00.000Z',
  updatedAt: '2026-09-01T00:00:00.000Z',
};

function renderPortal() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter><MemberPortal /></BrowserRouter>
    </QueryClientProvider>,
  );
}

describe('MemberPortal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.history.replaceState({}, '', '/portal');
    vi.spyOn(authModule, 'useAuth').mockReturnValue({
      user: memberUser,
      isLoading: false,
      isAuthenticated: true,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
      updateUser: vi.fn(),
    } as ReturnType<typeof authModule.useAuth>);
    vi.spyOn(api, 'getClientByUserId').mockResolvedValue(memberClient);
    vi.spyOn(api, 'getClientMemberships').mockResolvedValue([]);
    vi.spyOn(api, 'getMembershipPlans').mockResolvedValue([]);
    vi.spyOn(api, 'getMyMembershipRenewalRequests').mockResolvedValue([]);
    vi.spyOn(api, 'getClientPayments').mockResolvedValue({
      data: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
    });
  });

  it.each(['not-a-plan', '99'])('does not submit an invalid or unavailable URL plan %s', async (planId) => {
    window.history.replaceState({}, '', `/portal?plan=${planId}`);
    vi.spyOn(api, 'getMembershipPlans').mockResolvedValue([{
      id: 3, name: 'Plan mensual', description: '', durationDays: 30, price: 50, currency: 'PEN', features: [],
      includesPersonalTrainer: false, includesClasses: false, includesSauna: false, isActive: true, sortOrder: 1,
      createdAt: '2026-09-01', updatedAt: '2026-09-01',
    }]);
    const submit = vi.spyOn(api, 'createMembershipRenewalRequest');
    renderPortal();

    const select = await screen.findByLabelText(/Plan solicitado/);
    await screen.findByRole('option', { name: /Plan mensual/ });
    expect(select).toHaveValue('');
    const form = select.closest('form');
    if (!form) throw new Error('Expected renewal form');
    fireEvent.submit(form);
    expect(await screen.findByText('Selecciona un plan para continuar.')).toBeInTheDocument();
    expect(submit).not.toHaveBeenCalled();
  });

  it('shows unavailable vigency and permits retry after a membership query fails', async () => {
    vi.spyOn(api, 'getClientMemberships').mockRejectedValueOnce(new Error('Network unavailable')).mockResolvedValue([]);
    renderPortal();

    expect(await screen.findByRole('heading', { name: 'Vigencia no disponible' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Sin membresía vigente' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar vigencia' }));
    expect(await screen.findByRole('heading', { name: 'Sin membresía vigente' })).toBeInTheDocument();
    expect(api.getClientMemberships).toHaveBeenCalledTimes(2);
  });

  it('lets a member update contact fields from their own portal', async () => {
    vi.spyOn(api, 'updateOwnClientProfile').mockResolvedValue({ ...memberClient, phone: '+51999999999' });
    renderPortal();

    fireEvent.click(await screen.findByRole('button', { name: 'Actualizar datos' }));
    const phoneField = screen.getByLabelText('Teléfono', { exact: true });
    fireEvent.change(phoneField, { target: { value: '+51999999999' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar datos' }));

    await waitFor(() => expect(api.updateOwnClientProfile).toHaveBeenCalledWith(42, expect.objectContaining({ phone: '+51999999999' })));
    expect(await screen.findByRole('status')).toHaveTextContent('Tus datos de contacto se actualizaron.');
    expect(screen.queryByLabelText('Documento')).not.toBeInTheDocument();
  });

  it('submits a renewal request for the selected plan without activating a membership', async () => {
    vi.spyOn(api, 'getMembershipPlans').mockResolvedValue([{
      id: 3, name: 'Plan mensual', description: '', durationDays: 30, price: 50, currency: 'PEN', features: [],
      includesPersonalTrainer: false, includesClasses: false, includesSauna: false, isActive: true, sortOrder: 1,
      createdAt: '2026-09-01', updatedAt: '2026-09-01',
    }]);
    vi.spyOn(api, 'createMembershipRenewalRequest').mockResolvedValue({ id: 7 });
    const createMembershipSpy = vi.spyOn(api, 'createMembership');
    renderPortal();

    fireEvent.change(await screen.findByLabelText(/Plan solicitado/), { target: { value: '3' } });
    fireEvent.change(screen.getByLabelText('Comentario para recepción (opcional)'), { target: { value: 'Prefiero pagar en recepción' } });
    fireEvent.click(screen.getByRole('button', { name: 'Solicitar renovación' }));

    await waitFor(() => expect(api.createMembershipRenewalRequest).toHaveBeenCalledWith({ planId: 3, memberNote: 'Prefiero pagar en recepción' }));
    expect(await screen.findByRole('status')).toHaveTextContent('Solicitud enviada');
    expect(createMembershipSpy).not.toHaveBeenCalled();
  });
});
