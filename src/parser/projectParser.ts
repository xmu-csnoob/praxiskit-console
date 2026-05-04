import type { FileSystemAdapter } from '@/fs/directoryReader';
import type { ParseResult, ParsedWave, ParseError } from './types';
import { parseWave } from './waveParser';
import { scanWaves } from './waveScanner';

export async function parseProject(adapter: FileSystemAdapter): Promise<ParseResult> {
  const waves: ParsedWave[] = [];
  const allErrors: ParseError[] = [];

  const descriptors = await scanWaves(adapter);

  for (const descriptor of descriptors) {
    try {
      const result = await parseWave(adapter, descriptor.path);
      allErrors.push(...result.errors);

      waves.push({
        id: descriptor.id,
        name: descriptor.name,
        parseResult: result,
        isActive: descriptor.isActive,
        archivedAt: descriptor.archivedAt,
        source: descriptor.isActive ? 'active' : 'archive',
      });
    } catch (err) {
      allErrors.push({
        file: descriptor.path,
        message: `Failed to parse iteration ${descriptor.id}: ${String(err)}`,
      });
    }
  }

  // Backward compatibility: derive top-level fields from active wave or first wave
  const activeWave = waves.find((w) => w.isActive);
  const fallbackWave = waves.length > 0 ? waves[0] : null;
  const sourceWave = activeWave ?? fallbackWave;

  const base: ParseResult = sourceWave
    ? {
        tasks: sourceWave.parseResult.tasks,
        batches: sourceWave.parseResult.batches,
        meta: sourceWave.parseResult.meta,
        errors: allErrors,
        functionalRequirements: sourceWave.parseResult.functionalRequirements,
        waves,
      }
    : {
        tasks: [],
        batches: [],
        meta: { name: adapter.getRootName() },
        errors: allErrors,
        functionalRequirements: [],
        waves,
      };

  return base;
}
