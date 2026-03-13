import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Building2, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { OverlappingAvatars } from "./OverlappingAvatars";
import { useFollowCompany } from "@/hooks/useFollowCompany";
import type { MarketplaceCompany } from "@/types/marketplace";

const DEMO_AVATARS = [
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
];

export interface CompanyCardProps {
  company: MarketplaceCompany;
  index?: number;
}

export const CompanyCard: React.FC<CompanyCardProps> = ({
  company,
  index = 0,
}) => {
  const { isFollowing, toggleFollow, loading } = useFollowCompany(
    company.id,
    { name: company.name, city: company.city ?? undefined }
  );

  const employeeCounts = [24, 8, 156, 42, 15, 67, 5, 89, 31, 12];
  const employeeCount = employeeCounts[index % 10];

  const gradients = [
    "from-blue-500/10 via-indigo-500/5 to-violet-500/10",
    "from-teal-500/10 via-emerald-500/5 to-green-500/10",
    "from-orange-500/10 via-amber-500/5 to-yellow-500/10",
    "from-pink-500/10 via-rose-500/5 to-red-500/10",
    "from-cyan-500/10 via-sky-500/5 to-blue-500/10",
  ];
  const gradient = gradients[index % 5];

  return (
    <div
      className={cn(
        "min-w-[156px] w-[156px] h-[280px] rounded-[20px] p-3 flex flex-col relative overflow-hidden",
        "bg-gradient-to-br",
        gradient,
        "border border-white/60 shadow-[0_2px_20px_-4px_rgba(0,0,0,0.1)]",
        "backdrop-blur-sm transition-all duration-300 active:scale-[0.98]"
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent pointer-events-none" />

      <Link
        to={`/companies/${company.id}`}
        className="flex flex-col items-center relative z-10 flex-1"
      >
        <div className="relative mb-2 h-[56px] flex items-center justify-center">
          <div className="h-14 w-14 rounded-2xl bg-white flex items-center justify-center overflow-hidden shadow-lg ring-1 ring-black/5">
            {company.logo_url ? (
              <img
                src={company.logo_url}
                alt={company.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <Building2 className="h-7 w-7 text-gray-400" />
            )}
          </div>
        </div>

        <div className="h-[32px] w-full flex items-center justify-center mb-0.5">
          <p className="font-semibold text-[13px] text-gray-900 line-clamp-2 text-center leading-tight px-1">
            {company.name}
          </p>
        </div>

        <div className="h-[14px] w-full flex items-center justify-center mb-0.5">
          {company.industry ? (
            <p className="text-[10px] text-gray-600 truncate w-full text-center leading-tight px-1">
              {company.industry}
            </p>
          ) : (
            <div className="h-[14px]" />
          )}
        </div>

        <div className="h-[14px] w-full flex items-center justify-center">
          {company.city ? (
            <p className="text-[10px] text-gray-400 truncate w-full text-center flex items-center justify-center gap-0.5 px-1">
              <MapPin className="h-2.5 w-2.5 shrink-0" />
              <span className="truncate">{company.city}</span>
            </p>
          ) : (
            <div className="h-[14px]" />
          )}
        </div>
      </Link>

      <div className="h-[50px] flex items-center justify-center mt-auto mb-2 relative z-10 w-full">
        <OverlappingAvatars
          avatars={DEMO_AVATARS}
          count={employeeCount}
          label={`${employeeCount} Mitarbeiter`}
          type="employees"
        />
      </div>

      <div className="relative z-10 h-[36px] flex items-center">
        <Button
          size="sm"
          onClick={toggleFollow}
          disabled={loading}
          className={cn(
            "w-full h-9 text-xs rounded-full font-semibold shadow-lg active:scale-95 transition-all",
            isFollowing
              ? "bg-gray-100/80 text-gray-600 shadow-none"
              : "bg-black hover:bg-gray-800 text-white shadow-black/20"
          )}
        >
          {isFollowing ? "Gefolgt ✓" : "Folgen"}
        </Button>
      </div>
    </div>
  );
};
