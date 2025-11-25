import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { MapPin, Briefcase, GraduationCap, Heart, Coins, Phone, Mail, Download, User, Car, Search, Calendar } from "lucide-react";
import { generatePDF } from "@/lib/pdf-generator";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";


interface Profile {
  id: string;
  vorname: string;
  nachname: string;
  status: string;
  branche: string;
  ort: string;
  plz: string;
  avatar_url?: string;
  headline?: string;
  faehigkeiten?: any;
  email?: string;
  telefon?: string;
  cv_url?: string;
  schule?: string;
  ausbildungsberuf?: string;
  aktueller_beruf?: string;
  layout?: number;
  geburtsdatum?: string;
  berufserfahrung?: any[];
  ausbildung?: any[];
  sprachen?: any[];
  zertifikate?: any[];
  job_search_preferences?: string[];
  has_drivers_license?: boolean;
  driver_license_class?: string;
  available_from?: string | null;
}

interface ProfileCardProps {
  profile: Profile;
  isUnlocked: boolean;
  matchPercentage: number;
  onUnlock: () => void;
  onSave: () => void;
  onPreview: () => void;
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'azubi':
      return <Briefcase className="h-3 w-3" />;
    case 'schueler':
      return <GraduationCap className="h-3 w-3" />;
    case 'ausgelernt':
      return <User className="h-3 w-3" />;
    default:
      return <User className="h-3 w-3" />;
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'azubi':
      return 'Azubi';
    case 'schueler':
      return 'Schüler:in';
    case 'ausgelernt':
      return 'Geselle/in';
    default:
      return status;
  }
};

const getMatchColor = (percentage: number) => {
  if (percentage >= 80) return "bg-green-500";
  if (percentage >= 60) return "bg-yellow-500";
  return "bg-gray-400";
};

const calculateMatchPercentage = (profile: Profile, companySettings?: any) => {
  // Enhanced matching algorithm based on industry, location, skills, and job search preferences
  let score = 0;
  let totalWeight = 0;

  // Industry match (30% weight)
  if (profile.branche && companySettings?.target_industries?.includes(profile.branche)) {
    score += 30;
  }
  totalWeight += 30;

  // Location proximity (25% weight) - simplified
  if (profile.ort && companySettings?.target_locations?.includes(profile.ort)) {
    score += 25;
  }
  totalWeight += 25;

  // Status match (25% weight) - check if user's status matches what company is looking for
  if (profile.status && companySettings?.target_status?.includes(profile.status)) {
    score += 25;
  }
  totalWeight += 25;

  // Skills match (20% weight) - simplified
  if (profile.faehigkeiten && Array.isArray(profile.faehigkeiten) && profile.faehigkeiten.length > 0) {
    score += Math.min(20, profile.faehigkeiten.length * 3);
  }
  totalWeight += 20;

  return Math.round((score / totalWeight) * 100) || 65; // Default fallback
};

