import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { getAvailableSurveys, submitSurveyResponse } from '../../api/mlmApi'

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function SurveyCard({ survey, onStart }) {
  const closingSoon = survey.closesAt && (new Date(survey.closesAt) - Date.now()) < 7 * 86400000
  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{survey.title}</div>
          <div style={{ color: 'var(--text2)', fontSize: 13 }}>{survey.description}</div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 18, color: '#fbbf24' }}>{survey.pointsReward}</div>
          <div style={{ fontSize: 11, color: 'var(--text2)' }}>points</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text2)', flexWrap: 'wrap' }}>
        <span>📋 {survey.questions?.length || 0} questions</span>
        <span>⏱ ~{survey.avgTimeMinutes || 2} min</span>
        {survey.closesAt && (
          <span style={{ color: closingSoon ? '#f87171' : 'var(--text2)' }}>
            {closingSoon ? '⚠️ ' : '📅 '}Closes {fmtDate(survey.closesAt)}
          </span>
        )}
      </div>
      <button onClick={() => onStart(survey)}
        style={{ background: 'var(--gold)', color: '#000', border: 'none', borderRadius: 8, padding: '10px 0', fontWeight: 700, fontSize: 14, cursor: 'pointer', width: '100%' }}>
        Start Survey →
      </button>
    </div>
  )
}

function CompletedCard({ survey }) {
  const resp = survey.response || {}
  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: 20, opacity: 0.85 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 2 }}>{survey.title}</div>
          <div style={{ fontSize: 12, color: 'var(--text2)' }}>Completed {fmtDate(resp.completedAt)}</div>
        </div>
        <span style={{ background: '#052e16', color: '#86efac', border: '1px solid #166534', borderRadius: 6, padding: '4px 10px', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>
          ✓ Done
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
        <span style={{ color: '#fbbf24', fontWeight: 700 }}>+{resp.pointsEarned || survey.pointsReward} pts</span>
        <span style={{ color: 'var(--text2)' }}>earned</span>
      </div>
    </div>
  )
}

