import { useState } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { getCommissionPreview } from '../../api/mlmApi'
import { COMMISSION_RUNS } from '../../data/mock'

const RANK_COLOR = {
  Platinum: '#a78bfa',
  Gold:     'var(--gold)',
  Silver:   '#94a3b8',
  Bronze:   '#cd7f32',
  Unranked: 'var(--text2)',
}

function RankBadge({ rank }) {
  return (
    <span style={{
      display: 'inline-block', padding: '2px 8px', borderRadius: '10px',
      fontSize: '11px', fontWeight: 700, letterSpacing: '0.04em',
      background: 'rgba(255,255,255,0.07)', color: RANK_COLOR[rank] || 'var(--text2)',
    }}>
      {rank}
    </span>
  )
}

function BonusBar({ dsb, sb, lc, pb, total }) {
  if (!total) return <span style={{ color: 'var(--text2)', fontSize: '12px' }}>—</span>
  const segments = [
    { label: 'Direct Sales', value: dsb, color: '#22c55e' },
    { label: 'Sponsor',      value: sb,  color: '#3b82f6' },
    { label: 'Level',        value: lc,  color: '#f59e0b' },
    { label: 'Pairing',      value: pb,  color: '#a78bfa' },
  ]
  return (
    <div style={{ display: 'flex', height: '8px', borderRadius: '4px', overflow: 'hidden', minWidth: '80px' }}>
      {segments.map(s => s.value > 0 && (
        <div key={s.label} title={`${s.label}: ${s.value.toLocaleString()} MLMT`}
          style={{ width: `${(s.value / total) * 100}%`, background: s.color }} />
      ))}
    </div>
  )
}

