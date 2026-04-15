import React from 'react';

export default function CompanySelect({ onSelect, onDashboard }) {
  return (
    <div className="select-page">
      <div className="select-header">
        <div className="logo-mark">💼</div>
        <h1>Admin Billing System</h1>
        <p>Select a company to create invoices · All data saved locally</p>
      </div>

      <div className="company-cards">
        <div className="company-card kisan" onClick={() => onSelect('kisan')}>
          <div className="card-icon">🌾</div>
          <h2>Kisan Bharti Agro Tech Services</h2>
          <p>Agricultural solutions, maintenance services, bio-products and plant care for farms and gardens.</p>
          <div className="card-action">Create Invoice <span>→</span></div>
        </div>
        <div className="company-card microbact" onClick={() => onSelect('microbact')}>
          <div className="card-icon">🔬</div>
          <h2>Microbact Biocultures Pvt Ltd</h2>
          <p>Biological culture solutions for STP, ETP, bioremediation and environmental management.</p>
          <div className="card-action">Create Invoice <span>→</span></div>
        </div>
      </div>

      <div style={{ marginTop:40, display:'flex', gap:12, flexWrap:'wrap', justifyContent:'center', position:'relative', zIndex:1 }}>
        <button className="btn btn-outline btn-lg" onClick={onDashboard}>📊 Admin Dashboard</button>
      </div>

      <div style={{ position:'relative', zIndex:1, marginTop:36, textAlign:'center' }}>
        <p style={{ fontSize:12, color:'var(--text-muted)' }}>
          🔒 All data stored in your browser · No internet required · No database
        </p>
      </div>
    </div>
  );
}
