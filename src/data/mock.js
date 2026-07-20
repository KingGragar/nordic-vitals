export const USERS = [
  { email: 'member@nordic.no', password: 'demo123', role: 'member', name: 'Lars Eriksen', memberId: 'NV-10042', rank: 'Silver', pv: 320, leftGV: 1840, rightGV: 1210 },
  { email: 'admin@nordic.no',  password: 'admin123', role: 'admin',  name: 'Admin',        memberId: 'NV-00001', rank: 'Platinum', pv: 0, leftGV: 0, rightGV: 0 },
]

export const PRODUCTS = [
  { id: 1, name: 'Omega-3 Arctic Pure',      tagline: 'Cold-pressed from Arctic waters',         price: 349, memberPrice: 279, pv: 35, img: 'from-cyan-900 to-blue-900',    desc: 'Ultra-pure omega-3 sourced from wild Arctic fish. Supports heart, brain, and joint health with a natural triglyceride form for superior absorption.', ingredients: ['Fish oil concentrate', 'Vitamin E (antioxidant)', 'Lemon flavour', 'Gelatin capsule'] },
  { id: 2, name: 'Nordic Collagen Complex',  tagline: 'Hydrolysed marine collagen + Vitamin C',  price: 429, memberPrice: 339, pv: 43, img: 'from-rose-900 to-pink-900',    desc: 'Marine collagen peptides combined with Nordic cloudberry extract and Vitamin C. Promotes skin elasticity, strong joints, and healthy hair.', ingredients: ['Marine collagen hydrolysate', 'Cloudberry extract', 'Vitamin C', 'Hyaluronic acid'] },
  { id: 3, name: 'Vitamin D3 + K2',          tagline: 'Scandinavian winter formula',             price: 249, memberPrice: 199, pv: 25, img: 'from-amber-900 to-yellow-900', desc: 'High-potency D3 paired with MK-7 K2 to direct calcium to bones and away from arteries. Essential for Scandinavian winters with limited sunlight.', ingredients: ['Cholecalciferol (D3)', 'Menaquinone-7 (K2)', 'MCT oil', 'Softgel capsule'] },
  { id: 4, name: 'Arctic Shilajit',          tagline: '85+ trace minerals, purified resin',      price: 599, memberPrice: 479, pv: 60, img: 'from-stone-800 to-zinc-900',   desc: 'Authentic Himalayan shilajit resin, third-party lab tested for heavy metals and purity. Rich in fulvic acid and 85+ trace minerals for energy and vitality.', ingredients: ['Shilajit resin extract', 'Fulvic acid 60%+', 'Dibenzo-alpha-pyrones', 'No fillers'] },
  { id: 5, name: 'Nordic Greens Blend',      tagline: '22 organic greens + adaptogens',          price: 379, memberPrice: 299, pv: 38, img: 'from-green-900 to-emerald-900', desc: 'A comprehensive blend of 22 organic Nordic and Scandinavian greens, algae, and adaptogens. One scoop delivers your daily greens with prebiotic fibre.', ingredients: ['Spirulina', 'Wheatgrass', 'Chlorella', 'Ashwagandha root'] },
  { id: 6, name: 'Focus Formula',            tagline: 'Lion\'s mane + Bacopa + L-Theanine',      price: 459, memberPrice: 369, pv: 46, img: 'from-violet-900 to-purple-900', desc: "Nootropic stack combining Lion's Mane mushroom, Bacopa Monnieri, and L-Theanine for sustained mental clarity, memory support, and calm focus.", ingredients: ["Lion's Mane extract (30% polysaccharides)", 'Bacopa Monnieri extract', 'L-Theanine', 'Phosphatidylserine'] },
]

export const COMMISSIONS = [
  { id: 1, date: '2026-07-13', type: 'Pairing Bonus',       from: 'Mia Andersen',  leg: 'Weak leg',  amount: 450,  status: 'Paid' },
  { id: 2, date: '2026-07-12', type: 'Sponsor Bonus',       from: 'Erik Solberg',  leg: 'Direct',    amount: 175,  status: 'Paid' },
  { id: 3, date: '2026-07-11', type: 'Level Commission L2', from: 'Kari Holm',     leg: 'Level 2',   amount: 60,   status: 'Pending' },
  { id: 4, date: '2026-07-10', type: 'Pool Bonus',          from: '—',             leg: 'Shared',    amount: 220,  status: 'Pending' },
  { id: 5, date: '2026-07-08', type: 'Pairing Bonus',       from: 'Mia Andersen',  leg: 'Weak leg',  amount: 450,  status: 'Paid' },
  { id: 6, date: '2026-07-07', type: 'Sponsor Bonus',       from: 'Anna Lund',     leg: 'Direct',    amount: 175,  status: 'Paid' },
  { id: 7, date: '2026-07-06', type: 'Level Commission L1', from: 'Erik Solberg',  leg: 'Level 1',   amount: 90,   status: 'Paid' },
  { id: 8, date: '2026-07-05', type: 'Override Bonus',      from: 'Tor Bakke',     leg: 'Personal',  amount: 35,   status: 'Paid' },
  { id: 9, date: '2026-07-04', type: 'Pairing Bonus',       from: 'Mia Andersen',  leg: 'Weak leg',  amount: 450,  status: 'Paid' },
  { id: 10,date: '2026-07-03', type: 'Level Commission L3', from: 'Ole Hansen',    leg: 'Level 3',   amount: 28,   status: 'Paid' },
]

