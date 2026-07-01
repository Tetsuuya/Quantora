// src/App.tsx
import { useState } from 'react';
import { LayoutDashboard, Package, Truck, ShoppingCart, Bell, Store, Link } from 'lucide-react';
import './index.css';
import { useToast } from './hooks/useToast';
import ToastContainer from './components/ToastContainer';
import Overview from './components/Overview';
import Inventory from './components/Inventory';
import Suppliers from './components/Suppliers';
import PurchaseOrders from './components/PurchaseOrders';
import Alerts from './components/Alerts';
import ChatWidget from './components/ChatWidget';
import BarcodeScanner from './components/BarcodeScanner';

type Page = 'overview' | 'inventory' | 'suppliers' | 'orders' | 'alerts';

const NAV = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'inventory', label: 'Inventory', icon: Package },
  { id: 'suppliers', label: 'Suppliers', icon: Truck },
  { id: 'orders', label: 'Purchase Orders', icon: ShoppingCart },
  { id: 'alerts', label: 'Alerts', icon: Bell },
];

const PAGE_TITLES: Record<Page, { title: string; sub: string }> = {
  overview: { title: 'Dashboard', sub: 'Live Shopify data' },
  inventory: { title: 'Inventory Manager', sub: 'Real-time stock levels' },
  suppliers: { title: 'Supplier Directory', sub: 'Manage vendor contacts' },
  orders: { title: 'Purchase Orders', sub: 'Restock management' },
  alerts: { title: 'Stock Alerts', sub: 'Low-stock notifications' },
};

export default function App() {
  const [page, setPage] = useState<Page>('overview');
  const [scannerOpen, setScannerOpen] = useState(false);
  const { toasts, showToast, removeToast } = useToast();

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
            <a
              href="https://partners.shopify.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'rgba(255,255,255,0.45)', padding: '4px 6px', borderRadius: 6, transition: 'color 0.18s' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.8)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.45)')}
            >
              <Link size={12} /> Partners
            </a>
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
