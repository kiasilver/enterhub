/**
 * Enterhub commercial plans — IRR (Toman) + USD.
 * FREE · BASE (PRO) · ADVANCED (ENTERPRISE).
 * nameFa / taglineFa / featuresFa power the Persian landing & billing UI.
 */

export type PlanCode = "FREE" | "PRO" | "ENTERPRISE";

export const SEAT_OPTIONS = [10, 20, 50, 100, 200, 400] as const;

/** Extra cloud packs the customer can buy anytime (MB). */
export const CLOUD_PACK_OPTIONS_MB = [
  0,
  512, // 0.5 GB
  1024,
  5 * 1024,
  10 * 1024,
  50 * 1024,
  100 * 1024,
  500 * 1024,
] as const;

/** Toman per extra GB / year (flexible add-on). */
export const EXTRA_CLOUD_TOMAN_PER_GB_YEAR = 80_000;

/** USD per extra GB / year. */
export const EXTRA_CLOUD_USD_PER_GB_YEAR = 2;

export type PlanDefinition = {
  code: PlanCode;
  nameFa: string;
  nameEn: string;
  taglineFa: string;
  taglineEn: string;
  /** IRR — listed price before discount (yearly, default seats) */
  listPriceYearly: number;
  /** IRR — selling price yearly (default seats) */
  priceYearly: number;
  /** IRR — listed monthly before discount */
  listPriceMonthly: number;
  /** IRR — selling price monthly */
  priceMonthly: number;
  /** USD — listed monthly before discount */
  listPriceMonthlyUsd: number;
  /** USD — selling monthly ($8 Base · $15 Advanced) */
  priceMonthlyUsd: number;
  /** USD — listed yearly before discount */
  listPriceYearlyUsd: number;
  /** USD — selling yearly (2 months free vs monthly×12) */
  priceYearlyUsd: number;
  defaultSeats: number;
  giftSeats: number;
  guestSeats: number;
  /** Included cloud MB at default seat tier */
  includedStorageMb: number;
  forever: boolean;
  featuresFa: string[];
  featuresEn: string[];
};

