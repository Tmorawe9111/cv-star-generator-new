import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { X, Plus, Info } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface QuestionWithExpectedAnswer {
  questionId: string;
  question: string;
  expectedAnswer?: string;
  keywords?: string[];
  importanceWeight?: number;
}

interface CompanyInterviewExpectedAnswersProps {
  questionId: string;
  question: string;
  onSave: (expectedAnswer: string, keywords: string[], importanceWeight: number) => Promise<void>;
  onCancel: () => void;
}

export function CompanyInterviewExpectedAnswers({
  questionId,
  question,
  onSave,
  onCancel,
}: CompanyInterviewExpectedAnswersProps) {
  const { user } = useAuth();
  const [expectedAnswer, setExpectedAnswer] = useState('');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState('');
  const [importanceWeight, setImportanceWeight] = useState(1.0);
  const [loading, setLoading] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(true);

  useEffect(() => {
    loadExistingExpectedAnswer();
  }, [questionId]);

  const loadExistingExpectedAnswer = async () => {
    try {
      const { data, error } = await supabase
        .from('company_interview_question_expected_answers')
        .select('*')
        .eq('question_id', questionId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error loading expected answer:', error);
        return;
      }

      if (data) {
        setExpectedAnswer(data.expected_answer || '');
        setKeywords(data.keywords || []);
        setImportanceWeight(data.importance_weight || 1.0);
      }
    } catch (error) {
      console.error('Error loading expected answer:', error);
    } finally {
      setLoadingExisting(false);
    }
  };

  const handleAddKeyword = () => {
    const trimmed = keywordInput.trim().toLowerCase();
    if (trimmed && !keywords.includes(trimmed)) {
      setKeywords([...keywords, trimmed]);
      setKeywordInput('');
    }
  };

  const handleRemoveKeyword = (keyword: string) => {
    setKeywords(keywords.filter(k => k !== keyword));
  };

  const handleSave = async () => {
    if (!expectedAnswer.trim()) {
      toast({
        title: 'Fehler',
        description: 'Bitte geben Sie eine erwartete Antwort ein.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      await onSave(expectedAnswer, keywords, importanceWeight);
      toast({
        title: 'Erfolgreich',
        description: 'Erwartete Antwort wurde gespeichert.',
      });
    } catch (error: any) {
      toast({
        title: 'Fehler',
        description: error.message || 'Fehler beim Speichern der erwarteten Antwort.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loadingExisting) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">Lädt...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Erwartete Antwort definieren</CardTitle>
        <CardDescription>
          Diese Antwort ist nur für Recruiter sichtbar und wird für das Matching verwendet.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Question Display */}
        <div className="p-3 bg-muted rounded-lg">
          <Label className="text-xs text-muted-foreground mb-1 block">Frage:</Label>
          <p className="text-sm font-medium">{question}</p>
        </div>

        {/* Expected Answer */}
        <div className="space-y-2">
          <Label htmlFor="expected-answer">
            Erwartete/Ideale Antwort *
          </Label>
          <Textarea
            id="expected-answer"
            value={expectedAnswer}
            onChange={(e) => setExpectedAnswer(e.target.value)}
            placeholder="Beschreiben Sie, welche Antwort Sie von einem idealen Kandidaten erwarten würden..."
            className="min-h-[120px]"
          />
          <p className="text-xs text-muted-foreground">
            Diese Antwort wird verwendet, um Kandidaten-Antworten zu bewerten. Sie ist nicht für Kandidaten sichtbar.
          </p>
        </div>

        {/* Keywords */}
        <div className="space-y-2">
          <Label htmlFor="keywords">Schlüsselwörter (optional)</Label>
          <div className="flex gap-2">
            <Input
              id="keywords"
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddKeyword();
                }
              }}
              placeholder="Schlüsselwort eingeben..."
              className="flex-1"
            />
            <Button type="button" variant="outline" onClick={handleAddKeyword} size="sm">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {keywords.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {keywords.map((keyword) => (
                <Badge key={keyword} variant="secondary" className="flex items-center gap-1">
                  {keyword}
                  <button
                    type="button"
                    onClick={() => handleRemoveKeyword(keyword)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            Wichtige Begriffe, die in einer guten Antwort enthalten sein sollten.
          </p>
        </div>

        {/* Importance Weight */}
        <div className="space-y-2">
          <Label htmlFor="importance-weight">
            Gewichtung: {importanceWeight.toFixed(1)}x
          </Label>
          <input
            id="importance-weight"
            type="range"
            min="0.5"
            max="2.0"
            step="0.1"
            value={importanceWeight}
            onChange={(e) => setImportanceWeight(parseFloat(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Weniger wichtig (0.5x)</span>
            <span>Standard (1.0x)</span>
            <span>Sehr wichtig (2.0x)</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Wie wichtig ist diese Frage für die Gesamtbewertung?
          </p>
        </div>

        {/* Info Box */}
        <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-blue-800 dark:text-blue-300">
              <p className="font-medium mb-1">Wie funktioniert das Matching?</p>
              <p>
                Die Antworten der Kandidaten werden mit Ihrer erwarteten Antwort verglichen. 
                Je ähnlicher die Antworten sind, desto höher ist der Match-Score. 
                Die Gewichtung bestimmt, wie stark diese Frage in die Gesamtbewertung einfließt.
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onCancel} disabled={loading}>
            Abbrechen
          </Button>
          <Button onClick={handleSave} disabled={loading || !expectedAnswer.trim()}>
            {loading ? 'Speichert...' : 'Speichern'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

