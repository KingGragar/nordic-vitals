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
  { id: 'NV-10042', name: 'Lars Eriksen',   email: 'lars.eriksen@example.no',   phone: '+47 901 23 456', country: 'Norway',  sponsor: 'NV-00010', rank: 'Silver',   pv: 320, gv: 3050, status: 'Active',   joined: '2025-03-12', notes: '' },
  { id: 'NV-10087', name: 'Mia Andersen',   email: 'mia.andersen@example.no',   phone: '+47 912 34 567', country: 'Norway',  sponsor: 'NV-10042', rank: 'Bronze',   pv: 180, gv: 1240, status: 'Active',   joined: '2025-05-01', notes: '' },
  { id: 'NV-10091', name: 'Erik Solberg',   email: 'erik.solberg@example.no',   phone: '+47 923 45 678', country: 'Norway',  sponsor: 'NV-10042', rank: 'Unranked', pv: 90,  gv: 600,  status: 'Active',   joined: '2025-06-14', notes: '' },
  { id: 'NV-10102', name: 'Kari Holm',      email: 'kari.holm@example.no',      phone: '+47 934 56 789', country: 'Norway',  sponsor: 'NV-10087', rank: 'Unranked', pv: 60,  gv: 60,   status: 'Active',   joined: '2025-07-22', notes: '' },
  { id: 'NV-10118', name: 'Tor Bakke',      email: 'tor.bakke@example.no',      phone: '+47 945 67 890', country: 'Norway',  sponsor: 'NV-10091', rank: 'Unranked', pv: 45,  gv: 45,   status: 'Inactive', joined: '2025-08-03', notes: 'Inactive since Oct 2025' },
  { id: 'NV-10122', name: 'Anna Lund',      email: 'anna.lund@example.se',      phone: '+46 701 23 456', country: 'Sweden',  sponsor: 'NV-10091', rank: 'Unranked', pv: 30,  gv: 55,   status: 'Active',   joined: '2025-09-18', notes: '' },
  { id: 'NV-10201', name: 'Per Nilsen',     email: 'per.nilsen@example.no',     phone: '+47 956 78 901', country: 'Norway',  sponsor: 'NV-10102', rank: 'Unranked', pv: 20,  gv: 20,   status: 'Active',   joined: '2025-10-05', notes: '' },
  { id: 'NV-10208', name: 'Hege Moen',      email: 'hege.moen@example.no',      phone: '+47 967 89 012', country: 'Norway',  sponsor: 'NV-10102', rank: 'Unranked', pv: 15,  gv: 15,   status: 'Inactive', joined: '2025-11-12', notes: '' },
  { id: 'NV-10210', name: 'Lise Dahl',      email: 'lise.dahl@example.dk',      phone: '+45 701 23 456', country: 'Denmark', sponsor: 'NV-10118', rank: 'Unranked', pv: 10,  gv: 10,   status: 'Inactive', joined: '2025-12-01', notes: '' },
  { id: 'NV-10215', name: 'Bjorn Lie',      email: 'bjorn.lie@example.no',      phone: '+47 978 90 123', country: 'Norway',  sponsor: 'NV-10122', rank: 'Unranked', pv: 25,  gv: 25,   status: 'Active',   joined: '2026-01-08', notes: '' },
  { id: 'NV-10230', name: 'Sigrid Voss',    email: 'sigrid.voss@example.no',    phone: '+47 989 01 234', country: 'Norway',  sponsor: 'NV-10087', rank: 'Bronze',   pv: 120, gv: 340,  status: 'Active',   joined: '2026-02-14', notes: '' },
  { id: 'NV-10241', name: 'Olaf Berg',      email: 'olaf.berg@example.no',      phone: '+47 990 12 345', country: 'Norway',  sponsor: 'NV-10042', rank: 'Unranked', pv: 50,  gv: 50,   status: 'Active',   joined: '2026-03-20', notes: '' },
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

