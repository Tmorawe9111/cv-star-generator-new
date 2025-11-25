import React, { useState, useRef, useEffect } from 'react';
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Bell, Search as SearchIcon, MessageSquare, Users, User, LogOut, Settings, MoreHorizontal, Plus, ArrowLeft, Pencil } from "lucide-react";
import { subscribeOpenSearchMode, openPostComposer, subscribeComposerOpened, subscribeComposerClosed, subscribeVisibilityPromptOpened, subscribeVisibilityPromptClosed } from '@/lib/event-bus';
import FeedSortBar from '@/components/community/FeedSortBar';
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import SearchAutosuggest, { SuggestionType } from "@/components/marketplace/SearchAutosuggest";
import ConnectionsDrawer from "@/components/community/ConnectionsDrawer";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import MessagePopoverPanel from "@/components/community/MessagePopoverPanel";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { useAuth } from "@/hooks/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";


export const NAVBAR_HEIGHT = 56; // h-14 (Desktop) = 56px
export const NAVBAR_HEIGHT_MOBILE = 48; // h-12 (Mobile) = 48px

const titleMap: Record<string, string> = {
  "/community/contacts": "Meine Kontakte",
  "/community/companies": "Unternehmen",
  "/community/messages": "Nachrichten",
  "/community/jobs": "Jobs",
  "/marketplace": "Community",
  "/dashboard": "Home Feed",
  "/network": "My Network",
  "/companies": "Companies",
  "/messages": "Messages",
  "/notifications": "Notifications",
  "/profile": "Profil"
};
export default function TopNavBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const path = location.pathname;
  const title = Object.keys(titleMap).find(p => path.startsWith(p)) ? titleMap[Object.keys(titleMap).find(p => path.startsWith(p)) as string] : "Home Feed";
  const isJobsPage = path === '/community/jobs' || path === '/jobs';
  const isMessagesPage = path === '/community/messages' || path === '/messages';
  const [q, setQ] = useState(() => {
    // Initialize from URL params if on jobs page
    if (isJobsPage) {
      return searchParams.get('q') || '';
    }
    return "";
  });
  const [open, setOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [msgOpen, setMsgOpen] = useState(false);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [isNavbarVisible, setIsNavbarVisible] = useState(true);
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [isVisibilityPromptOpen, setIsVisibilityPromptOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);

  // Fetch user profile for avatar
  const { data: profile } = useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      const { data } = await supabase
        .from('profiles')
        .select('avatar_url, first_name, last_name')
        .eq('id', user.id)
        .single();
      
      return data;
    }
  });
  const handleSubmit = () => {
    const term = q.trim();
    if (isJobsPage) {
      // On jobs page, update URL params to trigger search in Jobs component
      const sp = new URLSearchParams();
      if (term) sp.set('q', term);
      navigate(`${path}?${sp.toString()}`, { replace: true });
      setOpen(false);
      return;
    }
    const sp = new URLSearchParams(location.search);
    if (term) sp.set('q', term);else sp.delete('q');
    navigate(`/marketplace?${sp.toString()}`);
  };

  // Sync search input with URL params on jobs page
  useEffect(() => {
    if (isJobsPage) {
      const urlQ = searchParams.get('q') || '';
      setQ(prevQ => {
        if (urlQ !== prevQ) {
          return urlQ;
        }
        return prevQ;
      });
    }
  }, [searchParams, isJobsPage]);
  const handleSearchClose = () => {
    setOpen(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  // Scroll behavior: hide navbar on scroll down, show on scroll up (Mobile only)
  useEffect(() => {
    let lastScrollY = window.scrollY;
    let ticking = false;

    const handleScroll = () => {
      // Only apply scroll behavior on mobile
      if (window.innerWidth >= 768) return;
      
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          
          // Am Seitenanfang: Nav immer anzeigen
          if (currentScrollY <= 0) {
            setIsNavbarVisible(true);
            lastScrollY = currentScrollY;
            ticking = false;
            return;
          }

          // Bestimme Scroll-Richtung
          if (currentScrollY > lastScrollY) {
            // Nach unten scrollen → sofort ausblenden
            setIsNavbarVisible(false);
          } else if (currentScrollY < lastScrollY) {
            // Nach oben scrollen (auch minimal) → sofort wieder einblenden
            setIsNavbarVisible(true);
          }

          lastScrollY = currentScrollY;
          ticking = false;
        });
        
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []); // Empty dependency array - we use local variables inside

  // Listen for search mode open event
  useEffect(() => {
    const unsubscribe = subscribeOpenSearchMode(() => {
      setIsSearchMode(true);
      // Focus the mobile input after a short delay to ensure it's rendered
      setTimeout(() => {
        mobileInputRef.current?.focus();
      }, 100);
    });
    return unsubscribe;
  }, []);

  // Listen for composer opened/closed events (Mobile only)
  useEffect(() => {
    const unsubscribeOpened = subscribeComposerOpened(() => {
      if (window.innerWidth < 768) {
        setIsComposerOpen(true);
        setIsNavbarVisible(false);
      }
    });
    const unsubscribeClosed = subscribeComposerClosed(() => {
      setIsComposerOpen(false);
      setIsNavbarVisible(true);
    });
    return () => {
      unsubscribeOpened();
      unsubscribeClosed();
    };
  }, []);

  // Listen for visibility prompt opened/closed events (all devices)
  useEffect(() => {
    const unsubscribeOpened = subscribeVisibilityPromptOpened(() => {
      setIsVisibilityPromptOpen(true);
      setIsNavbarVisible(false);
    });
    const unsubscribeClosed = subscribeVisibilityPromptClosed(() => {
      setIsVisibilityPromptOpen(false);
      setIsNavbarVisible(true);
    });
    return () => {
      unsubscribeOpened();
      unsubscribeClosed();
    };
  }, []);

  // Handle search input focus
  const handleSearchFocus = () => {
    setIsSearchMode(true);
    setOpen(q.trim().length >= 2);
  };

  const handleSearchBlur = () => {
    // Delay to allow click events on suggestions
    setTimeout(() => {
      if (!open) {
        setIsSearchMode(false);
      }
    }, 200);
  };

  // Check if we're on marketplace page
  const isMarketplace = location.pathname === '/marketplace' || location.pathname.startsWith('/marketplace');
  // Check if we're on dashboard page
  const isDashboard = location.pathname === '/dashboard' || location.pathname === '/';
  
  // Sticky navbar at top with high z-index and scroll behavior
  return (
    <>
      {/* Main Navbar */}
      {/* Desktop: Original layout, Mobile: Instagram-style with scroll behavior */}
      {!(isMarketplace && isSearchMode) && !isComposerOpen && !isVisibilityPromptOpen && (
        <div 
          className={cn(
            "sticky top-0 z-[300] border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
            // Scroll behavior only on mobile, but hide on all devices when visibility prompt is open
            "transition-transform duration-300",
            isNavbarVisible && !isVisibilityPromptOpen ? "translate-y-0" : "-translate-y-full"
          )}
        >
          <div className="flex h-12 md:h-14 items-center px-2 sm:px-3 md:px-4 gap-1 sm:gap-2 md:gap-4 max-w-full overflow-hidden">
            {/* Desktop: Always show Sidebar Trigger + Logo (unchanged) */}
            <div className="hidden md:flex items-center gap-3">
              <SidebarTrigger className="p-2 hover:bg-muted/40 rounded-lg transition-colors shrink-0" />
              <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/mein-bereich')}>
                <img src="/assets/Logo_visiblle-2.svg" alt="BeVisiblle Logo" className="h-8 w-8" />
                <span className="font-semibold">
                  <span className="text-foreground">Be</span>
                  <span className="text-foreground">Visib</span>
                  <span className="text-primary">ll</span>
                  <span className="text-foreground">e</span>
                </span>
              </div>
            </div>

            {/* Mobile Messages Page: Arrow, Searchbar, 3 dots, Pencil */}
            {isMessagesPage ? (
              <>
                {/* Mobile Messages: Arrow left */}
                <button
                  onClick={() => navigate(-1)}
                  className="md:hidden p-2 -m-2 hover:bg-muted/40 rounded-xl transition-all duration-200 min-h-[44px] min-w-[44px] flex items-center justify-center active:scale-95 shrink-0"
                  aria-label="Zurück"
                >
                  <ArrowLeft className="h-5 w-5 shrink-0" />
                </button>

                {/* Mobile Messages: Searchbar in center */}
                <div className="md:hidden flex-1 relative">
                  <Input 
                    ref={mobileInputRef} 
                    placeholder="Nachrichten durchsuchen" 
                    value={q} 
                    onChange={(e) => {
                      setQ(e.target.value);
                      // Dispatch event to filter messages
                      if (typeof window !== 'undefined') {
                        const event = new CustomEvent('filter-messages', { detail: e.target.value });
                        window.dispatchEvent(event);
                      }
                    }}
                    className="pr-10 h-9 text-sm" 
                  />
                  <SearchIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>

                {/* Mobile Messages: 3 dots and Pencil */}
                <div className="md:hidden flex items-center gap-1 shrink-0">
                  <button
                    className="p-2 -m-2 hover:bg-muted/40 rounded-xl transition-all duration-200 min-h-[44px] min-w-[44px] flex items-center justify-center active:scale-95"
                    aria-label="Mehr Optionen"
                  >
                    <MoreHorizontal className="h-5 w-5 shrink-0" />
                  </button>
                  <button
                    onClick={() => {
                      // Dispatch event to open new message composer
                      if (typeof window !== 'undefined') {
                        const event = new CustomEvent('open-new-message');
                        window.dispatchEvent(event);
                      }
                    }}
                    className="p-2 -m-2 hover:bg-muted/40 rounded-xl transition-all duration-200 min-h-[44px] min-w-[44px] flex items-center justify-center active:scale-95"
                    aria-label="Neue Nachricht"
                  >
                    <Pencil className="h-5 w-5 shrink-0" />
                  </button>
                </div>
              </>
            ) : isJobsPage ? (
              <>
                {/* Mobile Jobs: Logo links */}
                <div className="md:hidden shrink-0">
                  <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/mein-bereich')}>
                    <img src="/assets/Logo_visiblle-2.svg" alt="BeVisiblle Logo" className="h-8 w-8" />
                  </div>
                </div>

                {/* Mobile Jobs: Searchbar in center - clickable to open modal */}
                <div className="md:hidden flex-1 relative">
                  <Input 
                    ref={mobileInputRef} 
                    placeholder="Jobs suchen..." 
                    value={q} 
                    readOnly
                    onClick={() => {
                      // Dispatch event to open search modal
                      if (typeof window !== 'undefined') {
                        const event = new CustomEvent('open-job-search-modal');
                        window.dispatchEvent(event);
                      }
                    }}
                    className="pr-10 h-9 text-sm cursor-pointer" 
                  />
                  <SearchIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>

                {/* Mobile Jobs: No bell icon on jobs page */}
              </>
            ) : (
              <>
                {/* Mobile: Plus Icon (oben links) */}
                <button
                  onClick={() => openPostComposer()}
                  className="md:hidden p-2 -m-2 hover:bg-muted/40 rounded-xl transition-all duration-200 min-h-[44px] min-w-[44px] flex items-center justify-center active:scale-95 shrink-0"
                  aria-label="Beitrag erstellen"
                >
                  <Plus className="h-5 w-5 shrink-0" />
                </button>

                {/* Mobile: Logo centered */}
                <div className="md:hidden flex-1 flex justify-center">
                  <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/mein-bereich')}>
                    <img src="/assets/Logo_visiblle-2.svg" alt="BeVisiblle Logo" className="h-8 w-8" />
                  </div>
                </div>
              </>
            )}

            {/* Desktop: Search Bar */}
            <div className="hidden md:flex flex-1 max-w-md mx-4 relative">
              <Input 
                ref={inputRef} 
                placeholder="Personen, Unternehmen suchen..." 
                value={q} 
                onChange={e => {
                  setQ(e.target.value);
                  setOpen(e.target.value.trim().length >= 2);
                }} 
                onKeyDown={e => e.key === 'Enter' && handleSubmit()} 
                onFocus={() => setOpen(q.trim().length >= 2)} 
                className="pr-10" 
              />
              <SearchIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground cursor-pointer" onClick={handleSubmit} />
              <SearchAutosuggest 
                query={q} 
                open={open} 
                anchorRef={inputRef} 
                onClose={handleSearchClose} 
                onSelect={(type: SuggestionType, item: {
                  id: string;
                  label: string;
                }) => {
                  setOpen(false);
                  if (type === 'person') {
                    navigate(`/u/${item.id}`);
                  } else if (type === 'company') {
                    navigate(`/companies/${item.id}`);
                  }
                }} 
              />
            </div>

            {/* Desktop: Icons aligned to the right */}
            <div className="hidden md:flex items-center gap-3 ml-auto shrink-0">
              <button 
                className="p-2 -m-2 hover:bg-muted/40 hover:shadow-soft rounded-xl transition-all duration-200 min-h-[44px] min-w-[44px] flex items-center justify-center active:scale-95 shrink-0"
                onClick={() => navigate('/community/contacts')}
                aria-label="Kontakte"
              >
                <Users className="h-5 w-5 shrink-0" />
              </button>
              
              <button 
                className="p-2 -m-2 hover:bg-muted/40 hover:shadow-soft rounded-xl transition-all duration-200 min-h-[44px] min-w-[44px] flex items-center justify-center active:scale-95 shrink-0"
                onClick={() => navigate('/community/messages')}
                aria-label="Nachrichten"
              >
                <MessageSquare className="h-5 w-5 shrink-0" />
              </button>
              
              <NotificationBell recipientType="profile" recipientId={user?.id || null} />
              
              <button 
                className="p-1 -m-1 hover:opacity-80 transition-opacity min-h-[44px] min-w-[44px] flex items-center justify-center active:scale-95 shrink-0"
                onClick={() => navigate('/profile')}
                aria-label="Profil"
              >
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarImage src={profile?.avatar_url || undefined} alt={`${profile?.first_name || ''} ${profile?.last_name || ''}`} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {profile?.first_name?.[0] || 'U'}
                  </AvatarFallback>
                </Avatar>
              </button>
            </div>

            {/* Mobile: Notification Bell */}
            <div className="md:hidden shrink-0">
              <NotificationBell recipientType="profile" recipientId={user?.id || null} />
            </div>
          </div>
          
          {/* Mobile: Feed Sort Bar (only on Dashboard) - scrolls with navbar */}
          {isDashboard && (
            <div 
              className={cn(
                "md:hidden border-t border-border/60 px-3 py-2 bg-background/95 backdrop-blur transition-transform duration-300",
                isNavbarVisible ? "translate-y-0" : "-translate-y-full"
              )}
            >
              <FeedSortBar />
            </div>
          )}
        </div>
      )}

      {/* Search Bar - appears when search is focused (Mobile) */}
      {isSearchMode && (
        <div 
          className={cn(
            "sticky top-0 z-[299] border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-transform duration-300 md:hidden",
            isNavbarVisible ? "translate-y-0" : "-translate-y-full"
          )}
        >
          <div className="flex h-12 items-center px-3 gap-2">
            <div className="flex-1 relative">
              <Input 
                ref={mobileInputRef} 
                placeholder="Suchen..." 
                value={q} 
                onChange={e => {
                  setQ(e.target.value);
                  setOpen(e.target.value.trim().length >= 2);
                }} 
                onKeyDown={e => e.key === 'Enter' && handleSubmit()} 
                onFocus={handleSearchFocus}
                onBlur={handleSearchBlur}
                className="pr-10 h-9 text-sm" 
              />
              <SearchIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground cursor-pointer" onClick={handleSubmit} />
            </div>
            <button
              onClick={() => {
                setIsSearchMode(false);
                setQ('');
                setOpen(false);
              }}
              className="p-2 -m-2 hover:bg-muted/40 rounded-xl transition-all duration-200 min-h-[44px] min-w-[44px] flex items-center justify-center active:scale-95 shrink-0"
              aria-label="Schließen"
            >
              <MoreHorizontal className="h-5 w-5 shrink-0" />
            </button>
          </div>
          <SearchAutosuggest 
            query={q} 
            open={open} 
            anchorRef={mobileInputRef} 
            onClose={handleSearchClose} 
            onSelect={(type: SuggestionType, item: {
              id: string;
              label: string;
            }) => {
              setOpen(false);
              setIsSearchMode(false);
              if (type === 'person') {
                navigate(`/u/${item.id}`);
              } else if (type === 'company') {
                navigate(`/companies/${item.id}`);
              }
            }} 
          />
        </div>
      )}

      
      {/* Connections Drawer */}
      <ConnectionsDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />
    </>
  );
}