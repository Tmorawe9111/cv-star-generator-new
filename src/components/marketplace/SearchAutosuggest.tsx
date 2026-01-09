import React from "react";
import { createPortal } from "react-dom";
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Building2, FileText, User2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/hooks/useCompany";

function useDebouncedValue<T>(value: T, delay: number) {
  const [debounced, setDebounced] = React.useState(value);
  React.useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

interface SuggestionPerson {
  id: string;
  vorname?: string | null;
  nachname?: string | null;
  avatar_url?: string | null;
  profile_slug?: string | null;
}

interface SuggestionCompany {
  id: string;
  name: string;
  logo_url?: string | null;
}

interface SuggestionPost {
  id: string;
  content: string;
}

export type SuggestionType = "person" | "company" | "post";

export interface SearchAutosuggestProps {
  query: string;
  onSelect: (type: SuggestionType, payload: { id: string; label: string; profile_slug?: string | null }) => void;
  open: boolean;
  anchorRef?: React.RefObject<HTMLElement>;
  onClose?: () => void;
}

const MAX_PER_GROUP = 5;

export default function SearchAutosuggest({ query, onSelect, open, anchorRef, onClose }: SearchAutosuggestProps) {
  const { company } = useCompany();
  const [loading, setLoading] = React.useState(false);
  const [people, setPeople] = React.useState<SuggestionPerson[]>([]);
  const [companies, setCompanies] = React.useState<SuggestionCompany[]>([]);
  const [posts, setPosts] = React.useState<SuggestionPost[]>([]);
  const [position, setPosition] = React.useState({ top: 0, left: 0, width: 0 });

  const debouncedQ = useDebouncedValue(query, 200);
  
  // Check if user is a company user
  const isCompanyUser = !!company;

  // Update position when open state changes
  React.useEffect(() => {
    if (open && anchorRef?.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
  }, [open, anchorRef]);

  React.useEffect(() => {
    let active = true;
    const run = async () => {
      if (!open || !debouncedQ || debouncedQ.trim().length < 2) {
        setPeople([]); setCompanies([]); setPosts([]); return;
      }
      setLoading(true);
      try {
        const q = debouncedQ.trim().toLowerCase();
        console.log('[SearchAutosuggest] Searching for:', q, 'isCompanyUser:', isCompanyUser);
        
        // Build profile query - different filters for companies vs regular users
        // Use separate queries for vorname and nachname to ensure better results
        let profileQuery = supabase
          .from("profiles")
          .select("id, vorname, nachname, avatar_url, profile_slug")
          .or(`vorname.ilike.%${q}%,nachname.ilike.%${q}%`);
        
        // Companies should only see published and visible profiles
        // Regular users should see ALL profiles when searching (including incomplete ones)
        // This allows users to find and connect with anyone, even if profile is not complete
        if (isCompanyUser) {
          profileQuery = profileQuery
            .eq("profile_published", true)
            .eq("visibility_mode", "visible");
        }
        // For regular users: no additional filters - show all profiles
        
        const [peopleRes, companiesRes, postsRes] = await Promise.all([
          profileQuery.limit(MAX_PER_GROUP),
          supabase
            .rpc('get_companies_public', { search: q, limit_count: MAX_PER_GROUP, offset_count: 0 }),
          supabase
            .from("company_posts")
            .select("id, content")
            .ilike("content", `%${q}%`)
            .limit(MAX_PER_GROUP),
        ]);
        
        if (!active) return;
        
        console.log('[SearchAutosuggest] Results:', {
          people: peopleRes.data?.length || 0,
          companies: companiesRes.data?.length || 0,
          posts: postsRes.data?.length || 0,
          peopleError: peopleRes.error,
          peopleData: peopleRes.data
        });
        
        if (peopleRes.error) {
          console.error('[SearchAutosuggest] Error fetching people:', peopleRes.error);
        }
        
        setPeople(peopleRes.data || []);
        setCompanies((companiesRes.data as any) || []);
        setPosts((postsRes.data as any) || []);
      } catch (e) {
        console.error('[SearchAutosuggest] Unexpected error:', e);
      } finally {
        if (active) setLoading(false);
      }
    };
    run();
    return () => { active = false; };
  }, [debouncedQ, open, isCompanyUser]);

  if (!open) return null;

  const dropdown = (
    <>
      {/* Click catcher to close on outside click */}
      <div 
        className="fixed inset-0 z-[1099]" 
        onClick={onClose}
      />
      
      {/* Search results dropdown */}
      <Card 
        className="fixed z-[1100] overflow-hidden p-0 shadow-lg bg-white border"
        style={{
          top: position.top + 8,
          left: position.left,
          width: position.width
        }}
      >
        <Command shouldFilter={false} className="bg-background">
          <CommandList>
            <CommandEmpty>{loading ? "Suche…" : "Keine Vorschläge"}</CommandEmpty>

            {people.length > 0 && (
              <CommandGroup heading="Personen">
                {people.map((p) => {
                  const label = `${p.vorname ?? ""} ${p.nachname ?? ""}`.trim() || "Unbekannt";
                  return (
                    <CommandItem key={`p-${p.id}`} onSelect={() => onSelect("person", { id: p.id, label, profile_slug: p.profile_slug })}>
                      <User2 className="mr-2 h-4 w-4 text-muted-foreground" />
                      <Avatar className="h-6 w-6 mr-2">
                        <AvatarImage src={p.avatar_url ?? undefined} alt={label} />
                        <AvatarFallback>{label.slice(0,2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <span className="truncate">{label}</span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}

            {companies.length > 0 && (
              <CommandGroup heading="Unternehmen">
                {companies.map((c) => (
                  <CommandItem key={`c-${c.id}`} onSelect={() => onSelect("company", { id: c.id, label: (c as any).name })}>
                    <Building2 className="mr-2 h-4 w-4 text-muted-foreground" />
                    <Avatar className="h-6 w-6 mr-2">
                      <AvatarImage src={c.logo_url ?? undefined} alt={(c as any).name} />
                      <AvatarFallback>{((c as any).name || "U").slice(0,2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span className="truncate">{(c as any).name}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {posts.length > 0 && (
              <CommandGroup heading="Beiträge">
                {posts.map((post) => (
                  <CommandItem key={`post-${post.id}`} onSelect={() => onSelect("post", { id: post.id, label: post.content.slice(0, 50) })}>
                    <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span className="truncate">{post.content}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </Card>
    </>
  );

  return createPortal(dropdown, document.body);
}
