import fs from "fs";
import path from "path";
import { 
  Complaint, 
  ComplaintInput, 
  Appointment, 
  AppointmentSettings,
  ProjectItem, 
  PollItem, 
  NewsItem,
  LiveStreamConfig,
  LiveChatMessage,
  ComplaintCategory,
  GuideItem,
  GuideCategory,
  GUIDE_CATEGORIES,
  YouthProgram,
  YouthProgramCategory,
  YOUTH_PROGRAM_CATEGORIES,
  YouthRequest,
  YouthRequestStatus,
  MANOUBA_ZONES,
  ManoubaZone
} from "./types";
import { isStrictlyRelevantNews } from "./newsFilter";
import { setStoreItem } from "./platform-store";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "db.json");

interface DatabaseSchema {
  complaints: Complaint[];
  appointments?: Appointment[];
  appointmentSettings?: AppointmentSettings;
  projects?: ProjectItem[];
  polls?: PollItem[];
  customAlerts?: NewsItem[];
  ingestedNews?: NewsItem[];
  lastIngestionTime?: string;
  liveStream?: LiveStreamConfig;
  liveChatMessages?: LiveChatMessage[];
  guides?: GuideItem[];
  youthPrograms?: YouthProgram[];
  youthRequests?: YouthRequest[];
}

export { MANOUBA_ZONES, type ManoubaZone };

export const CATEGORIES_LIST = [
  "الماء والصوناد",
  "الكهرباء والستاغ",
  "الطرقات والتجهيز",
  "الصحة",
  "النقل",
  "الشؤون الاجتماعية",
  "البيئة والنظافة",
  "أخرى",
] as const;

// Citizen Requests: Clean initial state with ZERO automatic mock fallback
export const INITIAL_12_COMPLAINTS: Complaint[] = [];

export const INITIAL_PROJECTS: ProjectItem[] = [
  {
    id: "PRJ-01",
    title: "تهيئة وتأهيل شبكة التطهير وتصريف المياه المستعملة بسيدي عمر",
    zone: "سيدي عمر",
    targetMinistry: "الديوان الوطني للتطهير (ONAS) ووزارة البيئة",
    status: "في طور الإنجاز",
    progress: 65,
    summary: "مد قنوات تطهير جديدة وتجديد الشبكة المهترئة لإنهاء إشكال تجمع المياه الآسنة بالمناطق السكنية المنخفضة بسيدي عمر.",
    officialLetterText: "مساءلة ومراسلة رسمية عدد م.ب/منوبة/2026/184 صادرة عن المكتب البرلماني للنائب أسماء درويش موجهة إلى الرئيس المدير العام للديوان الوطني للتطهير.",
    lastUpdate: "أشغال مد القنوات متواصلة - نسبة الإنجاز بلغت 65%",
    budgetEstimate: "1.1 مليون دينار",
  },
  {
    id: "PRJ-02",
    title: "مشروع إعادة تهيئة وتجهيز دار الشباب بالدندان",
    zone: "الدندان الشمالي",
    targetMinistry: "وزارة الشباب والرياضة وبلدية الدندان",
    status: "في طور الإنجاز",
    progress: 80,
    summary: "صيانة الملاعب الرياضية، تجهيز قاعة الروبوتيك والمعلوماتية، وتوفير التجهيزات السمعية البصرية لشباب الدندان وقصر السعيد.",
    officialLetterText: "متابعة حثيثة وجلسة عمل برلمانية بمقر وزارة الشباب والرياضة لتسريع استكمال الصفقات وصرف القسط المتبقي للبلدية.",
    lastUpdate: "استكمال قاعة الأنشطة وبداية تجهيز الفضاء الرياضي",
    budgetEstimate: "480 ألف دينار",
  },
  {
    id: "PRJ-03",
    title: "ربط وتأهيل الأحياء الشعبية بالماء الصالح للشراب بسيدي عمر ومنوبة الوسطى",
    zone: "سيدي عمر ومنوبة الوسطى",
    targetMinistry: "الشركة الوطنية لاستغلال وتوزيع المياه (SONEDE)",
    status: "تم التدخل",
    progress: 100,
    summary: "تجديد القناة الرئيسية واستبدال الأنابيب القديمة بأخرى ذات قطر مضاعف للقضاء نهائياً على تذبذب ضغط المياه وأزمة العطش الصيفية.",
    officialLetterText: "جلسة عمل مشتركة بمقر إقليم SONEDE بمنوبة ومحضر اتفاق تدخل استعجالي رقم 45/2026 بإشراف النائب أسماء درويش.",
    lastUpdate: "تم الانتهاء من الأشغال وإعادة تعبيد الطرقات وتطبيع ضغط المياه بنجاح.",
    budgetEstimate: "650 ألف دينار",
  },
  {
    id: "PRJ-04",
    title: "مشروع تهيئة وتأهيل وادي قريانة وحماية أحياء الدندان وقصر السعيد من الفيضانات",
    zone: "الدندان الجنوبي وقصر السعيد",
    targetMinistry: "وزارة التجهيز والإسكان وبلدية الدندان",
    status: "في طور الإنجاز",
    progress: 72,
    summary: "بناء قنوات خرسانية ضخمة وتطهير مجرى الوادي لمنع تجمع مياه الأمطار وحماية المساكن المجاورة بقصر السعيد والدندان.",
    officialLetterText: "سؤال كتابي رقم 114/2026 موجه لوزيرة التجهيز للتسريع في إتمام الجسور الصغرى وصرف الأقساط التكميلية للمقاول.",
    lastUpdate: "أشغال بناء الجدران الاستنادية متواصلة - نسبة الإنجاز بلغت 72%",
    budgetEstimate: "4.8 مليون دينار",
  },
  {
    id: "PRJ-05",
    title: "تدعيم أسطول حافلات النقل المدرسي والجامعي (خطوط 42 و93 و98)",
    zone: "منوبة المدينة ومنوبة الوسطى",
    targetMinistry: "وزارة النقل وشركة نقل تونس (TRANSTU)",
    status: "في انتظار رد الوزارة",
    progress: 35,
    summary: "مطالبة برلمانية رسمية بتخصيص 4 حافلات مزدوجة جديدة لخدمة المركب الجامعي بمنوبة والمدارس الإعدادية والثانوية بالجهة.",
    officialLetterText: "مساءلة برلمانية شفوية ومكتوبة بتاريخ 12 أكتوبر 2026 بخصوص نقص تواتر الرحلات الصباحية والمسائية.",
    lastUpdate: "تمت إحالة الملف إلى الإدارة العامة لشركة نقل تونس وننتظر الرد المكتوب وجدول المواعيد الجديد.",
    budgetEstimate: "مشروع تدعيم لوجستي وطني",
  },
  {
    id: "PRJ-06",
    title: "اقتناء تجهيزات طبية متطورة للمركز الصحي الوسيط بالدندان",
    zone: "الدندان الشمالي",
    targetMinistry: "وزارة الصحة والإدارة الجهوية للصحة بمنوبة",
    status: "في طور الإنجاز",
    progress: 58,
    summary: "توفير جهاز تصوير صدى حديث (Echographie)، تعزيز مخبر التحاليل السريعة، وتوفير طبيب اختصاص أطفال يومين أسبوعياً.",
    officialLetterText: "مراسلة برلمانية مباشرة لوزير الصحة بتاريخ 5 أكتوبر 2026 حول دعم الخط الأول للرعاية الصحية بالدندان.",
    lastUpdate: "تمت المصادقة على صفقة التجهيزات من قبل وزارة الصحة والتسليم مبرمج خلال الثلاثي الحالي.",
    budgetEstimate: "280 ألف دينار",
  },
];

export const DEFAULT_APPOINTMENT_SETTINGS: AppointmentSettings = {
  days: [
    "الإثنين (10:00 - 13:00)",
    "الأربعاء (14:00 - 17:00)",
    "الجمعة (10:00 - 13:00)",
  ],
  timeSlots: [
    "10:00 صباحاً",
    "10:30 صباحاً",
    "11:30 صباحاً",
    "12:30 ظهراً",
    "14:30 بعد الزوال",
    "15:30 بعد الزوال",
  ],
  note: "تستقبل النائب أسماء درويش والفريق البرلماني المواطنين أيام الإثنين والأربعاء والجمعة بالمكتب البرلماني بمنوبة لتسليم العرائض باليد والاستماع الشخصي لمشاغلكم.",
};

export const INITIAL_APPOINTMENTS: Appointment[] = [
  {
    id: "RDV-101",
    createdAt: "2026-10-18T11:00:00.000Z",
    citizenName: "سامي الماجري",
    phone: "22114477",
    zone: "منوبة المدينة",
    date: "الإثنين القادم",
    timeSlot: "10:30 صباحاً",
    topic: "إشكال تسوية عقارية بحي البرتقال",
    status: "مؤكد",
    notes: "المكتب البرلماني للنائب أسماء درويش - شارع الحبيب بورقيبة، منوبة",
  },
  {
    id: "RDV-102",
    createdAt: "2026-10-19T16:20:00.000Z",
    citizenName: "لطيفة الشابي",
    phone: "98335577",
    zone: "الدندان الشمالي",
    date: "الأربعاء القادم",
    timeSlot: "14:30 بعد الزوال",
    topic: "مقترح تهيئة فضاء تجاري بلدي للباعة",
    status: "مؤكد",
    notes: "المكتب البرلماني للنائب أسماء درويش - شارع الحبيب بورقيبة، منوبة",
  },
];

