'use client';

/**
 * Редактор шаблона сообщения о покупке в магазине ролей (ТЗ №5 Rev.9, п.12+16).
 * Ширина по концепции визуального оформления (Settings/Forms — max-w-[512px]).
 * Простой текстовый шаблон (без embed/кнопок — это короткое транзакционное сообщение,
 * а не анонс уровня, поэтому редактор здесь не переиспользует тяжёлый MessageTemplateModal).
 */

import { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';

const PLACEHOLDERS = ['{user}', '{item}', '{price}', '{currency}', '{balance}'];

interface ShopPurchaseTemplateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serverId: string;
  platform: 'vk' | 'lolka';
  initialText: string;
  currencyName: string;
  onSave: (text: string) => void;
}

export function ShopPurchaseTemplateModal({
  open, onOpenChange, serverId, platform, initialText, currencyName, onSave,
}: ShopPurchaseTemplateModalProps) {
  const [text, setText] = useState(initialText || '✅ Куплено: {item} (-{price} {currency})');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!serverId || generating) return;
    setError('');
    setGenerating(true);
    try {
      const res = await api.novaPoints.generateShopMessage(serverId, platform);
      if (res.error || !res.text) {
        setError(res.error || 'Не удалось сгенерировать текст');
      } else {
        setText(res.text);
      }
    } catch {
      setError('Не удалось сгенерировать текст');
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = () => {
    onSave(text.trim());
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[512px]">
        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-lg font-semibold">✏️ Сообщение о покупке</h2>
        </div>
        <p className="text-sm text-[rgb(var(--text-secondary))] mb-4">
          Отправляется участнику после покупки товара в магазине командой /shop.
        </p>

        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          rows={4}
          maxLength={500}
          className="input w-full resize-none mb-2"
          placeholder="✅ Куплено: {item} (-{price} {currency})"
        />

        <div className="flex flex-wrap gap-1.5 mb-4">
          {PLACEHOLDERS.map(p => (
            <button
              key={p}
              onClick={() => setText(t => t + p)}
              className="text-xs px-2 py-1 rounded-lg bg-[rgb(var(--surface-2))] border border-[rgb(var(--border))] hover:bg-[rgb(var(--surface-3))] transition-colors font-mono"
              title={`Вставить ${p}`}
            >
              {p}
            </button>
          ))}
        </div>

        {error && <p className="text-sm text-red-400 mb-3">{error}</p>}

        <div className="flex items-center justify-between gap-2">
          <Button onClick={handleGenerate} disabled={generating} variant="outline" size="sm">
            {generating ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Sparkles className="h-4 w-4 mr-1.5" />}
            {generating ? 'Генерация...' : 'Сгенерировать с AI'}
          </Button>
          <Button onClick={handleSave} disabled={!text.trim()} size="sm">
            Сохранить
          </Button>
        </div>
        <p className="text-xs text-[rgb(var(--text-secondary))] mt-2">
          Валюта на этом сервере называется «{currencyName}» — плейсхолдер {'{currency}'} подставит её автоматически.
        </p>
      </DialogContent>
    </Dialog>
  );
}
