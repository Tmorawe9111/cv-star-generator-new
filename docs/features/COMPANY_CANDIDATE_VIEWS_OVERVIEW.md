# Company Candidate Profile Views - Complete Overview

This document explains how candidate profiles appear to companies across different states and contexts in the CV Star Generator platform.

## 🎯 Overview

The system has **3 main states** for how companies see candidate profiles:

1. **🔒 LOCKED** (Preview/Search) - Before unlocking
2. **🔓 UNLOCKED** (Full Access) - After unlocking with tokens
3. **📄 PROFILE DETAIL VIEW** - LinkedIn-style full profile page

---

## 1️⃣ LOCKED STATE (Search/Discovery)

### 📍 Where: Company Search Page (`/company/search`)
### 💰 Cost: Not yet unlocked

### What Companies See:

**Profile Card (UnifiedCandidateCard / ProfileCard - "search" variant):**

```
┌─────────────────────────────────────────┐
│ 👤  [Avatar]  First Name Only           │
│              (Lastname initial only)     │
│              IT / Azubi                  │
│                            🟡 75% Match  │
│                                      ♡   │
├─────────────────────────────────────────┤
│ 💼 Azubi                                 │
│ 📍 Berlin, Deutschland                   │
│ 🚗 Führerschein                          │
├─────────────────────────────────────────┤
│ Sucht: Ausbildungsplatz                  │
│ Praktikum & Ausbildung                   │
├─────────────────────────────────────────┤
│ [JavaScript] [React] [Node.js] [+2]     │
├─────────────────────────────────────────┤
│                                          │
│   🔒 PROFIL ANSEHEN (Blue Button)        │
└─────────────────────────────────────────┘
```

### 🚫 Hidden Information (Locked):
- ❌ Full last name (only shows "Max M.")
- ❌ Email address
- ❌ Phone number
- ❌ Complete contact details
- ❌ CV download
- ❌ Detailed documents

### ✅ Visible Information:
- ✅ First name only
- ✅ Profile photo/avatar
- ✅ Job title/role
- ✅ City/location
- ✅ Skills (up to 5 shown)
- ✅ Driver's license status
- ✅ Job search preferences
- ✅ Match percentage
- ✅ Short bio (if available)

---

## 2️⃣ UNLOCKED STATE (After Token Payment)

### 📍 Where: Company Unlocked Dashboard (`/company/unlocked`)
### 💰 Cost: 1-3 tokens (depending on context)

### Unlock Costs:
- **1 Token**: Bewerbung (Application-based unlock)
- **2 Tokens**: Initiativ (Initiative unlock, no application)
- **3 Tokens**: Match-based unlock

### What Companies See:

**Full Profile Card (ProfileCard - "unlocked" variant):**

```
┌─────────────────────────────────────────┐
│ 👤  [Avatar]  Max Mustermann            │
│              IT / Azubi                  │
│              [Bewerbung auf: Dev Job]    │
│                            🟡 75% Match  │
│                                      ♡   │
├─────────────────────────────────────────┤
│ 💼 Azubi                                 │
│ 📍 Berlin, Deutschland                   │
│ 🚗 Führerschein                          │
├─────────────────────────────────────────┤
│ Sucht: Ausbildungsplatz                  │
│ Praktikum & Ausbildung                   │
├─────────────────────────────────────────┤
│ [JavaScript] [React] [Node.js] [+2]     │
├─────────────────────────────────────────┤
│ 📧 max@example.com                       │
│ 📞 +49 123 456789                        │
├─────────────────────────────────────────┤
│   ❌ Absagen    ✅ Interview planen      │
│   👁️  Profil    💾 CV Download           │
└─────────────────────────────────────────┘
```

### ✅ Newly Visible Information (After Unlock):
- ✅ **Full name** (Max Mustermann)
- ✅ **Email** (clickable mailto link)
- ✅ **Phone** (clickable tel link)
- ✅ **CV Download** button
- ✅ **Unlock context** badge (shows why/how unlocked)
- ✅ **Internal notes** from unlock
- ✅ **Interview actions** (Accept/Reject)
- ✅ **Linked job titles** (which jobs they applied to)

