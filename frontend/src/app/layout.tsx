import type { Metadata } from "next";
import localFont from "next/font/local";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { cookies } from "next/headers";
import "./fonts-iran-yekan.css";
import "./globals.css";
import "boxicons/css/boxicons.min.css";
import "material-icons/iconfont/material-icons.css";
import { ThemeProvider } from "@/components/ThemeProvider/ThemeProvider";
import { AuthSessionProvider } from "@/components/AuthSessionProvider";
import { LanguageProvider } from "@/components/LanguageProvider/LanguageProvider";
import { CalendarProvider } from "@/components/CalendarProvider/CalendarProvider";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, type Locale } from "@/i18n";
import {
  CALENDAR_COOKIE,
  DEFAULT_CALENDAR,
  isCalendarSystem,
  type CalendarSystem,
} from "@/lib/app-date";

/** Self-host fonts — Google Fonts fetch is blocked on this host. */
const geistSans = GeistSans;
const geistMono = GeistMono;

const inter = localFont({
  src: "../fonts/inter-variable.woff2",
  variable: "--font-inter",
  display: "swap",
  weight: "100 900",
});

const robotoFlex = localFont({
  src: "../fonts/inter-variable.woff2",
  variable: "--font-roboto-flex",
  display: "swap",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Enterhub – Project Management Workspace",
  description:
    "Real-time projects, departments, My Tasks, analytics, chat, and meetings. Start free with Enterhub.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jar = await cookies();
  const raw = jar.get(LOCALE_COOKIE)?.value;
  const locale: Locale = isLocale(raw) ? raw : DEFAULT_LOCALE;
  const dir = locale === "fa" ? "rtl" : "ltr";
  const calRaw = jar.get(CALENDAR_COOKIE)?.value;
  const calendar: CalendarSystem = isCalendarSystem(calRaw) ? calRaw : DEFAULT_CALENDAR;

  return (
    <html
      lang={locale === "fa" ? "fa" : "en"}
      dir={dir}
      data-locale={locale}
      data-calendar={calendar}
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${robotoFlex.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AuthSessionProvider>
          <ThemeProvider>
            <LanguageProvider initialLocale={locale}>
              <CalendarProvider initialCalendar={calendar}>{children}</CalendarProvider>
            </LanguageProvider>
          </ThemeProvider>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
