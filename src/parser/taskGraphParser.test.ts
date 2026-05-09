import { parseTaskGraph } from './taskGraphParser';
import { describe, it, expect } from 'vitest';

describe('parseTaskGraph bilingual support', () => {
  const makeTable = (rows: string[]) => [
    '| ID | Title | Status | Acceptance Criteria | Write Scope | Dependencies |',
    '|----|-------|--------|---------------------|-------------|--------------|',
    ...rows,
  ].join('\n');

  it('parses bilingual title with slash separator', () => {
    const content = makeTable([
      '| T0.1 | 定义类型 / Define type | [x] | Given input / 假设输入 | src/types.ts | [] |',
    ]);
    const { tasks, errors } = parseTaskGraph(content, 'test.md');
    expect(errors).toHaveLength(0);
    expect(tasks).toHaveLength(1);
    expect(tasks[0].titleCn).toBe('定义类型');
    expect(tasks[0].titleEn).toBe('Define type');
    expect(tasks[0].acceptanceCriteriaCn).toBe('假设输入');
    expect(tasks[0].acceptanceCriteriaEn).toBe('Given input');
  });

  it('parses bilingual with no CJK on left (English first)', () => {
    const content = makeTable([
      '| T1.1 | Scanner / 扫描器 | [/] | Given dir / 假设目录 | src/scan.ts | [T0.1] |',
    ]);
    const { tasks, errors } = parseTaskGraph(content, 'test.md');
    expect(errors).toHaveLength(0);
    expect(tasks[0].titleCn).toBe('扫描器');
    expect(tasks[0].titleEn).toBe('Scanner');
  });

  it('falls back to full text when no separator', () => {
    const content = makeTable([
      '| T0.1 | Define type | [x] | Given input then output | src/types.ts | [] |',
    ]);
    const { tasks, errors } = parseTaskGraph(content, 'test.md');
    expect(errors).toHaveLength(0);
    expect(tasks[0].titleCn).toBe('Define type');
    expect(tasks[0].titleEn).toBe('Define type');
    expect(tasks[0].acceptanceCriteriaCn).toBe('Given input then output');
    expect(tasks[0].acceptanceCriteriaEn).toBe('Given input then output');
  });

  it('handles English-first format (reversed)', () => {
    const content = makeTable([
      '| T0.1 | Define type / 定义类型 | [x] | Given input / 假设输入 | src/types.ts | [] |',
    ]);
    const { tasks, errors } = parseTaskGraph(content, 'test.md');
    expect(errors).toHaveLength(0);
    expect(tasks[0].titleCn).toBe('定义类型');
    expect(tasks[0].titleEn).toBe('Define type');
  });

  it('preserves original raw text', () => {
    const content = makeTable([
      '| T0.1 | 定义类型 / Define type | [x] | 假设输入 / Given input | src/types.ts | [] |',
    ]);
    const { tasks } = parseTaskGraph(content, 'test.md');
    expect(tasks[0].title).toBe('定义类型 / Define type');
    expect(tasks[0].acceptanceCriteria).toBe('假设输入 / Given input');
  });
});
