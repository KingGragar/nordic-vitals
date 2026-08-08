import { useState, useEffect, useCallback } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { getAdminWaitlists, getAdminWaitlistEntries, notifyAdminWaitlist, removeAdminWaitlistEntry } from '../../api/mlmApi'

const STATUS_STYLE = {
  out_of_stock: { bg: '#2d0f0f', color: '#f87171', border: '#7f1d1d', label: 'Out of Stock' },
  notified:     { bg: '#052e16', color: '#86efac', border: '#166534', label: 'Notified' },
  back_in_stock:{ bg: '#1e3a5f', color: '#93c5fd', border: '#1d4ed8', label: 'Back In Stock' },
}

function EntriesModal({ product, onClose }) {
  const [entries, setEntries] = useState(null)
  const [notifying, setNotifying] = useState(false)
  const [notifyDone, setNotifyDone] = useState(false)

  useEffect(() => {
    getAdminWaitlistEntries(product.productId).then(setEntries)
  }, [product.productId])

  async function handleNotify() {
    if (!window.confirm(`Send restock notification to all ${product.entries} subscribers?`)) return
    setNotifying(true)
    await notifyAdminWaitlist(product.productId)
    setNotifying(false)
    setNotifyDone(true)
  }

  async function handleRemove(entryId) {
    await removeAdminWaitlistEntry(product.productId, entryId)
    setEntries(prev => prev.filter(e => e.id !== entryId))
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={onClose}>
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 28, maxWidth: 560, width: '100%', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <div style={{ fontWeight: 700, fontSize: 16 }}>Waitlist — {product.productName}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text2)', fontSize: 20, cursor: 'pointer' }}>✕</button>
        </div>
        <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 18 }}>{product.entries} subscriber{product.entries !== 1 ? 's' : ''} · SKU: {product.sku}</div>

        {notifyDone ? (
          <div style={{ background: '#052e16', border: '1px solid #166534', borderRadius: 8, padding: '12px 16px', color: '#86efac', fontSize: 14, marginBottom: 16 }}>
            ✅ Restock notification sent to all subscribers.
          </div>
        ) : (
          <button onClick={handleNotify} disabled={notifying} style={{ marginBottom: 16, padding: '10px 18px', background: '#b45309', border: 'none', borderRadius: 8, color: '#fff', fontWeight: 700, fontSize: 14, cursor: notifying ? 'not-allowed' : 'pointer', opacity: notifying ? 0.7 : 1 }}>
            {notifying ? 'Sending…' : `📧 Notify All ${product.entries} Subscribers`}
          </button>
        )}

        <div style={{ overflowY: 'auto', flex: 1 }}>
          {!entries ? (
            <div style={{ textAlign: 'center', padding: 32, color: 'var(--text2)' }}>Loading…</div>
          ) : entries.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 32, color: 'var(--text2)' }}>No entries.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ color: 'var(--text2)', borderBottom: '1px solid var(--border)' }}>
                  <th style={{ textAlign: 'left', padding: '6px 8px', fontWeight: 600 }}>Name</th>
                  <th style={{ textAlign: 'left', padding: '6px 8px', fontWeight: 600 }}>Email</th>
                  <th style={{ textAlign: 'left', padding: '6px 8px', fontWeight: 600 }}>Joined</th>
                  <th style={{ padding: '6px 8px' }} />
                </tr>
              </thead>
              <tbody>
                {entries.map(e => (
                  <tr key={e.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '8px 8px' }}>{e.name}</td>
                    <td style={{ padding: '8px 8px', color: 'var(--text2)' }}>{e.email}</td>
                    <td style={{ padding: '8px 8px', color: 'var(--text2)' }}>{new Date(e.joinedAt).toLocaleDateString()}</td>
                    <td style={{ padding: '8px 8px', textAlign: 'right' }}>
                      <button onClick={() => handleRemove(e.id)} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 6, color: '#f87171', fontSize: 12, padding: '3px 8px', cursor: 'pointer' }}>Remove</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

export default function AdminWaitlists() {
  const [waitlists, setWaitlists] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [filter, setFilter] = useState('all')

  const load = useCallback(() => {
    setLoading(true)
    getAdminWaitlists().then(setWaitlists).finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = !waitlists ? [] : filter === 'all' ? waitlists : waitlists.filter(w => w.status === filter)
  const totalSubscribers = (waitlists || []).reduce((s, w) => s + w.entries, 0)

  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 18px' }

  return (
    <AdminLayout>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 4 }}>📋 Product Waitlists</div>
          <div style={{ color: 'var(--text2)', fontSize: 14 }}>Manage out-of-stock waitlists and notify subscribers on restock.</div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 22 }}>
          {[
            { label: 'Active Lists', value: (waitlists || []).filter(w => w.status === 'out_of_stock').length },
            { label: 'Total Subscribers', value: totalSubscribers },
            { label: 'Already Notified', value: (waitlists || []).filter(w => w.status === 'notified').length },
          ].map(s => (
            <div key={s.label} style={card}>
              <div style={{ fontSize: 22, fontWeight: 800 }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filter */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
          {['all', 'out_of_stock', 'notified'].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ padding: '6px 14px', borderRadius: 20, border: '1px solid var(--border)', background: filter === f ? 'var(--gold)' : 'var(--card)', color: filter === f ? '#000' : 'var(--text)', fontSize: 13, cursor: 'pointer', fontWeight: filter === f ? 700 : 400 }}>
              {f === 'all' ? 'All' : STATUS_STYLE[f]?.label || f}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text2)' }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text2)' }}>No waitlists found.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map(w => {
              const st = STATUS_STYLE[w.status] || STATUS_STYLE.out_of_stock
              return (
                <div key={w.productId} style={{ ...card, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{w.productName}</div>
                    <div style={{ fontSize: 12, color: 'var(--text2)' }}>SKU: {w.sku} · Oldest entry: {new Date(w.oldestEntry).toLocaleDateString()}
                      {w.restockEta && <> · ETA: {new Date(w.restockEta).toLocaleDateString()}</>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontWeight: 800, fontSize: 20 }}>{w.entries}</div>
                      <div style={{ fontSize: 11, color: 'var(--text2)' }}>waiting</div>
                    </div>
                    <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: st.bg, color: st.color, border: `1px solid ${st.border}`, whiteSpace: 'nowrap' }}>{st.label}</span>
                    <button onClick={() => setSelected(w)} style={{ padding: '7px 14px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontSize: 13, cursor: 'pointer' }}>
                      View List
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {selected && <EntriesModal product={selected} onClose={() => setSelected(null)} />}
    </AdminLayout>
  )
}
