export function formatCurrency(n) {
  if (!n && n !== 0) return '₹0.00';
  return '₹' + parseFloat(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatDate(d) {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

// Returns true when the customer is in Maharashtra (intra-state → CGST + SGST)
// Returns false for any other state (inter-state → IGST only)
export function isMaharashtra(state) {
  if (!state) return true; // default to intra-state when no state entered
  const s = state.trim().toLowerCase();
  return s === 'maharashtra' || s === 'mh';
}

// igstMode = true  → only IGST column (inter-state)
// igstMode = false → CGST + SGST columns (intra-state / Maharashtra)
export function calcItemTotals(item, igstMode = false) {
  const qty          = parseFloat(item.qty)      || 0;
  const rate         = parseFloat(item.rate)     || 0;
  const taxableAmount = parseFloat((qty * rate).toFixed(2));
  const cgstRate     = parseFloat(item.cgstRate) || 9;
  const sgstRate     = parseFloat(item.sgstRate) || 9;

  let cgst = 0, sgst = 0, igst = 0;

  if (igstMode) {
    // IGST = CGST rate + SGST rate applied on taxable amount
    const igstRate = cgstRate + sgstRate;          // e.g. 9+9 = 18
    igst = parseFloat(((taxableAmount * igstRate) / 100).toFixed(2));
  } else {
    cgst = parseFloat(((taxableAmount * cgstRate) / 100).toFixed(2));
    sgst = parseFloat(((taxableAmount * sgstRate) / 100).toFixed(2));
  }

  const totalAmount = parseFloat((taxableAmount + cgst + sgst + igst).toFixed(2));
  return { ...item, taxableAmount, cgst, sgst, igst, totalAmount };
}

export function calcTotals(items) {
  const taxableTotal = parseFloat(items.reduce((s, i) => s + (i.taxableAmount || 0), 0).toFixed(2));
  const cgstTotal    = parseFloat(items.reduce((s, i) => s + (i.cgst  || 0), 0).toFixed(2));
  const sgstTotal    = parseFloat(items.reduce((s, i) => s + (i.sgst  || 0), 0).toFixed(2));
  const igstTotal    = parseFloat(items.reduce((s, i) => s + (i.igst  || 0), 0).toFixed(2));
  const totalAmount  = parseFloat(items.reduce((s, i) => s + (i.totalAmount || 0), 0).toFixed(2));
  return { taxableTotal, cgstTotal, sgstTotal, igstTotal, totalAmount };
}

const ones = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
const tens = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];

function convert(n) {
  if (n < 20) return ones[n];
  if (n < 100) return tens[Math.floor(n/10)] + (n%10 ? ' '+ones[n%10] : '');
  if (n < 1000) return ones[Math.floor(n/100)]+' Hundred'+(n%100 ? ' '+convert(n%100) : '');
  if (n < 100000) return convert(Math.floor(n/1000))+' Thousand'+(n%1000 ? ' '+convert(n%1000) : '');
  if (n < 10000000) return convert(Math.floor(n/100000))+' Lakh'+(n%100000 ? ' '+convert(n%100000) : '');
  return convert(Math.floor(n/10000000))+' Crore'+(n%10000000 ? ' '+convert(n%10000000) : '');
}

export function numberToWords(amount) {
  if (!amount || isNaN(amount)) return 'Zero Rupees Only';
  const rupees = Math.floor(amount);
  const paise = Math.round((amount - rupees) * 100);
  return convert(rupees)+' Rupees'+(paise > 0 ? ' and '+convert(paise)+' Paise' : '')+' Only';
}
