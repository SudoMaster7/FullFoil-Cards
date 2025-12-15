import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast deve ser usado dentro de um ToastProvider');
  }
  return context;
};

const ToastIcon = ({ type }) => {
  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-400" />,
    error: <XCircle className="w-5 h-5 text-red-400" />,
    warning: <AlertCircle className="w-5 h-5 text-yellow-400" />,
    info: <Info className="w-5 h-5 text-blue-400" />,
  };
  return icons[type] || icons.info;
};

const Toast = ({ toast, onClose }) => {
  const bgColors = {
    success: 'bg-green-500/10 border-green-500/30',
    error: 'bg-red-500/10 border-red-500/30',
    warning: 'bg-yellow-500/10 border-yellow-500/30',
    info: 'bg-blue-500/10 border-blue-500/30',
  };

  return (
    <div 
      className={`flex items-start gap-3 p-4 rounded-xl border backdrop-blur-sm ${bgColors[toast.type]} animate-slide-in`}
      style={{ 
        animation: 'slideIn 0.3s ease-out forwards'
      }}
    >
      <ToastIcon type={toast.type} />
      <div className="flex-1 min-w-0">
        {toast.title && (
          <p className="font-semibold text-sm text-white">{toast.title}</p>
        )}
        <p className="text-sm text-gray-300">{toast.message}</p>
      </div>
      <button
        onClick={() => onClose(toast.id)}
        className="p-1 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
      >
        <X className="w-4 h-4 text-gray-400" />
      </button>
    </div>
  );
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback(({ type = 'info', title, message, duration = 4000 }) => {
    const id = Date.now() + Math.random();
    
    setToasts(prev => [...prev, { id, type, title, message }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }

    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  // Helper functions
  const success = useCallback((message, title) => addToast({ type: 'success', message, title }), [addToast]);
  const error = useCallback((message, title) => addToast({ type: 'error', message, title }), [addToast]);
  const warning = useCallback((message, title) => addToast({ type: 'warning', message, title }), [addToast]);
  const info = useCallback((message, title) => addToast({ type: 'info', message, title }), [addToast]);

  return (
    <ToastContext.Provider value={{ addToast, removeToast, success, error, warning, info }}>
      {children}
      
      {/* Toast Container */}
      <div className="fixed top-4 right-4 left-4 sm:left-auto sm:w-96 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map(toast => (
          <div key={toast.id} className="pointer-events-auto">
            <Toast toast={toast} onClose={removeToast} />
          </div>
        ))}
      </div>

      {/* Animation styles */}
      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </ToastContext.Provider>
  );
};

export default ToastContext;
