import { useNavigate } from "react-router-dom";
import { ArrowLeft, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChangePasswordCard } from "@/components/settings/ChangePasswordCard";

export default function CompanySettingsSecurity() {
  const navigate = useNavigate();

  return (
    <div className="p-6 md:p-8 min-h-screen bg-gray-50/50">
      <div className="max-w-3xl mx-auto space-y-6">
        <Button
          variant="ghost"
          onClick={() => navigate("/unternehmen/einstellungen")}
          className="-ml-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Zurück zu Einstellungen
        </Button>

        <header className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center">
              <Shield className="h-5 w-5 text-slate-700" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Passwort & Sicherheit</h1>
              <p className="text-muted-foreground">Verwalten Sie Ihr Login‑Passwort.</p>
            </div>
          </div>
        </header>

        <ChangePasswordCard
          title="Passwort ändern"
          description="Ändern oder setzen Sie Ihr Passwort. Wenn Sie bisher per Magic‑Link eingeloggt waren, können Sie das aktuelle Passwort leer lassen."
        />
      </div>
    </div>
  );
}


