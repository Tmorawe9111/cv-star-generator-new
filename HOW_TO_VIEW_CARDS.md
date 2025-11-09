# 👀 How to View Candidate Cards - Quick Guide

## 🚀 Your Dev Server

**URL:** http://localhost:8080/
**Status:** ✅ Running (check terminal)

---

## 📍 Where to See the Cards

### 1️⃣ **LOCKED Cards (Search/Preview)**

**URL:** http://localhost:8080/company/search

**What You'll See:**
- Candidate cards in **locked state**
- Shows: First name only ("Max M.")
- Hides: Email, phone, full name
- Blue "Profil ansehen" button

**To Access:**
1. Open browser: http://localhost:8080/
2. **Login as Company** (if not logged in)
3. Navigate to: `/company/search`
4. Search for candidates
5. Cards will display in locked state

**Expected View:**
```
┌─────────────────────────────┐
│ 👤  Max M.                  │
│     IT / Azubi    🟡 75%  ♡ │
│ 📍 Berlin                    │
│ [JS] [React] [Node]         │
│                              │
│  🔒 PROFIL ANSEHEN          │
└─────────────────────────────┘
```

---

### 2️⃣ **UNLOCKED Cards (Dashboard)**

**URL:** http://localhost:8080/company/unlocked

**What You'll See:**
- Candidate cards in **unlocked state**
- Shows: Full name, email, phone
- Action buttons: Interview, Reject, CV Download
- Unlock reason badges

**To Access:**
1. Navigate to: `/company/unlocked`
2. View your unlocked candidates
3. Cards show full contact information

**Expected View:**
```
┌─────────────────────────────┐
│ 👤  Max Mustermann          │
│     [Bewerbung auf: Dev]    │
│ 📍 Berlin                    │
│ [JS] [React] [Node]         │
│ 📧 max@example.com          │
│ 📞 +49 123 456789           │
│                              │
│ [❌ Absagen][✅ Interview]   │
│ [👁️  Profil][💾 CV Down]    │
└─────────────────────────────┘
```

**Note:** If you don't have any unlocked candidates yet:
- Go to `/company/search`
- Click "Profil ansehen" on a locked card
- Click "Profil freischalten" to unlock (costs tokens)

---

### 3️⃣ **FULL PROFILE VIEW (LinkedIn-style)**

**URL:** http://localhost:8080/company/profile/:id

**What You'll See:**
- LinkedIn-style full profile page
- 2-column layout
- Left: Experience, Education, Activity
- Right: Contact card (if unlocked), Skills, Documents

**To Access:**
1. From search or unlocked page
2. Click "Profil ansehen" on any card
3. Opens full profile view
4. Shows lock banner if not unlocked

**Expected View:**
```
┌──────────────────────────────────────────┐
│ ← Back                    [Follow Button]│
├──────────────────────────────────────────┤
│ ⚠️  LOCKED STATE BANNER (if locked)      │
│     [🔒 Profil freischalten]             │
├──────────────┬───────────────────────────┤
│ LEFT COLUMN  │ RIGHT SIDEBAR             │
│              │                            │
│ Header       │ Contact Info (if unlocked)│
│ Experience   │ Skills                     │
│ Education    │ Languages                  │
│ Activity     │ Documents (if unlocked)    │
└──────────────┴───────────────────────────┘
```

---

## 🔐 Login Requirements

### To View Company Pages:

1. **You need to be logged in as a Company account**
2. If not logged in:
   - Go to: http://localhost:8080/auth
   - Sign up/Login as Company
   - Complete company onboarding if needed

### Test Accounts:

If you have test company accounts in Supabase:
- Use those credentials to login
- Or create a new company account

---

## 🧪 Testing Different Card States

### Test Locked Cards:
```bash
1. Navigate to: http://localhost:8080/company/search
2. Search for candidates
3. Cards should show locked state (first name only)
4. Click "Profil ansehen" to see preview
```

### Test Unlock Flow:
```bash
1. Go to: http://localhost:8080/company/search
2. Click "Profil ansehen" on a locked card
3. Click "Profil freischalten" button
4. Complete 3-step unlock modal
5. Pay tokens (if you have them)
6. Card updates to unlocked state
```

