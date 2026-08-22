import React, { useState, useEffect } from "react";
import {
  Booking,
  User,
  BookingStatus,
  PrintStatus,
  BookingType,
  ReminderOption,
  PrintOptions,
  CustomLineItem,
  ExpenseItem,
} from "../types";
import {
  canViewField,
  canEditField,
  canPerformAction,
  calculateFinancials,
  formatCurrency,
} from "../utils/permissions";
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
  Plus,
  Trash2,
  ReceiptText,
  PackagePlus,
} from "lucide-react";
import { storageApi } from "../lib/supabase";

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (bookingData: Partial<Booking>) => void | Promise<void>;
  initialBooking?: Booking | null;
  mode: "create" | "edit" | "view";
  currentUser: User;
  allUsers: User[];
}

const BOOKING_TYPES_LIST: BookingType[] = [
  "سيشن",
  "قاعة",
  "حنة",
  "شبكة",
  "كتب كتاب",
  "بارتي",
  "Wedding",
  "أخرى",
];

const REMINDER_OPTIONS: ReminderOption[] = [
  "قبل ساعة",
  "قبل ساعتين",
  "قبل 3 ساعات",
  "قبل 6 ساعات",
  "قبل 12 ساعة",
  "قبل يوم",
  "مخصص",
];

const timeToMinutes = (value: string) => {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
};

