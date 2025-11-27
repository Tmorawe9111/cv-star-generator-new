import React from "react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useMessaging } from "@/hooks/useMessaging";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/useIsMobile";
import { NewMessageSearch } from "@/components/community/NewMessageSearch";
import { useSearchParams } from "react-router-dom";
import { ArrowLeft, Send, MoreHorizontal, Phone, Video } from "lucide-react";

const formatTime = (iso?: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
};

const formatDate = (iso?: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return formatTime(iso);
  if (diffDays === 1) return "Gestern";
  if (diffDays < 7) return d.toLocaleDateString("de-DE", { weekday: "short" });
  return d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" });
};

const isSameDay = (a?: string | null, b?: string | null) => {
  if (!a || !b) return false;
  const da = new Date(a), db = new Date(b);
  return da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth() && da.getDate() === db.getDate();
};

const getDayLabel = (iso?: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return "Heute";
  if (diffDays === 1) return "Gestern";
  return d.toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long" });
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
  const [showChat, setShowChat] = React.useState(false);
  const selected = React.useMemo(() => items.find((c) => c.id === selectedId) || null, [items, selectedId]);

  React.useEffect(() => {
    const handleOpenNewMessage = () => setIsNewMessageOpen(true);
    window.addEventListener('open-new-message', handleOpenNewMessage as EventListener);
    return () => window.removeEventListener('open-new-message', handleOpenNewMessage as EventListener);
  }, []);

  React.useEffect(() => {
    const handleFilterMessages = (e: Event) => {
      const customEvent = e as CustomEvent;
      setQuery(customEvent.detail || "");
    };
    window.addEventListener('filter-messages', handleFilterMessages as EventListener);
    return () => window.removeEventListener('filter-messages', handleFilterMessages as EventListener);
  }, []);

  React.useEffect(() => {
    const conversationId = searchParams.get('conversation');
    if (conversationId) {
      setSelectedId(conversationId);
      if (isMobile) setShowChat(true);
    }
  }, [searchParams, isMobile]);

  type Msg = { id: string; conversation_id: string; sender_id: string; content: string; created_at: string };
  const [messages, setMessages] = React.useState<Msg[]>([]);
  const [composer, setComposer] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const listRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Load conversations
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      const data = await loadConversationsWithLast();
      if (!mounted) return;
      setItems(data);
      if (!isMobile) setSelectedId((cur) => cur || data[0]?.id || null);
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, [loadConversationsWithLast, isMobile]);

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
      const updated = await loadConversationsWithLast();
      setItems(updated);
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

  const openChat = (id: string) => {
    setSelectedId(id);
    if (isMobile) setShowChat(true);
  };

  const closeChat = () => {
    setShowChat(false);
    setSelectedId(null);
  };

  // Get recent conversations for quick switch (max 5)
  const recentChats = React.useMemo(() => {
    return items.filter(c => c.id !== selectedId).slice(0, 5);
  }, [items, selectedId]);

  // Mobile Chat View (iMessage Style - below TopNavBar)
  const MobileChatView = () => {
    const name = [selected?.otherUser?.vorname, selected?.otherUser?.nachname].filter(Boolean).join(" ") || "Unbekannt";
    
    // Swipe handling
    const [touchStart, setTouchStart] = React.useState<number | null>(null);
    const [touchEnd, setTouchEnd] = React.useState<number | null>(null);
    const minSwipeDistance = 50;

    const onTouchStart = (e: React.TouchEvent) => {
      setTouchEnd(null);
      setTouchStart(e.targetTouches[0].clientX);
    };

    const onTouchMove = (e: React.TouchEvent) => {
      setTouchEnd(e.targetTouches[0].clientX);
    };

    const onTouchEnd = () => {
      if (!touchStart || !touchEnd) return;
      const distance = touchEnd - touchStart;
      const isRightSwipe = distance > minSwipeDistance;
      if (isRightSwipe) {
        closeChat();
      }
    };
    
    return (
      <div 
        className="min-h-screen bg-background flex flex-col"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Chat Header - Current conversation info */}
        <div className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <div className="flex items-center gap-3 px-3 py-2">
            {/* Back to all messages */}
            <Button variant="ghost" size="sm" onClick={closeChat} className="h-9 px-2 gap-1 text-primary -ml-1">
              <ArrowLeft className="h-5 w-5" />
              <span className="text-sm font-medium">Alle</span>
            </Button>
            
            {/* Current Chat Avatar & Name */}
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Avatar className="h-9 w-9 shrink-0">
                <AvatarImage src={selected?.otherUser?.avatar_url} alt={name} />
                <AvatarFallback className="text-sm font-medium">{name.slice(0,2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="text-sm font-semibold truncate">{name}</div>
                <div className="text-[11px] text-green-500 font-medium">Online</div>
              </div>
            </div>
            
            {/* Quick Switch to other chats */}
            {recentChats.length > 0 && (
              <div className="flex items-center gap-0.5 shrink-0">
                {recentChats.slice(0, 3).map((c) => {
                  const otherName = [c.otherUser?.vorname, c.otherUser?.nachname].filter(Boolean).join(" ") || "?";
                  return (
                    <button
                      key={c.id}
                      onClick={() => setSelectedId(c.id)}
                      className="relative transition-transform active:scale-95"
                    >
                      <Avatar className="h-7 w-7 ring-1 ring-border">
                        <AvatarImage src={c.otherUser?.avatar_url} alt={otherName} />
                        <AvatarFallback className="text-[10px]">{otherName.slice(0,1).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      {c.unreadCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 bg-primary rounded-full border border-background" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Messages */}
        <div ref={listRef} className="flex-1 overflow-auto px-3 pt-2 pb-4 space-y-1 bg-background">
          {messages.map((m, idx) => {
            const prev = messages[idx - 1];
            const showDay = !prev || !isSameDay(m.created_at, prev?.created_at);
            const isSelf = m.sender_id === user?.id;
            const isLastInGroup = !messages[idx + 1] || messages[idx + 1].sender_id !== m.sender_id || !isSameDay(m.created_at, messages[idx + 1]?.created_at);
            
            return (
              <React.Fragment key={m.id}>
                {showDay && (
                  <div className="flex justify-center py-4">
                    <span className="text-xs text-muted-foreground font-medium">
                      {getDayLabel(m.created_at)}
                    </span>
                  </div>
                )}
                <div className={`flex ${isSelf ? 'justify-end' : 'justify-start'}`}>
                  <div 
                    className={`
                      max-w-[80%] px-4 py-2 text-[15px] leading-relaxed
                      ${isSelf 
                        ? 'bg-primary text-primary-foreground rounded-[20px] rounded-br-md' 
                        : 'bg-muted rounded-[20px] rounded-bl-md'
                      }
                      ${isLastInGroup ? 'mb-2' : 'mb-0.5'}
                    `}
                  >
                    {m.content}
                  </div>
                </div>
                {isLastInGroup && (
                  <div className={`text-[11px] text-muted-foreground mb-3 ${isSelf ? 'text-right pr-2' : 'text-left pl-2'}`}>
                    {formatTime(m.created_at)}
                  </div>
                )}
              </React.Fragment>
            );
          })}
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <Avatar className="h-20 w-20 mb-4">
                <AvatarImage src={selected?.otherUser?.avatar_url} alt={name} />
                <AvatarFallback className="text-2xl font-medium">{name.slice(0,2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="text-lg font-semibold">{name}</div>
              <div className="text-sm text-muted-foreground mt-1">Starte eine Unterhaltung</div>
            </div>
          )}
        </div>

        {/* Composer - iMessage Style, above bottom bar */}
        <div className="sticky bottom-0 border-t bg-background px-3 py-2 pb-[calc(env(safe-area-inset-bottom)+70px)]">
          <div className="flex items-end gap-2">
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={composer}
                onChange={(e) => setComposer(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && onSend()}
                placeholder="Nachricht"
                className="w-full px-4 py-2.5 rounded-full bg-muted border-0 text-[15px] placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <Button 
              size="icon" 
              className="h-10 w-10 rounded-full shrink-0"
              onClick={onSend} 
              disabled={!composer.trim() || sending}
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  // Mobile Conversation List (Apple Style - No search bar, uses TopNavBar)
  if (isMobile) {
    if (showChat && selected) {
      return <MobileChatView />;
    }

    return (
      <>
        <NewMessageSearch open={isNewMessageOpen} onOpenChange={setIsNewMessageOpen} />
        
        <div className="min-h-screen bg-background">
          {/* Conversation List - No padding, full width */}
          <div className="divide-y divide-border/50">
            {loading && (
              <div className="flex items-center justify-center py-16">
                <div className="text-sm text-muted-foreground">Lädt...</div>
              </div>
            )}
            
            {!loading && filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 px-6">
                <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Send className="h-10 w-10 text-muted-foreground" />
                </div>
                <div className="text-xl font-semibold text-center">Keine Nachrichten</div>
                <div className="text-sm text-muted-foreground text-center mt-2 max-w-[240px]">
                  Tippe auf den Stift oben rechts, um eine neue Unterhaltung zu starten
                </div>
              </div>
            )}
            
            {!loading && filtered.map((c) => {
              const name = [c.otherUser?.vorname, c.otherUser?.nachname].filter(Boolean).join(" ") || "Unbekannt";
              const hasUnread = false; // TODO: Implement unread status
              
              return (
                <button 
                  key={c.id} 
                  className="w-full text-left px-4 py-3 flex items-center gap-3 active:bg-muted/50 transition-colors"
                  onClick={() => openChat(c.id)}
                >
                  <div className="relative shrink-0">
                    <Avatar className="h-14 w-14">
                      <AvatarImage src={c.otherUser?.avatar_url} alt={name} />
                      <AvatarFallback className="text-lg font-medium bg-gradient-to-br from-primary/20 to-primary/10">
                        {name.slice(0,2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {/* Online indicator */}
                    <div className="absolute bottom-0.5 right-0.5 h-3.5 w-3.5 bg-green-500 rounded-full border-2 border-background" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <span className={`text-[15px] truncate ${hasUnread ? 'font-semibold' : 'font-medium'}`}>
                        {name}
                      </span>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {formatDate(c.lastMessageAt)}
                      </span>
                    </div>
                    <div className={`text-[14px] truncate ${hasUnread ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                      {c.lastMessage?.content || 'Keine Nachrichten'}
                    </div>
                  </div>
                  
                  {/* Chevron */}
                  <ArrowLeft className="h-4 w-4 text-muted-foreground/50 rotate-180 shrink-0" />
                </button>
              );
            })}
          </div>
        </div>
      </>
    );
  }

  // Desktop View (unchanged but cleaned up)
  return (
    <>
      <NewMessageSearch open={isNewMessageOpen} onOpenChange={setIsNewMessageOpen} />

      <main className="w-full py-4 pb-6">
        <div className="grid grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)_280px] gap-4">
          {/* Left: Conversation list */}
          <Card className="p-0 overflow-hidden">
            <div className="p-4 border-b">
              <h1 className="text-lg font-semibold mb-3">Nachrichten</h1>
              <Input 
                value={query} 
                onChange={(e) => setQuery(e.target.value)} 
                placeholder="Suchen" 
                className="bg-muted border-0 rounded-xl"
              />
            </div>
            <div className="max-h-[calc(100vh-200px)] overflow-auto">
              {loading && <div className="p-4 text-sm text-muted-foreground text-center">Lädt...</div>}
              {!loading && filtered.length === 0 && (
                <div className="p-4 text-sm text-muted-foreground text-center">Keine Konversationen</div>
              )}
              {!loading && filtered.map((c) => {
                const name = [c.otherUser?.vorname, c.otherUser?.nachname].filter(Boolean).join(" ") || "Unbekannt";
                const active = selectedId === c.id;
                return (
                  <button 
                    key={c.id} 
                    className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors ${active ? 'bg-primary/10' : 'hover:bg-muted/60'}`} 
                    onClick={() => setSelectedId(c.id)}
                  >
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={c.otherUser?.avatar_url} alt={name} />
                      <AvatarFallback>{name.slice(0,2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <span className="text-sm font-medium truncate">{name}</span>
                        <span className="text-xs text-muted-foreground">{formatDate(c.lastMessageAt)}</span>
                      </div>
                      <div className="text-sm text-muted-foreground truncate">{c.lastMessage?.content || '—'}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Center: Chat */}
          <Card className="flex flex-col min-h-[70vh]">
            {!selected ? (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                Wähle eine Konversation
              </div>
            ) : (
              <>
                <div className="p-4 border-b flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={selected.otherUser?.avatar_url} alt="" />
                    <AvatarFallback>{([selected.otherUser?.vorname, selected.otherUser?.nachname].filter(Boolean).join(" ") || 'U').slice(0,2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold">{[selected.otherUser?.vorname, selected.otherUser?.nachname].filter(Boolean).join(" ") || 'Unbekannt'}</div>
                    <div className="text-xs text-muted-foreground">Online</div>
                  </div>
                </div>

                <div ref={listRef} className="flex-1 overflow-auto p-4 space-y-1">
                  {messages.map((m, idx) => {
                    const prev = messages[idx - 1];
                    const showDay = !prev || !isSameDay(m.created_at, prev?.created_at);
                    const isSelf = m.sender_id === user?.id;
                    const isLastInGroup = !messages[idx + 1] || messages[idx + 1].sender_id !== m.sender_id;
                    
                    return (
                      <React.Fragment key={m.id}>
                        {showDay && (
                          <div className="flex justify-center py-4">
                            <span className="text-xs text-muted-foreground">{getDayLabel(m.created_at)}</span>
                          </div>
                        )}
                        <div className={`flex ${isSelf ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[70%] px-4 py-2 text-sm rounded-2xl ${isSelf ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                            {m.content}
                          </div>
                        </div>
                        {isLastInGroup && (
                          <div className={`text-[11px] text-muted-foreground mb-2 ${isSelf ? 'text-right' : 'text-left'}`}>
                            {formatTime(m.created_at)}
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>

                <div className="border-t p-3">
                  <div className="flex items-center gap-2">
                    <Input
                      value={composer}
                      onChange={(e) => setComposer(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && onSend()}
                      placeholder="Nachricht schreiben..."
                      className="rounded-full bg-muted border-0"
                    />
                    <Button size="icon" className="rounded-full h-10 w-10" onClick={onSend} disabled={!composer.trim() || sending}>
                      <Send className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </Card>

          {/* Right sidebar */}
          <Card className="p-4 hidden lg:block">
            <div className="text-sm font-semibold mb-3">Weitere Posteingänge</div>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div>Keine weiteren Posteingänge</div>
            </div>
          </Card>
        </div>
      </main>
    </>
  );
}
