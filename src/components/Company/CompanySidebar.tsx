import React from "react";
import { Home, Search, Columns3, MessageSquare, Settings as SettingsIcon, Building2, Bell, Users, Briefcase, LogOut, CreditCard, MapPin } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useCompany } from "@/hooks/useCompany";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import AppSidebar, { type NavItem } from "@/components/layout/AppSidebar";
import { LovableStyleTokenWidget } from "@/components/billing-v2/LovableStyleTokenWidget";

interface CompanySidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function CompanySidebar({ collapsed, onToggle }: CompanySidebarProps) {
  const { company } = useCompany();
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (to: string) => location.pathname === to || location.pathname.startsWith(to.replace(":id", ""));

  const handleNavigate = (href: string) => (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    navigate(href);
  };

  const topItems: NavItem[] = [
    {
      label: "Dashboard",
      href: "/company/dashboard",
      icon: <Home className="h-4 w-4" />,
      active: isActive("/company/dashboard"),
      onClick: handleNavigate("/company/dashboard"),
    },
    {
      label: "Unternehmensprofil",
      href: "/company/profile",
      icon: <Building2 className="h-4 w-4" />,
      active: isActive("/company/profile"),
      onClick: handleNavigate("/company/profile"),
    },
    {
      label: "Stellenanzeigen",
      href: "/company/jobs",
      icon: <Briefcase className="h-4 w-4" />,
      active: isActive("/company/jobs"),
      onClick: handleNavigate("/company/jobs"),
    },
    {
      label: "Kandidatensuche",
      href: "/company/search",
      icon: <Search className="h-4 w-4" />,
      active: isActive("/company/search"),
      onClick: handleNavigate("/company/search"),
    },
    {
      label: "Freigeschaltete Talente",
      href: "/company/unlocked",
      icon: <Users className="h-4 w-4" />,
      active: isActive("/company/unlocked"),
      onClick: handleNavigate("/company/unlocked"),
    },
    {
      label: "Pipeline",
      href: "/company/candidates/pipeline",
      icon: <Columns3 className="h-4 w-4" />,
      active: isActive("/company/candidates/pipeline"),
      onClick: handleNavigate("/company/candidates/pipeline"),
    },
  ];

  const communityItems: NavItem[] = [
    {
      label: "Community",
      href: "/company/feed",
      icon: <MessageSquare className="h-4 w-4" />,
      active: isActive("/company/feed"),
      onClick: handleNavigate("/company/feed"),
    },
    {
      label: "Benachrichtigungen",
      href: "/company/notifications",
      icon: <Bell className="h-4 w-4" />,
      active: isActive("/company/notifications"),
      onClick: handleNavigate("/company/notifications"),
    },
  ];

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const systemItems: NavItem[] = [
    {
      label: "Standorte",
      href: "/company/settings/locations",
      icon: <MapPin className="h-4 w-4" />,
      active: isActive("/company/settings/locations"),
      onClick: handleNavigate("/company/settings/locations"),
    },
    {
      label: "Abrechnung & Tokens",
      href: "/company/billing-v2",
      icon: <CreditCard className="h-4 w-4" />,
      active: isActive("/company/billing-v2"),
      onClick: handleNavigate("/company/billing-v2"),
    },
    {
      label: "Einstellungen",
      href: "/company/settings",
      icon: <SettingsIcon className="h-4 w-4" />,
      active: isActive("/company/settings"),
      onClick: handleNavigate("/company/settings"),
    },
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
    navigate("/company/billing-v2?open=token");
  }, [navigate]);

  const handleUpgradePlan = React.useCallback(() => {
    navigate("/company/billing-v2?open=upgrade");
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
          onBuyTokens={handleBuyTokens}
          onUpgradePlan={handleUpgradePlan}
        />
      );
    };
  }, [companySnapshot, subscription, collapsed, handleBuyTokens, handleUpgradePlan]);

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
