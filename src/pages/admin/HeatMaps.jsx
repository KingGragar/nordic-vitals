import { useState, useEffect } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { getAdminHeatMaps } from '../../api/mlmApi'

const PAGES = ['Landing', 'Shop', 'Product Detail', 'Join', 'Dashboard', 'Checkout']
const DEVICES = ['all', 'desktop', 'mobile', 'tablet']
const REGIONS = ['header', 'hero', 'products', 'testimonials', 'pricing', 'footer']

const HEAT_COLORS = ['#1e3a5f', '#1e5f8f', '#1a7abf', '#0ea5e9', '#38bdf8', '#7dd3fc', '#fbbf24', '#f97316', '#ef4444']

function HeatCell({ value, max }) {
  const idx = Math.floor((value / max) * (HEAT_COLORS.length - 1))
  const bg = HEAT_COLORS[idx] || HEAT_COLORS[0]
  return (
    <div style={{
      background: bg, borderRadius: 4, padding: '8px 6px',
      textAlign: 'center', fontSize: 11, fontWeight: 700, color: '#fff',
      cursor: 'default', minWidth: 60,
    }} title={`${value.toLocaleString()} clicks`}>
      {value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value}
    </div>
  )
}

export default function AdminHeatMaps() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState('Landing')
  const [device, setDevice] = useState('all')

  useEffect(() => { getAdminHeatMaps().then(setData).finally(() => setLoading(false)) }, [])

  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 18px' }

  if (loading) return <AdminLayout><div style={{ textAlign: 'center', padding: 80, color: 'var(--text2)' }}>Loading…</div></AdminLayout>
  if (!data) return null

  const matrix = data.matrix[page]?.[device] || {}
  const allVals = REGIONS.map(r => matrix[r] || 0)
  const maxVal = Math.max(...allVals, 1)

  return (
    <AdminLayout>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 4 }}>🔥 Heat Maps</div>
          <div style={{ color: 'var(--text2)', fontSize: 14 }}>Click density and engagement by page section and device.</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Avg Click Depth', value: data.summary.avgDepth,     color: '#a5b4fc' },
            { label: 'Top Converting',  value: data.summary.topConverting, color: '#86efac' },
            { label: 'Dead Zones',      value: data.summary.deadZones,     color: '#fbbf24' },
            { label: 'Sessions Tracked',value: data.summary.sessions,      color: '#f9a8d4' },
          ].map(s => (
            <div key={s.label} style={card}>
              <div style={{ fontSize: 18, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {PAGES.map(p => (
              <button key={p} onClick={() => setPage(p)} style={{
                padding: '6px 14px', borderRadius: 20, border: `1px solid ${page === p ? '#a5b4fc' : 'var(--border)'}`,
                background: page === p ? '#a5b4fc22' : 'transparent',
                color: page === p ? '#a5b4fc' : 'var(--text2)', fontWeight: 600, fontSize: 12, cursor: 'pointer',
              }}>{p}</button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 6, marginLeft: 'auto' }}>
            {DEVICES.map(d => (
              <button key={d} onClick={() => setDevice(d)} style={{
                padding: '6px 12px', borderRadius: 20, border: `1px solid ${device === d ? '#fbbf24' : 'var(--border)'}`,
                background: device === d ? '#fbbf2422' : 'transparent',
                color: device === d ? '#fbbf24' : 'var(--text2)', fontWeight: 600, fontSize: 12, cursor: 'pointer', textTransform: 'capitalize',
              }}>{d}</button>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, alignItems: 'start' }}>
          <div style={card}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Click Density — {page} ({device})</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {REGIONS.map(region => (
                <div key={region} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 110, fontSize: 13, color: 'var(--text2)', textTransform: 'capitalize' }}>{region}</div>
                  <div style={{ flex: 1, display: 'flex', gap: 4 }}>
                    {Array.from({ length: 10 }, (_, i) => {
                      const threshold = ((i + 1) / 10) * maxVal
                      const active = (matrix[region] || 0) >= threshold
                      const colorIdx = Math.floor((i / 9) * (HEAT_COLORS.length - 1))
                      return (
                        <div key={i} style={{
                          flex: 1, height: 28, borderRadius: 3,
                          background: active ? HEAT_COLORS[colorIdx] : 'var(--border)',
                          transition: 'background 0.2s',
                        }} />
                      )
                    })}
                  </div>
                  <HeatCell value={matrix[region] || 0} max={maxVal} />
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 20 }}>
              <span style={{ fontSize: 11, color: 'var(--text2)' }}>Cold</span>
              {HEAT_COLORS.map((c, i) => (
                <div key={i} style={{ flex: 1, height: 10, background: c, borderRadius: 2 }} />
              ))}
              <span style={{ fontSize: 11, color: 'var(--text2)' }}>Hot</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={card}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>Page Rankings</div>
              {data.pageRankings.map((r, i) => (
                <div key={r.page} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ width: 20, fontWeight: 800, color: i === 0 ? '#fbbf24' : 'var(--text2)', fontSize: 13 }}>#{i + 1}</span>
                  <span style={{ flex: 1, fontSize: 13 }}>{r.page}</span>
                  <span style={{ fontSize: 12, color: '#a5b4fc', fontWeight: 700 }}>{r.engagementScore}%</span>
                </div>
              ))}
            </div>

            <div style={card}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>Drop-off Points</div>
              {data.dropoffs.map(d => (
                <div key={d.section} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                    <span>{d.section}</span>
                    <span style={{ color: '#ef4444', fontWeight: 700 }}>-{d.dropPct}%</span>
                  </div>
                  <div style={{ height: 6, background: 'var(--border)', borderRadius: 3 }}>
                    <div style={{ width: `${d.dropPct}%`, height: '100%', background: '#ef4444', borderRadius: 3 }} />
                  </div>
                </div>
              ))}
            </div>

            <div style={card}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>Scroll Depth</div>
              {[25, 50, 75, 90, 100].map(pct => (
                <div key={pct} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                    <span>{pct}%</span>
                    <span style={{ color: '#86efac', fontWeight: 700 }}>{data.scrollDepth[pct] || 0}%</span>
                  </div>
                  <div style={{ height: 6, background: 'var(--border)', borderRadius: 3 }}>
                    <div style={{ width: `${data.scrollDepth[pct] || 0}%`, height: '100%', background: '#86efac', borderRadius: 3 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
