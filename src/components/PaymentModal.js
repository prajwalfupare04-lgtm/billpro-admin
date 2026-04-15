import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { InvoiceDB } from '../utils/db';
import { formatCurrency } from '../utils/helpers';

export default function PaymentModal({ invoice, onClose, onUpdated }) {
  const [form, setForm] = useState({
    advancePaid: invoice.advancePaid || '',
    paymentMode: invoice.paymentMode || 'Cash',
    paymentDate: new Date().toISOString().split('T')[0],
    paymentTime: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
  });
  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const remaining = invoice.totalAmount - (parseFloat(form.advancePaid) || 0);

  const handleSave = () => {
    InvoiceDB.updatePayment(invoice._id, {
      advancePaid: parseFloat(form.advancePaid) || 0,
      paymentMode: form.paymentMode,
      paymentDate: form.paymentDate,
      paymentTime: form.paymentTime,
    });
    toast.success('Payment updated!');
    onUpdated();
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 420 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <h3 style={{ fontSize:17, fontWeight:700 }}>💳 Update Payment</h3>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'var(--text-muted)', fontSize:22, cursor:'pointer' }}>×</button>
        </div>
        <div style={{ padding:'12px 16px', background:'var(--bg-card2)', borderRadius:10, marginBottom:20 }}>
          <div style={{ fontSize:12, color:'var(--text-muted)' }}>Invoice · {invoice.invoiceNo}</div>
          <div style={{ fontSize:15, fontWeight:700, marginTop:4 }}>{invoice.customerName}</div>
          <div style={{ display:'flex', gap:16, marginTop:8 }}>
            <div>
              <div style={{ fontSize:10, color:'var(--text-muted)' }}>TOTAL</div>
              <div style={{ fontWeight:700, color:'#4ade80' }}>{formatCurrency(invoice.totalAmount)}</div>
            </div>
            <div>
              <div style={{ fontSize:10, color:'var(--text-muted)' }}>STATUS</div>
              <span className={`badge badge-${(invoice.paymentStatus||'pending').toLowerCase()}`}>{invoice.paymentStatus}</span>
            </div>
          </div>
        </div>
        <div className="form-grid" style={{ gridTemplateColumns:'1fr' }}>
          {[
            { label:'Amount Paid (₹)', key:'advancePaid', type:'number', placeholder:'0.00' },
            { label:'Payment Date', key:'paymentDate', type:'date' },
            { label:'Payment Time', key:'paymentTime', type:'time' },
          ].map(({ label, key, type, placeholder }) => (
            <div className="form-group" key={key}>
              <label className="form-label">{label}</label>
              <input type={type} className="form-input" placeholder={placeholder}
                value={form[key]} onChange={e => setF(key, e.target.value)} />
            </div>
          ))}
          <div className="form-group">
            <label className="form-label">Payment Mode</label>
            <select className="form-select" value={form.paymentMode} onChange={e => setF('paymentMode', e.target.value)}>
              {['Cash','Online','Cheque','Pending'].map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>
        <div style={{ padding:'12px 16px', borderRadius:10, marginTop:16,
          background: remaining <= 0 ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.1)',
          border: `1px solid ${remaining <= 0 ? 'rgba(34,197,94,0.3)' : 'rgba(245,158,11,0.3)'}` }}>
          <div style={{ display:'flex', justifyContent:'space-between' }}>
            <span style={{ fontSize:13, color:'var(--text-secondary)' }}>Remaining Balance</span>
            <span style={{ fontWeight:800, fontSize:16, color: remaining <= 0 ? '#4ade80' : '#fbbf24' }}>
              {remaining <= 0 ? '✅ FULLY PAID' : formatCurrency(remaining)}
            </span>
          </div>
        </div>
        <div style={{ display:'flex', gap:10, marginTop:20, justifyContent:'flex-end' }}>
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn btn-success" onClick={handleSave}>✅ Update Payment</button>
        </div>
      </div>
    </div>
  );
}
