import React from "react";
import { KpiCard } from "@/components/admin/KpiCard";
import { useKpis } from "@/hooks/useKpis";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Building2, FileText, AlertCircle, TrendingUp, CheckCircle2 } from "lucide-react";

export default function Overview() {
  const { data, isLoading } = useKpis("last_30_days");

  return (
    <div className="px-3 sm:px-6 py-6 max-w-[1600px] mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard Overview</h1>
        <p className="text-muted-foreground mt-1">KPIs und Metriken der letzten 30 Tage</p>
      </div>

      {/* User Metrics */}
      <section>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Users className="h-5 w-5" />
          User Metriken
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)
          ) : (
            <>
              <KpiCard title="Neue User" value={data!.newUsers} icon={Users} />
              <KpiCard title="Gesamt User" value={data!.totalUsers} icon={Users} />
              <KpiCard title="Vervollständigte Profile" value={data!.completeProfiles} icon={CheckCircle2} />
              <KpiCard title="DAU Users" value={data!.dauUsers} icon={TrendingUp} />
            </>
          )}
        </div>
      </section>

      {/* CV Generator Metrics */}
      <section>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5" />
          CV Generator Metriken
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)
          ) : (
            <>
              <KpiCard title="CV Generator Klicks" value={data!.cvGeneratorClicks} icon={FileText} />
              <KpiCard title="CV Fehlermeldungen" value={data!.cvErrors} icon={AlertCircle} />
              <KpiCard title="CV Abbrüche" value={data!.cvAbandonments} icon={AlertCircle} />
              <KpiCard title="CV Completions" value={Object.values(data!.cvStepCompletions).reduce((a, b) => a + b, 0)} icon={CheckCircle2} />
            </>
          )}
        </div>
        
        {/* CV Step Completion Rates */}
        {!isLoading && data && Object.keys(data.cvStepCompletions).length > 0 && (
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>CV Step Completion Rates</CardTitle>
              <CardDescription>Anzahl der Completions pro Step</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
                {Object.entries(data.cvStepCompletions)
                  .sort(([a], [b]) => Number(a) - Number(b))
                  .map(([step, count]) => (
                    <div key={step} className="text-center p-3 bg-muted/50 rounded-lg">
                      <div className="text-2xl font-bold text-primary">{count}</div>
                      <div className="text-xs text-muted-foreground mt-1">Step {step}</div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}
      </section>

      {/* Company Metrics */}
      <section>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Unternehmens Metriken
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)
          ) : (
            <>
              <KpiCard title="Neue Unternehmen" value={data!.newCompanies} icon={Building2} />
              <KpiCard title="Vervollständigte Profile" value={data!.completeCompanyProfiles} icon={CheckCircle2} />
              <KpiCard title="DAU Companies" value={data!.dauCompanies} icon={TrendingUp} />
              <KpiCard title="Entsperrte Profile" value={data!.unlockedProfiles} icon={TrendingUp} />
            </>
          )}
        </div>
      </section>

      <section className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <article className="rounded-2xl border bg-card shadow-sm p-4">
          <header className="mb-2"><h2 className="text-sm font-medium text-muted-foreground">DAU over time</h2></header>
          <Skeleton className="h-48 rounded-xl" />
        </article>
        <article className="rounded-2xl border bg-card shadow-sm p-4">
          <header className="mb-2"><h2 className="text-sm font-medium text-muted-foreground">Registrations per week</h2></header>
          <Skeleton className="h-48 rounded-xl" />
        </article>
      </section>

      <section className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <article className="rounded-2xl border bg-card shadow-sm p-4">
          <header className="mb-2"><h2 className="text-sm font-medium text-muted-foreground">Plan distribution</h2></header>
          <Skeleton className="h-48 rounded-xl" />
        </article>
        <article className="rounded-2xl border bg-card shadow-sm p-4">
          <header className="mb-2"><h2 className="text-sm font-medium text-muted-foreground">Activity by Bundesland</h2></header>
          <Skeleton className="h-48 rounded-xl" />
        </article>
      </section>
    </div>
  );
}
