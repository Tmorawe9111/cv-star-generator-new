import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import MatchingProfilePage from "@/pages/Company/MatchingProfile";

export default function CompanySettingsMatchingTargets() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="p-6 md:p-8">
        <div className="max-w-6xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => navigate("/unternehmen/einstellungen/produkte")}
            className="-ml-2 mb-4 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zurück zu Produkteinstellungen
          </Button>
        </div>
      </div>
      <MatchingProfilePage />
    </div>
  );
}


