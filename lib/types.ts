export type ComplaintStatus = 'جديد' | 'بصدد الدرس' | 'تمت مراسلة الوزارة/البلدية' | 'تم الحل';

export type ComplaintPriority = 'عادي' | 'متوسط' | 'عاجل جداً';

export type ComplaintType = 'petition' | 'voice';

export type ComplaintCategory =
  | 'الماء والصوناد'
  | 'الكهرباء والستاغ'
  | 'الطرقات والتجهيز'
  | 'الصحة'
  | 'النقل'
  | 'الشؤون الاجتماعية'
  | 'البيئة والنظافة'
  | 'الماء والتطهير'
  | 'الإنارة والطرقات'
  | 'التشغيل'
  | 'إشكال إداري'
  | 'أخرى';

export const MANOUBA_ZONES = [
  "منوبة المدينة",
  "منوبة الوسطى (حي البرتقال / سليمان كاهية)",
  "سيدي عمر",
  "الدندان الشمالي",
  "الدندان الجنوبي",
  "قصر السعيد",
] as const;

export type ManoubaZone = typeof MANOUBA_ZONES[number];

export interface GPSLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  address?: string;
}

export interface Complaint {
  id: string; // e.g. "TN-4821"
  createdAt: string; // ISO date string
  citizenName: string;
  phone: string; // 8 digits
  email?: string; // Optional citizen email for status & response notifications
  zone: string; // Imada / Delegation
  category: ComplaintCategory;
  description: string;
  type?: ComplaintType;
  audioBase64?: string; // Voice recording
  imageBase64?: string; // Photo / document attachment
  attachmentName?: string; // Document filename
  gpsLocation?: GPSLocation | null;
  status: ComplaintStatus;
  priority: ComplaintPriority;
  adminPublicNote?: string; // Direct note from MP to citizen
  publicNote?: string; // Note from MP to the citizen (alias)
  adminResponsePdf?: string; // Base64 PDF data URL or file URL
  adminResponsePdfName?: string; // Name of attached PDF response
  adminResponseDate?: string; // ISO date of admin response
  officialLetterDraft?: string; // Official correspondence draft
  officialLetterText?: string; // Official correspondence text (alias)
  targetMinistry?: string; // Target ministry/institution
  publishedToProjects?: boolean; // Published to projects radar
}

export interface ComplaintInput {
  citizenName: string;
  phone: string;
  email?: string;
  zone: string;
  category: ComplaintCategory;
  description: string;
  type?: ComplaintType;
  audioBase64?: string;
  imageBase64?: string;
  gpsLocation?: GPSLocation | null;
  priority?: ComplaintPriority;
}

export interface Appointment {
  id: string; // e.g. "RDV-3482"
  createdAt: string;
  citizenName: string;
  phone: string;
  zone: string;
  date: string;
  timeSlot: string;
  topic: string;
  status: 'مؤكد' | 'قيد المراجعة' | 'منجز';
  notes?: string;
}

export interface AppointmentSettings {
  days: string[];
  timeSlots: string[];
  note?: string;
}

export interface ProjectItem {
  id: string;
  title: string;
  zone: string;
  targetMinistry: string;
  status: 'في انتظار رد الوزارة' | 'في طور الإنجاز' | 'تم التدخل' | 'تم إنجازه';
  progress: number; // 0 - 100
  summary: string;
  officialLetterText: string;
  lastUpdate: string;
  budgetEstimate?: string;
  relatedComplaintId?: string;
}

export interface PollOption {
  id: string;
  label: string;
  votes: number;
}

export interface PollItem {
  id: string;
  title: string;
  zone: string;
  description: string;
  options: PollOption[];
  totalVotes: number;
  endDate: string;
}

export interface NewsItem {
  id: string;
  title: string;
  link?: string;
  source: string;
  pubDate: string;
  publishedAt?: string; // ISO 8601 string for exact 15-day freshness tracking
  isUrgent?: boolean;
  isCustom?: boolean;
  category?: string;
  isPinned?: boolean;
  isAutoIngested?: boolean;
  sourceType?: 'parliament' | 'regional' | 'media' | 'custom';
  summary?: string;
}

export interface LiveStreamConfig {
  id: string;
  title: string;
  liveTitle?: string; // alias for liveTitle
  description: string;
  videoUrl: string; // YouTube Live URL, embed URL, or stream link
  streamUrl?: string; // alias for stream URL
  status: 'live' | 'scheduled' | 'ended';
  isLive?: boolean; // strict boolean live status flag
  scheduledFor?: string; // e.g. "اليوم - الساعة 19:00"
  viewersCount?: number;
  updatedAt?: string;
  startedAt?: string;
}

export interface LiveChatMessage {
  id: string;
  citizenName: string;
  zone: string;
  phone?: string;
  message: string;
  createdAt: string;
  isPinned?: boolean;
  status: 'pending' | 'converted' | 'answered' | 'archived';
  isConvertedToComplaint?: boolean;
  complaintId?: string;
}

export type GuideCategory =
  | 'البلدية'
  | 'الشؤون الاجتماعية'
  | 'الإدارات الجهوية'
  | 'الصوناد/الستاغ';

export const GUIDE_CATEGORIES: GuideCategory[] = [
  'البلدية',
  'الشؤون الاجتماعية',
  'الإدارات الجهوية',
  'الصوناد/الستاغ',
];

export interface GuideItem {
  id: string;
  title: string;
  category: GuideCategory;
  keywords: string[];
  requiredDocuments: string[];
  steps?: string[];
  location: string;
  departmentContact?: {
    address?: string;
    phone?: string;
    workingHours?: string;
  };
  processingTime?: string;
  cost?: string;
  downloadableFormUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type YouthProgramCategory =
  | 'تمويل وقروض صغرى'
  | 'تكوين ومرافقة'
  | 'برامج التشغيل ANETI'
  | 'شركات أهلية';

export const YOUTH_PROGRAM_CATEGORIES: YouthProgramCategory[] = [
  'تمويل وقروض صغرى',
  'تكوين ومرافقة',
  'برامج التشغيل ANETI',
  'شركات أهلية',
];

export interface YouthProgram {
  id: string;
  title: string;
  category: YouthProgramCategory;
  institution: string;
  targetAudience: string;
  fundingCap?: string;
  eligibilityCriteria: string[];
  requiredDocuments: string[];
  address: string;
  contactPhone?: string;
  officialUrl?: string;
  description: string;
  createdAt?: string;
}

export type YouthRequestStatus = 'جديد' | 'بصدد المتابعة مع الإدارة/البنك' | 'تمت التسوية';

export interface YouthRequest {
  id: string;
  fullName: string;
  phone: string;
  zone: string;
  projectType: string;
  targetInstitution: string;
  issueDescription: string;
  status: YouthRequestStatus;
  createdAt: string;
  notes?: string;
}


