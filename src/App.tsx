import React, { useState, useEffect } from 'react';
import { Horse } from './types/horse';
import { buildPedigreeTree, detectInbreeding, PedigreeNode, InbreedingResult } from './utils/pedigree';

export default function App() {
  const [horses, setHorses] = useState<Horse[]>([]);
  const [horseMap, setHorseMap] = useState<Map<string, Horse>>(new Map());
  const [sireSearch, setSireSearch] = useState('');
  const [damSearch, setDamSearch] = useState('');
  const [selectedSire, setSelectedSire] = useState<Horse | null>(null);
  const [selectedDam, setSelectedDam] = useState<Horse | null>(null);

  // 架空馬登録フォームの入力用ステート
  const [showAddForm, setShowAddForm] = useState(false);
  const [newHorseName, setNewHorseName] = useState('');
  const [newHorseKana, setNewHorseKana] = useState('');
  const [newHorseGender, setNewHorseGender] = useState<'牡' | '牝'>('牡');
  const [newHorseParentSystem, setNewHorseParentSystem] = useState('ヘイルトゥリーズン系');
  const [newHorseSubSystem, setNewHorseSubSystem] = useState('サンデーサイレンス系');

  // データ読み込み
  useEffect(() => {
    fetch('/data/horses.json')
      .then((res) => res.json())
      .then((data: Horse[]) => {
        setHorses(data);
        const map = new Map<string, Horse>();
        data.forEach((h) => map.set(h.id, h));
        setHorseMap(map);
      })
      .catch((err) => console.error('データの読み込みに失敗しました:', err));
  }, []);

  const sires = horses.filter(
    (h) => h.gender === '牡' && (h.name.includes(sireSearch) || h.kana.includes(sireSearch))
  );
  const dams = horses.filter(
    (h) => h.gender === '牝' && (h.name.includes(damSearch) || h.kana.includes(damSearch))
  );

  const inbreeding =
    selectedSire && selectedDam
      ? detectInbreeding(selectedSire.id, selectedDam.id, horseMap)
      : [];

  // 架空馬（産駒）の追加処理
  const handleAddFictionalHorse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHorseName.trim()) return;

    const newId = `fictional_${Date.now()}`;
    const createdHorse: Horse = {
      id: newId,
      name: newHorseName,
      kana: newHorseKana || newHorseName,
      gender: newHorseGender,
      sireId: selectedSire ? selectedSire.id : undefined,
      damId: selectedDam ? selectedDam.id : undefined,
      parentSystem: newHorseParentSystem,
      subSystem: newHorseSubSystem,
      spFactor: false,
      stFactor: false,
    };

    const updatedHorses = [...horses, createdHorse];
    const updatedMap = new Map(horseMap);
    updatedMap.set(newId, createdHorse);

    setHorses(updatedHorses);
    setHorseMap(updatedMap);

    // フォームのリセット
    setNewHorseName('');
    setNewHorseKana('');
    setShowAddForm(false);
    alert(`架空馬「${createdHorse.name}」を登録しました！検索から選択可能です。`);
  };

  return (
    <div style={{ padding: '16px', fontFamily: 'sans-serif', maxWidth: '600px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '20px', textAlign: 'center', marginBottom: '20px' }}>
        ウイニングポスト 2026 配合シミュレーター
      </h1>

      {/* 種牡馬選択 */}
      <section style={{ marginBottom: '20px', padding: '12px', border: '1px solid #ccc', borderRadius: '8px' }}>
        <h2 style={{ fontSize: '16px', marginTop: 0 }}>種牡馬 (父) の選択</h2>
        <input
          type="text"
          placeholder="馬名またはかな検索..."
          value={sireSearch}
          onChange={(e) => setSireSearch(e.target.value)}
          style={{ width: '100%', padding: '8px', boxSizing: 'border-box', marginBottom: '8px' }}
        />
        {sireSearch && (
          <div style={{ maxHeight: '120px', overflowY: 'auto', border: '1px solid #eee' }}>
            {sires.map((h) => (
              <div
                key={h.id}
                onClick={() => { setSelectedSire(h); setSireSearch(''); }}
                style={{ padding: '8px', cursor: 'pointer', borderBottom: '1px solid #eee' }}
              >
                {h.name} ({h.subSystem})
              </div>
            ))}
          </div>
        )}
        {selectedSire && (
          <div style={{ marginTop: '8px', fontWeight: 'bold', color: '#1a0dab' }}>
            選択中: {selectedSire.name} [{selectedSire.subSystem}]
          </div>
        )}
      </section>

      {/* 繁殖牝馬選択 */}
      <section style={{ marginBottom: '20px', padding: '12px', border: '1px solid #ccc', borderRadius: '8px' }}>
        <h2 style={{ fontSize: '16px', marginTop: 0 }}>繁殖牝馬 (母) の選択</h2>
        <input
          type="text"
          placeholder="馬名またはかな検索..."
          value={damSearch}
          onChange={(e) => setDamSearch(e.target.value)}
          style={{ width: '100%', padding: '8px', boxSizing: 'border-box', marginBottom: '8px' }}
        />
        {damSearch && (
          <div style={{ maxHeight: '120px', overflowY: 'auto', border: '1px solid #eee' }}>
            {dams.map((h) => (
              <div
                key={h.id}
                onClick={() => { setSelectedDam(h); setDamSearch(''); }}
                style={{ padding: '8px', cursor: 'pointer', borderBottom: '1px solid #eee' }}
              >
                {h.name} ({h.subSystem})
              </div>
            ))}
          </div>
        )}
        {selectedDam && (
          <div style={{ marginTop: '8px', fontWeight: 'bold', color: '#a01d0d' }}>
            選択中: {selectedDam.name} [{selectedDam.subSystem}]
          </div>
        )}
      </section>

      {/* 配合評価・インブリード結果 */}
      {selectedSire && selectedDam && (
        <section style={{ padding: '12px', backgroundColor: '#f9f9f9', borderRadius: '8px', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '16px', marginTop: 0 }}>配合評価結果</h2>
          <h3>インブリード（血の濃さ）</h3>
          {inbreeding.length > 0 ? (
            <ul>
              {inbreeding.map((item, idx) => (
                <li key={idx} style={{ color: '#d93025', fontWeight: 'bold' }}>
                  {item.horseName} {item.generations}
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ color: '#188038' }}>インブリードなし（アウトブリード）</p>
          )}

          <hr style={{ margin: '16px 0', border: 'none', borderTop: '1px solid #ddd' }} />

          {/* 産駒（架空馬）の登録ボタン */}
          {!showAddForm ? (
            <button
              onClick={() => setShowAddForm(true)}
              style={{
                width: '100%',
                padding: '10px',
                backgroundColor: '#1a73e8',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 'bold',
                fontSize: '14px',
              }}
            >
              ＋ この配合で生まれた自家生産馬（架空馬）を登録する
            </button>
          ) : (
            <form onSubmit={handleAddFictionalHorse} style={{ backgroundColor: '#fff', padding: '12px', borderRadius: '6px', border: '1px solid #ccc' }}>
              <h3 style={{ marginTop: 0, fontSize: '15px' }}>自家生産馬（架空馬）の登録</h3>
              <p style={{ fontSize: '12px', color: '#666', marginTop: 0 }}>
                父: {selectedSire.name} / 母: {selectedDam.name}
              </p>

              <div style={{ marginBottom: '8px' }}>
                <label style={{ fontSize: '12px', display: 'block' }}>馬名 (必須):</label>
                <input
                  type="text"
                  required
                  placeholder="例: トウカイパルス"
                  value={newHorseName}
                  onChange={(e) => setNewHorseName(e.target.value)}
                  style={{ width: '100%', padding: '6px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: '8px' }}>
                <label style={{ fontSize: '12px', display: 'block' }}>かな:</label>
                <input
                  type="text"
                  placeholder="例: とうかいぱるす"
                  value={newHorseKana}
                  onChange={(e) => setNewHorseKana(e.target.value)}
                  style={{ width: '100%', padding: '6px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: '8px' }}>
                <label style={{ fontSize: '12px', display: 'block' }}>性別:</label>
                <select
                  value={newHorseGender}
                  onChange={(e) => setNewHorseGender(e.target.value as '牡' | '牝')}
                  style={{ width: '100%', padding: '6px' }}
                >
                  <option value="牡">牡（種牡馬候補）</option>
                  <option value="牝">牝（繁殖牝馬候補）</option>
                </select>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', display: 'block' }}>子系統 (自動継承/変更可能):</label>
                <input
                  type="text"
                  value={newHorseSubSystem}
                  onChange={(e) => setNewHorseSubSystem(e.target.value)}
                  style={{ width: '100%', padding: '6px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="submit"
                  style={{ flex: 1, padding: '8px', backgroundColor: '#34a853', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold' }}
                >
                  登録決定
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  style={{ padding: '8px', backgroundColor: '#999', color: '#fff', border: 'none', borderRadius: '4px' }}
                >
                  キャンセル
                </button>
              </div>
            </form>
          )}
        </section>
      )}
    </div>
  );
}
