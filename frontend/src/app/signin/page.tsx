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

export default function SignIn() {
  const { theme } = useTheme();
  const { t } = useLang();
  const router = useRouter();
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleEnabled, setGoogleEnabled] = useState(false);

  useEffect(() => {
    void fetch('/api/auth/verification-policy')
      .then((r) => r.json())
      .then((j) => setGoogleEnabled(Boolean(j.data?.googleEnabled)))
      .catch(() => setGoogleEnabled(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!login.trim() || !password.trim()) {
      setError(t('auth.errors.required'));
      return;
    }
    setLoading(true);
    try {
      const res = await signIn('credentials', {
        login: login.trim(),
        password,
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

            <div className="space-y-1.5">
              <label className="text-sm font-semibold pl-1" style={{ color: theme === 'dark' ? 'white' : 'black' }}>
                {t('auth.password')}
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className={`w-full px-4 py-3.5 rounded-2xl bg-transparent outline-none transition-all focus:ring-2 ${theme === 'dark' ? 'focus:ring-white/20' : 'focus:ring-black/20'}`}
                style={{
                  border: theme === 'dark' ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(0,0,0,0.2)',
                  color: theme === 'dark' ? 'white' : 'black',
                }}
              />
            </div>

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
