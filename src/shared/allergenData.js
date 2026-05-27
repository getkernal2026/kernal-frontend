// ─── Allergen & Nutrition Label Compliance Data ────────────────────────────
// Shared between InventoryModule (lot modal Compliance tab)
// and LossPreventionModule (AllergenRecall tab).

export const BIG_9 = [
  { id: 'milk',      label: 'Milk'       },
  { id: 'eggs',      label: 'Eggs'       },
  { id: 'fish',      label: 'Fish'       },
  { id: 'shellfish', label: 'Shellfish'  },
  { id: 'treeNuts',  label: 'Tree Nuts'  },
  { id: 'peanuts',   label: 'Peanuts'    },
  { id: 'wheat',     label: 'Wheat'      },
  { id: 'soy',       label: 'Soy'        },
  { id: 'sesame',    label: 'Sesame'     },
];

// allergen status per product: 'contains' | 'may_contain' | 'free'
// nutrition: full FDA Nutrition Facts panel (per serving)
// units: fat/carb/protein/sodium in grams or mg as labeled; vitD/calcium/iron/potassium in mg
export const ALLERGEN_DATA = {

  'FRZ-BEEF-01': {
    name: 'Ground Beef 80/20 5lb Chub',
    allergens: { milk:'free', eggs:'free', fish:'free', shellfish:'free', treeNuts:'free', peanuts:'free', wheat:'free', soy:'free', sesame:'free' },
    nutrition: {
      servingSize: '4 oz (113g)', servingsPerContainer: 'About 10',
      calories: 290,
      totalFat: 22,     satFat: 9,   transFat: 0.5,
      cholesterol: 85,  sodium: 75,
      totalCarbs: 0,    fiber: 0,    sugars: 0,  addedSugars: 0,
      protein: 22,
      vitD: 0, calcium: 15, iron: 2.3, potassium: 295,
    },
    countryOfOrigin: 'USA',
    certifications: ['USDA Inspected', 'Grass-Fed'],
  },

  'FRZ-CHIX-01': {
    name: 'Chicken Breast Boneless 10lb',
    allergens: { milk:'free', eggs:'free', fish:'free', shellfish:'free', treeNuts:'free', peanuts:'free', wheat:'free', soy:'free', sesame:'free' },
    nutrition: {
      servingSize: '4 oz (113g)', servingsPerContainer: 'About 22',
      calories: 140,
      totalFat: 3,     satFat: 0.7, transFat: 0,
      cholesterol: 70, sodium: 65,
      totalCarbs: 0,   fiber: 0,   sugars: 0,  addedSugars: 0,
      protein: 28,
      vitD: 0, calcium: 10, iron: 0.6, potassium: 360,
    },
    countryOfOrigin: 'USA',
    certifications: ['USDA Inspected', 'No Antibiotics Ever'],
  },

  'FRZ-SALM-01': {
    name: 'Atlantic Salmon Portions 6oz',
    allergens: { milk:'free', eggs:'free', fish:'contains', shellfish:'may_contain', treeNuts:'free', peanuts:'free', wheat:'free', soy:'free', sesame:'free' },
    nutrition: {
      servingSize: '6 oz (170g)', servingsPerContainer: 'About 4',
      calories: 280,
      totalFat: 14,    satFat: 3,   transFat: 0,
      cholesterol: 80, sodium: 75,
      totalCarbs: 0,   fiber: 0,   sugars: 0,  addedSugars: 0,
      protein: 35,
      vitD: 18, calcium: 25, iron: 0.5, potassium: 700,
    },
    countryOfOrigin: 'Norway / Chile',
    certifications: ['BAP 4-Star', 'ASC Certified'],
  },

  'PROT-001': {
    name: 'Gulf Shrimp 16/20 ct 5lb Block',
    allergens: { milk:'free', eggs:'free', fish:'free', shellfish:'contains', treeNuts:'free', peanuts:'free', wheat:'free', soy:'free', sesame:'free' },
    nutrition: {
      servingSize: '3 oz (85g)', servingsPerContainer: 'About 9',
      calories: 90,
      totalFat: 1,      satFat: 0,   transFat: 0,
      cholesterol: 130, sodium: 105,
      totalCarbs: 1,    fiber: 0,   sugars: 0,  addedSugars: 0,
      protein: 18,
      vitD: 0, calcium: 60, iron: 0.9, potassium: 220,
    },
    countryOfOrigin: 'Gulf of Mexico, USA',
    certifications: ['Wild-Caught', 'MSC Certified'],
  },

  'DAI-MILK-02': {
    name: 'Whole Milk 1 Gal (4pk)',
    allergens: { milk:'contains', eggs:'free', fish:'free', shellfish:'free', treeNuts:'free', peanuts:'free', wheat:'free', soy:'free', sesame:'free' },
    nutrition: {
      servingSize: '1 cup (240ml)', servingsPerContainer: 'About 16',
      calories: 150,
      totalFat: 8,     satFat: 5,   transFat: 0,
      cholesterol: 35, sodium: 125,
      totalCarbs: 12,  fiber: 0,   sugars: 12, addedSugars: 0,
      protein: 8,
      vitD: 2.5, calcium: 300, iron: 0, potassium: 390,
    },
    countryOfOrigin: 'USA',
    certifications: ['USDA Grade A', 'Pasteurized', 'Homogenized'],
  },

  'DAI-CRM-01': {
    name: 'Heavy Cream 1QT / 12ct',
    allergens: { milk:'contains', eggs:'free', fish:'free', shellfish:'free', treeNuts:'free', peanuts:'free', wheat:'free', soy:'free', sesame:'free' },
    nutrition: {
      servingSize: '1 tbsp (15ml)', servingsPerContainer: 'About 32',
      calories: 50,
      totalFat: 5,     satFat: 3.5, transFat: 0,
      cholesterol: 20, sodium: 5,
      totalCarbs: 0,   fiber: 0,   sugars: 0,  addedSugars: 0,
      protein: 0,
      vitD: 0, calcium: 15, iron: 0, potassium: 20,
    },
    countryOfOrigin: 'USA',
    certifications: ['USDA Grade A', 'Pasteurized'],
  },

  'PRO-TOMA-01': {
    name: 'Roma Tomatoes 25lb Case',
    allergens: { milk:'free', eggs:'free', fish:'free', shellfish:'free', treeNuts:'free', peanuts:'free', wheat:'free', soy:'free', sesame:'free' },
    nutrition: {
      servingSize: '1 medium (91g)', servingsPerContainer: 'Variable',
      calories: 18,
      totalFat: 0.2,  satFat: 0,   transFat: 0,
      cholesterol: 0, sodium: 9,
      totalCarbs: 3.9, fiber: 1.2, sugars: 2.6, addedSugars: 0,
      protein: 0.9,
      vitD: 0, calcium: 10, iron: 0.3, potassium: 235,
    },
    countryOfOrigin: 'Mexico / USA (seasonal)',
    certifications: ['GAP Certified'],
  },

  'DRY-RICE-05': {
    name: 'Jasmine Rice 50lb Bag',
    allergens: { milk:'free', eggs:'free', fish:'free', shellfish:'free', treeNuts:'free', peanuts:'free', wheat:'may_contain', soy:'free', sesame:'may_contain' },
    nutrition: {
      servingSize: '¼ cup dry (45g)', servingsPerContainer: 'About 500',
      calories: 160,
      totalFat: 0,    satFat: 0,   transFat: 0,
      cholesterol: 0, sodium: 0,
      totalCarbs: 35, fiber: 0,   sugars: 0,  addedSugars: 0,
      protein: 3,
      vitD: 0, calcium: 2, iron: 1.8, potassium: 55,
    },
    countryOfOrigin: 'Thailand',
    certifications: ['Non-GMO'],
  },

  // Bag-unit variant — same product, same allergen/nutrition profile as pallet SKU
  'DRY-RICE-05-BAG': {
    name: 'Jasmine Rice 50lb Bag (unit)',
    allergens: { milk:'free', eggs:'free', fish:'free', shellfish:'free', treeNuts:'free', peanuts:'free', wheat:'may_contain', soy:'free', sesame:'may_contain' },
    nutrition: {
      servingSize: '¼ cup dry (45g)', servingsPerContainer: 'About 500',
      calories: 160,
      totalFat: 0,    satFat: 0,   transFat: 0,
      cholesterol: 0, sodium: 0,
      totalCarbs: 35, fiber: 0,   sugars: 0,  addedSugars: 0,
      protein: 3,
      vitD: 0, calcium: 2, iron: 1.8, potassium: 55,
    },
    countryOfOrigin: 'Thailand',
    certifications: ['Non-GMO'],
  },

  // Non-food supply item — allergen declarations not applicable
  'SUP-CUP-16': {
    name: '16oz Clear Plastic Cups / 50ct Sleeve',
    nonFood: true,
    allergens: { milk:'free', eggs:'free', fish:'free', shellfish:'free', treeNuts:'free', peanuts:'free', wheat:'free', soy:'free', sesame:'free' },
    nutrition: null,
    countryOfOrigin: 'USA',
    certifications: ['FDA Food-Contact Compliant', 'BPA Free'],
  },
};

