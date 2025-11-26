import React, { useState, useMemo } from 'react';
import { Building, Plus, Edit3, Trash2, MapPin, Calendar, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { capitalizeFirst, capitalizeWords, capitalizeSentences } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { CompanyAutocomplete } from '@/components/shared/CompanyAutocomplete';

interface Experience {
  titel: string;
  unternehmen: string;
  ort: string;
  zeitraum_von: string;
  zeitraum_bis: string;
  beschreibung?: string;
  linked_company_id?: string | null;
}

type ExperienceFormProps = {
  formData: Experience;
  setFormData: React.Dispatch<React.SetStateAction<Experience>>;
};

const ExperienceForm: React.FC<ExperienceFormProps> = React.memo(({ formData, setFormData }) => {
  return (
    <div className="space-y-4 w-full max-w-full overflow-hidden">
      <div>
        <Label htmlFor="ort">Standort</Label>
        <Input
          id="ort"
          value={formData.ort}
          onChange={(e) => setFormData({ ...formData, ort: e.target.value })}
          placeholder="z.B. Berlin, Deutschland"
          className="text-sm w-full"
        />
        <p className="text-xs text-muted-foreground mt-1">Zuerst den Standort eingeben für bessere Firmenvorschläge</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div>
          <Label htmlFor="titel">Position</Label>
          <Input
            id="titel"
            value={formData.titel}
            onChange={(e) => setFormData({ ...formData, titel: e.target.value })}
            placeholder="z.B. Softwareentwickler"
            className="text-sm w-full"
          />
        </div>
        <div>
          <Label htmlFor="unternehmen">Unternehmen</Label>
          <CompanyAutocomplete
            value={formData.unternehmen}
            onChange={(value) => setFormData({ ...formData, unternehmen: value })}
            onCompanySelect={(company) => {
              if (company) {
                setFormData({ 
                  ...formData, 
                  unternehmen: company.name,
                  linked_company_id: company.id
                });
              } else {
                setFormData({ 
                  ...formData, 
                  linked_company_id: null
                });
              }
            }}
            location={formData.ort}
            placeholder="z.B. Tech AG"
            className="text-sm w-full"
          />
          {formData.linked_company_id && (
            <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
              <Check className="h-3 w-3" />
              Mit registriertem Unternehmen verknüpft
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="zeitraum_von">Von</Label>
          <Input
            id="zeitraum_von"
            type="month"
            value={formData.zeitraum_von}
            onChange={(e) => setFormData({ ...formData, zeitraum_von: e.target.value })}
            className="text-sm w-full"
          />
        </div>
        <div>
          <Label htmlFor="zeitraum_bis">Bis</Label>
          <Input
            id="zeitraum_bis"
            type="month"
            value={formData.zeitraum_bis}
            onChange={(e) => setFormData({ ...formData, zeitraum_bis: e.target.value })}
            placeholder="Leer lassen für aktuell"
            className="text-sm w-full"
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Switch
          id="exp-current"
          checked={!formData.zeitraum_bis}
          onCheckedChange={(checked) => setFormData({ ...formData, zeitraum_bis: checked ? '' : formData.zeitraum_bis || formData.zeitraum_von })}
        />
        <Label htmlFor="exp-current">Aktuell (bis heute)</Label>
      </div>

      <div>
        <Label htmlFor="beschreibung">Beschreibung</Label>
        <Textarea
          id="beschreibung"
          value={formData.beschreibung}
          onChange={(e) => setFormData({ ...formData, beschreibung: e.target.value })}
          placeholder="Beschreiben Sie Ihre Tätigkeiten und Erfolge..."
          rows={3}
          className="text-sm w-full resize-none"
        />
      </div>
    </div>
  );
});

interface LinkedInProfileExperienceProps {
  experiences: Experience[];
  isEditing: boolean;
  onExperiencesUpdate: (experiences: Experience[]) => void;
  onEditingChange?: (isEditing: boolean) => void;
}

export const LinkedInProfileExperience: React.FC<LinkedInProfileExperienceProps> = ({
  experiences = [],
  isEditing,
  onExperiencesUpdate,
  onEditingChange
}) => {
  // Ensure experiences is always an array
  const safeExperiences = Array.isArray(experiences) ? experiences : [];
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  
  const [formData, setFormData] = useState<Experience>({
    titel: '',
    unternehmen: '',
    ort: '',
    zeitraum_von: '',
    zeitraum_bis: '',
    beschreibung: ''
  });

  const resetForm = () => {
    setFormData({
      titel: '',
      unternehmen: '',
      ort: '',
      zeitraum_von: '',
      zeitraum_bis: '',
      beschreibung: ''
    });
  };

  const handleSave = () => {
    const toSave: Experience = {
      ...formData,
      titel: capitalizeWords(formData.titel),
      unternehmen: capitalizeWords(formData.unternehmen),
      ort: capitalizeWords(formData.ort),
      beschreibung: formData.beschreibung ? capitalizeSentences(formData.beschreibung) : ''
    };
    if (editingIndex !== null) {
      // Edit existing
      const updated = [...experiences];
      updated[editingIndex] = toSave;
      onExperiencesUpdate(updated);
      setEditingIndex(null);
    } else {
      // Add new
      onExperiencesUpdate([...safeExperiences, toSave]);
      setIsAddingNew(false);
    }
    resetForm();
  };

  const handleEdit = (index: number) => {
    // Close any open form first
    if (isAddingNew || editingIndex !== null) {
      return; // Don't allow opening another while one is open
    }
    setFormData(experiences[index]);
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
    const updated = safeExperiences.filter((_, i) => i !== index);
    onExperiencesUpdate(updated);
  };

  const handleCancel = () => {
    setIsAddingNew(false);
    setEditingIndex(null);
    resetForm();
  };

  const formatDateRange = (from: string, to: string) => {
    if (!from) return '';
    const fromDate = new Date(from);
    const toDate = to === 'present' || !to ? null : new Date(to);
    
    const fromMonth = fromDate.toLocaleDateString('de-DE', { month: 'short', year: 'numeric' });
    const toMonth = toDate ? toDate.toLocaleDateString('de-DE', { month: 'short', year: 'numeric' }) : 'Heute';
    
    return `${fromMonth} - ${toMonth}`;
  };

  const handleSaveWithValidation = () => {
    // Validate date range
    if (formData.zeitraum_von && formData.zeitraum_bis) {
      const fromDate = new Date(formData.zeitraum_von);
      const toDate = new Date(formData.zeitraum_bis);
      if (fromDate > toDate) {
        alert('Das Startdatum muss vor dem Enddatum liegen.');
        return;
      }
    }
    handleSave();
  };

  const handleSaveAndNewWithValidation = () => {
    // Validate date range
    if (formData.zeitraum_von && formData.zeitraum_bis) {
      const fromDate = new Date(formData.zeitraum_von);
      const toDate = new Date(formData.zeitraum_bis);
      if (fromDate > toDate) {
        alert('Das Startdatum muss vor dem Enddatum liegen.');
        return;
      }
    }
    const toSave: Experience = {
      ...formData,
      titel: capitalizeWords(formData.titel),
      unternehmen: capitalizeWords(formData.unternehmen),
      ort: capitalizeWords(formData.ort),
      beschreibung: formData.beschreibung ? capitalizeSentences(formData.beschreibung) : ''
    };
    onExperiencesUpdate([...experiences, toSave]);
    resetForm();
    setIsAddingNew(true);
    setEditingIndex(null);
  };
  const sortedExperiences = useMemo(() => {
    return safeExperiences
      .map((item, i) => ({ item, i }))
      .sort((a, b) => {
        const aEnd = a.item.zeitraum_bis ? new Date(a.item.zeitraum_bis) : new Date(a.item.zeitraum_von);
        const bEnd = b.item.zeitraum_bis ? new Date(b.item.zeitraum_bis) : new Date(b.item.zeitraum_von);
        if (bEnd.getTime() !== aEnd.getTime()) return bEnd.getTime() - aEnd.getTime();
        return a.i - b.i; // stable tie-breaker
      });
  }, [safeExperiences]);

  // Inline form component moved above for stable identity

  return (
    <Card>
      <CardHeader className="p-4 sm:p-4 md:p-6 flex flex-row flex-wrap items-center justify-between gap-2 space-y-0 pb-2 sm:pb-3 md:pb-4">
        <CardTitle className="text-lg sm:text-lg md:text-xl font-semibold flex items-center gap-2">
          <Building className="h-4 w-4 md:h-5 md:w-5" />
          <span className="hidden sm:inline">Berufserfahrung</span>
          <span className="sm:hidden">Erfahrung</span>
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
            <ExperienceForm formData={formData} setFormData={setFormData} />
          </div>
        )}
        {safeExperiences.length === 0 ? (
          <div className="text-center py-6 md:py-8 text-muted-foreground">
            <Building className="h-8 w-8 md:h-12 md:w-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm md:text-base">Noch keine Berufserfahrung hinzugefügt</p>
            {isEditing && (
              <Button 
                variant="outline" 
                className="mt-4"
                size="sm"
                onClick={handleAddNew}
              >
                <Plus className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Erste Erfahrung hinzufügen</span>
                <span className="sm:hidden">Hinzufügen</span>
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4 md:space-y-6">
            {sortedExperiences.map(({ item: exp, i }, idx) => (
              <div key={i} className="relative group">
                <div className="flex items-start gap-3 md:gap-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-accent/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Building className="h-5 w-5 md:h-6 md:w-6 text-accent-foreground" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-base md:text-lg truncate">{exp.titel}</h3>
                        <p className="text-primary font-medium text-sm md:text-base truncate">{exp.unternehmen}</p>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs md:text-sm text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            <span className="truncate">{exp.ort}</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span className="truncate">{formatDateRange(exp.zeitraum_von, exp.zeitraum_bis || 'present')}</span>
                          </span>
                        </div>
                      </div>
                      
                      {isEditing && editingIndex !== i && !isAddingNew && (
                        <div className="flex gap-1 ml-2">
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
                            className="text-destructive hover:text-destructive h-8 w-8 p-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                    
                    {exp.beschreibung && (
                      <p className="text-muted-foreground mt-2 md:mt-3 leading-relaxed text-sm md:text-base">
                        {exp.beschreibung}
                      </p>
                    )}
                    {editingIndex === i && (
                      <div className="mt-3 md:mt-4">
                        <ExperienceForm formData={formData} setFormData={setFormData} />
                      </div>
                    )}
                  </div>
                </div>
                
                {idx < sortedExperiences.length - 1 && (
                  <div className="mt-4 md:mt-6 border-b border-border/50" />
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