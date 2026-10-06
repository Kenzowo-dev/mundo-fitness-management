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
  MembershipPlan,
  PublicMembershipPlan,
  Payment,
  Invoice,
  CreatePaymentInput,
  CreateMembershipPlanInput,
  ClientDashboardStats,
  MembershipDashboardStats,
  PaymentDashboardStats,
  ClientReports,
  MembershipReports,
  PaymentReports,
  UpdateMembershipPlanInput,
} from '../types/api.js';

// URL base de la API obtenida de las variables de entorno de Vite
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const API_ERROR_MESSAGES: Record<number, string> = {
  400: 'Revisa la información ingresada e inténtalo de nuevo.',
  401: 'No pudimos validar tus credenciales o tu sesión venció. Vuelve a intentarlo.',
  403: 'Tu cuenta no tiene permiso para realizar esta acción.',
  404: 'No encontramos la información solicitada. Actualiza la página e inténtalo de nuevo.',
  409: 'La operación entra en conflicto con un registro existente. Revisa los datos e inténtalo de nuevo.',
  422: 'Hay datos que no se pudieron procesar. Revisa la información ingresada.',
  429: 'Se hicieron demasiadas solicitudes. Espera un momento e inténtalo de nuevo.',
  500: 'Ocurrió un problema en el servidor. Inténtalo de nuevo en unos minutos.',
};

const API_ERROR_MESSAGES_BY_CODE: Record<string, string> = {
  INVALID_CREDENTIALS: 'El correo electrónico o la contraseña no son correctos.',
  EMAIL_EXISTS: 'Ya existe una cuenta con ese correo electrónico.',
  EMAIL_ALREADY_REGISTERED: 'Ya existe una cuenta con ese correo electrónico.',
  INVALID_TOKEN: 'El enlace no es válido o venció. Solicita uno nuevo para continuar.',
  INVALID_RESET_TOKEN: 'El enlace no es válido o venció. Solicita uno nuevo para continuar.',
  VALIDATION_ERROR: API_ERROR_MESSAGES[400],
  FORBIDDEN: API_ERROR_MESSAGES[403],
  NOT_FOUND: API_ERROR_MESSAGES[404],
  CONFLICT: API_ERROR_MESSAGES[409],
  RATE_LIMIT_EXCEEDED: API_ERROR_MESSAGES[429],
  INTERNAL_ERROR: API_ERROR_MESSAGES[500],
};

const CONNECTION_ERROR_MESSAGE = 'No se pudo conectar con Mundo Fitness. Comprueba tu conexión e inténtalo de nuevo.';

/**
 * Cliente API singleton para gestionar peticiones HTTP al backend.
 * Maneja tokens de acceso, refresco automático de tokens y peticiones
 * autenticadas a todos los microservicios a través del API Gateway.
 */
class ApiClient {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private refreshPromise: Promise<boolean> | null = null;
  private sessionVersion = 0;

  /**
   * Inicializa el cliente cargando los tokens almacenados en localStorage.
   */
  constructor() {
    this.loadTokens();
  }

  private async fetchResponse(url: string, options: RequestInit): Promise<Response> {
    try {
      return await fetch(url, options);
    } catch {
      throw new Error(CONNECTION_ERROR_MESSAGE);
    }
  }