export const INITIAL_POLLS: PollItem[] = [
  {
    id: "POLL-01",
    title: "مشروع تهيئة ساحة السوق القديم بالدندان وتطويرها",
    zone: "الدندان",
    description: "شاركونا رأيكم كمتساكنين بالجهة: ما هو الاستخدام الأفضل لهذا الفضاء البلدي المهجور؟",
    options: [
      { id: "opt-1", label: "مأوى سيارات طابقي منظم وحديقة عمومية للعائلات", votes: 342 },
      { id: "opt-2", label: "سوق بلدي نموذجي عصري ومقنن للباعة المرخصين", votes: 215 },
      { id: "opt-3", label: "مركب شبابي وثقافي وفضاء رياضي ترفيهي", votes: 189 },
    ],
    totalVotes: 746,
    endDate: "30 نوفمبر 2026",
  },
  {
    id: "POLL-02",
    title: "أولويات الميزانية التشاركية لبلدية منوبة لسنة 2027",
    zone: "منوبة وسيدي عمر",
    description: "أي المجالات تعتبرونها أولوية قصوى لتدخل البلدية وضخ الميزانية الاستثمارية القادمة؟",
    options: [
      { id: "opt-1", label: "تعبيد الطرقات والإنارة الموفرة للطاقة (LED) بالأحياء الشعبية", votes: 521 },
      { id: "opt-2", label: "المساحات الخضراء، التشجير، ونظافة المحيط", votes: 310 },
      { id: "opt-3", label: "تطوير الخدمات الرقمية البلدية وإسناد الرخص إلكترونياً", votes: 142 },
    ],
    totalVotes: 973,
    endDate: "15 ديسمبر 2026",
  },
];

export const INITIAL_CUSTOM_ALERTS: NewsItem[] = [
  {
    id: "alt-custom-1",
    title: "تنبيه SONEDE منوبة: صيانة طارئة بالقناة الرئيسية بسيدي عمر وإعادة الضخ تدريجياً ابتداء من 18:00.",
    source: "إقليم SONEDE منوبة",
    pubDate: "اليوم",
    publishedAt: new Date().toISOString(),
    isUrgent: true,
    isCustom: true,
    category: "مياه",
  },
  {
    id: "alt-custom-2",
    title: "جلسة برلمانية: النائب أسماء درويش توجه سؤالاً لوزيرة التجهيز حول تسريع حماية الدندان وقصر السعيد من الفيضانات.",
    source: "مجلس نواب الشعب",
    pubDate: "أمس",
    publishedAt: new Date(Date.now() - 86400000).toISOString(),
    isUrgent: false,
    isCustom: true,
    category: "برلمان",
  },
  {
    id: "alt-custom-3",
    title: "بلدية الدندان: انطلاق حملة ليلية لصيانة أعمدة الإنارة الموفرة للطاقة بالطريق الوطنية رقم 7.",
    source: "بلدية الدندان",
    pubDate: "منذ 3 ساعات",
    publishedAt: new Date(Date.now() - 3 * 3600000).toISOString(),
    isUrgent: false,
    isCustom: true,
    category: "بلدية",
  },
];

export const INITIAL_INGESTED_NEWS: NewsItem[] = [
  {
    id: "ingest-arp-asma-01",
    title: "النائب أسماء درويش تودع سؤالاً كتابياً لوزارة التجهيز والإسكان بخصوص تسريع إتمام منشآت حماية الدندان وقصر السعيد من الفيضانات.",
    source: "مجلس نواب الشعب",
    pubDate: "اليوم",
    publishedAt: new Date().toISOString(),
    summary: "مراسلة برلمانية استعجالية لمتابعة جاهزية مجرى وادي قريانة وشبكات تصريف مياه الأمطار قبل موسم الشتاء وحماية المساكن المجاورة.",
    link: "https://www.arp.tn",
    isUrgent: true,
    isCustom: false,
    isPinned: true,
    sourceType: "parliament",
    category: "الجلسة العامة",
  },
  {
    id: "ingest-arp-02",
    title: "لجنة التخطيط والمالية بالبرلمان: مناقشة مشاريع التنمية الجهوية والاعتمادات المخصصة للبنية التحتية بولاية منوبة.",
    source: "مجلس نواب الشعب (arp.tn)",
    pubDate: "اليوم",
    publishedAt: new Date(Date.now() - 3600000).toISOString(),
    summary: "تدارست اللجنة البرلمانية نسق إنجاز المستشفى الجهوي متعدد الاختصاصات ومشاريع التطهير والماء الصالح للشرب بالمعتمديات.",
    link: "https://www.arp.tn/blog/1/post/9763",
    isUrgent: false,
    isCustom: false,
    isPinned: true,
    sourceType: "parliament",
    category: "أشغال اللجان",
  },
  {
    id: "ingest-reg-03",
    title: "ولاية منوبة: جلسة عمل جهوية للتسريع في صيانة قنوات الصوناد بسيدي عمر وتفادي انقطاعات مياه الشرب.",
    source: "وكالة تونس إفريقيا للأنباء (TAP)",
    pubDate: "منذ 3 ساعات",
    publishedAt: new Date(Date.now() - 3 * 3600000).toISOString(),
    summary: "متابعة ميدانية لإقليم الشركة الوطنية لاستغلال وتوزيع المياه بمنوبة لتجديد الأنابيب المهترئة ورفع ضغط التوزيع بالأحياء السكنية.",
    link: "https://www.tap.info.tn",
    isUrgent: false,
    isCustom: false,
    sourceType: "regional",
    category: "منوبة والدندان",
  },
  {
    id: "ingest-arp-04",
    title: "لجنة الصحة وشؤون الأسرة بالبرلمان تواصل مناقشة مقترح القانون المتعلق بضبط النظام الأساسي لقطاع الصحة ودعم المستوصفات.",
    source: "مجلس نواب الشعب (arp.tn)",
    pubDate: "منذ يومين",
    publishedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    summary: "مناقشة سبل تعزيز أطباء الاختصاص والتجهيزات الطبية في المراكز الصحية الوسيطة ومنها مركز الدندان ومنوبة.",
    link: "https://www.arp.tn/blog/1/post/9764",
    isUrgent: false,
    isCustom: false,
    sourceType: "parliament",
    category: "أشغال اللجان",
  },
  {
    id: "ingest-reg-05",
    title: "بلدية الدندان: انطلاق أشغال صيانة الطرقات وتجديد شبكة الإنارة الموفرة للطاقة (LED) بنهج الاستقلال ومدخل سيدي عمر.",
    source: "إذاعة موزاييك أف أم",
    pubDate: "منذ 5 ساعات",
    publishedAt: new Date(Date.now() - 5 * 3600000).toISOString(),
    summary: "تدخل بلدي عاجل استجابة لمطالب متساكني المنطقة لتحسين الرؤية الليلية وتسهيل حركة المرور.",
    link: "https://www.mosaiquefm.net",
    isUrgent: false,
    isCustom: false,
    sourceType: "regional",
    category: "منوبة والدندان",
  },
];

export const DEFAULT_LIVE_STREAM: LiveStreamConfig = {
  id: "live-stream-01",
  title: "جلسة حوار مفتوح وبث مباشر: متابعة مشاغل أهالي منوبة والدندان ومشاريع البنية التحتية",
  liveTitle: "جلسة حوار مفتوح وبث مباشر: متابعة مشاغل أهالي منوبة والدندان ومشاريع البنية التحتية",
  description: "لقاء تفاعلي مباشر مع النائب أسماء درويش للإجابة عن أسئلة المتساكنين ومتابعة مشاغل الأحياء (الماء الصالح للشراب، حماية وادي قريانة، صيانة الطرقات والمستوصفات).",
  videoUrl: "https://www.youtube.com/embed/5qap5aO4i9A",
  streamUrl: "https://www.youtube.com/embed/5qap5aO4i9A",
  status: "ended",
  isLive: false,
  scheduledFor: "السبت القادم - الساعة 19:00",
  viewersCount: 0,
  updatedAt: new Date().toISOString(),
};

export const INITIAL_LIVE_CHAT_MESSAGES: LiveChatMessage[] = [
  {
    id: "chat-msg-01",
    citizenName: "حمادي بن سالم",
    zone: "سيدي عمر",
    phone: "21345678",
    message: "مساء الخير سيدة النائبة، نحبو نعرفو وين وصلت أشغال مد قنوات الصوناد في نهج الأمل بسيدي عمر بعد الانقطاعات الأخيرة؟",
    createdAt: new Date(Date.now() - 35 * 60000).toISOString(),
    status: "pending",
    isPinned: true,
  },
  {
    id: "chat-msg-02",
    citizenName: "سندس الماجري",
    zone: "الدندان الشمالي",
    phone: "55987123",
    message: "المستوصف في الدندان يشهد نقص كبير في أدوية ضغط الدم والسكري، هل فما تدخل مرتقب ومراسلة لوزارة الصحة؟",
    createdAt: new Date(Date.now() - 22 * 60000).toISOString(),
    status: "pending",
  },
  {
    id: "chat-msg-03",
    citizenName: "مراد القروي",
    zone: "قصر السعيد",
    phone: "98112233",
    message: "شكراً على المجهودات.. حبيت نسأل على مشروع تهيئة مجرى وادي قريانة هل الأشغال ستنتهي قبل موسم الأمطار لحماية المنازل؟",
    createdAt: new Date(Date.now() - 15 * 60000).toISOString(),
    status: "converted",
    isConvertedToComplaint: true,
    complaintId: "TN-1024",
  },
  {
    id: "chat-msg-04",
    citizenName: "فاطمة الغربي",
    zone: "منوبة الوسطى (حي البرتقال / سليمان كاهية)",
    phone: "24556677",
    message: "نطالبو بتكثيف دوريات الحافلة رقم 98 في أوقات الذروة المدرسية أمام معهد سليمان كاهية، الاكتظاظ كبير برشا.",
    createdAt: new Date(Date.now() - 5 * 60000).toISOString(),
    status: "pending",
  },
];

