# Company Onboarding Journey - Current State

## Overview
The company onboarding flow has **two separate entry points** that lead to different experiences:

1. **`/signup/company`** - `CompanySignup.tsx` (Primary, simpler flow)
2. **`/company-advanced`** or **`/unternehmen/onboarding`** - `CompanyOnboarding.tsx` (Advanced flow with price calculator)

---

## Flow 1: CompanySignup (`/signup/company`)

### Step 1: Company Information
**Fields:**
- Firmenname (Company Name) *
- Rechtsform (Legal Form) - optional
- Unternehmensgröße (Company Size) * - dropdown (1-10, 11-25, 26-50, 51-100, 101-250, 250+)
- Website - optional
- Land (Country) *
- Stadt (City) *
- Admin – Vorname (First Name) *
- Admin – Nachname (Last Name) *
- Telefon (Phone) *

**Validation:**
- All required fields must be filled
- Terms & Conditions checkbox must be checked
- Optional: Marketing updates checkbox

**UI:**
- 2-step progress indicator
- Modern gradient background
- Left side: Marketing content + image
- Right side: Form in white card

### Step 2: Email & Authentication
**Fields:**
- Geschäftliche E-Mail (Business Email) *
- Password (optional) - if user chooses password-based auth
- Password Confirm (if password chosen)

**Options:**
- Magic Link (default) - no password required
- Password-based signup (toggle option)

**Validation:**
- Valid email format
- If password: min 8 characters, must match confirmation

**After Submission:**
- **Password flow:** Creates auth user → Calls `create_company_account` RPC → Updates company with `selected_plan_id` → Redirects to `/company/dashboard`
- **Magic Link flow:** Saves company data to `localStorage` → Sends OTP email → Shows confirmation screen (Step 3) → User clicks email link → Should process `pending_company_signup` from localStorage

### Step 3: Magic Link Confirmation (if Magic Link chosen)
- Shows success message
- Displays email address
- "Erneut versenden" (Resend) option

---

## Flow 2: CompanyOnboarding (`/company-advanced` or `/unternehmen/onboarding`)

### Step 1: Company Details + Business Info
**Fields:**
- Unternehmensname (Company Name) *
- Unternehmensgröße (Company Size) * - dropdown
- Standort (Location) * - format: "City, Country"
- Website - optional
- Ansprechpartner (Contact Person) *
- Telefon (Phone) *
- **Branchen (Industries)** * - multi-select via `BranchSelector` component
- **Zielgruppen (Target Groups)** * - multi-select via `TargetGroupSelector` component

**Right Sidebar:**
- `PriceCalculator` component - shows pricing based on selected target groups and branches

**Validation:**
- All required fields
- Location must include comma (City, Country format)
- At least one industry selected
- At least one target group selected

### Step 2: Account Creation
**Fields:**
- E-Mail-Adresse (Email) *
- Passwort (Password) *
- Passwort bestätigen (Confirm Password) *
- Terms checkbox *
- Privacy checkbox *

**Options:**
- Google Sign-In button (currently disabled)
- Email/Password signup

**After Submission:**
- Checks for duplicate company by email
- Creates auth user
- Calls `create_company_account` RPC with retry logic (3 attempts with exponential backoff)
- Verifies company creation
- Updates company if data mismatch
- Redirects to `/company/dashboard`
- On error: Saves to `localStorage` as `company_onboarding_pending` for retry

---

## Post-Onboarding Experience

### After Successful Signup
1. **Redirect:** Both flows redirect to `/company/dashboard`
2. **Onboarding Wizard:** There IS an onboarding system in place! (`CompanyLayout` + `useCompanyOnboarding`)

### Onboarding Wizard Flow (Post-Signup)

The onboarding wizard appears as **modal popups** when a company first accesses the company portal. It's managed by `CompanyLayout` and `useCompanyOnboarding` hook.

**Steps:**
1. **Step 0: BrancheSelector** - Select industry/branches
2. **Step 1: TargetGroupSelector** - Select target groups
3. **Step 2: PlanSelector** - Select a plan
4. **Step 3: WelcomePopup** - Welcome message and completion

**State Management:**
- Stored in `companies` table: `onboarding_step`, `onboarding_completed`
- Also stores: `industry`, `target_groups`, `selected_plan_id`
- Hook: `useCompanyOnboarding` manages state and updates

