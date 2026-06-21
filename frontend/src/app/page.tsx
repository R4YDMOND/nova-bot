"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function Home() {
  const [stats, setStats] = useState({
    servers: 0,
    users: 0,
    responseTime: 0.8,
    webhooksOnline: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("https://nova-bot-rpsy.onrender.com/api/stats")
      .then((res) => {
        if (!res.ok) throw new Error("API error");
        return res.json();
      })
      .then((data) => {
        setStats({
          servers: data.servers ?? 0,
          users: data.users ?? 0,
          responseTime: data.responseTime ?? 0.8,
          webhooksOnline: data.webhooksOnline ?? false,
        });
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load stats:", err);
        setError(true);
        setLoading(false);
      });
  }, []);

  const formatNumber = (num: number): string => {
    if (num === 0) return "0";
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M+";
    if (num >= 1000) return (num / 1000).toFixed(0) + "K+";
    return num.toString() + "+";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0A0F] to-[#111118] dark:from-[#0A0A0F] dark:to-[#111118] flex flex-col items-center justify-center p-5 font-sans">
      {/* Переключатель темы */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <header className="text-center mb-12">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-12 h-12 bg-[#16161F] dark:bg-[#16161F] rounded-xl flex items-center justify-center font-bold text-[#00E5FF] text-2xl">N</div>
          <span className="text-3xl font-extrabold text-white dark:text-white tracking-tight">НОВА</span>
        </div>
        <p className="text-lg text-[#94A3B8] mb-2 font-medium">Умный помощник для серверов</p>
        <p className="text-base text-[#64748B]">Вспышка энергии для твоего сообщества</p>
      </header>

      <div className="flex gap-4 flex-wrap justify-center mb-12">
        {loading && !error ? (
          <>
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-[#16161F] border border-[#1F2937] rounded-2xl py-6 px-8 text-center min-w-[160px]">
                <div className="w-24 h-7 bg-gradient-to-r from-[#1F2937] via-[#374151] to-[#1F2937] bg-[length:200%_100%] animate-shimmer rounded-lg" />
              </div>
            ))}
          </>
        ) : (
          <>
            <div className="bg-[#16161F] border border-[#1F2937] rounded-2xl py-6 px-8 text-center min-w-[160px]">
              <span className="block text-2xl font-bold text-white mb-1">{formatNumber(stats.servers)}</span>
              <span className="text-sm text-[#94A3B8] font-medium">Серверов</span>
            </div>
            <div className="bg-[#16161F] border border-[#1F2937] rounded-2xl py-6 px-8 text-center min-w-[160px]">
              <span className="block text-2xl font-bold text-white mb-1">{formatNumber(stats.users)}</span>
              <span className="text-sm text-[#94A3B8] font-medium">Пользователей</span>
            </div>
            <div className="bg-[#16161F] border border-[#1F2937] rounded-2xl py-6 px-8 text-center min-w-[160px]">
              <span className="block text-2xl font-bold text-white mb-1">{"<"}{stats.responseTime}s</span>
              <span className="text-sm text-[#94A3B8] font-medium">Ответ</span>
            </div>
          </>
        )}
      </div>

      <div className="text-center">
        <Link href="/login" className="inline-block py-3.5 px-8 bg-[#00E5FF] text-black font-bold text-base rounded-xl no-underline transition-all hover:shadow-[0_0_25px_rgba(0,229,255,0.3)] shadow-[0_0_20px_rgba(0,229,255,0.2)]">
          ⭐ Интегрировать Нова
        </Link>
        <p className="mt-4 text-sm text-[#94A3B8] flex items-center justify-center gap-1.5">
          {stats.webhooksOnline ? (
            <>
              <span className="w-2 h-2 bg-[#22C55E] rounded-full inline-block" />
              Вебхуки работают
            </>
          ) : (
            "Подключение..."
          )}
          <span className="text-[#64748B]"> • Полная версия скоро</span>
        </p>
      </div>

      {error && (
        <p className="mt-6 text-sm text-[#F59E0B] bg-[#F59E0B]/10 py-2 px-4 rounded-lg">
          ⚡ Данные временно недоступны. Мы уже работаем над этим.
        </p>
      )}
    </div>
  );
}
