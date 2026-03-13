import React from "react";
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Building2, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { OverlappingAvatars } from "./OverlappingAvatars";
import type { MarketplacePerson, MarketplaceCompany } from "@/types/marketplace";

const DEMO_AVATARS = [
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
];

export interface ForYouCardProps {
  item: MarketplacePerson | MarketplaceCompany;
  type: "person" | "company";
  onAction: () => void;
  actionLabel: string;
  actionDone?: boolean;
  index: number;
}

function getStatusInfo(person: MarketplacePerson): string | null {
  if (person.status === "schueler") {
    const schoolName =
      person.schule ||
      (Array.isArray(person.schulbildung) && person.schulbildung.length > 0
        ? (person.schulbildung[0]?.name || person.schulbildung[0]?.schule)
        : null);
    if (schoolName) {
      const text = `Schüler (an ${schoolName})`;
      return text.length > 28 ? text.substring(0, 25) + "..." : text;
    }
    return "Schüler";
  }
  if (person.status === "azubi") {
    if (person.ausbildungsbetrieb) {
      const text = `Azubi bei ${person.ausbildungsbetrieb}`;
      return text.length > 28 ? text.substring(0, 25) + "..." : text;
    }
    return "Azubi";
  }
  if (person.status === "ausgelernt" || person.status === "fachkraft") {
    const jobTitle =
      person.aktueller_beruf ||
      (Array.isArray(person.berufserfahrung) && person.berufserfahrung.length > 0
        ? (person.berufserfahrung[0]?.position ||
          person.berufserfahrung[0]?.titel)
        : null);
    const company =
      Array.isArray(person.berufserfahrung) && person.berufserfahrung.length > 0
        ? (person.berufserfahrung[0]?.unternehmen ||
          person.berufserfahrung[0]?.company)
        : person.ausbildungsbetrieb;
    if (jobTitle && company) {
      const text = `${jobTitle} bei ${company}`;
      return text.length > 28 ? text.substring(0, 25) + "..." : text;
    }
    if (jobTitle)
      return jobTitle.length > 28 ? jobTitle.substring(0, 25) + "..." : jobTitle;
  }
  return person.branche ?? null;
}

export const ForYouCard: React.FC<ForYouCardProps> = ({
  item,
  type,
  onAction,
  actionLabel,
  actionDone,
  index,
}) => {
  const isPerson = type === "person";
  const person = item as MarketplacePerson;
  const company = item as MarketplaceCompany;

  const name = isPerson
    ? `${person.vorname ?? ""} ${person.nachname ?? ""}`.trim() || "Unbekannt"
    : company.name;
  const branche = isPerson ? person.branche : company.industry;
  const stadt = isPerson ? (person.ort || person.stadt) : company.city;
  const imageUrl = isPerson ? person.avatar_url : company.logo_url;
  const linkTo = isPerson ? `/u/${person.id}` : `/companies/${company.id}`;

  const statusInfo = isPerson ? getStatusInfo(person) : null;
  const mutualCount = isPerson
    ? person.mutualCount ?? [3, 7, 2, 5, 4, 8, 6, 9, 1, 11][index % 10]
    : [3, 7, 2, 5, 4, 8, 6, 9, 1, 11][index % 10];
  const mutualNames =
    isPerson && person.mutualConnections
      ? person.mutualConnections.slice(0, 2).map((c) => c.name)
      : ["Sarah M.", "Tom K."].slice(0, Math.min(mutualCount, 2));
  const mutualAvatars =
    isPerson && person.mutualConnections
      ? person.mutualConnections.slice(0, 2).map((c) => c.avatar_url)
      : DEMO_AVATARS.slice(0, Math.min(mutualCount, 2));

  const gradients = [
    "from-amber-500/10 via-orange-500/5 to-red-500/10",
    "from-emerald-500/10 via-teal-500/5 to-cyan-500/10",
    "from-violet-500/10 via-purple-500/5 to-pink-500/10",
    "from-blue-500/10 via-indigo-500/5 to-violet-500/10",
    "from-rose-500/10 via-pink-500/5 to-fuchsia-500/10",
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
        to={linkTo}
        className="flex flex-col items-center relative z-10 flex-1"
      >
        <div className="relative mb-2 h-[56px] flex items-center justify-center">
          {isPerson ? (
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full opacity-20 blur-sm" />
              <Avatar className="h-14 w-14 ring-2 ring-white shadow-lg">
                <AvatarImage src={imageUrl ?? undefined} className="object-cover" />
                <AvatarFallback className="text-lg font-bold bg-gradient-to-br from-blue-100 to-purple-100 text-gray-700">
                  {name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
          ) : (
            <div className="h-14 w-14 rounded-2xl bg-white flex items-center justify-center overflow-hidden shadow-lg ring-1 ring-black/5">
              {imageUrl ? (
                <img src={imageUrl} alt={name} className="h-full w-full object-cover" />
              ) : (
                <Building2 className="h-7 w-7 text-gray-400" />
              )}
            </div>
          )}
        </div>

        <div className="h-[32px] w-full flex items-center justify-center mb-0.5">
          <p className="font-semibold text-[13px] text-gray-900 line-clamp-2 text-center leading-tight px-1">
            {name}
          </p>
        </div>

        <div className="h-[14px] w-full flex items-center justify-center mb-0.5">
          {statusInfo ? (
            <p
              className="text-[10px] text-gray-600 truncate w-full text-center leading-tight px-1"
              title={statusInfo}
            >
              {statusInfo}
            </p>
          ) : branche ? (
            <p className="text-[10px] text-gray-600 truncate w-full text-center leading-tight px-1">
              {branche}
            </p>
          ) : (
            <div className="h-[14px]" />
          )}
        </div>

        <div className="h-[14px] w-full flex items-center justify-center">
          {stadt ? (
            <p className="text-[10px] text-gray-400 truncate w-full text-center flex items-center justify-center gap-0.5 px-1">
              <MapPin className="h-2.5 w-2.5 shrink-0" />
              <span className="truncate">{stadt}</span>
            </p>
          ) : (
            <div className="h-[14px]" />
          )}
        </div>
      </Link>

      <div className="h-[50px] flex items-center justify-center mt-auto mb-2 relative z-10 w-full">
        {mutualCount > 0 ? (
          <OverlappingAvatars
            avatars={mutualAvatars}
            count={mutualCount}
            label={isPerson ? "" : `${mutualCount} Mitarbeiter`}
            type={isPerson ? "mutual" : "employees"}
            names={isPerson ? mutualNames : []}
          />
        ) : (
          <div className="h-[50px]" />
        )}
      </div>

      <div className="relative z-10 h-[36px] flex items-center">
        <Button
          size="sm"
          onClick={onAction}
          disabled={actionDone}
          className={cn(
            "w-full h-9 text-xs rounded-full font-semibold shadow-lg active:scale-95 transition-all",
            actionDone
              ? "bg-gray-100/80 text-gray-500 shadow-none"
              : "bg-black hover:bg-gray-800 text-white shadow-black/20"
          )}
        >
          {actionDone ? "✓" : actionLabel}
        </Button>
      </div>
    </div>
  );
};
