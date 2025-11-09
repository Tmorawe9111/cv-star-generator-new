import React from "react";
import { Eye, Download, MapPin, User, Mail, Phone, Briefcase, BriefcaseBusiness, XCircle, ArrowRight, Info } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export type Profile = {
  id: string;
  name: string;
  avatar_url?: string | null;
  role?: string | null;
  industry?: string | null;
  occupation?: string | null;
  educationForm?: string | null;
  city?: string | null;
  fs?: boolean | null;
  seeking?: string | null;
  status?: string | null;
  email?: string | null;
  phone?: string | null;
  skills: string[];
  match?: number | null;
  stage?: string | null;
};

type Props = {
  profile: Profile;
  variant?: "search" | "dashboard" | "unlocked";
  unlockReason?: string;
  unlockNotes?: string;
  unlockSource?: "bewerbung" | "initiativ" | null;
  unlockJobTitle?: string | null;
  onUnlock?: () => void;
  onView?: () => void;
  onDownload?: () => void;
  onToggleFavorite?: () => void;
  onAcceptInterview?: () => void;
  onReject?: () => void;
  actions?: Array<{
    key: string;
    label: string;
    onClick: () => void;
    variant?: "primary" | "outline" | "destructive";
    disabled?: boolean;
  }>;
};

export function ProfileCard({
  profile: p,
  variant = "search",
  unlockReason,
  unlockNotes,
  unlockSource = null,
  unlockJobTitle = null,
  onUnlock,
  onView,
  onDownload,
  onToggleFavorite,
  onAcceptInterview,
  onReject,
  actions = [],
}: Props) {
  const match = Math.round(p.match ?? 0);
  const stageKey = p.stage ? p.stage.toUpperCase() : null;
  const stageConfig: Record<string, { label: string; badgeClass: string }> = {
    FREIGESCHALTET: { label: "Freigeschaltet", badgeClass: "bg-[#E0F2FE] text-[#0369A1] border-none" },
    INTERVIEW_GEPLANT: { label: "Interview geplant", badgeClass: "bg-blue-50 text-blue-700 border border-blue-200" },
    INTERVIEW_DURCHGEFÜHRT: { label: "Interview durchgeführt", badgeClass: "bg-green-50 text-green-700 border border-green-200" },
    ABGESAGT: { label: "Abgesagt", badgeClass: "bg-red-50 text-red-700 border border-red-200" },
    ABGELEHNT: { label: "Abgelehnt", badgeClass: "bg-red-50 text-red-700 border border-red-200" },
    ANGEBOT_GESENDET: { label: "Angebot gesendet", badgeClass: "bg-amber-50 text-amber-700 border border-amber-200" },
    EINGESTELLT: { label: "Eingestellt", badgeClass: "bg-emerald-50 text-emerald-700 border border-emerald-200" },
    ON_HOLD: { label: "On Hold", badgeClass: "bg-gray-50 text-gray-700 border border-gray-200" },
  };

  const stageTooltipText = (() => {
    const parts: string[] = [];
    if (stageKey && stageConfig[stageKey]) {
      parts.push(stageConfig[stageKey].label);
    }
    if (unlockSource === "bewerbung") {
      parts.push(
        unlockJobTitle ? `Bewerbung auf ${unlockJobTitle}` : "Über Bewerbung freigeschaltet"
      );
    } else if (unlockReason) {
      parts.push(unlockReason);
    }
    if (unlockNotes) {
      parts.push(unlockNotes);
    }
    return parts.filter(Boolean).join(" • ");
  })();

  const toTitleCase = (value?: string | null) =>
    value
      ? value
          .split(" ")
          .filter(Boolean)
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ")
      : null;

  const industryLabel = toTitleCase(p.industry ?? p.role ?? undefined);
  const normalizedStatus = (p.status ?? "").toLowerCase();
  const profileLabel = (() => {
    if (normalizedStatus.includes("schuel")) {
      return "Schüler";
    }
    if (normalizedStatus.includes("azub") || normalizedStatus.includes("ausbildung")) {
      return toTitleCase(p.occupation ?? p.role ?? "Ausbildung");
    }
    if (
      normalizedStatus.includes("ausgelern") ||
      normalizedStatus.includes("fachkraft") ||
      normalizedStatus.includes("geselle")
    ) {
      return toTitleCase(p.occupation ?? p.role ?? "Fachkraft");
    }
    return toTitleCase(p.occupation ?? p.role ?? null);
  })();

  const statusBadgeClass = stageKey && stageConfig[stageKey]
    ? stageConfig[stageKey].badgeClass
    : "bg-gray-100 text-gray-600";

  const renderProcessButton = (action: NonNullable<typeof actions>[number]) => {
    const variantClasses = (() => {
      switch (action.variant) {
        case "primary":
          return "bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] text-white shadow-sm hover:shadow-lg hover:from-[#1D4ED8] hover:to-[#1E40AF]";
        case "destructive":
          return "border-2 border-red-200 bg-white text-red-600 hover:border-red-300 hover:bg-red-50";
        default:
          return "border border-[#D0E2FF] bg-[#EEF4FF] text-[#1D4ED8] hover:bg-[#DBE6FF]";
      }
    })();

    const disabledClasses = action.disabled ? "opacity-60 cursor-not-allowed" : "";

    return (
      <button
        key={action.key}
        onClick={action.onClick}
        disabled={action.disabled}
        className={`flex-1 min-w-[160px] inline-flex h-11 items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold transition-all duration-200 ${variantClasses} ${disabledClasses}`.trim()}
      >
        <span>{action.label}</span>
        <ArrowRight className="h-4 w-4" />
      </button>
    );
  };

  const isApplication = unlockSource === "bewerbung";

  return (
    <TooltipProvider>
      <article
        className={`flex h-full w-full max-w-[320px] flex-col rounded-2xl border bg-white p-5 shadow-md transition-shadow duration-200 hover:shadow-lg ${
          isApplication ? "border-orange-300" : "border-gray-200"
        }`}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div
              className={`${
                isApplication ? "rounded-full ring-2 ring-orange-400 ring-offset-2" : ""
              }`}
            >
              <Avatar className="h-12 w-12">
                <AvatarImage src={p.avatar_url || ""} />
                <AvatarFallback className="bg-gradient-to-br from-blue-100 to-blue-200">
                  {variant === "unlocked" && p.name ? (
                    p.name.split(" ").map((n) => n.charAt(0)).join("").substring(0, 2)
                  ) : (
                    <User className="h-5 w-5 text-blue-600" />
                  )}
                </AvatarFallback>
              </Avatar>
            </div>
            <div className="min-w-0">
              <h3
                className="cursor-pointer truncate text-base font-bold leading-tight hover:underline"
                onClick={onView}
              >
                {p.name}
              </h3>
              {p.city && (
                <div className="mt-0.5 flex items-center gap-1 text-xs text-gray-500">
                  <MapPin className="h-3 w-3" />
                  <span className="truncate">{p.city}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex shrink-0 flex-col items-end gap-1" />
        </div>

        {/* Industry & Profile Details */}
        <div className="mt-3 space-y-1 text-xs text-gray-600">
          {industryLabel && (
            <div className="flex items-center gap-2 font-semibold">
              <Briefcase className="h-3.5 w-3.5 text-gray-400" />
              <span>{industryLabel}</span>
            </div>
          )}
          {profileLabel && (
            <div className="flex items-center gap-2 text-gray-500">
              <BriefcaseBusiness className="h-3.5 w-3.5 text-gray-400" />
              <span>{profileLabel}</span>
            </div>
          )}
        </div>

        {/* Sucht */}
        <div className="mt-3">
          {p.seeking ? (
            <>
              <div className="text-xs font-semibold text-emerald-600">Sucht:</div>
              <div className="mt-0.5 line-clamp-2 text-xs text-emerald-700">{p.seeking}</div>
            </>
          ) : (
            <div className="text-xs text-gray-400">Keine Präferenz angegeben</div>
          )}
        </div>

        {/* Process Status & Matching */}
        <div className="mt-4 flex min-h-[44px] items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {stageKey && stageConfig[stageKey] ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClass}`}>
                    {stageConfig[stageKey].label}
                  </span>
                </TooltipTrigger>
                {stageTooltipText && (
                  <TooltipContent className="max-w-xs text-xs">
                    <p>{stageTooltipText}</p>
                  </TooltipContent>
                )}
              </Tooltip>
            ) : (
              <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
                Kein Status
               </span>
            )}
          </div>
          {p.match != null && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex items-center gap-1 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                  Matching: {match}%
                  <Info className="h-3.5 w-3.5" />
                </span>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs text-xs">
                <p>Berechnet aus Standort, Skills und Präferenzen.</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Contact Info (unlocked only) */}
        {variant === "unlocked" && (
          <div className="mt-3 min-h-[64px] space-y-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs">
            {p.email ? (
              <div className="flex items-center gap-2 text-gray-700">
                <Mail className="h-4 w-4 text-gray-500" />
                <a href={`mailto:${p.email}`} className="truncate font-medium hover:text-blue-600 hover:underline">
                  {p.email}
                </a>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-gray-400">
                <Mail className="h-4 w-4" />
                <span className="truncate">Keine E-Mail hinterlegt</span>
              </div>
            )}
            {p.phone ? (
              <div className="flex items-center gap-2 text-gray-700">
                <Phone className="h-4 w-4 text-gray-500" />
                <a href={`tel:${p.phone}`} className="truncate font-medium hover:text-blue-600 hover:underline">
                  {p.phone}
                </a>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-gray-400">
                <Phone className="h-4 w-4" />
                <span className="truncate">Keine Telefonnummer hinterlegt</span>
              </div>
            )}
          </div>
        )}

        {/* Process / Status Buttons */}
        {variant === "unlocked" && actions.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {actions.map(renderProcessButton)}
          </div>
        )}

        <div className="flex-1" />

        {/* Action Buttons (Interview + Unpassend) */}
        {variant === "unlocked" && (onAcceptInterview || onReject) && (
          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={onAcceptInterview}
              className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] px-5 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
            >
              <BriefcaseBusiness className="h-5 w-5" />
              <span>Interview planen</span>
            </button>
            <button
              onClick={onReject}
              className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full border-2 border-red-200 bg-white px-5 text-sm font-semibold text-red-600 shadow-sm transition-all duration-200 hover:bg-red-50 hover:border-red-300 hover:shadow-md active:scale-[0.98]"
            >
              <XCircle className="h-5 w-5" />
              <span>Unpassend</span>
            </button>
          </div>
        )}

        {/* Footer Buttons (Profil ansehen + CV Download) */}
        {variant === "unlocked" && (
          <div className="mt-2 flex items-center gap-3">
            <button
              onClick={onView}
              className="flex h-10 flex-1 items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 text-xs font-semibold text-gray-700 shadow-sm transition-all duration-200 hover:bg-gray-50 hover:border-gray-400 hover:shadow active:scale-[0.98]"
            >
              <Eye className="h-4 w-4" />
              <span>Profil ansehen</span>
            </button>
            <button
              onClick={onDownload}
              className="flex h-10 flex-1 items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 text-xs font-semibold text-gray-700 shadow-sm transition-all duration-200 hover:bg-gray-50 hover:border-gray-400 hover:shadow active:scale-[0.98]"
            >
              <Download className="h-4 w-4" />
              <span>CV Download</span>
            </button>
          </div>
        )}

        {/* Search/Dashboard View */}
        {(variant === "search" || variant === "dashboard") && (
          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={onView}
              className="w-full rounded-lg bg-blue-600 px-3 py-2.5 text-center text-sm font-medium text-white hover:bg-blue-700"
            >
              Profil ansehen
            </button>
          </div>
        )}
      </article>
    </TooltipProvider>
  );
}
