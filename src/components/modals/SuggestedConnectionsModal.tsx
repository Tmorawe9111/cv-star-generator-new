import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, UserPlus, Check, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useConnections, type ConnectionState } from '@/hooks/useConnections';
import { toast } from '@/hooks/use-toast';

interface SuggestedPerson {
  id: string;
  vorname?: string | null;
  nachname?: string | null;
  avatar_url?: string | null;
  branche?: string | null;
  ort?: string | null;
  status?: string | null;
}

interface SuggestedConnectionsModalProps {
  open: boolean;
  onClose: () => void;
}

export const SuggestedConnectionsModal: React.FC<SuggestedConnectionsModalProps> = ({
  open,
  onClose
}) => {
  const { user, profile } = useAuth();
  const { requestConnection, acceptRequest, declineRequest } = useConnections();
  const [suggestedPeople, setSuggestedPeople] = useState<SuggestedPerson[]>([]);
  const [connectionStatuses, setConnectionStatuses] = useState<Record<string, ConnectionState>>({});
  const [loading, setLoading] = useState(false);

  // Load suggested connections
  useEffect(() => {
    if (!open || !user || !profile || !profile.profile_complete) return;

    const loadSuggestions = async () => {
      setLoading(true);
      try {
        const suggestions: SuggestedPerson[] = [];

        // 1. Try to find Julia Förster (can be from any branch)
        const { data: juliaProfile } = await supabase
          .from('profiles')
          .select('id, vorname, nachname, avatar_url, branche, ort, status')
          .ilike('vorname', 'Julia')
          .ilike('nachname', 'Förster')
          .neq('id', user.id)
          .maybeSingle();

        if (juliaProfile) {
          // Check if user is already connected or has pending request with Julia
          const { data: juliaConnection } = await supabase
            .from('connections')
            .select('requester_id, addressee_id, status')
            .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
            .or(`requester_id.eq.${juliaProfile.id},addressee_id.eq.${juliaProfile.id}`)
            .maybeSingle();

          // Check if connection exists and involves both user and Julia
          const hasConnection = juliaConnection && 
            ((juliaConnection.requester_id === user.id && juliaConnection.addressee_id === juliaProfile.id) ||
             (juliaConnection.requester_id === juliaProfile.id && juliaConnection.addressee_id === user.id)) &&
            (juliaConnection.status === 'accepted' || juliaConnection.status === 'pending');

          // Only add Julia if not connected and not pending
          // Note: Julia can be from any branch (as per requirement)
          if (!hasConnection) {
            suggestions.push(juliaProfile);
          }
        }

        // 2. Get other people from SAME branch only (newest first)
        // Important: Only show people from the same branch, never from other branches
        if (!profile.branche) {
          // If user has no branch set, only show Julia (if available)
          setSuggestedPeople(suggestions.slice(0, 1));
          return;
        }

        const { data: branchProfiles } = await supabase
          .from('profiles')
          .select('id, vorname, nachname, avatar_url, branche, ort, status, created_at')
          .eq('branche', profile.branche)
          .neq('id', user.id)
          .order('created_at', { ascending: false })
          .limit(20); // Get more to account for filtering

        if (branchProfiles) {
          // Filter out already connected/pending and Julia (if already added)
          const excludedIds = new Set(suggestions.map(p => p.id));
          
          // Check existing connections for branch profiles
          const branchProfileIds = branchProfiles
            .filter(p => !excludedIds.has(p.id))
            .map(p => p.id);

          if (branchProfileIds.length > 0) {
            // Check connections for each branch profile individually
            const connectionChecks = await Promise.all(
              branchProfileIds.map(async (profileId) => {
                const { data: connections } = await supabase
                  .from('connections')
                  .select('requester_id, addressee_id, status')
                  .or(`and(requester_id.eq.${user.id},addressee_id.eq.${profileId}),and(requester_id.eq.${profileId},addressee_id.eq.${user.id})`)
                  .maybeSingle();
                
                return {
                  profileId,
                  hasConnection: connections && (connections.status === 'accepted' || connections.status === 'pending')
                };
              })
            );

            const connectedOrPendingIds = new Set(
              connectionChecks
                .filter(check => check.hasConnection)
                .map(check => check.profileId)
            );

            // Add branch profiles that are not connected/pending
            const availableProfiles = branchProfiles
              .filter(p => !excludedIds.has(p.id) && !connectedOrPendingIds.has(p.id))
              .slice(0, 3 - suggestions.length); // Fill up to 3 total

            suggestions.push(...availableProfiles);
          }
        }

        // If we still don't have 3, get any recent profiles
        if (suggestions.length < 3) {
          const currentIds = new Set(suggestions.map(p => p.id));
          const { data: recentProfiles } = await supabase
            .from('profiles')
            .select('id, vorname, nachname, avatar_url, branche, ort, status, created_at')
            .neq('id', user.id)
            .not('id', 'in', `(${Array.from(currentIds).join(',')})`)
            .order('created_at', { ascending: false })
            .limit(10 - suggestions.length);

          if (recentProfiles) {
            const recentIds = recentProfiles.map(p => p.id);
            if (recentIds.length > 0) {
              // Check connections for each recent profile individually
              const recentConnectionChecks = await Promise.all(
                recentIds.map(async (profileId) => {
                  const { data: connections } = await supabase
                    .from('connections')
                    .select('requester_id, addressee_id, status')
                    .or(`and(requester_id.eq.${user.id},addressee_id.eq.${profileId}),and(requester_id.eq.${profileId},addressee_id.eq.${user.id})`)
                    .maybeSingle();
                  
                  return {
                    profileId,
                    hasConnection: connections && (connections.status === 'accepted' || connections.status === 'pending')
                  };
                })
              );

              const recentConnectedIds = new Set(
                recentConnectionChecks
                  .filter(check => check.hasConnection)
                  .map(check => check.profileId)
              );

              const additionalProfiles = recentProfiles
                .filter(p => !recentConnectedIds.has(p.id))
                .slice(0, 3 - suggestions.length);

              suggestions.push(...additionalProfiles);
            }
          }
        }

        setSuggestedPeople(suggestions.slice(0, 3));

        // Load connection statuses using useConnections hook
        if (suggestions.length > 0) {
          // Get connection statuses for all suggested people
          const suggestedIds = suggestions.map(p => p.id);
          const { data: allConnections } = await supabase
            .from('connections')
            .select('requester_id, addressee_id, status')
            .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

          const statusMap: Record<string, ConnectionState> = {};
          suggestedIds.forEach(id => {
            const connection = (allConnections || []).find(c => {
              const otherId = c.requester_id === user.id ? c.addressee_id : c.requester_id;
              return otherId === id;
            });

            if (!connection) {
              statusMap[id] = 'none';
            } else if (connection.status === 'accepted') {
              statusMap[id] = 'accepted';
            } else if (connection.status === 'pending') {
              statusMap[id] = connection.requester_id === user.id ? 'pending' : 'incoming';
            } else {
              statusMap[id] = 'declined';
            }
          });

          setConnectionStatuses(statusMap);
        }
      } catch (error) {
        console.error('Error loading suggested connections:', error);
        toast({
          title: 'Fehler',
          description: 'Vorschläge konnten nicht geladen werden.',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    loadSuggestions();
  }, [open, user, profile]);

  const handleConnect = async (personId: string) => {
    try {
      await requestConnection(personId);
      setConnectionStatuses(prev => ({ ...prev, [personId]: 'pending' }));
      toast({
        title: 'Anfrage gesendet',
        description: 'Deine Verbindungsanfrage wurde gesendet.'
      });
    } catch (error) {
      console.error('Error connecting:', error);
      toast({
        title: 'Fehler',
        description: 'Verbindungsanfrage konnte nicht gesendet werden.',
        variant: 'destructive'
      });
    }
  };

  const handleAccept = async (personId: string) => {
    try {
      await acceptRequest(personId);
      setConnectionStatuses(prev => ({ ...prev, [personId]: 'accepted' }));
      toast({
        title: 'Verbunden',
        description: 'Ihr seid jetzt verbunden!'
      });
    } catch (error) {
      console.error('Error accepting:', error);
      toast({
        title: 'Fehler',
        description: 'Anfrage konnte nicht angenommen werden.',
        variant: 'destructive'
      });
    }
  };

  const handleDecline = async (personId: string) => {
    try {
      await declineRequest(personId);
      setConnectionStatuses(prev => ({ ...prev, [personId]: 'declined' }));
      toast({
        title: 'Anfrage abgelehnt',
        description: 'Die Anfrage wurde abgelehnt.'
      });
    } catch (error) {
      console.error('Error declining:', error);
      toast({
        title: 'Fehler',
        description: 'Anfrage konnte nicht abgelehnt werden.',
        variant: 'destructive'
      });
    }
  };

  const getPersonName = (person: SuggestedPerson) => {
    return `${person.vorname || ''} ${person.nachname || ''}`.trim() || 'Unbekannt';
  };

  const getPersonStatus = (person: SuggestedPerson) => {
    const status = connectionStatuses[person.id] || 'none';
    if (status === 'accepted') return 'connected';
    if (status === 'pending') return 'pending';
    if (status === 'incoming') return 'incoming';
    return 'none';
  };

  if (!open || loading || suggestedPeople.length === 0) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onClose} modal={true}>
      <DialogContent 
        className="w-[95vw] max-w-[95vw] sm:max-w-md mx-auto"
        onInteractOutside={(e) => {
          // Allow closing by clicking outside
          onClose();
        }}
      >
        <DialogHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Users className="w-10 h-10 text-primary" />
          </div>
          <DialogTitle className="text-2xl font-bold">
            Neue Kontakte finden
          </DialogTitle>
          <DialogDescription className="text-base">
            Vernetze dich mit interessanten Personen aus deiner Branche.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-3 pt-4">
          {suggestedPeople.map((person) => {
            const name = getPersonName(person);
            const status = getPersonStatus(person);

            return (
              <div 
                key={person.id} 
                className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <Avatar className="h-12 w-12">
                  <AvatarImage src={person.avatar_url ?? undefined} alt={name} />
                  <AvatarFallback className="text-sm">
                    {name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{name}</p>
                  {person.branche && (
                    <p className="text-xs text-muted-foreground truncate">{person.branche}</p>
                  )}
                  {person.ort && (
                    <p className="text-xs text-muted-foreground truncate">{person.ort}</p>
                  )}
                </div>

                <div className="flex-shrink-0">
                  {status === 'none' && (
                    <Button
                      size="sm"
                      onClick={() => handleConnect(person.id)}
                      className="h-9"
                    >
                      <UserPlus className="h-4 w-4 mr-1" />
                      Vernetzen
                    </Button>
                  )}
                  {status === 'pending' && (
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled
                      className="h-9"
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Anfrage gesendet
                    </Button>
                  )}
                  {status === 'incoming' && (
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        onClick={() => handleAccept(person.id)}
                        className="h-9 px-2"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDecline(person.id)}
                        className="h-9 px-2"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  {status === 'connected' && (
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled
                      className="h-9"
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Verbunden
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex flex-col gap-3 pt-4">
          <Button 
            onClick={onClose}
            className="w-full h-12 text-base font-semibold"
            size="lg"
            variant="outline"
          >
            Später
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

