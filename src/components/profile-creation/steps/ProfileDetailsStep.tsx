import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FormFieldError } from '@/components/ui/form-field-error';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { GraduationCap, Plus, X } from 'lucide-react';
import type { ProfileCreationData, ValidationErrors } from '@/hooks/useProfileCreation';
import { BRANCHES } from '@/lib/branches';

interface ProfileDetailsStepProps {
  profileData: ProfileCreationData;
  validationErrors: ValidationErrors;
  onUpdate: (updates: Partial<ProfileCreationData>) => void;
}

export const ProfileDetailsStep: React.FC<ProfileDetailsStepProps> = ({
  profileData,
  validationErrors,
  onUpdate
}) => {
  const stepErrors = validationErrors[3] || [];
  
  const getFieldError = (field: string) => {
    return stepErrors.find(error => error.includes(field));
  };

  const addEducation = () => {
    const newEducation = {
      schule: '',
      abschluss: '',
      zeitraum: ''
    };
    
    onUpdate({
      schulbildung: [...profileData.schulbildung, newEducation]
    });
  };

  const removeEducation = (index: number) => {
    const updatedEducation = profileData.schulbildung.filter((_, i) => i !== index);
    onUpdate({ schulbildung: updatedEducation });
  };

  const updateEducation = (index: number, field: string, value: string) => {
    const updatedEducation = profileData.schulbildung.map((edu, i) => 
      i === index ? { ...edu, [field]: value } : edu
    );
    onUpdate({ schulbildung: updatedEducation });
  };

  // Status options based on German education/career system
  const statusOptions = [
    { value: 'schueler', label: 'Schüler/in' },
    { value: 'azubi', label: 'Azubi' },
    { value: 'fachkraft', label: 'Fachkraft' },
    { value: 'student', label: 'Student/in' },
    { value: 'absolvent', label: 'Absolvent/in' },
    { value: 'berufstaetig', label: 'Berufstätig' },
    { value: 'arbeitssuchend', label: 'Arbeitssuchend' }
  ];

  // Industry options - use centralized branches
  const branchenOptions = BRANCHES.map(branch => ({
    value: branch.key,
    label: branch.label
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-primary" />
          Ausbildung & Status
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Deine aktuelle Situation und Qualifikationen
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Current Status */}
        <div className="space-y-2">
          <Label className="required">
            Aktueller Status
          </Label>
          <FormFieldError error={getFieldError('status')}>
            <Select 
              value={profileData.status} 
              onValueChange={(value) => onUpdate({ status: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Wählen Sie Ihren aktuellen Status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormFieldError>
        </div>

        {/* Industry */}
        <div className="space-y-2">
          <Label className="required">
            Branche / Bereich
          </Label>
          <FormFieldError error={getFieldError('branche')}>
            <Select 
              value={profileData.branche} 
              onValueChange={(value) => onUpdate({ branche: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Wählen Sie Ihre Branche" />
              </SelectTrigger>
              <SelectContent>
                {branchenOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormFieldError>
        </div>

        {/* Education History */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className={profileData.status === 'schueler' || profileData.status === 'azubi' ? 'required' : ''}>
              Ausbildung / Qualifikationen
            </Label>
            <Button 
              type="button" 
              variant="outline" 
              size="sm"
              onClick={addEducation}
            >
              <Plus className="w-4 h-4 mr-2" />
              Hinzufügen
            </Button>
          </div>

          {profileData.schulbildung.length === 0 && (
            <div className="text-center py-8 bg-muted/30 rounded-lg border-2 border-dashed border-muted-foreground/20">
              <GraduationCap className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                Noch keine Ausbildung hinzugefügt
                {(profileData.status === 'schueler' || profileData.status === 'azubi') && (
                  <span className="block mt-1 text-destructive text-xs">
                    Pflichtfeld für Schüler und Azubis
                  </span>
                )}
              </p>
              <Button 
                type="button" 
                variant="ghost" 
                size="sm" 
                onClick={addEducation}
                className="mt-2"
              >
                Erste Ausbildung hinzufügen
              </Button>
            </div>
          )}

          {profileData.schulbildung.map((education, index) => (
            <Card key={index} className="relative">
              <CardContent className="pt-4 pb-4">
                <div className="flex justify-end mb-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeEducation(index)}
                    className="text-destructive hover:text-destructive"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Ausbildungsstätte wählen</Label>
                    <Input
                      placeholder="z.B. Max-Mustermann-Gymnasium"
                      value={education.schule}
                      onChange={(e) => updateEducation(index, 'schule', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Abschluss</Label>
                    <Input
                      placeholder="z.B. Abitur, Realschulabschluss"
                      value={education.abschluss}
                      onChange={(e) => updateEducation(index, 'abschluss', e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="mt-4">
                  <Label>Zeitraum</Label>
                  <Input
                    placeholder="z.B. 2018 - 2021"
                    value={education.zeitraum}
                    onChange={(e) => updateEducation(index, 'zeitraum', e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Help Text */}
        <div className="bg-muted/50 rounded-lg p-3">
          <p className="text-sm text-muted-foreground">
            <strong>Hinweis:</strong> Füge alle relevanten Abschlüsse und 
            Qualifikationen hinzu. Diese helfen Unternehmen, dich besser einzuschätzen.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};