import { useState, useEffect } from 'react'
import AdminLayout from '../../components/AdminLayout'
import {
  getAdminInfluencers,
  getAdminInfluencerStats,
  getAdminInfluencerMeta,
  createAdminInfluencer,
  updateAdminInfluencer,
  deleteAdminInfluencer,
} from '../../api/mlmApi'

const TIER_STYLE = {
  micro:  { bg: '#1e3a5f', color: '#93c5fd', border: '#1d4ed8' },
  macro:  { bg: '#3b1f6e', color: '#c4b5fd', border: '#7c3aed' },
  mega:   { bg: '#422006', color: '#fcd34d', border: '#b45309' },
}
const STATUS_STYLE = {
  active:   { bg: '#052e16', color: '#86efac', border: '#166534' },
  pending:  { bg: '#422006', color: '#fcd34d', border: '#b45309' },
  inactive: { bg: '#1c1c1c', color: '#6b7280', border: '#404040' },
}

function StatCard({ icon, label, value, sub }) {
  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 18px' }}>
      <div style={{ fontSize: 22, marginBottom: 6 }}>{icon}</div>
      <div style={{ fontWeight: 700, fontSize: 22 }}>{value}</div>
      <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>{sub}</div>}
    </div>
  )
}

function InfluencerModal({ influencer, tiers, platforms, onSave, onClose }) {
  const editing = !!influencer
  const [form, setForm] = useState({
    name: influencer?.name || '',
    email: influencer?.email || '',
    tier: influencer?.tier || 'micro',
    platform: influencer?.platform || 'Instagram',
    handle: influencer?.handle || '',
    followers: influencer?.followers || '',
    engagementRate: influencer?.engagementRate || '',
    commissionRate: influencer?.commissionRate || 10,
  })
  const [saving, setSaving] = useState(false)

  const inp = { width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 10px', color: 'var(--text)', fontSize: 14, boxSizing: 'border-box' }
  const sel = { ...inp }

  function set(k, v) { setForm(p => ({ ...p, [k]: v })) }

  async function handleSave() {
    if (!form.name.trim() || !form.email.trim() || !form.handle.trim()) return
    setSaving(true)
    const data = { ...form, followers: Number(form.followers) || 0, engagementRate: Number(form.engagementRate) || 0, commissionRate: Number(form.commissionRate) || 10 }
    await onSave(data)
    setSaving(false)
    onClose()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={onClose}>
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 28, maxWidth: 520, width: '100%', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 16 }}>{editing ? 'Edit Influencer' : 'Add Influencer'}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text2)', fontSize: 20, cursor: 'pointer' }}>✕</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[['Name *', 'name', 'text', 'e.g. Sofia Berg'], ['Email *', 'email', 'email', 'influencer@example.com'], ['Handle *', 'handle', 'text', '@handle'], ['Followers', 'followers', 'number', '42000'], ['Engagement Rate (%)', 'engagementRate', 'number', '4.2']].map(([label, key, type, ph]) => (
            <div key={key}>
              <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>{label}</label>
              <input type={type} value={form[key]} onChange={e => set(key, e.target.value)} placeholder={ph} style={inp} />
            </div>
          ))}
          <div>
            <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Tier</label>
            <select value={form.tier} onChange={e => set('tier', e.target.value)} style={sel}>
              {tiers.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Platform</label>
            <select value={form.platform} onChange={e => set('platform', e.target.value)} style={sel}>
              {platforms.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Commission Rate (%)</label>
            <input type="number" min="1" max="30" value={form.commissionRate} onChange={e => set('commissionRate', e.target.value)} style={inp} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
          <button onClick={handleSave} disabled={saving || !form.name.trim() || !form.email.trim() || !form.handle.trim()}
            style={{ flex: 1, background: 'var(--gold)', color: '#000', fontWeight: 700, border: 'none', borderRadius: 8, padding: '10px 0', cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
            {saving ? 'Saving…' : editing ? 'Save Changes' : 'Add Influencer'}
          </button>
          <button onClick={onClose} style={{ padding: '10px 20px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', cursor: 'pointer' }}>Cancel</button>
        </div>
      </div>
    </div>
  )
}

export default function Influencers() {
  const [list, setList] = useState([])
  const [stats, setStats] = useState(null)
  const [meta, setMeta] = useState({ tiers: [], platforms: [] })
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null) // null | 'create' | influencer object
  const [filterTier, setFilterTier] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [deleting, setDeleting] = useState(null)

  useEffect(() => {
    Promise.all([getAdminInfluencers(), getAdminInfluencerStats(), getAdminInfluencerMeta()])
      .then(([l, s, m]) => { setList(l); setStats(s); setMeta(m) })
      .finally(() => setLoading(false))
  }, [])

  async function handleSave(data) {
    if (modal && modal !== 'create') {
      await updateAdminInfluencer(modal.id, data)
      setList(p => p.map(x => x.id === modal.id ? { ...x, ...data } : x))
    } else {
      const n = await createAdminInfluencer(data)
      setList(p => [n, ...p])
    }
  }

  async function handleDelete(id) {
    setDeleting(id)
    await deleteAdminInfluencer(id)
    setList(p => p.filter(x => x.id !== id))
    setDeleting(null)
  }

  async function handleActivate(inf) {
    await updateAdminInfluencer(inf.id, { status: 'active' })
    setList(p => p.map(x => x.id === inf.id ? { ...x, status: 'active' } : x))
  }

  const visible = list.filter(x =>
    (filterTier === 'all' || x.tier === filterTier) &&
    (filterStatus === 'all' || x.status === filterStatus)
  )

  return (
    <AdminLayout>
      {modal && (
        <InfluencerModal
          influencer={modal === 'create' ? null : modal}
          tiers={meta.tiers}
          platforms={meta.platforms}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 22 }}>📣 Influencer Program</div>
            <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 4 }}>Manage brand ambassadors, track reach, and approve content.</div>
          </div>
          <button onClick={() => setModal('create')}
            style={{ background: 'var(--gold)', color: '#000', fontWeight: 700, border: 'none', borderRadius: 8, padding: '10px 20px', cursor: 'pointer', fontSize: 14 }}>
            + Add Influencer
          </button>
        </div>

        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: 12, marginBottom: 28 }}>
            <StatCard icon="📣" label="Total Influencers" value={stats.total} sub={`${stats.active} active`} />
            <StatCard icon="👁️" label="Total Reach" value={`${stats.totalReachM.toFixed(2)}M`} sub="combined followers" />
            <StatCard icon="💬" label="Avg Engagement" value={`${stats.avgEngagement}%`} sub="across all tiers" />
            <StatCard icon="💰" label="Total Sales" value={`NOK ${(stats.totalSalesNok / 1000).toFixed(0)}K`} sub="attributed to influencers" />
            <StatCard icon="🧾" label="Commission Paid" value={`NOK ${(stats.totalCommissionPaidNok / 1000).toFixed(0)}K`} sub="year to date" />
          </div>
        )}

        <div style={{ display: 'flex', gap: 16, marginBottom: 18, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {['all', 'micro', 'macro', 'mega'].map(t => (
              <button key={t} onClick={() => setFilterTier(t)}
                style={{ padding: '5px 14px', borderRadius: 20, border: '1px solid var(--border)', background: filterTier === t ? 'var(--gold)' : 'var(--bg)', color: filterTier === t ? '#000' : 'var(--text)', cursor: 'pointer', fontSize: 12, fontWeight: filterTier === t ? 700 : 400, textTransform: 'capitalize' }}>
                {t}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {['all', 'active', 'pending', 'inactive'].map(s => (
              <button key={s} onClick={() => setFilterStatus(s)}
                style={{ padding: '5px 14px', borderRadius: 20, border: '1px solid var(--border)', background: filterStatus === s ? '#334155' : 'var(--bg)', color: filterStatus === s ? '#e2e8f0' : 'var(--text2)', cursor: 'pointer', fontSize: 12, fontWeight: filterStatus === s ? 700 : 400, textTransform: 'capitalize' }}>
                {s}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text2)' }}>Loading…</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {visible.map(inf => {
              const ts = TIER_STYLE[inf.tier] || TIER_STYLE.micro
              const ss = STATUS_STYLE[inf.status] || STATUS_STYLE.inactive
              return (
                <div key={inf.id} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                        <span style={{ fontWeight: 600, fontSize: 15 }}>{inf.name}</span>
                        <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: ts.bg, color: ts.color, border: `1px solid ${ts.border}`, textTransform: 'capitalize' }}>{inf.tier}</span>
                        <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: ss.bg, color: ss.color, border: `1px solid ${ss.border}`, textTransform: 'capitalize' }}>{inf.status}</span>
                        {inf.pendingPosts > 0 && <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: '#422006', color: '#fcd34d', border: '1px solid #b45309' }}>⏳ {inf.pendingPosts} pending post{inf.pendingPosts > 1 ? 's' : ''}</span>}
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 6 }}>
                        {inf.platform} · <span style={{ color: 'var(--text)' }}>{inf.handle}</span> · {inf.followers >= 1000 ? `${(inf.followers / 1000).toFixed(1)}K` : inf.followers} followers · {inf.engagementRate}% eng
                      </div>
                      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', fontSize: 12, color: 'var(--text2)' }}>
                        <span>💰 <strong style={{ color: 'var(--text)' }}>{inf.commissionRate}%</strong> commission</span>
                        <span>🛒 NOK {inf.totalSalesNok.toLocaleString()} attributed sales</span>
                        {inf.lastPostAt && <span>📅 Last post {new Date(inf.lastPostAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>}
                        {!inf.lastPostAt && <span style={{ color: '#f59e0b' }}>📅 No posts yet</span>}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 4 }}>{inf.email}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexShrink: 0, flexWrap: 'wrap' }}>
                      {inf.status === 'pending' && (
                        <button onClick={() => handleActivate(inf)}
                          style={{ padding: '7px 14px', background: '#052e16', border: '1px solid #166534', borderRadius: 6, color: '#86efac', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                          Approve
                        </button>
                      )}
                      <button onClick={() => setModal(inf)}
                        style={{ padding: '7px 14px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text)', cursor: 'pointer', fontSize: 12 }}>
                        Edit
                      </button>
                      <button onClick={() => handleDelete(inf.id)} disabled={deleting === inf.id}
                        style={{ padding: '7px 14px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, color: '#ef4444', cursor: 'pointer', fontSize: 12 }}>
                        {deleting === inf.id ? '…' : 'Remove'}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
            {visible.length === 0 && (
              <div style={{ textAlign: 'center', padding: 60, color: 'var(--text2)' }}>No influencers match the current filters.</div>
            )}
          </div>
        )}

        <div style={{ marginTop: 32, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 18px' }}>
          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>Tier Guide</div>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', fontSize: 12, color: 'var(--text2)', lineHeight: 1.6 }}>
            <span><strong style={{ color: '#93c5fd' }}>Micro</strong> — &lt;50K followers, highest engagement, niche audiences</span>
            <span><strong style={{ color: '#c4b5fd' }}>Macro</strong> — 50K–500K followers, broad reach, mid engagement</span>
            <span><strong style={{ color: '#fcd34d' }}>Mega</strong> — 500K+ followers, mass awareness, lower engagement rate</span>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
