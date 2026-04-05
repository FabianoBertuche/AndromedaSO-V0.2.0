import { useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { AgentTable } from './components/AgentTable';
import { ModuleDiscover } from './components/ModuleDiscover';
import { StatusCard } from './components/StatusCard';
import { useStatus } from './hooks/useStatus';
import { Agents } from './pages/Agents';
import { CostDashboard } from './pages/CostDashboard';
import { Orchestrator } from './pages/Orchestrator';
import { LlmConnectionConsole } from './pages/LlmConnectionConsole';
import { ModelChatConsole } from './pages/ModelChatConsole';
import { RouterIntelligence } from './pages/RouterIntelligence';
import { OAuthCallbackHandler } from './pages/OAuthCallbackHandler';

const allowedTabs = ['dashboard', 'agents', 'costs', 'models', 'chat', 'router'] as const;
type AppTab = typeof allowedTabs[number];

function parseTab(search: string): AppTab {
  const tab = new URLSearchParams(search).get('tab');
  return allowedTabs.find((allowedTab) => allowedTab === tab) ?? 'dashboard';
}

function MainApp() {
  const location = useLocation();
  const navigate = useNavigate();
  const [discoveredAgentIds, setDiscoveredAgentIds] = useState<string[]>([]);
  const tab = parseTab(location.search);
  const { data, isLoading, error, isFetching } = useStatus();

  const navItems: Array<{ key: AppTab; label: string }> = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'agents', label: 'Agents' },
    { key: 'costs', label: 'Costs' },
    { key: 'models', label: 'Models' },
    { key: 'chat', label: 'Chat' },
    { key: 'router', label: 'Router Intelligence' }
  ];

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#00ff4122_0%,#00d4ff11_35%,#030712_100%)] p-4 text-white sm:p-8">
      <header className="mx-auto mb-8 max-w-6xl">
        <h1 className="font-mono text-4xl font-black tracking-wider text-green-300 drop-shadow-[0_0_14px_rgba(0,255,65,0.75)] sm:text-6xl">
          Andromeda OS
        </h1>
        <p className="mt-2 max-w-2xl font-mono text-lg text-cyan-300/90">LLM Connection Console + Router Intelligence</p>

        <nav className="mt-4 flex flex-wrap gap-2">
          {navItems.map((item) => (
            <button
              key={item.key}
              onClick={() => navigate(`/?tab=${item.key}`)}
              className={`rounded border px-3 py-1 font-mono text-sm ${tab === item.key
                ? 'border-cyan-300 bg-cyan-400/20 text-cyan-100'
                : 'border-cyan-600/40 bg-slate-900/40 text-cyan-300'}`}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </header>

      {tab === 'dashboard' && (
        <main className="mx-auto grid max-w-6xl grid-cols-1 gap-4 md:grid-cols-2">
          <div className="transition-all hover:scale-[1.01]">
            <StatusCard status={data} isLoading={isLoading || isFetching} error={(error as Error) ?? null} />
          </div>

          <div className="transition-all hover:scale-[1.01]">
            <ModuleDiscover
              defaultRootPath="C:\FB\Andromeda SO V0.2.0\core\kernel\test-modules"
              onDiscoveredAgentIds={setDiscoveredAgentIds}
            />
          </div>

          <div className="transition-all hover:scale-[1.01]">
            <AgentTable discoveredAgentIds={discoveredAgentIds} />
          </div>

          <div className="transition-all hover:scale-[1.01]">
            <CostDashboard />
          </div>

          <div className="md:col-span-2 transition-all hover:scale-[1.005]">
            <Orchestrator />
          </div>
        </main>
      )}

      {tab === 'agents' && (
        <main className="mx-auto max-w-6xl">
          <Agents />
        </main>
      )}

      {tab === 'costs' && (
        <main className="mx-auto max-w-6xl">
          <CostDashboard />
        </main>
      )}

      {tab === 'models' && (
        <main className="mx-auto max-w-6xl">
          <LlmConnectionConsole />
        </main>
      )}

      {tab === 'chat' && (
        <main className="mx-auto max-w-6xl">
          <ModelChatConsole />
        </main>
      )}

      {tab === 'router' && (
        <main className="mx-auto max-w-6xl">
          <RouterIntelligence />
        </main>
      )}
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/oauth/callback" element={<OAuthCallbackHandler />} />
        <Route path="*" element={<MainApp />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
