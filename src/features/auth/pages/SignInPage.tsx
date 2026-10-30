import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AlertCircle } from 'lucide-react';
import { useAuth } from '@/features/auth/useAuth';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { AuthForm } from '@/components/ui/premium-auth';

export const SignInPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, isLoading, mfaPending, verifyMfa, cancelMfa, requestPasswordReset } = useAuth();

  const [mfaCode, setMfaCode] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname || '/';

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!mfaCode.trim()) {
      setErrorMessage(t('auth.enterMfaCode', 'Please enter your 6-digit verification code.'));
      return;
    }

    const result = await verifyMfa(mfaCode);
    if (result.success) {
      navigate(from, { replace: true });
    } else {
      setErrorMessage(result.error || 'MFA verification failed.');
    }
  };

  const handleSignIn = async (email: string, password: string, rememberMe: boolean) => {
    const result = await signIn(email, password, rememberMe);
    if (result.success) {
      navigate(from, { replace: true });
      return { success: true };
    } else if (result.mfaRequired) {
      return { success: false, mfaRequired: true };
    } else {
      if (result.error?.includes('deactivated')) {
        navigate('/account-deactivated');
      }
      return {
        success: false,
        error: result.error || t('auth.invalidCredentials', 'Sign in failed. Check your credentials.'),
      };
    }
  };

  const handleResetPassword = async (email: string) => {
    return await requestPasswordReset(email);
  };

  const handleSignUp = async (_data: { email: string; name: string }) => {
    navigate('/register');
    return { success: true };
  };

  return (
    <main className="bg-slate-50 min-h-screen flex items-center justify-center p-3 sm:p-6 lg:p-8 relative">
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl border border-slate-200 flex flex-col md:flex-row overflow-hidden max-w-screen-xl w-full min-h-[520px] md:min-h-[620px]">
        {/* Left Side: Lottie Image & Institutional Branding */}
        <div className="md:w-1/2 w-full bg-slate-50 flex flex-col items-center justify-center p-6 sm:p-8 md:p-12 border-b md:border-b-0 md:border-r border-slate-200 relative overflow-hidden">
          <div className="flex items-center gap-3 mb-2 md:mb-6">
            <img
              src="/logo.png"
              alt="BAOMS Logo"
              className="h-10 w-10 sm:h-12 sm:w-12 object-contain"
            />
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight leading-none">
                BAOMS
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Babawatoto Organization
              </p>
            </div>
          </div>

          {/* Embedded Lottie Animation - Visible on Tablets & Laptops (Preserved) */}
          <div className="hidden md:flex w-full max-w-sm aspect-square items-center justify-center overflow-hidden">
            <iframe
              src="https://lottie.host/embed/5cf8b905-5a7f-462c-b066-96626bb67908/FhKmmHOj6w.lottie"
              className="w-full h-full border-0 pointer-events-none"
              title="Authentication Animation"
            />
          </div>

          <div className="text-center mt-2 md:mt-6 max-w-xs">
            <h3 className="text-sm sm:text-base font-semibold text-slate-800">
              Management & Records Portal
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 sm:mt-1 hidden sm:block">
              Secure administrative access for operations, finances, personnel, and correspondence.
            </p>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="md:w-1/2 w-full flex flex-col justify-center p-4 sm:p-6 md:p-10 bg-white">
          {mfaPending ? (
            <div className="max-w-md mx-auto w-full">
              <div className="text-center space-y-1 mb-6">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Badge variant="warning" withDot>
                    AAL2 Security
                  </Badge>
                </div>
                <h2 className="text-2xl font-bold text-slate-900">
                  {t('auth.mfaTitle', 'Two-Factor Authentication')}
                </h2>
                <p className="text-xs text-slate-500">
                  {t(
                    'auth.mfaSubtitle',
                    'Enter the 6-digit verification code from your authenticator app.'
                  )}
                </p>
              </div>

              {errorMessage && (
                <div
                  className="mb-5 flex items-start gap-2.5 rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-700"
                  role="alert"
                >
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleMfaSubmit} className="space-y-5">
                <div>
                  <label
                    htmlFor="mfa-code"
                    className="mb-2 text-slate-900 font-medium text-sm inline-block"
                  >
                    {t('auth.mfaCode', 'Authenticator Code')}
                  </label>
                  <input
                    id="mfa-code"
                    type="text"
                    maxLength={6}
                    placeholder="123456"
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                    className="px-3 py-2.5 text-center font-mono text-lg tracking-widest text-slate-900 rounded-md bg-white w-full border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#D68904]"
                    autoFocus
                    required
                  />
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  fullWidth
                  isLoading={isLoading}
                  disabled={isLoading}
                >
                  {t('auth.verifyMfaButton', 'Verify & Sign In')}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  fullWidth
                  onClick={() => {
                    cancelMfa();
                    setMfaCode('');
                    setErrorMessage('');
                  }}
                >
                  {t('common.cancel', 'Cancel & Back')}
                </Button>
              </form>
            </div>
          ) : (
            <div className="max-w-md mx-auto w-full">
              <AuthForm
                initialMode="login"
                className="p-0"
                onSignIn={handleSignIn}
                onSignUp={handleSignUp}
                onResetPassword={handleResetPassword}
                onSuccess={() => navigate(from, { replace: true })}
              />
              <p className="text-[11px] text-center text-gray-400 mt-4">
                Official @babawatoto.or.tz organization credentials required.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
};
