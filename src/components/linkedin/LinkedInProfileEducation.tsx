import React, { useState, useMemo } from 'react';
import { GraduationCap, Plus, Edit3, Trash2, MapPin, Calendar, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { capitalizeFirst, capitalizeWords, capitalizeSentences } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { SchoolAutocomplete } from '@/components/shared/SchoolAutocomplete';

interface Education {
  schulform: string;
  name: string;
  ort: string;
  plz?: string;
  zeitraum_von: string;
  zeitraum_bis: string;
  beschreibung?: string;
  linked_school_id?: string | null;
  abschlussjahr?: string;
}

type EducationFormProps = {
  formData: Education;
  setFormData: React.Dispatch<React.SetStateAction<Education>>;
  years: string[];
  currentYear: number;
};

const EducationForm: React.FC<EducationFormProps> = React.memo(({ formData, setFormData, years, currentYear }) => {
  return (
    <div className="space-y-4 w-full max-w-full overflow-hidden">
      <div className="grid grid-cols-1 gap-4">
        <div>
          <Label htmlFor="schulform">Schulform/Abschluss</Label>
          <Select
            value={formData.schulform}
            onValueChange={(v) => setFormData({ ...formData, schulform: v })}
          >
            <SelectTrigger className="text-sm w-full">
              <SelectValue placeholder="z.B. Abitur, Realschulabschluss" />
            </SelectTrigger>
            <SelectContent className="z-[70] bg-background">
              <SelectItem value="Abitur">Abitur</SelectItem>
              <SelectItem value="Fachabitur">Fachabitur</SelectItem>
              <SelectItem value="Realschulabschluss">Realschulabschluss</SelectItem>
              <SelectItem value="Hauptschulabschluss">Hauptschulabschluss</SelectItem>
              <SelectItem value="Ausbildung">Ausbildung</SelectItem>
              <SelectItem value="Berufsschule">Berufsschule</SelectItem>
              <SelectItem value="Bachelor">Bachelor</SelectItem>
              <SelectItem value="Master">Master</SelectItem>
              <SelectItem value="Sonstiges">Sonstiges</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="ort">Ort</Label>
          <Input
            id="ort"
            value={formData.ort}
            onChange={(e) => setFormData({ ...formData, ort: e.target.value })}
            placeholder="z.B. München"
            className="text-sm w-full"
          />
          <p className="text-xs text-muted-foreground mt-1">Zuerst Ort eingeben für bessere Vorschläge</p>
        </div>
        <div>
          <Label htmlFor="name">Institution</Label>
          <SchoolAutocomplete
            value={formData.name}
            onChange={(value) => setFormData({ ...formData, name: value })}
            onSchoolSelect={(school) => {
              if (school) {
                setFormData({ 
                  ...formData, 
                  name: school.name,
                  linked_school_id: school.id,
                  ort: school.city || formData.ort
                });
              } else {
                setFormData({ ...formData, linked_school_id: null });
              }
            }}
            location={formData.ort}
            placeholder="z.B. Max-Mustermann-Gymnasium"
            className="text-sm w-full"
          />
          {formData.linked_school_id && (
            <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
              <Check className="h-3 w-3" />
              Mit registrierter Schule verknüpft
            </p>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="sm:col-span-1">
          <Label htmlFor="abschlussjahr">Abschlussjahr</Label>
          <Input
            id="abschlussjahr"
            value={formData.abschlussjahr || ''}
            onChange={(e) => setFormData({ ...formData, abschlussjahr: e.target.value })}
            placeholder="z.B. 2024"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={4}
            className="text-sm w-full"
          />
        </div>
        <div>
          <Label htmlFor="plz">PLZ</Label>
          <Input
            id="plz"
            value={formData.plz}
            onChange={(e) => setFormData({ ...formData, plz: e.target.value })}
            placeholder="80331"
            inputMode="numeric"
            pattern="[0-9]*"
            className="text-sm w-full"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="zeitraum_von">Von (Jahr)</Label>
          <Select
            value={formData.zeitraum_von}
            onValueChange={(v) => setFormData({ ...formData, zeitraum_von: v })}
          >
            <SelectTrigger className="text-sm w-full">
              <SelectValue placeholder="z.B. 2020" />
            </SelectTrigger>
            <SelectContent className="z-[70] bg-background max-h-64">
              {years.map((y) => (
                <SelectItem key={y} value={y}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="zeitraum_bis">Bis (Jahr)</Label>
          <Select
            value={formData.zeitraum_bis}
            onValueChange={(v) => setFormData({ ...formData, zeitraum_bis: v })}
          >
            <SelectTrigger className="text-sm w-full">
              <SelectValue placeholder="Leer lassen für aktuell" />
            </SelectTrigger>
            <SelectContent className="z-[70] bg-background max-h-64">
              {years.map((y) => (
                <SelectItem key={y} value={y}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Switch
          id="edu-current"
          checked={!formData.zeitraum_bis}
          onCheckedChange={(checked) => setFormData({ ...formData, zeitraum_bis: checked ? '' : String(currentYear) })}
        />
        <Label htmlFor="edu-current">Aktuell (bis heute)</Label>
      </div>

      <div>
        <Label htmlFor="beschreibung">Beschreibung</Label>
        <Textarea
          id="beschreibung"
          value={formData.beschreibung}
          onChange={(e) => setFormData({ ...formData, beschreibung: e.target.value })}
          placeholder="Besondere Leistungen, Schwerpunkte, etc..."
          rows={3}
          className="text-sm w-full resize-none"
        />
      </div>
    </div>
  );
});

interface LinkedInProfileEducationProps {
  education: Education[];
  isEditing: boolean;
  onEducationUpdate: (education: Education[]) => void;
  onEditingChange?: (isEditing: boolean) => void;
}

export const LinkedInProfileEducation: React.FC<LinkedInProfileEducationProps> = ({
  education = [],
  isEditing,
  onEducationUpdate,
  onEditingChange
}) => {
  // Ensure education is always an array
  const safeEducation = Array.isArray(education) ? education : [];
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  
  const [formData, setFormData] = useState<Education>({
    schulform: '',
    name: '',
    ort: '',
    plz: '',
    zeitraum_von: '',
    zeitraum_bis: '',
    beschreibung: ''
  });
  

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 80 }, (_, i) => String(currentYear + 6 - i));

  const resetForm = () => {
    setFormData({
      schulform: '',
      name: '',
      ort: '',
      plz: '',
      zeitraum_von: '',
      zeitraum_bis: '',
      beschreibung: ''
    });
  };

  const handleSave = () => {
    const toSave: Education = {
      ...formData,
      name: capitalizeWords(formData.name),
      ort: capitalizeWords(formData.ort),
      beschreibung: formData.beschreibung ? capitalizeSentences(formData.beschreibung) : ''
    };
    if (editingIndex !== null) {
      // Edit existing
      const updated = [...education];
      updated[editingIndex] = toSave;
      onEducationUpdate(updated);
      setEditingIndex(null);
    } else {
      // Add new
      onEducationUpdate([...safeEducation, toSave]);
      setIsAddingNew(false);
    }
    resetForm();
  };

  const handleEdit = (index: number) => {
    // Don't allow opening another while one is open
    if (isAddingNew || editingIndex !== null) {
      return;
    }
    setFormData(safeEducation[index]);
    setEditingIndex(index);
  };

  const handleAddNew = () => {
    // Don't allow if already editing
    if (isAddingNew || editingIndex !== null) {
      return;
    }
    setIsAddingNew(true);
    resetForm();
  };

  const handleDelete = (index: number) => {
    const updated = safeEducation.filter((_, i) => i !== index);
    onEducationUpdate(updated);
  };

  const handleCancel = () => {
    setIsAddingNew(false);
    setEditingIndex(null);
    resetForm();
  };

  const formatDateRange = (from: string, to: string) => {
    if (!from) return '';
    const toDisplay = to || 'Heute';
    return `${from} - ${toDisplay}`;
  };

  const handleSaveWithValidation = () => {
    // Validate date range
    if (formData.zeitraum_von && formData.zeitraum_bis) {
      const fromYear = parseInt(formData.zeitraum_von);
      const toYear = parseInt(formData.zeitraum_bis);
      if (fromYear > toYear) {
        alert('Das Startjahr muss vor dem Endjahr liegen.');
        return;
      }
    }
    handleSave();
  };

  const handleSaveAndNewWithValidation = () => {
    // Validate date range
    if (formData.zeitraum_von && formData.zeitraum_bis) {
      const fromYear = parseInt(formData.zeitraum_von);
      const toYear = parseInt(formData.zeitraum_bis);
      if (fromYear > toYear) {
        alert('Das Startjahr muss vor dem Endjahr liegen.');
        return;
      }
    }
    const toSave: Education = {
      ...formData,
      name: capitalizeWords(formData.name),
      ort: capitalizeWords(formData.ort),
      beschreibung: formData.beschreibung ? capitalizeSentences(formData.beschreibung) : ''
    };
    onEducationUpdate([...education, toSave]);
    resetForm();
    setIsAddingNew(true);
    setEditingIndex(null);
  };
  const sortedEducation = useMemo(() => {
    return safeEducation
      .map((item, i) => ({ item, i }))
      .sort((a, b) => {
        const aEnd = parseInt(a.item.zeitraum_bis) || parseInt(a.item.zeitraum_von) || 0;
        const bEnd = parseInt(b.item.zeitraum_bis) || parseInt(b.item.zeitraum_von) || 0;
        if (bEnd !== aEnd) return bEnd - aEnd;
        return a.i - b.i; // tie-breaker to keep original order stable
      });
  }, [safeEducation]);

  return (
    <Card>
      <CardHeader className="p-4 sm:p-4 md:p-6 flex flex-row flex-wrap items-center justify-between gap-2 space-y-0 pb-2 sm:pb-3 md:pb-4">
        <CardTitle className="text-lg sm:text-lg md:text-xl font-semibold flex items-center gap-2">
          <GraduationCap className="h-4 w-4 sm:h-5 sm:w-5" />
          Ausbildung
        </CardTitle>
        <div className="flex items-center gap-2">
          {!isEditing && onEditingChange && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => onEditingChange(true)}
              className="h-8 w-8 p-0"
            >
              <Edit3 className="h-4 w-4" />
            </Button>
          )}
          {isEditing && !isAddingNew && editingIndex === null && (
            <Button variant="outline" size="sm" onClick={handleAddNew}>
              <Plus className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Hinzufügen</span>
              <span className="sm:hidden">+</span>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-4 md:p-6 pt-0">
        {isAddingNew && (
          <div className="mb-3 sm:mb-4 md:mb-6">
            <EducationForm formData={formData} setFormData={setFormData} years={years} currentYear={currentYear} />
          </div>
        )}
        {safeEducation.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <GraduationCap className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Noch keine Ausbildung hinzugefügt</p>
            {isEditing && (
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={handleAddNew}
              >
                <Plus className="h-4 w-4 mr-2" />
                Erste Ausbildung hinzufügen
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {sortedEducation.map(({ item: edu, i }, idx) => (
              <div key={i} className="relative group">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-accent/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <GraduationCap className="h-6 w-6 text-accent-foreground" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-lg">{edu.schulform}</h3>
                        <p className="text-primary font-medium">{edu.name}</p>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {edu.ort}{edu.plz && `, ${edu.plz}`}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDateRange(edu.zeitraum_von, edu.zeitraum_bis || 'present')}
                          </span>
                        </div>
                      </div>
                      {isEditing && editingIndex !== i && !isAddingNew && (
                        <div className="flex gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleEdit(i)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit3 className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDelete(i)}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                    
                    {edu.beschreibung && (
                      <p className="text-muted-foreground mt-3 leading-relaxed">
                        {edu.beschreibung}
                      </p>
                    )}
                    {editingIndex === i && (
                      <div className="mt-4">
                        <EducationForm formData={formData} setFormData={setFormData} years={years} currentYear={currentYear} />
                      </div>
                    )}
                  </div>
                </div>
                
                {idx < sortedEducation.length - 1 && (
                  <div className="mt-6 border-b border-border/50" />
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
      {isEditing && (isAddingNew || editingIndex !== null) && (
        <div className="fixed bottom-20 md:bottom-4 left-0 right-0 z-[100]">
          <div className="mx-auto max-w-screen-sm px-4">
            <div className="bg-background border rounded-lg shadow-lg p-3 flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={handleCancel}>Abbrechen</Button>
              <Button size="sm" onClick={handleSaveWithValidation}>Speichern</Button>
              {isAddingNew && (
                <Button size="sm" onClick={handleSaveAndNewWithValidation}>Speichern & neu</Button>
              )}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};