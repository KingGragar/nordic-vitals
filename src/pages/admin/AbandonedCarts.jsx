import { useState, useEffect } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { getAbandonedCarts, sendCartRecoveryEmail, deleteAbandonedCart } from '../../api/mlmApi'

const STATUS_OPTS = [
  { key: 'all',        label: 'All Status' },
  { key: 'new',        label: 'New' },
  { key: 'emailed',    label: 'Email Sent' },
  { key: 'recovered',  label: 'Recovered' },
  { key: 'lost',       label: 'Lost' },
]

const STATUS_STYLE = {
  new:       { bg: '#1e3a5f', color: '#93c5fd', border: '#1e40af' },
  emailed:   { bg: '#3b2a00', color: '#fcd34d', border: '#854d0e' },
  recovered: { bg: '#052e16', color: '#86efac', border: '#166534' },
  lost:      { bg: '#3b0a0a', color: '#fca5a5', border: '#7f1d1d' },
}

function fmt(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

function timeAgo(iso) {
  const diff = Math.floor((Date.now() - new Date(iso)) / 60000)
  if (diff < 60) return `${diff}m ago`
  if (diff < 1440) return `${Math.floor(diff / 60)}h ago`
  return `${Math.floor(diff / 1440)}d ago`
}

function StatusBadge({ status }) {
  const s = STATUS_STYLE[status] || {}
  return (
    <span style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}`, borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 600, textTransform: 'capitalize' }}>
      {status}
    </span>
  )
}

function CartModal({ cart, onClose, onEmail, onRecover, onLost }) {
  const [emailSending, setEmailSending] = useState(false)
  const [note, setNote] = useState('')
  const total = cart.items.reduce((s, i) => s + i.price * i.qty, 0)

  async function handleEmail() {
    setEmailSending(true)
    await onEmail(cart.id, note)
    setEmailSending(false)
    onClose()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
      <div style={{ background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: 12, width: '100%', maxWidth: 600, maxHeight: '90vh', overflowY: 'auto', padding: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>{cart.memberName || cart.email}</div>
            <div style={{ color: 'var(--text2)', fontSize: 13 }}>{cart.email} · Abandoned {timeAgo(cart.abandonedAt)}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text2)', fontSize: 20, cursor: 'pointer' }}>✕</button>
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 13 }}>Cart Items ({cart.items.length})</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {cart.items.map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--navy3)', borderRadius: 8, padding: '10px 14px' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{item.name}</div>
                  <div style={{ color: 'var(--text2)', fontSize: 12 }}>Qty: {item.qty} · SKU: {item.sku}</div>
                </div>
                <div style={{ fontWeight: 700, color: 'var(--gold)' }}>€{(item.price * item.qty).toFixed(2)}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10, fontWeight: 700, fontSize: 15 }}>
            Total: <span style={{ color: 'var(--gold)', marginLeft: 8 }}>€{total.toFixed(2)}</span>
          </div>
        </div>

        {cart.recoveryEmails?.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 13 }}>Recovery Emails Sent</div>
            {cart.recoveryEmails.map((e, i) => (
              <div key={i} style={{ color: 'var(--text2)', fontSize: 12, padding: '4px 0' }}>
                ✉️ {fmt(e.sentAt)} — {e.template}
              </div>
            ))}
          </div>
        )}

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Recovery Email Note (optional)</label>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Add a personal message to include in the recovery email…"
            style={{ width: '100%', background: 'var(--navy3)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', padding: '10px 12px', fontSize: 13, resize: 'vertical', minHeight: 70, boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            onClick={handleEmail}
            disabled={emailSending || cart.status === 'recovered'}
            style={{ flex: 1, padding: '10px 18px', background: 'var(--gold)', color: '#000', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', opacity: (emailSending || cart.status === 'recovered') ? 0.5 : 1 }}
          >
            {emailSending ? 'Sending…' : '✉️ Send Recovery Email'}
          </button>
          {cart.status !== 'recovered' && (
            <button onClick={() => { onRecover(cart.id); onClose() }} style={{ padding: '10px 14px', background: '#052e16', color: '#86efac', border: '1px solid #166534', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>
              ✓ Mark Recovered
            </button>
          )}
          {cart.status !== 'lost' && (
            <button onClick={() => { onLost(cart.id); onClose() }} style={{ padding: '10px 14px', background: '#3b0a0a', color: '#fca5a5', border: '1px solid #7f1d1d', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>
              ✗ Mark Lost
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function AbandonedCarts() {
  const [carts, setCarts] = useState([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('all')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [toast, setToast] = useState(null)

  async function load() {
    setLoading(true)
    try {
      const r = await getAbandonedCarts({ status })
      setCarts(r.carts || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [status])

  function showToast(msg, ok = true) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3000)
  }

  async function handleEmail(id, note) {
    await sendCartRecoveryEmail(id, { note })
    setCarts(prev => prev.map(c => c.id === id ? {
      ...c,
      status: 'emailed',
      recoveryEmails: [...(c.recoveryEmails || []), { sentAt: new Date().toISOString(), template: 'Standard Recovery' }]
    } : c))
    showToast('Recovery email sent')
  }

  async function handleRecover(id) {
    await deleteAbandonedCart(id, 'recovered')
    setCarts(prev => prev.map(c => c.id === id ? { ...c, status: 'recovered' } : c))
    showToast('Cart marked as recovered')
  }

  async function handleLost(id) {
    await deleteAbandonedCart(id, 'lost')
    setCarts(prev => prev.map(c => c.id === id ? { ...c, status: 'lost' } : c))
    showToast('Cart marked as lost', false)
  }

  const filtered = carts.filter(c => {
    const q = search.toLowerCase()
    return !q || c.email?.toLowerCase().includes(q) || c.memberName?.toLowerCase().includes(q)
  })

  const totalValue = filtered.filter(c => c.status !== 'lost').reduce((s, c) => s + c.items.reduce((a, i) => a + i.price * i.qty, 0), 0)
  const recoveredValue = carts.filter(c => c.status === 'recovered').reduce((s, c) => s + c.items.reduce((a, i) => a + i.price * i.qty, 0), 0)
  const emailedCount = carts.filter(c => c.status === 'emailed').length
  const newCount = carts.filter(c => c.status === 'new').length

  return (
    <AdminLayout>
      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, background: toast.ok ? '#052e16' : '#3b0a0a', color: toast.ok ? '#86efac' : '#fca5a5', border: `1px solid ${toast.ok ? '#166534' : '#7f1d1d'}`, borderRadius: 8, padding: '10px 18px', fontWeight: 600, fontSize: 14 }}>
          {toast.msg}
        </div>
      )}

      {selected && (
        <CartModal
          cart={selected}
          onClose={() => setSelected(null)}
          onEmail={handleEmail}
          onRecover={handleRecover}
          onLost={handleLost}
        />
      )}

      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontWeight: 800, fontSize: 24, marginBottom: 4 }}>🛒 Abandoned Carts</h1>
          <div style={{ color: 'var(--text2)', fontSize: 14 }}>Carts started but not completed — send recovery emails to win them back</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 24 }}>
          {[
            { label: 'New Abandonments', value: newCount, color: '#93c5fd' },
            { label: 'Emails Sent', value: emailedCount, color: '#fcd34d' },
            { label: 'Recoverable Value', value: `€${totalValue.toFixed(0)}`, color: 'var(--gold)' },
            { label: 'Recovered Value', value: `€${recoveredValue.toFixed(0)}`, color: '#86efac' },
          ].map(s => (
            <div key={s.label} style={{ background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 18px' }}>
              <div style={{ color: 'var(--text2)', fontSize: 12, marginBottom: 6 }}>{s.label}</div>
              <div style={{ fontWeight: 800, fontSize: 22, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            style={{ flex: 1, minWidth: 200, background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', padding: '9px 12px', fontSize: 13 }}
          />
          <select value={status} onChange={e => setStatus(e.target.value)} style={{ background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', padding: '9px 12px', fontSize: 13 }}>
            {STATUS_OPTS.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
          </select>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 48, color: 'var(--text2)' }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 48, color: 'var(--text2)' }}>No abandoned carts found</div>
        ) : (
          <div style={{ background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--navy3)' }}>
                    {['Customer', 'Items', 'Cart Value', 'Abandoned', 'Recovery Emails', 'Status', ''].map(h => (
                      <th key={h} style={{ padding: '11px 14px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: 'var(--text2)', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(cart => {
                    const val = cart.items.reduce((s, i) => s + i.price * i.qty, 0)
                    return (
                      <tr key={cart.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>{cart.memberName || '—'}</div>
                          <div style={{ color: 'var(--text2)', fontSize: 12 }}>{cart.email}</div>
                        </td>
                        <td style={{ padding: '12px 14px', color: 'var(--text2)', fontSize: 13 }}>{cart.items.length} item{cart.items.length !== 1 ? 's' : ''}</td>
                        <td style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--gold)', fontSize: 14 }}>€{val.toFixed(2)}</td>
                        <td style={{ padding: '12px 14px', fontSize: 13, color: 'var(--text2)', whiteSpace: 'nowrap' }}>{timeAgo(cart.abandonedAt)}</td>
                        <td style={{ padding: '12px 14px', fontSize: 13, color: 'var(--text2)' }}>{cart.recoveryEmails?.length || 0}</td>
                        <td style={{ padding: '12px 14px' }}><StatusBadge status={cart.status} /></td>
                        <td style={{ padding: '12px 14px' }}>
                          <button
                            onClick={() => setSelected(cart)}
                            style={{ padding: '6px 14px', background: 'var(--navy3)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                          >
                            Review
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