export const WALLET_TXS = [
  { id: 1, date: '2026-07-13', desc: 'Pairing Bonus',         credit: 450,  debit: null, balance: 1150 },
  { id: 2, date: '2026-07-12', desc: 'Sponsor Bonus',         credit: 175,  debit: null, balance: 700  },
  { id: 3, date: '2026-07-11', desc: 'Withdrawal to bank',    credit: null, debit: 500,  balance: 525  },
  { id: 4, date: '2026-07-10', desc: 'Pool Bonus',            credit: 220,  debit: null, balance: 1025 },
  { id: 5, date: '2026-07-08', desc: 'Pairing Bonus',         credit: 450,  debit: null, balance: 805  },
  { id: 6, date: '2026-07-07', desc: 'Sponsor Bonus',         credit: 175,  debit: null, balance: 355  },
  { id: 7, date: '2026-07-06', desc: 'Level Commission',      credit: 90,   debit: null, balance: 180  },
  { id: 8, date: '2026-07-01', desc: 'Withdrawal to bank',    credit: null, debit: 800,  balance: 90   },
]

export const ORDERS = [
  { id: 'NV-ORD-0891', date: '2026-07-10', items: ['Omega-3 Arctic Pure ×2', 'Nordic Greens Blend ×1'], total: 1077, status: 'Delivered' },
  { id: 'NV-ORD-0854', date: '2026-06-28', items: ['Focus Formula ×1'],                                  total: 459,  status: 'Delivered' },
  { id: 'NV-ORD-0812', date: '2026-06-15', items: ['Vitamin D3+K2 ×3', 'Nordic Collagen Complex ×1'],   total: 1176, status: 'Delivered' },
  { id: 'NV-ORD-0798', date: '2026-06-01', items: ['Arctic Shilajit ×1'],                                total: 599,  status: 'Delivered' },
  { id: 'NV-ORD-0771', date: '2026-05-20', items: ['Executive Enrollment Package'],                      total: 1499, status: 'Delivered' },
]

export const TREE_DATA = {
  name: 'Lars Eriksen',
  attributes: { id: 'NV-10042', rank: 'Silver', pv: 320, status: 'active', leg: null },
  children: [
    {
      name: 'Mia Andersen',
      attributes: { id: 'NV-10087', rank: 'Bronze', pv: 180, status: 'active', leg: 'L' },
      children: [
        {
          name: 'Kari Holm',
          attributes: { id: 'NV-10102', rank: 'Unranked', pv: 60, status: 'active', leg: 'L' },
          children: [
            { name: 'Per Nilsen',   attributes: { id: 'NV-10201', rank: 'Unranked', pv: 20, status: 'active',   leg: 'L' }, children: [] },
            { name: 'Hege Moen',    attributes: { id: 'NV-10208', rank: 'Unranked', pv: 15, status: 'inactive', leg: 'R' }, children: [] },
          ],
        },
        {
          name: '— Empty slot —',
          attributes: { id: '',        rank: 'empty',    pv: 0,  status: 'empty',    leg: 'R' },
          children: [],
        },
      ],
    },
    {
      name: 'Erik Solberg',
      attributes: { id: 'NV-10091', rank: 'Unranked', pv: 90, status: 'active', leg: 'R' },
      children: [
        {
          name: 'Tor Bakke',
          attributes: { id: 'NV-10118', rank: 'Unranked', pv: 45, status: 'inactive', leg: 'L' },
          children: [
            { name: 'Lise Dahl',    attributes: { id: 'NV-10210', rank: 'Unranked', pv: 10, status: 'inactive', leg: 'L' }, children: [] },
            { name: '— Empty slot —', attributes: { id: '', rank: 'empty', pv: 0, status: 'empty', leg: 'R' }, children: [] },
          ],
        },
        {
          name: 'Anna Lund',
          attributes: { id: 'NV-10122', rank: 'Unranked', pv: 30, status: 'active', leg: 'R', spillover: true },
          children: [
            { name: 'Bjorn Lie',    attributes: { id: 'NV-10215', rank: 'Unranked', pv: 25, status: 'active',   leg: 'L' }, children: [] },
            { name: '— Empty slot —', attributes: { id: '', rank: 'empty', pv: 0, status: 'empty', leg: 'R' }, children: [] },
          ],
        },
      ],
    },
  ],
}

