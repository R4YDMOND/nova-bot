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

export function useLeaderboard(serverId: string, platform: 'vk' | 'lolka' = 'vk', sort: 'xp' | 'level' | 'messages' = 'xp', enabled: boolean = true) {
  return useQuery({
    queryKey: ['ranking', 'leaderboard', serverId, platform, sort],
    queryFn: () => api.ranking.getLeaderboard(serverId, platform, sort),
    enabled: !!serverId && enabled,
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

export function useFormulaPresets() {
  return useQuery({
    queryKey: ['ranking', 'formula-presets'],
    queryFn: () => api.ranking.getFormulaPresets(),
    staleTime: Infinity, // пресеты статичны, менять их нельзя (см. formulas.py)
  });
}

export function useValidateFormula() {
  return useMutation({
    mutationFn: (formula: import('@/types/ranking').XPFormulaConfig) => api.ranking.validateFormula(formula),
  });
}

export function useRankingChannels(serverId: string, platform: 'vk' | 'lolka' = 'vk') {
  return useQuery({
    queryKey: ['ranking', 'channels', serverId, platform],
    queryFn: () => api.ranking.getChannels(serverId, platform),
    // Подгружается автоматически при наличии serverId — нужно, чтобы сопоставить
    // сохранённый ID канала уведомлений с его названием (см. RankingPage).
    // Кнопка "Автоопределение" по-прежнему дергает refetch() вручную для дропдауна.
    enabled: !!serverId,
    staleTime: 5 * 60 * 1000,
  });
}

// Автоопределение ролей сервера для наград за уровень — только Lolka (у VK нет
// сопоставимого Bot API для чтения ролей сообщества).
export function useRankingRoles(serverId: string, platform: 'vk' | 'lolka' = 'vk') {
  return useQuery({
    queryKey: ['ranking', 'roles', serverId, platform],
    queryFn: () => api.ranking.getRoles(serverId),
    enabled: !!serverId && platform === 'lolka',
    staleTime: 5 * 60 * 1000,
  });
}

export function useSyncMembers() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ serverId, platform }: { serverId: string; platform: 'vk' | 'lolka' }) =>
      api.ranking.syncMembers(serverId, platform),
    onSuccess: (_, { serverId, platform }) => {
      queryClient.invalidateQueries({ queryKey: ['ranking', 'leaderboard', serverId, platform] });
    },
  });
}

// ── ТЗ №5 Rev.6, п.3.2.4: сохранённые шаблоны сообщений ─────────────────
export function useMessageTemplates(serverId: string) {
  return useQuery({
    queryKey: ['ranking', 'templates', serverId],
    queryFn: () => api.templates.list(serverId),
    enabled: !!serverId,
    staleTime: 60 * 1000,
  });
}

export function useSaveMessageTemplate(serverId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ name, data }: { name: string; data: import('@/types/ranking').MessageTemplate }) =>
      api.templates.create(serverId, name, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ranking', 'templates', serverId] });
    },
  });
}

export function useUpdateMessageTemplate(serverId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: number; patch: { name?: string; data?: import('@/types/ranking').MessageTemplate } }) =>
      api.templates.update(id, patch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ranking', 'templates', serverId] });
    },
  });
}

export function useDeleteMessageTemplate(serverId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.templates.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ranking', 'templates', serverId] });
    },
  });
}

// ── ТЗ №5 Rev.7, п.3.1: Nova Points ──────────────────────────────────────
export function useNovaPointsTop(serverId: string, platform: 'vk' | 'lolka' = 'vk', period: 'all' | 'month' | 'week' = 'all', enabled: boolean = true) {
  return useQuery({
    queryKey: ['ranking', 'nova-points', 'top', serverId, platform, period],
    queryFn: () => api.novaPoints.getTop(serverId, platform, period),
    enabled: !!serverId && enabled,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });
}