import { useState, useEffect } from 'react'
import AdminLayout from '../../components/AdminLayout'
import {
  getAdminApiKeys,
  getAdminApiKeyStats,
  getAdminApiKeyScopes,
  createAdminApiKey,
  revokeAdminApiKey,
  deleteAdminApiKey,
} from '../../api/mlmApi'

const STATUS_STYLE = {
  active:  { bg: '#052e16', color: '#86efac', border: '#166534' },
  revoked: { bg: '#1c1c1c', color: '#6b7280', border: '#404040' },
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

function CreateModal({ scopes, onSave, onClose }) {
  const [name, setName] = useState('')
  const [selectedScopes, setSelectedScopes] = useState([])
  const [saving, setSaving] = useState(false)
  const [newKey, setNewKey] = useState(null)
  const [copied, setCopied] = useState(false)

  function toggleScope(s) {
    setSelectedScopes(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s])
  }

  async function handleCreate() {
    if (!name.trim() || selectedScopes.length === 0) return
    setSaving(true)
    const k = await onSave({ name: name.trim(), scopes: selectedScopes })
    setNewKey(k._fullKey || k.preview)
    setSaving(false)
  }

  function copyKey() {
    navigator.clipboard.writeText(newKey).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
  }

  const inp = { width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 10px', color: 'var(--text)', fontSize: 14, boxSizing: 'border-box' }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={newKey ? onClose : undefined}>
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 28, maxWidth: 540, width: '100%', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 16 }}>{newKey ? 'Key Created — Save It Now' : 'Create API Key'}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text2)', fontSize: 20, cursor: 'pointer' }}>✕</button>
        </div>

        {newKey ? (
          <>
            <div style={{ background: '#052e16', border: '1px solid #166534', borderRadius: 8, padding: 16, marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: '#86efac', marginBottom: 8, fontWeight: 600 }}>⚠️ Copy this key now — it won't be shown again.</div>
              <div style={{ fontFamily: 'monospace', fontSize: 13, color: '#86efac', wordBreak: 'break-all', marginBottom: 10 }}>{newKey}</div>
              <button onClick={copyKey} style={{ background: copied ? '#166534' : 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, padding: '7px 14px', color: 'var(--text)', cursor: 'pointer', fontSize: 13 }}>
                {copied ? '✓ Copied' : 'Copy Key'}
              </button>
            </div>
            <button onClick={onClose} style={{ width: '100%', background: 'var(--gold)', color: '#000', fontWeight: 700, border: 'none', borderRadius: 8, padding: '10px 0', cursor: 'pointer' }}>Done</button>
          </>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Key Name *</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Mobile App Integration" style={inp} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 8 }}>Scopes * <span style={{ fontWeight: 400 }}>— select what this key can access</span></label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {scopes.map(s => (
                    <label key={s} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13, background: selectedScopes.includes(s) ? '#1e3a5f' : 'var(--bg)', border: `1px solid ${selectedScopes.includes(s) ? '#1d4ed8' : 'var(--border)'}`, borderRadius: 6, padding: '5px 10px', color: selectedScopes.includes(s) ? '#93c5fd' : 'var(--text)' }}>
                      <input type="checkbox" checked={selectedScopes.includes(s)} onChange={() => toggleScope(s)} style={{ display: 'none' }} />
                      {s}
                    </label>
                  ))}
                </div>
                {selectedScopes.length === 0 && <div style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>Select at least one scope.</div>}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
              <button onClick={handleCreate} disabled={saving || !name.trim() || selectedScopes.length === 0}
                style={{ flex: 1, background: 'var(--gold)', color: '#000', fontWeight: 700, border: 'none', borderRadius: 8, padding: '10px 0', cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
                {saving ? 'Creating…' : 'Create Key'}
              </button>
              <button onClick={onClose} style={{ padding: '10px 20px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', cursor: 'pointer' }}>Cancel</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function ApiKeys() {
  const [keys, setKeys] = useState([])
  const [stats, setStats] = useState(null)
  const [scopes, setScopes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [filter, setFilter] = useState('all')
  const [revoking, setRevoking] = useState(null)
  const [deleting, setDeleting] = useState(null)

  useEffect(() => {
    Promise.all([getAdminApiKeys(), getAdminApiKeyStats(), getAdminApiKeyScopes()])
      .then(([k, s, sc]) => { setKeys(k); setStats(s); setScopes(sc) })
      .finally(() => setLoading(false))
  }, [])

  async function handleCreate(data) {
    const n = await createAdminApiKey(data)
    setKeys(p => [n, ...p])
    return n
  }

  async function handleRevoke(id) {
    setRevoking(id)
    await revokeAdminApiKey(id)
    setKeys(p => p.map(x => x.id === id ? { ...x, status: 'revoked' } : x))
    setRevoking(null)
  }

  async function handleDelete(id) {
    setDeleting(id)
    await deleteAdminApiKey(id)
    setKeys(p => p.filter(x => x.id !== id))
    setDeleting(null)
  }

  const visible = keys.filter(k => filter === 'all' || k.status === filter)

  return (
    <AdminLayout>
      {showCreate && <CreateModal scopes={scopes} onSave={handleCreate} onClose={() => setShowCreate(false)} />}
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 22 }}>🔑 API Keys</div>
            <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 4 }}>Manage keys for third-party integrations and mobile apps.</div>
          </div>
          <button onClick={() => setShowCreate(true)}
            style={{ background: 'var(--gold)', color: '#000', fontWeight: 700, border: 'none', borderRadius: 8, padding: '10px 20px', cursor: 'pointer', fontSize: 14 }}>
            + Create Key
          </button>
        </div>

        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 12, marginBottom: 28 }}>
            <StatCard icon="🔑" label="Total Keys" value={stats.totalKeys} sub={`${stats.activeKeys} active`} />
            <StatCard icon="📞" label="API Calls This Month" value={stats.callsThisMonth.toLocaleString()} sub="across all keys" />
            <StatCard icon="🏆" label="Top Key" value={stats.topKey} sub="by call volume" />
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {['all', 'active', 'revoked'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ padding: '6px 16px', borderRadius: 20, border: '1px solid var(--border)', background: filter === f ? 'var(--gold)' : 'var(--bg)', color: filter === f ? '#000' : 'var(--text)', cursor: 'pointer', fontSize: 13, fontWeight: filter === f ? 700 : 400, textTransform: 'capitalize' }}>
              {f}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text2)' }}>Loading…</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {visible.map(k => {
              const ss = STATUS_STYLE[k.status] || STATUS_STYLE.revoked
              return (
                <div key={k.id} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <span style={{ fontWeight: 600, fontSize: 15 }}>{k.name}</span>
                        <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: ss.bg, color: ss.color, border: `1px solid ${ss.border}`, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{k.status}</span>
                      </div>
                      <div style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text2)', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 10px', display: 'inline-block', marginBottom: 8 }}>{k.preview}</div>
                      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 12, color: 'var(--text2)' }}>
                        <span>🗓️ Created {new Date(k.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        {k.lastUsedAt && <span>⏱️ Last used {new Date(k.lastUsedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>}
                        {k.callsThisMonth > 0 && <span>📞 {k.callsThisMonth.toLocaleString()} calls this month</span>}
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
                        {k.scopes.map(s => (
                          <span key={s} style={{ fontSize: 11, padding: '2px 8px', background: '#1e3a5f', color: '#93c5fd', border: '1px solid #1d4ed8', borderRadius: 99 }}>{s}</span>
                        ))}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                      {k.status === 'active' && (
                        <button onClick={() => handleRevoke(k.id)} disabled={revoking === k.id}
                          style={{ padding: '7px 14px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, color: '#f59e0b', cursor: 'pointer', fontSize: 13 }}>
                          {revoking === k.id ? '…' : 'Revoke'}
                        </button>
                      )}
                      <button onClick={() => handleDelete(k.id)} disabled={deleting === k.id}
                        style={{ padding: '7px 14px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, color: '#ef4444', cursor: 'pointer', fontSize: 13 }}>
                        {deleting === k.id ? '…' : 'Delete'}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
            {visible.length === 0 && (
              <div style={{ textAlign: 'center', padding: 60, color: 'var(--text2)' }}>No keys found.</div>
            )}
          </div>
        )}

        <div style={{ marginTop: 32, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 18px' }}>
          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>API Documentation</div>
          <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>
            Pass your key as <code style={{ fontFamily: 'monospace', background: 'var(--bg)', padding: '1px 5px', borderRadius: 4 }}>Authorization: Bearer &lt;key&gt;</code> on all requests to <code style={{ fontFamily: 'monospace', background: 'var(--bg)', padding: '1px 5px', borderRadius: 4 }}>https://arctico.duckdns.org/v1/mlm/</code>.
            Rate limit: 1 000 req/min per key. Contact support for higher limits.
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
