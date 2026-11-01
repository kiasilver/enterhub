'use client';

import { canvasBg, panelFill } from '@/components/SafeDashboard/theme';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { useTheme } from '@/components/ThemeProvider/ThemeProvider';
import { useLang } from '@/components/LanguageProvider/LanguageProvider';
import { LanguageSwitcher } from '@/components/LanguageProvider/LanguageSwitcher';
import PlasmaWrapper from '@/components/Plasma/PlasmaWrapper';
import Navbar from '@/components/Navbar/Navbar';
import { readJson } from '@/lib/safe-json';

type Policy = {
  smsRequired: boolean;
  emailRequired: boolean;
  googleEnabled: boolean;
};

export default function SignUp() {
  const { theme } = useTheme();
  const { t } = useLang();
  const isDark = theme === 'dark';
  const router = useRouter();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [hasCompany, setHasCompany] = useState(false);
  const [smsOtp, setSmsOtp] = useState('');
  const [emailOtp, setEmailOtp] = useState('');
  const [smsSent, setSmsSent] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [policy, setPolicy] = useState<Policy | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void fetch('/api/auth/verification-policy')
      .then((r) => r.json())
      .then((j) => setPolicy(j.data))
      .catch(() =>
        setPolicy({ smsRequired: false, emailRequired: false, googleEnabled: false }),
      );
  }, []);

  async function requestSms() {
    setError(null);
    const res = await fetch('/api/auth/otp/sms/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, purpose: 'register' }),
    });
    const { ok, data, error: apiError } = await readJson<{
      data?: { skipped?: boolean; devCode?: string };
      error?: string;
    }>(res);
    if (!ok) {
      setError(apiError || t('auth.errors.generic'));
      return false;
    }
    if (data?.data?.skipped) return true;
    setSmsSent(true);
    setDevCode(data?.data?.devCode ?? null);
    return true;
  }

  async function requestEmailOtp() {
    if (!email.trim()) return true;
    const res = await fetch('/api/auth/otp/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, purpose: 'register' }),
    });
    const { ok, data, error: apiError } = await readJson<{
      data?: { skipped?: boolean; devCode?: string };
      error?: string;
    }>(res);
    if (!ok) {
      setError(apiError || t('auth.errors.generic'));
      return false;
    }
    if (data?.data?.skipped) return true;
    setEmailSent(true);
    if (data?.data?.devCode) setDevCode(data.data.devCode);
    return true;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (policy?.smsRequired && !smsOtp) {
        const sent = await requestSms();
        if (sent) setError(t('auth.verifyOtp'));
        setLoading(false);
        return;
      }
      if (policy?.emailRequired && email.trim() && !emailOtp) {
        const sent = await requestEmailOtp();
        if (sent) setError(t('auth.verifyOtp'));
        setLoading(false);
        return;
      }

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          email: email.trim() || undefined,
          password,
          name,
          hasCompany,
          smsOtpCode: smsOtp || undefined,
          emailOtpCode: emailOtp || undefined,
        }),
      });
      const { ok, data, error: apiError } = await readJson<{
        error?: string;
        code?: string;
        data?: { next?: string | null; login?: string };
      }>(res);

      if (!ok && data?.code === 'SMS_OTP_REQUIRED') {
        await requestSms();
        setError(t('auth.verifyOtp'));
        setLoading(false);
        return;
      }
      if (!ok && data?.code === 'EMAIL_OTP_REQUIRED') {
        await requestEmailOtp();
        setError(t('auth.verifyOtp'));
        setLoading(false);
        return;
      }
      if (!ok) throw new Error(apiError || t('auth.errors.generic'));

      const loginId = data?.data?.login || phone;
      const login = await signIn('credentials', {
        login: loginId,
        password,
        redirect: false,
      });
      if (login?.error) {
        router.push('/signin');
        return;
      }

      if (data?.data?.next || hasCompany) {
        router.push('/onboarding/company');
      } else {
        const me = await fetch('/api/auth/me');
        const meJson = await readJson<{ data?: { home?: { homePath?: string } } }>(me);
        router.push(meJson.data?.data?.home?.homePath || '/home');
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.errors.generic'));
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = {
    border: isDark ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(0,0,0,0.2)',
    color: isDark ? 'white' : 'black',
  } as const;

  return (
    <main
      className="relative min-h-screen overflow-x-hidden transition-colors duration-500 flex flex-col"
      style={{ backgroundColor: canvasBg(isDark) }}
    >
      <div className="fixed inset-0 z-0">
        <PlasmaWrapper fullscreen />
      </div>
      <Navbar />
      <div className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-6 pt-20 sm:pt-24 pb-10 sm:pb-12">
        <div
          className="w-full max-w-md p-5 sm:p-8 md:p-10 rounded-[32px] backdrop-blur-2xl"
          style={{
            backgroundColor: panelFill(isDark),
            border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
          }}
        >
          <div className="flex justify-end mb-4">
            <LanguageSwitcher size="sm" />
          </div>

          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2" style={{ color: isDark ? 'white' : 'black' }}>
              {t('auth.signUpTitle')}
            </h1>
            <p className="text-sm" style={{ color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }}>
              {t('auth.signUpSubtitle')}
            </p>
          </div>

          {policy?.googleEnabled && (
            <button
              type="button"
              onClick={() =>
                signIn('google', {
                  callbackUrl: hasCompany
                    ? '/onboarding/company'
                    : '/api/auth/callback-home',
                })
              }
              className="w-full mb-4 py-3 rounded-2xl text-sm font-semibold"
              style={{
                border: isDark ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(0,0,0,0.15)',
                color: isDark ? 'white' : 'black',
              }}
            >
              {t('auth.google')}
            </button>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <input
              required
              placeholder={t('auth.name')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-transparent outline-none"
              style={inputStyle}
            />
            <input
              required
              type="tel"
              placeholder={t('auth.phonePlaceholder')}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-transparent outline-none"
              style={inputStyle}
              aria-label={t('auth.phone')}
            />
            <input
              type="email"
              placeholder={t('auth.email')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-transparent outline-none"
              style={inputStyle}
            />
            <input
              required
              type="password"
              minLength={8}
              placeholder={t('auth.password')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-transparent outline-none"
              style={inputStyle}
            />

            <label
              className="flex items-start gap-3 text-sm cursor-pointer"
              style={{ color: isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.8)' }}
            >
              <input
                type="checkbox"
                checked={hasCompany}
                onChange={(e) => setHasCompany(e.target.checked)}
                className="mt-1"
              />
              <span className="font-semibold">{t('auth.haveCompany')}</span>
            </label>

            {(smsSent || policy?.smsRequired) && (
              <div className="space-y-2">
                <input
                  placeholder={t('auth.otpCode')}
                  value={smsOtp}
                  onChange={(e) => setSmsOtp(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-transparent outline-none"
                  style={inputStyle}
                />
                <button type="button" onClick={() => void requestSms()} className="text-xs underline" style={{ color: isDark ? '#93c5fd' : '#2563eb' }}>
                  {t('auth.sendOtp')}
                </button>
              </div>
            )}

            {(emailSent || (policy?.emailRequired && email.trim())) && (
              <input
                placeholder={t('auth.otpCode')}
                value={emailOtp}
                onChange={(e) => setEmailOtp(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-transparent outline-none"
                style={inputStyle}
              />
            )}

            {devCode && (
              <p className="text-xs" style={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}>
                {t('auth.otpCode')}: <strong>{devCode}</strong>
              </p>
            )}

            {error && <p className="text-sm text-red-500">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-2xl font-bold disabled:opacity-60"
              style={{
                backgroundColor: isDark ? 'white' : 'black',
                color: isDark ? 'black' : 'white',
              }}
            >
              {loading ? t('common.loading') : t('auth.createAccount')}
            </button>
          </form>

          <p
            className="text-center mt-8 text-sm"
            style={{ color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }}
          >
            {t('auth.hasAccount')}{' '}
            <Link href="/signin" className="font-bold hover:underline" style={{ color: isDark ? 'white' : 'black' }}>
              {t('nav.signIn')}
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
