// src/components/BarcodeScanner.tsx
import { useEffect, useRef, useState } from 'react';
import { X, ScanLine, CheckCircle } from 'lucide-react';
import { api } from '../api/client';

interface BarcodeScannerProps { onClose: () => void; showToast: (msg: string, type?: any) => void; }

export default function BarcodeScanner({ onClose, showToast }: BarcodeScannerProps) {
  const scannerRef = useRef<any>(null);
  const divRef = useRef<HTMLDivElement>(null);
  const [found, setFound] = useState<any>(null);
  const [scanning, setScanning] = useState(true);
  const [manualCode, setManualCode] = useState('');

  useEffect(() => {
    let html5QrCode: any;
    const init = async () => {
      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        html5QrCode = new Html5Qrcode('qr-reader');
        scannerRef.current = html5QrCode;
        await html5QrCode.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 220, height: 120 } },
          handleScan,
          () => {}
        );
      } catch (e) {
        showToast('Camera not available. Use manual entry below.', 'warning');
        setScanning(false);
      }
    };
    init();
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const handleScan = async (code: string) => {
    if (scannerRef.current) {
      try { await scannerRef.current.stop(); } catch {}
    }
    setScanning(false);
    await lookup(code);
  };

  const lookup = async (code: string) => {
    try {
      const res = await api.getProductByBarcode(code);
      setFound(res.product);
      showToast(`Found: ${res.product.title}`, 'success');
    } catch {
      showToast(`No product found for barcode: ${code}`, 'error');
      setFound(null);
    }
  };

  const handleManual = async () => {
    if (!manualCode.trim()) return;
    await lookup(manualCode.trim());
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title"><ScanLine size={18} style={{ verticalAlign: 'middle', marginRight: 8 }} />Barcode Scanner</span>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="modal-body">
          {/* Camera Viewport */}
          <div className="scanner-viewport" style={{ marginBottom: 'var(--sp-4)' }}>
            <div ref={divRef} id="qr-reader" style={{ width: '100%' }} />
            {scanning && (
              <div className="scanner-guide">
                <div className="scanner-frame" />
              </div>
            )}
            {!scanning && !found && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40, flexDirection: 'column', gap: 12, color: 'var(--text-muted)' }}>
                <ScanLine size={40} opacity={0.4} />
                <span>Camera unavailable or scan complete</span>
              </div>
            )}
          </div>

          {/* Manual Entry */}
          <div style={{ display: 'flex', gap: 'var(--sp-2)', marginBottom: 'var(--sp-4)' }}>
            <input className="form-input" placeholder="Enter barcode manually..." value={manualCode} onChange={e => setManualCode(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleManual()} />
            <button className="btn btn-primary" onClick={handleManual}>Search</button>
          </div>

          {/* Result */}
          {found && (
            <div style={{ background: 'var(--primary-light)', border: '1px solid rgba(0,128,96,0.25)', borderRadius: 'var(--radius-lg)', padding: 'var(--sp-4)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)', marginBottom: 'var(--sp-3)' }}>
                <CheckCircle size={20} color="var(--primary)" />
                <span style={{ fontWeight: 700, color: 'var(--primary)' }}>Product Found!</span>
              </div>
              <div style={{ display: 'flex', gap: 'var(--sp-3)' }}>
                {found.image_url && <img src={found.image_url} style={{ width: 60, height: 60, borderRadius: 'var(--radius)', objectFit: 'cover' }} alt={found.title} />}
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>{found.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>SKU: {found.sku || '—'} | Price: ${found.price}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--sp-2)' }}>
                    {found.inventory?.map((inv: any) => (
                      <span key={inv.location_id} style={{ fontSize: 12, background: 'var(--surface)', padding: '3px 10px', borderRadius: 'var(--radius-full)', border: '1px solid var(--border)' }}>
                        {inv.location_name}: <strong>{inv.available}</strong>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
