import React, { createContext, useContext, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  // Function to add a new toast
  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    
    // Auto remove after 4 seconds
    setTimeout(() => removeToast(id), 4000); 
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      
      {/* Toast Container (Fixed Position) */}
      <div className="fixed top-24 right-4 z-[9999] flex flex-col gap-3 pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <Toast key={toast.id} {...toast} onClose={() => removeToast(toast.id)} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

// The Individual Toast Component
const Toast = ({ message, type, onClose }) => {
  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-400" />,
    error: <AlertCircle className="w-5 h-5 text-red-400" />,
    info: <Info className="w-5 h-5 text-blue-400" />
  };

  const styles = {
    success: 'bg-gray-900/95 border-green-500/50 text-white shadow-green-500/10',
    error: 'bg-gray-900/95 border-red-500/50 text-white shadow-red-500/10',
    info: 'bg-gray-900/95 border-blue-500/50 text-white shadow-blue-500/10'
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 50, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 20, scale: 0.95 }}
      layout
      className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg backdrop-blur-xl min-w-[300px] max-w-md ${styles[type] || styles.info}`}
    >
      {icons[type] || icons.info}
      <p className="flex-grow text-sm font-medium">{message}</p>
      <button onClick={onClose} className="p-1 transition-colors rounded-full hover:bg-white/10">
        <X className="w-4 h-4 opacity-50 hover:opacity-100" />
      </button>
    </motion.div>
  );
};