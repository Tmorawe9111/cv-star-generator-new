import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertCircle, Circle, Sparkles, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface JobApplicationInterviewQuestionsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  applicationId: string;
  jobId: string;
  companyId: string;
  onComplete?: () => void;
  onScheduleInterview?: (applicationId: string, jobId: string, companyId: string) => void;
}

interface QuestionWithStatus {
  id: string;
  question: string;
  position: number;
  status: 'matched' | 'similar' | 'new';
  suggestedAnswer?: string;
  matchedAnswerId?: string;
  currentAnswer?: string;
}

export function JobApplicationInterviewQuestions({
  open,
  onOpenChange,
  applicationId,
  jobId,
  companyId,
  onComplete,
  onScheduleInterview
}: JobApplicationInterviewQuestionsProps) {
  const [questions, setQuestions] = useState<QuestionWithStatus[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id || null);
    });
  }, []);

  useEffect(() => {
    if (open && applicationId && jobId) {
      loadQuestionsAndMatch();
    }
  }, [open, applicationId, jobId]);

  const loadQuestionsAndMatch = async () => {
    setLoading(true);
    try {
      // 1. Load job-specific interview questions
      // Note: role_id references job_posts.id (not job_postings.id)
      const { data: jobQuestions, error: questionsError } = await supabase
        .from('company_interview_questions')
        .select('id, question, position')
        .eq('role_id', jobId)
        .order('position', { ascending: true });

      if (questionsError) throw questionsError;

      if (!jobQuestions || jobQuestions.length === 0) {
        setQuestions([]);
        setLoading(false);
        return;
      }

      if (!userId) {
        setLoading(false);
        return;
      }

      // 2. Load user's existing interview answers (general branch-based)
      const { data: userAnswers } = await supabase
        .from('user_interview_answers')
        .select('answer, interview_questions!inner(question, id)')
        .eq('user_id', userId);

      // 3. Load already saved answers for this application
      const { data: savedAnswers, error: savedError } = await supabase
        .from('job_application_interview_answers')
        .select('answer, question_id')
        .eq('application_id', applicationId);

      // 4. Match questions with existing answers (simple text similarity)
      const matchedQuestions: QuestionWithStatus[] = jobQuestions.map((q) => {
        // Check if already answered for this application
        const saved = savedAnswers?.find(sa => sa.question_id === q.id);
        if (saved) {
          return {
            ...q,
            status: 'matched',
            currentAnswer: saved.answer
          };
        }

        // Try to find similar question in user's existing answers
        const similarAnswer = findSimilarAnswer(q.question, userAnswers || []);
        
        if (similarAnswer) {
          return {
            ...q,
            status: 'similar',
            suggestedAnswer: similarAnswer.answer,
            matchedAnswerId: similarAnswer.id
          };
        }

        return {
          ...q,
          status: 'new'
        };
      });

      setQuestions(matchedQuestions);
      
      // Pre-fill answers
      const initialAnswers: Record<string, string> = {};
      matchedQuestions.forEach(q => {
        if (q.currentAnswer) {
          initialAnswers[q.id] = q.currentAnswer;
        } else if (q.suggestedAnswer) {
          initialAnswers[q.id] = q.suggestedAnswer;
        }
      });
      setAnswers(initialAnswers);
    } catch (error) {
      console.error('Error loading questions:', error);
      toast({
        title: 'Fehler',
        description: 'Interviewfragen konnten nicht geladen werden.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Simple text similarity matching (can be enhanced with AI later)
  const findSimilarAnswer = (question: string, userAnswers: any[]): any | null => {
    if (!userAnswers || userAnswers.length === 0) return null;

    const questionLower = question.toLowerCase();
    const questionWords = questionLower.split(/\s+/).filter(w => w.length > 3);

    // Find answer with most matching keywords
    let bestMatch: any = null;
    let bestScore = 0;

    userAnswers.forEach((item: any) => {
      const answerQuestion = item.interview_questions?.question?.toLowerCase() || '';
      const answerWords = answerQuestion.split(/\s+/).filter(w => w.length > 3);
      
      // Count matching words
      const matchingWords = questionWords.filter(qw => 
        answerWords.some(aw => aw.includes(qw) || qw.includes(aw))
      );
      
      const score = matchingWords.length / Math.max(questionWords.length, 1);
      
      if (score > bestScore && score > 0.3) { // At least 30% similarity
        bestScore = score;
        bestMatch = {
          answer: item.answer,
          id: item.interview_questions?.id
        };
      }
    });

    return bestMatch;
  };

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleUseSuggestion = (questionId: string) => {
    const question = questions.find(q => q.id === questionId);
    if (question?.suggestedAnswer) {
      setAnswers(prev => ({
        ...prev,
        [questionId]: question.suggestedAnswer!
      }));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const answersToSave = questions
        .filter(q => answers[q.id]?.trim())
        .map(q => ({
          application_id: applicationId,
          question_id: q.id,
          answer: answers[q.id].trim(),
          source: q.status === 'matched' && q.currentAnswer === answers[q.id]
            ? 'user_provided' as const
            : q.status === 'similar' && q.suggestedAnswer === answers[q.id]
            ? 'ai_matched' as const
            : 'user_edited' as const,
          matched_from_answer_id: q.matchedAnswerId || null
        }));

      // Delete existing answers for this application
      await supabase
        .from('job_application_interview_answers')
        .delete()
        .eq('application_id', applicationId);

      // Insert new answers
      if (answersToSave.length > 0) {
        const { error: insertError } = await supabase
          .from('job_application_interview_answers')
          .insert(answersToSave);

        if (insertError) throw insertError;
      }

      toast({
        title: 'Gespeichert',
        description: 'Deine Interviewantworten wurden gespeichert.',
      });

      // After saving, trigger interview scheduling if callback provided
      // This allows the company to schedule an interview after questions are answered
      if (onScheduleInterview) {
        onScheduleInterview(applicationId, jobId, companyId);
      } else {
        onComplete?.();
        onOpenChange(false);
      }
    } catch (error) {
      console.error('Error saving answers:', error);
      toast({
        title: 'Fehler',
        description: 'Antworten konnten nicht gespeichert werden.',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const getStatusIcon = (status: QuestionWithStatus['status']) => {
    switch (status) {
      case 'matched':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'similar':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'new':
        return <Circle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusLabel = (status: QuestionWithStatus['status']) => {
    switch (status) {
      case 'matched':
        return 'Bereits beantwortet';
      case 'similar':
        return 'Ähnliche Antwort gefunden';
      case 'new':
        return 'Neu beantworten';
    }
  };

  const answeredCount = questions.filter(q => answers[q.id]?.trim()).length;
  const totalCount = questions.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Interviewfragen beantworten</DialogTitle>
          <DialogDescription>
            Bereite dich auf das Gespräch vor. Wir haben bereits ähnliche Antworten von dir gefunden, die du übernehmen oder anpassen kannst.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : questions.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>Für diese Stelle wurden noch keine Interviewfragen hinterlegt.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Progress */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {answeredCount} von {totalCount} Fragen beantwortet
              </span>
              <Badge variant="secondary">
                {Math.round((answeredCount / totalCount) * 100)}%
              </Badge>
            </div>

            {/* Questions */}
            <div className="space-y-4">
              {questions.map((question, index) => (
                <Card key={question.id} className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-muted-foreground">
                        Frage {index + 1}
                      </span>
                      {getStatusIcon(question.status)}
                      <Badge 
                        variant={
                          question.status === 'matched' ? 'default' :
                          question.status === 'similar' ? 'secondary' :
                          'outline'
                        }
                        className="text-xs"
                      >
                        {getStatusLabel(question.status)}
                      </Badge>
                    </div>
                  </div>

                  <Label className="text-base font-semibold mb-2 block">
                    {question.question}
                  </Label>

                  {question.status === 'similar' && question.suggestedAnswer && (
                    <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-start gap-2 mb-2">
                        <Sparkles className="h-4 w-4 text-yellow-600 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-xs font-medium text-yellow-900 mb-1">
                            Ähnliche Antwort gefunden:
                          </p>
                          <p className="text-sm text-yellow-800">
                            {question.suggestedAnswer}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUseSuggestion(question.id)}
                        className="mt-2"
                      >
                        Vorschlag übernehmen
                      </Button>
                    </div>
                  )}

                  <Textarea
                    value={answers[question.id] || ''}
                    onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                    placeholder="Deine Antwort hier..."
                    className="min-h-[100px]"
                  />
                </Card>
              ))}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Später
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={saving || answeredCount === 0}
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Speichern...
              </>
            ) : (
              `Speichern (${answeredCount}/${totalCount})`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

