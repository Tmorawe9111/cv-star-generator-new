import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Mail, Phone, User, MapPin } from "lucide-react";
import { CompanyJobsCarousel } from "../CompanyJobsCarousel";
import { CompanyPeopleCarousel } from "../CompanyPeopleCarousel";
import { CompanyLatestPosts } from "../CompanyLatestPosts";

interface CompanyHomeTabProps {
  company: {
    id: string;
    name: string;
    description?: string | null;
    contact_person?: string | null;
    contact_email?: string | null;
    contact_phone?: string | null;
    contact_position?: string | null;
    street?: string | null;
    house_number?: string | null;
    postal_code?: string | null;
    city?: string | null;
    country?: string | null;
  };
  isOwner?: boolean;
  onAddPerson?: () => void;
}

export function CompanyHomeTab({ company, isOwner, onAddPerson }: CompanyHomeTabProps) {
  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
      {/* About Preview Card */}
      <Card>
        <CardHeader>
          <CardTitle>Über {company.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="line-clamp-3 text-muted-foreground">
            {company.description || 'Dieses Unternehmen hat noch keine Beschreibung hinzugefügt.'}
          </p>
          <Button variant="link" className="p-0 h-auto mt-2" asChild>
            <Link to={`?tab=about`}>Mehr anzeigen →</Link>
          </Button>
          
          {/* Location */}
          {(company.street || company.city) && (
            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Standort</h3>
              <div className="flex items-start gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div>
                  {company.street && (
                    <div>{company.street}{company.house_number ? ` ${company.house_number}` : ''}</div>
                  )}
                  {(company.postal_code || company.city) && (
                    <div>{company.postal_code} {company.city}</div>
                  )}
                  {company.country && <div>{company.country}</div>}
                </div>
              </div>
            </div>
          )}

          {/* Contact Person */}
          {(company.contact_person || company.contact_email) && (
            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Ansprechperson</h3>
              <div className="space-y-2">
                {company.contact_person && (
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="font-medium">{company.contact_person}</span>
                    {company.contact_position && (
                      <span className="text-muted-foreground">• {company.contact_position}</span>
                    )}
                  </div>
                )}
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
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Two Column Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Latest Jobs Card (Carousel) */}
        <CompanyJobsCarousel companyId={company.id} isOwner={isOwner} />
        
        {/* Team Members Card (Carousel) */}
        <CompanyPeopleCarousel 
          companyId={company.id} 
          isOwner={isOwner}
          onAddPerson={onAddPerson}
        />
      </div>
      
      {/* Latest Posts (Horizontal Scroll) */}
      <CompanyLatestPosts companyId={company.id} />
    </div>
  );
}
