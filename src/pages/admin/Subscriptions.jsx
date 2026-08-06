import { useState, useEffect, useCallback } from 'react'
import AdminLayout from '../../components/AdminLayout'
import {
  getSubscriptionPlans, createSubscriptionPlan, updateSubscriptionPlan, deleteSubscriptionPlan,
  getMemberSubscriptions, assignMemberPlan, cancelMemberSubscription,
} from '../../api/mlmApi'

const NOK = v => 'NOK ' + Number(v).toLocaleString('nb-NO', { maximumFractionDigits: 0 })

const STATUS_META = {
  active:    { label: 'Active',    color: '#34d399', bg: 'rgba(52,211,153,0.12)'  },
  past_due:  { label: 'Past Due',  color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  cancelled: { label: 'Cancelled', color: '#f87171', bg: 'rgba(248,113,113,0.12)' },
  paused:    { label: 'Paused',    color: '#94a3b8', bg: 'rgba(148,163,184,0.12)' },
}

const PLAN_COLORS = ['#10b981', '#3b82f6', '#c9a84c', '#a855f7', '#f43f5e', '#06b6d4']
const PLAN_ICONS  = ['🌱', '⚡', '👑', '🚀', '💎', '🔥']
const RANKS       = ['Bronze', 'Silver', 'Gold', 'Platinum']

function KpiCard({ label, value, sub, color }) {
  return (
    <div style={{ background: 'var(--navy2)', borderRadius: 10, padding: '16px 20px' }}>
      <div style={{ fontSize: 11, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: color || 'var(--cream)', lineHeight: 1.2 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{sub}</div>}
    </div>
  )
}

function Badge({ status }) {
  const m = STATUS_META[status] || STATUS_META.active
  return (
    <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700, color: m.color, background: m.bg }}>
      {m.label.toUpperCase()}
    </span>
  )
}

function Toggle({ checked, onChange }) {
  return (
    <button onClick={() => onChange(!checked)} style={{
      width: 42, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', padding: 0,
      background: checked ? 'var(--gold)' : 'var(--navy3)', position: 'relative', transition: 'background 0.2s',
    }}>
      <span style={{
        position: 'absolute', top: 3, left: checked ? 21 : 3, width: 18, height: 18,
        borderRadius: '50%', background: '#fff', transition: 'left 0.2s', display: 'block',
      }} />
    </button>
  )
}

function Field({ label, hint, children }) {
  return (
    <label style={{ display: 'block', marginBottom: 14 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 5 }}>{label}</div>
      {children}
      {hint && <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 3 }}>{hint}</div>}
    </label>
  )
}

const BLANK_PLAN = { name: '', description: '', icon: '🌱', color: '#10b981', monthlyPrice: 99, annualPrice: 990, pvIncluded: 0, rankRequired: '', isDefault: false, status: 'active', features: [''] }

