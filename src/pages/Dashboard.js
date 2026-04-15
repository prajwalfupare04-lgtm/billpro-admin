import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { InvoiceDB, exportToCSV } from '../utils/db';
import { formatCurrency, formatDate } from '../utils/helpers';

export default function Dashboard({ setPage, setCompany }) {
  const [stats, setStats]                     = useState(null);
  const [recent, setRecent]                   = useState([]);
  const [installPrompt, setInstallPrompt]     = useState(null);
  const [isInstalled, setIsInstalled]         = useState(false);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) setIsInstalled(true);
    const handler = (e) => { e.preventDefault(); setInstallPrompt(e); setShowInstallBanner(true); };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  useEffect(() => {
    setStats(InvoiceDB.getDashboardStats());
    setRecent(InvoiceDB.getAll({}).slice(0, 8));
  }, []);

  const handleInstall = async () => {
    if (installPrompt) {
      installPrompt.prompt();
      const result = await installPrompt.userChoice;
      if (result.outcome === 'accepted') { setIsInstalled(true); setShowInstallBanner(false); setInstallPrompt(null); }
    } else {
      alert('📱 Install Agro Billing Admin:\n\nAndroid (Chrome):\n  1. Tap ⋮ menu → "Add to Home Screen" → Install\n\niPhone (Safari):\n  1. Tap Share (□↑) → "Add to Home Screen" → Add');
    }
  };

  if (!stats) return <div style={{ textAlign:'center', padding:80, color:'var(--text-muted)' }}>Loading…</div>;

  const pieData = [
    { name:'Kisan Bharti', value: stats.companySplit.kisan.revenue },
    { name:'Microbact',    value: stats.companySplit.microbact.revenue },
  ];

  return (
    <div className="fade-in">

      {/* Install Banner */}
      {showInstallBanner && !isInstalled && (
        <div style={{ background:'linear-gradient(135deg,#15803d,#166534)', border:'1px solid #22c55e', borderRadius:14, padding:'14px 20px', marginBottom:20, display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12, boxShadow:'0 4px 20px rgba(34,197,94,0.2)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <span style={{ fontSize:28 }}>📲</span>
            <div>
              <div style={{ fontWeight:700, color:'white', fontSize:15 }}>Install Agro Billing as App</div>
              <div style={{ fontSize:12, color:'rgba(255,255,255,0.75)' }}>Works offline · App icon on home screen · Fast loading</div>
            </div>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={() => setShowInstallBanner(false)} style={{ background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.3)', color:'white', padding:'8px 14px', borderRadius:8, cursor:'pointer', fontSize:13, fontFamily:'inherit' }}>Later</button>
            <button onClick={handleInstall} style={{ background:'#f59e0b', border:'none', color:'white', padding:'8px 18px', borderRadius:8, cursor:'pointer', fontWeight:700, fontSize:13, fontFamily:'inherit' }}>📲 Install Now</button>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="page-header">
        <div className="page-title">
          <h2>📊 Admin Dashboard</h2>
          <p>Agro Billing · Data stored locally in your browser</p>
        </div>
        <div style={{ display:'flex', gap:10, flexWrap:'wrap', alignItems:'center' }}>
          {/* DOWNLOAD APP BUTTON */}
          {!isInstalled ? (
            <button onClick={handleInstall} className="btn-download-app">
              📲 Download App
            </button>
          ) : (
            <div style={{ display:'flex', alignItems:'center', gap:6, background:'rgba(34,197,94,0.1)', border:'1px solid rgba(34,197,94,0.3)', padding:'8px 14px', borderRadius:10 }}>
              <span>✅</span><span style={{ fontSize:13, color:'#4ade80', fontWeight:600 }}>App Installed</span>
            </div>
          )}
          <button className="btn btn-kisan btn-sm" onClick={() => { setCompany('kisan'); setPage('invoice'); }}>🌾 Kisan Bill</button>
          <button className="btn btn-micro btn-sm" onClick={() => { setCompany('microbact'); setPage('invoice'); }}>🔬 Microbact Bill</button>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        {[
          { icon:'📄', label:'Bills Today',    val:stats.today.count,                   cls:'blue'   },
          { icon:'💰', label:'Revenue Today',  val:formatCurrency(stats.today.revenue),  cls:'green',  big:true },
          { icon:'📅', label:'This Month',     val:formatCurrency(stats.month.revenue),  cls:'purple', big:true },
          { icon:'⏳', label:`Pending (${stats.pending.count})`, val:formatCurrency(stats.pending.amount), cls:'amber', big:true },
          { icon:'✅', label:'Paid Bills',     val:stats.paid.count,                    cls:'green'  },
          { icon:'🧾', label:'Total Invoices', val:stats.total.count,                   cls:'blue'   },
        ].map(({ icon, label, val, cls, big }) => (
          <div key={label} className={`stat-card ${cls}`}>
            <div className={`stat-icon ${cls}`}>{icon}</div>
            <div className="stat-value" style={big?{fontSize:18}:{}}>{val}</div>
            <div className="stat-label">{label}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:20, marginBottom:24 }}>
        <div className="chart-container">
          <h3 style={{ fontSize:13, fontWeight:700, color:'var(--text-secondary)', marginBottom:16, textTransform:'uppercase', letterSpacing:'0.06em' }}>Monthly Revenue</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stats.monthlyData} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" tick={{ fill:'#8ba4c8', fontSize:11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill:'#8ba4c8', fontSize:10 }} axisLine={false} tickLine={false}
                tickFormatter={v => v>=1000?`₹${(v/1000).toFixed(0)}k`:`₹${v}`} />
              <Tooltip contentStyle={{ background:'#1a2234', border:'1px solid #2a3a55', borderRadius:8, fontSize:12 }}
                formatter={v=>[formatCurrency(v),'Revenue']} />
              <defs>
                <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22c55e"/><stop offset="100%" stopColor="#15803d"/>
                </linearGradient>
              </defs>
              <Bar dataKey="revenue" fill="url(#bg)" radius={[6,6,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="chart-container">
          <h3 style={{ fontSize:13, fontWeight:700, color:'var(--text-secondary)', marginBottom:16, textTransform:'uppercase', letterSpacing:'0.06em' }}>Company Split</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={48} outerRadius={78} paddingAngle={4} dataKey="value">
                <Cell fill="#22c55e"/><Cell fill="#3b82f6"/>
              </Pie>
              <Tooltip formatter={v=>[formatCurrency(v),'Revenue']} contentStyle={{ background:'#1a2234', border:'1px solid #2a3a55', borderRadius:8, fontSize:12 }}/>
              <Legend formatter={val=><span style={{ color:'var(--text-secondary)', fontSize:12 }}>{val}</span>}/>
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display:'flex', gap:10, marginTop:8 }}>
            <div style={{ flex:1, padding:'8px 10px', background:'var(--kisan-glow)', borderRadius:8, border:'1px solid var(--kisan-dark)' }}>
              <div style={{ fontSize:10, color:'var(--kisan-primary)', fontWeight:700 }}>KISAN</div>
              <div style={{ fontSize:13, fontWeight:700, color:'white' }}>{stats.companySplit.kisan.count} bills</div>
            </div>
            <div style={{ flex:1, padding:'8px 10px', background:'var(--micro-glow)', borderRadius:8, border:'1px solid var(--micro-dark)' }}>
              <div style={{ fontSize:10, color:'var(--micro-primary)', fontWeight:700 }}>MICROBACT</div>
              <div style={{ fontSize:13, fontWeight:700, color:'white' }}>{stats.companySplit.microbact.count} bills</div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Invoices */}
      <div className="card" style={{ marginBottom:20 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
          <h3 style={{ fontSize:14, fontWeight:700 }}>Recent Invoices</h3>
          <button className="btn btn-outline btn-sm" onClick={()=>setPage('list')}>View All →</button>
        </div>
        <div className="table-wrapper">
          <table>
            <thead><tr><th>Invoice No</th><th>Company</th><th>Customer</th><th>Date</th><th>Total</th><th>Status</th></tr></thead>
            <tbody>
              {recent.length===0
                ? <tr><td colSpan={6} style={{ textAlign:'center', padding:40, color:'var(--text-muted)' }}>No invoices yet</td></tr>
                : recent.map(inv=>(
                  <tr key={inv._id}>
                    <td style={{ fontWeight:600, color:'var(--accent-gold)' }}>{inv.invoiceNo}</td>
                    <td><span className={`badge badge-${inv.company}`}>{inv.company==='kisan'?'🌾 Kisan':'🔬 Microbact'}</span></td>
                    <td>{inv.customerName}</td>
                    <td style={{ color:'var(--text-secondary)' }}>{formatDate(inv.invoiceDate)}</td>
                    <td style={{ fontWeight:700, color:'#4ade80' }}>{formatCurrency(inv.totalAmount)}</td>
                    <td><span className={`badge badge-${(inv.paymentStatus||'pending').toLowerCase()}`}>{inv.paymentStatus}</span></td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:14 }}>
        {[
          { label:'Export All (CSV)', icon:'📊', action:()=>exportToCSV('','All'),               desc:'Download all invoices' },
          { label:'Kisan Bharti CSV', icon:'🌾', action:()=>exportToCSV('kisan','Kisan_Bharti'),  desc:'Kisan bills only' },
          { label:'Microbact CSV',    icon:'🔬', action:()=>exportToCSV('microbact','Microbact'),  desc:'Microbact bills only' },
          { label:'Manage Products',  icon:'📦', action:()=>setPage('products'),                  desc:'Edit rates & products' },
          { label:'Download App',     icon:'📲', action:handleInstall,                            desc:isInstalled?'App already installed':'Install on Android / iPhone' },
        ].map(({label,icon,action,desc})=>(
          <button key={label} onClick={action} className="product-card"
            style={{ cursor:'pointer', textAlign:'left', width:'100%', border:'1px solid var(--border)', background:'var(--bg-card)', padding:'18px' }}>
            <div style={{ fontSize:26, marginBottom:8 }}>{icon}</div>
            <div style={{ fontSize:13, fontWeight:700, color:'var(--text-primary)', marginBottom:3 }}>{label}</div>
            <div style={{ fontSize:12, color:'var(--text-muted)' }}>{desc}</div>
          </button>
        ))}
      </div>

      {/* Mobile install guide */}
      {!isInstalled && (
        <div style={{ marginTop:20, padding:'16px 20px', background:'rgba(245,158,11,0.07)', border:'1px solid rgba(245,158,11,0.2)', borderRadius:14 }}>
          <div style={{ fontSize:13, fontWeight:700, color:'var(--accent-gold)', marginBottom:10 }}>📱 How to Install on Mobile</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div style={{ fontSize:12, color:'var(--text-secondary)', lineHeight:1.8 }}>
              <strong style={{ color:'var(--text-primary)' }}>Android (Chrome)</strong><br/>
              1. Tap ⋮ menu (3 dots)<br/>2. "Add to Home Screen"<br/>3. Tap "Install"
            </div>
            <div style={{ fontSize:12, color:'var(--text-secondary)', lineHeight:1.8 }}>
              <strong style={{ color:'var(--text-primary)' }}>iPhone (Safari)</strong><br/>
              1. Tap Share button (□↑)<br/>2. "Add to Home Screen"<br/>3. Tap "Add"
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
