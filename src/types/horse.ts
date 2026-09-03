// 利用可能な因子タイプ
export type FactorType = 
  | 'sp'          // スピード
  | 'st'          // スタミナ
  | 'power'       // パワー
  | 'instant'     // 瞬発力
  | 'stamina'     // 根性
  | 'guts'        // 勝負根性
  | 'flexibility' // 柔軟性
  | 'health';     // 健康

// 競走馬・種牡馬データモデル
export interface Horse {
  id: string;
  name: string;
  kana?: string;
  gender: '牡' | '牝';
  sireId?: string;       // 父馬のID
  damId?: string;        // 母馬のID
  parentSystem: string;  // 親系統（例: ノーザンダンサー系）
  subSystem: string;     // 子系統（例: ニジンスキー系）
  factors?: FactorType[]; // 保有因子リスト
  spFactor?: boolean;    // SP因子フラグ
  stFactor?: boolean;    // ST因子フラグ
}

// 4代血統ツリー展開用のデータ構造
export interface PedigreeNode {
  horse: Horse | null;
  sire?: PedigreeNode;
  dam?: PedigreeNode;
}

// 〆配合計画ノート用モデル
export interface BreedingPlan {
  id: string;
  title: string;
  targetSireId?: string;
  targetDamId?: string;
  notes?: string;
  createdAt: number;
}
