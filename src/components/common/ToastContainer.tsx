import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import ToastNotification from './ToastNotification';

interface Toast {
  id: string;
  title: string;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

class ToastManager {
  private static instance: ToastManager;
  private listeners: ((toasts: Toast[]) => void)[] = [];
  private toasts: Toast[] = [];

  static getInstance(): ToastManager {
    if (!ToastManager.instance) {
      ToastManager.instance = new ToastManager();
    }
    return ToastManager.instance;
  }

  show(toast: Omit<Toast, 'id'>): void {
    const id = Date.now().toString();
    const newToast: Toast = { ...toast, id };
    
    this.toasts = [...this.toasts, newToast];
    this.notifyListeners();

    // Auto remove after duration
    setTimeout(() => {
      this.remove(id);
    }, toast.duration || 4000);
  }

  remove(id: string): void {
    this.toasts = this.toasts.filter(toast => toast.id !== id);
    this.notifyListeners();
  }

  subscribe(listener: (toasts: Toast[]) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.toasts));
  }
}

export const toastManager = ToastManager.getInstance();

const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const unsubscribe = toastManager.subscribe(setToasts);
    return unsubscribe;
  }, []);

  return (
    <View style={styles.container} pointerEvents="box-none">
      {toasts.map((toast, index) => (
        <View key={toast.id} style={[styles.toastWrapper, { top: 60 + (index * 80) }]}>
          <ToastNotification
            title={toast.title}
            message={toast.message}
            type={toast.type}
            duration={toast.duration}
            visible={true}
            onDismiss={() => toastManager.remove(toast.id)}
          />
        </View>
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
    bottom: 0,
    zIndex: 9999,
  },
  toastWrapper: {
    position: 'absolute',
    left: 16,
    right: 16,
  },
});

export default ToastContainer;
