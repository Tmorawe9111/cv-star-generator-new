import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useCompaniesViews } from '@/hooks/useCompaniesViews';
import { CompanyCard, formatCompanySubtitle } from '@/components/shared/CompanyCard';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import FollowButton from '@/components/Company/FollowButton';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Building2, Search } from 'lucide-react';
import type { CompanyLite, SuggestedCompany } from '@/types/company';

export default function CommunityCompanies() {
  const { profile } = useAuth();
  const { loading, pending, following, suggested, error, refetch } = useCompaniesViews(profile?.id ?? null);
  const profileId = profile?.id;
  const [activeTab, setActiveTab] = useState<'following' | 'requests' | 'discover'>('following');

  if (!profileId) {
    return (
      <main className="mx-auto max-w-[1200px] p-4 md:p-6">
        <div className="rounded-lg border bg-card p-8 text-center">
          <Building2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h1 className="text-xl font-semibold mb-2">Unternehmen entdecken</h1>
          <p className="text-muted-foreground mb-4">
            Melde dich an, um Unternehmen zu folgen und interessante Arbeitgeber zu entdecken.
          </p>
          <Button onClick={() => window.location.href = '/auth'}>
            Jetzt anmelden
          </Button>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-[1200px] p-4 md:p-6">
        <h1 className="text-2xl font-semibold mb-6">Unternehmen</h1>
        <div className="rounded-lg border bg-card p-8 text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h3 className="text-lg font-medium mb-2">Fehler beim Laden</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={refetch} variant="outline">
            Erneut versuchen
          </Button>
        </div>
      </div>
    );
  }

  const renderSkeletonCards = () => (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-[240px] rounded-xl bg-muted animate-pulse" />
      ))}
    </div>
  );

  const renderEmptyState = (tab: string) => {
    const emptyStates = {
      following: {
        icon: <Users className="h-12 w-12 text-muted-foreground" />,
        title: "Du folgst noch keinen Unternehmen",
        description: "Entdecke interessante Arbeitgeber und folge ihnen, um Updates zu erhalten.",
        action: (
          <Button onClick={() => setActiveTab('discover')} className="mt-4">
            Unternehmen entdecken
          </Button>
        )
      },
      requests: {
        icon: <Building2 className="h-12 w-12 text-muted-foreground" />,
        title: "Keine Follow-Anfragen",
        description: "Hier erscheinen Unternehmen, die dir folgen möchten.",
        action: null
      },
      discover: {
        icon: <Search className="h-12 w-12 text-muted-foreground" />,
        title: "Keine Vorschläge verfügbar",
        description: "Vervollständige dein Profil, um personalisierte Unternehmensempfehlungen zu erhalten.",
        action: (
          <Button onClick={() => window.location.href = '/profile'} variant="outline" className="mt-4">
            Profil bearbeiten
          </Button>
        )
      }
    };

    const state = emptyStates[tab as keyof typeof emptyStates];
    
    return (
      <div className="rounded-lg border bg-card p-12 text-center">
        <div className="mx-auto mb-4">{state.icon}</div>
        <h3 className="text-lg font-medium mb-2">{state.title}</h3>
        <p className="text-muted-foreground mb-2">{state.description}</p>
        {state.action}
      </div>
    );
  };

  const renderCompanyGrid = (companies: (CompanyLite | SuggestedCompany)[], variant: 'following' | 'requests' | 'discover') => (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {companies.map((company) => (
        <CompanyCard
          key={company.id}
          company={company}
          variant={variant}
          mutuals={('friend_count' in company && typeof company.friend_count === 'number' && company.friend_count > 0) ? 
            Array.from({ length: Math.min(3, company.friend_count) }, (_, i) => ({ 
              id: `mutual-${i}`, 
              avatar_url: null, 
              name: `Freund ${i + 1}` 
            })) : []
          }
          mutual_count={('friend_count' in company && typeof company.friend_count === 'number') ? company.friend_count : 0}
          reasons={('reasons' in company) ? company.reasons : []}
          disabledActions={variant === 'requests'}
          onPrimary={() => {
            if (variant === 'following') {
              // Unfollow action
              console.log('Unfollow', company.id);
            } else if (variant === 'requests') {
              // Accept request action
              console.log('Accept request', company.id);
            } else if (variant === 'discover') {
              // Follow action
              console.log('Follow', company.id);
            }
          }}
          onSecondary={() => {
            if (variant === 'following') {
              window.location.href = `/companies/${company.id}`;
            } else if (variant === 'requests') {
              // Decline request action
              console.log('Decline request', company.id);
            }
          }}
          onClick={() => window.location.href = `/companies/${company.id}`}
        />
      ))}
    </div>
  );

  return (
    <main className="mx-auto max-w-[1400px] p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold mb-2">Unternehmen</h1>
        <p className="text-muted-foreground">
          Entdecke interessante Arbeitgeber und baue dein berufliches Netzwerk auf.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="space-y-6">
        <div className="border-b">
          <TabsList className="grid w-full max-w-md grid-cols-3 bg-transparent h-auto p-0">
            <TabsTrigger 
              value="following" 
              className="flex items-center gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none pb-3"
            >
              <Users className="h-4 w-4" />
              <span>Gefolgt</span>
              {following.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                  {following.length}
                </Badge>
              )}
            </TabsTrigger>
            
            <TabsTrigger 
              value="requests" 
              className="flex items-center gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none pb-3"
            >
              <Building2 className="h-4 w-4" />
              <span>Anfragen</span>
              {pending.length > 0 && (
                <Badge className="ml-1 h-5 px-1.5 text-xs">
                  {pending.length}
                </Badge>
              )}
            </TabsTrigger>
            
            <TabsTrigger 
              value="discover" 
              className="flex items-center gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none pb-3"
            >
              <Search className="h-4 w-4" />
              <span>Entdecken</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="following" className="mt-6">
          {loading ? renderSkeletonCards() : 
           following.length === 0 ? renderEmptyState('following') :
           renderCompanyGrid(following, 'following')}
        </TabsContent>

        <TabsContent value="requests" className="mt-6">
          {loading ? renderSkeletonCards() : 
           pending.length === 0 ? renderEmptyState('requests') :
           renderCompanyGrid(pending, 'requests')}
        </TabsContent>

        <TabsContent value="discover" className="mt-6">
          {loading ? renderSkeletonCards() : 
           suggested.length === 0 ? renderEmptyState('discover') :
           renderCompanyGrid(suggested, 'discover')}
        </TabsContent>
      </Tabs>
    </main>
  );
}
