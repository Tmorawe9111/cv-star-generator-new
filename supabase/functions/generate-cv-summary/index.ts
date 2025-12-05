import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CVData {
  vorname?: string;
  ort?: string;
  branche?: string;
  status?: string;
  motivation?: string;
  kenntnisse?: string;
  praktische_erfahrung?: string;
  faehigkeiten?: string[];
  sprachen?: Array<{ sprache: string; niveau: string }>;
}

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { cvData }: { cvData: CVData & { id?: string } } = await req.json();

    // Generate Berufswunsch based on branche and status
    const getBerufswunsch = (branche?: string, status?: string) => {
      const brancheMap = {
        handwerk: 'Handwerk',
        it: 'IT',
        gesundheit: 'Gesundheit & Pflege',
        buero: 'Büro & Verwaltung',
        verkauf: 'Verkauf & Handel',
        gastronomie: 'Gastronomie & Service',
        bau: 'Bau & Architektur'
      };
      
      const statusMap = {
        schueler: 'Ausbildung',
        azubi: 'Weiterbildung',
        ausgelernt: 'Berufstätigkeit'
      };

      return `${statusMap[status as keyof typeof statusMap] || 'Ausbildung'} im Bereich ${brancheMap[branche as keyof typeof brancheMap] || 'diverse Bereiche'}`;
    };

    // Process languages intelligently
    const getSprachenSummary = (sprachen?: Array<{ sprache: string; niveau: string }>) => {
      if (!sprachen || sprachen.length === 0) return '';
      
      if (sprachen.length <= 3) {
        return sprachen.map(s => `${s.sprache} (${s.niveau})`).join(', ');
      }
      
      const highLevel = sprachen.filter(s => 
        s.niveau === 'C1' || s.niveau === 'C2' || s.niveau === 'Muttersprache'
      );
      
      if (highLevel.length >= 2) {
        return `mehrsprachig mit fließenden Kenntnissen in ${highLevel.length} Sprachen`;
      }
      
      return `${sprachen.length} Sprachen`;
    };

    // Get top 3 skills
    const getTopSkills = (faehigkeiten?: string[]) => {
      if (!faehigkeiten || faehigkeiten.length === 0) return '';
      return faehigkeiten.slice(0, 3).join(', ');
    };

    // Map questions based on branche
    const getQuestionAnswers = (cvData: CVData) => {
      return {
        frage1: cvData.motivation || '',
        frage2: cvData.kenntnisse || '',
        frage3: cvData.praktische_erfahrung || ''
      };
    };

    const questions = getQuestionAnswers(cvData);
    const topSkills = getTopSkills(cvData.faehigkeiten);
    const sprachenSummary = getSprachenSummary(cvData.sprachen);
    const berufswunsch = getBerufswunsch(cvData.branche, cvData.status);

    // Enhanced context from education and work experience
    const getAusbildungInfo = (data: CVData) => {
      if (!data.schulbildung || data.schulbildung.length === 0) return 'keine Angaben';
      const latestSchool = data.schulbildung[0];
      return `${latestSchool.schulform} an ${latestSchool.name}${latestSchool.zeitraum_bis ? ` (bis ${latestSchool.zeitraum_bis})` : ''}`;
    };

    const getBerufserfahrungInfo = (data: CVData) => {
      if (!data.berufserfahrung || data.berufserfahrung.length === 0) return 'keine praktischen Erfahrungen bisher';
      const latestJob = data.berufserfahrung[0];
      return `${latestJob.titel} bei ${latestJob.unternehmen}`;
    };

    // Load user values and interview answers for context
    let valuesContext = '';
    let interviewContext = '';
    
    try {
      const { data: valuesData } = await supabase
        .from('user_values')
        .select('*')
        .eq('user_id', cvData.id)
        .single();
      
      if (valuesData) {
        const valuesText = [
          valuesData.q1_team,
          valuesData.q2_conflict,
          valuesData.q3_reliable,
          valuesData.q4_motivation,
          valuesData.q5_stress,
          valuesData.q6_environment,
          valuesData.q7_respect,
          valuesData.q8_expectations,
        ]
          .filter(v => v && v.trim())
          .join(' ');
        
        if (valuesText) {
          valuesContext = `\n\nWERTE & ARBEITSWEISE (für Kontext, nicht direkt zitieren):\n${valuesText}`;
        }
      }

      const { data: interviewData } = await supabase
        .from('user_interview_answers')
        .select('answer, interview_questions!inner(question)')
        .eq('user_id', cvData.id);
      
      if (interviewData && interviewData.length > 0) {
        const interviewText = interviewData
          .map((item: any) => `${item.interview_questions.question}: ${item.answer}`)
          .join('\n');
        
        if (interviewText) {
          interviewContext = `\n\nINTERVIEW-ANTWORTEN (für Kontext, nicht direkt zitieren):\n${interviewText}`;
        }
      }
    } catch (error) {
      console.error('Error loading values/interview:', error);
      // Continue without values/interview context
    }

    const prompt = `Du bist ein Karriereberater für junge Menschen in Deutschland. Erstelle eine präzise, kurze "Über mich" Zusammenfassung für einen Lebenslauf.

PERSON:
- Name: ${cvData.vorname || 'Unbekannt'}
- Status: ${cvData.status === 'schueler' ? 'Schüler/in' : cvData.status === 'azubi' ? 'Auszubildende/r' : 'Berufstätig'}
- Branche: ${cvData.branche || 'keine Angabe'}
- Berufswunsch: ${berufswunsch}

AUSBILDUNG & BERUF:
- Schulbildung: ${getAusbildungInfo(cvData)}
- Berufserfahrung: ${getBerufserfahrungInfo(cvData)}

TOP 3 FÄHIGKEITEN:
${(cvData.faehigkeiten || []).slice(0, 3).join(', ') || 'keine Angaben'}

SPRACHEN:
${sprachenSummary || 'keine Angaben'}${valuesContext}${interviewContext}

ANFORDERUNGEN:
1. Maximal 250 Zeichen
2. Erste Person Singular ("Ich bin...")
3. Konkrete Bezugnahme auf die TOP 3 Fähigkeiten
4. Erwähne Sprachkenntnisse wenn relevant
5. Fokus auf einzigartige Stärken
6. Keine generischen Phrasen
7. Professionell aber authentisch
8. Sehr präzise und auf den Punkt
9. Nutze die Werte & Interview-Antworten als Inspiration für authentische Formulierungen, aber zitiere sie nicht direkt

WICHTIG: Halte dich strikt an das 250 Zeichen Limit!

Erstelle jetzt die Zusammenfassung:`;

    // Sending prompt to Lovable AI Gateway (Google Gemini 2.5 Flash - FREE)

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'Du bist ein erfahrener Karriereberater für junge Menschen in Deutschland. Du verfasst authentische, bodenständige und ehrliche Lebenslauftexte. Schreibe immer in der ersten Person und halte dich strikt an maximal 250 Zeichen. Nutze konkrete Informationen aus dem Profil und vermeide generische Floskeln.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 100,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      throw new Error(`Lovable AI API error: ${response.status}`);
    }

    const data = await response.json();
    const generatedText = data.choices[0].message.content.trim();

    // CV summary generated successfully

    return new Response(JSON.stringify({ 
      success: true,
      summary: generatedText 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-cv-summary function:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});