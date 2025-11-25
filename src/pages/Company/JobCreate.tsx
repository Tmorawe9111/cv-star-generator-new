import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCompany } from "@/hooks/useCompany";
import { useCreateJob } from "@/hooks/useJobs";
import { useJobLimits } from "@/hooks/useJobLimits";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { JobFormProvider, useJobForm } from "@/contexts/JobFormContext";
import { JobFormWizard } from "@/components/jobs/wizard/JobFormWizard";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { JobLimitUpgradeModal } from "@/components/Company/jobs/JobLimitUpgradeModal";
import { PlanKey } from "@/lib/billing-v2/plans";

function JobCreateContent() {
  const navigate = useNavigate();
  const { company, loading } = useCompany();
  const createJob = useCreateJob(company?.id || '');
  const { formData } = useJobForm();
  const { data: jobLimits, isLoading: limitsLoading } = useJobLimits();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Check limits before allowing form submission
  const handleSubmit = async () => {
    if (!company?.id) {
      toast.error("Keine Firma gefunden. Bitte erstellen Sie zuerst ein Unternehmensprofil.");
      return;
    }
    
    // Check job limits
    if (!jobLimits?.canCreate) {
      setShowUpgradeModal(true);
      return;
    }
    
    await createJob.mutateAsync(formData);
    
    // After successful job creation, mark onboarding as complete if not already
    if (!company.onboarding_completed) {
      try {
        await supabase
          .from('companies')
          .update({ onboarding_completed: true })
          .eq('id', company.id);
      } catch (error) {
        console.error('Error completing onboarding:', error);
        // Don't block navigation if this fails
      }
    }
    
    navigate('/company/jobs');
  };

  // Show upgrade modal if limits are reached
  useEffect(() => {
    if (jobLimits && !jobLimits.canCreate && !showUpgradeModal) {
      setShowUpgradeModal(true);
    }
  }, [jobLimits, showUpgradeModal]);

  if (loading || limitsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Keine Firma gefunden</p>
          <Button onClick={() => navigate('/company/profile')}>
            Zum Unternehmensprofil
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="px-3 sm:px-6 py-6 max-w-[1000px] mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate('/company/jobs')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Zurück
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Neue Stellenanzeige erstellen</CardTitle>
            {jobLimits && jobLimits.maxAllowed > 0 && (
              <p className="text-sm text-muted-foreground mt-2">
                {jobLimits.currentCount} von {jobLimits.maxAllowed} Stellenanzeigen aktiv
              </p>
            )}
          </CardHeader>
          <CardContent>
            <JobFormWizard
              onSubmit={handleSubmit}
              isLoading={createJob.isPending}
            />
          </CardContent>
        </Card>
      </div>

      <JobLimitUpgradeModal
        open={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        currentPlan={(company.selected_plan_id as PlanKey) || null}
        currentCount={jobLimits?.currentCount || 0}
        maxAllowed={jobLimits?.maxAllowed || 0}
        reason={jobLimits?.reason || "free"}
      />
    </>
  );
}

export default function JobCreate() {
  return (
    <JobFormProvider>
      <JobCreateContent />
    </JobFormProvider>
  );
}
