// @ts-nocheck
import { vi, beforeEach, afterEach, describe, it, expect } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import LoginForm from '@/componentes/auth/LoginForm'
import * as useAuthModule from '@/context/useAuth'
import * as apiModule from '@/api/client'

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{children}</BrowserRouter>
    </QueryClientProvider>
  )
}

describe('LoginForm', () => {
  let mockLogin: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()

    mockLogin = vi.fn()

    vi.spyOn(useAuthModule, 'useAuth').mockReturnValue({
      login: mockLogin,
      user: null,
      isLoading: false,
      isAuthenticated: false,
      logout: vi.fn(),
      register: vi.fn(),
      refreshUser: vi.fn(),
      updateUser: vi.fn(),
    } as ReturnType<typeof useAuthModule.useAuth>)

    vi.spyOn(apiModule.api, 'isAuthenticated').mockReturnValue(false)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  const renderForm = () => render(<LoginForm />, { wrapper: createWrapper() })

  describe('Render', () => {
    it('renders email input with label', () => {
      renderForm()
      expect(screen.getByLabelText('Correo electrónico')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Ingresa tu correo')).toBeInTheDocument()
    })

    it('renders password input with label', () => {
      renderForm()
      expect(screen.getByLabelText('Contraseña')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Ingresa tu contraseña')).toBeInTheDocument()
    })

    it('renders submit button', () => {
      renderForm()
      expect(screen.getByRole('button', { name: 'Ingresar' })).toBeInTheDocument()
    })

    it('renders password toggle button', () => {
      renderForm()
      expect(screen.getByRole('button', { name: 'Mostrar contraseña' })).toBeInTheDocument()
    })
  })

  describe('Required fields', () => {
    it('shows browser validation for empty email', async () => {
      renderForm()
      const submitBtn = screen.getByRole('button', { name: 'Ingresar' })
      fireEvent.click(submitBtn)
      const emailInput = screen.getByLabelText('Correo electrónico')
      expect(emailInput).toBeRequired()
    })

    it('shows browser validation for empty password', async () => {
      renderForm()
      const submitBtn = screen.getByRole('button', { name: 'Ingresar' })
      fireEvent.click(submitBtn)
      const passwordInput = screen.getByLabelText('Contraseña')
      expect(passwordInput).toBeRequired()
    })
  })

  describe('Submit', () => {
    it('calls login with correct credentials on valid submit', async () => {
      mockLogin.mockResolvedValue(undefined)
      renderForm()

      fireEvent.change(screen.getByLabelText('Correo electrónico'), { target: { value: 'test@example.com' } })
      fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'password123' } })

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Ingresar' }))
      })

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123')
      })
    })

    it('shows loading state during submit', async () => {
      let resolveLogin: () => void
      const loginPromise = new Promise<void>((resolve) => { resolveLogin = resolve })
      mockLogin.mockReturnValue(loginPromise)

      renderForm()

      fireEvent.change(screen.getByLabelText('Correo electrónico'), { target: { value: 'test@example.com' } })
      fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'password123' } })

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Ingresar' }))
      })

      expect(screen.getByRole('button', { name: 'Ingresando...' })).toBeInTheDocument()
      expect(screen.getByLabelText('Correo electrónico')).toBeDisabled()
      expect(screen.getByLabelText('Contraseña')).toBeDisabled()
      expect(screen.getByRole('button', { name: 'Mostrar contraseña' })).toBeDisabled()

      await act(async () => {
        resolveLogin!()
      })
    })

    it('disables inputs and buttons during loading', async () => {
      let resolveLogin: () => void
      const loginPromise = new Promise<void>((resolve) => { resolveLogin = resolve })
      mockLogin.mockReturnValue(loginPromise)

      renderForm()

      fireEvent.change(screen.getByLabelText('Correo electrónico'), { target: { value: 'test@example.com' } })
      fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'password123' } })

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Ingresar' }))
      })

      expect(screen.getByLabelText('Correo electrónico')).toBeDisabled()
      expect(screen.getByLabelText('Contraseña')).toBeDisabled()
      expect(screen.getByRole('button', { name: 'Mostrar contraseña' })).toBeDisabled()
      expect(screen.getByRole('button', { name: 'Ingresando...' })).toBeDisabled()

      await act(async () => {
        resolveLogin!()
      })
    })

    it('shows error message on login failure', async () => {
      mockLogin.mockRejectedValue(new Error('Credenciales inválidas'))
      renderForm()

      fireEvent.change(screen.getByLabelText('Correo electrónico'), { target: { value: 'test@example.com' } })
      fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'password123' } })

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Ingresar' }))
      })

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Credenciales inválidas')
      })
      expect(screen.getByRole('button', { name: 'Ingresar' })).toBeInTheDocument()
    })

    it('clears error on new submit attempt', async () => {
      mockLogin
        .mockRejectedValueOnce(new Error('Credenciales inválidas'))
        .mockResolvedValueOnce(undefined)

      renderForm()

      fireEvent.change(screen.getByLabelText('Correo electrónico'), { target: { value: 'test@example.com' } })
      fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'password123' } })

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Ingresar' }))
      })

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Credenciales inválidas')
      })

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Ingresar' }))
      })

      await waitFor(() => {
        expect(screen.queryByRole('alert')).not.toBeInTheDocument()
      })
    })
  })

  describe('Password visibility toggle', () => {
    it('toggles password visibility', () => {
      renderForm()

      const passwordInput = screen.getByLabelText('Contraseña')
      const toggleBtn = screen.getByRole('button', { name: 'Mostrar contraseña' })

      expect(passwordInput).toHaveAttribute('type', 'password')

      fireEvent.click(toggleBtn)

      expect(passwordInput).toHaveAttribute('type', 'text')
      expect(screen.getByRole('button', { name: 'Ocultar contraseña' })).toBeInTheDocument()

      fireEvent.click(screen.getByRole('button', { name: 'Ocultar contraseña' }))
      expect(passwordInput).toHaveAttribute('type', 'password')
    })

    it('toggles aria-pressed attribute', () => {
      renderForm()
      const toggleBtn = screen.getByRole('button', { name: 'Mostrar contraseña' })

      expect(toggleBtn).toHaveAttribute('aria-pressed', 'false')

      fireEvent.click(toggleBtn)

      expect(screen.getByRole('button', { name: 'Ocultar contraseña' })).toHaveAttribute('aria-pressed', 'true')
    })

    it('disables toggle during loading', async () => {
      let resolveLogin: () => void
      const loginPromise = new Promise<void>((resolve) => { resolveLogin = resolve })
      mockLogin.mockReturnValue(loginPromise)

      renderForm()

      fireEvent.change(screen.getByLabelText('Correo electrónico'), { target: { value: 'test@example.com' } })
      fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'password123' } })

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Ingresar' }))
      })

      expect(screen.getByRole('button', { name: 'Mostrar contraseña' })).toBeDisabled()

      await act(async () => {
        resolveLogin!()
      })
    })
  })
})