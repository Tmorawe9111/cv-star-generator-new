import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/hooks/useCompany";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Users, 
  Unlock, 
  TrendingUp, 
  TrendingDown,
  DollarSign, 
  Clock, 
  Target,
  BarChart3,
  PieChart,
  Calendar,
  ArrowUp,
  ArrowDown
} from "lucide-react";
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart as RechartsPieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from "recharts";
import { format, subDays, startOfDay } from "date-fns";
import { de } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { cn } from "@/lib/utils";

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

interface UnlockStats {
  total: number;
  basic: number;
  contact: number;
  byJob: number;
  generalInterest: number;
  previousTotal: number;
  trend?: number;
}

interface PipelineStats {
  new: number;
  interview: number;
  offer: number;
  hired: number;
  rejected: number;
  previousHired: number;
  trend?: number;
}

interface TokenStats {
  totalSpent: number;
  totalPurchased: number;
  currentBalance: number;
  avgPerUnlock: number;
  previousSpent: number;
  trend?: number;
}

interface DailyUnlocks {
  date: string;
  basic: number;
  contact: number;
  total: number;
  id?: string; // Unique identifier for React keys
}

interface TrendIndicatorProps {
  value: number;
  label?: string;
}

function TrendIndicator({ value, label }: TrendIndicatorProps) {
  const isUp = value > 0;
  const color = isUp ? "text-green-600" : "text-red-600";
  const bgColor = isUp ? "bg-green-50" : "bg-red-50";
  
  return (
    <div className={cn("mt-2 flex items-center gap-1 text-xs", color)}>
      <div className={cn("flex items-center gap-1 rounded px-1.5 py-0.5", bgColor)}>
        {isUp ? (
          <ArrowUp className="h-3 w-3" />
        ) : (
          <ArrowDown className="h-3 w-3" />
        )}
        <span className="font-medium">{Math.abs(value).toFixed(1)}%</span>
      </div>
      {label && <span className="text-muted-foreground">{label}</span>}
    </div>
  );
}

