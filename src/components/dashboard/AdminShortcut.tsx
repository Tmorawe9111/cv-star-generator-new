import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function AdminShortcut() {
  return (
    <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <CardContent className="space-y-4 p-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">Adminbereich</p>
          <h3 className="text-lg font-semibold text-slate-900">
            Sitze, Rollen & Standorte verwalten
          </h3>
          <p className="text-sm text-muted-foreground">
            Steuern Sie, wer Zugriff auf welche Standorte hat, laden Sie Teammitglieder ein und
            behalten Sie Berechtigungen im Griff.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="border-primary/30 text-primary">
            3 Sitze belegt
          </Badge>
          <Badge variant="outline">2 Standorte aktiv</Badge>
        </div>
        <div className="flex gap-2">
          <Button className="rounded-full">Adminbereich öffnen</Button>
          <Button variant="outline" className="rounded-full">
            Standorte zuweisen
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
