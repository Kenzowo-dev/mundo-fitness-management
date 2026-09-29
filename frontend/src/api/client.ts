// Importa los tipos necesarios para las respuestas y peticiones de la API
import type {
  TokenPair,
  ApiError,
  PaginatedResponse,
  User,
  Client,
  CreateClientData,
  RegisterData,
  ClientMembership,
  Payment,
  Invoice,
  WorkoutPlan,
  PlanDay,
  LoggedExercise,
} from '../types/api.js';

// URL base de la API obtenida de las variables de entorno de Vite
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * Cliente API singleton para gestionar peticiones HTTP al backend.
 * Maneja tokens de acceso, refresco automático de tokens y peticiones
 * autenticadas a todos los microservicios a través del API Gateway.
 */
class ApiClient {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  /**
   * Inicializa el cliente cargando los tokens almacenados en localStorage.
   */
  constructor() {
    this.loadTokens();
  }

  /**
   * Carga los tokens de acceso y refresco desde el almacenamiento local.
   * Se llama durante la inicialización del cliente.
   */
  private loadTokens(): void {
    this.accessToken = localStorage.getItem('accessToken');
    this.refreshToken = localStorage.getItem('refreshToken');
  }

  /**
   * Guarda los tokens de acceso y refresco en memoria y en el almacenamiento local.
   * @param tokens - Pares de tokens JWT (acceso y refresco)
   */
  private saveTokens(tokens: TokenPair): void {
    this.accessToken = tokens.accessToken;
    this.refreshToken = tokens.refreshToken;
    localStorage.setItem('accessToken', tokens.accessToken);
    localStorage.setItem('refreshToken', tokens.refreshToken);
  }

  /**
   * Elimina los tokens de memoria y del almacenamiento local.
   * Se utiliza durante el cierre de sesión o cuando el token de refresco falla.
   */
  private clearTokens(): void {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  /**
   * Realiza una petición HTTP a la API con los headers y opciones proporcionados.
   * Incluye automáticamente el token de acceso en el header Authorization.
   * Si recibe un 401 y existe un token de refresco, intenta renovar el token de acceso.
   * @param endpoint - Ruta del endpoint de la API (relativa a API_BASE_URL)
   * @param options - Opciones de la petición (método, body, headers, etc.)
   * @returns Promesa que resuelve con los datos parseados de la respuesta JSON
   */
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.accessToken) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${this.accessToken}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    // Si el token expiró y existe un token de refresco, intentar renovar
    if (response.status === 401 && this.refreshToken) {
      const refreshed = await this.refreshAccessToken();
      if (refreshed) {
        return this.request<T>(endpoint, options);
      }
    }

    if (!response.ok) {
      const error: ApiError = await response.json().catch(() => ({
        error: { message: 'Request failed', code: 'REQUEST_FAILED' },
      }));
      throw new Error(error.error.message);
    }

    // Respuesta sin contenido (ej. DELETE exitoso)
    if (response.status === 204) {
      return undefined as T;
    }

