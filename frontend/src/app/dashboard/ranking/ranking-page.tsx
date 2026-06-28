'use client';
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/toggle';

const API_BASE = 'https://nova-bot-rpsy.onrender.com';
const TABS = [
  { id: 'settings', label: '⚙️ Настройки' },
  { id: 'rewards', label: '🎁 Награды за уровни' },
  { id: 'voice', label: '🎤 Голосовые награды' },
  { id: 'card', label: '🪪 Карточка' },
  { id: 'members', label: '👥 Участники' },
];
const COLORS = ['#22C55E','#3B82F6','#F59E0B','#EF4444','#A855F7','#EC4899','#00E5FF','#14B8A6'];
const CARD_STYLES = [
  { value: 'modern', label: 'Современный' },
  { value: 'minimal', label: 'Минимализм' },
  { value: 'gaming', label: 'Игровой' },
  { value: 'anime', label: 'Аниме' },
  { value: 'cyberpunk', label: 'Киберпанк' },
  { value: 'neon', label: 'Неон' },
];

type XpSource = { name: string; value: number; enabled: boolean };
type Reward = { level: number; role: string; color: string; message?: string };
type VoiceReward = { minutes: number; role: string; color: string };
type Member = { rank?: number; name?: string; avatar?: string; level?: number; xp?: number; messages?: number; voiceHours?: number; reactions?: number };

