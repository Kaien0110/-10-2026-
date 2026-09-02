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

export interface EvaluatedTheory {
  name: string;
  category: '爆発力' | '能力・サブパラ' | '危険度';
  description: string;
  boost: '小' | '中' | '大' | '特大';
}

// 4代血統木の構築
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

// インブリード検出
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
      const sMatches = sGen.map((g) => g + 1).join(',');
      const dMatches = dGen.map((g) => g + 1).join(',');
      
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

  const traverse = (hId: string, gen: number) => {
    if (gen > maxGen) return;
    const h = horseMap.get(hId);
    if (!h) return;

    if (!ancestors.has(h.name)) {
      ancestors.set(h.name, []);
    }
    ancestors.get(h.name)!.push(gen);

    if (h.sireId) traverse(h.sireId, gen + 1);
    if (h.damId) traverse(h.damId, gen + 1);
  };

  const horse = horseMap.get(horseId);
  if (horse) {
    if (horse.sireId) traverse(horse.sireId, currentGen);
    if (horse.damId) traverse(horse.damId, currentGen);
  }

  return ancestors;
}

// 3代前先祖（8頭）の親系統・子系統リストを取得
export function get3rdGenAncestors(horseId: string, horseMap: Map<string, Horse>): Horse[] {
  const list: Horse[] = [];
  const traverse = (hId: string, depth: number) => {
    const h = horseMap.get(hId);
    if (!h) return;
    if (depth === 3) {
      list.push(h);
      return;
    }
    if (h.sireId) traverse(h.sireId, depth + 1);
    if (h.damId) traverse(h.damId, depth + 1);
  };
  traverse(horseId, 0);
  return list;
}

// 配合理論の総合判定ロジック
export function evaluateBreedingTheories(
  sire: Horse,
  dam: Horse,
  horseMap: Map<string, Horse>
): EvaluatedTheory[] {
  const theories: EvaluatedTheory[] = [];
  const inbreedList = detectInbreeding(sire.id, dam.id, horseMap);

  // 1. アウトブリード
  if (inbreedList.length === 0) {
    theories.push({
      name: 'アウトブリード',
      category: '爆発力',
      description: '精神力・賢さ・健康・柔軟性・競走寿命が底上げされます',
      boost: '小',
    });
  } else {
    // インブリード各種
    inbreedList.forEach((ib) => {
      if (ib.generations === '3x4' || ib.generations === '4x3') {
        theories.push({
          name: `奇跡の血量 (${ib.horseName} ${ib.generations})`,
          category: '爆発力',
          description: 'その先祖馬の特徴を強く引き継ぎます（危険度あり）',
          boost: '大',
        });
      } else {
        theories.push({
          name: `インブリード (${ib.horseName} ${ib.generations})`,
          category: '爆発力',
          description: '血統の濃さに比例して能力を引き出します（危険度増加）',
          boost: '中',
        });
      }
    });
  }

  // 2. ラインブリード系判定
  if (sire.parentSystem === dam.parentSystem) {
    if (sire.subSystem !== dam.subSystem) {
      theories.push({
        name: '親系統ラインブリード',
        category: '爆発力',
        description: '同親系統・異子系統による配合',
        boost: '中',
      });
    } else {
      theories.push({
        name: '子系統ラインブリード',
        category: '爆発力',
        description: '同子系統による濃いラインブリード',
        boost: '大',
      });
    }
  }

  // 3. 血脈活性化配合
  const sire3rd = get3rdGenAncestors(sire.id, horseMap);
  const dam3rd = get3rdGenAncestors(dam.id, horseMap);
  const all3rdSystems = new Set([...sire3rd, ...dam3rd].map((h) => h.parentSystem));

  if (all3rdSystems.size >= 8) {
    theories.push({
      name: '血脈活性化配合 (8系統)',
      category: '爆発力',
      description: '3代前先祖の親系統が8種類存在',
      boost: '特大',
    });
  } else if (all3rdSystems.size >= 6) {
    theories.push({
      name: '血脈活性化配合 (6〜7系統)',
      category: '爆発力',
      description: '3代前先祖の親系統が6種類以上存在',
      boost: '大',
    });
  }

  // 4. 系統特性昇華配合 (SP / ST)
  if (sire.spFactor && dam.spFactor) {
    theories.push({
      name: '系統特性昇華配合 (SP)',
      category: '能力・サブパラ',
      description: '父母ともにスピード系統',
      boost: '中',
    });
  } else if (sire.stFactor && dam.stFactor) {
    theories.push({
      name: '系統特性昇華配合 (ST)',
      category: '能力・サブパラ',
      description: '父母ともにスタミナ系統',
      boost: '中',
    });
  } else if ((sire.spFactor && dam.stFactor) || (sire.stFactor && dam.spFactor)) {
    theories.push({
      name: '系統特性融合配合 (SP・ST)',
      category: '能力・サブパラ',
      description: 'スピード系とスタミナ系の融合によるパワー上昇',
      boost: '大',
    });
  }

  // 5. ニックス判定（同一子系統の簡易ニックス例）
  if (sire.subSystem && dam.subSystem) {
    // 簡易サンプルロジック
    if (
      (sire.subSystem.includes('サンデー') && dam.subSystem.includes('トニービン')) ||
      (sire.subSystem.includes('パーソロン') && dam.subSystem.includes('ボールドルーラー'))
    ) {
      theories.push({
        name: 'シングルニックス',
        category: '爆発力',
        description: '相性の良い子系統同士の配合',
        boost: '小',
      });
    }
  }

  return theories;
}
