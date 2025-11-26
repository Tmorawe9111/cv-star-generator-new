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
      <div className="relative w-full md:rounded-t-3xl">
        <div className="relative h-32 sm:h-48 w-full overflow-hidden md:rounded-t-3xl md:h-64 lg:h-80">
          <img 
            src={company.header_image || "/placeholder.svg"} 
            alt={`${company.name} Cover`}
            className="h-full w-full object-cover"
          />
          {isOwner && onCoverUpload && (
            <Button 
              variant="secondary" 
              size="sm"
              className="absolute right-2 top-2 sm:right-4 sm:top-4 text-xs sm:text-sm"
              onClick={onCoverUpload}
            >
              <Camera className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Cover ändern</span>
              <span className="sm:hidden">Ändern</span>
            </Button>
          )}
        </div>

        <div className="absolute left-1/2 bottom-0 z-10 flex -translate-x-1/2 translate-y-1/2 flex-col items-center">
          <div className="relative">
            <div className="flex h-20 w-20 sm:h-28 sm:w-28 md:h-36 md:w-36 items-center justify-center rounded-full border-2 sm:border-4 border-white bg-white shadow-xl">
              <Avatar className="h-16 w-16 sm:h-24 sm:w-24 md:h-28 md:w-28">
                <AvatarImage src={company.logo_url || undefined} className="object-contain" />
                <AvatarFallback className="text-xl sm:text-2xl md:text-3xl font-semibold text-muted-foreground">
                  {company.name[0]}
                </AvatarFallback>
              </Avatar>
            </div>
            {isOwner && onLogoUpload && (
              <Button 
                variant="secondary" 
                size="icon"
                className="absolute -bottom-1 -right-1 sm:-bottom-2 sm:-right-2 rounded-full h-7 w-7 sm:h-10 sm:w-10 shadow-md"
                onClick={onLogoUpload}
              >
                <Camera className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Logo & Info Section */}
      <div className="max-w-6xl mx-auto px-3 sm:px-6 pb-6 sm:pb-12 pt-14 sm:pt-20 md:pt-24">
        <div className="flex flex-col items-center text-center">
           
          {/* Company Name */}
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">
            {company.name}
          </h1>
          
          {/* Tagline / Summary */}
          <p className="mt-1 sm:mt-2 max-w-2xl text-sm sm:text-base text-muted-foreground px-2">
            {company.description?.slice(0, 150) || "Innovative Lösungen für die Zukunft"}
          </p>
          
          {/* Location & Industry */}
          <div className="mt-2 sm:mt-4 flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
            {company.main_location && (
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3 sm:h-4 sm:w-4" />
                {company.main_location}
              </div>
            )}
            {company.industry && (
              <div className="flex items-center gap-1">
                <Building2 className="h-3 w-3 sm:h-4 sm:w-4" />
                {company.industry}
              </div>
            )}
          </div>
          
          {/* Follow Button (for non-owners) */}
          {!isOwner && onFollow && (
            <Button onClick={onFollow} className="mt-3 sm:mt-4" size="sm" variant={isFollowing ? 'secondary' : 'default'}>
              {isFollowing ? (
                'Gefolgt'
              ) : (
                <>
                  <Plus className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
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