// When the end is earlier on the clock, it belongs to the following day.
// The booking date always remains its starting date.
const isValidTimeRange = (start: string, end: string) => {
  if (!start || !end || start === end) return false;
  const startMinutes = timeToMinutes(start);
  let endMinutes = timeToMinutes(end);
  if (endMinutes < startMinutes) endMinutes += 24 * 60;
  const duration = endMinutes - startMinutes;
  return duration > 0;
};

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

  const isViewOnly = mode === "view";

  // Form State
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [bookingTypes, setBookingTypes] = useState<BookingType[]>(["سيشن"]);
  const [separateSchedules,setSeparateSchedules]=useState(false);
  const [typeSchedules,setTypeSchedules]=useState<Record<string,{date:string;startTime:string;endTime:string}>>({});
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [startTime, setStartTime] = useState("18:00");
  const [endTime, setEndTime] = useState("22:00");
  const [location, setLocation] = useState("");
  const [mapUrl, setMapUrl] = useState("");
  const [notes, setNotes] = useState("");

  // Financials
  const [price, setPrice] = useState<number>(8000);
  const [hasDeposit, setHasDeposit] = useState<boolean>(true);
  const [depositAmount, setDepositAmount] = useState<number>(3000);
  const [depositReceiptUrl, setDepositReceiptUrl] = useState("");
  const [depositReceiptFile, setDepositReceiptFile] = useState<File | null>(null);
  const [addons, setAddons] = useState<CustomLineItem[]>([]);
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [depositReceiptPreview, setDepositReceiptPreview] = useState("");
  const [isUploadingReceipt, setIsUploadingReceipt] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

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
  const [printStatus, setPrintStatus] = useState<PrintStatus>("لم تبدأ");
  const [customPrintItems, setCustomPrintItems] = useState<CustomLineItem[]>([]);

  // Reminder & Assignment & Status
  const [reminder, setReminder] = useState<ReminderOption>("قبل يوم");
  const [customReminderText, setCustomReminderText] = useState("");
  const [assignedUserIds, setAssignedUserIds] = useState<string[]>([]);
  const [status, setStatus] = useState<BookingStatus>("جديد");

  // Load initial data if editing/viewing or creating with date
  useEffect(() => {
    if (initialBooking) {
      setCustomerName(initialBooking.customerName || "");
      setPhone(initialBooking.phone || "");
      setBookingTypes(initialBooking.bookingTypes || ["سيشن"]);
      setSeparateSchedules(Boolean(initialBooking.typeSchedules?.length));
      setTypeSchedules(Object.fromEntries((initialBooking.typeSchedules||[]).map(s=>[s.type,{date:s.date,startTime:s.startTime,endTime:s.endTime}])));
      if (initialBooking.date) {
        setDate(initialBooking.date);
      }
      setStartTime(initialBooking.startTime || "18:00");
      setEndTime(initialBooking.endTime || "22:00");
      setLocation(initialBooking.location || "");
      setMapUrl(initialBooking.mapUrl || "");
      setNotes(initialBooking.notes || "");

      setPrice(initialBooking.price || 0);
      setHasDeposit(initialBooking.hasDeposit ?? false);
      setDepositAmount(initialBooking.depositAmount || 0);
      setDepositReceiptUrl(initialBooking.depositReceiptUrl || "");
      setDepositReceiptPreview(initialBooking.depositReceiptUrl || "");
      setDepositReceiptFile(null);
      setAddons(initialBooking.addons || []);
      setExpenses(initialBooking.expenses || []);

      setHasPrint(initialBooking.hasPrint ?? false);
      setPrintOptions(
        initialBooking.printOptions || {
          largeCanvas: false,
          smallCanvas: false,
          album30x45: false,
          album30x60: false,
          photoCards: false,
          photoCardsCount: 0,
        },
      );
      setPrintStatus(initialBooking.printStatus || "لم تبدأ");
      setCustomPrintItems(initialBooking.customPrintItems || []);

      setReminder(initialBooking.reminder || "قبل يوم");
      setCustomReminderText(initialBooking.customReminderText || "");
      setAssignedUserIds(initialBooking.assignedUserIds || []);
      setStatus(initialBooking.status || "جديد");
    } else {
      // Default new booking
      setCustomerName("");
      setPhone("");
      setBookingTypes(["سيشن"]);
      setDate(new Date().toISOString().split("T")[0]);
      setStartTime("18:00");
      setEndTime("22:00");
      setLocation("");
      setNotes("");
      setPrice(8000);
      setHasDeposit(true);
      setDepositAmount(3000);
      setDepositReceiptUrl("");
      setDepositReceiptPreview("");
      setDepositReceiptFile(null);
      setAddons([]);
      setExpenses([]);
      setHasPrint(true);
      setPrintOptions({
        largeCanvas: true,
        smallCanvas: false,
        album30x45: true,
        album30x60: false,
        photoCards: true,
        photoCardsCount: 30,
      });
      setPrintStatus("لم تبدأ");
      setCustomPrintItems([]);
      setReminder("قبل يوم");
      setAssignedUserIds([currentUser.id]);
      setStatus("مؤكد");
    }
  }, [initialBooking, isOpen, currentUser]);

  // Financial auto calculations
  const { paid, remaining, paymentStatus } = calculateFinancials(
    price,
    hasDeposit,
    depositAmount,
  );

  // Field permission checks
  const canViewName = canViewField(currentUser, "customerName");
  const canEditName = canEditField(currentUser, "customerName") && !isViewOnly;

  const canViewPhone = canViewField(currentUser, "phone");
  const canEditPhone = canEditField(currentUser, "phone") && !isViewOnly;

  const canViewTypes = canViewField(currentUser, "bookingTypes");
  const canEditTypes = canEditField(currentUser, "bookingTypes") && !isViewOnly;

  const canViewDate = canViewField(currentUser, "date");
  const canEditDate = canEditField(currentUser, "date") && !isViewOnly;

  const canViewTime = canViewField(currentUser, "time");
  const canEditTime = canEditField(currentUser, "time") && !isViewOnly;

  const canViewLocation = canViewField(currentUser, "location");
  const canEditLocation = canEditField(currentUser, "location") && !isViewOnly;

  const canViewPrice = canViewField(currentUser, "price");
  const canEditPrice = canEditField(currentUser, "price") && !isViewOnly;

  const canViewDeposit = canViewField(currentUser, "depositAmount");
  const canEditDeposit =
    canEditField(currentUser, "depositAmount") && !isViewOnly;

  const canViewAddons = canViewField(currentUser, "addons");
  const canEditAddons = canEditField(currentUser, "addons") && !isViewOnly;
  const canViewExpenses = canViewField(currentUser, "expenses");
  const canEditExpenses = canEditField(currentUser, "expenses") && !isViewOnly;

  const canViewPrint = canViewField(currentUser, "printSettings");
  const canEditPrint =
    canEditField(currentUser, "printSettings") && !isViewOnly;

  const canViewNotes = canViewField(currentUser, "notes");
  const canEditNotes = canEditField(currentUser, "notes") && !isViewOnly;

  const canViewReminder = canViewField(currentUser, "reminder");
  const canEditReminder = canEditField(currentUser, "reminder") && !isViewOnly;

  const canViewStaff = canViewField(currentUser, "assignedStaff");
  const canEditStaff =
    canEditField(currentUser, "assignedStaff") && !isViewOnly;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: string[] = [];
    const cleanName = customerName.trim();
    const cleanPhone = phone.replace(/\D/g, "");

    if (!cleanName || cleanName.length < 2)
      errors.push("اسم العميل يجب أن يكون حرفين على الأقل.");
    if (cleanPhone && !/^01[0125]\d{8}$/.test(cleanPhone))
      errors.push(
        "رقم الموبايل يجب أن يكون 11 رقماً مصرياً صحيحاً ويبدأ بـ 010 أو 011 أو 012 أو 015.",
      );
    if (!date) errors.push("اختر تاريخ الحجز.");
    if (startTime && endTime && !isValidTimeRange(startTime, endTime))
      errors.push("وقت النهاية يجب أن يختلف عن وقت البداية.");
    if (separateSchedules)
      bookingTypes.forEach((type) => {
        const schedule = typeSchedules[type] || { date, startTime, endTime };
        if (!schedule.date || !schedule.startTime || !schedule.endTime)
          errors.push(`أكمل تاريخ ووقت ${type}.`);
        else if (!isValidTimeRange(schedule.startTime, schedule.endTime))
          errors.push(`وقت نهاية ${type} يجب أن يختلف عن وقت البداية.`);
      });
    if (!Number.isFinite(price) || price < 0)
      errors.push("سعر الحجز يجب أن يكون رقماً موجباً.");
    if (hasDeposit && (!Number.isFinite(depositAmount) || depositAmount < 0))
      errors.push("مبلغ العربون لا يمكن أن يكون أقل من صفر.");
    if (hasDeposit && depositAmount > price)
      errors.push("مبلغ العربون لا يمكن أن يزيد عن سعر الحجز.");
    if (mapUrl.trim()) {
      try {
        const parsed = new URL(mapUrl.trim());
        if (!["http:", "https:"].includes(parsed.protocol)) throw new Error();
      } catch {
        errors.push("رابط الموقع غير صحيح؛ استخدم رابطاً يبدأ بـ https://");
      }
    }
    if (printOptions.photoCards && printOptions.photoCardsCount < 1)
      errors.push("أدخل عدداً صحيحاً لصور الكروت.");
    if (addons.some((item) => !item.name.trim())) errors.push("اكتب اسم كل إضافة أو احذف الصف الفارغ.");
    if (customPrintItems.some((item) => !item.name.trim())) errors.push("اكتب اسم كل منتج طباعة مخصص أو احذف الصف الفارغ.");
    if (expenses.some((item) => !item.name.trim())) errors.push("اكتب اسم كل مصروف أو احذف الصف الفارغ.");
    if (errors.length) {
      setValidationErrors(errors);
      return;
    }
    setValidationErrors([]);
    let receiptUrl = depositReceiptUrl;
    if (depositReceiptFile) {
      try {
        setIsUploadingReceipt(true);
        receiptUrl = await storageApi.uploadDepositReceipt(depositReceiptFile);
      } catch (error) {
        setValidationErrors([error instanceof Error ? error.message : "تعذر رفع صورة العربون."]);
        setIsUploadingReceipt(false);
        return;
      }
    }
    await onSave({
      title: `${bookingTypes.join(" + ")} - ${cleanName}`,
      customerName: cleanName,
      phone: cleanPhone,
      whatsapp: cleanPhone,
      bookingTypes,
      typeSchedules:separateSchedules?bookingTypes.map(type=>({type,...(typeSchedules[type]||{date,startTime,endTime})})):[],
      date,
      startTime,
      endTime,
      location: location.trim(),
      mapUrl: mapUrl.trim(),
      notes: notes.trim(),
      price,
      hasDeposit,
      depositAmount: hasDeposit ? depositAmount : 0,
      depositReceiptUrl: hasDeposit ? receiptUrl : "",
      addons,
      expenses,
      hasPrint,
      printOptions,
      customPrintItems,
      printStatus,
      reminder,
      customReminderText,
      assignedUserIds,
      status,
    });
    setIsUploadingReceipt(false);
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
      setTypeSchedules({...typeSchedules,[type]:{date,startTime,endTime}});
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
                {mode === "create"
                  ? "إضافة حجز جديد"
                  : mode === "edit"
                    ? "تعديل تفاصيل الحجز"
                    : "عرض تفاصيل الحجز"}
              </h2>
              <p className="text-xs text-slate-400">
                {mode === "create"
                  ? "أدخل بيانات الحجز والطباعة والحسابات الماليه"
                  : initialBooking?.title || customerName}
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
        <form
          onSubmit={handleSubmit}
          className="p-6 pb-0 overflow-y-auto space-y-6 flex-1 text-right relative isolate"
        >
          {validationErrors.length > 0 && (
            <div
              className="bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl p-4"
              role="alert"
            >
              <p className="text-sm font-black mb-2">راجع البيانات التالية:</p>
              <ul className="list-disc list-inside space-y-1 text-xs font-semibold">
                {validationErrors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            </div>
          )}
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
                    minLength={2}
                    maxLength={100}
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
                    type="tel"
                    inputMode="numeric"
                    pattern="01[0125][0-9]{8}"
                    maxLength={11}
                    required
                    disabled={!canEditPhone}
                    value={phone}
                    onChange={(e) =>
                      setPhone(e.target.value.replace(/\D/g, "").slice(0, 11))
                    }
                    placeholder="مثال: 01012345678"
                    className="w-full text-sm bg-white p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 disabled:bg-slate-100 disabled:text-slate-500 dir-ltr text-right"
                  />
                </div>
              ) : (
                <div className="bg-slate-100 p-2.5 rounded-xl text-xs text-slate-400 font-bold flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5" /> الهاتف محمي
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
                              ? "bg-amber-500 text-slate-950 border-amber-600 shadow-sm"
                              : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
                          } disabled:opacity-60 cursor-pointer`}
                        >
                          {isSelected ? "✓ " : ""} {t}
                        </button>
                      );
                    })}
                  </div>
                  {bookingTypes.length > 1 && <label className="mt-3 flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs font-bold text-blue-900"><input type="checkbox" checked={separateSchedules} onChange={e=>setSeparateSchedules(e.target.checked)} className="w-4 h-4"/><span>الأنواع في أيام أو أوقات مختلفة</span></label>}
                  {separateSchedules && <div className="mt-3 grid gap-3">{bookingTypes.map(type=>{const schedule=typeSchedules[type]||{date,startTime,endTime};return <div key={type} className="bg-white border border-slate-200 rounded-xl p-3"><strong className="text-xs text-blue-700 block mb-2">موعد {type}</strong><div className="grid grid-cols-1 sm:grid-cols-3 gap-2"><input aria-label={`تاريخ ${type}`} required type="date" value={schedule.date} onChange={e=>setTypeSchedules({...typeSchedules,[type]:{...schedule,date:e.target.value}})} className="p-2 border rounded-lg text-xs"/><input aria-label={`بداية ${type}`} required type="time" value={schedule.startTime} onChange={e=>setTypeSchedules({...typeSchedules,[type]:{...schedule,startTime:e.target.value}})} className="p-2 border rounded-lg text-xs"/><input aria-label={`نهاية ${type}`} required type="time" value={schedule.endTime} onChange={e=>setTypeSchedules({...typeSchedules,[type]:{...schedule,endTime:e.target.value}})} className="p-2 border rounded-lg text-xs"/></div></div>})}</div>}
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
                      required
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
                      required
                      disabled={!canEditTime}
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full text-sm bg-white p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 disabled:bg-slate-100 disabled:text-slate-500"
                    />
                  </div>
                  {startTime && endTime && endTime < startTime && (
                    <p className="col-span-2 flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-2 text-[11px] font-bold text-blue-700">
                      <Clock className="h-3.5 w-3.5" /> ينتهي صباح اليوم التالي، وسيظل الحجز محسوبًا ضمن تاريخ بدايته.
                    </p>
                  )}
                </div>
              )}

              {/* Location */}
              {canViewLocation && (
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    مكان السيشن أو القاعة
                  </label>
                  <input
                    type="text"
                    disabled={!canEditLocation}
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="مثال: قاعة اللوتس أو موقع السيشن"
                    className="w-full text-sm bg-white p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 disabled:bg-slate-100 disabled:text-slate-500"
                  />
                </div>
              )}
            </div>
          </div>

          {canViewAddons && (
            <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-4 sm:p-5 space-y-4">
              <div className="flex items-center justify-between gap-3 border-b border-blue-200 pb-3">
                <div><h3 className="flex items-center gap-2 text-sm font-extrabold text-blue-950"><PackagePlus className="h-4 w-4 text-blue-600" /> إضافات الحجز المرنة</h3><p className="mt-1 text-[11px] text-blue-700/70">مثل برومو، مصور إضافي أو درون — اكتب أي اسم تريده.</p></div>
                {canEditAddons && <button type="button" onClick={() => setAddons([...addons,{id:crypto.randomUUID(),name:'',quantity:1,unitPrice:0}])} className="shrink-0 flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-2 text-xs font-black text-white"><Plus className="h-4 w-4" /> إضافة</button>}
              </div>
              <div className="space-y-3">{addons.map((item,index)=><div key={item.id} className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_100px_150px_auto] items-end gap-2 rounded-xl border border-blue-100 bg-white p-3"><label className="min-w-0"><span className="mb-1 block text-[10px] font-black text-slate-600">اسم الإضافة</span><input aria-label="اسم الإضافة" disabled={!canEditAddons} value={item.name} onChange={e=>setAddons(addons.map((x,i)=>i===index?{...x,name:e.target.value}:x))} placeholder="مثال: درون أو مصور إضافي" className="w-full min-w-0 rounded-lg border border-slate-200 p-2.5 text-xs"/></label><label><span className="mb-1 block text-[10px] font-black text-slate-600">الكمية</span><input aria-label="الكمية" disabled={!canEditAddons} type="number" min="1" value={item.quantity} onChange={e=>setAddons(addons.map((x,i)=>i===index?{...x,quantity:Math.max(1,Number(e.target.value)||1)}:x))} placeholder="1" className="w-full rounded-lg border border-slate-200 p-2.5 text-xs"/></label><label><span className="mb-1 block text-[10px] font-black text-slate-600">سعر الإضافة للعميل</span><input aria-label="سعر الإضافة للعميل" disabled={!canEditAddons} type="number" min="0" value={item.unitPrice} onChange={e=>setAddons(addons.map((x,i)=>i===index?{...x,unitPrice:Math.max(0,Number(e.target.value)||0)}:x))} placeholder="مثال: 1500 جنيه" className="w-full rounded-lg border border-slate-200 p-2.5 text-xs"/></label>{canEditAddons&&<button type="button" title="حذف الإضافة" aria-label="حذف الإضافة" onClick={()=>setAddons(addons.filter((_,i)=>i!==index))} className="h-10 rounded-lg p-2 text-rose-500 hover:bg-rose-50"><Trash2 className="h-4 w-4" /></button>}</div>)}</div>
              {!addons.length&&<p className="rounded-xl border border-dashed border-blue-200 bg-white/60 p-4 text-center text-xs text-slate-400">لا توجد إضافات — يمكنك إنشاء أي إضافة بالاسم الذي يناسب شغلك.</p>}
              {!!addons.length&&<div className="text-left text-xs font-black text-blue-900">قيمة الإضافات المسجلة: {formatCurrency(addons.reduce((sum,x)=>sum+x.quantity*x.unitPrice,0))}</div>}
              <p className="text-[10px] text-slate-500">إجمالي الاتفاق المالي أدناه هو الرقم النهائي مع العميل؛ تأكد أنه يتضمن الإضافات المدفوعة.</p>
            </div>
          )}

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
                      سعر الحجز الإجمالي (جنيه){" "}
                      <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="number"
                      min={0}
                      step="1"
                      required
                      disabled={!canEditPrice}
                      value={price}
                      onChange={(e) =>
                        setPrice(
                          Math.max(0, Math.trunc(Number(e.target.value))),
                        )
                      }
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
                      max={price}
                      step="1"
                      required
                      disabled={!canEditDeposit}
                      value={depositAmount}
                      onChange={(e) =>
                        setDepositAmount(
                          Math.max(0, Math.trunc(Number(e.target.value))),
                        )
                      }
                      placeholder="يمكن إدخال 0"
                      className="w-full text-sm font-bold text-emerald-400 bg-slate-800 p-2.5 rounded-lg border border-slate-700 focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    />
                  </div>
                )}

                {canViewDeposit && hasDeposit && (
                  <div className="sm:col-span-2 rounded-xl border border-slate-700 bg-slate-800/70 p-3 space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-200 mb-1">
                        صورة إثبات دفع العربون <span className="text-slate-500">(اختياري)</span>
                      </label>
                      <p className="text-[10px] text-slate-400">PNG أو JPG أو WEBP، بحد أقصى 5 ميجابايت.</p>
                    </div>
                    {depositReceiptPreview && (
                      <a href={depositReceiptPreview} target="_blank" rel="noreferrer" className="block w-fit">
                        <img src={depositReceiptPreview} alt="إثبات دفع العربون" className="h-32 max-w-full rounded-lg border border-slate-600 object-contain bg-slate-900" />
                      </a>
                    )}
                    {!isViewOnly && (
                      <div className="flex flex-wrap items-center gap-2">
                        <label className="cursor-pointer rounded-lg bg-blue-600 hover:bg-blue-700 px-3 py-2 text-xs font-bold text-white transition-colors">
                          {depositReceiptPreview ? "استبدال الصورة" : "رفع صورة"}
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) {
                                setValidationErrors(["اختر صورة PNG أو JPG أو WEBP لا يزيد حجمها عن 5 ميجابايت."]);
                                e.target.value = "";
                                return;
                              }
                              setDepositReceiptFile(file);
                              const reader = new FileReader();
                              reader.onload = () => setDepositReceiptPreview(String(reader.result || ""));
                              reader.readAsDataURL(file);
                            }}
                          />
                        </label>
                        {depositReceiptPreview && (
                          <button type="button" onClick={() => { setDepositReceiptFile(null); setDepositReceiptUrl(""); setDepositReceiptPreview(""); }} className="rounded-lg bg-rose-500/10 border border-rose-500/30 px-3 py-2 text-xs font-bold text-rose-300">
                            حذف الصورة
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Automatic Calculation Results Box */}
              <div className="bg-slate-800/80 p-4 rounded-lg border border-slate-700 space-y-2 relative z-10">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  الملخص المالي التلقائي:
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
                  <div>
                    سعر الحجز:{" "}
                    <strong className="font-bold text-white">
                      {formatCurrency(price)}
                    </strong>
                  </div>
                  <div>
                    المدفوع:{" "}
                    <strong className="font-bold text-emerald-400">
                      {formatCurrency(paid)}
                    </strong>
                  </div>
                  <div className="bg-slate-900 text-amber-400 border border-slate-700 px-3 py-1 rounded-lg">
                    المتبقي:{" "}
                    <strong className="font-bold text-base">
                      {formatCurrency(remaining)}
                    </strong>
                  </div>
                </div>

                <div className="text-xs font-bold text-slate-300 pt-1 flex items-center gap-2">
                  <span>حالة الدفع:</span>
                  <span
                    className={`px-2.5 py-0.5 rounded text-xs font-bold uppercase ${
                      paymentStatus === "مدفوع بالكامل"
                        ? "bg-emerald-900/60 text-emerald-300 border border-emerald-700"
                        : paymentStatus === "دفع جزء"
                          ? "bg-amber-900/60 text-amber-300 border border-amber-700"
                          : "bg-red-900/60 text-red-300 border border-red-700"
                    }`}
                  >
                    {paymentStatus}
                  </span>
                </div>
              </div>
            </div>
          )}

          {canViewExpenses && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50/60 p-4 sm:p-5 space-y-4">
              <div className="flex items-center justify-between gap-3 border-b border-rose-200 pb-3"><div><h3 className="flex items-center gap-2 text-sm font-extrabold text-rose-950"><ReceiptText className="h-4 w-4 text-rose-600" /> المصاريف الداخلية</h3><p className="mt-1 text-[11px] text-rose-700/70">خاصة بالإدارة: مصور خارجي، طباعة، مواصلات أو أي تكلفة أخرى.</p></div>{canEditExpenses&&<button type="button" onClick={()=>setExpenses([...expenses,{id:crypto.randomUUID(),name:'',amount:0}])} className="shrink-0 flex items-center gap-1 rounded-lg bg-rose-600 px-3 py-2 text-xs font-black text-white"><Plus className="h-4 w-4" /> مصروف</button>}</div>
              <div className="space-y-2">{expenses.map((item,index)=><div key={item.id} className="grid grid-cols-[1fr_120px_auto] gap-2 rounded-xl border border-rose-100 bg-white p-2"><input disabled={!canEditExpenses} value={item.name} onChange={e=>setExpenses(expenses.map((x,i)=>i===index?{...x,name:e.target.value}:x))} placeholder="اسم المصروف" className="min-w-0 rounded-lg border border-slate-200 p-2 text-xs"/><input disabled={!canEditExpenses} type="number" min="0" value={item.amount} onChange={e=>setExpenses(expenses.map((x,i)=>i===index?{...x,amount:Math.max(0,Number(e.target.value)||0)}:x))} placeholder="المبلغ" className="rounded-lg border border-slate-200 p-2 text-xs"/>{canEditExpenses&&<button type="button" onClick={()=>setExpenses(expenses.filter((_,i)=>i!==index))} className="rounded-lg p-2 text-rose-500 hover:bg-rose-50"><Trash2 className="h-4 w-4" /></button>}</div>)}</div>
              <div className="grid grid-cols-2 gap-2"><div className="rounded-xl bg-white p-3"><small className="text-slate-400">إجمالي المصروفات</small><b className="block text-rose-600">{formatCurrency(expenses.reduce((sum,x)=>sum+x.amount,0))}</b></div><div className="rounded-xl bg-slate-900 p-3 text-white"><small className="text-slate-400">صافي الربح المتوقع</small><b className="block text-emerald-400">{formatCurrency(Math.max(0,price-expenses.reduce((sum,x)=>sum+x.amount,0)))}</b></div></div>
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
                          setPrintOptions({
                            ...printOptions,
                            largeCanvas: e.target.checked,
                          })
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
                          setPrintOptions({
                            ...printOptions,
                            smallCanvas: e.target.checked,
                          })
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
                          setPrintOptions({
                            ...printOptions,
                            album30x45: e.target.checked,
                          })
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
                          setPrintOptions({
                            ...printOptions,
                            album30x60: e.target.checked,
                          })
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
                          setPrintOptions({
                            ...printOptions,
                            photoCards: e.target.checked,
                          })
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
                        step="1"
                        required
                        disabled={!canEditPrint}
                        value={printOptions.photoCardsCount || ""}
                        onChange={(e) =>
                          setPrintOptions({
                            ...printOptions,
                            photoCardsCount: Math.max(
                              0,
                              Math.trunc(Number(e.target.value)),
                            ),
                          })
                        }
                        placeholder="مثال: 50"
                        className="w-full text-sm bg-white p-2 rounded-xl border border-indigo-300 font-bold"
                      />
                    </div>
                  )}

                  <div className="border-t border-indigo-100 pt-4 space-y-3">
                    <div className="flex items-center justify-between gap-3"><div><b className="block text-xs text-indigo-950">منتجات وتسليمات مخصصة</b><span className="text-[10px] text-slate-500">مثال: 30×80، بوكس خشب، ألبوم بمقاس خاص.</span></div>{canEditPrint&&<button type="button" onClick={()=>setCustomPrintItems([...customPrintItems,{id:crypto.randomUUID(),name:'',quantity:1,unitPrice:0}])} className="flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-black text-white"><Plus className="h-4 w-4" /> منتج</button>}</div>
                    {customPrintItems.map((item,index)=><div key={item.id} className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_100px_150px_auto] items-end gap-2 rounded-xl border border-indigo-100 bg-indigo-50/40 p-3"><label className="min-w-0"><span className="mb-1 block text-[10px] font-black text-slate-600">اسم أو مقاس المنتج</span><input aria-label="اسم أو مقاس المنتج" disabled={!canEditPrint} value={item.name} onChange={e=>setCustomPrintItems(customPrintItems.map((x,i)=>i===index?{...x,name:e.target.value}:x))} placeholder="مثال: بوكس خشب أو تابلوه 30×80" className="w-full min-w-0 rounded-lg border border-indigo-200 bg-white p-2.5 text-xs"/></label><label><span className="mb-1 block text-[10px] font-black text-slate-600">الكمية</span><input aria-label="كمية المنتج" disabled={!canEditPrint} type="number" min="1" value={item.quantity} onChange={e=>setCustomPrintItems(customPrintItems.map((x,i)=>i===index?{...x,quantity:Math.max(1,Number(e.target.value)||1)}:x))} placeholder="1" className="w-full rounded-lg border border-indigo-200 bg-white p-2.5 text-xs"/></label><label><span className="mb-1 block text-[10px] font-black text-slate-600">تكلفة المنتج عليك</span><input aria-label="تكلفة المنتج الداخلية" disabled={!canEditPrint} type="number" min="0" value={item.unitPrice} onChange={e=>setCustomPrintItems(customPrintItems.map((x,i)=>i===index?{...x,unitPrice:Math.max(0,Number(e.target.value)||0)}:x))} placeholder="مثال: 500 جنيه" className="w-full rounded-lg border border-indigo-200 bg-white p-2.5 text-xs"/></label>{canEditPrint&&<button type="button" title="حذف المنتج" aria-label="حذف المنتج" onClick={()=>setCustomPrintItems(customPrintItems.filter((_,i)=>i!==index))} className="h-10 rounded-lg p-2 text-rose-500 hover:bg-rose-50"><Trash2 className="h-4 w-4" /></button>}</div>)}
                    {!!customPrintItems.length && <p className="text-[10px] text-slate-500">تكلفة المنتج هنا مصروف داخلي عليك وليست السعر الذي يدفعه العميل.</p>}
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
                    موعد التذكير:
                  </label>
                  <select
                    disabled={!canEditReminder}
                    value={reminder}
                    onChange={(e) =>
                      setReminder(e.target.value as ReminderOption)
                    }
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

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  حالة الحجز الكلية (تلقائياً):
                </label>
                <div className={`w-full text-sm font-black p-2.5 rounded-xl border ${remaining === 0 && price > 0 ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-amber-50 border-amber-200 text-amber-700"}`}>
                  {remaining === 0 && price > 0
                    ? "مدفوع بالكامل"
                    : `لسه باقي ${formatCurrency(remaining)}`}
                </div>
              </div>

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
                              ? "bg-amber-50 border-amber-400 text-amber-950 font-bold"
                              : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"
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
                              <div className="text-[10px] text-slate-400">
                                {u.role}
                              </div>
                            </div>
                          </div>
                          {isAssigned && (
                            <CheckCircle2 className="w-4 h-4 text-amber-600" />
                          )}
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
            <div className="sticky bottom-0 z-50 isolate -mx-6 mt-8 px-4 sm:px-6 py-4 border-t border-slate-200 bg-white/98 backdrop-blur-md shadow-[0_-14px_30px_-18px_rgba(15,23,42,0.45)] flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="relative z-10 px-5 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-700 font-semibold text-sm hover:bg-slate-100 transition-colors cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={isUploadingReceipt}
                className="relative z-10 flex items-center gap-2 px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-sm transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-wait"
              >
                <Save className="w-4 h-4" />
                <span>{isUploadingReceipt ? "جاري رفع الصورة..." : "حفظ بيانات الحجز"}</span>
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
