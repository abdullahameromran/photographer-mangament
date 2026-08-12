import {
  ALL_FIELD_KEYS,
  type Booking,
  type BookingStatus,
  type BookingType,
  type PrintStatus,
  type ReminderOption,
  type User,
  type FieldKey,
} from "../types";

const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.replace(
  /\/$/,
  "",
);
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
const sessionKey = "photo_studio_supabase_session";

export const isSupabaseConfigured = Boolean(
  url && anonKey && !url.includes("YOUR_PROJECT"),
);

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
}

interface StoredSession {
  access_token: string;
  refresh_token: string;
  expires_at?: number;
  user: { id: string; email?: string; user_metadata?: Record<string, string> };
}

const readSession = (): StoredSession | null => {
  try {
    return JSON.parse(localStorage.getItem(sessionKey) || "null");
  } catch {
    return null;
  }
};

const saveSession = (value: StoredSession | null) => {
  if (value) localStorage.setItem(sessionKey, JSON.stringify(value));
  else localStorage.removeItem(sessionKey);
  window.dispatchEvent(new Event("studio-auth-change"));
};
let refreshInFlight: Promise<boolean> | null = null;

const authHeaders = () => ({
  apikey: anonKey || "",
  Authorization: `Bearer ${readSession()?.access_token || anonKey || ""}`,
  "Content-Type": "application/json",
});

async function parseResponse(response: Response) {
  const body = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new Error(
      body.msg ||
        body.message ||
        body.error_description ||
        body.hint ||
        "تعذر إكمال الطلب",
    );
  return body;
}

export const authApi = {
  currentUser(): AuthUser | null {
    if (!isSupabaseConfigured) return null;
    const session = readSession();
    // Remove sessions created by the old local demo mode or malformed/expired state.
    if (
      !session?.access_token ||
      session.access_token.split(".").length !== 3
    ) {
      if (session) localStorage.removeItem(sessionKey);
      return null;
    }
    const user = session.user;
    return user
      ? {
          id: user.id,
          email: user.email || "",
          fullName:
            user.user_metadata?.full_name ||
            user.email?.split("@")[0] ||
            "مستخدم",
        }
      : null;
  },
  async signIn(email: string, password: string) {
    if (!isSupabaseConfigured)
      throw new Error("أضف بيانات Supabase في ملف .env أولاً");
    const data = await parseResponse(
      await fetch(`${url}/auth/v1/token?grant_type=password`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ email, password }),
      }),
    );
    saveSession(data);
  },
  async signUp(fullName: string, email: string, password: string) {
    if (!isSupabaseConfigured)
      throw new Error("أضف بيانات Supabase في ملف .env أولاً");
    const data = await parseResponse(
      await fetch(`${url}/auth/v1/signup`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          email,
          password,
          data: { full_name: fullName },
        }),
      }),
    );
    if (data.access_token) saveSession(data);
    return { needsConfirmation: !data.access_token };
  },
  async refreshSession(): Promise<boolean> {
    if (refreshInFlight) return refreshInFlight;
    const refreshToken = readSession()?.refresh_token;
    if (!isSupabaseConfigured || !refreshToken) {
      saveSession(null);
      return false;
    }
    refreshInFlight = (async () => {
      try {
        const response = await fetch(
          `${url}/auth/v1/token?grant_type=refresh_token`,
          {
            method: "POST",
            headers: {
              apikey: anonKey || "",
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ refresh_token: refreshToken }),
          },
        );
        const data = await parseResponse(response);
        saveSession(data);
        return true;
      } catch {
        saveSession(null);
        return false;
      } finally {
        refreshInFlight = null;
      }
    })();
    return refreshInFlight;
  },
  async updatePassword(password: string) {
    if (!isSupabaseConfigured) throw new Error("Supabase غير متصل");
    const response = await fetch(`${url}/auth/v1/user`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify({ password }),
    });
    if (response.status === 401 && (await this.refreshSession())) {
      return parseResponse(
        await fetch(`${url}/auth/v1/user`, {
          method: "PUT",
          headers: authHeaders(),
          body: JSON.stringify({ password }),
        }),
      );
    }
    return parseResponse(response);
  },
  signOut() {
    saveSession(null);
  },
};

