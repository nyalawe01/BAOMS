import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Shield, ArrowLeft, Mail, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/features/auth/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';

export const PasswordResetPage: React.FC = () => {
  const { t } = useTranslation();
  const { requestPasswordReset, isLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email.trim()) {
      setErrorMessage(t('auth.enterEmail', 'Please enter your email address.'));
      return;
    }

    const result = await requestPasswordReset(email);
    if (result.success) {
      setIsSubmitted(true);
    } else {
      setErrorMessage(result.error || 'Failed to send password recovery request.');
    }
  };

  return (
    <div className="min-h-screen w-screen flex flex-col justify-center items-center bg-surface-bg px-4 py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#D68904] text-white shadow-card">
            <Shield className="h-6 w-6" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-charcoal">
            {t('app.shortName', 'BAOMS')}
          </h1>
        </div>

        <Card className="shadow-modal border-surface-border">
          <CardHeader>
            <CardTitle>{t('auth.resetTitle', 'Password Recovery')}</CardTitle>
            <CardDescription>
              {t(
                'auth.resetSubtitle',
                'Enter your registered staff email address to receive secure recovery instructions.'
              )}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {isSubmitted ? (
              <div className="rounded-lg border border-status-success-border bg-status-success-bg p-4 space-y-2 text-status-success-text">
                <div className="flex items-center gap-2 font-semibold text-xs sm:text-sm">
                  <CheckCircle2 className="h-5 w-5 shrink-0" />
                  <span>{t('auth.instructionsSentTitle', 'Recovery Instructions Dispatched')}</span>
                </div>
                <p className="text-xs leading-relaxed opacity-95">
                  {t(
                    'auth.instructionsSentDesc',
                    'If the email address is associated with an active BAO staff profile, recovery instructions have been sent.'
                  )}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {errorMessage && (
                  <div
                    className="flex items-start gap-2.5 rounded-md border border-status-danger-border bg-status-danger-bg p-3 text-xs text-status-danger-text"
                    role="alert"
                  >
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <Input
                  id="reset-email"
                  type="email"
                  label={t('auth.email', 'Email Address')}
                  placeholder="name@babawatoto.org"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />

                <Button
                  type="submit"
                  className="w-full bg-[#D68904] hover:bg-[#b86e03] text-white"
                  isLoading={isLoading}
                >
                  <Mail className="h-4 w-4 mr-1.5" />
                  <span>{t('auth.sendRecoveryButton', 'Send Recovery Link')}</span>
                </Button>
              </form>
            )}
          </CardContent>

          <CardFooter className="border-t border-surface-border/60 justify-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#D68904] hover:text-[#b86e03] transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>{t('auth.backToSignIn', 'Return to Sign In')}</span>
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};
