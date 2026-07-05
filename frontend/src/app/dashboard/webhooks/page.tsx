'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/toggle';
import { Zap, Copy, Trash2, Plus, Send, CheckCircle2, XCircle } from 'lucide-react';

interface WebhookRule {
  id: string;
  name: string;
  eventType: 'message' | 'ban' | 'join' | 'leave';
  targetChannel: string;
  webhookUrl: string;
  active: boolean;
  createdAt: string;
}

const STORAGE_KEY = 'nova-webhook-rules';
const EVENT_LABELS: Record<string, string> = {
  message: '💬 Сообщение',
  ban: '🔨 Бан',
  join: '➕ Вход',
  leave: '➖ Выход',
};
const DEFAULT_CHANNEL: Record<string, string> = {
  message: '#general', ban: '#moderation', join: '#welcome', leave: '#welcome',
};

function genId() { return `rule_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`; }
function validateUrl(url: string): string | null {
  if (!url.trim()) return 'URL обязателен';
  try { const u = new URL(url.trim()); if (u.protocol !== 'https:') return 'URL должен начинаться с https://'; return null; }
  catch { return 'Некорректный URL'; }
}

export default function WebhooksPage() {
  const [rules, setRules] = useState<WebhookRule[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', eventType: 'message' as WebhookRule['eventType'], targetChannel: '#general', webhookUrl: '' });
  const [urlError, setUrlError] = useState<string | null>(null);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'ok' | 'err'>('idle');
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    try { const s = localStorage.getItem(STORAGE_KEY); if (s) setRules(JSON.parse(s)); } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(STORAGE_KEY, JSON.stringify(rules));
  }, [rules, hydrated]);

  function openCreate() {
    setEditingId(null);
    setForm({ name: '', eventType: 'message', targetChannel: '#general', webhookUrl: '' });
    setUrlError(null); setTestStatus('idle'); setShowModal(true);
  }

  function openEdit(r: WebhookRule) {
    setEditingId(r.id);
    setForm({ name: r.name, eventType: r.eventType, targetChannel: r.targetChannel, webhookUrl: r.webhookUrl });
    setUrlError(null); setTestStatus('idle'); setShowModal(true);
  }

  function handleSave() {
    const err = validateUrl(form.webhookUrl);
    setUrlError(err);
    if (err) return;
    if (editingId) {
      setRules(p => p.map(r => r.id === editingId ? { ...r, ...form } : r));
    } else {
      setRules(p => [{ id: genId(), ...form, active: true, createdAt: new Date().toISOString() }, ...p]);
    }
    setShowModal(false);
  }

  function handleDelete(id: string) {
    if (!confirm('Удалить правило?')) return;
    setRules(p => p.filter(r => r.id !== id));
  }

  function handleToggle(id: string) {
    setRules(p => p.map(r => r.id === id ? { ...r, active: !r.active } : r));
  }

  async function handleTest() {
    const err = validateUrl(form.webhookUrl);
    setUrlError(err);
    if (err) return;
    setTestStatus('testing');
    try {
      const res = await fetch(form.webhookUrl.trim(), {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: `🔔 Тест от Nova Bot — правило «${form.name || 'без названия'}»` }),
      });
      setTestStatus(res.ok ? 'ok' : 'err');
    } catch { setTestStatus('err'); }
  }

  function copyUrl(id: string, url: string) {
    navigator.clipboard.writeText(url);
    setCopied(id); setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div className="space-y-8 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Zap className="w-8 h-8 text-cyan-400" /> Вебхуки
          </h1>
          <p className="text-[rgb(var(--text-secondary))] mt-1">Правила маршрутизации событий сервера</p>
        </div>
        <Button onClick={openCreate} className="flex items-center gap-2">
          <Plus className="w-4 h-4" /> Добавить правило
        </Button>
      </div>

      {rules.length === 0 ? (
        <div className="text-center py-16 text-[rgb(var(--text-secondary))]">
          <Zap className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Правил нет. Добавьте первое!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {rules.map(hook => (
            <Card key={hook.id} className="rounded-2xl">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-xl flex items-center justify-center text-xl">🔗</div>
                    <div>
                      <CardTitle className="text-lg">{hook.name || 'Без названия'}</CardTitle>
                      <CardDescription>{hook.targetChannel}</CardDescription>
                    </div>
                  </div>
                  <Badge variant={hook.active ? 'success' : 'secondary'}>
                    {hook.active ? 'Активен' : 'Выключен'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-[rgb(var(--text-secondary))] text-xs mb-1">Событие</p>
                  <span className="text-sm font-medium">{EVENT_LABELS[hook.eventType]}</span>
                </div>
                <div>
                  <p className="text-[rgb(var(--text-secondary))] text-xs mb-1">URL</p>
                  <div className="bg-[rgb(var(--surface-2))] border border-[rgb(var(--border))] px-3 py-2 rounded-xl font-mono text-sm flex items-center justify-between gap-2">
                    <span className="truncate text-[rgb(var(--text-secondary))]">{hook.webhookUrl}</span>
                    <button onClick={() => copyUrl(hook.id, hook.webhookUrl)} className="shrink-0 hover:text-cyan-400 transition-colors">
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                  {copied === hook.id && <p className="text-green-400 text-xs mt-1">✅ Скопировано!</p>}
                </div>
                <div className="pt-3 border-t border-[rgb(var(--border))] flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => openEdit(hook)} className="flex-1">Изменить</Button>
                  <Button variant="ghost" size="sm" onClick={() => handleToggle(hook.id)}>
                    <Switch checked={hook.active} onCheckedChange={() => handleToggle(hook.id)} />
                  </Button>
                  <button onClick={() => handleDelete(hook.id)} className="px-3 py-2 rounded-xl border border-[rgb(var(--border))] text-red-400 hover:bg-red-500/10 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[rgb(var(--surface))] border border-[rgb(var(--border))] rounded-2xl p-6 w-full max-w-md space-y-4">
            <h2 className="text-xl font-semibold">{editingId ? 'Изменить правило' : 'Новое правило'}</h2>

            <div>
              <label className="text-sm font-medium mb-1 block">Название</label>
              <input className="input w-full" placeholder="Уведомления о банах"
                value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Тип события</label>
              <select className="input w-full" value={form.eventType}
                onChange={e => {
                  const t = e.target.value as WebhookRule['eventType'];
                  setForm(f => ({ ...f, eventType: t, targetChannel: f.targetChannel === DEFAULT_CHANNEL[f.eventType] ? DEFAULT_CHANNEL[t] : f.targetChannel }));
                }}>
                {Object.entries(EVENT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Канал назначения</label>
              <input className="input w-full" placeholder="#general"
                value={form.targetChannel} onChange={e => setForm(f => ({ ...f, targetChannel: e.target.value }))} />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Webhook URL</label>
              <input className="input w-full" placeholder="https://discord.com/api/webhooks/..."
                value={form.webhookUrl} onChange={e => { setForm(f => ({ ...f, webhookUrl: e.target.value })); setUrlError(null); setTestStatus('idle'); }} />
              {urlError && <p className="text-red-400 text-sm mt-1">{urlError}</p>}
            </div>

            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" className="gap-1.5"
                onClick={handleTest} disabled={testStatus === 'testing'}>
                <Send className="h-3.5 w-3.5" />
                {testStatus === 'testing' ? 'Отправка...' : 'Тест'}
              </Button>
              {testStatus === 'ok' && <span className="text-sm text-green-400 flex items-center gap-1"><CheckCircle2 className="h-4 w-4" /> Доставлено</span>}
              {testStatus === 'err' && <span className="text-sm text-red-400 flex items-center gap-1"><XCircle className="h-4 w-4" /> Ошибка</span>}
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-[rgb(var(--border))]">
              <Button variant="ghost" onClick={() => setShowModal(false)}>Отмена</Button>
              <Button onClick={handleSave}>{editingId ? 'Сохранить' : 'Создать'}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}