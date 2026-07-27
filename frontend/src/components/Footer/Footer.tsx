'use client';

import Link from 'next/link';
import { MdEmail, MdPhone } from 'react-icons/md';
import { FaInstagram, FaTelegram, FaWhatsapp } from 'react-icons/fa';
import { useTheme } from '@/components/ThemeProvider/ThemeProvider';
import { useLang } from '@/components/LanguageProvider/LanguageProvider';
import { EnterhubBrand } from '@/components/brand/EnterhubBrand';

const PHONE_DISPLAY = '09372560666';
const PHONE_E164 = '989372560666';
const EMAIL = 'kiabayat330@gmail.com';
const INSTAGRAM = 'https://www.instagram.com/kiasilver369/?hl=en';
const WHATSAPP = `https://wa.me/${PHONE_E164}`;
const TELEGRAM = `https://t.me/+${PHONE_E164}`;

export default function Footer() {
  const { theme } = useTheme();
  const { t } = useLang();
  const muted = theme === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)';
  const heading = theme === 'dark' ? 'white' : 'black';

  return (
    <footer
      className="border-t py-10 sm:py-12 px-3 xs:px-4 sm:px-6 3xl:px-12 4xl:px-16 mt-auto relative z-10 backdrop-blur-md transition-colors duration-300"
      style={{
        borderColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
        backgroundColor: theme === 'dark' ? 'var(--surface)' : 'rgba(255,255,255,0.7)',
      }}
    >
      <div className="max-w-7xl 4xl:max-w-[90rem] mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-8">
        <div className="col-span-1 md:col-span-1">
          <EnterhubBrand
            isDark={theme === 'dark'}
            size={28}
            textClassName="text-xl"
            className="mb-4 w-max"
          />
          <p className="text-sm mb-4 leading-relaxed" style={{ color: muted }}>
            {t('footer.blurb')}
          </p>
        </div>

        <div>
          <h4 className="font-bold mb-4" style={{ color: heading }}>
            {t('footer.company')}
          </h4>
          <ul className="space-y-2 text-sm" style={{ color: muted }}>
            <li>
              <Link href="/#features" className="hover:underline">
                {t('footer.features')}
              </Link>
            </li>
            <li>
              <Link href="/#learn" className="hover:underline">
                {t('footer.learn')}
              </Link>
            </li>
            <li>
              <Link href="/#plans" className="hover:underline">
                {t('footer.plans')}
              </Link>
            </li>
            <li>
              <Link href="/about" className="hover:underline">
                {t('footer.about')}
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold mb-4" style={{ color: heading }}>
            {t('footer.support')}
          </h4>
          <ul className="space-y-2 text-sm" style={{ color: muted }}>
            <li>
              <Link href="/faq" className="hover:underline">
                {t('footer.faq')}
              </Link>
            </li>
            <li>
              <Link href="/contact" className="hover:underline">
                {t('footer.contact')}
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="hover:underline">
                {t('footer.privacy')}
              </Link>
            </li>
            <li>
              <Link href="/terms" className="hover:underline">
                {t('footer.terms')}
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold mb-4" style={{ color: heading }}>
            {t('footer.getInTouch')}
          </h4>
          <ul className="space-y-3 text-sm" style={{ color: muted }}>
            <li>
              <a
                href={`mailto:${EMAIL}`}
                className="inline-flex items-center gap-2 hover:opacity-80 transition-opacity max-w-full"
              >
                <MdEmail size={18} className="flex-shrink-0" />
                <span className="min-w-0 break-all" dir="ltr">
                  {EMAIL}
                </span>
              </a>
            </li>
            <li>
              <a
                href={`tel:+${PHONE_E164}`}
                className="inline-flex items-center gap-2 hover:opacity-80 transition-opacity"
              >
                <MdPhone size={18} className="flex-shrink-0" />
                <span dir="ltr">{PHONE_DISPLAY}</span>
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div
        className="max-w-7xl mx-auto pt-8 border-t flex flex-col md:flex-row items-center justify-between gap-4"
        style={{ borderColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}
      >
        <p className="text-xs" style={{ color: theme === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}>
          &copy; {new Date().getFullYear()} Enterhub. {t('footer.rights')}
        </p>
        <div className="flex items-center gap-4">
          <a
            href={INSTAGRAM}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            className="hover:opacity-70 transition-opacity"
            style={{ color: muted }}
          >
            <FaInstagram size={22} />
          </a>
          <a
            href={WHATSAPP}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="WhatsApp"
            className="hover:opacity-70 transition-opacity"
            style={{ color: muted }}
          >
            <FaWhatsapp size={22} />
          </a>
          <a
            href={TELEGRAM}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Telegram"
            className="hover:opacity-70 transition-opacity"
            style={{ color: muted }}
          >
            <FaTelegram size={22} />
          </a>
        </div>
      </div>
    </footer>
  );
}
