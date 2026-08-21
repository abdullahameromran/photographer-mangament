import React, { useState } from 'react';
import { Camera, Check, Eye, EyeOff, LoaderCircle, LockKeyhole, Mail, Sparkles, UserRound } from 'lucide-react';
import { authApi, isSupabaseConfigured } from '../lib/supabase';

export function AuthPage() {
  const [mode,setMode]=useState<'login'|'signup'>('login'); const [showPassword,setShowPassword]=useState(false);
  const [name,setName]=useState(''); const [email,setEmail]=useState(''); const [password,setPassword]=useState('');
  const [loading,setLoading]=useState(false); const [error,setError]=useState(''); const [notice,setNotice]=useState('');
  const submit=async(e:React.FormEvent)=>{e.preventDefault();setError('');setNotice('');setLoading(true);try{if(password.length<6)throw new Error('كلمة المرور يجب أن تكون 6 أحرف على الأقل');if(mode==='login')await authApi.signIn(email,password);else{const result=await authApi.signUp(name,email,password);setNotice(result.needsConfirmation?'تم إنشاء الحساب. أكّد بريدك الإلكتروني، ثم انتظر تفعيل الاشتراك من الإدارة.':'تم استلام طلبك. حسابك الآن بانتظار تفعيل الاشتراك من الإدارة.');}}catch(err){setError(err instanceof Error?err.message:'حدث خطأ غير متوقع');}finally{setLoading(false);}};
  return <main dir="rtl" className="auth-shell min-h-screen text-slate-900">
    <section className="auth-showcase">
      <div className="relative z-10 max-w-lg"><div className="inline-flex items-center gap-3 mb-12"><span className="grid place-items-center w-12 h-12 rounded-2xl bg-white/10 border border-white/15"><Camera className="w-6 h-6"/></span><div><strong className="block text-xl">Studio Flow</strong><span className="text-sm text-slate-300">كل تفاصيل الاستوديو في مكان واحد</span></div></div>
      <p className="text-blue-300 font-bold text-sm mb-4 flex items-center gap-2"><Sparkles className="w-4 h-4"/> إدارة أهدأ. تصوير أفضل.</p><h1 className="text-4xl lg:text-5xl font-black leading-tight mb-5">نظّم حجوزاتك<br/>وابنِ تجربة تليق بعملائك.</h1><p className="text-slate-300 leading-8 mb-9">الحجوزات، المواعيد، المدفوعات والطباعة في لوحة عربية سريعة وآمنة لفريقك بالكامل.</p>
      <div className="grid gap-4">{['صلاحيات دقيقة لكل عضو في الفريق','متابعة الحجز من أول اتصال حتى التسليم','بيانات محمية ومزامنة عبر Supabase'].map(x=><div key={x} className="flex items-center gap-3 text-sm"><span className="grid place-items-center w-6 h-6 rounded-full bg-emerald-400/15 text-emerald-300"><Check className="w-4 h-4"/></span>{x}</div>)}</div></div>
      <div className="auth-orb auth-orb-one"/><div className="auth-orb auth-orb-two"/>
    </section>
    <section className="auth-form-panel"><div className="w-full max-w-md">
      <div className="lg:hidden flex items-center gap-2 mb-10"><span className="grid place-items-center w-10 h-10 rounded-xl bg-blue-600 text-white"><Camera className="w-5 h-5"/></span><strong>Studio Flow</strong></div>
      <div className="mb-8"><p className="text-blue-600 font-bold text-sm mb-2">{mode==='login'?'مرحباً بعودتك':'ابدأ إدارة الاستوديو'}</p><h2 className="text-3xl font-black mb-2">{mode==='login'?'تسجيل الدخول':'إنشاء حساب جديد'}</h2><p className="text-sm text-slate-500">{mode==='login'?'أدخل بيانات حسابك للوصول إلى لوحة التحكم.':'أنشئ حسابك، ويمكنك دعوة فريقك لاحقاً.'}</p></div>
      {!isSupabaseConfigured&&<div className="demo-note">الاتصال مطلوب: أنشئ ملف <b>.env</b> وأضف VITE_SUPABASE_URL و VITE_SUPABASE_ANON_KEY، ثم أعد تشغيل التطبيق.</div>}
      <form onSubmit={submit} className="space-y-5">{mode==='signup'&&<label className="auth-field"><span>الاسم بالكامل</span><div><UserRound/><input required value={name} onChange={e=>setName(e.target.value)} placeholder="مثال: أحمد محمد"/></div></label>}
      <label className="auth-field"><span>البريد الإلكتروني</span><div><Mail/><input required type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="name@studio.com"/></div></label>
      <label className="auth-field"><span>كلمة المرور</span><div><LockKeyhole/><input required type={showPassword?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)} placeholder="6 أحرف على الأقل"/><button type="button" onClick={()=>setShowPassword(!showPassword)} aria-label="إظهار كلمة المرور">{showPassword?<EyeOff/>:<Eye/>}</button></div></label>
      {error&&<p className="auth-error">{error}</p>}{notice&&<p className="auth-success">{notice}</p>}
      <button disabled={loading||!isSupabaseConfigured} className="auth-submit">{loading?<LoaderCircle className="animate-spin"/>:mode==='login'?'دخول إلى لوحة التحكم':'إنشاء الحساب'}</button></form>
      <p className="text-center text-sm text-slate-500 mt-7">{mode==='login'?'ليس لديك حساب؟':'لديك حساب بالفعل؟'} <button className="font-bold text-blue-600 hover:text-blue-700" onClick={()=>{setMode(mode==='login'?'signup':'login');setError('');setNotice('')}}>{mode==='login'?'أنشئ حساباً':'سجّل الدخول'}</button></p>
    </div></section>
  </main>;
}
