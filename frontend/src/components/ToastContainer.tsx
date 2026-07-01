// src/components/ToastContainer.tsx
import { CheckCircle, XCircle, AlertTriangle, X } from 'lucide-react';
import type { Toast } from '../hooks/useToast';

const icons = {
  success: <CheckCircle size={16} color="var(--success)" />,
  error: <XCircle size={16} color="var(--danger)" />,
  warning: <AlertTriangle size={16} color="var(--warning)" />,
};

export default function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: string) => void }) {
  if (!toasts.length) return null;
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          {icons[t.type]}
          <span style={{ flex: 1 }}>{t.message}</span>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={() => onRemove(t.id)}>
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