export const SUPPORT_TICKETS = [
  {
    id: 'tkt-001', memberId: 'MBR-001', memberName: 'Ingrid Larsen', memberEmail: 'ingrid@example.com',
    category: 'commission', subject: 'Missing commission from July run', status: 'open',
    priority: 'high', createdAt: '2026-07-20T08:15:00Z', updatedAt: '2026-07-20T08:15:00Z',
    messages: [
      { id: 'm1', from: 'member', text: 'I noticed my binary commission from the July 20 run is not showing up. My left leg PV was 3200 and right leg was 2800, but I received 0 MLMT. Please investigate.', ts: '2026-07-20T08:15:00Z' },
    ],
  },
  {
    id: 'tkt-002', memberId: 'MBR-003', memberName: 'Erik Halvorsen', memberEmail: 'erik@example.com',
    category: 'account', subject: 'Cannot update bank details', status: 'in_progress',
    priority: 'medium', createdAt: '2026-07-21T14:02:00Z', updatedAt: '2026-07-22T09:30:00Z',
    messages: [
      { id: 'm1', from: 'member', text: 'When I try to update my bank details in the Wallet section I get an error "Invalid IBAN format". My IBAN is valid — I double-checked with my bank.', ts: '2026-07-21T14:02:00Z' },
      { id: 'm2', from: 'admin', text: 'Hi Erik, thank you for reporting this. We are investigating the IBAN validation issue. Could you share which country your IBAN is from?', ts: '2026-07-22T09:30:00Z' },
    ],
  },
  {
    id: 'tkt-003', memberId: 'MBR-005', memberName: 'Astrid Moe', memberEmail: 'astrid@example.com',
    category: 'product', subject: 'Order ORD-019 not delivered', status: 'open',
    priority: 'high', createdAt: '2026-07-22T11:45:00Z', updatedAt: '2026-07-22T11:45:00Z',
    messages: [
      { id: 'm1', from: 'member', text: 'Order ORD-019 (Nordic Omega-3 Pro x2) was placed on July 10th and the status changed to "Shipped" on July 12th but I have not received it. The tracking number provided does not work.', ts: '2026-07-22T11:45:00Z' },
    ],
  },
  {
    id: 'tkt-004', memberId: 'MBR-007', memberName: 'Lars Nygaard', memberEmail: 'lars@example.com',
    category: 'referral', subject: 'New member not appearing in my downline', status: 'resolved',
    priority: 'low', createdAt: '2026-07-18T16:30:00Z', updatedAt: '2026-07-19T10:15:00Z',
    messages: [
      { id: 'm1', from: 'member', text: 'I referred Hilde Bakken using my referral link but she does not appear in my downline tree. She says she clicked my link and joined.', ts: '2026-07-18T16:30:00Z' },
      { id: 'm2', from: 'admin', text: 'Hi Lars, we have investigated and found a session cookie issue caused her enrolment to not capture the sponsor ID correctly. We have manually linked Hilde to your left leg. She should appear in your tree now.', ts: '2026-07-19T10:15:00Z' },
      { id: 'm3', from: 'member', text: 'Yes, I can see her now! Thank you for the quick resolution.', ts: '2026-07-19T11:00:00Z' },
    ],
  },
  {
    id: 'tkt-005', memberId: 'MBR-002', memberName: 'Bjarne Dahl', memberEmail: 'bjarne@example.com',
    category: 'payout', subject: 'Withdrawal pending for 8 days', status: 'in_progress',
    priority: 'high', createdAt: '2026-07-18T09:00:00Z', updatedAt: '2026-07-24T12:00:00Z',
    messages: [
      { id: 'm1', from: 'member', text: 'I submitted a withdrawal request of 1500 MLMT on July 18 and it is still showing as Pending. When will it be processed?', ts: '2026-07-18T09:00:00Z' },
      { id: 'm2', from: 'admin', text: 'Hi Bjarne, we apologise for the delay. Your request is in the current batch being processed. Expected completion is July 26.', ts: '2026-07-24T12:00:00Z' },
    ],
  },
  {
    id: 'tkt-006', memberId: 'MBR-004', memberName: 'Silje Berg', memberEmail: 'silje@example.com',
    category: 'technical', subject: 'Dashboard shows wrong rank', status: 'resolved',
    priority: 'medium', createdAt: '2026-07-23T07:20:00Z', updatedAt: '2026-07-23T15:45:00Z',
    messages: [
      { id: 'm1', from: 'member', text: 'My dashboard shows my rank as Silver but I should have qualified for Gold last month. My GV is over 15000.', ts: '2026-07-23T07:20:00Z' },
      { id: 'm2', from: 'admin', text: 'Hello Silje, we have reviewed your account and confirmed you have met the Gold rank requirements. We have applied a manual rank override. Your dashboard should now show Gold.', ts: '2026-07-23T15:45:00Z' },
    ],
  },
  {
    id: 'tkt-007', memberId: 'MBR-006', memberName: 'Morten Vik', memberEmail: 'morten@example.com',
    category: 'account', subject: 'Two-factor authentication not working', status: 'open',
    priority: 'medium', createdAt: '2026-07-25T10:10:00Z', updatedAt: '2026-07-25T10:10:00Z',
    messages: [
      { id: 'm1', from: 'member', text: 'After enabling 2FA I can no longer log in. The OTP codes from my authenticator app are all rejected. I need help regaining access.', ts: '2026-07-25T10:10:00Z' },
    ],
  },
  {
    id: 'tkt-008', memberId: 'MBR-009', memberName: 'Kari Solberg', memberEmail: 'kari@example.com',
    category: 'product', subject: 'Wrong item shipped in order ORD-022', status: 'open',
    priority: 'high', createdAt: '2026-07-25T14:55:00Z', updatedAt: '2026-07-25T14:55:00Z',
    messages: [
      { id: 'm1', from: 'member', text: 'I ordered Arctic Greens Blend (x1) but received Nordic Collagen Boost instead. Please arrange a correct replacement and return label.', ts: '2026-07-25T14:55:00Z' },
    ],
  },
  {
    id: 'tkt-009', memberId: 'MBR-010', memberName: 'Olav Strand', memberEmail: 'olav@example.com',
    category: 'commission', subject: 'Rank bonus not included in July 22 run', status: 'resolved',
    priority: 'medium', createdAt: '2026-07-22T18:00:00Z', updatedAt: '2026-07-23T11:00:00Z',
    messages: [
      { id: 'm1', from: 'member', text: 'I promoted to Silver on July 15 but the rank advancement bonus was not in the July 22 run payout.', ts: '2026-07-22T18:00:00Z' },
      { id: 'm2', from: 'admin', text: 'Hi Olav, we have confirmed the rank advancement bonus was omitted due to a timing cutoff issue. We have added 200 MLMT as a manual adjustment to your account.', ts: '2026-07-23T11:00:00Z' },
    ],
  },
  {
    id: 'tkt-010', memberId: 'MBR-001', memberName: 'Ingrid Larsen', memberEmail: 'ingrid@example.com',
    category: 'technical', subject: 'PDF download for commission statement fails', status: 'open',
    priority: 'low', createdAt: '2026-07-26T06:30:00Z', updatedAt: '2026-07-26T06:30:00Z',
    messages: [
      { id: 'm1', from: 'member', text: 'When I click "Download Statement" on the Commissions page nothing happens. I am using Chrome on Windows 11.', ts: '2026-07-26T06:30:00Z' },
    ],
  },
]

