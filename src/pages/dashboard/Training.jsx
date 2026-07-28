import { useState, useEffect, useCallback } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { useAuth } from '../../context/AuthContext'
import { getTrainingModules, completeTrainingLesson, claimTrainingReward } from '../../api/mlmApi'

const CERT_THRESHOLD = 5 // all modules

function ProgressBar({ value, max, color = '#2e7d6b', height = 8 }) {
  const pct = max ? Math.round((value / max) * 100) : 0
  return (
    <div style={{ background: 'var(--bg3)', borderRadius: 4, overflow: 'hidden', height }}>
      <div style={{ width: `${pct}%`, background: color, height: '100%', transition: 'width .4s' }} />
    </div>
  )
}

function LessonModal({ lesson, onClose, onComplete }) {
  const [done, setDone] = useState(lesson.completed)

  function handleComplete() {
    setDone(true)
    onComplete(lesson.id)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
    }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        background: 'var(--bg2)', borderRadius: 12, padding: '2rem',
        maxWidth: 680, width: '100%', maxHeight: '85vh', overflowY: 'auto',
        boxShadow: '0 8px 40px rgba(0,0,0,.25)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
          <div>
            <span style={{
              fontSize: '.75rem', fontWeight: 600, color: 'var(--accent)',
              textTransform: 'uppercase', letterSpacing: '.05em',
            }}>
              {lesson.type === 'quiz' ? '📝 Quiz' : '📖 Lesson'} · {lesson.duration} min
            </span>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '.25rem 0 0', color: 'var(--text1)' }}>
              {lesson.title}
            </h2>
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer',
            color: 'var(--text2)', padding: '.25rem',
          }}>✕</button>
        </div>

        <div style={{
          whiteSpace: 'pre-wrap', lineHeight: 1.75, color: 'var(--text1)',
          fontSize: '.95rem', marginBottom: '1.5rem',
        }}>
          {lesson.content.split('\n').map((line, i) => {
            const bold = line.replace(/\*\*(.*?)\*\*/g, (_, t) => `<b>${t}</b>`)
            return (
              <p key={i} style={{ margin: line.trim() === '' ? '.5rem 0' : '0 0 .25rem' }}
                dangerouslySetInnerHTML={{ __html: bold }} />
            )
          })}
        </div>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{
            padding: '.6rem 1.2rem', borderRadius: 8, border: '1px solid var(--border)',
            background: 'none', color: 'var(--text1)', cursor: 'pointer', fontWeight: 600,
          }}>Close</button>
          {!done && (
            <button onClick={handleComplete} style={{
              padding: '.6rem 1.4rem', borderRadius: 8, border: 'none',
              background: 'var(--accent)', color: '#fff', cursor: 'pointer', fontWeight: 700,
            }}>
              Mark Complete ✓
            </button>
          )}
          {done && (
            <span style={{
              padding: '.6rem 1.4rem', borderRadius: 8, background: '#e8f5f1',
              color: '#2e7d6b', fontWeight: 700, fontSize: '.9rem',
            }}>✅ Completed</span>
          )}
        </div>
      </div>
    </div>
  )
}

