import React, { useState, useRef } from 'react';
import { Camera, Edit3, MapPin, Building2, X, Check, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { usePublicProfile } from '@/hooks/usePublicProfile';
import { normalizeImageUrl } from '@/lib/image-utils';
import { useQueryClient } from '@tanstack/react-query';

interface LinkedInProfileHeaderProps {
  profile: any;
  isEditing: boolean;
  onProfileUpdate: (updates: any) => void;
  onStartEdit?: () => void;
  onCancelEdit?: () => void;
  onSave?: () => void;
  isSaving?: boolean;
}

export const LinkedInProfileHeader: React.FC<LinkedInProfileHeaderProps> = ({
  profile,
  isEditing,
  onProfileUpdate,
  onStartEdit,
  onCancelEdit,
  onSave,
  isSaving = false
}) => {
  const { refetchProfile } = useAuth();
  const queryClient = useQueryClient();
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [headline, setHeadline] = useState(profile?.headline || '');

  // Use authenticated user's ID for live profile data
  const { user } = useAuth();
  const { data: liveProfile } = usePublicProfile(user?.id);

  // Sync local headline state with profile changes
  React.useEffect(() => {
    setHeadline(profile?.headline || '');
  }, [profile?.headline]);
  const [currentPosition, setCurrentPosition] = useState('');
  const coverInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const hasHeadline = false;
  const isOwner = user?.id === profile?.id;

  // Show company badge from live data
  const company = liveProfile?.company_id ? {
    name: liveProfile.company_name!,
    logo: liveProfile.company_logo,
    href: `/companies/${liveProfile.company_id}`,
  } : null;

  // Get current position from profile data
  React.useEffect(() => {
    const position = getCurrentPosition(profile);
    setCurrentPosition(position);
  }, [profile]);

  const handleCoverUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const inputEl = event.target;
    const file = inputEl.files?.[0];
    if (!file) {
      // ensure change fires next time even with same file
      inputEl.value = '';
      return;
    }

    setIsUploadingCover(true);
    try {
      // Upload to Supabase Storage and update profile
      const { uploadCoverImage } = await import('@/lib/supabase-storage');
      const uploadResult = await uploadCoverImage(file);

      // Update profile in database
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase
          .from('profiles')
          .update({ cover_image_url: uploadResult.url })
          .eq('id', user.id);
        
        if (error) {
          console.error('Error updating cover_image_url in database:', error);
          throw error;
        }
        
        // Update local state
        onProfileUpdate({ cover_image_url: uploadResult.url });
        
        // Also update cover_url and titelbild_url for backwards compatibility
        await supabase
          .from('profiles')
          .update({ cover_url: uploadResult.url, titelbild_url: uploadResult.url })
          .eq('id', user.id);
        
        // Invalidate and refetch profile data
        queryClient.invalidateQueries({ queryKey: ['user-profile'] });
        await refetchProfile?.();
        
        toast({ title: "Titelbild hochgeladen", description: "Ihr Titelbild wurde erfolgreich aktualisiert." });
      }
    } catch (error) {
      console.error('Error uploading cover:', error);
      toast({ 
        title: "Upload fehlgeschlagen", 
        description: "Das Titelbild konnte nicht hochgeladen werden. Bitte versuchen Sie es erneut.",
        variant: "destructive"
      });
    } finally {
      // reset input so selecting the same file works again
      try { inputEl.value = ''; } catch {}
      try { coverInputRef.current && (coverInputRef.current.value = ''); } catch {}
      setIsUploadingCover(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const inputEl = event.target;
    const file = inputEl.files?.[0];
    if (!file) {
      inputEl.value = '';
      return;
    }

    setIsUploadingAvatar(true);
    try {
      // Upload to Supabase Storage and update profile
      const { uploadProfileImage } = await import('@/lib/supabase-storage');
      const uploadResult = await uploadProfileImage(file);
      
      // Update profile in database
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase
          .from('profiles')
          .update({ avatar_url: uploadResult.url })
          .eq('id', user.id);
          
        if (!error) {
          onProfileUpdate({ avatar_url: uploadResult.url });
          toast({
            title: "Profilbild hochgeladen",  
            description: "Ihr Profilbild wurde erfolgreich aktualisiert."
          });
        }
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      // Fallback to base64 if Supabase upload fails
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        onProfileUpdate({ avatar_url: result });
        toast({
          title: "Profilbild hochgeladen",  
          description: "Ihr Profilbild wurde erfolgreich aktualisiert."
        });
      };
      reader.readAsDataURL(file);
    } finally {
      try { inputEl.value = ''; } catch {}
      try { avatarInputRef.current && (avatarInputRef.current.value = ''); } catch {}
      setIsUploadingAvatar(false);
    }
  };

  const handleHeadlineUpdate = async () => {
    await onProfileUpdate({ headline });
  };

  const getCurrentPosition = (profile: any) => {
    if (!profile?.status) return '';
    
    switch (profile.status) {
      case 'schueler':
        return profile.geplanter_abschluss || 'Abitur';
      case 'azubi':
        const currentJob = profile.berufserfahrung?.find((job: any) => {
          if (!job.zeitraum_bis || job.zeitraum_bis === 'heute') return true;
          try {
            const bisDate = new Date(job.zeitraum_bis);
            return bisDate > new Date();
          } catch {
            return true;
          }
        });
        return currentJob?.titel || profile.ausbildungsberuf || 'Ausbildung';
      case 'ausgelernt':
        const currentEmployment = profile.berufserfahrung?.find((job: any) => {
          if (!job.zeitraum_bis || job.zeitraum_bis === 'heute') return true;
          try {
            const bisDate = new Date(job.zeitraum_bis);
            return bisDate > new Date();
          } catch {
            return true;
          }
        });
        return currentEmployment?.titel || profile.aktueller_beruf || 'Position';
      default:
        return '';
    }
  };

  const updateCurrentPosition = async (newPosition: string) => {
    if (!profile?.status) return;
    
    let updates: any = {};
    
    switch (profile.status) {
      case 'schueler':
        updates.geplanter_abschluss = newPosition;
        // Update schulbildung if exists
        if (profile.schulbildung && profile.schulbildung.length > 0) {
          const updatedSchulbildung = [...profile.schulbildung];
          updatedSchulbildung[0] = { ...updatedSchulbildung[0], schulform: newPosition };
          updates.schulbildung = updatedSchulbildung;
        }
        break;
        
      case 'azubi':
        updates.ausbildungsberuf = newPosition;
        // Update berufserfahrung if exists
        if (profile.berufserfahrung && profile.berufserfahrung.length > 0) {
          const updatedBerufserfahrung = [...profile.berufserfahrung];
          const currentJobIndex = updatedBerufserfahrung.findIndex((job: any) => {
            if (!job.zeitraum_bis || job.zeitraum_bis === 'heute') return true;
            try {
              const bisDate = new Date(job.zeitraum_bis);
              return bisDate > new Date();
            } catch {
              return true;
            }
          });
          if (currentJobIndex !== -1) {
            updatedBerufserfahrung[currentJobIndex] = { 
              ...updatedBerufserfahrung[currentJobIndex], 
              titel: newPosition 
            };
            updates.berufserfahrung = updatedBerufserfahrung;
          }
        }
        break;
        
      case 'ausgelernt':
        updates.aktueller_beruf = newPosition;
        // Update berufserfahrung if exists
        if (profile.berufserfahrung && profile.berufserfahrung.length > 0) {
          const updatedBerufserfahrung = [...profile.berufserfahrung];
          const currentJobIndex = updatedBerufserfahrung.findIndex((job: any) => {
            if (!job.zeitraum_bis || job.zeitraum_bis === 'heute') return true;
            try {
              const bisDate = new Date(job.zeitraum_bis);
              return bisDate > new Date();
            } catch {
              return true;
            }
          });
          if (currentJobIndex !== -1) {
            updatedBerufserfahrung[currentJobIndex] = { 
              ...updatedBerufserfahrung[currentJobIndex], 
              titel: newPosition 
            };
            updates.berufserfahrung = updatedBerufserfahrung;
          }
        }
        break;
    }
    
    try {
      await onProfileUpdate(updates);
      toast({
        title: "Position aktualisiert",
        description: "Ihre Position wurde erfolgreich aktualisiert."
      });
    } catch (error) {
      console.error('Error updating position:', error);
      toast({
        title: "Fehler beim Speichern",
        description: "Die Position konnte nicht aktualisiert werden.",
        variant: "destructive"
      });
    }
  };

  const getEmployerOrSchool = (p: any) => {
    if (!p) return '';
    if (p.status === 'schueler') {
      return p.schule || p.schulbildung?.[0]?.name || '';
    }
    if (p.status === 'azubi' || p.status === 'ausgelernt') {
      const current = p.berufserfahrung?.find((job: any) => {
        if (!job.zeitraum_bis || job.zeitraum_bis === 'heute') return true;
        try {
          const bisDate = new Date(job.zeitraum_bis);
          return bisDate > new Date();
        } catch {
          return true;
        }
      });
      return current?.unternehmen || p.ausbildungsbetrieb || '';
    }
    return '';
  };

  const getStatusDescription = (profile: any) => {
    if (!profile?.status) return '';
    
    const currentYear = new Date().getFullYear();
    
    switch (profile.status) {
      case 'schueler':
        const schoolName = profile.schule || profile.schulbildung?.[0]?.name || 'Schule';
        const graduationYear = profile.abschlussjahr || 
          (profile.schulbildung?.[0]?.zeitraum_bis ? new Date(profile.schulbildung[0].zeitraum_bis).getFullYear() : currentYear + 1);
        const studentPosition = getCurrentPosition(profile);
        return `${studentPosition} an der ${schoolName}, Abschluss voraussichtlich ${graduationYear}`;
      
      case 'azubi':
        const currentJob = profile.berufserfahrung?.find((job: any) => {
          if (!job.zeitraum_bis || job.zeitraum_bis === 'heute') return true;
          try {
            const bisDate = new Date(job.zeitraum_bis);
            return bisDate > new Date();
          } catch {
            return true;
          }
        });
        const company = profile.ausbildungsbetrieb || currentJob?.unternehmen || 'Betrieb';
        const endDate = profile.voraussichtliches_ende || 
          (currentJob?.zeitraum_bis && currentJob.zeitraum_bis !== 'heute' ? new Date(currentJob.zeitraum_bis).getFullYear() : currentYear + 2);
        const apprenticePosition = getCurrentPosition(profile);
        return `${apprenticePosition} bei ${company} bis ${endDate}`;
      
      case 'ausgelernt':
        const currentEmployment = profile.berufserfahrung?.find((job: any) => {
          if (!job.zeitraum_bis || job.zeitraum_bis === 'heute') return true;
          try {
            const bisDate = new Date(job.zeitraum_bis);
            return bisDate > new Date();
          } catch {
            return true;
          }
        });
        const employer = currentEmployment?.unternehmen || 'Unternehmen';
        const startYear = profile.abschlussjahr_ausgelernt || 
          (currentEmployment?.zeitraum_von ? new Date(currentEmployment.zeitraum_von).getFullYear() : currentYear);
        const employeePosition = getCurrentPosition(profile);
        return `${employeePosition} bei ${employer} seit ${startYear}`;
      
      default:
        return '';
    }
  };

  return (
    <div className="relative bg-background rounded-xl shadow-sm border overflow-visible">
      {/* Cover Photo */}
      <div className="relative h-32 sm:h-36 md:h-40 lg:h-48 overflow-hidden rounded-t-xl bg-gradient-to-r from-primary/20 to-accent/30">
        {profile?.cover_image_url || profile?.cover_url || profile?.titelbild_url ? (
          <img 
            src={normalizeImageUrl((profile.cover_image_url || profile.cover_url || profile.titelbild_url) as string) || (profile.cover_image_url || profile.cover_url || profile.titelbild_url) as string}
            alt={(profile?.vorname || profile?.nachname) ? `Titelbild von ${profile?.vorname ?? ''} ${profile?.nachname ?? ''}`.trim() : 'Titelbild'} 
            className="w-full h-full object-cover object-[center_top]"
            loading="lazy"
            decoding="async"
            sizes="(max-width: 768px) 100vw, 800px"
            onError={(e) => {
              const originalUrl = profile.cover_image_url || profile.cover_url || profile.titelbild_url;
              console.error('Cover image load error:', originalUrl);
              console.error('Normalized URL:', normalizeImageUrl(originalUrl as string));
              // Don't hide the image, just log the error - might be a temporary network issue
              // e.currentTarget.style.display = 'none';
            }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-primary/10 to-accent/20" />
        )}

        {/* Add prominent add button when there is no cover */}
        {isOwner && !(profile?.cover_image_url || profile?.cover_url || profile?.titelbild_url) && (
          <div className="absolute inset-0 flex items-center justify-center">
            <label
              htmlFor="cover-upload"
              className="cursor-pointer inline-flex items-center gap-2 rounded-md border border-dashed px-4 py-2 bg-background/70 hover:bg-background/80 transition-colors text-sm"
              aria-label="Titelbild hinzufügen"
            >
              <Camera className="h-4 w-4" />
              {isUploadingCover ? 'Lädt…' : 'Titelbild hinzufügen'}
            </label>
          </div>
        )}

        {/* Edit Controls Overlay for Desktop */}
        {isOwner && !isEditing && onStartEdit && (
          <div className="absolute right-3 top-3 hidden md:block">
            <Button size="sm" variant="secondary" onClick={onStartEdit}>
              <Edit3 className="h-4 w-4 mr-2" />
              Bearbeiten
            </Button>
          </div>
        )}
        
        {isOwner && isEditing && onCancelEdit && onSave && (
          <div className="absolute right-3 top-3 hidden md:flex gap-2">
            <Button size="sm" variant="outline" onClick={onCancelEdit} disabled={isSaving}>
              <X className="h-4 w-4 mr-2" />
              Abbrechen
            </Button>
            <Button size="sm" onClick={onSave} disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
              Speichern
            </Button>
          </div>
        )}

        {isOwner && (
          <div className="absolute right-3 bottom-3">
            <Button size="sm" variant="secondary" asChild disabled={isUploadingCover}>
              <label htmlFor="cover-upload" className="flex items-center" aria-label="Titelbild ändern">
                <Camera className="h-4 w-4 mr-2" />
                {isUploadingCover ? 'Lädt…' : ((profile?.cover_image_url || profile?.cover_url || profile?.titelbild_url) ? 'Titelbild ändern' : 'Titelbild hinzufügen')}
              </label>
            </Button>
          </div>
        )}
        
        <input
          id="cover-upload"
          ref={coverInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleCoverUpload}
        />
      </div>

      {/* Profile Info */}
      <div className="px-4 sm:px-4 md:px-6 pb-3 sm:pb-4 md:pb-6">
        {/* Avatar */}
        <div className="relative -mt-12 sm:-mt-14 md:-mt-16 mb-2 sm:mb-3">
          <div className="relative inline-block">
            <Avatar className="w-20 h-20 sm:w-22 sm:h-22 md:w-24 md:h-24 lg:w-28 lg:h-28 border-4 border-background shadow-lg">
              <AvatarImage src={profile?.avatar_url} alt="Profilbild" loading="lazy" decoding="async" />
              <AvatarFallback className="text-base sm:text-lg md:text-xl font-bold bg-primary/10">
                {profile?.vorname?.[0]}{profile?.nachname?.[0]}
              </AvatarFallback>
            </Avatar>
            {isOwner && (
              <Button
                asChild
                variant="secondary"
                size="icon"
                className="absolute -bottom-0.5 -right-0.5 h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 rounded-full"
                disabled={isUploadingAvatar}
              >
                <label htmlFor="avatar-upload" aria-label="Profilbild ändern" className="flex items-center justify-center">
                  <Camera className="h-4 w-4" />
                </label>
              </Button>
            )}
          </div>
          
          <input
            id="avatar-upload"
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarUpload}
          />
        </div>

        {/* Name and Headline */}
         <div className="space-y-1.5 sm:space-y-2 min-w-0">
          <h1 className="text-xl sm:text-xl md:text-2xl lg:text-3xl font-bold text-foreground leading-tight break-words">
            {profile?.vorname} {profile?.nachname}
          </h1>
          
          {/* Professional Status - Mobile optimized badge + Editable position */}
          {profile?.status && (
            <div className="space-y-1.5 sm:space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2">
                <Badge variant="secondary" className="text-xs sm:text-xs md:text-sm w-fit px-2 py-0.5">
                  {profile.status === 'schueler' ? 'Schüler' : 
                   profile.status === 'azubi' ? 'Azubi im Handwerk' : 
                   'Angestellter im Handwerk'}
                </Badge>
                <div className="rounded-md border px-2 sm:px-3 py-0.5 sm:py-1 text-xs sm:text-xs md:text-sm text-muted-foreground">
                  {currentPosition || '—'}
                </div>
              </div>
              <p className="text-sm sm:text-sm md:text-base font-medium text-primary leading-tight line-clamp-2">
                {getStatusDescription(profile)}
              </p>
            </div>
          )}
          
           <p className="text-sm sm:text-sm md:text-base font-medium text-muted-foreground line-clamp-2">
             {headline || '—'}
           </p>
           
           {/* Show company employment badge */}
           {company && (
             <div className="flex items-center gap-2 mt-2">
               <Building2 className="h-4 w-4 text-muted-foreground" />
               <a href={company.href} className="hover:underline">
                 <Badge variant="secondary" className="flex items-center gap-1">
                   {company.logo && (
                     <img src={company.logo} alt="" className="w-4 h-4 rounded-sm" />
                   )}
                   {company.name}
                 </Badge>
               </a>
             </div>
           )}
           
           <p className="text-sm text-muted-foreground flex flex-wrap items-center gap-x-1.5 gap-y-1">
            <MapPin className="h-4 w-4" aria-hidden />
            <span>{profile?.ort || '—'}</span>
            {profile?.branche && <span> • {profile.branche}</span>}
            {getEmployerOrSchool(profile) && <span> • {getEmployerOrSchool(profile)}</span>}
          </p>
        </div>
      </div>
    </div>
  );
};