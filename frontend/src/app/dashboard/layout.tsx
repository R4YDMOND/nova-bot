import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { ServerProvider } from '@/context/ServerProvider';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ServerProvider>
      <div className="relative min-h-screen bg-[rgb(var(--bg))]">
        <div className="animated-bg" aria-hidden="true">
          <div className="blob blob-1" />
          <div className="blob blob-2" />
          <div className="blob blob-3" />
        </div>

        <div className="relative z-10 flex h-screen overflow-hidden text-[rgb(var(--text))]">
          <Sidebar />
          <div className="flex-1 flex flex-col overflow-hidden">
            <Header />
            <main className="flex-1 overflow-auto p-6 lg:p-8">
              {children}
            </main>
          </div>
        </div>
      </div>
    </ServerProvider>
  );
}