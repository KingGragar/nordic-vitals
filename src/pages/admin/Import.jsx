import { useState, useRef, useCallback } from 'react'
import { importMembers } from '../../api/mlmApi'

const REQUIRED_COLS = ['email', 'name']
const OPTIONAL_COLS = ['sponsor_id', 'phone', 'country', 'rank', 'pv', 'joined']
const ALL_COLS      = [...REQUIRED_COLS, ...OPTIONAL_COLS]
const RANK_VALUES   = ['', 'unranked', 'bronze', 'silver', 'gold', 'platinum']

const SAMPLE_CSV = `name,email,sponsor_id,phone,country,rank,pv,joined
Astrid Larsen,astrid@example.com,NV-10001,+4791234567,Norway,bronze,120,2026-01-15
Tor Andersen,tor@example.com,NV-10001,+4798765432,Sweden,silver,340,2025-11-20
Ingrid Holm,ingrid@example.com,NV-10002,,Norway,,80,
`

function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/).filter(Boolean)
  if (lines.length < 2) return { headers: [], rows: [] }
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/\s+/g, '_'))
  const rows = lines.slice(1).map((line, i) => {
    const vals = line.split(',').map(v => v.trim())
    const obj = {}
    headers.forEach((h, j) => { obj[h] = vals[j] ?? '' })
    obj.__rowNum = i + 2
    return obj
  })
  return { headers, rows }
}

function validateRow(row, colMap) {
  const errs = []
  const email = row[colMap.email] ?? ''
  const name  = row[colMap.name]  ?? ''
  if (!email) errs.push('Email required')
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.push('Invalid email')
  if (!name) errs.push('Name required')
  const rank = (row[colMap.rank] ?? '').toLowerCase()
  if (rank && !RANK_VALUES.includes(rank)) errs.push(`Unknown rank "${rank}"`)
  const pv = row[colMap.pv] ?? ''
  if (pv && isNaN(Number(pv))) errs.push('PV must be numeric')
  const joined = row[colMap.joined] ?? ''
  if (joined && !/^\d{4}-\d{2}-\d{2}$/.test(joined)) errs.push('joined must be YYYY-MM-DD')
  return errs
}

