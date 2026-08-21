import React, { useEffect, useState } from 'react';
import { BadgeCheck, CalendarDays, CheckCircle2, Clock3, ExternalLink, LoaderCircle, Phone, RefreshCw, ShieldCheck, WalletCards } from 'lucide-react';
import { Subscriber, subscriptionApi } from '../lib/supabase';
import { User } from '../types';
import { getPhoneUrl } from '../utils/permissions';

const contact = '201554670453';
const facebookPage = 'https://www.facebook.com/profile.php?id=61593185351334';
const plans = {
  trial: { label: 'تجربة مجانية', period: '7 أيام', price: 'مجانية' },
  monthly: { label: 'الباقة الشهرية', period: 'شهر', price: '200 جنيه' },
  quarterly: { label: 'الباقة الربع سنوية', period: '3 شهور', price: '450 جنيه' },
  yearly: { label: 'الباقة السنوية', period: 'سنة', price: '1,500 جنيه' },
} as const;

export function SubscriptionPage({ users }: { users: User[] }) {
  const [subscription, setSubscription] = useState<Subscriber | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true); setError('');
    try { setSubscription(await subscriptionApi.current()); }
    catch (e) { setError(e instanceof Error ? e.message : 'تعذر تحميل بيانات الاشتراك'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  if (loading) return <div className="min-h-80 grid place-items-center"><LoaderCircle className="w-8 h-8 animate-spin text-blue-600" /></div>;
  if (error || !subscription) return <div dir="rtl" className="rounded-3xl border border-rose-200 bg-white p-10 text-center"><Clock3 className="mx-auto h-12 w-12 text-rose-400" /><h2 className="mt-4 font-black text-slate-800">تعذر عرض الاشتراك</h2><p className="mt-2 text-sm text-slate-500">{error || 'لا يوجد اشتراك مرتبط بهذا الاستوديو.'}</p><button onClick={load} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-black text-white"><RefreshCw className="h-4 w-4" /> إعادة المحاولة</button></div>;

  const plan = plans[subscription.plan_code];
  const expiresAt = new Date(subscription.expires_at);
  const startsAt = new Date(subscription.starts_at);
  const isActive = subscription.enabled && expiresAt > new Date();
  const daysRemaining = Math.max(0, Math.ceil((expiresAt.getTime() - Date.now()) / 86400000));
  const totalDays = Math.max(1, Math.ceil((expiresAt.getTime() - startsAt.getTime()) / 86400000));
  const remainingPercent = Math.min(100, Math.round((daysRemaining / totalDays) * 100));
  const owner = users.find((user) => user.id === subscription.user_id);

  return <section dir="rtl" className="space-y-5">
    <div className="relative overflow-hidden rounded-3xl bg-slate-950 p-6 text-white shadow-xl sm:p-8">
      <div className="absolute -left-16 -top-20 h-64 w-64 rounded-full bg-blue-600/25 blur-3xl" />
      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div><span className="inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-400/10 px-3 py-1 text-xs font-black text-blue-300"><ShieldCheck className="h-4 w-4" /> اشتراك الاستوديو</span><h1 className="mt-4 text-2xl font-black sm:text-3xl">{plan.label}</h1><p className="mt-2 text-sm text-slate-400">اشتراك واحد يشمل مالك الاستوديو وجميع أعضاء الفريق.</p></div>
        <div className={`flex items-center gap-3 rounded-2xl border p-4 ${isActive ? 'border-emerald-400/20 bg-emerald-400/10' : 'border-rose-400/20 bg-rose-400/10'}`}><span className={`grid h-11 w-11 place-items-center rounded-xl ${isActive ? 'bg-emerald-400 text-slate-950' : 'bg-rose-500 text-white'}`}>{isActive ? <CheckCircle2 /> : <Clock3 />}</span><div><small className="text-slate-400">حالة الاشتراك</small><strong className={`block ${isActive ? 'text-emerald-300' : 'text-rose-300'}`}>{isActive ? 'نشط الآن' : 'منتهي أو موقوف'}</strong></div></div>
      </div>
    </div>

    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {[[WalletCards, 'قيمة الباقة', plan.price], [CalendarDays, 'مدة الباقة', plan.period], [Clock3, 'الأيام المتبقية', `${daysRemaining.toLocaleString('ar-EG')} يوم`], [BadgeCheck, 'مالك الاشتراك', owner?.name || 'مالك الاستوديو']].map(([Icon,label,value]: any) => <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"><Icon className="mb-4 h-5 w-5 text-blue-600" /><span className="block text-[11px] font-bold text-slate-400">{label}</span><strong className="mt-1 block text-sm text-slate-800 sm:text-base">{value}</strong></div>)}
    </div>

    <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div className="flex items-center justify-between"><div><h2 className="font-black">مدة الاشتراك</h2><p className="mt-1 text-xs text-slate-400">من {startsAt.toLocaleDateString('ar-EG')} إلى {expiresAt.toLocaleDateString('ar-EG')}</p></div><b className={isActive ? 'text-emerald-600' : 'text-rose-600'}>{remainingPercent}%</b></div><div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full transition-all ${isActive ? 'bg-emerald-500' : 'bg-rose-500'}`} style={{ width: `${remainingPercent}%` }} /></div><div className="mt-4 flex justify-between text-xs font-bold text-slate-500"><span>تاريخ البداية: {startsAt.toLocaleDateString('ar-EG')}</span><span>تاريخ الانتهاء: {expiresAt.toLocaleDateString('ar-EG')}</span></div>{subscription.notes && <div className="mt-5 rounded-xl bg-slate-50 p-3 text-xs text-slate-600"><b>ملاحظات الإدارة:</b> {subscription.notes}</div>}</div>
      <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5 sm:p-6"><h2 className="font-black text-blue-950">تجديد أو مساعدة</h2><p className="mt-2 text-sm leading-7 text-blue-800/70">تواصل مع الإدارة لتجديد الباقة أو الاستفسار عن حالة الاشتراك.</p><div className="mt-5 grid gap-2"><a href={facebookPage} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 rounded-xl bg-[#1877F2] p-3 text-sm font-black text-white"><ExternalLink className="h-5 w-5" /> تواصل مع الإدارة عبر فيسبوك</a><a href={getPhoneUrl(contact)} className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 p-3 text-sm font-black text-white"><Phone className="h-5 w-5" /> اتصال</a></div></div>
    </div>
  </section>;
}
