'use client';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/toggle';
import { Save, User, Bell, Shield } from 'lucide-react';

export default function SettingsPage() {
  const [username, setUsername] = useState('Администратор');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [vkNotifications, setVkNotifications] = useState(false);
  const [maxNotifications, setMaxNotifications] = useState(false);
  const [autoModeration, setAutoModeration] = useState(true);
  const [apiKeyVisible, setApiKeyVisible] = useState(false);
  const [saved, setSaved] = useState(false);

  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2200); };

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
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" /> Уведомления
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[rgb(var(--text))] font-medium text-sm">Email-уведомления</p>
                <p className="text-[rgb(var(--text-secondary))] text-xs mt-0.5">О новых событиях и сообщениях</p>
              </div>
              <Switch checked={emailNotifications} onCheckedChange={() => setEmailNotifications(!emailNotifications)} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[rgb(var(--text))] font-medium text-sm">VK-уведомления</p>
                <p className="text-[rgb(var(--text-secondary))] text-xs mt-0.5">Мгновенные оповещения в VK</p>
              </div>
              <Switch checked={vkNotifications} onCheckedChange={() => setVkNotifications(!vkNotifications)} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[rgb(var(--text))] font-medium text-sm">MAX-уведомления</p>
                <p className="text-[rgb(var(--text-secondary))] text-xs mt-0.5">Мгновенные оповещения в MAX</p>
              </div>
              <Switch checked={maxNotifications} onCheckedChange={() => setMaxNotifications(!maxNotifications)} />
            </div>
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
