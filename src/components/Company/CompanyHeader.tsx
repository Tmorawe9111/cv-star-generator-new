import React from "react";
import { useCompany } from "@/hooks/useCompany";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PanelLeftClose, PanelLeftOpen, Search as SearchIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import SearchAutosuggestCompany from "@/components/Company/feed/SearchAutosuggestCompany";
import { useNavigate } from "react-router-dom";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import AppNavbar from "@/components/layout/AppNavbar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { UnlockCodeInput } from "./UnlockCodeInput";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

type CompanyHeaderProps = {
  collapsed: boolean;
  onToggleSidebar: () => void;
};

export function CompanyHeader({ collapsed, onToggleSidebar }: CompanyHeaderProps) {
  const { company } = useCompany();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [q, setQ] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [profileOpen, setProfileOpen] = React.useState(false);
  const hoverTimeout = React.useRef<NodeJS.Timeout | null>(null);

  const locationText = React.useMemo(() => {
    const primary = company?.primary_location ?? "";
    const cityCountry = [company?.city, company?.country].filter(Boolean).join(", ");
    return cityCountry || primary || "";
  }, [company?.city, company?.country, company?.primary_location]);

  const displayName = React.useMemo(() => {
    const meta = user?.user_metadata || {};
    return meta.full_name || meta.name || company?.contact_person || company?.name || user?.email || "Recruiter";
  }, [company?.contact_person, company?.name, user?.email, user?.user_metadata]);

  const userAvatar = React.useMemo(() => {
    return (user?.user_metadata as Record<string, any> | undefined)?.avatar_url || company?.logo_url;
  }, [user?.user_metadata, company?.logo_url]);

  const userHeadline = React.useMemo(() => {
    return (user?.user_metadata as Record<string, any> | undefined)?.headline ||
      (user?.user_metadata as Record<string, any> | undefined)?.bio ||
      company?.description ||
      "Recruiter:in im BeVisiblle Portal";
  }, [user?.user_metadata, company?.description]);

  const companyRoleLine = company
    ? `${company.name}${company.industry ? ` · ${company.industry}` : ""}`
    : "Unternehmensprofil";

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const openProfileMenu = () => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    setProfileOpen(true);
  };

  const scheduleProfileClose = () => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    hoverTimeout.current = setTimeout(() => setProfileOpen(false), 120);
  };

  React.useEffect(() => {
    return () => {
      if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    };
  }, []);

  const BrandComponent = React.useCallback(() => {
    const ToggleIcon = collapsed ? PanelLeftOpen : PanelLeftClose;
    return (
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label={collapsed ? "Sidebar öffnen" : "Sidebar einklappen"}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-600 transition hover:bg-gray-100"
        >
          <ToggleIcon className="h-4 w-4" />
        </button>
        <img src="/assets/Logo_visiblle_transparent.png" alt="BeVisiblle" className="h-8 w-8 object-contain" />
        <span className="text-lg font-semibold text-gray-900">
          BeVisib<span className="text-primary">ll</span>e Recruiter
        </span>
      </div>
    );
  }, [collapsed, onToggleSidebar]);

  const SearchComponent = React.useCallback(() => {
    const minChars = 3;
    const trimmed = q.trim();
    const showResults = open && trimmed.length >= minChars;

    return (
      <div className="relative">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            if (!open) setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 160)}
          placeholder="Suche in freigeschalteten Kandidaten, Unternehmen, Beiträgen, Jobs und Followern…"
          className="h-9 w-full pl-10"
          aria-label="Unternehmenssuche"
        />
        {showResults && (
          <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50 w-full drop-shadow-xl">
            <SearchAutosuggestCompany
              query={trimmed}
              open
              onSelect={(group, payload) => {
                setOpen(false);
                if (group === "candidates" || group === "followers") {
                  navigate(`/company/profile-view/${payload.id}`);
                  setQ("");
                  return;
                }
                if (group === "companies") {
                  navigate(`/companies/${payload.id}`);
                  setQ("");
                  return;
                }
                if (group === "posts" || group === "jobs") {
                  navigate(`/company/posts?query=${encodeURIComponent(payload.label || trimmed)}`);
                  setQ(payload.label || "");
                  return;
                }
              }}
            />
          </div>
        )}
      </div>
    );
  }, [navigate, open, q]);

  const RightComponent = React.useCallback(() => (
    <div className="flex items-center gap-3">
      <NotificationBell recipientType="company" recipientId={company?.id ?? null} />
      <DropdownMenu open={profileOpen} onOpenChange={setProfileOpen}>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            onMouseEnter={openProfileMenu}
            onMouseLeave={scheduleProfileClose}
            onClick={() => setProfileOpen(prev => !prev)}
            className="flex items-center gap-2 rounded-full px-2 py-1 text-left transition hover:bg-white/60"
          >
            <Avatar className="h-9 w-9">
              {userAvatar ? <AvatarImage src={userAvatar} alt={displayName} /> : null}
              <AvatarFallback>{displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            {company?.name ? (
              <span className="hidden text-sm font-semibold text-slate-900 sm:inline">{company.name}</span>
            ) : null}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-[320px] overflow-hidden rounded-2xl border border-slate-200 bg-white p-0 shadow-2xl"
          onMouseEnter={openProfileMenu}
          onMouseLeave={scheduleProfileClose}
        >
          <div className="flex items-center gap-3 px-4 py-4">
            <Avatar className="h-12 w-12">
              {userAvatar ? <AvatarImage src={userAvatar} alt={displayName} /> : null}
              <AvatarFallback>{displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-base font-semibold text-slate-900">{displayName}</p>
              <p className="text-xs text-muted-foreground">{companyRoleLine}</p>
            </div>
          </div>
          <DropdownMenuSeparator className="bg-slate-200" />
          <DropdownMenuItem
            onClick={() => {
              setProfileOpen(false);
                      navigate("/unternehmen/einstellungen");
            }}
            className="flex cursor-pointer items-center justify-between gap-2 px-4 py-3 text-sm"
          >
            <span>Kontoübersicht</span>
            <Badge variant="secondary" className="text-[10px] uppercase tracking-wide">Neu</Badge>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              setProfileOpen(false);
                      navigate("/unternehmen/einstellungen/produkte");
            }}
            className="flex cursor-pointer items-center px-4 py-3 text-sm"
          >
            Produkteinstellungen
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              setProfileOpen(false);
                      navigate("/unternehmen/einstellungen/team");
            }}
            className="flex cursor-pointer items-center px-4 py-3 text-sm"
          >
            User:innen im Admin-Center verwalten
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              setProfileOpen(false);
                      navigate("/unternehmen/abrechnung?open=manage");
            }}
            className="flex cursor-pointer items-center px-4 py-3 text-sm"
          >
            Vertrag ändern
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              setProfileOpen(false);
              window.open("https://www.bevisiblle.de", "_blank", "noopener,noreferrer");
            }}
            className="flex cursor-pointer items-center px-4 py-3 text-sm"
          >
            Weiter zu BeVisiblle.de
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-slate-200" />
          <UnlockCodeInput onSuccess={() => setProfileOpen(false)} />
          <DropdownMenuSeparator className="bg-slate-200" />
          <DropdownMenuItem
            onClick={() => {
              setProfileOpen(false);
              handleLogout();
            }}
            className="flex cursor-pointer items-center px-4 py-3 text-sm text-red-600 focus:text-red-600"
          >
            Ausloggen
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  ), [company?.id, company?.name, companyRoleLine, displayName, handleLogout, navigate, openProfileMenu, profileOpen, scheduleProfileClose, userAvatar, userHeadline, company?.logo_url]);

  return (
    <AppNavbar
      BrandComponent={BrandComponent}
      SearchComponent={SearchComponent}
      RightComponent={RightComponent}
    />
  );
}
