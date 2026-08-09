import { useState, useEffect } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { getAdminRewardCatalog } from '../../api/mlmApi'

const CAT_COLOR = { physical: '#86efac', digital: '#93c5fd', experience: '#fbbf24', travel: '#c4b5fd' }

export default function AdminRewardCatalog() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [catFilter, setCatFilter] = useState('all')

  useEffect(() => {
    setLoading(true)
    getAdminRewardCatalog().then(setData).finally(() => setLoading(false))
  }, [])

  const items = (data?.items || []).filter(i => catFilter === 'all' || i.category === catFilter)
  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 18px' }

  return (
    <AdminLayout>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 22 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>Reward Catalog</h1>
            <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: 14 }}>Manage redeemable rewards — physical, digital, experiences, and travel perks</p>
          </div>
          <button onClick={() => setShowModal(true)} style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: '#6366f1', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>+ Add Reward</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 14, marginBottom: 22 }}>
          {[
            { label: 'Total Items', value: data?.items?.length || 0, color: '#93c5fd' },
            { label: 'Active Items', value: (data?.items || []).filter(i => i.active).length, color: '#86efac' },
            { label: 'Redemptions (30d)', value: data?.redemptions30d || 0, color: '#fbbf24' },
            { label: 'Points Redeemed (30d)', value: (data?.pointsRedeemed30d || 0).toLocaleString(), color: '#c4b5fd' },
          ].map(k => (
            <div key={k.label} style={card}>
              <div style={{ fontSize: 22, fontWeight: 700, color: k.color }}>{loading ? '…' : k.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{k.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          {['all', 'physical', 'digital', 'experience', 'travel'].map(c => (
            <button key={c} onClick={() => setCatFilter(c)} style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid var(--border)', background: catFilter === c ? (CAT_COLOR[c] || '#6366f1') : 'var(--card)', color: catFilter === c ? '#000' : 'var(--text)', cursor: 'pointer', fontSize: 13, textTransform: 'capitalize' }}>{c === 'all' ? 'All Categories' : c}</button>
          ))}
        </div>

        {loading ? <div style={{ ...card, textAlign: 'center', color: 'var(--text-muted)' }}>Loading…</div> : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 16 }}>
            {items.map(item => (
              <div key={item.id} style={{ ...card, position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: CAT_COLOR[item.category] || '#818cf8', background: `${CAT_COLOR[item.category] || '#818cf8'}22`, borderRadius: 5, padding: '2px 8px', textTransform: 'capitalize' }}>{item.category}</span>
                  <span style={{ fontSize: 11, color: item.active ? '#86efac' : '#f87171', fontWeight: 600 }}>{item.active ? 'Active' : 'Inactive'}</span>
                </div>
                <div style={{ fontSize: 30, marginBottom: 8 }}>{item.emoji || '🎁'}</div>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{item.name}</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>{item.description}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <span style={{ fontWeight: 700, fontSize: 18, color: '#fbbf24' }}>{item.pointsCost.toLocaleString()}</span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 4 }}>pts</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {item.stock !== null ? `Stock: ${item.stock}` : 'Unlimited'} · Redeemed: {item.redeemCount}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                  <button style={{ flex: 1, padding: '6px 0', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)', cursor: 'pointer', fontSize: 12 }}>Edit</button>
                  <button style={{ flex: 1, padding: '6px 0', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', color: item.active ? '#f87171' : '#86efac', cursor: 'pointer', fontSize: 12 }}>{item.active ? 'Deactivate' : 'Activate'}</button>
                </div>
              </div>
            ))}
            {items.length === 0 && <div style={{ ...card, textAlign: 'center', color: 'var(--text-muted)', padding: 40, gridColumn: '1/-1' }}>No reward items in this category.</div>}
          </div>
        )}

        {showModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowModal(false)}>
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: 28, maxWidth: 460, width: '90%' }} onClick={e => e.stopPropagation()}>
              <h3 style={{ margin: '0 0 18px' }}>Add Reward Item</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
                {[
                  { label: 'Name', placeholder: 'Reward name' },
                  { label: 'Description', placeholder: 'Short description shown to members' },
                  { label: 'Points Cost', placeholder: '0', type: 'number' },
                  { label: 'Stock Quantity (blank = unlimited)', placeholder: 'Leave empty for unlimited', type: 'number' },
                ].map(f => (
                  <div key={f.label}>
                    <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>{f.label}</label>
                    <input type={f.type || 'text'} placeholder={f.placeholder} style={{ width: '100%', padding: '8px 12px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--input,var(--card))', color: 'var(--text)', fontSize: 14, boxSizing: 'border-box' }} />
                  </div>
                ))}
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>Category</label>
                  <select style={{ width: '100%', padding: '8px 12px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--input,var(--card))', color: 'var(--text)', fontSize: 14 }}>
                    <option value="physical">Physical</option>
                    <option value="digital">Digital</option>
                    <option value="experience">Experience</option>
                    <option value="travel">Travel</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
                <button onClick={() => setShowModal(false)} style={{ padding: '8px 18px', borderRadius: 7, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)', cursor: 'pointer' }}>Cancel</button>
                <button onClick={() => setShowModal(false)} style={{ padding: '8px 18px', borderRadius: 7, border: 'none', background: '#6366f1', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>Add Reward</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
