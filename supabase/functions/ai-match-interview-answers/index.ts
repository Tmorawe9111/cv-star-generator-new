import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface MatchRequest {
  applicationAnswerId?: string;
  applicationId?: string;
  candidateAnswer: string;
  expectedAnswer: string;
  questionId: string;
  keywords?: string[];
  importanceWeight?: number;
}

interface MatchResult {
  matchScore: number; // 0-100
  matchedKeywords: string[];
  confidence: number; // 0-1
  reasoning?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'LOVABLE_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { applicationAnswerId, applicationId, candidateAnswer, expectedAnswer, questionId, keywords = [], importanceWeight = 1.0 }: MatchRequest = await req.json();

    if (!candidateAnswer || !expectedAnswer || !questionId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: candidateAnswer, expectedAnswer, questionId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Matching interview answer:', { questionId, candidateAnswer: candidateAnswer.substring(0, 100), expectedAnswer: expectedAnswer.substring(0, 100) });

    // Get question text for context
    const { data: question } = await supabase
      .from('company_interview_questions')
      .select('question')
      .eq('id', questionId)
      .single();

    const questionText = question?.question || '';

    // AI-based semantic matching
    const prompt = `Du bist ein Experte für Recruiting und Bewertung von Interview-Antworten.

**Frage:** ${questionText}

**Erwartete Antwort (Ideal):**
${expectedAnswer}
${keywords.length > 0 ? `\n**Wichtige Schlüsselwörter:** ${keywords.join(', ')}` : ''}

**Kandidaten-Antwort:**
${candidateAnswer}

**Aufgabe:**
Bewerte, wie gut die Kandidaten-Antwort mit der erwarteten Antwort übereinstimmt. Berücksichtige dabei:
1. Semantische Ähnlichkeit (Bedeutung, nicht nur Wortwahl)
2. Vollständigkeit der Antwort
3. Relevanz für die Frage
4. Präsenz wichtiger Schlüsselwörter (falls vorhanden)
5. Qualität und Tiefe der Antwort

Gib eine Bewertung von 0-100 zurück, wobei:
- 90-100: Exzellente Übereinstimmung, alle wichtigen Punkte abgedeckt
- 70-89: Gute Übereinstimmung, die meisten wichtigen Punkte vorhanden
- 50-69: Mittlere Übereinstimmung, einige wichtige Punkte fehlen
- 30-49: Schwache Übereinstimmung, viele wichtige Punkte fehlen
- 0-29: Sehr schwache Übereinstimmung, kaum relevante Inhalte

Gib auch an, welche Schlüsselwörter gefunden wurden (falls vorhanden) und eine kurze Begründung.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'Du bist ein Experte für Recruiting und Bewertung von Interview-Antworten. Du bewertest objektiv und fair.' },
          { role: 'user', content: prompt }
        ],
        tools: [{
          type: "function",
          function: {
            name: "evaluate_match",
            description: "Bewertet die Übereinstimmung zwischen Kandidaten-Antwort und erwarteter Antwort",
            parameters: {
              type: "object",
              properties: {
                matchScore: {
                  type: "number",
                  minimum: 0,
                  maximum: 100,
                  description: "Match-Score von 0-100"
                },
                matchedKeywords: {
                  type: "array",
                  items: { type: "string" },
                  description: "Gefundene Schlüsselwörter aus der Kandidaten-Antwort"
                },
                confidence: {
                  type: "number",
                  minimum: 0,
                  maximum: 1,
                  description: "Konfidenz der Bewertung (0-1)"
                },
                reasoning: {
                  type: "string",
                  description: "Kurze Begründung der Bewertung"
                }
              },
              required: ["matchScore", "matchedKeywords", "confidence"]
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "evaluate_match" } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit überschritten. Bitte versuche es später erneut.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: 'AI service error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    let matchResult: MatchResult;

    // Parse AI response
    if (data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments) {
      const toolArgs = JSON.parse(data.choices[0].message.tool_calls[0].function.arguments);
      matchResult = {
        matchScore: Math.round(toolArgs.matchScore || 0),
        matchedKeywords: toolArgs.matchedKeywords || [],
        confidence: toolArgs.confidence || 0.8,
        reasoning: toolArgs.reasoning
      };
    } else {
      // Fallback: simple keyword matching
      const matchedKeywords = keywords.filter(kw => 
        candidateAnswer.toLowerCase().includes(kw.toLowerCase())
      );
      const keywordScore = keywords.length > 0 
        ? (matchedKeywords.length / keywords.length) * 50 
        : 0;
      
      matchResult = {
        matchScore: Math.round(keywordScore),
        matchedKeywords,
        confidence: 0.5,
        reasoning: 'Fallback-Bewertung basierend auf Schlüsselwörtern'
      };
    }

    // Ensure match score is between 0-100
    matchResult.matchScore = Math.max(0, Math.min(100, matchResult.matchScore));

    // Save match result to database if applicationAnswerId is provided
    if (applicationAnswerId) {
      // Get expected answer ID
      const { data: expectedAnswerData } = await supabase
        .from('company_interview_question_expected_answers')
        .select('id')
        .eq('question_id', questionId)
        .maybeSingle();

      if (expectedAnswerData) {
        const { error: matchError } = await supabase
          .from('job_application_interview_answer_matches')
          .upsert({
            application_answer_id: applicationAnswerId,
            expected_answer_id: expectedAnswerData.id,
            match_score: matchResult.matchScore,
            match_method: 'ai_semantic',
            matched_keywords: matchResult.matchedKeywords,
            match_details: {
              confidence: matchResult.confidence,
              reasoning: matchResult.reasoning,
              ai_model: 'google/gemini-2.5-flash'
            }
          }, {
            onConflict: 'application_answer_id,expected_answer_id'
          });

        if (matchError) {
          console.error('Error saving match result:', matchError);
        } else {
          console.log('Match result saved successfully');
          
          // Recalculate overall application match score if applicationId is provided
          if (applicationId) {
            const { data: overallScore } = await supabase.rpc('calculate_application_interview_match_score', {
              p_application_id: applicationId
            });
            
            console.log('Overall interview match score:', overallScore);
          }
        }
      }
    }

    return new Response(
      JSON.stringify(matchResult),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in ai-match-interview-answers:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

