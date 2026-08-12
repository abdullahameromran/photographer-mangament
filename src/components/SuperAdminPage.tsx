import React, { useEffect, useState } from "react";
import {
  CalendarClock,
  CheckCircle2,
  Clock3,
  KeyRound,
  LoaderCircle,
  LogOut,
  MessageCircle,
  Phone,
  Plus,
  RefreshCw,
  ShieldCheck,
  UserRound,
  XCircle,
} from "lucide-react";
import { authApi, Subscriber, subscriptionApi } from "../lib/supabase";
import { getPhoneUrl, getWhatsAppUrl } from "../utils/permissions";

const contact = "201554670453";
const plans = {
  monthly: { label: "شهر", price: 200 },
  quarterly: { label: "3 شهور", price: 450 },
  yearly: { label: "سنة", price: 1500 },
} as const;
const profileName = (s: Subscriber) => {
  const p = Array.isArray(s.profiles) ? s.profiles[0] : s.profiles;
  const name = p?.full_name?.trim();
  return name && !/^\?+$/.test(name) ? name : "مشترك بدون اسم";
};
const profilePhone = (s: Subscriber) => {
  const p = Array.isArray(s.profiles) ? s.profiles[0] : s.profiles;
  return p?.phone || "";
};

export function SuperAdminPage() {
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [rows, setRows] = useState<Subscriber[]>([]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    plan: "quarterly",
  });
  const load = async () => {
    setAllowed(null);
    try {
      const ok = await subscriptionApi.isSuperAdmin();
      setAllowed(ok);
      if (ok) setRows(await subscriptionApi.list());
    } catch (e) {
      setError(e instanceof Error ? e.message : "تعذر التحميل");
      setAllowed(false);
    }
  };
  useEffect(() => {
    load();
  }, []);
  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await subscriptionApi.create(form);
      setOpen(false);
      setForm({
        name: "",
        email: "",
        phone: "",
        password: "",
        plan: "quarterly",
      });
      setRows(await subscriptionApi.list());
    } catch (e) {
      setError(e instanceof Error ? e.message : "تعذر إنشاء الحساب");
    } finally {
      setBusy(false);
    }
  };
  if (allowed === null)
    return (
      <div className="min-h-screen bg-slate-950 text-white grid place-items-center">
        <LoaderCircle className="animate-spin text-blue-400" />
      </div>
    );
  if (!allowed)
    return (
      <div
        dir="rtl"
        className="min-h-screen bg-slate-950 text-white grid place-items-center p-5 font-cairo"
      >
        <div className="max-w-md text-center">
          <ShieldCheck className="w-14 h-14 text-rose-400 mx-auto mb-5" />
          <h1 className="text-2xl font-black">صفحة خاصة بمدير النظام</h1>
            <p className="text-slate-400 text-sm leading-7 mt-3">
              هذا الحساب غير مصرح له بإدارة المشتركين.
            </p>
            <p dir="ltr" className="mt-3 text-xs font-bold text-slate-500 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2">
              {authApi.currentUser()?.email || "No active account"}
            </p>
          <button
            onClick={() => {
                  authApi.signOut();
                  location.href = "/super_admin";
            }}
            className="mt-6 bg-white text-slate-900 rounded-xl px-5 py-3 font-black text-sm"
          >
            تسجيل الدخول بحساب آخر
          </button>
        </div>
      </div>
    );
  const active = rows.filter(
    (x) => x.enabled && new Date(x.expires_at) > new Date(),
  ).length;
  const expired = rows.length - active;
  return (
    <div
      dir="rtl"
      className="min-h-screen bg-slate-100 font-cairo text-slate-900"
    >
      <header className="bg-slate-950 text-white border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-blue-600 grid place-items-center">
              <ShieldCheck />
            </span>
            <div>
              <h1 className="font-black">إدارة المشتركين</h1>
              <p className="text-[10px] text-slate-400">
                Studio Flow Super Admin
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={load} className="p-2.5 bg-slate-800 rounded-lg">
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                authApi.signOut();
                location.href = "/super_admin";
              }}
              className="p-2.5 bg-slate-800 text-rose-400 rounded-lg"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
        <section className="grid grid-cols-3 gap-3">
          {[
            [rows.length, "كل المشتركين", UserRound, "blue"],
            [active, "اشتراكات نشطة", CheckCircle2, "emerald"],
            [expired, "منتهية / مغلقة", XCircle, "rose"],
          ].map(([n, l, I, c]: any) => (
            <div
              key={l}
              className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5"
            >
              <I className={`w-5 h-5 text-${c}-600 mb-3`} />
              <b className="text-2xl block">{n}</b>
              <span className="text-[10px] sm:text-xs text-slate-400 font-bold">
                {l}
              </span>
            </div>
          ))}
        </section>
        <section className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="font-black">حسابات العملاء</h2>
              <p className="text-xs text-slate-400 mt-1">
                تفعيل وتجديد وإيقاف الاشتراكات
              </p>
            </div>
            <button
              onClick={() => setOpen(true)}
              className="bg-blue-600 text-white px-4 py-2.5 rounded-xl font-black text-xs flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> حساب جديد
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {rows.map((s) => {
              const isActive = s.enabled && new Date(s.expires_at) > new Date();
              const days = Math.max(
                0,
                Math.ceil(
                  (new Date(s.expires_at).getTime() - Date.now()) / 86400000,
                ),
              );
              return (
                <div
                  key={s.user_id}
                  className="p-4 sm:p-5 grid md:grid-cols-[1fr_auto] gap-4 items-center"
                >
                  <div className="flex gap-3 min-w-0">
                    <span
                      className={`w-11 h-11 rounded-xl grid place-items-center shrink-0 ${isActive ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}
                    >
                      <UserRound className="w-5 h-5" />
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-black truncate">
                          {profileName(s)}
                        </h3>
                        <span
                          className={`text-[10px] px-2 py-1 rounded-full font-black ${isActive ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}
                        >
                          {isActive ? `نشط • ${days} يوم` : "الاشتراك مغلق"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        باقة {plans[s.plan_code].label} • ينتهي{" "}
                        {new Date(s.expires_at).toLocaleDateString("ar-EG")}
                        {profilePhone(s) && ` • ${profilePhone(s)}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {profilePhone(s) && (
                      <>
                        <a href={getPhoneUrl(profilePhone(s))} title="اتصال" className="p-2 bg-blue-50 text-blue-700 rounded-lg"><Phone className="w-4 h-4" /></a>
                        <a href={getWhatsAppUrl(profilePhone(s), "مرحباً، بخصوص اشتراكك في نظام إدارة الاستديو.")} target="_blank" rel="noreferrer" title="واتساب" className="p-2 bg-emerald-50 text-emerald-700 rounded-lg"><MessageCircle className="w-4 h-4" /></a>
                      </>
                    )}
                    <select
                      defaultValue={s.plan_code}
                      id={`plan-${s.user_id}`}
                      className="bg-slate-50 border border-slate-200 rounded-lg px-2 text-xs font-bold"
                    >
                      <option value="monthly">شهر</option>
                      <option value="quarterly">3 شهور</option>
                      <option value="yearly">سنة</option>
                    </select>
                    <button
                      onClick={async () => {
                        const el = document.getElementById(
                          `plan-${s.user_id}`,
                        ) as HTMLSelectElement;
                        await subscriptionApi.extend(
                          s.user_id,
                          el.value as any,
                        );
                        setRows(await subscriptionApi.list());
                      }}
                      className="px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-black"
                    >
                      تجديد
                    </button>
                    <button
                      onClick={async () => {
                        await subscriptionApi.update(s.user_id, {
                          enabled: !s.enabled,
                        });
                        setRows(await subscriptionApi.list());
                      }}
                      className="px-3 py-2 bg-slate-100 rounded-lg text-xs font-black"
                    >
                      {s.enabled ? "إيقاف" : "تفعيل"}
                    </button>
                  </div>
                </div>
              );
            })}
            {!rows.length && (
              <div className="p-12 text-center text-slate-400 text-sm">
                لا يوجد مشتركون بعد
              </div>
            )}
          </div>
        </section>
      </main>
      {open && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm grid place-items-center p-4">
          <form
            onSubmit={create}
            className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl"
          >
            <h2 className="text-xl font-black mb-1">إضافة حساب مشترك</h2>
            <p className="text-xs text-slate-400 mb-5">
              سيتم إنشاء الحساب وتفعيل الباقة فوراً.
            </p>
            {error && (
              <p className="bg-rose-50 text-rose-700 p-3 rounded-xl text-xs mb-4">
                {error}
              </p>
            )}
            <div className="space-y-4">
              {[
                ["name", "اسم العميل", "text"],
                ["email", "البريد الإلكتروني", "email"],
                ["phone", "رقم الهاتف", "tel"],
                ["password", "كلمة المرور المؤقتة", "password"],
              ].map(([key, label, type]) => (
                <label key={key} className="block">
                  <span className="text-xs font-black block mb-1.5">
                    {label}
                  </span>
                  <input
                    required
                    minLength={key === "password" ? 8 : key === "phone" ? 11 : 2}
                    maxLength={key === "phone" ? 11 : undefined}
                    inputMode={key === "phone" ? "numeric" : undefined}
                    pattern={key === "phone" ? "01[0125][0-9]{8}" : undefined}
                    type={type}
                    value={(form as any)[key]}
                    onChange={(e) => setForm({ ...form, [key]: key === "phone" ? e.target.value.replace(/\D/g, "").slice(0, 11) : e.target.value })}
                    placeholder={key === "phone" ? "01554607453" : undefined}
                    className="w-full border border-slate-200 bg-slate-50 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </label>
              ))}
              <label className="block">
                <span className="text-xs font-black block mb-1.5">الباقة</span>
                <select
                  value={form.plan}
                  onChange={(e) => setForm({ ...form, plan: e.target.value })}
                  className="w-full border border-slate-200 bg-slate-50 rounded-xl p-3"
                >
                  <option value="monthly">شهر — 200 جنيه</option>
                  <option value="quarterly">3 شهور — 450 جنيه</option>
                  <option value="yearly">سنة — 1500 جنيه</option>
                </select>
              </label>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-6">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-3 rounded-xl border border-slate-200 font-black text-sm"
              >
                إلغاء
              </button>
              <button
                disabled={busy}
                className="p-3 rounded-xl bg-blue-600 text-white font-black text-sm"
              >
                {busy ? "جاري الإنشاء…" : "إنشاء وتفعيل"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export function SubscriptionExpired() {
  return (
    <div
      dir="rtl"
      className="min-h-screen bg-slate-950 text-white grid place-items-center p-5 font-cairo"
    >
      <div className="max-w-lg text-center">
        <Clock3 className="w-16 h-16 mx-auto text-amber-400 mb-5" />
        <h1 className="text-3xl font-black">انتهت مدة الاشتراك</h1>
        <p className="text-slate-400 leading-8 mt-4">
          تم إغلاق لوحة التحكم مؤقتاً. جدّد باقتك لتفعيل الحساب والوصول إلى
          بيانات الاستديو مرة أخرى.
        </p>
        <div className="grid sm:grid-cols-2 gap-3 mt-7">
          <a
            href={getWhatsAppUrl(
              contact,
              "مرحباً، أريد تجديد اشتراكي في نظام إدارة الاستديو.",
            )}
            className="bg-emerald-500 rounded-xl p-3 font-black flex justify-center gap-2"
          >
            <MessageCircle /> واتساب
          </a>
          <a
            href={getPhoneUrl(contact)}
            className="bg-blue-600 rounded-xl p-3 font-black flex justify-center gap-2"
          >
            <Phone /> <span dir="ltr">{contact}</span>
          </a>
        </div>
      </div>
    </div>
  );
}
