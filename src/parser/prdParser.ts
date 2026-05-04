import type { ParsedFunctionalRequirement, ParseError } from './types';

export function parsePRD(content: string, _filename: string): { functionalRequirements: ParsedFunctionalRequirement[]; errors: ParseError[] } {
  void _filename;

  const functionalRequirements: ParsedFunctionalRequirement[] = [];
  const errors: ParseError[] = [];
  const lines = content.split('\n');

  let inFRTable = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detect the start of Functional Requirements section
    if (/^##\s*Functional Requirements/i.test(line.trim())) {
      inFRTable = true;
      continue;
    }

    // Stop if we hit another ## section after the FR table
    if (inFRTable && /^##\s/.test(line.trim()) && !/^##\s*Functional Requirements/i.test(line.trim())) {
      inFRTable = false;
      continue;
    }

    if (!inFRTable) continue;

    // Skip non-table rows
    if (!line.trim().startsWith('|')) continue;

    // Skip header and separator rows
    if (line.includes('ID') && line.includes('Requirement') && line.includes('Priority')) continue;
    if (line.includes('----')) continue;

    const parts = line.split('|').map((p) => p.trim()).filter((p) => p !== '');
    if (parts.length < 6) {
      // Skip rows that don't have enough columns (might be malformed or empty)
      continue;
    }

    const [id, requirement, priority, validation, acceptanceCriteria, source] = parts;

    // Only include rows with FR IDs (FR1, FR2, etc.)
    if (!id.match(/^FR\d+$/i)) {
      continue;
    }

    functionalRequirements.push({
      id: id.trim(),
      requirement: requirement.trim(),
      priority: priority.trim(),
      validation: validation.trim(),
      acceptanceCriteria: acceptanceCriteria.trim(),
      source: source.trim(),
    });
  }

  return { functionalRequirements, errors };
}
