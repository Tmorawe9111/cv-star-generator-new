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
    
    // Check if connection already exists in EITHER direction (due to unique constraint)
    // The unique constraint uniq_connections_pair prevents both (A,B) and (B,A) from existing
    // Use a query that checks both directions
    const { data: existingConnections } = await supabase
      .from("connections")
      .select("requester_id, addressee_id, status")
      .or(`and(requester_id.eq.${user.id},addressee_id.eq.${targetId}),and(requester_id.eq.${targetId},addressee_id.eq.${user.id})`)
      .maybeSingle();
    
    if (existingConnections) {
      const isOutgoing = existingConnections.requester_id === user.id;
      const isIncoming = existingConnections.addressee_id === user.id;
      
      // If already accepted, nothing to do
      if (existingConnections.status === "accepted") {
        return; // Already connected, no error
      }
      
      // If already pending in outgoing direction, nothing to do
      if (existingConnections.status === "pending" && isOutgoing) {
        return; // Already pending, no error
      }
      
      // If incoming pending request exists, accept it instead of creating new
      if (existingConnections.status === "pending" && isIncoming) {
        // Accept the incoming request
        const { error } = await supabase
          .from("connections")
          .update({ status: "accepted" })
          .eq("requester_id", targetId)
          .eq("addressee_id", user.id);
        if (error) throw error;
        return;
      }
      
      // If declined, update to pending (resend request)
      if (existingConnections.status === "declined") {
        // If it was in reverse direction, we need to swap requester/addressee
        if (isIncoming) {
          // Delete old connection and create new one in correct direction
          const { error: deleteError } = await supabase
            .from("connections")
            .delete()
            .eq("requester_id", targetId)
            .eq("addressee_id", user.id);
          if (deleteError) throw deleteError;
          
          // Create new connection in correct direction
          const { error: insertError } = await supabase
            .from("connections")
            .insert({ requester_id: user.id, addressee_id: targetId, status: "pending" });
          if (insertError) throw insertError;
        } else {
          // Update existing declined connection to pending
          const { error } = await supabase
            .from("connections")
            .update({ status: "pending" })
            .eq("requester_id", user.id)
            .eq("addressee_id", targetId);
          if (error) throw error;
        }
        return;
      }
    }
    
    // No existing connection - create new one
    const { error } = await supabase
      .from("connections")
      .insert({ requester_id: user.id, addressee_id: targetId, status: "pending" });
    
    // Track connection request for personalization
    track('connect', 'profile', targetId, profileMetadata || {});
    
    if (error) {
      // If duplicate key error, connection might exist in reverse direction (race condition)
      if (error.code === '23505') {
        // Check again for existing connection
        const { data: checkAgain } = await supabase
          .from("connections")
          .select("requester_id, addressee_id, status")
          .or(`and(requester_id.eq.${user.id},addressee_id.eq.${targetId}),and(requester_id.eq.${targetId},addressee_id.eq.${user.id})`)
          .maybeSingle();
        
        if (checkAgain) {
          // Connection exists now - handle based on status
          if (checkAgain.status === "pending" && checkAgain.addressee_id === user.id) {
            // Incoming request - accept it
            const { error: acceptError } = await supabase
              .from("connections")
              .update({ status: "accepted" })
              .eq("requester_id", targetId)
              .eq("addressee_id", user.id);
            if (acceptError) throw acceptError;
            return;
          }
          // Otherwise, connection already exists in desired state
          return;
        }
      }
      throw error;
    }
  }, [user, track]);

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
