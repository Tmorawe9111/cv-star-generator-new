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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
    <div className="h-full min-h-0 overflow-hidden">
      <Tabs defaultValue="skills" className="h-full min-h-0 flex flex-col overflow-hidden">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="skills" className="text-xs md:text-sm">Skills</TabsTrigger>
          <TabsTrigger value="languages" className="text-xs md:text-sm">Sprachen</TabsTrigger>
          <TabsTrigger value="about" className="text-xs md:text-sm">Text</TabsTrigger>
          <TabsTrigger value="extras" className="text-xs md:text-sm">Extras</TabsTrigger>
        </TabsList>

        <div className="flex-1 min-h-0 overflow-hidden">
          {/* Skills */}
          <TabsContent value="skills" className="mt-3 h-full">
            <Card className="h-full p-3 md:p-4 flex flex-col min-h-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-semibold text-base leading-tight">Fähigkeiten</h3>
                  <p className="text-xs text-muted-foreground">
                    Wähle bis zu 10 Skills, die dich am besten beschreiben.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateSkills}
                  disabled={generatingSkills || !formData.branche}
                  className="shrink-0"
                >
                  {generatingSkills ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4 mr-2" />
                  )}
                  AI
                </Button>
              </div>

              <div className="mt-3 flex-1 min-h-0">
                <SkillSelector
                  selectedSkills={formData.faehigkeiten || []}
                  onSkillsChange={(skills) => updateFormData({ faehigkeiten: skills })}
                  branch={formData.branche}
                  statusLevel={formData.status}
                  maxSkills={10}
                  label="Deine wichtigsten Fähigkeiten"
                  placeholder="Fähigkeit auswählen..."
                />
              </div>
            </Card>
          </TabsContent>

          {/* Sprachen */}
          <TabsContent value="languages" className="mt-3 h-full">
            <Card className="h-full p-3 md:p-4 flex flex-col min-h-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-semibold text-base leading-tight">Sprachen</h3>
                  <p className="text-xs text-muted-foreground">Füge deine Sprachen und Niveaus hinzu.</p>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={addSprache} className="shrink-0">
                  <Plus className="h-4 w-4 mr-2" />
                  Hinzufügen
                </Button>
              </div>

              <div className="mt-3 flex-1 min-h-0 overflow-hidden">
                {(formData.sprachen?.length || 0) === 0 ? (
                  <div className="h-full grid place-items-center text-sm text-muted-foreground">
                    Noch keine Sprache hinzugefügt.
                  </div>
                ) : (
                  <div className="h-full min-h-0 overflow-y-auto space-y-2 pr-1">
                    {formData.sprachen?.map((sprache, index) => {
                      const selectedLanguages = (formData.sprachen || [])
                        .map((s, idx) => (idx !== index ? s.sprache : null))
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
                            <SelectTrigger className="w-28 md:w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {sprachNiveaus.map((niveau) => (
                                <SelectItem key={niveau} value={niveau}>
                                  {niveau}
                                </SelectItem>
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
                )}
              </div>
            </Card>
          </TabsContent>

          {/* Motivation & Persönlichkeit */}
          <TabsContent value="about" className="mt-3 h-full">
            <Card className="h-full p-3 md:p-4 flex flex-col min-h-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-semibold text-base leading-tight">Motivation & Persönlichkeit</h3>
                  <p className="text-xs text-muted-foreground">
                    Kurzer Text für deinen Lebenslauf (optional, aber empfohlen).
                  </p>
                </div>
                <Button
                  onClick={handleGenerateSummary}
                  disabled={generatingSummary || !canGenerateSummary()}
                  variant="outline"
                  size="sm"
                  className="gap-2 shrink-0"
                >
                  {generatingSummary ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      ...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      KI
                    </>
                  )}
                </Button>
              </div>

              {!canGenerateSummary() && (
                <div className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
                  Bitte wähle zuerst mindestens eine Fähigkeit und eine Sprache aus, um den Text generieren zu können.
                </div>
              )}

              <Textarea
                value={formData.ueberMich || ''}
                onChange={(e) => updateFormData({ ueberMich: e.target.value })}
                placeholder="Ich bin... Besonders interessiere ich mich für... Meine Stärken sind..."
                className="mt-3 flex-1 min-h-[140px] resize-none"
              />

              <p className="mt-2 text-[11px] text-muted-foreground">
                Tipp: Der Text ist kurz, persönlich und konkret (2–4 Sätze).
              </p>
            </Card>
          </TabsContent>

          {/* Extras */}
          <TabsContent value="extras" className="mt-3 h-full">
            <Card className="h-full p-3 md:p-4 flex flex-col min-h-0">
              <div className="min-w-0">
                <h3 className="font-semibold text-base leading-tight">Extras (optional)</h3>
                <p className="text-xs text-muted-foreground">
                  Ergänze Qualifikationen, Zertifikate oder Interessen.
                </p>
              </div>

              <Tabs defaultValue="qual" className="mt-3 flex-1 min-h-0 flex flex-col overflow-hidden">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="qual" className="text-xs md:text-sm">Qualis</TabsTrigger>
                  <TabsTrigger value="certs" className="text-xs md:text-sm">Zertis</TabsTrigger>
                  <TabsTrigger value="hobbies" className="text-xs md:text-sm">Hobbys</TabsTrigger>
                </TabsList>

                <div className="mt-3 flex-1 min-h-0 overflow-hidden">
                  <TabsContent value="qual" className="mt-0 h-full">
                    <div className="h-full flex flex-col min-h-0">
                      <div className="flex items-center justify-between gap-2">
                        <Label className="text-xs text-muted-foreground">Qualifikationen</Label>
                        <Button type="button" variant="outline" size="sm" onClick={addQualifikation}>
                          <Plus className="h-4 w-4 mr-2" />
                          Hinzufügen
                        </Button>
                      </div>
                      <div className="mt-2 flex-1 min-h-0 overflow-y-auto space-y-2 pr-1">
                        {(formData.qualifikationen?.length || 0) === 0 ? (
                          <div className="grid place-items-center h-full text-sm text-muted-foreground">
                            Noch keine Qualifikation hinzugefügt.
                          </div>
                        ) : (
                          formData.qualifikationen?.map((qual, index) => (
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
                          ))
                        )}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="certs" className="mt-0 h-full">
                    <div className="h-full flex flex-col min-h-0">
                      <div className="flex items-center justify-between gap-2">
                        <Label className="text-xs text-muted-foreground">Zertifikate</Label>
                        <Button type="button" variant="outline" size="sm" onClick={addZertifikat}>
                          <Plus className="h-4 w-4 mr-2" />
                          Hinzufügen
                        </Button>
                      </div>
                      <div className="mt-2 flex-1 min-h-0 overflow-y-auto space-y-2 pr-1">
                        {(formData.zertifikate?.length || 0) === 0 ? (
                          <div className="grid place-items-center h-full text-sm text-muted-foreground">
                            Noch kein Zertifikat hinzugefügt.
                          </div>
                        ) : (
                          formData.zertifikate?.map((zert, index) => (
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
                          ))
                        )}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="hobbies" className="mt-0 h-full">
                    <div className="h-full flex flex-col min-h-0">
                      <div className="flex items-center justify-between gap-2">
                        <Label className="text-xs text-muted-foreground">Interessen & Hobbys</Label>
                        <Button type="button" variant="outline" size="sm" onClick={addInteresse}>
                          <Plus className="h-4 w-4 mr-2" />
                          Hinzufügen
                        </Button>
                      </div>
                      <div className="mt-2 flex-1 min-h-0 overflow-y-auto space-y-2 pr-1">
                        {(formData.interessen?.length || 0) === 0 ? (
                          <div className="grid place-items-center h-full text-sm text-muted-foreground">
                            Noch kein Interesse hinzugefügt.
                          </div>
                        ) : (
                          formData.interessen?.map((interesse, index) => (
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
                          ))
                        )}
                      </div>
                    </div>
                  </TabsContent>
                </div>
              </Tabs>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default CVStep3New;
