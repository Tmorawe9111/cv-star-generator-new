import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Pencil } from 'lucide-react';

const VALUES_QUESTIONS = [
  'Was ist dir in einem Team am wichtigsten – und warum?',
  'Wie möchtest du behandelt werden, wenn etwas nicht gut läuft?',
  'Worauf können Kollegen und Vorgesetzte sich bei dir verlassen?',
  'Was motiviert dich langfristig in einem Job?',
  'Wie gehst du mit stressigen Situationen oder Druck um?',
  'Welche Art von Arbeitsumgebung bringt dein bestes Potenzial hervor?',
  'Was bedeutet für dich „Respekt" am Arbeitsplatz?',
  'Was erwartest du grundsätzlich von einem guten Arbeitgeber?',
];

interface ValuesReviewProps {
  values: Record<string, string>;
  interviewAnswers: Array<{ question: string; answer: string; id: number }>;
  showValuesOnly?: boolean;
  showInterviewOnly?: boolean;
  onEditValue: (key: string, value: string) => void;
  onEditInterview: (questionId: number, value: string) => void;
  onSave: () => void;
  onBack: () => void;
}

export function ValuesReview({
  values,
  interviewAnswers,
  showValuesOnly = false,
  showInterviewOnly = false,
  onEditValue,
  onEditInterview,
  onSave,
  onBack,
}: ValuesReviewProps) {
  const [editingValue, setEditingValue] = useState<string | null>(null);
  const [editingInterview, setEditingInterview] = useState<number | null>(null);
  const [tempValue, setTempValue] = useState('');

  const handleEditValue = (key: string) => {
    setEditingValue(key);
    setTempValue(values[key] || '');
  };

  const handleSaveValue = (key: string) => {
    onEditValue(key, tempValue);
    setEditingValue(null);
  };

  const handleEditInterview = (questionId: number, currentAnswer: string) => {
    setEditingInterview(questionId);
    setTempValue(currentAnswer);
  };

  const handleSaveInterview = (questionId: number) => {
    onEditInterview(questionId, tempValue);
    setEditingInterview(null);
  };

  return (
    <div className="w-full space-y-4">
      <div className="text-center mb-4">
        <h2 className="text-lg font-semibold mb-1">
          Übersicht deiner Antworten
        </h2>
        <p className="text-xs text-muted-foreground">
          Überprüfe deine Antworten und passe sie bei Bedarf an.
        </p>
      </div>

      {/* Values Section - Only show if not interview-only */}
      {!showInterviewOnly && (
        <Card className="p-3">
          <h3 className="text-sm font-semibold mb-3">Werte & Arbeitsweise</h3>
          <Accordion type="single" collapsible className="w-full">
            {VALUES_QUESTIONS.map((question, index) => {
              const key = `q${index + 1}`;
              const isEditing = editingValue === key;
              const hasAnswer = values[key]?.trim();

              return (
                <AccordionItem key={key} value={key}>
                  <AccordionTrigger className="text-left text-sm">
                    <span className="font-medium">{question}</span>
                    {!hasAnswer && (
                      <Badge variant="outline" className="ml-2 text-xs text-muted-foreground">
                        Übersprungen
                      </Badge>
                    )}
                  </AccordionTrigger>
                  <AccordionContent>
                    {isEditing ? (
                      <div className="space-y-2">
                        <Textarea
                          value={tempValue}
                          onChange={(e) => setTempValue(e.target.value)}
                          className="min-h-[80px] text-sm"
                          placeholder="Frage überspringen (leer lassen)"
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleSaveValue(key)}
                            className="h-7 text-xs"
                          >
                            Speichern
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingValue(null);
                              setTempValue('');
                            }}
                            className="h-7 text-xs"
                          >
                            Abbrechen
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-between items-start">
                        <p className="text-muted-foreground flex-1 text-sm">
                          {hasAnswer || 'Nicht beantwortet (wird für Unternehmen nicht angezeigt)'}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditValue(key)}
                          className="h-7 w-7 p-0"
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </Card>
      )}

      {/* Interview Questions Section - Only show if not values-only */}
      {!showValuesOnly && interviewAnswers.length > 0 && (
        <Card className="p-3">
          <h3 className="text-sm font-semibold mb-3">Interviewfragen</h3>
          <Accordion type="single" collapsible className="w-full">
            {interviewAnswers.map((item) => {
              const isEditing = editingInterview === item.id;
              const hasAnswer = item.answer?.trim();

              return (
                <AccordionItem key={item.id} value={`interview-${item.id}`}>
                  <AccordionTrigger className="text-left text-sm">
                    <span className="font-medium">{item.question}</span>
                    {!hasAnswer && (
                      <Badge variant="outline" className="ml-2 text-xs text-muted-foreground">
                        Übersprungen
                      </Badge>
                    )}
                  </AccordionTrigger>
                  <AccordionContent>
                    {isEditing ? (
                      <div className="space-y-2">
                        <Textarea
                          value={tempValue}
                          onChange={(e) => setTempValue(e.target.value)}
                          className="min-h-[80px] text-sm"
                          placeholder="Frage überspringen (leer lassen)"
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleSaveInterview(item.id)}
                            className="h-7 text-xs"
                          >
                            Speichern
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingInterview(null);
                              setTempValue('');
                            }}
                            className="h-7 text-xs"
                          >
                            Abbrechen
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-between items-start">
                        <p className="text-muted-foreground flex-1 text-sm">
                          {hasAnswer || 'Nicht beantwortet (wird für Unternehmen nicht angezeigt)'}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditInterview(item.id, item.answer || '')}
                          className="h-7 w-7 p-0"
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </Card>
      )}

      {/* Actions */}
      <div className="flex justify-between pt-2">
        <Button variant="outline" onClick={onBack} size="sm" className="h-8 text-xs">
          Zurück
        </Button>
        <Button onClick={onSave} className="bg-primary h-8 text-xs">
          Speichern
        </Button>
      </div>
    </div>
  );
}

