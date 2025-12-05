import React from 'react';
import { useCVForm } from '@/contexts/CVFormContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { BRANCHES } from '@/lib/branches';

const CVStep1 = () => {
  const { formData, updateFormData, validationErrors } = useCVForm();

  // Use centralized branch definitions
  const branches = BRANCHES.map(branch => ({
    key: branch.key,
    emoji: branch.emoji || '',
    title: branch.label,
    desc: branch.desc || ''
  }));

  const statuses = [
    { key: 'schueler', emoji: '🧑‍🎓', title: 'Schüler:in', desc: 'Ich gehe noch zur Schule' },
    { key: 'azubi', emoji: '🧑‍🔧', title: 'Azubi', desc: 'Ich mache eine Ausbildung' },
    { key: 'fachkraft', emoji: '✅', title: 'Fachkraft', desc: 'Ich habe eine Ausbildung abgeschlossen' }
  ] as const;

  return (
    <div className="space-y-2 md:space-y-4">
      <div>
        <h2 className="text-sm md:text-lg font-semibold mb-0.5 md:mb-1">Wähle deine Branche</h2>
        <p className="text-[10px] md:text-sm text-muted-foreground mb-1.5 md:mb-2">
          In welchem Bereich möchtest du arbeiten?
        </p>
        {validationErrors.branche && (
          <p className="text-[9px] md:text-xs text-destructive font-medium mb-1.5">
            {validationErrors.branche}
          </p>
        )}
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-1 md:gap-2">
          {branches.map((branch) => (
            <Card 
              key={branch.key}
              className={`p-1.5 md:p-3 cursor-pointer transition-all hover:shadow-md min-w-0 overflow-hidden ${
                formData.branche === branch.key 
                  ? 'ring-2 ring-blue-600 bg-blue-50 border-blue-600 shadow-sm' 
                  : validationErrors.branche 
                    ? 'border-destructive ring-1 ring-destructive/20 hover:bg-accent/50'
                    : 'hover:bg-accent/50 border-gray-200'
              }`}
              onClick={() => updateFormData({ branche: branch.key })}
            >
              <div className="text-center min-w-0 w-full">
                <div className="text-lg md:text-2xl mb-0.5 md:mb-1">{branch.emoji}</div>
                <h3 className={`text-[9px] md:text-xs font-semibold mb-0.5 px-0.5 md:px-1 break-words hyphens-auto leading-tight ${
                  formData.branche === branch.key ? 'text-blue-700' : ''
                }`}>{branch.title}</h3>
                <p className={`text-[8px] md:text-[10px] leading-tight px-0.5 md:px-1 break-words line-clamp-2 ${
                  formData.branche === branch.key ? 'text-blue-600' : 'text-muted-foreground'
                }`}>{branch.desc}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-sm md:text-lg font-semibold mb-0.5 md:mb-1">Deine aktuelle Situation</h2>
        <p className="text-[10px] md:text-sm text-muted-foreground mb-1.5 md:mb-2">
          Was beschreibt dich am besten?
        </p>
        {validationErrors.status && (
          <p className="text-[9px] md:text-xs text-destructive font-medium mb-1.5">
            {validationErrors.status}
          </p>
        )}
        
        <div className="grid grid-cols-3 gap-1 md:gap-2">
          {statuses.map((status) => (
            <Card 
              key={status.key}
              className={`p-1.5 md:p-3 cursor-pointer transition-all hover:shadow-md min-w-0 overflow-hidden ${
                formData.status === status.key 
                  ? 'ring-2 ring-blue-600 bg-blue-50 border-blue-600 shadow-sm' 
                  : validationErrors.status 
                    ? 'border-destructive ring-1 ring-destructive/20 hover:bg-accent/50'
                    : 'hover:bg-accent/50 border-gray-200'
              }`}
              onClick={() => updateFormData({ status: status.key })}
            >
              <div className="text-center min-w-0 w-full">
                <div className="text-lg md:text-2xl mb-0.5 md:mb-1">{status.emoji}</div>
                <h3 className={`text-[9px] md:text-xs font-semibold mb-0.5 px-0.5 md:px-1 break-words hyphens-auto leading-tight ${
                  formData.status === status.key ? 'text-blue-700' : ''
                }`}>{status.title}</h3>
                <p className={`text-[8px] md:text-[10px] leading-tight px-0.5 md:px-1 break-words ${
                  formData.status === status.key ? 'text-blue-600' : 'text-muted-foreground'
                }`}>{status.desc}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {formData.branche && formData.status && (
        <div className="p-1.5 md:p-2.5 bg-primary/5 rounded-lg border">
          <p className="text-[9px] md:text-xs text-foreground leading-tight">
            ✅ Perfekt! Du hast <strong>{branches.find(b => b.key === formData.branche)?.title}</strong> und 
            <strong> {statuses.find(s => s.key === formData.status)?.title}</strong> gewählt.
          </p>
        </div>
      )}
    </div>
  );
};

export default CVStep1;