function exportCSV(rows, totals) {
  const headers = ['Member ID', 'Name', 'Rank', 'PV', 'GV', 'Direct Sales Bonus', 'Sponsor Bonus', 'Level Commission', 'Pairing Bonus', 'Total (MLMT)']
  const dataRows = rows.map(r => [
    r.id, r.name, r.rank, r.pv, r.gv,
    r.directSalesBonus, r.sponsorBonus, r.levelCommission, r.pairingBonus, r.total,
  ])
  dataRows.push(['', 'TOTALS', '', '', '',
    totals.directSalesBonus, totals.sponsorBonus, totals.levelCommission, totals.pairingBonus, totals.grandTotal,
  ])
  const csv = [headers, ...dataRows].map(r => r.join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `commission-preview-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function CommissionPreview() {
  const [preview, setPreview]   = useState(null)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState(null)
  const [search, setSearch]     = useState('')
  const [sortKey, setSortKey]   = useState('total')
  const [sortAsc, setSortAsc]   = useState(false)
  const [expandedId, setExpandedId] = useState(null)

  const lastRun = COMMISSION_RUNS.find(r => r.status === 'Completed') || null

  async function runPreview() {
    setLoading(true)
    setError(null)
    setPreview(null)
    try {
      const data = await getCommissionPreview()
      setPreview(data)
    } catch (e) {
      setError(e.message || 'Preview failed')
    } finally {
      setLoading(false)
    }
  }

  function toggleSort(key) {
    if (sortKey === key) setSortAsc(a => !a)
    else { setSortKey(key); setSortAsc(false) }
  }

  const filtered = (preview?.rows || [])
    .filter(r => !search || r.name.toLowerCase().includes(search.toLowerCase()) || r.id.toLowerCase().includes(search.toLowerCase()))
    .slice()
    .sort((a, b) => {
      const v = sortAsc ? 1 : -1
      if (typeof a[sortKey] === 'number') return v * (a[sortKey] - b[sortKey])
      return v * String(a[sortKey]).localeCompare(String(b[sortKey]))
    })

  const totals = preview?.totals

  const SortTh = ({ col, children, right }) => (
    <th
      onClick={() => toggleSort(col)}
      style={{ cursor: 'pointer', userSelect: 'none', textAlign: right ? 'right' : undefined }}
    >
      {children}{sortKey === col ? (sortAsc ? ' ▲' : ' ▼') : ''}
    </th>
  )

  return (
    <AdminLayout>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--cream)', margin: 0 }}>Commission Dry-Run Preview</h1>
            <p style={{ fontSize: '13px', color: 'var(--text2)', marginTop: '4px' }}>
              Simulate payout based on current member PV/GV — no tokens are issued until you run for real.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {preview && (
              <button className="btn btn-outline btn-sm" onClick={() => exportCSV(preview.rows, preview.totals)}>
                ⬇ Export CSV
              </button>
            )}
            <button className="btn btn-primary" onClick={runPreview} disabled={loading} style={{ minWidth: '160px' }}>
              {loading ? '⏳ Calculating…' : preview ? '🔄 Re-run Preview' : '▶ Run Preview'}
            </button>
          </div>
        </div>

        {/* Last real run comparison */}
        {lastRun && (
          <div className="card" style={{ marginBottom: '20px', padding: '14px 18px', display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Last actual run</div>
              <div style={{ fontWeight: 700, color: 'var(--cream)', fontSize: '15px' }}>{lastRun.id}</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Date</div>
              <div style={{ color: 'var(--cream)' }}>{new Date(lastRun.started_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Members</div>
              <div style={{ color: 'var(--cream)' }}>{lastRun.members_processed.toLocaleString()}</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total paid</div>
              <div style={{ fontWeight: 700, color: 'var(--gold)' }}>{lastRun.total_paid.toLocaleString()} MLMT</div>
            </div>
            {preview && (
              <>
                <div style={{ width: '1px', background: 'var(--border)', alignSelf: 'stretch' }} />
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>This preview</div>
                  <div style={{ fontWeight: 700, color: totals.grandTotal > lastRun.total_paid ? '#22c55e' : '#f87171', fontSize: '15px' }}>
                    {totals.grandTotal.toLocaleString()} MLMT
                    <span style={{ fontSize: '12px', fontWeight: 400, marginLeft: '6px' }}>
                      ({totals.grandTotal >= lastRun.total_paid ? '+' : ''}
                      {(((totals.grandTotal - lastRun.total_paid) / lastRun.total_paid) * 100).toFixed(1)}%)
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="card" style={{ textAlign: 'center', padding: '48px', color: 'var(--text2)' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>⚡</div>
            <div style={{ fontSize: '15px' }}>Simulating commission calculation across all active members…</div>
            <div style={{ fontSize: '13px', marginTop: '6px' }}>This won't issue any tokens.</div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="card" style={{ color: '#f87171', padding: '20px', textAlign: 'center' }}>
            Preview failed: {error}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && !preview && (
          <div className="card" style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--text2)' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🧮</div>
            <div style={{ fontSize: '17px', fontWeight: 600, color: 'var(--cream)', marginBottom: '8px' }}>Commission Dry-Run Preview</div>
            <div style={{ fontSize: '14px', maxWidth: '420px', margin: '0 auto 24px' }}>
              Click <strong style={{ color: 'var(--cream)' }}>Run Preview</strong> to simulate what this week's commission run would pay out,
              based on members' current PV and GV. No tokens will be issued.
            </div>
            <button className="btn btn-primary" onClick={runPreview}>▶ Run Preview</button>
          </div>
        )}

        {/* Results */}
        {preview && !loading && (
          <>
            {/* KPI cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '20px' }}>
              {[
                { label: 'Members in Preview',  value: preview.members_in_preview,              suffix: '',      color: 'var(--cream)' },
                { label: 'Direct Sales Bonus',   value: totals.directSalesBonus.toLocaleString(), suffix: ' MLMT', color: '#22c55e' },
                { label: 'Sponsor Bonus',        value: totals.sponsorBonus.toLocaleString(),     suffix: ' MLMT', color: '#3b82f6' },
                { label: 'Level Commission',     value: totals.levelCommission.toLocaleString(),  suffix: ' MLMT', color: '#f59e0b' },
                { label: 'Pairing Bonus',        value: totals.pairingBonus.toLocaleString(),     suffix: ' MLMT', color: '#a78bfa' },
                { label: 'Grand Total',          value: totals.grandTotal.toLocaleString(),       suffix: ' MLMT', color: 'var(--gold)' },
              ].map(c => (
                <div key={c.label} className="card" style={{ padding: '14px 16px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>{c.label}</div>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: c.color }}>{c.value}<span style={{ fontSize: '12px', fontWeight: 400 }}>{c.suffix}</span></div>
                </div>
              ))}
            </div>

            {/* Bonus breakdown bar */}
            <div className="card" style={{ marginBottom: '20px', padding: '16px 18px' }}>
              <div style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '10px', fontWeight: 600 }}>Payout Allocation</div>
              <div style={{ display: 'flex', height: '16px', borderRadius: '8px', overflow: 'hidden', marginBottom: '12px' }}>
                {[
                  { v: totals.directSalesBonus, c: '#22c55e', l: 'Direct Sales' },
                  { v: totals.sponsorBonus,     c: '#3b82f6', l: 'Sponsor' },
                  { v: totals.levelCommission,  c: '#f59e0b', l: 'Level' },
                  { v: totals.pairingBonus,     c: '#a78bfa', l: 'Pairing' },
                ].map(s => totals.grandTotal > 0 && (
                  <div key={s.l}
                    title={`${s.l}: ${s.v.toLocaleString()} MLMT (${((s.v / totals.grandTotal) * 100).toFixed(1)}%)`}
                    style={{ width: `${(s.v / totals.grandTotal) * 100}%`, background: s.c }} />
                ))}
              </div>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                {[
                  { v: totals.directSalesBonus, c: '#22c55e', l: 'Direct Sales' },
                  { v: totals.sponsorBonus,     c: '#3b82f6', l: 'Sponsor' },
                  { v: totals.levelCommission,  c: '#f59e0b', l: 'Level' },
                  { v: totals.pairingBonus,     c: '#a78bfa', l: 'Pairing' },
                ].map(s => (
                  <div key={s.l} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: s.c, flexShrink: 0 }} />
                    <span style={{ color: 'var(--text2)' }}>{s.l}</span>
                    <span style={{ color: 'var(--cream)', fontWeight: 600 }}>
                      {totals.grandTotal > 0 ? ((s.v / totals.grandTotal) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Search */}
            <div style={{ marginBottom: '14px' }}>
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search member name or ID…"
                style={{ width: '100%', maxWidth: '340px', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--cream)' }}
              />
            </div>

            {/* Table */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <SortTh col="id">ID</SortTh>
                      <SortTh col="name">Name</SortTh>
                      <SortTh col="rank">Rank</SortTh>
                      <SortTh col="pv" right>PV</SortTh>
                      <SortTh col="directSalesBonus" right>Direct Sales</SortTh>
                      <SortTh col="sponsorBonus" right>Sponsor</SortTh>
                      <SortTh col="levelCommission" right>Level</SortTh>
                      <SortTh col="pairingBonus" right>Pairing</SortTh>
                      <SortTh col="total" right>Total</SortTh>
                      <th>Breakdown</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 && (
                      <tr><td colSpan={10} style={{ textAlign: 'center', color: 'var(--text2)', padding: '32px' }}>No members match your search.</td></tr>
                    )}
                    {filtered.map(r => (
                      <>
                        <tr key={r.id} style={{ cursor: 'pointer' }} onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}>
                          <td style={{ color: 'var(--text2)', fontFamily: 'monospace', fontSize: '12px' }}>{r.id}</td>
                          <td style={{ color: 'var(--cream)', fontWeight: 600 }}>{r.name}</td>
                          <td><RankBadge rank={r.rank} /></td>
                          <td style={{ textAlign: 'right', color: 'var(--text2)' }}>{r.pv}</td>
                          <td style={{ textAlign: 'right', color: '#22c55e' }}>{r.directSalesBonus > 0 ? r.directSalesBonus.toLocaleString() : '—'}</td>
                          <td style={{ textAlign: 'right', color: '#3b82f6' }}>{r.sponsorBonus > 0 ? r.sponsorBonus.toLocaleString() : '—'}</td>
                          <td style={{ textAlign: 'right', color: '#f59e0b' }}>{r.levelCommission > 0 ? r.levelCommission.toLocaleString() : '—'}</td>
                          <td style={{ textAlign: 'right', color: '#a78bfa' }}>{r.pairingBonus > 0 ? r.pairingBonus.toLocaleString() : '—'}</td>
                          <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--gold)' }}>{r.total.toLocaleString()}</td>
                          <td style={{ minWidth: '90px' }}>
                            <BonusBar dsb={r.directSalesBonus} sb={r.sponsorBonus} lc={r.levelCommission} pb={r.pairingBonus} total={r.total} />
                          </td>
                        </tr>
                        {expandedId === r.id && (
                          <tr key={`${r.id}-exp`} style={{ background: 'rgba(255,255,255,0.03)' }}>
                            <td colSpan={10} style={{ padding: '12px 16px' }}>
                              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', fontSize: '13px' }}>
                                {[
                                  { label: 'Direct Sales Bonus (20% of PV)', value: r.directSalesBonus, color: '#22c55e' },
                                  { label: 'Sponsor Bonus (10% of direct recruits\' PV)', value: r.sponsorBonus, color: '#3b82f6' },
                                  { label: 'Level Commission (L2: 5%, L3: 3%)', value: r.levelCommission, color: '#f59e0b' },
                                  { label: 'Pairing Bonus (weak-leg GV × rate)', value: r.pairingBonus, color: '#a78bfa' },
                                ].map(b => (
                                  <div key={b.label}>
                                    <div style={{ color: 'var(--text2)', marginBottom: '2px' }}>{b.label}</div>
                                    <div style={{ fontWeight: 700, color: b.color }}>{b.value.toLocaleString()} MLMT</div>
                                  </div>
                                ))}
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    ))}
                    {/* Totals row */}
                    {filtered.length > 0 && (
                      <tr style={{ borderTop: '2px solid var(--border)', background: 'rgba(255,255,255,0.04)' }}>
                        <td colSpan={4} style={{ fontWeight: 700, color: 'var(--text2)' }}>
                          {search ? `Subtotal (${filtered.length} members)` : 'Grand Total'}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: '#22c55e' }}>
                          {filtered.reduce((s, r) => s + r.directSalesBonus, 0).toLocaleString()}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: '#3b82f6' }}>
                          {filtered.reduce((s, r) => s + r.sponsorBonus, 0).toLocaleString()}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: '#f59e0b' }}>
                          {filtered.reduce((s, r) => s + r.levelCommission, 0).toLocaleString()}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: '#a78bfa' }}>
                          {filtered.reduce((s, r) => s + r.pairingBonus, 0).toLocaleString()}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--gold)', fontSize: '15px' }}>
                          {filtered.reduce((s, r) => s + r.total, 0).toLocaleString()} MLMT
                        </td>
                        <td />
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div style={{ fontSize: '12px', color: 'var(--text2)', marginTop: '10px' }}>
              Preview generated at {new Date(preview.generated_at).toUTCString().replace(' GMT', ' UTC')} · Includes only Active members · Rates: Direct Sales 20% PV · Sponsor 10% of direct-recruit PV · Level L2 5% / L3 3% · Pairing 5–8% of weak-leg GV
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  )
}
