import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { InvoiceDB, ProductDB, getNextInvoiceNo } from '../utils/db';
import { calcItemTotals, calcTotals, numberToWords, formatCurrency, isMaharashtra } from '../utils/helpers';

const UNITS = ['Nos','Job','Ltr','Kg','Mtr','Sq.Mtr','Set','Pair','Box','Pack'];

const INDIAN_STATES = [
  'Maharashtra','Delhi','Gujarat','Rajasthan','Uttar Pradesh','Madhya Pradesh',
  'Tamil Nadu','Karnataka','West Bengal','Andhra Pradesh','Telangana','Kerala',
  'Bihar','Punjab','Haryana','Odisha','Assam','Jharkhand','Uttarakhand',
  'Himachal Pradesh','Chhattisgarh','Goa','Tripura','Meghalaya','Manipur',
  'Nagaland','Arunachal Pradesh','Mizoram','Sikkim','Jammu & Kashmir','Ladakh',
  'Chandigarh','Puducherry','Dadra & Nagar Haveli','Daman & Diu','Lakshadweep',
  'Andaman & Nicobar Islands',
];

const emptyItem = () => ({
  id: Date.now() + Math.random(),
  srNo: 1, description: '', hsnCode: '',
  qty: '', unit: 'Nos', rate: '',
  cgstRate: 9, sgstRate: 9,
  taxableAmount: 0, cgst: 0, sgst: 0, igst: 0, totalAmount: 0,
});

