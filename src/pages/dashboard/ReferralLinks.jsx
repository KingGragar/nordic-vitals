import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import {
  getMemberReferralLinks,
  getMemberReferralLinkStats,
  createMemberReferralLink,
  deleteMemberReferralLink,
} from '../../api/mlmApi'

function StatCard({ icon, label, value, sub, color }) {
  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 18px' }}>
      <div style={{ fontSize: 20, marginBottom: 6 }}>{icon}</div>
      <div style={{ fontWeight: 700, fontSize: 22, color: color || 'var(--text)' }}>{value}</div>
      <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>{sub}</div>}
    </div>
  )
}

function CreateModal({ onSave, onClose }) {
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function handleNameChange(val) {
    setName(val)
    setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''))
  }

  async function handleCreate() {
    if (!name.trim() || !slug.trim()) return
    setSaving(true)
    setError('')
    try {
      await onSave({ name: name.trim(), slug: slug.trim() })
    } catch {
      setError('That slug is already in use. Try a different one.')
      setSaving(false)
    }
  }

  const inp = { width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 10px', color: 'var(--text)', fontSize: 14, boxSizing: 'border-box' }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={onClose}>
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 28, maxWidth: 460, width: '100%' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 16 }}>Create Referral Link</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text2)', fontSize: 20, cursor: 'pointer' }}>✕</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Link Name *</label>
            <input value={name} onChange={e => handleNameChange(e.target.value)} placeholder="e.g. Instagram Bio" style={inp} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Custom Slug *</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 0, border: '1px solid var(--border)', borderRadius: 6, overflow: 'hidden' }}>
              <span style={{ padding: '8px 10px', background: 'var(--bg)', color: 'var(--text2)', fontSize: 13, borderRight: '1px solid var(--border)', whiteSpace: 'nowrap' }}>/ref/</span>
              <input value={slug} onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))} placeholder="ig-bio" style={{ ...inp, border: 'none', borderRadius: 0 }} />
            </div>
            <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 3 }}>Preview: nordic-vitals.vercel.app/ref/{slug || 'your-slug'}</div>
          </div>
          {error && <div style={{ fontSize: 12, color: '#ef4444' }}>{error}</div>}
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
          <button onClick={handleCreate} disabled={saving || !name.trim() || !slug.trim()}
            style={{ flex: 1, background: 'var(--gold)', color: '#000', fontWeight: 700, border: 'none', borderRadius: 8, padding: '10px 0', cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
            {saving ? 'Creating…' : 'Create Link'}
          </button>
          <button onClick={onClose} style={{ padding: '10px 20px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', cursor: 'pointer' }}>Cancel</button>
        </div>
      </div>
    </div>
  )
}

function MiniBar({ value, max, color }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0
  return (
    <div style={{ height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 2 }} />
    </div>
  )
}

