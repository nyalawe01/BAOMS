// ==============================================================================
// BAOMS Edge Function: create-staff-user
// Babawatoto Organization Management System
//
// Securely provisions a new staff auth account using the Supabase Service Role key.
// The anon/publishable key CANNOT call admin APIs — this edge function runs with
// elevated service-role privileges on the server, so the admin client key never
// reaches the browser.
//
// Called by: UserManagementPage -> handleInviteSubmit (when Supabase is configured)
// Auth Guard: Caller must supply a valid JWT (logged-in system_admin session).
// ==============================================================================

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header.' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');

    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    });

    const { data: { user: callerUser }, error: callerErr } = await callerClient.auth.getUser();
    if (callerErr || !callerUser) {
      return new Response(JSON.stringify({ error: 'Unauthorized: invalid session.' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: roleData } = await callerClient
      .from('user_roles').select('roles(code)').eq('user_id', callerUser.id);

    const callerRoles = (roleData || []).flatMap((ur) => {
      const r = Array.isArray(ur.roles) ? ur.roles[0] : ur.roles;
      return r?.code ? [r.code] : [];
    });

    if (!callerRoles.includes('system_admin')) {
      return new Response(JSON.stringify({ error: 'Forbidden: only System Administrators may provision staff accounts.' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const { email, password, displayName, phoneNumber, departmentCode, roleCode, personalEmail } = body;

    if (!email || !password || !displayName || !roleCode) {
      return new Response(JSON.stringify({ error: 'Missing required fields: email, password, displayName, roleCode.' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (!email.toLowerCase().endsWith('@babawatoto.or.tz')) {
      return new Response(JSON.stringify({ error: 'Email domain policy: only @babawatoto.or.tz addresses permitted.' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (password.length < 8) {
      return new Response(JSON.stringify({ error: 'Password must be at least 8 characters.' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: authData, error: authErr } = await adminClient.auth.admin.createUser({
      email: email.toLowerCase().trim(),
      password,
      email_confirm: true,
      user_metadata: {
        display_name: displayName.trim(),
        full_name: displayName.trim(),
        role: roleCode,
        department_code: departmentCode || 'PRJ',
        personal_email: personalEmail || null,
      },
    });

    if (authErr || !authData?.user) {
      return new Response(JSON.stringify({ error: authErr?.message || 'Failed to create auth user.' }), {
        status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const newUserId = authData.user.id;

    const { data: deptData } = await adminClient
      .from('departments').select('id, name_en').eq('code', departmentCode || 'PRJ').single();

    const { error: profileErr } = await adminClient.from('profiles').upsert({
      id: newUserId,
      display_name: displayName.trim(),
      phone_number: phoneNumber || null,
      preferred_language: 'en',
      department_id: deptData?.id || null,
      is_active: true,
    }, { onConflict: 'id' });

    if (profileErr) {
      await adminClient.auth.admin.deleteUser(newUserId);
      return new Response(JSON.stringify({ error: `Profile creation failed: ${profileErr.message}` }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: roleRow, error: roleLookupErr } = await adminClient
      .from('roles').select('id').eq('code', roleCode).single();

    if (roleLookupErr || !roleRow) {
      await adminClient.auth.admin.deleteUser(newUserId);
      return new Response(JSON.stringify({ error: `Role '${roleCode}' not found. Apply migrations first.` }), {
        status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { error: userRoleErr } = await adminClient.from('user_roles').insert({
      user_id: newUserId,
      role_id: roleRow.id,
      assigned_by: callerUser.id,
    });

    if (userRoleErr) {
      await adminClient.auth.admin.deleteUser(newUserId);
      return new Response(JSON.stringify({ error: `Role assignment failed: ${userRoleErr.message}` }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      user: {
        id: newUserId,
        email: authData.user.email,
        displayName: displayName.trim(),
        departmentCode: departmentCode || 'PRJ',
        departmentName: deptData?.name_en || departmentCode,
        roleCode,
        isActive: true,
      },
    }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: `Internal server error: ${message}` }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