### Unlock Context Badges:
- `Bewerbung auf [Job Title]` - If unlocked via application
- `Initiativ freigeschaltet` - If unlocked without application
- `Match-basiert` - If unlocked from matching

---

## 3️⃣ FULL PROFILE VIEW (LinkedIn-Style)

### 📍 Where: Profile Detail Page (`/company/profile/:id`)
### 💰 Cost: Access depends on unlock state

### Layout: Two-Column Design

```
┌─────────────────────────────────────────────────────────────┐
│  ← Back to Search           [Follow/Folgen Button]          │
├─────────────────────────────────────────────────────────────┤
│  ⚠️  LOCKED STATE BANNER (if not unlocked):                 │
│  🔒 Profil nicht freigeschaltet                             │
│  "Schalten Sie das Profil frei, um vollständige             │
│   Kontaktdaten und Dokumente zu sehen"                      │
│              [🔒 Profil freischalten] Button                 │
├───────────────────────────────┬─────────────────────────────┤
│ LEFT COLUMN (Main Content)    │ RIGHT SIDEBAR               │
│                               │                             │
│ ┌──────────────────────────┐ │ ┌──────────────────────┐    │
│ │ Header Section           │ │ │ Contact Info Card    │    │
│ │ - Avatar (large)         │ │ │ (ONLY IF UNLOCKED)   │    │
│ │ - Full Name/First Name   │ │ │ - Email              │    │
│ │ - Headline               │ │ │ - Phone              │    │
│ │ - Location               │ │ │ - Location           │    │
│ │ - Match Badge            │ │ │ - Website            │    │
│ └──────────────────────────┘ │ └──────────────────────┘    │
│                               │                             │
│ ┌──────────────────────────┐ │ ┌──────────────────────┐    │
│ │ About Section            │ │ │ Profile Sidebar      │    │
│ │ - Bio/Description        │ │ │ - Skills             │    │
│ │ - Job Preferences        │ │ │ - Languages          │    │
│ └──────────────────────────┘ │ │ - License Info       │    │
│                               │ │ - CV Section         │    │
│ ┌──────────────────────────┐ │ └──────────────────────┘    │
│ │ Experience Section       │ │                             │
│ │ - Work history           │ │ ┌──────────────────────┐    │
│ │ - Apprenticeships        │ │ │ Weitere Dokumente    │    │
│ └──────────────────────────┘ │ │ (ONLY IF UNLOCKED)   │    │
│                               │ │ - Certificates       │    │
│ ┌──────────────────────────┐ │ │ - References         │    │
│ │ Education Section        │ │ │ - Portfolio          │    │
│ │ - Schools                │ │ └──────────────────────┘    │
│ │ - Training               │ │                             │
│ └──────────────────────────┘ │ ┌──────────────────────┐    │
│                               │ │ Advertisement        │    │
│ ┌──────────────────────────┐ │ └──────────────────────┘    │
│ │ Activity (if following)  │ │                             │
│ └──────────────────────────┘ │                             │
└───────────────────────────────┴─────────────────────────────┘
```

### 🔒 LOCKED Profile View:
- Shows: First name + initial ("Max M.")
- Shows: Public profile info (experience, education, skills)
- Shows: Avatar/photo
- Shows: Job preferences
- Hides: Email, phone, full last name
- Hides: Contact info card
- Hides: Documents section
- Hides: CV downloads

### 🔓 UNLOCKED Profile View:
- Shows: **Everything above PLUS:**
- Shows: Full name
- Shows: Contact info card (right sidebar)
- Shows: Email and phone (clickable)
- Shows: Weitere Dokumente section
- Shows: CV download options
- Shows: Follow/Unfollow functionality

---

## 🔑 UNLOCK FLOW (Modal)

### 📍 Component: `CandidateUnlockModal`

**3-Step Process:**

