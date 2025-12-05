import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronRight } from 'lucide-react';

interface CompanyValuesSectionProps {
  companyId: string;
}

const COMPANY_VALUES_QUESTIONS = [
  { key: 'q1_important_values', label: 'Welche Werte sind in Ihrem Unternehmen besonders wichtig?' },
  { key: 'q2_team_collaboration', label: 'Wie sieht bei Ihnen eine gute Zusammenarbeit im Team aus?' },
  { key: 'q3_handling_mistakes', label: 'Wie gehen Sie mit Fehlern oder schwierigen Situationen um?' },
  { key: 'q4_desired_traits', label: 'Welche Eigenschaften sind Ihnen bei neuen Mitarbeitenden besonders wichtig?' },
  { key: 'q5_long_term_motivation', label: 'Was motiviert Mitarbeitende in Ihrem Unternehmen langfristig?' },
];

const ROLE_EXPECTATIONS_LABELS: Record<string, string> = {
  key_tasks: 'Wichtigste Aufgaben',
  must_have_traits: 'Unbedingt erforderliche Eigenschaften',
  desired_behavior: 'Gewünschte Verhaltensweisen',
  no_gos: 'Absolute No-Gos',
  work_environment: 'Arbeitsumfeld',
};

export function CompanyValuesSection({ companyId }: CompanyValuesSectionProps) {
  const [values, setValues] = useState<any>(null);
  const [roleExpectations, setRoleExpectations] = useState<any>(null);
  const [interviewQuestions, setInterviewQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFullModal, setShowFullModal] = useState(false);
  const [expandedValue, setExpandedValue] = useState<string | null>(null);
  const [expandedInterview, setExpandedInterview] = useState<number | null>(null);
  const MAX_PREVIEW_LENGTH = 120;

  useEffect(() => {
    loadData();
  }, [companyId]);

  const loadData = async () => {
    try {
      // Load company values
      const { data: valuesData } = await supabase
        .from('company_values')
        .select('*')
        .eq('company_id', companyId)
        .maybeSingle();

      if (valuesData) {
        setValues(valuesData);
      }

      // Load role expectations (general, without role_id)
      const { data: expectationsData } = await supabase
        .from('company_role_expectations')
        .select('*')
        .eq('company_id', companyId)
        .is('role_id', null)
        .maybeSingle();

      if (expectationsData) {
        setRoleExpectations(expectationsData);
      }

      // Load interview questions (general, without role_id)
      const { data: questionsData } = await supabase
        .from('company_interview_questions')
        .select('*')
        .eq('company_id', companyId)
        .is('role_id', null)
        .order('position', { ascending: true });

      if (questionsData && questionsData.length > 0) {
        setInterviewQuestions(questionsData);
      }
    } catch (error) {
      console.error('Error loading company values:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return null;
  }

  // Check if there's any data to display
  const hasValues = values && Object.values(values).some((v: any) => v && typeof v === 'string' && v.trim() && !v.startsWith('q'));
  const hasRoleExpectations = roleExpectations && Object.entries(roleExpectations)
    .filter(([key]) => key !== 'id' && key !== 'company_id' && key !== 'role_id' && key !== 'created_at' && key !== 'updated_at')
    .some(([_, value]) => value && typeof value === 'string' && value.trim());
  const hasInterviewQuestions = interviewQuestions.length > 0;

  if (!hasValues && !hasRoleExpectations && !hasInterviewQuestions) {
    return null;
  }

  // Extract keywords from values
  const keywords = values?.values_tags || [];

  return (
    <>
      <div className="space-y-4">
        {/* Werte & Arbeitskultur */}
        {hasValues && (
          <Card className="p-4">
            <h3 className="text-base font-semibold mb-3">Werte & Arbeitskultur</h3>
            
            {/* Keywords as Tags */}
            {keywords.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {keywords.slice(0, 5).map((keyword: string, idx: number) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {keyword}
                  </Badge>
                ))}
              </div>
            )}

            {/* Short Description */}
            {values?.q1_important_values && (
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                {values.q1_important_values}
              </p>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFullModal(true)}
              className="w-full"
            >
              Mehr über die Arbeitskultur
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </Card>
        )}

        {/* Erwartungen an neue Mitarbeitende */}
        {hasRoleExpectations && (
          <Card className="p-4">
            <h3 className="text-base font-semibold mb-3">Erwartungen an neue Mitarbeitende</h3>
            <Accordion type="single" collapsible className="w-full">
              {Object.entries(roleExpectations)
                .filter(([key, value]) => 
                  key !== 'id' && 
                  key !== 'company_id' && 
                  key !== 'role_id' && 
                  key !== 'created_at' && 
                  key !== 'updated_at' &&
                  value && 
                  typeof value === 'string' && 
                  value.trim()
                )
                .slice(0, 3)
                .map(([key, value]) => (
                  <AccordionItem key={key} value={key}>
                    <AccordionTrigger className="text-sm">
                      {ROLE_EXPECTATIONS_LABELS[key] || key}
                    </AccordionTrigger>
                    <AccordionContent>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {value as string}
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                ))}
            </Accordion>
          </Card>
        )}

        {/* Interview-Vorbereitung */}
        {hasInterviewQuestions && (
          <Card className="p-4">
            <h3 className="text-base font-semibold mb-2">Interview-Vorbereitung</h3>
            <p className="text-xs text-muted-foreground mb-3">
              Diese {interviewQuestions.length} Fragen sind uns im Gespräch besonders wichtig.
            </p>
            <Accordion type="single" collapsible className="w-full">
              {interviewQuestions.slice(0, 5).map((item, index) => (
                <AccordionItem key={item.id || index} value={`interview-${index}`}>
                  <AccordionTrigger className="text-sm">
                    Frage {index + 1}
                  </AccordionTrigger>
                  <AccordionContent>
                    <p className="text-sm text-muted-foreground">
                      {item.question}
                    </p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Card>
        )}
      </div>

      {/* Full Modal */}
      <Dialog open={showFullModal} onOpenChange={setShowFullModal}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader className="pb-3 border-b">
            <DialogTitle className="text-lg">Werte & Arbeitskultur</DialogTitle>
          </DialogHeader>
          
          <Tabs defaultValue="values" className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="values">Werteprofil</TabsTrigger>
              <TabsTrigger value="interview" disabled={!hasInterviewQuestions}>
                Interviewfragen ({interviewQuestions.length})
              </TabsTrigger>
            </TabsList>
            
            <div className="overflow-y-auto flex-1">
              <TabsContent value="values" className="mt-0 space-y-3">
                {hasValues ? (
                  COMPANY_VALUES_QUESTIONS.map((q) => {
                    const answer = values?.[q.key];
                    if (!answer || !answer.trim()) return null;
                    
                    const isExpanded = expandedValue === q.key;
                    const needsExpansion = answer.length > MAX_PREVIEW_LENGTH;
                    const displayText = isExpanded 
                      ? answer 
                      : needsExpansion 
                        ? answer.substring(0, MAX_PREVIEW_LENGTH) + '...'
                        : answer;

                    return (
                      <div key={q.key} className="border-l-2 border-primary/20 pl-3">
                        <p className="text-xs font-medium mb-1">{q.label}</p>
                        <p className={`text-sm text-muted-foreground whitespace-pre-wrap ${!isExpanded && needsExpansion ? 'line-clamp-1' : ''}`}>
                          {displayText}
                        </p>
                        {needsExpansion && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setExpandedValue(isExpanded ? null : q.key)}
                            className="h-6 text-xs px-0 py-0 text-primary hover:text-primary/80 mt-1"
                          >
                            {isExpanded ? 'Weniger anzeigen' : 'Mehr anzeigen'}
                          </Button>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <p className="text-muted-foreground text-center py-8">Keine Werte hinterlegt.</p>
                )}
              </TabsContent>
              
              <TabsContent value="interview" className="mt-0 space-y-3">
                {hasInterviewQuestions ? (
                  interviewQuestions.map((item, index) => {
                    const isExpanded = expandedInterview === index;
                    const needsExpansion = item.question.length > MAX_PREVIEW_LENGTH;
                    const displayText = isExpanded 
                      ? item.question 
                      : needsExpansion 
                        ? item.question.substring(0, MAX_PREVIEW_LENGTH) + '...'
                        : item.question;

                    return (
                      <div key={item.id || index} className="border-l-2 border-primary/20 pl-3">
                        <p className="text-xs font-medium mb-1">Frage {index + 1}</p>
                        <p className={`text-sm text-muted-foreground whitespace-pre-wrap ${!isExpanded && needsExpansion ? 'line-clamp-1' : ''}`}>
                          {displayText}
                        </p>
                        {needsExpansion && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setExpandedInterview(isExpanded ? null : index)}
                            className="h-6 text-xs px-0 py-0 text-primary hover:text-primary/80 mt-1"
                          >
                            {isExpanded ? 'Weniger anzeigen' : 'Mehr anzeigen'}
                          </Button>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <p className="text-muted-foreground text-center py-8">Keine Interviewfragen hinterlegt.</p>
                )}
              </TabsContent>
            </div>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
}

