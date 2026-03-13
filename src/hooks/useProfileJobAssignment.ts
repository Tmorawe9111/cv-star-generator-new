import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { isCompanyAdminRole } from "@/hooks/useCompanyUserRole";
import type { CompanyUserRole } from "@/hooks/useCompanyUserRole";
import type { Option } from "@/components/ui/multi-select";

export interface LinkedJob {
  id: string;
  title: string;
  city?: string | null;
}

export interface UseProfileJobAssignmentOptions {
  companyId: string | null | undefined;
  candidateId: string | null | undefined;
  linkedJobIds: string[] | null | undefined;
  role: CompanyUserRole | null | undefined;
  assignedJobIds: string[] | undefined;
  updateCandidateRecord: (payload: Record<string, unknown>) => Promise<void>;
  onMetaReload: () => Promise<void>;
}

export interface UseProfileJobAssignmentResult {
  jobOptions: Option[];
  linkedJobs: LinkedJob[];
  selectedJobIds: string[];
  jobsLoading: boolean;
  updatingJobs: boolean;
  handleJobAssignmentChange: (values: string[]) => Promise<void>;
  jobBadgeData: Array<{ id: string; label: string }>;
}

export function useProfileJobAssignment({
  companyId,
  candidateId,
  linkedJobIds,
  role,
  assignedJobIds,
  updateCandidateRecord,
  onMetaReload,
}: UseProfileJobAssignmentOptions): UseProfileJobAssignmentResult {
  const [jobOptions, setJobOptions] = useState<MultiSelectOption[]>([]);
  const [linkedJobs, setLinkedJobs] = useState<LinkedJob[]>([]);
  const [selectedJobIds, setSelectedJobIds] = useState<string[]>([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [updatingJobs, setUpdatingJobs] = useState(false);

  const loadJobs = useCallback(async () => {
    if (!companyId) return;
    setJobsLoading(true);
    try {
      const { data, error } = await supabase
        .from("job_posts")
        .select("id, title, city, is_active, status")
        .eq("company_id", companyId)
        .order("title", { ascending: true });

      if (error) throw error;

      const activeJobs = (data || []).filter((job) => {
        if (!job) return false;
        if (job.is_active === true) return true;
        const status = typeof job.status === "string" ? job.status.toLowerCase() : "";
        return status === "published" || status === "active" || status === "online";
      });

      setJobOptions(
        activeJobs.map((job) => ({
          value: job.id,
          label: job.city ? `${job.title} · ${job.city}` : job.title,
        }))
      );
    } catch (error) {
      console.error("Error loading job options:", error);
      toast.error("Aktive Stellen konnten nicht geladen werden");
    } finally {
      setJobsLoading(false);
    }
  }, [companyId]);

  const loadLinkedJobsAndSelection = useCallback(async () => {
    if (!companyId || !candidateId) return;
    const jobIds = Array.isArray(linkedJobIds)
      ? (linkedJobIds as unknown[])
          .map((value) => {
            if (typeof value === "string") return value;
            if (typeof value === "number") return String(value);
            if (value && typeof value === "object" && "id" in (value as Record<string, unknown>)) {
              const possibleId = (value as Record<string, unknown>).id;
              return typeof possibleId === "string" ? possibleId : possibleId ? String(possibleId) : null;
            }
            return null;
          })
          .filter((entry): entry is string => !!entry)
      : [];
    setSelectedJobIds(jobIds);
    if (jobIds.length > 0) {
      const { data: jobDetails, error } = await supabase
        .from("job_posts")
        .select("id, title, city")
        .in("id", jobIds);
      if (error) throw error;
      setLinkedJobs(jobDetails || []);
    } else {
      setLinkedJobs([]);
    }
  }, [companyId, candidateId, linkedJobIds]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  useEffect(() => {
    loadLinkedJobsAndSelection();
  }, [loadLinkedJobsAndSelection]);

  useEffect(() => {
    if (linkedJobs.length === 0) return;
    setJobOptions((prev) => {
      const missing = linkedJobs
        .filter((job) => job.id && !prev.some((option) => option.value === job.id))
        .map((job) => ({
          value: job.id,
          label: job.city ? `${job.title} · ${job.city}` : job.title,
        }));
      return missing.length > 0 ? [...prev, ...missing] : prev;
    });
  }, [linkedJobs]);

  const handleJobAssignmentChange = useCallback(
    async (values: string[]) => {
      if (!companyId || !candidateId) return;
      if (!isCompanyAdminRole(role) && role !== "owner" && (role === "recruiter" || role === "viewer")) {
        if (assignedJobIds && assignedJobIds.length > 0) {
          const allowed = new Set(assignedJobIds);
          const disallowed = values.filter((v) => !allowed.has(v));
          if (disallowed.length > 0) {
            toast.error("Sie können nur Kandidaten zu Ihren zugewiesenen Stellen zuordnen.");
            return;
          }
        }
      }
      setSelectedJobIds(values);
      setUpdatingJobs(true);
      try {
        await updateCandidateRecord({ linked_job_ids: values });
        await onMetaReload();
        toast.success("Stellenzuordnung aktualisiert");
      } catch (error) {
        console.error("Error updating job assignment:", error);
        toast.error("Stellenzuordnung konnte nicht gespeichert werden");
      } finally {
        setUpdatingJobs(false);
      }
    },
    [
      companyId,
      candidateId,
      role,
      assignedJobIds,
      updateCandidateRecord,
      onMetaReload,
    ]
  );

  const jobBadgeData = selectedJobIds.map((jobId) => {
    const linked = linkedJobs.find((job) => job.id === jobId);
    if (linked) {
      return {
        id: jobId,
        label: linked.city ? `${linked.title} · ${linked.city}` : linked.title,
      };
    }
    const option = jobOptions.find((opt) => opt.value === jobId);
    return { id: jobId, label: option?.label ?? jobId };
  });

  return {
    jobOptions,
    linkedJobs,
    selectedJobIds,
    jobsLoading,
    updatingJobs,
    handleJobAssignmentChange,
    jobBadgeData,
  };
}
