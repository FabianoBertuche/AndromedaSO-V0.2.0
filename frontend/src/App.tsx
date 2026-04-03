import { useState } from 'react';
import { AgentTable } from './components/AgentTable';
import { ModuleDiscover } from './components/ModuleDiscover';
import { StatusCard } from './components/StatusCard';
import { useStatus } from './hooks/useStatus';
import { CostDashboard } from './pages/CostDashboard';
import { Orchestrator } from './pages/Orchestrator';

function App() {
  const [discoveredAgentIds, setDiscoveredAgentIds] = useState<string[]>([]);
  const { data, isLoading, error, isFetching } = useStatus();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#062212_0%,#02070a_45%,#010204_100%)] p-4 text-white sm:p-8">
      <header className="mx-auto mb-8 max-w-6xl">
        <h1 className="font-mono text-4xl font-black tracking-wider text-green-300 drop-shadow-[0_0_14px_rgba(0,255,65,0.75)] sm:text-6xl">
          Andromeda OS
        </h1>
        <p className="mt-2 max-w-2xl font-mono text-lg text-green-400/90">MVP11 LIVE: Multi-Agent Orchestration Matrix</p>
      </header>

      <main className="mx-auto grid max-w-6xl grid-cols-1 gap-4 md:grid-cols-2">
        <div className="transition-all hover:scale-[1.01]">
          <StatusCard status={data} isLoading={isLoading || isFetching} error={(error as Error) ?? null} />
        </div>

        <div className="transition-all hover:scale-[1.01]">
          <ModuleDiscover
            defaultRootPath="C:\\FB\\Andromeda SO V0.2.0\\core\\kernel\\test-modules"
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
    </div>
  );
}

export default App;