## Storage Orphan Cleanup (Supabase)

This repo uses Supabase Storage for:
- `profile-images` (profile avatars + cover images)
- `cvs` (CV PDFs)
- `company-media` (company logo + header/cover)
- `post-media` (community post images/videos)
- `post-documents` (community post docs)
- `blog-images` (blog images incl. `featured_image`, `og_image`, `twitter_image`, `gallery_images`)

Over time you can accumulate **orphaned files** (uploaded but never referenced, or replaced by newer uploads).

### What’s implemented
Edge Function: `storage-orphan-cleanup`
- Deletes Storage objects that are **NOT referenced in DB** and are **older than N days** (grace period).
- Supports **dry-run** mode (default) to preview what would be deleted.
- Protects execution via `ORPHAN_CLEANUP_SECRET` header.

### Required Secrets
Set this in Supabase → **Project Settings → Edge Functions → Secrets**
- `ORPHAN_CLEANUP_SECRET`: a random secret string (keep private)

### How to run (manual)
Invoke the edge function with a POST request.

Provide the secret either as:
- Header `x-orphan-cleanup-secret: <your-secret>` (preferred), OR
- JSON body field `"secret": "<your-secret>"` (fallback when headers are not possible)

Example payloads:

**1) Dry run (recommended first)**
```json
{
  "secret": "<ORPHAN_CLEANUP_SECRET>",
  "dryRun": true,
  "olderThanDays": 14,
  "maxDeletesPerBucket": 500
}
```

**2) Actually delete orphans**
```json
{
  "secret": "<ORPHAN_CLEANUP_SECRET>",
  "dryRun": false,
  "olderThanDays": 14,
  "maxDeletesPerBucket": 500
}
```

**3) Limit to specific buckets**
```json
{
  "secret": "<ORPHAN_CLEANUP_SECRET>",
  "dryRun": true,
  "olderThanDays": 30,
  "buckets": ["profile-images", "cvs"]
}
```

### Scheduling
Recommended: run daily during low traffic with a 7–14 day grace period.

Options:
- **Supabase Dashboard Scheduled Functions** (recommended): schedule `storage-orphan-cleanup` daily.
- Or trigger it from your own backend/CI with the same payload + secret header.


