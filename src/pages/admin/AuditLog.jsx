import { useState, useEffect, useCallback } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { getAuditLog } from '../../api/mlmApi'

const CATEGORIES = [
  { value: 'all',          label: 'All Categories' },
  { value: 'commission',   label: '⚡ Commission' },
  { value: 'payout',       label: '💸 Payout' },
  { value: 'member',       label: '👤 Member' },
  { value: 'product',      label: '🛍️ Product' },
  { value: 'config',       label: '⚙️ Config' },
  { value: 'announcement', label: '📣 Announcement' },
]

const RESULTS = [
  { value: 'all',     label: 'All Results' },
  { value: 'success', label: '✅ Success' },
  { value: 'failure', label: '❌ Failure' },
]

const PAGE_SIZE = 20

function categoryBadge(cat) {
  const map = {
    commission:   { bg: '#1e3a5f', color: '#7dd3fc', label: 'Commission' },
    payout:       { bg: '#1a3a2a', color: '#6ee7b7', label: 'Payout' },
    member:       { bg: '#2a1e3a', color: '#c4b5fd', label: 'Member' },
    product:      { bg: '#3a2a1a', color: '#fbbf24', label: 'Product' },
    config:       { bg: '#1a2a3a', color: '#93c5fd', label: 'Config' },
    announcement: { bg: '#3a1a1a', color: '#fca5a5', label: 'Announcement' },
  }
  const s = map[cat] || { bg: '#2a2a2a', color: '#aaa', label: cat }
  return (
    <span style={{
      background: s.bg, color: s.color,
      padding: '2px 8px', borderRadius: '4px',
      fontSize: '11px', fontWeight: 600, letterSpacing: '0.3px',
    }}>
      {s.label}
    </span>
  )
}

function resultBadge(res) {
  const ok = res === 'success'
  return (
    <span style={{
      background: ok ? '#14532d' : '#450a0a',
      color:      ok ? '#86efac' : '#fca5a5',
      padding: '2px 8px', borderRadius: '4px',
      fontSize: '11px', fontWeight: 600,
    }}>
      {ok ? '✅ success' : '❌ failure'}
    </span>
  )
}

function fmtTs(iso) {
  const d = new Date(iso)
  return d.toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'medium', hour12: false })
}

