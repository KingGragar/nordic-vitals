import { useState } from 'react'
import AdminLayout from '../../components/AdminLayout'

const RANK_COLORS = {
  Unranked: '#9ca3af',
  Bronze:   '#cd7f32',
  Silver:   '#aaaaaa',
  Gold:     '#c9a84c',
  Platinum: '#ffffff',
}

const INITIAL_RANKS = [
  { rank: 'Unranked', minPV: 0,    minLeftGV: 0,     minRightGV: 0,     pairingCap: 100,  sponsorBonus: 5,  xFactorCap: 35 },
  { rank: 'Bronze',   minPV: 100,  minLeftGV: 500,   minRightGV: 500,   pairingCap: 500,  sponsorBonus: 7,  xFactorCap: 35 },
  { rank: 'Silver',   minPV: 300,  minLeftGV: 2000,  minRightGV: 2000,  pairingCap: 1500, sponsorBonus: 10, xFactorCap: 35 },
  { rank: 'Gold',     minPV: 500,  minLeftGV: 5000,  minRightGV: 5000,  pairingCap: 3000, sponsorBonus: 12, xFactorCap: 35 },
  { rank: 'Platinum', minPV: 1000, minLeftGV: 15000, minRightGV: 15000, pairingCap: 8000, sponsorBonus: 15, xFactorCap: 35 },
]

const RANK_FIELDS = [
  { key: 'minPV',        label: 'Min PV' },
  { key: 'minLeftGV',    label: 'Min Left GV' },
  { key: 'minRightGV',   label: 'Min Right GV' },
  { key: 'pairingCap',   label: 'Pairing Cap (MLMT/wk)' },
  { key: 'sponsorBonus', label: 'Sponsor Bonus %', suffix: '%' },
  { key: 'xFactorCap',   label: 'X-Factor Cap %', suffix: '%' },
]

const INITIAL_LEVELS = [
  { level: 'L1', rate: 5   },
  { level: 'L2', rate: 3   },
  { level: 'L3', rate: 2   },
  { level: 'L4', rate: 1   },
  { level: 'L5', rate: 0.5 },
]

function Toast({ message, onClose }) {
  return (
    <div className="toast" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <span>{message}</span>
      <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '16px', cursor: 'pointer' }}>×</button>
    </div>
  )
}

function EditableCell({ value, suffix = '', onSave }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft]     = useState(String(value))

  function commit() {
    const num = parseFloat(draft)
    if (!isNaN(num)) onSave(num)
    setEditing(false)
  }

  if (editing) {
    return (
      <input
        autoFocus
        className="input"
        style={{ width: '90px', padding: '4px 8px', fontSize: '13px' }}
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false) }}
      />
    )
  }

  return (
    <span
      onClick={() => { setDraft(String(value)); setEditing(true) }}
      style={{
        cursor: 'pointer',
        borderBottom: '1px dashed var(--border)',
        paddingBottom: '1px',
        color: 'var(--cream)',
      }}
      title="Click to edit"
    >
      {value.toLocaleString()}{suffix}
    </span>
  )
}