```
STEP 1: Select Unlock Type
┌─────────────────────────────────────┐
│ Freischaltungsgrund                 │
│                                     │
│ ○ Basierend auf Bewerbung (1 Token)│
│   "Freischaltung mit Bewerbungs-    │
│    kontext"                         │
│                                     │
│ ● Initiativ (2 Tokens)              │
│   "Optional Stelle auswählen oder   │
│    komplett initiativ"              │
│                                     │
│ 💰 Kosten: 2 Tokens                 │
│                                     │
│        [Abbrechen]  [Weiter]        │
└─────────────────────────────────────┘

STEP 2: Job Assignment & Notes
┌─────────────────────────────────────┐
│ Stelle (optional)                   │
│ [Dropdown: Select Job Post]         │
│ - Software Developer                │
│ - IT Azubi                          │
│ - Keine bestimmte Stelle            │
│                                     │
│ Interne Notiz (optional)            │
│ [Textarea]                          │
│ "Warum ist der Kandidat             │
│  interessant? Für welche Rolle?"    │
│                                     │
│   [Zurück] [Abbrechen] [Weiter]     │
└─────────────────────────────────────┘

STEP 3: Confirmation
┌─────────────────────────────────────┐
│ Zusammenfassung                     │
│                                     │
│ Kandidat: Max Mustermann            │
│ Art: Initiativ                      │
│ Stelle: Software Developer          │
│ Notiz: [Your notes]                 │
│                                     │
│ 💰 2 Tokens werden abgezogen        │
│                                     │
│  [Zurück] [Abbrechen] [Freischalten]│
└─────────────────────────────────────┘
```

### What Happens After Unlock:

1. **✅ Tokens Deducted** from company wallet
2. **✅ Profile Added** to `company_candidates` table
3. **✅ Notification Sent** to candidate
4. **✅ Contact Info Revealed** (email, phone, full name)
5. **✅ Card Updated** to show unlocked state
6. **✅ Analytics Logged** in `company_activity`

### Notification to Candidate:

**Initiativ Unlock:**
> 🎉 **Dein Profil wurde freigeschaltet**
> Ein Unternehmen hat dein Profil auf BeVisiblle freigeschaltet, weil es dich interessant findet – auch ohne konkrete Bewerbung.

**Bewerbung Unlock:**
> ✅ **Dein Profil wurde freigeschaltet**
> Das Unternehmen, bei dem du dich beworben hast, hat dein Profil freigeschaltet. Du bist jetzt für das Recruiting-Team sichtbar.

---

## 📊 COMPARISON TABLE

| Feature | 🔒 Locked | 🔓 Unlocked | 📄 Full Profile |
|---------|-----------|-------------|-----------------|
| **Name** | First name + initial | Full name | Full name |
| **Avatar** | ✅ Visible | ✅ Visible | ✅ Visible |
| **Email** | ❌ Hidden | ✅ Clickable | ✅ Clickable |
| **Phone** | ❌ Hidden | ✅ Clickable | ✅ Clickable |
| **Skills** | ✅ First 5 | ✅ All | ✅ All |
| **Location** | ✅ City only | ✅ Full | ✅ Full |
| **CV Download** | ❌ No | ✅ Yes | ✅ Yes |
| **Documents** | ❌ No | ✅ Yes | ✅ Yes |
| **Interview Actions** | ❌ No | ✅ Yes | ❌ No |
| **Follow/Unfollow** | ❌ No | ❌ No | ✅ Yes |
| **Activity Feed** | ❌ No | ❌ No | ✅ If following |
| **Job Context** | ❌ No | ✅ Yes | ✅ Yes |
| **Internal Notes** | ❌ No | ✅ Visible | ✅ Visible |

---

## 🎨 VISUAL DESIGN PATTERNS

### Color Coding by State:

