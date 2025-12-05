import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';

interface ValuesAndInterviewSectionProps {
  profileId: string;
}

const VALUES_QUESTIONS = [
  { key: 'q1_team', label: 'Was ist dir in einem Team am wichtigsten – und warum?' },
  { key: 'q2_conflict', label: 'Wie möchtest du behandelt werden, wenn etwas nicht gut läuft?' },
  { key: 'q3_reliable', label: 'Worauf können Kollegen und Vorgesetzte sich bei dir verlassen?' },
  { key: 'q4_motivation', label: 'Was motiviert dich langfristig in einem Job?' },
  { key: 'q5_stress', label: 'Wie gehst du mit stressigen Situationen oder Druck um?' },
  { key: 'q6_environment', label: 'Welche Art von Arbeitsumgebung bringt dein bestes Potenzial hervor?' },
  { key: 'q7_respect', label: 'Was bedeutet für dich „Respekt" am Arbeitsplatz?' },
  { key: 'q8_expectations', label: 'Was erwartest du grundsätzlich von einem guten Arbeitgeber?' },
];

export function ValuesAndInterviewSection({ profileId }: ValuesAndInterviewSectionProps) {
  const [values, setValues] = useState<any>(null);
  const [interviewAnswers, setInterviewAnswers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showValuesModal, setShowValuesModal] = useState(false);
  const [expandedValue, setExpandedValue] = useState<string | null>(null);
  const [expandedInterview, setExpandedInterview] = useState<number | null>(null);
  
  const MAX_PREVIEW_LENGTH = 40; // Max characters in profile preview before opening modal
  const MAX_MODAL_LENGTH = 120; // Max characters in modal before showing "Mehr anzeigen"

  useEffect(() => {
    loadData();
  }, [profileId]);

  const loadData = async () => {
    try {
      // profileId is already the user_id (profiles.id = auth.users.id)
      const userId = profileId;
      
      console.log('[ValuesAndInterviewSection] Loading values/interview for user_id:', userId);

      // Load values - RLS will check if profile is unlocked
      const { data: valuesData, error: valuesError } = await supabase
        .from('user_values')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (valuesError) {
        console.error('[ValuesAndInterviewSection] Error loading values:', valuesError);
        // Don't set error state, just log it - RLS might prevent access
      } else {
        console.log('[ValuesAndInterviewSection] Loaded values:', valuesData);
        if (valuesData) {
          setValues(valuesData);
        }
      }

      // Load interview answers - RLS will check if profile is unlocked
      const { data: interviewData, error: interviewError } = await supabase
        .from('user_interview_answers')
        .select('answer, interview_questions!inner(question, id)')
        .eq('user_id', userId);

      if (interviewError) {
        console.error('[ValuesAndInterviewSection] Error loading interview answers:', interviewError);
        // Don't set error state, just log it - RLS might prevent access
      } else if (interviewData && interviewData.length > 0) {
        console.log('[ValuesAndInterviewSection] Loaded interview answers:', interviewData);
        const formattedAnswers = interviewData
          .map((item: any) => ({
            question: item.interview_questions?.question || '',
            answer: item.answer || '',
            id: item.interview_questions?.id || 0,
          }))
          .filter(item => item.question && item.id && item.answer?.trim());
        
        console.log('[ValuesAndInterviewSection] Formatted interview answers:', formattedAnswers);
        setInterviewAnswers(formattedAnswers);
      } else {
        console.log('[ValuesAndInterviewSection] No interview answers found or empty');
      }
    } catch (error) {
      console.error('[ValuesAndInterviewSection] Error loading values/interview:', error);
    } finally {
      setLoading(false);
    }
  };

  const extractKeywords = (text: string): string[] => {
    if (!text) return [];
    // Simple keyword extraction (can be improved with NLP)
    const words = text.toLowerCase().split(/\s+/);
    const stopWords = ['der', 'die', 'das', 'und', 'oder', 'mit', 'für', 'von', 'zu', 'ist', 'sind', 'am', 'im', 'ein', 'eine', 'einen', 'dem', 'den', 'des'];
    return words
      .filter(w => w.length > 4 && !stopWords.includes(w))
      .slice(0, 5);
  };

  if (loading) {
    return <Skeleton className="h-64 w-full" />;
  }

  // Show section if there's any data
  const hasValues = values && Object.values(values).some((v: any) => v && typeof v === 'string' && v.trim());
  const hasInterview = interviewAnswers.length > 0;

  console.log('[ValuesAndInterviewSection] Render check:', {
    hasValues,
    hasInterview,
    values,
    interviewAnswersCount: interviewAnswers.length,
    profileId,
    loading
  });

  // Don't return null immediately - show empty state if no data but component is rendered
  // The parent component (ProfileView) already checks isUnlocked, so if we're here, the profile is unlocked
  if (!hasValues && !hasInterview) {
    console.log('[ValuesAndInterviewSection] No data to display');
    // Return null only if we're sure there's no data (not just loading)
    return null;
  }

  const allValuesText = values
    ? Object.values(values)
        .filter(v => v && typeof v === 'string')
        .join(' ')
    : '';

  const keywords = extractKeywords(allValuesText);

  return (
    <div className="space-y-2">
      {/* Combined Card - Compact */}
      {(hasValues || hasInterview) && (
        <Card className="p-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold">Werte & Interviewfragen</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowValuesModal(true)}
              className="h-7 text-xs px-2"
            >
              Alle anzeigen
            </Button>
          </div>
          
          {/* Values Preview */}
          {hasValues && keywords.length > 0 && (
            <div className="mb-3 pb-2 border-b">
              <p className="text-xs text-muted-foreground mb-1.5">Werteprofil</p>
              <div className="flex flex-wrap gap-1">
                {keywords.slice(0, 5).map((keyword, idx) => (
                  <span
                    key={idx}
                    className="px-1.5 py-0.5 bg-primary/10 text-primary rounded text-xs"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Interview Preview */}
          {hasInterview && (
            <div>
              <p className="text-xs text-muted-foreground mb-1.5">Interviewfragen</p>
              <div className="space-y-2">
                {interviewAnswers.slice(0, 3).map((item) => {
                  const displayText = item.answer.length > MAX_PREVIEW_LENGTH
                    ? item.answer.substring(0, MAX_PREVIEW_LENGTH) + '...'
                    : item.answer;
                  
                  return (
                    <div key={item.id} className="space-y-0.5">
                      <p className="text-xs font-medium line-clamp-1">{item.question}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {displayText}
                      </p>
                    </div>
                  );
                })}
                {interviewAnswers.length > 3 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowValuesModal(true)}
                    className="h-6 text-xs px-0 py-0 text-primary hover:text-primary/80 w-full justify-start"
                  >
                    +{interviewAnswers.length - 3} weitere Fragen anzeigen
                  </Button>
                )}
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Values & Interview Modal */}
      <Dialog open={showValuesModal} onOpenChange={(open) => {
        setShowValuesModal(open);
        // Reset expanded states when modal closes
        if (!open) {
          setExpandedValue(null);
          setExpandedInterview(null);
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader className="pb-3 border-b">
            <DialogTitle className="text-lg">Werte & Interviewfragen</DialogTitle>
          </DialogHeader>
          <Tabs 
            defaultValue={hasValues ? "values" : hasInterview ? "interview" : "values"} 
            className="flex-1 flex flex-col overflow-hidden"
          >
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="values" disabled={!hasValues}>
                Werteprofil {hasValues && `(${Object.values(values || {}).filter((v: any) => v && typeof v === 'string' && v.trim()).length})`}
              </TabsTrigger>
              <TabsTrigger value="interview" disabled={!hasInterview}>
                Interviewfragen {hasInterview && `(${interviewAnswers.length})`}
              </TabsTrigger>
            </TabsList>
            <div className="overflow-y-auto flex-1">
              <TabsContent value="values" className="mt-0 space-y-3">
                {values && Object.values(values).some((v: any) => v && typeof v === 'string' && v.trim()) ? (
                  VALUES_QUESTIONS.map((q) => {
                    const answer = values?.[q.key];
                    if (!answer || !answer.trim()) return null;
                    const isExpanded = expandedValue === q.key;
                    const needsExpansion = answer.length > MAX_MODAL_LENGTH;
                    const displayText = isExpanded 
                      ? answer 
                      : needsExpansion 
                        ? answer.substring(0, MAX_MODAL_LENGTH) + '...'
                        : answer;
                    
                    return (
                      <div key={q.key} className="border-l-2 border-primary/20 pl-3">
                        <p className="text-xs font-medium mb-1">{q.label}</p>
                        <div className="space-y-1">
                          <p className={`text-sm text-muted-foreground whitespace-pre-wrap ${!isExpanded ? 'line-clamp-1' : ''}`}>
                            {displayText}
                          </p>
                          {needsExpansion && !isExpanded && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setExpandedValue(q.key)}
                              className="h-6 text-xs px-0 py-0 text-primary hover:text-primary/80"
                            >
                              Mehr anzeigen
                            </Button>
                          )}
                          {isExpanded && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setExpandedValue(null)}
                              className="h-6 text-xs px-0 py-0 text-primary hover:text-primary/80"
                            >
                              Weniger anzeigen
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-muted-foreground">Keine Werte angegeben.</p>
                )}
              </TabsContent>
              <TabsContent value="interview" className="mt-0 space-y-3">
                {interviewAnswers.length > 0 ? (
                  interviewAnswers.map((item) => {
                    const isExpanded = expandedInterview === item.id;
                    const needsExpansion = item.answer.length > MAX_MODAL_LENGTH;
                    const displayText = isExpanded 
                      ? item.answer 
                      : needsExpansion 
                        ? item.answer.substring(0, MAX_MODAL_LENGTH) + '...'
                        : item.answer;
                    
                    return (
                      <div key={item.id} className="border-l-2 border-primary/20 pl-3">
                        <p className="text-xs font-medium mb-1">{item.question}</p>
                        <div className="space-y-1">
                          <p className={`text-sm text-muted-foreground whitespace-pre-wrap ${!isExpanded ? 'line-clamp-1' : ''}`}>
                            {displayText}
                          </p>
                          {needsExpansion && !isExpanded && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setExpandedInterview(item.id)}
                              className="h-6 text-xs px-0 py-0 text-primary hover:text-primary/80"
                            >
                              Mehr anzeigen
                            </Button>
                          )}
                          {isExpanded && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setExpandedInterview(null)}
                              className="h-6 text-xs px-0 py-0 text-primary hover:text-primary/80"
                            >
                              Weniger anzeigen
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-muted-foreground">Keine Interviewfragen beantwortet.</p>
                )}
              </TabsContent>
            </div>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}

