
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import MemberProfilePage from '@/pages/member/MemberProfilePage';
import { api } from '@/api/client';
import * as authModule from '@/context/useAuth';

// Aislamos las secciones ajenas a la edición de datos personales.
vi.mock('@/components/member/MemberAvatarProfile', () => ({
  default: () => null,
}));

vi.mock('@/components/member/MemberPhysicalProfile', () => ({
  default: () => null,
}));

vi.mock('@/components/member/MemberGoals', () => ({
  default: () => null,
}));

vi.mock('@/components/member/MemberProgressCharts', () => ({
  default: () => null,
}));

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
  userId: 42,
  dni: '12345678',
  firstName: 'Socio',
  lastName: 'Prueba',
  email: 'member@example.test',
  phone: '+51987654321',
  address: 'Calle Uno 123',
  emergencyContactName: 'Contacto Prueba',
  emergencyContactPhone: '+51911111111',
  status: 'active',
  joinedAt: '2026-09-01',
  createdAt: '2026-09-01T00:00:00.000Z',
  updatedAt: '2026-09-01T00:00:00.000Z',
};

function renderProfile() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/perfil']}>
        <MemberProfilePage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('MemberProfilePage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();

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
  });

  it('allows a member to update their contact information from the profile', async () => {
    const updateProfile = vi.spyOn(api, 'updateOwnClientProfile')
      .mockResolvedValue({
        ...memberClient,
        phone: '+51999999999',
      });

    renderProfile();

    fireEvent.click(
      await screen.findByRole('button', { name: 'Actualizar datos' }),
    );

    const phoneField = screen.getByLabelText('Teléfono', {
      exact: true,
    });

    fireEvent.change(phoneField, {
      target: { value: '+51999999999' },
    });

    fireEvent.click(
      screen.getByRole('button', { name: 'Guardar datos' }),
    );

    await waitFor(() => {
      expect(updateProfile).toHaveBeenCalledWith(
        42,
        expect.objectContaining({
          phone: '+51999999999',
        }),
      );
    });

    expect(
      await screen.findByRole('status'),
    ).toHaveTextContent(
      'Tus datos de contacto se actualizaron.',
    );

    expect(
      screen.queryByRole('textbox', { name: 'Documento' }),
    ).not.toBeInTheDocument();
  });
});