export const AUTOSHIPS = [
  {
    id: 'as-001', memberId: 'usr-001', memberName: 'Ingrid Larsen', memberEmail: 'ingrid@example.com',
    productId: 1, productName: 'Omega-3 Arctic Pure', qty: 2, frequency: 'monthly',
    memberPrice: 279, pv: 35, totalPv: 70,
    status: 'active', nextShipDate: '2026-08-01', lastShipDate: '2026-07-01',
    shippingAddress: 'Storgata 14, 0182 Oslo, Norway', createdAt: '2026-03-01T10:00:00Z',
  },
  {
    id: 'as-002', memberId: 'usr-001', memberName: 'Ingrid Larsen', memberEmail: 'ingrid@example.com',
    productId: 3, productName: 'Vitamin D3 + K2', qty: 1, frequency: 'monthly',
    memberPrice: 199, pv: 25, totalPv: 25,
    status: 'active', nextShipDate: '2026-08-01', lastShipDate: '2026-07-01',
    shippingAddress: 'Storgata 14, 0182 Oslo, Norway', createdAt: '2026-04-15T08:30:00Z',
  },
  {
    id: 'as-003', memberId: 'MBR-002', memberName: 'Bjarne Dahl', memberEmail: 'bjarne@example.com',
    productId: 1, productName: 'Omega-3 Arctic Pure', qty: 1, frequency: 'monthly',
    memberPrice: 279, pv: 35, totalPv: 35,
    status: 'paused', nextShipDate: null, lastShipDate: '2026-06-01',
    shippingAddress: 'Torvet 3, 7013 Trondheim, Norway', createdAt: '2026-02-10T14:00:00Z',
  },
  {
    id: 'as-004', memberId: 'MBR-003', memberName: 'Erik Halvorsen', memberEmail: 'erik@example.com',
    productId: 5, productName: 'Nordic Greens Blend', qty: 2, frequency: 'monthly',
    memberPrice: 299, pv: 38, totalPv: 76,
    status: 'active', nextShipDate: '2026-08-05', lastShipDate: '2026-07-05',
    shippingAddress: 'Bryggen 8, 5003 Bergen, Norway', createdAt: '2026-05-20T11:00:00Z',
  },
  {
    id: 'as-005', memberId: 'MBR-003', memberName: 'Erik Halvorsen', memberEmail: 'erik@example.com',
    productId: 6, productName: 'Focus Formula', qty: 1, frequency: 'monthly',
    memberPrice: 369, pv: 46, totalPv: 46,
    status: 'active', nextShipDate: '2026-08-05', lastShipDate: '2026-07-05',
    shippingAddress: 'Bryggen 8, 5003 Bergen, Norway', createdAt: '2026-06-01T09:00:00Z',
  },
  {
    id: 'as-006', memberId: 'MBR-004', memberName: 'Silje Berg', memberEmail: 'silje@example.com',
    productId: 2, productName: 'Nordic Collagen Complex', qty: 1, frequency: 'monthly',
    memberPrice: 339, pv: 43, totalPv: 43,
    status: 'active', nextShipDate: '2026-08-10', lastShipDate: '2026-07-10',
    shippingAddress: 'Kongens gate 5, 4610 Kristiansand, Norway', createdAt: '2026-04-01T16:00:00Z',
  },
  {
    id: 'as-007', memberId: 'MBR-005', memberName: 'Astrid Moe', memberEmail: 'astrid@example.com',
    productId: 4, productName: 'Arctic Shilajit', qty: 1, frequency: 'monthly',
    memberPrice: 479, pv: 60, totalPv: 60,
    status: 'cancelled', nextShipDate: null, lastShipDate: '2026-05-15',
    shippingAddress: 'Munkegata 2, 7011 Trondheim, Norway', createdAt: '2026-01-15T12:00:00Z',
  },
  {
    id: 'as-008', memberId: 'MBR-006', memberName: 'Morten Vik', memberEmail: 'morten@example.com',
    productId: 1, productName: 'Omega-3 Arctic Pure', qty: 3, frequency: 'monthly',
    memberPrice: 279, pv: 35, totalPv: 105,
    status: 'active', nextShipDate: '2026-08-03', lastShipDate: '2026-07-03',
    shippingAddress: 'Kirkegata 7, 6413 Molde, Norway', createdAt: '2026-03-20T10:30:00Z',
  },
]