const statusToDb: Record<BookingStatus, string> = {
  جديد: "new",
  "في انتظار العربون": "waiting_deposit",
  مؤكد: "confirmed",
  قادم: "upcoming",
  "تم التصوير": "photographed",
  "جاري التجهيز": "preparing",
  جاهز: "ready",
  "تم التسليم": "delivered",
  ملغي: "cancelled",
};
const statusFromDb = Object.fromEntries(
  Object.entries(statusToDb).map(([a, b]) => [b, a]),
) as Record<string, BookingStatus>;
const typeToDb: Record<BookingType, string> = {
  سيشن: "session",
  قاعة: "hall",
  حنة: "henna",
  شبكة: "shabaka",
  "كتب كتاب": "katb_ketab",
  بارتي: "party",
  Wedding: "wedding",
  أخرى: "other",
};
const typeFromDb = Object.fromEntries(
  Object.entries(typeToDb).map(([a, b]) => [b, a]),
) as Record<string, BookingType>;
const printToDb: Record<PrintStatus, string> = {
  "لم تبدأ": "not_started",
  "جاري التجهيز": "preparing",
  جاهزة: "ready",
  "تم التسليم": "delivered",
};
const printFromDb = Object.fromEntries(
  Object.entries(printToDb).map(([a, b]) => [b, a]),
) as Record<string, PrintStatus>;
const reminderFromDb: Record<string, ReminderOption> = {
  "1h": "قبل ساعة",
  "2h": "قبل ساعتين",
  "3h": "قبل 3 ساعات",
  "6h": "قبل 6 ساعات",
  "12h": "قبل 12 ساعة",
  "1d": "قبل يوم",
  custom: "مخصص",
};

const toBooking = (row: any): Booking => {
  const printing = Array.isArray(row.booking_printing)
    ? row.booking_printing[0]
    : row.booking_printing;
  const reminder = Array.isArray(row.booking_reminders)
    ? row.booking_reminders[0]
    : undefined;
  return {
    id: row.id,
    customerName: row.customer_name || "",
    phone: row.customer_phone || "",
    whatsapp: row.customer_whatsapp || "",
    title: row.title || row.customer_name || "",
    bookingTypes: (row.booking_types || []).map(
      (t: string) => typeFromDb[t] || "أخرى",
    ),
    typeSchedules: (row.type_schedules || []).map((schedule: any) => ({
      ...schedule,
      type: typeFromDb[schedule.type] || schedule.type,
    })),
    date: row.booking_date,
    startTime: row.start_time?.slice(0, 5) || "",
    endTime: row.end_time?.slice(0, 5) || "",
    location: row.location || "",
    mapUrl: row.location_url || "",
    notes: row.notes || "",
    price: Number(row.price || 0),
    hasDeposit: Boolean(row.deposit_paid),
    depositAmount: Number(row.deposit_amount || 0),
    depositReceiptUrl: row.deposit_receipt_url || "",
    hasPrint: Boolean(printing?.has_printing),
    printOptions: {
      largeCanvas: Boolean(printing?.large_tableau),
      smallCanvas: Boolean(printing?.small_tableau),
      album30x45: Boolean(printing?.album_30x45),
      album30x60: Boolean(printing?.album_30x60),
      photoCards: Boolean(printing?.card_photos),
      photoCardsCount: Number(printing?.card_photos_count || 0),
    },
    printStatus: printFromDb[printing?.printing_status] || "لم تبدأ",
    reminder: reminderFromDb[reminder?.reminder_type] || "قبل يوم",
    assignedUserIds: (row.booking_assignees || []).map((a: any) => a.user_id),
    status: statusFromDb[row.status] || "جديد",
    createdAt: row.created_at?.slice(0, 10) || row.booking_date,
  };
};

