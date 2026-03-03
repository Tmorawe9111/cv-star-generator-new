import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { JobsService } from "@/services/jobsService";
import { toast } from "sonner";
import { useAuth } from "./useAuth";
import { useCompany } from "./useCompany";
import type { JobCreateInput } from "@/types/job";
import type { JobPostRow } from "@/types/job";
import { getErrorMessage } from "@/types/common";

export function useCompanyJobs(companyId?: string) {
  return useQuery({
    queryKey: ["company-jobs", companyId],
    queryFn: () => JobsService.getCompanyJobs(companyId!),
    enabled: !!companyId,
  });
}

export function useJob(jobId?: string) {
  return useQuery({
    queryKey: ["job", jobId],
    queryFn: () => JobsService.getJobById(jobId!),
    enabled: !!jobId,
  });
}

export function usePublicJobs(filters?: {
  employment_type?: string;
  profession_id?: string;
  location?: string;
  work_mode?: string;
  skipBranchFilter?: boolean; // If true, shows all jobs (for search)
}) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["public-jobs", filters, user?.id],
    queryFn: () => JobsService.getPublicJobs({
      ...filters,
      userId: user?.id, // Pass user ID for branch filtering
    }),
  });
}

export function useCreateJob(companyId: string) {
  const queryClient = useQueryClient();
  const { company } = useCompany();

  return useMutation({
    mutationFn: (jobData: JobCreateInput) =>
      JobsService.createJob(companyId, jobData),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["company-jobs", companyId] });
      toast.success("Stellenanzeige erstellt");
      
      // Mark onboarding as complete after first job creation
      if (company && !company.onboarding_completed) {
        try {
          const { supabase } = await import("@/integrations/supabase/client");
          await supabase
            .from('companies')
            .update({ onboarding_completed: true })
            .eq('id', companyId);
        } catch (error) {
          console.error('Error completing onboarding:', error);
          // Don't show error to user, onboarding completion is not critical
        }
      }
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useUpdateJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      jobId,
      updates,
    }: {
      jobId: string;
      updates: Partial<JobPostRow>;
    }) => JobsService.updateJob(jobId, updates),
    onSuccess: (data: JobPostRow) => {
      queryClient.invalidateQueries({ queryKey: ["job", data.id] });
      queryClient.invalidateQueries({ queryKey: ["company-jobs"] });
      toast.success("Änderungen gespeichert");
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useDeleteJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (jobId: string) => JobsService.deleteJob(jobId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-jobs"] });
      toast.success("Stellenanzeige gelöscht");
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function usePublishJob() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (jobId: string) => JobsService.publishJob(jobId, user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-jobs"] });
      toast.success("Stellenanzeige veröffentlicht");
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function usePauseJob() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (jobId: string) => JobsService.pauseJob(jobId, user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-jobs"] });
      toast.success("Stellenanzeige pausiert");
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useResumeJob() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (jobId: string) => JobsService.resumeJob(jobId, user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-jobs"] });
      toast.success("Stellenanzeige fortgesetzt");
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useInactivateJob() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (jobId: string) => JobsService.inactivateJob(jobId, user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-jobs"] });
      toast.success("Stellenanzeige archiviert");
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useJobHistory(jobId?: string) {
  return useQuery({
    queryKey: ["job-history", jobId],
    queryFn: () => JobsService.getJobHistory(jobId!),
    enabled: !!jobId,
  });
}
