import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@/features/auth/AuthContext';
import { ToastProvider } from '@/lib/ToastContext';
import { ToastContainer } from '@/components/ui/Toast';
import { AppRoutes } from '@/routes/AppRoutes';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import { useAuth } from '@/features/auth/useAuth';
import { Analytics } from '@vercel/analytics/react';
import { useTranslation } from 'react-i18next';

const SessionExpiredDialog: React.FC = () => {
  const { t } = useTranslation();
  const { isSessionExpired, signOut, dismissSessionExpired } = useAuth();

  if (!isSessionExpired) return null;

  return (
    <ConfirmationDialog
      isOpen={isSessionExpired}
      onClose={dismissSessionExpired}
      onConfirm={async () => {
        dismissSessionExpired();
        await signOut();
      }}
      title={t('auth.sessionExpiredTitle', 'Session Expired')}
      message={t(
        'auth.sessionExpiredDesc',
        'Your session has expired due to inactivity or token renewal. Please sign in again to continue.'
      )}
      confirmText={t('auth.signInButton', 'Sign In Again')}
      variant="warning"
    />
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <AppRoutes />
          <SessionExpiredDialog />
          <ToastContainer />
          <Analytics />
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
};

export default App;
