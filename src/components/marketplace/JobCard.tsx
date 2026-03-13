import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Briefcase, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MarketplaceJob } from "@/types/marketplace";

export interface JobApplication {
  created_at?: string | null;
  unlocked_at?: string | null;
  status?: string | null;
}

export interface JobCardProps {
  job: MarketplaceJob;
  companyName?: string;
  companyLogo?: string | null;
  onApply?: (job: MarketplaceJob) => void;
  application?: JobApplication | null;
}

export const JobCard: React.FC<JobCardProps> = ({
  job,
  companyName,
  companyLogo,
  onApply,
  application,
}) => {
  const gradients = [
    "from-blue-500/10 via-indigo-500/5 to-violet-500/10",
    "from-emerald-500/10 via-teal-500/5 to-cyan-500/10",
    "from-orange-500/10 via-amber-500/5 to-yellow-500/10",
    "from-rose-500/10 via-pink-500/5 to-red-500/10",
  ];
  const gradient = gradients[Math.floor(Math.random() * gradients.length)];

  return (
    <div
      className={cn(
        "min-w-[180px] w-[180px] h-[200px] rounded-[20px] p-3 flex flex-col relative overflow-hidden",
        "bg-gradient-to-br",
        gradient,
        "border border-white/60 shadow-[0_2px_20px_-4px_rgba(0,0,0,0.1)]",
        "backdrop-blur-sm"
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent pointer-events-none" />

      <Link
        to={`/stelle/${job.id}`}
        className="flex flex-col relative z-10 flex-1"
      >
        <div className="flex items-center gap-2 mb-2">
          <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center overflow-hidden shadow-md ring-1 ring-black/5 shrink-0">
            {companyLogo ? (
              <img
                src={companyLogo}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <Briefcase className="h-5 w-5 text-gray-400" />
            )}
          </div>
          <p className="text-[10px] text-gray-600 truncate flex-1">
            {companyName || "Unternehmen"}
          </p>
        </div>
        <p className="font-semibold text-[13px] text-gray-900 line-clamp-2 leading-tight mb-2">
          {job.title}
        </p>

        <div className="space-y-1 mt-auto">
          <p className="text-[10px] text-gray-500 flex items-center gap-1">
            <MapPin className="h-2.5 w-2.5 shrink-0" />
            <span className="truncate">{job.location || "Flexibel"}</span>
          </p>
          <div className="flex items-center gap-2">
            {job.employment_type && (
              <span className="text-[9px] bg-black/5 text-gray-600 px-2 py-0.5 rounded-full">
                {job.employment_type}
              </span>
            )}
            {(job.salary_min || job.salary_max) && (
              <span className="text-[9px] bg-green-500/10 text-green-700 px-2 py-0.5 rounded-full">
                {job.salary_min && job.salary_max
                  ? `${Math.round(job.salary_min / 1000)}k - ${Math.round(job.salary_max / 1000)}k €`
                  : job.salary_max
                    ? `bis ${Math.round(job.salary_max / 1000)}k €`
                    : `ab ${Math.round((job.salary_min ?? 0) / 1000)}k €`
                }
              </span>
            )}
          </div>
        </div>
      </Link>

      <div className="mt-auto pt-2 relative z-10">
        {application ? (
          <Button
            size="sm"
            variant="outline"
            className="w-full h-9 text-[11px] rounded-full border-green-200 bg-green-50 text-green-900 hover:bg-green-50 pointer-events-none"
          >
            Beworben am{" "}
            {application.created_at
              ? new Date(application.created_at).toLocaleDateString("de-DE")
              : "—"}
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={(e) => {
              e.preventDefault();
              onApply?.(job);
            }}
            className="w-full h-9 text-xs rounded-full bg-black hover:bg-gray-800 text-white font-semibold shadow-lg shadow-black/20 active:scale-95 transition-all"
          >
            Bewerben
          </Button>
        )}
      </div>
    </div>
  );
};
