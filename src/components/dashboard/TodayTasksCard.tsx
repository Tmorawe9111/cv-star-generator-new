import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Activity } from "lucide-react";
import type { PipelineCounts } from "@/types/dashboard";

export interface TodayTasksCardProps {
  pipeline: PipelineCounts;
}

export function TodayTasksCard({ pipeline }: TodayTasksCardProps) {
  const todoItems = [
    {
      title: `${pipeline.new_apps} neue Bewerbungen prüfen`,
      subtitle: "Pipeline · Eingegangen",
      highlight: pipeline.new_apps > 0,
    },
    {
      title: `${pipeline.unlocked_and_plan} Interviews terminieren`,
      subtitle: "Freigeschaltet",
      highlight: pipeline.unlocked_and_plan > 0,
    },
    {
      title: `${pipeline.interviews_planned} Interviews diese Woche`,
      subtitle: "Kalender",
      highlight: pipeline.interviews_planned > 0,
    },
  ];

  return (
    <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2 text-primary">
          <Activity className="h-5 w-5" />
          <span className="text-sm font-semibold uppercase tracking-wide">Heute wichtig</span>
        </div>
        <CardTitle className="text-lg">Ihre nächsten Schritte</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {todoItems.map((item) => (
          <div
            key={item.title}
            className="flex items-start justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"
          >
            <div>
              <p className={item.highlight ? "font-semibold text-slate-900" : "text-slate-700"}>
                {item.title}
              </p>
              <p className="text-xs text-muted-foreground">{item.subtitle}</p>
            </div>
            <Button size="sm" variant="ghost" className="text-primary">
              Öffnen
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
