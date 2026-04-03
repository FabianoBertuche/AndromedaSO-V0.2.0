import { FastifyPluginAsync } from 'fastify';
import { agentEvolutionService } from '../evolution/evolutionService';

export const evolutionRoutes: FastifyPluginAsync = async (server) => {
  server.post('/agents/:id/version/snapshot', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as { gitCommit?: string; manifest?: Record<string, unknown> };

    if (!body?.gitCommit || !body?.manifest) {
      return reply.status(400).send({ error: 'gitCommit and manifest are required' });
    }

    const snapshot = agentEvolutionService.snapshotVersion(id, {
      gitCommit: body.gitCommit,
      manifest: body.manifest
    });

    return { snapshot };
  });

  server.get('/agents/:id/version/diff', async (request, reply) => {
    const { id } = request.params as { id: string };
    const { fromVersion, toVersion } = request.query as { fromVersion?: string; toVersion?: string };

    if (!fromVersion || !toVersion) {
      return reply.status(400).send({ error: 'fromVersion and toVersion are required' });
    }

    const diff = agentEvolutionService.getDiff(id, Number(fromVersion), Number(toVersion));
    if (!diff) {
      return reply.status(404).send({ error: 'Version snapshot not found' });
    }

    return diff;
  });

  server.post('/agents/:id/version/rollback', async (request, reply) => {
    const { id } = request.params as { id: string };
    const snapshot = agentEvolutionService.rollback(id);
    if (!snapshot) {
      return reply.status(400).send({ error: 'Rollback requires at least 2 versions' });
    }

    return { rollbackVersion: snapshot.version, restoredGitCommit: snapshot.gitCommit };
  });

  server.post('/agents/:id/performance/record', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as {
      date?: string;
      latencyP95?: number;
      successRate?: number;
      throughput?: number;
    };

    if (
      !body?.date
      || typeof body.latencyP95 !== 'number'
      || typeof body.successRate !== 'number'
      || typeof body.throughput !== 'number'
    ) {
      return reply.status(400).send({ error: 'date, latencyP95, successRate and throughput are required' });
    }

    const record = agentEvolutionService.recordPerformance(id, {
      date: body.date,
      latencyP95: body.latencyP95,
      successRate: body.successRate,
      throughput: body.throughput
    });

    return { record };
  });

  server.get('/agents/:id/performance', async (request) => {
    const { id } = request.params as { id: string };
    const records = agentEvolutionService.getPerformance(id);
    return { agentId: id, records };
  });

  server.post('/agents/:id/reputation/feedback', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as { capability?: string; feedback?: number };

    if (!body?.capability || typeof body.feedback !== 'number') {
      return reply.status(400).send({ error: 'capability and feedback are required' });
    }

    const normalizedFeedback = Math.max(0, Math.min(1, body.feedback));
    agentEvolutionService.addCapabilityFeedback(id, body.capability, normalizedFeedback);
    return { ok: true };
  });

  server.get('/agents/:id/reputation', async (request) => {
    const { id } = request.params as { id: string };
    return agentEvolutionService.getReputation(id);
  });

  server.post('/agents/:id/budget/set', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as { dailyLimit?: number; monthlyLimit?: number };

    if (typeof body?.dailyLimit !== 'number' || typeof body?.monthlyLimit !== 'number') {
      return reply.status(400).send({ error: 'dailyLimit and monthlyLimit are required' });
    }

    const budget = agentEvolutionService.setBudget(id, body.dailyLimit, body.monthlyLimit);
    return { agentId: id, budget };
  });

  server.post('/agents/:id/budget/spend', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as { amount?: number };

    if (typeof body?.amount !== 'number' || body.amount < 0) {
      return reply.status(400).send({ error: 'amount must be a positive number' });
    }

    const outcome = agentEvolutionService.spendBudget(id, body.amount);
    if (!outcome.allowed) {
      return reply.status(429).send({ error: 'Budget limit exceeded', ...outcome });
    }

    return outcome;
  });

  server.get('/agents/:id/budget', async (request) => {
    const { id } = request.params as { id: string };
    return { agentId: id, budget: agentEvolutionService.getBudget(id) };
  });

  server.get('/dashboard/costs/data', async () => {
    return agentEvolutionService.getCostDashboardData();
  });

  server.get('/dashboard/costs', async (_request, reply) => {
    const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Andromeda Cost Dashboard</title>
    <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
    <style>
      body { font-family: 'Segoe UI', sans-serif; margin: 0; background: linear-gradient(135deg, #f6f8fb, #e8edf7); color: #1f2937; }
      .app { max-width: 980px; margin: 2rem auto; padding: 1.5rem; background: #ffffffcc; border-radius: 14px; box-shadow: 0 8px 30px rgba(31,41,55,.1); }
      h1 { margin-top: 0; font-size: 1.6rem; }
      table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
      th, td { border-bottom: 1px solid #e5e7eb; text-align: left; padding: .6rem; }
      th { font-size: .86rem; text-transform: uppercase; color: #4b5563; }
      .small { color: #6b7280; font-size: .9rem; }
      .toolbar { margin-top: 1rem; display: flex; gap: .7rem; }
      button { border: 0; background: #0f766e; color: white; padding: .55rem .9rem; border-radius: 8px; cursor: pointer; }
      pre { background: #111827; color: #d1fae5; padding: .8rem; border-radius: 10px; overflow-x: auto; }
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script>
      const e = React.createElement;
      function App() {
        const [data, setData] = React.useState({ agents: [], trend: [], generatedAt: '' });
        React.useEffect(() => {
          fetch('/dashboard/costs/data').then((r) => r.json()).then(setData);
        }, []);

        const exportCsv = () => {
          const lines = ['agentId,spentDaily,spentMonthly,remainingDaily,remainingMonthly'];
          for (const row of data.agents) {
            lines.push([row.agentId, row.spentDaily, row.spentMonthly, row.remainingDaily, row.remainingMonthly].join(','));
          }
          const blob = new Blob([lines.join('\\n')], { type: 'text/csv' });
          const a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = 'andromeda-costs.csv';
          a.click();
          URL.revokeObjectURL(a.href);
        };

        return e('div', { className: 'app' },
          e('h1', null, 'Andromeda Cost Dashboard'),
          e('div', { className: 'small' }, 'Generated at: ' + (data.generatedAt || '-')),
          e('table', null,
            e('thead', null,
              e('tr', null,
                e('th', null, 'Agent'),
                e('th', null, 'Spent (Daily)'),
                e('th', null, 'Spent (Monthly)'),
                e('th', null, 'Remaining (Daily)'),
                e('th', null, 'Remaining (Monthly)')
              )
            ),
            e('tbody', null,
              data.agents.map((row) => e('tr', { key: row.agentId },
                e('td', null, row.agentId),
                e('td', null, row.spentDaily),
                e('td', null, row.spentMonthly),
                e('td', null, row.remainingDaily),
                e('td', null, row.remainingMonthly)
              ))
            )
          ),
          e('div', { className: 'toolbar' },
            e('button', { onClick: exportCsv }, 'Export CSV')
          ),
          e('h2', null, 'Monthly Trend'),
          e('pre', null, JSON.stringify(data.trend, null, 2))
        );
      }

      ReactDOM.createRoot(document.getElementById('root')).render(e(App));
    </script>
  </body>
</html>`;

    reply.type('text/html').send(html);
  });

  server.post('/tasks/:id/feedback', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as {
      agentId?: string;
      capability?: string;
      thumbs?: 'up' | 'down';
      note?: string;
    };

    if (!body?.agentId || !body?.capability || (body.thumbs !== 'up' && body.thumbs !== 'down')) {
      return reply.status(400).send({ error: 'agentId, capability and thumbs are required' });
    }

    const feedback = agentEvolutionService.recordTaskFeedback({
      taskId: id,
      agentId: body.agentId,
      capability: body.capability,
      thumbs: body.thumbs,
      note: body.note
    });

    return { feedback };
  });
};