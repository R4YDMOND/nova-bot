// ТЗ №9: Доработка страницы AI — типы для мультипровайдерных настроек, RAG, кэша, модерации.

export type AIProvider = 'gigachat' | 'yandexgpt' | 'deepseek' | 'openrouter';

export interface AISettings {
  botName: string;
  personality: string;
  temperature: number;
  systemPrompt: string;
  provider: AIProvider;
  contextSize: number;          // размер контекста RAG (0-20 сообщений)
  cacheEnabled: boolean;        // семантический кэш ответов
  moderationEnabled: boolean;   // AI AutoMod (уровень 2)
  moderationThreshold: number;  // порог уверенности токсичности (0-100)
  toolGrantRoles: boolean;      // разрешённый инструмент: выдача ролей
}

export const PROVIDERS: { value: AIProvider; label: string }[] = [
  { value: 'gigachat', label: '🇷🇺 GigaChat' },
  { value: 'yandexgpt', label: '☁️ YandexGPT' },
  { value: 'deepseek', label: '🧠 DeepSeek' },
  { value: 'openrouter', label: '🔀 OpenRouter' },
];

export const PROMPT_VARIABLES: { token: string; desc: string }[] = [
  { token: '{user_name}', desc: 'имя пользователя' },
  { token: '{server_name}', desc: 'название сервера/группы' },
  { token: '{channel_name}', desc: 'название канала' },
  { token: '{current_time}', desc: 'текущее время' },
];

export interface AIUsage {
  used: number;
  limit: number;
}

export interface PlaygroundMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface PlaygroundResponse {
  reply?: string;
  provider?: string;
  systemPrompt?: string;
  error?: string;
}

export interface URLTranslateResponse {
  result?: string;
  error?: string;
}
