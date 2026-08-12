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
  TrendingUp,
  Wallet,
  Banknote,
  ArrowUpLeft,
  Image,
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

  const averageBookingValue = totalBookings ? totalRevenue / totalBookings : 0;
  const collectionRate = totalRevenue ? Math.round((totalPaid / totalRevenue) * 100) : 0;
  const completionCount = bookings.filter((b) => ['تم التصوير','جاهز','تم التسليم'].includes(b.status)).length;
  const completionRate = totalBookings ? Math.round((completionCount / totalBookings) * 100) : 0;
  const today = new Date();
  today.setHours(0,0,0,0);
  const upcomingBookings = bookings.filter((b) => new Date(`${b.date}T00:00:00`) >= today && b.status !== 'ملغي').sort((a,b) => a.date.localeCompare(b.date)).slice(0,5);
  const activePrintJobs = bookings.filter((b) => b.hasPrint && b.printStatus !== 'تم التسليم').length;

  const statusColors: Record<string,string> = {'جديد':'#3b82f6','في انتظار العربون':'#f59e0b','مؤكد':'#10b981','قادم':'#8b5cf6','تم التصوير':'#0ea5e9','جاري التجهيز':'#6366f1','جاهز':'#14b8a6','تم التسليم':'#64748b','ملغي':'#ef4444'};
  const statusCountMap: Record<string, number> = {};
  bookings.forEach((booking) => { statusCountMap[booking.status] = (statusCountMap[booking.status] || 0) + 1; });
  const statusCounts: Array<[string, number]> = Object.entries(statusCountMap).sort((a,b)=>b[1]-a[1]);

  const monthFormatter = new Intl.DateTimeFormat('ar-EG',{month:'short'});
  const monthlyTrend = Array.from({length:6},(_,index) => {
    const date = new Date(today.getFullYear(),today.getMonth()-(5-index),1);
    const key = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}`;
    const rows = bookings.filter((b)=>b.date.startsWith(key));
    return {label:monthFormatter.format(date),count:rows.length,revenue:rows.reduce((sum,b)=>sum+b.price,0)};
  });
  const maxMonthlyBookings = Math.max(1,...monthlyTrend.map((m)=>m.count));

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

      {/* Operational health */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          {label:'متوسط قيمة الحجز',value:canViewPrice?formatCurrency(averageBookingValue):'محمي',icon:TrendingUp,color:'blue'},
          {label:'نسبة التحصيل',value:canViewPrice?`${collectionRate}%`:'محمي',icon:Wallet,color:'emerald'},
          {label:'نسبة الإنجاز',value:`${completionRate}%`,icon:CheckCircle2,color:'violet'},
          {label:'طباعة قيد التنفيذ',value:String(activePrintJobs),icon:Image,color:'amber'},
        ].map(({label,value,icon:Icon,color})=><div key={label} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm min-w-0"><div className={`w-9 h-9 rounded-lg bg-${color}-50 text-${color}-600 grid place-items-center mb-3`}><Icon className="w-4 h-4"/></div><p className="text-[10px] sm:text-xs text-slate-400 font-bold truncate">{label}</p><p className="text-lg sm:text-xl font-black text-slate-900 truncate">{value}</p></div>)}
      </div>

      {/* Trend and status charts */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <section className="lg:col-span-3 bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between gap-3 mb-7"><div><h3 className="font-black text-slate-900 flex items-center gap-2"><BarChart3 className="w-5 h-5 text-blue-600"/> اتجاه الحجوزات</h3><p className="text-[11px] text-slate-400 mt-1">آخر 6 أشهر</p></div><span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-100 rounded-full px-3 py-1">{monthlyTrend.reduce((s,m)=>s+m.count,0)} حجز</span></div>
          <div className="h-56 flex items-end gap-2 sm:gap-4 border-b border-slate-200 relative">
            {monthlyTrend.map((month)=><div key={month.label} className="h-full flex-1 min-w-0 flex flex-col justify-end items-center group"><div className="text-[10px] font-black text-slate-600 mb-2 opacity-0 group-hover:opacity-100 transition-opacity">{month.count}</div><div title={`${month.count} حجز${canViewPrice?` • ${formatCurrency(month.revenue)}`:''}`} className="w-full max-w-12 rounded-t-lg bg-gradient-to-t from-blue-700 to-blue-400 hover:from-blue-600 hover:to-blue-300 transition-all" style={{height:`${Math.max(month.count?12:2,(month.count/maxMonthlyBookings)*82)}%`}}/><span className="text-[10px] sm:text-xs font-bold text-slate-500 mt-3 whitespace-nowrap">{month.label}</span></div>)}
          </div>
        </section>

        <section className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-sm">
          <h3 className="font-black text-slate-900 flex items-center gap-2 mb-5"><PieChart className="w-5 h-5 text-violet-600"/> حالات الحجوزات</h3>
          {statusCounts.length?<div className="space-y-4">{statusCounts.map(([status,count])=><div key={status}><div className="flex justify-between text-xs font-bold mb-1.5"><span className="text-slate-700">{status}</span><span className="text-slate-400">{count} • {Math.round(count/totalBookings*100)}%</span></div><div className="h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full rounded-full transition-all" style={{width:`${count/totalBookings*100}%`,backgroundColor:statusColors[status]||'#64748b'}}/></div></div>)}</div>:<p className="text-sm text-slate-400 text-center py-12">لا توجد بيانات بعد</p>}
        </section>
      </div>

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

      {/* Upcoming activity */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between"><div><h3 className="font-black text-slate-900 flex items-center gap-2"><ArrowUpLeft className="w-5 h-5 text-emerald-600"/> أقرب الحجوزات القادمة</h3><p className="text-[11px] text-slate-400 mt-1">جدول العمل التالي للفريق</p></div><span className="text-xs font-black text-slate-500">{upcomingBookings.length}</span></div>
        {upcomingBookings.length?<div className="divide-y divide-slate-100">{upcomingBookings.map((booking)=><div key={booking.id} className="p-4 sm:px-5 flex items-center gap-3 sm:gap-4 hover:bg-slate-50 transition-colors"><div className="w-12 h-12 shrink-0 rounded-xl bg-slate-900 text-white grid place-items-center text-center"><span className="text-[9px] text-blue-300">{new Intl.DateTimeFormat('ar-EG',{month:'short'}).format(new Date(`${booking.date}T00:00:00`))}</span><strong className="text-base leading-4">{new Date(`${booking.date}T00:00:00`).getDate()}</strong></div><div className="flex-1 min-w-0"><p className="font-black text-sm text-slate-900 truncate">{booking.title}</p><p className="text-[11px] text-slate-400 truncate">{booking.customerName} • {booking.startTime} • {booking.location||'الموقع غير محدد'}</p></div>{canViewPrice&&<span className="hidden sm:block text-xs font-black text-slate-700">{formatCurrency(booking.price)}</span>}<span className="text-[10px] font-bold px-2 py-1 rounded-full bg-blue-50 text-blue-700 shrink-0">{booking.status}</span></div>)}</div>:<div className="text-center py-12 text-sm text-slate-400">لا توجد حجوزات قادمة</div>}
      </section>
    </div>
  );
};