export const INITIAL_GUIDES: GuideItem[] = [
  {
    id: "guide-01",
    title: "استخراج مضمون الحالة المدنية (ولادة، وفاة، زواج)",
    category: "البلدية",
    keywords: ["مضمون", "ولادة", "حالة مدنية", "بلدية", "دفتر عائلي", "رسم ولادة", "منوبة", "الدندان"],
    requiredDocuments: [
      "بطاقة التعريف الوطنية لطالب الوثيقة أو الدفتر العائلي.",
      "معلوم الطابع الجبائي والبلدي المستوجب (500 مليم للمضمون العادي / 2 دنانير للمضمون الصادر عن المنظومة الوطنية المرقمنة).",
      "تحديد تاريخ ومكان تسجيل الولادة ورقم الرسم البلدي إن توفر.",
    ],
    steps: [
      "التوجه إلى شباك الحالة المدنية بأقرب قصر بلدي أو دائرة بلدية (منوبة أو الدندان).",
      "تقديم رقم بطاقة التعريف أو الدفتر العائلي للشون المعني بالرسم.",
      "دفع المعاليم القانونية واستلام المضمون فورياً مصادقاً عليه، أو استخراجه إلكترونياً عبر بوابة الهوية الرقمية ء-هوية.",
    ],
    location: "قصر بلدية منوبة (شارع الحبيب بورقيبة) / الدائرة البلدية بسيدي عمر / قصر بلدية الدندان (شارع المغرب العربي)",
    departmentContact: {
      address: "شارع الحبيب بورقيبة، منوبة",
      phone: "71 600 320",
      workingHours: "من الإثنين إلى الجمعة: 08:30 - 16:30",
    },
    processingTime: "تسليم فوري على الشباك (أو خلال ثوانٍ إلكترونياً)",
    cost: "500 مليم (ورقي) / مجاني عبر بوابة الهوية الرقمية",
    downloadableFormUrl: "https://www.e-houwiya.tn",
    createdAt: "2026-10-15T08:00:00.000Z",
    updatedAt: "2026-10-20T10:00:00.000Z",
  },
  {
    id: "guide-02",
    title: "استخراج بطاقة السوابق العدلية (بطاقة عدد 3 - B3)",
    category: "الإدارات الجهوية",
    keywords: ["بطاقة عدد 3", "b3", "سوابق عدلية", "أمن", "شرطة", "حرس", "منطقة الأمن الوطني", "منوبة"],
    requiredDocuments: [
      "نسخة من بطاقة التعريف الوطنية مع الاستظهار بالأصل.",
      "مضمون ولادة لم تمضِ على تاريخ استخراجه 3 أشهر.",
      "وصل خلاص معلوم الطابع الجبائي (طابع بقيمة 3 دنانير من قباضة المالية أو دفع إلكتروني).",
      "تعمير استمارة طلب بطاقة السوابق العدلية والتنصيص على العنوان الفعلي.",
    ],
    steps: [
      "سحب وتعمير الاستمارة أو التسجيل عبر المنظومة الوطنية لوزارة الداخلية (b3.interieur.gov.tn).",
      "إيداع الملف المكتمل لدى مركز الشرطة أو الحرس الوطني مرجع النظر الترابي لمحل السكنى.",
      "استلام البطاقة شخصياً أو عبر رسالة مضمونة الوصول عبر البريد السريع خلال الآجال المحددة.",
    ],
    location: "منطقة الأمن الوطني بمنوبة (نهج الاستقلال) / مركز شرطة منوبة / مركز شرطة الدندان (أو إلكترونياً)",
    departmentContact: {
      address: "نهج الاستقلال، منوبة",
      phone: "71 601 222",
      workingHours: "من الإثنين إلى الجمعة: 08:00 - 17:00",
    },
    processingTime: "بين 5 و 10 أيام عمل",
    cost: "3 دنانير (طابع جبائي) + معلوم البريد السريع إن طُلب",
    downloadableFormUrl: "https://b3.interieur.gov.tn",
    createdAt: "2026-10-15T08:30:00.000Z",
    updatedAt: "2026-10-20T10:00:00.000Z",
  },
  {
    id: "guide-03",
    title: "مطلب الانتفاع ببرنامج الأمان الاجتماعي ومنحة العائلات المعوزة (بطاقة أمان)",
    category: "الشؤون الاجتماعية",
    keywords: ["أمان اجتماعي", "عائلات معوزة", "منحة قارة", "بطاقة علاج مجاني", "شؤون اجتماعية", "دفتر أبيض", "منوبة", "الدندان"],
    requiredDocuments: [
      "نسخ من بطاقات التعريف الوطنية لربّ العائلة والقرين والأبناء المقيمين.",
      "مضامين ولادة لجميع أفراد الأسرة لم تمضِ عليها 3 أشهر.",
      "شهادات حضور مدرسية أو جامعية للأبناء المزاولين للتعليم.",
      "شهادة عدم الانخراط في الصناديق الاجتماعية (CNSS / CNRPS) للبالغين العاطلين عن العمل.",
      "شهادة طبية أو بطاقة إعاقة في صورة وجود فرد يعاني من مرض مزمن أو إعاقة.",
      "نسخة من عقد الكراء مسجل أو شهادة إقامة مسلمة من مركز الأمن الوطني.",
    ],
    steps: [
      "إيداع الملف الكامل لدى الأخصائي الاجتماعي المكلف بالعمادة بالوحدة المحلية للنهوض الاجتماعي بمنوبة.",
      "إجراء البحث الاجتماعي الميداني والمعاينة المنزلية من قبل الأخصائي الاجتماعي.",
      "عرض الملف على اللجنة الجهوية للبرنامج لتقييم المؤشر الاجتماعي وتحديد الاستحقاق وإصدار بطاقة الأمان.",
    ],
    location: "الوحدة المحلية للنهوض الاجتماعي بمنوبة (نهج الهادي شاكر) / قسم النهوض الاجتماعي بالإدارة الجهوية للشؤون الاجتماعية بمنوبة",
    departmentContact: {
      address: "نهج الهادي شاكر، منوبة",
      phone: "71 602 110",
      workingHours: "من الإثنين إلى الجمعة: 08:30 - 15:30",
    },
    processingTime: "من أسبوعين إلى شهر لإتمام البحث الاجتماعي والتثبت",
    cost: "مجاني بالكامل",
    downloadableFormUrl: "https://www.social.gov.tn",
    createdAt: "2026-10-15T09:00:00.000Z",
    updatedAt: "2026-10-20T10:00:00.000Z",
  },
  {
    id: "guide-04",
    title: "الحصول على رخصة بناء أو تهيئة وتوسعة عقار سكني",
    category: "البلدية",
    keywords: ["رخصة بناء", "بلدية", "عقار", "شهادة ملكية", "مهندس معماري", "تهيئة", "أشغال", "منوبة", "الدندان"],
    requiredDocuments: [
      "مطلب رخصة بناء على مطبوعة تسحب من الإدارة الفنية للبلدية ممضى من الطالب.",
      "شهادة ملكية حديثة للعقار أو سند ملكية قانوني مسجل ومصادق عليه.",
      "مثال موقعي وشهادة إبراء بلدي لخلاص الأداء الموظف على العقارات (الزبلة والخروبة).",
      "ملف هندسي معماري كامل (مشاريع البناء) في 5 نظائر معدة من قبل مهندس معماري مرسم بجدول الهيئة.",
      "دراسة فنية للمتانة والسلامة معدة من قبل مكتب مراقبة فنية أو مهندس استشاري حسب صنف البناية.",
    ],
    steps: [
      "إعداد الملف الهندسي والمستندات القانونية وإيداعه بالشباك الموحد للبلدية مقابل وصل إيداع.",
      "معاينة العقار ميدانياً من قبل أعوان الإدارة الفنية للتثبت من مطابقة أمثلة التهيئة العمرانية.",
      "عرض الملف على اللجنة الفنية لرخص البناء وتسليم القرار البلدي بالترخيص وخلاص المعاليم المستوجبة.",
    ],
    location: "الإدارة الفنية لبلدية منوبة (شارع الحبيب بورقيبة) / الإدارة الفنية لبلدية الدندان (شارع المغرب العربي)",
    departmentContact: {
      address: "شارع الحبيب بورقيبة، منوبة",
      phone: "71 600 320",
      workingHours: "من الإثنين إلى الجمعة: 08:30 - 14:00 (إيداع الملفات)",
    },
    processingTime: "خلال 21 إلى 45 يوماً من تاريخ استيفاء الملف",
    cost: "معلوم بلدي نسبي يُحتسب حسب المساحة المغطاة وصنف البناء",
    downloadableFormUrl: "https://www.commune-manouba.gov.tn",
    createdAt: "2026-10-15T09:30:00.000Z",
    updatedAt: "2026-10-20T10:00:00.000Z",
  },
  {
    id: "guide-05",
    title: "مطلب إيصال وربط جديد بشبكة الماء الصالح للشرب (SONEDE)",
    category: "الصوناد/الستاغ",
    keywords: ["ماء", "صوناد", "sonede", "عداد ماء", "ربط", "إيصال شبكة", "ماء صالح للشراب", "منوبة", "الدندان"],
    requiredDocuments: [
      "مطبوعة مطلب اشتراك معمرة ومصادق عليها تسحب من إقليم الصوناد بمنوبة.",
      "نسخة من بطاقة التعريف الوطنية لصاحب العقار أو الموكل عنه قانونياً.",
      "نسخة من رخصة البناء سارية المفعول أو شهادة تسوية مطابقة للتراتيب العمرانية من البلدية.",
      "شهادة ملكية العقار أو عقد شراء مسجل بالقباضة المالية.",
      "مثال موقعي للعقار يبين النهج وموقع العداد المقترح ومسار الشبكة العمومية.",
      "وصل خلاص آخر فاتورة لأقرب جار لتسهيل التعرف على نقطة التوزيع وشبكة الأنابيب.",
    ],
    steps: [
      "تقديم المطلب والوثائق الملحقة بمكتب الاستقبال بإقليم SONEDE منوبة وخلاص معلوم الدراسات الميدانية.",
      "تحول تقني الصوناد للموقع وإعداد المقايسة الفنية التقديرية لتكلفة الأشغال ومد القنوات.",
      "خلاص مبلغ المقايسة من قبل المشترك ثم برمجة التدخل الفني وتركيب العداد وفتح التزويد بالمياه.",
    ],
    location: "إقليم الشركة الوطنية لاستغلال وتوزيع المياه (SONEDE) بمنوبة (شارع الحبيب ثامر، قبالة محطة المترو)",
    departmentContact: {
      address: "شارع الحبيب ثامر، منوبة (محطة المترو)",
      phone: "71 601 540",
      workingHours: "من الإثنين إلى الجمعة: 08:00 - 15:30",
    },
    processingTime: "بين 7 و 15 يوماً بعد خلاص المقايسة الفنية",
    cost: "يُحدد حسب مسافة القنوات وسعة العداد وفق مقايسة فنية رسمية",
    downloadableFormUrl: "https://www.sonede.com.tn",
    createdAt: "2026-10-15T10:00:00.000Z",
    updatedAt: "2026-10-20T10:00:00.000Z",
  },
  {
    id: "guide-06",
    title: "مطلب التزود بالكهرباء والغاز الطبيعي (عداد منزلي STEG)",
    category: "الصوناد/الستاغ",
    keywords: ["كهرباء", "غاز", "ستاغ", "steg", "عداد كهرباء", "ضغط منخفض", "غاز طبيعي", "منوبة", "الدندان"],
    requiredDocuments: [
      "استمارة مطلب اشتراك وتزود بالكهرباء/الغاز تسحب من وكالة إقليم الستاغ.",
      "نسخة من بطاقة التعريف الوطنية للمنتفع صاحب الطلب.",
      "نسخة من رخصة البناء أو شهادة في الربط الوقتي مسلمة من بلدية منوبة أو بلدية الدندان.",
      "شهادة ملكية العقار أو عقد تسويغ مسجل قانونياً بالقباضة.",
      "مخطط موقعي يوضح المسلك الأقرب للشبكة الكهربائية وقواطع الحماية الداخلية.",
    ],
    steps: [
      "إيداع المطلب بالوكالة التجارية لإقليم STEG منوبة وتحديد موعد المعاينة الميدانية.",
      "تحول الفريق الفني لمعاينة التجهيزات والشبكة الداخلية ومطابقة مواصفات السلامة وإعداد المقايسة.",
      "إمضاء عقد الاشتراك وخلاص التسبيق وتدخل أعوان الستاغ لتركيب العداد وربط الخط.",
    ],
    location: "إقليم الشركة التونسية للكهرباء والغاز (STEG) بمنوبة (المركب الإداري، نهج الاستقلال)",
    departmentContact: {
      address: "المركب الإداري، نهج الاستقلال، منوبة",
      phone: "71 602 800",
      workingHours: "من الإثنين إلى الجمعة: 08:00 - 16:00",
    },
    processingTime: "بين 5 و 10 أيام عمل بعد خلاص المقايسة",
    cost: "حسب المقايسة الفنية وقدرة العداد المطلوب (Monophasé / Triphasé)",
    downloadableFormUrl: "https://www.steg.com.tn",
    createdAt: "2026-10-15T10:30:00.000Z",
    updatedAt: "2026-10-20T10:00:00.000Z",
  },
  {
    id: "guide-07",
    title: "مطلب الحصول على شهادة حوز وتصرف في عقار غير مسجل",
    category: "الإدارات الجهوية",
    keywords: ["حوز", "شهادة حوز", "تصرف", "عقار", "فلاحة", "معتمدية", "عمدة", "ملكية غير مسجلة", "منوبة"],
    requiredDocuments: [
      "مطلب كتابي باسم السيد معتمد منوبة يبين حدود ومساحة وموقع العقار ومصدر الحوز.",
      "نسخة من بطاقة التعريف الوطنية للطالب.",
      "عقود التصرف أو الوثائق العرفية المؤيدة للحوز إن وجدت (عقود بيع، فريضة شرعية، تنازلات).",
      "شهادة إبراء من الأداءات الجبائية والبلدية.",
      "مثال موقعي للعقار معد من قبل ديوان قيس الأراضي أو مهندس مساح مصادق عليه.",
    ],
    steps: [
      "إيداع المطلب بمعتمدية منوبة لتسجيله وتوجيهه إلى السيد العمدة مرجع النظر الترابي.",
      "إجراء البحث الميداني وسماع الجيران والشهود للتثبت من هدوء واستمرار الحوز دون منازع.",
      "تحرير محضر المعاينة وإحالة الملف لمصالح الولاية أو المعتمدية لإصدار الشهادة الرسمية.",
    ],
    location: "مقر معتمدية منوبة (شارع الجمهورية) / مكتب السيد عمدة المنطقة الترابية (سيدي عمر، منوبة، الدندان)",
    departmentContact: {
      address: "شارع الجمهورية، منوبة",
      phone: "71 600 102",
      workingHours: "من الإثنين إلى الجمعة: 08:30 - 15:30",
    },
    processingTime: "بين أسبوعين إلى 30 يوماً",
    cost: "معلوم تنقل ومعاينة وتأشير رمزي (طابع جبائي)",
    downloadableFormUrl: "https://www.interieur.gov.tn",
    createdAt: "2026-10-15T11:00:00.000Z",
    updatedAt: "2026-10-20T10:00:00.000Z",
  },
  {
    id: "guide-08",
    title: "استخراج أو تجديد بطاقة التعريف الوطنية",
    category: "الإدارات الجهوية",
    keywords: ["بطاقة تعريف", "هوية", "تجديد بطاقة", "أول مرة", "شرطة", "حرس", "منوبة", "الدندان"],
    requiredDocuments: [
      "مضمون ولادة أصلي لم تمضِ على استخراجه 3 أشهر مستخرج من البلدية.",
      "عدد 3 صور شمسية حديثة من الحجم المعتمد بخلفية بيضاء وغير لامعة.",
      "شهادة إقامة مسلمة من مركز الأمن الوطني مرجع النظر أو فاتورة صوناد/ستاغ حديثة باسم المعني.",
      "شهادة عمل أو ترسيم مدرسي/جامعي أو شهادة في عدم الشغل لإثبات المهنة المصرح بها.",
      "البطاقة القديمة في حالة التجديد، أو شهادة ضياع مسلمة من مركز الأمن في حالة الضياع.",
      "طابع جبائي بقيمة 3 دنانير (أو 25 ديناراً في صورة الضياع أو الإتلاف).",
    ],
    steps: [
      "تجميع الوثائق المطلوبة والتوجه إلى مركز الأمن الوطني أو الحرس الوطني مرجع النظر.",
      "أخذ البصمات وتعمير بطاقة الإرشادات والتحقق من الوثائق الرسمية.",
      "استلام وصل إيداع ثم تسلم بطاقة التعريف الوطنية بعد إشعار الجاهزية.",
    ],
    location: "مركز الأمن الوطني بمنوبة / مركز الأمن الوطني بالدندان (بحسب عنوان الإقامة)",
    departmentContact: {
      address: "منوبة المركز / الدندان الشمالي",
      phone: "71 601 222",
      workingHours: "من الإثنين إلى السبت: 08:00 - 14:00",
    },
    processingTime: "بين 7 و 15 يوماً",
    cost: "3 دنانير (عادي) / 25 ديناراً (عند الضياع)",
    downloadableFormUrl: "https://www.interieur.gov.tn",
    createdAt: "2026-10-15T11:30:00.000Z",
    updatedAt: "2026-10-20T10:00:00.000Z",
  },
];

