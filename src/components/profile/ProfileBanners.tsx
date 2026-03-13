import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lock, CheckCircle2, UserCheck, Clock, Loader2 } from "lucide-react";

export interface ProfileBannersProps {
  applications: Array<{ id: string; created_at?: string; job_posts?: { title?: string } }>;
  isUnlocked: boolean;
  candidateWorksForCompany: boolean;
  interestRequestStatus: "none" | "pending" | "accepted" | "rejected";
  creatingInterestRequest: boolean;
  onUnlockClick: () => void;
  onCreateInterestRequest: () => void;
}

export function ProfileBanners({
  applications,
  isUnlocked,
  candidateWorksForCompany,
  interestRequestStatus,
  creatingInterestRequest,
  onUnlockClick,
  onCreateInterestRequest,
}: ProfileBannersProps) {
  return (
    <>
      {applications.length > 0 && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          <div>
            <p className="font-medium text-green-900">
              Hat sich beworben auf: {applications[0].job_posts?.title || "Ihre Stelle"}
            </p>
            <p className="text-sm text-green-700">
              Bewerbung vom{" "}
              {applications[0].created_at
                ? new Date(applications[0].created_at).toLocaleDateString("de-DE")
                : ""}
            </p>
          </div>
        </div>
      )}

      {candidateWorksForCompany && !isUnlocked && (
        <div className="mb-6 p-6 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <UserCheck className="h-6 w-6 text-blue-600 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-blue-900">
                  {interestRequestStatus === "pending"
                    ? "Interesse-Anfrage ausstehend"
                    : "Interesse bekunden"}
                </h3>
                <p className="text-sm text-blue-700">
                  {interestRequestStatus === "pending"
                    ? "Der Kandidat wurde benachrichtigt. Nach Bestätigung werden 3 Tokens abgebucht und das Profil freigeschaltet."
                    : "Bekunden Sie Interesse an diesem Kandidaten. Nach Bestätigung werden 3 Tokens abgebucht und das Profil freigeschaltet."}
                </p>
              </div>
            </div>
            {interestRequestStatus === "pending" ? (
              <Badge variant="secondary" className="flex-shrink-0">
                <Clock className="h-4 w-4 mr-2" />
                Ausstehend
              </Badge>
            ) : (
              <Button
                onClick={onCreateInterestRequest}
                size="lg"
                className="flex-shrink-0"
                disabled={creatingInterestRequest}
              >
                {creatingInterestRequest ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Wird gesendet...
                  </>
                ) : (
                  <>
                    <UserCheck className="h-4 w-4 mr-2" />
                    Interesse bekunden
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      )}

      {!isUnlocked && !candidateWorksForCompany && (
        <div className="mb-6 p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Lock className="h-6 w-6 text-yellow-600 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-yellow-900">Profil nicht freigeschaltet</h3>
                <p className="text-sm text-yellow-700">
                  Schalten Sie das Profil frei, um vollständige Kontaktdaten und Dokumente zu sehen
                </p>
              </div>
            </div>
            <Button onClick={onUnlockClick} size="lg" className="flex-shrink-0">
              <Lock className="h-4 w-4 mr-2" />
              Profil freischalten
            </Button>
          </div>
        </div>
      )}

      {candidateWorksForCompany && !isUnlocked && (
        <div className="mb-6 p-6 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-3">
            <Lock className="h-6 w-6 text-blue-600 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-blue-900">Kontaktdaten und Lebenslauf verborgen</h3>
              <p className="text-sm text-blue-700">
                Um Kontaktdaten und Lebenslauf zu sehen, bekunden Sie Ihr Interesse. Der Mitarbeiter
                wird benachrichtigt und kann Ihr Interesse bestätigen.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
