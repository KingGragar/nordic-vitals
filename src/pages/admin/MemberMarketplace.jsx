import { useState, useEffect, useCallback } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { getAdminMemberMarketplace, approveAdminMarketplaceListing, removeAdminMarketplaceListing } from '../../api/mlmApi'

const STATUS_COLOR = { active: '#86efac', pending: '#fbbf24', sold: '#94a3b8', removed: '#f87171' }
const STATUS_BG    = { active: '#14532d', pending: '#78350f', sold: '#1e293b', removed: '#7f1d1d' }
const CAT_ICON = { products: '🧬', kits: '📦', materials: '📄' }

export default function AdminMemberMarketplace() {
  const [listings, setListings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  const load = useCallback(() => {
    setLoading(true)
    getAdminMemberMarketplace().then(setListings).finally(() => setLoading(false))
  }, [])
  useEffect(() => { load() }, [load])

  async function approve(id) {
    await approveAdminMarketplaceListing(id)
    setListings(prev => prev.map(l => l.id === id ? { ...l, status: 'active' } : l))
  }

  async function remove(id) {
    await removeAdminMarketplaceListing(id)
    setListings(prev => prev.map(l => l.id === id ? { ...l, status: 'removed' } : l))
  }

  const all = listings || []
  const filtered = filter === 'all' ? all : all.filter(l => l.status === filter)
  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 18px' }

  const stats = [
    { label: 'Total Listings', value: all.length, color: 'var(--text)' },
    { label: 'Pending Review', value: all.filter(l => l.status === 'pending').length, color: '#fbbf24' },
    { label: 'Active', value: all.filter(l => l.status === 'active').length, color: '#86efac' },
    { label: 'Sold', value: all.filter(l => l.status === 'sold').length, color: '#94a3b8' },
  ]

  return (
    <AdminLayout>
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 4 }}>🛒 Member Marketplace</div>
            <div style={{ color: 'var(--text2)', fontSize: 14 }}>Moderate member-to-member listings — products, kits, and marketing materials.</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12, marginBottom: 22 }}>
          {stats.map(s => (
            <div key={s.label} style={card}>
              <div style={{ fontSize: 26, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
          {['all', 'pending', 'active', 'sold', 'removed'].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ padding: '6px 16px', borderRadius: 20, border: '1px solid var(--border)', background: filter === f ? 'var(--gold)' : 'transparent', color: filter === f ? '#000' : 'var(--text)', fontSize: 13, cursor: 'pointer', fontWeight: filter === f ? 700 : 400, textTransform: 'capitalize' }}>
              {f}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text2)' }}>Loading…</div>
        ) : !filtered.length ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text2)' }}>No listings found.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map(l => (
              <div key={l.id} style={{ ...card, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', opacity: l.status === 'removed' ? 0.5 : 1 }}>
                <span style={{ fontSize: 26 }}>{CAT_ICON[l.category] || '📦'}</span>
                <div style={{ flex: '1 1 200px' }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{l.title}</div>
                  <div style={{ color: 'var(--text2)', fontSize: 12, marginTop: 2 }}>Seller: {l.seller} · Posted: {l.postedAt} · Expires: {l.expiresAt}</div>
                </div>
                <div style={{ textAlign: 'right', minWidth: 90 }}>
                  <div style={{ fontWeight: 800, fontSize: 16 }}>{l.price > 0 ? `€${l.price}` : 'Free'}</div>
                  {l.originalPrice > 0 && l.price !== l.originalPrice && (
                    <div style={{ fontSize: 11, color: 'var(--text2)', textDecoration: 'line-through' }}>€{l.originalPrice}</div>
                  )}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text2)', minWidth: 60 }}>👁 {l.views} views</div>
                <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: STATUS_BG[l.status], color: STATUS_COLOR[l.status], textTransform: 'capitalize' }}>{l.status}</span>
                {l.status === 'pending' && (
                  <button onClick={() => approve(l.id)} style={{ padding: '5px 12px', borderRadius: 6, border: 'none', background: '#166534', color: '#86efac', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Approve</button>
                )}
                {(l.status === 'active' || l.status === 'pending') && (
                  <button onClick={() => remove(l.id)} style={{ padding: '5px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', color: '#f87171', fontSize: 12, cursor: 'pointer' }}>Remove</button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
