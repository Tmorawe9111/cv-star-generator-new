# 🚀 Company Candidate Cards - Quick Reference Guide

## 📁 File Locations

### Card Components

```
src/components/
├── candidate/
│   ├── UnifiedCandidateCard.tsx       ← Main card (search/applications)
│   └── ProfileManagementPanel.tsx     ← Profile sidebar panel
│
├── profile/
│   └── ProfileCard.tsx                ← Primary card component (all variants)
│
├── unlocked/
│   ├── CandidateCard.tsx             ← Unlocked candidate card
│   └── useEqualizeCards.tsx          ← Card height equalizer hook
│
├── jobs/candidates/
│   └── JobCandidateCard.tsx          ← Job-specific candidate card
│
└── unlock/
    ├── CandidateUnlockModal.tsx      ← 3-step unlock modal
    └── UnlockRequestModal.tsx        ← Alternative unlock modal
```

### Pages

```
src/pages/Company/
├── CandidateSearch.tsx              ← Search page (locked cards)
├── Unlocked.tsx                     ← Unlocked dashboard (full access)
├── ProfileView.tsx                  ← LinkedIn-style profile page
├── JobDetail.tsx                    ← Single job with candidates
└── Dashboard.tsx                    ← Company main dashboard
```

### Services & Utilities

```
src/services/
└── unlockService.ts                 ← Unlock logic & API calls

src/lib/api/
└── applications.ts                  ← searchCandidates, unlockCandidate

src/utils/
└── applicationStatus.ts             ← Status configs & badges
```

---

## 🎯 Common Tasks

### 1. Change Card Design (Locked State)

**File:** `src/components/profile/ProfileCard.tsx`
**Line:** 49-220

```tsx
// Find the card wrapper
<article className="ab-card flex h-full w-full max-w-full sm:max-w-[280px]...">

// Change:
- Card width: max-w-[280px]
- Padding: p-3
- Border radius: rounded-xl
- Background: bg-white
```

**Preview Changes:**
```bash
# Server is already running on http://localhost:8080/
# Just save the file and refresh browser
```

---

### 2. Change Card Design (Unlocked State)

**File:** `src/components/profile/ProfileCard.tsx`
**Section:** variant === "unlocked" (lines 171-208)

```tsx
// Contact Info Section
{variant === "unlocked" && (p.email || p.phone) && (
  <div className="mt-2 space-y-1 text-[12px]">
    {p.email && (
      <div className="flex items-center gap-1 text-gray-700">
        <Mail className="h-3 w-3 text-gray-400" />
        <a href={`mailto:${p.email}`}>...</a>
      </div>
    )}
  </div>
)}

// Action Buttons Section
<div className="mt-2 flex h-[44px] items-center gap-2">
  <button onClick={onView}...>
    Profil ansehen
  </button>
  <button onClick={onDownload}...>
    CV Download
  </button>
</div>
```

---

### 3. Modify Unlock Modal

**File:** `src/components/unlock/CandidateUnlockModal.tsx`

**Change Token Costs (lines 70-75):**
```tsx
const tokenCost = useMemo(() => {
  if (alreadyUnlocked) return 0;
  if (contextType === "match") return 3;      // Change this
  if (unlockType === "bewerbung") return 1;   // Change this
  return 2; // initiativ                       // Change this
}, [unlockType, contextType, alreadyUnlocked]);
```

**Change Modal Steps:**
- Step 1: Lines 431-468 (Unlock type selection)
- Step 2: Lines 470-488 (Job assignment)
- Step 3: Lines 490-522 (Confirmation)

---

### 4. Change What's Visible in Locked State

**File:** `src/components/profile/ProfileCard.tsx`
**Lines:** 64-68

```tsx
// Current: Shows first name only
<h3 className="truncate text-sm font-semibold">
  {p.name}  // In locked state, this is "Max M."
</h3>

// To show more/less, modify the data passed to the card
// in the parent component (e.g., CandidateSearch.tsx)
```

**In parent component (ProfileView.tsx, lines 165-170):**
```tsx
// Mask data if not unlocked
const displayProfile = isUnlocked ? profile : profile ? {
  ...profile,
  nachname: profile.nachname ? `${profile.nachname[0]}.` : '',
  email: null,      // ← Change what's hidden here
  telefon: null,    // ← Change what's hidden here
} : null;
```

---

### 5. Add New Action Button

**File:** `src/components/profile/ProfileCard.tsx`
**Lines:** 192-208

```tsx
// Add new button
<div className="mt-2 flex h-[44px] items-center gap-2">
  <button onClick={onView}>...</button>
  <button onClick={onDownload}>...</button>
  
  {/* ADD YOUR NEW BUTTON HERE */}
  <button 
    onClick={onYourNewAction}
    className="inline-flex h-9 flex-1 items-center justify-center..."
  >
    <YourIcon className="h-4 w-4" />
    <span>Your Action</span>
  </button>
</div>
```

**Don't forget to:**
1. Add prop to component: `onYourNewAction?: () => void`
2. Pass handler from parent component

