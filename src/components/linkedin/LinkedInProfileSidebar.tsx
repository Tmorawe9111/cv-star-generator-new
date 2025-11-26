import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CVPreviewCard } from '@/components/CVPreviewCard';
import { WeitereDokumenteSection } from '@/components/linkedin/right-rail/WeitereDokumenteSection';
import WeitereDokumenteWidget from '@/components/profile/WeitereDokumenteWidget';
import { AvailabilityCard } from '@/components/linkedin/right-rail/AvailabilityCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Award, Languages, Edit3, Plus, X, Check } from 'lucide-react';
import { SkillSelector } from '@/components/shared/SkillSelector';

interface LinkedInProfileSidebarProps {
  profile: any;
  isEditing?: boolean;
  onProfileUpdate?: (updates: any) => void;
  readOnly?: boolean;
  showLanguagesAndSkills?: boolean;
  showLicenseAndStats?: boolean;
  showCVSection?: boolean;
  onEditingChange?: (isEditing: boolean) => void;
}

const LANGUAGE_LEVELS = [
  'Grundkenntnisse',
  'Gute Kenntnisse', 
  'Fließend',
  'Verhandlungssicher',
  'Muttersprache'
];

const COMMON_LANGUAGES = [
  'Deutsch', 'Englisch', 'Französisch', 'Spanisch', 'Italienisch',
  'Türkisch', 'Russisch', 'Polnisch', 'Arabisch', 'Chinesisch',
  'Portugiesisch', 'Niederländisch', 'Griechisch', 'Japanisch', 'Koreanisch'
];

