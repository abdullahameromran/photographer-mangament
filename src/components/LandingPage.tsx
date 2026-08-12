import React from 'react';
import { ArrowLeft, BarChart3, BellRing, CalendarDays, Camera, Check, ChevronLeft, CircleDollarSign, Clock3, LockKeyhole, MessageCircle, Phone, Printer, ShieldCheck, Sparkles, UsersRound } from 'lucide-react';
import { getPhoneUrl, getWhatsAppUrl } from '../utils/permissions';

const phone = '01554607453';
const features = [
  {icon:CalendarDays,title:'إدارة الحجوزات',text:'تقويم واضح، مواعيد يومية، وحالات دقيقة لكل حجز من البداية حتى التسليم.'},
  {icon:CircleDollarSign,title:'الحسابات والمدفوعات',text:'تابع السعر والعربون والباقي ونسبة التحصيل في لحظة واحدة.'},
  {icon:UsersRound,title:'إدارة الفريق',text:'وزّع الحجوزات وحدد صلاحية كل عضو والحقول التي يمكنه رؤيتها أو تعديلها.'},
  {icon:Printer,title:'متابعة الطباعة',text:'إدارة الألبومات والتابلوهات وصور الكروت ومراحل التجهيز والتسليم.'},
  {icon:BellRing,title:'تنبيهات المواعيد',text:'تذكيرات تلقائية للحجوزات القادمة حتى لا يفوت فريقك أي موعد.'},
  {icon:BarChart3,title:'تحليلات شاملة',text:'مؤشرات الإيرادات والأداء والحجوزات القادمة والأنواع الأكثر طلباً.'},
];
const plans = [
  {name:'شهري',price:'200',period:'جنيه / شهر',note:'مرونة كاملة بدون التزام طويل'},
  {name:'3 شهور',price:'450',period:'جنيه / 3 شهور',note:'وفّر 150 جنيه',popular:true},
  {name:'سنوي',price:'1,500',period:'جنيه / سنة',note:'أفضل قيمة — وفّر 900 جنيه'},
];
const subscribeMessage = (plan:string) => `مرحباً، أريد الاشتراك في نظام إدارة الاستديو في باقة ${plan}.`;

