import { useState, useEffect } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { getAdminRetentionOffers } from '../../api/mlmApi'

const TRIGGER_COLOR = { cancel: '#f87171', pause: '#fbbf24', expire: '#fb923c', downgrade: '#c4b5fd' }
const TYPE_COLOR = { discount: '#86efac', credit: '#93c5fd', gift: '#fbbf24', extension: '#818cf8' }

export default function AdminRetentionOffers() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    setLoading(true)
    getAdminRetentionOffers().then(setData).finally(() => setLoading(false))
  }, [])

  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 18px' }

  return (
    <AdminLayout>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 22 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>Retention Offers</h1>
            <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: 14 }}>Win-back and save offers shown when members attempt to cancel, pause, or downgrade</p>
          </div>
          <button onClick={() => setShowModal(true)} style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: '#6366f1', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>+ New Offer</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 14, marginBottom: 22 }}>
          {[
            { label: 'Active Offers', value: (data?.offers || []).filter(o => o.active).length, color: '#86efac' },
            { label: 'Shown (30d)', value: data?.shown30d || 0, color: '#93c5fd' },
            { label: 'Saved (30d)', value: data?.saved30d || 0, color: '#fbbf24' },
            { label: 'Save Rate', value: `${data?.saveRate || 0}%`, color: '#818cf8' },
          ].map(k => (
            <div key={k.label} style={card}>
              <div style={{ fontSize: 22, fontWeight: 700, color: k.color }}>{loading ? '…' : k.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{k.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {loading ? <div style={{ ...card, textAlign: 'center', color: 'var(--text-muted)' }}>Loading…</div> : (
            (data?.offers || []).map(offer => (
              <div key={offer.id} style={card}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
                      <span style={{ fontWeight: 700, fontSize: 15 }}>{offer.name}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: TRIGGER_COLOR[offer.trigger] || '#93c5fd', background: `${TRIGGER_COLOR[offer.trigger] || '#93c5fd'}22`, borderRadius: 5, padding: '2px 8px', textTransform: 'capitalize' }}>On {offer.trigger}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: TYPE_COLOR[offer.offerType] || '#818cf8', background: `${TYPE_COLOR[offer.offerType] || '#818cf8'}22`, borderRadius: 5, padding: '2px 8px', textTransform: 'capitalize' }}>{offer.offerType}</span>
                    </div>
                    <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 6 }}>{offer.headline}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{offer.description}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <div style={{ textAlign: 'center', background: 'rgba(99,102,241,.12)', borderRadius: 8, padding: '8px 14px' }}>
                      <div style={{ fontSize: 20, fontWeight: 700, color: '#818cf8' }}>{offer.saveRate}%</div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>save rate</div>
                    </div>
                    <button style={{ padding: '5px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)', cursor: 'pointer', fontSize: 12 }}>Edit</button>
                    <button style={{ padding: '5px 12px', borderRadius: 6, border: 'none', background: offer.active ? '#86efac22' : 'var(--border)', color: offer.active ? '#86efac' : 'var(--text-muted)', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                      {offer.active ? 'Active' : 'Inactive'}
                    </button>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 20, fontSize: 13, color: 'var(--text-muted)', borderTop: '1px solid var(--border)', paddingTop: 10, flexWrap: 'wrap' }}>
                  <span>Shown: <strong style={{ color: 'var(--text)' }}>{offer.shown.toLocaleString()}</strong></span>
                  <span>Accepted: <strong style={{ color: '#86efac' }}>{offer.accepted}</strong></span>
                  <span>Offer Value: <strong style={{ color: '#fbbf24' }}>{offer.offerValue}</strong></span>
                  <span>Priority: <strong style={{ color: 'var(--text)' }}>{offer.priority}</strong></span>
                  {offer.expiresAfterDays && <span>Expires: <strong style={{ color: '#f87171' }}>{offer.expiresAfterDays}d</strong></span>}
                </div>
              </div>
            ))
          )}
          {!loading && (data?.offers || []).length === 0 && (
            <div style={{ ...card, textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>No retention offers configured yet.</div>
          )}
        </div>

        {showModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowModal(false)}>
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: 28, maxWidth: 480, width: '90%', maxHeight: '80vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
              <h3 style={{ margin: '0 0 18px' }}>New Retention Offer</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
                {[
                  { label: 'Offer Name', placeholder: 'Internal reference name' },
                  { label: 'Headline', placeholder: 'What member sees first' },
                  { label: 'Description', placeholder: 'Detailed offer description' },
                ].map(f => (
                  <div key={f.label}>
                    <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>{f.label}</label>
                    <input placeholder={f.placeholder} style={{ width: '100%', padding: '8px 12px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--input,var(--card))', color: 'var(--text)', fontSize: 14, boxSizing: 'border-box' }} />
                  </div>
                ))}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 13 }}>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>Trigger Event</label>
                    <select style={{ width: '100%', padding: '8px 12px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--input,var(--card))', color: 'var(--text)', fontSize: 14 }}>
                      <option value="cancel">Cancellation attempt</option>
                      <option value="pause">Pause request</option>
                      <option value="expire">Subscription expiry</option>
                      <option value="downgrade">Downgrade request</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>Offer Type</label>
                    <select style={{ width: '100%', padding: '8px 12px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--input,var(--card))', color: 'var(--text)', fontSize: 14 }}>
                      <option value="discount">Discount %</option>
                      <option value="credit">Store credit</option>
                      <option value="gift">Free gift</option>
                      <option value="extension">Free extension</option>
                    </select>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
                <button onClick={() => setShowModal(false)} style={{ padding: '8px 18px', borderRadius: 7, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)', cursor: 'pointer' }}>Cancel</button>
                <button onClick={() => setShowModal(false)} style={{ padding: '8px 18px', borderRadius: 7, border: 'none', background: '#6366f1', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>Create Offer</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
