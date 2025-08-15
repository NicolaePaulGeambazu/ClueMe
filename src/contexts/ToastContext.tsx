import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import ToastNotification from '../components/common/ToastNotification';
import globalNotificationService, { GlobalNotificationData } from '../services/globalNotificationService';

interface ToastContextType {
  showToast: (notification: GlobalNotificationData) => void;
  hideToast: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

interface ToastProviderProps {
  children: React.ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toastNotification, setToastNotification] = useState<GlobalNotificationData | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  const showToast = useCallback((notification: GlobalNotificationData) => {
    console.log('[ToastContext] Showing toast:', notification);
    setToastNotification(notification);
    setIsVisible(true);
  }, []);

  const hideToast = useCallback(() => {
    console.log('[ToastContext] Hiding toast');
    setIsVisible(false);
    setToastNotification(null);
  }, []);

  const handleToastPress = useCallback(() => {
    console.log('[ToastContext] Toast pressed');
    // Handle navigation based on notification type
    if (toastNotification?.reminderId) {
      // Navigate to reminder detail
      console.log('[ToastContext] Navigating to reminder:', toastNotification.reminderId);
      // You can implement navigation logic here
    }
    hideToast();
  }, [toastNotification, hideToast]);

  useEffect(() => {
    // Register with global notification service
    globalNotificationService.registerToastCallback(showToast);

    // Cleanup on unmount
    return () => {
      globalNotificationService.unregisterToastCallback(showToast);
    };
  }, [showToast]);

  const contextValue: ToastContextType = {
    showToast,
    hideToast,
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      {toastNotification && (
        <ToastNotification
          visible={isVisible}
          title={toastNotification.title}
          message={toastNotification.message}
          type={toastNotification.type}
          onClose={hideToast}
          onPress={handleToastPress}
        />
      )}
    </ToastContext.Provider>
  );
};
