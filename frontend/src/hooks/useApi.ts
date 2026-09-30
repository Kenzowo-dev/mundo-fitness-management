import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import type {
  User,
  Client,
  CreateClientData,
  RegisterData,
  ClientMembership,
  MembershipPlan,
  MembershipRenewalRequest,
  CreatePaymentInput,
  CreateMembershipPlanInput,
  UpdateMembershipPlanInput,
  PaginatedResponse,
  ClientDashboardStats,
  MembershipDashboardStats,
  PaymentDashboardStats,
  ClientReports,
  MembershipReports,
  PaymentReports,
} from '../types/api';

const QUERY_KEYS = {
  user: ['user'] as const,
  clients: (page: number, limit: number, filters?: { status?: string; search?: string }) =>
    ['clients', page, limit, filters] as const,
  client: (id: number) => ['client', id] as const,
  clientByDni: (dni: string) => ['client', 'dni', dni] as const,
  membershipPlans: (activeOnly: boolean) => ['membershipPlans', activeOnly] as const,
  membership: (id: number) => ['membership', id] as const,
  renewalRequests: ['membershipRenewalRequests'] as const,
  myRenewalRequests: ['myMembershipRenewalRequests'] as const,
  clientMemberships: (clientId: number) => ['clientMemberships', clientId] as const,
  allMemberships: ['memberships', 'all'] as const,
  payments: (page: number, limit: number, filters?: { clientId?: number; status?: string }) =>
    ['payments', page, limit, filters] as const,
  payment: (id: number) => ['payment', id] as const,
  invoices: (page: number, limit: number, filters?: { clientId?: number; status?: string }) =>
    ['invoices', page, limit, filters] as const,
  paymentMethods: (clientId: number) => ['paymentMethods', clientId] as const,
  paymentsSummary: (clientId: number) => ['paymentsSummary', clientId] as const,
} as const;

export function useCurrentUser(options?: { enabled?: boolean }) {
  return useQuery<User, Error, User>({
    queryKey: QUERY_KEYS.user,
    queryFn: () => api.getCurrentUser(),
    enabled: api.isAuthenticated() && (options?.enabled ?? true),
    retry: false,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) => api.login(email, password),
    onSuccess: ({ user }) => {
      queryClient.setQueryData(QUERY_KEYS.user, user);
    },
  });
}

export function useRegister() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: RegisterData) => api.register(data),
    onSuccess: ({ user }) => {
      queryClient.setQueryData(QUERY_KEYS.user, user);
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.logout(),
    onSuccess: () => {
      queryClient.setQueryData(QUERY_KEYS.user, null);
      queryClient.clear();
    },
  });
}

export function useUpdateCurrentUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<User>) => api.updateCurrentUser(data),
    onSuccess: (user) => {
      queryClient.setQueryData(QUERY_KEYS.user, user);
    },
  });
}

export function useChangePassword() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }) =>
      api.changePassword(currentPassword, newPassword),
    onSuccess: () => {
      // Password changes revoke server refresh tokens, so require a fresh login.
      queryClient.clear();
    },
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: (email: string) => api.forgotPassword(email),
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: ({ token, newPassword }: { token: string; newPassword: string }) =>
      api.resetPassword(token, newPassword),
  });
}

export function useClients(page = 1, limit = 20, filters?: { status?: string; search?: string }) {
  return useQuery<PaginatedResponse<Client>, Error, PaginatedResponse<Client>>({
    queryKey: QUERY_KEYS.clients(page, limit, filters),
    queryFn: () => api.getClients(page, limit, filters) as Promise<PaginatedResponse<Client>>,
    placeholderData: (prev) => prev,
  });
}

export function useClientDashboardStats() {
  return useQuery<ClientDashboardStats, Error>({
    queryKey: ['dashboardStats', 'clients'],
    queryFn: () => api.getClientDashboardStats(),
  });
}

