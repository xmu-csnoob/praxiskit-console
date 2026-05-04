interface TaskNode {
  id: string;
  dependencies: string[];
}

interface LayoutConfig {
  nodeWidth: number;
  nodeHeight: number;
  levelGap: number;
  siblingGap: number;
}

const defaultConfig: LayoutConfig = {
  nodeWidth: 200,
  nodeHeight: 104,
  levelGap: 200,
  siblingGap: 64,
};

export function computeLevels(tasks: TaskNode[]): Map<string, number> {
  const levels = new Map<string, number>();
  const taskMap = new Map<string, TaskNode>();
  const visiting = new Set<string>();

  for (const task of tasks) {
    taskMap.set(task.id, task);
  }

  function getLevel(taskId: string): number {
    if (levels.has(taskId)) {
      return levels.get(taskId)!;
    }

    // Cycle break: if we re-enter a node that's already on the current DFS stack,
    // treat it as level 0 to stop the recursion. The cycle edges are styled
    // separately by detectCycleEdges in App.tsx.
    if (visiting.has(taskId)) {
      return 0;
    }

    const task = taskMap.get(taskId);
    if (!task) {
      levels.set(taskId, 0);
      return 0;
    }

    if (task.dependencies.length === 0) {
      levels.set(taskId, 0);
      return 0;
    }

    visiting.add(taskId);
    const maxDepLevel = Math.max(
      ...task.dependencies.map((depId) => getLevel(depId))
    );
    visiting.delete(taskId);

    const level = maxDepLevel + 1;
    levels.set(taskId, level);
    return level;
  }

  for (const task of tasks) {
    getLevel(task.id);
  }

  return levels;
}

export interface PositionedNode {
  id: string;
  x: number;
  y: number;
}

export function computeTopologicalLayout(
  tasks: TaskNode[],
  config: Partial<LayoutConfig> = {}
): Map<string, PositionedNode> {
  const cfg = { ...defaultConfig, ...config };
  const levels = computeLevels(tasks);

  const nodesByLevel = new Map<number, string[]>();
  for (const [id, level] of levels) {
    if (!nodesByLevel.has(level)) {
      nodesByLevel.set(level, []);
    }
    nodesByLevel.get(level)!.push(id);
  }

  const positions = new Map<string, PositionedNode>();

  for (const [level, nodeIds] of nodesByLevel) {
    const totalWidth =
      nodeIds.length * cfg.nodeWidth + (nodeIds.length - 1) * cfg.siblingGap;
    let currentX = -totalWidth / 2;

    for (const id of nodeIds) {
      positions.set(id, {
        id,
        x: currentX + cfg.nodeWidth / 2,
        y: level * cfg.levelGap,
      });
      currentX += cfg.nodeWidth + cfg.siblingGap;
    }
  }

  return positions;
}

export interface CriticalPathResult {
  /** Node IDs on the critical path */
  nodeIds: Set<string>;
  /** Edge IDs (source-target) on the critical path */
  edgeIds: Set<string>;
  /** Length of the critical path in number of nodes */
  length: number;
}

/**
 * Compute the critical path: the longest dependency chain from any root to any leaf.
 * Since tasks have no duration estimates, path length = number of nodes in the chain.
 */
export function computeCriticalPath(tasks: TaskNode[]): CriticalPathResult {
  const taskMap = new Map<string, TaskNode>();
  for (const task of tasks) {
    taskMap.set(task.id, task);
  }

  // Build reverse adjacency (dependents)
  const dependents = new Map<string, string[]>();
  for (const task of tasks) {
    dependents.set(task.id, []);
  }
  for (const task of tasks) {
    for (const dep of task.dependencies) {
      if (dependents.has(dep)) {
        dependents.get(dep)!.push(task.id);
      }
    }
  }

  // Forward pass: longest distance from any root to each node
  const forwardDist = new Map<string, number>();
  const levels = computeLevels(tasks);

  // Process nodes in level order
  const maxLevel = Math.max(0, ...Array.from(levels.values()));
  for (let level = 0; level <= maxLevel; level++) {
    for (const [id, lv] of levels) {
      if (lv !== level) continue;
      const task = taskMap.get(id);
      if (!task || task.dependencies.length === 0) {
        forwardDist.set(id, 1);
      } else {
        const maxDepDist = Math.max(
          ...task.dependencies.map((depId) => forwardDist.get(depId) ?? 0)
        );
        forwardDist.set(id, maxDepDist + 1);
      }
    }
  }

  // Backward pass: longest distance from each node to any leaf
  const backwardDist = new Map<string, number>();
  for (let level = maxLevel; level >= 0; level--) {
    for (const [id, lv] of levels) {
      if (lv !== level) continue;
      const deps = dependents.get(id) ?? [];
      if (deps.length === 0) {
        backwardDist.set(id, 1);
      } else {
        const maxDepDist = Math.max(
          ...deps.map((depId) => backwardDist.get(depId) ?? 0)
        );
        backwardDist.set(id, maxDepDist + 1);
      }
    }
  }

  // Critical path length = max forward distance
  const criticalLength = Math.max(1, ...Array.from(forwardDist.values()));

  // A node is on the critical path if forwardDist + backwardDist - 1 === criticalLength
  const criticalNodeIds = new Set<string>();
  for (const [id, fd] of forwardDist) {
    const bd = backwardDist.get(id) ?? 0;
    if (fd + bd - 1 === criticalLength) {
      criticalNodeIds.add(id);
    }
  }

  // An edge is on the critical path if both nodes are critical AND
  // the forward distance relationship holds (source.level + 1 === target.level)
  const criticalEdgeIds = new Set<string>();
  for (const task of tasks) {
    for (const depId of task.dependencies) {
      if (criticalNodeIds.has(depId) && criticalNodeIds.has(task.id)) {
        const depForward = forwardDist.get(depId) ?? 0;
        const taskForward = forwardDist.get(task.id) ?? 0;
        if (taskForward === depForward + 1) {
          criticalEdgeIds.add(`${depId}-${task.id}`);
        }
      }
    }
  }

  return {
    nodeIds: criticalNodeIds,
    edgeIds: criticalEdgeIds,
    length: criticalLength,
  };
}

export interface ParallelGroup {
  level: number;
  nodeIds: string[];
}

/**
 * Group tasks by their topological level. Tasks in the same group can run in parallel.
 */
export function computeParallelGroups(tasks: TaskNode[]): ParallelGroup[] {
  const levels = computeLevels(tasks);
  const nodesByLevel = new Map<number, string[]>();

  for (const [id, level] of levels) {
    if (!nodesByLevel.has(level)) {
      nodesByLevel.set(level, []);
    }
    nodesByLevel.get(level)!.push(id);
  }

  const groups: ParallelGroup[] = [];
  const sortedLevels = Array.from(nodesByLevel.keys()).sort((a, b) => a - b);

  for (const level of sortedLevels) {
    groups.push({
      level,
      nodeIds: nodesByLevel.get(level) ?? [],
    });
  }

  return groups;
}
