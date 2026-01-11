import React, { createContext, useContext, useState, ReactNode, useEffect, useRef } from 'react';
import { syncCVDataToProfile, loadProfileDataToCV } from '@/utils/profileSync';
import { useAuthForCV } from '@/hooks/useAuthForCV';
import { updateReferralWithCV } from '@/hooks/useReferralTracking';

export interface SchulbildungEntry {
  schulform: string;
  abschluss?: string; // Abschluss (z.B. Realschulabschluss, Abitur) – relevant für den letzten/höchsten Eintrag
  name: string;
  ort: string;
  plz?: string;
  zeitraum_von: string;
  zeitraum_bis: string;
  beschreibung?: string;
}

export interface BerufserfahrungEntry {
  titel: string;
  art?: string; // Art der Tätigkeit: Ausbildung, Praktikum, Ferienjob, Aushilfe, Vollzeit, Teilzeit, etc.
  unternehmen: string;
  ort: string;
  plz?: string;
  zeitraum_von: string;
  zeitraum_bis: string;
  beschreibung?: string;
  abschluss?: string; // Abschluss bei Ausbildungen (z.B. Gesellenbrief, Facharbeiterbrief)
}

export interface SprachEntry {
  sprache: string;
  niveau: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' | 'Muttersprache';
}

export interface QualifikationEntry {
  name: string;
  beschreibung?: string;
}

export interface ZertifikatEntry {
  name: string;
  anbieter?: string;
  datum?: string;
}

export interface WeiterbildungEntry {
  titel: string;
  anbieter: string;
  ort?: string;
  zeitraum_von?: string;
  zeitraum_bis?: string;
  beschreibung?: string;
}

export interface CVFormData {
  // Step 1: Branch & Status
  branche?: 'handwerk' | 'it' | 'gesundheit' | 'buero' | 'verkauf' | 'gastronomie' | 'bau';
  status?: 'schueler' | 'azubi' | 'fachkraft';
  
  // Step 2: Enhanced Personal Data
  vorname?: string;
  nachname?: string;
  geburtsdatum?: Date | string;
  strasse?: string;
  hausnummer?: string;
  plz?: string;
  ort?: string;
  telefon?: string;
  email?: string;
  profilbild?: File | string;
  avatar_url?: string;
  
  // Extended fields for enhanced profile
  has_drivers_license?: boolean;
  driver_license_class?: string;
  has_own_vehicle?: boolean;
  target_year?: string;
  visibility_industry?: string[];
  visibility_region?: string[];
  cover_image?: File | string;
  headline?: string;
  bio?: string;
  
  // Schüler specific
  schule?: string;
  geplanter_abschluss?: string;
  abschlussjahr?: string;
  
  // Azubi specific
  ausbildungsberuf?: string;
  ausbildungsbetrieb?: string;
  startjahr?: string;
  voraussichtliches_ende?: string;
  
  // Fachkraft specific
  abschlussjahr_fachkraft?: string;
  aktueller_beruf?: string;
  
  // Step 3: Skills & Motivation (internal use for AI generation)
  kenntnisse?: string;
  motivation?: string;
  praktische_erfahrung?: string;
  
  // Step 3: Languages & Skills for CV
  sprachen?: SprachEntry[];
  faehigkeiten?: string[];
  
  // Step 4: School & Work Experience
  schulbildung?: SchulbildungEntry[];
  berufserfahrung?: BerufserfahrungEntry[];
  
  // New optional fields (simplified to strings)
  qualifikationen?: string[];
  zertifikate?: string[];
  weiterbildung?: WeiterbildungEntry[];
  interessen?: string[];
  
  // Step 5: Layout
  layout?: number;
  
  // AI-generated About Me
  ueberMich?: string;
  
  // Step 7: Consent
  einwilligung?: boolean;
  datenschutz_akzeptiert?: boolean;
  agb_akzeptiert?: boolean;
}

interface CVFormContextType {
  formData: CVFormData;
  updateFormData: (data: Partial<CVFormData>) => void;
  currentStep: number;
  setCurrentStep: (step: number) => void;
  resetForm: () => void;
  isLayoutEditMode: boolean;
  setLayoutEditMode: (mode: boolean) => void;
  syncWithProfile: () => void;
  syncToProfile: () => Promise<void>;
  setAutoSyncEnabled: (enabled: boolean) => void;
  validationErrors: Record<string, string>;
  getStepErrors: (step: number) => Record<string, string>;
  validateStep: (step: number) => boolean;
  clearValidationErrors: () => void;
}

