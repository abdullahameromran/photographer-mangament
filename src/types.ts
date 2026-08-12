/**
 * Types definition for Photography Booking Management System
 */

export type BookingStatus =
  | 'جديد'
  | 'في انتظار العربون'
  | 'مؤكد'
  | 'قادم'
  | 'تم التصوير'
  | 'جاري التجهيز'
  | 'جاهز'
  | 'تم التسليم'
  | 'ملغي';

export type PrintStatus = 'لم تبدأ' | 'جاري التجهيز' | 'جاهزة' | 'تم التسليم';

export type PaymentStatus = 'لم يدفع' | 'دفع جزء' | 'مدفوع بالكامل';

export type BookingType =
  | 'سيشن'
  | 'قاعة'
  | 'حنة'
  | 'شبكة'
  | 'كتب كتاب'
  | 'بارتي'
  | 'Wedding'
  | 'أخرى';

export type ReminderOption =
  | 'قبل ساعة'
  | 'قبل ساعتين'
  | 'قبل 3 ساعات'
  | 'قبل 6 ساعات'
  | 'قبل 12 ساعة'
  | 'قبل يوم'
  | 'مخصص';

export interface PrintOptions {
  largeCanvas: boolean; // تابلوه كبير
  smallCanvas: boolean; // تابلوه صغير
  album30x45: boolean; // ألبوم 30 × 45
  album30x60: boolean; // ألبوم 30 × 60
  photoCards: boolean; // صور كروت
  photoCardsCount: number; // عدد الصور
}

export interface Booking {
  id: string;
  // Customer details
  customerName: string;
  phone: string;
  whatsapp: string;

  // Booking details
  title: string; // e.g. حنة فاطمة
  bookingTypes: BookingType[];
  date: string; // YYYY-MM-DD
  startTime: string; // e.g. 19:00
  endTime: string; // e.g. 23:00
  location: string;
  mapUrl?: string;
  notes: string;

  // Financials
  price: number;
  hasDeposit: boolean;
  depositAmount: number;

  // Printing
  hasPrint: boolean;
  printOptions: PrintOptions;
  printStatus: PrintStatus;

  // Reminder & Assignment
  reminder: ReminderOption;
  customReminderText?: string;
  assignedUserIds: string[];

  // Status
  status: BookingStatus;
  createdAt: string;
}

export type UserRole = 'Admin' | 'مصور' | 'مساعد' | 'موظف' | 'Editor' | 'Manager';
export type UserStatus = 'Active' | 'Disabled';
export type BookingScope = 'all' | 'assigned' | 'selected';

export interface ActionPermissions {
  viewBooking: boolean;
  createBooking: boolean;
  editBooking: boolean;
  deleteBooking: boolean;
  changeStatus: boolean;
  addNotes: boolean;
}

export type FieldKey =
  | 'customerName'
  | 'phone'
  | 'whatsapp'
  | 'title'
  | 'bookingTypes'
  | 'date'
  | 'time'
  | 'location'
  | 'price'
  | 'depositAmount'
  | 'remaining'
  | 'paymentStatus'
  | 'printSettings'
  | 'notes'
  | 'reminder'
  | 'assignedStaff'
  | 'status';

export interface FieldPermission {
  view: boolean;
  edit: boolean;
}

export interface UserPermissions {
  bookingScope: BookingScope;
  selectedBookingIds: string[]; // Specific bookings if scope === 'selected'
  actions: ActionPermissions;
  fields: Record<FieldKey, FieldPermission>;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  avatar: string;
  isSystemAdmin?: boolean;
  permissions: UserPermissions;
}

export const ALL_FIELD_KEYS: { key: FieldKey; label: string; group: string }[] = [
  { key: 'customerName', label: 'اسم العميل', group: 'بيانات العميل' },
  { key: 'phone', label: 'رقم الموبايل', group: 'بيانات العميل' },
  { key: 'whatsapp', label: 'رقم الواتساب', group: 'بيانات العميل' },
  { key: 'title', label: 'عنوان الحجز / الفعالية', group: 'تفاصيل الحجز' },
  { key: 'bookingTypes', label: 'أنواع الحجز (سيشن، زفاف، حنة...)', group: 'تفاصيل الحجز' },
  { key: 'date', label: 'تاريخ الحجز', group: 'تفاصيل الحجز' },
  { key: 'time', label: 'وقت الحجز (البداية والنهاية)', group: 'تفاصيل الحجز' },
  { key: 'location', label: 'المكان والعنوان', group: 'تفاصيل الحجز' },
  { key: 'price', label: 'سعر الحجز', group: 'الحسابات المالية' },
  { key: 'depositAmount', label: 'مبلغ العربون والمدفوع', group: 'الحسابات المالية' },
  { key: 'remaining', label: 'المبلغ الباقي وحالة الدفع', group: 'الحسابات المالية' },
  { key: 'printSettings', label: 'إعدادات وحالة الطباعة', group: 'الطباعة' },
  { key: 'notes', label: 'الملاحظات الخاصة بالحجز', group: 'ملاحظات وتذكيرات' },
  { key: 'reminder', label: 'موعد التذكير', group: 'ملاحظات وتذكيرات' },
  { key: 'assignedStaff', label: 'المسؤولين عن الحجز', group: 'إدارة الفريق' },
  { key: 'status', label: 'حالة الحجز', group: 'حالة الحجز' },
];
