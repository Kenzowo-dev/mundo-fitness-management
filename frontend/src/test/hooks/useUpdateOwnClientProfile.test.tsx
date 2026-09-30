import { act, renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { api } from '@/api/client';
import { useUpdateOwnClientProfile } from '@/hooks/useApi';

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('useUpdateOwnClientProfile', () => {
  afterEach(() => vi.restoreAllMocks());

  it('does not update a profile without an authenticated user ID', async () => {
    const updateProfile = vi.spyOn(api, 'updateOwnClientProfile').mockResolvedValue({} as never);
    const { result } = renderHook(() => useUpdateOwnClientProfile(), { wrapper: createWrapper() });

    await act(async () => {
      await expect(result.current.mutateAsync({ phone: '+51987654321' })).rejects.toThrow(
        'No se puede actualizar el perfil sin una sesión activa.',
      );
    });

    expect(updateProfile).not.toHaveBeenCalled();
  });
});
