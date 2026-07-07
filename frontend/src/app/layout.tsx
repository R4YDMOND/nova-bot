import type { Metadata } from 'next';
import { ThemeProvider } from '@/components/ThemeProvider';
import { Toaster } from '@/components/Toaster';
import './globals.css';

export const metadata: Metadata = {
  title: 'Nova Bot — Панель управления',
  description: 'Умный помощник для серверов Lolka и сообществ VK',
  icons: { icon: '/icon', shortcut: '/icon', apple: '/icon' },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body className="bg-[rgb(var(--bg))] text-[rgb(var(--text))] antialiased">
        <ThemeProvider>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}