import React from 'react';

export default function Sidebar({ page, setPage, company, setCompany, onHome, open, setOpen }) {
  const handleNav = (id) => { setPage(id); setOpen(false); };

  return (
    <aside className={`sidebar ${open ? 'open' : ''}`}>
      <div className="sidebar-logo">
        <h1>BillPro Admin</h1>
        <p>No Database · Works Offline</p>
      </div>

      {company && (
        <div className={`company-badge ${company}`}>
          <span>{company === 'kisan' ? '🌾' : '🔬'}</span>
          <span>{company === 'kisan' ? 'Kisan Bharti' : 'Microbact'}</span>
        </div>
      )}

      <nav className="sidebar-nav">
        <div className="nav-section">
          <div className="nav-section-title">Main</div>
          {[
            { id: 'dashboard', icon: '📊', label: 'Dashboard' },
            { id: 'invoice',   icon: '📄', label: 'New Invoice' },
            { id: 'list',      icon: '📋', label: 'All Invoices' },
          ].map(item => (
            <div key={item.id} className={`nav-item ${page === item.id ? 'active' : ''}`} onClick={() => handleNav(item.id)}>
              <span className="icon">{item.icon}</span>{item.label}
            </div>
          ))}
        </div>

        <div className="nav-section">
          <div className="nav-section-title">Admin</div>
          <div className={`nav-item ${page === 'products' ? 'active' : ''}`} onClick={() => handleNav('products')}>
            <span className="icon">📦</span>Product Manager
          </div>
        </div>

        <div className="nav-section">
          <div className="nav-section-title">Switch Company</div>
          {[
            { c: 'kisan', icon: '🌾', label: 'Kisan Bharti' },
            { c: 'microbact', icon: '🔬', label: 'Microbact' },
          ].map(({ c, icon, label }) => (
            <div key={c} className={`nav-item ${company === c ? 'active' : ''}`}
              onClick={() => { setCompany(c); setPage('invoice'); setOpen(false); }}>
              <span className="icon">{icon}</span>{label}
            </div>
          ))}
        </div>
      </nav>

      <div className="sidebar-footer">
        <button className="home-btn" onClick={onHome}>🏠 Company Selection</button>
      </div>
    </aside>
  );
}
