import { Button } from "@/components/ui/button";
import { ArrowLeft, ChevronRight, UserCheck, Clock } from "lucide-react";

export interface ProfileViewNavProps {
  backPath: string;
  backLabel: string;
  displayName: string;
  isUnlocked: boolean;
  followStatus: "none" | "pending" | "accepted";
  following: boolean;
  onBack: () => void;
  onFollow: () => void;
}

export function ProfileViewNav({
  backPath,
  backLabel,
  displayName,
  isUnlocked,
  followStatus,
  following,
  onBack,
  onFollow,
}: ProfileViewNavProps) {
  return (
    <>
      <nav className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
        >
          {backLabel}
        </button>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground font-medium">{displayName}</span>
      </nav>
    </>
  );
}

export function ProfileViewHeader({
  backPath,
  backLabel,
  isUnlocked,
  followStatus,
  following,
  onBack,
  onFollow,
}: Omit<ProfileViewNavProps, "displayName">) {
  return (
    <div className="flex items-center justify-between mb-6">
      <Button variant="ghost" onClick={onBack} className="gap-2">
        <ArrowLeft className="h-4 w-4" />
        Zurück zu {backLabel}
      </Button>
      {isUnlocked && (
        <Button
          variant={followStatus === "accepted" ? "secondary" : "outline"}
          onClick={onFollow}
          disabled={following || followStatus === "pending"}
          className="gap-2"
        >
          {followStatus === "pending" ? (
            <><Clock className="h-4 w-4" />Ausstehend</>
          ) : followStatus === "accepted" ? (
            <><UserCheck className="h-4 w-4" />Gefolgt</>
          ) : (
            <><UserCheck className="h-4 w-4" />Folgen</>
          )}
        </Button>
      )}
    </div>
  );
}
