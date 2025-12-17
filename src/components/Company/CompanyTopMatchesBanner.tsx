import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

interface CompanyTopMatchesBannerProps {
  count: number;
}

export function CompanyTopMatchesBanner({ count }: CompanyTopMatchesBannerProps) {
  if (count === 0) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className="flex-shrink-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 space-y-2">
          <h3 className="text-lg font-semibold text-slate-900">
            Top-Matches warten auf Sie
          </h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            Sie haben aktuell <span className="font-semibold text-slate-900">{count}</span>{" "}
            {count === 1 ? "Kandidat:in" : "Kandidat:innen"} mit über 80 % Match, die noch nicht freigeschaltet sind.{" "}
            Schalten Sie gezielt die besten Profile frei und bauen Sie Ihre Pipeline auf.
          </p>
        </div>

        {/* CTA Button */}
        <div className="flex-shrink-0">
          <Button
            asChild
            className="whitespace-nowrap"
          >
            <Link to="/unternehmen/matching">
              Zu den Matches
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

