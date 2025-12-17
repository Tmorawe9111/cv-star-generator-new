import { useNavigate, useParams } from "react-router-dom";
import { useCompany } from "@/hooks/useCompany";
import { useJob, useUpdateJob } from "@/hooks/useJobs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { JobFormProvider, useJobForm } from "@/contexts/JobFormContext";
import { JobFormWizard } from "@/components/jobs/wizard/JobFormWizard";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

function JobEditContent() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const updateJob = useUpdateJob();
  const { formData } = useJobForm();

  const handleSubmit = async () => {
    if (!id) return;
    
    // Don't update Step 1 fields (title, industry, city, employment_type, start_date)
    const { title, industry, city, employment_type, start_date, ...updatableFields } = formData;
    
    await updateJob.mutateAsync({ 
      jobId: id, 
      updates: updatableFields 
    });
    navigate('/unternehmen/stellenanzeigen');
  };

  return (
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
          <CardTitle>Stellenanzeige bearbeiten</CardTitle>
        </CardHeader>
        <CardContent>
          <JobFormWizard
            onSubmit={handleSubmit}
            isLoading={updateJob.isPending}
            isEditMode={true}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function JobEdit() {
  const { id } = useParams<{ id: string }>();
  const { data: job, isLoading } = useJob(id);

  if (isLoading || !job) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Map job data to form format
  const initialFormData = {
    title: job.title || '',
    industry: job.industry || '',
    city: job.city || '',
    employment_type: job.employment_type || 'full-time',
    start_date: job.start_date || '',
    skills: job.skills || [],
    required_languages: job.required_languages || [],
    certifications: job.certifications || [],
    description_md: job.description_md || '',
    tasks_md: job.tasks_md || '',
    requirements_md: job.requirements_md || '',
    benefits_description: job.benefits_description || '',
    contact_person_name: job.contact_person_name || '',
    contact_person_email: job.contact_person_email || '',
    contact_person_phone: job.contact_person_phone || '',
    contact_person_role: job.contact_person_role || '',
    contact_person_photo_url: job.contact_person_photo_url || '',
    salary_min: job.salary_min || undefined,
    salary_max: job.salary_max || undefined,
    work_mode: job.work_mode || undefined,
    working_hours: job.working_hours || '',
    is_public: job.is_public ?? true,
    is_active: job.is_active ?? false,
  };

  return (
    <JobFormProvider initialData={initialFormData}>
      <JobEditContent />
    </JobFormProvider>
  );
}

export default JobEdit;
