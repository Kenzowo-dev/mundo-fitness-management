// @ts-nocheck
import { vi, beforeEach, afterEach, describe, it, expect } from 'vitest'
import { render, screen, act, fireEvent } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import DashboardLayout from '@/components/DashboardLayout'
import * as authModule from '@/context/useAuth'

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

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

describe('DashboardLayout - Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()

    vi.spyOn(authModule, 'useAuth').mockReturnValue({
      user: mockUser,
      isLoading: false,
      isAuthenticated: true,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
      updateUser: vi.fn(),
    } as ReturnType<typeof authModule.useAuth>)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  const renderDashboardLayout = (initialPath = '/dashboard') => {
    return render(
      <MemoryRouter initialEntries={[initialPath]}>
        <DashboardLayout>
          <Routes>
            <Route path="/dashboard" element={<div data-testid="dashboard-page">Dashboard Page</div>} />
            <Route path="/clientes" element={<div data-testid="clientes-page">Clientes Page</div>} />
            <Route path="/membresias" element={<div data-testid="membresias-page">Membresias Page</div>} />
            <Route path="/planes" element={<div data-testid="planes-page">Planes Page</div>} />
            <Route path="/pagos" element={<div data-testid="pagos-page">Pagos Page</div>} />
            <Route path="/reportes" element={<div data-testid="reportes-page">Reportes Page</div>} />
            <Route path="/configuracion" element={<div data-testid="configuracion-page">Configuracion Page</div>} />
          </Routes>
        </DashboardLayout>
      </MemoryRouter>,
      { wrapper: createWrapper() }
    )
  }

  describe('Render', () => {
    it('renders sidebar with brand', () => {
      renderDashboardLayout()
      // Logo has alt="Mundo Fitness"
      expect(screen.getByAltText('Mundo Fitness')).toBeInTheDocument()
      // Brand text is in h2
      expect(screen.getByText('Mundo Fitness')).toBeInTheDocument()
    })

    it('renders main content area with id', () => {
      renderDashboardLayout()
      const mainContent = document.getElementById('main-content')
      expect(mainContent).toBeInTheDocument()
    })

    it('renders page title (Dashboard by default)', () => {
      renderDashboardLayout()
      // Page title is in h1 with class page-title - use specific selector
      const pageTitle = screen.getByRole('heading', { level: 1 })
      expect(pageTitle).toHaveTextContent('Dashboard')
    })

    it('renders menu toggle button', () => {
      renderDashboardLayout()
      expect(screen.getByLabelText(/Abrir menú/)).toBeInTheDocument()
    })

    it('renders user info in sidebar footer', () => {
      renderDashboardLayout()
      expect(screen.getByText('Test User')).toBeInTheDocument()
      expect(screen.getByText('admin')).toBeInTheDocument()
    })

    it('renders logout button', () => {
      renderDashboardLayout()
      // Logout button is a button with text "Cerrar sesión"
      const logoutBtn = screen.getByText('Cerrar sesión')
      expect(logoutBtn).toBeInTheDocument()
      expect(logoutBtn.tagName).toBe('BUTTON')
    })
  })

  describe('Navigation Items', () => {
    const navItems = [
      { label: 'Dashboard' },
      { label: 'Clientes' },
      { label: 'Membresías' },
      { label: 'Planes' },
      { label: 'Pagos' },
      { label: 'Reportes' },
      { label: 'Configuración' },
    ]

    it('renders all navigation items', () => {
      renderDashboardLayout()
      navItems.forEach(item => {
        // NavLink wraps text in span.nav-label - check within sidebar nav
        const nav = document.getElementById('sidebar')
        expect(nav?.textContent).toContain(item.label)
      })
    })
  })

  describe('Active Navigation', () => {
    it('shows Dashboard as active by default', () => {
      renderDashboardLayout()
      // NavLink active class is applied - find link with exact text match
      const dashboardLink = screen.getByRole('link', { name: 'Dashboard' })
      expect(dashboardLink).toHaveClass('active')
    })
  })

  describe('Mobile Sidebar', () => {
    it('opens sidebar when menu toggle clicked', () => {
      renderDashboardLayout()
      const sidebar = document.getElementById('sidebar')
      expect(sidebar).not.toHaveClass('open')

      act(() => {
        fireEvent.click(screen.getByLabelText(/Abrir menú/))
      })

      expect(sidebar).toHaveClass('open')
    })

    it('closes sidebar when menu toggle clicked again', () => {
      renderDashboardLayout()
      const sidebar = document.getElementById('sidebar')
      act(() => {
        fireEvent.click(screen.getByLabelText(/Abrir menú/))
      })
      expect(sidebar).toHaveClass('open')

      act(() => {
        fireEvent.click(screen.getByLabelText(/Cerrar menú/))
      })
      expect(sidebar).not.toHaveClass('open')
    })

    it('shows overlay when sidebar open', () => {
      renderDashboardLayout()
      act(() => {
        fireEvent.click(screen.getByLabelText(/Abrir menú/))
      })
      expect(document.querySelector('.sidebar-overlay')).toBeInTheDocument()
    })

    it('closes sidebar when overlay clicked', () => {
      renderDashboardLayout()
      act(() => {
        fireEvent.click(screen.getByLabelText(/Abrir menú/))
      })
      expect(document.getElementById('sidebar')).toHaveClass('open')

      act(() => {
        fireEvent.click(document.querySelector('.sidebar-overlay')!)
      })
      expect(document.getElementById('sidebar')).not.toHaveClass('open')
    })

    it('closes sidebar on Escape key', () => {
      renderDashboardLayout()
      act(() => {
        fireEvent.click(screen.getByLabelText(/Abrir menú/))
      })
      expect(document.getElementById('sidebar')).toHaveClass('open')

      act(() => {
        fireEvent.keyDown(document, { key: 'Escape' })
      })
      expect(document.getElementById('sidebar')).not.toHaveClass('open')
    })
  })

  describe('Accessibility', () => {
    it('has skip link', () => {
      renderDashboardLayout()
      const skipLink = screen.getByText('Saltar al contenido principal')
      expect(skipLink).toBeInTheDocument()
      expect(skipLink).toHaveAttribute('href', '#main-content')
    })

    it('sidebar has proper ARIA label', () => {
      renderDashboardLayout()
      const sidebar = document.getElementById('sidebar')
      expect(sidebar).toHaveAttribute('aria-label', 'Navegación principal')
    })

    it('menu toggle has proper ARIA attributes when closed', () => {
      renderDashboardLayout()
      const toggle = screen.getByLabelText(/Abrir menú/)
      expect(toggle).toHaveAttribute('aria-expanded', 'false')
      expect(toggle).toHaveAttribute('aria-controls', 'sidebar')
    })

    it('menu toggle has proper ARIA attributes when open', () => {
      renderDashboardLayout()
      act(() => {
        fireEvent.click(screen.getByLabelText(/Abrir menú/))
      })
      const toggle = screen.getByLabelText(/Cerrar menú/)
      expect(toggle).toHaveAttribute('aria-expanded', 'true')
      expect(toggle).toHaveAttribute('aria-controls', 'sidebar')
    })

    it('logout button has aria-label', () => {
      renderDashboardLayout()
      const logoutBtn = screen.getByText('Cerrar sesión')
      expect(logoutBtn).toHaveAttribute('aria-label', 'Cerrar sesión')
    })
  })

  describe('Logout', () => {
    it('calls logout on logout click', () => {
      const mockLogout = vi.fn()
      vi.spyOn(authModule, 'useAuth').mockReturnValue({
        user: mockUser,
        isLoading: false,
        isAuthenticated: true,
        login: vi.fn(),
        register: vi.fn(),
        logout: mockLogout,
        refreshUser: vi.fn(),
        updateUser: vi.fn(),
      } as ReturnType<typeof authModule.useAuth>)

      renderDashboardLayout()

      act(() => {
        fireEvent.click(screen.getByText('Cerrar sesión'))
      })

      expect(mockLogout).toHaveBeenCalled()
    })
  })
})