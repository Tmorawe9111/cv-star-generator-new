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
  return <div className="h-screen bg-background overflow-hidden flex flex-col" data-cv-preview>
      <div className="flex-1 flex flex-col overflow-hidden container mx-auto px-2 md:px-4 max-w-full md:max-w-2xl w-full">
        {/* Header - Ultra compact on mobile */}
        <div className="flex-shrink-0 z-30 bg-background border-b py-1.5 md:py-3">
          <Button variant="ghost" onClick={handleBackToHome} className="mb-1 md:mb-2 text-[10px] md:text-sm min-h-[28px] md:min-h-[36px] h-auto py-0.5 px-1.5 md:px-2" size="sm">
            <ArrowLeft className="h-3 w-3 md:h-4 md:w-4 mr-1" />
            <span className="hidden sm:inline text-xs md:text-sm">Zurück</span>
            <span className="sm:hidden text-[10px]">←</span>
          </Button>
          
          <div className="space-y-1 md:space-y-2">
            <h1 className="text-sm md:text-xl font-bold text-foreground leading-tight">
              {isLayoutEditMode ? 'CV-Layout bearbeiten' : 'CV-Generator'}
            </h1>
            <div className="space-y-0.5 md:space-y-1">
              <div className="flex justify-between text-[9px] md:text-xs text-muted-foreground">
                {isLayoutEditMode ? <>
                    <span>Schritt {currentStep - 4} von 2</span>
                    <span>{Math.round((currentStep - 4) / 2 * 100)}%</span>
                  </> : currentStep === 0 ? <>
                    <span>Willkommen</span>
                    <span>Wähle Option</span>
                  </> : <>
                    <span>Schritt {currentStep} von 7</span>
                    <span>{Math.round(currentStep / 7 * 100)}%</span>
                  </>}
              </div>
              {currentStep > 0 && <Progress value={isLayoutEditMode ? (currentStep - 4) / 2 * 100 : currentStep / 7 * 100} className="h-0.5 md:h-1" />}
            </div>
          </div>
        </div>

        {/* Step Content - Scrollable except Step 5, 6, and 7 */}
        <div className={`flex-1 min-h-0 flex flex-col ${currentStep === 5 || currentStep === 6 || currentStep === 7 ? 'overflow-hidden' : 'overflow-y-auto'}`}>
          <div className={`flex-1 ${currentStep === 5 || currentStep === 6 || currentStep === 7 ? 'overflow-hidden' : 'overflow-y-auto'}`}>
            <div className={`min-h-full ${currentStep === 5 || currentStep === 6 || currentStep === 7 ? 'overflow-hidden h-full p-0' : 'overflow-y-auto'}`}>
              <div className={`${currentStep === 5 || currentStep === 6 || currentStep === 7 ? 'h-full p-0' : 'py-1 md:py-2'} break-words`}>
                {renderStep()}
              </div>

              {/* Validation Errors */}
              {Object.keys(validationErrors).length > 0 && (
                <div className="mb-2 md:mb-3 p-2 md:p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <h3 className="text-[10px] md:text-sm font-medium text-destructive mb-1">
                    Bitte füllen Sie alle Pflichtfelder aus:
                  </h3>
                  <ul className="text-[9px] md:text-xs text-destructive space-y-0.5">
                    {Object.values(validationErrors).map((error, index) => <li key={index}>• {error}</li>)}
                  </ul>
                </div>
              )}
            </div>
          </div>
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
    </div>;
};
const CVGenerator = () => {
  return <CVGeneratorContent />;
};
export default CVGenerator;