export default function RankingPage() {
  const [activeTab, setActiveTab] = useState('settings');
  const [saved, setSaved] = useState(false);

  // Settings
  const [xpSources, setXpSources] = useState<XpSource[]>([
    { name: '💬 Сообщение', value: 10, enabled: true },
    { name: '🎤 Голос (мин)', value: 5, enabled: true },
    { name: '👍 Реакция', value: 2, enabled: false },
    { name: '🎉 Ивент', value: 50, enabled: false },
  ]);
  const [multiplier, setMultiplier] = useState(2);
  const [boostChannels, setBoostChannels] = useState('#general, #чат');
  const [boostRoles, setBoostRoles] = useState('@vip, @boost ✨');
  const [notifyChannel, setNotifyChannel] = useState('#уровни 🎯');
  const [notifyMessage, setNotifyMessage] = useState('🎉 {user} достиг {level} уровня!');
  const [pingUser, setPingUser] = useState(true);
  const [blacklistChannels, setBlacklistChannels] = useState('#спам, #флуд');
  const [decayEnabled, setDecayEnabled] = useState(false);
  const [decayDays, setDecayDays] = useState(7);
  const [decayPercent, setDecayPercent] = useState(10);

  // Rewards
  const [rewards, setRewards] = useState<Reward[]>([
    { level: 5, role: '@новичок 🌱', color: '#22C55E', message: 'Добро пожаловать!' },
    { level: 10, role: '@продвинутый 📈', color: '#3B82F6' },
    { level: 25, role: '@эксперт 🏆', color: '#F59E0B' },
    { level: 50, role: '@легенда 👑', color: '#EF4444' },
  ]);
  const [newRewLevel, setNewRewLevel] = useState('');
  const [newRewRole, setNewRewRole] = useState('');
  const [newRewMsg, setNewRewMsg] = useState('');
  const [showAddRew, setShowAddRew] = useState(false);

  // Voice
  const [voiceRewards, setVoiceRewards] = useState<VoiceReward[]>([
    { minutes: 60, role: '@меломан 🎶', color: '#3B82F6' },
    { minutes: 300, role: '@аудиофил 🎝', color: '#F59E0B' },
    { minutes: 1000, role: '@звукореж 🎛️', color: '#A855F7' },
  ]);
  const [newVoiceMin, setNewVoiceMin] = useState('');
  const [newVoiceRole, setNewVoiceRole] = useState('');
  const [showAddVoice, setShowAddVoice] = useState(false);

  // Card
  const [cardBgColor, setCardBgColor] = useState('#111118');
  const [cardAccentColor, setCardAccentColor] = useState('#00E5FF');
  const [cardNickname, setCardNickname] = useState('Пользователь');
  const [cardAvatarUrl, setCardAvatarUrl] = useState('');
  const [cardStyle, setCardStyle] = useState('modern');
  const [cardShowAvatar, setCardShowAvatar] = useState(true);
  const [cardShowXP, setCardShowXP] = useState(true);
  const [cardShowRank, setCardShowRank] = useState(true);
  const [cardShowShare, setCardShowShare] = useState(true);
  const [shareToast, setShareToast] = useState('');

  // Members
  const [members, setMembers] = useState<Member[]>([]);
  const [membersLoading, setMembersLoading] = useState(true);
  const [searchMember, setSearchMember] = useState('');

  useEffect(() => {
    fetch(`${API_BASE}/api/ranking/members`)
      .then(r => r.json())
      .then(d => { setMembers(d.members || []); setMembersLoading(false); })
      .catch(() => setMembersLoading(false));
  }, []);

  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2200); };
  const toggleSource = (i: number) => setXpSources(prev => prev.map((s, j) => j === i ? { ...s, enabled: !s.enabled } : s));
  const addReward = () => {
    if (!newRewLevel || !newRewRole) return;
    setRewards(prev => [...prev, { level: parseInt(newRewLevel), role: newRewRole, color: COLORS[Math.floor(Math.random() * COLORS.length)], message: newRewMsg || undefined }]);
    setNewRewLevel(''); setNewRewRole(''); setNewRewMsg(''); setShowAddRew(false);
  };
  const addVoiceReward = () => {
    if (!newVoiceMin || !newVoiceRole) return;
    setVoiceRewards(prev => [...prev, { minutes: parseInt(newVoiceMin), role: newVoiceRole, color: COLORS[Math.floor(Math.random() * COLORS.length)] }]);
    setNewVoiceMin(''); setNewVoiceRole(''); setShowAddVoice(false);
  };
  const shareCard = () => {
    const text = `🪪 ${cardNickname}\n📊 Уровень: 42\n✨ XP: 15,420\n🚀 Создано в Nova Bot`;
    navigator.clipboard?.writeText(text).then(() => {
      setShareToast('✅ Скопировано!');
      setTimeout(() => setShareToast(''), 2500);
    });
  };

  const filteredMembers = members.filter(m => (m.name || '').toLowerCase().includes(searchMember.toLowerCase()));

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-white">🪪 Система уровней</h1>
          <p className="text-white/50 mt-1">Настройки опыта, наград и рейтинга</p>
        </div>
        <button onClick={save} className={`px-5 py-2.5 rounded-xl font-semibold text-black transition-all ${saved ? 'bg-green-400' : 'bg-cyan-400 hover:bg-cyan-300'}`}>
          {saved ? '✅ Сохранено!' : '💾 Сохранить'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 overflow-x-auto">
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${activeTab === tab.id ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white hover:bg-white/5'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Settings */}
      {activeTab === 'settings' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <h3 className="text-white font-semibold mb-3">📊 Источники XP</h3>
            {xpSources.map((s, i) => (
              <div key={i} className={`mb-3 p-3 bg-white/5 rounded-xl ${!s.enabled ? 'opacity-50' : ''}`}>
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <Switch checked={s.enabled} onCheckedChange={() => toggleSource(i)} />
                    <span className="text-white text-sm">{s.name}</span>
                  </div>
                  <input type="number" value={s.value}
                    onChange={e => setXpSources(prev => prev.map((x, j) => j === i ? { ...x, value: parseInt(e.target.value) || 0 } : x))}
                    className="w-12 text-center px-1 py-0.5 bg-white/10 border border-white/20 rounded text-white text-xs" />
                </div>
                <input type="range" min="1" max="100" value={s.value}
                  onChange={e => setXpSources(prev => prev.map((x, j) => j === i ? { ...x, value: parseInt(e.target.value) } : x))}
                  className="w-full accent-cyan-400 h-1" />
              </div>
            ))}
          </Card>

          <Card className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <h3 className="text-white font-semibold mb-3">🔥 Множители</h3>
            <div className="mb-3">
              <label className="text-white/50 text-xs block mb-1">Буст-каналы</label>
              <input type="text" value={boostChannels} onChange={e => setBoostChannels(e.target.value)}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white text-sm" />
            </div>
            <div className="mb-3">
              <label className="text-white/50 text-xs block mb-1">Буст-роли</label>
              <input type="text" value={boostRoles} onChange={e => setBoostRoles(e.target.value)}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white text-sm" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-white/50">Множитель XP</span>
                <span className="text-cyan-400 font-bold">x{multiplier}</span>
              </div>
              <input type="range" min="1" max="5" step="0.5" value={multiplier} onChange={e => setMultiplier(parseFloat(e.target.value))}
                className="w-full accent-cyan-400" />
            </div>
          </Card>

          <Card className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <h3 className="text-white font-semibold mb-3">🔔 Уведомления</h3>
            <div className="mb-2">
              <label className="text-white/50 text-xs block mb-1">Канал уведомлений</label>
              <input type="text" value={notifyChannel} onChange={e => setNotifyChannel(e.target.value)}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white text-sm" />
            </div>
            <div className="mb-2">
              <label className="text-white/50 text-xs block mb-1">Шаблон: {'{user} {level} {role} {xp}'}</label>
              <textarea value={notifyMessage} onChange={e => setNotifyMessage(e.target.value)} rows={2}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white text-sm font-mono resize-none" />
            </div>
            <div className="flex justify-between items-center mb-3">
              <span className="text-white/70 text-sm">Пинговать</span>
              <Switch checked={pingUser} onCheckedChange={() => setPingUser(!pingUser)} />
            </div>
            <h3 className="text-white font-semibold mb-2">🚫 Ограничения</h3>
            <input type="text" value={blacklistChannels} onChange={e => setBlacklistChannels(e.target.value)}
              placeholder="Каналы без XP" className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white text-sm mb-2" />
            <div className="flex justify-between items-center mb-2">
              <span className="text-white/70 text-sm">Снижение XP</span>
              <Switch checked={decayEnabled} onCheckedChange={() => setDecayEnabled(!decayEnabled)} />
            </div>
            {decayEnabled && (
              <div className="flex gap-2">
                <input type="number" value={decayDays} onChange={e => setDecayDays(parseInt(e.target.value) || 7)} placeholder="Дней"
                  className="flex-1 px-2 py-1.5 bg-white/10 border border-white/20 rounded-xl text-white text-sm" />
                <input type="number" value={decayPercent} onChange={e => setDecayPercent(parseInt(e.target.value) || 10)} placeholder="%"
                  className="flex-1 px-2 py-1.5 bg-white/10 border border-white/20 rounded-xl text-white text-sm" />
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Rewards */}
      {activeTab === 'rewards' && (
        <div>
          <div className="flex justify-end mb-3">
            <button onClick={() => setShowAddRew(!showAddRew)}
              className={`px-4 py-2 rounded-xl font-medium text-sm transition-colors ${showAddRew ? 'bg-white/10 text-white' : 'bg-cyan-400 text-black hover:bg-cyan-300'}`}>
              {showAddRew ? '✕ Отмена' : '+ Добавить награду'}
            </button>
          </div>
          {showAddRew && (
            <div className="flex flex-wrap gap-2 mb-4 p-4 bg-white/5 border border-white/10 rounded-2xl">
              <input type="number" value={newRewLevel} onChange={e => setNewRewLevel(e.target.value)} placeholder="Уровень"
                className="w-24 px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white text-sm" />
              <input type="text" value={newRewRole} onChange={e => setNewRewRole(e.target.value)} placeholder="@роль"
                className="w-36 px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white text-sm" />
              <input type="text" value={newRewMsg} onChange={e => setNewRewMsg(e.target.value)} placeholder="Сообщение (необяз.)"
                className="flex-1 min-w-36 px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white text-sm" />
              <button onClick={addReward} className="px-4 py-2 bg-cyan-400 text-black rounded-xl font-semibold text-sm">Добавить</button>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {rewards.map((r, i) => (
              <div key={i} className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-2xl">
                <span className="px-3 py-1.5 rounded-xl font-bold text-black text-sm" style={{ background: r.color }}>Ур. {r.level}</span>
                <div className="flex-1">
                  <div className="text-white font-medium text-sm">{r.role}</div>
                  {r.message && <div className="text-white/40 text-xs mt-0.5">💬 {r.message}</div>}
                </div>
                <button onClick={() => setRewards(prev => prev.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-300 text-sm">✕</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Voice */}
      {activeTab === 'voice' && (
        <div>
          <div className="flex justify-end mb-3">
            <button onClick={() => setShowAddVoice(!showAddVoice)}
              className={`px-4 py-2 rounded-xl font-medium text-sm transition-colors ${showAddVoice ? 'bg-white/10 text-white' : 'bg-cyan-400 text-black hover:bg-cyan-300'}`}>
              {showAddVoice ? '✕ Отмена' : '+ Добавить'}
            </button>
          </div>
          {showAddVoice && (
            <div className="flex flex-wrap gap-2 mb-4 p-4 bg-white/5 border border-white/10 rounded-2xl">
              <input type="number" value={newVoiceMin} onChange={e => setNewVoiceMin(e.target.value)} placeholder="Минут"
                className="w-24 px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white text-sm" />
              <input type="text" value={newVoiceRole} onChange={e => setNewVoiceRole(e.target.value)} placeholder="@роль"
                className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white text-sm" />
              <button onClick={addVoiceReward} className="px-4 py-2 bg-cyan-400 text-black rounded-xl font-semibold text-sm">Добавить</button>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {voiceRewards.map((r, i) => (
              <div key={i} className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-2xl">
                <span className="px-3 py-1.5 rounded-xl font-bold text-black text-sm" style={{ background: r.color }}>{r.minutes} мин</span>
                <span className="text-white font-medium text-sm flex-1">{r.role}</span>
                <button onClick={() => setVoiceRewards(prev => prev.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-300 text-sm">✕</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Card */}
      {activeTab === 'card' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
            <h3 className="text-white font-semibold">🎨 Дизайн</h3>
            <div>
              <label className="text-white/50 text-xs block mb-1">Цвет фона</label>
              <div className="flex gap-2">
                <input type="color" value={cardBgColor} onChange={e => setCardBgColor(e.target.value)} className="w-10 h-9 rounded-lg cursor-pointer border-0" />
                <input type="text" value={cardBgColor} onChange={e => setCardBgColor(e.target.value)}
                  className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white text-sm" />
              </div>
            </div>
            <div>
              <label className="text-white/50 text-xs block mb-1">Акцентный цвет</label>
              <div className="flex gap-2">
                <input type="color" value={cardAccentColor} onChange={e => setCardAccentColor(e.target.value)} className="w-10 h-9 rounded-lg cursor-pointer border-0" />
                <input type="text" value={cardAccentColor} onChange={e => setCardAccentColor(e.target.value)}
                  className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white text-sm" />
              </div>
            </div>
            <div>
              <label className="text-white/50 text-xs block mb-1">Никнейм</label>
              <input type="text" value={cardNickname} onChange={e => setCardNickname(e.target.value.slice(0, 25))} maxLength={25}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white text-sm" />
            </div>
            <div>
              <label className="text-white/50 text-xs block mb-1">URL аватара</label>
              <input type="text" value={cardAvatarUrl} onChange={e => setCardAvatarUrl(e.target.value)} placeholder="https://..."
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white text-sm" />
            </div>
            <div>
              <label className="text-white/50 text-xs block mb-1">Стиль</label>
              <select value={cardStyle} onChange={e => setCardStyle(e.target.value)}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white text-sm">
                {CARD_STYLES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              {[
                { label: '👤 Аватар', val: cardShowAvatar, set: setCardShowAvatar },
                { label: '📊 Прогресс XP', val: cardShowXP, set: setCardShowXP },
                { label: '🪪 Место', val: cardShowRank, set: setCardShowRank },
                { label: '📤 Поделиться', val: cardShowShare, set: setCardShowShare },
              ].map(item => (
                <div key={item.label} className="flex justify-between items-center">
                  <span className="text-white/70 text-sm">{item.label}</span>
                  <Switch checked={item.val} onCheckedChange={() => item.set(!item.val)} />
                </div>
              ))}
            </div>
          </Card>

          <div>
            <h3 className="text-white font-semibold mb-3">👁️ Предпросмотр</h3>
            <div className="rounded-2xl p-5 max-w-sm" style={{ background: cardBgColor, border: `2px solid ${cardAccentColor}`, boxShadow: `0 0 20px ${cardAccentColor}30` }}>
              {cardShowRank && <div className="mb-3 flex justify-between">
                <span className="text-xs font-bold text-black px-2 py-0.5 rounded-lg" style={{ background: cardAccentColor }}>🪪 #1</span>
                <span className="text-white/50 text-xs">Ур. 42</span>
              </div>}
              <div className="flex items-center gap-3">
                {cardShowAvatar && (
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl overflow-hidden shrink-0" style={{ border: `2px solid ${cardAccentColor}` }}>
                    {cardAvatarUrl ? <img src={cardAvatarUrl} alt="" className="w-full h-full object-cover" /> : '👤'}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-white font-bold text-sm truncate">{cardNickname || 'Пользователь'}</div>
                  {cardShowXP && (
                    <div className="mt-1.5">
                      <div className="flex justify-between text-xs text-white/40 mb-1"><span>XP</span><span>15,420 / 20,000</span></div>
                      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: '77%', background: cardAccentColor }} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-3">
                {[['💬', '2,400'], ['🎤', '120ч'], ['✨', '856']].map(([icon, val]) => (
                  <div key={icon} className="bg-white/5 rounded-lg p-2 text-center">
                    <div className="text-xs text-white/40">{icon}</div>
                    <div className="text-xs font-bold" style={{ color: cardAccentColor }}>{val}</div>
                  </div>
                ))}
              </div>
              {cardShowShare && (
                <div className="mt-3 flex gap-2">
                  <button onClick={shareCard} className="flex-1 py-1.5 rounded-lg text-xs font-bold text-black" style={{ background: cardAccentColor }}>
                    📋 Копировать
                  </button>
                  <a href={`https://vk.com/share.php?url=https://nova-bot-4vmp.vercel.app`} target="_blank" rel="noreferrer"
                    className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-blue-600">VK</a>
                </div>
              )}
              {shareToast && <div className="mt-2 text-center text-xs text-green-400">{shareToast}</div>}
            </div>
          </div>
        </div>
      )}

      {/* Members */}
      {activeTab === 'members' && (
        <div>
          <input type="text" value={searchMember} onChange={e => setSearchMember(e.target.value)}
            placeholder="🔍 Поиск участника..." className="w-full max-w-sm px-4 py-2.5 mb-4 bg-white/5 border border-white/10 rounded-xl text-white text-sm" />
          <Card className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            {membersLoading ? (
              <p className="text-white/50 text-center py-12">⏳ Загрузка...</p>
            ) : members.length === 0 ? (
              <p className="text-white/30 text-center py-12">👥 Нет данных</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    {['#', 'Участник', 'Уровень', 'XP', 'Прогресс'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-white/40 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredMembers.map((m, i) => (
                    <tr key={i} className="border-b border-white/5">
                      <td className="px-4 py-3 font-bold text-yellow-400">#{m.rank ?? i + 1}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{m.avatar || '👤'}</span>
                          <span className="text-white font-medium">{m.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3"><span className="bg-white/10 px-2 py-0.5 rounded-lg text-white font-bold">{m.level ?? 0}</span></td>
                      <td className="px-4 py-3 text-white/50">{(m.xp ?? 0).toLocaleString('ru-RU')}</td>
                      <td className="px-4 py-3">
                        <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-cyan-400 rounded-full" style={{ width: `${Math.min(100, ((m.xp ?? 0) / 30000) * 100)}%` }} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        </div>
      )}

      <div className="flex justify-between mt-8 gap-3 flex-wrap">
        <button onClick={() => {}} className="px-5 py-2.5 rounded-xl font-medium border border-white/10 text-red-400 hover:bg-red-500/10 transition-colors text-sm">
          🔁 Сбросить
        </button>
        <button onClick={save} className={`px-6 py-2.5 rounded-xl font-semibold text-black transition-all ${saved ? 'bg-green-400' : 'bg-cyan-400 hover:bg-cyan-300'}`}>
          {saved ? '✅ Сохранено!' : '💾 Сохранить всё'}
        </button>
      </div>
      {saved && (
        <div className="fixed bottom-6 right-6 bg-green-400 text-black px-5 py-3 rounded-2xl font-semibold shadow-xl z-50 animate-bounce">
          ✅ Все настройки сохранены!
        </div>
      )}
    </div>
  );
}