---

### 6. Customize Match Badge

**File:** `src/components/profile/ProfileCard.tsx`
**Lines:** 82-87

```tsx
{p.match != null && (
  <span className="flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1">
    <span className="h-2 w-2 rounded-full bg-yellow-400" />  {/* Change color */}
    <span className="text-xs font-semibold text-emerald-600">{match}%</span>
  </span>
)}
```

**Color options:**
- `bg-yellow-400` → Gold/warning
- `bg-green-400` → Success
- `bg-blue-400` → Info
- `bg-red-400` → Important

---

### 7. Change Skills Badge Style

**File:** `src/components/profile/ProfileCard.tsx`
**Lines:** 136-141

```tsx
{p.skills.map((s, i) => (
  <span 
    key={i} 
    className="rounded-full bg-gray-100 px-2 py-1 text-[11px]..."
  >
    {s}
  </span>
))}

// Change:
- rounded-full → rounded-lg (less round)
- bg-gray-100 → bg-blue-50 (colored background)
- text-[11px] → text-[10px] (smaller)
```

---

### 8. Modify Contact Info Display (Unlocked)

**File:** `src/components/profile/ProfileCard.tsx`
**Lines:** 151-166

```tsx
{variant === "unlocked" && (p.email || p.phone) && (
  <div className="mt-2 space-y-1 text-[12px]">
    {p.email && (
      <div className="flex items-center gap-1 text-gray-700">
        <Mail className="h-3 w-3 text-gray-400" />
        <a 
          href={`mailto:${p.email}`} 
          className="truncate hover:underline"
        >
          {p.email}
        </a>
      </div>
    )}
    {/* ADD MORE CONTACT FIELDS HERE */}
  </div>
)}
```

---

### 9. Change Card Grid Layout

**File:** `src/pages/Company/Unlocked.tsx`
**Lines:** 386-508

```tsx
<div 
  ref={gridRef} 
  className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
>
  {/* Cards render here */}
</div>

// Change grid columns:
// sm:grid-cols-2  ← Tablet: 2 columns
// lg:grid-cols-3  ← Desktop: 3 columns
// xl:grid-cols-4  ← Large: 4 columns

// Change gap:
// gap-4 ← 16px gap between cards
```

---

### 10. Add Unlock Notification Text

**File:** `src/components/unlock/CandidateUnlockModal.tsx`
**Lines:** 254-282

```tsx
// Initiativ unlock notification (lines 254-267)
await supabase.rpc("create_notification", {
  p_recipient_id: candidate.user_id,
  p_type: "candidate_message",
  p_title: "Dein Profil wurde freigeschaltet 🎉",  // Change title
  p_body: "Ein Unternehmen hat...",                // Change body
  ...
});

// Bewerbung unlock notification (lines 268-282)
await supabase.rpc("create_notification", {
  p_title: "Dein Profil wurde freigeschaltet ✅",  // Change title
  p_body: "Das Unternehmen...",                    // Change body
  ...
});
```

---

## 🎨 Styling Quick Reference

### Tailwind Classes Used

```css
/* Card Container */
.ab-card                    /* Custom card class */
rounded-xl                  /* Border radius: 12px */
border                      /* 1px border */
bg-white                    /* White background */
shadow-sm                   /* Subtle shadow */
p-3                        /* Padding: 12px */

/* Typography */
text-sm                     /* 14px */
text-xs                     /* 12px */
text-[11px]                /* 11px (custom) */
font-semibold              /* Font weight: 600 */
font-medium                /* Font weight: 500 */

/* Colors */
text-gray-700              /* Text color */
text-emerald-600           /* Match text */
bg-blue-600                /* Primary button */
bg-gray-100                /* Badge background */

/* Layout */
flex                       /* Flexbox */
grid                       /* Grid */
gap-2                      /* Gap: 8px */
gap-4                      /* Gap: 16px */

/* Spacing */
mt-1                       /* Margin top: 4px */
mt-2                       /* Margin top: 8px */
mt-3                       /* Margin top: 12px */
px-2                       /* Padding X: 8px */
py-1                       /* Padding Y: 4px */
```

---

## 🔧 Development Commands

### Start Dev Server
```bash
cd cv-star-generator
npm run dev
```
**URL:** http://localhost:8080/

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

### Lint Code
```bash
npm run lint
```

---

## 🧪 Testing Changes

### Test Locked Cards
1. Go to: http://localhost:8080/company/search
2. Search for candidates
3. Cards should show limited info
4. Click "Profil ansehen" to preview

### Test Unlocked Cards
1. Go to: http://localhost:8080/company/unlocked
2. View your unlocked candidates
3. Full contact info visible
4. Actions (Interview, Reject) available

### Test Unlock Flow
1. Find locked candidate
2. Click "Profil freischalten"
3. Complete 3-step modal
4. Verify token deduction
5. Check card updates to unlocked state

---

## 🐛 Common Issues & Fixes

### Issue: Cards not displaying
**Fix:** Check if data is being fetched
```tsx
// Add console.log to debug
console.log('Candidates:', candidates);
```

