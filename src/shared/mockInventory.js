// ─────────────────────────────────────────────────────────────────────────────
// KERNAL SHARED MOCK INVENTORY
// Single source of truth used by B2B, Warehouse, Field Sales, CRM, Reorder.
// ─────────────────────────────────────────────────────────────────────────────

export const MOCK_INVENTORY = [
  // ── CRITICAL: available ≤ reorderPoint ────────────────────────────────────
  {
    id: 1,
    sku:           'DRY-RICE-05',
    name:          'Jasmine Rice 50lb (Pallet)',
    basePrice:     1200.00,  price: 1200.00,  costBasis: 950.00,
    physicalStock: 18,       allocatedStock: 5,
    uom:           'pallet', category: 'dry goods', barcode: '002233445566',
    isCatchWeight: false,
    reorderPoint:  15,   reorderQty: 30,  avgDailyUsage: 1.2, leadTimeDays: 5,
    preferredVendorId: 'V-004', preferredVendorName: 'Metro Dry Goods',
    vendorProductCode: 'MDG-RCE-JAS', unitCost: 35.00,
    lots: [{ lotId: 'LOT-C', qty: 5, qcHold: false, expiry: '2027-12-01' }],
    specs: { origin:'Thailand (Jasmine Grade A)', allergens:'None', shelfLife:'24 months', storage:'Ambient, dry', description:'Premium Thai jasmine rice, 40×50lb bags per pallet.' },
    locationStock: { 'LOC-A': { physical: 11, allocated: 3 }, 'LOC-B': { physical: 5, allocated: 2 }, 'LOC-C': { physical: 2, allocated: 0 } },
  },
  {
    id: 205,
    sku:           'DAI-CHE-02',
    name:          'American Cheese Slices (5 lb)',
    basePrice:     18.50,    price: 18.50,    costBasis: 13.00,
    physicalStock: 90,       allocatedStock: 28,
    uom:           'pack',   category: 'dairy', barcode: '006677889900',
    isCatchWeight: false,
    reorderPoint:  70,   reorderQty: 120, avgDailyUsage: 5.4, leadTimeDays: 2,
    preferredVendorId: 'V-003', preferredVendorName: 'Dairy Fresh Distributors',
    vendorProductCode: 'DFD-CHE-SHR', unitCost: 13.00,
    lots: [
      { lotId: 'LOT-CHE-1', qty: 45, qcHold: false, expiry: '2026-07-10' },
      { lotId: 'LOT-CHE-2', qty: 45, qcHold: false, expiry: '2026-07-25' },
    ],
    specs: { origin:"Land O'Lakes", allergens:'Milk', shelfLife:'45 days', storage:'34–38°F', description:'Classic American cheese slices, individually wrapped. 5 lb pack.' },
    locationStock: { 'LOC-A': { physical: 54, allocated: 17 }, 'LOC-B': { physical: 24, allocated: 8 }, 'LOC-C': { physical: 12, allocated: 3 } },
  },
  {
    id: 99,
    sku:           'DRY-OIL-5G',
    name:          'Vegetable Oil 5 Gal',
    basePrice:     42.00,    price: 42.00,    costBasis: 30.00,
    physicalStock: 43,       allocatedStock: 15,
    uom:           'jug',    category: 'dry goods', barcode: '007788990011',
    isCatchWeight: false,
    reorderPoint:  30,   reorderQty: 60,  avgDailyUsage: 2.8, leadTimeDays: 5,
    preferredVendorId: 'V-004', preferredVendorName: 'Metro Dry Goods',
    vendorProductCode: 'MDG-OIL-CAN', unitCost: 68.00,
    lots: [
      { lotId: 'LOT-OIL-1', qty: 20, qcHold: false, expiry: '2027-06-01' },
      { lotId: 'LOT-OIL-2', qty: 23, qcHold: false, expiry: '2027-12-01' },
    ],
    specs: { origin:'ADM Milling', allergens:'None', shelfLife:'24 months', storage:'Ambient, dark', description:'All-purpose vegetable frying oil, 5-gallon jug.' },
    locationStock: { 'LOC-A': { physical: 26, allocated: 9 }, 'LOC-B': { physical: 12, allocated: 4 }, 'LOC-C': { physical: 5, allocated: 2 } },
  },

  // ── WARNING: available within 150% of reorderPoint ────────────────────────
  {
    id: 4,
    sku:           'PRO-TOMA-01',
    name:          'Roma Tomatoes 25lb',
    basePrice:     22.00,    price: 22.00,    costBasis: 15.00,
    physicalStock: 72,       allocatedStock: 20,
    uom:           'case',   category: 'produce', barcode: '003344556677',
    isCatchWeight: false,
    reorderPoint:  50,   reorderQty: 100, avgDailyUsage: 7.1, leadTimeDays: 1,
    preferredVendorId: 'V-002', preferredVendorName: 'Sunshine Produce Co.',
    vendorProductCode: 'SPC-TOM-RMA', unitCost: 18.00,
    lots: [
      { lotId: 'LOT-T-1', qty: 35, qcHold: false, expiry: '2026-06-01' },
      { lotId: 'LOT-T-2', qty: 37, qcHold: false, expiry: '2026-06-08' },
    ],
    specs: { origin:'Salinas Valley, CA', allergens:'None', shelfLife:'10 days', storage:'50–55°F', description:'Firm, vine-ripened Roma tomatoes. 25 lb case.' },
    locationStock: { 'LOC-A': { physical: 44, allocated: 12 }, 'LOC-B': { physical: 18, allocated: 5 }, 'LOC-C': { physical: 10, allocated: 3 } },
  },
  {
    id: 201,
    sku:           'BAK-BUN-01',
    name:          'Brioche Burger Buns (12 pk)',
    basePrice:     8.75,     price: 8.75,     costBasis: 6.20,
    physicalStock: 110,      allocatedStock: 25,
    uom:           'pack',   category: 'bakery', barcode: '005566778899',
    isCatchWeight: false,
    reorderPoint:  80,   reorderQty: 150, avgDailyUsage: 6.0, leadTimeDays: 2,
    preferredVendorId: 'V-002', preferredVendorName: 'Sunshine Produce Co.',
    vendorProductCode: 'SPC-BUN-BRI', unitCost: 6.20,
    lots: [
      { lotId: 'LOT-BUN-1', qty: 50, qcHold: false, expiry: '2026-05-28' },
      { lotId: 'LOT-BUN-2', qty: 60, qcHold: false, expiry: '2026-06-04' },
    ],
    specs: { origin:'New Orleans Bakehouse', allergens:'Wheat, Eggs, Dairy', shelfLife:'5 days', storage:'Ambient', description:'Buttery brioche burger buns. 12 per pack.' },
    locationStock: { 'LOC-A': { physical: 67, allocated: 15 }, 'LOC-B': { physical: 28, allocated: 7 }, 'LOC-C': { physical: 15, allocated: 3 } },
  },
  {
    id: 5,
    sku:           'DAI-MILK-02',
    name:          'Whole Milk 1 Gal',
    basePrice:     4.50,     price: 4.50,     costBasis: 3.20,
    physicalStock: 260,      allocatedStock: 60,
    uom:           'unit',   category: 'dairy', barcode: '004455667788',
    isCatchWeight: false,
    reorderPoint:  180,  reorderQty: 300, avgDailyUsage: 14.0, leadTimeDays: 2,
    preferredVendorId: 'V-003', preferredVendorName: 'Dairy Fresh Distributors',
    vendorProductCode: 'DFD-MLK-WHL', unitCost: 18.00,
    lots: [
      { lotId: 'LOT-MLK-1', qty: 120, qcHold: false, expiry: '2026-06-05' },
      { lotId: 'LOT-MLK-2', qty: 140, qcHold: false, expiry: '2026-06-12' },
    ],
    specs: { origin:'Louisiana Dairy Farm Co-op', allergens:'Milk', shelfLife:'14 days', storage:'38–40°F', description:'Whole milk, grade A pasteurized. 1 gallon jugs.' },
    locationStock: { 'LOC-A': { physical: 158, allocated: 37 }, 'LOC-B': { physical: 64, allocated: 16 }, 'LOC-C': { physical: 38, allocated: 7 } },
  },

  // ── HEALTHY: available > 150% of reorderPoint ─────────────────────────────
  {
    id: 3,
    sku:           'FRZ-BEEF-01',
    name:          'Premium Ground Beef 80/20',
    basePrice:     85.50,    price: 85.50,    costBasis: 68.00,
    physicalStock: 150,      allocatedStock: 40,
    uom:           'case',   category: 'meat', barcode: '001122334455',
    // ── Catch-weight metadata (used by Pack & Weigh + Invoice Builder) ──
    // Cases ship by actual weight: nominal 10 lb/case, billed at $8.55/lb.
    // basePrice ($85.50) = pricePerLb × avgWeightPerCase (sanity: 8.55 × 10 = 85.50).
    isCatchWeight:    true,
    pricePerLb:       8.55,
    avgWeightPerCase: 10.0,
    weightVariancePct: 8,
    reorderPoint:  30,   reorderQty: 60,  avgDailyUsage: 3.2, leadTimeDays: 3,
    preferredVendorId: 'V-001', preferredVendorName: 'Gulf Coast Proteins',
    vendorProductCode: 'GCP-BEEF-8020', unitCost: 85.50,
    lots: [
      { lotId: 'LOT-A', qty: 60,  qcHold: false, expiry: '2026-06-15' },
      { lotId: 'LOT-B', qty: 50,  qcHold: false, expiry: '2026-06-20' },
    ],
    specs: { origin:'Omaha, NE (Farm Assured)', allergens:'None', shelfLife:'6 months (Frozen)', storage:'0°F or below', description:'Premium 80/20 ground beef, perfect for signature burgers.' },
    locationStock: { 'LOC-A': { physical: 90, allocated: 25 }, 'LOC-B': { physical: 40, allocated: 11 }, 'LOC-C': { physical: 20, allocated: 4 } },
  },
  {
    id: 112,
    sku:           'PLT-CHICK-05',
    name:          'Jumbo Chicken Breasts',
    basePrice:     42.00,    price: 42.00,    costBasis: 32.00,
    physicalStock: 200,      allocatedStock: 60,
    uom:           'case',   category: 'poultry', barcode: '009988776655',
    // ── Catch-weight metadata ──
    // Nominal 7 lb/case, billed at $6.00/lb (basePrice $42 = 6.00 × 7.0).
    isCatchWeight:    true,
    pricePerLb:       6.00,
    avgWeightPerCase: 7.0,
    weightVariancePct: 6,
    reorderPoint:  50,   reorderQty: 100, avgDailyUsage: 4.8, leadTimeDays: 3,
    preferredVendorId: 'V-001', preferredVendorName: 'Gulf Coast Proteins',
    vendorProductCode: 'GCP-CHK-BNL', unitCost: 28.75,
    lots: [
      { lotId: 'LOT-CH-1', qty: 80,  qcHold: false, expiry: '2026-07-01' },
      { lotId: 'LOT-CH-2', qty: 120, qcHold: false, expiry: '2026-07-15' },
    ],
    specs: { origin:'Georgia Farms (USDA Grade A)', allergens:'None', shelfLife:'12 months (Frozen)', storage:'0°F or below', description:'Boneless, skinless jumbo chicken breasts. IQF packed.' },
    locationStock: { 'LOC-A': { physical: 120, allocated: 37 }, 'LOC-B': { physical: 50, allocated: 16 }, 'LOC-C': { physical: 30, allocated: 7 } },
  },
];

export const INVENTORY_BY_SKU = Object.fromEntries(MOCK_INVENTORY.map(i => [i.sku, i]));
export const INVENTORY_BY_ID  = Object.fromEntries(MOCK_INVENTORY.map(i => [i.id,  i]));
