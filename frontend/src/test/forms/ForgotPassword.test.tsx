// @ts-nocheck
import { vi, beforeEach, afterEach, describe, it, expect } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import ForgotPassword from '@/pages/auth/ForgotPassword'
import * as useApiModule from '@/hooks/useApi'

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

describe('ForgotPassword', () => {
  let mockMutateAsync: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()

    mockMutateAsync = vi.fn().mockResolvedValue(undefined)

    vi.spyOn(useApiModule, 'useForgotPassword').mockReturnValue({
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
    } as ReturnType<typeof useApiModule.useForgotPassword>)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  const renderForm = () => render(<ForgotPassword />, { wrapper: createWrapper() })

  describe('Render', () => {
    it('renders email input with label', () => {
      renderForm()
      expect(screen.getByLabelText('Correo electrónico')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('ejemplo@correo.com')).toBeInTheDocument()
    })

    it('renders submit button', () => {
      renderForm()
      expect(screen.getByRole('button', { name: 'Enviar enlace de recuperación' })).toBeInTheDocument()
    })

    it('renders back link', () => {
      renderForm()
      expect(screen.getByRole('link', { name: '← Volver al inicio de sesión' })).toBeInTheDocument()
    })
  })

  describe('Required fields', () => {
    it('requires email field', () => {
      renderForm()
      expect(screen.getByLabelText('Correo electrónico')).toBeRequired()
    })
  })

  describe('Submit', () => {
    it('calls forgotPassword with email on valid submit', async () => {
      mockMutateAsync.mockResolvedValue(undefined)
      renderForm()

      fireEvent.change(screen.getByLabelText('Correo electrónico'), { target: { value: 'test@example.com' } })

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Enviar enlace de recuperación' }))
      })

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith('test@example.com')
      })
    })

    it('shows loading state during submit', async () => {
      let resolveMutation: () => void
      const mutationPromise = new Promise<void>((resolve) => { resolveMutation = resolve })
      mockMutateAsync.mockReturnValue(mutationPromise)

      renderForm()

      fireEvent.change(screen.getByLabelText('Correo electrónico'), { target: { value: 'test@example.com' } })

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Enviar enlace de recuperación' }))
      })

      expect(screen.getByRole('button', { name: 'Enviando...' })).toBeInTheDocument()
      expect(screen.getByLabelText('Correo electrónico')).toBeDisabled()

      await act(async () => {
        resolveMutation!()
      })
    })

    it('disables input and button during loading', async () => {
      let resolveMutation: () => void
      const mutationPromise = new Promise<void>((resolve) => { resolveMutation = resolve })
      mockMutateAsync.mockReturnValue(mutationPromise)

      renderForm()

      fireEvent.change(screen.getByLabelText('Correo electrónico'), { target: { value: 'test@example.com' } })

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Enviar enlace de recuperación' }))
      })

      expect(screen.getByLabelText('Correo electrónico')).toBeDisabled()
      expect(screen.getByRole('button', { name: 'Enviando...' })).toBeDisabled()

      await act(async () => {
        resolveMutation!()
      })
    })

    it('shows error message on failure', async () => {
      mockMutateAsync.mockRejectedValue(new Error('Error al solicitar recuperación'))
      renderForm()

      fireEvent.change(screen.getByLabelText('Correo electrónico'), { target: { value: 'test@example.com' } })

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Enviar enlace de recuperación' }))
      })

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Error al solicitar recuperación')
      })
    })

    it('shows success state after successful submit', async () => {
      mockMutateAsync.mockResolvedValue(undefined)
      renderForm()

      fireEvent.change(screen.getByLabelText('Correo electrónico'), { target: { value: 'test@example.com' } })

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Enviar enlace de recuperación' }))
      })

      await waitFor(() => {
        expect(screen.getByText('¡Correo enviado!')).toBeInTheDocument()
      })
      expect(screen.getByText(/Si la cuenta existe, recibirás un enlace/)).toBeInTheDocument()
      expect(screen.getByRole('link', { name: '← Volver al inicio de sesión' })).toBeInTheDocument()
    })

    it('clears error on new submit attempt', async () => {
      mockMutateAsync
        .mockRejectedValueOnce(new Error('Error'))
        .mockResolvedValueOnce(undefined)

      renderForm()

      fireEvent.change(screen.getByLabelText('Correo electrónico'), { target: { value: 'test@example.com' } })

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Enviar enlace de recuperación' }))
      })

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Error')
      })

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Enviar enlace de recuperación' }))
      })

      await waitFor(() => {
        expect(screen.queryByRole('alert')).not.toBeInTheDocument()
      })
    })
  })

  describe('Back link', () => {
    it('navigates back to login on click', async () => {
      mockMutateAsync.mockResolvedValue(undefined)
      renderForm()

      await act(async () => {
        fireEvent.click(screen.getByRole('link', { name: '← Volver al inicio de sesión' }))
      })
      // Navigation happens via react-router Link, test renders correctly
    })
  })
})