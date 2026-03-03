import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ParseCVInput {
  userInput: string;
  currentData?: Record<string, any>;
  context?: {
    flowType: 'voice' | 'chat';
    conversationHistory?: any[];
    branche?: string;
  };
}

interface ParseCVOutput {
  extractedData: Record<string, any>;
  confidence: {
    overall: number;
    fields: Record<string, number>;
  };
  autoEnhancements: {
    skills: string[];
    qualifications: string[];
    bulletPoints: Record<string, string[]>;
    aboutMe?: string;
  };
  missingCritical: string[];
  missingFields: string[]; // All missing important fields
  followUpChips?: {
    question: string;
    options: string[] | null;
    field: string;
  }[];
}

const CRITICAL_FIELDS = ['vorname', 'nachname', 'branche', 'status'];
const IMPORTANT_FIELDS = [
  'vorname', 'nachname', 'email', 'telefon', 'plz', 'ort', 'strasse',
  'branche', 'status', 'geburtsdatum',
  'schulbildung', 'berufserfahrung', 'faehigkeiten', 'sprachen'
];
const BRANCHE_SKILLS_MAP: Record<string, string[]> = {
  handwerk: ['Handwerkliches Geschick', 'Teamfähigkeit', 'Körperliche Belastbarkeit', 'Zuverlässigkeit', 'Sorgfältiges Arbeiten'],
  it: ['Programmierung', 'Problemlösung', 'Logisches Denken', 'Teamarbeit', 'Lernbereitschaft'],
  gesundheit: ['Empathie', 'Belastbarkeit', 'Teamfähigkeit', 'Verantwortungsbewusstsein', 'Kommunikationsfähigkeit'],
  buero: ['Organisationsfähigkeit', 'MS Office', 'Kommunikation', 'Teamarbeit', 'Zeitmanagement'],
  verkauf: ['Kundenorientierung', 'Kommunikation', 'Verkaufstalent', 'Freundlichkeit', 'Überzeugungskraft'],
  gastronomie: ['Serviceorientierung', 'Belastbarkeit', 'Teamfähigkeit', 'Freundlichkeit', 'Schnelle Auffassungsgabe'],
};

function calculateConfidence(extractedData: Record<string, any>, userInput: string): { overall: number; fields: Record<string, number> } {
  const fields: Record<string, number> = {};
  let totalConfidence = 0;
  let fieldCount = 0;

  for (const [key, value] of Object.entries(extractedData)) {
    if (!value || (Array.isArray(value) && value.length === 0)) {
      fields[key] = 0;
    } else if (typeof value === 'string' && value.length < 3) {
      fields[key] = 50;
    } else {
      fields[key] = 85;
    }
    totalConfidence += fields[key];
    fieldCount++;
  }

  return {
    overall: fieldCount > 0 ? Math.round(totalConfidence / fieldCount) : 0,
    fields
  };
}

function findMissingCritical(extractedData: Record<string, any>): string[] {
  return CRITICAL_FIELDS.filter(field => !extractedData[field] || extractedData[field] === '');
}

function findMissingFields(extractedData: Record<string, any>): string[] {
  const missing: string[] = [];
  
  for (const field of IMPORTANT_FIELDS) {
    const value = extractedData[field];
    
    // Check if field is missing or empty
    if (!value || value === '') {
      missing.push(field);
    } else if (Array.isArray(value) && value.length === 0) {
      // For array fields, check if array is empty
      missing.push(field);
    } else if (typeof value === 'object' && Object.keys(value).length === 0) {
      // For object fields, check if object is empty
      missing.push(field);
    }
  }
  
  return missing;
}

