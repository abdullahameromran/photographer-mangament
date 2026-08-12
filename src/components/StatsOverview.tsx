import React from 'react';
import { Booking, User } from '../types';
import {
  canViewField,
  calculateFinancials,
  formatCurrency,
} from '../utils/permissions';
import {
  BarChart3,
  Calendar,
  DollarSign,
  Printer,
  CheckCircle2,
  Clock,
  Lock,
  PieChart,
  Users,
  Sparkles,
} from 'lucide-react';

interface StatsOverviewProps {
  bookings: Booking[];
  currentUser: User;
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({ bookings, currentUser }) => {
  const canViewPrice = canViewField(currentUser, 'price');

  // Compute stats
  const totalBookings = bookings.length;
  const confirmedCount = bookings.filter(
    (b) => b.status === 'مؤكد' || b.status === 'قادم' || b.status === 'تم التصوير'
  ).length;
  const pendingDepositCount = bookings.filter((b) => b.status === 'في انتظار العربون').length;
  const printJobsCount = bookings.filter((b) => b.hasPrint).length;

  // Financial totals
  let totalRevenue = 0;
  let totalPaid = 0;
  let totalRemaining = 0;

  bookings.forEach((b) => {
    const { price, paid, remaining } = calculateFinancials(
      b.price,
      b.hasDeposit,
      b.depositAmount
    );
    totalRevenue += price;
    totalPaid += paid;
    totalRemaining += remaining;
  });

  // Booking type counts
  const typeCounts: Record<string, number> = {};
  bookings.forEach((b) => {
    b.bookingTypes.forEach((t) => {
      typeCounts[t] = (typeCounts[t] || 0) + 1;
    });
  });

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-slate-900 text-white rounded-xl p-6 sm:p-8 shadow-md relative overflow-hidden border border-slate-800">
        <div className="absolute left-0 top-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="w-2 h-6 bg-blue-600 rounded-full inline-block"></span>
              <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h2 className="text-2xl font-bold font-tajawal text-white">
                ملخص أداء وحجوزات الاستوديو
              </h2>
            </div>
            <p className="text-xs text-slate-400 max-w-xl">
              نظرة عامة شمولية على إجمالي الحجوزات، حالة الطباعة، والأداء المالي وفق الصلاحيات المتاحة لحسابك.
            </p>
          </div>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Bookings */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-11 h-11 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center font-bold">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">إجمالي الحجوزات</div>
            <div className="text-2xl font-bold text-slate-900">{totalBookings}</div>
          </div>
        </div>

        {/* Confirmed */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-11 h-11 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">حجوزات مؤكدة</div>
            <div className="text-2xl font-bold text-emerald-700">{confirmedCount}</div>
          </div>
        </div>

        {/* Pending Deposit */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-11 h-11 rounded-lg bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">في انتظار العربون</div>
            <div className="text-2xl font-bold text-amber-700">{pendingDepositCount}</div>
          </div>
        </div>

        {/* Print Jobs */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-11 h-11 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center font-bold">
            <Printer className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">أوامر الطباعة</div>
            <div className="text-2xl font-bold text-slate-800">{printJobsCount}</div>
          </div>
        </div>
      </div>

      {/* Financial Overview Cards - Geometric Slate-900 Card */}
      {canViewPrice ? (
        <div className="bg-slate-900 text-white p-6 rounded-xl border border-slate-800 shadow-md relative overflow-hidden space-y-4">
          <div className="absolute top-0 right-0 w-48 h-48 bg-blue-600/10 blur-3xl rounded-full pointer-events-none"></div>

          <div className="flex items-center gap-2 font-bold text-white text-base relative z-10">
            <span className="w-2 h-5 bg-blue-600 rounded-full inline-block"></span>
            <DollarSign className="w-5 h-5 text-blue-400" />
            <span>الإحصائيات المالية للحجوزات المتاحة:</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 relative z-10">
            <div className="bg-slate-800/90 p-4 rounded-lg border border-slate-700 text-center">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                إجمالي قيمة الحجوزات
              </span>
              <span className="text-xl font-bold text-white">
                {formatCurrency(totalRevenue)}
              </span>
            </div>

            <div className="bg-slate-800/90 p-4 rounded-lg border border-slate-700 text-center">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                إجمالي العربون والمدفوع
              </span>
              <span className="text-xl font-bold text-emerald-400">
                {formatCurrency(totalPaid)}
              </span>
            </div>

            <div className="bg-slate-800/90 p-4 rounded-lg border border-slate-700 text-center">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                إجمالي المبلغ المتبقي عند العملاء
              </span>
              <span className="text-2xl font-black text-amber-400">
                {formatCurrency(totalRemaining)}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-slate-100 p-6 rounded-xl border border-slate-200 text-center text-slate-500 font-semibold text-xs flex items-center justify-center gap-2">
          <Lock className="w-4 h-4 text-slate-400" />
          <span>المؤشرات المالية غير متاحة لحسابك حسب إعدادات الصلاحيات</span>
        </div>
      )}

      {/* Booking Types Distribution */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
          <span className="w-2 h-5 bg-blue-600 rounded-full inline-block"></span>
          <PieChart className="w-5 h-5 text-blue-600" />
          <span>توزيع أنواع الحجوزات (سيشن، حنة، كتب كتاب، زفاف...):</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Object.entries(typeCounts).map(([typeName, count]) => (
            <div
              key={typeName}
              className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex items-center justify-between"
            >
              <span className="font-semibold text-xs text-slate-700">{typeName}</span>
              <span className="bg-blue-600 text-white font-bold text-xs px-2.5 py-0.5 rounded-full">
                {count}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
