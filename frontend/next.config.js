/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'sun*.userapi.com' }, // фото профилей VK
      { protocol: 'https', hostname: 'vk.com' },
    ],
  },
};

module.exports = nextConfig;