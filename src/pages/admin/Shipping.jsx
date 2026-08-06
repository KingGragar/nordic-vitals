import { useState, useEffect } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { getShippingZones, createShippingZone, updateShippingZone, deleteShippingZone } from '../../api/mlmApi'

const ALL_COUNTRIES = [
  'Norway', 'Sweden', 'Denmark', 'Finland', 'Iceland',
  'Germany', 'Netherlands', 'France', 'Spain', 'Italy', 'Belgium', 'Austria',
  'Switzerland', 'Poland', 'Czech Republic', 'Other EU',
  'United Kingdom', 'United States', 'Canada',
  'Australia', 'New Zealand', 'Japan', 'South Korea', 'Singapore',
  'UAE', 'South Africa', 'Brazil', 'Mexico', 'Argentina', 'India', 'Other',
]

const CARRIERS = [
  'PostNord Norway', 'PostNord Scandinavia', 'Bring', 'DHL Express',
  'UPS International', 'FedEx International', 'Posten Norge', 'Custom',
]

const badge = (active) => ({
  display: 'inline-block',
  padding: '2px 10px',
  borderRadius: '99px',
  fontSize: '11px',
  fontWeight: '700',
  background: active ? 'rgba(52,211,153,0.15)' : 'rgba(148,163,184,0.12)',
  color: active ? '#34d399' : 'var(--text2)',
  border: `1px solid ${active ? 'rgba(52,211,153,0.3)' : 'rgba(148,163,184,0.2)'}`,
})

