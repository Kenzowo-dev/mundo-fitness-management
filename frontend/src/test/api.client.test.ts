// @ts-nocheck
import { vi, beforeEach, afterEach, describe, it, expect } from 'vitest'
import { api } from '@/api/client'

const createMockResponse = (ok: boolean, status: number, data: unknown) => ({
  ok,
  status,
  json: vi.fn().mockResolvedValue(data),
  text: vi.fn().mockResolvedValue(JSON.stringify(data)),
})

describe('ApiClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    api.clearTokens()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('request method', () => {
    it('should make successful request', async () => {
      const mockData = { success: true }
      global.fetch = vi.fn().mockResolvedValue(createMockResponse(true, 200, mockData))

      const result = await api.getCurrentUser()

      expect(global.fetch).toHaveBeenCalled()
      const fetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0]
      expect(fetchCall[0]).toContain('/api/auth/me')
      expect(result).toEqual(mockData)
    })

    it('should throw error for 400 response', async () => {
      global.fetch = vi.fn().mockResolvedValue(
        createMockResponse(false, 400, { error: { message: 'Bad Request', code: 'BAD_REQUEST' } })
      )

      await expect(api.getCurrentUser()).rejects.toThrow('Revisa la información ingresada e inténtalo de nuevo.')
    })

    it('should throw error for 403 response', async () => {
      global.fetch = vi.fn().mockResolvedValue(
        createMockResponse(false, 403, { error: { message: 'Forbidden', code: 'FORBIDDEN' } })
      )

      await expect(api.getCurrentUser()).rejects.toThrow('Tu cuenta no tiene permiso para realizar esta acción.')
    })

    it('should throw error for 404 response', async () => {
      global.fetch = vi.fn().mockResolvedValue(
        createMockResponse(false, 404, { error: { message: 'Not Found', code: 'NOT_FOUND' } })
      )

      await expect(api.getCurrentUser()).rejects.toThrow('No encontramos la información solicitada.')
    })

    it('should throw error for 500 response', async () => {
      global.fetch = vi.fn().mockResolvedValue(
        createMockResponse(false, 500, { error: { message: 'Internal Server Error', code: 'SERVER_ERROR' } })
      )

      await expect(api.getCurrentUser()).rejects.toThrow('Ocurrió un problema en el servidor.')
    })

    it.each([
      [401, 'INVALID_CREDENTIALS', 'El correo electrónico o la contraseña no son correctos.'],
      [409, 'CONFLICT', 'La operación entra en conflicto con un registro existente.'],
      [422, 'VALIDATION_ERROR', 'Hay datos que no se pudieron procesar. Revisa la información ingresada.'],
    ])('shows a useful message for HTTP %i', async (status, code, expectedMessage) => {
      global.fetch = vi.fn().mockResolvedValue(
        createMockResponse(false, status, { error: { message: 'Internal details', code } })
      )

      await expect(api.getCurrentUser()).rejects.toThrow(expectedMessage)
    })

    it('explains connection failures without exposing browser network errors', async () => {
      global.fetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'))

      await expect(api.getCurrentUser()).rejects.toThrow(
        'No se pudo conectar con Mundo Fitness. Comprueba tu conexión e inténtalo de nuevo.'
      )
    })
  })

  describe('login', () => {
    it('should login successfully', async () => {
      const mockTokenPair = {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
      }
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'admin',
      }
      const loginResponse = { ok: true, status: 200, json: vi.fn().mockResolvedValue({ user: mockUser, tokens: mockTokenPair }) }
      global.fetch = vi.fn().mockResolvedValue(loginResponse)

      const result = await api.login('test@example.com', 'password123')

      expect(global.fetch).toHaveBeenCalled()
      const fetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0]
      expect(fetchCall[0]).toContain('/api/auth/login')
      expect(fetchCall[1].method).toBe('POST')
      expect(result.user).toEqual(mockUser)
      expect(result.tokens).toEqual(mockTokenPair)
    })

    it('should throw error on failed login', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: vi.fn().mockResolvedValue({ error: { message: 'Invalid credentials', code: 'INVALID_CREDENTIALS' } }),
      })

      await expect(api.login('test@example.com', 'wrongpassword')).rejects.toThrow(
        'El correo electrónico o la contraseña no son correctos.'
      )
    })
  })

  describe('session lifecycle', () => {
    const loginResponse = () => ({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({
        user: { id: 1, email: 'test@example.com', role: 'admin' },
        tokens: { accessToken: 'access-1', refreshToken: 'refresh-1' },
      }),
    })

    it('sends the access token when revoking the refresh token on logout', async () => {
      global.fetch = vi.fn()
        .mockResolvedValueOnce(loginResponse())
        .mockResolvedValueOnce(createMockResponse(true, 204, null))

      await api.login('test@example.com', 'password123')
      await api.logout()

      const [, logoutOptions] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[1]
      expect(logoutOptions.headers.Authorization).toBe('Bearer access-1')
      expect(api.isAuthenticated()).toBe(false)
    })

    it('shares one refresh request between concurrent unauthorized requests', async () => {
      let refreshCount = 0
      global.fetch = vi.fn(async (input: RequestInfo | URL, options?: RequestInit) => {
        const url = String(input)
        if (url.endsWith('/api/auth/login')) return loginResponse()
        if (url.endsWith('/api/auth/refresh')) {
          const refreshCall = ++refreshCount
          await new Promise((resolve) => setTimeout(resolve, 10))
          return refreshCall === 1
            ? createMockResponse(true, 200, { accessToken: 'access-2', refreshToken: 'refresh-2' })
            : createMockResponse(false, 401, { error: { message: 'Invalid refresh token' } })
        }
        if (url.endsWith('/api/auth/me')) {
          const authorization = options?.headers
          if (JSON.stringify(authorization).includes('access-2')) {
            return createMockResponse(true, 200, { id: 1 })
          }
          return createMockResponse(false, 401, { error: { message: 'Unauthorized' } })
        }
        throw new Error(`Unexpected request: ${url}`)
      })

      await api.login('test@example.com', 'password123')
      await Promise.all([api.getCurrentUser(), api.getCurrentUser()])

      expect(refreshCount).toBe(1)
    })
  })

  describe('register', () => {
    it('should register successfully', async () => {
      const mockTokenPair = {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
      }
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'admin',
      }
      const registerResponse = { ok: true, status: 201, json: vi.fn().mockResolvedValue({ user: mockUser, tokens: mockTokenPair }) }
      global.fetch = vi.fn().mockResolvedValue(registerResponse)

      const result = await api.register({
        email: 'new@example.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'User',
      })

      expect(global.fetch).toHaveBeenCalled()
      const fetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0]
      expect(fetchCall[0]).toContain('/api/auth/register')
      expect(fetchCall[1].method).toBe('POST')
      expect(result.user).toEqual(mockUser)
      expect(result.tokens).toEqual(mockTokenPair)
    })

    it('should throw error on failed registration', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: vi.fn().mockResolvedValue({ error: { message: 'Email already exists', code: 'EMAIL_EXISTS' } }),
      })

      await expect(api.register({
        email: 'existing@example.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'User',
      })).rejects.toThrow('Ya existe una cuenta con ese correo electrónico.')
    })
  })

  describe('member self-service profile', () => {
    it('updates only the signed-in member contact profile endpoint', async () => {
      global.fetch = vi.fn().mockResolvedValue(createMockResponse(true, 200, { id: 1, phone: '+51987654321' }))

      await api.updateOwnClientProfile(42, { phone: '+51987654321' })

      const [url, options] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0]
      expect(url).toContain('/api/clients/user/42')
      expect(options.method).toBe('PATCH')
      expect(JSON.parse(options.body)).toEqual({ phone: '+51987654321' })
    })
  })

  describe('forgotPassword', () => {
    it('should call public forgot-password endpoint', async () => {
      global.fetch = vi.fn().mockResolvedValue({ ok: true, status: 200, json: vi.fn().mockResolvedValue({ success: true }) })

      await api.forgotPassword('test@example.com')

      expect(global.fetch).toHaveBeenCalled()
      const fetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0]
      expect(fetchCall[0]).toContain('/api/auth/forgot-password')
      expect(fetchCall[1].method).toBe('POST')
    })

    it('rejects when the server rejects the reset request', async () => {
      global.fetch = vi.fn().mockResolvedValue(createMockResponse(false, 400, {
        error: { message: 'Invalid email', code: 'VALIDATION_ERROR' },
      }))

      await expect(api.forgotPassword('not-an-email')).rejects.toThrow(
        'Revisa la información ingresada e inténtalo de nuevo.'
      )
    })
  })

  describe('resetPassword', () => {
    it('should call public reset-password endpoint with token', async () => {
      global.fetch = vi.fn().mockResolvedValue({ ok: true, status: 200, json: vi.fn().mockResolvedValue({ success: true }) })

      await api.resetPassword('reset-token-123', 'newpassword123')

      expect(global.fetch).toHaveBeenCalled()
      const fetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0]
      expect(fetchCall[0]).toContain('/api/auth/reset-password')
      expect(fetchCall[1].method).toBe('POST')
    })

    it('rejects an invalid reset token instead of reporting success', async () => {
      global.fetch = vi.fn().mockResolvedValue(createMockResponse(false, 400, {
        error: { message: 'Invalid or expired reset token', code: 'INVALID_TOKEN' },
      }))

      await expect(api.resetPassword('bad-token', 'newpassword123')).rejects.toThrow(
        'El enlace no es válido o venció. Solicita uno nuevo para continuar.'
      )
    })
  })

  describe('isAuthenticated', () => {
    it('should return false when no token', () => {
      expect(api.isAuthenticated()).toBe(false)
    })
  })

  describe('getAccessToken', () => {
    it('should return null when no token', () => {
      expect(api.getAccessToken()).toBeNull()
    })
  })
})