export function LinkedInProfileSidebar({
  profile,
  isEditing,
  onProfileUpdate,
  readOnly = false,
  showLanguagesAndSkills = true,
  showLicenseAndStats = true,
  showCVSection = true,
  onEditingChange
}: LinkedInProfileSidebarProps) {
  const [isDocumentWidgetOpen, setIsDocumentWidgetOpen] = useState(false);
  const [documentUpdateTrigger, setDocumentUpdateTrigger] = useState(0);
  
  // Skills editing state
  const [editingSkills, setEditingSkills] = useState(false);
  const [tempSkills, setTempSkills] = useState<string[]>([]);
  
  // Languages editing state
  const [editingLanguages, setEditingLanguages] = useState(false);
  const [tempLanguages, setTempLanguages] = useState<any[]>([]);
  const [newLanguage, setNewLanguage] = useState('');
  const [newLanguageLevel, setNewLanguageLevel] = useState('Gute Kenntnisse');

  const handleDocumentUploaded = () => {
    setDocumentUpdateTrigger(prev => prev + 1);
  };

  // Skills handlers
  const startEditingSkills = () => {
    setTempSkills(profile?.faehigkeiten || []);
    setEditingSkills(true);
  };

  const cancelEditingSkills = () => {
    setEditingSkills(false);
  };

  const saveSkills = async () => {
    if (onProfileUpdate) {
      await onProfileUpdate({ faehigkeiten: tempSkills });
    }
    setEditingSkills(false);
  };

  const handleSkillsChange = (skills: string[]) => {
    setTempSkills(skills);
  };

  // Languages handlers
  const startEditingLanguages = () => {
    setTempLanguages(profile?.sprachen || []);
    setEditingLanguages(true);
  };

  const cancelEditingLanguages = () => {
    setEditingLanguages(false);
    setNewLanguage('');
  };

  const saveLanguages = async () => {
    if (onProfileUpdate) {
      await onProfileUpdate({ sprachen: tempLanguages });
    }
    setEditingLanguages(false);
    setNewLanguage('');
  };

  const addLanguage = () => {
    if (newLanguage.trim() && !tempLanguages.find(l => l.sprache === newLanguage.trim())) {
      setTempLanguages([...tempLanguages, { sprache: newLanguage.trim(), niveau: newLanguageLevel }]);
      setNewLanguage('');
    }
  };

  const removeLanguage = (langToRemove: string) => {
    setTempLanguages(tempLanguages.filter(l => l.sprache !== langToRemove));
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* CV Download Section - First */}
      {showCVSection && profile && (
        <CVPreviewCard
          profile={profile}
          readOnly={readOnly}
          onDownload={() => {
            const params = new URLSearchParams({
              layout: String(profile.layout || 1),
              userId: profile.id
            });
            window.open(`/cv/print?${params.toString()}`, '_blank');
          }}
        />
      )}

      {/* Weitere Dokumente Section - Second (only for own profile) */}
      {!readOnly && (
        <WeitereDokumenteSection
          userId={profile?.id}
          readOnly={readOnly}
          openWidget={() => setIsDocumentWidgetOpen(true)}
          refreshTrigger={documentUpdateTrigger}
        />
      )}

      {/* Skills Section */}
      {showLanguagesAndSkills && (
        <Card>
          <CardHeader className="pb-2 sm:pb-3 px-4 pt-4 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Award className="h-4 w-4 sm:h-5 sm:w-5" />
              Fähigkeiten
            </CardTitle>
            {!readOnly && !editingSkills && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={startEditingSkills}
                className="h-8 w-8 p-0"
              >
                <Edit3 className="h-4 w-4" />
              </Button>
            )}
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {editingSkills ? (
              <div className="space-y-3">
                {/* Branch-based skill selector */}
                <SkillSelector
                  selectedSkills={tempSkills}
                  onSkillsChange={handleSkillsChange}
                  branch={profile?.branche}
                  statusLevel={profile?.status}
                  maxSkills={10}
                  label=""
                  placeholder="Fähigkeit auswählen..."
                />
                
                {/* Save/Cancel buttons */}
                <div className="flex gap-2 pt-2 border-t">
                  <Button size="sm" variant="outline" onClick={cancelEditingSkills}>
                    Abbrechen
                  </Button>
                  <Button size="sm" onClick={saveSkills}>
                    <Check className="h-4 w-4 mr-1" />
                    Speichern
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {profile?.faehigkeiten && Array.isArray(profile.faehigkeiten) && profile.faehigkeiten.length > 0 ? (
                  profile.faehigkeiten.map((skill: string, idx: number) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {typeof skill === 'string' ? skill : (skill as any)?.name || String(skill)}
                    </Badge>
                  ))
                ) : (
                  <p className="text-muted-foreground text-sm">Keine Fähigkeiten hinzugefügt</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Languages Section */}
      {showLanguagesAndSkills && (
        <Card>
          <CardHeader className="pb-2 sm:pb-3 px-4 pt-4 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Languages className="h-4 w-4 sm:h-5 sm:w-5" />
              Sprachen
            </CardTitle>
            {!readOnly && !editingLanguages && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={startEditingLanguages}
                className="h-8 w-8 p-0"
              >
                <Edit3 className="h-4 w-4" />
              </Button>
            )}
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {editingLanguages ? (
              <div className="space-y-3">
                {/* Current languages with remove option */}
                <div className="space-y-2">
                  {tempLanguages.map((lang, index) => (
                    <div key={index} className="flex items-center justify-between gap-2 p-2 bg-muted/50 rounded-md">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{lang.sprache}</span>
                        <Badge variant="secondary" className="text-xs">{lang.niveau}</Badge>
                      </div>
                      <button 
                        onClick={() => removeLanguage(lang.sprache)}
                        className="hover:bg-destructive/20 rounded-full p-1 flex-shrink-0"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
                
                {/* Add new language */}
                <div className="space-y-2 pt-2 border-t">
                  <p className="text-sm font-medium">Sprache hinzufügen</p>
                  <Select value={newLanguage} onValueChange={setNewLanguage}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Sprache wählen..." />
                    </SelectTrigger>
                    <SelectContent>
                      {COMMON_LANGUAGES.filter(l => !tempLanguages.find(tl => tl.sprache === l)).map(lang => (
                        <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex gap-2">
                    <Select value={newLanguageLevel} onValueChange={setNewLanguageLevel}>
                      <SelectTrigger className="flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {LANGUAGE_LEVELS.map(level => (
                          <SelectItem key={level} value={level}>{level}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button size="sm" variant="outline" onClick={addLanguage} disabled={!newLanguage}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                {/* Save/Cancel buttons */}
                <div className="flex gap-2 pt-2">
                  <Button size="sm" variant="outline" onClick={cancelEditingLanguages}>
                    Abbrechen
                  </Button>
                  <Button size="sm" onClick={saveLanguages}>
                    <Check className="h-4 w-4 mr-1" />
                    Speichern
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-1.5 sm:space-y-2">
                {profile?.sprachen && Array.isArray(profile.sprachen) && profile.sprachen.length > 0 ? (
                  profile.sprachen.map((lang: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center text-sm">
                      <span className="font-medium">{lang.sprache || lang}</span>
                      {lang.niveau && (
                        <Badge variant="outline" className="text-xs">{lang.niveau}</Badge>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-sm">Keine Sprachen hinzugefügt</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Availability Section - After Languages */}
      <AvailabilityCard 
        availableFrom={profile?.available_from} 
        visibilityMode={profile?.visibility_mode}
        jobSearchPreferences={profile?.job_search_preferences}
        profileStatus={profile?.status}
        profileId={profile?.id}
        readOnly={readOnly}
        onUpdate={onProfileUpdate}
      />

      {/* Weitere Dokumente Widget Modal */}
      <WeitereDokumenteWidget
        isOpen={isDocumentWidgetOpen}
        onClose={() => setIsDocumentWidgetOpen(false)}
        userId={profile?.id}
        onDocumentUploaded={handleDocumentUploaded}
      />
    </div>
  );
}

export default LinkedInProfileSidebar;