function generateChips(missingFields: string[]): ParseCVOutput['followUpChips'] {
  const chips: ParseCVOutput['followUpChips'] = [];

  if (missingFields.includes('status')) {
    chips.push({
      question: 'Bist du gerade Schüler, Azubi oder ausgelernt?',
      options: ['Schüler', 'Azubi', 'Ausgelernt'],
      field: 'status'
    });
  }

  if (missingFields.includes('branche')) {
    chips.push({
      question: 'In welcher Branche möchtest du arbeiten?',
      options: ['Handwerk', 'IT', 'Gesundheit', 'Büro', 'Verkauf', 'Gastronomie', 'Bau', 'Logistik'],
      field: 'branche'
    });
  }

  if (missingFields.includes('vorname') || missingFields.includes('nachname')) {
    chips.push({
      question: 'Wie heißt du? (Vor- und Nachname)',
      options: null,
      field: 'name'
    });
  }

  return chips;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== AI Parse CV Chat Smart - Start ===');
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('ERROR: LOVABLE_API_KEY not configured');
      return new Response(JSON.stringify({ 
        error: 'Server configuration error: LOVABLE_API_KEY missing',
        details: 'Please configure LOVABLE_API_KEY in Supabase secrets'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { userInput, currentData = {}, context }: ParseCVInput = await req.json();

    if (!userInput) {
      console.error('ERROR: No userInput provided');
      return new Response(JSON.stringify({ 
        error: 'userInput is required',
        details: 'Please provide text input for CV parsing'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Parsing user input, length:', userInput.length);

    const tools = [{
      type: 'function',
      function: {
        name: 'extract_cv_data',
        description: 'Extract structured CV data from user input',
        parameters: {
          type: 'object',
          properties: {
            vorname: { type: 'string', description: 'First name' },
            nachname: { type: 'string', description: 'Last name' },
            email: { type: 'string', description: 'Email address' },
            phone: { type: 'string', description: 'Phone number' },
            geburtsdatum: { type: 'string', description: 'Date of birth (DD.MM.YYYY)' },
            geburtsort: { type: 'string', description: 'Place of birth' },
            nationalitaet: { type: 'string', description: 'Nationality' },
            status: { 
              type: 'string', 
              enum: ['schueler', 'azubi', 'ausgelernt', 'student'],
              description: 'Current employment status'
            },
            branche: { type: 'string', description: 'Industry/field of interest' },
            berufserfahrung: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  position: { type: 'string' },
                  firma: { type: 'string' },
                  von: { type: 'string' },
                  bis: { type: 'string' },
                  beschreibung: { type: 'string' }
                }
              }
            },
            schulbildung: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  schule: { type: 'string' },
                  abschluss: { type: 'string' },
                  von: { type: 'string' },
                  bis: { type: 'string' }
                }
              }
            },
            sprachen: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  sprache: { type: 'string' },
                  niveau: { type: 'string' }
                }
              }
            }
          },
          required: ['vorname']
        }
      }
    }];

    console.log('Calling Lovable AI...');
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `Du bist ein präziser CV-Daten-Extraktor. Extrahiere strukturierte Lebenslauf-Daten aus dem User-Input.
            
Wichtige Regeln:
- Extrahiere nur explizit genannte Informationen
- Bei fehlenden Daten: Feld leer lassen
- Datum-Format: DD.MM.YYYY
- Status: schueler, azubi, ausgelernt, student
- Branche in deutscher Sprache
- Bei Dialekt/Umgangssprache: Normalisiere zu Hochdeutsch

Bereits vorhandene Daten: ${JSON.stringify(currentData)}`
          },
          {
            role: 'user',
            content: userInput
          }
        ],
        tools,
        tool_choice: { type: 'function', function: { name: 'extract_cv_data' } }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API Error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          error: 'Rate limit exceeded',
          details: 'Too many requests. Please try again in a moment.'
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      throw new Error(`AI API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    console.log('AI Response received');
    
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall || toolCall.function.name !== 'extract_cv_data') {
      console.error('No structured data in response:', JSON.stringify(data, null, 2));
      throw new Error('AI did not return structured CV data');
    }

    const extractedData = JSON.parse(toolCall.function.arguments);
    console.log('Extracted data:', extractedData);

    const mergedData = { ...currentData, ...extractedData };
    const confidence = calculateConfidence(mergedData, userInput);
    const missingCritical = findMissingCritical(mergedData);
    const missingFields = findMissingFields(mergedData);
    const followUpChips = missingCritical.length > 0 ? generateChips(missingCritical) : undefined;

    const branche = (mergedData.branche || '').toLowerCase();
    const skills = BRANCHE_SKILLS_MAP[branche] || BRANCHE_SKILLS_MAP['handwerk'];

    const qualifications: string[] = [];
    if (mergedData.schulbildung && Array.isArray(mergedData.schulbildung)) {
      mergedData.schulbildung.forEach((s: any) => {
        if (s.abschluss) qualifications.push(s.abschluss);
      });
    }

    const bulletPoints: Record<string, string[]> = {};
    if (mergedData.berufserfahrung && Array.isArray(mergedData.berufserfahrung)) {
      mergedData.berufserfahrung.forEach((exp: any, idx: number) => {
        if (exp.position && exp.beschreibung) {
          bulletPoints[`job_${idx}`] = [exp.beschreibung];
        }
      });
    }

    const output: ParseCVOutput = {
      extractedData: mergedData,
      confidence,
      autoEnhancements: {
        skills: skills.slice(0, 5),
        qualifications,
        bulletPoints,
        aboutMe: undefined
      },
      missingCritical,
      missingFields,
      followUpChips
    };

    console.log('✅ CV parsing complete. Confidence:', confidence.overall);
    console.log('=== AI Parse CV Chat Smart - Success ===');

    return new Response(JSON.stringify(output), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (err) {
    console.error('❌ Error in ai-parse-cv-chat-smart:', err);
    console.error('Error stack:', err instanceof Error ? err.stack : 'No stack');
    
    return new Response(JSON.stringify({
      error: err instanceof Error ? err.message : 'Unknown error occurred',
      type: 'parse_cv_error',
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
