import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { getMemberDigitalProducts, downloadMemberDigitalProduct } from '../../api/mlmApi'

const TYPE_ICON = { ebook: '📖', course: '🎓', bundle: '📦', template: '📄', software: '💿' }
const TYPE_COLOR = { ebook: { bg: '#1e3a5f', color: '#93c5fd' }, course: { bg: '#3b1f6e', color: '#c4b5fd' }, bundle: { bg: '#052e16', color: '#86efac' }, template: { bg: '#422006', color: '#fcd34d' }, software: { bg: '#1c1c1c', color: '#9ca3af' } }

function DownloadModal({ product, onClose }) {
  const [state, setState] = useState('idle')
  const [url, setUrl] = useState(null)

  async function handleDownload() {
    setState('loading')
    try {
      const res = await downloadMemberDigitalProduct(product.id)
      setUrl(res.url)
      setState('ready')
    } catch {
      setState('error')
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={onClose}>
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 28, maxWidth: 440, width: '100%' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 16 }}>Download</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text2)', fontSize: 20, cursor: 'pointer' }}>✕</button>
        </div>
        <div style={{ textAlign: 'center', padding: '16px 0' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>{TYPE_ICON[product.type] || '📄'}</div>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>{product.title}</div>
          <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 24 }}>{product.format} · {product.fileSize}</div>
          {state === 'idle' && (
            <button onClick={handleDownload} style={{ padding: '12px 32px', borderRadius: 8, border: 'none', background: '#22c55e', color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>
              Generate Download Link
            </button>
          )}
          {state === 'loading' && <div style={{ color: 'var(--text2)' }}>Generating secure link…</div>}
          {state === 'ready' && (
            <div>
              <div style={{ fontSize: 13, color: '#22c55e', marginBottom: 12 }}>✅ Your link is ready (valid 10 minutes)</div>
              <a href={url} download style={{ display: 'inline-block', padding: '12px 32px', borderRadius: 8, background: '#1d4ed8', color: '#fff', fontWeight: 700, fontSize: 15, textDecoration: 'none' }}>
                ⬇️ Download Now
              </a>
            </div>
          )}
          {state === 'error' && <div style={{ color: '#ef4444', fontSize: 14 }}>Failed to generate link. Try again.</div>}
        </div>
      </div>
    </div>
  )
}

export default function MemberDigitalProducts() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [tab, setTab] = useState('all')

  useEffect(() => {
    getMemberDigitalProducts().then(setProducts).finally(() => setLoading(false))
  }, [])

  const filtered = tab === 'all' ? products : products.filter(p => p.type === tab)
  const types = [...new Set(products.map(p => p.type))]
  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 18px' }

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontWeight: 700, fontSize: 22, margin: 0 }}>💿 My Digital Products</h1>
          <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 4 }}>Your purchased and unlocked digital content</div>
        </div>

        {products.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 24 }}>
            {[['📦', 'Total Items', products.length], ['⬇️', 'Downloaded', products.filter(p => p.downloadedAt).length], ['🆓', 'Free Items', products.filter(p => p.price === 0).length]].map(([icon, label, val]) => (
              <div key={label} style={card}>
                <div style={{ fontSize: 20 }}>{icon}</div>
                <div style={{ fontWeight: 700, fontSize: 22, marginTop: 4 }}>{val}</div>
                <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
          {['all', ...types].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: '6px 14px', borderRadius: 20, border: '1px solid var(--border)', background: tab === t ? 'var(--primary, #22c55e)' : 'var(--bg)', color: tab === t ? '#fff' : 'var(--text)', fontWeight: tab === t ? 700 : 400, fontSize: 13, cursor: 'pointer', textTransform: 'capitalize' }}>
              {t === 'all' ? 'All' : `${TYPE_ICON[t] || '📄'} ${t}`}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text2)' }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{ ...card, textAlign: 'center', padding: 60 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>No digital products yet</div>
            <div style={{ fontSize: 13, color: 'var(--text2)' }}>Digital products you purchase or unlock will appear here.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filtered.map(p => {
              const tc = TYPE_COLOR[p.type] || TYPE_COLOR.template
              return (
                <div key={p.id} style={{ ...card, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                  <div style={{ width: 52, height: 52, borderRadius: 10, background: tc.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0 }}>
                    {TYPE_ICON[p.type] || '📄'}
                  </div>
                  <div style={{ flex: 1, minWidth: 180 }}>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{p.title}</div>
                    <div style={{ fontSize: 12, color: tc.color, marginTop: 2, textTransform: 'uppercase', fontWeight: 600 }}>{p.type}</div>
                    <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 4 }}>
                      {p.format} · {p.fileSize}
                      {p.downloadedAt && <span style={{ color: '#22c55e', marginLeft: 10 }}>✅ Downloaded {new Date(p.downloadedAt).toLocaleDateString()}</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                    <div style={{ fontWeight: 700, color: p.price === 0 ? '#22c55e' : 'var(--text)' }}>
                      {p.price === 0 ? 'Free' : `NOK ${p.price}`}
                    </div>
                    <button onClick={() => setSelected(p)} style={{ padding: '8px 18px', borderRadius: 7, border: 'none', background: '#1d4ed8', color: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                      ⬇️ Download
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
      {selected && <DownloadModal product={selected} onClose={() => setSelected(null)} />}
    </DashboardLayout>
  )
}
