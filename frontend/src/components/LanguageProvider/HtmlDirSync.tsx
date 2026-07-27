'use client';

import { useEffect } from 'react';
import { useLang } from '@/components/LanguageProvider/LanguageProvider';

export default function HtmlDirSync() {
  const { lang } = useLang();

  useEffect(() => {
    document.documentElement.dir = lang === 'fa' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang === 'fa' ? 'fa' : 'en';
    if (lang === 'fa') {
      document.documentElement.style.fontFamily = '"IRANYekanX", Tahoma, sans-serif';
    } else {
      document.documentElement.style.fontFamily = '';
    }
  }, [lang]);

  return null;
}
