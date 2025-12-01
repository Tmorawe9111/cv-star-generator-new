import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Building2, CreditCard, Coins, TrendingUp, Users, FileText, Calendar, CheckCircle2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface CompanyStats {
  companyId: string;
  name: string;
  email: string;
  planId: string;
  planInterval: 'month' | 'year' | null;
  subscriptionStatus: string;
  tokenBalance: number;
  tokensPurchased: number;
  tokensUsed: number;
  freeTokensUsed: number;
  seatsUsed: number;
  seatsMax: number;
  locationsCount: number;
  jobsPosted: number;
  postsCreated: number;
  onboardingCompleted: boolean;
  createdAt: string;
}

interface PlanDistribution {
  planId: string;
  monthly: number;
  yearly: number;
  total: number;
}

export default function CompanyAnalytics() {
  const [companyStats, setCompanyStats] = useState<Record<string, CompanyStats>>({});
  const [planDistribution, setPlanDistribution] = useState<PlanDistribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const loadCompanyStats = async () => {
      try {
        // Load all companies
        const { data: companies, error: companiesError } = await supabase
          .from('companies')
          .select('id, name, primary_email, current_plan_id, plan_interval, token_balance, onboarding_completed, created_at')
          .order('created_at', { ascending: false });

        if (companiesError) throw companiesError;

        // Load subscriptions
        const { data: subscriptions, error: subsError } = await supabase
          .from('subscriptions')
          .select('company_id, plan_key, interval, status');

        if (subsError && subsError.code !== 'PGRST116') throw subsError; // Ignore if table doesn't exist

        // Load token transactions
        const { data: tokenTransactions, error: tokensError } = await supabase
          .from('token_transactions')
          .select('company_id, delta, reason, created_at');

        if (tokensError && tokensError.code !== 'PGRST116') {
          console.warn('Token transactions table not found:', tokensError);
        }

        // Load company users (seats)
        const { data: companyUsers, error: usersError } = await supabase
          .from('company_users')
          .select('company_id, accepted_at');

        if (usersError) throw usersError;

        // Load locations
        const { data: locations, error: locationsError } = await supabase
          .from('company_locations')
          .select('company_id');

        if (locationsError && locationsError.code !== 'PGRST116') {
          console.warn('Company locations table not found:', locationsError);
        }

        // Load job posts
        const { data: jobs, error: jobsError } = await supabase
          .from('job_postings')
          .select('company_id, status')
          .or('status.eq.published,status.eq.draft');

        if (jobsError && jobsError.code !== 'PGRST116') {
          console.warn('Job postings table not found:', jobsError);
        }

        // Load posts
        const { data: posts, error: postsError } = await supabase
          .from('posts')
          .select('company_id, author_type')
          .eq('author_type', 'company');

        if (postsError) throw postsError;

        // Process data
        const stats: Record<string, CompanyStats> = {};
        const planDist: Record<string, { monthly: number; yearly: number }> = {};

        companies?.forEach((company: any) => {
          const companyId = company.id;
          const subscription = subscriptions?.find((s: any) => s.company_id === companyId);
          const planId = subscription?.plan_key || company.current_plan_id || 'free';
          const planInterval = subscription?.interval || company.plan_interval || null;

          // Count seats
          const seats = companyUsers?.filter((cu: any) => cu.company_id === companyId && cu.accepted_at).length || 0;
          
          // Count locations
          const locations = locations?.filter((l: any) => l.company_id === companyId).length || 0;
          
          // Count jobs
          const jobsCount = jobs?.filter((j: any) => j.company_id === companyId).length || 0;
          
          // Count posts
          const postsCount = posts?.filter((p: any) => p.company_id === companyId).length || 0;

          // Calculate tokens
          const tokenPurchases = tokenTransactions?.filter((t: any) => 
            t.company_id === companyId && t.delta > 0
          ).reduce((sum: number, t: any) => sum + t.delta, 0) || 0;

          const tokensUsed = tokenTransactions?.filter((t: any) => 
            t.company_id === companyId && t.delta < 0
          ).reduce((sum: number, t: any) => Math.abs(sum + t.delta), 0) || 0;

          // Free tokens used (if plan is free and tokens were used)
          const freeTokensUsed = planId === 'free' ? tokensUsed : 0;

          stats[companyId] = {
            companyId,
            name: company.name || '',
            email: company.primary_email || '',
            planId,
            planInterval,
            subscriptionStatus: subscription?.status || 'inactive',
            tokenBalance: company.token_balance || 0,
            tokensPurchased: tokenPurchases,
            tokensUsed,
            freeTokensUsed,
            seatsUsed: seats,
            seatsMax: 100, // Default, should come from plan
            locationsCount: locations,
            jobsPosted: jobsCount,
            postsCreated: postsCount,
            onboardingCompleted: company.onboarding_completed || false,
            createdAt: company.created_at || '',
          };

          // Track plan distribution
          if (!planDist[planId]) {
            planDist[planId] = { monthly: 0, yearly: 0 };
          }
          if (planInterval === 'month') {
            planDist[planId].monthly++;
          } else if (planInterval === 'year') {
            planDist[planId].yearly++;
          } else {
            planDist[planId].monthly++; // Default to monthly for free
          }
        });

        // Convert plan distribution to array
        const planDistArray: PlanDistribution[] = Object.entries(planDist).map(([planId, dist]) => ({
          planId,
          monthly: dist.monthly,
          yearly: dist.yearly,
          total: dist.monthly + dist.yearly,
        }));

        setPlanDistribution(planDistArray);
        setCompanyStats(stats);
        setLoading(false);
      } catch (error) {
        console.error('Error loading company stats:', error);
        setLoading(false);
      }
    };

    loadCompanyStats();
  }, []);

  const statsArray = Object.values(companyStats).filter(stat => 
    !search || stat.name.toLowerCase().includes(search.toLowerCase()) || stat.email.toLowerCase().includes(search.toLowerCase())
  );

  const totalCompanies = statsArray.length;
  const freeCompanies = statsArray.filter(s => s.planId === 'free').length;
  const paidCompanies = statsArray.filter(s => s.planId !== 'free').length;
  const totalTokensPurchased = statsArray.reduce((sum, s) => sum + s.tokensPurchased, 0);
  const totalFreeTokensUsed = statsArray.filter(s => s.planId === 'free').reduce((sum, s) => sum + s.freeTokensUsed, 0);
  const totalTokensUsed = statsArray.reduce((sum, s) => sum + s.tokensUsed, 0);
  const totalSeatsUsed = statsArray.reduce((sum, s) => sum + s.seatsUsed, 0);
  const totalJobsPosted = statsArray.reduce((sum, s) => sum + s.jobsPosted, 0);
  const totalPostsCreated = statsArray.reduce((sum, s) => sum + s.postsCreated, 0);
  const completedOnboarding = statsArray.filter(s => s.onboardingCompleted).length;

  const getPlanBadge = (planId: string) => {
    const colors: Record<string, string> = {
      free: 'bg-gray-500',
      basic: 'bg-blue-500',
      growth: 'bg-green-500',
      bevisiblle: 'bg-purple-500',
      enterprise: 'bg-orange-500',
    };
    return <Badge className={`${colors[planId] || 'bg-gray-500'} hover:opacity-90`}>{planId.toUpperCase()}</Badge>;
  };

  return (
    <div className="px-3 sm:px-6 py-6 max-w-[1600px] mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="space-y-1">
        <h1 className="text-4xl font-semibold tracking-tight">Unternehmen Analytics</h1>
        <p className="text-muted-foreground text-base">Detaillierte Statistiken zu Unternehmen, Plänen, Tokens und Aktivitäten</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-0 shadow-sm hover:shadow-md transition-all duration-300 bg-gradient-to-br from-white to-gray-50/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between mb-2">
              <CardDescription className="text-sm font-medium text-gray-600">Gesamt Unternehmen</CardDescription>
              <Building2 className="h-5 w-5 text-gray-400" />
            </div>
            <CardTitle className="text-4xl font-semibold tracking-tight">{totalCompanies.toLocaleString()}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {freeCompanies} Free • {paidCompanies} Paid
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm hover:shadow-md transition-all duration-300 bg-gradient-to-br from-blue-50/50 to-white">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between mb-2">
              <CardDescription className="text-sm font-medium text-gray-600">Tokens Gekauft</CardDescription>
              <Coins className="h-5 w-5 text-blue-500" />
            </div>
            <CardTitle className="text-4xl font-semibold tracking-tight text-blue-600">
              {totalTokensPurchased.toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Gesamt gekaufte Tokens</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm hover:shadow-md transition-all duration-300 bg-gradient-to-br from-orange-50/50 to-white">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between mb-2">
              <CardDescription className="text-sm font-medium text-gray-600">Free Tokens Verbraucht</CardDescription>
              <TrendingUp className="h-5 w-5 text-orange-500" />
            </div>
            <CardTitle className="text-4xl font-semibold tracking-tight text-orange-600">
              {totalFreeTokensUsed.toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Von Free Accounts</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm hover:shadow-md transition-all duration-300 bg-gradient-to-br from-green-50/50 to-white">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between mb-2">
              <CardDescription className="text-sm font-medium text-gray-600">Vervollständigt</CardDescription>
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            </div>
            <CardTitle className="text-4xl font-semibold tracking-tight text-green-600">
              {completedOnboarding.toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Onboarding abgeschlossen</p>
          </CardContent>
        </Card>
      </div>

      {/* Plan Distribution */}
      {planDistribution.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl font-semibold tracking-tight">Plan Verteilung</CardTitle>
            <CardDescription className="text-base">Anzahl Unternehmen pro Plan (Monatlich/Jährlich)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {planDistribution.map((plan) => (
                <div key={plan.planId} className="p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-sm">{plan.planId.toUpperCase()}</span>
                    {getPlanBadge(plan.planId)}
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Monatlich:</span>
                      <span className="font-semibold">{plan.monthly}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Jährlich:</span>
                      <span className="font-semibold">{plan.yearly}</span>
                    </div>
                    <div className="flex justify-between text-xs pt-1 border-t">
                      <span className="text-muted-foreground">Gesamt:</span>
                      <span className="font-bold text-lg">{plan.total}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Company Details Table */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-2xl font-semibold tracking-tight">Unternehmen Details</CardTitle>
          <CardDescription className="text-base">Detaillierte Übersicht aller Unternehmen</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <input 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              placeholder="Suche nach Name oder Email..." 
              className="h-11 w-full rounded-lg border border-gray-200 bg-white px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" 
            />
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="w-full overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Unternehmen</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Tokens</TableHead>
                    <TableHead>Seats</TableHead>
                    <TableHead>Standorte</TableHead>
                    <TableHead>Jobs</TableHead>
                    <TableHead>Beiträge</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {statsArray.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                        Keine Unternehmen gefunden.
                      </TableCell>
                    </TableRow>
                  ) : (
                    statsArray.map((stats) => (
                      <TableRow key={stats.companyId} className="hover:bg-gray-50/50 transition-colors">
                        <TableCell>
                          <div>
                            <div className="font-medium text-sm">{stats.name}</div>
                            <div className="text-xs text-muted-foreground">{stats.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            {getPlanBadge(stats.planId)}
                            {stats.planInterval && (
                              <span className="text-xs text-muted-foreground">
                                {stats.planInterval === 'month' ? 'Monatlich' : 'Jährlich'}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Coins className="h-4 w-4 text-blue-500" />
                              <span className="font-semibold text-sm">{stats.tokenBalance}</span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Gekauft: {stats.tokensPurchased} • Verbraucht: {stats.tokensUsed}
                            </div>
                            {stats.freeTokensUsed > 0 && (
                              <div className="text-xs text-orange-600">
                                Free: {stats.freeTokensUsed}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-green-500" />
                            <span className="font-semibold">{stats.seatsUsed}</span>
                            <span className="text-xs text-muted-foreground">/ {stats.seatsMax}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-purple-500" />
                            <span className="font-semibold">{stats.locationsCount}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-indigo-500" />
                            <span className="font-semibold">{stats.jobsPosted}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-pink-500" />
                            <span className="font-semibold">{stats.postsCreated}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {stats.onboardingCompleted ? (
                            <Badge className="bg-green-500 hover:bg-green-600">Aktiv</Badge>
                          ) : (
                            <Badge variant="secondary">Setup</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Additional Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold">Token Statistiken</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Gesamt Gekauft:</span>
              <span className="font-semibold">{totalTokensPurchased.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Gesamt Verbraucht:</span>
              <span className="font-semibold">{totalTokensUsed.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Free Tokens Verbraucht:</span>
              <span className="font-semibold text-orange-600">{totalFreeTokensUsed.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold">Aktivität</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Gesamt Jobs:</span>
              <span className="font-semibold">{totalJobsPosted.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Gesamt Beiträge:</span>
              <span className="font-semibold">{totalPostsCreated.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Gesamt Seats:</span>
              <span className="font-semibold">{totalSeatsUsed.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold">Plan Übersicht</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Free Accounts:</span>
              <span className="font-semibold">{freeCompanies.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Paid Accounts:</span>
              <span className="font-semibold">{paidCompanies.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Onboarding:</span>
              <span className="font-semibold text-green-600">{completedOnboarding.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

