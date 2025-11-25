import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { RotateCcw } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export interface JobFiltersProps {
  selectedJobTypes: string[];
  selectedWorkModes: string[];
  selectedCity: string;
  selectedCompany: string;
  selectedIndustry: string;
  startDate: string;
  requiresLicense: boolean;
  datePosted: string;
  experience: string;
  salaryRange: [number, number];
  selectedSkills: string[];
  onJobTypeChange: (types: string[]) => void;
  onWorkModeChange: (modes: string[]) => void;
  onCityChange: (city: string) => void;
  onCompanyChange: (company: string) => void;
  onIndustryChange: (industry: string) => void;
  onStartDateChange: (date: string) => void;
  onRequiresLicenseChange: (requires: boolean) => void;
  onDatePostedChange: (date: string) => void;
  onExperienceChange: (exp: string) => void;
  onSalaryRangeChange: (range: [number, number]) => void;
  onSkillsChange: (skills: string[]) => void;
  onReset: () => void;
}

const JOB_TYPES = [
  { id: "full_time", label: "Vollzeit" },
  { id: "part_time", label: "Teilzeit" },
  { id: "internship", label: "Praktikum" },
  { id: "apprenticeship", label: "Ausbildung" },
  { id: "temporary", label: "Befristet" },
];

const WORK_MODES = [
  { id: "remote", label: "Remote" },
  { id: "hybrid", label: "Hybrid" },
  { id: "onsite", label: "Vor Ort" },
];

const EXPERIENCE_LEVELS = [
  { id: "entry", label: "Berufseinsteiger" },
  { id: "mid", label: "Mit Berufserfahrung" },
  { id: "senior", label: "Berufserfahren" },
  { id: "lead", label: "Führungsposition" },
];

import { BRANCHES } from '@/lib/branches';

// Use centralized branch definitions
const INDUSTRIES = BRANCHES.map(branch => ({
  id: branch.key,
  label: branch.label
}));

