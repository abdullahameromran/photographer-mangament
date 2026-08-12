import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors = {'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type'};
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok',{headers:cors});
  try {
    const url=Deno.env.get('SUPABASE_URL')!; const serviceKey=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const authHeader=req.headers.get('Authorization')||'';
    // Never override the service-role Authorization header with the caller JWT.
    // The caller token is validated explicitly below.
    const admin=createClient(url,serviceKey,{auth:{persistSession:false,autoRefreshToken:false}});
    const token=authHeader.replace('Bearer ','');
    const {data:{user},error:userError}=await admin.auth.getUser(token);
    if(userError) throw userError;
    if(!user) throw new Error('Unauthorized');
    const {data:isAdmin}=await admin.rpc('is_super_admin',{p_user:user.id});
    if(!isAdmin) return new Response(JSON.stringify({error:'Forbidden'}),{status:403,headers:{...cors,'Content-Type':'application/json'}});
    const {name,email,password,phone,plan}=await req.json();
    if(!name||!email||!password||password.length<8) throw new Error('بيانات الحساب غير مكتملة');
    if(!/^01[0125]\d{8}$/.test(String(phone||''))) throw new Error('رقم الهاتف يجب أن يكون 11 رقماً مصرياً صحيحاً');
    const {data:created,error}=await admin.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{full_name:name}});
    if(error) throw error;
    const {error:profileError}=await admin.from('profiles').update({phone}).eq('id',created.user.id);
    if(profileError){await admin.auth.admin.deleteUser(created.user.id);throw profileError;}
    const months=plan==='yearly'?12:plan==='quarterly'?3:1; const expires=new Date(); expires.setMonth(expires.getMonth()+months);
    const {error:subError}=await admin.from('subscriptions').insert({user_id:created.user.id,plan_code:plan,expires_at:expires.toISOString()});
    if(subError){await admin.auth.admin.deleteUser(created.user.id);throw subError;}
    return new Response(JSON.stringify({ok:true,user_id:created.user.id}),{headers:{...cors,'Content-Type':'application/json'}});
  }catch(error){return new Response(JSON.stringify({error:error instanceof Error?error.message:String(error)}),{status:400,headers:{...cors,'Content-Type':'application/json'}});}
});
