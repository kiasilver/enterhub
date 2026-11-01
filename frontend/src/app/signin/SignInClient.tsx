'use client';

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

export default function SignInClient() {
  const { theme } = useTheme();
  const { t } = useLang();
  const router = useRouter();
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [mode, setMode] = useState<'password' | 'otp'>('password');
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleEnabled, setGoogleEnabled] = useState(false);
  const [smsConfigured, setSmsConfigured] = useState(false);

  useEffect(() => {
    void fetch('/api/auth/verification-policy')
      .then((r) => r.json())
      .then((j) => {
        setGoogleEnabled(Boolean(j.data?.googleEnabled));
        setSmsConfigured(Boolean(j.data?.smsConfigured || j.data?.smsRequired));
      })
      .catch(() => {
        setGoogleEnabled(false);
        setSmsConfigured(false);
      });
  }, []);

  async function sendLoginOtp() {
    setError(null);
    if (!login.trim()) {
      setError(t('auth.errors.required'));
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/otp/sms/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: login.trim(), purpose: 'login' }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error || t('auth.errors.generic'));
        return;
      }
      setOtpSent(true);
    } catch {
      setError(t('auth.errors.generic'));
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!login.trim() || (mode === 'password' && !password.trim()) || (mode === 'otp' && !otp.trim())) {
      setError(t('auth.errors.required'));
      return;
    }
    setLoading(true);
    try {
      const res = await signIn('credentials', {
        login: login.trim(),
        password: mode === 'password' ? password : undefined,
        otp: mode === 'otp' ? otp.trim() : undefined,
        redirect: false,
      });
      if (res?.error) {
        const code = String(res.error);
        if (code.includes('ACCOUNT_BLOCKED')) {
          setError(t('auth.errors.blocked'));
        } else {
          setError(t('auth.errors.invalid'));
        }
        return;
      }
      const me = await fetch('/api/auth/me');
      if (me.ok) {
        const { data } = await readJson<{
          data?: {
            home?: { homePath?: string };
            workspaces?: { workspace?: { id?: string } }[];
            user?: { pendingOnboarding?: boolean };
          };
        }>(me);
        if (data?.data?.user?.pendingOnboarding) {
          router.push('/onboarding/company');
        } else {
          const homePath = data?.data?.home?.homePath;
          const first = data?.data?.workspaces?.[0]?.workspace?.id;
          router.push(homePath || (first ? `/workspace/${first}` : '/onboarding/company'));
        }
      } else {
        router.push('/onboarding/company');
      }
      router.refresh();
    } catch {
      setError(t('auth.errors.generic'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      className="relative min-h-screen overflow-hidden transition-colors duration-500 flex flex-col"
      style={{ backgroundColor: theme === 'dark' ? 'var(--background)' : '#ffffff' }}
    >
      <div className="fixed inset-0 z-0">
        <PlasmaWrapper fullscreen />
      </div>

      <Navbar />

      <div className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-6 pt-20 sm:pt-24 pb-10 sm:pb-12">
        <div
          className="w-full max-w-md p-5 sm:p-8 md:p-10 rounded-[32px] backdrop-blur-2xl transition-colors duration-300"
          style={{
            backgroundColor: theme === 'dark' ? 'var(--surface)' : 'rgba(255,255,255,0.7)',
            border: theme === 'dark' ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
            boxShadow: theme === 'dark' ? '0 30px 60px rgba(0,0,0,0.6)' : '0 30px 60px rgba(0,0,0,0.08)',
          }}
        >
          <div className="flex justify-end mb-4">
            <LanguageSwitcher size="sm" />
          </div>

          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2 tracking-tight" style={{ color: theme === 'dark' ? 'white' : 'black' }}>
              {t('auth.signInTitle')}
            </h1>
            <p className="text-sm" style={{ color: theme === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }}>
              {t('auth.signInSubtitle')}
            </p>
          </div>

          {googleEnabled && (
            <button
              type="button"
              onClick={() => signIn('google', { callbackUrl: '/api/auth/callback-home' })}
              className="w-full mb-4 py-3 rounded-2xl text-sm font-semibold"
              style={{
                border: theme === 'dark' ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(0,0,0,0.15)',
                color: theme === 'dark' ? 'white' : 'black',
              }}
            >
              {t('auth.google')}
            </button>
          )}

          {smsConfigured && (
            <div className="flex gap-1 mb-5 p-1 rounded-2xl" style={{
              border: theme === 'dark' ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(0,0,0,0.1)',
            }}>
              {(['password', 'otp'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    setMode(m);
                    setError(null);
                  }}
                  className="flex-1 py-2 rounded-xl text-sm font-semibold"
                  style={{
                    background:
                      mode === m
                        ? theme === 'dark'
                          ? 'white'
                          : 'black'
                        : 'transparent',
                    color:
                      mode === m
                        ? theme === 'dark'
                          ? 'black'
                          : 'white'
                        : theme === 'dark'
                          ? 'rgba(255,255,255,0.7)'
                          : 'rgba(0,0,0,0.55)',
                  }}
                >
                  {m === 'password' ? t('auth.loginWithPassword') : t('auth.loginWithCode')}
                </button>
              ))}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold pl-1" style={{ color: theme === 'dark' ? 'white' : 'black' }}>
                {t('auth.phone')} / {t('auth.emailRequired')}
              </label>
              <input
                type="text"
                placeholder={t('auth.phonePlaceholder')}
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                required
                autoComplete="username"
                className={`w-full px-4 py-3.5 rounded-2xl bg-transparent outline-none transition-all focus:ring-2 ${theme === 'dark' ? 'focus:ring-white/20' : 'focus:ring-black/20'}`}
                style={{
                  border: theme === 'dark' ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(0,0,0,0.2)',
                  color: theme === 'dark' ? 'white' : 'black',
                }}
              />
            </div>

            {mode === 'password' ? (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2 pl-1">
                <label className="text-sm font-semibold" style={{ color: theme === 'dark' ? 'white' : 'black' }}>
                  {t('auth.password')}
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-semibold hover:underline"
                  style={{ color: theme === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.55)' }}
                >
                  {t('auth.forgotLink')}
                </Link>
              </div>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required={mode === 'password'}
                autoComplete="current-password"
                className={`w-full px-4 py-3.5 rounded-2xl bg-transparent outline-none transition-all focus:ring-2 ${theme === 'dark' ? 'focus:ring-white/20' : 'focus:ring-black/20'}`}
                style={{
                  border: theme === 'dark' ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(0,0,0,0.2)',
                  color: theme === 'dark' ? 'white' : 'black',
                }}
              />
            </div>
            ) : (
            <div className="space-y-3">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => void sendLoginOtp()}
                  disabled={loading}
                  className="shrink-0 px-4 py-3.5 rounded-2xl text-sm font-semibold"
                  style={{
                    border: theme === 'dark' ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(0,0,0,0.2)',
                    color: theme === 'dark' ? 'white' : 'black',
                  }}
                >
                  {otpSent ? t('auth.codeSent') : t('auth.sendOtp')}
                </button>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder={t('auth.otpCode')}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className={`flex-1 px-4 py-3.5 rounded-2xl bg-transparent outline-none transition-all focus:ring-2 ${theme === 'dark' ? 'focus:ring-white/20' : 'focus:ring-black/20'}`}
                  style={{
                    border: theme === 'dark' ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(0,0,0,0.2)',
                    color: theme === 'dark' ? 'white' : 'black',
                  }}
                />
              </div>
            </div>
            )}

            {error && (
              <p className="text-sm text-red-500 pl-1" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-2xl font-bold transition-all hover:opacity-90 active:scale-[0.98] mt-2 shadow-lg disabled:opacity-60"
              style={{
                backgroundColor: theme === 'dark' ? 'white' : 'black',
                color: theme === 'dark' ? 'black' : 'white',
              }}
            >
              {loading ? t('common.loading') : t('nav.signIn')}
            </button>
          </form>

          <p className="text-center mt-8 text-sm" style={{ color: theme === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }}>
            {t('auth.noAccount')}{' '}
            <Link href="/signup" className="font-bold hover:underline" style={{ color: theme === 'dark' ? 'white' : 'black' }}>
              {t('nav.signUp')}
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
