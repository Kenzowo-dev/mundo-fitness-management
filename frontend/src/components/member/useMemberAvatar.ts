
import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../api/client";

export const memberAvatarQueryKey = (userId: number) =>
  ["member-avatar", userId] as const;

export function useMemberAvatar(userId?: number) {
  const avatarQuery = useQuery({
    queryKey: memberAvatarQueryKey(userId ?? 0),
    queryFn: () => api.getOwnAvatar(),
    enabled: userId !== undefined,
    staleTime: 60_000,
  });

  const blob = avatarQuery.data;

  const avatarUrl = useMemo(
    () => (blob ? URL.createObjectURL(blob) : null),
    [blob],
  );

  useEffect(() => {
    return () => {
      if (avatarUrl) URL.revokeObjectURL(avatarUrl);
    };
  }, [avatarUrl]);

  return {
    avatarUrl,
    loading: avatarQuery.isPending && avatarQuery.isFetching,
    error: avatarQuery.isError,
  };
}
