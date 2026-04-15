import React from 'react';
import { generateAndDownloadPDF } from '../utils/pdfGenerator';
import { formatCurrency, formatDate } from '../utils/helpers';
import signatureImg   from '../assets/signature_b64';
import microbactLogo  from '../assets/microbact_logo_b64';
import kisanLogo      from '../assets/kisan_logo_b64';

// ── Company colours ──────────────────────────────────────────
//   Kisan Bharti  → dark green  #1a6b3a  /  light blue  #e8f4fd
//   Microbact     → light blue  #1a6ea8  /  dark green  #1a6b3a
const THEME = {
  kisan: {
    primary:      '#1a6b3a',   // dark green
    secondary:    '#1a6ea8',   // light blue
    headerBg:     '#1a6b3a',
    headerText:   '#ffffff',
    accentBg:     '#e8f4fd',   // light blue bg
    accentBorder: '#1a6ea8',
    totalBg:      '#1a6b3a',
    logo:         null,        // set below
  },
  microbact: {
    primary:      '#1a6ea8',   // light blue
    secondary:    '#1a6b3a',   // dark green
    headerBg:     '#1a6ea8',
    headerText:   '#ffffff',
    accentBg:     '#edfaf2',   // light green bg
    accentBorder: '#1a6b3a',
    totalBg:      '#1a6ea8',
    logo:         null,
  },
};

const BANK = {
  kisan: {
    accountName: 'Kisan Bharti Agrotech Services',
    bank:  'State Bank of India',
    branch:'Startup Branch, Pune',
    account:'43722522008',
    ifsc:  'SBIN0064614',
    forLine:'For Kisan Bharti Agro Tech Services',
  },
  microbact: {
    accountName: 'Microbact Biocultures Pvt Ltd',
    bank:  'State Bank of India',
    branch:'Baner',
    account:'43315695305',
    ifsc:  'SBIN0064614',
    forLine:'For Microbact Biocultures Pvt Ltd',
  },
};

