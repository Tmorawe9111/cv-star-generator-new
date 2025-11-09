import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Briefcase, Users, CalendarClock, Target, Rocket, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export type DashboardCounts = {
  active_jobs: number;
  applications_total: number;
  interviews_planned: number;
  hires_total: number;
  unlocked_profiles: number;
  seats_used: number;
  seats_total: number;
};

interface StatItem {
  id: keyof DashboardCounts | "seats";
  label: string;
  value: string;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
  cta?: React.ReactNode;
}

interface StatsGridProps {
  counts: DashboardCounts | null;
  loading?: boolean;
  onManageSeats?: () => void;
}

function formatNumber(value: number) {
  if (value == null) return "0";
  return new Intl.NumberFormat("de-DE").format(value);
}

function StatsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <Skeleton key={index} className="h-32 rounded-2xl" />
      ))}
    </div>
  );
}

export function StatsGrid({ counts, loading, onManageSeats }: StatsGridProps) {
  if (loading) {
    return <StatsSkeleton />;
  }

  if (!counts) {
    return (
      <Card className="flex h-32 items-center justify-center rounded-2xl bg-white text-sm text-muted-foreground">
        Keine Kennzahlen verfügbar.
      </Card>
    );
  }

  const items: StatItem[] = [
    {
      id: "active_jobs",
      label: "Aktive Stellenanzeigen",
      value: formatNumber(counts.active_jobs),
      hint: "momentan live",
      icon: Briefcase,
    },
    {
      id: "applications_total",
      label: "Bewerbungen gesamt",
      value: formatNumber(counts.applications_total),
      hint: "über alle Jobs",
      icon: Users,
    },
    {
      id: "interviews_planned",
      label: "Geplante Interviews",
      value: formatNumber(counts.interviews_planned),
      hint: "anstehende Termine",
      icon: CalendarClock,
    },
    {
      id: "hires_total",
      label: "Einstellungen gesamt",
      value: formatNumber(counts.hires_total),
      hint: "abgeschlossen",
      icon: Target,
    },
    {
      id: "unlocked_profiles",
      label: "Freigeschaltete Profile",
      value: formatNumber(counts.unlocked_profiles),
      hint: "aktiv im Prozess",
      icon: Rocket,
    },
    {
      id: "seats",
      label: "Sitze genutzt",
      value: `${formatNumber(counts.seats_used)} / ${formatNumber(counts.seats_total)}`,
      hint: "Teamverwaltung",
      icon: ShieldCheck,
      cta: (
        <Button
          size="sm"
          variant="link"
          className="mt-2 h-auto px-0 text-sm text-primary"
          onClick={onManageSeats}
        >
          Sitze verwalten
        </Button>
      ),
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {items.map(item => {
        const Icon = item.icon;
        return (
          <Card
            key={item.id}
            className={cn(
              "flex h-full flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md",
            )}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{item.label}</p>
                <p className="mt-3 text-3xl font-semibold text-slate-900">{item.value}</p>
                <p className="mt-2 text-xs text-slate-500">{item.hint}</p>
              </div>
              <div className="rounded-xl bg-primary/10 p-2 text-primary">
                <Icon className="h-5 w-5" />
              </div>
            </div>
            {item.cta}
          </Card>
        );
      })}
    </div>
  );
}
