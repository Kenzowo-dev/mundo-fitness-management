import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthProvider } from '../context/AuthContext';
import * as authModule from '../context/useAuth';
import App from '../App';

const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });
};

const renderWithProviders = (ui: React.ReactElement, initialPath = '/') => {
  const queryClient = createTestQueryClient();
  window.history.replaceState({}, '', initialPath);
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>{ui}</AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders without crashing', () => {
    renderWithProviders(<App />);
    expect(screen.getAllByRole('link', { name: /iniciar sesión/i })).not.toHaveLength(0);
    expect(screen.getAllByRole('link', { name: /registrarse|crear cuenta/i })).not.toHaveLength(0);
  });

  it('keeps reception out of admin settings even when opening the route directly', () => {
    vi.spyOn(authModule, 'useAuth').mockReturnValue({
      user: {
        id: 2,
        email: 'reception@example.test',
        firstName: 'Recepción',
        lastName: 'Prueba',
        role: 'receptionist',
        isActive: true,
        emailVerified: true,
        createdAt: '2026-09-01T00:00:00.000Z',
        updatedAt: '2026-09-01T00:00:00.000Z',
      },
      isLoading: false,
      isAuthenticated: true,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
      updateUser: vi.fn(),
    } as ReturnType<typeof authModule.useAuth>);

    renderWithProviders(<App />, '/configuracion');

    expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Información personal' })).not.toBeInTheDocument();
  });
});
