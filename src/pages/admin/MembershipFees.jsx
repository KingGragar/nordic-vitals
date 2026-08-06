import { useState, useEffect } from 'react'
import AdminLayout from '../../components/AdminLayout'
import {
  getMembershipFeeConfig, saveMembershipFeeConfig,
  createMembershipFeePaymentPlan, updateMembershipFeePaymentPlan, deleteMembershipFeePaymentPlan,
} from '../../api/mlmApi'

const NOK = v => 'NOK ' + Number(v).toLocaleString('nb-NO', { maximumFractionDigits: 0 })

const RANKS = ['Bronze', 'Silver', 'Gold', 'Platinum']

function KpiCard({ label, value, sub, color }) {
  return (
    <div style={{ background: 'var(--navy2)', borderRadius: 10, padding: '16px 20px' }}>
      <div style={{ fontSize: 11, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: color || 'var(--cream)', lineHeight: 1.2 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{sub}</div>}
    </div>
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
    <label style={{ display: 'block', marginBottom: 16 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 6 }}>{label}</div>
      {children}
      {hint && <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 4 }}>{hint}</div>}
    </label>
  )
}

function PlanModal({ plan, onSave, onClose }) {
  const [form, setForm] = useState(plan
    ? { name: plan.name, installments: plan.installments, installmentAmount: plan.installmentAmount, enabled: plan.enabled }
    : { name: '', installments: 3, installmentAmount: 180, enabled: true }
  )
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  const total = form.installments * form.installmentAmount

  async function handleSave() {
    if (!form.name.trim()) return setErr('Enter a plan name')
    if (form.installments < 2) return setErr('Minimum 2 installments')
    if (form.installmentAmount < 1) return setErr('Installment amount must be at least 1')
    setErr('')
    setSaving(true)
    try { await onSave({ ...form }) } finally { setSaving(false) }
  }

  const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }
  const box = { background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: 16, padding: 28, width: '100%', maxWidth: 440 }

  return (
    <div style={overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={box}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ color: 'var(--cream)', fontSize: 17, fontWeight: 700, margin: 0 }}>
            {plan ? 'Edit Payment Plan' : 'New Payment Plan'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text2)', fontSize: 22, cursor: 'pointer' }}>×</button>
        </div>

        <Field label="Plan Name" hint="Shown to members during enrollment">
          <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. 3-Month Installment" />
        </Field>

        <Field label="Number of Installments" hint="How many monthly payments">
          <input className="input" type="number" min="2" max="24" value={form.installments}
            onChange={e => setForm(f => ({ ...f, installments: parseInt(e.target.value) || 2 }))} />
        </Field>

        <Field label="Amount per Installment (NOK)" hint="Monthly installment charge">
          <input className="input" type="number" min="1" step="1" value={form.installmentAmount}
            onChange={e => setForm(f => ({ ...f, installmentAmount: parseFloat(e.target.value) || 0 }))} />
        </Field>

        <div style={{ background: 'var(--navy3)', borderRadius: 8, padding: '12px 16px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
          <span style={{ color: 'var(--text2)' }}>Total cost to member</span>
          <span style={{ fontWeight: 700, color: 'var(--gold)' }}>{NOK(total)}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <Toggle checked={form.enabled} onChange={v => setForm(f => ({ ...f, enabled: v }))} />
          <span style={{ fontSize: 13, color: 'var(--text2)' }}>Active (visible to members)</span>
        </div>

        {err && <div style={{ color: '#f87171', fontSize: 13, marginBottom: 12 }}>{err}</div>}

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '10px 0', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text2)', cursor: 'pointer', fontSize: 14 }}>Cancel</button>
          <button onClick={handleSave} disabled={saving} style={{ flex: 2, padding: '10px 0', borderRadius: 8, border: 'none', background: 'var(--gold)', color: '#000', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontSize: 14 }}>
            {saving ? 'Saving…' : 'Save Plan'}
          </button>
        </div>
      </div>
    </div>
  )
}

