import { useState, useEffect, useCallback } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { getAdminRecruitmentPipeline } from '../../api/mlmApi'

const STAGES = ['lead', 'contacted', 'interested', 'trial', 'enrolled', 'dropped']
const STAGE_COLOR = { lead: '#6b7280', contacted: '#3b82f6', interested: '#f59e0b', trial: '#8b5cf6', enrolled: '#22c55e', dropped: '#ef4444' }
const STAGE_BG    = { lead: '#1f2937', contacted: '#1e3a5f', interested: '#78350f', trial: '#3b0764', enrolled: '#14532d', dropped: '#7f1d1d' }
const STAGE_ICON  = { lead: '👤', contacted: '📧', interested: '🤔', trial: '🧪', enrolled: '✅', dropped: '❌' }

export default function AdminRecruitmentPipeline() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('kanban')
  const [stageFilter, setStageFilter] = useState('all')

  const load = useCallback(() => {
    setLoading(true)
    getAdminRecruitmentPipeline().then(setData).finally(() => setLoading(false))
  }, [])
  useEffect(() => { load() }, [load])

  const prospects = data?.prospects || []
  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 18px' }
  const filtered = stageFilter === 'all' ? prospects : prospects.filter(p => p.stage === stageFilter)

  const kpiTiles = [
    { label: 'Total in Funnel', value: prospects.filter(p => p.stage !== 'dropped').length, color: 'var(--gold)' },
    { label: 'Enrolled (30d)', value: prospects.filter(p => p.stage === 'enrolled').length, color: '#86efac' },
    { label: 'Conversion Rate', value: prospects.length ? `${Math.round((prospects.filter(p => p.stage === 'enrolled').length / prospects.length) * 100)}%` : '0%', color: '#93c5fd' },
    { label: 'Avg. Days to Enroll', value: data?.avgDaysToEnroll ?? '—', color: '#fbbf24' },
  ]

  return (
    <AdminLayout>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 4 }}>🔀 Recruitment Pipeline</div>
            <div style={{ color: 'var(--text2)', fontSize: 14 }}>Track prospects through every stage of the recruitment funnel across all members.</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {['kanban', 'list'].map(v => (
              <button key={v} onClick={() => setView(v)} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border)', background: view === v ? 'var(--gold)' : 'transparent', color: view === v ? '#000' : 'var(--text)', fontSize: 13, cursor: 'pointer', fontWeight: view === v ? 700 : 400, textTransform: 'capitalize' }}>
                {v === 'kanban' ? '🗂 Kanban' : '📋 List'}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12, marginBottom: 24 }}>
          {kpiTiles.map(t => (
            <div key={t.label} style={card}>
              <div style={{ fontSize: 26, fontWeight: 800, color: t.color }}>{t.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{t.label}</div>
            </div>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text2)' }}>Loading…</div>
        ) : view === 'kanban' ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14 }}>
            {STAGES.map(stage => {
              const stagePros = prospects.filter(p => p.stage === stage)
              return (
                <div key={stage} style={{ ...card, padding: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <span style={{ fontWeight: 700, fontSize: 13, textTransform: 'capitalize' }}>{STAGE_ICON[stage]} {stage}</span>
                    <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 700, background: STAGE_BG[stage], color: STAGE_COLOR[stage] }}>{stagePros.length}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {stagePros.map(p => (
                      <div key={p.id} style={{ background: 'var(--bg)', borderRadius: 8, padding: '9px 11px', border: '1px solid var(--border)' }}>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{p.name}</div>
                        <div style={{ color: 'var(--text2)', fontSize: 11, marginTop: 2 }}>via {p.recruiter}</div>
                        <div style={{ color: 'var(--text2)', fontSize: 11 }}>Day {p.dayInFunnel}</div>
                      </div>
                    ))}
                    {!stagePros.length && <div style={{ color: 'var(--text2)', fontSize: 12, textAlign: 'center', padding: '12px 0' }}>Empty</div>}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
              {['all', ...STAGES].map(s => (
                <button key={s} onClick={() => setStageFilter(s)} style={{ padding: '5px 13px', borderRadius: 20, border: '1px solid var(--border)', background: stageFilter === s ? 'var(--gold)' : 'transparent', color: stageFilter === s ? '#000' : 'var(--text)', fontSize: 12, cursor: 'pointer', textTransform: 'capitalize' }}>
                  {s}
                </button>
              ))}
            </div>
            <div style={{ ...card, overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Name', 'Email', 'Recruiter', 'Stage', 'Day in Funnel', 'Source', 'Added'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--text2)', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(p => (
                    <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '10px 12px', fontWeight: 600 }}>{p.name}</td>
                      <td style={{ padding: '10px 12px', color: 'var(--text2)' }}>{p.email}</td>
                      <td style={{ padding: '10px 12px', color: 'var(--text2)' }}>{p.recruiter}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{ padding: '2px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700, background: STAGE_BG[p.stage], color: STAGE_COLOR[p.stage], textTransform: 'capitalize' }}>{p.stage}</span>
                      </td>
                      <td style={{ padding: '10px 12px', color: 'var(--text2)' }}>{p.dayInFunnel}d</td>
                      <td style={{ padding: '10px 12px', color: 'var(--text2)', textTransform: 'capitalize' }}>{p.source}</td>
                      <td style={{ padding: '10px 12px', color: 'var(--text2)' }}>{p.addedAt}</td>
                    </tr>
                  ))}
                  {!filtered.length && (
                    <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--text2)' }}>No prospects found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  )
}
