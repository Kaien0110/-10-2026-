export interface Horse {
  id: string;
  name: string;
  kana?: string;
  gender: '牡' | '牝';
  sireId?: string;
  damId?: string;
  sireName?: string;
  parentSystem: string;
  subSystem: string;
  systemType: 'SP' | 'ST' | 'NONE';
  factors?: string[];
}
