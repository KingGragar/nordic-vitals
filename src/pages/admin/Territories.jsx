import { useState, useEffect } from 'react'
import AdminLayout from '../../components/AdminLayout'
import {
  getAdminTerritories,
  createAdminTerritory,
  updateAdminTerritory,
  deleteAdminTerritory,
} from '../../api/mlmApi'

const STATUS_STYLE = {
  active:  { bg: '#052e16', color: '#86efac', border: '#166534' },
  open:    { bg: '#1e3a5f', color: '#93c5fd', border: '#1d4ed8' },
  pending: { bg: '#2d1f00', color: '#fbbf24', border: '#92400e' },
}

const FLAG = { NO: '🇳🇴', SE: '🇸🇪', DK: '🇩🇰', FI: '🇫🇮', EE: '🇪🇪', LV: '🇱🇻', LT: '🇱🇹', DE: '🇩🇪', AT: '🇦🇹', NL: '🇳🇱', BE: '🇧🇪', LU: '🇱🇺', GB: '🇬🇧', IE: '🇮🇪', PL: '🇵🇱', FR: '🇫🇷', ES: '🇪🇸', IT: '🇮🇹', PT: '🇵🇹', CH: '🇨🇭' }
const ALL_COUNTRIES = Object.keys(FLAG)

