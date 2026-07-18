import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useRankingSettings(serverId: string, platform: 'vk' | 'lolka' = 'vk') {
  return useQuery({
    queryKey: ['ranking', 'settings', serverId, platform],
    queryFn: () => api.ranking.getSettings(serverId, platform),
    enabled: !!serverId,
    staleTime: 5 * 60 * 1000, // 5 минут (настройки меняются редко)
  });
}

export function useSaveRankingSettings() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ serverId, platform, settings }: { serverId: string; platform: 'vk' | 'lolka'; settings: any }) =>
      api.ranking.saveSettings(serverId, platform, settings),
    onSuccess: (_, { serverId, platform }) => {
      // Инвалидируем кэш, чтобы при следующем запросе данные обновились
      queryClient.invalidateQueries({ queryKey: ['ranking', 'settings', serverId, platform] });
      queryClient.invalidateQueries({ queryKey: ['ranking', 'leaderboard', serverId, platform] });
    },
  });
}

export function useLeaderboard(serverId: string, platform: 'vk' | 'lolka' = 'vk', sort: 'xp' | 'level' | 'messages' = 'xp') {
  return useQuery({
    queryKey: ['ranking', 'leaderboard', serverId, platform, sort],
    queryFn: () => api.ranking.getLeaderboard(serverId, platform, sort),
    enabled: !!serverId,
    staleTime: 30 * 1000, // 30 секунд
    refetchInterval: 60 * 1000, // Обновление каждые 60 секунд
  });
}

export function useRankingPreview(serverId: string, platform: 'vk' | 'lolka', userId: string) {
  return useQuery({
    queryKey: ['ranking', 'preview', serverId, platform, userId],
    queryFn: () => api.ranking.getPreview(serverId, platform, userId),
    enabled: !!serverId && !!userId,
    staleTime: 60 * 1000, // 1 минута
  });
}