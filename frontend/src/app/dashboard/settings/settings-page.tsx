'use client';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/toggle';
import { Save, User, Bell, Shield } from 'lucide-react';

export default function SettingsPage() {
  const [username, setUsername] = useState('Администратор');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [telegramNotifications, setTelegramNotifications] = useState(false);
  const [autoModeration, setAutoModeration] = useState(true);
  const [apiKeyVisible, setApiKeyVisible] = useState(false);
  const [saved, setSaved] = useState(false);

  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2200); };

  return (
    <div className="p-8 max-w-4xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <User className="w-8 h-8 text-cyan-400" />
          Настройки
        </h1>
        <p className="text-white/50 mt-1">Управление аккаунтом и параметрами бота</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile */}
        <Card className="bg-white/5 border border-white/10 rounded-2xl">
          <CardHeader>
            <CardTitle className="text-white">Профиль</CardTitle>
            <CardDescription className="text-white/40">Основная информация</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-white/50 text-sm block mb-1.5">Имя пользователя</label>
              <input
                className="w-full px-3 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-400/50"
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
        <Card className="bg-white/5 border border-white/10 rounded-2xl">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Bell className="w-5 h-5" /> Уведомления
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium text-sm">Email-уведомления</p>
                <p className="text-white/40 text-xs mt-0.5">О новых событиях и сообщениях</p>
              </div>
              <Switch checked={emailNotifications} onCheckedChange={() => setEmailNotifications(!emailNotifications)} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium text-sm">Telegram-уведомления</p>
                <p className="text-white/40 text-xs mt-0.5">Мгновенные оповещения</p>
              </div>
              <Switch checked={telegramNotifications} onCheckedChange={() => setTelegramNotifications(!telegramNotifications)} />
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card className="bg-white/5 border border-white/10 rounded-2xl">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Shield className="w-5 h-5" /> Безопасность
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium text-sm">Автомодерация</p>
                <p className="text-white/40 text-xs mt-0.5">Автоматическая защита сервера</p>
              </div>
              <Switch checked={autoModeration} onCheckedChange={() => setAutoModeration(!autoModeration)} />
            </div>
            <div>
              <label className="text-white/50 text-sm block mb-1.5">API Ключ</label>
              <div className="flex gap-2">
                <input
                  type={apiKeyVisible ? 'text' : 'password'}
                  value="nova_sk_xxxxxxxxxxxxxxxxxxxxxxxx"
                  readOnly
                  className="flex-1 px-3 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white text-sm font-mono focus:outline-none"
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
        <div className="fixed bottom-6 right-6 bg-green-400 text-black px-5 py-3 rounded-2xl font-semibold shadow-xl z-50 animate-bounce">
          ✅ Настройки сохранены!
        </div>
      )}
    </div>
  );
}