export function LandingPage({ onLogin }: { onLogin: () => void }) {
  return <div dir="rtl" className="landing-page font-cairo text-slate-900 overflow-x-hidden">
    <nav className="landing-nav"><div className="landing-container flex items-center justify-between h-18">
      <a href="#top" className="flex items-center gap-2.5"><span className="w-10 h-10 rounded-xl bg-blue-600 text-white grid place-items-center shadow-lg shadow-blue-600/20"><Camera className="w-5 h-5"/></span><div><strong className="block text-sm sm:text-base">إدارة الاستديو</strong><span className="hidden sm:block text-[10px] text-slate-400">Studio Flow</span></div></a>
      <div className="hidden md:flex items-center gap-7 text-sm font-bold text-slate-600"><a href="#features">المميزات</a><a href="#how">كيف يعمل؟</a><a href="#pricing">الأسعار</a></div>
      <button onClick={onLogin} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:border-blue-300 hover:text-blue-700 text-xs sm:text-sm font-black transition-all"><LockKeyhole className="w-4 h-4"/> دخول العملاء</button>
    </div></nav>

    <main id="top">
      <section className="landing-hero"><div className="landing-container grid lg:grid-cols-2 gap-14 items-center relative z-10">
        <div><span className="landing-pill"><Sparkles className="w-4 h-4"/> نظام متكامل لاستوديوهات التصوير</span><h1>خلّي إدارة الاستديو<br/><em>أسهل من أي وقت.</em></h1><p>نظّم حجوزاتك، تابع حساباتك، وزّع المهام على فريقك من لوحة عربية واحدة مصممة خصيصاً لاستوديوهات التصوير.</p><div className="flex flex-col sm:flex-row gap-3 mt-8"><a href="#pricing" className="landing-primary">اختر باقتك <ArrowLeft className="w-4 h-4"/></a><button onClick={onLogin} className="landing-secondary">لدي حساب بالفعل</button></div><div className="flex flex-wrap gap-x-6 gap-y-2 mt-8 text-xs font-bold text-slate-500">{['آمن وسريع','يعمل على الموبايل','دعم عربي'].map(x=><span key={x} className="flex items-center gap-1.5"><Check className="w-4 h-4 text-emerald-500"/>{x}</span>)}</div></div>
        <div className="landing-preview"><div className="preview-top"><span/><span/><span/><b>لوحة الاستديو</b></div><div className="grid grid-cols-3 gap-3 p-5">{[['12','حجز هذا الشهر'],['24,500','إجمالي الحجوزات'],['8','جلسات قادمة']].map(([n,l])=><div key={l} className="preview-stat"><b>{n}</b><span>{l}</span></div>)}</div><div className="px-5 pb-5 grid gap-3"><div className="preview-row"><span className="preview-time">06:00</span><div><b>سيشن تصوير زفاف</b><small>أحمد ومنى • التجمع الخامس</small></div><i className="bg-emerald-100 text-emerald-700">مؤكد</i></div><div className="preview-row"><span className="preview-time">08:30</span><div><b>حنة سارة</b><small>قاعة اللوتس • مدينة نصر</small></div><i className="bg-amber-100 text-amber-700">عربون</i></div></div></div>
      </div></section>

      <section id="features" className="landing-section"><div className="landing-container"><div className="landing-heading"><span>كل ما تحتاجه</span><h2>من أول مكالمة حتى تسليم الصور</h2><p>أدوات مترابطة تمنحك رؤية كاملة على كل تفاصيل العمل.</p></div><div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">{features.map(({icon:Icon,title,text})=><article key={title} className="feature-card"><div><Icon/></div><h3>{title}</h3><p>{text}</p></article>)}</div></div></section>

      <section id="how" className="landing-section bg-slate-950 text-white"><div className="landing-container grid lg:grid-cols-2 gap-12 items-center"><div><span className="text-blue-400 text-sm font-black">شغل منظم في 3 خطوات</span><h2 className="text-3xl sm:text-4xl font-black mt-3 mb-5">ركّز في التصوير، واترك التنظيم لنا.</h2><p className="text-slate-400 leading-8">النظام يجمع تفاصيل العميل والموعد والحسابات والطباعة في مسار واحد واضح لكل الفريق.</p></div><div className="space-y-4">{[['01','سجّل الحجز','أضف بيانات العميل والموعد والسعر والعربون.'],['02','وزّع وتابع','أسند المهمة للمصور أو المساعد وتابع الحالة.'],['03','جهّز وسلّم','تابع الطباعة والباقي حتى التسليم النهائي.']].map(([n,t,d])=><div key={n} className="how-row"><b>{n}</b><div><h3>{t}</h3><p>{d}</p></div></div>)}</div></div></section>

      <section id="pricing" className="landing-section pricing-bg"><div className="landing-container"><div className="landing-heading"><span>باقات بسيطة وواضحة</span><h2>اختر مدة اشتراكك</h2><p>كل الباقات تمنحك مميزات النظام الأساسية ودعم التواصل المباشر.</p></div><div className="grid md:grid-cols-3 gap-5 max-w-5xl mx-auto">{plans.map(plan=><article key={plan.name} className={`price-card ${plan.popular?'popular':''}`}>{plan.popular&&<span className="popular-label">الأكثر اختياراً</span>}<h3>{plan.name}</h3><div className="price"><b>{plan.price}</b><span>{plan.period}</span></div><p>{plan.note}</p><ul>{['إدارة الحجوزات والعملاء','الحسابات والطباعة','التنبيهات والتحليلات','صلاحيات أعضاء الفريق'].map(x=><li key={x}><Check/>{x}</li>)}</ul><div className="grid grid-cols-2 gap-2 mt-7"><a href={getWhatsAppUrl(phone,subscribeMessage(plan.name))} target="_blank" rel="noreferrer" className="price-whatsapp"><MessageCircle/> واتساب</a><a href={getPhoneUrl(phone)} className="price-call"><Phone/> اتصال</a></div></article>)}</div><div className="text-center mt-8 text-sm text-slate-500">تحتاج مساعدة في اختيار الباقة؟ <a dir="ltr" href={getPhoneUrl(phone)} className="font-black text-blue-700">{phone}</a></div></div></section>

      <section className="landing-cta"><div className="landing-container text-center relative z-10"><ShieldCheck className="w-12 h-12 mx-auto text-blue-300 mb-5"/><h2>جاهز ترتّب شغلك وتكبر استوديوك؟</h2><p>تواصل معنا الآن وسنساعدك في بدء حسابك واختيار الباقة المناسبة.</p><div className="flex flex-col sm:flex-row justify-center gap-3 mt-7"><a href={getWhatsAppUrl(phone,'مرحباً، أريد معرفة المزيد عن نظام إدارة الاستديو.')} target="_blank" rel="noreferrer" className="landing-primary bg-emerald-500 hover:bg-emerald-600"><MessageCircle/> تواصل عبر واتساب</a><a href={getPhoneUrl(phone)} className="landing-secondary border-white/20 bg-white/10 text-white hover:bg-white/20"><Phone/> اتصل بنا: <span dir="ltr">{phone}</span></a></div></div></section>
    </main>
    <footer className="bg-slate-950 text-slate-500 border-t border-slate-800"><div className="landing-container py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs"><span>© {new Date().getFullYear()} إدارة الاستديو — جميع الحقوق محفوظة</span><button onClick={onLogin} className="hover:text-white transition-colors">دخول العملاء <ChevronLeft className="inline w-3 h-3"/></button></div></footer>
  </div>;
}