export const PLANS: Record<PlanCode, PlanDefinition> = {
  FREE: {
    code: "FREE",
    nameFa: "رایگان",
    nameEn: "Free",
    taglineFa: "قابلیت‌های پایه برای ۵ کاربر با ۱۵۰ مگابایت فضای ابری — برای همیشه رایگان.",
    taglineEn: "Base features for 5 users with 150 MB cloud — forever free.",
    listPriceYearly: 0,
    priceYearly: 0,
    listPriceMonthly: 0,
    priceMonthly: 0,
    listPriceMonthlyUsd: 0,
    priceMonthlyUsd: 0,
    listPriceYearlyUsd: 0,
    priceYearlyUsd: 0,
    defaultSeats: 5,
    giftSeats: 0,
    guestSeats: 0,
    includedStorageMb: 150,
    forever: true,
    featuresFa: [
      "۵ کاربر",
      "۱۵۰ مگابایت فضای ابری",
      "پروژه و وظیفه نامحدود",
      "برد کانبان و فهرست",
      "تقویم",
      "برای همیشه رایگان",
    ],
    featuresEn: [
      "5 users",
      "150 MB cloud storage",
      "Unlimited projects & tasks",
      "Kanban & list boards",
      "Calendar",
      "Forever free",
    ],
  },
  PRO: {
    code: "PRO",
    nameFa: "پایه",
    nameEn: "Base",
    taglineFa: "ابزارهای اصلی برای تیم‌های تجاری در حال رشد.",
    taglineEn: "Core tools for growing commercial teams.",
    listPriceYearly: 5_900_000,
    priceYearly: 2_900_000,
    listPriceMonthly: 490_000,
    priceMonthly: 290_000,
    listPriceMonthlyUsd: 10,
    priceMonthlyUsd: 8,
    listPriceYearlyUsd: 120,
    priceYearlyUsd: 80, // 10× monthly — 2 months free
    defaultSeats: 10,
    giftSeats: 2,
    guestSeats: 0,
    includedStorageMb: 5 * 1024,
    forever: false,
    featuresFa: [
      "پروژه نامحدود",
      "وظیفه نامحدود",
      "مدیریت وظایف تیمی",
      "برد و کانبان",
      "فهرست وظایف",
      "تقویم",
      "پایش تیم",
      "CRM",
      "چک‌لیست شخصی",
      "پیام‌رسانی سازمانی",
      "جلسات HD · اشتراک صفحه ۷۲۰p/۱۰۸۰p",
      "اپلیکیشن اندروید و iOS",
    ],
    featuresEn: [
      "Unlimited projects",
      "Unlimited tasks",
      "Team task management",
      "Boards & kanban",
      "Task lists",
      "Calendar",
      "Team monitoring",
      "CRM",
      "Personal checklists",
      "Org messaging",
      "HD Meetings · screen share 720p/1080p",
      "Android & iOS apps",
    ],
  },
  ENTERPRISE: {
    code: "ENTERPRISE",
    nameFa: "پیشرفته",
    nameEn: "Advanced",
    taglineFa: "جعبه ابزار کامل سازمانی برای شرکت‌های بزرگ.",
    taglineEn: "Full enterprise toolkit for large orgs.",
    listPriceYearly: 10_900_000,
    priceYearly: 5_900_000,
    listPriceMonthly: 910_000,
    priceMonthly: 590_000,
    listPriceMonthlyUsd: 18,
    priceMonthlyUsd: 15,
    listPriceYearlyUsd: 216,
    priceYearlyUsd: 150, // 10× monthly — 2 months free
    defaultSeats: 10,
    giftSeats: 2,
    guestSeats: 5,
    includedStorageMb: 50 * 1024,
    forever: false,
    featuresFa: [
      "همه قابلیت‌های پایه",
      "نمودار گانت",
      "قالب‌های پروژه",
      "ورود از Trello و Excel",
      "لیدهای مالی و فروش",
      "پایش مالی",
      "گردش‌کار سفارشی",
      "کاربران مهمان",
      "سمت‌های سازمانی",
      "جلسات HD و صورت‌جلسه (تا ۵۰ نفر)",
      "نامه‌های وارده/صادره",
    ],
    featuresEn: [
      "Everything in Base",
      "Gantt charts",
      "Project templates",
      "Import from Trello & Excel",
      "Finance & sales leads",
      "Financial monitoring",
      "Custom workflows",
      "Guest users",
      "Org positions",
      "HD Meetings & minutes (up to 50)",
      "Inbound/outbound letters",
    ],
  },
};

/** Scale included storage roughly with seats (Base 5GB @10 → more at higher tiers). */
export function includedStorageForSeats(plan: PlanCode, seats: number): number {
  const base = PLANS[plan].includedStorageMb;
  if (plan === "FREE") return base;
  const ratio = seats / PLANS[plan].defaultSeats;
  return Math.round(base * Math.max(1, ratio));
}

export function giftSeatsFor(plan: PlanCode, seats: number): number {
  if (plan === "FREE") return 0;
  if (seats <= 10) return PLANS[plan].giftSeats;
  if (seats <= 50) return Math.max(PLANS[plan].giftSeats, 4);
  return Math.max(PLANS[plan].giftSeats, 8);
}

export function guestSeatsFor(plan: PlanCode): number {
  return PLANS[plan].guestSeats;
}

function seatMult(plan: PlanCode, seats: number): number {
  if (plan === "FREE") return 1;
  return seats / PLANS[plan].defaultSeats;
}

