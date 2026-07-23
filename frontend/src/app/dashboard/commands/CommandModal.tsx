'use client';
import { useEffect, useState } from 'react';
import { X, Save, Plus, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/toggle';
import {
  Category, CATEGORY_LABELS, Permission, PERMISSION_LABELS, Platform,
  CustomCommand, commandValidators, isNameTaken,
} from '@/lib/commands-catalog';

interface CommandModalProps {
  initial: CustomCommand | null;   // null — создание новой команды
  existing: CustomCommand[];       // для проверки уникальности имени
  onClose: () => void;
  onSave: (cmd: CustomCommand) => void;
}

type FormState = Omit<CustomCommand, 'id' | 'createdAt'>;

function emptyForm(): FormState {
  return {
    name: '', description: '', category: 'utility', params: '',
    platforms: ['vk', 'lolka'], vkPrefix: '', lolkaPrefix: '',
    cooldown: 0, permission: 'all', response: '',
    enabled: true, logUsage: true, showInHelp: true,
  };
}

export function CommandModal({ initial, existing, onClose, onSave }: CommandModalProps) {
  const [form, setForm] = useState<FormState>(initial ? { ...initial } : emptyForm());
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setForm(initial ? { ...initial } : emptyForm());
    setErrors({});
  }, [initial]);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm(f => ({ ...f, [key]: value }));

  const togglePlatform = (p: Platform) =>
    setForm(f => ({
      ...f,
      platforms: f.platforms.includes(p) ? f.platforms.filter(x => x !== p) : [...f.platforms, p],
    }));

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    const nameErr = commandValidators.name(form.name);
    if (nameErr) next.name = nameErr;
    else if (isNameTaken(form.name, existing, initial?.id)) next.name = 'Команда с таким названием уже существует';

    const descErr = commandValidators.description(form.description);
    if (descErr) next.description = descErr;

    const cooldownErr = commandValidators.cooldown(form.cooldown);
    if (cooldownErr) next.cooldown = cooldownErr;

    const platformsErr = commandValidators.platforms(form.platforms);
    if (platformsErr) next.platforms = platformsErr;

    if (form.platforms.includes('vk') && !form.vkPrefix.trim()) next.vkPrefix = 'Укажите префикс для VK (например: !name или /name)';
    if (form.platforms.includes('lolka') && !form.lolkaPrefix.trim()) next.lolkaPrefix = 'Укажите префикс для Lolka (например: /name)';

    const responseErr = commandValidators.response(form.response);
    if (responseErr) next.response = responseErr;

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    onSave({
      id: initial?.id || crypto.randomUUID(),
      createdAt: initial?.createdAt || new Date().toISOString(),
      ...form,
      name: form.name.toLowerCase(),
    });
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-[rgb(var(--surface))] border border-[rgb(var(--border))] rounded-3xl p-8 max-w-lg w-full relative shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-xl text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text))] hover:bg-[rgb(var(--surface-2))] transition-colors">
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-bold mb-1 flex items-center gap-2 text-[rgb(var(--text))]">
          {initial ? <><Pencil className="w-5 h-5 text-primary" /> Редактирование команды</> : <><Plus className="w-5 h-5 text-primary" /> Новая команда</>}
        </h2>
        <p className="text-[rgb(var(--text-secondary))] text-sm mb-6">
          {initial ? 'Измените параметры команды' : 'Создайте собственную команду для бота'}
        </p>

        <div className="space-y-4">
          {/* Название */}
          <div>
            <label className="block text-sm text-[rgb(var(--text-secondary))] mb-1.5">Название команды *</label>
            <input
              type="text" value={form.name} onChange={e => update('name', e.target.value)}
              placeholder="Например: ban, kick, mute" className="input w-full"
            />
            <p className="text-xs text-[rgb(var(--text-secondary))] mt-1">Используйте только латинские буквы, цифры и подчёркивание</p>
            {errors.name && <p className="text-xs text-red-400 mt-1">⚠️ {errors.name}</p>}
          </div>

          {/* Описание */}
          <div>
            <label className="block text-sm text-[rgb(var(--text-secondary))] mb-1.5">Описание *</label>
            <textarea
              value={form.description} onChange={e => update('description', e.target.value)}
              placeholder="Опишите что делает команда..." rows={2} className="input w-full resize-none"
            />
            <p className="text-xs text-[rgb(var(--text-secondary))] mt-1">Минимум 10 символов. Максимум 200 символов</p>
            {errors.description && <p className="text-xs text-red-400 mt-1">⚠️ {errors.description}</p>}
          </div>

          {/* Параметры */}
          <div>
            <label className="block text-sm text-[rgb(var(--text-secondary))] mb-1.5">Параметры</label>
            <input
              type="text" value={form.params} onChange={e => update('params', e.target.value)}
              placeholder="<user> [причина]" className="input w-full"
            />
            <p className="text-xs text-[rgb(var(--text-secondary))] mt-1">
              💡 Используйте &lt;&gt; для обязательных параметров и [] для опциональных. Пример: /ban &lt;user&gt; [причина] [время]
            </p>
          </div>

          {/* Платформы */}
          <div>
            <label className="block text-sm text-[rgb(var(--text-secondary))] mb-1.5">Платформы</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm text-[rgb(var(--text))] cursor-pointer">
                <input type="checkbox" checked={form.platforms.includes('vk')} onChange={() => togglePlatform('vk')} className="accent-indigo-500" />
                📱 ВКонтакте
              </label>
              <label className="flex items-center gap-2 text-sm text-[rgb(var(--text))] cursor-pointer">
                <input type="checkbox" checked={form.platforms.includes('lolka')} onChange={() => togglePlatform('lolka')} className="accent-indigo-500" />
                💜 Lolka
              </label>
            </div>
            {errors.platforms && <p className="text-xs text-red-400 mt-1">⚠️ {errors.platforms}</p>}
          </div>

          {/* Префиксы — только текстовые/prefix-команды (VK callback-кнопки и настоящие Lolka Slash/Context-Menu недоступны на текущей инфраструктуре) */}
          {form.platforms.includes('vk') && (
            <div>
              <label className="block text-sm text-[rgb(var(--text-secondary))] mb-1.5">Префикс команды в VK</label>
              <input type="text" value={form.vkPrefix} onChange={e => update('vkPrefix', e.target.value)} placeholder="!name или /name" className="input w-full" />
              {errors.vkPrefix && <p className="text-xs text-red-400 mt-1">⚠️ {errors.vkPrefix}</p>}
            </div>
          )}
          {form.platforms.includes('lolka') && (
            <div>
              <label className="block text-sm text-[rgb(var(--text-secondary))] mb-1.5">Префикс команды в Lolka</label>
              <input type="text" value={form.lolkaPrefix} onChange={e => update('lolkaPrefix', e.target.value)} placeholder="/name" className="input w-full" />
              {errors.lolkaPrefix && <p className="text-xs text-red-400 mt-1">⚠️ {errors.lolkaPrefix}</p>}
            </div>
          )}

          {/* Ответ бота */}
          <div>
            <label className="block text-sm text-[rgb(var(--text-secondary))] mb-1.5">Ответ бота *</label>
            <textarea
              value={form.response} onChange={e => update('response', e.target.value)}
              placeholder="Текст, который отправит бот в ответ на команду" rows={2} className="input w-full resize-none"
            />
            {errors.response && <p className="text-xs text-red-400 mt-1">⚠️ {errors.response}</p>}
          </div>

          {/* Кулдаун */}
          <div>
            <label className="block text-sm text-[rgb(var(--text-secondary))] mb-1.5">Кулдаун (секунды)</label>
            <input
              type="number" min={0} max={86400} value={form.cooldown}
              onChange={e => update('cooldown', Number(e.target.value))} placeholder="0" className="input w-full"
            />
            <p className="text-xs text-[rgb(var(--text-secondary))] mt-1">💡 Кулдаун помогает предотвратить спам командами</p>
            {errors.cooldown && <p className="text-xs text-red-400 mt-1">⚠️ {errors.cooldown}</p>}
          </div>

          {/* Права доступа */}
          <div>
            <label className="block text-sm text-[rgb(var(--text-secondary))] mb-1.5">Права доступа</label>
            <select value={form.permission} onChange={e => update('permission', e.target.value as Permission)} className="input w-full cursor-pointer">
              {(Object.keys(PERMISSION_LABELS) as Permission[]).map(p => (
                <option key={p} value={p}>{PERMISSION_LABELS[p]}</option>
              ))}
            </select>
          </div>

          {/* Категория */}
          <div>
            <label className="block text-sm text-[rgb(var(--text-secondary))] mb-1.5">Категория</label>
            <select value={form.category} onChange={e => update('category', e.target.value as Category)} className="input w-full cursor-pointer">
              {(Object.keys(CATEGORY_LABELS) as Category[]).map(c => (
                <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
              ))}
            </select>
          </div>

          {/* Доп. настройки */}
          <div className="space-y-3 pt-1">
            <div className="flex justify-between items-center">
              <span className="text-sm text-[rgb(var(--text))]">Логировать использование</span>
              <Switch checked={form.logUsage} onCheckedChange={v => update('logUsage', v)} />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-[rgb(var(--text))]">Показывать в списке помощи (/help)</span>
              <Switch checked={form.showInHelp} onCheckedChange={v => update('showInHelp', v)} />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-[rgb(var(--text))]">Команда активна</span>
              <Switch checked={form.enabled} onCheckedChange={v => update('enabled', v)} />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-7">
          <Button variant="outline" onClick={onClose}>❌ Отмена</Button>
          <Button onClick={handleSave} variant="gradient" className="flex items-center gap-1.5">
            <Save className="w-4 h-4" /> Сохранить
          </Button>
        </div>
      </div>
    </div>
  );
}
