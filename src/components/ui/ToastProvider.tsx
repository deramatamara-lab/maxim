/**
 * Toast Provider Component
 * Manages multiple toast notifications with queue system
 */

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { Toast, ToastType } from './Toast';
import { useHaptics } from '@/hooks/useHaptics';

// Re-export Toast components for convenience
export { Toast, ToastType } from './Toast';

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  hideToast: (id: string) => void;
  clearAll: () => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

interface ToastProviderProps {
  children: React.ReactNode;
  maxToasts?: number;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({
  children,
  maxToasts = 3,
}) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const toastIdRef = useRef(0);
  const haptics = useHaptics();

  const showToast = useCallback((
    message: string,
    type: ToastType = 'info',
    duration: number = 3000
  ) => {
    const id = `toast-${toastIdRef.current++}`;
    const newToast: ToastMessage = { id, message, type, duration };

    setToasts(prev => {
      // Remove oldest if exceeding max
      const filtered = prev.length >= maxToasts ? prev.slice(1) : prev;
      return [...filtered, newToast];
    });

    // Trigger haptic based on type
    haptics.trigger(type === 'error' ? 'error' : 'tap');
  }, [haptics, maxToasts]);

  const hideToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setToasts([]);
  }, []);

  const contextValue: ToastContextType = {
    showToast,
    hideToast,
    clearAll,
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <ToastContainer toasts={toasts} onHide={hideToast} />
    </ToastContext.Provider>
  );
};

// Toast Container with staggered positioning
const ToastContainer: React.FC<{
  toasts: ToastMessage[];
  onHide: (id: string) => void;
}> = ({ toasts, onHide }) => {
  if (toasts.length === 0) return null;

  return (
    <View style={styles.container} pointerEvents="box-none">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => onHide(toast.id)}
          visible={true}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 60,
    zIndex: 9999,
    gap: 8,
  },
});

export default ToastProvider;