const bookingRow = (b: Partial<Booking>) => ({
  customer_name: b.customerName,
  customer_phone: b.phone,
  customer_whatsapp: b.whatsapp,
  title: b.title,
  booking_types: b.bookingTypes?.map((t) => typeToDb[t]),
  type_schedules: b.typeSchedules?.map((schedule) => ({
    ...schedule,
    type: typeToDb[schedule.type],
  })),
  booking_date: b.date,
  start_time: b.startTime || null,
  end_time: b.endTime || null,
  location: b.location,
  location_url: b.mapUrl || null,
  notes: b.notes,
  price: b.price,
  deposit_paid: b.hasDeposit,
  deposit_amount: b.depositAmount,
  deposit_receipt_url: b.depositReceiptUrl || null,
  ...(b.status ? { status: statusToDb[b.status] } : {}),
});

export const storageApi = {
  async uploadDepositReceipt(file: File) {
    if (!url || !isSupabaseConfigured) throw new Error("اتصال Supabase غير متاح");
    const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const objectPath = `${readSession()?.user.id || "user"}/${crypto.randomUUID()}.${extension}`;
    const response = await fetch(`${url}/storage/v1/object/deposit-receipts/${objectPath}`, {
      method: "POST",
      headers: {
        apikey: anonKey || "",
        Authorization: `Bearer ${readSession()?.access_token || anonKey || ""}`,
        "Content-Type": file.type,
        "x-upsert": "false",
      },
      body: file,
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || error.error || "تعذر رفع صورة العربون");
    }
    return `${url}/storage/v1/object/public/deposit-receipts/${objectPath}`;
  },
};

async function rest(path: string, init: RequestInit = {}) {
  const request = () =>
    fetch(`${url}/rest/v1/${path}`, {
      ...init,
      headers: {
        ...authHeaders(),
        Prefer: "return=representation",
        ...(init.headers || {}),
      },
    });
  let response = await request();
  if (response.status === 401 && (await authApi.refreshSession()))
    response = await request();
  return parseResponse(response);
}

