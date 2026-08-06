import { useState, useEffect } from 'react'
import AdminLayout from '../../components/AdminLayout'
import {
  getTaxConfig, saveTaxConfig,
  addCountryTaxOverride, updateCountryTaxOverride, deleteCountryTaxOverride,
} from '../../api/mlmApi'

const NOK = v => 'NOK ' + Number(v).toLocaleString('nb-NO', { maximumFractionDigits: 0 })
const PCT = v => Number(v).toFixed(0) + '%'

const COUNTRIES = [
  'Norway', 'Sweden', 'Denmark', 'Finland', 'Iceland',
  'Germany', 'Netherlands', 'France', 'Spain', 'Italy', 'Belgium', 'Austria',
  'Switzerland', 'Poland', 'Czech Republic',
  'United Kingdom', 'United States', 'Canada',
  'Australia', 'New Zealand', 'Japan', 'Singapore', 'UAE',
]

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

function CountryOverrideModal({ override, usedCountries, onSave, onClose }) {
  const [form, setForm] = useState(override
    ? { country: override.country, rate: override.rate, note: override.note || '' }
    : { country: '', rate: 20, note: '' }
  )
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  const available = COUNTRIES.filter(c => !usedCountries.includes(c) || c === form.country)

  async function handleSave() {
    if (!form.country) return setErr('Select a country')
    if (form.rate < 0 || form.rate > 100) return setErr('Rate must be 0–100%')
    setErr('')
    setSaving(true)
    try { await onSave(form) } finally { setSaving(false) }
  }

  const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }
  const box = { background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: 16, padding: 28, width: '100%', maxWidth: 440 }

  return (
    <div style={overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={box}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ color: 'var(--cream)', fontSize: 17, fontWeight: 700, margin: 0 }}>
            {override ? 'Edit Country Override' : 'Add Country Override'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text2)', fontSize: 22, cursor: 'pointer' }}>×</button>
        </div>

        <label style={{ display: 'block', marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 6 }}>Country</div>
          <select className="input" value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))}>
            <option value="">Select country…</option>
            {available.map(c => <option key={c}>{c}</option>)}
          </select>
        </label>

        <label style={{ display: 'block', marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 6 }}>VAT Rate (%)</div>
          <input className="input" type="number" min="0" max="100" step="1"
            value={form.rate} onChange={e => setForm(f => ({ ...f, rate: parseFloat(e.target.value) || 0 }))} />
        </label>

        <label style={{ display: 'block', marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 6 }}>Note (optional)</div>
          <input className="input" value={form.note}
            onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
            placeholder="e.g. Post-Brexit UK VAT" />
        </label>

        {err && <div style={{ color: '#f87171', fontSize: 13, marginBottom: 12 }}>{err}</div>}

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '10px 0', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text2)', cursor: 'pointer', fontSize: 14 }}>Cancel</button>
          <button onClick={handleSave} disabled={saving} style={{ flex: 2, padding: '10px 0', borderRadius: 8, border: 'none', background: 'var(--gold)', color: '#000', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontSize: 14 }}>
            {saving ? 'Saving…' : 'Save Override'}
          </button>
        </div>
      </div>
    </div>
  )
}

