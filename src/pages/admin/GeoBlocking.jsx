import { useState, useEffect, useCallback } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { getAdminGeoBlocking, createAdminGeoRule, updateAdminGeoRule, deleteAdminGeoRule } from '../../api/mlmApi'

const STATUS_COLOR = { allowed: '#86efac', blocked: '#f87171', restricted: '#fbbf24' }
const STATUS_BG    = { allowed: '#14532d', blocked: '#7f1d1d', restricted: '#78350f' }
const SCOPES = ['all', 'membership', 'purchasing', 'affiliate']
const STATUSES = ['allowed', 'restricted', 'blocked']
const BLANK = { country: '', code: '', flag: '🏳️', scope: 'all', status: 'allowed', reason: '' }

export default function AdminGeoBlocking() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(BLANK)
  const [saving, setSaving] = useState(false)
  const [editId, setEditId] = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    getAdminGeoBlocking().then(setData).finally(() => setLoading(false))
  }, [])
  useEffect(() => { load() }, [load])

  async function handleSave() {
    if (!form.country || !form.code) return
    setSaving(true)
    if (editId) {
      await updateAdminGeoRule(editId, form)
      setData(prev => ({ ...prev, rules: prev.rules.map(r => r.id === editId ? { ...r, ...form } : r) }))
    } else {
      const created = await createAdminGeoRule(form)
      setData(prev => ({ ...prev, rules: [created, ...(prev?.rules || [])] }))
    }
    setModal(false)
    setForm(BLANK)
    setEditId(null)
    setSaving(false)
  }

  async function handleDelete(id) {
    await deleteAdminGeoRule(id)
    setData(prev => ({ ...prev, rules: prev.rules.filter(r => r.id !== id) }))
  }

  function openEdit(rule) {
    setForm({ country: rule.country, code: rule.code, flag: rule.flag, scope: rule.scope, status: rule.status, reason: rule.reason || '' })
    setEditId(rule.id)
    setModal(true)
  }

  const rules = data?.rules || []
  const filtered = filter === 'all' ? rules : rules.filter(r => r.status === filter)
  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 18px' }

  const stats = [
    { label: 'Total Rules', value: rules.length, color: 'var(--text)' },
    { label: 'Allowed', value: rules.filter(r => r.status === 'allowed').length, color: '#86efac' },
    { label: 'Restricted', value: rules.filter(r => r.status === 'restricted').length, color: '#fbbf24' },
    { label: 'Blocked', value: rules.filter(r => r.status === 'blocked').length, color: '#f87171' },
  ]

  const inp = { width: '100%', padding: '8px 12px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 14, boxSizing: 'border-box' }

  return (
    <AdminLayout>
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 4 }}>🌍 Geo Blocking</div>
            <div style={{ color: 'var(--text2)', fontSize: 14 }}>Control access by country — membership, purchasing, and affiliate scopes.</div>
          </div>
          <button onClick={() => { setForm(BLANK); setEditId(null); setModal(true) }} style={{ padding: '9px 20px', borderRadius: 8, border: 'none', background: 'var(--gold)', color: '#000', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
            + Add Country Rule
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12, marginBottom: 22 }}>
          {stats.map(s => (
            <div key={s.label} style={card}>
              <div style={{ fontSize: 26, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
          {['all', 'allowed', 'restricted', 'blocked'].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ padding: '6px 16px', borderRadius: 20, border: '1px solid var(--border)', background: filter === f ? 'var(--gold)' : 'transparent', color: filter === f ? '#000' : 'var(--text)', fontSize: 13, cursor: 'pointer', fontWeight: filter === f ? 700 : 400, textTransform: 'capitalize' }}>
              {f}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text2)' }}>Loading…</div>
        ) : !filtered.length ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text2)' }}>No rules found.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map(r => (
              <div key={r.id} style={{ ...card, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 28 }}>{r.flag}</span>
                <div style={{ flex: '1 1 180px' }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{r.country} <span style={{ color: 'var(--text2)', fontWeight: 400, fontSize: 12 }}>({r.code})</span></div>
                  {r.reason && <div style={{ color: 'var(--text2)', fontSize: 12, marginTop: 2 }}>{r.reason}</div>}
                </div>
                <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: STATUS_BG[r.status], color: STATUS_COLOR[r.status], textTransform: 'capitalize' }}>{r.status}</span>
                <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, background: 'var(--bg)', color: 'var(--text2)', border: '1px solid var(--border)', textTransform: 'capitalize' }}>{r.scope}</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => openEdit(r)} style={{ padding: '5px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text2)', fontSize: 12, cursor: 'pointer' }}>Edit</button>
                  <button onClick={() => handleDelete(r.id)} style={{ padding: '5px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', color: '#f87171', fontSize: 12, cursor: 'pointer' }}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {modal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: 20 }}>
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 28, width: '100%', maxWidth: 460 }}>
              <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 20 }}>{editId ? 'Edit Country Rule' : 'Add Country Rule'}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 60px', gap: 10, marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 4 }}>Country Name</div>
                  <input value={form.country} placeholder="e.g. Germany" onChange={e => setForm(p => ({ ...p, country: e.target.value }))} style={inp} />
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 4 }}>Code</div>
                  <input value={form.code} placeholder="DE" maxLength={2} onChange={e => setForm(p => ({ ...p, code: e.target.value.toUpperCase() }))} style={inp} />
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 4 }}>Flag</div>
                  <input value={form.flag} onChange={e => setForm(p => ({ ...p, flag: e.target.value }))} style={inp} />
                </div>
              </div>
              {[
                { label: 'Scope', key: 'scope', options: SCOPES },
                { label: 'Status', key: 'status', options: STATUSES },
              ].map(f => (
                <div key={f.key} style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 4 }}>{f.label}</div>
                  <select value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} style={inp}>
                    {f.options.map(o => <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>)}
                  </select>
                </div>
              ))}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 4 }}>Reason (internal note)</div>
                <input value={form.reason} placeholder="e.g. Sanctions compliance" onChange={e => setForm(p => ({ ...p, reason: e.target.value }))} style={inp} />
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button onClick={handleSave} disabled={saving || !form.country || !form.code} style={{ flex: 1, padding: '10px 0', borderRadius: 8, border: 'none', background: 'var(--gold)', color: '#000', fontWeight: 700, fontSize: 14, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
                  {saving ? 'Saving…' : editId ? 'Update Rule' : 'Add Rule'}
                </button>
                <button onClick={() => { setModal(false); setEditId(null) }} style={{ padding: '10px 18px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)', fontSize: 14, cursor: 'pointer' }}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