export function useMembershipDashboardStats() {
  return useQuery<MembershipDashboardStats, Error>({
    queryKey: ['dashboardStats', 'memberships'],
    queryFn: () => api.getMembershipDashboardStats(),
  });
}

export function usePaymentDashboardStats() {
  return useQuery<PaymentDashboardStats, Error>({
    queryKey: ['dashboardStats', 'payments'],
    queryFn: () => api.getPaymentDashboardStats(),
  });
}

export function useClientReports() {
  return useQuery<ClientReports, Error>({
    queryKey: ['reports', 'clients'],
    queryFn: () => api.getClientReports(),
  });
}

export function useMembershipReports() {
  return useQuery<MembershipReports, Error>({
    queryKey: ['reports', 'memberships'],
    queryFn: () => api.getMembershipReports(),
  });
}

export function usePaymentReports() {
  return useQuery<PaymentReports, Error>({
    queryKey: ['reports', 'payments'],
    queryFn: () => api.getPaymentReports(),
  });
}

export function useClient(id: number, enabled = true) {
  return useQuery<Client, Error, Client>({
    queryKey: QUERY_KEYS.client(id),
    queryFn: () => api.getClient(id) as Promise<Client>,
    enabled: enabled && id > 0,
  });
}

export function useClientByDni(dni: string, enabled = true) {
  return useQuery<Client, Error, Client>({
    queryKey: QUERY_KEYS.clientByDni(dni),
    queryFn: () => api.getClientByDni(dni) as Promise<Client>,
    enabled: enabled && dni.length > 0,
  });
}

export function useCreateClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateClientData) => api.createClient(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats', 'clients'] });
    },
  });
}

export function useUpdateClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Client> }) => api.updateClient(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.client(id) });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats', 'clients'] });
    },
  });
}

export function useUpdateOwnClientProfile(userId?: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Pick<Client, 'phone' | 'address' | 'emergencyContactName' | 'emergencyContactPhone'>>) => {
      if (userId === undefined) {
        throw new Error('No se puede actualizar el perfil sin una sesión activa.');
      }
      return api.updateOwnClientProfile(userId, data);
    },
    onSuccess: (client) => {
      if (userId === undefined) return;
      queryClient.setQueryData(['member-portal', 'client', userId], client);
    },
  });
}

export function useDeleteClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.deleteClient(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats', 'clients'] });
    },
  });
}

export function useMembershipPlans(activeOnly = true) {
  return useQuery<MembershipPlan[], Error, MembershipPlan[]>({
    queryKey: QUERY_KEYS.membershipPlans(activeOnly),
    queryFn: () => api.getMembershipPlans(activeOnly) as Promise<MembershipPlan[]>,
  });
}

export function useCreateMembershipPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateMembershipPlanInput) => api.createMembershipPlan(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['membershipPlans'] }),
  });
}

export function useUpdateMembershipPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateMembershipPlanInput }) => api.updateMembershipPlan(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['membershipPlans'] }),
  });
}

export function useMembership(id: number, enabled = true) {
  return useQuery<ClientMembership, Error, ClientMembership>({
    queryKey: QUERY_KEYS.membership(id),
    queryFn: () => api.getMembership(id) as Promise<ClientMembership>,
    enabled: enabled && id > 0,
  });
}

export function useClientMemberships(clientId: number, enabled = true) {
  return useQuery<ClientMembership[], Error, ClientMembership[]>({
    queryKey: QUERY_KEYS.clientMemberships(clientId),
    queryFn: () => api.getClientMemberships(clientId) as Promise<ClientMembership[]>,
    enabled: enabled && clientId > 0,
  });
}

export function useCreateMembership() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<ClientMembership, 'id' | 'plan' | 'createdAt' | 'updatedAt' | 'cancelledAt' | 'cancellationReason'>) =>
      api.createMembership(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.clientMemberships(variables.clientId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.allMemberships });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats', 'memberships'] });
    },
  });
}