// ── FSMA 204 / Allergen Recall Exposure Records ────────────────────────────
// Maps allergenId → recent customer orders containing that allergen.
// Used by Loss Prevention AllergenRecall tab.
export const CUSTOMER_ALLERGEN_EXPOSURE = {
  shellfish: [
    { customerId:'CUST-101', customerName:'Metro Diner & Grill',      contact:'James Thibodaux',    sku:'PROT-001',   skuName:'Gulf Shrimp 16/20 ct 5lb', orderId:'SO-9893', qty:20, date:'2026-05-10', status:'contains'    },
    { customerId:'CUST-102', customerName:'Harbor View Restaurant',    contact:'Maria Santos',       sku:'PROT-001',   skuName:'Gulf Shrimp 16/20 ct 5lb', orderId:'SO-9896', qty:15, date:'2026-05-08', status:'contains'    },
    { customerId:'CUST-103', customerName:'Grand Bayou Hotel & Conf.', contact:'Derek Fontenot',     sku:'PROT-001',   skuName:'Gulf Shrimp 16/20 ct 5lb', orderId:'SO-9897', qty:30, date:'2026-05-12', status:'contains'    },
    { customerId:'CUST-103', customerName:'Grand Bayou Hotel & Conf.', contact:'Derek Fontenot',     sku:'FRZ-SALM-01',skuName:'Atlantic Salmon Portions', orderId:'SO-9897', qty:8,  date:'2026-05-12', status:'may_contain' },
    { customerId:'CUST-105', customerName:'LSU Campus Dining Svcs',    contact:'Angela Broussard',   sku:'FRZ-SALM-01',skuName:'Atlantic Salmon Portions', orderId:'SO-9899', qty:14, date:'2026-05-18', status:'may_contain' },
  ],
  fish: [
    { customerId:'CUST-101', customerName:'Metro Diner & Grill',      contact:'James Thibodaux',    sku:'FRZ-SALM-01',skuName:'Atlantic Salmon Portions', orderId:'SO-9893', qty:10, date:'2026-05-15', status:'contains'    },
    { customerId:'CUST-102', customerName:'Harbor View Restaurant',    contact:'Maria Santos',       sku:'FRZ-SALM-01',skuName:'Atlantic Salmon Portions', orderId:'SO-9895', qty:12, date:'2026-05-11', status:'contains'    },
    { customerId:'CUST-103', customerName:'Grand Bayou Hotel & Conf.', contact:'Derek Fontenot',     sku:'FRZ-SALM-01',skuName:'Atlantic Salmon Portions', orderId:'SO-9897', qty:8,  date:'2026-05-12', status:'contains'    },
    { customerId:'CUST-105', customerName:'LSU Campus Dining Svcs',    contact:'Angela Broussard',   sku:'FRZ-SALM-01',skuName:'Atlantic Salmon Portions', orderId:'SO-9899', qty:14, date:'2026-05-18', status:'contains'    },
  ],
  milk: [
    { customerId:'CUST-101', customerName:'Metro Diner & Grill',      contact:'James Thibodaux',    sku:'DAI-MILK-02',skuName:'Whole Milk 1 Gal (4pk)',   orderId:'SO-9891', qty:24, date:'2026-05-20', status:'contains'    },
    { customerId:'CUST-102', customerName:'Harbor View Restaurant',    contact:'Maria Santos',       sku:'DAI-MILK-02',skuName:'Whole Milk 1 Gal (4pk)',   orderId:'SO-9896', qty:16, date:'2026-05-14', status:'contains'    },
    { customerId:'CUST-104', customerName:'Sunset Bistro & Bar',       contact:'Chloe Arceneaux',    sku:'DAI-CRM-01', skuName:'Heavy Cream 1QT / 12ct',   orderId:'SO-9894', qty:12, date:'2026-05-18', status:'contains'    },
    { customerId:'CUST-103', customerName:'Grand Bayou Hotel & Conf.', contact:'Derek Fontenot',     sku:'DAI-MILK-02',skuName:'Whole Milk 1 Gal (4pk)',   orderId:'SO-9897', qty:20, date:'2026-05-12', status:'contains'    },
  ],
  wheat: [
    { customerId:'CUST-105', customerName:'LSU Campus Dining Svcs',    contact:'Angela Broussard',   sku:'DRY-RICE-05',skuName:'Jasmine Rice 50lb Bag',    orderId:'SO-9892', qty:5,  date:'2026-05-19', status:'may_contain' },
    { customerId:'CUST-104', customerName:'Sunset Bistro & Bar',       contact:'Chloe Arceneaux',    sku:'DRY-RICE-05',skuName:'Jasmine Rice 50lb Bag',    orderId:'SO-9898', qty:3,  date:'2026-05-15', status:'may_contain' },
  ],
  sesame: [
    { customerId:'CUST-105', customerName:'LSU Campus Dining Svcs',    contact:'Angela Broussard',   sku:'DRY-RICE-05',skuName:'Jasmine Rice 50lb Bag',    orderId:'SO-9892', qty:5,  date:'2026-05-19', status:'may_contain' },
  ],
  eggs:     [],
  treeNuts: [],
  peanuts:  [],
  soy:      [],
};