export default function ReferralLinks() {
  const [links, setLinks] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [copied, setCopied] = useState(null)
  const [deleting, setDeleting] = useState(null)

  useEffect(() => {
    Promise.all([getMemberReferralLinks(), getMemberReferralLinkStats()])
      .then(([l, s]) => { setLinks(l); setStats(s) })
      .finally(() => setLoading(false))
  }, [])

  async function handleCreate(data) {
    const n = await createMemberReferralLink(data)
    setLinks(p => [n, ...p])
    setShowCreate(false)
  }

  async function handleDelete(id) {
    setDeleting(id)
    await deleteMemberReferralLink(id)
    setLinks(p => p.filter(x => x.id !== id))
    setDeleting(null)
  }

  function copyUrl(url, id) {
    navigator.clipboard.writeText(url).then(() => { setCopied(id); setTimeout(() => setCopied(null), 2000) })
  }

  const maxClicks = Math.max(...links.map(l => l.clicks), 1)

  return (
    <DashboardLayout>
      {showCreate && <CreateModal onSave={handleCreate} onClose={() => setShowCreate(false)} />}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 22 }}>🔗 My Referral Links</div>
            <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 4 }}>Create trackable links for each channel you promote on.</div>
          </div>
          <button onClick={() => setShowCreate(true)}
            style={{ background: 'var(--gold)', color: '#000', fontWeight: 700, border: 'none', borderRadius: 8, padding: '10px 20px', cursor: 'pointer', fontSize: 14 }}>
            + New Link
          </button>
        </div>

        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(140px,1fr))', gap: 12, marginBottom: 28 }}>
            <StatCard icon="👆" label="Total Clicks" value={stats.totalClicks.toLocaleString()} sub="all links" />
            <StatCard icon="✍️" label="Signups" value={stats.totalSignups.toLocaleString()} sub="from your links" />
            <StatCard icon="✅" label="Conversions" value={stats.totalConversions.toLocaleString()} sub={`${stats.conversionRate}% of signups`} color="var(--gold)" />
            <StatCard icon="💰" label="Revenue Generated" value={`NOK ${stats.totalRevenueNok.toLocaleString()}`} sub="from referrals" />
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text2)' }}>Loading…</div>
        ) : links.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔗</div>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>No referral links yet</div>
            <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 20 }}>Create a link for each channel — Instagram, email, TikTok — and track what converts.</div>
            <button onClick={() => setShowCreate(true)}
              style={{ background: 'var(--gold)', color: '#000', fontWeight: 700, border: 'none', borderRadius: 8, padding: '10px 24px', cursor: 'pointer' }}>
              Create Your First Link
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {links.map(l => {
              const convRate = l.signups > 0 ? ((l.conversions / l.signups) * 100).toFixed(0) : 0
              return (
                <div key={l.id} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '18px 20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>{l.name}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <code style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text2)', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 10px', wordBreak: 'break-all' }}>{l.url}</code>
                        <button onClick={() => copyUrl(l.url, l.id)}
                          style={{ padding: '5px 12px', background: copied === l.id ? '#052e16' : 'var(--bg)', border: `1px solid ${copied === l.id ? '#166534' : 'var(--border)'}`, borderRadius: 6, color: copied === l.id ? '#86efac' : 'var(--text)', cursor: 'pointer', fontSize: 12, whiteSpace: 'nowrap' }}>
                          {copied === l.id ? '✓ Copied' : 'Copy'}
                        </button>
                      </div>
                      {l.lastClickAt && (
                        <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 6 }}>
                          Last click {new Date(l.lastClickAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      )}
                    </div>
                    <button onClick={() => handleDelete(l.id)} disabled={deleting === l.id}
                      style={{ padding: '7px 14px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, color: '#ef4444', cursor: 'pointer', fontSize: 13, flexShrink: 0 }}>
                      {deleting === l.id ? '…' : 'Delete'}
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(100px,1fr))', gap: 12, marginBottom: 12 }}>
                    {[
                      { label: 'Clicks', val: l.clicks.toLocaleString(), color: '#6366f1' },
                      { label: 'Signups', val: l.signups.toLocaleString(), color: '#10b981' },
                      { label: 'Conversions', val: l.conversions.toLocaleString(), color: 'var(--gold)' },
                      { label: 'Revenue', val: `NOK ${l.revenueNok.toLocaleString()}`, color: '#f59e0b' },
                    ].map(({ label, val, color }) => (
                      <div key={label} style={{ textAlign: 'center', background: 'var(--bg)', borderRadius: 8, padding: '10px 8px' }}>
                        <div style={{ fontWeight: 700, fontSize: 16, color }}>{val}</div>
                        <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>{label}</div>
                      </div>
                    ))}
                  </div>

                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 4, display: 'flex', justifyContent: 'space-between' }}>
                      <span>Click share</span>
                      <span>{convRate}% signup-to-conversion</span>
                    </div>
                    <MiniBar value={l.clicks} max={maxClicks} color="#6366f1" />
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <div style={{ marginTop: 28, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 18px' }}>
          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>Tips for more conversions</div>
          <ul style={{ margin: 0, padding: '0 0 0 18px', fontSize: 13, color: 'var(--text2)', lineHeight: 1.8 }}>
            <li>Create one link per channel so you know exactly what converts best.</li>
            <li>Share your story — personal posts outperform promotional ones 3:1.</li>
            <li>Add the link to your Instagram bio, email signature, and WhatsApp status.</li>
            <li>Follow up with everyone who signs up within 48 hours.</li>
          </ul>
        </div>
      </div>
    </DashboardLayout>
  )
}
