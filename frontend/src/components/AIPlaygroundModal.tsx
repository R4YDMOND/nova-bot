'use client';

/**
 * Playground — модальное окно тестирования AI-промптов админом (ТЗ №9, этап 5.3 / п.10.8).
 * Ширина по концепции визуального оформления (Settings/Forms — max-w-[512px]).
 */

import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Loader2 } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import type { AIProvider, PlaygroundMessage } from '@/types/ai';

interface AIPlaygroundModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serverId: string;
  provider: AIProvider;
  temperature: number;
  systemPrompt: string;
}

export function AIPlaygroundModal({
  open, onOpenChange, serverId, provider, temperature, systemPrompt,
}: AIPlaygroundModalProps) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<PlaygroundMessage[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setError('');
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setInput('');
    setSending(true);
    try {
      const res = await api.ai.testPlayground({
        server_id: serverId, message: text, provider, temperature, systemPrompt,
      });
      if (res.error) {
        setError(res.error);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: res.reply || '' }]);
      }
    } catch {
      setError('Не удалось получить ответ от AI');
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[512px] flex flex-col max-h-[80vh]">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-5 w-5 text-indigo-400" />
          <h2 className="text-lg font-semibold">AI Playground</h2>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 min-h-[240px] max-h-[420px] mb-4 pr-1">
          {messages.length === 0 && (
            <p className="text-sm text-[rgb(var(--text-secondary))]">
              Отправьте тестовое сообщение — ответ придёт с текущими настройками промпта и провайдера.
            </p>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                  m.role === 'user'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-[rgb(var(--surface-2))] border border-[rgb(var(--border))]'
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}
          {sending && (
            <div className="flex justify-start">
              <div className="rounded-2xl px-4 py-2.5 bg-[rgb(var(--surface-2))] border border-[rgb(var(--border))]">
                <Loader2 className="h-4 w-4 animate-spin text-[rgb(var(--text-secondary))]" />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {error && <p className="text-sm text-red-400 mb-2">{error}</p>}

        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), send())}
            placeholder="Тестовое сообщение..."
            className="input flex-1"
          />
          <Button onClick={send} disabled={sending || !input.trim()} size="icon">
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
