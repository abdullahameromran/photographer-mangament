import React, { useState } from 'react';
import { Booking, User, BookingType } from '../types';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  MapPin,
  Phone,
  MessageCircle,
  Filter,
  UserCheck,
  CheckCircle2,
  X,
  Search,
} from 'lucide-react';
import { canViewField, getPhoneUrl, getWhatsAppUrl } from '../utils/permissions';

interface CalendarViewProps {
  bookings: Booking[];
  currentUser: User;
  allUsers: User[];
  onEditBooking: (booking: Booking) => void;
  onOpenCreateModalWithDate: (date: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  bookings,
  currentUser,
  allUsers,
  onEditBooking,
  onOpenCreateModalWithDate,
}) => {
  // Calendar state: Current Year & Month (0-indexed: 0=Jan, 7=Aug)
  const today = new Date();
  // Default to August 2026 if current year is not 2026, or use active dates from bookings
  const defaultYear = bookings.some((b) => b.date.startsWith('2026-08')) ? 2026 : today.getFullYear();
  const defaultMonth = bookings.some((b) => b.date.startsWith('2026-08')) ? 7 : today.getMonth();

  const [currentYear, setCurrentYear] = useState<number>(defaultYear);
  const [currentMonth, setCurrentMonth] = useState<number>(defaultMonth); // 0 = Jan, 7 = Aug

  // Selected Date for detail drawer
  const [selectedDate, setSelectedDate] = useState<string | null>('2026-08-12');

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Month Names in Arabic
  const monthNamesArabic = [
    'يناير',
    'فبراير',
    'مارس',
    'أبريل',
    'مايو',
    'يونيو',
    'يوليو',
    'أغسطس',
    'سبتمبر',
    'أكتوبر',
    'نوفمبر',
    'ديسمبر',
  ];

  const arabicDayNames = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

  // Navigate Months
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((prev) => prev - 1);
    } else {
      setCurrentMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((prev) => prev + 1);
    } else {
      setCurrentMonth((prev) => prev + 1);
    }
  };

  const handleGoToday = () => {
    setCurrentYear(defaultYear);
    setCurrentMonth(defaultMonth);
    setSelectedDate('2026-08-12');
  };

  // Filter Bookings
  const filteredBookings = bookings.filter((b) => {
    const matchesSearch =
      !searchQuery ||
      b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.phone.includes(searchQuery);

    const matchesType = typeFilter === 'all' || b.bookingTypes.includes(typeFilter as BookingType);
    const matchesStatus = statusFilter === 'all' || b.status === statusFilter;

    return matchesSearch && matchesType && matchesStatus;
  });

  // Calculate days matrix for current month
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Sunday
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

  // Create grid cells (42 total: 6 weeks)
  const calendarCells = [];

  // Previous month padding days
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    const dayNum = daysInPrevMonth - i;
    const prevMonthIdx = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYearNum = currentMonth === 0 ? currentYear - 1 : currentYear;
    const formattedDate = `${prevYearNum}-${String(prevMonthIdx + 1).padStart(2, '0')}-${String(
      dayNum
    ).padStart(2, '0')}`;

    calendarCells.push({
      dayNum,
      formattedDate,
      isCurrentMonth: false,
    });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const formattedDate = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(
      d
    ).padStart(2, '0')}`;

    calendarCells.push({
      dayNum: d,
      formattedDate,
      isCurrentMonth: true,
    });
  }

  // Next month padding days to complete 35 or 42 cells
  const remainingCells = (42 - calendarCells.length) % 7 === 0 ? 0 : 42 - calendarCells.length;
  for (let n = 1; n <= remainingCells; n++) {
    const nextMonthIdx = currentMonth === 11 ? 0 : currentMonth + 1;
    const nextYearNum = currentMonth === 11 ? currentYear + 1 : currentYear;
    const formattedDate = `${nextYearNum}-${String(nextMonthIdx + 1).padStart(2, '0')}-${String(
      n
    ).padStart(2, '0')}`;

    calendarCells.push({
      dayNum: n,
      formattedDate,
      isCurrentMonth: false,
    });
  }

  // Selected date bookings
  const selectedDateBookings = selectedDate
    ? filteredBookings
        .filter((b) => b.date === selectedDate)
        .sort((a, b) => a.startTime.localeCompare(b.startTime))
    : [];

  const canViewPrice = canViewField(currentUser, 'price');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }).format(
      amount
    );
  };

  return (
    <div className="space-y-6">
      {/* Calendar Header Control Bar */}
      <div className="w-full min-w-0 overflow-hidden bg-slate-900 text-white rounded-xl p-4 sm:p-6 shadow-md border border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 shrink-0 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold">
            <CalendarIcon className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base sm:text-2xl font-bold font-tajawal leading-tight">تقويم الحجوزات والمواعيد</h2>
            <p className="text-xs text-slate-400">
              عرض شهري تفصيلي تفاعلي لجميع جلسات التصوير والفعاليات
            </p>
          </div>
        </div>

        {/* Month Navigation */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 sm:gap-3 w-full md:w-auto md:justify-end">
          <button
            onClick={handleGoToday}
            className="order-2 sm:order-none w-full sm:w-auto px-3 py-2.5 sm:py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg border border-slate-700 transition-colors cursor-pointer"
          >
            الشهر الحالي
          </button>

          <div className="col-span-2 order-1 sm:order-none flex min-w-0 items-center justify-between gap-1 sm:gap-2 bg-slate-800/90 p-1.5 rounded-xl border border-slate-700/80">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
              title="الشهر السابق"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            <span className="text-sm font-bold font-tajawal min-w-0 sm:min-w-[120px] flex-1 text-center text-blue-300 whitespace-nowrap">
              {monthNamesArabic[currentMonth]} {currentYear}
            </span>

            <button
              onClick={handleNextMonth}
              className="p-1.5 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
              title="الشهر التالي"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>

          <button
            onClick={() => onOpenCreateModalWithDate(selectedDate || '2026-08-12')}
            className="order-3 sm:order-none w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-3 sm:px-4 py-2.5 rounded-lg shadow-sm transition-colors cursor-pointer min-w-0"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>حجز جديد</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="بحث باسم العميل، الهاتف، أو عنوان الحجز..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-3 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Type Filter */}
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-blue-500 font-semibold"
        >
          <option value="all">كل أنواع الحجوزات</option>
          <option value="سيشن">سيشن</option>
          <option value="كتب كتاب">كتب كتاب</option>
          <option value="حنة">حنة</option>
          <option value="شبكة">شبكة</option>
          <option value="Wedding">زفاف (Wedding)</option>
          <option value="قاعة">قاعة</option>
          <option value="بارتي">بارتي</option>
        </select>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-blue-500 font-semibold"
        >
          <option value="all">كل الحالات</option>
          <option value="مؤكد">مؤكد</option>
          <option value="قادم">قادم</option>
          <option value="تم التصوير">تم التصوير</option>
          <option value="في انتظار العربون">في انتظار العربون</option>
          <option value="جديد">جديد</option>
        </select>
      </div>

      {/* Main Calendar Grid & Detail Panel Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* The 7-Column Calendar Grid (Takes 3 columns on large screens) */}
        <div className="lg:col-span-3 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          {/* Day Names Header */}
          <div className="grid grid-cols-7 bg-slate-900 text-slate-200 text-xs font-bold text-center border-b border-slate-800 py-3">
            {arabicDayNames.map((dayName) => (
              <div key={dayName} className="truncate px-1">
                {dayName}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 auto-rows-fr gap-px bg-slate-200 min-h-[500px]">
            {calendarCells.map((cell, idx) => {
              const dayBookings = filteredBookings.filter((b) => b.date === cell.formattedDate);
              const isSelected = selectedDate === cell.formattedDate;
              const isToday = cell.formattedDate === '2026-08-12';

              return (
                <div
                  key={`${cell.formattedDate}-${idx}`}
                  onClick={() => setSelectedDate(cell.formattedDate)}
                  className={`min-h-[90px] sm:min-h-[110px] p-1.5 sm:p-2 flex flex-col justify-between transition-colors cursor-pointer relative ${
                    !cell.isCurrentMonth
                      ? 'bg-slate-50/60 text-slate-400'
                      : isSelected
                      ? 'bg-blue-50/90 ring-2 ring-blue-500 z-10'
                      : 'bg-white hover:bg-slate-50 text-slate-800'
                  }`}
                >
                  {/* Top Cell Bar: Day Number & Badge */}
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                        isToday
                          ? 'bg-blue-600 text-white font-extrabold shadow-sm'
                          : isSelected
                          ? 'bg-blue-200 text-blue-900 font-bold'
                          : cell.isCurrentMonth
                          ? 'text-slate-800'
                          : 'text-slate-400'
                      }`}
                    >
                      {cell.dayNum}
                    </span>

                    {dayBookings.length > 0 && (
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-slate-900 text-amber-300">
                        {dayBookings.length}
                      </span>
                    )}
                  </div>

                  {/* Booking Chips inside Day Cell */}
                  <div className="space-y-1 overflow-y-auto max-h-[75px] no-scrollbar">
                    {dayBookings.slice(0, 3).map((b) => (
                      <div
                        key={b.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditBooking(b);
                        }}
                        className={`text-[10px] p-1 rounded font-semibold truncate border transition-transform hover:scale-[1.02] ${
                          b.status === 'مؤكد'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : b.status === 'تم التصوير'
                            ? 'bg-slate-800 text-slate-100 border-slate-700'
                            : 'bg-blue-50 text-blue-800 border-blue-200'
                        }`}
                        title={`${b.startTime} - ${b.title}`}
                      >
                        <span className="font-mono text-[9px] opacity-75">{b.startTime}</span> {b.title}
                      </div>
                    ))}

                    {dayBookings.length > 3 && (
                      <div className="text-[9px] font-bold text-slate-500 text-center">
                        +{dayBookings.length - 3} حجوزات أخرى
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Day Details Panel (Takes 1 column) */}
        <div className="lg:col-span-1 bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between space-y-4">
          <div>
            {/* Selected Date Header */}
            <div className="pb-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-400">اليوم المحدد:</span>
                <h3 className="text-lg font-bold font-tajawal text-slate-900">
                  {selectedDate || 'اختر يوماً من التقويم'}
                </h3>
              </div>

              {selectedDate && (
                <button
                  onClick={() => onOpenCreateModalWithDate(selectedDate)}
                  className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors cursor-pointer"
                  title="إضافة حجز في هذا اليوم"
                >
                  <Plus className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Bookings List for Selected Date */}
            {!selectedDate ? (
              <div className="text-center py-10 text-slate-400 text-xs">
                اضغط على أي يوم في التقويم لعرض تفاصيل الجلسات المقررة.
              </div>
            ) : selectedDateBookings.length === 0 ? (
              <div className="text-center py-10 space-y-3">
                <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <CalendarIcon className="w-5 h-5" />
                </div>
                <p className="text-xs text-slate-500 font-semibold">لا يوجد أي حجز مسجل في هذا التاريخ</p>
                <button
                  onClick={() => onOpenCreateModalWithDate(selectedDate)}
                  className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-3.5 py-2 rounded-lg transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة حجز جديد</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3 mt-4 max-h-[500px] overflow-y-auto no-scrollbar">
                {selectedDateBookings.map((b) => (
                  <div
                    key={b.id}
                    onClick={() => onEditBooking(b)}
                    className="bg-slate-50 hover:bg-slate-100 p-3.5 rounded-xl border border-slate-200 transition-all cursor-pointer space-y-2 group"
                  >
                    <div className="flex items-start justify-between">
                      <h4 className="font-bold text-xs text-slate-900 group-hover:text-blue-600 transition-colors font-tajawal">
                        {b.title}
                      </h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-900 text-amber-300">
                        {b.startTime}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-600 space-y-1">
                      <div className="flex items-center justify-between gap-2"><span className="truncate">العميل: {b.customerName}</span><span className="dir-ltr text-slate-400 shrink-0">{b.phone}</span></div>

                      <div className="flex items-center gap-1 text-slate-500 truncate">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{b.location}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
                      <a href={getPhoneUrl(b.phone)} className="flex items-center justify-center gap-1.5 py-2 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-[11px] font-black hover:bg-blue-100 transition-colors"><Phone className="w-3.5 h-3.5"/> اتصال</a>
                      <a href={getWhatsAppUrl(b.whatsapp || b.phone, `مرحباً ${b.customerName}، بخصوص حجز ${b.title}`)} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-1.5 py-2 rounded-lg bg-emerald-500 text-white text-[11px] font-black hover:bg-emerald-600 transition-colors"><MessageCircle className="w-3.5 h-3.5"/> واتساب</a>
                    </div>

                    {canViewPrice && (
                      <div className="text-[10px] pt-1.5 border-t border-slate-200/80 flex items-center justify-between text-slate-700 font-semibold">
                        <span>السعر: {formatCurrency(b.price)}</span>
                        <span className="text-emerald-700">مدفوع: {formatCurrency(b.depositAmount || 0)}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
