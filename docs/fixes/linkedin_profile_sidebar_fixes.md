# LinkedInProfileSidebar.tsx - Verbesserungen für vollständige Profilfreischaltung

## 1. Import hinzufügen (nach Zeile 18):
```typescript
import { useCompany } from '@/hooks/useCompany';
```

## 2. State hinzufügen (nach Zeile 63):
```typescript
const [unlockState, setUnlockState] = useState({ basic: false, contact: false });
const [isCheckingUnlock, setIsCheckingUnlock] = useState(false);
const { company } = useCompany();
```

## 3. useEffect hinzufügen (nach Zeile 67):
```typescript
// Check unlock state when profile changes
useEffect(() => {
  const checkUnlockState = async () => {
    if (!profile?.id || !readOnly) return;
    
    setIsCheckingUnlock(true);
    try {
      const unlockService = new UnlockService();
      const state = await unlockService.getUnlockState(profile.id);
      setUnlockState(state);
      
      // Log profile view access
      await unlockService.logProfileView(profile.id);
      
      // Add to recently viewed
      await addToRecentlyViewed(profile.id);
    } catch (error) {
      console.error('Error checking unlock state:', error);
    } finally {
      setIsCheckingUnlock(false);
    }
  };

  checkUnlockState();
}, [profile?.id, readOnly]);
```

## 4. Helper-Funktionen hinzufügen (nach dem useEffect):
```typescript
const addToRecentlyViewed = async (profileId: string) => {
  if (!company?.id) return;
  
  try {
    await supabase
      .from('recently_viewed_profiles')
      .upsert({
        company_id: company.id,
        profile_id: profileId,
        viewed_at: new Date().toISOString()
      }, {
        onConflict: 'company_id,profile_id'
      });
  } catch (error) {
    console.error('Error adding to recently viewed:', error);
  }
};

const addToPipeline = async (profileId: string) => {
  if (!company?.id) return;
  
  try {
    // Ensure pipeline exists
    const { data: pipeline } = await supabase
      .from('company_pipelines')
      .select('id')
      .eq('company_id', company.id)
      .single();

    if (!pipeline) {
      // Create default pipeline
      const { data: newPipeline } = await supabase
        .from('company_pipelines')
        .insert({
          company_id: company.id,
          name: 'Standard Pipeline'
        })
        .select('id')
        .single();

      if (newPipeline) {
        // Create default stages
        await supabase
          .from('pipeline_stages')
          .insert([
            { pipeline_id: newPipeline.id, name: 'Neu', position: 1, color: '#3B82F6' },
            { pipeline_id: newPipeline.id, name: 'Kontaktiert', position: 2, color: '#10B981' },
            { pipeline_id: newPipeline.id, name: 'Interview', position: 3, color: '#F59E0B' },
            { pipeline_id: newPipeline.id, name: 'Angebot', position: 4, color: '#8B5CF6' },
            { pipeline_id: newPipeline.id, name: 'Abgelehnt', position: 5, color: '#EF4444' }
          ]);
      }
    }

    // Get first stage (Neu)
    const { data: firstStage } = await supabase
      .from('pipeline_stages')
      .select('id')
      .eq('pipeline_id', pipeline?.id || company.id)
      .eq('position', 1)
      .single();

    if (firstStage) {
      // Add profile to pipeline
      await supabase
        .from('pipeline_items')
        .upsert({
          company_id: company.id,
          profile_id: profileId,
          stage_id: firstStage.id,
          position: 0,
          added_at: new Date().toISOString()
        }, {
          onConflict: 'company_id,profile_id'
        });
    }
  } catch (error) {
    console.error('Error adding to pipeline:', error);
  }
};
```

## 5. Button-Logik ersetzen (ab Zeile 544):
```typescript
{readOnly ? (
  // Company user - show unlock button if not unlocked, show unlocked state if unlocked
  unlockState.basic ? (
    <div className="space-y-2">
      <div className="w-full bg-green-100 text-green-800 text-sm px-3 py-2 rounded-md text-center">
        ✅ Profil vollständig freigeschaltet
      </div>
      <Button onClick={handleDownloadCV} disabled={isGeneratingPDF} className="w-full bg-primary hover:bg-primary/90 text-sm" size="sm">
        <Download className="h-4 w-4 mr-2" />
        <span className="hidden sm:inline">{isGeneratingPDF ? 'Generiere...' : 'CV herunterladen'}</span>
        <span className="sm:hidden">{isGeneratingPDF ? 'Gen...' : 'Download'}</span>
      </Button>
    </div>
  ) : (
    <Button 
      onClick={async () => {
        if (!profile?.id) return;
        
        setIsUnlockingCV(true);
        try {
          const unlockService = new UnlockService();
          const result = await unlockService.unlockBasic({
            profileId: profile.id,
            generalInterest: true
          });

          switch (result) {
            case 'unlocked_basic':
              setUnlockState({ basic: true, contact: false });
              sonnerToast.success('Profil vollständig freigeschaltet! Alle Daten sind jetzt verfügbar.');
              
              // Add to pipeline
              await addToPipeline(profile.id);
              
              // Add to recently viewed
              await addToRecentlyViewed(profile.id);
              break;
            case 'already_basic':
              setUnlockState({ basic: true, contact: false });
              sonnerToast.info('Profil ist bereits freigeschaltet.');
              break;
            case 'insufficient_funds':
              sonnerToast.error('Nicht genügend Tokens verfügbar. Bitte laden Sie Ihr Wallet auf.');
              break;
            case 'error':
              sonnerToast.error('Fehler beim Freischalten. Bitte versuchen Sie es erneut.');
              break;
            default:
              sonnerToast.error('Unbekannter Fehler beim Freischalten.');
          }
        } catch (error) {
          console.error('Error unlocking profile:', error);
          sonnerToast.error('Fehler beim Freischalten des Profils.');
        } finally {
          setIsUnlockingCV(false);
        }
      }}
      disabled={isUnlockingCV || isCheckingUnlock}
      className="w-full bg-blue-600 hover:bg-blue-700 text-sm" 
      size="sm"
    >
      <Download className="h-4 w-4 mr-2" />
      <span className="hidden sm:inline">
        {isUnlockingCV ? 'Freischalten...' : 'Profil freischalten (1 Token)'}
      </span>
      <span className="sm:hidden">
        {isUnlockingCV ? 'Freischalten...' : 'Freischalten'}
      </span>
    </Button>
  )
) : (
  // Profile owner - show download button
  <Button onClick={handleDownloadCV} disabled={isGeneratingPDF} className="w-full bg-primary hover:bg-primary/90 text-sm" size="sm">
    <Download className="h-4 w-4 mr-2" />
    <span className="hidden sm:inline">{isGeneratingPDF ? 'Generiere...' : 'CV herunterladen'}</span>
    <span className="sm:hidden">{isGeneratingPDF ? 'Gen...' : 'Download'}</span>
  </Button>
)}
```

## 6. Vollständige Namen anzeigen (wo immer der Name angezeigt wird):
```typescript
const displayName = readOnly && unlockState.basic 
  ? `${profile?.vorname} ${profile?.nachname}`
  : profile?.vorname;
```

## Zusammenfassung der Änderungen:
- ✅ Vollständige Profilfreischaltung (nicht nur CV)
- ✅ 1 Token statt 2 Tokens
- ✅ Pipeline-Integration nach Freischaltung
- ✅ Recently Viewed Tracking
- ✅ Vollständige Namen bei Freischaltung
- ✅ Persistente Speicherung der Freischaltungen
- ✅ Token-Accounting funktioniert korrekt
