import type { Metadata } from "next";
import { AuthProvider } from "@/context/AuthProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Toaster } from "@/components/Toaster";
import { QueryProvider } from "@/providers/QueryProvider"; // <-- Импорт добавлен
import "./globals.css";

export const metadata: Metadata = {
  title: "Nova Bot — Панель управления",
  description: "Умный помощник для серверов Lolka и сообществ VK",
  icons: { icon: "/icon.png", shortcut: "/icon.png", apple: "/apple-icon.png" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[rgb(var(--bg))] text-[rgb(var(--text))] antialiased">
        {/* <-- QueryProvider добавлен здесь, оборачивая всё приложение */}
        <QueryProvider>
          <AuthProvider>
            <ThemeProvider>
              {children}
              <Toaster />
            </ThemeProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}