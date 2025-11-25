import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Plus, Briefcase, Settings, Archive, Eye } from "lucide-react";
import { useCompany } from "@/hooks/useCompany";
import { useCompanyNeeds } from "@/hooks/useCompanyNeeds";
import { NeedCard } from "@/components/Company/needs/NeedCard";
import { QuotaBanner } from "@/components/Company/needs/QuotaBanner";
import { UpsellModal } from "@/components/Company/needs/UpsellModal";
import { NeedWizard } from "@/components/Company/needs/NeedWizard";
import { useNavigate } from "react-router-dom";

export default function CompanyNeeds() {
  const { company, loading: companyLoading } = useCompany();
  const navigate = useNavigate();
  
  const {
    needs,
    quota,
    packages,
    topMatches,
    loading,
    error,
    createNeed,
    toggleNeedVisibility,
    archiveNeed,
    purchaseExtraNeed,
    upgradePackage
  } = useCompanyNeeds(company?.id);

  const [showUpsellModal, setShowUpsellModal] = useState(false);
  const [showNeedWizard, setShowNeedWizard] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const activeNeeds = needs.filter(need => need.visibility === 'active');
  const pausedNeeds = needs.filter(need => need.visibility === 'paused');
  const archivedNeeds = needs.filter(need => need.visibility === 'archived');

  const currentPackage = packages.find(p => p.id === 'starter'); // Default to starter package

  const handleCreateNeed = () => {
    if (quota && quota.remaining_needs <= 0) {
      setShowUpsellModal(true);
    } else {
      setShowNeedWizard(true);
    }
  };

  const handleNeedSubmit = async (needData: any) => {
    setIsCreating(true);
    try {
      const result = await createNeed(needData);
      if (!result.success && result.error === 'quota_exceeded') {
        setShowUpsellModal(true);
        return { success: false, error: 'quota_exceeded' };
      }
      return result;
    } finally {
      setIsCreating(false);
    }
  };

  const handleViewAllMatches = (needId: string) => {
    navigate(`/company/search?need=${needId}`);
  };

  const handlePurchaseExtra = async () => {
    await purchaseExtraNeed();
    setShowUpsellModal(false);
  };

  const handleUpgradePackage = async (packageId: string) => {
    await upgradePackage(packageId);
    setShowUpsellModal(false);
  };

  if (companyLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="text-center py-12">
        <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Kein Unternehmen gefunden</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={() => window.location.reload()}>
          Neu laden
        </Button>
      </div>
    );
  }

  return (
    <div className="p-3 md:p-6 min-h-screen bg-background space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Anforderungsprofile</h1>
          <p className="text-muted-foreground">
            Definieren Sie Ihre idealen Kandidaten und finden Sie passende Bewerber
          </p>
        </div>
        <Button onClick={handleCreateNeed} disabled={!quota}>
          <Plus className="h-4 w-4 mr-2" />
          Neues Profil erstellen
        </Button>
      </div>

      {/* Quota Banner */}
      {quota && (
        <QuotaBanner
          quota={quota}
          packageName={currentPackage?.name}
          onUpgrade={() => setShowUpsellModal(true)}
          onPurchaseExtra={() => setShowUpsellModal(true)}
        />
      )}

      {/* Needs List */}
      <Tabs defaultValue="active" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="active" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Aktiv
            {activeNeeds.length > 0 && (
              <Badge variant="outline" className="ml-1">
                {activeNeeds.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="paused" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Pausiert
            {pausedNeeds.length > 0 && (
              <Badge variant="outline" className="ml-1">
                {pausedNeeds.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="archived" className="flex items-center gap-2">
            <Archive className="h-4 w-4" />
            Archiviert
            {archivedNeeds.length > 0 && (
              <Badge variant="outline" className="ml-1">
                {archivedNeeds.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {activeNeeds.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Noch keine aktiven Anforderungsprofile</h3>
                <p className="text-muted-foreground mb-4">
                  Erstellen Sie Ihr erstes Anforderungsprofil, um passende Kandidaten zu finden.
                </p>
                <Button onClick={handleCreateNeed}>
                  <Plus className="h-4 w-4 mr-2" />
                  Erstes Profil erstellen
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {activeNeeds.map((need) => (
                <NeedCard
                  key={need.id}
                  need={need}
                  topMatches={topMatches[need.id] || []}
                  onViewAllMatches={handleViewAllMatches}
                  onToggleVisibility={toggleNeedVisibility}
                  onArchive={archiveNeed}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="paused" className="space-y-4">
          {pausedNeeds.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Settings className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Keine pausierten Anforderungsprofile</h3>
                <p className="text-muted-foreground">
                  Pausierte Profile werden hier angezeigt.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {pausedNeeds.map((need) => (
                <NeedCard
                  key={need.id}
                  need={need}
                  topMatches={[]}
                  onViewAllMatches={handleViewAllMatches}
                  onToggleVisibility={toggleNeedVisibility}
                  onArchive={archiveNeed}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="archived" className="space-y-4">
          {archivedNeeds.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Archive className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Keine archivierten Anforderungsprofile</h3>
                <p className="text-muted-foreground">
                  Archivierte Profile werden hier angezeigt.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {archivedNeeds.map((need) => (
                <NeedCard
                  key={need.id}
                  need={need}
                  topMatches={[]}
                  onViewAllMatches={handleViewAllMatches}
                  onToggleVisibility={toggleNeedVisibility}
                  onArchive={archiveNeed}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <NeedWizard
        isOpen={showNeedWizard}
        onClose={() => setShowNeedWizard(false)}
        onSubmit={handleNeedSubmit}
        isLoading={isCreating}
      />

      <UpsellModal
        isOpen={showUpsellModal}
        onClose={() => setShowUpsellModal(false)}
        packages={packages}
        currentPackageId={'starter'}
        onPurchaseExtra={handlePurchaseExtra}
        onUpgradePackage={handleUpgradePackage}
      />
    </div>
  );
}