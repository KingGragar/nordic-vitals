import { useState, useEffect } from 'react'
import AdminLayout from '../../components/AdminLayout'
import {
  getAdminLoyaltyConfig,
  updateEarnRule,
  updateLoyaltyTier,
  updateExpiryPolicy,
  createLoyaltyRedemptionOption,
  updateLoyaltyRedemptionOption,
  deleteLoyaltyRedemptionOption,
} from '../../api/mlmApi'

const TABS = ['Overview', 'Earn Rules', 'Tiers', 'Redemption Options', 'Expiry Policy']

const CATEGORY_ICONS = { discount: '🏷️', mlmt: '🪙', shipping: '📦', product: '🎁', cash: '💵' }

function StatCard({ icon, label, value, sub }) {
  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 18px' }}>
      <div style={{ fontSize: 22, marginBottom: 6 }}>{icon}</div>
      <div style={{ fontWeight: 700, fontSize: 20 }}>{value}</div>
      <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>{sub}</div>}
    </div>
  )
}

function EarnRulesTab({ rules, onToggle, onEdit }) {
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(null)

  function startEdit(rule) {
    setEditing(rule.id)
    setForm({ rate: rule.rate })
  }

  async function saveEdit(rule) {
    setSaving(rule.id)
    await onEdit(rule.id, { rate: Number(form.rate) })
    setSaving(null)
    setEditing(null)
  }

  return (
    <div>
      <div style={{ marginBottom: 16, color: 'var(--text2)', fontSize: 13 }}>
        Configure how members earn loyalty points for each activity. Toggle rules on/off without deleting them.
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {rules.map(rule => (
          <div key={rule.id} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', opacity: rule.enabled ? 1 : 0.5 }}>
            <div style={{ flex: 1, minWidth: 180 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{rule.activity}</div>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{rule.description}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {editing === rule.id ? (
                <>
                  <input type="number" step="0.01" value={form.rate} onChange={e => setForm(f => ({ ...f, rate: e.target.value }))}
                    style={{ width: 80, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, padding: '5px 8px', color: 'var(--text)', fontSize: 13, textAlign: 'center' }} />
                  <span style={{ fontSize: 12, color: 'var(--text2)' }}>{rule.unit}</span>
                  <button onClick={() => saveEdit(rule)} disabled={saving === rule.id} className="btn btn-primary btn-sm" style={{ fontSize: 12 }}>
                    {saving === rule.id ? '…' : 'Save'}
                  </button>
                  <button onClick={() => setEditing(null)} className="btn btn-outline btn-sm" style={{ fontSize: 12 }}>Cancel</button>
                </>
              ) : (
                <>
                  <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--gold)', minWidth: 50, textAlign: 'right' }}>{rule.rate}</span>
                  <span style={{ fontSize: 12, color: 'var(--text2)', minWidth: 90 }}>{rule.unit}</span>
                  <button onClick={() => startEdit(rule)} className="btn btn-outline btn-sm" style={{ fontSize: 12 }}>Edit rate</button>
                </>
              )}
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', userSelect: 'none' }}>
                <input type="checkbox" checked={rule.enabled} onChange={() => onToggle(rule.id, !rule.enabled)} style={{ width: 16, height: 16 }} />
                <span style={{ fontSize: 12, color: 'var(--text2)' }}>{rule.enabled ? 'On' : 'Off'}</span>
              </label>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function TierBadge({ color, name }) {
  return <span style={{ background: color + '22', color, border: `1px solid ${color}`, borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>{name}</span>
}

function TiersTab({ tiers, onSave }) {
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(null)
  const [perkInput, setPerkInput] = useState('')

  function startEdit(tier) {
    setEditing(tier.id)
    setForm({ minPoints: tier.minPoints, maxPoints: tier.maxPoints ?? '', earnMultiplier: tier.earnMultiplier, perks: [...tier.perks] })
    setPerkInput('')
  }

  async function saveEdit(tier) {
    setSaving(tier.id)
    await onSave(tier.id, { minPoints: Number(form.minPoints), maxPoints: form.maxPoints === '' ? null : Number(form.maxPoints), earnMultiplier: Number(form.earnMultiplier), perks: form.perks })
    setSaving(null)
    setEditing(null)
  }

  function addPerk() {
    const p = perkInput.trim()
    if (!p) return
    setForm(f => ({ ...f, perks: [...f.perks, p] }))
    setPerkInput('')
  }

  return (
    <div>
      <div style={{ marginBottom: 16, color: 'var(--text2)', fontSize: 13 }}>
        Configure tier thresholds, earn multipliers, and member perks for each loyalty tier.
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {tiers.map(tier => (
          <div key={tier.id} style={{ background: 'var(--card)', border: `1px solid ${tier.color}55`, borderRadius: 10, padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <TierBadge color={tier.color} name={tier.name} />
                {editing !== tier.id && (
                  <span style={{ fontSize: 13, color: 'var(--text2)' }}>
                    {tier.minPoints.toLocaleString()} – {tier.maxPoints ? tier.maxPoints.toLocaleString() : '∞'} pts · <strong style={{ color: 'var(--gold)' }}>{tier.earnMultiplier}×</strong> earn
                  </span>
                )}
              </div>
              {editing === tier.id ? (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => saveEdit(tier)} disabled={saving === tier.id} className="btn btn-primary btn-sm" style={{ fontSize: 12 }}>
                    {saving === tier.id ? 'Saving…' : 'Save'}
                  </button>
                  <button onClick={() => setEditing(null)} className="btn btn-outline btn-sm" style={{ fontSize: 12 }}>Cancel</button>
                </div>
              ) : (
                <button onClick={() => startEdit(tier)} className="btn btn-outline btn-sm" style={{ fontSize: 12 }}>Edit</button>
              )}
            </div>

            {editing === tier.id ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <div>
                    <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Min Points</label>
                    <input type="number" value={form.minPoints} onChange={e => setForm(f => ({ ...f, minPoints: e.target.value }))}
                      style={{ width: 110, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, padding: '7px 10px', color: 'var(--text)', fontSize: 13 }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Max Points (blank = ∞)</label>
                    <input type="number" value={form.maxPoints} onChange={e => setForm(f => ({ ...f, maxPoints: e.target.value }))}
                      placeholder="∞"
                      style={{ width: 110, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, padding: '7px 10px', color: 'var(--text)', fontSize: 13 }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Earn Multiplier</label>
                    <input type="number" step="0.05" value={form.earnMultiplier} onChange={e => setForm(f => ({ ...f, earnMultiplier: e.target.value }))}
                      style={{ width: 80, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, padding: '7px 10px', color: 'var(--text)', fontSize: 13 }} />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 6 }}>Perks</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                    {form.perks.map((p, i) => (
                      <span key={i} style={{ background: tier.color + '22', color: tier.color, border: `1px solid ${tier.color}55`, borderRadius: 12, padding: '3px 10px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                        {p}
                        <button onClick={() => setForm(f => ({ ...f, perks: f.perks.filter((_, j) => j !== i) }))}
                          style={{ background: 'none', border: 'none', color: tier.color, cursor: 'pointer', fontSize: 12, lineHeight: 1, padding: 0 }}>✕</button>
                      </span>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input value={perkInput} onChange={e => setPerkInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addPerk()}
                      placeholder="Add a perk…"
                      style={{ flex: 1, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, padding: '7px 10px', color: 'var(--text)', fontSize: 13 }} />
                    <button onClick={addPerk} className="btn btn-outline btn-sm" style={{ fontSize: 12 }}>Add</button>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {tier.perks.map((p, i) => (
                  <span key={i} style={{ background: tier.color + '22', color: tier.color, border: `1px solid ${tier.color}55`, borderRadius: 12, padding: '3px 10px', fontSize: 12 }}>{p}</span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function RedemptionModal({ opt, onSave, onClose }) {
  const [form, setForm] = useState(opt ? {
    name: opt.name, description: opt.description, pointsCost: opt.pointsCost, value: opt.value, category: opt.category, icon: opt.icon,
  } : { name: '', description: '', pointsCost: 500, value: '', category: 'discount', icon: '🎁' })
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!form.name.trim() || !form.value.trim()) return
    setSaving(true)
    await onSave(form)
    setSaving(false)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={onClose}>
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 28, maxWidth: 520, width: '100%' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 16 }}>{opt ? 'Edit Redemption Option' : 'New Redemption Option'}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text2)', fontSize: 20, cursor: 'pointer' }}>✕</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: '0 0 70px' }}>
              <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Icon</label>
              <input value={form.icon} onChange={e => setForm(f => ({ ...f, icon: e.target.value }))}
                style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px', color: 'var(--text)', fontSize: 20, textAlign: 'center', boxSizing: 'border-box' }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Name *</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. 10% Order Discount"
                style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 10px', color: 'var(--text)', fontSize: 14, boxSizing: 'border-box' }} />
            </div>
          </div>
          <div>
            <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Description</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2}
              style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 10px', color: 'var(--text)', fontSize: 13, resize: 'vertical', boxSizing: 'border-box' }} />
          </div>
          <div style={{ display: 'flex', gap: 14 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Points Cost</label>
              <input type="number" min={1} value={form.pointsCost} onChange={e => setForm(f => ({ ...f, pointsCost: Number(e.target.value) }))}
                style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 10px', color: 'var(--text)', fontSize: 14, boxSizing: 'border-box' }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Value Label *</label>
              <input value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))}
                placeholder="e.g. 10% off"
                style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 10px', color: 'var(--text)', fontSize: 14, boxSizing: 'border-box' }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Category</label>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 10px', color: 'var(--text)', fontSize: 14, boxSizing: 'border-box' }}>
                <option value="discount">Discount</option>
                <option value="mlmt">MLMT Token</option>
                <option value="shipping">Free Shipping</option>
                <option value="product">Product</option>
                <option value="cash">Cash</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 8 }}>
            <button onClick={onClose} className="btn btn-outline btn-sm">Cancel</button>
            <button onClick={handleSave} disabled={saving || !form.name.trim() || !form.value.trim()} className="btn btn-primary btn-sm">
              {saving ? 'Saving…' : opt ? 'Update' : 'Create'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function RedemptionTab({ options, onCreate, onEdit, onToggle, onDelete }) {
  const [modal, setModal] = useState(null)
  const [deleteOpt, setDeleteOpt] = useState(null)
  const [saving, setSaving] = useState(null)

  async function handleCreate(form) {
    await onCreate(form)
    setModal(null)
  }
  async function handleEdit(form) {
    await onEdit(modal.opt.id, form)
    setModal(null)
  }
  async function handleDelete() {
    setSaving(deleteOpt.id)
    await onDelete(deleteOpt.id)
    setSaving(null)
    setDeleteOpt(null)
  }
  async function handleToggle(opt) {
    setSaving(opt.id)
    await onToggle(opt.id, !opt.enabled)
    setSaving(null)
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ color: 'var(--text2)', fontSize: 13 }}>Manage what members can redeem their loyalty points for.</div>
        <button onClick={() => setModal({ mode: 'new' })} className="btn btn-primary btn-sm">+ New Option</button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {options.map(opt => (
          <div key={opt.id} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', opacity: opt.enabled ? 1 : 0.5 }}>
            <span style={{ fontSize: 24, flexShrink: 0 }}>{opt.icon || CATEGORY_ICONS[opt.category] || '🎁'}</span>
            <div style={{ flex: 1, minWidth: 160 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{opt.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{opt.description}</div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontWeight: 700, color: 'var(--gold)', fontSize: 14 }}>{opt.pointsCost.toLocaleString()} pts</div>
              <div style={{ fontSize: 12, color: 'var(--text2)' }}>{opt.value}</div>
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <button onClick={() => setModal({ mode: 'edit', opt })} className="btn btn-outline btn-sm" style={{ fontSize: 12 }}>Edit</button>
              <button onClick={() => handleToggle(opt)} disabled={saving === opt.id}
                style={{ background: opt.enabled ? '#052e16' : '#1c1c1c', color: opt.enabled ? '#86efac' : '#a3a3a3', border: `1px solid ${opt.enabled ? '#166534' : '#404040'}`, borderRadius: 6, padding: '5px 10px', fontSize: 12, cursor: 'pointer' }}>
                {saving === opt.id ? '…' : opt.enabled ? 'Active' : 'Inactive'}
              </button>
              <button onClick={() => setDeleteOpt(opt)}
                style={{ background: 'none', border: '1px solid #7f1d1d', borderRadius: 6, padding: '5px 10px', fontSize: 12, color: '#f87171', cursor: 'pointer' }}>Del</button>
            </div>
          </div>
        ))}
        {options.length === 0 && (
          <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text2)', border: '1px dashed var(--border)', borderRadius: 10 }}>No redemption options yet.</div>
        )}
      </div>
      {modal && modal.mode === 'new' && <RedemptionModal onSave={handleCreate} onClose={() => setModal(null)} />}
      {modal && modal.mode === 'edit' && <RedemptionModal opt={modal.opt} onSave={handleEdit} onClose={() => setModal(null)} />}
      {deleteOpt && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={() => setDeleteOpt(null)}>
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 28, maxWidth: 380, width: '100%' }} onClick={e => e.stopPropagation()}>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 10 }}>Delete "{deleteOpt.name}"?</div>
            <div style={{ color: 'var(--text2)', fontSize: 13, marginBottom: 20 }}>This will remove the option for all members.</div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setDeleteOpt(null)} className="btn btn-outline btn-sm">Cancel</button>
              <button onClick={handleDelete} style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: 6, padding: '7px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ExpiryTab({ policy, onSave }) {
  const [form, setForm] = useState({ ...policy })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleSave() {
    setSaving(true)
    await onSave(form)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div style={{ maxWidth: 540 }}>
      <div style={{ color: 'var(--text2)', fontSize: 13, marginBottom: 20 }}>
        Control when and how loyalty points expire. Changes apply to new points; retroactive adjustments are applied on the next nightly batch.
      </div>
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
            <input type="checkbox" checked={form.enabled} onChange={e => setForm(f => ({ ...f, enabled: e.target.checked }))} style={{ width: 16, height: 16 }} />
            <span style={{ fontWeight: 600, fontSize: 14 }}>Enable point expiry</span>
          </label>
          <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 4, paddingLeft: 26 }}>
            When disabled, points never expire. Useful for onboarding periods.
          </div>
        </div>

        <div style={{ opacity: form.enabled ? 1 : 0.4, pointerEvents: form.enabled ? 'auto' : 'none' }}>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 6 }}>Expiry Type</label>
              <select value={form.expiryType} onChange={e => setForm(f => ({ ...f, expiryType: e.target.value }))}
                style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 12px', color: 'var(--text)', fontSize: 13 }}>
                <option value="rolling">Rolling (from date earned)</option>
                <option value="fixed">Fixed (calendar year end)</option>
                <option value="activity">Activity-based (reset on purchase)</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 6 }}>Months to Expiry</label>
              <input type="number" min={1} max={60} value={form.monthsToExpiry} onChange={e => setForm(f => ({ ...f, monthsToExpiry: Number(e.target.value) }))}
                style={{ width: 80, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 10px', color: 'var(--text)', fontSize: 13 }} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 6 }}>Warning (days before expiry)</label>
              <input type="number" min={0} max={90} value={form.warningDaysBeforeExpiry} onChange={e => setForm(f => ({ ...f, warningDaysBeforeExpiry: Number(e.target.value) }))}
                style={{ width: 80, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 10px', color: 'var(--text)', fontSize: 13 }} />
            </div>
          </div>
          <div style={{ marginTop: 14, padding: '12px 14px', background: 'var(--bg)', borderRadius: 8, fontSize: 12, color: 'var(--text2)' }}>
            <strong style={{ color: 'var(--text)' }}>Current setting:</strong>{' '}
            Points expire <strong>{form.monthsToExpiry} months</strong> after being earned ({form.expiryType} mode).
            Members are warned <strong>{form.warningDaysBeforeExpiry} days</strong> before their points expire.
          </div>
        </div>

        <div style={{ paddingTop: 4 }}>
          <button onClick={handleSave} disabled={saving} className="btn btn-primary btn-sm">
            {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save Policy'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AdminLoyaltyConfig() {
  const [cfg, setCfg] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('Overview')

  async function load() {
    setLoading(true)
    const data = await getAdminLoyaltyConfig().catch(() => null)
    setCfg(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleToggleRule(id, enabled) {
    await updateEarnRule(id, { enabled })
    setCfg(c => ({ ...c, earnRules: c.earnRules.map(r => r.id === id ? { ...r, enabled } : r) }))
  }

  async function handleEditRule(id, data) {
    await updateEarnRule(id, data)
    setCfg(c => ({ ...c, earnRules: c.earnRules.map(r => r.id === id ? { ...r, ...data } : r) }))
  }

  async function handleSaveTier(id, data) {
    await updateLoyaltyTier(id, data)
    setCfg(c => ({ ...c, tiers: c.tiers.map(t => t.id === id ? { ...t, ...data } : t) }))
  }

  async function handleCreateOpt(form) {
    await createLoyaltyRedemptionOption(form)
    await load()
  }

  async function handleEditOpt(id, form) {
    await updateLoyaltyRedemptionOption(id, form)
    setCfg(c => ({ ...c, redemptionOptions: c.redemptionOptions.map(o => o.id === id ? { ...o, ...form } : o) }))
  }

  async function handleToggleOpt(id, enabled) {
    await updateLoyaltyRedemptionOption(id, { enabled })
    setCfg(c => ({ ...c, redemptionOptions: c.redemptionOptions.map(o => o.id === id ? { ...o, enabled } : o) }))
  }

  async function handleDeleteOpt(id) {
    await deleteLoyaltyRedemptionOption(id)
    setCfg(c => ({ ...c, redemptionOptions: c.redemptionOptions.filter(o => o.id !== id) }))
  }

  async function handleSaveExpiry(data) {
    await updateExpiryPolicy(data)
    setCfg(c => ({ ...c, expiryPolicy: { ...c.expiryPolicy, ...data } }))
  }

  return (
    <AdminLayout>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Loyalty Program Config</h1>
        <p style={{ margin: '4px 0 0', color: 'var(--text2)', fontSize: 13 }}>Configure earn rules, tier thresholds, redemption options and expiry policy</p>
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 24, flexWrap: 'wrap', borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            background: 'none', border: 'none', borderBottom: tab === t ? '2px solid var(--gold)' : '2px solid transparent',
            color: tab === t ? 'var(--gold)' : 'var(--text2)', cursor: 'pointer', padding: '10px 16px', fontSize: 13, fontWeight: tab === t ? 600 : 400,
            marginBottom: -1, transition: 'all 0.15s',
          }}>{t}</button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 48, color: 'var(--text2)' }}>Loading…</div>
      ) : !cfg ? (
        <div style={{ textAlign: 'center', padding: 48, color: '#f87171' }}>Failed to load configuration.</div>
      ) : (
        <>
          {tab === 'Overview' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, marginBottom: 28 }}>
                <StatCard icon="👥" label="Active Members" value={cfg.stats.totalActiveMembers.toLocaleString()} />
                <StatCard icon="⭐" label="Points Outstanding" value={cfg.stats.totalPointsOutstanding.toLocaleString()} />
                <StatCard icon="📈" label="Earned (30d)" value={cfg.stats.totalPointsEarnedLastMonth.toLocaleString()} />
                <StatCard icon="🔄" label="Redeemed (30d)" value={cfg.stats.totalPointsRedeemedLastMonth.toLocaleString()} />
                <StatCard icon="🧮" label="Avg / Member" value={cfg.stats.avgPointsPerMember.toLocaleString()} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginBottom: 28 }}>
                {cfg.tiers.map(t => (
                  <div key={t.id} style={{ background: 'var(--card)', border: `1px solid ${t.color}55`, borderRadius: 10, padding: '14px 16px' }}>
                    <TierBadge color={t.color} name={t.name} />
                    <div style={{ marginTop: 10, fontSize: 13, color: 'var(--text2)' }}>
                      <div>{t.minPoints.toLocaleString()} – {t.maxPoints ? t.maxPoints.toLocaleString() : '∞'} pts</div>
                      <div style={{ marginTop: 4, fontWeight: 600, color: t.color }}>{t.earnMultiplier}× earn rate</div>
                      <div style={{ marginTop: 6, fontSize: 11, color: 'var(--text2)' }}>
                        {t.name === 'Silver' && `${cfg.stats.silverPct}% of members`}
                        {t.name === 'Gold' && `${cfg.stats.goldPct}% of members`}
                        {t.name === 'Platinum' && `${cfg.stats.platinumPct}% of members`}
                        {t.name === 'Bronze' && `${100 - cfg.stats.silverPct - cfg.stats.goldPct - cfg.stats.platinumPct}% of members`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 18px' }}>
                  <div style={{ fontWeight: 600, marginBottom: 10 }}>Earn Rules ({cfg.earnRules.filter(r => r.enabled).length} active)</div>
                  {cfg.earnRules.slice(0, 5).map(r => (
                    <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '5px 0', borderBottom: '1px solid var(--border)', color: r.enabled ? 'var(--text)' : 'var(--text2)' }}>
                      <span>{r.activity}</span>
                      <span style={{ color: r.enabled ? 'var(--gold)' : 'var(--text2)' }}>{r.enabled ? `${r.rate} ${r.unit}` : 'Off'}</span>
                    </div>
                  ))}
                  <button onClick={() => setTab('Earn Rules')} style={{ background: 'none', border: 'none', color: 'var(--gold)', fontSize: 12, cursor: 'pointer', marginTop: 8, padding: 0 }}>View all →</button>
                </div>
                <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 18px' }}>
                  <div style={{ fontWeight: 600, marginBottom: 10 }}>Expiry Policy</div>
                  <div style={{ fontSize: 13, color: 'var(--text2)' }}>
                    {cfg.expiryPolicy.enabled
                      ? <><span style={{ color: '#86efac' }}>●</span> Points expire after <strong>{cfg.expiryPolicy.monthsToExpiry} months</strong> ({cfg.expiryPolicy.expiryType}). Warning sent {cfg.expiryPolicy.warningDaysBeforeExpiry}d before.</>
                      : <><span style={{ color: '#f87171' }}>●</span> Point expiry is <strong>disabled</strong>.</>}
                  </div>
                  <button onClick={() => setTab('Expiry Policy')} style={{ background: 'none', border: 'none', color: 'var(--gold)', fontSize: 12, cursor: 'pointer', marginTop: 8, padding: 0 }}>Configure →</button>
                </div>
              </div>
            </div>
          )}

          {tab === 'Earn Rules' && (
            <EarnRulesTab rules={cfg.earnRules} onToggle={handleToggleRule} onEdit={handleEditRule} />
          )}

          {tab === 'Tiers' && (
            <TiersTab tiers={cfg.tiers} onSave={handleSaveTier} />
          )}

          {tab === 'Redemption Options' && (
            <RedemptionTab options={cfg.redemptionOptions} onCreate={handleCreateOpt} onEdit={handleEditOpt} onToggle={handleToggleOpt} onDelete={handleDeleteOpt} />
          )}

          {tab === 'Expiry Policy' && (
            <ExpiryTab policy={cfg.expiryPolicy} onSave={handleSaveExpiry} />
          )}
        </>
      )}
    </AdminLayout>
  )
}
