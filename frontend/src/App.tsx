// src/App.tsx
import { useState } from 'react';
import { LayoutDashboard, Package, Truck, ShoppingCart, Bell, Store, Link, Lock, ArrowRight, ShoppingBag, History } from 'lucide-react';
import './index.css';
import { useToast } from './hooks/useToast';
import ToastContainer from './components/ToastContainer';
import Overview from './components/Overview';
import Inventory from './components/Inventory';
import Suppliers from './components/Suppliers';
import PurchaseOrders from './components/PurchaseOrders';
import SalesOrders from './components/SalesOrders';
import ActivityLog from './components/ActivityLog';
import Alerts from './components/Alerts';
import ChatWidget from './components/ChatWidget';
import BarcodeScanner from './components/BarcodeScanner';

type Page = 'overview' | 'inventory' | 'sales' | 'suppliers' | 'orders' | 'alerts' | 'activity';

const NAV = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'inventory', label: 'Inventory', icon: Package },
  { id: 'sales', label: 'Sales Orders', icon: ShoppingBag },
  { id: 'activity', label: 'Activity Log', icon: History },
  { id: 'suppliers', label: 'Suppliers', icon: Truck },
  { id: 'orders', label: 'Purchase Orders', icon: ShoppingCart },
  { id: 'alerts', label: 'Alerts', icon: Bell },
];

const PAGE_TITLES: Record<Page, { title: string; sub: string }> = {
  overview: { title: 'Dashboard', sub: 'Live Shopify data' },
  inventory: { title: 'Inventory Manager', sub: 'Real-time stock levels' },
  sales: { title: 'Sales Orders', sub: 'Storefront sales activity' },
  activity: { title: 'Activity Log', sub: 'Stock adjustments history' },
  suppliers: { title: 'Supplier Directory', sub: 'Manage vendor contacts' },
  orders: { title: 'Purchase Orders', sub: 'Restock management' },
  alerts: { title: 'Stock Alerts', sub: 'Low-stock notifications' },
};

export default function App() {
  const [page, setPage] = useState<Page>('overview');
  const [scannerOpen, setScannerOpen] = useState(false);
  const { toasts, showToast, removeToast } = useToast();

  // Authentication State
  const [passcode, setPasscode] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('quantora_auth') === 'true';
  });
  const [authError, setAuthError] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Default passcode is admin123
    if (passcode === 'admin123') {
      localStorage.setItem('quantora_auth', 'true');
      setIsAuthenticated(true);
      setAuthError(false);
      showToast('Welcome to Quantora IMS!', 'success');
    } else {
      setAuthError(true);
      showToast('Incorrect passcode. Try again.', 'error');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('quantora_auth');
    setIsAuthenticated(false);
    setPasscode('');
  };

  // ── Lock Screen View ───────────────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <div style={{ display: 'flex', height: '100vh', width: '100vw', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(circle at 10% 20%, #1a1a2e 0%, #11111e 90%)', fontFamily: 'var(--font-body)' }}>
        <div className="card" style={{ width: '100%', maxWidth: 400, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(26,26,46,0.85)', backdropFilter: 'blur(10px)', boxShadow: 'var(--shadow-xl)', padding: 10 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 'var(--sp-6) var(--sp-4)', textAlign: 'center' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(0,128,96,0.15)', border: '1px solid rgba(0,128,96,0.3)', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', marginBottom: 'var(--sp-4)', color: 'var(--primary)', boxShadow: '0 0 20px rgba(0,128,96,0.2)' }}>
              <Lock size={28} style={{ color: 'var(--primary)' }} />
            </div>
            <h1 style={{ fontFamily: 'var(--font-heading)', color: '#fff', fontSize: 24, fontWeight: 800, marginBottom: 8, letterSpacing: '-0.5px' }}>Quantora IMS</h1>
            <p style={{ color: 'var(--sidebar-text)', fontSize: 13, marginBottom: 28 }}>Secure inventory connection port. Enter passcode to establish session.</p>

            <form onSubmit={handleLogin} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="form-group" style={{ textAlign: 'left', marginBottom: 0 }}>
                <label className="form-label" style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Dashboard Passcode</label>
                <input
                  type="password"
                  className="form-input"
                  style={{ background: 'rgba(0,0,0,0.25)', border: authError ? '1px solid var(--danger)' : '1px solid rgba(255,255,255,0.1)', color: '#fff', textAlign: 'center', fontSize: 18, letterSpacing: '4px', height: 48, borderRadius: 'var(--radius-lg)' }}
                  placeholder="••••••••"
                  value={passcode}
                  onChange={e => setPasscode(e.target.value)}
                  autoFocus
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ height: 44, justifyContent: 'center', borderRadius: 'var(--radius-lg)' }}>
                Access Console <ArrowRight size={16} />
              </button>
            </form>
            <div style={{ marginTop: 24, padding: '8px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius)', border: '1px solid rgba(255,255,255,0.05)', fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
              Demo Passcode: <strong style={{ color: 'var(--primary)' }}>admin123</strong>
            </div>
          </div>
        </div>
        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </div>
    );
  }

  // ── Authorized View ────────────────────────────────────────────────────────
  const { title, sub } = PAGE_TITLES[page];

  return (
    <div className="app-shell">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">📦</div>
          <div>
            <div className="sidebar-logo-text">Quantora</div>
            <div className="sidebar-logo-badge">IMS</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section-title">Main Menu</div>
          {NAV.map(item => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                className={`nav-item ${page === item.id ? 'active' : ''}`}
                onClick={() => setPage(item.id as Page)}
              >
                <Icon className="nav-icon" size={18} />
                <span className="nav-label">{item.label}</span>
              </div>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-store-badge">
            <div className="store-dot" />
            <span className="store-name">quantora-dev</span>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <a
              href="https://quantora-dev.myshopify.com/admin"
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'rgba(255,255,255,0.45)', padding: '4px 6px', borderRadius: 6, transition: 'color 0.18s' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.8)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.45)')}
            >
              <Store size={12} /> Admin
            </a>
            <button
              onClick={handleLogout}
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'rgba(255,255,255,0.45)', padding: '4px 6px', borderRadius: 6, transition: 'color 0.18s', width: 'auto' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.8)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.45)')}
            >
              Lock Console
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="main-content">
        {/* Topbar */}
        <header className="topbar">
          <div>
            <span className="topbar-title">{title}</span>
            <span className="topbar-subtitle">/ {sub}</span>
          </div>
          <div className="topbar-right">
            <div className="topbar-mode-badge">
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--primary)', display: 'inline-block', animation: 'pulse 2s infinite' }} />
              Live · Shopify Connected
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="page-content">
          {page === 'overview' && <Overview />}
          {page === 'inventory' && <Inventory showToast={showToast} onScanClick={() => setScannerOpen(true)} />}
          {page === 'sales' && <SalesOrders showToast={showToast} />}
          {page === 'activity' && <ActivityLog showToast={showToast} />}
          {page === 'suppliers' && <Suppliers showToast={showToast} />}
          {page === 'orders' && <PurchaseOrders showToast={showToast} />}
          {page === 'alerts' && <Alerts showToast={showToast} />}
        </main>
      </div>

      {/* Floating Widgets */}
      <ChatWidget />
      {scannerOpen && <BarcodeScanner onClose={() => setScannerOpen(false)} showToast={showToast} />}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
