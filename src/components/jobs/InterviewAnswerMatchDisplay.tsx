import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { AlertCircle, CheckCircle2, Info, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InterviewAnswerMatchDisplayProps {
  applicationId: string;
  jobId?: string;
}

interface MatchResult {
  questionId: string;
  question: string;
  candidateAnswer: string;
  expectedAnswer: string;
  matchScore: number;
  matchedKeywords: string[];
  matchMethod: string;
  matchDetails?: {
    confidence?: number;
    reasoning?: string;
  };
}

export function InterviewAnswerMatchDisplay({ applicationId, jobId }: InterviewAnswerMatchDisplayProps) {
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [overallScore, setOverallScore] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMatchResults();
  }, [applicationId, jobId]);

  const loadMatchResults = async () => {
    try {
      // Load all interview answers for this application
      const { data: answers, error: answersError } = await supabase
        .from('job_application_interview_answers')
        .select(`
          id,
          answer,
          question_id,
          company_interview_questions!inner(
            id,
            question
          )
        `)
        .eq('application_id', applicationId);

      if (answersError) throw answersError;

      if (!answers || answers.length === 0) {
        setMatches([]);
        setLoading(false);
        return;
      }

      // Load match results
      const answerIds = answers.map(a => a.id);
      const { data: matchResults, error: matchError } = await supabase
        .from('job_application_interview_answer_matches')
        .select(`
          match_score,
          match_method,
          matched_keywords,
          match_details,
          application_answer_id,
          company_interview_question_expected_answers!inner(
            id,
            expected_answer,
            question_id
          )
        `)
        .in('application_answer_id', answerIds);

      if (matchError) throw matchError;

      // Combine answers with match results
      const combinedMatches: MatchResult[] = answers.map((answer: any) => {
        const match = matchResults?.find((m: any) => m.application_answer_id === answer.id);
        const question = answer.company_interview_questions;
        const expectedAnswer = match?.company_interview_question_expected_answers;

        return {
          questionId: question.id,
          question: question.question,
          candidateAnswer: answer.answer,
          expectedAnswer: expectedAnswer?.expected_answer || '',
          matchScore: match?.match_score || 0,
          matchedKeywords: match?.matched_keywords || [],
          matchMethod: match?.match_method || 'none',
          matchDetails: match?.match_details || {}
        };
      });

      setMatches(combinedMatches);

      // Calculate overall score
      const { data: overallScoreData } = await supabase.rpc('calculate_application_interview_match_score', {
        p_application_id: applicationId
      });

      setOverallScore(overallScoreData);
    } catch (error) {
      console.error('Error loading match results:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreBadgeVariant = (score: number): "default" | "secondary" | "destructive" | "outline" => {
    if (score >= 80) return 'default';
    if (score >= 60) return 'secondary';
    return 'destructive';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">Lädt Matching-Ergebnisse...</div>
        </CardContent>
      </Card>
    );
  }

  if (matches.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <Info className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p>Noch keine Interview-Antworten vorhanden oder keine erwarteten Antworten definiert.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Overall Score */}
      {overallScore !== null && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5" />
              Gesamt-Match-Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="text-4xl font-bold" style={{ color: `var(--color-${getScoreColor(overallScore).replace('text-', '').replace('-600', '')})` }}>
                {overallScore.toFixed(0)}%
              </div>
              <div className="flex-1">
                <Progress value={overallScore} className="h-3" />
                <p className="text-sm text-muted-foreground mt-2">
                  Durchschnittliche Übereinstimmung mit erwarteten Antworten
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Individual Question Matches */}
      <div className="space-y-3">
        {matches.map((match, index) => (
          <Card key={match.questionId} className={cn(
            "transition-all",
            match.matchScore >= 80 && "border-green-200 dark:border-green-800",
            match.matchScore >= 60 && match.matchScore < 80 && "border-yellow-200 dark:border-yellow-800",
            match.matchScore < 60 && "border-red-200 dark:border-red-800"
          )}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <CardTitle className="text-sm font-medium mb-1">
                    Frage {index + 1}: {match.question}
                  </CardTitle>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant={getScoreBadgeVariant(match.matchScore)} className="text-xs">
                      {match.matchScore}% Match
                    </Badge>
                    {match.matchMethod === 'ai_semantic' && (
                      <Badge variant="outline" className="text-xs">
                        AI-bewertet
                      </Badge>
                    )}
                  </div>
                </div>
                {match.matchScore >= 80 ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                ) : match.matchScore >= 60 ? (
                  <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Candidate Answer */}
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Kandidaten-Antwort:</Label>
                <div className="p-3 bg-muted rounded-lg text-sm">
                  {match.candidateAnswer}
                </div>
              </div>

              {/* Expected Answer (only visible to companies) */}
              {match.expectedAnswer && (
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">
                    Erwartete Antwort (nur für Sie sichtbar):
                  </Label>
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg text-sm">
                    {match.expectedAnswer}
                  </div>
                </div>
              )}

              {/* Matched Keywords */}
              {match.matchedKeywords.length > 0 && (
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Gefundene Schlüsselwörter:</Label>
                  <div className="flex flex-wrap gap-1">
                    {match.matchedKeywords.map((keyword, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Reasoning */}
              {match.matchDetails?.reasoning && (
                <div className="p-2 bg-muted rounded text-xs text-muted-foreground">
                  <strong>Bewertung:</strong> {match.matchDetails.reasoning}
                </div>
              )}

              {/* Progress Bar */}
              <Progress value={match.matchScore} className="h-2" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

