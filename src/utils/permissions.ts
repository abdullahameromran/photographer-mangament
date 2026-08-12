import { Booking, User, FieldKey } from '../types';

/**
 * Calculates financial amounts for a booking
 */
export function calculateFinancials(price: number, hasDeposit: boolean, depositAmount: number) {
  const safePrice = Math.max(0, Number(price) || 0);
  const safePaid = hasDeposit ? Math.max(0, Number(depositAmount) || 0) : 0;
  const remaining = Math.max(0, safePrice - safePaid);

  let paymentStatus: 'لم يدفع' | 'دفع جزء' | 'مدفوع بالكامل' = 'لم يدفع';
  if (safePaid >= safePrice && safePrice > 0) {
    paymentStatus = 'مدفوع بالكامل';
  } else if (safePaid > 0) {
    paymentStatus = 'دفع جزء';
  }

  return {
    price: safePrice,
    paid: safePaid,
    remaining,
    paymentStatus,
  };
}

/**
 * Filter bookings visible to a given user based on their scope setting
 */
export function filterBookingsForUser(bookings: Booking[], user: User): Booking[] {
  // System Admin or 'all' scope sees everything
  if (user.isSystemAdmin || user.permissions.bookingScope === 'all') {
    return bookings;
  }

  if (user.permissions.bookingScope === 'assigned') {
    return bookings.filter((b) => b.assignedUserIds.includes(user.id));
  }

  if (user.permissions.bookingScope === 'selected') {
    const allowedSet = new Set(user.permissions.selectedBookingIds || []);
    return bookings.filter((b) => allowedSet.has(b.id));
  }

  return [];
}

/**
 * Check if user can view a specific field
 */
export function canViewField(user: User, field: FieldKey): boolean {
  if (user.isSystemAdmin) return true;
  return !!user.permissions.fields[field]?.view;
}

/**
 * Check if user can edit a specific field
 */
export function canEditField(user: User, field: FieldKey): boolean {
  if (user.isSystemAdmin) return true;
  return !!user.permissions.fields[field]?.view && !!user.permissions.fields[field]?.edit;
}

/**
 * Check if user has an action permission (e.g. viewBooking, editBooking, createBooking)
 */
export function canPerformAction(
  user: User,
  action: keyof User['permissions']['actions']
): boolean {
  if (user.isSystemAdmin) return true;
  return !!user.permissions.actions[action];
}

/**
 * Format currency in Egyptian Pounds (EGP) in Arabic
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ar-EG', {
    style: 'currency',
    currency: 'EGP',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Arabic date formatter
 */
export function formatDateArabic(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat('ar-EG', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(d);
  } catch {
    return dateStr;
  }
}

/** Convert local Egyptian numbers to the international format WhatsApp expects. */
export function getWhatsAppUrl(phone: string, message = ''): string {
  let digits = phone.replace(/\D/g, '');
  if (digits.startsWith('0')) digits = `20${digits.slice(1)}`;
  const text = message ? `?text=${encodeURIComponent(message)}` : '';
  return `https://wa.me/${digits}${text}`;
}

export function getPhoneUrl(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, '')}`;
}
