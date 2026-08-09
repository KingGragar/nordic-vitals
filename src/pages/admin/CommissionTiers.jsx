import { useState, useEffect } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { getAdminCommissionTiers } from '../../api/mlmApi'

export default function AdminCommissionTiers() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editId, setEditId] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [typeFilter, setTypeFilter] = useState('all')

  useEffect(() => {
    setLoading(true)
    getAdminCommissionTiers().then(setData).finally(() => setLoading(false))
  }, [])

  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 18px' }
  const RANK_COLOR = ['#a1a1aa', '#86efac', '#93c5fd', '#fbbf24', '#f0abfc', '#818cf8']

  const tiers = (data?.tiers || []).filter(t => typeFilter === 'all' || t.type === typeFilter)

  return (
    <AdminLayout>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>Commission Tiers</h1>
            <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: 14 }}>Configure rank-based commission rates and volume bonuses</p>
          </div>
          <button onClick={() => setShowModal(true)} style={{ padding: '9px 18px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>+ Add Tier</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 14, marginBottom: 22 }}>
          {[
            { label: 'Total Tiers', value: data?.totalTiers ?? '—', color: '#93c5fd' },
            { label: 'Avg Personal Rate', value: data?.avgPersonalRate ? `${data.avgPersonalRate}%` : '—', color: '#86efac' },
            { label: 'Avg Team Rate', value: data?.avgTeamRate ? `${data.avgTeamRate}%` : '—', color: '#fbbf24' },
            { label: 'Members on Plans', value: (data?.membersOnPlans || 0).toLocaleString(), color: '#818cf8' },
          ].map(k => (
            <div key={k.label} style={card}>
              <div style={{ fontSize: 20, fontWeight: 700, color: k.color }}>{loading ? '…' : k.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{k.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
          {['all', 'personal', 'team', 'bonus'].map(t => (
            <button key={t} onClick={() => setTypeFilter(t)} style={{ padding: '6px 16px', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, background: typeFilter === t ? '#6366f1' : 'var(--border)', color: typeFilter === t ? '#fff' : 'var(--text-muted)', textTransform: 'capitalize' }}>{t}</button>
          ))}
        </div>

        <div style={{ overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)' }}>
                {['Rank', 'Type', 'Personal %', 'Team %', 'Min PV', 'Min Group PV', 'Members', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} style={{ padding: 24, color: 'var(--text-muted)', textAlign: 'center' }}>Loading…</td></tr>
              ) : tiers.map((t, i) => (
                <tr key={t.id} style={{ borderBottom: '1px solid var(--border)', background: editId === t.id ? 'var(--border)' : 'transparent' }}>
                  <td style={{ padding: '12px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: RANK_COLOR[i % RANK_COLOR.length], flexShrink: 0 }} />
                      <span style={{ fontWeight: 700 }}>{t.rankName}</span>
                    </div>
                  </td>
                  <td style={{ padding: '12px 12px' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#93c5fd', background: '#93c5fd22', borderRadius: 5, padding: '2px 7px', textTransform: 'capitalize' }}>{t.type}</span>
                  </td>
                  <td style={{ padding: '12px 12px', fontWeight: 700, color: '#86efac' }}>{t.personalPct}%</td>
                  <td style={{ padding: '12px 12px', fontWeight: 700, color: '#fbbf24' }}>{t.teamPct}%</td>
                  <td style={{ padding: '12px 12px', color: 'var(--text-muted)' }}>{t.minPv.toLocaleString()}</td>
                  <td style={{ padding: '12px 12px', color: 'var(--text-muted)' }}>{t.minGroupPv.toLocaleString()}</td>
                  <td style={{ padding: '12px 12px' }}>{t.memberCount.toLocaleString()}</td>
                  <td style={{ padding: '12px 12px' }}>
                    <button onClick={() => setEditId(editId === t.id ? null : t.id)} style={{ padding: '5px 12px', background: 'var(--border)', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: 24, ...card }}>
          <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700 }}>Generation Override Rules</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {(data?.overrideRules || []).map(r => (
              <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--bg)', borderRadius: 8, border: '1px solid var(--border)' }}>
                <div>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>{r.description}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 12 }}>{r.condition}</span>
                </div>
                <span style={{ fontWeight: 700, color: '#86efac', fontSize: 14 }}>{r.rate}%</span>
              </div>
            ))}
          </div>
        </div>

        {showModal && (
          <div style={{ position: 'fixed', inset: 0, background: '#0008', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ ...card, width: 440, maxWidth: '90vw' }}>
              <h2 style={{ margin: '0 0 16px', fontSize: 17, fontWeight: 700 }}>Add Commission Tier</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
                {[['Rank Name', 'e.g. Diamond'], ['Personal %', '10'], ['Team %', '5'], ['Min PV', '500'], ['Min Group PV', '5000']].map(([label, placeholder]) => (
                  <div key={label}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>{label}</label>
                    <input placeholder={placeholder} style={{ width: '100%', padding: '8px 10px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 14, boxSizing: 'border-box' }} />
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button onClick={() => setShowModal(false)} style={{ padding: '8px 18px', background: 'var(--border)', border: 'none', borderRadius: 7, cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
                <button onClick={() => setShowModal(false)} style={{ padding: '8px 18px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', fontWeight: 600 }}>Save Tier</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
