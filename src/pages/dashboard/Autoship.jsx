import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { useAuth } from '../../context/AuthContext'
import {
  getAutoships, createAutoship, updateAutoship,
  pauseAutoship, resumeAutoship, cancelAutoship,
  getVpProducts,
} from '../../api/mlmApi'

const STATUS_BADGE = {
  active:    { label: 'Active',    cls: 'background:rgba(34,197,94,0.15);color:#4ade80;border:1px solid rgba(34,197,94,0.3)' },
  paused:    { label: 'Paused',    cls: 'background:rgba(234,179,8,0.15);color:#facc15;border:1px solid rgba(234,179,8,0.3)' },
  cancelled: { label: 'Cancelled', cls: 'background:rgba(239,68,68,0.15);color:#f87171;border:1px solid rgba(239,68,68,0.3)' },
}

function Badge({ status }) {
  const { label, cls } = STATUS_BADGE[status] || STATUS_BADGE.cancelled
  return (
    <span style={{ padding: '2px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600, ...Object.fromEntries(cls.split(';').map(s => { const [k, v] = s.split(':'); return [k.trim().replace(/-([a-z])/g, (_,c) => c.toUpperCase()), v?.trim()] }).filter(([k]) => k)) }}>
      {label}
    </span>
  )
}

const FREQ_LABELS = { monthly: 'Every month', bimonthly: 'Every 2 months', quarterly: 'Every 3 months' }

export default function Autoship() {
  const { user } = useAuth()
  const [autoships, setAutoships] = useState([])
  const [activePv, setActivePv] = useState(0)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [cancelTarget, setCancelTarget] = useState(null)
  const [toasting, setToasting] = useState('')
  const [form, setForm] = useState({ productId: '', qty: 1, frequency: 'monthly' })
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const [asRes, prodRes] = await Promise.all([
        getAutoships(user?.userId),
        getVpProducts(),
      ])
      setAutoships(asRes.items || [])
      setActivePv(asRes.activePv || 0)
      setProducts(prodRes.products || [])
    } catch {
      setToasting('Failed to load autoship data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const toast = msg => { setToasting(msg); setTimeout(() => setToasting(''), 3000) }

  const openAdd = () => {
    setForm({ productId: products[0]?.id || '', qty: 1, frequency: 'monthly' })
    setShowAdd(true)
  }

  const openEdit = ship => {
    setForm({ productId: ship.productId, qty: ship.qty, frequency: ship.frequency })
    setEditTarget(ship)
  }

  const handleSave = async () => {
    if (!form.productId) return
    setSaving(true)
    try {
      if (editTarget) {
        await updateAutoship(editTarget.id, { productId: Number(form.productId), qty: Number(form.qty), frequency: form.frequency })
        toast('Autoship updated')
      } else {
        await createAutoship({ userId: user?.userId, productId: Number(form.productId), qty: Number(form.qty), frequency: form.frequency })
        toast('Autoship created')
      }
      setShowAdd(false)
      setEditTarget(null)
      await load()
    } catch (e) {
      toast(e.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const handlePause = async id => {
    try {
      await pauseAutoship(id)
      toast('Autoship paused')
      await load()
    } catch { toast('Failed to pause') }
  }

  const handleResume = async id => {
    try {
      await resumeAutoship(id)
      toast('Autoship resumed')
      await load()
    } catch { toast('Failed to resume') }
  }

  const handleCancel = async () => {
    try {
      await cancelAutoship(cancelTarget)
      toast('Autoship cancelled')
      setCancelTarget(null)
      await load()
    } catch { toast('Failed to cancel') }
  }

  const selectedProduct = products.find(p => p.id === Number(form.productId))
  const formPv = selectedProduct ? selectedProduct.pv * form.qty : 0

  const active = autoships.filter(a => a.status === 'active')
  const inactive = autoships.filter(a => a.status !== 'active')

  return (
    <DashboardLayout>
      <div style={{ padding: '24px 0', maxWidth: 900, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>♻️ Autoship</h1>
            <p style={{ margin: '4px 0 0', opacity: 0.6, fontSize: 14 }}>
              Set up recurring orders to maintain your monthly PV and stay rank-qualified.
            </p>
          </div>
          <button onClick={openAdd} style={{ padding: '10px 20px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
            + Add Autoship
          </button>
        </div>

        {/* PV summary card */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 16, marginBottom: 28 }}>
          {[
            { label: 'Monthly Autoship PV', value: activePv, sub: 'from active subscriptions' },
            { label: 'Active Subscriptions', value: active.length, sub: 'renewing each month' },
            { label: 'Paused', value: autoships.filter(a => a.status === 'paused').length, sub: 'no PV generated' },
          ].map(({ label, value, sub }) => (
            <div key={label} style={{ background: 'var(--card-bg,rgba(255,255,255,0.05))', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '16px 20px' }}>
              <div style={{ fontSize: 12, opacity: 0.6, marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 28, fontWeight: 700 }}>{value}</div>
              <div style={{ fontSize: 12, opacity: 0.5 }}>{sub}</div>
            </div>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, opacity: 0.5 }}>Loading…</div>
        ) : autoships.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', opacity: 0.5 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>♻️</div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>No autoships yet</div>
            <div style={{ fontSize: 14, marginTop: 4 }}>Add your first autoship to maintain monthly PV.</div>
          </div>
        ) : (
          <>
            {/* Active subscriptions */}
            {active.length > 0 && (
              <section style={{ marginBottom: 32 }}>
                <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12, opacity: 0.8 }}>Active Subscriptions</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {active.map(ship => (
                    <AutoshipCard
                      key={ship.id}
                      ship={ship}
                      onEdit={() => openEdit(ship)}
                      onPause={() => handlePause(ship.id)}
                      onCancel={() => setCancelTarget(ship.id)}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Inactive */}
            {inactive.length > 0 && (
              <section>
                <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12, opacity: 0.5 }}>Paused / Cancelled</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {inactive.map(ship => (
                    <AutoshipCard
                      key={ship.id}
                      ship={ship}
                      onEdit={() => openEdit(ship)}
                      onResume={ship.status === 'paused' ? () => handleResume(ship.id) : undefined}
                      onCancel={ship.status !== 'cancelled' ? () => setCancelTarget(ship.id) : undefined}
                    />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>

      {/* Add / Edit modal */}
      {(showAdd || editTarget) && (
        <Modal title={editTarget ? 'Edit Autoship' : 'Add Autoship'} onClose={() => { setShowAdd(false); setEditTarget(null) }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ fontSize: 13, opacity: 0.7, display: 'block', marginBottom: 6 }}>Product</label>
              <select
                value={form.productId}
                onChange={e => setForm(f => ({ ...f, productId: e.target.value }))}
                style={{ width: '100%', padding: '10px 12px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, color: 'inherit', fontSize: 14 }}
              >
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name} — NOK {p.memberPrice} · {p.pv} PV</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 13, opacity: 0.7, display: 'block', marginBottom: 6 }}>Quantity</label>
                <input
                  type="number" min={1} max={10}
                  value={form.qty}
                  onChange={e => setForm(f => ({ ...f, qty: Math.max(1, Number(e.target.value)) }))}
                  style={{ width: '100%', padding: '10px 12px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, color: 'inherit', fontSize: 14, boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ fontSize: 13, opacity: 0.7, display: 'block', marginBottom: 6 }}>Frequency</label>
                <select
                  value={form.frequency}
                  onChange={e => setForm(f => ({ ...f, frequency: e.target.value }))}
                  style={{ width: '100%', padding: '10px 12px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, color: 'inherit', fontSize: 14 }}
                >
                  <option value="monthly">Every month</option>
                  <option value="bimonthly">Every 2 months</option>
                  <option value="quarterly">Every 3 months</option>
                </select>
              </div>
            </div>
            {selectedProduct && (
              <div style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: 8, padding: '12px 16px', fontSize: 13 }}>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>Order summary</div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Price per shipment</span><span>NOK {(selectedProduct.memberPrice * form.qty).toLocaleString()}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>PV per shipment</span><span style={{ color: '#818cf8' }}>{formPv} PV</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Schedule</span><span>{FREQ_LABELS[form.frequency]}</span></div>
              </div>
            )}
            <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
              <button onClick={() => { setShowAdd(false); setEditTarget(null) }} style={{ flex: 1, padding: '10px 0', background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 8, color: 'inherit', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
              <button onClick={handleSave} disabled={saving || !form.productId} style={{ flex: 1, padding: '10px 0', background: '#6366f1', border: 'none', borderRadius: 8, color: '#fff', cursor: 'pointer', fontWeight: 600, opacity: saving ? 0.6 : 1 }}>
                {saving ? 'Saving…' : editTarget ? 'Save Changes' : 'Add Autoship'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Cancel confirm modal */}
      {cancelTarget && (
        <Modal title="Cancel Autoship?" onClose={() => setCancelTarget(null)}>
          <p style={{ opacity: 0.7, marginTop: 0 }}>Cancelling will stop future shipments. This cannot be undone — you would need to create a new autoship.</p>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setCancelTarget(null)} style={{ flex: 1, padding: '10px 0', background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 8, color: 'inherit', cursor: 'pointer', fontWeight: 600 }}>Keep Active</button>
            <button onClick={handleCancel} style={{ flex: 1, padding: '10px 0', background: '#dc2626', border: 'none', borderRadius: 8, color: '#fff', cursor: 'pointer', fontWeight: 600 }}>Cancel Autoship</button>
          </div>
        </Modal>
      )}

      {/* Toast */}
      {toasting && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: '#1e293b', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10, padding: '12px 24px', color: '#fff', fontWeight: 600, zIndex: 9999, fontSize: 14, boxShadow: '0 4px 24px rgba(0,0,0,0.4)' }}>
          {toasting}
        </div>
      )}
    </DashboardLayout>
  )
}

function AutoshipCard({ ship, onEdit, onPause, onResume, onCancel }) {
  const colorMap = { 1: 'from-cyan-900 to-blue-900', 2: 'from-rose-900 to-pink-900', 3: 'from-amber-900 to-yellow-900', 4: 'from-stone-800 to-zinc-900', 5: 'from-green-900 to-emerald-900', 6: 'from-violet-900 to-purple-900' }
  const accentMap = { 1: '#22d3ee', 2: '#f472b6', 3: '#fbbf24', 4: '#a8a29e', 5: '#4ade80', 6: '#a78bfa' }
  const accent = accentMap[ship.productId] || '#6366f1'

  return (
    <div style={{ background: 'var(--card-bg,rgba(255,255,255,0.05))', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
      {/* Color strip */}
      <div style={{ width: 44, height: 44, borderRadius: 10, background: `linear-gradient(135deg, ${accent}33, ${accent}11)`, border: `1px solid ${accent}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
        ♻️
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 180 }}>
        <div style={{ fontWeight: 700, fontSize: 15 }}>{ship.productName}</div>
        <div style={{ fontSize: 13, opacity: 0.6, marginTop: 2 }}>
          Qty {ship.qty} · {FREQ_LABELS[ship.frequency] || ship.frequency} · <span style={{ color: accent }}>{ship.totalPv} PV/shipment</span>
        </div>
        {ship.nextShipDate && (
          <div style={{ fontSize: 12, opacity: 0.5, marginTop: 2 }}>Next shipment: {ship.nextShipDate}</div>
        )}
      </div>

      {/* Price */}
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 16 }}>NOK {(ship.memberPrice * ship.qty).toLocaleString()}</div>
        <div style={{ fontSize: 12, opacity: 0.5 }}>per shipment</div>
      </div>

      {/* Status */}
      <Badge status={ship.status} />

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        {ship.status === 'active' && (
          <>
            <button onClick={onEdit} style={{ padding: '6px 14px', background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 7, color: 'inherit', cursor: 'pointer', fontSize: 13 }}>Edit</button>
            <button onClick={onPause} style={{ padding: '6px 14px', background: 'rgba(234,179,8,0.15)', border: 'none', borderRadius: 7, color: '#facc15', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Pause</button>
            <button onClick={onCancel} style={{ padding: '6px 14px', background: 'rgba(239,68,68,0.12)', border: 'none', borderRadius: 7, color: '#f87171', cursor: 'pointer', fontSize: 13 }}>Cancel</button>
          </>
        )}
        {ship.status === 'paused' && (
          <>
            <button onClick={onResume} style={{ padding: '6px 14px', background: 'rgba(34,197,94,0.15)', border: 'none', borderRadius: 7, color: '#4ade80', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Resume</button>
            <button onClick={onCancel} style={{ padding: '6px 14px', background: 'rgba(239,68,68,0.12)', border: 'none', borderRadius: 7, color: '#f87171', cursor: 'pointer', fontSize: 13 }}>Cancel</button>
          </>
        )}
      </div>
    </div>
  )
}

function Modal({ title, onClose, children }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
      <div style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 14, padding: '24px 28px', width: '100%', maxWidth: 480 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>{title}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: 20, lineHeight: 1, opacity: 0.6 }}>×</button>
        </div>
        {children}
      </div>
    </div>
  )
}
