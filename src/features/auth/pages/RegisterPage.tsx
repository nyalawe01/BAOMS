import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Lock,
  Mail,
  User,
  Phone,
  ArrowRight,
  Eye,
  EyeOff,
  Building,
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { createNotification } from '@/services/notificationsService';
import { Badge } from '@/components/ui/Badge';

const ALLOWED_DOMAIN = '@babawatoto.or.tz';

export const RegisterPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+255 754 ');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedSafeguarding, setAcceptedSafeguarding] = useState(false);

  const [errorMessage, setErrorMessage] = useState('');
  const [domainError, setDomainError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');

  // Validate email domain in real time
  const handleEmailChange = (val: string) => {
    setEmail(val);
    const trimmed = val.trim().toLowerCase();
    if (trimmed && trimmed.includes('@')) {
      if (!trimmed.endsWith(ALLOWED_DOMAIN)) {
        setDomainError(`Official organization email required: address must end with ${ALLOWED_DOMAIN}`);
      } else {
        setDomainError('');
      }
    } else {
      setDomainError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = fullName.trim();
    const cleanPhone = phone.trim();

    if (!cleanName || !cleanEmail || !password || !confirmPassword) {
      setErrorMessage(t('auth.fillAllFields', 'Please complete all required fields.'));
      return;
    }

    if (!cleanEmail.endsWith(ALLOWED_DOMAIN)) {
      setErrorMessage(`Registration restricted: Only official ${ALLOWED_DOMAIN} email addresses are authorized.`);
      return;
    }

    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters in length.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('The passwords entered do not match. Please re-enter.');
      return;
    }

    if (!acceptedSafeguarding) {
      setErrorMessage('You must acknowledge the organizational safeguarding declaration to proceed.');
      return;
    }

    setIsLoading(true);

    try {
      if (!isSupabaseConfigured) {
        throw new Error('Database connection is not configured.');
      }

      // Sign up with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            full_name: cleanName,
            phone: cleanPhone,
            approval_status: 'pending_hr',
          },
          emailRedirectTo: `${window.location.origin}/login`,
        },
      });

      if (error) {
        throw error;
      }

      if (!data.user) {
        throw new Error('Registration could not be completed. Please try again.');
      }

      // Explicitly ensure the profile row is present in 'pending_hr' status
      if (data.user?.id) {
        await supabase
          .from('profiles')
          .upsert({
            id: data.user.id,
            display_name: cleanName,
            official_email: cleanEmail,
            phone_number: cleanPhone,
            approval_status: 'pending_hr',
            is_active: false,
            staged_details: {
              fullName: cleanName,
              officialEmail: cleanEmail,
              phone: cleanPhone,
            },
          })
          .catch((upsertErr) => {
            console.warn('Profile upsert note (trigger may have handled):', upsertErr);
          });
      }

      // Notify HR and Administrators
      createNotification({
        title: 'New Staff Self-Registration',
        message: `${cleanName} (${cleanEmail}) has submitted registration and is waiting for HR onboarding review.`,
        type: 'hr',
        targetRole: 'hr_administrator',
        link: '/users',
        metadata: {
          action: 'review_registration',
          email: cleanEmail,
          userId: data.user.id,
        },
      });

      setRegisteredEmail(cleanEmail);
      setRegistrationSuccess(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed. Please contact IT support.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="bg-slate-50 min-h-screen flex items-center justify-center p-3 sm:p-6 lg:p-8 relative">
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl border border-slate-200 flex flex-col md:flex-row overflow-hidden max-w-screen-xl w-full min-h-[560px] md:min-h-[640px]">
        {/* Left Side: Institutional Context & Workflow Timeline */}
        <div className="md:w-5/12 w-full bg-slate-900 text-white flex flex-col justify-between p-6 sm:p-8 md:p-12 relative overflow-hidden">
          <div className="relative z-10">
            {/* Header / Brand */}
            <div className="flex items-center gap-3 mb-4 md:mb-8">
              <img src="/logo.png" alt="BAOMS Logo" className="h-10 w-10 sm:h-12 sm:w-12 object-contain" />
              <div>
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white leading-none">BAOMS</h1>
                <p className="text-xs text-amber-400 mt-1 font-medium">Babawatoto Organization</p>
              </div>
            </div>

            <div className="mb-4 md:mb-6">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-2 md:mb-3">
                <ShieldCheck className="w-3.5 h-3.5" />
                Authorized Staff Self-Registration
              </span>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight leading-snug">
                Join the Organization Management System
              </h2>
              <p className="text-xs text-slate-300 mt-1.5 md:mt-2 leading-relaxed">
                Staff accounts require an official organization email (<code className="text-amber-300">@babawatoto.or.tz</code>).
                All registrations undergo multi-stage administrative vetting prior to dashboard provisioning.
              </p>
            </div>

            {/* Stepper overview - Collapsible on small phones, visible on tablets & laptops */}
            <div className="hidden md:block space-y-4 pt-4 border-t border-slate-800">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-amber-500/20 border border-amber-400 text-amber-300 flex items-center justify-center text-xs font-bold shrink-0">
                  1
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white">Create Official Account</h4>
                  <p className="text-[11px] text-slate-400">Set your personal secret password & verify your official email.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 text-slate-400 flex items-center justify-center text-xs font-bold shrink-0">
                  2
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-300">HR Department Review</h4>
                  <p className="text-[11px] text-slate-400">HR completes your personal dossier, role, and department assignment.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 text-slate-400 flex items-center justify-center text-xs font-bold shrink-0">
                  3
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-300">Executive Director Approval</h4>
                  <p className="text-[11px] text-slate-400">Final executive authorization activates your role and unlocks your dashboard.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 pt-4 md:pt-6 mt-4 md:mt-6 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <span>© 2026 Babawatoto Organization</span>
            <span className="text-slate-500 hidden sm:inline">Security Standard ISO/IEC 27001</span>
          </div>
        </div>

        {/* Right Side: Registration Form or Success Screen */}
        <div className="md:w-7/12 w-full flex flex-col justify-center p-6 sm:p-8 md:p-12 bg-white">
          {registrationSuccess ? (
            <div className="max-w-md mx-auto w-full text-center py-6 animate-fadeIn">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center mb-4">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Registration Submitted!</h2>
              <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                Your account for <strong className="text-slate-800">{registeredEmail}</strong> has been registered.
                A confirmation email has been dispatched to your official inbox.
              </p>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-left mb-6 text-xs text-amber-900 space-y-2">
                <div className="flex items-center gap-2 font-semibold text-amber-800">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  What happens next?
                </div>
                <ul className="list-disc pl-4 space-y-1 text-slate-700">
                  <li>Check your official email and click the confirmation link.</li>
                  <li>Sign in with your password to view your <strong>Waiting for Approval</strong> status portal.</li>
                  <li>The Human Resources department has received a notification to configure your department, role, and project scopes.</li>
                  <li>Once HR and the Executive Director approve, your respective workspace will unlock immediately.</li>
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="w-full sm:w-auto px-6 py-3 bg-[#D68904] text-white font-semibold text-sm rounded-lg hover:bg-[#b86e03] transition shadow-md flex items-center justify-center gap-2"
                >
                  Proceed to Sign In
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="max-w-md mx-auto w-full">
              <div className="mb-6">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  Staff Self-Registration
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Create your personal account credentials using your official organization email.
                </p>
              </div>

              {errorMessage && (
                <div
                  className="mb-5 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3.5 text-xs text-red-700"
                  role="alert"
                >
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Full Name */}
                <div>
                  <label htmlFor="fullName" className="block text-xs font-semibold text-slate-700 mb-1">
                    Full Legal Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Nyalawe Mwita"
                      required
                      className="pl-10 pr-3 py-2.5 w-full rounded-lg bg-gray-50 border border-slate-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#D68904] text-sm text-slate-800 transition"
                    />
                  </div>
                </div>

                {/* Official Organization Email */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="officialEmail" className="block text-xs font-semibold text-slate-700">
                      Official Organization Email <span className="text-red-500">*</span>
                    </label>
                    <span className="text-[10px] text-amber-700 font-medium">Domain: {ALLOWED_DOMAIN}</span>
                  </div>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="email"
                      id="officialEmail"
                      value={email}
                      onChange={(e) => handleEmailChange(e.target.value)}
                      placeholder={`username${ALLOWED_DOMAIN}`}
                      required
                      className={`pl-10 pr-3 py-2.5 w-full rounded-lg bg-gray-50 border ${
                        domainError ? 'border-red-400 bg-red-50/30' : 'border-slate-300'
                      } focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#D68904] text-sm text-slate-800 transition`}
                    />
                  </div>
                  {domainError && (
                    <p className="text-[11px] text-red-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {domainError}
                    </p>
                  )}
                </div>

                {/* Phone Number */}
                <div>
                  <label htmlFor="phone" className="block text-xs font-semibold text-slate-700 mb-1">
                    Phone Number (Tanzania)
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="tel"
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+255 754 000 000"
                      className="pl-10 pr-3 py-2.5 w-full rounded-lg bg-gray-50 border border-slate-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#D68904] text-sm text-slate-800 transition"
                    />
                  </div>
                </div>

                {/* Password & Confirm Password */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="password" className="block text-xs font-semibold text-slate-700 mb-1">
                      Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Min 8 characters"
                        required
                        className="pl-10 pr-8 py-2.5 w-full rounded-lg bg-gray-50 border border-slate-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#D68904] text-sm text-slate-800 transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className="block text-xs font-semibold text-slate-700 mb-1">
                      Confirm Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="confirmPassword"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter password"
                        required
                        className="pl-10 pr-3 py-2.5 w-full rounded-lg bg-gray-50 border border-slate-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#D68904] text-sm text-slate-800 transition"
                      />
                    </div>
                  </div>
                </div>

                {/* Safeguarding Declaration */}
                <div className="pt-2">
                  <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-600">
                    <input
                      type="checkbox"
                      checked={acceptedSafeguarding}
                      onChange={(e) => setAcceptedSafeguarding(e.target.checked)}
                      required
                      className="mt-0.5 rounded border-slate-300 text-charcoal-900 focus:ring-slate-400"
                    />
                    <span>
                      I declare that I am an appointed staff member/contractor of Babawatoto Organization and agree
                      to uphold child safeguarding and institutional confidentiality policies.
                    </span>
                  </label>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isLoading || Boolean(domainError)}
                  className="w-full py-3 bg-[#D68904] text-white font-semibold text-sm rounded-lg hover:bg-[#b86e03] transition duration-200 shadow-md flex items-center justify-center gap-2 disabled:opacity-50 mt-4"
                >
                  {isLoading ? 'Creating Official Account...' : 'Complete Registration'}
                </button>
              </form>

              <div className="text-center mt-6 pt-4 border-t border-slate-100">
                <p className="text-xs text-slate-600">
                  Already have an account?{' '}
                  <Link to="/login" className="text-[#D68904] font-semibold hover:underline">
                    Sign In
                  </Link>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
};
