import React, { useMemo, useState } from 'react';
import {
  ArrowDownUp,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Phone,
  Search,
  Users,
  WalletCards,
} from 'lucide-react';
import { Booking, User } from '../types';
import { calculateFinancials, canViewField, formatCurrency } from '../utils/permissions';

interface ClientAccountsProps {
  bookings: Booking[];
  currentUser: User;
}

type AccountFilter = 'all' | 'due' | 'paid';
type SortKey = 'remaining' | 'paid' | 'price' | 'name';

interface ClientAccount {
  key: string;
  name: string;
  phone: string;
  bookingsCount: number;
  price: number;
  paid: number;
  remaining: number;
  latestDate: string;
}

const shortDate = (value: string) => value
  ? new Intl.DateTimeFormat('ar-EG', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(`${value}T12:00:00`))
  : '—';

export const ClientAccounts: React.FC<ClientAccountsProps> = ({ bookings, currentUser }) => {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<AccountFilter>('all');
  const [sortBy, setSortBy] = useState<SortKey>('remaining');

  const canViewPrice = canViewField(currentUser, 'price');
  const canViewPaid = canViewField(currentUser, 'depositAmount');
  const canViewRemaining = canViewField(currentUser, 'remaining');
  const canViewPhone = canViewField(currentUser, 'phone');

  const accounts = useMemo(() => {
    const grouped = new Map<string, ClientAccount>();
    bookings.forEach((booking) => {
      const phoneKey = booking.phone.replace(/\D/g, '');
      const key = phoneKey || booking.customerName.trim().toLocaleLowerCase('ar');
      const financials = calculateFinancials(booking.price, booking.hasDeposit, booking.depositAmount);
      const current = grouped.get(key);
      if (current) {
        current.bookingsCount += 1;
        current.price += financials.price;
        current.paid += financials.paid;
        current.remaining += financials.remaining;
        if (booking.date > current.latestDate) current.latestDate = booking.date;
      } else {
        grouped.set(key, {
          key,
          name: booking.customerName || 'عميل بدون اسم',
          phone: booking.phone,
          bookingsCount: 1,
          price: financials.price,
          paid: financials.paid,
          remaining: financials.remaining,
          latestDate: booking.date,
        });
      }
    });
    return Array.from(grouped.values());
  }, [bookings]);

  const totals = useMemo(() => accounts.reduce((sum, item) => ({
    price: sum.price + item.price,
    paid: sum.paid + item.paid,
    remaining: sum.remaining + item.remaining,
  }), { price: 0, paid: 0, remaining: 0 }), [accounts]);

  const visibleAccounts = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('ar');
    return accounts
      .filter((item) => !normalizedQuery || item.name.toLocaleLowerCase('ar').includes(normalizedQuery) || item.phone.includes(normalizedQuery))
      .filter((item) => filter === 'all' || (filter === 'due' ? item.remaining > 0 : item.remaining === 0 && item.price > 0))
      .sort((a, b) => sortBy === 'name' ? a.name.localeCompare(b.name, 'ar') : b[sortBy] - a[sortBy]);
  }, [accounts, filter, query, sortBy]);

  const collectionRate = totals.price > 0 ? Math.round((totals.paid / totals.price) * 100) : 0;
  const money = (amount: number, allowed: boolean) => allowed ? formatCurrency(amount) : 'غير متاح';

  return (
    <section className="space-y-5" dir="rtl">
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 p-6 text-white shadow-xl sm:p-8">
        <div className="absolute -left-16 -top-20 h-56 w-56 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-400/10 px-3 py-1 text-xs font-bold text-blue-300">
              <WalletCards className="h-4 w-4" /> حسابات العملاء
            </div>
            <h1 className="text-2xl font-black sm:text-3xl">المدفوع والمتبقي لكل عميل</h1>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-300">ملخص موحّد لكل حجوزات العميل لمعرفة ما دفعه وما عليه في لمحة واحدة.</p>
          </div>
          {canViewPrice && canViewPaid && (
            <div className="min-w-56 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
              <div className="flex items-center justify-between text-xs text-slate-300"><span>نسبة التحصيل</span><strong className="text-emerald-300">{collectionRate}%</strong></div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-700"><div className="h-full rounded-full bg-emerald-400 transition-all" style={{ width: `${Math.min(collectionRate, 100)}%` }} /></div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: 'عدد العملاء', value: accounts.length.toLocaleString('ar-EG'), icon: Users, iconClass: 'bg-blue-50 text-blue-600' },
          { label: 'إجمالي الاتفاقات', value: money(totals.price, canViewPrice), icon: CircleDollarSign, iconClass: 'bg-slate-100 text-slate-600' },
          { label: 'إجمالي المدفوع', value: money(totals.paid, canViewPaid), icon: CheckCircle2, iconClass: 'bg-emerald-50 text-emerald-600' },
          { label: 'إجمالي المتبقي', value: money(totals.remaining, canViewRemaining), icon: Clock3, iconClass: 'bg-amber-50 text-amber-600' },
        ].map(({ label, value, icon: Icon, iconClass }) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl ${iconClass}`}><Icon className="h-5 w-5" /></div>
            <div className="text-xs font-bold text-slate-500">{label}</div>
            <div className="mt-1 text-lg font-black text-slate-900 sm:text-xl">{value}</div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative flex-1 lg:max-w-md">
            <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="ابحث باسم العميل أو رقم الهاتف..." className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-3 pr-10 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 lg:pb-0">
            {([['all', 'كل العملاء'], ['due', 'عليهم متبقي'], ['paid', 'تم السداد']] as const).map(([value, label]) => (
              <button key={value} onClick={() => setFilter(value)} className={`whitespace-nowrap rounded-xl px-3 py-2 text-xs font-bold transition ${filter === value ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{label}</button>
            ))}
            <label className="flex items-center gap-2 whitespace-nowrap rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600">
              <ArrowDownUp className="h-3.5 w-3.5" />
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortKey)} className="bg-transparent outline-none">
                <option value="remaining">الأعلى متبقيًا</option><option value="paid">الأعلى دفعًا</option><option value="price">الأعلى قيمة</option><option value="name">الاسم</option>
              </select>
            </label>
          </div>
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[850px] text-right text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500"><tr><th className="p-4">العميل</th><th className="p-4">الحجوزات</th><th className="p-4">آخر موعد</th><th className="p-4">إجمالي الاتفاق</th><th className="p-4">دفع كام</th><th className="p-4">عليه كام</th><th className="p-4">الحالة</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {visibleAccounts.map((item) => {
                const rate = item.price > 0 ? Math.min(100, Math.round((item.paid / item.price) * 100)) : 0;
                return <tr key={item.key} className="transition hover:bg-blue-50/40">
                  <td className="p-4"><div className="font-black text-slate-800">{item.name}</div>{canViewPhone && item.phone && <a href={`tel:${item.phone}`} className="mt-1 inline-flex items-center gap-1 text-xs text-slate-500 hover:text-blue-600" dir="ltr"><Phone className="h-3 w-3" />{item.phone}</a>}</td>
                  <td className="p-4"><span className="rounded-lg bg-blue-50 px-2.5 py-1 font-bold text-blue-700">{item.bookingsCount.toLocaleString('ar-EG')}</span></td>
                  <td className="p-4 text-slate-600">{shortDate(item.latestDate)}</td>
                  <td className="p-4 font-bold text-slate-700">{money(item.price, canViewPrice)}</td>
                  <td className="p-4 font-black text-emerald-600">{money(item.paid, canViewPaid)}</td>
                  <td className="p-4 font-black text-amber-600">{money(item.remaining, canViewRemaining)}</td>
                  <td className="p-4"><div className="w-28"><div className="mb-1 flex justify-between text-[10px] font-bold text-slate-500"><span>{item.remaining === 0 && item.price > 0 ? 'تم السداد' : item.paid > 0 ? 'دفع جزئي' : 'لم يدفع'}</span><span>{rate}%</span></div><div className="h-1.5 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${rate === 100 ? 'bg-emerald-500' : 'bg-amber-400'}`} style={{ width: `${rate}%` }} /></div></div></td>
                </tr>;
              })}
            </tbody>
          </table>
        </div>

        <div className="divide-y divide-slate-100 md:hidden">
          {visibleAccounts.map((item) => <article key={item.key} className="p-4">
            <div className="flex items-start justify-between gap-3"><div><h3 className="font-black text-slate-900">{item.name}</h3>{canViewPhone && item.phone && <div className="mt-1 text-xs text-slate-500" dir="ltr">{item.phone}</div>}</div><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${item.remaining === 0 && item.price > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{item.remaining === 0 && item.price > 0 ? 'تم السداد' : 'عليه متبقي'}</span></div>
            <div className="mt-4 grid grid-cols-2 gap-2"><div className="rounded-xl bg-emerald-50 p-3"><div className="text-[10px] font-bold text-emerald-700">دفع كام</div><div className="mt-1 font-black text-emerald-800">{money(item.paid, canViewPaid)}</div></div><div className="rounded-xl bg-amber-50 p-3"><div className="text-[10px] font-bold text-amber-700">عليه كام</div><div className="mt-1 font-black text-amber-800">{money(item.remaining, canViewRemaining)}</div></div></div>
            <div className="mt-3 flex items-center justify-between text-xs text-slate-500"><span className="flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" /> {item.bookingsCount.toLocaleString('ar-EG')} حجز</span><span>{shortDate(item.latestDate)}</span></div>
          </article>)}
        </div>

        {visibleAccounts.length === 0 && <div className="p-12 text-center"><Users className="mx-auto mb-3 h-10 w-10 text-slate-300" /><h3 className="font-bold text-slate-700">لا توجد نتائج مطابقة</h3><p className="mt-1 text-xs text-slate-400">جرّب تغيير البحث أو فلتر حالة الدفع.</p></div>}
        <div className="border-t border-slate-100 px-4 py-3 text-xs font-bold text-slate-500">عرض {visibleAccounts.length.toLocaleString('ar-EG')} من {accounts.length.toLocaleString('ar-EG')} عميل</div>
      </div>
    </section>
  );
};
