import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { InvoiceDB, exportToCSV } from '../utils/db';
import { generateAndDownloadPDF } from '../utils/pdfGenerator';
import { formatCurrency, formatDate } from '../utils/helpers';
import PaymentModal from '../components/PaymentModal';

export default function InvoiceList({ company }) {
  const [invoices, setInvoices]       = useState([]);
  const [search, setSearch]           = useState('');
  const [companyFilter, setCompanyFilter] = useState(company || '');
  const [statusFilter, setStatusFilter]   = useState('');
  const [selected, setSelected]       = useState(null);
  const [showPayment, setShowPayment] = useState(false);

  const load = useCallback(() => {
    setInvoices(InvoiceDB.getAll({ company: companyFilter, status: statusFilter, search }));
  }, [companyFilter, statusFilter, search]);

  useEffect(() => { load(); }, [companyFilter, statusFilter]);

  const handleDelete = (id) => {
    if (!window.confirm('Delete this invoice?')) return;
    InvoiceDB.delete(id);
    toast.success('Invoice deleted');
    load();
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div className="page-title">
          <h2>📋 All Invoices</h2>
          <p>{invoices.length} invoice{invoices.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn btn-outline btn-sm"
          onClick={() => exportToCSV(companyFilter, companyFilter || 'All')}>
          ⬇ Export CSV
        </button>
      </div>

      {/* Filters */}
      <div style={{ display:'flex', gap:12, marginBottom:20, flexWrap:'wrap', alignItems:'center' }}>
        <div className="search-bar" style={{ flex:1, minWidth:200 }}>
          <span className="search-icon">🔍</span>
          <input placeholder="Search customer name or invoice no…" value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && load()} />
          <button className="btn btn-primary btn-sm" onClick={load}>Search</button>
        </div>
        <select className="form-select" style={{ width:160 }} value={companyFilter} onChange={e => setCompanyFilter(e.target.value)}>
          <option value="">All Companies</option>
          <option value="kisan">🌾 Kisan Bharti</option>
          <option value="microbact">🔬 Microbact</option>
        </select>
        <select className="form-select" style={{ width:150 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Status</option>
          <option value="Paid">✅ Paid</option>
          <option value="Partial">🔄 Partial</option>
          <option value="Pending">⏳ Pending</option>
        </select>
      </div>

      <div className="card" style={{ padding:0, overflow:'hidden' }}>
        <div className="table-wrapper">
          {invoices.length === 0
            ? <div className="empty-state"><div className="empty-icon">🧾</div><h3>No invoices found</h3><p>Create your first invoice to see it here</p></div>
            : <table>
                <thead>
                  <tr><th>Invoice No</th><th>Company</th><th>Customer</th><th>Date</th><th>Total</th><th>Advance</th><th>Balance</th><th>Status</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {invoices.map(inv => (
                    <tr key={inv._id}>
                      <td style={{ fontWeight:700, color:'var(--accent-gold)', fontFamily:'monospace' }}>{inv.invoiceNo}</td>
                      <td><span className={`badge badge-${inv.company}`}>{inv.company === 'kisan' ? '🌾 Kisan' : '🔬 Microbact'}</span></td>
                      <td style={{ fontWeight:500 }}>{inv.customerName}</td>
                      <td style={{ color:'var(--text-secondary)' }}>{formatDate(inv.invoiceDate)}</td>
                      <td style={{ fontWeight:700, color:'#4ade80' }}>{formatCurrency(inv.totalAmount)}</td>
                      <td style={{ color:'var(--text-secondary)' }}>{formatCurrency(inv.advancePaid)}</td>
                      <td style={{ color: inv.remainingAmount > 0 ? '#fbbf24' : '#4ade80', fontWeight:600 }}>{formatCurrency(inv.remainingAmount)}</td>
                      <td><span className={`badge badge-${(inv.paymentStatus||'pending').toLowerCase()}`}>{inv.paymentStatus}</span></td>
                      <td>
                        <div style={{ display:'flex', gap:5 }}>
                          <button className="btn btn-outline btn-sm" title="Download PDF" onClick={() => generateAndDownloadPDF(inv)}>📥</button>
                          <button className="btn btn-warning btn-sm" title="Update Payment" onClick={() => { setSelected(inv); setShowPayment(true); }}>💳</button>
                          <button className="btn btn-danger btn-sm" title="Delete" onClick={() => handleDelete(inv._id)}>🗑</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
          }
        </div>
      </div>

      {showPayment && selected && (
        <PaymentModal
          invoice={selected}
          onClose={() => setShowPayment(false)}
          onUpdated={() => { setShowPayment(false); load(); toast.success('Payment updated!'); }}
        />
      )}
    </div>
  );
}
