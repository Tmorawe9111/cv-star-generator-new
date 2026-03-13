import { Button } from "@/components/ui/button";
import { ArrowLeft, Lock, UserCheck, Clock } from "lucide-react";

export interface ProfileHeaderProps {
  backPath: string;
  backLabel: string;
  displayName: string;
  isUnlocked: boolean;
  followStatus: "none" | "pending" | "accepted";
  following: boolean;
  onBack: () => void;
  onFollow: () => void;
  onUnlock: () => void;
}

export function ProfileHeader({
  backPath,
  backLabel,
  displayName,
  isUnlocked,
  followStatus,
  following,
  onBack,
  onFollow,
  onUnlock,
}: ProfileHeaderProps) {
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
            <>
              <Clock className="h-4 w-4" />
              Ausstehend
            </>
          ) : followStatus === "accepted" ? (
            <>
              <UserCheck className="h-4 w-4" />
              Gefolgt
            </>
          ) : (
            <>
              <UserCheck className="h-4 w-4" />
              Folgen
            </>
          )}
        </Button>
      )}
    </div>
  );
}