export default function InvoiceForm({ company, onCreated, onBack }) {
  const isKisan = company === 'kisan';
  const clr     = isKisan ? 'kisan' : 'micro';

  const [invoiceNo,   setInvoiceNo]   = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [products,    setProducts]    = useState([]);
  const [items,       setItems]       = useState([emptyItem()]);
  const [totals,      setTotals]      = useState({ taxableTotal:0, cgstTotal:0, sgstTotal:0, igstTotal:0, totalAmount:0 });
  const [loading,     setLoading]     = useState(false);

  const [form, setForm] = useState({
    customerName:'', customerAddress:'', customerState:'Maharashtra', customerGSTIN:'',
    gstNumber:'', panNo:'', projectName:'', poNo:'', poDate:'',
    advancePaid:'', paymentMode:'Pending',
  });
  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // ── Derived: is this intra-state (Maharashtra) or inter-state? ──
  const igstMode = !isMaharashtra(form.customerState);
  const cgstRate = (items[0]?.cgstRate || 9);
  const sgstRate = (items[0]?.sgstRate || 9);
  const igstRate = cgstRate + sgstRate;

  // ── Reset on company switch ──────────────────────────────────
  useEffect(() => {
    setInvoiceNo(getNextInvoiceNo(company));
    setProducts(ProductDB.getAll(company));
    setForm({ customerName:'', customerAddress:'', customerState:'Maharashtra', customerGSTIN:'', gstNumber:'', panNo:'', projectName:'', poNo:'', poDate:'', advancePaid:'', paymentMode:'Pending' });
    setItems([emptyItem()]);
    setTotals({ taxableTotal:0, cgstTotal:0, sgstTotal:0, igstTotal:0, totalAmount:0 });
  }, [company]);

  // ── Recalc whenever items OR igstMode changes ────────────────
  const recalc = useCallback((updatedItems, mode) => {
    const r = updatedItems.map((it, idx) => ({
      ...calcItemTotals(it, mode),
      srNo: idx + 1,
    }));
    setItems(r);
    setTotals(calcTotals(r));
  }, []);

  // Recalc when state changes (igstMode flips)
  // We intentionally only re-run when customerState changes, not on every items change
  const customerState = form.customerState;
  useEffect(() => {
    recalc(items, !isMaharashtra(customerState));
  }, [customerState]); // eslint-disable-line

  const updateItem = (id, field, value) =>
    recalc(items.map(it => it.id === id ? { ...it, [field]: value } : it), igstMode);

  const addItem    = () => recalc([...items, { ...emptyItem(), id: Date.now() }], igstMode);
  const removeItem = (id) => { if (items.length === 1) return; recalc(items.filter(it => it.id !== id), igstMode); };

  const fillFromProduct = (id, productId) => {
    const prod = products.find(p => p._id === productId);
    if (!prod) return;
    recalc(items.map(it => it.id === id ? {
      ...it,
      description: prod.description || prod.name,
      hsnCode:     prod.hsnCode || '',
      unit:        prod.unit || 'Nos',
      rate:        '',          // ← NEVER auto-fill rate; admin must enter manually
      cgstRate:    prod.cgstRate || 9,
      sgstRate:    prod.sgstRate || 9,
      // reset calculated fields to zero since rate is blank
      taxableAmount: 0, cgst: 0, sgst: 0, igst: 0, totalAmount: 0,
    } : it), igstMode);
  };

  // ── Submit ───────────────────────────────────────────────────
  const handleSubmit = () => {
    if (!form.customerName.trim())                              return toast.error('Customer name is required');
    if (!form.customerState.trim())                            return toast.error('Customer state is required');
    if (items.some(it => !it.description || !it.qty || !it.rate)) return toast.error('Fill all item fields (description, qty, rate)');

    setLoading(true);
    try {
      const advance = parseFloat(form.advancePaid) || 0;
      const invoice = InvoiceDB.create({
        company, invoiceDate,
        customerName:    form.customerName,
        customerAddress: form.customerAddress,
        customerState:   form.customerState,
        customerGSTIN:   form.customerGSTIN,
        gstNumber:       form.gstNumber,
        panNo:           form.panNo,
        projectName:     form.projectName,
        poNo:            form.poNo,
        poDate:          form.poDate || null,
        igstMode,                           // ← stored for PDF rendering
        items: items.map(({ id, ...rest }) => rest),
        ...totals,
        amountInWords:   numberToWords(totals.totalAmount),
        advancePaid:     advance,
        remainingAmount: totals.totalAmount - advance,
        paymentMode:     form.paymentMode,
        paymentStatus:   (totals.totalAmount - advance) <= 0 ? 'Paid' : advance > 0 ? 'Partial' : 'Pending',
        paymentDate:     form.paymentMode !== 'Pending' ? new Date().toISOString() : null,
        paymentTime:     form.paymentMode !== 'Pending' ? new Date().toLocaleTimeString('en-IN') : '',
      });
      toast.success('Invoice created!');
      onCreated(invoice);
    } catch (err) {
      toast.error('Failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const advance   = parseFloat(form.advancePaid) || 0;
  const remaining = totals.totalAmount - advance;

  return (
    <div className="fade-in">
      {/* ── Page Header ── */}
      <div className="page-header">
        <div className="page-title">
          <h2>{isKisan ? '🌾 Kisan Bharti Agro Tech' : '🔬 Microbact Biocultures'}</h2>
          <p>New Tax Invoice · <strong style={{ color:'var(--accent-gold)' }}>{invoiceNo}</strong></p>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <button className="btn btn-outline" onClick={onBack}>← Back</button>
          <button className={`btn btn-${clr} btn-lg`} onClick={handleSubmit} disabled={loading}>
            {loading ? '⏳ Saving...' : '✅ Generate Bill'}
          </button>
        </div>
      </div>

      {/* ── Tax Mode Indicator ── */}
      <div style={{
        display:'flex', alignItems:'center', gap:10, marginBottom:16,
        padding:'10px 16px', borderRadius:10,
        background: igstMode ? 'rgba(59,130,246,0.08)' : 'rgba(34,197,94,0.08)',
        border: `1px solid ${igstMode ? 'rgba(59,130,246,0.3)' : 'rgba(34,197,94,0.3)'}`,
      }}>
        <span style={{ fontSize:18 }}>{igstMode ? '🔵' : '🟢'}</span>
        <div>
          <span style={{ fontWeight:700, fontSize:13, color: igstMode ? '#60a5fa' : '#4ade80' }}>
            {igstMode
              ? `Inter-State Sale → IGST ${igstRate}% will apply`
              : `Intra-State Sale (Maharashtra) → CGST ${cgstRate}% + SGST ${sgstRate}% will apply`}
          </span>
          <span style={{ fontSize:11, color:'var(--text-muted)', marginLeft:8 }}>
            (based on customer state)
          </span>
        </div>
      </div>

      {/* ── Invoice Details ── */}
      <div className="card" style={{ marginBottom:20 }}>
        <div className="section-title">Invoice Details</div>
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Invoice No</label>
            <input className="form-input" value={invoiceNo} readOnly style={{ opacity:0.7 }} />
          </div>
          <div className="form-group">
            <label className="form-label">Invoice Date</label>
            <input type="date" className="form-input" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Seller GST Number</label>
            <input className="form-input" placeholder="27XXXXX..." value={form.gstNumber} onChange={e => setF('gstNumber', e.target.value)} />
          </div>
        </div>
      </div>

      {/* ── Customer Details ── */}
      <div className="card" style={{ marginBottom:20 }}>
        <div className="section-title">Customer Details</div>
        <div className="form-grid">
          <div className="form-group" style={{ gridColumn:'span 2' }}>
            <label className="form-label">Customer Name *</label>
            <input className="form-input" placeholder="Customer / company name" value={form.customerName} onChange={e => setF('customerName', e.target.value)} />
          </div>
          <div className="form-group" style={{ gridColumn:'span 2' }}>
            <label className="form-label">Address</label>
            <input className="form-input" placeholder="Full address" value={form.customerAddress} onChange={e => setF('customerAddress', e.target.value)} />
          </div>

          {/* ── STATE SELECTOR — drives CGST/SGST vs IGST ── */}
          <div className="form-group">
            <label className="form-label" style={{ color: igstMode ? '#60a5fa' : '#4ade80' }}>
              Customer State * {igstMode ? '→ IGST applies' : '→ CGST+SGST applies'}
            </label>
            <select
              className="form-select"
              value={form.customerState}
              onChange={e => setF('customerState', e.target.value)}
              style={{ borderColor: igstMode ? 'rgba(59,130,246,0.5)' : 'rgba(34,197,94,0.5)' }}
            >
              {INDIAN_STATES.map(s => (
                <option key={s} value={s}>{s}{s === 'Maharashtra' ? ' (Intra-State)' : ''}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Customer GSTIN</label>
            <input className="form-input" placeholder="GSTIN / Tax No" value={form.customerGSTIN} onChange={e => setF('customerGSTIN', e.target.value)} />
          </div>

          <div className="form-group"><label className="form-label">PAN No</label><input className="form-input" placeholder="PAN" value={form.panNo} onChange={e => setF('panNo', e.target.value)} /></div>
          <div className="form-group"><label className="form-label">Project Name</label><input className="form-input" placeholder="Project / Site" value={form.projectName} onChange={e => setF('projectName', e.target.value)} /></div>
          <div className="form-group"><label className="form-label">PO Number</label><input className="form-input" placeholder="PO No" value={form.poNo} onChange={e => setF('poNo', e.target.value)} /></div>
          <div className="form-group"><label className="form-label">PO Date</label><input type="date" className="form-input" value={form.poDate} onChange={e => setF('poDate', e.target.value)} /></div>
        </div>
      </div>

      {/* ── Items Table ── */}
      <div className="card" style={{ marginBottom:20 }}>
        <div className="section-title" style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span>Items</span>
          <span style={{
            fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:20,
            background: igstMode ? 'rgba(59,130,246,0.15)' : 'rgba(34,197,94,0.15)',
            color:      igstMode ? '#60a5fa' : '#4ade80',
            border:     `1px solid ${igstMode ? 'rgba(59,130,246,0.3)' : 'rgba(34,197,94,0.3)'}`,
          }}>
            {igstMode ? `IGST MODE (${igstRate}%)` : `CGST+SGST MODE (${cgstRate}%+${sgstRate}%)`}
          </span>
        </div>

        <div className="items-table-wrapper">
          <table>
            <thead>
              <tr>
                <th style={{ width:36 }}>#</th>
                <th style={{ minWidth:130 }}>Quick Select</th>
                <th style={{ minWidth:170 }}>Description</th>
                <th style={{ width:76 }}>HSN</th>
                <th style={{ width:60 }}>Qty</th>
                <th style={{ width:72 }}>Unit</th>
                <th style={{ width:90 }}>Rate (₹)</th>
                <th style={{ width:90 }}>Taxable</th>
                {!igstMode && <th style={{ width:76 }}>CGST {cgstRate}%</th>}
                {!igstMode && <th style={{ width:76 }}>SGST {sgstRate}%</th>}
                {igstMode  && <th style={{ width:90, color:'#60a5fa' }}>IGST {igstRate}%</th>}
                <th style={{ width:96 }}>Total</th>
                <th style={{ width:32 }}></th>
              </tr>
            </thead>

            <tbody>
              {items.map(item => (
                <tr key={item.id}>
                  <td style={{ color:'var(--text-muted)', fontWeight:600 }}>{item.srNo}</td>
                  <td>
                    <select className="form-select" style={{ fontSize:12, padding:'6px 8px' }} value="" onChange={e => fillFromProduct(item.id, e.target.value)}>
                      <option value="">Pick...</option>
                      {products.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                    </select>
                  </td>
                  <td><input className="form-input" style={{ fontSize:12, padding:'6px 8px' }} placeholder="Description" value={item.description} onChange={e => updateItem(item.id,'description',e.target.value)} /></td>
                  <td><input className="form-input" style={{ fontSize:12, padding:'6px 8px' }} placeholder="HSN" value={item.hsnCode} onChange={e => updateItem(item.id,'hsnCode',e.target.value)} /></td>
                  <td><input type="number" className="form-input" style={{ fontSize:12, padding:'6px 8px' }} placeholder="0" value={item.qty} onChange={e => updateItem(item.id,'qty',e.target.value)} /></td>
                  <td>
                    <select className="form-select" style={{ fontSize:12, padding:'6px 8px' }} value={item.unit} onChange={e => updateItem(item.id,'unit',e.target.value)}>
                      {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </td>
                  <td><input type="number" className="form-input" style={{ fontSize:12, padding:'6px 8px' }} placeholder="0.00" value={item.rate} onChange={e => updateItem(item.id,'rate',e.target.value)} /></td>
                  <td style={{ fontWeight:600, color:'var(--text-secondary)', fontSize:13 }}>{formatCurrency(item.taxableAmount)}</td>
                  {!igstMode && <td style={{ fontWeight:600, color:'var(--accent-gold)', fontSize:13 }}>{formatCurrency(item.cgst)}</td>}
                  {!igstMode && <td style={{ fontWeight:600, color:'var(--accent-gold)', fontSize:13 }}>{formatCurrency(item.sgst)}</td>}
                  {igstMode  && <td style={{ fontWeight:600, color:'#60a5fa', fontSize:13 }}>{formatCurrency(item.igst)}</td>}
                  <td style={{ fontWeight:700, color:'var(--text-primary)', fontSize:13 }}>{formatCurrency(item.totalAmount)}</td>
                  <td><button onClick={() => removeItem(item.id)} style={{ background:'none', border:'none', color:'var(--accent-red)', cursor:'pointer', fontSize:18, padding:4 }}>×</button></td>
                </tr>
              ))}
            </tbody>

            <tfoot>
              <tr>
                <td colSpan={7} style={{ textAlign:'right', color:'var(--text-muted)' }}>Totals →</td>
                <td style={{ color:'var(--text-primary)', fontWeight:700 }}>{formatCurrency(totals.taxableTotal)}</td>
                {!igstMode && <td style={{ color:'var(--accent-gold)', fontWeight:700 }}>{formatCurrency(totals.cgstTotal)}</td>}
                {!igstMode && <td style={{ color:'var(--accent-gold)', fontWeight:700 }}>{formatCurrency(totals.sgstTotal)}</td>}
                {igstMode  && <td style={{ color:'#60a5fa', fontWeight:700 }}>{formatCurrency(totals.igstTotal)}</td>}
                <td style={{ color:'#4ade80', fontWeight:800 }}>{formatCurrency(totals.totalAmount)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>

          <div className="add-item-row">
            <button className="btn btn-outline btn-sm" onClick={addItem}>+ Add Item</button>
          </div>
        </div>

        {/* Amount in words */}
        <div style={{ marginTop:14, padding:'12px 16px', background:'rgba(245,158,11,0.08)', borderRadius:10, border:'1px solid rgba(245,158,11,0.2)' }}>
          <span style={{ fontSize:12, color:'var(--text-muted)', fontWeight:600 }}>IN WORDS: </span>
          <span style={{ fontSize:13, color:'var(--accent-gold)', fontStyle:'italic' }}>{numberToWords(totals.totalAmount)}</span>
        </div>
      </div>

      {/* ── Payment Details ── */}
      <div className="card" style={{ marginBottom:28 }}>
        <div className="section-title">Payment Details</div>
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Advance / Paid Amount (₹)</label>
            <input type="number" className="form-input" placeholder="0" value={form.advancePaid} onChange={e => setF('advancePaid', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Payment Mode</label>
            <select className="form-select" value={form.paymentMode} onChange={e => setF('paymentMode', e.target.value)}>
              {['Pending','Cash','Online','Cheque'].map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Remaining</label>
            <div className="form-input" style={{ color: remaining > 0 ? '#fbbf24' : '#4ade80', fontWeight:700, cursor:'default' }}>
              {formatCurrency(remaining < 0 ? 0 : remaining)}
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom Summary Bar ── */}
      <div style={{ display:'flex', gap:16, flexWrap:'wrap', alignItems:'center', justifyContent:'flex-end', background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:14, padding:'20px 24px', marginBottom:24 }}>
        <div style={{ flex:1, minWidth:180 }}>
          <div style={{ fontSize:12, color:'var(--text-muted)', marginBottom:4 }}>NET BILL AMOUNT</div>
          <div style={{ fontSize:32, fontWeight:800, fontFamily:"'Playfair Display', serif", color:'#4ade80' }}>{formatCurrency(totals.totalAmount)}</div>
        </div>
        <div style={{ display:'flex', gap:20, flexWrap:'wrap' }}>
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:11, color:'var(--text-muted)', textTransform:'uppercase', marginBottom:2 }}>Taxable</div>
            <div style={{ fontSize:16, fontWeight:700, color:'var(--text-secondary)' }}>{formatCurrency(totals.taxableTotal)}</div>
          </div>
          {!igstMode && <>
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:11, color:'var(--text-muted)', textTransform:'uppercase', marginBottom:2 }}>CGST {cgstRate}%</div>
              <div style={{ fontSize:16, fontWeight:700, color:'var(--accent-gold)' }}>{formatCurrency(totals.cgstTotal)}</div>
            </div>
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:11, color:'var(--text-muted)', textTransform:'uppercase', marginBottom:2 }}>SGST {sgstRate}%</div>
              <div style={{ fontSize:16, fontWeight:700, color:'var(--accent-gold)' }}>{formatCurrency(totals.sgstTotal)}</div>
            </div>
          </>}
          {igstMode && (
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:11, color:'var(--text-muted)', textTransform:'uppercase', marginBottom:2 }}>IGST {igstRate}%</div>
              <div style={{ fontSize:16, fontWeight:700, color:'#60a5fa' }}>{formatCurrency(totals.igstTotal)}</div>
            </div>
          )}
        </div>
        <button className={`btn btn-${clr} btn-xl`} onClick={handleSubmit} disabled={loading}>
          {loading ? '⏳ Saving...' : '✅ Generate Invoice'}
        </button>
      </div>
    </div>
  );
}
