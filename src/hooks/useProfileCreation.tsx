import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

// Profile creation data interface
export interface ProfileCreationData {
  // Basic Info (Step 1)
  vorname: string;
  nachname: string;
  email: string;
  geburtsdatum: string;
  
  // Location (Step 2) 
  plz: string;
  ort: string;
  strasse: string;
  hausnummer: string;
  
  // Education/Status (Step 3)
  status: string;
  branche: string;
  schulbildung: Array<{
    schule: string;
    abschluss: string;
    zeitraum: string;
  }>;
  
  // Skills & Languages (Step 4)
  faehigkeiten: string[];
  sprachen: Array<{
    sprache: string;
    niveau: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' | 'Muttersprache';
  }>;
  
  // Experience (Step 5) - optional but must be array
  berufserfahrung: Array<{
    position: string;
    unternehmen: string;
    zeitraum: string;
    beschreibung?: string;
  }>;
  
  // CV/Documents (Step 6)
  cv_url: string | null;
  has_generated_cv: boolean;
  
  // About me (Step 7 or included in profile)
  ueber_mich?: string;
}

// Validation errors interface
export interface ValidationErrors {
  [key: string]: string[];
}

// Profile creation step definitions
export interface ProfileCreationStep {
  id: number;
  title: string;
  description: string;
  required: boolean;
  fields: string[];
}

export const PROFILE_STEPS: ProfileCreationStep[] = [
  {
    id: 1,
    title: 'Grunddaten',
    description: 'Persönliche Informationen',
    required: true,
    fields: ['vorname', 'nachname', 'email', 'geburtsdatum']
  },
  {
    id: 2,
    title: 'Adresse',
    description: 'Wohnort und Kontakt',
    required: true,
    fields: ['plz', 'ort', 'strasse', 'hausnummer']
  },
  {
    id: 3,
    title: 'Ausbildung',
    description: 'Status und Qualifikation',
    required: true,
    fields: ['status', 'branche', 'schulbildung']
  },
  {
    id: 4,
    title: 'Fähigkeiten',
    description: 'Skills und Sprachen',
    required: true,
    fields: ['faehigkeiten', 'sprachen']
  },
  {
    id: 5,
    title: 'Erfahrung',
    description: 'Berufserfahrung (optional)',
    required: false,
    fields: ['berufserfahrung']
  },
  {
    id: 6,
    title: 'Lebenslauf',
    description: 'CV Upload oder Generierung',
    required: true,
    fields: ['cv_url', 'has_generated_cv']
  },
  {
    id: 7,
    title: 'Profil‑Tags',
    description: 'Wähle Interessen & Stärken',
    required: false,
    fields: []
  }
];

const STORAGE_KEY = 'profile_creation_draft';
const MAX_RETRY_ATTEMPTS = 3;

