# 🎨 Visual Card Comparison - Company Candidate Views

## Side-by-Side Card Comparison

### 🔒 LOCKED CARD (Before Unlock) vs 🔓 UNLOCKED CARD (After Unlock)

```
┌──────────────────────────────────────┐  ┌──────────────────────────────────────┐
│        🔒 LOCKED STATE               │  │        🔓 UNLOCKED STATE             │
│        (SEARCH/PREVIEW)              │  │        (DASHBOARD)                   │
├──────────────────────────────────────┤  ├──────────────────────────────────────┤
│                                      │  │                                      │
│  [👤]  Max M.                        │  │  [👤]  Max Mustermann               │
│        IT / Azubi                    │  │        IT / Azubi                    │
│                                      │  │        [📋 Bewerbung auf: Dev]       │
│                         🟡 75%  ♡    │  │                         🟡 75%  ♡    │
│                                      │  │                                      │
│  💼 Azubi                            │  │  💼 Azubi                            │
│  📍 Berlin, Deutschland              │  │  📍 Berlin, Deutschland              │
│  🚗 Führerschein                     │  │  🚗 Führerschein                     │
│                                      │  │                                      │
│  Sucht: Ausbildungsplatz             │  │  Sucht: Ausbildungsplatz             │
│  Praktikum & Ausbildung              │  │  Praktikum & Ausbildung              │
│                                      │  │                                      │
│  [JS] [React] [Node] [HTML] [+2]    │  │  [JS] [React] [Node] [HTML] [+2]    │
│                                      │  │                                      │
│  ❌ EMAIL HIDDEN                     │  │  📧 max.mustermann@example.com       │
│  ❌ PHONE HIDDEN                     │  │  📞 +49 123 456789                   │
│                                      │  │                                      │
│                                      │  │  ┌────────────┬────────────┐         │
│                                      │  │  │ ❌ Absagen │ ✅ Interview│         │
│  ┌───────────────────────────────┐  │  │  └────────────┴────────────┘         │
│  │   🔒 PROFIL ANSEHEN           │  │  │  ┌────────────┬────────────┐         │
│  │   (Blue Button)               │  │  │  │ 👁️  Profil │ 💾 CV Down │         │
│  └───────────────────────────────┘  │  │  └────────────┴────────────┘         │
│                                      │  │                                      │
└──────────────────────────────────────┘  └──────────────────────────────────────┘
        280px max width                           280px max width
        White background                          White background
        Hover: shadow-md                          Hover: shadow-md
```

---

## 📊 Information Reveal Comparison

### What Changes After Unlock?

```
BEFORE UNLOCK (🔒)              →    AFTER UNLOCK (🔓)
─────────────────────────────────────────────────────────────

NAME
"Max M."                        →    "Max Mustermann"
(First name + initial)               (Full name)

CONTACT
❌ Not shown                    →    ✅ max@example.com (clickable)
❌ Not shown                    →    ✅ +49 123 456789 (clickable)

ACTIONS
[🔒 Profil ansehen]            →    [❌ Absagen] [✅ Interview]
                                    [👁️  Profil] [💾 CV Download]

CONTEXT
(None)                          →    [📋 Bewerbung auf: Job Title]
                                    or [Initiativ freigeschaltet]

DOCUMENTS
❌ No access                    →    ✅ CV downloadable
                                    ✅ Weitere Dokumente visible

COST
Free to view                    →    1-3 tokens spent
                                    (depending on unlock type)
```

---

## 🎯 Card Layouts by Context

### 1. Search Page (`/company/search`)

**Purpose:** Discover new candidates
**Component:** `UnifiedCandidateCard`

```
┌────────────────────────────────────────────────┐
│ Grid Layout (Responsive)                       │
├────────────────────────────────────────────────┤
│                                                │
│  [Card 1] [Card 2] [Card 3] [Card 4]         │
│  [Card 5] [Card 6] [Card 7] [Card 8]         │
│  [Card 9] ...                                 │
│                                                │
│  All cards in LOCKED state                    │
│  Click "Profil ansehen" → Opens preview      │
│  Click "Freischalten" → Opens unlock modal    │
│                                                │
└────────────────────────────────────────────────┘

Mobile: 1 column
Tablet: 2 columns  
Desktop: 3 columns
Large: 4 columns
```

### 2. Unlocked Dashboard (`/company/unlocked`)

**Purpose:** Manage unlocked candidates
**Component:** `ProfileCard` with variant="unlocked"

```
┌────────────────────────────────────────────────┐
│ Tabs: [Freigeschaltet] [Angeschaut]           │
├────────────────────────────────────────────────┤
│                                                │
│  ☑️  [Card 1]  ☑️  [Card 2]  [Card 3]         │
│  (selected)    (selected)                     │
│                                                │
│  [Card 4]     [Card 5]     [Card 6]          │
│                                                │
│  All cards in UNLOCKED state                  │
│  Checkbox for bulk operations                 │
│  Shows full contact info                      │
│  Interview/Reject actions visible             │
│                                                │
└────────────────────────────────────────────────┘

Features:
- Bulk selection
- CSV/XLSX export
- Stage management
- Search/filter
```