/** Yearly IRR list/sale scaled lightly by seat tier. */
export function yearlyPriceForSeats(plan: PlanCode, seats: number): {
  list: number;
  sale: number;
} {
  if (plan === "FREE") return { list: 0, sale: 0 };
  const def = PLANS[plan];
  const mult = seatMult(plan, seats);
  return {
    list: Math.round(def.listPriceYearly * mult),
    sale: Math.round(def.priceYearly * mult),
  };
}

/** Monthly IRR list/sale scaled by seat tier. */
export function monthlyPriceForSeats(plan: PlanCode, seats: number): {
  list: number;
  sale: number;
} {
  if (plan === "FREE") return { list: 0, sale: 0 };
  const def = PLANS[plan];
  const mult = seatMult(plan, seats);
  return {
    list: Math.round(def.listPriceMonthly * mult),
    sale: Math.round(def.priceMonthly * mult),
  };
}

/** Monthly USD list/sale scaled by seat tier. */
export function monthlyUsdForSeats(plan: PlanCode, seats: number): {
  list: number;
  sale: number;
} {
  if (plan === "FREE") return { list: 0, sale: 0 };
  const def = PLANS[plan];
  const mult = seatMult(plan, seats);
  return {
    list: Math.round(def.listPriceMonthlyUsd * mult * 100) / 100,
    sale: Math.round(def.priceMonthlyUsd * mult * 100) / 100,
  };
}

/** Yearly USD list/sale scaled by seat tier. */
export function yearlyUsdForSeats(plan: PlanCode, seats: number): {
  list: number;
  sale: number;
} {
  if (plan === "FREE") return { list: 0, sale: 0 };
  const def = PLANS[plan];
  const mult = seatMult(plan, seats);
  return {
    list: Math.round(def.listPriceYearlyUsd * mult * 100) / 100,
    sale: Math.round(def.priceYearlyUsd * mult * 100) / 100,
  };
}

export function extraCloudPriceToman(extraMb: number): number {
  const gb = extraMb / 1024;
  return Math.round(gb * EXTRA_CLOUD_TOMAN_PER_GB_YEAR);
}

export function extraCloudPriceUsd(extraMb: number): number {
  const gb = extraMb / 1024;
  return Math.round(gb * EXTRA_CLOUD_USD_PER_GB_YEAR * 100) / 100;
}

export function formatToman(n: number, locale: 'en' | 'fa' = 'fa'): string {
  const formatted = new Intl.NumberFormat(locale === 'fa' ? 'fa-IR' : 'en-US').format(n);
  return locale === 'fa' ? `${formatted} تومان` : `${formatted} Toman`;
}

export function formatUsd(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: n % 1 === 0 ? 0 : 2,
  }).format(n);
}

export function formatMb(mb: number, locale: 'en' | 'fa' = 'en'): string {
  if (mb < 1024) {
    return locale === 'fa' ? `${new Intl.NumberFormat('fa-IR').format(mb)} مگابایت` : `${mb} MB`;
  }
  const gb = mb / 1024;
  if (gb < 10) {
    const v = gb.toFixed(1);
    return locale === 'fa'
      ? `${new Intl.NumberFormat('fa-IR', { maximumFractionDigits: 1 }).format(Number(v))} گیگابایت`
      : `${v} GB`;
  }
  const rounded = Math.round(gb);
  return locale === 'fa'
    ? `${new Intl.NumberFormat('fa-IR').format(rounded)} گیگابایت`
    : `${rounded} GB`;
}

export function planLabelFa(code: string): string {
  if (code === "FREE") return PLANS.FREE.nameFa;
  if (code === "PRO") return PLANS.PRO.nameFa;
  if (code === "ENTERPRISE") return PLANS.ENTERPRISE.nameFa;
  return code;
}

export function planLabelEn(code: string): string {
  if (code === "FREE") return PLANS.FREE.nameEn;
  if (code === "PRO") return PLANS.PRO.nameEn;
  if (code === "ENTERPRISE") return PLANS.ENTERPRISE.nameEn;
  return code;
}
