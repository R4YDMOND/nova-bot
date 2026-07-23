// Каталог встроенных команд + типы для страницы /dashboard/commands (ТЗ №7).
// Только текстовые/prefix-команды — VK callback-кнопки и настоящие Lolka
// Slash/Context-Menu (Interactions API) не поддерживаются текущей инфраструктурой
// (Lolka-бот подключён через Gateway WS, VK — через Callback API), поэтому
// исключены из конструктора команд.

export type Platform = 'vk' | 'lolka';
export type Category = 'info' | 'moderation' | 'levels' | 'music' | 'utility' | 'ai';
export type Permission = 'all' | 'moderator' | 'admin' | 'owner';

export const CATEGORY_LABELS: Record<Category, string> = {
  info: 'Информация',
  moderation: 'Модерация',
  levels: 'Уровни',
  music: 'Музыка',
  utility: 'Утилиты',
  ai: 'AI',
};

export const PERMISSION_LABELS: Record<Permission, string> = {
  all: 'Все пользователи',
  moderator: 'Модераторы',
  admin: 'Администраторы',
  owner: 'Только владелец',
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
  { name: 'ban',   icon: '🔨', description: 'Забанить',              category: 'moderation', platforms: ['vk', 'lolka'], defaultCooldown: 0,  defaultPermission: 'admin',     executable: false },
  { name: 'kick',  icon: '👢', description: 'Выгнать',               category: 'moderation', platforms: ['vk', 'lolka'], defaultCooldown: 0,  defaultPermission: 'admin',     executable: false },
  { name: 'mute',  icon: '🔇', description: 'Замутить',              category: 'moderation', platforms: ['vk', 'lolka'], defaultCooldown: 0,  defaultPermission: 'moderator', executable: false },
  { name: 'clear', icon: '🧹', description: 'Очистить чат',          category: 'moderation', platforms: ['vk', 'lolka'], defaultCooldown: 5,  defaultPermission: 'admin',     executable: false },
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
  permission: Permission;
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
  permission: Permission;
  response: string;
  enabled: boolean;
  logUsage: boolean;
  showInHelp: boolean;
  createdAt: string;
}

export interface CommandsConfig {
  builtin: BuiltinOverride[];
  custom: CustomCommand[];
}

export const EMPTY_CONFIG: CommandsConfig = { builtin: [], custom: [] };

export function defaultBuiltinOverride(cmd: BuiltinCommand): BuiltinOverride {
  return { name: cmd.name, enabled: true, cooldown: cmd.defaultCooldown, permission: cmd.defaultPermission };
}

export function mergeBuiltinOverrides(saved: BuiltinOverride[]): BuiltinOverride[] {
  return BUILTIN_COMMANDS.map(cmd => saved.find(o => o.name === cmd.name) || defaultBuiltinOverride(cmd));
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
