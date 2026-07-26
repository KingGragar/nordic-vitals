import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import DashboardLayout from '../../components/DashboardLayout'
import { useAuth } from '../../context/AuthContext'
import { getMilestones, claimMilestone } from '../../api/mlmApi'

const CAT_ORDER = ['Getting Started', 'Sales Champion', 'Team Builder', 'Leadership']

const CAT_COLORS = {
  'Getting Started':  '#3b82f6',
  'Sales Champion':   '#f59e0b',
  'Team Builder':     '#22c55e',
  'Leadership':       '#a855f7',
}

const STATUS_CONFIG = {
  completed:   { label: 'Completed', bg: 'rgba(34,197,94,0.15)',  fg: '#4ade80',  border: 'rgba(34,197,94,0.3)' },
  claimable:   { label: 'Claim!',    bg: 'rgba(245,158,11,0.15)', fg: '#fcd34d',  border: 'rgba(245,158,11,0.4)' },
  in_progress: { label: 'In Progress', bg: 'rgba(59,130,246,0.15)', fg: '#60a5fa', border: 'rgba(59,130,246,0.3)' },
  locked:      { label: 'Locked',    bg: 'rgba(100,116,139,0.15)',fg: '#94a3b8',  border: 'rgba(100,116,139,0.2)' },
}

function Badge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.locked
  return (
    <span style={{
      padding: '2px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700,
      background: cfg.bg, color: cfg.fg, border: `1px solid ${cfg.border}`,
    }}>
      {cfg.label}
    </span>
  )
}

function ProgressBar({ value, max, color }) {
  const pct = max > 0 ? Math.min(100, Math.round(value / max * 100)) : 0
  return (
    <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 4, height: 6, overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, background: color || '#3b82f6', height: '100%', borderRadius: 4, transition: 'width 0.5s ease' }} />
    </div>
  )
}

