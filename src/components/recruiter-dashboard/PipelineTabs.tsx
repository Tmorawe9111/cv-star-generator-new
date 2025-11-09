import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

export type PipelineCounts = {
  new_apps: number;
  unlocked_and_plan: number;
  interviews_planned: number;
};

const TAB_CONFIG = [
  {
    id: "new",
    label: "Neue Bewerbungen",
    description: "Frisch eingegangen und noch unbearbeitet",
    countKey: "new_apps" as const,
  },
  {
    id: "unlocked",
    label: "Freigeschaltet · Interview planen",
    description: "Profile, die auf einen Interviewtermin warten",
    countKey: "unlocked_and_plan" as const,
  },
  {
    id: "planned",
    label: "Geplante Interviews",
    description: "Termine stehen fest – Nachbereitung im Blick behalten",
    countKey: "interviews_planned" as const,
  },
] as const;

interface PipelineTabsProps {
  activeTab: "new" | "unlocked" | "planned";
  onTabChange: (tab: "new" | "unlocked" | "planned") => void;
  counts: PipelineCounts | null;
}

export function PipelineTabs({ activeTab, onTabChange, counts }: PipelineTabsProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <Tabs value={activeTab} onValueChange={value => onTabChange(value as PipelineTabsProps["activeTab"])}>
        <TabsList className="flex w-full justify-start gap-2 overflow-x-auto rounded-full bg-slate-100 p-1">
          {TAB_CONFIG.map(tab => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-primary"
            >
              <span>{tab.label}</span>
              <Badge variant="secondary" className="rounded-full bg-primary/10 text-primary">
                {counts ? counts[tab.countKey] : "–"}
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <div className="mt-3 text-sm text-muted-foreground">
        {TAB_CONFIG.find(tab => tab.id === activeTab)?.description}
      </div>
    </div>
  );
}