export const useProfileCreation = () => {
  const { user, profile: existingProfile } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  
  // Profile data state
  const [profileData, setProfileData] = useState<ProfileCreationData>({
    vorname: '',
    nachname: '',
    email: user?.email || '',
    geburtsdatum: '',
    plz: '',
    ort: '',
    strasse: '',
    hausnummer: '',
    status: '',
    branche: '',
    schulbildung: [],
    faehigkeiten: [],
    sprachen: [],
    berufserfahrung: [],
    cv_url: null,
    has_generated_cv: false,
    ueber_mich: ''
  });

  // Validation errors
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  
  // Progress tracking
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  // Load draft from localStorage on mount
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔄 Profile Creation: Loading draft from storage');
    }
    
    const savedDraft = localStorage.getItem(STORAGE_KEY);
    if (savedDraft) {
      try {
        const draftData = JSON.parse(savedDraft);
        setProfileData(prev => ({ ...prev, ...draftData }));
        
        if (process.env.NODE_ENV === 'development') {
          console.log('📄 Profile Creation: Draft loaded', draftData);
        }
        
        toast({
          title: 'Entwurf wiederhergestellt',
          description: 'Ihre unvollständigen Daten wurden wiederhergestellt.',
        });
      } catch (error) {
        console.error('Error loading draft:', error);
        localStorage.removeItem(STORAGE_KEY);
      }
    }

    // Pre-fill with existing profile data if available
    if (existingProfile) {
      setProfileData(prev => ({
        ...prev,
        vorname: existingProfile.vorname || prev.vorname,
        nachname: existingProfile.nachname || prev.nachname,
        email: existingProfile.email || prev.email,
        geburtsdatum: existingProfile.geburtsdatum || prev.geburtsdatum,
        plz: existingProfile.plz || prev.plz,
        ort: existingProfile.ort || prev.ort,
        strasse: existingProfile.strasse || prev.strasse,
        hausnummer: existingProfile.hausnummer || prev.hausnummer,
        status: existingProfile.status || prev.status,
        branche: existingProfile.branche || prev.branche,
        schulbildung: existingProfile.schulbildung || prev.schulbildung,
        faehigkeiten: existingProfile.faehigkeiten || prev.faehigkeiten,
        sprachen: existingProfile.sprachen || prev.sprachen,
        berufserfahrung: existingProfile.berufserfahrung || prev.berufserfahrung,
        cv_url: existingProfile.cv_url || prev.cv_url,
        has_generated_cv: !!existingProfile.cv_url,
        ueber_mich: existingProfile.ueber_mich || prev.ueber_mich
      }));
    }
  }, [existingProfile]);

  // Save draft to localStorage on data changes
  const saveDraft = useCallback((data: ProfileCreationData) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    
    if (process.env.NODE_ENV === 'development') {
      console.log('💾 Profile Creation: Draft saved to storage');
    }
  }, []);

  // Update profile data
  const updateProfileData = useCallback((updates: Partial<ProfileCreationData>) => {
    setProfileData(prev => {
      const newData = { ...prev, ...updates };
      saveDraft(newData);
      return newData;
    });
  }, [saveDraft]);

  // Validate step data
  const validateStep = useCallback((stepId: number): boolean => {
    const step = PROFILE_STEPS.find(s => s.id === stepId);
    if (!step) return false;

    const errors: string[] = [];
    
    step.fields.forEach(field => {
      const value = profileData[field as keyof ProfileCreationData];
      
      if (step.required) {
        // Check required fields
        if (!value || (Array.isArray(value) && value.length === 0)) {
          if (field === 'berufserfahrung') {
            // Berufserfahrung is optional but must be array
            return;
          }
          errors.push(`${field} ist erforderlich`);
        }
        
        // Additional validation for specific fields
        if (field === 'email' && value && !/\S+@\S+\.\S+/.test(value as string)) {
          errors.push('Ungültige E-Mail-Adresse');
        }
        
        if (field === 'geburtsdatum' && value) {
          const age = new Date().getFullYear() - new Date(value as string).getFullYear();
          if (age < 14 || age > 100) {
            errors.push('Geburtsdatum ungültig');
          }
        }
        
        if (field === 'plz' && value && !/^\d{5}$/.test(value as string)) {
          errors.push('PLZ muss 5 Ziffern haben');
        }
      }
    });

    // Special validation for schulbildung - only required for schueler and azubi
    if (stepId === 3) {
      const status = profileData.status;
      const schulbildung = profileData.schulbildung;
      
      if ((status === 'schueler' || status === 'azubi') && (!schulbildung || schulbildung.length === 0)) {
        errors.push('Ausbildung ist für Schüler und Azubis erforderlich');
      }
    }

    // Special validation for languages (Step 4) - at least 1 language, and at least 1 must be Muttersprache
    if (stepId === 4) {
      const sprachen = profileData.sprachen;
      
      if (!sprachen || sprachen.length === 0) {
        errors.push('Mindestens 1 Sprache ist erforderlich');
      } else {
        const hasMuttersprache = sprachen.some((lang: any) => lang.niveau === 'Muttersprache');
        if (!hasMuttersprache) {
          errors.push('Mindestens 1 Muttersprache ist erforderlich');
        }
      }
    }

    // Special validation for skills (Step 4) - at least 3 skills required
    if (stepId === 4) {
      const faehigkeiten = profileData.faehigkeiten;
      
      if (!faehigkeiten || faehigkeiten.length < 3) {
        errors.push('Mindestens 3 Fähigkeiten sind erforderlich');
      }
    }

    setValidationErrors(prev => ({
      ...prev,
      [stepId]: errors
    }));

    const isValid = errors.length === 0;
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ Profile Creation: Step ${stepId} validation`, { isValid, errors });
    }

    return isValid;
  }, [profileData]);

  // Calculate completion progress
  const getProgress = useCallback((): number => {
    const requiredSteps = PROFILE_STEPS.filter(step => step.required);
    const completedRequiredSteps = requiredSteps.filter(step => 
      validateStep(step.id)
    ).length;
    
    return Math.round((completedRequiredSteps / requiredSteps.length) * 100);
  }, [validateStep]);

  // Check if profile data is complete with additional validations
  const isProfileComplete = useCallback((): boolean => {
    // First check all required steps
    const allStepsValid = PROFILE_STEPS
      .filter(step => step.required)
      .every(step => validateStep(step.id));
    
    if (!allStepsValid) return false;
    
    // Additional validations that span multiple steps
    // Check languages: at least 1, and at least 1 Muttersprache
    const sprachen = profileData.sprachen;
    if (!sprachen || sprachen.length === 0) return false;
    const hasMuttersprache = sprachen.some((lang: any) => lang.niveau === 'Muttersprache');
    if (!hasMuttersprache) return false;
    
    // Check skills: at least 3
    const faehigkeiten = profileData.faehigkeiten;
    if (!faehigkeiten || faehigkeiten.length < 3) return false;
    
    // Check schulbildung for schueler/azubi
    const status = profileData.status;
    if ((status === 'schueler' || status === 'azubi') && (!profileData.schulbildung || profileData.schulbildung.length === 0)) {
      return false;
    }
    
    // Check ueber_mich (about me) - required
    if (!profileData.ueber_mich || profileData.ueber_mich.trim() === '') {
      return false;
    }
    
    return true;
  }, [validateStep, profileData]);

  // Move to next step
  const goToNextStep = useCallback(() => {
    if (validateStep(currentStep)) {
      setCompletedSteps(prev => [...new Set([...prev, currentStep])]);
      setCurrentStep(prev => Math.min(prev + 1, PROFILE_STEPS.length));
    } else {
      toast({
        title: 'Unvollständige Daten',
        description: 'Bitte füllen Sie alle erforderlichen Felder aus.',
        variant: 'destructive'
      });
    }
  }, [currentStep, validateStep]);

  // Move to previous step
  const goToPreviousStep = useCallback(() => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  }, []);

  // Jump to specific step
  const goToStep = useCallback((stepId: number) => {
    if (stepId >= 1 && stepId <= PROFILE_STEPS.length) {
      setCurrentStep(stepId);
    }
  }, []);

  // Commit profile data to Supabase with transaction-like behavior
  const commitProfile = useCallback(async (): Promise<boolean> => {
    if (!user?.id) {
      toast({
        title: 'Nicht angemeldet',
        description: 'Bitte melden Sie sich an, um das Profil zu speichern.',
        variant: 'destructive'
      });
      return false;
    }

    if (!isProfileComplete()) {
      toast({
        title: 'Profil unvollständig',
        description: 'Bitte vervollständigen Sie alle erforderlichen Schritte.',
        variant: 'destructive'
      });
      return false;
    }

    setIsSubmitting(true);

    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('🚀 Profile Creation: Committing to Supabase', profileData);
      }

      // Prepare data for Supabase
      const supabaseData = {
        id: user.id,
        vorname: profileData.vorname,
        nachname: profileData.nachname,
        email: profileData.email,
        geburtsdatum: profileData.geburtsdatum,
        plz: profileData.plz,
        ort: profileData.ort,
        strasse: profileData.strasse,
        hausnummer: profileData.hausnummer,
        status: profileData.status,
        branche: profileData.branche,
        schulbildung: profileData.schulbildung,
        faehigkeiten: profileData.faehigkeiten,
        sprachen: profileData.sprachen,
        berufserfahrung: profileData.berufserfahrung,
        cv_url: profileData.cv_url,
        ueber_mich: profileData.ueber_mich || '',
        profile_complete: true,
        updated_at: new Date().toISOString()
      };

      // Atomic operation: upsert profile data
      const { error } = await supabase
        .from('profiles')
        .upsert(supabaseData, {
          onConflict: 'id'
        });

      if (error) {
        throw error;
      }

      // Clear draft from localStorage on success
      localStorage.removeItem(STORAGE_KEY);
      setRetryCount(0);

      toast({
        title: 'Profil erstellt!',
        description: 'Ihr Profil wurde erfolgreich gespeichert.',
      });

      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Profile Creation: Successfully committed to Supabase');
      }

      return true;

    } catch (error) {
      console.error('Profile commit error:', error);
      
      // Increment retry count
      const newRetryCount = retryCount + 1;
      setRetryCount(newRetryCount);

      if (newRetryCount < MAX_RETRY_ATTEMPTS) {
        toast({
          title: 'Speichern fehlgeschlagen',
          description: `Fehler beim Speichern. Versuche ${newRetryCount}/${MAX_RETRY_ATTEMPTS}...`,
          variant: 'destructive'
        });
        
        // Automatically retry after delay
        setTimeout(() => {
          commitProfile();
        }, 2000);
      } else {
        // Max retries reached, save locally
        saveDraft(profileData);
        
        toast({
          title: 'Speichern nicht möglich',
          description: 'Ihre Daten wurden lokal gespeichert. Bitte versuchen Sie es später erneut.',
          variant: 'destructive'
        });
      }
      
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [user?.id, isProfileComplete, profileData, retryCount, saveDraft]);

  // Clear draft
  const clearDraft = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setProfileData({
      vorname: '',
      nachname: '',
      email: user?.email || '',
      geburtsdatum: '',
      plz: '',
      ort: '',
      strasse: '',
      hausnummer: '',
      status: '',
      branche: '',
      schulbildung: [],
      faehigkeiten: [],
      sprachen: [],
      berufserfahrung: [],
      cv_url: null,
      has_generated_cv: false,
      ueber_mich: ''
    });
    setValidationErrors({});
    setCompletedSteps([]);
    setCurrentStep(1);
  }, [user?.email]);

  return {
    // Data
    profileData,
    updateProfileData,
    
    // Steps and navigation
    currentStep,
    goToNextStep,
    goToPreviousStep,
    goToStep,
    
    // Validation and progress
    validationErrors,
    validateStep,
    completedSteps,
    getProgress,
    isProfileComplete,
    
    // Actions
    commitProfile,
    clearDraft,
    
    // State
    isSubmitting,
    retryCount
  };
};