export const RESOURCES = [
  // Marketing Materials
  { id: 'res-001', category: 'Marketing', icon: '🖼️', title: 'Nordic Vitals Brand Kit', desc: 'Official logos, color palette, fonts, and brand usage guidelines.', fileType: 'ZIP', fileSize: '12.4 MB', updatedAt: '2026-07-01', downloads: 842, tags: ['brand', 'logo', 'design'] },
  { id: 'res-002', category: 'Marketing', icon: '📸', title: 'Product Photography Pack', desc: 'High-resolution product images for social media, website, and print use.', fileType: 'ZIP', fileSize: '87.2 MB', updatedAt: '2026-07-10', downloads: 1204, tags: ['photos', 'images', 'social'] },
  { id: 'res-003', category: 'Marketing', icon: '📱', title: 'Social Media Templates', desc: 'Canva-ready Instagram, Facebook, and story templates for all 6 products.', fileType: 'ZIP', fileSize: '5.8 MB', updatedAt: '2026-07-15', downloads: 2341, tags: ['social', 'instagram', 'canva'] },
  { id: 'res-004', category: 'Marketing', icon: '📧', title: 'Email Prospecting Scripts', desc: 'Proven email templates for warm and cold outreach to potential customers.', fileType: 'PDF', fileSize: '1.2 MB', updatedAt: '2026-06-20', downloads: 1876, tags: ['email', 'scripts', 'outreach'] },
  { id: 'res-005', category: 'Marketing', icon: '🎬', title: 'Product Video Assets', desc: 'MP4 product highlight videos suitable for sharing on social platforms.', fileType: 'ZIP', fileSize: '234 MB', updatedAt: '2026-07-05', downloads: 567, tags: ['video', 'social', 'product'] },
  // Product Information
  { id: 'res-006', category: 'Products', icon: '🐟', title: 'Omega-3 Arctic Pure — Product Sheet', desc: 'Full ingredient breakdown, dosage, research references, and FAQs.', fileType: 'PDF', fileSize: '0.8 MB', updatedAt: '2026-06-15', downloads: 3102, tags: ['omega-3', 'product', 'ingredients'] },
  { id: 'res-007', category: 'Products', icon: '✨', title: 'Nordic Collagen Complex — Product Sheet', desc: 'Marine collagen benefits, clinical study summaries, and usage guide.', fileType: 'PDF', fileSize: '1.1 MB', updatedAt: '2026-06-15', downloads: 2897, tags: ['collagen', 'product', 'ingredients'] },
  { id: 'res-008', category: 'Products', icon: '☀️', title: 'Vitamin D3+K2 — Product Sheet', desc: 'Mechanisms of action, Nordic sunlight context, and supplementation guide.', fileType: 'PDF', fileSize: '0.9 MB', updatedAt: '2026-06-15', downloads: 2654, tags: ['vitamin d', 'product', 'health'] },
  { id: 'res-009', category: 'Products', icon: '⚡', title: 'Arctic Shilajit — Product Sheet', desc: 'Third-party lab certificates, mineral profile, and traditional use overview.', fileType: 'PDF', fileSize: '2.1 MB', updatedAt: '2026-07-02', downloads: 1432, tags: ['shilajit', 'minerals', 'lab results'] },
  { id: 'res-010', category: 'Products', icon: '🌿', title: 'Nordic Greens Blend — Product Sheet', desc: 'Full ingredient matrix, ORAC values, and suggested use protocols.', fileType: 'PDF', fileSize: '1.4 MB', updatedAt: '2026-06-15', downloads: 1988, tags: ['greens', 'superfood', 'product'] },
  { id: 'res-011', category: 'Products', icon: '🧠', title: 'Focus Formula — Product Sheet', desc: "Lion's Mane research digest, Bacopa study highlights, and nootropic guide.", fileType: 'PDF', fileSize: '1.6 MB', updatedAt: '2026-06-15', downloads: 2341, tags: ['focus', 'nootropic', 'brain'] },
  { id: 'res-012', category: 'Products', icon: '📊', title: 'Full Product Catalog 2026', desc: 'Complete 2026 product catalog with pricing, PV table, and product comparisons.', fileType: 'PDF', fileSize: '4.3 MB', updatedAt: '2026-07-10', downloads: 4521, tags: ['catalog', 'pricing', 'pv'] },
  // Training & Education
  { id: 'res-013', category: 'Training', icon: '📚', title: 'New Member Starter Guide', desc: 'Step-by-step guide for your first 30 days — setting up, first sales, first recruit.', fileType: 'PDF', fileSize: '3.2 MB', updatedAt: '2026-07-01', downloads: 5234, tags: ['training', 'onboarding', 'starter'] },
  { id: 'res-014', category: 'Training', icon: '🌲', title: 'Building Your Binary Tree', desc: 'Illustrated guide to binary tree placement, leg balancing, and volume strategy.', fileType: 'PDF', fileSize: '2.8 MB', updatedAt: '2026-06-25', downloads: 2109, tags: ['binary', 'tree', 'strategy'] },
  { id: 'res-015', category: 'Training', icon: '💬', title: 'Social Selling Masterclass', desc: 'Facebook group strategy, DM scripts, story selling — the full Nordic method.', fileType: 'PDF', fileSize: '5.1 MB', updatedAt: '2026-07-15', downloads: 3876, tags: ['social selling', 'facebook', 'dm'] },
  { id: 'res-016', category: 'Training', icon: '🎯', title: 'Rank Advancement Roadmap', desc: 'Clear path from Distributor to Platinum — requirements, timelines, and tips.', fileType: 'PDF', fileSize: '1.9 MB', updatedAt: '2026-07-05', downloads: 4102, tags: ['rank', 'advancement', 'platinum'] },
  { id: 'res-017', category: 'Training', icon: '🗣️', title: 'Presentation Scripts', desc: 'Script templates for one-on-ones, group presentations, and product demos.', fileType: 'PDF', fileSize: '2.4 MB', updatedAt: '2026-06-30', downloads: 1765, tags: ['presentation', 'scripts', 'pitch'] },
  // Compliance
  { id: 'res-018', category: 'Compliance', icon: '📋', title: 'Member Policies & Procedures', desc: 'Official rules for advertising, income claims, and member conduct.', fileType: 'PDF', fileSize: '0.7 MB', updatedAt: '2026-07-01', downloads: 987, tags: ['policy', 'rules', 'compliance'] },
  { id: 'res-019', category: 'Compliance', icon: '⚖️', title: 'Income Disclosure Statement 2025', desc: 'Official average earnings disclosure — required viewing before making income claims.', fileType: 'PDF', fileSize: '0.4 MB', updatedAt: '2026-01-10', downloads: 2341, tags: ['income', 'disclosure', 'legal'] },
  { id: 'res-020', category: 'Compliance', icon: '🏷️', title: 'Approved Claim Language Guide', desc: 'What you may and may not say about products and income — with examples.', fileType: 'PDF', fileSize: '0.6 MB', updatedAt: '2026-05-15', downloads: 1532, tags: ['claims', 'language', 'compliance'] },
  { id: 'res-021', category: 'Compliance', icon: '🌐', title: 'GDPR & Data Privacy Guide', desc: 'How to handle prospect data legally as a Nordic Vitals member in Europe.', fileType: 'PDF', fileSize: '0.5 MB', updatedAt: '2026-03-20', downloads: 678, tags: ['gdpr', 'data', 'privacy', 'europe'] },
]

