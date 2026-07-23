'use client';

/**
 * Редактор шаблона сообщений (ТЗ №5 Rev.6, п.3.2): вкладки "Текст" / "Панель" (Embed) /
 * "Компоненты" (кнопки, select-меню), система переменных, live-превью, валидация лимитов.
 * Переиспользует Hint и HexColorField со страницы /dashboard/ranking.
 */

import { useRef, useState, type ReactNode, type MouseEvent, type ChangeEvent } from 'react';
import {
  Bold, Italic, Underline, Strikethrough, Code, Link2, Heading,
  Plus, Trash2, ChevronUp, ChevronDown, Eye, EyeOff,
  FolderOpen, Save, Download, Upload, Copy, AlertTriangle,
} from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/toggle';
import { Hint, HexColorField } from '@/components/ranking/RankingFormControls';
import type {
  MessageTemplate, MessageEmbed, EmbedField, MessageButton, MessageSelectMenu, ButtonStyle,
} from '@/types/ranking';
import { EMPTY_MESSAGE_TEMPLATE, BUTTON_ACTIONS } from '@/types/ranking';
import { useMessageTemplates, useSaveMessageTemplate, useDeleteMessageTemplate } from '@/hooks/useRanking';

const LIMITS = {
  content: 2000,
  title: 256,
  description: 4096,
  fieldName: 256,
  fieldValue: 1024,
  footerText: 2048,
  authorName: 256,
  buttonLabel: 80,
  maxFields: 25,
  maxButtonsPerRow: 5,
  maxSelectOptions: 25,
};

/** Переменные из ТЗ №5 Rev.6, п.3.2.3 */
const VARIABLES: { group: string; items: { token: string; desc: string }[] }[] = [
  {
    group: 'Участник',
    items: [
      { token: '{user}', desc: 'упоминание участника' },
      { token: '{member.id}', desc: 'ID участника' },
      { token: '{member.name}', desc: 'имя участника' },
      { token: '{member.avatarUrl}', desc: 'URL аватара' },
      { token: '{level}', desc: 'полученный уровень' },
      { token: '{level_word}', desc: 'склонение слова «уровень»' },
      { token: '{xp}', desc: 'текущий опыт' },
      { token: '{next_level_xp}', desc: 'опыт до следующего уровня' },
      { token: '{rank}', desc: 'место в рейтинге' },
    ],
  },
  {
    group: 'Сервер и канал',
    items: [
      { token: '{guild}', desc: 'название сервера' },
      { token: '{guild.iconUrl}', desc: 'URL иконки сервера' },
      { token: '{channel}', desc: 'упоминание канала' },
    ],
  },
  {
    group: 'Платформа',
    items: [
      { token: '{platform}', desc: 'vk / lolka' },
      { token: '{user.tag}', desc: 'тег пользователя (Lolka)' },
      { token: '{user.screenName}', desc: 'короткий адрес (VK)' },
    ],
  },
];

const BUTTON_STYLES: { value: ButtonStyle; label: string; className: string }[] = [
  { value: 'primary', label: 'Primary', className: 'bg-cyan-400 text-black' },
  { value: 'secondary', label: 'Secondary', className: 'bg-[rgb(var(--surface-3))] text-[rgb(var(--text))]' },
  { value: 'success', label: 'Success', className: 'bg-emerald-500 text-white' },
  { value: 'danger', label: 'Danger', className: 'bg-red-500 text-white' },
  { value: 'link', label: 'Link', className: 'bg-transparent border border-[rgb(var(--border))] text-[rgb(var(--text))]' },
];

let uidCounter = 0;
const uid = () => `${Date.now().toString(36)}${(uidCounter++).toString(36)}`;

function CharCounter({ value, max }: { value: string; max: number }) {
  const over = value.length > max;
  return <span className={`text-[10px] ${over ? 'text-red-400' : 'text-[rgb(var(--text-secondary))]'}`}>{value.length}/{max}</span>;
}

/** Простой inline-рендер markdown (**bold**, *italic*, __underline__, ~~strike~~, `code`) для превью */
function renderInlineMarkdown(text: string): string {
  return text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
    .replace(/__(.+?)__/g, '<u>$1</u>')
    .replace(/~~(.+?)~~/g, '<s>$1</s>')
    .replace(/\*(.+?)\*/g, '<i>$1</i>')
    .replace(/`(.+?)`/g, '<code class="px-1 rounded bg-black/30 font-mono text-[0.9em]">$1</code>')
    .replace(/\n/g, '<br/>');
}

function wrapSelection(el: HTMLTextAreaElement | null, before: string, after: string, value: string, onChange: (v: string) => void) {
  if (!el) { onChange(value + before + after); return; }
  const start = el.selectionStart ?? value.length;
  const end = el.selectionEnd ?? value.length;
  const next = value.slice(0, start) + before + value.slice(start, end) + after + value.slice(end);
  onChange(next);
  requestAnimationFrame(() => { el.focus(); el.setSelectionRange(start + before.length, end + before.length); });
}

