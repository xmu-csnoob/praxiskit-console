export interface ParsedTask {
  id: string;
  title: string;
  titleCn: string;
  titleEn: string;
  status: 'pending' | 'in-progress' | 'completed' | 'blocked';
  acceptanceCriteria: string;
  acceptanceCriteriaCn: string;
  acceptanceCriteriaEn: string;
  writeScope: string;
  dependencies: string[];
  wave: number;
}

export interface ParsedBatch {
  id: number;
  tasks: ParsedBatchTask[];
  authorization: 'dry-run' | 'execute';
  baselineStatus: string;
}

export interface ParsedBatchTask {
  id: string;
  title: string;
  statusAtSelection: string;
  dependencies: string[];
  writeScope: string;
}

export interface ParsedProjectMeta {
  name: string;
  ideaSummary?: string;
  prdSummary?: string;
}

export interface ParsedFunctionalRequirement {
  id: string;
  requirement: string;
  priority: string;
  validation: string;
  acceptanceCriteria: string;
  source: string;
}

export interface ParseResult {
  tasks: ParsedTask[];
  batches: ParsedBatch[];
  meta: ParsedProjectMeta;
  errors: ParseError[];
  functionalRequirements: ParsedFunctionalRequirement[];
  waves?: ParsedWave[];
}

export interface ParseError {
  file: string;
  message: string;
  line?: number;
}

export interface ParsedWave {
  id: string;
  name: string;
  parseResult: ParseResult;
  archivedAt?: string;
  isActive: boolean;
  source?: 'active' | 'archive';
}

export const WAVE_ARCHIVE_DIR = 'work/archive';
