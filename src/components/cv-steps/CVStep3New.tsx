import React, { useState } from 'react';
import { useCVForm } from '@/contexts/CVFormContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { SkillSelector } from '@/components/shared/SkillSelector';
import { Plus, Trash2, Sparkles, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SprachEntry } from '@/contexts/CVFormContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { COMMON_LANGUAGES } from '@/data/commonLanguages';

// Ensure COMMON_LANGUAGES is always an array
const LANGUAGES_LIST = Array.isArray(COMMON_LANGUAGES) ? COMMON_LANGUAGES : [];

const CVStep3New = () => {
  const { formData, updateFormData } = useCVForm();
  const { toast } = useToast();
  const [generatingSkills, setGeneratingSkills] = useState(false);
  const [generatingSummary, setGeneratingSummary] = useState(false);

  const sprachNiveaus = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'Muttersprache'];

  // Get available languages (filter out already selected ones, but keep current selection visible)
  const getAvailableLanguages = (currentIndex?: number): string[] => {
    const selectedLanguages = (formData.sprachen || [])
      .map((s, idx) => idx !== currentIndex ? s.sprache : null) // Exclude current selection from filter
      .filter((lang): lang is string => Boolean(lang)); // Filter out null/undefined/empty
    
    return LANGUAGES_LIST.filter(lang => !selectedLanguages.includes(lang));
  };

  // Sprachen
  const addSprache = () => {
    const sprachen = formData.sprachen || [];
    const availableLanguages = getAvailableLanguages();
    
    // Ensure availableLanguages is an array
    if (!Array.isArray(availableLanguages)) {
      console.error('availableLanguages is not an array in addSprache');
      return;
    }
    
    // Add with first available language or empty
    updateFormData({ 
      sprachen: [...sprachen, { 
        sprache: availableLanguages[0] || '', 
        niveau: 'B1' 
      }] 
    });
  };

  const updateSprache = (index: number, field: keyof SprachEntry, value: string) => {
    const sprachen = formData.sprachen || [];
    const updated = [...sprachen];
    
    // Check for duplicates when updating language name
    if (field === 'sprache') {
      const isDuplicate = sprachen.some((s, i) => i !== index && s.sprache === value);
      if (isDuplicate) {
        toast({
          title: "Duplikat",
          description: "Diese Sprache wurde bereits hinzugefügt",
          variant: "destructive"
        });
        return;
      }
    }
    
    updated[index] = { ...updated[index], [field]: value };
    updateFormData({ sprachen: updated });
  };

  const removeSprache = (index: number) => {
    const sprachen = formData.sprachen || [];
    updateFormData({ sprachen: sprachen.filter((_, i) => i !== index) });
  };

  // Qualifikationen
  const addQualifikation = () => {
    const qualifikationen = formData.qualifikationen || [];
    updateFormData({ qualifikationen: [...qualifikationen, ''] });
  };

  const updateQualifikation = (index: number, value: string) => {
    const qualifikationen = formData.qualifikationen || [];
    const updated = [...qualifikationen];
    updated[index] = value;
    updateFormData({ qualifikationen: updated });
  };

  const removeQualifikation = (index: number) => {
    const qualifikationen = formData.qualifikationen || [];
    updateFormData({ qualifikationen: qualifikationen.filter((_, i) => i !== index) });
  };

  // Zertifikate
  const addZertifikat = () => {
    const zertifikate = formData.zertifikate || [];
    updateFormData({ zertifikate: [...zertifikate, ''] });
  };

  const updateZertifikat = (index: number, value: string) => {
    const zertifikate = formData.zertifikate || [];
    const updated = [...zertifikate];
    updated[index] = value;
    updateFormData({ zertifikate: updated });
  };

  const removeZertifikat = (index: number) => {
    const zertifikate = formData.zertifikate || [];
    updateFormData({ zertifikate: zertifikate.filter((_, i) => i !== index) });
  };

  // Weiterbildung
  const addWeiterbildung = () => {
    const weiterbildung = formData.weiterbildung || [];
    updateFormData({ 
      weiterbildung: [...weiterbildung, { 
        titel: '', 
        anbieter: '', 
        ort: '', 
        zeitraum_von: '', 
        zeitraum_bis: '', 
        beschreibung: '' 
      }] 
    });
  };

  const updateWeiterbildungEntry = (index: number, field: string, value: string) => {
    const weiterbildung = formData.weiterbildung || [];
    const updated = [...weiterbildung];
    updated[index] = { ...updated[index], [field]: value };
    updateFormData({ weiterbildung: updated });
  };

  const removeWeiterbildung = (index: number) => {
    const weiterbildung = formData.weiterbildung || [];
    updateFormData({ weiterbildung: weiterbildung.filter((_, i) => i !== index) });
  };

  // Interessen
  const addInteresse = () => {
    const interessen = formData.interessen || [];
    updateFormData({ interessen: [...interessen, ''] });
  };

  const updateInteresse = (index: number, value: string) => {
    const interessen = formData.interessen || [];
    const updated = [...interessen];
    updated[index] = value;
    updateFormData({ interessen: updated });
  };

  const removeInteresse = (index: number) => {
    const interessen = formData.interessen || [];
    updateFormData({ interessen: interessen.filter((_, i) => i !== index) });
  };

  // AI Skill Suggestions
  const handleGenerateSkills = async () => {
    setGeneratingSkills(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-suggest-skills', {
        body: { 
          branche: formData.branche,
          status: formData.status,
          existingSkills: formData.faehigkeiten || [],
          schulbildung: formData.schulbildung,
          berufserfahrung: formData.berufserfahrung
        }
      });

      if (error) throw error;

      if (data.success && data.skills) {
        const currentSkills = formData.faehigkeiten || [];
        const newSkills = data.skills.filter((skill: string) => !currentSkills.includes(skill));
        const combinedSkills = [...currentSkills, ...newSkills].slice(0, 10);
        
        updateFormData({ faehigkeiten: combinedSkills });
        
        toast({
          title: "Erfolgreich",
          description: `${newSkills.length} neue Skills vorgeschlagen!`
        });
      }
    } catch (error) {
      console.error('Error generating skills:', error);
      toast({
        title: "Fehler",
        description: "Fehler beim Generieren der Skills.",
        variant: "destructive"
      });
    } finally {
      setGeneratingSkills(false);
    }
  };

  // AI Summary Generator (for Motivation & Persönlichkeit)
  const canGenerateSummary = () => {
    return (formData.faehigkeiten?.length || 0) > 0 && (formData.sprachen?.length || 0) > 0;
  };

  const handleGenerateSummary = async () => {
    if (!canGenerateSummary()) {
      toast({
        title: "Fehler",
        description: "Bitte wähle mindestens eine Fähigkeit und eine Sprache aus.",
        variant: "destructive"
      });
      return;
    }

    setGeneratingSummary(true);
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
      console.error('Error generating summary:', error);
      toast({
        title: "Fehler",
        description: error.message || "Der Text konnte nicht generiert werden. Bitte versuche es erneut.",
        variant: "destructive"
      });
    } finally {
      setGeneratingSummary(false);
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Kenntnisse, Skills & Motivation</h2>
        <p className="text-muted-foreground mb-6">
          Zeige deine Stärken, Fähigkeiten und was dich motiviert.
        </p>
      </div>

      {/* Skills Section */}
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-lg">Fähigkeiten & Skills</h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleGenerateSkills}
            disabled={generatingSkills || !formData.branche}
          >
            {generatingSkills ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            AI Vorschläge
          </Button>
        </div>
        
        <SkillSelector
          selectedSkills={formData.faehigkeiten || []}
          onSkillsChange={(skills) => updateFormData({ faehigkeiten: skills })}
          branch={formData.branche}
          statusLevel={formData.status}
          maxSkills={10}
          label="Deine wichtigsten Fähigkeiten"
          placeholder="Fähigkeit auswählen..."
        />
      </Card>

      {/* Sprachen */}
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-lg">Sprachen</h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addSprache}
          >
            <Plus className="h-4 w-4 mr-2" />
            Sprache hinzufügen
          </Button>
        </div>

        <div className="space-y-3">
          {formData.sprachen?.map((sprache, index) => {
            // Get all languages, but mark selected ones as disabled
            const selectedLanguages = (formData.sprachen || [])
              .map((s, idx) => idx !== index ? s.sprache : null)
              .filter((lang): lang is string => Boolean(lang));
            
            return (
              <div key={index} className="flex gap-2 items-start">
                <Select
                  value={sprache.sprache || ''}
                  onValueChange={(value) => updateSprache(index, 'sprache', value)}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Sprache auswählen..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {LANGUAGES_LIST.map((language) => {
                      const isSelected = selectedLanguages.includes(language);
                      const isCurrent = sprache.sprache === language;
                      
                      return (
                        <SelectItem
                          key={language}
                          value={language}
                          disabled={isSelected && !isCurrent}
                          className={isSelected && !isCurrent ? 'opacity-50 cursor-not-allowed' : ''}
                        >
                          {language}
                          {isCurrent && ' ✓'}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                <Select
                  value={sprache.niveau}
                  onValueChange={(value) => updateSprache(index, 'niveau', value)}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sprachNiveaus.map(niveau => (
                      <SelectItem key={niveau} value={niveau}>{niveau}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeSprache(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            );
          })}
        </div>
      </Card>


      {/* Qualifikationen (Optional) */}
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-lg">Qualifikationen (Optional)</h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addQualifikation}
          >
            <Plus className="h-4 w-4 mr-2" />
            Hinzufügen
          </Button>
        </div>

        <div className="space-y-2">
          {formData.qualifikationen?.map((qual, index) => (
            <div key={index} className="flex gap-2">
              <Input
                placeholder="z.B. Erste-Hilfe-Kurs"
                value={qual}
                onChange={(e) => updateQualifikation(index, e.target.value)}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeQualifikation(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </Card>

      {/* Zertifikate (Optional) */}
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-lg">Zertifikate (Optional)</h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addZertifikat}
          >
            <Plus className="h-4 w-4 mr-2" />
            Hinzufügen
          </Button>
        </div>

        <div className="space-y-2">
          {formData.zertifikate?.map((zert, index) => (
            <div key={index} className="flex gap-2">
              <Input
                placeholder="z.B. Microsoft Office Specialist"
                value={zert}
                onChange={(e) => updateZertifikat(index, e.target.value)}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeZertifikat(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </Card>

      {/* Interessen (Optional) */}
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-lg">Interessen & Hobbys (Optional)</h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addInteresse}
          >
            <Plus className="h-4 w-4 mr-2" />
            Hinzufügen
          </Button>
        </div>

        <div className="space-y-2">
          {formData.interessen?.map((interesse, index) => (
            <div key={index} className="flex gap-2">
              <Input
                placeholder="z.B. Fußball, Fotografie, Programmieren"
                value={interesse}
                onChange={(e) => updateInteresse(index, e.target.value)}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeInteresse(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </Card>

      {/* Motivation & Persönlichkeit */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">💬 Motivation & Persönlichkeit</h3>
            <Button
              onClick={handleGenerateSummary}
              disabled={generatingSummary || !canGenerateSummary()}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              {generatingSummary ? (
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
          {!canGenerateSummary() && (
            <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded">
              ⚠️ Bitte wähle zuerst mindestens eine Fähigkeit und eine Sprache aus, um den Text generieren zu können.
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
    </div>
  );
};

export default CVStep3New;
