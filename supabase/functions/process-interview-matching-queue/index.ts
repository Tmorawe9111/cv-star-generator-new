import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(
        JSON.stringify({ error: 'Missing Supabase configuration' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get pending items from queue (limit to 10 at a time)
    const { data: queueItems, error: queueError } = await supabase
      .from('interview_answer_matching_queue')
      .select(`
        id,
        answer_id,
        application_id,
        question_id,
        job_application_interview_answers!inner(
          id,
          answer,
          question_id
        ),
        company_interview_questions!inner(
          id,
          question
        )
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(10);

    if (queueError) {
      console.error('Error fetching queue:', queueError);
      return new Response(
        JSON.stringify({ error: 'Error fetching queue' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!queueItems || queueItems.length === 0) {
      return new Response(
        JSON.stringify({ processed: 0, message: 'No items in queue' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let processed = 0;
    let failed = 0;

    // Process each item
    for (const item of queueItems) {
      try {
        // Mark as processing
        await supabase
          .from('interview_answer_matching_queue')
          .update({ status: 'processing' })
          .eq('id', item.id);

        const answer = item.job_application_interview_answers as any;
        const question = item.company_interview_questions as any;

        // Get expected answer
        const { data: expectedAnswer } = await supabase
          .from('company_interview_question_expected_answers')
          .select('*')
          .eq('question_id', item.question_id)
          .maybeSingle();

        if (!expectedAnswer) {
          // No expected answer defined, mark as completed
          await supabase
            .from('interview_answer_matching_queue')
            .update({ 
              status: 'completed',
              processed_at: new Date().toISOString()
            })
            .eq('id', item.id);
          processed++;
          continue;
        }

        // Call matching Edge Function
        const matchResponse = await fetch(`${SUPABASE_URL}/functions/v1/ai-match-interview-answers`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            applicationAnswerId: answer.id,
            applicationId: item.application_id,
            candidateAnswer: answer.answer,
            expectedAnswer: expectedAnswer.expected_answer,
            questionId: item.question_id,
            keywords: expectedAnswer.keywords || [],
            importanceWeight: expectedAnswer.importance_weight || 1.0
          })
        });

        if (!matchResponse.ok) {
          const errorText = await matchResponse.text();
          throw new Error(`Matching failed: ${errorText}`);
        }

        // Mark as completed
        await supabase
          .from('interview_answer_matching_queue')
          .update({ 
            status: 'completed',
            processed_at: new Date().toISOString()
          })
          .eq('id', item.id);

        processed++;
      } catch (error: any) {
        console.error(`Error processing queue item ${item.id}:`, error);
        
        // Mark as failed
        await supabase
          .from('interview_answer_matching_queue')
          .update({ 
            status: 'failed',
            error_message: error.message,
            processed_at: new Date().toISOString()
          })
          .eq('id', item.id);
        
        failed++;
      }
    }

    return new Response(
      JSON.stringify({ 
        processed, 
        failed,
        total: queueItems.length,
        message: `Processed ${processed} items, ${failed} failed`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in process-interview-matching-queue:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

