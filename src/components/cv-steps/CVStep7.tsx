import React, { useState } from 'react';
import { useCVForm } from '@/contexts/CVFormContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Download, UserPlus, Loader2, Mail, CreditCard, CheckCircle2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { generatePDF, generateCVFilename } from '@/lib/pdf-generator';
import { ProfileCreationModal } from '@/components/shared/ProfileCreationModal';
import { trackCVDownloadError, trackCVCompletion } from '@/lib/telemetry';
import BerlinLayout from '@/components/cv-layouts/BerlinLayout';
import MuenchenLayout from '@/components/cv-layouts/MuenchenLayout';
import HamburgLayout from '@/components/cv-layouts/HamburgLayout';
import KoelnLayout from '@/components/cv-layouts/KoelnLayout';
import FrankfurtLayout from '@/components/cv-layouts/FrankfurtLayout';
import DuesseldorfLayout from '@/components/cv-layouts/DuesseldorfLayout';
import StuttgartLayout from '@/components/cv-layouts/StuttgartLayout';
import DresdenLayout from '@/components/cv-layouts/DresdenLayout';
import LeipzigLayout from '@/components/cv-layouts/LeipzigLayout';
import { mapFormDataToCVData } from '@/components/cv-layouts/mapFormDataToCVData';
import { cn } from '@/lib/utils';

const CVStep7 = () => {
  const { formData, updateFormData, setCurrentStep } = useCVForm();
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const getBrancheTitle = () => {
    switch (formData.branche) {
      case 'handwerk': return 'Handwerk';
      case 'it': return 'IT';
      case 'gesundheit': return 'Gesundheit';
      case 'buero': return 'Büro & Verwaltung';
      case 'verkauf': return 'Verkauf & Handel';
      case 'gastronomie': return 'Gastronomie';
      case 'bau': return 'Bau & Architektur';
      default: return '';
    }
  };

  const getStatusTitle = () => {
    switch (formData.status) {
      case 'schueler': return 'Schüler:in';
      case 'azubi': return 'Azubi';
      case 'fachkraft': return 'Fachkraft';
      default: return '';
    }
  };

  const getLayoutName = () => {
    switch (formData.layout) {
      case 1: return 'Berlin';
      case 2: return 'München';
      case 3: return 'Hamburg';
      case 4: return 'Köln';
      case 5: return 'Frankfurt';
      case 6: return 'Düsseldorf';
      case 7: return 'Stuttgart';
      case 8: return 'Dresden';
      case 9: return 'Leipzig';
      default: return 'Berlin';
    }
  };

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
    <div className="space-y-6">
      {/* Glückwunsch Header */}
      <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">🎉 Glückwunsch!</CardTitle>
          <CardDescription className="text-base">
            Dein Lebenslauf ist fertig und sieht professionell aus!
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Zusammenfassung */}
      <Card>
        <CardHeader>
          <CardTitle>📋 Zusammenfassung</CardTitle>
          <CardDescription>Eine Übersicht deiner Angaben</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Branche:</span>
            <span className="font-medium">{getBrancheTitle()}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-muted-foreground">Status:</span>
            <span className="font-medium">{getStatusTitle()}</span>
          </div>
          
          <Separator />
          
          <div className="flex justify-between">
            <span className="text-muted-foreground">Name:</span>
            <span className="font-medium">{formData.vorname} {formData.nachname}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-muted-foreground">Wohnort:</span>
            <span className="font-medium">{formData.ort}</span>
          </div>
          
          {formData.status === 'schueler' && (
            <>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Schule:</span>
                <span className="font-medium">{formData.schule}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Abschluss:</span>
                <span className="font-medium">{formData.geplanter_abschluss} ({formData.abschlussjahr})</span>
              </div>
            </>
          )}
          
          {formData.status === 'azubi' && (
            <>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ausbildung:</span>
                <span className="font-medium">{formData.ausbildungsberuf}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Betrieb:</span>
                <span className="font-medium">{formData.ausbildungsbetrieb}</span>
              </div>
            </>
          )}
          
          {formData.status === 'fachkraft' && (
            <>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ausbildung:</span>
                <span className="font-medium">{formData.ausbildungsberuf} ({formData.abschlussjahr_fachkraft})</span>
              </div>
              {formData.aktueller_beruf && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Aktueller Beruf:</span>
                  <span className="font-medium">{formData.aktueller_beruf}</span>
                </div>
              )}
            </>
          )}
          
          <Separator />
          
          <div className="flex justify-between">
            <span className="text-muted-foreground">Layout:</span>
            <span className="font-medium">{getLayoutName()}</span>
          </div>
        </CardContent>
      </Card>

      {/* Optionen */}
      <Card>
        <CardHeader>
          <CardTitle>🎯 Was möchtest du tun?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Option 1: Profil erstellen (Empfohlen) */}
          <div className="border-2 border-primary rounded-lg p-5 bg-primary/5 space-y-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-6 w-6 text-primary mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="font-semibold text-lg mb-1">Profil erstellen (Empfohlen)</h4>
                <ul className="text-sm text-muted-foreground space-y-1 mb-4">
                  <li>✓ Von Arbeitgebern gefunden werden</li>
                  <li>✓ CV jederzeit kostenlos herunterladen</li>
                  <li>✓ Daten später bearbeiten</li>
                </ul>
                
                <Button
                  onClick={handleCreateProfile}
                  className="w-full h-11"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Jetzt Profil erstellen
                </Button>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Oder</span>
            </div>
          </div>

          {/* Option 2: Download (nur mit Profil möglich) */}
          <Button
            onClick={handleDownloadWithoutProfile}
            variant="outline"
            className="w-full h-11"
          >
            <Download className="h-4 w-4 mr-2" />
            Lebenslauf als PDF downloaden
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Ohne Profil ist aktuell leider kein Download möglich. Bitte erstelle ein kostenloses Profil.
          </p>
        </CardContent>
      </Card>

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