import React, { useState, useEffect } from 'react';
import {
  Booking,
  User,
  BookingStatus,
  PrintStatus,
  BookingType,
  ReminderOption,
  PrintOptions,
} from '../types';
import {
  canViewField,
  canEditField,
  canPerformAction,
  calculateFinancials,
  formatCurrency,
} from '../utils/permissions';
import {
  X,
  Save,
  Calendar,
  Clock,
  MapPin,
  Phone,
  MessageCircle,
  Printer,
  DollarSign,
  UserCheck,
  FileText,
  AlertCircle,
  Lock,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (bookingData: Partial<Booking>) => void;
  initialBooking?: Booking | null;
  mode: 'create' | 'edit' | 'view';
  currentUser: User;
  allUsers: User[];
}

const BOOKING_TYPES_LIST: BookingType[] = [
  'سيشن',
  'قاعة',
  'حنة',
  'شبكة',
  'كتب كتاب',
  'بارتي',
  'Wedding',
  'أخرى',
];

const REMINDER_OPTIONS: ReminderOption[] = [
  'قبل ساعة',
  'قبل ساعتين',
  'قبل 3 ساعات',
  'قبل 6 ساعات',
  'قبل 12 ساعة',
  'قبل يوم',
  'مخصص',
];

export const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialBooking,
  mode,
  currentUser,
  allUsers,
}) => {
  if (!isOpen) return null;

  const isViewOnly = mode === 'view';

  // Form State
  const [title, setTitle] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [bookingTypes, setBookingTypes] = useState<BookingType[]>(['سيشن']);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('18:00');
  const [endTime, setEndTime] = useState('22:00');
  const [location, setLocation] = useState('');
  const [mapUrl, setMapUrl] = useState('');
  const [notes, setNotes] = useState('');

  // Financials
  const [price, setPrice] = useState<number>(8000);
  const [hasDeposit, setHasDeposit] = useState<boolean>(true);
  const [depositAmount, setDepositAmount] = useState<number>(3000);

  // Printing
  const [hasPrint, setHasPrint] = useState<boolean>(false);
  const [printOptions, setPrintOptions] = useState<PrintOptions>({
    largeCanvas: false,
    smallCanvas: false,
    album30x45: false,
    album30x60: false,
    photoCards: false,
    photoCardsCount: 0,
  });
  const [printStatus, setPrintStatus] = useState<PrintStatus>('لم تبدأ');

  // Reminder & Assignment & Status
  const [reminder, setReminder] = useState<ReminderOption>('قبل يوم');
  const [customReminderText, setCustomReminderText] = useState('');
  const [assignedUserIds, setAssignedUserIds] = useState<string[]>([]);
  const [status, setStatus] = useState<BookingStatus>('جديد');

  // Load initial data if editing/viewing or creating with date
  useEffect(() => {
    if (initialBooking) {
      setTitle(initialBooking.title || '');
      setCustomerName(initialBooking.customerName || '');
      setPhone(initialBooking.phone || '');
      setWhatsapp(initialBooking.whatsapp || '');
      setBookingTypes(initialBooking.bookingTypes || ['سيشن']);
      if (initialBooking.date) {
        setDate(initialBooking.date);
      }
      setStartTime(initialBooking.startTime || '18:00');
      setEndTime(initialBooking.endTime || '22:00');
      setLocation(initialBooking.location || '');
      setMapUrl(initialBooking.mapUrl || '');
      setNotes(initialBooking.notes || '');

      setPrice(initialBooking.price || 0);
      setHasDeposit(initialBooking.hasDeposit ?? false);
      setDepositAmount(initialBooking.depositAmount || 0);

      setHasPrint(initialBooking.hasPrint ?? false);
      setPrintOptions(
        initialBooking.printOptions || {
          largeCanvas: false,
          smallCanvas: false,
          album30x45: false,
          album30x60: false,
          photoCards: false,
          photoCardsCount: 0,
        }
      );
      setPrintStatus(initialBooking.printStatus || 'لم تبدأ');

      setReminder(initialBooking.reminder || 'قبل يوم');
      setCustomReminderText(initialBooking.customReminderText || '');
      setAssignedUserIds(initialBooking.assignedUserIds || []);
      setStatus(initialBooking.status || 'جديد');
    } else {
      // Default new booking
      setTitle('');
      setCustomerName('');
      setPhone('');
      setWhatsapp('');
      setBookingTypes(['سيشن']);
      setDate(new Date().toISOString().split('T')[0]);
      setStartTime('18:00');
      setEndTime('22:00');
      setLocation('');
      setNotes('');
      setPrice(8000);
      setHasDeposit(true);
      setDepositAmount(3000);
      setHasPrint(true);
      setPrintOptions({
        largeCanvas: true,
        smallCanvas: false,
        album30x45: true,
        album30x60: false,
        photoCards: true,
        photoCardsCount: 30,
      });
      setPrintStatus('لم تبدأ');
      setReminder('قبل يوم');
      setAssignedUserIds([currentUser.id]);
      setStatus('مؤكد');
    }
  }, [initialBooking, isOpen, currentUser]);

  // Financial auto calculations
  const { paid, remaining, paymentStatus } = calculateFinancials(price, hasDeposit, depositAmount);

  // Field permission checks
  const canViewName = canViewField(currentUser, 'customerName');
  const canEditName = canEditField(currentUser, 'customerName') && !isViewOnly;

  const canViewPhone = canViewField(currentUser, 'phone');
  const canEditPhone = canEditField(currentUser, 'phone') && !isViewOnly;

  const canViewWhatsapp = canViewField(currentUser, 'whatsapp');
  const canEditWhatsapp = canEditField(currentUser, 'whatsapp') && !isViewOnly;

  const canViewTitle = canViewField(currentUser, 'title');
  const canEditTitle = canEditField(currentUser, 'title') && !isViewOnly;

  const canViewTypes = canViewField(currentUser, 'bookingTypes');
  const canEditTypes = canEditField(currentUser, 'bookingTypes') && !isViewOnly;

  const canViewDate = canViewField(currentUser, 'date');
  const canEditDate = canEditField(currentUser, 'date') && !isViewOnly;

  const canViewTime = canViewField(currentUser, 'time');
  const canEditTime = canEditField(currentUser, 'time') && !isViewOnly;

  const canViewLocation = canViewField(currentUser, 'location');
  const canEditLocation = canEditField(currentUser, 'location') && !isViewOnly;

  const canViewPrice = canViewField(currentUser, 'price');
  const canEditPrice = canEditField(currentUser, 'price') && !isViewOnly;

  const canViewDeposit = canViewField(currentUser, 'depositAmount');
  const canEditDeposit = canEditField(currentUser, 'depositAmount') && !isViewOnly;

  const canViewPrint = canViewField(currentUser, 'printSettings');
  const canEditPrint = canEditField(currentUser, 'printSettings') && !isViewOnly;

  const canViewNotes = canViewField(currentUser, 'notes');
  const canEditNotes = canEditField(currentUser, 'notes') && !isViewOnly;

  const canViewReminder = canViewField(currentUser, 'reminder');
  const canEditReminder = canEditField(currentUser, 'reminder') && !isViewOnly;

  const canViewStaff = canViewField(currentUser, 'assignedStaff');
  const canEditStaff = canEditField(currentUser, 'assignedStaff') && !isViewOnly;

  const canViewStatus = canViewField(currentUser, 'status');
  const canEditStatus = canEditField(currentUser, 'status') && !isViewOnly;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      title: title || `حجز ${customerName}`,
      customerName,
      phone,
      whatsapp: whatsapp || phone,
      bookingTypes,
      date,
      startTime,
      endTime,
      location,
      mapUrl,
      notes,
      price,
      hasDeposit,
      depositAmount: hasDeposit ? depositAmount : 0,
      hasPrint,
      printOptions,
      printStatus,
      reminder,
      customReminderText,
      assignedUserIds,
      status,
    });
    onClose();
  };

  const toggleType = (type: BookingType) => {
    if (!canEditTypes) return;
    if (bookingTypes.includes(type)) {
      if (bookingTypes.length > 1) {
        setBookingTypes(bookingTypes.filter((t) => t !== type));
      }
    } else {
      setBookingTypes([...bookingTypes, type]);
    }
  };

  const toggleAssignedUser = (userId: string) => {
    if (!canEditStaff) return;
    if (assignedUserIds.includes(userId)) {
      setAssignedUserIds(assignedUserIds.filter((id) => id !== userId));
    } else {
      setAssignedUserIds([...assignedUserIds, userId]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden my-auto">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-5 px-6 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-tajawal">
                {mode === 'create'
                  ? 'إضافة حجز جديد'
                  : mode === 'edit'
                  ? 'تعديل تفاصيل الحجز'
                  : 'عرض تفاصيل الحجز'}
              </h2>
              <p className="text-xs text-slate-400">
                {mode === 'create'
                  ? 'أدخل بيانات الحجز والطباعة والحسابات الماليه'
                  : title || customerName}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1 text-right">
          {/* Section 1: Customer Details */}
          <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200/80 space-y-4">
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-200 pb-2">
              <Phone className="w-4 h-4 text-amber-600" />
              <span>بيانات العميل التواصل:</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Customer Name */}
              {canViewName ? (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    اسم العميل <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!canEditName}
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="مثال: فاطمة الزهراء"
                    className="w-full text-sm bg-white p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 disabled:bg-slate-100 disabled:text-slate-500"
                  />
                </div>
              ) : (
                <div className="bg-slate-100 p-2.5 rounded-xl text-xs text-slate-400 font-bold flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5" /> اسم العميل محمي
                </div>
              )}

              {/* Phone */}
              {canViewPhone ? (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    رقم الموبايل
                  </label>
                  <input
                    type="text"
                    disabled={!canEditPhone}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="مثال: 01012345678"
                    className="w-full text-sm bg-white p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 disabled:bg-slate-100 disabled:text-slate-500 dir-ltr text-right"
                  />
                </div>
              ) : (
                <div className="bg-slate-100 p-2.5 rounded-xl text-xs text-slate-400 font-bold flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5" /> الهاتف محمي
                </div>
              )}

              {/* WhatsApp */}
              {canViewWhatsapp ? (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    رقم الواتساب
                  </label>
                  <input
                    type="text"
                    disabled={!canEditWhatsapp}
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="مثال: 201012345678"
                    className="w-full text-sm bg-white p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 disabled:bg-slate-100 disabled:text-slate-500 dir-ltr text-right"
                  />
                </div>
              ) : (
                <div className="bg-slate-100 p-2.5 rounded-xl text-xs text-slate-400 font-bold flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5" /> الواتساب محمي
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Booking Event Info */}
          <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200/80 space-y-4">
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-200 pb-2">
              <Calendar className="w-4 h-4 text-amber-600" />
              <span>تفاصيل الحجز والفعالية:</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Event Title */}
              {canViewTitle && (
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    عنوان الحجز / اسم المناسبة <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!canEditTitle}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="مثال: حنة فاطمة ومحمد"
                    className="w-full text-sm bg-white p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 disabled:bg-slate-100 disabled:text-slate-500 font-bold"
                  />
                </div>
              )}

              {/* Booking Types (Multiple choice) */}
              {canViewTypes && (
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    نوع الحجز (يمكن اختيار أكثر من نوع):
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {BOOKING_TYPES_LIST.map((t) => {
                      const isSelected = bookingTypes.includes(t);
                      return (
                        <button
                          key={t}
                          type="button"
                          disabled={!canEditTypes}
                          onClick={() => toggleType(t)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                            isSelected
                              ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-sm'
                              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                          } disabled:opacity-60 cursor-pointer`}
                        >
                          {isSelected ? '✓ ' : ''} {t}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Date */}
              {canViewDate && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    تاريخ الحجز <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    disabled={!canEditDate}
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full text-sm bg-white p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 disabled:bg-slate-100 disabled:text-slate-500"
                  />
                </div>
              )}

              {/* Time */}
              {canViewTime && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      وقت البداية
                    </label>
                    <input
                      type="time"
                      disabled={!canEditTime}
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full text-sm bg-white p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 disabled:bg-slate-100 disabled:text-slate-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      وقت النهاية
                    </label>
                    <input
                      type="time"
                      disabled={!canEditTime}
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full text-sm bg-white p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 disabled:bg-slate-100 disabled:text-slate-500"
                    />
                  </div>
                </div>
              )}

              {/* Location */}
              {canViewLocation && (
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    المكان والعنوان
                  </label>
                  <input
                    type="text"
                    disabled={!canEditLocation}
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="مثال: التجمع الخامس - قاعة اللوتس"
                    className="w-full text-sm bg-white p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 disabled:bg-slate-100 disabled:text-slate-500"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Financials (حسابات الحجز) */}
          {(canViewPrice || canViewDeposit) && (
            <div className="bg-slate-900 text-white p-5 rounded-xl border border-slate-800 shadow-md relative overflow-hidden space-y-4">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 blur-3xl rounded-full pointer-events-none"></div>

              <h3 className="font-bold text-white text-sm flex items-center justify-between border-b border-slate-800 pb-2 relative z-10">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-4 bg-blue-600 rounded-full inline-block"></span>
                  <DollarSign className="w-4 h-4 text-blue-400" />
                  <span>الحسابات المالية للحجز:</span>
                </div>
                <span className="text-[10px] bg-blue-600/30 text-blue-300 border border-blue-500/40 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  حساب تلقائي
                </span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
                {/* Price */}
                {canViewPrice && (
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1 uppercase tracking-wider text-[11px]">
                      سعر الحجز الإجمالي (جنيه) <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="number"
                      min={0}
                      disabled={!canEditPrice}
                      value={price}
                      onChange={(e) => setPrice(Number(e.target.value))}
                      placeholder="8000"
                      className="w-full text-sm font-bold bg-slate-800 text-white p-2.5 rounded-lg border border-slate-700 focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    />
                  </div>
                )}

                {/* Has Deposit Check */}
                {canViewDeposit && (
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-2 uppercase tracking-wider text-[11px]">
                      دفع عربون؟
                    </label>
                    <div className="flex items-center gap-4 pt-1">
                      <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-white">
                        <input
                          type="radio"
                          disabled={!canEditDeposit}
                          checked={hasDeposit}
                          onChange={() => setHasDeposit(true)}
                          className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                        />
                        <span>نعم</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-slate-300">
                        <input
                          type="radio"
                          disabled={!canEditDeposit}
                          checked={!hasDeposit}
                          onChange={() => setHasDeposit(false)}
                          className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                        />
                        <span>لا</span>
                      </label>
                    </div>
                  </div>
                )}

                {/* Deposit Amount (If Yes) */}
                {canViewDeposit && hasDeposit && (
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-300 mb-1 uppercase tracking-wider text-[11px]">
                      مبلغ العربون المباشر (جنيه)
                    </label>
                    <input
                      type="number"
                      min={0}
                      disabled={!canEditDeposit}
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(Number(e.target.value))}
                      placeholder="3000"
                      className="w-full text-sm font-bold text-emerald-400 bg-slate-800 p-2.5 rounded-lg border border-slate-700 focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    />
                  </div>
                )}
              </div>

              {/* Automatic Calculation Results Box */}
              <div className="bg-slate-800/80 p-4 rounded-lg border border-slate-700 space-y-2 relative z-10">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">الملخص المالي التلقائي:</div>
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
                  <div>
                    سعر الحجز: <strong className="font-bold text-white">{formatCurrency(price)}</strong>
                  </div>
                  <div>
                    المدفوع: <strong className="font-bold text-emerald-400">{formatCurrency(paid)}</strong>
                  </div>
                  <div className="bg-slate-900 text-amber-400 border border-slate-700 px-3 py-1 rounded-lg">
                    المتبقي: <strong className="font-bold text-base">{formatCurrency(remaining)}</strong>
                  </div>
                </div>

                <div className="text-xs font-bold text-slate-300 pt-1 flex items-center gap-2">
                  <span>حالة الدفع:</span>
                  <span
                    className={`px-2.5 py-0.5 rounded text-xs font-bold uppercase ${
                      paymentStatus === 'مدفوع بالكامل'
                        ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700'
                        : paymentStatus === 'دفع جزء'
                        ? 'bg-amber-900/60 text-amber-300 border border-amber-700'
                        : 'bg-red-900/60 text-red-300 border border-red-700'
                    }`}
                  >
                    {paymentStatus}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Section 4: Print Management (إدارة الطباعة) */}
          {canViewPrint && (
            <div className="bg-indigo-50/70 p-4 sm:p-5 rounded-2xl border border-indigo-200 space-y-4">
              <h3 className="font-extrabold text-indigo-950 text-sm flex items-center justify-between border-b border-indigo-200 pb-2">
                <div className="flex items-center gap-2">
                  <Printer className="w-4 h-4 text-indigo-600" />
                  <span>إدارة الطباعة والاستوديو:</span>
                </div>
              </h3>

              {/* Has Print Toggle */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-2">
                  هل العميل طلب طباعة؟
                </label>
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-slate-800">
                    <input
                      type="radio"
                      disabled={!canEditPrint}
                      checked={hasPrint}
                      onChange={() => setHasPrint(true)}
                      className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>نعم</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-slate-800">
                    <input
                      type="radio"
                      disabled={!canEditPrint}
                      checked={!hasPrint}
                      onChange={() => setHasPrint(false)}
                      className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>لا</span>
                  </label>
                </div>
              </div>

              {/* Print Choices if Yes */}
              {hasPrint && (
                <div className="space-y-4 bg-white p-4 rounded-xl border border-indigo-100">
                  <div className="text-xs font-bold text-slate-800 mb-2">
                    اختيارات الطباعة (يمكن اختيار أكثر من عنصر):
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-bold text-slate-800">
                    {/* Large Canvas */}
                    <label className="flex items-center gap-2.5 p-2 bg-slate-50 rounded-xl hover:bg-slate-100 cursor-pointer">
                      <input
                        type="checkbox"
                        disabled={!canEditPrint}
                        checked={printOptions.largeCanvas}
                        onChange={(e) =>
                          setPrintOptions({ ...printOptions, largeCanvas: e.target.checked })
                        }
                        className="w-4 h-4 text-indigo-600 rounded"
                      />
                      <span>تابلوه كبير</span>
                    </label>

                    {/* Small Canvas */}
                    <label className="flex items-center gap-2.5 p-2 bg-slate-50 rounded-xl hover:bg-slate-100 cursor-pointer">
                      <input
                        type="checkbox"
                        disabled={!canEditPrint}
                        checked={printOptions.smallCanvas}
                        onChange={(e) =>
                          setPrintOptions({ ...printOptions, smallCanvas: e.target.checked })
                        }
                        className="w-4 h-4 text-indigo-600 rounded"
                      />
                      <span>تابلوه صغير</span>
                    </label>

                    {/* Album 30x45 */}
                    <label className="flex items-center gap-2.5 p-2 bg-slate-50 rounded-xl hover:bg-slate-100 cursor-pointer">
                      <input
                        type="checkbox"
                        disabled={!canEditPrint}
                        checked={printOptions.album30x45}
                        onChange={(e) =>
                          setPrintOptions({ ...printOptions, album30x45: e.target.checked })
                        }
                        className="w-4 h-4 text-indigo-600 rounded"
                      />
                      <span>ألبوم 30 × 45</span>
                    </label>

                    {/* Album 30x60 */}
                    <label className="flex items-center gap-2.5 p-2 bg-slate-50 rounded-xl hover:bg-slate-100 cursor-pointer">
                      <input
                        type="checkbox"
                        disabled={!canEditPrint}
                        checked={printOptions.album30x60}
                        onChange={(e) =>
                          setPrintOptions({ ...printOptions, album30x60: e.target.checked })
                        }
                        className="w-4 h-4 text-indigo-600 rounded"
                      />
                      <span>ألبوم 30 × 60</span>
                    </label>

                    {/* Photo Cards */}
                    <label className="flex items-center gap-2.5 p-2 bg-slate-50 rounded-xl hover:bg-slate-100 cursor-pointer sm:col-span-2">
                      <input
                        type="checkbox"
                        disabled={!canEditPrint}
                        checked={printOptions.photoCards}
                        onChange={(e) =>
                          setPrintOptions({ ...printOptions, photoCards: e.target.checked })
                        }
                        className="w-4 h-4 text-indigo-600 rounded"
                      />
                      <span>صور كروت</span>
                    </label>
                  </div>

                  {/* Photo cards quantity if checked */}
                  {printOptions.photoCards && (
                    <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-200">
                      <label className="block text-xs font-bold text-indigo-950 mb-1">
                        عدد صور الكروت:
                      </label>
                      <input
                        type="number"
                        min={1}
                        disabled={!canEditPrint}
                        value={printOptions.photoCardsCount || ''}
                        onChange={(e) =>
                          setPrintOptions({
                            ...printOptions,
                            photoCardsCount: Math.max(0, Number(e.target.value)),
                          })
                        }
                        placeholder="مثال: 50"
                        className="w-full text-sm bg-white p-2 rounded-xl border border-indigo-300 font-bold"
                      />
                    </div>
                  )}

                  {/* Print Status */}
                  <div className="pt-2 border-t border-slate-200">
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      حالة الطباعة:
                    </label>
                    <select
                      disabled={!canEditPrint}
                      value={printStatus}
                      onChange={(e) => setPrintStatus(e.target.value as PrintStatus)}
                      className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-300 bg-white"
                    >
                      <option value="لم تبدأ">لم تبدأ</option>
                      <option value="جاري التجهيز">جاري التجهيز</option>
                      <option value="جاهزة">جاهزة</option>
                      <option value="تم التسليم">تم التسليم</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Section 5: Reminder & Staff Assignment */}
          <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200/80 space-y-4">
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-200 pb-2">
              <UserCheck className="w-4 h-4 text-amber-600" />
              <span>التذكير وإسناد المسؤولين:</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Reminder */}
              {canViewReminder && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    موعد التذكير (Reminder):
                  </label>
                  <select
                    disabled={!canEditReminder}
                    value={reminder}
                    onChange={(e) => setReminder(e.target.value as ReminderOption)}
                    className="w-full text-sm bg-white p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 disabled:bg-slate-100"
                  >
                    {REMINDER_OPTIONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Status */}
              {canViewStatus && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    حالة الحجز الكلية:
                  </label>
                  <select
                    disabled={!canEditStatus}
                    value={status}
                    onChange={(e) => setStatus(e.target.value as BookingStatus)}
                    className="w-full text-sm font-bold bg-white p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 disabled:bg-slate-100"
                  >
                    <option value="جديد">جديد</option>
                    <option value="في انتظار العربون">في انتظار العربون</option>
                    <option value="مؤكد">مؤكد</option>
                    <option value="قادم">قادم</option>
                    <option value="تم التصوير">تم التصوير</option>
                    <option value="جاري التجهيز">جاري التجهيز</option>
                    <option value="جاهز">جاهز</option>
                    <option value="تم التسليم">تم التسليم</option>
                    <option value="ملغي">ملغي</option>
                  </select>
                </div>
              )}

              {/* Assigned Staff */}
              {canViewStaff && (
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    المسؤولين عن هذا الحجز من الفريق:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {allUsers.map((u) => {
                      const isAssigned = assignedUserIds.includes(u.id);
                      return (
                        <div
                          key={u.id}
                          onClick={() => toggleAssignedUser(u.id)}
                          className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                            isAssigned
                              ? 'bg-amber-50 border-amber-400 text-amber-950 font-bold'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <img
                              src={u.avatar}
                              alt={u.name}
                              className="w-7 h-7 rounded-lg object-cover"
                            />
                            <div className="text-xs">
                              <div>{u.name}</div>
                              <div className="text-[10px] text-slate-400">{u.role}</div>
                            </div>
                          </div>
                          {isAssigned && <CheckCircle2 className="w-4 h-4 text-amber-600" />}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section 6: Notes */}
          {canViewNotes && (
            <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200/80 space-y-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                الملاحظات والتعليمات الخاصة بالحجز:
              </label>
              <textarea
                rows={3}
                disabled={!canEditNotes}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="أدخل أي ملاحظات خاصة بالسيشن، الأماكن، التفاصيل اللوجستية..."
                className="w-full text-sm bg-white p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 disabled:bg-slate-100 disabled:text-slate-500"
              />
            </div>
          )}

          {/* Submit Footer */}
          {!isViewOnly && (
            <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3 sticky bottom-0 bg-white py-2">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-100 transition-colors cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-sm transition-colors cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>حفظ بيانات الحجز</span>
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
