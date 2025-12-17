import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, MapPin, Clock, MoreVertical, CheckCircle2, X } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { de } from "date-fns/locale";
import type { MyApplication } from "@/hooks/useMyApplications";

interface PublicJobCardProps {
  job: any;
  onClick: () => void;
  compact?: boolean;
  application?: MyApplication;
}

export function PublicJobCard({ job, onClick, compact = false, application }: PublicJobCardProps) {
  const getEmploymentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      full_time: 'Vollzeit',
      part_time: 'Teilzeit',
      apprenticeship: 'Ausbildung',
      dual_study: 'Duales Studium',
      internship: 'Praktikum',
    };
    return labels[type] || type;
  };

  const timeAgo = job.created_at 
    ? formatDistanceToNow(new Date(job.created_at), { addSuffix: true, locale: de })
    : '';

  if (compact) {
    const workModeLabel = job.work_mode === 'remote' ? 'Remote' : job.work_mode === 'hybrid' ? 'Hybrid' : 'Vor Ort';
    const employmentTypeLabel = getEmploymentTypeLabel(job.employment_type);
    const locationText = [job.city || job.state, job.country].filter(Boolean).join(', ');
    
    return (
      <div 
        className="bg-white border-b border-border p-4 hover:bg-gray-50 transition-colors cursor-pointer group"
        onClick={onClick}
      >
        <div className="flex items-start gap-3">
          {/* Company Logo */}
          {job.company?.logo_url ? (
            <img
              src={job.company.logo_url}
              alt={job.company.name}
              className="h-12 w-12 rounded object-cover flex-shrink-0"
            />
          ) : (
            <div className="h-12 w-12 rounded bg-muted flex items-center justify-center flex-shrink-0">
              <Building2 className="h-6 w-6 text-muted-foreground" />
            </div>
          )}
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm text-blue-600 group-hover:underline line-clamp-2">
                  {job.title}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {job.company?.name || 'Unbekanntes Unternehmen'}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {locationText} {workModeLabel && `(${workModeLabel})`} • {employmentTypeLabel}
                </p>
                
                {/* Job Description */}
                {job.description_md && (
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                    {job.description_md.replace(/[#*`_]/g, '').replace(/\n/g, ' ').trim().slice(0, 150)}
                    {job.description_md.replace(/[#*`_]/g, '').replace(/\n/g, ' ').trim().length > 150 && '...'}
                  </p>
                )}
                
                {/* Divider */}
                <div className="border-t border-border mt-2 pt-2">
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    {/* Salary Range */}
                    {(job.salary_min || job.salary_max) && (
                      <span>
                        €{job.salary_min?.toLocaleString() || '?'} - €{job.salary_max?.toLocaleString() || '?'}
                      </span>
                    )}
                    
                    {/* Start Date */}
                    {job.start_date && (
                      <span>
                        Start: {format(new Date(job.start_date), "dd.MM.yyyy", { locale: de })}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Action Icons */}
              <div className="flex items-center gap-1 shrink-0">
                <button className="p-1 hover:bg-muted rounded opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreVertical className="h-4 w-4 text-muted-foreground" />
                </button>
                <button className="p-1 hover:bg-muted rounded opacity-0 group-hover:opacity-100 transition-opacity">
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card 
      className="p-6 hover:shadow-lg transition-shadow cursor-pointer group border-border"
      onClick={onClick}
    >
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            {job.company?.logo_url ? (
              <img
                src={job.company.logo_url}
                alt={job.company.name}
                className="h-12 w-12 rounded-lg object-cover flex-shrink-0"
              />
            ) : (
              <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                <Building2 className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-base group-hover:text-primary transition-colors line-clamp-1">
                {job.title}
              </h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                {job.company?.name || 'Unbekanntes Unternehmen'}
              </p>
              {(job.city || job.state) && (
                <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {job.city || job.state} • {getEmploymentTypeLabel(job.employment_type)}
                </p>
              )}
            </div>
          </div>
          <button className="p-1 hover:bg-muted rounded opacity-0 group-hover:opacity-100 transition-opacity">
            <MoreVertical className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Description */}
        {job.description_md && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {job.description_md}
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center gap-3 flex-wrap text-sm">
          <Badge variant="secondary" className="font-normal">
            {getEmploymentTypeLabel(job.employment_type)}
          </Badge>
          
          {(job.city || job.state) && (
            <span className="flex items-center gap-1 text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              {job.city || job.state}
            </span>
          )}

          {timeAgo && (
            <span className="flex items-center gap-1 text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              {timeAgo}
            </span>
          )}
        </div>

        {/* Salary Range if available */}
        {(job.salary_min || job.salary_max) && (
          <div className="pt-2 border-t">
            <p className="text-sm font-medium">
              €{job.salary_min?.toLocaleString() || '?'} - €{job.salary_max?.toLocaleString() || '?'}
            </p>
          </div>
        )}

        {/* Application Status */}
        {application && (
          <div className="pt-2 border-t">
            <div className="w-full rounded-xl border border-green-200 bg-green-50 p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-sm font-semibold text-green-900">
                    <CheckCircle2 className="h-4 w-4" />
                    Beworben
                  </div>
                  <div className="mt-1 text-xs text-green-900/80">
                    Beworben am{" "}
                    <span className="font-medium text-green-900">
                      {format(new Date(application.created_at), "dd.MM.yyyy", { locale: de })}
                    </span>
                  </div>
                  {(application as any)?.unlocked_at && (
                    <div className="mt-1 text-xs text-green-900/80">
                      Freigeschaltet am{" "}
                      <span className="font-medium text-green-900">
                        {format(new Date((application as any).unlocked_at), "dd.MM.yyyy", { locale: de })}
                      </span>
                    </div>
                  )}
                </div>
                <Badge className="bg-green-600 text-white hover:bg-green-600">Status</Badge>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
