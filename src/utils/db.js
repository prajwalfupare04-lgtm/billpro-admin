// ============================================================
// LOCAL STORAGE DATABASE — No backend, no MongoDB required
// All data stored in browser localStorage
// ============================================================

const KEYS = {
  INVOICES: 'billpro_invoices',
  PRODUCTS: 'billpro_products',
  COUNTERS: 'billpro_counters',
};

// ── helpers ──────────────────────────────────────────────────
const uid = () => '_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);

function load(key) {
  try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; }
}
function save(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}
function loadObj(key, def = {}) {
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(def)); } catch { return def; }
}

// ── INVOICE NUMBERING ────────────────────────────────────────
export function getNextInvoiceNo(company) {
  const now = new Date();
  const month = now.toLocaleString('en-US', { month: 'long' }).toUpperCase();
  const year = now.getFullYear();
  const key = `${company}_${month}_${year}`;

  const counters = loadObj(KEYS.COUNTERS, {});
  const next = (counters[key] || 0) + 1;
  // Don't increment yet — only do that on actual save
  return `${month}-${year}-${String(next).padStart(3, '0')}`;
}

function incrementCounter(company) {
  const now = new Date();
  const month = now.toLocaleString('en-US', { month: 'long' }).toUpperCase();
  const year = now.getFullYear();
  const key = `${company}_${month}_${year}`;
  const counters = loadObj(KEYS.COUNTERS, {});
  counters[key] = (counters[key] || 0) + 1;
  localStorage.setItem(KEYS.COUNTERS, JSON.stringify(counters));
  return String(counters[key]).padStart(3, '0');
}

// ── INVOICES ─────────────────────────────────────────────────
export const InvoiceDB = {
  getAll(filters = {}) {
    let data = load(KEYS.INVOICES);
    if (filters.company) data = data.filter(i => i.company === filters.company);
    if (filters.status)  data = data.filter(i => i.paymentStatus === filters.status);
    if (filters.search) {
      const s = filters.search.toLowerCase();
      data = data.filter(i =>
        i.customerName?.toLowerCase().includes(s) ||
        i.invoiceNo?.toLowerCase().includes(s)
      );
    }
    return data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  getById(id) {
    return load(KEYS.INVOICES).find(i => i._id === id) || null;
  },

  create(data) {
    const now = new Date();
    const month = now.toLocaleString('en-US', { month: 'long' }).toUpperCase();
    const year = now.getFullYear();
    const seq = incrementCounter(data.company);
    const invoiceNo = `${month}-${year}-${seq}`;

    const invoice = {
      ...data,
      _id: uid(),
      invoiceNo,
      createdAt: now.toISOString(),
      invoiceDate: data.invoiceDate || now.toISOString(),
    };

    const all = load(KEYS.INVOICES);
    all.push(invoice);
    save(KEYS.INVOICES, all);
    return invoice;
  },

  updatePayment(id, paymentData) {
    const all = load(KEYS.INVOICES);
    const idx = all.findIndex(i => i._id === id);
    if (idx === -1) return null;
    const inv = all[idx];
    inv.advancePaid = paymentData.advancePaid;
    inv.remainingAmount = inv.totalAmount - paymentData.advancePaid;
    inv.paymentMode = paymentData.paymentMode;
    inv.paymentDate = paymentData.paymentDate;
    inv.paymentTime = paymentData.paymentTime;
    inv.paymentStatus = inv.remainingAmount <= 0 ? 'Paid' : paymentData.advancePaid > 0 ? 'Partial' : 'Pending';
    all[idx] = inv;
    save(KEYS.INVOICES, all);
    return inv;
  },

  delete(id) {
    const all = load(KEYS.INVOICES).filter(i => i._id !== id);
    save(KEYS.INVOICES, all);
  },

  getDashboardStats() {
    const all = load(KEYS.INVOICES);
    const now = new Date();
    const todayStr = now.toDateString();

    const todayInv = all.filter(i => new Date(i.createdAt).toDateString() === todayStr);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthInv = all.filter(i => new Date(i.invoiceDate) >= monthStart);
    const pending = all.filter(i => i.paymentStatus === 'Pending' || i.paymentStatus === 'Partial');
    const paid = all.filter(i => i.paymentStatus === 'Paid');

    // last 6 months chart
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      const inv = all.filter(inv => {
        const dt = new Date(inv.invoiceDate);
        return dt >= d && dt <= end;
      });
      monthlyData.push({
        month: d.toLocaleString('en-US', { month: 'short', year: '2-digit' }),
        revenue: inv.reduce((s, x) => s + (x.totalAmount || 0), 0),
        count: inv.length,
      });
    }

    const kisanInv = all.filter(i => i.company === 'kisan');
    const microInv = all.filter(i => i.company === 'microbact');

    return {
      today: { count: todayInv.length, revenue: todayInv.reduce((s, i) => s + (i.totalAmount || 0), 0) },
      month: { count: monthInv.length, revenue: monthInv.reduce((s, i) => s + (i.totalAmount || 0), 0) },
      pending: { count: pending.length, amount: pending.reduce((s, i) => s + (i.remainingAmount || 0), 0) },
      paid: { count: paid.length },
      total: { count: all.length, revenue: all.reduce((s, i) => s + (i.totalAmount || 0), 0) },
      monthlyData,
      companySplit: {
        kisan: { count: kisanInv.length, revenue: kisanInv.reduce((s, i) => s + (i.totalAmount || 0), 0) },
        microbact: { count: microInv.length, revenue: microInv.reduce((s, i) => s + (i.totalAmount || 0), 0) },
      },
    };
  },
};