export const PROMO_CODES = [
  {
    id: 'promo-001', code: 'NORDIC10', description: 'Welcome — 10% off everything',
    type: 'percent', value: 10, minOrder: 0, maxUses: null, usedCount: 248,
    active: true, expiresAt: null, createdAt: '2026-01-01T00:00:00Z', totalSaved: 34920,
  },
  {
    id: 'promo-002', code: 'WELCOME25', description: '25% off first order over NOK 400',
    type: 'percent', value: 25, minOrder: 400, maxUses: 500, usedCount: 312,
    active: true, expiresAt: '2026-12-31T23:59:59Z', createdAt: '2026-01-01T00:00:00Z', totalSaved: 78400,
  },
  {
    id: 'promo-003', code: 'SUMMER100', description: 'NOK 100 off orders over NOK 500',
    type: 'fixed', value: 100, minOrder: 500, maxUses: 200, usedCount: 143,
    active: true, expiresAt: '2026-08-31T23:59:59Z', createdAt: '2026-06-01T00:00:00Z', totalSaved: 14300,
  },
  {
    id: 'promo-004', code: 'VIP20', description: '20% off for VIP members',
    type: 'percent', value: 20, minOrder: 0, maxUses: 100, usedCount: 67,
    active: true, expiresAt: '2026-09-30T23:59:59Z', createdAt: '2026-05-01T00:00:00Z', totalSaved: 28640,
  },
  {
    id: 'promo-005', code: 'OMEGA15', description: '15% off on all Omega products',
    type: 'percent', value: 15, minOrder: 0, maxUses: 300, usedCount: 89,
    active: true, expiresAt: '2026-10-31T23:59:59Z', createdAt: '2026-04-15T00:00:00Z', totalSaved: 11835,
  },
  {
    id: 'promo-006', code: 'FLASH50', description: '24-hour flash sale — NOK 50 off',
    type: 'fixed', value: 50, minOrder: 200, maxUses: 50, usedCount: 50,
    active: false, expiresAt: '2026-03-15T23:59:59Z', createdAt: '2026-03-14T00:00:00Z', totalSaved: 2500,
  },
]

export const REFERRAL_STATS = [
  {
    memberId: 'NV-10042', memberName: 'Lars Eriksen',  rank: 'Silver',   status: 'Active',
    referralCode: 'LARS42',
    clicks30d: 148, conversions30d: 14, clicksAll: 892, conversionsAll: 71,
    lastConversionAt: '2026-07-26T11:22:00Z',
    totalCommissionsEarned: 3140,
  },
  {
    memberId: 'NV-10087', memberName: 'Mia Andersen',  rank: 'Bronze',   status: 'Active',
    referralCode: 'MIA87',
    clicks30d: 94, conversions30d: 8, clicksAll: 411, conversionsAll: 33,
    lastConversionAt: '2026-07-24T09:15:00Z',
    totalCommissionsEarned: 1650,
  },
  {
    memberId: 'NV-10230', memberName: 'Sigrid Voss',   rank: 'Bronze',   status: 'Active',
    referralCode: 'SIGRID230',
    clicks30d: 76, conversions30d: 6, clicksAll: 298, conversionsAll: 21,
    lastConversionAt: '2026-07-23T14:40:00Z',
    totalCommissionsEarned: 940,
  },
  {
    memberId: 'NV-10091', memberName: 'Erik Solberg',  rank: 'Unranked', status: 'Active',
    referralCode: 'ERIK91',
    clicks30d: 53, conversions30d: 4, clicksAll: 187, conversionsAll: 14,
    lastConversionAt: '2026-07-20T16:55:00Z',
    totalCommissionsEarned: 560,
  },
  {
    memberId: 'NV-10241', memberName: 'Olaf Berg',     rank: 'Unranked', status: 'Active',
    referralCode: 'OLAF241',
    clicks30d: 39, conversions30d: 3, clicksAll: 112, conversionsAll: 8,
    lastConversionAt: '2026-07-18T08:30:00Z',
    totalCommissionsEarned: 320,
  },
  {
    memberId: 'NV-10122', memberName: 'Anna Lund',     rank: 'Unranked', status: 'Active',
    referralCode: 'ANNA122',
    clicks30d: 28, conversions30d: 2, clicksAll: 74, conversionsAll: 5,
    lastConversionAt: '2026-07-15T12:10:00Z',
    totalCommissionsEarned: 200,
  },
  {
    memberId: 'NV-10215', memberName: 'Bjorn Lie',     rank: 'Unranked', status: 'Active',
    referralCode: 'BLIE215',
    clicks30d: 22, conversions30d: 2, clicksAll: 55, conversionsAll: 4,
    lastConversionAt: '2026-07-12T17:45:00Z',
    totalCommissionsEarned: 160,
  },
  {
    memberId: 'NV-10102', memberName: 'Kari Holm',     rank: 'Unranked', status: 'Active',
    referralCode: 'KARI102',
    clicks30d: 15, conversions30d: 1, clicksAll: 38, conversionsAll: 3,
    lastConversionAt: '2026-07-08T10:20:00Z',
    totalCommissionsEarned: 120,
  },
  {
    memberId: 'NV-10118', memberName: 'Tor Bakke',     rank: 'Unranked', status: 'Inactive',
    referralCode: 'TOR118',
    clicks30d: 4, conversions30d: 0, clicksAll: 29, conversionsAll: 2,
    lastConversionAt: '2026-04-03T09:00:00Z',
    totalCommissionsEarned: 80,
  },
  {
    memberId: 'NV-10208', memberName: 'Hege Moen',     rank: 'Unranked', status: 'Inactive',
    referralCode: 'HEGE208',
    clicks30d: 2, conversions30d: 0, clicksAll: 11, conversionsAll: 1,
    lastConversionAt: '2026-02-14T15:30:00Z',
    totalCommissionsEarned: 40,
  },
]

