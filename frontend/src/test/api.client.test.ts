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

      await expect(api.getCurrentUser()).rejects.toThrow('Bad Request')
    })

    it('should throw error for 403 response', async () => {
      global.fetch = vi.fn().mockResolvedValue(
        createMockResponse(false, 403, { error: { message: 'Forbidden', code: 'FORBIDDEN' } })
      )

      await expect(api.getCurrentUser()).rejects.toThrow('Forbidden')
    })

    it('should throw error for 404 response', async () => {
      global.fetch = vi.fn().mockResolvedValue(
        createMockResponse(false, 404, { error: { message: 'Not Found', code: 'NOT_FOUND' } })
      )

      await expect(api.getCurrentUser()).rejects.toThrow('Not Found')
    })

    it('should throw error for 500 response', async () => {
      global.fetch = vi.fn().mockResolvedValue(
        createMockResponse(false, 500, { error: { message: 'Internal Server Error', code: 'SERVER_ERROR' } })
      )

      await expect(api.getCurrentUser()).rejects.toThrow('Internal Server Error')
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

      await expect(api.login('test@example.com', 'wrongpassword')).rejects.toThrow('Invalid credentials')
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
      })).rejects.toThrow('Email already exists')
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