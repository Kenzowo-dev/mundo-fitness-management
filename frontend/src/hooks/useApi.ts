import { useQuery, useMutation, useQueryClient, useQueries } from '@tanstack/react-query';
import { api } from '../api/client';
import type {
  User,
  Client,
  CreateClientData,
  RegisterData,
  Payment,
  WorkoutPlan,
  PlanDay,
  LoggedExercise,
  DashboardWidget,
  ClientMembership,
  MembershipPlan,
  PaginatedResponse,
  WidgetData,
  Exercise,
} from '../types/api';

const QUERY_KEYS = {
  user: ['user'] as const,
  clients: (page: number, limit: number, filters?: { status?: string; search?: string }) =>
    ['clients', page, limit, filters] as const,
  client: (id: number) => ['client', id] as const,
  clientByDni: (dni: string) => ['client', 'dni', dni] as const,
  membershipPlans: (activeOnly: boolean) => ['membershipPlans', activeOnly] as const,
  membership: (id: number) => ['membership', id] as const,
  clientMemberships: (clientId: number) => ['clientMemberships', clientId] as const,
  payments: (page: number, limit: number, filters?: { clientId?: number; status?: string }) =>
    ['payments', page, limit, filters] as const,
  payment: (id: number) => ['payment', id] as const,
  invoices: (page: number, limit: number, filters?: { clientId?: number; status?: string }) =>
    ['invoices', page, limit, filters] as const,
  paymentMethods: (clientId: number) => ['paymentMethods', clientId] as const,
  paymentsSummary: (clientId: number) => ['paymentsSummary', clientId] as const,
  exercises: (muscleGroup?: string, difficulty?: string) => ['exercises', muscleGroup, difficulty] as const,
  workoutPlans: (publicOnly: boolean) => ['workoutPlans', publicOnly] as const,
  workoutPlan: (id: number, includeDays: boolean) => ['workoutPlan', id, includeDays] as const,
  clientPlans: (clientId: number) => ['clientPlans', clientId] as const,
  activeClientPlan: (clientId: number) => ['activeClientPlan', clientId] as const,
  workoutLogs: (clientPlanId: number) => ['workoutLogs', clientPlanId] as const,
  widgets: ['widgets'] as const,
  widget: (widgetId: number, params: Record<string, unknown>) => ['widget', widgetId, params] as const,
  userDashboards: (userId: number) => ['userDashboards', userId] as const,
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
  return useMutation({
    mutationFn: ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }) =>
      api.changePassword(currentPassword, newPassword),
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
    },
  });
}

export function useDeleteClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.deleteClient(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });
}

export function useMembershipPlans(activeOnly = true) {
  return useQuery<MembershipPlan[], Error, MembershipPlan[]>({
    queryKey: QUERY_KEYS.membershipPlans(activeOnly),
    queryFn: () => api.getMembershipPlans(activeOnly) as Promise<MembershipPlan[]>,
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
    },
  });
}

export function useUpdateMembership() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<ClientMembership> }) => api.updateMembership(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.membership(id) });
    },
  });
}

export function useCancelMembership() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason?: string }) => api.cancelMembership(id, reason),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.membership(id) });
    },
  });
}

export function useCheckIn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { clientId: number; membershipId: number }) => api.checkIn(data),
    onSuccess: (_, { clientId }) => {
      queryClient.invalidateQueries({ queryKey: ['clientVisits', clientId] });
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
    mutationFn: (data: Omit<Payment, 'id' | 'createdAt' | 'paidAt'>) => api.createPayment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
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

export function useExercises(muscleGroup?: string, difficulty?: string) {
  return useQuery<Exercise[], Error, Exercise[]>({
    queryKey: QUERY_KEYS.exercises(muscleGroup, difficulty),
    queryFn: () => api.getExercises(muscleGroup, difficulty) as Promise<Exercise[]>,
  });
}

export function useWorkoutPlans(publicOnly = false) {
  return useQuery<WorkoutPlan[], Error, WorkoutPlan[]>({
    queryKey: QUERY_KEYS.workoutPlans(publicOnly),
    queryFn: () => api.getWorkoutPlans(publicOnly) as Promise<WorkoutPlan[]>,
  });
}

export function useWorkoutPlan(id: number, includeDays = true, enabled = true) {
  return useQuery<WorkoutPlan, Error, WorkoutPlan>({
    queryKey: QUERY_KEYS.workoutPlan(id, includeDays),
    queryFn: () => api.getPlan(id, includeDays) as Promise<WorkoutPlan>,
    enabled: enabled && id > 0,
  });
}

export function useCreatePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<WorkoutPlan, 'id' | 'createdAt' | 'updatedAt' | 'days'> & {
      days?: Omit<PlanDay, 'id' | 'planId' | 'exercises'>[];
    }) => api.createPlan(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workoutPlans'] });
    },
  });
}

