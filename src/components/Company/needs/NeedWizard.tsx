import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { CalendarIcon, MapPin, Users, Briefcase, Plus, X, ArrowLeft, ArrowRight, Check } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface NeedWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (needData: any) => Promise<{ success: boolean; error?: string }>;
  isLoading?: boolean;
}

interface FormData {
  name: string;
  profession_id?: string;
  employment_type: string;
  location: {
    lat: number;
    lng: number;
  } | null;
  radius_km: number;
  start_date?: Date;
  
  skills: {
    must: string[];
    nice: string[];
  };
  licenses?: {
    must: string[];
    nice: string[];
  };
  languages?: Array<{
    language: string;
    level: string;
    type: 'must' | 'nice';
  }>;
  target_groups: string[];
}

const STEPS = [
  { id: 1, title: "Grundlagen", description: "Name und Beschäftigungsart" },
  { id: 2, title: "Standort", description: "Arbeitsort und Umkreis" },
  { id: 3, title: "Anforderungen & Zielgruppe", description: "Fähigkeiten und Bewerbergruppe" }
];

const EMPLOYMENT_TYPES = [
  { value: 'internship', label: 'Praktikum' },
  { value: 'apprenticeship', label: 'Ausbildung' },
  { value: 'full_time', label: 'Job (Vollzeit)' }
];


const TARGET_GROUPS = [
  { value: 'azubi', label: 'Azubis' },
  { value: 'schueler', label: 'Schüler' },
  { value: 'ausgelernt', label: 'Ausgelernte' },
  { value: 'quereinsteiger', label: 'Quereinsteiger' }
];

const COMMON_SKILLS = [
  'Teamfähigkeit', 'Kommunikation', 'Zuverlässigkeit', 'Flexibilität',
  'Problemlösung', 'Kundenorientierung', 'Organisationsfähigkeit', 'Belastbarkeit',
  'Mathematik', 'Deutsch', 'Englisch', 'MS Office', 'Handwerkliches Geschick'
];

