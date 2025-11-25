import React from "react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MapPin, Briefcase } from "lucide-react";
import { useCompany } from "@/hooks/useCompany";
import { useNavigate } from "react-router-dom";

function firstWords(text?: string | null, n: number = 40) {
  if (!text) return null;
  const words = text.trim().split(/\s+/);
  const slice = words.slice(0, n).join(" ");
  return words.length > n ? `${slice}…` : slice;
}

const CompanyFeedLeft: React.FC = () => {
  const { company } = useCompany();
  const navigate = useNavigate();

  const initials = company?.name ? company.name.slice(0, 2).toUpperCase() : "CO";
  const desc = firstWords(company?.description, 24);

  return (
    <div className="company-feed-left space-y-4">
      {/* Profilkarte */}
      <Card className="p-0 overflow-hidden">
        <div className="relative">
          <img
            src={company?.header_image || "/images/step1-hero.jpg"}
            alt="Unternehmens Titelbild"
            className="h-24 w-full object-cover"
            loading="lazy"
          />
          <div className="absolute -bottom-7 left-5">
            <Avatar className="h-16 w-16 ring-2 ring-background shadow">
              <AvatarImage src={company?.logo_url || undefined} alt={company?.name || "Unternehmen"} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
          </div>
        </div>

        <div className="px-5 pt-10 pb-5">
          <div className="min-w-0">
            <h2 className="text-xl font-semibold leading-tight truncate">{company?.name ?? "Ihr Unternehmen"}</h2>
            {desc && <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{desc}</p>}
            {(company?.main_location || company?.industry) && (
              <div className="mt-1 text-sm text-muted-foreground flex items-center gap-1.5">
                <MapPin className="h-4 w-4" aria-hidden />
                <span>
                  {company?.main_location || "—"}
                  {company?.industry && " • "}
                  {company?.industry}
                </span>
              </div>
            )}
          </div>

          <div className="mt-4 flex items-center gap-2">
            <Button variant="link" className="px-0" onClick={() => navigate("/company/profile")}>Zum Profil</Button>
          </div>
        </div>
      </Card>

      {/* Schnellaktionen */}
      <Card className="p-5">
        <h3 className="text-sm font-medium mb-3">Schnellaktionen</h3>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" onClick={() => navigate("/company/unlocked")}>Best Matches</Button>
          <Button size="sm" variant="outline" onClick={() => navigate("/company/search")}>Kandidatenprofile</Button>
        </div>
      </Card>

      {/* Hinweise / Shortcuts */}
      <Card className="p-5">
        <h3 className="text-sm font-medium mb-3">Schnellzugriff</h3>
        <div className="flex flex-col gap-2">
          <Button size="sm" variant="ghost" className="justify-start" onClick={() => navigate("/unternehmen/startseite")}>
            <Briefcase className="h-4 w-4 mr-2" /> Dashboard
          </Button>
          <Button size="sm" variant="ghost" className="justify-start" onClick={() => navigate("/company/settings")}>
            Einstellungen
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default CompanyFeedLeft;