export const EMAIL_TEMPLATES = [
  {
    id: 'welcome',
    category: 'onboarding',
    name: 'Welcome to Nordic Vitals',
    subject: 'Welcome, {{member_name}}! Your Nordic Vitals account is ready',
    body: `Hi {{member_name}},

Welcome to Nordic Vitals! Your member ID is {{member_id}}.

You're now part of a growing community of health-focused entrepreneurs across Scandinavia and beyond.

Here's what you can do right now:
• Browse our product catalogue and place your first order
• Share your referral link and start building your team
• Explore your member dashboard at {{dashboard_link}}

If you have any questions, our support team is here to help.

To your health and success,
The Nordic Vitals Team`,
    variables: ['member_name', 'member_id', 'dashboard_link'],
    active: true,
    lastEditedAt: '2026-06-10T09:00:00Z',
    sentCount: 312,
  },
  {
    id: 'commission_run',
    category: 'transaction',
    name: 'Commission Run Results',
    subject: 'Your commissions are in — {{amount}} MLMT credited',
    body: `Hi {{member_name}},

Great news! The weekly commission run for {{period}} has completed and your earnings have been credited to your wallet.

Summary:
• Commissions earned: {{amount}} MLMT
• Current rank: {{rank}}
• Run date: {{date}}

Log in to your dashboard to view the full breakdown and request a withdrawal:
{{dashboard_link}}

Keep sharing, keep earning!
Nordic Vitals`,
    variables: ['member_name', 'amount', 'rank', 'period', 'date', 'dashboard_link'],
    active: true,
    lastEditedAt: '2026-06-10T09:00:00Z',
    sentCount: 1840,
  },
  {
    id: 'rank_up',
    category: 'rank',
    name: 'Rank Up Congratulations',
    subject: '🎉 Congratulations {{member_name}} — you reached {{rank}}!',
    body: `Hi {{member_name}},

Amazing achievement! You've just been promoted to {{rank}} in the Nordic Vitals network.

This rank unlocks:
• Higher commission percentages on team volume
• Access to exclusive rank bonuses
• Priority support from our member success team

Your new rank is live immediately. Log in to see your updated earnings potential:
{{dashboard_link}}

You're an inspiration to your team — keep it up!

Warm regards,
Nordic Vitals`,
    variables: ['member_name', 'rank', 'dashboard_link'],
    active: true,
    lastEditedAt: '2026-06-10T09:00:00Z',
    sentCount: 87,
  },
  {
    id: 'withdrawal_processed',
    category: 'transaction',
    name: 'Withdrawal Processed',
    subject: 'Your withdrawal of {{amount}} MLMT has been processed',
    body: `Hi {{member_name}},

Your withdrawal request has been approved and processed.

Details:
• Amount: {{amount}} MLMT
• Method: {{method}}
• Reference: {{reference}}
• Processed on: {{date}}

Please allow 1–3 business days for funds to arrive depending on your chosen method.

If you have any questions, contact us at support@nordicvitals.com.

Best,
Nordic Vitals Finance Team`,
    variables: ['member_name', 'amount', 'method', 'reference', 'date'],
    active: true,
    lastEditedAt: '2026-06-10T09:00:00Z',
    sentCount: 204,
  },
  {
    id: 'withdrawal_rejected',
    category: 'transaction',
    name: 'Withdrawal Request Update',
    subject: 'Update on your withdrawal request',
    body: `Hi {{member_name}},

We were unable to process your recent withdrawal request of {{amount}} MLMT.

Reason: {{reason}}

Common reasons include insufficient verified account details or a pending compliance review. Please log in to your wallet and resubmit with updated information:
{{dashboard_link}}

If you believe this is an error, please open a support ticket and we'll resolve it promptly.

Nordic Vitals Support`,
    variables: ['member_name', 'amount', 'reason', 'dashboard_link'],
    active: true,
    lastEditedAt: '2026-06-10T09:00:00Z',
    sentCount: 19,
  },
  {
    id: 'password_reset',
    category: 'auth',
    name: 'Password Reset',
    subject: 'Reset your Nordic Vitals password',
    body: `Hi {{member_name}},

We received a request to reset the password for your account ({{email}}).

Click the link below to set a new password — this link expires in 2 hours:
{{reset_link}}

If you didn't request a password reset, you can ignore this email. Your current password will remain unchanged.

Nordic Vitals Security Team`,
    variables: ['member_name', 'email', 'reset_link'],
    active: true,
    lastEditedAt: '2026-06-10T09:00:00Z',
    sentCount: 56,
  },
  {
    id: 'autoship_reminder',
    category: 'autoship',
    name: 'Autoship Ships Tomorrow',
    subject: 'Your autoship order ships tomorrow — {{product_name}}',
    body: `Hi {{member_name}},

Just a heads-up — your autoship subscription is scheduled to process tomorrow.

Order details:
• Product: {{product_name}}
• Quantity: {{quantity}}
• Frequency: {{frequency}}
• Estimated charge: NOK {{price}}

Need to make changes? You can pause, edit, or cancel up until midnight tonight:
{{autoship_link}}

Thank you for your continued support!
Nordic Vitals`,
    variables: ['member_name', 'product_name', 'quantity', 'frequency', 'price', 'autoship_link'],
    active: true,
    lastEditedAt: '2026-06-10T09:00:00Z',
    sentCount: 628,
  },
  {
    id: 'autoship_failed',
    category: 'autoship',
    name: 'Autoship Payment Failed',
    subject: 'Action required — autoship payment could not be processed',
    body: `Hi {{member_name}},

We were unable to charge your payment method for your autoship order of {{product_name}}.

To avoid missing your next shipment and losing your subscription PV, please update your payment details as soon as possible:
{{autoship_link}}

Your autoship will be paused after 3 failed attempts.

If you need help, contact us at support@nordicvitals.com.

Nordic Vitals`,
    variables: ['member_name', 'product_name', 'autoship_link'],
    active: false,
    lastEditedAt: '2026-06-10T09:00:00Z',
    sentCount: 11,
  },
  {
    id: 'support_reply',
    category: 'support',
    name: 'Support Ticket Reply',
    subject: 'Re: [Ticket #{{ticket_id}}] {{ticket_subject}}',
    body: `Hi {{member_name}},

Our support team has replied to your ticket #{{ticket_id}}.

{{agent_reply}}

View the full conversation and reply here:
{{ticket_link}}

We aim to resolve all tickets within 24 hours on business days.

Nordic Vitals Support`,
    variables: ['member_name', 'ticket_id', 'ticket_subject', 'agent_reply', 'ticket_link'],
    active: true,
    lastEditedAt: '2026-06-10T09:00:00Z',
    sentCount: 143,
  },
  {
    id: 'new_recruit',
    category: 'referral',
    name: 'New Team Member Joined',
    subject: '{{recruit_name}} just joined your team!',
    body: `Hi {{member_name}},

Exciting news — {{recruit_name}} just enrolled in Nordic Vitals using your referral link!

They've been placed in your {{leg}} leg. Here's how this helps you:
• Their purchases count toward your group volume (GV)
• They count toward your team-size rank requirements
• Help them get started quickly to maximise your commission potential

Log in to see your updated team tree:
{{dashboard_link}}

Keep sharing — every new member brings you closer to your next rank!

Nordic Vitals`,
    variables: ['member_name', 'recruit_name', 'leg', 'dashboard_link'],
    active: true,
    lastEditedAt: '2026-06-10T09:00:00Z',
    sentCount: 289,
  },
]

