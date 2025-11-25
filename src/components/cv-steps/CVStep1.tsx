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
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold mb-2">Wähle deine Branche</h2>
        <p className="text-muted-foreground mb-2">
          In welchem Bereich möchtest du arbeiten?
        </p>
        {validationErrors.branche && (
          <p className="text-sm text-destructive font-medium mb-4">
            {validationErrors.branche}
          </p>
        )}
        
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-3 md:gap-4">
          {branches.map((branch) => (
            <Card 
              key={branch.key}
              className={`p-4 md:p-5 cursor-pointer transition-all hover:shadow-md min-w-0 overflow-hidden ${
                formData.branche === branch.key 
                  ? 'ring-2 ring-primary bg-primary/5' 
                  : validationErrors.branche 
                    ? 'border-destructive ring-1 ring-destructive/20 hover:bg-accent/50'
                    : 'hover:bg-accent/50'
              }`}
              onClick={() => updateFormData({ branche: branch.key })}
            >
              <div className="text-center min-w-0 w-full">
                <div className="text-2xl md:text-3xl mb-2">{branch.emoji}</div>
                <h3 className="text-xs md:text-sm font-semibold mb-1.5 px-1 break-words hyphens-auto">{branch.title}</h3>
                <p className="text-[10px] md:text-xs text-muted-foreground leading-snug px-1 break-words">{branch.desc}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-2">Deine aktuelle Situation</h2>
        <p className="text-muted-foreground mb-2">
          Was beschreibt dich am besten?
        </p>
        {validationErrors.status && (
          <p className="text-sm text-destructive font-medium mb-4">
            {validationErrors.status}
          </p>
        )}
        
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
          {statuses.map((status) => (
            <Card 
              key={status.key}
              className={`p-4 md:p-5 cursor-pointer transition-all hover:shadow-md min-w-0 overflow-hidden ${
                formData.status === status.key 
                  ? 'ring-2 ring-primary bg-primary/5' 
                  : validationErrors.status 
                    ? 'border-destructive ring-1 ring-destructive/20 hover:bg-accent/50'
                    : 'hover:bg-accent/50'
              }`}
              onClick={() => updateFormData({ status: status.key })}
            >
              <div className="text-center min-w-0 w-full">
                <div className="text-2xl md:text-3xl mb-2">{status.emoji}</div>
                <h3 className="text-xs md:text-sm font-semibold mb-1.5 px-1 break-words hyphens-auto">{status.title}</h3>
                <p className="text-[10px] md:text-xs text-muted-foreground leading-snug px-1 break-words">{status.desc}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {formData.branche && formData.status && (
        <div className="p-4 bg-primary/5 rounded-lg border">
          <p className="text-sm text-foreground">
            ✅ Perfekt! Du hast <strong>{branches.find(b => b.key === formData.branche)?.title}</strong> und 
            <strong> {statuses.find(s => s.key === formData.status)?.title}</strong> gewählt.
          </p>
        </div>
      )}
    </div>
  );
};

export default CVStep1;