'use client';
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { X, Mail } from 'lucide-react';

const API_BASE = 'https://nova-bot-rpsy.onrender.com';
const FALLBACK_STATS = { servers: 1247, users: 87450, responseTime: 0.68 };
const FEATURES = [
  { icon: 'рџ›ЎпёЏ', title: 'РњРѕРґРµСЂР°С†РёСЏ', desc: 'РђРІС‚Рѕ-РјРѕРґ, С„РёР»СЊС‚СЂС‹, Р°РЅС‚РёСЃРїР°Рј' },
  { icon: 'рџ¤–', title: 'AI-РџРѕРјРѕС‰РЅРёРє', desc: 'РЈРјРЅС‹Рµ РѕС‚РІРµС‚С‹ Рё РіРµРЅРµСЂР°С†РёСЏ РєРѕРЅС‚РµРЅС‚Р°' },
  { icon: 'рџЏ†', title: 'РЎРёСЃС‚РµРјР° СѓСЂРѕРІРЅРµР№', desc: 'Р Р°РЅРіРё, РЅР°РіСЂР°РґС‹, Р»РёРґРµСЂР±РѕСЂРґС‹' },
  { icon: 'рџЋµ', title: 'РњСѓР·С‹РєР°', desc: 'YouTube, РЇРЅРґРµРєСЃ.РњСѓР·С‹РєР°, СЂР°РґРёРѕ' },
  { icon: 'рџ”—', title: 'Р’РµР±С…СѓРєРё', desc: 'Р“РёР±РєРёРµ СѓРІРµРґРѕРјР»РµРЅРёСЏ Рё РёРЅС‚РµРіСЂР°С†РёРё' },
  { icon: 'рџ“Љ', title: 'РђРЅР°Р»РёС‚РёРєР°', desc: 'РџРѕРґСЂРѕР±РЅР°СЏ СЃС‚Р°С‚РёСЃС‚РёРєР° СЃРµСЂРІРµСЂР°' },
];

function useCountUp(target: number, trigger: boolean, durationMs = 1200) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!trigger) return;
    let raf = 0;
    const start = performance.now();
    function tick(now: number) {
      const progress = Math.min((now - start) / durationMs, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(eased * target);
      if (progress < 1) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, trigger, durationMs]);
  return value;
}

