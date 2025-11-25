import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CVPreviewCard } from '@/components/CVPreviewCard';
import { WeitereDokumenteSection } from '@/components/linkedin/right-rail/WeitereDokumenteSection';
import WeitereDokumenteWidget from '@/components/profile/WeitereDokumenteWidget';
import { AvailabilityCard } from '@/components/linkedin/right-rail/AvailabilityCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Award, Languages, Edit3 } from 'lucide-react';

interface LinkedInProfileSidebarProps {
  profile: any;
  isEditing?: boolean;
  onProfileUpdate?: (updates: any) => void;
  readOnly?: boolean;
  showLanguagesAndSkills?: boolean;
  showLicenseAndStats?: boolean;
  showCVSection?: boolean;
  onEditingChange?: (isEditing: boolean) => void;
}

export function LinkedInProfileSidebar({
  profile,
  isEditing,
  onProfileUpdate,
  readOnly = false,
  showLanguagesAndSkills = true,
  showLicenseAndStats = true,
  showCVSection = true,
  onEditingChange
}: LinkedInProfileSidebarProps) {
  const [isDocumentWidgetOpen, setIsDocumentWidgetOpen] = useState(false);
  const [documentUpdateTrigger, setDocumentUpdateTrigger] = useState(0);

  const handleDocumentUploaded = () => {
    // Trigger reload of documents section
    setDocumentUpdateTrigger(prev => prev + 1);
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* CV Download Section - First */}
      {showCVSection && profile && (
        <CVPreviewCard
          profile={profile}
          readOnly={readOnly}
          onDownload={() => {
            const params = new URLSearchParams({
              layout: String(profile.layout || 1),
              userId: profile.id
            });
            window.open(`/cv/print?${params.toString()}`, '_blank');
          }}
        />
      )}

      {/* Weitere Dokumente Section - Second (only for own profile) */}
      {!readOnly && (
        <WeitereDokumenteSection
          userId={profile?.id}
          readOnly={readOnly}
          openWidget={() => setIsDocumentWidgetOpen(true)}
          refreshTrigger={documentUpdateTrigger}
        />
      )}

      {/* Skills Section - After Ads */}
      {showLanguagesAndSkills && (
        <Card>
          <CardHeader className="pb-2 sm:pb-3 px-4 sm:px-4 pt-4 sm:pt-4 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-lg sm:text-lg font-semibold flex items-center gap-2">
              <Award className="h-4 w-4 sm:h-5 sm:w-5" />
              Fähigkeiten
            </CardTitle>
            {!readOnly && !isEditing && onEditingChange && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => onEditingChange(true)}
                className="h-8 w-8 p-0"
              >
                <Edit3 className="h-4 w-4" />
              </Button>
            )}
          </CardHeader>
          <CardContent className="px-4 sm:px-4 pb-4 sm:pb-4">
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {profile?.faehigkeiten && Array.isArray(profile.faehigkeiten) && profile.faehigkeiten.length > 0 ? (
                profile.faehigkeiten.map((skill: string, idx: number) => (
                  <Badge key={idx} variant="secondary" className="text-xs">
                    {typeof skill === 'string' ? skill : (skill as any)?.name || String(skill)}
                  </Badge>
                ))
              ) : (
                <p className="text-muted-foreground text-sm">Keine Fähigkeiten hinzugefügt</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Languages Section - After Skills */}
      {showLanguagesAndSkills && (
        <Card>
          <CardHeader className="pb-2 sm:pb-3 px-4 sm:px-4 pt-4 sm:pt-4 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-lg sm:text-lg font-semibold flex items-center gap-2">
              <Languages className="h-4 w-4 sm:h-5 sm:w-5" />
              Sprachen
            </CardTitle>
            {!readOnly && !isEditing && onEditingChange && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => onEditingChange(true)}
                className="h-8 w-8 p-0"
              >
                <Edit3 className="h-4 w-4" />
              </Button>
            )}
          </CardHeader>
          <CardContent className="px-4 sm:px-4 pb-4 sm:pb-4">
            <div className="space-y-1.5 sm:space-y-2">
              {profile?.sprachen && Array.isArray(profile.sprachen) && profile.sprachen.length > 0 ? (
                profile.sprachen.map((lang: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center text-sm">
                    <span className="font-medium">{lang.sprache || lang}</span>
                    {lang.niveau && (
                      <Badge variant="outline" className="text-xs">{lang.niveau}</Badge>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-sm">Keine Sprachen hinzugefügt</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Availability Section - After Languages */}
      <AvailabilityCard 
        availableFrom={profile?.available_from} 
        visibilityMode={profile?.visibility_mode}
        jobSearchPreferences={profile?.job_search_preferences}
        profileStatus={profile?.status}
        profileId={profile?.id}
        readOnly={readOnly}
        onUpdate={onProfileUpdate}
      />

      {/* Weitere Dokumente Widget Modal */}
      <WeitereDokumenteWidget
        isOpen={isDocumentWidgetOpen}
        onClose={() => setIsDocumentWidgetOpen(false)}
        userId={profile?.id}
        onDocumentUploaded={handleDocumentUploaded}
      />
    </div>
  );
}

export default LinkedInProfileSidebar;