export const INITIAL_YOUTH_PROGRAMS: YouthProgram[] = [
  {
    id: "YTH-PRG-01",
    title: "برنامج التمويل الصغير وبعث المشاريع لحاملي الشهادات والحرفيين (BTS منوبة)",
    category: "تمويل وقروض صغرى",
    institution: "البنك التونسي للتضامن (BTS) - فرع ولاية منوبة",
    targetAudience: "حاملو الشهادات الجامعية، أصحاب المؤهلات المهنية والحرفيون",
    fundingCap: "سقف التمويل يصل إلى 150 ألف دينار للشهائد العليا و 50 ألف دينار للمهن والحرف",
    eligibilityCriteria: [
      "أن يكون المترشح حاملاً لشهادة جامعية أو مؤهل تقني مهني معترف به أو شهادة إثبات كفاءة حرفية.",
      "ألا يتجاوز سن الباعث 45 سنة عند إيداع المطلب بفرع منوبة.",
      "توفر فكرة مشروع ذات جدوى اقتصادية وقابلة للتنفيذ الميداني بدائرة منوبة والدندان.",
      "ألا يكون مديناً أو محل تتبعات بنكية غير مسواة لدى الصناديق الاجتماعية أو البنوك التجارية.",
      "نسبة تمويل ذاتي تفاضلية ميسرة لا تتجاوز 2% إلى 5% مع فترة إمهال تصل إلى سنتين.",
    ],
    requiredDocuments: [
      "نسخة مطابقة للأصل من الشهادة العلمية أو شهادة المؤهل التقني / الكفاءة المهنية.",
      "دراسة جدوى ومخطط أعمال أولي (Business Plan) مع مقايسة تقديرية للمشروع.",
      "شهادة إقامة تثبت السكنى بولاية منوبة مع بطاقة التعريف الوطنية.",
      "عقد تسويغ أولي أو شهادة ملكية لمحل انتصاب المشروع بدائرة منوبة أو الدندان.",
      "فواتير تقديرية (Factures proforma) للمعدات والتجهيزات من مزودين مرخصين.",
      "تصريح على الشرف بعدم ممارسة أي عمل مأجور في القطاعين العام أو الخاص.",
    ],
    address: "شارع الهادي شاكر، قبالة مقر القباضة المالية، منوبة",
    contactPhone: "71 602 450",
    officialUrl: "https://www.bts.com.tn",
    description: "قروض صغرى ميسرة وممولة بنسب فائدة تفاضلية وبدون فوائض مجحفة لتمكين خريجي التعليم العالي والتكوين المهني من بعث مشاريع خاصة في الخدمات، الصناعات الغذائية، والتكنولوجيات الحديثة.",
    createdAt: "2026-10-15T08:00:00.000Z",
  },
  {
    id: "YTH-PRG-02",
    title: "برامج مكتب التشغيل والعمل المستقل بمنوبة (ANETI - CIVP / عقد الكرامة / CEFE)",
    category: "برامج التشغيل ANETI",
    institution: "مكتب التشغيل والعمل المستقل بمنوبة (ANETI)",
    targetAudience: "طالبو الشغل لأول مرة، خريجو الجامعات، وحاملو أفكار المشاريع الخاصة",
    fundingCap: "منحة تربص شهرية (بين 150د و 400د) + تكفل الدولة بمساهمة الضمان الاجتماعي (CNSS)",
    eligibilityCriteria: [
      "التسجيل كطالب شغل نشيط ومحيّن بمنظومة مكتب التشغيل والعمل المستقل بمنوبة.",
      "الحصول على شهادة تعليم عالي أو شهادة مؤهل تقني سامي (BTS) أو تقني مهني (BTP).",
      "الانتفاع بعقد الإعداد للحياة المهنية (CIVP) لمدة سنة قابلة للتجديد أو عقد الكرامة للمدى الطويل.",
      "متابعة دورات التكوين التكميلي والمرافقة عبر منهجية CEFE ودورات MORAJA3A لإعداد مخططات الأعمال.",
    ],
    requiredDocuments: [
      "نسخة من بطاقة التعريف الوطنية مع بطاقة طالب شغل مسلمة من مكتب منوبة.",
      "نسخة مطابقة للأصل من الشهادة العلمية وكشف الأعداد لسنة التخرج.",
      "كشف هوية بنكية أو بريدية (RIB) باسم المنتفع لتنزيل المنحة الشهرية بانتظام.",
      "عقد التربص الثلاثي معمر وممضى ومختوم من المؤسسة المشغلة ومكتب التشغيل.",
    ],
    address: "نهج الاستقلال، المركب الإداري، منوبة",
    contactPhone: "71 600 780",
    officialUrl: "https://www.aneti.tn",
    description: "حزمة برامج متكاملة للإدماج المهني المباشر لحاملي الشهائد العليا، مع ورشات تشخيص وتكوين في بعث المؤسسات الصغرى ومساعدتهم على الانتقال من فكرة إلى مشروع ناجح.",
    createdAt: "2026-10-15T08:30:00.000Z",
  },
  {
    id: "YTH-PRG-03",
    title: "مركز الأعمال بمنوبة ووكالة النهوض بالصناعة والتجديد (APII)",
    category: "تكوين ومرافقة",
    institution: "مركز أعمال منوبة (Centre d'Affaires) ووكالة APII",
    targetAudience: "باعثو المشاريع المجددة، رواد الأعمال الشبان، وخريجو الجامعات والمدارس الهندسية",
    fundingCap: "مرافقة وإحاطة فنية مجانية 100% + إمكانية الاحتضان بمحاضن المؤسسات بالقطب التكنولوجي",
    eligibilityCriteria: [
      "توفر فكرة مشروع مجدد في مجالات الصناعة، الخدمات اللوجستية، الطاقات المتجددة أو الرقمنة.",
      "الاستعداد للالتزام بدورة الإحاطة التوجيهية وتطوير نموذج العمل التجاري (Business Model Canvas).",
      "أولوية للابتكارات ذات الأثر البيئي والاقتصادي المحلي في ولاية منوبة.",
    ],
    requiredDocuments: [
      "بطاقة وصفية لمشروع التجديد أو النشاط الاستثماري المرتقب (Fiche Projet).",
      "السيرة الذاتية المفصلة للشهائد والخبرات المهنية لصاحب الفكرة.",
      "نسخة من بطاقة التعريف الوطنية.",
    ],
    address: "القطب التكنولوجي بمنوبة (Technopark El Ghazala - Manouba)، المركب الجامعي بمنوبة",
    contactPhone: "71 601 890",
    officialUrl: "https://www.tunisieindustrie.nat.tn",
    description: "فضاء متخصص للإحاطة والتوجيه وإعداد دراسات الجدوى الفنية والمالية، وتسهيل الربط مع صناديق الاستثمار والمستثمرين لتمكين أصحاب الأفكار من إطلاق شركاتهم الناشئة.",
    createdAt: "2026-10-15T09:00:00.000Z",
  },
  {
    id: "YTH-PRG-04",
    title: "الشركات الأهلية والمبادرات الجماعية التنموية بولاية منوبة",
    category: "شركات أهلية",
    institution: "خلية الإحاطة بالشركات الأهلية بولاية منوبة ووزارة التشغيل",
    targetAudience: "أهالي وعمادات معتمدية منوبة - الدندان الراغبين في تأسيس شركات أهلية محلية",
    fundingCap: "تمويل بنكي ميسر يصل إلى 300 ألف دينار مع تدخل صندوق تمويل الشركات الأهلية",
    eligibilityCriteria: [
      "أن تضم الشركة الأهلية المحلية ما لا يقل عن 50 شريكاً من المواطنين المسجلين بالدائرة الانتخابية.",
      "أن يستهدف المشروع استغلال مقدرات الجهة الفلاحية، الخدماتية، البيئية أو الحرفية المعطلة.",
      "تطبيق قاعدة العدالة التشاركية: 'شخص واحد = صوت واحد' بالجلسات العامة بصرف النظر عن المساهمة المالية.",
      "موافقة اللجنة الجهوية للتنسيق ومتابعة الشركات الأهلية بولاية منوبة.",
    ],
    requiredDocuments: [
      "مشروع القانون الأساسي للشركة الأهلية مطابق للمرسوم الرئاسي عدد 15 لسنة 2022.",
      "محضر الجلسة العامة التأسيسية وقائمة المكتتبين مع إثبات السكنى بالجهة.",
      "شهادة إيداع القسط الأول من رأس المال لدى أحد البنوك العمومية (BNA / BTS / BH).",
      "دراسة الجدوى الميدانية للأثر التنموي وتشغيل شباب وأهالي المنطقة.",
    ],
    address: "مقر ولاية منوبة (شارع الجمهورية) - خلية متابعة الشركات الأهلية",
    contactPhone: "71 600 102",
    officialUrl: "https://www.emploi.gov.tn",
    description: "إطار تنموي جماعي واعد يمنح شباب أهالي منوبة والدندان حق تأسيس مشاريع كبرى في استغلال الأراضي الدولية، تدوير وتثمين الفضلات، وإقامة أسواق إنتاج ومحطات طاقة نظيفة.",
    createdAt: "2026-10-15T09:30:00.000Z",
  },
];

