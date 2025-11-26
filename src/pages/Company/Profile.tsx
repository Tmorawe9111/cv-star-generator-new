import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useCompany } from "@/hooks/useCompany";
import { CompanyProfileHeader } from "@/components/Company/profile/CompanyProfileHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CompanyHomeTab } from "@/components/Company/profile/tabs/CompanyHomeTab";
import { CompanyAboutTab } from "@/components/Company/profile/tabs/CompanyAboutTab";
import { CompanyJobsTab } from "@/components/Company/profile/tabs/CompanyJobsTab";
import { CompanyPeopleTab } from "@/components/Company/profile/tabs/CompanyPeopleTab";
import { CompanyPostsTab } from "@/components/Company/profile/tabs/CompanyPostsTab";
import { CompanyLocationsTab } from "@/components/Company/profile/tabs/CompanyLocationsTab";
import { useToast } from "@/hooks/use-toast";
import { uploadFile } from "@/lib/supabase-storage";
import { Building2 } from "lucide-react";

export default function CompanyProfile() {
  const { company, updateCompany, loading } = useCompany();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "home");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // Update URL when tab changes
  useEffect(() => {
    if (activeTab !== "home") {
      setSearchParams({ tab: activeTab });
    } else {
      setSearchParams({});
    }
  }, [activeTab, setSearchParams]);

  const handleCoverUpload = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e: any) => {
      const file = e.target?.files?.[0];
      if (!file || !company?.id) return;
      try {
        setSaving(true);
        const { url } = await uploadFile(file, 'company-media', `companies/${company.id}/cover`);
        await updateCompany({ header_image: url });
        toast({ title: 'Cover aktualisiert' });
      } catch (err: any) {
        toast({ title: 'Upload fehlgeschlagen', description: err.message, variant: 'destructive' });
      } finally {
        setSaving(false);
      }
    };
    input.click();
  };

  const handleLogoUpload = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e: any) => {
      const file = e.target?.files?.[0];
      if (!file || !company?.id) return;
      try {
        setSaving(true);
        const { url } = await uploadFile(file, 'company-media', `companies/${company.id}/logo`);
        await updateCompany({ logo_url: url });
        toast({ title: 'Logo aktualisiert' });
      } catch (err: any) {
        toast({ title: 'Upload fehlgeschlagen', description: err.message, variant: 'destructive' });
      } finally {
        setSaving(false);
      }
    };
    input.click();
  };

  const handleSaveAboutTab = async (data: { description?: string; website_url?: string }) => {
    setSaving(true);
    try {
      const result = await updateCompany(data);
      if (result?.success) {
        toast({ title: "Profil erfolgreich aktualisiert" });
      } else {
        throw new Error(result?.error || "Unbekannter Fehler");
      }
    } catch (error: any) {
      toast({ 
        title: "Fehler beim Speichern", 
        description: error.message,
        variant: "destructive" 
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Lade Unternehmensprofil...</div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold">Kein Unternehmen gefunden</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-6 pt-10">
        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
          <CompanyProfileHeader 
            company={{
              id: company.id,
              name: company.name || '',
              logo_url: company.logo_url,
              header_image: company.header_image,
              description: company.description,
              main_location: company.main_location,
              industry: company.industry,
              target_groups: company.target_groups,
            }}
            isOwner={true}
            onCoverUpload={handleCoverUpload}
            onLogoUpload={handleLogoUpload}
          />
        </div>
      </div>
      
      {/* Tabs Navigation */}
      <div className="mt-8">
        <div className="mx-auto max-w-6xl px-6">
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
              <TabsTrigger 
                value="locations"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
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
          <CompanyHomeTab 
            company={{
              id: company.id,
              name: company.name || '',
              description: company.description,
              contact_person: company.contact_person,
              contact_email: company.contact_email,
              contact_phone: company.contact_phone,
              contact_position: company.contact_position,
              street: company.street,
              house_number: company.house_number,
              postal_code: company.postal_code,
              city: company.city,
              country: company.country,
            }} 
            isOwner={true} 
          />
        </TabsContent>
        
        <TabsContent value="about" className="mt-0">
          <CompanyAboutTab 
            company={{
              id: company.id,
              name: company.name || '',
              description: company.description,
              website_url: company.website_url,
              employee_count: company.employee_count,
              size_range: company.size_range,
              main_location: company.main_location,
              industry: company.industry,
              target_groups: company.target_groups,
              contact_person: (company as any).contact_person,
              contact_email: (company as any).contact_email,
              contact_phone: (company as any).contact_phone,
              contact_position: (company as any).contact_position,
            }} 
            isOwner={true}
            onSave={handleSaveAboutTab}
          />
        </TabsContent>
        
        <TabsContent value="jobs" className="mt-0">
          <CompanyJobsTab companyId={company.id} isOwner={true} />
        </TabsContent>
        
        <TabsContent value="people" className="mt-0">
          <CompanyPeopleTab companyId={company.id} companyName={company.name} isOwner={true} />
        </TabsContent>
        
        <TabsContent value="posts" className="mt-0">
          <CompanyPostsTab companyId={company.id} isOwner={true} />
        </TabsContent>
        
        <TabsContent value="locations" className="mt-0">
          <CompanyLocationsTab companyId={company.id} isOwner={true} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
