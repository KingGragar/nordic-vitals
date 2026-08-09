import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { getMemberNutritionLog, addMemberNutritionEntry } from '../../api/mlmApi'

const MEAL_ICONS = { Breakfast: '🌅', Lunch: '☀️', Dinner: '🌙', 'Pre-workout': '💪', Snack: '🍎' }

export default function DashNutritionLog() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ meal: 'Breakfast', food: '', calories: '', protein: '', carbs: '', fat: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getMemberNutritionLog().then(setData).finally(() => setLoading(false))
  }, [])

  async function handleAdd(e) {
    e.preventDefault()
    setSaving(true)
    const entry = { ...form, calories: +form.calories, protein: +form.protein, carbs: +form.carbs, fat: +form.fat, time: new Date().toTimeString().slice(0, 5), linkedProduct: null }
    await addMemberNutritionEntry(entry)
    setData(prev => ({
      ...prev,
      today: {
        ...prev.today,
        calories: prev.today.calories + entry.calories,
        protein: prev.today.protein + entry.protein,
        carbs: prev.today.carbs + entry.carbs,
        fat: prev.today.fat + entry.fat,
      },
      entries: [...prev.entries, { ...entry, id: 'nl_new_' + prev.entries.length }],
    }))
    setForm({ meal: 'Breakfast', food: '', calories: '', protein: '', carbs: '', fat: '' })
    setShowAdd(false)
    setSaving(false)
  }

  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 18px' }
  const inp = { padding: '7px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 13, width: '100%', boxSizing: 'border-box' }

  if (loading) return <DashboardLayout><div style={{ textAlign: 'center', padding: 80, color: 'var(--text2)' }}>Loading…</div></DashboardLayout>
  if (!data) return null

  const calPct = Math.min(100, Math.round((data.today.calories / data.today.targetCalories) * 100))
  const protPct = Math.min(100, Math.round((data.today.protein / data.today.targetProtein) * 100))
  const maxCals = Math.max(...data.weeklyAvg.map(d => d.calories), data.today.targetCalories)

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22, flexWrap: 'wrap', gap: 10 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 4 }}>🥗 Nutrition Log</div>
            <div style={{ color: 'var(--text2)', fontSize: 14 }}>Daily macro tracking, meal entries, and weekly calorie overview.</div>
          </div>
          <button onClick={() => setShowAdd(s => !s)} style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: 'var(--gold)', color: '#000', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            {showAdd ? '✕ Cancel' : '+ Add Meal'}
          </button>
        </div>

        {showAdd && (
          <form onSubmit={handleAdd} style={{ ...card, marginBottom: 20 }}>
            <div style={{ fontWeight: 700, marginBottom: 14 }}>Add Meal Entry</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Meal</label>
                <select value={form.meal} onChange={e => setForm(f => ({ ...f, meal: e.target.value }))} style={inp}>
                  {['Breakfast', 'Lunch', 'Dinner', 'Pre-workout', 'Snack'].map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Food description</label>
                <input value={form.food} onChange={e => setForm(f => ({ ...f, food: e.target.value }))} required style={inp} placeholder="e.g. Chicken breast + salad" />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 14 }}>
              {['calories', 'protein', 'carbs', 'fat'].map(k => (
                <div key={k}>
                  <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 4, textTransform: 'capitalize' }}>{k} {k === 'calories' ? '(kcal)' : '(g)'}</label>
                  <input type="number" min="0" value={form[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} required style={inp} />
                </div>
              ))}
            </div>
            <button type="submit" disabled={saving} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: '#166534', color: '#86efac', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              {saving ? 'Saving…' : 'Add Entry'}
            </button>
          </form>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
          {[
            { label: 'Calories', current: data.today.calories, target: data.today.targetCalories, unit: 'kcal', pct: calPct, color: '#fbbf24' },
            { label: 'Protein',  current: data.today.protein,  target: data.today.targetProtein,  unit: 'g',    pct: protPct, color: '#a5b4fc' },
          ].map(m => (
            <div key={m.label} style={card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontWeight: 700 }}>{m.label}</span>
                <span style={{ fontSize: 13, color: 'var(--text2)' }}>{m.current}/{m.target} {m.unit}</span>
              </div>
              <div style={{ height: 8, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${m.pct}%`, background: m.color, borderRadius: 4 }} />
              </div>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 6 }}>{m.pct}% of daily target</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(60px,1fr))', gap: 8, marginBottom: 14 }}>
          {[
            { label: 'Calories', val: data.today.calories, color: '#fbbf24' },
            { label: 'Protein',  val: `${data.today.protein}g`, color: '#a5b4fc' },
            { label: 'Carbs',    val: `${data.today.carbs}g`,   color: '#86efac' },
            { label: 'Fat',      val: `${data.today.fat}g`,     color: '#f9a8d4' },
          ].map(s => (
            <div key={s.label} style={{ ...card, textAlign: 'center', padding: '10px 8px' }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: s.color }}>{s.val}</div>
              <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ fontWeight: 700, marginBottom: 12 }}>Today's Meals</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 28 }}>
          {data.entries.map(e => (
            <div key={e.id} style={{ ...card, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 20 }}>{MEAL_ICONS[e.meal] || '🍽️'}</span>
              <div style={{ flex: '1 1 180px' }}>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{e.meal}</div>
                <div style={{ color: 'var(--text2)', fontSize: 12 }}>{e.food}</div>
                {e.linkedProduct && <div style={{ fontSize: 11, color: '#a5b4fc', marginTop: 2 }}>📦 {e.linkedProduct}</div>}
              </div>
              <div style={{ display: 'flex', gap: 14, fontSize: 12, color: 'var(--text2)', flexWrap: 'wrap' }}>
                <span><b style={{ color: '#fbbf24' }}>{e.calories}</b> kcal</span>
                <span><b style={{ color: '#a5b4fc' }}>{e.protein}g</b> P</span>
                <span><b style={{ color: '#86efac' }}>{e.carbs}g</b> C</span>
                <span><b style={{ color: '#f9a8d4' }}>{e.fat}g</b> F</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text2)', minWidth: 40 }}>{e.time}</div>
            </div>
          ))}
        </div>

        <div style={{ fontWeight: 700, marginBottom: 12 }}>Weekly Calories</div>
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 100 }}>
            {data.weeklyAvg.map(d => {
              const h = d.calories > 0 ? Math.max(8, Math.round((d.calories / maxCals) * 100)) : 4
              return (
                <div key={d.day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div title={`${d.calories} kcal`} style={{ width: '100%', height: h, background: d.calories > 0 ? '#fbbf24' : 'var(--border)', borderRadius: 3, cursor: 'default', opacity: d.calories > 0 ? 1 : 0.3 }} />
                  <div style={{ fontSize: 10, color: 'var(--text2)' }}>{d.day}</div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
