import React, { useState, useEffect, useRef } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, X } from "lucide-react";
import { useMessaging } from "@/hooks/useMessaging";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

interface NewMessageSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewMessageSearch({ open, onOpenChange }: NewMessageSearchProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { listAcceptedConnections, findOrCreateConversation: findOrCreateConv } = useMessaging();
  const [searchQuery, setSearchQuery] = useState("");
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load connected users
  useEffect(() => {
    if (!open || !user) return;
    let mounted = true;
    (async () => {
      setLoading(true);
      const connected = await listAcceptedConnections();
      if (!mounted) return;
      setContacts(connected);
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, [open, user, listAcceptedConnections]);

  // Load existing conversations to show users you've already chatted with
  const { data: existingConversations } = useQuery({
    queryKey: ['existing-conversations', user?.id],
    enabled: !!user && open,
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("conversations")
        .select("a_id, b_id")
        .or(`a_id.eq.${user.id},b_id.eq.${user.id}`);
      
      const otherUserIds = (data || []).map(c => 
        c.a_id === user.id ? c.b_id : c.a_id
      );
      
      if (otherUserIds.length === 0) return [];
      
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, vorname, nachname, avatar_url")
        .in("id", otherUserIds);
      
      return profiles || [];
    }
  });

  // Filter contacts based on search query
  const filteredContacts = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      // Show existing conversations first, then other contacts
      const existingIds = new Set((existingConversations || []).map(c => c.id));
      const existing = contacts.filter(c => existingIds.has(c.id));
      const others = contacts.filter(c => !existingIds.has(c.id));
      return [...existing, ...others];
    }
    
    const allContacts = [...contacts, ...(existingConversations || [])];
    const uniqueContacts = Array.from(
      new Map(allContacts.map(c => [c.id, c])).values()
    );
    
    return uniqueContacts.filter(c => {
      const name = [c.vorname, c.nachname].filter(Boolean).join(" ").toLowerCase();
      return name.includes(q);
    });
  }, [contacts, existingConversations, searchQuery]);

  const handleSelectContact = async (contactId: string) => {
    try {
      const conversationId = await findOrCreateConv(contactId);
      onOpenChange(false);
      setSearchQuery("");
      navigate(`/community/messages?conversation=${conversationId}`);
    } catch (error) {
      console.error("Error creating conversation:", error);
    }
  };

  // Focus input when sheet opens
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } else {
      setSearchQuery("");
    }
  }, [open]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] overflow-hidden flex flex-col">
        <SheetHeader>
          <SheetTitle>Neue Nachricht</SheetTitle>
        </SheetHeader>
        
        <div className="mt-4 mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={inputRef}
              placeholder="Nach Personen suchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-muted rounded-full"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Lade Kontakte...</div>
          ) : filteredContacts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery ? "Keine Kontakte gefunden" : "Keine Kontakte verfügbar"}
            </div>
          ) : (
            <div className="space-y-1">
              {filteredContacts.map((contact) => {
                const name = [contact.vorname, contact.nachname].filter(Boolean).join(" ") || "Unbekannt";
                const hasExistingChat = existingConversations?.some(c => c.id === contact.id);
                
                return (
                  <button
                    key={contact.id}
                    onClick={() => handleSelectContact(contact.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 rounded-lg transition-colors text-left"
                  >
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={contact.avatar_url || undefined} alt={name} />
                      <AvatarFallback>
                        {name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{name}</div>
                      {hasExistingChat && (
                        <div className="text-xs text-muted-foreground">Bereits gechattet</div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

