import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { getMemberLearningPath } from '../../api/mlmApi'

const CATEGORY_COLORS = {
  foundation:  '#60a5fa',
  sales:       '#a78bfa',
  leadership:  '#f59e0b',
  product:     '#34d399',
  compliance:  '#fb7185',
}

export default function DashLearningPath() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('all')

  useEffect(() => {
    getMemberLearningPath().then(setData).finally(() => setLoading(false))
  }, [])

  const categories = ['all', 'foundation', 'sales', 'leadership', 'product', 'compliance']
  const modules = !data ? [] : activeCategory === 'all' ? data.modules : data.modules.filter(m => m.category === activeCategory)
  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 18px' }

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 4 }}>🎓 Learning Path</div>
          <div style={{ color: 'var(--text2)', fontSize: 14 }}>Complete modules to earn certifications and unlock new ranks.</div>
        </div>

        {data && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12, marginBottom: 22 }}>
            {[
              { label: 'Completed', value: data.completedCount, color: '#86efac' },
              { label: 'In Progress', value: data.inProgressCount, color: '#fbbf24' },
              { label: 'Certifications', value: data.certifications, color: '#a78bfa' },
              { label: 'Total XP', value: data.totalXp?.toLocaleString(), color: 'var(--gold)' },
            ].map(s => (
              <div key={s.label} style={card}>
                <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
          {categories.map(c => (
            <button key={c} onClick={() => setActiveCategory(c)} style={{ padding: '6px 14px', borderRadius: 20, border: `1px solid ${c !== 'all' ? CATEGORY_COLORS[c] : 'var(--border)'}`, background: activeCategory === c ? (c !== 'all' ? CATEGORY_COLORS[c] : 'var(--gold)') : 'var(--card)', color: activeCategory === c ? '#000' : 'var(--text)', fontSize: 13, cursor: 'pointer', fontWeight: activeCategory === c ? 700 : 400, textTransform: 'capitalize' }}>
              {c === 'all' ? 'All' : c}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text2)' }}>Loading…</div>
        ) : !modules.length ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text2)' }}>No modules in this category.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {modules.map(m => {
              const catColor = CATEGORY_COLORS[m.category] || '#94a3b8'
              const pct = m.totalLessons > 0 ? Math.round((m.completedLessons / m.totalLessons) * 100) : 0
              return (
                <div key={m.id} style={{ ...card, display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                  <div style={{ width: 52, height: 52, borderRadius: 12, background: catColor + '22', border: `2px solid ${catColor}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
                    {m.icon || '📚'}
                  </div>
                  <div style={{ flex: '1 1 200px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{m.title}</div>
                      {m.certified && <span style={{ padding: '2px 8px', borderRadius: 12, background: '#a78bfa22', color: '#a78bfa', fontSize: 11, fontWeight: 700 }}>CERTIFIED</span>}
                    </div>
                    <div style={{ color: 'var(--text2)', fontSize: 13, margin: '4px 0 10px' }}>{m.description}</div>
                    <div style={{ height: 6, borderRadius: 3, background: 'var(--border)', marginBottom: 6 }}>
                      <div style={{ height: '100%', borderRadius: 3, background: m.status === 'completed' ? '#86efac' : catColor, width: `${pct}%`, transition: 'width 0.4s' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text2)' }}>
                      <span>{m.completedLessons}/{m.totalLessons} lessons · {m.duration}</span>
                      <span style={{ color: catColor, fontWeight: 600 }}>+{m.xp} XP</span>
                    </div>
                  </div>
                  <button disabled={m.status === 'locked'} style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: m.status === 'completed' ? '#052e16' : m.status === 'locked' ? 'var(--border)' : catColor, color: m.status === 'completed' ? '#86efac' : m.status === 'locked' ? 'var(--text2)' : '#000', fontSize: 13, fontWeight: 700, cursor: m.status === 'locked' ? 'not-allowed' : 'pointer', flexShrink: 0 }}>
                    {m.status === 'completed' ? '✓ Done' : m.status === 'locked' ? '🔒 Locked' : m.status === 'in_progress' ? 'Continue' : 'Start'}
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
