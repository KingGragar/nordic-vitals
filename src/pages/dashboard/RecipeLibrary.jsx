import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { getMemberRecipeLibrary } from '../../api/mlmApi'

const CAT_COLORS = { smoothies: '#86efac', meals: '#fbbf24', snacks: '#f9a8d4', supplements: '#a5b4fc', shakes: '#67e8f9' }

export default function DashRecipeLibrary() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [catFilter, setCatFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    getMemberRecipeLibrary().then(setData).finally(() => setLoading(false))
  }, [])

  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 18px' }

  if (loading) return <DashboardLayout><div style={{ textAlign: 'center', padding: 80, color: 'var(--text2)' }}>Loading…</div></DashboardLayout>
  if (!data) return null

  const cats = ['all', ...Object.keys(CAT_COLORS)]
  const filtered = data.recipes.filter(r =>
    (catFilter === 'all' || r.category === catFilter) &&
    (r.name.toLowerCase().includes(search.toLowerCase()) || r.tags.some(t => t.includes(search.toLowerCase())))
  )

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 4 }}>🥗 Recipe Library</div>
          <div style={{ color: 'var(--text2)', fontSize: 14 }}>Peptide-optimized smoothies, meals, snacks, and supplement stacks — curated for Nordic Vitals members.</div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search recipes or tags…"
            style={{ flex: 1, minWidth: 180, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 13 }}
          />
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {cats.map(c => (
              <button key={c} onClick={() => setCatFilter(c)} style={{
                padding: '6px 14px', borderRadius: 20, border: `1px solid ${catFilter === c ? (CAT_COLORS[c] || 'var(--gold)') : 'var(--border)'}`,
                background: catFilter === c ? (CAT_COLORS[c] || 'var(--gold)') + '22' : 'transparent',
                color: catFilter === c ? (CAT_COLORS[c] || 'var(--gold)') : 'var(--text2)',
                fontWeight: 600, fontSize: 12, cursor: 'pointer', textTransform: 'capitalize',
              }}>{c}</button>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 360px' : 'repeat(auto-fill,minmax(260px,1fr))', gap: 16, alignItems: 'start' }}>
          <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr' : 'repeat(auto-fill,minmax(260px,1fr))', gap: 12 }}>
            {filtered.map(r => (
              <div
                key={r.id}
                onClick={() => setSelected(s => s?.id === r.id ? null : r)}
                style={{ ...card, cursor: 'pointer', outline: selected?.id === r.id ? '2px solid var(--gold)' : 'none', padding: '14px 16px' }}
              >
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 10 }}>
                  <span style={{ fontSize: 32 }}>{r.emoji}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{r.name}</div>
                    <span style={{
                      padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 700, textTransform: 'capitalize',
                      background: (CAT_COLORS[r.category] || '#888') + '22', color: CAT_COLORS[r.category] || '#888',
                    }}>{r.category}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 14, fontSize: 12, color: 'var(--text2)', marginBottom: 8 }}>
                  <span>⏱ {r.prepMinutes} min</span>
                  <span>🔥 {r.calories} kcal</span>
                  <span>⭐ {r.rating}</span>
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {r.tags.slice(0, 3).map(t => (
                    <span key={t} style={{ padding: '2px 8px', borderRadius: 10, fontSize: 10, background: 'var(--border)', color: 'var(--text2)' }}>{t}</span>
                  ))}
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 40, color: 'var(--text2)', fontSize: 14 }}>No recipes match your search.</div>
            )}
          </div>

          {selected && (
            <div style={{ ...card, position: 'sticky', top: 80 }}>
              <div style={{ textAlign: 'center', fontSize: 56, marginBottom: 12 }}>{selected.emoji}</div>
              <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 6 }}>{selected.name}</div>
              <div style={{ display: 'flex', gap: 14, fontSize: 12, color: 'var(--text2)', marginBottom: 14, justifyContent: 'center' }}>
                <span>⏱ {selected.prepMinutes} min prep</span>
                <span>🔥 {selected.calories} kcal</span>
                <span>⭐ {selected.rating}/5</span>
              </div>

              <div style={{ marginBottom: 14 }}>
                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Macros</div>
                {[
                  { label: 'Protein', value: `${selected.macros.protein}g`, color: '#86efac' },
                  { label: 'Carbs',   value: `${selected.macros.carbs}g`,   color: '#fbbf24' },
                  { label: 'Fat',     value: `${selected.macros.fat}g`,      color: '#f9a8d4' },
                ].map(m => (
                  <div key={m.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                    <span style={{ color: 'var(--text2)' }}>{m.label}</span>
                    <span style={{ fontWeight: 700, color: m.color }}>{m.value}</span>
                  </div>
                ))}
              </div>

              <div style={{ marginBottom: 14 }}>
                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Ingredients</div>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: 'var(--text2)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {selected.ingredients.map(ing => <li key={ing}>{ing}</li>)}
                </ul>
              </div>

              <div style={{ marginBottom: 14 }}>
                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Instructions</div>
                <ol style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: 'var(--text2)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {selected.steps.map((step, i) => <li key={i}>{step}</li>)}
                </ol>
              </div>

              {selected.productLinks && selected.productLinks.length > 0 && (
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Featured Products</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {selected.productLinks.map(p => (
                      <div key={p} style={{ padding: '8px 12px', borderRadius: 8, background: 'var(--border)', fontSize: 12, fontWeight: 600, color: 'var(--gold)' }}>{p}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