export const TOKEN_STATS = {
  totalSupply:       10_000_000,
  circulatingSupply:  3_482_150,
  burnedTotal:          217_850,
  reservedPlatform:   6_300_000,
  memberWallets:      3_482_150,
  lastMintAt: '2026-07-15T10:00:00Z',
  lastBurnAt: '2026-07-20T14:30:00Z',
}

export const TOKEN_EVENTS = [
  { id: 'te001', type: 'mint',     amount: 500_000, actor: 'admin@nordicvitals.com', recipient: 'platform-reserve', memo: 'Initial platform reserve',          ts: '2026-01-01T00:00:00Z' },
  { id: 'te002', type: 'airdrop',  amount:  50_000, actor: 'admin@nordicvitals.com', recipient: 'all-members',      memo: 'Beta launch bonus — all members',   ts: '2026-02-01T09:00:00Z' },
  { id: 'te003', type: 'mint',     amount: 200_000, actor: 'admin@nordicvitals.com', recipient: 'platform-reserve', memo: 'Q1 expansion mint',                  ts: '2026-03-15T11:00:00Z' },
  { id: 'te004', type: 'burn',     amount:  10_000, actor: 'system',                 recipient: null,               memo: 'Expired promo code rewards',        ts: '2026-04-01T08:00:00Z' },
  { id: 'te005', type: 'airdrop',  amount:   5_000, actor: 'admin@nordicvitals.com', recipient: 'rank:platinum',    memo: 'Platinum anniversary bonus',        ts: '2026-04-15T12:00:00Z' },
  { id: 'te006', type: 'mint',     amount: 1_000_000, actor: 'admin@nordicvitals.com', recipient: 'platform-reserve', memo: 'Series A reserve allocation',    ts: '2026-05-01T09:00:00Z' },
  { id: 'te007', type: 'airdrop',  amount:  25_000, actor: 'admin@nordicvitals.com', recipient: 'rank:gold',        memo: 'Gold rank quarterly bonus',         ts: '2026-05-15T10:30:00Z' },
  { id: 'te008', type: 'burn',     amount:  50_000, actor: 'system',                 recipient: null,               memo: 'Lapsed member wallet reclaim',      ts: '2026-06-01T00:00:00Z' },
  { id: 'te009', type: 'mint',     amount: 2_000_000, actor: 'admin@nordicvitals.com', recipient: 'platform-reserve', memo: 'Growth reserve expansion',       ts: '2026-06-15T09:00:00Z' },
  { id: 'te010', type: 'airdrop',  amount:  10_000, actor: 'admin@nordicvitals.com', recipient: 'all-members',      memo: 'Mid-year engagement airdrop',       ts: '2026-07-01T10:00:00Z' },
  { id: 'te011', type: 'airdrop',  amount:   2_500, actor: 'admin@nordicvitals.com', recipient: 'rank:silver',      memo: 'Silver summer promo',               ts: '2026-07-10T11:00:00Z' },
  { id: 'te012', type: 'mint',     amount: 5_000_000, actor: 'admin@nordicvitals.com', recipient: 'platform-reserve', memo: 'Long-term incentive pool',       ts: '2026-07-15T10:00:00Z' },
  { id: 'te013', type: 'burn',     amount: 150_000, actor: 'system',                 recipient: null,               memo: 'Commission over-issue correction',  ts: '2026-07-20T14:30:00Z' },
  { id: 'te014', type: 'airdrop',  amount:   1_000, actor: 'admin@nordicvitals.com', recipient: 'member:usr-0001',  memo: 'Manual top-up for top recruiter',   ts: '2026-07-22T09:00:00Z' },
  { id: 'te015', type: 'burn',     amount:   7_850, actor: 'system',                 recipient: null,               memo: 'Stale autoship credit reclaim',     ts: '2026-07-25T08:00:00Z' },
]

