import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { discoverModules, type DiscoverModulesResponse } from '../api/kernel';

type ModuleDiscoverProps = {
  defaultRootPath: string;
  onDiscoveredAgentIds: (ids: string[]) => void;
};

export function ModuleDiscover({ defaultRootPath, onDiscoveredAgentIds }: ModuleDiscoverProps) {
  const queryClient = useQueryClient();
  const [rootPath, setRootPath] = useState(defaultRootPath);

  const discoverMutation = useMutation({
    mutationFn: discoverModules,
    onSuccess: async (data) => {
      const ids = data.registered.map((item) => item.id);
      onDiscoveredAgentIds(ids);
      await queryClient.invalidateQueries({ queryKey: ['kernel-status'] });
      await queryClient.invalidateQueries({ queryKey: ['agents'] });
    }
  });

  return (
    <section className="h-full w-full rounded-2xl border border-slate-300/70 bg-white/70 p-6 backdrop-blur-sm dark:border-slate-700/60 dark:bg-slate-900/50">
      <header className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h3 className="font-display text-xl text-slate-900 dark:text-white">Module Discover</h3>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">POST /api/modules/discover</p>
        </div>
        <a href="#agent-table" className="text-sm font-medium text-cyan hover:underline">
          Ir para AgentTable
        </a>
      </header>

      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          value={rootPath}
          onChange={(event) => setRootPath(event.target.value)}
          className="w-full rounded-xl border border-slate-400 bg-white/70 px-4 py-3 text-sm text-slate-900 outline-none ring-cyan/50 transition focus:ring dark:border-slate-600 dark:bg-slate-950/60 dark:text-slate-100"
          placeholder="C:\\path\\to\\modules"
        />
        <button
          type="button"
          onClick={() => discoverMutation.mutate({ rootPath })}
          disabled={discoverMutation.isPending}
          className="rounded-xl bg-cyan px-5 py-3 text-sm font-semibold text-slate-950 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {discoverMutation.isPending ? 'Discovering...' : 'Discover'}
        </button>
      </div>

      {discoverMutation.isError ? (
        <p className="mt-3 text-sm text-ember">{(discoverMutation.error as Error).message}</p>
      ) : null}

      {discoverMutation.isSuccess ? <DiscoverTable response={discoverMutation.data} /> : null}
    </section>
  );
}

function DiscoverTable({ response }: { response: DiscoverModulesResponse }) {
  return (
    <div className="mt-5 overflow-x-auto rounded-xl border border-slate-300/70 dark:border-slate-700/70">
      <table className="min-w-full divide-y divide-slate-300 dark:divide-slate-700 text-left text-sm">
        <thead className="bg-slate-100/70 text-slate-700 dark:bg-slate-950/60 dark:text-slate-300">
          <tr>
            <th className="px-4 py-3 font-medium">id</th>
            <th className="px-4 py-3 font-medium">state</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 bg-white/60 text-slate-800 dark:divide-slate-800 dark:bg-slate-900/40 dark:text-slate-100">
          {response.registered.map((module) => (
            <tr key={module.id}>
              <td className="px-4 py-3 font-medium text-cyan">{module.id}</td>
              <td className="px-4 py-3">{module.state}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
