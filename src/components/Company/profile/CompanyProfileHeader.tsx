import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MapPin, Building2, Camera, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface CompanyProfileHeaderProps {
  company: {
    id: string;
    name: string;
    logo_url?: string | null;
    header_image?: string | null;
    description?: string | null;
    main_location?: string | null;
    industry?: string | null;
  };
  isOwner: boolean;
  isFollowing?: boolean;
  onFollow?: () => void;
  onCoverUpload?: () => void;
  onLogoUpload?: () => void;
}

export function CompanyProfileHeader({ 
  company, 
  isOwner, 
  isFollowing = false,
  onFollow,
  onCoverUpload,
  onLogoUpload
}: CompanyProfileHeaderProps) {
  return (
    <div className="flex flex-col">
      {/* Cover Image */}
      <div className="relative w-full rounded-t-3xl">
        <div className="relative h-48 w-full overflow-hidden rounded-t-3xl md:h-64 lg:h-80">
          <img 
            src={company.header_image || "/placeholder.svg"} 
            alt={`${company.name} Cover`}
            className="h-full w-full object-cover"
          />
          {isOwner && onCoverUpload && (
            <Button 
              variant="secondary" 
              size="sm"
              className="absolute right-4 top-4"
              onClick={onCoverUpload}
            >
              <Camera className="mr-2 h-4 w-4" />
              Cover ändern
            </Button>
          )}
        </div>

        <div className="absolute left-1/2 bottom-0 z-10 flex -translate-x-1/2 translate-y-1/2 flex-col items-center">
          <div className="relative">
            <div className="flex h-36 w-36 items-center justify-center rounded-full border-4 border-white bg-white shadow-xl">
              <Avatar className="h-28 w-28">
                <AvatarImage src={company.logo_url || undefined} className="object-contain" />
                <AvatarFallback className="text-3xl font-semibold text-muted-foreground">
                  {company.name[0]}
                </AvatarFallback>
              </Avatar>
            </div>
            {isOwner && onLogoUpload && (
              <Button 
                variant="secondary" 
                size="icon"
                className="absolute -bottom-2 -right-2 rounded-full h-10 w-10 shadow-md"
                onClick={onLogoUpload}
              >
                <Camera className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Logo & Info Section */}
      <div className="max-w-6xl mx-auto px-6 pb-12 pt-24">
        <div className="flex flex-col items-center text-center">
           
          {/* Company Name */}
          <h1 className="text-3xl font-bold">
            {company.name}
          </h1>
          
          {/* Tagline / Summary */}
          <p className="mt-2 max-w-2xl text-muted-foreground">
            {company.description?.slice(0, 150) || "Innovative Lösungen für die Zukunft"}
          </p>
          
          {/* Location & Industry */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
            {company.main_location && (
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {company.main_location}
              </div>
            )}
            {company.industry && (
              <div className="flex items-center gap-1">
                <Building2 className="h-4 w-4" />
                {company.industry}
              </div>
            )}
          </div>
          
          {/* Follow Button (for non-owners) */}
          {!isOwner && onFollow && (
            <Button onClick={onFollow} className="mt-4" variant={isFollowing ? 'secondary' : 'default'}>
              {isFollowing ? (
                'Gefolgt'
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Folgen
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