### 3. Job Candidates (`/company/jobs/:id/candidates`)

**Purpose:** Candidates for specific job
**Component:** `JobCandidateCard`

```
┌────────────────────────────────────────────────┐
│ Job: Software Developer (12 Kandidaten)       │
├────────────────────────────────────────────────┤
│                                                │
│  Pipeline View:                               │
│                                                │
│  [Neu]      [Interview]    [Angebot]         │
│  ┌──────┐   ┌──────┐      ┌──────┐           │
│  │Card 1│   │Card 4│      │Card 7│           │
│  │Card 2│   │Card 5│      │      │           │
│  │Card 3│   │Card 6│      │      │           │
│  └──────┘   └──────┘      └──────┘           │
│                                                │
│  Cards show:                                  │
│  - Lock status                                │
│  - Application context                        │
│  - Token cost if locked                       │
│  - Stage-specific actions                     │
│                                                │
└────────────────────────────────────────────────┘
```

---

## 🔄 Card State Transitions

```
DISCOVERY → PREVIEW → UNLOCK → UNLOCKED → INTERVIEW

   🔍         👁️        💰        ✅          🤝

  [Card]   [Profile]  [Modal]   [Card]    [Actions]
  Locked   Detail     3-Step    Unlocked  Interview
           Page       Process             Planning
```

### State Flow Diagram:

```
                    START
                      ↓
        ┌─────────────────────────┐
        │   🔒 LOCKED CARD        │
        │   (Search/Discovery)    │
        └─────────────────────────┘
                      ↓
           Click "Profil ansehen"
                      ↓
        ┌─────────────────────────┐
        │  📄 PROFILE PREVIEW      │
        │  (LinkedIn-style page)   │
        │  Limited info visible    │
        └─────────────────────────┘
                      ↓
         Click "Profil freischalten"
                      ↓
        ┌─────────────────────────┐
        │  🔓 UNLOCK MODAL         │
        │  Step 1: Select type     │
        │  Step 2: Job & notes     │
        │  Step 3: Confirm         │
        └─────────────────────────┘
                      ↓
          Pay tokens & confirm
                      ↓
        ┌─────────────────────────┐
        │  ✅ UNLOCKED CARD        │
        │  Full contact visible    │
        │  Actions available       │
        └─────────────────────────┘
                      ↓
        ┌─────────────────────────┐
        │  📋 MANAGE CANDIDATE     │
        │  - Interview            │
        │  - Reject               │
        │  - Download CV          │
        │  - View full profile    │
        └─────────────────────────┘
```

---

## 🎨 Visual Design Tokens

### Colors

```css
/* Locked State */
--locked-bg: #fef3c7 (yellow-50)
--locked-border: #fde68a (yellow-200)
--locked-text: #92400e (yellow-900)
--locked-icon: #f59e0b (yellow-500)

/* Unlocked State */
--unlocked-bg: #ffffff (white)
--unlocked-border: #e5e7eb (gray-200)
--success-text: #059669 (green-600)
--action-blue: #3b82f6 (blue-500)

/* Match Badge */
--match-bg: #f3f4f6 (gray-100)
--match-dot: #fbbf24 (yellow-400)
--match-text: #059669 (emerald-600)

/* Action Buttons */
--reject-bg: #fee2e2 (red-50)
--reject-border: #fecaca (red-200)
--reject-text: #dc2626 (red-600)

--accept-bg: #d1fae5 (green-50)
--accept-border: #a7f3d0 (green-200)
--accept-text: #059669 (green-600)
```

### Typography

```css
/* Card Name */
font-size: 14px (sm)
font-weight: 600 (semibold)
line-height: truncate (1 line)

/* Role/Status */
font-size: 12px (xs)
color: text-gray-600

/* Skills Badge */
font-size: 11px
padding: 2px 8px
background: gray-100
border-radius: 9999px

/* Contact Info (Unlocked) */
font-size: 12px
color: blue-600 (email) / green-600 (phone)
text-decoration: hover:underline
```

### Spacing

```css
/* Card */
padding: 12px (p-3)
gap: 8px
border-radius: 12px (rounded-xl)
max-width: 280px

/* Sections */
--header-height: 48px (min)
--meta-height: 48px (min)
--intent-height: 36px (min)
--skills-height: 64px (min)
--actions-height: 44px (each)

/* Grid */
gap: 16px (gap-4)
columns: 1-4 (responsive)
```

---

## 📱 Responsive Breakpoints

