import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { getMemberDailyCheckin, postMemberCheckin } from '../../api/mlmApi'

const MOODS = ['😞', '😐', '🙂', '😊', '🤩']

export default function DashDailyCheckin() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [mood, setMood] = useState(null)
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    getMemberDailyCheckin().then(setData).finally(() => setLoading(false))
  }, [])

  async function handleCheckin() {
    if (mood === null) return
    setSubmitting(true)
    await postMemberCheckin({ mood: mood + 1, note })
    setData(prev => ({
      ...prev,
      checkedInToday: true,
      streak: prev.streak + 1,
      xpEarned: prev.xpEarned + prev.dailyXp,
    }))
    setSuccess(true)
    setSubmitting(false)
  }

  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 18px' }

  if (loading) return <DashboardLayout><div style={{ textAlign: 'center', padding: 80, color: 'var(--text2)' }}>Loading…</div></DashboardLayout>
  if (!data) return null

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 700, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 4 }}>📅 Daily Check-In</div>
          <div style={{ color: 'var(--text2)', fontSize: 14 }}>Check in daily to track your streak, earn XP, and log your mood.</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(110px,1fr))', gap: 10, marginBottom: 24 }}>
          {[
            { label: 'Current Streak',  value: `🔥 ${data.streak}d`,           color: '#fbbf24' },
            { label: 'Longest Streak',  value: `${data.longestStreak}d`,        color: '#a5b4fc' },
            { label: 'XP Earned',       value: `+${data.xpEarned.toLocaleString()}`, color: '#86efac' },
            { label: 'Total Check-Ins', value: data.totalCheckins,              color: '#f9a8d4' },
          ].map(s => (
            <div key={s.label} style={{ ...card, textAlign: 'center', padding: '12px 8px' }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {data.checkedInToday || success ? (
          <div style={{ ...card, textAlign: 'center', padding: '40px 24px', marginBottom: 24 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
            <div style={{ fontWeight: 800, fontSize: 20, marginBottom: 6 }}>Already checked in today!</div>
            <div style={{ color: 'var(--text2)', fontSize: 14 }}>Come back tomorrow to keep your {data.streak}-day streak going.</div>
            <div style={{ color: '#fbbf24', fontWeight: 700, marginTop: 10, fontSize: 15 }}>+{data.dailyXp} XP earned today</div>
          </div>
        ) : (
          <div style={{ ...card, marginBottom: 24 }}>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>How are you feeling today?</div>
            <div style={{ display: 'flex', gap: 14, justifyContent: 'center', marginBottom: 20 }}>
              {MOODS.map((m, i) => (
                <button
                  key={i}
                  onClick={() => setMood(i)}
                  style={{
                    fontSize: 36, background: 'none', border: `3px solid ${mood === i ? 'var(--gold)' : 'transparent'}`,
                    borderRadius: '50%', width: 60, height: 60, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'transform 0.1s', transform: mood === i ? 'scale(1.2)' : 'scale(1)',
                  }}
                >{m}</button>
              ))}
            </div>
            <textarea
              value={note} onChange={e => setNote(e.target.value)}
              placeholder="Add a note (optional) — highlight, goal, or reflection…"
              rows={3}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 13, resize: 'vertical', boxSizing: 'border-box', marginBottom: 14 }}
            />
            <button
              onClick={handleCheckin}
              disabled={mood === null || submitting}
              style={{ width: '100%', padding: '12px 0', borderRadius: 10, border: 'none', background: mood !== null ? 'var(--gold)' : 'var(--border)', color: mood !== null ? '#000' : 'var(--text2)', fontWeight: 800, cursor: mood !== null ? 'pointer' : 'not-allowed', fontSize: 15 }}
            >
              {submitting ? 'Checking in…' : `Check In · Earn +${data.dailyXp} XP`}
            </button>
          </div>
        )}

        <div>
          <div style={{ fontWeight: 700, marginBottom: 12 }}>Recent Check-Ins</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {data.history.map(h => (
              <div key={h.date} style={{ ...card, display: 'flex', alignItems: 'center', gap: 14, padding: '10px 16px' }}>
                <span style={{ fontSize: 24 }}>{MOODS[h.mood - 1] || '🙂'}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{h.date}</div>
                  {h.note && <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{h.note}</div>}
                </div>
                <span style={{ fontWeight: 700, color: '#fbbf24', fontSize: 13 }}>+{h.xp} XP</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
