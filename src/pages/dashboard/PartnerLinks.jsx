import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { getMemberPartnerLinks, createMemberPartnerLink, deleteMemberPartnerLink } from '../../api/mlmApi'

function NewLinkModal({ onSave, onClose }) {
  const [label, setLabel] = useState('')
  const [saving, setSaving] = useState(false)
  const inp = { width: '100%', padding: '8px 10px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 7, color: 'var(--text)', fontSize: 13, boxSizing: 'border-box' }

  async function submit(e) {
    e.preventDefault()
    if (!label.trim()) return
    setSaving(true)
    await onSave({ label })
    setSaving(false)
    onClose()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={onClose}>
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 28, maxWidth: 440, width: '100%' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 16 }}>New Partner Link</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text2)', fontSize: 20, cursor: 'pointer' }}>✕</button>
        </div>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 4, display: 'block' }}>Link Label</label>
            <input value={label} onChange={e => setLabel(e.target.value)} required style={inp} placeholder="e.g. Gym chain pitch, Corporate wellness…" />
          </div>
          <div style={{ fontSize: 12, color: 'var(--text2)', background: 'var(--bg)', borderRadius: 7, padding: 10 }}>
            A unique partner URL will be generated with your account linked.
          </div>
          <button type="submit" disabled={saving} style={{ padding: 10, background: 'var(--gold)', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Creating…' : 'Create Link'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function PartnerLinks() {
  const [links, setLinks] = useState(null)
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [copied, setCopied] = useState(null)

  useEffect(() => {
    getMemberPartnerLinks().then(setLinks).finally(() => setLoading(false))
  }, [])

  async function handleCreate(payload) {
    const created = await createMemberPartnerLink(payload)
    setLinks(l => [created, ...(l || [])])
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this partner link?')) return
    await deleteMemberPartnerLink(id)
    setLinks(l => l.filter(x => x.id !== id))
  }

  function copyUrl(url, id) {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(id)
      setTimeout(() => setCopied(null), 2000)
    })
  }

  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 18px' }
  const totals = {
    clicks: (links || []).reduce((s, l) => s + l.clicks, 0),
    conversions: (links || []).reduce((s, l) => s + l.conversions, 0),
  }

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 4 }}>🔗 Partner Links</div>
            <div style={{ color: 'var(--text2)', fontSize: 14 }}>B2B referral links for gyms, clinics, and corporate wellness programmes.</div>
          </div>
          <button onClick={() => setModal(true)} style={{ padding: '9px 18px', background: 'var(--gold)', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
            + New Link
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12, marginBottom: 22 }}>
          {[
            { label: 'Total Links', value: (links || []).length },
            { label: 'Total Clicks', value: totals.clicks },
            { label: 'Conversions', value: totals.conversions },
          ].map(s => (
            <div key={s.label} style={card}>
              <div style={{ fontSize: 22, fontWeight: 800 }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text2)' }}>Loading…</div>
        ) : !links || links.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text2)' }}>No partner links yet. Create your first one.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {links.map(link => (
              <div key={link.id} style={card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, flexWrap: 'wrap' }}>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{link.label}</div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => copyUrl(link.url, link.id)} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', color: copied === link.id ? '#86efac' : 'var(--text)', fontSize: 12, cursor: 'pointer' }}>
                      {copied === link.id ? '✓ Copied' : 'Copy URL'}
                    </button>
                    <button onClick={() => handleDelete(link.id)} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #991b1b', background: 'transparent', color: '#fca5a5', fontSize: 12, cursor: 'pointer' }}>
                      Delete
                    </button>
                  </div>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 4, wordBreak: 'break-all' }}>{link.url}</div>
                <div style={{ display: 'flex', gap: 20, marginTop: 12, fontSize: 13 }}>
                  <div><span style={{ color: 'var(--text2)' }}>Clicks:</span> <strong>{link.clicks}</strong></div>
                  <div><span style={{ color: 'var(--text2)' }}>Conversions:</span> <strong>{link.conversions}</strong></div>
                  <div><span style={{ color: 'var(--text2)' }}>Revenue:</span> <strong style={{ color: '#86efac' }}>{link.revenue}</strong></div>
                  <div style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text2)' }}>Created {link.createdAt}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {modal && <NewLinkModal onSave={handleCreate} onClose={() => setModal(false)} />}
    </DashboardLayout>
  )
}
