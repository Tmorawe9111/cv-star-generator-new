import React from "react";
import { Home, Search, Columns3, MessageSquare, Settings as SettingsIcon, Building2, Bell, Users, Briefcase, LogOut, CreditCard, MapPin, BarChart3, Sparkles } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useCompany } from "@/hooks/useCompany";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import AppSidebar, { type NavItem } from "@/components/layout/AppSidebar";
import { LovableStyleTokenWidget } from "@/components/billing-v2/LovableStyleTokenWidget";
import { useCompanyUserRole, isCompanyAdminRole } from "@/hooks/useCompanyUserRole";

interface CompanySidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function CompanySidebar({ collapsed, onToggle }: CompanySidebarProps) {
  const { company } = useCompany();
  const location = useLocation();
  const navigate = useNavigate();
  const { data: role } = useCompanyUserRole(company?.id);
  const isSuperadmin = role === "owner";
  const canSeeRecruiting = role !== "marketing" && role !== "viewer";
  const canBuyTokens = role === "owner" || role === "admin" || role === "recruiter";
  const canSeeBilling = canBuyTokens; // billing page used for token purchases too
  const canSeeSettings = isCompanyAdminRole(role); // owner/admin can access settings hub

  // Check both German and English paths for active state
  const isActive = (to: string) => {
    const germanPath = to.replace('/company/', '/unternehmen/')
      .replace('/dashboard', '/startseite')
      .replace('/profile', '/profil')
      .replace('/jobs', '/stellenanzeigen')
      .replace('/search', '/kandidatensuche')
      .replace('/matching', '/matching')
      .replace('/unlocked', '/freigeschaltet')
      .replace('/candidates/pipeline', '/bewerber/pipeline')
      .replace('/feed', '/feed')
      .replace('/notifications', '/benachrichtigungen')
      .replace('/analytics', '/analytics')
      .replace('/settings/locations', '/einstellungen/standorte')
      .replace('/billing-v2', '/abrechnung')
      .replace('/settings', '/einstellungen');
    
    return location.pathname === to || 
           location.pathname === germanPath ||
           location.pathname.startsWith(to.replace(":id", "")) ||
           location.pathname.startsWith(germanPath.replace(":id", ""));
  };

  const handleNavigate = (href: string) => (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    navigate(href);
  };

  const topItems: NavItem[] = [
    {
      label: "Dashboard",
      href: "/unternehmen/startseite",
      icon: <Home className="h-4 w-4" />,
      active: isActive("/company/dashboard"),
      onClick: handleNavigate("/unternehmen/startseite"),
    },
    {
      label: "Unternehmensprofil",
      href: "/unternehmen/profil",
      icon: <Building2 className="h-4 w-4" />,
      active: isActive("/company/profile"),
      onClick: handleNavigate("/unternehmen/profil"),
    },
    ...(canSeeRecruiting ? [{
      label: "Stellenanzeigen",
      href: "/unternehmen/stellenanzeigen",
      icon: <Briefcase className="h-4 w-4" />,
      active: isActive("/company/jobs"),
      onClick: handleNavigate("/unternehmen/stellenanzeigen"),
    },
    {
      label: "Kandidatensuche",
      href: "/unternehmen/kandidatensuche",
      icon: <Search className="h-4 w-4" />,
      active: isActive("/company/search"),
      onClick: handleNavigate("/unternehmen/kandidatensuche"),
    },
    {
      label: "Matching",
      href: "/unternehmen/matching",
      icon: <Sparkles className="h-4 w-4" />,
      active: isActive("/company/matching") || isActive("/unternehmen/matching"),
      onClick: handleNavigate("/unternehmen/matching"),
    },
    {
      label: "Freigeschaltete Talente",
      href: "/unternehmen/freigeschaltet",
      icon: <Users className="h-4 w-4" />,
      active: isActive("/company/unlocked"),
      onClick: handleNavigate("/unternehmen/freigeschaltet"),
    },
    {
      label: "Pipeline",
      href: "/unternehmen/bewerber/pipeline",
      icon: <Columns3 className="h-4 w-4" />,
      active: isActive("/company/candidates/pipeline"),
      onClick: handleNavigate("/unternehmen/bewerber/pipeline"),
    },
    {
      label: "Analytics",
      href: "/unternehmen/analytics",
      icon: <BarChart3 className="h-4 w-4" />,
      active: isActive("/company/analytics"),
      onClick: handleNavigate("/unternehmen/analytics"),
    },
    ] : []),
  ];

