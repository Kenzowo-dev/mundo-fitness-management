// @ts-nocheck
import { vi, beforeEach, afterEach, describe, it, expect } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/context/AuthContext'
import { useAuth } from '@/context/useAuth'
import * as useApiModule from '@/hooks/useApi'

const mockUser = {
  id: 1,
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  role: 'admin',
  isActive: true,
  emailVerified: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  })
}

const renderWithProviders = (ui: React.ReactElement) => {
  const queryClient = createTestQueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>{ui}</AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

const TestComponent = () => {
  const { user, isLoading, isAuthenticated, login, register, logout, refreshUser, updateUser } = useAuth()
  return (
    <div>
      <span data-testid="user">{user ? `${user.firstName} ${user.lastName}` : 'null'}</span>
      <span data-testid="loading">{isLoading.toString()}</span>
      <span data-testid="authenticated">{isAuthenticated.toString()}</span>
      <button
        data-testid="login-btn"
        onClick={() => login('test@example.com', 'password123')}
        disabled={isLoading}
      >
        Login
      </button>
      <button
        data-testid="register-btn"
        onClick={() => register({ email: 'new@example.com', password: 'password123', firstName: 'New', lastName: 'User' })}
        disabled={isLoading}
      >
        Register
      </button>
      <button data-testid="logout-btn" onClick={logout} disabled={isLoading}>
        Logout
      </button>
      <button data-testid="refresh-btn" onClick={refreshUser} disabled={isLoading}>
        Refresh
      </button>
      <button
        data-testid="update-btn"
        onClick={() => updateUser({ firstName: 'Updated' })}
        disabled={isLoading}
      >
        Update
      </button>
    </div>
  )
}

const createMockMutation = (overrides: Partial<{ mutateAsync: ReturnType<typeof vi.fn>; mutate: ReturnType<typeof vi.fn>; isPending: boolean }> = {}) => ({
  mutateAsync: vi.fn().mockResolvedValue(undefined),
  mutate: vi.fn(),
  isPending: false,
  isSuccess: false,
  isError: false,
  isIdle: true,
  status: 'idle',
  data: undefined,
  error: null,
  variables: undefined,
  context: undefined,
  reset: vi.fn(),
  failureCount: 0,
  failureReason: null,
  submittedAt: 0,
  ...overrides,
})

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  const mockLoginMutation = createMockMutation()
  const mockRegisterMutation = createMockMutation()
  const mockLogoutMutation = createMockMutation()
  const mockUpdateUserMutation = createMockMutation()
  const mockRefetch = vi.fn()

  beforeEach(() => {
    vi.spyOn(useApiModule, 'useCurrentUser').mockReturnValue({
      data: mockUser,
      isLoading: false,
      refetch: mockRefetch,
    } as ReturnType<typeof useApiModule.useCurrentUser>)
    vi.spyOn(useApiModule, 'useLogin').mockReturnValue(mockLoginMutation as ReturnType<typeof useApiModule.useLogin>)
    vi.spyOn(useApiModule, 'useRegister').mockReturnValue(mockRegisterMutation as ReturnType<typeof useApiModule.useRegister>)
    vi.spyOn(useApiModule, 'useLogout').mockReturnValue(mockLogoutMutation as ReturnType<typeof useApiModule.useLogout>)
    vi.spyOn(useApiModule, 'useUpdateCurrentUser').mockReturnValue(mockUpdateUserMutation as ReturnType<typeof useApiModule.useUpdateCurrentUser>)
  })

  describe('Initial state', () => {
    it('should show authenticated user when token exists', () => {
      renderWithProviders(<TestComponent />)
      expect(screen.getByTestId('user')).toHaveTextContent('Test User')
      expect(screen.getByTestId('authenticated')).toHaveTextContent('true')
      expect(screen.getByTestId('loading')).toHaveTextContent('false')
    })

    it('should show unauthenticated when no user', () => {
      vi.spyOn(useApiModule, 'useCurrentUser').mockReturnValue({
        data: null,
        isLoading: false,
        refetch: mockRefetch,
      } as ReturnType<typeof useApiModule.useCurrentUser>)
      renderWithProviders(<TestComponent />)
      expect(screen.getByTestId('user')).toHaveTextContent('null')
      expect(screen.getByTestId('authenticated')).toHaveTextContent('false')
    })

    it('should show loading state initially', () => {
      vi.spyOn(useApiModule, 'useCurrentUser').mockReturnValue({
        data: undefined,
        isLoading: true,
        refetch: mockRefetch,
      } as ReturnType<typeof useApiModule.useCurrentUser>)
      renderWithProviders(<TestComponent />)
      expect(screen.getByTestId('loading')).toHaveTextContent('true')
    })
  })

  describe('Login', () => {
    it('should call login mutation with credentials', async () => {
      renderWithProviders(<TestComponent />)

      await act(async () => {
        screen.getByTestId('login-btn').click()
      })

      expect(mockLoginMutation.mutateAsync).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      })
    })

    it('keeps route loading false while the login form handles its own pending state', async () => {
      let resolveLogin: (value: void) => void
      const loginPromise = new Promise<void>((resolve) => {
        resolveLogin = resolve
      })
      mockLoginMutation.mutateAsync.mockReturnValue(loginPromise)
      mockLoginMutation.isPending = true

      renderWithProviders(<TestComponent />)

      await act(async () => {
        screen.getByTestId('login-btn').click()
      })

      expect(screen.getByTestId('loading')).toHaveTextContent('false')
      expect(screen.getByTestId('login-btn')).toBeEnabled()

      await act(async () => {
        resolveLogin!()
        mockLoginMutation.isPending = false
      })
    })

    it('should propagate login error', async () => {
      mockLoginMutation.mutateAsync.mockRejectedValue(new Error('Invalid credentials'))
      renderWithProviders(<TestComponent />)

      await act(async () => {
        screen.getByTestId('login-btn').click()
      })

      expect(mockLoginMutation.mutateAsync).toHaveBeenCalled()
    })
  })

  describe('Register', () => {
    it('should call register mutation with data', async () => {
      renderWithProviders(<TestComponent />)

      await act(async () => {
        screen.getByTestId('register-btn').click()
      })

      expect(mockRegisterMutation.mutateAsync).toHaveBeenCalledWith({
        email: 'new@example.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'User',
      })
    })

    it('keeps route loading false while the registration form handles its own pending state', async () => {
      let resolveRegister: (value: void) => void
      const registerPromise = new Promise<void>((resolve) => {
        resolveRegister = resolve
      })
      mockRegisterMutation.mutateAsync.mockReturnValue(registerPromise)
      mockRegisterMutation.isPending = true

      renderWithProviders(<TestComponent />)

      await act(async () => {
        screen.getByTestId('register-btn').click()
      })

      expect(screen.getByTestId('loading')).toHaveTextContent('false')
      expect(screen.getByTestId('register-btn')).toBeEnabled()

      await act(async () => {
        resolveRegister!()
        mockRegisterMutation.isPending = false
      })
    })

    it('should propagate register error', async () => {
      mockRegisterMutation.mutateAsync.mockRejectedValue(new Error('Email exists'))
      renderWithProviders(<TestComponent />)

      await act(async () => {
        screen.getByTestId('register-btn').click()
      })

      expect(mockRegisterMutation.mutateAsync).toHaveBeenCalled()
    })
  })

  describe('Logout', () => {
    it('should call logout mutation', () => {
      renderWithProviders(<TestComponent />)

      act(() => {
        screen.getByTestId('logout-btn').click()
      })

      expect(mockLogoutMutation.mutate).toHaveBeenCalled()
    })
  })

  describe('Refresh User', () => {
    it('should call refetch when refreshUser is called', () => {
      renderWithProviders(<TestComponent />)

      act(() => {
        screen.getByTestId('refresh-btn').click()
      })

      expect(mockRefetch).toHaveBeenCalled()
    })
  })

  describe('Update User', () => {
    it('should call updateUser mutation with data', async () => {
      renderWithProviders(<TestComponent />)

      await act(async () => {
        screen.getByTestId('update-btn').click()
      })

      expect(mockUpdateUserMutation.mutateAsync).toHaveBeenCalledWith({
        firstName: 'Updated',
      })
    })
  })
})
