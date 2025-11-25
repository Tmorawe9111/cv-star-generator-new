import React from "react";
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Building2, Briefcase, FileText, User, Users as UsersIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/hooks/useCompany";

interface Props {
  query: string;
  open: boolean;
  onSelect: (group: string, payload: { id: string; label: string }) => void;
}

interface Suggestion {
  id: string;
  label: string;
  sublabel?: string;
  avatar_url?: string | null;
}

const useDebouncedValue = <T,>(value: T, delay = 250) => {
  const [v, setV] = React.useState(value);
  React.useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
};

const SearchAutosuggestCompany: React.FC<Props> = ({ query, open, onSelect }) => {
  const { company } = useCompany();
  const debounced = useDebouncedValue(query, 300);
  const [loading, setLoading] = React.useState(false);
  const [candidates, setCandidates] = React.useState<Suggestion[]>([]);
  const [companies, setCompanies] = React.useState<Suggestion[]>([]);
  const [posts, setPosts] = React.useState<Suggestion[]>([]);
  const [jobs, setJobs] = React.useState<Suggestion[]>([]);
  const [followers, setFollowers] = React.useState<Suggestion[]>([]);

  React.useEffect(() => {
    if (!open || !debounced || debounced.trim().length < 2) {
      setCandidates([]);
      setCompanies([]);
      setPosts([]);
      setJobs([]);
      setFollowers([]);
      return;
    }

    let cancelled = false;
    const run = async () => {
      setLoading(true);
      try {
        const q = debounced.trim();

        // Unternehmen
        const { data: companyRows } = await supabase
          .from("companies")
          .select("id, name, logo_url")
          .ilike("name", `%${q}%`)
          .limit(5);
        if (!cancelled) {
          setCompanies(
            (companyRows || []).map((r: any) => ({ id: r.id, label: r.name, avatar_url: r.logo_url }))
          );
        }

        // Beiträge (öffentliche Company-Posts)
        const { data: postRows } = await supabase
          .from("company_posts")
          .select("id, content")
          .eq("visibility", "public")
          .ilike("content", `%${q}%`)
          .limit(5);
        if (!cancelled) {
          setPosts((postRows || []).map((r: any) => ({ id: r.id, label: r.content?.slice(0, 60) || "Beitrag" })));
        }

        // Jobs (aus job_posts)
        const { data: jobRows } = await supabase
          .from("job_posts")
          .select("id, title")
          .eq("is_active", true)
          .ilike("title", `%${q}%`)
          .limit(5);
        if (!cancelled) {
          setJobs((jobRows || []).map((r: any) => ({ id: r.id, label: r.title || "Jobangebot" })));
        }

        // Freigeschaltete Kandidaten (falls verfügbar)
        if (company?.id) {
          try {
            const { data: tokenRows } = await supabase
              .from("tokens_used")
              .select("profile_id, used_at")
              .eq("company_id", company.id)
              .order("used_at", { ascending: false })
              .limit(200);

            const ids = Array.from(new Set((tokenRows || []).map((t: any) => t.profile_id))).slice(0, 100);
            if (ids.length) {
              const { data: profileRows } = await supabase
                .from("profiles")
                .select("id, vorname, nachname, avatar_url")
                .in("id", ids)
                .limit(50);

              const filtered = (profileRows || []).filter((p: any) => {
                const name = `${p.vorname || ""} ${p.nachname || ""}`.trim();
                return name.toLowerCase().includes(q.toLowerCase());
              });

              if (!cancelled) {
                setCandidates(
                  filtered.slice(0, 5).map((p: any) => ({
                    id: p.id,
                    label: `${p.vorname || ""} ${p.nachname || ""}`.trim() || "Kandidat/in",
                    avatar_url: p.avatar_url ?? null,
                  }))
                );
              }
            } else if (!cancelled) {
              setCandidates([]);
            }
          } catch (e) {
            if (!cancelled) setCandidates([]);
          }
        }

        // Follower/Interessenten (company_user_interests -> profiles)
        if (company?.id) {
          try {
            const { data: interestRows } = await supabase
              .from("company_user_interests")
              .select("user_id")
              .eq("company_id", company.id)
              .limit(200);

            const uids = Array.from(new Set((interestRows || []).map((r: any) => r.user_id))).slice(0, 100);
            if (uids.length) {
              const { data: followerProfiles } = await supabase
                .from("profiles")
                .select("id, vorname, nachname, avatar_url")
                .in("id", uids)
                .limit(50);

              const filteredF = (followerProfiles || []).filter((p: any) => {
                const name = `${p.vorname || ""} ${p.nachname || ""}`.trim();
                return name.toLowerCase().includes(q.toLowerCase());
              });

              if (!cancelled) {
                setFollowers(
                  filteredF.slice(0, 5).map((p: any) => ({
                    id: p.id,
                    label: `${p.vorname || ""} ${p.nachname || ""}`.trim() || "Follower",
                    avatar_url: p.avatar_url ?? null,
                  }))
                );
              }
            } else if (!cancelled) {
              setFollowers([]);
            }
          } catch (e) {
            if (!cancelled) setFollowers([]);
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [open, debounced, company?.id]);

  if (!open || !debounced || debounced.trim().length < 2) return null;

  return (
    <Command className="rounded-md border bg-background shadow-md">
      <CommandList className="max-h-[320px]">
        <CommandEmpty>{loading ? "Suche…" : "Keine Ergebnisse."}</CommandEmpty>

        {/* Kandidaten */}
        <CommandGroup heading="Kandidaten (freigeschaltet)">
          {candidates.map((item) => (
            <CommandItem
              key={`cand-${item.id}`}
              value={`cand-${item.id}`}
              onSelect={() => onSelect("candidates", { id: item.id, label: item.label })}
            >
              <Avatar className="h-6 w-6 mr-2">
                <AvatarImage src={item.avatar_url || undefined} />
                <AvatarFallback>
                  <User className="h-3 w-3" />
                </AvatarFallback>
              </Avatar>
              <span>{item.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        {/* Unternehmen */}
        <CommandGroup heading="Unternehmen">
          {companies.map((item) => (
            <CommandItem
              key={`comp-${item.id}`}
              value={`comp-${item.id}`}
              onSelect={() => onSelect("companies", { id: item.id, label: item.label })}
            >
              <Avatar className="h-6 w-6 mr-2">
                <AvatarImage src={item.avatar_url || undefined} />
                <AvatarFallback>
                  <Building2 className="h-3 w-3" />
                </AvatarFallback>
              </Avatar>
              <span>{item.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        {/* Beiträge */}
        <CommandGroup heading="Beiträge">
          {posts.map((item) => (
            <CommandItem
              key={`post-${item.id}`}
              value={`post-${item.id}`}
              onSelect={() => onSelect("posts", { id: item.id, label: item.label })}
            >
              <FileText className="h-4 w-4 mr-2" />
              <span>{item.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        {/* Jobs */}
        <CommandGroup heading="Jobs">
          {jobs.map((item) => (
            <CommandItem
              key={`job-${item.id}`}
              value={`job-${item.id}`}
              onSelect={() => onSelect("jobs", { id: item.id, label: item.label })}
            >
              <Briefcase className="h-4 w-4 mr-2" />
              <span>{item.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        {/* Follower */}
        <CommandGroup heading="Follower">
          {followers.map((item) => (
            <CommandItem
              key={`fol-${item.id}`}
              value={`fol-${item.id}`}
              onSelect={() => onSelect("followers", { id: item.id, label: item.label })}
            >
              <Avatar className="h-6 w-6 mr-2">
                <AvatarImage src={item.avatar_url || undefined} />
                <AvatarFallback>
                  <UsersIcon className="h-3 w-3" />
                </AvatarFallback>
              </Avatar>
              <span>{item.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  );
};

export default SearchAutosuggestCompany;