function DeleteConfirm({ item, onConfirm, onClose }) {
  const [saving, setSaving] = useState(false)
  const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }
  const box = { background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: 16, padding: 28, width: '100%', maxWidth: 360 }

  return (
    <div style={overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={box}>
        <h2 style={{ color: '#f87171', fontSize: 17, fontWeight: 700, margin: '0 0 10px' }}>Remove Override?</h2>
        <p style={{ color: 'var(--text2)', fontSize: 14, margin: '0 0 20px' }}>
          Remove the VAT override for <strong style={{ color: 'var(--cream)' }}>{item.country}</strong>? It will revert to the default rate.
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '10px 0', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text2)', cursor: 'pointer' }}>Cancel</button>
          <button onClick={async () => { setSaving(true); await onConfirm(); setSaving(false) }} disabled={saving}
            style={{ flex: 1, padding: '10px 0', borderRadius: 8, border: 'none', background: '#ef4444', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>
            {saving ? 'Removing…' : 'Remove'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AdminTax() {
  const [cfg, setCfg]         = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [toast, setToast]     = useState('')
  const [overrideModal, setOverrideModal] = useState(null) // null | 'new' | {override}
  const [deleteTarget, setDeleteTarget]   = useState(null)
  const [previewPrice, setPreviewPrice]   = useState(299)
  const [previewCountry, setPreviewCountry] = useState('Norway')
  const [localReg, setLocalReg]           = useState('')
  const [tab, setTab] = useState('rates')

  useEffect(() => {
    getTaxConfig().then(d => {
      setCfg(d)
      setLocalReg(d.mvaRegistrationNumber || '')
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(''), 3000) }

  async function handleToggle(field, val) {
    const updated = { ...cfg, [field]: val }
    setCfg(updated)
    setSaving(true)
    await saveTaxConfig({ [field]: val }).catch(() => {})
    setSaving(false)
    showToast('Saved')
  }

  async function handleSaveReg() {
    const updated = { ...cfg, mvaRegistrationNumber: localReg }
    setCfg(updated)
    setSaving(true)
    await saveTaxConfig({ mvaRegistrationNumber: localReg }).catch(() => {})
    setSaving(false)
    showToast('MVA number saved')
  }

  async function handleCategoryRate(id, rate) {
    const updatedRates = (cfg.productCategoryRates || []).map(r => r.id === id ? { ...r, rate } : r)
    const updated = { ...cfg, productCategoryRates: updatedRates }
    setCfg(updated)
    setSaving(true)
    await saveTaxConfig({ productCategoryRates: updatedRates }).catch(() => {})
    setSaving(false)
    showToast('Rate updated')
  }

  async function handleSaveOverride(form) {
    if (overrideModal && overrideModal.id) {
      const updated = await updateCountryTaxOverride(overrideModal.id, form)
      setCfg(c => ({ ...c, countryOverrides: c.countryOverrides.map(o => o.id === overrideModal.id ? { ...o, ...form } : o) }))
    } else {
      const newItem = await addCountryTaxOverride(form)
      setCfg(c => ({ ...c, countryOverrides: [...c.countryOverrides, newItem] }))
    }
    setOverrideModal(null)
    showToast('Country override saved')
  }

  async function handleToggleOverride(id, enabled) {
    await updateCountryTaxOverride(id, { enabled })
    setCfg(c => ({ ...c, countryOverrides: c.countryOverrides.map(o => o.id === id ? { ...o, enabled } : o) }))
  }

  async function handleDeleteOverride() {
    await deleteCountryTaxOverride(deleteTarget.id)
    setCfg(c => ({ ...c, countryOverrides: c.countryOverrides.filter(o => o.id !== deleteTarget.id) }))
    setDeleteTarget(null)
    showToast('Override removed')
  }

  // Tax preview computation
  function computePreview() {
    if (!cfg) return { vatAmount: 0, rate: 0, net: previewPrice, gross: previewPrice }
    const override = cfg.countryOverrides?.find(o => o.enabled && o.country === previewCountry)
    const rate = override ? override.rate : cfg.defaultRate
    if (!cfg.enabled) return { vatAmount: 0, rate: 0, net: previewPrice, gross: previewPrice }
    if (cfg.pricesIncludeTax) {
      const vatAmount = Math.round(previewPrice - previewPrice / (1 + rate / 100))
      return { vatAmount, rate, net: previewPrice - vatAmount, gross: previewPrice }
    } else {
      const vatAmount = Math.round(previewPrice * rate / 100)
      return { vatAmount, rate, net: previewPrice, gross: previewPrice + vatAmount }
    }
  }

  const preview = computePreview()
  const usedCountries = (cfg?.countryOverrides || []).map(o => o.country)

  if (loading) {
    return (
      <AdminLayout>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
          <div style={{ color: 'var(--text2)' }}>Loading tax configuration…</div>
        </div>
      </AdminLayout>
    )
  }

  const tabs = [
    { id: 'rates',     label: '📊 Rates & Rules' },
    { id: 'countries', label: '🌍 Country Overrides' },
    { id: 'preview',   label: '🔢 Tax Calculator' },
  ]

  return (
    <AdminLayout>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ color: 'var(--cream)', fontSize: 22, fontWeight: 700, margin: '0 0 4px' }}>Tax / VAT Configuration</h1>
            <div style={{ color: 'var(--text2)', fontSize: 13 }}>Configure Norwegian MVA and cross-border VAT rules for compliance</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 13, color: 'var(--text2)' }}>VAT Enabled</span>
            <Toggle checked={cfg.enabled} onChange={v => handleToggle('enabled', v)} />
            {saving && <span style={{ fontSize: 12, color: 'var(--text2)' }}>Saving…</span>}
          </div>
        </div>

        {/* KPI strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 24 }}>
          <KpiCard label="VAT Collected MTD" value={NOK(cfg.vatCollectedMTD)} sub="This month" color="var(--gold)" />
          <KpiCard label="VAT Collected YTD" value={NOK(cfg.vatCollectedYTD)} sub="This year" />
          <KpiCard label="Taxable Revenue MTD" value={NOK(cfg.taxableRevenueMTD)} sub="Ex. VAT" />
          <KpiCard label="Default Rate" value={PCT(cfg.defaultRate)} sub="Norway standard MVA" color="#34d399" />
        </div>

        {/* MVA Registration */}
        <div style={{ background: 'var(--navy2)', borderRadius: 12, padding: '18px 20px', marginBottom: 24, display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 6 }}>MVA Registration Number</div>
            <input className="input" value={localReg}
              onChange={e => setLocalReg(e.target.value)}
              placeholder="NO 987 654 321 MVA"
              style={{ fontFamily: 'monospace', fontSize: 14 }} />
            <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 4 }}>Displayed on invoices and receipts. Format: NO XXXXXXXXX MVA</div>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button onClick={handleSaveReg}
              style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: 'var(--gold)', color: '#000', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>
              Save
            </button>
            {cfg.ossEnrolled !== undefined && (
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <Toggle checked={cfg.ossEnrolled} onChange={v => handleToggle('ossEnrolled', v)} />
                <span style={{ fontSize: 13, color: 'var(--text2)' }}>OSS Enrolled</span>
              </label>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 20 }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: tab === t.id ? 700 : 400,
              background: tab === t.id ? 'var(--gold)' : 'var(--navy2)', color: tab === t.id ? '#000' : 'var(--text2)',
            }}>{t.label}</button>
          ))}
        </div>

        {/* Tab: Rates & Rules */}
        {tab === 'rates' && (
          <div style={{ background: 'var(--navy2)', borderRadius: 12, padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
              <div>
                <h3 style={{ color: 'var(--cream)', fontSize: 15, fontWeight: 700, margin: '0 0 4px' }}>Product Category Rates</h3>
                <div style={{ fontSize: 12, color: 'var(--text2)' }}>Norwegian MVA rates by product type</div>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <Toggle checked={cfg.pricesIncludeTax} onChange={v => handleToggle('pricesIncludeTax', v)} />
                <span style={{ fontSize: 13, color: 'var(--text2)' }}>Prices include VAT</span>
              </label>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--text2)', fontWeight: 600 }}>Category</th>
                    <th style={{ textAlign: 'center', padding: '8px 12px', color: 'var(--text2)', fontWeight: 600 }}>VAT Rate</th>
                    <th style={{ textAlign: 'center', padding: '8px 12px', color: 'var(--text2)', fontWeight: 600 }}>Edit</th>
                  </tr>
                </thead>
                <tbody>
                  {(cfg.productCategoryRates || []).map((r, i) => (
                    <tr key={r.id} style={{ borderBottom: '1px solid var(--border)', background: r.isDefault ? 'rgba(201,168,76,0.05)' : 'transparent' }}>
                      <td style={{ padding: '12px', color: 'var(--cream)' }}>
                        {r.label}
                        {r.isDefault && <span style={{ marginLeft: 8, fontSize: 10, background: 'rgba(201,168,76,0.2)', color: 'var(--gold)', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>DEFAULT</span>}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-block', padding: '3px 12px', borderRadius: 8, fontWeight: 700,
                          background: r.rate === 0 ? 'rgba(148,163,184,0.12)' : r.rate >= 20 ? 'rgba(201,168,76,0.15)' : 'rgba(52,211,153,0.12)',
                          color: r.rate === 0 ? 'var(--text2)' : r.rate >= 20 ? 'var(--gold)' : '#34d399',
                        }}>{r.rate}%</span>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <CategoryRateEditor rate={r.rate} onSave={newRate => handleCategoryRate(r.id, newRate)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: 20, padding: '14px 16px', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 8, fontSize: 12, color: 'var(--text2)' }}>
              <strong style={{ color: '#60a5fa' }}>Norwegian MVA Rates (2026):</strong> Standard 25% (most goods/services) · Food &amp; beverages 15% · Transport, hotel, cultural events 12% · Financial/educational services 0%
            </div>
          </div>
        )}

        {/* Tab: Country Overrides */}
        {tab === 'countries' && (
          <div style={{ background: 'var(--navy2)', borderRadius: 12, padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h3 style={{ color: 'var(--cream)', fontSize: 15, fontWeight: 700, margin: '0 0 4px' }}>Country-Specific VAT Overrides</h3>
                <div style={{ fontSize: 12, color: 'var(--text2)' }}>Override default rate for cross-border sales</div>
              </div>
              <button onClick={() => setOverrideModal('new')}
                style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: 'var(--gold)', color: '#000', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>
                + Add Country
              </button>
            </div>

            {cfg.countryOverrides?.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text2)', padding: '40px 0', fontSize: 14 }}>
                No country overrides configured. Default rate ({cfg.defaultRate}%) applies to all countries.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--text2)', fontWeight: 600 }}>Country</th>
                      <th style={{ textAlign: 'center', padding: '8px 12px', color: 'var(--text2)', fontWeight: 600 }}>VAT Rate</th>
                      <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--text2)', fontWeight: 600 }}>Note</th>
                      <th style={{ textAlign: 'center', padding: '8px 12px', color: 'var(--text2)', fontWeight: 600 }}>Active</th>
                      <th style={{ textAlign: 'center', padding: '8px 12px', color: 'var(--text2)', fontWeight: 600 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(cfg.countryOverrides || []).map(o => (
                      <tr key={o.id} style={{ borderBottom: '1px solid var(--border)', opacity: o.enabled ? 1 : 0.5 }}>
                        <td style={{ padding: '12px', color: 'var(--cream)', fontWeight: 600 }}>🌍 {o.country}</td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <span style={{ background: 'rgba(201,168,76,0.15)', color: 'var(--gold)', padding: '2px 10px', borderRadius: 8, fontWeight: 700 }}>{o.rate}%</span>
                        </td>
                        <td style={{ padding: '12px', color: 'var(--text2)', fontSize: 12 }}>{o.note || '—'}</td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <Toggle checked={o.enabled} onChange={v => handleToggleOverride(o.id, v)} />
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                            <button onClick={() => setOverrideModal(o)}
                              style={{ padding: '5px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text2)', cursor: 'pointer', fontSize: 12 }}>
                              Edit
                            </button>
                            <button onClick={() => setDeleteTarget(o)}
                              style={{ padding: '5px 12px', borderRadius: 6, border: '1px solid rgba(239,68,68,0.3)', background: 'transparent', color: '#f87171', cursor: 'pointer', fontSize: 12 }}>
                              Remove
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div style={{ marginTop: 20, padding: '14px 16px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 8, fontSize: 12, color: 'var(--text2)' }}>
              <strong style={{ color: '#f59e0b' }}>EU OSS Threshold:</strong> When cross-border EU sales exceed €10,000/year, you must charge the destination country's VAT rate and remit via the EU One-Stop-Shop scheme. Toggle "OSS Enrolled" above when registered.
            </div>
          </div>
        )}

        {/* Tab: Tax Calculator / Preview */}
        {tab === 'preview' && (
          <div style={{ background: 'var(--navy2)', borderRadius: 12, padding: 20, maxWidth: 500 }}>
            <h3 style={{ color: 'var(--cream)', fontSize: 15, fontWeight: 700, margin: '0 0 4px' }}>Tax Calculator</h3>
            <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 20 }}>Preview how VAT is applied based on current config</div>

            <label style={{ display: 'block', marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 6 }}>Price (NOK)</div>
              <input className="input" type="number" min="0" step="1"
                value={previewPrice} onChange={e => setPreviewPrice(parseFloat(e.target.value) || 0)} />
              <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 4 }}>
                {cfg.pricesIncludeTax ? 'Price includes VAT' : 'Price excludes VAT (ex-MVA)'}
              </div>
            </label>

            <label style={{ display: 'block', marginBottom: 24 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 6 }}>Customer Country</div>
              <select className="input" value={previewCountry} onChange={e => setPreviewCountry(e.target.value)}>
                {COUNTRIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </label>

            {!cfg.enabled ? (
              <div style={{ padding: '16px', background: 'rgba(148,163,184,0.08)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text2)', fontSize: 13, textAlign: 'center' }}>
                VAT calculation is disabled
              </div>
            ) : (
              <div style={{ background: 'var(--navy3)', borderRadius: 10, padding: '16px 20px' }}>
                <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 12 }}>
                  Applied rate: <strong style={{ color: 'var(--gold)' }}>{preview.rate}% MVA</strong>
                  {cfg.countryOverrides?.find(o => o.enabled && o.country === previewCountry)
                    ? <span style={{ marginLeft: 6, fontSize: 11, color: '#60a5fa' }}>(country override)</span>
                    : <span style={{ marginLeft: 6, fontSize: 11, color: 'var(--text2)' }}>(default rate)</span>
                  }
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text2)' }}>
                    <span>Ex-VAT (net)</span>
                    <span>NOK {preview.net.toLocaleString('nb-NO')}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--gold)' }}>
                    <span>MVA ({preview.rate}%)</span>
                    <span>NOK {preview.vatAmount.toLocaleString('nb-NO')}</span>
                  </div>
                  <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 700, color: 'var(--cream)' }}>
                    <span>Total (incl. MVA)</span>
                    <span>NOK {preview.gross.toLocaleString('nb-NO')}</span>
                  </div>
                </div>
                <div style={{ marginTop: 12, fontSize: 11, color: 'var(--text2)', textAlign: 'center' }}>
                  VAT receipt would show: <em>"Incl. MVA (NO {cfg.mvaRegistrationNumber?.replace('NO ', '') || '...'}): NOK {preview.vatAmount}"</em>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Modals */}
        {(overrideModal === 'new' || (overrideModal && overrideModal.id)) && (
          <CountryOverrideModal
            override={overrideModal === 'new' ? null : overrideModal}
            usedCountries={usedCountries}
            onSave={handleSaveOverride}
            onClose={() => setOverrideModal(null)}
          />
        )}
        {deleteTarget && (
          <DeleteConfirm item={deleteTarget} onConfirm={handleDeleteOverride} onClose={() => setDeleteTarget(null)} />
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

// Inline editable rate field
function CategoryRateEditor({ rate, onSave }) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(rate)

  function commit() {
    const n = parseFloat(val)
    if (!isNaN(n) && n >= 0 && n <= 100) onSave(n)
    setEditing(false)
  }

  if (!editing) {
    return (
      <button onClick={() => { setVal(rate); setEditing(true) }}
        style={{ padding: '4px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text2)', cursor: 'pointer', fontSize: 12 }}>
        Edit %
      </button>
    )
  }
  return (
    <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
      <input type="number" min="0" max="100" step="1" value={val}
        onChange={e => setVal(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false) }}
        style={{ width: 60, padding: '4px 8px', borderRadius: 6, border: '1px solid var(--gold)', background: 'var(--navy3)', color: 'var(--cream)', fontSize: 13 }}
        autoFocus />
      <button onClick={commit} style={{ padding: '4px 10px', borderRadius: 6, border: 'none', background: 'var(--gold)', color: '#000', fontWeight: 700, cursor: 'pointer', fontSize: 12 }}>✓</button>
      <button onClick={() => setEditing(false)} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text2)', cursor: 'pointer', fontSize: 12 }}>✕</button>
    </div>
  )
}
