import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Mail, Phone, User } from "lucide-react";
import { CompanyJobsCarousel } from "../CompanyJobsCarousel";
import { CompanyPeopleCarousel } from "../CompanyPeopleCarousel";
import { CompanyLatestPosts } from "../CompanyLatestPosts";
import { CompanyLocationsCard } from "../CompanyLocationsCard";

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
    <div className="max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-8 space-y-4 sm:space-y-6">
      {/* About Preview Card */}
      <Card className="p-2 sm:p-3 md:p-4">
        <CardHeader className="p-2 sm:p-3 md:p-4 pb-2 sm:pb-3 md:pb-4">
          <CardTitle className="text-base sm:text-lg">Über {company.name}</CardTitle>
        </CardHeader>
        <CardContent className="p-2 sm:p-3 md:p-4 pt-0 space-y-3 sm:space-y-4">
          <p className="line-clamp-3 text-xs sm:text-sm text-muted-foreground">
            {company.description || 'Dieses Unternehmen hat noch keine Beschreibung hinzugefügt.'}
          </p>
          <Button variant="link" className="p-0 h-auto text-xs sm:text-sm" asChild>
            <Link to={`?tab=about`}>Mehr anzeigen →</Link>
          </Button>

          {/* Contact Person */}
          {(company.contact_person || company.contact_email) && (
            <div className="pt-3 sm:pt-4 border-t border-gray-200">
              <h3 className="text-xs sm:text-sm font-semibold text-gray-900 mb-2 sm:mb-3">Ansprechperson</h3>
              <div className="space-y-1.5 sm:space-y-2">
                {company.contact_person && (
                  <div className="flex items-center gap-2 text-xs sm:text-sm">
                    <User className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                    <span className="font-medium">{company.contact_person}</span>
                    {company.contact_position && (
                      <span className="text-muted-foreground">• {company.contact_position}</span>
                    )}
                  </div>
                )}
                {company.contact_email && (
                  <div className="flex items-center gap-2 text-xs sm:text-sm">
                    <Mail className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                    <a 
                      href={`mailto:${company.contact_email}`}
                      className="text-primary hover:underline"
                    >
                      {company.contact_email}
                    </a>
                  </div>
                )}
                {company.contact_phone && (
                  <div className="flex items-center gap-2 text-xs sm:text-sm">
                    <Phone className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
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
      
      {/* Locations Card */}
      <CompanyLocationsCard companyId={company.id} isOwner={isOwner} />

      {/* Two Column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
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
