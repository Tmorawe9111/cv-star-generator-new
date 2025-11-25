import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { MapPin, Users, Plus, X, Mail } from 'lucide-react';
import { LocationAutocomplete } from '@/components/Company/LocationAutocomplete';
import { useCompanyId } from '@/hooks/useCompanyId';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { PLANS } from '@/lib/billing-v2/plans';
import type { OnboardingData } from '../AppleOnboardingWizard';

interface Location {
  id?: string;
  name: string;
  city: string;
  postalCode: string;
  radius: number;
}

interface TeamMember {
  email: string;
}

interface Step3LocationsTeamProps {
  data: OnboardingData;
  onUpdate: (data: Partial<OnboardingData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function Step3LocationsTeam({ data, onUpdate, onNext, onBack }: Step3LocationsTeamProps) {
  const companyId = useCompanyId();
  const { toast } = useToast();
  
  const [locations, setLocations] = useState<Location[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [newLocation, setNewLocation] = useState({ name: '', city: '', postalCode: '', radius: 50 });
  const [newTeamEmail, setNewTeamEmail] = useState('');
  const [saving, setSaving] = useState(false);

  // Get plan limits
  const plan = PLANS[data.selectedPlan];
  const maxLocations = data.selectedPlan === 'free' ? 1 : 
                       data.selectedPlan === 'basic' ? 3 :
                       data.selectedPlan === 'growth' ? 5 :
                       data.selectedPlan === 'bevisiblle' ? 15 : Infinity;
  const maxSeats = plan.seatsIncluded;

  // Load existing locations and team members
  useEffect(() => {
    const loadData = async () => {
      if (!companyId) return;

      // Load locations
      const { data: locationsData } = await supabase
        .from('company_locations')
        .select('id, name, city, postal_code, search_radius_km')
        .eq('company_id', companyId);

      if (locationsData) {
        setLocations(locationsData.map(loc => ({
          id: loc.id,
          name: loc.name || '',
          city: loc.city || '',
          postalCode: loc.postal_code || '',
          radius: loc.search_radius_km || 50,
        })));
      }

      // Load team members (excluding current user)
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: teamData } = await supabase
          .from('company_users')
          .select('user_id, profiles!inner(email)')
          .eq('company_id', companyId)
          .neq('user_id', user.id);

        if (teamData) {
          setTeamMembers(teamData.map(m => ({
            email: (m.profiles as any)?.email || '',
          })));
        }
      }
    };

    loadData();
  }, [companyId]);

  const addLocation = () => {
    if (!newLocation.name.trim() || !newLocation.city.trim()) {
      toast({
        title: 'Fehler',
        description: 'Bitte füllen Sie Name und Stadt aus.',
        variant: 'destructive',
      });
      return;
    }

    if (locations.length >= maxLocations) {
      toast({
        title: 'Limit erreicht',
        description: `Sie können maximal ${maxLocations} Standorte hinzufügen.`,
        variant: 'destructive',
      });
      return;
    }

    setLocations([...locations, { ...newLocation }]);
    setNewLocation({ name: '', city: '', postalCode: '', radius: 50 });
  };

  const removeLocation = (index: number) => {
    setLocations(locations.filter((_, i) => i !== index));
  };

  const addTeamMember = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newTeamEmail)) {
      toast({
        title: 'Ungültige E-Mail',
        description: 'Bitte geben Sie eine gültige E-Mail-Adresse ein.',
        variant: 'destructive',
      });
      return;
    }

    if (teamMembers.length >= maxSeats - 1) { // -1 because current user is already counted
      toast({
        title: 'Limit erreicht',
        description: `Sie können maximal ${maxSeats - 1} weitere Team-Mitglieder hinzufügen.`,
        variant: 'destructive',
      });
      return;
    }

    if (teamMembers.some(m => m.email === newTeamEmail)) {
      toast({
        title: 'Bereits hinzugefügt',
        description: 'Diese E-Mail-Adresse wurde bereits hinzugefügt.',
        variant: 'destructive',
      });
      return;
    }

    setTeamMembers([...teamMembers, { email: newTeamEmail }]);
    setNewTeamEmail('');
  };

  const removeTeamMember = (index: number) => {
    setTeamMembers(teamMembers.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!companyId) return;

    setSaving(true);
    try {
      // Save locations
      for (const location of locations) {
        if (location.id) {
          // Update existing
          await supabase
            .from('company_locations')
            .update({
              name: location.name,
              city: location.city,
              postal_code: location.postalCode || null,
              search_radius_km: location.radius,
            })
            .eq('id', location.id);
        } else {
          // Create new
          await supabase
            .from('company_locations')
            .insert({
              company_id: companyId,
              name: location.name,
              city: location.city,
              postal_code: location.postalCode || null,
              search_radius_km: location.radius,
            });
        }
      }

      // Save team members (invite them)
      for (const member of teamMembers) {
        // Check if user exists
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', member.email)
          .maybeSingle();

        if (profile) {
          // User exists, add to company_users
          await supabase
            .from('company_users')
            .upsert({
              company_id: companyId,
              user_id: profile.id,
              role: 'member',
            }, {
              onConflict: 'company_id,user_id',
            });
        }
        // TODO: Send invitation email for non-existing users
      }

      toast({
        title: 'Gespeichert',
        description: 'Standorte und Team-Mitglieder wurden erfolgreich gespeichert.',
      });

      onNext();
    } catch (error: any) {
      console.error('Error saving locations/team:', error);
      toast({
        title: 'Fehler',
        description: 'Daten konnten nicht gespeichert werden.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  // Don't show this step for free plan
  if (data.selectedPlan === 'free') {
    return null;
  }

  return (
    <div className="flex flex-col h-full space-y-8 overflow-hidden">
      {/* Header */}
      <div className="text-center space-y-3 flex-shrink-0">
        <h2 className="text-3xl font-light text-gray-900 tracking-tight">
          Standorte & Team
        </h2>
        <p className="text-lg text-gray-600 leading-relaxed">
          Fügen Sie weitere Standorte und Team-Mitglieder hinzu
        </p>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 pr-2">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Locations Section */}
        <Card className="p-8 space-y-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold">Standorte</h3>
            </div>
            <div className="text-sm text-gray-500">
              {locations.length} / {maxLocations === Infinity ? '∞' : maxLocations}
            </div>
          </div>

          {/* Existing Locations */}
          <div className="space-y-2">
            {locations.map((location, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div>
                  <p className="font-medium">{location.name}</p>
                  <p className="text-sm text-gray-500">
                    {location.postalCode} {location.city}
                    {location.radius ? ` • ${location.radius} km` : ''}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeLocation(index)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>

          {/* Add Location Form */}
          {locations.length < maxLocations && (
            <div className="space-y-4 pt-4 border-t">
              <div className="space-y-2">
                <Label>Standortname</Label>
                <Input
                  placeholder="z. B. Frankfurt"
                  value={newLocation.name}
                  onChange={(e) => setNewLocation({ ...newLocation, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Ort & PLZ</Label>
                <LocationAutocomplete
                  value={newLocation.postalCode && newLocation.city ? `${newLocation.postalCode} ${newLocation.city}` : newLocation.city}
                  onChange={(value) => {
                    const parts = value.split(' ');
                    if (parts.length >= 2 && /^\d{5}$/.test(parts[0])) {
                      setNewLocation({
                        ...newLocation,
                        postalCode: parts[0],
                        city: parts.slice(1).join(' '),
                      });
                    } else {
                      setNewLocation({ ...newLocation, city: value, postalCode: '' });
                    }
                  }}
                  placeholder="z. B. 60311 Frankfurt"
                />
              </div>
              <div className="space-y-2">
                <Label>Suchradius (km)</Label>
                <Input
                  type="number"
                  min={10}
                  max={100}
                  value={newLocation.radius}
                  onChange={(e) => setNewLocation({ ...newLocation, radius: Number(e.target.value) || 50 })}
                />
              </div>
              <Button onClick={addLocation} variant="outline" className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Standort hinzufügen
              </Button>
            </div>
          )}
        </Card>

        {/* Team Members Section */}
        <Card className="p-8 space-y-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold">Team-Mitglieder</h3>
            </div>
            <div className="text-sm text-gray-500">
              {teamMembers.length + 1} / {maxSeats === Infinity ? '∞' : maxSeats}
            </div>
          </div>

          {/* Existing Team Members */}
          <div className="space-y-2">
            {teamMembers.map((member, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <p className="text-sm">{member.email}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeTeamMember(index)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>

          {/* Add Team Member Form */}
          {teamMembers.length < maxSeats - 1 && (
            <div className="space-y-4 pt-4 border-t">
              <div className="space-y-2">
                <Label>E-Mail-Adresse</Label>
                <Input
                  type="email"
                  placeholder="kollege@unternehmen.de"
                  value={newTeamEmail}
                  onChange={(e) => setNewTeamEmail(e.target.value)}
                />
              </div>
              <Button onClick={addTeamMember} variant="outline" className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Team-Mitglied hinzufügen
              </Button>
            </div>
          )}
        </Card>
        </div>
      </div>

      {/* Navigation - Always visible at bottom */}
      <div className="flex-shrink-0 flex items-center justify-between pt-4 border-t border-gray-200">
        <Button variant="ghost" onClick={onBack} disabled={saving}>
          Zurück
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Wird gespeichert...' : 'Weiter'}
        </Button>
      </div>
    </div>
  );
}

