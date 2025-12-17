import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

// Store Slack webhooks as Supabase Edge Function secrets (never in code).
// Preferred names (match your request):
const SLACK_WEBHOOK_COMPANY = Deno.env.get("SLACK_WEBHOOK_COMPANY") || "";
const SLACK_WEBHOOK_USER = Deno.env.get("SLACK_WEBHOOK_USER") || "";
// Backward-compatible fallbacks (older names we used earlier):
const SLACK_WEBHOOK_COMPANY_SIGNUP = Deno.env.get("SLACK_WEBHOOK_COMPANY_SIGNUP") || "";
const SLACK_WEBHOOK_USER_SIGNUP = Deno.env.get("SLACK_WEBHOOK_USER_SIGNUP") || "";

// Optional: allow unauthenticated *test* invocation via shared secret.
const SLACK_TEST_SECRET = Deno.env.get("SLACK_TEST_SECRET") || "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

type Body = {
  kind: "user" | "company";
  test?: boolean;
  source?: string | null;

  // Optional: only used for unauthenticated test calls
  test_secret?: string | null;

  user?: {
    firstName?: string | null;
    lastName?: string | null;
    industry?: string | null;
    zip?: string | null;
    city?: string | null;
    status?: string | null; // Schüler/Azubi/Fachkraft (or internal keys)
  } | null;

  company?: {
    companyName?: string | null;
    industry?: string | null;
    zip?: string | null;
    city?: string | null;
    employeeCount?: string | number | null;
    website?: string | null;
    contactPerson?: {
      firstName?: string | null;
      lastName?: string | null;
      email?: string | null;
      phone?: string | null;
    } | null;
  } | null;
};

type SlackText = { type: "plain_text" | "mrkdwn"; text: string; emoji?: boolean };
type SlackBlock =
  | { type: "header"; text: SlackText }
  | { type: "divider" }
  | { type: "context"; elements: SlackText[] }
  | { type: "section"; text?: SlackText; fields?: SlackText[] };

function safe(v: unknown): string {
  if (v === null || v === undefined) return "—";
  const s = String(v).trim();
  return s.length ? s : "—";
}

function plain(text: string): SlackText {
  return { type: "plain_text", text, emoji: true };
}

function mrkdwn(text: string): SlackText {
  return { type: "mrkdwn", text };
}

function normalizeUserStatus(input: unknown): string {
  const raw = String(input ?? "").trim().toLowerCase();
  if (!raw) return "—";
  if (raw === "schüler" || raw === "schueler") return "Schüler";
  if (raw === "azubi") return "Azubi";
  if (raw === "fachkraft" || raw === "ausgelernt") return "Fachkraft";
  return String(input);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Use POST" }, 405);

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  if (!body?.kind || (body.kind !== "user" && body.kind !== "company")) {
    return json({ error: "Missing/invalid kind (user|company)" }, 400);
  }

  const authHeader = req.headers.get("Authorization");
  let callerId: string | null = null;

  // Prefer authenticated calls (used by the app).
  if (authHeader) {
    const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user: caller },
    } = await anonClient.auth.getUser();
    if (caller) callerId = caller.id;
  }

  // Allow unauthenticated *test* calls if SLACK_TEST_SECRET matches.
  if (!callerId) {
    if (!(body.test && SLACK_TEST_SECRET && String(body.test_secret || "") === SLACK_TEST_SECRET)) {
      return json({ error: "Not authenticated" }, 401);
    }
    callerId = "test-secret";
  }

  const webhook =
    body.kind === "company"
      ? (SLACK_WEBHOOK_COMPANY || SLACK_WEBHOOK_COMPANY_SIGNUP)
      : (SLACK_WEBHOOK_USER || SLACK_WEBHOOK_USER_SIGNUP);

  if (!webhook) {
    return json(
      {
        error: `Missing Slack webhook secret for kind=${body.kind}. Set SLACK_WEBHOOK_${body.kind === "company" ? "COMPANY" : "USER"}`,
      },
      500,
    );
  }

  const now = new Date();
  const timeLine = `*Zeit:* ${now.toLocaleString("de-DE")}`;
  const sourceLine = body.source ? ` • *Source:* ${safe(body.source)}` : "";

  const blocks: SlackBlock[] = [];
  blocks.push({
    type: "header",
    text: plain(body.kind === "company" ? "🏢 Neues Unternehmen registriert" : "👤 Neuer Nutzer angemeldet"),
  });
  blocks.push({
    type: "context",
    elements: [mrkdwn(`${timeLine}${sourceLine}`), mrkdwn(`*Auslöser:* ${callerId}`)],
  });
  blocks.push({ type: "divider" });

  if (body.kind === "user") {
    const u = body.user || {};
    blocks.push({
      type: "section",
      fields: [
        mrkdwn(`*Vorname*\n${safe(u.firstName)}`),
        mrkdwn(`*Nachname*\n${safe(u.lastName)}`),
        mrkdwn(`*Status*\n${normalizeUserStatus(u.status)}`),
        mrkdwn(`*Branche*\n${safe(u.industry)}`),
        mrkdwn(`*PLZ / Stadt*\n${safe(u.zip)} ${safe(u.city)}`),
        mrkdwn(`*User*\n${callerId}`),
      ],
    });
  } else {
    const c = body.company || {};
    const cp = c.contactPerson || {};
    blocks.push({
      type: "section",
      fields: [
        mrkdwn(`*Firmenname*\n${safe(c.companyName)}`),
        mrkdwn(`*Branche*\n${safe(c.industry)}`),
        mrkdwn(`*PLZ / Stadt*\n${safe(c.zip)} ${safe(c.city)}`),
        mrkdwn(`*Mitarbeiteranzahl*\n${safe(c.employeeCount)} `),
        mrkdwn(`*Webseite*\n${c.website ? safe(c.website) : "Keine angegeben"}`),
        mrkdwn(`*Admin User*\n${callerId}`),
      ],
    });
    blocks.push({ type: "divider" });
    blocks.push({
      type: "section",
      text: mrkdwn("*Ansprechpartner*"),
      fields: [
        mrkdwn(`*Name*\n${safe(cp.firstName)} ${safe(cp.lastName)}`),
        mrkdwn(`*Kontakt*\n${safe(cp.email)}\n${safe(cp.phone)}`),
      ],
    });
  }

  if (body.test) {
    blocks.push({ type: "divider" });
    blocks.push({ type: "context", elements: [mrkdwn("✅ *TEST MODE* (keine echte Registrierung)") ] });
  }

  const resp = await fetch(webhook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ blocks }),
  });

  if (!resp.ok) {
    const errText = await resp.text().catch(() => "");
    return json({ error: "Slack webhook failed", status: resp.status, details: errText }, 500);
  }

  return json({ ok: true });
});


