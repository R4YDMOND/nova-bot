import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Нова — Умный помощник для Lolka',
  description: 'AI бот Нова для серверов Lolka',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  )
}