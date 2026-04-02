import { ModuleManifest } from '../contracts/moduleManifest.schema';

export function detectCircularDependencies(manifests: ModuleManifest[]) {
  const graph = new Map<string, string[]>();

  for (const manifest of manifests) {
    graph.set(manifest.id, manifest.dependencies ?? []);
  }

  const visited = new Set<string>();
  const stack = new Set<string>();

  const dfs = (node: string): boolean => {
    if (stack.has(node)) {
      return true;
    }
    if (visited.has(node)) {
      return false;
    }

    visited.add(node);
    stack.add(node);

    const neighbors = graph.get(node) ?? [];
    for (const neighbor of neighbors) {
      if (dfs(neighbor)) {
        return true;
      }
    }

    stack.delete(node);
    return false;
  };

  for (const node of graph.keys()) {
    if (dfs(node)) {
      return true;
    }
  }

  return false;
}