export default function PlanConfig() {
  const [ranks, setRanks]           = useState(INITIAL_RANKS)
  const [levels, setLevels]         = useState(INITIAL_LEVELS)
  const [xFactorCap, setXFactorCap] = useState(35)
  const [cyclePeriod, setCyclePeriod] = useState('Weekly')
  const [payoutDay, setPayoutDay]   = useState('Sunday')
  const [editingXFactor, setEditingXFactor] = useState(false)
  const [xFactorDraft, setXFactorDraft]     = useState('35')
  const [showSaveConfirm, setShowSaveConfirm] = useState(false)
  const [toast, setToast]           = useState(null)

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(null), 3500)
  }

  function updateRankField(rank, key, value) {
    setRanks(prev => prev.map(r => r.rank === rank ? { ...r, [key]: value } : r))
  }

  function updateLevelRate(level, value) {
    setLevels(prev => prev.map(l => l.level === level ? { ...l, rate: value } : l))
  }

  function commitXFactor() {
    const num = parseFloat(xFactorDraft)
    if (!isNaN(num)) setXFactorCap(num)
    setEditingXFactor(false)
  }

  function handleSaveAll() {
    setShowSaveConfirm(false)
    showToast('Plan configuration saved ✓')
  }

  function saveSettings() {
    showToast('Global settings saved ✓')
  }

  return (
    <AdminLayout>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--cream)', marginBottom: '6px' }}>
          Plan Configuration
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text2)' }}>
          Changes take effect on next commission run. All changes are logged.
        </p>
      </div>

      {/* Rank thresholds card */}
      <div className="card" style={{ padding: 0, marginBottom: '20px', overflowX: 'auto' }}>
        <div style={{ padding: '20px 20px 12px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--cream)' }}>
            Rank Thresholds &amp; Bonuses
          </h2>
          <p style={{ fontSize: '12px', color: 'var(--text2)', marginTop: '4px' }}>
            Click any value to edit inline. Press Enter or click away to save.
          </p>
        </div>
        <table>
          <thead>
            <tr>
              <th>Rank</th>
              {RANK_FIELDS.map(f => <th key={f.key}>{f.label}</th>)}
            </tr>
          </thead>
          <tbody>
            {ranks.map(r => (
              <tr key={r.rank}>
                <td>
                  <span style={{ color: RANK_COLORS[r.rank], fontWeight: 700 }}>{r.rank}</span>
                </td>
                {RANK_FIELDS.map(f => (
                  <td key={f.key}>
                    <EditableCell
                      value={r[f.key]}
                      suffix={f.suffix || ''}
                      onSave={v => updateRankField(r.rank, f.key, v)}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ padding: '16px 20px' }}>
          <button className="btn btn-gold btn-sm" onClick={() => setShowSaveConfirm(true)}>
            Save All Changes
          </button>
        </div>
      </div>

      {/* Level commissions card */}
      <div className="card" style={{ marginBottom: '20px', maxWidth: '420px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--cream)', marginBottom: '16px' }}>
          Level Commission Rates
        </h2>
        <table>
          <thead>
            <tr>
              <th>Level</th>
              <th>Rate %</th>
            </tr>
          </thead>
          <tbody>
            {levels.map(l => (
              <tr key={l.level}>
                <td style={{ fontWeight: 600, color: 'var(--cream)' }}>{l.level}</td>
                <td>
                  <EditableCell
                    value={l.rate}
                    suffix="%"
                    onSave={v => updateLevelRate(l.level, v)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Global settings card */}
      <div className="card" style={{ maxWidth: '520px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--cream)', marginBottom: '20px' }}>
          Global Settings
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px' }}>
          {/* X-Factor Cap */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <label className="label-text" style={{ margin: 0, minWidth: '160px' }}>
              X-Factor Cap
            </label>
            {editingXFactor ? (
              <input
                autoFocus
                className="input"
                style={{ width: '100px', padding: '6px 10px', fontSize: '14px' }}
                value={xFactorDraft}
                onChange={e => setXFactorDraft(e.target.value)}
                onBlur={commitXFactor}
                onKeyDown={e => { if (e.key === 'Enter') commitXFactor() }}
              />
            ) : (
              <span
                onClick={() => { setXFactorDraft(String(xFactorCap)); setEditingXFactor(true) }}
                style={{
                  color: 'var(--cream)', fontWeight: 600, cursor: 'pointer',
                  borderBottom: '1px dashed var(--border)', paddingBottom: '1px',
                }}
              >
                {xFactorCap}%
              </span>
            )}
          </div>

          {/* Cycle period */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <label className="label-text" style={{ margin: 0, minWidth: '160px' }}>
              Cycle Period
            </label>
            <select
              className="input"
              style={{ width: '160px' }}
              value={cyclePeriod}
              onChange={e => setCyclePeriod(e.target.value)}
            >
              <option value="Weekly">Weekly</option>
              <option value="Monthly">Monthly</option>
            </select>
          </div>

          {/* Payout day */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <label className="label-text" style={{ margin: 0, minWidth: '160px' }}>
              Payout Day
            </label>
            <select
              className="input"
              style={{ width: '160px' }}
              value={payoutDay}
              onChange={e => setPayoutDay(e.target.value)}
            >
              {['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>

        <button className="btn btn-gold btn-sm" onClick={saveSettings}>
          Save Settings
        </button>
      </div>

      {/* Save all confirm modal */}
      {showSaveConfirm && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '24px' }}
          onClick={e => { if (e.target === e.currentTarget) setShowSaveConfirm(false) }}
        >
          <div className="card" style={{ maxWidth: '420px', width: '100%' }}>
            <h2 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--cream)', marginBottom: '12px' }}>
              Save Plan Changes?
            </h2>
            <p style={{ color: 'var(--text2)', fontSize: '14px', lineHeight: 1.6, marginBottom: '24px' }}>
              Save plan changes? Affects next commission run.
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button className="btn btn-outline btn-sm" onClick={() => setShowSaveConfirm(false)}>Cancel</button>
              <button className="btn btn-gold btn-sm" onClick={handleSaveAll}>Save</button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </AdminLayout>
  )
}
