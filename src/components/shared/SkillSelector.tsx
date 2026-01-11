import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2 } from 'lucide-react';
import { Combobox } from '@/components/ui/combobox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getSkillsForBranch } from '@/data/branchenSkills';
import { useIsMobile } from '@/hooks/useIsMobile';

interface SkillSelectorProps {
  selectedSkills: string[];
  onSkillsChange: (skills: string[]) => void;
  branch?: string;
  statusLevel?: string;
  maxSkills?: number;
  label?: string;
  placeholder?: string;
  className?: string;
}

export const SkillSelector = ({
  selectedSkills,
  onSkillsChange,
  branch,
  statusLevel,
  maxSkills = 5,
  label = 'Fähigkeiten',
  placeholder = 'Fähigkeit auswählen...',
  className = ''
}: SkillSelectorProps) => {
  const [customSkill, setCustomSkill] = useState('');
  const isMobile = useIsMobile();
  
  // Get branch-specific skills
  const branchSkills = getSkillsForBranch(branch);
  const availableSkills = branchSkills.filter(skill => !selectedSkills.includes(skill));

  const addSkill = (skillName: string) => {
    if (!skillName.trim()) return;
    if (selectedSkills.length >= maxSkills) return;
    if (!selectedSkills.includes(skillName.trim())) {
      onSkillsChange([...selectedSkills, skillName.trim()]);
    }
  };

  const removeSkill = (index: number) => {
    onSkillsChange(selectedSkills.filter((_, i) => i !== index));
  };

  const addCustomSkill = () => {
    addSkill(customSkill);
    setCustomSkill('');
  };

  return (
    <div className={className}>
      <div className="flex justify-between items-center mb-2">
        <Label>{label}</Label>
        <span className="text-sm text-muted-foreground">
          {selectedSkills.length}/{maxSkills} ausgewählt
        </span>
      </div>
      
      <div className="space-y-4">
        {/* Mobile: Use Select Dropdown, Desktop: Use Combobox */}
        {isMobile ? (
          <Select
            value=""
            onValueChange={(value) => {
              if (value) {
                addSkill(value);
              }
            }}
            disabled={selectedSkills.length >= maxSkills || availableSkills.length === 0}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={selectedSkills.length >= maxSkills ? "Maximum erreicht" : placeholder} />
            </SelectTrigger>
            <SelectContent className="z-[10000] max-h-[300px]">
              {availableSkills.map((skill) => (
                <SelectItem key={skill} value={skill}>
                  {skill}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Combobox
            items={availableSkills.map((skill) => ({ value: skill, label: skill }))}
            value={undefined}
            onChange={(value) => addSkill(value)}
            placeholder={selectedSkills.length >= maxSkills ? "Maximum erreicht" : placeholder}
            searchPlaceholder="Fähigkeit suchen..."
            disabled={selectedSkills.length >= maxSkills}
          />
        )}

        {/* Custom Skill Input */}
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            placeholder="Eigene Fähigkeit eingeben..."
            value={customSkill}
            onChange={(e) => setCustomSkill(e.target.value)}
            disabled={selectedSkills.length >= maxSkills}
            className="flex-1 text-sm md:text-base"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addCustomSkill();
              }
            }}
          />
          <Button
            type="button"
            variant="outline"
            onClick={addCustomSkill}
            disabled={!customSkill.trim() || selectedSkills.length >= maxSkills}
            className="w-full sm:w-auto"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2 sm:mr-0" />
            <span className="sm:hidden">Hinzufügen</span>
          </Button>
        </div>

        {/* Selected Skills */}
        {selectedSkills.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {selectedSkills.map((skill, index) => (
              <div key={index} className="flex items-center gap-1 bg-primary/10 text-primary px-3 py-2 rounded-full text-xs md:text-sm">
                <span className="max-w-[120px] md:max-w-none truncate">{skill}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 ml-1 min-w-[16px]"
                  onClick={() => removeSkill(index)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm p-4 bg-muted/20 rounded">
            Wähle Fähigkeiten aus der Liste oder gib eigene ein.
          </p>
        )}
      </div>
    </div>
  );
};