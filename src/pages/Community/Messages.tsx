import React from "react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { useMessaging } from "@/hooks/useMessaging";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/useIsMobile";
import { NewMessageSearch } from "@/components/community/NewMessageSearch";
import { useSearchParams } from "react-router-dom";

const formatDate = (iso?: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const sameYear = d.getFullYear() === now.getFullYear();
  return d.toLocaleDateString("de-DE", { day: "2-digit", month: sameYear ? "short" : "2-digit" });
};
const isSameDay = (a?: string | null, b?: string | null) => {
  if (!a || !b) return false;
  const da = new Date(a), db = new Date(b);
  return da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth() && da.getDate() === db.getDate();
};
const weekdayLabel = (iso?: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("de-DE", { weekday: "long" }).toUpperCase();
};
const formatDateTime = (iso?: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
};

export default function CommunityMessages() {
  const { loadConversationsWithLast, sendMessage } = useMessaging();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [searchParams] = useSearchParams();

  const [query, setQuery] = React.useState("");
  const [items, setItems] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [isNewMessageOpen, setIsNewMessageOpen] = React.useState(false);
  const selected = React.useMemo(() => items.find((c) => c.id === selectedId) || null, [items, selectedId]);

  // Listen for new message event from TopNavBar
  React.useEffect(() => {
    const handleOpenNewMessage = () => {
      setIsNewMessageOpen(true);
    };
    
    if (typeof window !== 'undefined') {
      window.addEventListener('open-new-message', handleOpenNewMessage as EventListener);
      return () => {
        window.removeEventListener('open-new-message', handleOpenNewMessage as EventListener);
      };
    }
  }, []);

  // Listen for filter-messages event from TopNavBar
  React.useEffect(() => {
    const handleFilterMessages = (e: Event) => {
      const customEvent = e as CustomEvent;
      setQuery(customEvent.detail || "");
    };
    
    if (typeof window !== 'undefined') {
      window.addEventListener('filter-messages', handleFilterMessages as EventListener);
      return () => {
        window.removeEventListener('filter-messages', handleFilterMessages as EventListener);
      };
    }
  }, []);

  // Set selected conversation from URL params
  React.useEffect(() => {
    const conversationId = searchParams.get('conversation');
    if (conversationId) {
      setSelectedId(conversationId);
    }
  }, [searchParams]);

  type Msg = { id: string; conversation_id: string; sender_id: string; content: string; created_at: string };
  const [messages, setMessages] = React.useState<Msg[]>([]);
  const [composer, setComposer] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const listRef = React.useRef<HTMLDivElement>(null);

  // Load conversations
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      const data = await loadConversationsWithLast();
      if (!mounted) return;
      setItems(data);
      setSelectedId((cur) => cur || data[0]?.id || null);
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, [loadConversationsWithLast]);

  // Load messages for selected conversation
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      if (!selectedId) { setMessages([]); return; }
      const { data, error } = await supabase
        .from("messages")
        .select("id, conversation_id, sender_id, content, created_at")
        .eq("conversation_id", selectedId)
        .order("created_at", { ascending: true });
      if (!mounted) return;
      if (error) { setMessages([]); return; }
      setMessages((data || []) as Msg[]);
      // scroll to bottom
      setTimeout(() => listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' }), 50);
    })();
    return () => { mounted = false; };
  }, [selectedId]);

  const filtered = React.useMemo(() => {
    const t = query.trim().toLowerCase();
    if (!t) return items;
    return items.filter((c) => {
      const name = [c.otherUser?.vorname, c.otherUser?.nachname].filter(Boolean).join(" ").toLowerCase();
      const content = c.lastMessage?.content?.toLowerCase() || "";
      return name.includes(t) || content.includes(t);
    });
  }, [items, query]);

  const onSend = async () => {
    if (!selected || !composer.trim()) return;
    try {
      setSending(true);
      await sendMessage(selected.otherUser.id, composer);
      setComposer("");
      // refresh conversation list and messages
      const updated = await loadConversationsWithLast();
      setItems(updated);
      // Re-load thread
      const { data } = await supabase
        .from("messages")
        .select("id, conversation_id, sender_id, content, created_at")
        .eq("conversation_id", selected.id)
        .order("created_at", { ascending: true });
      setMessages((data || []) as Msg[]);
      setTimeout(() => listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' }), 50);
    } finally {
      setSending(false);
    }
  };

  // Mobile View
  if (isMobile) {
    return (
      <>
        {/* New Message Search Modal */}
        <NewMessageSearch open={isNewMessageOpen} onOpenChange={setIsNewMessageOpen} />

        <main className="w-full min-h-screen bg-background pb-20">
          {/* Filter chips - sticky below TopNavBar */}
          <div className="sticky top-12 z-30 bg-background border-b border-border px-3 py-2 overflow-x-auto scrollbar-hide">
            <div className="flex items-center gap-2 text-xs">
              <span className="inline-flex items-center px-2 py-1 rounded-full bg-primary/10 text-primary whitespace-nowrap">Nachrichten</span>
              <span className="inline-flex items-center px-2 py-1 rounded-full bg-muted whitespace-nowrap">Ungelesen</span>
              <span className="inline-flex items-center px-2 py-1 rounded-full bg-muted whitespace-nowrap">Meine Kontakte</span>
              <span className="inline-flex items-center px-2 py-1 rounded-full bg-muted whitespace-nowrap">InMail</span>
              <span className="inline-flex items-center px-2 py-1 rounded-full bg-muted whitespace-nowrap">Als Favorit markiert</span>
            </div>
          </div>

          {/* Conversation list - full width on mobile */}
          <div className="px-0">
            {loading && <div className="p-3 text-sm text-muted-foreground text-center">Lade…</div>}
            {!loading && filtered.length === 0 && (
              <div className="p-3 text-sm text-muted-foreground text-center">Keine Konversationen gefunden.</div>
            )}
            {!loading && filtered.map((c) => {
              const name = [c.otherUser?.vorname, c.otherUser?.nachname].filter(Boolean).join(" ") || "Unbekannt";
              const active = selectedId === c.id;
              return (
                <button 
                  key={c.id} 
                  className={`w-full text-left px-4 py-3 border-b border-border flex items-start gap-3 ${active ? 'bg-muted' : 'hover:bg-muted/60'}`} 
                  onClick={() => setSelectedId(c.id)}
                >
                  <Avatar className="h-12 w-12 shrink-0">
                    <AvatarImage src={c.otherUser?.avatar_url ?? undefined} alt={name} />
                    <AvatarFallback>{name.slice(0,2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="text-sm font-medium truncate flex-1">{name}</div>
                      <div className="text-[11px] text-muted-foreground shrink-0">{formatDate(c.lastMessageAt)}</div>
                    </div>
                    <div className="text-xs text-muted-foreground truncate">{c.lastMessage?.content || '—'}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </main>
      </>
    );
  }

  // Desktop View
  return (
    <>
      {/* New Message Search Modal */}
      <NewMessageSearch open={isNewMessageOpen} onOpenChange={setIsNewMessageOpen} />

      <main className="w-full py-2 sm:py-4 pb-[56px] md:pb-6">
        <div className="grid grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)_320px] gap-4">
          {/* Left: Conversation list */}
          <Card className="p-0 overflow-hidden">
            <div className="p-3 border-b">
              <div className="flex items-center gap-2">
                <h1 className="text-base font-semibold">Nachrichten</h1>
                <div className="ml-auto" />
              </div>
              {/* Search only on desktop - mobile uses TopNavBar */}
              <div className="mt-2">
                <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Nachrichten durchsuchen" aria-label="Nachrichten durchsuchen" />
              </div>
              {/* Filter chips (UI only) */}
              <div className="mt-2 flex flex-wrap gap-2 text-xs">
              <span className="inline-flex items-center px-2 py-1 rounded-full bg-primary/10 text-primary">Nachrichten</span>
              <span className="inline-flex items-center px-2 py-1 rounded-full bg-muted">Ungelesen</span>
              <span className="inline-flex items-center px-2 py-1 rounded-full bg-muted">Meine Kontakte</span>
              <span className="inline-flex items-center px-2 py-1 rounded-full bg-muted">InMail</span>
              <span className="inline-flex items-center px-2 py-1 rounded-full bg-muted">Als Favorit markiert</span>
            </div>
          </div>
          <div className="max-h-[calc(100vh-220px)] lg:max-h-[calc(100vh-200px)] overflow-auto p-2">
            {loading && <div className="p-3 text-sm text-muted-foreground">Lade…</div>}
            {!loading && filtered.length === 0 && (
              <div className="p-3 text-sm text-muted-foreground">Keine Konversationen gefunden.</div>
            )}
            {!loading && filtered.map((c) => {
              const name = [c.otherUser?.vorname, c.otherUser?.nachname].filter(Boolean).join(" ") || "Unbekannt";
              const active = selectedId === c.id;
              return (
                <button key={c.id} className={`w-full text-left px-2 py-2 rounded-lg flex items-start gap-3 ${active ? 'bg-muted' : 'hover:bg-muted/60'}`} onClick={() => setSelectedId(c.id)}>
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={c.otherUser?.avatar_url ?? undefined} alt={name} />
                    <AvatarFallback>{name.slice(0,2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-medium truncate flex-1">{name}</div>
                      <div className="text-[11px] text-muted-foreground">{formatDate(c.lastMessageAt)}</div>
                    </div>
                    <div className="text-xs text-muted-foreground truncate">{c.lastMessage?.content || '—'}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </Card>

        {/* Center: Conversation thread */}
        <Card className="flex flex-col min-h-[60vh]">
          {!selected ? (
            <div className="p-6 text-sm text-muted-foreground">Wähle eine Konversation links aus.</div>
          ) : (
            <>
              <div className="p-4 border-b">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={selected.otherUser?.avatar_url ?? undefined} alt="" />
                    <AvatarFallback>{([selected.otherUser?.vorname, selected.otherUser?.nachname].filter(Boolean).join(" ") || 'U').slice(0,2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold truncate">{[selected.otherUser?.vorname, selected.otherUser?.nachname].filter(Boolean).join(" ") || 'Unbekannt'}</div>
                    <div className="text-xs text-muted-foreground truncate">Unterhaltung</div>
                  </div>
                </div>
              </div>

              <div ref={listRef} className="flex-1 overflow-auto p-4 space-y-3 bg-background">
                {messages.map((m, idx) => {
                  const prev = messages[idx - 1];
                  const showDay = !prev || !isSameDay(m.created_at, prev?.created_at);
                  const isSelf = m.sender_id === user?.id;
                  return (
                    <React.Fragment key={m.id}>
                      {showDay && (
                        <div className="my-3 text-center">
                          <span className="inline-flex items-center px-3 py-1 rounded-full bg-muted text-muted-foreground text-[11px] uppercase tracking-wide">
                            {weekdayLabel(m.created_at)}
                          </span>
                        </div>
                      )}
                      <div className={`flex w-full ${isSelf ? 'justify-end' : 'justify-start'} gap-2`}>
                        <div className={`${isSelf ? 'bg-primary text-primary-foreground' : 'bg-muted'} rounded-lg px-3 py-2 text-sm max-w-[75%] whitespace-pre-wrap`}>
                          {m.content}
                        </div>
                      </div>
                      <div className={`text-[11px] text-muted-foreground ${isSelf ? 'text-right pr-1' : 'text-left pl-1'} -mt-1`}>
                        {formatDateTime(m.created_at)}
                      </div>
                    </React.Fragment>
                  );
                })}
                {messages.length === 0 && (
                  <div className="text-sm text-muted-foreground">Noch keine Nachrichten. Schreib als erstes!</div>
                )}
              </div>

              <div className="border-t p-3">
                <div className="flex items-end gap-2">
                  <Textarea rows={2} value={composer} onChange={(e) => setComposer(e.target.value)} placeholder="Nachricht schreiben…" className="min-h-[44px]" />
                  <Button onClick={onSend} disabled={!composer.trim() || sending}>{sending ? 'Senden…' : 'Senden'}</Button>
                </div>
              </div>
            </>
          )}
        </Card>

        {/* Right: Weitere Posteingänge (ohne Werbung) */}
        <div className="space-y-4">
          <Card className="p-4">
            <div className="text-sm font-semibold mb-3">Weitere Posteingänge</div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between"><span>Ausbildungsbasis</span><span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-[11px] leading-none px-1">1</span></div>
              <div className="flex items-center justify-between"><span>Zettelcloud</span><span className="text-muted-foreground text-xs">—</span></div>
              <div className="flex items-center justify-between"><span>Recruiter‑Nachrichten</span><span className="text-muted-foreground text-xs">—</span></div>
            </div>
          </Card>
        </div>
      </div>
    </main>
    </>
  );
}