export function ProfileCard({ 
  profile, 
  isUnlocked, 
  matchPercentage, 
  onUnlock, 
  onSave, 
  onPreview 
}: ProfileCardProps) {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  
  const displayName = isUnlocked 
    ? `${profile.vorname} ${profile.nachname}`
    : profile.vorname;

  const avatarSrc = isUnlocked ? profile.avatar_url : undefined;

  const topSkills = profile.faehigkeiten && Array.isArray(profile.faehigkeiten) 
    ? profile.faehigkeiten.slice(0, 3) 
    : [];

  const getJobTitle = () => {
    if (profile.status === 'azubi' && profile.ausbildungsberuf) {
      return `${profile.ausbildungsberuf} (Azubi)`;
    }
    if (profile.status === 'schueler' && profile.schule) {
      return `${profile.schule}`;
    }
    if (profile.status === 'ausgelernt' && profile.aktueller_beruf) {
      return profile.aktueller_beruf;
    }
    return profile.headline || profile.branche;
  };

  const formatAvailableFrom = (dateStr: string) => {
    try {
      // Format: YYYY-MM
      const [year, month] = dateStr.split('-');
      const monthNames = [
        'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
        'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
      ];
      const monthIndex = parseInt(month) - 1;
      return `${monthNames[monthIndex]} ${year}`;
    } catch {
      return dateStr;
    }
  };

  const prepareCVData = () => {
    return {
      personalInfo: {
        firstName: profile.vorname || '',
        lastName: profile.nachname || '',
        email: profile.email || '',
        phone: profile.telefon || '',
        location: `${profile.ort}, ${profile.plz}`,
        headline: getJobTitle(),
        summary: profile.headline || `${profile.status} in ${profile.branche}`
      },
      experience: [],
      education: [],
      skills: profile.faehigkeiten ? profile.faehigkeiten.map((skill: any) => skill.name || skill) : [],
      languages: [],
      layout: 'modern'
    };
  };


  const handleDownloadCV = async () => {
    if (!isUnlocked) return;
    setIsGeneratingPDF(true);
    try {
      if (profile.cv_url) {
        // Attempt to generate a signed URL for private storage
        let downloadUrl = profile.cv_url;
        const extractStoragePath = (url: string) => {
          try {
            const marker = '/storage/v1/object/public/';
            const idx = url.indexOf(marker);
            if (idx === -1) return null;
            const after = url.substring(idx + marker.length);
            const [bucket, ...rest] = after.split('/');
            return { bucket, path: rest.join('/') };
          } catch {
            return null;
          }
        };
        const parsed = extractStoragePath(profile.cv_url);
        if (parsed) {
          const { data: signed, error } = await supabase.storage
            .from(parsed.bucket)
            .createSignedUrl(parsed.path, 60);
          if (!error && signed?.signedUrl) {
            downloadUrl = signed.signedUrl;
          }
        }
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `CV_${profile.vorname}_${profile.nachname}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }

      // If no CV exists, generate one (same as profile view does)
      // Check if we have enough data to generate a CV
      if (!profile.vorname || !profile.nachname) {
        console.error('Missing name data for CV generation');
        return;
      }

      // Create temporary container for CV rendering
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.style.top = '0';
      tempContainer.style.backgroundColor = 'white';
      tempContainer.style.width = '210mm';
      tempContainer.style.minHeight = '297mm';
      document.body.appendChild(tempContainer);

      // Import CV layouts dynamically
      const [
        { default: BerlinLayout },
        { default: MuenchenLayout },
        { default: HamburgLayout },
        { default: KoelnLayout },
        { default: FrankfurtLayout },
        { default: DuesseldorfLayout }
      ] = await Promise.all([
        import('@/components/cv-layouts/BerlinLayout'),
        import('@/components/cv-layouts/MuenchenLayout'),
        import('@/components/cv-layouts/HamburgLayout'),
        import('@/components/cv-layouts/KoelnLayout'),
        import('@/components/cv-layouts/FrankfurtLayout'),
        import('@/components/cv-layouts/DuesseldorfLayout')
      ]);

      // Determine layout component
      let LayoutComponent;
      const layoutId = profile.layout || 1;
      
      switch (layoutId) {
        case 1:
          LayoutComponent = BerlinLayout;
          break;
        case 2:
          LayoutComponent = MuenchenLayout;
          break;
        case 3:
          LayoutComponent = HamburgLayout;
          break;
        case 4:
          LayoutComponent = KoelnLayout;
          break;
        case 5:
          LayoutComponent = FrankfurtLayout;
          break;
        case 6:
          LayoutComponent = DuesseldorfLayout;
          break;
        default:
          LayoutComponent = BerlinLayout;
      }

      // Prepare CV data matching the profile structure
      const cvData = {
        vorname: profile.vorname,
        nachname: profile.nachname,
        email: profile.email || '',
        telefon: profile.telefon || '',
        adresse: `${profile.ort}, ${profile.plz}`,
        geburtsdatum: profile.geburtsdatum || '',
        headline: getJobTitle(),
        uebermich: profile.headline || `${profile.status} in ${profile.branche}`,
        berufserfahrung: profile.berufserfahrung || [],
        ausbildung: profile.ausbildung || [],
        faehigkeiten: profile.faehigkeiten || [],
        sprachen: profile.sprachen || [],
        zertifikate: profile.zertifikate || [],
        layout: layoutId
      };

      // Create and render CV element
      const React = await import('react');
      const ReactDOM = await import('react-dom/client');
      
      const cvElement = React.createElement(LayoutComponent, { 
        data: cvData
      });
      const root = ReactDOM.createRoot(tempContainer);
      root.render(cvElement);

      // Wait for rendering
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Find the CV preview element
      const cvPreviewElement = tempContainer.querySelector('[data-cv-preview]') as HTMLElement;
      if (!cvPreviewElement) {
        throw new Error('CV preview element not found');
      }

      // Generate filename and PDF using same logic as profile view
      const { generatePDF, generateCVFilename } = await import('@/lib/pdf-generator');
      const filename = generateCVFilename(profile.vorname, profile.nachname);
      
      // Generate PDF for download
      await generatePDF(cvPreviewElement, {
        filename,
        quality: 2,
        format: 'a4',
        margin: 10
      });

      // Clean up
      document.body.removeChild(tempContainer);
      root.unmount();
    } catch (error) {
      console.error('Error downloading CV:', error);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <TooltipProvider>
      <Card className="group hover:shadow-lg transition-all duration-200 border-0 shadow-sm hover:shadow-md h-[340px] flex flex-col">
        <CardHeader className="pb-3 flex-shrink-0">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3 flex-1 min-w-0">
              <div className="relative flex-shrink-0">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={avatarSrc || ""} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-100 to-blue-200">
                    {isUnlocked ? (
                      `${profile.vorname?.charAt(0)}${profile.nachname?.charAt(0)}`
                    ) : (
                      <User className="h-5 w-5 text-blue-600" />
                    )}
                  </AvatarFallback>
                </Avatar>
                {!isUnlocked && (
                  <div className="absolute -top-1 -right-1 bg-blue-500 text-white rounded-full p-1">
                    <User className="h-3 w-3" />
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-sm sm:text-base truncate">
                    {displayName}
                  </h3>
                  <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${getMatchColor(matchPercentage)} flex-shrink-0`} />
                </div>
                
                <p className="text-xs sm:text-sm text-muted-foreground mb-2 line-clamp-1">
                  {getJobTitle()}
                </p>
                
                {/* Job Search Status - prominently displayed */}
                {profile.job_search_preferences && profile.job_search_preferences.length > 0 && (
                  <div className="flex items-center gap-1 mb-2">
                    <Search className="h-3 w-3 text-blue-600" />
                    <span className="text-xs text-blue-600 font-semibold">
                      Sucht: {profile.job_search_preferences.slice(0, 2).join(', ')}
                      {profile.job_search_preferences.length > 2 && ` +${profile.job_search_preferences.length - 2}`}
                    </span>
                  </div>
                )}
                
                {/* Available From - displayed for both locked and unlocked */}
                {profile.available_from && (
                  <div className="flex items-center gap-1 mb-2">
                    <Calendar className="h-3 w-3 text-emerald-600" />
                    <span className="text-xs text-emerald-600 font-semibold">
                      Verfügbar ab {formatAvailableFrom(profile.available_from)}
                    </span>
                  </div>
                )}
                
                <div className="flex items-center gap-1 sm:gap-2 text-xs text-muted-foreground flex-wrap">
                  <div className="flex items-center gap-1 min-w-0">
                    <MapPin className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">{profile.ort}</span>
                  </div>
                  {profile.has_drivers_license && (
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Car className="h-3 w-3" />
                      <span className="text-xs">{profile.driver_license_class || 'FS'}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {getStatusIcon(profile.status)}
                    <span className="truncate">{getStatusLabel(profile.status)}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="text-right flex-shrink-0 ml-2">
              <div className="text-xs sm:text-sm font-medium text-green-600 mb-1">
                {matchPercentage}% Match
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onSave}
                className="h-6 w-6 sm:h-8 sm:w-8 p-0 opacity-100"
              >
                <Heart className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
      
        <CardContent className="pt-0 flex-1 flex flex-col min-w-0 px-3 sm:px-6">
          {/* Skills - Fixed height area */}
          <div className="mb-4 h-[60px] sm:h-[70px] flex items-start overflow-hidden">
            {topSkills.length > 0 ? (
              <div className="flex flex-wrap gap-1 w-full">
                {topSkills.map((skill: any, index: number) => (
                  <Badge key={index} variant="secondary" className="text-[11px] sm:text-xs truncate max-w-[70px] sm:max-w-[80px] px-1 sm:px-2 py-0.5">
                    {skill.name || skill}
                  </Badge>
                ))}
                {profile.faehigkeiten && profile.faehigkeiten.length > 3 && (
                  <Badge variant="outline" className="text-[11px] sm:text-xs px-1 sm:px-2 py-0.5">
                    +{profile.faehigkeiten.length - 3}
                  </Badge>
                )}
              </div>
            ) : (
              <div className="text-xs text-muted-foreground w-full flex items-center">
                {profile.status === 'schueler' ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="cursor-help">Keine Fähigkeiten angegeben</span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Schüler können keine Fähigkeiten hinzufügen</p>
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  "Keine Fähigkeiten angegeben"
                )}
              </div>
            )}
          </div>

          {/* Action Buttons - Always at same position */}
          <div className="space-y-2 mt-auto">
            {isUnlocked ? (
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  onClick={onPreview}
                  variant="outline" 
                  className="flex-1 text-[11px] sm:text-xs px-1 sm:px-2 h-8"
                >
                  Profil ansehen
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="flex-1 text-[11px] sm:text-xs px-1 sm:px-2 h-8"
                  onClick={handleDownloadCV}
                  disabled={isGeneratingPDF}
                >
                  <Download className="h-3 w-3 mr-1" />
                  <span className="hidden sm:inline">
                    {isGeneratingPDF ? 'Lädt...' : 'CV Downloaden'}
                  </span>
                  <span className="sm:hidden">
                    {isGeneratingPDF ? 'Lädt...' : 'CV'}
                  </span>
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Button 
                  size="sm"
                  onClick={onUnlock}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-[11px] sm:text-xs px-2 h-8"
                >
                  <Coins className="h-3 w-3 mr-1" />
                  <span className="hidden sm:inline">Freischalten (1 Token)</span>
                  <span className="sm:hidden">Freischalten</span>
                </Button>
              </div>
            )}
          </div>

          {/* Contact Info (only when unlocked) */}
          {isUnlocked && (
            <div className="mt-3 pt-3 border-t space-y-1">
              {profile.email && (
                <div className="flex items-center text-[11px] sm:text-xs min-w-0">
                  <Mail className="h-3 w-3 mr-2 text-muted-foreground flex-shrink-0" />
                  <span className="truncate">{profile.email}</span>
                </div>
              )}
              {profile.telefon && (
                <div className="flex items-center text-[11px] sm:text-xs">
                  <Phone className="h-3 w-3 mr-2 text-muted-foreground flex-shrink-0" />
                  <span className="truncate">{profile.telefon}</span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}