function PlanModal({ plan, onSave, onClose }) {
  const [form, setForm] = useState(plan
    ? { ...plan, features: plan.features?.length ? [...plan.features] : [''], rankRequired: plan.rankRequired || '' }
    : { ...BLANK_PLAN }
  )
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  function setF(patch) { setForm(f => ({ ...f, ...patch })) }
  function setFeature(i, v) { setForm(f => { const fs = [...f.features]; fs[i] = v; return { ...f, features: fs } }) }
  function addFeature() { setForm(f => ({ ...f, features: [...f.features, ''] })) }
  function removeFeature(i) { setForm(f => ({ ...f, features: f.features.filter((_, j) => j !== i) })) }

  async function handleSave() {
    if (!form.name.trim()) return setErr('Plan name is required')
    if (form.monthlyPrice < 0) return setErr('Monthly price cannot be negative')
    setErr('')
    setSaving(true)
    const data = { ...form, features: form.features.filter(f => f.trim()), rankRequired: form.rankRequired || null }
    try { await onSave(data) } finally { setSaving(false) }
  }

  const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 200, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 16px', overflowY: 'auto' }
  const box = { background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: 16, padding: 28, width: '100%', maxWidth: 520 }

  return (
    <div style={overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={box}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ color: 'var(--cream)', fontSize: 17, fontWeight: 700, margin: 0 }}>
            {plan ? 'Edit Plan' : 'New Subscription Plan'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text2)', fontSize: 22, cursor: 'pointer' }}>×</button>
        </div>

        {/* Icon + Color pickers */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
          <Field label="Icon">
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {PLAN_ICONS.map(ic => (
                <button key={ic} onClick={() => setF({ icon: ic })} style={{
                  width: 36, height: 36, borderRadius: 8, border: form.icon === ic ? '2px solid var(--gold)' : '1px solid var(--border)',
                  background: 'var(--navy3)', cursor: 'pointer', fontSize: 18,
                }}>{ic}</button>
              ))}
            </div>
          </Field>
          <Field label="Colour">
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {PLAN_COLORS.map(c => (
                <button key={c} onClick={() => setF({ color: c })} style={{
                  width: 28, height: 28, borderRadius: '50%', background: c, cursor: 'pointer',
                  border: form.color === c ? '3px solid var(--cream)' : '2px solid transparent',
                }} />
              ))}
            </div>
          </Field>
        </div>

        <Field label="Plan Name *">
          <input className="input" value={form.name} placeholder="e.g. Pro" onChange={e => setF({ name: e.target.value })} />
        </Field>

        <Field label="Description" hint="Short tagline shown to members">
          <input className="input" value={form.description} placeholder="For active builders ready to grow" onChange={e => setF({ description: e.target.value })} />
        </Field>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Monthly Price (NOK)" hint="Billed each month">
            <input className="input" type="number" min="0" step="1" value={form.monthlyPrice}
              onChange={e => setF({ monthlyPrice: parseFloat(e.target.value) || 0 })} />
          </Field>
          <Field label="Annual Price (NOK)" hint="Billed once per year">
            <input className="input" type="number" min="0" step="1" value={form.annualPrice}
              onChange={e => setF({ annualPrice: parseFloat(e.target.value) || 0 })} />
          </Field>
        </div>

        {form.monthlyPrice > 0 && form.annualPrice > 0 && (
          <div style={{ fontSize: 12, color: '#34d399', marginTop: -8, marginBottom: 12 }}>
            Annual saves {Math.round((1 - form.annualPrice / (form.monthlyPrice * 12)) * 100)}% vs monthly
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="PV Included / Month" hint="Personal volume credited automatically">
            <input className="input" type="number" min="0" step="10" value={form.pvIncluded}
              onChange={e => setF({ pvIncluded: parseInt(e.target.value) || 0 })} />
          </Field>
          <Field label="Rank Required" hint="Leave blank = no requirement">
            <select className="input" value={form.rankRequired || ''} onChange={e => setF({ rankRequired: e.target.value || null })}>
              <option value="">No requirement</option>
              {RANKS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </Field>
        </div>

        {/* Features */}
        <Field label="Features">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {form.features.map((f, i) => (
              <div key={i} style={{ display: 'flex', gap: 6 }}>
                <input className="input" value={f} placeholder={`Feature ${i + 1}`}
                  onChange={e => setFeature(i, e.target.value)}
                  style={{ flex: 1 }} />
                <button onClick={() => removeFeature(i)} style={{
                  padding: '0 10px', borderRadius: 6, border: '1px solid rgba(239,68,68,0.3)',
                  background: 'transparent', color: '#f87171', cursor: 'pointer', fontSize: 16,
                }}>×</button>
              </div>
            ))}
            <button onClick={addFeature} style={{
              padding: '6px 12px', borderRadius: 6, border: '1px dashed var(--border)', background: 'transparent',
              color: 'var(--text2)', cursor: 'pointer', fontSize: 12, marginTop: 2,
            }}>+ Add feature</button>
          </div>
        </Field>

        <div style={{ display: 'flex', gap: 16, marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Toggle checked={form.isDefault} onChange={v => setF({ isDefault: v })} />
            <span style={{ fontSize: 13, color: 'var(--text2)' }}>Default plan for new members</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Toggle checked={form.status === 'active'} onChange={v => setF({ status: v ? 'active' : 'archived' })} />
            <span style={{ fontSize: 13, color: 'var(--text2)' }}>Active</span>
          </div>
        </div>

        {err && <div style={{ color: '#f87171', fontSize: 13, marginBottom: 12 }}>{err}</div>}

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '10px 0', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text2)', cursor: 'pointer', fontSize: 14 }}>Cancel</button>
          <button onClick={handleSave} disabled={saving} style={{ flex: 2, padding: '10px 0', borderRadius: 8, border: 'none', background: 'var(--gold)', color: '#000', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontSize: 14 }}>
            {saving ? 'Saving…' : plan ? 'Save Changes' : 'Create Plan'}
          </button>
        </div>
      </div>
    </div>
  )
}

function AssignModal({ member, plans, onSave, onClose }) {
  const [planId, setPlanId] = useState(member.planId || (plans[0]?.id || ''))
  const [cycle, setCycle] = useState(member.billingCycle || 'monthly')
  const [saving, setSaving] = useState(false)

  const plan = plans.find(p => p.id === planId)

  async function handleSave() {
    setSaving(true)
    try { await onSave(planId, cycle) } finally { setSaving(false) }
  }

  const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }
  const box = { background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: 16, padding: 28, width: '100%', maxWidth: 420 }

  return (
    <div style={overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={box}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <h2 style={{ color: 'var(--cream)', fontSize: 16, fontWeight: 700, margin: 0 }}>Change Plan — {member.memberName}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text2)', fontSize: 22, cursor: 'pointer' }}>×</button>
        </div>

        <Field label="Plan">
          <select className="input" value={planId} onChange={e => setPlanId(e.target.value)}>
            {plans.filter(p => p.status === 'active').map(p => (
              <option key={p.id} value={p.id}>{p.icon} {p.name} — {NOK(p.monthlyPrice)}/mo</option>
            ))}
          </select>
        </Field>

        <Field label="Billing Cycle">
          <div style={{ display: 'flex', gap: 8 }}>
            {['monthly', 'annual'].map(c => (
              <button key={c} onClick={() => setCycle(c)} style={{
                flex: 1, padding: '9px 0', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600,
                border: cycle === c ? 'none' : '1px solid var(--border)',
                background: cycle === c ? 'var(--gold)' : 'transparent',
                color: cycle === c ? '#000' : 'var(--text2)',
              }}>
                {c === 'monthly' ? `Monthly — ${plan ? NOK(plan.monthlyPrice) : ''}` : `Annual — ${plan ? NOK(plan.annualPrice) : ''}`}
              </button>
            ))}
          </div>
        </Field>

        {plan && (
          <div style={{ background: 'var(--navy3)', borderRadius: 8, padding: '12px 16px', marginBottom: 16, fontSize: 13 }}>
            <div style={{ color: 'var(--text2)', marginBottom: 4 }}>PV included / month: <strong style={{ color: '#34d399' }}>{plan.pvIncluded}</strong></div>
            <div style={{ color: 'var(--text2)' }}>MRR contribution: <strong style={{ color: 'var(--gold)' }}>{NOK(cycle === 'annual' ? Math.round(plan.annualPrice / 12) : plan.monthlyPrice)}</strong></div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '10px 0', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text2)', cursor: 'pointer' }}>Cancel</button>
          <button onClick={handleSave} disabled={saving} style={{ flex: 2, padding: '10px 0', borderRadius: 8, border: 'none', background: 'var(--gold)', color: '#000', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer' }}>
            {saving ? 'Saving…' : 'Assign Plan'}
          </button>
        </div>
      </div>
    </div>
  )
}

function DeleteConfirm({ plan, onConfirm, onClose }) {
  const [saving, setSaving] = useState(false)
  const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }
  const box = { background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: 16, padding: 28, width: '100%', maxWidth: 360 }
  return (
    <div style={overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={box}>
        <h2 style={{ color: '#f87171', fontSize: 16, fontWeight: 700, margin: '0 0 10px' }}>Delete Plan?</h2>
        <p style={{ color: 'var(--text2)', fontSize: 14, margin: '0 0 8px' }}>
          Delete <strong style={{ color: 'var(--cream)' }}>{plan.icon} {plan.name}</strong>?
        </p>
        <p style={{ color: 'var(--text2)', fontSize: 13, margin: '0 0 20px' }}>
          {plan.memberCount > 0
            ? `${plan.memberCount} member(s) are currently on this plan. They will need to be reassigned.`
            : 'No members are on this plan.'}
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '10px 0', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text2)', cursor: 'pointer' }}>Cancel</button>
          <button onClick={async () => { setSaving(true); await onConfirm(); setSaving(false) }} disabled={saving}
            style={{ flex: 1, padding: '10px 0', borderRadius: 8, border: 'none', background: '#ef4444', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>
            {saving ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AdminSubscriptions() {
  const [plans, setPlans]       = useState([])
  const [subs, setSubs]         = useState([])
  const [loading, setLoading]   = useState(true)
  const [tab, setTab]           = useState('plans')
  const [planModal, setPlanModal]   = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [assignTarget, setAssignTarget] = useState(null)
  const [cancelTarget, setCancelTarget] = useState(null)
  const [search, setSearch]     = useState('')
  const [toast, setToast]       = useState('')

  const reload = useCallback(async () => {
    const [p, s] = await Promise.all([getSubscriptionPlans(), getMemberSubscriptions()])
    setPlans(p)
    setSubs(s)
    setLoading(false)
  }, [])

  useEffect(() => { reload() }, [reload])

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const totalSubs   = subs.filter(s => s.status === 'active').length
  const totalMRR    = subs.filter(s => s.status === 'active').reduce((a, s) => a + (s.mrr || 0), 0)
  const totalARR    = totalMRR * 12
  const avgMRR      = totalSubs > 0 ? Math.round(totalMRR / totalSubs) : 0
  const pastDue     = subs.filter(s => s.status === 'past_due').length

  // Merge member counts into plans from live subs
  const enrichedPlans = plans.map(p => ({
    ...p,
    memberCount: subs.filter(s => s.planId === p.id && s.status === 'active').length,
    mrr: subs.filter(s => s.planId === p.id && s.status === 'active').reduce((a, s) => a + (s.mrr || 0), 0),
  }))

  const filteredSubs = subs.filter(s =>
    !search || s.memberName.toLowerCase().includes(search.toLowerCase()) || s.memberId.toLowerCase().includes(search.toLowerCase())
  )

  async function handleSavePlan(data) {
    if (planModal && planModal.id) {
      const updated = await updateSubscriptionPlan(planModal.id, data)
      setPlans(ps => ps.map(p => p.id === planModal.id ? { ...p, ...updated } : p))
      showToast('Plan updated')
    } else {
      const created = await createSubscriptionPlan(data)
      setPlans(ps => [...ps, created])
      showToast('Plan created')
    }
    setPlanModal(null)
  }

  async function handleDeletePlan() {
    await deleteSubscriptionPlan(deleteTarget.id)
    setPlans(ps => ps.filter(p => p.id !== deleteTarget.id))
    setDeleteTarget(null)
    showToast('Plan deleted')
  }

  async function handleAssign(planId, billingCycle) {
    const updated = await assignMemberPlan(assignTarget.memberId, planId, billingCycle)
    setSubs(ss => ss.map(s => s.memberId === assignTarget.memberId ? { ...s, ...updated } : s))
    setAssignTarget(null)
    showToast('Plan assigned')
  }

  async function handleCancel() {
    await cancelMemberSubscription(cancelTarget.memberId)
    setSubs(ss => ss.map(s => s.memberId === cancelTarget.memberId ? { ...s, status: 'cancelled', mrr: 0, nextRenewal: null } : s))
    setCancelTarget(null)
    showToast('Subscription cancelled')
  }

  const TABS = [
    { id: 'plans',   label: '📋 Plans' },
    { id: 'members', label: '👥 Member Subscriptions' },
  ]

  if (loading) return (
    <AdminLayout>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
        <div style={{ color: 'var(--text2)' }}>Loading subscriptions…</div>
      </div>
    </AdminLayout>
  )

  return (
    <AdminLayout>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ color: 'var(--cream)', fontSize: 22, fontWeight: 700, margin: '0 0 4px' }}>Subscription Plans</h1>
            <div style={{ color: 'var(--text2)', fontSize: 13 }}>Manage recurring membership tiers, member assignments, and subscription revenue</div>
          </div>
          {tab === 'plans' && (
            <button onClick={() => setPlanModal('new')} style={{
              padding: '9px 20px', borderRadius: 8, border: 'none', background: 'var(--gold)', color: '#000', fontWeight: 700, cursor: 'pointer', fontSize: 13,
            }}>+ New Plan</button>
          )}
        </div>

        {/* KPI strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 24 }}>
          <KpiCard label="Active Subscribers" value={totalSubs} sub={`${plans.filter(p => p.status === 'active').length} plans available`} color="var(--cream)" />
          <KpiCard label="MRR" value={NOK(totalMRR)} sub="Monthly recurring revenue" color="var(--gold)" />
          <KpiCard label="ARR" value={NOK(totalARR)} sub="Annualised run rate" color="#34d399" />
          <KpiCard label="Avg MRR / Member" value={NOK(avgMRR)} sub="Per active subscriber" color="#60a5fa" />
          {pastDue > 0 && <KpiCard label="Past Due" value={pastDue} sub="Need attention" color="#f59e0b" />}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 20 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: tab === t.id ? 700 : 400,
              background: tab === t.id ? 'var(--gold)' : 'var(--navy2)', color: tab === t.id ? '#000' : 'var(--text2)',
            }}>{t.label}</button>
          ))}
        </div>

        {/* ── Tab: Plans ── */}
        {tab === 'plans' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {enrichedPlans.length === 0 ? (
              <div style={{ background: 'var(--navy2)', borderRadius: 12, padding: '48px', textAlign: 'center' }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>📋</div>
                <div style={{ color: 'var(--cream)', fontWeight: 700, fontSize: 16, marginBottom: 8 }}>No Subscription Plans</div>
                <div style={{ color: 'var(--text2)', fontSize: 13, marginBottom: 20 }}>Create your first plan to start offering recurring membership tiers.</div>
                <button onClick={() => setPlanModal('new')} style={{ padding: '10px 24px', borderRadius: 8, border: 'none', background: 'var(--gold)', color: '#000', fontWeight: 700, cursor: 'pointer' }}>
                  Create First Plan
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 16 }}>
                {enrichedPlans.map(plan => (
                  <div key={plan.id} style={{
                    background: 'var(--navy2)', borderRadius: 14, padding: 22,
                    border: plan.status === 'active' ? `1px solid ${plan.color}40` : '1px solid var(--border)',
                    opacity: plan.status === 'archived' ? 0.55 : 1,
                    position: 'relative', overflow: 'hidden',
                  }}>
                    {/* Color accent bar */}
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: plan.color, borderRadius: '14px 14px 0 0' }} />

                    {plan.isDefault && (
                      <div style={{ position: 'absolute', top: 10, right: 14, fontSize: 10, fontWeight: 700, color: plan.color, background: `${plan.color}18`, padding: '2px 8px', borderRadius: 6 }}>DEFAULT</div>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                      <div style={{ width: 42, height: 42, borderRadius: 12, background: `${plan.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
                        {plan.icon}
                      </div>
                      <div>
                        <div style={{ color: 'var(--cream)', fontWeight: 700, fontSize: 16 }}>{plan.name}</div>
                        <div style={{ color: 'var(--text2)', fontSize: 12, marginTop: 1 }}>{plan.description}</div>
                      </div>
                    </div>

                    {/* Pricing */}
                    <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
                      <div style={{ flex: 1, background: 'var(--navy3)', borderRadius: 8, padding: '8px 12px', textAlign: 'center' }}>
                        <div style={{ fontSize: 10, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Monthly</div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: plan.color, marginTop: 2 }}>{NOK(plan.monthlyPrice)}</div>
                      </div>
                      <div style={{ flex: 1, background: 'var(--navy3)', borderRadius: 8, padding: '8px 12px', textAlign: 'center' }}>
                        <div style={{ fontSize: 10, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Annual</div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: plan.color, marginTop: 2 }}>{NOK(plan.annualPrice)}</div>
                      </div>
                    </div>

                    {/* Stats */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 14 }}>
                      <div>
                        <div style={{ color: 'var(--text2)', fontSize: 11 }}>Subscribers</div>
                        <div style={{ color: 'var(--cream)', fontWeight: 700 }}>{plan.memberCount}</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ color: 'var(--text2)', fontSize: 11 }}>MRR</div>
                        <div style={{ color: 'var(--gold)', fontWeight: 700 }}>{NOK(plan.mrr)}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ color: 'var(--text2)', fontSize: 11 }}>PV/month</div>
                        <div style={{ color: '#34d399', fontWeight: 700 }}>{plan.pvIncluded}</div>
                      </div>
                    </div>

                    {/* Features */}
                    {plan.features?.length > 0 && (
                      <div style={{ marginBottom: 14 }}>
                        {plan.features.slice(0, 3).map((f, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, fontSize: 12, color: 'var(--text2)' }}>
                            <span style={{ color: plan.color }}>✓</span> {f}
                          </div>
                        ))}
                        {plan.features.length > 3 && (
                          <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>+{plan.features.length - 3} more</div>
                        )}
                      </div>
                    )}

                    {plan.rankRequired && (
                      <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 12 }}>
                        Requires: <strong style={{ color: 'var(--cream)' }}>{plan.rankRequired}</strong>
                      </div>
                    )}

                    {/* Status badge */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{
                        padding: '3px 10px', borderRadius: 6, fontSize: 10, fontWeight: 700,
                        background: plan.status === 'active' ? 'rgba(52,211,153,0.12)' : 'rgba(148,163,184,0.12)',
                        color: plan.status === 'active' ? '#34d399' : 'var(--text2)',
                      }}>{plan.status.toUpperCase()}</span>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => setPlanModal(plan)} style={{
                          padding: '5px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text2)', cursor: 'pointer', fontSize: 12,
                        }}>Edit</button>
                        <button onClick={() => setDeleteTarget(plan)} style={{
                          padding: '5px 10px', borderRadius: 6, border: '1px solid rgba(239,68,68,0.3)', background: 'transparent', color: '#f87171', cursor: 'pointer', fontSize: 12,
                        }}>✕</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* MRR bar chart */}
            {enrichedPlans.filter(p => p.mrr > 0).length > 0 && (
              <div style={{ background: 'var(--navy2)', borderRadius: 12, padding: '20px', marginTop: 4 }}>
                <div style={{ color: 'var(--cream)', fontWeight: 700, fontSize: 14, marginBottom: 16 }}>Revenue Distribution by Plan</div>
                {enrichedPlans.filter(p => p.mrr > 0).map(p => (
                  <div key={p.id} style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                      <span style={{ color: 'var(--cream)' }}>{p.icon} {p.name}</span>
                      <span style={{ color: p.color, fontWeight: 700 }}>{NOK(p.mrr)} / mo · {p.memberCount} subscribers</span>
                    </div>
                    <div style={{ height: 6, background: 'var(--navy3)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', background: p.color, width: `${Math.round((p.mrr / totalMRR) * 100)}%`, borderRadius: 3, transition: 'width 0.6s' }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Tab: Member Subscriptions ── */}
        {tab === 'members' && (
          <div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
              <input className="input" placeholder="Search member…" value={search} onChange={e => setSearch(e.target.value)}
                style={{ maxWidth: 260 }} />
              <div style={{ fontSize: 12, color: 'var(--text2)', marginLeft: 'auto' }}>
                {filteredSubs.length} member{filteredSubs.length !== 1 ? 's' : ''}
              </div>
            </div>

            <div style={{ background: 'var(--navy2)', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      {['Member', 'Plan', 'Billing', 'Status', 'MRR', 'Next Renewal', ''].map(h => (
                        <th key={h} style={{ padding: '12px 14px', textAlign: 'left', color: 'var(--text2)', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSubs.map(sub => {
                      const plan = plans.find(p => p.id === sub.planId)
                      return (
                        <tr key={sub.memberId} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '12px 14px' }}>
                            <div style={{ color: 'var(--cream)', fontWeight: 600 }}>{sub.memberName}</div>
                            <div style={{ fontSize: 11, color: 'var(--text2)' }}>{sub.memberId}</div>
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                              {plan && <span style={{ color: plan.color }}>{plan.icon}</span>}
                              <span style={{ color: 'var(--cream)' }}>{sub.planName}</span>
                            </span>
                          </td>
                          <td style={{ padding: '12px 14px', color: 'var(--text2)', textTransform: 'capitalize' }}>{sub.billingCycle}</td>
                          <td style={{ padding: '12px 14px' }}><Badge status={sub.status} /></td>
                          <td style={{ padding: '12px 14px', color: sub.mrr > 0 ? 'var(--gold)' : 'var(--text2)', fontWeight: 600 }}>
                            {sub.mrr > 0 ? NOK(sub.mrr) : '—'}
                          </td>
                          <td style={{ padding: '12px 14px', color: 'var(--text2)', whiteSpace: 'nowrap' }}>
                            {sub.nextRenewal || '—'}
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                              <button onClick={() => setAssignTarget(sub)} style={{
                                padding: '4px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text2)', cursor: 'pointer', fontSize: 11,
                              }}>Change</button>
                              {sub.status !== 'cancelled' && (
                                <button onClick={() => setCancelTarget(sub)} style={{
                                  padding: '4px 10px', borderRadius: 6, border: '1px solid rgba(239,68,68,0.3)', background: 'transparent', color: '#f87171', cursor: 'pointer', fontSize: 11,
                                }}>Cancel</button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                    {filteredSubs.length === 0 && (
                      <tr>
                        <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: 'var(--text2)' }}>No subscriptions found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Modals */}
        {(planModal === 'new' || (planModal && planModal.id)) && (
          <PlanModal plan={planModal === 'new' ? null : planModal} onSave={handleSavePlan} onClose={() => setPlanModal(null)} />
        )}
        {deleteTarget && (
          <DeleteConfirm plan={deleteTarget} onConfirm={handleDeletePlan} onClose={() => setDeleteTarget(null)} />
        )}
        {assignTarget && (
          <AssignModal member={assignTarget} plans={plans} onSave={handleAssign} onClose={() => setAssignTarget(null)} />
        )}
        {cancelTarget && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
            onClick={e => e.target === e.currentTarget && setCancelTarget(null)}>
            <div style={{ background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: 16, padding: 28, width: '100%', maxWidth: 360 }}>
              <h2 style={{ color: '#f87171', fontSize: 16, fontWeight: 700, margin: '0 0 10px' }}>Cancel Subscription?</h2>
              <p style={{ color: 'var(--text2)', fontSize: 14, margin: '0 0 20px' }}>
                Cancel <strong style={{ color: 'var(--cream)' }}>{cancelTarget.memberName}</strong>'s {cancelTarget.planName} subscription?
                This stops future billing immediately.
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setCancelTarget(null)} style={{ flex: 1, padding: '10px 0', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text2)', cursor: 'pointer' }}>Keep Active</button>
                <button onClick={handleCancel} style={{ flex: 1, padding: '10px 0', borderRadius: 8, border: 'none', background: '#ef4444', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Cancel Sub</button>
              </div>
            </div>
          </div>
        )}

        {/* Toast */}
        {toast && (
          <div style={{ position: 'fixed', bottom: 24, right: 24, background: '#22c55e', color: '#000', fontWeight: 700, padding: '10px 20px', borderRadius: 8, zIndex: 300, fontSize: 14 }}>
            ✓ {toast}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
