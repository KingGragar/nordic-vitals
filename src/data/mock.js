export const USERS = [
  { userId: 'efbb8d0e-b5a5-4a15-bcc6-2f07b980ca64', email: 'member@nordic.no', password: 'demo123', role: 'member', name: 'Lars Eriksen', memberId: 'NV-10042', rank: 'Silver', pv: 320, leftGV: 1840, rightGV: 1210 },
  { userId: '00000000-0000-0000-0000-000000000001', email: 'admin@nordic.no',  password: 'admin123', role: 'admin',  name: 'Admin',        memberId: 'NV-00001', rank: 'Platinum', pv: 0, leftGV: 0, rightGV: 0 },
]

export const PRODUCTS = [
  { id: 1, name: 'Omega-3 Arctic Pure',      category: 'Omega & Fish Oil', tagline: 'Cold-pressed from Arctic waters',         price: 349, memberPrice: 279, pv: 35, img: 'from-cyan-900 to-blue-900',    desc: 'Ultra-pure omega-3 sourced from wild Arctic fish. Supports heart, brain, and joint health with a natural triglyceride form for superior absorption.', ingredients: ['Fish oil concentrate', 'Vitamin E (antioxidant)', 'Lemon flavour', 'Gelatin capsule'] },
  { id: 2, name: 'Nordic Collagen Complex',  category: 'Beauty & Skin',    tagline: 'Hydrolysed marine collagen + Vitamin C',  price: 429, memberPrice: 339, pv: 43, img: 'from-rose-900 to-pink-900',    desc: 'Marine collagen peptides combined with Nordic cloudberry extract and Vitamin C. Promotes skin elasticity, strong joints, and healthy hair.', ingredients: ['Marine collagen hydrolysate', 'Cloudberry extract', 'Vitamin C', 'Hyaluronic acid'] },
  { id: 3, name: 'Vitamin D3 + K2',          category: 'Vitamins',         tagline: 'Scandinavian winter formula',             price: 249, memberPrice: 199, pv: 25, img: 'from-amber-900 to-yellow-900', desc: 'High-potency D3 paired with MK-7 K2 to direct calcium to bones and away from arteries. Essential for Scandinavian winters with limited sunlight.', ingredients: ['Cholecalciferol (D3)', 'Menaquinone-7 (K2)', 'MCT oil', 'Softgel capsule'] },
  { id: 4, name: 'Arctic Shilajit',          category: 'Energy',           tagline: '85+ trace minerals, purified resin',      price: 599, memberPrice: 479, pv: 60, img: 'from-stone-800 to-zinc-900',   desc: 'Authentic Himalayan shilajit resin, third-party lab tested for heavy metals and purity. Rich in fulvic acid and 85+ trace minerals for energy and vitality.', ingredients: ['Shilajit resin extract', 'Fulvic acid 60%+', 'Dibenzo-alpha-pyrones', 'No fillers'] },
  { id: 5, name: 'Nordic Greens Blend',      category: 'Greens',           tagline: '22 organic greens + adaptogens',          price: 379, memberPrice: 299, pv: 38, img: 'from-green-900 to-emerald-900', desc: 'A comprehensive blend of 22 organic Nordic and Scandinavian greens, algae, and adaptogens. One scoop delivers your daily greens with prebiotic fibre.', ingredients: ['Spirulina', 'Wheatgrass', 'Chlorella', 'Ashwagandha root'] },
  { id: 6, name: 'Focus Formula',            category: 'Focus',            tagline: 'Lion\'s mane + Bacopa + L-Theanine',      price: 459, memberPrice: 369, pv: 46, img: 'from-violet-900 to-purple-900', desc: "Nootropic stack combining Lion's Mane mushroom, Bacopa Monnieri, and L-Theanine for sustained mental clarity, memory support, and calm focus.", ingredients: ["Lion's Mane extract (30% polysaccharides)", 'Bacopa Monnieri extract', 'L-Theanine', 'Phosphatidylserine'] },
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

export const ADMIN_ORDERS = [
  { id: 'NV-ORD-1001', memberId: 'NV-10042', member: 'Lars Eriksen',  date: '2026-07-24', items: ['Omega-3 Arctic Pure ×2', 'Nordic Greens Blend ×1'], total: 1077, pv: 108, status: 'Delivered',  method: 'Bank Transfer', shippingCountry: 'Norway' },
  { id: 'NV-ORD-1002', memberId: 'NV-10087', member: 'Mia Andersen',  date: '2026-07-23', items: ['Nordic Collagen Complex ×2'],                          total: 858,  pv: 86,  status: 'Shipped',    method: 'Bank Transfer', shippingCountry: 'Sweden' },
  { id: 'NV-ORD-1003', memberId: 'NV-10230', member: 'Sigrid Voss',   date: '2026-07-23', items: ['Vitamin D3+K2 ×3', 'Focus Formula ×1'],                total: 1206, pv: 121, status: 'Processing', method: 'Bank Transfer', shippingCountry: 'Norway' },
  { id: 'NV-ORD-1004', memberId: 'NV-10091', member: 'Erik Solberg',  date: '2026-07-22', items: ['Arctic Shilajit ×1'],                                  total: 599,  pv: 60,  status: 'Delivered',  method: 'Bank Transfer', shippingCountry: 'Denmark' },
  { id: 'NV-ORD-1005', memberId: 'NV-10122', member: 'Anna Lund',     date: '2026-07-22', items: ['Nordic Greens Blend ×2', 'Vitamin D3+K2 ×1'],          total: 1007, pv: 101, status: 'Delivered',  method: 'Bank Transfer', shippingCountry: 'Norway' },
  { id: 'NV-ORD-1006', memberId: 'NV-10215', member: 'Bjorn Lie',     date: '2026-07-21', items: ['Focus Formula ×2'],                                    total: 918,  pv: 92,  status: 'Shipped',    method: 'Bank Transfer', shippingCountry: 'Norway' },
  { id: 'NV-ORD-1007', memberId: 'NV-10241', member: 'Olaf Berg',     date: '2026-07-21', items: ['Omega-3 Arctic Pure ×1', 'Vitamin D3+K2 ×2'],          total: 847,  pv: 85,  status: 'Processing', method: 'Bank Transfer', shippingCountry: 'Finland' },
  { id: 'NV-ORD-1008', memberId: 'NV-10042', member: 'Lars Eriksen',  date: '2026-07-20', items: ['Arctic Shilajit ×2'],                                  total: 1198, pv: 120, status: 'Delivered',  method: 'Bank Transfer', shippingCountry: 'Norway' },
  { id: 'NV-ORD-1009', memberId: 'NV-10102', member: 'Kari Holm',     date: '2026-07-19', items: ['Nordic Collagen Complex ×1'],                          total: 429,  pv: 43,  status: 'Delivered',  method: 'Bank Transfer', shippingCountry: 'Norway' },
  { id: 'NV-ORD-1010', memberId: 'NV-10087', member: 'Mia Andersen',  date: '2026-07-18', items: ['Omega-3 Arctic Pure ×3'],                              total: 1047, pv: 105, status: 'Delivered',  method: 'Bank Transfer', shippingCountry: 'Sweden' },
  { id: 'NV-ORD-1011', memberId: 'NV-10230', member: 'Sigrid Voss',   date: '2026-07-17', items: ['Executive Enrollment Package'],                        total: 1499, pv: 150, status: 'Delivered',  method: 'Bank Transfer', shippingCountry: 'Norway' },
  { id: 'NV-ORD-1012', memberId: 'NV-10201', member: 'Per Nilsen',    date: '2026-07-16', items: ['Focus Formula ×1', 'Vitamin D3+K2 ×1'],                total: 708,  pv: 71,  status: 'Delivered',  method: 'Bank Transfer', shippingCountry: 'Norway' },
  { id: 'NV-ORD-1013', memberId: 'NV-10118', member: 'Tor Bakke',     date: '2026-07-15', items: ['Nordic Greens Blend ×1'],                              total: 379,  pv: 38,  status: 'Cancelled',  method: 'Bank Transfer', shippingCountry: 'Norway' },
  { id: 'NV-ORD-1014', memberId: 'NV-10091', member: 'Erik Solberg',  date: '2026-07-14', items: ['Omega-3 Arctic Pure ×1', 'Focus Formula ×1'],          total: 808,  pv: 81,  status: 'Delivered',  method: 'Bank Transfer', shippingCountry: 'Denmark' },
  { id: 'NV-ORD-1015', memberId: 'NV-10122', member: 'Anna Lund',     date: '2026-07-13', items: ['Arctic Shilajit ×1', 'Nordic Collagen Complex ×1'],    total: 1028, pv: 103, status: 'Delivered',  method: 'Bank Transfer', shippingCountry: 'Norway' },
  { id: 'NV-ORD-1016', memberId: 'NV-10042', member: 'Lars Eriksen',  date: '2026-07-11', items: ['Vitamin D3+K2 ×4'],                                   total: 996,  pv: 100, status: 'Delivered',  method: 'Bank Transfer', shippingCountry: 'Norway' },
  { id: 'NV-ORD-1017', memberId: 'NV-10208', member: 'Hege Moen',     date: '2026-07-10', items: ['Nordic Greens Blend ×2'],                              total: 758,  pv: 76,  status: 'Cancelled',  method: 'Bank Transfer', shippingCountry: 'Norway' },
  { id: 'NV-ORD-1018', memberId: 'NV-10215', member: 'Bjorn Lie',     date: '2026-07-09', items: ['Nordic Collagen Complex ×1', 'Vitamin D3+K2 ×2'],      total: 927,  pv: 93,  status: 'Delivered',  method: 'Bank Transfer', shippingCountry: 'Norway' },
  { id: 'NV-ORD-1019', memberId: 'NV-10241', member: 'Olaf Berg',     date: '2026-07-08', items: ['Focus Formula ×1'],                                    total: 459,  pv: 46,  status: 'Delivered',  method: 'Bank Transfer', shippingCountry: 'Finland' },
  { id: 'NV-ORD-1020', memberId: 'NV-10102', member: 'Kari Holm',     date: '2026-07-07', items: ['Omega-3 Arctic Pure ×2', 'Arctic Shilajit ×1'],        total: 1297, pv: 130, status: 'Delivered',  method: 'Bank Transfer', shippingCountry: 'Norway' },
  { id: 'NV-ORD-1021', memberId: 'NV-10087', member: 'Mia Andersen',  date: '2026-07-06', items: ['Executive Enrollment Package'],                        total: 1499, pv: 150, status: 'Delivered',  method: 'Bank Transfer', shippingCountry: 'Sweden' },
  { id: 'NV-ORD-1022', memberId: 'NV-10210', member: 'Lise Dahl',     date: '2026-07-04', items: ['Vitamin D3+K2 ×1'],                                   total: 249,  pv: 25,  status: 'Delivered',  method: 'Bank Transfer', shippingCountry: 'Norway' },
  { id: 'NV-ORD-1023', memberId: 'NV-10230', member: 'Sigrid Voss',   date: '2026-07-02', items: ['Nordic Greens Blend ×1', 'Focus Formula ×1'],          total: 838,  pv: 84,  status: 'Delivered',  method: 'Bank Transfer', shippingCountry: 'Norway' },
  { id: 'NV-ORD-1024', memberId: 'NV-10042', member: 'Lars Eriksen',  date: '2026-06-30', items: ['Omega-3 Arctic Pure ×1'],                              total: 349,  pv: 35,  status: 'Delivered',  method: 'Bank Transfer', shippingCountry: 'Norway' },
  { id: 'NV-ORD-1025', memberId: 'NV-10215', member: 'Bjorn Lie',     date: '2026-06-28', items: ['Arctic Shilajit ×2', 'Nordic Collagen Complex ×1'],    total: 1627, pv: 163, status: 'Delivered',  method: 'Bank Transfer', shippingCountry: 'Norway' },
]

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

export const PRODUCT_REVIEWS = {
  1: [
    { id: 'r1-1', reviewer: 'Lars E.',   rating: 5, date: '2026-07-10', comment: 'Best omega-3 I\'ve tried. No fishy aftertaste and the capsules are easy to swallow. Noticed clearer thinking after 3 weeks.', verified: true },
    { id: 'r1-2', reviewer: 'Sigrid V.', rating: 4, date: '2026-07-01', comment: 'Great quality, noticeable difference in joint flexibility. Would give 5 stars if the price were slightly lower.', verified: true },
    { id: 'r1-3', reviewer: 'Erik S.',   rating: 5, date: '2026-06-22', comment: 'Pure product, third-party tested. Exactly what it says on the label — no fillers.', verified: false },
  ],
  2: [
    { id: 'r2-1', reviewer: 'Mia A.',    rating: 5, date: '2026-07-08', comment: 'Skin feels noticeably more hydrated after 4 weeks. Hair is stronger too. Worth every krone.', verified: true },
    { id: 'r2-2', reviewer: 'Kari H.',   rating: 4, date: '2026-06-28', comment: 'Love the cloudberry extract — a genuinely Nordic ingredient. Good taste, mixes well in water.', verified: true },
  ],
  3: [
    { id: 'r3-1', reviewer: 'Ole H.',    rating: 5, date: '2026-07-05', comment: 'Finally a D3+K2 combo with proper K2 MK-7 dosage. Made a real difference through the dark winter months.', verified: true },
    { id: 'r3-2', reviewer: 'Anna L.',   rating: 5, date: '2026-06-20', comment: 'My GP recommended D3+K2 together and this formula is exactly right. Clean, no unnecessary additives.', verified: false },
    { id: 'r3-3', reviewer: 'Tor B.',    rating: 4, date: '2026-06-10', comment: 'Softgel format is easy to take, no aftertaste. Will definitely reorder.', verified: true },
  ],
  4: [
    { id: 'r4-1', reviewer: 'Bjorn L.',  rating: 5, date: '2026-07-02', comment: 'Authentic resin, not a powder extract. Energy is steady throughout the day — no crash.', verified: true },
    { id: 'r4-2', reviewer: 'Hege M.',   rating: 4, date: '2026-06-25', comment: 'Takes a week or two to feel the difference but it\'s real. Fulvic acid content is clearly stated — great transparency.', verified: true },
  ],
  5: [
    { id: 'r5-1', reviewer: 'Per N.',    rating: 5, date: '2026-07-11', comment: '22 greens in one scoop is impressive. Mixes clean, earthy taste but not overwhelming. My morning stack is sorted.', verified: true },
    { id: 'r5-2', reviewer: 'Lise D.',   rating: 5, date: '2026-07-03', comment: 'Love the ashwagandha addition — keeps me calm and focused. Great value for a comprehensive greens blend.', verified: false },
    { id: 'r5-3', reviewer: 'Olaf B.',   rating: 4, date: '2026-06-18', comment: 'Would love a vanilla flavour option, but otherwise this is a solid daily greens powder.', verified: true },
  ],
  6: [
    { id: 'r6-1', reviewer: 'Lars E.',   rating: 5, date: '2026-07-09', comment: 'Stack of Lion\'s Mane + Bacopa + L-Theanine is exactly right. No jitters, just clean sustained focus. Highly recommend.', verified: true },
    { id: 'r6-2', reviewer: 'Sigrid V.', rating: 5, date: '2026-06-30', comment: 'Noticed improved recall and calmer thinking within two weeks. The PS (phosphatidylserine) is a nice addition that most competitors skip.', verified: true },
  ],
}

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

export const ANNOUNCEMENTS = [
  {
    id: 'ann-001',
    title: 'Welcome to Nordic Vitals!',
    body: 'We are thrilled to have you join the Nordic Vitals family. Explore your dashboard, check out the shop, and start growing your network. If you have any questions, visit the FAQ or contact us.',
    audience: 'all',
    created_at: '2026-07-13T09:00:00Z',
    sent_by: 'Admin',
    recipient_count: 847,
    type: 'info',
  },
  {
    id: 'ann-002',
    title: 'New Product Launch: Focus Formula',
    body: 'Our latest nootropic stack is now available in the shop. Focus Formula combines Lion\'s Mane, Bacopa, and L-Theanine for sustained mental clarity. Members enjoy 20% off the retail price. Get yours today!',
    audience: 'all',
    created_at: '2026-07-15T10:30:00Z',
    sent_by: 'Admin',
    recipient_count: 912,
    type: 'product',
  },
  {
    id: 'ann-003',
    title: 'Rank Promotion Bonus — July Sprint',
    body: 'Achieve Silver rank or above by July 31st and earn a 500 MLMT rank-up bonus automatically credited to your wallet. Keep building your team and hitting those PV targets!',
    audience: 'all',
    created_at: '2026-07-18T08:00:00Z',
    sent_by: 'Admin',
    recipient_count: 1045,
    type: 'promotion',
  },
  {
    id: 'ann-004',
    title: 'Commission Run Scheduled — 20 July',
    body: 'The next commission run is scheduled for Monday 20 July at 02:00 UTC. All pending commissions will be processed and credited to member wallets within 24 hours of the run.',
    audience: 'all',
    created_at: '2026-07-19T16:00:00Z',
    sent_by: 'Admin',
    recipient_count: 1058,
    type: 'system',
  },
  {
    id: 'ann-005',
    title: 'Platform Maintenance — 25 July 01:00–03:00 UTC',
    body: 'We will be performing scheduled maintenance on Saturday 25 July between 01:00 and 03:00 UTC. The platform will be in read-only mode during this window. All transactions will resume automatically after maintenance.',
    audience: 'all',
    created_at: '2026-07-24T12:00:00Z',
    sent_by: 'Admin',
    recipient_count: 1103,
    type: 'maintenance',
  },
]

export const AUDIT_LOG = [
  { id: 'aud-001', ts: '2026-07-13T09:05:00Z', actor: 'admin@nordic.no', category: 'member',       action: 'MEMBER_DEACTIVATE',    detail: 'Deactivated member account',               target: 'MBR-008', result: 'success' },
  { id: 'aud-002', ts: '2026-07-13T09:20:00Z', actor: 'admin@nordic.no', category: 'product',      action: 'PRODUCT_CREATE',       detail: 'Created product "Focus Formula"',           target: 'PRD-006', result: 'success' },
  { id: 'aud-003', ts: '2026-07-15T10:35:00Z', actor: 'admin@nordic.no', category: 'announcement', action: 'ANNOUNCEMENT_CREATE',  detail: 'Sent "New Product Launch: Focus Formula"',  target: 'ann-002', result: 'success' },
  { id: 'aud-004', ts: '2026-07-18T07:58:00Z', actor: 'admin@nordic.no', category: 'announcement', action: 'ANNOUNCEMENT_CREATE',  detail: 'Sent "Rank Promotion Bonus — July Sprint"', target: 'ann-003', result: 'success' },
  { id: 'aud-005', ts: '2026-07-19T02:01:00Z', actor: 'system',          category: 'commission',   action: 'COMMISSION_RUN',       detail: 'Scheduled commission run executed',         target: 'run-001', result: 'success' },
  { id: 'aud-006', ts: '2026-07-19T02:14:00Z', actor: 'system',          category: 'payout',       action: 'PAYOUT_BATCH_ISSUE',   detail: 'Auto-issued 12 payouts post-run',           target: 'run-001', result: 'success' },
  { id: 'aud-007', ts: '2026-07-19T16:02:00Z', actor: 'admin@nordic.no', category: 'announcement', action: 'ANNOUNCEMENT_CREATE',  detail: 'Sent "Commission Run Scheduled — 20 July"', target: 'ann-004', result: 'success' },
  { id: 'aud-008', ts: '2026-07-20T02:00:00Z', actor: 'system',          category: 'commission',   action: 'COMMISSION_RUN',       detail: 'Scheduled commission run executed',         target: 'run-002', result: 'success' },
  { id: 'aud-009', ts: '2026-07-20T02:17:00Z', actor: 'system',          category: 'payout',       action: 'PAYOUT_BATCH_ISSUE',   detail: 'Auto-issued 14 payouts post-run',           target: 'run-002', result: 'success' },
  { id: 'aud-010', ts: '2026-07-20T09:12:00Z', actor: 'admin@nordic.no', category: 'payout',       action: 'PAYOUT_APPROVE',       detail: 'Approved withdrawal request 500 MLMT',      target: 'PAY-004', result: 'success' },
  { id: 'aud-011', ts: '2026-07-20T09:15:00Z', actor: 'admin@nordic.no', category: 'payout',       action: 'PAYOUT_REJECT',        detail: 'Rejected withdrawal — invalid bank details', target: 'PAY-007', result: 'success' },
  { id: 'aud-012', ts: '2026-07-21T11:00:00Z', actor: 'admin@nordic.no', category: 'config',       action: 'PLAN_CONFIG_UPDATE',   detail: 'Updated binary pairing cap to 5000 MLMT',  target: 'plan',    result: 'success' },
  { id: 'aud-013', ts: '2026-07-21T11:45:00Z', actor: 'admin@nordic.no', category: 'product',      action: 'PRODUCT_UPDATE',       detail: 'Updated price for "Nordic Omega-3 Pro"',    target: 'PRD-001', result: 'success' },
  { id: 'aud-014', ts: '2026-07-22T02:00:00Z', actor: 'system',          category: 'commission',   action: 'COMMISSION_RUN',       detail: 'Scheduled commission run executed',         target: 'run-003', result: 'success' },
  { id: 'aud-015', ts: '2026-07-22T08:33:00Z', actor: 'admin@nordic.no', category: 'member',       action: 'MEMBER_RANK_OVERRIDE', detail: 'Manual rank upgrade to Gold',               target: 'MBR-003', result: 'success' },
  { id: 'aud-016', ts: '2026-07-23T02:00:00Z', actor: 'system',          category: 'commission',   action: 'COMMISSION_RUN',       detail: 'Scheduled commission run executed',         target: 'run-004', result: 'success' },
  { id: 'aud-017', ts: '2026-07-23T02:03:00Z', actor: 'system',          category: 'commission',   action: 'COMMISSION_RUN',       detail: 'Retry after partial failure',               target: 'run-004', result: 'failure' },
  { id: 'aud-018', ts: '2026-07-24T02:00:00Z', actor: 'system',          category: 'commission',   action: 'COMMISSION_RUN',       detail: 'Scheduled commission run executed',         target: 'run-005', result: 'success' },
  { id: 'aud-019', ts: '2026-07-24T12:02:00Z', actor: 'admin@nordic.no', category: 'announcement', action: 'ANNOUNCEMENT_CREATE',  detail: 'Sent "Platform Maintenance — 25 July"',     target: 'ann-005', result: 'success' },
  { id: 'aud-020', ts: '2026-07-24T14:08:00Z', actor: 'admin@nordic.no', category: 'product',      action: 'PRODUCT_DEACTIVATE',   detail: 'Deactivated product "Arctic Greens Blend"', target: 'PRD-005', result: 'success' },
  { id: 'aud-021', ts: '2026-07-25T01:00:00Z', actor: 'system',          category: 'config',       action: 'MAINTENANCE_START',    detail: 'Platform set to read-only for maintenance', target: 'system',  result: 'success' },
  { id: 'aud-022', ts: '2026-07-25T03:01:00Z', actor: 'system',          category: 'config',       action: 'MAINTENANCE_END',      detail: 'Maintenance window closed, writes restored', target: 'system',  result: 'success' },
  { id: 'aud-023', ts: '2026-07-25T09:40:00Z', actor: 'admin@nordic.no', category: 'payout',       action: 'PAYOUT_APPROVE',       detail: 'Approved withdrawal request 1200 MLMT',     target: 'PAY-011', result: 'success' },
  { id: 'aud-024', ts: '2026-07-25T09:45:00Z', actor: 'admin@nordic.no', category: 'payout',       action: 'PAYOUT_APPROVE',       detail: 'Approved withdrawal request 350 MLMT',      target: 'PAY-012', result: 'success' },
  { id: 'aud-025', ts: '2026-07-26T02:00:00Z', actor: 'system',          category: 'commission',   action: 'COMMISSION_RUN',       detail: 'Scheduled commission run executed',         target: 'run-006', result: 'success' },
  { id: 'aud-026', ts: '2026-07-26T02:19:00Z', actor: 'system',          category: 'payout',       action: 'PAYOUT_BATCH_ISSUE',   detail: 'Auto-issued 11 payouts post-run',           target: 'run-006', result: 'success' },
  { id: 'aud-027', ts: '2026-07-26T08:14:00Z', actor: 'admin@nordic.no', category: 'config',       action: 'SETTINGS_UPDATE',      detail: 'Updated commission notification email',     target: 'settings', result: 'success' },
  { id: 'aud-028', ts: '2026-07-26T08:55:00Z', actor: 'admin@nordic.no', category: 'announcement', action: 'ANNOUNCEMENT_DELETE',  detail: 'Deleted announcement "Welcome to NV!"',     target: 'ann-001', result: 'success' },
]