export const bookingsApi = {
  async list() {
    if (!isSupabaseConfigured) return null;
    return (
      await rest(
        "bookings?select=*,booking_printing(*),booking_assignees(user_id),booking_reminders(*)&order=booking_date.asc",
      )
    ).map(toBooking);
  },
  async create(data: Booking) {
    const rows = await rest("bookings", {
      method: "POST",
      body: JSON.stringify(bookingRow(data)),
    });
    const id = rows[0].id;
    await Promise.all([
      rest("booking_printing", {
        method: "POST",
        body: JSON.stringify({
          booking_id: id,
          has_printing: data.hasPrint,
          large_tableau: data.printOptions.largeCanvas,
          small_tableau: data.printOptions.smallCanvas,
          album_30x45: data.printOptions.album30x45,
          album_30x60: data.printOptions.album30x60,
          card_photos: data.printOptions.photoCards,
          card_photos_count: data.printOptions.photoCards
            ? data.printOptions.photoCardsCount
            : null,
          printing_status: printToDb[data.printStatus],
        }),
      }),
      data.assignedUserIds.length
        ? rest("booking_assignees", {
            method: "POST",
            body: JSON.stringify(
              data.assignedUserIds.map((user_id) => ({
                booking_id: id,
                user_id,
              })),
            ),
          })
        : Promise.resolve(),
      rest("booking_reminders", {
        method: "POST",
        body: JSON.stringify({
          booking_id: id,
          reminder_type:
            Object.entries(reminderFromDb).find(
              ([, label]) => label === data.reminder,
            )?.[0] || "1d",
        }),
      }),
    ]);
    return id as string;
  },
  async update(id: string, data: Partial<Booking>) {
    await rest(`bookings?id=eq.${id}`, {
      method: "PATCH",
      body: JSON.stringify(bookingRow(data)),
    });
    if (data.printOptions) {
      await rest(`booking_printing?booking_id=eq.${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          has_printing: data.hasPrint,
          large_tableau: data.printOptions.largeCanvas,
          small_tableau: data.printOptions.smallCanvas,
          album_30x45: data.printOptions.album30x45,
          album_30x60: data.printOptions.album30x60,
          card_photos: data.printOptions.photoCards,
          card_photos_count: data.printOptions.photoCards
            ? data.printOptions.photoCardsCount
            : null,
          printing_status: data.printStatus
            ? printToDb[data.printStatus]
            : undefined,
        }),
      });
    }
    if (data.assignedUserIds) {
      await rest(`booking_assignees?booking_id=eq.${id}`, { method: "DELETE" });
      if (data.assignedUserIds.length)
        await rest("booking_assignees", {
          method: "POST",
          body: JSON.stringify(
            data.assignedUserIds.map((user_id) => ({
              booking_id: id,
              user_id,
            })),
          ),
        });
    }
  },
  async remove(id: string) {
    await rest(`bookings?id=eq.${id}`, { method: "DELETE" });
  },
  async updatePrintStatus(id: string, status: PrintStatus) {
    await rest(`booking_printing?booking_id=eq.${id}`, {
      method: "PATCH",
      body: JSON.stringify({ printing_status: printToDb[status] }),
    });
  },
};

const fieldMap: Partial<Record<FieldKey, string>> = {
  customerName: "customer_name",
  phone: "customer_phone",
  whatsapp: "customer_phone",
  bookingTypes: "booking_type",
  date: "booking_date",
  time: "time",
  location: "location",
  price: "price",
  depositAmount: "deposit",
  remaining: "remaining",
  printSettings: "printing",
  notes: "notes",
  reminder: "reminder",
};
const avatarFor = (id: string) =>
  `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(id)}&backgroundColor=2563eb,0f172a`;

const toUser = (row: any): User => {
  const permission = Array.isArray(row.user_permissions)
    ? row.user_permissions[0]
    : row.user_permissions;
  const grants = row.user_field_permissions || [];
  const fields = Object.fromEntries(
    ALL_FIELD_KEYS.map(({ key }) => {
      const db = fieldMap[key];
      const grant = grants.find((g: any) => g.field_name === db);
      return [
        key,
        {
          view: row.is_admin || Boolean(grant?.can_view),
          edit: row.is_admin || Boolean(grant?.can_edit),
        },
      ];
    }),
  ) as User["permissions"]["fields"];
  return {
    id: row.id,
    name: row.full_name,
    email: row.email || "",
    role: row.is_admin ? "Admin" : row.job_title || "موظف",
    status: row.status === "disabled" ? "Disabled" : "Active",
    avatar: avatarFor(row.full_name),
    isSystemAdmin: row.is_admin,
    permissions: {
      bookingScope:
        permission?.booking_scope === "assigned_only"
          ? "assigned"
          : permission?.booking_scope || "assigned",
      selectedBookingIds: (row.user_selected_bookings || []).map(
        (x: any) => x.booking_id,
      ),
      actions: {
        viewBooking: row.is_admin || Boolean(permission?.can_view_bookings),
        createBooking: row.is_admin || Boolean(permission?.can_create_booking),
        editBooking: row.is_admin || Boolean(permission?.can_edit_booking),
        deleteBooking: row.is_admin || Boolean(permission?.can_delete_booking),
        changeStatus: row.is_admin || Boolean(permission?.can_change_status),
        addNotes: row.is_admin || Boolean(permission?.can_add_notes),
      },
      fields,
    },
  };
};

export const usersApi = {
  async list() {
    if (!isSupabaseConfigured) return [];
    const rows = await rest(
      "profiles?select=*,user_permissions(*),user_field_permissions(*),user_selected_bookings(booking_id)&order=created_at.asc",
    );
    return rows.map(toUser) as User[];
  },
  async update(user: User) {
    await rest(`profiles?id=eq.${user.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        full_name: user.name,
        job_title: user.role === "Admin" ? "Owner" : user.role,
        is_admin: Boolean(user.isSystemAdmin),
        status: user.status === "Disabled" ? "disabled" : "active",
      }),
    });
    await rest(`user_permissions?user_id=eq.${user.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        can_view_bookings: user.permissions.actions.viewBooking,
        can_create_booking: user.permissions.actions.createBooking,
        can_edit_booking: user.permissions.actions.editBooking,
        can_delete_booking: user.permissions.actions.deleteBooking,
        can_change_status: user.permissions.actions.changeStatus,
        can_add_notes: user.permissions.actions.addNotes,
        booking_scope:
          user.permissions.bookingScope === "assigned"
            ? "assigned_only"
            : user.permissions.bookingScope,
      }),
    });
    const unique = new Map<
      string,
      {
        user_id: string;
        field_name: string;
        can_view: boolean;
        can_edit: boolean;
      }
    >();
    for (const [key, db] of Object.entries(fieldMap)) {
      if (!db) continue;
      const value = user.permissions.fields[key as FieldKey];
      const old = unique.get(db);
      unique.set(db, {
        user_id: user.id,
        field_name: db,
        can_view: Boolean(old?.can_view || value?.view),
        can_edit: Boolean(old?.can_edit || value?.edit),
      });
    }
    await rest(`user_field_permissions?user_id=eq.${user.id}`, {
      method: "DELETE",
    });
    await rest("user_field_permissions", {
      method: "POST",
      body: JSON.stringify([...unique.values()]),
    });
    await rest(`user_selected_bookings?user_id=eq.${user.id}`, {
      method: "DELETE",
    });
    if (
      user.permissions.bookingScope === "selected" &&
      user.permissions.selectedBookingIds.length
    )
      await rest("user_selected_bookings", {
        method: "POST",
        body: JSON.stringify(
          user.permissions.selectedBookingIds.map((booking_id) => ({
            user_id: user.id,
            booking_id,
          })),
        ),
      });
  },
  async removeProfile(id: string) {
    await rest(`profiles?id=eq.${id}`, { method: "DELETE" });
  },
};

export interface Subscriber {
  user_id: string;
  plan_code: "trial" | "monthly" | "quarterly" | "yearly";
  starts_at: string;
  expires_at: string;
  enabled: boolean;
  notes?: string;
  profiles?:
    | { full_name: string; job_title?: string; phone?: string }
    | Array<{ full_name: string; job_title?: string; phone?: string }>;
}
export const subscriptionApi = {
  async isSuperAdmin() {
    if (!isSupabaseConfigured) return false;
    const rows = await rest(
      `super_admins?user_id=eq.${authApi.currentUser()?.id}&select=user_id`,
    );
    return rows.length > 0;
  },
  async current() {
    if (!isSupabaseConfigured) return null;
    const id = authApi.currentUser()?.id;
    if (!id) return null;
    const rows = await rest(`subscriptions?user_id=eq.${id}&select=*`);
    return (rows[0] || null) as Subscriber | null;
  },
  async list() {
    return (await rest(
      "subscriptions?select=*,profiles(full_name,job_title,phone)&order=created_at.desc",
    )) as Subscriber[];
  },
  async create(input: {
    name: string;
    email: string;
    password: string;
    phone: string;
    plan: string;
  }) {
    const response = await fetch(`${url}/functions/v1/create-subscriber`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(input),
    });
    return parseResponse(response);
  },
  async update(
    userId: string,
    data: Partial<
      Pick<Subscriber, "plan_code" | "expires_at" | "enabled" | "notes">
    >,
  ) {
    await rest(`subscriptions?user_id=eq.${userId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },
  async extend(
    userId: string,
    plan: "trial" | "monthly" | "quarterly" | "yearly",
  ) {
    const current = (await this.list()).find((x) => x.user_id === userId);
    const base =
      current && new Date(current.expires_at) > new Date()
        ? new Date(current.expires_at)
        : new Date();
    if (plan === "trial") base.setDate(base.getDate() + 7);
    else
      base.setMonth(
        base.getMonth() +
          (plan === "yearly" ? 12 : plan === "quarterly" ? 3 : 1),
      );
    await this.update(userId, {
      plan_code: plan,
      expires_at: base.toISOString(),
      enabled: true,
    });
  },
};
