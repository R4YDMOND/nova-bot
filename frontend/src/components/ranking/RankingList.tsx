"use client";

import { useRanking } from "@/hooks/useRanking";

export function RankingList() {
  const { data, isLoading, error } = useRanking();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-red-600">
        Ошибка загрузки рейтинга
      </div>
    );
  }

  if (!data || data.members.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">Рейтинг пока пуст</div>
    );
  }

  return (
    <div className="space-y-4">
      {data.members.map((member, index) => (
        <div
          key={index}
          className="flex items-center gap-4 p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 hover:border-purple-500/50 transition-all"
        >
          {/* Rank */}
          <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center">
            {index === 0 ? (
              <span className="text-3xl">🥇</span>
            ) : index === 1 ? (
              <span className="text-3xl"></span>
            ) : index === 2 ? (
              <span className="text-3xl">🥉</span>
            ) : (
              <span className="text-2xl font-bold text-gray-400">
                {member.rank}
              </span>
            )}
          </div>

          {/* Avatar & Name */}
          <div className="flex items-center gap-3 flex-1">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-2xl">
              {member.avatar}
            </div>
            <div>
              <div className="font-semibold text-white">{member.name}</div>
              <div className="text-sm text-gray-400">
                Уровень {member.level}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="hidden md:flex items-center gap-6 text-sm">
            <div className="text-center">
              <div className="text-gray-400">Сообщения</div>
              <div className="font-semibold text-white">{member.messages}</div>
            </div>
            <div className="text-center">
              <div className="text-gray-400">Голос</div>
              <div className="font-semibold text-white">
                {member.voiceHours}ч
              </div>
            </div>
            <div className="text-center">
              <div className="text-gray-400">Реакции</div>
              <div className="font-semibold text-white">{member.reactions}</div>
            </div>
          </div>

          {/* XP */}
          <div className="text-right">
            <div className="text-sm text-gray-400">XP</div>
            <div className="font-bold text-purple-400">
              {member.xp.toLocaleString()}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
