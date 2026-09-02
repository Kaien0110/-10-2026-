import { Horse } from '../types/horse';

export interface PedigreeNode {
  horse?: Horse;
  sire?: PedigreeNode;
  dam?: PedigreeNode;
}

export interface InbreedingResult {
  horseName: string;
  generations: string;
}

export function buildPedigreeTree(
  horseId: string,
  horseMap: Map<string, Horse>,
  depth: number = 0
): PedigreeNode | undefined {
  if (depth > 3) return undefined;
  
  const horse = horseMap.get(horseId);
  if (!horse) return undefined;

  return {
    horse,
    sire: horse.sireId ? buildPedigreeTree(horse.sireId, horseMap, depth + 1) : undefined,
    dam: horse.damId ? buildPedigreeTree(horse.damId, horseMap, depth + 1) : undefined,
  };
}

export function detectInbreeding(
  sireId: string,
  damId: string,
  horseMap: Map<string, Horse>
): InbreedingResult[] {
  const sireAncestors = getAncestorsWithGenerations(sireId, horseMap, 1, 4);
  const damAncestors = getAncestorsWithGenerations(damId, horseMap, 1, 4);

  const results: InbreedingResult[] = [];
  const processedNames = new Set<string>();

  sireAncestors.forEach((sGen, name) => {
    if (damAncestors.has(name) && !processedNames.has(name)) {
      processedNames.add(name);
      const dGen = damAncestors.get(name)!;
      
      const sMatches = sGen.map(g => g + 1).join(',');
      const dMatches = dGen.map(g => g + 1).join(',');
      
      results.push({
        horseName: name,
        generations: `${sMatches}x${dMatches}`,
      });
    }
  });

  return results;
}

function getAncestorsWithGenerations(
  horseId: string,
  horseMap: Map<string, Horse>,
  currentGen: number,
  maxGen: number
): Map<string, number[]> {
  const ancestors = new Map<string, number[]>();
  if (currentGen > maxGen) return ancestors;

  const horse = horseMap.get(horseId);
  if (!horse) return ancestors;

  const addAncestor = (name: string, gen: number) => {
    if (!ancestors.has(name)) {
      ancestors.set(name, []);
    }
    ancestors.get(name)!.push(gen);
  };

  const traverse = (hId: string, gen: number) => {
    if (gen > maxGen) return;
    const h = horseMap.get(hId);
    if (!h) return;

    addAncestor(h.name, gen);

    if (h.sireId) traverse(h.sireId, gen + 1);
    if (h.damId) traverse(h.damId, gen + 1);
  };

  if (horse.sireId) traverse(horse.sireId, currentGen);
  if (horse.damId) traverse(horse.damId, currentGen);

  return ancestors;
}
