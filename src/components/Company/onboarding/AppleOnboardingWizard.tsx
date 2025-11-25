import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useCompanyId } from '@/hooks/useCompanyId';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { X, CheckCircle, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Step0Welcome } from './steps/Step0Welcome';
import { Step1PlanSelection } from './steps/Step1PlanSelection';
import { Step2BrandIdentity } from './steps/Step2BrandIdentity';
import { Step3Industry } from './steps/Step3Industry';
import { Step4Location } from './steps/Step4Location';
import { Step3LocationsTeam } from './steps/Step3LocationsTeam';
import { Step4ContactPerson } from './steps/Step4ContactPerson';
import { Step5Activation } from './steps/Step5Activation';
import { ProgressBar } from './components/ProgressBar';

export interface OnboardingData {
  // Step 1: Plan Selection
  selectedPlan: 'free' | 'basic' | 'growth' | 'bevisiblle';
  planInterval: 'month' | 'year';
  stripeSessionId?: string;
  
  // Step 2: Brand Identity
  logoUrl?: string;
  coverImageUrl?: string;
  companyBio?: string;
  websiteUrl?: string;
  
  // Step 3: Details & Location
  industry?: string;
  street?: string;
  streetNumber?: string;
  zipCode?: string;
  city?: string;
  country?: string;
  
  // Step 4: Contact Person
  contactFirstName?: string;
  contactLastName?: string;
  contactJobTitle?: string;
  contactPublicEmail?: string;
  contactPhone?: string;
  
  // Step 5: Activation (Job Posting)
  jobTitle?: string;
  employmentType?: 'full-time' | 'part-time' | 'contract' | 'internship';
  jobLocation?: string;
  remote?: boolean;
}

// Total steps calculation
// Step mapping: 0=Welcome, 1=Plan, 2=Brand, 3=Industry, 4=Location, 5=LocationsTeam (paid only), 6=Contact, 7=Activation
const getTotalSteps = (selectedPlan: OnboardingData['selectedPlan']) => {
  return selectedPlan === 'free' ? 7 : 8; // Free: skip LocationsTeam step
};

// Get actual step number for display (accounts for conditional step)
const getDisplayStep = (currentStep: number, selectedPlan: OnboardingData['selectedPlan']) => {
  return currentStep + 1;
};

interface AppleOnboardingWizardProps {
  onComplete?: () => void;
}