function MilestoneCard({ m, catColor, onClaim, claiming }) {
  const cfg = STATUS_CONFIG[m.status] || STATUS_CONFIG.locked
  const isLocked = m.status === 'locked'
  const isClaimable = m.status === 'claimable'
  const isComplete = m.status === 'completed'

  return (
    <div style={{
      background: 'var(--navy2)',
      border: `1px solid ${isClaimable ? 'rgba(245,158,11,0.5)' : 'var(--border)'}`,
      borderRadius: 12,
      padding: '18px 20px',
      display: 'flex',
      gap: 16,
      alignItems: 'flex-start',
      opacity: isLocked ? 0.55 : 1,
      position: 'relative',
      overflow: 'hidden',
      transition: 'border-color 0.2s',
    }}>
      {isComplete && (
        <div style={{
          position: 'absolute', top: 0, right: 0,
          width: 0, height: 0,
          borderStyle: 'solid',
          borderWidth: '0 40px 40px 0',
          borderColor: `transparent ${catColor} transparent transparent`,
          opacity: 0.6,
        }} />
      )}
      <div style={{
        fontSize: 28, width: 48, height: 48, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: isComplete ? `${catColor}22` : 'rgba(255,255,255,0.05)',
        borderRadius: 10,
        border: `1px solid ${isComplete ? catColor + '44' : 'transparent'}`,
      }}>
        {isLocked ? '🔒' : m.icon}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
          <span style={{ fontWeight: 700, color: 'var(--text1)', fontSize: 14 }}>{m.title}</span>
          <Badge status={m.status} />
        </div>
        <p style={{ fontSize: 13, color: 'var(--text2)', margin: '0 0 8px' }}>{m.desc}</p>

        {m.progress != null && m.target != null && !isComplete && (
          <div style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>
              <span>{m.progressLabel || `${m.progress} / ${m.target}`}</span>
              <span>{Math.min(100, Math.round(m.progress / m.target * 100))}%</span>
            </div>
            <ProgressBar value={m.progress} max={m.target} color={catColor} />
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {m.reward && (
            <span style={{ fontSize: 12, color: catColor, fontWeight: 600 }}>
              🎁 {m.reward}
            </span>
          )}
          {isComplete && m.completedAt && (
            <span style={{ fontSize: 11, color: 'var(--text3)' }}>
              ✓ {new Date(m.completedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          )}
          {m.cta && !isComplete && !isLocked && (
            <Link to={m.cta.href} style={{
              fontSize: 12, color: catColor, textDecoration: 'none', fontWeight: 600,
              background: `${catColor}18`, padding: '3px 10px', borderRadius: 6,
            }}>
              {m.cta.label} →
            </Link>
          )}
          {isClaimable && (
            <button
              onClick={() => onClaim(m.id)}
              disabled={claiming === m.id}
              style={{
                fontSize: 12, fontWeight: 700, padding: '4px 14px',
                background: 'rgba(245,158,11,0.2)', color: '#fcd34d',
                border: '1px solid rgba(245,158,11,0.5)', borderRadius: 6,
                cursor: 'pointer',
              }}
            >
              {claiming === m.id ? 'Claiming…' : '🎉 Claim Reward'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Milestones() {
  const { user } = useAuth()
  const [milestones, setMilestones] = useState([])
  const [totalReward, setTotalReward] = useState(0)
  const [loading, setLoading]   = useState(true)
  const [claiming, setClaiming] = useState(null)
  const [toast, setToast]       = useState('')
  const [activeTab, setActiveTab] = useState('All')

  const load = async () => {
    setLoading(true)
    try {
      const data = await getMilestones(user?.userId)
      setMilestones(data.milestones || [])
      setTotalReward(data.totalRewardClaimed || 0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const showToast = msg => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const handleClaim = async id => {
    setClaiming(id)
    try {
      const res = await claimMilestone(user?.userId, id)
      showToast(`Reward claimed! +${res.reward} MLMT added to your wallet.`)
      setMilestones(prev =>
        prev.map(m => m.id === id ? { ...m, status: 'completed', completedAt: new Date().toISOString() } : m)
      )
      setTotalReward(prev => prev + (res.reward || 0))
    } catch (e) {
      showToast(e.message || 'Failed to claim reward')
    } finally {
      setClaiming(null)
    }
  }

  const categories = ['All', ...CAT_ORDER]
  const filtered = activeTab === 'All' ? milestones : milestones.filter(m => m.category === activeTab)

  const completedCount = milestones.filter(m => m.status === 'completed').length
  const totalCount = milestones.length
  const claimableCount = milestones.filter(m => m.status === 'claimable').length
  const overallPct = totalCount > 0 ? Math.round(completedCount / totalCount * 100) : 0

  const grouped = CAT_ORDER.reduce((acc, cat) => {
    acc[cat] = filtered.filter(m => m.category === cat)
    return acc
  }, {})

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '24px 20px' }}>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--text1)' }}>
            🏅 Milestones & Achievements
          </h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text2)', fontSize: 14 }}>
            Track your journey and claim rewards as you grow with Nordic Vitals.
          </p>
        </div>

        {/* Summary bar */}
        <div style={{
          background: 'var(--navy2)', border: '1px solid var(--border)',
          borderRadius: 14, padding: '20px 24px', marginBottom: 24,
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 20,
        }}>
          <div>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--text2)', marginBottom: 4 }}>Overall Progress</p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ fontSize: 28, fontWeight: 700, color: 'var(--gold)' }}>{overallPct}%</span>
              <span style={{ fontSize: 13, color: 'var(--text2)' }}>{completedCount}/{totalCount}</span>
            </div>
            <div style={{ marginTop: 8 }}>
              <ProgressBar value={completedCount} max={totalCount} color="var(--gold)" />
            </div>
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--text2)', marginBottom: 4 }}>Rewards Earned</p>
            <span style={{ fontSize: 24, fontWeight: 700, color: '#4ade80' }}>{totalReward.toLocaleString()}</span>
            <span style={{ fontSize: 12, color: 'var(--text2)', marginLeft: 4 }}>MLMT</span>
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--text2)', marginBottom: 4 }}>Ready to Claim</p>
            <span style={{ fontSize: 24, fontWeight: 700, color: claimableCount > 0 ? '#fcd34d' : 'var(--text2)' }}>
              {claimableCount}
            </span>
            <span style={{ fontSize: 12, color: 'var(--text2)', marginLeft: 4 }}>milestone{claimableCount !== 1 ? 's' : ''}</span>
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--text2)', marginBottom: 4 }}>Your Rank</p>
            <span style={{ fontSize: 22, fontWeight: 700, color: 'var(--text1)' }}>{user?.rank || 'Unranked'}</span>
          </div>
        </div>

        {/* Category tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveTab(cat)}
              style={{
                padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600,
                border: `1px solid ${activeTab === cat ? (CAT_COLORS[cat] || 'var(--gold)') : 'var(--border)'}`,
                background: activeTab === cat ? `${CAT_COLORS[cat] || 'var(--gold)'}20` : 'transparent',
                color: activeTab === cat ? (CAT_COLORS[cat] || 'var(--gold)') : 'var(--text2)',
                cursor: 'pointer',
              }}
            >
              {cat === 'All' ? `All (${totalCount})` : cat}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text2)' }}>Loading milestones…</div>
        ) : (
          <>
            {CAT_ORDER.map(cat => {
              const items = grouped[cat]
              if (!items || items.length === 0) return null
              const catDone = items.filter(m => m.status === 'completed').length
              return (
                <div key={cat} style={{ marginBottom: 28 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <div style={{ width: 4, height: 18, borderRadius: 2, background: CAT_COLORS[cat] }} />
                    <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text1)' }}>{cat}</h2>
                    <span style={{ fontSize: 12, color: 'var(--text2)' }}>{catDone}/{items.length}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {items.map(m => (
                      <MilestoneCard
                        key={m.id}
                        m={m}
                        catColor={CAT_COLORS[cat]}
                        onClaim={handleClaim}
                        claiming={claiming}
                      />
                    ))}
                  </div>
                </div>
              )
            })}
            {filtered.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text2)' }}>
                No milestones in this category yet.
              </div>
            )}
          </>
        )}
      </div>

      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          background: '#1e293b', color: '#f1f5f9', padding: '12px 24px',
          borderRadius: 10, boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
          border: '1px solid var(--border)', zIndex: 1000, fontSize: 14, fontWeight: 500,
        }}>
          {toast}
        </div>
      )}
    </DashboardLayout>
  )
}
