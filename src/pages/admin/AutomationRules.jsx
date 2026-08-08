import { useState, useEffect, useCallback } from 'react'
import AdminLayout from '../../components/AdminLayout'
import {
  getAdminAutomationRules, createAdminAutomationRule,
  toggleAdminAutomationRule, deleteAdminAutomationRule,
} from '../../api/mlmApi'

const TRIGGERS = ['Member registers', 'Rank promoted', 'Order completed', 'Commission paid', 'Subscription renewed', 'Birthday', 'Inactivity 30 days', 'First purchase']
const ACTIONS  = ['Send email', 'Send SMS', 'Award badge', 'Add loyalty points', 'Apply coupon', 'Add to segment', 'Notify admin', 'Trigger webhook']
const BLANK = { name: '', trigger: TRIGGERS[0], action: ACTIONS[0], delay: '0', condition: '' }

export default function AdminAutomationRules() {
  const [rules, setRules] = useState(null)
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(BLANK)
  const [saving, setSaving] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    getAdminAutomationRules().then(setRules).finally(() => setLoading(false))
  }, [])
  useEffect(() => { load() }, [load])

  async function handleCreate() {
    if (!form.name) return
    setSaving(true)
    const created = await createAdminAutomationRule(form)
    setRules(prev => [created, ...(prev || [])])
    setModal(false)
    setForm(BLANK)
    setSaving(false)
  }

  async function toggle(id, active) {
    await toggleAdminAutomationRule(id, !active)
    setRules(prev => prev.map(r => r.id === id ? { ...r, active: !active } : r))
  }

  async function remove(id) {
    await deleteAdminAutomationRule(id)
    setRules(prev => prev.filter(r => r.id !== id))
  }

  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 18px' }
  const active = (rules || []).filter(r => r.active).length
  const inactive = (rules || []).length - active

  return (
    <AdminLayout>
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 4 }}>⚡ Automation Rules</div>
            <div style={{ color: 'var(--text2)', fontSize: 14 }}>Define trigger → action workflows that fire automatically.</div>
          </div>
          <button onClick={() => { setForm(BLANK); setModal(true) }} style={{ padding: '9px 20px', borderRadius: 8, border: 'none', background: 'var(--gold)', color: '#000', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
            + New Rule
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12, marginBottom: 22 }}>
          {[
            { label: 'Total Rules', value: (rules || []).length, color: 'var(--text)' },
            { label: 'Active', value: active, color: '#86efac' },
            { label: 'Inactive', value: inactive, color: '#94a3b8' },
          ].map(s => (
            <div key={s.label} style={card}>
              <div style={{ fontSize: 26, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text2)' }}>Loading…</div>
        ) : !rules?.length ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text2)' }}>No automation rules yet. Create your first rule.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {rules.map(r => (
              <div key={r.id} style={{ ...card, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                <div style={{ width: 38, height: 22, borderRadius: 11, background: r.active ? '#166534' : '#334155', position: 'relative', cursor: 'pointer', flexShrink: 0, transition: 'background 0.2s' }} onClick={() => toggle(r.id, r.active)}>
                  <div style={{ position: 'absolute', top: 3, left: r.active ? 18 : 3, width: 16, height: 16, borderRadius: '50%', background: r.active ? '#86efac' : '#94a3b8', transition: 'left 0.2s' }} />
                </div>
                <div style={{ flex: '1 1 200px' }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{r.name}</div>
                  <div style={{ color: 'var(--text2)', fontSize: 12, marginTop: 2 }}>
                    <span style={{ color: '#60a5fa' }}>When:</span> {r.trigger} &nbsp;→&nbsp; <span style={{ color: '#86efac' }}>Then:</span> {r.action}
                    {r.delay && r.delay !== '0' ? <span style={{ marginLeft: 8, color: 'var(--text2)' }}>· Delay: {r.delay}h</span> : null}
                  </div>
                </div>
                <div style={{ textAlign: 'right', minWidth: 80 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{r.runCount?.toLocaleString() || 0}</div>
                  <div style={{ fontSize: 11, color: 'var(--text2)' }}>Runs</div>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text2)', minWidth: 100 }}>Last: {r.lastRun || 'Never'}</div>
                <button onClick={() => remove(r.id)} style={{ padding: '5px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text2)', fontSize: 12, cursor: 'pointer' }}>Delete</button>
              </div>
            ))}
          </div>
        )}

        {modal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: 20 }}>
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 28, width: '100%', maxWidth: 480 }}>
              <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 20 }}>New Automation Rule</div>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 4 }}>Rule Name</div>
                <input value={form.name} placeholder="e.g. Welcome email on signup" onChange={e => setForm(p => ({ ...p, name: e.target.value }))} style={{ width: '100%', padding: '8px 12px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 14, boxSizing: 'border-box' }} />
              </div>
              {[
                { label: 'Trigger', key: 'trigger', options: TRIGGERS },
                { label: 'Action', key: 'action', options: ACTIONS },
              ].map(f => (
                <div key={f.key} style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 4 }}>{f.label}</div>
                  <select value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} style={{ width: '100%', padding: '8px 12px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 14, boxSizing: 'border-box' }}>
                    {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              ))}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 4 }}>Delay (hours, 0 = immediate)</div>
                <input type="number" min="0" value={form.delay} onChange={e => setForm(p => ({ ...p, delay: e.target.value }))} style={{ width: '100%', padding: '8px 12px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 14, boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button onClick={handleCreate} disabled={saving || !form.name} style={{ flex: 1, padding: '10px 0', borderRadius: 8, border: 'none', background: 'var(--gold)', color: '#000', fontWeight: 700, fontSize: 14, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
                  {saving ? 'Creating…' : 'Create Rule'}
                </button>
                <button onClick={() => setModal(false)} style={{ padding: '10px 18px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)', fontSize: 14, cursor: 'pointer' }}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
