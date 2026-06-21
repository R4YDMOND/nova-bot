"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";

const API_URL = "https://nova-bot-rpsy.onrender.com";
const navigate = (url: string) => window.location.href = url;
const sanitize = (text: string): string => {
  if (!text) return "";
  return text.replace(/[\u0000-\u001F]/g, "").replace(/[\u200B-\u200D]/g, "").replace(/[\uFEFF]/g, "").trim();
};

export default function ServersPage() {
  const [servers, setServers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(API_URL + "/api/servers")
      .then((res) => res.json())
      .then((data) => { setServers(data.servers || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="flex justify-between items-start flex-wrap gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Мои серверы</h1>
          <p className="text-zinc-400">Управляйте подключёнными серверами</p>
        </div>
        <button onClick={() => navigate("/login")} className="px-5 py-2.5 bg-nova-500 hover:bg-nova-600 text-black rounded-2xl font-semibold text-sm">+ Добавить сервер</button>
      </div>
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[{ label: "Всего серверов", value: servers.length, icon: "A" },{ label: "Активных", value: servers.length, icon: "B" },{ label: "Модулей доступно", value: "9", icon: "C" },{ label: "Время ответа", value: "<0.8s", icon: "D" }].map((s, i) => <Card key={i} className="flex items-center gap-4"><span className="text-2xl">{s.icon}</span><div><div className="text-xl font-bold">{s.value}</div><div className="text-xs text-zinc-400">{s.label}</div></div></Card>)}
      </div>
      <Card>
        {loading ? <div className="py-16 text-center text-zinc-400">Загрузка...</div> : servers.length === 0 ? <div className="py-16 text-center"><div className="text-4xl mb-4">A</div><p className="text-zinc-400 mb-4">Добавьте первый сервер</p></div> : <table className="w-full text-sm"><thead><tr className="border-b border-zinc-700 text-left text-xs uppercase text-zinc-400"><th className="py-3 px-4">Сервер</th><th className="py-3 px-4">ID</th><th className="py-3 px-4">Статус</th><th className="py-3 px-4">Действия</th></tr></thead><tbody>{servers.map((s: any) => <tr key={s.id} className="border-b border-zinc-700"><td className="py-3 px-4 font-medium">{sanitize(s.name)}</td><td className="py-3 px-4 text-zinc-400 text-xs">{s.id}</td><td className="py-3 px-4"><span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400">Активен</span></td><td className="py-3 px-4"><button onClick={() => navigate("/dashboard/modules")} className="px-3 py-1.5 text-xs border border-zinc-700 rounded-xl text-nova-400">Настроить</button></td></tr>)}</tbody></table>}
      </Card>
    </div>
  );
}