export const RANK_HISTORY = [
  { rank: 'Silver',   achievedAt: '2026-06-10T09:00:00Z', note: 'Reached 2 000 GV on left leg'       },
  { rank: 'Bronze',   achievedAt: '2026-04-22T14:30:00Z', note: 'First active recruit enrolled'      },
  { rank: 'Unranked', achievedAt: '2026-03-05T11:00:00Z', note: 'Joined Nordic Vitals'               },
]

// ── Analytics ─────────────────────────────────────────────────────────────────
export const ANALYTICS_DATA = {
  kpis: {
    ytdRevenue:          2_497_600,
    ytdRevenueGrowth:        41.2,   // % vs same period prior year
    autoshipMRR:           184_320,
    avgOrderValue:           2_840,
    commissionPayoutRatio:    28.4,  // % of revenue paid as commissions
    activeConversionRate:     25.2,  // % of all-time sign-ups who are currently active
    avgRecruitPerMember:       2.3,
  },
  monthlyRevenue: [
    { month: 'Jul 25', revenue: 148_200, orders: 52,  commissions:  42_130 },
    { month: 'Aug 25', revenue: 174_600, orders: 61,  commissions:  49_640 },
    { month: 'Sep 25', revenue: 203_400, orders: 72,  commissions:  57_770 },
    { month: 'Oct 25', revenue: 241_800, orders: 85,  commissions:  68_670 },
    { month: 'Nov 25', revenue: 318_500, orders: 113, commissions:  90_460 },
    { month: 'Dec 25', revenue: 402_100, orders: 142, commissions: 114_200 },
    { month: 'Jan 26', revenue: 287_400, orders:  98, commissions:  81_680 },
    { month: 'Feb 26', revenue: 312_800, orders: 108, commissions:  88_840 },
    { month: 'Mar 26', revenue: 395_200, orders: 136, commissions: 112_230 },
    { month: 'Apr 26', revenue: 428_600, orders: 151, commissions: 121_730 },
    { month: 'May 26', revenue: 467_400, orders: 165, commissions: 132_740 },
    { month: 'Jun 26', revenue: 512_200, orders: 181, commissions: 145_470 },
    { month: 'Jul 26', revenue: 294_000, orders:  99, commissions:  83_500, partial: true },
  ],
  memberGrowth: [
    { month: 'Jul 25', newMembers:  38, cumulative:  82 },
    { month: 'Aug 25', newMembers:  44, cumulative: 126 },
    { month: 'Sep 25', newMembers:  61, cumulative: 187 },
    { month: 'Oct 25', newMembers:  75, cumulative: 262 },
    { month: 'Nov 25', newMembers:  98, cumulative: 360 },
    { month: 'Dec 25', newMembers: 127, cumulative: 487 },
    { month: 'Jan 26', newMembers:  84, cumulative: 571 },
    { month: 'Feb 26', newMembers:  92, cumulative: 663 },
    { month: 'Mar 26', newMembers: 108, cumulative: 771 },
    { month: 'Apr 26', newMembers:  94, cumulative: 865 },
    { month: 'May 26', newMembers:  79, cumulative: 944 },
    { month: 'Jun 26', newMembers:  85, cumulative: 1_029 },
    { month: 'Jul 26', newMembers:  53, cumulative: 1_082, partial: true },
  ],
  conversionFunnel: [
    { stage: 'Landing page visitors',  count: 54_200 },
    { stage: 'Product page views',     count: 21_840 },
    { stage: 'Join page visits',       count:  6_150 },
    { stage: 'Completed sign-ups',     count:  1_082 },
    { stage: 'First purchase made',    count:    847 },
    { stage: 'Active members (30d)',   count:    312 },
  ],
  geoDistribution: [
    { country: 'Norway',        members: 302, pct: 27.9 },
    { country: 'Sweden',        members: 248, pct: 22.9 },
    { country: 'Denmark',       members: 176, pct: 16.3 },
    { country: 'Finland',       members: 138, pct: 12.8 },
    { country: 'Germany',       members:  72, pct:  6.7 },
    { country: 'United Kingdom',members:  54, pct:  5.0 },
    { country: 'Netherlands',   members:  36, pct:  3.3 },
    { country: 'Iceland',       members:  28, pct:  2.6 },
    { country: 'Canada',        members:  16, pct:  1.5 },
    { country: 'Other',         members:  12, pct:  1.1 },
  ],
  categoryRevenue: [
    { category: 'Omega & Fish Oil', revenue: 897_400, units: 1_248, avgPrice: 719 },
    { category: 'Vitamins',         revenue: 648_200, units: 2_160, avgPrice: 300 },
    { category: 'Beauty & Skin',    revenue: 492_600, units:   694, avgPrice: 710 },
    { category: 'Energy',           revenue: 316_800, units:   912, avgPrice: 347 },
    { category: 'Greens',           revenue:  96_400, units:   602, avgPrice: 160 },
    { category: 'Focus',            revenue:  46_200, units:   176, avgPrice: 263 },
  ],
}
