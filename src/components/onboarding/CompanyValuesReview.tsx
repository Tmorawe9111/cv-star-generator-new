import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Pencil } from 'lucide-react';

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

interface CompanyValuesReviewProps {
  values: Record<string, string>;
  roleExpectations?: Record<string, string>;
  interviewQuestions?: Array<{ question: string; position: number }>;
  showValuesOnly?: boolean;
  showRoleExpectationsOnly?: boolean;
  showInterviewOnly?: boolean;
  onEditValue: (key: string, value: string) => void;
  onEditRoleExpectation: (key: string, value: string) => void;
  onEditInterviewQuestion: (index: number, question: string) => void;
  onSave: () => void;
  onBack: () => void;
}

export function CompanyValuesReview({
  values,
  roleExpectations = {},
  interviewQuestions = [],
  showValuesOnly = false,
  showRoleExpectationsOnly = false,
  showInterviewOnly = false,
  onEditValue,
  onEditRoleExpectation,
  onEditInterviewQuestion,
  onSave,
  onBack,
}: CompanyValuesReviewProps) {
  const [editingValue, setEditingValue] = useState<string | null>(null);
  const [editingRoleExpectation, setEditingRoleExpectation] = useState<string | null>(null);
  const [editingInterview, setEditingInterview] = useState<number | null>(null);
  const [tempValue, setTempValue] = useState('');

  const handleEditValue = (key: string) => {
    setEditingValue(key);
    setTempValue(values[key] || '');
  };

  const handleSaveValue = (key: string) => {
    onEditValue(key, tempValue);
    setEditingValue(null);
    setTempValue('');
  };

  const handleEditRoleExpectation = (key: string) => {
    setEditingRoleExpectation(key);
    setTempValue(roleExpectations[key] || '');
  };

  const handleSaveRoleExpectation = (key: string) => {
    onEditRoleExpectation(key, tempValue);
    setEditingRoleExpectation(null);
    setTempValue('');
  };

  const handleEditInterview = (index: number) => {
    setEditingInterview(index);
    setTempValue(interviewQuestions[index]?.question || '');
  };

  const handleSaveInterview = (index: number) => {
    onEditInterviewQuestion(index, tempValue);
    setEditingInterview(null);
    setTempValue('');
  };

  return (
    <div className="w-full space-y-4">
      <div className="text-center mb-4">
        <h2 className="text-lg font-semibold mb-1">
          Übersicht Ihrer Angaben
        </h2>
        <p className="text-xs text-muted-foreground">
          Überprüfen Sie Ihre Angaben und passe sie bei Bedarf an.
        </p>
      </div>

      {/* Values Section */}
      {!showRoleExpectationsOnly && !showInterviewOnly && (
        <Card className="p-3">
          <h3 className="text-sm font-semibold mb-3">Unternehmenswerte</h3>
          <Accordion type="single" collapsible className="w-full">
            {COMPANY_VALUES_QUESTIONS.map((q) => {
              const key = q.key;
              const isEditing = editingValue === key;
              const hasAnswer = values[key]?.trim();

              return (
                <AccordionItem key={key} value={key}>
                  <AccordionTrigger className="text-left text-sm">
                    <span className="font-medium">{q.label}</span>
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
                          {hasAnswer || 'Nicht beantwortet (wird für Bewerber nicht angezeigt)'}
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

      {/* Role Expectations Section */}
      {!showValuesOnly && !showInterviewOnly && Object.keys(roleExpectations).length > 0 && (
        <Card className="p-3">
          <h3 className="text-sm font-semibold mb-3">Erwartungen an neue Mitarbeitende</h3>
          <Accordion type="single" collapsible className="w-full">
            {Object.entries(roleExpectations)
              .filter(([key]) => key !== 'role_id')
              .map(([key, value]) => {
                const isEditing = editingRoleExpectation === key;
                const hasAnswer = value?.trim();

                return (
                  <AccordionItem key={key} value={key}>
                    <AccordionTrigger className="text-left text-sm">
                      <span className="font-medium">{ROLE_EXPECTATIONS_LABELS[key] || key}</span>
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
                              onClick={() => handleSaveRoleExpectation(key)}
                              className="h-7 text-xs"
                            >
                              Speichern
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingRoleExpectation(null);
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
                            {hasAnswer || 'Nicht beantwortet (wird für Bewerber nicht angezeigt)'}
                          </p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditRoleExpectation(key)}
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

      {/* Interview Questions Section */}
      {!showValuesOnly && !showRoleExpectationsOnly && interviewQuestions.length > 0 && (
        <Card className="p-3">
          <h3 className="text-sm font-semibold mb-3">Interviewfragen</h3>
          <Accordion type="single" collapsible className="w-full">
            {interviewQuestions.map((item, index) => {
              const isEditing = editingInterview === index;
              const hasAnswer = item.question?.trim();

              return (
                <AccordionItem key={index} value={`interview-${index}`}>
                  <AccordionTrigger className="text-left text-sm">
                    <span className="font-medium">Frage {index + 1}</span>
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
                            onClick={() => handleSaveInterview(index)}
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
                          {hasAnswer || 'Nicht beantwortet (wird für Bewerber nicht angezeigt)'}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditInterview(index)}
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