export function AppleOnboardingWizard({ onComplete }: AppleOnboardingWizardProps = {}) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const companyId = useCompanyId();
  const { toast } = useToast();
  
  const [currentStep, setCurrentStep] = useState(0);
  // Step mapping: 0=Welcome, 1=Plan, 2=Brand, 3=Industry, 4=Location, 5=LocationsTeam (paid only), 6=Contact, 7=Activation
  // For free plan: skip step 5 (LocationsTeam)
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [data, setData] = useState<OnboardingData>({
    selectedPlan: 'free',
    planInterval: 'month',
  });

  // Load existing company data if available
  useEffect(() => {
    const loadCompanyData = async () => {
      if (!companyId || !user) return;

      try {
        const { data: company, error } = await supabase
          .from('companies')
          .select('name, logo_url, header_image, description, website_url, industry, main_location, country')
          .eq('id', companyId)
          .single();

        if (error || !company) return;

        // Pre-fill data from existing company
        setData(prev => ({
          ...prev,
          logoUrl: company.logo_url || undefined,
          coverImageUrl: company.header_image || undefined,
          companyBio: company.description || undefined,
          websiteUrl: company.website_url || undefined,
          industry: company.industry || undefined,
          // Parse city from main_location if available
          city: company.main_location ? company.main_location.split(',')[0].trim() : undefined,
          country: company.country || 'DE',
        }));

        // Load contact person data from profiles (via company_users)
        const { data: companyUser } = await supabase
          .from('company_users')
          .select('user_id, profiles!inner(email, vorname, nachname, telefon)')
          .eq('company_id', companyId)
          .eq('user_id', user.id)
          .maybeSingle();

        if (companyUser && (companyUser.profiles as any)) {
          const profile = companyUser.profiles as any;
          setData(prev => ({
            ...prev,
            contactPublicEmail: profile.email || undefined,
            contactPhone: profile.telefon || undefined,
          }));
        }
      } catch (error) {
        console.error('Error loading company data:', error);
      }
    };

    loadCompanyData();
  }, [companyId, user]);

  const updateData = (newData: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...newData }));
  };

  const handleNext = async () => {
    // Save data for current step before proceeding
    if (currentStep > 0 && companyId) {
      await saveStepData(currentStep);
    }
    
    const totalSteps = getTotalSteps(data.selectedPlan);
    const nextStep = currentStep + 1;
    
    if (nextStep < totalSteps) {
      setCurrentStep(nextStep);
    } else {
      await completeOnboarding();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const saveStepData = async (step: number) => {
    if (!companyId) return;

    try {
      const updatePayload: any = {};

      // Step 2: Brand Identity
      if (step === 2) {
        if (data.logoUrl) updatePayload.logo_url = data.logoUrl;
        if (data.coverImageUrl) updatePayload.header_image = data.coverImageUrl;
        if (data.companyBio) updatePayload.description = data.companyBio;
        if (data.websiteUrl) updatePayload.website_url = data.websiteUrl;
        // Logo and description are required
        if (!data.logoUrl || !data.companyBio || data.companyBio.trim().length < 20) {
          throw new Error('Logo und Unternehmensbeschreibung (mind. 20 Zeichen) sind erforderlich');
        }
      }

      // Step 3: Industry
      if (step === 3) {
        if (data.industry) updatePayload.industry = data.industry;
      }

      // Step 4: Location - Save full address to companies table
      if (step === 4) {
        if (data.country) updatePayload.country = data.country;
        if (data.street) updatePayload.street = data.street;
        if (data.streetNumber) updatePayload.house_number = data.streetNumber;
        if (data.zipCode) updatePayload.postal_code = data.zipCode;
        if (data.city) updatePayload.city = data.city;
        // Also set main_location for backwards compatibility
        const locationParts = [data.street, data.streetNumber, data.zipCode, data.city].filter(Boolean);
        if (locationParts.length > 0) {
          updatePayload.main_location = locationParts.join(' ');
        }
      }

      if (Object.keys(updatePayload).length > 0) {
        const { error } = await supabase
          .from('companies')
          .update(updatePayload)
          .eq('id', companyId);

        if (error) throw error;
      }

      // Step 4: Also save to company_locations table with coordinates
      if (step === 4 && data.city) {
        // Get coordinates from postal_codes table
        let lat: number | null = null;
        let lon: number | null = null;
        
        if (data.zipCode) {
          const { data: plzData } = await supabase
            .from('postal_codes')
            .select('lat, lon')
            .eq('plz', data.zipCode)
            .single();
          
          if (plzData) {
            lat = plzData.lat;
            lon = plzData.lon;
          }
        }

        // Check if a primary location already exists
        const { data: existingLocations } = await supabase
          .from('company_locations')
          .select('id')
          .eq('company_id', companyId)
          .eq('is_primary', true);

        const countryName = data.country === 'DE' ? 'Deutschland' : 
                            data.country === 'AT' ? 'Österreich' : 
                            data.country === 'CH' ? 'Schweiz' : data.country || 'Deutschland';

        if (!existingLocations || existingLocations.length === 0) {
          // Create the primary location with coordinates
          const { error: locationError } = await supabase
            .from('company_locations')
            .insert({
              company_id: companyId,
              name: 'Hauptstandort',
              street: data.street || null,
              house_number: data.streetNumber || null,
              postal_code: data.zipCode || '',
              city: data.city,
              country: countryName,
              is_primary: true,
              is_active: true,
              lat,
              lon,
            });

          if (locationError) {
            console.error('Error creating company location:', locationError);
          }
        } else {
          // Update the existing primary location with coordinates
          const { error: locationError } = await supabase
            .from('company_locations')
            .update({
              street: data.street || null,
              house_number: data.streetNumber || null,
              postal_code: data.zipCode || '',
              city: data.city,
              country: countryName,
              lat,
              lon,
            })
            .eq('company_id', companyId)
            .eq('is_primary', true);

          if (locationError) {
            console.error('Error updating company location:', locationError);
          }
        }
      }

      // Step 6: Contact Person
      if (step === 6 && user && companyId) {
        // Update profile with phone
        const profileUpdate: any = {};
        if (data.contactPhone) profileUpdate.telefon = data.contactPhone;

        if (Object.keys(profileUpdate).length > 0) {
          const { error } = await supabase
            .from('profiles')
            .update(profileUpdate)
            .eq('id', user.id);

          if (error) throw error;
        }

        // Update company with contact person information
        const contactName = `${data.contactFirstName || ''} ${data.contactLastName || ''}`.trim();
        const companyUpdate: any = {};
        
        if (contactName) {
          companyUpdate.contact_person = contactName;
        }
        if (data.contactPublicEmail) {
          companyUpdate.contact_email = data.contactPublicEmail;
        }
        if (data.contactJobTitle) {
          companyUpdate.contact_position = data.contactJobTitle;
        }
        if (data.contactPhone) {
          companyUpdate.contact_phone = data.contactPhone;
        }

        if (Object.keys(companyUpdate).length > 0) {
          const { error } = await supabase
            .from('companies')
            .update(companyUpdate)
            .eq('id', companyId);

          if (error) throw error;
        }
      }
    } catch (error) {
      console.error('Error saving step data:', error);
    }
  };

  const completeOnboarding = async () => {
    if (!companyId) return;

    setLoading(true);
    try {
      // Save all remaining data
      await saveStepData(2);
      await saveStepData(3);
      await saveStepData(4);

      // Step 5: Create job posting if paid plan
      if (data.selectedPlan !== 'free' && data.jobTitle) {
        const { error: jobError } = await supabase
          .from('job_posts')
          .insert({
            company_id: companyId,
            title: data.jobTitle,
            employment_type: data.employmentType || 'full-time',
            location: data.jobLocation || data.city || '',
            remote: data.remote || false,
            status: 'draft',
          });

        if (jobError) {
          console.error('Error creating job posting:', jobError);
          // Don't throw - onboarding can still complete
        }
      }

      // Mark onboarding as complete
      const { error } = await supabase
        .from('companies')
        .update({ onboarding_completed: true })
        .eq('id', companyId);

      if (error) throw error;

      // Show success screen with confetti
      setShowSuccess(true);
      
      // Trigger confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      
      // Second burst
      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0 }
        });
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 1 }
        });
      }, 250);

      // Redirect after 3 seconds
      setTimeout(() => {
        if (onComplete) {
          onComplete();
        } else {
          navigate('/unternehmen/startseite');
        }
      }, 3000);
    } catch (error: any) {
      console.error('Error completing onboarding:', error);
      toast({
        title: 'Fehler',
        description: error.message || 'Onboarding konnte nicht abgeschlossen werden',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePlanSelected = async (plan: OnboardingData['selectedPlan'], interval: OnboardingData['planInterval']) => {
    updateData({ selectedPlan: plan, planInterval: interval });
    
    if (plan === 'free') {
      // Free plan: continue to next step
      handleNext();
    } else {
      // Paid plan: open Stripe checkout
      await openStripeCheckout(plan, interval);
    }
  };

  const openStripeCheckout = async (plan: OnboardingData['selectedPlan'], interval: OnboardingData['planInterval']) => {
    if (!companyId) {
      toast({
        title: 'Fehler',
        description: 'Unternehmens-ID nicht gefunden. Bitte laden Sie die Seite neu.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      // Use fallback values like in other components
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://koymmvuhcxlvcuoyjnvv.supabase.co';
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtveW1tdnVoY3hsdmN1b3lqbnZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzODA3NTcsImV4cCI6MjA2OTk1Njc1N30.Pb5uz3xFH2Fupk9JSjcbxNrS-s_mE3ySnFy5B7HcZFw';
      
      const response = await fetch(`${supabaseUrl}/functions/v1/stripe-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({
          companyId,
          plan,
          interval,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        // Show detailed error message from backend
        const errorMessage = result.error || result.details || 'Stripe Checkout konnte nicht erstellt werden';
        const errorDetails = result.details ? `\n\nDetails: ${result.details}` : '';
        const envVar = result.envVar ? `\n\nBitte konfigurieren Sie ${result.envVar} in Supabase Secrets.` : '';
        
        throw new Error(`${errorMessage}${errorDetails}${envVar}`);
      }

      if (result.error) {
        throw new Error(result.error);
      }

      if (!result.url) {
        throw new Error('Keine Checkout-URL von Stripe erhalten');
      }

      // Save plan selection
      updateData({ selectedPlan: plan, planInterval: interval, stripeSessionId: result.session_id });
      
      // Redirect to Stripe
      window.location.href = result.url;
    } catch (error: any) {
      console.error('Error opening Stripe checkout:', error);
      console.error('Error details:', {
        plan,
        interval,
        companyId,
        message: error.message,
      });
      
      toast({
        title: 'Fehler beim Öffnen des Checkouts',
        description: error.message || 'Checkout konnte nicht geöffnet werden. Bitte versuchen Sie es erneut oder kontaktieren Sie den Support.',
        variant: 'destructive',
      });
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <Step0Welcome onNext={handleNext} />;
      case 1:
        return (
          <Step1PlanSelection
            selectedPlan={data.selectedPlan}
            selectedInterval={data.planInterval}
            onPlanSelected={handlePlanSelected}
            onNext={handleNext}
            loading={loading}
          />
        );
      case 2:
        return (
          <Step2BrandIdentity
            data={data}
            onUpdate={updateData}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 3:
        return (
          <Step3Industry
            data={data}
            onUpdate={updateData}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 4:
        return (
          <Step4Location
            data={data}
            onUpdate={updateData}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 5:
        // LocationsTeam step - only for paid plans
        if (data.selectedPlan === 'free') {
          // Skip to next step for free plan
          setCurrentStep(6);
          return null;
        }
        return (
          <Step3LocationsTeam
            data={data}
            onUpdate={updateData}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 6:
        return (
          <Step4ContactPerson
            data={data}
            onUpdate={updateData}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 7:
        return (
          <Step5Activation
            data={data}
            onUpdate={updateData}
            onComplete={completeOnboarding}
            onBack={handleBack}
            loading={loading}
          />
        );
      default:
        return null;
    }
  };

  // Success Screen
  if (showSuccess) {
    return (
      <div className="bg-white relative flex flex-col h-full overflow-hidden items-center justify-center">
        <div className="text-center space-y-6 px-8">
          <div className="relative">
            <div className="w-24 h-24 mx-auto bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-14 h-14 text-green-600" />
            </div>
            <Sparkles className="w-8 h-8 text-yellow-500 absolute -top-2 -right-2 animate-pulse" />
          </div>
          
          <div className="space-y-3">
            <h1 className="text-4xl font-light text-gray-900 tracking-tight">
              Willkommen bei BeVisiblle!
            </h1>
            <p className="text-xl text-gray-600">
              Ihr Unternehmensprofil wurde erfolgreich erstellt.
            </p>
          </div>
          
          <div className="pt-4">
            <p className="text-sm text-gray-500">
              Sie werden in wenigen Sekunden weitergeleitet...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white relative flex flex-col h-full overflow-hidden">
      {/* Progress Bar - Always visible, including step 0 */}
      <div className="flex-shrink-0 bg-white border-b border-gray-100 px-8 py-5">
        <div className="max-w-4xl mx-auto">
          <ProgressBar 
            currentStep={currentStep === 0 ? 1 : getDisplayStep(currentStep, data.selectedPlan)} 
            totalSteps={getTotalSteps(data.selectedPlan)} 
          />
        </div>
      </div>

      {/* Step Content - No scroll, fits to screen */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full px-8 py-8 overflow-hidden">
          <div className="flex-1 flex flex-col overflow-hidden">
            {renderStep()}
          </div>
        </div>
      </div>
    </div>
  );
}

