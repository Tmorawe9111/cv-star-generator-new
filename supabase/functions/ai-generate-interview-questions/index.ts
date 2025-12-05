import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'LOVABLE_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { jobTitle, description, tasks, requirements } = await req.json();

    if (!jobTitle) {
      return new Response(
        JSON.stringify({ error: 'jobTitle is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const prompt = `Du bist ein Experte für Recruiting und Interview-Fragen.

Erstelle 5 passende Interview-Fragen für folgende Stellenanzeige:

**Stellentitel:** ${jobTitle}
${description ? `**Beschreibung:**\n${description}\n` : ''}
${tasks ? `**Aufgaben:**\n${tasks}\n` : ''}
${requirements ? `**Anforderungen:**\n${requirements}\n` : ''}

**Anforderungen an die Fragen:**
- 5 Fragen insgesamt
- Fragen sollten spezifisch auf diese Stelle zugeschnitten sein
- Mix aus fachlichen und persönlichen Fragen
- Fragen sollten helfen, Motivation, Eignung und Teamfähigkeit zu prüfen
- Formuliere die Fragen so, dass Kandidaten sie schriftlich beantworten können
- Verwende die Du-Form
- Jede Frage sollte in einem Satz formuliert sein (max. 20 Wörter)

**Beispiele für gute Fragen:**
- "Warum möchtest du in dieser Branche arbeiten?"
- "Wie gehst du mit stressigen Situationen um?"
- "Was bedeutet für dich gute Teamarbeit?"
- "Welche Erfahrungen bringst du mit, die für diese Stelle relevant sind?"

Gib die Fragen als JSON-Array zurück: ["Frage 1", "Frage 2", ...]`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'Du bist ein Experte für Recruiting und Interview-Fragen.' },
          { role: 'user', content: prompt }
        ],
        tools: [{
          type: "function",
          function: {
            name: "return_interview_questions",
            description: "Returniere 5 Interview-Fragen als Array",
            parameters: {
              type: "object",
              properties: {
                questions: {
                  type: "array",
                  items: { type: "string" },
                  minItems: 5,
                  maxItems: 5,
                  description: "Genau 5 Interview-Fragen als String-Array"
                }
              },
              required: ["questions"]
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "return_interview_questions" } }
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
    let questions: string[] = [];

    // Try tool calling response first
    if (data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments) {
      const toolArgs = JSON.parse(data.choices[0].message.tool_calls[0].function.arguments);
      questions = toolArgs.questions || [];
    } else if (data.choices?.[0]?.message?.content) {
      // Fallback: try to parse JSON from content
      try {
        const content = data.choices[0].message.content.trim();
        // Remove markdown code blocks if present
        const jsonMatch = content.match(/```(?:json)?\s*(\[[\s\S]*\])\s*```/) || content.match(/(\[[\s\S]*\])/);
        if (jsonMatch) {
          questions = JSON.parse(jsonMatch[1]);
        } else {
          // Try parsing the whole content as JSON
          questions = JSON.parse(content);
        }
      } catch (e) {
        console.error('Failed to parse AI response:', e);
        // Fallback: split by newlines and filter
        const lines = data.choices[0].message.content.split('\n').filter((line: string) => 
          line.trim() && !line.match(/^[\d\-\.\s]+$/)
        );
        questions = lines.slice(0, 5).map((line: string) => line.replace(/^[\d\-\.\)]\s*/, '').trim());
      }
    }

    if (!Array.isArray(questions) || questions.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Ungültiges Format der AI-Antwort' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Ensure we have exactly 5 questions
    if (questions.length < 5) {
      // Pad with generic questions if needed
      const genericQuestions = [
        "Warum möchtest du in dieser Branche arbeiten?",
        "Wie gehst du mit Herausforderungen um?",
        "Was bedeutet für dich gute Teamarbeit?",
        "Welche Stärken bringst du für diese Stelle mit?",
        "Wie stellst du dir deine berufliche Zukunft vor?"
      ];
      questions = [...questions, ...genericQuestions.slice(questions.length)];
    }

    return new Response(
      JSON.stringify({ questions: questions.slice(0, 5) }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in ai-generate-interview-questions:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

