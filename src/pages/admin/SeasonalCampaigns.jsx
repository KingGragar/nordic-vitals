import { useState, useEffect, useCallback } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { getAdminSeasonalCampaigns, createAdminSeasonalCampaign, updateAdminSeasonalCampaign, deleteAdminSeasonalCampaign } from '../../api/mlmApi'

const STATUS_STYLE = {
  draft:     { bg: '#1c1c1c', color: '#9ca3af', border: '#374151', label: 'Draft' },
  scheduled: { bg: '#1e3a5f', color: '#93c5fd', border: '#1d4ed8', label: 'Scheduled' },
  active:    { bg: '#052e16', color: '#86efac', border: '#166534', label: 'Active' },
  completed: { bg: '#2d1b00', color: '#9ca3af', border: '#374151', label: 'Completed' },
}
const SEASON_ICON = { spring: '🌸', summer: '☀️', autumn: '🍂', winter: '❄️' }
const AUDIENCE_LABEL = { all: 'All Customers', members: 'Members Only', vip: 'VIP Members' }

function CampaignModal({ campaign, onSave, onClose }) {
  const editing = !!campaign
  const [form, setForm] = useState({
    name: campaign?.name || '',
    season: campaign?.season || 'summer',
    startsAt: campaign?.startsAt?.slice(0, 16) || '',
    endsAt: campaign?.endsAt?.slice(0, 16) || '',
    discountPct: campaign?.discountPct || 15,
    targetAudience: campaign?.targetAudience || 'all',
    promoCode: campaign?.promoCode || '',
    status: campaign?.status || 'draft',
  })
  const [saving, setSaving] = useState(false)
  const inp = { width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 10px', color: 'var(--text)', fontSize: 14, boxSizing: 'border-box' }
  function set(k, v) { setForm(p => ({ ...p, [k]: v })) }

  async function handleSave() {
    if (!form.name.trim() || !form.startsAt || !form.endsAt || !form.promoCode.trim()) return
    setSaving(true)
    await onSave(form)
    setSaving(false)
    onClose()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={onClose}>
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 28, maxWidth: 520, width: '100%', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 16 }}>{editing ? 'Edit Campaign' : 'New Seasonal Campaign'}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text2)', fontSize: 20, cursor: 'pointer' }}>✕</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Campaign Name *</label>
            <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Arctic Winter Warrior" style={inp} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Season</label>
              <select value={form.season} onChange={e => set('season', e.target.value)} style={inp}>
                {['spring', 'summer', 'autumn', 'winter'].map(s => <option key={s} value={s}>{SEASON_ICON[s]} {s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Status</label>
              <select value={form.status} onChange={e => set('status', e.target.value)} style={inp}>
                {Object.entries(STATUS_STYLE).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Starts At *</label>
              <input type="datetime-local" value={form.startsAt} onChange={e => set('startsAt', e.target.value)} style={inp} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Ends At *</label>
              <input type="datetime-local" value={form.endsAt} onChange={e => set('endsAt', e.target.value)} style={inp} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Discount %</label>
              <input type="number" min="1" max="100" value={form.discountPct} onChange={e => set('discountPct', e.target.value)} style={inp} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Target Audience</label>
              <select value={form.targetAudience} onChange={e => set('targetAudience', e.target.value)} style={inp}>
                {Object.entries(AUDIENCE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Promo Code *</label>
            <input value={form.promoCode} onChange={e => set('promoCode', e.target.value.toUpperCase())} placeholder="e.g. SUMMER25" style={inp} />
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button onClick={onClose} style={{ flex: 1, padding: '10px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', cursor: 'pointer' }}>Cancel</button>
            <button onClick={handleSave} disabled={saving} style={{ flex: 2, padding: '10px', background: '#b45309', border: 'none', borderRadius: 8, color: '#fff', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Saving…' : editing ? 'Save Changes' : 'Create Campaign'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function daysUntil(dateStr) {
  const diff = new Date(dateStr) - Date.now()
  return Math.ceil(diff / 86400000)
}

export default function AdminSeasonalCampaigns() {
  const [campaigns, setCampaigns] = useState(null)
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [filter, setFilter] = useState('all')

  const load = useCallback(() => {
    setLoading(true)
    getAdminSeasonalCampaigns().then(setCampaigns).finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  async function handleSave(form) {
    if (modal === 'new') {
      const created = await createAdminSeasonalCampaign(form)
      setCampaigns(prev => [created, ...prev])
    } else {
      const updated = await updateAdminSeasonalCampaign(modal.id, form)
      setCampaigns(prev => prev.map(c => c.id === modal.id ? { ...c, ...updated } : c))
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this campaign?')) return
    await deleteAdminSeasonalCampaign(id)
    setCampaigns(prev => prev.filter(c => c.id !== id))
  }

  const filtered = !campaigns ? [] : filter === 'all' ? campaigns : campaigns.filter(c => c.status === filter || c.season === filter)
  const totalRevenue = (campaigns || []).filter(c => c.status === 'completed').reduce((s, c) => s + c.revenue, 0)
  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 18px' }

  return (
    <AdminLayout>
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 4 }}>🌸 Seasonal Campaigns</div>
            <div style={{ color: 'var(--text2)', fontSize: 14 }}>Plan and manage seasonal promotions with promo codes and audience targeting.</div>
          </div>
          <button onClick={() => setModal('new')} style={{ padding: '10px 18px', background: '#b45309', border: 'none', borderRadius: 8, color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
            + New Campaign
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 22 }}>
          {[
            { label: 'Total Campaigns', value: (campaigns || []).length },
            { label: 'Scheduled', value: (campaigns || []).filter(c => c.status === 'scheduled').length },
            { label: 'Revenue Generated', value: `NOK ${totalRevenue.toLocaleString()}` },
          ].map(s => (
            <div key={s.label} style={card}>
              <div style={{ fontSize: 20, fontWeight: 800 }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filter */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
          {['all', 'draft', 'scheduled', 'active', 'completed'].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ padding: '6px 14px', borderRadius: 20, border: '1px solid var(--border)', background: filter === f ? 'var(--gold)' : 'var(--card)', color: filter === f ? '#000' : 'var(--text)', fontSize: 13, cursor: 'pointer', fontWeight: filter === f ? 700 : 400 }}>
              {f === 'all' ? 'All' : STATUS_STYLE[f]?.label || f}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text2)' }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text2)' }}>No campaigns found.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map(c => {
              const st = STATUS_STYLE[c.status] || STATUS_STYLE.draft
              const daysTo = daysUntil(c.startsAt)
              const daysFrom = daysUntil(c.endsAt)
              return (
                <div key={c.id} style={{ ...card, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 28, flexShrink: 0 }}>{SEASON_ICON[c.season]}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 3 }}>{c.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text2)', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                      <span>📅 {new Date(c.startsAt).toLocaleDateString()} – {new Date(c.endsAt).toLocaleDateString()}</span>
                      <span>🎯 {AUDIENCE_LABEL[c.targetAudience]}</span>
                      <span>🏷️ Code: <code style={{ background: 'var(--bg)', padding: '1px 5px', borderRadius: 4, fontSize: 11 }}>{c.promoCode}</code></span>
                      {c.status === 'scheduled' && daysTo > 0 && <span style={{ color: '#93c5fd' }}>Starts in {daysTo}d</span>}
                      {c.status === 'active' && daysFrom > 0 && <span style={{ color: '#86efac' }}>Ends in {daysFrom}d</span>}
                      {c.status === 'completed' && c.revenue > 0 && <span style={{ color: '#fbbf24' }}>Revenue: NOK {c.revenue.toLocaleString()}</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                    <div style={{ textAlign: 'right', marginRight: 4 }}>
                      <div style={{ fontWeight: 800, fontSize: 18 }}>{c.discountPct}%</div>
                      <div style={{ fontSize: 11, color: 'var(--text2)' }}>discount</div>
                    </div>
                    <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: st.bg, color: st.color, border: `1px solid ${st.border}` }}>{st.label}</span>
                    <button onClick={() => setModal(c)} style={{ padding: '6px 12px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text)', fontSize: 12, cursor: 'pointer' }}>Edit</button>
                    <button onClick={() => handleDelete(c.id)} style={{ padding: '6px 12px', background: 'none', border: '1px solid #7f1d1d', borderRadius: 6, color: '#f87171', fontSize: 12, cursor: 'pointer' }}>Delete</button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {modal && (
        <CampaignModal
          campaign={modal === 'new' ? null : modal}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
    </AdminLayout>
  )
}