### Issue: Contact info not showing (unlocked)
**Fix:** Check variant prop
```tsx
<ProfileCard
  variant="unlocked"  // ← Must be "unlocked"
  profile={{ ...profile, email: "...", phone: "..." }}
/>
```

### Issue: Unlock modal not opening
**Fix:** Check modal state
```tsx
const [unlockModalOpen, setUnlockModalOpen] = useState(false);

// Make sure this is called:
setUnlockModalOpen(true);
```

### Issue: Cards have different heights
**Fix:** Use equalizer hook
```tsx
const gridRef = useEqualizeCards();

<div ref={gridRef} className="grid...">
  {/* cards */}
</div>
```

---

## 📊 Data Flow

### Search → Card Display
```
1. Company searches candidates
   ↓
2. API call: searchCandidates(query)
   ↓
3. Data returned (limited info)
   ↓
4. Render ProfileCard (variant="search")
   ↓
5. User clicks "Profil ansehen"
   ↓
6. Navigate to /company/profile/:id
```

### Unlock Flow
```
1. User clicks "Profil freischalten"
   ↓
2. CandidateUnlockModal opens
   ↓
3. Step 1: Select unlock type
   ↓
4. Step 2: Choose job & add notes
   ↓
5. Step 3: Confirm & pay tokens
   ↓
6. RPC: unlock_candidate_profile()
   ↓
7. Tokens deducted
   ↓
8. Notification sent to candidate
   ↓
9. Card re-renders with full info
   ↓
10. Added to /company/unlocked
```

---

## 🎯 Key Props

### ProfileCard Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `profile` | `Profile` | ✅ | Candidate data |
| `variant` | `"search" \| "dashboard" \| "unlocked"` | ❌ | Card display mode |
| `unlockReason` | `string` | ❌ | Shows why unlocked |
| `unlockNotes` | `string` | ❌ | Internal notes |
| `onView` | `() => void` | ❌ | View profile handler |
| `onDownload` | `() => void` | ❌ | Download CV handler |
| `onUnlock` | `() => void` | ❌ | Unlock handler |
| `onAcceptInterview` | `() => void` | ❌ | Interview handler |
| `onReject` | `() => void` | ❌ | Reject handler |
| `onToggleFavorite` | `() => void` | ❌ | Favorite handler |

### Profile Object

```typescript
type Profile = {
  id: string;
  name: string;           // "Max M." (locked) or "Max Mustermann" (unlocked)
  avatar_url?: string;
  role?: string;          // "IT" or "Handwerk"
  city?: string;          // "Berlin"
  fs?: boolean;           // Has driver's license
  seeking?: string;       // "Ausbildung"
  status?: string;        // "azubi" | "schüler"
  email?: string;         // Only when unlocked
  phone?: string;         // Only when unlocked
  skills: string[];       // ["React", "JavaScript"]
  match?: number;         // 0-100
};
```

---

## 🚨 Important Notes

### Security
- ⚠️ **NEVER** show email/phone in locked state
- ⚠️ **ALWAYS** check `isUnlocked` before displaying contact info
- ⚠️ **VERIFY** token balance before unlock
- ⚠️ **ROLLBACK** tokens if unlock fails

### Performance
- ✅ Use virtualization for 100+ cards
- ✅ Lazy load avatar images
- ✅ Debounce search input (300ms)
- ✅ Paginate results (20 per page)
- ✅ Memoize card components

### UX Best Practices
- ✅ Show clear "locked" visual indicators
- ✅ Display unlock cost before action
- ✅ Provide unlock context after payment
- ✅ Make contact info easy to access (unlocked)
- ✅ Use consistent card heights

---

## 📞 Need Help?

### File to Check First
1. Card not rendering? → `src/components/profile/ProfileCard.tsx`
2. Unlock not working? → `src/components/unlock/CandidateUnlockModal.tsx`
3. Search issues? → `src/pages/Company/CandidateSearch.tsx`
4. Unlocked page issues? → `src/pages/Company/Unlocked.tsx`

### Debug Commands
```tsx
// Add to component
console.log('Profile data:', profile);
console.log('Is unlocked:', isUnlocked);
console.log('Variant:', variant);
```

### Check Database
```sql
-- Check unlock status
SELECT * FROM company_candidates 
WHERE company_id = 'your-company-id' 
AND unlocked_at IS NOT NULL;

-- Check token balance
SELECT balance FROM company_token_wallets 
WHERE company_id = 'your-company-id';
```

---

## 🎓 Learning Path

1. **Start Here:** Read `COMPANY_CANDIDATE_VIEWS_OVERVIEW.md`
2. **Visual Guide:** Check `CARD_VISUAL_COMPARISON.md`
3. **Code Dive:** Explore `ProfileCard.tsx`
4. **Test:** Make small styling changes
5. **Advanced:** Modify unlock flow logic

---

**Quick Reference Version:** 1.0
**Last Updated:** November 7, 2025
**Developer Friendly:** ✅

Happy coding! 🚀

