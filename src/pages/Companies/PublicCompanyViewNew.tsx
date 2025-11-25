import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useIsCompanyOwner } from "@/hooks/useIsCompanyOwner";
import { useFollowCompany } from "@/hooks/useFollowCompany";
import { CompanyProfileHeader } from "@/components/company/profile/CompanyProfileHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { CompanyHomeTab } from "@/components/company/profile/tabs/CompanyHomeTab";
import { CompanyAboutTab } from "@/components/company/profile/tabs/CompanyAboutTab";
import { CompanyJobsTab } from "@/components/company/profile/tabs/CompanyJobsTab";
import { CompanyPeopleTab } from "@/components/company/profile/tabs/CompanyPeopleTab";
import { CompanyPostsTab } from "@/components/company/profile/tabs/CompanyPostsTab";
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
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "home");
  const fromJobId = searchParams.get("fromJob");
  
  const { data: isOwner } = useIsCompanyOwner(id);
  const { isFollowing, toggleFollow } = useFollowCompany(id);

  const companyQuery = useQuery<Company | null>({
    queryKey: ['public-company', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .rpc('get_company_public', { p_id: id });
      if (error) throw error;
      const row = ((data as any[]) || [])[0] || null;
      return row as Company | null;
    },
    enabled: !!id,
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
      <div className="border-b mt-8">
        <div className="max-w-6xl mx-auto px-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="h-auto p-0 bg-transparent border-b-0">
              <TabsTrigger 
                value="home"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
              >
                Home
              </TabsTrigger>
              <TabsTrigger 
                value="about"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
              >
                Über {company.name}
              </TabsTrigger>
              <TabsTrigger 
                value="jobs"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
              >
                Jobs
              </TabsTrigger>
              <TabsTrigger 
                value="people"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
              >
                Mitarbeiter
              </TabsTrigger>
              <TabsTrigger 
                value="posts"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
              >
                Beiträge
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
          <CompanyPeopleTab companyId={company.id} isOwner={!!isOwner} />
        </TabsContent>
        
        <TabsContent value="posts" className="mt-0">
          <CompanyPostsTab companyId={company.id} isOwner={!!isOwner} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