function DeleteConfirm({ name, onConfirm, onClose }) {
  const [saving, setSaving] = useState(false)
  const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }
  const box = { background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: 16, padding: 28, width: '100%', maxWidth: 360 }
  return (
    <div style={overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={box}>
        <h2 style={{ color: '#f87171', fontSize: 17, fontWeight: 700, margin: '0 0 10px' }}>Delete Plan?</h2>
        <p style={{ color: 'var(--text2)', fontSize: 14, margin: '0 0 20px' }}>
          Delete <strong style={{ color: 'var(--cream)' }}>{name}</strong>? Members currently on this plan will continue their existing schedule.
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

export default function AdminMembershipFees() {
  const [cfg, setCfg]         = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [toast, setToast]     = useState('')
  const [tab, setTab]         = useState('enrollment')
  const [planModal, setPlanModal] = useState(null)   // null | 'new' | {plan}
  const [deleteTarget, setDeleteTarget] = useState(null)

  useEffect(() => {
    getMembershipFeeConfig().then(d => {
      setCfg(d)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(''), 3000) }

  async function patch(updates) {
    setSaving(true)
    try {
      const updated = await saveMembershipFeeConfig(updates)
      setCfg(updated)
      showToast('Saved')
    } finally { setSaving(false) }
  }

  async function handleSavePlan(form) {
    if (planModal && planModal.id) {
      await updateMembershipFeePaymentPlan(planModal.id, form)
      setCfg(c => ({ ...c, paymentPlans: c.paymentPlans.map(p => p.id === planModal.id ? { ...p, ...form } : p) }))
    } else {
      const newPlan = await createMembershipFeePaymentPlan(form)
      setCfg(c => ({ ...c, paymentPlans: [...c.paymentPlans, newPlan] }))
    }
    setPlanModal(null)
    showToast('Payment plan saved')
  }

  async function handleDeletePlan() {
    await deleteMembershipFeePaymentPlan(deleteTarget.id)
    setCfg(c => ({ ...c, paymentPlans: c.paymentPlans.filter(p => p.id !== deleteTarget.id) }))
    setDeleteTarget(null)
    showToast('Plan deleted')
  }

  if (loading) {
    return (
      <AdminLayout>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
          <div style={{ color: 'var(--text2)' }}>Loading membership fee configuration…</div>
        </div>
      </AdminLayout>
    )
  }

  const tabs = [
    { id: 'enrollment', label: '🎫 Enrollment Fees' },
    { id: 'renewal',    label: '♻️ Renewal Fees' },
    { id: 'plans',      label: '📅 Payment Plans' },
  ]

  const totalRevMTD = (cfg.revenue?.enrollmentMTD || 0) + (cfg.revenue?.renewalMTD || 0)
  const totalRevYTD = (cfg.revenue?.enrollmentYTD || 0) + (cfg.revenue?.renewalYTD || 0)

  return (
    <AdminLayout>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ color: 'var(--cream)', fontSize: 22, fontWeight: 700, margin: '0 0 4px' }}>Membership Fees</h1>
            <div style={{ color: 'var(--text2)', fontSize: 13 }}>Configure enrollment fees, annual renewal fees, and installment payment plans</div>
          </div>
          {saving && <span style={{ fontSize: 13, color: 'var(--text2)', alignSelf: 'center' }}>Saving…</span>}
        </div>

        {/* KPI strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 24 }}>
          <KpiCard label="Fee Revenue MTD" value={NOK(totalRevMTD)} sub="Enrollment + renewals" color="var(--gold)" />
          <KpiCard label="Fee Revenue YTD" value={NOK(totalRevYTD)} sub="This year" />
          <KpiCard label="Enrollment Revenue MTD" value={NOK(cfg.revenue?.enrollmentMTD || 0)} sub="New member fees" color="#34d399" />
          <KpiCard label="Renewal Revenue MTD" value={NOK(cfg.revenue?.renewalMTD || 0)} sub="Annual renewals" color="#60a5fa" />
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 20, flexWrap: 'wrap' }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: tab === t.id ? 700 : 400,
              background: tab === t.id ? 'var(--gold)' : 'var(--navy2)', color: tab === t.id ? '#000' : 'var(--text2)',
            }}>{t.label}</button>
          ))}
        </div>

        {/* ── Tab: Enrollment Fees ── */}
        {tab === 'enrollment' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Enable toggle */}
            <div style={{ background: 'var(--navy2)', borderRadius: 12, padding: '18px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div style={{ color: 'var(--cream)', fontWeight: 700, fontSize: 15 }}>Enrollment Fee</div>
                <div style={{ color: 'var(--text2)', fontSize: 12, marginTop: 2 }}>Charge new members a one-time fee when they join Nordic Vitals</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 13, color: 'var(--text2)' }}>{cfg.enrollment?.enabled ? 'Enabled' : 'Disabled'}</span>
                <Toggle checked={!!cfg.enrollment?.enabled} onChange={v => patch({ enrollment: { ...cfg.enrollment, enabled: v } })} />
              </div>
            </div>

            {cfg.enrollment?.enabled && (
              <div style={{ background: 'var(--navy2)', borderRadius: 12, padding: '20px' }}>
                <h3 style={{ color: 'var(--cream)', fontSize: 15, fontWeight: 700, margin: '0 0 16px' }}>Fee Settings</h3>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                  <Field label="Enrollment Fee Amount (NOK)" hint="One-time charge at signup">
                    <input className="input" type="number" min="0" step="1"
                      defaultValue={cfg.enrollment?.amount || 499}
                      onBlur={e => patch({ enrollment: { ...cfg.enrollment, amount: parseFloat(e.target.value) || 0 } })} />
                  </Field>

                  <Field label="Included PV Credit" hint="PV credited to new member on payment">
                    <input className="input" type="number" min="0" step="5"
                      defaultValue={cfg.enrollment?.includedPV || 0}
                      onBlur={e => patch({ enrollment: { ...cfg.enrollment, includedPV: parseInt(e.target.value) || 0 } })} />
                  </Field>
                </div>

                <Field label="Package Description" hint="Shown on the Join page and invoice">
                  <input className="input"
                    defaultValue={cfg.enrollment?.description || 'Nordic Vitals Starter Kit'}
                    onBlur={e => patch({ enrollment: { ...cfg.enrollment, description: e.target.value } })} />
                </Field>

                <div style={{ background: 'var(--navy3)', borderRadius: 8, padding: '12px 16px', marginTop: 4 }}>
                  <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 8, fontWeight: 600 }}>Preview — Join Page</div>
                  <div style={{ fontSize: 14, color: 'var(--cream)' }}>
                    Enrollment fee: <strong style={{ color: 'var(--gold)' }}>{NOK(cfg.enrollment?.amount || 499)}</strong>
                    {cfg.enrollment?.includedPV > 0 && (
                      <span style={{ marginLeft: 8, fontSize: 12, color: '#34d399' }}>
                        Includes {cfg.enrollment.includedPV} PV credit
                      </span>
                    )}
                  </div>
                  {cfg.enrollment?.description && (
                    <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 4 }}>{cfg.enrollment.description}</div>
                  )}
                </div>
              </div>
            )}

            {/* Exemptions */}
            <div style={{ background: 'var(--navy2)', borderRadius: 12, padding: '20px' }}>
              <h3 style={{ color: 'var(--cream)', fontSize: 15, fontWeight: 700, margin: '0 0 4px' }}>Fee Exemptions</h3>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 16 }}>Rules that waive or reduce the enrollment fee</div>

              {/* Sponsor waiver */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid var(--border)' }}>
                <div>
                  <div style={{ color: 'var(--cream)', fontSize: 14, fontWeight: 600 }}>Sponsor Waiver</div>
                  <div style={{ color: 'var(--text2)', fontSize: 12, marginTop: 2 }}>Allow sponsors to waive the enrollment fee for their recruits (1 waiver per month)</div>
                </div>
                <Toggle
                  checked={!!cfg.exemptions?.sponsorWaiverEnabled}
                  onChange={v => patch({ exemptions: { ...cfg.exemptions, sponsorWaiverEnabled: v } })}
                />
              </div>

              {/* Rank waiver */}
              <div style={{ padding: '14px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ color: 'var(--cream)', fontSize: 14, fontWeight: 600 }}>Rank Waiver</div>
                    <div style={{ color: 'var(--text2)', fontSize: 12, marginTop: 2 }}>Members at or above this rank can enroll downline at no fee</div>
                  </div>
                  <Toggle
                    checked={!!cfg.exemptions?.rankWaiverEnabled}
                    onChange={v => patch({ exemptions: { ...cfg.exemptions, rankWaiverEnabled: v } })}
                  />
                </div>
                {cfg.exemptions?.rankWaiverEnabled && (
                  <div style={{ marginTop: 10 }}>
                    <select className="input" style={{ maxWidth: 200 }}
                      value={cfg.exemptions?.rankWaiverRank || 'Platinum'}
                      onChange={e => patch({ exemptions: { ...cfg.exemptions, rankWaiverRank: e.target.value } })}>
                      {RANKS.map(r => <option key={r}>{r}</option>)}
                    </select>
                  </div>
                )}
              </div>

              {/* Promotional period */}
              <div style={{ padding: '14px 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ color: 'var(--cream)', fontSize: 14, fontWeight: 600 }}>Promotional Override</div>
                    <div style={{ color: 'var(--text2)', fontSize: 12, marginTop: 2 }}>Temporarily reduce or waive the enrollment fee until a set date</div>
                  </div>
                  <Toggle
                    checked={!!cfg.exemptions?.promoEnabled}
                    onChange={v => patch({ exemptions: { ...cfg.exemptions, promoEnabled: v } })}
                  />
                </div>
                {cfg.exemptions?.promoEnabled && (
                  <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                    <Field label="Promo Fee Amount (NOK)" hint="0 = free enrollment">
                      <input className="input" type="number" min="0" step="1"
                        defaultValue={cfg.exemptions?.promoAmount ?? 0}
                        onBlur={e => patch({ exemptions: { ...cfg.exemptions, promoAmount: parseFloat(e.target.value) || 0 } })} />
                    </Field>
                    <Field label="Promo Expires" hint="Fee reverts to normal after this date">
                      <input className="input" type="date"
                        defaultValue={cfg.exemptions?.promoExpiry || ''}
                        onBlur={e => patch({ exemptions: { ...cfg.exemptions, promoExpiry: e.target.value } })} />
                    </Field>
                    <Field label="Promo Note (internal)" hint="e.g. Summer Launch 2026">
                      <input className="input"
                        defaultValue={cfg.exemptions?.promoNote || ''}
                        onBlur={e => patch({ exemptions: { ...cfg.exemptions, promoNote: e.target.value } })} />
                    </Field>
                  </div>
                )}
              </div>

              {cfg.exemptions?.promoEnabled && (
                <div style={{ padding: '10px 14px', background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: 8, fontSize: 12, color: 'var(--text2)' }}>
                  <strong style={{ color: 'var(--gold)' }}>Active promo:</strong> Enrollment fee reduced to{' '}
                  <strong style={{ color: 'var(--cream)' }}>{cfg.exemptions.promoAmount === 0 ? 'FREE' : NOK(cfg.exemptions.promoAmount)}</strong>
                  {cfg.exemptions.promoExpiry && ` · expires ${cfg.exemptions.promoExpiry}`}
                  {cfg.exemptions.promoNote && ` · ${cfg.exemptions.promoNote}`}
                </div>
              )}
            </div>

            <div style={{ padding: '12px 16px', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 8, fontSize: 12, color: 'var(--text2)' }}>
              <strong style={{ color: '#60a5fa' }}>Norwegian MLM Law (Markedsføringsloven §14):</strong> Enrollment fees must cover a genuine product/service value — they cannot be purely a pay-to-play recruitment charge. Ensure {'"'}Included PV Credit{'"'} reflects real product value received by the new member.
            </div>
          </div>
        )}

        {/* ── Tab: Renewal Fees ── */}
        {tab === 'renewal' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            <div style={{ background: 'var(--navy2)', borderRadius: 12, padding: '18px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div style={{ color: 'var(--cream)', fontWeight: 700, fontSize: 15 }}>Annual Renewal Fee</div>
                <div style={{ color: 'var(--text2)', fontSize: 12, marginTop: 2 }}>Charge existing members to maintain their active status each year</div>
              </div>
              <Toggle checked={!!cfg.renewal?.annual?.enabled}
                onChange={v => patch({ renewal: { ...cfg.renewal, annual: { ...cfg.renewal?.annual, enabled: v } } })} />
            </div>

            {cfg.renewal?.annual?.enabled && (
              <div style={{ background: 'var(--navy2)', borderRadius: 12, padding: '20px' }}>
                <h3 style={{ color: 'var(--cream)', fontSize: 15, fontWeight: 700, margin: '0 0 16px' }}>Annual Fee Settings</h3>
                <Field label="Annual Renewal Amount (NOK)" hint="Charged once per year on member anniversary date">
                  <input className="input" type="number" min="0" step="1" style={{ maxWidth: 220 }}
                    defaultValue={cfg.renewal?.annual?.amount || 299}
                    onBlur={e => patch({ renewal: { ...cfg.renewal, annual: { ...cfg.renewal?.annual, amount: parseFloat(e.target.value) || 0 } } })} />
                </Field>
              </div>
            )}

            <div style={{ background: 'var(--navy2)', borderRadius: 12, padding: '18px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div style={{ color: 'var(--cream)', fontWeight: 700, fontSize: 15 }}>Monthly Subscription</div>
                <div style={{ color: 'var(--text2)', fontSize: 12, marginTop: 2 }}>Alternative monthly maintenance fee (instead of annual billing)</div>
              </div>
              <Toggle checked={!!cfg.renewal?.monthly?.enabled}
                onChange={v => patch({ renewal: { ...cfg.renewal, monthly: { ...cfg.renewal?.monthly, enabled: v } } })} />
            </div>

            {cfg.renewal?.monthly?.enabled && (
              <div style={{ background: 'var(--navy2)', borderRadius: 12, padding: '20px' }}>
                <h3 style={{ color: 'var(--cream)', fontSize: 15, fontWeight: 700, margin: '0 0 16px' }}>Monthly Subscription Settings</h3>
                <Field label="Monthly Amount (NOK)" hint="Charged on the same day each month">
                  <input className="input" type="number" min="0" step="1" style={{ maxWidth: 220 }}
                    defaultValue={cfg.renewal?.monthly?.amount || 49}
                    onBlur={e => patch({ renewal: { ...cfg.renewal, monthly: { ...cfg.renewal?.monthly, amount: parseFloat(e.target.value) || 0 } } })} />
                </Field>
              </div>
            )}

            {(cfg.renewal?.annual?.enabled || cfg.renewal?.monthly?.enabled) && (
              <div style={{ background: 'var(--navy2)', borderRadius: 12, padding: '20px' }}>
                <h3 style={{ color: 'var(--cream)', fontSize: 15, fontWeight: 700, margin: '0 0 16px' }}>Grace Period & Suspension</h3>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                  <Field label="Grace Period (Days)" hint="Days after due date before account suspends">
                    <input className="input" type="number" min="0" max="60" step="1"
                      defaultValue={cfg.renewal?.gracePeriodDays ?? 14}
                      onBlur={e => patch({ renewal: { ...cfg.renewal, gracePeriodDays: parseInt(e.target.value) || 0 } })} />
                  </Field>

                  <Field label="Reminder Days Before Due" hint="Send renewal reminder N days before billing date">
                    <input className="input" type="number" min="1" max="60" step="1"
                      defaultValue={cfg.renewal?.reminderDaysBefore ?? 30}
                      onBlur={e => patch({ renewal: { ...cfg.renewal, reminderDaysBefore: parseInt(e.target.value) || 7 } })} />
                  </Field>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
                  <Toggle
                    checked={!!cfg.renewal?.autoSuspendAfterGrace}
                    onChange={v => patch({ renewal: { ...cfg.renewal, autoSuspendAfterGrace: v } })}
                  />
                  <div>
                    <div style={{ color: 'var(--cream)', fontSize: 14 }}>Auto-suspend after grace period</div>
                    <div style={{ color: 'var(--text2)', fontSize: 11, marginTop: 2 }}>Member loses ability to earn commissions; account remains but earnings are paused</div>
                  </div>
                </div>
              </div>
            )}

            <div style={{ padding: '12px 16px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 8, fontSize: 12, color: 'var(--text2)' }}>
              <strong style={{ color: '#f59e0b' }}>Angrerettloven (Right of Withdrawal):</strong> Members must be able to cancel annual renewal with at least 30 days notice before the renewal date. Ensure your email reminder is sent at least 30 days before charging. Grace period must cover failed payment retries before suspension.
            </div>
          </div>
        )}

        {/* ── Tab: Payment Plans ── */}
        {tab === 'plans' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ color: 'var(--cream)', fontWeight: 700, fontSize: 15 }}>Installment Plans</div>
                <div style={{ color: 'var(--text2)', fontSize: 12, marginTop: 2 }}>Let new members spread their enrollment fee across multiple monthly payments</div>
              </div>
              <button onClick={() => setPlanModal('new')}
                style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: 'var(--gold)', color: '#000', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>
                + New Plan
              </button>
            </div>

            {(!cfg.paymentPlans || cfg.paymentPlans.length === 0) ? (
              <div style={{ background: 'var(--navy2)', borderRadius: 12, padding: '40px', textAlign: 'center' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>📅</div>
                <div style={{ color: 'var(--cream)', fontWeight: 700, fontSize: 15, marginBottom: 8 }}>No Payment Plans</div>
                <div style={{ color: 'var(--text2)', fontSize: 13, marginBottom: 20 }}>Members pay the full enrollment fee upfront. Create an installment plan to offer monthly payment options.</div>
                <button onClick={() => setPlanModal('new')}
                  style={{ padding: '9px 20px', borderRadius: 8, border: 'none', background: 'var(--gold)', color: '#000', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>
                  Create First Plan
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
                {cfg.paymentPlans.map(plan => (
                  <div key={plan.id} style={{ background: 'var(--navy2)', borderRadius: 12, padding: 20, border: plan.enabled ? '1px solid rgba(201,168,76,0.25)' : '1px solid var(--border)', opacity: plan.enabled ? 1 : 0.6 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                      <div>
                        <div style={{ color: 'var(--cream)', fontWeight: 700, fontSize: 15 }}>{plan.name}</div>
                        <div style={{ fontSize: 11, marginTop: 4 }}>
                          <span style={{
                            padding: '2px 8px', borderRadius: 6, fontWeight: 700, fontSize: 10,
                            background: plan.enabled ? 'rgba(52,211,153,0.12)' : 'rgba(148,163,184,0.12)',
                            color: plan.enabled ? '#34d399' : 'var(--text2)',
                          }}>{plan.enabled ? 'ACTIVE' : 'INACTIVE'}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => setPlanModal(plan)}
                          style={{ padding: '5px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text2)', cursor: 'pointer', fontSize: 12 }}>
                          Edit
                        </button>
                        <button onClick={() => setDeleteTarget(plan)}
                          style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid rgba(239,68,68,0.3)', background: 'transparent', color: '#f87171', cursor: 'pointer', fontSize: 12 }}>
                          ✕
                        </button>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                        <span style={{ color: 'var(--text2)' }}>Installments</span>
                        <span style={{ color: 'var(--cream)', fontWeight: 600 }}>{plan.installments}×</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                        <span style={{ color: 'var(--text2)' }}>Per month</span>
                        <span style={{ color: 'var(--gold)', fontWeight: 700 }}>{NOK(plan.installmentAmount)}</span>
                      </div>
                      <div style={{ height: 1, background: 'var(--border)' }} />
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                        <span style={{ color: 'var(--text2)' }}>Total cost</span>
                        <span style={{ color: 'var(--cream)', fontWeight: 700 }}>{NOK(plan.installments * plan.installmentAmount)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ padding: '12px 16px', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 8, fontSize: 12, color: 'var(--text2)' }}>
              <strong style={{ color: '#60a5fa' }}>Tip:</strong> Payment plans are offered alongside the standard upfront fee on the Join page. A member on an installment plan will be auto-billed monthly. Members must complete all installments before earning commissions above the Bronze rank threshold.
            </div>
          </div>
        )}

        {/* Modals */}
        {(planModal === 'new' || (planModal && planModal.id)) && (
          <PlanModal
            plan={planModal === 'new' ? null : planModal}
            onSave={handleSavePlan}
            onClose={() => setPlanModal(null)}
          />
        )}
        {deleteTarget && (
          <DeleteConfirm name={deleteTarget.name} onConfirm={handleDeletePlan} onClose={() => setDeleteTarget(null)} />
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
