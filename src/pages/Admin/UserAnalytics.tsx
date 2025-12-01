import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useUsers } from '@/hooks/useUsers';
import { UserDrawer } from '@/components/admin/UserDrawer';
import { Badge } from '@/components/ui/badge';
import { Users, Briefcase, Building2, Heart, MessageSquare, ThumbsUp, FileText, Eye, Calendar } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface UserStats {
  userId: string;
  email: string;
  profileComplete: boolean;
  profilePublished: boolean;
  // Applications
  jobApplications: number;
  jobViews: number;
  // Company interactions
  companyFollows: number;
  companyViews: number;
  followRequests: number;
  // Posts
  postsCreated: number;
  postsLiked: number;
  postsCommented: number;
  // Profile
  profileViews: number;
  // Dates
  createdAt: string;
  lastSignIn: string | null;
}

export default function UserAnalytics() {
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [userStats, setUserStats] = useState<Record<string, UserStats>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  
  const { data: usersData, isLoading: usersLoading } = useUsers({ search, page, pageSize: 20 });

  useEffect(() => {
    const loadUserStats = async () => {
      if (!usersData?.users || usersData.users.length === 0) {
        setLoading(false);
        return;
      }

      const userIds = usersData.users.map(u => u.id);
      const stats: Record<string, UserStats> = {};

      // Load all stats in parallel
      const [
        applicationsData,
        followsData,
        postsData,
        likesData,
        commentsData,
        analyticsData,
      ] = await Promise.all([
        // Job Applications
        supabase
          .from('applications')
          .select('candidate_id, job_id, created_at')
          .in('candidates.user_id', userIds),
        
        // Company Follows
        supabase
          .from('follows')
          .select('follower_id, followee_id, status, created_at')
          .eq('follower_type', 'profile')
          .eq('followee_type', 'company')
          .in('follower_id', userIds),
        
        // Posts Created
        supabase
          .from('posts')
          .select('author_id, id, created_at')
          .eq('author_type', 'user')
          .in('author_id', userIds),
        
        // Post Likes
        supabase
          .from('post_likes')
          .select('user_id, post_id')
          .in('user_id', userIds),
        
        // Post Comments
        supabase
          .from('post_comments')
          .select('user_id, post_id')
          .in('user_id', userIds),
        
        // Analytics Events (for views)
        supabase
          .from('analytics_events')
          .select('user_id, metadata, event_type, created_at')
          .in('user_id', userIds)
          .or('event_type.eq.job_view,event_type.eq.company_view,event_type.eq.profile_view'),
      ]);

      // Process applications
      const applications = applicationsData.data || [];
      applications.forEach((app: any) => {
        const userId = app.candidate_id || app.candidates?.user_id;
        if (userId && !stats[userId]) {
          stats[userId] = {
            userId,
            email: usersData.users.find(u => u.id === userId)?.email || '',
            profileComplete: usersData.users.find(u => u.id === userId)?.profile_complete || false,
            profilePublished: usersData.users.find(u => u.id === userId)?.profile_published || false,
            jobApplications: 0,
            jobViews: 0,
            companyFollows: 0,
            companyViews: 0,
            followRequests: 0,
            postsCreated: 0,
            postsLiked: 0,
            postsCommented: 0,
            profileViews: 0,
            createdAt: usersData.users.find(u => u.id === userId)?.created_at || '',
            lastSignIn: usersData.users.find(u => u.id === userId)?.last_sign_in_at || null,
          };
        }
        if (userId) {
          stats[userId].jobApplications++;
        }
      });

      // Process follows
      const follows = followsData.data || [];
      follows.forEach((follow: any) => {
        const userId = follow.follower_id;
        if (!stats[userId]) {
          stats[userId] = {
            userId,
            email: usersData.users.find(u => u.id === userId)?.email || '',
            profileComplete: usersData.users.find(u => u.id === userId)?.profile_complete || false,
            profilePublished: usersData.users.find(u => u.id === userId)?.profile_published || false,
            jobApplications: 0,
            jobViews: 0,
            companyFollows: 0,
            companyViews: 0,
            followRequests: 0,
            postsCreated: 0,
            postsLiked: 0,
            postsCommented: 0,
            profileViews: 0,
            createdAt: usersData.users.find(u => u.id === userId)?.created_at || '',
            lastSignIn: usersData.users.find(u => u.id === userId)?.last_sign_in_at || null,
          };
        }
        if (follow.status === 'pending') {
          stats[userId].followRequests++;
        } else {
          stats[userId].companyFollows++;
        }
      });

      // Process posts
      const posts = postsData.data || [];
      posts.forEach((post: any) => {
        const userId = post.author_id;
        if (!stats[userId]) {
          stats[userId] = {
            userId,
            email: usersData.users.find(u => u.id === userId)?.email || '',
            profileComplete: usersData.users.find(u => u.id === userId)?.profile_complete || false,
            profilePublished: usersData.users.find(u => u.id === userId)?.profile_published || false,
            jobApplications: 0,
            jobViews: 0,
            companyFollows: 0,
            companyViews: 0,
            followRequests: 0,
            postsCreated: 0,
            postsLiked: 0,
            postsCommented: 0,
            profileViews: 0,
            createdAt: usersData.users.find(u => u.id === userId)?.created_at || '',
            lastSignIn: usersData.users.find(u => u.id === userId)?.last_sign_in_at || null,
          };
        }
        stats[userId].postsCreated++;
      });

      // Process likes
      const likes = likesData.data || [];
      likes.forEach((like: any) => {
        const userId = like.user_id;
        if (!stats[userId]) {
          stats[userId] = {
            userId,
            email: usersData.users.find(u => u.id === userId)?.email || '',
            profileComplete: usersData.users.find(u => u.id === userId)?.profile_complete || false,
            profilePublished: usersData.users.find(u => u.id === userId)?.profile_published || false,
            jobApplications: 0,
            jobViews: 0,
            companyFollows: 0,
            companyViews: 0,
            followRequests: 0,
            postsCreated: 0,
            postsLiked: 0,
            postsCommented: 0,
            profileViews: 0,
            createdAt: usersData.users.find(u => u.id === userId)?.created_at || '',
            lastSignIn: usersData.users.find(u => u.id === userId)?.last_sign_in_at || null,
          };
        }
        stats[userId].postsLiked++;
      });

      // Process comments
      const comments = commentsData.data || [];
      comments.forEach((comment: any) => {
        const userId = comment.user_id;
        if (!stats[userId]) {
          stats[userId] = {
            userId,
            email: usersData.users.find(u => u.id === userId)?.email || '',
            profileComplete: usersData.users.find(u => u.id === userId)?.profile_complete || false,
            profilePublished: usersData.users.find(u => u.id === userId)?.profile_published || false,
            jobApplications: 0,
            jobViews: 0,
            companyFollows: 0,
            companyViews: 0,
            followRequests: 0,
            postsCreated: 0,
            postsLiked: 0,
            postsCommented: 0,
            profileViews: 0,
            createdAt: usersData.users.find(u => u.id === userId)?.created_at || '',
            lastSignIn: usersData.users.find(u => u.id === userId)?.last_sign_in_at || null,
          };
        }
        stats[userId].postsCommented++;
      });

      // Process analytics events
      const analytics = analyticsData.data || [];
      analytics.forEach((event: any) => {
        const userId = event.user_id;
        if (!userId) return;
        
        if (!stats[userId]) {
          stats[userId] = {
            userId,
            email: usersData.users.find(u => u.id === userId)?.email || '',
            profileComplete: usersData.users.find(u => u.id === userId)?.profile_complete || false,
            profilePublished: usersData.users.find(u => u.id === userId)?.profile_published || false,
            jobApplications: 0,
            jobViews: 0,
            companyFollows: 0,
            companyViews: 0,
            followRequests: 0,
            postsCreated: 0,
            postsLiked: 0,
            postsCommented: 0,
            profileViews: 0,
            createdAt: usersData.users.find(u => u.id === userId)?.created_at || '',
            lastSignIn: usersData.users.find(u => u.id === userId)?.last_sign_in_at || null,
          };
        }
        
        if (event.event_type === 'user_action') {
          const actionType = event.metadata?.actionType;
          if (actionType === 'job_view') stats[userId].jobViews++;
          if (actionType === 'company_view') stats[userId].companyViews++;
          if (actionType === 'profile_view') stats[userId].profileViews++;
        }
      });

      // Initialize stats for users without any activity
      usersData.users.forEach(user => {
        if (!stats[user.id]) {
          stats[user.id] = {
            userId: user.id,
            email: user.email || '',
            profileComplete: user.profile_complete || false,
            profilePublished: user.profile_published || false,
            jobApplications: 0,
            jobViews: 0,
            companyFollows: 0,
            companyViews: 0,
            followRequests: 0,
            postsCreated: 0,
            postsLiked: 0,
            postsCommented: 0,
            profileViews: 0,
            createdAt: user.created_at || '',
            lastSignIn: user.last_sign_in_at || null,
          };
        }
      });

      setUserStats(stats);
      setLoading(false);
    };

    if (usersData?.users) {
      loadUserStats();
    }
  }, [usersData]);

  const statsArray = Object.values(userStats).sort((a, b) => {
    const totalA = a.jobApplications + a.postsCreated + a.postsLiked + a.postsCommented;
    const totalB = b.jobApplications + b.postsCreated + b.postsLiked + b.postsCommented;
    return totalB - totalA;
  });

  return (
    <div className="px-3 sm:px-6 py-6 max-w-[1600px] mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="space-y-1">
        <h1 className="text-4xl font-semibold tracking-tight">Nutzer Analytics</h1>
        <p className="text-muted-foreground text-base">Detaillierte Statistiken zu User-Aktivitäten und Interaktionen</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-0 shadow-sm hover:shadow-md transition-all duration-300 bg-gradient-to-br from-white to-gray-50/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between mb-2">
              <CardDescription className="text-sm font-medium text-gray-600">Gesamt Aktivität</CardDescription>
              <Users className="h-5 w-5 text-gray-400" />
            </div>
            <CardTitle className="text-4xl font-semibold tracking-tight">
              {statsArray.reduce((sum, s) => sum + s.jobApplications + s.postsCreated + s.postsLiked + s.postsCommented, 0).toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Alle User-Aktionen</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm hover:shadow-md transition-all duration-300 bg-gradient-to-br from-blue-50/50 to-white">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between mb-2">
              <CardDescription className="text-sm font-medium text-gray-600">Bewerbungen</CardDescription>
              <Briefcase className="h-5 w-5 text-blue-500" />
            </div>
            <CardTitle className="text-4xl font-semibold tracking-tight text-blue-600">
              {statsArray.reduce((sum, s) => sum + s.jobApplications, 0).toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Gesamt Bewerbungen</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm hover:shadow-md transition-all duration-300 bg-gradient-to-br from-green-50/50 to-white">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between mb-2">
              <CardDescription className="text-sm font-medium text-gray-600">Beiträge</CardDescription>
              <FileText className="h-5 w-5 text-green-500" />
            </div>
            <CardTitle className="text-4xl font-semibold tracking-tight text-green-600">
              {statsArray.reduce((sum, s) => sum + s.postsCreated, 0).toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Erstellte Beiträge</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm hover:shadow-md transition-all duration-300 bg-gradient-to-br from-purple-50/50 to-white">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between mb-2">
              <CardDescription className="text-sm font-medium text-gray-600">Interaktionen</CardDescription>
              <Heart className="h-5 w-5 text-purple-500" />
            </div>
            <CardTitle className="text-4xl font-semibold tracking-tight text-purple-600">
              {(statsArray.reduce((sum, s) => sum + s.postsLiked, 0) + statsArray.reduce((sum, s) => sum + s.postsCommented, 0)).toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Likes & Kommentare</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-2xl font-semibold tracking-tight">User Aktivitäten</CardTitle>
          <CardDescription className="text-base">Detaillierte Übersicht aller User-Interaktionen</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <input 
              value={search} 
              onChange={(e) => { setSearch(e.target.value); setPage(1); }} 
              placeholder="Suche nach Email..." 
              className="h-11 w-full rounded-lg border border-gray-200 bg-white px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" 
            />
          </div>

          {loading || usersLoading ? (
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
                    <TableHead>Email</TableHead>
                    <TableHead>Bewerbungen</TableHead>
                    <TableHead>Unternehmen</TableHead>
                    <TableHead>Beiträge</TableHead>
                    <TableHead>Likes</TableHead>
                    <TableHead>Kommentare</TableHead>
                    <TableHead>Profile Views</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {statsArray.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="py-8 text-center text-muted-foreground">
                        Keine User gefunden.
                      </TableCell>
                    </TableRow>
                  ) : (
                    statsArray.map((stats) => (
                      <TableRow key={stats.userId} className="hover:bg-gray-50/50 transition-colors cursor-pointer">
                        <TableCell className="font-medium text-sm">{stats.email}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Briefcase className="h-4 w-4 text-blue-500" />
                            <span className="font-semibold">{stats.jobApplications}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-green-500" />
                            <span className="font-semibold">{stats.companyFollows}</span>
                            {stats.followRequests > 0 && (
                              <Badge variant="outline" className="text-xs">
                                {stats.followRequests} pending
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-purple-500" />
                            <span className="font-semibold">{stats.postsCreated}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <ThumbsUp className="h-4 w-4 text-pink-500" />
                            <span className="font-semibold">{stats.postsLiked}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <MessageSquare className="h-4 w-4 text-orange-500" />
                            <span className="font-semibold">{stats.postsCommented}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Eye className="h-4 w-4 text-gray-500" />
                            <span className="font-semibold">{stats.profileViews}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {stats.profilePublished && stats.profileComplete ? (
                            <Badge className="bg-green-500 hover:bg-green-600">Aktiv</Badge>
                          ) : stats.profileComplete ? (
                            <Badge className="bg-yellow-500 hover:bg-yellow-600">Versteckt</Badge>
                          ) : (
                            <Badge variant="secondary">Setup</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <button 
                            className="text-primary hover:text-primary/80 text-sm font-medium transition-colors px-3 py-1.5 rounded-md hover:bg-primary/10" 
                            onClick={() => {
                              const user = usersData?.users.find(u => u.id === stats.userId);
                              if (user) setSelectedUser(user);
                            }}
                          >
                            Details
                          </button>
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

      <UserDrawer user={selectedUser} open={!!selectedUser} onOpenChange={(v) => !v && setSelectedUser(null)} />
    </div>
  );
}

