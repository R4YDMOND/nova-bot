/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  images: {
    unoptimized: true, // статический экспорт не имеет сервера оптимизации изображений
    remotePatterns: [
      { protocol: 'https', hostname: 'sun*.userapi.com' }, // фото профилей VK
      { protocol: 'https', hostname: 'vk.com' },
      { protocol: 'https', hostname: 'cdn.lolka.app' }, // иконки серверов Lolka
    ],
  },
};

module.exports = nextConfig;
