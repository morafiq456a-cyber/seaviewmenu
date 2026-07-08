import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Lang = "ar" | "en";

/** UI string dictionary (content strings come from the DB, bilingual). */
const dict = {
  ar: {
    search: "ابحث عن طبق...",
    categories: "الأقسام",
    all: "الكل",
    featured: "المميزة",
    bestSellers: "الأكثر مبيعاً",
    newItems: "وصل حديثاً",
    offers: "العروض",
    menu: "القائمة",
    noResults: "لا توجد نتائج",
    noResultsDesc: "جرّب البحث بكلمة أخرى أو تصفّح الأقسام",
    currency: "ر.س",
    off: "خصم",
    cal: "سعرة",
    min: "دقيقة",
    outOfStock: "غير متوفر",
    spicy: "حار",
    vegetarian: "نباتي",
    new: "جديد",
    ingredients: "المكونات",
    calories: "السعرات الحرارية",
    prepTime: "وقت التحضير",
    nutrition: "المعلومات الغذائية",
    allergens: "مسببات الحساسية",
    notes: "ملاحظات",
    tags: "الوسوم",
    relatedProducts: "قد يعجبك أيضاً",
    share: "مشاركة",
    shareProduct: "مشاركة المنتج",
    copyLink: "نسخ الرابط",
    linkCopied: "تم نسخ الرابط",
    call: "اتصال",
    whatsapp: "واتساب",
    directions: "الاتجاهات",
    workingHours: "أوقات العمل",
    followUs: "تابعنا",
    backToTop: "العودة للأعلى",
    open: "مفتوح الآن",
    closed: "مغلق الآن",
    from: "من",
    to: "إلى",
    availableNow: "متوفر الآن",
    viewDetails: "عرض التفاصيل",
    poweredBy: "قائمة رقمية",
    viewWeeklySchedule: "عرض الجدول الأسبوعي",
    weeklySchedule: "الجدول الأسبوعي",
    today: "اليوم",
    // days
    sunday: "الأحد",
    monday: "الإثنين",
    tuesday: "الثلاثاء",
    wednesday: "الأربعاء",
    thursday: "الخميس",
    friday: "الجمعة",
    saturday: "السبت",
  },
  en: {
    search: "Search for a dish...",
    categories: "Categories",
    all: "All",
    featured: "Featured",
    bestSellers: "Best Sellers",
    newItems: "New Arrivals",
    offers: "Offers",
    menu: "Menu",
    noResults: "No results found",
    noResultsDesc: "Try a different keyword or browse the categories",
    currency: "SAR",
    off: "OFF",
    cal: "cal",
    min: "min",
    outOfStock: "Out of stock",
    spicy: "Spicy",
    vegetarian: "Vegetarian",
    new: "New",
    ingredients: "Ingredients",
    calories: "Calories",
    prepTime: "Prep time",
    nutrition: "Nutrition",
    allergens: "Allergens",
    notes: "Notes",
    tags: "Tags",
    relatedProducts: "You may also like",
    share: "Share",
    shareProduct: "Share product",
    copyLink: "Copy link",
    linkCopied: "Link copied",
    call: "Call",
    whatsapp: "WhatsApp",
    directions: "Directions",
    workingHours: "Working hours",
    followUs: "Follow us",
    backToTop: "Back to top",
    open: "Open now",
    closed: "Closed now",
    from: "From",
    to: "To",
    availableNow: "Available now",
    viewDetails: "View details",
    poweredBy: "Digital menu",
    viewWeeklySchedule: "View weekly schedule",
    weeklySchedule: "Weekly schedule",
    today: "Today",
    sunday: "Sunday",
    monday: "Monday",
    tuesday: "Tuesday",
    wednesday: "Wednesday",
    thursday: "Thursday",
    friday: "Friday",
    saturday: "Saturday",
  },
} as const;

export type TKey = keyof (typeof dict)["en"];

interface I18nContextValue {
  lang: Lang;
  dir: "rtl" | "ltr";
  isRTL: boolean;
  setLang: (l: Lang) => void;
  toggleLang: () => void;
  t: (key: TKey) => string;
  /** Pick the right localized field from a bilingual record. */
  pick: <T extends Record<string, unknown>>(row: T, base: string) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

const STORAGE_KEY = "menu-lang";

export function LanguageProvider({
  children,
  defaultLang = "ar",
}: {
  children: ReactNode;
  defaultLang?: Lang;
}) {
  const [lang, setLangState] = useState<Lang>(defaultLang);

  // Hydrate from localStorage after mount (avoids SSR mismatch).
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Lang | null;
    if (stored === "ar" || stored === "en") setLangState(stored);
  }, []);

  useEffect(() => {
    const dir = lang === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    localStorage.setItem(STORAGE_KEY, l);
  }, []);

  const toggleLang = useCallback(() => {
    setLangState((prev) => {
      const next = prev === "ar" ? "en" : "ar";
      localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }, []);

  const value = useMemo<I18nContextValue>(() => {
    const dir = lang === "ar" ? "rtl" : "ltr";
    return {
      lang,
      dir,
      isRTL: lang === "ar",
      setLang,
      toggleLang,
      t: (key) => dict[lang][key] ?? key,
      pick: (row, base) => {
        const val = row[`${base}_${lang}`] ?? row[`${base}_en`] ?? row[`${base}_ar`];
        return typeof val === "string" ? val : "";
      },
    };
  }, [lang, setLang, toggleLang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within LanguageProvider");
  return ctx;
}