export const INITIAL_YOUTH_REQUESTS: YouthRequest[] = [
  {
    id: "YTH-1021",
    fullName: "أمين بوعزيز",
    phone: "23456789",
    zone: "منوبة المدينة",
    projectType: "تطوير برمجيات وخدمات رقمية",
    targetInstitution: "البنك التونسي للتضامن (BTS)",
    issueDescription: "إيداع ملف تمويل لاقتناء تجهيزات إعلامية وخوادم منذ 4 أشهر بفرع BTS منوبة، مع وجود تعطيل إداري في صرف الشطر الأول من القرض رغم استيفاء دراسة الجدوى وموافقة اللجنة.",
    status: "بصدد المتابعة مع الإدارة/البنك",
    createdAt: "2026-10-18T11:20:00.000Z",
    notes: "تمت مراسلة الإدارة الجهوية للبنك التونسي للتضامن لتسريع البت في الملف بعد استيفاء جميع الضمانات.",
  },
  {
    id: "YTH-1022",
    fullName: "سيرين المحواشي",
    phone: "55678912",
    zone: "الدندان الشمالي",
    projectType: "حرفة صناعة الخزف التقليدي والزخرفة",
    targetInstitution: "بلدية الدندان والديوان الوطني للصناعات التقليدية",
    issueDescription: "طلب الحصول على ترخيص وقتي لاستغلال فضاء حرفي بالدندان لتمكين باعثة شابة من عرض المنتوجات وتشغيل فتيات من المنطقة ومتابعة الإجراءات الإدارية.",
    status: "جديد",
    createdAt: "2026-10-19T15:40:00.000Z",
    notes: "الملف قيد التدقيق وسيتم التنسيق مع المصالح الفنية لبلدية الدندان لبرمجة جلسة استماع.",
  },
  {
    id: "YTH-1023",
    fullName: "كريم الوسلاتي",
    phone: "98112233",
    zone: "سيدي عمر",
    projectType: "شركة أهلية للرسكلة وتثمين الفضلات الخضراء",
    targetInstitution: "ولاية منوبة ومكتب التشغيل",
    issueDescription: "استكمال الإجراءات التأسيسية للشركة الأهلية بسيدي عمر وطلب مساندة برلمانية لتسهيل تخصيص قطعة أرض فلاحية غير مستغلة وتأمين التمويل البنكي الأولي.",
    status: "تمت التسوية",
    createdAt: "2026-10-14T09:15:00.000Z",
    notes: "تم عقد جلسة عمل مع السيد والي منوبة والمدير الجهوي لأملاك الدولة وتسهيل تخصيص العقار وإدراجه بالتمويل.",
  },
];

