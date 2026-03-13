import React, { useEffect, useMemo, useState, useRef } from 'react';
import type { FinderAudience, FinderRecommendation, RecommendationWithJobs } from '@/config/finderRecommendations';
import { getRecommendations, findBranchById, attachJobsToRecommendations } from '@/config/finderRecommendations';
import { getQuestionsForAudience, FinderQuestion } from '@/config/finderQuestions';
import { getFreeChatAnswer } from '@/config/finderKnowledge';

interface ConversationalFinderProps {
  audience: FinderAudience;
  mode?: 'wizard' | 'freechat' | 'hybrid';
  /** Kleinerer „Screenshot“-Modus für Landing-Page (weniger Höhe, kompaktere Abstände) */
  compact?: boolean;
}

type MessageRole = 'bot' | 'user';

interface Message {
  id: string;
  role: MessageRole;
  text: string;
}

type AnswerMap = Record<string, string[]>;

export const ConversationalFinder: React.FC<ConversationalFinderProps> = ({ audience, mode = 'hybrid', compact = false }) => {
  const questions = useMemo<FinderQuestion[]>(() => getQuestionsForAudience(audience), [audience]);

  const MIN_QUESTIONS_FOR_RESULT = 5;

  const chatHeight = compact ? 160 : 260;
  const cardPadding = compact ? '12px 10px 14px' : '20px 18px 22px';
  const layoutPadding = compact ? '12px 8px 16px' : '24px 16px 32px';
  const layoutMaxWidth = compact ? 380 : 760;

  const [currentQuestionId, setCurrentQuestionId] = useState<string | null>(questions[0]?.id ?? null);
  const [selectedForCurrent, setSelectedForCurrent] = useState<string[]>([]);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [messages, setMessages] = useState<Message[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [recommendations, setRecommendations] = useState<FinderRecommendation[]>([]);
  const [selectedTagsForScoring, setSelectedTagsForScoring] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [inputValue, setInputValue] = useState('');
  const isFreeChatEnabled = mode === 'freechat' || mode === 'hybrid';

  useEffect(() => {
    if (!questions.length) return;
    setCurrentQuestionId(questions[0].id);
    setSelectedForCurrent([]);
    setAnswers({});
    setIsComplete(false);
    setRecommendations([]);
    setMessages([
      {
        id: 'm-start',
        role: 'bot',
        text:
          audience === 'ausbildung'
            ? 'Hey, lass uns gemeinsam herausfinden, welche Ausbildung zu dir passt.'
            : 'Hey, lass uns schauen, welcher Job ohne Studium gut zu dir passt.',
      },
      {
        id: 'm-q0',
        role: 'bot',
        text: questions[0].text,
      },
    ]);
  }, [audience, questions]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const currentQuestion = useMemo(
    () => questions.find((q) => q.id === currentQuestionId) ?? null,
    [questions, currentQuestionId],
  );

  const handleToggleOption = (optionId: string) => {
    if (!currentQuestion) return;
    if (currentQuestion.type === 'single') {
      setSelectedForCurrent([optionId]);
    } else {
      setSelectedForCurrent((prev) =>
        prev.includes(optionId) ? prev.filter((id) => id !== optionId) : [...prev, optionId],
      );
    }
  };

  const handleNext = () => {
    if (!currentQuestion || !selectedForCurrent.length) return;

    const newAnswers: AnswerMap = {
      ...answers,
      [currentQuestion.id]: selectedForCurrent,
    };
    setAnswers(newAnswers);

    const answeredCount = Object.keys(newAnswers).length;

    const optionLabels = currentQuestion.options
      .filter((o) => selectedForCurrent.includes(o.id))
      .map((o) => o.label)
      .join(' · ');

    setMessages((prev) => [
      ...prev,
      {
        id: `m-user-${currentQuestion.id}`,
        role: 'user',
        text: optionLabels,
      },
    ]);

    const nextId = currentQuestion.next;
    if (!nextId || nextId === 'RESULT') {
      // Erst Ergebnisse zeigen, wenn genug Fragen beantwortet wurden
      if (answeredCount < MIN_QUESTIONS_FOR_RESULT) {
        const fallbackNext = questions.find((q) => !newAnswers[q.id]);
        if (fallbackNext) {
          setCurrentQuestionId(fallbackNext.id);
          setSelectedForCurrent([]);
          setMessages((prev) => [
            ...prev,
            {
              id: `m-bot-${fallbackNext.id}`,
              role: 'bot',
              text: fallbackNext.text,
            },
          ]);
          return;
        }
        // Wenn keine weitere Frage mehr vorhanden ist, trotzdem warten und keine Empfehlungen anzeigen
        return;
      }

      const allTags: string[] = [];
      Object.entries(newAnswers).forEach(([questionId, optionIds]) => {
        const q = questions.find((qq) => qq.id === questionId);
        if (!q) return;
        q.options.forEach((opt) => {
          if (optionIds.includes(opt.id)) {
            allTags.push(...opt.tags);
          }
        });
      });

      const uniqueTags = Array.from(new Set(allTags));
      setSelectedTagsForScoring(uniqueTags);

      const recs = getRecommendations(audience, uniqueTags);
      setRecommendations(recs);
      setIsComplete(true);
      setCurrentQuestionId(null);

      setMessages((prev) => [
        ...prev,
        {
          id: 'm-result',
          role: 'bot',
          text:
            audience === 'ausbildung'
              ? 'Danke dir! Das hier passt besonders gut zu dir:'
              : 'Stark, danke für deine Antworten. Diese Jobs passen gut zu dir:',
        },
      ]);

      return;
    }

    const nextQuestion = questions.find((q) => q.id === nextId);
    if (!nextQuestion) {
      setIsComplete(true);
      return;
    }

    setCurrentQuestionId(nextQuestion.id);
    setSelectedForCurrent([]);
    setMessages((prev) => [
      ...prev,
      {
        id: `m-bot-${nextQuestion.id}`,
        role: 'bot',
        text: nextQuestion.text,
      },
    ]);
  };

  const handleRestart = () => {
    if (!questions.length) return;
    setCurrentQuestionId(questions[0].id);
    setSelectedForCurrent([]);
    setAnswers({});
    setIsComplete(false);
    setRecommendations([]);
    setMessages((prev) => prev.slice(0, 1).concat({ id: 'm-q0-restart', role: 'bot', text: questions[0].text }));
  };

  const handleSendFreeQuestion = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;

    setMessages((prev) => [
      ...prev,
      {
        id: `m-user-free-${Date.now()}`,
        role: 'user',
        text: trimmed,
      },
    ]);

    const answer = getFreeChatAnswer(trimmed, audience);

    setMessages((prev) => [
      ...prev,
      {
        id: `m-bot-free-${Date.now()}`,
        role: 'bot',
        text: answer.text,
      },
    ]);

    const mergedTags = Array.from(new Set([...selectedTagsForScoring, ...(answer.tags ?? [])]));
    setSelectedTagsForScoring(mergedTags);

    const recs = getRecommendations(audience, mergedTags);
    setRecommendations(recs);
    setIsComplete(true);

    setInputValue('');
  };

  return (
    <div
      className="finder-layout"
      style={{
        maxWidth: layoutMaxWidth,
        margin: '0 auto',
        padding: layoutPadding,
      }}
    >
      <div
        style={{
          borderRadius: compact ? 18 : 24,
          border: '1px solid rgba(255,255,255,.12)',
          background: 'rgba(15,23,42,.92)',
          boxShadow: '0 20px 60px rgba(15,23,42,.75)',
          padding: cardPadding,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: compact ? 8 : 10, marginBottom: compact ? 10 : 16 }}>
          <div
            style={{
              width: compact ? 28 : 34,
              height: compact ? 28 : 34,
              borderRadius: '50%',
              background: 'linear-gradient(135deg,#5170ff,#7c3aed)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 800,
              fontSize: compact ? 13 : 16,
            }}
          >
            B
          </div>
          <div>
            <p style={{ margin: 0, fontSize: compact ? 11 : 13, fontWeight: 700, color: 'white' }}>
              BeVisiblle Coach
            </p>
            <p style={{ margin: 0, fontSize: compact ? 10 : 11, color: 'rgba(255,255,255,.6)' }}>
              {audience === 'ausbildung' ? 'Ausbildungsfinder' : 'Job-Finder ohne Studium'}
            </p>
          </div>
        </div>

        <div
          style={{
            height: chatHeight,
            overflowY: 'auto',
            padding: compact ? '4px 2px 6px' : '6px 2px 10px',
            display: 'flex',
            flexDirection: 'column',
            gap: compact ? 6 : 8,
          }}
          ref={scrollRef}
        >
          {messages.map((m) => (
            <div
              key={m.id}
              style={{
                display: 'flex',
                justifyContent: m.role === 'bot' ? 'flex-start' : 'flex-end',
              }}
            >
              <div
                style={{
                  maxWidth: '85%',
                  fontSize: compact ? 11 : 13,
                  lineHeight: 1.45,
                  padding: compact ? '6px 9px' : '8px 11px',
                  borderRadius: compact ? 12 : 14,
                  background:
                    m.role === 'bot'
                      ? 'rgba(15,23,42,1)'
                      : 'linear-gradient(135deg,rgba(81,112,255,.95),rgba(124,58,237,.95))',
                  color: m.role === 'bot' ? 'rgba(255,255,255,.9)' : 'white',
                  border:
                    m.role === 'bot' ? '1px solid rgba(255,255,255,.12)' : '1px solid rgba(191,219,254,.35)',
                }}
              >
                {m.text}
              </div>
            </div>
          ))}
        </div>

        {!isComplete && currentQuestion && (
          <div style={{ marginTop: compact ? 8 : 12, borderTop: '1px solid rgba(30,64,175,.6)', paddingTop: compact ? 10 : 14 }}>
            {currentQuestion.subtext && (
              <p style={{ fontSize: compact ? 10 : 11, color: 'rgba(255,255,255,.6)', margin: '0 0 6px' }}>
                {currentQuestion.subtext}
              </p>
            )}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: compact ? 6 : 8,
                marginBottom: compact ? 8 : 10,
              }}
            >
              {currentQuestion.options.map((opt) => {
                const active = selectedForCurrent.includes(opt.id);
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleToggleOption(opt.id)}
                    style={{
                      borderRadius: 999,
                      border: active ? '1px solid rgba(81,112,255,.6)' : '1px solid rgba(255,255,255,.2)',
                      background: active ? 'rgba(81,112,255,.15)' : 'rgba(15,23,42,1)',
                      color: active ? 'rgba(255,255,255,.95)' : 'rgba(255,255,255,.7)',
                      padding: compact ? '5px 10px' : '7px 12px',
                      fontSize: compact ? 11 : 12,
                      fontWeight: 500,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: compact ? 10 : 11, color: 'rgba(255,255,255,.5)' }}>
                {questions.findIndex((q) => q.id === currentQuestion.id) + 1} / {questions.length}
              </span>
              <button
                type="button"
                onClick={handleNext}
                disabled={!selectedForCurrent.length}
                style={{
                  borderRadius: 999,
                  border: 'none',
                  background: selectedForCurrent.length
                    ? 'linear-gradient(135deg,#5170ff,#7c3aed)'
                    : 'rgba(51,65,85,.9)',
                  color: 'white',
                  padding: compact ? '6px 12px' : '8px 16px',
                  fontSize: compact ? 12 : 13,
                  fontWeight: 600,
                  cursor: selectedForCurrent.length ? 'pointer' : 'default',
                  opacity: selectedForCurrent.length ? 1 : 0.6,
                }}
              >
                Weiter
              </button>
            </div>
          </div>
        )}

        {isFreeChatEnabled && isComplete && (
          <div style={{ marginTop: compact ? 10 : 14, borderTop: '1px solid rgba(30,64,175,.6)', paddingTop: compact ? 8 : 10 }}>
            {!compact && (
              <p style={{ margin: '0 0 6px', fontSize: 11, color: 'rgba(255,255,255,.6)' }}>
                Du kannst auch eigene Fragen stellen – z.B. „Welche Jobs passen mit wenig Deutsch?“
              </p>
            )}
            <div style={{ display: 'flex', gap: compact ? 6 : 8, marginBottom: compact ? 6 : 8 }}>
              <input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSendFreeQuestion();
                  }
                }}
                placeholder={
                  audience === 'ausbildung'
                    ? 'Frag z.B.: „Welche Ausbildung passt?“'
                    : 'Frag z.B.: „Welche Jobs ohne Ausbildung?“'
                }
                style={{
                  flex: 1,
                  borderRadius: 999,
                  border: '1px solid rgba(255,255,255,.2)',
                  background: 'rgba(15,23,42,1)',
                  color: 'rgba(255,255,255,.9)',
                  padding: compact ? '6px 10px' : '8px 12px',
                  fontSize: compact ? 11 : 12,
                  outline: 'none',
                }}
              />
              <button
                type="button"
                onClick={handleSendFreeQuestion}
                style={{
                  borderRadius: 999,
                  border: 'none',
                  background: 'linear-gradient(135deg,#5170ff,#7c3aed)',
                  color: 'white',
                  padding: compact ? '6px 12px' : '8px 14px',
                  fontSize: compact ? 11 : 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                Fragen
              </button>
            </div>
            {!compact && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 2 }}>
                {(audience === 'ausbildung'
                  ? [
                      'Welche Ausbildung passt, wenn ich gern mit Menschen arbeite?',
                      'Geht Ausbildung auch in Teilzeit?',
                      'Was, wenn meine Noten schlecht sind?',
                    ]
                  : [
                      'Welche Jobs passen ohne Ausbildung?',
                      'Was kann ich mit wenig Deutsch machen?',
                      'Ich will schnell Geld verdienen – was passt?',
                    ]
                ).map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => {
                      setInputValue(q);
                    }}
                    style={{
                      borderRadius: 999,
                      border: '1px solid rgba(255,255,255,.2)',
                      background: 'rgba(15,23,42,1)',
                      color: 'rgba(255,255,255,.85)',
                      padding: '5px 10px',
                      fontSize: 11,
                      cursor: 'pointer',
                    }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {isComplete && (() => {
          const recsWithJobs = attachJobsToRecommendations(recommendations, selectedTagsForScoring.length ? selectedTagsForScoring : ['pflege','handwerk','buero','service','logistik']);
          const displayRecs = compact ? recsWithJobs.slice(0, 2) : recsWithJobs;
          return (
          <div style={{ marginTop: compact ? 12 : 18, borderTop: '1px solid rgba(30,64,175,.6)', paddingTop: compact ? 12 : 16 }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr',
                gap: compact ? 8 : 12,
              }}
            >
              {displayRecs.map(({ recommendation: rec, jobs }) => {
                const branch = findBranchById(rec.branchId);
                return (
                  <div
                    key={rec.id}
                    style={{
                      borderRadius: compact ? 12 : 16,
                      border: '1px solid rgba(255,255,255,.12)',
                      background: 'rgba(15,23,42,.95)',
                      padding: compact ? '10px 12px' : '12px 14px',
                      display: 'flex',
                      gap: compact ? 8 : 10,
                    }}
                  >
                    {branch && (
                      <div
                        style={{
                          width: compact ? 32 : 40,
                          height: compact ? 32 : 40,
                          borderRadius: compact ? 10 : 12,
                          background: branch.accent,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontWeight: 800,
                          fontSize: compact ? 13 : 16,
                          flexShrink: 0,
                        }}
                      >
                        {branch.title.charAt(0)}
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          margin: '0 0 2px',
                          fontSize: compact ? 12 : 14,
                          fontWeight: 700,
                          color: 'white',
                        }}
                      >
                        {rec.title}
                      </p>
                      <p style={{ margin: '0 0 2px', fontSize: compact ? 10 : 12, color: 'rgba(255,255,255,.6)', lineHeight: 1.4 }}>{rec.summary}</p>
                      {!compact && (
                        <p style={{ margin: '0 0 6px', fontSize: 11, color: 'rgba(255,255,255,.6)' }}>
                          <span style={{ fontWeight: 600, color: 'rgba(255,255,255,.9)' }}>Warum es passt: </span>
                          {rec.whyMatch}
                        </p>
                      )}
                      {!compact && rec.recommendedTraining && (
                        <p style={{ margin: '0 0 8px', fontSize: 11, color: 'rgba(96,165,250,1)' }}>
                          Tipp: {rec.recommendedTraining.hint}
                        </p>
                      )}
                      {!compact && jobs.length > 0 && (
                        <div style={{ marginBottom: 8 }}>
                          <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,.9)' }}>
                            Konkrete Vorschläge:
                          </p>
                          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {jobs.map(({ job, score }) => (
                              <li key={job.id} style={{ fontSize: 11, color: 'rgba(255,255,255,.6)' }}>
                                <span style={{ fontWeight: 600, color: 'rgba(255,255,255,.9)' }}>{job.title}</span>
                                {Number.isFinite(score) && (
                                  <span style={{ marginLeft: 6, fontSize: 10, color: '#5170ff' }}>
                                    · Match {Math.max(0, Math.min(100, score))}%
                                  </span>
                                )}
                                <br />
                                {job.description}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: compact ? 6 : 8, marginTop: compact ? 2 : 4 }}>
                        <a
                          href={rec.link}
                          style={{
                            borderRadius: 999,
                            border: 'none',
                            background: 'rgba(255,255,255,.08)',
                            color: 'white',
                            padding: compact ? '5px 10px' : '7px 14px',
                            fontSize: compact ? 11 : 12,
                            fontWeight: 600,
                            textDecoration: 'none',
                          }}
                        >
                          Mehr Einblicke
                        </a>
                        {!compact && (
                        <a
                          href="/community"
                          style={{
                            borderRadius: 999,
                            border: '1px solid rgba(255,255,255,.2)',
                            background: 'transparent',
                            color: 'rgba(255,255,255,.9)',
                            padding: '7px 14px',
                            fontSize: 12,
                            fontWeight: 500,
                            textDecoration: 'none',
                          }}
                        >
                          Community öffnen
                        </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div
              style={{
                marginTop: compact ? 10 : 14,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 10,
                flexWrap: 'wrap',
              }}
            >
              <p style={{ margin: 0, fontSize: compact ? 10 : 11, color: 'rgba(255,255,255,.6)' }}>
                Noch unsicher? In der Community erzählen Azubis und Fachkräfte aus ihrem Alltag.
              </p>
              <button
                type="button"
                onClick={handleRestart}
                style={{
                  borderRadius: 999,
                  border: '1px solid rgba(255,255,255,.2)',
                  background: 'rgba(15,23,42,1)',
                  color: 'rgba(255,255,255,.9)',
                  padding: compact ? '5px 10px' : '6px 12px',
                  fontSize: compact ? 10 : 11,
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                Nochmal von vorn starten
              </button>
            </div>
          </div>
          );
        })()}
      </div>
    </div>
  );
};

export default ConversationalFinder;