function ZoneModal({ zone, onSave, onClose, usedCountries }) {
  const [form, setForm] = useState(zone ? {
    name: zone.name,
    carrier: zone.carrier,
    rate: zone.rate,
    freeOver: zone.freeOver,
    estimatedDays: zone.estimatedDays,
    active: zone.active,
    countries: [...zone.countries],
  } : {
    name: '',
    carrier: 'PostNord Norway',
    rate: 99,
    freeOver: 499,
    estimatedDays: '2–4 business days',
    active: true,
    countries: [],
  })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  const toggleCountry = (c) => {
    setForm(f => ({
      ...f,
      countries: f.countries.includes(c)
        ? f.countries.filter(x => x !== c)
        : [...f.countries, c],
    }))
  }

  async function handleSave() {
    if (!form.name.trim()) return setErr('Zone name required')
    if (form.countries.length === 0) return setErr('Select at least one country')
    if (!form.rate || form.rate < 0) return setErr('Rate must be ≥ 0')
    setErr('')
    setSaving(true)
    try { await onSave(form) } finally { setSaving(false) }
  }

  const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }
  const box = { background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '580px', maxHeight: '85vh', overflowY: 'auto' }

  return (
    <div style={overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={box}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ color: 'var(--cream)', fontSize: '17px', fontWeight: '700', margin: 0 }}>
            {zone ? 'Edit Shipping Zone' : 'New Shipping Zone'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text2)', fontSize: '22px', cursor: 'pointer', lineHeight: 1 }}>×</button>
        </div>

        <label style={{ display: 'block', marginBottom: '16px' }}>
          <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text2)', marginBottom: '6px' }}>Zone Name</div>
          <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Norway Domestic" />
        </label>

        <label style={{ display: 'block', marginBottom: '16px' }}>
          <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text2)', marginBottom: '6px' }}>Carrier</div>
          <select className="input" value={form.carrier} onChange={e => setForm(f => ({ ...f, carrier: e.target.value }))}>
            {CARRIERS.map(c => <option key={c}>{c}</option>)}
          </select>
        </label>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <label>
            <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text2)', marginBottom: '6px' }}>Rate (NOK)</div>
            <input className="input" type="number" min="0" value={form.rate}
              onChange={e => setForm(f => ({ ...f, rate: parseFloat(e.target.value) || 0 }))} />
          </label>
          <label>
            <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text2)', marginBottom: '6px' }}>Free Shipping Over (NOK)</div>
            <input className="input" type="number" min="0" value={form.freeOver}
              onChange={e => setForm(f => ({ ...f, freeOver: parseFloat(e.target.value) || 0 }))} />
          </label>
        </div>

        <label style={{ display: 'block', marginBottom: '16px' }}>
          <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text2)', marginBottom: '6px' }}>Estimated Delivery</div>
          <input className="input" value={form.estimatedDays}
            onChange={e => setForm(f => ({ ...f, estimatedDays: e.target.value }))} placeholder="1–2 business days" />
        </label>

        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text2)', marginBottom: '10px' }}>
            Countries in this zone ({form.countries.length} selected)
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', maxHeight: '160px', overflowY: 'auto', padding: '4px' }}>
            {ALL_COUNTRIES.map(c => {
              const sel = form.countries.includes(c)
              const taken = !sel && usedCountries.includes(c)
              return (
                <button key={c} onClick={() => !taken && toggleCountry(c)}
                  disabled={taken}
                  style={{
                    padding: '4px 12px', borderRadius: '99px', fontSize: '12px', fontWeight: '600', cursor: taken ? 'not-allowed' : 'pointer',
                    background: sel ? 'var(--gold)' : taken ? 'rgba(148,163,184,0.06)' : 'rgba(148,163,184,0.1)',
                    color: sel ? '#000' : taken ? 'var(--text2)' : 'var(--cream)',
                    border: sel ? '1px solid var(--gold)' : '1px solid var(--border)',
                    opacity: taken ? 0.4 : 1,
                    transition: 'all 0.15s',
                  }}>
                  {c}{taken ? ' ✗' : ''}
                </button>
              )
            })}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text2)', marginTop: '6px' }}>
            ✗ = already assigned to another active zone
          </div>
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', cursor: 'pointer' }}>
          <input type="checkbox" checked={form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))} />
          <span style={{ fontSize: '13px', color: 'var(--cream)' }}>Zone active</span>
        </label>

        {err && <div style={{ color: '#fca5a5', fontSize: '12px', marginBottom: '12px' }}>{err}</div>}

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '10px 20px', background: 'none', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text2)', cursor: 'pointer', fontSize: '14px' }}>Cancel</button>
          <button onClick={handleSave} disabled={saving}
            style={{ padding: '10px 24px', background: 'var(--gold)', border: 'none', borderRadius: '8px', color: '#000', fontWeight: '700', cursor: saving ? 'not-allowed' : 'pointer', fontSize: '14px', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Saving…' : zone ? 'Save Changes' : 'Create Zone'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AdminShipping() {
  const [zones, setZones] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null) // null | 'create' | { zone }
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [toast, setToast] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getShippingZones().then(z => { setZones(z); setLoading(false) })
  }, [])

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const usedCountries = zones
    .filter(z => z.active && (modal === null || (modal.zone && modal.zone.id !== z.id)))
    .flatMap(z => z.countries)

  async function handleSave(form) {
    if (modal === 'create') {
      const zone = await createShippingZone(form)
      setZones(prev => [...prev, zone])
      showToast('Shipping zone created')
    } else {
      const zone = await updateShippingZone(modal.zone.id, form)
      setZones(prev => prev.map(z => z.id === zone.id ? zone : z))
      showToast('Shipping zone updated')
    }
    setModal(null)
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setSaving(true)
    await deleteShippingZone(deleteTarget.id)
    setZones(prev => prev.filter(z => z.id !== deleteTarget.id))
    setDeleteTarget(null)
    setSaving(false)
    showToast('Zone deleted')
  }

  async function toggleActive(zone) {
    const updated = await updateShippingZone(zone.id, { ...zone, active: !zone.active })
    setZones(prev => prev.map(z => z.id === updated.id ? updated : z))
    showToast(updated.active ? 'Zone activated' : 'Zone deactivated')
  }

  const totalCountries = [...new Set(zones.flatMap(z => z.countries))].length
  const activeZones = zones.filter(z => z.active).length
  const avgRate = zones.length
    ? Math.round(zones.filter(z => z.active).reduce((s, z) => s + z.rate, 0) / (activeZones || 1))
    : 0

  const kpi = [
    { label: 'Total Zones', value: zones.length, icon: '🗺️' },
    { label: 'Active Zones', value: activeZones, icon: '✅' },
    { label: 'Countries Covered', value: totalCountries, icon: '🌍' },
    { label: 'Avg Rate (NOK)', value: avgRate, icon: '💳' },
  ]

  return (
    <AdminLayout>
      {toast && (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 999, background: 'var(--gold)', color: '#000', padding: '12px 20px', borderRadius: '10px', fontWeight: '700', fontSize: '13px', boxShadow: '0 4px 16px rgba(0,0,0,0.4)' }}>
          {toast}
        </div>
      )}

      {modal && (
        <ZoneModal
          zone={modal === 'create' ? null : modal.zone}
          onSave={handleSave}
          onClose={() => setModal(null)}
          usedCountries={usedCountries}
        />
      )}

      {deleteTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: '16px', padding: '28px', maxWidth: '400px', width: '100%' }}>
            <h3 style={{ color: 'var(--cream)', marginBottom: '12px', fontSize: '16px' }}>Delete Zone?</h3>
            <p style={{ color: 'var(--text2)', fontSize: '14px', marginBottom: '24px', lineHeight: 1.5 }}>
              Delete <strong style={{ color: 'var(--cream)' }}>{deleteTarget.name}</strong>? Orders from its {deleteTarget.countries.length} {deleteTarget.countries.length === 1 ? 'country' : 'countries'} will have no shipping rate until reassigned.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button onClick={() => setDeleteTarget(null)} style={{ padding: '10px 20px', background: 'none', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text2)', cursor: 'pointer', fontSize: '14px' }}>Cancel</button>
              <button onClick={handleDelete} disabled={saving}
                style={{ padding: '10px 20px', background: '#ef4444', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: '700', cursor: saving ? 'not-allowed' : 'pointer', fontSize: '14px', opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Deleting…' : 'Delete Zone'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ padding: '32px 24px', maxWidth: '1100px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ color: 'var(--cream)', fontSize: '22px', fontWeight: '800', margin: 0 }}>🚚 Shipping Configuration</h1>
            <p style={{ color: 'var(--text2)', fontSize: '13px', margin: '4px 0 0' }}>
              Manage shipping zones, carriers, rates, and free-shipping thresholds
            </p>
          </div>
          <button onClick={() => setModal('create')}
            style={{ padding: '10px 20px', background: 'var(--gold)', border: 'none', borderRadius: '10px', color: '#000', fontWeight: '700', cursor: 'pointer', fontSize: '14px' }}>
            + New Zone
          </button>
        </div>

        {/* KPI strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '28px' }}>
          {kpi.map(k => (
            <div key={k.label} style={{ background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: '12px', padding: '18px 20px' }}>
              <div style={{ fontSize: '24px', marginBottom: '6px' }}>{k.icon}</div>
              <div style={{ fontSize: '26px', fontWeight: '800', color: 'var(--cream)', lineHeight: 1 }}>{k.value}</div>
              <div style={{ fontSize: '12px', color: 'var(--text2)', marginTop: '4px' }}>{k.label}</div>
            </div>
          ))}
        </div>

        {/* Zone cards */}
        {loading ? (
          <div style={{ textAlign: 'center', color: 'var(--text2)', padding: '60px' }}>Loading…</div>
        ) : zones.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text2)', padding: '60px' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>🗺️</div>
            <div>No shipping zones yet. Create one above.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {zones.map(zone => (
              <div key={zone.id} style={{ background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: '14px', padding: '20px 24px', opacity: zone.active ? 1 : 0.6, transition: 'opacity 0.2s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                      <span style={{ color: 'var(--cream)', fontWeight: '700', fontSize: '15px' }}>{zone.name}</span>
                      <span style={badge(zone.active)}>{zone.active ? 'Active' : 'Inactive'}</span>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', fontSize: '13px', color: 'var(--text2)', marginBottom: '12px' }}>
                      <span>🚛 {zone.carrier}</span>
                      <span>💰 NOK {zone.rate} flat</span>
                      <span>🎁 Free over NOK {zone.freeOver.toLocaleString()}</span>
                      <span>⏱ {zone.estimatedDays}</span>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {zone.countries.map(c => (
                        <span key={c} style={{ padding: '2px 10px', background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.25)', borderRadius: '99px', fontSize: '11px', color: 'var(--gold)' }}>
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
                    <button onClick={() => toggleActive(zone)}
                      style={{ padding: '6px 14px', background: zone.active ? 'rgba(148,163,184,0.1)' : 'rgba(52,211,153,0.1)', border: `1px solid ${zone.active ? 'var(--border)' : 'rgba(52,211,153,0.3)'}`, borderRadius: '8px', color: zone.active ? 'var(--text2)' : '#34d399', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>
                      {zone.active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button onClick={() => setModal({ zone })}
                      style={{ padding: '6px 14px', background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.3)', borderRadius: '8px', color: 'var(--gold)', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>
                      Edit
                    </button>
                    <button onClick={() => setDeleteTarget(zone)}
                      style={{ padding: '6px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', color: '#ef4444', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info box */}
        <div style={{ marginTop: '28px', padding: '16px 20px', background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '12px' }}>
          <div style={{ fontSize: '13px', color: 'var(--text2)', lineHeight: 1.7 }}>
            <strong style={{ color: '#93c5fd' }}>ℹ️ How shipping zones work:</strong> Each country can belong to one active zone. When a customer selects their country at checkout, the zone rate is automatically applied. If the cart total exceeds the free-shipping threshold, shipping is waived. Countries not assigned to any active zone receive free shipping.
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