// ── PRODUCTS ─────────────────────────────────────────────────
const DEFAULT_PRODUCTS = [
  { company: 'kisan', name: 'Labour Charges (Annual Maintenance)', description: 'Labour Charges for 1 year maintenance', hsnCode: '998521', unit: 'Job', rate: 50000, cgstRate: 9, sgstRate: 9 },
  { company: 'kisan', name: 'Plants (Re-planted)', description: 'Plants Re planted', hsnCode: '0602', unit: 'Nos', rate: 150, cgstRate: 9, sgstRate: 9 },
  { company: 'kisan', name: 'Bio Products', description: 'Bio Products', hsnCode: '3101', unit: 'Ltr', rate: 800, cgstRate: 9, sgstRate: 9 },
  { company: 'kisan', name: 'Fertilizers', description: 'Chemical Fertilizers', hsnCode: '3105', unit: 'Kg', rate: 500, cgstRate: 9, sgstRate: 9 },
  { company: 'kisan', name: 'Pesticides', description: 'Pesticides & Herbicides', hsnCode: '3808', unit: 'Ltr', rate: 1200, cgstRate: 9, sgstRate: 9 },
  { company: 'microbact', name: 'STP Culture S-9', description: 'STP Culture S-9', hsnCode: '3101', unit: 'Ltr', rate: 2500, cgstRate: 9, sgstRate: 9 },
  { company: 'microbact', name: 'ETP Culture E-7', description: 'ETP Culture E-7', hsnCode: '3101', unit: 'Ltr', rate: 3000, cgstRate: 9, sgstRate: 9 },
  { company: 'microbact', name: 'Bioremediation Culture', description: 'Bioremediation Culture', hsnCode: '3101', unit: 'Kg', rate: 1800, cgstRate: 9, sgstRate: 9 },
  { company: 'microbact', name: 'Compost Culture', description: 'Compost Culture', hsnCode: '3101', unit: 'Kg', rate: 1200, cgstRate: 9, sgstRate: 9 },
  { company: 'microbact', name: 'Consortium Culture', description: 'Microbial Consortium Culture', hsnCode: '3101', unit: 'Ltr', rate: 2200, cgstRate: 9, sgstRate: 9 },
];

export const ProductDB = {
  getAll(company) {
    let data = load(KEYS.PRODUCTS);
    if (data.length === 0) {
      // auto-seed on first load
      data = DEFAULT_PRODUCTS.map(p => ({ ...p, _id: uid(), isActive: true, createdAt: new Date().toISOString() }));
      save(KEYS.PRODUCTS, data);
    }
    if (company) data = data.filter(p => p.company === company);
    return data.filter(p => p.isActive !== false).sort((a, b) => a.name.localeCompare(b.name));
  },

  getAllAdmin(company) {
    let data = load(KEYS.PRODUCTS);
    if (data.length === 0) {
      data = DEFAULT_PRODUCTS.map(p => ({ ...p, _id: uid(), isActive: true, createdAt: new Date().toISOString() }));
      save(KEYS.PRODUCTS, data);
    }
    if (company) data = data.filter(p => p.company === company);
    return data.sort((a, b) => a.name.localeCompare(b.name));
  },

  create(data) {
    const all = load(KEYS.PRODUCTS);
    const product = { ...data, _id: uid(), isActive: true, createdAt: new Date().toISOString() };
    all.push(product);
    save(KEYS.PRODUCTS, all);
    return product;
  },

  update(id, data) {
    const all = load(KEYS.PRODUCTS);
    const idx = all.findIndex(p => p._id === id);
    if (idx === -1) return null;
    all[idx] = { ...all[idx], ...data, updatedAt: new Date().toISOString() };
    save(KEYS.PRODUCTS, all);
    return all[idx];
  },

  delete(id) {
    const all = load(KEYS.PRODUCTS);
    const idx = all.findIndex(p => p._id === id);
    if (idx === -1) return;
    all[idx].isActive = false;
    save(KEYS.PRODUCTS, all);
  },

  seedDefaults() {
    const existing = load(KEYS.PRODUCTS);
    let added = 0;
    for (const p of DEFAULT_PRODUCTS) {
      if (!existing.find(e => e.name === p.name && e.company === p.company)) {
        existing.push({ ...p, _id: uid(), isActive: true, createdAt: new Date().toISOString() });
        added++;
      }
    }
    save(KEYS.PRODUCTS, existing);
    return added;
  },
};

// ── EXCEL EXPORT (client-side using CSV) ─────────────────────
export function exportToCSV(company, label) {
  const invoices = InvoiceDB.getAll({ company });
  const headers = ['Invoice No','Customer Name','Invoice Date','Company','Taxable Amount','CGST','SGST','Total Bill','Advance Paid','Remaining','Payment Mode','Payment Status','Payment Date'];

  const rows = invoices.map(inv => [
    inv.invoiceNo,
    inv.customerName,
    new Date(inv.invoiceDate).toLocaleDateString('en-IN'),
    inv.company === 'kisan' ? 'Kisan Bharti' : 'Microbact',
    inv.taxableTotal || 0,
    inv.cgstTotal || 0,
    inv.sgstTotal || 0,
    inv.totalAmount || 0,
    inv.advancePaid || 0,
    inv.remainingAmount || 0,
    inv.paymentMode || '',
    inv.paymentStatus || '',
    inv.paymentDate ? new Date(inv.paymentDate).toLocaleDateString('en-IN') : '',
  ]);

  const csvContent = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Invoices_${label || 'All'}_${new Date().toLocaleDateString('en-IN').replace(/\//g, '-')}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
