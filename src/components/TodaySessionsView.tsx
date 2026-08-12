import React, { useState } from 'react';
import { Booking, User } from '../types';
import {
  Calendar,
  Clock,
  MapPin,
  Phone,
  MessageCircle,
  UserCheck,
  CheckCircle2,
  DollarSign,
  Printer,
  ChevronLeft,
  ChevronRight,
  Plus,
  Edit,
  Sparkles,
  CalendarDays,
  ExternalLink,
} from 'lucide-react';
import { canViewField, canPerformAction } from '../utils/permissions';

interface TodaySessionsViewProps {
  bookings: Booking[];
  currentUser: User;
  allUsers: User[];
  onEditBooking: (booking: Booking) => void;
  onOpenCreateModalWithDate: (date: string) => void;
  onStatusChange: (bookingId: string, newStatus: Booking['status']) => void;
}

export const TodaySessionsView: React.FC<TodaySessionsViewProps> = ({
  bookings,
  currentUser,
  allUsers,
  onEditBooking,
  onOpenCreateModalWithDate,
  onStatusChange,
}) => {
  // Use 2026-08-12 as base date if today in real time has no bookings, or default to current date
  const todayObj = new Date();
  const todayStr = `${todayObj.getFullYear()}-${String(todayObj.getMonth() + 1).padStart(2, '0')}-${String(
    todayObj.getDate()
  ).padStart(2, '0')}`;

  // If initial dataset is anchored around 2026-08-12, let's use 2026-08-12 as default anchor if real date is far off, or let user pick anchor
  const defaultAnchor = bookings.some((b) => b.date === todayStr) ? todayStr : '2026-08-12';

  const [baseDateStr, setBaseDateStr] = useState<string>(defaultAnchor);
  const [selectedDayTab, setSelectedDayTab] = useState<number>(0); // 0 = Day 1 (Today), 1 = Day 2, 2 = Day 3, 3 = Day 4

  // Calculate the 4 consecutive days based on baseDateStr
  const getNextDays = (startDateStr: string) => {
    const dates: { dateStr: string; label: string; dayName: string; formatted: string }[] = [];
    const baseDate = new Date(startDateStr);

    const dayLabels = ['اليوم', 'غداً', 'بعد غد', 'اليوم الرابع'];
    const arabicDays = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

    for (let i = 0; i < 4; i++) {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() + i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const formattedDate = `${yyyy}-${mm}-${dd}`;
      const dayName = arabicDays[d.getDay()];
      const dateDisplay = `${d.getDate()} / ${d.getMonth() + 1}`;

      dates.push({
        dateStr: formattedDate,
        label: dayLabels[i],
        dayName,
        formatted: dateDisplay,
      });
    }
    return dates;
  };

  const daysList = getNextDays(baseDateStr);

  // Permissions
  const canViewPrice = canViewField(currentUser, 'price');
  const canViewDeposit = canViewField(currentUser, 'depositAmount');
  const canEditStatus = canPerformAction(currentUser, 'changeStatus');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }).format(
      amount
    );
  };

  // Shift anchor date backwards/forwards
  const shiftBaseDate = (days: number) => {
    const cur = new Date(baseDateStr);
    cur.setDate(cur.getDate() + days);
    const yyyy = cur.getFullYear();
    const mm = String(cur.getMonth() + 1).padStart(2, '0');
    const dd = String(cur.getDate()).padStart(2, '0');
    setBaseDateStr(`${yyyy}-${mm}-${dd}`);
  };

  const activeDayObj = daysList[selectedDayTab] || daysList[0];
  const activeDayBookings = bookings
    .filter((b) => b.date === activeDayObj.dateStr)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  // Quick Stats for Active Day
  const totalDayPrice = activeDayBookings.reduce((sum, b) => sum + (b.price || 0), 0);
  const totalDayPaid = activeDayBookings.reduce(
    (sum, b) => sum + (b.hasDeposit ? b.depositAmount || 0 : 0),
    0
  );
  const totalDayRemaining = totalDayPrice - totalDayPaid;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white rounded-xl p-6 sm:p-8 shadow-md relative overflow-hidden border border-slate-800">
        <div className="absolute left-0 top-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="w-2 h-6 bg-blue-600 rounded-full inline-block"></span>
              <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold">
                <CalendarDays className="w-5 h-5" />
              </div>
              <h2 className="text-2xl font-bold font-tajawal text-white">
                جدول جلسات اليوم والأيام الـ 3 القادمة
              </h2>
            </div>
            <p className="text-xs text-slate-400 max-w-xl">
              عرض تفصيلي وسريع لجميع المواعيد والسيشنات وجلسات التصوير المطلوبة اليوم وخلال الـ 72 ساعة القادمة مع أزرار التواصل المباشرة والتحديث الفوري.
            </p>
          </div>

          {/* Base Date Selector Controls */}
          <div className="flex items-center gap-2 bg-slate-800/90 p-2 rounded-xl border border-slate-700/80 shrink-0">
            <button
              onClick={() => shiftBaseDate(-1)}
              className="p-2 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
              title="اليوم السابق"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 px-2">
              <span className="text-xs font-bold text-slate-300">بدءًا من:</span>
              <input
                type="date"
                value={baseDateStr}
                onChange={(e) => setBaseDateStr(e.target.value)}
                className="bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-700 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              onClick={() => shiftBaseDate(1)}
              className="p-2 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
              title="اليوم التالي"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* 4 Days Selector Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {daysList.map((day, idx) => {
          const dayBookings = bookings.filter((b) => b.date === day.dateStr);
          const isSelected = selectedDayTab === idx;

          return (
            <button
              key={day.dateStr}
              onClick={() => setSelectedDayTab(idx)}
              className={`p-4 rounded-xl border transition-all text-right cursor-pointer relative overflow-hidden ${
                isSelected
                  ? 'bg-blue-600 text-white border-blue-500 shadow-md ring-2 ring-blue-400/40'
                  : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`text-xs font-bold uppercase tracking-wider ${
                    isSelected ? 'text-blue-100' : 'text-slate-400'
                  }`}
                >
                  {day.label}
                </span>
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    isSelected
                      ? 'bg-blue-700 text-white'
                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}
                >
                  {dayBookings.length} جلسة
                </span>
              </div>

              <div className="text-lg font-bold font-tajawal">
                {day.dayName} ({day.formatted})
              </div>

              <div
                className={`text-[10px] mt-1 font-semibold truncate ${
                  isSelected ? 'text-blue-100' : 'text-slate-500'
                }`}
              >
                {dayBookings.length > 0
                  ? dayBookings.map((b) => b.title).join(' • ')
                  : 'لا يوجد حجز مسجل'}
              </div>
            </button>
          );
        })}
      </div>

      {/* Daily Metrics Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              جدول يوم {activeDayObj.dayName} ({activeDayObj.dateStr})
            </h3>
            <p className="text-xs text-slate-500">
              إجمالي الحجوزات اليوم: <strong>{activeDayBookings.length} حجز</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          {canViewPrice && (
            <div className="bg-slate-900 text-white px-4 py-2 rounded-lg border border-slate-800 text-xs flex items-center gap-3">
              <div>
                إجمالي اليوم: <span className="font-bold text-emerald-400">{formatCurrency(totalDayPrice)}</span>
              </div>
              <div className="border-r border-slate-700 pr-3">
                المتبقي: <span className="font-bold text-amber-400">{formatCurrency(totalDayRemaining)}</span>
              </div>
            </div>
          )}

          <button
            onClick={() => onOpenCreateModalWithDate(activeDayObj.dateStr)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-4 py-2.5 rounded-lg shadow-sm transition-colors shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>إضافة حجز لهذا اليوم</span>
          </button>
        </div>
      </div>

      {/* Sessions List for Selected Day */}
      {activeDayBookings.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border border-slate-200 shadow-sm space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Calendar className="w-6 h-6" />
          </div>
          <h4 className="text-base font-bold text-slate-800">لا توجد سيشنات أو حجوزات مسجلة في هذا اليوم</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            يمكنك إضافة حجز جديد لهذا اليوم مباشرة بالضغط على زر الإضافة أعلاه.
          </p>
          <button
            onClick={() => onOpenCreateModalWithDate(activeDayObj.dateStr)}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-4 py-2.5 rounded-lg transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة حجز في {activeDayObj.dateStr}</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activeDayBookings.map((booking) => {
            // Get staff members assigned
            const assignedStaff = allUsers.filter((u) => booking.assignedUserIds.includes(u.id));

            return (
              <div
                key={booking.id}
                className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col justify-between space-y-4"
              >
                {/* Header: Title & Time Badge */}
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-4 bg-blue-600 rounded-full"></span>
                      <h4 className="font-bold text-base text-slate-900 font-tajawal">
                        {booking.title}
                      </h4>
                    </div>

                    <div className="bg-slate-900 text-amber-300 border border-slate-800 px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 shrink-0">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      <span>
                        {booking.startTime} - {booking.endTime}
                      </span>
                    </div>
                  </div>

                  {/* Types Badges */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {booking.bookingTypes.map((t) => (
                      <span
                        key={t}
                        className="bg-blue-50 text-blue-700 border border-blue-100 text-[11px] font-semibold px-2 py-0.5 rounded"
                      >
                        {t}
                      </span>
                    ))}
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                        booking.status === 'مؤكد'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : booking.status === 'تم التصوير'
                          ? 'bg-slate-800 text-white'
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {booking.status}
                    </span>
                  </div>

                  {/* Customer & Location Details */}
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/80 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-slate-800 font-semibold">
                      <span>العميل: {booking.customerName}</span>
                      <div className="flex items-center gap-2">
                        <a
                          href={`tel:${booking.phone}`}
                          className="p-1.5 bg-white hover:bg-slate-200 text-slate-700 rounded border border-slate-300 transition-colors flex items-center justify-center"
                          title="اتصال هاتفي"
                        >
                          <Phone className="w-3.5 h-3.5 text-blue-600" />
                        </a>
                        <a
                          href={`https://wa.me/${booking.whatsapp.replace('+', '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded transition-colors flex items-center justify-center"
                          title="مراسلة واتساب"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-slate-600">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{booking.location}</span>
                      {booking.mapUrl && (
                        <a
                          href={booking.mapUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 hover:underline flex items-center gap-1 text-[11px] shrink-0 font-bold"
                        >
                          <span>الخريطة</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Staff & Financial Summary */}
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  {/* Assigned Staff */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-bold">الفريق المسؤول:</span>
                    <div className="flex items-center gap-1.5">
                      {assignedStaff.length > 0 ? (
                        assignedStaff.map((staff) => (
                          <div
                            key={staff.id}
                            className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-[11px] font-semibold text-slate-700"
                          >
                            <img
                              src={staff.avatar}
                              alt={staff.name}
                              className="w-4 h-4 rounded-full object-cover"
                            />
                            <span>{staff.name.split(' ')[0]}</span>
                          </div>
                        ))
                      ) : (
                        <span className="text-slate-400 text-[11px]">غير محدد</span>
                      )}
                    </div>
                  </div>

                  {/* Financials (If viewable) */}
                  {canViewPrice && (
                    <div className="bg-slate-900 text-white p-3 rounded-lg text-xs flex items-center justify-between">
                      <div>
                        سعر الحجز: <strong className="text-white">{formatCurrency(booking.price)}</strong>
                      </div>
                      <div>
                        المدفوع: <strong className="text-emerald-400">{formatCurrency(booking.depositAmount || 0)}</strong>
                      </div>
                      <div className="bg-slate-800 text-amber-400 px-2 py-0.5 rounded font-bold">
                        المتبقي: {formatCurrency(booking.price - (booking.depositAmount || 0))}
                      </div>
                    </div>
                  )}

                  {/* Actions Bar */}
                  <div className="flex items-center justify-between pt-1">
                    {/* Quick status change */}
                    {canEditStatus && booking.status !== 'تم التصوير' && (
                      <button
                        onClick={() => onStatusChange(booking.id, 'تم التصوير')}
                        className="flex items-center gap-1.5 text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>تعليم "تم التصوير"</span>
                      </button>
                    )}

                    <button
                      onClick={() => onEditBooking(booking)}
                      className="mr-auto flex items-center gap-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                    >
                      <Edit className="w-3.5 h-3.5 text-slate-600" />
                      <span>تعديل / عرض التفاصيل</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
