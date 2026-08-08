import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { getMemberPromotions } from '../../api/mlmApi'

const TYPE_COLOR = { banner: '#93c5fd', social: '#c4b5fd', flyer: '#86efac', script: '#fbbf24', print: '#f9a8d4' }
const TYPE_ICON  = { banner: '🖼️', social: '📲', flyer: '📄', script: '📝', print: '🖨️' }

export default function DashMyPromotions() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    getMemberPromotions().then(setData).finally(() => setLoading(false))
  }, [])

  const types = ['all', 'banner', 'social', 'flyer', 'script', 'print']
  const materials = (data?.materials || [])
    .filter(m => typeFilter === 'all' || m.type === typeFilter)
    .filter(m => !search || m.name.toLowerCase().includes(search.toLowerCase()) || m.product.toLowerCase().includes(search.toLowerCase()))

  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 18px' }
  const inp  = { padding: '8px 12px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 14, boxSizing: 'border-box' }

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ marginBottom: 22 }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>My Promotions</h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: 14 }}>Download official banners, flyers, scripts, and social media assets</p>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12, marginBottom: 22 }}>
          {[
            { label: 'Total Assets', value: data?.materials?.length ?? 0 },
            { label: 'Banners', value: (data?.materials || []).filter(m => m.type === 'banner').length, color: '#93c5fd' },
            { label: 'Social Media', value: (data?.materials || []).filter(m => m.type === 'social').length, color: '#c4b5fd' },
            { label: 'Total Downloads', value: (data?.materials || []).reduce((s, m) => s + m.downloads, 0), color: '#fbbf24' },
          ].map(k => (
            <div key={k.label} style={card}>
              <div style={{ fontSize: 20, fontWeight: 700, color: k.color ?? 'var(--text)' }}>{loading ? '…' : k.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{k.label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
          {types.map(t => (
            <button key={t} onClick={() => setTypeFilter(t)} style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid var(--border)', background: typeFilter === t ? '#6366f1' : 'var(--card)', color: typeFilter === t ? '#fff' : 'var(--text)', cursor: 'pointer', fontSize: 13, textTransform: 'capitalize' }}>
              {t === 'all' ? 'All' : `${TYPE_ICON[t]} ${t}`}
            </button>
          ))}
          <input style={{ ...inp, marginLeft: 'auto', minWidth: 200 }} placeholder="Search assets…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {loading ? (
          <div style={{ ...card, textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>Loading…</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 16 }}>
            {materials.map(m => (
              <div key={m.id} style={card}>
                {/* Preview placeholder */}
                <div style={{ height: 120, borderRadius: 8, background: 'linear-gradient(135deg, rgba(99,102,241,.2), rgba(168,85,247,.2))', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14, fontSize: 40 }}>
                  {TYPE_ICON[m.type] ?? '📁'}
                </div>
                <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 11, background: 'rgba(0,0,0,.2)', color: TYPE_COLOR[m.type], borderRadius: 4, padding: '2px 7px', textTransform: 'capitalize' }}>{m.type}</span>
                  <span style={{ fontSize: 11, background: 'rgba(0,0,0,.15)', color: 'var(--text-muted)', borderRadius: 4, padding: '2px 7px' }}>{m.format}</span>
                  <span style={{ fontSize: 11, background: 'rgba(0,0,0,.15)', color: 'var(--text-muted)', borderRadius: 4, padding: '2px 7px' }}>{m.language}</span>
                </div>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{m.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>{m.product} · {m.size}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>⬇️ {m.downloads} downloads</span>
                  <button style={{ padding: '6px 14px', borderRadius: 7, border: 'none', background: '#6366f1', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>
                    Download
                  </button>
                </div>
              </div>
            ))}
            {materials.length === 0 && (
              <div style={{ ...card, textAlign: 'center', color: 'var(--text-muted)', padding: 32, gridColumn: '1/-1' }}>No assets match your filter.</div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
