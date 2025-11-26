import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, MapPin, AlertCircle, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/hooks/useCompany';
import { toast } from 'sonner';
import { LocationCard } from './LocationCard';
import { AddLocationModal } from './AddLocationModal';
import { getMaxLocations, canAddLocation } from '@/lib/billing-v2/gating';
import type { PlanKey } from '@/lib/billing-v2/plans';
import type { CompanyLocation } from './types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface LocationsManagerProps {
  onUpgradeClick?: () => void;
}

export function LocationsManager({ onUpgradeClick }: LocationsManagerProps) {
  const { company } = useCompany();
  const queryClient = useQueryClient();
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editLocation, setEditLocation] = useState<CompanyLocation | null>(null);
  const [deleteLocation, setDeleteLocation] = useState<CompanyLocation | null>(null);

  const companyId = company?.id;
  const currentPlan = (company?.active_plan_id || company?.plan_type || 'free') as PlanKey;
  const maxLocations = getMaxLocations(currentPlan);

  // Fetch locations - with fallback from companies table if no locations exist
  const { data: locations = [], isLoading } = useQuery({
    queryKey: ['company-locations', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      
      const { data, error } = await supabase
        .from('company_locations')
        .select('*')
        .eq('company_id', companyId)
        .eq('is_active', true)
        .order('is_primary', { ascending: false })
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      // If no locations exist, try to create one from company data
      if (!data || data.length === 0) {
        // Fetch company data for fallback
        const { data: companyData } = await supabase
          .from('companies')
          .select('street, house_number, postal_code, city, location')
          .eq('id', companyId)
          .single();
        
        if (companyData && (companyData.city || companyData.location)) {
          // Get coordinates from postal_codes table
          let lat: number | null = null;
          let lon: number | null = null;
          
          if (companyData.postal_code) {
            const { data: plzData } = await supabase
              .from('postal_codes')
              .select('lat, lon')
              .eq('plz', companyData.postal_code)
              .single();
            
            if (plzData) {
              lat = plzData.lat;
              lon = plzData.lon;
            }
          }
          
          // Create the primary location from company data
          const { data: newLocation, error: insertError } = await supabase
            .from('company_locations')
            .insert({
              company_id: companyId,
              name: 'Hauptstandort',
              street: companyData.street || null,
              house_number: companyData.house_number || null,
              postal_code: companyData.postal_code || '',
              city: companyData.city || companyData.location || '',
              country: 'Deutschland',
              is_primary: true,
              is_active: true,
              lat,
              lon,
            })
            .select()
            .single();
          
          if (!insertError && newLocation) {
            return [newLocation] as CompanyLocation[];
          }
        }
      }
      
      return (data || []) as CompanyLocation[];
    },
    enabled: !!companyId,
  });

  const currentCount = locations.length;
  const canAdd = canAddLocation(currentPlan, currentCount);
  const isAtLimit = currentCount >= maxLocations;

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (locationId: string) => {
      const { error } = await supabase
        .from('company_locations')
        .update({ is_active: false })
        .eq('id', locationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-locations', companyId] });
      toast.success('Standort wurde entfernt');
      setDeleteLocation(null);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Fehler beim Löschen');
    },
  });

  // Set primary mutation
  const setPrimaryMutation = useMutation({
    mutationFn: async (locationId: string) => {
      const { error } = await supabase
        .from('company_locations')
        .update({ is_primary: true })
        .eq('id', locationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-locations', companyId] });
      toast.success('Hauptstandort wurde aktualisiert');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Fehler beim Aktualisieren');
    },
  });

  const handleAddClick = () => {
    if (!canAdd) {
      if (onUpgradeClick) {
        onUpgradeClick();
      } else {
        toast.error(`Sie haben das Limit von ${maxLocations} Standort${maxLocations === 1 ? '' : 'en'} erreicht. Upgraden Sie Ihren Plan für mehr Standorte.`);
      }
      return;
    }
    setEditLocation(null);
    setIsAddModalOpen(true);
  };

  const handleEdit = (location: CompanyLocation) => {
    setEditLocation(location);
    setIsAddModalOpen(true);
  };

  const handleDelete = (location: CompanyLocation) => {
    setDeleteLocation(location);
  };

  const confirmDelete = () => {
    if (deleteLocation) {
      deleteMutation.mutate(deleteLocation.id);
    }
  };

  const handleSetPrimary = (location: CompanyLocation) => {
    setPrimaryMutation.mutate(location.id);
  };

  const handleModalSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['company-locations', companyId] });
    toast.success(editLocation ? 'Standort aktualisiert' : 'Standort hinzugefügt');
  };

  if (!companyId) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
            <Building2 className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-light text-gray-900">Standorte</h2>
            <p className="text-sm text-gray-500">
              Verwalten Sie Ihre Unternehmensstandorte
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Usage Badge */}
          <Badge 
            variant="outline" 
            className={`px-3 py-1.5 text-sm rounded-full ${
              isAtLimit 
                ? 'border-amber-300 bg-amber-50 text-amber-700' 
                : 'border-gray-200 bg-gray-50 text-gray-600'
            }`}
          >
            <MapPin className="w-3.5 h-3.5 mr-1.5" />
            {currentCount} / {maxLocations === 999999 ? '∞' : maxLocations}
          </Badge>

          {/* Add Button */}
          <Button
            onClick={handleAddClick}
            className={`rounded-xl px-5 h-11 ${
              canAdd 
                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
            disabled={!canAdd && !onUpgradeClick}
          >
            <Plus className="w-4 h-4 mr-2" />
            Standort hinzufügen
          </Button>
        </div>
      </div>

      {/* Upgrade Hint */}
      {isAtLimit && currentPlan !== 'enterprise' && (
        <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-amber-800">
              Sie haben das Standort-Limit Ihres Plans erreicht.
              {onUpgradeClick && (
                <button 
                  onClick={onUpgradeClick}
                  className="ml-1 font-medium text-amber-900 underline hover:no-underline"
                >
                  Jetzt upgraden
                </button>
              )}
            </p>
          </div>
        </div>
      )}

      {/* Locations Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-32 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : locations.length === 0 ? (
        <Card className="border-dashed border-2 border-gray-200 bg-gray-50/50 rounded-2xl">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
              <MapPin className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Noch keine Standorte
            </h3>
            <p className="text-gray-500 text-center mb-6 max-w-sm">
              Fügen Sie Ihren ersten Unternehmensstandort hinzu, um ihn in Stellenanzeigen verwenden zu können.
            </p>
            <Button
              onClick={handleAddClick}
              className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Ersten Standort hinzufügen
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {locations.map((location) => (
            <LocationCard
              key={location.id}
              location={location}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onSetPrimary={handleSetPrimary}
              canDelete={locations.length > 1}
            />
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <AddLocationModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        companyId={companyId}
        editLocation={editLocation}
        onSuccess={handleModalSuccess}
        isFirstLocation={locations.length === 0}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteLocation} onOpenChange={() => setDeleteLocation(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Standort entfernen?</AlertDialogTitle>
            <AlertDialogDescription>
              Möchten Sie den Standort "{deleteLocation?.name || deleteLocation?.city}" wirklich entfernen? 
              Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Abbrechen</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="rounded-xl bg-red-600 hover:bg-red-700"
            >
              Entfernen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

