import { NewsItem } from "./types";

export const MAX_NEWS_AGE_DAYS = 15;
export const MAX_NEWS_AGE_MS = MAX_NEWS_AGE_DAYS * 24 * 60 * 60 * 1000;

// Arabic month mappings
const ARABIC_MONTHS: Record<string, number> = {
  "جانفي": 0, "يناير": 0,
  "فيفري": 1, "فبراير": 1,
  "مارس": 2,
  "أفريل": 3, "ابريل": 3,
  "ماي": 4, "مايو": 4,
  "جوان": 5, "يونيو": 5,
  "جويلية": 6, "يوليو": 6,
  "أوت": 7, "اوت": 7, "أغسطس": 7, "اغسطس": 7,
  "سبتمبر": 8,
  "أكتوبر": 9, "اكتوبر": 9,
  "نوفمبر": 10,
  "ديسمبر": 11,
};

// Blacklisted foreign or non-local news sites that often get pulled by generic RSS queries
const FOREIGN_OR_DISALLOWED_SOURCES = [
  "hespress",
  "هسبريس",
  "بوابة الأهرام",
  "الأهرام",
  "جريدة المال",
  "برلمانى",
  "بوابة أخبار اليوم",
  "أخبار اليوم",
  "vietnam",
  "مدى مصر",
  "عربي21",
  "رأي اليوم",
  "الشرق للأخبار",
  "اليوم السابع",
  "اليوم 24",
  "الجزيرة",
  "العربية",
  "سكاي نيوز",
  "بي بي سي",
  "cnn",
  "وكالة أنباء الإمارات",
  "واس",
  "بترا",
  "وكالة الأنباء العراقية",
  "وفا",
];

// Strict Negative Keywords: foreign countries, foreign politicians, international conflicts
const STRICT_EXCLUSIONS: RegExp[] = [
  /المغرب|مغربي|الرباط|التويزي|أخنوش|hespress|هسبريس|كازابلانكا/i,
  /مصر|مصري|القاهرة|السيسي|بوابة الأهرام|اليوم السابع|جريدة المال|برلمانى|المنيا|مدى مصر|عربي21/i,
  /الأردن|الاردن|عمان|طراونة|الصفدي|الملك عبد الله/i,
  /العراق|بغداد|البصرة|أربيل|السوداني/i,
  /لبنان|بيروت|نواف سلام|حزب الله/i,
  /الكويت|السعودية|الرياض|الدوحة|قطر|أبوظبي|الإمارات|دبي|البحرين/i,
  /السودان|الخرطوم|اليمن|صنعاء|سوريا|دمشق/i,
  /البرلمان الأوروبي|الكونغرس|واشنطن|بايدن|ترامب|أوكرانيا|روسيا|بوتين|زيلينسكي|vietnam/i,
  /ريال مدريد|برشلونة|ليفربول|دوري أبطال/i,
  /إسرائيل|نتنياهو|غزة|فلسطين|طوفان الأقصى|الضفة الغربية/i,
];

/**
 * Extracts a reliable epoch millisecond timestamp from NewsItem.
 * Uses publishedAt ISO string first, or parses pubDate.
 */
export function getNewsTimestamp(item: Partial<NewsItem>): number | null {
  if (!item) return null;

  if (item.publishedAt) {
    const parsed = Date.parse(item.publishedAt);
    if (!isNaN(parsed)) return parsed;
  }

  const s = (item.pubDate || "").trim();
  if (!s) return null;

  const now = Date.now();

  // Relative Arabic expressions
  if (/الآن|اليوم/i.test(s)) {
    return now;
  }
  if (/أمس|امس/i.test(s)) {
    return now - 24 * 60 * 60 * 1000;
  }
  if (/منذ\s*(\d+)\s*(?:يوم|أيام|ايام)/i.test(s)) {
    const m = s.match(/منذ\s*(\d+)\s*(?:يوم|أيام|ايام)/i);
    const days = m && m[1] ? parseInt(m[1], 10) : 1;
    return now - days * 24 * 60 * 60 * 1000;
  }
  if (/منذ\s*(\d+)\s*(?:ساعة|ساعات)/i.test(s)) {
    const m = s.match(/منذ\s*(\d+)\s*(?:ساعة|ساعات)/i);
    const hours = m && m[1] ? parseInt(m[1], 10) : 1;
    return now - hours * 60 * 60 * 1000;
  }
  if (/منذ\s*(\d+)\s*(?:دقيقة|دقائق)/i.test(s)) {
    return now;
  }

  // Standard formats (ISO 8601 or RFC 822)
  const standard = Date.parse(s);
  if (!isNaN(standard)) {
    return standard;
  }

  // Check YYYY-MM-DD HH:MM:SS
  const ymdMatch = s.match(/(\d{4})-(\d{1,2})-(\d{1,2})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/);
  if (ymdMatch) {
    const y = parseInt(ymdMatch[1], 10);
    const mo = parseInt(ymdMatch[2], 10) - 1;
    const d = parseInt(ymdMatch[3], 10);
    const h = parseInt(ymdMatch[4] || "12", 10);
    const mi = parseInt(ymdMatch[5] || "0", 10);
    const sec = parseInt(ymdMatch[6] || "0", 10);
    return new Date(y, mo, d, h, mi, sec).getTime();
  }

  // Arabic date like "16 أكتوبر، 10:38 م" or "1 جوان، 09:00 ص"
  for (const [mName, mIdx] of Object.entries(ARABIC_MONTHS)) {
    if (s.includes(mName)) {
      const rx = new RegExp(`(?:(\\d{1,2})\\s*(?:[،,-]\\s*)?${mName}|${mName}\\s*(?:[،,-]\\s*)?(\\d{1,2}))`);
      const match = s.match(rx);
      const day = match ? parseInt(match[1] || match[2], 10) : 1;
      const yrMatch = s.match(/20\d{2}/);
      const year = yrMatch ? parseInt(yrMatch[0], 10) : new Date().getFullYear();
      return new Date(year, mIdx, day, 12, 0, 0).getTime();
    }
  }

  return null;
}

