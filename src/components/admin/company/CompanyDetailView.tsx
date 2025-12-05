import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CompanyOverview } from "./CompanyOverview";
import { AdminPlanManager } from "./AdminPlanManager";
import { AdminPlanHistory } from "./AdminPlanHistory";
import { AdminLocationManager } from "./AdminLocationManager";
import { AdminTokenManager } from "./AdminTokenManager";
import { SeatManager } from "./SeatManager";
import { CompanyActivityLog } from "./CompanyActivityLog";
import { CompanyJobsList } from "./CompanyJobsList";
import { CompanyNotesPanel } from "./CompanyNotesPanel";
import { UnlockStatistics } from "./UnlockStatistics";

interface CompanyDetailViewProps {
  companyId: string;
}

export function CompanyDetailView({ companyId }: CompanyDetailViewProps) {
  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="grid w-full grid-cols-10">
        <TabsTrigger value="overview">Übersicht</TabsTrigger>
        <TabsTrigger value="plan">Plan</TabsTrigger>
        <TabsTrigger value="plan-history">Plan-Historie</TabsTrigger>
        <TabsTrigger value="locations">Standorte</TabsTrigger>
        <TabsTrigger value="tokens">Tokens</TabsTrigger>
        <TabsTrigger value="team">Team</TabsTrigger>
        <TabsTrigger value="unlocks">Freischaltungen</TabsTrigger>
        <TabsTrigger value="jobs">Stellen</TabsTrigger>
        <TabsTrigger value="activity">Aktivität</TabsTrigger>
        <TabsTrigger value="notes">Notizen</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-4 mt-6">
        <CompanyOverview companyId={companyId} />
      </TabsContent>

      <TabsContent value="plan" className="space-y-4 mt-6">
        <AdminPlanManager companyId={companyId} />
      </TabsContent>

      <TabsContent value="plan-history" className="space-y-4 mt-6">
        <AdminPlanHistory companyId={companyId} />
      </TabsContent>

      <TabsContent value="locations" className="space-y-4 mt-6">
        <AdminLocationManager companyId={companyId} />
      </TabsContent>

      <TabsContent value="tokens" className="space-y-4 mt-6">
        <AdminTokenManager companyId={companyId} />
      </TabsContent>

      <TabsContent value="team" className="space-y-4 mt-6">
        <SeatManager companyId={companyId} />
      </TabsContent>

      <TabsContent value="unlocks" className="space-y-4 mt-6">
        <UnlockStatistics companyId={companyId} />
      </TabsContent>

      <TabsContent value="jobs" className="space-y-4 mt-6">
        <CompanyJobsList companyId={companyId} />
      </TabsContent>

      <TabsContent value="activity" className="space-y-4 mt-6">
        <CompanyActivityLog companyId={companyId} />
      </TabsContent>

      <TabsContent value="notes" className="space-y-4 mt-6">
        <CompanyNotesPanel companyId={companyId} />
      </TabsContent>
    </Tabs>
  );
}
