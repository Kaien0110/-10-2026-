import React, { useState, useEffect } from 'react';
import { Horse, FactorType, BreedingPlan } from './types/horse';
import { evaluateBreedingTheories, EvaluatedTheory } from './utils/pedigree';

export default function App() {
  const [activeTab, setActiveTab] = useState<'simulator' | 'plans'>('simulator');
  const [horses, setHorses] = useState<Horse[]>([]);
  const [horseMap, setHorseMap] = useState<Map<string, Horse>>(new Map());

  // 配合シミュレーション用ステート
  const [sireSearch, setSireSearch] = useState('');
  const [damSearch, setDamSearch] = useState('');
  const [selectedSire, setSelectedSire] = useState<Horse | null>(null);
  const [selectedDam, setSelectedDam] = useState<Horse | null>(null);

  // 架空馬登録フォームステート
  const [showAddForm, setShowAddForm] = useState(false);
  const [newHorseName, setNewHorseName] = useState('');
  const [newHorseGender, setNewHorseGender] = useState<'牡' | '牝'>('牡');
  const [newHorseSubSystem, setNewHorseSubSystem] = useState('サンデーサイレンス系');
  const [selectedFactors, setSelectedFactors] = useState<FactorType[]>([]);

  // 〆配合計画用ステート
  const [plans, setPlans] = useState<BreedingPlan[]>([]);
  const [planTitle, setPlanTitle] = useState('');

  // 1. 初期データ読み込み & localStorage の統合
  useEffect(() => {
    fetch('/data/horses.json')
      .then((res) => res.json())
      .then((baseData: Horse[]) => {
        // localStorageから自家生産馬を取得
        const savedCustom = localStorage.getItem('wp_custom_horses');
        const customHorses: Horse[] = savedCustom ? JSON.parse(savedCustom) : [];

        const allHorses = [...baseData, ...customHorses];
        setHorses(allHorses);

        const map = new Map<string, Horse>();
        allHorses.forEach((h) => map.set(h.id, h));
        setHorseMap(map);
      })
      .catch((err) => console.error('データ読み込みエラー:', err));

    // 〆配合計画の読み込み
    const savedPlans = localStorage.getItem('wp_breeding_plans');
    if (savedPlans) {
      setPlans(JSON.parse(savedPlans));
    }
  }, []);

  // 自家生産馬登録ハンドラ（localStorage保存対応）
  const handleAddFictionalHorse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHorseName.trim() || !selectedSire || !selectedDam) return;

    const newId = `custom_${Date.now()}`;
    const newHorse: Horse = {
      id: newId,
      name: newHorseName.trim(),
      gender: newHorseGender,
      sireId: selectedSire.id,
      damId: selectedDam.id,
      parentSystem: selectedSire.parentSystem || 'その他',
      subSystem: newHorseSubSystem,
      factors: selectedFactors,
      spFactor: selectedFactors.includes('sp'),
      stFactor: selectedFactors.includes('st'),
    };

    // 保存処理
    const savedCustom = localStorage.getItem('wp_custom_horses');
    const customList: Horse[] = savedCustom ? JSON.parse(savedCustom) : [];
    const updatedCustomList = [...customList, newHorse];
    localStorage.setItem('wp_custom_horses', JSON.stringify(updatedCustomList));

    const updatedAll = [...horses, newHorse];
    setHorses(updatedAll);
    setHorseMap(new Map(updatedAll.map((h) => [h.id, h])));

    // リセット
    setNewHorseName('');
    setSelectedFactors([]);
    setShowAddForm(false);
    alert(`自家生産馬「${newHorse.name}」を保存登録しました！`);
  };

  // 〆配合計画の追加
  const handleAddPlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!planTitle.trim()) return;

    const newPlan: BreedingPlan = {
      id: `plan_${Date.now()}`,
      title: planTitle.trim(),
      targetSireId: selectedSire?.id,
      targetDamId: selectedDam?.id,
    };

    const updatedPlans = [...plans, newPlan];
    setPlans(updatedPlans);
    localStorage.setItem('wp_breeding_plans', JSON.stringify(updatedPlans));
    setPlanTitle('');
  };

  // 検索フィルター
  const sires = horses.filter(
    (h) =>
      h.gender === '牡' &&
      (h.name.includes(sireSearch) || (h.kana && h.kana.includes(sireSearch)))
  );
  const dams = horses.filter(
    (h) =>
      h.gender === '牝' &&
      (h.name.includes(damSearch) || (h.kana && h.kana.includes(damSearch)))
  );

  const evaluatedTheories: EvaluatedTheory[] =
    selectedSire && selectedDam
      ? evaluateBreedingTheories(selectedSire, selectedDam, horseMap)
      : [];

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', padding: '16px', fontFamily: 'sans-serif' }}>
      {/* タブ切り替え */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        <button
          onClick={() => setActiveTab('simulator')}
          style={{
            flex: 1,
            padding: '10px',
            backgroundColor: activeTab === 'simulator' ? '#1a73e8' : '#eee',
            color: activeTab === 'simulator' ? '#fff' : '#333',
            border: 'none',
            borderRadius: '6px',
            fontWeight: 'bold',
          }}
        >
          配合シミュレーター
        </button>
        <button
          onClick={() => setActiveTab('plans')}
          style={{
            flex: 1,
            padding: '10px',
            backgroundColor: activeTab === 'plans' ? '#1a73e8' : '#eee',
            color: activeTab === 'plans' ? '#fff' : '#333',
            border: 'none',
            borderRadius: '6px',
            fontWeight: 'bold',
          }}
        >
          〆配合計画ノート
        </button>
      </div>

      {activeTab === 'simulator' ? (
        <div>
          {/* 種牡馬選択 */}
          <section style={{ marginBottom: '16px', padding: '12px', border: '1px solid #ccc', borderRadius: '8px' }}>
            <h3 style={{ marginTop: 0 }}>種牡馬（父）</h3>
            <input
              type="text"
              placeholder="馬名・かな検索..."
              value={sireSearch}
              onChange={(e) => setSireSearch(e.target.value)}
              style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
            />
            {sireSearch && (
              <div style={{ maxHeight: '100px', overflowY: 'auto', border: '1px solid #ddd', marginTop: '4px' }}>
                {sires.map((h) => (
                  <div
                    key={h.id}
                    onClick={() => { setSelectedSire(h); setSireSearch(''); }}
                    style={{ padding: '6px', cursor: 'pointer', borderBottom: '1px solid #eee' }}
                  >
                    {h.name} ({h.subSystem})
                  </div>
                ))}
              </div>
            )}
            {selectedSire && <p style={{ fontWeight: 'bold', color: '#1a0dab', margin: '8px 0 0' }}>選択: {selectedSire.name}</p>}
          </section>

          {/* 繁殖牝馬選択 */}
          <section style={{ marginBottom: '16px', padding: '12px', border: '1px solid #ccc', borderRadius: '8px' }}>
            <h3 style={{ marginTop: 0 }}>繁殖牝馬（母）</h3>
            <input
              type="text"
              placeholder="馬名・かな検索..."
              value={damSearch}
              onChange={(e) => setDamSearch(e.target.value)}
              style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
            />
            {damSearch && (
              <div style={{ maxHeight: '100px', overflowY: 'auto', border: '1px solid #ddd', marginTop: '4px' }}>
                {dams.map((h) => (
                  <div
                    key={h.id}
                    onClick={() => { setSelectedDam(h); setDamSearch(''); }}
                    style={{ padding: '6px', cursor: 'pointer', borderBottom: '1px solid #eee' }}
                  >
                    {h.name} ({h.subSystem})
                  </div>
                ))}
              </div>
            )}
            {selectedDam && <p style={{ fontWeight: 'bold', color: '#a01d0d', margin: '8px 0 0' }}>選択: {selectedDam.name}</p>}
          </section>

          {/* 結果表示 */}
          {selectedSire && selectedDam && (
            <section style={{ padding: '16px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
              <h3 style={{ marginTop: 0 }}>成立配合理論</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {evaluatedTheories.map((t, idx) => (
                  <div key={idx} style={{ padding: '8px', backgroundColor: '#fff', borderRadius: '4px', borderLeft: '4px solid #1a73e8' }}>
                    <strong>{t.name}</strong> （爆発力: {t.boost}）
                    <div style={{ fontSize: '12px', color: '#666' }}>{t.description}</div>
                  </div>
                ))}
              </div>

              {/* 架空馬登録 */}
              {!showAddForm ? (
                <button
                  onClick={() => setShowAddForm(true)}
                  style={{ width: '100%', marginTop: '16px', padding: '10px', backgroundColor: '#34a853', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold' }}
                >
                  ＋ この配合の自家生産馬を登録（永続保存）
                </button>
              ) : (
                <form onSubmit={handleAddFictionalHorse} style={{ marginTop: '16px', padding: '12px', backgroundColor: '#fff', borderRadius: '6px', border: '1px solid #ddd' }}>
                  <h4>自家生産馬データ登録</h4>
                  <input
                    type="text"
                    required
                    placeholder="馬名"
                    value={newHorseName}
                    onChange={(e) => setNewHorseName(e.target.value)}
                    style={{ width: '100%', padding: '6px', marginBottom: '8px' }}
                  />
                  <div style={{ marginBottom: '8px' }}>
                    <label>性別: </label>
                    <select value={newHorseGender} onChange={(e) => setNewHorseGender(e.target.value as '牡' | '牝')}>
                      <option value="牡">牡馬</option>
                      <option value="牝">牝馬</option>
                    </select>
                  </div>

                  {/* 因子設定機能 */}
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold' }}>獲得因子（複数選択可）:</label>
                    {(['sp', 'st', 'power', 'instant', 'guts', 'flexibility'] as FactorType[]).map((f) => (
                      <label key={f} style={{ marginRight: '12px', fontSize: '12px' }}>
                        <input
                          type="checkbox"
                          checked={selectedFactors.includes(f)}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedFactors([...selectedFactors, f]);
                            else setSelectedFactors(selectedFactors.filter((item) => item !== f));
                          }}
                        />
                        {f.toUpperCase()}
                      </label>
                    ))}
                  </div>

                  <button type="submit" style={{ padding: '8px 16px', backgroundColor: '#34a853', color: '#fff', border: 'none', borderRadius: '4px' }}>
                    保存して登録
                  </button>
                </form>
              )}
            </section>
          )}
        </div>
      ) : (
        /* 〆配合計画タブ */
        <div>
          <h3>〆配合（目標配合）作成</h3>
          <form onSubmit={handleAddPlan} style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
            <input
              type="text"
              required
              placeholder="〆配合タイトル（例: サンデー系全活性配合チャート）"
              value={planTitle}
              onChange={(e) => setPlanTitle(e.target.value)}
              style={{ flex: 1, padding: '8px' }}
            />
            <button type="submit" style={{ padding: '8px 16px', backgroundColor: '#1a73e8', color: '#fff', border: 'none', borderRadius: '4px' }}>
              計画作成
            </button>
          </form>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {plans.map((p) => (
              <div key={p.id} style={{ padding: '12px', border: '1px solid #ccc', borderRadius: '8px', backgroundColor: '#fdfdfd' }}>
                <h4 style={{ margin: '0 0 8px 0' }}>{p.title}</h4>
                <p style={{ fontSize: '12px', color: '#666', margin: 0 }}>
                  ターゲット種牡馬: {p.targetSireId ? horseMap.get(p.targetSireId)?.name : '未定'} / ターゲット繁殖牝馬: {p.targetDamId ? horseMap.get(p.targetDamId)?.name : '未定'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
