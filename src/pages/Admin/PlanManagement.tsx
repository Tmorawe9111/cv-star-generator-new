import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Settings, BarChart3 } from "lucide-react";
import { PlanList } from "@/components/admin/plans/PlanList";
import { PlanEditor } from "@/components/admin/plans/PlanEditor";
import { PlanComparison } from "@/components/admin/plans/PlanComparison";
import { TemplateSelector } from "@/components/admin/plans/TemplateSelector";
import { useToast } from "@/hooks/use-toast";
import { PlanTemplate } from "@/lib/plan-templates";

export default function PlanManagement() {
  const [activeTab, setActiveTab] = useState("list");
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [templateData, setTemplateData] = useState<PlanTemplate["template"] | undefined>(undefined);
  const { toast } = useToast();

  const { data: plans, isLoading } = useQuery({
    queryKey: ["subscription-plans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscription_plans")
        .select("*")
        .order("sort_order", { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });

  const handleCreatePlan = () => {
    setShowTemplateSelector(true);
  };

  const handleTemplateSelected = (template: PlanTemplate["template"]) => {
    setTemplateData(template);
    setShowTemplateSelector(false);
    setIsCreating(true);
    setEditingPlanId(null);
    setActiveTab("editor");
  };

  const handleTemplateCancel = () => {
    setShowTemplateSelector(false);
  };

  const handleEditPlan = (planId: string) => {
    setEditingPlanId(planId);
    setIsCreating(false);
    setActiveTab("editor");
  };

  const handleSaveSuccess = () => {
    setIsCreating(false);
    setEditingPlanId(null);
    setTemplateData(undefined);
    setActiveTab("list");
    toast({
      title: "Erfolg",
      description: isCreating ? "Plan erfolgreich erstellt" : "Plan erfolgreich aktualisiert",
    });
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingPlanId(null);
    setTemplateData(undefined);
    setActiveTab("list");
  };

  return (
    <div className="px-3 sm:px-6 py-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Plan Management</h1>
          <p className="text-muted-foreground mt-1">
            Verwalte Abonnement-Pläne, Preise und Limits
          </p>
        </div>
        {activeTab === "list" && (
          <Button onClick={handleCreatePlan} className="gap-2">
            <Plus className="h-4 w-4" />
            Neuen Plan erstellen
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="list" className="gap-2">
            <Settings className="h-4 w-4" />
            Alle Pläne
          </TabsTrigger>
          <TabsTrigger value="comparison" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Vergleich
          </TabsTrigger>
          {(isCreating || editingPlanId) && (
            <TabsTrigger value="editor" className="gap-2">
              {isCreating ? "Neuer Plan" : "Plan bearbeiten"}
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="list" className="space-y-6">
          <PlanList 
            plans={plans || []} 
            isLoading={isLoading}
            onEdit={handleEditPlan}
          />
        </TabsContent>

        <TabsContent value="comparison" className="space-y-6">
          <PlanComparison plans={plans || []} isLoading={isLoading} />
        </TabsContent>

        {(isCreating || editingPlanId) && (
          <TabsContent value="editor" className="space-y-6">
            <PlanEditor
              planId={editingPlanId}
              isCreating={isCreating}
              onSave={handleSaveSuccess}
              onCancel={handleCancel}
              templateData={templateData}
            />
          </TabsContent>
        )}
      </Tabs>

      {showTemplateSelector && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <CardContent className="p-6">
              <TemplateSelector
                onSelectTemplate={handleTemplateSelected}
                onCancel={handleTemplateCancel}
              />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

