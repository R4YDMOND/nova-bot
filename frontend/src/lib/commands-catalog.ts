// Каталог встроенных команд + типы для страницы /dashboard/commands (ТЗ №7).
// Только текстовые/prefix-команды — VK callback-кнопки и настоящие Lolka
// Slash/Context-Menu (Interactions API) не поддерживаются текущей инфраструктурой
// (Lolka-бот подключён через Gateway WS, VK — через Callback API), поэтому
// исключены из конструктора команд.

export type Platform = 'vk' | 'lolka';
export type Category = 'info' | 'moderation' | 'levels' | 'music' | 'utility' | 'ai';
// VK: реальные 5 уровней руководителей сообщества (groups.getMembers, filter=managers,
// поле role) — 'owner' соответствует полю role="creator". Lolka permission не использует —
// доступ на Lolka теперь определяется ролями/каналами (allowedRoles/ignoredRoles/
// allowedChannels/ignoredChannels), см. ниже. ТЗ №7.1.
export type Permission = 'all' | 'moderator' | 'editor' | 'administrator' | 'advertiser' | 'owner';

/** Старые сохранённые конфиги могли содержать значения до ТЗ №7.1 ('admin') — приводим к новому набору. */
export function normalizePermission(value: string | undefined | null): Permission {
  if (value === 'admin') return 'administrator';
  const valid: Permission[] = ['all', 'moderator', 'editor', 'administrator', 'advertiser', 'owner'];
  return (valid as string[]).includes(value || '') ? (value as Permission) : 'all';
}

export const CATEGORY_LABELS: Record<Category, string> = {
  info: 'Информация',
  moderation: 'Модерация',
  levels: 'Уровни',
  music: 'Музыка',
  utility: 'Утилиты',
  ai: 'AI',
};

// Только для VK — на Lolka доступ определяется ролями/каналами, см. ChannelMultiSelect/RoleMultiSelect в UI.
export const PERMISSION_LABELS: Record<Permission, string> = {
  all: 'Все пользователи',
  moderator: 'Модератор',
  editor: 'Редактор',
  administrator: 'Администратор',
  advertiser: 'Рекламодатель',
  owner: 'Владелец',
};

export interface BuiltinCommand {
  name: string;           // без слэша, напр. "ping"
  icon: string;            // эмодзи
  description: string;
  category: Category;
  platforms: Platform[];
  defaultCooldown: number;
  defaultPermission: Permission;
  executable: boolean;     // отвечает ли бот реально в чате (иначе — только переключатель/метаданные)
}

// Совпадает со старым INITIAL_COMMANDS (11 команд) — платформы и права добавлены,
// новые команды не придуманы.
export const BUILTIN_COMMANDS: BuiltinCommand[] = [
  { name: 'ping',  icon: '🏓', description: 'Проверка бота',        category: 'info',       platforms: ['vk', 'lolka'], defaultCooldown: 3,  defaultPermission: 'all',      executable: true },
  { name: 'help',  icon: '❓', description: 'Список команд',         category: 'info',       platforms: ['vk', 'lolka'], defaultCooldown: 5,  defaultPermission: 'all',      executable: true },
  { name: 'stats', icon: '📊', description: 'Статистика',            category: 'info',       platforms: ['vk', 'lolka'], defaultCooldown: 10, defaultPermission: 'all',      executable: false },
  { name: 'ban',   icon: '🔨', description: 'Забанить',              category: 'moderation', platforms: ['vk', 'lolka'], defaultCooldown: 0,  defaultPermission: 'administrator', executable: false },
  { name: 'kick',  icon: '👢', description: 'Выгнать',               category: 'moderation', platforms: ['vk', 'lolka'], defaultCooldown: 0,  defaultPermission: 'administrator', executable: false },
  { name: 'mute',  icon: '🔇', description: 'Замутить',              category: 'moderation', platforms: ['vk', 'lolka'], defaultCooldown: 0,  defaultPermission: 'moderator',      executable: false },
  { name: 'clear', icon: '🧹', description: 'Очистить чат',          category: 'moderation', platforms: ['vk', 'lolka'], defaultCooldown: 5,  defaultPermission: 'administrator', executable: false },
  { name: 'rank',  icon: '🏆', description: 'Уровень',               category: 'levels',     platforms: ['vk', 'lolka'], defaultCooldown: 5,  defaultPermission: 'all',      executable: false },
  { name: 'top',   icon: '🎖', description: 'Топ участников',        category: 'levels',     platforms: ['vk', 'lolka'], defaultCooldown: 15, defaultPermission: 'all',      executable: false },
  { name: 'play',  icon: '🎵', description: 'Музыка',                category: 'music',      platforms: ['lolka'],       defaultCooldown: 3,  defaultPermission: 'all',      executable: false },
  { name: 'ai',    icon: '🤖', description: 'Спросить AI',           category: 'ai',         platforms: ['vk', 'lolka'], defaultCooldown: 5,  defaultPermission: 'all',      executable: false },
];

