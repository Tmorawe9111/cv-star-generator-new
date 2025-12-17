import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useConnections, type ConnectionState } from "@/hooks/useConnections";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, UserPlus, Check, X, MessageSquareMore, ArrowLeft, HandHeart, Lock, UserCheck } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { LinkedInProfileHeader } from "@/components/linkedin/LinkedInProfileHeader";
import { LinkedInProfileMain } from "@/components/linkedin/LinkedInProfileMain";
import { LinkedInProfileSidebar } from "@/components/linkedin/LinkedInProfileSidebar";
import { LinkedInProfileExperience } from "@/components/linkedin/LinkedInProfileExperience";
import { LinkedInProfileEducation } from "@/components/linkedin/LinkedInProfileEducation";
import { LinkedInProfileActivity } from "@/components/linkedin/LinkedInProfileActivity";
import { RightRailAd } from "@/components/linkedin/right-rail/RightRailAd";
import { PeopleRecommendations } from "@/components/linkedin/right-rail/PeopleRecommendations";
import { CompanyRecommendations } from "@/components/linkedin/right-rail/CompanyRecommendations";
import { toast } from "@/hooks/use-toast";
import { InView } from "@/components/util/InView";
import { useCompanyInterest } from "@/hooks/useCompanyInterest";
import { useCompany } from "@/hooks/useCompany";
import FollowButton from "@/components/Company/FollowButton";

