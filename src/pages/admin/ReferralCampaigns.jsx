import { useState, useEffect } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { getAdminReferralCampaigns } from '../../api/mlmApi'

const STATUS_COLOR = { active: '#86efac', scheduled: '#93c5fd', ended: '#94a3b8', draft: '#fbbf24' }
const TYPE_COLOR = { bonus_cash: '#86efac', double_points: '#fbbf24', gift: '#f9a8d4', tier_skip: '#818cf8' }
const TYPE_LABEL = { bonus_cash: 'Cash Bonus', double_points: '2× Points', gift: 'Gift', tier_skip: 'Tier Skip' }

export default function AdminReferralCampaigns() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    setLoading(true)
    getAdminReferralCampaigns().then(setData).finally(() => setLoading(false))
  }, [])

  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 18px' }
  const campaigns = (data?.campaigns || []).filter(c => filter === 'all' || c.status === filter)

  return (
    <AdminLayout>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 22 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>Referral Campaigns</h1>
            <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: 14 }}>Structured bonus campaigns layered on top of the standard referral programme</p>
          </div>
          <button onClick={() => setShowModal(true)} style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: '#6366f1', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>+ New Campaign</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 14, marginBottom: 22 }}>
          {[
            { label: 'Active', value: (data?.campaigns || []).filter(c => c.status === 'active').length, color: '#86efac' },
            { label: 'Total Referrals (active)', value: data?.totalReferrals || 0, color: '#93c5fd' },
            { label: 'Bonuses Paid', value: `NOK ${(data?.bonusesPaid || 0).toLocaleString()}`, color: '#fbbf24' },
            { label: 'Conversion Rate', value: `${data?.conversionRate || 0}%`, color: '#818cf8' },
          ].map(k => (
            <div key={k.label} style={card}>
              <div style={{ fontSize: 20, fontWeight: 700, color: k.color }}>{loading ? '…' : k.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{k.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          {['all', 'active', 'scheduled', 'ended', 'draft'].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ padding: '5px 14px', borderRadius: 20, border: '1px solid var(--border)', background: filter === f ? '#6366f1' : 'transparent', color: filter === f ? '#fff' : 'var(--text)', cursor: 'pointer', fontSize: 13, textTransform: 'capitalize' }}>{f}</button>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {loading ? <div style={{ ...card, textAlign: 'center', color: 'var(--text-muted)' }}>Loading…</div> : campaigns.length === 0 ? <div style={{ ...card, textAlign: 'center', color: 'var(--text-muted)' }}>No campaigns</div> : campaigns.map(c => (
            <div key={c.id} style={card}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
                    <span style={{ fontWeight: 700, fontSize: 15 }}>{c.name}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: STATUS_COLOR[c.status], background: `${STATUS_COLOR[c.status]}22`, borderRadius: 5, padding: '2px 8px', textTransform: 'capitalize' }}>{c.status}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: TYPE_COLOR[c.type], background: `${TYPE_COLOR[c.type]}22`, borderRadius: 5, padding: '2px 8px' }}>{TYPE_LABEL[c.type]}</span>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>{c.description}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{c.startDate} → {c.endDate} · Eligible: {c.eligibility}</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, minWidth: 200 }}>
                  {[
                    { label: 'Enrolled', value: c.enrolled },
                    { label: 'Referred', value: c.referred },
                    { label: 'Converted', value: c.converted },
                    { label: 'Bonus/ref', value: `NOK ${c.bonusPerRef}` },
                  ].map(s => (
                    <div key={s.label} style={{ background: 'rgba(99,102,241,.06)', borderRadius: 7, padding: '8px 10px', textAlign: 'center' }}>
                      <div style={{ fontSize: 15, fontWeight: 700 }}>{s.value}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                {c.status === 'active' && <button style={{ padding: '5px 14px', borderRadius: 7, border: '1px solid #f87171', background: 'transparent', color: '#f87171', cursor: 'pointer', fontSize: 12 }}>Pause</button>}
                <button style={{ padding: '5px 14px', borderRadius: 7, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)', cursor: 'pointer', fontSize: 12 }}>Edit</button>
                <button style={{ padding: '5px 14px', borderRadius: 7, border: 'none', background: '#6366f122', color: '#818cf8', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>View Report</button>
              </div>
            </div>
          ))}
        </div>

        {showModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
            <div style={{ ...card, width: '100%', maxWidth: 500, maxHeight: '90vh', overflowY: 'auto' }}>
              <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 16 }}>New Referral Campaign</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {['Campaign Name', 'Description'].map(f => (
                  <div key={f}>
                    <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>{f}</label>
                    {f === 'Description' ? <textarea rows={2} style={{ width: '100%', padding: '8px 10px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--input)', color: 'var(--text)', resize: 'vertical', boxSizing: 'border-box' }} /> : <input style={{ width: '100%', padding: '8px 10px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--input)', color: 'var(--text)', boxSizing: 'border-box' }} />}
                  </div>
                ))}
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Bonus Type</label>
                  <select style={{ width: '100%', padding: '8px 10px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--input)', color: 'var(--text)' }}>
                    <option value="bonus_cash">Cash Bonus</option>
                    <option value="double_points">Double Points</option>
                    <option value="gift">Gift</option>
                    <option value="tier_skip">Tier Skip</option>
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {['Start Date', 'End Date'].map(f => (
                    <div key={f}>
                      <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>{f}</label>
                      <input type="date" style={{ width: '100%', padding: '8px 10px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--input)', color: 'var(--text)', boxSizing: 'border-box' }} />
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 18, justifyContent: 'flex-end' }}>
                <button onClick={() => setShowModal(false)} style={{ padding: '8px 18px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)', cursor: 'pointer' }}>Cancel</button>
                <button onClick={() => setShowModal(false)} style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: '#6366f1', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>Create Campaign</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
