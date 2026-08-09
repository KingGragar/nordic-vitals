import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { getMemberBusinessResources } from '../../api/mlmApi'

const CATEGORIES = ['all', 'templates', 'scripts', 'guides', 'tools', 'legal']
const CAT_ICONS = { templates: '📄', scripts: '🎙️', guides: '📚', tools: '🛠️', legal: '⚖️' }
const CAT_COLORS = { templates: '#a5b4fc', scripts: '#f9a8d4', guides: '#fbbf24', tools: '#86efac', legal: '#c4b5fd' }
const FORMATS = ['PDF', 'DOCX', 'XLSX', 'PPT', 'MP4', 'LINK']

export default function DashBusinessResources() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState('all')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)

  useEffect(() => { getMemberBusinessResources().then(setData).finally(() => setLoading(false)) }, [])

  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 18px' }

  if (loading) return <DashboardLayout><div style={{ textAlign: 'center', padding: 80, color: 'var(--text2)' }}>Loading…</div></DashboardLayout>
  if (!data) return null

  const filtered = data.resources.filter(r =>
    (category === 'all' || r.category === category) &&
    (r.title.toLowerCase().includes(search.toLowerCase()) || r.description.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 4 }}>💼 Business Resources</div>
        <div style={{ color: 'var(--text2)', fontSize: 14, marginBottom: 24 }}>Templates, scripts, guides, and tools to grow your business.</div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Resources',  value: data.stats.total,     color: '#a5b4fc' },
            { label: 'Downloaded', value: data.stats.downloaded, color: '#86efac' },
            { label: 'New This Month', value: data.stats.newThisMonth, color: '#fbbf24' },
            { label: 'Favourites', value: data.stats.favourites, color: '#f9a8d4' },
          ].map(s => (
            <div key={s.label} style={card}>
              <div style={{ fontSize: 18, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
          <input
            value={search} onChange={e => setSearch(e.target.value)} placeholder="Search resources…"
            style={{ flex: 1, minWidth: 200, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 13 }}
          />
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {CATEGORIES.map(c => (
              <button key={c} onClick={() => setCategory(c)} style={{
                padding: '6px 14px', borderRadius: 20, border: `1px solid ${category === c ? (CAT_COLORS[c] || 'var(--gold)') : 'var(--border)'}`,
                background: category === c ? (CAT_COLORS[c] || 'var(--gold)') + '22' : 'transparent',
                color: category === c ? (CAT_COLORS[c] || 'var(--text)') : 'var(--text2)',
                fontWeight: 600, fontSize: 12, cursor: 'pointer', textTransform: 'capitalize',
              }}>
                {c !== 'all' && CAT_ICONS[c]} {c}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 340px' : 'repeat(auto-fill,minmax(280px,1fr))', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 12 }}>
            {filtered.map(r => (
              <div
                key={r.id}
                onClick={() => setSelected(s => s?.id === r.id ? null : r)}
                style={{
                  ...card, cursor: 'pointer', padding: '14px 16px',
                  outline: selected?.id === r.id ? `2px solid ${CAT_COLORS[r.category] || 'var(--gold)'}` : 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: 10, flexShrink: 0,
                    background: (CAT_COLORS[r.category] || '#888') + '22',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
                  }}>{CAT_ICONS[r.category] || '📁'}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 8, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{r.description}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{
                        padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700,
                        background: (CAT_COLORS[r.category] || '#888') + '22', color: CAT_COLORS[r.category] || '#888',
                      }}>{r.format}</span>
                      <span style={{ fontSize: 11, color: 'var(--text2)' }}>{r.downloads} downloads</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 40, color: 'var(--text2)', fontSize: 14 }}>No resources found.</div>
            )}
          </div>

          {selected && (
            <div style={{ ...card, position: 'sticky', top: 80 }}>
              <div style={{
                width: 56, height: 56, borderRadius: 12, background: (CAT_COLORS[selected.category] || '#888') + '22',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, marginBottom: 14,
              }}>{CAT_ICONS[selected.category] || '📁'}</div>
              <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 8 }}>{selected.title}</div>
              <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 16 }}>{selected.description}</div>
              {[
                { label: 'Category',    value: selected.category },
                { label: 'Format',      value: selected.format },
                { label: 'Size',        value: selected.size },
                { label: 'Added',       value: selected.addedAt },
                { label: 'Downloads',   value: selected.downloads.toLocaleString() },
                { label: 'Last Updated', value: selected.updatedAt },
              ].map(r => (
                <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                  <span style={{ color: 'var(--text2)' }}>{r.label}</span>
                  <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{r.value}</span>
                </div>
              ))}
              <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                <button style={{ flex: 1, padding: '10px 0', borderRadius: 8, border: 'none', background: 'var(--gold)', color: '#000', fontWeight: 800, cursor: 'pointer', fontSize: 13 }}>
                  ⬇ Download
                </button>
                <button style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)', cursor: 'pointer', fontSize: 13 }}>
                  ♡
                </button>
              </div>
              {selected.tags && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 12 }}>
                  {selected.tags.map(t => (
                    <span key={t} style={{ padding: '2px 10px', borderRadius: 10, background: 'var(--border)', fontSize: 11, color: 'var(--text2)' }}>{t}</span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 20 }}>
          <div style={card}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>Recently Added</div>
            {data.recentlyAdded.map(r => (
              <div key={r.id} onClick={() => setSelected(r)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}>
                <span style={{ fontSize: 18 }}>{CAT_ICONS[r.category] || '📁'}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{r.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--text2)' }}>{r.addedAt}</div>
                </div>
                <span style={{
                  padding: '2px 7px', borderRadius: 6, fontSize: 10, fontWeight: 700,
                  background: (CAT_COLORS[r.category] || '#888') + '22', color: CAT_COLORS[r.category] || '#888',
                }}>{r.format}</span>
              </div>
            ))}
          </div>
          <div style={card}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>Most Downloaded</div>
            {data.topDownloaded.map((r, i) => (
              <div key={r.id} onClick={() => setSelected(r)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}>
                <span style={{ fontWeight: 800, color: i === 0 ? '#fbbf24' : 'var(--text2)', width: 20, fontSize: 13 }}>#{i + 1}</span>
                <span style={{ fontSize: 18 }}>{CAT_ICONS[r.category] || '📁'}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{r.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--text2)' }}>{r.downloads} downloads</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
