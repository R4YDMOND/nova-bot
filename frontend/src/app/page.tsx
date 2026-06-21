'use client';

import Link from 'next/link';
import { Shield, BarChart3, Music, Bot, Award, Zap } from 'lucide-react';

export default function Home() {
  return (
    <main className="min-h-screen bg-[rgb(var(--background))] text-[rgb(var(--text))] overflow-hidden">
      {/* HERO */}
      <section className="min-h-screen flex flex-col items-center justify-center text-center px-6 py-20 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-nova-500/10 via-transparent to-transparent" />

        <div className="relative z-10">
          <div className="w-24 h-24 mx-auto mb-8 bg-gradient-to-br from-nova-400 to-nova-500 rounded-3xl flex items-center justify-center shadow-2xl shadow-nova-500/30">
            <span className="text-6xl font-black text-black">N</span>
          </div>

          <h1 className="text-6xl md:text-7xl font-bold tracking-tighter mb-6">НОВА</h1>
          <p className="text-2xl md:text-3xl text-[rgb(var(--text-secondary))] max-w-2xl mx-auto mb-4">Умный Discord-бот для Lolka-сообществ</p>
          <p className="text-lg text-zinc-500 mb-10">Вспышка энергии • Модерация • AI • Уровни • Музыка</p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/dashboard" className="inline-flex items-center justify-center rounded-2xl font-medium transition-all active:scale-[0.97] bg-nova-500 hover:bg-nova-600 text-black text-lg px-10 py-7">
              Запустить Нова →
            </Link>
            <Link href="/docs" className="inline-flex items-center justify-center rounded-2xl font-medium transition-all active:scale-[0.97] border border-[rgb(var(--border))] hover:bg-[rgb(var(--surface-2))] text-lg px-10 py-7">
              Документация
            </Link>
          </div>

          <p className="mt-6 text-sm text-zinc-500">Вебхуки уже работают • Полная версия скоро</p>
        </div>

        <div className="mt-20 grid grid-cols-3 gap-10 text-center">
          {[
            { num: '1.2K+', label: 'Серверов' },
            { num: '85K+', label: 'Пользователей' },
            { num: '<0.8s', label: 'Ответ' },
          ].map((stat, i) => (
            <div key={i}>
              <div className="text-4xl font-bold text-nova-400">{stat.num}</div>
              <div className="text-sm text-[rgb(var(--text-secondary))]">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-24 bg-[rgb(var(--surface))]">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-16">Возможности <span className="text-nova-400">Нова</span></h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Shield, title: 'Модерация', desc: 'Автоматическая фильтрация спама, мата и токсичности.' },
              { icon: Award, title: 'Система уровней', desc: 'Награды за активность и развитие участников.' },
              { icon: Bot, title: 'AI-помощник', desc: 'Умные ответы и помощь в разговорах.' },
              { icon: Music, title: 'Музыка', desc: 'Качественное воспроизведение в голосовых каналах.' },
              { icon: Zap, title: 'Вебхуки & События', desc: 'Гибкая система уведомлений и автоматизаций.' },
              { icon: BarChart3, title: 'Аналитика', desc: 'Подробная статистика роста сервера.' },
            ].map((feature, i) => (
              <div key={i} className="card group hover:border-nova-400/30 transition-all duration-300">
                <feature.icon className="w-10 h-10 text-nova-400 mb-6" />
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-[rgb(var(--text-secondary))]">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 text-center bg-gradient-to-b from-transparent via-nova-500/5 to-transparent">
        <div className="max-w-md mx-auto">
          <h2 className="text-4xl font-bold mb-6">Готовы сделать сервер лучше?</h2>
          <Link href="/dashboard" className="inline-flex items-center justify-center rounded-2xl font-medium transition-all active:scale-[0.97] bg-nova-500 hover:bg-nova-600 text-black text-lg px-12 py-7">
            Начать с Нова
          </Link>
        </div>
      </section>
    </main>
  );
}