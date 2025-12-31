import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FileText, Download, Eye, Loader2 } from 'lucide-react';
import { generatePDFFromCV } from '@/lib/pdf-generator';
import { toast } from 'sonner';
import { CVLayoutSelectorDialog } from '@/components/CVLayoutSelectorDialog';

// Import CV layout components
import BerlinLayout from '@/components/cv-layouts/BerlinLayout';
import MuenchenLayout from '@/components/cv-layouts/MuenchenLayout';
import HamburgLayout from '@/components/cv-layouts/HamburgLayout';
import KoelnLayout from '@/components/cv-layouts/KoelnLayout';
import FrankfurtLayout from '@/components/cv-layouts/FrankfurtLayout';
import DuesseldorfLayout from '@/components/cv-layouts/DuesseldorfLayout';
import StuttgartLayout from '@/components/cv-layouts/StuttgartLayout';
import DresdenLayout from '@/components/cv-layouts/DresdenLayout';
import LeipzigLayout from '@/components/cv-layouts/LeipzigLayout';

interface CVPreviewCardProps {
  profile: any;
  onDownload: () => void;
  isGeneratingPDF?: boolean;
  readOnly?: boolean;
}

// Helper function to parse JSONB fields
const parseJsonField = (field: any) => {
  if (field === null || field === undefined) return null;
  if (typeof field === 'string') {
    try {
      return JSON.parse(field);
    } catch {
      return field;
    }
  }
  if (Array.isArray(field)) return field;
  return field;
};

export const CVPreviewCard: React.FC<CVPreviewCardProps> = ({ 
  profile, 
  onDownload, 
  isGeneratingPDF = false,
  readOnly = false
}) => {
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showLayoutSelector, setShowLayoutSelector] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Parse JSONB fields from profile
  const parsedSchulbildung = parseJsonField(profile?.schulbildung) || [];
  const parsedBerufserfahrung = parseJsonField(profile?.berufserfahrung) || [];
  const parsedSprachen = parseJsonField(profile?.sprachen) || [];
  const parsedFaehigkeiten = parseJsonField(profile?.faehigkeiten) || [];

  // Convert profile data to CV layout format
  const cvData = {
    vorname: profile?.vorname,
    nachname: profile?.nachname,
    telefon: profile?.telefon,
    email: profile?.email,
    strasse: profile?.strasse,
    hausnummer: profile?.hausnummer,
    plz: profile?.plz,
    ort: profile?.ort,
    geburtsdatum: profile?.geburtsdatum ? new Date(profile.geburtsdatum) : undefined,
    profilbild: profile?.avatar_url,
    avatar_url: profile?.avatar_url,
    status: profile?.status,
    branche: profile?.branche,
    ueberMich: profile?.uebermich || profile?.bio,
    schulbildung: parsedSchulbildung,
    berufserfahrung: parsedBerufserfahrung,
    sprachen: parsedSprachen,
    faehigkeiten: parsedFaehigkeiten
  };

  const handleLayoutUpdated = () => {
    // Toast wird in CVLayoutSelectorDialog angezeigt
    // Dialog wird automatisch geschlossen
    // Keine zusätzlichen Actions nötig
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const layoutId = profile.layout || 1;
      const userId = profile.id;
      const filename = `CV_${profile.vorname}_${profile.nachname}_${new Date().toISOString().split('T')[0]}.pdf`;
      
      await generatePDFFromCV(layoutId, userId, filename);
      toast.success('CV erfolgreich heruntergeladen');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Fehler beim Erstellen des PDFs');
    } finally {
      setIsDownloading(false);
    }
  };

  const renderCVLayout = () => {
    const layout = profile?.layout || 1;
    const commonProps = { data: cvData, className: "scale-50 origin-top-left w-[200%]" };

    switch (layout) {
      case 1:
        return <BerlinLayout {...commonProps} />;
      case 2:
        return <MuenchenLayout {...commonProps} />;
      case 3:
        return <HamburgLayout {...commonProps} />;
      case 4:
        return <KoelnLayout {...commonProps} />;
      case 5:
        return <FrankfurtLayout {...commonProps} />;
      case 6:
        return <DuesseldorfLayout {...commonProps} />;
      case 7:
        return <StuttgartLayout {...commonProps} />;
      case 8:
        return <DresdenLayout {...commonProps} />;
      case 9:
        return <LeipzigLayout {...commonProps} />;
      default:
        return <BerlinLayout {...commonProps} />;
    }
  };

  const getLayoutName = () => {
    const layout = profile?.layout || 1;
    switch (layout) {
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

  if (!profile?.vorname || !profile?.nachname) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Kein CV verfügbar</h3>
          <p className="text-muted-foreground mb-4">
            Vervollständigen Sie Ihr Profil, um eine CV-Vorschau zu sehen.
          </p>
          <Button onClick={() => setShowLayoutSelector(true)}>
            Layout wählen
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-border/60">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <div>
                <h3 className="font-semibold">Lebenslauf</h3>
                <p className="text-xs text-muted-foreground">Layout: {getLayoutName()}</p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowPreviewModal(true)}
            >
              <Eye className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex flex-col gap-3">
            <Button 
              className="w-full"
              onClick={handleDownload}
              disabled={isDownloading}
            >
              {isDownloading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  PDF wird erstellt...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  CV als PDF herunterladen
                </>
              )}
            </Button>
            {!readOnly && (
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setShowLayoutSelector(true)}
              >
                Layout ändern
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>CV Vorschau - {getLayoutName()}</DialogTitle>
          </DialogHeader>
          <div className="bg-white p-4 rounded">
            {renderCVLayout()}
          </div>
        </DialogContent>
      </Dialog>

      <CVLayoutSelectorDialog
        open={showLayoutSelector}
        onOpenChange={setShowLayoutSelector}
        currentLayout={profile?.layout || 1}
        profile={profile}
        onLayoutUpdated={handleLayoutUpdated}
      />
    </>
  );
};