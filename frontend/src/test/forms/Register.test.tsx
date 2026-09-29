// @ts-nocheck
import { vi, beforeEach, afterEach, describe, it, expect } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Register from '@/components/Register'
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

describe('Register', () => {
  let mockRegister: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()

    mockRegister = vi.fn()

    vi.spyOn(useAuthModule, 'useAuth').mockReturnValue({
      register: mockRegister,
      user: null,
      isLoading: false,
      isAuthenticated: false,
      login: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
      updateUser: vi.fn(),
    } as ReturnType<typeof useAuthModule.useAuth>)

    vi.spyOn(apiModule.api, 'isAuthenticated').mockReturnValue(false)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  const renderForm = () => render(<Register />, { wrapper: createWrapper() })

  describe('Render', () => {
    it('renders all required fields', () => {
      renderForm()
      expect(screen.getByLabelText('Nombre')).toBeInTheDocument()
      expect(screen.getByLabelText('Apellido')).toBeInTheDocument()
      expect(screen.getByLabelText('Correo electrónico')).toBeInTheDocument()
      expect(screen.getByLabelText('Contraseña')).toBeInTheDocument()
      expect(screen.getByLabelText('Confirmar contraseña')).toBeInTheDocument()
      expect(screen.getByLabelText('Número de teléfono')).toBeInTheDocument()
      expect(screen.getByLabelText('Fecha de nacimiento')).toBeInTheDocument()
      expect(screen.getByLabelText('Género')).toBeInTheDocument()
    })

    it('renders submit button', () => {
      renderForm()
      expect(screen.getByRole('button', { name: 'Crear cuenta' })).toBeInTheDocument()
    })

    it('renders back link', () => {
      renderForm()
      expect(screen.getByRole('button', { name: '← Volver al inicio' })).toBeInTheDocument()
    })

    it('renders password toggle button', () => {
      renderForm()
      expect(screen.getByRole('button', { name: 'Mostrar contraseña' })).toBeInTheDocument()
    })
  })

  describe('Required fields validation', () => {
    it('shows error for empty firstName on blur', async () => {
      renderForm()
      const firstNameInput = screen.getByLabelText('Nombre')
      fireEvent.blur(firstNameInput)
      await waitFor(() => {
        expect(screen.getByText('Este campo es obligatorio')).toBeInTheDocument()
      })
    })

    it('shows error for empty lastName on blur', async () => {
      renderForm()
      const lastNameInput = screen.getByLabelText('Apellido')
      fireEvent.blur(lastNameInput)
      await waitFor(() => {
        expect(screen.getByText('Este campo es obligatorio')).toBeInTheDocument()
      })
    })

    it('shows error for empty email on blur', async () => {
      renderForm()
      const emailInput = screen.getByLabelText('Correo electrónico')
      fireEvent.blur(emailInput)
      await waitFor(() => {
        expect(screen.getByText('El correo es obligatorio')).toBeInTheDocument()
      })
    })

    it('shows error for invalid email format on blur', async () => {
      renderForm()
      const emailInput = screen.getByLabelText('Correo electrónico')
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } })
      fireEvent.blur(emailInput)
      await waitFor(() => {
        expect(screen.getByText('Formato de correo inválido')).toBeInTheDocument()
      })
    })

    it('shows error for empty password on blur', async () => {
      renderForm()
      const passwordInput = screen.getByLabelText('Contraseña')
      fireEvent.blur(passwordInput)
      await waitFor(() => {
        expect(screen.getByText('La contraseña es obligatoria')).toBeInTheDocument()
      })
    })

    it('shows error for short password on blur', async () => {
      renderForm()
      const passwordInput = screen.getByLabelText('Contraseña')
      fireEvent.change(passwordInput, { target: { value: 'short' } })
      fireEvent.blur(passwordInput)
      await waitFor(() => {
        expect(screen.getByText('Mínimo 8 caracteres')).toBeInTheDocument()
      })
    })

    it('shows error for empty confirmPassword on blur', async () => {
      renderForm()
      const confirmInput = screen.getByLabelText('Confirmar contraseña')
      fireEvent.blur(confirmInput)
      await waitFor(() => {
        expect(screen.getByText('Confirma tu contraseña')).toBeInTheDocument()
      })
    })

    it('shows error for password mismatch on blur', async () => {
      renderForm()
      const passwordInput = screen.getByLabelText('Contraseña')
      const confirmInput = screen.getByLabelText('Confirmar contraseña')
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.change(confirmInput, { target: { value: 'different' } })
      fireEvent.blur(confirmInput)
      await waitFor(() => {
        expect(screen.getByText('Las contraseñas no coinciden')).toBeInTheDocument()
      })
    })

    it('shows error for empty phone on blur', async () => {
      renderForm()
      const phoneInput = screen.getByLabelText('Número de teléfono')
      fireEvent.blur(phoneInput)
      await waitFor(() => {
        expect(screen.getByText('El teléfono es obligatorio')).toBeInTheDocument()
      })
    })

    it('shows error for empty birthDate on blur', async () => {
      renderForm()
      const birthDateInput = screen.getByLabelText('Fecha de nacimiento')
      fireEvent.blur(birthDateInput)
      await waitFor(() => {
        expect(screen.getByText('La fecha de nacimiento es obligatoria')).toBeInTheDocument()
      })
    })

    it('shows error for empty gender on blur', async () => {
      renderForm()
      const genderSelect = screen.getByLabelText('Género')
      fireEvent.blur(genderSelect)
      await waitFor(() => {
        expect(screen.getByRole('alert', { hidden: false })).toHaveTextContent('Selecciona una opción')
      })
    })
  })

  describe('Submit validation', () => {
    it('shows global error when required fields are empty on submit', async () => {
      renderForm()
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }))
      })
      await waitFor(() => {
        expect(screen.getByText('Por favor, corrige los errores del formulario.')).toBeInTheDocument()
      })
    })

    it('shows field errors on submit when fields are invalid', async () => {
      renderForm()
      fireEvent.change(screen.getByLabelText('Correo electrónico'), { target: { value: 'invalid' } })
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }))
      })
      await waitFor(() => {
        expect(screen.getByText('Formato de correo inválido')).toBeInTheDocument()
      })
    })
  })

  describe('Valid submit', () => {
    it('calls register with correct data on valid submit', async () => {
      mockRegister.mockResolvedValue(undefined)
      renderForm()

      fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'Juan' } })
      fireEvent.change(screen.getByLabelText('Apellido'), { target: { value: 'Pérez' } })
      fireEvent.change(screen.getByLabelText('Correo electrónico'), { target: { value: 'juan@test.com' } })
      fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'password123' } })
      fireEvent.change(screen.getByLabelText('Confirmar contraseña'), { target: { value: 'password123' } })
      fireEvent.change(screen.getByLabelText('Número de teléfono'), { target: { value: '987654321' } })
      fireEvent.change(screen.getByLabelText('Fecha de nacimiento'), { target: { value: '1990-01-01' } })
      fireEvent.change(screen.getByLabelText('Género'), { target: { value: 'masculino' } })

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }))
      })

      await waitFor(() => {
        expect(mockRegister).toHaveBeenCalledWith({
          email: 'juan@test.com',
          password: 'password123',
          firstName: 'Juan',
          lastName: 'Pérez',
          phone: '987654321',
          birthDate: '1990-01-01',
          gender: 'masculino',
        })
      })
    })

    it('shows loading state during submit', async () => {
      let resolveRegister: () => void
      const registerPromise = new Promise<void>((resolve) => { resolveRegister = resolve })
      mockRegister.mockReturnValue(registerPromise)

      renderForm()

      fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'Juan' } })
      fireEvent.change(screen.getByLabelText('Apellido'), { target: { value: 'Pérez' } })
      fireEvent.change(screen.getByLabelText('Correo electrónico'), { target: { value: 'juan@test.com' } })
      fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'password123' } })
      fireEvent.change(screen.getByLabelText('Confirmar contraseña'), { target: { value: 'password123' } })
      fireEvent.change(screen.getByLabelText('Número de teléfono'), { target: { value: '987654321' } })
      fireEvent.change(screen.getByLabelText('Fecha de nacimiento'), { target: { value: '1990-01-01' } })
      fireEvent.change(screen.getByLabelText('Género'), { target: { value: 'masculino' } })

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }))
      })

      expect(screen.getByRole('button', { name: 'Creando cuenta...' })).toBeInTheDocument()
      expect(screen.getByLabelText('Nombre')).toBeDisabled()
      expect(screen.getByLabelText('Correo electrónico')).toBeDisabled()
      expect(screen.getByRole('button', { name: '← Volver al inicio' })).toBeDisabled()

      await act(async () => {
        resolveRegister!()
      })
    })

    it('disables all inputs and buttons during loading', async () => {
      let resolveRegister: () => void
      const registerPromise = new Promise<void>((resolve) => { resolveRegister = resolve })
      mockRegister.mockReturnValue(registerPromise)

      renderForm()

      fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'Juan' } })
      fireEvent.change(screen.getByLabelText('Apellido'), { target: { value: 'Pérez' } })
      fireEvent.change(screen.getByLabelText('Correo electrónico'), { target: { value: 'juan@test.com' } })
      fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'password123' } })
      fireEvent.change(screen.getByLabelText('Confirmar contraseña'), { target: { value: 'password123' } })
      fireEvent.change(screen.getByLabelText('Número de teléfono'), { target: { value: '987654321' } })
      fireEvent.change(screen.getByLabelText('Fecha de nacimiento'), { target: { value: '1990-01-01' } })
      fireEvent.change(screen.getByLabelText('Género'), { target: { value: 'masculino' } })

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }))
      })

      expect(screen.getByLabelText('Nombre')).toBeDisabled()
      expect(screen.getByLabelText('Apellido')).toBeDisabled()
      expect(screen.getByLabelText('Correo electrónico')).toBeDisabled()
      expect(screen.getByLabelText('Contraseña')).toBeDisabled()
      expect(screen.getByLabelText('Confirmar contraseña')).toBeDisabled()
      expect(screen.getByLabelText('Número de teléfono')).toBeDisabled()
      expect(screen.getByLabelText('Fecha de nacimiento')).toBeDisabled()
      expect(screen.getByLabelText('Género')).toBeDisabled()
      expect(screen.getByRole('button', { name: 'Mostrar contraseña' })).toBeDisabled()
      expect(screen.getByRole('button', { name: 'Creando cuenta...' })).toBeDisabled()

      await act(async () => {
        resolveRegister!()
      })
    })

    it('shows success state after successful registration', async () => {
      mockRegister.mockResolvedValue(undefined)
      renderForm()

      fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'Juan' } })
      fireEvent.change(screen.getByLabelText('Apellido'), { target: { value: 'Pérez' } })
      fireEvent.change(screen.getByLabelText('Correo electrónico'), { target: { value: 'juan@test.com' } })
      fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'password123' } })
      fireEvent.change(screen.getByLabelText('Confirmar contraseña'), { target: { value: 'password123' } })
      fireEvent.change(screen.getByLabelText('Número de teléfono'), { target: { value: '987654321' } })
      fireEvent.change(screen.getByLabelText('Fecha de nacimiento'), { target: { value: '1990-01-01' } })
      fireEvent.change(screen.getByLabelText('Género'), { target: { value: 'masculino' } })

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }))
      })

      await waitFor(() => {
        expect(screen.getByText('¡Registro exitoso!')).toBeInTheDocument()
      })
      expect(screen.getByText(/Tu cuenta ha sido creada correctamente/)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Volver al inicio' })).toBeInTheDocument()
    })

    it('shows error message on registration failure', async () => {
      mockRegister.mockRejectedValue(new Error('El correo ya existe'))
      renderForm()

      fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'Juan' } })
      fireEvent.change(screen.getByLabelText('Apellido'), { target: { value: 'Pérez' } })
      fireEvent.change(screen.getByLabelText('Correo electrónico'), { target: { value: 'juan@test.com' } })
      fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'password123' } })
      fireEvent.change(screen.getByLabelText('Confirmar contraseña'), { target: { value: 'password123' } })
      fireEvent.change(screen.getByLabelText('Número de teléfono'), { target: { value: '987654321' } })
      fireEvent.change(screen.getByLabelText('Fecha de nacimiento'), { target: { value: '1990-01-01' } })
      fireEvent.change(screen.getByLabelText('Género'), { target: { value: 'masculino' } })

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }))
      })

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('El correo ya existe')
      })
    })
  })

  describe('Password visibility toggle', () => {
    it('toggles both password fields visibility', () => {
      renderForm()

      const passwordInput = screen.getByLabelText('Contraseña')
      const confirmInput = screen.getByLabelText('Confirmar contraseña')
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
      let resolveRegister: () => void
      const registerPromise = new Promise<void>((resolve) => { resolveRegister = resolve })
      mockRegister.mockReturnValue(registerPromise)

      renderForm()

      fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'Juan' } })
      fireEvent.change(screen.getByLabelText('Apellido'), { target: { value: 'Pérez' } })
      fireEvent.change(screen.getByLabelText('Correo electrónico'), { target: { value: 'juan@test.com' } })
      fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'password123' } })
      fireEvent.change(screen.getByLabelText('Confirmar contraseña'), { target: { value: 'password123' } })
      fireEvent.change(screen.getByLabelText('Número de teléfono'), { target: { value: '987654321' } })
      fireEvent.change(screen.getByLabelText('Fecha de nacimiento'), { target: { value: '1990-01-01' } })
      fireEvent.change(screen.getByLabelText('Género'), { target: { value: 'masculino' } })

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }))
      })

      expect(screen.getByRole('button', { name: 'Mostrar contraseña' })).toBeDisabled()

      await act(async () => {
        resolveRegister!()
      })
    })
  })

  describe('Error clearing', () => {
    it('clears field error when user types', async () => {
      renderForm()
      const firstNameInput = screen.getByLabelText('Nombre')
      fireEvent.blur(firstNameInput)
      await waitFor(() => {
        expect(screen.getByText('Este campo es obligatorio')).toBeInTheDocument()
      })

      fireEvent.change(firstNameInput, { target: { value: 'Juan' } })
      await waitFor(() => {
        expect(screen.queryByText('Este campo es obligatorio')).not.toBeInTheDocument()
      })
    })

    it('clears global error when user types', async () => {
      mockRegister.mockRejectedValue(new Error('Error'))
      renderForm()

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }))
      })

      await waitFor(() => {
        expect(screen.getByText('Por favor, corrige los errores del formulario.')).toBeInTheDocument()
      })

      fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'Juan' } })
      await waitFor(() => {
        expect(screen.queryByText('Por favor, corrige los errores del formulario.')).not.toBeInTheDocument()
      })
    })
  })
})