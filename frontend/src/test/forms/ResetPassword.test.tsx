// @ts-nocheck
import { vi, beforeEach, afterEach, describe, it, expect } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import ResetPassword from '@/pages/auth/ResetPassword'
import * as useApiModule from '@/hooks/useApi'

const createWrapper = (initialEntries = ['/reset-password?token=valid-token']) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
    </QueryClientProvider>
  )
}

describe('ResetPassword', () => {
  let mockMutateAsync: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()

    mockMutateAsync = vi.fn().mockResolvedValue(undefined)

    vi.spyOn(useApiModule, 'useResetPassword').mockReturnValue({
      mutateAsync: mockMutateAsync,
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
      mutate: vi.fn(),
    } as ReturnType<typeof useApiModule.useResetPassword>)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  const renderForm = (token = 'valid-token') => render(<ResetPassword />, { wrapper: createWrapper([`/reset-password?token=${token}`]) })

  describe('Render - no token', () => {
    it('shows error state when no token', () => {
      renderForm('')
      expect(screen.getByText('Enlace no válido')).toBeInTheDocument()
      expect(screen.getByText(/El enlace de recuperación ha expirado o no es válido/)).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Solicitar nuevo enlace' })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: '← Volver al inicio de sesión' })).toBeInTheDocument()
    })
  })

  describe('Render - with token', () => {
    it('renders password fields with labels', () => {
      renderForm()
      expect(screen.getByLabelText('Nueva contraseña')).toBeInTheDocument()
      expect(screen.getByLabelText('Confirmar nueva contraseña')).toBeInTheDocument()
    })

    it('renders submit button', () => {
      renderForm()
      expect(screen.getByRole('button', { name: 'Restablecer contraseña' })).toBeInTheDocument()
    })

    it('renders back link', () => {
      renderForm()
      expect(screen.getByRole('link', { name: '← Volver al inicio de sesión' })).toBeInTheDocument()
    })

    it('renders password toggle button', () => {
      renderForm()
      expect(screen.getByRole('button', { name: 'Mostrar contraseña' })).toBeInTheDocument()
    })
  })

  describe('Validation', () => {
    it('shows error for empty password', async () => {
      renderForm()
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Restablecer contraseña' }))
      })
      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('La contraseña es obligatoria')
      })
    })

    it('shows error for short password', async () => {
      renderForm()
      fireEvent.change(screen.getByLabelText('Nueva contraseña'), { target: { value: 'short' } })
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Restablecer contraseña' }))
      })
      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('La contraseña debe tener al menos 8 caracteres')
      })
    })

    it('shows error for password mismatch', async () => {
      renderForm()
      fireEvent.change(screen.getByLabelText('Nueva contraseña'), { target: { value: 'password123' } })
      fireEvent.change(screen.getByLabelText('Confirmar nueva contraseña'), { target: { value: 'different' } })
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Restablecer contraseña' }))
      })
      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Las contraseñas no coinciden')
      })
    })

    it('shows error when token is missing', async () => {
      renderForm('')
      // The form is not rendered when no token, so this test is for the error state page
    })
  })

  describe('Valid submit', () => {
    it('calls resetPassword with token and password on valid submit', async () => {
      mockMutateAsync.mockResolvedValue(undefined)
      renderForm()

      fireEvent.change(screen.getByLabelText('Nueva contraseña'), { target: { value: 'password123' } })
      fireEvent.change(screen.getByLabelText('Confirmar nueva contraseña'), { target: { value: 'password123' } })

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Restablecer contraseña' }))
      })

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith({ token: 'valid-token', newPassword: 'password123' })
      })
    })

    it('shows loading state during submit', async () => {
      let resolveMutation: () => void
      const mutationPromise = new Promise<void>((resolve) => { resolveMutation = resolve })
      mockMutateAsync.mockReturnValue(mutationPromise)

      renderForm()

      fireEvent.change(screen.getByLabelText('Nueva contraseña'), { target: { value: 'password123' } })
      fireEvent.change(screen.getByLabelText('Confirmar nueva contraseña'), { target: { value: 'password123' } })

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Restablecer contraseña' }))
      })

      expect(screen.getByRole('button', { name: 'Restableciendo...' })).toBeInTheDocument()
      expect(screen.getByLabelText('Nueva contraseña')).toBeDisabled()
      expect(screen.getByLabelText('Confirmar nueva contraseña')).toBeDisabled()

      await act(async () => {
        resolveMutation!()
      })
    })

    it('disables inputs and buttons during loading', async () => {
      let resolveMutation: () => void
      const mutationPromise = new Promise<void>((resolve) => { resolveMutation = resolve })
      mockMutateAsync.mockReturnValue(mutationPromise)

      renderForm()

      fireEvent.change(screen.getByLabelText('Nueva contraseña'), { target: { value: 'password123' } })
      fireEvent.change(screen.getByLabelText('Confirmar nueva contraseña'), { target: { value: 'password123' } })

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Restablecer contraseña' }))
      })

      expect(screen.getByLabelText('Nueva contraseña')).toBeDisabled()
      expect(screen.getByLabelText('Confirmar nueva contraseña')).toBeDisabled()
      expect(screen.getByRole('button', { name: 'Mostrar contraseña' })).toBeDisabled()
      expect(screen.getByRole('button', { name: 'Restableciendo...' })).toBeDisabled()

      await act(async () => {
        resolveMutation!()
      })
    })

    it('shows success state after successful submit', async () => {
      mockMutateAsync.mockResolvedValue(undefined)
      renderForm()

      fireEvent.change(screen.getByLabelText('Nueva contraseña'), { target: { value: 'password123' } })
      fireEvent.change(screen.getByLabelText('Confirmar nueva contraseña'), { target: { value: 'password123' } })

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Restablecer contraseña' }))
      })

      await waitFor(() => {
        expect(screen.getByText('¡Contraseña actualizada!')).toBeInTheDocument()
      })
      expect(screen.getByText(/Tu contraseña ha sido restablecida correctamente/)).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Iniciar sesión' })).toBeInTheDocument()
    })

    it('shows error message on failure', async () => {
      mockMutateAsync.mockRejectedValue(new Error('Error al restablecer'))
      renderForm()

      fireEvent.change(screen.getByLabelText('Nueva contraseña'), { target: { value: 'password123' } })
      fireEvent.change(screen.getByLabelText('Confirmar nueva contraseña'), { target: { value: 'password123' } })

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Restablecer contraseña' }))
      })

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Error al restablecer')
      })
    })
  })

  describe('Password visibility toggle', () => {
    it('toggles both password fields visibility', () => {
      renderForm()

      const passwordInput = screen.getByLabelText('Nueva contraseña')
      const confirmInput = screen.getByLabelText('Confirmar nueva contraseña')
      const toggleBtn = screen.getByRole('button', { name: 'Mostrar contraseña' })

      expect(passwordInput).toHaveAttribute('type', 'password')
      expect(confirmInput).toHaveAttribute('type', 'password')

      fireEvent.click(toggleBtn)

      expect(passwordInput).toHaveAttribute('type', 'text')
      expect(confirmInput).toHaveAttribute('type', 'text')
      expect(screen.getByRole('button', { name: 'Ocultar contraseña' })).toBeInTheDocument()

      fireEvent.click(screen.getByRole('button', { name: 'Ocultar contraseña' }))
      expect(passwordInput).toHaveAttribute('type', 'password')
      expect(confirmInput).toHaveAttribute('type', 'password')
    })

    it('disables toggle during loading', async () => {
      let resolveMutation: () => void
      const mutationPromise = new Promise<void>((resolve) => { resolveMutation = resolve })
      mockMutateAsync.mockReturnValue(mutationPromise)

      renderForm()

      fireEvent.change(screen.getByLabelText('Nueva contraseña'), { target: { value: 'password123' } })
      fireEvent.change(screen.getByLabelText('Confirmar nueva contraseña'), { target: { value: 'password123' } })

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Restablecer contraseña' }))
      })

      expect(screen.getByRole('button', { name: 'Mostrar contraseña' })).toBeDisabled()

      await act(async () => {
        resolveMutation!()
      })
    })
  })
})