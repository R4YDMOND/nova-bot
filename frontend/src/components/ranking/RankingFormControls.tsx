'use client';

/**
 * Общие мелкие контролы формы настроек рейтинга — вынесены из page.tsx,
 * т.к. Next.js App Router запрещает файлам-страницам (page.tsx) именованные
 * экспорты (только default/metadata/...), что ломало production build
 * ("Hint" is not a valid Page export field).
 * Используются в page.tsx и в MessageTemplateModal.tsx.
 */

import { useState, useEffect } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const HEX_COLOR_RE = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;

/** Значок "?" со всплывающей подсказкой (ТЗ №5 Rev.5, п.3.2.2).
 *  Триггер — кнопка (фокусируемая), поэтому подсказка открывается и по наведению,
 *  и по тапу/фокусу на мобильных устройствах. */
export function Hint({ text }: { text: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label="Подсказка"
          className="inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] leading-none text-[rgb(var(--text-secondary))] border border-[rgb(var(--border))] hover:border-cyan-400 hover:text-cyan-400 transition-colors shrink-0"
        >
          ?
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-[260px] text-xs">{text}</TooltipContent>
    </Tooltip>
  );
}

/** Текстовое HEX-поле рядом с color-пикером: держит локальный черновик ввода,
 *  чтобы промежуточные (пока невалидные) символы не затирались контролируемым value,
 *  и прокидывает наверх только валидные HEX-коды. */
export function HexColorField({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const [draft, setDraft] = useState(value);
  useEffect(() => { setDraft(value); }, [value]);
  return (
    <input
      type="text"
      value={draft}
      onChange={e => {
        const v = e.target.value;
        setDraft(v);
        if (HEX_COLOR_RE.test(v)) onChange(v);
      }}
      placeholder={placeholder}
      maxLength={7}
      className="input flex-1 font-mono text-sm"
    />
  );
}
