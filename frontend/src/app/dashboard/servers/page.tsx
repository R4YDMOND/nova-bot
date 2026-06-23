"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const API_URL = "https://nova-bot-rpsy.onrender.com";

const sanitize = (text: string): string => {
  if (!text) return "";
  return text.replace(/[-\u001F]/g, "").replace(/[\u200B-\u200D]/g, "").replace(/[\uFEFF]/g, "").trim();
};

export default function ServersPage() {
  const [servers, setServers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(API_URL + "/api/servers")
      .then((res) => res.json())
      .then((data) => {
        setServers(data.servers || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">🌐 Мои серверы</h1>
          <p className="text-[rgb(var(--text-secondary))]">Управляйте подключёнными серверами</p>
        </div>
        <Button onClick={() => window.location.href = "/dashboard/servers/add"}>
          + Добавить сервер
        </Button>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Всего серверов", value: servers.length, icon: "🖥️" },
          { label: "Активных", value: servers.length, icon: "✅" },
          { label: "Модулей доступно", value: "9", icon: "📦" },
          { label: "Время ответа", value: "<0.8s", icon: "⚡" },
        ].map((s, i) => (
          <Card key={i} className="flex items-center gap-4 p-6">
            <span className="text-3xl">{s.icon}</span>
            <div>
              <div className="text-2xl font-bold">{s.value}</div>
              <div className="text-sm text-[rgb(var(--text-secondary))]">{s.label}</div>
            </div>
          </Card>
        ))}
      </div>

      {/* Список серверов */}
      <Card>
        {loading ? (
          <div className="py-16 text-center text-[rgb(var(--text-secondary))]">
            Загрузка серверов...
          </div>
        ) : servers.length === 0 ? (
          <div className="py-16 text-center">
            <div className="text-5xl mb-4">🌐</div>
            <p className="text-[rgb(var(--text-secondary))] mb-4">У вас пока нет подключённых серверов</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[rgb(var(--border))] text-left text-xs uppercase text-[rgb(var(--text-secondary))]">
                <th className="py-4 px-4">Сервер</th>
                <th className="py-4 px-4">ID</th>
                <th className="py-4 px-4">Статус</th>
                <th className="py-4 px-4">Действия</th>
              </tr>
            </thead>
            <tbody>
              {servers.map((s: any) => (
                <tr key={s.id} className="border-b border-[rgb(var(--border))] hover:bg-[rgb(var(--surface-2))] transition-colors">
                  <td className="py-4 px-4 font-medium">{sanitize(s.name)}</td>
                  <td className="py-4 px-4 text-[rgb(var(--text-secondary))] text-xs font-mono">{s.id}</td>
                  <td className="py-4 px-4">
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400">
                      Активен
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <Button 
                      variant="secondary" 
                      size="sm"
                      onClick={() => window.location.href = "/dashboard/modules"}
                    >
                      Настроить
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
