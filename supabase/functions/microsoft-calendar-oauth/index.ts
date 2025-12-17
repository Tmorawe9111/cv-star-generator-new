import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const path = url.pathname;

  try {
    // OAuth Callback Handler
    if (path.includes("/callback")) {
      const code = url.searchParams.get("code");
      const state = url.searchParams.get("state"); // Contains company_id and provider (outlook/teams)
      const error = url.searchParams.get("error");

      if (error) {
        return Response.redirect(
          `${url.origin.replace("/functions/v1", "")}/unternehmen/einstellungen?error=oauth_cancelled`,
          302
        );
      }

      if (!code || !state) {
        return Response.redirect(
          `${url.origin.replace("/functions/v1", "")}/unternehmen/einstellungen?error=oauth_failed`,
          302
        );
      }

      const [companyId, provider] = state.split(":");

      // Get company's OAuth credentials from database
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      const { data: integration, error: integrationError } = await supabase
        .from("company_calendar_integrations")
        .select("oauth_client_id, oauth_client_secret, oauth_redirect_uri")
        .eq("company_id", companyId)
        .eq("provider", provider)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (integrationError || !integration || !integration.oauth_client_id || !integration.oauth_client_secret) {
        return Response.redirect(
          `${url.origin.replace("/functions/v1", "")}/unternehmen/einstellungen?error=oauth_not_configured`,
          302
        );
      }

      // Exchange code for tokens
      const tokenResponse = await fetch("https://login.microsoftonline.com/common/oauth2/v2.0/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          code,
          client_id: integration.oauth_client_id,
          client_secret: integration.oauth_client_secret,
          redirect_uri: integration.oauth_redirect_uri || `${SUPABASE_URL}/functions/v1/microsoft-calendar-oauth/callback`,
          grant_type: "authorization_code",
          scope: "https://graph.microsoft.com/Calendars.ReadWrite https://graph.microsoft.com/OnlineMeetings.ReadWrite",
        }),
      });

      if (!tokenResponse.ok) {
        throw new Error("Failed to exchange code for tokens");
      }

      const tokens = await tokenResponse.json();

      // Get user's calendar info
      const calendarResponse = await fetch("https://graph.microsoft.com/v1.0/me/calendars", {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
        },
      });

      const calendars = await calendarResponse.json();
      const primaryCalendar = calendars.value?.find((cal: any) => cal.isDefaultCalendar) || calendars.value?.[0];

      // Save integration to database
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

      const { error: dbError } = await supabase
        .from("company_calendar_integrations")
        .upsert({
          company_id: companyId,
          provider: provider as "outlook" | "teams",
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
          calendar_id: primaryCalendar?.id || "primary",
          is_active: true,
          oauth_client_id: integration.oauth_client_id, // Keep the OAuth credentials
          oauth_client_secret: integration.oauth_client_secret,
          oauth_redirect_uri: integration.oauth_redirect_uri,
          settings: {
            calendar_name: primaryCalendar?.name || "Primary Calendar",
            timezone: primaryCalendar?.timeZone || "Europe/Berlin",
          },
        }, {
          onConflict: "company_id,provider",
        });

      if (dbError) {
        console.error("Database error:", dbError);
        throw dbError;
      }

      return Response.redirect(
        `${url.origin.replace("/functions/v1", "")}/unternehmen/einstellungen?success=${provider}_connected`,
        302
      );
    }

    // OAuth Init Handler
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing Authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const token = authHeader.replace("Bearer ", "");

    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get company_id from user
    const { data: companyUser, error: companyError } = await supabase
      .from("company_users")
      .select("company_id")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    if (companyError || !companyUser) {
      return new Response(
        JSON.stringify({ error: "Company not found or user is not admin" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get request body for companyId, provider, and OAuth credentials
    const body = await req.json().catch(() => ({}));
    const companyId = body.companyId;
    const provider = body.provider || "outlook"; // Default to outlook
    const clientId = body.clientId;
    const clientSecret = body.clientSecret;
    const redirectUri = body.redirectUri;

    if (!companyId || !clientId || !clientSecret) {
      return new Response(
        JSON.stringify({ error: "Missing companyId, clientId, or clientSecret" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify user has access to this company
    const { data: companyUser, error: companyError } = await supabase
      .from("company_users")
      .select("company_id")
      .eq("user_id", user.id)
      .eq("company_id", companyId)
      .eq("role", "admin")
      .single();

    if (companyError || !companyUser) {
      return new Response(
        JSON.stringify({ error: "Company not found or user is not admin" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate OAuth URL
    const state = `${companyId}:${provider}`;
    const scope = "https://graph.microsoft.com/Calendars.ReadWrite https://graph.microsoft.com/OnlineMeetings.ReadWrite offline_access";
    const finalRedirectUri = redirectUri || `${SUPABASE_URL}/functions/v1/microsoft-calendar-oauth/callback`;
    const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${new URLSearchParams({
      client_id: clientId,
      redirect_uri: finalRedirectUri,
      response_type: "code",
      scope,
      state,
    })}`;

    return new Response(
      JSON.stringify({ authUrl }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Microsoft Calendar OAuth error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

