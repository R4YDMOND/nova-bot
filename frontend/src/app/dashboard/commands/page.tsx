"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Toggle } from "@/components/ui/Toggle";

const sanitize = (text: string): string => {
  if (!text) return "";
  return text.replace(/[\u0000-\u001F]/g, "").replace(/[\u200B-\u200D]/g, "").replace(/[\uFEFF]/g, "").trim();
};

export default function CommandsPage() {
  const [commands, setCommands] = useState([
    { name: "🏓 /ping", desc: "Проверка бота", category: "Основные", enabled: true, cooldown: 3, allowedRoles: "" },
    { name: "❓ /help", desc: "Список команд", category: "Основные", enabled: true, cooldown: 5, allowedRoles: "" },
    { name: "📊 /stats", desc: "Статистика", category: "Основные", enabled: true, cooldown: 10, allowedRoles: "" },
    { name: "🔨 /ban", desc: "Забанить", category: "Модерация", enabled: true, cooldown: 0, allowedRoles: "@модер, @админ" },
    { name: "👢 /kick", desc: "Выгнать", category: "Модерация", enabled: true, cooldown: 0, allowedRoles: "@модер, @админ" },
    { name: "🔇 /mute", desc: "Замутить", category: "Модерация", enabled: true, cooldown: 0, allowedRoles: "@модер, @админ" },
    { name: "🧹 /clear", desc: "Очистить чат", category: "Модерация", enabled: false, cooldown: 5, allowedRoles: "@админ" },
    { name: "🏆 /rank", desc: "Уровень", category: "Уровни", enabled: true, cooldown: 5, allowedRoles: "" },
    { name: "📈 /top", desc: "Топ участников", category: "Уровни", enabled: true, cooldown: 15, allowedRoles: "" },
    { name: "🎵 /play", desc: "Музыка", category: "Музыка", enabled: false, cooldown: 3, allowedRoles: "@DJ" },
    { name: "🤖 /ai", desc: "Спросить AI", category: "AI", enabled: true, cooldown: 5, allowedRoles: "" },
  ]);

  const [saved, setSaved] = useState(false);
  const [activeCategory, setActiveCategory] = useState("Все");
  const [searchQuery, setSearchQuery] = useState("");
  const categories = ["Все", "Основные", "Модерация", "Уровни", "Музыка", "AI"];

  const filtered = commands.filter((c) => {
    const matchCat = activeCategory === "Все" || c.category === activeCategory;
    const matchSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.desc.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const toggle = (name: string) => setCommands(commands.map((c) => (c.name === name ? { ...c, enabled: !c.enabled } : c)));
  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">⚡ Команды</h1>
          <p className="text-[rgb(var(--text-secondary))] text-sm">Управляйте доступными командами бота</p>
        </div>
        <button onClick={save} className={`px-5 py-2.5 rounded-2xl font-semibold text-sm transition-all ${saved ? 'bg-emerald-500 text-black' : 'bg-nova-500 hover:bg-nova-600 text-black'}`}>
          {saved ? "✅ Сохранено" : "💾 Сохранить"}
        </button>
      </div>

      <div className="flex gap-3 flex-wrap items-center">
        <input type="text" value={sanitize(searchQuery)} onChange={(e) => setSearchQuery(e.target.value)} placeholder="🔍 Поиск команд..." className="input w-56" />
        <div className="flex gap-1.5 flex-wrap">
          {categories.map((cat) => (
            <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all ${activeCategory === cat ? 'bg-[rgb(var(--surface-2))] border-[rgb(var(--border))] text-white' : 'border-transparent text-[rgb(var(--text-secondary))] hover:text-white'}`}>{cat}</button>
          ))}
        </div>
      </div>

      <Card>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[rgb(var(--border))] text-left text-xs uppercase text-[rgb(var(--text-secondary))]">
              {["Команда", "Описание", "Категория", "Кулдаун", "Роли", "Статус"].map((h, i) => (<th key={i} className="py-3 px-4 font-semibold">{h}</th>))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((cmd, i) => (
              <tr key={i} className="border-b border-[rgb(var(--border))] hover:bg-[rgb(var(--surface-2))]">
                <td className="py-3 px-4"><code className="bg-[rgb(var(--surface-2))] px-2.5 py-1 rounded-lg text-nova-400 font-mono text-xs">{sanitize(cmd.name)}</code></td>
                <td className="py-3 px-4">{sanitize(cmd.desc)}</td>
                <td className="py-3 px-4"><span className="bg-[rgb(var(--surface-2))] px-2 py-0.5 rounded-lg text-xs text-[rgb(var(--text-secondary))]">{cmd.category}</span></td>
                <td className="py-3 px-4 text-[rgb(var(--text-secondary))]">{cmd.cooldown}с</td>
                <td className="py-3 px-4 text-[rgb(var(--text-muted))] text-xs">{sanitize(cmd.allowedRoles) || "Все"}</td>
                <td className="py-3 px-4"><Toggle checked={cmd.enabled} onCheckedChange={() => toggle(cmd.name)} /></td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={6} className="py-10 text-center text-[rgb(var(--text-muted))]">Команды не найдены</td></tr>}
          </tbody>
        </table>
      </Card>
    </div>
  );
}