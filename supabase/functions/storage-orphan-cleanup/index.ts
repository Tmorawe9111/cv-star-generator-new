import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ORPHAN_CLEANUP_SECRET = Deno.env.get("ORPHAN_CLEANUP_SECRET") || "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-orphan-cleanup-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

type CleanupRequest = {
  dryRun?: boolean;
  olderThanDays?: number;
  buckets?: string[];
  maxDeletesPerBucket?: number;
  // Optional: if your invoker cannot set custom headers (e.g. some schedulers),
  // allow providing the secret in the JSON body as well.
  secret?: string;
};

type BucketStats = {
  bucket: string;
  totalObjects: number;
  referenced: number;
  orphanCandidates: number;
  deleted: number;
  skippedDueToLimit: number;
  sampleOrphans: Array<{ name: string; created_at?: string }>;
};

function normalizeUrlToBucketPath(input: unknown): { bucket: string; path: string } | null {
  if (!input) return null;
  const raw = String(input).trim();
  if (!raw) return null;

  // Matches:
  // - .../storage/v1/object/public/<bucket>/<path>
  // - .../storage/v1/object/sign/<bucket>/<path>?token=...
  const m = raw.match(/\/storage\/v1\/object\/(?:public|sign)\/([^/]+)\/(.+)$/i);
  if (m) {
    const bucket = m[1];
    const path = m[2].split("?")[0];
    return bucket && path ? { bucket, path } : null;
  }

  // If it's a plain path (no http), caller must provide bucket context.
  return null;
}

function normalizePathAssumingBucket(input: unknown, bucket: string): { bucket: string; path: string } | null {
  if (!input) return null;
  const raw = String(input).trim();
  if (!raw) return null;

  // If it's already a full storage URL, parse it properly.
  const parsed = normalizeUrlToBucketPath(raw);
  if (parsed) return parsed;

  // If it looks like a relative storage path, accept it.
  if (!raw.startsWith("http") && raw.includes("/")) {
    return { bucket, path: raw };
  }
  return null;
}

function addRef(refs: Map<string, Set<string>>, bucket: string, path: string) {
  if (!refs.has(bucket)) refs.set(bucket, new Set());
  refs.get(bucket)!.add(path);
}

