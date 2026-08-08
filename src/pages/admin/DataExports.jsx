import { useState, useEffect, useCallback } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { getAdminDataExports, createAdminDataExport, deleteAdminDataExport } from '../../api/mlmApi'

const TEMPLATES = ['Members', 'Orders', 'Commissions', 'Payouts', 'Products', 'Inventory', 'Referrals', 'Tax Summary', 'MLM Network', 'Custom Query']
const FORMATS   = ['CSV', 'Excel (XLSX)', 'JSON']
const STATUS_COLORS = {
  pending:    { bg: '#2a2010', color: '#fbbf24', border: '#d97706' },
  running:    { bg: '#0a1628', color: '#60a5fa', border: '#1d4ed8' },
  completed:  { bg: '#052e16', color: '#86efac', border: '#166534' },
  failed:     { bg: '#2d1515', color: '#fca5a5', border: '#991b1b' },
}
const BLANK = { name: '', template: TEMPLATES[0], format: FORMATS[0], schedule: 'once', filters: '' }

export default function AdminDataExports() {
  const [exports, setExports] = useState(null)
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(BLANK)
  const [saving, setSaving] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    getAdminDataExports().then(setExports).finally(() => setLoading(false))
  }, [])
  useEffect(() => { load() }, [load])

  async function handleCreate() {
    if (!form.name) return
    setSaving(true)
    const created = await createAdminDataExport(form)
    setExports(prev => [created, ...(prev || [])])
    setModal(false)
    setForm(BLANK)
    setSaving(false)
  }

  async function remove(id) {
    await deleteAdminDataExport(id)
    setExports(prev => prev.filter(e => e.id !== id))
  }

  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 18px' }

  return (
    <AdminLayout>
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 4 }}>📤 Data Exports</div>
            <div style={{ color: 'var(--text2)', fontSize: 14 }}>Generate and schedule CSV/Excel data exports for reporting.</div>
          </div>
          <button onClick={() => { setForm(BLANK); setModal(true) }} style={{ padding: '9px 20px', borderRadius: 8, border: 'none', background: 'var(--gold)', color: '#000', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
            + New Export
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12, marginBottom: 22 }}>
          {[
            { label: 'Total Jobs', value: (exports || []).length, color: 'var(--text)' },
            { label: 'Completed', value: (exports || []).filter(e => e.status === 'completed').length, color: '#86efac' },
            { label: 'Scheduled', value: (exports || []).filter(e => e.schedule !== 'once').length, color: '#60a5fa' },
            { label: 'Failed', value: (exports || []).filter(e => e.status === 'failed').length, color: '#fca5a5' },
          ].map(s => (
            <div key={s.label} style={card}>
              <div style={{ fontSize: 26, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text2)' }}>Loading…</div>
        ) : !exports?.length ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text2)' }}>No export jobs yet.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {exports.map(ex => {
              const sc = STATUS_COLORS[ex.status] || STATUS_COLORS.pending
              return (
                <div key={ex.id} style={{ ...card, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                  <div style={{ flex: '1 1 220px' }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{ex.name}</div>
                    <div style={{ color: 'var(--text2)', fontSize: 12, marginTop: 2 }}>{ex.template} · {ex.format} · {ex.schedule === 'once' ? 'One-time' : ex.schedule}</div>
                  </div>
                  <div style={{ textAlign: 'right', minWidth: 80 }}>
                    <div style={{ fontWeight: 700 }}>{ex.rowCount ? ex.rowCount.toLocaleString() + ' rows' : '—'}</div>
                    <div style={{ fontSize: 11, color: 'var(--text2)' }}>{ex.fileSize || ''}</div>
                  </div>
                  <span style={{ padding: '3px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`, textTransform: 'capitalize' }}>{ex.status}</span>
                  <div style={{ fontSize: 11, color: 'var(--text2)', minWidth: 120 }}>Created {ex.createdAt}</div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {ex.status === 'completed' && ex.downloadUrl && (
                      <a href={ex.downloadUrl} download style={{ padding: '5px 12px', borderRadius: 6, border: 'none', background: '#1d4ed8', color: '#fff', fontSize: 12, cursor: 'pointer', textDecoration: 'none' }}>Download</a>
                    )}
                    <button onClick={() => remove(ex.id)} style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text2)', fontSize: 12, cursor: 'pointer' }}>Delete</button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {modal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: 20 }}>
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 28, width: '100%', maxWidth: 480 }}>
              <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 20 }}>New Data Export</div>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 4 }}>Export Name</div>
                <input value={form.name} placeholder="e.g. Monthly Commission Report" onChange={e => setForm(p => ({ ...p, name: e.target.value }))} style={{ width: '100%', padding: '8px 12px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 14, boxSizing: 'border-box' }} />
              </div>
              {[
                { label: 'Template', key: 'template', options: TEMPLATES },
                { label: 'Format', key: 'format', options: FORMATS },
                { label: 'Schedule', key: 'schedule', options: ['once', 'daily', 'weekly', 'monthly'] },
              ].map(f => (
                <div key={f.key} style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 4 }}>{f.label}</div>
                  <select value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} style={{ width: '100%', padding: '8px 12px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 14, boxSizing: 'border-box' }}>
                    {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              ))}
              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button onClick={handleCreate} disabled={saving || !form.name} style={{ flex: 1, padding: '10px 0', borderRadius: 8, border: 'none', background: 'var(--gold)', color: '#000', fontWeight: 700, fontSize: 14, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
                  {saving ? 'Queuing…' : 'Queue Export'}
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
