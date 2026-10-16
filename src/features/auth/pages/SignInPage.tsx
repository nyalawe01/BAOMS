import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AlertCircle } from 'lucide-react';
import { useAuth } from '@/features/auth/useAuth';
import { isSupabaseConfigured } from '@/lib/supabase';
import { Badge } from '@/components/ui/Badge';

export const SignInPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, isLoading, mfaPending, verifyMfa, cancelMfa } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email.trim() || !password) {
      setErrorMessage(t('auth.fillAllFields', 'Please enter both email address and password.'));
      return;
    }

    if (password.length < 6) {
      setErrorMessage(t('auth.passwordTooShort', 'Password must be at least 6 characters long.'));
      return;
    }

    const result = await signIn(email, password, rememberMe);

    if (result.success) {
      navigate(from, { replace: true });
    } else if (result.mfaRequired) {
      setErrorMessage('');
    } else {
      setErrorMessage(result.error || t('auth.invalidCredentials', 'Sign in failed. Check your credentials.'));
      if (result.error?.includes('deactivated')) {
        navigate('/account-deactivated');
      }
    }
  };

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

  return (
    <main className="bg-slate-50 min-h-screen flex items-center justify-center px-4 py-8 relative">
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 flex flex-col md:flex-row overflow-hidden max-w-screen-xl w-full mx-4 min-h-[620px]">
        {/* Left Side: Lottie Image & Institutional Branding */}
        <div className="md:w-1/2 w-full bg-slate-50 flex flex-col items-center justify-center p-8 sm:p-12 border-b md:border-b-0 md:border-r border-slate-200 relative overflow-hidden">
          <div className="flex items-center gap-3 mb-6">
            <img
              src="/logo.png"
              alt="BAOMS Logo"
              className="h-12 w-12 object-contain"
            />
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight leading-none">
                BAOMS
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Babawatoto Organization
              </p>
            </div>
          </div>

          {/* Embedded Lottie Animation */}
          <div className="w-full max-w-sm aspect-square flex items-center justify-center overflow-hidden">
            <iframe
              src="https://lottie.host/embed/5cf8b905-5a7f-462c-b066-96626bb67908/FhKmmHOj6w.lottie"
              className="w-full h-full border-0 pointer-events-none"
              title="Authentication Animation"
            />
          </div>

          <div className="text-center mt-6 max-w-xs">
            <h3 className="text-base font-semibold text-slate-800">
              Management & Records Portal
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Secure administrative access for operations, finances, personnel, and correspondence.
            </p>
          </div>
        </div>

        {/* Right Side: Formulario */}
        <div className="md:w-1/2 w-full flex flex-col justify-center p-8 sm:p-12 bg-white">
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

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-[#D68904] text-white font-semibold text-base rounded-lg hover:bg-[#b86e03] transition duration-300 shadow-md disabled:opacity-50"
                >
                  {t('auth.verifyMfaButton', 'Verify & Sign In')}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    cancelMfa();
                    setMfaCode('');
                    setErrorMessage('');
                  }}
                  className="w-full py-2 text-xs text-slate-600 hover:text-slate-900"
                >
                  {t('common.cancel', 'Cancel & Back')}
                </button>
              </form>
            </div>
          ) : (
            <div className="max-w-md mx-auto w-full">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#D68904] mb-2 text-center">
                Welcome Back
              </h2>
              <p className="text-xs text-center text-slate-500 mb-8">
                {t('auth.signInTitle', 'Staff Portal Sign In')} — {t('app.shortName', 'BAOMS')}
              </p>

              {errorMessage && (
                <div
                  className="mb-6 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3.5 text-xs text-red-700"
                  role="alert"
                >
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    {t('auth.email', 'Email Address')}
                  </label>
                  <div className="relative">
                    <img
                      src="https://cdn-icons-png.flaticon.com/512/561/561127.png"
                      alt="Email"
                      className="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 opacity-70 pointer-events-none"
                    />
                    <input
                      type="email"
                      id="email"
                      name="email"
                      aria-label="Email Address"
                      placeholder="name@babawatoto.or.tz"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="pl-12 pr-4 py-3 w-full rounded-lg bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#D68904] text-gray-700 text-base shadow-xs transition duration-200 border border-transparent focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    {t('auth.password', 'Password')}
                  </label>
                  <div className="relative">
                    <img
                      src="https://cdn-icons-png.flaticon.com/512/3064/3064155.png"
                      alt="Password"
                      className="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 opacity-70 pointer-events-none"
                    />
                    <input
                      type="password"
                      id="password"
                      name="password"
                      aria-label="Password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="pl-12 pr-4 py-3 w-full rounded-lg bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#D68904] text-gray-700 text-base shadow-xs transition duration-200 border border-transparent focus:bg-white"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 cursor-pointer text-gray-600">
                    <input
                      type="checkbox"
                      id="remember"
                      name="remember"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-slate-300 text-charcoal-900 focus:ring-slate-400"
                    />
                    <span className="text-sm text-slate-700">
                      {t('auth.rememberMe', 'Remember me')}
                    </span>
                  </label>

                  <Link
                    to="/reset-password"
                    className="text-sm font-semibold text-[#D68904] hover:underline"
                  >
                    {t('auth.forgotPassword', 'Forgot password?')}
                  </Link>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-[#D68904] text-white font-semibold text-lg rounded-lg hover:bg-[#b86e03] transition duration-300 shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isLoading ? (
                    <span>Signing in...</span>
                  ) : (
                    <span>{t('auth.signInButton', 'Log In')} / Sign In</span>
                  )}
                </button>
              </form>

              <div className="text-center mt-6">
                <p className="text-gray-600 text-sm">
                  Don't have an account?
                  <Link
                    to="/register"
                    className="text-[#D68904] font-semibold hover:underline ml-1"
                  >
                    Register
                  </Link>
                </p>
                <p className="text-[11px] text-gray-400 mt-2">
                  Official @babawatoto.or.tz organization email required for self-registration.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
};