  private async throwApiError(response: Response): Promise<never> {
    const payload = await response.json().catch(() => null) as ApiError | null;
    const code = payload?.error?.code;
    const message = response.status === 422
      ? API_ERROR_MESSAGES[422]
      : (code && API_ERROR_MESSAGES_BY_CODE[code])
        || API_ERROR_MESSAGES[response.status]
        || 'No se pudo completar la solicitud. Inténtalo de nuevo.';

    throw new Error(message);
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
    this.sessionVersion += 1;
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
    this.sessionVersion += 1;
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

    const response = await this.fetchResponse(`${API_BASE_URL}${endpoint}`, {
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
      await this.throwApiError(response);
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
  private refreshAccessToken(): Promise<boolean> {
    if (!this.refreshToken) return Promise.resolve(false);
    if (this.refreshPromise) return this.refreshPromise;

    this.refreshPromise = this.performTokenRefresh().finally(() => {
      this.refreshPromise = null;
    });
    return this.refreshPromise;
  }

  private async performTokenRefresh(): Promise<boolean> {
    const refreshToken = this.refreshToken;
    const sessionVersion = this.sessionVersion;
    if (!refreshToken) return false;
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        if (sessionVersion === this.sessionVersion) this.clearTokens();
        return false;
      }

      const tokens: TokenPair = await response.json();
      if (sessionVersion !== this.sessionVersion) return false;
      this.saveTokens(tokens);
      return true;
    } catch {
      if (sessionVersion === this.sessionVersion) this.clearTokens();
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
    const response = await this.fetchResponse(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      await this.throwApiError(response);
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
    const response = await this.fetchResponse(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      await this.throwApiError(response);
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
    const accessToken = this.accessToken;
    const refreshToken = this.refreshToken;
    this.clearTokens();
    try {
      if (refreshToken && accessToken) {
        await fetch(`${API_BASE_URL}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ refreshToken }),
        });
      }
    } catch {
      // Local sign-out must still complete when the API is unavailable.
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
    const result = await this.request('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    // The backend revokes every refresh token after a password change.
    this.clearTokens();
    return result;
  }

  /**
   * Envía un email de recuperación de contraseña al email proporcionado.
   * @param email - Email al que enviar el enlace de recuperación
   * @returns Promesa con la respuesta del servidor
   */
  async forgotPassword(email: string) {
    return this.request('/api/auth/forgot-password', {
      method: 'POST',
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
    return this.request('/api/auth/reset-password', {
      method: 'POST',
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

  async getClientDashboardStats() {
    return this.request<ClientDashboardStats>('/api/clients/stats');
  }

  async getClientReports() {
    return this.request<ClientReports>('/api/clients/reports');
  }

  /**
   * Obtiene los datos de un cliente por su ID.
   * @param id - ID del cliente
   * @returns Promesa con los datos del cliente
   */
  async getClient(id: number) {
    return this.request(`/api/clients/${id}`);
  }

  async getClientByUserId(userId: number) {
    return this.request<Client>(`/api/clients/user/${userId}`);
  }

  async updateOwnClientProfile(
    userId: number,
    data: Partial<Pick<Client, 'phone' | 'address' | 'emergencyContactName' | 'emergencyContactPhone'>>,
  ) {
    return this.request<Client>(`/api/clients/user/${userId}`, { method: 'PATCH', body: JSON.stringify(data) });
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
  async getMembershipPlans(activeOnly = true): Promise<MembershipPlan[]> {
    return this.request<MembershipPlan[]>(`/api/memberships/plans?activeOnly=${activeOnly}`);
  }

  async getPublicMembershipPlans(): Promise<PublicMembershipPlan[]> {
    return this.request<PublicMembershipPlan[]>('/api/memberships/plans/public');
  }

  async getMembershipDashboardStats() {
    return this.request<MembershipDashboardStats>('/api/memberships/stats');
  }

  async getMembershipReports() {
    return this.request<MembershipReports>('/api/memberships/reports');
  }

  async createMembershipPlan(data: CreateMembershipPlanInput) {
    return this.request('/api/memberships/plans', { method: 'POST', body: JSON.stringify(data) });
  }

  async updateMembershipPlan(id: number, data: UpdateMembershipPlanInput) {
    return this.request(`/api/memberships/plans/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
  }

  /**
   * Obtiene los detalles de una membresía por su ID.
   * @param id - ID de la membresía
   * @returns Promesa con los datos de la membresía
   */
  async getMembership(id: number): Promise<ClientMembership> {
    return this.request<ClientMembership>(`/api/memberships/${id}`);
  }

  async getAllMemberships(): Promise<ClientMembership[]> {
    return this.request<ClientMembership[]>('/api/memberships');
  }

  /**
   * Obtiene todas las membresías asociadas a un cliente.
   * @param clientId - ID del cliente
   * @returns Promesa con la lista de membresías del cliente
   */
  async getClientMemberships(clientId: number): Promise<ClientMembership[]> {
    return this.request<ClientMembership[]>(`/api/memberships/client/${clientId}`);
  }

  async createMembershipRenewalRequest(data: { planId: number; memberNote?: string }) {
    return this.request('/api/memberships/requests', { method: 'POST', body: JSON.stringify(data) });
  }

  async getMyMembershipRenewalRequests() {
    return this.request('/api/memberships/requests/mine');
  }

  async getMembershipRenewalRequests() {
    return this.request('/api/memberships/requests');
  }

  async updateMembershipRenewalRequest(id: number, data: { status: 'contacted' | 'closed'; staffNote?: string }) {
    return this.request(`/api/memberships/requests/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
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
  async checkIn(data: { clientId: number; clientMembershipId: number }) {
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

  async getPaymentDashboardStats() {
    return this.request<PaymentDashboardStats>('/api/payments/stats');
  }

  async getPaymentReports() {
    return this.request<PaymentReports>('/api/payments/reports');
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
  async createPayment(data: CreatePaymentInput) {
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

  async getClientPayments(clientId: number) {
    return this.request<{ data: Payment[]; pagination: PaginatedResponse<Payment>['pagination'] }>(`/api/payments/client/${clientId}`);
  }

}

// Instancia singleton del cliente API para uso en toda la aplicación
export const api = new ApiClient();
