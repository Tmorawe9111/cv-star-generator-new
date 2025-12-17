import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Mail, Phone, MapPin, Briefcase } from "lucide-react";
import { ApplicationStatus, ApplicationSource } from "@/utils/applicationStatus";

interface UnifiedCandidateCardProps {
  candidate: {
    id: string;
    full_name: string;
    email?: string;
    phone?: string;
    city?: string;
    country?: string;
    skills?: string[];
    profile_image?: string;
    experience_years?: number;
    bio_short?: string;
  };
  application?: {
    id: string;
    status: ApplicationStatus;
    source: ApplicationSource;
    created_at: string;
    is_new?: boolean;
    job_id?: string | null;
    job_title?: string | null;
  };
  onUnlock?: () => void;
  onStatusChange?: (status: ApplicationStatus) => void;
  onViewDetails?: () => void;
  isUnlocked?: boolean;
}

export function UnifiedCandidateCard({
  candidate,
  application,
  onUnlock,
  onStatusChange,
  onViewDetails,
  isUnlocked = false,
}: UnifiedCandidateCardProps) {
  const isApplicationCard = Boolean(
    application?.source === "applied" ||
      application?.source === "sourced" ||
      (candidate as any)?.source === "applied" ||
      (candidate as any)?.source === "sourced" ||
      (candidate as any)?.is_application
  );

  const initials = candidate.full_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Card
      className={`flex h-full flex-col rounded-2xl border bg-white p-6 transition-shadow duration-200 hover:shadow-md ${
        isApplicationCard ? "border-orange-300" : "border-gray-200"
      }`}
    >
      <div className="flex gap-4">
        {/* Avatar */}
        <Avatar className="h-16 w-16">
          <AvatarImage src={candidate.profile_image} alt={candidate.full_name} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>

        {/* Content */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-lg truncate">{candidate.full_name}</h3>
              </div>
              {application?.created_at && (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Badge className="rounded-full bg-orange-50 text-orange-700 border border-orange-200" variant="outline">
                    Beworben am {new Date(application.created_at).toLocaleDateString("de-DE")}
                  </Badge>
                  {application.job_title && (
                    <Badge className="rounded-full" variant="secondary">
                      Stelle: {application.job_title}
                    </Badge>
                  )}
                </div>
              )}
              {candidate.bio_short && (
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                  {candidate.bio_short}
                </p>
              )}
            </div>

            {/* Actions */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="shrink-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Aktionen</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {onViewDetails && (
                  <DropdownMenuItem onClick={onViewDetails}>
                    Details ansehen
                  </DropdownMenuItem>
                )}
                {!isUnlocked && onUnlock && (
                  <DropdownMenuItem onClick={onUnlock}>
                    Kandidat freischalten
                  </DropdownMenuItem>
                )}
                {onStatusChange && application && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onStatusChange("interview")}>
                      Zum Gespräch einladen
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onStatusChange("offer")}>
                      Angebot machen
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onStatusChange("hired")}>
                      Einstellen
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onStatusChange("rejected")}>
                      Ablehnen
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Info Grid */}
          <div className="mt-4 grid grid-cols-1 gap-2 text-sm text-muted-foreground">
            {isUnlocked && candidate.email && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0" />
                <span className="truncate">{candidate.email}</span>
              </div>
            )}
            {isUnlocked && candidate.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0" />
                <span className="truncate">{candidate.phone}</span>
              </div>
            )}
            {candidate.city && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 shrink-0" />
                <span className="truncate">
                  {candidate.city}
                  {candidate.country && `, ${candidate.country}`}
                </span>
              </div>
            )}
            {candidate.experience_years !== undefined && (
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 shrink-0" />
                <span>{candidate.experience_years} Jahre Erfahrung</span>
              </div>
            )}
          </div>

          {/* Skills */}
          {candidate.skills && candidate.skills.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {candidate.skills.slice(0, 8).map((skill) => (
                <Badge key={skill} variant="outline" className="rounded-full border-gray-200 bg-gray-50 text-[11px] font-medium text-gray-700">
                  {skill}
                </Badge>
              ))}
              {candidate.skills.length > 8 && (
                <Badge variant="outline" className="rounded-full border-gray-200 bg-gray-50 text-[11px] font-medium text-gray-700">
                  +{candidate.skills.length - 8}
                </Badge>
              )}
            </div>
          )}

          <div className="flex-1" />

          {/* Footer actions */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs text-muted-foreground">
              {isApplicationCard ? "Bewerbung eingegangen" : "Talentsuche"}
            </div>
            <div className="flex items-center gap-2">
              {onViewDetails && (
                <Button size="sm" variant="outline" onClick={onViewDetails}>
                  Profil
                </Button>
              )}
              {!isUnlocked && onUnlock && (
                <Button size="sm" onClick={onUnlock}>
                  Freischalten
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
