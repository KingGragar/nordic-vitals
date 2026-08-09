import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { getMemberTeamMap } from '../../api/mlmApi'

export default function DashTeamMap() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    getMemberTeamMap().then(setData).finally(() => setLoading(false))
  }, [])

  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 18px' }

  if (loading) return <DashboardLayout><div style={{ textAlign: 'center', padding: 80, color: 'var(--text2)' }}>Loading…</div></DashboardLayout>
  if (!data) return null

  const maxMembers = Math.max(...data.countries.map(c => c.members))

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 820, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 4 }}>🗺️ Team Map</div>
          <div style={{ color: 'var(--text2)', fontSize: 14 }}>Geographic distribution of your downline team across countries and cities.</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(110px,1fr))', gap: 10, marginBottom: 24 }}>
          {[
            { label: 'Countries',     value: data.stats.countries,   color: '#a5b4fc' },
            { label: 'Cities',        value: data.stats.cities,      color: '#fbbf24' },
            { label: 'Total Members', value: data.stats.totalMembers, color: '#86efac' },
            { label: 'Top Country',   value: data.stats.topCountry,  color: '#f9a8d4' },
          ].map(s => (
            <div key={s.label} style={{ ...card, textAlign: 'center', padding: '12px 8px' }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: 20, alignItems: 'start' }}>
          <div>
            <div style={{ fontWeight: 700, marginBottom: 12 }}>Members by Country</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {data.countries.map(c => {
                const pct = Math.round((c.members / maxMembers) * 100)
                const activePct = Math.round((c.active / c.members) * 100)
                const isSel = selected === c.code
                return (
                  <div
                    key={c.code}
                    onClick={() => setSelected(isSel ? null : c.code)}
                    style={{ ...card, cursor: 'pointer', outline: isSel ? '2px solid var(--gold)' : 'none' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                      <span style={{ fontSize: 22 }}>{c.flag}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>{c.name}</div>
                        <div style={{ color: 'var(--text2)', fontSize: 12 }}>{c.active}/{c.members} active</div>
                      </div>
                      <span style={{ fontWeight: 800, fontSize: 16, color: '#86efac' }}>{c.members}</span>
                    </div>
                    <div style={{ height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden', marginBottom: 4 }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: '#a5b4fc', borderRadius: 3 }} />
                    </div>
                    <div style={{ height: 4, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${activePct}%`, background: '#86efac', borderRadius: 3 }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text2)', marginTop: 3 }}>
                      <span>Members</span><span>Active rate: {activePct}%</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div>
            <div style={{ fontWeight: 700, marginBottom: 12 }}>Top Cities</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {data.topCities.map((city, i) => (
                <div key={city.city} style={{ ...card, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontWeight: 800, fontSize: 14, color: 'var(--text2)', minWidth: 22 }}>#{i + 1}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{city.city}</div>
                    <div style={{ color: 'var(--text2)', fontSize: 11 }}>{city.country}</div>
                  </div>
                  <span style={{ fontWeight: 800, fontSize: 15, color: '#fbbf24' }}>{city.members}</span>
                </div>
              ))}
            </div>

            <div style={{ ...card, marginTop: 16, textAlign: 'center', padding: '20px 16px' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🌍</div>
              <div style={{ color: 'var(--text2)', fontSize: 12 }}>Interactive map coming soon — tap a country card to explore.</div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
