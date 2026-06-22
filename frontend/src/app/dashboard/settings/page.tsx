'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input'; // если есть, иначе используй <input className="input" />
import { Label } from '@/components/ui/label'; // если компонент есть
import { Save, User, Bell, Shield, Key } from 'lucide-react';
import { useState } from 'react';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    username: "Администратор",
    emailNotifications: true,
    telegramNotifications: false,
    autoModeration: true,
    apiKeyVisible: false,
  });

  const toggleSetting = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const saveSettings = () => {
    alert('✅ Настройки успешно сохранены!'); // позже заменим на Toast
    console.log('Сохранённые настройки:', settings);
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <User className="w-8 h-8 text-nova-400" />
          Настройки
        </h1>
        <p className="text-[rgb(var(--text-secondary))] mt-2">
          Управление аккаунтом и параметрами бота
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Профиль */}
        <Card>
          <CardHeader>
            <CardTitle>Профиль</CardTitle>
            <CardDescription>Основная информация</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Имя пользователя</Label>
              <Input 
                value={settings.username} 
                onChange={(e) => setSettings(prev => ({...prev, username: e.target.value}))}
              />
            </div>
            <Button onClick={saveSettings} className="w-full">
              <Save className="w-4 h-4 mr-2" />
              Сохранить изменения
            </Button>
          </CardContent>
        </Card>

        {/* Уведомления */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" /> Уведомления
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Email-уведомления</p>
                <p className="text-sm text-[rgb(var(--text-secondary))]">О новых сообщениях и событиях</p>
              </div>
              <Switch 
                checked={settings.emailNotifications} 
                onCheckedChange={() => toggleSetting('emailNotifications')} 
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Telegram-уведомления</p>
                <p className="text-sm text-[rgb(var(--text-secondary))]">Мгновенные оповещения</p>
              </div>
              <Switch 
                checked={settings.telegramNotifications} 
                onCheckedChange={() => toggleSetting('telegramNotifications')} 
              />
            </div>
          </CardContent>
        </Card>

        {/* Безопасность */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" /> Безопасность
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Автомодерация</p>
              </div>
              <Switch 
                checked={settings.autoModeration} 
                onCheckedChange={() => toggleSetting('autoModeration')} 
              />
            </div>

            <div>
              <Label>API Ключ</Label>
              <div className="flex gap-2">
                <Input 
                  type={settings.apiKeyVisible ? "text" : "password"} 
                  value="nova_sk_xxxxxxxxxxxxxxxxxxxxxxxx" 
                  readOnly 
                />
                <Button 
                  variant="secondary" 
                  onClick={() => toggleSetting('apiKeyVisible')}
                >
                  👁
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