export function useClientPlans(clientId: number, enabled = true) {
  return useQuery({
    queryKey: QUERY_KEYS.clientPlans(clientId),
    queryFn: () => api.getClientPlans(clientId),
    enabled: enabled && clientId > 0,
  });
}

export function useActiveClientPlan(clientId: number, enabled = true) {
  return useQuery({
    queryKey: QUERY_KEYS.activeClientPlan(clientId),
    queryFn: () => api.getActiveClientPlan(clientId),
    enabled: enabled && clientId > 0,
  });
}

export function useAssignPlan() {
  return useMutation({
    mutationFn: (data: {
      clientId: number;
      planId: number;
      assignedBy: number;
      startDate: string;
      endDate?: string;
      notes?: string;
    }) => api.assignPlan(data),
  });
}

export function useLogWorkout() {
  return useMutation({
    mutationFn: (data: {
      clientPlanId: number;
      clientId: number;
      planDayId: number;
      durationMinutes?: number;
      notes?: string;
      rating?: number;
      exercises?: Omit<LoggedExercise, 'id' | 'workoutLogId'>[];
    }) => api.logWorkout(data),
  });
}

export function useWorkoutLogs(clientPlanId: number, enabled = true) {
  return useQuery({
    queryKey: QUERY_KEYS.workoutLogs(clientPlanId),
    queryFn: () => api.getWorkoutLogs(clientPlanId),
    enabled: enabled && clientPlanId > 0,
  });
}

export function useWidgets() {
  return useQuery<DashboardWidget[], Error, DashboardWidget[]>({
    queryKey: QUERY_KEYS.widgets,
    queryFn: () => api.getWidgets() as Promise<DashboardWidget[]>,
  });
}

export function useWidget(widgetId: number, params: Record<string, unknown> = {}, enabled = true) {
  return useQuery<WidgetData, Error, WidgetData>({
    queryKey: QUERY_KEYS.widget(widgetId, params),
    queryFn: () => api.executeWidget(widgetId, params) as Promise<WidgetData>,
    enabled: enabled && widgetId > 0,
  });
}

export function useUserDashboards(userId: number, enabled = true) {
  return useQuery({
    queryKey: QUERY_KEYS.userDashboards(userId),
    queryFn: () => api.getUserDashboards(userId),
    enabled: enabled && userId > 0,
  });
}

export function useTrackEvent() {
  return useMutation({
    mutationFn: ({ eventName, properties }: { eventName: string; properties: Record<string, unknown> }) =>
      api.trackEvent(eventName, properties),
  });
}

export function useAllClientMemberships(clientIds: number[], enabled = true) {
  return useQueries({
    queries: clientIds.map((clientId) => ({
      queryKey: QUERY_KEYS.clientMemberships(clientId),
      queryFn: () => api.getClientMemberships(clientId) as Promise<ClientMembership[]>,
      enabled: enabled && clientId > 0,
    })),
  });
}

export function useAllWidgets(widgets: DashboardWidget[], enabled = true) {
  return useQueries({
    queries: widgets
      .map((widget) => ({
        queryKey: QUERY_KEYS.widget(widget.id, {}),
        queryFn: () => api.executeWidget(widget.id, {}) as Promise<WidgetData>,
        enabled: enabled && widget.id > 0,
      })),
  });
}