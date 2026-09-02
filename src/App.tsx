import React, { useState, useEffect } from 'react';
import { Horse } from './types/horse';
import {
  buildPedigreeTree,
  detectInbreeding,
  evaluateBreedingTheories,
  EvaluatedTheory,
} from './utils/pedigree';

export default function App() {
  const [horses, setHorses] = useState<Horse[]>([]);
  const [selectedSireId, setSelectedSireId] = useState<string>('');
  const [selectedDamId, setSelectedDamId] = useState<string>('');
  
  // 自家生産馬（架空馬）入力フォーム用
  const [newHorseName, setNewHorseName] = useState<string>('');
  const [newHorseSex, setNewHorseSex] = useState<'sire' | 'dam'>('sire');
  const [newHorseSystem, setNewHorseSystem] = useState<string>('サンデーサイレンス系');

  // 馬データの読み込み
  useEffect(() => {
    fetch('/data/horses.json')
      .then((res) => res.json())
      .then((data: Horse[]) => setHorses(data))
      .catch((err) => console.error('Failed to load horse data:', err));
  }, []);

  const horseMap = new Map<string, Horse>(horses.map((h) => [h.id, h]));

  const sires = horses.filter((h) => h.sex === 'sire');
  const dams = horses.filter((h) => h.sex === 'dam');

  const selectedSire = horseMap.get(selectedSireId);
  const selectedDam = horseMap.get(selectedDamId);

  // 配合理論の評価取得
  const evaluatedTheories: EvaluatedTheory[] =
    selectedSire && selectedDam
      ? evaluateBreedingTheories(selectedSire, selectedDam, horseMap)
      : [];

  // 架空馬の追加処理
  const handleAddCustomHorse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHorseName.trim() || !selectedSire || !selectedDam) return;

    const newHorse: Horse = {
      id: `custom-${Date.now()}`,
      name: newHorseName.trim(),
      sex: newHorseSex,
      sireId: selectedSire.id,
      damId: selectedDam.id,
      parentSystem: selectedSire.parentSystem || 'その他',
      subSystem: newHorseSystem,
    };

    setHorses((prev) => [...prev, newHorse]);
    setNewHorseName('');
    alert(`自家生産馬「${newHorse.name}」を登録しました！`);
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '16px', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: '20px', textAlign: 'center' }}>ウイニングポスト 配合シミュレーター</h1>

      {/* 馬選択エリア */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
        <div>
          <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>父（種牡馬）</label>
          <select
            value={selectedSireId}
            onChange={(e) => setSelectedSireId(e.target.value)}
            style={{ width: '100%', padding: '8px', borderRadius: '4px' }}
          >
            <option value="">選択してください</option>
            {sires.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name} ({h.subSystem || '系統不明'})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>母（繁殖牝馬）</label>
          <select
            value={selectedDamId}
            onChange={(e) => setSelectedDamId(e.target.value)}
            style={{ width: '100%', padding: '8px', borderRadius: '4px' }}
          >
            <option value="">選択してください</option>
            {dams.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name} ({h.subSystem || '系統不明'})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 配合評価・成立理論一覧 */}
      {selectedSire && selectedDam ? (
        <section style={{ backgroundColor: '#f5f5f5', padding: '16px', borderRadius: '8px', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '16px', marginTop: 0, marginBottom: '12px' }}>
            配合評価結果（{selectedSire.name} × {selectedDam.name}）
          </h2>

          {evaluatedTheories.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {evaluatedTheories.map((theory, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '10px 12px',
                    backgroundColor: '#fff',
                    borderRadius: '6px',
                    borderLeft: `5px solid ${
                      theory.boost === '特大'
                        ? '#9c27b0'
                        : theory.boost === '大'
                        ? '#e53935'
                        : theory.boost === '中'
                        ? '#fb8c00'
                        : '#1e88e5'
                    }`,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 'bold', fontSize: '14px' }}>{theory.name}</span>
                    <span
                      style={{
                        fontSize: '12px',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        backgroundColor: '#eee',
                        fontWeight: 'bold',
                      }}
                    >
                      爆発力: {theory.boost}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                    {theory.description}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: '#666', margin: 0 }}>成立している特殊な理論はありません（アウトブリード判定等を確認してください）。</p>
          )}

          {/* 自家生産馬登録フォーム */}
          <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #ddd' }}>
            <h3 style={{ fontSize: '14px', marginTop: 0 }}>＋ この配合で生まれた自家生産馬（架空馬）を登録する</h3>
            <form onSubmit={handleAddCustomHorse} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <input
                type="text"
                placeholder="馬名を入力（例: トウカイパルス）"
                value={newHorseName}
                onChange={(e) => setNewHorseName(e.target.value)}
                style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                required
              />
              <div style={{ display: 'flex', gap: '12px' }}>
                <label style={{ fontSize: '14px' }}>
                  <input
                    type="radio"
                    name="sex"
                    value="sire"
                    checked={newHorseSex === 'sire'}
                    onChange={() => setNewHorseSex('sire')}
                  />
                  牡馬（種牡馬）
                </label>
                <label style={{ fontSize: '14px' }}>
                  <input
                    type="radio"
                    name="sex"
                    value="dam"
                    checked={newHorseSex === 'dam'}
                    onChange={() => setNewHorseSex('dam')}
                  />
                  牝馬（繁殖牝馬）
                </label>
              </div>
              <button
                type="submit"
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#2e7d32',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                }}
              >
                架空馬として登録
              </button>
            </form>
          </div>
        </section>
      ) : (
        <p style={{ textAlign: 'center', color: '#888', margin: '40px 0' }}>
          父馬と母馬の両方を選択すると、成立している配合理論と結果が表示されます。
        </p>
      )}
    </div>
  );
}