export function useMyMembershipRenewalRequests() {
  return useQuery<MembershipRenewalRequest[], Error>({
    queryKey: QUERY_KEYS.myRenewalRequests,
    queryFn: () => api.getMyMembershipRenewalRequests() as Promise<MembershipRenewalRequest[]>,
  });
}

export function useMembershipRenewalRequests() {
  return useQuery<MembershipRenewalRequest[], Error>({
    queryKey: QUERY_KEYS.renewalRequests,
    queryFn: () => api.getMembershipRenewalRequests() as Promise<MembershipRenewalRequest[]>,
  });
}

export function useCreateMembershipRenewalRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { planId: number; memberNote?: string }) => api.createMembershipRenewalRequest(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.myRenewalRequests });
    },
  });
}

export function useUpdateMembershipRenewalRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: { status: 'contacted' | 'closed'; staffNote?: string } }) =>
      api.updateMembershipRenewalRequest(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.renewalRequests });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.myRenewalRequests });
    },
  });
}

export function useUpdateMembership() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<ClientMembership> }) => api.updateMembership(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.membership(id) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.allMemberships });
    },
  });
}

export function useCancelMembership() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason?: string }) => api.cancelMembership(id, reason),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.membership(id) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.allMemberships });
    },
  });
}

export function useCheckIn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { clientId: number; clientMembershipId: number }) => api.checkIn(data),
    onSuccess: (_, { clientId }) => {
      queryClient.invalidateQueries({ queryKey: ['clientVisits', clientId] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats', 'memberships'] });
    },
  });
}

export function useCheckOut() {
  return useMutation({
    mutationFn: (visitId: number) => api.checkOut(visitId),
  });
}

export function useClientVisits(clientId: number, limit = 50, enabled = true) {
  return useQuery({
    queryKey: ['clientVisits', clientId, limit],
    queryFn: () => api.getClientVisits(clientId, limit),
    enabled: enabled && clientId > 0,
  });
}

export function usePayments(page = 1, limit = 20, filters?: { clientId?: number; status?: string }) {
  return useQuery({
    queryKey: QUERY_KEYS.payments(page, limit, filters),
    queryFn: () => api.getPayments(page, limit, filters),
    placeholderData: (prev) => prev,
  });
}

export function usePayment(id: number, enabled = true) {
  return useQuery({
    queryKey: QUERY_KEYS.payment(id),
    queryFn: () => api.getPayment(id),
    enabled: enabled && id > 0,
  });
}

export function useCreatePayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePaymentInput) => api.createPayment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats', 'payments'] });
    },
  });
}

export function useInvoices(page = 1, limit = 20, filters?: { clientId?: number; status?: string }) {
  return useQuery({
    queryKey: QUERY_KEYS.invoices(page, limit, filters),
    queryFn: () => api.getInvoices(page, limit, filters),
    placeholderData: (prev) => prev,
  });
}

export function usePaymentMethods(clientId: number, enabled = true) {
  return useQuery({
    queryKey: QUERY_KEYS.paymentMethods(clientId),
    queryFn: () => api.getClientPaymentMethods(clientId),
    enabled: enabled && clientId > 0,
  });
}

export function useCreatePaymentMethod() {
  return useMutation({
    mutationFn: (data: { clientId: number; type: string; token: string; isDefault?: boolean }) =>
      api.createPaymentMethod(data),
  });
}

export function usePaymentsSummary(clientId: number, enabled = true) {
  return useQuery({
    queryKey: QUERY_KEYS.paymentsSummary(clientId),
    queryFn: () => api.getClientPaymentsSummary(clientId),
    enabled: enabled && clientId > 0,
  });
}

export function useAllMemberships(enabled = true) {
  return useQuery<ClientMembership[], Error>({
    queryKey: QUERY_KEYS.allMemberships,
    queryFn: () => api.getAllMemberships() as Promise<ClientMembership[]>,
    enabled,
  });
}
