'use client';

import { MdEmail, MdPhone } from 'react-icons/md';
import { FaInstagram, FaTelegram, FaWhatsapp } from 'react-icons/fa';
import { useTheme } from '@/components/ThemeProvider/ThemeProvider';
import { useLang } from '@/components/LanguageProvider/LanguageProvider';
import PlasmaWrapper from '@/components/Plasma/PlasmaWrapper';
import Navbar from '@/components/Navbar/Navbar';
import Footer from '@/components/Footer/Footer';

const PHONE_DISPLAY = '09372560666';
const PHONE_E164 = '989372560666';
const EMAIL = 'kiabayat330@gmail.com';
const INSTAGRAM = 'https://www.instagram.com/kiasilver369/?hl=en';
const WHATSAPP = `https://wa.me/${PHONE_E164}`;
const TELEGRAM = `https://t.me/+${PHONE_E164}`;

export default function ContactPage() {
  const { theme } = useTheme();
  const { t, lang } = useLang();
  const isDark = theme === 'dark';
  const primary = isDark ? 'white' : 'black';
  const muted = isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)';
  const label = isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)';
  const iconBg = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';

  return (
    <main
      className="relative min-h-screen overflow-x-hidden transition-colors duration-500 flex flex-col"
      style={{ backgroundColor: isDark ? 'var(--background)' : '#ffffff' }}
    >
      <div className="fixed inset-0 z-0">
        <PlasmaWrapper fullscreen />
      </div>

      <Navbar />

      <div className="relative z-10 flex flex-col flex-1 pt-28 sm:pt-32 pb-16 sm:pb-24">
        <div className="max-w-5xl mx-auto px-3 xs:px-4 sm:px-6 3xl:px-8 w-full">
          <div className="text-center mb-10 sm:mb-16">
            <h1
              className="text-3xl sm:text-4xl md:text-6xl font-bold mb-4 sm:mb-6"
              style={{ color: primary }}
            >
              {t('nav.contact')}
            </h1>
            <p className="text-base sm:text-lg px-2" style={{ color: muted }}>
              {lang === 'fa'
                ? 'درباره پلن‌ها سؤال دارید، به پشتیبانی فنی نیاز دارید، یا فقط می‌خواهید سلام کنید؟ اینجاییم.'
                : "Have questions about our plans, need technical support, or just want to say hi? We're here to help."}
            </p>
          </div>

          <div
            className="p-5 sm:p-8 md:p-10 rounded-[24px] sm:rounded-[32px] backdrop-blur-xl transition-colors duration-300 flex flex-col md:flex-row gap-8 sm:gap-12 min-w-0"
            style={{
              backgroundColor: isDark ? 'var(--surface)' : 'rgba(255,255,255,0.7)',
              border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
              boxShadow: isDark ? '0 20px 40px rgba(0,0,0,0.5)' : '0 20px 40px rgba(0,0,0,0.05)',
            }}
          >
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-8" style={{ color: primary }}>
                {t('footer.getInTouch')}
              </h2>
              <div className="space-y-6">
                <a
                  href={`mailto:${EMAIL}`}
                  className="flex items-center gap-3 sm:gap-4 hover:opacity-80 transition-opacity min-w-0"
                >
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: iconBg, color: primary }}
                  >
                    <MdEmail size={22} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm" style={{ color: label }}>
                      {lang === 'fa' ? 'ایمیل' : 'Email'}
                    </p>
                    <span
                      className="font-medium text-base sm:text-lg break-all"
                      style={{ color: primary }}
                      dir="ltr"
                    >
                      {EMAIL}
                    </span>
                  </div>
                </a>

                <a
                  href={`tel:+${PHONE_E164}`}
                  className="flex items-center gap-3 sm:gap-4 hover:opacity-80 transition-opacity min-w-0"
                >
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: iconBg, color: primary }}
                  >
                    <MdPhone size={22} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm" style={{ color: label }}>
                      {lang === 'fa' ? 'تلفن' : 'Phone'}
                    </p>
                    <span className="font-medium text-base sm:text-lg" style={{ color: primary }} dir="ltr">
                      {PHONE_DISPLAY}
                    </span>
                  </div>
                </a>

                <div className="pt-2 border-t" style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }}>
                  <p className="text-sm mb-3" style={{ color: label }}>
                    {lang === 'fa' ? 'شبکه‌های اجتماعی' : 'Social'}
                  </p>
                  <div className="flex items-center gap-3">
                    <a
                      href={INSTAGRAM}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Instagram"
                      className="w-12 h-12 rounded-full flex items-center justify-center hover:opacity-80 transition-opacity"
                      style={{ backgroundColor: iconBg, color: primary }}
                    >
                      <FaInstagram size={22} />
                    </a>
                    <a
                      href={WHATSAPP}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="WhatsApp"
                      className="w-12 h-12 rounded-full flex items-center justify-center hover:opacity-80 transition-opacity"
                      style={{ backgroundColor: iconBg, color: primary }}
                    >
                      <FaWhatsapp size={22} />
                    </a>
                    <a
                      href={TELEGRAM}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Telegram"
                      className="w-12 h-12 rounded-full flex items-center justify-center hover:opacity-80 transition-opacity"
                      style={{ backgroundColor: iconBg, color: primary }}
                    >
                      <FaTelegram size={22} />
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1">
              <form className="flex flex-col gap-5" onSubmit={(e) => e.preventDefault()}>
                <input
                  type="text"
                  placeholder="Your Name"
                  className={`w-full px-5 py-4 rounded-xl bg-transparent outline-none transition-all focus:ring-2 ${isDark ? 'focus:ring-white/20' : 'focus:ring-black/20'}`}
                  style={{
                    border: isDark ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(0,0,0,0.2)',
                    color: primary,
                  }}
                />
                <input
                  type="email"
                  placeholder="Email Address"
                  className={`w-full px-5 py-4 rounded-xl bg-transparent outline-none transition-all focus:ring-2 ${isDark ? 'focus:ring-white/20' : 'focus:ring-black/20'}`}
                  style={{
                    border: isDark ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(0,0,0,0.2)',
                    color: primary,
                  }}
                />
                <textarea
                  placeholder="Your Message"
                  rows={5}
                  className={`w-full px-5 py-4 rounded-xl bg-transparent outline-none transition-all focus:ring-2 ${isDark ? 'focus:ring-white/20' : 'focus:ring-black/20'} resize-none`}
                  style={{
                    border: isDark ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(0,0,0,0.2)',
                    color: primary,
                  }}
                />
                <button
                  type="submit"
                  className="w-full py-4 mt-2 rounded-xl font-bold transition-all hover:opacity-90 active:scale-[0.98] shadow-lg"
                  style={{
                    backgroundColor: isDark ? 'white' : 'black',
                    color: isDark ? 'black' : 'white',
                    boxShadow: isDark ? '0 10px 20px rgba(255,255,255,0.1)' : '0 10px 20px rgba(0,0,0,0.15)',
                  }}
                >
                  Send Message
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
