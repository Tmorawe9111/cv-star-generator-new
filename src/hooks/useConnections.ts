import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTrackInteraction } from "@/hooks/useTrackInteraction";

export type ConnectionState = "none" | "pending" | "incoming" | "accepted" | "declined";

export const useConnections = () => {
  const { user } = useAuth();
  const { track } = useTrackInteraction();

  const getStatuses = useCallback(async (targetIds: string[]) => {
    if (!user || targetIds.length === 0) return {} as Record<string, ConnectionState>;

    const result: Record<string, ConnectionState> = {};

    // Outgoing
    const { data: outData } = await supabase
      .from("connections")
      .select("addressee_id,status")
      .eq("requester_id", user.id)
      .in("addressee_id", targetIds);

    outData?.forEach((r) => {
      if (r.status === "accepted") result[r.addressee_id] = "accepted";
      else if (r.status === "pending") result[r.addressee_id] = "pending";
      else result[r.addressee_id] = "declined";
    });

    // Incoming
    const { data: inData } = await supabase
      .from("connections")
      .select("requester_id,status")
      .eq("addressee_id", user.id)
      .in("requester_id", targetIds);

    inData?.forEach((r) => {
      if (r.status === "accepted") result[r.requester_id] = "accepted";
      else if (r.status === "pending") result[r.requester_id] = "incoming";
      else result[r.requester_id] = "declined";
    });

    // Fill defaults
    targetIds.forEach((id) => {
      if (!result[id]) result[id] = "none";
    });

    return result;
  }, [user]);

  const requestConnection = useCallback(async (targetId: string, profileMetadata?: { branche?: string; region?: string; berufsfeld?: string }) => {
    if (!user) throw new Error("not-authenticated");
    
    // Check if connection already exists
    const { data: existing } = await supabase
      .from("connections")
      .select("id, status")
      .eq("requester_id", user.id)
      .eq("addressee_id", targetId)
      .maybeSingle();
    
    if (existing) {
      // If declined, update to pending (resend request)
      if (existing.status === "declined") {
        const { error } = await supabase
          .from("connections")
          .update({ status: "pending" })
          .eq("id", existing.id);
        if (error) throw error;
        return;
      }
      // If already pending or accepted, don't create duplicate
      if (existing.status === "pending") {
        return; // Already pending, no error
      }
      if (existing.status === "accepted") {
        return; // Already connected, no error
      }
    }
    
    // Create new connection
    const { error } = await supabase
      .from("connections")
      .insert({ requester_id: user.id, addressee_id: targetId, status: "pending" });
    
    // Track connection request for personalization
    track('connect', 'profile', targetId, profileMetadata || {});
    
    if (error) {
      // If duplicate key error, connection might exist in reverse direction
      if (error.code === '23505') {
        // Check reverse direction
        const { data: reverse } = await supabase
          .from("connections")
          .select("id, status")
          .eq("requester_id", targetId)
          .eq("addressee_id", user.id)
          .maybeSingle();
        
        if (reverse && reverse.status === "declined") {
          // Update reverse connection to pending
          const { error: updateError } = await supabase
            .from("connections")
            .update({ status: "pending" })
            .eq("id", reverse.id);
          if (updateError) throw updateError;
          return;
        }
      }
      throw error;
    }
  }, [user]);

  const acceptRequest = useCallback(async (fromUserId: string) => {
    if (!user) throw new Error("not-authenticated");
    const { error } = await supabase
      .from("connections")
      .update({ status: "accepted" })
      .eq("requester_id", fromUserId)
      .eq("addressee_id", user.id)
      .eq("status", "pending");
    if (error) throw error;
  }, [user]);

  const declineRequest = useCallback(async (fromUserId: string) => {
    if (!user) throw new Error("not-authenticated");
    const { error } = await supabase
      .from("connections")
      .update({ status: "declined" })
      .eq("requester_id", fromUserId)
      .eq("addressee_id", user.id)
      .eq("status", "pending");
    if (error) throw error;
  }, [user]);

  const cancelRequest = useCallback(async (targetId: string) => {
    if (!user) throw new Error("not-authenticated");
    const { error } = await supabase
      .from("connections")
      .delete()
      .eq("requester_id", user.id)
      .eq("addressee_id", targetId)
      .eq("status", "pending");
    if (error) throw error;
  }, [user]);

  const isConnected = useCallback(async (targetId: string) => {
    if (!user) return false;
    const { data } = await supabase
      .from("connections")
      .select("requester_id,addressee_id,status")
      .or(`and(requester_id.eq.${user.id},addressee_id.eq.${targetId}),and(addressee_id.eq.${user.id},requester_id.eq.${targetId})`)
      .maybeSingle();
    return data?.status === "accepted";
  }, [user]);

  return { getStatuses, requestConnection, acceptRequest, declineRequest, cancelRequest, isConnected };
};