**Magic Link Handling:**
- ✅ `CompanyLayout` checks `localStorage` for `pending_company_signup`
- ✅ Processes it when user logs in via magic link
- ✅ Creates company account and removes localStorage data

### Dashboard After Onboarding
Once onboarding is complete, user sees:
- Stats grid
- Pipeline tabs
- Candidate list
- Job highlights
- Quick actions

### Potential Issues
- ⚠️ Onboarding wizard may not trigger if `onboarding_completed` is already `true`
- ⚠️ If user skips onboarding, they may miss important setup steps
- ⚠️ No way to restart onboarding if needed
- ⚠️ No profile completion check (company profile fields)

---

## Database Function: `create_company_account`

**RPC Parameters:**
- `p_name` - Company name
- `p_primary_email` - Primary email
- `p_city` - City
- `p_country` - Country
- `p_size_range` - Size range
- `p_contact_person` - Contact person name
- `p_phone` - Phone number
- `p_created_by` - User ID (auth user)
- `p_website` - Website URL (optional)
- `p_industry` - Industry (optional, can be comma-separated)

**Returns:** Company ID

---

## Issues & Potential Improvements

### Current Issues
1. **Two separate flows** - Could confuse users
2. **Magic Link localStorage handling** - May not be processed after email confirmation
3. **No post-onboarding guidance** - Users may not know what to do next
4. **No profile completion tracking** - Can't guide users to complete their profile
5. **No industry/target group in simple signup** - Missing important data for matching
6. **Google Sign-In disabled** - In advanced flow
7. **No error recovery UI** - If `localStorage` has pending data, no UI to retry

### Recommended Improvements
1. **Unify the signup flows** - Merge best parts of both (`CompanySignup` and `CompanyOnboarding`)
2. **Enhance onboarding wizard** - Add more steps:
   - Profile completion (company logo, description, etc.)
   - First job posting wizard
   - Team member invitation
   - Token purchase/plan upgrade prompt
3. **Profile completion tracking** - Show progress bar and missing fields
4. **Onboarding restart option** - Allow admins to restart onboarding
5. **Enable Google Sign-In** - For faster onboarding (currently disabled in advanced flow)
6. **Better error handling** - Show user-friendly errors if onboarding steps fail
7. **Onboarding analytics** - Track where users drop off
8. **Skip option** - Allow users to skip onboarding and complete later

---

## Routes Summary

| Route | Component | Status | Notes |
|-------|-----------|--------|-------|
| `/signup/company` | `CompanySignup` | ✅ Active | Primary signup flow |
| `/company-advanced` | `CompanyOnboarding` | ✅ Active | Advanced flow with calculator |
| `/unternehmen/onboarding` | `CompanyOnboarding` | ✅ Active | Same as above |
| `/company/onboarding` | Redirects to `/signup/company` | 🔄 Redirect | Legacy route |
| `/company/dashboard` | `CompanyDashboard` | ✅ Active | Post-signup destination |

---

## Database Schema (Onboarding)

**`companies` table fields used for onboarding:**
- `onboarding_step` (integer) - Current step (0-4)
- `onboarding_completed` (boolean) - Whether onboarding is complete
- `industry` (text) - Selected industry/branches
- `target_groups` (array/text) - Selected target groups
- `selected_plan_id` (text) - Selected plan ID

## Components

**Onboarding Components:**
- `BrancheSelector` - Industry selection
- `TargetGroupSelector` - Target group selection
- `PlanSelector` - Plan selection
- `WelcomePopup` - Final welcome message
- `OnboardingWizard` - Full wizard (may be alternative implementation)
- `OnboardingStep1-5` - Individual step components

**Hooks:**
- `useCompanyOnboarding` - Manages onboarding state and updates

## Next Steps for Improvement

1. **Audit the onboarding flow** - Test all steps work correctly
2. **Unify signup flows** - Merge `CompanySignup` and `CompanyOnboarding` into one flow
3. **Enhance onboarding wizard** - Add profile completion, first job, team invitation steps
4. **Add skip/restart options** - Allow users to skip or restart onboarding
5. **Profile completion tracking** - Show progress for missing company profile fields
6. **Test Magic Link flow end-to-end** - Verify company creation after email confirmation
7. **Add onboarding analytics** - Track completion rates and drop-off points
8. **Improve error handling** - Better user feedback if steps fail

