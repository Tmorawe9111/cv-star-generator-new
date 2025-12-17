import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useCompany } from '@/hooks/useCompany';
import { supabase } from '@/integrations/supabase/client';

const ROLE_EXPECTATIONS_FIELDS = [
  {
    key: 'key_tasks',
    label: 'Was sind die wichtigsten Aufgaben der Stelle?',
    placeholder: 'Beschreiben Sie die Hauptaufgaben und Verantwortlichkeiten...',
    tip: 'Fokussieren Sie sich auf die 3-5 wichtigsten Aufgaben.'
  },
  {
    key: 'must_have_traits',
    label: 'Welche Eigenschaften sollte eine Person unbedingt mitbringen?',
    placeholder: 'Nennen Sie die essentiellen Eigenschaften für diese Position...',
    tip: 'Unterscheiden Sie zwischen "Must-Have" und "Nice-to-Have".'
  },
  {
    key: 'desired_behavior',
    label: 'Welche Verhaltensweisen passen gut in Ihr Team?',
    placeholder: 'Beschreiben Sie, wie sich die Person im Team verhalten sollte...',
    tip: 'Denken Sie an Kommunikation, Zusammenarbeit, Arbeitsweise.'
  },
  {
    key: 'no_gos',
    label: 'Was sind absolute No-Gos für diese Position?',
    placeholder: 'Nennen Sie Verhaltensweisen oder Eigenschaften, die nicht passen...',
    tip: 'Seien Sie spezifisch, aber konstruktiv.'
  },
  {
    key: 'work_environment',
    label: 'Welche Art von Arbeitsumfeld erwartet die neue Person?',
    placeholder: 'Beschreiben Sie das Arbeitsumfeld, die Atmosphäre, die Struktur...',
    tip: 'Bewerber möchten wissen, in welchem Umfeld sie arbeiten werden.'
  }
];

interface CompanyRoleExpectationsProps {
  roleId?: string;
  initialValues?: Record<string, string>;
  onComplete: (values: Record<string, string>) => void;
  onBack?: () => void;
  onSkip?: () => void;
}

export function CompanyRoleExpectations({ 
  roleId, 
  initialValues = {}, 
  onComplete, 
  onBack,
  onSkip 
}: CompanyRoleExpectationsProps) {
  const { company } = useCompany();
  const [selectedRoleId, setSelectedRoleId] = useState<string>(roleId || '');
  const [values, setValues] = useState<Record<string, string>>(initialValues);
  const [jobPostings, setJobPostings] = useState<any[]>([]);

  // Load job postings for this company
  useEffect(() => {
    const loadJobPostings = async () => {
      if (company?.id) {
        try {
          const { data, error } = await supabase
            .from('job_posts')
            .select('id, title')
            .eq('company_id', company.id)
            .eq('status', 'published')
            .order('created_at', { ascending: false });

          if (error) {
            console.error('Error loading job postings:', error);
          } else {
            setJobPostings(data || []);
          }
        } catch (error) {
          console.error('Error loading job postings:', error);
        }
      }
    };

    loadJobPostings();
  }, [company?.id]);

  const handleSave = () => {
    onComplete({
      ...values,
      role_id: selectedRoleId || null
    });
  };

  return (
    <div className="w-full space-y-4">
      <Card className="p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold mb-4">
            Erwartungen an neue Mitarbeitende
          </h3>
        <p className="text-sm text-muted-foreground mb-6">
          Diese Angaben helfen Bewerbern zu verstehen, was Sie von neuen Mitarbeitenden erwarten.
        </p>

        {/* Role Selection (optional) */}
        {jobPostings.length > 0 && (
          <div className="space-y-2 mb-6">
            <Label>Für welche Stelle? (Optional)</Label>
            <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
              <SelectTrigger>
                <SelectValue placeholder="Allgemeine Erwartungen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Allgemeine Erwartungen</SelectItem>
                {jobPostings.map((job) => (
                  <SelectItem key={job.id} value={job.id}>
                    {job.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Fields */}
        <div className="space-y-4">
          {ROLE_EXPECTATIONS_FIELDS.map((field) => (
            <div key={field.key} className="space-y-2">
              <Label className="text-sm font-medium">{field.label}</Label>
              <Textarea
                value={values[field.key] || ''}
                onChange={(e) => setValues(prev => ({ ...prev, [field.key]: e.target.value }))}
                placeholder={field.placeholder}
                className="min-h-[100px] text-sm"
              />
              {!values[field.key]?.trim() && (
                <p className="text-xs text-muted-foreground italic">
                  💡 Tipp: {field.tip}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-6">
          <div className="flex gap-2">
            {onBack && (
              <Button variant="outline" onClick={onBack} size="sm">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Zurück
              </Button>
            )}
            {onSkip && (
              <Button variant="ghost" onClick={onSkip} size="sm">
                Überspringen
              </Button>
            )}
          </div>
          
          <Button onClick={handleSave} size="sm" className="bg-primary">
            Speichern
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </Card>
    </div>
  );
}