let memoryDbCache: DatabaseSchema | null = null;

export function initDb(): DatabaseSchema {
  if (memoryDbCache) return memoryDbCache;

  try {
    if (!fs.existsSync(DATA_DIR)) {
      try {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      } catch {
        // read-only filesystem on Vercel
      }
    }

    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, "utf-8");
      const parsed = JSON.parse(raw) as DatabaseSchema;
      if (!parsed.complaints) parsed.complaints = [];
      if (!parsed.projects) parsed.projects = INITIAL_PROJECTS;
      if (!parsed.appointments) parsed.appointments = INITIAL_APPOINTMENTS;
      if (!parsed.appointmentSettings) parsed.appointmentSettings = DEFAULT_APPOINTMENT_SETTINGS;
      if (!parsed.polls) parsed.polls = INITIAL_POLLS;
      if (!parsed.customAlerts) parsed.customAlerts = INITIAL_CUSTOM_ALERTS;
      if (!parsed.ingestedNews) parsed.ingestedNews = INITIAL_INGESTED_NEWS;
      if (!parsed.liveStream) parsed.liveStream = DEFAULT_LIVE_STREAM;
      if (!parsed.liveChatMessages) parsed.liveChatMessages = INITIAL_LIVE_CHAT_MESSAGES;
      if (!parsed.guides) parsed.guides = INITIAL_GUIDES;
      if (!parsed.youthPrograms) parsed.youthPrograms = INITIAL_YOUTH_PROGRAMS;
      if (!parsed.youthRequests) parsed.youthRequests = INITIAL_YOUTH_REQUESTS;
      memoryDbCache = parsed;
      return memoryDbCache;
    }
  } catch (fsErr) {
    // Graceful fallback in serverless read-only environments
  }

  memoryDbCache = {
    complaints: [],
    projects: INITIAL_PROJECTS,
    appointments: INITIAL_APPOINTMENTS,
    appointmentSettings: DEFAULT_APPOINTMENT_SETTINGS,
    polls: INITIAL_POLLS,
    customAlerts: INITIAL_CUSTOM_ALERTS,
    ingestedNews: INITIAL_INGESTED_NEWS,
    liveStream: DEFAULT_LIVE_STREAM,
    liveChatMessages: INITIAL_LIVE_CHAT_MESSAGES,
    guides: INITIAL_GUIDES,
    youthPrograms: INITIAL_YOUTH_PROGRAMS,
    youthRequests: INITIAL_YOUTH_REQUESTS,
    lastIngestionTime: new Date().toISOString(),
  };

  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(memoryDbCache, null, 2), "utf-8");
  } catch {
    // ignore EROFS in serverless environments
  }

  return memoryDbCache;
}

export function getDb(): DatabaseSchema {
  return initDb();
}

export function saveDb(data: DatabaseSchema): void {
  memoryDbCache = data;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch {
    // Gracefully ignore filesystem write errors on Vercel EROFS!
  }

  // Asynchronously persist all collections directly to Supabase platform_store
  if (data.projects) setStoreItem("projects", data.projects).catch(() => {});
  if (data.appointments) setStoreItem("appointments", data.appointments).catch(() => {});
  if (data.appointmentSettings) setStoreItem("appointmentSettings", data.appointmentSettings).catch(() => {});
  if (data.polls) setStoreItem("polls", data.polls).catch(() => {});
  if (data.customAlerts) setStoreItem("customAlerts", data.customAlerts).catch(() => {});
  if (data.ingestedNews) setStoreItem("ingestedNews", data.ingestedNews).catch(() => {});
  if (data.guides) setStoreItem("guides", data.guides).catch(() => {});
  if (data.youthPrograms) setStoreItem("youthPrograms", data.youthPrograms).catch(() => {});
  if (data.youthRequests) setStoreItem("youthRequests", data.youthRequests).catch(() => {});
  if (data.liveStream) setStoreItem("liveStream", data.liveStream).catch(() => {});
  if (data.liveChatMessages) setStoreItem("liveChatMessages", data.liveChatMessages).catch(() => {});
}

