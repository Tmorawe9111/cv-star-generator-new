import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, User, Sparkles } from 'lucide-react';
import { useAuthForCV } from '@/hooks/useAuthForCV';
import { useCVForm } from '@/contexts/CVFormContext';

interface CVStep0Props {
  onUploadComplete?: (uploadId?: string, extractedData?: Record<string, any>) => void;
}

const CVStep0: React.FC<CVStep0Props> = ({ onUploadComplete }) => {
  const navigate = useNavigate();
  const { profile } = useAuthForCV();
  const { goToFirstIncompleteStep } = useCVForm();

  const handleCreateWithProfile = () => {
    // User hat bereits ein Profil, verwende diese Daten
    navigate('/onboarding?source=cv-generator');
  };

  const handleCreateFromScratch = () => {
    // Direkt zum CV Generator ohne Profil
    navigate('/cv-generator?skip-profile=true');
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
          Erstelle deinen Lebenslauf mit Profil oder komplett neu – du kannst ihn später als PDF herunterladen.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-2 md:gap-4 max-w-6xl mx-auto">
        {/* Mit Profil erstellen – PRIMÄRE OPTION */}
        <Card className="p-2.5 md:p-5 hover:shadow-lg transition-all cursor-pointer group border-2 border-primary bg-primary/5">
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
