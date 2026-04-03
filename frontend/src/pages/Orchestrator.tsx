import { FormEvent, useMemo, useState } from 'react';
import { Background, Controls, Edge, MiniMap, Node, ReactFlow } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useOrchestrator } from '../hooks/useOrchestrator';

export function Orchestrator() {
  const [taskInput, setTaskInput] = useState('Criar landing page');
  const [fromAgent, setFromAgent] = useState('agent-design');
  const [toAgent, setToAgent] = useState('agent-code');
  const [chatMessage, setChatMessage] = useState('Sincronizar spacing tokens e hero copy.');

  const {
    taskId,
    createTask,
    orchestration,
    orchestratorStatus,
    streamEvents,
    sendMessage
  } = useOrchestrator();

  const onCreateTask = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (taskInput.trim().length === 0) {
      return;
    }
    createTask.mutate(taskInput);
  };

  const onSendMessage = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!fromAgent || !toAgent || chatMessage.trim().length === 0 || !taskId) {
      return;
    }
    sendMessage.mutate({ from: fromAgent, to: toAgent, content: chatMessage });
  };

  const { nodes, edges } = useMemo(() => {
    const tree = orchestration?.tree ?? [];
    if (tree.length === 0) {
      return { nodes: [] as Node[], edges: [] as Edge[] };
    }

    const root = tree[0];
    const rootNode: Node = {
      id: root.id,
      position: { x: 300, y: 20 },
      data: { label: `${root.title} (${root.state})` },
      style: {
        border: '1px solid #00ff41',
        color: '#bbf7d0',
        background: '#02120a',
        boxShadow: '0 0 16px rgba(0,255,65,0.4)'
      }
    };

    const children = root.children ?? [];
    const childNodes: Node[] = children.map((child, index) => ({
      id: child.id,
      position: { x: 80 + index * 230, y: 190 },
      data: { label: `${child.title} -> ${child.assignee ?? 'unassigned'} (${child.state})` },
      style: {
        border: '1px solid #00ff41',
        color: '#dcfce7',
        background: '#052e16'
      }
    }));

    const graphEdges: Edge[] = children.map((child) => ({
      id: `${root.id}-${child.id}`,
      source: root.id,
      target: child.id,
      animated: true,
      style: { stroke: '#00ff41' }
    }));

    return {
      nodes: [rootNode, ...childNodes],
      edges: graphEdges
    };
  }, [orchestration]);

  return (
    <section className="rounded-2xl border border-green-400/40 bg-black/60 p-4 shadow-[0_0_24px_rgba(0,255,65,0.35)] backdrop-blur">
      <h2 className="font-mono text-xl font-bold text-green-300">MVP11 Orchestrator Matrix</h2>

      <form className="mt-3 grid gap-2" onSubmit={onCreateTask}>
        <label className="font-mono text-xs uppercase tracking-[0.25em] text-green-400">Task Input</label>
        <input
          value={taskInput}
          onChange={(event) => setTaskInput(event.target.value)}
          className="rounded border border-green-500/60 bg-black px-3 py-2 font-mono text-green-200 outline-none focus:border-green-300"
          placeholder="Criar landing page"
        />
        <button
          type="submit"
          className="rounded border border-green-300 bg-green-500/20 px-4 py-2 font-mono text-green-200 transition hover:bg-green-400/30"
        >
          Orchestrate Agents
        </button>
      </form>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded border border-green-600/40 bg-black/70 p-3">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-green-500">Team Status</p>
          <p className="mt-1 font-mono text-sm text-green-200">Active Teams: {orchestratorStatus.data?.activeTeams ?? 0}</p>
          <p className="font-mono text-sm text-green-200">Pending Subtasks: {orchestratorStatus.data?.pending ?? 0}</p>
          <p className="mt-1 font-mono text-xs text-green-400">Task ID: {taskId || '-'}</p>
        </div>

        <div className="rounded border border-green-600/40 bg-black/70 p-3">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-green-500">Human Fallback</p>
          <p className="mt-1 font-mono text-sm text-green-200">
            {orchestration?.requiresHumanFallback ? 'Intervenção humana requerida' : 'Sem conflitos bloqueantes'}
          </p>
        </div>
      </div>

      <div className="mt-4 h-[360px] rounded border border-green-500/40 bg-[#020f08]">
        <ReactFlow nodes={nodes} edges={edges} fitView>
          <MiniMap nodeColor="#00ff41" maskColor="rgba(0,0,0,0.5)" />
          <Controls />
          <Background gap={18} color="rgba(0,255,65,0.25)" />
        </ReactFlow>
      </div>

      <form className="mt-4 grid gap-2" onSubmit={onSendMessage}>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-green-500">Agent Chat</p>
        <div className="grid gap-2 sm:grid-cols-2">
          <input
            value={fromAgent}
            onChange={(event) => setFromAgent(event.target.value)}
            className="rounded border border-green-600/60 bg-black px-3 py-2 font-mono text-green-200"
            placeholder="from agent"
          />
          <input
            value={toAgent}
            onChange={(event) => setToAgent(event.target.value)}
            className="rounded border border-green-600/60 bg-black px-3 py-2 font-mono text-green-200"
            placeholder="to agent"
          />
        </div>
        <input
          value={chatMessage}
          onChange={(event) => setChatMessage(event.target.value)}
          className="rounded border border-green-600/60 bg-black px-3 py-2 font-mono text-green-200"
          placeholder="message"
        />
        <button type="submit" className="rounded border border-green-300 bg-green-600/20 px-4 py-2 font-mono text-green-100 hover:bg-green-500/30">
          Send Agent Message
        </button>
      </form>

      <div className="mt-4 rounded border border-green-700/50 bg-black/80 p-3">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-green-500">Realtime Stream</p>
        <ul className="mt-2 max-h-40 space-y-2 overflow-auto">
          {streamEvents.slice(-8).map((event, index) => (
            <li key={`${event.type}-${index}`} className="rounded border border-green-700/40 bg-black px-2 py-1 font-mono text-xs text-green-300">
              [{event.type}] {event.payload}
            </li>
          ))}
          {streamEvents.length === 0 && (
            <li className="font-mono text-xs text-green-700">No stream events yet.</li>
          )}
        </ul>
      </div>
    </section>
  );
}
