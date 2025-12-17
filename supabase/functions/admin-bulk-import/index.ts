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

type ImportKind = "companies" | "company_locations" | "job_posts" | "seed_users";

type ValidationError = { index: number; field: string; message: string };

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function toStr(v: any): string {
  if (v === null || v === undefined) return "";
  return String(v).trim();
}

function toBool(v: any, fallback = false): boolean {
  if (v === true || v === "true" || v === "1" || v === 1) return true;
  if (v === false || v === "false" || v === "0" || v === 0) return false;
  return fallback;
}

function isPrivateEmail(email: string): boolean {
  const lower = email.trim().toLowerCase();
  const at = lower.lastIndexOf("@");
  if (at < 0) return false;
  const domain = lower.slice(at + 1);
  const privateDomains = new Set([
    "gmail.com",
    "googlemail.com",
    "gmx.de",
    "gmx.net",
    "web.de",
    "outlook.com",
    "outlook.de",
    "hotmail.com",
    "hotmail.de",
    "yahoo.com",
    "yahoo.de",
    "icloud.com",
    "me.com",
    "proton.me",
    "protonmail.com",
    "t-online.de",
    "freenet.de",
  ]);
  return privateDomains.has(domain);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  if (!SERVICE_ROLE_KEY) return json({ error: "Missing SUPABASE_SERVICE_ROLE_KEY" }, 500);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ error: "Missing Authorization header" }, 401);

  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });

  const {
    data: { user: caller },
    error: callerErr,
  } = await anonClient.auth.getUser();
  if (callerErr || !caller) return json({ error: "Unauthorized" }, 401);

  // Only SuperAdmin/Support can run bulk imports (because seed_users creates auth users)
  const { data: roles, error: rolesErr } = await adminClient
    .from("user_roles")
    .select("role")
    .eq("user_id", caller.id);
  if (rolesErr) return json({ error: String(rolesErr) }, 500);
  const callerRoles = (roles || []).map((r: any) => String(r.role).toLowerCase());
  const allowed = callerRoles.some((r: string) => ["admin", "superadmin", "support", "supportagent"].includes(r));
  if (!allowed) return json({ error: "Forbidden" }, 403);

  let body: any = {};
  try {
    body = await req.json();
  } catch (_) {
    body = {};
  }

  const kind = body?.kind as ImportKind | undefined;
  const dryRun = !!body?.dryRun;
  const rows = (body?.rows as any[]) || [];

  if (!kind) return json({ error: "Missing kind" }, 400);
  if (!Array.isArray(rows) || rows.length === 0) return json({ error: "Missing rows" }, 400);

  const errors: ValidationError[] = [];

  // -----------------------
  // Companies
  // -----------------------
  if (kind === "companies") {
    const payload = rows.map((r, index) => {
      const external_id = toStr(r.company_external_id || r.external_id);
      const name = toStr(r.name);
      const primary_email = toStr(r.primary_email);

      if (!external_id) errors.push({ index, field: "company_external_id", message: "Pflichtfeld fehlt" });
      if (!name) errors.push({ index, field: "name", message: "Pflichtfeld fehlt" });

      return {
        external_id: external_id || null,
        name,
        primary_email: primary_email || null,
        industry: toStr(r.industry) || null,
        website_url: toStr(r.website_url) || null,
        description: toStr(r.description) || null,
        contact_person: toStr(r.contact_person) || null,
        contact_position: toStr(r.contact_position) || null,
        phone: toStr(r.phone) || null,
        updated_at: new Date().toISOString(),
      };
    });

    if (errors.length) return json({ ok: false, errors }, 200);
    if (dryRun) return json({ ok: true, dryRun: true, count: payload.length, errors: [] }, 200);

    const { data, error } = await adminClient
      .from("companies")
      .upsert(payload, { onConflict: "external_id" })
      .select("id, external_id");
    if (error) return json({ ok: false, error: String(error) }, 500);
    return json({ ok: true, imported: data?.length ?? 0 }, 200);
  }

  // -----------------------
  // Company locations
  // -----------------------
  if (kind === "company_locations") {
    // Resolve all companies by external_id in one go
    const companyExternalIds = Array.from(
      new Set(rows.map((r) => toStr(r.company_external_id)).filter(Boolean))
    );
    const { data: companies, error: compErr } = await adminClient
      .from("companies")
      .select("id, external_id")
      .in("external_id", companyExternalIds);
    if (compErr) return json({ ok: false, error: String(compErr) }, 500);
    const companyByExternal = new Map<string, string>((companies || []).map((c: any) => [c.external_id, c.id]));

    const payload = rows.map((r, index) => {
      const company_external_id = toStr(r.company_external_id);
      const location_external_id = toStr(r.location_external_id || r.external_id);
      const city = toStr(r.city);

      if (!company_external_id) errors.push({ index, field: "company_external_id", message: "Pflichtfeld fehlt" });
      if (!location_external_id) errors.push({ index, field: "location_external_id", message: "Pflichtfeld fehlt" });
      if (!city) errors.push({ index, field: "city", message: "Pflichtfeld fehlt" });

      const company_id = companyByExternal.get(company_external_id);
      if (!company_id) errors.push({ index, field: "company_external_id", message: "Unbekannte company_external_id" });

      return {
        company_id: company_id || null,
        external_id: location_external_id || null,
        name: toStr(r.name) || null,
        street: toStr(r.street) || null,
        house_number: toStr(r.house_number) || null,
        postal_code: toStr(r.postal_code) || null,
        city: city || null,
        country: toStr(r.country) || "Deutschland",
        is_primary: toBool(r.is_primary, false),
        is_active: toBool(r.is_active, true),
        lat: r.lat !== undefined && r.lat !== "" ? Number(r.lat) : null,
        lon: r.lon !== undefined && r.lon !== "" ? Number(r.lon) : null,
        updated_at: new Date().toISOString(),
      };
    });

    if (errors.length) return json({ ok: false, errors }, 200);
    if (dryRun) return json({ ok: true, dryRun: true, count: payload.length, errors: [] }, 200);

    const { data, error } = await adminClient
      .from("company_locations")
      .upsert(payload, { onConflict: "company_id,external_id" })
      .select("id, company_id, external_id");
    if (error) return json({ ok: false, error: String(error) }, 500);
    return json({ ok: true, imported: data?.length ?? 0 }, 200);
  }

  // -----------------------
  // Job posts
  // -----------------------
  if (kind === "job_posts") {
    const companyExternalIds = Array.from(new Set(rows.map((r) => toStr(r.company_external_id)).filter(Boolean)));
    const { data: companies, error: compErr } = await adminClient
      .from("companies")
      .select("id, external_id")
      .in("external_id", companyExternalIds);
    if (compErr) return json({ ok: false, error: String(compErr) }, 500);
    const companyByExternal = new Map<string, string>((companies || []).map((c: any) => [c.external_id, c.id]));

    // Preload all referenced locations
    const locationPairs = rows
      .map((r) => ({ c: toStr(r.company_external_id), l: toStr(r.location_external_id) }))
      .filter((x) => x.c && x.l);

    // Load locations for all involved companies, then pick by (company_id, external_id)
    const companyIds = Array.from(new Set(locationPairs.map((p) => companyByExternal.get(p.c)).filter(Boolean))) as string[];
    const { data: locations, error: locErr } = companyIds.length
      ? await adminClient.from("company_locations").select("company_id, external_id, street, house_number, postal_code, city, country, lat, lon").in("company_id", companyIds)
      : { data: [], error: null };
    if (locErr) return json({ ok: false, error: String(locErr) }, 500);
    const locationByKey = new Map<string, any>(
      (locations || []).map((l: any) => [`${l.company_id}:${l.external_id}`, l])
    );

    const payload = [];
    for (let index = 0; index < rows.length; index++) {
      const r = rows[index];
      const company_external_id = toStr(r.company_external_id);
      const job_external_id = toStr(r.job_external_id || r.external_id);
      const title = toStr(r.title);

      if (!company_external_id) errors.push({ index, field: "company_external_id", message: "Pflichtfeld fehlt" });
      if (!job_external_id) errors.push({ index, field: "job_external_id", message: "Pflichtfeld fehlt" });
      if (!title) errors.push({ index, field: "title", message: "Pflichtfeld fehlt" });

      const company_id = companyByExternal.get(company_external_id);
      if (!company_id) errors.push({ index, field: "company_external_id", message: "Unbekannte company_external_id" });

      const locExternal = toStr(r.location_external_id);
      const loc = locExternal && company_id ? locationByKey.get(`${company_id}:${locExternal}`) : null;
      if (locExternal && !loc) {
        errors.push({ index, field: "location_external_id", message: "Standort nicht gefunden (company_locations.external_id)" });
      }

      // Contact: use CSV fields; optional auto-fill by company team (best-effort)
      let contact_person_email = toStr(r.contact_email || r.contact_person_email);
      let contact_person_name = toStr(r.contact_person_name);
      let contact_person_phone = toStr(r.contact_person_phone);
      let contact_person_role = toStr(r.contact_person_role);
      let contact_person_photo_url = toStr(r.contact_person_photo_url);

      if (company_id && contact_person_email && (!contact_person_name || !contact_person_phone || !contact_person_photo_url)) {
        const { data: cu, error: cuErr } = await adminClient
          .from("company_users")
          .select("role, profiles:profiles(email, vorname, nachname, telefon, avatar_url)")
          .eq("company_id", company_id);
        if (!cuErr && Array.isArray(cu)) {
          const match = cu.find((row: any) => String(row?.profiles?.email || "").toLowerCase() === contact_person_email.toLowerCase());
          if (match?.profiles) {
            const fullName = `${match.profiles.vorname || ""} ${match.profiles.nachname || ""}`.trim();
            if (!contact_person_name) contact_person_name = fullName || contact_person_name;
            if (!contact_person_phone) contact_person_phone = match.profiles.telefon || contact_person_phone;
            if (!contact_person_photo_url) contact_person_photo_url = match.profiles.avatar_url || contact_person_photo_url;
            if (!contact_person_role) contact_person_role = toStr(match.role);
          }
        }
      }

      payload.push({
        company_id: company_id || null,
        external_id: job_external_id || null,
        title,
        industry: toStr(r.industry) || null,
        description_md: toStr(r.description_md) || null,
        tasks_md: toStr(r.tasks_md) || null,
        requirements_md: toStr(r.requirements_md) || null,
        is_active: toBool(r.is_active, true),
        is_public: toBool(r.is_public, true),
        status: toStr(r.status) || "published",
        city: loc?.city || toStr(r.city) || null,
        postal_code: loc?.postal_code || toStr(r.postal_code) || null,
        address_street: loc?.street || toStr(r.address_street) || null,
        address_number: loc?.house_number || toStr(r.address_number) || null,
        country: loc?.country || toStr(r.country) || null,
        location_lat: loc?.lat ?? (toStr(r.location_lat) ? Number(r.location_lat) : null),
        location_lng: loc?.lon ?? (toStr(r.location_lng) ? Number(r.location_lng) : null),
        contact_person_email: contact_person_email || null,
        contact_person_name: contact_person_name || null,
        contact_person_phone: contact_person_phone || null,
        contact_person_role: contact_person_role || null,
        contact_person_photo_url: contact_person_photo_url || null,
        updated_at: new Date().toISOString(),
      });
    }

    if (errors.length) return json({ ok: false, errors }, 200);
    if (dryRun) return json({ ok: true, dryRun: true, count: payload.length, errors: [] }, 200);

    const { data, error } = await adminClient
      .from("job_posts")
      .upsert(payload as any, { onConflict: "company_id,external_id" })
      .select("id, company_id, external_id");
    if (error) return json({ ok: false, error: String(error) }, 500);
    return json({ ok: true, imported: data?.length ?? 0 }, 200);
  }

  // -----------------------
  // Seed users
  // -----------------------
  if (kind === "seed_users") {
    for (let index = 0; index < rows.length; index++) {
      const r = rows[index];
      const external_id = toStr(r.user_external_id || r.external_id);
      const email = toStr(r.email).toLowerCase();
      const first = toStr(r.first_name || r.vorname);
      const last = toStr(r.last_name || r.nachname);
      const city = toStr(r.location_city || r.ort);
      const postal = toStr(r.location_postal_code || r.plz);
      const branche = toStr(r.branche);
      const status = toStr(r.status);

      if (!external_id) errors.push({ index, field: "user_external_id", message: "Pflichtfeld fehlt" });
      if (!email) errors.push({ index, field: "email", message: "Pflichtfeld fehlt" });
      if (email && !isPrivateEmail(email)) errors.push({ index, field: "email", message: "Seed-Emails müssen private Domains nutzen (z.B. gmail.com/web.de/gmx.de)" });
      if (!first) errors.push({ index, field: "first_name", message: "Pflichtfeld fehlt" });
      if (!last) errors.push({ index, field: "last_name", message: "Pflichtfeld fehlt" });
      if (!city) errors.push({ index, field: "location_city", message: "Pflichtfeld fehlt" });
      if (!postal) errors.push({ index, field: "location_postal_code", message: "Pflichtfeld fehlt" });
      if (!branche) errors.push({ index, field: "branche", message: "Pflichtfeld fehlt" });
      if (!status) errors.push({ index, field: "status", message: "Pflichtfeld fehlt" });
    }

    if (errors.length) return json({ ok: false, errors }, 200);
    if (dryRun) return json({ ok: true, dryRun: true, count: rows.length, errors: [] }, 200);

    let imported = 0;
    for (let index = 0; index < rows.length; index++) {
      const r = rows[index];
      const external_id = toStr(r.user_external_id || r.external_id);
      const email = toStr(r.email).toLowerCase();

      // Lookup existing mapping by external_id
      const { data: existingKey, error: keyErr } = await adminClient
        .from("seed_user_keys")
        .select("user_id")
        .eq("external_id", external_id)
        .maybeSingle();
      if (keyErr) return json({ ok: false, error: String(keyErr) }, 500);

      let userId = existingKey?.user_id as string | undefined;
      if (!userId) {
        const { data: created, error: createErr } = await adminClient.auth.admin.createUser({
          email,
          email_confirm: true,
          user_metadata: { is_seed: true, external_id },
        } as any);
        if (createErr) return json({ ok: false, error: `createUser failed (row ${index + 1}): ${createErr.message}` }, 500);
        userId = created.user?.id;
        if (!userId) return json({ ok: false, error: `createUser failed (row ${index + 1}): missing user id` }, 500);

        const { error: mapErr } = await adminClient
          .from("seed_user_keys")
          .insert({ external_id, user_id: userId, email });
        if (mapErr) return json({ ok: false, error: `seed_user_keys insert failed: ${String(mapErr)}` }, 500);
      }

      const first = toStr(r.first_name || r.vorname);
      const last = toStr(r.last_name || r.nachname);
      const full = `${first} ${last}`.trim();

      const profilePayload: any = {
        id: userId,
        email,
        vorname: first,
        nachname: last,
        first_name: first,
        last_name: last,
        full_name: full,
        telefon: toStr(r.telefon || r.phone) || null,
        headline: toStr(r.headline) || null,
        bio: toStr(r.bio) || null,
        uebermich: toStr(r.uebermich) || null,
        kenntnisse: toStr(r.kenntnisse) || null,
        motivation: toStr(r.motivation) || null,
        praktische_erfahrung: toStr(r.praktische_erfahrung) || null,
        branche: toStr(r.branche) || null,
        status: toStr(r.status) || null,
        ort: toStr(r.location_city || r.ort) || null,
        plz: toStr(r.location_postal_code || r.plz) || null,
        strasse: toStr(r.strasse) || null,
        hausnummer: toStr(r.hausnummer) || null,
        avatar_url: toStr(r.avatar_url) || null,
        cv_url: toStr(r.cv_url) || null,
        account_created: true,
        profile_complete: true,
        profile_published: toBool(r.profile_published, true),
        einwilligung: true,
        data_processing_consent: true,
        consent_date: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Optional JSON fields (arrays/objects)
      if (r.sprachen) profilePayload.sprachen = r.sprachen;
      if (r.faehigkeiten) profilePayload.faehigkeiten = r.faehigkeiten;
      if (r.schulbildung) profilePayload.schulbildung = r.schulbildung;
      if (r.berufserfahrung) profilePayload.berufserfahrung = r.berufserfahrung;
      if (r.job_search_preferences) profilePayload.job_search_preferences = r.job_search_preferences;
      if (r.visibility_industry) profilePayload.visibility_industry = r.visibility_industry;
      if (r.visibility_region) profilePayload.visibility_region = r.visibility_region;

      const { error: profErr } = await adminClient
        .from("profiles")
        .upsert(profilePayload, { onConflict: "id" });
      if (profErr) return json({ ok: false, error: `profiles upsert failed (row ${index + 1}): ${String(profErr)}` }, 500);

      imported++;
    }

    return json({ ok: true, imported }, 200);
  }

  return json({ error: "Unknown kind" }, 400);
});


