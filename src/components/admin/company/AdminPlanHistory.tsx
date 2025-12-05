import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { History, Calendar, Coins, Briefcase, Users, MapPin, Sparkles } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";

interface AdminPlanHistoryProps {
  companyId: string;
}

export function AdminPlanHistory({ companyId }: AdminPlanHistoryProps) {
  const { data: assignments, isLoading } = useQuery({
    queryKey: ["company-plan-history", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("company_plan_assignments")
        .select(`
          *,
          plan:subscription_plans!inner(id, name)
        `)
        .eq("company_id", companyId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return data;
    },
  });

  // Fetch assigned_by user emails separately
  const { data: userEmails } = useQuery({
    queryKey: ["plan-assignment-users", assignments],
    queryFn: async () => {
      if (!assignments || assignments.length === 0) return {};
      
      const userIds = assignments
        .map((a: any) => a.assigned_by)
        .filter((id: string | null) => id !== null) as string[];
      
      if (userIds.length === 0) return {};

      const { data, error } = await supabase
        .from("auth.users")
        .select("id, email")
        .in("id", userIds);

      if (error) {
        // Try profiles table as fallback
        const { data: profileData } = await supabase
          .from("profiles")
          .select("id, email")
          .in("id", userIds);
        
        if (profileData) {
          return Object.fromEntries(profileData.map((p: any) => [p.id, p.email]));
        }
        return {};
      }

      return Object.fromEntries((data || []).map((u: any) => [u.id, u.email]));
    },
    enabled: !!assignments && assignments.length > 0,
  });

  const formatCents = (cents: number | null) => {
    if (cents === null) return "Standard";
    return `€${(cents / 100).toFixed(2)}`;
  };

  const formatUnlimited = (value: number | null) => {
    if (value === null || value === -1) return "∞";
    return value.toString();
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!assignments || assignments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Plan-Historie
          </CardTitle>
          <CardDescription>
            Chronologische Übersicht aller Plan-Änderungen
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <History className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
          <p className="text-muted-foreground">Keine Plan-Historie vorhanden</p>
          <p className="text-sm text-muted-foreground mt-2">
            Sobald diesem Unternehmen ein Plan zugewiesen wird, erscheint die Historie hier.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Plan-Historie
        </CardTitle>
        <CardDescription>
          Chronologische Übersicht aller Plan-Änderungen
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {assignments.map((assignment: any) => {
            const plan = assignment.plan as any;
            const assignedByEmail = assignment.assigned_by 
              ? (userEmails as any)?.[assignment.assigned_by] 
              : null;
            const isActive = assignment.is_active && 
              (!assignment.valid_until || new Date(assignment.valid_until) > new Date());

            return (
              <div
                key={assignment.id}
                className={`p-4 rounded-lg border ${
                  isActive ? "bg-primary/5 border-primary" : "bg-muted/30"
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">{plan?.name || assignment.plan_id}</h4>
                      {isActive && <Badge variant="default">Aktiv</Badge>}
                      {!isActive && <Badge variant="secondary">Inaktiv</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(assignment.created_at), {
                        addSuffix: true,
                        locale: de,
                      })}
                    </p>
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(assignment.created_at).toLocaleDateString("de-DE", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                    {assignment.valid_until && (
                      <div className="mt-1">
                        Bis: {new Date(assignment.valid_until).toLocaleDateString("de-DE")}
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 pt-3 border-t">
                  <div className="flex items-center gap-2 text-sm">
                    <Coins className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-muted-foreground">Tokens</div>
                      <div className="font-semibold">
                        {assignment.custom_tokens !== null 
                          ? formatUnlimited(assignment.custom_tokens)
                          : "Standard"}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-muted-foreground">Jobs</div>
                      <div className="font-semibold">
                        {assignment.custom_jobs !== null 
                          ? formatUnlimited(assignment.custom_jobs)
                          : "Standard"}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-muted-foreground">Seats</div>
                      <div className="font-semibold">
                        {assignment.custom_seats !== null 
                          ? formatUnlimited(assignment.custom_seats)
                          : "Standard"}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-muted-foreground">Standorte</div>
                      <div className="font-semibold">
                        {assignment.custom_locations !== null 
                          ? formatUnlimited(assignment.custom_locations)
                          : "Standard"}
                      </div>
                    </div>
                  </div>
                </div>

                {(assignment.custom_price_monthly_cents !== null || 
                  assignment.custom_price_yearly_cents !== null ||
                  assignment.custom_token_price_cents !== null) && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3 pt-3 border-t">
                    {assignment.custom_price_monthly_cents !== null && (
                      <div className="text-sm">
                        <div className="text-muted-foreground">Preis (Monat)</div>
                        <div className="font-semibold">
                          {formatCents(assignment.custom_price_monthly_cents)}
                        </div>
                      </div>
                    )}
                    {assignment.custom_price_yearly_cents !== null && (
                      <div className="text-sm">
                        <div className="text-muted-foreground">Preis (Jahr)</div>
                        <div className="font-semibold">
                          {formatCents(assignment.custom_price_yearly_cents)}
                        </div>
                      </div>
                    )}
                    {assignment.custom_token_price_cents !== null && (
                      <div className="text-sm">
                        <div className="text-muted-foreground">Token-Preis</div>
                        <div className="font-semibold">
                          {formatCents(assignment.custom_token_price_cents)}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {assignment.billing_cycle && (
                  <div className="mt-3 pt-3 border-t">
                    <Badge variant="outline">{assignment.billing_cycle}</Badge>
                  </div>
                )}

                {assignment.notes && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-sm text-muted-foreground">
                      <strong>Notizen:</strong> {assignment.notes}
                    </p>
                  </div>
                )}

                {assignedByEmail && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    Zugewiesen von: {assignedByEmail}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

