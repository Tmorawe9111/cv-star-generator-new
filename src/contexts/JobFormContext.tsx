import { createContext, useContext, useState, ReactNode } from 'react';

export interface JobFormData {
  // Step 1: Basis
  title: string;
  industry: string;
  city: string;
  employment_type: string;
  start_date: string;
  
  // Step 2: Skills & Anforderungen
  skills: Array<{ name: string; level: 'must_have' | 'nice_to_have' | 'trainable' }>;
  required_languages: Array<{ language: string; level: string }>;
  certifications: string[];
  required_documents: Array<{ type: string; label: string; required: boolean }>;
  optional_documents: Array<{ type: string; label: string; required: boolean }>;
  
  // Step 3: Beschreibung
  description_md: string;
  tasks_md: string;
  requirements_md: string;
  benefits_description: string;
  
  // Step 4: Kontaktperson
  contact_person_name: string;
  contact_person_email: string;
  contact_person_phone?: string;
  contact_person_role?: string;
  contact_person_photo_url?: string;
  
  // Step 5: Details
  salary_min?: number;
  salary_max?: number;
  work_mode?: 'remote' | 'hybrid' | 'onsite';
  working_hours?: string;
  is_public: boolean;
  is_active: boolean;
}

interface JobFormContextType {
  formData: JobFormData;
  currentStep: number;
  setFormData: (data: Partial<JobFormData>) => void;
  nextStep: () => void;
  prevStep: () => void;
  setStep: (step: number) => void;
  resetForm: () => void;
}

const JobFormContext = createContext<JobFormContextType | undefined>(undefined);

const initialFormData: JobFormData = {
  title: '',
  industry: '',
  city: '',
  employment_type: 'full-time',
  start_date: '',
  skills: [],
  required_languages: [],
  certifications: [],
  required_documents: [],
  optional_documents: [],
  description_md: '',
  tasks_md: '',
  requirements_md: '',
  benefits_description: '',
  contact_person_name: '',
  contact_person_email: '',
  contact_person_phone: '',
  contact_person_role: '',
  contact_person_photo_url: '',
  is_public: true,
  is_active: false,
};

export function JobFormProvider({ children, initialData }: { children: ReactNode; initialData?: Partial<JobFormData> }) {
  const [formData, setFormDataState] = useState<JobFormData>({
    ...initialFormData,
    ...initialData,
  });
  const [currentStep, setCurrentStep] = useState(1);

  const setFormData = (data: Partial<JobFormData>) => {
    setFormDataState(prev => ({ ...prev, ...data }));
  };

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 6));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));
  const setStep = (step: number) => setCurrentStep(Math.max(1, Math.min(step, 6)));
  const resetForm = () => {
    setFormDataState(initialFormData);
    setCurrentStep(1);
  };

  return (
    <JobFormContext.Provider value={{
      formData,
      currentStep,
      setFormData,
      nextStep,
      prevStep,
      setStep,
      resetForm,
    }}>
      {children}
    </JobFormContext.Provider>
  );
}

export function useJobForm() {
  const context = useContext(JobFormContext);
  if (!context) {
    throw new Error('useJobForm must be used within JobFormProvider');
  }
  return context;
}