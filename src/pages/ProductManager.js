import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { ProductDB } from '../utils/db';
import { formatCurrency } from '../utils/helpers';

const UNITS = ['Nos','Job','Ltr','Kg','Mtr','Sq.Mtr','Set','Pair','Box','Pack'];
const emptyForm = (company) => ({ company: company||'kisan', name:'', description:'', hsnCode:'', unit:'Nos', rate:'', cgstRate:9, sgstRate:9 });

export default function ProductManager({ company }) {
  const [products, setProducts] = useState([]);
  const [filter, setFilter]     = useState(company || '');
  const [showModal, setShowModal] = useState(false);
  const [editProd, setEditProd]  = useState(null);
  const [form, setForm]          = useState(emptyForm(company));
  const setF = (k,v) => setForm(f => ({ ...f, [k]:v }));

  useEffect(() => { loadProducts(); }, [filter]);

  const loadProducts = () => setProducts(ProductDB.getAllAdmin(filter));

  const seedDefaults = () => {
    const n = ProductDB.seedDefaults();
    toast.success(n > 0 ? `${n} default products added!` : 'All defaults already loaded');
    loadProducts();
  };

  const openAdd = () => { setEditProd(null); setForm(emptyForm(filter||'kisan')); setShowModal(true); };
  const openEdit = (p) => { setEditProd(p); setForm({ ...p }); setShowModal(true); };

  const handleSave = () => {
    if (!form.name || !form.rate) return toast.error('Name and Rate are required');
    if (editProd) {
      ProductDB.update(editProd._id, form);
      toast.success('Product updated!');
    } else {
      ProductDB.create(form);
      toast.success('Product added!');
    }
    setShowModal(false);
    loadProducts();
  };

  const handleDelete = (id) => {
    if (!window.confirm('Deactivate this product?')) return;
    ProductDB.delete(id);
    toast.success('Product removed');
    loadProducts();
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div className="page-title">
          <h2>📦 Product Manager</h2>
          <p>Add, edit or update product rates — changes apply to new invoices</p>
        </div>
        <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
          <button className="btn btn-outline btn-sm" onClick={seedDefaults}>🌱 Load Defaults</button>
          <button className="btn btn-primary" onClick={openAdd}>+ Add Product</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ marginBottom:20 }}>
        <div className="tabs" style={{ maxWidth:320 }}>
          {[['','All'],['kisan','🌾 Kisan'],['microbact','🔬 Microbact']].map(([v,l]) => (
            <button key={v} className={`tab ${filter===v?'active':''}`} onClick={() => setFilter(v)}>{l}</button>
          ))}
        </div>
      </div>

      {products.length === 0
        ? <div className="empty-state">
            <div className="empty-icon">📦</div>
            <h3>No products</h3>
            <p>Click "Load Defaults" to add sample products</p>
            <button className="btn btn-primary" style={{ marginTop:14 }} onClick={seedDefaults}>🌱 Load Defaults</button>
          </div>
        : <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:16 }}>
            {products.map(prod => (
              <div key={prod._id} className="product-card">
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
                  <span className={`badge badge-${prod.company}`} style={{ fontSize:10 }}>
                    {prod.company === 'kisan' ? '🌾 Kisan' : '🔬 Microbact'}
                  </span>
                  <div style={{ display:'flex', gap:5 }}>
                    <button className="btn btn-outline btn-sm" onClick={() => openEdit(prod)}>✏️</button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(prod._id)}>🗑</button>
                  </div>
                </div>
                <div style={{ fontSize:15, fontWeight:700, marginBottom:3 }}>{prod.name}</div>
                {prod.description && <div style={{ fontSize:11, color:'var(--text-muted)', marginBottom:8 }}>{prod.description}</div>}
                <div style={{ display:'flex', gap:14, flexWrap:'wrap' }}>
                  <div>
                    <div style={{ fontSize:10, color:'var(--text-muted)' }}>RATE</div>
                    <div style={{ fontSize:18, fontWeight:800, color:'#4ade80', fontFamily:"'Playfair Display',serif" }}>{formatCurrency(prod.rate)}</div>
                  </div>
                  <div><div style={{ fontSize:10, color:'var(--text-muted)' }}>UNIT</div><div style={{ fontSize:13, fontWeight:600, color:'var(--text-secondary)' }}>{prod.unit}</div></div>
                  <div><div style={{ fontSize:10, color:'var(--text-muted)' }}>HSN</div><div style={{ fontSize:13, color:'var(--text-secondary)' }}>{prod.hsnCode||'—'}</div></div>
                  <div><div style={{ fontSize:10, color:'var(--text-muted)' }}>TAX</div><div style={{ fontSize:12, color:'var(--accent-gold)' }}>CGST {prod.cgstRate}% + SGST {prod.sgstRate}%</div></div>
                </div>
              </div>
            ))}
          </div>
      }

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
              <h3 style={{ fontSize:17, fontWeight:700 }}>{editProd ? '✏️ Edit Product' : '+ Add Product'}</h3>
              <button onClick={() => setShowModal(false)} style={{ background:'none', border:'none', color:'var(--text-muted)', fontSize:22, cursor:'pointer' }}>×</button>
            </div>
            <div className="form-grid" style={{ gridTemplateColumns:'1fr 1fr' }}>
              <div className="form-group" style={{ gridColumn:'span 2' }}>
                <label className="form-label">Company *</label>
                <select className="form-select" value={form.company} onChange={e => setF('company', e.target.value)}>
                  <option value="kisan">🌾 Kisan Bharti</option>
                  <option value="microbact">🔬 Microbact</option>
                </select>
              </div>
              <div className="form-group" style={{ gridColumn:'span 2' }}>
                <label className="form-label">Product Name *</label>
                <input className="form-input" placeholder="Product name" value={form.name} onChange={e => setF('name', e.target.value)} />
              </div>
              <div className="form-group" style={{ gridColumn:'span 2' }}>
                <label className="form-label">Description</label>
                <input className="form-input" placeholder="Invoice description" value={form.description} onChange={e => setF('description', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">HSN Code</label>
                <input className="form-input" placeholder="e.g. 3101" value={form.hsnCode} onChange={e => setF('hsnCode', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Unit</label>
                <select className="form-select" value={form.unit} onChange={e => setF('unit', e.target.value)}>
                  {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ gridColumn:'span 2' }}>
                <label className="form-label">Rate (₹) *</label>
                <input type="number" className="form-input" placeholder="0.00" value={form.rate} onChange={e => setF('rate', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">CGST Rate (%)</label>
                <input type="number" className="form-input" value={form.cgstRate} onChange={e => setF('cgstRate', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">SGST Rate (%)</label>
                <input type="number" className="form-input" value={form.sgstRate} onChange={e => setF('sgstRate', e.target.value)} />
              </div>
            </div>
            {form.rate > 0 && (
              <div style={{ marginTop:14, padding:'10px 14px', background:'var(--bg-card2)', borderRadius:10, fontSize:12 }}>
                <span style={{ color:'var(--text-muted)' }}>Per unit: </span>
                <span>Base <strong style={{ color:'white' }}>{formatCurrency(form.rate)}</strong> · </span>
                <span>CGST <strong style={{ color:'var(--accent-gold)' }}>{formatCurrency(form.rate*form.cgstRate/100)}</strong> · </span>
                <span>SGST <strong style={{ color:'var(--accent-gold)' }}>{formatCurrency(form.rate*form.sgstRate/100)}</strong> · </span>
                <span>Total <strong style={{ color:'#4ade80' }}>{formatCurrency(form.rate*(1+form.cgstRate/100+form.sgstRate/100))}</strong></span>
              </div>
            )}
            <div style={{ display:'flex', gap:10, marginTop:20, justifyContent:'flex-end' }}>
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave}>{editProd ? '✅ Update' : '✅ Add Product'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
