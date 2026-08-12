import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  let createdUserId = '';
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const token = (req.headers.get('Authorization') || '').replace('Bearer ', '');
    const { data: { user: caller }, error: callerError } = await admin.auth.getUser(token);
    if (callerError || !caller) throw new Error('غير مصرح بإنشاء أعضاء.');

    const { data: callerProfile, error: profileError } = await admin
      .from('profiles')
      .select('studio_id,is_admin,status')
      .eq('id', caller.id)
      .single();
    if (profileError || !callerProfile?.is_admin || callerProfile.status === 'disabled' || !callerProfile.studio_id) {
      return new Response(JSON.stringify({ error: 'فقط مدير الحساب يمكنه إضافة أعضاء.' }), { status: 403, headers: { ...cors, 'Content-Type': 'application/json' } });
    }

    const { name, email, password, role } = await req.json();
    if (!String(name || '').trim() || !String(email || '').trim()) throw new Error('الاسم والبريد الإلكتروني مطلوبان.');
    if (String(password || '').length < 8) throw new Error('كلمة المرور يجب أن تكون 8 أحرف على الأقل.');

    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email: String(email).trim().toLowerCase(),
      password,
      email_confirm: true,
      user_metadata: { full_name: String(name).trim() },
    });
    if (createError) throw createError;
    createdUserId = created.user.id;

    const { error: updateError } = await admin.from('profiles').update({
      full_name: String(name).trim(),
      studio_id: callerProfile.studio_id,
      is_admin: false,
      job_title: role || 'مساعد',
      status: 'active',
    }).eq('id', createdUserId);
    if (updateError) throw updateError;

    return new Response(JSON.stringify({ ok: true, user_id: createdUserId }), { headers: { ...cors, 'Content-Type': 'application/json' } });
  } catch (error) {
    if (createdUserId) {
      const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
      await admin.auth.admin.deleteUser(createdUserId);
    }
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }), { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } });
  }
});
