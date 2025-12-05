import React, { useState, useEffect } from 'react';
import { useCVForm } from '@/contexts/CVFormContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Download, UserPlus, CheckCircle2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { ProfileCreationModal } from '@/components/shared/ProfileCreationModal';
import { trackCVDownloadError } from '@/lib/telemetry';
import { cn } from '@/lib/utils';
import confetti from 'canvas-confetti';

const CVStep7 = () => {
  const { formData } = useCVForm();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(true);

  // Trigger confetti animation when popup opens
  useEffect(() => {
    if (showSuccessPopup) {
      // Trigger confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });

      // Additional bursts
      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0 }
        });
      }, 250);

      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 1 }
        });
      }, 400);

      // Auto-close popup after 3 seconds
      const timer = setTimeout(() => {
        setShowSuccessPopup(false);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [showSuccessPopup]);


  const handleDownloadPDF = async () => {
    if (!formData.vorname || !formData.nachname) {
      toast.error("Vor- und Nachname sind erforderlich für den PDF-Download.");
      return;
    }

    setIsGeneratingPDF(true);
    
    try {
      // Create temporary container for rendering CV (like ProfileCard does)
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'fixed';
      tempContainer.style.left = '-10000px';
      tempContainer.style.top = '0';
      tempContainer.style.width = '794px';
      tempContainer.style.height = '1123px';
      tempContainer.style.backgroundColor = 'white';
      document.body.appendChild(tempContainer);

      // Map form data to CV data
      const cvData = mapFormDataToCVData(formData);
      
      // Get the correct layout component
      const selected = formData.layout ?? 1;
      const LayoutComponent =
        selected === 2 ? MuenchenLayout :
        selected === 3 ? HamburgLayout :
        selected === 4 ? KoelnLayout :
        selected === 5 ? FrankfurtLayout :
        selected === 6 ? DuesseldorfLayout :
        selected === 7 ? StuttgartLayout :
        selected === 8 ? DresdenLayout :
        selected === 9 ? LeipzigLayout :
        BerlinLayout;

      // Dynamically render the layout using React
      const React = await import('react');
      const ReactDOM = await import('react-dom/client');
      
      const cvElement = React.createElement(LayoutComponent, { 
        data: cvData
      });
      const root = ReactDOM.createRoot(tempContainer);
      
      await new Promise<void>((resolve) => {
        root.render(cvElement);
        // Wait for render to complete
        setTimeout(() => resolve(), 300);
      });

      // Generate filename
      const filename = generateCVFilename(formData.vorname, formData.nachname);
      
      // Generate PDF from the rendered container
      await generatePDF(tempContainer, {
        filename,
        quality: 2,
        format: 'a4',
        margin: 0
      });

      // Cleanup
      root.unmount();
      document.body.removeChild(tempContainer);
      
      toast.success(`Dein Lebenslauf wurde als ${filename} heruntergeladen.`);
      // Track successful completion
      trackCVCompletion('classic', 7, undefined, {
        action: 'download_success',
        layout: formData.layout || 1,
      });
    } catch (error: any) {
      console.error('PDF generation error:', error);
      const errorMessage = error?.message || 'Unknown PDF generation error';
      trackCVDownloadError(errorMessage, {
        step: 7,
        layout: formData.layout || 1,
        hasVorname: !!formData.vorname,
        hasNachname: !!formData.nachname,
      });
      toast.error("Es gab ein Problem beim Erstellen deines Lebenslaufs. Bitte versuche es erneut.");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleCreateProfile = () => {
    localStorage.setItem('creating-profile', 'true');
    setShowProfileModal(true);
  };

  const handleDownloadWithoutProfile = () => {
    // Track the error when user tries to download without profile
    trackCVDownloadError('Download attempted without profile', {
      step: 7,
      layout: formData.layout || 1,
      context: 'no_profile',
    });
    toast.error(
      "Bitte registriere dich, um deinen Lebenslauf herunterzuladen. Wir haben gerade ein technisches Problem, dass du den CV direkt herunterladen kannst.",
      { duration: 5000 }
    );
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Success Popup with Confetti */}
      <Dialog open={showSuccessPopup} onOpenChange={() => {}}>
        <DialogContent 
          className="sm:max-w-md p-6 md:p-8 text-center [&>button]:hidden" 
          onInteractOutside={(e) => e.preventDefault()} 
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <div className="mx-auto w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mb-4 md:mb-6 animate-in zoom-in duration-500">
            <Sparkles className="h-10 w-10 md:h-12 md:w-12 text-primary animate-pulse" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold mb-3 md:mb-4">
            🎉 Glückwunsch!
          </h2>
          <p className="text-base md:text-lg text-muted-foreground mb-2">
            Dein Lebenslauf ist fertig!
          </p>
          <p className="text-sm md:text-base font-medium text-foreground">
            Erstelle dir jetzt dein Profil
          </p>
        </DialogContent>
      </Dialog>

      {/* Centered Content - No Scrolling */}
      <div className="flex-1 min-h-0 flex items-center justify-center p-4 md:p-6">
        <div className="w-full max-w-lg mx-auto">
          {/* Options Card */}
          <Card className={cn(
            "transition-all duration-500 shadow-lg",
            showSuccessPopup ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"
          )}>
            <CardContent className="p-5 md:p-6">
              <h3 className="text-lg md:text-xl font-semibold mb-5 md:mb-6 text-center">
                Erstelle jetzt dein Profil
              </h3>
              
              <div className="space-y-4">
                {/* Option 1: Profil erstellen (Empfohlen) */}
                <div className="border-2 border-primary/30 rounded-xl p-4 md:p-5 bg-gradient-to-br from-primary/5 to-primary/10 hover:border-primary/50 transition-all">
                  <div className="space-y-3 md:space-y-4">
                    <div className="flex items-center gap-2 md:gap-3">
                      <CheckCircle2 className="h-5 w-5 md:h-6 md:w-6 text-primary flex-shrink-0" />
                      <h4 className="font-semibold text-base md:text-lg">
                        Profil erstellen
                        <span className="ml-2 text-xs md:text-sm font-normal text-primary">(Empfohlen)</span>
                      </h4>
                    </div>
                    <ul className="text-xs md:text-sm text-muted-foreground space-y-1.5 md:space-y-2 ml-7 md:ml-9">
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-0.5">✓</span>
                        <span>Von Arbeitgebern gefunden werden</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-0.5">✓</span>
                        <span>CV jederzeit kostenlos herunterladen</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-0.5">✓</span>
                        <span>Daten später bearbeiten</span>
                      </li>
                    </ul>
                    
                    <Button
                      onClick={handleCreateProfile}
                      className="w-full h-10 md:h-11 text-sm md:text-base font-medium"
                      size="lg"
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Jetzt Profil erstellen
                    </Button>
                  </div>
                </div>

                <div className="relative py-3">
                  <div className="absolute inset-0 flex items-center">
                    <Separator />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-background px-3 text-xs text-muted-foreground uppercase">Oder</span>
                  </div>
                </div>

                {/* Option 2: Download (nur mit Profil möglich) */}
                <Button
                  onClick={handleDownloadWithoutProfile}
                  variant="outline"
                  className="w-full h-10 md:h-11 text-sm md:text-base font-medium"
                  size="lg"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Lebenslauf als PDF downloaden
                </Button>

                <p className="text-xs md:text-sm text-center text-muted-foreground pt-1">
                  Ohne Profil ist aktuell leider kein Download möglich. Bitte erstelle ein kostenloses Profil.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <ProfileCreationModal
        isOpen={showProfileModal}
        onClose={() => {
          localStorage.removeItem('creating-profile');
          setShowProfileModal(false);
        }}
        prefilledEmail={formData.email || ''}
        formData={formData}
      />
    </div>
  );
};

export default CVStep7;