import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!SERVICE_ROLE_KEY) {
      return new Response(
        JSON.stringify({ error: "Missing SUPABASE_SERVICE_ROLE_KEY" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Read body once (may be needed for bootstrap path)
    let body: any = {};
    try {
      body = await req.json();
    } catch (_) {
      body = {};
    }
    const action = body?.action as string | undefined;

    const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // Bootstrap mode: allow create_admin without auth if no existing 'admin' role
    let bootstrapAllowed = false;
    if (action === "create_admin") {
      const { count, error: countErr } = await adminClient
        .from("user_roles")
        .select("id", { count: "exact", head: true })
        .eq("role", "admin");
      if (!countErr && (count ?? 0) === 0) {
        bootstrapAllowed = true;
      }
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader && !bootstrapAllowed) {
      return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let caller: any = null;
    if (authHeader) {
      const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        global: { headers: { Authorization: authHeader } },
      });
      const {
        data: { user },
        error: userErr,
      } = await anonClient.auth.getUser();
      if (userErr || !user) {
        if (!bootstrapAllowed) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      } else {
        caller = user;
      }
    }

    // Check role using service role to avoid RLS recursion issues (skip in bootstrap)
    if (!bootstrapAllowed) {
      const { data: roles, error: rolesErr } = await adminClient
        .from("user_roles")
        .select("role")
        .eq("user_id", caller?.id ?? "");
      if (rolesErr) throw rolesErr;

      const callerRoles = (roles || []).map((r: any) => String(r.role).toLowerCase());
      const allowedAnyAdmin = callerRoles.some((r: string) => [
        "admin",
        "superadmin",
        "support",
        "supportagent",
        "editor",
      ].includes(String(r.role).toLowerCase()));

      if (!allowedAnyAdmin) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Restrict sensitive actions
      const isHighPriv = callerRoles.some((r: string) => ["admin", "superadmin", "support", "supportagent"].includes(r));
      if (action === "impersonate" && !isHighPriv) {
        return new Response(JSON.stringify({ error: "Forbidden: impersonate requires SuperAdmin/Support" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    if (!action) {
      return new Response(JSON.stringify({ error: "Missing action" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "impersonate") {
      const { userId, email: emailFromBody, redirectTo } = body || {};

      let email = (emailFromBody ? String(emailFromBody) : "").trim().toLowerCase();
      const redirect_to = redirectTo ? String(redirectTo).trim() : "";

      // If caller passed an email (used for seed accounts), ensure it exists in seed_user_keys to avoid accidentally creating users.
      if (email) {
        const { data: seedKey, error: seedErr } = await adminClient
          .from("seed_user_keys")
          .select("email")
          .eq("email", email)
          .maybeSingle();
        if (seedErr) throw seedErr;
        if (!seedKey) {
          return new Response(JSON.stringify({ error: "Seed user not found for email" }), {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      } else {
        // Backward compatible path: impersonate by userId (regular Admin Users drawer)
        if (!userId) {
          return new Response(JSON.stringify({ error: "Missing userId or email" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const { data: targetUser, error: targetErr } = await adminClient.auth.admin.getUserById(userId);
        if (targetErr) throw targetErr;
        email = String(targetUser?.user?.email || "").trim().toLowerCase();
      }

      if (!email) {
        return new Response(JSON.stringify({ error: "Target user email not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: linkData, error: linkErr } = await adminClient.auth.admin.generateLink({
        type: "magiclink",
        email,
        options: redirect_to ? { redirectTo: redirect_to } : undefined,
      } as any);
      if (linkErr) throw linkErr;
      const url = (linkData as any)?.properties?.action_link || (linkData as any)?.action_link;
      return new Response(JSON.stringify({ url }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "suspend" || action === "unsuspend") {
      const { userId } = body || {};
      if (!userId) {
        return new Response(JSON.stringify({ error: "Missing userId" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const suspended = action === "suspend";
      const { error: updErr } = await adminClient.auth.admin.updateUserById(userId, {
        app_metadata: { suspended },
      } as any);
      if (updErr) throw updErr;
      return new Response(JSON.stringify({ ok: true, suspended }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "create_admin") {
      const { email, password } = body || {};
      if (!email || !password) {
        return new Response(JSON.stringify({ error: "Missing email or password" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Create user with email confirmed
      const { data: created, error: createErr } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { created_by: caller?.id || "bootstrap" }
      } as any);
      if (createErr) throw createErr;
      const newUserId = created.user?.id;
      if (!newUserId) {
        return new Response(JSON.stringify({ error: "User creation failed" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Assign 'admin' role in user_roles (maps to SuperAdmin in app)
      const { error: roleErr } = await adminClient
        .from("user_roles")
        .insert({ user_id: newUserId, role: "admin" as any });
      if (roleErr) throw roleErr;

      return new Response(JSON.stringify({ ok: true, userId: newUserId }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("admin-user-actions error", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
