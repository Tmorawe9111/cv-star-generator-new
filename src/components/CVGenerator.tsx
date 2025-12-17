import React, { useEffect, useRef } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useCVForm } from '@/contexts/CVFormContext';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { trackCVStep, trackCVCompletion, trackCVAbandonment, trackButtonClick } from '@/lib/telemetry';
import CVStep0 from './cv-steps/CVStep0';
import CVStep1 from './cv-steps/CVStep1';
import CVStep2 from './cv-steps/CVStep2';
import CVStep3New from './cv-steps/CVStep3New';
import CVStep4 from './cv-steps/CVStep4';
import CVStep5 from './cv-steps/CVStep5';
import CVStep6 from './cv-steps/CVStep6';
import CVStep7 from './cv-steps/CVStep7';
const CVGeneratorContent = () => {
  const {
    currentStep,
    setCurrentStep,
    formData,
    isLayoutEditMode,
    setLayoutEditMode,
    validateStep,
    validationErrors
  } = useCVForm();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get('returnTo');
  const startTimeRef = useRef<number>(Date.now());
  const stepNames: Record<number, string> = {
    0: 'Willkommen',
    1: 'Persönliche Daten',
    2: 'Kontakt',
    3: 'Beruflicher Werdegang',
    4: 'Kenntnisse & Motivation',
    5: 'Layout Auswahl',
    6: 'Vorschau',
    7: 'Fertig',
  };

  useEffect(() => {
    if (location.pathname === '/cv-generator') {
      setLayoutEditMode(false);
      localStorage.removeItem('cvLayoutEditMode');
      startTimeRef.current = Date.now();
      // Track CV Generator start
      trackButtonClick('CV Generator Start', 'cv_generator');
    }
  }, [location.pathname, setLayoutEditMode]);

  // Track step changes
  useEffect(() => {
    if (currentStep > 0 && !isLayoutEditMode) {
      const stepName = stepNames[currentStep] || `Step ${currentStep}`;
      trackCVStep(currentStep, stepName, 'classic', {
        isLayoutEditMode: false,
      });
    }
  }, [currentStep, isLayoutEditMode]);
  const renderStep = () => {
    // In layout edit mode, only show steps 5 and 6
    if (isLayoutEditMode) {
      switch (currentStep) {
        case 5:
          return <CVStep5 />;
        case 6:
          return <CVStep6 />;
        default:
          return <CVStep5 />;
      }
    }

    // Normal mode - show all steps
    switch (currentStep) {
      case 0:
        return <CVStep0 />;
      case 1:
        return <CVStep1 />;
      case 2:
        return <CVStep2 />;
      case 3:
        return <CVStep4 />; // Beruflicher Werdegang
      case 4:
        return <CVStep3New />; // Kenntnisse & Motivation
      case 5:
        return <CVStep5 />;
      case 6:
        return <CVStep6 />; // Final Review (optional, can be skipped)
      case 7:
        return <CVStep7 />;
      default:
        return <CVStep0 />;
    }
  };
  const handleNext = () => {
    if (isLayoutEditMode) {
      // In layout edit mode, only allow step 5 -> 6
      if (currentStep === 5 && validateStep(5)) {
        setCurrentStep(6);
      }
    } else {
      // Normal mode - validate current step before proceeding
      // Step 0 doesn't need validation
      if (currentStep === 0) {
        trackButtonClick('CV Generator: Start', 'cv_generator');
        setCurrentStep(1);
      } else if (currentStep < 7 && validateStep(currentStep)) {
        // Track step completion
        const stepName = stepNames[currentStep] || `Step ${currentStep}`;
        trackCVStep(currentStep, stepName, 'classic', {
          action: 'step_completed',
          validated: true,
        });
        
        // Step 5 -> Skip Step 6 (optional review) and go directly to Step 7 (final)
        if (currentStep === 5) {
          setCurrentStep(7);
        } else if (currentStep === 6) {
          // If moving to final step from Step 6, track completion
          const timeToComplete = Math.round((Date.now() - startTimeRef.current) / 1000);
          trackCVCompletion('classic', 7, timeToComplete, {
            isLayoutEditMode: false,
          });
          setCurrentStep(7);
        } else {
          setCurrentStep(currentStep + 1);
        }
      } else {
        // Track validation error
        const stepName = stepNames[currentStep] || `Step ${currentStep}`;
        trackCVStep(currentStep, stepName, 'classic', {
          action: 'validation_failed',
          errors: Object.keys(validationErrors).length,
        });
      }
    }
  };
  const handlePrevious = () => {
    if (isLayoutEditMode) {
      // In layout edit mode, only allow step 6 -> 5
      if (currentStep === 6) {
        setCurrentStep(5);
      }
    } else {
      // Normal mode
      if (currentStep > 0) {
        setCurrentStep(currentStep - 1);
      }
    }
  };
  const handleBackToHome = () => {
    // Track abandonment if not on first step
    if (currentStep > 0 && currentStep < 7) {
      const stepName = stepNames[currentStep] || `Step ${currentStep}`;
      trackCVAbandonment(currentStep, stepName, 'classic', {
        action: 'back_to_home',
      });
    }
    
    if (isLayoutEditMode) {
      navigate('/profile');
    } else {
      navigate('/');
    }
  };
  const totalSteps = isLayoutEditMode ? 2 : 7;
  const stepIndex = isLayoutEditMode ? Math.max(1, currentStep - 4) : Math.max(0, currentStep);
  const progressValue = currentStep > 0
    ? (isLayoutEditMode ? (stepIndex / totalSteps) * 100 : (stepIndex / totalSteps) * 100)
    : 0;
  const topTitle = isLayoutEditMode ? "CV Layout" : "CV-Generator";
  const centerTitle =
    isLayoutEditMode
      ? (stepIndex === 1 ? "Layout" : "Vorschau")
      : currentStep === 0
      ? "Willkommen"
      : stepNames[currentStep] || `Schritt ${currentStep}`;

  return (
    <div className="h-screen bg-background overflow-hidden flex flex-col" data-cv-preview>
      <div className="flex-1 flex flex-col overflow-hidden container mx-auto px-3 md:px-4 max-w-full md:max-w-2xl w-full">
        {/* Header (Apple-style, minimal height) */}
        <div className="flex-shrink-0 z-30 bg-background/90 backdrop-blur border-b py-2">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBackToHome}
              className="h-10 w-10 rounded-full"
              aria-label="Zurück"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>

            <div className="min-w-0 text-center">
              <div className="text-[11px] text-muted-foreground leading-tight">{topTitle}</div>
              <div className="truncate text-sm font-semibold text-foreground leading-tight">
                {centerTitle}
              </div>
            </div>

            <div className="w-10 text-right">
              {currentStep > 0 && (
                <span className="text-[11px] text-muted-foreground tabular-nums">
                  {stepIndex}/{totalSteps}
                </span>
              )}
            </div>
          </div>
          {currentStep > 0 && (
            <div className="mt-2">
              <Progress value={progressValue} className="h-1" />
            </div>
          )}
        </div>

        {/* Step Content (NO outer scrolling) */}
        <div className="flex-1 min-h-0 overflow-hidden py-2">
          <div className="h-full min-h-0 overflow-hidden break-words">
            {renderStep()}
          </div>

          {/* Validation Errors (small, no layout shift) */}
          {Object.keys(validationErrors).length > 0 && (
            <div className="mt-2 rounded-xl border border-destructive/30 bg-destructive/10 p-2">
              <div className="text-xs font-semibold text-destructive">
                Bitte fülle die Pflichtfelder aus
              </div>
              <ul className="mt-1 max-h-20 overflow-y-auto text-[11px] text-destructive space-y-0.5">
                {Object.values(validationErrors).map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Navigation - Fixed at bottom - Hidden for Step 7 */}
        {currentStep > 0 && currentStep !== 7 && (
          <div className="flex-shrink-0 border-t bg-background/90 backdrop-blur px-3 md:px-4 py-3 md:py-4">
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={isLayoutEditMode ? currentStep === 5 : currentStep === 1}
                className="h-12 flex-1 rounded-full text-sm font-semibold"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Zurück
              </Button>

              {(isLayoutEditMode ? currentStep < 6 : currentStep < 7) && (
                <Button
                  onClick={handleNext}
                  className="h-12 flex-1 rounded-full text-sm font-semibold bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] hover:from-[#1D4ED8] hover:to-[#1E40AF] shadow-md hover:shadow-lg"
                >
                  <span>
                    {currentStep === 5
                      ? 'Weiter zum Download'
                      : currentStep === 6
                      ? 'Weiter zum Download'
                      : 'Weiter'}
                  </span>
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
const CVGenerator = () => {
  return <CVGeneratorContent />;
};
export default CVGenerator;