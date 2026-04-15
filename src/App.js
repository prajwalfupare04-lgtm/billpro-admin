import React, { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import CompanySelect from './pages/CompanySelect';
import InvoiceForm from './pages/InvoiceForm';
import InvoicePreview from './pages/InvoicePreview';
import Dashboard from './pages/Dashboard';
import InvoiceList from './pages/InvoiceList';
import ProductManager from './pages/ProductManager';
import Sidebar from './components/Sidebar';
import './index.css';

export default function App() {
  const [page, setPage] = useState('select');
  const [company, setCompany] = useState(null);
  const [currentInvoice, setCurrentInvoice] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleCompanySelect = (c) => { setCompany(c); setPage('invoice'); };
  const handleInvoiceCreated = (inv) => { setCurrentInvoice(inv); setPage('preview'); };

  if (page === 'select') {
    return (
      <>
        <Toaster position="top-right" />
        <CompanySelect onSelect={handleCompanySelect} onDashboard={() => setPage('dashboard')} />
      </>
    );
  }

  return (
    <div className="app-shell">
      <Toaster position="top-right" toastOptions={{ className: 'toast-custom' }} />
      <Sidebar
        page={page} setPage={setPage}
        company={company} setCompany={setCompany}
        onHome={() => { setPage('select'); setCompany(null); }}
        open={sidebarOpen} setOpen={setSidebarOpen}
      />
      <main className="main-content">
        <button className="menu-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
          {sidebarOpen ? '✕' : '☰'}
        </button>
        {page === 'dashboard' && <Dashboard setPage={setPage} setCompany={setCompany} />}
        {page === 'invoice'   && <InvoiceForm company={company} onCreated={handleInvoiceCreated} onBack={() => setPage('select')} />}
        {page === 'preview'   && <InvoicePreview invoice={currentInvoice} onNew={() => setPage('invoice')} onList={() => setPage('list')} />}
        {page === 'list'      && <InvoiceList company={company} />}
        {page === 'products'  && <ProductManager company={company} />}
      </main>
    </div>
  );
}
