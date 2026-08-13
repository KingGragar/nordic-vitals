import { useState, useEffect } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { getAdminResellers, createReseller, updateReseller, deleteReseller, getResellerOrders } from '../../api/mlmApi'

const TIERS = [
  { key: 'bronze',   label: 'Bronze',   disc: 10, color: '#cd7f32' },
  { key: 'silver',   label: 'Silver',   disc: 15, color: '#9ca3af' },
  { key: 'gold',     label: 'Gold',     disc: 20, color: '#c9a84c' },
  { key: 'platinum', label: 'Platinum', disc: 25, color: '#a855f7' },
]
const STATUSES = ['all', 'active', 'pending', 'suspended']

const BADGE = { active: '#16a34a', pending: '#d97706', suspended: '#dc2626' }

function Pill({ status }) {
  return (
    <span style={{ background: BADGE[status] + '22', color: BADGE[status], border: `1px solid ${BADGE[status]}44`, borderRadius: 12, padding: '2px 10px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>
      {status}
    </span>
  )
}

function TierBadge({ tier }) {
  const t = TIERS.find(x => x.key === tier) || TIERS[0]
  return (
    <span style={{ background: t.color + '22', color: t.color, border: `1px solid ${t.color}55`, borderRadius: 10, padding: '2px 9px', fontSize: 11, fontWeight: 700 }}>
      {t.label} ({t.disc}% off)
    </span>
  )
}

function Modal({ reseller, onClose, onSave }) {
  const isEdit = !!reseller?.id
  const [form, setForm] = useState(reseller || { company: '', contact: '', email: '', phone: '', country: 'Norway', tier: 'bronze', creditLimit: 50000, notes: '' })
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    await onSave(form)
    setSaving(false)
    onClose()
  }

  const F = (k, v) => setForm(p => ({ ...p, [k]: v }))

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#0008', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <form onSubmit={handleSubmit} style={{ background: 'var(--card)', borderRadius: 12, padding: 28, width: 480, maxHeight: '90vh', overflowY: 'auto' }}>
        <h3 style={{ margin: '0 0 20px', color: 'var(--text)' }}>{isEdit ? 'Edit Reseller' : 'Add Reseller'}</h3>
        {[
          ['Company Name', 'company', 'text', true],
          ['Contact Person', 'contact', 'text', true],
          ['Email', 'email', 'email', true],
          ['Phone', 'phone', 'tel', false],
        ].map(([lbl, key, type, req]) => (
          <label key={key} style={{ display: 'block', marginBottom: 14 }}>
            <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 4 }}>{lbl}{req && ' *'}</div>
            <input required={req} type={type} value={form[key]} onChange={e => F(key, e.target.value)}
              style={{ width: '100%', boxSizing: 'border-box', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 7, padding: '8px 12px', color: 'var(--text)', fontSize: 14 }} />
          </label>
        ))}
        <label style={{ display: 'block', marginBottom: 14 }}>
          <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 4 }}>Country</div>
          <select value={form.country} onChange={e => F('country', e.target.value)} style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 7, padding: '8px 12px', color: 'var(--text)', fontSize: 14 }}>
            {['Norway', 'Sweden', 'Denmark', 'Finland', 'Germany', 'UK', 'Netherlands', 'Other'].map(c => <option key={c}>{c}</option>)}
          </select>
        </label>
        <label style={{ display: 'block', marginBottom: 14 }}>
          <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 4 }}>Reseller Tier</div>
          <select value={form.tier} onChange={e => F('tier', e.target.value)} style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 7, padding: '8px 12px', color: 'var(--text)', fontSize: 14 }}>
            {TIERS.map(t => <option key={t.key} value={t.key}>{t.label} — {t.disc}% wholesale discount</option>)}
          </select>
        </label>
        <label style={{ display: 'block', marginBottom: 14 }}>
          <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 4 }}>Credit Limit (NOK)</div>
          <input type="number" min={0} value={form.creditLimit} onChange={e => F('creditLimit', +e.target.value)}
            style={{ width: '100%', boxSizing: 'border-box', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 7, padding: '8px 12px', color: 'var(--text)', fontSize: 14 }} />
        </label>
        <label style={{ display: 'block', marginBottom: 20 }}>
          <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 4 }}>Notes</div>
          <textarea value={form.notes} onChange={e => F('notes', e.target.value)} rows={3}
            style={{ width: '100%', boxSizing: 'border-box', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 7, padding: '8px 12px', color: 'var(--text)', fontSize: 14, resize: 'vertical' }} />
        </label>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button type="button" onClick={onClose} style={{ padding: '8px 18px', borderRadius: 8, border: '1px solid var(--border)', background: 'none', color: 'var(--text)', cursor: 'pointer' }}>Cancel</button>
          <button type="submit" disabled={saving} style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: '#c9a84c', color: '#000', fontWeight: 700, cursor: 'pointer' }}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  )
}

