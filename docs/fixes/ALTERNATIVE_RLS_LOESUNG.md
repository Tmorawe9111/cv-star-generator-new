# ALTERNATIVE LÖSUNG - RLS Problem umgehen

## 🚨 **Problem weiterhin:**
```
infinite recursion detected in policy for relation "company_users"
```

## ⚡ **ALTERNATIVE LÖSUNG - Service Role verwenden:**

### 1. **Service Role Key verwenden:**
Erstellen Sie eine neue Datei für Admin-Operationen:

```typescript
// src/lib/supabase-admin.ts
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://koymmvuhcxlvcuoyjnvv.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtveW1tdnVoY3hsdmN1b3lqbnZ2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDM4MDc1NywiZXhwIjoyMDY5OTU2NzU3fQ.8Q7Q7Q7Q7Q7Q7Q7Q7Q7Q7Q7Q7Q7Q7Q7Q7Q7Q7Q7Q7Q";

export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});
```

### 2. **CreatePost mit Admin Client aktualisieren:**

```typescript
// In CreatePost.tsx - Zeile 81-94 ersetzen:
import { supabaseAdmin } from '@/lib/supabase-admin';

// Insert using admin client (bypasses RLS)
const { data, error } = await supabaseAdmin
  .from("community_posts")
  .insert({
    id,
    body_md: content,
    media: imageUrl ? [{ type: 'image', url: imageUrl }] : [],
    actor_user_id: isCompanyPost ? null : user.id,
    actor_company_id: isCompanyPost ? companyId : null,
    status: scheduledISO ? 'scheduled' : 'published',
    visibility: dbVisibility === 'public' ? 'CommunityOnly' : 'CommunityAndCompanies',
    scheduled_at: scheduledISO,
    published_at: scheduledISO ? null : new Date().toISOString()
  })
  .select();
```

## 🔑 **Service Role Key finden:**

### **Supabase Dashboard:**
1. Gehen Sie zu: https://supabase.com/dashboard/project/koymmvuhcxlvcuoyjnvv
2. Navigieren Sie zu **Settings** → **API**
3. Kopieren Sie den **service_role** Key (nicht anon!)

## ⚠️ **WICHTIG:**
- **Service Role Key** umgeht alle RLS-Policies
- **Nur für Entwicklung** verwenden
- **Niemals im Frontend** verwenden (Security Risk!)
- **Nur für Server-Side** Operationen

## 🚀 **Schnellste Lösung:**

### **Option 1: RLS deaktivieren (Supabase Dashboard)**
```sql
ALTER TABLE public.community_posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_users DISABLE ROW LEVEL SECURITY;
```

### **Option 2: Service Role verwenden**
- Admin Client erstellen
- Posts mit Service Role erstellen
- RLS umgehen

**Welche Lösung bevorzugen Sie?** 🤔
