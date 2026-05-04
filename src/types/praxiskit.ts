export type TaskStatus = 'pending' | 'in-progress' | 'completed' | 'blocked';

export type TaskPriority = 'Must' | 'Should' | 'Could';

export interface Dependency {
  taskId: string;
}

export interface PraxisTask {
  id: string;
  title: string;
  status: TaskStatus;
  acceptanceCriteria: string;
  writeScope: string;
  dependencies: string[];
  wave: number;
  priority?: TaskPriority;
}

export interface ExecutionBatchTask {
  taskId: string;
  title: string;
  statusAtSelection: TaskStatus;
  dependencies: string[];
  writeScope: string;
}

export interface ExecutionBatch {
  id: number;
  tasks: ExecutionBatchTask[];
  authorization: 'dry-run' | 'execute';
  baselineStatus: 'pass' | 'fail' | 'unavailable';
}

export interface ProjectFile {
  name: string;
  path: string;
  content: string;
}

export interface PraxisProject {
  name: string;
  rootPath: string;
  idea?: ProjectFile;
  prd?: ProjectFile;
  taskGraph?: ProjectFile;
  executionBatches: ExecutionBatch[];
  buildLogs: ProjectFile[];
  review?: ProjectFile;
  acceptance?: ProjectFile;
  context?: ProjectFile;
  subagent?: ProjectFile;
}

export interface ParsedTaskGraph {
  tasks: PraxisTask[];
  criticalPath: string[];
  waves: Map<number, PraxisTask[]>;
}

export interface ParsedProject {
  project: PraxisProject;
  taskGraph: ParsedTaskGraph | null;
  errors: ParseError[];
}

export interface ParseError {
  file: string;
  message: string;
  line?: number;
}

export interface FileNode {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: FileNode[];
}