export function getAllComplaints(): Complaint[] {
  const db = getDb();
  return db.complaints.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getComplaintById(id: string): Complaint | undefined {
  const db = getDb();
  const searchId = id.trim().toUpperCase();
  const searchWithPrefix = searchId.startsWith("TN-") ? searchId : `TN-${searchId}`;
  return db.complaints.find(
    (c) => c.id.toUpperCase() === searchId || c.id.toUpperCase() === searchWithPrefix
  );
}

export function getComplaintsByPhone(phone: string): Complaint[] {
  const db = getDb();
  const cleanPhone = phone.replace(/\D/g, "");
  return db.complaints.filter((c) => c.phone.replace(/\D/g, "").includes(cleanPhone));
}

function generateUniqueId(existingComplaints: Complaint[]): string {
  const existingIds = new Set(existingComplaints.map((c) => c.id));
  let attempts = 0;
  while (attempts < 1000) {
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const candidate = `TN-${randomDigits}`;
    if (!existingIds.has(candidate)) {
      return candidate;
    }
    attempts++;
  }
  return `TN-${Date.now().toString().slice(-4)}`;
}

export function createComplaint(input: ComplaintInput): Complaint {
  const db = getDb();
  const newId = generateUniqueId(db.complaints);

  const newComplaint: Complaint = {
    id: newId,
    createdAt: new Date().toISOString(),
    citizenName: input.citizenName.trim(),
    phone: input.phone.trim(),
    zone: input.zone.trim(),
    category: input.category,
    type: input.type || (input.audioBase64 ? "voice" : "petition"),
    description: input.description.trim(),
    audioBase64: input.audioBase64 || undefined,
    imageBase64: input.imageBase64 || undefined,
    gpsLocation: input.gpsLocation || null,
    status: "جديد",
    priority: input.priority || "عادي",
    publicNote: "تم استلام مطلبكم بنجاح وهو الآن بصدد الفرز والتدقيق لدى الفريق البرلماني لدائرة منوبة - الدندان.",
  };

  db.complaints.unshift(newComplaint);
  saveDb(db);
  return newComplaint;
}

export function updateComplaint(
  id: string, 
  updates: Partial<Complaint>
): Complaint | null {
  const db = getDb();
  const index = db.complaints.findIndex((c) => c.id.toUpperCase() === id.trim().toUpperCase());
  if (index === -1) return null;

  db.complaints[index] = {
    ...db.complaints[index],
    ...updates,
  };
  saveDb(db);
  return db.complaints[index];
}

export function deleteComplaint(id: string): boolean {
  const db = getDb();
  const searchId = id.trim().toUpperCase();
  const searchWithPrefix = searchId.startsWith("TN-") ? searchId : `TN-${searchId}`;
  const initialLength = db.complaints.length;
  db.complaints = db.complaints.filter(
    (c) => c.id.toUpperCase() !== searchId && c.id.toUpperCase() !== searchWithPrefix
  );
  if (db.complaints.length !== initialLength) {
    saveDb(db);
    return true;
  }
  return false;
}

// Projects
export function getProjects(): ProjectItem[] {
  const db = getDb();
  if (Array.isArray(db.projects)) {
    return db.projects;
  }
  return INITIAL_PROJECTS;
}

export function addProject(project: ProjectItem): ProjectItem {
  const db = getDb();
  if (!Array.isArray(db.projects)) {
    db.projects = [...INITIAL_PROJECTS];
  }
  db.projects.unshift(project);
  saveDb(db);
  return project;
}

export function deleteProject(id: string): boolean {
  const db = getDb();
  if (!Array.isArray(db.projects)) {
    db.projects = [...INITIAL_PROJECTS];
  }
  const targetId = id.trim().toUpperCase();
  const initialLen = db.projects.length;
  db.projects = db.projects.filter((p) => p.id.trim().toUpperCase() !== targetId);
  if (db.projects.length < initialLen) {
    saveDb(db);
    return true;
  }
  return false;
}

// Appointments
export function getAppointments(): Appointment[] {
  const db = getDb();
  return db.appointments || INITIAL_APPOINTMENTS;
}

export function createAppointment(input: {
  citizenName: string;
  phone: string;
  zone: string;
  date: string;
  timeSlot: string;
  topic: string;
}): Appointment {
  const db = getDb();
  const newId = `RDV-${Math.floor(1000 + Math.random() * 9000)}`;

  const newAppointment: Appointment = {
    id: newId,
    createdAt: new Date().toISOString(),
    citizenName: input.citizenName.trim(),
    phone: input.phone.trim(),
    zone: input.zone.trim(),
    date: input.date,
    timeSlot: input.timeSlot,
    topic: input.topic.trim(),
    status: "مؤكد",
    notes: "المكتب البرلماني للنائب أسماء درويش - شارع الحبيب بورقيبة، منوبة (فوق البنك التونسي)",
  };

  if (!db.appointments) db.appointments = [];
  db.appointments.unshift(newAppointment);
  saveDb(db);
  return newAppointment;
}

export function updateAppointmentStatus(id: string, status: Appointment["status"]): Appointment | null {
  const db = getDb();
  if (!db.appointments) return null;
  const apt = db.appointments.find((a) => a.id === id);
  if (!apt) return null;
  apt.status = status;
  saveDb(db);
  return apt;
}

export function deleteAppointment(id: string): boolean {
  const db = getDb();
  if (!db.appointments) return false;
  const initialLength = db.appointments.length;
  const searchId = id.trim().toUpperCase();
  db.appointments = db.appointments.filter(
    (a) => a.id.toUpperCase() !== searchId
  );
  if (db.appointments.length !== initialLength) {
    saveDb(db);
    return true;
  }
  return false;
}

// ==========================================
// Administrative Guides (الدليل الإداري السريع)
// ==========================================
export function getGuides(): GuideItem[] {
  const db = getDb();
  if (!db.guides || !Array.isArray(db.guides) || db.guides.length === 0) {
    db.guides = INITIAL_GUIDES;
    saveDb(db);
  }
  return db.guides;
}

export function getGuideById(id: string): GuideItem | undefined {
  const guides = getGuides();
  const searchId = id.trim().toLowerCase();
  return guides.find((g) => g.id.toLowerCase() === searchId);
}

export function addGuide(guideData: Omit<GuideItem, "id"> & { id?: string }): GuideItem {
  const db = getDb();
  if (!db.guides || !Array.isArray(db.guides)) {
    db.guides = [...INITIAL_GUIDES];
  }
  const id = guideData.id || `GD-${Date.now().toString().slice(-4)}`;
  const now = new Date().toISOString();
  const newGuide: GuideItem = {
    ...guideData,
    id,
    createdAt: guideData.createdAt || now,
    updatedAt: now,
  };
  db.guides.unshift(newGuide);
  saveDb(db);
  return newGuide;
}

export function updateGuide(id: string, updates: Partial<GuideItem>): GuideItem | null {
  const db = getDb();
  if (!db.guides) return null;
  const index = db.guides.findIndex((g) => g.id.toLowerCase() === id.trim().toLowerCase());
  if (index === -1) return null;

  db.guides[index] = {
    ...db.guides[index],
    ...updates,
    id: db.guides[index].id,
    updatedAt: new Date().toISOString(),
  };

  saveDb(db);
  return db.guides[index];
}

export function deleteGuide(id: string): boolean {
  const db = getDb();
  if (!db.guides) return false;
  const initialLength = db.guides.length;
  const searchId = id.trim().toLowerCase();
  db.guides = db.guides.filter((g) => g.id.toLowerCase() !== searchId);
  if (db.guides.length !== initialLength) {
    saveDb(db);
    return true;
  }
  return false;
}


// Appointment Availability Settings
export function getAppointmentSettings(): AppointmentSettings {
  const db = getDb();
  if (
    db.appointmentSettings &&
    Array.isArray(db.appointmentSettings.days) &&
    db.appointmentSettings.days.length > 0 &&
    Array.isArray(db.appointmentSettings.timeSlots) &&
    db.appointmentSettings.timeSlots.length > 0
  ) {
    return db.appointmentSettings;
  }
  return DEFAULT_APPOINTMENT_SETTINGS;
}

export function updateAppointmentSettings(settings: Partial<AppointmentSettings>): AppointmentSettings {
  const db = getDb();
  const current = getAppointmentSettings();
  db.appointmentSettings = {
    days: Array.isArray(settings.days) && settings.days.length > 0 ? settings.days : current.days,
    timeSlots: Array.isArray(settings.timeSlots) && settings.timeSlots.length > 0 ? settings.timeSlots : current.timeSlots,
    note: settings.note !== undefined ? settings.note : current.note,
  };
  saveDb(db);
  return db.appointmentSettings;
}

// Polls
export function getPolls(): PollItem[] {
  const db = getDb();
  return db.polls || INITIAL_POLLS;
}

export function voteInPoll(pollId: string, optionId: string): PollItem | null {
  const db = getDb();
  if (!db.polls) db.polls = INITIAL_POLLS;
  const poll = db.polls.find((p) => p.id === pollId);
  if (!poll) return null;

  const opt = poll.options.find((o) => o.id === optionId);
  if (opt) {
    opt.votes += 1;
    poll.totalVotes += 1;
    saveDb(db);
    return poll;
  }
  return null;
}

export function addPoll(poll: Omit<PollItem, "id" | "totalVotes">): PollItem {
  const db = getDb();
  if (!db.polls) db.polls = [];
  const newPoll: PollItem = {
    ...poll,
    id: `POLL-${Date.now().toString().slice(-4)}`,
    totalVotes: 0,
  };
  db.polls.unshift(newPoll);
  saveDb(db);
  return newPoll;
}

export function deletePoll(id: string): boolean {
  const db = getDb();
  if (!db.polls) return false;
  const initialLength = db.polls.length;
  const searchId = id.trim();
  db.polls = db.polls.filter((p) => p.id !== searchId);
  if (db.polls.length !== initialLength) {
    saveDb(db);
    return true;
  }
  return false;
}

// Custom Alerts
export function getCustomAlerts(): NewsItem[] {
  const db = getDb();
  return db.customAlerts || INITIAL_CUSTOM_ALERTS;
}

export function addCustomAlert(alert: { title: string; category?: string; isUrgent?: boolean }): NewsItem {
  const db = getDb();
  if (!db.customAlerts) db.customAlerts = [];
  const nowIso = new Date().toISOString();
  const newAlert: NewsItem = {
    id: `alt-mp-${Date.now().toString().slice(-4)}`,
    title: alert.title.trim(),
    source: "المكتب البرلماني للنائب أسماء درويش",
    pubDate: "الآن",
    publishedAt: nowIso,
    isUrgent: alert.isUrgent ?? true,
    isCustom: true,
    category: alert.category || "عاجل",
  };
  db.customAlerts.unshift(newAlert);
  saveDb(db);
  return newAlert;
}

export function deleteCustomAlert(id: string): boolean {
  const db = getDb();
  if (!db.customAlerts) return false;
  const initialLength = db.customAlerts.length;
  const searchId = id.trim();
  db.customAlerts = db.customAlerts.filter((a) => a.id !== searchId);
  if (db.customAlerts.length !== initialLength) {
    saveDb(db);
    return true;
  }
  return false;
}

// Ingested & Aggregated News
export function getIngestedNews(): NewsItem[] {
  const db = getDb();
  const list = db.ingestedNews || INITIAL_INGESTED_NEWS;
  const filtered = list.filter(isStrictlyRelevantNews);

  // Auto-clean database if stale items exist
  if (db.ingestedNews && db.ingestedNews.length !== filtered.length) {
    db.ingestedNews = filtered;
    saveDb(db);
  }

  return filtered;
}

export function saveIngestedNews(news: NewsItem[]): void {
  const db = getDb();
  db.ingestedNews = news.filter(isStrictlyRelevantNews);
  db.lastIngestionTime = new Date().toISOString();
  saveDb(db);
}

export function getLastIngestionTime(): string | undefined {
  const db = getDb();
  return db.lastIngestionTime;
}

export function togglePinNewsItem(id: string): NewsItem | null {
  const db = getDb();
  const searchId = id.trim();

  // Check in customAlerts
  if (db.customAlerts) {
    const item = db.customAlerts.find((a) => a.id === searchId);
    if (item) {
      item.isPinned = !item.isPinned;
      saveDb(db);
      return item;
    }
  }

  // Check in ingestedNews
  if (!db.ingestedNews) db.ingestedNews = [...INITIAL_INGESTED_NEWS];
  const item = db.ingestedNews.find((a) => a.id === searchId);
  if (item) {
    item.isPinned = !item.isPinned;
    saveDb(db);
    return item;
  }

  return null;
}

export function deleteNewsItem(id: string): boolean {
  const db = getDb();
  const searchId = id.trim();
  let deleted = false;

  if (db.customAlerts) {
    const len = db.customAlerts.length;
    db.customAlerts = db.customAlerts.filter((a) => a.id !== searchId);
    if (db.customAlerts.length < len) deleted = true;
  }

  if (db.ingestedNews) {
    const len = db.ingestedNews.length;
    db.ingestedNews = db.ingestedNews.filter((a) => a.id !== searchId);
    if (db.ingestedNews.length < len) deleted = true;
  }

  if (deleted) {
    saveDb(db);
  }
  return deleted;
}

export function getAllDisplayNews(): NewsItem[] {
  const db = getDb();
  const alerts = (db.customAlerts || []).filter(isStrictlyRelevantNews);
  const rawIngested = db.ingestedNews || INITIAL_INGESTED_NEWS;
  const freshIngested = rawIngested.filter(isStrictlyRelevantNews);

  // Auto-clean database if stale items exist
  let shouldSave = false;
  if (db.ingestedNews && db.ingestedNews.length !== freshIngested.length) {
    db.ingestedNews = freshIngested;
    shouldSave = true;
  }
  if (db.customAlerts && db.customAlerts.length !== alerts.length) {
    db.customAlerts = alerts;
    shouldSave = true;
  }
  if (shouldSave) {
    saveDb(db);
  }

  // Combine alerts and fresh ingested
  const combined = [...alerts, ...freshIngested];

  // Sort: pinned first, then urgent, then by date descending
  return combined.sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    if (a.isUrgent && !b.isUrgent) return -1;
    if (!a.isUrgent && b.isUrgent) return 1;
    return 0;
  });
}

// ==========================================
// Live Town Hall & Interactive Chat System
// ==========================================

export function getLiveStreamConfig(): LiveStreamConfig {
  const db = getDb();
  if (!db.liveStream) {
    db.liveStream = DEFAULT_LIVE_STREAM;
    saveDb(db);
  }
  // Ensure boolean isLive is always defined and synchronized
  if (db.liveStream.isLive === undefined) {
    db.liveStream.isLive = db.liveStream.status === "live";
  }
  if (!db.liveStream.streamUrl && db.liveStream.videoUrl) {
    db.liveStream.streamUrl = db.liveStream.videoUrl;
  }
  if (!db.liveStream.liveTitle && db.liveStream.title) {
    db.liveStream.liveTitle = db.liveStream.title;
  }
  return db.liveStream;
}