export default function InvoicePreview({ invoice, onNew, onList }) {
  if (!invoice) return null;

  const isKisan  = invoice.company === 'kisan';
  const igstMode = invoice.igstMode || false;
  const cgstRate = invoice.items?.[0]?.cgstRate || 9;
  const sgstRate = invoice.items?.[0]?.sgstRate || 9;
  const igstRate = cgstRate + sgstRate;
  const theme    = THEME[invoice.company];
  const bank     = BANK[invoice.company];

  const logo = isKisan ? kisanLogo : microbactLogo;

  return (
    <div className="fade-in">
      {/* Action bar */}
      <div className="page-header">
        <div className="page-title">
          <h2>✅ Invoice Created</h2>
          <p>Invoice <strong style={{ color:'var(--accent-gold)' }}>{invoice.invoiceNo}</strong> saved successfully</p>
        </div>
        <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
          <button className="btn btn-outline" onClick={onList}>📋 All Bills</button>
          <button className="btn btn-outline" onClick={onNew}>+ New Invoice</button>
          <button className="btn btn-success" onClick={() => generateAndDownloadPDF(invoice)}>📥 Download PDF</button>
        </div>
      </div>

      {/* ── INVOICE DOCUMENT ── */}
      <div style={{
        background:'#fff', border:'1px solid #d1d5db', borderRadius:8,
        overflow:'hidden', color:'#111', fontFamily:'Arial, sans-serif',
        boxShadow:'0 2px 16px rgba(0,0,0,0.08)',
      }}>

        {/* ── HEADER ── */}
        <div style={{
          background: theme.headerBg,
          padding:'18px 24px 14px',
          borderBottom:`3px solid ${theme.secondary}`,
        }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12 }}>
            {/* Logo + Company Name */}
            <div style={{ display:'flex', alignItems:'center', gap:14 }}>
              <img
                src={logo}
                alt="logo"
                style={{
                  height: isKisan ? 56 : 64,
                  width: 'auto',
                  objectFit:'contain',
                  background:'#fff',
                  borderRadius: isKisan ? '50%' : 8,
                  padding: isKisan ? 4 : 0,
                }}
              />
              <div>
                <div style={{ fontSize:18, fontWeight:800, color:'#fff', letterSpacing:'0.5px' }}>
                  {isKisan ? 'KISAN BHARTI AGRO TECH SERVICES' : 'MICROBACT BIOCULTURES PVT LTD'}
                </div>
                <div style={{ fontSize:11, color:'rgba(255,255,255,0.8)', marginTop:3 }}>
                  {isKisan ? 'Agricultural Solutions & Maintenance Services' : 'Biological Culture Solutions & Environmental Services'}
                </div>
                {invoice.gstNumber && (
                  <div style={{ fontSize:10, color:'rgba(255,255,255,0.7)', marginTop:2 }}>GSTIN: {invoice.gstNumber}</div>
                )}
              </div>
            </div>

            {/* Invoice badge */}
            <div style={{ textAlign:'right' }}>
              <div style={{
                background:'#fff',
                color: theme.primary,
                padding:'5px 18px',
                fontWeight:800, fontSize:15,
                letterSpacing:2, borderRadius:4,
                marginBottom:6, display:'inline-block',
              }}>TAX INVOICE</div>
              <div style={{ fontSize:12, color:'rgba(255,255,255,0.9)' }}><strong>No:</strong> {invoice.invoiceNo}</div>
              <div style={{ fontSize:12, color:'rgba(255,255,255,0.9)' }}><strong>Date:</strong> {formatDate(invoice.invoiceDate)}</div>
              <div style={{ fontSize:11, color: igstMode ? '#93c5fd' : '#86efac', fontWeight:700, marginTop:2 }}>
                {igstMode ? `Inter-State · IGST ${igstRate}%` : 'Intra-State · CGST + SGST'}
              </div>
            </div>
          </div>
        </div>

        {/* ── BILL TO / DETAILS ── */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', borderBottom:'1px solid #e5e7eb' }}>
          <div style={{ padding:'12px 20px', borderRight:'1px solid #e5e7eb' }}>
            <div style={{ fontSize:9, fontWeight:700, color:'#888', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:5 }}>Bill To</div>
            <div style={{ fontSize:14, fontWeight:700, color:'#111' }}>{invoice.customerName}</div>
            {invoice.customerAddress && <div style={{ fontSize:12, color:'#555', marginTop:2 }}>{invoice.customerAddress}</div>}
            {invoice.customerState   && <div style={{ fontSize:12, color:'#555', marginTop:1 }}>State: {invoice.customerState}</div>}
            {invoice.customerGSTIN   && <div style={{ fontSize:12, color:'#555', marginTop:1 }}>GSTIN: {invoice.customerGSTIN}</div>}
          </div>
          <div style={{ padding:'12px 20px' }}>
            <div style={{ fontSize:9, fontWeight:700, color:'#888', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:5 }}>Invoice Details</div>
            {invoice.panNo       && <div style={{ fontSize:12, color:'#555' }}>PAN: {invoice.panNo}</div>}
            {invoice.projectName && <div style={{ fontSize:12, color:'#555' }}>Project: {invoice.projectName}</div>}
            {invoice.poNo        && <div style={{ fontSize:12, color:'#555' }}>PO No: {invoice.poNo}</div>}
            {invoice.poDate      && <div style={{ fontSize:12, color:'#555' }}>PO Date: {formatDate(invoice.poDate)}</div>}
            <div style={{ fontSize:12, color:'#555', marginTop:2 }}>Payment Mode: {invoice.paymentMode}</div>
          </div>
        </div>

        {/* ── ITEMS TABLE ── */}
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
            <thead>
              <tr style={{ background: theme.primary, color:'#fff' }}>
                <th style={{ padding:'9px 8px', textAlign:'center',  fontSize:10 }}>#</th>
                <th style={{ padding:'9px 8px', textAlign:'left',    fontSize:10 }}>Description of Goods</th>
                <th style={{ padding:'9px 8px', textAlign:'center',  fontSize:10 }}>HSN</th>
                <th style={{ padding:'9px 8px', textAlign:'center',  fontSize:10 }}>Qty</th>
                <th style={{ padding:'9px 8px', textAlign:'center',  fontSize:10 }}>Unit</th>
                <th style={{ padding:'9px 8px', textAlign:'right',   fontSize:10 }}>Rate</th>
                <th style={{ padding:'9px 8px', textAlign:'right',   fontSize:10 }}>Taxable Amt</th>
                {!igstMode && <th style={{ padding:'9px 8px', textAlign:'right', fontSize:10 }}>CGST {cgstRate}%</th>}
                {!igstMode && <th style={{ padding:'9px 8px', textAlign:'right', fontSize:10 }}>SGST {sgstRate}%</th>}
                {igstMode  && <th style={{ padding:'9px 8px', textAlign:'right', fontSize:10 }}>IGST {igstRate}%</th>}
                <th style={{ padding:'9px 8px', textAlign:'right',   fontSize:10 }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, i) => (
                <tr key={i} style={{ background: i%2===0 ? '#fff' : theme.accentBg, borderBottom:'1px solid #f0f0f0' }}>
                  <td style={{ padding:'8px', textAlign:'center', color:'#888' }}>{item.srNo}</td>
                  <td style={{ padding:'8px', textAlign:'left',   fontWeight:500 }}>{item.description}</td>
                  <td style={{ padding:'8px', textAlign:'center', color:'#555' }}>{item.hsnCode}</td>
                  <td style={{ padding:'8px', textAlign:'center' }}>{item.qty}</td>
                  <td style={{ padding:'8px', textAlign:'center', color:'#555' }}>{item.unit}</td>
                  <td style={{ padding:'8px', textAlign:'right' }}>{formatCurrency(item.rate)}</td>
                  <td style={{ padding:'8px', textAlign:'right', color:'#555' }}>{formatCurrency(item.taxableAmount)}</td>
                  {!igstMode && <td style={{ padding:'8px', textAlign:'right', color:'#92400e' }}>{formatCurrency(item.cgst)}</td>}
                  {!igstMode && <td style={{ padding:'8px', textAlign:'right', color:'#92400e' }}>{formatCurrency(item.sgst)}</td>}
                  {igstMode  && <td style={{ padding:'8px', textAlign:'right', color: theme.secondary }}>{formatCurrency(item.igst)}</td>}
                  <td style={{ padding:'8px', textAlign:'right', fontWeight:700 }}>{formatCurrency(item.totalAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── AMOUNT IN WORDS ── */}
        <div style={{
          padding:'8px 20px',
          background: theme.accentBg,
          borderTop:`1px solid ${theme.accentBorder}`,
          borderBottom:'1px solid #e5e7eb',
          fontSize:12, color:'#374151',
        }}>
          <strong>Amount in Words:</strong> {invoice.amountInWords}
        </div>

        {/* ── BANK (left) + TOTALS (right) SIDE BY SIDE ── */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', borderBottom:'1px solid #e5e7eb' }}>

          {/* LEFT: Bank Details */}
          <div style={{ padding:'14px 20px', borderRight:'1px solid #e5e7eb' }}>
            <div style={{
              fontSize:10, fontWeight:700, color:'#fff',
              background: theme.secondary,
              padding:'4px 10px', borderRadius:4,
              display:'inline-block', marginBottom:10,
              letterSpacing:'0.06em', textTransform:'uppercase',
            }}>Bank Details</div>
            <div style={{ fontSize:12, fontWeight:700, color: theme.primary, marginBottom:8 }}>{bank.accountName}</div>
            <table style={{ borderCollapse:'collapse', width:'100%', fontSize:12 }}>
              <tbody>
                {[
                  ['Bank Name',  bank.bank],
                  ['Branch',     bank.branch],
                  ['Account No', bank.account],
                  ['IFSC Code',  bank.ifsc],
                ].map(([label, val]) => (
                  <tr key={label}>
                    <td style={{ color:'#666', paddingBottom:4, paddingRight:12, whiteSpace:'nowrap', width:90 }}>{label}</td>
                    <td style={{ color:'#111', fontWeight:600, paddingBottom:4 }}>: {val}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ marginTop:10, paddingTop:8, borderTop:'1px solid #e5e7eb', fontSize:11, color:'#555', fontStyle:'italic' }}>
              {bank.forLine}
            </div>
          </div>

          {/* RIGHT: Totals */}
          <div style={{ padding:'14px 20px' }}>
            <div style={{
              fontSize:10, fontWeight:700, color:'#fff',
              background: theme.primary,
              padding:'4px 10px', borderRadius:4,
              display:'inline-block', marginBottom:10,
              letterSpacing:'0.06em', textTransform:'uppercase',
            }}>Amount Summary</div>

            {[
              { label:'Taxable Amount', val: invoice.taxableTotal, color:'#374151' },
              ...(!igstMode ? [
                { label:`CGST (${cgstRate}%)`, val: invoice.cgstTotal, color:'#92400e' },
                { label:`SGST (${sgstRate}%)`, val: invoice.sgstTotal, color:'#92400e' },
              ] : [
                { label:`IGST (${igstRate}%)`, val: invoice.igstTotal, color: theme.secondary },
              ]),
              { label:'Advance Paid', val: invoice.advancePaid || 0, color:'#374151' },
              { label:'Balance Due',  val: invoice.remainingAmount || 0, color:'#dc2626' },
            ].map(({ label, val, color }) => (
              <div key={label} style={{ display:'flex', justifyContent:'space-between', padding:'5px 0', borderBottom:'1px solid #f0f0f0', fontSize:12 }}>
                <span style={{ color:'#555' }}>{label}</span>
                <span style={{ fontWeight:600, color }}>{formatCurrency(val)}</span>
              </div>
            ))}

            <div style={{
              display:'flex', justifyContent:'space-between',
              marginTop:8, padding:'10px 12px',
              background: theme.totalBg, color:'#fff',
              borderRadius:5, fontWeight:800, fontSize:14,
            }}>
              <span>TOTAL AMOUNT</span>
              <span>{formatCurrency(invoice.totalAmount)}</span>
            </div>
            <div style={{ marginTop:6, fontSize:11, color:'#666', textAlign:'right' }}>
              Status:&nbsp;
              <strong style={{ color: invoice.paymentStatus==='Paid' ? '#15803d' : invoice.paymentStatus==='Partial' ? '#d97706' : '#dc2626' }}>
                {invoice.paymentStatus}
              </strong>
            </div>
          </div>
        </div>

        {/* ── AUTHORISED SIGNATORY with actual signature image ── */}
        <div style={{ display:'flex', justifyContent:'flex-end', padding:'14px 24px', borderBottom:'1px solid #e5e7eb' }}>
          <div style={{ textAlign:'center', minWidth:200 }}>
            <div style={{ fontSize:9, color:'#888', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6 }}>Authorised Signatory</div>
            <img
              src={signatureImg}
              alt="Authorized Signature"
              style={{ height:56, width:'auto', objectFit:'contain', display:'block', margin:'0 auto 6px' }}
            />
            <div style={{
              borderTop:`2px solid ${theme.primary}`,
              paddingTop:5,
              fontSize:11, fontWeight:700,
              color: theme.primary,
            }}>
              {isKisan ? 'Kisan Bharti Agro Tech Services' : 'Microbact Biocultures Pvt Ltd'}
            </div>
          </div>
        </div>

        {/* ── FOOTER ── */}
        <div style={{
          background: theme.primary,
          color:'#fff', textAlign:'center',
          padding:'8px 20px', fontSize:11,
        }}>
          Thank you for your business &nbsp;|&nbsp; Computer Generated Invoice &nbsp;|&nbsp;
          {isKisan ? ' Kisan Bharti Agro Tech Services' : ' Microbact Biocultures Pvt Ltd'}
        </div>
      </div>

      {/* Download button */}
      <div style={{ marginTop:20, textAlign:'center' }}>
        <button className="btn btn-success btn-xl" onClick={() => generateAndDownloadPDF(invoice)}>
          📥 Download PDF Invoice
        </button>
        <p style={{ fontSize:12, color:'var(--text-muted)', marginTop:8 }}>
          Opens print dialog → select "Save as PDF"
        </p>
      </div>
    </div>
  );
}
