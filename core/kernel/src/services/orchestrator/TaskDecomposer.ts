export type DecomposedSubtask = {
  id: string;
  title: string;
  capability: string;
  status: 'pending' | 'running' | 'completed' | 'blocked';
};

export class TaskDecomposer {
  decompose(task: string): DecomposedSubtask[] {
    const normalized = task.toLowerCase();

    if (normalized.includes('landing')) {
      return [
        { id: 'sub-design', title: 'Design system and visual hierarchy', capability: 'design', status: 'pending' },
        { id: 'sub-copy', title: 'Write hero and conversion copy', capability: 'copy', status: 'pending' },
        { id: 'sub-code', title: 'Implement responsive landing page', capability: 'code', status: 'pending' }
      ];
    }

    return [
      { id: 'sub-plan', title: `Plan execution for: ${task}`, capability: 'planning', status: 'pending' },
      { id: 'sub-build', title: `Build deliverable for: ${task}`, capability: 'code', status: 'pending' },
      { id: 'sub-review', title: `Review and harden output for: ${task}`, capability: 'review', status: 'pending' }
    ];
  }
}

export const taskDecomposer = new TaskDecomposer();