export default function UserProfilePage() {
  const { id, username } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { company } = useCompany();
  const { getStatuses, requestConnection, acceptRequest, declineRequest, cancelRequest, removeConnection } = useConnections();

  const [profile, setProfile] = useState<any | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<ConnectionState>("none");
  const [isCompanyMember, setIsCompanyMember] = useState(false);
  const [followStatus, setFollowStatus] = useState<'none' | 'pending' | 'accepted'>('none');
  const [followLoading, setFollowLoading] = useState(false);
  const [pendingFollowRequest, setPendingFollowRequest] = useState<{ id: string; companyId: string; companyName: string } | null>(null);
  const { interested, loading: interestLoading, toggle: toggleInterest } = useCompanyInterest(profileId || id);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [interestRequestStatus, setInterestRequestStatus] = useState<'none' | 'pending' | 'accepted' | 'rejected'>('none');
  const [creatingInterestRequest, setCreatingInterestRequest] = useState(false);
  const [showCancelRequestDialog, setShowCancelRequestDialog] = useState(false);

  const isOwner = !!user && user.id === (profileId || id);
  const isCompanyUser = !!company?.id;
  // For company users: check follow status instead of connection status
  const isConnected = isCompanyUser ? (followStatus === 'accepted' || isOwner) : (status === "accepted" || isOwner);

  useEffect(() => {
    const load = async () => {
      // Support both UUID (id) and username lookup
      const lookupId = id;
      const lookupUsername = username;
      
      if (!lookupId && !lookupUsername) return;
      setLoading(true);
      try {
        let profileResult;
        
        if (lookupUsername) {
          // Lookup by username (vanity URL)
          profileResult = await supabase
            .from("profiles")
            .select("*")
            .eq("username", lookupUsername)
            .maybeSingle();
        } else {
          // Lookup by UUID
          profileResult = await supabase
            .from("profiles")
            .select("*")
            .eq("id", lookupId)
            .maybeSingle();
        }
        
        const { data, error } = profileResult;
        if (error) throw error;
        if (!data) {
          toast({ title: "Profil nicht gefunden", description: "Dieses Profil existiert nicht.", variant: "destructive" });
          navigate("/startseite");
          return;
        }
        setProfile(data);
        setProfileId(data.id);

        // Load connection status
        if (user && user.id !== data.id) {
          const statusResult = await getStatuses([data.id]);
          if (statusResult && typeof statusResult === 'object') {
            setStatus(statusResult[data.id] || "none");
          }
        }

        // Check unlock state for company users
        if (isCompanyUser && company?.id && data.id) {
          const { data: companyCandidate } = await supabase
            .from('company_candidates')
            .select('unlocked_at')
            .eq('company_id', company.id)
            .eq('candidate_id', data.id)
            .not('unlocked_at', 'is', null)
            .maybeSingle();
          
          setIsUnlocked(!!companyCandidate?.unlocked_at);

          // Check existing interest request (get the most recent one)
          const { data: interestData } = await supabase
            .from("company_interest_requests")
            .select("status, created_at")
            .eq("company_id", company.id)
            .eq("candidate_id", data.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          if (interestData) {
            const status = interestData.status as 'pending' | 'accepted' | 'rejected';
            setInterestRequestStatus(status);
            
            // If request was accepted, ensure isUnlocked is true
            if (status === 'accepted' && !companyCandidate?.unlocked_at) {
              // Double-check unlock status
              const { data: recheckCandidate } = await supabase
                .from('company_candidates')
                .select('unlocked_at')
                .eq('company_id', company.id)
                .eq('candidate_id', data.id)
                .not('unlocked_at', 'is', null)
                .maybeSingle();
              
              if (recheckCandidate?.unlocked_at) {
                setIsUnlocked(true);
              }
            }
            
            // If request was rejected, reset to 'none' so user can try again
            if (status === 'rejected') {
              setInterestRequestStatus('none');
            }
          } else {
            // No interest request found, reset to 'none'
            setInterestRequestStatus('none');
          }
        }
      } catch (e) {
        console.error(e);
        toast({ title: "Fehler", description: "Profil konnte nicht geladen werden.", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, username, user, getStatuses, navigate, isCompanyUser, company?.id]);

  // Realtime subscription for interest request status changes
  useEffect(() => {
    if (!isCompanyUser || !company?.id || !profileId) return;

    const channel = supabase
      .channel(`interest-request-${company.id}-${profileId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'company_interest_requests',
          filter: `company_id=eq.${company.id},candidate_id=eq.${profileId}`,
        },
        async (payload: any) => {
          console.log('Interest request changed:', payload);
          
          // Refresh unlock state
          const { data: companyCandidate } = await supabase
            .from('company_candidates')
            .select('unlocked_at')
            .eq('company_id', company.id)
            .eq('candidate_id', profileId)
            .not('unlocked_at', 'is', null)
            .maybeSingle();
          
          setIsUnlocked(!!companyCandidate?.unlocked_at);

          // Refresh interest request status
          if (payload.new) {
            setInterestRequestStatus(payload.new.status as 'pending' | 'accepted' | 'rejected');
          } else if (payload.eventType === 'DELETE') {
            setInterestRequestStatus('none');
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'company_candidates',
          filter: `company_id=eq.${company.id},candidate_id=eq.${profileId}`,
        },
        async (payload: any) => {
          console.log('Company candidate changed:', payload);
          
          // Refresh unlock state
          if (payload.new?.unlocked_at) {
            setIsUnlocked(true);
          } else if (payload.eventType === 'DELETE' || !payload.new?.unlocked_at) {
            setIsUnlocked(false);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isCompanyUser, company?.id, profileId]);

  useEffect(() => {
    if (profile) {
      const name = [profile.vorname, profile.nachname].filter(Boolean).join(" ") || "Profil";
      document.title = `${name} – Azubi Community`;
    }
  }, [profile]);

  useEffect(() => {
    const check = async () => {
      if (!user) { setIsCompanyMember(false); return; }
      const { data } = await supabase.rpc('is_company_member');
      setIsCompanyMember(!!data);
    };
    check();
  }, [user]);

  // Check follow status for company users and pending requests for regular users
  useEffect(() => {
    const checkFollowStatus = async () => {
      if (isCompanyUser) {
        // Company user: check if company follows this profile
        if (!company?.id || !id || isOwner) {
          setFollowStatus('none');
          return;
        }
        
        try {
          const { data, error } = await supabase
            .from('follows')
            .select('id, status')
            .eq('follower_type', 'company')
            .eq('follower_id', company.id)
            .eq('followee_type', 'profile')
            .eq('followee_id', id)
            .maybeSingle();
          
          if (!error && data) {
            setFollowStatus(data.status as 'pending' | 'accepted');
          } else {
            setFollowStatus('none');
          }
        } catch (error) {
          console.error('Error checking follow status:', error);
          setFollowStatus('none');
        }
      } else {
        // Regular user: check if any company has a pending follow request
        if (!id || !user || isOwner) {
          setPendingFollowRequest(null);
          return;
        }
        
        try {
          const { data, error } = await supabase
            .from('follows')
            .select('id, follower_id, companies(id, name)')
            .eq('follower_type', 'company')
            .eq('followee_type', 'profile')
            .eq('followee_id', id)
            .eq('status', 'pending')
            .maybeSingle();
          
          if (!error && data && data.companies) {
            setPendingFollowRequest({
              id: data.id,
              companyId: data.follower_id,
              companyName: (data.companies as any).name
            });
          } else {
            setPendingFollowRequest(null);
          }
        } catch (error) {
          console.error('Error checking pending follow request:', error);
          setPendingFollowRequest(null);
        }
      }
    };
    
    checkFollowStatus();
  }, [isCompanyUser, company?.id, id, isOwner, user]);

  const displayProfile = useMemo(() => {
    if (!profile) return null;
    // For company users: show restricted view unless unlocked
    if (isCompanyUser && !isOwner) {
      if (isUnlocked) {
        // Unlocked: show full profile (including contact info and CV)
        return profile;
      } else {
        // Not unlocked: restricted view - hide nachname completely, CV, and contact info
        return {
          ...profile,
          nachname: null, // Completely hide nachname (not even first letter)
          email: null,
          telefon: null,
          strasse: null,
          hausnummer: null,
          sprachen: [],
          faehigkeiten: [],
          kenntnisse: null,
          praktische_erfahrung: null,
          cv_url: null,
        };
      }
    }
    // For regular users: use connection status
    if (isConnected) return profile;
    // restricted view: hide sensitive fields
    return {
      ...profile,
      nachname: profile.nachname ? `${String(profile.nachname).charAt(0)}.` : null,
      email: null,
      telefon: null,
      strasse: null,
      hausnummer: null,
      sprachen: [],
      faehigkeiten: [],
      kenntnisse: null,
      praktische_erfahrung: null,
      cv_url: null,
    };
  }, [profile, isConnected, isCompanyUser, isUnlocked, isOwner]);

  const onConnect = async () => {
    if (!id) return;
    // Optimistic update: show "Angefragt" immediately
    setStatus("pending");
    try {
      await requestConnection(id);
      // Refresh status after successful request
      const statuses = await getStatuses([id]);
      setStatus(statuses[id] || "pending");
      toast({ title: "Anfrage gesendet", description: "Wartet auf Bestätigung." });
    } catch (e: any) {
      console.error(e);
      // Check if it's a duplicate key error
      if (e?.code === '23505' || e?.message?.includes('duplicate key')) {
        // Connection already exists - refresh status
        try {
          const statuses = await getStatuses([id]);
          setStatus(statuses[id] || "pending");
          if (statuses[id] === "pending") {
            toast({ title: "Anfrage bereits gesendet", description: "Die Anfrage wartet bereits auf Bestätigung." });
          } else if (statuses[id] === "accepted") {
            toast({ title: "Bereits verbunden", description: "Ihr seid bereits verbunden." });
          } else {
            toast({ title: "Anfrage gesendet", description: "Wartet auf Bestätigung." });
          }
        } catch (refreshError) {
          // Revert optimistic update on error
          setStatus("none");
          toast({ title: "Fehler", description: "Anfrage konnte nicht gesendet werden.", variant: "destructive" });
        }
      } else {
        // Revert optimistic update on error
        setStatus("none");
        toast({ title: "Fehler", description: e?.message || "Anfrage konnte nicht gesendet werden.", variant: "destructive" });
      }
    }
  };
  const onAccept = async () => {
    if (!id) return;
    try {
      await acceptRequest(id);
      setStatus("accepted");
      toast({ title: "Verbunden", description: "Ihr könnt jetzt chatten." });
    } catch (e) {
      console.error(e);
      toast({ title: "Fehler", description: "Anfrage konnte nicht angenommen werden.", variant: "destructive" });
    }
  };
  const onDecline = async () => {
    if (!id) return;
    try {
      await declineRequest(id);
      setStatus("declined");
    } catch (e) {
      console.error(e);
      toast({ title: "Fehler", description: "Anfrage konnte nicht abgelehnt werden.", variant: "destructive" });
    }
  };
  const onCancel = async () => {
    if (!id) return;
    try {
      await cancelRequest(id);
      setStatus("none");
    } catch (e) {
      console.error(e);
      toast({ title: "Fehler", description: "Anfrage konnte nicht zurückgezogen werden.", variant: "destructive" });
    }
  };

  if (loading || !displayProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2"><Loader2 className="h-6 w-6 animate-spin" /> Profil wird geladen…</div>
      </div>
    );
  }

  const handleFollow = async () => {
    if (!isCompanyUser || !company?.id || !id || followLoading) return;
    
    setFollowLoading(true);
    try {
      if (followStatus === 'accepted') {
        // Unfollow
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_type', 'company')
          .eq('follower_id', company.id)
          .eq('followee_type', 'profile')
          .eq('followee_id', id);
        
        if (error) throw error;
        setFollowStatus('none');
        toast({ title: "Nicht mehr gefolgt", description: "Sie folgen diesem Profil nicht mehr." });
      } else if (followStatus === 'none') {
        // Follow (send request) - Optimistic update
        setFollowStatus('pending');
        const { error } = await supabase
          .from('follows')
          .insert({
            follower_type: 'company',
            follower_id: company.id,
            followee_type: 'profile',
            followee_id: id,
            status: 'pending'
          });
        
        if (error) {
          // Revert optimistic update on error
          setFollowStatus('none');
          throw error;
        }
        toast({ title: "Follow-Anfrage gesendet", description: "Wartet auf Bestätigung." });
      } else if (followStatus === 'pending') {
        // Cancel follow request
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_type', 'company')
          .eq('follower_id', company.id)
          .eq('followee_type', 'profile')
          .eq('followee_id', id)
          .eq('status', 'pending');
        
        if (error) throw error;
        setFollowStatus('none');
        toast({ title: "Anfrage zurückgezogen", description: "Die Follow-Anfrage wurde zurückgezogen." });
      }
    } catch (error: any) {
      console.error('Error following:', error);
      toast({ 
        title: "Fehler", 
        description: "Aktion konnte nicht durchgeführt werden.", 
        variant: "destructive" 
      });
    } finally {
      setFollowLoading(false);
    }
  };

  const handleAcceptFollowRequest = async () => {
    if (!pendingFollowRequest || !id) return;
    
    try {
      // Update company follow request to accepted
      const { error: updateError } = await supabase
        .from('follows')
        .update({ status: 'accepted' })
        .eq('id', pendingFollowRequest.id);
      
      if (updateError) throw updateError;
      
      // Automatically follow back (Profile → Company)
      const { error: insertError } = await supabase
        .from('follows')
        .insert({
          follower_id: user!.id,
          follower_type: 'profile',
          followee_id: pendingFollowRequest.companyId,
          followee_type: 'company',
          status: 'accepted'
        });
      
      if (insertError && insertError.code !== '23505') { // Ignore duplicate key errors
        throw insertError;
      }
      
      toast({
        title: 'Anfrage angenommen',
        description: `Sie folgen ${pendingFollowRequest.companyName} jetzt und es kann Ihre Posts sehen.`,
      });
      
      // Remove from pending requests immediately
      setPendingFollowRequest(null);
      setStatus("accepted"); // Update connection status
      
      // Refetch follow status to ensure UI is updated
      const checkFollowStatus = async () => {
        try {
          const { data, error } = await supabase
            .from('follows')
            .select('id, follower_id, companies(id, name)')
            .eq('follower_type', 'company')
            .eq('followee_type', 'profile')
            .eq('followee_id', id)
            .eq('status', 'pending')
            .maybeSingle();
          
          if (!error && data && data.companies) {
            setPendingFollowRequest({
              id: data.id,
              companyId: data.follower_id,
              companyName: (data.companies as any).name
            });
          } else {
            setPendingFollowRequest(null);
          }
        } catch (error) {
          console.error('Error checking pending follow request:', error);
        }
      };
      
      // Small delay to ensure database is updated
      setTimeout(() => {
        checkFollowStatus();
      }, 500);
    } catch (error: any) {
      console.error('Error accepting follow request:', error);
      toast({
        title: 'Fehler',
        description: 'Die Anfrage konnte nicht angenommen werden.',
        variant: 'destructive',
      });
    }
  };

  const handleDeclineFollowRequest = async () => {
    if (!pendingFollowRequest) return;
    
    try {
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('id', pendingFollowRequest.id);
      
      if (error) throw error;
      
      toast({
        title: 'Anfrage abgelehnt',
        description: 'Die Follow-Anfrage wurde abgelehnt.',
      });
      
      setPendingFollowRequest(null);
    } catch (error: any) {
      console.error('Error declining follow request:', error);
      toast({
        title: 'Fehler',
        description: 'Die Anfrage konnte nicht abgelehnt werden.',
        variant: 'destructive',
      });
    }
  };

  const renderActions = () => {
    if (isOwner) return null;
    
    // Regular user: show accept/decline buttons if there's a pending follow request
    if (!isCompanyUser && pendingFollowRequest) {
      return (
        <div className="flex items-center gap-1 sm:gap-2">
          <Button 
            onClick={handleAcceptFollowRequest}
            className="min-h-[44px] px-2 sm:px-4 text-xs sm:text-sm"
          >
            <Check className="h-4 w-4 sm:h-4 sm:w-4 sm:mr-1" /> <span className="hidden sm:inline">Annehmen</span>
          </Button>
          <Button 
            variant="outline" 
            onClick={handleDeclineFollowRequest}
            className="min-h-[44px] px-2 sm:px-4 text-xs sm:text-sm"
          >
            <X className="h-4 w-4 sm:h-4 sm:w-4 sm:mr-1" /> <span className="hidden sm:inline">Ablehnen</span>
          </Button>
        </div>
      );
    }
    
    // Company user actions
    if (isCompanyUser) {
      // If unlocked, don't show any action buttons (profile is already unlocked)
      if (isUnlocked) {
        return null; // Profile is unlocked, no action needed
      }
      
      // If not unlocked, show "Interesse bekunden" button
      if (interestRequestStatus === 'none') {
        return (
          <div className="flex gap-1 sm:gap-2">
            <Button 
              onClick={async () => {
                if (!company?.id || !profileId || creatingInterestRequest) return;
                setCreatingInterestRequest(true);
                try {
                  const { data, error } = await supabase.rpc('create_company_interest_request', {
                    p_company_id: company.id,
                    p_candidate_id: profileId,
                  });

                  if (error) throw error;

                  if (data?.success) {
                    setInterestRequestStatus('pending');
                    toast({ 
                      title: "Interesse-Anfrage gesendet", 
                      description: "Der Nutzer wurde benachrichtigt und kann Ihr Interesse bestätigen." 
                    });
                    // Refetch to ensure state is synced
                    const { data: updatedInterestData } = await supabase
                      .from("company_interest_requests")
                      .select("status")
                      .eq("company_id", company.id)
                      .eq("candidate_id", profileId)
                      .order("created_at", { ascending: false })
                      .limit(1)
                      .maybeSingle();
                    
                    if (updatedInterestData) {
                      setInterestRequestStatus(updatedInterestData.status as 'pending' | 'accepted' | 'rejected');
                    }
                  } else {
                    toast({ 
                      title: "Fehler", 
                      description: data?.message || "Interesse-Anfrage konnte nicht gesendet werden.", 
                      variant: "destructive" 
                    });
                  }
                } catch (error: any) {
                  console.error('Error creating interest request:', error);
                  toast({ 
                    title: "Fehler", 
                    description: error?.message || "Interesse-Anfrage konnte nicht gesendet werden.", 
                    variant: "destructive" 
                  });
                } finally {
                  setCreatingInterestRequest(false);
                }
              }}
              disabled={creatingInterestRequest}
              className="min-h-[44px] px-2 sm:px-4 text-xs sm:text-sm"
            >
              {creatingInterestRequest ? (
                <>
                  <Loader2 className="h-4 w-4 sm:h-4 sm:w-4 sm:mr-1 animate-spin" />
                  <span className="hidden sm:inline">Wird gesendet...</span>
                </>
              ) : (
                <>
                  <UserCheck className="h-4 w-4 sm:h-4 sm:w-4 sm:mr-1" />
                  <span className="hidden sm:inline">Interesse bekunden</span>
                </>
              )}
            </Button>
          </div>
        );
      }
      // If interest request is pending
      if (interestRequestStatus === 'pending') {
        return (
          <div className="flex items-center gap-1 sm:gap-2">
            <Button variant="secondary" disabled className="min-h-[44px] px-2 sm:px-4 text-xs sm:text-sm">
              <Lock className="h-4 w-4 sm:h-4 sm:w-4 sm:mr-1" />
              <span className="hidden sm:inline">Interesse-Anfrage ausstehend</span>
            </Button>
          </div>
        );
      }
      // If unlocked, show follow button
      if (followStatus === "accepted") {
        return (
          <div className="flex gap-2">
            <Button 
              onClick={() => navigate("/community/messages")} 
              className="min-h-[44px] px-4 text-sm"
            >
              <MessageSquareMore className="h-4 w-4 mr-2" /> Nachricht
            </Button>
            <Button 
              onClick={handleFollow} 
              disabled={followLoading}
              variant="outline"
              className="min-h-[44px] px-4 text-sm"
            >
              <X className="h-4 w-4 mr-2" /> Entfolgen
            </Button>
          </div>
        );
      }
      if (followStatus === "pending") {
        return (
          <>
            <Button 
              variant="secondary" 
              onClick={() => setShowCancelRequestDialog(true)}
              className="min-h-[44px] px-4 text-sm"
            >
              <Check className="h-4 w-4 mr-2" /> Angefragt
            </Button>
            <AlertDialog open={showCancelRequestDialog} onOpenChange={setShowCancelRequestDialog}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Anfrage zurückziehen?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Möchten Sie die Follow-Anfrage wirklich zurückziehen? Sie können später erneut folgen.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={async () => {
                      await handleFollow();
                      setShowCancelRequestDialog(false);
                    }}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Zurückziehen
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        );
      }
      // No follow - show follow button
      return (
        <div className="flex gap-2">
          <Button 
            onClick={handleFollow} 
            disabled={followLoading}
            className="min-h-[44px] px-4 text-sm"
          >
            <UserPlus className="h-4 w-4 mr-2" /> Folgen
          </Button>
        </div>
      );
    }
    
    // Regular user actions
    if (status === "accepted") {
      return (
        <div className="flex gap-2">
          <Button onClick={() => navigate("/community/messages")} className="min-h-[44px] px-4 text-sm">
            <MessageSquareMore className="h-4 w-4 mr-2" /> Nachricht
          </Button>
          <Button 
            onClick={async () => {
              if (!id) return;
              try {
                await removeConnection(id);
                const statuses = await getStatuses([id]);
                setStatus(statuses[id] || "none");
                toast({ title: "Nicht mehr verbunden", description: "Die Verbindung wurde aufgehoben." });
              } catch (e: any) {
                console.error(e);
                toast({ title: "Fehler", description: "Verbindung konnte nicht aufgehoben werden.", variant: "destructive" });
              }
            }}
            variant="outline"
            className="min-h-[44px] px-4 text-sm"
          >
            <UserCheck className="h-4 w-4 mr-2" /> Entfolgen
          </Button>
        </div>
      );
    }
    if (status === "none" || !user) {
      return (
        <div className="flex gap-2">
          <Button onClick={onConnect} className="min-h-[44px] px-4 text-sm">
            <UserPlus className="h-4 w-4 mr-2" /> Vernetzen
          </Button>
        </div>
      );
    }
    if (status === "pending") {
      return (
        <>
          <Button 
            variant="secondary" 
            onClick={() => setShowCancelRequestDialog(true)}
            className="min-h-[44px] px-4 text-sm"
          >
            <Check className="h-4 w-4 mr-2" /> Angefragt
          </Button>
          <AlertDialog open={showCancelRequestDialog} onOpenChange={setShowCancelRequestDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Anfrage zurückziehen?</AlertDialogTitle>
                <AlertDialogDescription>
                  Möchten Sie die Verbindungsanfrage wirklich zurückziehen? Sie können später erneut eine Anfrage senden.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                <AlertDialogAction
                  onClick={async () => {
                    await onCancel();
                    setShowCancelRequestDialog(false);
                  }}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Zurückziehen
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      );
    }
    if (status === "incoming") {
      return (
        <div className="flex items-center gap-1 sm:gap-2">
          <Button onClick={onAccept} className="min-h-[44px] px-2 sm:px-4 text-xs sm:text-sm">Annehmen</Button>
          <Button variant="outline" onClick={onDecline} className="min-h-[44px] px-2 sm:px-4 text-xs sm:text-sm">Ablehnen</Button>
        </div>
      );
    }
    if (status === "declined") {
      return (
        <div className="flex items-center gap-1 sm:gap-2">
          <Button onClick={onConnect} className="min-h-[44px] px-2 sm:px-4 text-xs sm:text-sm">Erneut senden</Button>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      {/* Header with back button */}
      <div className="px-2 sm:px-3 md:px-6 py-1.5 sm:py-2 border-b">
        <div className="max-w-screen-2xl mx-auto flex items-center justify-between gap-1 sm:gap-2 overflow-hidden">
          <Button variant="outline" className="flex items-center gap-1.5 min-h-[44px] px-2 sm:px-4 text-xs sm:text-sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 sm:h-4 sm:w-4" /> <span className="hidden sm:inline">Zurück</span>
          </Button>
          <div className="flex items-center gap-1 sm:gap-2">
            {isCompanyMember && !isOwner && (
              <Button 
                onClick={async () => {
                  try {
                    const result = await toggleInterest();
                    if (result?.tokensDeducted) {
                      toast({ 
                        title: "Interesse gezeigt", 
                        description: `3 Tokens wurden abgezogen, da beide Seiten Interesse haben. Neue Balance: ${result.newBalance} Tokens.` 
                      });
                    } else if (result?.success) {
                      toast({ 
                        title: "Interesse gezeigt", 
                        description: "Ihr Interesse wurde gespeichert." 
                      });
                    }
                  } catch (error: any) {
                    toast({ 
                      title: "Fehler", 
                      description: error.message || "Interesse konnte nicht gespeichert werden.", 
                      variant: "destructive" 
                    });
                  }
                }} 
                disabled={interestLoading} 
                variant={interested ? 'secondary' : 'default'} 
                className="min-h-[44px] px-2 sm:px-4 text-xs sm:text-sm"
              >
                <HandHeart className="h-4 w-4 sm:h-4 sm:w-4 sm:mr-1" /> <span className="hidden sm:inline">{interested ? 'Interesse gezeigt' : 'Interesse zeigen'}</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-screen-2xl mx-auto px-2 sm:px-3 md:px-6 py-2 md:py-4">
        {/* Show pending follow request notification for regular users */}
        {!isCompanyUser && !isOwner && pendingFollowRequest && (
          <Card className="mb-4 p-4 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  {pendingFollowRequest.companyName} möchte Ihnen folgen
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                  Wenn Sie zustimmen, können Sie sich gegenseitig folgen und Beiträge sehen.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  onClick={handleAcceptFollowRequest}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Check className="h-4 w-4 mr-1" /> Annehmen
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleDeclineFollowRequest}
                  size="sm"
                >
                  <X className="h-4 w-4 mr-1" /> Ablehnen
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Info Banner for company users: Contact details and CV only after interest confirmation */}
        {isCompanyUser && !isOwner && !isUnlocked && (
          <Card className="mb-4 p-4 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-3">
              <Lock className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Kontaktdaten und Lebenslauf verborgen
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                  Bekunden Sie Ihr Interesse, um Kontaktdaten und Lebenslauf zu sehen. Der Nutzer wird benachrichtigt und kann Ihr Interesse bestätigen.
                </p>
              </div>
            </div>
          </Card>
        )}
        
        <div className="flex flex-col lg:grid lg:grid-cols-12 gap-3 sm:gap-3 md:gap-4">
          {/* Left column */}
          <main className="lg:col-span-8 space-y-3 sm:space-y-3 md:space-y-4">
            <LinkedInProfileHeader 
              profile={displayProfile} 
              isEditing={false} 
              onProfileUpdate={() => {}} 
              actionButtons={renderActions()}
            />
            <LinkedInProfileMain profile={displayProfile} isEditing={false} onProfileUpdate={() => {}} readOnly={!isOwner} />
            <LinkedInProfileExperience experiences={displayProfile?.berufserfahrung || []} isEditing={false} onExperiencesUpdate={() => {}} />
            <LinkedInProfileEducation education={displayProfile?.schulbildung || []} isEditing={false} onEducationUpdate={() => {}} />
            {/* Only show activity if follow is accepted (for company users) or connected (for regular users) */}
            {(isCompanyUser ? followStatus === 'accepted' : isConnected) && (
              <LinkedInProfileActivity profile={displayProfile} />
            )}
            {isCompanyUser && followStatus !== 'accepted' && !isOwner && (
              <Card className="p-6 text-center">
                <p className="text-muted-foreground">
                  Folgen Sie diesem Profil, um die Beiträge zu sehen.
                </p>
              </Card>
            )}
          </main>

          {/* Right column */}
          <aside className="hidden lg:block lg:col-span-4">
            <div className="lg:sticky lg:top-20 space-y-2 sm:space-y-3 md:space-y-4">
              <LinkedInProfileSidebar 
                profile={displayProfile} 
                isEditing={false} 
                onProfileUpdate={() => {}} 
                readOnly={!isOwner} 
                showLanguagesAndSkills={isOwner && !isCompanyUser} 
                showLicenseAndStats={isOwner && !isCompanyUser} 
                showCVSection={(isOwner && !isCompanyUser) || (isCompanyUser && isUnlocked)} 
              />
              <RightRailAd variant="card" size="sm" />
              <InView rootMargin="300px" placeholder={<div className="h-32 rounded-md bg-muted/50 animate-pulse" />}> 
                <PeopleRecommendations limit={5} showMoreLink="/entdecken/azubis" showMore={true} />
              </InView>
              <InView rootMargin="300px" placeholder={<div className="h-32 rounded-md bg-muted/50 animate-pulse" />}> 
                <CompanyRecommendations limit={3} />
              </InView>
              <RightRailAd variant="banner" size="sm" />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