const CVFormContext = createContext<CVFormContextType | undefined>(undefined);

// Helper function to find the first incomplete step
const findFirstIncompleteStep = (data: CVFormData): number => {
  // Step 1: Branch & Status
  if (!data.branche || !data.status) return 1;
  
  // Step 2: Personal Data (vorname, nachname, plz, ort, email, telefon are required)
  // Skip step 2 check for profilbild and has_drivers_license as they might not be set yet from QuickSignup
  if (!data.vorname || !data.nachname || !data.plz || !data.ort || !data.email || !data.telefon) return 2;
  
  // Step 3: Beruflicher Werdegang (Step 3 in render, but case 3 in validation)
  // This step requires status-specific fields
  // We'll let the user go to step 3 even if not all fields are filled
  
  // Default to step 3 if steps 1 and 2 are complete
  return 3;
};

export const CVFormProvider = ({ children }: { children: ReactNode }) => {
  const { user, profile } = useAuthForCV();
  
  const [formData, setFormData] = useState<CVFormData>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);
  const autoSyncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const [currentStep, setCurrentStep] = useState(() => {
    // Check if we're in layout edit mode
    const isLayoutEdit = localStorage.getItem('cvLayoutEditMode') === 'true';
    if (isLayoutEdit) return 5;
    
    // Check for initial data to determine starting step
    const savedData = localStorage.getItem('cvFormData');
    const quickSignupData = localStorage.getItem('quick_signup_data');
    
    let initialData: any = {};
    if (savedData) {
      try {
        initialData = JSON.parse(savedData);
      } catch (e) {
        // ignore
      }
    }
    
    if (quickSignupData) {
      try {
        const parsedQuickSignup = JSON.parse(quickSignupData);
        initialData = {
          ...initialData,
          vorname: parsedQuickSignup.vorname || initialData.vorname,
          nachname: parsedQuickSignup.nachname || initialData.nachname,
          plz: parsedQuickSignup.plz || initialData.plz,
          ort: parsedQuickSignup.ort || initialData.ort,
          email: parsedQuickSignup.email || initialData.email,
          branche: parsedQuickSignup.branche || initialData.branche,
          status: parsedQuickSignup.status || initialData.status,
        };
      } catch (e) {
        // ignore
      }
    }
    
    // Find first incomplete step
    return findFirstIncompleteStep(initialData);
  });
  
  const [isLayoutEditMode, setLayoutEditMode] = useState(() => {
    return localStorage.getItem('cvLayoutEditMode') === 'true';
  });

  // Load form data from localStorage on initial load
  useEffect(() => {
    const savedData = localStorage.getItem('cvFormData');
    let initialData: any = {};
    
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        // Sanitize non-serializable fields (Files become `{}` in JSON, which must NOT be treated as valid)
        const sanitized: any = { ...parsedData };
        if (sanitized.profilbild && typeof sanitized.profilbild !== 'string') {
          delete sanitized.profilbild;
        }
        if (sanitized.cover_image && typeof sanitized.cover_image !== 'string') {
          delete sanitized.cover_image;
        }
        initialData = sanitized;
        console.log('Lebenslauf Generator: Loading saved CV data from localStorage:', parsedData);
      } catch (error) {
        console.error('Lebenslauf Generator: Error parsing saved CV data:', error);
        localStorage.removeItem('cvFormData');
      }
    }

    // Load quick signup data if available and merge with existing data
    const quickSignupData = localStorage.getItem('quick_signup_data');
    if (quickSignupData) {
      try {
        const parsedQuickSignup = JSON.parse(quickSignupData);
        console.log('Lebenslauf Generator: Loading quick signup data:', parsedQuickSignup);
        
        // Merge quick signup data with existing data (quick signup takes precedence for these fields)
        initialData = {
          ...initialData,
          vorname: parsedQuickSignup.vorname || initialData.vorname,
          nachname: parsedQuickSignup.nachname || initialData.nachname,
          plz: parsedQuickSignup.plz || initialData.plz,
          ort: parsedQuickSignup.ort || initialData.ort,
          email: parsedQuickSignup.email || initialData.email,
          branche: parsedQuickSignup.branche || initialData.branche,
          status: parsedQuickSignup.status || initialData.status,
        };
        
        // Save merged data back to localStorage
        localStorage.setItem('cvFormData', JSON.stringify(initialData));
        
        // Clear quick signup data after loading (so it doesn't interfere with future sessions)
        localStorage.removeItem('quick_signup_data');
      } catch (error) {
        console.error('Lebenslauf Generator: Error parsing quick signup data:', error);
        localStorage.removeItem('quick_signup_data');
      }
    }

    if (Object.keys(initialData).length > 0) {
      setFormData(initialData);
      // Update current step based on loaded data
      const firstIncompleteStep = findFirstIncompleteStep(initialData);
      if (firstIncompleteStep !== currentStep) {
        const isLayoutEdit = localStorage.getItem('cvLayoutEditMode') === 'true';
        if (!isLayoutEdit) {
          setCurrentStep(firstIncompleteStep);
        }
      }
    }
  }, []);

  // Ensure a default layout is always selected (so Step 5 is never "empty")
  useEffect(() => {
    if (formData.layout) return;
    setFormData((prev) => {
      // Avoid unnecessary state updates
      if (prev.layout) return prev;
      const next = { ...prev, layout: 1 };
      localStorage.setItem('cvFormData', JSON.stringify(next));
      return next;
    });
  }, [formData.layout]);

  // Save layout edit mode to localStorage
  useEffect(() => {
    localStorage.setItem('cvLayoutEditMode', isLayoutEditMode.toString());
  }, [isLayoutEditMode]);


  // Load profile data into form ONLY if user has complete profile and specifically requests it
  const syncWithProfile = () => {
    if (profile && user && profile.profile_complete) {
      console.log('Loading complete profile data to CV form:', profile);
      const profileData = loadProfileDataToCV(profile);
      setFormData(profileData);
      // Update step to skip already completed steps (Step 1 and 2 are already done)
      const firstIncompleteStep = findFirstIncompleteStep(profileData);
      // Skip Step 0 (Welcome) and Step 1 (Branch & Status) and Step 2 (Personal Data) if already filled
      // Start at Step 3 (Beruflicher Werdegang) or later
      if (firstIncompleteStep <= 2) {
        setCurrentStep(3); // Start at Beruflicher Werdegang
      } else {
        setCurrentStep(firstIncompleteStep);
      }
    }
  };

  // Auto-load profile data when profile is complete and form is empty
  useEffect(() => {
    if (profile && user && profile.profile_complete && Object.keys(formData).length === 0) {
      console.log('Auto-loading profile data to CV form (profile is complete, form is empty)');
      const profileData = loadProfileDataToCV(profile);
      setFormData(profileData);
      // Update step to skip already completed steps (Step 0, 1, 2 are already done)
      const firstIncompleteStep = findFirstIncompleteStep(profileData);
      // Skip Step 0 (Welcome), Step 1 (Branch & Status), and Step 2 (Personal Data) if already filled
      if (firstIncompleteStep <= 2) {
        setCurrentStep(3); // Start at Beruflicher Werdegang (Step 3)
      } else {
        setCurrentStep(firstIncompleteStep);
      }
    }
  }, [profile?.profile_complete, profile?.id, user?.id, formData]);

  // Sync form data to profile (only when user is logged in)
  const syncToProfile = async () => {
    if (!user?.id || !formData || Object.keys(formData).length === 0) {
      console.log(`[${new Date().toISOString()}] CVFormContext: Skipping sync - no user or empty formData`);
      return;
    }
    
    console.log(`[${new Date().toISOString()}] CVFormContext: Syncing CV data to profile...`, formData);
    
    try {
      await syncCVDataToProfile(user.id, formData);
      
      // Track CV creation in referral analytics
      await updateReferralWithCV();
      
      console.log(`[${new Date().toISOString()}] CVFormContext: Successfully synced CV data to profile`);
    } catch (error) {
      console.error(`[${new Date().toISOString()}] CVFormContext: Error syncing CV data to profile:`, error);
      throw error; // Re-throw for caller to handle
    }
  };

  const updateFormData = (data: Partial<CVFormData>) => {
    const newFormData = { ...formData, ...data };
    setFormData(newFormData);
    
    // Save to localStorage immediately
    localStorage.setItem('cvFormData', JSON.stringify(newFormData));
    
    // Auto-sync to profile when user is logged in and auto-sync is enabled
    if (user?.id && autoSyncEnabled && Object.keys(newFormData).length > 1) {
      console.log(`[${new Date().toISOString()}] CVFormContext: Auto-sync enabled, scheduling sync...`);
      
      // Clear previous timeout
      if (autoSyncTimeoutRef.current) {
        clearTimeout(autoSyncTimeoutRef.current);
      }
      
      // Schedule new sync
      autoSyncTimeoutRef.current = setTimeout(async () => {
        try {
          await syncToProfile();
        } catch (error) {
          console.error(`[${new Date().toISOString()}] CVFormContext: Auto-sync failed:`, error);
        }
      }, 2000); // 2 seconds debounce
    }
  };

  const resetForm = () => {
    setFormData({});
    setCurrentStep(1);
    setLayoutEditMode(false);
    localStorage.removeItem('cvFormData');
    localStorage.removeItem('cvLayoutEditMode');
  };

  const computeStepErrors = (step: number, data: CVFormData): Record<string, string> => {
    const errors: Record<string, string> = {};
    
    switch (step) {
      case 1:
        // Step 1: Nur Branche und Status sind erforderlich
        // Status-spezifische Felder werden in späteren Steps abgefragt und validiert
        if (!data.branche) errors.branche = 'Branche ist erforderlich';
        if (!data.status) errors.status = 'Status ist erforderlich';
        break;
      case 2:
        if (!data.vorname) errors.vorname = 'Vorname ist erforderlich';
        if (!data.nachname) errors.nachname = 'Nachname ist erforderlich';
        
        // Geburtsdatum validation - mindestens 16 Jahre alt
        if (!data.geburtsdatum) {
          errors.geburtsdatum = 'Geburtsdatum ist erforderlich';
        } else {
          const birthDate = new Date(data.geburtsdatum);
          const today = new Date();
          const age = today.getFullYear() - birthDate.getFullYear();
          const monthDiff = today.getMonth() - birthDate.getMonth();
          const dayDiff = today.getDate() - birthDate.getDate();
          
          const actualAge = monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;
          
          if (actualAge < 16) {
            errors.geburtsdatum = 'Du musst mindestens 16 Jahre alt sein';
          }
        }
        
        if (!data.strasse) errors.strasse = 'Straße ist erforderlich';
        
        // Hausnummer validation - mindestens 1 Zahl
        if (!data.hausnummer) {
          errors.hausnummer = 'Hausnummer ist erforderlich';
        } else if (!/\d/.test(data.hausnummer)) {
          errors.hausnummer = 'Hausnummer muss mindestens eine Zahl enthalten';
        }
        
        // PLZ validation - nur Zahlen
        if (!data.plz) {
          errors.plz = 'PLZ ist erforderlich';
        } else if (!/^\d+$/.test(data.plz)) {
          errors.plz = 'PLZ darf nur aus Zahlen bestehen';
        }
        
        if (!data.ort) errors.ort = 'Ort ist erforderlich';
        
        // Telefonnummer validation - DACH Format
        // Verbessert: Sofortige Validierung beim Weiterklicken
        if (!data.telefon || !data.telefon.trim()) {
          errors.telefon = 'Telefonnummer ist erforderlich';
        } else {
          const cleanedPhone = data.telefon.replace(/\s/g, '').trim();
          // Prüfe verschiedene Formate: +49..., 0049..., 0...
          const phoneRegex = /^(\+?(49|41|43)[- ]?\d{1,4}[- ]?\d{3,}[- ]?\d{4,}|0\d{2,5}[- ]?\d{3,}[- ]?\d{4,}|0049\d{8,}|0041\d{8,}|0043\d{8,})$/;
          if (!phoneRegex.test(cleanedPhone)) {
            errors.telefon = 'Bitte gib eine gültige Telefonnummer ein (z.B. +49 123 456789 oder 030 12345678)';
          }
        }
        
        // E-Mail validation - muss @ und . enthalten
        if (!data.email) {
          errors.email = 'E-Mail ist erforderlich';
        } else if (!data.email.includes('@') || !data.email.includes('.')) {
          errors.email = 'Bitte gib eine gültige E-Mail-Adresse ein';
        }
        
        const hasValidProfilbild =
          data.profilbild instanceof File ||
          (typeof data.profilbild === 'string' && data.profilbild.trim().length > 0);
        const hasValidAvatarUrl = typeof data.avatar_url === 'string' && data.avatar_url.trim().length > 0;
        if (!hasValidProfilbild && !hasValidAvatarUrl) errors.profilbild = 'Profilbild ist erforderlich';
        if (data.has_drivers_license === undefined || data.has_drivers_license === null) {
          errors.has_drivers_license = 'Führerschein-Angabe ist erforderlich';
        }
        if (data.has_drivers_license && !data.driver_license_class) {
          errors.driver_license_class = 'Führerscheinklasse ist erforderlich';
        }
        
        // Status-specific fields are handled later in the Werdegang step (Step 3).
        break;
      case 3:
        // Step 3: Beruflicher Werdegang & Ausbildung
        
        // Status-spezifische Pflichtfelder (werden in Step 3 abgefragt)
        // HINWEIS: aktueller_beruf wird nicht mehr direkt abgefragt, sondern über Berufserfahrung
        if (data.status === 'schueler') {
          if (!data.schule?.trim()) errors.schule = 'Schule ist erforderlich';
          if (!data.geplanter_abschluss?.trim()) errors.geplanter_abschluss = 'Geplanter Abschluss ist erforderlich';
          if (!data.abschlussjahr?.trim()) errors.abschlussjahr = 'Abschlussjahr ist erforderlich';
        }
        // Azubi: Ausbildungsfelder (ausbildungsberuf, ausbildungsbetrieb, startjahr, voraussichtliches_ende) 
        // werden nicht mehr direkt abgefragt. Die Ausbildung wird durch Berufserfahrung (praktische Erfahrung) 
        // und Schulbildung abgedeckt. Keine Validierung für diese Felder mehr erforderlich.
        // Fachkraft/Ausgelernt: aktueller_beruf wird nicht mehr als Pflichtfeld validiert,
        // da es über Berufserfahrung (berufserfahrung) erfasst wird
        
        // Schulbildung ist nur für Schüler und Azubis erforderlich
        if ((data.status === 'schueler' || data.status === 'azubi') && (!data.schulbildung || data.schulbildung.length === 0)) {
          errors.schulbildung = 'Mindestens ein Schulbildungs-Eintrag ist erforderlich';
        }

        // Require "Abschluss" for the latest/most recent school entry (highest/last)
        const schools = data.schulbildung || [];
        let requiredAbschlussIndex = -1;
        let bestYear = Number.NEGATIVE_INFINITY;
        for (let i = 0; i < schools.length; i++) {
          const s = schools[i];
          const bis = parseInt((s.zeitraum_bis || '').toString(), 10);
          const von = parseInt((s.zeitraum_von || '').toString(), 10);
          const candidate = Number.isFinite(bis) ? bis : (Number.isFinite(von) ? von : Number.NEGATIVE_INFINITY);
          if (candidate > bestYear) {
            bestYear = candidate;
            requiredAbschlussIndex = i;
          }
        }

        // For Azubi/Fachkraft at least one work/practical experience is required
        if ((data.status === 'azubi' || data.status === 'fachkraft') && (!data.berufserfahrung || data.berufserfahrung.length === 0)) {
          errors.berufserfahrung = 'Mindestens eine Berufserfahrung ist erforderlich';
        }

        // Validate each schulbildung entry
        data.schulbildung?.forEach((schule, index) => {
          if (!schule.schulform) errors[`schulbildung_${index}_schulform`] = 'Schulform ist erforderlich';
          if (index === requiredAbschlussIndex && !schule.abschluss) {
            errors[`schulbildung_${index}_abschluss`] = 'Abschluss ist erforderlich';
          }
          if (!schule.name) errors[`schulbildung_${index}_name`] = 'Name der Institution ist erforderlich';
          if (!schule.ort) errors[`schulbildung_${index}_ort`] = 'Ort ist erforderlich';
          if (!schule.zeitraum_von) errors[`schulbildung_${index}_zeitraum_von`] = 'Start-Jahr ist erforderlich';
          if (!schule.zeitraum_bis) errors[`schulbildung_${index}_zeitraum_bis`] = 'End-Jahr ist erforderlich';
        });
        // Validate each berufserfahrung entry
        data.berufserfahrung?.forEach((arbeit, index) => {
          if (!arbeit.titel) errors[`berufserfahrung_${index}_titel`] = 'Position ist erforderlich';
          if (!arbeit.art) errors[`berufserfahrung_${index}_art`] = 'Art ist erforderlich';
          if (!arbeit.unternehmen) errors[`berufserfahrung_${index}_unternehmen`] = 'Unternehmen ist erforderlich';
          if (!arbeit.ort) errors[`berufserfahrung_${index}_ort`] = 'Ort ist erforderlich';
          if (!arbeit.zeitraum_von) errors[`berufserfahrung_${index}_zeitraum_von`] = 'Start-Datum ist erforderlich';
        });
        break;
      case 4:
        // Step 4: Kenntnisse, Skills & Motivation
        // Sprachen: Mindestens 1 Sprache, davon mindestens 1 Muttersprache
        let sprachen = data.sprachen || [];
        // Parse JSONB if it's a string
        if (typeof sprachen === 'string') {
          try {
            sprachen = JSON.parse(sprachen);
          } catch (e) {
            sprachen = [];
          }
        }
        if (!Array.isArray(sprachen) || sprachen.length === 0) {
          errors.sprachen = 'Mindestens eine Sprache ist erforderlich';
        } else {
          const hasMuttersprache = sprachen.some((s: any) => 
            s?.niveau && s.niveau.toString().toLowerCase() === 'muttersprache'
          );
          if (!hasMuttersprache) {
            errors.sprachen = 'Mindestens eine Muttersprache ist erforderlich';
          }
        }
        
        // Skills are required for everyone (min 3)
        let faehigkeiten = data.faehigkeiten || [];
        // Parse JSONB if it's a string
        if (typeof faehigkeiten === 'string') {
          try {
            faehigkeiten = JSON.parse(faehigkeiten);
          } catch (e) {
            faehigkeiten = [];
          }
        }
        if (!Array.isArray(faehigkeiten) || faehigkeiten.length < 3) {
          errors.faehigkeiten = `Bitte wähle mindestens 3 Fähigkeiten aus (aktuell: ${Array.isArray(faehigkeiten) ? faehigkeiten.length : 0})`;
        }
        
              // About-me text is required (AI or manual)
              const about = (data.ueberMich || '').trim();
        if (about.length === 0) {
          errors.ueberMich = 'Text "Über mich" ist erforderlich';
        } else if (about.length < 20) {
          errors.ueberMich = 'Text "Über mich" muss mindestens 20 Zeichen lang sein';
        }
        break;
      case 5:
        if (!data.layout) errors.layout = 'Layout-Auswahl ist erforderlich';
        break;
      case 7:
        if (!data.datenschutz_akzeptiert) errors.datenschutz_akzeptiert = 'Datenschutzerklärung muss akzeptiert werden';
        if (!data.agb_akzeptiert) errors.agb_akzeptiert = 'AGBs müssen akzeptiert werden';
        break;
    }
    
    return errors;
  };

  const getStepErrors = (step: number) => computeStepErrors(step, formData);

  const validateStep = (step: number): boolean => {
    const errors = computeStepErrors(step, formData);
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const clearValidationErrors = () => {
    setValidationErrors({});
  };

  // Cleanup effect
  useEffect(() => {
    return () => {
      // Clear timeout on unmount
      if (autoSyncTimeoutRef.current) {
        clearTimeout(autoSyncTimeoutRef.current);
      }
    };
  }, []);

  return (
    <CVFormContext.Provider value={{
      formData,
      updateFormData,
      currentStep,
      setCurrentStep,
      resetForm,
      isLayoutEditMode,
      setLayoutEditMode,
      syncWithProfile,
      syncToProfile,
      setAutoSyncEnabled,
      validationErrors,
      getStepErrors,
      validateStep,
      clearValidationErrors
    }}>
      {children}
    </CVFormContext.Provider>
  );
};

export const useCVForm = () => {
  const context = useContext(CVFormContext);
  if (!context) {
    throw new Error('useCVForm must be used within CVFormProvider');
  }
  return context;
};