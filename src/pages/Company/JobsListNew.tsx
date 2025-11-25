import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCompany } from "@/hooks/useCompany";
import { useCompanyJobs, usePublishJob, usePauseJob, useResumeJob, useInactivateJob, useDeleteJob } from "@/hooks/useJobs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { JobCard } from "@/components/jobs/JobCard";
import { Plus, Search, Briefcase, FileText, Pause, Archive, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function CompanyJobsListNew() {
  const navigate = useNavigate();
  const { company } = useCompany();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: jobs, isLoading } = useCompanyJobs(company?.id);
  const publishJob = usePublishJob();
  const pauseJob = usePauseJob();
  const resumeJob = useResumeJob();
  const inactivateJob = useInactivateJob();
  const deleteJob = useDeleteJob();

  const filteredJobs = jobs?.filter((job) => {
    const matchesSearch = job.title.toLowerCase().includes(search.toLowerCase());
    const status = job.status?.toLowerCase();

    if (statusFilter === "all") {
      const isDeleted = status === "inactive" || status === "deleted";
      return matchesSearch && !isDeleted;
    }

    if (statusFilter === "published") {
      return matchesSearch && status === "published";
    }

    if (statusFilter === "paused") {
      return matchesSearch && status === "paused";
    }

    if (statusFilter === "drafts") {
      return matchesSearch && status === "draft";
    }

    if (statusFilter === "deleted") {
      return matchesSearch && (status === "inactive" || status === "deleted");
    }

    return matchesSearch;
  });

  const filterButtons = [
    { id: "all", label: "Alle Stellenanzeigen", icon: Briefcase },
    { id: "published", label: "Aktive Stellenanzeigen", icon: FileText },
    { id: "paused", label: "Pausierte Stellenanzeigen", icon: Pause },
    { id: "drafts", label: "Entwürfe", icon: FileText },
    { id: "deleted", label: "Archivierte Stellenanzeigen", icon: Trash2 },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1600px] mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold">Stellenanzeigen</h1>
              <p className="text-muted-foreground mt-1">
                Verwalten Sie Ihre Stellenausschreibungen
              </p>
            </div>
            <Button onClick={() => navigate('/company/jobs/new')} size="lg">
              <Plus className="h-4 w-4 mr-2" />
              Neue Stelle
            </Button>
          </div>

          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Suche nach Titel..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Filters */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border p-4 space-y-2">
              {filterButtons.map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setStatusFilter(filter.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors",
                    statusFilter === filter.id
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-gray-100 text-gray-700"
                  )}
                >
                  <filter.icon className="h-4 w-4" />
                  <span className="font-medium">{filter.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Jobs Grid */}
          <div className="lg:col-span-3">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : filteredJobs && filteredJobs.length > 0 ? (
              <div className="grid gap-4">
                {filteredJobs.map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    onEdit={() => navigate(`/company/jobs/${job.id}/edit`)}
                    onPublish={() => publishJob.mutate(job.id)}
                    onPause={() => pauseJob.mutate(job.id)}
                    onResume={() => resumeJob.mutate(job.id)}
                    onInactivate={() => inactivateJob.mutate(job.id)}
                    onDelete={() => deleteJob.mutate(job.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-lg border">
                <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {search || statusFilter !== "all" 
                    ? "Keine Stellenanzeigen gefunden" 
                    : "Noch keine Stellenanzeigen erstellt"}
                </p>
                {!search && statusFilter === "all" && (
                  <Button 
                    onClick={() => navigate('/company/jobs/new')} 
                    className="mt-4"
                  >
                    Erste Stelle erstellen
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
