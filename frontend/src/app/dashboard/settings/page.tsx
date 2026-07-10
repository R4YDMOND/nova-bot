'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/toggle';
import { Save, User, Bell, Shield, Send, Loader2 } from 'lucide-react';
import { api, NotificationSettings } from '@/lib/api';

const DEFAULT_NOTIFICATIONS: NotificationSettings = {
  email: { enabled: true, address: '' },
  vk: { enabled: false, webhook_url: '' },
  max: { enabled: false, webhook_url: '' },
};

export default function SettingsPage() {
  const [username, setUsername] = useState('Администратор');
  const [autoModeration, setAutoModeration] = useState(true);
  const [apiKeyVisible, setApiKeyVisible] = useState(false);
  const [saved, setSaved] = useState(false);

  const [notifications, setNotifications] = useState<NotificationSettings>(DEFAULT_NOTIFICATIONS);
  const [notifLoading, setNotifLoading] = useState(true);
  const [notifSaving, setNotifSaving] = useState(false);
  const [notifError, setNotifError] = useState<string | null>(null);
  const [testStatus, setTestStatus] = useState<Record<string, 'sending' | 'ok' | 'error'>>({});

  useEffect(() => {
    api.notifications.get()
      .then(res => setNotifications(res.settings ?? DEFAULT_NOTIFICATIONS))
      .catch(() => {})
      .finally(() => setNotifLoading(false));
  }, []);

  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2200); };

  const saveNotifications = async () => {
    setNotifSaving(true);
    setNotifError(null);
    try {
      await api.notifications.save({ server_id: 'default', ...notifications });
      setSaved(true);
      setTimeout(() => setSaved(false), 2200);
    } catch {
      setNotifError('Не удалось сохранить настройки уведомлений. Попробуйте ещё раз.');
    } finally {
      setNotifSaving(false);
    }
  };

  const sendTest = async (channel: 'vk' | 'max' | 'email') => {
    setTestStatus(s => ({ ...s, [channel]: 'sending' }));
    try {
      const payload =
        channel === 'email'
          ? { channel, address: notifications.email.address }
          : { channel, webhook_url: notifications[channel].webhook_url };
      const res = await api.notifications.test(payload);
      setTestStatus(s => ({ ...s, [channel]: res.error ? 'error' : 'ok' }));
    } catch {
      setTestStatus(s => ({ ...s, [channel]: 'error' }));
    } finally {
      setTimeout(() => setTestStatus(s => ({ ...s, [channel]: undefined as unknown as 'ok' })), 3000);
    }
  };

  return (
    <div className="p-8 max-w-4xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-[rgb(var(--text))] flex items-center gap-3">
          <User className="w-8 h-8 text-primary" />
          Настройки
        </h1>
        <p className="text-[rgb(var(--text-secondary))] mt-1">Управление аккаунтом и параметрами бота</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile */}
        <Card>
          <CardHeader>
            <CardTitle>Профиль</CardTitle>
            <CardDescription>Основная информация</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-[rgb(var(--text-secondary))] text-sm block mb-1.5">Имя пользователя</label>
              <input
                className="input w-full"
                value={username}
                onChange={e => setUsername(e.target.value)}
              />
            </div>
            <Button onClick={save} className="w-full">
              <Save className="w-4 h-4 mr-2" />
              {saved ? '✅ Сохранено!' : 'Сохранить изменения'}
            </Button>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="lg:row-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" /> Уведомления
            </CardTitle>
            <CardDescription>VK, MAX и Email — Telegram больше не используется</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {notifLoading ? (
              <div className="flex items-center justify-center py-8 text-[rgb(var(--text-secondary))]">
                <Loader2 className="w-5 h-5 animate-spin mr-2" /> Загрузка...
              </div>
            ) : (
              <>
                {/* Email */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[rgb(var(--text))] font-medium text-sm">Email-уведомления</p>
                      <p className="text-[rgb(var(--text-secondary))] text-xs mt-0.5">О новых событиях и сообщениях</p>
                    </div>
                    <Switch
                      checked={notifications.email.enabled}
                      onCheckedChange={() =>
                        setNotifications(n => ({ ...n, email: { ...n.email, enabled: !n.email.enabled } }))
                      }
                    />
                  </div>
                  {notifications.email.enabled && (
                    <div className="flex gap-2">
                      <input
                        type="email"
                        placeholder="you@example.com"
                        value={notifications.email.address}
                        onChange={e =>
                          setNotifications(n => ({ ...n, email: { ...n.email, address: e.target.value } }))
                        }
                        className="input flex-1 text-sm"
                      />
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={!notifications.email.address || testStatus.email === 'sending'}
                        onClick={() => sendTest('email')}
                      >
                        {testStatus.email === 'sending' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      </Button>
                    </div>
                  )}
                  {testStatus.email === 'ok' && <p className="text-green-400 text-xs">✅ Письмо отправлено</p>}
                  {testStatus.email === 'error' && <p className="text-red-400 text-xs">Не удалось отправить</p>}
                </div>

                {/* VK */}
                <div className="space-y-2 pt-2 border-t border-[rgb(var(--border))]">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[rgb(var(--text))] font-medium text-sm">VK-уведомления</p>
                      <p className="text-[rgb(var(--text-secondary))] text-xs mt-0.5">Мгновенные оповещения в VK</p>
                    </div>
                    <Switch
                      checked={notifications.vk.enabled}
                      onCheckedChange={() =>
                        setNotifications(n => ({ ...n, vk: { ...n.vk, enabled: !n.vk.enabled } }))
                      }
                    />
                  </div>
                  {notifications.vk.enabled && (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="https://api.vk.com/callback/..."
                        value={notifications.vk.webhook_url}
                        onChange={e =>
                          setNotifications(n => ({ ...n, vk: { ...n.vk, webhook_url: e.target.value } }))
                        }
                        className="input flex-1 font-mono text-xs"
                      />
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={!notifications.vk.webhook_url || testStatus.vk === 'sending'}
                        onClick={() => sendTest('vk')}
                      >
                        {testStatus.vk === 'sending' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      </Button>
                    </div>
                  )}
                  {testStatus.vk === 'ok' && <p className="text-green-400 text-xs">✅ Отправлено</p>}
                  {testStatus.vk === 'error' && <p className="text-red-400 text-xs">Не удалось отправить</p>}
                </div>

                {/* MAX */}
                <div className="space-y-2 pt-2 border-t border-[rgb(var(--border))]">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[rgb(var(--text))] font-medium text-sm">MAX-уведомления</p>
                      <p className="text-[rgb(var(--text-secondary))] text-xs mt-0.5">Мгновенные оповещения в MAX</p>
                    </div>
                    <Switch
                      checked={notifications.max.enabled}
                      onCheckedChange={() =>
                        setNotifications(n => ({ ...n, max: { ...n.max, enabled: !n.max.enabled } }))
                      }
                    />
                  </div>
                  {notifications.max.enabled && (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="https://max.ru/webhooks/..."
                        value={notifications.max.webhook_url}
                        onChange={e =>
                          setNotifications(n => ({ ...n, max: { ...n.max, webhook_url: e.target.value } }))
                        }
                        className="input flex-1 font-mono text-xs"
                      />
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={!notifications.max.webhook_url || testStatus.max === 'sending'}
                        onClick={() => sendTest('max')}
                      >
                        {testStatus.max === 'sending' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      </Button>
                    </div>
                  )}
                  {testStatus.max === 'ok' && <p className="text-green-400 text-xs">✅ Отправлено</p>}
                  {testStatus.max === 'error' && <p className="text-red-400 text-xs">Не удалось отправить</p>}
                </div>

                {notifError && <p className="text-red-400 text-sm">{notifError}</p>}

                <Button onClick={saveNotifications} disabled={notifSaving} className="w-full">
                  {notifSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  Сохранить уведомления
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" /> Безопасность
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[rgb(var(--text))] font-medium text-sm">Автомодерация</p>
                <p className="text-[rgb(var(--text-secondary))] text-xs mt-0.5">Автоматическая защита сервера</p>
              </div>
              <Switch checked={autoModeration} onCheckedChange={() => setAutoModeration(!autoModeration)} />
            </div>
            <div>
              <label className="text-[rgb(var(--text-secondary))] text-sm block mb-1.5">API Ключ</label>
              <div className="flex gap-2">
                <input
                  type={apiKeyVisible ? 'text' : 'password'}
                  value="nova_sk_xxxxxxxxxxxxxxxxxxxxxxxx"
                  readOnly
                  className="input flex-1 font-mono"
                />
                <Button variant="secondary" size="sm" onClick={() => setApiKeyVisible(!apiKeyVisible)}>
                  {apiKeyVisible ? '🙈' : '👁'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {saved && (
        <div className="fixed bottom-6 right-6 bg-[rgb(var(--success))] text-white px-5 py-3 rounded-2xl font-semibold shadow-xl z-50 animate-bounce">
          ✅ Настройки сохранены!
        </div>
      )}
    </div>
  );
}
