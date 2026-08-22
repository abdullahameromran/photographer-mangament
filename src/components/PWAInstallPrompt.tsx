import React, { useEffect, useState } from 'react';
import { Camera, Download, Share2, X } from 'lucide-react';

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallPrompt() {
  const [promptEvent, setPromptEvent] = useState<InstallPromptEvent | null>(null);
  const [showIOS, setShowIOS] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone;
    if (standalone || sessionStorage.getItem('pwa-install-dismissed')) return;
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const handler = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as InstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    if (isIOS) { setShowIOS(true); setVisible(true); }
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const close = () => { sessionStorage.setItem('pwa-install-dismissed', '1'); setVisible(false); };
  const install = async () => {
    if (!promptEvent) return;
    await promptEvent.prompt();
    const result = await promptEvent.userChoice;
    if (result.outcome === 'accepted') setVisible(false);
    setPromptEvent(null);
  };

  if (!visible) return null;
  return <div dir="rtl" className="fixed inset-x-3 bottom-4 z-[100] mx-auto max-w-md rounded-2xl border border-slate-700 bg-slate-950 p-4 text-white shadow-2xl sm:bottom-6">
    <button onClick={close} className="absolute left-3 top-3 rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white" aria-label="إغلاق"><X className="h-4 w-4" /></button>
    <div className="flex gap-3 pl-7"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-blue-600"><Camera className="h-6 w-6" /></span><div><h2 className="font-black">ثبّت Studio Flow على هاتفك</h2><p className="mt-1 text-xs leading-6 text-slate-400">افتحه من الشاشة الرئيسية كتطبيق سريع بملء الشاشة.</p></div></div>
    {showIOS && !promptEvent ? <div className="mt-4 rounded-xl bg-slate-900 p-3 text-xs leading-6 text-slate-300"><span className="flex items-center gap-2 font-black text-blue-300"><Share2 className="h-4 w-4" /> على iPhone / Safari</span>اضغط زر المشاركة، ثم اختر «إضافة إلى الشاشة الرئيسية».</div> : <button onClick={install} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 p-3 text-sm font-black hover:bg-blue-700"><Download className="h-5 w-5" /> إضافة إلى الشاشة الرئيسية</button>}
  </div>;
}