export function NeedWizard({ isOpen, onClose, onSubmit, isLoading }: NeedWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    employment_type: 'internship',
    location: null,
    radius_km: 25,
    skills: { must: [], nice: [] },
    target_groups: []
  });
  const [newSkill, setNewSkill] = useState('');
  const [skillType, setSkillType] = useState<'must' | 'nice'>('must');

  const progress = (currentStep / STEPS.length) * 100;

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addSkill = () => {
    if (!newSkill.trim()) return;
    
    setFormData(prev => ({
      ...prev,
      skills: {
        ...prev.skills,
        [skillType]: [...prev.skills[skillType], newSkill.trim()]
      }
    }));
    setNewSkill('');
  };

  const removeSkill = (skill: string, type: 'must' | 'nice') => {
    setFormData(prev => ({
      ...prev,
      skills: {
        ...prev.skills,
        [type]: prev.skills[type].filter(s => s !== skill)
      }
    }));
  };

  const addCommonSkill = (skill: string, type: 'must' | 'nice') => {
    if (formData.skills[type].includes(skill)) return;
    
    setFormData(prev => ({
      ...prev,
      skills: {
        ...prev.skills,
        [type]: [...prev.skills[type], skill]
      }
    }));
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.name.trim() && formData.employment_type;
      case 2:
        return formData.location;
      case 3:
        return formData.skills.must.length > 0 && formData.target_groups.length > 0;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!formData.location) return;

    const needData = {
      ...formData,
      start_date: formData.start_date?.toISOString().split('T')[0]
    };

    const result = await onSubmit(needData);
    if (result.success) {
      // Reset form
      setFormData({
        name: '',
        employment_type: 'internship',
        location: null,
        radius_km: 25,
        skills: { must: [], nice: [] },
        target_groups: []
      });
      setCurrentStep(1);
      onClose();
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Name des Anforderungsprofils *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => updateFormData('name', e.target.value)}
                placeholder="z.B. Anlagenmechaniker SHK"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="employment_type">Beschäftigungsart *</Label>
              <Select value={formData.employment_type} onValueChange={(value) => updateFormData('employment_type', value)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EMPLOYMENT_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Startdatum</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal mt-1",
                      !formData.start_date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.start_date ? (
                      format(formData.start_date, "PPP", { locale: de })
                    ) : (
                      <span>Optional: Gewünschtes Startdatum</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.start_date}
                    onSelect={(date) => updateFormData('start_date', date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div>
              <Label>Arbeitsort *</Label>
              <div className="mt-2 p-4 border-2 border-dashed border-muted-foreground/25 rounded-lg text-center">
                <MapPin className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground mb-3">
                  {formData.location ? 'Standort ausgewählt' : 'Standort auf Karte auswählen'}
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    // Simulate location selection for demo
                    updateFormData('location', { lat: 50.1109, lng: 8.6821 }); // Frankfurt
                  }}
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  {formData.location ? 'Standort ändern' : 'Standort wählen'}
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="radius">Suchradius: {formData.radius_km} km</Label>
              <input
                type="range"
                id="radius"
                min="5"
                max="100"
                step="5"
                value={formData.radius_km}
                onChange={(e) => updateFormData('radius_km', parseInt(e.target.value))}
                className="w-full mt-2"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>5 km</span>
                <span>100 km</span>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            {/* Skills Section */}
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                Fähigkeiten *
              </h4>
              
              <div className="flex gap-2 mb-3">
                <div className="flex-1">
                  <Select value={skillType} onValueChange={(value: 'must' | 'nice') => setSkillType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="must">Must-Have</SelectItem>
                      <SelectItem value="nice">Nice-to-Have</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Input
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  placeholder="Fähigkeit eingeben..."
                  onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                />
                <Button onClick={addSkill} size="icon">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
                {COMMON_SKILLS.map(skill => (
                  <Button
                    key={skill}
                    variant="outline"
                    size="sm"
                    onClick={() => addCommonSkill(skill, skillType)}
                    className="justify-start text-xs"
                    disabled={formData.skills[skillType].includes(skill)}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    {skill}
                  </Button>
                ))}
              </div>

              {formData.skills.must.length > 0 && (
                <div className="space-y-2">
                  <h5 className="text-sm font-medium text-red-600">Must-Have</h5>
                  <div className="flex flex-wrap gap-2">
                    {formData.skills.must.map(skill => (
                      <Badge key={skill} variant="destructive" className="gap-1">
                        {skill}
                        <button onClick={() => removeSkill(skill, 'must')}>
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {formData.skills.nice.length > 0 && (
                <div className="space-y-2">
                  <h5 className="text-sm font-medium text-blue-600">Nice-to-Have</h5>
                  <div className="flex flex-wrap gap-2">
                    {formData.skills.nice.map(skill => (
                      <Badge key={skill} variant="secondary" className="gap-1">
                        {skill}
                        <button onClick={() => removeSkill(skill, 'nice')}>
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Target Groups Section */}
            <div className="border-t pt-6">
              <div>
                <Label>Zielgruppe *</Label>
                <p className="text-sm text-muted-foreground mb-3">
                  Wer soll sich auf diese Stelle bewerben?
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {TARGET_GROUPS.map(group => (
                    <div key={group.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={group.value}
                        checked={formData.target_groups.includes(group.value)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            updateFormData('target_groups', [...formData.target_groups, group.value]);
                          } else {
                            updateFormData('target_groups', formData.target_groups.filter(tg => tg !== group.value));
                          }
                        }}
                      />
                      <Label htmlFor={group.value} className="text-sm font-normal">
                        {group.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {formData.target_groups.length > 0 && formData.skills.must.length > 0 && (
                <div className="p-4 bg-muted/50 rounded-lg mt-4">
                  <h4 className="font-medium mb-2">Zusammenfassung</h4>
                  <div className="text-sm space-y-1">
                    <p><strong>Name:</strong> {formData.name}</p>
                    <p><strong>Art:</strong> {EMPLOYMENT_TYPES.find(t => t.value === formData.employment_type)?.label}</p>
                    <p><strong>Radius:</strong> {formData.radius_km} km</p>
                    <p><strong>Must-Have:</strong> {formData.skills.must.length} Fähigkeiten</p>
                    <p><strong>Nice-to-Have:</strong> {formData.skills.nice.length} Fähigkeiten</p>
                    <p><strong>Zielgruppe:</strong> {formData.target_groups.map(tg => TARGET_GROUPS.find(g => g.value === tg)?.label).join(', ')}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Neues Anforderungsprofil erstellen
          </DialogTitle>
        </DialogHeader>

        {/* Progress */}
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span>Schritt {currentStep} von {STEPS.length}</span>
            <span>{Math.round(progress)}% abgeschlossen</span>
          </div>
          <Progress value={progress} className="h-2" />
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="font-medium">{STEPS[currentStep - 1].title}</span>
            <span>•</span>
            <span>{STEPS[currentStep - 1].description}</span>
          </div>
        </div>

        {/* Step Content */}
        <div className="min-h-[300px]">
          {renderStep()}
        </div>

        {/* Navigation */}
        <div className="flex justify-between pt-4 border-t">
          <Button 
            variant="outline" 
            onClick={handleBack}
            disabled={currentStep === 1}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück
          </Button>

          {currentStep < STEPS.length ? (
            <Button 
              onClick={handleNext}
              disabled={!canProceed()}
            >
              Weiter
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button 
              onClick={handleSubmit}
              disabled={!canProceed() || isLoading}
            >
              <Check className="h-4 w-4 mr-2" />
              {isLoading ? 'Erstelle...' : 'Erstellen & Matches finden'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}