// =====================================================================
// supabase/functions/send-reminder/index.ts
//
// Called by pg_cron (via pg_net) for every due, unsent booking_reminder.
// Wire this up to whatever channel the studio actually uses — WhatsApp
// Business API, a push notification service, SMS, etc. This stub sends
// a WhatsApp Cloud API message and logs on failure; adjust as needed.
//
// Deploy:
//   supabase functions deploy send-reminder --no-verify-jwt
//
// Secrets (supabase secrets set ...):
//   WHATSAPP_TOKEN, WHATSAPP_PHONE_ID
// =====================================================================
import { serve } from "https://deno.land/std@0.203.0/http/server.ts";

interface ReminderPayload {
  reminder_id: string;
  booking_id: string;
  customer_name: string;
  customer_phone: string | null;
  customer_whatsapp: string | null;
  booking_date: string;
  start_time: string | null;
  title: string | null;
  reminder_type: string;
}

const WHATSAPP_TOKEN = Deno.env.get("WHATSAPP_TOKEN") ?? "";
const WHATSAPP_PHONE_ID = Deno.env.get("WHATSAPP_PHONE_ID") ?? "";

async function sendWhatsAppMessage(to: string, body: string) {
  const url = `https://graph.facebook.com/v20.0/${WHATSAPP_PHONE_ID}/messages`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${WHATSAPP_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`WhatsApp send failed (${res.status}): ${errText}`);
  }
}

serve(async (req: Request) => {
  try {
    const payload = (await req.json()) as ReminderPayload;

    const recipient = payload.customer_whatsapp || payload.customer_phone;
    if (!recipient) {
      return new Response(
        JSON.stringify({ ok: false, error: "No phone/whatsapp number on booking" }),
        { status: 200 },
      );
    }

    const message =
      `تذكير بحجزك${payload.title ? " - " + payload.title : ""}\n` +
      `العميل: ${payload.customer_name}\n` +
      `التاريخ: ${payload.booking_date}${payload.start_time ? " " + payload.start_time : ""}`;

    await sendWhatsAppMessage(recipient, message);

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("send-reminder error:", err);
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