export const ADMIN_MEMBERS = [
  { id: 'NV-10042', name: 'Lars Eriksen',   sponsor: 'NV-00010', rank: 'Silver',   pv: 320, gv: 3050, status: 'Active',   joined: '2025-03-12' },
  { id: 'NV-10087', name: 'Mia Andersen',   sponsor: 'NV-10042', rank: 'Bronze',   pv: 180, gv: 1240, status: 'Active',   joined: '2025-05-01' },
  { id: 'NV-10091', name: 'Erik Solberg',   sponsor: 'NV-10042', rank: 'Unranked', pv: 90,  gv: 600,  status: 'Active',   joined: '2025-06-14' },
  { id: 'NV-10102', name: 'Kari Holm',      sponsor: 'NV-10087', rank: 'Unranked', pv: 60,  gv: 60,   status: 'Active',   joined: '2025-07-22' },
  { id: 'NV-10118', name: 'Tor Bakke',      sponsor: 'NV-10091', rank: 'Unranked', pv: 45,  gv: 45,   status: 'Inactive', joined: '2025-08-03' },
  { id: 'NV-10122', name: 'Anna Lund',      sponsor: 'NV-10091', rank: 'Unranked', pv: 30,  gv: 55,   status: 'Active',   joined: '2025-09-18' },
  { id: 'NV-10201', name: 'Per Nilsen',     sponsor: 'NV-10102', rank: 'Unranked', pv: 20,  gv: 20,   status: 'Active',   joined: '2025-10-05' },
  { id: 'NV-10208', name: 'Hege Moen',      sponsor: 'NV-10102', rank: 'Unranked', pv: 15,  gv: 15,   status: 'Inactive', joined: '2025-11-12' },
  { id: 'NV-10210', name: 'Lise Dahl',      sponsor: 'NV-10118', rank: 'Unranked', pv: 10,  gv: 10,   status: 'Inactive', joined: '2025-12-01' },
  { id: 'NV-10215', name: 'Bjorn Lie',      sponsor: 'NV-10122', rank: 'Unranked', pv: 25,  gv: 25,   status: 'Active',   joined: '2026-01-08' },
  { id: 'NV-10230', name: 'Sigrid Voss',    sponsor: 'NV-10087', rank: 'Bronze',   pv: 120, gv: 340,  status: 'Active',   joined: '2026-02-14' },
  { id: 'NV-10241', name: 'Olaf Berg',      sponsor: 'NV-10042', rank: 'Unranked', pv: 50,  gv: 50,   status: 'Active',   joined: '2026-03-20' },
]

export const PAYOUT_QUEUE = [
  { id: 'W-0091', member: 'Lars Eriksen',  memberId: 'NV-10042', amount: 1150, requested: '2026-07-12', method: 'Bank Transfer', iban: '****4521' },
  { id: 'W-0090', member: 'Mia Andersen',  memberId: 'NV-10087', amount: 580,  requested: '2026-07-11', method: 'Bank Transfer', iban: '****8832' },
  { id: 'W-0089', member: 'Sigrid Voss',   memberId: 'NV-10230', amount: 240,  requested: '2026-07-11', method: 'Bank Transfer', iban: '****2201' },
  { id: 'W-0088', member: 'Bjorn Lie',     memberId: 'NV-10215', amount: 175,  requested: '2026-07-10', method: 'Bank Transfer', iban: '****7743' },
  { id: 'W-0087', member: 'Olaf Berg',     memberId: 'NV-10241', amount: 90,   requested: '2026-07-10', method: 'Bank Transfer', iban: '****3390' },
]

export const COMMISSION_RUNS = [
  { id: '#041', started_at: '2026-07-13T02:00:00Z', type: 'Scheduled', members_processed: 847, total_paid: 18400, currency: 'MLMT', status: 'Completed',
    breakdown: [
      { label: 'Pairing Bonus',    amount: 8280 },
      { label: 'Sponsor Bonus',    amount: 4600 },
      { label: 'Level Commission', amount: 3310 },
      { label: 'Pool Bonus',       amount: 2210 },
    ]
  },
  { id: '#040', started_at: '2026-07-06T02:00:00Z', type: 'Scheduled', members_processed: 844, total_paid: 17850, currency: 'MLMT', status: 'Completed', breakdown: [] },
  { id: '#039', started_at: '2026-07-04T14:12:00Z', type: 'Manual',    members_processed: 844, total_paid: 17850, currency: 'MLMT', status: 'Completed', breakdown: [] },
  { id: '#038', started_at: '2026-06-29T02:00:00Z', type: 'Scheduled', members_processed: 838, total_paid: 16990, currency: 'MLMT', status: 'Completed', breakdown: [] },
  { id: '#037', started_at: '2026-06-22T02:00:00Z', type: 'Scheduled', members_processed: 831, total_paid: 15740, currency: 'MLMT', status: 'Completed', breakdown: [] },
  { id: '#036', started_at: '2026-06-15T02:00:00Z', type: 'Scheduled', members_processed: 820, total_paid: 15210, currency: 'MLMT', status: 'Completed', breakdown: [] },
  { id: '#035', started_at: '2026-06-08T02:00:00Z', type: 'Scheduled', members_processed: 811, total_paid: 14630, currency: 'MLMT', status: 'Failed',    breakdown: [] },
  { id: '#034', started_at: '2026-06-01T02:00:00Z', type: 'Scheduled', members_processed: 799, total_paid: 13980, currency: 'MLMT', status: 'Completed', breakdown: [] },
]