function SurveyTaker({ survey, onComplete, onCancel }) {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [earned, setEarned] = useState(0)

  const questions = survey.questions || []
  const current = questions[step]
  const isLast = step === questions.length - 1

  function setAnswer(qId, val) { setAnswers(a => ({ ...a, [qId]: val })) }

  async function handleNext() {
    if (isLast) {
      setSubmitting(true)
      try {
        const res = await submitSurveyResponse(survey.id, answers)
        setEarned(res.pointsEarned || survey.pointsReward)
        setDone(true)
      } catch {}
      setSubmitting(false)
    } else {
      setStep(s => s + 1)
    }
  }

  const progress = ((step + 1) / questions.length) * 100
  const canProceed = answers[current?.id] !== undefined && answers[current?.id] !== ''

  if (done) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: 40, maxWidth: 400, width: '100%', textAlign: 'center' }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
          <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 8 }}>Survey Complete!</div>
          <div style={{ color: 'var(--text2)', fontSize: 14, marginBottom: 20 }}>Thank you for your valuable feedback.</div>
          <div style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid #f59e0b', borderRadius: 10, padding: '16px 20px', marginBottom: 24 }}>
            <div style={{ fontSize: 32, fontWeight: 800, color: '#fbbf24' }}>+{earned}</div>
            <div style={{ fontSize: 14, color: 'var(--text2)' }}>Loyalty points added to your account</div>
          </div>
          <button onClick={() => onComplete()} style={{ background: 'var(--gold)', color: '#000', border: 'none', borderRadius: 8, padding: '12px 32px', fontWeight: 700, fontSize: 15, cursor: 'pointer', width: '100%' }}>
            Back to Surveys
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: 28, maxWidth: 560, width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <div style={{ fontWeight: 700, fontSize: 15, flex: 1 }}>{survey.title}</div>
          <button onClick={onCancel} style={{ background: 'none', border: 'none', color: 'var(--text2)', fontSize: 20, cursor: 'pointer', flexShrink: 0 }}>✕</button>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 14 }}>Question {step + 1} of {questions.length}</div>
        <div style={{ background: 'var(--border)', borderRadius: 4, height: 4, marginBottom: 24 }}>
          <div style={{ width: `${progress}%`, background: 'var(--gold)', borderRadius: 4, height: '100%', transition: 'width 0.3s' }} />
        </div>

        {current && (
          <div style={{ minHeight: 160 }}>
            <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 20 }}>{current.text}</div>

            {current.type === 'rating' && (
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                {[1, 2, 3, 4, 5].map(n => (
                  <button key={n} onClick={() => setAnswer(current.id, n)}
                    style={{
                      width: 52, height: 52, borderRadius: 10, fontSize: 20, cursor: 'pointer',
                      border: answers[current.id] === n ? '2px solid var(--gold)' : '1px solid var(--border)',
                      background: answers[current.id] === n ? 'rgba(251,191,36,0.15)' : 'var(--bg)',
                      color: answers[current.id] === n ? '#fbbf24' : 'var(--text2)',
                      fontWeight: 700, transition: 'all 0.15s',
                    }}>
                    {'★'.repeat(n)}
                  </button>
                ))}
              </div>
            )}

            {current.type === 'multiple' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {(current.options || []).map(opt => (
                  <button key={opt} onClick={() => setAnswer(current.id, opt)}
                    style={{
                      textAlign: 'left', padding: '12px 16px', borderRadius: 8, cursor: 'pointer',
                      border: answers[current.id] === opt ? '2px solid var(--gold)' : '1px solid var(--border)',
                      background: answers[current.id] === opt ? 'rgba(251,191,36,0.1)' : 'var(--bg)',
                      color: answers[current.id] === opt ? '#fbbf24' : 'var(--text1)',
                      fontSize: 14, fontWeight: answers[current.id] === opt ? 600 : 400, transition: 'all 0.15s',
                    }}>
                    {opt}
                  </button>
                ))}
              </div>
            )}

            {current.type === 'text' && (
              <textarea
                value={answers[current.id] || ''}
                onChange={e => setAnswer(current.id, e.target.value)}
                placeholder="Share your thoughts…"
                style={{
                  background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8,
                  padding: '12px', color: 'var(--text1)', fontSize: 14, width: '100%',
                  boxSizing: 'border-box', minHeight: 100, resize: 'vertical',
                }}
              />
            )}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 28 }}>
          <button
            onClick={() => setStep(s => s - 1)}
            disabled={step === 0}
            style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 20px', color: 'var(--text1)', fontSize: 13, cursor: step === 0 ? 'not-allowed' : 'pointer', opacity: step === 0 ? 0.4 : 1 }}>
            ← Back
          </button>
          <button
            onClick={handleNext}
            disabled={!canProceed || submitting}
            style={{ background: canProceed ? 'var(--gold)' : 'var(--border)', color: canProceed ? '#000' : 'var(--text2)', border: 'none', borderRadius: 8, padding: '10px 24px', fontWeight: 700, fontSize: 14, cursor: canProceed ? 'pointer' : 'not-allowed', transition: 'all 0.2s' }}>
            {submitting ? 'Submitting…' : isLast ? 'Submit Survey ✓' : 'Next →'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function MemberSurveys() {
  const [available, setAvailable] = useState([])
  const [completed, setCompleted] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeSurvey, setActiveSurvey] = useState(null)
  const [tab, setTab] = useState('available')

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const res = await getAvailableSurveys()
      setAvailable(res.available || [])
      setCompleted(res.completed || [])
    } catch {}
    setLoading(false)
  }

  async function handleComplete() {
    setActiveSurvey(null)
    await load()
    setTab('completed')
  }

  const totalEarned = completed.reduce((s, sv) => s + (sv.response?.pointsEarned || sv.pointsReward || 0), 0)

  return (
    <DashboardLayout>
      <div style={{ padding: '28px 24px', maxWidth: 900, margin: '0 auto' }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 4px' }}>Surveys</h1>
          <p style={{ color: 'var(--text2)', fontSize: 14, margin: 0 }}>Share your feedback and earn loyalty points for each survey you complete.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14, marginBottom: 24 }}>
          {[
            { label: 'Available', value: available.length, color: 'var(--gold)' },
            { label: 'Completed', value: completed.length, color: '#86efac' },
            { label: 'Points Earned', value: totalEarned.toLocaleString(), color: '#fbbf24' },
          ].map(t => (
            <div key={t.label} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 18px' }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: t.color, marginBottom: 4 }}>{t.value}</div>
              <div style={{ fontSize: 13, color: 'var(--text2)' }}>{t.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border)', marginBottom: 20 }}>
          {[['available', `Available (${available.length})`], ['completed', `Completed (${completed.length})`]].map(([k, label]) => (
            <button key={k} onClick={() => setTab(k)}
              style={{ padding: '10px 20px', background: 'none', border: 'none', borderBottom: tab === k ? '2px solid var(--gold)' : '2px solid transparent', color: tab === k ? 'var(--gold)' : 'var(--text2)', fontWeight: tab === k ? 700 : 400, fontSize: 14, cursor: 'pointer' }}>
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text2)' }}>Loading surveys…</div>
        ) : tab === 'available' ? (
          available.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60 }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>All caught up!</div>
              <div style={{ color: 'var(--text2)', fontSize: 14 }}>No surveys available right now. Check back soon.</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
              {available.map(sv => (
                <SurveyCard key={sv.id} survey={sv} onStart={setActiveSurvey} />
              ))}
            </div>
          )
        ) : (
          completed.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60 }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>No surveys completed yet</div>
              <div style={{ color: 'var(--text2)', fontSize: 14 }}>Complete a survey to earn loyalty points.</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
              {completed.map(sv => (
                <CompletedCard key={sv.id} survey={sv} />
              ))}
            </div>
          )
        )}
      </div>

      {activeSurvey && (
        <SurveyTaker
          survey={activeSurvey}
          onComplete={handleComplete}
          onCancel={() => setActiveSurvey(null)}
        />
      )}
    </DashboardLayout>
  )
}
