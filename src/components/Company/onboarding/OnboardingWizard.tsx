import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { OnboardingStep1 } from './OnboardingStep1';
import { OnboardingStep2 } from './OnboardingStep2';
import { OnboardingStep3 } from './OnboardingStep3';
import { OnboardingStep5 } from './OnboardingStep5';
import { useAuth } from '@/hooks/useAuth';

export interface OnboardingData {
  // Step 1
  companyName: string;
  email: string;
  password: string;
  phone: string;
  industry: string;
  location: string;
  
  // Step 2
  selectedPlan: 'free' | 'starter' | 'premium' | 'enterprise';
  
  // Step 3 - handled by Stripe
  
  // Step 4
  logo?: File;
  shortDescription: string;
  longDescription: string;
  companySize: string;
  benefits: string[];
  contactName: string;
  contactRole: string;
  contactEmail: string;
  
  // Step 5
  jobTitle: string;
  positions: number;
  jobLocation: string;
  startDate: Date | null;
  requirements: string[];
}

export function OnboardingWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<OnboardingData>({
    companyName: '',
    email: '',
    password: '',
    phone: '',
    industry: '',
    location: '',
    selectedPlan: 'free',
    shortDescription: '',
    longDescription: '',
    companySize: '',
    benefits: [],
    contactName: '',
    contactRole: '',
    contactEmail: '',
    jobTitle: '',
    positions: 1,
    jobLocation: '',
    startDate: null,
    requirements: [],
  });
  
  const navigate = useNavigate();
  const { user } = useAuth();

  const updateData = (newData: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...newData }));
  };

  const nextStep = () => {
    // After step 2 (plan selection), redirect to dashboard with onboarding flag
    if (currentStep === 2) {
      navigate('/company/dashboard?onboarding=true');
      return;
    }
    setCurrentStep(prev => Math.min(prev + 1, 4));
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const skipToStep = (step: number) => {
    setCurrentStep(step);
  };

  const progress = (currentStep / 4) * 100;

  const stepTitles = [
    "Unternehmensdaten",
    "Plan wählen", 
    "Was suchen Sie?",
    "Zahlungsdetails"
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary/90 via-primary to-accent/80 p-12 flex-col justify-between relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-4xl font-bold text-white mb-2">Norothy</h1>
          <p className="text-white/90 text-lg">Recruiting Platform</p>
        </div>
        
        <div className="relative z-10">
          <h2 className="text-5xl font-bold text-white mb-6 leading-tight">
            Finden Sie die besten<br />Talente für Ihr<br />Unternehmen
          </h2>
          <p className="text-white/80 text-lg max-w-md leading-relaxed">
            Erstellen Sie Ihr Unternehmensprofil in wenigen Minuten und 
            erhalten Sie Zugang zu qualifizierten Kandidaten, die perfekt 
            zu Ihren Anforderungen passen.
          </p>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-1/4 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 left-0 w-64 h-64 bg-accent/20 rounded-full blur-3xl"></div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-12">
        <div className="w-full max-w-2xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">
              Willkommen bei Norothy.
            </h1>
            <p className="text-muted-foreground text-lg">
              Lassen Sie uns beginnen.
            </p>
            
            {/* Progress indicator */}
            <div className="mt-6 flex items-center gap-2">
              {stepTitles.map((_, index) => (
                <div
                  key={index}
                  className={`h-2 flex-1 rounded-full transition-colors ${
                    index + 1 <= currentStep 
                      ? 'bg-primary' 
                      : 'bg-muted'
                  }`}
                />
              ))}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Schritt {currentStep} von {stepTitles.length}: {stepTitles[currentStep - 1]}
            </p>
          </div>

          {/* Step Content */}
          <div>
            {currentStep === 1 && (
              <OnboardingStep1 
                data={data} 
                updateData={updateData} 
                onNext={nextStep}
              />
            )}
            {currentStep === 2 && (
              <OnboardingStep2 
                data={data} 
                updateData={updateData} 
                onNext={nextStep}
                onPrev={prevStep}
              />
            )}
            {currentStep === 3 && (
              <OnboardingStep5 
                data={data} 
                updateData={updateData} 
                onNext={nextStep}
                onPrev={prevStep}
              />
            )}
            {currentStep === 4 && (
              <OnboardingStep3 
                data={data} 
                onNext={() => navigate('/company/dashboard')}
                onPrev={prevStep}
                onSkip={() => navigate('/company/dashboard')}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}