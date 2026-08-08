import { useState, useEffect, useCallback } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { getAdminCustomerGroups, createAdminCustomerGroup, updateAdminCustomerGroup, deleteAdminCustomerGroup } from '../../api/mlmApi'

const BLANK = { name: '', description: '', priceMultiplier: '1.00', minOrderValue: '', welcomeEmail: true }

export default function AdminCustomerGroups() {
  const [groups, setGroups] = useState(null)
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(BLANK)
  const [saving, setSaving] = useState(false)
  const [expanded, setExpanded] = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    getAdminCustomerGroups().then(setGroups).finally(() => setLoading(false))
  }, [])
  useEffect(() => { load() }, [load])

  function openCreate() { setForm(BLANK); setModal('create') }
  function openEdit(g) { setForm({ name: g.name, description: g.description || '', priceMultiplier: String(g.priceMultiplier), minOrderValue: String(g.minOrderValue || ''), welcomeEmail: g.welcomeEmail }); setModal(g.id) }

  async function save() {
    setSaving(true)
    const payload = { ...form, priceMultiplier: parseFloat(form.priceMultiplier), minOrderValue: form.minOrderValue ? parseFloat(form.minOrderValue) : null }
    if (modal === 'create') {
      const created = await createAdminCustomerGroup(payload)
      setGroups(prev => [created, ...prev])
    } else {
      await updateAdminCustomerGroup(modal, payload)
      setGroups(prev => prev.map(g => g.id === modal ? { ...g, ...payload } : g))
    }
    setSaving(false)
    setModal(null)
  }

  async function del(id) {
    if (!confirm('Delete this group?')) return
    await deleteAdminCustomerGroup(id)
    setGroups(prev => prev.filter(g => g.id !== id))
  }

  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 18px' }
  const inp = { width: '100%', padding: '8px 12px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 14, boxSizing: 'border-box' }

  return (
    <AdminLayout>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 4 }}>👥 Customer Groups</div>
            <div style={{ color: 'var(--text2)', fontSize: 14 }}>Define pricing tiers and access rules for different customer segments.</div>
          </div>
          <button onClick={openCreate} style={{ padding: '8px 18px', borderRadius: 7, border: 'none', background: 'var(--gold)', color: '#000', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
            + New Group
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text2)' }}>Loading…</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {(groups || []).map(g => (
              <div key={g.id} style={card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: g.color || '#1e3a5f', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                      {g.icon || '👤'}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{g.name}</div>
                      <div style={{ color: 'var(--text2)', fontSize: 12 }}>{g.description}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap', fontSize: 13 }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontWeight: 700, color: g.priceMultiplier < 1 ? '#86efac' : g.priceMultiplier > 1 ? '#fca5a5' : 'var(--text)' }}>
                        {g.priceMultiplier < 1 ? `-${Math.round((1 - g.priceMultiplier) * 100)}%` : g.priceMultiplier === 1 ? 'Standard' : `+${Math.round((g.priceMultiplier - 1) * 100)}%`}
                      </div>
                      <div style={{ color: 'var(--text2)', fontSize: 11 }}>Pricing</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontWeight: 700 }}>{g.memberCount}</div>
                      <div style={{ color: 'var(--text2)', fontSize: 11 }}>Members</div>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => setExpanded(expanded === g.id ? null : g.id)} style={{ padding: '5px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)', fontSize: 12, cursor: 'pointer' }}>
                        {expanded === g.id ? 'Collapse' : 'Members'}
                      </button>
                      <button onClick={() => openEdit(g)} style={{ padding: '5px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)', fontSize: 12, cursor: 'pointer' }}>Edit</button>
                      <button onClick={() => del(g.id)} style={{ padding: '5px 12px', borderRadius: 6, border: '1px solid #991b1b', background: 'transparent', color: '#fca5a5', fontSize: 12, cursor: 'pointer' }}>Delete</button>
                    </div>
                  </div>
                </div>
                {expanded === g.id && g.members && (
                  <div style={{ marginTop: 14, borderTop: '1px solid var(--border)', paddingTop: 14 }}>
                    <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 8 }}>Group members ({g.members.length})</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {g.members.map(m => (
                        <span key={m.id} style={{ padding: '3px 10px', borderRadius: 12, border: '1px solid var(--border)', fontSize: 12 }}>{m.name}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {modal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 28, width: '100%', maxWidth: 460 }}>
              <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 20 }}>{modal === 'create' ? 'New Customer Group' : 'Edit Group'}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 5 }}>Group Name *</div>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={inp} placeholder="e.g. Wholesale" />
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 5 }}>Description</div>
                  <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} style={inp} placeholder="Short description" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 5 }}>Price Multiplier</div>
                    <input type="number" step="0.01" min="0" value={form.priceMultiplier} onChange={e => setForm(f => ({ ...f, priceMultiplier: e.target.value }))} style={inp} />
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 5 }}>Min Order Value</div>
                    <input type="number" step="0.01" min="0" value={form.minOrderValue} onChange={e => setForm(f => ({ ...f, minOrderValue: e.target.value }))} style={inp} placeholder="None" />
                  </div>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
                  <input type="checkbox" checked={form.welcomeEmail} onChange={e => setForm(f => ({ ...f, welcomeEmail: e.target.checked }))} />
                  Send welcome email on group assignment
                </label>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 22, justifyContent: 'flex-end' }}>
                <button onClick={() => setModal(null)} style={{ padding: '8px 18px', borderRadius: 7, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)', cursor: 'pointer' }}>Cancel</button>
                <button onClick={save} disabled={saving || !form.name} style={{ padding: '8px 18px', borderRadius: 7, border: 'none', background: 'var(--gold)', color: '#000', fontWeight: 700, cursor: saving ? 'wait' : 'pointer' }}>
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
