import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit3, Plus, X, Check } from 'lucide-react';
import { LanguageSelector } from '@/components/shared/LanguageSelector';
import { SkillSelector } from '@/components/shared/SkillSelector';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface SkillsLanguagesSidebarProps {
  profile: any;
  isEditing: boolean;
  onProfileUpdate: (updates: any) => void;
  readOnly?: boolean;
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
  'Türkisch', 'Russisch', 'Polnisch', 'Arabisch', 'Chinesisch'
];

export const SkillsLanguagesSidebar: React.FC<SkillsLanguagesSidebarProps> = ({
  profile,
  isEditing,
  onProfileUpdate,
  readOnly = false,
  onEditingChange
}) => {
  const [editingSkills, setEditingSkills] = useState(false);
  const [editingLanguages, setEditingLanguages] = useState(false);
  const [newSkill, setNewSkill] = useState('');
  const [newLanguage, setNewLanguage] = useState('');
  const [newLanguageLevel, setNewLanguageLevel] = useState('Gute Kenntnisse');
  const [tempSkills, setTempSkills] = useState<string[]>([]);
  const [tempLanguages, setTempLanguages] = useState<any[]>([]);

  // Skills handlers
  const startEditingSkills = () => {
    setTempSkills(profile?.faehigkeiten || []);
    setEditingSkills(true);
  };

  const cancelEditingSkills = () => {
    setEditingSkills(false);
    setNewSkill('');
  };

  const saveSkills = async () => {
    try {
      await onProfileUpdate({ faehigkeiten: tempSkills });
      setEditingSkills(false);
      setNewSkill('');
    } catch (error) {
      console.error('Error updating skills:', error);
    }
  };

  const addSkill = () => {
    if (newSkill.trim() && !tempSkills.includes(newSkill.trim())) {
      setTempSkills([...tempSkills, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setTempSkills(tempSkills.filter(s => s !== skillToRemove));
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
    try {
      await onProfileUpdate({ sprachen: tempLanguages });
      setEditingLanguages(false);
      setNewLanguage('');
    } catch (error) {
      console.error('Error updating languages:', error);
    }
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
    <div className="space-y-6">
      {/* Skills Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-lg font-semibold">Fähigkeiten</CardTitle>
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
        <CardContent>
          {editingSkills ? (
            <div className="space-y-3">
              {/* Current skills with remove option */}
              <div className="flex flex-wrap gap-2">
                {tempSkills.map((skill, index) => (
                  <Badge key={index} variant="secondary" className="pr-1 flex items-center gap-1">
                    {skill}
                    <button 
                      onClick={() => removeSkill(skill)}
                      className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              
              {/* Add new skill */}
              <div className="flex gap-2">
                <Input
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  placeholder="Neue Fähigkeit..."
                  className="flex-1"
                  onKeyDown={(e) => e.key === 'Enter' && addSkill()}
                />
                <Button size="sm" variant="outline" onClick={addSkill}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Save/Cancel buttons */}
              <div className="flex gap-2 pt-2">
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
            <div className="flex flex-wrap gap-2">
              {profile?.faehigkeiten && profile.faehigkeiten.length > 0 ? (
                profile.faehigkeiten.map((skill: string, index: number) => (
                  <Badge key={index} variant="secondary">
                    {skill}
                  </Badge>
                ))
              ) : (
                <p className="text-muted-foreground text-sm">Keine Fähigkeiten hinzugefügt</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Languages Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-lg font-semibold">Sprachen</CardTitle>
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
        <CardContent className="overflow-hidden">
          {editingLanguages ? (
            <div className="space-y-3">
              {/* Current languages with remove option */}
              <div className="space-y-2">
                {tempLanguages.map((lang, index) => (
                  <div key={index} className="flex items-center justify-between gap-2 p-2 bg-muted/50 rounded-md">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{lang.sprache}</span>
                      <Badge variant="secondary" className="text-xs">{lang.niveau}</Badge>
                    </div>
                    <button 
                      onClick={() => removeLanguage(lang.sprache)}
                      className="hover:bg-destructive/20 rounded-full p-1"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
              
              {/* Add new language */}
              <div className="space-y-2 pt-2 border-t">
                <p className="text-sm font-medium">Sprache hinzufügen</p>
                <div className="flex gap-2">
                  <Select value={newLanguage} onValueChange={setNewLanguage}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Sprache wählen..." />
                    </SelectTrigger>
                    <SelectContent>
                      {COMMON_LANGUAGES.filter(l => !tempLanguages.find(tl => tl.sprache === l)).map(lang => (
                        <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={newLanguageLevel} onValueChange={setNewLanguageLevel}>
                    <SelectTrigger className="w-[160px]">
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
            <div className="space-y-2">
              {profile?.sprachen && profile.sprachen.length > 0 ? (
                profile.sprachen.map((lang: any, index: number) => (
                  <div key={index} className="flex flex-wrap justify-between items-center gap-2">
                    <span className="font-medium">{lang.sprache}</span>
                    <Badge variant="secondary">{lang.niveau}</Badge>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-sm">Keine Sprachen hinzugefügt</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};