import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useDebounce } from '@/hooks/useDebounce';
import { useIsMobile } from '@/hooks/useIsMobile';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Check, Clock, Download, LayoutGrid, Mail, Phone, MapPin, Car, Pencil, ChevronRight, Eye } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { LinkedInProfileHeader } from '@/components/linkedin/LinkedInProfileHeader';
import { LinkedInProfileMain } from '@/components/linkedin/LinkedInProfileMain';
import { LinkedInProfileSidebar } from '@/components/linkedin/LinkedInProfileSidebar';
import { LinkedInProfileExperience } from '@/components/linkedin/LinkedInProfileExperience';
import { LinkedInProfileEducation } from '@/components/linkedin/LinkedInProfileEducation';
import { LinkedInProfileActivity } from '@/components/linkedin/LinkedInProfileActivity';
import { RightRailAd } from '@/components/linkedin/right-rail/RightRailAd';
import { PeopleRecommendations } from '@/components/linkedin/right-rail/PeopleRecommendations';
import { CompanyRecommendations } from '@/components/linkedin/right-rail/CompanyRecommendations';
import { ProfilePreviewModal } from '@/components/ProfilePreviewModal';
import { SkillsLanguagesSidebar } from '@/components/linkedin/SkillsLanguagesSidebar';
import { AvailabilityCard } from '@/components/linkedin/right-rail/AvailabilityCard';
import { ValuesAndInterviewCard } from '@/components/linkedin/right-rail/ValuesAndInterviewCard';
import { CVLayoutSelectorDialog } from '@/components/CVLayoutSelectorDialog';
import { generatePDFFromCV } from '@/lib/pdf-generator';
import { openVisibilityPrompt } from '@/lib/event-bus';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { InView } from '@/components/util/InView';
import { checkProfileUniqueness } from '@/lib/profile-validation';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const Profile = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const {
    profile: authProfile,
    isLoading,
    refetchProfile
  } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [documentsCount, setDocumentsCount] = useState<number>(0);
  const [profileVisits, setProfileVisits] = useState<number>(0);
  const [isEditingContact, setIsEditingContact] = useState(false);
  const [mobileInfoModal, setMobileInfoModal] = useState<null | 'contact' | 'activity'>(null);
  const [showLayoutSelector, setShowLayoutSelector] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // All hooks must be called before any conditional returns
  const handleProfileUpdateImmediate = useCallback(async (updates: any) => {
    if (!profile?.id) return;
    
    // Check uniqueness if email or telefon is being updated
    if (updates.email || updates.telefon) {
      const { emailExists, phoneExists } = await checkProfileUniqueness(
        updates.email || profile.email,
        updates.telefon || profile.telefon,
        profile.id
      );
      
      if (emailExists && updates.email) {
        toast({
          title: "E-Mail bereits vergeben",
          description: "Diese E-Mail-Adresse wird bereits von einem anderen Benutzer verwendet.",
          variant: "destructive",
        });
        return;
      }
      
      if (phoneExists && updates.telefon) {
        toast({
          title: "Telefonnummer bereits vergeben",
          description: "Diese Telefonnummer wird bereits von einem anderen Benutzer verwendet.",
          variant: "destructive",
        });
        return;
      }
    }
    
    setIsSaving(true);
    try {
      // CRITICAL: Verify profile ownership before update
      const { data: ownershipCheck } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('id', profile.id)
        .maybeSingle();
        
      if (!ownershipCheck) {
        throw new Error('Profil nicht gefunden');
      }
      
      // Additional safety: verify email hasn't changed (prevent race conditions)
      if (updates.email && ownershipCheck.email && ownershipCheck.email.toLowerCase() !== updates.email.toLowerCase()) {
        // Check if new email is already taken
        const { emailExists } = await checkProfileUniqueness(
          updates.email,
          undefined,
          profile.id
        );
        if (emailExists) {
          throw new Error('Diese E-Mail-Adresse wird bereits verwendet');
        }
      }
      
      const { error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id);
      
      if (error) throw error;

      // Update local profile state immediately
      setProfile((prev: any) => ({
        ...prev,
        ...updates
      }));

      toast({
        title: "Profil aktualisiert",
        description: "Ihre Änderungen wurden gespeichert.",
      });
    } catch (error) {
      console.error('Update error:', error);
      toast({
        title: "Fehler beim Speichern",
        description: "Ihre Änderungen konnten nicht gespeichert werden.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }, [profile?.id, profile?.email, profile?.telefon]);

  // Simple profile update without debouncing for form submissions
  const handleProfileUpdate = handleProfileUpdateImmediate;
  const handleExperiencesUpdate = useCallback((experiences: any[]) => {
    handleProfileUpdateImmediate({
      berufserfahrung: experiences
    });
  }, [handleProfileUpdateImmediate]);
  const handleEducationUpdate = useCallback((education: any[]) => {
    handleProfileUpdateImmediate({
      schulbildung: education
    });
  }, [handleProfileUpdateImmediate]);
  const handleSave = async () => {
    if (!profile?.id) return;
    
    // Check uniqueness if email or telefon is being updated
    if (profile.email || profile.telefon) {
      const { emailExists, phoneExists } = await checkProfileUniqueness(
        profile.email,
        profile.telefon,
        profile.id
      );
      
      if (emailExists) {
        toast({
          title: "E-Mail bereits vergeben",
          description: "Diese E-Mail-Adresse wird bereits von einem anderen Benutzer verwendet.",
          variant: "destructive",
        });
        return;
      }
      
      if (phoneExists) {
        toast({
          title: "Telefonnummer bereits vergeben",
          description: "Diese Telefonnummer wird bereits von einem anderen Benutzer verwendet.",
          variant: "destructive",
        });
        return;
      }
    }
    
    setIsSaving(true);
    try {
      // Resolve canonical location_id from PLZ + Ort
      let locationId: number | null = null;
      if (profile.plz && profile.ort) {
        const { data: locId, error: locErr } = await supabase.rpc('resolve_location_id', {
          p_postal_code: String(profile.plz),
          p_city: String(profile.ort),
          p_country_code: 'DE',
        });
        if (locErr) {
          console.warn('resolve_location_id error', locErr);
        } else if (typeof locId === 'number') {
          locationId = locId;
        }
      }

      const { error } = await supabase.from('profiles').update({
        vorname: profile.vorname,
        nachname: profile.nachname,
        email: profile.email ? profile.email.trim().toLowerCase() : profile.email,
        telefon: profile.telefon ? profile.telefon.trim() : profile.telefon,
        strasse: profile.strasse,
        hausnummer: profile.hausnummer,
        plz: profile.plz,
        ort: profile.ort,
        location_id: locationId,
        uebermich: profile.uebermich,
        kenntnisse: profile.kenntnisse,
        motivation: profile.motivation,
        faehigkeiten: profile.faehigkeiten,
        sprachen: profile.sprachen,
        berufserfahrung: profile.berufserfahrung,
        schulbildung: profile.schulbildung,
        avatar_url: profile.avatar_url,
        cover_image_url: profile.cover_image_url,
        updated_at: new Date().toISOString()
      }).eq('id', profile.id);
      if (error) throw error;
      toast({
        title: "Profil gespeichert",
        description: "Ihre Änderungen wurden erfolgreich gespeichert."
      });
      refetchProfile?.();
      setIsEditing(false);
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: "Fehler beim Speichern",
        description: "Ihre Änderungen konnten nicht gespeichert werden.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };
  // Helper function to parse JSONB fields
  const parseJsonField = (field: any) => {
    if (field === null || field === undefined) return null;
    if (typeof field === 'string') {
      try {
        return JSON.parse(field);
      } catch {
        return field;
      }
    }
    if (Array.isArray(field)) return field;
    return field;
  };

  useEffect(() => {
    if (authProfile) {
      // Parse JSONB fields that might come as strings from the database
      const parsedProfile = {
        ...authProfile,
        berufserfahrung: parseJsonField(authProfile.berufserfahrung) || [],
        schulbildung: parseJsonField(authProfile.schulbildung) || [],
        faehigkeiten: parseJsonField(authProfile.faehigkeiten) || [],
        sprachen: parseJsonField(authProfile.sprachen) || [],
        job_search_preferences: parseJsonField(authProfile.job_search_preferences) || [],
      };
      
      // Debug: Log parsed profile data
      console.log('✅ Profile parsed for display:', {
        id: parsedProfile.id,
        vorname: parsedProfile.vorname,
        nachname: parsedProfile.nachname,
        berufserfahrung: parsedProfile.berufserfahrung,
        schulbildung: parsedProfile.schulbildung,
        faehigkeiten: parsedProfile.faehigkeiten,
        sprachen: parsedProfile.sprachen,
        uebermich: parsedProfile.uebermich,
        branche: parsedProfile.branche,
        status: parsedProfile.status,
        headline: parsedProfile.headline,
        cover_image_url: parsedProfile.cover_image_url,
        cv_url: parsedProfile.cv_url,
        account_created: parsedProfile.account_created,
        profile_complete: parsedProfile.profile_complete,
      });
      
      setProfile(parsedProfile);
    } else {
      console.warn('⚠️ authProfile is null or undefined');
    }
  }, [authProfile]);

  useEffect(() => {
    const loadCounts = async () => {
      if (!profile?.id) return;
      try {
        const { count: docsCount, error: docsError } = await supabase
          .from('user_documents')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', profile.id);
        if (!docsError) setDocumentsCount(docsCount ?? 0);
      } catch (e) {
        console.warn('Dokumente zählen fehlgeschlagen:', e);
      }
      try {
        const { count: visitsCount, error: visitsError } = await supabase
          .from('tokens_used')
          .select('*', { count: 'exact', head: true })
          .eq('profile_id', profile.id);
        if (!visitsError) setProfileVisits(visitsCount ?? 0);
      } catch (e) {
        console.warn('Profilbesuche zählen fehlgeschlagen:', e);
      }
    };
    loadCounts();
  }, [profile?.id]);
  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>;
  }
  if (!profile) {
    return <div className="container mx-auto p-6">
        <Card className="p-6 text-center">
          <h1 className="text-2xl font-bold mb-4">Willkommen!</h1>
          <p className="text-muted-foreground mb-4">
            Erstellen Sie jetzt Ihren ersten Lebenslauf, um von Unternehmen gefunden zu werden.
          </p>
          <Button onClick={() => navigate('/cv-generator')}>
            Jetzt Lebenslauf erstellen
          </Button>
        </Card>
      </div>;
  }

  // Early returns after all hooks are declared

  const handleMobileDownloadCV = async () => {
    if (!profile?.id) return;
    setIsGeneratingPDF(true);
    try {
      const layoutId = profile.layout || 1;
      const userId = profile.id;
      const filename = `CV_${profile.vorname || 'User'}_${profile.nachname || ''}_${new Date().toISOString().split('T')[0]}.pdf`;
      await generatePDFFromCV(layoutId, userId, filename);
      toast({ title: 'CV heruntergeladen', description: 'Dein PDF wurde erstellt.' });
    } catch (e) {
      console.error('PDF download error', e);
      toast({ title: 'Fehler', description: 'PDF konnte nicht erstellt werden.', variant: 'destructive' });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <div className="min-h-screen pb-[72px] md:pb-6 overflow-x-hidden">
      {/* Main Content */}
      <div className="px-2 sm:px-3 md:px-6 py-2 md:py-4">
        <div className="max-w-screen-2xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 sm:gap-3 md:gap-4 lg:gap-6">
            {/* Main Content */}
            <main className="lg:col-span-8">
              <div className="max-w-[560px] mx-auto lg:max-w-none space-y-2 sm:space-y-3 md:space-y-4">
                {/* Profile Header with Cover Photo - Always first */}
                <LinkedInProfileHeader 
                  profile={profile} 
                  isEditing={isEditing} 
                  onProfileUpdate={handleProfileUpdate}
                  onStartEdit={() => setIsEditing(true)}
                  onCancelEdit={() => setIsEditing(false)}
                  onSave={handleSave}
                  isSaving={isSaving}
                />

                {isMobile ? (
                  <>
                    {/* Mobile: Actions right under header */}
                    <div className="space-y-2">
                      <Card className="p-3 sm:p-4">
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <div className="text-sm font-semibold">Lebenslauf</div>
                            <div className="text-xs text-muted-foreground truncate">
                              Als PDF herunterladen
                            </div>
                          </div>
                          <Download className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <Button
                          className="w-full mt-3"
                          onClick={handleMobileDownloadCV}
                          disabled={isGeneratingPDF}
                        >
                          {isGeneratingPDF ? 'PDF wird erstellt…' : 'CV als PDF herunterladen'}
                        </Button>
                      </Card>

                      <div className="grid grid-cols-2 gap-2">
                        <Card
                          className="p-3 sm:p-4 cursor-pointer active:scale-[0.99] transition"
                          onClick={() => setShowLayoutSelector(true)}
                          role="button"
                          tabIndex={0}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="text-sm font-semibold">Layout ändern</div>
                            <LayoutGrid className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div className="mt-1 text-xs text-muted-foreground">Design auswählen</div>
                        </Card>

                        <Card
                          className={
                            `p-3 sm:p-4 cursor-pointer active:scale-[0.99] transition ` +
                            (profile?.profile_published ? 'bg-green-50 border-green-200' : 'bg-white')
                          }
                          onClick={() => openVisibilityPrompt()}
                          role="button"
                          tabIndex={0}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="text-sm font-semibold">Offen für Jobs</div>
                            <Eye className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            {profile?.profile_published ? 'Sichtbar' : 'Unsichtbar'}
                          </div>
                        </Card>
                      </div>
                    </div>

                    {/* About */}
                    <LinkedInProfileMain profile={profile} isEditing={isEditing} onProfileUpdate={handleProfileUpdate} />

                    {/* Activity Feed */}
                    <LinkedInProfileActivity profile={profile} />

                    {/* Experience + Education */}
                    <LinkedInProfileExperience
                      experiences={profile?.berufserfahrung || []}
                      isEditing={isEditing}
                      onExperiencesUpdate={handleExperiencesUpdate}
                      onEditingChange={setIsEditing}
                    />
                    <LinkedInProfileEducation
                      education={profile?.schulbildung || []}
                      isEditing={isEditing}
                      onEducationUpdate={handleEducationUpdate}
                      onEditingChange={setIsEditing}
                    />

                    {/* Values & Interview (mobile: directly after experience/education) */}
                    <ValuesAndInterviewCard profileId={profile?.id} isEditing />

                    {/* Skills + Languages + Availability */}
                    <SkillsLanguagesSidebar
                      profile={profile}
                      isEditing={isEditing}
                      onProfileUpdate={handleProfileUpdate}
                      readOnly={false}
                      onEditingChange={setIsEditing}
                    />
                    <AvailabilityCard
                      availableFrom={profile?.available_from}
                      visibilityMode={profile?.visibility_mode}
                      jobSearchPreferences={profile?.job_search_preferences}
                      profileStatus={profile?.status}
                      profileId={profile?.id}
                      readOnly={false}
                      onUpdate={() => refetchProfile?.()}
                    />

                    {/* Mobile: two small cards that open the full cards as popups */}
                    <div className="grid grid-cols-2 gap-2">
                      <Card
                        className="p-3 sm:p-4 cursor-pointer active:scale-[0.99] transition"
                        onClick={() => setMobileInfoModal('contact')}
                        role="button"
                        tabIndex={0}
                      >
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-semibold">Kontaktdaten</div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground truncate">
                          {profile?.telefon || profile?.email || '—'}
                        </div>
                      </Card>

                      <Card
                        className="p-3 sm:p-4 cursor-pointer active:scale-[0.99] transition"
                        onClick={() => setMobileInfoModal('activity')}
                        role="button"
                        tabIndex={0}
                      >
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-semibold">Profilaktivitäten</div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          Besuche: {profileVisits}
                        </div>
                      </Card>
                    </div>

                    <Dialog open={mobileInfoModal === 'contact'} onOpenChange={(open) => setMobileInfoModal(open ? 'contact' : null)}>
                      <DialogContent className="max-w-[560px]">
                        <DialogHeader>
                          <DialogTitle>Kontaktdaten</DialogTitle>
                        </DialogHeader>
                        <Card className="p-3 sm:p-4 overflow-hidden border-0 shadow-none">
                          <div className="space-y-2 text-sm text-muted-foreground">
                            {profile?.email && (
                              <div className="flex items-center gap-2"><Mail className="h-4 w-4 flex-shrink-0" /> <span>{profile.email}</span></div>
                            )}
                            {profile?.telefon && (
                              <div className="flex items-center gap-2"><Phone className="h-4 w-4 flex-shrink-0" /> <span>{profile.telefon}</span></div>
                            )}
                            {(profile?.strasse || profile?.hausnummer || profile?.plz || profile?.ort) && (
                              <div className="flex items-start gap-2">
                                <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                  {profile?.strasse && profile?.hausnummer && (
                                    <div>{profile.strasse} {profile.hausnummer}</div>
                                  )}
                                  {profile?.strasse && !profile?.hausnummer && (
                                    <div>{profile.strasse}</div>
                                  )}
                                  {(profile?.plz || profile?.ort) && (
                                    <div>{[profile?.plz, profile?.ort].filter(Boolean).join(' ')}</div>
                                  )}
                                  {profile?.country && (
                                    <div className="text-xs text-muted-foreground/80">{profile.country}</div>
                                  )}
                                </div>
                              </div>
                            )}
                            {typeof profile?.has_drivers_license === 'boolean' && (
                              <div className="flex items-center gap-2"><Car className="h-4 w-4 flex-shrink-0" /> <span>Führerschein: {profile.has_drivers_license ? (profile?.driver_license_class ? `Ja, Klasse ${profile.driver_license_class}` : 'Ja') : 'Nein'}</span></div>
                            )}
                          </div>
                        </Card>
                      </DialogContent>
                    </Dialog>

                    <Dialog open={mobileInfoModal === 'activity'} onOpenChange={(open) => setMobileInfoModal(open ? 'activity' : null)}>
                      <DialogContent className="max-w-[560px]">
                        <DialogHeader>
                          <DialogTitle>Profilaktivitäten</DialogTitle>
                        </DialogHeader>
                        <Card className="p-3 sm:p-4 overflow-hidden border-0 shadow-none">
                          <div className="space-y-2 text-sm text-muted-foreground">
                            <div className="flex items-start gap-2">
                              <span className="mt-0.5">•</span>
                              <span>Profil vollständig: {profile?.profile_complete ? 'Ja' : 'Nein'}</span>
                            </div>
                            <div className="flex items-start gap-2">
                              <span className="mt-0.5">•</span>
                              <span>Öffentlich sichtbar: {profile?.profile_published ? 'Ja' : 'Nein'}</span>
                            </div>
                            <div className="flex items-start gap-2">
                              <span className="mt-0.5">•</span>
                              <span>Erstellt am: {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('de-DE') : '—'}</span>
                            </div>
                            <div className="flex items-start gap-2">
                              <span className="mt-0.5">•</span>
                              <span>Dokumente hochgeladen: {documentsCount > 0 ? 'Ja' : 'Nein'}</span>
                            </div>
                            <div className="flex items-start gap-2">
                              <span className="mt-0.5">•</span>
                              <span>Profilbesuche: {profileVisits}</span>
                            </div>
                          </div>
                        </Card>
                      </DialogContent>
                    </Dialog>

                    <CVLayoutSelectorDialog
                      open={showLayoutSelector}
                      onOpenChange={setShowLayoutSelector}
                      currentLayout={profile?.layout || 1}
                      profile={profile}
                      onLayoutUpdated={() => refetchProfile?.()}
                    />
                  </>
                ) : (
                  <>
                    {/* About Section - High priority on mobile */}
                    <LinkedInProfileMain profile={profile} isEditing={isEditing} onProfileUpdate={handleProfileUpdate} />

                    {/* Activity Section (moved above Experience) */}
                    <LinkedInProfileActivity profile={profile} />

                    {/* Experience Section */}
                    <LinkedInProfileExperience 
                      experiences={profile?.berufserfahrung || []} 
                      isEditing={isEditing} 
                      onExperiencesUpdate={handleExperiencesUpdate}
                      onEditingChange={setIsEditing}
                    />

                    {/* Education Section */}
                    <LinkedInProfileEducation 
                      education={profile?.schulbildung || []} 
                      isEditing={isEditing} 
                      onEducationUpdate={handleEducationUpdate}
                      onEditingChange={setIsEditing}
                    />

                    {/* Small tiles under Education: Contact & Profile Highlights */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                      <Card className="p-3 sm:p-4 overflow-hidden">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-semibold">Kontaktdaten</h4>
                          {!isEditingContact && !isEditing && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => setIsEditingContact(true)}
                              className="h-10 w-10 p-0 md:h-8 md:w-8"
                            >
                              <Pencil className="h-5 w-5 md:h-4 md:w-4" />
                            </Button>
                          )}
                        </div>
                        {isEditing || isEditingContact ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <Label htmlFor="email">E-Mail</Label>
                              <Input id="email" type="email" value={profile.email || ''} disabled readOnly />
                            </div>
                            <div className="space-y-1">
                              <Label htmlFor="telefon">Telefon</Label>
                              <Input id="telefon" value={profile.telefon || ''} onChange={(e) => setProfile((p: any) => ({...p, telefon: e.target.value}))} onBlur={(e) => handleProfileUpdateImmediate({ telefon: e.target.value })} />
                            </div>
                            <div className="space-y-1">
                              <Label htmlFor="strasse">Straße</Label>
                              <Input id="strasse" value={profile.strasse || ''} onChange={(e) => setProfile((p: any) => ({...p, strasse: e.target.value}))} onBlur={(e) => handleProfileUpdateImmediate({ strasse: e.target.value })} />
                            </div>
                            <div className="space-y-1">
                              <Label htmlFor="hausnummer">Hausnummer</Label>
                              <Input id="hausnummer" value={profile.hausnummer || ''} onChange={(e) => setProfile((p: any) => ({...p, hausnummer: e.target.value}))} onBlur={(e) => handleProfileUpdateImmediate({ hausnummer: e.target.value })} />
                            </div>
                            <div className="space-y-1">
                              <Label htmlFor="plz">PLZ</Label>
                              <Input id="plz" value={profile.plz || ''} onChange={(e) => setProfile((p: any) => ({...p, plz: e.target.value}))} onBlur={(e) => handleProfileUpdateImmediate({ plz: e.target.value })} />
                            </div>
                            <div className="space-y-1">
                              <Label htmlFor="ort">Ort</Label>
                              <Input id="ort" value={profile.ort || ''} onChange={(e) => setProfile((p: any) => ({...p, ort: e.target.value}))} onBlur={(e) => handleProfileUpdateImmediate({ ort: e.target.value })} />
                            </div>

                            {/* Führerschein unten bei Kontaktdaten */}
                            <div className="col-span-1 sm:col-span-2 border-t pt-3 mt-1">
                              <h5 className="text-sm font-semibold mb-2 flex items-center gap-2"><Car className="h-4 w-4" /> Führerschein</h5>
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div className="space-y-1">
                                  <Label>Vorhanden</Label>
                                  <div className="flex items-center gap-3">
                                    <Switch
                                      checked={!!profile?.has_drivers_license}
                                      onCheckedChange={(val) => {
                                        const v = !!val;
                                        setProfile((p: any) => ({ ...p, has_drivers_license: v, driver_license_class: v ? (p.driver_license_class || null) : null }));
                                        handleProfileUpdateImmediate({ has_drivers_license: v, driver_license_class: v ? (profile?.driver_license_class || null) : null });
                                      }}
                                    />
                                    <span className="text-sm text-muted-foreground">{profile?.has_drivers_license ? 'Ja' : 'Nein'}</span>
                                  </div>
                                </div>
                                <div className="space-y-1 sm:col-span-2">
                                  <Label>Klasse</Label>
                                  <Select
                                    value={profile?.driver_license_class || ''}
                                    onValueChange={(val) => {
                                      setProfile((p: any) => ({ ...p, driver_license_class: val, has_drivers_license: true }));
                                      handleProfileUpdateImmediate({ has_drivers_license: true, driver_license_class: val });
                                    }}
                                    disabled={!profile?.has_drivers_license}
                                  >
                                    <SelectTrigger className="w-full">
                                      <SelectValue placeholder="Klasse wählen" />
                                    </SelectTrigger>
                                    <SelectContent className="z-50 bg-background">
                                      {['AM','A1','A2','A','B','BE','C','CE','D','DE','T','L'].map((k) => (
                                        <SelectItem key={k} value={k}>{k}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2 text-sm text-muted-foreground">
                            {profile?.email && (
                              <div className="flex items-center gap-2"><Mail className="h-4 w-4 flex-shrink-0" /> <span>{profile.email}</span></div>
                            )}
                            {profile?.telefon && (
                              <div className="flex items-center gap-2"><Phone className="h-4 w-4 flex-shrink-0" /> <span>{profile.telefon}</span></div>
                            )}
                            {(profile?.strasse || profile?.hausnummer || profile?.plz || profile?.ort) && (
                              <div className="flex items-start gap-2">
                                <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                  {profile?.strasse && profile?.hausnummer && (
                                    <div>{profile.strasse} {profile.hausnummer}</div>
                                  )}
                                  {profile?.strasse && !profile?.hausnummer && (
                                    <div>{profile.strasse}</div>
                                  )}
                                  {(profile?.plz || profile?.ort) && (
                                    <div>{[profile?.plz, profile?.ort].filter(Boolean).join(' ')}</div>
                                  )}
                                  {profile?.country && (
                                    <div className="text-xs text-muted-foreground/80">{profile.country}</div>
                                  )}
                                </div>
                              </div>
                            )}
                            {typeof profile?.has_drivers_license === 'boolean' && (
                              <div className="flex items-center gap-2"><Car className="h-4 w-4 flex-shrink-0" /> <span>Führerschein: {profile.has_drivers_license ? (profile?.driver_license_class ? `Ja, Klasse ${profile.driver_license_class}` : 'Ja') : 'Nein'}</span></div>
                            )}
                          </div>
                        )}
                      </Card>
                      <Card className="p-3 sm:p-4 overflow-hidden">
                        <h4 className="text-sm font-semibold mb-2">Profilaktivitäten</h4>
                        <div className="space-y-2 text-sm text-muted-foreground">
                          <div className="flex items-start gap-2">
                            <span className="mt-0.5">•</span>
                            <span>Profil vollständig: {profile?.profile_complete ? 'Ja' : 'Nein'}</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="mt-0.5">•</span>
                            <span>Öffentlich sichtbar: {profile?.profile_published ? 'Ja' : 'Nein'}</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="mt-0.5">•</span>
                            <span>Erstellt am: {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('de-DE') : '—'}</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="mt-0.5">•</span>
                            <span>Dokumente hochgeladen: {documentsCount > 0 ? 'Ja' : 'Nein'}</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="mt-0.5">•</span>
                            <span>Profilbesuche: {profileVisits}</span>
                          </div>
                        </div>
                      </Card>
                    </div>
                  </>
                )}
              </div>
            </main>

            {/* Right Sidebar - Desktop: sidebar, Mobile: after main content */}
            {!isMobile && (
              <aside className="lg:col-span-4">
              <div className="lg:sticky lg:top-6 space-y-3 sm:space-y-4 md:space-y-6">
                <LinkedInProfileSidebar 
                  profile={profile} 
                  isEditing={isEditing} 
                  onProfileUpdate={handleProfileUpdate} 
                  showLanguagesAndSkills={true} 
                  showLicenseAndStats={true} 
                  showCVSection={true}
                  onEditingChange={setIsEditing}
                />
                <RightRailAd variant="card" size="sm" />
                <InView rootMargin="300px" placeholder={<div className="h-32 rounded-md bg-muted/50 animate-pulse" />}> 
                  <CompanyRecommendations limit={3} showMoreLink="/entdecken/unternehmen" showMore />
                </InView>
                <RightRailAd variant="banner" size="sm" />
              </div>
              </aside>
            )}
          </div>
        </div>
      </div>

      {/* Sticky bottom Save Bar (mobile) */}
      {isEditing && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 supports-[backdrop-filter]:bg-background/80 backdrop-blur px-3 py-2 pb-safe md:hidden">
          <div className="max-w-[560px] mx-auto px-4 flex items-center justify-end gap-2">
            <Button variant="outline" onClick={() => setIsEditing(false)} disabled={isSaving} size="sm" className="min-h-[38px] md:min-h-[44px]">
              Abbrechen
            </Button>
            <Button onClick={handleSave} disabled={isSaving} size="sm" className="min-h-[38px] md:min-h-[44px]">
              {isSaving ? <Clock className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
              Speichern
            </Button>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && (
        <ProfilePreviewModal 
          isOpen={showPreview} 
          profileData={profile} 
          onPublish={async () => {
            await handleProfileUpdate({
              profile_published: true
            });
            setShowPreview(false);
          }} 
          onClose={() => setShowPreview(false)} 
        />
      )}
    </div>
  );
};
export default Profile;