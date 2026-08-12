import React from 'react';
import { Booking, User, BookingStatus, PrintStatus } from '../types';
import {
  canViewField,
  canEditField,
  canPerformAction,
  calculateFinancials,
  formatCurrency,
  formatDateArabic,
} from '../utils/permissions';
import {
  Calendar,
  Clock,
  MapPin,
  Phone,
  MessageCircle,
  Printer,
  DollarSign,
  UserCheck,
  Edit2,
  Trash2,
  Eye,
  CheckCircle,
  AlertCircle,
  Lock,
  ChevronDown,
  Sparkles,
  FileText,
} from 'lucide-react';

interface BookingCardProps {
  booking: Booking;
  currentUser: User;
  allUsers: User[];
  onView: (booking: Booking) => void;
  onEdit: (booking: Booking) => void;
  onDelete: (bookingId: string) => void;
  onStatusChange: (bookingId: string, newStatus: BookingStatus) => void;
  onPrintStatusChange: (bookingId: string, newPrintStatus: PrintStatus) => void;
}

const STATUS_COLOR_MAP: Record<BookingStatus, { bg: string; text: string; border: string }> = {
  جديد: { bg: 'bg-blue-500/10', text: 'text-blue-700', border: 'border-blue-500/30' },
  'في انتظار العربون': { bg: 'bg-amber-500/10', text: 'text-amber-700', border: 'border-amber-500/30' },
  مؤكد: { bg: 'bg-emerald-500/10', text: 'text-emerald-700', border: 'border-emerald-500/30' },
  قادم: { bg: 'bg-purple-500/10', text: 'text-purple-700', border: 'border-purple-500/30' },
  'تم التصوير': { bg: 'bg-indigo-500/10', text: 'text-indigo-700', border: 'border-indigo-500/30' },
  'جاري التجهيز': { bg: 'bg-cyan-500/10', text: 'text-cyan-700', border: 'border-cyan-500/30' },
  جاهز: { bg: 'bg-teal-500/10', text: 'text-teal-700', border: 'border-teal-500/30' },
  'تم التسليم': { bg: 'bg-slate-500/10', text: 'text-slate-700', border: 'border-slate-500/30' },
  ملغي: { bg: 'bg-red-500/10', text: 'text-red-700', border: 'border-red-500/30' },
};

const PRINT_STATUS_MAP: Record<PrintStatus, { bg: string; text: string }> = {
  'لم تبدأ': { bg: 'bg-slate-100 text-slate-700', text: 'لم تبدأ' },
  'جاري التجهيز': { bg: 'bg-amber-100 text-amber-800', text: 'جاري التجهيز' },
  جاهزة: { bg: 'bg-emerald-100 text-emerald-800', text: 'جاهزة' },
  'تم التسليم': { bg: 'bg-indigo-100 text-indigo-800', text: 'تم التسليم' },
};

