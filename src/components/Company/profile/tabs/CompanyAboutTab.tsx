import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Globe, Users, MapPin, Edit2, Mail, Phone, User, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { CompanyValuesSection } from "@/components/Company/profile/CompanyValuesSection";

// Component to display company locations
function CompanyLocationsCard({ companyId, fallbackLocation }: { companyId: string; fallbackLocation?: string | null }) {
  const { data: locations = [] } = useQuery({
    queryKey: ['company-locations-public', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('company_locations')
        .select('id, name, street, house_number, postal_code, city, country, is_primary')
        .eq('company_id', companyId)
        .eq('is_active', true)
        .order('is_primary', { ascending: false })
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading company locations:', error);
        return [];
      }
      return data || [];
    },
    enabled: !!companyId,
  });

  const formatAddress = (loc: any) => {
    const parts = [];
    if (loc.street) {
      parts.push(`${loc.street}${loc.house_number ? ` ${loc.house_number}` : ''}`);
    }
    if (loc.postal_code || loc.city) {
      parts.push(`${loc.postal_code || ''} ${loc.city || ''}`.trim());
    }
    if (loc.country && loc.country !== 'Deutschland') {
      parts.push(loc.country);
    }
    return parts.join(', ') || loc.name || 'Unbekannt';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Standorte
        </CardTitle>
      </CardHeader>
      <CardContent>
        {locations.length > 0 ? (
          <div className="space-y-3">
            {locations.map((loc: any) => (
              <div key={loc.id} className="flex items-start gap-2">
                {loc.is_primary && (
                  <Badge variant="secondary" className="text-xs px-1.5 py-0.5 flex-shrink-0">
                    <Star className="w-3 h-3 mr-1 fill-current" />
                    Hauptsitz
                  </Badge>
                )}
                <div className="flex-1">
                  {loc.name && loc.name !== 'Hauptstandort' && (
                    <div className="font-medium text-sm">{loc.name}</div>
                  )}
                  <div className="text-sm text-muted-foreground">{formatAddress(loc)}</div>
                </div>
              </div>
            ))}
          </div>
        ) : fallbackLocation ? (
          <div className="font-medium">{fallbackLocation}</div>
        ) : (
          <p className="text-sm text-muted-foreground">Kein Standort angegeben</p>
        )}
      </CardContent>
    </Card>
  );
}

interface CompanyAboutTabProps {
  company: {
    id: string;
    name: string;
    description?: string | null;
    website_url?: string | null;
    employee_count?: number | null;
    size_range?: string | null;
    main_location?: string | null;
    industry?: string | null;
    target_groups?: string[] | null;
    contact_person?: string | null;
    contact_email?: string | null;
    contact_phone?: string | null;
    contact_position?: string | null;
  };
  isOwner?: boolean;
  onSave?: (data: { description?: string; website_url?: string }) => void;
}

export function CompanyAboutTab({ company, isOwner, onSave }: CompanyAboutTabProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [description, setDescription] = useState(company.description || '');
  const [website, setWebsite] = useState(company.website_url || '');

  const handleSave = () => {
    onSave?.({ description, website_url: website });
    setIsEditing(false);
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
      {/* Full Description */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Über uns</CardTitle>
            {isOwner && (
              <Button 
                size="sm" 
                variant={isEditing ? "default" : "outline"}
                onClick={() => isEditing ? handleSave() : setIsEditing(true)}
              >
                {isEditing ? (
                  'Speichern'
                ) : (
                  <>
                    <Edit2 className="h-4 w-4 mr-2" />
                    Bearbeiten
                  </>
                )}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <Textarea 
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={10}
              placeholder="Erzählen Sie mehr über Ihr Unternehmen..."
              className="resize-none"
            />
          ) : (
            <p className="whitespace-pre-line text-muted-foreground">
              {company.description || 'Dieses Unternehmen hat noch keine Beschreibung hinzugefügt.'}
            </p>
          )}
        </CardContent>
      </Card>
      
      {/* Info Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Webseite */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Webseite</CardTitle>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <Input 
                value={website} 
                onChange={e => setWebsite(e.target.value)}
                placeholder="https://beispiel.de"
              />
            ) : company.website_url ? (
              <a 
                href={company.website_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline flex items-center gap-2"
              >
                <Globe className="h-4 w-4" />
                {company.website_url}
              </a>
            ) : (
              <p className="text-sm text-muted-foreground">Keine Webseite angegeben</p>
            )}
          </CardContent>
        </Card>
        
        {/* Branche & Zielgruppen */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Branche & Zielgruppen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {company.industry && (
                <div>
                  <span className="text-sm font-medium">Branche: </span>
                  <span className="text-sm text-muted-foreground">{company.industry}</span>
                </div>
              )}
              {company.target_groups && company.target_groups.length > 0 && (
                <div>
                  <span className="text-sm font-medium">Zielgruppen: </span>
                  <span className="text-sm text-muted-foreground">{company.target_groups.join(', ')}</span>
                </div>
              )}
              {!company.industry && (!company.target_groups || company.target_groups.length === 0) && (
                <p className="text-sm text-muted-foreground">Noch nicht angegeben</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Locations & Employees Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Mitarbeiteranzahl */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5" />
              Mitarbeiter
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {company.employee_count || company.size_range || 'Nicht angegeben'}
            </div>
          </CardContent>
        </Card>
        
        {/* Standorte */}
        <CompanyLocationsCard companyId={company.id} fallbackLocation={company.main_location} />
      </div>
      
      {/* Company Values Section */}
      <CompanyValuesSection companyId={company.id} />
      
      {/* Contact Person Card */}
      {(company.contact_person || company.contact_email) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5" />
              Ansprechperson
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {company.contact_person && (
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                  <User className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{company.contact_person}</p>
                  {company.contact_position && (
                    <p className="text-xs text-muted-foreground">{company.contact_position}</p>
                  )}
                </div>
              </div>
            )}
            <div className="space-y-2 pl-13">
              {company.contact_email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <a 
                    href={`mailto:${company.contact_email}`}
                    className="text-primary hover:underline"
                  >
                    {company.contact_email}
                  </a>
                </div>
              )}
              {company.contact_phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <a 
                    href={`tel:${company.contact_phone}`}
                    className="text-primary hover:underline"
                  >
                    {company.contact_phone}
                  </a>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