export function JobFilters({
  selectedJobTypes,
  selectedWorkModes,
  selectedCity,
  selectedCompany,
  selectedIndustry,
  startDate,
  requiresLicense,
  datePosted,
  experience,
  salaryRange,
  selectedSkills,
  onJobTypeChange,
  onWorkModeChange,
  onCityChange,
  onCompanyChange,
  onIndustryChange,
  onStartDateChange,
  onRequiresLicenseChange,
  onDatePostedChange,
  onExperienceChange,
  onSalaryRangeChange,
  onSkillsChange,
  onReset
}: JobFiltersProps) {
  const [showMoreFilters, setShowMoreFilters] = useState(false);

  const toggleJobType = (id: string) => {
    if (selectedJobTypes.includes(id)) {
      onJobTypeChange(selectedJobTypes.filter(t => t !== id));
    } else {
      onJobTypeChange([...selectedJobTypes, id]);
    }
  };

  const toggleWorkMode = (id: string) => {
    if (selectedWorkModes.includes(id)) {
      onWorkModeChange(selectedWorkModes.filter(m => m !== id));
    } else {
      onWorkModeChange([...selectedWorkModes, id]);
    }
  };

  const toggleSkill = (skill: string) => {
    if (selectedSkills.includes(skill)) {
      onSkillsChange(selectedSkills.filter(s => s !== skill));
    } else {
      onSkillsChange([...selectedSkills, skill]);
    }
  };

  const hasActiveFilters = 
    selectedJobTypes.length > 0 ||
    selectedWorkModes.length > 0 ||
    selectedCity !== '' ||
    selectedCompany !== '' ||
    selectedIndustry !== '' ||
    startDate !== '' ||
    requiresLicense ||
    datePosted !== 'all' ||
    experience !== 'all' ||
    selectedSkills.length > 0 ||
    salaryRange[0] !== 15000 ||
    salaryRange[1] !== 100000;

  return (
    <Card className="sticky top-4">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base">Filter</CardTitle>
        {hasActiveFilters && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onReset}
            className="h-8 px-2 text-xs"
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            Zurücksetzen
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <Accordion type="multiple" defaultValue={["type"]} className="w-full">
          {/* Unternehmen */}
          <AccordionItem value="company" className="border-0">
            <AccordionTrigger className="py-3 text-sm font-medium hover:no-underline">
              Unternehmen
            </AccordionTrigger>
            <AccordionContent>
              <Input
                placeholder="Unternehmen suchen..."
                value={selectedCompany}
                onChange={(e) => onCompanyChange(e.target.value)}
              />
            </AccordionContent>
          </AccordionItem>

          {/* Stellenart */}
          <AccordionItem value="type" className="border-0">
            <AccordionTrigger className="py-3 text-sm font-medium hover:no-underline">
              Stellenart
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3">
                {JOB_TYPES.map((type) => (
                  <div key={type.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={type.id}
                      checked={selectedJobTypes.includes(type.id)}
                      onCheckedChange={() => toggleJobType(type.id)}
                    />
                    <Label htmlFor={type.id} className="text-sm cursor-pointer flex-1">
                      {type.label}
                    </Label>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Branche */}
          <AccordionItem value="industry" className="border-0">
            <AccordionTrigger className="py-3 text-sm font-medium hover:no-underline">
              Branche
            </AccordionTrigger>
            <AccordionContent>
              <Select value={selectedIndustry} onValueChange={onIndustryChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Branche wählen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Branchen</SelectItem>
                  {INDUSTRIES.map((industry) => (
                    <SelectItem key={industry.id} value={industry.id}>
                      {industry.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </AccordionContent>
          </AccordionItem>

          {/* Arbeitsmodell */}
          <AccordionItem value="workmode" className="border-0">
            <AccordionTrigger className="py-3 text-sm font-medium hover:no-underline">
              Arbeitsmodell
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3">
                {WORK_MODES.map((mode) => (
                  <div key={mode.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={mode.id}
                      checked={selectedWorkModes.includes(mode.id)}
                      onCheckedChange={() => toggleWorkMode(mode.id)}
                    />
                    <Label htmlFor={mode.id} className="text-sm cursor-pointer flex-1">
                      {mode.label}
                    </Label>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Startdatum */}
          <AccordionItem value="startdate" className="border-0">
            <AccordionTrigger className="py-3 text-sm font-medium hover:no-underline">
              Startdatum
            </AccordionTrigger>
            <AccordionContent>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => onStartDateChange(e.target.value)}
              />
            </AccordionContent>
          </AccordionItem>

          {showMoreFilters && (
            <>
              {/* Arbeitsort */}
              <AccordionItem value="city" className="border-0">
                <AccordionTrigger className="py-3 text-sm font-medium hover:no-underline">
                  Stadt
                </AccordionTrigger>
                <AccordionContent>
                  <Input
                    placeholder="Stadt eingeben..."
                    value={selectedCity}
                    onChange={(e) => onCityChange(e.target.value)}
                  />
                </AccordionContent>
              </AccordionItem>

              {/* Veröffentlichungsdatum */}
              <AccordionItem value="date" className="border-0">
                <AccordionTrigger className="py-3 text-sm font-medium hover:no-underline">
                  Veröffentlicht
                </AccordionTrigger>
                <AccordionContent>
                  <Select value={datePosted} onValueChange={onDatePostedChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alle Daten</SelectItem>
                      <SelectItem value="24h">Letzte 24 Stunden</SelectItem>
                      <SelectItem value="7d">Letzte 7 Tage</SelectItem>
                      <SelectItem value="30d">Letzter Monat</SelectItem>
                    </SelectContent>
                  </Select>
                </AccordionContent>
              </AccordionItem>

              {/* Berufserfahrung */}
              <AccordionItem value="experience" className="border-0">
                <AccordionTrigger className="py-3 text-sm font-medium hover:no-underline">
                  Berufserfahrung
                </AccordionTrigger>
                <AccordionContent>
                  <Select value={experience} onValueChange={onExperienceChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alle Level</SelectItem>
                      {EXPERIENCE_LEVELS.map((level) => (
                        <SelectItem key={level.id} value={level.id}>
                          {level.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </AccordionContent>
              </AccordionItem>

              {/* Führerschein */}
              <AccordionItem value="license" className="border-0">
                <AccordionTrigger className="py-3 text-sm font-medium hover:no-underline">
                  Anforderungen
                </AccordionTrigger>
                <AccordionContent>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="license"
                      checked={requiresLicense}
                      onCheckedChange={onRequiresLicenseChange}
                    />
                    <Label htmlFor="license" className="text-sm cursor-pointer flex-1">
                      Führerschein erforderlich
                    </Label>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Gehaltsspanne */}
              <AccordionItem value="salary" className="border-0">
                <AccordionTrigger className="py-3 text-sm font-medium hover:no-underline">
                  Gehalt
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4">
                    <Slider
                      min={15000}
                      max={100000}
                      step={5000}
                      value={salaryRange}
                      onValueChange={(value) => onSalaryRangeChange(value as [number, number])}
                      className="w-full"
                    />
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">€{salaryRange[0].toLocaleString('de-DE')}</span>
                      <span className="font-medium">€{salaryRange[1].toLocaleString('de-DE')}</span>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Skills */}
              <AccordionItem value="skills" className="border-0">
                <AccordionTrigger className="py-3 text-sm font-medium hover:no-underline">
                  Fähigkeiten
                </AccordionTrigger>
                <AccordionContent>
                  <Input
                    placeholder="z.B. Schweißen, KFZ..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.currentTarget.value) {
                        const skill = e.currentTarget.value.trim();
                        if (skill && !selectedSkills.includes(skill)) {
                          onSkillsChange([...selectedSkills, skill]);
                        }
                        e.currentTarget.value = '';
                      }
                    }}
                  />
                  {selectedSkills.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {selectedSkills.map((skill) => (
                        <Button
                          key={skill}
                          variant="secondary"
                          size="sm"
                          onClick={() => toggleSkill(skill)}
                          className="h-7 text-xs"
                        >
                          {skill} ×
                        </Button>
                      ))}
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            </>
          )}
        </Accordion>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowMoreFilters(!showMoreFilters)}
          className="w-full"
        >
          {showMoreFilters ? 'Weniger Filter' : 'Mehr Filter'}
        </Button>
      </CardContent>
    </Card>
  );
}
