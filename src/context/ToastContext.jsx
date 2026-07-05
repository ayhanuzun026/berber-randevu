import { createContext, useContext, useState, useCallback, useRef } from 'react';
import { FiCheckCircle, FiAlertCircle, FiInfo, FiX } from 'react-icons/fi';
import './ToastContext.css';

const ToastContext = createContext(null);

let idCounter = 0;

const ICONS = {
  success: FiCheckCircle,
  error: FiAlertCircle,
  info: FiInfo,
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [confirmState, setConfirmState] = useState(null);
  const confirmResolve = useRef(null);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message, type = 'info', duration = 4000) => {
      const id = ++idCounter;
      setToasts((prev) => [...prev, { id, message, type }]);
      if (duration > 0) {
        setTimeout(() => dismiss(id), duration);
      }
      return id;
    },
    [dismiss]
  );

  // Promise tabanlı onay: const ok = await confirm('Emin misiniz?')
  const confirm = useCallback(
    (message, { confirmText = 'Evet', cancelText = 'Vazgeç', danger = false } = {}) =>
      new Promise((resolve) => {
        confirmResolve.current = resolve;
        setConfirmState({ message, confirmText, cancelText, danger });
      }),
    []
  );

  const handleConfirm = (result) => {
    setConfirmState(null);
    if (confirmResolve.current) {
      confirmResolve.current(result);
      confirmResolve.current = null;
    }
  };

  return (
    <ToastContext.Provider value={{ toast, confirm }}>
      {children}

      <div className="toast-container" role="region" aria-live="polite">
        {toasts.map((t) => {
          const Icon = ICONS[t.type] || FiInfo;
          return (
            <div key={t.id} className={`toast toast--${t.type}`}>
              <Icon className="toast__icon" size={18} />
              <span className="toast__msg">{t.message}</span>
              <button className="toast__close" onClick={() => dismiss(t.id)} aria-label="Kapat">
                <FiX size={16} />
              </button>
            </div>
          );
        })}
      </div>

      {confirmState && (
        <div className="confirm-overlay" onClick={() => handleConfirm(false)}>
          <div className="confirm-box" onClick={(e) => e.stopPropagation()}>
            <p className="confirm-box__msg">{confirmState.message}</p>
            <div className="confirm-box__actions">
              <button className="btn btn-secondary btn-sm" onClick={() => handleConfirm(false)}>
                {confirmState.cancelText}
              </button>
              <button
                className={`btn btn-sm ${confirmState.danger ? 'confirm-box__danger' : 'btn-primary'}`}
                onClick={() => handleConfirm(true)}
              >
                {confirmState.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
}
