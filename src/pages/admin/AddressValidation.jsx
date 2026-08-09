import { useState, useEffect } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { getAdminAddressValidation, toggleAdminAddressRule } from '../../api/mlmApi'

const RULE_COLORS = { required: '#f9a8d4', format: '#a5b4fc', geocode: '#86efac', restrict: '#fbbf24' }

export default function AdminAddressValidation() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState(null)
  const [tab, setTab] = useState('rules')

  useEffect(() => {
    getAdminAddressValidation().then(setData).finally(() => setLoading(false))
  }, [])

  async function toggle(id, current) {
    setToggling(id)
    await toggleAdminAddressRule(id, !current)
    setData(prev => ({ ...prev, rules: prev.rules.map(r => r.id === id ? { ...r, active: !r.active } : r) }))
    setToggling(null)
  }

  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 18px' }

  if (loading) return <AdminLayout><div style={{ textAlign: 'center', padding: 80, color: 'var(--text2)' }}>Loading…</div></AdminLayout>
  if (!data) return null

  return (
    <AdminLayout>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 4 }}>📍 Address Validation</div>
          <div style={{ color: 'var(--text2)', fontSize: 14 }}>Configure address validation rules, geocoding settings, and failed-validation reports.</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Active Rules',     value: data.stats.activeRules,                           color: '#86efac' },
            { label: 'Validated Today',  value: data.stats.validatedToday.toLocaleString(),       color: '#a5b4fc' },
            { label: 'Failed Rate',      value: `${data.stats.failedRate}%`,                      color: '#f87171' },
            { label: 'Auto-Corrected',   value: data.stats.autoCorrected.toLocaleString(),        color: '#fbbf24' },
          ].map(s => (
            <div key={s.label} style={card}>
              <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 4, marginBottom: 18 }}>
          {['rules', 'failures', 'countries'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '8px 18px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13, textTransform: 'capitalize',
              background: tab === t ? 'var(--gold)' : 'var(--border)', color: tab === t ? '#000' : 'var(--text2)',
            }}>{t}</button>
          ))}
        </div>

        {tab === 'rules' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {data.rules.map(rule => (
              <div key={rule.id} style={{ ...card, display: 'flex', alignItems: 'center', gap: 14 }}>
                <span style={{
                  padding: '3px 10px', borderRadius: 10, fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap',
                  background: (RULE_COLORS[rule.type] || '#888') + '22', color: RULE_COLORS[rule.type] || '#888', textTransform: 'capitalize',
                }}>{rule.type}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{rule.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{rule.description}</div>
                  {rule.countries && rule.countries.length > 0 && (
                    <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 3 }}>Scope: {rule.countries.join(', ')}</div>
                  )}
                </div>
                <button
                  onClick={() => toggle(rule.id, rule.active)}
                  disabled={toggling === rule.id}
                  style={{
                    padding: '5px 16px', borderRadius: 20, border: `1px solid ${rule.active ? '#166534' : 'var(--border)'}`,
                    background: rule.active ? '#052e16' : 'var(--bg)',
                    color: rule.active ? '#86efac' : 'var(--text2)',
                    fontSize: 12, cursor: 'pointer', fontWeight: 600,
                  }}
                >{toggling === rule.id ? '…' : rule.active ? 'Active' : 'Inactive'}</button>
              </div>
            ))}
          </div>
        )}

        {tab === 'failures' && (
          <div>
            <div style={{ fontWeight: 700, marginBottom: 12 }}>Recent Validation Failures</div>
            <div style={{ overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border)' }}>
                    {['Member', 'Address Submitted', 'Failure Reason', 'Date', 'Action'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--text2)', fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.failures.map(f => (
                    <tr key={f.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '10px 12px', fontWeight: 600 }}>{f.memberName}</td>
                      <td style={{ padding: '10px 12px', color: 'var(--text2)', fontSize: 12 }}>{f.address}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: 11, background: '#f8717122', color: '#f87171', fontWeight: 600 }}>{f.reason}</span>
                      </td>
                      <td style={{ padding: '10px 12px', color: 'var(--text2)', fontSize: 12 }}>{f.date}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <button style={{ padding: '4px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text2)', fontSize: 11, cursor: 'pointer' }}>
                          Review
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'countries' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 12 }}>
            {data.countries.map(c => (
              <div key={c.code} style={card}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <span style={{ fontSize: 22 }}>{c.flag}</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{c.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text2)' }}>{c.code}</div>
                  </div>
                </div>
                <div style={{ fontSize: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text2)' }}>Postcode Format</span>
                    <span style={{ fontWeight: 600, fontFamily: 'monospace' }}>{c.postcodeFormat}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text2)' }}>Geocoding</span>
                    <span style={{ fontWeight: 600, color: c.geocodeEnabled ? '#86efac' : 'var(--text2)' }}>{c.geocodeEnabled ? 'Enabled' : 'Off'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text2)' }}>Fail Rate</span>
                    <span style={{ fontWeight: 600, color: c.failRate > 5 ? '#f87171' : '#86efac' }}>{c.failRate}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