function downloadCSV(rows, filename) {
  const headers = Object.keys(rows[0]).filter(k => k !== '__rowNum')
  const lines = [headers.join(','), ...rows.map(r => headers.map(h => `"${(r[h]??'').toString().replace(/"/g,'""')}"`).join(','))]
  const blob = new Blob([lines.join('\n')], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

export default function AdminImport() {
  const fileRef = useRef(null)
  const [drag, setDrag] = useState(false)
  const [parsed, setParsed] = useState(null)
  const [colMap, setColMap] = useState({})
  const [validationDone, setValidationDone] = useState(false)
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  function resetAll() {
    setParsed(null)
    setColMap({})
    setValidationDone(false)
    setResult(null)
    setError('')
  }

  function handleFile(file) {
    if (!file) return
    if (!file.name.endsWith('.csv')) { setError('Please upload a .csv file'); return }
    const reader = new FileReader()
    reader.onload = e => {
      const { headers, rows } = parseCSV(e.target.result)
      if (!headers.length) { setError('CSV appears empty or malformed'); return }
      // Auto-map columns
      const auto = {}
      ALL_COLS.forEach(col => {
        const match = headers.find(h => h === col || h.replace(/[-\s]/g, '_') === col)
        if (match) auto[col] = match
      })
      setColMap(auto)
      setParsed({ headers, rows, fileName: file.name })
      setValidationDone(false)
      setResult(null)
      setError('')
    }
    reader.readAsText(file)
  }

  const onDrop = useCallback(e => {
    e.preventDefault(); setDrag(false)
    handleFile(e.dataTransfer.files[0])
  }, [])

  function runValidation() { setValidationDone(true) }

  const rowsWithErrors = validationDone && parsed
    ? parsed.rows.map(row => ({ row, errs: validateRow(row, colMap) }))
    : []
  const validRows   = rowsWithErrors.filter(r => !r.errs.length).map(r => r.row)
  const invalidRows = rowsWithErrors.filter(r => r.errs.length)

  async function doImport() {
    if (!validRows.length) return
    setImporting(true)
    try {
      const mapped = validRows.map(row => ({
        name:       row[colMap.name]       || '',
        email:      row[colMap.email]      || '',
        sponsor_id: row[colMap.sponsor_id] || '',
        phone:      row[colMap.phone]      || '',
        country:    row[colMap.country]    || '',
        rank:       (row[colMap.rank]      || 'unranked').toLowerCase(),
        pv:         Number(row[colMap.pv]) || 0,
        joined:     row[colMap.joined]     || new Date().toISOString().slice(0, 10),
      }))
      const res = await importMembers(mapped)
      setResult(res)
    } catch(e) {
      setError(`Import failed: ${e.message}`)
    } finally {
      setImporting(false)
    }
  }

  const card = (label, val, sub) => (
    <div style={{ background: 'var(--navy2)', borderRadius: 8, padding: '12px 18px', flex: 1, minWidth: 110 }}>
      <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--gold)' }}>{val}</div>
      <div style={{ fontSize: 13, color: '#ccc' }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>{sub}</div>}
    </div>
  )

  // ── Result screen ──────────────────────────────────────────────
  if (result) return (
    <div style={{ padding: 24, maxWidth: 780 }}>
      <h2 style={{ color: 'var(--gold)', marginBottom: 20 }}>📥 Import Complete</h2>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
        {card('Imported', result.imported, 'new members')}
        {card('Skipped', result.skipped, 'already exist')}
        {card('Failed', result.failed, 'unexpected error')}
        {card('Total sent', result.imported + result.skipped + result.failed)}
      </div>
      {result.failedRows?.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ color: '#f87171', marginBottom: 8, fontWeight: 600 }}>
            {result.failedRows.length} rows failed during import:
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'var(--navy2)' }}>
                  <th style={th}>Email</th><th style={th}>Name</th><th style={th}>Reason</th>
                </tr>
              </thead>
              <tbody>
                {result.failedRows.map((r, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--navy3)' }}>
                    <td style={td}>{r.email}</td>
                    <td style={td}>{r.name}</td>
                    <td style={{ ...td, color: '#f87171' }}>{r.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button onClick={() => downloadCSV(result.failedRows.map(r => ({ email: r.email, name: r.name, reason: r.reason })), 'import-failures.csv')}
            style={{ ...btn, marginTop: 12, background: '#374151' }}>
            ⬇ Download failure report
          </button>
        </div>
      )}
      <button onClick={resetAll} style={btn}>↩ Import another file</button>
    </div>
  )

  // ── Drop zone ──────────────────────────────────────────────────
  if (!parsed) return (
    <div style={{ padding: 24, maxWidth: 700 }}>
      <h2 style={{ color: 'var(--gold)', marginBottom: 4 }}>📥 Bulk Member Import</h2>
      <p style={{ color: '#aaa', marginBottom: 24, fontSize: 14 }}>
        Upload a CSV to seed your member network. Required columns: <strong>email</strong>, <strong>name</strong>.
        Optional: sponsor_id, phone, country, rank, pv, joined (YYYY-MM-DD).
      </p>
      {error && <div style={{ color: '#f87171', marginBottom: 16 }}>{error}</div>}
      <div
        onClick={() => fileRef.current.click()}
        onDragOver={e => { e.preventDefault(); setDrag(true) }}
        onDragLeave={() => setDrag(false)}
        onDrop={onDrop}
        style={{
          border: `2px dashed ${drag ? 'var(--gold)' : '#4b5563'}`,
          borderRadius: 12, padding: '48px 32px', textAlign: 'center',
          cursor: 'pointer', background: drag ? 'rgba(212,175,55,0.07)' : 'var(--navy2)',
          transition: 'all .2s',
        }}
      >
        <div style={{ fontSize: 40, marginBottom: 12 }}>📂</div>
        <div style={{ fontSize: 15, color: '#e5e7eb', marginBottom: 6 }}>
          Drag & drop your CSV here, or click to browse
        </div>
        <div style={{ fontSize: 12, color: '#6b7280' }}>Accepts .csv files only</div>
        <input ref={fileRef} type="file" accept=".csv" style={{ display: 'none' }}
          onChange={e => handleFile(e.target.files[0])} />
      </div>
      <div style={{ marginTop: 20 }}>
        <div style={{ fontSize: 13, color: '#9ca3af', marginBottom: 8 }}>
          Don't have a template?{' '}
          <button
            onClick={() => { const blob = new Blob([SAMPLE_CSV], { type: 'text/csv' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'nv-member-import-template.csv'; a.click() }}
            style={{ background: 'none', border: 'none', color: 'var(--gold)', cursor: 'pointer', textDecoration: 'underline', padding: 0, fontSize: 13 }}>
            Download sample CSV
          </button>
        </div>
      </div>
    </div>
  )

  // ── Column mapping + preview ───────────────────────────────────
  const missingRequired = REQUIRED_COLS.filter(c => !colMap[c])
  const previewRows = parsed.rows.slice(0, 5)
  const errMap = validationDone
    ? Object.fromEntries(rowsWithErrors.map(({ row, errs }) => [row.__rowNum, errs]))
    : {}

  return (
    <div style={{ padding: 24, maxWidth: 900 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
        <h2 style={{ color: 'var(--gold)', margin: 0 }}>📥 Bulk Member Import</h2>
        <span style={{ background: 'var(--navy2)', padding: '2px 10px', borderRadius: 12, fontSize: 13, color: '#ccc' }}>
          {parsed.fileName} — {parsed.rows.length} rows
        </span>
      </div>
      <button onClick={resetAll} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: 13, padding: 0, marginBottom: 20 }}>
        ← Upload different file
      </button>

      {/* Column mapping */}
      <div style={{ background: 'var(--navy2)', borderRadius: 10, padding: 18, marginBottom: 24 }}>
        <div style={{ fontWeight: 600, color: '#e5e7eb', marginBottom: 12 }}>Column Mapping</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 12 }}>
          {ALL_COLS.map(col => (
            <div key={col}>
              <label style={{ fontSize: 12, color: REQUIRED_COLS.includes(col) ? 'var(--gold)' : '#9ca3af', display: 'block', marginBottom: 4 }}>
                {col}{REQUIRED_COLS.includes(col) ? ' *' : ''}
              </label>
              <select
                value={colMap[col] || ''}
                onChange={e => setColMap(m => ({ ...m, [col]: e.target.value || undefined }))}
                style={{ width: '100%', background: 'var(--navy3)', color: '#e5e7eb', border: '1px solid #374151', borderRadius: 6, padding: '6px 8px', fontSize: 13 }}
              >
                <option value="">— not mapped —</option>
                {parsed.headers.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
          ))}
        </div>
        {missingRequired.length > 0 && (
          <div style={{ color: '#f87171', fontSize: 13, marginTop: 10 }}>
            Required columns not mapped: {missingRequired.join(', ')}
          </div>
        )}
      </div>

      {/* Preview */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontWeight: 600, color: '#e5e7eb', marginBottom: 10 }}>
          Preview (first {Math.min(5, parsed.rows.length)} of {parsed.rows.length} rows)
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--navy2)' }}>
                <th style={th}>#</th>
                {ALL_COLS.map(col => <th key={col} style={th}>{col}{REQUIRED_COLS.includes(col) ? ' *' : ''}</th>)}
                {validationDone && <th style={th}>Status</th>}
              </tr>
            </thead>
            <tbody>
              {previewRows.map(row => {
                const rowErrs = errMap[row.__rowNum] || []
                const hasErr = rowErrs.length > 0
                return (
                  <tr key={row.__rowNum} style={{ borderBottom: '1px solid var(--navy3)', background: hasErr ? 'rgba(248,113,113,0.07)' : 'transparent' }}>
                    <td style={{ ...td, color: '#6b7280' }}>{row.__rowNum}</td>
                    {ALL_COLS.map(col => (
                      <td key={col} style={td}>{row[colMap[col]] ?? <span style={{ color: '#4b5563' }}>—</span>}</td>
                    ))}
                    {validationDone && (
                      <td style={td}>
                        {hasErr
                          ? <span style={{ color: '#f87171', fontSize: 12 }}>{rowErrs[0]}{rowErrs.length > 1 ? ` +${rowErrs.length - 1}` : ''}</span>
                          : <span style={{ color: '#4ade80', fontSize: 12 }}>✓ OK</span>}
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Validation summary */}
      {validationDone && (
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
          {card('Valid rows', validRows.length, 'ready to import')}
          {card('Invalid rows', invalidRows.length, 'will be skipped')}
          {card('Total', parsed.rows.length)}
          {invalidRows.length > 0 && (
            <button onClick={() => downloadCSV(invalidRows.map(({ row, errs }) => ({ ...row, errors: errs.join('; ') })), 'import-validation-errors.csv')}
              style={{ ...btn, alignSelf: 'center', background: '#374151' }}>
              ⬇ Download error rows
            </button>
          )}
        </div>
      )}

      {error && <div style={{ color: '#f87171', marginBottom: 16 }}>{error}</div>}

      {/* Actions */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        {!validationDone ? (
          <button
            onClick={runValidation}
            disabled={missingRequired.length > 0}
            style={{ ...btn, opacity: missingRequired.length ? 0.4 : 1 }}>
            ✅ Validate {parsed.rows.length} rows
          </button>
        ) : (
          <button
            onClick={doImport}
            disabled={importing || !validRows.length}
            style={{ ...btn, opacity: !validRows.length ? 0.4 : 1 }}>
            {importing ? '⏳ Importing…' : `📥 Import ${validRows.length} valid member${validRows.length === 1 ? '' : 's'}`}
          </button>
        )}
        {validationDone && (
          <button onClick={() => setValidationDone(false)} style={{ ...btn, background: '#374151' }}>
            Re-map columns
          </button>
        )}
      </div>

      <div style={{ marginTop: 16, fontSize: 12, color: '#6b7280' }}>
        {invalidRows.length > 0 && validationDone
          ? `${invalidRows.length} invalid row${invalidRows.length === 1 ? '' : 's'} will be skipped. Import will proceed for valid rows only.`
          : 'Import generates temporary passwords and queues welcome emails for each new member.'}
      </div>
    </div>
  )
}

const th = { padding: '8px 12px', textAlign: 'left', color: '#9ca3af', fontWeight: 600, whiteSpace: 'nowrap', borderBottom: '1px solid var(--navy3)' }
const td = { padding: '7px 12px', color: '#e5e7eb', verticalAlign: 'top' }
const btn = { background: 'var(--gold)', color: '#111', border: 'none', borderRadius: 7, padding: '10px 22px', fontWeight: 700, fontSize: 14, cursor: 'pointer' }
