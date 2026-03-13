import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAdminSession } from '@/hooks/useAdminSession';
import { Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Trophy, Users } from 'lucide-react';

interface ContestEligibleRow {
  referral_code: string;
  referral_name: string | null;
  successful_referrals: number;
}

export default function ContestEligibleUsers() {
  const { role } = useAdminSession();
  const [dateRange, setDateRange] = useState<'all' | '30d' | '90d'>('all');

  const { data: rows, isLoading } = useQuery({
    queryKey: ['contest-eligible', dateRange],
    queryFn: async (): Promise<ContestEligibleRow[]> => {
      let q = supabase
        .from('referral_tracking')
        .select('referral_code, referral_name')
        .not('profile_completed_at', 'is', null);

      if (dateRange !== 'all') {
        const days = dateRange === '30d' ? 30 : 90;
        const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
        q = q.gte('clicked_at', cutoff);
      }

      const { data, error } = await q;
      if (error) throw error;

      const grouped = new Map<string, { name: string | null; count: number }>();
      for (const row of data || []) {
        const code = row.referral_code || 'Unknown';
        const existing = grouped.get(code);
        if (existing) {
          existing.count += 1;
        } else {
          grouped.set(code, { name: row.referral_name ?? null, count: 1 });
        }
      }

      return Array.from(grouped.entries())
        .map(([referral_code, { name, count }]) => ({
          referral_code,
          referral_name: name,
          successful_referrals: count,
        }))
        .filter((r) => r.successful_referrals >= 1)
        .sort((a, b) => b.successful_referrals - a.successful_referrals);
    },
  });

  if (role === 'CompanyAdmin') {
    return <Navigate to="/admin" replace />;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Trophy className="h-8 w-8 text-primary" />
            Contest Eligible Users
          </h1>
          <p className="text-muted-foreground mt-1">
            Nutzer mit mindestens einer erfolgreichen Einladung (Profil abgeschlossen)
          </p>
        </div>
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value as 'all' | '30d' | '90d')}
          className="rounded-md border px-3 py-2 text-sm"
        >
          <option value="all">Alle Zeit</option>
          <option value="30d">Letzte 30 Tage</option>
          <option value="90d">Letzte 90 Tage</option>
        </select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {rows?.length ?? 0} teilnahmeberechtigte Referrer
          </CardTitle>
          <CardDescription>
            Referral-Codes mit mindestens 1 abgeschlossenem Profil
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : !rows?.length ? (
            <p className="text-muted-foreground text-center py-8">Keine teilnahmeberechtigten Nutzer gefunden.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Referral Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="text-right">Erfolgreiche Einladungen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.referral_code}>
                    <TableCell className="font-mono">{row.referral_code}</TableCell>
                    <TableCell>{row.referral_name || '–'}</TableCell>
                    <TableCell className="text-right font-semibold">{row.successful_referrals}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