export default function CompanyAnalytics() {
  const { company } = useCompany();
  const queryClient = useQueryClient();
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d" | "all">("30d");

  // Calculate date range
  const getDateRange = () => {
    const now = new Date();
    switch (timeRange) {
      case "7d":
        return { 
          from: subDays(now, 7), 
          to: now,
          previousFrom: subDays(now, 14),
          previousTo: subDays(now, 7)
        };
      case "30d":
        return { 
          from: subDays(now, 30), 
          to: now,
          previousFrom: subDays(now, 60),
          previousTo: subDays(now, 30)
        };
      case "90d":
        return { 
          from: subDays(now, 90), 
          to: now,
          previousFrom: subDays(now, 180),
          previousTo: subDays(now, 90)
        };
      default:
        return { from: null, to: now, previousFrom: null, previousTo: null };
    }
  };

  const { from, to, previousFrom, previousTo } = getDateRange();

  // Fetch unlock statistics
  const { data: unlockStats, isLoading: unlocksLoading } = useQuery({
    queryKey: ["company-unlock-stats", company?.id, timeRange],
    queryFn: async () => {
      if (!company?.id) return null;

      let query = supabase
        .from("profile_unlocks")
        .select("*")
        .eq("company_id", company.id);

      if (from) {
        query = query.gte("unlocked_at", from.toISOString());
      }
      if (to) {
        query = query.lte("unlocked_at", to.toISOString());
      }

      const { data, error } = await query;
      if (error) {
        console.error("Error fetching unlock stats:", error);
        throw error;
      }

      console.log("Unlock stats data:", data?.length, "unlocks found");

      // Previous period for comparison
      let previousQuery = supabase
        .from("profile_unlocks")
        .select("*")
        .eq("company_id", company.id);

      if (previousFrom) {
        previousQuery = previousQuery.gte("unlocked_at", previousFrom.toISOString());
      }
      if (previousTo) {
        previousQuery = previousQuery.lte("unlocked_at", previousTo.toISOString());
      }

      const { data: previousData } = await previousQuery;

      const currentTotal = data?.length || 0;
      const previousTotal = previousData?.length || 0;
      const trend = previousTotal > 0 
        ? ((currentTotal - previousTotal) / previousTotal) * 100 
        : (currentTotal > 0 ? 100 : 0);

      const stats: UnlockStats = {
        total: currentTotal,
        basic: data?.filter((u: any) => u.level === "basic").length || 0,
        contact: data?.filter((u: any) => u.level === "contact").length || 0,
        byJob: data?.filter((u: any) => u.job_posting_id !== null).length || 0,
        generalInterest: data?.filter((u: any) => u.general_interest === true).length || 0,
        previousTotal,
        trend,
      };

      return stats;
    },
    enabled: !!company?.id,
    refetchOnWindowFocus: true,
    refetchInterval: 30000,
    staleTime: 10000,
  });

  // Fetch daily unlocks for chart
  const { data: dailyUnlocks, isLoading: dailyUnlocksLoading } = useQuery({
    queryKey: ["company-daily-unlocks", company?.id, timeRange],
    queryFn: async () => {
      if (!company?.id) return [];

      let query = supabase
        .from("profile_unlocks")
        .select("unlocked_at, level")
        .eq("company_id", company.id)
        .order("unlocked_at", { ascending: true });

      if (from) {
        query = query.gte("unlocked_at", from.toISOString());
      }
      if (to) {
        query = query.lte("unlocked_at", to.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;

      // Group by date
      const grouped = new Map<string, { basic: number; contact: number; total: number }>();
      
      data?.forEach((unlock: any) => {
        const date = format(new Date(unlock.unlocked_at), "yyyy-MM-dd");
        const current = grouped.get(date) || { basic: 0, contact: 0, total: 0 };
        
        if (unlock.level === "basic") {
          current.basic++;
        } else if (unlock.level === "contact") {
          current.contact++;
        }
        current.total++;
        
        grouped.set(date, current);
      });

      // Fill in missing dates
      const result: DailyUnlocks[] = [];
      const start = from || new Date(data?.[0]?.unlocked_at || Date.now());
      const end = to || new Date();
      
      // Use a Set to track unique dates
      const seenDates = new Set<string>();
      
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = format(d, "yyyy-MM-dd");
        
        // Skip if we've already added this date
        if (seenDates.has(dateStr)) continue;
        seenDates.add(dateStr);
        
        const stats = grouped.get(dateStr) || { basic: 0, contact: 0, total: 0 };
        result.push({
          date: format(d, "dd.MM", { locale: de }),
          basic: stats.basic,
          contact: stats.contact,
          total: stats.total,
          id: dateStr, // Use date string as unique ID
        });
      }

      return result;
    },
    enabled: !!company?.id,
    refetchOnWindowFocus: true,
    refetchInterval: 30000,
    staleTime: 10000,
  });

  // Fetch pipeline statistics
  const { data: pipelineStats, isLoading: pipelineLoading } = useQuery({
    queryKey: ["company-pipeline-stats", company?.id, timeRange],
    queryFn: async () => {
      if (!company?.id) return null;

      // Use company_candidates table which has stage field
      let query = supabase
        .from("company_candidates")
        .select("stage, updated_at")
        .eq("company_id", company.id);

      if (from) {
        query = query.gte("updated_at", from.toISOString());
      }
      if (to) {
        query = query.lte("updated_at", to.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;

      const hired = data?.filter((item: any) => 
        item.stage === "EINGESTELLT" || item.stage?.toLowerCase().includes("hired")
      ).length || 0;

      // Previous period hired count
      let previousHired = 0;
      if (previousFrom && previousTo) {
        const previousQuery = supabase
          .from("company_candidates")
          .select("stage")
          .eq("company_id", company.id)
          .gte("updated_at", previousFrom.toISOString())
          .lte("updated_at", previousTo.toISOString());

        const { data: previousData } = await previousQuery;
        previousHired = previousData?.filter((item: any) => 
          item.stage === "EINGESTELLT" || item.stage?.toLowerCase().includes("hired")
        ).length || 0;
      }

      const trend = previousHired > 0 
        ? ((hired - previousHired) / previousHired) * 100 
        : (hired > 0 ? 100 : 0);

      const stats: PipelineStats = {
        new: data?.filter((item: any) => 
          item.stage === "NEW" || item.stage === "BEWERBUNG_EINGEGANGEN"
        ).length || 0,
        interview: data?.filter((item: any) => 
          item.stage?.includes("INTERVIEW")
        ).length || 0,
        offer: data?.filter((item: any) => 
          item.stage === "OFFER" || item.stage === "ANGEBOT_GESENDET"
        ).length || 0,
        hired,
        rejected: data?.filter((item: any) => 
          item.stage === "ABGELEHNT" || item.stage?.toLowerCase().includes("rejected")
        ).length || 0,
        previousHired,
        trend,
      };

      return stats;
    },
    enabled: !!company?.id,
    refetchOnWindowFocus: true,
    refetchInterval: 30000,
    staleTime: 10000,
  });

  // Fetch token statistics
  const { data: tokenStats, isLoading: tokensLoading } = useQuery({
    queryKey: ["company-token-stats", company?.id, timeRange],
    queryFn: async () => {
      if (!company?.id) return null;

      // Get wallet balance
      const { data: wallet } = await supabase
        .from("company_token_wallets")
        .select("balance")
        .eq("company_id", company.id)
        .single();

      // Get token transactions
      let query = supabase
        .from("token_transactions")
        .select("delta, reason, created_at")
        .eq("company_id", company.id);

      if (from) {
        query = query.gte("created_at", from.toISOString());
      }
      if (to) {
        query = query.lte("created_at", to.toISOString());
      }

      const { data: transactions, error } = await query;
      if (error) throw error;

      // Previous period
      let previousQuery = supabase
        .from("token_transactions")
        .select("delta")
        .eq("company_id", company.id);

      if (previousFrom) {
        previousQuery = previousQuery.gte("created_at", previousFrom.toISOString());
      }
      if (previousTo) {
        previousQuery = previousQuery.lte("created_at", previousTo.toISOString());
      }

      const { data: previousTransactions } = await previousQuery;

      const spent = transactions
        ?.filter((t: any) => t.delta < 0)
        .reduce((sum: number, t: any) => sum + Math.abs(t.delta), 0) || 0;

      const previousSpent = previousTransactions
        ?.filter((t: any) => t.delta < 0)
        .reduce((sum: number, t: any) => sum + Math.abs(t.delta), 0) || 0;

      const purchased = transactions
        ?.filter((t: any) => t.delta > 0)
        .reduce((sum: number, t: any) => sum + t.delta, 0) || 0;

      const totalUnlocks = unlockStats?.total || 1;
      const avgPerUnlock = totalUnlocks > 0 ? spent / totalUnlocks : 0;

      const trend = previousSpent > 0 
        ? ((spent - previousSpent) / previousSpent) * 100 
        : (spent > 0 ? 100 : 0);

      const stats: TokenStats = {
        totalSpent: spent,
        totalPurchased: purchased,
        currentBalance: wallet?.balance || company?.active_tokens || 0,
        avgPerUnlock: Math.round(avgPerUnlock * 100) / 100,
        previousSpent,
        trend,
      };

      return stats;
    },
    enabled: !!company?.id,
    refetchOnWindowFocus: true,
    refetchInterval: 30000,
    staleTime: 10000,
  });

  // Calculate conversion rate
  const conversionRate = pipelineStats && unlockStats?.total
    ? Math.round((pipelineStats.hired / unlockStats.total) * 100 * 100) / 100
    : 0;

  // Prepare chart data with unique keys
  const pipelineChartData = pipelineStats ? [
    { name: "Neu", value: pipelineStats.new, color: COLORS[0], id: "new" },
    { name: "Interview", value: pipelineStats.interview, color: COLORS[1], id: "interview" },
    { name: "Angebot", value: pipelineStats.offer, color: COLORS[2], id: "offer" },
    { name: "Eingestellt", value: pipelineStats.hired, color: COLORS[3], id: "hired" },
    { name: "Abgelehnt", value: pipelineStats.rejected, color: COLORS[4], id: "rejected" },
  ].filter(item => item.value > 0) : [];

  const unlockTypeData = unlockStats ? [
    { name: "Basic", value: unlockStats.basic, color: COLORS[0], id: "basic" },
    { name: "Contact", value: unlockStats.contact, color: COLORS[1], id: "contact" },
  ].filter(item => item.value > 0) : [];

  // Donut chart data for Users card
  const userDistributionData = unlockStats ? [
    { name: "Basic", value: unlockStats.basic, color: "#3b82f6", id: "basic" },
    { name: "Contact", value: unlockStats.contact, color: "#10b981", id: "contact" },
  ].filter(item => item.value > 0) : [];

  const totalUsers = unlockStats?.total || 0;
  const basicPercent = totalUsers > 0 ? Math.round((unlockStats?.basic || 0) / totalUsers * 100) : 0;
  const contactPercent = totalUsers > 0 ? Math.round((unlockStats?.contact || 0) / totalUsers * 100) : 0;

  if (!company) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Lade Analytics...</div>
      </div>
    );
  }

  return (
    <div className="p-3 md:p-6 min-h-screen bg-background max-w-full overflow-x-hidden pb-24 pt-safe space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>
              {from ? format(from, "dd.MM.yyyy", { locale: de }) : "Gesamt"} - {to ? format(to, "dd.MM.yyyy", { locale: de }) : "Heute"}
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ["company-unlock-stats"] });
              queryClient.invalidateQueries({ queryKey: ["company-daily-unlocks"] });
              queryClient.invalidateQueries({ queryKey: ["company-pipeline-stats"] });
              queryClient.invalidateQueries({ queryKey: ["company-token-stats"] });
            }}
            className="flex items-center gap-2"
          >
            <TrendingUp className="h-4 w-4" />
            Aktualisieren
          </Button>
          <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Letzte 7 Tage</SelectItem>
              <SelectItem value="30d">Letzte 30 Tage</SelectItem>
              <SelectItem value="90d">Letzte 90 Tage</SelectItem>
              <SelectItem value="all">Gesamt</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPI Cards - Top Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Orders Card */}
        <Card className="flex h-full flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground">Freigeschaltete Profile</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">
                {unlocksLoading ? "..." : unlockStats?.total || 0}
              </p>
              {unlockStats?.trend !== undefined && (
                <TrendIndicator value={unlockStats.trend} label="since last month" />
              )}
            </div>
            <div className="rounded-xl bg-primary/10 p-3 text-primary">
              <Unlock className="h-5 w-5" />
            </div>
          </div>
          {!unlocksLoading && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{unlockStats?.basic || 0} Basic</span>
                <span>•</span>
                <span>{unlockStats?.contact || 0} Contact</span>
              </div>
            </div>
          )}
        </Card>

        {/* Approved Card */}
        <Card className="flex h-full flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground">Einstellungen</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">
                {pipelineLoading ? "..." : pipelineStats?.hired || 0}
              </p>
              {pipelineStats?.trend !== undefined && (
                <TrendIndicator value={pipelineStats.trend} label="since last month" />
              )}
            </div>
            <div className="rounded-xl bg-primary/10 p-3 text-primary">
              <Target className="h-5 w-5" />
            </div>
          </div>
        </Card>

        {/* Users Card with Donut Chart */}
        <Card className="flex h-full flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground">Freigeschaltete Profile</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">
                {unlocksLoading ? "..." : unlockStats?.total || 0}
              </p>
              {unlockStats?.trend !== undefined && (
                <TrendIndicator value={unlockStats.trend} label="since last month" />
              )}
            </div>
            <div className="rounded-xl bg-primary/10 p-3 text-primary">
              <Users className="h-5 w-5" />
            </div>
          </div>
          {userDistributionData.length > 0 && !unlocksLoading && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0">
                  <ResponsiveContainer width={80} height={80}>
                    <RechartsPieChart>
                      <Pie
                        data={userDistributionData}
                        cx="50%"
                        cy="50%"
                        innerRadius={22}
                        outerRadius={38}
                        dataKey="value"
                        startAngle={90}
                        endAngle={-270}
                      >
                        {userDistributionData.map((entry) => (
                          <Cell key={`cell-${entry.id}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <div className="h-2 w-2 rounded-full bg-blue-500" />
                      <span className="text-muted-foreground">Basic</span>
                    </div>
                    <span className="font-semibold text-slate-900">{basicPercent}%</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <div className="h-2 w-2 rounded-full bg-green-500" />
                      <span className="text-muted-foreground">Contact</span>
                    </div>
                    <span className="font-semibold text-slate-900">{contactPercent}%</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Subscriptions Card with Donut Chart */}
        <Card className="flex h-full flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground">Token-Verbrauch</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">
                {tokensLoading ? "..." : tokenStats?.totalSpent || 0}
              </p>
              {tokenStats?.trend !== undefined && (
                <TrendIndicator value={tokenStats.trend} label="since last month" />
              )}
            </div>
            <div className="rounded-xl bg-primary/10 p-3 text-primary">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          {!tokensLoading && tokenStats && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0">
                  <ResponsiveContainer width={80} height={80}>
                    <RechartsPieChart>
                      <Pie
                        data={[
                          { name: "Verbraucht", value: tokenStats.totalSpent, color: "#ef4444" },
                          { name: "Verfügbar", value: tokenStats.currentBalance, color: "#10b981" },
                        ].filter(item => item.value > 0)}
                        cx="50%"
                        cy="50%"
                        innerRadius={22}
                        outerRadius={38}
                        dataKey="value"
                        startAngle={90}
                        endAngle={-270}
                      >
                        {[
                          { name: "Verbraucht", value: tokenStats.totalSpent, color: "#ef4444" },
                          { name: "Verfügbar", value: tokenStats.currentBalance, color: "#10b981" },
                        ].filter(item => item.value > 0).map((entry) => (
                          <Cell key={`cell-token-${entry.name}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <div className="h-2 w-2 rounded-full bg-red-500" />
                      <span className="text-muted-foreground">Verbraucht</span>
                    </div>
                    <span className="font-semibold text-slate-900">
                      {tokenStats.totalSpent > 0 
                        ? Math.round((tokenStats.totalSpent / (tokenStats.totalSpent + tokenStats.currentBalance)) * 100)
                        : 0}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <div className="h-2 w-2 rounded-full bg-green-500" />
                      <span className="text-muted-foreground">Verfügbar</span>
                    </div>
                    <span className="font-semibold text-slate-900">
                      {tokenStats.currentBalance > 0 
                        ? Math.round((tokenStats.currentBalance / (tokenStats.totalSpent + tokenStats.currentBalance)) * 100)
                        : 0}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Second Row - Financial Summaries with Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Month Total Card */}
        <Card className="flex h-full flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground">Conversion Rate</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">{conversionRate}%</p>
            </div>
            <div className="rounded-xl bg-primary/10 p-3 text-primary">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100">
            <p className="text-xs text-muted-foreground">
              {pipelineStats?.hired || 0} Einstellungen von {unlockStats?.total || 0} Unlocks
            </p>
          </div>
        </Card>

        {/* Revenue Card */}
        <Card className="flex h-full flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground">Aktueller Token-Bestand</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">
                {tokensLoading ? "..." : tokenStats?.currentBalance || 0}
              </p>
            </div>
            <div className="rounded-xl bg-primary/10 p-3 text-primary">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
        </Card>
      </div>

      {/* Third Row - Charts & Financial Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Sales Dynamics Bar Chart */}
        <Card className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-lg font-semibold">Unlocks im Zeitverlauf</CardTitle>
            <CardDescription className="text-sm">Tägliche Freischaltungen</CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            {dailyUnlocksLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : dailyUnlocks && dailyUnlocks.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={dailyUnlocks}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#6b7280" 
                    tick={{ fontSize: 12 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis stroke="#6b7280" tick={{ fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }} 
                  />
                  <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Gesamt" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                Keine Daten verfügbar
              </div>
            )}
          </CardContent>
        </Card>

        {/* Paid Invoices Card */}
        <Card className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Token-Verbrauch</CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-semibold text-slate-900">
                  {tokensLoading ? "..." : tokenStats?.totalSpent || 0}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Gesamt ausgegeben</p>
              </div>
              <div className="flex items-center gap-1 rounded-full bg-purple-50 px-2 py-1">
                <div className="h-2 w-2 rounded-full bg-purple-500" />
                <span className="text-xs font-medium text-purple-700">
                  +{tokenStats?.trend ? Math.abs(tokenStats.trend).toFixed(0) : 0}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fourth Row - User Activity & More */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Overall User Activity Line Chart */}
        <Card className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-lg font-semibold">Unlock-Aktivität</CardTitle>
            <CardDescription className="text-sm">Zeitverlauf der Freischaltungen</CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            {dailyUnlocksLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : dailyUnlocks && dailyUnlocks.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={dailyUnlocks}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#6b7280" 
                    tick={{ fontSize: 12 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis stroke="#6b7280" tick={{ fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="total" 
                    stroke="#8b5cf6" 
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                Keine Daten verfügbar
              </div>
            )}
          </CardContent>
        </Card>

        {/* Funds Received Card */}
        <Card className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Token gekauft</CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-semibold text-slate-900">
                  {tokensLoading ? "..." : tokenStats?.totalPurchased || 0}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Gesamt gekauft</p>
              </div>
              <div className="flex items-center gap-1 rounded-full bg-green-50 px-2 py-1">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <span className="text-xs font-medium text-green-700">
                  +{tokenStats?.totalPurchased > 0 ? 100 : 0}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Übersicht</TabsTrigger>
          <TabsTrigger value="unlocks">Unlocks</TabsTrigger>
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
          <TabsTrigger value="tokens">Tokens</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Charts are now integrated in the main layout above */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Unlock Types Pie Chart */}
            <Card className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <CardHeader className="px-0 pt-0">
                <CardTitle className="text-lg font-semibold">Unlock-Typen</CardTitle>
                <CardDescription className="text-sm">Verteilung Basic vs. Contact</CardDescription>
              </CardHeader>
              <CardContent className="px-0">
                {unlocksLoading ? (
                  <Skeleton className="h-64 w-full" />
                ) : unlockTypeData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsPieChart>
                      <Pie
                        data={unlockTypeData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {unlockTypeData.map((entry) => (
                          <Cell key={`cell-${entry.id}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'white', 
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px'
                        }} 
                      />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-64 text-muted-foreground">
                    Keine Daten verfügbar
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pipeline Distribution */}
            <Card className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <CardHeader className="px-0 pt-0">
                <CardTitle className="text-lg font-semibold">Pipeline-Verteilung</CardTitle>
                <CardDescription className="text-sm">Status der Kandidaten</CardDescription>
              </CardHeader>
              <CardContent className="px-0">
                {pipelineLoading ? (
                  <Skeleton className="h-64 w-full" />
                ) : pipelineChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={pipelineChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="name" stroke="#6b7280" tick={{ fontSize: 12 }} />
                      <YAxis stroke="#6b7280" tick={{ fontSize: 12 }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'white', 
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          fontSize: '12px'
                        }} 
                      />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]} name="Anzahl">
                      {pipelineChartData.map((entry) => (
                        <Cell key={`cell-${entry.id}`} fill={entry.color} />
                      ))}
                    </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-64 text-muted-foreground">
                    Keine Pipeline-Daten verfügbar
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="unlocks" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <CardHeader>
                <CardTitle>Unlock-Quellen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                  <span className="text-sm font-medium">Job-Postings</span>
                  <Badge variant="outline" className="text-lg font-semibold">{unlockStats?.byJob || 0}</Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                  <span className="text-sm font-medium">Allgemeines Interesse</span>
                  <Badge variant="outline" className="text-lg font-semibold">{unlockStats?.generalInterest || 0}</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <CardHeader>
                <CardTitle>Unlock-Level</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50">
                  <span className="text-sm font-medium">Basic Unlocks</span>
                  <Badge className="bg-blue-500 text-lg font-semibold">{unlockStats?.basic || 0}</Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-green-50">
                  <span className="text-sm font-medium">Contact Unlocks</span>
                  <Badge className="bg-green-500 text-lg font-semibold">{unlockStats?.contact || 0}</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="pipeline" className="space-y-4">
          <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <CardHeader>
              <CardTitle>Pipeline-Verteilung</CardTitle>
              <CardDescription>Status der Kandidaten in der Pipeline</CardDescription>
            </CardHeader>
            <CardContent>
              {pipelineLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : pipelineChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={pipelineChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px'
                      }} 
                    />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]} name="Anzahl">
                      {pipelineChartData.map((entry) => (
                        <Cell key={`cell-${entry.id}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                  Keine Pipeline-Daten verfügbar
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tokens" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm">Verbraucht</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{tokenStats?.totalSpent || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Token ausgegeben</p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm">Gekauft</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{tokenStats?.totalPurchased || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Token gekauft</p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm">Aktueller Bestand</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{tokenStats?.currentBalance || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Verfügbare Token</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