**Locked (Search):**
- Avatar: Generic blue gradient icon (`User` icon)
- Primary Button: Blue (#3b82f6)
- Lock Icon: Yellow warning (#f59e0b)

**Unlocked (Dashboard):**
- Avatar: Real profile photo or initials
- Action Buttons: Green (Accept) / Red (Reject)
- Badge: Secondary variant (gray/blue)
- Contact Links: Blue (email) / Green (phone)

**Profile View:**
- Locked Banner: Yellow (#fef3c7 background)
- Unlocked Contact Card: White with border
- Follow Button: Primary blue or secondary gray

### Badge Styles:

```tsx
// Match Score Badge
🟡 75% Match (yellow dot + emerald text)

// Unlock Reason Badge
[Bewerbung auf: Dev Job] (secondary variant)
[Initiativ freigeschaltet] (secondary variant)

// Job Search Preferences Badge
- Praktikum: Red badge
- Ausbildung: Green badge
- Praktikum & Ausbildung: Amber badge
- Job nach Ausbildung: Blue badge
- Ausbildungsplatzwechsel: Purple badge
```

---

## 🔧 TECHNICAL COMPONENTS

### Main Components:

1. **`UnifiedCandidateCard`** (`src/components/candidate/UnifiedCandidateCard.tsx`)
   - Used in: Search, Applications
   - Props: `isUnlocked`, `onUnlock`, `onViewDetails`
   
2. **`ProfileCard`** (`src/components/profile/ProfileCard.tsx`)
   - Used in: Unlocked Dashboard
   - Props: `variant` ("search" | "dashboard" | "unlocked")
   
3. **`JobCandidateCard`** (`src/components/jobs/candidates/JobCandidateCard.tsx`)
   - Used in: Job-specific candidate lists
   - Props: `isUnlocked`, `tokenCost`, `onUnlock`

4. **`CandidateCard`** (`src/components/unlocked/CandidateCard.tsx`)
   - Used in: Unlocked profiles view
   - Full contact details visible

5. **`CandidateUnlockModal`** (`src/components/unlock/CandidateUnlockModal.tsx`)
   - Unlock workflow (3 steps)
   - Token management
   - Job assignment

### Key Pages:

1. **`/company/search`** - CandidateSearch.tsx
2. **`/company/unlocked`** - Unlocked.tsx
3. **`/company/profile/:id`** - ProfileView.tsx

---

## 💡 UX BEST PRACTICES

### For Locked State:
✅ **DO:**
- Show enough info to interest companies
- Display skills and job preferences
- Show match percentage prominently
- Use clear "locked" visual cues
- Make unlock button obvious

❌ **DON'T:**
- Show partial emails/phones
- Hide all information
- Make unlock cost unclear
- Auto-deduct tokens without confirmation

### For Unlocked State:
✅ **DO:**
- Show unlock context (why/when unlocked)
- Make contact info easy to find
- Provide quick actions (Interview, CV Download)
- Show linked job associations
- Display internal notes if added

❌ **DON'T:**
- Lose context of why profile was unlocked
- Hide contact info in nested menus
- Make CV downloads complicated
- Forget to show job connections

---

## 🔐 PRIVACY & SECURITY

### Data Protection:
- 🔒 Email/phone only shown after unlock
- 🔒 Last name partially hidden until unlock
- 🔒 Documents require unlock
- 🔒 CV download requires unlock
- 🔒 Full profile details behind unlock

### Token System:
- 💰 Prevents spam unlocks
- 💰 Different costs for different contexts
- 💰 Rollback on failure
- 💰 Audit trail in `company_activity`

---

## 📱 RESPONSIVE DESIGN

### Mobile/Tablet Views:
- Cards stack vertically on mobile
- Full-width on small screens
- Max width: 280px on desktop
- Grid layout: 1 col (mobile) → 2 col (tablet) → 3-4 col (desktop)
- Actions remain accessible (buttons don't shrink too much)

---

## 🚀 FUTURE IMPROVEMENTS

### Potential Enhancements:
1. **Preview Mode**: 30-second preview before unlock decision
2. **Bulk Unlock**: Unlock multiple candidates at discounted rate
3. **Smart Recommendations**: AI-suggested candidates to unlock
4. **Partial Unlock**: Unlock email only (cheaper option)
5. **Time-Limited Unlock**: Temporary access at lower cost
6. **Unlock Analytics**: Show which unlocks led to hires

---

## 📞 SUPPORT

For questions about the company candidate view system:
- Check unlock costs in `CandidateUnlockModal.tsx`
- Review unlock logic in `src/services/unlockService.ts`
- Check RLS policies in `setup_rls_policies_fixed.sql`
- Review token management in Supabase RPC functions

---

**Last Updated:** November 7, 2025
**Version:** 1.0
**Status:** ✅ Fully Implemented