### Test Unlocked Cards:
```bash
1. Navigate to: http://localhost:8080/company/unlocked
2. View unlocked candidates
3. Full contact info visible
4. Actions (Interview, Reject) available
```

---

## 🎨 Making Changes & Viewing

### Live Reload (Automatic):

1. **Edit any file** (e.g., `ProfileCard.tsx`)
2. **Save the file** (Ctrl+S / Cmd+S)
3. **Browser auto-refreshes** ✨
4. **Changes appear immediately**

### Files You Can Edit:

```typescript
// Main card component
src/components/profile/ProfileCard.tsx

// Unlock modal
src/components/unlock/CandidateUnlockModal.tsx

// Search page
src/pages/Company/CandidateSearch.tsx

// Unlocked dashboard
src/pages/Company/Unlocked.tsx
```

### Example: Change Card Width

1. Open: `src/components/profile/ProfileCard.tsx`
2. Find line 49: `sm:max-w-[280px]`
3. Change to: `sm:max-w-[320px]`
4. Save file
5. Browser refreshes automatically
6. Check: http://localhost:8080/company/search

---

## 🐛 Troubleshooting

### Cards Not Showing?

**Check:**
1. Are you logged in as a company? ✅
2. Do you have candidates in the database? ✅
3. Is the dev server running? ✅ (check terminal)
4. Any errors in browser console? (F12)

### Can't See Unlocked Cards?

**Possible Reasons:**
1. No candidates unlocked yet
2. Need to unlock first from search page
3. Token balance might be zero

**Solution:**
- Go to `/company/search`
- Unlock a candidate first
- Then view at `/company/unlocked`

### Changes Not Appearing?

**Try:**
1. Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
2. Check browser console for errors (F12)
3. Check terminal for build errors
4. Restart dev server if needed

---

## 📊 Quick URL Reference

| Page | URL | Purpose |
|------|-----|---------|
| **Search** | `/company/search` | Find candidates (locked cards) |
| **Unlocked** | `/company/unlocked` | View unlocked candidates |
| **Profile** | `/company/profile/:id` | Full profile view |
| **Dashboard** | `/company/dashboard` | Company main dashboard |
| **Auth** | `/auth` | Login/Signup |

---

## 🎯 Recommended Testing Flow

### Step 1: View Locked Cards
```
1. Open: http://localhost:8080/company/search
2. Login as company (if needed)
3. Search for candidates
4. See locked cards (first name only)
```

### Step 2: View Profile Preview
```
1. Click "Profil ansehen" on any card
2. See LinkedIn-style preview
3. Notice locked state banner
```

### Step 3: Unlock a Candidate
```
1. Click "Profil freischalten"
2. Complete unlock modal (3 steps)
3. Pay tokens
4. See card update
```

### Step 4: View Unlocked Cards
```
1. Navigate to: /company/unlocked
2. See full contact info
3. Test action buttons
```

---

## 🚀 Next Steps

### To Customize Cards:

1. **Open:** `src/components/profile/ProfileCard.tsx`
2. **Make changes** (see Quick Reference guide)
3. **Save file**
4. **Check browser** - auto-refreshes
5. **View at:** http://localhost:8080/company/search

### To Test Unlock Flow:

1. **Make sure you have tokens** (check company wallet)
2. **Find a candidate** at `/company/search`
3. **Unlock them** via unlock modal
4. **Verify** they appear at `/company/unlocked`

---

## 💡 Pro Tips

### Browser DevTools:
- **F12** - Open developer tools
- **Elements** tab - Inspect card HTML
- **Console** tab - See any errors
- **Network** tab - Check API calls

### Hot Module Replacement:
- Vite automatically updates changes
- No need to refresh manually
- Instant feedback while coding

### Test on Mobile:
- Open: http://192.168.2.154:8080/ (network URL)
- Test on phone/tablet
- Cards are responsive!

---

**Happy Testing!** 🎉

If you have issues, check:
1. ✅ Dev server running
2. ✅ Logged in as company
3. ✅ Database has candidate data
4. ✅ No console errors