export function MessageTemplateModal({
  open,
  onOpenChange,
  value,
  onSave,
  serverId,
  platform,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value?: MessageTemplate;
  onSave: (template: MessageTemplate) => void;
  serverId?: string;
  /** Активная платформа страницы (effectivePlatform из page.tsx). НЕ переключается внутри
   * модалки: notify_template в БД хранится раздельно на VK и Lolka (RankingSettings —
   * UniqueConstraint server_id+platform), это два независимых шаблона в двух разных
   * записях. Общий переключатель внутри редактора создавал бы у пользователя ложное
   * впечатление, что он настраивает вторую платформу, а сохранение на деле всегда идёт
   * в текущую активную запись (ту, что выбрана на странице). */
  platform: 'lolka' | 'vk';
}) {
  const [draft, setDraft] = useState<MessageTemplate>(value ?? EMPTY_MESSAGE_TEMPLATE);
  const [tab, setTab] = useState<'text' | 'panel' | 'components'>('text');
  const isVk = platform === 'vk';
  const [showPreview, setShowPreview] = useState(true);
  const [varMenuOpen, setVarMenuOpen] = useState(false);
  const [actionMessage, setActionMessage] = useState('');
  const contentRef = useRef<HTMLTextAreaElement | null>(null);
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const lastFocusedRef = useRef<{ el: HTMLTextAreaElement | HTMLInputElement | null; set: (v: string) => void }>({ el: null, set: () => {} });

  // Сохранённые шаблоны (ТЗ №5 Rev.6, п.3.2.4)
  const { data: templatesData } = useMessageTemplates(serverId ?? '');
  const saveTemplateMutation = useSaveMessageTemplate(serverId ?? '');
  const deleteTemplateMutation = useDeleteMessageTemplate(serverId ?? '');
  const savedTemplates = templatesData?.templates ?? [];

  const flashMessage = (text: string) => {
    setActionMessage(text);
    setTimeout(() => setActionMessage(''), 3000);
  };

  const handleSaveAsTemplate = () => {
    if (!serverId) return;
    const name = window.prompt('Название шаблона:');
    if (!name || !name.trim()) return;
    saveTemplateMutation.mutate({ name: name.trim(), data: draft }, {
      onSuccess: () => flashMessage('Шаблон сохранён'),
      onError: () => flashMessage('Не удалось сохранить шаблон'),
    });
  };

  const handleLoadTemplate = (data: MessageTemplate) => {
    setDraft(data);
    flashMessage('Шаблон загружен');
  };

  const handleDeleteTemplate = (id: number, e: MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Удалить сохранённый шаблон?')) return;
    deleteTemplateMutation.mutate(id);
  };

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(draft, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'nova-template.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJson = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (typeof parsed !== 'object' || parsed === null || !('content' in parsed)) {
          throw new Error('invalid shape');
        }
        setDraft({ ...EMPTY_MESSAGE_TEMPLATE, ...parsed });
        flashMessage('Шаблон импортирован');
      } catch {
        flashMessage('Файл повреждён или это не шаблон Nova');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(draft, null, 2))
      .then(() => flashMessage('Скопировано в буфер обмена'))
      .catch(() => flashMessage('Не удалось скопировать'));
  };

  // Синхронизация черновика при повторном открытии с новым значением
  const [lastOpen, setLastOpen] = useState(open);
  if (open !== lastOpen) {
    setLastOpen(open);
    if (open) setDraft(value ?? EMPTY_MESSAGE_TEMPLATE);
  }

  const updateEmbed = (patch: Partial<MessageEmbed>) => setDraft(d => ({ ...d, embed: { ...d.embed, ...patch } }));
  const updateField = <F extends string>(field: F, val: string, target: HTMLTextAreaElement | HTMLInputElement | null, setter: (v: string) => void) => {
    setter(val);
    lastFocusedRef.current = { el: target, set: setter };
  };

  const insertVariable = (token: string) => {
    const { el, set } = lastFocusedRef.current;
    if (el) {
      const start = el.selectionStart ?? el.value.length;
      const end = el.selectionEnd ?? el.value.length;
      const next = el.value.slice(0, start) + token + el.value.slice(end);
      set(next);
      requestAnimationFrame(() => { el.focus(); el.setSelectionRange(start + token.length, start + token.length); });
    } else {
      // По умолчанию — в основной текст сообщения
      setDraft(d => ({ ...d, content: d.content + token }));
    }
    setVarMenuOpen(false);
  };

  // --- Поля Embed (Fields) ---
  const addField = () => {
    if (draft.embed.fields.length >= LIMITS.maxFields) return;
    updateEmbed({ fields: [...draft.embed.fields, { name: '', value: '', inline: false }] });
  };
  const updateFieldAt = (i: number, patch: Partial<EmbedField>) =>
    updateEmbed({ fields: draft.embed.fields.map((f, idx) => (idx === i ? { ...f, ...patch } : f)) });
  const removeField = (i: number) => updateEmbed({ fields: draft.embed.fields.filter((_, idx) => idx !== i) });
  const moveField = (i: number, dir: -1 | 1) => {
    const next = [...draft.embed.fields];
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    updateEmbed({ fields: next });
  };

  // --- Кнопки ---
  const addButton = () => {
    if (draft.buttons.length >= 25) return;
    const rowCounts = [0, 0, 0, 0, 0];
    draft.buttons.forEach(b => { rowCounts[b.row] = (rowCounts[b.row] ?? 0) + 1; });
    const row = rowCounts.findIndex(c => c < LIMITS.maxButtonsPerRow);
    setDraft(d => ({ ...d, buttons: [...d.buttons, { id: uid(), label: 'Кнопка', style: 'primary', emoji: '', url: '', custom_id: 'nova_profile', row: row === -1 ? 0 : row }] }));
  };
  const updateButton = (i: number, patch: Partial<MessageButton>) =>
    setDraft(d => ({ ...d, buttons: d.buttons.map((b, idx) => (idx === i ? { ...b, ...patch } : b)) }));
  const removeButton = (i: number) => setDraft(d => ({ ...d, buttons: d.buttons.filter((_, idx) => idx !== i) }));

  // --- Select-меню (одно на шаблон, до 25 опций) ---
  const selectMenu = draft.select_menus[0];
  const setSelectMenu = (next: MessageSelectMenu | undefined) => setDraft(d => ({ ...d, select_menus: next ? [next] : [] }));
  const addSelectMenu = () => setSelectMenu({ id: uid(), placeholder: 'Выберите вариант', min_values: 1, max_values: 1, options: [], row: 0 });
  const addSelectOption = () => {
    if (!selectMenu || selectMenu.options.length >= LIMITS.maxSelectOptions) return;
    setSelectMenu({ ...selectMenu, options: [...selectMenu.options, { label: '', value: '', description: '', emoji: '' }] });
  };
  const updateSelectOption = (i: number, patch: Partial<{ label: string; value: string; description: string; emoji: string }>) => {
    if (!selectMenu) return;
    setSelectMenu({ ...selectMenu, options: selectMenu.options.map((o, idx) => (idx === i ? { ...o, ...patch } : o)) });
  };
  const removeSelectOption = (i: number) => {
    if (!selectMenu) return;
    setSelectMenu({ ...selectMenu, options: selectMenu.options.filter((_, idx) => idx !== i) });
  };

  const buttonRowWarning = (() => {
    const counts = [0, 0, 0, 0, 0];
    draft.buttons.forEach(b => { counts[b.row] = (counts[b.row] ?? 0) + 1; });
    return counts.some(c => c > LIMITS.maxButtonsPerRow);
  })();

  const errors: string[] = [];
  if (draft.content.length > LIMITS.content) errors.push('Текст сообщения превышает лимит символов');
  if (draft.embed_enabled) {
    if (draft.embed.title.length > LIMITS.title) errors.push('Заголовок панели превышает лимит');
    if (draft.embed.description.length > LIMITS.description) errors.push('Описание панели превышает лимит');
    if (draft.embed.fields.length > LIMITS.maxFields) errors.push('Слишком много полей панели');
    if (draft.embed.color && !/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(draft.embed.color)) errors.push('Некорректный HEX-цвет панели');
  }
  if (buttonRowWarning) errors.push('В одном ряду не может быть больше 5 кнопок');

  return (
    // Встроенная (не модальная) панель: раскрывается вниз внутри вкладки "Настройки",
    // не перекрывая остальные карточки настроек (Правка.jpg). Анимация — на чистом
    // Tailwind (grid-template-rows 0fr → 1fr), без новых зависимостей, как и у Dialog.
    <div className={`grid transition-[grid-template-rows] duration-300 ease-out ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
      <div className="overflow-hidden">
        <div
          className={`mt-3 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] shadow-lg max-h-[88vh] overflow-y-auto transition-opacity duration-300 ${open ? 'opacity-100 delay-100' : 'opacity-0'}`}
        >
          <div className="flex flex-col">
          {/* Верхняя панель */}
          <div className="flex items-center justify-between border-b border-[rgb(var(--border))] px-5 py-3 sticky top-0 bg-[rgb(var(--surface))] z-10">
            <div className="flex gap-1">
              {([
                { id: 'text', label: '📝 Текст' },
                { id: 'panel', label: '🖼️ Панель' },
                { id: 'components', label: '🧩 Компоненты' },
              ] as const).map(t => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === t.id ? 'bg-cyan-400 text-black' : 'text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--surface-2))]'}`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              {actionMessage && <span className="text-xs text-cyan-400">{actionMessage}</span>}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--surface-2))] transition-colors">
                    <FolderOpen className="w-4 h-4" />
                    Шаблоны
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-72 p-2">
                  {serverId && (
                    <>
                      <DropdownMenuItem onClick={handleSaveAsTemplate} className="gap-2 py-2">
                        <Save className="w-3.5 h-3.5" /> Сохранить как...
                      </DropdownMenuItem>
                      {savedTemplates.length > 0 && (
                        <div className="max-h-48 overflow-y-auto my-1 border-y border-[rgb(var(--border))]">
                          {savedTemplates.map(t => (
                            <div
                              key={t.id}
                              onClick={() => handleLoadTemplate(t.data)}
                              className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg cursor-pointer hover:bg-[rgb(var(--surface-2))] text-sm"
                            >
                              <span className="truncate">{t.name}</span>
                              <button onClick={e => handleDeleteTemplate(t.id, e)} className="text-[rgb(var(--text-secondary))] hover:text-red-400 shrink-0">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      {savedTemplates.length === 0 && (
                        <p className="px-3 py-2 text-xs text-[rgb(var(--text-secondary))]">Нет сохранённых шаблонов</p>
                      )}
                    </>
                  )}
                  <DropdownMenuItem onClick={handleExportJson} className="gap-2 py-2">
                    <Download className="w-3.5 h-3.5" /> Экспорт в JSON
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => importInputRef.current?.click()} className="gap-2 py-2">
                    <Upload className="w-3.5 h-3.5" /> Импорт из JSON
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleCopyJson} className="gap-2 py-2">
                    <Copy className="w-3.5 h-3.5" /> Копировать JSON
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <input ref={importInputRef} type="file" accept="application/json" onChange={handleImportJson} className="hidden" />
              <button
                onClick={() => setShowPreview(v => !v)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--surface-2))] transition-colors"
              >
                {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                Предпросмотр
              </button>
            </div>
          </div>

          {/* Индикатор активной платформы (ТЗ №5 Rev.7, п.1.2). Не переключаемый: шаблон
              относится к той платформе, что выбрана на странице /dashboard/ranking —
              у VK и Lolka в БД раздельные notify_template, редактор всегда один из двух. */}
          <div className="px-5 pt-3 flex flex-col gap-2">
            <span className="self-start px-3 py-1 rounded-lg text-xs font-medium bg-[rgb(var(--surface-2))] border border-[rgb(var(--border))] text-[rgb(var(--text-secondary))]">
              Шаблон для: {isVk ? 'VK (ограниченный функционал)' : 'Lolka (полный функционал)'}
            </span>
            {isVk && (
              <p className="flex items-start gap-2 text-xs text-[rgb(var(--warning))] bg-[rgb(var(--warning))]/10 border border-[rgb(var(--warning))]/25 rounded-xl px-4 py-3">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>VK ограничена поддержка панелей и списков. Сообщение будет показано в упрощённом виде.</span>
              </p>
            )}
          </div>

          <div className={`grid ${showPreview ? 'md:grid-cols-2' : 'md:grid-cols-1'} gap-0 flex-1 min-h-0 md:min-h-[560px]`}>
            {/* Редактор */}
            <div className="p-5 space-y-4 border-r border-[rgb(var(--border))] md:max-h-[calc(88vh-150px)] md:overflow-y-auto">
              {tab === 'text' && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs text-[rgb(var(--text-secondary))]">Текст сообщения</label>
                    <CharCounter value={draft.content} max={LIMITS.content} />
                  </div>
                  <div className="flex items-center gap-1 mb-1.5 flex-wrap">
                    <ToolbarBtn icon={<Bold className="w-3.5 h-3.5" />} title="Жирный" onClick={() => wrapSelection(contentRef.current, '**', '**', draft.content, v => setDraft(d => ({ ...d, content: v })))} />
                    <ToolbarBtn icon={<Italic className="w-3.5 h-3.5" />} title="Курсив" onClick={() => wrapSelection(contentRef.current, '*', '*', draft.content, v => setDraft(d => ({ ...d, content: v })))} />
                    <ToolbarBtn icon={<Underline className="w-3.5 h-3.5" />} title="Подчёркивание" onClick={() => wrapSelection(contentRef.current, '__', '__', draft.content, v => setDraft(d => ({ ...d, content: v })))} />
                    <ToolbarBtn icon={<Strikethrough className="w-3.5 h-3.5" />} title="Зачёркивание" onClick={() => wrapSelection(contentRef.current, '~~', '~~', draft.content, v => setDraft(d => ({ ...d, content: v })))} />
                    <ToolbarBtn icon={<Code className="w-3.5 h-3.5" />} title="Код" onClick={() => wrapSelection(contentRef.current, '`', '`', draft.content, v => setDraft(d => ({ ...d, content: v })))} />
                    <ToolbarBtn icon={<Heading className="w-3.5 h-3.5" />} title="Заголовок" onClick={() => wrapSelection(contentRef.current, '### ', '', draft.content, v => setDraft(d => ({ ...d, content: v })))} />
                    <ToolbarBtn icon={<Link2 className="w-3.5 h-3.5" />} title="Ссылка" onClick={() => wrapSelection(contentRef.current, '[', '](https://)', draft.content, v => setDraft(d => ({ ...d, content: v })))} />
                    <div className="relative">
                      <ToolbarBtn icon={<span className="text-xs font-mono">{'{}'}</span>} title="Вставить переменную" onClick={() => setVarMenuOpen(v => !v)} />
                      {varMenuOpen && <VariableMenu onPick={insertVariable} onClose={() => setVarMenuOpen(false)} />}
                    </div>
                  </div>
                  <textarea
                    ref={contentRef}
                    value={draft.content}
                    onChange={e => updateField('content', e.target.value, e.target, v => setDraft(d => ({ ...d, content: v })))}
                    onFocus={e => { lastFocusedRef.current = { el: e.target, set: v => setDraft(d => ({ ...d, content: v })) }; }}
                    rows={6}
                    className="input w-full font-mono resize-none"
                    placeholder="🎉 {user} достиг {level} уровня!"
                  />
                  <p className="text-[10px] text-[rgb(var(--text-secondary))] mt-1">
                    Поддерживается Markdown: **жирный**, *курсив*, __подчёркнутый__, ~~зачёркнутый~~, `код`
                  </p>
                </div>
              )}

              {tab === 'panel' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium">Включить панель (Embed)</label>
                    <Switch checked={draft.embed_enabled} onCheckedChange={val => setDraft(d => ({ ...d, embed_enabled: val }))} />
                  </div>
                  {draft.embed_enabled && (
                    <>
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-xs text-[rgb(var(--text-secondary))]">Заголовок</label>
                          <CharCounter value={draft.embed.title} max={LIMITS.title} />
                        </div>
                        <input
                          type="text" value={draft.embed.title}
                          onFocus={e => { lastFocusedRef.current = { el: e.target, set: v => updateEmbed({ title: v }) }; }}
                          onChange={e => updateEmbed({ title: e.target.value })} className="input w-full" placeholder="Заголовок панели"
                        />
                      </div>
                      {!isVk && (
                        <div>
                          <label className="text-xs text-[rgb(var(--text-secondary))] block mb-1">URL заголовка</label>
                          <input type="url" value={draft.embed.url} onChange={e => updateEmbed({ url: e.target.value })} className="input w-full" placeholder="https://..." />
                        </div>
                      )}
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-xs text-[rgb(var(--text-secondary))]">Описание</label>
                          <CharCounter value={draft.embed.description} max={LIMITS.description} />
                        </div>
                        <textarea
                          value={draft.embed.description}
                          onFocus={e => { lastFocusedRef.current = { el: e.target, set: v => updateEmbed({ description: v }) }; }}
                          onChange={e => updateEmbed({ description: e.target.value })}
                          rows={4} className="input w-full resize-none" placeholder="Описание панели"
                        />
                      </div>
                      {!isVk && (
                        <div>
                          <label className="text-xs text-[rgb(var(--text-secondary))] block mb-1">Цвет</label>
                          <div className="flex gap-2">
                            <input type="color" value={draft.embed.color} onChange={e => updateEmbed({ color: e.target.value })} className="h-9 w-9 shrink-0 rounded-lg cursor-pointer" />
                            <HexColorField value={draft.embed.color} onChange={v => updateEmbed({ color: v })} placeholder="#00E5FF" />
                          </div>
                        </div>
                      )}

                      {!isVk && (
                        <div className="pt-2 border-t border-[rgb(var(--border))] space-y-2">
                          <label className="text-xs font-medium text-[rgb(var(--text-secondary))]">Автор</label>
                          <input type="text" value={draft.embed.author.name} onChange={e => updateEmbed({ author: { ...draft.embed.author, name: e.target.value } })} className="input w-full" placeholder="Имя автора" />
                          <div className="grid grid-cols-2 gap-2">
                            <input type="url" value={draft.embed.author.url} onChange={e => updateEmbed({ author: { ...draft.embed.author, url: e.target.value } })} className="input w-full" placeholder="URL автора" />
                            <input type="url" value={draft.embed.author.icon_url} onChange={e => updateEmbed({ author: { ...draft.embed.author, icon_url: e.target.value } })} className="input w-full" placeholder="Иконка автора (URL)" />
                          </div>
                        </div>
                      )}

                      {!isVk && (
                        <div className="pt-2 border-t border-[rgb(var(--border))] space-y-2">
                          <label className="text-xs font-medium text-[rgb(var(--text-secondary))]">Изображение</label>
                          <input type="url" value={draft.embed.image_url} onChange={e => updateEmbed({ image_url: e.target.value })} className="input w-full" placeholder="Большое изображение (URL)" />
                          <input type="url" value={draft.embed.thumbnail_url} onChange={e => updateEmbed({ thumbnail_url: e.target.value })} className="input w-full" placeholder="Миниатюра (URL)" />
                        </div>
                      )}

                      <div className="pt-2 border-t border-[rgb(var(--border))] space-y-2">
                        <label className="text-xs font-medium text-[rgb(var(--text-secondary))]">Подвал</label>
                        <div className="flex justify-between items-center mb-1">
                          <CharCounter value={draft.embed.footer.text} max={LIMITS.footerText} />
                        </div>
                        <input type="text" value={draft.embed.footer.text} onChange={e => updateEmbed({ footer: { ...draft.embed.footer, text: e.target.value } })} className="input w-full" placeholder="Текст подвала" />
                        {!isVk && (
                          <>
                            <input type="url" value={draft.embed.footer.icon_url} onChange={e => updateEmbed({ footer: { ...draft.embed.footer, icon_url: e.target.value } })} className="input w-full" placeholder="Иконка подвала (URL)" />
                            <div className="flex justify-between items-center pt-1">
                              <span className="text-xs text-[rgb(var(--text-secondary))]">Показывать дату/время</span>
                              <Switch checked={draft.embed.footer.timestamp} onCheckedChange={val => updateEmbed({ footer: { ...draft.embed.footer, timestamp: val } })} />
                            </div>
                          </>
                        )}
                      </div>

                      <div className="pt-2 border-t border-[rgb(var(--border))]">
                        <div className="flex justify-between items-center mb-2">
                          <label className="text-xs font-medium text-[rgb(var(--text-secondary))]">Поля ({draft.embed.fields.length}/{LIMITS.maxFields})</label>
                          <button onClick={addField} disabled={draft.embed.fields.length >= LIMITS.maxFields} className="flex items-center gap-1 text-xs font-medium text-cyan-400 hover:text-cyan-300 disabled:opacity-40 transition-colors">
                            <Plus className="w-3.5 h-3.5" /> Добавить поле
                          </button>
                        </div>
                        <div className="space-y-2">
                          {draft.embed.fields.map((f, i) => (
                            <div key={i} className="p-2.5 bg-[rgb(var(--surface-2))] border border-[rgb(var(--border))] rounded-lg space-y-1.5">
                              <div className="flex gap-1.5">
                                <input type="text" value={f.name} onChange={e => updateFieldAt(i, { name: e.target.value })} placeholder="Название поля" className="input flex-1 text-sm" maxLength={LIMITS.fieldName} />
                                <button onClick={() => moveField(i, -1)} disabled={i === 0} className="px-1.5 rounded-lg text-[rgb(var(--text-secondary))] hover:bg-white/5 disabled:opacity-30"><ChevronUp className="w-3.5 h-3.5" /></button>
                                <button onClick={() => moveField(i, 1)} disabled={i === draft.embed.fields.length - 1} className="px-1.5 rounded-lg text-[rgb(var(--text-secondary))] hover:bg-white/5 disabled:opacity-30"><ChevronDown className="w-3.5 h-3.5" /></button>
                                <button onClick={() => removeField(i)} className="px-1.5 rounded-lg text-red-400 hover:bg-red-500/10"><Trash2 className="w-3.5 h-3.5" /></button>
                              </div>
                              <textarea value={f.value} onChange={e => updateFieldAt(i, { value: e.target.value })} placeholder="Значение поля" rows={2} className="input w-full text-sm resize-none" maxLength={LIMITS.fieldValue} />
                              <label className="flex items-center gap-1.5 text-xs text-[rgb(var(--text-secondary))]">
                                <input type="checkbox" checked={f.inline} onChange={e => updateFieldAt(i, { inline: e.target.checked })} className="accent-cyan-400" />
                                В одну строку (inline)
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {tab === 'components' && (
                <div className="space-y-5">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-sm font-medium flex items-center gap-1.5">
                        Кнопки
                        <Hint text="До 5 кнопок в ряд. Тип Link открывает URL, остальные выполняют предустановленное действие: показать профиль, топ участников или закрыть сообщение" />
                      </label>
                      <button onClick={addButton} disabled={draft.buttons.length >= 25} className="flex items-center gap-1 text-xs font-medium text-cyan-400 hover:text-cyan-300 disabled:opacity-40 transition-colors">
                        <Plus className="w-3.5 h-3.5" /> Добавить кнопку
                      </button>
                    </div>
                    {buttonRowWarning && <p className="text-[10px] text-red-400 mb-2">В одном ряду не может быть больше {LIMITS.maxButtonsPerRow} кнопок</p>}
                    <div className="space-y-2">
                      {draft.buttons.map((b, i) => (
                        <div key={b.id} className="p-2.5 bg-[rgb(var(--surface-2))] border border-[rgb(var(--border))] rounded-lg grid grid-cols-2 gap-1.5">
                          <input type="text" value={b.label} onChange={e => updateButton(i, { label: e.target.value })} placeholder="Текст кнопки" className="input text-sm" maxLength={LIMITS.buttonLabel} />
                          <select value={b.style} onChange={e => updateButton(i, { style: e.target.value as ButtonStyle })} className="input text-sm">
                            {BUTTON_STYLES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                          </select>
                          <input type="text" value={b.emoji} onChange={e => updateButton(i, { emoji: e.target.value })} placeholder="Emoji" className="input text-sm" />
                          <select value={b.row} onChange={e => updateButton(i, { row: parseInt(e.target.value) })} className="input text-sm">
                            {[0, 1, 2, 3, 4].map(r => <option key={r} value={r}>Ряд {r + 1}</option>)}
                          </select>
                          {b.style === 'link' ? (
                            <input type="url" value={b.url} onChange={e => updateButton(i, { url: e.target.value })} placeholder="URL" className="input text-sm col-span-2" />
                          ) : (
                            <select value={b.custom_id || 'nova_profile'} onChange={e => updateButton(i, { custom_id: e.target.value })} className="input text-sm col-span-2">
                              {BUTTON_ACTIONS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
                            </select>
                          )}
                          <button onClick={() => removeButton(i)} className="col-span-2 flex items-center justify-center gap-1 text-xs text-red-400 hover:bg-red-500/10 rounded-lg py-1 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" /> Удалить
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[rgb(var(--border))]">
                    {isVk ? (
                      <p className="flex items-start gap-2 text-xs text-[rgb(var(--warning))] bg-[rgb(var(--warning))]/10 border border-[rgb(var(--warning))]/25 rounded-xl px-3 py-2.5">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        VK не поддерживает выпадающие списки. Этот раздел редактора скрыт. Вы можете использовать кнопки или обычный текст.
                      </p>
                    ) : (
                    <>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-sm font-medium">Выпадающий список</label>
                      {selectMenu ? (
                        <button onClick={() => setSelectMenu(undefined)} className="text-xs text-red-400 hover:text-red-300">Удалить</button>
                      ) : (
                        <button onClick={addSelectMenu} className="flex items-center gap-1 text-xs font-medium text-cyan-400 hover:text-cyan-300 transition-colors">
                          <Plus className="w-3.5 h-3.5" /> Добавить select menu
                        </button>
                      )}
                    </div>
                    {selectMenu && (
                      <div className="space-y-2">
                        <input type="text" value={selectMenu.placeholder} onChange={e => setSelectMenu({ ...selectMenu, placeholder: e.target.value })} placeholder="Placeholder" className="input w-full text-sm" />
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] text-[rgb(var(--text-secondary))] block mb-0.5">Мин. выборов</label>
                            <input type="number" min={0} value={selectMenu.min_values} onChange={e => setSelectMenu({ ...selectMenu, min_values: parseInt(e.target.value) || 0 })} className="input w-full text-sm" />
                          </div>
                          <div>
                            <label className="text-[10px] text-[rgb(var(--text-secondary))] block mb-0.5">Макс. выборов</label>
                            <input type="number" min={1} value={selectMenu.max_values} onChange={e => setSelectMenu({ ...selectMenu, max_values: parseInt(e.target.value) || 1 })} className="input w-full text-sm" />
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] text-[rgb(var(--text-secondary))]">Опции ({selectMenu.options.length}/{LIMITS.maxSelectOptions})</span>
                          <button onClick={addSelectOption} disabled={selectMenu.options.length >= LIMITS.maxSelectOptions} className="flex items-center gap-1 text-xs font-medium text-cyan-400 hover:text-cyan-300 disabled:opacity-40">
                            <Plus className="w-3.5 h-3.5" /> Опция
                          </button>
                        </div>
                        {selectMenu.options.map((o, i) => (
                          <div key={i} className="p-2 bg-[rgb(var(--surface-2))] border border-[rgb(var(--border))] rounded-lg grid grid-cols-2 gap-1.5">
                            <input type="text" value={o.label} onChange={e => updateSelectOption(i, { label: e.target.value })} placeholder="Label" className="input text-sm" />
                            <input type="text" value={o.value} onChange={e => updateSelectOption(i, { value: e.target.value })} placeholder="Value" className="input text-sm" />
                            <input type="text" value={o.description} onChange={e => updateSelectOption(i, { description: e.target.value })} placeholder="Описание" className="input text-sm" />
                            <div className="flex gap-1.5">
                              <input type="text" value={o.emoji} onChange={e => updateSelectOption(i, { emoji: e.target.value })} placeholder="Emoji" className="input text-sm flex-1" />
                              <button onClick={() => removeSelectOption(i)} className="px-1.5 rounded-lg text-red-400 hover:bg-red-500/10"><Trash2 className="w-3.5 h-3.5" /></button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Превью */}
            {showPreview && (
              <div className="p-5 bg-[rgb(var(--surface-1))] md:max-h-[calc(88vh-150px)] md:overflow-y-auto">
                <p className="text-xs text-[rgb(var(--text-secondary))] mb-3">Предпросмотр {isVk ? '(VK)' : '(Lolka)'}</p>
                <div className="bg-[#111118] rounded-2xl p-4 text-sm text-white">
                  {draft.content && (
                    <p className="mb-2 whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(draft.content) }} />
                  )}
                  {isVk ? (
                    <>
                      {draft.embed_enabled && (
                        <div className="space-y-1 text-[rgb(220,220,230)]">
                          {draft.embed.title && <p>📌 {draft.embed.title}</p>}
                          {draft.embed.description && <p className="whitespace-pre-wrap">{draft.embed.description}</p>}
                          {draft.embed.fields.filter(f => f.name || f.value).map((f, i) => (
                            <p key={i}>• {f.name}: {f.value}</p>
                          ))}
                          {draft.embed.footer.text && <p className="text-[rgb(150,150,160)]">— {draft.embed.footer.text}</p>}
                        </div>
                      )}
                      {[0, 1, 2, 3, 4].map(row => {
                        const rowButtons = draft.buttons.filter(b => b.row === row);
                        if (rowButtons.length === 0) return null;
                        return (
                          <div key={row} className="flex gap-1.5 mt-2 flex-wrap">
                            {rowButtons.map(b => (
                              <span key={b.id} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[rgb(var(--surface-2))] border border-[rgb(var(--border))] text-white">
                                {b.emoji ? `${b.emoji} ` : ''}{b.label || 'Кнопка'}
                              </span>
                            ))}
                          </div>
                        );
                      })}
                      {!draft.content && !draft.embed_enabled && draft.buttons.length === 0 && (
                        <p className="text-[rgb(var(--text-secondary))] text-xs">Начните заполнять шаблон слева — превью появится здесь</p>
                      )}
                    </>
                  ) : (
                  <>
                  {draft.embed_enabled && (
                    <div className="rounded-lg overflow-hidden flex mt-2" style={{ background: '#1a1a22' }}>
                      <div className="w-1 shrink-0" style={{ background: draft.embed.color || '#00E5FF' }} />
                      <div className="p-3 flex-1 min-w-0">
                        {draft.embed.author.name && (
                          <div className="flex items-center gap-1.5 mb-1.5 text-xs font-medium">
                            {draft.embed.author.icon_url && <img src={draft.embed.author.icon_url} alt="" className="w-5 h-5 rounded-full object-cover" />}
                            {draft.embed.author.name}
                          </div>
                        )}
                        {draft.embed.title && <p className="font-bold mb-1">{draft.embed.title}</p>}
                        {draft.embed.description && (
                          <p className="text-[rgb(200,200,210)] whitespace-pre-wrap mb-2" dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(draft.embed.description) }} />
                        )}
                        {draft.embed.fields.length > 0 && (
                          <div className="grid grid-cols-2 gap-2 mb-2">
                            {draft.embed.fields.map((f, i) => (
                              <div key={i} className={f.inline ? '' : 'col-span-2'}>
                                {f.name && <p className="text-xs font-semibold">{f.name}</p>}
                                <p className="text-xs text-[rgb(200,200,210)] whitespace-pre-wrap">{f.value}</p>
                              </div>
                            ))}
                          </div>
                        )}
                        {draft.embed.image_url && <img src={draft.embed.image_url} alt="" className="rounded-lg mt-1 max-h-40 object-cover w-full" />}
                        {(draft.embed.footer.text || draft.embed.footer.timestamp) && (
                          <div className="flex items-center gap-1.5 mt-2 text-[10px] text-[rgb(150,150,160)]">
                            {draft.embed.footer.icon_url && <img src={draft.embed.footer.icon_url} alt="" className="w-4 h-4 rounded-full object-cover" />}
                            {draft.embed.footer.text}
                            {draft.embed.footer.timestamp && <span>{draft.embed.footer.text ? ' • ' : ''}сегодня</span>}
                          </div>
                        )}
                      </div>
                      {draft.embed.thumbnail_url && <img src={draft.embed.thumbnail_url} alt="" className="w-16 h-16 object-cover m-3 rounded-lg shrink-0" />}
                    </div>
                  )}
                  {[0, 1, 2, 3, 4].map(row => {
                    const rowButtons = draft.buttons.filter(b => b.row === row);
                    if (rowButtons.length === 0) return null;
                    return (
                      <div key={row} className="flex gap-1.5 mt-2 flex-wrap">
                        {rowButtons.map(b => {
                          const style = BUTTON_STYLES.find(s => s.value === b.style)!;
                          return (
                            <span key={b.id} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${style.className}`}>
                              {b.emoji ? `${b.emoji} ` : ''}{b.label || 'Кнопка'}
                            </span>
                          );
                        })}
                      </div>
                    );
                  })}
                  {selectMenu && (
                    <div className="mt-2 px-3 py-2 rounded-lg bg-[rgb(var(--surface-2))] text-xs text-[rgb(var(--text-secondary))]">
                      {selectMenu.placeholder || 'Выберите вариант'} ▾
                    </div>
                  )}
                  {!draft.content && !draft.embed_enabled && draft.buttons.length === 0 && !selectMenu && (
                    <p className="text-[rgb(var(--text-secondary))] text-xs">Начните заполнять шаблон слева — превью появится здесь</p>
                  )}
                  </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Нижняя панель */}
          <div className="flex items-center justify-between border-t border-[rgb(var(--border))] px-5 py-3 sticky bottom-0 bg-[rgb(var(--surface))]">
            <div className="text-xs text-red-400">{errors[0] ?? ''}</div>
            <div className="flex gap-2">
              <button onClick={() => onOpenChange(false)} className="px-4 py-2 rounded-xl text-sm font-medium text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--surface-2))] transition-colors">
                Отмена
              </button>
              <button
                onClick={() => { onSave(draft); onOpenChange(false); }}
                disabled={errors.length > 0}
                className="px-4 py-2 rounded-xl text-sm font-medium bg-cyan-400 text-black hover:bg-cyan-300 disabled:opacity-40 transition-colors"
              >
                Сохранить шаблон
              </button>
            </div>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ToolbarBtn({ icon, title, onClick }: { icon: ReactNode; title: string; onClick: () => void }) {
  return (
    <button type="button" title={title} onClick={onClick} className="w-7 h-7 flex items-center justify-center rounded-lg text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--surface-2))] hover:text-[rgb(var(--text))] transition-colors">
      {icon}
    </button>
  );
}

function VariableMenu({ onPick, onClose }: { onPick: (token: string) => void; onClose: () => void }) {
  return (
    <div className="absolute right-0 top-8 z-20 w-72 max-h-80 overflow-y-auto bg-[rgb(var(--surface))] border border-[rgb(var(--border))] rounded-xl shadow-2xl p-2">
      <div className="flex justify-between items-center px-1 pb-1">
        <span className="text-xs font-medium text-[rgb(var(--text-secondary))]">Переменные</span>
        <button onClick={onClose} className="text-xs text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text))]">✕</button>
      </div>
      {VARIABLES.map(group => (
        <div key={group.group} className="mb-1.5">
          <p className="text-[10px] uppercase tracking-wide text-[rgb(var(--text-secondary))] px-1 mb-0.5">{group.group}</p>
          {group.items.map(v => (
            <button
              key={v.token}
              onClick={() => onPick(v.token)}
              className="w-full text-left px-2 py-1 rounded-lg hover:bg-[rgb(var(--surface-2))] transition-colors flex items-center justify-between gap-2"
            >
              <span className="font-mono text-xs text-cyan-400">{v.token}</span>
              <span className="text-[10px] text-[rgb(var(--text-secondary))] truncate">{v.desc}</span>
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}
