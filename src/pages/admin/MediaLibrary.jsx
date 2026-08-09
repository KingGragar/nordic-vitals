import { useState, useEffect } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { getAdminMediaLibrary, deleteAdminMediaAsset } from '../../api/mlmApi'

const TYPE_COLORS = { image: '#a5b4fc', video: '#f9a8d4', document: '#fbbf24', audio: '#86efac' }
const TYPES = ['all', 'image', 'video', 'document', 'audio']

export default function AdminMediaLibrary() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [deleting, setDeleting] = useState(null)
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    getAdminMediaLibrary().then(setData).finally(() => setLoading(false))
  }, [])

  async function handleDelete(id) {
    setDeleting(id)
    await deleteAdminMediaAsset(id)
    setData(prev => ({ ...prev, assets: prev.assets.filter(a => a.id !== id) }))
    if (selected?.id === id) setSelected(null)
    setDeleting(null)
  }

  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 18px' }

  if (loading) return <AdminLayout><div style={{ textAlign: 'center', padding: 80, color: 'var(--text2)' }}>Loading…</div></AdminLayout>
  if (!data) return null

  const filtered = data.assets.filter(a =>
    (typeFilter === 'all' || a.type === typeFilter) &&
    (a.name.toLowerCase().includes(search.toLowerCase()) || a.tags.some(t => t.includes(search.toLowerCase())))
  )

  return (
    <AdminLayout>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 4 }}>🗂️ Media Library</div>
            <div style={{ color: 'var(--text2)', fontSize: 14 }}>Centralized asset storage for images, videos, documents, and audio files.</div>
          </div>
          <button style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: 'var(--gold)', color: '#000', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>
            + Upload Asset
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Total Assets',   value: data.stats.totalAssets,              color: '#a5b4fc' },
            { label: 'Storage Used',   value: data.stats.storageUsed,              color: '#fbbf24' },
            { label: 'Images',         value: data.stats.byType.image,             color: '#86efac' },
            { label: 'Videos',         value: data.stats.byType.video,             color: '#f9a8d4' },
            { label: 'Documents',      value: data.stats.byType.document,          color: '#c4b5fd' },
          ].map(s => (
            <div key={s.label} style={card}>
              <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search assets or tags…"
            style={{ flex: 1, minWidth: 200, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 13 }}
          />
          <div style={{ display: 'flex', gap: 6 }}>
            {TYPES.map(t => (
              <button key={t} onClick={() => setTypeFilter(t)} style={{
                padding: '6px 14px', borderRadius: 20, border: `1px solid ${typeFilter === t ? (TYPE_COLORS[t] || 'var(--gold)') : 'var(--border)'}`,
                background: typeFilter === t ? (TYPE_COLORS[t] || 'var(--gold)') + '22' : 'transparent',
                color: typeFilter === t ? (TYPE_COLORS[t] || 'var(--gold)') : 'var(--text2)',
                fontWeight: 600, fontSize: 12, cursor: 'pointer', textTransform: 'capitalize',
              }}>{t}</button>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 320px' : '1fr', gap: 20, alignItems: 'start' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 12 }}>
            {filtered.map(a => (
              <div
                key={a.id}
                onClick={() => setSelected(s => s?.id === a.id ? null : a)}
                style={{
                  ...card, cursor: 'pointer', padding: 0, overflow: 'hidden',
                  outline: selected?.id === a.id ? '2px solid var(--gold)' : 'none',
                }}
              >
                <div style={{ height: 110, background: 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 36 }}>
                    {a.type === 'image' ? '🖼️' : a.type === 'video' ? '🎬' : a.type === 'document' ? '📄' : '🎵'}
                  </span>
                </div>
                <div style={{ padding: '10px 12px' }}>
                  <div style={{ fontWeight: 600, fontSize: 12, marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.name}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{
                      padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 700,
                      background: (TYPE_COLORS[a.type] || '#888') + '22', color: TYPE_COLORS[a.type] || '#888',
                      textTransform: 'uppercase',
                    }}>{a.type}</span>
                    <span style={{ fontSize: 11, color: 'var(--text2)' }}>{a.size}</span>
                  </div>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 40, color: 'var(--text2)', fontSize: 14 }}>No assets match your filter.</div>
            )}
          </div>

          {selected && (
            <div style={{ ...card, position: 'sticky', top: 80 }}>
              <div style={{ height: 140, background: 'var(--border)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14, fontSize: 48 }}>
                {selected.type === 'image' ? '🖼️' : selected.type === 'video' ? '🎬' : selected.type === 'document' ? '📄' : '🎵'}
              </div>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>{selected.name}</div>
              {[
                { label: 'Type',      value: selected.type },
                { label: 'Size',      value: selected.size },
                { label: 'Uploaded',  value: selected.uploadedAt },
                { label: 'Uploader',  value: selected.uploadedBy },
                { label: 'Folder',    value: selected.folder },
                { label: 'Used In',   value: `${selected.usedIn} places` },
              ].map(r => (
                <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                  <span style={{ color: 'var(--text2)' }}>{r.label}</span>
                  <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{r.value}</span>
                </div>
              ))}
              <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                {selected.tags.map(t => (
                  <span key={t} style={{ padding: '3px 10px', borderRadius: 10, background: 'var(--border)', fontSize: 11, color: 'var(--text2)' }}>{t}</span>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                <button style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: 'none', background: 'var(--gold)', color: '#000', fontWeight: 700, cursor: 'pointer', fontSize: 12 }}>
                  Copy URL
                </button>
                <button
                  onClick={() => handleDelete(selected.id)}
                  disabled={deleting === selected.id}
                  style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: '1px solid #ef4444', background: 'transparent', color: '#ef4444', fontWeight: 700, cursor: 'pointer', fontSize: 12 }}
                >
                  {deleting === selected.id ? '…' : 'Delete'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
