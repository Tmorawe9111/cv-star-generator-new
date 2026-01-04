import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { TrendingUp, Users, UserCheck, FileText, MousePointerClick, BarChart3 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ReferralAnalytic {
  referral_source: string | null;
  referral_name: string | null;
  referral_code: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  total_clicks: number;
  unique_sessions: number;
  registrations: number;
  completed_profiles: number;
  cv_creations: number;
  click_to_registration_rate: number;
  registration_to_profile_rate: number;
  click_to_profile_rate: number;
  first_click: string;
  last_click: string;
  click_date: string;
}

export default function ReferralAnalytics() {
  const [analytics, setAnalytics] = useState<ReferralAnalytic[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [groupBy, setGroupBy] = useState<'referral_code' | 'referral_name' | 'utm_campaign'>('referral_code');

  useEffect(() => {
    loadAnalytics();
  }, [dateRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      
      // Calculate date filter
      let dateFilter = '';
      if (dateRange !== 'all') {
        const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
        dateFilter = `click_date >= CURRENT_DATE - INTERVAL '${days} days'`;
      }
      
      let query = supabase
        .from('referral_analytics')
        .select('*')
        .order('total_clicks', { ascending: false });
      
      if (dateFilter) {
        query = query.filter('click_date', 'gte', new Date(Date.now() - (dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90) * 24 * 60 * 60 * 1000).toISOString());
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Group by selected field
      const grouped = groupAnalytics(data || [], groupBy);
      setAnalytics(grouped);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const groupAnalytics = (data: ReferralAnalytic[], groupBy: string): ReferralAnalytic[] => {
    const grouped = new Map<string, ReferralAnalytic>();
    
    data.forEach((item) => {
      const key = item[groupBy as keyof ReferralAnalytic] || 'Unknown';
      
      if (grouped.has(key)) {
        const existing = grouped.get(key)!;
        existing.total_clicks += item.total_clicks;
        existing.unique_sessions += item.unique_sessions;
        existing.registrations += item.registrations;
        existing.completed_profiles += item.completed_profiles;
        existing.cv_creations += item.cv_creations;
        
        // Recalculate rates
        existing.click_to_registration_rate = 
          (existing.registrations / existing.total_clicks) * 100;
        existing.registration_to_profile_rate = 
          existing.registrations > 0 
            ? (existing.completed_profiles / existing.registrations) * 100 
            : 0;
        existing.click_to_profile_rate = 
          (existing.completed_profiles / existing.total_clicks) * 100;
      } else {
        grouped.set(key, { ...item });
      }
    });
    
    return Array.from(grouped.values()).sort((a, b) => b.total_clicks - a.total_clicks);
  };

  const totalClicks = analytics.reduce((sum, a) => sum + a.total_clicks, 0);
  const totalRegistrations = analytics.reduce((sum, a) => sum + a.registrations, 0);
  const totalProfiles = analytics.reduce((sum, a) => sum + a.completed_profiles, 0);
  const totalCVs = analytics.reduce((sum, a) => sum + a.cv_creations, 0);
  const overallConversionRate = totalClicks > 0 ? (totalProfiles / totalClicks) * 100 : 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Referral Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Track influencer links, conversions, and performance
          </p>
        </div>
        
        <div className="flex gap-4">
          <Select value={dateRange} onValueChange={(v: any) => setDateRange(v)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={groupBy} onValueChange={(v: any) => setGroupBy(v)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="referral_code">By Code</SelectItem>
              <SelectItem value="referral_name">By Name</SelectItem>
              <SelectItem value="utm_campaign">By Campaign</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
            <MousePointerClick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClicks.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">All referral links</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Registrations</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRegistrations.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {totalClicks > 0 ? ((totalRegistrations / totalClicks) * 100).toFixed(1) : 0}% conversion
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Profiles</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProfiles.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {overallConversionRate.toFixed(1)}% click-to-profile rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CVs Created</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCVs.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {totalProfiles > 0 ? ((totalCVs / totalProfiles) * 100).toFixed(1) : 0}% of profiles
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics Table */}
      <Card>
        <CardHeader>
          <CardTitle>Performance by {groupBy === 'referral_code' ? 'Referral Code' : groupBy === 'referral_name' ? 'Influencer' : 'Campaign'}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : analytics.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No referral data found for the selected period.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 font-semibold">Source</th>
                    <th className="text-right p-2 font-semibold">Clicks</th>
                    <th className="text-right p-2 font-semibold">Sessions</th>
                    <th className="text-right p-2 font-semibold">Registrations</th>
                    <th className="text-right p-2 font-semibold">Profiles</th>
                    <th className="text-right p-2 font-semibold">CVs</th>
                    <th className="text-right p-2 font-semibold">Click → Reg</th>
                    <th className="text-right p-2 font-semibold">Reg → Profile</th>
                    <th className="text-right p-2 font-semibold">Click → Profile</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.map((item, index) => {
                    const source = item[groupBy] || item.referral_name || item.referral_code || 'Unknown';
                    return (
                      <tr key={index} className="border-b hover:bg-muted/50">
                        <td className="p-2">
                          <div className="font-medium">{source}</div>
                          {item.referral_name && item.referral_name !== source && (
                            <div className="text-xs text-muted-foreground">{item.referral_name}</div>
                          )}
                        </td>
                        <td className="text-right p-2">{item.total_clicks.toLocaleString()}</td>
                        <td className="text-right p-2">{item.unique_sessions.toLocaleString()}</td>
                        <td className="text-right p-2">{item.registrations.toLocaleString()}</td>
                        <td className="text-right p-2">{item.completed_profiles.toLocaleString()}</td>
                        <td className="text-right p-2">{item.cv_creations.toLocaleString()}</td>
                        <td className="text-right p-2">
                          <span className={item.click_to_registration_rate >= 10 ? 'text-green-600 font-semibold' : ''}>
                            {item.click_to_registration_rate.toFixed(1)}%
                          </span>
                        </td>
                        <td className="text-right p-2">
                          <span className={item.registration_to_profile_rate >= 50 ? 'text-green-600 font-semibold' : ''}>
                            {item.registration_to_profile_rate.toFixed(1)}%
                          </span>
                        </td>
                        <td className="text-right p-2">
                          <span className={item.click_to_profile_rate >= 5 ? 'text-green-600 font-semibold' : ''}>
                            {item.click_to_profile_rate.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Link Generator */}
      <Card>
        <CardHeader>
          <CardTitle>Generate Referral Link</CardTitle>
        </CardHeader>
        <CardContent>
          <ReferralLinkGenerator />
        </CardContent>
      </Card>
    </div>
  );
}

function ReferralLinkGenerator() {
  const [referralCode, setReferralCode] = useState('');
  const [referralName, setReferralName] = useState('');
  const [utmSource, setUtmSource] = useState('influencer');
  const [utmCampaign, setUtmCampaign] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');

  const generateLink = () => {
    const baseUrl = window.location.origin;
    const params = new URLSearchParams();
    
    if (referralCode) params.set('ref', referralCode);
    if (referralName) params.set('ref_name', referralName);
    if (utmSource) params.set('utm_source', utmSource);
    if (utmCampaign) params.set('utm_campaign', utmCampaign);
    params.set('utm_medium', 'referral');
    
    const link = `${baseUrl}/cv-generator?${params.toString()}`;
    setGeneratedLink(link);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium mb-1 block">Referral Code</label>
          <input
            type="text"
            value={referralCode}
            onChange={(e) => setReferralCode(e.target.value)}
            placeholder="e.g., NAKAM2024"
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Influencer Name</label>
          <input
            type="text"
            value={referralName}
            onChange={(e) => setReferralName(e.target.value)}
            placeholder="e.g., Nakam"
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">UTM Source</label>
          <input
            type="text"
            value={utmSource}
            onChange={(e) => setUtmSource(e.target.value)}
            placeholder="e.g., influencer"
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">UTM Campaign</label>
          <input
            type="text"
            value={utmCampaign}
            onChange={(e) => setUtmCampaign(e.target.value)}
            placeholder="e.g., january2024"
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>
      </div>
      
      <button
        onClick={generateLink}
        className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
      >
        Generate Link
      </button>
      
      {generatedLink && (
        <div className="mt-4 p-4 bg-muted rounded-md">
          <label className="text-sm font-medium mb-1 block">Generated Link:</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={generatedLink}
              readOnly
              className="flex-1 px-3 py-2 border rounded-md bg-background"
            />
            <button
              onClick={() => navigator.clipboard.writeText(generatedLink)}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Copy
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

