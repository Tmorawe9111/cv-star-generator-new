// Utility to retrieve Stripe checkout session details
import { supabase } from "@/integrations/supabase/client";

export interface StripeSessionData {
  id: string;
  payment_status: string;
  subscription?: string | null;
  customer?: string | null;
  metadata: {
    kind?: string;
    companyId?: string;
    plan?: string;
    interval?: string;
    packageId?: string;
    subscriptionId?: string;
    customerId?: string;
  };
}

/**
 * Retrieve Stripe checkout session via Edge Function
 */
export async function getStripeSession(sessionId: string): Promise<StripeSessionData | null> {
  try {
    const { data, error } = await supabase.functions.invoke('get-stripe-session', {
      body: { sessionId },
    });

    if (error) {
      console.error('Error fetching Stripe session:', error);
      return null;
    }

    return data as StripeSessionData;
  } catch (error) {
    console.error('Error fetching Stripe session:', error);
    return null;
  }
}

