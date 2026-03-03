# Two-Step Unlock System + Persistent Access + Token Accounting + Kanban Pipeline

## Übersicht

Dieses System implementiert ein **Zwei-Stufen-Freischaltsystem** für Kandidatenprofile mit persistenter Speicherung, Token-Accounting und einer Kanban-Pipeline für das Recruiting.

## Features

### 🔓 Zwei-Stufen-Freischaltung
- **Basic-Level (1 Token)**: Mehr Profildetails, Skills, Ausbildung, Adresse
- **Contact-Level (2 Tokens)**: E-Mail, Telefon, Nachname, CV & Zertifikate als Download
- **Upgrade-Pfad**: Von Basic zu Contact werden nur die zusätzlichen 2 Tokens abgezogen
- **Persistenz**: Freischaltungen bleiben dauerhaft pro (company_id, profile_id, level)

### 💰 Token-Wallet
- **Idempotente Transaktionen** über `idempotency_key`
- **Vollständiges Audit** (`token_transactions`, `data_access_log`)
- **Wallet-Chip** in der Navigation mit Transaktionshistorie

### 📋 Kanban-Pipeline
- **Drag & Drop** zwischen Stages (Neu, Kontaktiert, Interview, Angebot, Abgelehnt)
- **Automatisches Hinzufügen** freigeschalteter Kandidaten zur Pipeline
- **Reihenfolge-Management** innerhalb der Stages

### 🔒 Sicherheit
- **Strikte RLS** (Row Level Security)
- **Masking über Views** - Felder werden je nach Unlock-Level freigegeben
- **Downloads nur bei Contact-Level**

## Architektur

### Database Schema

#### Neue Tabellen
- `job_postings` - Stellenausschreibungen
- `company_token_wallets` - Token-Wallets pro Unternehmen
- `token_transactions` - Transaktionshistorie
- `profile_unlocks` - Freischaltungen (company_id, profile_id, level)
- `data_access_log` - Zugriffsprotokoll
- `company_pipelines` - Pipeline-Konfiguration
- `pipeline_stages` - Stages einer Pipeline
- `pipeline_items` - Kandidaten in der Pipeline

#### Views
- `profiles_masked` - Maskierte Profilansicht basierend auf Unlock-Level

#### RPC Functions
- `rpc_unlock_basic()` - Basic-Level freischalten
- `rpc_unlock_contact()` - Contact-Level freischalten
- `rpc_is_unlocked()` - Unlock-Status prüfen
- `rpc_log_access()` - Zugriff protokollieren
- `ensure_default_pipeline()` - Standard-Pipeline erstellen

### Services

#### WalletService
```typescript
- getWallet(): Promise<Wallet | null>
- ensureWallet(): Promise<Wallet>
- getTransactions(limit?: number): Promise<TokenTransaction[]>
- addTokens(amount: number, reason?: string): Promise<void>
```

#### UnlockService
```typescript
- getUnlockState(profileId: string): Promise<UnlockState>
- unlockBasic(options: UnlockOptions): Promise<UnlockResult>
- unlockContact(options: UnlockOptions): Promise<UnlockResult>
- logProfileView(profileId: string): Promise<void>
- logAttachmentDownload(profileId: string, fileId: string): Promise<void>
- getMaskedProfile(profileId: string): Promise<Profile>
```

#### JobsService
```typescript
- listCompanyJobs(): Promise<JobPosting[]>
- createJob(data: CreateJobData): Promise<JobPosting>
- updateJob(jobId: string, data: Partial<CreateJobData>): Promise<JobPosting>
- deleteJob(jobId: string): Promise<void>
```

#### PipelineService
```typescript
- loadPipeline(): Promise<Pipeline | null>
- createPipelineIfMissing(): Promise<string>
- addToPipeline(options: {profileId: string, jobPostingId?: string}): Promise<void>
- movePipelineItem(data: MoveItemData): Promise<void>
- removeFromPipeline(profileId: string): Promise<void>
```

### UI Components

#### WalletChip
- Zeigt Token-Balance in der Navigation
- Popover mit Transaktionshistorie
- "Tokens kaufen" Button (Implementation pending)

#### UnlockRequestModal
- Tabs für "Job" vs "Allgemeines Interesse"
- Buttons für Basic (1 Token) und Contact (2 Tokens)
- Checkbox für automatisches Hinzufügen zur Pipeline

#### PipelineBoard
- Kanban-Board mit Drag & Drop
- Stages: Neu, Kontaktiert, Interview, Angebot, Abgelehnt
- Statistiken und Übersicht

#### ProfileCard
- Zeigt Profildaten basierend auf Unlock-Level
- "Freischalten" Button für Company-User
- Badges für Unlock-Status
- Download-Buttons für CV/Zertifikate (nur bei Contact)

## Installation & Setup

