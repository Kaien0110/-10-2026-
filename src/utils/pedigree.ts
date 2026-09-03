import { Horse, FactorType } from '../types/horse';

export interface EvaluatedTheory {
  name: string;
  boost: string;       // 例: "＋4", "特大", "大" など
  description: string; // 詳しい解説文
}

// インブリード検出処理
export function detectInbreeding(sire: Horse, dam: Horse, horseMap: Map<string, Horse>): EvaluatedTheory[] {
  const theories: EvaluatedTheory[] = [];
  
  // 親系統・子系統の重複チェック（インブリード判定の簡易例）
  if (sire.subSystem && dam.subSystem && sire.subSystem === dam.subSystem) {
    theories.push({
      name: `${sire.subSystem} のインブリード`,
      boost: '危険度あり / 爆発力UP',
      description: `父と母の両方に【${sire.subSystem}】が含まれています。血が濃くなるため能力が上がりますが、危険度にも注意が必要です。`
    });
  }

  return theories;
}

// 配合理論の評価メイン処理
export function evaluateBreedingTheories(
  sire: Horse,
  dam: Horse,
  horseMap: Map<string, Horse>
): EvaluatedTheory[] {
  const results: EvaluatedTheory[] = [];

  // 1. 血脈活性化配合（親系統の多様性）
  if (sire.parentSystem !== dam.parentSystem) {
    results.push({
      name: '血脈活性化配合（簡易判定）',
      boost: '＋4',
      description: '父と母の親系統が異なっており、血統の多様性が保たれています。'
    });
  }

  // 2. SP/ST昇華理論
  const sireHasSP = sire.spFactor || sire.factors?.includes('sp');
  const damHasSP = dam.spFactor || dam.factors?.includes('sp');

  if (sireHasSP && damHasSP) {
    results.push({
      name: 'SP昇華配合',
      boost: '＋3',
      description: '両親ともにスピード（SP）因子を保有しています。産駒のスピード上限値と瞬発力が向上します。'
    });
  }

  const sireHasST = sire.stFactor || sire.factors?.includes('st');
  const damHasST = dam.stFactor || dam.factors?.includes('st');

  if (sireHasST && damHasST) {
    results.push({
      name: 'ST昇華配合',
      boost: '＋3',
      description: '両親ともにスタミナ（ST）因子を保有しています。産駒のスタミナと柔軟性が強化されます。'
    });
  }

  // 3. ニックス判定（例: トニービン系やサンデー系など）
  if (
    (sire.subSystem === 'トニービン系' || dam.subSystem === 'トニービン系') &&
    (sire.subSystem.includes('サンデー') || dam.subSystem.includes('サンデー'))
  ) {
    results.push({
      name: 'シングルニックス',
      boost: '＋2',
      description: '相性の良い系統同士（サンデーサイレンス系×トニービン系）の組み合わせです。'
    });
  }

  // 4. インブリード判定の結合
  const inbreeds = detectInbreeding(sire, dam, horseMap);
  results.push(...inbreeds);

  return results;
}