function OrderDrawer({ reseller, orders, onClose }) {
  if (!reseller) return null
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 90, display: 'flex' }} onClick={onClose}>
      <div style={{ flex: 1 }} />
      <div style={{ width: 440, background: 'var(--card)', height: '100%', overflowY: 'auto', padding: 28, boxShadow: '-4px 0 24px #0004' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 17, color: 'var(--text)' }}>{reseller.company}</div>
            <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{reseller.contact} · {reseller.email}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--text2)' }}>×</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
          {[
            ['Tier', <TierBadge tier={reseller.tier} />],
            ['Status', <Pill status={reseller.status} />],
            ['Credit Limit', `NOK ${reseller.creditLimit.toLocaleString()}`],
            ['Total Orders', reseller.totalOrders],
            ['Total Revenue', `NOK ${reseller.totalNok.toLocaleString()}`],
            ['Last Order', reseller.lastOrderDate || '—'],
          ].map(([k, v]) => (
            <div key={k} style={{ background: 'var(--bg)', borderRadius: 8, padding: '10px 12px' }}>
              <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 4 }}>{k}</div>
              <div style={{ fontWeight: 600, color: 'var(--text)', fontSize: 14 }}>{v}</div>
            </div>
          ))}
        </div>
        <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: 12 }}>Order History</div>
        {orders.length === 0 ? (
          <div style={{ color: 'var(--text2)', fontSize: 14, textAlign: 'center', padding: 24 }}>No orders yet</div>
        ) : orders.map(o => (
          <div key={o.id} style={{ background: 'var(--bg)', borderRadius: 8, padding: '12px 14px', marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>{o.id}</span>
              <span style={{ fontSize: 13, color: 'var(--text)' }}>NOK {o.totalNok.toLocaleString()}</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text2)' }}>{o.date} · {o.items} SKUs · <Pill status={o.status} /></div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function AdminResellers() {
  const [data, setData] = useState(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null)
  const [drawer, setDrawer] = useState(null)
  const [drawerOrders, setDrawerOrders] = useState([])
  const [deleteId, setDeleteId] = useState(null)

  useEffect(() => { getAdminResellers().then(setData) }, [])

  async function handleSave(form) {
    if (form.id) {
      const updated = await updateReseller(form)
      setData(p => ({ ...p, resellers: p.resellers.map(r => r.id === updated.id ? updated : r) }))
    } else {
      const created = await createReseller(form)
      setData(p => ({ ...p, resellers: [created, ...p.resellers] }))
    }
  }

  async function handleDelete(id) {
    await deleteReseller(id)
    setData(p => ({ ...p, resellers: p.resellers.filter(r => r.id !== id) }))
    setDeleteId(null)
  }

  async function openDrawer(r) {
    const orders = await getResellerOrders(r.id)
    setDrawerOrders(orders)
    setDrawer(r)
  }

  if (!data) return <AdminLayout><div style={{ padding: 32, color: 'var(--text2)' }}>Loading…</div></AdminLayout>

  const filtered = data.resellers.filter(r =>
    (statusFilter === 'all' || r.status === statusFilter) &&
    (search === '' || r.company.toLowerCase().includes(search.toLowerCase()) || r.contact.toLowerCase().includes(search.toLowerCase()) || r.email.toLowerCase().includes(search.toLowerCase()))
  )

  const kpis = [
    { label: 'Total Resellers', value: data.stats.total },
    { label: 'Active', value: data.stats.active },
    { label: 'YTD Revenue (NOK)', value: data.stats.ytdRevenueNok.toLocaleString() },
    { label: 'Avg Order Value', value: `NOK ${data.stats.avgOrderNok.toLocaleString()}` },
    { label: 'Pending Onboarding', value: data.stats.pending, warn: data.stats.pending > 0 },
  ]

  return (
    <AdminLayout>
      <div style={{ padding: '24px 28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h2 style={{ margin: 0, color: 'var(--text)', fontSize: 22 }}>🏪 Reseller / Wholesale Program</h2>
            <div style={{ color: 'var(--text2)', fontSize: 13, marginTop: 4 }}>Manage B2B wholesale reseller accounts</div>
          </div>
          <button onClick={() => setModal({})} style={{ background: '#c9a84c', color: '#000', border: 'none', borderRadius: 8, padding: '9px 18px', fontWeight: 700, cursor: 'pointer' }}>
            + Add Reseller
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 24 }}>
          {kpis.map(k => (
            <div key={k.label} style={{ background: 'var(--card)', borderRadius: 10, padding: '14px 16px', border: k.warn ? '1px solid #d9770680' : '1px solid var(--border)' }}>
              <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 6 }}>{k.label}</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: k.warn ? '#d97706' : 'var(--text)' }}>{k.value}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
          {STATUSES.map(s => (
            <button key={s} onClick={() => setStatusFilter(s)} style={{ padding: '6px 16px', borderRadius: 20, border: 'none', cursor: 'pointer', fontWeight: statusFilter === s ? 700 : 400, background: statusFilter === s ? '#c9a84c' : 'var(--card)', color: statusFilter === s ? '#000' : 'var(--text)', textTransform: 'capitalize' }}>
              {s === 'all' ? 'All' : s}
            </button>
          ))}
          <input placeholder="Search by company, contact or email…" value={search} onChange={e => setSearch(e.target.value)}
            style={{ marginLeft: 'auto', padding: '6px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 13, minWidth: 240 }} />
        </div>

        <div style={{ background: 'var(--card)', borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'var(--bg)' }}>
                  {['Company', 'Contact', 'Country', 'Tier', 'Total Orders', 'Revenue (NOK)', 'Last Order', 'Status', ''].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--text2)', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={9} style={{ textAlign: 'center', padding: 32, color: 'var(--text2)' }}>No resellers found</td></tr>
                )}
                {filtered.map(r => (
                  <tr key={r.id} onClick={() => openDrawer(r)} style={{ borderTop: '1px solid var(--border)', cursor: 'pointer' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '11px 14px', fontWeight: 700, color: 'var(--text)' }}>{r.company}</td>
                    <td style={{ padding: '11px 14px', color: 'var(--text2)' }}>{r.contact}</td>
                    <td style={{ padding: '11px 14px', color: 'var(--text2)' }}>{r.country}</td>
                    <td style={{ padding: '11px 14px' }}><TierBadge tier={r.tier} /></td>
                    <td style={{ padding: '11px 14px', color: 'var(--text)' }}>{r.totalOrders}</td>
                    <td style={{ padding: '11px 14px', fontWeight: 600, color: 'var(--text)' }}>{r.totalNok.toLocaleString()}</td>
                    <td style={{ padding: '11px 14px', color: 'var(--text2)' }}>{r.lastOrderDate || '—'}</td>
                    <td style={{ padding: '11px 14px' }}><Pill status={r.status} /></td>
                    <td style={{ padding: '11px 14px' }}>
                      <button onClick={e => { e.stopPropagation(); setModal(r) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text2)', marginRight: 8 }}>✏️</button>
                      <button onClick={e => { e.stopPropagation(); setDeleteId(r.id) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626' }}>🗑</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ marginTop: 20, padding: 16, background: 'var(--card)', borderRadius: 10, border: '1px solid var(--border)' }}>
          <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: 10 }}>Tier Discount Schedule</div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {TIERS.map(t => (
              <div key={t.key} style={{ background: 'var(--bg)', borderRadius: 8, padding: '10px 16px', border: `1px solid ${t.color}44`, minWidth: 120 }}>
                <div style={{ color: t.color, fontWeight: 700, fontSize: 14 }}>{t.label}</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', marginTop: 4 }}>{t.disc}%</div>
                <div style={{ fontSize: 11, color: 'var(--text2)' }}>wholesale discount</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {modal !== null && <Modal reseller={modal.id ? modal : null} onClose={() => setModal(null)} onSave={handleSave} />}
      {drawer && <OrderDrawer reseller={drawer} orders={drawerOrders} onClose={() => setDrawer(null)} />}
      {deleteId && (
        <div style={{ position: 'fixed', inset: 0, background: '#0008', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--card)', borderRadius: 12, padding: 28, maxWidth: 380, textAlign: 'center' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🗑</div>
            <div style={{ fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>Delete Reseller?</div>
            <div style={{ color: 'var(--text2)', fontSize: 14, marginBottom: 20 }}>This will permanently remove the reseller account and order history.</div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={() => setDeleteId(null)} style={{ padding: '8px 18px', borderRadius: 8, border: '1px solid var(--border)', background: 'none', color: 'var(--text)', cursor: 'pointer' }}>Cancel</button>
              <button onClick={() => handleDelete(deleteId)} style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: '#dc2626', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
