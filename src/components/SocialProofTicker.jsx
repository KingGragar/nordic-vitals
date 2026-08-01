import { useState, useEffect, useRef } from 'react'
import { getSocialProofEvents } from '../api/mlmApi'

const ICON_MAP = {
  join:     '🎉',
  rank_up:  '🏆',
  purchase: '🛒',
  milestone:'⭐',
  withdrawal: '💸',
}

const TYPE_COLOR = {
  join:     '#22c55e',
  rank_up:  '#c9a84c',
  purchase: '#3b82f6',
  milestone:'#a855f7',
  withdrawal: '#22c55e',
}

const KEYFRAMES = `
@keyframes nv-slide-in {
  from { opacity: 0; transform: translateY(24px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes nv-slide-out {
  from { opacity: 1; transform: translateY(0); }
  to   { opacity: 0; transform: translateY(-16px); }
}
`

export default function SocialProofTicker({ initialDelay = 3500, interval = 6000 }) {
  const [events, setEvents] = useState([])
  const [idx, setIdx]         = useState(0)
  const [phase, setPhase]     = useState('hidden')   // hidden | in | visible | out
  const [dismissed, setDismissed] = useState(false)
  const timerRef = useRef(null)

  useEffect(() => {
    getSocialProofEvents()
      .then(ev => { if (ev?.length) setEvents(ev) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!events.length || dismissed) return

    const showNext = (i) => {
      setIdx(i % events.length)
      setPhase('in')
      // slide-in lasts 0.4s, then stay visible
      timerRef.current = setTimeout(() => {
        setPhase('visible')
        // stay for (interval - 800ms) then slide out
        timerRef.current = setTimeout(() => {
          setPhase('out')
          // out lasts 0.4s, then cycle
          timerRef.current = setTimeout(() => {
            showNext(i + 1)
          }, 420)
        }, interval - 800)
      }, 420)
    }

    timerRef.current = setTimeout(() => showNext(0), initialDelay)
    return () => clearTimeout(timerRef.current)
  }, [events, dismissed]) // eslint-disable-line react-hooks/exhaustive-deps

  if (dismissed || phase === 'hidden' || !events.length) return null

  const ev = events[idx]
  const icon  = ICON_MAP[ev.type]  || '✨'
  const color = TYPE_COLOR[ev.type] || '#c9a84c'

  const animName  = phase === 'in' ? 'nv-slide-in' : phase === 'out' ? 'nv-slide-out' : 'none'
  const animStyle = animName !== 'none'
    ? { animation: `${animName} 0.4s ease forwards` }
    : {}

  return (
    <>
      <style>{KEYFRAMES}</style>
      <div
        style={{
          position: 'fixed',
          bottom: 90,
          left: 20,
          zIndex: 8000,
          maxWidth: 320,
          ...animStyle,
        }}
      >
        <div style={{
          background: '#12243a',
          border: '1px solid #1e3450',
          borderLeft: `3px solid ${color}`,
          borderRadius: 12,
          padding: '12px 14px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 10,
          boxShadow: '0 8px 32px rgba(0,0,0,0.45)',
        }}>
          {/* live dot */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, paddingTop: 2 }}>
            <span style={{ fontSize: 18, lineHeight: 1 }}>{icon}</span>
            <span style={{
              width: 7, height: 7, borderRadius: '50%',
              background: '#22c55e',
              boxShadow: '0 0 0 2px rgba(34,197,94,0.3)',
              display: 'block',
            }} />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 13, color: '#f8f5f0', lineHeight: 1.45, margin: 0 }}>
              {ev.message}
            </p>
            <p style={{ fontSize: 11, color: '#8a9bb0', margin: '4px 0 0' }}>
              {ev.time_ago} · Nordic Vitals
            </p>
          </div>

          <button
            onClick={() => setDismissed(true)}
            title="Dismiss"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#8a9bb0', fontSize: 16, lineHeight: 1,
              padding: '0 0 0 4px', flexShrink: 0,
            }}
          >×</button>
        </div>
      </div>
    </>
  )
}
