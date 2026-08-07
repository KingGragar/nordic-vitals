import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { getMemberDownloads, logDownload } from '../../api/mlmApi'

const CATEGORIES = [
  { value: 'all',        label: 'All' },
  { value: 'training',   label: 'Training' },
  { value: 'product',    label: 'Products' },
  { value: 'marketing',  label: 'Marketing' },
  { value: 'brand',      label: 'Brand Assets' },
  { value: 'compliance', label: 'Compliance' },
]

const FILE_ICONS = { pdf: '📄', mp4: '🎬', zip: '🗜️', png: '🖼️', jpg: '🖼️', webp: '🖼️', xlsx: '📊', csv: '📊', pptx: '📋', docx: '📝' }
const CAT_COLORS = { training: { bg: '#052e16', color: '#86efac', border: '#166534' }, product: { bg: '#1e1b4b', color: '#a5b4fc', border: '#3730a3' }, marketing: { bg: '#431407', color: '#fb923c', border: '#9a3412' }, brand: { bg: '#164e63', color: '#67e8f9', border: '#0e7490' }, compliance: { bg: '#1c1917', color: '#d6d3d1', border: '#57534e' } }

function fileIcon(type) { return FILE_ICONS[type] || '📎' }
function fmtMb(mb) { return mb >= 1 ? `${Number(mb).toFixed(1)} MB` : `${Math.round(mb * 1024)} KB` }
function fmtDate(iso) { return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) }
function isNewAsset(addedAt) { const days = (Date.now() - new Date(addedAt).getTime()) / 86400000; return days <= 14 }

function CatBadge({ cat }) {
  const s = CAT_COLORS[cat] || {}
  const label = CATEGORIES.find(c => c.value === cat)?.label || cat
  return <span style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}`, borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>{label}</span>
}

export default function DashDownloads() {
  const [data, setData] = useState({ available: [], history: [] })
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('available')
  const [catFilter, setCatFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [downloading, setDownloading] = useState(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try { const res = await getMemberDownloads(); setData(res) } catch {}
    setLoading(false)
  }

  async function handleDownload(asset) {
    setDownloading(asset.id)
    try { await logDownload(asset.id); await load() } catch {}
    setDownloading(null)
  }

  const filtered = (tab === 'available' ? data.available : []).filter(a => {
    if (catFilter !== 'all' && a.category !== catFilter) return false
    if (search) { const q = search.toLowerCase(); return a.title.toLowerCase().includes(q) || a.description.toLowerCase().includes(q) }
    return true
  })

  const inp = { background: 'var(--input)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text)', padding: '8px 10px', fontSize: 13 }
  const tabStyle = active => ({ padding: '8px 18px', borderRadius: 7, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13, background: active ? '#2563eb' : 'var(--card)', color: active ? '#fff' : 'var(--text2)', transition: 'background .15s' })

  return (
    <DashboardLayout>
      <div style={{ padding: '28px 20px', maxWidth: 1000 }}>
        {/* header */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>⬇️ My Downloads</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text2)' }}>Access training materials, brand assets, and resources available for your rank</p>
        </div>

        {/* stats row */}
        {!loading && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 24 }}>
            {[
              { label: 'Available', val: data.available.length, icon: '📁' },
              { label: 'Downloaded', val: data.history.length, icon: '✅' },
              { label: 'New This Month', val: data.available.filter(a => isNewAsset(a.addedAt)).length, icon: '✨' },
            ].map(s => (
              <div key={s.label} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px' }}>
                <div style={{ fontSize: 20, marginBottom: 4 }}>{s.icon}</div>
                <div style={{ fontSize: 22, fontWeight: 700 }}>{s.val}</div>
                <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          <button style={tabStyle(tab === 'available')} onClick={() => setTab('available')}>Available ({data.available.length})</button>
          <button style={tabStyle(tab === 'history')} onClick={() => setTab('history')}>Download History ({data.history.length})</button>
        </div>

        {/* filters (available tab only) */}
        {tab === 'available' && (
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…" style={{ ...inp, width: 180 }} />
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {CATEGORIES.map(c => (
                <button key={c.value} onClick={() => setCatFilter(c.value)} style={{ ...tabStyle(catFilter === c.value), padding: '6px 14px' }}>{c.label}</button>
              ))}
            </div>
          </div>
        )}

        {loading ? (
          <p style={{ color: 'var(--text2)', textAlign: 'center', padding: 40 }}>Loading…</p>
        ) : tab === 'available' ? (
          filtered.length === 0 ? (
            <p style={{ color: 'var(--text2)', textAlign: 'center', padding: 40 }}>No assets found.</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
              {filtered.map(a => (
                <div key={a.id} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px', position: 'relative' }}>
                  {isNewAsset(a.addedAt) && (
                    <span style={{ position: 'absolute', top: 12, right: 12, background: '#16a34a', color: '#fff', borderRadius: 4, padding: '2px 7px', fontSize: 10, fontWeight: 700 }}>NEW</span>
                  )}
                  {a.alreadyDownloaded && (
                    <span style={{ position: 'absolute', top: 12, right: isNewAsset(a.addedAt) ? 54 : 12, background: '#1d4ed8', color: '#fff', borderRadius: 4, padding: '2px 7px', fontSize: 10, fontWeight: 700 }}>✓ SAVED</span>
                  )}
                  <div style={{ fontSize: 28, marginBottom: 8 }}>{fileIcon(a.fileType)}</div>
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4, paddingRight: a.alreadyDownloaded || isNewAsset(a.addedAt) ? 60 : 0 }}>{a.title}</div>
                  <p style={{ margin: '0 0 10px', fontSize: 12, color: 'var(--text2)', lineHeight: 1.5 }}>{a.description}</p>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                    <CatBadge cat={a.category} />
                    <span style={{ background: 'var(--hover)', color: 'var(--text2)', borderRadius: 4, padding: '2px 8px', fontSize: 11 }}>.{a.fileType} · {fmtMb(a.fileSizeMb)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, color: 'var(--text2)' }}>Added {fmtDate(a.addedAt)}</span>
                    <button
                      onClick={() => handleDownload(a)}
                      disabled={downloading === a.id}
                      style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, padding: '7px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', opacity: downloading === a.id ? 0.7 : 1 }}
                    >
                      {downloading === a.id ? 'Preparing…' : a.alreadyDownloaded ? '⬇️ Download Again' : '⬇️ Download'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          /* history tab */
          data.history.length === 0 ? (
            <p style={{ color: 'var(--text2)', textAlign: 'center', padding: 40 }}>No download history yet.</p>
          ) : (
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Asset', 'Type', 'Category', 'Downloaded On'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11, fontWeight: 600, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.history.map((d, i) => d.asset && (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontSize: 20 }}>{fileIcon(d.asset.fileType)}</span>
                          <div>
                            <div style={{ fontWeight: 600 }}>{d.asset.title}</div>
                            <div style={{ fontSize: 11, color: 'var(--text2)' }}>{fmtMb(d.asset.fileSizeMb)}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '12px 14px', color: 'var(--text2)' }}>.{d.asset.fileType}</td>
                      <td style={{ padding: '12px 14px' }}><CatBadge cat={d.asset.category} /></td>
                      <td style={{ padding: '12px 14px', color: 'var(--text2)' }}>{fmtDate(d.downloadedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>
    </DashboardLayout>
  )
}
