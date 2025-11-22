import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getLocationUsage, getPlanLimits } from "@/lib/companyLimits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { useCompany } from "@/hooks/useCompany";

type CompanyLocation = {
  id: string;
  name: string;
  city: string | null;
  postal_code: string | null;
  search_radius_km: number;
  is_active: boolean;
};

export default function SettingsLocations() {
  const { company, loading: companyLoading } = useCompany();
  const [locations, setLocations] = useState<CompanyLocation[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [radius, setRadius] = useState(50);
  const [usedLocations, setUsedLocations] = useState(0);

  const planLimits = company
    ? getPlanLimits(company as any)
    : { maxLocations: 0, maxSeats: 0 };
  const atLimit = company ? usedLocations >= planLimits.maxLocations : true;

  useEffect(() => {
    if (!company) return;
    (async () => {
      setLoading(true);
      const [{ data, error }, used] = await Promise.all([
        supabase
          .from("company_locations")
          .select("id, name, city, postal_code, search_radius_km, is_active")
          .eq("company_id", company.id)
          .order("created_at", { ascending: true }),
        getLocationUsage(company.id),
      ]);

      if (error) {
        console.error("Error loading locations", error);
      } else {
        setLocations((data || []) as CompanyLocation[]);
      }
      setUsedLocations(used);
      setLoading(false);
    })();
  }, [company]);

  const handleCreate = async () => {
    if (!company) return;
    if (!name.trim()) return;
    setSaving(true);
    const { data, error } = await supabase
      .from("company_locations")
      .insert({
        company_id: company.id,
        name: name.trim(),
        city: city || null,
        postal_code: postalCode || null,
        search_radius_km: Math.min(Math.max(radius, 10), 100),
      })
      .select("id, name, city, postal_code, search_radius_km, is_active")
      .single();

    if (error) {
      console.error("Error creating location", error);
    } else if (data) {
      setLocations((prev) => [...prev, data as CompanyLocation]);
      setUsedLocations((v) => v + 1);
      setName("");
      setCity("");
      setPostalCode("");
      setRadius(50);
    }
    setSaving(false);
  };

  const toggleActive = async (loc: CompanyLocation) => {
    const { error } = await supabase
      .from("company_locations")
      .update({ is_active: !loc.is_active })
      .eq("id", loc.id);

    if (error) {
      console.error("Error updating location", error);
      return;
    }
    setLocations((prev) =>
      prev.map((l) => (l.id === loc.id ? { ...l, is_active: !l.is_active } : l)),
    );
  };

  if (companyLoading) {
    return <div className="p-6">Lade Unternehmensdaten …</div>;
  }

  if (!company) {
    return <div className="p-6">Kein Unternehmen gefunden.</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Standorte</h1>
        <p className="text-sm text-muted-foreground">
          Verwalte deine Standorte und den Suchradius für Kandidaten.
        </p>
      </div>

      <Card className="p-4 flex items-center justify-between">
        <div>
          <div className="text-sm font-medium">Standort-Limit</div>
          <div className="text-sm text-muted-foreground">
            {usedLocations} /{" "}
            {planLimits.maxLocations === Infinity
              ? "unbegrenzt"
              : planLimits.maxLocations}
          </div>
        </div>
        <Button disabled={atLimit} onClick={handleCreate} variant="outline">
          Neuen Standort anlegen
        </Button>
      </Card>

      {!atLimit && (
        <Card className="p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Name</Label>
              <Input
                placeholder="z.B. Frankfurt"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <Label>Stadt</Label>
              <Input
                placeholder="Stadt"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>
            <div>
              <Label>PLZ</Label>
              <Input
                placeholder="z.B. 60311"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Label>Suchradius (km)</Label>
              <Input
                type="number"
                min={10}
                max={100}
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value) || 50)}
              />
              <p className="text-xs text-muted-foreground">
                Mindestens 10 km, maximal 100 km.
              </p>
            </div>
            <Button onClick={handleCreate} disabled={saving || !name.trim()}>
              Standort speichern
            </Button>
          </div>
        </Card>
      )}

      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-medium">Bestehende Standorte</div>
          {loading && (
            <div className="text-xs text-muted-foreground">Lade …</div>
          )}
        </div>
        <div className="space-y-2">
          {locations.map((loc) => (
            <div
              key={loc.id}
              className="flex items-center justify-between border rounded-md px-3 py-2 text-sm"
            >
              <div>
                <div className="font-medium">{loc.name}</div>
                <div className="text-xs text-muted-foreground">
                  {loc.postal_code ? `${loc.postal_code} ` : ""}
                  {loc.city || ""}
                  {loc.search_radius_km
                    ? ` • Radius ${loc.search_radius_km} km`
                    : null}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {loc.is_active ? "Aktiv" : "Inaktiv"}
                </span>
                <Switch
                  checked={loc.is_active}
                  onCheckedChange={() => toggleActive(loc)}
                />
              </div>
            </div>
          ))}
          {!locations.length && !loading && (
            <div className="text-xs text-muted-foreground">
              Noch keine Standorte angelegt.
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}


