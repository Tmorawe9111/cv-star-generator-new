import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Plus, Trash2, Star, AlertCircle } from "lucide-react";
import { LocationAutocomplete } from "@/components/Company/LocationAutocomplete";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

interface AdminLocationManagerProps {
  companyId: string;
}

interface Location {
  id: string;
  company_id: string;
  street: string | null;
  house_number: string | null;
  postal_code: string;
  city: string;
  country: string;
  is_primary: boolean;
  lat: number | null;
  lon: number | null;
  created_at: string;
}

export function AdminLocationManager({ companyId }: AdminLocationManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [deletingLocationId, setDeletingLocationId] = useState<string | null>(null);
  const [newLocation, setNewLocation] = useState({
    street: "",
    house_number: "",
    postal_code: "",
    city: "",
    country: "DE",
  });

  // Fetch active plan to get max_locations limit
  const { data: activePlan } = useQuery({
    queryKey: ["active-company-plan", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc("get_active_company_plan", { p_company_id: companyId });
      
      // If no plan is assigned, that's okay - we'll use default limits
      if (error && error.code !== 'PGRST116') {
        console.warn("Error fetching active plan:", error);
      }
      return data?.[0] || null;
    },
  });

  // Fetch all locations
  const { data: locations, isLoading } = useQuery({
    queryKey: ["company-locations", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("company_locations")
        .select("*")
        .eq("company_id", companyId)
        .order("is_primary", { ascending: false })
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as Location[];
    },
  });

  // If no plan is assigned, allow at least 1 location (free plan default)
  const maxLocations = activePlan?.locations ?? 1;
  const currentLocationCount = locations?.length || 0;
  const canAddMore = maxLocations === null || maxLocations === -1 || currentLocationCount < maxLocations;

  const setPrimaryMutation = useMutation({
    mutationFn: async (locationId: string) => {
      // First, unset all primary locations
      await supabase
        .from("company_locations")
        .update({ is_primary: false })
        .eq("company_id", companyId);

      // Then set the new primary
      const { error } = await supabase
        .from("company_locations")
        .update({ is_primary: true })
        .eq("id", locationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-locations", companyId] });
      queryClient.invalidateQueries({ queryKey: ["company-users"] });
      window.dispatchEvent(new CustomEvent('company-data-updated', { detail: { companyId } }));
      toast({ title: "Erfolg", description: "Hauptstandort erfolgreich gesetzt" });
    },
    onError: (error: Error) => {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (locationId: string) => {
      const location = locations?.find((l) => l.id === locationId);
      if (location?.is_primary && locations && locations.length > 1) {
        throw new Error("Hauptstandort kann nicht gelöscht werden. Setzen Sie zuerst einen anderen Standort als Hauptstandort.");
      }

      const { error } = await supabase
        .from("company_locations")
        .delete()
        .eq("id", locationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-locations", companyId] });
      queryClient.invalidateQueries({ queryKey: ["company-users"] });
      window.dispatchEvent(new CustomEvent('company-data-updated', { detail: { companyId } }));
      toast({ title: "Erfolg", description: "Standort erfolgreich gelöscht" });
      setDeletingLocationId(null);
    },
    onError: (error: Error) => {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
    },
  });

  const handleAddLocation = async () => {
    if (!newLocation.postal_code || !newLocation.city) {
      toast({
        title: "Fehler",
        description: "PLZ und Stadt sind erforderlich",
        variant: "destructive",
      });
      return;
    }

    try {
      // Get coordinates from postal_codes or geocode
      const { data: coords, error: coordsError } = await supabase.rpc('get_location_coordinates', {
        p_postal_code: newLocation.postal_code,
        p_city: newLocation.city,
        p_country_code: newLocation.country
      });

      let lat: number | null = null;
      let lon: number | null = null;

      if (!coordsError && coords && coords.length > 0 && coords[0].latitude && coords[0].longitude) {
        lat = coords[0].latitude;
        lon = coords[0].longitude;
      }

      // Check if this is the first location (should be primary)
      const isFirstLocation = currentLocationCount === 0;

      // Insert directly into company_locations
      const { data: insertedLocation, error: insertError } = await supabase
        .from("company_locations")
        .insert({
          company_id: companyId,
          street: newLocation.street || null,
          house_number: newLocation.house_number || null,
          postal_code: newLocation.postal_code,
          city: newLocation.city,
          country: newLocation.country === "DE" ? "Deutschland" : newLocation.country,
          is_primary: isFirstLocation,
          lat: lat,
          lon: lon,
        })
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      queryClient.invalidateQueries({ queryKey: ["company-locations", companyId] });
      // Force company data refresh
      queryClient.invalidateQueries({ queryKey: ["company-users"] });
      window.dispatchEvent(new CustomEvent('company-data-updated', { detail: { companyId } }));
      toast({ title: "Erfolg", description: "Standort erfolgreich hinzugefügt" });
      setNewLocation({
        street: "",
        house_number: "",
        postal_code: "",
        city: "",
        country: "DE",
      });
    } catch (error: any) {
      toast({
        title: "Fehler",
        description: error.message || "Standort konnte nicht hinzugefügt werden",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Standorte
              </CardTitle>
              <CardDescription>
                {currentLocationCount} / {maxLocations === null || maxLocations === -1 ? "∞" : maxLocations} Standorte verwendet
                {!activePlan && " (Standard: Free Plan Limit)"}
              </CardDescription>
            </div>
            {!canAddMore && (
              <Badge variant="destructive" className="gap-1">
                <AlertCircle className="h-3 w-3" />
                Limit erreicht
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Existing Locations */}
          {locations && locations.length > 0 ? (
            <div className="space-y-3">
              {locations.map((location) => (
                <div
                  key={location.id}
                  className={`p-4 rounded-lg border ${
                    location.is_primary ? "bg-primary/5 border-primary" : "bg-muted/30"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {location.is_primary && (
                          <Badge variant="default" className="gap-1">
                            <Star className="h-3 w-3" />
                            Hauptstandort
                          </Badge>
                        )}
                        <h4 className="font-semibold">
                          {location.street && location.house_number
                            ? `${location.street} ${location.house_number}`
                            : location.street || ""}
                        </h4>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {location.postal_code} {location.city}
                        {location.country && `, ${location.country}`}
                      </p>
                      {location.lat && location.lon && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Koordinaten: {location.lat.toFixed(4)}, {location.lon.toFixed(4)}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {!location.is_primary && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPrimaryMutation.mutate(location.id)}
                        >
                          <Star className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeletingLocationId(location.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium mb-2">Keine Standorte vorhanden</p>
              <p className="text-sm">
                {canAddMore 
                  ? "Fügen Sie den ersten Standort hinzu, um zu beginnen."
                  : "Das Standort-Limit wurde erreicht."}
              </p>
            </div>
          )}

          {/* Add New Location */}
          {canAddMore && (
            <div className="pt-4 border-t space-y-4">
              <h4 className="font-medium">Neuen Standort hinzufügen</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="street">Straße (optional)</Label>
                  <Input
                    id="street"
                    value={newLocation.street}
                    onChange={(e) => setNewLocation({ ...newLocation, street: e.target.value })}
                    placeholder="z.B. Musterstraße"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="house_number">Hausnummer (optional)</Label>
                  <Input
                    id="house_number"
                    value={newLocation.house_number}
                    onChange={(e) => setNewLocation({ ...newLocation, house_number: e.target.value })}
                    placeholder="z.B. 24"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="country">Land</Label>
                  <Select
                    value={newLocation.country}
                    onValueChange={(value) => setNewLocation({ ...newLocation, country: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DE">Deutschland</SelectItem>
                      <SelectItem value="AT">Österreich</SelectItem>
                      <SelectItem value="CH">Schweiz</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">PLZ & Stadt *</Label>
                  <LocationAutocomplete
                    value={newLocation.postal_code && newLocation.city 
                      ? `${newLocation.postal_code} ${newLocation.city}` 
                      : ""}
                    onChange={(value) => {
                      const parts = value.split(" ");
                      const postalCode = parts[0] || "";
                      const city = parts.slice(1).join(" ") || "";
                      setNewLocation({ ...newLocation, postal_code: postalCode, city });
                    }}
                    placeholder="z.B. 10115 Berlin"
                    country={newLocation.country}
                  />
                </div>
              </div>
              <Button onClick={handleAddLocation} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Standort hinzufügen
              </Button>
            </div>
          )}

          {!canAddMore && (
            <div className="pt-4 border-t">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <AlertCircle className="h-4 w-4" />
                <span>
                  Das Limit von {maxLocations} Standort{maxLocations === 1 ? "" : "en"} wurde erreicht.
                  Upgraden Sie den Plan für mehr Standorte.
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={deletingLocationId !== null} onOpenChange={(open) => !open && setDeletingLocationId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Standort löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Möchten Sie diesen Standort wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingLocationId && deleteMutation.mutate(deletingLocationId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

