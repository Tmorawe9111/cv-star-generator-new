import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, User, Sparkles, Upload, CheckCircle } from 'lucide-react';
import { useAuthForCV } from '@/hooks/useAuthForCV';
import { CVUploadModal } from '@/components/cv-upload/CVUploadModal';
import { useCVForm } from '@/contexts/CVFormContext';

interface CVStep0Props {
  onUploadComplete?: (uploadId?: string, extractedData?: Record<string, any>) => void;
}

const CVStep0: React.FC<CVStep0Props> = ({ onUploadComplete }) => {
  const navigate = useNavigate();
  const { profile } = useAuthForCV();
  const { loadFromUploadedCV, goToFirstIncompleteStep } = useCVForm();
  const [showUploadModal, setShowUploadModal] = useState(false);

  const handleCreateWithProfile = () => {
    // User hat bereits ein Profil, verwende diese Daten
    navigate('/onboarding?source=cv-generator');
  };

  const handleCreateFromScratch = () => {
    // Direkt zum CV Generator ohne Profil
    navigate('/cv-generator?skip-profile=true');
  };

  const handleUploadComplete = async (uploadId: string, extractedData?: Record<string, any>) => {
    setShowUploadModal(false);
    
    if (!extractedData) {
      // No extracted data - just notify parent
      onUploadComplete?.(uploadId);
      return;
    }

    try {
      // Load extracted data into CV form
      await loadFromUploadedCV(uploadId);
      // We let CVUploadModal handle review + missing fields.
      // Once it signals "ready to continue" we jump to first incomplete step.
    } catch (error) {
      console.error('Error loading uploaded CV data:', error);
      // Still continue even if loading fails
      onUploadComplete?.(uploadId, extractedData);
    }
  };

  const handleUseOriginal = (uploadId: string, storagePath: string) => {
    // User wants to use original CV - just close and notify
    setShowUploadModal(false);
    onUploadComplete?.(uploadId);
  };

  const handleReadyToContinue = () => {
    goToFirstIncompleteStep();
  };

  return (
    <div className="space-y-2 md:space-y-4">
      <div className="text-center">
        <h2 className="text-sm md:text-xl font-bold mb-1 md:mb-2 leading-tight">
          Wie möchtest du deinen CV erstellen?
        </h2>
        <p className="text-[10px] md:text-sm text-muted-foreground max-w-2xl mx-auto">
          Lade deinen alten Lebenslauf hoch und wir extrahieren automatisch alle Daten. Du musst nur noch fehlende Informationen ergänzen.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-2 md:gap-4 max-w-6xl mx-auto">
        {/* CV hochladen - PRIMÄRE OPTION */}
        <Card className="p-2.5 md:p-5 hover:shadow-lg transition-all cursor-pointer group border-2 border-primary bg-primary/5">
          <div className="text-center space-y-1.5 md:space-y-3">
            <div className="w-10 h-10 md:w-14 md:h-14 mx-auto bg-primary/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
              <Upload className="w-5 h-5 md:w-7 md:h-7 text-primary" />
            </div>
            
            <div>
              <div className="flex items-center justify-center gap-1 mb-1">
                <h3 className="text-sm md:text-lg font-semibold">Alten Lebenslauf hochladen</h3>
                <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">Empfohlen</span>
              </div>
              <p className="text-[10px] md:text-sm text-muted-foreground mb-2 md:mb-3 leading-tight">
                Lade deinen bestehenden Lebenslauf hoch. 
                Wir extrahieren automatisch alle Daten - du musst nur noch fehlende Felder ausfüllen.
              </p>
            </div>

            <div className="space-y-1 text-left">
              <div className="flex items-start gap-1 text-[10px] md:text-sm">
                <CheckCircle className="w-3 h-3 md:w-4 md:h-4 text-primary mt-0.5 flex-shrink-0" />
                <span>Automatische Datenextraktion</span>
              </div>
              <div className="flex items-start gap-1 text-[10px] md:text-sm">
                <CheckCircle className="w-3 h-3 md:w-4 md:h-4 text-primary mt-0.5 flex-shrink-0" />
                <span>Fehlende Felder werden abgefragt</span>
              </div>
              <div className="flex items-start gap-1 text-[10px] md:text-sm">
                <CheckCircle className="w-3 h-3 md:w-4 md:h-4 text-primary mt-0.5 flex-shrink-0" />
                <span>Schnell und einfach</span>
              </div>
            </div>

            <Button 
              className="w-full mt-2 md:mt-3 h-8 md:h-10 text-[10px] md:text-sm font-semibold" 
              size="sm"
              onClick={() => setShowUploadModal(true)}
            >
              <Upload className="w-3 h-3 md:w-4 md:h-4 mr-1" />
              Lebenslauf hochladen
            </Button>
          </div>
        </Card>

        {/* Mit Profil erstellen */}
        <Card className="p-2.5 md:p-5 hover:shadow-lg transition-all cursor-pointer group border-2 hover:border-primary">
          <div className="text-center space-y-1.5 md:space-y-3">
            <div className="w-10 h-10 md:w-14 md:h-14 mx-auto bg-primary/10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
              <User className="w-5 h-5 md:w-7 md:h-7 text-primary" />
            </div>
            
            <div>
              <h3 className="text-sm md:text-lg font-semibold mb-0.5 md:mb-1">Mit Profil erstellen</h3>
              <p className="text-[10px] md:text-sm text-muted-foreground mb-2 md:mb-3 leading-tight">
                Erstelle erst ein Profil und generiere dann automatisch deinen CV. 
                Deine Daten sind später für Bewerbungen verfügbar.
              </p>
            </div>

            <div className="space-y-1 text-left">
              <div className="flex items-start gap-1 text-[10px] md:text-sm">
                <Sparkles className="w-3 h-3 md:w-4 md:h-4 text-primary mt-0.5 flex-shrink-0" />
                <span>Profil für Job-Matching nutzen</span>
              </div>
              <div className="flex items-start gap-1 text-[10px] md:text-sm">
                <Sparkles className="w-3 h-3 md:w-4 md:h-4 text-primary mt-0.5 flex-shrink-0" />
                <span>CV automatisch aus Profil generieren</span>
              </div>
              <div className="flex items-start gap-1 text-[10px] md:text-sm">
                <Sparkles className="w-3 h-3 md:w-4 md:h-4 text-primary mt-0.5 flex-shrink-0" />
                <span>Daten mehrfach verwenden</span>
              </div>
            </div>

            <Button 
              className="w-full mt-2 md:mt-3 h-8 md:h-10 text-[10px] md:text-sm" 
              size="sm"
              onClick={handleCreateWithProfile}
            >
              Profil erstellen & CV generieren
            </Button>
          </div>
        </Card>

        {/* Nur CV erstellen */}
        <Card className="p-2.5 md:p-5 hover:shadow-lg transition-all cursor-pointer group border-2 hover:border-primary">
          <div className="text-center space-y-1.5 md:space-y-3">
            <div className="w-10 h-10 md:w-14 md:h-14 mx-auto bg-primary/10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
              <FileText className="w-5 h-5 md:w-7 md:h-7 text-primary" />
            </div>
            
            <div>
              <h3 className="text-sm md:text-lg font-semibold mb-0.5 md:mb-1">Nur CV erstellen</h3>
              <p className="text-[10px] md:text-sm text-muted-foreground mb-2 md:mb-3 leading-tight">
                Erstelle schnell einen CV ohne Profil. 
                Ideal wenn du nur einen Lebenslauf brauchst.
              </p>
            </div>

            <div className="space-y-1 text-left">
              <div className="flex items-start gap-1 text-[10px] md:text-sm">
                <Sparkles className="w-3 h-3 md:w-4 md:h-4 text-primary mt-0.5 flex-shrink-0" />
                <span>Schneller Start</span>
              </div>
              <div className="flex items-start gap-1 text-[10px] md:text-sm">
                <Sparkles className="w-3 h-3 md:w-4 md:h-4 text-primary mt-0.5 flex-shrink-0" />
                <span>Weniger Schritte</span>
              </div>
              <div className="flex items-start gap-1 text-[10px] md:text-sm">
                <Sparkles className="w-3 h-3 md:w-4 md:h-4 text-primary mt-0.5 flex-shrink-0" />
                <span>Nur CV-Daten eingeben</span>
              </div>
            </div>

            <Button 
              variant="outline"
              className="w-full mt-2 md:mt-3 h-8 md:h-10 text-[10px] md:text-sm" 
              size="sm"
              onClick={handleCreateFromScratch}
            >
              Direkt zum CV Generator
            </Button>
          </div>
        </Card>

      </div>

      <CVUploadModal
        open={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUploadComplete={handleUploadComplete}
        onReadyToContinue={handleReadyToContinue}
        onUseOriginal={handleUseOriginal}
      />

      {profile && (
        <div className="max-w-4xl mx-auto p-2 md:p-3 bg-primary/5 rounded-lg border text-center">
          <p className="text-[10px] md:text-sm leading-tight">
            <strong>Hinweis:</strong> Du hast bereits ein Profil! 
            Wir können deinen CV automatisch mit deinen Profil-Daten füllen.
          </p>
        </div>
      )}
    </div>
  );
};

export default CVStep0;