```css
/* Mobile First */
.card-grid {
  display: grid;
  gap: 1rem;
  
  /* Mobile: 1 column */
  grid-template-columns: 1fr;
  
  /* Tablet: 2 columns */
  @media (min-width: 640px) {
    grid-template-columns: repeat(2, 1fr);
  }
  
  /* Desktop: 3 columns */
  @media (min-width: 1024px) {
    grid-template-columns: repeat(3, 1fr);
  }
  
  /* Large: 4 columns */
  @media (min-width: 1280px) {
    grid-template-columns: repeat(4, 1fr);
  }
}
```

---

## 🔔 Interactive Elements

### Hover States

```
LOCKED CARD:
- Hover: shadow-md transition
- Cursor: pointer on entire card
- Button hover: bg-blue-700

UNLOCKED CARD:
- Hover: shadow-md transition
- Email hover: underline, text-blue-700
- Phone hover: underline, text-green-700
- Reject button hover: bg-red-100
- Accept button hover: bg-green-100
```

### Click Behaviors

```
LOCKED:
- Click card → Open preview page
- Click "Profil ansehen" → Open preview page
- Click unlock (via preview) → Open unlock modal

UNLOCKED:
- Click checkbox → Toggle selection
- Click email → Open mail client
- Click phone → Open dialer
- Click "Profil ansehen" → Open full profile
- Click "CV Download" → Generate/download PDF
- Click "❌ Absagen" → Reject candidate
- Click "✅ Interview" → Schedule interview
```

---

## 💡 Design Principles

### Visual Hierarchy

1. **Name** - Most prominent (bold, larger)
2. **Match Badge** - Eye-catching (yellow dot)
3. **Skills** - Easy to scan (pills)
4. **Contact** (unlocked) - Accessible (icons + color)
5. **Actions** - Clear CTAs (buttons)

### Information Architecture

```
TOP     → Identity (Name, Avatar, Role)
MIDDLE  → Context (Location, Skills, Job Search)
BOTTOM  → Actions (Buttons, Contact)
```

### Accessibility

- ✅ Color contrast: WCAG AA compliant
- ✅ Focus indicators on interactive elements
- ✅ ARIA labels on buttons
- ✅ Keyboard navigation support
- ✅ Screen reader friendly

---

## 🚀 Performance

### Card Rendering

```javascript
// Efficient rendering patterns
- Virtualized scrolling for large lists
- Lazy loading for avatar images
- Memoized card components
- Debounced search/filter
- Pagination (20 cards per page)
```

### Optimization Tips

1. **Images:** Use WebP format, lazy load
2. **Lists:** Implement virtual scrolling for 100+ cards
3. **Filtering:** Debounce search input (300ms)
4. **State:** Use React Query for caching
5. **Animations:** Use CSS transforms (GPU accelerated)

---

## 📦 Card Component Props

### ProfileCard Props

```typescript
type ProfileCardProps = {
  profile: {
    id: string;
    name: string;                 // "Max M." or "Max Mustermann"
    avatar_url?: string | null;
    role?: string | null;
    city?: string | null;
    fs?: boolean | null;          // Führerschein
    seeking?: string | null;
    status?: string | null;
    email?: string | null;        // Only if unlocked
    phone?: string | null;        // Only if unlocked
    skills: string[];
    match?: number | null;        // 0-100
  };
  
  variant?: "search" | "dashboard" | "unlocked";
  unlockReason?: string;          // e.g. "Bewerbung auf: Dev Job"
  unlockNotes?: string;           // Internal notes
  
  // Actions
  onUnlock?: () => void;
  onView?: () => void;
  onDownload?: () => void;
  onToggleFavorite?: () => void;
  onAcceptInterview?: () => void;
  onReject?: () => void;
};
```

---

## 🎯 Usage Examples

### Example 1: Search Page (Locked)

```tsx
<ProfileCard
  profile={{
    id: "123",
    name: "Max M.",              // Partial name
    avatar_url: null,
    role: "IT",
    city: "Berlin",
    fs: true,
    seeking: "Ausbildung",
    email: null,                 // Hidden
    phone: null,                 // Hidden
    skills: ["JavaScript", "React"],
    match: 75
  }}
  variant="search"
  onView={() => navigate(`/company/profile/123`)}
/>
```

### Example 2: Unlocked Dashboard

```tsx
<ProfileCard
  profile={{
    id: "123",
    name: "Max Mustermann",      // Full name
    avatar_url: "https://...",
    role: "IT",
    city: "Berlin",
    fs: true,
    seeking: "Ausbildung",
    email: "max@example.com",    // Visible
    phone: "+49 123 456789",     // Visible
    skills: ["JavaScript", "React", "Node.js"],
    match: 75
  }}
  variant="unlocked"
  unlockReason="Bewerbung auf: Software Developer"
  unlockNotes="Sehr gute Skills, Interview vereinbaren"
  onView={() => navigate(`/company/profile/123`)}
  onDownload={() => downloadCV("123")}
  onAcceptInterview={() => scheduleInterview("123")}
  onReject={() => rejectCandidate("123")}
/>
```

---

**Created:** November 7, 2025
**For:** CV Star Generator - Company View
**Status:** ✅ Production Ready