// /play доступен только в Lolka технически (голосовые каналы отсутствуют у VK-ботов на free-плане),
// но остальные built-in работают на обеих платформах через текстовый префикс.

export interface BuiltinOverride {
  name: string;
  enabled: boolean;
  cooldown: number;
  permission: Permission;         // используется только на VK
  allowedRoles: string[];         // используется только на Lolka; [] = не ограничено
  ignoredRoles: string[];
  allowedChannels: string[];
  ignoredChannels: string[];
  usageCount?: number;            // пишет backend при выполнении (log_usage), UI только читает
}

export interface CustomCommand {
  id: string;
  name: string;
  description: string;
  category: Category;
  params: string;              // "<user> [причина]"
  platforms: Platform[];
  vkPrefix: string;            // напр. "!welcome" или "/welcome"
  lolkaPrefix: string;         // напр. "/welcome"
  cooldown: number;
  permission: Permission;         // используется только на VK
  allowedRoles: string[];         // используется только на Lolka; [] = не ограничено
  ignoredRoles: string[];
  allowedChannels: string[];
  ignoredChannels: string[];
  response: string;
  enabled: boolean;
  logUsage: boolean;
  usageCount?: number;            // пишет backend при выполнении (log_usage), UI только читает
  showInHelp: boolean;
  createdAt: string;
}

export interface CommandsConfig {
  builtin: BuiltinOverride[];
  custom: CustomCommand[];
}

export const EMPTY_CONFIG: CommandsConfig = { builtin: [], custom: [] };

/** Дополняет пользовательскую команду, загруженную из сохранённого конфига (до ТЗ №7.1
 *  у неё могло не быть полей доступа), значениями по умолчанию — без этого React-контролы
 *  получат undefined вместо массива. */
export function normalizeCustomCommand(cmd: CustomCommand): CustomCommand {
  return {
    ...cmd,
    permission: normalizePermission(cmd.permission),
    allowedRoles: cmd.allowedRoles || [],
    ignoredRoles: cmd.ignoredRoles || [],
    allowedChannels: cmd.allowedChannels || [],
    ignoredChannels: cmd.ignoredChannels || [],
  };
}

export function defaultBuiltinOverride(cmd: BuiltinCommand): BuiltinOverride {
  return {
    name: cmd.name, enabled: true, cooldown: cmd.defaultCooldown, permission: cmd.defaultPermission,
    allowedRoles: [], ignoredRoles: [], allowedChannels: [], ignoredChannels: [],
  };
}

export function mergeBuiltinOverrides(saved: BuiltinOverride[]): BuiltinOverride[] {
  return BUILTIN_COMMANDS.map(cmd => {
    const found = saved.find(o => o.name === cmd.name);
    if (!found) return defaultBuiltinOverride(cmd);
    return {
      ...defaultBuiltinOverride(cmd),
      ...found,
      permission: normalizePermission(found.permission),
    };
  });
}

// ── Валидация формы конструктора (ТЗ №7, §5.2 — без vkPayload, callback-кнопки убраны) ──

export const commandValidators = {
  name: (value: string): string | null => {
    if (!/^[a-z0-9_-]{1,32}$/.test(value)) {
      return 'Имя должно содержать 1-32 символов (a-z, 0-9, _, -)';
    }
    return null;
  },
  description: (value: string): string | null => {
    if (value.length < 10 || value.length > 200) {
      return 'Описание должно содержать 10-200 символов';
    }
    return null;
  },
  cooldown: (value: number): string | null => {
    if (Number.isNaN(value) || value < 0 || value > 86400) {
      return 'Кулдаун: 0 - 86400 секунд (24 часа)';
    }
    return null;
  },
  platforms: (value: Platform[]): string | null => {
    if (!value || value.length === 0) {
      return 'Выберите хотя бы одну платформу';
    }
    return null;
  },
  response: (value: string): string | null => {
    if (!value || value.trim().length === 0) {
      return 'Текст ответа обязателен';
    }
    return null;
  },
};

export function isNameTaken(name: string, custom: CustomCommand[], excludeId?: string): boolean {
  const lower = name.toLowerCase();
  if (BUILTIN_COMMANDS.some(c => c.name === lower)) return true;
  return custom.some(c => c.id !== excludeId && c.name.toLowerCase() === lower);
}
