/**
 * Arctico MLM API client.
 * Set VITE_MLM_API_URL and VITE_MLM_API_KEY when the backend is deployed.
 * Until then every call resolves with mock data from src/data/mock.js.
 */
import {
  USERS, COMMISSIONS, WALLET_TXS, TREE_DATA,
  ADMIN_MEMBERS, PAYOUT_QUEUE, ORDERS, COMMISSION_RUNS, PRODUCTS, PRODUCT_REVIEWS, ADMIN_ORDERS, ANNOUNCEMENTS, AUDIT_LOG, SUPPORT_TICKETS, AUTOSHIPS, RESOURCES, PROMO_CODES, REFERRAL_STATS, EMAIL_TEMPLATES,
  TOKEN_STATS, TOKEN_EVENTS, RANK_HISTORY, ANALYTICS_DATA, TRAINING_MODULES, EVENTS, EMAIL_CAMPAIGNS, KYC_SUBMISSIONS, NETWORK_ANALYTICS, LOYALTY_DATA,
  INVENTORY, STOCK_MOVEMENTS, ADMIN_NOTIFICATIONS, FINANCIAL_DATA, ACTIVITY_LOG, ACTIVITY_GOALS,
  BUNDLES,
  PRODUCT_LOOKUP, ADMIN_ORDER_NOTES,
  CHALLENGES, CHALLENGE_LEADERBOARDS,
  EXCHANGE_RATES,
  BANNERS,
  CONVERSATIONS,
  DIRECT_MESSAGES,
  SOCIAL_EVENTS,
  SYSTEM_STATUS,
  INCIDENT_LOG,
  CERTIFICATES,
  RETAIL_CUSTOMERS,
  RETAIL_CUSTOMER_ORDERS,
  PAYMENT_METHODS,
  FAST_START_TIERS,
  FAST_START_PROGRESS,
  FAST_START_LEADERBOARD,
  COMMISSION_APPEALS,
  RETURN_REQUESTS,
  GDPR_REQUESTS,
  BLOG_POSTS,
  NEWSLETTER_SUBSCRIBERS,
  MEMBER_SEGMENTS,
  SHIPPING_ZONES,
  MEMBERSHIP_FEE_CONFIG,
  SUBSCRIPTION_PLANS,
  MEMBER_SUBSCRIPTIONS,
  PRICE_LISTS,
  PRICE_OVERRIDES,
  SMS_CAMPAIGNS,
  SMS_STATS,
  MEMBER_VOUCHERS,
  MEMBER_WEBINARS,
  MEMBER_WEBINAR_RECORDINGS,
  PUSH_CAMPAIGNS,
  PUSH_STATS,
  MEMBER_PAYOUTS,
  API_KEYS,
  API_KEY_SCOPES,
  API_KEY_STATS,
  TERRITORIES,
  MEMBER_REFERRAL_LINKS,
  MEMBER_REFERRAL_LINK_STATS,
  MEMBER_ACHIEVEMENTS,
  INFLUENCERS,
  INFLUENCER_STATS,
  INFLUENCER_TIERS,
  INFLUENCER_PLATFORMS,
  COMMISSION_STATEMENTS,
  COMMISSION_STATEMENT_SUMMARY,
} from '../data/mock'

const MEMBER_STATUS_OVERRIDE = {}

const BASE = import.meta.env.VITE_MLM_API_URL || ''
const KEY  = import.meta.env.VITE_MLM_API_KEY  || ''

const MOCK = !BASE

let AUTH_TOKEN = ''
export function setAuthToken(token) { AUTH_TOKEN = token }

// Tracks 2FA enabled state per userId in mock mode
const _mock2FA = {}
// Tracks pending login (userId awaiting 2FA) in mock mode
let _mock2FAPendingUser = null

async function request(method, path, body) {
  const headers = { 'Content-Type': 'application/json', 'x-api-key': KEY }
  if (AUTH_TOKEN) headers['Authorization'] = `Bearer ${AUTH_TOKEN}`
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
  const json = await res.json()
  if (!json.ok) throw new Error(json.error || 'API error')
  return json.data
}

// ── Auth ─────────────────────────────────────────────────────────────────────

export async function loginUser(email, password) {
  if (MOCK) {
    const found = USERS.find(u => u.email === email && u.password === password)
    if (!found) throw new Error('Invalid email or password')
    if (_mock2FA[found.userId]) {
      _mock2FAPendingUser = found
      return { twoFactorRequired: true, userId: found.userId }
    }
    const { password: _pw, ...safe } = found
    return safe
  }
  const data = await request('POST', '/v1/mlm/auth/login', { email, password })
  if (data.token) setAuthToken(data.token)
  return {
    userId:   data.user_id,
    email:    data.email,
    name:     data.name,
    memberId: data.member_id,
    role:     data.role,
    rank:     data.rank     || 'Bronze',
    pv:       data.pv       || 0,
    leftGV:   data.left_gv  || 0,
    rightGV:  data.right_gv || 0,
  }
}

export async function forgotPassword(email) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 700))
    const found = USERS.find(u => u.email === email)
    if (!found) return { sent: true }
    return { sent: true }
  }
  return request('POST', '/v1/mlm/auth/forgot-password', { email })
}

export async function resetPassword(token, newPassword) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 700))
    return { ok: true }
  }
  return request('POST', '/v1/mlm/auth/reset-password', { token, password: newPassword })
}

// ── Two-Factor Authentication ─────────────────────────────────────────────────

const MOCK_2FA_SECRET = 'JBSWY3DPEHPK3PXP'

export async function setup2FA(userId, email) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 500))
    const label = encodeURIComponent(`Nordic Vitals:${email || 'member@nordic.no'}`)
    const issuer = encodeURIComponent('Nordic Vitals')
    return {
      secret: MOCK_2FA_SECRET,
      qr_uri: `otpauth://totp/${label}?secret=${MOCK_2FA_SECRET}&issuer=${issuer}`,
    }
  }
  return request('POST', '/v1/mlm/auth/2fa/setup', { user_id: userId })
}

export async function enable2FA(userId, code) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 600))
    if (!/^\d{6}$/.test(code)) throw new Error('Enter a valid 6-digit code')
    if (code === '000000') throw new Error('Invalid code — try again')
    _mock2FA[userId] = true
    return { ok: true }
  }
  return request('POST', '/v1/mlm/auth/2fa/enable', { code })
}

export async function disable2FA(userId, code) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 600))
    if (!/^\d{6}$/.test(code)) throw new Error('Enter a valid 6-digit code')
    if (code === '000000') throw new Error('Invalid code — try again')
    _mock2FA[userId] = false
    return { ok: true }
  }
  return request('POST', '/v1/mlm/auth/2fa/disable', { code })
}

export async function verify2FALogin(userId, code) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 600))
    if (!/^\d{6}$/.test(code)) throw new Error('Enter a valid 6-digit code')
    if (code === '000000') throw new Error('Invalid code — try again')
    const found = _mock2FAPendingUser
    _mock2FAPendingUser = null
    if (!found || found.userId !== userId) throw new Error('Session expired — please log in again')
    const { password: _pw, ...safe } = found
    return safe
  }
  return request('POST', '/v1/mlm/auth/2fa/verify', { user_id: userId, code })
}

export function isMock2FAEnabled(userId) {
  return !!_mock2FA[userId]
}

// ── Genealogy ────────────────────────────────────────────────────────────────

export async function enrollMember({ userId, planType = 'binary', sponsorUserId, leg }) {
  if (MOCK) return { node: { id: userId, plan_type: planType, sponsor_user_id: sponsorUserId, leg } }
  return request('POST', '/v1/mlm/genealogy/enroll', { user_id: userId, plan_type: planType, sponsor_user_id: sponsorUserId, leg })
}

export async function getNode(id) {
  if (MOCK) return TREE_DATA
  return request('GET', `/v1/mlm/genealogy/node/${id}`)
}

export async function getNodeByUser(userId) {
  if (MOCK) return { node: { id: userId, user_id: userId, plan_type: 'binary', active: true } }
  return request('GET', `/v1/mlm/genealogy/node-by-user/${userId}`)
}

export async function getTree(rootNodeId, { tree = 'placement', depth = 10, plan_type = 'binary' } = {}) {
  if (MOCK) return {
    root: rootNodeId, tree, depth, count: 1, plan_type,
    nodes: [{ id: rootNodeId, user_id: 'mock', plan_type, sponsor_id: null, placement_parent_id: null, leg: null, active: false, depth: 0 }]
  }
  return request('GET', `/v1/mlm/genealogy/tree/${rootNodeId}?tree=${tree}&depth=${depth}&plan_type=${plan_type}`)
}

export async function getUpline(id, tree = 'placement') {
  if (MOCK) return { upline: [] }
  return request('GET', `/v1/mlm/genealogy/upline/${id}?tree=${tree}`)
}

// ── Volume ───────────────────────────────────────────────────────────────────

export async function postVolumeEvent({ userId, planType = 'binary', pv, bv, orderId, sourceProject = 'nordic-vitals' }) {
  if (MOCK) return { id: 'mock-vol-' + Date.now(), inserted: true }
  return request('POST', '/v1/mlm/volume/events', {
    user_id: userId, plan_type: planType, pv, bv,
    currency: 'MLMT', source_project: sourceProject, order_id: orderId,
  })
}

// ── Transactions (member) ────────────────────────────────────────────────────

export async function getUserTransactions(userId) {
  if (MOCK) return {
    transactions: WALLET_TXS.map(tx => ({
      event_type: tx.debit ? 'withdrawal' : 'bonus_credit',
      amount: tx.credit || tx.debit,
      direction: tx.debit ? 'debit' : 'credit',
      currency: 'MLMT',
      user_id: userId,
      description: tx.desc,
      created_at: tx.date,
      balance: tx.balance,
    }))
  }
  return request('GET', `/v1/mlm/transactions/user/${userId}`)
}

// ── Commissions (member) — shape TBD from Arctico; using mock for now ────────

export async function getCommissions() {
  if (MOCK) return { commissions: COMMISSIONS }
  return request('GET', '/v1/mlm/commissions')
}

// ── Admin ────────────────────────────────────────────────────────────────────

export async function getAdminTransactions({ currency = 'MLMT', limit = 50 } = {}) {
  if (MOCK) return {
    transactions: WALLET_TXS.map(tx => ({
      event_type: tx.debit ? 'withdrawal' : 'bonus_credit',
      amount: tx.credit || tx.debit,
      direction: tx.debit ? 'debit' : 'credit',
      currency,
      user_id: 'NV-10042',
      description: tx.desc,
      created_at: tx.date,
    }))
  }
  return request('GET', `/v1/mlm/admin/transactions?currency=${currency}&limit=${limit}`)
}

export async function getAdminSummary({ currency = 'MLMT' } = {}) {
  if (MOCK) return { total_supply: 100_000_000, holders: 12, total_bonus_paid: 3_133 }
  return request('GET', `/v1/mlm/admin/summary?currency=${currency}`)
}

export async function getAdminMembers() {
  if (MOCK) return { members: ADMIN_MEMBERS }
  return request('GET', '/v1/mlm/admin/members')
}

export async function getPayoutQueue() {
  if (MOCK) return { queue: PAYOUT_QUEUE }
  return request('GET', '/v1/mlm/admin/payouts/queue')
}

// ── Direct Downline (sponsor tree, depth 1) ───────────────────────────────────

export async function getDirectDownline(userId) {
  if (MOCK) return {
    recruits: ADMIN_MEMBERS
      .filter(m => m.sponsor === userId)
      .map(m => ({ id: m.id, name: m.name, joined: m.joined, rank: m.rank, status: m.status }))
  }
  const nodeData = await request('GET', `/v1/mlm/genealogy/node-by-user/${userId}`)
  const nodeId = nodeData?.node?.id
  if (!nodeId) return { recruits: [] }
  const treeData = await request('GET', `/v1/mlm/genealogy/tree/${nodeId}?tree=sponsor&depth=1`)
  return {
    recruits: (treeData?.nodes || [])
      .filter(n => n.depth === 1)
      .map(n => ({ id: n.user_id, name: n.user_id, joined: n.created_at, rank: n.rank || 'Unranked', status: n.active ? 'Active' : 'Inactive' }))
  }
}

// ── VP Products (storefront catalog) ─────────────────────────────────────────

export async function getVpProducts() {
  if (MOCK) return { products: PRODUCTS }
  return request('GET', '/api/viking-peptides/products')
}

// ── Orders (member product orders that generate PV) ──────────────────────────

export async function getOrders(userId) {
  if (MOCK) return { orders: ORDERS }
  return request('GET', `/api/viking-peptides/orders?user_id=${userId}`)
}

export async function getOrderDetail(orderId) {
  if (MOCK) {
    const order = ORDERS.find(o => o.id === orderId)
    if (!order) throw new Error('Order not found')
    const lineItems = order.items.map(str => {
      const m = str.match(/^(.+?)\s*[×x](\d+)$/)
      const name = m ? m[1].trim() : str.trim()
      const qty  = m ? parseInt(m[2]) : 1
      const lk   = PRODUCT_LOOKUP[name] || { price: Math.round(order.total / order.items.length), pv: 0 }
      return { name, qty, unitPrice: lk.price, pv: lk.pv, total: lk.price * qty }
    })
    const subtotalExMva = Math.round(order.total / 1.25)
    const mvaAmount     = order.total - subtotalExMva
    return {
      ...order,
      lineItems,
      subtotalExMva,
      mvaAmount,
      mvaRate: 25,
      payment: { method: 'Bankoverføring', ref: `BT-${order.id.replace('NV-ORD-', '')}` },
      shipping: { name: 'Lars Eriksen', address: 'Storgata 14', city: 'Oslo', postalCode: '0182', country: 'Norge' },
      billing:  { name: 'Lars Eriksen', memberId: 'NV-10042', address: 'Storgata 14', city: 'Oslo', postalCode: '0182', country: 'Norge' },
      company: {
        name: 'Nordic Vitals AS', orgNo: '925 812 456',
        address: 'Drammensveien 40', city: 'Oslo', postalCode: '0255', country: 'Norge',
        email: 'support@nordicvitals.no', vatNo: 'NO 925 812 456 MVA',
      },
    }
  }
  return request('GET', `/api/viking-peptides/orders/${orderId}`)
}

export async function placeOrder({ userId, items, shippingAddress, orderRef, promoCode, discount, total: orderTotal }) {
  const total = orderTotal ?? items.reduce((s, i) => s + i.price * i.qty, 0)
  const pv    = items.reduce((s, i) => s + (i.pv || i.price) * i.qty, 0)
  if (MOCK) return { order: { id: orderRef, status: 'pending', total, pv } }
  return request('POST', '/api/viking-peptides/orders', {
    user_id: userId, items, shipping_address: shippingAddress, order_ref: orderRef,
    promo_code: promoCode, discount, total, pv,
  })
}

export async function processPayment({ orderRef, method, amount, currency = 'NOK', paymentDetails }) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 1200))
    return { success: true, transactionId: 'TXN-' + Math.random().toString(36).slice(2,10).toUpperCase(), method, amount }
  }
  return request('POST', '/api/viking-peptides/payments', {
    order_ref: orderRef, method, amount, currency, payment_details: paymentDetails,
  })
}

// ── Earnings (PENDING — endpoint not yet shipped by Arctico) ─────────────────
// Returns null in mock mode so the caller falls back to its own mock data.
// When GET /v1/mlm/admin/earnings/:userId ships, this will return live data.
export async function getEarnings(userId, { planType = 'binary' } = {}) {
  if (MOCK) return null
  return request('GET', `/v1/mlm/admin/earnings/${userId}?plan_type=${planType}`)
}

// ── Commission Runs ───────────────────────────────────────────────────────────

export async function getCommissionRuns({ limit = 20 } = {}) {
  if (MOCK) return { runs: COMMISSION_RUNS }
  return request('GET', `/v1/mlm/admin/commission-runs?limit=${limit}`)
}

export async function triggerCommissionRun({ type = 'manual' } = {}) {
  if (MOCK) return { run_id: `#mock-${Date.now()}`, status: 'Running', type }
  return request('POST', '/v1/mlm/admin/commission-runs/trigger', { type })
}

// ── Admin Settings ────────────────────────────────────────────────────────────

const SETTINGS_DEFAULTS = {
  company_name: 'Nordic Vitals AS',
  currency: 'NOK',
  timezone: 'Europe/Oslo',
  language: 'Norwegian',
  notifications: { new_member: true, rank_change: true, commission_run: true, sms_withdrawal: false },
  maintenance_mode: false,
  maintenance_message: "We're performing scheduled maintenance. Back soon!",
  maintenance_return: '',
}

export async function getAdminSettings() {
  if (MOCK) {
    try {
      const saved = localStorage.getItem('nv_admin_settings')
      return saved ? { ...SETTINGS_DEFAULTS, ...JSON.parse(saved) } : { ...SETTINGS_DEFAULTS }
    } catch { return { ...SETTINGS_DEFAULTS } }
  }
  return request('GET', '/v1/mlm/admin/settings')
}

export async function saveAdminSettings(settings) {
  if (MOCK) {
    try { localStorage.setItem('nv_admin_settings', JSON.stringify(settings)) } catch {}
    return { ok: true }
  }
  return request('POST', '/v1/mlm/admin/settings', settings)
}

export function readMaintenanceMode() {
  try {
    const saved = localStorage.getItem('nv_admin_settings')
    if (!saved) return { active: false, message: '', returnTime: '' }
    const s = JSON.parse(saved)
    return { active: !!s.maintenance_mode, message: s.maintenance_message || '', returnTime: s.maintenance_return || '' }
  } catch { return { active: false, message: '', returnTime: '' } }
}

// ── Plan Config ───────────────────────────────────────────────────────────────

export async function getPlanConfig() {
  if (MOCK) return {
    ranks: [
      { rank: 'Unranked', min_pv: 0,    min_left_gv: 0,     min_right_gv: 0,     pairing_cap: 100,  sponsor_bonus: 5,  x_factor_cap: 35 },
      { rank: 'Bronze',   min_pv: 100,  min_left_gv: 500,   min_right_gv: 500,   pairing_cap: 500,  sponsor_bonus: 7,  x_factor_cap: 35 },
      { rank: 'Silver',   min_pv: 300,  min_left_gv: 2000,  min_right_gv: 2000,  pairing_cap: 1500, sponsor_bonus: 10, x_factor_cap: 35 },
      { rank: 'Gold',     min_pv: 500,  min_left_gv: 5000,  min_right_gv: 5000,  pairing_cap: 3000, sponsor_bonus: 12, x_factor_cap: 35 },
      { rank: 'Platinum', min_pv: 1000, min_left_gv: 15000, min_right_gv: 15000, pairing_cap: 8000, sponsor_bonus: 15, x_factor_cap: 35 },
    ],
    levels: [
      { level: 'L1', rate: 5 }, { level: 'L2', rate: 3 }, { level: 'L3', rate: 2 },
      { level: 'L4', rate: 1 }, { level: 'L5', rate: 0.5 },
    ],
    x_factor_cap: 35,
    cycle_period: 'Weekly',
    payout_day: 'Sunday',
  }
  return request('GET', '/v1/mlm/admin/plan-config')
}

export async function savePlanConfig(config) {
  if (MOCK) return { ok: true }
  return request('POST', '/v1/mlm/admin/plan-config', config)
}

// ── Member Profile ────────────────────────────────────────────────────────────

export async function updateProfile(userId, { name, email, phone, country }) {
  if (MOCK) return { ok: true }
  return request('PUT', `/v1/mlm/users/${userId}/profile`, { name, email, phone, country })
}

export async function updatePassword(userId, { current_password, new_password }) {
  if (MOCK) return { ok: true }
  return request('POST', `/v1/mlm/users/${userId}/password`, { current_password, new_password })
}

// ── Admin Reports ─────────────────────────────────────────────────────────────

export async function getAdminTopEarners({ limit = 5, period = 'monthly' } = {}) {
  if (MOCK) return {
    earners: [
      { user_id: 'NV-10042', name: 'Lars Eriksen',  total_commissions: 2340 },
      { user_id: 'NV-10087', name: 'Mia Andersen',  total_commissions: 1890 },
      { user_id: 'NV-10230', name: 'Sigrid Voss',   total_commissions: 1440 },
      { user_id: 'NV-10091', name: 'Erik Solberg',  total_commissions: 980  },
      { user_id: 'NV-10241', name: 'Olaf Berg',     total_commissions: 670  },
    ].slice(0, limit)
  }
  return request('GET', `/v1/mlm/admin/reports/top-earners?limit=${limit}&period=${period}`)
}

export async function getAdminWeeklySignups({ weeks = 8 } = {}) {
  if (MOCK) return {
    weeks: [
      { week: 'May 26', count: 12 },
      { week: 'Jun 2',  count: 18 },
      { week: 'Jun 9',  count: 9  },
      { week: 'Jun 16', count: 24 },
      { week: 'Jun 23', count: 15 },
      { week: 'Jun 30', count: 31 },
      { week: 'Jul 7',  count: 22 },
      { week: 'Jul 13', count: 14 },
    ].slice(-weeks)
  }
  return request('GET', `/v1/mlm/admin/reports/weekly-signups?weeks=${weeks}`)
}

export async function getAdminNetworkVolume() {
  if (MOCK) return { network_pv: 42800, commissions_paid_last_run: 18400 }
  return request('GET', '/v1/mlm/admin/reports/network-volume')
}

// ── Product Reviews ───────────────────────────────────────────────────────────

const REVIEWS_KEY = 'nv_reviews'

function _getReviewStore() {
  try {
    const d = localStorage.getItem(REVIEWS_KEY)
    if (d) return JSON.parse(d)
  } catch (_) {}
  const flat = []
  Object.entries(PRODUCT_REVIEWS).forEach(([pid, reviews]) => {
    reviews.forEach(r => flat.push({ ...r, productId: Number(pid) }))
  })
  return flat
}

function _saveReviewStore(data) {
  try { localStorage.setItem(REVIEWS_KEY, JSON.stringify(data)) } catch (_) {}
}

export async function getProductReviews(productId) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 120))
    const store = _getReviewStore()
    const reviews = store.filter(r => r.productId === Number(productId) && r.status !== 'rejected')
    return { reviews }
  }
  return request('GET', `/api/viking-peptides/products/${productId}/reviews`)
}

export async function submitProductReview(productId, { rating, comment, reviewer, userId }) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 200))
    const store = _getReviewStore()
    const newReview = {
      id: `r${productId}-${Date.now()}`,
      productId: Number(productId),
      reviewer: reviewer || 'Anonymous',
      userId: userId || null,
      rating,
      comment,
      date: new Date().toISOString().slice(0, 10),
      verified: true,
      status: 'pending',
    }
    store.push(newReview)
    _saveReviewStore(store)
    return { ok: true }
  }
  return request('POST', `/api/viking-peptides/products/${productId}/reviews`, { rating, comment })
}

export async function getMyReviews(userId) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 150))
    const store = _getReviewStore()
    const mine = store.filter(r =>
      r.userId === userId || r.reviewer?.toLowerCase().startsWith('lars e')
    ).sort((a, b) => b.date.localeCompare(a.date))
    return { reviews: mine }
  }
  return request('GET', `/v1/mlm/reviews/my?userId=${userId}`)
}

export async function updateMyReview(reviewId, { rating, comment }) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 150))
    const store = _getReviewStore()
    const idx = store.findIndex(r => r.id === reviewId)
    if (idx !== -1) {
      store[idx] = { ...store[idx], rating, comment, status: 'pending' }
      _saveReviewStore(store)
    }
    return { success: true }
  }
  return request('PATCH', `/v1/mlm/reviews/${reviewId}`, { rating, comment })
}

export async function deleteMyReview(reviewId) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 120))
    _saveReviewStore(_getReviewStore().filter(r => r.id !== reviewId))
    return { success: true }
  }
  return request('DELETE', `/v1/mlm/reviews/${reviewId}`)
}

export async function getAdminReviews({ status = 'all', productId = null, search = '', limit = 50, offset = 0 } = {}) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 180))
    let store = _getReviewStore()
    if (status !== 'all') store = store.filter(r => r.status === status)
    if (productId) store = store.filter(r => r.productId === Number(productId))
    if (search) {
      const q = search.toLowerCase()
      store = store.filter(r =>
        r.reviewer.toLowerCase().includes(q) || r.comment.toLowerCase().includes(q)
      )
    }
    store = [...store].sort((a, b) => b.date.localeCompare(a.date))
    return { reviews: store.slice(offset, offset + limit), total: store.length }
  }
  const params = new URLSearchParams({ status, limit, offset })
  if (productId) params.set('productId', productId)
  if (search) params.set('search', search)
  return request('GET', `/v1/mlm/admin/reviews?${params}`)
}

export async function moderateReview(reviewId, status) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 150))
    const store = _getReviewStore()
    const idx = store.findIndex(r => r.id === reviewId)
    if (idx !== -1) store[idx].status = status
    _saveReviewStore(store)
    return { success: true }
  }
  return request('PATCH', `/v1/mlm/admin/reviews/${reviewId}`, { status })
}

export async function deleteAdminReview(reviewId) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 120))
    _saveReviewStore(_getReviewStore().filter(r => r.id !== reviewId))
    return { success: true }
  }
  return request('DELETE', `/v1/mlm/admin/reviews/${reviewId}`)
}

// ── Leaderboard ───────────────────────────────────────────────────────────────

export async function getLeaderboard({ period = 'monthly' } = {}) {
  if (MOCK) return {
    period,
    earners: [
      { user_id: 'NV-10042', name: 'Lars Eriksen',  rank: 'Silver',   total_mlmt: 2340, change: 0  },
      { user_id: 'NV-10087', name: 'Mia Andersen',  rank: 'Bronze',   total_mlmt: 1890, change: 1  },
      { user_id: 'NV-10230', name: 'Sigrid Voss',   rank: 'Bronze',   total_mlmt: 1440, change: -1 },
      { user_id: 'NV-10091', name: 'Erik Solberg',  rank: 'Unranked', total_mlmt: 980,  change: 2  },
      { user_id: 'NV-10241', name: 'Olaf Berg',     rank: 'Unranked', total_mlmt: 670,  change: 0  },
      { user_id: 'NV-10122', name: 'Anna Lund',     rank: 'Unranked', total_mlmt: 510,  change: 3  },
      { user_id: 'NV-10102', name: 'Kari Holm',     rank: 'Unranked', total_mlmt: 340,  change: -2 },
      { user_id: 'NV-10201', name: 'Per Nilsen',    rank: 'Unranked', total_mlmt: 180,  change: 1  },
      { user_id: 'NV-10215', name: 'Bjorn Lie',     rank: 'Unranked', total_mlmt: 120,  change: -1 },
      { user_id: 'NV-10118', name: 'Tor Bakke',     rank: 'Unranked', total_mlmt: 75,   change: 0  },
    ],
    recruiters: [
      { user_id: 'NV-10087', name: 'Mia Andersen',  rank: 'Bronze',   recruits: 8,  change: 2  },
      { user_id: 'NV-10042', name: 'Lars Eriksen',  rank: 'Silver',   recruits: 6,  change: 0  },
      { user_id: 'NV-10230', name: 'Sigrid Voss',   rank: 'Bronze',   recruits: 5,  change: 1  },
      { user_id: 'NV-10091', name: 'Erik Solberg',  rank: 'Unranked', recruits: 4,  change: -1 },
      { user_id: 'NV-10241', name: 'Olaf Berg',     rank: 'Unranked', recruits: 3,  change: 0  },
      { user_id: 'NV-10122', name: 'Anna Lund',     rank: 'Unranked', recruits: 3,  change: 4  },
      { user_id: 'NV-10215', name: 'Bjorn Lie',     rank: 'Unranked', recruits: 2,  change: 0  },
      { user_id: 'NV-10102', name: 'Kari Holm',     rank: 'Unranked', recruits: 1,  change: -2 },
      { user_id: 'NV-10201', name: 'Per Nilsen',    rank: 'Unranked', recruits: 1,  change: 1  },
      { user_id: 'NV-10118', name: 'Tor Bakke',     rank: 'Unranked', recruits: 0,  change: 0  },
    ],
    network: [
      { user_id: 'NV-10042', name: 'Lars Eriksen',  rank: 'Silver',   gv: 3050, pv: 320 },
      { user_id: 'NV-10087', name: 'Mia Andersen',  rank: 'Bronze',   gv: 1240, pv: 180 },
      { user_id: 'NV-10230', name: 'Sigrid Voss',   rank: 'Bronze',   gv: 340,  pv: 120 },
      { user_id: 'NV-10091', name: 'Erik Solberg',  rank: 'Unranked', gv: 600,  pv: 90  },
      { user_id: 'NV-10241', name: 'Olaf Berg',     rank: 'Unranked', gv: 50,   pv: 50  },
      { user_id: 'NV-10122', name: 'Anna Lund',     rank: 'Unranked', gv: 55,   pv: 30  },
      { user_id: 'NV-10102', name: 'Kari Holm',     rank: 'Unranked', gv: 60,   pv: 60  },
      { user_id: 'NV-10215', name: 'Bjorn Lie',     rank: 'Unranked', gv: 25,   pv: 25  },
      { user_id: 'NV-10201', name: 'Per Nilsen',    rank: 'Unranked', gv: 20,   pv: 20  },
      { user_id: 'NV-10118', name: 'Tor Bakke',     rank: 'Unranked', gv: 45,   pv: 45  },
    ],
  }
  return request('GET', `/v1/mlm/leaderboard?period=${period}`)
}

export async function verifyEmail(token) {
  // POST /v1/mlm/auth/verify-email  { token }
  // Returns { success: true, user_id } or throws
  if (!token) throw new Error('Missing verification token')
  try {
    return await request('POST', '/v1/mlm/auth/verify-email', { token })
  } catch {
    // Mock: any non-empty token succeeds
    if (token === 'INVALID') throw new Error('Invalid or expired token')
    return { success: true }
  }
}

export async function getNotifications(userId) {
  // GET /v1/mlm/members/:userId/notifications
  const MOCK_NOTIFS = [
    { id: 'n1', type: 'rank_up',    read: false, ts: '2026-07-25T08:00:00Z', title: 'Rank upgrade!',            body: 'Congratulations — you\'ve advanced to Silver rank.' },
    { id: 'n2', type: 'commission', read: false, ts: '2026-07-24T15:30:00Z', title: 'Commission credited',      body: '87.50 MLMT pairing bonus added to your wallet.' },
    { id: 'n3', type: 'referral',   read: false, ts: '2026-07-24T11:10:00Z', title: 'New team member',          body: 'Lars Eriksen joined your team on your left leg.' },
    { id: 'n4', type: 'commission', read: true,  ts: '2026-07-23T09:15:00Z', title: 'Weekly commission run',    body: 'Commission run #14 completed. 120.00 MLMT credited.' },
    { id: 'n5', type: 'system',     read: true,  ts: '2026-07-22T14:00:00Z', title: 'Platform maintenance',     body: 'Scheduled maintenance on Jul 23 03:00–04:00 UTC.' },
    { id: 'n6', type: 'referral',   read: true,  ts: '2026-07-21T17:45:00Z', title: 'New team member',          body: 'Mia Andersen joined your team on your right leg.' },
    { id: 'n7', type: 'system',     read: true,  ts: '2026-07-20T10:00:00Z', title: 'New products available',   body: '3 new products added to the Nordic Vitals catalogue.' },
    { id: 'n8', type: 'commission', read: true,  ts: '2026-07-17T09:15:00Z', title: 'Weekly commission run',    body: 'Commission run #13 completed. 95.00 MLMT credited.' },
  ]
  try {
    return await request('GET', `/v1/mlm/members/${userId}/notifications`)
  } catch {
    return MOCK_NOTIFS
  }
}

export async function markNotificationRead(userId, notifId) {
  // PATCH /v1/mlm/members/:userId/notifications/:notifId  { read: true }
  try {
    return await request('PATCH', `/v1/mlm/members/${userId}/notifications/${notifId}`, { read: true })
  } catch {
    return { success: true }
  }
}

export async function markAllNotificationsRead(userId) {
  // POST /v1/mlm/members/:userId/notifications/read-all
  try {
    return await request('POST', `/v1/mlm/members/${userId}/notifications/read-all`, {})
  } catch {
    return { success: true }
  }
}

// ── Admin Product Management ──────────────────────────────────────────────────

let _adminProducts = null

export async function getAdminProducts() {
  if (MOCK) {
    if (!_adminProducts) {
      _adminProducts = PRODUCTS.map(p => ({ ...p, active: true, stock: Math.floor(Math.random() * 200) + 20 }))
    }
    return { products: _adminProducts }
  }
  return request('GET', '/api/viking-peptides/admin/products')
}

export async function createProduct(product) {
  if (MOCK) {
    const newProduct = {
      ...product,
      id: Date.now(),
      active: true,
      stock: product.stock || 0,
    }
    if (!_adminProducts) await getAdminProducts()
    _adminProducts = [newProduct, ..._adminProducts]
    return { product: newProduct }
  }
  return request('POST', '/api/viking-peptides/admin/products', product)
}

export async function updateProduct(id, updates) {
  if (MOCK) {
    if (!_adminProducts) await getAdminProducts()
    _adminProducts = _adminProducts.map(p => p.id === id ? { ...p, ...updates } : p)
    return { product: _adminProducts.find(p => p.id === id) }
  }
  return request('PUT', `/api/viking-peptides/admin/products/${id}`, updates)
}

export async function toggleProductActive(id) {
  if (MOCK) {
    if (!_adminProducts) await getAdminProducts()
    _adminProducts = _adminProducts.map(p => p.id === id ? { ...p, active: !p.active } : p)
    return { product: _adminProducts.find(p => p.id === id) }
  }
  return request('POST', `/api/viking-peptides/admin/products/${id}/toggle`, {})
}

// ── Admin Order Management ────────────────────────────────────────────────────

let _adminOrders = null

export async function getAdminOrders({ status, search, limit = 200 } = {}) {
  if (MOCK) {
    if (!_adminOrders) _adminOrders = [...ADMIN_ORDERS]
    let result = _adminOrders
    if (status && status !== 'all') result = result.filter(o => o.status === status)
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(o =>
        o.id.toLowerCase().includes(q) ||
        o.member.toLowerCase().includes(q) ||
        o.memberId.toLowerCase().includes(q)
      )
    }
    return { orders: result.slice(0, limit) }
  }
  const params = new URLSearchParams()
  if (status && status !== 'all') params.set('status', status)
  if (search) params.set('search', search)
  if (limit) params.set('limit', String(limit))
  return request('GET', `/api/viking-peptides/admin/orders?${params}`)
}

export async function updateOrderStatus(orderId, status) {
  if (MOCK) {
    if (!_adminOrders) _adminOrders = [...ADMIN_ORDERS]
    _adminOrders = _adminOrders.map(o => o.id === orderId ? { ...o, status } : o)
    return { order: _adminOrders.find(o => o.id === orderId) }
  }
  return request('PATCH', `/api/viking-peptides/admin/orders/${orderId}`, { status })
}

export async function getAdminOrderDetail(orderId) {
  if (MOCK) {
    if (!_adminOrders) _adminOrders = [...ADMIN_ORDERS]
    const order = _adminOrders.find(o => o.id === orderId)
    if (!order) throw new Error('Order not found')
    const member = ADMIN_MEMBERS.find(m => m.id === order.memberId) || {}
    const cityByCountry = { Norway: 'Oslo', Sweden: 'Stockholm', Denmark: 'Copenhagen', Finland: 'Helsinki' }
    const postalByCountry = { Norway: '0150', Sweden: '111 20', Denmark: '1050', Finland: '00100' }
    const streetsByMember = {
      'NV-10042': 'Karl Johans gate 12', 'NV-10087': 'Drottninggatan 34', 'NV-10091': 'Storgata 8',
      'NV-10102': 'Nordre gate 5', 'NV-10118': 'Bergstien 21', 'NV-10122': 'Vasagatan 17',
      'NV-10201': 'Lillestrøm vei 3', 'NV-10208': 'Tverrveien 7', 'NV-10210': 'Bredgade 22',
      'NV-10215': 'Drammensveien 44', 'NV-10230': 'Majorstuen 19', 'NV-10241': 'Frognerveien 56',
    }
    const shipping = {
      name: order.member,
      address1: streetsByMember[order.memberId] || 'Storgata 1',
      city: cityByCountry[order.shippingCountry] || 'Oslo',
      postalCode: postalByCountry[order.shippingCountry] || '0150',
      country: order.shippingCountry || 'Norway',
    }
    const lineItems = order.items.map(str => {
      const m = str.match(/^(.+?)\s*[×x](\d+)$/)
      const name = m ? m[1].trim() : str
      const qty = m ? parseInt(m[2]) : 1
      const product = PRODUCT_LOOKUP[name] || { price: 0, pv: 0 }
      return { name, qty, unitPrice: product.price, pv: product.pv, subtotal: product.price * qty, pvSubtotal: product.pv * qty }
    })
    const statusOrder = ['Pending', 'Processing', 'Shipped', 'Delivered']
    const statusIdx = Math.max(0, statusOrder.indexOf(order.status))
    const baseDate = new Date(order.date + 'T10:00:00Z')
    const events = statusOrder.slice(0, statusIdx + 1).map((s, i) => {
      const d = new Date(baseDate)
      d.setDate(d.getDate() + i)
      return { status: s, timestamp: d.toISOString().replace('T', ' ').slice(0, 16) + ' UTC', note: s === 'Shipped' ? 'Carrier: Posten Norge / PostNord' : '' }
    })
    if (order.status === 'Cancelled') {
      const d = new Date(baseDate)
      d.setDate(d.getDate() + 1)
      events.push({ status: 'Cancelled', timestamp: d.toISOString().replace('T', ' ').slice(0, 16) + ' UTC', note: 'Cancelled by customer request' })
    }
    const notes = ADMIN_ORDER_NOTES[orderId] || []
    return {
      ...order,
      email: member.email || '',
      phone: member.phone || '',
      memberRank: member.rank || '',
      lineItems,
      shipping,
      paymentMethod: order.method || 'Bank Transfer',
      paymentRef: 'BT-' + orderId.replace('NV-ORD-', '') + '00',
      events,
      notes,
    }
  }
  return request('GET', `/api/viking-peptides/admin/orders/${orderId}`)
}

export async function addOrderNote(orderId, note) {
  if (MOCK) {
    if (!ADMIN_ORDER_NOTES[orderId]) ADMIN_ORDER_NOTES[orderId] = []
    const entry = { note, author: 'Admin', timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC' }
    ADMIN_ORDER_NOTES[orderId] = [entry, ...ADMIN_ORDER_NOTES[orderId]]
    return { note: entry }
  }
  return request('POST', `/api/viking-peptides/admin/orders/${orderId}/notes`, { note })
}

export async function createManualOrder({ memberId, memberName, items, shippingAddress, paymentMethod }) {
  if (MOCK) {
    if (!_adminOrders) _adminOrders = [...ADMIN_ORDERS]
    const maxNum = _adminOrders.reduce((m, o) => Math.max(m, parseInt(o.id.replace('NV-ORD-', '')) || 1000), 1000)
    const orderId = `NV-ORD-${maxNum + 1}`
    const total = items.reduce((s, i) => s + i.price * i.qty, 0)
    const pv    = items.reduce((s, i) => s + i.pv   * i.qty, 0)
    const order = {
      id: orderId,
      memberId,
      member: memberName,
      date: new Date().toISOString().slice(0, 10),
      items: items.map(i => `${i.name} ×${i.qty}`),
      total,
      pv,
      status: 'Pending',
      method: paymentMethod,
      shippingCountry: shippingAddress.country,
      _shipping: shippingAddress,
    }
    _adminOrders = [order, ..._adminOrders]
    return { order }
  }
  return request('POST', '/api/viking-peptides/admin/orders', { memberId, memberName, items, shippingAddress, paymentMethod })
}

// ── Withdrawals ───────────────────────────────────────────────────────────────

let _withdrawalSeq = 91

export async function requestWithdrawal(userId, { amount, method = 'Bank Transfer', address = '' }) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 600))
    const id = `W-00${++_withdrawalSeq}`
    return { payout_id: id, status: 'pending', amount, method }
  }
  return request('POST', '/v1/mlm/withdrawals', { user_id: userId, amount, method, address })
}

export async function approveWithdrawal(payoutId) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 400))
    return { payout_id: payoutId, status: 'approved' }
  }
  return request('PATCH', `/v1/mlm/withdrawals/${payoutId}/approve`)
}

export async function rejectWithdrawal(payoutId, reason = '') {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 400))
    return { payout_id: payoutId, status: 'rejected' }
  }
  return request('PATCH', `/v1/mlm/withdrawals/${payoutId}/reject`, { reason })
}

// ── Announcements ──────────────────────────────────────────────────────────────

let _announcements = null
let _annSeq = 6

export async function getAnnouncements() {
  if (MOCK) {
    if (!_announcements) _announcements = [...ANNOUNCEMENTS].reverse()
    return { announcements: _announcements }
  }
  return request('GET', '/v1/mlm/admin/announcements')
}

export async function createAnnouncement({ title, body, audience = 'all', type = 'info' }) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 500))
    if (!_announcements) _announcements = [...ANNOUNCEMENTS].reverse()
    const ann = {
      id: `ann-00${++_annSeq}`,
      title,
      body,
      audience,
      type,
      created_at: new Date().toISOString(),
      sent_by: 'Admin',
      recipient_count: Math.floor(900 + Math.random() * 300),
    }
    _announcements = [ann, ..._announcements]
    return { announcement: ann }
  }
  return request('POST', '/v1/mlm/admin/announcements', { title, body, audience, type })
}

export async function deleteAnnouncement(id) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 300))
    if (!_announcements) _announcements = [...ANNOUNCEMENTS].reverse()
    _announcements = _announcements.filter(a => a.id !== id)
    return { ok: true }
  }
  return request('DELETE', `/v1/mlm/admin/announcements/${id}`)
}

export async function getMemberAnnouncements(memberRank = 'all') {
  if (MOCK) {
    if (!_announcements) _announcements = [...ANNOUNCEMENTS].reverse()
    const RANK_ORDER = ['all', 'bronze', 'silver', 'gold', 'platinum']
    const memberIdx = RANK_ORDER.indexOf(memberRank)
    const visible = _announcements.filter(a => {
      const audIdx = RANK_ORDER.indexOf(a.audience)
      return audIdx <= memberIdx || a.audience === 'all'
    })
    return { announcements: visible }
  }
  return request('GET', '/v1/mlm/announcements', { rank: memberRank })
}

// ── Audit Log ──────────────────────────────────────────────────────────────────

export async function getAuditLog({ category, result, search, limit = 100 } = {}) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 200))
    let rows = [...AUDIT_LOG].reverse()
    if (category && category !== 'all') rows = rows.filter(r => r.category === category)
    if (result   && result   !== 'all') rows = rows.filter(r => r.result   === result)
    if (search) {
      const q = search.toLowerCase()
      rows = rows.filter(r =>
        r.action.toLowerCase().includes(q) ||
        r.detail.toLowerCase().includes(q) ||
        r.actor.toLowerCase().includes(q) ||
        r.target.toLowerCase().includes(q)
      )
    }
    return { entries: rows.slice(0, limit), total: rows.length }
  }
  const params = new URLSearchParams()
  if (category && category !== 'all') params.set('category', category)
  if (result   && result   !== 'all') params.set('result',   result)
  if (search)   params.set('q',        search)
  params.set('limit', limit)
  return request('GET', `/v1/mlm/admin/audit-log?${params}`)
}

// ── Admin Member Detail ────────────────────────────────────────────────────────

export async function getMemberDetail(memberId) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 180))
    const base = ADMIN_MEMBERS.find(m => m.id === memberId)
    if (!base) throw new Error('Member not found')
    const member = { ...base, ...MEMBER_STATUS_OVERRIDE[memberId] }
    const downline = ADMIN_MEMBERS.filter(m => m.sponsor === memberId)
    const commissions = COMMISSIONS.filter((_, i) => i % Math.max(1, Math.floor(COMMISSIONS.length / 4)) === 0).slice(0, 6)
    const orders = ADMIN_ORDERS.filter(o => o.memberId === memberId).slice(0, 5)
    return { member, downline, commissions, orders }
  }
  return request('GET', `/v1/mlm/admin/members/${memberId}`)
}

export async function updateMemberStatus(memberId, status) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 200))
    MEMBER_STATUS_OVERRIDE[memberId] = { ...(MEMBER_STATUS_OVERRIDE[memberId] || {}), status }
    return { ok: true }
  }
  return request('PATCH', `/v1/mlm/admin/members/${memberId}`, { status })
}

export async function setMemberRank(memberId, rank) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 200))
    MEMBER_STATUS_OVERRIDE[memberId] = { ...(MEMBER_STATUS_OVERRIDE[memberId] || {}), rank }
    return { ok: true }
  }
  return request('PATCH', `/v1/mlm/admin/members/${memberId}`, { rank })
}

export async function addMemberNote(memberId, note) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 150))
    MEMBER_STATUS_OVERRIDE[memberId] = { ...(MEMBER_STATUS_OVERRIDE[memberId] || {}), notes: note }
    return { ok: true }
  }
  return request('POST', `/v1/mlm/admin/members/${memberId}/notes`, { note })
}

// ── Support Tickets ────────────────────────────────────────────────────────────

const TICKET_STORE = SUPPORT_TICKETS.map(t => ({ ...t, messages: [...t.messages] }))

export async function getMyTickets(memberId) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 180))
    return TICKET_STORE.filter(t => t.memberId === memberId)
  }
  return request('GET', `/v1/mlm/support/tickets?member_id=${memberId}`)
}

export async function getTicket(ticketId) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 120))
    const t = TICKET_STORE.find(t => t.id === ticketId)
    if (!t) throw new Error('Ticket not found')
    return t
  }
  return request('GET', `/v1/mlm/support/tickets/${ticketId}`)
}

export async function createTicket({ memberId, memberName, memberEmail, category, subject, message, priority = 'medium' }) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 300))
    const newTicket = {
      id: `tkt-${String(TICKET_STORE.length + 1).padStart(3, '0')}`,
      memberId, memberName, memberEmail, category, subject, priority,
      status: 'open',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [{ id: 'm1', from: 'member', text: message, ts: new Date().toISOString() }],
    }
    TICKET_STORE.push(newTicket)
    return newTicket
  }
  return request('POST', '/v1/mlm/support/tickets', { member_id: memberId, member_name: memberName, member_email: memberEmail, category, subject, message, priority })
}

export async function replyToTicket(ticketId, { from, text }) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 200))
    const t = TICKET_STORE.find(t => t.id === ticketId)
    if (!t) throw new Error('Ticket not found')
    const msg = { id: `m${t.messages.length + 1}`, from, text, ts: new Date().toISOString() }
    t.messages.push(msg)
    t.updatedAt = new Date().toISOString()
    if (from === 'admin' && t.status === 'open') t.status = 'in_progress'
    return t
  }
  return request('POST', `/v1/mlm/support/tickets/${ticketId}/messages`, { from, text })
}

export async function updateTicketStatus(ticketId, status) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 150))
    const t = TICKET_STORE.find(t => t.id === ticketId)
    if (!t) throw new Error('Ticket not found')
    t.status = status
    t.updatedAt = new Date().toISOString()
    return t
  }
  return request('PATCH', `/v1/mlm/support/tickets/${ticketId}`, { status })
}

export async function getAdminTickets({ status, category, search, page = 1, pageSize = 20 } = {}) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 200))
    let rows = [...TICKET_STORE]
    if (status && status !== 'all') rows = rows.filter(t => t.status === status)
    if (category && category !== 'all') rows = rows.filter(t => t.category === category)
    if (search) {
      const q = search.toLowerCase()
      rows = rows.filter(t =>
        t.subject.toLowerCase().includes(q) ||
        t.memberName.toLowerCase().includes(q) ||
        t.memberId.toLowerCase().includes(q)
      )
    }
    rows.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    const total = rows.length
    const items = rows.slice((page - 1) * pageSize, page * pageSize)
    const open = TICKET_STORE.filter(t => t.status === 'open').length
    const inProgress = TICKET_STORE.filter(t => t.status === 'in_progress').length
    const resolved = TICKET_STORE.filter(t => t.status === 'resolved').length
    return { items, total, open, inProgress, resolved }
  }
  const params = new URLSearchParams()
  if (status && status !== 'all') params.set('status', status)
  if (category && category !== 'all') params.set('category', category)
  if (search) params.set('q', search)
  params.set('page', page)
  params.set('page_size', pageSize)
  return request('GET', `/v1/mlm/support/tickets/admin?${params}`)
}

// ── Autoship ──────────────────────────────────────────────────────────────────

let AUTOSHIP_STORE = [...AUTOSHIPS]

export async function getAutoships(userId) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 150))
    const rows = AUTOSHIP_STORE.filter(a => a.memberId === userId || a.memberId === 'usr-001')
    const activePv = rows.filter(a => a.status === 'active').reduce((s, a) => s + a.totalPv, 0)
    return { items: rows, activePv }
  }
  return request('GET', `/v1/mlm/autoship?user_id=${userId}`)
}

export async function createAutoship(data) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 200))
    const product = PRODUCTS.find(p => p.id === data.productId)
    if (!product) throw new Error('Product not found')
    const next = new Date()
    next.setDate(next.getDate() + 30)
    const entry = {
      id: `as-${Date.now()}`,
      memberId: data.userId || 'usr-001',
      memberName: 'Ingrid Larsen',
      memberEmail: 'ingrid@example.com',
      productId: product.id,
      productName: product.name,
      qty: data.qty || 1,
      frequency: data.frequency || 'monthly',
      memberPrice: product.memberPrice,
      pv: product.pv,
      totalPv: product.pv * (data.qty || 1),
      status: 'active',
      nextShipDate: next.toISOString().split('T')[0],
      lastShipDate: null,
      shippingAddress: data.shippingAddress || '',
      createdAt: new Date().toISOString(),
    }
    AUTOSHIP_STORE.push(entry)
    return entry
  }
  return request('POST', '/v1/mlm/autoship', data)
}

export async function updateAutoship(id, data) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 150))
    const idx = AUTOSHIP_STORE.findIndex(a => a.id === id)
    if (idx < 0) throw new Error('Autoship not found')
    const product = data.productId ? PRODUCTS.find(p => p.id === data.productId) : null
    const updated = {
      ...AUTOSHIP_STORE[idx],
      ...data,
      ...(product ? { productName: product.name, memberPrice: product.memberPrice, pv: product.pv } : {}),
      totalPv: (product ? product.pv : AUTOSHIP_STORE[idx].pv) * (data.qty || AUTOSHIP_STORE[idx].qty),
    }
    AUTOSHIP_STORE[idx] = updated
    return updated
  }
  return request('PATCH', `/v1/mlm/autoship/${id}`, data)
}

export async function pauseAutoship(id) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 150))
    const idx = AUTOSHIP_STORE.findIndex(a => a.id === id)
    if (idx < 0) throw new Error('Autoship not found')
    AUTOSHIP_STORE[idx] = { ...AUTOSHIP_STORE[idx], status: 'paused', nextShipDate: null }
    return AUTOSHIP_STORE[idx]
  }
  return request('POST', `/v1/mlm/autoship/${id}/pause`)
}

export async function resumeAutoship(id) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 150))
    const idx = AUTOSHIP_STORE.findIndex(a => a.id === id)
    if (idx < 0) throw new Error('Autoship not found')
    const next = new Date()
    next.setDate(next.getDate() + 30)
    AUTOSHIP_STORE[idx] = { ...AUTOSHIP_STORE[idx], status: 'active', nextShipDate: next.toISOString().split('T')[0] }
    return AUTOSHIP_STORE[idx]
  }
  return request('POST', `/v1/mlm/autoship/${id}/resume`)
}

export async function cancelAutoship(id) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 150))
    const idx = AUTOSHIP_STORE.findIndex(a => a.id === id)
    if (idx < 0) throw new Error('Autoship not found')
    AUTOSHIP_STORE[idx] = { ...AUTOSHIP_STORE[idx], status: 'cancelled', nextShipDate: null }
    return AUTOSHIP_STORE[idx]
  }
  return request('DELETE', `/v1/mlm/autoship/${id}`)
}

export async function getAdminAutoships({ status, search, page = 1, pageSize = 20 } = {}) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 200))
    let rows = [...AUTOSHIP_STORE]
    if (status && status !== 'all') rows = rows.filter(a => a.status === status)
    if (search) {
      const q = search.toLowerCase()
      rows = rows.filter(a =>
        a.memberName.toLowerCase().includes(q) ||
        a.memberId.toLowerCase().includes(q) ||
        a.productName.toLowerCase().includes(q)
      )
    }
    rows.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    const total = rows.length
    const items = rows.slice((page - 1) * pageSize, page * pageSize)
    const active = AUTOSHIP_STORE.filter(a => a.status === 'active').length
    const paused = AUTOSHIP_STORE.filter(a => a.status === 'paused').length
    const cancelled = AUTOSHIP_STORE.filter(a => a.status === 'cancelled').length
    const monthlyPv = AUTOSHIP_STORE.filter(a => a.status === 'active').reduce((s, a) => s + a.totalPv, 0)
    const monthlyRevenue = AUTOSHIP_STORE.filter(a => a.status === 'active').reduce((s, a) => s + a.memberPrice * a.qty, 0)
    return { items, total, active, paused, cancelled, monthlyPv, monthlyRevenue }
  }
  const params = new URLSearchParams()
  if (status && status !== 'all') params.set('status', status)
  if (search) params.set('q', search)
  params.set('page', page)
  params.set('page_size', pageSize)
  return request('GET', `/v1/mlm/autoship/admin?${params}`)
}

// ── Milestones & Achievements ──────────────────────────────────────────────────

const MOCK_MILESTONES = [
  // Getting Started
  { id: 'm-gs-1', category: 'Getting Started', icon: '🎉', title: 'Welcome to Nordic Vitals!', desc: 'Your account has been created. Your journey starts now.', reward: '25 MLMT', rewardValue: 25, status: 'completed', completedAt: '2026-01-15T10:00:00Z', progress: null, target: null, cta: null },
  { id: 'm-gs-2', category: 'Getting Started', icon: '✉️', title: 'Email Verified',             desc: 'Verify your email address to unlock all features.',    reward: '10 MLMT', rewardValue: 10, status: 'completed', completedAt: '2026-01-15T10:05:00Z', progress: null, target: null, cta: null },
  { id: 'm-gs-3', category: 'Getting Started', icon: '👤', title: 'Profile Complete',           desc: 'Fill in your name, phone, and country in your profile.', reward: '15 MLMT', rewardValue: 15, status: 'completed', completedAt: '2026-01-20T14:00:00Z', progress: null, target: null, cta: { label: 'Go to Profile', href: '/dashboard/profile' } },
  { id: 'm-gs-4', category: 'Getting Started', icon: '🛍️', title: 'First Order',               desc: 'Place your first order from the Nordic Vitals shop.',     reward: '50 MLMT', rewardValue: 50, status: 'completed', completedAt: '2026-05-20T08:00:00Z', progress: null, target: null, cta: { label: 'Shop Now', href: '/shop' } },
  { id: 'm-gs-5', category: 'Getting Started', icon: '♻️', title: 'Autoship Activated',         desc: 'Set up your first recurring autoship subscription.',       reward: '30 MLMT', rewardValue: 30, status: 'completed', completedAt: '2026-06-01T09:00:00Z', progress: null, target: null, cta: { label: 'Manage Autoship', href: '/dashboard/autoship' } },
  // Sales Champion
  { id: 'm-sc-1', category: 'Sales Champion', icon: '💊', title: 'First 100 PV',     desc: 'Generate 100 Personal Volume — your first real milestone.',     reward: '75 MLMT',  rewardValue: 75,  status: 'completed',   completedAt: '2026-06-15T00:00:00Z', progress: null, target: null, cta: null },
  { id: 'm-sc-2', category: 'Sales Champion', icon: '🔥', title: '300 PV Achiever',  desc: 'Reach 300 PV in a single month — unlock Silver rank eligibility.', reward: '150 MLMT', rewardValue: 150, status: 'completed',   completedAt: '2026-07-01T00:00:00Z', progress: null, target: null, cta: null },
  { id: 'm-sc-3', category: 'Sales Champion', icon: '⭐', title: '500 PV Star',       desc: 'Reach 500 PV — required for Gold rank advancement.',             reward: '300 MLMT', rewardValue: 300, status: 'in_progress', completedAt: null, progress: 320, target: 500, progressLabel: '320 / 500 PV', cta: { label: 'View Earnings', href: '/dashboard/earnings' } },
  { id: 'm-sc-4', category: 'Sales Champion', icon: '📝', title: 'Review Pioneer',   desc: 'Submit your first product review to help the community.',         reward: '20 MLMT',  rewardValue: 20,  status: 'claimable',   completedAt: '2026-07-10T00:00:00Z', progress: null, target: null, cta: null },
  // Team Builder
  { id: 'm-tb-1', category: 'Team Builder', icon: '🤝', title: 'First Recruit',    desc: 'Personally sponsor your first new member.',                    reward: '100 MLMT', rewardValue: 100, status: 'completed',   completedAt: '2026-02-10T00:00:00Z', progress: null, target: null, cta: null },
  { id: 'm-tb-2', category: 'Team Builder', icon: '👥', title: 'Growing Team',     desc: 'Grow your personally sponsored team to 3 members.',             reward: '200 MLMT', rewardValue: 200, status: 'completed',   completedAt: '2026-04-01T00:00:00Z', progress: null, target: null, cta: null },
  { id: 'm-tb-3', category: 'Team Builder', icon: '🧑‍🤝‍🧑', title: 'Squad of 5',  desc: 'Personally recruit 5 active members into your team.',            reward: '350 MLMT', rewardValue: 350, status: 'claimable',  completedAt: '2026-07-05T00:00:00Z', progress: null, target: null, cta: null },
  { id: 'm-tb-4', category: 'Team Builder', icon: '🌐', title: 'Network of 10',    desc: 'Build a personally recruited team of 10 active members.',        reward: '750 MLMT', rewardValue: 750, status: 'in_progress', completedAt: null, progress: 6, target: 10, progressLabel: '6 / 10 members', cta: { label: 'View Referrals', href: '/dashboard/referral' } },
  // Leadership
  { id: 'm-ld-1', category: 'Leadership', icon: '🥉', title: 'Bronze Rank',          desc: 'Achieve Bronze rank — you are officially on your way up.',       reward: '100 MLMT', rewardValue: 100, status: 'completed', completedAt: '2026-03-15T00:00:00Z', progress: null, target: null, cta: null },
  { id: 'm-ld-2', category: 'Leadership', icon: '🥈', title: 'Silver Rank',          desc: 'Advance to Silver rank — you are now a team leader.',            reward: '500 MLMT', rewardValue: 500, status: 'completed', completedAt: '2026-07-01T00:00:00Z', progress: null, target: null, cta: null },
  { id: 'm-ld-3', category: 'Leadership', icon: '🥇', title: 'Gold Rank',            desc: 'Reach Gold rank — requires 500 PV and 5,000 GV each leg.',       reward: '1500 MLMT', rewardValue: 1500, status: 'locked', completedAt: null, progress: 320, target: 500, progressLabel: '320 / 500 PV needed', cta: { label: 'See Calculator', href: '/dashboard/calculator' } },
  { id: 'm-ld-4', category: 'Leadership', icon: '💰', title: 'First Commission',     desc: 'Earn your very first commission from the Arctico MLM engine.',    reward: '25 MLMT', rewardValue: 25,  status: 'completed', completedAt: '2026-02-16T00:00:00Z', progress: null, target: null, cta: null },
  { id: 'm-ld-5', category: 'Leadership', icon: '💎', title: '1,000 MLMT Earned',   desc: 'Accumulate 1,000 MLMT in total commissions.',                     reward: '100 MLMT', rewardValue: 100, status: 'completed', completedAt: '2026-06-30T00:00:00Z', progress: null, target: null, cta: null },
  { id: 'm-ld-6', category: 'Leadership', icon: '🏆', title: 'Top 10 Leaderboard',  desc: 'Appear in the Top 10 Earners on the monthly leaderboard.',        reward: '250 MLMT', rewardValue: 250, status: 'completed', completedAt: '2026-07-13T00:00:00Z', progress: null, target: null, cta: { label: 'View Leaderboard', href: '/dashboard/leaderboard' } },
]

const _claimedMilestones = new Set()

export async function getMilestones(userId) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 200))
    const milestones = MOCK_MILESTONES.map(m => ({
      ...m,
      status: _claimedMilestones.has(m.id) ? 'completed' : m.status,
    }))
    const claimed = milestones.filter(m => m.status === 'completed')
    const totalRewardClaimed = claimed.reduce((s, m) => s + (m.rewardValue || 0), 0)
    return { milestones, totalRewardClaimed }
  }
  return request('GET', `/v1/mlm/members/${userId}/milestones`)
}

export async function claimMilestone(userId, milestoneId) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 500))
    const m = MOCK_MILESTONES.find(m => m.id === milestoneId)
    if (!m) throw new Error('Milestone not found')
    if (m.status !== 'claimable') throw new Error('Milestone is not claimable')
    _claimedMilestones.add(milestoneId)
    m.status = 'completed'
    m.completedAt = new Date().toISOString()
    return { milestoneId, reward: m.rewardValue || 0, newBalance: 1150 + (m.rewardValue || 0) }
  }
  return request('POST', `/v1/mlm/members/${userId}/milestones/${milestoneId}/claim`, {})
}

const _resourceDownloads = {}

export async function getResources(filters = {}) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 200))
    let items = RESOURCES.map(r => ({
      ...r,
      downloads: r.downloads + (_resourceDownloads[r.id] || 0),
    }))
    if (filters.category && filters.category !== 'All') {
      items = items.filter(r => r.category === filters.category)
    }
    if (filters.search) {
      const q = filters.search.toLowerCase()
      items = items.filter(r =>
        r.title.toLowerCase().includes(q) ||
        r.desc.toLowerCase().includes(q) ||
        r.tags.some(t => t.includes(q))
      )
    }
    return { resources: items, total: items.length }
  }
  const params = new URLSearchParams()
  if (filters.category && filters.category !== 'All') params.set('category', filters.category)
  if (filters.search) params.set('search', filters.search)
  return request('GET', `/v1/mlm/resources?${params}`)
}

export async function trackResourceDownload(resourceId) {
  if (MOCK) {
    _resourceDownloads[resourceId] = (_resourceDownloads[resourceId] || 0) + 1
    return { ok: true }
  }
  return request('POST', `/v1/mlm/resources/${resourceId}/download`, {})
}

// --- Promo Codes ---
const _mockPromos = PROMO_CODES.map(p => ({ ...p }))

export async function validatePromoCode(code, subtotal) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 300))
    const promo = _mockPromos.find(p => p.code.toUpperCase() === code.toUpperCase() && p.active)
    if (!promo) return { valid: false, error: 'Invalid or expired promo code.' }
    if (promo.maxUses !== null && promo.usedCount >= promo.maxUses) return { valid: false, error: 'This promo code has reached its usage limit.' }
    if (promo.expiresAt && new Date(promo.expiresAt) < new Date()) return { valid: false, error: 'This promo code has expired.' }
    if (subtotal < promo.minOrder) return { valid: false, error: `Minimum order of NOK ${promo.minOrder} required for this code.` }
    const discount = promo.type === 'percent'
      ? Math.round(subtotal * promo.value / 100)
      : Math.min(promo.value, subtotal)
    return { valid: true, promo, discount }
  }
  return request('POST', '/v1/mlm/promos/validate', { code, subtotal })
}

export async function getAdminPromos() {
  if (MOCK) return { promos: _mockPromos }
  return request('GET', '/v1/mlm/admin/promos')
}

export async function createPromoCode(data) {
  if (MOCK) {
    const newPromo = {
      id: 'promo-' + Date.now(),
      code: data.code.toUpperCase(),
      description: data.description || '',
      type: data.type,
      value: Number(data.value),
      minOrder: Number(data.minOrder) || 0,
      maxUses: data.maxUses ? Number(data.maxUses) : null,
      usedCount: 0,
      active: true,
      expiresAt: data.expiresAt || null,
      createdAt: new Date().toISOString(),
      totalSaved: 0,
    }
    _mockPromos.push(newPromo)
    return { promo: newPromo }
  }
  return request('POST', '/v1/mlm/admin/promos', data)
}

export async function togglePromoCode(id, active) {
  if (MOCK) {
    const p = _mockPromos.find(x => x.id === id)
    if (p) p.active = active
    return { ok: true }
  }
  return request('PATCH', `/v1/mlm/admin/promos/${id}`, { active })
}

export async function deletePromoCode(id) {
  if (MOCK) {
    const idx = _mockPromos.findIndex(x => x.id === id)
    if (idx !== -1) _mockPromos.splice(idx, 1)
    return { ok: true }
  }
  return request('DELETE', `/v1/mlm/admin/promos/${id}`, {})
}

// ── Referral Tracking ────────────────────────────────────────────────────────

export async function getAdminReferrals({ rank, status, search } = {}) {
  if (MOCK) {
    let data = [...REFERRAL_STATS]
    if (rank && rank !== 'all')    data = data.filter(r => r.rank === rank)
    if (status && status !== 'all') data = data.filter(r => r.status === status)
    if (search) {
      const q = search.toLowerCase()
      data = data.filter(r =>
        r.memberName.toLowerCase().includes(q) ||
        r.memberId.toLowerCase().includes(q) ||
        r.referralCode.toLowerCase().includes(q)
      )
    }
    return { referrals: data }
  }
  const params = new URLSearchParams()
  if (rank && rank !== 'all')    params.set('rank', rank)
  if (status && status !== 'all') params.set('status', status)
  if (search)                     params.set('search', search)
  return request('GET', `/v1/mlm/admin/referrals?${params}`)
}

// ── Email Templates ───────────────────────────────────────────────────────────

let _mockTemplates = EMAIL_TEMPLATES.map(t => ({ ...t }))

export async function getEmailTemplates() {
  if (MOCK) return { templates: _mockTemplates }
  return request('GET', '/v1/mlm/admin/email-templates')
}

export async function updateEmailTemplate(id, { subject, body, active }) {
  if (MOCK) {
    const idx = _mockTemplates.findIndex(t => t.id === id)
    if (idx !== -1) {
      if (subject !== undefined) _mockTemplates[idx].subject = subject
      if (body    !== undefined) _mockTemplates[idx].body    = body
      if (active  !== undefined) _mockTemplates[idx].active  = active
      _mockTemplates[idx].lastEditedAt = new Date().toISOString()
    }
    return { ok: true, template: _mockTemplates[idx] }
  }
  return request('PUT', `/v1/mlm/admin/email-templates/${id}`, { subject, body, active })
}

export async function resetEmailTemplate(id) {
  if (MOCK) {
    const orig = EMAIL_TEMPLATES.find(t => t.id === id)
    if (orig) {
      const idx = _mockTemplates.findIndex(t => t.id === id)
      _mockTemplates[idx] = { ...orig, lastEditedAt: new Date().toISOString() }
    }
    return { ok: true }
  }
  return request('POST', `/v1/mlm/admin/email-templates/${id}/reset`, {})
}

export async function sendTestEmail(id, toEmail) {
  if (MOCK) return { ok: true, message: `Test email sent to ${toEmail}` }
  return request('POST', `/v1/mlm/admin/email-templates/${id}/test`, { to: toEmail })
}

// ── Token Management ──────────────────────────────────────────────────────────

let _mockTokenStats = { ...TOKEN_STATS }
let _mockTokenEvents = TOKEN_EVENTS.map(e => ({ ...e }))

export async function getTokenStats() {
  if (MOCK) return { stats: { ..._mockTokenStats } }
  return request('GET', '/v1/mlm/admin/tokens/stats')
}

export async function getTokenEvents({ type, search, limit = 50, offset = 0 } = {}) {
  if (MOCK) {
    let data = [..._mockTokenEvents].sort((a, b) => b.ts.localeCompare(a.ts))
    if (type && type !== 'all') data = data.filter(e => e.type === type)
    if (search) {
      const q = search.toLowerCase()
      data = data.filter(e =>
        e.memo.toLowerCase().includes(q) ||
        e.actor.toLowerCase().includes(q) ||
        (e.recipient || '').toLowerCase().includes(q)
      )
    }
    return { events: data.slice(offset, offset + limit), total: data.length }
  }
  const params = new URLSearchParams({ limit, offset })
  if (type && type !== 'all') params.set('type', type)
  if (search) params.set('search', search)
  return request('GET', `/v1/mlm/admin/tokens/events?${params}`)
}

export async function mintTokens({ amount, recipient, memo }) {
  if (MOCK) {
    const event = {
      id: `te${Date.now()}`,
      type: 'mint',
      amount,
      actor: 'admin@nordicvitals.com',
      recipient: recipient || 'platform-reserve',
      memo,
      ts: new Date().toISOString(),
    }
    _mockTokenEvents.unshift(event)
    _mockTokenStats.totalSupply += amount
    _mockTokenStats.reservedPlatform += amount
    _mockTokenStats.lastMintAt = event.ts
    return { ok: true, event }
  }
  return request('POST', '/v1/mlm/admin/tokens/mint', { amount, recipient, memo })
}

export async function airdropTokens({ amount, target, memo }) {
  if (MOCK) {
    const memberCount = target === 'all-members' ? ADMIN_MEMBERS.length
      : target.startsWith('rank:') ? ADMIN_MEMBERS.filter(m => m.rank.toLowerCase() === target.split(':')[1]).length
      : 1
    const totalAmount = amount * memberCount
    const event = {
      id: `te${Date.now()}`,
      type: 'airdrop',
      amount: totalAmount,
      actor: 'admin@nordicvitals.com',
      recipient: target,
      memo,
      ts: new Date().toISOString(),
    }
    _mockTokenEvents.unshift(event)
    _mockTokenStats.circulatingSupply += totalAmount
    _mockTokenStats.memberWallets += totalAmount
    _mockTokenStats.reservedPlatform -= totalAmount
    return { ok: true, event, memberCount, totalAmount }
  }
  return request('POST', '/v1/mlm/admin/tokens/airdrop', { amount, target, memo })
}

export async function burnTokens({ amount, memo }) {
  if (MOCK) {
    const event = {
      id: `te${Date.now()}`,
      type: 'burn',
      amount,
      actor: 'system',
      recipient: null,
      memo,
      ts: new Date().toISOString(),
    }
    _mockTokenEvents.unshift(event)
    _mockTokenStats.totalSupply -= amount
    _mockTokenStats.burnedTotal += amount
    _mockTokenStats.reservedPlatform -= amount
    _mockTokenStats.lastBurnAt = event.ts
    return { ok: true, event }
  }
  return request('POST', '/v1/mlm/admin/tokens/burn', { amount, memo })
}

// ── Rank Progress ─────────────────────────────────────────────────────────────
export async function getRankProgress(userId) {
  if (MOCK) {
    const u = USERS.find(x => x.userId === userId) || USERS[0]
    const joinedAt = RANK_HISTORY.length > 0 ? RANK_HISTORY[RANK_HISTORY.length - 1].achievedAt : null
    const currentEntry = RANK_HISTORY.find(h => h.rank === u.rank)
    const achievedAt = currentEntry ? currentEntry.achievedAt : joinedAt
    const daysAtRank = achievedAt
      ? Math.floor((Date.now() - new Date(achievedAt).getTime()) / 86_400_000)
      : 0
    const activeRecruits = ADMIN_MEMBERS.filter(m => m.sponsor === u.name && m.status === 'active').length
    return {
      currentRank: u.rank,
      pv: u.pv,
      leftGV: u.leftGV,
      rightGV: u.rightGV,
      activeRecruits,
      daysAtRank,
      history: RANK_HISTORY,
    }
  }
  return request('GET', `/v1/mlm/members/${userId}/rank-progress`)
}

// ── Analytics ─────────────────────────────────────────────────────────────────
export async function getAdminAnalytics() {
  if (MOCK) return ANALYTICS_DATA
  return request('GET', '/v1/mlm/admin/analytics')
}

// ── Training ──────────────────────────────────────────────────────────────────
export async function getTrainingModules(userId) {
  if (MOCK) {
    const key = `nv_training_${userId || 'guest'}`
    let completed = []
    try { completed = JSON.parse(localStorage.getItem(key) || '[]') } catch {}
    return TRAINING_MODULES.map(mod => ({
      ...mod,
      lessons: mod.lessons.map(l => ({ ...l, completed: completed.includes(l.id) })),
      completedCount: mod.lessons.filter(l => completed.includes(l.id)).length,
      rewardClaimed: completed.includes(`reward_${mod.id}`),
    }))
  }
  return request('GET', `/v1/mlm/members/${userId}/training`)
}

export async function completeTrainingLesson(userId, lessonId) {
  if (MOCK) {
    const key = `nv_training_${userId || 'guest'}`
    let completed = []
    try { completed = JSON.parse(localStorage.getItem(key) || '[]') } catch {}
    if (!completed.includes(lessonId)) {
      completed = [...completed, lessonId]
      localStorage.setItem(key, JSON.stringify(completed))
    }
    return { ok: true, completed }
  }
  return request('POST', `/v1/mlm/members/${userId}/training/complete`, { lessonId })
}

export async function claimTrainingReward(userId, moduleId) {
  if (MOCK) {
    const key = `nv_training_${userId || 'guest'}`
    let completed = []
    try { completed = JSON.parse(localStorage.getItem(key) || '[]') } catch {}
    const rewardKey = `reward_${moduleId}`
    if (!completed.includes(rewardKey)) {
      completed = [...completed, rewardKey]
      localStorage.setItem(key, JSON.stringify(completed))
    }
    return { ok: true }
  }
  return request('POST', `/v1/mlm/members/${userId}/training/claim-reward`, { moduleId })
}

export async function getAdminUsers() {
  if (MOCK) {
    const { ADMIN_USERS } = await import('../data/mock.js')
    return ADMIN_USERS
  }
  return request('GET', '/v1/mlm/admin/users')
}

export async function inviteAdminUser(payload) {
  if (MOCK) {
    const { ADMIN_USERS } = await import('../data/mock.js')
    const newUser = {
      id: 'au-' + Date.now(),
      name: payload.email.split('@')[0],
      email: payload.email,
      role: payload.role,
      status: 'invited',
      lastLogin: null,
      joinedAt: new Date().toISOString().slice(0, 10),
      mfaEnabled: false,
      note: payload.note || '',
    }
    ADMIN_USERS.push(newUser)
    return newUser
  }
  return request('POST', '/v1/mlm/admin/users/invite', payload)
}

export async function updateAdminUserRole(userId, role) {
  if (MOCK) {
    const { ADMIN_USERS } = await import('../data/mock.js')
    const u = ADMIN_USERS.find(x => x.id === userId)
    if (u) u.role = role
    return { ok: true }
  }
  return request('PATCH', `/v1/mlm/admin/users/${userId}/role`, { role })
}

export async function deactivateAdminUser(userId) {
  if (MOCK) {
    const { ADMIN_USERS } = await import('../data/mock.js')
    const u = ADMIN_USERS.find(x => x.id === userId)
    if (u) u.status = u.status === 'inactive' ? 'active' : 'inactive'
    return { ok: true, status: u?.status }
  }
  return request('PATCH', `/v1/mlm/admin/users/${userId}/status`)
}

export async function getRolePermissions() {
  if (MOCK) {
    const { ROLE_PERMISSIONS, PERMISSION_LABELS } = await import('../data/mock.js')
    return { roles: ROLE_PERMISSIONS, labels: PERMISSION_LABELS }
  }
  return request('GET', '/v1/mlm/admin/roles/permissions')
}

export async function getComplianceStats() {
  if (MOCK) {
    const { COMPLIANCE_STATS } = await import('../data/mock.js')
    return COMPLIANCE_STATS
  }
  return request('GET', '/v1/mlm/admin/compliance/stats')
}

export async function getComplianceChecklist() {
  if (MOCK) {
    const { COMPLIANCE_CHECKLIST } = await import('../data/mock.js')
    return [...COMPLIANCE_CHECKLIST]
  }
  return request('GET', '/v1/mlm/admin/compliance/checklist')
}

export async function updateChecklistItem(id, updates) {
  if (MOCK) {
    const { COMPLIANCE_CHECKLIST } = await import('../data/mock.js')
    const item = COMPLIANCE_CHECKLIST.find(i => i.id === id)
    if (item) Object.assign(item, updates)
    return item
  }
  return request('PATCH', `/v1/mlm/admin/compliance/checklist/${id}`, updates)
}

export async function getComplianceDocs() {
  if (MOCK) {
    const { COMPLIANCE_DOCS } = await import('../data/mock.js')
    return [...COMPLIANCE_DOCS]
  }
  return request('GET', '/v1/mlm/admin/compliance/docs')
}

export async function deleteComplianceDoc(id) {
  if (MOCK) {
    const { COMPLIANCE_DOCS } = await import('../data/mock.js')
    const idx = COMPLIANCE_DOCS.findIndex(d => d.id === id)
    if (idx !== -1) COMPLIANCE_DOCS.splice(idx, 1)
    return { ok: true }
  }
  return request('DELETE', `/v1/mlm/admin/compliance/docs/${id}`)
}

// Build a flat list of all members in a user's downline (BFS from sponsor chain)
export async function getMyTeam(userId) {
  if (MOCK) {
    // Compute levels via BFS from sponsor chain
    const all = ADMIN_MEMBERS
    const levelMap = {}
    const queue = [{ id: userId, level: 0 }]
    while (queue.length) {
      const { id, level } = queue.shift()
      const directs = all.filter(m => m.sponsor === id)
      directs.forEach(m => {
        if (levelMap[m.id] === undefined) {
          levelMap[m.id] = level + 1
          queue.push({ id: m.id, level: level + 1 })
        }
      })
    }
    const LAST_ACTIVITY = {
      'NV-10042': '2026-07-25', 'NV-10087': '2026-07-20', 'NV-10091': '2026-07-18',
      'NV-10102': '2026-07-15', 'NV-10118': '2026-06-30', 'NV-10122': '2026-07-22',
      'NV-10201': '2026-07-10', 'NV-10208': '2026-06-15', 'NV-10210': '2026-05-28',
      'NV-10215': '2026-07-24', 'NV-10230': '2026-07-19', 'NV-10241': '2026-07-12',
    }
    const members = all
      .filter(m => levelMap[m.id] !== undefined)
      .map(m => ({ ...m, level: levelMap[m.id], lastActivity: LAST_ACTIVITY[m.id] ?? m.joined }))
    return { members, totalGV: members.reduce((s, m) => s + m.gv, 0) }
  }
  // Live: use genealogy tree with depth=10 to get flat nodes list
  const rootNode = await request('GET', `/v1/mlm/genealogy/node-by-user/${userId}`)
  const tree = await request('GET', `/v1/mlm/genealogy/tree/${rootNode.id}?tree=placement&depth=10`)
  const nodes = (tree.nodes ?? []).filter(n => n.user_id !== userId)
  const members = nodes.map(n => ({
    id: n.user_id, name: n.name ?? n.user_id, email: n.email ?? '',
    sponsor: n.sponsor_user_id ?? '', rank: n.rank ?? 'Unranked',
    pv: n.pv ?? 0, gv: n.gv ?? 0, status: n.status ?? 'Active',
    level: n.depth ?? 1, joined: n.created_at?.slice(0, 10) ?? '',
    lastActivity: n.last_activity?.slice(0, 10) ?? '',
  }))
  return { members, totalGV: members.reduce((s, m) => s + m.gv, 0) }
}

// ── Events & Webinars ──────────────────────────────────────────────────────────

let _events = null
const _registeredEvents = new Set()
let _evtSeq = 9

function _initEvents() {
  if (!_events) _events = EVENTS.map(e => ({ ...e }))
}

export async function getEvents({ type, status } = {}) {
  if (MOCK) {
    _initEvents()
    let list = [..._events]
    if (type && type !== 'all') list = list.filter(e => e.type === type)
    if (status && status !== 'all') list = list.filter(e => e.status === status)
    list.sort((a, b) => new Date(a.date) - new Date(b.date))
    return { events: list.map(e => ({ ...e, isRegistered: _registeredEvents.has(e.id) })) }
  }
  const params = new URLSearchParams()
  if (type && type !== 'all') params.set('type', type)
  if (status && status !== 'all') params.set('status', status)
  return request('GET', `/v1/mlm/events?${params}`)
}

export async function registerForEvent(eventId) {
  if (MOCK) {
    _initEvents()
    await new Promise(r => setTimeout(r, 400))
    const ev = _events.find(e => e.id === eventId)
    if (!ev) throw new Error('Event not found')
    if (ev.status !== 'upcoming') throw new Error('Event is not open for registration')
    if (_registeredEvents.has(eventId)) throw new Error('Already registered')
    if (ev.registered >= ev.capacity) throw new Error('Event is full')
    _registeredEvents.add(eventId)
    ev.registered += 1
    return { ok: true, event_id: eventId }
  }
  return request('POST', `/v1/mlm/events/${eventId}/register`)
}

export async function unregisterFromEvent(eventId) {
  if (MOCK) {
    _initEvents()
    await new Promise(r => setTimeout(r, 400))
    const ev = _events.find(e => e.id === eventId)
    if (!ev) throw new Error('Event not found')
    if (!_registeredEvents.has(eventId)) throw new Error('Not registered')
    _registeredEvents.delete(eventId)
    ev.registered = Math.max(0, ev.registered - 1)
    return { ok: true }
  }
  return request('DELETE', `/v1/mlm/events/${eventId}/register`)
}

export async function getAdminEvents({ type, status } = {}) {
  if (MOCK) {
    _initEvents()
    let list = [..._events]
    if (type && type !== 'all') list = list.filter(e => e.type === type)
    if (status && status !== 'all') list = list.filter(e => e.status === status)
    list.sort((a, b) => new Date(a.date) - new Date(b.date))
    return { events: list }
  }
  const params = new URLSearchParams()
  if (type && type !== 'all') params.set('type', type)
  if (status && status !== 'all') params.set('status', status)
  return request('GET', `/v1/mlm/admin/events?${params}`)
}

export async function createAdminEvent(data) {
  if (MOCK) {
    _initEvents()
    await new Promise(r => setTimeout(r, 500))
    const ev = {
      id: `evt-0${String(++_evtSeq).padStart(2, '0')}`,
      title: data.title,
      type: data.type || 'webinar',
      description: data.description || '',
      speaker: data.speaker || '',
      speakerRole: data.speakerRole || '',
      date: data.date,
      duration_min: Number(data.duration_min) || 60,
      capacity: Number(data.capacity) || 100,
      registered: 0,
      status: new Date(data.date) > new Date() ? 'upcoming' : 'past',
      tags: data.tags || [],
      mlmt_reward: Number(data.mlmt_reward) || 0,
      recording_url: data.recording_url || null,
    }
    _events = [ev, ..._events]
    return { event: ev }
  }
  return request('POST', '/v1/mlm/admin/events', data)
}

export async function updateAdminEvent(eventId, data) {
  if (MOCK) {
    _initEvents()
    await new Promise(r => setTimeout(r, 400))
    const idx = _events.findIndex(e => e.id === eventId)
    if (idx === -1) throw new Error('Event not found')
    _events[idx] = { ..._events[idx], ...data }
    return { event: _events[idx] }
  }
  return request('PATCH', `/v1/mlm/admin/events/${eventId}`, data)
}

export async function deleteAdminEvent(eventId) {
  if (MOCK) {
    _initEvents()
    await new Promise(r => setTimeout(r, 300))
    _events = _events.filter(e => e.id !== eventId)
    return { ok: true }
  }
  return request('DELETE', `/v1/mlm/admin/events/${eventId}`)
}

export async function getCommissionPreview() {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 1200))
    const { ADMIN_MEMBERS } = await import('../data/mock.js')
    const members = ADMIN_MEMBERS

    const memberMap = {}
    members.forEach(m => { memberMap[m.id] = m })

    const directDownline = {}
    members.forEach(m => {
      if (!directDownline[m.sponsor]) directDownline[m.sponsor] = []
      directDownline[m.sponsor].push(m.id)
    })

    const rows = members.filter(m => m.status === 'Active').map(m => {
      const directSalesBonus = Math.round(m.pv * 0.20)
      const directs = (directDownline[m.id] || []).map(id => memberMap[id]).filter(Boolean)
      const sponsorBonus = Math.round(directs.reduce((s, d) => s + (d.pv || 0), 0) * 0.10)
      const l2 = directs.flatMap(d => (directDownline[d.id] || []).map(id => memberMap[id]).filter(Boolean))
      const l3 = l2.flatMap(d => (directDownline[d.id] || []).map(id => memberMap[id]).filter(Boolean))
      const levelCommission =
        Math.round(l2.reduce((s, d) => s + (d.pv || 0), 0) * 0.05) +
        Math.round(l3.reduce((s, d) => s + (d.pv || 0), 0) * 0.03)
      const leftGV  = Math.round(m.gv * 0.45)
      const rightGV = m.gv - leftGV
      const weakLeg = Math.min(leftGV, rightGV)
      const pairingBonus = m.rank === 'Silver' || m.rank === 'Gold' || m.rank === 'Platinum'
        ? Math.round(weakLeg * 0.08)
        : Math.round(weakLeg * 0.05)
      const total = directSalesBonus + sponsorBonus + levelCommission + pairingBonus
      return {
        id: m.id,
        name: m.name,
        rank: m.rank,
        pv: m.pv,
        gv: m.gv,
        directSalesBonus,
        sponsorBonus,
        levelCommission,
        pairingBonus,
        total,
      }
    })

    rows.sort((a, b) => b.total - a.total)

    const totals = rows.reduce((acc, r) => ({
      directSalesBonus:  acc.directSalesBonus  + r.directSalesBonus,
      sponsorBonus:      acc.sponsorBonus      + r.sponsorBonus,
      levelCommission:   acc.levelCommission   + r.levelCommission,
      pairingBonus:      acc.pairingBonus      + r.pairingBonus,
      grandTotal:        acc.grandTotal        + r.total,
    }), { directSalesBonus: 0, sponsorBonus: 0, levelCommission: 0, pairingBonus: 0, grandTotal: 0 })

    return { rows, totals, members_in_preview: rows.length, currency: 'MLMT', generated_at: new Date().toISOString() }
  }
  return request('POST', '/v1/mlm/admin/commission-preview', { dry_run: true })
}

// ─── Integrations & Webhooks ──────────────────────────────────────────────────
export async function getIntegrations() {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 400))
    const { INTEGRATIONS } = await import('../data/mock.js')
    return JSON.parse(JSON.stringify(INTEGRATIONS))
  }
  return request('GET', '/v1/mlm/admin/integrations')
}

export async function saveIntegrations(payload) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 500))
    return { ok: true }
  }
  return request('PUT', '/v1/mlm/admin/integrations', payload)
}

export async function testArccticoConnection(base_url, api_key) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 1200))
    // Simulate: if url contains 'arctico.duckdns.org' return unreachable
    if (!base_url) return { ok: false, error: 'No base URL configured' }
    if (base_url.includes('arctico.duckdns.org')) return { ok: false, error: 'Connection refused (403 from egress proxy)' }
    return { ok: true, latency_ms: 142, version: 'arctico-mlm v1.4.2' }
  }
  return request('POST', '/v1/mlm/admin/integrations/test-arctico', { base_url, api_key })
}

export async function getWebhooks() {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 300))
    const { WEBHOOKS } = await import('../data/mock.js')
    return JSON.parse(JSON.stringify(WEBHOOKS))
  }
  return request('GET', '/v1/mlm/admin/webhooks')
}

export async function pingWebhook(id) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 800))
    return { ok: true, http_code: 200, duration_ms: 145 }
  }
  return request('POST', `/v1/mlm/admin/webhooks/${id}/ping`)
}

export async function getWebhookLog() {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 300))
    const { WEBHOOK_LOG, WEBHOOKS } = await import('../data/mock.js')
    const wmap = {}
    WEBHOOKS.forEach(w => { wmap[w.id] = w.label })
    return WEBHOOK_LOG.map(l => ({ ...l, webhook_label: wmap[l.webhook_id] || l.webhook_id }))
  }
  return request('GET', '/v1/mlm/admin/webhooks/log')
}

export async function getTaxSummary(userId, year) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 400))
    const NOK_RATE = readCurrentMlmtToNok()
    const allYears = {
      2024: [
        { type: 'Pairing Bonus',        count: 18, amount: 5850 },
        { type: 'Sponsor Bonus',         count: 9,  amount: 1575 },
        { type: 'Level Commission L1',   count: 14, amount: 1260 },
        { type: 'Level Commission L2',   count: 8,  amount: 480  },
        { type: 'Level Commission L3',   count: 4,  amount: 112  },
        { type: 'Override Bonus',        count: 6,  amount: 210  },
        { type: 'Pool Bonus',            count: 3,  amount: 620  },
      ],
      2025: [
        { type: 'Pairing Bonus',        count: 24, amount: 9000 },
        { type: 'Sponsor Bonus',         count: 14, amount: 2450 },
        { type: 'Level Commission L1',   count: 19, amount: 1710 },
        { type: 'Level Commission L2',   count: 11, amount: 660  },
        { type: 'Level Commission L3',   count: 7,  amount: 196  },
        { type: 'Override Bonus',        count: 9,  amount: 315  },
        { type: 'Pool Bonus',            count: 5,  amount: 1050 },
        { type: 'Rank Bonus',            count: 2,  amount: 500  },
      ],
      2026: [
        { type: 'Pairing Bonus',        count: 9,  amount: 3600 },
        { type: 'Sponsor Bonus',         count: 5,  amount: 875  },
        { type: 'Level Commission L1',   count: 7,  amount: 630  },
        { type: 'Level Commission L2',   count: 4,  amount: 240  },
        { type: 'Level Commission L3',   count: 2,  amount: 56   },
        { type: 'Override Bonus',        count: 3,  amount: 105  },
        { type: 'Pool Bonus',            count: 2,  amount: 440  },
      ],
    }
    const rows = allYears[year] || []
    const totalMlmt = rows.reduce((s, r) => s + r.amount, 0)
    const withdrawals = year === 2024 ? 3200 : year === 2025 ? 6400 : 1300
    return {
      year,
      memberId: userId || 'NV-10042',
      memberName: 'Lars Eriksen',
      nok_rate: NOK_RATE,
      rows: rows.map(r => ({ ...r, nok: Math.round(r.amount * NOK_RATE) })),
      totalMlmt,
      totalNok: Math.round(totalMlmt * NOK_RATE),
      withdrawalsNok: Math.round(withdrawals * NOK_RATE),
      pendingMlmt: year === 2026 ? 280 : 0,
    }
  }
  return request('GET', `/v1/mlm/tax-summary?user_id=${userId}&year=${year}`)
}

export async function importMembers(rows) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 900 + rows.length * 8))
    const imported = []
    const skipped  = []
    const failed   = []
    rows.forEach(row => {
      // Simulate ~5% conflict rate (already exists) based on email hash
      const code = row.email.charCodeAt(0) + row.email.charCodeAt(row.email.length - 1)
      if (code % 20 === 0) {
        skipped.push(row)
      } else {
        imported.push(row)
      }
    })
    return { imported: imported.length, skipped: skipped.length, failed: 0, failedRows: [] }
  }
  return request('POST', '/v1/mlm/admin/members/import', { rows })
}

let CAMPAIGNS_STATE = EMAIL_CAMPAIGNS.map(c => ({ ...c }))

export async function getEmailCampaigns({ status, search } = {}) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 280))
    let list = [...CAMPAIGNS_STATE]
    if (status && status !== 'all') list = list.filter(c => c.status === status)
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(c => c.name.toLowerCase().includes(q) || c.subject.toLowerCase().includes(q))
    }
    return list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  }
  const params = new URLSearchParams()
  if (status && status !== 'all') params.set('status', status)
  if (search) params.set('search', search)
  return request('GET', `/v1/mlm/admin/campaigns?${params}`)
}

export async function createEmailCampaign(data) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 500))
    const now = new Date().toISOString()
    const newCamp = {
      id: `camp-${Date.now()}`,
      ...data,
      created_at: now,
      created_by: 'gary@nordic',
      stats: null,
      sent_at: data.status === 'sent' ? now : null,
    }
    CAMPAIGNS_STATE = [newCamp, ...CAMPAIGNS_STATE]
    return newCamp
  }
  return request('POST', '/v1/mlm/admin/campaigns', data)
}

export async function updateEmailCampaign(id, updates) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 300))
    CAMPAIGNS_STATE = CAMPAIGNS_STATE.map(c => c.id === id ? { ...c, ...updates } : c)
    return CAMPAIGNS_STATE.find(c => c.id === id)
  }
  return request('PATCH', `/v1/mlm/admin/campaigns/${id}`, updates)
}

export async function cancelEmailCampaign(id) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 300))
    CAMPAIGNS_STATE = CAMPAIGNS_STATE.map(c => c.id === id ? { ...c, status: 'cancelled', scheduled_at: null } : c)
    return { ok: true }
  }
  return request('POST', `/v1/mlm/admin/campaigns/${id}/cancel`)
}

export async function duplicateEmailCampaign(id) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 300))
    const source = CAMPAIGNS_STATE.find(c => c.id === id)
    if (!source) throw new Error('Campaign not found')
    const copy = {
      ...source,
      id: `camp-${Date.now()}`,
      name: `Copy of ${source.name}`,
      status: 'draft',
      scheduled_at: null,
      sent_at: null,
      stats: null,
      created_at: new Date().toISOString(),
    }
    CAMPAIGNS_STATE = [copy, ...CAMPAIGNS_STATE]
    return copy
  }
  return request('POST', `/v1/mlm/admin/campaigns/${id}/duplicate`)
}

export async function sendEmailCampaignNow(id) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 800))
    const camp = CAMPAIGNS_STATE.find(c => c.id === id)
    if (!camp) throw new Error('Campaign not found')
    const now = new Date().toISOString()
    const delivered = camp.recipient_count - Math.floor(camp.recipient_count * 0.01)
    const opened = Math.floor(delivered * (0.45 + Math.random() * 0.25))
    const clicked = Math.floor(opened * (0.35 + Math.random() * 0.2))
    CAMPAIGNS_STATE = CAMPAIGNS_STATE.map(c =>
      c.id === id
        ? { ...c, status: 'sent', sent_at: now, scheduled_at: null, stats: { delivered, opened, clicked, unsubscribed: Math.floor(delivered * 0.005) } }
        : c
    )
    return CAMPAIGNS_STATE.find(c => c.id === id)
  }
  return request('POST', `/v1/mlm/admin/campaigns/${id}/send`)
}

// ── KYC / Identity Verification ──────────────────────────────────────────────

let KYC_STATE = KYC_SUBMISSIONS.map(k => ({ ...k, docs: k.docs.map(d => ({ ...d })) }))

export async function getMyKyc(userId) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 300))
    const submission = KYC_STATE.find(k => k.userId === userId)
    return submission || { userId, status: 'unverified', submitted_at: null, docs: [] }
  }
  return request('GET', `/v1/mlm/kyc/my`)
}

export async function submitKycDocument(userId, docType, filename) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 600))
    const now = new Date().toISOString()
    const existing = KYC_STATE.find(k => k.userId === userId)
    const newDoc = { type: docType, label: filename, filename, size_kb: Math.floor(200 + Math.random() * 400), uploaded_at: now, verified: false }
    if (existing) {
      existing.docs = existing.docs.filter(d => d.type !== docType)
      existing.docs.push(newDoc)
      if (existing.status === 'rejected') existing.status = 'draft'
    } else {
      KYC_STATE.push({ id: `kyc-${Date.now()}`, userId, memberId: 'NV-NEW', name: 'Member', email: '', country: '', status: 'draft', submitted_at: null, reviewed_at: null, reviewed_by: null, review_notes: '', docs: [newDoc] })
    }
    return { ok: true }
  }
  return request('POST', '/v1/mlm/kyc/upload', { doc_type: docType, filename })
}

export async function submitKycForReview(userId) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 400))
    const now = new Date().toISOString()
    const existing = KYC_STATE.find(k => k.userId === userId)
    if (existing) {
      existing.status = 'pending'
      existing.submitted_at = now
    }
    return { ok: true }
  }
  return request('POST', '/v1/mlm/kyc/submit')
}

export async function getAdminKycQueue({ status, search } = {}) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 300))
    let list = [...KYC_STATE]
    if (status && status !== 'all') list = list.filter(k => k.status === status)
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(k => k.name.toLowerCase().includes(q) || k.memberId.toLowerCase().includes(q) || k.email.toLowerCase().includes(q))
    }
    list.sort((a, b) => {
      const order = { pending: 0, rejected: 1, draft: 2, approved: 3, unverified: 4 }
      return (order[a.status] ?? 5) - (order[b.status] ?? 5)
    })
    return list
  }
  const params = new URLSearchParams()
  if (status && status !== 'all') params.set('status', status)
  if (search) params.set('search', search)
  return request('GET', `/v1/mlm/admin/kyc?${params}`)
}

export async function approveKyc(id, notes) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 500))
    const now = new Date().toISOString()
    KYC_STATE = KYC_STATE.map(k =>
      k.id === id
        ? { ...k, status: 'approved', reviewed_at: now, reviewed_by: 'Admin', review_notes: notes || 'Verified.', docs: k.docs.map(d => ({ ...d, verified: true })) }
        : k
    )
    return { ok: true }
  }
  return request('POST', `/v1/mlm/admin/kyc/${id}/approve`, { notes })
}

export async function rejectKyc(id, notes) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 500))
    const now = new Date().toISOString()
    KYC_STATE = KYC_STATE.map(k =>
      k.id === id
        ? { ...k, status: 'rejected', reviewed_at: now, reviewed_by: 'Admin', review_notes: notes }
        : k
    )
    return { ok: true }
  }
  return request('POST', `/v1/mlm/admin/kyc/${id}/reject`, { notes })
}

export async function requestKycResubmission(id, notes) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 300))
    KYC_STATE = KYC_STATE.map(k =>
      k.id === id
        ? { ...k, status: 'rejected', review_notes: notes }
        : k
    )
    return { ok: true }
  }
  return request('POST', `/v1/mlm/admin/kyc/${id}/resubmit`, { notes })
}

// ── Public affiliate profile (no auth required) ──────────────────────────────
export async function getPublicMemberProfile(refCode) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 300))
    const m = ADMIN_MEMBERS.find(x => x.id === refCode) || ADMIN_MEMBERS[0]
    // Compute a stable team size from the mock downline tree
    const directCount = ADMIN_MEMBERS.filter(x => x.sponsor === m.id).length
    const totalCount  = ADMIN_MEMBERS.filter(x => x.sponsor === m.id || ADMIN_MEMBERS.some(s => s.id === m.id && x.sponsor === s.id)).length
    return {
      name:       m.name,
      memberId:   m.id,
      rank:       m.rank,
      country:    m.country,
      joinedDate: m.joined,
      directTeam: directCount,
      totalTeam:  Math.max(directCount, totalCount),
      bio:        null,
    }
  }
  return request('GET', `/v1/mlm/public/member/${encodeURIComponent(refCode)}`)
}

// ── Retention & Churn Analytics ───────────────────────────────────────────────
export async function getRetentionStats() {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 350))
    const members = ADMIN_MEMBERS
    const now = new Date()

    // Compute per-member activity score (mock: based on id hash + joined recency)
    const scored = members.map(m => {
      const daysSince = Math.floor((now - new Date(m.joined)) / 86400000)
      const base = ((m.id.charCodeAt(0) * 37 + m.id.charCodeAt(m.id.length - 1) * 13) % 60) + 20
      const recencyBonus = m.rank === 'platinum' ? 25 : m.rank === 'gold' ? 18 : m.rank === 'silver' ? 10 : 0
      const score = Math.min(100, Math.max(0, base + recencyBonus - (daysSince > 180 ? 15 : 0)))
      const lastActive = new Date(now - Math.floor(((100 - score) / 100) * 90 * 86400000)).toISOString().slice(0, 10)
      return { ...m, activityScore: score, lastActive, daysSinceActive: Math.floor((100 - score) / 100 * 90) }
    })

    const activeRate = Math.round((scored.filter(m => m.activityScore >= 40).length / scored.length) * 100)
    const avgScore = Math.round(scored.reduce((s, m) => s + m.activityScore, 0) / scored.length)
    const atRisk = scored.filter(m => m.activityScore < 35).length
    const retention30 = Math.round((scored.filter(m => m.activityScore >= 50).length / scored.length) * 100)

    // Cohort retention data: 4 cohorts, 8 weeks
    const cohorts = ['Jan', 'Feb', 'Mar', 'Apr'].map((month, ci) => {
      const base = 100 - ci * 3
      return { month, weeks: Array.from({ length: 8 }, (_, w) => Math.max(30, Math.round(base - w * (7 + ci))) ) }
    })
    const cohortChart = Array.from({ length: 8 }, (_, w) => {
      const obj = { week: `Wk ${w + 1}` }
      cohorts.forEach(c => { obj[c.month] = c.weeks[w] })
      return obj
    })

    // Activity distribution buckets
    const buckets = [
      { range: '0–20',  count: 0, color: '#ef4444' },
      { range: '21–40', count: 0, color: '#f97316' },
      { range: '41–60', count: 0, color: '#eab308' },
      { range: '61–80', count: 0, color: '#22c55e' },
      { range: '81–100',count: 0, color: '#3b82f6' },
    ]
    scored.forEach(m => {
      if (m.activityScore <= 20) buckets[0].count++
      else if (m.activityScore <= 40) buckets[1].count++
      else if (m.activityScore <= 60) buckets[2].count++
      else if (m.activityScore <= 80) buckets[3].count++
      else buckets[4].count++
    })

    const atRiskMembers = scored
      .filter(m => m.activityScore < 40)
      .sort((a, b) => a.activityScore - b.activityScore)
      .slice(0, 20)
      .map(m => ({
        id: m.id, name: m.name, email: m.email, rank: m.rank,
        activityScore: m.activityScore, lastActive: m.lastActive,
        daysSinceActive: m.daysSinceActive, country: m.country,
        churnRisk: m.activityScore < 20 ? 'High' : m.activityScore < 30 ? 'Medium' : 'Low',
      }))

    const topEngaged = scored
      .filter(m => m.activityScore >= 75)
      .sort((a, b) => b.activityScore - a.activityScore)
      .slice(0, 10)
      .map(m => ({ id: m.id, name: m.name, rank: m.rank, activityScore: m.activityScore, lastActive: m.lastActive }))

    return { activeRate, retention30, avgScore, atRisk, cohortChart, activityDistribution: buckets, atRiskMembers, topEngaged, totalMembers: members.length }
  }
  return request('GET', '/v1/mlm/admin/retention')
}

// ─── Wishlist ────────────────────────────────────────────────────────────────
const NV_WISHLIST_KEY = 'nv_wishlist'
function _loadWishlistIds() { try { return JSON.parse(localStorage.getItem(NV_WISHLIST_KEY) || '[]') } catch { return [] } }
function _saveWishlistIds(ids) { localStorage.setItem(NV_WISHLIST_KEY, JSON.stringify(ids)) }

export async function getWishlist(userId) {
  if (MOCK) {
    const ids = _loadWishlistIds()
    return { productIds: ids, products: PRODUCTS.filter(p => ids.includes(p.id)) }
  }
  return request('GET', `/v1/mlm/wishlist/${userId}`)
}

export async function addToWishlist(userId, productId) {
  if (MOCK) {
    const ids = _loadWishlistIds()
    if (!ids.includes(productId)) { ids.push(productId); _saveWishlistIds(ids) }
    return { productIds: ids }
  }
  return request('POST', `/v1/mlm/wishlist/${userId}`, { productId })
}

export async function removeFromWishlist(userId, productId) {
  if (MOCK) {
    const ids = _loadWishlistIds().filter(id => id !== productId)
    _saveWishlistIds(ids)
    return { productIds: ids }
  }
  return request('DELETE', `/v1/mlm/wishlist/${userId}/${productId}`)
}

// ── Network Analytics ─────────────────────────────────────────────────────────

export async function getNetworkAnalytics(userId) {
  if (MOCK) return NETWORK_ANALYTICS
  const [summary, levels, growth, contributors, activity] = await Promise.all([
    request('GET', `/v1/mlm/network/${userId}/summary`),
    request('GET', `/v1/mlm/network/${userId}/levels`),
    request('GET', `/v1/mlm/network/${userId}/growth?weeks=12`),
    request('GET', `/v1/mlm/network/${userId}/top-contributors`),
    request('GET', `/v1/mlm/network/${userId}/activity`),
  ])
  return { summary, levelBreakdown: levels, growthWeekly: growth, topContributors: contributors, recentActivity: activity, legBalance: summary.legBalance }
}

// ── Prospect Tracker ──────────────────────────────────────────────────────────

const NV_PROSPECTS_KEY = 'nv_prospects'

function _loadProspects() {
  try { return JSON.parse(localStorage.getItem(NV_PROSPECTS_KEY) || 'null') } catch { return null }
}
function _saveProspects(list) {
  localStorage.setItem(NV_PROSPECTS_KEY, JSON.stringify(list))
}

const MOCK_PROSPECTS = [
  { id: 'p1', name: 'Ingrid Solberg',    contact: 'WhatsApp', stage: 'Interested', phone: '+47 900 11 222', lastContact: '2026-07-28', followUp: '2026-08-01', notes: 'Interested in omega-3 products. Has 3 kids.' },
  { id: 'p2', name: 'Lars Bjørnstad',    contact: 'In Person', stage: 'New',       phone: '+47 901 33 444', lastContact: '2026-07-29', followUp: '2026-07-31', notes: 'Met at gym. Curious about income opportunity.' },
  { id: 'p3', name: 'Marte Haugen',      contact: 'Email',    stage: 'Presented',  phone: '+47 902 55 666', lastContact: '2026-07-25', followUp: '2026-08-03', notes: 'Sent product catalog and comp plan PDF. Awaiting reply.' },
  { id: 'p4', name: 'Kristoffer Dahl',   contact: 'Instagram', stage: 'Enrolled',  phone: '+47 903 77 888', lastContact: '2026-07-20', followUp: null, notes: 'Enrolled Jul 20. Ordered starter pack.' },
  { id: 'p5', name: 'Silje Andreassen',  contact: 'WhatsApp', stage: 'Declined',   phone: '+47 904 99 000', lastContact: '2026-07-15', followUp: null, notes: 'Not interested at this time. Follow up in 3 months.' },
  { id: 'p6', name: 'Tor Eriksen',       contact: 'Phone',    stage: 'Interested', phone: '+47 905 12 345', lastContact: '2026-07-27', followUp: '2026-08-02', notes: 'Wants to try products first before committing.' },
  { id: 'p7', name: 'Anette Moen',       contact: 'Facebook', stage: 'New',        phone: '+47 906 23 456', lastContact: '2026-07-30', followUp: '2026-08-05', notes: 'Reached out via FB group. Interested in health.' },
  { id: 'p8', name: 'Henrik Vold',       contact: 'Email',    stage: 'Presented',  phone: '+47 907 34 567', lastContact: '2026-07-22', followUp: '2026-07-31', notes: 'Had 30-min call. Sharing comp plan with spouse.' },
]

export async function getProspects(userId) {
  if (MOCK) {
    const stored = _loadProspects()
    return stored || MOCK_PROSPECTS
  }
  return request('GET', `/v1/mlm/prospects/${userId}`)
}

export async function createProspect(userId, data) {
  if (MOCK) {
    const stored = _loadProspects() || MOCK_PROSPECTS
    const newP = { ...data, id: 'p' + Date.now(), stage: data.stage || 'New' }
    const updated = [newP, ...stored]
    _saveProspects(updated)
    return newP
  }
  return request('POST', `/v1/mlm/prospects/${userId}`, data)
}

export async function updateProspect(userId, prospectId, updates) {
  if (MOCK) {
    const stored = _loadProspects() || MOCK_PROSPECTS
    const updated = stored.map(p => p.id === prospectId ? { ...p, ...updates } : p)
    _saveProspects(updated)
    return updated.find(p => p.id === prospectId)
  }
  return request('PATCH', `/v1/mlm/prospects/${userId}/${prospectId}`, updates)
}

export async function deleteProspect(userId, prospectId) {
  if (MOCK) {
    const stored = _loadProspects() || MOCK_PROSPECTS
    _saveProspects(stored.filter(p => p.id !== prospectId))
    return { ok: true }
  }
  return request('DELETE', `/v1/mlm/prospects/${userId}/${prospectId}`)
}

export async function logProspectInteraction(userId, prospectId, { note, date }) {
  if (MOCK) {
    const stored = _loadProspects() || MOCK_PROSPECTS
    const updated = stored.map(p =>
      p.id === prospectId
        ? { ...p, lastContact: date, notes: note ? `${date}: ${note}\n${p.notes || ''}`.trim() : p.notes }
        : p
    )
    _saveProspects(updated)
    return { ok: true }
  }
  return request('POST', `/v1/mlm/prospects/${userId}/${prospectId}/interactions`, { note, date })
}

// ── Loyalty Points ────────────────────────────────────────────────────────────

const _loyaltyKey = uid => `nv_loyalty_${uid}`

export async function getLoyaltyPoints(userId) {
  if (MOCK) {
    try {
      const raw = localStorage.getItem(_loyaltyKey(userId))
      if (raw) return JSON.parse(raw)
    } catch (_) {}
    return LOYALTY_DATA
  }
  return request('GET', `/v1/mlm/loyalty/${userId}`)
}

export async function redeemLoyaltyPoints(userId, optionId) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 600))
    const option = LOYALTY_DATA.redeemOptions.find(o => o.id === optionId)
    if (!option) throw new Error('Invalid redemption option')
    let data
    try {
      const raw = localStorage.getItem(_loyaltyKey(userId))
      data = raw ? JSON.parse(raw) : { ...LOYALTY_DATA, history: [...LOYALTY_DATA.history] }
    } catch (_) {
      data = { ...LOYALTY_DATA, history: [...LOYALTY_DATA.history] }
    }
    if (data.currentPoints < option.pointsCost) throw new Error('Insufficient points')
    data.currentPoints -= option.pointsCost
    const today = new Date().toISOString().slice(0, 10)
    data.history = [
      { id: `lp-r-${Date.now()}`, date: today, type: 'redeemed', category: option.category, description: `Redeemed: ${option.name}`, points: -option.pointsCost },
      ...data.history,
    ]
    localStorage.setItem(_loyaltyKey(userId), JSON.stringify(data))
    return { success: true, newBalance: data.currentPoints, redemptionCode: `NV-LPR-${Math.random().toString(36).slice(2,8).toUpperCase()}` }
  }
  return request('POST', `/v1/mlm/loyalty/${userId}/redeem`, { optionId })
}

// ── Inventory ─────────────────────────────────────────────────────────────────

const _inventoryKey = 'nv_admin_inventory'
const _movementsKey = 'nv_admin_stock_movements'

function _getInvStore() {
  try { const r = localStorage.getItem(_inventoryKey); if (r) return JSON.parse(r) } catch (_) {}
  return [...INVENTORY]
}
function _getMoveStore() {
  try { const r = localStorage.getItem(_movementsKey); if (r) return JSON.parse(r) } catch (_) {}
  return [...STOCK_MOVEMENTS]
}

export async function getInventory() {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 300))
    return _getInvStore()
  }
  return request('GET', '/v1/mlm/admin/inventory')
}

export async function adjustStock(productId, type, delta, note, batch) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 500))
    const inv = _getInvStore()
    const moves = _getMoveStore()
    const item = inv.find(i => i.id === productId)
    if (!item) throw new Error('Product not found in inventory')
    const appliedDelta = type === 'sale' || type === 'writeoff' ? -Math.abs(delta) : Math.abs(delta)
    item.stock = Math.max(0, item.stock + appliedDelta)
    item.status = item.stock === 0 ? 'out_of_stock' : item.stock <= item.reorderPoint ? 'low_stock' : 'in_stock'
    const today = new Date().toISOString().slice(0, 10)
    moves.unshift({
      id: `sm-${Date.now()}`,
      date: today,
      productId: item.productId,
      productName: item.name,
      sku: item.sku,
      type,
      delta: appliedDelta,
      newBalance: item.stock,
      note: batch ? `${note} (batch: ${batch})` : note,
    })
    try {
      localStorage.setItem(_inventoryKey, JSON.stringify(inv))
      localStorage.setItem(_movementsKey, JSON.stringify(moves))
    } catch (_) {}
    return { success: true, newStock: item.stock }
  }
  return request('POST', `/v1/mlm/admin/inventory/${productId}/adjust`, { type, delta, note, batch })
}

export async function getStockMovements({ productId, type } = {}) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 300))
    let moves = _getMoveStore()
    if (productId) moves = moves.filter(m => m.productId === productId)
    if (type)      moves = moves.filter(m => m.type === type)
    return moves
  }
  const qs = new URLSearchParams()
  if (productId) qs.set('product_id', productId)
  if (type)      qs.set('type', type)
  return request('GET', `/v1/mlm/admin/inventory/movements?${qs}`)
}

// GDPR / Data Privacy
export async function getMyDataSummary(userId) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 400))
    return {
      categories: [
        { name: 'Account & Profile', items: ['Name', 'Email', 'Phone', 'Country', 'Password hash'], retained: 'Duration of membership + 5 years' },
        { name: 'Transaction Records', items: ['Orders', 'Commission history', 'Wallet transactions', 'Withdrawals'], retained: '10 years (accounting law)' },
        { name: 'Network & Referrals', items: ['Sponsor ID', 'Downline structure', 'Referral links used'], retained: 'Duration of membership' },
        { name: 'Activity Logs', items: ['Login timestamps', 'Page views (anonymised)', 'Support ticket history'], retained: '12 months' },
        { name: 'Communications', items: ['Email opt-in/out status', 'Notification preferences', 'Announcement reads'], retained: '24 months' },
      ],
      lastExport: null,
      pendingDeletion: false,
    }
  }
  return request('GET', `/v1/mlm/privacy/my-data/${userId}`)
}

export async function requestDataExport(userId) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 800))
    return { requestId: `exp-${Date.now()}`, estimatedReadyAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString() }
  }
  return request('POST', `/v1/mlm/privacy/export`, { userId })
}

export async function requestAccountDeletion(userId, reason) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 600))
    return { requestId: `del-${Date.now()}`, scheduledAt: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(), gracePeriodDays: 30 }
  }
  return request('POST', `/v1/mlm/privacy/delete-account`, { userId, reason })
}

export async function updateConsentPreferences(userId, prefs) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 300))
    return { success: true }
  }
  return request('PUT', `/v1/mlm/privacy/consent/${userId}`, prefs)
}

// Admin Notifications
let _mockNotifications = null
function _getNotifStore() {
  if (_mockNotifications) return _mockNotifications
  _mockNotifications = [...ADMIN_NOTIFICATIONS]
  return _mockNotifications
}

export async function getAdminNotifications() {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 350))
    return [..._getNotifStore()].sort((a, b) => {
      const da = a.sent_at || a.scheduled_at || ''
      const db = b.sent_at || b.scheduled_at || ''
      return db.localeCompare(da)
    })
  }
  return request('GET', '/v1/mlm/admin/notifications')
}

export async function sendNotification({ type, title, body, audience, recipient_count, scheduled_at }) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 500))
    const isScheduled = !!scheduled_at
    const notif = {
      id: `notif-${Date.now()}`,
      type,
      title,
      body,
      audience,
      recipient_count,
      read_count: 0,
      status: isScheduled ? 'scheduled' : 'sent',
      sent_at:      isScheduled ? undefined  : new Date().toISOString(),
      scheduled_at: isScheduled ? scheduled_at : undefined,
    }
    _getNotifStore().unshift(notif)
    return notif
  }
  return request('POST', '/v1/mlm/admin/notifications', { type, title, body, audience, scheduled_at })
}

export async function cancelNotification(id) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 300))
    const store = _getNotifStore()
    const idx = store.findIndex(n => n.id === id)
    if (idx !== -1) store[idx] = { ...store[idx], status: 'cancelled' }
    return { success: true }
  }
  return request('POST', `/v1/mlm/admin/notifications/${id}/cancel`)
}

export async function getAdminFinancials() {
  if (MOCK) return FINANCIAL_DATA
  return request('GET', '/v1/mlm/admin/financials')
}

// Daily Activity Tracker
const ACTIVITY_STORAGE_KEY = 'nv_activity_log'
function _getActivityStore(userId) {
  try {
    const raw = localStorage.getItem(`${ACTIVITY_STORAGE_KEY}_${userId}`)
    if (raw) return JSON.parse(raw)
  } catch (_) { /* ignore */ }
  return [...ACTIVITY_LOG]
}
function _saveActivityStore(userId, store) {
  try { localStorage.setItem(`${ACTIVITY_STORAGE_KEY}_${userId}`, JSON.stringify(store)) } catch (_) { /* ignore */ }
}

export async function getActivityLog(userId) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 200))
    return { log: _getActivityStore(userId), goals: ACTIVITY_GOALS }
  }
  return request('GET', `/v1/mlm/activity/${userId}`)
}

export async function saveActivityDay(userId, date, counts) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 150))
    const store = _getActivityStore(userId)
    const idx = store.findIndex(d => d.date === date)
    if (idx !== -1) {
      store[idx] = { ...store[idx], ...counts }
    } else {
      store.unshift({ date, calls: 0, presentations: 0, followUps: 0, prospectsAdded: 0, enrollments: 0, shares: 0, ...counts })
    }
    _saveActivityStore(userId, store)
    return { success: true }
  }
  return request('POST', `/v1/mlm/activity/${userId}`, { date, ...counts })
}

export async function getActivityGoals(userId) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 150))
    const raw = localStorage.getItem(`nv_activity_goals_${userId}`)
    return raw ? JSON.parse(raw) : { ...ACTIVITY_GOALS }
  }
  return request('GET', `/v1/mlm/activity/${userId}/goals`)
}

export async function saveActivityGoals(userId, goals) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 150))
    try { localStorage.setItem(`nv_activity_goals_${userId}`, JSON.stringify(goals)) } catch (_) { /* ignore */ }
    return { success: true }
  }
  return request('PUT', `/v1/mlm/activity/${userId}/goals`, goals)
}

// ─── Launch Checklist ────────────────────────────────────────────────────────
const LAUNCH_STORAGE_KEY = 'nv_launch_checklist'

const DEFAULT_CHECKLIST = [
  // Infrastructure
  { id: 'infra-1', category: 'infrastructure', label: 'Vercel production deployment configured', description: 'Project connected to GitHub, auto-deploy on main branch push', owner: 'gary', status: 'not_started', notes: '', link: null },
  { id: 'infra-2', category: 'infrastructure', label: 'Custom domain connected', description: 'e.g. nordicvitals.no — add to Vercel + DNS records updated', owner: 'both', status: 'not_started', notes: '', link: null },
  { id: 'infra-3', category: 'infrastructure', label: 'Environment variables set in Vercel', description: 'VITE_MLM_API_URL, VITE_MLM_API_KEY, VITE_SITE_URL', owner: 'gary', status: 'not_started', notes: '', link: '/admin/integrations' },
  { id: 'infra-4', category: 'infrastructure', label: 'SSL/HTTPS verified on live domain', description: 'Check that https:// is active and no mixed-content warnings', owner: 'gary', status: 'not_started', notes: '', link: null },
  { id: 'infra-5', category: 'infrastructure', label: 'PWA service worker active on production', description: 'Visit live site → DevTools → Application → Service Workers', owner: 'gary', status: 'not_started', notes: '', link: null },

  // API & Integrations
  { id: 'api-1', category: 'api', label: 'Arctico API base URL configured', description: 'Enter base URL in Admin → Integrations → Arctico API section', owner: 'bjorn', status: 'not_started', notes: '', link: '/admin/integrations' },
  { id: 'api-2', category: 'api', label: 'Arctico API key entered and connection tested', description: 'Use the "Test Connection" button — must return green status badge', owner: 'bjorn', status: 'not_started', notes: '', link: '/admin/integrations' },
  { id: 'api-3', category: 'api', label: 'Payment gateway enabled (Stripe/Klarna/Vipps)', description: 'At least one gateway active with live credentials', owner: 'bjorn', status: 'not_started', notes: '', link: '/admin/integrations' },
  { id: 'api-4', category: 'api', label: 'Outgoing webhooks configured for key events', description: 'commission_run, member_enrolled, payout_processed at minimum', owner: 'bjorn', status: 'not_started', notes: '', link: '/admin/integrations' },
  { id: 'api-5', category: 'api', label: 'Transactional email delivery verified', description: 'Send test email from Email Templates for welcome + commission_run', owner: 'gary', status: 'not_started', notes: '', link: '/admin/email-templates' },

  // Legal & Compliance
  { id: 'legal-1', category: 'legal', label: 'Privacy Policy reviewed and approved', description: 'Legal review of /privacy page content — Bjørn to sign off', owner: 'bjorn', status: 'not_started', notes: '', link: null },
  { id: 'legal-2', category: 'legal', label: 'Terms & Conditions reviewed and approved', description: 'Legal review of /terms page content — Bjørn to sign off', owner: 'bjorn', status: 'not_started', notes: '', link: null },
  { id: 'legal-3', category: 'legal', label: 'Income Disclosure Statement (IDS) published', description: 'Verify IDS tab in Compliance Center is accurate before launch', owner: 'both', status: 'not_started', notes: '', link: '/admin/compliance' },
  { id: 'legal-4', category: 'legal', label: 'GDPR cookie consent banner active', description: 'Verify banner appears on first visit at /. nv_cookie_consent in localStorage', owner: 'gary', status: 'not_started', notes: '', link: null },
  { id: 'legal-5', category: 'legal', label: 'Compliance checklist completed', description: 'All 19 items in Compliance Center → Checklist tab marked Done', owner: 'both', status: 'not_started', notes: '', link: '/admin/compliance' },

  // Products & Inventory
  { id: 'prod-1', category: 'products', label: 'Product catalog finalized', description: 'Descriptions, taglines and categories approved for all 6 SKUs', owner: 'bjorn', status: 'not_started', notes: '', link: '/admin/products' },
  { id: 'prod-2', category: 'products', label: 'Pricing confirmed (retail + member prices)', description: 'NOK retail and member prices set and margin reviewed', owner: 'bjorn', status: 'not_started', notes: '', link: '/admin/products' },
  { id: 'prod-3', category: 'products', label: 'Product images uploaded and approved', description: 'High-res images for all 6 products in shop + product detail pages', owner: 'gary', status: 'not_started', notes: '', link: '/admin/products' },
  { id: 'prod-4', category: 'products', label: 'Initial inventory stock entered', description: 'Opening stock counts in Admin → Inventory for all SKUs', owner: 'gary', status: 'not_started', notes: '', link: '/admin/inventory' },

  // Commission & Payouts
  { id: 'comm-1', category: 'commission', label: 'MLM plan type selected and configured', description: 'Binary/Unilevel/Breakaway — rates and rank thresholds set', owner: 'bjorn', status: 'not_started', notes: '', link: '/admin/plan' },
  { id: 'comm-2', category: 'commission', label: 'Dry-run commission preview completed', description: 'Run a preview with test members — verify per-member payouts look correct', owner: 'both', status: 'not_started', notes: '', link: '/admin/commission-preview' },
  { id: 'comm-3', category: 'commission', label: 'Minimum payout threshold set', description: 'Confirm minimum withdrawal amount in Settings', owner: 'bjorn', status: 'not_started', notes: '', link: '/admin/settings' },
  { id: 'comm-4', category: 'commission', label: 'Withdrawal methods configured', description: 'Bank Transfer / SEPA / Crypto options confirmed active', owner: 'bjorn', status: 'not_started', notes: '', link: '/admin/integrations' },

  // Member Experience
  { id: 'mem-1', category: 'member', label: 'Admin accounts created for Gary + Bjørn', description: 'Both admins can log in with correct roles in Roles & Permissions', owner: 'bjorn', status: 'not_started', notes: '', link: '/admin/roles' },
  { id: 'mem-2', category: 'member', label: 'Onboarding wizard tested end-to-end', description: 'Create a test member account and complete the 7-step wizard', owner: 'gary', status: 'not_started', notes: '', link: null },
  { id: 'mem-3', category: 'member', label: 'KYC verification workflow enabled', description: 'Submit a test KYC doc and approve it through admin queue', owner: 'gary', status: 'not_started', notes: '', link: '/admin/kyc' },
  { id: 'mem-4', category: 'member', label: 'At least 5 test member accounts enrolled', description: 'Creates realistic data for tree, commission preview, and leaderboard', owner: 'both', status: 'not_started', notes: '', link: '/admin/import' },

  // Marketing
  { id: 'mkt-1', category: 'marketing', label: 'Landing page copy approved', description: 'Product claims, testimonials, and CTAs reviewed by Bjørn', owner: 'bjorn', status: 'not_started', notes: '', link: null },
  { id: 'mkt-2', category: 'marketing', label: 'Social media accounts ready', description: 'Instagram/Facebook/TikTok for Nordic Vitals — bios + profile pics set', owner: 'gary', status: 'not_started', notes: '', link: null },
  { id: 'mkt-3', category: 'marketing', label: 'Launch announcement drafted', description: 'First broadcast to members created in Admin → Announcements', owner: 'both', status: 'not_started', notes: '', link: '/admin/announcements' },
  { id: 'mkt-4', category: 'marketing', label: 'Referral campaign active', description: 'Test a full referral: /ref/<memberId> → /join?ref= → enrolled', owner: 'gary', status: 'not_started', notes: '', link: '/admin/referrals' },
]

function _getLaunchStore() {
  try {
    const raw = localStorage.getItem(LAUNCH_STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch (_) { /* ignore */ }
  return DEFAULT_CHECKLIST.map(i => ({ ...i }))
}
function _saveLaunchStore(store) {
  try { localStorage.setItem(LAUNCH_STORAGE_KEY, JSON.stringify(store)) } catch (_) { /* ignore */ }
}

// ── Product Bundles ──────────────────────────────────────────────────────
const BUNDLES_KEY = 'nv_bundles'
function _getBundleStore() {
  try { const d = localStorage.getItem(BUNDLES_KEY); if (d) return JSON.parse(d) } catch {}
  return BUNDLES.map(b => ({ ...b }))
}
function _saveBundleStore(data) {
  try { localStorage.setItem(BUNDLES_KEY, JSON.stringify(data)) } catch {}
}

export async function getBundles({ activeOnly = false } = {}) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 180))
    const store = _getBundleStore()
    return activeOnly ? store.filter(b => b.active) : store
  }
  return request('GET', `/v1/mlm/admin/bundles${activeOnly ? '?active=true' : ''}`)
}

export async function createBundle(data) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 250))
    const store = _getBundleStore()
    const newBundle = { ...data, id: Date.now(), totalSold: 0, createdAt: new Date().toISOString().slice(0,10), active: true }
    store.push(newBundle)
    _saveBundleStore(store)
    return newBundle
  }
  return request('POST', '/v1/mlm/admin/bundles', data)
}

export async function updateBundle(id, patch) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 180))
    const store = _getBundleStore()
    const idx = store.findIndex(b => b.id === id)
    if (idx !== -1) store[idx] = { ...store[idx], ...patch }
    _saveBundleStore(store)
    return idx !== -1 ? store[idx] : null
  }
  return request('PATCH', `/v1/mlm/admin/bundles/${id}`, patch)
}

export async function deleteBundle(id) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 150))
    _saveBundleStore(_getBundleStore().filter(b => b.id !== id))
    return { success: true }
  }
  return request('DELETE', `/v1/mlm/admin/bundles/${id}`)
}

export async function toggleBundleActive(id) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 120))
    const store = _getBundleStore()
    const idx = store.findIndex(b => b.id === id)
    if (idx !== -1) store[idx].active = !store[idx].active
    _saveBundleStore(store)
    return { active: idx !== -1 ? store[idx].active : false }
  }
  return request('POST', `/v1/mlm/admin/bundles/${id}/toggle`)
}

export async function getLaunchChecklist() {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 200))
    return _getLaunchStore()
  }
  return request('GET', '/v1/mlm/admin/launch-checklist')
}

export async function updateLaunchItem(id, patch) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 100))
    const store = _getLaunchStore()
    const idx = store.findIndex(i => i.id === id)
    if (idx !== -1) store[idx] = { ...store[idx], ...patch }
    _saveLaunchStore(store)
    return { success: true }
  }
  return request('PATCH', `/v1/mlm/admin/launch-checklist/${id}`, patch)
}

export async function getMyReferralStats(userId) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 180))
    return {
      totalClicks: 124,
      totalSignups: 12,
      conversionRate: 9.7,
      activeFromLink: 8,
      thisMonthClicks: 37,
      thisMonthSignups: 3,
      topReferralCountry: 'Norway',
      lifetimeEarned: 840,
    }
  }
  return request('GET', `/v1/mlm/referrals/stats/${userId}`)
}

export async function trackReferralShare(userId, platform) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 100))
    return { success: true }
  }
  return request('POST', `/v1/mlm/referrals/share`, { userId, platform })
}

const _NOTIF_PREFS_KEY = 'nv_notification_prefs'

function _getNotifPrefsStore(userId) {
  try {
    const raw = localStorage.getItem(`${_NOTIF_PREFS_KEY}_${userId}`)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

function _saveNotifPrefsStore(userId, prefs) {
  try { localStorage.setItem(`${_NOTIF_PREFS_KEY}_${userId}`, JSON.stringify(prefs)) } catch {}
}

export async function getNotificationPrefs(userId) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 150))
    return _getNotifPrefsStore(userId) || null
  }
  return request('GET', `/v1/mlm/members/${userId}/notification-prefs`)
}

export async function saveNotificationPrefs(userId, prefs) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 200))
    _saveNotifPrefsStore(userId, prefs)
    return { success: true }
  }
  return request('PUT', `/v1/mlm/members/${userId}/notification-prefs`, prefs)
}

// ── Team Broadcast ───────────────────────────────────────────────────────────
const _BROADCAST_KEY = 'nv_team_broadcasts'

function _getBroadcastStore(userId) {
  try {
    const raw = localStorage.getItem(`${_BROADCAST_KEY}_${userId}`)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}
function _saveBroadcastStore(userId, data) {
  try { localStorage.setItem(`${_BROADCAST_KEY}_${userId}`, JSON.stringify(data)) } catch {}
}

function _getFullDownline(sponsorId, all, depth = 0, maxDepth = 10) {
  if (depth >= maxDepth) return []
  const directs = all.filter(m => m.sponsor === sponsorId)
  return directs.flatMap(m => [m, ..._getFullDownline(m.id, all, depth + 1, maxDepth)])
}

export async function getTeamBroadcastRecipients(userId) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 200))
    const memberId = ADMIN_MEMBERS.find(m => m.id === userId) ? userId
      : (ADMIN_MEMBERS.find(m => m.id === 'NV-10042') ? 'NV-10042' : null)
    const direct = ADMIN_MEMBERS.filter(m => m.sponsor === memberId)
    const full = _getFullDownline(memberId, ADMIN_MEMBERS)
    return {
      direct: direct.map(m => ({ id: m.id, name: m.name, rank: m.rank, status: m.status })),
      full: full.map(m => ({ id: m.id, name: m.name, rank: m.rank, status: m.status })),
    }
  }
  return request('GET', `/v1/mlm/team/${userId}/broadcast-recipients`)
}

export async function sendTeamBroadcast(userId, { subject, body, audience }) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 350))
    const store = _getBroadcastStore(userId)
    const memberId = ADMIN_MEMBERS.find(m => m.id === userId) ? userId : 'NV-10042'
    const all = _getFullDownline(memberId, ADMIN_MEMBERS)
    const direct = ADMIN_MEMBERS.filter(m => m.sponsor === memberId)
    const recipients = audience === 'direct' ? direct : all
    const entry = {
      id: `bcast-${Date.now()}`,
      subject,
      body,
      audience,
      recipientCount: recipients.length,
      sentAt: new Date().toISOString(),
      status: 'delivered',
    }
    store.unshift(entry)
    _saveBroadcastStore(userId, store)
    return { success: true, recipientCount: recipients.length, broadcastId: entry.id }
  }
  return request('POST', `/v1/mlm/team/${userId}/broadcast`, { subject, body, audience })
}

export async function getTeamBroadcasts(userId) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 150))
    return _getBroadcastStore(userId)
  }
  return request('GET', `/v1/mlm/team/${userId}/broadcasts`)
}

export async function getSocialProofEvents() {
  if (MOCK) {
    const { SOCIAL_PROOF_EVENTS } = await import('../data/mock.js')
    return SOCIAL_PROOF_EVENTS
  }
  return request('GET', '/v1/mlm/public/social-proof')
}

const _CHALLENGES_KEY = 'nv_challenges'
function _getChallengeStore() {
  try { return JSON.parse(localStorage.getItem(_CHALLENGES_KEY)) || [...CHALLENGES] } catch { return [...CHALLENGES] }
}
function _saveChallengeStore(data) {
  try { localStorage.setItem(_CHALLENGES_KEY, JSON.stringify(data)) } catch {}
}

export async function getChallenges() {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 120))
    return _getChallengeStore()
  }
  return request('GET', '/v1/mlm/admin/challenges')
}

export async function createChallenge(data) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 200))
    const store = _getChallengeStore()
    const entry = { ...data, id: `chal-${Date.now()}`, participant_count: 0, winner_announced: false, winner_id: null, created_at: new Date().toISOString() }
    store.unshift(entry)
    _saveChallengeStore(store)
    return entry
  }
  return request('POST', '/v1/mlm/admin/challenges', data)
}

export async function updateChallenge(id, data) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 180))
    const store = _getChallengeStore()
    const idx = store.findIndex(c => c.id === id)
    if (idx !== -1) store[idx] = { ...store[idx], ...data }
    _saveChallengeStore(store)
    return store[idx]
  }
  return request('PATCH', `/v1/mlm/admin/challenges/${id}`, data)
}

export async function deleteChallenge(id) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 150))
    const store = _getChallengeStore().filter(c => c.id !== id)
    _saveChallengeStore(store)
    return { success: true }
  }
  return request('DELETE', `/v1/mlm/admin/challenges/${id}`)
}

export async function getChallengeLeaderboard(challengeId) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 100))
    return CHALLENGE_LEADERBOARDS[challengeId] || []
  }
  return request('GET', `/v1/mlm/challenges/${challengeId}/leaderboard`)
}

export async function getMyChallenges(userId) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 130))
    const store = _getChallengeStore()
    const active = store.filter(c => c.status === 'active' || c.status === 'upcoming')
    const IS_LARS = !userId || userId === 'NV-10002'
    return active.map(c => {
      const lb = CHALLENGE_LEADERBOARDS[c.id] || []
      const myEntry = IS_LARS ? lb.find(e => e.member_id === 'NV-10002') : null
      const myValue = myEntry ? myEntry.value : 0
      const myRank  = myEntry ? myEntry.rank : null
      const myPct   = myEntry ? myEntry.progress_pct : 0
      return { ...c, my_value: myValue, my_rank: myRank, my_progress_pct: myPct }
    })
  }
  return request('GET', `/v1/mlm/member/${userId}/challenges`)
}

// ── Exchange Rates ────────────────────────────────────────────────────────────
const RATES_KEY = 'nv_exchange_rates'

function loadRates() {
  try {
    const stored = localStorage.getItem(RATES_KEY)
    if (stored) return JSON.parse(stored)
  } catch {}
  return EXCHANGE_RATES
}

function saveRates(data) {
  try { localStorage.setItem(RATES_KEY, JSON.stringify(data)) } catch {}
}

export async function getExchangeRates() {
  await delay(200)
  if (!MOCK) return request('GET', '/v1/mlm/admin/exchange-rates')
  return loadRates()
}

export async function updateExchangeRate({ mlmt_nok, mlmt_eur, mlmt_usd, note, effective_date }) {
  await delay(300)
  if (!MOCK) return request('POST', '/v1/mlm/admin/exchange-rates', { mlmt_nok, mlmt_eur, mlmt_usd, note, effective_date })
  const stored = loadRates()
  const now = new Date().toISOString()
  const id = `er-${Date.now()}`
  const newEntry = {
    id,
    effective_date: effective_date || now.slice(0, 10),
    mlmt_nok: parseFloat(mlmt_nok),
    mlmt_eur: parseFloat(mlmt_eur),
    mlmt_usd: parseFloat(mlmt_usd),
    changed_by: 'Gary',
    note: note || '',
  }
  const updated = {
    current: {
      mlmt_nok: parseFloat(mlmt_nok),
      mlmt_eur: parseFloat(mlmt_eur),
      mlmt_usd: parseFloat(mlmt_usd),
      updated_at: now,
      updated_by: 'Gary',
      source: 'manual',
    },
    history: [newEntry, ...stored.history].slice(0, 20),
  }
  saveRates(updated)
  return updated
}

export function readCurrentMlmtToNok() {
  try {
    const stored = localStorage.getItem(RATES_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      return parsed.current?.mlmt_nok ?? 1.15
    }
  } catch {}
  return 1.15
}

// ── Storefront Banners ────────────────────────────────────────────────────────
const BANNERS_KEY = 'nv_banners'

function _loadBanners() {
  try {
    const s = localStorage.getItem(BANNERS_KEY)
    if (s) return JSON.parse(s)
  } catch {}
  return BANNERS
}

function _saveBanners(data) {
  try { localStorage.setItem(BANNERS_KEY, JSON.stringify(data)) } catch {}
}

export async function getAdminBanners() {
  await delay(180)
  if (!MOCK) return request('GET', '/v1/mlm/admin/banners')
  return _loadBanners()
}

export async function getActiveBanners(page) {
  await delay(100)
  if (!MOCK) return request('GET', `/v1/mlm/banners/active?page=${page}`)
  const today = new Date().toISOString().slice(0, 10)
  const all = _loadBanners()
  return all.filter(b =>
    b.active &&
    (!b.start_date || b.start_date <= today) &&
    (!b.end_date   || b.end_date   >= today) &&
    (b.pages.includes('all') || b.pages.includes(page))
  )
}

export async function createBanner(data) {
  await delay(250)
  if (!MOCK) return request('POST', '/v1/mlm/admin/banners', data)
  const banners = _loadBanners()
  const newBanner = {
    id: `ban-${Date.now()}`,
    created_at: new Date().toISOString(),
    dismiss_count: 0,
    impression_count: 0,
    ...data,
  }
  _saveBanners([newBanner, ...banners])
  return newBanner
}

export async function updateBanner(id, data) {
  await delay(220)
  if (!MOCK) return request('PATCH', `/v1/mlm/admin/banners/${id}`, data)
  const banners = _loadBanners().map(b => b.id === id ? { ...b, ...data } : b)
  _saveBanners(banners)
  return banners.find(b => b.id === id)
}

export async function deleteBanner(id) {
  await delay(200)
  if (!MOCK) return request('DELETE', `/v1/mlm/admin/banners/${id}`)
  const banners = _loadBanners().filter(b => b.id !== id)
  _saveBanners(banners)
  return { ok: true }
}

export async function toggleBannerActive(id, active) {
  return updateBanner(id, { active })
}

// ── Revenue & Growth Forecast ─────────────────────────────────────────────────
export async function getAdminForecast({ horizon = 6, recruitRate = 8, avgOrder = 950 } = {}) {
  if (!MOCK) return request('GET', `/v1/mlm/admin/forecast?horizon=${horizon}&recruit_rate=${recruitRate}&avg_order=${avgOrder}`)

  // Historical actuals (last 3 months, fixed)
  const HISTORICAL = [
    { month: 'May 26', members: 38, revenue: 28500,  commission: 8700,  cogs: 11400 },
    { month: 'Jun 26', members: 44, revenue: 33200,  commission: 10100, cogs: 13280 },
    { month: 'Jul 26', members: 52, revenue: 41600,  commission: 12650, cogs: 16640 },
  ]

  // Project forward from current state
  const MULTIPLIERS = { conservative: 0.6, base: 1.0, optimistic: 1.6 }
  const COGS_RATE   = 0.40  // 40% of revenue = COGS
  const COMM_RATE   = { conservative: 0.28, base: 0.31, optimistic: 0.34 } // scaling with size

  let cumulativeProfit = { conservative: -5000, base: -5000, optimistic: -5000 }

  const months = []

  // Include last 3 historical months
  HISTORICAL.forEach(h => {
    const scenarios = {}
    Object.keys(MULTIPLIERS).forEach(sc => {
      const commission = h.commission
      const revenue    = h.revenue
      const cogs       = h.cogs
      const netProfit  = revenue - commission - cogs
      cumulativeProfit[sc] += netProfit
      scenarios[sc] = {
        members:    h.members,
        revenue,
        commission,
        cogs,
        netProfit,
        commRatio:  (commission / revenue) * 100,
        cumProfit:  cumulativeProfit[sc],
      }
    })
    months.push({ month: h.month, projected: false, scenarios })
  })

  // Generate projected months
  let baseMembers = HISTORICAL[HISTORICAL.length - 1].members
  const MONTH_NAMES = ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul']
  let monthIdx = 0

  for (let i = 0; i < horizon; i++) {
    const label = MONTH_NAMES[monthIdx % 12] + ' ' + (26 + Math.floor((7 + monthIdx) / 12))
    monthIdx++

    const scenarios = {}
    Object.entries(MULTIPLIERS).forEach(([sc, mult]) => {
      const newMembers = Math.round(recruitRate * mult)
      const scMembers  = baseMembers + newMembers * (sc === 'conservative' ? 0.6 : sc === 'optimistic' ? 1.6 : 1.0)
      const ordersPerMember = 0.65 // avg orders per member per month
      const revenue    = Math.round(scMembers * ordersPerMember * avgOrder * mult)
      const cogs       = Math.round(revenue * COGS_RATE)
      const commRateVal = COMM_RATE[sc] + (i * 0.003) // ratio grows slightly as team deepens
      const commission = Math.round(revenue * Math.min(commRateVal, 0.55))
      const netProfit  = revenue - commission - cogs
      cumulativeProfit[sc] += netProfit
      scenarios[sc] = {
        members:   Math.round(scMembers),
        revenue,
        commission,
        cogs,
        netProfit,
        commRatio: (commission / revenue) * 100,
        cumProfit: cumulativeProfit[sc],
      }
    })

    if (scenarios.base) baseMembers = scenarios.base.members

    months.push({ month: label, projected: true, scenarios })
  }

  // KPI summary per scenario
  const kpi = {}
  Object.keys(MULTIPLIERS).forEach(sc => {
    const projRows = months.filter(m => m.projected)
    const totalRevenue    = projRows.reduce((s, m) => s + m.scenarios[sc].revenue, 0)
    const totalCommission = projRows.reduce((s, m) => s + m.scenarios[sc].commission, 0)
    const totalCogs       = projRows.reduce((s, m) => s + m.scenarios[sc].cogs, 0)
    const avgCommRatio    = projRows.length ? projRows.reduce((s, m) => s + m.scenarios[sc].commRatio, 0) / projRows.length : 0
    const startMembers    = HISTORICAL[0].members
    const endMembers      = projRows.length ? projRows[projRows.length - 1].scenarios[sc].members : startMembers

    // Find break-even month (cumulative profit turns positive)
    let breakEvenMonth = null
    let cum = HISTORICAL.reduce((s, h) => s + h.revenue - h.commission - h.cogs, -5000)
    for (const m of projRows) {
      cum += m.scenarios[sc].netProfit
      if (cum >= 0 && !breakEvenMonth) { breakEvenMonth = m.month; break }
    }

    kpi[sc] = { totalRevenue, totalCommission, totalCogs, avgCommRatio, startMembers, endMembers, breakEvenMonth }
  })

  return { months, kpi }
}

// ── Team Performance Report ───────────────────────────────────────────────────

export async function getTeamReport(userId, period = 'month') {
  if (MOCK) {
    const all = ADMIN_MEMBERS
    // Build downline via BFS from sponsor chain
    const levelMap = {}
    const queue = [{ id: userId, level: 0 }]
    while (queue.length) {
      const { id, level } = queue.shift()
      const directs = all.filter(m => m.sponsor === id)
      directs.forEach(m => {
        if (levelMap[m.id] === undefined) {
          levelMap[m.id] = level + 1
          queue.push({ id: m.id, level: level + 1 })
        }
      })
    }
    const teamMembers = all
      .filter(m => levelMap[m.id] !== undefined)
      .map(m => ({ ...m, level: levelMap[m.id] }))

    // Simulate period-based data deterministically
    const PERIOD_MULT = { week: 0.25, month: 1, last_month: 0.9 }
    const mult = PERIOD_MULT[period] ?? 1

    // Team commissions: ~18% of team GV
    const totalTeamGV = teamMembers.reduce((s, m) => s + m.gv, 0)
    const teamCommissions = Math.round(totalTeamGV * 0.18 * mult)

    // New recruits this period (simulate based on period)
    const newRecruits = period === 'week' ? 1 : period === 'last_month' ? 3 : 2
    const recruitNames = ['Ingrid Bakken', 'Tor Gresseth', 'Camilla Neset']
    const recentRecruits = recruitNames.slice(0, newRecruits).map((name, i) => ({
      id: `NV-10${300 + i}`, name,
      joinedAgo: period === 'week' ? `${i + 2} days ago` : `${6 + i * 5} days ago`,
      sponsor: teamMembers[i % teamMembers.length]?.name ?? 'Unknown',
    }))

    // Rank-ups this period
    const rankUps = period === 'week' ? [] : [
      { name: 'Mia Andersen', from: 'Unranked', to: 'Bronze', daysAgo: 8 },
      ...(period === 'month' ? [{ name: 'Sigrid Voss', from: 'Bronze', to: 'Silver', daysAgo: 22 }] : []),
    ]

    // At-risk members (inactive or low PV)
    const atRisk = teamMembers.filter(m => m.status === 'Inactive' || m.pv < 50)

    // Top performers by GV
    const topPerformers = [...teamMembers]
      .sort((a, b) => b.gv - a.gv)
      .slice(0, 5)
      .map(m => ({
        id: m.id, name: m.name, rank: m.rank, gv: Math.round(m.gv * mult),
        pv: Math.round(m.pv * mult), level: m.level,
        commEarned: Math.round(m.gv * 0.05 * mult),
      }))

    // Commission breakdown by bonus type
    const commBreakdown = [
      { type: 'Sponsor Bonus',       amount: Math.round(teamCommissions * 0.28), color: '#c9a84c' },
      { type: 'Pairing Bonus',       amount: Math.round(teamCommissions * 0.38), color: '#3b82f6' },
      { type: 'Level Commission',    amount: Math.round(teamCommissions * 0.22), color: '#22c55e' },
      { type: 'Override / Pool',     amount: Math.round(teamCommissions * 0.12), color: '#a78bfa' },
    ]

    // Weekly sparkline (8 weeks of commission flow, ending now)
    const weeklyData = Array.from({ length: 8 }, (_, i) => ({
      week: `W${i + 1}`,
      commissions: Math.round((teamCommissions / 4) * (0.6 + Math.sin(i * 0.9) * 0.4 + i * 0.05)),
      recruits: i === 3 ? 1 : i === 6 ? 1 : 0,
    }))

    return {
      period,
      teamSize: teamMembers.length,
      activeCount: teamMembers.filter(m => m.status === 'Active').length,
      totalTeamGV: Math.round(totalTeamGV * mult),
      totalTeamPV: Math.round(teamMembers.reduce((s, m) => s + m.pv, 0) * mult),
      teamCommissions,
      newRecruits: recentRecruits.length,
      recentRecruits,
      rankUps,
      atRisk,
      topPerformers,
      commBreakdown,
      weeklyData,
    }
  }
  const params = new URLSearchParams({ period })
  return request('GET', `/v1/mlm/team-report/${userId}?${params}`)
}

// ── Member Earnings Forecast ──────────────────────────────────────────────────

export async function getMemberForecast(userId, { horizon = 6, recruitsPerMonth = null } = {}) {
  if (!MOCK) {
    const params = new URLSearchParams({ horizon, ...(recruitsPerMonth != null && { recruits_per_month: recruitsPerMonth }) })
    return request('GET', `/v1/mlm/forecast/${userId}?${params}`)
  }

  const me = ADMIN_MEMBERS.find(m => m.id === userId) || ADMIN_MEMBERS[0]
  const RANK_ORDER = ['Unranked', 'Bronze', 'Silver', 'Gold', 'Platinum']
  const RANK_REQS = {
    Unranked: { pv: 0,   leftGV: 0,    rightGV: 0,   recruits: 0 },
    Bronze:   { pv: 100, leftGV: 500,  rightGV: 500,  recruits: 2 },
    Silver:   { pv: 200, leftGV: 1500, rightGV: 1500, recruits: 5 },
    Gold:     { pv: 300, leftGV: 4000, rightGV: 4000, recruits: 10 },
    Platinum: { pv: 500, leftGV: 10000,rightGV: 10000,recruits: 20 },
  }
  const COMM_RATES = { Unranked: 0.10, Bronze: 0.14, Silver: 0.18, Gold: 0.22, Platinum: 0.27 }

  const currentRankIdx = RANK_ORDER.indexOf(me.rank) === -1 ? 0 : RANK_ORDER.indexOf(me.rank)
  const nextRankIdx    = Math.min(currentRankIdx + 1, RANK_ORDER.length - 1)
  const nextRank       = RANK_ORDER[nextRankIdx]

  // Historical actuals (last 3 months, synthetic from member stats)
  const basePV    = me.pv   || 150
  const baseGV    = me.gv   || 1200
  const baseComm  = Math.round(baseGV * COMM_RATES[me.rank || 'Bronze'])
  const HISTORICAL = [
    { month: 'May 26', pv: Math.round(basePV * 0.82), gv: Math.round(baseGV * 0.78), commission: Math.round(baseComm * 0.76), recruits: 1 },
    { month: 'Jun 26', pv: Math.round(basePV * 0.91), gv: Math.round(baseGV * 0.89), commission: Math.round(baseComm * 0.88), recruits: 1 },
    { month: 'Jul 26', pv: basePV,                    gv: baseGV,                    commission: baseComm,                    recruits: 2 },
  ]

  // Default recruit rate from historical avg
  const defaultRecruits = recruitsPerMonth != null ? recruitsPerMonth : 2
  const SCENARIOS = {
    current:     { recruitMult: 1.0, pvMult: 1.03, label: 'Current Pace',   color: '#3b82f6' },
    accelerated: { recruitMult: 1.8, pvMult: 1.08, label: 'Accelerated',    color: '#c9a84c' },
  }

  const MONTH_NAMES = ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul']

  // Track running state per scenario for rank progression
  const state = {
    current:     { pv: basePV, gv: baseGV, recruits: me.recruits || 3, rank: me.rank || 'Bronze' },
    accelerated: { pv: basePV, gv: baseGV, recruits: me.recruits || 3, rank: me.rank || 'Bronze' },
  }

  const months = []

  // Include historical
  HISTORICAL.forEach(h => {
    months.push({ month: h.month, projected: false, current: h.commission, accelerated: h.commission, pv: h.pv, gv: h.gv })
  })

  let rankUpMonth = { current: null, accelerated: null }
  let nextRankReqs = RANK_REQS[nextRank] || RANK_REQS['Platinum']

  // Project forward
  for (let i = 0; i < horizon; i++) {
    const label = MONTH_NAMES[i % 12] + ' ' + (26 + Math.floor((7 + i) / 12))
    const row = { month: label, projected: true }

    Object.entries(SCENARIOS).forEach(([sc, cfg]) => {
      const newRecruits = Math.round(defaultRecruits * cfg.recruitMult)
      state[sc].recruits += newRecruits
      state[sc].pv       = Math.round(state[sc].pv * cfg.pvMult)
      state[sc].gv       = Math.round(state[sc].gv * cfg.pvMult * (1 + newRecruits * 0.05))

      // Check rank-up
      if (state[sc].rank !== 'Platinum') {
        const req = RANK_REQS[nextRank]
        if (
          state[sc].pv >= req.pv &&
          state[sc].gv * 0.45 >= req.leftGV &&
          state[sc].gv * 0.55 >= req.rightGV &&
          state[sc].recruits >= req.recruits
        ) {
          if (!rankUpMonth[sc]) rankUpMonth[sc] = label
          state[sc].rank = nextRank
        }
      }

      const commRate = COMM_RATES[state[sc].rank]
      row[sc] = Math.round(state[sc].gv * commRate)
    })

    months.push(row)
  }

  // KPIs
  const projMonths = months.filter(m => m.projected)
  const nextMonthEarnings = {
    current:     projMonths[0]?.current     || 0,
    accelerated: projMonths[0]?.accelerated || 0,
  }
  const sixMonthTotal = {
    current:     projMonths.reduce((s, m) => s + (m.current || 0), 0),
    accelerated: projMonths.reduce((s, m) => s + (m.accelerated || 0), 0),
  }

  // Rank progress toward next rank (current scenario, end of horizon)
  const endState = state.current
  const progressToNext = nextRank === 'Platinum' && me.rank === 'Platinum' ? null : {
    rank:     nextRank,
    pvPct:    Math.min(100, Math.round((endState.pv / nextRankReqs.pv) * 100)),
    gvPct:    Math.min(100, Math.round(((endState.gv * 0.45) / nextRankReqs.leftGV) * 100)),
    recPct:   Math.min(100, Math.round((endState.recruits / nextRankReqs.recruits) * 100)),
    pvNeed:   Math.max(0, nextRankReqs.pv - endState.pv),
    gvNeed:   Math.max(0, nextRankReqs.leftGV - Math.round(endState.gv * 0.45)),
    recNeed:  Math.max(0, nextRankReqs.recruits - endState.recruits),
    rankUpMonthCurrent:     rankUpMonth.current,
    rankUpMonthAccelerated: rankUpMonth.accelerated,
  }

  // Action recommendations
  const actions = []
  if (me.pv < 200)  actions.push({ icon: '📦', text: `Add ${200 - me.pv} PV of personal orders this month to reach Silver PV threshold` })
  if ((me.recruits || 3) < 5) actions.push({ icon: '👥', text: `Recruit ${5 - (me.recruits || 3)} more direct members to qualify for Silver rank` })
  actions.push({ icon: '🔗', text: 'Share your referral link on 3 social platforms to boost sign-up rate' })
  actions.push({ icon: '🎯', text: 'Re-engage 1–2 inactive downline members to increase group volume' })
  if (me.rank === 'Bronze' || me.rank === 'Unranked') {
    actions.push({ icon: '🛒', text: 'Set up an Autoship subscription to lock in consistent monthly PV' })
  }

  return {
    months,
    nextMonthEarnings,
    sixMonthTotal,
    progressToNext,
    currentRank: me.rank || 'Bronze',
    nextRank,
    currentPV:      basePV,
    currentGV:      baseGV,
    currentRecruits: me.recruits || 3,
    defaultRecruits,
    actions,
    scenarios: SCENARIOS,
  }
}

// ── Direct Messages ───────────────────────────────────────────────────────────

let _convState = null
let _msgState  = null

function initMsgState() {
  if (_convState) return
  const saved = localStorage.getItem('nv_conversations')
  const savedMsgs = localStorage.getItem('nv_direct_messages')
  _convState = saved     ? JSON.parse(saved)     : JSON.parse(JSON.stringify(CONVERSATIONS))
  _msgState  = savedMsgs ? JSON.parse(savedMsgs) : JSON.parse(JSON.stringify(DIRECT_MESSAGES))
}

function saveMsgState() {
  localStorage.setItem('nv_conversations', JSON.stringify(_convState))
  localStorage.setItem('nv_direct_messages', JSON.stringify(_msgState))
}

export async function getConversations(userId) {
  if (MOCK) {
    initMsgState()
    const convs = _convState
      .filter(c => c.participant_ids.includes(userId) || c.participant_ids.includes('admin'))
      .sort((a, b) => new Date(b.last_message_at) - new Date(a.last_message_at))
    return convs.map(c => ({
      ...c,
      unread_count: (c.unread_by && c.unread_by[userId]) || 0,
      partner: c.participants.find(p => p.id !== userId) || c.participants[0],
    }))
  }
  return request('GET', `/v1/mlm/messages/${userId}/conversations`)
}

export async function getConversation(conversationId, userId) {
  if (MOCK) {
    initMsgState()
    const conv = _convState.find(c => c.id === conversationId)
    const messages = (_msgState[conversationId] || []).sort(
      (a, b) => new Date(a.sent_at) - new Date(b.sent_at)
    )
    return { conv, messages }
  }
  return request('GET', `/v1/mlm/messages/${userId}/conversations/${conversationId}`)
}

export async function sendDirectMessage(conversationId, senderId, senderName, body) {
  if (MOCK) {
    initMsgState()
    const msg = {
      id:              `msg-${Date.now()}`,
      conversation_id: conversationId,
      sender_id:       senderId,
      sender_name:     senderName,
      body,
      sent_at:         new Date().toISOString(),
      read_by:         [senderId],
    }
    if (!_msgState[conversationId]) _msgState[conversationId] = []
    _msgState[conversationId].push(msg)
    const conv = _convState.find(c => c.id === conversationId)
    if (conv) {
      conv.last_message    = body.slice(0, 80)
      conv.last_message_at = msg.sent_at
      conv.participant_ids.forEach(pid => {
        if (pid !== senderId) {
          conv.unread_by = conv.unread_by || {}
          conv.unread_by[pid] = (conv.unread_by[pid] || 0) + 1
        }
      })
    }
    saveMsgState()
    return msg
  }
  return request('POST', `/v1/mlm/messages/${senderId}/conversations/${conversationId}/send`, { body })
}

export async function markConversationRead(conversationId, userId) {
  if (MOCK) {
    initMsgState()
    const conv = _convState.find(c => c.id === conversationId)
    if (conv && conv.unread_by) conv.unread_by[userId] = 0
    const msgs = _msgState[conversationId] || []
    msgs.forEach(m => { if (!m.read_by.includes(userId)) m.read_by.push(userId) })
    saveMsgState()
    return { ok: true }
  }
  return request('POST', `/v1/mlm/messages/${userId}/conversations/${conversationId}/read`)
}

export async function startConversation(userId, userName, partnerId, partnerName, partnerRole, subject, body) {
  if (MOCK) {
    initMsgState()
    const convId = `conv-${Date.now()}`
    const newConv = {
      id:   convId,
      participant_ids: [userId, partnerId],
      participants: [
        { id: userId,    name: userName,    role: 'member',     avatar: userName.split(' ').map(w => w[0]).join('').slice(0,2) },
        { id: partnerId, name: partnerName, role: partnerRole,  avatar: partnerName.split(' ').map(w => w[0]).join('').slice(0,2) },
      ],
      subject,
      last_message:    body.slice(0, 80),
      last_message_at: new Date().toISOString(),
      unread_by:       { [partnerId]: 1 },
      created_at:      new Date().toISOString(),
    }
    _convState.unshift(newConv)
    _msgState[convId] = [{
      id:              `msg-${Date.now()}`,
      conversation_id: convId,
      sender_id:       userId,
      sender_name:     userName,
      body,
      sent_at:         new Date().toISOString(),
      read_by:         [userId],
    }]
    saveMsgState()
    return newConv
  }
  return request('POST', `/v1/mlm/messages/${userId}/conversations`, { partner_id: partnerId, subject, body })
}

// Admin messaging
export async function getAdminConversations(search = '') {
  if (MOCK) {
    initMsgState()
    let convs = JSON.parse(JSON.stringify(_convState))
      .sort((a, b) => new Date(b.last_message_at) - new Date(a.last_message_at))
    if (search) {
      const q = search.toLowerCase()
      convs = convs.filter(c =>
        c.participants.some(p => p.name.toLowerCase().includes(q)) ||
        c.subject.toLowerCase().includes(q)
      )
    }
    return convs.map(c => ({
      ...c,
      unread_count: Object.values(c.unread_by || {}).reduce((s, v) => s + v, 0),
      member: c.participants.find(p => p.role === 'member') || c.participants[0],
    }))
  }
  return request('GET', '/v1/mlm/admin/messages')
}

export async function sendAdminMessage(conversationId, body) {
  return sendDirectMessage(conversationId, 'admin', 'Nordic Vitals', body)
}

export async function startAdminConversation(memberId, memberName, subject, body) {
  return startConversation('admin', 'Nordic Vitals', memberId, memberName, 'member', subject, body)
}

// ── Social Activity Feed ──────────────────────────────────────────────────────

const SOCIAL_STORAGE_KEY = 'nv_social_reactions'

function loadReactions() {
  try { return JSON.parse(localStorage.getItem(SOCIAL_STORAGE_KEY) || '{}') } catch { return {} }
}

function saveReactions(data) {
  localStorage.setItem(SOCIAL_STORAGE_KEY, JSON.stringify(data))
}

export async function getSocialFeed({ typeFilter = 'all', page = 1, pageSize = 10 } = {}) {
  if (MOCK) {
    const myReactions = loadReactions()
    let events = JSON.parse(JSON.stringify(SOCIAL_EVENTS))
    if (typeFilter !== 'all') events = events.filter(e => e.type === typeFilter)
    const total = events.length
    const slice = events.slice((page - 1) * pageSize, page * pageSize)
    return {
      events: slice.map(e => ({
        ...e,
        reactions: { ...e.reactions, ...(myReactions[e.id] ? {} : {}) },
        myReaction: myReactions[e.id] || null,
      })),
      total,
      hasMore: page * pageSize < total,
    }
  }
  const params = new URLSearchParams({ type: typeFilter, page, page_size: pageSize })
  return request('GET', `/v1/mlm/social/feed?${params}`)
}

export async function reactToSocialEvent(eventId, emoji) {
  if (MOCK) {
    const myReactions = loadReactions()
    const prev = myReactions[eventId]
    if (prev === emoji) {
      delete myReactions[eventId]
    } else {
      myReactions[eventId] = emoji
    }
    saveReactions(myReactions)
    return { eventId, myReaction: myReactions[eventId] || null }
  }
  return request('POST', `/v1/mlm/social/feed/${eventId}/react`, { emoji })
}

// ── System Status ──────────────────────────────────────────────────────────────

const _systemStatusState = {
  data: JSON.parse(JSON.stringify(SYSTEM_STATUS)),
  incidents: JSON.parse(JSON.stringify(INCIDENT_LOG)),
}

export async function getSystemStatus() {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 300))
    return JSON.parse(JSON.stringify(_systemStatusState.data))
  }
  return request('GET', '/v1/mlm/admin/system-status')
}

export async function getIncidentLog() {
  if (MOCK) {
    return JSON.parse(JSON.stringify(_systemStatusState.incidents))
  }
  return request('GET', '/v1/mlm/admin/incidents')
}

export async function resolveIncident(incidentId) {
  if (MOCK) {
    const inc = _systemStatusState.incidents.find(i => i.id === incidentId)
    if (inc) {
      inc.status = 'resolved'
      inc.resolved_at = new Date().toISOString().slice(0, 16).replace('T', ' ') + ' UTC'
    }
    return { ok: true }
  }
  return request('POST', `/v1/mlm/admin/incidents/${incidentId}/resolve`, {})
}

export async function createMaintenanceWindow(form) {
  if (MOCK) {
    const window = {
      id: `mw-${Date.now()}`,
      title: form.title,
      component: form.component,
      starts_at: form.starts_at,
      ends_at: form.ends_at,
      description: form.description || '',
    }
    _systemStatusState.data.maintenance_windows.push(window)
    return window
  }
  return request('POST', '/v1/mlm/admin/maintenance-windows', form)
}

// ── Achievement Certificates ──────────────────────────────────────────────────

export async function getCertificates(userId) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 250))
    return CERTIFICATES.map(c => ({ ...c, recipient_name: userId ? c.recipient_name : c.recipient_name }))
  }
  return request('GET', `/v1/mlm/certificates/${userId}`)
}

// ── Retail Customers ──────────────────────────────────────────────────────────

let _retailCustomers = RETAIL_CUSTOMERS.map(c => ({ ...c, notes: [] }))

export async function getRetailCustomers({ search = '', tag = 'all' } = {}) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 280))
    let list = _retailCustomers
    if (tag !== 'all') list = list.filter(c => c.tags.includes(tag))
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(c => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.id.toLowerCase().includes(q))
    }
    return list
  }
  return request('GET', '/v1/mlm/admin/retail-customers', { search, tag })
}

export async function getRetailCustomerDetail(customerId) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 200))
    const customer = _retailCustomers.find(c => c.id === customerId)
    if (!customer) throw new Error('Customer not found')
    const orders = RETAIL_CUSTOMER_ORDERS[customerId] || []
    return { ...customer, orders }
  }
  return request('GET', `/v1/mlm/admin/retail-customers/${customerId}`)
}

export async function addRetailCustomerNote(customerId, note) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 180))
    const customer = _retailCustomers.find(c => c.id === customerId)
    if (!customer) throw new Error('Customer not found')
    const entry = { id: `note-${Date.now()}`, text: note, created_at: new Date().toISOString(), author: 'Admin' }
    customer.notes = [entry, ...(customer.notes || [])]
    return entry
  }
  return request('POST', `/v1/mlm/admin/retail-customers/${customerId}/notes`, { note })
}

export async function convertCustomerToMember(customerId) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 350))
    const customer = _retailCustomers.find(c => c.id === customerId)
    if (!customer) throw new Error('Customer not found')
    customer.tags = [...new Set([...customer.tags, 'converted'])]
    const newMemberId = `NV-${Math.floor(10000 + Math.random() * 90000)}`
    return { ok: true, member_id: newMemberId, email: customer.email }
  }
  return request('POST', `/v1/mlm/admin/retail-customers/${customerId}/convert`, {})
}

export async function sendCustomerEmail(customerId, { subject, body }) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 300))
    return { ok: true, sent_at: new Date().toISOString() }
  }
  return request('POST', `/v1/mlm/admin/retail-customers/${customerId}/email`, { subject, body })
}

// ── Payment Methods (saved withdrawal accounts + payment cards) ───────────────
const PM_KEY = 'nv_payment_methods'

function loadPM(userId) {
  try {
    const stored = localStorage.getItem(`${PM_KEY}_${userId}`)
    if (stored) return JSON.parse(stored)
  } catch {}
  return { withdrawalAccounts: [...PAYMENT_METHODS.withdrawalAccounts], paymentCards: [...PAYMENT_METHODS.paymentCards] }
}

function savePM(userId, data) {
  try { localStorage.setItem(`${PM_KEY}_${userId}`, JSON.stringify(data)) } catch {}
  return data
}

export async function getPaymentMethods(userId) {
  if (MOCK) return loadPM(userId)
  return request('GET', `/v1/mlm/payment-methods/${userId}`)
}

export async function addPaymentMethod(userId, { tab, ...fields }) {
  if (MOCK) {
    const data = loadPM(userId)
    const listKey = tab === 'withdrawal' ? 'withdrawalAccounts' : 'paymentCards'
    const id = `${tab === 'withdrawal' ? 'wa' : 'pc'}-${Date.now()}`
    const list = data[listKey]
    const isDefault = list.length === 0
    list.push({ ...fields, id, isDefault, addedAt: new Date().toISOString().slice(0, 10) })
    return savePM(userId, data)
  }
  return request('POST', `/v1/mlm/payment-methods/${userId}`, { tab, ...fields })
}

export async function updatePaymentMethod(userId, methodId, { tab, ...fields }) {
  if (MOCK) {
    const data = loadPM(userId)
    const listKey = tab === 'withdrawal' ? 'withdrawalAccounts' : 'paymentCards'
    data[listKey] = data[listKey].map(m => m.id === methodId ? { ...m, ...fields, id: methodId } : m)
    return savePM(userId, data)
  }
  return request('PATCH', `/v1/mlm/payment-methods/${userId}/${methodId}`, { tab, ...fields })
}

export async function deletePaymentMethod(userId, methodId, tab) {
  if (MOCK) {
    const data = loadPM(userId)
    const listKey = tab === 'withdrawal' ? 'withdrawalAccounts' : 'paymentCards'
    const list = data[listKey].filter(m => m.id !== methodId)
    if (list.length > 0 && !list.some(m => m.isDefault)) list[0] = { ...list[0], isDefault: true }
    data[listKey] = list
    return savePM(userId, data)
  }
  return request('DELETE', `/v1/mlm/payment-methods/${userId}/${methodId}?tab=${tab}`)
}

export async function setDefaultPaymentMethod(userId, methodId, tab) {
  if (MOCK) {
    const data = loadPM(userId)
    const listKey = tab === 'withdrawal' ? 'withdrawalAccounts' : 'paymentCards'
    data[listKey] = data[listKey].map(m => ({ ...m, isDefault: m.id === methodId }))
    return savePM(userId, data)
  }
  return request('POST', `/v1/mlm/payment-methods/${userId}/${methodId}/set-default`, { tab })
}

// ── Fast Start Bonus ──────────────────────────────────────────────────────────
const FS_KEY = 'nv_fast_start'

function loadFS(userId) {
  try {
    const stored = localStorage.getItem(`${FS_KEY}_${userId}`)
    if (stored) return JSON.parse(stored)
  } catch {}
  return JSON.parse(JSON.stringify(FAST_START_PROGRESS))
}

function saveFS(userId, data) {
  try { localStorage.setItem(`${FS_KEY}_${userId}`, JSON.stringify(data)) } catch {}
  return data
}

export async function getFastStartProgress(userId) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 200))
    return { tiers: FAST_START_TIERS, progress: loadFS(userId) }
  }
  return request('GET', `/v1/mlm/fast-start/${userId}`)
}

export async function claimFastStartBonus(userId, tierId) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 400))
    const data = loadFS(userId)
    data.tiers = data.tiers.map(t =>
      t.tierId === tierId ? { ...t, status: 'claimed', claimedAt: new Date().toISOString().slice(0, 10) } : t
    )
    saveFS(userId, data)
    const tier = FAST_START_TIERS.find(t => t.id === tierId)
    return { ok: true, bonusMlmt: tier?.bonusMlmt ?? 0 }
  }
  return request('POST', `/v1/mlm/fast-start/${userId}/claim`, { tierId })
}

export async function getFastStartLeaderboard() {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 300))
    return FAST_START_LEADERBOARD
  }
  return request('GET', '/v1/mlm/fast-start/leaderboard')
}

// ── Commission Appeals ────────────────────────────────────────────────────────
const APPEALS_KEY = 'nv_commission_appeals'

function loadAppeals() {
  try {
    const stored = localStorage.getItem(APPEALS_KEY)
    if (stored) return JSON.parse(stored)
  } catch {}
  return JSON.parse(JSON.stringify(COMMISSION_APPEALS))
}

function saveAppeals(data) {
  try { localStorage.setItem(APPEALS_KEY, JSON.stringify(data)) } catch {}
  return data
}

export async function getAppealQueue(filters = {}) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 300))
    let appeals = loadAppeals()
    if (filters.status && filters.status !== 'all') {
      appeals = appeals.filter(a => a.status === filters.status)
    }
    if (filters.search) {
      const q = filters.search.toLowerCase()
      appeals = appeals.filter(a =>
        a.memberName.toLowerCase().includes(q) ||
        a.memberId.toLowerCase().includes(q) ||
        a.commissionRunId.toLowerCase().includes(q) ||
        a.id.toLowerCase().includes(q)
      )
    }
    return appeals.sort((a, b) => new Date(b.filedAt) - new Date(a.filedAt))
  }
  const params = new URLSearchParams(filters).toString()
  return request('GET', `/v1/mlm/admin/appeals?${params}`)
}

export async function getMyAppeals(userId) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 250))
    const appeals = loadAppeals()
    return appeals
      .filter(a => a.memberId === 'NV-10042')
      .sort((a, b) => new Date(b.filedAt) - new Date(a.filedAt))
  }
  return request('GET', `/v1/mlm/appeals/${userId}`)
}

export async function submitAppeal(userId, data) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 500))
    const appeals = loadAppeals()
    const newId = `APP-${String(100 + appeals.length).padStart(3, '0')}`
    const newAppeal = {
      id: newId,
      memberId: 'NV-10042',
      memberName: 'Lars Eriksen',
      memberEmail: 'lars.eriksen@example.no',
      commissionRunId: data.commissionRunId,
      commissionRunDate: data.commissionRunDate || new Date().toISOString().slice(0, 10),
      category: data.category,
      disputedAmount: Number(data.disputedAmount) || 0,
      expectedAmount: Number(data.expectedAmount) || 0,
      explanation: data.explanation,
      filedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'open',
      priority: 'medium',
      notes: [{ author: 'Lars Eriksen', role: 'member', text: data.explanation, ts: new Date().toISOString() }],
      resolution: null,
    }
    appeals.unshift(newAppeal)
    saveAppeals(appeals)
    return newAppeal
  }
  return request('POST', `/v1/mlm/appeals/${userId}`, data)
}

export async function addAppealNote(appealId, note) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 300))
    const appeals = loadAppeals()
    const idx = appeals.findIndex(a => a.id === appealId)
    if (idx === -1) throw new Error('Appeal not found')
    appeals[idx].notes.push({ author: 'Admin', role: 'admin', text: note, ts: new Date().toISOString() })
    appeals[idx].updatedAt = new Date().toISOString()
    if (appeals[idx].status === 'open') appeals[idx].status = 'under_review'
    saveAppeals(appeals)
    return appeals[idx]
  }
  return request('POST', `/v1/mlm/admin/appeals/${appealId}/note`, { note })
}

export async function resolveAppeal(appealId, decision) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 400))
    const appeals = loadAppeals()
    const idx = appeals.findIndex(a => a.id === appealId)
    if (idx === -1) throw new Error('Appeal not found')
    const statusMap = { upheld: 'resolved_upheld', adjusted: 'resolved_adjusted', rejected: 'resolved_rejected' }
    appeals[idx].status = statusMap[decision.verdict] || 'resolved_upheld'
    appeals[idx].resolution = {
      decision: decision.verdict,
      adjustedAmount: decision.adjustedAmount || null,
      correctionAmount: decision.correctionAmount || 0,
      resolvedAt: new Date().toISOString(),
      resolvedBy: 'Admin',
      note: decision.note,
    }
    appeals[idx].notes.push({
      author: 'Admin',
      role: 'admin',
      text: `Appeal resolved (${decision.verdict}): ${decision.note}`,
      ts: new Date().toISOString(),
    })
    appeals[idx].updatedAt = new Date().toISOString()
    saveAppeals(appeals)
    return appeals[idx]
  }
  return request('POST', `/v1/mlm/admin/appeals/${appealId}/resolve`, decision)
}

// ── Returns & Refunds ────────────────────────────────────────────────────────

const RETURNS_KEY = 'nv_return_requests'

function loadReturns() {
  try {
    const stored = JSON.parse(localStorage.getItem(RETURNS_KEY) || 'null')
    if (stored) return stored
  } catch {}
  return [...RETURN_REQUESTS]
}

function saveReturns(list) {
  localStorage.setItem(RETURNS_KEY, JSON.stringify(list))
}

export async function getAdminReturns({ status, search } = {}) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 300))
    let items = loadReturns()
    if (status && status !== 'all') items = items.filter(r => r.status === status)
    if (search) {
      const q = search.toLowerCase()
      items = items.filter(r =>
        r.memberName.toLowerCase().includes(q) ||
        r.orderId.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q)
      )
    }
    return items
  }
  const params = new URLSearchParams()
  if (status && status !== 'all') params.set('status', status)
  if (search) params.set('search', search)
  return request('GET', `/v1/mlm/admin/returns?${params}`)
}

export async function getMyReturns(userId) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 200))
    const all = loadReturns()
    return all.filter(r => r.memberId === userId)
  }
  return request('GET', `/v1/mlm/returns/${userId}`)
}

export async function submitReturn(userId, data) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 400))
    const all = loadReturns()
    const id = `RET-${String(all.length + 1).padStart(4, '0')}`
    const newReturn = {
      id,
      orderId: data.orderId,
      memberId: userId,
      memberName: data.memberName || 'Member',
      memberEmail: data.memberEmail || '',
      items: data.items || [],
      orderTotal: data.orderTotal || 0,
      refundAmount: null,
      reason: data.reason,
      description: data.description,
      status: 'pending',
      filedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      pvDeducted: null,
      adminNote: '',
      resolvedAt: null,
      resolvedBy: null,
    }
    all.unshift(newReturn)
    saveReturns(all)
    return newReturn
  }
  return request('POST', `/v1/mlm/returns/${userId}`, data)
}

export async function cancelReturn(returnId) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 300))
    const all = loadReturns()
    const idx = all.findIndex(r => r.id === returnId)
    if (idx === -1) throw new Error('Return not found')
    all[idx].status = 'cancelled'
    all[idx].updatedAt = new Date().toISOString()
    saveReturns(all)
    return all[idx]
  }
  return request('POST', `/v1/mlm/returns/${returnId}/cancel`)
}

export async function reviewReturn(returnId, { action, adminNote, refundAmount }) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 400))
    const all = loadReturns()
    const idx = all.findIndex(r => r.id === returnId)
    if (idx === -1) throw new Error('Return not found')
    const statusMap = { approve: 'approved', reject: 'rejected', review: 'under_review' }
    all[idx].status = statusMap[action] || action
    all[idx].adminNote = adminNote || ''
    if (action === 'approve') {
      all[idx].refundAmount = refundAmount ?? all[idx].orderTotal
      all[idx].resolvedAt = new Date().toISOString()
      all[idx].resolvedBy = 'Admin'
    } else if (action === 'reject') {
      all[idx].refundAmount = 0
      all[idx].resolvedAt = new Date().toISOString()
      all[idx].resolvedBy = 'Admin'
    }
    all[idx].updatedAt = new Date().toISOString()
    saveReturns(all)
    return all[idx]
  }
  return request('POST', `/v1/mlm/admin/returns/${returnId}/review`, { action, adminNote, refundAmount })
}

// ── GDPR Data Subject Requests ───────────────────────────────────────────────

const GDPR_KEY = 'nv_gdpr_requests'
function loadGdpr() {
  try { return JSON.parse(localStorage.getItem(GDPR_KEY)) || GDPR_REQUESTS } catch { return GDPR_REQUESTS }
}
function saveGdpr(data) {
  try { localStorage.setItem(GDPR_KEY, JSON.stringify(data)) } catch {}
}

export async function getGdprRequests({ status, type } = {}) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 220))
    let all = loadGdpr()
    if (status && status !== 'all') all = all.filter(r => r.status === status)
    if (type && type !== 'all') all = all.filter(r => r.type === type)
    return all
  }
  const params = new URLSearchParams()
  if (status && status !== 'all') params.set('status', status)
  if (type && type !== 'all') params.set('type', type)
  return request('GET', `/v1/mlm/admin/gdpr?${params}`)
}

export async function getGdprRequestDetail(requestId) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 150))
    const all = loadGdpr()
    return all.find(r => r.id === requestId) || null
  }
  return request('GET', `/v1/mlm/admin/gdpr/${requestId}`)
}

export async function processGdprRequest(requestId, { action, adminNote, denyReason, extendedDeadline }) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 400))
    const all = loadGdpr()
    const idx = all.findIndex(r => r.id === requestId)
    if (idx === -1) throw new Error('Request not found')
    const statusMap = {
      fulfill: 'fulfilled',
      deny: 'denied',
      start_processing: 'processing',
      extend: all[idx].status,
    }
    const now = new Date().toISOString()
    const prev = all[idx]
    const entry = {
      ts: now,
      actor: 'Admin',
      action: action === 'fulfill'
        ? 'Request marked fulfilled.'
        : action === 'deny'
          ? `Request denied. Reason: ${denyReason || 'not specified'}.`
          : action === 'start_processing'
            ? 'Status updated to Processing.'
            : `Deadline extended to ${extendedDeadline}.`,
    }
    all[idx] = {
      ...prev,
      status: statusMap[action] || prev.status,
      adminNote: adminNote ?? prev.adminNote,
      processedAt: action === 'fulfill' || action === 'deny' ? now : prev.processedAt,
      processedBy: action === 'fulfill' || action === 'deny' ? 'Admin' : prev.processedBy,
      denyReason: action === 'deny' ? (denyReason || 'not_specified') : prev.denyReason,
      extendedDeadline: action === 'extend' ? extendedDeadline : prev.extendedDeadline,
      auditTrail: [...prev.auditTrail, entry],
    }
    saveGdpr(all)
    return all[idx]
  }
  return request('POST', `/v1/mlm/admin/gdpr/${requestId}/process`, { action, adminNote, denyReason, extendedDeadline })
}

export async function generateDataExport(memberId) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 800))
    return {
      downloadUrl: `#mock-export-${memberId}-${Date.now()}`,
      generatedAt: new Date().toISOString(),
      sizeKb: Math.floor(Math.random() * 200) + 50,
      fileName: `nordic-vitals-data-${memberId}-${new Date().toISOString().slice(0, 10)}.zip`,
    }
  }
  return request('POST', `/v1/mlm/admin/gdpr/export`, { memberId })
}

export async function submitMemberGdprRequest(userId, { type, description }) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 400))
    const all = loadGdpr()
    const now = new Date().toISOString()
    const deadline = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    const newReq = {
      id: `GDPR-${String(all.length + 1).padStart(4, '0')}`,
      type,
      memberName: 'Member',
      memberId: userId,
      memberEmail: '',
      submittedAt: now,
      deadline,
      status: 'pending',
      description,
      adminNote: '',
      processedAt: null,
      processedBy: null,
      denyReason: null,
      extendedDeadline: null,
      auditTrail: [
        { ts: now, actor: 'member', action: 'Request submitted via Data Privacy Centre.' },
      ],
    }
    all.unshift(newReq)
    saveGdpr(all)
    return newReq
  }
  return request('POST', `/v1/mlm/gdpr/${userId}`, { type, description })
}

// ─── Blog API ───────────────────────────────────────────────────────────────

const BLOG_KEY = 'nv_blog_posts'
function loadBlog() {
  try { return JSON.parse(localStorage.getItem(BLOG_KEY)) || BLOG_POSTS } catch { return [...BLOG_POSTS] }
}
function saveBlog(posts) { try { localStorage.setItem(BLOG_KEY, JSON.stringify(posts)) } catch {} }

export async function getBlogPosts({ category, search, limit } = {}) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 200))
    let posts = loadBlog().filter(p => p.status === 'published')
    if (category && category !== 'All') posts = posts.filter(p => p.category === category)
    if (search) {
      const q = search.toLowerCase()
      posts = posts.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.excerpt.toLowerCase().includes(q) ||
        p.tags.some(t => t.toLowerCase().includes(q))
      )
    }
    posts = posts.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
    if (limit) posts = posts.slice(0, limit)
    return posts
  }
  const params = new URLSearchParams()
  if (category && category !== 'All') params.set('category', category)
  if (search) params.set('search', search)
  if (limit) params.set('limit', limit)
  return request('GET', `/v1/blog?${params}`)
}

export async function getBlogPost(slug) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 150))
    const post = loadBlog().find(p => p.slug === slug && p.status === 'published')
    if (!post) throw new Error('Post not found')
    return post
  }
  return request('GET', `/v1/blog/${slug}`)
}

export async function getAdminBlogPosts() {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 200))
    return loadBlog().sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
  }
  return request('GET', '/v1/admin/blog')
}

export async function createBlogPost(data) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 300))
    const all = loadBlog()
    const newPost = {
      ...data,
      id: `bp-${String(all.length + 1).padStart(3, '0')}`,
      publishedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      readMinutes: Math.max(1, Math.ceil(data.body.split(' ').length / 200)),
    }
    all.unshift(newPost)
    saveBlog(all)
    return newPost
  }
  return request('POST', '/v1/admin/blog', data)
}

export async function updateBlogPost(id, data) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 250))
    const all = loadBlog()
    const idx = all.findIndex(p => p.id === id)
    if (idx === -1) throw new Error('Post not found')
    all[idx] = { ...all[idx], ...data, updatedAt: new Date().toISOString(), readMinutes: Math.max(1, Math.ceil((data.body || all[idx].body).split(' ').length / 200)) }
    saveBlog(all)
    return all[idx]
  }
  return request('PUT', `/v1/admin/blog/${id}`, data)
}

export async function deleteBlogPost(id) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 200))
    const all = loadBlog().filter(p => p.id !== id)
    saveBlog(all)
    return { ok: true }
  }
  return request('DELETE', `/v1/admin/blog/${id}`)
}

export async function toggleBlogPostStatus(id) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 200))
    const all = loadBlog()
    const idx = all.findIndex(p => p.id === id)
    if (idx === -1) throw new Error('Post not found')
    all[idx] = { ...all[idx], status: all[idx].status === 'published' ? 'draft' : 'published', updatedAt: new Date().toISOString() }
    saveBlog(all)
    return all[idx]
  }
  return request('PATCH', `/v1/admin/blog/${id}/toggle`)
}

// ─── Newsletter Subscribers ───────────────────────────────────────────────────

const NL_KEY = 'nv_newsletter_subscribers'
function loadSubs() {
  try { return JSON.parse(localStorage.getItem(NL_KEY)) || [...NEWSLETTER_SUBSCRIBERS] } catch { return [...NEWSLETTER_SUBSCRIBERS] }
}
function saveSubs(data) { try { localStorage.setItem(NL_KEY, JSON.stringify(data)) } catch {} }

export async function subscribeNewsletter({ email, name = '', source = 'landing', segments = ['blog'], consent = true }) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 350))
    const all = loadSubs()
    const existing = all.find(s => s.email.toLowerCase() === email.toLowerCase())
    if (existing) {
      if (existing.status === 'unsubscribed') {
        existing.status = 'active'
        existing.unsubscribed_at = null
        existing.consented_at = new Date().toISOString()
        saveSubs(all)
        return { ok: true, resubscribed: true }
      }
      return { ok: true, already: true }
    }
    const next = {
      id: `ns-${String(all.length + 1).padStart(3, '0')}`,
      email, name, source, status: 'active', segments,
      consented_at: consent ? new Date().toISOString() : null,
      unsubscribed_at: null, opens: 0, clicks: 0,
    }
    all.push(next)
    saveSubs(all)
    return { ok: true, resubscribed: false, already: false }
  }
  return request('POST', '/v1/newsletter/subscribe', { email, name, source, segments, consent })
}

export async function getNewsletterSubscribers({ status, source, segment, search, page = 1, limit = 20 } = {}) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 200))
    let rows = loadSubs()
    if (status && status !== 'all') rows = rows.filter(s => s.status === status)
    if (source && source !== 'all') rows = rows.filter(s => s.source === source)
    if (segment && segment !== 'all') rows = rows.filter(s => s.segments.includes(segment))
    if (search) {
      const q = search.toLowerCase()
      rows = rows.filter(s => s.email.toLowerCase().includes(q) || (s.name || '').toLowerCase().includes(q))
    }
    rows = [...rows].sort((a, b) => new Date(b.consented_at) - new Date(a.consented_at))
    const total = rows.length
    const items = rows.slice((page - 1) * limit, page * limit)
    const allSubs = loadSubs()
    const active = allSubs.filter(s => s.status === 'active').length
    const thisMonth = allSubs.filter(s => {
      const d = new Date(s.consented_at)
      const now = new Date()
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
    }).length
    return { items, total, page, pages: Math.ceil(total / limit), stats: { total: allSubs.length, active, unsubscribed: allSubs.length - active, thisMonth } }
  }
  return request('GET', '/v1/newsletter/subscribers', { status, source, segment, search, page, limit })
}

export async function updateSubscriberStatus(id, status) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 200))
    const all = loadSubs()
    const idx = all.findIndex(s => s.id === id)
    if (idx === -1) throw new Error('Subscriber not found')
    all[idx].status = status
    if (status === 'unsubscribed') all[idx].unsubscribed_at = new Date().toISOString()
    else all[idx].unsubscribed_at = null
    saveSubs(all)
    return all[idx]
  }
  return request('PATCH', `/v1/newsletter/subscribers/${id}`, { status })
}

export async function deleteNewsletterSubscriber(id) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 200))
    const all = loadSubs().filter(s => s.id !== id)
    saveSubs(all)
    return { ok: true }
  }
  return request('DELETE', `/v1/newsletter/subscribers/${id}`)
}

export async function unsubscribeNewsletter(token) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 300))
    const all = loadSubs()
    const decoded = atob(token || '')
    const idx = all.findIndex(s => s.email === decoded)
    if (idx === -1) return { ok: false, error: 'invalid_token' }
    all[idx].status = 'unsubscribed'
    all[idx].unsubscribed_at = new Date().toISOString()
    saveSubs(all)
    return { ok: true, email: all[idx].email }
  }
  return request('POST', `/v1/newsletter/unsubscribe`, { token })
}

export async function addNewsletterSubscriberManual({ email, name, source = 'manual', segments = ['blog'] }) {
  return subscribeNewsletter({ email, name, source, segments, consent: true })
}

// ── Smart Segments ─────────────────────────────────────────────────────────────
const SEGMENTS_KEY = 'nv_member_segments'
function loadSegments() {
  try { const s = localStorage.getItem(SEGMENTS_KEY); return s ? JSON.parse(s) : [...MEMBER_SEGMENTS] } catch { return [...MEMBER_SEGMENTS] }
}
function saveSegments(segs) {
  try { localStorage.setItem(SEGMENTS_KEY, JSON.stringify(segs)) } catch {}
}

function applySegmentRules(members, rules, logic) {
  return members.filter(m => {
    const results = rules.map(rule => {
      const mv = m[rule.field]
      switch (rule.op) {
        case 'equals':   return String(mv).toLowerCase() === String(rule.value).toLowerCase()
        case 'not_equals': return String(mv).toLowerCase() !== String(rule.value).toLowerCase()
        case 'gte':      return Number(mv) >= Number(rule.value)
        case 'lte':      return Number(mv) <= Number(rule.value)
        case 'in':       return Array.isArray(rule.value) ? rule.value.map(v => v.toLowerCase()).includes(String(mv).toLowerCase()) : false
        case 'not_in':   return Array.isArray(rule.value) ? !rule.value.map(v => v.toLowerCase()).includes(String(mv).toLowerCase()) : true
        case 'joined_after':  return new Date(m.joined) >= new Date(rule.value)
        case 'joined_before': return new Date(m.joined) <= new Date(rule.value)
        default: return true
      }
    })
    return logic === 'ANY' ? results.some(Boolean) : results.every(Boolean)
  })
}

export async function getSegments() {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 300))
    return loadSegments()
  }
  return request('GET', '/v1/mlm/admin/segments')
}

export async function previewSegment({ rules, logic }) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 200))
    const members = ADMIN_MEMBERS
    const matched = rules.length === 0 ? members : applySegmentRules(members, rules, logic || 'ALL')
    return { memberCount: matched.length, members: matched.slice(0, 5) }
  }
  return request('POST', '/v1/mlm/admin/segments/preview', { rules, logic })
}

export async function createSegment({ name, description, rules, logic }) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 400))
    const segs = loadSegments()
    const matched = rules.length === 0 ? ADMIN_MEMBERS : applySegmentRules(ADMIN_MEMBERS, rules, logic || 'ALL')
    const seg = {
      id: `seg-${Date.now()}`,
      name,
      description: description || '',
      rules,
      logic: logic || 'ALL',
      memberCount: matched.length,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    segs.unshift(seg)
    saveSegments(segs)
    return seg
  }
  return request('POST', '/v1/mlm/admin/segments', { name, description, rules, logic })
}

export async function updateSegment(id, updates) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 400))
    const segs = loadSegments()
    const idx = segs.findIndex(s => s.id === id)
    if (idx === -1) throw new Error('Segment not found')
    const rules = updates.rules || segs[idx].rules
    const logic = updates.logic || segs[idx].logic
    const matched = rules.length === 0 ? ADMIN_MEMBERS : applySegmentRules(ADMIN_MEMBERS, rules, logic)
    segs[idx] = { ...segs[idx], ...updates, memberCount: matched.length, updatedAt: new Date().toISOString() }
    saveSegments(segs)
    return segs[idx]
  }
  return request('PUT', `/v1/mlm/admin/segments/${id}`, updates)
}

export async function deleteSegment(id) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 300))
    const segs = loadSegments().filter(s => s.id !== id)
    saveSegments(segs)
    return { ok: true }
  }
  return request('DELETE', `/v1/mlm/admin/segments/${id}`)
}

export async function getSegmentMembers(id) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 300))
    const segs = loadSegments()
    const seg = segs.find(s => s.id === id)
    if (!seg) throw new Error('Segment not found')
    const matched = seg.rules.length === 0 ? ADMIN_MEMBERS : applySegmentRules(ADMIN_MEMBERS, seg.rules, seg.logic)
    return matched
  }
  return request('GET', `/v1/mlm/admin/segments/${id}/members`)
}

// ─── Shipping Zones ──────────────────────────────────────────────────────────
function loadShippingZones() {
  const stored = localStorage.getItem('nv_shipping_zones')
  return stored ? JSON.parse(stored) : SHIPPING_ZONES.map(z => ({ ...z }))
}
function saveShippingZones(zones) {
  localStorage.setItem('nv_shipping_zones', JSON.stringify(zones))
}

export async function getShippingZones() {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 250))
    return loadShippingZones()
  }
  return request('GET', '/v1/mlm/admin/shipping-zones')
}

export async function createShippingZone(data) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 300))
    const zones = loadShippingZones()
    const zone = { ...data, id: `zone-${Date.now()}` }
    saveShippingZones([...zones, zone])
    return zone
  }
  return request('POST', '/v1/mlm/admin/shipping-zones', data)
}

export async function updateShippingZone(id, data) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 300))
    const zones = loadShippingZones()
    const updated = zones.map(z => z.id === id ? { ...z, ...data } : z)
    saveShippingZones(updated)
    return updated.find(z => z.id === id)
  }
  return request('PUT', `/v1/mlm/admin/shipping-zones/${id}`, data)
}

export async function deleteShippingZone(id) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 300))
    saveShippingZones(loadShippingZones().filter(z => z.id !== id))
    return { ok: true }
  }
  return request('DELETE', `/v1/mlm/admin/shipping-zones/${id}`)
}

export function getShippingRateForCountry(country, cartTotal, zones) {
  const zone = (zones || []).find(z => z.active && z.countries.includes(country))
  if (!zone) {
    return { rate: 0, free: true, carrier: '', estimatedDays: '', zoneName: '' }
  }
  const free = cartTotal >= zone.freeOver
  return {
    rate: free ? 0 : zone.rate,
    free,
    carrier: zone.carrier,
    estimatedDays: zone.estimatedDays,
    zoneName: zone.name,
    freeOver: zone.freeOver,
  }
}

// ── Tax / VAT Configuration ──────────────────────────────────────────────────
const TAX_CONFIG_KEY = 'nv_tax_config'

const DEFAULT_TAX_CONFIG = {
  enabled: true,
  pricesIncludeTax: true,
  mvaRegistrationNumber: 'NO 987 654 321 MVA',
  defaultRate: 25,
  productCategoryRates: [
    { id: 'supplements', label: 'Nutritional Supplements & Health Products', rate: 25, isDefault: true },
    { id: 'food',        label: 'Food & Beverages',                          rate: 15 },
    { id: 'transport',   label: 'Transport & Freight Services',              rate: 12 },
    { id: 'exempt',      label: 'Exempt (Financial services, education)',    rate: 0  },
  ],
  countryOverrides: [
    { id: 'co-001', country: 'United Kingdom',  rate: 20, enabled: true,  note: 'Post-Brexit UK VAT' },
    { id: 'co-002', country: 'Germany',         rate: 19, enabled: true,  note: 'German MwSt'        },
    { id: 'co-003', country: 'Sweden',          rate: 25, enabled: true,  note: 'Swedish MOMS'       },
    { id: 'co-004', country: 'Denmark',         rate: 25, enabled: true,  note: 'Danish MOMS'        },
    { id: 'co-005', country: 'Netherlands',     rate: 21, enabled: true,  note: 'Dutch BTW'          },
    { id: 'co-006', country: 'France',          rate: 20, enabled: false, note: 'French TVA'         },
  ],
  vatCollectedMTD:   87_420,
  vatCollectedYTD:  612_800,
  taxableRevenueMTD: 349_680,
  taxableRevenueYTD: 2_451_200,
  ossThresholdEUR: 10_000,
  ossEnrolled: false,
}

function _loadTaxConfig() {
  try { const d = localStorage.getItem(TAX_CONFIG_KEY); if (d) return JSON.parse(d) } catch {}
  return { ...DEFAULT_TAX_CONFIG }
}
function _saveTaxConfig(cfg) {
  try { localStorage.setItem(TAX_CONFIG_KEY, JSON.stringify(cfg)) } catch {}
}

export async function getTaxConfig() {
  if (MOCK) { await new Promise(r => setTimeout(r, 150)); return _loadTaxConfig() }
  return request('GET', '/v1/mlm/admin/tax-config')
}

export async function saveTaxConfig(patch) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 220))
    const cfg = { ..._loadTaxConfig(), ...patch }
    _saveTaxConfig(cfg)
    return cfg
  }
  return request('PUT', '/v1/mlm/admin/tax-config', patch)
}

export async function addCountryTaxOverride(override) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 180))
    const cfg = _loadTaxConfig()
    const newItem = { ...override, id: 'co-' + Date.now(), enabled: true }
    cfg.countryOverrides = [...cfg.countryOverrides, newItem]
    _saveTaxConfig(cfg)
    return newItem
  }
  return request('POST', '/v1/mlm/admin/tax-config/country-overrides', override)
}

export async function updateCountryTaxOverride(id, patch) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 180))
    const cfg = _loadTaxConfig()
    cfg.countryOverrides = cfg.countryOverrides.map(o => o.id === id ? { ...o, ...patch } : o)
    _saveTaxConfig(cfg)
    return cfg.countryOverrides.find(o => o.id === id) || null
  }
  return request('PATCH', `/v1/mlm/admin/tax-config/country-overrides/${id}`, patch)
}

export async function deleteCountryTaxOverride(id) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 150))
    const cfg = _loadTaxConfig()
    cfg.countryOverrides = cfg.countryOverrides.filter(o => o.id !== id)
    _saveTaxConfig(cfg)
    return { ok: true }
  }
  return request('DELETE', `/v1/mlm/admin/tax-config/country-overrides/${id}`)
}

export function computeTaxForCountry(country, subtotal, taxConfig) {
  if (!taxConfig?.enabled) return { vatAmount: 0, rate: 0, label: '' }
  const override = (taxConfig.countryOverrides || []).find(o => o.enabled && o.country === country)
  const rate = override ? override.rate : (taxConfig.defaultRate || 25)
  const vatAmount = taxConfig.pricesIncludeTax
    ? Math.round(subtotal - subtotal / (1 + rate / 100))
    : Math.round(subtotal * rate / 100)
  return { vatAmount, rate, label: `MVA ${rate}%` }
}

// ─── Membership Fees ──────────────────────────────────────────────────────────
const MEMBERSHIP_FEE_KEY = 'nv_membership_fee_config'

function _loadFeeConfig() {
  try { const d = localStorage.getItem(MEMBERSHIP_FEE_KEY); if (d) return JSON.parse(d) } catch {}
  return JSON.parse(JSON.stringify(MEMBERSHIP_FEE_CONFIG))
}
function _saveFeeConfig(cfg) {
  try { localStorage.setItem(MEMBERSHIP_FEE_KEY, JSON.stringify(cfg)) } catch {}
}

export async function getMembershipFeeConfig() {
  if (MOCK) { await new Promise(r => setTimeout(r, 150)); return _loadFeeConfig() }
  return request('GET', '/v1/mlm/admin/membership-fees')
}

export async function saveMembershipFeeConfig(patch) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 220))
    const cfg = { ..._loadFeeConfig() }
    for (const key of Object.keys(patch)) {
      if (patch[key] !== null && typeof patch[key] === 'object' && !Array.isArray(patch[key])) {
        cfg[key] = { ...(cfg[key] || {}), ...patch[key] }
      } else {
        cfg[key] = patch[key]
      }
    }
    _saveFeeConfig(cfg)
    return cfg
  }
  return request('PUT', '/v1/mlm/admin/membership-fees', patch)
}

export async function createMembershipFeePaymentPlan(data) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 180))
    const cfg = _loadFeeConfig()
    const plan = { ...data, id: 'pp-' + Date.now() }
    cfg.paymentPlans = [...(cfg.paymentPlans || []), plan]
    _saveFeeConfig(cfg)
    return plan
  }
  return request('POST', '/v1/mlm/admin/membership-fees/payment-plans', data)
}

export async function updateMembershipFeePaymentPlan(id, patch) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 180))
    const cfg = _loadFeeConfig()
    cfg.paymentPlans = (cfg.paymentPlans || []).map(p => p.id === id ? { ...p, ...patch } : p)
    _saveFeeConfig(cfg)
    return cfg.paymentPlans.find(p => p.id === id) || null
  }
  return request('PATCH', `/v1/mlm/admin/membership-fees/payment-plans/${id}`, patch)
}

export async function deleteMembershipFeePaymentPlan(id) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 150))
    const cfg = _loadFeeConfig()
    cfg.paymentPlans = (cfg.paymentPlans || []).filter(p => p.id !== id)
    _saveFeeConfig(cfg)
    return { ok: true }
  }
  return request('DELETE', `/v1/mlm/admin/membership-fees/payment-plans/${id}`)
}

// ─── Subscription Plans ───────────────────────────────────────────────────────
const SUBS_PLANS_KEY = 'nv_subscription_plans'
const SUBS_MEMBERS_KEY = 'nv_member_subscriptions'

function _loadSubsPlans() {
  try { const d = localStorage.getItem(SUBS_PLANS_KEY); if (d) return JSON.parse(d) } catch {}
  return JSON.parse(JSON.stringify(SUBSCRIPTION_PLANS))
}
function _saveSubsPlans(plans) {
  try { localStorage.setItem(SUBS_PLANS_KEY, JSON.stringify(plans)) } catch {}
}

function _loadMemberSubs() {
  try { const d = localStorage.getItem(SUBS_MEMBERS_KEY); if (d) return JSON.parse(d) } catch {}
  return JSON.parse(JSON.stringify(MEMBER_SUBSCRIPTIONS))
}
function _saveMemberSubs(subs) {
  try { localStorage.setItem(SUBS_MEMBERS_KEY, JSON.stringify(subs)) } catch {}
}

export async function getSubscriptionPlans() {
  if (MOCK) { await new Promise(r => setTimeout(r, 160)); return _loadSubsPlans() }
  return request('GET', '/v1/mlm/admin/subscriptions/plans')
}

export async function createSubscriptionPlan(data) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 220))
    const plans = _loadSubsPlans()
    const plan = { ...data, id: 'sp-' + Date.now(), memberCount: 0, mrr: 0 }
    plans.push(plan)
    _saveSubsPlans(plans)
    return plan
  }
  return request('POST', '/v1/mlm/admin/subscriptions/plans', data)
}

export async function updateSubscriptionPlan(id, patch) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 180))
    const plans = _loadSubsPlans()
    const idx = plans.findIndex(p => p.id === id)
    if (idx >= 0) { plans[idx] = { ...plans[idx], ...patch }; _saveSubsPlans(plans) }
    return plans[idx] || null
  }
  return request('PATCH', `/v1/mlm/admin/subscriptions/plans/${id}`, patch)
}

export async function deleteSubscriptionPlan(id) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 150))
    const plans = _loadSubsPlans().filter(p => p.id !== id)
    _saveSubsPlans(plans)
    return { ok: true }
  }
  return request('DELETE', `/v1/mlm/admin/subscriptions/plans/${id}`)
}

export async function getMemberSubscriptions() {
  if (MOCK) { await new Promise(r => setTimeout(r, 200)); return _loadMemberSubs() }
  return request('GET', '/v1/mlm/admin/subscriptions/members')
}

export async function assignMemberPlan(memberId, planId, billingCycle) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 220))
    const subs = _loadMemberSubs()
    const plans = _loadSubsPlans()
    const plan = plans.find(p => p.id === planId)
    const idx = subs.findIndex(s => s.memberId === memberId)
    const today = new Date().toISOString().slice(0, 10)
    const renewal = new Date(Date.now() + (billingCycle === 'annual' ? 365 : 30) * 86400000).toISOString().slice(0, 10)
    const sub = {
      memberId,
      memberName: idx >= 0 ? subs[idx].memberName : memberId,
      planId,
      planName: plan?.name || '',
      billingCycle,
      status: 'active',
      mrr: billingCycle === 'annual' ? Math.round((plan?.annualPrice || 0) / 12) : (plan?.monthlyPrice || 0),
      startDate: idx >= 0 ? subs[idx].startDate : today,
      nextRenewal: renewal,
    }
    if (idx >= 0) subs[idx] = sub; else subs.push(sub)
    _saveMemberSubs(subs)
    return sub
  }
  return request('POST', `/v1/mlm/admin/subscriptions/members/${memberId}/assign`, { planId, billingCycle })
}

export async function cancelMemberSubscription(memberId) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 180))
    const subs = _loadMemberSubs()
    const idx = subs.findIndex(s => s.memberId === memberId)
    if (idx >= 0) { subs[idx] = { ...subs[idx], status: 'cancelled', mrr: 0, nextRenewal: null }; _saveMemberSubs(subs) }
    return subs[idx] || null
  }
  return request('DELETE', `/v1/mlm/admin/subscriptions/members/${memberId}`)
}

export async function getMySubscription(userId = 'NV-10042') {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 150))
    const subs = _loadMemberSubs()
    const plans = _loadSubsPlans()
    const sub = subs.find(s => s.memberId === userId) || null
    if (!sub) return null
    const plan = plans.find(p => p.id === sub.planId) || null
    return { ...sub, plan }
  }
  return request('GET', '/v1/mlm/subscriptions/my')
}

export async function changeMyPlan(planId, billingCycle) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 250))
    const plans = _loadSubsPlans()
    const plan = plans.find(p => p.id === planId)
    return { ok: true, planId, billingCycle, planName: plan?.name || '', effectiveDate: new Date().toISOString().slice(0, 10) }
  }
  return request('POST', '/v1/mlm/subscriptions/my/change', { planId, billingCycle })
}

/* ── Gift Cards ──────────────────────────────────────────────────────── */
const _GC_KEY = 'nv_gift_cards'
function _gcLoad() { try { return JSON.parse(localStorage.getItem(_GC_KEY) || 'null') } catch { return null } }
function _gcSave(c) { localStorage.setItem(_GC_KEY, JSON.stringify(c)) }
function _gcInit() {
  const s = _gcLoad(); if (s) return s
  const far = '2027-08-06T00:00:00Z'
  const seed = [
    { id:'gc-001', code:'NVGC-XKPT-2291', originalValue:500,  balance:500,  issuedTo:null,       issuedToName:null,                issuedAt:'2026-07-15T09:00:00Z', expiresAt:far, status:'active',   note:'Bulk batch A' },
    { id:'gc-002', code:'NVGC-MTRQ-7741', originalValue:500,  balance:0,    issuedTo:null,       issuedToName:null,                issuedAt:'2026-07-15T09:00:00Z', expiresAt:far, status:'redeemed', note:'Bulk batch A', redeemedAt:'2026-07-28T14:22:00Z' },
    { id:'gc-003', code:'NVGC-PLVN-4490', originalValue:1000, balance:350,  issuedTo:'NV-10042', issuedToName:'Sarah Hansen',      issuedAt:'2026-07-20T11:30:00Z', expiresAt:far, status:'partial',  note:'' },
    { id:'gc-004', code:'NVGC-BNRK-8812', originalValue:200,  balance:200,  issuedTo:'NV-10051', issuedToName:'Erik Larsen',       issuedAt:'2026-07-22T08:00:00Z', expiresAt:'2026-08-01T00:00:00Z', status:'expired', note:'Promo expired' },
    { id:'gc-005', code:'NVGC-ZQTM-3310', originalValue:750,  balance:750,  issuedTo:'NV-10065', issuedToName:'Anna Nilsen',       issuedAt:'2026-08-01T10:00:00Z', expiresAt:far, status:'active',   note:'New member welcome' },
    { id:'gc-006', code:'NVGC-VKRJ-5521', originalValue:1500, balance:1500, issuedTo:null,       issuedToName:null,                issuedAt:'2026-08-03T14:00:00Z', expiresAt:far, status:'active',   note:'Influencer campaign' },
    { id:'gc-007', code:'NVGC-HSTD-9901', originalValue:300,  balance:0,    issuedTo:'NV-10088', issuedToName:'Mia Christoffersen',issuedAt:'2026-07-10T09:00:00Z', expiresAt:far, status:'redeemed', note:'', redeemedAt:'2026-07-25T16:44:00Z' },
    { id:'gc-008', code:'NVGC-YMLQ-6640', originalValue:250,  balance:250,  issuedTo:null,       issuedToName:null,                issuedAt:'2026-08-05T08:00:00Z', expiresAt:far, status:'active',   note:'' },
  ]
  _gcSave(seed); return seed
}
function _gcNewCode() {
  const s = () => Math.random().toString(36).toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,4).padEnd(4,'X')
  return `NVGC-${s()}-${s()}`
}
function _gcNextId(cards) {
  const max = cards.reduce((m,c) => Math.max(m, parseInt(c.id.replace('gc-',''))||0), 0)
  return 'gc-' + String(max+1).padStart(3,'0')
}

export async function getAdminGiftCards({ status, search } = {}) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 200))
    const all = _gcInit()
    let cards = [...all]
    if (status && status !== 'all') cards = cards.filter(c => c.status === status)
    if (search) {
      const q = search.toLowerCase()
      cards = cards.filter(c => c.code.toLowerCase().includes(q) || (c.issuedToName||'').toLowerCase().includes(q) || (c.issuedTo||'').toLowerCase().includes(q))
    }
    const totalFaceValue = all.reduce((s,c) => s + c.originalValue, 0)
    const outstanding    = all.filter(c=>c.status!=='voided'&&c.status!=='expired').reduce((s,c) => s + c.balance, 0)
    const redeemed       = all.reduce((s,c) => s + (c.originalValue - c.balance), 0)
    const expired        = all.filter(c=>c.status==='expired').reduce((s,c) => s + c.balance, 0)
    return { cards, stats: { totalIssued: all.length, totalFaceValue, outstanding, redeemed, expired } }
  }
  return request('GET', '/v1/mlm/admin/gift-cards', { status, search })
}

export async function issueGiftCards({ value, expiresAt, issuedTo, issuedToName, note, count = 1 }) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 280))
    const cards = _gcInit()
    const now = new Date().toISOString()
    const newCards = []
    for (let i = 0; i < Math.min(count, 200); i++) {
      newCards.push({
        id: _gcNextId([...cards, ...newCards]),
        code: _gcNewCode(),
        originalValue: value,
        balance: value,
        issuedTo: issuedTo || null,
        issuedToName: issuedToName || null,
        issuedAt: now,
        expiresAt,
        status: 'active',
        note: note || '',
      })
    }
    _gcSave([...cards, ...newCards])
    return { ok: true, cards: newCards }
  }
  return request('POST', '/v1/mlm/admin/gift-cards/issue', { value, expiresAt, issuedTo, issuedToName, note, count })
}

export async function voidGiftCard(id, reason) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 180))
    _gcSave(_gcInit().map(c => c.id === id ? { ...c, status:'voided', voidedAt: new Date().toISOString(), voidReason: reason||'' } : c))
    return { ok: true }
  }
  return request('POST', `/v1/mlm/admin/gift-cards/${id}/void`, { reason })
}

export async function getMyGiftCards(userId = 'NV-10042') {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 160))
    const cards = _gcInit().filter(c => c.issuedTo === userId)
    const redemptions = [
      { date:'2026-07-25T16:44:00Z', code:'NVGC-HSTD-9901', amount:300, orderId:'ORD-8754' },
      { date:'2026-06-14T11:10:00Z', code:'NVGC-DEMO-0001', amount:150, orderId:'ORD-8201' },
    ]
    return { cards, redemptions }
  }
  return request('GET', '/v1/mlm/gift-cards/my')
}

export async function checkGiftCardBalance(code) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 200))
    const card = _gcInit().find(c => c.code.toUpperCase() === code.trim().toUpperCase())
    if (!card) return { found: false }
    return { found: true, code: card.code, balance: card.balance, status: card.status, expiresAt: card.expiresAt }
  }
  return request('GET', '/v1/mlm/gift-cards/check', { code })
}

// ── Security (member) ─────────────────────────────────────────────────────────

const _SEC_KEY = 'nv_security_profile'
function _secLoad() { try { return JSON.parse(localStorage.getItem(_SEC_KEY)) } catch { return null } }
function _secSave(d) { localStorage.setItem(_SEC_KEY, JSON.stringify(d)) }
function _secInit(userId) {
  const s = _secLoad(); if (s && s.userId === userId) return s
  const seed = {
    userId,
    passwordChangedAt: '2026-06-15T08:30:00Z',
    twoFactorEnabled: false,
    recoveryCodes: [],
    activeSessions: [
      { id: 'sess-001', device: 'MacBook Pro', browser: 'Chrome 126', os: 'macOS 14', ip: '88.93.12.44', location: 'Oslo, NO', lastActive: '2026-08-06T13:55:00Z', isCurrent: true },
      { id: 'sess-002', device: 'iPhone 15 Pro', browser: 'Safari Mobile', os: 'iOS 17', ip: '88.93.12.44', location: 'Oslo, NO', lastActive: '2026-08-05T22:10:00Z', isCurrent: false },
      { id: 'sess-003', device: 'Windows PC', browser: 'Firefox 128', os: 'Windows 11', ip: '194.63.109.21', location: 'Bergen, NO', lastActive: '2026-07-28T09:00:00Z', isCurrent: false },
    ],
    loginHistory: [
      { id: 'lh-001', at: '2026-08-06T13:55:00Z', ip: '88.93.12.44', location: 'Oslo, NO', device: 'MacBook Pro / Chrome', success: true },
      { id: 'lh-002', at: '2026-08-05T22:10:00Z', ip: '88.93.12.44', location: 'Oslo, NO', device: 'iPhone 15 / Safari', success: true },
      { id: 'lh-003', at: '2026-08-04T08:45:00Z', ip: '102.0.88.5', location: 'Lagos, NG', device: 'Unknown / Chrome', success: false },
      { id: 'lh-004', at: '2026-08-03T14:20:00Z', ip: '88.93.12.44', location: 'Oslo, NO', device: 'MacBook Pro / Chrome', success: true },
      { id: 'lh-005', at: '2026-07-28T09:00:00Z', ip: '194.63.109.21', location: 'Bergen, NO', device: 'Windows PC / Firefox', success: true },
      { id: 'lh-006', at: '2026-07-20T18:35:00Z', ip: '88.93.12.44', location: 'Oslo, NO', device: 'MacBook Pro / Chrome', success: true },
    ],
  }
  _secSave(seed); return seed
}

export async function getSecurityProfile(userId) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 180))
    return _secInit(userId)
  }
  return request('GET', '/v1/mlm/security/profile')
}

export async function changePassword(userId, { currentPassword, newPassword }) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 350))
    if (!currentPassword || currentPassword.length < 4) throw new Error('Current password is incorrect.')
    const profile = _secInit(userId)
    _secSave({ ...profile, passwordChangedAt: new Date().toISOString() })
    return { ok: true }
  }
  return request('POST', '/v1/mlm/security/change-password', { currentPassword, newPassword })
}

export async function setupTwoFactor(userId) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 220))
    return {
      manualKey: 'JBSWY3DPEHPK3PXP',
      qrDataUrl: null,
    }
  }
  return request('POST', '/v1/mlm/security/2fa/setup')
}

export async function verifyAndEnableTwoFactor(userId, code) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 300))
    if (code.replace(/\s/g,'').length !== 6) throw new Error('Enter a valid 6-digit code.')
    const recoveryCodes = Array.from({ length: 8 }, (_, i) => `NV-${String(i+1).padStart(2,'0')}-${Math.random().toString(36).toUpperCase().slice(2,10)}`)
    const profile = _secInit(userId)
    _mock2FA[userId] = true
    _secSave({ ...profile, twoFactorEnabled: true, recoveryCodes })
    return { ok: true, recoveryCodes }
  }
  return request('POST', '/v1/mlm/security/2fa/verify', { code })
}

export async function disableTwoFactor(userId, password) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 280))
    if (!password || password.length < 4) throw new Error('Password is required to disable 2FA.')
    const profile = _secInit(userId)
    delete _mock2FA[userId]
    _secSave({ ...profile, twoFactorEnabled: false, recoveryCodes: [] })
    return { ok: true }
  }
  return request('POST', '/v1/mlm/security/2fa/disable', { password })
}

export async function revokeSession(userId, sessionId) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 200))
    const profile = _secInit(userId)
    const updated = { ...profile, activeSessions: profile.activeSessions.filter(s => s.id !== sessionId) }
    _secSave(updated)
    return { ok: true }
  }
  return request('DELETE', `/v1/mlm/security/sessions/${sessionId}`)
}

// ── Webhooks (admin) ──────────────────────────────────────────────────────────

const _WH_KEY = 'nv_admin_webhooks'
const _WHD_KEY = 'nv_webhook_deliveries'
const WEBHOOK_EVENTS = [
  'member.enrolled', 'member.rank_change', 'member.suspended',
  'commission.run_complete', 'commission.payout_processed',
  'order.placed', 'order.shipped', 'order.cancelled',
  'gift_card.issued', 'subscription.renewed', 'kyc.approved', 'kyc.rejected',
]
function _whLoad() { try { return JSON.parse(localStorage.getItem(_WH_KEY)) } catch { return null } }
function _whSave(d) { localStorage.setItem(_WH_KEY, JSON.stringify(d)) }
function _whdLoad() { try { return JSON.parse(localStorage.getItem(_WHD_KEY)) } catch { return null } }
function _whdSave(d) { localStorage.setItem(_WHD_KEY, JSON.stringify(d)) }
function _whInit() {
  const s = _whLoad(); if (s) return s
  const seed = [
    { id: 'wh-001', url: 'https://hooks.zapier.com/hooks/catch/123456/abcdef/', description: 'Zapier — member events', events: ['member.enrolled','member.rank_change'], secret: 'whsec_zap123abc', enabled: true, createdAt: '2026-07-01T10:00:00Z' },
    { id: 'wh-002', url: 'https://erp.example.no/webhook/orders', description: 'ERP — order sync', events: ['order.placed','order.shipped','order.cancelled'], secret: 'whsec_erp456def', enabled: true, createdAt: '2026-07-10T14:00:00Z' },
    { id: 'wh-003', url: 'https://analytics.example.com/ingest', description: 'Analytics — commissions', events: ['commission.run_complete','commission.payout_processed'], secret: 'whsec_ana789ghi', enabled: false, createdAt: '2026-07-20T09:00:00Z' },
  ]
  _whSave(seed); return seed
}
function _whdInit() {
  const s = _whdLoad(); if (s) return s
  const seed = [
    { id: 'whd-001', endpointId: 'wh-001', url: 'https://hooks.zapier.com/hooks/catch/123456/abcdef/', event: 'member.enrolled', at: '2026-08-06T12:30:00Z', status: 'success', httpCode: 200, durationMs: 142, attempt: 1 },
    { id: 'whd-002', endpointId: 'wh-001', url: 'https://hooks.zapier.com/hooks/catch/123456/abcdef/', event: 'member.rank_change', at: '2026-08-06T11:15:00Z', status: 'success', httpCode: 200, durationMs: 188, attempt: 1 },
    { id: 'whd-003', endpointId: 'wh-002', url: 'https://erp.example.no/webhook/orders', event: 'order.placed', at: '2026-08-06T10:45:00Z', status: 'failed', httpCode: 503, durationMs: 5021, attempt: 3, error: 'Service Unavailable' },
    { id: 'whd-004', endpointId: 'wh-002', url: 'https://erp.example.no/webhook/orders', event: 'order.shipped', at: '2026-08-05T18:20:00Z', status: 'success', httpCode: 200, durationMs: 95, attempt: 1 },
    { id: 'whd-005', endpointId: 'wh-001', url: 'https://hooks.zapier.com/hooks/catch/123456/abcdef/', event: 'member.enrolled', at: '2026-08-05T09:00:00Z', status: 'success', httpCode: 200, durationMs: 161, attempt: 1 },
    { id: 'whd-006', endpointId: 'wh-002', url: 'https://erp.example.no/webhook/orders', event: 'order.cancelled', at: '2026-08-04T14:35:00Z', status: 'failed', httpCode: 500, durationMs: 4998, attempt: 3, error: 'Internal Server Error' },
    { id: 'whd-007', endpointId: 'wh-001', url: 'https://hooks.zapier.com/hooks/catch/123456/abcdef/', event: 'member.rank_change', at: '2026-08-03T11:00:00Z', status: 'success', httpCode: 200, durationMs: 203, attempt: 1 },
    { id: 'whd-008', endpointId: 'wh-002', url: 'https://erp.example.no/webhook/orders', event: 'order.placed', at: '2026-08-02T16:45:00Z', status: 'success', httpCode: 201, durationMs: 87, attempt: 1 },
  ]
  _whdSave(seed); return seed
}
function _whNextId(whs) {
  const max = whs.reduce((m,w) => Math.max(m, parseInt(w.id.replace('wh-',''))||0), 0)
  return 'wh-' + String(max+1).padStart(3,'0')
}
function _whdNextId(ds) {
  const max = ds.reduce((m,d) => Math.max(m, parseInt(d.id.replace('whd-',''))||0), 0)
  return 'whd-' + String(max+1).padStart(3,'0')
}

export async function getAdminWebhooks() {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 180))
    const endpoints = _whInit()
    const deliveries = _whdInit()
    const now = Date.now()
    const h24 = now - 86400000
    const recent = deliveries.filter(d => new Date(d.at).getTime() > h24)
    return {
      endpoints,
      stats: {
        total: endpoints.length,
        active: endpoints.filter(e => e.enabled).length,
        events24h: recent.length,
        failed24h: recent.filter(d => d.status === 'failed').length,
      },
    }
  }
  return request('GET', '/v1/mlm/admin/webhooks')
}

export async function createWebhook(data) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 250))
    const whs = _whInit()
    const endpoint = { id: _whNextId(whs), ...data, createdAt: new Date().toISOString() }
    _whSave([...whs, endpoint])
    return { ok: true, endpoint }
  }
  return request('POST', '/v1/mlm/admin/webhooks', data)
}

export async function updateWebhook(id, data) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 200))
    _whSave(_whInit().map(w => w.id === id ? { ...w, ...data } : w))
    return { ok: true }
  }
  return request('PUT', `/v1/mlm/admin/webhooks/${id}`, data)
}

export async function deleteWebhook(id) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 180))
    _whSave(_whInit().filter(w => w.id !== id))
    return { ok: true }
  }
  return request('DELETE', `/v1/mlm/admin/webhooks/${id}`)
}

export async function testWebhook(id) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 800))
    const wh = _whInit().find(w => w.id === id)
    const ok = wh && wh.enabled && !wh.url.includes('example.no')
    const delivery = {
      id: _whdNextId(_whdInit()),
      endpointId: id,
      url: wh?.url || '',
      event: 'ping',
      at: new Date().toISOString(),
      status: ok ? 'success' : 'failed',
      httpCode: ok ? 200 : 503,
      durationMs: ok ? Math.floor(Math.random() * 200 + 80) : 5000,
      attempt: 1,
      error: ok ? undefined : 'Connection refused',
    }
    _whdSave([delivery, ..._whdInit()])
    return { ok, httpCode: delivery.httpCode, durationMs: delivery.durationMs, error: delivery.error }
  }
  return request('POST', `/v1/mlm/admin/webhooks/${id}/test`)
}

export async function getWebhookDeliveries({ endpointId, status } = {}) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 180))
    let ds = _whdInit()
    if (endpointId && endpointId !== 'all') ds = ds.filter(d => d.endpointId === endpointId)
    if (status && status !== 'all') ds = ds.filter(d => d.status === status)
    return ds.sort((a, b) => new Date(b.at) - new Date(a.at))
  }
  return request('GET', '/v1/mlm/admin/webhooks/deliveries', { endpointId, status })
}

export async function retryWebhookDelivery(deliveryId) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 500))
    const ds = _whdInit()
    const orig = ds.find(d => d.id === deliveryId)
    if (!orig) throw new Error('Delivery not found.')
    const retry = {
      ...orig,
      id: _whdNextId(ds),
      at: new Date().toISOString(),
      status: 'success',
      httpCode: 200,
      durationMs: Math.floor(Math.random() * 200 + 80),
      attempt: (orig.attempt || 1) + 1,
      error: undefined,
    }
    _whdSave([retry, ...ds])
    return { ok: true }
  }
  return request('POST', `/v1/mlm/admin/webhooks/deliveries/${deliveryId}/retry`)
}

// ─── RANK MANAGER ─────────────────────────────────────────────────────────────

const SEED_RANKS = [
  { id: 'rank_1', name: 'Starter',   slug: 'starter',   color: '#9ca3af', icon: '⭐', order: 1, pvRequired: 0,    gvRequired: 0,      activeLegsRequired: 0, legVolRequired: 0,    monthlyBonus: 0,     retailDiscount: 20, qualifyingPeriod: 'month', active: true,  memberCount: 412 },
  { id: 'rank_2', name: 'Bronze',    slug: 'bronze',    color: '#cd7f32', icon: '🥉', order: 2, pvRequired: 100,  gvRequired: 500,    activeLegsRequired: 1, legVolRequired: 100,  monthlyBonus: 0,     retailDiscount: 25, qualifyingPeriod: 'month', active: true,  memberCount: 187 },
  { id: 'rank_3', name: 'Silver',    slug: 'silver',    color: '#c0c0c0', icon: '🥈', order: 3, pvRequired: 150,  gvRequired: 1500,   activeLegsRequired: 2, legVolRequired: 200,  monthlyBonus: 500,   retailDiscount: 30, qualifyingPeriod: 'month', active: true,  memberCount: 94  },
  { id: 'rank_4', name: 'Gold',      slug: 'gold',      color: '#ffd700', icon: '🥇', order: 4, pvRequired: 200,  gvRequired: 5000,   activeLegsRequired: 3, legVolRequired: 500,  monthlyBonus: 1500,  retailDiscount: 35, qualifyingPeriod: 'month', active: true,  memberCount: 41  },
  { id: 'rank_5', name: 'Platinum',  slug: 'platinum',  color: '#e5e4e2', icon: '💎', order: 5, pvRequired: 300,  gvRequired: 15000,  activeLegsRequired: 4, legVolRequired: 1000, monthlyBonus: 4000,  retailDiscount: 40, qualifyingPeriod: 'month', active: true,  memberCount: 18  },
  { id: 'rank_6', name: 'Diamond',   slug: 'diamond',   color: '#b9f2ff', icon: '💠', order: 6, pvRequired: 500,  gvRequired: 50000,  activeLegsRequired: 5, legVolRequired: 3000, monthlyBonus: 10000, retailDiscount: 45, qualifyingPeriod: 'month', active: true,  memberCount: 6   },
  { id: 'rank_7', name: 'Blue Diamond', slug: 'blue_diamond', color: '#3b82f6', icon: '🔷', order: 7, pvRequired: 500, gvRequired: 150000, activeLegsRequired: 6, legVolRequired: 10000, monthlyBonus: 25000, retailDiscount: 50, qualifyingPeriod: 'month', active: true, memberCount: 2 },
]

function _rankKey() { return 'nv_admin_ranks' }
function _rankInit() {
  try { return JSON.parse(localStorage.getItem(_rankKey())) || SEED_RANKS } catch { return SEED_RANKS }
}
function _rankSave(r) { localStorage.setItem(_rankKey(), JSON.stringify(r)) }
function _rankNextId(r) { return 'rank_' + (Math.max(0, ...r.map(x => parseInt(x.id.replace('rank_', '')) || 0)) + 1) }

export async function getAdminRanks() {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 180))
    return { ranks: _rankInit() }
  }
  return request('GET', '/v1/mlm/admin/ranks')
}

export async function createRank(data) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 250))
    const ranks = _rankInit()
    const rank = { id: _rankNextId(ranks), ...data, memberCount: 0, createdAt: new Date().toISOString() }
    _rankSave([...ranks, rank].sort((a, b) => a.order - b.order))
    return { ok: true, rank }
  }
  return request('POST', '/v1/mlm/admin/ranks', data)
}

export async function updateRank(id, data) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 200))
    _rankSave(_rankInit().map(r => r.id === id ? { ...r, ...data } : r).sort((a, b) => a.order - b.order))
    return { ok: true }
  }
  return request('PUT', `/v1/mlm/admin/ranks/${id}`, data)
}

export async function deleteRank(id) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 180))
    _rankSave(_rankInit().filter(r => r.id !== id))
    return { ok: true }
  }
  return request('DELETE', `/v1/mlm/admin/ranks/${id}`)
}

// ─── FRAUD & RISK CENTER ──────────────────────────────────────────────────────

const SEED_FRAUD_FLAGS = [
  { id: 'ff_1',  memberId: 'u_009', memberName: 'Erik Hansen',      type: 'duplicate_account',  severity: 'high',     description: '3 accounts sharing the same IP address (185.220.101.14)', detectedAt: '2026-08-06T08:12:00Z', status: 'open',         investigator: null,      resolvedAt: null, notes: '' },
  { id: 'ff_2',  memberId: 'u_017', memberName: 'Kari Andersen',    type: 'referral_abuse',     severity: 'high',     description: 'Self-referral loop detected — member enrolled by their own sub-account', detectedAt: '2026-08-05T22:44:00Z', status: 'investigating', investigator: 'Admin',   resolvedAt: null, notes: 'Reached out to member for explanation.' },
  { id: 'ff_3',  memberId: 'u_023', memberName: 'Lars Nilsen',      type: 'unusual_volume',     severity: 'medium',   description: 'PV jumped 4,200% MoM with no corresponding retail sales', detectedAt: '2026-08-05T14:30:00Z', status: 'open',         investigator: null,      resolvedAt: null, notes: '' },
  { id: 'ff_4',  memberId: 'u_031', memberName: 'Ingrid Berg',      type: 'payment_fraud',      severity: 'critical', description: 'Chargeback filed on 4 orders within 30 days totalling NOK 8,200', detectedAt: '2026-08-05T09:05:00Z', status: 'open',         investigator: null,      resolvedAt: null, notes: '' },
  { id: 'ff_5',  memberId: 'u_044', memberName: 'Ole Johansen',     type: 'suspicious_signup',  severity: 'low',      description: 'Signup from high-risk country proxy (Tor exit node)', detectedAt: '2026-08-04T16:22:00Z', status: 'dismissed',    investigator: 'Admin',   resolvedAt: '2026-08-04T18:00:00Z', notes: 'Member verified by phone. Legitimate VPN user.' },
  { id: 'ff_6',  memberId: 'u_052', memberName: 'Sigrid Vik',       type: 'referral_abuse',     severity: 'medium',   description: 'Enrolled 12 members in 48 hours, all using the same device fingerprint', detectedAt: '2026-08-04T11:15:00Z', status: 'investigating', investigator: 'Admin',   resolvedAt: null, notes: '' },
  { id: 'ff_7',  memberId: 'u_061', memberName: 'Tor Magnusson',    type: 'unusual_volume',     severity: 'medium',   description: 'Autoship orders placed and immediately returned in a commission-gaming pattern', detectedAt: '2026-08-03T20:08:00Z', status: 'resolved',     investigator: 'Admin',   resolvedAt: '2026-08-05T09:00:00Z', notes: 'Account suspended. Commissions reversed.' },
  { id: 'ff_8',  memberId: 'u_073', memberName: 'Astrid Dahl',      type: 'payment_fraud',      severity: 'high',     description: 'Card number used belongs to a different cardholder name', detectedAt: '2026-08-03T13:44:00Z', status: 'resolved',     investigator: 'Admin',   resolvedAt: '2026-08-04T10:30:00Z', notes: 'Account frozen, reported to payment processor.' },
  { id: 'ff_9',  memberId: 'u_081', memberName: 'Bjarne Solberg',   type: 'duplicate_account',  severity: 'low',      description: 'Possible duplicate of member u_043 (same name variant + DOB)', detectedAt: '2026-08-02T09:30:00Z', status: 'dismissed',    investigator: 'Admin',   resolvedAt: '2026-08-02T14:00:00Z', notes: 'Different people. Common Norwegian name.' },
  { id: 'ff_10', memberId: 'u_092', memberName: 'Hilde Thorvaldsen', type: 'suspicious_signup', severity: 'low',      description: 'Account created with disposable email domain', detectedAt: '2026-08-01T17:55:00Z', status: 'open',         investigator: null,      resolvedAt: null, notes: '' },
]

const FRAUD_RULES_SEED = [
  { id: 'fr_1', name: 'IP Sharing Threshold',        trigger: 'Same IP > N accounts',         threshold: 3,  action: 'flag',    enabled: true  },
  { id: 'fr_2', name: 'Rapid Referral Burst',        trigger: 'N referrals within 48h',       threshold: 10, action: 'flag',    enabled: true  },
  { id: 'fr_3', name: 'Chargeback Alert',            trigger: 'N chargebacks within 30d',     threshold: 2,  action: 'suspend', enabled: true  },
  { id: 'fr_4', name: 'Volume Spike',                trigger: 'PV increase > N% MoM',         threshold: 300, action: 'flag',   enabled: true  },
  { id: 'fr_5', name: 'Tor / Proxy Signup',          trigger: 'Signup from known proxy IP',   threshold: 1,  action: 'flag',    enabled: false },
  { id: 'fr_6', name: 'Disposable Email',            trigger: 'Signup with throwaway email',  threshold: 1,  action: 'flag',    enabled: true  },
  { id: 'fr_7', name: 'Return Gaming',               trigger: 'Return rate > N% of orders',   threshold: 50, action: 'flag',    enabled: true  },
]

function _ffKey() { return 'nv_fraud_flags' }
function _ffInit() {
  try { return JSON.parse(localStorage.getItem(_ffKey())) || SEED_FRAUD_FLAGS } catch { return SEED_FRAUD_FLAGS }
}
function _ffSave(f) { localStorage.setItem(_ffKey(), JSON.stringify(f)) }
function _frKey() { return 'nv_fraud_rules' }
function _frInit() {
  try { return JSON.parse(localStorage.getItem(_frKey())) || FRAUD_RULES_SEED } catch { return FRAUD_RULES_SEED }
}
function _frSave(r) { localStorage.setItem(_frKey(), JSON.stringify(r)) }

export async function getAdminFraudFlags({ status, type, severity } = {}) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 200))
    let flags = _ffInit()
    if (status && status !== 'all') flags = flags.filter(f => f.status === status)
    if (type   && type   !== 'all') flags = flags.filter(f => f.type === type)
    if (severity && severity !== 'all') flags = flags.filter(f => f.severity === severity)
    return { flags: flags.sort((a, b) => new Date(b.detectedAt) - new Date(a.detectedAt)) }
  }
  return request('GET', '/v1/mlm/admin/fraud/flags', { status, type, severity })
}

export async function updateFraudFlag(id, data) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 200))
    _ffSave(_ffInit().map(f => f.id === id ? { ...f, ...data } : f))
    return { ok: true }
  }
  return request('PUT', `/v1/mlm/admin/fraud/flags/${id}`, data)
}

export async function getAdminFraudRules() {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 150))
    return { rules: _frInit() }
  }
  return request('GET', '/v1/mlm/admin/fraud/rules')
}

export async function updateFraudRule(id, data) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 180))
    _frSave(_frInit().map(r => r.id === id ? { ...r, ...data } : r))
    return { ok: true }
  }
  return request('PUT', `/v1/mlm/admin/fraud/rules/${id}`, data)
}

// ── A/B Tests ──────────────────────────────────────────────────────────────
const AB_SEED = [
  {
    id: 'abt-001', name: 'Landing Page Hero CTA', type: 'landing_page',
    hypothesis: 'A stronger CTA ("Start Earning Today") will lift signups vs "Join Now".',
    status: 'running',
    startedAt: '2026-07-20T09:00:00Z', endedAt: null, winnerId: null,
    variants: [
      { id: 'a', name: 'Control — "Join Now"',          split: 50, impressions: 4812, conversions: 241 },
      { id: 'b', name: 'Treatment — "Start Earning"',   split: 50, impressions: 4835, conversions: 314 },
    ],
  },
  {
    id: 'abt-002', name: 'Welcome Email Subject Line', type: 'email_subject',
    hypothesis: 'Personalised subject line will increase open rate.',
    status: 'completed',
    startedAt: '2026-07-01T00:00:00Z', endedAt: '2026-07-15T23:59:59Z', winnerId: 'b',
    variants: [
      { id: 'a', name: '"Welcome to Nordic Vitals!"',         split: 50, impressions: 2100, conversions: 441 },
      { id: 'b', name: '"Hi {{first_name}}, your journey begins"', split: 50, impressions: 2100, conversions: 567 },
    ],
  },
  {
    id: 'abt-003', name: 'Starter Pack Pricing', type: 'pricing',
    hypothesis: '€199 anchor price will perform better than €149 for starter kit.',
    status: 'paused',
    startedAt: '2026-07-28T08:00:00Z', endedAt: null, winnerId: null,
    variants: [
      { id: 'a', name: 'Control — €149 pack',   split: 60, impressions: 980, conversions: 78 },
      { id: 'b', name: 'Treatment — €199 pack', split: 40, impressions: 650, conversions: 61 },
    ],
  },
  {
    id: 'abt-004', name: 'Onboarding Step Count', type: 'onboarding',
    hypothesis: 'Shorter 3-step onboarding reduces drop-off vs current 6-step flow.',
    status: 'draft',
    startedAt: null, endedAt: null, winnerId: null,
    variants: [
      { id: 'a', name: '6-step onboarding (control)',   split: 50, impressions: 0, conversions: 0 },
      { id: 'b', name: '3-step onboarding (treatment)', split: 50, impressions: 0, conversions: 0 },
    ],
  },
  {
    id: 'abt-005', name: 'Commission Calculator Placement', type: 'landing_page',
    hypothesis: 'Moving the commission calculator above the fold lifts qualified signups.',
    status: 'running',
    startedAt: '2026-08-01T06:00:00Z', endedAt: null, winnerId: null,
    variants: [
      { id: 'a', name: 'Below fold (control)',   split: 50, impressions: 1240, conversions: 74 },
      { id: 'b', name: 'Above fold (treatment)', split: 50, impressions: 1238, conversions: 98 },
    ],
  },
]
let _abTests = null
function _abInit() { if (!_abTests) _abTests = JSON.parse(JSON.stringify(AB_SEED)); return _abTests }
function _abSave(t) { _abTests = t }

export async function getAdminAbTests({ status, type } = {}) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 170))
    let tests = _abInit()
    if (status && status !== 'all') tests = tests.filter(t => t.status === status)
    if (type   && type   !== 'all') tests = tests.filter(t => t.type === type)
    return { tests }
  }
  return request('GET', '/v1/mlm/admin/ab-tests', null, { status, type })
}

export async function createAbTest(data) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 220))
    const t = { id: `abt-${Date.now()}`, winnerId: null, ...data }
    _abSave([..._abInit(), t])
    return { test: t }
  }
  return request('POST', '/v1/mlm/admin/ab-tests', data)
}

export async function updateAbTest(id, data) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 180))
    _abSave(_abInit().map(t => t.id === id ? { ...t, ...data } : t))
    return { ok: true }
  }
  return request('PUT', `/v1/mlm/admin/ab-tests/${id}`, data)
}

export async function deleteAbTest(id) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 150))
    _abSave(_abInit().filter(t => t.id !== id))
    return { ok: true }
  }
  return request('DELETE', `/v1/mlm/admin/ab-tests/${id}`)
}

// ── Member Goals ────────────────────────────────────────────────────────────
const GOALS_SEED = [
  { id: 'g-001', title: 'Reach Gold Rank',           category: 'rank',        target: 1,   current: 0,   unit: 'rank tier',  deadline: '2026-09-30', status: 'active',    createdAt: '2026-07-01' },
  { id: 'g-002', title: 'Recruit 10 Members',         category: 'recruitment', target: 10,  current: 7,   unit: 'members',    deadline: '2026-08-31', status: 'active',    createdAt: '2026-07-05' },
  { id: 'g-003', title: 'Generate 5000 PV this month',category: 'volume',      target: 5000,current: 3820,unit: 'PV',         deadline: '2026-08-31', status: 'active',    createdAt: '2026-08-01' },
  { id: 'g-004', title: 'Earn €1000 in commissions', category: 'earnings',    target: 1000,current: 1000,unit: '€',          deadline: '2026-07-31', status: 'completed', createdAt: '2026-07-01' },
  { id: 'g-005', title: 'Complete Fast Start Bonus',  category: 'activity',   target: 1,   current: 1,   unit: 'bonus',      deadline: '2026-07-15', status: 'completed', createdAt: '2026-07-01' },
  { id: 'g-006', title: 'Build 3-leg network',        category: 'recruitment', target: 3,   current: 2,   unit: 'active legs',deadline: '2026-08-15', status: 'active',    createdAt: '2026-07-10' },
  { id: 'g-007', title: '€500 monthly residual',      category: 'earnings',   target: 500, current: 310, unit: '€',          deadline: '2026-10-31', status: 'active',    createdAt: '2026-07-20' },
  { id: 'g-008', title: 'Log in every day for 30 days',category: 'activity',  target: 30,  current: 22,  unit: 'days',       deadline: '2026-08-20', status: 'active',    createdAt: '2026-07-22' },
  { id: 'g-009', title: 'Hit Diamond rank',           category: 'rank',       target: 1,   current: 0,   unit: 'rank tier',  deadline: '2026-06-30', status: 'missed',    createdAt: '2026-04-01' },
]
let _memberGoals = null
function _gInit() { if (!_memberGoals) _memberGoals = JSON.parse(JSON.stringify(GOALS_SEED)); return _memberGoals }
function _gSave(g) { _memberGoals = g }

export async function getMemberGoals({ category, status } = {}) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 160))
    let goals = _gInit()
    if (category && category !== 'all') goals = goals.filter(g => g.category === category)
    if (status   && status   !== 'all') goals = goals.filter(g => g.status   === status)
    return { goals }
  }
  return request('GET', '/v1/mlm/member/goals', null, { category, status })
}

export async function createMemberGoal(data) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 200))
    const g = { id: `g-${Date.now()}`, current: 0, status: 'active', createdAt: new Date().toISOString().slice(0, 10), ...data }
    _gSave([..._gInit(), g])
    return { goal: g }
  }
  return request('POST', '/v1/mlm/member/goals', data)
}

export async function updateMemberGoal(id, data) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 180))
    _gSave(_gInit().map(g => g.id === id ? { ...g, ...data } : g))
    return { ok: true }
  }
  return request('PUT', `/v1/mlm/member/goals/${id}`, data)
}

export async function deleteMemberGoal(id) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 140))
    _gSave(_gInit().filter(g => g.id !== id))
    return { ok: true }
  }
  return request('DELETE', `/v1/mlm/member/goals/${id}`)
}

// ── Abandoned Carts (admin) ─────────────────────────────────────────────────
const ABANDONED_CARTS_SEED = [
  {
    id: 'ac-001', email: 'lars.berg@example.com', memberName: 'Lars Berg',
    abandonedAt: new Date(Date.now() - 2 * 3600000).toISOString(), status: 'new',
    recoveryEmails: [],
    items: [
      { name: 'Arctic Omega-3 Complex', sku: 'AOC-90', qty: 2, price: 49.90 },
      { name: 'Nordic Collagen Boost', sku: 'NCB-60', qty: 1, price: 64.90 },
    ],
  },
  {
    id: 'ac-002', email: 'ingrid.hall@example.com', memberName: 'Ingrid Hall',
    abandonedAt: new Date(Date.now() - 26 * 3600000).toISOString(), status: 'emailed',
    recoveryEmails: [{ sentAt: new Date(Date.now() - 20 * 3600000).toISOString(), template: 'Standard Recovery' }],
    items: [
      { name: 'Viking Vitality Stack', sku: 'VVS-30', qty: 1, price: 119.00 },
    ],
  },
  {
    id: 'ac-003', email: 'erik.storm@example.com', memberName: 'Erik Storm',
    abandonedAt: new Date(Date.now() - 52 * 3600000).toISOString(), status: 'recovered',
    recoveryEmails: [{ sentAt: new Date(Date.now() - 48 * 3600000).toISOString(), template: 'Standard Recovery' }],
    items: [
      { name: 'Arctic Omega-3 Complex', sku: 'AOC-90', qty: 3, price: 49.90 },
      { name: 'Immune Shield Pro', sku: 'ISP-120', qty: 1, price: 39.90 },
    ],
  },
  {
    id: 'ac-004', email: 'sofia.lund@example.com', memberName: null,
    abandonedAt: new Date(Date.now() - 6 * 3600000).toISOString(), status: 'new',
    recoveryEmails: [],
    items: [
      { name: 'Nordic Collagen Boost', sku: 'NCB-60', qty: 2, price: 64.90 },
    ],
  },
  {
    id: 'ac-005', email: 'magnus.ore@example.com', memberName: 'Magnus Øre',
    abandonedAt: new Date(Date.now() - 72 * 3600000).toISOString(), status: 'lost',
    recoveryEmails: [
      { sentAt: new Date(Date.now() - 68 * 3600000).toISOString(), template: 'Standard Recovery' },
      { sentAt: new Date(Date.now() - 50 * 3600000).toISOString(), template: '10% Off Recovery' },
    ],
    items: [
      { name: 'Starter Bundle Alpha', sku: 'SBA-01', qty: 1, price: 189.00 },
    ],
  },
  {
    id: 'ac-006', email: 'anna.svenson@example.com', memberName: 'Anna Svensson',
    abandonedAt: new Date(Date.now() - 14 * 3600000).toISOString(), status: 'new',
    recoveryEmails: [],
    items: [
      { name: 'Arctic Omega-3 Complex', sku: 'AOC-90', qty: 1, price: 49.90 },
      { name: 'Viking Vitality Stack', sku: 'VVS-30', qty: 1, price: 119.00 },
      { name: 'Immune Shield Pro', sku: 'ISP-120', qty: 2, price: 39.90 },
    ],
  },
]
let _abandonedCarts = null
function _acInit() { if (!_abandonedCarts) _abandonedCarts = JSON.parse(JSON.stringify(ABANDONED_CARTS_SEED)); return _abandonedCarts }
function _acSave(c) { _abandonedCarts = c }

export async function getAbandonedCarts({ status } = {}) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 200))
    let carts = _acInit()
    if (status && status !== 'all') carts = carts.filter(c => c.status === status)
    return { carts }
  }
  return request('GET', '/v1/mlm/admin/abandoned-carts', null, { status })
}

export async function sendCartRecoveryEmail(id, data) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 350))
    _acSave(_acInit().map(c => c.id === id ? {
      ...c,
      status: 'emailed',
      recoveryEmails: [...(c.recoveryEmails || []), { sentAt: new Date().toISOString(), template: 'Standard Recovery' }]
    } : c))
    return { ok: true }
  }
  return request('POST', `/v1/mlm/admin/abandoned-carts/${id}/recover`, data)
}

export async function deleteAbandonedCart(id, newStatus) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 150))
    _acSave(_acInit().map(c => c.id === id ? { ...c, status: newStatus } : c))
    return { ok: true }
  }
  return request('PATCH', `/v1/mlm/admin/abandoned-carts/${id}`, { status: newStatus })
}

// ── Member Address Book ─────────────────────────────────────────────────────
const ADDRESS_SEED = [
  {
    id: 'addr-001', label: 'Home', firstName: 'Gary', lastName: 'Granello',
    company: '', line1: 'Storgata 12', line2: '', city: 'Oslo',
    state: '', postcode: '0182', country: 'Norway', phone: '+47 912 34 567',
    isDefault: true,
  },
  {
    id: 'addr-002', label: 'Work', firstName: 'Gary', lastName: 'Granello',
    company: 'Nordic Vitals AS', line1: 'Karl Johans gate 25', line2: '3rd floor',
    city: 'Oslo', state: '', postcode: '0159', country: 'Norway', phone: '',
    isDefault: false,
  },
]
let _memberAddresses = null
function _maInit() { if (!_memberAddresses) _memberAddresses = JSON.parse(JSON.stringify(ADDRESS_SEED)); return _memberAddresses }
function _maSave(a) { _memberAddresses = a }

export async function getMemberAddresses() {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 160))
    return { addresses: _maInit() }
  }
  return request('GET', '/v1/mlm/member/addresses')
}

export async function createMemberAddress(data) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 200))
    const address = { id: `addr-${Date.now()}`, isDefault: _maInit().length === 0, ...data }
    _maSave([..._maInit(), address])
    return { address }
  }
  return request('POST', '/v1/mlm/member/addresses', data)
}

export async function updateMemberAddress(id, data) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 180))
    _maSave(_maInit().map(a => a.id === id ? { ...a, ...data } : a))
    return { ok: true }
  }
  return request('PUT', `/v1/mlm/member/addresses/${id}`, data)
}

export async function deleteMemberAddress(id) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 150))
    const remaining = _maInit().filter(a => a.id !== id)
    if (remaining.length > 0 && !remaining.some(a => a.isDefault)) {
      remaining[0].isDefault = true
    }
    _maSave(remaining)
    return { ok: true }
  }
  return request('DELETE', `/v1/mlm/member/addresses/${id}`)
}

export async function setDefaultAddress(id) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 150))
    _maSave(_maInit().map(a => ({ ...a, isDefault: a.id === id })))
    return { ok: true }
  }
  return request('POST', `/v1/mlm/member/addresses/${id}/set-default`)
}

// ── Surveys (admin + member) ─────────────────────────────────────────────────
const SURVEYS_SEED = [
  {
    id: 'sv-001',
    title: 'Product Satisfaction Q3 2026',
    description: 'Help us improve our product line by sharing your experience.',
    status: 'active',
    pointsReward: 50,
    createdAt: '2026-07-01',
    closesAt: '2026-08-31',
    targetSegment: 'all',
    responseCount: 142,
    completionRate: 78,
    avgTimeMinutes: 3,
    questions: [
      { id: 'q1', type: 'rating', text: 'How satisfied are you with our products overall?', scale: 5 },
      { id: 'q2', type: 'multiple', text: 'Which product do you use most often?', options: ['Arctic Omega-3', 'Nordic Collagen', 'Viking Vitality Stack', 'Immune Shield Pro', 'Other'] },
      { id: 'q3', type: 'text', text: 'What improvement would you most like to see?' },
      { id: 'q4', type: 'rating', text: 'How likely are you to recommend us to a friend?', scale: 5 },
    ],
  },
  {
    id: 'sv-002',
    title: 'Onboarding Experience Feedback',
    description: 'Tell us about your first 30 days as a Nordic Vitals member.',
    status: 'active',
    pointsReward: 30,
    createdAt: '2026-07-15',
    closesAt: '2026-09-15',
    targetSegment: 'new_members',
    responseCount: 58,
    completionRate: 91,
    avgTimeMinutes: 2,
    questions: [
      { id: 'q1', type: 'rating', text: 'How easy was it to get started?', scale: 5 },
      { id: 'q2', type: 'multiple', text: 'Which resource helped you most?', options: ['Training videos', 'Onboarding guide', 'My sponsor', 'Customer support', 'Community forum'] },
      { id: 'q3', type: 'text', text: 'What would have made your onboarding smoother?' },
    ],
  },
  {
    id: 'sv-003',
    title: 'MLM Compensation Plan Clarity',
    description: 'We want to ensure our compensation plan is clear and motivating.',
    status: 'active',
    pointsReward: 75,
    createdAt: '2026-08-01',
    closesAt: '2026-09-01',
    targetSegment: 'active_members',
    responseCount: 34,
    completionRate: 65,
    avgTimeMinutes: 5,
    questions: [
      { id: 'q1', type: 'rating', text: 'How clearly do you understand the compensation plan?', scale: 5 },
      { id: 'q2', type: 'multiple', text: 'Which aspect is most confusing?', options: ['Rank advancement thresholds', 'Commission calculation', 'Bonus qualifications', 'Binary/unilevel structure', 'Nothing – it is clear'] },
      { id: 'q3', type: 'rating', text: 'How motivating is the current plan for you?', scale: 5 },
      { id: 'q4', type: 'text', text: 'What one change would make the plan more attractive?' },
    ],
  },
  {
    id: 'sv-004',
    title: 'Platform UX Audit 2026',
    description: 'Rate the usability of our member dashboard and tools.',
    status: 'draft',
    pointsReward: 60,
    createdAt: '2026-08-05',
    closesAt: null,
    targetSegment: 'all',
    responseCount: 0,
    completionRate: 0,
    avgTimeMinutes: 4,
    questions: [
      { id: 'q1', type: 'rating', text: 'How easy is it to navigate the member dashboard?', scale: 5 },
      { id: 'q2', type: 'multiple', text: 'Which feature do you use most?', options: ['Network tree', 'Earnings tracker', 'Leaderboard', 'Training', 'Shop'] },
      { id: 'q3', type: 'text', text: 'Describe a feature you wish existed.' },
    ],
  },
  {
    id: 'sv-005',
    title: 'Event Satisfaction – Nordic Summit 2026',
    description: 'Feedback on the July Nordic Summit event.',
    status: 'closed',
    pointsReward: 40,
    createdAt: '2026-07-20',
    closesAt: '2026-08-05',
    targetSegment: 'event_attendees',
    responseCount: 89,
    completionRate: 95,
    avgTimeMinutes: 3,
    questions: [
      { id: 'q1', type: 'rating', text: 'How satisfied were you with the event overall?', scale: 5 },
      { id: 'q2', type: 'multiple', text: 'Which session was most valuable?', options: ['Keynote', 'Product deep-dive', 'MLM strategy workshop', 'Networking dinner', 'Training academy'] },
      { id: 'q3', type: 'text', text: 'What would you improve for next year?' },
    ],
  },
]

const MEMBER_SURVEY_RESPONSES_SEED = [
  { surveyId: 'sv-005', completedAt: '2026-08-02', pointsEarned: 40, answers: { q1: 4, q2: 'Keynote', q3: 'More networking time' } },
]

let _surveys = null
let _memberSurveyResponses = null
function _svInit() { if (!_surveys) _surveys = JSON.parse(JSON.stringify(SURVEYS_SEED)); return _surveys }
function _svSave(s) { _surveys = s }
function _msrInit() { if (!_memberSurveyResponses) _memberSurveyResponses = JSON.parse(JSON.stringify(MEMBER_SURVEY_RESPONSES_SEED)); return _memberSurveyResponses }

export async function getAdminSurveys({ status, segment } = {}) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 160))
    let surveys = _svInit()
    if (status && status !== 'all') surveys = surveys.filter(s => s.status === status)
    if (segment && segment !== 'all') surveys = surveys.filter(s => s.targetSegment === segment)
    return { surveys }
  }
  return request('GET', '/v1/mlm/admin/surveys', null, { status, segment })
}

export async function createSurvey(data) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 220))
    const s = { id: `sv-${Date.now()}`, responseCount: 0, completionRate: 0, avgTimeMinutes: 0, createdAt: new Date().toISOString().slice(0, 10), ...data }
    _svSave([..._svInit(), s])
    return { survey: s }
  }
  return request('POST', '/v1/mlm/admin/surveys', data)
}

export async function updateSurvey(id, data) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 180))
    _svSave(_svInit().map(s => s.id === id ? { ...s, ...data } : s))
    return { ok: true }
  }
  return request('PUT', `/v1/mlm/admin/surveys/${id}`, data)
}

export async function deleteSurvey(id) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 140))
    _svSave(_svInit().filter(s => s.id !== id))
    return { ok: true }
  }
  return request('DELETE', `/v1/mlm/admin/surveys/${id}`)
}

export async function getSurveyResponses(surveyId) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 200))
    const survey = _svInit().find(s => s.id === surveyId)
    if (!survey) return { responses: [], summary: {} }
    const mockSummary = {}
    survey.questions.forEach(q => {
      if (q.type === 'rating') {
        mockSummary[q.id] = { avg: (Math.random() * 1.5 + 3.2).toFixed(1), distribution: { 1: 2, 2: 5, 3: 18, 4: 45, 5: 30 } }
      } else if (q.type === 'multiple') {
        const dist = {}
        q.options.forEach((opt, i) => { dist[opt] = Math.floor(Math.random() * 40 + 5 + (i === 0 ? 20 : 0)) })
        mockSummary[q.id] = { distribution: dist }
      } else {
        mockSummary[q.id] = { sampleAnswers: ['Great product overall', 'Love the omega-3', 'Better packaging please', 'More subscription options', 'Faster shipping'] }
      }
    })
    return { survey, summary: mockSummary, totalResponses: survey.responseCount }
  }
  return request('GET', `/v1/mlm/admin/surveys/${surveyId}/responses`)
}

export async function getAvailableSurveys() {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 160))
    const completed = new Set(_msrInit().map(r => r.surveyId))
    const available = _svInit().filter(s => s.status === 'active' && !completed.has(s.id))
    const done = _svInit()
      .filter(s => completed.has(s.id))
      .map(s => ({ ...s, response: _msrInit().find(r => r.surveyId === s.id) }))
    return { available, completed: done }
  }
  return request('GET', '/v1/mlm/member/surveys')
}

export async function submitSurveyResponse(surveyId, answers) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 300))
    const survey = _svInit().find(s => s.id === surveyId)
    if (!survey) throw new Error('Survey not found')
    const resp = { surveyId, completedAt: new Date().toISOString(), pointsEarned: survey.pointsReward, answers }
    _msrInit().push(resp)
    _svSave(_svInit().map(s => s.id === surveyId ? { ...s, responseCount: s.responseCount + 1 } : s))
    return { ok: true, pointsEarned: survey.pointsReward }
  }
  return request('POST', `/v1/mlm/member/surveys/${surveyId}/respond`, { answers })
}

// ── Content Library ───────────────────────────────────────────────────────────
const CONTENT_SEED = [
  { id: 'ca-001', title: 'Nordic Vitals Brand Guidelines', category: 'brand', fileType: 'pdf', fileSizeMb: 4.2, access: 'all', downloads: 312, active: true, addedAt: '2026-06-01', description: 'Official brand colours, logos, typography, and usage rules.' },
  { id: 'ca-002', title: 'Compensation Plan PDF 2026', category: 'training', fileType: 'pdf', fileSizeMb: 1.8, access: 'all', downloads: 874, active: true, addedAt: '2026-06-10', description: 'Full comp plan breakdown with rank thresholds and bonus tables.' },
  { id: 'ca-003', title: 'Product Line Overview (Slides)', category: 'product', fileType: 'pptx', fileSizeMb: 7.6, access: 'all', downloads: 541, active: true, addedAt: '2026-06-15', description: 'Slide deck covering all product lines, key ingredients, and benefits.' },
  { id: 'ca-004', title: 'Omega-3 Clinical Study Summary', category: 'product', fileType: 'pdf', fileSizeMb: 0.9, access: 'silver', downloads: 203, active: true, addedAt: '2026-06-20', description: 'Summarised third-party clinical data on bioavailability.' },
  { id: 'ca-005', title: 'Prospect Outreach Scripts (EN)', category: 'marketing', fileType: 'docx', fileSizeMb: 0.4, access: 'all', downloads: 1024, active: true, addedAt: '2026-07-01', description: 'Proven cold-outreach scripts for social media and direct messaging.' },
  { id: 'ca-006', title: 'Social Media Content Pack Q3', category: 'marketing', fileType: 'zip', fileSizeMb: 38.5, access: 'all', downloads: 687, active: true, addedAt: '2026-07-05', description: '60 pre-sized social images for Instagram, Facebook, and TikTok.' },
  { id: 'ca-007', title: 'Leadership Academy — Module 1', category: 'training', fileType: 'mp4', fileSizeMb: 124.0, access: 'silver', downloads: 156, active: true, addedAt: '2026-07-10', description: 'Building your first 3 legs. 45-minute video walkthrough by top earners.' },
  { id: 'ca-008', title: 'Leadership Academy — Module 2', category: 'training', fileType: 'mp4', fileSizeMb: 98.0, access: 'gold', downloads: 89, active: true, addedAt: '2026-07-12', description: 'Rank advancement strategies and team duplication techniques.' },
  { id: 'ca-009', title: 'GDPR Compliance Checklist', category: 'compliance', fileType: 'pdf', fileSizeMb: 0.3, access: 'all', downloads: 94, active: true, addedAt: '2026-07-20', description: 'Step-by-step GDPR checklist for members operating in the EU.' },
  { id: 'ca-010', title: 'Autoship & Loyalty Explainer', category: 'product', fileType: 'pdf', fileSizeMb: 1.1, access: 'all', downloads: 258, active: true, addedAt: '2026-07-25', description: 'How autoship tiers, loyalty points, and bonus products work.' },
  { id: 'ca-011', title: 'Event Promo Kit – NordicSummit 2026', category: 'marketing', fileType: 'zip', fileSizeMb: 52.0, access: 'all', downloads: 143, active: true, addedAt: '2026-08-01', description: 'Banners, flyers, and email templates for the upcoming annual event.' },
  { id: 'ca-012', title: 'Diamond Circle Strategy Guide', category: 'training', fileType: 'pdf', fileSizeMb: 2.3, access: 'diamond', downloads: 31, active: true, addedAt: '2026-08-03', description: 'Advanced strategies shared exclusively with Diamond rank and above.' },
]

let _content = null
function _caInit() { if (!_content) _content = JSON.parse(JSON.stringify(CONTENT_SEED)); return _content }
function _caSave(c) { _content = c }

const MEMBER_DOWNLOADS_SEED = [
  { assetId: 'ca-001', downloadedAt: '2026-07-15T10:22:00Z' },
  { assetId: 'ca-002', downloadedAt: '2026-07-20T14:05:00Z' },
  { assetId: 'ca-005', downloadedAt: '2026-08-01T09:11:00Z' },
  { assetId: 'ca-006', downloadedAt: '2026-08-03T16:44:00Z' },
]

let _memberDownloads = null
function _mdInit() { if (!_memberDownloads) _memberDownloads = JSON.parse(JSON.stringify(MEMBER_DOWNLOADS_SEED)); return _memberDownloads }

export async function getAdminContent({ category, access } = {}) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 160))
    let assets = _caInit()
    if (category && category !== 'all') assets = assets.filter(a => a.category === category)
    if (access && access !== 'all') assets = assets.filter(a => a.access === access)
    return { assets }
  }
  return request('GET', '/v1/mlm/admin/content', null, { category, access })
}

export async function createContentAsset(data) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 280))
    const asset = { id: `ca-${Date.now()}`, downloads: 0, addedAt: new Date().toISOString().slice(0, 10), active: true, ...data }
    _caSave([..._caInit(), asset])
    return { asset }
  }
  return request('POST', '/v1/mlm/admin/content', data)
}

export async function updateContentAsset(id, data) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 180))
    _caSave(_caInit().map(a => a.id === id ? { ...a, ...data } : a))
    return { ok: true }
  }
  return request('PUT', `/v1/mlm/admin/content/${id}`, data)
}

export async function deleteContentAsset(id) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 140))
    _caSave(_caInit().filter(a => a.id !== id))
    return { ok: true }
  }
  return request('DELETE', `/v1/mlm/admin/content/${id}`)
}

export async function getMemberDownloads() {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 170))
    const memberRank = 'silver'
    const rankOrder = ['all', 'silver', 'gold', 'platinum', 'diamond']
    const memberRankIdx = rankOrder.indexOf(memberRank)
    const available = _caInit().filter(a => {
      if (!a.active) return false
      const reqIdx = rankOrder.indexOf(a.access)
      return memberRankIdx >= reqIdx
    })
    const downloaded = _mdInit()
    const downloadedSet = new Set(downloaded.map(d => d.assetId))
    return {
      available: available.map(a => ({ ...a, alreadyDownloaded: downloadedSet.has(a.id) })),
      history: downloaded.map(d => {
        const asset = _caInit().find(a => a.id === d.assetId)
        return { ...d, asset }
      }).filter(d => d.asset),
    }
  }
  return request('GET', '/v1/mlm/member/downloads')
}

export async function logDownload(assetId) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 100))
    if (!_mdInit().find(d => d.assetId === assetId)) {
      _mdInit().push({ assetId, downloadedAt: new Date().toISOString() })
    }
    _caSave(_caInit().map(a => a.id === assetId ? { ...a, downloads: a.downloads + 1 } : a))
    return { ok: true }
  }
  return request('POST', `/v1/mlm/member/downloads/${assetId}/log`, {})
}

// ── Admin Training Manager ────────────────────────────────────────────────────

const _tmKey = 'nv_admin_training_modules'

function _tmInit() {
  try {
    const s = localStorage.getItem(_tmKey)
    if (s) return JSON.parse(s)
  } catch {}
  const seed = TRAINING_MODULES.map((m, i) => ({
    ...m,
    status: 'active',
    requiredRank: ['all', 'bronze', 'silver', 'gold', 'platinum'][i % 5],
    completions: [38, 31, 24, 17, 11][i % 5],
    avgCompletionRate: [82, 74, 61, 49, 38][i % 5],
    createdAt: '2026-01-15',
    updatedAt: '2026-07-01',
  }))
  localStorage.setItem(_tmKey, JSON.stringify(seed))
  return seed
}
function _tmSave(d) { localStorage.setItem(_tmKey, JSON.stringify(d)) }

export async function getAdminTrainingModules() {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 180))
    return _tmInit()
  }
  return request('GET', '/v1/mlm/admin/training')
}

export async function createAdminTrainingModule(data) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 200))
    const mod = {
      ...data,
      id: `module-${Date.now()}`,
      lessons: [],
      completions: 0,
      avgCompletionRate: 0,
      createdAt: new Date().toISOString().slice(0, 10),
      updatedAt: new Date().toISOString().slice(0, 10),
    }
    _tmSave([..._tmInit(), mod])
    return mod
  }
  return request('POST', '/v1/mlm/admin/training', data)
}

export async function updateAdminTrainingModule(id, data) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 160))
    _tmSave(_tmInit().map(m => m.id === id ? { ...m, ...data, updatedAt: new Date().toISOString().slice(0, 10) } : m))
    return { ok: true }
  }
  return request('PUT', `/v1/mlm/admin/training/${id}`, data)
}

export async function deleteAdminTrainingModule(id) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 140))
    _tmSave(_tmInit().filter(m => m.id !== id))
    return { ok: true }
  }
  return request('DELETE', `/v1/mlm/admin/training/${id}`)
}

export async function addAdminTrainingLesson(moduleId, lesson) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 150))
    _tmSave(_tmInit().map(m => {
      if (m.id !== moduleId) return m
      return { ...m, lessons: [...m.lessons, { ...lesson, id: `l-${Date.now()}` }], updatedAt: new Date().toISOString().slice(0, 10) }
    }))
    return { ok: true }
  }
  return request('POST', `/v1/mlm/admin/training/${moduleId}/lessons`, lesson)
}

export async function updateAdminTrainingLesson(moduleId, lessonId, data) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 140))
    _tmSave(_tmInit().map(m => {
      if (m.id !== moduleId) return m
      return { ...m, lessons: m.lessons.map(l => l.id === lessonId ? { ...l, ...data } : l), updatedAt: new Date().toISOString().slice(0, 10) }
    }))
    return { ok: true }
  }
  return request('PUT', `/v1/mlm/admin/training/${moduleId}/lessons/${lessonId}`, data)
}

export async function deleteAdminTrainingLesson(moduleId, lessonId) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 130))
    _tmSave(_tmInit().map(m => {
      if (m.id !== moduleId) return m
      return { ...m, lessons: m.lessons.filter(l => l.id !== lessonId), updatedAt: new Date().toISOString().slice(0, 10) }
    }))
    return { ok: true }
  }
  return request('DELETE', `/v1/mlm/admin/training/${moduleId}/lessons/${lessonId}`)
}

// ── Admin Loyalty Config ──────────────────────────────────────────────────────

const _lcKey = 'nv_admin_loyalty_config'

const _lcSeed = {
  earnRules: [
    { id: 'er-purchase',   activity: 'Purchase',         description: 'Points per NOK spent on shop orders', rate: 1,    unit: 'pts / NOK', enabled: true },
    { id: 'er-autoship',   activity: 'Autoship Order',   description: '1.5× multiplier on autoship purchases', rate: 1.5, unit: 'multiplier', enabled: true },
    { id: 'er-recruit',    activity: 'New Recruit',       description: 'Flat bonus when a direct recruit activates', rate: 500, unit: 'pts flat', enabled: true },
    { id: 'er-training',   activity: 'Training Module',   description: 'Bonus on completing a training module (varies per module)', rate: 100, unit: 'pts base', enabled: true },
    { id: 'er-rank',       activity: 'Rank Advancement',  description: 'Flat bonus awarded on rank promotion', rate: 1000, unit: 'pts flat', enabled: true },
    { id: 'er-review',     activity: 'Product Review',    description: 'Bonus for submitting a verified product review', rate: 50,  unit: 'pts flat', enabled: true },
    { id: 'er-referral',   activity: 'Referral Conversion', description: 'Points when a referred lead makes their first purchase', rate: 200, unit: 'pts flat', enabled: true },
    { id: 'er-birthday',   activity: 'Birthday Bonus',    description: 'Annual birthday surprise (scales with tier)', rate: 250, unit: 'pts (Silver)', enabled: true },
    { id: 'er-challenge',  activity: 'Challenge Completion', description: 'Bonus on completing a monthly challenge', rate: 300, unit: 'pts flat', enabled: true },
    { id: 'er-survey',     activity: 'Survey Completion', description: 'Small bonus for completing platform surveys', rate: 25,  unit: 'pts flat', enabled: false },
  ],
  tiers: [
    { id: 'tier-bronze',   name: 'Bronze',   minPoints: 0,     maxPoints: 2499,  earnMultiplier: 1.0,  color: '#cd7f32', perks: ['1× earn rate', 'Birthday bonus 100 pts'] },
    { id: 'tier-silver',   name: 'Silver',   minPoints: 2500,  maxPoints: 7499,  earnMultiplier: 1.25, color: '#94a3b8', perks: ['1.25× earn rate', 'Free shipping >500 NOK', 'Birthday bonus 250 pts'] },
    { id: 'tier-gold',     name: 'Gold',     minPoints: 7500,  maxPoints: 19999, earnMultiplier: 1.5,  color: '#f59e0b', perks: ['1.5× earn rate', 'Free shipping always', 'Exclusive product access', 'Birthday bonus 500 pts'] },
    { id: 'tier-platinum', name: 'Platinum', minPoints: 20000, maxPoints: null,  earnMultiplier: 2.0,  color: '#a855f7', perks: ['2× earn rate', 'Free shipping always', 'Priority support', 'VIP product previews', 'Birthday bonus 1000 pts'] },
  ],
  expiryPolicy: {
    enabled: true,
    monthsToExpiry: 12,
    warningDaysBeforeExpiry: 30,
    expiryType: 'rolling',
  },
  redemptionOptions: LOYALTY_DATA.redeemOptions.map(o => ({ ...o, enabled: true })),
  stats: {
    totalActiveMembers: 312,
    totalPointsOutstanding: 1_248_500,
    totalPointsEarnedLastMonth: 87_400,
    totalPointsRedeemedLastMonth: 23_100,
    avgPointsPerMember: 4002,
    silverPct: 34,
    goldPct: 18,
    platinumPct: 6,
  },
}

function _lcInit() {
  try {
    const s = localStorage.getItem(_lcKey)
    if (s) return JSON.parse(s)
  } catch {}
  localStorage.setItem(_lcKey, JSON.stringify(_lcSeed))
  return _lcSeed
}
function _lcSave(d) { localStorage.setItem(_lcKey, JSON.stringify(d)) }

export async function getAdminLoyaltyConfig() {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 190))
    return _lcInit()
  }
  return request('GET', '/v1/mlm/admin/loyalty/config')
}

export async function updateEarnRule(id, data) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 150))
    const cfg = _lcInit()
    cfg.earnRules = cfg.earnRules.map(r => r.id === id ? { ...r, ...data } : r)
    _lcSave(cfg)
    return { ok: true }
  }
  return request('PUT', `/v1/mlm/admin/loyalty/earn-rules/${id}`, data)
}

export async function updateLoyaltyTier(id, data) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 150))
    const cfg = _lcInit()
    cfg.tiers = cfg.tiers.map(t => t.id === id ? { ...t, ...data } : t)
    _lcSave(cfg)
    return { ok: true }
  }
  return request('PUT', `/v1/mlm/admin/loyalty/tiers/${id}`, data)
}

export async function updateExpiryPolicy(data) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 130))
    const cfg = _lcInit()
    cfg.expiryPolicy = { ...cfg.expiryPolicy, ...data }
    _lcSave(cfg)
    return { ok: true }
  }
  return request('PUT', '/v1/mlm/admin/loyalty/expiry', data)
}

export async function createLoyaltyRedemptionOption(data) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 160))
    const cfg = _lcInit()
    const opt = { ...data, id: `opt-${Date.now()}`, enabled: true }
    cfg.redemptionOptions = [...cfg.redemptionOptions, opt]
    _lcSave(cfg)
    return opt
  }
  return request('POST', '/v1/mlm/admin/loyalty/redemption-options', data)
}

export async function updateLoyaltyRedemptionOption(id, data) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 140))
    const cfg = _lcInit()
    cfg.redemptionOptions = cfg.redemptionOptions.map(o => o.id === id ? { ...o, ...data } : o)
    _lcSave(cfg)
    return { ok: true }
  }
  return request('PUT', `/v1/mlm/admin/loyalty/redemption-options/${id}`, data)
}

export async function deleteLoyaltyRedemptionOption(id) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 120))
    const cfg = _lcInit()
    cfg.redemptionOptions = cfg.redemptionOptions.filter(o => o.id !== id)
    _lcSave(cfg)
    return { ok: true }
  }
  return request('DELETE', `/v1/mlm/admin/loyalty/redemption-options/${id}`)
}

// ── Price Lists ────────────────────────────────────────────────────────────────
const _plKey = 'nv_price_lists'
const _poKey = 'nv_price_overrides'
function _plInit() { try { const s = localStorage.getItem(_plKey); if (s) return JSON.parse(s) } catch {} localStorage.setItem(_plKey, JSON.stringify(PRICE_LISTS)); return PRICE_LISTS }
function _plSave(d) { localStorage.setItem(_plKey, JSON.stringify(d)) }
function _poInit() { try { const s = localStorage.getItem(_poKey); if (s) return JSON.parse(s) } catch {} localStorage.setItem(_poKey, JSON.stringify(PRICE_OVERRIDES)); return PRICE_OVERRIDES }
function _poSave(d) { localStorage.setItem(_poKey, JSON.stringify(d)) }

export async function getAdminPriceLists() {
  if (MOCK) { await new Promise(r => setTimeout(r, 180)); return _plInit() }
  return request('GET', '/v1/mlm/admin/price-lists')
}
export async function createAdminPriceList(data) {
  if (MOCK) { await new Promise(r => setTimeout(r, 180)); const pl = _plInit(); const n = { ...data, id: `pl-${Date.now()}`, memberCount: 0 }; pl.push(n); _plSave(pl); return n }
  return request('POST', '/v1/mlm/admin/price-lists', data)
}
export async function updateAdminPriceList(id, data) {
  if (MOCK) { await new Promise(r => setTimeout(r, 150)); const pl = _plInit().map(x => x.id === id ? { ...x, ...data } : x); _plSave(pl); return { ok: true } }
  return request('PUT', `/v1/mlm/admin/price-lists/${id}`, data)
}
export async function deleteAdminPriceList(id) {
  if (MOCK) { await new Promise(r => setTimeout(r, 130)); _plSave(_plInit().filter(x => x.id !== id)); return { ok: true } }
  return request('DELETE', `/v1/mlm/admin/price-lists/${id}`)
}
export async function getAdminPriceOverrides() {
  if (MOCK) { await new Promise(r => setTimeout(r, 170)); return _poInit() }
  return request('GET', '/v1/mlm/admin/price-overrides')
}
export async function setAdminPriceOverride(productId, listId, price) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 140))
    const rows = _poInit().map(r => {
      if (r.productId !== productId) return r
      const overrides = { ...r.overrides }
      if (price == null) delete overrides[listId]
      else overrides[listId] = price
      return { ...r, overrides }
    })
    _poSave(rows); return { ok: true }
  }
  return request('PUT', `/v1/mlm/admin/price-overrides/${productId}/${listId}`, { price })
}

// ── SMS / WhatsApp Campaigns ───────────────────────────────────────────────────
const _smsKey = 'nv_sms_campaigns'
function _smsInit() { try { const s = localStorage.getItem(_smsKey); if (s) return JSON.parse(s) } catch {} localStorage.setItem(_smsKey, JSON.stringify(SMS_CAMPAIGNS)); return SMS_CAMPAIGNS }
function _smsSave(d) { localStorage.setItem(_smsKey, JSON.stringify(d)) }

export async function getAdminSmsCampaigns() {
  if (MOCK) { await new Promise(r => setTimeout(r, 190)); return _smsInit() }
  return request('GET', '/v1/mlm/admin/sms-campaigns')
}
export async function getAdminSmsStats() {
  if (MOCK) { await new Promise(r => setTimeout(r, 130)); return SMS_STATS }
  return request('GET', '/v1/mlm/admin/sms-campaigns/stats')
}
export async function createAdminSmsCampaign(data) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 200))
    const campaigns = _smsInit()
    const n = { ...data, id: `sms-${Date.now()}`, status: data.sendNow ? 'sent' : (data.scheduledAt ? 'scheduled' : 'draft'), sentAt: data.sendNow ? new Date().toISOString() : null, stats: data.sendNow ? { sent: 0, delivered: 0, clicked: 0, optOut: 0 } : undefined }
    campaigns.unshift(n); _smsSave(campaigns); return n
  }
  return request('POST', '/v1/mlm/admin/sms-campaigns', data)
}
export async function updateAdminSmsCampaign(id, data) {
  if (MOCK) { await new Promise(r => setTimeout(r, 160)); _smsSave(_smsInit().map(x => x.id === id ? { ...x, ...data } : x)); return { ok: true } }
  return request('PUT', `/v1/mlm/admin/sms-campaigns/${id}`, data)
}
export async function deleteAdminSmsCampaign(id) {
  if (MOCK) { await new Promise(r => setTimeout(r, 130)); _smsSave(_smsInit().filter(x => x.id !== id)); return { ok: true } }
  return request('DELETE', `/v1/mlm/admin/sms-campaigns/${id}`)
}
export async function sendAdminSmsCampaign(id) {
  if (MOCK) { await new Promise(r => setTimeout(r, 800)); _smsSave(_smsInit().map(x => x.id === id ? { ...x, status: 'sent', sentAt: new Date().toISOString(), stats: { sent: Math.floor(Math.random() * 2000) + 200, delivered: Math.floor(Math.random() * 1900) + 190, clicked: Math.floor(Math.random() * 400) + 20, optOut: Math.floor(Math.random() * 20) } } : x)); return { ok: true } }
  return request('POST', `/v1/mlm/admin/sms-campaigns/${id}/send`)
}

// ── Member Vouchers ────────────────────────────────────────────────────────────
export async function getMemberVouchers() {
  if (MOCK) { await new Promise(r => setTimeout(r, 180)); return MEMBER_VOUCHERS }
  return request('GET', '/v1/mlm/member/vouchers')
}
export async function claimMemberVoucher(id) {
  if (MOCK) { await new Promise(r => setTimeout(r, 150)); return { ok: true } }
  return request('POST', `/v1/mlm/member/vouchers/${id}/claim`)
}

// ── Member Webinars ────────────────────────────────────────────────────────────
export async function getMemberWebinars() {
  if (MOCK) { await new Promise(r => setTimeout(r, 180)); return MEMBER_WEBINARS }
  return request('GET', '/v1/mlm/member/webinars')
}
export async function getMemberWebinarRecordings() {
  if (MOCK) { await new Promise(r => setTimeout(r, 160)); return MEMBER_WEBINAR_RECORDINGS }
  return request('GET', '/v1/mlm/member/webinars/recordings')
}
export async function registerMemberWebinar(id) {
  if (MOCK) { await new Promise(r => setTimeout(r, 300)); return { ok: true } }
  return request('POST', `/v1/mlm/member/webinars/${id}/register`)
}

// ── Admin Push Notifications ─────────────────────────────────────────────────
const _pushKey = 'nv_push_campaigns'
function _pushInit() { try { const s = localStorage.getItem(_pushKey); if (s) return JSON.parse(s) } catch {} localStorage.setItem(_pushKey, JSON.stringify(PUSH_CAMPAIGNS)); return PUSH_CAMPAIGNS }
function _pushSave(d) { localStorage.setItem(_pushKey, JSON.stringify(d)) }

export async function getAdminPushCampaigns() {
  if (MOCK) { await new Promise(r => setTimeout(r, 180)); return _pushInit() }
  return request('GET', '/v1/mlm/admin/push-campaigns')
}
export async function getAdminPushStats() {
  if (MOCK) { await new Promise(r => setTimeout(r, 130)); return PUSH_STATS }
  return request('GET', '/v1/mlm/admin/push-campaigns/stats')
}
export async function createAdminPushCampaign(data) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 200))
    const list = _pushInit()
    const n = { ...data, id: `push-${Date.now()}`, status: data.sendNow ? 'sent' : (data.scheduledAt ? 'scheduled' : 'draft'), sentAt: data.sendNow ? new Date().toISOString() : null, stats: data.sendNow ? { sent: 0, delivered: 0, clicked: 0, dismissed: 0 } : undefined }
    list.unshift(n); _pushSave(list); return n
  }
  return request('POST', '/v1/mlm/admin/push-campaigns', data)
}
export async function updateAdminPushCampaign(id, data) {
  if (MOCK) { await new Promise(r => setTimeout(r, 150)); _pushSave(_pushInit().map(x => x.id === id ? { ...x, ...data } : x)); return { ok: true } }
  return request('PUT', `/v1/mlm/admin/push-campaigns/${id}`, data)
}
export async function deleteAdminPushCampaign(id) {
  if (MOCK) { await new Promise(r => setTimeout(r, 130)); _pushSave(_pushInit().filter(x => x.id !== id)); return { ok: true } }
  return request('DELETE', `/v1/mlm/admin/push-campaigns/${id}`)
}
export async function sendAdminPushCampaign(id) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 600))
    const subs = Math.floor(Math.random() * 1500) + 500
    _pushSave(_pushInit().map(x => x.id === id ? { ...x, status: 'sent', sentAt: new Date().toISOString(), stats: { sent: subs, delivered: Math.floor(subs * 0.97), clicked: Math.floor(subs * 0.25), dismissed: Math.floor(subs * 0.18) } } : x))
    return { ok: true }
  }
  return request('POST', `/v1/mlm/admin/push-campaigns/${id}/send`)
}

// ── Member Payout Requests ───────────────────────────────────────────────────
const _payoutsKey = 'nv_member_payouts'
function _payoutsInit() { try { const s = localStorage.getItem(_payoutsKey); if (s) return JSON.parse(s) } catch {} localStorage.setItem(_payoutsKey, JSON.stringify(MEMBER_PAYOUTS)); return MEMBER_PAYOUTS }
function _payoutsSave(d) { localStorage.setItem(_payoutsKey, JSON.stringify(d)) }

export async function getMemberPayouts() {
  if (MOCK) { await new Promise(r => setTimeout(r, 180)); return _payoutsInit() }
  return request('GET', '/v1/mlm/member/payouts')
}
export async function requestMemberPayout(data) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 400))
    const list = _payoutsInit()
    const n = { ...data, id: `po-${Date.now()}`, status: 'processing', requestedAt: new Date().toISOString(), processedAt: null, ref: null }
    list.unshift(n); _payoutsSave(list); return n
  }
  return request('POST', '/v1/mlm/member/payouts', data)
}

// ── Admin API Keys ────────────────────────────────────────────────────────────
const _keysKey = 'nv_api_keys'
function _keysInit() { try { const s = localStorage.getItem(_keysKey); if (s) return JSON.parse(s) } catch {} localStorage.setItem(_keysKey, JSON.stringify(API_KEYS)); return API_KEYS }
function _keysSave(d) { localStorage.setItem(_keysKey, JSON.stringify(d)) }

export async function getAdminApiKeys() {
  if (MOCK) { await new Promise(r => setTimeout(r, 170)); return _keysInit() }
  return request('GET', '/v1/mlm/admin/api-keys')
}
export async function getAdminApiKeyStats() {
  if (MOCK) { await new Promise(r => setTimeout(r, 120)); return API_KEY_STATS }
  return request('GET', '/v1/mlm/admin/api-keys/stats')
}
export async function getAdminApiKeyScopes() {
  if (MOCK) { await new Promise(r => setTimeout(r, 100)); return API_KEY_SCOPES }
  return request('GET', '/v1/mlm/admin/api-keys/scopes')
}
export async function createAdminApiKey(data) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 250))
    const list = _keysInit()
    const raw = `nv_live_sk_${Math.random().toString(36).slice(2,8)}...${Math.random().toString(36).slice(2,6)}`
    const n = { ...data, id: `key-${Date.now()}`, preview: raw, status: 'active', createdAt: new Date().toISOString(), lastUsedAt: null, callsThisMonth: 0, _fullKey: raw }
    list.unshift(n); _keysSave(list); return n
  }
  return request('POST', '/v1/mlm/admin/api-keys', data)
}
export async function revokeAdminApiKey(id) {
  if (MOCK) { await new Promise(r => setTimeout(r, 200)); _keysSave(_keysInit().map(x => x.id === id ? { ...x, status: 'revoked' } : x)); return { ok: true } }
  return request('POST', `/v1/mlm/admin/api-keys/${id}/revoke`)
}
export async function deleteAdminApiKey(id) {
  if (MOCK) { await new Promise(r => setTimeout(r, 150)); _keysSave(_keysInit().filter(x => x.id !== id)); return { ok: true } }
  return request('DELETE', `/v1/mlm/admin/api-keys/${id}`)
}

// ── Admin Territories ─────────────────────────────────────────────────────────
const _terKey = 'nv_territories'
function _terInit() { try { const s = localStorage.getItem(_terKey); if (s) return JSON.parse(s) } catch {} localStorage.setItem(_terKey, JSON.stringify(TERRITORIES)); return TERRITORIES }
function _terSave(d) { localStorage.setItem(_terKey, JSON.stringify(d)) }

export async function getAdminTerritories() {
  if (MOCK) { await new Promise(r => setTimeout(r, 160)); return _terInit() }
  return request('GET', '/v1/mlm/admin/territories')
}
export async function createAdminTerritory(data) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 200))
    const list = _terInit()
    const n = { ...data, id: `ter-${Date.now()}`, memberCount: 0, revenue: 0, status: 'open', createdAt: new Date().toISOString() }
    list.push(n); _terSave(list); return n
  }
  return request('POST', '/v1/mlm/admin/territories', data)
}
export async function updateAdminTerritory(id, data) {
  if (MOCK) { await new Promise(r => setTimeout(r, 160)); _terSave(_terInit().map(x => x.id === id ? { ...x, ...data } : x)); return { ok: true } }
  return request('PUT', `/v1/mlm/admin/territories/${id}`, data)
}
export async function deleteAdminTerritory(id) {
  if (MOCK) { await new Promise(r => setTimeout(r, 140)); _terSave(_terInit().filter(x => x.id !== id)); return { ok: true } }
  return request('DELETE', `/v1/mlm/admin/territories/${id}`)
}

// ── Member Referral Links ─────────────────────────────────────────────────────
const _rlKey = 'nv_referral_links'
function _rlInit() { try { const s = localStorage.getItem(_rlKey); if (s) return JSON.parse(s) } catch {} localStorage.setItem(_rlKey, JSON.stringify(MEMBER_REFERRAL_LINKS)); return MEMBER_REFERRAL_LINKS }
function _rlSave(d) { localStorage.setItem(_rlKey, JSON.stringify(d)) }

export async function getMemberReferralLinks() {
  if (MOCK) { await new Promise(r => setTimeout(r, 160)); return _rlInit() }
  return request('GET', '/v1/mlm/member/referral-links')
}
export async function getMemberReferralLinkStats() {
  if (MOCK) { await new Promise(r => setTimeout(r, 120)); return MEMBER_REFERRAL_LINK_STATS }
  return request('GET', '/v1/mlm/member/referral-links/stats')
}
export async function createMemberReferralLink(data) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 220))
    const list = _rlInit()
    const n = { ...data, id: `rl-${Date.now()}`, url: `https://nordic-vitals.vercel.app/ref/${data.slug}`, clicks: 0, signups: 0, conversions: 0, revenueNok: 0, createdAt: new Date().toISOString(), lastClickAt: null }
    list.unshift(n); _rlSave(list); return n
  }
  return request('POST', '/v1/mlm/member/referral-links', data)
}
export async function deleteMemberReferralLink(id) {
  if (MOCK) { await new Promise(r => setTimeout(r, 140)); _rlSave(_rlInit().filter(x => x.id !== id)); return { ok: true } }
  return request('DELETE', `/v1/mlm/member/referral-links/${id}`)
}

// ── Member Achievements ───────────────────────────────────────────────────────
export async function getMemberAchievements() {
  if (MOCK) { await new Promise(r => setTimeout(r, 150)); return MEMBER_ACHIEVEMENTS }
  return request('GET', '/v1/mlm/member/achievements')
}

// ── Admin Influencer Program ──────────────────────────────────────────────────
const _infKey = 'nv_influencers'
function _infInit() { try { const s = localStorage.getItem(_infKey); if (s) return JSON.parse(s) } catch {} localStorage.setItem(_infKey, JSON.stringify(INFLUENCERS)); return INFLUENCERS }
function _infSave(d) { localStorage.setItem(_infKey, JSON.stringify(d)) }

export async function getAdminInfluencers() {
  if (MOCK) { await new Promise(r => setTimeout(r, 170)); return _infInit() }
  return request('GET', '/v1/mlm/admin/influencers')
}
export async function getAdminInfluencerStats() {
  if (MOCK) { await new Promise(r => setTimeout(r, 120)); return INFLUENCER_STATS }
  return request('GET', '/v1/mlm/admin/influencers/stats')
}
export async function getAdminInfluencerMeta() {
  if (MOCK) { await new Promise(r => setTimeout(r, 80)); return { tiers: INFLUENCER_TIERS, platforms: INFLUENCER_PLATFORMS } }
  return request('GET', '/v1/mlm/admin/influencers/meta')
}
export async function createAdminInfluencer(data) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 220))
    const list = _infInit()
    const n = { ...data, id: `inf-${Date.now()}`, totalSalesNok: 0, status: 'pending', joinedAt: new Date().toISOString(), lastPostAt: null, pendingPosts: 0 }
    list.unshift(n); _infSave(list); return n
  }
  return request('POST', '/v1/mlm/admin/influencers', data)
}
export async function updateAdminInfluencer(id, data) {
  if (MOCK) { await new Promise(r => setTimeout(r, 160)); _infSave(_infInit().map(x => x.id === id ? { ...x, ...data } : x)); return { ok: true } }
  return request('PUT', `/v1/mlm/admin/influencers/${id}`, data)
}
export async function deleteAdminInfluencer(id) {
  if (MOCK) { await new Promise(r => setTimeout(r, 140)); _infSave(_infInit().filter(x => x.id !== id)); return { ok: true } }
  return request('DELETE', `/v1/mlm/admin/influencers/${id}`)
}

// ── Member Commission Statements ──────────────────────────────────────────────
export async function getMemberCommissionStatements() {
  if (MOCK) { await new Promise(r => setTimeout(r, 160)); return COMMISSION_STATEMENTS }
  return request('GET', '/v1/mlm/member/commission-statements')
}
export async function getMemberCommissionStatementSummary() {
  if (MOCK) { await new Promise(r => setTimeout(r, 100)); return COMMISSION_STATEMENT_SUMMARY }
  return request('GET', '/v1/mlm/member/commission-statements/summary')
}

// ── Admin Product Categories ──────────────────────────────────────────────────
const PRODUCT_CATEGORIES = [
  { id: 'cat-1', name: 'Omega & Fish Oils', slug: 'omega-fish-oils', parentId: null, productCount: 8, sortOrder: 1, active: true, description: 'High-grade omega-3 and fish oil supplements', createdAt: '2025-09-01T00:00:00Z' },
  { id: 'cat-2', name: 'Vitamins & Minerals', slug: 'vitamins-minerals', parentId: null, productCount: 14, sortOrder: 2, active: true, description: 'Essential vitamins and mineral supplements', createdAt: '2025-09-01T00:00:00Z' },
  { id: 'cat-3', name: 'Protein & Amino Acids', slug: 'protein-amino', parentId: null, productCount: 6, sortOrder: 3, active: true, description: 'Protein powders and amino acid supplements', createdAt: '2025-09-01T00:00:00Z' },
  { id: 'cat-4', name: 'Weight Management', slug: 'weight-management', parentId: null, productCount: 5, sortOrder: 4, active: true, description: 'Supplements supporting healthy weight management', createdAt: '2025-09-10T00:00:00Z' },
  { id: 'cat-5', name: 'Immune Support', slug: 'immune-support', parentId: null, productCount: 7, sortOrder: 5, active: true, description: 'Supplements for immune system support', createdAt: '2025-09-10T00:00:00Z' },
  { id: 'cat-6', name: 'Vitamin D3 Variants', slug: 'vitamin-d3-variants', parentId: 'cat-2', productCount: 3, sortOrder: 1, active: true, description: 'Vitamin D3 in various forms and potencies', createdAt: '2025-10-01T00:00:00Z' },
  { id: 'cat-7', name: 'B-Complex Range', slug: 'b-complex', parentId: 'cat-2', productCount: 4, sortOrder: 2, active: true, description: 'Full spectrum B-vitamin complexes', createdAt: '2025-10-01T00:00:00Z' },
  { id: 'cat-8', name: 'Arctic Krill Oil', slug: 'arctic-krill', parentId: 'cat-1', productCount: 3, sortOrder: 1, active: true, description: 'Sustainably sourced Norwegian krill oil', createdAt: '2025-10-15T00:00:00Z' },
  { id: 'cat-9', name: 'Sports Performance', slug: 'sports-performance', parentId: null, productCount: 4, sortOrder: 6, active: false, description: 'Performance supplements for active lifestyles', createdAt: '2025-11-01T00:00:00Z' },
  { id: 'cat-10', name: 'Bundles & Kits', slug: 'bundles-kits', parentId: null, productCount: 5, sortOrder: 7, active: true, description: 'Curated supplement bundles and starter kits', createdAt: '2025-11-01T00:00:00Z' },
]
const _catKey = 'nv_categories'
function _catInit() { try { const s = localStorage.getItem(_catKey); if (s) return JSON.parse(s) } catch {} localStorage.setItem(_catKey, JSON.stringify(PRODUCT_CATEGORIES)); return PRODUCT_CATEGORIES }
function _catSave(d) { localStorage.setItem(_catKey, JSON.stringify(d)) }

export async function getAdminCategories() {
  if (MOCK) { await new Promise(r => setTimeout(r, 150)); return _catInit() }
  return request('GET', '/v1/mlm/admin/categories')
}
export async function createAdminCategory(data) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 200))
    const list = _catInit()
    const n = { ...data, id: `cat-${Date.now()}`, productCount: 0, createdAt: new Date().toISOString() }
    list.push(n); _catSave(list); return n
  }
  return request('POST', '/v1/mlm/admin/categories', data)
}
export async function updateAdminCategory(id, data) {
  if (MOCK) { await new Promise(r => setTimeout(r, 150)); _catSave(_catInit().map(x => x.id === id ? { ...x, ...data } : x)); return { ok: true } }
  return request('PUT', `/v1/mlm/admin/categories/${id}`, data)
}
export async function deleteAdminCategory(id) {
  if (MOCK) { await new Promise(r => setTimeout(r, 130)); _catSave(_catInit().filter(x => x.id !== id)); return { ok: true } }
  return request('DELETE', `/v1/mlm/admin/categories/${id}`)
}

// ── Admin Co-Op Advertising ───────────────────────────────────────────────────
const COOP_CLAIMS = [
  { id: 'coop-1', memberId: 'm-101', memberName: 'Ingrid Solvang', channel: 'instagram', amount: 2500, status: 'pending', description: 'Instagram story campaign for Omega-3 launch', submittedAt: '2026-07-28T10:00:00Z', reviewedAt: null, reviewedBy: null, rejectReason: null },
  { id: 'coop-2', memberId: 'm-102', memberName: 'Erik Thorvaldsen', channel: 'facebook', amount: 1800, status: 'approved', description: 'Facebook boosted post targeting 35-55 health-conscious', submittedAt: '2026-07-20T09:15:00Z', reviewedAt: '2026-07-22T11:30:00Z', reviewedBy: 'Admin', rejectReason: null },
  { id: 'coop-3', memberId: 'm-103', memberName: 'Lena Bergstrom', channel: 'google', amount: 4200, status: 'approved', description: 'Google Ads search campaign for vitamin D3', submittedAt: '2026-07-15T14:20:00Z', reviewedAt: '2026-07-17T09:00:00Z', reviewedBy: 'Admin', rejectReason: null },
  { id: 'coop-4', memberId: 'm-104', memberName: 'Lars Nygaard', channel: 'tiktok', amount: 3000, status: 'rejected', description: 'TikTok influencer partnership', submittedAt: '2026-07-10T16:45:00Z', reviewedAt: '2026-07-12T10:00:00Z', reviewedBy: 'Admin', rejectReason: 'Content did not comply with brand guidelines' },
  { id: 'coop-5', memberId: 'm-105', memberName: 'Anna Lindqvist', channel: 'instagram', amount: 1500, status: 'pending', description: 'Instagram reel series for weight management', submittedAt: '2026-08-01T08:30:00Z', reviewedAt: null, reviewedBy: null, rejectReason: null },
  { id: 'coop-6', memberId: 'm-106', memberName: 'Bjorn Haugen', channel: 'print', amount: 6500, status: 'approved', description: 'Local newspaper ad in Bergen and Stavanger', submittedAt: '2026-07-05T12:00:00Z', reviewedAt: '2026-07-07T15:00:00Z', reviewedBy: 'Admin', rejectReason: null },
]
const COOP_CONFIG = { totalBudgetNok: 500000, spentNok: 248600, pendingNok: 19000, matchRate: 50, maxClaimNok: 10000, minSalesRequiredNok: 20000, eligibleRanks: ['Silver', 'Gold', 'Platinum', 'Diamond'] }
const _coopKey = 'nv_coop_claims'
function _coopInit() { try { const s = localStorage.getItem(_coopKey); if (s) return JSON.parse(s) } catch {} localStorage.setItem(_coopKey, JSON.stringify(COOP_CLAIMS)); return COOP_CLAIMS }
function _coopSave(d) { localStorage.setItem(_coopKey, JSON.stringify(d)) }

export async function getAdminCoopClaims() {
  if (MOCK) { await new Promise(r => setTimeout(r, 160)); return _coopInit() }
  return request('GET', '/v1/mlm/admin/co-op/claims')
}
export async function getAdminCoopConfig() {
  if (MOCK) { await new Promise(r => setTimeout(r, 80)); return COOP_CONFIG }
  return request('GET', '/v1/mlm/admin/co-op/config')
}
export async function reviewAdminCoopClaim(id, decision) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 200))
    _coopSave(_coopInit().map(x => x.id === id ? { ...x, status: decision.approve ? 'approved' : 'rejected', reviewedAt: new Date().toISOString(), reviewedBy: 'Admin', rejectReason: decision.reason || null } : x))
    return { ok: true }
  }
  return request('POST', `/v1/mlm/admin/co-op/claims/${id}/review`, decision)
}
export async function updateAdminCoopConfig(data) {
  if (MOCK) { await new Promise(r => setTimeout(r, 150)); return { ok: true } }
  return request('PUT', '/v1/mlm/admin/co-op/config', data)
}

// ── Member My Coupons ─────────────────────────────────────────────────────────
const MEMBER_COUPONS = [
  { id: 'coup-1', code: 'WELCOME20', type: 'percent', value: 20, description: 'Welcome bonus — 20% off your next order', minOrderNok: 0, maxDiscountNok: null, expiresAt: '2026-12-31T23:59:59Z', usedAt: null, earnedFor: 'Onboarding completion' },
  { id: 'coup-2', code: 'LOYAL100', type: 'fixed', value: 100, description: 'Loyalty reward — NOK 100 off', minOrderNok: 500, maxDiscountNok: 100, expiresAt: '2026-09-30T23:59:59Z', usedAt: null, earnedFor: 'Loyalty milestone 500 pts' },
  { id: 'coup-3', code: 'BDAY15', type: 'percent', value: 15, description: 'Birthday month gift', minOrderNok: 0, maxDiscountNok: 200, expiresAt: '2026-08-31T23:59:59Z', usedAt: null, earnedFor: 'Birthday reward' },
  { id: 'coup-4', code: 'REFER50', type: 'fixed', value: 50, description: 'Referral reward coupon', minOrderNok: 300, maxDiscountNok: 50, expiresAt: '2026-10-15T23:59:59Z', usedAt: null, earnedFor: 'Referred Maja Strand' },
  { id: 'coup-5', code: 'SUMMER25', type: 'percent', value: 25, description: 'Summer campaign discount — used', minOrderNok: 0, maxDiscountNok: 500, expiresAt: '2026-07-31T23:59:59Z', usedAt: '2026-07-10T14:30:00Z', earnedFor: 'Summer promotion' },
]
export async function getMemberCoupons() {
  if (MOCK) { await new Promise(r => setTimeout(r, 140)); return MEMBER_COUPONS }
  return request('GET', '/v1/mlm/member/coupons')
}

// ── Member Co-Op Advertising ──────────────────────────────────────────────────
const MEMBER_COOP_SUMMARY = { balance: 4750, lifetimeEarned: 7250, lifetimeClaimed: 2500, pendingApproval: 800, eligibilityStatus: 'eligible', currentRank: 'Gold', matchRate: 50, maxClaimNok: 5000, nextLevelUnlocks: 'Platinum: 75% match rate' }
const MEMBER_COOP_CLAIMS = [
  { id: 'mcc-1', channel: 'instagram', amount: 1500, matched: 750, description: 'Instagram stories campaign for Omega-3', status: 'approved', submittedAt: '2026-07-01T10:00:00Z', reviewedAt: '2026-07-03T09:00:00Z' },
  { id: 'mcc-2', channel: 'facebook', amount: 1000, matched: 500, description: 'Boosted Facebook post — health supplements', status: 'approved', submittedAt: '2026-06-15T10:00:00Z', reviewedAt: '2026-06-17T10:00:00Z' },
  { id: 'mcc-3', channel: 'tiktok', amount: 800, matched: null, description: 'TikTok video about vitamins', status: 'pending', submittedAt: '2026-08-02T15:00:00Z', reviewedAt: null },
]
export async function getMemberCoopSummary() {
  if (MOCK) { await new Promise(r => setTimeout(r, 130)); return MEMBER_COOP_SUMMARY }
  return request('GET', '/v1/mlm/member/co-op/summary')
}
export async function getMemberCoopClaims() {
  if (MOCK) { await new Promise(r => setTimeout(r, 150)); return MEMBER_COOP_CLAIMS }
  return request('GET', '/v1/mlm/member/co-op/claims')
}
export async function submitMemberCoopClaim(data) {
  if (MOCK) { await new Promise(r => setTimeout(r, 250)); return { id: `mcc-${Date.now()}`, ...data, status: 'pending', submittedAt: new Date().toISOString(), reviewedAt: null, matched: null } }
  return request('POST', '/v1/mlm/member/co-op/claims', data)
}

// ── Branding & White-Label Config ─────────────────────────────────────────────
const BRANDING_DEFAULTS = {
  company_name: 'Nordic Vitals AS',
  trading_name: 'Nordic Vitals',
  tagline: 'Powered by Arctico',
  ceo_name: 'Bjørn Vidar Hauge',
  ceo_title: 'Founder & CEO',
  tech_partner: 'Arctico / Veriton',
  description: 'Nordic Vitals delivers science-backed supplements through a transparent, fair compensation model powered by Arctico\'s blockchain infrastructure.',
  org_number: '',
  vat_number: '',
  address: '',
  support_email: 'support@nordicvitals.no',
  email_sender_name: 'Nordic Vitals',
  logo_url: '',
  logo_dark_url: '',
  favicon_url: '',
  color_primary: '#c9a84c',
  color_accent: '#3b82f6',
  color_header_bg: '#0a0600',
  color_header_text: '#f5e6c8',
  website_url: 'https://nordic-vitals.vercel.app',
  platform_url: 'https://arctico.duckdns.org',
  social: { facebook: '', instagram: '', telegram: '', linkedin: '', twitter: '' },
  documents: {
    cert_issuer: 'Nordic Vitals AS, powered by Arctico / Veriton',
    cert_footer: 'Nordic Vitals AS · support@nordicvitals.no · Powered by Arctico / Veriton',
    signer1_name: 'Bjørn Vidar Hauge',
    signer1_title: 'Founder & CEO, Arctico / Veriton',
    signer2_name: 'Gary Granello',
    signer2_title: 'Managing Director, Nordic Vitals',
    invoice_footer: 'Nordic Vitals AS · support@nordicvitals.no',
    member_card_footer: 'nordicvitals.no · Powered by Arctico / Veriton',
    email_header_tagline: 'Science-backed supplements. Transparent earnings.',
  },
}

export async function getBrandingConfig() {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 120))
    const stored = localStorage.getItem('nv_branding_config')
    return stored ? { ...BRANDING_DEFAULTS, ...JSON.parse(stored) } : { ...BRANDING_DEFAULTS }
  }
  return request('GET', '/v1/mlm/admin/branding')
}

export async function saveBrandingConfig(cfg) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 200))
    localStorage.setItem('nv_branding_config', JSON.stringify(cfg))
    return cfg
  }
  return request('PUT', '/v1/mlm/admin/branding', cfg)
}

// ── Flash Sales ──────────────────────────────────────────────────────────────
const FLASH_SALES_SEED = [
  { id: 'fs1', title: 'Summer Protein Blast', discount: 25, discountType: 'percent', products: ['Whey Pro 1kg', 'BCAA Matrix'], stockLimit: 200, sold: 147, startsAt: '2026-08-07T08:00:00Z', endsAt: '2026-08-07T20:00:00Z', status: 'active' },
  { id: 'fs2', title: 'Collagen Bundle Deal', discount: 150, discountType: 'fixed', products: ['Marine Collagen 300g'], stockLimit: 100, sold: 98, startsAt: '2026-08-06T10:00:00Z', endsAt: '2026-08-06T22:00:00Z', status: 'expired' },
  { id: 'fs3', title: 'Back to Basics Omega', discount: 30, discountType: 'percent', products: ['Omega-3 Gold', 'Vitamin D3 5000IU'], stockLimit: 500, sold: 0, startsAt: '2026-08-10T09:00:00Z', endsAt: '2026-08-10T23:59:00Z', status: 'scheduled' },
  { id: 'fs4', title: 'New Member Welcome Pack', discount: 20, discountType: 'percent', products: ['Starter Bundle'], stockLimit: 300, sold: 0, startsAt: '2026-08-15T00:00:00Z', endsAt: '2026-08-15T23:59:00Z', status: 'draft' },
]
export async function getAdminFlashSales() {
  if (MOCK) { await new Promise(r => setTimeout(r, 180)); return JSON.parse(localStorage.getItem('nv_flash_sales') || JSON.stringify(FLASH_SALES_SEED)) }
  return request('GET', '/v1/mlm/admin/flash-sales')
}
export async function createAdminFlashSale(data) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 200))
    const list = JSON.parse(localStorage.getItem('nv_flash_sales') || JSON.stringify(FLASH_SALES_SEED))
    const item = { ...data, id: 'fs' + Date.now(), sold: 0, status: data.status || 'draft' }
    localStorage.setItem('nv_flash_sales', JSON.stringify([...list, item]))
    return item
  }
  return request('POST', '/v1/mlm/admin/flash-sales', data)
}
export async function updateAdminFlashSale(id, data) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 180))
    const list = JSON.parse(localStorage.getItem('nv_flash_sales') || JSON.stringify(FLASH_SALES_SEED))
    const updated = list.map(s => s.id === id ? { ...s, ...data } : s)
    localStorage.setItem('nv_flash_sales', JSON.stringify(updated))
    return updated.find(s => s.id === id)
  }
  return request('PUT', `/v1/mlm/admin/flash-sales/${id}`, data)
}
export async function deleteAdminFlashSale(id) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 150))
    const list = JSON.parse(localStorage.getItem('nv_flash_sales') || JSON.stringify(FLASH_SALES_SEED))
    localStorage.setItem('nv_flash_sales', JSON.stringify(list.filter(s => s.id !== id)))
    return { ok: true }
  }
  return request('DELETE', `/v1/mlm/admin/flash-sales/${id}`)
}

// ── Admin Digital Products ────────────────────────────────────────────────────
const DIGITAL_PRODUCTS_SEED = [
  { id: 'dp1', title: 'Nordic Nutrition Guide 2026', type: 'ebook', fileSize: '4.2 MB', format: 'PDF', price: 0, accessLevel: 'all', downloads: 1240, status: 'active', createdAt: '2026-01-15T10:00:00Z' },
  { id: 'dp2', 'title': 'MLM Success Masterclass (12 videos)', type: 'course', fileSize: '1.8 GB', format: 'MP4', price: 499, accessLevel: 'member', downloads: 387, status: 'active', createdAt: '2026-02-20T10:00:00Z' },
  { id: 'dp3', title: 'Peptide Science Deep Dive', type: 'ebook', fileSize: '6.1 MB', format: 'PDF', price: 0, accessLevel: 'silver', downloads: 892, status: 'active', createdAt: '2026-03-10T10:00:00Z' },
  { id: 'dp4', title: 'Business Builder Toolkit', type: 'bundle', fileSize: '120 MB', format: 'ZIP', price: 299, accessLevel: 'member', downloads: 204, status: 'active', createdAt: '2026-04-05T10:00:00Z' },
  { id: 'dp5', title: 'Leadership Training Series (Q1)', type: 'course', fileSize: '2.4 GB', format: 'MP4', price: 0, accessLevel: 'gold', downloads: 134, status: 'draft', createdAt: '2026-07-01T10:00:00Z' },
]
export async function getAdminDigitalProducts() {
  if (MOCK) { await new Promise(r => setTimeout(r, 180)); return JSON.parse(localStorage.getItem('nv_digital_products') || JSON.stringify(DIGITAL_PRODUCTS_SEED)) }
  return request('GET', '/v1/mlm/admin/digital-products')
}
export async function createAdminDigitalProduct(data) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 200))
    const list = JSON.parse(localStorage.getItem('nv_digital_products') || JSON.stringify(DIGITAL_PRODUCTS_SEED))
    const item = { ...data, id: 'dp' + Date.now(), downloads: 0, createdAt: new Date().toISOString() }
    localStorage.setItem('nv_digital_products', JSON.stringify([...list, item]))
    return item
  }
  return request('POST', '/v1/mlm/admin/digital-products', data)
}
export async function updateAdminDigitalProduct(id, data) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 180))
    const list = JSON.parse(localStorage.getItem('nv_digital_products') || JSON.stringify(DIGITAL_PRODUCTS_SEED))
    const updated = list.map(p => p.id === id ? { ...p, ...data } : p)
    localStorage.setItem('nv_digital_products', JSON.stringify(updated))
    return updated.find(p => p.id === id)
  }
  return request('PUT', `/v1/mlm/admin/digital-products/${id}`, data)
}
export async function deleteAdminDigitalProduct(id) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 150))
    const list = JSON.parse(localStorage.getItem('nv_digital_products') || JSON.stringify(DIGITAL_PRODUCTS_SEED))
    localStorage.setItem('nv_digital_products', JSON.stringify(list.filter(p => p.id !== id)))
    return { ok: true }
  }
  return request('DELETE', `/v1/mlm/admin/digital-products/${id}`)
}

// ── Member Digital Products ───────────────────────────────────────────────────
const MEMBER_DIGITAL_SEED = [
  { id: 'mdp1', title: 'Nordic Nutrition Guide 2026', type: 'ebook', fileSize: '4.2 MB', format: 'PDF', accessLevel: 'all', downloadedAt: null, purchasedAt: '2026-01-20T10:00:00Z', price: 0 },
  { id: 'mdp2', title: 'MLM Success Masterclass (12 videos)', type: 'course', fileSize: '1.8 GB', format: 'MP4', accessLevel: 'member', downloadedAt: '2026-03-15T14:00:00Z', purchasedAt: '2026-02-25T10:00:00Z', price: 499 },
  { id: 'mdp3', title: 'Peptide Science Deep Dive', type: 'ebook', fileSize: '6.1 MB', format: 'PDF', accessLevel: 'silver', downloadedAt: null, purchasedAt: '2026-04-10T10:00:00Z', price: 0 },
]
export async function getMemberDigitalProducts() {
  if (MOCK) { await new Promise(r => setTimeout(r, 180)); return MEMBER_DIGITAL_SEED }
  return request('GET', '/v1/mlm/member/digital-products')
}
export async function downloadMemberDigitalProduct(id) {
  if (MOCK) { await new Promise(r => setTimeout(r, 300)); return { url: '#', expires: new Date(Date.now() + 600000).toISOString() } }
  return request('POST', `/v1/mlm/member/digital-products/${id}/download`)
}

// ── Member Team Goals ─────────────────────────────────────────────────────────
const TEAM_GOALS_SEED = {
  teamName: 'Team Nordic Alpha',
  goals: [
    { id: 'tg1', title: 'August Recruiting Drive', metric: 'new_members', target: 50, current: 31, unit: 'members', deadline: '2026-08-31', status: 'on_track' },
    { id: 'tg2', title: 'Q3 Team Volume', metric: 'team_volume', target: 500000, current: 342180, unit: 'NOK', deadline: '2026-09-30', status: 'on_track' },
    { id: 'tg3', title: 'Gold Rank Promotions', metric: 'rank_ups', target: 5, current: 2, deadline: '2026-08-31', unit: 'members', status: 'behind' },
    { id: 'tg4', title: 'Customer Retention Rate', metric: 'retention', target: 80, current: 74, unit: '%', deadline: '2026-08-31', status: 'behind' },
    { id: 'tg5', title: 'Training Completion', metric: 'training', target: 100, current: 100, unit: '%', deadline: '2026-07-31', status: 'completed' },
  ],
  topContributors: [
    { name: 'Anna Berg', recruits: 8, volume: 68400, rank: 'Gold' },
    { name: 'Lars Eriksen', recruits: 6, volume: 52100, rank: 'Silver' },
    { name: 'Mia Svensson', recruits: 5, volume: 47800, rank: 'Silver' },
    { name: 'Tor Halvorsen', recruits: 4, volume: 39200, rank: 'Bronze' },
  ],
}
export async function getMemberTeamGoals() {
  if (MOCK) { await new Promise(r => setTimeout(r, 180)); return TEAM_GOALS_SEED }
  return request('GET', '/v1/mlm/member/team-goals')
}

// ─── Admin Waitlists ──────────────────────────────────────────────────────────
const ADMIN_WAITLISTS_SEED = [
  { productId: 'p1', productName: 'Arctic Omega-3 Ultra (300 caps)', sku: 'AO3-300', entries: 47, oldestEntry: '2026-07-01T08:00:00Z', status: 'out_of_stock', restockEta: '2026-08-15' },
  { productId: 'p2', productName: 'Viking Collagen Peptides 1kg', sku: 'VCP-1KG', entries: 23, oldestEntry: '2026-07-12T10:30:00Z', status: 'out_of_stock', restockEta: '2026-08-10' },
  { productId: 'p3', productName: 'Nordic Vitals Starter Kit', sku: 'NV-START', entries: 88, oldestEntry: '2026-06-20T14:00:00Z', status: 'notified', restockEta: null },
  { productId: 'p4', productName: 'Bjornberry Antioxidant Complex', sku: 'BAC-60', entries: 12, oldestEntry: '2026-07-28T09:15:00Z', status: 'out_of_stock', restockEta: '2026-09-01' },
  { productId: 'p5', productName: 'Arctic Magnesium Night Formula', sku: 'AMN-90', entries: 34, oldestEntry: '2026-07-05T16:45:00Z', status: 'out_of_stock', restockEta: null },
]
const ADMIN_WAITLIST_ENTRIES_SEED = [
  { id: 'we1', name: 'Anna Berg', email: 'anna.berg@email.no', joinedAt: '2026-07-01T08:00:00Z', notified: false },
  { id: 'we2', name: 'Lars Eriksen', email: 'lars.eriksen@email.no', joinedAt: '2026-07-03T11:20:00Z', notified: false },
  { id: 'we3', name: 'Mia Svensson', email: 'mia.svensson@email.se', joinedAt: '2026-07-09T14:50:00Z', notified: false },
  { id: 'we4', name: 'Tor Halvorsen', email: 'tor.h@email.no', joinedAt: '2026-07-15T09:30:00Z', notified: false },
  { id: 'we5', name: 'Ingrid Olsen', email: 'ingrid.o@email.no', joinedAt: '2026-07-22T16:00:00Z', notified: false },
]
export async function getAdminWaitlists() {
  if (MOCK) { await new Promise(r => setTimeout(r, 200)); return ADMIN_WAITLISTS_SEED }
  return request('GET', '/v1/mlm/admin/waitlists')
}
export async function getAdminWaitlistEntries(productId) {
  if (MOCK) { await new Promise(r => setTimeout(r, 150)); return ADMIN_WAITLIST_ENTRIES_SEED }
  return request('GET', `/v1/mlm/admin/waitlists/${productId}/entries`)
}
export async function notifyAdminWaitlist(productId) {
  if (MOCK) { await new Promise(r => setTimeout(r, 600)); return { notified: ADMIN_WAITLIST_ENTRIES_SEED.length } }
  return request('POST', `/v1/mlm/admin/waitlists/${productId}/notify`)
}
export async function removeAdminWaitlistEntry(productId, entryId) {
  if (MOCK) { await new Promise(r => setTimeout(r, 200)); return { ok: true } }
  return request('DELETE', `/v1/mlm/admin/waitlists/${productId}/entries/${entryId}`)
}

// ─── Admin Seasonal Campaigns ─────────────────────────────────────────────────
const SEASONAL_CAMPAIGNS_SEED = [
  { id: 'sc1', name: 'Viking Summer Solstice', season: 'summer', startsAt: '2026-06-21T00:00:00Z', endsAt: '2026-06-28T23:59:00Z', discountPct: 20, targetAudience: 'all', promoCode: 'SOLSTICE20', status: 'completed', revenue: 184200 },
  { id: 'sc2', name: 'Arctic Midnight Sun Sale', season: 'summer', startsAt: '2026-07-15T00:00:00Z', endsAt: '2026-07-22T23:59:00Z', discountPct: 15, targetAudience: 'members', promoCode: 'MIDNIGHT15', status: 'completed', revenue: 127400 },
  { id: 'sc3', name: 'Back to Vitality (Autumn)', season: 'autumn', startsAt: '2026-09-01T00:00:00Z', endsAt: '2026-09-14T23:59:00Z', discountPct: 25, targetAudience: 'all', promoCode: 'AUTUMN25', status: 'scheduled', revenue: 0 },
  { id: 'sc4', name: 'Nordic Winter Warrior', season: 'winter', startsAt: '2026-12-01T00:00:00Z', endsAt: '2026-12-31T23:59:00Z', discountPct: 30, targetAudience: 'vip', promoCode: 'WARRIOR30', status: 'draft', revenue: 0 },
  { id: 'sc5', name: 'New Year New You 2027', season: 'winter', startsAt: '2027-01-01T00:00:00Z', endsAt: '2027-01-14T23:59:00Z', discountPct: 20, targetAudience: 'all', promoCode: 'NEWYOU27', status: 'draft', revenue: 0 },
]
export async function getAdminSeasonalCampaigns() {
  if (MOCK) { await new Promise(r => setTimeout(r, 200)); return SEASONAL_CAMPAIGNS_SEED }
  return request('GET', '/v1/mlm/admin/seasonal-campaigns')
}
export async function createAdminSeasonalCampaign(data) {
  if (MOCK) { await new Promise(r => setTimeout(r, 400)); return { id: 'sc_new', ...data } }
  return request('POST', '/v1/mlm/admin/seasonal-campaigns', data)
}
export async function updateAdminSeasonalCampaign(id, data) {
  if (MOCK) { await new Promise(r => setTimeout(r, 300)); return { id, ...data } }
  return request('PUT', `/v1/mlm/admin/seasonal-campaigns/${id}`, data)
}
export async function deleteAdminSeasonalCampaign(id) {
  if (MOCK) { await new Promise(r => setTimeout(r, 250)); return { ok: true } }
  return request('DELETE', `/v1/mlm/admin/seasonal-campaigns/${id}`)
}

// ─── Member Waitlists ─────────────────────────────────────────────────────────
const MEMBER_WAITLISTS_SEED = [
  { productId: 'p1', productName: 'Arctic Omega-3 Ultra (300 caps)', sku: 'AO3-300', imgUrl: null, joinedAt: '2026-07-10T09:00:00Z', position: 8, totalWaiting: 47, restockEta: '2026-08-15', notifyMe: true },
  { productId: 'p4', productName: 'Bjornberry Antioxidant Complex', sku: 'BAC-60', imgUrl: null, joinedAt: '2026-07-28T09:15:00Z', position: 3, totalWaiting: 12, restockEta: '2026-09-01', notifyMe: true },
  { productId: 'p5', productName: 'Arctic Magnesium Night Formula', sku: 'AMN-90', imgUrl: null, joinedAt: '2026-07-18T11:30:00Z', position: 14, totalWaiting: 34, restockEta: null, notifyMe: false },
]
export async function getMemberWaitlists() {
  if (MOCK) { await new Promise(r => setTimeout(r, 200)); return MEMBER_WAITLISTS_SEED }
  return request('GET', '/v1/mlm/member/waitlists')
}
export async function removeMemberWaitlist(productId) {
  if (MOCK) { await new Promise(r => setTimeout(r, 250)); return { ok: true } }
  return request('DELETE', `/v1/mlm/member/waitlists/${productId}`)
}
export async function toggleMemberWaitlistNotify(productId, notify) {
  if (MOCK) { await new Promise(r => setTimeout(r, 200)); return { ok: true } }
  return request('PATCH', `/v1/mlm/member/waitlists/${productId}`, { notifyMe: notify })
}

// ─── Member Rank History ──────────────────────────────────────────────────────
const MEMBER_RANK_HISTORY_SEED = {
  currentRank: 'Gold',
  currentPoints: 42800,
  nextRank: 'Platinum',
  nextPoints: 75000,
  history: [
    { month: '2025-10', rank: 'Bronze', points: 8200, commissions: 4100, recruits: 2 },
    { month: '2025-11', rank: 'Bronze', points: 11400, commissions: 5700, recruits: 1 },
    { month: '2025-12', rank: 'Silver', points: 16800, commissions: 8400, recruits: 3 },
    { month: '2026-01', rank: 'Silver', points: 21300, commissions: 10650, recruits: 2 },
    { month: '2026-02', rank: 'Silver', points: 25900, commissions: 12950, recruits: 2 },
    { month: '2026-03', rank: 'Silver', points: 28400, commissions: 14200, recruits: 1 },
    { month: '2026-04', rank: 'Gold', points: 33100, commissions: 16550, recruits: 4 },
    { month: '2026-05', rank: 'Gold', points: 36700, commissions: 18350, recruits: 2 },
    { month: '2026-06', rank: 'Gold', points: 39200, commissions: 19600, recruits: 3 },
    { month: '2026-07', rank: 'Gold', points: 42800, commissions: 21400, recruits: 2 },
  ],
  milestones: [
    { date: '2025-12-01', event: 'Reached Silver', icon: '🥈' },
    { date: '2026-04-01', event: 'Reached Gold', icon: '🥇' },
    { date: '2026-04-15', event: 'First 5-figure commission month', icon: '💰' },
  ],
}
export async function getMemberRankHistory() {
  if (MOCK) { await new Promise(r => setTimeout(r, 220)); return MEMBER_RANK_HISTORY_SEED }
  return request('GET', '/v1/mlm/member/rank-history')
}

// ─── Admin Vendor Management ──────────────────────────────────────────────────
const ADMIN_VENDORS_SEED = [
  { id: 'v1', name: 'Arctic Naturals Supply Co.', contact: 'procurement@arcticnaturals.no', country: 'Norway', products: 12, status: 'active', paymentTerms: 'Net 30', leadDays: 14, createdAt: '2025-01-10' },
  { id: 'v2', name: 'Nordic BioLab AS', contact: 'orders@nordicbiolab.no', country: 'Norway', products: 7, status: 'active', paymentTerms: 'Net 45', leadDays: 21, createdAt: '2025-03-15' },
  { id: 'v3', name: 'FjordFarm Organics', contact: 'trade@fjordfarm.no', country: 'Norway', products: 5, status: 'active', paymentTerms: 'Net 30', leadDays: 10, createdAt: '2025-06-01' },
  { id: 'v4', name: 'Boreal Ingredients Ltd', contact: 'sales@borealIngr.uk', country: 'United Kingdom', products: 3, status: 'inactive', paymentTerms: 'Net 60', leadDays: 28, createdAt: '2024-11-20' },
  { id: 'v5', name: 'Scandinavian Herbs GmbH', contact: 'einkauf@scanherbs.de', country: 'Germany', products: 9, status: 'active', paymentTerms: 'Net 30', leadDays: 18, createdAt: '2025-02-08' },
]
export async function getAdminVendors() {
  if (MOCK) { await new Promise(r => setTimeout(r, 200)); return ADMIN_VENDORS_SEED }
  return request('GET', '/v1/mlm/admin/vendors')
}
export async function createAdminVendor(data) {
  if (MOCK) { await new Promise(r => setTimeout(r, 350)); return { id: 'v_new', ...data, products: 0, createdAt: new Date().toISOString().slice(0,10) } }
  return request('POST', '/v1/mlm/admin/vendors', data)
}
export async function updateAdminVendor(id, data) {
  if (MOCK) { await new Promise(r => setTimeout(r, 300)); return { id, ...data } }
  return request('PUT', `/v1/mlm/admin/vendors/${id}`, data)
}
export async function deleteAdminVendor(id) {
  if (MOCK) { await new Promise(r => setTimeout(r, 250)); return { ok: true } }
  return request('DELETE', `/v1/mlm/admin/vendors/${id}`)
}

// ─── Admin Live Streams ────────────────────────────────────────────────────────
const ADMIN_LIVE_STREAMS_SEED = [
  { id: 'ls1', title: 'August Product Launch — New Omega-3 Line', host: 'Bjørn Håkon', scheduledAt: '2026-08-12T18:00:00Z', status: 'scheduled', viewers: 0, platform: 'YouTube', registrations: 312 },
  { id: 'ls2', title: 'Weekly Business Opportunity Webinar', host: 'Ingrid Solberg', scheduledAt: '2026-08-08T15:00:00Z', status: 'live', viewers: 847, platform: 'Zoom', registrations: 920 },
  { id: 'ls3', title: 'July Flash Sale — Members Only', host: 'Erik Nygård', scheduledAt: '2026-07-25T12:00:00Z', status: 'ended', viewers: 1204, platform: 'YouTube', registrations: 1350 },
  { id: 'ls4', title: 'Training: Advanced Network Building', host: 'Bjørn Håkon', scheduledAt: '2026-07-18T17:00:00Z', status: 'ended', viewers: 689, platform: 'Zoom', registrations: 740 },
  { id: 'ls5', title: 'Q3 Results & Recognition Ceremony', host: 'Ingrid Solberg', scheduledAt: '2026-08-20T19:00:00Z', status: 'scheduled', viewers: 0, platform: 'YouTube', registrations: 204 },
]
export async function getAdminLiveStreams() {
  if (MOCK) { await new Promise(r => setTimeout(r, 200)); return ADMIN_LIVE_STREAMS_SEED }
  return request('GET', '/v1/mlm/admin/live-streams')
}
export async function createAdminLiveStream(data) {
  if (MOCK) { await new Promise(r => setTimeout(r, 380)); return { id: 'ls_new', ...data, viewers: 0, registrations: 0 } }
  return request('POST', '/v1/mlm/admin/live-streams', data)
}
export async function updateAdminLiveStream(id, data) {
  if (MOCK) { await new Promise(r => setTimeout(r, 300)); return { id, ...data } }
  return request('PUT', `/v1/mlm/admin/live-streams/${id}`, data)
}
export async function deleteAdminLiveStream(id) {
  if (MOCK) { await new Promise(r => setTimeout(r, 250)); return { ok: true } }
  return request('DELETE', `/v1/mlm/admin/live-streams/${id}`)
}

// ─── Admin Tax Documents ───────────────────────────────────────────────────────
const ADMIN_TAX_DOCS_SEED = [
  { id: 'td1', memberId: 'm1', memberName: 'Sigrid Andersen', type: '1099-NEC', taxYear: 2025, amount: 48200, status: 'sent', sentAt: '2026-01-31', downloaded: true },
  { id: 'td2', memberId: 'm2', memberName: 'Lars Eriksen', type: '1099-NEC', taxYear: 2025, amount: 29700, status: 'sent', sentAt: '2026-01-31', downloaded: false },
  { id: 'td3', memberId: 'm3', memberName: 'Marte Johansen', type: 'W-9', taxYear: 2025, amount: null, status: 'pending', sentAt: null, downloaded: false },
  { id: 'td4', memberId: 'm4', memberName: 'Petter Dahl', type: '1099-NEC', taxYear: 2025, amount: 81500, status: 'sent', sentAt: '2026-01-31', downloaded: true },
  { id: 'td5', memberId: 'm5', memberName: 'Hanne Kristiansen', type: '1099-NEC', taxYear: 2025, amount: 15400, status: 'draft', sentAt: null, downloaded: false },
  { id: 'td6', memberId: 'm6', memberName: 'Olav Berg', type: 'W-9', taxYear: 2025, amount: null, status: 'sent', sentAt: '2026-01-15', downloaded: true },
]
export async function getAdminTaxDocs(year) {
  if (MOCK) { await new Promise(r => setTimeout(r, 220)); return ADMIN_TAX_DOCS_SEED.filter(d => !year || d.taxYear === year) }
  return request('GET', `/v1/mlm/admin/tax-docs${year ? `?year=${year}` : ''}`)
}
export async function generateAdminTaxDoc(memberId, type, year) {
  if (MOCK) { await new Promise(r => setTimeout(r, 600)); return { ok: true, id: 'td_new' } }
  return request('POST', '/v1/mlm/admin/tax-docs/generate', { memberId, type, year })
}
export async function sendAdminTaxDoc(id) {
  if (MOCK) { await new Promise(r => setTimeout(r, 400)); return { ok: true } }
  return request('POST', `/v1/mlm/admin/tax-docs/${id}/send`)
}
export async function bulkSendAdminTaxDocs(year, type) {
  if (MOCK) { await new Promise(r => setTimeout(r, 900)); return { sent: 4, failed: 0 } }
  return request('POST', '/v1/mlm/admin/tax-docs/bulk-send', { year, type })
}

// ─── Admin Payout Schedule ─────────────────────────────────────────────────────
const ADMIN_PAYOUT_SCHEDULE_SEED = {
  frequency: 'biweekly',
  dayOfWeek: 5,
  cutoffDays: 3,
  minPayoutAmount: 50,
  maxPayoutAmount: 50000,
  processingBankDays: 2,
  currencies: ['NOK', 'EUR', 'USD'],
  upcomingRuns: [
    { id: 'pr1', scheduledDate: '2026-08-15', cutoffDate: '2026-08-12', estimatedTotal: 284700, memberCount: 187, status: 'scheduled' },
    { id: 'pr2', scheduledDate: '2026-08-29', cutoffDate: '2026-08-26', estimatedTotal: 0, memberCount: 0, status: 'pending' },
    { id: 'pr3', scheduledDate: '2026-07-31', cutoffDate: '2026-07-28', estimatedTotal: 271300, memberCount: 172, status: 'completed' },
    { id: 'pr4', scheduledDate: '2026-07-17', cutoffDate: '2026-07-14', estimatedTotal: 259800, memberCount: 165, status: 'completed' },
  ],
}
export async function getAdminPayoutSchedule() {
  if (MOCK) { await new Promise(r => setTimeout(r, 200)); return ADMIN_PAYOUT_SCHEDULE_SEED }
  return request('GET', '/v1/mlm/admin/payout-schedule')
}
export async function updateAdminPayoutSchedule(data) {
  if (MOCK) { await new Promise(r => setTimeout(r, 350)); return { ok: true } }
  return request('PUT', '/v1/mlm/admin/payout-schedule', data)
}
export async function triggerAdminPayoutRun(id) {
  if (MOCK) { await new Promise(r => setTimeout(r, 500)); return { ok: true } }
  return request('POST', `/v1/mlm/admin/payout-schedule/runs/${id}/trigger`)
}

// ─── Member My Badges ──────────────────────────────────────────────────────────
const MEMBER_BADGES_SEED = [
  { id: 'b1', name: 'First Sale', category: 'sales', icon: '🏷️', earnedAt: '2025-11-02', description: 'Made your first product sale.', rarity: 'common' },
  { id: 'b2', name: 'Silver Rank', category: 'rank', icon: '🥈', earnedAt: '2025-12-01', description: 'Achieved Silver rank.', rarity: 'uncommon' },
  { id: 'b3', name: 'Team Builder', category: 'recruitment', icon: '👥', earnedAt: '2026-01-14', description: 'Recruited 5 active members.', rarity: 'uncommon' },
  { id: 'b4', name: 'Gold Rank', category: 'rank', icon: '🥇', earnedAt: '2026-04-01', description: 'Achieved Gold rank.', rarity: 'rare' },
  { id: 'b5', name: 'Top Seller', category: 'sales', icon: '⭐', earnedAt: '2026-05-31', description: 'Ranked #1 in monthly sales.', rarity: 'rare' },
  { id: 'b6', name: 'Training Champion', category: 'training', icon: '🎓', earnedAt: '2026-06-15', description: 'Completed all onboarding modules.', rarity: 'common' },
  { id: 'b7', name: 'Fast Start', category: 'sales', icon: '🚀', earnedAt: '2025-11-30', description: 'Hit Fast Start bonus in first month.', rarity: 'uncommon' },
  { id: 'b8', name: 'Community Leader', category: 'special', icon: '🌟', earnedAt: '2026-07-01', description: 'Recognised for outstanding community contribution.', rarity: 'epic' },
  { id: 'b9', name: 'Perfect Month', category: 'sales', icon: '💎', earnedAt: '2026-07-31', description: 'Hit personal sales target every week for a full month.', rarity: 'epic' },
]
const MEMBER_BADGES_LOCKED = [
  { id: 'bl1', name: 'Platinum Rank', category: 'rank', icon: '💎', description: 'Achieve Platinum rank.', rarity: 'legendary', requirement: 'Reach 75,000 PV' },
  { id: 'bl2', name: 'Century Recruiter', category: 'recruitment', icon: '🏆', description: 'Recruit 100 active members.', rarity: 'legendary', requirement: '100 active downline' },
]
export async function getMemberBadges() {
  if (MOCK) { await new Promise(r => setTimeout(r, 200)); return { earned: MEMBER_BADGES_SEED, locked: MEMBER_BADGES_LOCKED } }
  return request('GET', '/v1/mlm/member/badges')
}

// ─── Member Business Analytics ─────────────────────────────────────────────────
const MEMBER_BIZ_ANALYTICS_SEED = {
  period: '2026-07',
  kpis: [
    { key: 'conversionRate', label: 'Conversion Rate', value: 18.4, unit: '%', trend: +2.1, trendDir: 'up' },
    { key: 'avgOrderValue', label: 'Avg Order Value', value: 1247, unit: 'NOK', trend: +84, trendDir: 'up' },
    { key: 'teamGrowthRate', label: 'Team Growth Rate', value: 8.3, unit: '%', trend: -1.2, trendDir: 'down' },
    { key: 'retentionRate', label: 'Customer Retention', value: 74.2, unit: '%', trend: +3.5, trendDir: 'up' },
    { key: 'earningsPerMember', label: 'Earnings / Team Member', value: 4820, unit: 'NOK', trend: +310, trendDir: 'up' },
    { key: 'activeRatio', label: 'Active Member Ratio', value: 61.7, unit: '%', trend: -0.8, trendDir: 'down' },
  ],
  earningsTrend: [
    { month: '2026-02', personal: 12400, team: 8900 },
    { month: '2026-03', personal: 14800, team: 10200 },
    { month: '2026-04', personal: 16550, team: 13100 },
    { month: '2026-05', personal: 18350, team: 15600 },
    { month: '2026-06', personal: 19600, team: 17400 },
    { month: '2026-07', personal: 21400, team: 19800 },
  ],
  topProducts: [
    { name: 'Arctic Omega-3 Ultra', sales: 47, revenue: 58280 },
    { name: 'Nordic Collagen Plus', sales: 31, revenue: 27590 },
    { name: 'Bjornberry Complex', sales: 28, revenue: 19880 },
    { name: 'Vitamin D3+K2', sales: 22, revenue: 14300 },
  ],
}
export async function getMemberBizAnalytics(period) {
  if (MOCK) { await new Promise(r => setTimeout(r, 240)); return MEMBER_BIZ_ANALYTICS_SEED }
  return request('GET', `/v1/mlm/member/business-analytics${period ? `?period=${period}` : ''}`)
}

// ─── Member My Documents ───────────────────────────────────────────────────────
const MEMBER_DOCS_SEED = [
  { id: 'md1', name: '1099-NEC 2025', type: '1099-NEC', year: 2025, size: '84 KB', issuedAt: '2026-01-31', downloadUrl: '#' },
  { id: 'md2', name: 'W-9 Form on file', type: 'W-9', year: 2025, size: '32 KB', issuedAt: '2025-11-05', downloadUrl: '#' },
  { id: 'md3', name: 'Distributor Agreement', type: 'contract', year: 2025, size: '124 KB', issuedAt: '2025-10-28', downloadUrl: '#' },
  { id: 'md4', name: 'Annual Earnings Statement 2025', type: 'earnings', year: 2025, size: '48 KB', issuedAt: '2026-02-15', downloadUrl: '#' },
  { id: 'md5', name: 'Annual Earnings Statement 2024', type: 'earnings', year: 2024, size: '44 KB', issuedAt: '2025-02-12', downloadUrl: '#' },
  { id: 'md6', name: '1099-NEC 2024', type: '1099-NEC', year: 2024, size: '79 KB', issuedAt: '2025-01-31', downloadUrl: '#' },
]
export async function getMemberDocs() {
  if (MOCK) { await new Promise(r => setTimeout(r, 200)); return MEMBER_DOCS_SEED }
  return request('GET', '/v1/mlm/member/documents')
}
export async function downloadMemberDoc(id) {
  if (MOCK) { await new Promise(r => setTimeout(r, 200)); return { url: '#' } }
  return request('GET', `/v1/mlm/member/documents/${id}/download`)
}

// ─── Member Social Sharing ─────────────────────────────────────────────────────
const MEMBER_SHARE_TEMPLATES_SEED = [
  { id: 'st1', category: 'rank', title: 'Rank Achievement', message: "I just reached {rank} rank at Nordic Vitals! 🎉 Building a health business that creates real results. Join me:", includesLink: true },
  { id: 'st2', category: 'earnings', title: 'Milestone Earnings', message: "Just hit a new personal earnings record with Nordic Vitals! 💪 Health + wealth — discover how:", includesLink: true },
  { id: 'st3', category: 'product', title: 'Product Recommendation', message: "Loving the Arctic Omega-3 Ultra from Nordic Vitals — 3 months of consistent use, noticeable difference. 🌊 Try it:", includesLink: true },
  { id: 'st4', category: 'recruitment', title: 'Team Growth', message: "My team just hit {teamSize} members! So proud of everyone. There's still room — let's grow together:", includesLink: true },
]
const MEMBER_SHARE_STATS_SEED = { clicks: 214, conversions: 18, conversionRate: 8.4, topPlatform: 'Facebook' }
export async function getMemberShareTemplates() {
  if (MOCK) { await new Promise(r => setTimeout(r, 180)); return { templates: MEMBER_SHARE_TEMPLATES_SEED, stats: MEMBER_SHARE_STATS_SEED } }
  return request('GET', '/v1/mlm/member/social-sharing')
}
export async function trackMemberShare(templateId, platform) {
  if (MOCK) { await new Promise(r => setTimeout(r, 150)); return { ok: true } }
  return request('POST', '/v1/mlm/member/social-sharing/track', { templateId, platform })
}

// ─── Admin Commission Disputes ──────────────────────────────────────────────────
const ADMIN_DISPUTES_SEED = [
  { id: 'cd1', memberName: 'Erik Solberg', runLabel: 'June 2026 Run', claimedAmount: '12,480 NOK', paidAmount: '9,320 NOK', reason: 'My downline volume was not counted correctly — three of my direct referrals placed orders on the last day of the period.', filedAt: '2026-07-08', status: 'open' },
  { id: 'cd2', memberName: 'Astrid Berge', runLabel: 'June 2026 Run', claimedAmount: '6,750 NOK', paidAmount: '5,100 NOK', reason: 'Fast Start bonus was not applied — I enrolled 4 members in my first 30 days.', filedAt: '2026-07-05', status: 'reviewing' },
  { id: 'cd3', memberName: 'Lars Christiansen', runLabel: 'May 2026 Run', claimedAmount: '3,200 NOK', paidAmount: '2,950 NOK', reason: 'Loyalty multiplier not applied to my subscription orders.', filedAt: '2026-06-10', status: 'resolved' },
  { id: 'cd4', memberName: 'Silje Dahl', runLabel: 'May 2026 Run', claimedAmount: '8,100 NOK', paidAmount: '8,100 NOK', reason: 'Rank bonus missing for reaching Gold tier mid-period.', filedAt: '2026-06-07', status: 'denied' },
  { id: 'cd5', memberName: 'Mads Holm', runLabel: 'July 2026 Run', claimedAmount: '4,560 NOK', paidAmount: '3,100 NOK', reason: 'Team volume from my Silver leg was incorrectly capped.', filedAt: '2026-08-02', status: 'open' },
]
export async function getAdminCommissionDisputes() {
  if (MOCK) { await new Promise(r => setTimeout(r, 220)); return ADMIN_DISPUTES_SEED }
  return request('GET', '/v1/mlm/admin/commission-disputes')
}
export async function resolveAdminCommissionDispute(id, payload) {
  if (MOCK) { await new Promise(r => setTimeout(r, 300)); return { id, ...payload } }
  return request('PUT', `/v1/mlm/admin/commission-disputes/${id}/resolve`, payload)
}

// ─── Admin Loyalty Ledger ───────────────────────────────────────────────────────
const ADMIN_LOYALTY_LEDGER_SEED = [
  { id: 'll1', date: '2026-08-07', memberName: 'Erik Solberg', type: 'purchase', delta: 1250, balanceAfter: 8430, reason: 'Order #NV-20845 — Arctic Omega-3 Ultra x2' },
  { id: 'll2', date: '2026-08-07', memberName: 'Astrid Berge', type: 'referral', delta: 500, balanceAfter: 3110, reason: 'Referral bonus — Lars Christiansen joined' },
  { id: 'll3', date: '2026-08-06', memberName: 'Lars Christiansen', type: 'bonus', delta: 2000, balanceAfter: 5200, reason: 'Gold rank achievement bonus' },
  { id: 'll4', date: '2026-08-06', memberName: 'Silje Dahl', type: 'redemption', delta: -1500, balanceAfter: 640, reason: '150 NOK voucher redeemed — Order #NV-20811' },
  { id: 'll5', date: '2026-08-05', memberName: 'Mads Holm', type: 'manual', delta: 300, balanceAfter: 2300, reason: 'Manual compensation — delayed shipment on Order #NV-20790' },
  { id: 'll6', date: '2026-08-05', memberName: 'Anna Hanssen', type: 'expiry', delta: -800, balanceAfter: 0, reason: 'Points expired — 12-month inactivity policy' },
  { id: 'll7', date: '2026-08-04', memberName: 'Erik Solberg', type: 'purchase', delta: 620, balanceAfter: 7180, reason: 'Order #NV-20778 — Nordic Collagen Plus' },
  { id: 'll8', date: '2026-08-03', memberName: 'Astrid Berge', type: 'purchase', delta: 890, balanceAfter: 2610, reason: 'Order #NV-20751 — Bjornberry Complex x3' },
]
export async function getAdminLoyaltyLedger() {
  if (MOCK) { await new Promise(r => setTimeout(r, 240)); return ADMIN_LOYALTY_LEDGER_SEED }
  return request('GET', '/v1/mlm/admin/loyalty-ledger')
}
export async function adjustAdminLoyaltyPoints(payload) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 280))
    return { id: `ll${Date.now()}`, date: new Date().toISOString().slice(0,10), memberName: payload.memberName, type: 'manual', delta: payload.delta, balanceAfter: Math.abs(payload.delta) * 2, reason: payload.reason }
  }
  return request('POST', '/v1/mlm/admin/loyalty-ledger/adjust', payload)
}

// ─── Admin Feature Flags ────────────────────────────────────────────────────────
const ADMIN_FEATURE_FLAGS_SEED = [
  { id: 'ff1', key: 'mlm.token_wallet', description: 'Enable the member token wallet and tARCTX display.', enabled: true, rolloutPercent: 100, environment: 'production', lastModified: '2026-07-15', modifiedBy: 'bjorn@arctico' },
  { id: 'ff2', key: 'mlm.digital_products', description: 'Allow members to purchase and download digital products.', enabled: true, rolloutPercent: 100, environment: 'production', lastModified: '2026-08-01', modifiedBy: 'gary' },
  { id: 'ff3', key: 'mlm.live_streams', description: 'Show Live Streams section in admin and event calendar.', enabled: true, rolloutPercent: 50, environment: 'production', lastModified: '2026-08-07', modifiedBy: 'gary' },
  { id: 'ff4', key: 'mlm.vip_tiers', description: 'Enable VIP tier system (Silver/Gold/Platinum/Diamond).', enabled: true, rolloutPercent: 100, environment: 'all', lastModified: '2026-07-20', modifiedBy: 'bjorn@arctico' },
  { id: 'ff5', key: 'mlm.crypto_payouts', description: 'Allow members to receive commission payouts in ARCTX token.', enabled: false, rolloutPercent: 0, environment: 'staging', lastModified: '2026-06-30', modifiedBy: 'bjorn@arctico' },
  { id: 'ff6', key: 'shop.buy_now', description: 'Show Buy Now button on product pages for faster checkout.', enabled: true, rolloutPercent: 80, environment: 'production', lastModified: '2026-08-03', modifiedBy: 'gary' },
  { id: 'ff7', key: 'mlm.co_op_advertising', description: 'Enable Co-Op advertising module for members.', enabled: true, rolloutPercent: 100, environment: 'all', lastModified: '2026-08-05', modifiedBy: 'gary' },
  { id: 'ff8', key: 'admin.ai_fraud_detection', description: 'Experimental AI-based fraud scoring in the Fraud & Risk panel.', enabled: false, rolloutPercent: 0, environment: 'staging', lastModified: '2026-07-28', modifiedBy: 'bjorn@arctico' },
]
export async function getAdminFeatureFlags() {
  if (MOCK) { await new Promise(r => setTimeout(r, 200)); return ADMIN_FEATURE_FLAGS_SEED }
  return request('GET', '/v1/mlm/admin/feature-flags')
}
export async function updateAdminFeatureFlag(id, payload) {
  if (MOCK) { await new Promise(r => setTimeout(r, 200)); return payload }
  return request('PUT', `/v1/mlm/admin/feature-flags/${id}`, payload)
}

// ─── Admin Coupons ──────────────────────────────────────────────────────────────
const ADMIN_COUPONS_SEED = [
  { id: 'cp1', code: 'NORDIC20', type: 'percent', value: 20, scope: 'all', minOrder: 500, maxUses: null, uses: 214, totalSavings: 89400, expiresAt: '2026-12-31', status: 'active' },
  { id: 'cp2', code: 'NEWMEMBER100', type: 'fixed', value: 100, scope: 'new', minOrder: 300, maxUses: 500, uses: 87, totalSavings: 8700, expiresAt: '2026-09-30', status: 'active' },
  { id: 'cp3', code: 'FREESHIP', type: 'free_shipping', value: 0, scope: 'members', minOrder: 0, maxUses: null, uses: 1203, totalSavings: 72180, expiresAt: null, status: 'active' },
  { id: 'cp4', code: 'SUMMER15', type: 'percent', value: 15, scope: 'all', minOrder: 0, maxUses: 1000, uses: 1000, totalSavings: 94500, expiresAt: '2026-07-31', status: 'expired' },
  { id: 'cp5', code: 'VIP30', type: 'percent', value: 30, scope: 'members', minOrder: 1000, maxUses: 200, uses: 43, totalSavings: 38700, expiresAt: '2026-10-15', status: 'paused' },
]
export async function getAdminCoupons() {
  if (MOCK) { await new Promise(r => setTimeout(r, 210)); return ADMIN_COUPONS_SEED }
  return request('GET', '/v1/mlm/admin/coupons')
}
export async function createAdminCoupon(payload) {
  if (MOCK) { await new Promise(r => setTimeout(r, 300)); return { id: `cp${Date.now()}`, uses: 0, totalSavings: 0, ...payload } }
  return request('POST', '/v1/mlm/admin/coupons', payload)
}
export async function updateAdminCoupon(id, payload) {
  if (MOCK) { await new Promise(r => setTimeout(r, 250)); return payload }
  return request('PUT', `/v1/mlm/admin/coupons/${id}`, payload)
}
export async function deleteAdminCoupon(id) {
  if (MOCK) { await new Promise(r => setTimeout(r, 200)); return { ok: true } }
  return request('DELETE', `/v1/mlm/admin/coupons/${id}`)
}

// ─── Member Income Disclosure ────────────────────────────────────────────────────
const INCOME_DISCLOSURE_SEED = {
  '2025': {
    myRank: 'Gold',
    myAnnualEarnings: 187400,
    rankPercentile: 68,
    totalDistributors: 1842,
    disclaimer: 'These income figures are before taxes and business expenses. The earnings shown represent gross commissions paid by Nordic Vitals AS. Distributor results vary significantly based on individual effort, market conditions, and time commitment.',
    tiers: [
      { rank: 'Starter', pctDistributors: 38.2, avgEarnings: 4100, medianEarnings: 1800, top10pct: 12400 },
      { rank: 'Bronze', pctDistributors: 24.1, avgEarnings: 18700, medianEarnings: 14200, top10pct: 48000 },
      { rank: 'Silver', pctDistributors: 18.6, avgEarnings: 54200, medianEarnings: 46900, top10pct: 112000 },
      { rank: 'Gold', pctDistributors: 12.4, avgEarnings: 142800, medianEarnings: 124000, top10pct: 290000 },
      { rank: 'Platinum', pctDistributors: 5.2, avgEarnings: 348000, medianEarnings: 310000, top10pct: 680000 },
      { rank: 'Diamond', pctDistributors: 1.5, avgEarnings: 820000, medianEarnings: 720000, top10pct: 1840000 },
    ],
  },
}
export async function getMemberIncomeDisclosure(year) {
  if (MOCK) { await new Promise(r => setTimeout(r, 220)); return INCOME_DISCLOSURE_SEED[year] || INCOME_DISCLOSURE_SEED['2025'] }
  return request('GET', `/v1/mlm/member/income-disclosure?year=${year}`)
}

// ─── Member Referral Analytics ───────────────────────────────────────────────────
const REFERRAL_ANALYTICS_SEED = {
  clicks: 847,
  uniqueVisitors: 614,
  conversions: 38,
  conversionRate: 6.2,
  revenueAttributed: 112400,
  avgOrderValue: 2958,
  topLinks: [
    { id: 'rl1', label: 'Main referral link', clicks: 412, conversions: 22, rate: 5.3 },
    { id: 'rl2', label: 'Instagram bio link', clicks: 228, conversions: 10, rate: 4.4 },
    { id: 'rl3', label: 'Facebook share — Omega-3 post', clicks: 114, conversions: 4, rate: 3.5 },
    { id: 'rl4', label: 'WhatsApp group share', clicks: 93, conversions: 2, rate: 2.2 },
  ],
  sources: [
    { name: 'Direct / Unknown', pct: 34, color: '#6366f1' },
    { name: 'Instagram', pct: 27, color: '#ec4899' },
    { name: 'Facebook', pct: 18, color: '#3b82f6' },
    { name: 'WhatsApp', pct: 12, color: '#22c55e' },
    { name: 'Other', pct: 9, color: '#f59e0b' },
  ],
  funnel: [
    { label: 'Link clicks', count: 847 },
    { label: 'Landing page views', count: 614 },
    { label: 'Shop visits', count: 320 },
    { label: 'Add to cart', count: 88 },
    { label: 'Purchases', count: 38 },
  ],
}
export async function getMemberReferralAnalytics(period) {
  if (MOCK) { await new Promise(r => setTimeout(r, 240)); return REFERRAL_ANALYTICS_SEED }
  return request('GET', `/v1/mlm/member/referral-analytics?period=${period}`)
}

// ─── Member VIP Benefits ─────────────────────────────────────────────────────────
const VIP_BENEFITS_SEED = {
  currentTier: 'Gold',
  currentTierPv: 8420,
  nextTier: { name: 'Platinum', requiredPv: 12000, remaining: 3580, progress: 70 },
  tiers: [
    { name: 'Silver', icon: '🥈', requirement: '3,000+ PV/month', perks: ['5% product discount', 'Priority email support', 'Early access to new products', 'Monthly newsletter with tips'] },
    { name: 'Gold', icon: '🥇', requirement: '7,500+ PV/month', perks: ['10% product discount', 'Dedicated account manager', '2x loyalty points on purchases', 'Exclusive Gold webinars', 'Free shipping on all orders'] },
    { name: 'Platinum', icon: '💎', requirement: '12,000+ PV/month', perks: ['15% product discount', 'VIP phone support line', '3x loyalty points', 'Platinum retreat invite (annual)', 'Custom branded materials', 'Beta feature access'] },
    { name: 'Diamond', icon: '💠', requirement: '25,000+ PV/month', perks: ['20% product discount', 'Personal business coach', '5x loyalty points', 'Diamond gala invitation', 'Revenue share on company growth', 'Co-branded product line option'] },
  ],
  exclusiveOffers: [
    { id: 'eo1', title: 'Gold Members: 25% off Omega Bundle', description: 'Save 25% on the Arctic Omega-3 + D3/K2 bundle. Limited stock.', discount: '25% OFF', tier: 'Gold', expiresAt: '2026-08-15' },
    { id: 'eo2', title: 'Double Points Weekend', description: 'Earn 2x loyalty points on all purchases this weekend only.', discount: '2× Points', tier: 'Gold', expiresAt: '2026-08-11' },
  ],
}
export async function getMemberVipBenefits() {
  if (MOCK) { await new Promise(r => setTimeout(r, 200)); return VIP_BENEFITS_SEED }
  return request('GET', '/v1/mlm/member/vip-benefits')
}

// ─── Member Enrollment Center ─────────────────────────────────────────────────────
const MEMBER_ENROLLMENTS_SEED = {
  totalEnrolled: 47,
  enrolledThisMonth: 3,
  enrollments: [
    { id: 'en1', name: 'Hanne Olsen', email: 'hanne@example.com', invitedAt: '2026-08-05', joinedAt: '2026-08-06', status: 'onboarding', onboardingStep: 3, onboardingTotal: 6 },
    { id: 'en2', name: 'Kristian Berg', email: 'kristian@example.com', invitedAt: '2026-08-03', joinedAt: null, status: 'pending', onboardingStep: null, onboardingTotal: null },
    { id: 'en3', name: 'Tone Elstad', email: 'tone@example.com', invitedAt: '2026-07-28', joinedAt: '2026-07-30', status: 'active', onboardingStep: null, onboardingTotal: null },
    { id: 'en4', name: 'Rune Hauge', email: 'rune@example.com', invitedAt: '2026-07-15', joinedAt: '2026-07-16', status: 'active', onboardingStep: null, onboardingTotal: null },
    { id: 'en5', name: 'Marit Vold', email: 'marit@example.com', invitedAt: '2026-06-01', joinedAt: null, status: 'expired', onboardingStep: null, onboardingTotal: null },
    { id: 'en6', name: 'Sven Aas', email: 'sven@example.com', invitedAt: '2026-08-08', joinedAt: null, status: 'pending', onboardingStep: null, onboardingTotal: null },
  ],
}
export async function getMemberEnrollments() {
  if (MOCK) { await new Promise(r => setTimeout(r, 210)); return MEMBER_ENROLLMENTS_SEED }
  return request('GET', '/v1/mlm/member/enrollments')
}
export async function createMemberEnrollmentInvite(payload) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 300))
    return { id: `en${Date.now()}`, name: payload.name, email: payload.email, invitedAt: new Date().toISOString().slice(0,10), joinedAt: null, status: 'pending', onboardingStep: null, onboardingTotal: null }
  }
  return request('POST', '/v1/mlm/member/enrollments/invite', payload)
}

// ─── Admin Order Disputes ─────────────────────────────────────────────────────
const ADMIN_ORDER_DISPUTES_SEED = [
  { id: 'od1', orderId: 'ORD-10482', memberName: 'Lena Thorvaldsen', reason: 'wrong_item', description: 'Received Vitamin D instead of Omega-3 2000mg.', claimedRefund: 'NOK 449', status: 'open', filedAt: '2026-08-07', priority: 'high' },
  { id: 'od2', orderId: 'ORD-10394', memberName: 'Mads Eriksen', reason: 'damaged', description: 'Packaging crushed, capsules spilled out.', claimedRefund: 'NOK 299', status: 'reviewing', filedAt: '2026-08-06', priority: 'medium' },
  { id: 'od3', orderId: 'ORD-10311', memberName: 'Astrid Haugen', reason: 'not_received', description: 'Order marked delivered but nothing arrived.', claimedRefund: 'NOK 748', status: 'open', filedAt: '2026-08-05', priority: 'high' },
  { id: 'od4', orderId: 'ORD-10270', memberName: 'Petter Lindgren', reason: 'quality_issue', description: 'Strong unusual smell, different from previous batches.', claimedRefund: 'NOK 349', status: 'resolved', filedAt: '2026-08-04', priority: 'low' },
  { id: 'od5', orderId: 'ORD-10211', memberName: 'Silje Bakke', reason: 'wrong_item', description: 'Missing item: Collagen Peptides not included in order.', claimedRefund: 'NOK 599', status: 'denied', filedAt: '2026-08-02', priority: 'medium' },
  { id: 'od6', orderId: 'ORD-10188', memberName: 'Jonas Wiig', reason: 'damaged', description: 'Bottle seal broken on arrival.', claimedRefund: 'NOK 249', status: 'resolved', filedAt: '2026-08-01', priority: 'low' },
]
export async function getAdminOrderDisputes() {
  if (MOCK) { await new Promise(r => setTimeout(r, 220)); return ADMIN_ORDER_DISPUTES_SEED }
  return request('GET', '/v1/admin/order-disputes')
}
export async function resolveAdminOrderDispute(id, payload) {
  if (MOCK) { await new Promise(r => setTimeout(r, 300)); return { ok: true } }
  return request('POST', `/v1/admin/order-disputes/${id}/resolve`, payload)
}

// ─── Admin Partner Portal ─────────────────────────────────────────────────────
const ADMIN_PARTNERS_SEED = [
  { id: 'pp1', name: 'HealthHub AS', type: 'wholesale', contact: 'anders@healthhub.no', country: 'NO', joinedAt: '2026-01-15', status: 'active', totalOrders: 84, totalRevenue: 'NOK 412,000', discountPct: 20 },
  { id: 'pp2', name: 'VitaLife Sweden', type: 'reseller', contact: 'eva.lund@vitalife.se', country: 'SE', joinedAt: '2026-03-08', status: 'active', totalOrders: 37, totalRevenue: 'NOK 198,000', discountPct: 15 },
  { id: 'pp3', name: 'Nordic Wellbeing GmbH', type: 'wholesale', contact: 'frank.bauer@nordicwellbeing.de', country: 'DE', joinedAt: '2026-05-22', status: 'active', totalOrders: 21, totalRevenue: 'NOK 134,000', discountPct: 18 },
  { id: 'pp4', name: 'Fit & Fresh DK', type: 'brand_ambassador', contact: 'camilla@fitfresh.dk', country: 'DK', joinedAt: '2026-06-10', status: 'pending', totalOrders: 0, totalRevenue: 'NOK 0', discountPct: 10 },
  { id: 'pp5', name: 'Glacier Nutrition UK', type: 'reseller', contact: 'james.k@glacier-nutrition.co.uk', country: 'GB', joinedAt: '2026-04-18', status: 'inactive', totalOrders: 12, totalRevenue: 'NOK 71,000', discountPct: 15 },
]
export async function getAdminPartners() {
  if (MOCK) { await new Promise(r => setTimeout(r, 230)); return ADMIN_PARTNERS_SEED }
  return request('GET', '/v1/admin/partners')
}
export async function createAdminPartner(payload) {
  if (MOCK) { await new Promise(r => setTimeout(r, 300)); return { id: `pp${Date.now()}`, ...payload, status: 'pending', totalOrders: 0, totalRevenue: 'NOK 0', joinedAt: new Date().toISOString().slice(0,10) } }
  return request('POST', '/v1/admin/partners', payload)
}
export async function updateAdminPartner(id, payload) {
  if (MOCK) { await new Promise(r => setTimeout(r, 280)); return { ok: true } }
  return request('PATCH', `/v1/admin/partners/${id}`, payload)
}

// ─── Admin Subscription Analytics ────────────────────────────────────────────
const ADMIN_SUB_ANALYTICS_SEED = {
  mrr: 847200,
  arr: 10166400,
  activeSubscriptions: 2140,
  newThisMonth: 138,
  cancelledThisMonth: 41,
  netGrowth: 97,
  churnRate: 1.9,
  avgRevenuePerSub: 396,
  planBreakdown: [
    { plan: 'Starter Monthly', count: 820, mrr: 246000, pct: 29.1 },
    { plan: 'Essential Quarterly', count: 640, mrr: 256000, pct: 30.2 },
    { plan: 'Premium Monthly', count: 480, mrr: 288000, pct: 34.0 },
    { plan: 'Elite Annual', count: 200, mrr: 57200, pct: 6.7 },
  ],
  cohortRetention: [
    { cohort: 'Jan 2026', m1: 100, m2: 88, m3: 79, m4: 73, m5: 68, m6: 64 },
    { cohort: 'Feb 2026', m1: 100, m2: 90, m3: 82, m4: 76, m5: 71, m6: null },
    { cohort: 'Mar 2026', m1: 100, m2: 87, m3: 80, m4: 74, m5: null, m6: null },
    { cohort: 'Apr 2026', m1: 100, m2: 91, m3: 83, m4: null, m5: null, m6: null },
    { cohort: 'May 2026', m1: 100, m2: 89, m3: null, m4: null, m5: null, m6: null },
    { cohort: 'Jun 2026', m1: 100, m2: null, m3: null, m4: null, m5: null, m6: null },
  ],
  mrrTrend: [
    { month: 'Feb', mrr: 712000 }, { month: 'Mar', mrr: 748000 }, { month: 'Apr', mrr: 778000 },
    { month: 'May', mrr: 803000 }, { month: 'Jun', mrr: 828000 }, { month: 'Jul', mrr: 847200 },
  ],
}
export async function getAdminSubscriptionAnalytics(period) {
  if (MOCK) { await new Promise(r => setTimeout(r, 240)); return ADMIN_SUB_ANALYTICS_SEED }
  return request('GET', `/v1/admin/subscription-analytics?period=${period || 'month'}`)
}

// ─── Admin Social Proof ───────────────────────────────────────────────────────
const ADMIN_SOCIAL_PROOF_SEED = [
  { id: 'sp1', type: 'testimonial', author: 'Hilde R.', location: 'Bergen, Norway', text: 'I have been taking the Omega-3 for 4 months and my joints feel incredible. My doctor is impressed!', product: 'Arctic Omega-3 2000mg', rating: 5, status: 'featured', submittedAt: '2026-08-06', source: 'email' },
  { id: 'sp2', type: 'testimonial', author: 'Lars O.', location: 'Stockholm, Sweden', text: 'Lost 4kg in 6 weeks while taking the protein series. Energy is through the roof.', product: 'Nordic Protein Blend', rating: 5, status: 'approved', submittedAt: '2026-08-05', source: 'web' },
  { id: 'sp3', type: 'ugc', author: '@fitness_ingrid', location: 'Oslo, Norway', text: 'My morning stack just got an upgrade 💪 #NordicVitals #Wellness', product: null, rating: null, status: 'pending', submittedAt: '2026-08-07', source: 'instagram' },
  { id: 'sp4', type: 'testimonial', author: 'Bjarne T.', location: 'Trondheim, Norway', text: 'Finally a Norwegian supplement brand that delivers what it promises.', product: 'Arctic Omega-3 2000mg', rating: 4, status: 'approved', submittedAt: '2026-08-03', source: 'review' },
  { id: 'sp5', type: 'ugc', author: '@healthyvibes_no', location: 'Stavanger, Norway', text: 'Loving my new routine! These vitamins are game changers.', product: null, rating: null, status: 'pending', submittedAt: '2026-08-07', source: 'tiktok' },
  { id: 'sp6', type: 'testimonial', author: 'Maria K.', location: 'Copenhagen, Denmark', text: 'Spammy email tactics. Would not recommend signing up for newsletter.', product: null, rating: 1, status: 'rejected', submittedAt: '2026-08-02', source: 'web' },
]
export async function getAdminSocialProof() {
  if (MOCK) { await new Promise(r => setTimeout(r, 210)); return ADMIN_SOCIAL_PROOF_SEED }
  return request('GET', '/v1/admin/social-proof')
}
export async function updateAdminSocialProofStatus(id, status) {
  if (MOCK) { await new Promise(r => setTimeout(r, 250)); return { ok: true } }
  return request('PATCH', `/v1/admin/social-proof/${id}`, { status })
}

// ─── Member Subscription History ─────────────────────────────────────────────
const MEMBER_SUB_HISTORY_SEED = [
  { id: 'sh1', type: 'plan_change', fromPlan: 'Starter Monthly', toPlan: 'Premium Monthly', at: '2026-07-01', note: 'Upgraded for 2× loyalty points benefit' },
  { id: 'sh2', type: 'renewal', plan: 'Starter Monthly', at: '2026-06-01', amount: 'NOK 299', note: 'Auto-renewed' },
  { id: 'sh3', type: 'renewal', plan: 'Starter Monthly', at: '2026-05-01', amount: 'NOK 299', note: 'Auto-renewed' },
  { id: 'sh4', type: 'pause', plan: 'Starter Monthly', at: '2026-04-10', resumedAt: '2026-05-01', note: 'Paused for 3 weeks (travel)' },
  { id: 'sh5', type: 'renewal', plan: 'Starter Monthly', at: '2026-04-01', amount: 'NOK 299', note: 'Auto-renewed' },
  { id: 'sh6', type: 'started', plan: 'Starter Monthly', at: '2026-03-14', amount: 'NOK 299', note: 'First subscription — joined Nordic Vitals' },
]
export async function getMemberSubscriptionHistory() {
  if (MOCK) { await new Promise(r => setTimeout(r, 200)); return MEMBER_SUB_HISTORY_SEED }
  return request('GET', '/v1/mlm/member/subscription-history')
}

// ─── Member Partner Links ─────────────────────────────────────────────────────
const MEMBER_PARTNER_LINKS_SEED = [
  { id: 'pl1', label: 'Gym chain B2B link', url: 'https://nordic-vitals.no/partner/gary-001', clicks: 142, conversions: 8, revenue: 'NOK 34,200', createdAt: '2026-06-10', active: true },
  { id: 'pl2', label: 'Corporate wellness pitch', url: 'https://nordic-vitals.no/partner/gary-002', clicks: 78, conversions: 3, revenue: 'NOK 18,900', createdAt: '2026-07-02', active: true },
  { id: 'pl3', label: 'Pharmacy network', url: 'https://nordic-vitals.no/partner/gary-003', clicks: 12, conversions: 0, revenue: 'NOK 0', createdAt: '2026-08-01', active: true },
]
export async function getMemberPartnerLinks() {
  if (MOCK) { await new Promise(r => setTimeout(r, 210)); return MEMBER_PARTNER_LINKS_SEED }
  return request('GET', '/v1/mlm/member/partner-links')
}
export async function createMemberPartnerLink(payload) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 300))
    return { id: `pl${Date.now()}`, ...payload, url: `https://nordic-vitals.no/partner/gary-${Date.now()}`, clicks: 0, conversions: 0, revenue: 'NOK 0', createdAt: new Date().toISOString().slice(0,10), active: true }
  }
  return request('POST', '/v1/mlm/member/partner-links', payload)
}
export async function deleteMemberPartnerLink(id) {
  if (MOCK) { await new Promise(r => setTimeout(r, 250)); return { ok: true } }
  return request('DELETE', `/v1/mlm/member/partner-links/${id}`)
}

// ─── Member Health Tracker ────────────────────────────────────────────────────
const MEMBER_HEALTH_LOG_SEED = [
  { id: 'hl1', date: '2026-08-07', mood: 4, energy: 4, sleep: 7.5, products: ['Omega-3 2000mg', 'D3/K2 Complex'], notes: 'Good workout, joint flexibility noticeably better.' },
  { id: 'hl2', date: '2026-08-06', mood: 3, energy: 3, sleep: 6.0, products: ['Omega-3 2000mg'], notes: 'Skipped D3 this morning. Tired by afternoon.' },
  { id: 'hl3', date: '2026-08-05', mood: 5, energy: 5, sleep: 8.5, products: ['Omega-3 2000mg', 'D3/K2 Complex', 'Collagen Peptides'], notes: 'Best energy day in weeks. Full stack taken.' },
  { id: 'hl4', date: '2026-08-04', mood: 4, energy: 4, sleep: 7.0, products: ['Omega-3 2000mg', 'D3/K2 Complex'], notes: 'Consistent routine, feeling stable.' },
  { id: 'hl5', date: '2026-08-03', mood: 3, energy: 2, sleep: 5.5, products: ['Omega-3 2000mg'], notes: 'Poor sleep, stressed about work deadline.' },
  { id: 'hl6', date: '2026-08-02', mood: 4, energy: 4, sleep: 7.0, products: ['Omega-3 2000mg', 'D3/K2 Complex'], notes: 'Weekend hike — supplements packed.' },
]
export async function getMemberHealthLog() {
  if (MOCK) { await new Promise(r => setTimeout(r, 220)); return MEMBER_HEALTH_LOG_SEED }
  return request('GET', '/v1/mlm/member/health-log')
}
export async function addMemberHealthLog(payload) {
  if (MOCK) { await new Promise(r => setTimeout(r, 300)); return { id: `hl${Date.now()}`, ...payload } }
  return request('POST', '/v1/mlm/member/health-log', payload)
}
export async function deleteMemberHealthLog(id) {
  if (MOCK) { await new Promise(r => setTimeout(r, 250)); return { ok: true } }
  return request('DELETE', `/v1/mlm/member/health-log/${id}`)
}

// ─── Member Habit Tracker ─────────────────────────────────────────────────────
const MEMBER_HABITS_SEED = {
  habits: [
    { id: 'hb1', name: 'Take morning supplements', icon: '💊', streak: 12, target: 7, completedDates: ['2026-08-01','2026-08-02','2026-08-03','2026-08-04','2026-08-05','2026-08-06','2026-08-07'] },
    { id: 'hb2', name: 'Drink 2L water', icon: '💧', streak: 5, target: 7, completedDates: ['2026-08-03','2026-08-04','2026-08-05','2026-08-06','2026-08-07'] },
    { id: 'hb3', name: 'Exercise 30 min', icon: '🏋️', streak: 3, target: 5, completedDates: ['2026-08-05','2026-08-06','2026-08-07'] },
    { id: 'hb4', name: 'Sleep by 23:00', icon: '😴', streak: 2, target: 7, completedDates: ['2026-08-06','2026-08-07'] },
    { id: 'hb5', name: 'Contact 1 new prospect', icon: '📞', streak: 0, target: 5, completedDates: [] },
  ],
  weekDates: ['2026-08-01','2026-08-02','2026-08-03','2026-08-04','2026-08-05','2026-08-06','2026-08-07'],
}
export async function getMemberHabits() {
  if (MOCK) { await new Promise(r => setTimeout(r, 200)); return MEMBER_HABITS_SEED }
  return request('GET', '/v1/mlm/member/habits')
}
export async function logMemberHabit(habitId, date) {
  if (MOCK) { await new Promise(r => setTimeout(r, 200)); return { ok: true } }
  return request('POST', '/v1/mlm/member/habits/log', { habitId, date })
}
export async function createMemberHabit(payload) {
  if (MOCK) { await new Promise(r => setTimeout(r, 280)); return { id: `hb${Date.now()}`, ...payload, streak: 0, completedDates: [] } }
  return request('POST', '/v1/mlm/member/habits', payload)
}

// ── Stock Alerts ─────────────────────────────────────────────────────────────
const STOCK_ALERTS_SEED = [
  { id: 'sa1', name: 'BPC-157 5mg', sku: 'BPC-157-5MG', stock: 3, threshold: 10, level: 'critical', lastUpdated: '2026-08-08 09:14' },
  { id: 'sa2', name: 'TB-500 2mg', sku: 'TB500-2MG', stock: 8, threshold: 15, level: 'low', lastUpdated: '2026-08-08 07:30' },
  { id: 'sa3', name: 'Semax 30mg', sku: 'SEMAX-30MG', stock: 0, threshold: 5, level: 'critical', lastUpdated: '2026-08-07 22:00' },
  { id: 'sa4', name: 'CJC-1295 2mg', sku: 'CJC-2MG', stock: 42, threshold: 10, level: 'ok', lastUpdated: '2026-08-08 06:00' },
  { id: 'sa5', name: 'Ipamorelin 2mg', sku: 'IPA-2MG', stock: 18, threshold: 20, level: 'low', lastUpdated: '2026-08-08 08:00' },
  { id: 'sa6', name: 'PT-141 10mg', sku: 'PT141-10MG', stock: 55, threshold: 10, level: 'ok', lastUpdated: '2026-08-07 18:00' },
]
export async function getAdminStockAlerts() {
  if (MOCK) { await new Promise(r => setTimeout(r, 250)); return [...STOCK_ALERTS_SEED] }
  return request('GET', '/v1/mlm/admin/stock-alerts')
}
export async function updateAdminStockAlertThreshold(id, threshold) {
  if (MOCK) { await new Promise(r => setTimeout(r, 200)); return { ok: true } }
  return request('PUT', `/v1/mlm/admin/stock-alerts/${id}/threshold`, { threshold })
}
export async function dismissAdminStockAlert(id) {
  if (MOCK) { await new Promise(r => setTimeout(r, 180)); return { ok: true } }
  return request('POST', `/v1/mlm/admin/stock-alerts/${id}/dismiss`)
}

// ── Payment Gateways ──────────────────────────────────────────────────────────
const PAYMENT_GATEWAYS_SEED = [
  { id: 'gw1', name: 'Stripe', provider: 'stripe', enabled: true, mode: 'live', feePercent: 2.9, feeFixed: '$0.30', currencies: ['USD', 'EUR', 'GBP', 'NOK'], webhookOk: true, volume30d: '$24,320' },
  { id: 'gw2', name: 'PayPal', provider: 'paypal', enabled: true, mode: 'live', feePercent: 3.49, feeFixed: '$0.49', currencies: ['USD', 'EUR'], webhookOk: false, volume30d: '$4,110' },
  { id: 'gw3', name: 'Crypto (USDC)', provider: 'crypto', enabled: false, mode: 'test', feePercent: 1.0, feeFixed: '$0.00', currencies: ['USDC', 'ETH'], webhookOk: false, volume30d: '$0' },
  { id: 'gw4', name: 'Klarna', provider: 'klarna', enabled: true, mode: 'live', feePercent: 3.29, feeFixed: '$0.35', currencies: ['EUR', 'NOK', 'SEK'], webhookOk: true, volume30d: '$6,890' },
  { id: 'gw5', name: 'Apple Pay', provider: 'applepay', enabled: true, mode: 'live', feePercent: 2.9, feeFixed: '$0.30', currencies: ['USD', 'EUR'], webhookOk: true, volume30d: '$3,200' },
]
export async function getAdminPaymentGateways() {
  if (MOCK) { await new Promise(r => setTimeout(r, 260)); return [...PAYMENT_GATEWAYS_SEED] }
  return request('GET', '/v1/mlm/admin/payment-gateways')
}
export async function toggleAdminPaymentGateway(id) {
  if (MOCK) { await new Promise(r => setTimeout(r, 200)); return { ok: true } }
  return request('POST', `/v1/mlm/admin/payment-gateways/${id}/toggle`)
}
export async function testAdminPaymentGateway(id) {
  if (MOCK) { await new Promise(r => setTimeout(r, 900)); return { ok: id !== 'gw2', error: id === 'gw2' ? 'Webhook not configured' : null } }
  return request('POST', `/v1/mlm/admin/payment-gateways/${id}/test`)
}

// ── Customer Groups ───────────────────────────────────────────────────────────
const CUSTOMER_GROUPS_SEED = [
  { id: 'cg1', name: 'Retail', description: 'Standard retail customers', icon: '🛒', color: '#1e3a5f', priceMultiplier: 1.0, minOrderValue: null, welcomeEmail: true, memberCount: 1240, members: [{id:'m1',name:'Anna S.'},{id:'m2',name:'Mark T.'}] },
  { id: 'cg2', name: 'Wholesale', description: 'Bulk buyers with discounted pricing', icon: '📦', color: '#052e16', priceMultiplier: 0.75, minOrderValue: 200, welcomeEmail: true, memberCount: 88, members: [{id:'m3',name:'Nordic Health AS'},{id:'m4',name:'FitStore AB'}] },
  { id: 'cg3', name: 'VIP', description: 'Top-tier members and high-value customers', icon: '👑', color: '#3b1f00', priceMultiplier: 0.85, minOrderValue: null, welcomeEmail: true, memberCount: 34, members: [{id:'m5',name:'Erik B.'},{id:'m6',name:'Sofia L.'}] },
  { id: 'cg4', name: 'Staff', description: 'Internal team accounts', icon: '🏢', color: '#2d1515', priceMultiplier: 0.50, minOrderValue: null, welcomeEmail: false, memberCount: 5, members: [{id:'m7',name:'Gary G.'},{id:'m8',name:'Bjørn H.'}] },
]
export async function getAdminCustomerGroups() {
  if (MOCK) { await new Promise(r => setTimeout(r, 260)); return [...CUSTOMER_GROUPS_SEED] }
  return request('GET', '/v1/mlm/admin/customer-groups')
}
export async function createAdminCustomerGroup(data) {
  if (MOCK) { await new Promise(r => setTimeout(r, 280)); return { id: `cg${Date.now()}`, ...data, memberCount: 0, members: [], icon: '👤', color: '#1e3a5f' } }
  return request('POST', '/v1/mlm/admin/customer-groups', data)
}
export async function updateAdminCustomerGroup(id, data) {
  if (MOCK) { await new Promise(r => setTimeout(r, 220)); return { ok: true } }
  return request('PUT', `/v1/mlm/admin/customer-groups/${id}`, data)
}
export async function deleteAdminCustomerGroup(id) {
  if (MOCK) { await new Promise(r => setTimeout(r, 200)); return { ok: true } }
  return request('DELETE', `/v1/mlm/admin/customer-groups/${id}`)
}

// ── Quality Control ───────────────────────────────────────────────────────────
const QC_BATCHES_SEED = [
  { id: 'qc1', batchNo: 'B2608-001', product: 'BPC-157 5mg', lot: 'L-8801', quantity: 500, mfgDate: '2026-07-01', expiryDate: '2028-07-01', daysToExpiry: 700, status: 'pass', coaUrl: '#' },
  { id: 'qc2', batchNo: 'B2608-002', product: 'TB-500 2mg', lot: 'L-8802', quantity: 300, mfgDate: '2026-07-15', expiryDate: '2026-10-15', daysToExpiry: 68, status: 'review', coaUrl: '#' },
  { id: 'qc3', batchNo: 'B2608-003', product: 'Semax 30mg', lot: 'L-8803', quantity: 200, mfgDate: '2026-08-01', expiryDate: '2028-08-01', daysToExpiry: 723, status: 'pending', coaUrl: null },
  { id: 'qc4', batchNo: 'B2607-005', product: 'CJC-1295 2mg', lot: 'L-8790', quantity: 400, mfgDate: '2026-06-20', expiryDate: '2026-09-30', daysToExpiry: 53, status: 'fail', coaUrl: '#' },
  { id: 'qc5', batchNo: 'B2608-004', product: 'Ipamorelin 2mg', lot: 'L-8810', quantity: 600, mfgDate: '2026-08-05', expiryDate: '2028-08-05', daysToExpiry: 727, status: 'pass', coaUrl: '#' },
]
export async function getAdminQcBatches() {
  if (MOCK) { await new Promise(r => setTimeout(r, 260)); return [...QC_BATCHES_SEED] }
  return request('GET', '/v1/mlm/admin/qc-batches')
}
export async function createAdminQcBatch(data) {
  if (MOCK) { await new Promise(r => setTimeout(r, 300)); return { id: `qc${Date.now()}`, ...data, status: 'pending', daysToExpiry: 730, coaUrl: null } }
  return request('POST', '/v1/mlm/admin/qc-batches', data)
}
export async function updateAdminQcBatchStatus(id, status) {
  if (MOCK) { await new Promise(r => setTimeout(r, 200)); return { ok: true } }
  return request('PUT', `/v1/mlm/admin/qc-batches/${id}/status`, { status })
}

// ── Price Alerts ──────────────────────────────────────────────────────────────
const MEMBER_PRICE_ALERTS_SEED = [
  { id: 'pa1', productName: 'BPC-157 5mg', type: 'price_drop', targetPrice: '$48.00', currentPrice: '$52.00', active: true, image: null },
  { id: 'pa2', productName: 'TB-500 2mg', type: 'back_in_stock', active: true, image: null },
  { id: 'pa3', productName: 'PT-141 10mg', type: 'low_stock', active: false, currentPrice: '$65.00', image: null },
]
export async function getMemberPriceAlerts() {
  if (MOCK) { await new Promise(r => setTimeout(r, 230)); return [...MEMBER_PRICE_ALERTS_SEED] }
  return request('GET', '/v1/mlm/member/price-alerts')
}
export async function deleteMemberPriceAlert(id) {
  if (MOCK) { await new Promise(r => setTimeout(r, 180)); return { ok: true } }
  return request('DELETE', `/v1/mlm/member/price-alerts/${id}`)
}
export async function toggleMemberPriceAlert(id) {
  if (MOCK) { await new Promise(r => setTimeout(r, 180)); return { ok: true } }
  return request('POST', `/v1/mlm/member/price-alerts/${id}/toggle`)
}

// ── Team Chat ─────────────────────────────────────────────────────────────────
const TEAM_CHAT_THREADS = [
  { id: 'tc1', name: 'team-general', memberCount: 24, lastMessage: 'Great week everyone! 🎉', unread: 3 },
  { id: 'tc2', name: 'team-leaders', memberCount: 8, lastMessage: 'New rank campaign starting Monday', unread: 0 },
  { id: 'tc3', name: 'product-updates', memberCount: 24, lastMessage: 'BPC-157 restock confirmed', unread: 1 },
]
const TEAM_CHAT_MESSAGES = {
  tc1: [
    { id: 'm1', author: 'Bjørn H.', text: 'Welcome to the team chat! 👋', time: '08:00' },
    { id: 'm2', author: 'Anna S.', text: 'Thanks! Excited to be here', time: '08:14' },
    { id: 'm3', author: 'Mark T.', text: 'Great week everyone! 🎉', time: '08:30' },
  ],
  tc2: [
    { id: 'm4', author: 'Gary G.', text: 'New rank campaign starting Monday — target is Gold+', time: '09:00' },
    { id: 'm5', author: 'Bjørn H.', text: 'Commission rates updated in the doc', time: '09:15' },
  ],
  tc3: [
    { id: 'm6', author: 'Gary G.', text: 'BPC-157 restock confirmed for next week', time: '07:45' },
    { id: 'm7', author: 'Sofia L.', text: 'Great, my team was asking about this 🙌', time: '07:52' },
  ],
}
export async function getMemberTeamChatThreads() {
  if (MOCK) { await new Promise(r => setTimeout(r, 220)); return [...TEAM_CHAT_THREADS] }
  return request('GET', '/v1/mlm/member/team-chat/threads')
}
export async function getMemberTeamChatMessages(threadId) {
  if (MOCK) { await new Promise(r => setTimeout(r, 200)); return [...(TEAM_CHAT_MESSAGES[threadId] || [])] }
  return request('GET', `/v1/mlm/member/team-chat/threads/${threadId}/messages`)
}
export async function sendMemberTeamChatMessage(threadId, text) {
  if (MOCK) { await new Promise(r => setTimeout(r, 250)); return { id: `m${Date.now()}`, author: 'You', text, time: new Date().toTimeString().slice(0,5) } }
  return request('POST', `/v1/mlm/member/team-chat/threads/${threadId}/messages`, { text })
}

// ── Wallet History ────────────────────────────────────────────────────────────
const WALLET_HISTORY_SEED = [
  { id: 'wh1', type: 'commission', description: 'July commission payout', amount: 420.00, balance: 1240.50, date: '2026-08-01', ref: 'RUN-0801' },
  { id: 'wh2', type: 'bonus', description: 'Fast Start bonus', amount: 100.00, balance: 820.50, date: '2026-07-28', ref: 'BONUS-FS-24' },
  { id: 'wh3', type: 'purchase', description: 'Autoship order #A-3901', amount: -89.90, balance: 720.50, date: '2026-07-25', ref: 'ORD-3901' },
  { id: 'wh4', type: 'withdrawal', description: 'Bank withdrawal', amount: -500.00, balance: 810.40, date: '2026-07-20', ref: 'PAY-7821' },
  { id: 'wh5', type: 'commission', description: 'Team override commission', amount: 185.00, balance: 1310.40, date: '2026-07-15', ref: 'RUN-0715' },
  { id: 'wh6', type: 'referral', description: 'Referral bonus — Erik B.', amount: 25.00, balance: 1125.40, date: '2026-07-12', ref: 'REF-EB' },
  { id: 'wh7', type: 'loyalty', description: 'Loyalty points redemption', amount: 15.00, balance: 1100.40, date: '2026-07-10', ref: 'LP-450' },
  { id: 'wh8', type: 'adjustment', description: 'Correction — June run', amount: -12.50, balance: 1085.40, date: '2026-07-08', ref: 'ADJ-JUN' },
  { id: 'wh9', type: 'refund', description: 'Return — order #3822', amount: 49.90, balance: 1097.90, date: '2026-07-05', ref: 'RET-3822' },
  { id: 'wh10', type: 'commission', description: 'June commission payout', amount: 380.00, balance: 1048.00, date: '2026-07-01', ref: 'RUN-0701' },
]
export async function getMemberWalletHistory() {
  if (MOCK) { await new Promise(r => setTimeout(r, 240)); return [...WALLET_HISTORY_SEED] }
  return request('GET', '/v1/mlm/member/wallet/history')
}

// ── Two-Factor Authentication ─────────────────────────────────────────────────
export async function getMemberTwoFactorStatus() {
  if (MOCK) { await new Promise(r => setTimeout(r, 220)); return { enabled: false, verifiedAt: null, unusedBackupCodes: 0 } }
  return request('GET', '/v1/mlm/member/2fa/status')
}
export async function enableMemberTwoFactor() {
  if (MOCK) { await new Promise(r => setTimeout(r, 400)); return { qrCode: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2ZmZiIvPjx0ZXh0IHg9IjUwIiB5PSI1NSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1zaXplPSIxMiIgZmlsbD0iIzAwMCI+W1FSXSA8L3RleHQ+PC9zdmc+', secret: 'JBSWY3DPEHPK3PXP' } }
  return request('POST', '/v1/mlm/member/2fa/enable')
}
export async function verifyMemberTwoFactor(code) {
  if (MOCK) { await new Promise(r => setTimeout(r, 500)); return code === '123456' || code.length === 6 ? { success: true, backupCodes: ['A1B2-C3D4','E5F6-G7H8','I9J0-K1L2','M3N4-O5P6','Q7R8-S9T0','U1V2-W3X4','Y5Z6-A7B8','C9D0-E1F2'] } : { success: false } }
  return request('POST', '/v1/mlm/member/2fa/verify', { code })
}
export async function disableMemberTwoFactor(code) {
  if (MOCK) { await new Promise(r => setTimeout(r, 500)); return { success: true } }
  return request('POST', '/v1/mlm/member/2fa/disable', { code })
}
export async function regenerateMemberBackupCodes() {
  if (MOCK) { await new Promise(r => setTimeout(r, 400)); return ['AA11-BB22','CC33-DD44','EE55-FF66','GG77-HH88','II99-JJ00','KK11-LL22','MM33-NN44','OO55-PP66'] }
  return request('POST', '/v1/mlm/member/2fa/backup-codes/regenerate')
}

// ── Admin: Supplier Orders ──────────────────────────────────────────────────
export async function getAdminSupplierOrders() {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 500))
    return [
      { id: 's1', poNumber: '1042', vendorName: 'Nordic Pharma AS', status: 'ordered', itemCount: 12, totalValue: 18400, expectedDate: '2026-08-15', lastUpdated: '2026-08-06' },
      { id: 's2', poNumber: '1041', vendorName: 'BioActive Labs', status: 'received', itemCount: 8, totalValue: 9200, expectedDate: '2026-08-05', lastUpdated: '2026-08-05' },
      { id: 's3', poNumber: '1043', vendorName: 'PeptideCore GmbH', status: 'pending', itemCount: 5, totalValue: 6750, expectedDate: '2026-08-20', lastUpdated: '2026-08-07' },
      { id: 's4', poNumber: '1044', vendorName: 'Arctic Nutrients', status: 'draft', itemCount: 3, totalValue: 3100, expectedDate: '2026-08-25', lastUpdated: '2026-08-08' },
    ]
  }
  return request('GET', '/v1/mlm/admin/supplier-orders')
}
export async function createAdminSupplierOrder(data) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 600))
    return { id: 's' + Date.now(), poNumber: String(1045 + Math.floor(Math.random() * 100)), status: 'draft', itemCount: 0, totalValue: 0, lastUpdated: new Date().toISOString().slice(0,10), ...data }
  }
  return request('POST', '/v1/mlm/admin/supplier-orders', data)
}
export async function updateAdminSupplierOrderStatus(id, status) {
  if (MOCK) { await new Promise(r => setTimeout(r, 400)); return { id, status } }
  return request('PATCH', `/v1/mlm/admin/supplier-orders/${id}/status`, { status })
}
export async function deleteAdminSupplierOrder(id) {
  if (MOCK) { await new Promise(r => setTimeout(r, 400)); return { ok: true } }
  return request('DELETE', `/v1/mlm/admin/supplier-orders/${id}`)
}

// ── Admin: Automation Rules ─────────────────────────────────────────────────
export async function getAdminAutomationRules() {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 500))
    return [
      { id: 'ar1', name: 'Welcome email on signup', trigger: 'Member registers', action: 'Send email', delay: '0', active: true, runCount: 1842, lastRun: '2026-08-08 14:22' },
      { id: 'ar2', name: 'Rank promotion badge', trigger: 'Rank promoted', action: 'Award badge', delay: '0', active: true, runCount: 234, lastRun: '2026-08-07 09:10' },
      { id: 'ar3', name: 'Re-engagement SMS', trigger: 'Inactivity 30 days', action: 'Send SMS', delay: '0', active: false, runCount: 87, lastRun: '2026-08-01 11:00' },
      { id: 'ar4', name: 'Birthday loyalty bonus', trigger: 'Birthday', action: 'Add loyalty points', delay: '0', active: true, runCount: 412, lastRun: '2026-08-08 00:01' },
      { id: 'ar5', name: 'Post-purchase coupon', trigger: 'Order completed', action: 'Apply coupon', delay: '24', active: true, runCount: 3201, lastRun: '2026-08-08 16:05' },
    ]
  }
  return request('GET', '/v1/mlm/admin/automation-rules')
}
export async function createAdminAutomationRule(data) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 600))
    return { id: 'ar' + Date.now(), active: true, runCount: 0, lastRun: null, ...data }
  }
  return request('POST', '/v1/mlm/admin/automation-rules', data)
}
export async function toggleAdminAutomationRule(id, active) {
  if (MOCK) { await new Promise(r => setTimeout(r, 300)); return { id, active } }
  return request('PATCH', `/v1/mlm/admin/automation-rules/${id}/toggle`, { active })
}
export async function deleteAdminAutomationRule(id) {
  if (MOCK) { await new Promise(r => setTimeout(r, 400)); return { ok: true } }
  return request('DELETE', `/v1/mlm/admin/automation-rules/${id}`)
}

// ── Admin: Data Exports ─────────────────────────────────────────────────────
export async function getAdminDataExports() {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 500))
    return [
      { id: 'ex1', name: 'Monthly Commissions Aug 2026', template: 'Commissions', format: 'CSV', schedule: 'once', status: 'completed', rowCount: 2140, fileSize: '1.2 MB', downloadUrl: '#', createdAt: '2026-08-01' },
      { id: 'ex2', name: 'Weekly Member Export', template: 'Members', format: 'Excel (XLSX)', schedule: 'weekly', status: 'completed', rowCount: 8920, fileSize: '4.8 MB', downloadUrl: '#', createdAt: '2026-08-05' },
      { id: 'ex3', name: 'Product Inventory Snapshot', template: 'Inventory', format: 'CSV', schedule: 'once', status: 'running', rowCount: null, fileSize: null, downloadUrl: null, createdAt: '2026-08-08' },
      { id: 'ex4', name: 'Tax Summary Q2', template: 'Tax Summary', format: 'Excel (XLSX)', schedule: 'once', status: 'failed', rowCount: null, fileSize: null, downloadUrl: null, createdAt: '2026-07-30' },
    ]
  }
  return request('GET', '/v1/mlm/admin/data-exports')
}
export async function createAdminDataExport(data) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 600))
    return { id: 'ex' + Date.now(), status: 'pending', rowCount: null, fileSize: null, downloadUrl: null, createdAt: new Date().toISOString().slice(0,10), ...data }
  }
  return request('POST', '/v1/mlm/admin/data-exports', data)
}
export async function deleteAdminDataExport(id) {
  if (MOCK) { await new Promise(r => setTimeout(r, 400)); return { ok: true } }
  return request('DELETE', `/v1/mlm/admin/data-exports/${id}`)
}

// ── Admin: Chat Support ─────────────────────────────────────────────────────
export async function getAdminChatSupport() {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 500))
    return [
      { id: 'ch1', memberName: 'Lars Andersen', status: 'open', waitTime: '12 min', lastMessage: 'Hi, I have a question about my commission payout this month', startedAt: '14:08', messageCount: 3, assignedTo: null, messages: [{ role: 'member', text: 'Hi, I have a question about my commission payout this month' }, { role: 'member', text: 'It says pending since 3 days' }] },
      { id: 'ch2', memberName: 'Ingrid Svensson', status: 'assigned', waitTime: '4 min', lastMessage: "Thanks for your help!", startedAt: '14:22', messageCount: 8, assignedTo: 'Alice K.', messages: [{ role: 'member', text: 'I cannot log in to the portal' }, { role: 'agent', text: 'Let me help you reset your password' }, { role: 'member', text: "Thanks for your help!" }] },
      { id: 'ch3', memberName: 'Bjørn Olsen', status: 'open', waitTime: '28 min', lastMessage: 'How do I upgrade my membership plan?', startedAt: '13:48', messageCount: 1, assignedTo: null, messages: [{ role: 'member', text: 'How do I upgrade my membership plan?' }] },
      { id: 'ch4', memberName: 'Astrid Hansen', status: 'resolved', waitTime: '—', lastMessage: 'Issue resolved, thank you!', startedAt: '11:30', messageCount: 12, assignedTo: 'Bruno T.', messages: [{ role: 'member', text: 'My order never arrived' }, { role: 'agent', text: 'I can see it was dispatched on Aug 3' }, { role: 'member', text: 'Issue resolved, thank you!' }] },
    ]
  }
  return request('GET', '/v1/mlm/admin/chat-support')
}
export async function assignAdminChatConversation(id, agent) {
  if (MOCK) { await new Promise(r => setTimeout(r, 400)); return { id, agent } }
  return request('POST', `/v1/mlm/admin/chat-support/${id}/assign`, { agent })
}
export async function closeAdminChatConversation(id) {
  if (MOCK) { await new Promise(r => setTimeout(r, 400)); return { ok: true } }
  return request('POST', `/v1/mlm/admin/chat-support/${id}/resolve`)
}

// ── Member: Learning Path ───────────────────────────────────────────────────
export async function getMemberLearningPath() {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 500))
    return {
      completedCount: 7, inProgressCount: 2, certifications: 3, totalXp: 4200,
      modules: [
        { id: 'lp1', title: 'Business Foundations', category: 'foundation', icon: '🏗️', description: 'Core MLM concepts, compensation plan overview, and ethics.', totalLessons: 8, completedLessons: 8, duration: '2h 15m', xp: 500, status: 'completed', certified: true },
        { id: 'lp2', title: 'Product Mastery', category: 'product', icon: '🧬', description: 'Deep dive into peptide science and all Viking Peptides products.', totalLessons: 12, completedLessons: 12, duration: '3h 40m', xp: 750, status: 'completed', certified: true },
        { id: 'lp3', title: 'Sales Techniques', category: 'sales', icon: '🎯', description: 'Proven sales scripts, objection handling, and closing strategies.', totalLessons: 10, completedLessons: 6, duration: '2h 30m', xp: 600, status: 'in_progress', certified: false },
        { id: 'lp4', title: 'Team Leadership', category: 'leadership', icon: '👑', description: 'Building and motivating your downline for long-term success.', totalLessons: 9, completedLessons: 0, duration: '2h 00m', xp: 600, status: 'locked', certified: false },
        { id: 'lp5', title: 'Digital Marketing', category: 'sales', icon: '📱', description: 'Social media, content creation, and online prospecting.', totalLessons: 11, completedLessons: 4, duration: '3h 10m', xp: 700, status: 'in_progress', certified: false },
        { id: 'lp6', title: 'Compliance & Legal', category: 'compliance', icon: '⚖️', description: 'FTC guidelines, income disclosure rules, and ethical selling.', totalLessons: 6, completedLessons: 6, duration: '1h 45m', xp: 400, status: 'completed', certified: true },
        { id: 'lp7', title: 'Advanced Leadership', category: 'leadership', icon: '🌟', description: 'Advanced strategies for building a 6-figure organisation.', totalLessons: 14, completedLessons: 0, duration: '4h 00m', xp: 1000, status: 'locked', certified: false },
      ]
    }
  }
  return request('GET', '/v1/mlm/member/learning-path')
}

// ── Member: Team Performance ────────────────────────────────────────────────
export async function getMemberTeamPerformance(period) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 500))
    return {
      teamVolume: 48200, teamOrders: 312, newRecruits: 8, activeMembers: 24, totalMembers: 31,
      members: [
        { id: 'm1', name: 'Lars Andersen', rank: 'Silver', volume: 8400, orders: 54, recruits: 3, active: true, joinedAt: 'Jan 2025' },
        { id: 'm2', name: 'Ingrid Svensson', rank: 'Gold', volume: 7200, orders: 48, recruits: 2, active: true, joinedAt: 'Mar 2025' },
        { id: 'm3', name: 'Erik Johansen', rank: 'Bronze', volume: 5100, orders: 33, recruits: 0, active: true, joinedAt: 'Jun 2025' },
        { id: 'm4', name: 'Astrid Hansen', rank: 'Silver', volume: 4800, orders: 31, recruits: 1, active: true, joinedAt: 'Feb 2025' },
        { id: 'm5', name: 'Olaf Berg', rank: 'Bronze', volume: 3200, orders: 21, recruits: 0, active: true, joinedAt: 'Sep 2025' },
        { id: 'm6', name: 'Freya Larsen', rank: 'Member', volume: 1800, orders: 12, recruits: 1, active: true, joinedAt: 'Nov 2025' },
        { id: 'm7', name: 'Sigrid Nielsen', rank: 'Member', volume: 900, orders: 6, recruits: 0, active: false, joinedAt: 'Dec 2025' },
      ]
    }
  }
  return request('GET', `/v1/mlm/member/team-performance?period=${period}`)
}

// ── Member: Product Comparison ──────────────────────────────────────────────
export async function getMemberProductCatalogForComparison() {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 500))
    return [
      { id: 'p1', name: 'BPC-157 Standard', category: 'Peptides', price: 89, memberPrice: 71.20, pv: 70, servings: 30, form: 'Capsule', peptides: 'BPC-157 500mcg', storage: 'Refrigerate', vegan: true, glutenFree: true, inStock: true, rating: 4.8 },
      { id: 'p2', name: 'BPC-157 Pro Blend', category: 'Peptides', price: 129, memberPrice: 103.20, pv: 100, servings: 30, form: 'Capsule', peptides: 'BPC-157 1000mcg + TB-500', storage: 'Refrigerate', vegan: true, glutenFree: true, inStock: true, rating: 4.9 },
      { id: 'p3', name: 'TB-500 Thymosin', category: 'Peptides', price: 109, memberPrice: 87.20, pv: 85, servings: 30, form: 'Powder', peptides: 'TB-500 2mg', storage: 'Freeze', vegan: false, glutenFree: true, inStock: true, rating: 4.7 },
      { id: 'p4', name: 'GHK-Cu Skin Complex', category: 'Cosmetic', price: 79, memberPrice: 63.20, pv: 60, servings: 60, form: 'Serum', peptides: 'GHK-Cu 50mg', storage: 'Cool & Dark', vegan: true, glutenFree: true, inStock: false, rating: 4.6 },
      { id: 'p5', name: 'CJC-1295 Growth', category: 'Peptides', price: 149, memberPrice: 119.20, pv: 120, servings: 20, form: 'Powder', peptides: 'CJC-1295 2mg', storage: 'Freeze', vegan: false, glutenFree: true, inStock: true, rating: 4.5 },
    ]
  }
  return request('GET', '/v1/mlm/member/products/comparison-catalog')
}

// ── Member: Event Calendar ──────────────────────────────────────────────────
export async function getMemberEventCalendar(year, month) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 500))
    const base = `${year}-${String(month).padStart(2, '0')}`
    return [
      { id: 'ev1', title: 'Weekly Team Call', type: 'call', date: `${base}-09`, time: '18:00 CET', duration: '1h', description: 'Weekly check-in with your upline. Bring questions and wins.', host: 'Gary G.', registered: true },
      { id: 'ev2', title: 'Product Science Webinar', type: 'webinar', date: `${base}-12`, time: '19:00 CET', duration: '1.5h', description: 'Deep dive into BPC-157 peptide mechanisms with our R&D team.', host: 'Dr. Larsson', registered: false },
      { id: 'ev3', title: 'Sales Mastery Training', type: 'training', date: `${base}-14`, time: '10:00 CET', duration: '3h', description: 'Hands-on workshop covering objection handling and closing.', host: 'Ingrid S.', registered: false },
      { id: 'ev4', title: 'Nordic Vitals Launch Event', type: 'product', date: `${base}-20`, time: '15:00 CET', duration: '2h', description: 'Official launch of our new GHK-Cu serum line. Attendees get first access.', host: 'Bjørn V.', registered: true },
      { id: 'ev5', title: 'Leadership Rally Oslo', type: 'rally', date: `${base}-22`, time: '09:00 CET', duration: 'Full day', description: 'Annual leadership summit. Silver+ ranks only.', host: 'Arctico Team', registered: false },
      { id: 'ev6', title: 'Monthly Business Review', type: 'webinar', date: `${base}-28`, time: '17:00 CET', duration: '1h', description: 'August performance recap, top earners spotlight, September preview.', host: 'Gary G.', registered: false },
    ]
  }
  return request('GET', `/v1/mlm/member/events/calendar?year=${year}&month=${month}`)
}
export async function registerMemberCalendarEvent(id) {
  if (MOCK) { await new Promise(r => setTimeout(r, 500)); return { ok: true } }
  return request('POST', `/v1/mlm/member/events/${id}/register`)
}

// ── Admin: Geo Blocking ─────────────────────────────────────────────────────
export async function getAdminGeoBlocking() {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 500))
    return {
      defaultPolicy: 'allow',
      rules: [
        { id: 'gb1', country: 'United States', code: 'US', flag: '🇺🇸', scope: 'all', status: 'allowed', reason: 'Primary market' },
        { id: 'gb2', country: 'Norway', code: 'NO', flag: '🇳🇴', scope: 'all', status: 'allowed', reason: 'HQ country' },
        { id: 'gb3', country: 'Germany', code: 'DE', flag: '🇩🇪', scope: 'all', status: 'allowed', reason: 'EU market' },
        { id: 'gb4', country: 'North Korea', code: 'KP', flag: '🇰🇵', scope: 'all', status: 'blocked', reason: 'Sanctions compliance' },
        { id: 'gb5', country: 'Iran', code: 'IR', flag: '🇮🇷', scope: 'all', status: 'blocked', reason: 'Sanctions compliance' },
        { id: 'gb6', country: 'Russia', code: 'RU', flag: '🇷🇺', scope: 'membership', status: 'blocked', reason: 'Payment restrictions' },
        { id: 'gb7', country: 'China', code: 'CN', flag: '🇨🇳', scope: 'membership', status: 'restricted', reason: 'Regulatory review pending' },
        { id: 'gb8', country: 'Brazil', code: 'BR', flag: '🇧🇷', scope: 'all', status: 'allowed', reason: 'Active market' },
      ]
    }
  }
  return request('GET', '/v1/mlm/admin/geo-blocking')
}
export async function createAdminGeoRule(rule) {
  if (MOCK) { await new Promise(r => setTimeout(r, 500)); return { id: `gb${Date.now()}`, ...rule } }
  return request('POST', '/v1/mlm/admin/geo-blocking', rule)
}
export async function updateAdminGeoRule(id, patch) {
  if (MOCK) { await new Promise(r => setTimeout(r, 400)); return { id, ...patch } }
  return request('PATCH', `/v1/mlm/admin/geo-blocking/${id}`, patch)
}
export async function deleteAdminGeoRule(id) {
  if (MOCK) { await new Promise(r => setTimeout(r, 400)); return { ok: true } }
  return request('DELETE', `/v1/mlm/admin/geo-blocking/${id}`)
}

// ── Admin: Product Labels ───────────────────────────────────────────────────
export async function getAdminProductLabels() {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 500))
    return [
      { id: 'pl1', name: 'Bestseller', color: '#f59e0b', textColor: '#000', icon: '🏆', assignedCount: 4, active: true },
      { id: 'pl2', name: 'New', color: '#10b981', textColor: '#fff', icon: '✨', assignedCount: 2, active: true },
      { id: 'pl3', name: 'Limited Edition', color: '#8b5cf6', textColor: '#fff', icon: '⏳', assignedCount: 1, active: true },
      { id: 'pl4', name: 'Sale', color: '#ef4444', textColor: '#fff', icon: '🔥', assignedCount: 3, active: true },
      { id: 'pl5', name: 'Staff Pick', color: '#3b82f6', textColor: '#fff', icon: '⭐', assignedCount: 2, active: true },
      { id: 'pl6', name: 'Out of Season', color: '#64748b', textColor: '#fff', icon: '❄️', assignedCount: 0, active: false },
    ]
  }
  return request('GET', '/v1/mlm/admin/product-labels')
}
export async function createAdminProductLabel(label) {
  if (MOCK) { await new Promise(r => setTimeout(r, 500)); return { id: `pl${Date.now()}`, assignedCount: 0, active: true, ...label } }
  return request('POST', '/v1/mlm/admin/product-labels', label)
}
export async function toggleAdminProductLabel(id, active) {
  if (MOCK) { await new Promise(r => setTimeout(r, 400)); return { id, active } }
  return request('PATCH', `/v1/mlm/admin/product-labels/${id}`, { active })
}
export async function deleteAdminProductLabel(id) {
  if (MOCK) { await new Promise(r => setTimeout(r, 400)); return { ok: true } }
  return request('DELETE', `/v1/mlm/admin/product-labels/${id}`)
}

// ── Admin: Sales Scripts ────────────────────────────────────────────────────
export async function getAdminSalesScripts() {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 500))
    return [
      { id: 'ss1', title: 'Cold Outreach — Social Media DM', category: 'prospecting', stage: 'outreach', views: 1284, downloads: 342, rating: 4.7, updatedAt: '2026-07-20', content: "Hey [Name]! I noticed you're interested in health and fitness. I'm part of an exciting brand called Nordic Vitals — we make science-backed peptide supplements. Would you be open to a quick chat about what we do?" },
      { id: 'ss2', title: 'Product Presentation — BPC-157', category: 'product', stage: 'presentation', views: 987, downloads: 256, rating: 4.8, updatedAt: '2026-07-18', content: "BPC-157 is a naturally occurring peptide that supports tissue repair, gut health, and recovery. Clinical studies show remarkable results for joint and muscle regeneration..." },
      { id: 'ss3', title: 'Handling Objection — "It\'s too expensive"', category: 'objection', stage: 'closing', views: 756, downloads: 198, rating: 4.6, updatedAt: '2026-07-15', content: "I totally understand. Let me put it in perspective — a single physiotherapy session costs the same as a month's supply. Our members report they've saved thousands in medical bills..." },
      { id: 'ss4', title: 'Team Recruitment — Initial Invite', category: 'recruitment', stage: 'outreach', views: 654, downloads: 167, rating: 4.5, updatedAt: '2026-07-10', content: "I'm building a health and wellness business and looking for motivated people to partner with. The opportunity allows you to earn both retail commissions and team bonuses..." },
      { id: 'ss5', title: 'Follow-Up After Presentation', category: 'prospecting', stage: 'follow_up', views: 543, downloads: 143, rating: 4.4, updatedAt: '2026-07-05', content: "Hi [Name], just checking in after our conversation last week. Have you had a chance to look over the information I sent? I'd love to answer any questions..." },
      { id: 'ss6', title: 'Closing — Membership Sign-Up', category: 'recruitment', stage: 'closing', views: 432, downloads: 112, rating: 4.9, updatedAt: '2026-06-28', content: "Based on everything you've shared with me, I think this is a perfect fit for your goals. Let me walk you through the simple sign-up process — it only takes about 5 minutes..." },
    ]
  }
  return request('GET', '/v1/mlm/admin/sales-scripts')
}
export async function createAdminSalesScript(script) {
  if (MOCK) { await new Promise(r => setTimeout(r, 500)); return { id: `ss${Date.now()}`, views: 0, downloads: 0, rating: null, updatedAt: new Date().toISOString().slice(0,10), ...script } }
  return request('POST', '/v1/mlm/admin/sales-scripts', script)
}
export async function deleteAdminSalesScript(id) {
  if (MOCK) { await new Promise(r => setTimeout(r, 400)); return { ok: true } }
  return request('DELETE', `/v1/mlm/admin/sales-scripts/${id}`)
}

// ── Admin: Member Marketplace ───────────────────────────────────────────────
export async function getAdminMemberMarketplace() {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 500))
    return [
      { id: 'mk1', title: 'BPC-157 Standard x3 (unopened)', seller: 'Lars Andersen', price: 210, originalPrice: 267, condition: 'new', category: 'products', status: 'active', postedAt: '2026-08-05', views: 43, expiresAt: '2026-08-19' },
      { id: 'mk2', title: 'Nordic Vitals Starter Kit', seller: 'Ingrid Svensson', price: 85, originalPrice: 120, condition: 'new', category: 'kits', status: 'active', postedAt: '2026-08-04', views: 71, expiresAt: '2026-08-18' },
      { id: 'mk3', title: 'Marketing Flyers — 200 pack printed', seller: 'Erik Johansen', price: 25, originalPrice: 40, condition: 'used', category: 'materials', status: 'active', postedAt: '2026-08-03', views: 18, expiresAt: '2026-08-17' },
      { id: 'mk4', title: 'GHK-Cu Skin Complex x2', seller: 'Astrid Hansen', price: 130, originalPrice: 158, condition: 'new', category: 'products', status: 'pending', postedAt: '2026-08-07', views: 9, expiresAt: '2026-08-21' },
      { id: 'mk5', title: 'Business Builder Bundle', seller: 'Olaf Berg', price: 0, originalPrice: 0, condition: 'new', category: 'kits', status: 'sold', postedAt: '2026-07-28', views: 124, expiresAt: '2026-08-11' },
    ]
  }
  return request('GET', '/v1/mlm/admin/marketplace')
}
export async function approveAdminMarketplaceListing(id) {
  if (MOCK) { await new Promise(r => setTimeout(r, 400)); return { ok: true } }
  return request('POST', `/v1/mlm/admin/marketplace/${id}/approve`)
}
export async function removeAdminMarketplaceListing(id) {
  if (MOCK) { await new Promise(r => setTimeout(r, 400)); return { ok: true } }
  return request('DELETE', `/v1/mlm/admin/marketplace/${id}`)
}

// ── Member: Quick Order ─────────────────────────────────────────────────────
export async function getMemberQuickOrderCatalog() {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 500))
    return {
      favorites: [
        { id: 'q1', name: 'BPC-157 Standard', sku: 'VP-BPC-500', price: 89, memberPrice: 71.20, pv: 70, inStock: true, stock: 48, lastOrdered: '2026-07-15', timesOrdered: 8 },
        { id: 'q2', name: 'TB-500 Thymosin', sku: 'VP-TB500-2', price: 109, memberPrice: 87.20, pv: 85, inStock: true, stock: 23, lastOrdered: '2026-07-20', timesOrdered: 5 },
        { id: 'q3', name: 'BPC-157 Pro Blend', sku: 'VP-BPC-PRO', price: 129, memberPrice: 103.20, pv: 100, inStock: true, stock: 31, lastOrdered: '2026-06-30', timesOrdered: 3 },
      ],
      recentOrders: [
        { orderId: 'ORD-7823', date: '2026-07-20', items: [{ id: 'q1', name: 'BPC-157 Standard', qty: 2, memberPrice: 71.20, pv: 70, inStock: true }, { id: 'q2', name: 'TB-500 Thymosin', qty: 1, memberPrice: 87.20, pv: 85, inStock: true }] },
        { orderId: 'ORD-7654', date: '2026-07-03', items: [{ id: 'q3', name: 'BPC-157 Pro Blend', qty: 1, memberPrice: 103.20, pv: 100, inStock: true }] },
      ],
      allProducts: [
        { id: 'q1', name: 'BPC-157 Standard', sku: 'VP-BPC-500', memberPrice: 71.20, pv: 70, inStock: true },
        { id: 'q2', name: 'TB-500 Thymosin', sku: 'VP-TB500-2', memberPrice: 87.20, pv: 85, inStock: true },
        { id: 'q3', name: 'BPC-157 Pro Blend', sku: 'VP-BPC-PRO', memberPrice: 103.20, pv: 100, inStock: true },
        { id: 'q4', name: 'GHK-Cu Skin Complex', sku: 'VP-GHK-50', memberPrice: 63.20, pv: 60, inStock: false },
        { id: 'q5', name: 'CJC-1295 Growth', sku: 'VP-CJC-2', memberPrice: 119.20, pv: 120, inStock: true },
      ]
    }
  }
  return request('GET', '/v1/mlm/member/quick-order')
}
export async function submitMemberQuickOrder(items) {
  if (MOCK) { await new Promise(r => setTimeout(r, 800)); return { orderId: `ORD-${Math.floor(Math.random()*1000)+8000}`, status: 'confirmed' } }
  return request('POST', '/v1/mlm/member/quick-order', { items })
}

// ── Member: Meeting Scheduler ───────────────────────────────────────────────
export async function getMemberMeetingScheduler() {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 500))
    return {
      upline: { name: 'Bjørn Vesterinen', rank: 'Diamond', avatar: 'BV', responseTime: '< 4 hours' },
      upcoming: [
        { id: 'mt1', title: '1:1 Strategy Call', type: '1on1', date: '2026-08-12', time: '15:00 CET', duration: 30, status: 'confirmed', with: 'Bjørn Vesterinen' },
        { id: 'mt2', title: 'Team Onboarding — New Recruits', type: 'group', date: '2026-08-15', time: '18:00 CET', duration: 60, status: 'pending', with: 'Bjørn Vesterinen' },
      ],
      past: [
        { id: 'mt3', title: 'Monthly Business Review', type: '1on1', date: '2026-07-30', time: '14:00 CET', duration: 30, status: 'completed', with: 'Bjørn Vesterinen', notes: 'Discussed rank promotion strategy. Action: recruit 2 members by Aug 15.' },
        { id: 'mt4', title: 'Product Training', type: 'group', date: '2026-07-22', time: '19:00 CET', duration: 60, status: 'completed', with: 'Bjørn Vesterinen', notes: 'Covered BPC-157 science and sales positioning.' },
      ],
      availableSlots: [
        { date: '2026-08-10', slots: ['10:00', '11:00', '14:00'] },
        { date: '2026-08-11', slots: ['09:00', '15:00', '16:00'] },
        { date: '2026-08-13', slots: ['10:00', '13:00'] },
        { date: '2026-08-14', slots: ['11:00', '14:00', '17:00'] },
      ]
    }
  }
  return request('GET', '/v1/mlm/member/meetings')
}
export async function bookMemberMeeting(slot) {
  if (MOCK) { await new Promise(r => setTimeout(r, 600)); return { id: `mt${Date.now()}`, status: 'pending', ...slot } }
  return request('POST', '/v1/mlm/member/meetings', slot)
}
export async function cancelMemberMeeting(id) {
  if (MOCK) { await new Promise(r => setTimeout(r, 400)); return { ok: true } }
  return request('DELETE', `/v1/mlm/member/meetings/${id}`)
}

// ── Member: Knowledge Base ──────────────────────────────────────────────────
export async function getMemberKnowledgeBase(query) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 400))
    const articles = [
      { id: 'kb1', title: 'How does the commission structure work?', category: 'compensation', views: 3842, helpful: 94, lastUpdated: '2026-07-15', excerpt: 'Our binary matrix pays out on two legs. Personal commissions are 20% on retail sales, with team commissions up to 10% on your downline volume...' },
      { id: 'kb2', title: 'What are PV points and how are they calculated?', category: 'compensation', views: 2914, helpful: 91, lastUpdated: '2026-07-10', excerpt: 'PV (Personal Volume) points are assigned to every product. 1 PV ≈ €1 of wholesale price. Each month, your PV total determines...' },
      { id: 'kb3', title: 'How to use BPC-157 safely', category: 'products', views: 5821, helpful: 97, lastUpdated: '2026-07-20', excerpt: 'BPC-157 is generally well-tolerated. Recommended dosage is 200–500mcg per day. Always store refrigerated and consult your physician...' },
      { id: 'kb4', title: 'How do I qualify for autoship discounts?', category: 'orders', views: 1823, helpful: 88, lastUpdated: '2026-06-28', excerpt: 'Members on active autoship with a minimum order of 50 PV receive an additional 5% discount on all products in their autoship order...' },
      { id: 'kb5', title: 'How to recruit your first team member', category: 'recruitment', views: 4312, helpful: 92, lastUpdated: '2026-07-18', excerpt: 'Start with your warm market — friends, family, and colleagues who already trust you. Share your personal story first before presenting the business...' },
      { id: 'kb6', title: 'Rank qualifications explained', category: 'compensation', views: 2103, helpful: 89, lastUpdated: '2026-07-05', excerpt: 'Each rank requires a combination of personal PV and team PV. Bronze requires 100 personal PV + 500 team PV. Silver requires 150 personal PV + 2,000 team PV...' },
      { id: 'kb7', title: 'What is the Fast Start bonus?', category: 'compensation', views: 1654, helpful: 90, lastUpdated: '2026-06-20', excerpt: 'New members who achieve 200 PV in their first 30 days earn a €100 Fast Start bonus. This stacks with regular commissions and is paid in the monthly run...' },
      { id: 'kb8', title: 'How to request a payout', category: 'payments', views: 1432, helpful: 87, lastUpdated: '2026-07-12', excerpt: 'Payouts are processed on the 15th of each month for the previous month\'s commissions. Minimum payout is €50. To request early payout...' },
      { id: 'kb9', title: 'Storage and handling of peptide products', category: 'products', views: 2876, helpful: 96, lastUpdated: '2026-07-22', excerpt: 'Most peptides require refrigeration (2–8°C). Powder forms should be stored in a freezer until reconstituted. Never expose to direct sunlight...' },
      { id: 'kb10', title: 'GDPR and data privacy for EU members', category: 'compliance', views: 876, helpful: 85, lastUpdated: '2026-06-15', excerpt: 'As a GDPR-compliant business, we never sell member data. You can request a full data export or deletion from your Data Privacy page in the dashboard...' },
    ]
    if (query) {
      const q = query.toLowerCase()
      return articles.filter(a => a.title.toLowerCase().includes(q) || a.excerpt.toLowerCase().includes(q) || a.category.includes(q))
    }
    return articles
  }
  return request('GET', `/v1/mlm/member/knowledge-base${query ? `?q=${encodeURIComponent(query)}` : ''}`)
}
export async function markKbArticleHelpful(id, helpful) {
  if (MOCK) { await new Promise(r => setTimeout(r, 300)); return { ok: true } }
  return request('POST', `/v1/mlm/member/knowledge-base/${id}/feedback`, { helpful })
}

// ── Member: Product Samples ─────────────────────────────────────────────────
export async function getMemberProductSamples() {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 500))
    return {
      allowanceUsed: 2, allowanceTotal: 4, resetDate: '2026-09-01',
      history: [
        { id: 'sm1', product: 'BPC-157 Standard (7-day sample)', requestedAt: '2026-08-01', status: 'delivered', trackingCode: 'NO12345678', deliveredAt: '2026-08-04' },
        { id: 'sm2', product: 'GHK-Cu Skin Complex (trial size)', requestedAt: '2026-07-15', status: 'delivered', trackingCode: 'NO98765432', deliveredAt: '2026-07-18' },
        { id: 'sm3', product: 'TB-500 Thymosin (7-day sample)', requestedAt: '2026-08-06', status: 'processing', trackingCode: null, deliveredAt: null },
      ],
      availableSamples: [
        { id: 'sp1', name: 'BPC-157 Standard (7-day sample)', description: '7-day supply of BPC-157 500mcg capsules', pv: 0, value: '€15', available: true },
        { id: 'sp2', name: 'TB-500 Thymosin (7-day sample)', description: '7-day supply of TB-500 2mg powder', pv: 0, value: '€18', available: false },
        { id: 'sp3', name: 'GHK-Cu Skin Complex (trial size)', description: '5ml trial serum — 2 week supply', pv: 0, value: '€12', available: true },
        { id: 'sp4', name: 'CJC-1295 Growth (5-day sample)', description: '5-day supply of CJC-1295 2mg', pv: 0, value: '€20', available: true },
        { id: 'sp5', name: 'Nordic Starter Pack (multi-sample)', description: 'Small samples of 4 bestsellers in one box', pv: 0, value: '€35', available: true },
      ]
    }
  }
  return request('GET', '/v1/mlm/member/samples')
}
export async function requestMemberProductSample(sampleId, address) {
  if (MOCK) { await new Promise(r => setTimeout(r, 600)); return { id: `sm${Date.now()}`, status: 'processing', product: sampleId } }
  return request('POST', '/v1/mlm/member/samples', { sampleId, address })
}

// ── Admin: Credit Notes ─────────────────────────────────────────────────────
export async function getAdminCreditNotes() {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 500))
    return {
      notes: [
        { id: 'CN-1042', memberId: 'M-1042', memberName: 'Anna Svensson', amount: 45, currency: 'EUR', type: 'refund', reason: 'Damaged product — order #8821', status: 'active', issuedAt: '2026-08-05', expiresAt: '2026-11-05' },
        { id: 'CN-1038', memberId: 'M-1038', memberName: 'Erik Lindgren', amount: 20, currency: 'EUR', type: 'goodwill', reason: 'Delayed delivery — goodwill gesture', status: 'used', issuedAt: '2026-07-28', expiresAt: null, usedAt: '2026-08-02' },
        { id: 'CN-1031', memberId: 'M-1031', memberName: 'Maja Karlsson', amount: 120, currency: 'EUR', type: 'correction', reason: 'Overcharge correction — invoice error', status: 'active', issuedAt: '2026-07-20', expiresAt: '2026-10-20' },
        { id: 'CN-1019', memberId: 'M-1019', memberName: 'Lars Andersen', amount: 30, currency: 'EUR', type: 'loyalty', reason: 'Loyalty reward — 1 year anniversary', status: 'expired', issuedAt: '2026-05-01', expiresAt: '2026-07-31' },
        { id: 'CN-1008', memberId: 'M-1008', memberName: 'Ingrid Berg', amount: 60, currency: 'EUR', type: 'refund', reason: 'Returned goods — order #7654', status: 'void', issuedAt: '2026-06-15', expiresAt: null },
      ]
    }
  }
  return request('GET', '/v1/mlm/admin/credit-notes')
}
export async function createAdminCreditNote(data) {
  if (MOCK) { await new Promise(r => setTimeout(r, 700)); return { id: `CN-${Date.now()}`, ...data, status: 'active', issuedAt: new Date().toISOString().slice(0,10), expiresAt: null } }
  return request('POST', '/v1/mlm/admin/credit-notes', data)
}
export async function voidAdminCreditNote(id) {
  if (MOCK) { await new Promise(r => setTimeout(r, 400)); return { ok: true } }
  return request('POST', `/v1/mlm/admin/credit-notes/${id}/void`)
}

// ── Admin: Recruitment Pipeline ─────────────────────────────────────────────
export async function getAdminRecruitmentPipeline() {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 500))
    return {
      avgDaysToEnroll: 18,
      prospects: [
        { id: 'rp1', name: 'Hanna Olsen', email: 'hanna@email.no', recruiter: 'Anna Svensson', stage: 'enrolled', dayInFunnel: 22, source: 'referral', addedAt: '2026-07-17' },
        { id: 'rp2', name: 'Tor Bakke', email: 'tor@email.no', recruiter: 'Erik Lindgren', stage: 'trial', dayInFunnel: 9, source: 'social media', addedAt: '2026-07-30' },
        { id: 'rp3', name: 'Silje Nygård', email: 'silje@email.no', recruiter: 'Maja Karlsson', stage: 'interested', dayInFunnel: 5, source: 'event', addedAt: '2026-08-03' },
        { id: 'rp4', name: 'Olav Haugen', email: 'olav@email.no', recruiter: 'Anna Svensson', stage: 'contacted', dayInFunnel: 3, source: 'personal', addedAt: '2026-08-05' },
        { id: 'rp5', name: 'Kristin Moe', email: 'kristin@email.no', recruiter: 'Lars Andersen', stage: 'lead', dayInFunnel: 1, source: 'online ad', addedAt: '2026-08-08' },
        { id: 'rp6', name: 'Jonas Vik', email: 'jonas@email.no', recruiter: 'Erik Lindgren', stage: 'interested', dayInFunnel: 11, source: 'referral', addedAt: '2026-07-28' },
        { id: 'rp7', name: 'Maria Dahl', email: 'maria@email.no', recruiter: 'Maja Karlsson', stage: 'dropped', dayInFunnel: 30, source: 'social media', addedAt: '2026-07-09' },
        { id: 'rp8', name: 'Bjørn Strand', email: 'bstrand@email.no', recruiter: 'Anna Svensson', stage: 'trial', dayInFunnel: 14, source: 'event', addedAt: '2026-07-25' },
      ]
    }
  }
  return request('GET', '/v1/mlm/admin/recruitment-pipeline')
}

// ── Admin: Email Deliverability ─────────────────────────────────────────────
export async function getAdminEmailDeliverability() {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 500))
    return {
      domain: {
        health: 'excellent', sendingDomain: 'mail.nordicvitals.no',
        deliveryRate: 98.7, openRate: 34.2, clickRate: 6.8,
        bounceRate: 0.8, spamRate: 0.03, unsubRate: 0.12,
        dkim: true, spf: true, dmarc: true,
      },
      campaigns: [
        { id: 'ec1', name: 'August Product Launch', sent: 4821, deliveryRate: 99.1, openRate: 38.4, clickRate: 8.2, bounceRate: 0.6, spamRate: 0.02, sentAt: '2026-08-01' },
        { id: 'ec2', name: 'Summer Sale Newsletter', sent: 5103, deliveryRate: 98.4, openRate: 31.7, clickRate: 5.9, bounceRate: 1.1, spamRate: 0.04, sentAt: '2026-07-15' },
        { id: 'ec3', name: 'New Member Welcome', sent: 312, deliveryRate: 99.7, openRate: 72.4, clickRate: 44.2, bounceRate: 0.3, spamRate: 0.0, sentAt: '2026-07-01' },
        { id: 'ec4', name: 'Commission Run Notification', sent: 2894, deliveryRate: 99.2, openRate: 61.3, clickRate: 28.9, bounceRate: 0.4, spamRate: 0.01, sentAt: '2026-08-05' },
      ],
      issues: []
    }
  }
  return request('GET', '/v1/mlm/admin/email-deliverability')
}

// ── Admin: Affiliate Network ────────────────────────────────────────────────
export async function getAdminAffiliateNetwork() {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 500))
    return {
      affiliates: [
        { id: 'af1', name: 'PeptideBlogNO', email: 'editor@peptideblog.no', website: 'peptideblog.no', commissionPct: 12, tier: 'gold', status: 'active', clicks: 8412, conversions: 84, revenue: 9240, pendingPayout: 1108.80 },
        { id: 'af2', name: 'NordicHealthReview', email: 'contact@nordichealthreview.se', website: 'nordichealthreview.se', commissionPct: 10, tier: 'silver', status: 'active', clicks: 4230, conversions: 38, revenue: 4180, pendingPayout: 418 },
        { id: 'af3', name: 'FitnessFreaks DK', email: 'collab@fitnessfreaks.dk', website: 'fitnessfreaks.dk', commissionPct: 10, tier: 'standard', status: 'paused', clicks: 1820, conversions: 12, revenue: 1320, pendingPayout: 0 },
        { id: 'af4', name: 'BioHackingPodcast', email: 'sponsor@biohackpodcast.com', website: 'biohackpodcast.com', commissionPct: 15, tier: 'platinum', status: 'active', clicks: 14200, conversions: 212, revenue: 23320, pendingPayout: 3498 },
        { id: 'af5', name: 'SportSupplementHub', email: 'partners@sshub.eu', website: 'sshub.eu', commissionPct: 8, tier: 'standard', status: 'pending', clicks: 0, conversions: 0, revenue: 0, pendingPayout: 0 },
      ]
    }
  }
  return request('GET', '/v1/mlm/admin/affiliate-network')
}
export async function createAdminAffiliate(data) {
  if (MOCK) { await new Promise(r => setTimeout(r, 600)); return { id: `af${Date.now()}`, ...data, status: 'pending', clicks: 0, conversions: 0, revenue: 0, pendingPayout: 0 } }
  return request('POST', '/v1/mlm/admin/affiliate-network', data)
}
export async function updateAdminAffiliateStatus(id, status) {
  if (MOCK) { await new Promise(r => setTimeout(r, 300)); return { ok: true } }
  return request('PATCH', `/v1/mlm/admin/affiliate-network/${id}`, { status })
}

// ── Member: Credit Notes ────────────────────────────────────────────────────
export async function getMemberCreditNotes() {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 400))
    return {
      notes: [
        { id: 'CN-1042', amount: 45, currency: 'EUR', type: 'refund', reason: 'Damaged product — order #8821', status: 'active', issuedAt: '2026-08-05', expiresAt: '2026-11-05' },
        { id: 'CN-1031', amount: 120, currency: 'EUR', type: 'correction', reason: 'Overcharge correction — invoice error', status: 'active', issuedAt: '2026-07-20', expiresAt: '2026-10-20' },
        { id: 'CN-1008', amount: 20, currency: 'EUR', type: 'goodwill', reason: 'Goodwill gesture — late delivery', status: 'used', issuedAt: '2026-06-01', usedAt: '2026-06-10' },
      ]
    }
  }
  return request('GET', '/v1/mlm/member/credit-notes')
}

// ── Member: Autoship History ────────────────────────────────────────────────
export async function getMemberAutoshipHistory() {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 500))
    return {
      stats: { total: 14, delivered: 13, totalPv: 1820, totalSpent: 2548 },
      runs: [
        { id: 'as14', orderRef: 'ORD-9201', status: 'delivered', processedAt: '2026-08-01', pv: 150, total: 198, trackingCode: 'NO44123456', items: [{ name: 'BPC-157 500mcg (60 caps)', qty: 1, price: 129 }, { name: 'TB-500 2mg', qty: 1, price: 69 }] },
        { id: 'as13', orderRef: 'ORD-8844', status: 'delivered', processedAt: '2026-07-01', pv: 150, total: 198, trackingCode: 'NO44098765', items: [{ name: 'BPC-157 500mcg (60 caps)', qty: 1, price: 129 }, { name: 'TB-500 2mg', qty: 1, price: 69 }] },
        { id: 'as12', orderRef: 'ORD-8501', status: 'skipped', processedAt: '2026-06-01', pv: 0, total: 0, trackingCode: null, items: [] },
        { id: 'as11', orderRef: 'ORD-8102', status: 'delivered', processedAt: '2026-05-01', pv: 180, total: 248, trackingCode: 'NO43987654', items: [{ name: 'BPC-157 500mcg (60 caps)', qty: 1, price: 129 }, { name: 'GHK-Cu Serum 30ml', qty: 1, price: 89 }, { name: 'Shipping', qty: 1, price: 30 }] },
        { id: 'as10', orderRef: 'ORD-7832', status: 'delivered', processedAt: '2026-04-01', pv: 150, total: 198, trackingCode: 'NO43112233', items: [{ name: 'BPC-157 500mcg (60 caps)', qty: 1, price: 129 }, { name: 'TB-500 2mg', qty: 1, price: 69 }] },
      ]
    }
  }
  return request('GET', '/v1/mlm/member/autoship-history')
}

// ── Member: Recruitment Pipeline ────────────────────────────────────────────
export async function getMemberRecruitmentPipeline() {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 400))
    return {
      prospects: [
        { id: 'mp1', name: 'Hanna Olsen', email: 'hanna@email.no', phone: '+47 912 34 567', stage: 'enrolled', dayInFunnel: 22, source: 'referral', notes: 'Very motivated, loves fitness.' },
        { id: 'mp2', name: 'Tor Bakke', email: 'tor@email.no', phone: '', stage: 'trial', dayInFunnel: 9, source: 'social media', notes: 'Trying BPC-157 starter pack.' },
        { id: 'mp3', name: 'Silje Nygård', email: 'silje@email.no', phone: '+47 900 11 222', stage: 'interested', dayInFunnel: 5, source: 'event', notes: 'Met at Oslo wellness fair.' },
        { id: 'mp4', name: 'Olav Haugen', email: '', phone: '+47 955 44 321', stage: 'contacted', dayInFunnel: 3, source: 'personal', notes: 'Old colleague.' },
        { id: 'mp5', name: 'Kristin Moe', email: 'kristin@email.no', phone: '', stage: 'lead', dayInFunnel: 1, source: 'online ad', notes: '' },
      ]
    }
  }
  return request('GET', '/v1/mlm/member/recruitment-pipeline')
}
export async function addMemberProspect(data) {
  if (MOCK) { await new Promise(r => setTimeout(r, 600)); return { id: `mp${Date.now()}`, ...data, stage: 'lead', dayInFunnel: 0 } }
  return request('POST', '/v1/mlm/member/recruitment-pipeline', data)
}
export async function updateMemberProspectStage(id, stage) {
  if (MOCK) { await new Promise(r => setTimeout(r, 300)); return { ok: true } }
  return request('PATCH', `/v1/mlm/member/recruitment-pipeline/${id}`, { stage })
}

// ── Member: SMART Goals ─────────────────────────────────────────────────────
export async function getMemberSmartGoals() {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 400))
    return {
      goals: [
        { id: 'sg1', title: 'Reach Silver rank by September', category: 'rank', specific: 'Achieve Silver rank by accumulating 2,000 team PV in Q3.', measurable: 'Check team PV weekly in the dashboard.', target: 2000, current: 1240, unit: 'team PV', deadline: '2026-09-30', status: 'on_track', milestones: [{ label: '500 team PV', dueDate: '2026-07-31', done: true }, { label: '1,000 team PV', dueDate: '2026-08-15', done: true }, { label: '1,500 team PV', dueDate: '2026-08-31', done: false }, { label: '2,000 team PV', dueDate: '2026-09-30', done: false }] },
        { id: 'sg2', title: 'Recruit 3 new members in August', category: 'recruitment', specific: 'Personally enroll 3 new members at any starter tier.', measurable: 'Track via recruitment pipeline.', target: 3, current: 1, unit: 'members', deadline: '2026-08-31', status: 'behind', milestones: [] },
        { id: 'sg3', title: 'Complete all Q3 training modules', category: 'learning', specific: 'Finish 8 assigned training modules by end of Q3.', measurable: 'Track in My Learning Path.', target: 8, current: 8, unit: 'modules', deadline: '2026-09-30', status: 'completed', milestones: [] },
      ]
    }
  }
  return request('GET', '/v1/mlm/member/smart-goals')
}
export async function createMemberSmartGoal(data) {
  if (MOCK) { await new Promise(r => setTimeout(r, 600)); return { id: `sg${Date.now()}`, ...data, current: 0, status: 'on_track', milestones: [] } }
  return request('POST', '/v1/mlm/member/smart-goals', data)
}
export async function updateMemberSmartGoalProgress(id, current) {
  if (MOCK) { await new Promise(r => setTimeout(r, 300)); return { ok: true } }
  return request('PATCH', `/v1/mlm/member/smart-goals/${id}`, { current })
}
export async function deleteMemberSmartGoal(id) {
  if (MOCK) { await new Promise(r => setTimeout(r, 300)); return { ok: true } }
  return request('DELETE', `/v1/mlm/member/smart-goals/${id}`)
}

// ── Admin Bulk Messaging ──────────────────────────────────────────────────────
export async function getAdminBulkMessages() {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 400))
    return {
      segments: ['All Members','Active Members','Gold+ Rank','New Members (30d)','Inactive (90d)','Custom Segment A'],
      templates: [
        { id: 't1', name: 'Monthly Newsletter', channel: 'email', subject: 'Your Monthly Update' },
        { id: 't2', name: 'Promo Alert', channel: 'email', subject: 'Special Offer Inside' },
        { id: 't3', name: 'SMS Activation', channel: 'sms', subject: '' },
        { id: 't4', name: 'Push Bonus', channel: 'push', subject: '' },
      ],
      history: [
        { id: 'bm1', subject: 'Summer Sale Blast', channel: 'email', segment: 'All Members', sent: 3420, opened: 1840, clicked: 312, status: 'sent', sentAt: '2026-08-07T10:15:00Z' },
        { id: 'bm2', subject: 'Rank Up Reminder', channel: 'sms', segment: 'Active Members', sent: 1100, opened: 1100, clicked: 0, status: 'sent', sentAt: '2026-08-06T14:00:00Z' },
        { id: 'bm3', subject: 'New Product Drop', channel: 'push', segment: 'Gold+ Rank', sent: 540, opened: 390, clicked: 87, status: 'sent', sentAt: '2026-08-05T09:30:00Z' },
        { id: 'bm4', subject: 'August Newsletter', channel: 'email', segment: 'All Members', sent: 0, opened: 0, clicked: 0, status: 'scheduled', sentAt: '2026-08-10T08:00:00Z' },
        { id: 'bm5', subject: 'Team Broadcast', channel: 'email', segment: 'New Members (30d)', sent: 0, opened: 0, clicked: 0, status: 'draft', sentAt: '' },
      ]
    }
  }
  return request('GET', '/v1/mlm/admin/bulk-messages')
}
export async function sendAdminBulkMessage(data) {
  if (MOCK) { await new Promise(r => setTimeout(r, 600)); return { id: 'bm_new', status: 'scheduled', ...data } }
  return request('POST', '/v1/mlm/admin/bulk-messages/send', data)
}
export async function deleteAdminBulkMessage(id) {
  if (MOCK) { await new Promise(r => setTimeout(r, 300)); return { ok: true } }
  return request('DELETE', `/v1/mlm/admin/bulk-messages/${id}`)
}

// ── Admin Network Health ──────────────────────────────────────────────────────
export async function getAdminNetworkHealth() {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 450))
    return {
      kpis: [
        { label: 'Total Members', value: 3847, delta: '+142', trend: 'up' },
        { label: 'Active (30d)', value: 2104, delta: '+38', trend: 'up' },
        { label: 'Churn Rate', value: '4.2%', delta: '-0.3%', trend: 'down' },
        { label: 'Avg Team Size', value: 7.4, delta: '+0.6', trend: 'up' },
      ],
      rankDistribution: [
        { rank: 'Starter', count: 1240, pct: 32 },
        { rank: 'Bronze', count: 980, pct: 25 },
        { rank: 'Silver', count: 720, pct: 19 },
        { rank: 'Gold', count: 510, pct: 13 },
        { rank: 'Platinum', count: 280, pct: 7 },
        { rank: 'Diamond', count: 117, pct: 4 },
      ],
      monthlyGrowth: [
        { month: 'Mar', new: 210, churned: 88 },
        { month: 'Apr', new: 198, churned: 72 },
        { month: 'May', new: 234, churned: 91 },
        { month: 'Jun', new: 188, churned: 68 },
        { month: 'Jul', new: 256, churned: 84 },
        { month: 'Aug', new: 142, churned: 31 },
      ],
      dormant: [
        { id: 'd1', name: 'Jonas Larsson', rank: 'Silver', lastActive: '2026-05-12', teamSize: 8 },
        { id: 'd2', name: 'Eva Kristiansen', rank: 'Bronze', lastActive: '2026-04-28', teamSize: 3 },
        { id: 'd3', name: 'Mikkel Andersen', rank: 'Gold', lastActive: '2026-05-01', teamSize: 14 },
        { id: 'd4', name: 'Astrid Holm', rank: 'Starter', lastActive: '2026-04-10', teamSize: 1 },
        { id: 'd5', name: 'Ragnar Bjørnstad', rank: 'Silver', lastActive: '2026-05-20', teamSize: 6 },
      ]
    }
  }
  return request('GET', '/v1/mlm/admin/network-health')
}

// ── Admin Reward Programs ─────────────────────────────────────────────────────
export async function getAdminRewardPrograms() {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 400))
    return {
      programs: [
        { id: 'rp1', name: 'Summer Bonus Blast', type: 'multiplier', multiplier: 2.0, segment: 'All Members', startDate: '2026-07-01', endDate: '2026-08-31', active: true, enrolledCount: 1842, totalAwarded: 48200 },
        { id: 'rp2', name: 'Rank Up Milestone', type: 'milestone', milestone: 'Reach Silver', reward: '€50 store credit', segment: 'Bronze Members', startDate: '2026-06-01', endDate: '2026-12-31', active: true, enrolledCount: 980, totalAwarded: 12400 },
        { id: 'rp3', name: 'Referral Booster', type: 'bonus', bonusPct: 25, segment: 'Active Members', startDate: '2026-08-01', endDate: '2026-09-30', active: true, enrolledCount: 2104, totalAwarded: 8750 },
        { id: 'rp4', name: 'Winter Loyalty Drive', type: 'multiplier', multiplier: 1.5, segment: 'Gold+ Rank', startDate: '2026-01-01', endDate: '2026-03-31', active: false, enrolledCount: 907, totalAwarded: 31600 },
      ]
    }
  }
  return request('GET', '/v1/mlm/admin/reward-programs')
}
export async function createAdminRewardProgram(data) {
  if (MOCK) { await new Promise(r => setTimeout(r, 500)); return { id: `rp_${Date.now()}`, active: true, enrolledCount: 0, totalAwarded: 0, ...data } }
  return request('POST', '/v1/mlm/admin/reward-programs', data)
}
export async function toggleAdminRewardProgram(id, active) {
  if (MOCK) { await new Promise(r => setTimeout(r, 300)); return { id, active } }
  return request('PATCH', `/v1/mlm/admin/reward-programs/${id}`, { active })
}
export async function deleteAdminRewardProgram(id) {
  if (MOCK) { await new Promise(r => setTimeout(r, 300)); return { ok: true } }
  return request('DELETE', `/v1/mlm/admin/reward-programs/${id}`)
}

// ── Admin Pending Approvals ───────────────────────────────────────────────────
export async function getAdminPendingApprovals() {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 400))
    return {
      counts: { kyc: 8, payouts: 14, marketplace: 5, appeals: 3, coOp: 2 },
      items: [
        { id: 'pa1', type: 'kyc', member: 'Ingrid Solberg', detail: 'Passport + proof of address', submittedAt: '2026-08-08T07:10:00Z', priority: 'high' },
        { id: 'pa2', type: 'payout', member: 'Lars Eriksson', detail: '€820.00 SEPA withdrawal', submittedAt: '2026-08-08T06:45:00Z', priority: 'normal' },
        { id: 'pa3', type: 'payout', member: 'Sigrid Dahl', detail: '€1,250.00 SEPA withdrawal', submittedAt: '2026-08-07T22:00:00Z', priority: 'high' },
        { id: 'pa4', type: 'marketplace', member: 'Bjørn Haugen', detail: 'Listing: NV Starter Kit (used)', submittedAt: '2026-08-08T05:20:00Z', priority: 'normal' },
        { id: 'pa5', type: 'kyc', member: 'Freya Magnusson', detail: 'National ID upload', submittedAt: '2026-08-07T18:30:00Z', priority: 'normal' },
        { id: 'pa6', type: 'appeal', member: 'Erik Thorvald', detail: 'Commission dispute #CD-2281', submittedAt: '2026-08-07T15:00:00Z', priority: 'high' },
        { id: 'pa7', type: 'co-op', member: 'Helga Nilsen', detail: 'Co-Op ad campaign: €400 request', submittedAt: '2026-08-07T10:00:00Z', priority: 'normal' },
        { id: 'pa8', type: 'marketplace', member: 'Olav Brekke', detail: 'Listing: Peptide Sample Pack', submittedAt: '2026-08-06T20:00:00Z', priority: 'normal' },
        { id: 'pa9', type: 'payout', member: 'Kristin Vik', detail: '€340.00 SEPA withdrawal', submittedAt: '2026-08-06T19:00:00Z', priority: 'normal' },
        { id: 'pa10', type: 'kyc', member: 'Ragnar Bjørnstad', detail: 'Driver licence scan', submittedAt: '2026-08-06T14:00:00Z', priority: 'normal' },
      ]
    }
  }
  return request('GET', '/v1/mlm/admin/pending-approvals')
}
export async function resolveAdminApproval(id, action, note) {
  if (MOCK) { await new Promise(r => setTimeout(r, 400)); return { id, action, note } }
  return request('POST', `/v1/mlm/admin/pending-approvals/${id}/resolve`, { action, note })
}

// ── Member My Promotions ──────────────────────────────────────────────────────
export async function getMemberPromotions() {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 400))
    return {
      materials: [
        { id: 'mp1', name: 'NV Summer Banner 1200×628', type: 'banner', format: 'PNG', product: 'Viking Peptides', size: '1200×628', language: 'EN', downloads: 84, previewUrl: '', updatedAt: '2026-08-01' },
        { id: 'mp2', name: 'NV Instagram Story', type: 'social', format: 'PNG', product: 'Nordic Vitals', size: '1080×1920', language: 'EN', downloads: 212, previewUrl: '', updatedAt: '2026-07-28' },
        { id: 'mp3', name: 'Product Flyer A4', type: 'flyer', format: 'PDF', product: 'Viking Peptides', size: 'A4', language: 'NO', downloads: 56, previewUrl: '', updatedAt: '2026-07-20' },
        { id: 'mp4', name: 'Facebook Ad 1200×630', type: 'banner', format: 'PNG', product: 'Nordic Vitals', size: '1200×630', language: 'EN', downloads: 147, previewUrl: '', updatedAt: '2026-07-15' },
        { id: 'mp5', name: 'TikTok Video Script EN', type: 'script', format: 'TXT', product: 'Viking Peptides', size: '—', language: 'EN', downloads: 38, previewUrl: '', updatedAt: '2026-07-10' },
        { id: 'mp6', name: 'Business Card Template', type: 'print', format: 'PDF', product: 'Nordic Vitals', size: '85×55mm', language: 'EN', downloads: 91, previewUrl: '', updatedAt: '2026-07-05' },
        { id: 'mp7', name: 'NV LinkedIn Banner', type: 'social', format: 'PNG', product: 'Nordic Vitals', size: '1584×396', language: 'EN', downloads: 67, previewUrl: '', updatedAt: '2026-06-30' },
        { id: 'mp8', name: 'Produktark Norsk A4', type: 'flyer', format: 'PDF', product: 'Viking Peptides', size: 'A4', language: 'NO', downloads: 29, previewUrl: '', updatedAt: '2026-06-20' },
      ]
    }
  }
  return request('GET', '/v1/mlm/member/promotions')
}

// ── Member Training Planner ───────────────────────────────────────────────────
export async function getMemberTrainingPlanner() {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 400))
    const now = new Date('2026-08-08')
    return {
      upcoming: [
        { id: 'tp1', title: 'Advanced Peptide Science', type: 'webinar', host: 'Dr. Erik Thorvald', date: '2026-08-12T18:00:00Z', duration: 60, registered: true, seats: 200, enrolled: 142 },
        { id: 'tp2', title: 'MLM Compliance Basics', type: 'video', host: 'NV Academy', date: '2026-08-14T10:00:00Z', duration: 45, registered: false, seats: null, enrolled: null },
        { id: 'tp3', title: 'Social Selling Masterclass', type: 'live', host: 'Astrid Holm', date: '2026-08-20T17:00:00Z', duration: 90, registered: false, seats: 50, enrolled: 31 },
        { id: 'tp4', title: 'Rank Qualification Strategy', type: 'webinar', host: 'NV Leadership Team', date: '2026-08-27T18:00:00Z', duration: 75, registered: true, seats: 500, enrolled: 318 },
      ],
      past: [
        { id: 'tp5', title: 'Onboarding Fast Start', type: 'video', host: 'NV Academy', date: '2026-07-28T10:00:00Z', duration: 30, completed: true, score: 92 },
        { id: 'tp6', title: 'Product Knowledge 101', type: 'video', host: 'NV Academy', date: '2026-07-22T09:00:00Z', duration: 40, completed: true, score: 88 },
        { id: 'tp7', title: 'Team Building Fundamentals', type: 'webinar', host: 'Bjørn Haugen', date: '2026-07-15T17:00:00Z', duration: 60, completed: true, score: 95 },
      ],
      streakDays: 14,
      totalHours: 12.5,
    }
  }
  return request('GET', '/v1/mlm/member/training-planner')
}
export async function registerMemberTraining(id) {
  if (MOCK) { await new Promise(r => setTimeout(r, 300)); return { id, registered: true } }
  return request('POST', `/v1/mlm/member/training-planner/${id}/register`)
}

// ── Member My Tokens ──────────────────────────────────────────────────────────
export async function getMemberTokens() {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 400))
    return {
      balance: 2840,
      pendingBalance: 120,
      lifetimeEarned: 8420,
      lifetimeRedeemed: 5580,
      transactions: [
        { id: 'tk1', type: 'earn', source: 'Commission Q3 bonus', amount: 400, date: '2026-08-08T00:00:00Z', status: 'confirmed' },
        { id: 'tk2', type: 'earn', source: 'Referral bonus — Ingrid S.', amount: 120, date: '2026-08-07T14:00:00Z', status: 'pending' },
        { id: 'tk3', type: 'redeem', source: 'Store credit redemption', amount: -500, date: '2026-08-05T10:00:00Z', status: 'confirmed' },
        { id: 'tk4', type: 'earn', source: 'Rank milestone: Gold', amount: 1000, date: '2026-07-30T00:00:00Z', status: 'confirmed' },
        { id: 'tk5', type: 'earn', source: 'Monthly activity bonus', amount: 200, date: '2026-07-01T00:00:00Z', status: 'confirmed' },
        { id: 'tk6', type: 'redeem', source: 'Training course unlock', amount: -300, date: '2026-06-20T00:00:00Z', status: 'confirmed' },
        { id: 'tk7', type: 'earn', source: 'Team volume bonus', amount: 350, date: '2026-06-01T00:00:00Z', status: 'confirmed' },
      ],
      redemptionOptions: [
        { id: 'ro1', name: 'Store Credit', rate: '100 tokens = €1', minTokens: 500, icon: '🛒' },
        { id: 'ro2', name: 'Commission Boost', rate: '500 tokens = +5% for 30d', minTokens: 500, icon: '📈' },
        { id: 'ro3', name: 'Training Unlock', rate: '300 tokens = 1 premium course', minTokens: 300, icon: '🎓' },
        { id: 'ro4', name: 'Event Ticket', rate: '1000 tokens = 1 VIP event pass', minTokens: 1000, icon: '🎟️' },
      ]
    }
  }
  return request('GET', '/v1/mlm/member/tokens')
}
export async function redeemMemberTokens(optionId, amount) {
  if (MOCK) { await new Promise(r => setTimeout(r, 500)); return { ok: true, remaining: 2840 - amount } }
  return request('POST', '/v1/mlm/member/tokens/redeem', { optionId, amount })
}

// ── Member Team Leaderboard ───────────────────────────────────────────────────
export async function getMemberTeamLeaderboard(period, metric) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 400))
    const entries = [
      { rank: 1, name: 'Astrid Holm', rankTitle: 'Diamond', volume: 48200, recruits: 12, commissions: 6840, trend: 'up', isMe: false },
      { rank: 2, name: 'Lars Eriksson', rankTitle: 'Platinum', volume: 41500, recruits: 9, commissions: 5920, trend: 'up', isMe: false },
      { rank: 3, name: 'Ingrid Solberg', rankTitle: 'Gold', volume: 34800, recruits: 7, commissions: 4970, trend: 'stable', isMe: false },
      { rank: 4, name: 'Bjørn Haugen', rankTitle: 'Gold', volume: 29100, recruits: 6, commissions: 4150, trend: 'down', isMe: false },
      { rank: 5, name: 'You', rankTitle: 'Silver', volume: 24600, recruits: 4, commissions: 3510, trend: 'up', isMe: true },
      { rank: 6, name: 'Freya Magnusson', rankTitle: 'Silver', volume: 21300, recruits: 5, commissions: 3040, trend: 'up', isMe: false },
      { rank: 7, name: 'Erik Thorvald', rankTitle: 'Silver', volume: 18900, recruits: 3, commissions: 2700, trend: 'stable', isMe: false },
      { rank: 8, name: 'Sigrid Dahl', rankTitle: 'Bronze', volume: 14200, recruits: 4, commissions: 2030, trend: 'up', isMe: false },
      { rank: 9, name: 'Olav Brekke', rankTitle: 'Bronze', volume: 11800, recruits: 2, commissions: 1680, trend: 'down', isMe: false },
      { rank: 10, name: 'Helga Nilsen', rankTitle: 'Bronze', volume: 9400, recruits: 3, commissions: 1340, trend: 'stable', isMe: false },
    ]
    return { entries, period, metric, myRank: 5, totalParticipants: 248 }
  }
  return request('GET', `/v1/mlm/member/team-leaderboard?period=${period}&metric=${metric}`)
}
