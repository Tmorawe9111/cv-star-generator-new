import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useIsCompanyOwner } from "@/hooks/useIsCompanyOwner";
import { useFollowCompany } from "@/hooks/useFollowCompany";
import { CompanyProfileHeader } from "@/components/Company/profile/CompanyProfileHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { CompanyHomeTab } from "@/components/Company/profile/tabs/CompanyHomeTab";
import { CompanyAboutTab } from "@/components/Company/profile/tabs/CompanyAboutTab";
import { CompanyJobsTab } from "@/components/Company/profile/tabs/CompanyJobsTab";
import { CompanyPeopleTab } from "@/components/Company/profile/tabs/CompanyPeopleTab";
import { CompanyPostsTab } from "@/components/Company/profile/tabs/CompanyPostsTab";
import { CompanyLocationsTab } from "@/components/Company/profile/tabs/CompanyLocationsTab";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";

type Company = {
  id: string;
  name: string;
  industry?: string | null;
  logo_url?: string | null;
  header_image?: string | null;
  size_range?: string | null;
  employee_count?: number | null;
  description?: string | null;
  website_url?: string | null;
  main_location?: string | null;
  country?: string | null;
  contact_person?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  contact_position?: string | null;
};

export default function PublicCompanyViewNew() {
  const { id, slug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "home");
  const [companyId, setCompanyId] = useState<string | null>(id || null);
  const fromJobId = searchParams.get("fromJob");
  
  const { data: isOwner } = useIsCompanyOwner(companyId || undefined);
  const { isFollowing, toggleFollow } = useFollowCompany(companyId || undefined);

  // If we have a slug, first resolve it to an ID
  const slugQuery = useQuery({
    queryKey: ['company-slug', slug],
    queryFn: async () => {
      if (!slug) return null;
      const { data, error } = await supabase
        .from('companies')
        .select('id')
        .eq('slug', slug)
        .single();
      if (error) throw error;
      return data?.id || null;
    },
    enabled: !!slug && !id,
    onSuccess: (resolvedId) => {
      if (resolvedId) setCompanyId(resolvedId);
    }
  });

  // Update companyId when slug resolves
  useEffect(() => {
    if (slugQuery.data) {
      setCompanyId(slugQuery.data);
    } else if (id) {
      setCompanyId(id);
    }
  }, [slugQuery.data, id]);

  const companyQuery = useQuery<Company | null>({
    queryKey: ['public-company', companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const { data, error } = await supabase
        .rpc('get_company_public', { p_id: companyId });
      if (error) throw error;
      const row = ((data as any[]) || [])[0] || null;
      return row as Company | null;
    },
    enabled: !!companyId,
  });

  const company = companyQuery.data;

  // Update URL when tab changes
  useEffect(() => {
    if (activeTab !== "home") {
      setSearchParams({ tab: activeTab });
    } else {
      setSearchParams({});
    }
  }, [activeTab, setSearchParams]);

  // SEO
  useEffect(() => {
    const title = company ? `${company.name} – Unternehmen` : 'Unternehmen';
    document.title = title;
    const desc = company?.description 
      ? `${company.name}: ${company.description.slice(0, 150)}` 
      : (company ? `${company.name} Unternehmensprofil` : 'Unternehmensprofil');
    let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'description';
      document.head.appendChild(meta);
    }
    meta.content = desc;
  }, [company]);

  if (companyQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Lade Unternehmensprofil...</div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Unternehmen nicht gefunden</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Back to Job Button */}
      {fromJobId && (
        <div className="border-b bg-card">
          <div className="max-w-6xl mx-auto px-6 py-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Zurück
            </Button>
          </div>
        </div>
      )}
      
      {/* Header Section */}
      <CompanyProfileHeader 
        company={company}
        isOwner={!!isOwner}
        isFollowing={isFollowing}
        onFollow={toggleFollow}
      />
      
      {/* Tabs Navigation */}
      <div className="border-b mt-4 sm:mt-8">
        <div className="max-w-6xl mx-auto px-3 sm:px-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="h-auto p-0 bg-transparent border-b-0 w-full flex overflow-x-auto no-scrollbar">
              <TabsTrigger 
                value="home"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent text-xs sm:text-sm px-2 sm:px-4 py-2 whitespace-nowrap"
              >
                Home
              </TabsTrigger>
              <TabsTrigger 
                value="about"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent text-xs sm:text-sm px-2 sm:px-4 py-2 whitespace-nowrap"
              >
                <span className="hidden sm:inline">Über {company.name}</span>
                <span className="sm:hidden">Über uns</span>
              </TabsTrigger>
              <TabsTrigger 
                value="jobs"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent text-xs sm:text-sm px-2 sm:px-4 py-2 whitespace-nowrap"
              >
                Jobs
              </TabsTrigger>
              <TabsTrigger 
                value="people"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent text-xs sm:text-sm px-2 sm:px-4 py-2 whitespace-nowrap"
              >
                <span className="hidden sm:inline">Mitarbeiter</span>
                <span className="sm:hidden">Team</span>
              </TabsTrigger>
              <TabsTrigger 
                value="posts"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent text-xs sm:text-sm px-2 sm:px-4 py-2 whitespace-nowrap"
              >
                <span className="hidden sm:inline">Beiträge</span>
                <span className="sm:hidden">Posts</span>
              </TabsTrigger>
              <TabsTrigger 
                value="locations"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent text-xs sm:text-sm px-2 sm:px-4 py-2 whitespace-nowrap"
              >
                Standorte
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Tab Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsContent value="home" className="mt-0">
          <CompanyHomeTab company={company} isOwner={!!isOwner} />
        </TabsContent>
        
        <TabsContent value="about" className="mt-0">
          <CompanyAboutTab company={company} isOwner={!!isOwner} />
        </TabsContent>
        
        <TabsContent value="jobs" className="mt-0">
          <CompanyJobsTab companyId={company.id} isOwner={!!isOwner} />
        </TabsContent>
        
        <TabsContent value="people" className="mt-0">
          <CompanyPeopleTab companyId={company.id} companyName={company.name} isOwner={!!isOwner} />
        </TabsContent>
        
        <TabsContent value="posts" className="mt-0">
          <CompanyPostsTab companyId={company.id} isOwner={!!isOwner} />
        </TabsContent>
        
        <TabsContent value="locations" className="mt-0">
          <CompanyLocationsTab companyId={company.id} isOwner={!!isOwner} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
