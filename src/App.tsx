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

  const sireTree = selectedSire ? buildPedigreeTree(selectedSire.id, horseMap) : null;
  const damTree = selectedDam ? buildPedigreeTree(selectedDam.id, horseMap) : null;
  const inbreeding =
    selectedSire && selectedDam
      ? detectInbreeding(selectedSire.id, selectedDam.id, horseMap)
      : [];

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
        </section>
      )}
    </div>
  );
}
