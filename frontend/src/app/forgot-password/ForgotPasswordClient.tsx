'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTheme } from '@/components/ThemeProvider/ThemeProvider';
import { useLang } from '@/components/LanguageProvider/LanguageProvider';
import { LanguageSwitcher } from '@/components/LanguageProvider/LanguageSwitcher';
import PlasmaWrapper from '@/components/Plasma/PlasmaWrapper';
import Navbar from '@/components/Navbar/Navbar';

export default function ForgotPasswordClient() {
  const { theme } = useTheme();
  const { t } = useLang();
  const [login, setLogin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!login.trim()) {
      setError(t('auth.errors.required'));
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login: login.trim() }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error || t('auth.errors.generic'));
        return;
      }
      setDone(true);
    } catch {
      setError(t('auth.errors.generic'));
    } finally {
      setLoading(false);
    }
  }

  const cardBg =
    theme === 'dark' ? 'var(--surface)' : 'rgba(255,255,255,0.7)';
  const border =
    theme === 'dark' ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)';
  const text = theme === 'dark' ? 'white' : 'black';
  const muted = theme === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)';

  return (
    <main
      className="relative min-h-screen overflow-hidden transition-colors duration-500 flex flex-col"
      style={{ backgroundColor: theme === 'dark' ? 'var(--background)' : '#ffffff' }}
    >
      <div className="fixed inset-0 z-0">
        <PlasmaWrapper fullscreen />
      </div>
      <Navbar />
      <div className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-6 pt-20 sm:pt-24 pb-10">
        <div
          className="w-full max-w-md p-5 sm:p-8 md:p-10 rounded-[32px] backdrop-blur-2xl"
          style={{
            backgroundColor: cardBg,
            border,
            boxShadow:
              theme === 'dark'
                ? '0 30px 60px rgba(0,0,0,0.6)'
                : '0 30px 60px rgba(0,0,0,0.08)',
          }}
        >
          <div className="flex justify-end mb-4">
            <LanguageSwitcher size="sm" />
          </div>
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2 tracking-tight" style={{ color: text }}>
              {t('auth.forgotTitle')}
            </h1>
            <p className="text-sm" style={{ color: muted }}>
              {t('auth.forgotSubtitle')}
            </p>
          </div>

          {done ? (
            <p className="text-sm text-center" style={{ color: muted }} role="status">
              {t('auth.forgotSent')}
            </p>
          ) : (
            <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold pl-1" style={{ color: text }}>
                {t('auth.phone')} / {t('auth.emailRequired')}
              </label>
              <input
                type="text"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                required
                autoComplete="username"
                placeholder={t('auth.phonePlaceholder')}
                className={`w-full px-4 py-3.5 rounded-2xl bg-transparent outline-none transition-all focus:ring-2 ${
                  theme === 'dark' ? 'focus:ring-white/20' : 'focus:ring-black/20'
                }`}
                style={{
                  border:
                    theme === 'dark'
                      ? '1px solid rgba(255,255,255,0.2)'
                      : '1px solid rgba(0,0,0,0.2)',
                  color: text,
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
                className="w-full py-4 rounded-2xl font-bold transition-all hover:opacity-90 active:scale-[0.98] shadow-lg disabled:opacity-60"
                style={{
                  backgroundColor: theme === 'dark' ? 'white' : 'black',
                  color: theme === 'dark' ? 'black' : 'white',
                }}
              >
                {loading ? t('common.loading') : t('auth.sendReset')}
              </button>
            </form>
          )}

          <p className="text-center mt-8 text-sm" style={{ color: muted }}>
            <Link href="/signin" className="font-bold hover:underline" style={{ color: text }}>
              {t('nav.signIn')}
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