  const communityItems: NavItem[] = [
    {
      label: "Community",
      href: "/unternehmen/feed",
      icon: <MessageSquare className="h-4 w-4" />,
      active: isActive("/company/feed"),
      onClick: handleNavigate("/unternehmen/feed"),
    },
    {
      label: "Benachrichtigungen",
      href: "/unternehmen/benachrichtigungen",
      icon: <Bell className="h-4 w-4" />,
      active: isActive("/company/notifications"),
      onClick: handleNavigate("/unternehmen/benachrichtigungen"),
    },
  ];

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    // Nach Logout zur Startseite, nicht zur Login-Seite
    window.location.href = "/";
  };

  const systemItems: NavItem[] = [
    {
      label: "Standorte",
      href: "/unternehmen/einstellungen/standorte",
      icon: <MapPin className="h-4 w-4" />,
      active: isActive("/company/settings/locations"),
      onClick: handleNavigate("/unternehmen/einstellungen/standorte"),
    },
    ...(canSeeBilling ? [{
      label: "Abrechnung & Tokens",
      href: "/unternehmen/abrechnung",
      icon: <CreditCard className="h-4 w-4" />,
      active: isActive("/company/billing-v2"),
      onClick: handleNavigate("/unternehmen/abrechnung"),
    }] : []),
    ...(canSeeSettings ? [{
      label: "Einstellungen",
      href: "/unternehmen/einstellungen",
      icon: <SettingsIcon className="h-4 w-4" />,
      active: isActive("/company/settings"),
      onClick: handleNavigate("/unternehmen/einstellungen"),
    }] : []),
    {
      label: "Abmelden",
      href: "#logout",
      icon: <LogOut className="h-4 w-4" />,
      onClick: (event) => {
        event.preventDefault();
        handleSignOut();
      },
    },
  ];

  const companyId = company?.id;

  const { data: subscription } = useQuery({
    queryKey: ["billing-v2-subscription", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("current_period_end, status, cancel_at_period_end, plan_key, interval")
        .eq("company_id", companyId)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .maybeSingle();
      if (error) {
        console.error('Error fetching subscription:', error);
        return null;
      }
      if (!data) return null;
      return {
        current_period_end: (data as any).current_period_end,
        status: (data as any).status,
        cancel_at_period_end: (data as any).cancel_at_period_end || false,
        plan_key: (data as any).plan_key || null,
        interval: (data as any).interval || null,
      };
    },
  });

  const companySnapshot: any = company ? {
    id: company.id,
    plan_name: (company as any).plan_name || (company as any).active_plan_id || (company as any).selected_plan_id,
    plan_interval: (company as any).plan_interval,
    available_tokens: company.active_tokens ?? (company as any).available_tokens, // active_tokens ist der verfügbare Bestand
    monthly_tokens: (company as any).monthly_tokens,
    seats_included: (company as any).seats_included,
    next_invoice_at: (company as any).next_invoice_at,
    active_plan_id: (company as any).active_plan_id,
    selected_plan_id: (company as any).selected_plan_id,
    active_tokens: company.active_tokens, // Für direkten Zugriff
    name: company.name, // Für Logo und Name
    logo_url: company.logo_url, // Für Logo
    total_tokens_ever: (company as any).total_tokens_ever, // Gesamte Anzahl jemals gewährt/gekauft
  } : null;

  const handleBuyTokens = React.useCallback(() => {
    navigate("/unternehmen/abrechnung?open=token");
  }, [navigate]);

  const handleUpgradePlan = React.useCallback(() => {
    navigate("/unternehmen/abrechnung?open=upgrade");
  }, [navigate]);

  const TokenWidget = React.useMemo(() => {
    return function TokenBalance() {
      return (
        <LovableStyleTokenWidget
          company={companySnapshot}
          subscription={subscription ? {
            current_period_end: subscription.current_period_end,
            status: subscription.status,
            cancel_at_period_end: subscription.cancel_at_period_end,
            plan_key: subscription.plan_key || undefined,
            interval: subscription.interval || undefined,
          } : undefined}
          collapsed={collapsed}
          onBuyTokens={canBuyTokens ? handleBuyTokens : undefined}
          onUpgradePlan={isSuperadmin ? handleUpgradePlan : undefined}
        />
      );
    };
  }, [companySnapshot, subscription, collapsed, handleBuyTokens, handleUpgradePlan, canBuyTokens, isSuperadmin]);

  return (
    <AppSidebar
      topItems={topItems}
      communityItems={communityItems}
      systemItems={systemItems}
      TokenWidget={TokenWidget}
      collapsed={collapsed}
      onToggle={onToggle}
    />
  );
}