export const BookingCard: React.FC<BookingCardProps> = ({
  booking,
  currentUser,
  allUsers,
  onView,
  onEdit,
  onDelete,
  onStatusChange,
  onPrintStatusChange,
}) => {
  // Permission checks
  const viewName = canViewField(currentUser, 'customerName');
  const viewPhone = canViewField(currentUser, 'phone');
  const viewWhatsapp = canViewField(currentUser, 'whatsapp');
  const viewDate = canViewField(currentUser, 'date');
  const viewTime = canViewField(currentUser, 'time');
  const viewLocation = canViewField(currentUser, 'location');
  const viewPrice = canViewField(currentUser, 'price');
  const viewDeposit = canViewField(currentUser, 'depositAmount');
  const viewRemaining = canViewField(currentUser, 'remaining');
  const viewPrint = canViewField(currentUser, 'printSettings');
  const viewNotes = canViewField(currentUser, 'notes');
  const viewStaff = canViewField(currentUser, 'assignedStaff');
  const viewStatus = canViewField(currentUser, 'status');

  const canEditBooking = canPerformAction(currentUser, 'editBooking');
  const canDeleteBooking = canPerformAction(currentUser, 'deleteBooking');
  const canChangeStatus = canPerformAction(currentUser, 'changeStatus') && canEditField(currentUser, 'status');
  const canEditPrint = canEditField(currentUser, 'printSettings');

  // Calculate financials
  const { price, paid, remaining, paymentStatus } = calculateFinancials(
    booking.price,
    booking.hasDeposit,
    booking.depositAmount
  );

  // Assigned users list
  const assignedUsers = allUsers.filter((u) => booking.assignedUserIds.includes(u.id));

  // Print items string list
  const printItemsList: string[] = [];
  if (booking.hasPrint && booking.printOptions) {
    if (booking.printOptions.largeCanvas) printItemsList.push('تابلوه كبير');
    if (booking.printOptions.smallCanvas) printItemsList.push('تابلوه صغير');
    if (booking.printOptions.album30x45) printItemsList.push('ألبوم 30 × 45');
    if (booking.printOptions.album30x60) printItemsList.push('ألبوم 30 × 60');
    if (booking.printOptions.photoCards) {
      printItemsList.push(`صور كروت (${booking.printOptions.photoCardsCount || 0} صورة)`);
    }
  }

  const statusStyle = STATUS_COLOR_MAP[booking.status] || STATUS_COLOR_MAP['جديد'];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col group">
      {/* Top Card Header */}
      <div className="p-5 pb-3 border-b border-slate-100 bg-white flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="w-2 h-5 bg-blue-600 rounded-full inline-block shrink-0"></span>
            <h3 className="font-bold text-slate-900 text-base group-hover:text-blue-600 transition-colors">
              {booking.title}
            </h3>
            {booking.bookingTypes.map((type) => (
              <span
                key={type}
                className="bg-slate-100 text-slate-600 text-xs font-semibold px-2 py-0.5 rounded border border-slate-200"
              >
                {type}
              </span>
            ))}
          </div>

          {/* Customer Name & Phone */}
          {(viewName || viewPhone) && (
            <div className="flex items-center gap-3 text-sm text-slate-600 pr-4">
              {viewName && <span className="font-semibold text-slate-800">{booking.customerName}</span>}
              {viewPhone && booking.phone && (
                <span className="flex items-center gap-1 text-slate-500 dir-ltr text-xs">
                  <Phone className="w-3.5 h-3.5" />
                  {booking.phone}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Status Dropdown / Badge */}
        <div>
          {viewStatus && (
            <div className="relative">
              {canChangeStatus ? (
                <select
                  value={booking.status}
                  onChange={(e) => onStatusChange(booking.id, e.target.value as BookingStatus)}
                  className={`text-xs font-bold px-3 py-1 rounded-full border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border} focus:outline-none cursor-pointer`}
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
              ) : (
                <span
                  className={`inline-block text-xs font-bold px-3 py-1 rounded-full border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}
                >
                  {booking.status}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Middle Card Details */}
      <div className="p-5 space-y-4 flex-1">
        {/* Date, Time, Location */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          {viewDate && (
            <div className="flex items-center gap-2 text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
              <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
              <span className="font-semibold">{formatDateArabic(booking.date)}</span>
            </div>
          )}

          {viewTime && (
            <div className="flex items-center gap-2 text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
              <Clock className="w-4 h-4 text-blue-600 shrink-0" />
              <span>
                {booking.startTime} - {booking.endTime}
              </span>
            </div>
          )}

          {viewLocation && booking.location && (
            <div className="flex items-center gap-2 text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100 sm:col-span-2">
              <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
              <span className="truncate">{booking.location}</span>
            </div>
          )}
        </div>

        {/* Financial Section - Slate-900 Dark Card from Theme */}
        {viewPrice || viewDeposit || viewRemaining ? (
          <div className="bg-slate-900 text-white rounded-xl p-4 shadow-sm relative overflow-hidden border border-slate-800 space-y-3">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-600/10 blur-2xl rounded-full pointer-events-none"></div>

            <div className="flex items-center justify-between text-xs relative z-10">
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                الحساب المالي
              </span>
              <span
                className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
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

            <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-slate-800 relative z-10">
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-bold">إجمالي السعر</span>
                <span className="text-sm font-bold text-white">
                  {viewPrice ? formatCurrency(price) : '🔒 مخفي'}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-bold">المدفوع</span>
                <span className="text-sm font-bold text-emerald-400">
                  {viewDeposit ? formatCurrency(paid) : '🔒 مخفي'}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-bold">المتبقي</span>
                <span className="text-base font-black text-amber-400">
                  {viewRemaining ? formatCurrency(remaining) : '🔒 مخفي'}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-slate-100 text-slate-400 rounded-lg p-2.5 text-xs text-center font-semibold flex items-center justify-center gap-1.5 border border-slate-200">
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            <span>بيانات الأسعار والماليات مخفية حسب صلاحياتك</span>
          </div>
        )}

        {/* Print Management Section - Emerald Theme */}
        {viewPrint && (
          <div className="bg-emerald-50/50 rounded-xl p-3.5 border border-emerald-200/80 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                <span className="w-2 h-4 bg-emerald-600 rounded-full inline-block"></span>
                <span>إدارة الطباعة:</span>
              </div>

              {booking.hasPrint ? (
                canEditPrint ? (
                  <select
                    value={booking.printStatus}
                    onChange={(e) =>
                      onPrintStatusChange(booking.id, e.target.value as PrintStatus)
                    }
                    className="text-[11px] font-bold px-2.5 py-1 rounded-md border border-emerald-300 bg-white text-emerald-800 focus:outline-none cursor-pointer"
                  >
                    <option value="لم تبدأ">لم تبدأ</option>
                    <option value="جاري التجهيز">جاري التجهيز</option>
                    <option value="جاهزة">جاهزة</option>
                    <option value="تم التسليم">تم التسليم</option>
                  </select>
                ) : (
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                      PRINT_STATUS_MAP[booking.printStatus]?.bg
                    }`}
                  >
                    {booking.printStatus}
                  </span>
                )
              ) : (
                <span className="text-[11px] text-slate-400 font-medium">لا يوجد طباعة</span>
              )}
            </div>

            {booking.hasPrint && printItemsList.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {printItemsList.map((item, idx) => (
                  <span
                    key={idx}
                    className="text-[11px] bg-emerald-100/80 border border-emerald-200 text-emerald-800 px-2.5 py-0.5 rounded font-bold"
                  >
                    • {item}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Notes snippet */}
        {viewNotes && booking.notes && (
          <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200/80 line-clamp-2">
            <span className="font-bold text-slate-700">ملاحظات: </span>
            {booking.notes}
          </div>
        )}
      </div>

      {/* Card Footer: Assigned Staff & Quick Actions */}
      <div className="p-4 pt-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
        {/* Assigned Users */}
        {viewStaff && (
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase ml-1">المصورين:</span>
            {assignedUsers.length > 0 ? (
              <div className="flex -space-x-1.5 space-x-reverse">
                {assignedUsers.map((u) => (
                  <img
                    key={u.id}
                    src={u.avatar}
                    alt={u.name}
                    title={`${u.name} (${u.role})`}
                    className="w-6 h-6 rounded-full object-cover border-2 border-white"
                  />
                ))}
              </div>
            ) : (
              <span className="text-[11px] text-slate-400">غير مسند</span>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 mr-auto">
          {viewWhatsapp && booking.whatsapp && (
            <a
              href={`https://wa.me/${booking.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded border border-emerald-200 transition-colors cursor-pointer"
              title="مراسلة واتساب"
            >
              <MessageCircle className="w-4 h-4" />
            </a>
          )}

          <button
            onClick={() => onView(booking)}
            className="p-1.5 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded border border-slate-200 transition-colors cursor-pointer"
            title="عرض التفاصيل"
          >
            <Eye className="w-4 h-4" />
          </button>

          {canEditBooking && (
            <button
              onClick={() => onEdit(booking)}
              className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 transition-colors cursor-pointer"
              title="تعديل الحجز"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          )}

          {canDeleteBooking && (
            <button
              onClick={() => onDelete(booking.id)}
              className="p-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded border border-red-200 transition-colors cursor-pointer"
              title="حذف الحجز"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