function TerritoryModal({ territory, onSave, onClose }) {
  const [form, setForm] = useState(territory
    ? { name: territory.name, code: territory.code, countries: territory.countries, assignedTo: territory.assignedTo, quota: territory.quota }
    : { name: '', code: '', countries: [], assignedTo: '', quota: '' })
  const [saving, setSaving] = useState(false)

  function toggleCountry(c) {
    setForm(f => ({ ...f, countries: f.countries.includes(c) ? f.countries.filter(x => x !== c) : [...f.countries, c] }))
  }

  async function handleSave() {
    if (!form.name.trim() || form.countries.length === 0) return
    setSaving(true)
    await onSave({ ...form, quota: parseInt(form.quota) || 0 })
    setSaving(false)
  }

  const inp = { width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 10px', color: 'var(--text)', fontSize: 14, boxSizing: 'border-box' }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={onClose}>
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 28, maxWidth: 540, width: '100%', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 16 }}>{territory ? 'Edit Territory' : 'New Territory'}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text2)', fontSize: 20, cursor: 'pointer' }}>✕</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 2 }}>
              <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Territory Name *</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Central Europe" style={inp} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Code</label>
              <input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="e.g. CE" style={inp} maxLength={12} />
            </div>
          </div>
          <div>
            <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 8 }}>Countries * — tap to select</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {ALL_COUNTRIES.map(c => (
                <button key={c} onClick={() => toggleCountry(c)}
                  style={{ padding: '5px 10px', borderRadius: 6, border: `1px solid ${form.countries.includes(c) ? '#1d4ed8' : 'var(--border)'}`, background: form.countries.includes(c) ? '#1e3a5f' : 'var(--bg)', color: form.countries.includes(c) ? '#93c5fd' : 'var(--text)', cursor: 'pointer', fontSize: 13 }}>
                  {FLAG[c]} {c}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Assigned To (leader name / ID)</label>
            <input value={form.assignedTo} onChange={e => setForm(f => ({ ...f, assignedTo: e.target.value }))} placeholder="e.g. Mikael Lund (ID: 1042)" style={inp} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Member Quota</label>
            <input type="number" value={form.quota} onChange={e => setForm(f => ({ ...f, quota: e.target.value }))} placeholder="e.g. 2000" style={inp} min={0} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
          <button onClick={handleSave} disabled={saving || !form.name.trim() || form.countries.length === 0}
            style={{ flex: 1, background: 'var(--gold)', color: '#000', fontWeight: 700, border: 'none', borderRadius: 8, padding: '10px 0', cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
            {saving ? 'Saving…' : (territory ? 'Save Changes' : 'Create Territory')}
          </button>
          <button onClick={onClose} style={{ padding: '10px 20px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', cursor: 'pointer' }}>Cancel</button>
        </div>
      </div>
    </div>
  )
}

function MiniBar({ value, max }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0
  const color = pct >= 90 ? '#ef4444' : pct >= 60 ? '#f59e0b' : '#10b981'
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text2)', marginBottom: 3 }}>
        <span>{value.toLocaleString()} members</span>
        <span>{pct.toFixed(0)}% of quota</span>
      </div>
      <div style={{ height: 5, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3 }} />
      </div>
    </div>
  )
}

export default function Territories() {
  const [territories, setTerritories] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    getAdminTerritories().then(setTerritories).finally(() => setLoading(false))
  }, [])

  async function handleSave(form) {
    if (modal === 'new') {
      const n = await createAdminTerritory(form)
      setTerritories(p => [...p, n])
    } else {
      await updateAdminTerritory(modal.id, form)
      setTerritories(p => p.map(x => x.id === modal.id ? { ...x, ...form } : x))
    }
    setModal(null)
  }

  async function handleDelete(id) {
    setDeleting(id)
    await deleteAdminTerritory(id)
    setTerritories(p => p.filter(x => x.id !== id))
    setDeleting(null)
  }

  const visible = territories.filter(t => filter === 'all' || t.status === filter)
  const totalMembers = territories.reduce((s, t) => s + t.memberCount, 0)
  const totalRevenue = territories.reduce((s, t) => s + t.revenue, 0)

  return (
    <AdminLayout>
      {modal && (
        <TerritoryModal
          territory={modal === 'new' ? null : modal}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 22 }}>🗺️ Territories</div>
            <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 4 }}>Manage geographic regions and their assigned leaders.</div>
          </div>
          <button onClick={() => setModal('new')}
            style={{ background: 'var(--gold)', color: '#000', fontWeight: 700, border: 'none', borderRadius: 8, padding: '10px 20px', cursor: 'pointer', fontSize: 14 }}>
            + New Territory
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 12, marginBottom: 28 }}>
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 18px' }}>
            <div style={{ fontSize: 22, marginBottom: 6 }}>🗺️</div>
            <div style={{ fontWeight: 700, fontSize: 22 }}>{territories.length}</div>
            <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>Total Territories</div>
            <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>{territories.filter(t => t.status === 'active').length} active</div>
          </div>
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 18px' }}>
            <div style={{ fontSize: 22, marginBottom: 6 }}>👥</div>
            <div style={{ fontWeight: 700, fontSize: 22 }}>{totalMembers.toLocaleString()}</div>
            <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>Total Members</div>
            <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>across all regions</div>
          </div>
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 18px' }}>
            <div style={{ fontSize: 22, marginBottom: 6 }}>💰</div>
            <div style={{ fontWeight: 700, fontSize: 20 }}>NOK {(totalRevenue / 1_000_000).toFixed(1)}M</div>
            <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>Total Revenue</div>
            <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>all-time</div>
          </div>
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 18px' }}>
            <div style={{ fontSize: 22, marginBottom: 6 }}>📍</div>
            <div style={{ fontWeight: 700, fontSize: 22 }}>{territories.filter(t => t.status === 'open').length}</div>
            <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>Open Territories</div>
            <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>awaiting leaders</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {['all', 'active', 'open', 'pending'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ padding: '6px 16px', borderRadius: 20, border: '1px solid var(--border)', background: filter === f ? 'var(--gold)' : 'var(--bg)', color: filter === f ? '#000' : 'var(--text)', cursor: 'pointer', fontSize: 13, fontWeight: filter === f ? 700 : 400, textTransform: 'capitalize' }}>
              {f}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text2)' }}>Loading…</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {visible.map(t => {
              const ss = STATUS_STYLE[t.status] || STATUS_STYLE.open
              return (
                <div key={t.id} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '18px 20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                        <span style={{ fontWeight: 700, fontSize: 16 }}>{t.name}</span>
                        {t.code && <span style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--text2)', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 4, padding: '1px 6px' }}>{t.code}</span>}
                        <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: ss.bg, color: ss.color, border: `1px solid ${ss.border}`, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t.status}</span>
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 8 }}>
                        👤 {t.assignedTo}
                        {t.revenue > 0 && <span style={{ marginLeft: 16 }}>💰 NOK {t.revenue.toLocaleString()} revenue</span>}
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                        {t.countries.map(c => (
                          <span key={c} style={{ fontSize: 14 }} title={c}>{FLAG[c] || c}</span>
                        ))}
                        <span style={{ fontSize: 12, color: 'var(--text2)', marginLeft: 4 }}>{t.countries.join(', ')}</span>
                      </div>
                      {t.quota > 0 && <MiniBar value={t.memberCount} max={t.quota} />}
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                      <button onClick={() => setModal(t)}
                        style={{ padding: '7px 14px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text)', cursor: 'pointer', fontSize: 13 }}>
                        Edit
                      </button>
                      <button onClick={() => handleDelete(t.id)} disabled={deleting === t.id}
                        style={{ padding: '7px 14px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, color: '#ef4444', cursor: 'pointer', fontSize: 13 }}>
                        {deleting === t.id ? '…' : 'Delete'}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
            {visible.length === 0 && (
              <div style={{ textAlign: 'center', padding: 60, color: 'var(--text2)' }}>No territories match.</div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