### 1. Migration ausführen
```sql
-- Migration: supabase/migrations/20250129000000_unlock_pipeline_system.sql
-- Führt alle notwendigen Tabellen, Views, RLS Policies und RPC Functions ein
```

### 2. Services importieren
```typescript
import { WalletService } from '@/services/walletService';
import { UnlockService } from '@/services/unlockService';
import { JobsService } from '@/services/jobsService';
import { PipelineService } from '@/services/pipelineService';
```

### 3. Components verwenden
```typescript
import WalletChip from '@/components/nav/WalletChip';
import UnlockRequestModal from '@/components/unlock/UnlockRequestModal';
import PipelineBoard from '@/components/pipeline/PipelineBoard';
import ProfileCard from '@/components/profile/ProfileCard';
```

## Usage Examples

### Wallet verwenden
```typescript
const walletService = new WalletService();

// Wallet laden
const wallet = await walletService.getWallet();
console.log(`Balance: ${wallet?.balance} Tokens`);

// Tokens hinzufügen (für Tests)
await walletService.addTokens(10, 'manual_adjust');
```

### Profil freischalten
```typescript
const unlockService = new UnlockService();

// Basic-Level freischalten
const result = await unlockService.unlockBasic({
  profileId: 'profile-123',
  jobPostingId: 'job-456',
  generalInterest: false
});

if (result === 'unlocked_basic') {
  console.log('Basic-Level erfolgreich freigeschaltet!');
}
```

### Pipeline verwenden
```typescript
const pipelineService = new PipelineService();

// Pipeline laden
const pipeline = await pipelineService.loadPipeline();

// Kandidat zur Pipeline hinzufügen
await pipelineService.addToPipeline({
  profileId: 'profile-123',
  jobPostingId: 'job-456'
});

// Kandidat zwischen Stages verschieben
await pipelineService.movePipelineItem({
  itemId: 'item-123',
  toStageId: 'stage-interview',
  toIndex: 0
});
```

## Testing

### Unit Tests
```bash
# Tests ausführen
npm test src/tests/unlock.spec.ts
```

### E2E Tests (Planned)
- Company ohne Jobs → Modal zeigt nur "Allgemeines Interesse"
- Basic freischalten → Badge "Basic", Wallet -1, basic_fields sichtbar
- Upgrade Contact → Badge "Kontakt", Wallet -2, Downloads sichtbar
- Pipeline D&D: Karte von "Neu" → "Interview" verschieben

## Wichtige Regeln

### Persistenz
- Freischaltungen liegen in `profile_unlocks` → bleiben für künftige Sessions bestehen
- Sichtbarkeit über `profiles_masked` View → Felder werden je nach Level freigegeben

### Accounting
- Nur `rpc_unlock_basic` (-1) oder `rpc_unlock_contact` (-2) buchen Tokens
- **Einmalig, idempotent** über `idempotency_key`

### Upgrade-Kosten
- `contact` zieht immer 2 Tokens unabhängig davon, ob `basic` existiert
- Insgesamt 3 Tokens, wenn beide separat gekauft werden

### Jobs optional
- Wenn keine `job_postings` existieren → UI zwingt auf "Allgemeines Interesse"

### Pipeline-Eindeutigkeit
- Ein Kandidat **einmal** pro Pipeline (`unique (pipeline_id, profile_id)`)

## Roadmap

### Geplante Features
- [ ] Token-Kauf-Integration (Stripe/PayPal)
- [ ] E-Mail-Benachrichtigungen bei Freischaltungen
- [ ] Bulk-Unlock für mehrere Kandidaten
- [ ] Pipeline-Templates
- [ ] Analytics Dashboard
- [ ] Mobile App Integration

### Performance Optimierungen
- [ ] Caching für Unlock-States
- [ ] Lazy Loading für Pipeline-Items
- [ ] Optimistic Updates für Drag & Drop

## Troubleshooting

### Häufige Probleme

1. **"no_company" Error**
   - User ist nicht als Company-User registriert
   - `company_users` Tabelle prüfen

2. **"insufficient_funds" Error**
   - Wallet hat nicht genügend Tokens
   - `company_token_wallets` Balance prüfen

3. **RLS Policy Violations**
   - User hat keine Berechtigung für Company
   - `company_users` Rolle prüfen

4. **Pipeline nicht sichtbar**
   - `ensure_default_pipeline()` aufrufen
   - `company_pipelines` Tabelle prüfen

### Debug Commands
```sql
-- Wallet Balance prüfen
SELECT * FROM company_token_wallets WHERE company_id = 'your-company-id';

-- Unlock Status prüfen
SELECT * FROM profile_unlocks WHERE company_id = 'your-company-id';

-- Transaktionen anzeigen
SELECT * FROM token_transactions WHERE company_id = 'your-company-id' ORDER BY created_at DESC;
```

## Support

Bei Fragen oder Problemen:
1. Unit Tests prüfen
2. Database Logs analysieren
3. RLS Policies überprüfen
4. Supabase Dashboard nutzen
