import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plug, Calendar, Mail, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
// IMPORTANT: case-sensitive path for Linux/Vercel
import { CalendarIntegrationSettings } from "@/components/Company/CalendarIntegrationSettings";

export default function CompanySettingsIntegrations() {
  const navigate = useNavigate();

  return (
    <div className="p-6 md:p-8 min-h-screen bg-gray-50/50">
      <div className="max-w-4xl mx-auto space-y-6">
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
              <Plug className="h-5 w-5 text-slate-700" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Integrationen</h1>
              <p className="text-muted-foreground">Kalender‑Anbindung und zukünftige Integrationen.</p>
            </div>
          </div>
        </header>

        <CalendarIntegrationSettings />

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Google Calendar
                </span>
                <Badge variant="secondary">Coming soon</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              OAuth‑Setup pro Unternehmen, automatische Termine & Meet‑Links.
            </CardContent>
          </Card>
          <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Microsoft / Teams
                </span>
                <Badge variant="secondary">Coming soon</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Outlook Kalender + Teams Meeting Links automatisch generieren.
            </CardContent>
          </Card>
          <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Video className="h-4 w-4" />
                  Calendly
                </span>
                <Badge variant="secondary">Coming soon</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Slots synchronisieren, Einladungen automatisch versenden.
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}


