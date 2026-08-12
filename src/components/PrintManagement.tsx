import React, { useState } from 'react';
import { Booking, User, PrintStatus } from '../types';
import { canEditField, canViewField, formatDateArabic } from '../utils/permissions';
import {
  Printer,
  CheckCircle2,
  Clock,
  Package,
  Layers,
  Search,
  Filter,
  Phone,
  MessageCircle,
  Calendar,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

interface PrintManagementProps {
  bookings: Booking[];
  currentUser: User;
  onPrintStatusChange: (bookingId: string, status: PrintStatus) => void;
  onViewBooking: (booking: Booking) => void;
}

export const PrintManagement: React.FC<PrintManagementProps> = ({
  bookings,
  currentUser,
  onPrintStatusChange,
  onViewBooking,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Filter bookings that have printing requested
  const printBookings = bookings.filter((b) => b.hasPrint);

  const filtered = printBookings.filter((b) => {
    const matchesStatus = filterStatus === 'all' || b.printStatus === filterStatus;
    const matchesSearch =
      b.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.phone.includes(searchTerm);
    return matchesStatus && matchesSearch;
  });

  const countNotStarted = printBookings.filter((b) => b.printStatus === 'لم تبدأ').length;
  const countInProgress = printBookings.filter((b) => b.printStatus === 'جاري التجهيز').length;
  const countReady = printBookings.filter((b) => b.printStatus === 'جاهزة').length;
  const countDelivered = printBookings.filter((b) => b.printStatus === 'تم التسليم').length;

  const canEditPrint = canEditField(currentUser, 'printSettings');

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
                <Printer className="w-5 h-5" />
              </div>
              <h2 className="text-2xl font-bold font-tajawal text-white">
                لوحة متابعة استوديو الطباعة
              </h2>
            </div>
            <p className="text-xs text-slate-400 max-w-xl">
              تتبع جميع أوامر الطباعة للتابلوهات، الألبومات 30×45 و30×60 وصور الكروت مع تحديث حالة التجهيز والتسليم لحظيًا.
            </p>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-800/80 border border-slate-700/80 p-3 rounded-lg text-center">
              <div className="text-[10px] text-slate-400 mb-1 font-bold uppercase tracking-wider">لم تبدأ</div>
              <div className="text-xl font-bold text-amber-400">{countNotStarted}</div>
            </div>

            <div className="bg-slate-800/80 border border-slate-700/80 p-3 rounded-lg text-center">
              <div className="text-[10px] text-slate-400 mb-1 font-bold uppercase tracking-wider">جاري التجهيز</div>
              <div className="text-xl font-bold text-blue-400">{countInProgress}</div>
            </div>

            <div className="bg-slate-800/80 border border-slate-700/80 p-3 rounded-lg text-center">
              <div className="text-[10px] text-slate-400 mb-1 font-bold uppercase tracking-wider">جاهزة</div>
              <div className="text-xl font-bold text-emerald-400">{countReady}</div>
            </div>

            <div className="bg-slate-800/80 border border-slate-700/80 p-3 rounded-lg text-center">
              <div className="text-[10px] text-slate-400 mb-1 font-bold uppercase tracking-wider">تم التسليم</div>
              <div className="text-xl font-bold text-slate-300">{countDelivered}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Controls & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ابحث بالاسم أو العميل..."
            className="w-full text-xs text-slate-800 placeholder-slate-400 bg-slate-50 pl-3 pr-9 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
        </div>

        {/* Status Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto no-scrollbar">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              filterStatus === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            الكل ({printBookings.length})
          </button>

          <button
            onClick={() => setFilterStatus('لم تبدأ')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              filterStatus === 'لم تبدأ'
                ? 'bg-amber-500 text-slate-950'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            لم تبدأ ({countNotStarted})
          </button>

          <button
            onClick={() => setFilterStatus('جاري التجهيز')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              filterStatus === 'جاري التجهيز'
                ? 'bg-cyan-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            جاري التجهيز ({countInProgress})
          </button>

          <button
            onClick={() => setFilterStatus('جاهزة')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              filterStatus === 'جاهزة'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            جاهزة ({countReady})
          </button>

          <button
            onClick={() => setFilterStatus('تم التسليم')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              filterStatus === 'تم التسليم'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            تم التسليم ({countDelivered})
          </button>
        </div>
      </div>

      {/* Printing Orders List Grid */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm space-y-3">
          <Printer className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-700 text-base">لا توجد أمر طباعة متطابقة</h3>
          <p className="text-xs text-slate-400">
            تأكد من اختيار خانة "طلبات الطباعة" عند إضافة أو تعديل أي حجز.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((b) => {
            const opts = b.printOptions;
            return (
              <div
                key={b.id}
                className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-all space-y-4 flex flex-col"
              >
                {/* Order Top Bar */}
                <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <h4 className="font-black text-slate-900 text-base">{b.title}</h4>
                    <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                      <span>{b.customerName}</span>
                      <span>•</span>
                      <span>{formatDateArabic(b.date)}</span>
                    </div>
                  </div>

                  {/* Status Dropdown / Badge */}
                  {canEditPrint ? (
                    <select
                      value={b.printStatus}
                      onChange={(e) =>
                        onPrintStatusChange(b.id, e.target.value as PrintStatus)
                      }
                      className="text-xs font-black px-3 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-900 focus:outline-none cursor-pointer"
                    >
                      <option value="لم تبدأ">لم تبدأ</option>
                      <option value="جاري التجهيز">جاري التجهيز</option>
                      <option value="جاهزة">جاهزة</option>
                      <option value="تم التسليم">تم التسليم</option>
                    </select>
                  ) : (
                    <span
                      className={`text-xs font-extrabold px-3 py-1 rounded-xl ${
                        b.printStatus === 'جاهزة'
                          ? 'bg-emerald-100 text-emerald-800'
                          : b.printStatus === 'جاري التجهيز'
                          ? 'bg-cyan-100 text-cyan-800'
                          : b.printStatus === 'تم التسليم'
                          ? 'bg-indigo-100 text-indigo-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {b.printStatus}
                    </span>
                  )}
                </div>

                {/* Print Options Checklist */}
                <div className="space-y-2 flex-1">
                  <div className="text-xs font-bold text-slate-500">العناصر المطلوبة للطباعة:</div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div
                      className={`p-2 rounded-xl border flex items-center gap-2 ${
                        opts.largeCanvas
                          ? 'bg-amber-50/80 border-amber-300 text-amber-950 font-bold'
                          : 'bg-slate-50 border-slate-200 text-slate-400 line-through'
                      }`}
                    >
                      <span>تابلوه كبير</span>
                    </div>

                    <div
                      className={`p-2 rounded-xl border flex items-center gap-2 ${
                        opts.smallCanvas
                          ? 'bg-amber-50/80 border-amber-300 text-amber-950 font-bold'
                          : 'bg-slate-50 border-slate-200 text-slate-400 line-through'
                      }`}
                    >
                      <span>تابلوه صغير</span>
                    </div>

                    <div
                      className={`p-2 rounded-xl border flex items-center gap-2 ${
                        opts.album30x45
                          ? 'bg-indigo-50/80 border-indigo-300 text-indigo-950 font-bold'
                          : 'bg-slate-50 border-slate-200 text-slate-400 line-through'
                      }`}
                    >
                      <span>ألبوم 30 × 45</span>
                    </div>

                    <div
                      className={`p-2 rounded-xl border flex items-center gap-2 ${
                        opts.album30x60
                          ? 'bg-indigo-50/80 border-indigo-300 text-indigo-950 font-bold'
                          : 'bg-slate-50 border-slate-200 text-slate-400 line-through'
                      }`}
                    >
                      <span>ألبوم 30 × 60</span>
                    </div>

                    <div
                      className={`p-2 rounded-xl border flex items-center justify-between col-span-2 ${
                        opts.photoCards
                          ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950 font-bold'
                          : 'bg-slate-50 border-slate-200 text-slate-400 line-through'
                      }`}
                    >
                      <span>صور كروت</span>
                      {opts.photoCards && (
                        <span className="bg-emerald-600 text-white text-[10px] px-2 py-0.5 rounded-full font-black">
                          العدد: {opts.photoCardsCount || 0} صورة
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer Quick Status Stepper Buttons */}
                {canEditPrint && (
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => onViewBooking(b)}
                      className="text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 px-3 py-1.5 rounded-xl cursor-pointer"
                    >
                      تفاصيل الحجز
                    </button>

                    <div className="flex items-center gap-1.5">
                      {b.printStatus !== 'جاري التجهيز' && (
                        <button
                          onClick={() => onPrintStatusChange(b.id, 'جاري التجهيز')}
                          className="text-xs font-bold bg-cyan-50 text-cyan-700 hover:bg-cyan-100 border border-cyan-200 px-2.5 py-1.5 rounded-xl cursor-pointer transition-colors"
                        >
                          تحديد كـ جاري التجهيز
                        </button>
                      )}

                      {b.printStatus !== 'جاهزة' && (
                        <button
                          onClick={() => onPrintStatusChange(b.id, 'جاهزة')}
                          className="text-xs font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1.5 rounded-xl cursor-pointer transition-colors"
                        >
                          تحديد كـ جاهزة
                        </button>
                      )}

                      {b.printStatus !== 'تم التسليم' && (
                        <button
                          onClick={() => onPrintStatusChange(b.id, 'تم التسليم')}
                          className="text-xs font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 px-2.5 py-1.5 rounded-xl cursor-pointer transition-colors"
                        >
                          تسليم للعميل
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
