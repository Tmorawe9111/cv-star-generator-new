import React, { useState } from 'react';
import { useCVForm } from '@/contexts/CVFormContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const CVStep5 = () => {
  const { formData, updateFormData } = useCVForm();
  const { toast } = useToast();
  const [generatingAboutMe, setGeneratingAboutMe] = useState(false);

  // Check if user can generate (has skills and languages)
  const canGenerateAboutMe = () => {
    return (formData.faehigkeiten?.length || 0) > 0 && (formData.sprachen?.length || 0) > 0;
  };

  // Generate "About Me" text using AI
  const generateAboutMeWithAI = async () => {
    if (!canGenerateAboutMe()) {
      toast({
        title: "Fehler",
        description: "Bitte wähle zuerst mindestens eine Fähigkeit und eine Sprache aus (Step 3).",
        variant: "destructive"
      });
      return;
    }

    setGeneratingAboutMe(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-generate-about-me', {
        body: { 
          branche: formData.branche,
          status: formData.status,
          faehigkeiten: formData.faehigkeiten || [],
          schulbildung: formData.schulbildung || [],
          berufserfahrung: formData.berufserfahrung || [],
          motivation: formData.motivation,
          kenntnisse: formData.kenntnisse,
          geburtsdatum: formData.geburtsdatum
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw error;
      }

      if (data.success && data.aboutMe) {
        updateFormData({ ueberMich: data.aboutMe });
        
        toast({
          title: "Erfolgreich generiert!",
          description: "Dein persönlicher Text wurde erstellt. Du kannst ihn jederzeit bearbeiten."
        });
      } else {
        throw new Error(data.error || 'Keine Antwort von der KI erhalten');
      }
    } catch (error: any) {
      console.error('Error generating about me:', error);
      toast({
        title: "Fehler",
        description: error.message || "Der Text konnte nicht generiert werden. Bitte versuche es erneut.",
        variant: "destructive"
      });
    } finally {
      setGeneratingAboutMe(false);
    }
  };

  const layouts = [
    {
      id: 1,
      name: 'Berlin',
      description: 'Elegantes Sidebar-Layout mit beige Tönen – Perfekt für kreative Berufe',
      preview: '🎨',
      color: 'bg-amber-50 border-amber-300'
    },
    {
      id: 2,
      name: 'München',
      description: 'Modernes Layout mit blauer Sidebar – Ideal für IT & Technik',
      preview: '💼',
      color: 'bg-blue-50 border-blue-300'
    },
    {
      id: 3,
      name: 'Hamburg',
      description: 'Klassisches Timeline-Layout – Übersichtlich für alle Branchen',
      preview: '📅',
      color: 'bg-gray-50 border-gray-300'
    },
    {
      id: 4,
      name: 'Köln',
      description: 'Modernes Urban-Layout mit dunkler Sidebar – Professionell für alle Branchen',
      preview: '🏙️',
      color: 'bg-slate-50 border-slate-300'
    },
    {
      id: 5,
      name: 'Frankfurt',
      description: 'Business-Layout mit hellem Design – Ideal für Verwaltung & Management',
      preview: '📊',
      color: 'bg-stone-50 border-stone-300'
    },
    {
      id: 6,
      name: 'Düsseldorf',
      description: 'Harvard Style ohne Foto – Akademisch für Finance & Consulting',
      preview: '🎓',
      color: 'bg-neutral-50 border-neutral-300'
    },
    {
      id: 7,
      name: 'Stuttgart',
      description: 'Warmes Orange-Beige Design mit Unterschrift – Ideal für Handwerk & Kreative',
      preview: '🎨',
      color: 'bg-orange-50 border-orange-300'
    },
    {
      id: 8,
      name: 'Dresden',
      description: 'Elegantes Dunkelblau mit Icons – Professionell für alle Branchen',
      preview: '💎',
      color: 'bg-blue-50 border-blue-300'
    },
    {
      id: 9,
      name: 'Leipzig',
      description: 'Minimalistisches Schwarz-Weiß Timeline-Design – Modern für IT & Business',
      preview: '⚡',
      color: 'bg-slate-50 border-slate-300'
    }
  ];

  const getRecommendedLayout = () => {
    switch (formData.branche) {
      case 'handwerk': return 7; // Stuttgart - Orange-Beige für Handwerk
      case 'it': return 9; // Leipzig - Minimalistisch für IT
      case 'gesundheit': return 8; // Dresden - Elegant für Gesundheit
      case 'buero': return 5; // Frankfurt - Business clean
      case 'verkauf': return 1; // Berlin - Kreativ beige
      case 'gastronomie': return 4; // Köln - Urban freundlich
      case 'bau': return 3; // Hamburg - Klassisch strukturiert
      default: return 2;
    }
  };

  const recommendedLayoutId = getRecommendedLayout();

  const handleLayoutClick = (layoutId: number, layoutName: string) => {
    console.log('🟢 CVStep5 - Layout clicked:', layoutId, layoutName);
    console.log('🟢 CVStep5 - Before update, formData.layout:', formData.layout);
    
    updateFormData({ layout: layoutId });
    
    console.log('🟢 CVStep5 - After update called');
    
    // Check localStorage after a short delay
    setTimeout(() => {
      const savedData = localStorage.getItem('cvFormData');
      if (savedData) {
        const parsed = JSON.parse(savedData);
        console.log('🟢 CVStep5 - localStorage after update:', parsed.layout);
      }
    }, 100);
  };

  return (
    <div className="space-y-6">
      {/* Motivation & Persönlichkeit */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">💬 Motivation & Persönlichkeit</h3>
            <Button
              onClick={generateAboutMeWithAI}
              disabled={generatingAboutMe || !canGenerateAboutMe()}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              {generatingAboutMe ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generiere...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Mit KI generieren
                </>
              )}
            </Button>
          </div>
          {!canGenerateAboutMe() && (
            <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded">
              ⚠️ Bitte wähle zuerst mindestens eine Fähigkeit und eine Sprache aus (Step 3), um den Text generieren zu können.
            </p>
          )}
          <p className="text-sm text-muted-foreground">
            Beschreibe dich selbst, deine Motivation und deine Persönlichkeit. Du kannst den Text selbst schreiben oder mit KI generieren lassen.
          </p>
          <Textarea
            value={formData.ueberMich || ''}
            onChange={(e) => updateFormData({ ueberMich: e.target.value })}
            placeholder="Ich bin... Besonders interessiere ich mich für... Meine Stärken sind..."
            rows={6}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground">
            💡 Tipp: Dieser Text erscheint in deinem Lebenslauf und gibt Arbeitgebern einen persönlichen Einblick.
          </p>
        </div>
      </Card>

      <div>
        <h2 className="text-xl font-semibold mb-2">Wählen Sie Ihr CV-Layout</h2>
        <p className="text-muted-foreground">
          Wählen Sie das Layout, das am besten zu Ihrer Branche und Ihrem Stil passt.
        </p>
        <p className="text-xs text-blue-600 mt-2">
          Aktuell gewählt: {formData.layout ? `Layout ${formData.layout}` : 'Keins'}
        </p>
      </div>

      <div className="grid gap-4">
        {layouts.map((layout) => (
          <Card
            key={layout.id}
            className={`cursor-pointer transition-all hover:shadow-md ${
              formData.layout === layout.id
                ? 'ring-2 ring-primary border-primary'
                : 'hover:border-primary/50'
            } ${layout.color}`}
            onClick={() => handleLayoutClick(layout.id, layout.name)}
          >
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="text-4xl">{layout.preview}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">{layout.name}</h3>
                    {layout.id === recommendedLayoutId && (
                      <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                        Empfohlen
                      </span>
                    )}
                    {formData.layout === layout.id && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                        Ausgewählt
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{layout.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {formData.layout && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <p className="text-sm text-green-800">
              ✓ Layout "{layouts.find(l => l.id === formData.layout)?.name}" ausgewählt (ID: {formData.layout})
            </p>
          </CardContent>
        </Card>
      )}

      {recommendedLayoutId && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <p className="text-sm text-blue-800">
              💡 <strong>Tipp:</strong> Das Layout "{layouts.find(l => l.id === recommendedLayoutId)?.name}"
              ist besonders gut für den Bereich {formData.branche === 'handwerk' ? 'Handwerk' :
              formData.branche === 'it' ? 'IT' :
              formData.branche === 'gesundheit' ? 'Gesundheitswesen' :
              formData.branche === 'buero' ? 'Büro & Verwaltung' :
              formData.branche === 'verkauf' ? 'Verkauf & Handel' :
              formData.branche === 'gastronomie' ? 'Gastronomie' :
              formData.branche === 'bau' ? 'Bau & Architektur' : ''} geeignet.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CVStep5;
