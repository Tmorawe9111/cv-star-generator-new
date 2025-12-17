import React, { createContext, useContext, useState, ReactNode, useEffect, useRef } from 'react';
import { syncCVDataToProfile, loadProfileDataToCV } from '@/utils/profileSync';
import { useAuthForCV } from '@/hooks/useAuthForCV';

export interface SchulbildungEntry {
  schulform: string;
  name: string;
  ort: string;
  plz?: string;
  zeitraum_von: string;
  zeitraum_bis: string;
  beschreibung?: string;
}

export interface BerufserfahrungEntry {
  titel: string;
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
  validateStep: (step: number) => boolean;
  clearValidationErrors: () => void;
}

const CVFormContext = createContext<CVFormContextType | undefined>(undefined);

export const CVFormProvider = ({ children }: { children: ReactNode }) => {
  const { user, profile } = useAuthForCV();
  
  const [formData, setFormData] = useState<CVFormData>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);
  const autoSyncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const [currentStep, setCurrentStep] = useState(() => {
    // Check if we're in layout edit mode
    const isLayoutEdit = localStorage.getItem('cvLayoutEditMode') === 'true';
    return isLayoutEdit ? 5 : 1;
  });
  
  const [isLayoutEditMode, setLayoutEditMode] = useState(() => {
    return localStorage.getItem('cvLayoutEditMode') === 'true';
  });

  // Load form data from localStorage on initial load
  useEffect(() => {
    const savedData = localStorage.getItem('cvFormData');
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        console.log('Lebenslauf Generator: Loading saved CV data from localStorage:', parsedData);
        setFormData(parsedData);
      } catch (error) {
        console.error('Lebenslauf Generator: Error parsing saved CV data:', error);
        localStorage.removeItem('cvFormData');
      }
    }
  }, []);

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
    }
  };

  // Sync form data to profile (only when user is logged in)
  const syncToProfile = async () => {
    if (!user?.id || !formData || Object.keys(formData).length === 0) {
      console.log(`[${new Date().toISOString()}] CVFormContext: Skipping sync - no user or empty formData`);
      return;
    }
    
    console.log(`[${new Date().toISOString()}] CVFormContext: Syncing CV data to profile...`, formData);
    
    try {
      await syncCVDataToProfile(user.id, formData);
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

  const validateStep = (step: number): boolean => {
    const errors: Record<string, string> = {};
    
    switch (step) {
      case 1:
        if (!formData.branche) errors.branche = 'Branche ist erforderlich';
        if (!formData.status) errors.status = 'Status ist erforderlich';
        break;
      case 2:
        if (!formData.vorname) errors.vorname = 'Vorname ist erforderlich';
        if (!formData.nachname) errors.nachname = 'Nachname ist erforderlich';
        
        // Geburtsdatum validation - mindestens 16 Jahre alt
        if (!formData.geburtsdatum) {
          errors.geburtsdatum = 'Geburtsdatum ist erforderlich';
        } else {
          const birthDate = new Date(formData.geburtsdatum);
          const today = new Date();
          const age = today.getFullYear() - birthDate.getFullYear();
          const monthDiff = today.getMonth() - birthDate.getMonth();
          const dayDiff = today.getDate() - birthDate.getDate();
          
          const actualAge = monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;
          
          if (actualAge < 16) {
            errors.geburtsdatum = 'Du musst mindestens 16 Jahre alt sein';
          }
        }
        
        if (!formData.strasse) errors.strasse = 'Straße ist erforderlich';
        
        // Hausnummer validation - mindestens 1 Zahl
        if (!formData.hausnummer) {
          errors.hausnummer = 'Hausnummer ist erforderlich';
        } else if (!/\d/.test(formData.hausnummer)) {
          errors.hausnummer = 'Hausnummer muss mindestens eine Zahl enthalten';
        }
        
        // PLZ validation - nur Zahlen
        if (!formData.plz) {
          errors.plz = 'PLZ ist erforderlich';
        } else if (!/^\d+$/.test(formData.plz)) {
          errors.plz = 'PLZ darf nur aus Zahlen bestehen';
        }
        
        if (!formData.ort) errors.ort = 'Ort ist erforderlich';
        
        // Telefonnummer validation - DACH Format
        if (!formData.telefon) {
          errors.telefon = 'Telefonnummer ist erforderlich';
        } else {
          const phoneRegex = /^(\+?(49|41|43)[- ]?\d{1,4}[- ]?\d{3,}[- ]?\d{4,}|0\d{2,5}[- ]?\d{3,}[- ]?\d{4,})$/;
          if (!phoneRegex.test(formData.telefon.replace(/\s/g, ''))) {
            errors.telefon = 'Bitte gib eine gültige Telefonnummer ein (z.B. +49 123 456789)';
          }
        }
        
        // E-Mail validation - muss @ und . enthalten
        if (!formData.email) {
          errors.email = 'E-Mail ist erforderlich';
        } else if (!formData.email.includes('@') || !formData.email.includes('.')) {
          errors.email = 'Bitte gib eine gültige E-Mail-Adresse ein';
        }
        
        if (!formData.profilbild && !formData.avatar_url) errors.profilbild = 'Profilbild ist erforderlich';
        if (formData.has_drivers_license === undefined || formData.has_drivers_license === null) {
          errors.has_drivers_license = 'Führerschein-Angabe ist erforderlich';
        }
        if (formData.has_drivers_license && !formData.driver_license_class) {
          errors.driver_license_class = 'Führerscheinklasse ist erforderlich';
        }
        
        // Status-specific fields are handled later in the Werdegang step (Step 3).
        break;
      case 3:
        // Step 3: Beruflicher Werdegang & Ausbildung
        if (formData.status === 'schueler') {
          const currentYear = new Date().getFullYear();
          if (!formData.schule) errors.schule = 'Schule ist erforderlich';
          if (!formData.geplanter_abschluss) errors.geplanter_abschluss = 'Geplanter Abschluss ist erforderlich';

          if (!formData.abschlussjahr) {
            errors.abschlussjahr = 'Abschlussjahr ist erforderlich';
          } else {
            const year = parseInt(formData.abschlussjahr);
            if (Number.isNaN(year) || year < currentYear - 1 || year > currentYear + 5) {
              errors.abschlussjahr = 'Abschlussjahr muss zwischen diesem Jahr -1 und +5 Jahren liegen';
            }
          }
        }

        if (!formData.schulbildung || formData.schulbildung.length === 0) {
          errors.schulbildung = 'Mindestens ein Schulbildungs-Eintrag ist erforderlich';
        }
        // Validate each schulbildung entry
        formData.schulbildung?.forEach((schule, index) => {
          if (!schule.schulform) errors[`schulbildung_${index}_schulform`] = 'Schulform ist erforderlich';
          if (!schule.name) errors[`schulbildung_${index}_name`] = 'Name der Institution ist erforderlich';
          if (!schule.ort) errors[`schulbildung_${index}_ort`] = 'Ort ist erforderlich';
          if (!schule.zeitraum_von) errors[`schulbildung_${index}_zeitraum_von`] = 'Start-Jahr ist erforderlich';
          if (!schule.zeitraum_bis) errors[`schulbildung_${index}_zeitraum_bis`] = 'End-Jahr ist erforderlich';
        });
        // Validate each berufserfahrung entry
        formData.berufserfahrung?.forEach((arbeit, index) => {
          if (!arbeit.titel) errors[`berufserfahrung_${index}_titel`] = 'Position ist erforderlich';
          if (!arbeit.unternehmen) errors[`berufserfahrung_${index}_unternehmen`] = 'Unternehmen ist erforderlich';
          if (!arbeit.ort) errors[`berufserfahrung_${index}_ort`] = 'Ort ist erforderlich';
          if (!arbeit.zeitraum_von) errors[`berufserfahrung_${index}_zeitraum_von`] = 'Start-Datum ist erforderlich';
        });
        break;
      case 4:
        // Step 4: Kenntnisse, Skills & Motivation
        if (!formData.sprachen || formData.sprachen.length === 0) {
          errors.sprachen = 'Mindestens eine Sprache ist erforderlich';
        }
        // Skills are required for azubi and fachkraft
        if ((formData.status === 'azubi' || formData.status === 'fachkraft') && 
            (!formData.faehigkeiten || formData.faehigkeiten.length === 0)) {
          errors.faehigkeiten = 'Mindestens eine Fähigkeit ist erforderlich';
        }
        // Motivation fields are optional - no validation needed
        break;
      case 5:
        if (!formData.layout) errors.layout = 'Layout-Auswahl ist erforderlich';
        break;
      case 7:
        if (!formData.datenschutz_akzeptiert) errors.datenschutz_akzeptiert = 'Datenschutzerklärung muss akzeptiert werden';
        if (!formData.agb_akzeptiert) errors.agb_akzeptiert = 'AGBs müssen akzeptiert werden';
        break;
    }
    
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