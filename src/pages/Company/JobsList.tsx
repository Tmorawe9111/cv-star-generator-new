import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCompany } from "@/hooks/useCompany";
import { useCompanyJobs, usePublishJob, usePauseJob, useResumeJob, useInactivateJob, useDeleteJob } from "@/hooks/useJobs";
import { useJobLimits } from "@/hooks/useJobLimits";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { JobStatusBadge } from "@/components/jobs/JobStatusBadge";
import { JobActionsMenu } from "@/components/jobs/JobActionsMenu";
import { JobLimitUpgradeModal } from "@/components/Company/jobs/JobLimitUpgradeModal";
import { Briefcase, Plus, Search, AlertCircle } from "lucide-react";

export default function CompanyJobsList() {
  const navigate = useNavigate();
  const { company } = useCompany();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const { data: jobs, isLoading } = useCompanyJobs(company?.id);
  const { data: jobLimits } = useJobLimits();
  const publishJob = usePublishJob();
  const pauseJob = usePauseJob();
  const resumeJob = useResumeJob();
  const inactivateJob = useInactivateJob();
  const deleteJob = useDeleteJob();

  const filteredJobs = jobs?.filter((job) => {
    const matchesSearch = job.title.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || job.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="px-3 sm:px-6 py-6 max-w-[1400px] mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Stellenanzeigen</h1>
        <p className="text-muted-foreground">
          Verwalten Sie Ihre Stellenausschreibungen
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Meine Stellen
            </CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Suche nach Titel..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle</SelectItem>
                  <SelectItem value="draft">Entwürfe</SelectItem>
                  <SelectItem value="published">Veröffentlicht</SelectItem>
                  <SelectItem value="paused">Pausiert</SelectItem>
                  <SelectItem value="inactive">Archiviert</SelectItem>
                </SelectContent>
              </Select>
              {jobLimits && jobLimits.maxAllowed > 0 && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-muted/50">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    <span className="text-foreground">{jobLimits.currentCount}</span>
                    <span className="text-muted-foreground"> / </span>
                    <span className="text-foreground">{jobLimits.maxAllowed === 999999 ? "∞" : jobLimits.maxAllowed}</span>
                    <span className="text-muted-foreground ml-1">aktiv</span>
                  </span>
                  {!jobLimits.canCreate && jobLimits.maxAllowed !== 999999 && (
                    <Badge variant="destructive" className="ml-2">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Limit erreicht
                    </Badge>
                  )}
                </div>
              )}
              <Button 
                onClick={() => {
                  if (jobLimits && !jobLimits.canCreate && jobLimits.maxAllowed !== 999999) {
                    setShowUpgradeModal(true);
                  } else {
                    navigate('/unternehmen/stellenanzeigen/neu');
                  }
                }}
                disabled={jobLimits && !jobLimits.canCreate && jobLimits.maxAllowed !== 999999}
              >
                <Plus className="h-4 w-4 mr-2" />
                Neue Stelle
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Titel</TableHead>
                <TableHead>Standort</TableHead>
                <TableHead>Typ</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Erstellt</TableHead>
                <TableHead className="text-right">Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    Lädt...
                  </TableCell>
                </TableRow>
              ) : filteredJobs && filteredJobs.length > 0 ? (
                filteredJobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell className="font-medium">{job.title}</TableCell>
                    <TableCell>{job.city || job.state || '—'}</TableCell>
                    <TableCell className="capitalize">
                      {job.employment_type?.replace('_', ' ')}
                    </TableCell>
                    <TableCell>
                      <JobStatusBadge status={job.status as any} />
                    </TableCell>
                    <TableCell>
                      {new Date(job.created_at).toLocaleDateString("de-DE")}
                    </TableCell>
                    <TableCell className="text-right">
                      <JobActionsMenu
                        jobId={job.id}
                        status={job.status as any}
                        onEdit={() => navigate(`/company/jobs/${job.id}/edit`)}
                        onPublish={() => publishJob.mutate(job.id)}
                        onPause={() => pauseJob.mutate(job.id)}
                        onResume={() => resumeJob.mutate(job.id)}
                        onInactivate={() => inactivateJob.mutate(job.id)}
                        onDelete={() => deleteJob.mutate(job.id)}
                      />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Keine Stellenanzeigen gefunden
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {jobLimits && (
        <JobLimitUpgradeModal
          open={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          onUpgrade={() => {
            setShowUpgradeModal(false);
            navigate('/unternehmen/abrechnung?open=upgrade');
          }}
          currentCount={jobLimits.currentCount}
          maxAllowed={jobLimits.maxAllowed}
          reason={jobLimits.reason || "limit_reached"}
        />
      )}
    </div>
  );
}