function exportCsv(rows) {
  const cols = ['id', 'ts', 'actor', 'category', 'action', 'detail', 'target', 'result']
  const header = cols.join(',')
  const body = rows.map(r =>
    cols.map(c => `"${String(r[c] ?? '').replace(/"/g, '""')}"`).join(',')
  ).join('\n')
  const blob = new Blob([header + '\n' + body], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function AuditLog() {
  const [entries,  setEntries]  = useState([])
  const [total,    setTotal]    = useState(0)
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState('')
  const [category, setCategory] = useState('all')
  const [result,   setResult]   = useState('all')
  const [page,     setPage]     = useState(1)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getAuditLog({ category, result, search, limit: 500 })
      setEntries(data.entries || [])
      setTotal(data.total || 0)
      setPage(1)
    } catch { setEntries([]) }
    finally  { setLoading(false) }
  }, [category, result, search])

  useEffect(() => { load() }, [load])

  const paged     = entries.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const pageCount = Math.max(1, Math.ceil(entries.length / PAGE_SIZE))

  // KPI stats
  const today = new Date().toISOString().slice(0, 10)
  const todayEntries  = entries.filter(e => e.ts.startsWith(today))
  const totalEntries  = entries.length
  const failCount     = entries.filter(e => e.result === 'failure').length
  const todayFails    = todayEntries.filter(e => e.result === 'failure').length
  const actorSet      = new Set(entries.map(e => e.actor))
  const activeActors  = actorSet.size

  const cardStyle = {
    background: 'var(--navy2)',
    border: '1px solid var(--border)',
    borderRadius: '10px',
    padding: '18px 22px',
  }
  const labelStyle = { fontSize: '11px', color: 'var(--text2)', letterSpacing: '0.5px', marginBottom: '6px' }
  const valueStyle = { fontSize: '24px', fontWeight: 700, color: 'var(--cream)' }

  return (
    <AdminLayout>
      <div style={{ maxWidth: '1100px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: 'var(--cream)' }}>🔍 Audit Log</h1>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text2)' }}>
              Immutable record of all admin and system actions
            </p>
          </div>
          <button
            className="btn btn-outline btn-sm"
            onClick={() => exportCsv(entries)}
            disabled={entries.length === 0}
          >
            ⬇ Export CSV
          </button>
        </div>

        {/* KPI cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px', marginBottom: '28px' }}>
          <div style={cardStyle}>
            <div style={labelStyle}>TOTAL ENTRIES</div>
            <div style={valueStyle}>{loading ? '–' : totalEntries}</div>
          </div>
          <div style={cardStyle}>
            <div style={labelStyle}>ACTIONS TODAY</div>
            <div style={valueStyle}>{loading ? '–' : todayEntries.length}</div>
          </div>
          <div style={cardStyle}>
            <div style={labelStyle}>FAILURES (ALL TIME)</div>
            <div style={{ ...valueStyle, color: failCount > 0 ? '#fca5a5' : 'var(--cream)' }}>
              {loading ? '–' : failCount}
            </div>
          </div>
          <div style={cardStyle}>
            <div style={labelStyle}>FAILURES TODAY</div>
            <div style={{ ...valueStyle, color: todayFails > 0 ? '#fca5a5' : 'var(--cream)' }}>
              {loading ? '–' : todayFails}
            </div>
          </div>
          <div style={cardStyle}>
            <div style={labelStyle}>DISTINCT ACTORS</div>
            <div style={valueStyle}>{loading ? '–' : activeActors}</div>
          </div>
        </div>

        {/* Filters */}
        <div style={{
          background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: '10px',
          padding: '16px 20px', marginBottom: '20px',
          display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center',
        }}>
          <input
            placeholder="Search action, detail, actor, target…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              flex: '1 1 220px', minWidth: '180px',
              padding: '8px 12px', borderRadius: '6px',
              border: '1px solid var(--border)', background: 'var(--navy)',
              color: 'var(--cream)', fontSize: '13px',
            }}
          />
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            style={{
              padding: '8px 12px', borderRadius: '6px',
              border: '1px solid var(--border)', background: 'var(--navy)',
              color: 'var(--cream)', fontSize: '13px',
            }}
          >
            {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          <select
            value={result}
            onChange={e => setResult(e.target.value)}
            style={{
              padding: '8px 12px', borderRadius: '6px',
              border: '1px solid var(--border)', background: 'var(--navy)',
              color: 'var(--cream)', fontSize: '13px',
            }}
          >
            {RESULTS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
          <span style={{ fontSize: '12px', color: 'var(--text2)', marginLeft: 'auto' }}>
            {loading ? 'Loading…' : `${entries.length} entries`}
          </span>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto', borderRadius: '10px', border: '1px solid var(--border)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: 'var(--navy2)', borderBottom: '1px solid var(--border)' }}>
                {['Timestamp', 'Actor', 'Category', 'Action', 'Detail', 'Target', 'Result'].map(h => (
                  <th key={h} style={{
                    padding: '10px 14px', textAlign: 'left',
                    fontSize: '11px', fontWeight: 600, color: 'var(--text2)',
                    letterSpacing: '0.5px', whiteSpace: 'nowrap',
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: 'var(--text2)' }}>
                    Loading…
                  </td>
                </tr>
              ) : paged.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: 'var(--text2)' }}>
                    No entries match your filters.
                  </td>
                </tr>
              ) : paged.map((e, i) => (
                <tr
                  key={e.id}
                  style={{
                    borderBottom: '1px solid var(--border)',
                    background: i % 2 === 0 ? 'var(--navy)' : 'var(--navy2)',
                  }}
                >
                  <td style={{ padding: '10px 14px', color: 'var(--text2)', whiteSpace: 'nowrap', fontFamily: 'monospace', fontSize: '12px' }}>
                    {fmtTs(e.ts)}
                  </td>
                  <td style={{ padding: '10px 14px', color: 'var(--cream)', whiteSpace: 'nowrap', fontSize: '12px' }}>
                    {e.actor}
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    {categoryBadge(e.category)}
                  </td>
                  <td style={{ padding: '10px 14px', color: 'var(--gold)', fontWeight: 600, fontSize: '11px', letterSpacing: '0.3px', whiteSpace: 'nowrap', fontFamily: 'monospace' }}>
                    {e.action}
                  </td>
                  <td style={{ padding: '10px 14px', color: 'var(--text)', maxWidth: '280px' }}>
                    {e.detail}
                  </td>
                  <td style={{ padding: '10px 14px', color: 'var(--text2)', fontFamily: 'monospace', fontSize: '12px' }}>
                    {e.target}
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    {resultBadge(e.result)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pageCount > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '20px' }}>
            <button
              className="btn btn-outline btn-sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              ← Prev
            </button>
            <span style={{ fontSize: '13px', color: 'var(--text2)' }}>
              Page {page} of {pageCount}
            </span>
            <button
              className="btn btn-outline btn-sm"
              onClick={() => setPage(p => Math.min(pageCount, p + 1))}
              disabled={page === pageCount}
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
