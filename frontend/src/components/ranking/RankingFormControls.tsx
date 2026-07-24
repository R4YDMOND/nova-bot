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

/** Мультивыбор ролей сервера с чипами и списком чекбоксов (референс — панель ролей Lolka).
 *  Используется на вкладке "Награды" для полей add_roles/remove_roles (только платформа Lolka). */
export function RoleMultiSelect({
  label,
  roles,
  selected,
  onChange,
  loading,
  error,
}: {
  label: string;
  roles: { id: string; name: string; color: string }[];
  selected: string[];
  onChange: (next: string[]) => void;
  loading?: boolean;
  error?: string;
}) {
  const [open, setOpen] = useState(false);
  const selectedRoles = selected.map(id => roles.find(r => r.id === id)).filter((r): r is { id: string; name: string; color: string } => !!r);

  const toggle = (id: string) =>
    onChange(selected.includes(id) ? selected.filter(x => x !== id) : [...selected, id]);

  return (
    <div className="relative">
      <label className="text-[10px] uppercase tracking-wide text-[rgb(var(--text-secondary))] block mb-1">{label}</label>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="input w-full min-h-[38px] flex items-center flex-wrap gap-1.5 text-left cursor-pointer"
      >
        {selectedRoles.length === 0 ? (
          <span className="text-[rgb(var(--text-secondary))] text-sm">Не выбрано</span>
        ) : (
          selectedRoles.map(r => (
            <span key={r.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-[rgb(var(--surface-3))]">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: r.color }} />
              {r.name}
              <span
                role="button"
                tabIndex={0}
                onClick={e => { e.stopPropagation(); toggle(r.id); }}
                className="text-[rgb(var(--text-secondary))] hover:text-red-400"
              >
                ✕
              </span>
            </span>
          ))
        )}
        <span className="ml-auto text-[rgb(var(--text-secondary))] text-xs shrink-0">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="absolute z-20 mt-1 w-full max-h-52 overflow-y-auto bg-[rgb(var(--surface))] border border-[rgb(var(--border))] rounded-xl shadow-2xl p-1.5">
          {loading ? (
            <p className="text-xs text-center py-3 text-[rgb(var(--text-secondary))]">Загрузка ролей...</p>
          ) : error ? (
            <p className="text-xs text-center py-3 text-red-400">{error}</p>
          ) : roles.length === 0 ? (
            <p className="text-xs text-center py-3 text-[rgb(var(--text-secondary))]">Роли не найдены</p>
          ) : (
            roles.map(r => (
              <label key={r.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-[rgb(var(--surface-2))] cursor-pointer text-sm">
                <input type="checkbox" checked={selected.includes(r.id)} onChange={() => toggle(r.id)} className="accent-cyan-400" />
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: r.color }} />
                <span className="truncate">{r.name}</span>
              </label>
            ))
          )}
        </div>
      )}
    </div>
  );
}

/** Мультивыбор текстовых каналов сервера с чипами и списком чекбоксов — по образцу RoleMultiSelect.
 *  Используется на странице «Команды» для полей allowedChannels/ignoredChannels (только Lolka,
 *  ТЗ №7.1 — у VK нет сопоставимого способа ограничить команду конкретным каналом бесед). */
export function ChannelMultiSelect({
  label,
  channels,
  selected,
  onChange,
  loading,
  error,
}: {
  label: string;
  channels: { id: string; name: string }[];
  selected: string[];
  onChange: (next: string[]) => void;
  loading?: boolean;
  error?: string;
}) {
  const [open, setOpen] = useState(false);
  const selectedChannels = selected.map(id => channels.find(c => c.id === id)).filter((c): c is { id: string; name: string } => !!c);

  const toggle = (id: string) =>
    onChange(selected.includes(id) ? selected.filter(x => x !== id) : [...selected, id]);

  return (
    <div className="relative">
      <label className="text-[10px] uppercase tracking-wide text-[rgb(var(--text-secondary))] block mb-1">{label}</label>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="input w-full min-h-[38px] flex items-center flex-wrap gap-1.5 text-left cursor-pointer"
      >
        {selectedChannels.length === 0 ? (
          <span className="text-[rgb(var(--text-secondary))] text-sm">Все каналы</span>
        ) : (
          selectedChannels.map(c => (
            <span key={c.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-[rgb(var(--surface-3))]">
              <span className="text-[rgb(var(--text-secondary))]">#</span>
              {c.name}
              <span
                role="button"
                tabIndex={0}
                onClick={e => { e.stopPropagation(); toggle(c.id); }}
                className="text-[rgb(var(--text-secondary))] hover:text-red-400"
              >
                ✕
              </span>
            </span>
          ))
        )}
        <span className="ml-auto text-[rgb(var(--text-secondary))] text-xs shrink-0">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="absolute z-20 mt-1 w-full max-h-52 overflow-y-auto bg-[rgb(var(--surface))] border border-[rgb(var(--border))] rounded-xl shadow-2xl p-1.5">
          {loading ? (
            <p className="text-xs text-center py-3 text-[rgb(var(--text-secondary))]">Загрузка каналов...</p>
          ) : error ? (
            <p className="text-xs text-center py-3 text-red-400">{error}</p>
          ) : channels.length === 0 ? (
            <p className="text-xs text-center py-3 text-[rgb(var(--text-secondary))]">Каналы не найдены</p>
          ) : (
            channels.map(c => (
              <label key={c.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-[rgb(var(--surface-2))] cursor-pointer text-sm">
                <input type="checkbox" checked={selected.includes(c.id)} onChange={() => toggle(c.id)} className="accent-cyan-400" />
                <span className="text-[rgb(var(--text-secondary))]">#</span>
                <span className="truncate">{c.name}</span>
              </label>
            ))
          )}
        </div>
      )}
    </div>
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
