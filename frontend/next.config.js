/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'sun*.userapi.com' }, // фото профилей VK
      { protocol: 'https', hostname: 'vk.com' },
      { protocol: 'https', hostname: 'cdn.lolka.app' }, // иконки серверов Lolka
    ],
  },
};

module.exports = nextConfig;