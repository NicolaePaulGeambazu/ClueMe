import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export const useAuthGuard = () => {
  const { requireAuth } = useAuth();
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  const guardAction = (action: () => void, customMessage?: string) => {
    if (requireAuth()) {
      action();
    } else {
      setShowLoginPrompt(true);
    }
  };

  const executeAfterAuth = (action: () => void) => {
    action();
    setShowLoginPrompt(false);
  };

  return {
    showLoginPrompt,
    setShowLoginPrompt,
    guardAction,
    executeAfterAuth,
  };
};