export default function HomePage() {
  const [stats, setStats] = useState(FALLBACK_STATS);
  const [loaded, setLoaded] = useState(false);
  const [showLolkaModal, setShowLolkaModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/api/stats`, { cache: 'no-store' })
      .then(r => r.json())
      .then(data => setStats({
        servers: data.servers ?? data.total_servers ?? FALLBACK_STATS.servers,
        users: data.users ?? data.total_users ?? FALLBACK_STATS.users,
        responseTime: data.responseTime ?? data.response_time ?? FALLBACK_STATS.responseTime,
      }))
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const servers = Math.round(useCountUp(stats.servers, loaded));
  const users = useCountUp(stats.users, loaded);
  const responseTime = useCountUp(stats.responseTime, loaded);

  return (
    <div className="relative min-h-screen bg-[rgb(var(--bg))] text-[rgb(var(--text))]">
      <div className="animated-bg" aria-hidden="true">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />
      </div>

      <div className="relative z-10">
        <div className="pt-24 pb-16 px-6 text-center">
          <div className="max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-[rgb(var(--surface-2))] px-4 py-1.5 rounded-full mb-6">
              <span className="text-primary">вљЎ</span>
              <span className="text-sm font-medium">Nova Bot v2.4.1 вЂ” РђРєС‚РёРІРµРЅ</span>
            </div>

            <h1 className="text-6xl md:text-7xl font-bold tracking-tighter mb-6">
              РЈРјРЅС‹Р№ Р°СЃСЃРёСЃС‚РµРЅС‚
              <br />
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                РґР»СЏ VK Рё LOLKA
              </span>
            </h1>

            <p className="text-xl text-[rgb(var(--text-secondary))] max-w-2xl mx-auto mb-10">
              РњРѕРґРµСЂР°С†РёСЏ, AI-РїРѕРјРѕС‰РЅРёРє, СѓСЂРѕРІРЅРё, РјСѓР·С‹РєР° Рё РІРµР±С…СѓРєРё вЂ” РІСЃС‘ РІ РѕРґРЅРѕРј Р±РѕС‚Рµ
            </p>

            <div className="flex flex-col items-center gap-4">
              
              <a
                href="/api/auth/vk"
                className="w-full max-w-sm flex items-center justify-center gap-3 px-8 py-4 rounded-2xl font-semibold text-white bg-[#0077FF] hover:bg-[#006CE0] transition-colors text-lg"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path d="M15.684 0H8.316C1.592 0 0 1.592 0 8.316v7.368C0 22.408 1.592 24 8.316 24h7.368C22.408 24 24 22.408 24 15.684V8.316C24 1.592 22.408 0 15.684 0zm3.692 17.123h-1.744c-.66 0-.864-.525-2.05-1.727-1.033-1-1.49-1.135-1.744-1.135-.356 0-.458.102-.458.593v1.575c0 .424-.135.678-1.253.678-1.846 0-3.896-1.118-5.335-3.202C5.21 11.336 4.8 9.726 4.8 9.317c0-.254.102-.491.593-.491h1.744c.44 0 .61.203.78.677.863 2.49 2.303 4.675 2.896 4.675.22 0 .322-.102.322-.66V11.79c-.068-1.186-.695-1.287-.695-1.71 0-.203.17-.407.44-.407h2.744c.373 0 .508.203.508.643v3.473c0 .372.17.508.271.508.22 0 .407-.136.813-.542 1.254-1.406 2.151-3.574 2.151-3.574.119-.254.34-.491.78-.491h1.744c.525 0 .644.27.525.643-.22 1.017-2.354 4.031-2.354 4.031-.186.305-.254.44 0 .78.186.254.796.779 1.202 1.253.745.847 1.32 1.558 1.473 2.05.17.491-.085.745-.576.745z"/>
                </svg>
                Р’РѕР№С‚Рё С‡РµСЂРµР· VK
              </a>

              <button
                onClick={() => setShowLolkaModal(true)}
                className="w-full max-w-sm inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl font-semibold text-white bg-[#5865F2] hover:bg-[#4752C4] transition-colors text-lg"
              >
                <span className="text-xl">рџЋ®</span>
                Р’РѕР№С‚Рё С‡РµСЂРµР· Lolka
              </button>

              <button
                onClick={() => setShowEmailModal(true)}
                className="w-full max-w-sm inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl font-semibold text-[rgb(var(--text))] border border-[rgb(var(--border))] hover:bg-[rgb(var(--surface-2))] transition-colors text-lg"
              >
                <Mail className="w-5 h-5" />
                Р’РѕР№С‚Рё РїРѕ e-mail
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 pb-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { value: loaded ? `${servers.toLocaleString('ru-RU')}+` : '---', label: 'РЎРµСЂРІРµСЂРѕРІ РїРѕРґРєР»СЋС‡РµРЅРѕ' },
              { value: loaded ? `${(users / 1000).toFixed(1)}K+` : '---', label: 'РђРєС‚РёРІРЅС‹С… РїРѕР»СЊР·РѕРІР°С‚РµР»РµР№' },
              { value: loaded ? `${responseTime.toFixed(2)}СЃ` : '---', label: 'РЎСЂРµРґРЅРµРµ РІСЂРµРјСЏ РѕС‚РІРµС‚Р°' },
            ].map((s, i) => (
              <Card key={i} className="p-8 text-center">
                <div className="text-5xl font-bold text-primary mb-3">{s.value}</div>
                <div className="text-[rgb(var(--text-secondary))]">{s.label}</div>
              </Card>
            ))}
          </div>
        </div>

        <div className="bg-[rgb(var(--surface))] py-20">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-4xl font-bold text-center mb-12">Р’РѕР·РјРѕР¶РЅРѕСЃС‚Рё Nova</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {FEATURES.map((f, i) => (
                <Card key={i} className="p-8 hover:scale-[1.02] transition-transform cursor-default">
                  <div className="text-4xl mb-4">{f.icon}</div>
                  <h3 className="text-xl font-semibold mb-2">{f.title}</h3>
                  <p className="text-[rgb(var(--text-secondary))]">{f.desc}</p>
                </Card>
              ))}
            </div>
          </div>
        </div>

        <div className="text-center py-12 text-[rgb(var(--text-secondary))]">
          Nova Bot В© 2026 вЂ” РЈРјРЅС‹Р№ Р°СЃСЃРёСЃС‚РµРЅС‚ РґР»СЏ VK Рё Lolka
        </div>

        {showLolkaModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowLolkaModal(false)}>
            <div className="bg-[rgb(var(--surface))] border border-[rgb(var(--border))] rounded-3xl p-8 max-w-md w-full text-center relative shadow-2xl" onClick={e => e.stopPropagation()}>
              <button onClick={() => setShowLolkaModal(false)} className="absolute top-4 right-4 p-2 rounded-xl text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text))] hover:bg-[rgb(var(--surface-2))] transition-colors">
                <X className="w-5 h-5" />
              </button>
              <div className="w-16 h-16 bg-[#5865F2]/20 rounded-2xl flex items-center justify-center text-4xl mx-auto mb-4">рџЋ®</div>
              <h2 className="text-2xl font-bold text-[rgb(var(--text))] mb-2">Lolka вЂ” СЃРєРѕСЂРѕ</h2>
              <p className="text-[rgb(var(--text-secondary))] text-sm leading-relaxed mb-6">
                OAuth2-Р°РІС‚РѕСЂРёР·Р°С†РёСЏ Рё РїСѓР±Р»РёС‡РЅС‹Рµ РёРЅС‚РµРіСЂР°С†РёРё РґР»СЏ СЃС‚РѕСЂРѕРЅРЅРёС… СЃРµСЂРІРёСЃРѕРІ.
              </p>
              <div className="bg-[rgb(var(--surface-2))] border border-[rgb(var(--border))] rounded-2xl p-4 mb-6 text-left space-y-2">
                <div className="flex items-center gap-2 text-sm text-[rgb(var(--text-secondary))]"><span className="text-success">вњ“</span> Bot API вЂ” СѓР¶Рµ РґРѕСЃС‚СѓРїРµРЅ</div>
                <div className="flex items-center gap-2 text-sm text-[rgb(var(--text-secondary))]"><span className="text-warning">вЏі</span> OAuth2 РґР»СЏ СЃС‚РѕСЂРѕРЅРЅРёС… СЃРµСЂРІРёСЃРѕРІ вЂ” РІ СЂР°Р·СЂР°Р±РѕС‚РєРµ</div>
                <div className="flex items-center gap-2 text-sm text-[rgb(var(--text-secondary))]"><span className="text-warning">вЏі</span> РџСѓР±Р»РёС‡РЅС‹Рµ РёРЅС‚РµРіСЂР°С†РёРё вЂ” РІ СЂР°Р·СЂР°Р±РѕС‚РєРµ</div>
              </div>
              <button onClick={() => setShowLolkaModal(false)} className="w-full px-5 py-3 border border-[rgb(var(--border))] text-[rgb(var(--text-secondary))] rounded-xl hover:bg-[rgb(var(--surface-2))] transition-colors">
                Р—Р°РєСЂС‹С‚СЊ
              </button>
            </div>
          </div>
        )}

        {showEmailModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowEmailModal(false)}>
            <div className="bg-[rgb(var(--surface))] border border-[rgb(var(--border))] rounded-3xl p-8 max-w-md w-full text-center relative shadow-2xl" onClick={e => e.stopPropagation()}>
              <button onClick={() => setShowEmailModal(false)} className="absolute top-4 right-4 p-2 rounded-xl text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text))] hover:bg-[rgb(var(--surface-2))] transition-colors">
                <X className="w-5 h-5" />
              </button>
              <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center text-4xl mx-auto mb-4">
                <Mail className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-[rgb(var(--text))] mb-2">Р’С…РѕРґ РїРѕ e-mail вЂ” СЃРєРѕСЂРѕ</h2>
              <p className="text-[rgb(var(--text-secondary))] text-sm leading-relaxed mb-6">
                Р РµРіРёСЃС‚СЂР°С†РёСЏ Рё РІС…РѕРґ РїРѕ e-mail Рё РїР°СЂРѕР»СЋ СЃРµР№С‡Р°СЃ РІ СЂР°Р·СЂР°Р±РѕС‚РєРµ. РџРѕРєР° РёСЃРїРѕР»СЊР·СѓР№С‚Рµ VK.
              </p>
              <button onClick={() => setShowEmailModal(false)} className="w-full px-5 py-3 border border-[rgb(var(--border))] text-[rgb(var(--text-secondary))] rounded-xl hover:bg-[rgb(var(--surface-2))] transition-colors">
                Р—Р°РєСЂС‹С‚СЊ
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
