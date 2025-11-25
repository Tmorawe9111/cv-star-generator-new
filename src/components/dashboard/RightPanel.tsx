import React from "react";
import { RightRailAd } from "@/components/linkedin/right-rail/RightRailAd";
import { InterestingPeople } from "@/components/recommendations/InterestingPeople";
import { InterestingCompanies } from "@/components/recommendations/InterestingCompanies";
import { InterestingJobs } from "@/components/recommendations/InterestingJobs";
import NonAkademikerPlusAd from "@/components/notifications/NonAkademikerPlusAd";

export const RightPanel: React.FC = () => {
  return (
    <aside aria-label="Widgets" className="flex flex-col">
      {/* Oberer Teil: scrollt mit bis "Interessante Personen für dich" */}
      <div className="space-y-4">
        <RightRailAd variant="card" size="sm" />
        <NonAkademikerPlusAd />
        <InterestingJobs />
        <InterestingPeople />
      </div>
      
      {/* Unterer Teil: wird sticky nach "Interessante Personen für dich" */}
      <div className="sticky top-12 md:top-14 space-y-4 mt-4">
        <InterestingCompanies />
        <RightRailAd variant="banner" size="sm" />
        
        {/* Footer mit Links */}
        <div className="pt-4 pb-2 space-y-3 text-xs text-muted-foreground">
          <div className="flex flex-wrap gap-x-3 gap-y-2">
            <a href="/impressum" className="hover:text-primary transition-colors">
              Impressum
            </a>
            <span>·</span>
            <a href="/datenschutz" className="hover:text-primary transition-colors">
              Datenschutz & AGB
            </a>
            <span>·</span>
            <a href="/settings" className="hover:text-primary transition-colors">
              Einstellungen
            </a>
          </div>
          
          <p className="text-xs">
            © 2025 BeVisiblle. Alle Rechte vorbehalten.
          </p>
        </div>
      </div>
    </aside>
  );
};

export default RightPanel;