function ModuleCard({ module, onLessonClick, onClaimReward, expanded, onToggle }) {
  const total = module.lessons.length
  const done = module.completedCount
  const pct = total ? Math.round((done / total) * 100) : 0
  const allDone = done === total
  const canClaim = allDone && !module.rewardClaimed

  return (
    <div style={{
      background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12,
      overflow: 'hidden', marginBottom: '1rem',
    }}>
      <button
        onClick={onToggle}
        style={{
          width: '100%', background: 'none', border: 'none', cursor: 'pointer',
          padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem',
          textAlign: 'left',
        }}
      >
        <span style={{ fontSize: '2rem', lineHeight: 1 }}>{module.icon}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.4rem' }}>
            <span style={{ fontWeight: 700, color: 'var(--text1)', fontSize: '1rem' }}>{module.title}</span>
            <span style={{
              fontSize: '.8rem', fontWeight: 600,
              color: allDone ? '#2e7d6b' : 'var(--text2)',
              whiteSpace: 'nowrap', marginLeft: '.5rem',
            }}>
              {allDone ? '✅ Complete' : `${done}/${total} lessons`}
            </span>
          </div>
          <ProgressBar value={done} max={total} color={allDone ? '#2e7d6b' : 'var(--accent)'} />
        </div>
        <span style={{ color: 'var(--text2)', fontSize: '1.1rem' }}>{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <div style={{ borderTop: '1px solid var(--border)', padding: '1rem 1.5rem 1.5rem' }}>
          <p style={{ color: 'var(--text2)', fontSize: '.9rem', marginBottom: '1rem' }}>
            {module.description}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem', marginBottom: '1rem' }}>
            {module.lessons.map((lesson, idx) => (
              <button
                key={lesson.id}
                onClick={() => onLessonClick(lesson)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '.75rem',
                  padding: '.75rem 1rem', borderRadius: 8, border: '1px solid var(--border)',
                  background: lesson.completed ? 'rgba(46,125,107,.08)' : 'var(--bg1)',
                  cursor: 'pointer', textAlign: 'left',
                }}
              >
                <span style={{
                  width: 28, height: 28, borderRadius: '50%', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  background: lesson.completed ? '#2e7d6b' : 'var(--bg3)',
                  color: lesson.completed ? '#fff' : 'var(--text2)',
                  fontSize: '.8rem', fontWeight: 700,
                }}>
                  {lesson.completed ? '✓' : idx + 1}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: 'var(--text1)', fontSize: '.9rem' }}>
                    {lesson.title}
                    {lesson.type === 'quiz' && (
                      <span style={{
                        marginLeft: '.5rem', fontSize: '.7rem', background: 'var(--bg3)',
                        color: 'var(--accent)', padding: '1px 6px', borderRadius: 4, fontWeight: 700,
                      }}>QUIZ</span>
                    )}
                  </div>
                  <div style={{ fontSize: '.78rem', color: 'var(--text2)' }}>{lesson.duration} min read</div>
                </div>
                <span style={{ color: 'var(--text2)', fontSize: '.85rem' }}>→</span>
              </button>
            ))}
          </div>

          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '.75rem 1rem', borderRadius: 8,
            background: canClaim ? 'rgba(46,125,107,.1)' : module.rewardClaimed ? 'rgba(46,125,107,.05)' : 'var(--bg3)',
            border: `1px solid ${canClaim ? '#2e7d6b' : 'var(--border)'}`,
          }}>
            <div>
              <span style={{ fontWeight: 600, color: 'var(--text1)', fontSize: '.9rem' }}>
                🎁 Module Reward: {module.reward} MLMT
              </span>
              <div style={{ fontSize: '.78rem', color: 'var(--text2)' }}>
                {module.rewardClaimed ? 'Reward claimed ✓' : allDone ? 'All lessons complete — claim your reward!' : `Complete all ${total} lessons to unlock`}
              </div>
            </div>
            {canClaim && (
              <button
                onClick={() => onClaimReward(module.id, module.reward)}
                style={{
                  padding: '.5rem 1rem', borderRadius: 8, border: 'none',
                  background: '#2e7d6b', color: '#fff', cursor: 'pointer', fontWeight: 700,
                  fontSize: '.85rem', whiteSpace: 'nowrap',
                }}
              >
                Claim
              </button>
            )}
            {module.rewardClaimed && (
              <span style={{ color: '#2e7d6b', fontWeight: 700, fontSize: '.85rem' }}>✅ Claimed</span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function Training() {
  const { user } = useAuth()
  const [modules, setModules] = useState([])
  const [loading, setLoading] = useState(true)
  const [openLesson, setOpenLesson] = useState(null)
  const [expandedModule, setExpandedModule] = useState('module-1')
  const [toast, setToast] = useState(null)

  const showToast = (msg, color = '#2e7d6b') => {
    setToast({ msg, color })
    setTimeout(() => setToast(null), 3000)
  }

  const load = useCallback(async () => {
    try {
      const data = await getTrainingModules(user?.userId)
      setModules(data)
    } catch {
      /* keep empty */
    } finally {
      setLoading(false)
    }
  }, [user?.userId])

  useEffect(() => { load() }, [load])

  async function handleLessonComplete(lessonId) {
    await completeTrainingLesson(user?.userId, lessonId)
    showToast('Lesson complete! +progress')
    load()
  }

  async function handleClaimReward(moduleId, reward) {
    await claimTrainingReward(user?.userId, moduleId)
    showToast(`🎉 +${reward} MLMT added to your wallet!`)
    load()
  }

  const totalLessons = modules.reduce((s, m) => s + m.lessons.length, 0)
  const completedLessons = modules.reduce((s, m) => s + m.completedCount, 0)
  const completedModules = modules.filter(m => m.completedCount === m.lessons.length).length
  const totalReward = modules.reduce((s, m) => s + m.reward, 0)
  const earnedReward = modules.filter(m => m.rewardClaimed).reduce((s, m) => s + m.reward, 0)
  const certified = completedModules === CERT_THRESHOLD && modules.length === CERT_THRESHOLD

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '1.5rem 1rem' }}>
        {toast && (
          <div style={{
            position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 2000,
            background: toast.color, color: '#fff', padding: '.75rem 1.25rem',
            borderRadius: 8, fontWeight: 600, boxShadow: '0 4px 16px rgba(0,0,0,.2)',
          }}>
            {toast.msg}
          </div>
        )}

        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text1)', marginBottom: '.25rem' }}>
          🎓 Training & Certification
        </h1>
        <p style={{ color: 'var(--text2)', marginBottom: '1.5rem', fontSize: '.95rem' }}>
          Complete all five modules to earn your Nordic Vitals Certified Member badge and {totalReward} MLMT in rewards.
        </p>

        {/* Overall progress */}
        <div style={{
          background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12,
          padding: '1.25rem 1.5rem', marginBottom: '1.5rem',
        }}>
          {certified ? (
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <div style={{ fontSize: '3rem', marginBottom: '.5rem' }}>🏅</div>
              <div style={{ fontWeight: 800, fontSize: '1.2rem', color: '#2e7d6b', marginBottom: '.25rem' }}>
                Nordic Vitals Certified Member
              </div>
              <div style={{ color: 'var(--text2)', fontSize: '.9rem' }}>
                You have completed all {CERT_THRESHOLD} modules. Your certification badge is visible on your Profile.
              </div>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.75rem' }}>
                <span style={{ fontWeight: 700, color: 'var(--text1)' }}>Overall Progress</span>
                <span style={{ fontWeight: 700, color: 'var(--accent)' }}>
                  {completedLessons}/{totalLessons} lessons · {completedModules}/{modules.length} modules
                </span>
              </div>
              <ProgressBar value={completedLessons} max={totalLessons} height={12} />
              <div style={{ display: 'flex', gap: '2rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text1)' }}>
                    {Math.round(totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0)}%
                  </div>
                  <div style={{ fontSize: '.78rem', color: 'var(--text2)' }}>Complete</div>
                </div>
                <div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text1)' }}>
                    {earnedReward} MLMT
                  </div>
                  <div style={{ fontSize: '.78rem', color: 'var(--text2)' }}>Rewards earned</div>
                </div>
                <div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text1)' }}>
                    {totalReward - earnedReward} MLMT
                  </div>
                  <div style={{ fontSize: '.78rem', color: 'var(--text2)' }}>Remaining rewards</div>
                </div>
              </div>
            </>
          )}
        </div>

        {loading ? (
          <div style={{ color: 'var(--text2)', padding: '2rem', textAlign: 'center' }}>Loading training modules…</div>
        ) : (
          modules.map(mod => (
            <ModuleCard
              key={mod.id}
              module={mod}
              expanded={expandedModule === mod.id}
              onToggle={() => setExpandedModule(expandedModule === mod.id ? null : mod.id)}
              onLessonClick={setOpenLesson}
              onClaimReward={handleClaimReward}
            />
          ))
        )}

        {openLesson && (
          <LessonModal
            lesson={openLesson}
            onClose={() => { setOpenLesson(null); load() }}
            onComplete={handleLessonComplete}
          />
        )}
      </div>
    </DashboardLayout>
  )
}