    return response.json();
  }

  /**
   * Renueva el token de acceso usando el token de refresco.
   * Si el refresco falla, limpia los tokens y retorna false.
   * @returns Promesa que resuelve con true si el token se renovó, false en caso contrario
   */
  private async refreshAccessToken(): Promise<boolean> {
    if (!this.refreshToken) return false;

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      });

      if (!response.ok) {
        this.clearTokens();
        return false;
      }

      const tokens: TokenPair = await response.json();
      this.saveTokens(tokens);
      return true;
    } catch {
      this.clearTokens();
      return false;
    }
  }

  /**
   * Inicia sesión con email y contraseña, guarda los tokens y retorna
   * los datos del usuario autenticado.
   * No usa el método interno request() para evitar el reintento automático.
   * @param email - Email del usuario
   * @param password - Contraseña del usuario
   * @returns Promesa con los datos del usuario y los tokens JWT
   */
  async login(email: string, password: string): Promise<{ user: User; tokens: TokenPair }> {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.error.message);
    }

    const { user, tokens } = await response.json();
    this.saveTokens(tokens);
    return { user, tokens };
  }

  /**
   * Registra un nuevo cliente/usuario en el sistema.
   * No usa el método interno request() para evitar el reintento automático.
   * @param data - Datos del cliente a registrar
   * @returns Promesa con los datos del usuario creado y los tokens JWT
   */
  async register(data: RegisterData): Promise<{ user: User; tokens: TokenPair }> {
    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.error.message);
    }

    const { user, tokens } = await response.json();
    this.saveTokens(tokens);
    return { user, tokens };
  }

  /**
   * Cierra la sesión del usuario eliminando los tokens del almacenamiento local
   * y notificando al backend para revocar el token de refresco.
   */
  async logout(): Promise<void> {
    const refreshToken = this.refreshToken;
    this.clearTokens();
    
    if (refreshToken) {
      try {
        await fetch(`${API_BASE_URL}/api/auth/logout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });
      } catch {
        // Ignore errors - tokens are already cleared locally
      }
    }
  }

  /**
   * Obtiene el token de acceso almacenado.
   * @returns El token de acceso o null si no existe
   */
  getAccessToken(): string | null {
    return this.accessToken;
  }

  /**
   * Verifica si el usuario tiene un token de acceso válido.
   * @returns true si existe un token de acceso, false en caso contrario
   */
  isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  // ==================== Endpoints de Autenticación ====================

  /**
   * Obtiene los datos del usuario actualmente autenticado.
   * @returns Promesa con los datos del usuario
   */
  async getCurrentUser(): Promise<User> {
    return this.request('/api/auth/me');
  }

  /**
   * Actualiza los datos del usuario actual.
   * @param data - Campos del usuario a actualizar
   * @returns Promesa con los datos actualizados del usuario
   */
  async updateCurrentUser(data: Partial<User>) {
    return this.request('/api/auth/me', { method: 'PATCH', body: JSON.stringify(data) });
  }

  /**
   * Cambia la contraseña del usuario actual.
   * @param currentPassword - Contraseña actual
   * @param newPassword - Nueva contraseña
   * @returns Promesa con el resultado de la operación
   */
  async changePassword(currentPassword: string, newPassword: string) {
    return this.request('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }

  /**
   * Envía un email de recuperación de contraseña al email proporcionado.
   * @param email - Email al que enviar el enlace de recuperación
   * @returns Promesa con la respuesta del servidor
   */
  async forgotPassword(email: string) {
    return fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
  }

  /**
   * Restablece la contraseña usando el token de recuperación.
   * @param token - Token de recuperación recibido por email
   * @param newPassword - Nueva contraseña a establecer
   * @returns Promesa con la respuesta del servidor
   */
  async resetPassword(token: string, newPassword: string) {
    return fetch(`${API_BASE_URL}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, newPassword }),
    });
  }

  // ==================== Endpoints de Clientes ====================

  /**
   * Obtiene una lista paginada de clientes con filtros opcionales.
   * @param page - Número de página (1-indexado)
   * @param limit - Cantidad de resultados por página
   * @param filters - Filtros opcionales por estado y búsqueda
   * @returns Promesa con la respuesta paginada de clientes
   */
  async getClients(
    page = 1,
    limit = 20,
    filters?: { status?: string; search?: string },
  ) {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (filters?.status) params.append('status', filters.status);
    if (filters?.search) params.append('search', filters.search);
    return this.request<PaginatedResponse<Client>>(`/api/clients?${params}`);
  }

  /**
   * Obtiene los datos de un cliente por su ID.
   * @param id - ID del cliente
   * @returns Promesa con los datos del cliente
   */
  async getClient(id: number) {
    return this.request(`/api/clients/${id}`);
  }

  /**
   * Busca un cliente por su número de DNI.
   * @param dni - Número de DNI del cliente
   * @returns Promesa con los datos del cliente
   */
  async getClientByDni(dni: string) {
    return this.request(`/api/clients/dni/${dni}`);
  }

  /**
   * Crea un nuevo cliente en el sistema.
   * @param data - Datos del cliente a crear
   * @returns Promesa con los datos del cliente creado
   */
  async createClient(data: CreateClientData) {
    return this.request('/api/clients', { method: 'POST', body: JSON.stringify(data) });
  }

  /**
   * Actualiza los datos de un cliente existente.
   * @param id - ID del cliente
   * @param data - Campos a actualizar
   * @returns Promesa con los datos actualizados del cliente
   */
  async updateClient(id: number, data: Partial<Client>) {
    return this.request(`/api/clients/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
  }

  /**
   * Elimina un cliente del sistema por su ID.
   * @param id - ID del cliente
   * @returns Promesa con el resultado de la eliminación
   */
  async deleteClient(id: number) {
    return this.request(`/api/clients/${id}`, { method: 'DELETE' });
  }

  // ==================== Endpoints de Membresías ====================

  /**
   * Obtiene los planes de membresía disponibles.
   * @param activeOnly - Si es true, solo retorna planes activos
   * @returns Promesa con la lista de planes de membresía
   */
  async getMembershipPlans(activeOnly = true) {
    return this.request(`/api/memberships/plans?activeOnly=${activeOnly}`);
  }

  /**
   * Obtiene los detalles de una membresía por su ID.
   * @param id - ID de la membresía
   * @returns Promesa con los datos de la membresía
   */
  async getMembership(id: number) {
    return this.request(`/api/memberships/${id}`);
  }

  /**
   * Obtiene todas las membresías asociadas a un cliente.
   * @param clientId - ID del cliente
   * @returns Promesa con la lista de membresías del cliente
   */
  async getClientMemberships(clientId: number) {
    return this.request(`/api/memberships/client/${clientId}`);
  }

  /**
   * Crea una nueva membresía para un cliente.
   * @param data - Datos de la membresía (sin campos generados)
   * @returns Promesa con los datos de la membresía creada
   */
  async createMembership(
    data: Omit<
      ClientMembership,
      'id' | 'plan' | 'createdAt' | 'updatedAt' | 'cancelledAt' | 'cancellationReason'
    >,
  ) {
    return this.request('/api/memberships', { method: 'POST', body: JSON.stringify(data) });
  }

  /**
   * Actualiza los datos de una membresía existente.
   * @param id - ID de la membresía
   * @param data - Campos a actualizar
   * @returns Promesa con los datos actualizados
   */
  async updateMembership(id: number, data: Partial<ClientMembership>) {
    return this.request(`/api/memberships/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
  }

  /**
   * Cancela una membresía con un motivo opcional.
   * @param id - ID de la membresía a cancelar
   * @param reason - Motivo de la cancelación
   * @returns Promesa con el resultado de la cancelación
   */
  async cancelMembership(id: number, reason?: string) {
    return this.request(`/api/memberships/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ cancellationReason: reason }),
    });
  }

  /**
   * Registra el ingreso (check-in) de un cliente al gimnasio.
   * @param data - Información del cliente y membresía para el ingreso
   * @returns Promesa con el resultado del check-in
   */
  async checkIn(data: { clientId: number; membershipId: number }) {
    return this.request('/api/memberships/visits/check-in', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Registra la salida (check-out) de un visitante del gimnasio.
   * @param visitId - ID del registro de visita
   * @returns Promesa con el resultado del check-out
   */
  async checkOut(visitId: number) {
    return this.request(`/api/memberships/visits/${visitId}/check-out`, { method: 'POST' });
  }

  /**
   * Obtiene el historial de visitas de un cliente.
   * @param clientId - ID del cliente
   * @param limit - Número máximo de visitas a retornar
   * @returns Promesa con la lista de visitas del cliente
   */
  async getClientVisits(clientId: number, limit = 50) {
    return this.request(`/api/memberships/visits/client/${clientId}?limit=${limit}`);
  }

  // ==================== Endpoints de Pagos ====================

  /**
   * Obtiene una lista paginada de pagos con filtros opcionales.
   * @param page - Número de página
   * @param limit - Cantidad de resultados por página
   * @param filters - Filtros opcionales por cliente y estado
   * @returns Promesa con la respuesta paginada de pagos
   */
  async getPayments(
    page = 1,
    limit = 20,
    filters?: { clientId?: number; status?: string },
  ) {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (filters?.clientId) params.append('clientId', String(filters.clientId));
    if (filters?.status) params.append('status', filters.status);
    return this.request<PaginatedResponse<Payment>>(`/api/payments?${params}`);
  }

  /**
   * Obtiene los detalles de un pago por su ID.
   * @param id - ID del pago
   * @returns Promesa con los datos del pago
   */
  async getPayment(id: number) {
    return this.request(`/api/payments/${id}`);
  }

  /**
   * Crea un nuevo registro de pago.
   * @param data - Datos del pago (sin campos generados)
   * @returns Promesa con los datos del pago creado
   */
  async createPayment(data: Omit<Payment, 'id' | 'createdAt' | 'paidAt'>) {
    return this.request('/api/payments', { method: 'POST', body: JSON.stringify(data) });
  }

  /**
   * Obtiene una lista paginada de facturas con filtros opcionales.
   * @param page - Número de página
   * @param limit - Cantidad de resultados por página
   * @param filters - Filtros opcionales por cliente y estado
   * @returns Promesa con la respuesta paginada de facturas
   */
  async getInvoices(
    page = 1,
    limit = 20,
    filters?: { clientId?: number; status?: string },
  ) {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (filters?.clientId) params.append('clientId', String(filters.clientId));
    if (filters?.status) params.append('status', filters.status);
    return this.request<PaginatedResponse<Invoice>>(`/api/payments/invoices?${params}`);
  }

  /**
   * Obtiene los métodos de pago registrados para un cliente.
   * @param clientId - ID del cliente
   * @returns Promesa con la lista de métodos de pago
   */
  async getClientPaymentMethods(clientId: number) {
    return this.request(`/api/payments/methods/${clientId}`);
  }

  /**
   * Crea un nuevo método de pago para un cliente.
   * @param data - Información del método de pago (tipo, token, por defecto)
   * @returns Promesa con el resultado de la creación
   */
  async createPaymentMethod(data: {
    clientId: number;
    type: string;
    token: string;
    isDefault?: boolean;
  }) {
    return this.request('/api/payments/methods', { method: 'POST', body: JSON.stringify(data) });
  }

  /**
   * Obtiene un resumen de pagos de un cliente (adeudos, pagados, pendientes).
   * @param clientId - ID del cliente
   * @returns Promesa con el resumen de pagos del cliente
   */
  async getClientPaymentsSummary(clientId: number) {
    return this.request(`/api/payments/summary/${clientId}`);
  }

  // ==================== Endpoints de Planes de Entrenamiento ====================

  /**
   * Obtiene ejercicios disponibles con filtros opcionales.
   * @param muscleGroup - Grupo muscular para filtrar
   * @param difficulty - Nivel de dificultad para filtrar
   * @returns Promesa con la lista de ejercicios
   */
  async getExercises(muscleGroup?: string, difficulty?: string) {
    const params = new URLSearchParams();
    if (muscleGroup) params.append('muscleGroup', muscleGroup);
    if (difficulty) params.append('difficulty', difficulty);
    return this.request(`/api/plans/exercises?${params}`);
  }

  /**
   * Obtiene los planes de entrenamiento disponibles.
   * @param publicOnly - Si es true, solo retorna planes públicos
   * @returns Promesa con la lista de planes de entrenamiento
   */
  async getWorkoutPlans(publicOnly = false) {
    return this.request(`/api/plans/plans?publicOnly=${publicOnly}`);
  }

  /**
   * Obtiene los detalles de un plan de entrenamiento por su ID.
   * @param id - ID del plan
   * @param includeDays - Si es true, incluye los días y ejercicios del plan
   * @returns Promesa con los datos del plan
   */
  async getPlan(id: number, includeDays = true) {
    return this.request(`/api/plans/plans/${id}?includeDays=${includeDays}`);
  }

  /**
   * Crea un nuevo plan de entrenamiento.
   * @param data - Datos del plan (sin campos generados)
   * @returns Promesa con los datos del plan creado
   */
  async createPlan(
    data: Omit<WorkoutPlan, 'id' | 'createdAt' | 'updatedAt' | 'days'> & {
      days?: Omit<PlanDay, 'id' | 'planId' | 'exercises'>[];
    },
  ) {
    return this.request('/api/plans/plans', { method: 'POST', body: JSON.stringify(data) });
  }

  /**
   * Obtiene los planes de entrenamiento asignados a un cliente.
   * @param clientId - ID del cliente
   * @returns Promesa con la lista de planes del cliente
   */
  async getClientPlans(clientId: number) {
    return this.request(`/api/plans/client/${clientId}`);
  }

  /**
   * Obtiene el plan de entrenamiento activo actualmente asignado a un cliente.
   * @param clientId - ID del cliente
   * @returns Promesa con el plan activo del cliente
   */
  async getActiveClientPlan(clientId: number) {
    return this.request(`/api/plans/client/${clientId}/active`);
  }

  /**
   * Asigna un plan de entrenamiento a un cliente.
   * @param data - Información de la asignación (cliente, plan, fechas, notas)
   * @returns Promesa con el resultado de la asignación
   */
  async assignPlan(data: {
    clientId: number;
    planId: number;
    assignedBy: number;
    startDate: string;
    endDate?: string;
    notes?: string;
  }) {
    return this.request('/api/plans/assign', { method: 'POST', body: JSON.stringify(data) });
  }

  /**
   * Registra una sesión de entrenamiento completada por un cliente.
   * @param data - Datos del entrenamiento (plan, ejercicios realizados, notas)
   * @returns Promesa con el resultado del registro
   */
  async logWorkout(data: {
    clientPlanId: number;
    clientId: number;
    planDayId: number;
    durationMinutes?: number;
    notes?: string;
    rating?: number;
    exercises?: Omit<LoggedExercise, 'id' | 'workoutLogId'>[];
  }) {
    return this.request('/api/plans/logs', { method: 'POST', body: JSON.stringify(data) });
  }

  /**
   * Obtiene el historial de entrenamientos registrados para un plan de cliente.
   * @param clientPlanId - ID del plan de cliente
   * @returns Promesa con la lista de registros de entrenamiento
   */
  async getWorkoutLogs(clientPlanId: number) {
    return this.request(`/api/plans/logs/client-plan/${clientPlanId}`);
  }

  // ==================== Endpoints de Reportes ====================

  /**
   * Obtiene los widgets de dashboard disponibles.
   * @returns Promesa con la lista de widgets
   */
  async getWidgets() {
    return this.request('/api/reports/widgets');
  }

  /**
   * Ejecuta un widget de reporte con los parámetros especificados.
   * @param widgetId - ID del widget a ejecutar
   * @param params - Parámetros opcionales para el widget
   * @returns Promesa con el resultado del widget
   */
  async executeWidget(widgetId: number, params: Record<string, unknown> = {}) {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => queryParams.append(key, String(value)));
    return this.request(`/api/reports/widgets/${widgetId}/execute?${queryParams}`);
  }

  /**
   * Obtiene los dashboards personalizados de un usuario.
   * @param userId - ID del usuario
   * @returns Promesa con la lista de dashboards del usuario
   */
  async getUserDashboards(userId: number) {
    return this.request(`/api/reports/dashboards/user/${userId}`);
  }

  /**
   * Registra un evento analítico en el servicio de reportes.
   * @param eventName - Nombre del evento a registrar
   * @param properties - Propiedades adicionales del evento
   * @returns Promesa con la respuesta del servidor
   */
  async trackEvent(eventName: string, properties: Record<string, unknown> = {}) {
    return fetch(`${API_BASE_URL}/api/reports/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.accessToken ? { Authorization: `Bearer ${this.accessToken}` } : {}),
      },
      body: JSON.stringify({ eventName, properties }),
    });
  }
}

// Instancia singleton del cliente API para uso en toda la aplicación
export const api = new ApiClient();