async function fetchAll<T>(
  admin: ReturnType<typeof createClient>,
  table: string,
  columns: string,
  pageSize = 1000,
): Promise<T[]> {
  const out: T[] = [];
  let from = 0;
  while (true) {
    const to = from + pageSize - 1;
    const { data, error } = await admin.from(table).select(columns).range(from, to);
    if (error) throw error;
    const chunk = (data || []) as T[];
    out.push(...chunk);
    if (chunk.length < pageSize) break;
    from += pageSize;
  }
  return out;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Use POST" }, 405);

  let body: CleanupRequest = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  // Auth guard: require explicit secret for safety.
  if (!ORPHAN_CLEANUP_SECRET) {
    return json({ error: "Missing ORPHAN_CLEANUP_SECRET env var" }, 500);
  }
  const provided = (req.headers.get("x-orphan-cleanup-secret") || body.secret || "").trim();
  if (provided !== ORPHAN_CLEANUP_SECRET) {
    return json({ error: "Unauthorized" }, 401);
  }

  const dryRun = body.dryRun !== false;
  const olderThanDays = Number.isFinite(body.olderThanDays) ? Number(body.olderThanDays) : 7;
  const maxDeletesPerBucket = Number.isFinite(body.maxDeletesPerBucket) ? Number(body.maxDeletesPerBucket) : 500;

  const defaultBuckets = ["profile-images", "cvs", "company-media", "post-media", "post-documents", "blog-images"];
  const buckets = (body.buckets && body.buckets.length > 0 ? body.buckets : defaultBuckets).filter(Boolean);

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const cutoff = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000).toISOString();

  // 1) Collect referenced storage paths from DB
  const refs = new Map<string, Set<string>>();

  // Profiles: avatar, cover, cv
  const profiles = await fetchAll<any>(admin, "profiles", "avatar_url, cover_image_url, cv_url");
  for (const p of profiles) {
    for (const v of [p.avatar_url, p.cover_image_url]) {
      const parsed = normalizePathAssumingBucket(v, "profile-images");
      if (parsed?.bucket && parsed?.path) addRef(refs, parsed.bucket, parsed.path);
    }
    {
      const parsed = normalizePathAssumingBucket(p.cv_url, "cvs");
      if (parsed?.bucket && parsed?.path) addRef(refs, parsed.bucket, parsed.path);
    }
  }

  // Companies: logo + header image
  const companies = await fetchAll<any>(admin, "companies", "logo_url, header_image");
  for (const c of companies) {
    for (const v of [c.logo_url, c.header_image]) {
      const parsed = normalizePathAssumingBucket(v, "company-media");
      if (parsed?.bucket && parsed?.path) addRef(refs, parsed.bucket, parsed.path);
    }
  }

  // Community posts: images/videos/documents
  const posts = await fetchAll<any>(admin, "posts", "image_url, media, documents");
  for (const post of posts) {
    const img = normalizePathAssumingBucket(post.image_url, "post-media");
    if (img?.bucket && img?.path) addRef(refs, img.bucket, img.path);

    const mediaArr = Array.isArray(post.media) ? post.media : [];
    for (const m of mediaArr) {
      const parsed = normalizePathAssumingBucket(m?.url, "post-media");
      if (parsed?.bucket && parsed?.path) addRef(refs, parsed.bucket, parsed.path);
    }

    const docsArr = Array.isArray(post.documents) ? post.documents : [];
    for (const d of docsArr) {
      const parsed = normalizePathAssumingBucket(d?.url, "post-documents");
      if (parsed?.bucket && parsed?.path) addRef(refs, parsed.bucket, parsed.path);
    }
  }

  // Blog posts: featured/og/twitter + gallery images
  const blogPosts = await fetchAll<any>(
    admin,
    "blog_posts",
    "featured_image, og_image, twitter_image, gallery_images",
  );
  for (const b of blogPosts) {
    for (const v of [b.featured_image, b.og_image, b.twitter_image]) {
      const parsed = normalizePathAssumingBucket(v, "blog-images");
      if (parsed?.bucket && parsed?.path) addRef(refs, parsed.bucket, parsed.path);
    }
    const gallery = Array.isArray(b.gallery_images) ? b.gallery_images : [];
    for (const v of gallery) {
      const parsed = normalizePathAssumingBucket(v, "blog-images");
      if (parsed?.bucket && parsed?.path) addRef(refs, parsed.bucket, parsed.path);
    }
  }

  // 2) For each bucket, compare against storage.objects and delete unreferenced
  const results: BucketStats[] = [];

  for (const bucket of buckets) {
    const referenced = refs.get(bucket) || new Set<string>();

    // Pull all objects in bucket older than cutoff (pagination)
    const objects: Array<{ name: string; created_at?: string }> = [];
    let from = 0;
    const pageSize = 1000;
    while (true) {
      const to = from + pageSize - 1;
      const { data, error } = await admin
        .schema("storage")
        .from("objects")
        .select("name, created_at")
        .eq("bucket_id", bucket)
        .lt("created_at", cutoff)
        .range(from, to);
      if (error) {
        // If bucket doesn't exist or storage schema differs, skip gracefully
        results.push({
          bucket,
          totalObjects: 0,
          referenced: referenced.size,
          orphanCandidates: 0,
          deleted: 0,
          skippedDueToLimit: 0,
          sampleOrphans: [],
        });
        break;
      }
      const chunk = (data || []) as Array<{ name: string; created_at?: string }>;
      objects.push(...chunk);
      if (chunk.length < pageSize) break;
      from += pageSize;
    }

    if (objects.length === 0) continue;

    const orphans = objects.filter((o) => !referenced.has(o.name));
    const sampleOrphans = orphans.slice(0, 10);

    let deleted = 0;
    let skippedDueToLimit = 0;

    if (!dryRun && orphans.length > 0) {
      const toDelete = orphans.slice(0, Math.max(0, maxDeletesPerBucket));
      skippedDueToLimit = Math.max(0, orphans.length - toDelete.length);

      // Delete in chunks (storage API limit)
      const chunkSize = 100;
      for (let i = 0; i < toDelete.length; i += chunkSize) {
        const names = toDelete.slice(i, i + chunkSize).map((x) => x.name);
        const { error: delErr } = await admin.storage.from(bucket).remove(names);
        if (delErr) {
          return json({ error: `Failed deleting from ${bucket}: ${delErr.message}`, bucket, sample: names.slice(0, 3) }, 500);
        }
        deleted += names.length;
      }
    } else {
      skippedDueToLimit = Math.max(0, orphans.length - Math.max(0, maxDeletesPerBucket));
    }

    results.push({
      bucket,
      totalObjects: objects.length,
      referenced: referenced.size,
      orphanCandidates: orphans.length,
      deleted,
      skippedDueToLimit,
      sampleOrphans,
    });
  }

  return json({
    ok: true,
    dryRun,
    cutoff,
    olderThanDays,
    maxDeletesPerBucket,
    buckets,
    results,
  });
});