/**
 * Validates that the news item is strictly within the last 15 days.
 */
export function isWithin15Days(item: Partial<NewsItem>): boolean {
  const ts = getNewsTimestamp(item);
  if (!ts) return false;

  const now = Date.now();
  const ageMs = now - ts;
  // Item must not be older than 15 days, and not more than 2 hours in the future
  return ageMs >= -2 * 60 * 60 * 1000 && ageMs <= MAX_NEWS_AGE_MS;
}

/**
 * Strict Local, Parliamentary & Freshness Relevance Filter
 * 1. Strict 15-Day Freshness Filter (أقصى حد آخر 15 يوم)
 * 2. Strict Hyper-Local & Parliamentary Keywords:
 *    "منوبة", "الدندان", "سيدي عمر", "قصر السعيد", "أسماء درويش", "مجلس نواب الشعب"
 * 3. Strict Exclusions: International and random news completely excluded.
 */
export function isStrictlyRelevantNews(item: Partial<NewsItem>): boolean {
  if (!item || !item.title) return false;

  // 1. Strict 15-Day Freshness Check
  if (!isWithin15Days(item)) {
    return false;
  }

  const title = (item.title || "").trim();
  const summary = (item.summary || "").trim();
  const source = (item.source || "").toLowerCase().trim();
  const category = (item.category || "").trim();
  const text = `${title} ${summary} ${category}`.toLowerCase();

  // 2. Reject foreign or blacklisted sources
  if (FOREIGN_OR_DISALLOWED_SOURCES.some((s) => source.includes(s))) {
    return false;
  }

  // 3. Reject foreign countries, foreign politicians, international conflicts
  if (STRICT_EXCLUSIONS.some((rx) => rx.test(text))) {
    return false;
  }

  // 4. Strict Hyper-Local & Parliamentary Positive Match
  // Mandatory core keywords as specified:
  // "منوبة", "الدندان", "سيدي عمر", "قصر السعيد", "أسماء درويش", "مجلس نواب الشعب"
  const isDirectTargetKeyword =
    /منوبة|الدندان|سيدي عمر|قصر السعيد|القصر السعيد|أسماء درويش|اسماء درويش|درويش|مجلس نواب الشعب/i.test(
      text
    );

  // Regional sub-zones within constituency
  const isConstituencySubZone =
    /وادي قريانة|سليمان كاهية|حي البرتقال/i.test(text);

  // Regional utilities and institutions in Manouba/Den Den
  const isRegionalUtility =
    /صوناد|sonede|ستاغ|steg|الديوان الوطني للتطهير|onas|بلدية منوبة|بلدية الدندان|ولاية منوبة|وزارة التجهيز|نقل تونس|transtu|مستشفى القصاب/i.test(
      text
    );

  // Official parliament activities from arp.tn
  const isOfficialArpSource =
    source.includes("arp.tn") ||
    source.includes("مجلس نواب الشعب") ||
    item.sourceType === "parliament";

  const isArpWork =
    /الجلسة العامة|أشغال اللجان|ندوة الرؤساء|مكتب المجلس|لجنة /i.test(text);

  if (isDirectTargetKeyword || isConstituencySubZone || isRegionalUtility) {
    return true;
  }

  if (isOfficialArpSource && isArpWork) {
    return true;
  }

  return false;
}
