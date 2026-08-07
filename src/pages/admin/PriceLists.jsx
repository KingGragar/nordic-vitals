import { useState, useEffect } from 'react'
import AdminLayout from '../../components/AdminLayout'
import {
  getAdminPriceLists,
  createAdminPriceList,
  updateAdminPriceList,
  deleteAdminPriceList,
  getAdminPriceOverrides,
  setAdminPriceOverride,
} from '../../api/mlmApi'

const TABS = ['Price Tiers', 'Product Overrides']
const TIER_COLORS = { retail: '#f59e0b', wholesale: '#6366f1', member: '#10b981', vip: '#ec4899', staff: '#64748b' }

function TierBadge({ type }) {
  const c = TIER_COLORS[type] || '#6b7280'
  return (
    <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', background: c + '22', color: c, border: `1px solid ${c}44` }}>
      {type}
    </span>
  )
}

function PriceListModal({ list, onSave, onClose }) {
  const [form, setForm] = useState(list
    ? { name: list.name, type: list.type, discount: list.discount, currency: list.currency, description: list.description, active: list.active }
    : { name: '', type: 'wholesale', discount: 0, currency: 'NOK', description: '', active: true })
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!form.name.trim()) return
    setSaving(true)
    await onSave(form)
    setSaving(false)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={onClose}>
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 28, maxWidth: 480, width: '100%' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 16 }}>{list ? 'Edit Price List' : 'New Price List'}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text2)', fontSize: 20, cursor: 'pointer' }}>✕</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>List Name *</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g. VIP Member Pricing"
              style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 10px', color: 'var(--text)', fontSize: 14, boxSizing: 'border-box' }} />
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Tier Type</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 10px', color: 'var(--text)', fontSize: 14, boxSizing: 'border-box' }}>
                {Object.keys(TIER_COLORS).map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Currency</label>
              <select value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}
                style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 10px', color: 'var(--text)', fontSize: 14, boxSizing: 'border-box' }}>
                {['NOK', 'SEK', 'DKK', 'EUR', 'USD'].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Base Discount (% off retail) — 0 = no discount</label>
            <input type="number" min={0} max={80} value={form.discount} onChange={e => setForm(f => ({ ...f, discount: Number(e.target.value) }))}
              style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 10px', color: 'var(--text)', fontSize: 14, boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Description</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2}
              style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 10px', color: 'var(--text)', fontSize: 13, resize: 'vertical', boxSizing: 'border-box' }} />
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, cursor: 'pointer' }}>
            <input type="checkbox" checked={form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))} />
            Active (available for assignment)
          </label>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 22, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '8px 18px', borderRadius: 6, border: '1px solid var(--border)', background: 'none', color: 'var(--text)', cursor: 'pointer' }}>Cancel</button>
          <button onClick={handleSave} disabled={saving || !form.name.trim()}
            style={{ padding: '8px 20px', borderRadius: 6, border: 'none', background: '#6366f1', color: '#fff', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

function TiersTab({ lists, loading, onCreate, onEdit, onDelete }) {
  const [modal, setModal] = useState(null)
  const [deleting, setDeleting] = useState(null)

  async function handleDelete(id) {
    setDeleting(id)
    await onDelete(id)
    setDeleting(null)
  }

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text2)' }}>Loading…</div>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ color: 'var(--text2)', fontSize: 13 }}>Define pricing tiers and assign members to them. Discounts apply on top of retail price.</div>
        <button onClick={() => setModal('new')} style={{ padding: '8px 16px', borderRadius: 6, border: 'none', background: '#6366f1', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>+ New Tier</button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {lists.map(list => (
          <div key={list.id} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', opacity: list.active ? 1 : 0.55 }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontWeight: 700, fontSize: 15 }}>{list.name}</span>
                <TierBadge type={list.type} />
                {!list.active && <span style={{ fontSize: 11, color: '#6b7280' }}>(inactive)</span>}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text2)' }}>{list.description}</div>
            </div>
            <div style={{ display: 'flex', gap: 20, fontSize: 13, flexWrap: 'wrap' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 700, fontSize: 18, color: '#10b981' }}>{list.discount > 0 ? `-${list.discount}%` : '—'}</div>
                <div style={{ color: 'var(--text2)', fontSize: 11 }}>Discount</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 700, fontSize: 18 }}>{list.currency}</div>
                <div style={{ color: 'var(--text2)', fontSize: 11 }}>Currency</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 700, fontSize: 18 }}>{list.memberCount}</div>
                <div style={{ color: 'var(--text2)', fontSize: 11 }}>Members</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setModal(list)} style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid var(--border)', background: 'none', color: 'var(--text)', cursor: 'pointer', fontSize: 13 }}>Edit</button>
              {list.type !== 'retail' && (
                <button onClick={() => handleDelete(list.id)} disabled={deleting === list.id}
                  style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #ef4444', background: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 13, opacity: deleting === list.id ? 0.5 : 1 }}>
                  {deleting === list.id ? '…' : 'Delete'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      {modal && (
        <PriceListModal
          list={modal === 'new' ? null : modal}
          onSave={async form => {
            if (modal === 'new') await onCreate(form)
            else await onEdit(modal.id, form)
            setModal(null)
          }}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}

function OverridesTab({ overrides, lists, onSave }) {
  const [saving, setSaving] = useState(null)
  const [edits, setEdits] = useState({})

  function startEdit(productId, listId, current) {
    setEdits(e => ({ ...e, [`${productId}-${listId}`]: String(current ?? '') }))
  }

  async function commitEdit(productId, listId) {
    const key = `${productId}-${listId}`
    const val = edits[key]
    setSaving(key)
    await onSave(productId, listId, val === '' ? null : Number(val))
    setSaving(null)
    setEdits(e => { const n = { ...e }; delete n[key]; return n })
  }

  return (
    <div>
      <div style={{ color: 'var(--text2)', fontSize: 13, marginBottom: 16 }}>
        Override per-product prices for specific tiers. Leave blank to apply the tier's base discount.
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--text2)', fontWeight: 600 }}>Product</th>
              <th style={{ textAlign: 'right', padding: '8px 12px', color: 'var(--text2)', fontWeight: 600 }}>Retail (NOK)</th>
              {lists.map(l => <th key={l.id} style={{ textAlign: 'right', padding: '8px 12px', color: 'var(--text2)', fontWeight: 600 }}>{l.name}</th>)}
            </tr>
          </thead>
          <tbody>
            {overrides.map(row => (
              <tr key={row.productId} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '10px 12px' }}>
                  <div style={{ fontWeight: 600 }}>{row.productName}</div>
                  <div style={{ fontSize: 11, color: 'var(--text2)' }}>SKU: {row.sku}</div>
                </td>
                <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700 }}>NOK {row.retailPrice.toLocaleString()}</td>
                {lists.map(list => {
                  const key = `${row.productId}-${list.id}`
                  const override = row.overrides[list.id]
                  const calc = override != null ? override : Math.round(row.retailPrice * (1 - list.discount / 100))
                  const isEditing = key in edits
                  return (
                    <td key={list.id} style={{ padding: '10px 12px', textAlign: 'right' }}>
                      {isEditing ? (
                        <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end', alignItems: 'center' }}>
                          <input type="number" value={edits[key]} onChange={e => setEdits(ed => ({ ...ed, [key]: e.target.value }))}
                            style={{ width: 80, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 4, padding: '4px 6px', color: 'var(--text)', fontSize: 13, textAlign: 'right' }} />
                          <button onClick={() => commitEdit(row.productId, list.id)} disabled={saving === key}
                            style={{ padding: '4px 8px', borderRadius: 4, border: 'none', background: '#10b981', color: '#fff', cursor: 'pointer', fontSize: 12 }}>
                            {saving === key ? '…' : '✓'}
                          </button>
                          <button onClick={() => setEdits(e => { const n = { ...e }; delete n[key]; return n })}
                            style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid var(--border)', background: 'none', color: 'var(--text2)', cursor: 'pointer', fontSize: 12 }}>✕</button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', alignItems: 'center' }}>
                          <span style={{ color: override != null ? '#f59e0b' : 'var(--text)' }}>
                            {override != null ? '★ ' : ''}NOK {calc.toLocaleString()}
                          </span>
                          <button onClick={() => startEdit(row.productId, list.id, override ?? calc)}
                            style={{ padding: '2px 8px', borderRadius: 4, border: '1px solid var(--border)', background: 'none', color: 'var(--text2)', cursor: 'pointer', fontSize: 11 }}>Edit</button>
                        </div>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ marginTop: 12, fontSize: 11, color: 'var(--text2)' }}>★ = manually overridden price. Others auto-calculated from tier discount.</div>
    </div>
  )
}

export default function AdminPriceLists() {
  const [tab, setTab] = useState(0)
  const [lists, setLists] = useState([])
  const [overrides, setOverrides] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getAdminPriceLists(), getAdminPriceOverrides()]).then(([l, o]) => {
      setLists(l)
      setOverrides(o)
      setLoading(false)
    })
  }, [])

  async function handleCreate(form) {
    const created = await createAdminPriceList(form)
    setLists(l => [...l, created])
  }
  async function handleEdit(id, form) {
    await updateAdminPriceList(id, form)
    setLists(l => l.map(x => x.id === id ? { ...x, ...form } : x))
  }
  async function handleDelete(id) {
    await deleteAdminPriceList(id)
    setLists(l => l.filter(x => x.id !== id))
  }
  async function handleOverride(productId, listId, price) {
    await setAdminPriceOverride(productId, listId, price)
    setOverrides(rows => rows.map(r => r.productId === productId
      ? { ...r, overrides: price == null ? (() => { const o = { ...r.overrides }; delete o[listId]; return o })() : { ...r.overrides, [listId]: price } }
      : r))
  }

  const activeLists = lists.filter(l => l.type !== 'retail')

  return (
    <AdminLayout>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>💲 Price Lists</h1>
          <p style={{ color: 'var(--text2)', fontSize: 13, marginTop: 4 }}>Manage pricing tiers and per-product overrides for retail, wholesale, and member pricing.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 12, marginBottom: 28 }}>
          {[
            { icon: '🏷️', label: 'Price Tiers', value: lists.length },
            { icon: '👥', label: 'Members Assigned', value: lists.reduce((s, l) => s + (l.memberCount || 0), 0).toLocaleString() },
            { icon: '📦', label: 'Product Overrides', value: overrides.reduce((s, r) => s + Object.keys(r.overrides || {}).length, 0) },
            { icon: '✅', label: 'Active Tiers', value: lists.filter(l => l.active).length },
          ].map(c => (
            <div key={c.label} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 18px' }}>
              <div style={{ fontSize: 22, marginBottom: 6 }}>{c.icon}</div>
              <div style={{ fontWeight: 700, fontSize: 20 }}>{c.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{c.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid var(--border)' }}>
          {TABS.map((t, i) => (
            <button key={t} onClick={() => setTab(i)} style={{ padding: '8px 18px', border: 'none', background: 'none', color: tab === i ? '#6366f1' : 'var(--text2)', fontWeight: tab === i ? 700 : 400, borderBottom: `2px solid ${tab === i ? '#6366f1' : 'transparent'}`, cursor: 'pointer', fontSize: 14, marginBottom: -1 }}>{t}</button>
          ))}
        </div>

        {tab === 0 && <TiersTab lists={lists} loading={loading} onCreate={handleCreate} onEdit={handleEdit} onDelete={handleDelete} />}
        {tab === 1 && <OverridesTab overrides={overrides} lists={activeLists} onSave={handleOverride} />}
      </div>
    </AdminLayout>
  )
}
