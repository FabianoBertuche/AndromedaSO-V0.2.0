import { useState } from 'react';
import { AgentTable } from './components/AgentTable';
import { ModuleDiscover } from './components/ModuleDiscover';
import { StatusCard } from './components/StatusCard';
import { useStatus } from './hooks/useStatus';
import { CostDashboard } from './pages/CostDashboard';

function App() {
  const [discoveredAgentIds, setDiscoveredAgentIds] = useState<string[]>([]);
  const { data, isLoading, error, isFetching } = useStatus();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 text-white sm:p-8">
      <header className="mx-auto mb-8 max-w-6xl">
        <h1 className="text-4xl font-black bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent sm:text-6xl">
          Andromeda OS
        </h1>
        <p className="mt-2 max-w-2xl text-lg text-slate-300">MVP1 LIVE: Status + Discover + Agents + Costs + Feedback</p>
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
      </main>
    </div>
  );
}

export default App;