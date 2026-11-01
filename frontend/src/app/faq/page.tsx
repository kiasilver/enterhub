'use client';

import { useTheme } from '@/components/ThemeProvider/ThemeProvider';
import { useLang } from '@/components/LanguageProvider/LanguageProvider';
import PlasmaWrapper from '@/components/Plasma/PlasmaWrapper';
import Navbar from '@/components/Navbar/Navbar';
import Footer from '@/components/Footer/Footer';

const FAQ_EN = [
  {
    q: 'Is Enterhub free to start?',
    a: 'Yes. The Free plan includes projects, boards, My Tasks, calendar, and smart per-task evaluation. Upgrade when you need guests, meetings, or advanced analytics tooling.',
  },
  {
    q: 'How does smart evaluation work?',
    a: 'When a manager approves a completed task, Enterhub records a structured score for that card. Those scores roll into Analytics automatically — no separate year-end form.',
  },
  {
    q: 'Can I organize work by department?',
    a: 'Yes. Departments are the org layer under a workspace. Attach boards to units, assign managers, and keep Projects tidy as you scale.',
  },
  {
    q: 'How do I invite teammates?',
    a: 'Open Team or workspace Members settings and send invites with the right role. Guests can be added on paid plans.',
  },
] as const;

const FAQ_FA = [
  {
    q: 'آیا شروع با اینترهاب رایگان است؟',
    a: 'بله. پلن رایگان شامل پروژه، برد، وظایف من، تقویم و ارزیابی هوشمند هر وظیفه است. وقتی به مهمان، جلسه یا ابزار تحلیل پیشرفته نیاز داشتید ارتقا دهید.',
  },
  {
    q: 'ارزیابی هوشمند چگونه کار می‌کند؟',
    a: 'وقتی مدیر یک وظیفهٔ تکمیل‌شده را تأیید می‌کند، اینترهاب نمره ساخت‌یافته برای همان کارت ثبت می‌کند. این نمرات خودکار وارد تحلیل‌ها می‌شوند — بدون فرم جداگانه پایان سال.',
  },
  {
    q: 'آیا می‌توانم کار را بر اساس بخش سازمان‌دهی کنم؟',
    a: 'بله. بخش‌های اداره لایه سازمانی زیر فضای کاری هستند. بردها را به واحدها وصل کنید، مدیر تعیین کنید و با رشد تیم پروژه‌ها را منظم نگه دارید.',
  },
  {
    q: 'چطور هم‌تیمی دعوت کنم؟',
    a: 'از تیم یا تنظیمات اعضای فضای کاری دعوت بفرستید و نقش مناسب را انتخاب کنید. مهمان در پلن‌های پولی قابل افزودن است.',
  },
] as const;

export default function FAQPage() {
  const { theme } = useTheme();
  const { lang, t } = useLang();
  const isDark = theme === 'dark';
  const faqs = lang === 'fa' ? FAQ_FA : FAQ_EN;

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
        <div className="max-w-3xl mx-auto px-3 xs:px-4 sm:px-6 3xl:px-8 w-full">
          <div className="text-center mb-10 sm:mb-16">
            <h1
              className="text-3xl sm:text-4xl md:text-6xl font-bold mb-4 sm:mb-6"
              style={{ color: isDark ? 'white' : 'black' }}
            >
              {lang === 'fa' ? 'سؤالات متداول' : 'Frequently Asked Questions'}
            </h1>
            <p
              className="text-base sm:text-lg px-2"
              style={{ color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }}
            >
              {lang === 'fa' ? 'سؤال دارید؟ اینجا پاسخ است.' : "Got questions? We've got answers."}
            </p>
          </div>

          <div className="grid gap-4">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="p-5 sm:p-6 rounded-2xl backdrop-blur-xl"
                style={{
                  backgroundColor: isDark ? 'var(--surface)' : 'rgba(255,255,255,0.7)',
                  border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
                }}
              >
                <h3 className="text-lg font-bold mb-2" style={{ color: isDark ? 'white' : 'black' }}>
                  {faq.q}
                </h3>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: isDark ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.65)' }}
                >
                  {faq.a}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <a
              href="/guide"
              className="inline-flex items-center justify-center min-h-[44px] px-6 rounded-xl text-sm font-semibold"
              style={{
                backgroundColor: isDark ? '#fff' : '#0a0a0a',
                color: isDark ? '#0a0a0a' : '#fff',
              }}
            >
              {t('learn.openGuide')}
            </a>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
