import { useState, useEffect } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { getExchangeRates, updateExchangeRate } from '../../api/mlmApi'

function fmt(n, dec = 4) {
  return n == null ? '—' : Number(n).toFixed(dec)
}
function fmtDate(ts) {
  if (!ts) return '—'
  return new Date(ts).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}
function fmtDateTime(ts) {
  if (!ts) return '—'
  return new Date(ts).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const card = { background: 'var(--navy2)', borderRadius: 10, padding: '18px 20px', flex: 1, minWidth: 160 }
const inputStyle = { width: '100%', padding: '8px 10px', borderRadius: 7, border: '1px solid var(--navy3)', background: 'var(--navy)', color: 'var(--text)', fontSize: 14, boxSizing: 'border-box' }
const labelStyle = { fontSize: 12, color: 'var(--text2)', marginBottom: 4, display: 'block' }
const btnPrimary = { padding: '9px 20px', borderRadius: 8, border: 'none', background: 'var(--gold)', color: '#000', fontWeight: 600, cursor: 'pointer', fontSize: 14 }
const btnSecondary = { padding: '9px 20px', borderRadius: 8, border: '1px solid var(--navy3)', background: 'transparent', color: 'var(--text)', cursor: 'pointer', fontSize: 14 }

const PAIRS = [
  { key: 'mlmt_nok', label: 'MLMT → NOK', flag: '🇳🇴', desc: 'Norwegian Krone', placeholder: '1.15' },
  { key: 'mlmt_eur', label: 'MLMT → EUR', flag: '🇪🇺', desc: 'Euro',            placeholder: '0.10' },
  { key: 'mlmt_usd', label: 'MLMT → USD', flag: '🇺🇸', desc: 'US Dollar',       placeholder: '0.11' },
]

export default function AdminExchangeRates() {
  const [data, setData]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [form, setForm]     = useState({ mlmt_nok: '', mlmt_eur: '', mlmt_usd: '', note: '', effective_date: '' })
  const [modal, setModal]   = useState(false)
  const [busy, setBusy]     = useState(false)
  const [toast, setToast]   = useState('')

  useEffect(() => {
    getExchangeRates().then(d => { setData(d); setLoading(false) })
  }, [])

  function openModal() {
    if (!data) return
    setForm({
      mlmt_nok: String(data.current.mlmt_nok),
      mlmt_eur: String(data.current.mlmt_eur),
      mlmt_usd: String(data.current.mlmt_usd),
      note: '',
      effective_date: new Date().toISOString().slice(0, 10),
    })
    setModal(true)
  }

  async function handleSave() {
    if (!form.mlmt_nok || !form.mlmt_eur || !form.mlmt_usd) return
    setBusy(true)
    try {
      const updated = await updateExchangeRate(form)
      setData(updated)
      setModal(false)
      showToast('Exchange rates updated ✓')
    } finally {
      setBusy(false)
    }
  }

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  if (loading) return <AdminLayout><div style={{ padding: 40, color: 'var(--text2)' }}>Loading…</div></AdminLayout>

  const cur = data.current

  return (
    <AdminLayout>
      <div style={{ maxWidth: 900 }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>💱 Exchange Rates</h1>
            <p style={{ margin: '4px 0 0', color: 'var(--text2)', fontSize: 13 }}>
              MLMT token price used in Tax Summaries, Financial P&L, and member earnings statements.
            </p>
          </div>
          <button onClick={openModal} style={btnPrimary}>Update Rates</button>
        </div>

        {/* Current rate cards */}
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 28 }}>
          {PAIRS.map(p => (
            <div key={p.key} style={{ ...card, minWidth: 190, position: 'relative' }}>
              <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 6, fontWeight: 600 }}>{p.flag} {p.label}</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--gold)', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.5px' }}>
                {fmt(cur[p.key], 4)}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 4 }}>1 MLMT = {fmt(cur[p.key], 4)} {p.desc.split(' ')[0]}</div>
            </div>
          ))}
          <div style={{ ...card, minWidth: 190 }}>
            <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 6, fontWeight: 600 }}>🕐 Last Updated</div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{fmtDateTime(cur.updated_at)}</div>
            <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 4 }}>by {cur.updated_by} · {cur.source === 'manual' ? 'Manual entry' : 'Auto-sync'}</div>
          </div>
        </div>

        {/* Reference note */}
        <div style={{ background: '#0ea5e915', border: '1px solid #0ea5e940', borderRadius: 8, padding: '12px 16px', marginBottom: 28, fontSize: 13, color: 'var(--text2)' }}>
          <strong style={{ color: '#0ea5e9' }}>📌 Rate guidance:</strong> For Norwegian tax reporting (Skattemeldingen), use Norges Bank's official rate on the relevant transaction date.
          The NOK rate set here is used as an <em>illustrative</em> value in member Tax Summary statements.
          Reference: <a href="https://www.norges-bank.no/en/topics/Statistics/exchange_rates/" target="_blank" rel="noreferrer" style={{ color: '#0ea5e9' }}>norges-bank.no</a>
        </div>

        {/* Rate history table */}
        <div style={{ background: 'var(--navy2)', borderRadius: 10, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--navy3)', fontWeight: 600, fontSize: 14 }}>
            Rate History ({data.history.length} entries)
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'var(--navy3)' }}>
                  {['Effective Date', 'MLMT → NOK', 'MLMT → EUR', 'MLMT → USD', 'Changed By', 'Note'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, whiteSpace: 'nowrap', color: 'var(--text2)', fontSize: 12 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.history.map((row, i) => (
                  <tr key={row.id} style={{ borderBottom: '1px solid var(--navy3)', background: i === 0 ? 'var(--gold)18' : 'transparent' }}>
                    <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                      {fmtDate(row.effective_date)}
                      {i === 0 && <span style={{ marginLeft: 8, fontSize: 10, background: 'var(--gold)', color: '#000', borderRadius: 4, padding: '1px 5px', fontWeight: 700 }}>CURRENT</span>}
                    </td>
                    <td style={{ padding: '10px 14px', fontVariantNumeric: 'tabular-nums', color: 'var(--gold)', fontWeight: i === 0 ? 700 : 400 }}>{fmt(row.mlmt_nok, 4)}</td>
                    <td style={{ padding: '10px 14px', fontVariantNumeric: 'tabular-nums' }}>{fmt(row.mlmt_eur, 4)}</td>
                    <td style={{ padding: '10px 14px', fontVariantNumeric: 'tabular-nums' }}>{fmt(row.mlmt_usd, 4)}</td>
                    <td style={{ padding: '10px 14px' }}>{row.changed_by}</td>
                    <td style={{ padding: '10px 14px', color: 'var(--text2)' }}>{row.note || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Impact section */}
        <div style={{ marginTop: 28, background: 'var(--navy2)', borderRadius: 10, padding: '18px 20px' }}>
          <div style={{ fontWeight: 600, marginBottom: 12, fontSize: 14 }}>📊 Rate Impact Preview</div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {[
              { label: '500 MLMT commission', mlmt: 500 },
              { label: '1,000 MLMT wallet balance', mlmt: 1000 },
              { label: '5,000 MLMT annual earnings', mlmt: 5000 },
              { label: '10,000 MLMT top earner', mlmt: 10000 },
            ].map(item => (
              <div key={item.label} style={{ flex: 1, minWidth: 180, background: 'var(--navy)', borderRadius: 8, padding: '12px 14px' }}>
                <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 6 }}>{item.label}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--gold)' }}>{(item.mlmt * cur.mlmt_nok).toLocaleString('no-NO', { maximumFractionDigits: 0 })} NOK</div>
                <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>
                  {(item.mlmt * cur.mlmt_eur).toFixed(0)} EUR · {(item.mlmt * cur.mlmt_usd).toFixed(0)} USD
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Update modal */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: '#0008', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div style={{ background: 'var(--navy2)', borderRadius: 12, padding: '28px 32px', width: 440, maxWidth: '95vw' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <span style={{ fontSize: 16, fontWeight: 700 }}>Update Exchange Rates</span>
              <button onClick={() => setModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text2)', fontSize: 20, cursor: 'pointer' }}>×</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {PAIRS.map(p => (
                <div key={p.key}>
                  <label style={labelStyle}>{p.flag} {p.label} ({p.desc})</label>
                  <input
                    type="number"
                    step="0.0001"
                    min="0"
                    placeholder={p.placeholder}
                    value={form[p.key]}
                    onChange={e => setForm(f => ({ ...f, [p.key]: e.target.value }))}
                    style={inputStyle}
                  />
                </div>
              ))}

              <div>
                <label style={labelStyle}>Effective Date</label>
                <input
                  type="date"
                  value={form.effective_date}
                  onChange={e => setForm(f => ({ ...f, effective_date: e.target.value }))}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Note (optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Q3 Norges Bank rate update"
                  value={form.note}
                  onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                  style={inputStyle}
                />
              </div>

              <div style={{ fontSize: 11, color: 'var(--text2)', background: 'var(--navy)', borderRadius: 6, padding: '8px 10px' }}>
                This will update all Tax Summaries generated from this point forward. Historic statements are unaffected.
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
                <button onClick={() => setModal(false)} style={btnSecondary}>Cancel</button>
                <button onClick={handleSave} disabled={busy || !form.mlmt_nok || !form.mlmt_eur || !form.mlmt_usd} style={{ ...btnPrimary, opacity: busy ? 0.6 : 1 }}>
                  {busy ? 'Saving…' : 'Save Rates'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, background: '#16a34a', color: '#fff', padding: '12px 20px', borderRadius: 8, fontWeight: 600, zIndex: 999, boxShadow: '0 4px 12px #0004' }}>
          {toast}
        </div>
      )}
    </AdminLayout>
  )
}