export function updateLiveStreamConfig(updates: Partial<LiveStreamConfig>): LiveStreamConfig {
  const db = getDb();
  if (!db.liveStream) db.liveStream = DEFAULT_LIVE_STREAM;

  let isLive = updates.isLive;
  let status = updates.status;

  if (isLive !== undefined && status === undefined) {
    status = isLive ? "live" : "ended";
  } else if (status !== undefined && isLive === undefined) {
    isLive = status === "live";
  }

  const streamUrl = updates.streamUrl || updates.videoUrl || db.liveStream.streamUrl || db.liveStream.videoUrl;
  const liveTitle = updates.liveTitle || updates.title || db.liveStream.liveTitle || db.liveStream.title;

  db.liveStream = {
    ...db.liveStream,
    ...updates,
    ...(isLive !== undefined && { isLive }),
    ...(status !== undefined && { status }),
    ...(streamUrl && { videoUrl: streamUrl, streamUrl }),
    ...(liveTitle && { title: liveTitle, liveTitle }),
    ...(isLive ? { viewersCount: updates.viewersCount ?? (db.liveStream.viewersCount || 0), startedAt: db.liveStream.startedAt || new Date().toISOString() } : { viewersCount: 0 }),
    updatedAt: new Date().toISOString(),
  };
  saveDb(db);
  return db.liveStream;
}

export function getLiveChatMessages(): LiveChatMessage[] {
  const db = getDb();
  if (!db.liveChatMessages) {
    db.liveChatMessages = INITIAL_LIVE_CHAT_MESSAGES;
    saveDb(db);
  }
  return db.liveChatMessages;
}

export function addLiveChatMessage(input: {
  citizenName: string;
  zone: string;
  phone?: string;
  message: string;
}): LiveChatMessage {
  const db = getDb();
  if (!db.liveChatMessages) db.liveChatMessages = [];

  const newMsg: LiveChatMessage = {
    id: `chat-${Date.now().toString().slice(-4)}`,
    citizenName: input.citizenName.trim(),
    zone: input.zone.trim(),
    phone: input.phone ? input.phone.trim() : undefined,
    message: input.message.trim(),
    createdAt: new Date().toISOString(),
    status: "pending",
  };

  db.liveChatMessages.unshift(newMsg);
  saveDb(db);
  return newMsg;
}

export function togglePinLiveChatMessage(messageId: string): LiveChatMessage | null {
  const db = getDb();
  if (!db.liveChatMessages) return null;
  const msg = db.liveChatMessages.find((m) => m.id === messageId.trim());
  if (msg) {
    msg.isPinned = !msg.isPinned;
    saveDb(db);
    return msg;
  }
  return null;
}

export function deleteLiveChatMessage(messageId: string): boolean {
  const db = getDb();
  if (!db.liveChatMessages) return false;
  const initialLen = db.liveChatMessages.length;
  db.liveChatMessages = db.liveChatMessages.filter((m) => m.id !== messageId.trim());
  if (db.liveChatMessages.length !== initialLen) {
    saveDb(db);
    return true;
  }
  return false;
}

/**
 * Smart Chat-to-Petition Bridge:
 * Converts a live chat question into an official citizen request (Complaint)
 * with status "جديد", links it, and saves it.
 */
export function convertChatToComplaint(messageId: string): {
  success: boolean;
  complaint?: Complaint;
  message?: LiveChatMessage;
  error?: string;
} {
  const db = getDb();
  if (!db.liveChatMessages) return { success: false, error: "لا توجد رسائل دردشة." };

  const msgIndex = db.liveChatMessages.findIndex((m) => m.id === messageId.trim());
  if (msgIndex === -1) {
    return { success: false, error: "رسالة الدردشة غير موجودة." };
  }
  const msg = db.liveChatMessages[msgIndex];

  if (msg.isConvertedToComplaint && msg.complaintId) {
    return {
      success: false,
      error: `تم تحويل هذا السؤال مسبقاً إلى العريضة رقم (${msg.complaintId}).`,
      message: msg,
    };
  }

  // Detect likely category based on message keywords
  const text = msg.message.toLowerCase();
  let category: ComplaintCategory = "أخرى";
  if (/ماء|صوناد|مياه|عطش|sonede/i.test(text)) {
    category = "الماء والصوناد";
  } else if (/صحة|دواء|مستوصف|مستشفى|طبيب|أدوية/i.test(text)) {
    category = "الصحة";
  } else if (/طريق|تعبيد|إنارة|رصيف|حفرة|تجهيز|قنطرة|وادي قريانة|نهج/i.test(text)) {
    category = "الطرقات والتجهيز";
  } else if (/نقل|حافلة|مترو|كار|محطة|transtu/i.test(text)) {
    category = "النقل";
  } else if (/بيئة|نظافة|تطهير|مصب|فضلات|واد|تلوث/i.test(text)) {
    category = "البيئة والنظافة";
  } else if (/كهرباء|ستاغ|ضوء|steg/i.test(text)) {
    category = "الكهرباء والستاغ";
  } else if (/مساعدة|منحة|إعانة|اجتماعي|معوز/i.test(text)) {
    category = "الشؤون الاجتماعية";
  }

  // Atomically create and insert complaint into db.complaints
  const newId = generateUniqueId(db.complaints);
  const newComplaint: Complaint = {
    id: newId,
    createdAt: new Date().toISOString(),
    citizenName: msg.citizenName.trim(),
    phone: (msg.phone || "21000000").trim(),
    zone: msg.zone.trim(),
    category,
    type: "petition",
    description: `[مطلب مباشر محال من جلسة البث المباشر والحوار المفتوح مع النائب أسماء درويش]: ${msg.message}`,
    status: "جديد",
    priority: "متوسط",
    publicNote: "تم استلام مطلبكم عبر جلسة الحوار المباشر وهو الآن قيد التدقيق والمتابعة من طرف النائب أسماء درويش.",
  };

  db.complaints.unshift(newComplaint);

  // Mark message as converted
  msg.status = "converted";
  msg.isConvertedToComplaint = true;
  msg.complaintId = newComplaint.id;
  db.liveChatMessages[msgIndex] = msg;

  saveDb(db);

  return {
    success: true,
    complaint: newComplaint,
    message: msg,
  };
}

// ==========================================
// Youth & Local Entrepreneurship Hub (فضاء الشباب والمبادرة)
// ==========================================

export function getYouthPrograms(): YouthProgram[] {
  const db = getDb();
  if (!db.youthPrograms || !Array.isArray(db.youthPrograms) || db.youthPrograms.length === 0) {
    db.youthPrograms = INITIAL_YOUTH_PROGRAMS;
    saveDb(db);
  }
  return db.youthPrograms;
}

export function addYouthProgram(programData: Omit<YouthProgram, "id"> & { id?: string }): YouthProgram {
  const db = getDb();
  if (!db.youthPrograms || !Array.isArray(db.youthPrograms)) {
    db.youthPrograms = [...INITIAL_YOUTH_PROGRAMS];
  }
  const id = programData.id || `YTH-PRG-${Date.now().toString().slice(-4)}`;
  const now = new Date().toISOString();
  const newProgram: YouthProgram = {
    ...programData,
    id,
    createdAt: programData.createdAt || now,
  };
  db.youthPrograms.unshift(newProgram);
  saveDb(db);
  return newProgram;
}

export function deleteYouthProgram(id: string): boolean {
  const db = getDb();
  if (!db.youthPrograms) return false;
  const initialLength = db.youthPrograms.length;
  const searchId = id.trim().toLowerCase();
  db.youthPrograms = db.youthPrograms.filter((p) => p.id.toLowerCase() !== searchId);
  if (db.youthPrograms.length !== initialLength) {
    saveDb(db);
    return true;
  }
  return false;
}

export function getYouthRequests(): YouthRequest[] {
  const db = getDb();
  if (!db.youthRequests || !Array.isArray(db.youthRequests)) {
    db.youthRequests = INITIAL_YOUTH_REQUESTS;
    saveDb(db);
  }
  return db.youthRequests.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function addYouthRequest(
  input: Omit<YouthRequest, "id" | "status" | "createdAt"> & { id?: string }
): YouthRequest {
  const db = getDb();
  if (!db.youthRequests || !Array.isArray(db.youthRequests)) {
    db.youthRequests = [...INITIAL_YOUTH_REQUESTS];
  }
  const id = input.id || `YTH-${Math.floor(1000 + Math.random() * 9000)}`;
  const newRequest: YouthRequest = {
    id,
    fullName: input.fullName.trim(),
    phone: input.phone.trim(),
    zone: input.zone.trim(),
    projectType: input.projectType.trim(),
    targetInstitution: input.targetInstitution.trim(),
    issueDescription: input.issueDescription.trim(),
    status: "جديد",
    createdAt: new Date().toISOString(),
    notes: input.notes?.trim() || "تم تسجيل طلبكم وهو قيد المتابعة لدى المكتب البرلماني للنائب أسماء درويش.",
  };
  db.youthRequests.unshift(newRequest);
  saveDb(db);
  return newRequest;
}

export function updateYouthRequestStatus(
  id: string,
  status: YouthRequestStatus,
  notes?: string
): YouthRequest | null {
  const db = getDb();
  if (!db.youthRequests) return null;
  const req = db.youthRequests.find((r) => r.id.toLowerCase() === id.trim().toLowerCase());
  if (!req) return null;
  req.status = status;
  if (notes !== undefined) {
    req.notes = notes.trim();
  }
  saveDb(db);
  return req;
}

export function deleteYouthRequest(id: string): boolean {
  const db = getDb();
  if (!db.youthRequests) return false;
  const initialLength = db.youthRequests.length;
  const searchId = id.trim().toLowerCase();
  db.youthRequests = db.youthRequests.filter((r) => r.id.toLowerCase() !== searchId);
  if (db.youthRequests.length !== initialLength) {
    saveDb(db);
    return true;
  }
  return false;
}

