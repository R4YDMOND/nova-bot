// Единые иконки платформ. Раньше использовались эмодзи (🔵 / 🎮), которые
// по-разному (и криво) рендерятся в зависимости от ОС/браузера — на карточках
// серверов, в свитчере и в фильтрах. Теперь везде один и тот же чистый SVG.
import type { FC } from 'react';

type Platform = 'vk' | 'lolka';

interface PlatformIconProps {
  platform: Platform;
  className?: string;
}

function VkGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} xmlns="http://www.w3.org/2000/svg">
      <rect width="24" height="24" rx="6" fill="#0077FF" />
      <path
        fill="#fff"
        d="M12.79 17.35h1.16c.35 0 .46-.28 1.09-.92.55-.53.79-.6.93-.6.19 0 .24.05.24.32v.84c0 .23-.07.36-.67.36-.98 0-2.07-.6-2.84-1.71-1.16-1.63-1.48-2.86-1.48-3.1 0-.14.05-.26.32-.26h1.16c.23 0 .32.1.41.36.46 1.33 1.22 2.5 1.54 2.5.12 0 .17-.05.17-.35v-1.36c-.04-.63-.37-.69-.37-.91 0-.11.09-.22.23-.22h1.83c.2 0 .27.11.27.34v1.85c0 .2.09.27.14.27.12 0 .22-.07.43-.29.67-.75 1.14-1.9 1.14-1.9.06-.14.18-.26.41-.26h1.16c.35 0 .43.14.35.34-.15.54-1.25 2.14-1.25 2.14-.1.16-.14.23 0 .42.1.14.42.41.64.67.4.45.7.83.78 1.09.09.26-.05.4-.31.4z"
      />
    </svg>
  );
}

function LolkaGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} xmlns="http://www.w3.org/2000/svg">
      <rect width="24" height="24" rx="6" fill="#8B5CF6" />
      <path
        fill="#fff"
        d="M7.2 11.2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2Zm9.6 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2ZM9 9h1.4v1.4H12V12h-1.6v1.4H9V12H7.4v-1.6H9V9Zm5.3-.2 4.6 1.4a2 2 0 0 1 1.4 2.1l-.4 2.6a1.4 1.4 0 0 1-2.5.6l-.9-1.2a1.6 1.6 0 0 0-1.28-.65H8.44a1.6 1.6 0 0 0-1.28.65l-.9 1.2a1.4 1.4 0 0 1-2.5-.6l-.4-2.6a2 2 0 0 1 1.4-2.1l4.6-1.4a4.8 4.8 0 0 1 2.94 0Z"
      />
    </svg>
  );
}

export const PlatformIcon: FC<PlatformIconProps> = ({ platform, className = 'w-5 h-5 rounded-md' }) => {
  return platform === 'vk' ? <VkGlyph className={className} /> : <LolkaGlyph className={className} />;
};

export const PLATFORM_LABEL: Record<Platform, string> = { vk: 'VK', lolka: 'Lolka' };
