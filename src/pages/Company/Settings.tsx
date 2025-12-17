import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { useCompany } from "@/hooks/useCompany";
import {
  Bell,
  Building2,
  ChevronRight,
  MapPin,
  Plug,
  Shield,
  SlidersHorizontal,
  Users,
} from "lucide-react";

export default function CompanySettings() {
  const navigate = useNavigate();
  const { company, loading } = useCompany();

  const companyName = useMemo(() => company?.name || "Unternehmen", [company?.name]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        Kein Unternehmen gefunden.
      </div>
    );
  }

  const Row = ({
    icon,
    title,
    description,
    onClick,
  }: {
    icon: React.ReactNode;
    title: string;
    description?: string;
    onClick: () => void;
  }) => (
    <button
      type="button"
      onClick={onClick}
      className="w-full px-4 py-4 text-left transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary/20"
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm font-semibold text-slate-900">{title}</p>
            <ChevronRight className="h-4 w-4 text-slate-400" />
          </div>
          {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
        </div>
      </div>
    </button>
  );

  return (
    <div className="p-6 md:p-8 min-h-screen bg-gray-50/50">
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold text-slate-900">Einstellungen</h1>
          <p className="text-muted-foreground">
            Verwalten Sie Produkteinstellungen, Team, Integrationen und Sicherheit.
          </p>
        </header>

        <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <Row
            icon={<SlidersHorizontal className="h-5 w-5" />}
            title="Produkteinstellungen"
            description="Branche, Zielgruppen, Werteprofil, allgemeine Fragen und Matching‑Targets."
            onClick={() => navigate("/unternehmen/einstellungen/produkte")}
          />
        </Card>

        <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <Row
            icon={<Building2 className="h-5 w-5" />}
            title="Unternehmensprofil bearbeiten"
            description={`Profil, Kontakte, Branding – sichtbar für Talente. (${companyName})`}
            onClick={() => navigate("/unternehmen/profil")}
          />
          <div className="h-px bg-slate-100" />
          <Row
            icon={<MapPin className="h-5 w-5" />}
            title="Standorte verwalten"
            description="Standorte hinzufügen, Hauptstandort setzen, Limits einsehen."
            onClick={() => navigate("/unternehmen/einstellungen/standorte")}
          />
          <div className="h-px bg-slate-100" />
          <Row
            icon={<Users className="h-5 w-5" />}
            title="Team & Sitze"
            description="Teammitglieder einladen, Rollen verwalten und Sitz‑Limits einsehen."
            onClick={() => navigate("/unternehmen/einstellungen/team")}
          />
        </Card>

        <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <Row
            icon={<Bell className="h-5 w-5" />}
            title="Benachrichtigungen"
            description="E‑Mail Einstellungen für Matches, Tokens und Team‑Änderungen."
            onClick={() => navigate("/unternehmen/einstellungen/benachrichtigungen")}
          />
          <div className="h-px bg-slate-100" />
          <Row
            icon={<Plug className="h-5 w-5" />}
            title="Integrationen"
            description="Kalender‑Integrationen und weitere Tools (Google, Microsoft, Calendly …)."
            onClick={() => navigate("/unternehmen/einstellungen/integrationen")}
          />
        </Card>

        <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <Row
            icon={<Shield className="h-5 w-5" />}
            title="Passwort & Sicherheit"
            description="Passwort ändern oder setzen."
            onClick={() => navigate("/unternehmen/einstellungen/sicherheit")}
          />
        </Card>
      </div>
    </div>
  );
}