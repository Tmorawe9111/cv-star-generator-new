import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Building, Plus, Edit3, Trash2, MapPin, Calendar, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { capitalizeFirst, capitalizeWords, capitalizeSentences } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CompanyAutocomplete } from '@/components/shared/CompanyAutocomplete';

interface Experience {
  titel: string;
  unternehmen: string;
  ort: string;
  zeitraum_von: string;
  zeitraum_bis: string;
  beschreibung?: string;
  abschluss?: string; // Abschluss bei Ausbildungen
  linked_company_id?: string | null;
  linked_company_logo?: string | null;
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
                  linked_company_id: company.id,
                  linked_company_logo: company.logo_url || null
                });
              } else {
                setFormData({ 
                  ...formData, 
                  linked_company_id: null,
                  linked_company_logo: null
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

      {/* Abschluss field for apprenticeships */}
      {(() => {
        const titelLower = formData.titel?.toLowerCase() || '';
        const isAusbildung = titelLower.includes('ausbildung') || 
                            titelLower.includes('azubi') || 
                            titelLower.includes('lehrling');
        
        if (isAusbildung) {
          const abschlussOptions = [
            'Gesellenbrief',
            'Facharbeiterbrief',
            'Kaufmännische Abschlussprüfung',
            'Berufsabschluss',
            'IHK-Abschluss',
            'HWK-Abschluss',
            'Ausbildung',
            'Andere'
          ];
          
          return (
            <div>
              <Label htmlFor="abschluss">Abschluss (optional)</Label>
              <Select 
                value={formData.abschluss || ''} 
                onValueChange={(value) => {
                  if (value === 'Andere') {
                    const input = prompt('Bitte geben Sie den Abschluss ein:');
                    if (input) {
                      setFormData({ ...formData, abschluss: input });
                    }
                  } else {
                    setFormData({ ...formData, abschluss: value });
                  }
                }}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Abschluss wählen" />
                </SelectTrigger>
                <SelectContent className="bg-background border shadow-lg z-50">
                  {abschlussOptions.map((option) => (
                    <SelectItem key={option} value={option} className="hover:bg-muted">
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          );
        }
        return null;
      })()}

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
    // Ensure all editing states are closed
    setIsAddingNew(false);
    setEditingIndex(null);
    // Exit editing mode after save
    if (onEditingChange) {
      onEditingChange(false);
    }
  };

  const handleEdit = (index: number) => {
    // Close any open form first
    if (isAddingNew) {
      setIsAddingNew(false);
      resetForm();
    }
    if (editingIndex !== null && editingIndex !== index) {
      setEditingIndex(null);
      resetForm();
    }
    setFormData(experiences[index]);
    setEditingIndex(index);
  };

  const handleAddNew = () => {
    // Close any open edit form first
    if (editingIndex !== null) {
      setEditingIndex(null);
      resetForm();
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

  // Format date as MM.YYYY (German format)
  const formatMonthYear = (date: Date | string | undefined) => {
    if (!date) return '';
    
    // Handle string formats: "YYYY-MM" or "YYYY"
    if (typeof date === 'string') {
      if (date === 'heute' || date === '') return '';
      
      const parts = date.split('-');
      const year = parseInt(parts[0] || '0');
      
      if (isNaN(year) || year === 0) return '';
      
      // If only year provided (format: "YYYY")
      if (parts.length === 1) {
        return year.toString();
      }
      
      // If month and year provided (format: "YYYY-MM")
      const month = parseInt(parts[1] || '1');
      if (isNaN(month) || month < 1 || month > 12) return year.toString();
      
      return `${String(month).padStart(2, '0')}.${year}`;
    }
    
    // Handle Date object
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${month}.${year}`;
  };

  const formatDateRange = (from: string, to: string) => {
    if (!from) return '';
    const fromFormatted = formatMonthYear(from);
    const toFormatted = to && to !== 'heute' && to !== 'present' ? formatMonthYear(to) : 'Heute';
    
    return `${fromFormatted} - ${toFormatted}`;
  };

  const handleSaveWithValidation = () => {
    // Validate required fields
    if (!formData.titel || !formData.titel.trim()) {
      alert('Bitte geben Sie eine Position ein.');
      return;
    }
    if (!formData.unternehmen || !formData.unternehmen.trim()) {
      alert('Bitte geben Sie ein Unternehmen ein.');
      return;
    }
    if (!formData.zeitraum_von || !formData.zeitraum_von.trim()) {
      alert('Bitte geben Sie ein Startdatum ein.');
      return;
    }
    
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
    // Validate required fields
    if (!formData.titel || !formData.titel.trim()) {
      alert('Bitte geben Sie eine Position ein.');
      return;
    }
    if (!formData.unternehmen || !formData.unternehmen.trim()) {
      alert('Bitte geben Sie ein Unternehmen ein.');
      return;
    }
    if (!formData.zeitraum_von || !formData.zeitraum_von.trim()) {
      alert('Bitte geben Sie ein Startdatum ein.');
      return;
    }
    
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
  // Parse date string (format: "YYYY-MM" or "YYYY" or empty)
  const parseDate = (dateStr: string): { year: number; month: number } | null => {
    if (!dateStr || dateStr === 'heute' || dateStr === '0000') return null;
    
    const parts = dateStr.split('-');
    const year = parseInt(parts[0] || '0');
    const month = parts[1] ? parseInt(parts[1]) : 1;
    
    if (isNaN(year) || year === 0) return null;
    return { year, month: isNaN(month) ? 1 : month };
  };

  // Check if a date is in the future (current/ongoing)
  const isFutureOrCurrent = (dateStr: string): boolean => {
    if (!dateStr || dateStr === 'heute' || dateStr === '') return true;
    const date = parseDate(dateStr);
    if (!date) return false;
    
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    
    // If year is in the future, it's current
    if (date.year > currentYear) return true;
    // If same year and month is in the future or current, it's current
    if (date.year === currentYear && date.month >= currentMonth) return true;
    
    return false;
  };

  // Get sort value for a job
  // For current jobs: lower value = earlier start (will be sorted ascending)
  // For past jobs: higher value = more recent end (will be sorted descending)
  const getSortValue = (job: {
    zeitraum_von: string;
    zeitraum_bis: string;
  }): { isCurrent: boolean; value: number } => {
    const isCurrent = !job.zeitraum_bis || job.zeitraum_bis === 'heute' || job.zeitraum_bis === '' || isFutureOrCurrent(job.zeitraum_bis);
    const vonDate = parseDate(job.zeitraum_von);
    const bisDate = parseDate(job.zeitraum_bis);

    if (isCurrent) {
      // Current jobs: sort by start date (earlier start = lower value, will be sorted ascending)
      // Add large offset to ensure they come first
      if (vonDate) {
        return { 
          isCurrent: true, 
          value: vonDate.year * 10000 + vonDate.month * 100 // Direct value for ascending sort
        };
      }
      return { isCurrent: true, value: 0 }; // If no start date, still prioritize but at end
    }

    // Past jobs: sort by end date (most recent first)
    if (bisDate) {
      return { 
        isCurrent: false, 
        value: bisDate.year * 10000 + bisDate.month * 100 
      };
    }

    // If no end date, sort by start date
    if (vonDate) {
      return { 
        isCurrent: false, 
        value: vonDate.year * 10000 + vonDate.month * 100 
      };
    }

    return { isCurrent: false, value: 0 }; // No date info
  };

  const sortedExperiences = useMemo(() => {
    return safeExperiences
      .map((item, originalIndex) => ({ item, originalIndex }))
      .sort((a, b) => {
        const aSort = getSortValue(a.item);
        const bSort = getSortValue(b.item);
        
        // Current jobs always come first
        if (aSort.isCurrent && !bSort.isCurrent) return -1;
        if (!aSort.isCurrent && bSort.isCurrent) return 1;
        
        // Both current: sort descending (most recent start first)
        if (aSort.isCurrent && bSort.isCurrent) {
          // Higher value = more recent start, so descending sort puts most recent first
          return bSort.value - aSort.value; // Descending: 01.2026 (20260100) comes before 02.2025 (20250200)
        }
        
        // Both past: sort descending (most recent first)
        // If same end date, sort by start date (earlier start first)
        if (aSort.value === bSort.value) {
          const aVon = parseDate(a.item.zeitraum_von);
          const bVon = parseDate(b.item.zeitraum_von);
          if (aVon && bVon) {
            const aStartValue = aVon.year * 10000 + aVon.month * 100;
            const bStartValue = bVon.year * 10000 + bVon.month * 100;
            return bStartValue - aStartValue; // Descending (more recent start first)
          }
        }
        
        return bSort.value - aSort.value; // Descending
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
            {sortedExperiences.map(({ item: exp, originalIndex }, idx) => (
              <div key={originalIndex} className="relative group">
                <div className="flex items-start gap-3 md:gap-4">
                  {exp.linked_company_logo ? (
                    <Link 
                      to={`/companies/${exp.linked_company_id}`}
                      className="w-10 h-10 md:w-12 md:h-12 rounded-lg flex-shrink-0 overflow-hidden hover:opacity-80 transition-opacity"
                    >
                      <img 
                        src={exp.linked_company_logo} 
                        alt={exp.unternehmen}
                        className="w-full h-full object-cover"
                      />
                    </Link>
                  ) : (
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-accent/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Building className="h-5 w-5 md:h-6 md:w-6 text-accent-foreground" />
                    </div>
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-base md:text-lg truncate">{exp.titel}</h3>
                        {exp.linked_company_id ? (
                          <Link 
                            to={`/companies/${exp.linked_company_id}`}
                            className="text-primary font-medium text-sm md:text-base truncate hover:underline block"
                          >
                            {exp.unternehmen}
                          </Link>
                        ) : (
                          <p className="text-primary font-medium text-sm md:text-base truncate">{exp.unternehmen}</p>
                        )}
                        {exp.abschluss && (
                          <p className="text-sm text-muted-foreground mt-0.5">
                            Abschluss: {exp.abschluss}
                          </p>
                        )}
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
                      
                      {isEditing && editingIndex !== originalIndex && !isAddingNew && (
                        <div className="flex gap-1 ml-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(originalIndex)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit3 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(originalIndex)}
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
                    {editingIndex === originalIndex && (
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
        <div className="fixed bottom-0 left-0 right-0 z-[9999] bg-background border-t shadow-lg md:relative md:border-t md:shadow-none md:mt-4 md:pt-3">
          <div className="flex flex-wrap gap-2 justify-end px-4 py-3 md:px-0">
            <Button variant="outline" size="sm" onClick={handleCancel} className="min-w-[80px]">Abbrechen</Button>
            <Button size="sm" onClick={handleSaveWithValidation} className="min-w-[80px]">Speichern</Button>
            {isAddingNew && (
              <Button size="sm" onClick={handleSaveAndNewWithValidation} className="min-w-[120px] text-xs">Speichern & neu</Button>
            )}
          </div>
        </div>
      )}
    </Card>
  );
};