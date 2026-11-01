'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import ThemeToggle from '@/components/ThemeToggle/ThemeToggle';
import { useTheme } from '@/components/ThemeProvider/ThemeProvider';
import { EnterhubBrand } from '@/components/brand/EnterhubBrand';
import { LanguageSwitcher } from '@/components/LanguageProvider/LanguageSwitcher';
import { useLang } from '@/components/LanguageProvider/LanguageProvider';

export default function Navbar() {
  const { theme } = useTheme();
  const { t } = useLang();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close menu on resize to desktop
  useEffect(() => {
    const handler = () => { if (window.innerWidth >= 1024) setMobileOpen(false); };
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const navLinks = [
    { href: '/#features', label: t('nav.features') },
    { href: '/#learn', label: t('nav.learn') },
    { href: '/guide', label: t('nav.guide') },
    { href: '/#plans', label: t('nav.plans') },
    { href: '/#stories', label: t('nav.customers') },
    { href: '/contact', label: t('nav.contact') },
  ];

  return (
    <>
      <nav
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-3 xs:px-4 sm:px-8 3xl:px-12 4xl:px-16 py-3 sm:py-4 backdrop-blur-md transition-colors duration-300"
        style={{
          backgroundColor: theme === 'dark' ? 'var(--surface)' : 'rgba(255,255,255,0.7)',
          borderBottom: theme === 'dark' ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
        }}
      >
        {/* Left side: Logo */}
        <EnterhubBrand
          isDark={theme === 'dark'}
          size={28}
          textClassName="text-lg"
          className="flex-shrink-0"
          priority
        />

        {/* Nav links – desktop only */}
        <div className="hidden lg:flex items-center justify-center gap-2 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          {navLinks.map(({ href, label }) => (
            <NavLink key={href} href={href} label={label} />
          ))}
        </div>

        {/* Right side: language + theme + CTA + mobile hamburger */}
        <div className="flex items-center gap-2 sm:gap-3">
          <LanguageSwitcher size="sm" />
          <ThemeToggle />

          {/* Desktop auth buttons */}
          <div className="hidden lg:flex items-center gap-2">
            <Link
              href="/signin"
              className="text-sm font-semibold px-4 py-2 rounded-full transition-colors duration-200"
              style={{ color: theme === 'dark' ? 'white' : '#0a0a0a' }}
            >
              {t('nav.signIn')}
            </Link>
            <Link
              href="/signup"
              id="nav-signup"
              className="text-sm font-semibold px-5 py-2 rounded-full active:scale-95 transition-all duration-200"
              style={{
                backgroundColor: theme === 'dark' ? 'white' : '#0a0a0a',
                color: theme === 'dark' ? '#0a0a0a' : 'white',
              }}
            >
              {t('nav.signUp')}
            </Link>
          </div>

          {/* Hamburger – mobile only */}
          <button
            id="nav-hamburger"
            className="lg:hidden flex flex-col gap-1.5 p-2 min-h-[44px] min-w-[44px] items-center justify-center rounded-lg transition-all duration-150"
            onClick={() => setMobileOpen(p => !p)}
            aria-label={t('nav.toggleMenu')}
            style={{ color: theme === 'dark' ? 'white' : '#0a0a0a' }}
          >
            <motion.span
              animate={{ rotate: mobileOpen ? 45 : 0, y: mobileOpen ? 6 : 0 }}
              transition={{ duration: 0.2 }}
              className="block w-5 h-0.5 rounded-full"
              style={{ backgroundColor: theme === 'dark' ? 'white' : '#0a0a0a' }}
            />
            <motion.span
              animate={{ opacity: mobileOpen ? 0 : 1, scaleX: mobileOpen ? 0 : 1 }}
              transition={{ duration: 0.15 }}
              className="block w-5 h-0.5 rounded-full"
              style={{ backgroundColor: theme === 'dark' ? 'white' : '#0a0a0a' }}
            />
            <motion.span
              animate={{ rotate: mobileOpen ? -45 : 0, y: mobileOpen ? -6 : 0 }}
              transition={{ duration: 0.2 }}
              className="block w-5 h-0.5 rounded-full"
              style={{ backgroundColor: theme === 'dark' ? 'white' : '#0a0a0a' }}
            />
          </button>
        </div>
      </nav>

      {/* Mobile menu overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 lg:hidden"
              style={{ backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
              onClick={() => setMobileOpen(false)}
            />

            {/* Slide-down panel */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="fixed top-[65px] left-3 right-3 z-50 lg:hidden rounded-2xl overflow-hidden"
              style={{
                backgroundColor: theme === 'dark' ? 'var(--elevated)' : 'rgba(255,255,255,0.98)',
                border: theme === 'dark' ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(0,0,0,0.1)',
                boxShadow: theme === 'dark' ? '0 20px 60px rgba(0,0,0,0.8)' : '0 20px 60px rgba(0,0,0,0.12)',
                backdropFilter: 'blur(20px)',
              }}
            >
              <div className="p-4 flex flex-col gap-1">
                <div className="flex items-center justify-between px-4 py-2 mb-1">
                  <span
                    className="text-xs font-bold uppercase tracking-wider"
                    style={{ color: theme === 'dark' ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)' }}
                  >
                    {t('common.language')}
                  </span>
                  <LanguageSwitcher size="sm" />
                </div>

                {navLinks.map(({ href, label }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileOpen(false)}
                    className="text-base font-medium px-4 py-3 rounded-xl transition-all duration-150"
                    style={{
                      color: theme === 'dark' ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.7)',
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.backgroundColor =
                        theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)';
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                    }}
                  >
                    {label}
                  </Link>
                ))}

                {/* Divider */}
                <div
                  className="my-2 h-px"
                  style={{ backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }}
                />

                <div className="flex flex-col gap-2 px-1">
                  <Link
                    href="/signin"
                    onClick={() => setMobileOpen(false)}
                    className="text-center text-sm font-semibold px-4 py-3 rounded-xl transition-all duration-150"
                    style={{
                      color: theme === 'dark' ? 'white' : '#0a0a0a',
                      backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                    }}
                  >
                    {t('nav.signIn')}
                  </Link>
                  <Link
                    href="/signup"
                    onClick={() => setMobileOpen(false)}
                    className="text-center text-sm font-semibold px-4 py-3 rounded-xl transition-all duration-200 active:scale-95"
                    style={{
                      backgroundColor: theme === 'dark' ? 'white' : '#0a0a0a',
                      color: theme === 'dark' ? '#0a0a0a' : 'white',
                    }}
                  >
                    {t('nav.signUp')}
                  </Link>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function NavLink({ href, label }: { href: string; label: string }) {
  const { theme } = useTheme();
  return (
    <Link
      href={href}
      className="text-sm px-4 py-1.5 rounded-full transition-all duration-150"
      style={{
        color: theme === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.backgroundColor =
          theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';
        (e.currentTarget as HTMLElement).style.color =
          theme === 'dark' ? 'white' : '#0a0a0a';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
        (e.currentTarget as HTMLElement).style.color =
          theme === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)';
      }}
    >
      {label}
    </Link>
  );
}
