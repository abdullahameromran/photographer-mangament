import React, { useEffect, useState } from 'react';
import { Bell, BellRing, BellOff } from 'lucide-react';
import type { Booking, ReminderOption } from '../types';
import { formatTimeArabic } from '../utils/permissions';

const offsets: Partial<Record<ReminderOption, number>> = {
  'قبل ساعة': 60, 'قبل ساعتين': 120, 'قبل 3 ساعات': 180,
  'قبل 6 ساعات': 360, 'قبل 12 ساعة': 720, 'قبل يوم': 1440,
};
const sentStorageKey = 'studio_flow_sent_browser_reminders';

function getSent(): Record<string, number> {
  try { return JSON.parse(localStorage.getItem(sentStorageKey) || '{}'); } catch { return {}; }
}

async function showBookingNotification(booking: Booking) {
  const registration = await navigator.serviceWorker?.ready;
  const options: NotificationOptions = {
    body: `${booking.customerName} • ${formatTimeArabic(booking.startTime)} • ${booking.location || 'الموقع غير محدد'}`,
    icon: '/favicon.svg', badge: '/favicon.svg', tag: `booking-${booking.id}`,
    data: { bookingId: booking.id }, requireInteraction: true,
  };
  if (registration) await registration.showNotification(`تذكير: ${booking.title}`, options);
  else new Notification(`تذكير: ${booking.title}`, options);
}

export function NotificationReminders({ bookings }: { bookings: Booking[] }) {
  const supported = typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator;
  const [permission, setPermission] = useState<NotificationPermission>(supported ? Notification.permission : 'denied');

  useEffect(() => {
    if (!supported) return;
    navigator.serviceWorker.register('/sw.js').catch(console.error);
  }, [supported]);

  useEffect(() => {
    if (!supported || permission !== 'granted') return;
    const check = () => {
      const now = Date.now(); const sent = getSent();
      Object.keys(sent).forEach((key) => { if (now - sent[key] > 7 * 86400000) delete sent[key]; });
      bookings.forEach((booking) => {
        const offset = offsets[booking.reminder]; if (offset === undefined || !booking.date || !booking.startTime) return;
        const bookingAt = new Date(`${booking.date}T${booking.startTime}:00`).getTime();
        const remindAt = bookingAt - offset * 60000; const key = `${booking.id}-${remindAt}`;
        if (now >= remindAt && now < bookingAt && !sent[key]) {
          sent[key] = now; showBookingNotification(booking).catch(console.error);
        }
      });
      localStorage.setItem(sentStorageKey, JSON.stringify(sent));
    };
    check(); const timer = window.setInterval(check, 30000); return () => window.clearInterval(timer);
  }, [bookings, permission, supported]);

  const enable = async () => { if (!supported) return; const result = await Notification.requestPermission(); setPermission(result); if (result === 'granted') { await navigator.serviceWorker.ready; new Notification('تم تفعيل تنبيهات Studio Flow', { body: 'سنذكّرك بمواعيد الحجوزات في الوقت المحدد.', icon: '/favicon.svg' }); } };
  const enabled = permission === 'granted';
  return <button type="button" onClick={enable} disabled={!supported || permission === 'denied'} title={!supported?'المتصفح لا يدعم التنبيهات':permission==='denied'?'التنبيهات محظورة من إعدادات المتصفح':enabled?'التنبيهات مفعّلة':'تفعيل تنبيهات الحجوزات'} aria-label="تنبيهات الحجوزات" className={`relative p-2.5 rounded-lg border transition-colors ${enabled?'bg-emerald-500/10 border-emerald-500/30 text-emerald-400':'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'} disabled:opacity-50`}>
    {permission==='denied'?<BellOff className="w-4 h-4"/>:enabled?<BellRing className="w-4 h-4"/>:<Bell className="w-4 h-4"/>}
    {enabled&&<span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-slate-900"/>}
  </button>;
}
