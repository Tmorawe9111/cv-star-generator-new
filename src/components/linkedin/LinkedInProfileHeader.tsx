import React, { useState, useRef } from 'react';
import { Camera, MapPin, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
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
  const { refetchProfile, user } = useAuth();
  const queryClient = useQueryClient();
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const isOwner = user?.id === profile?.id;

  // Format branch name (capitalize + expand abbreviations)
  const formatBranche = (branche: string) => {
    if (!branche) return '';
    // Expand common abbreviations
    if (branche.toLowerCase() === 'it') return 'Informationstechnik';
    // Capitalize first letter
    return branche.charAt(0).toUpperCase() + branche.slice(1);
  };

  // Get the status label and info line based on user status
  const getProfileInfo = (p: any) => {
    if (!p) return { statusLine: '', location: '' };
    
    const branche = p.branche || '';
    const ort = p.ort || '';
    
    // Get current/latest job from berufserfahrung
    const currentJob = p.berufserfahrung?.find((job: any) => {
      if (!job.zeitraum_bis || job.zeitraum_bis === 'heute' || job.zeitraum_bis === '') return true;
      try {
        const bisDate = new Date(job.zeitraum_bis);
        return bisDate > new Date();
      } catch {
        return false;
      }
    }) || p.berufserfahrung?.[0]; // Fallback to first entry
    
    switch (p.status) {
      case 'schueler':
        // Schüler: "Schüler • Interessiert an [Branche]"
        const schuelerBranche = formatBranche(branche);
        return {
          statusLine: schuelerBranche ? `Schüler • Interessiert an ${schuelerBranche}` : 'Schüler',
          location: ort
        };
        
      case 'azubi':
        // "Ausbildung bei [Firma] • [Branche]"
        const azubiFirma = currentJob?.unternehmen || p.ausbildungsbetrieb || '';
        const azubiBranche = formatBranche(branche);
        if (azubiFirma && azubiBranche) {
          return {
            statusLine: `Ausbildung bei ${azubiFirma} • ${azubiBranche}`,
            location: ort
          };
        } else if (azubiFirma) {
          return {
            statusLine: `Ausbildung bei ${azubiFirma}`,
            location: ort
          };
        } else if (azubiBranche) {
          return {
            statusLine: `Ausbildung • ${azubiBranche}`,
            location: ort
          };
        }
        return {
          statusLine: 'In Ausbildung',
          location: ort
        };
        
      case 'ausgelernt':
        // Fachkraft: "[Position] bei [Firma] • [Branche]"
        const position = currentJob?.position || currentJob?.titel || p.aktueller_beruf || '';
        const firma = currentJob?.unternehmen || '';
        const fachkraftBranche = formatBranche(branche);
        
        if (position && firma && fachkraftBranche) {
          return {
            statusLine: `${position} bei ${firma} • ${fachkraftBranche}`,
            location: ort
          };
        } else if (position && firma) {
          return {
            statusLine: `${position} bei ${firma}`,
            location: ort
          };
        } else if (position && fachkraftBranche) {
          return {
            statusLine: `${position} • ${fachkraftBranche}`,
            location: ort
          };
        } else if (firma && fachkraftBranche) {
          return {
            statusLine: `${firma} • ${fachkraftBranche}`,
            location: ort
          };
        } else if (position) {
          return {
            statusLine: position,
            location: ort
          };
        } else if (fachkraftBranche) {
          return {
            statusLine: fachkraftBranche,
            location: ort
          };
        }
        return {
          statusLine: 'Fachkraft',
          location: ort
        };
        
      default:
        return {
          statusLine: formatBranche(branche) || '',
          location: ort
        };
    }
  };

  const handleCoverUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const inputEl = event.target;
    const file = inputEl.files?.[0];
    if (!file) {
      inputEl.value = '';
      return;
    }

    setIsUploadingCover(true);
    try {
      const { uploadCoverImage } = await import('@/lib/supabase-storage');
      const uploadResult = await uploadCoverImage(file);

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase
          .from('profiles')
          .update({ cover_image_url: uploadResult.url })
          .eq('id', user.id);
        
        if (error) throw error;
        
        onProfileUpdate({ cover_image_url: uploadResult.url });
        
        await supabase
          .from('profiles')
          .update({ cover_url: uploadResult.url, titelbild_url: uploadResult.url })
          .eq('id', user.id);
        
        queryClient.invalidateQueries({ queryKey: ['user-profile'] });
        await refetchProfile?.();
        
        toast({ title: "Titelbild hochgeladen", description: "Ihr Titelbild wurde erfolgreich aktualisiert." });
      }
    } catch (error) {
      console.error('Error uploading cover:', error);
      toast({ 
        title: "Upload fehlgeschlagen", 
        description: "Das Titelbild konnte nicht hochgeladen werden.",
        variant: "destructive"
      });
    } finally {
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
      const { uploadProfileImage } = await import('@/lib/supabase-storage');
      const uploadResult = await uploadProfileImage(file);
      
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

  const { statusLine, location } = getProfileInfo(profile);
  const coverUrl = profile?.cover_image_url || profile?.cover_url || profile?.titelbild_url;

  return (
    <div className="relative bg-background rounded-xl shadow-sm border overflow-visible">
      {/* Cover Photo - Clickable to change */}
      <div 
        className={`relative h-28 sm:h-32 md:h-36 lg:h-44 overflow-hidden rounded-t-xl bg-gradient-to-r from-primary/10 via-primary/5 to-accent/10 ${isOwner ? 'cursor-pointer group' : ''}`}
        onClick={() => isOwner && coverInputRef.current?.click()}
      >
        {coverUrl ? (
          <img 
            src={normalizeImageUrl(coverUrl as string) || coverUrl as string}
            alt="Titelbild" 
            className="w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-[1.02]"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/10 via-primary/5 to-accent/10" />
        )}

        {/* Hover overlay for cover change */}
        {isOwner && (
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 text-white px-3 py-1.5 rounded-full text-sm flex items-center gap-2">
              {isUploadingCover ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Camera className="h-4 w-4" />
              )}
              {isUploadingCover ? 'Lädt...' : 'Titelbild ändern'}
            </div>
          </div>
        )}
        
        <input
          ref={coverInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleCoverUpload}
        />
      </div>

      {/* Profile Info - Clean Apple Style */}
      <div className="px-4 sm:px-5 md:px-6 pb-4 sm:pb-5 md:pb-6">
        {/* Avatar - Overlapping cover */}
        <div className="relative -mt-10 sm:-mt-12 md:-mt-14 mb-3 sm:mb-4">
          <div className="relative inline-block">
            <Avatar className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 border-4 border-background shadow-lg ring-2 ring-background">
              <AvatarImage src={profile?.avatar_url} alt="Profilbild" loading="lazy" decoding="async" />
              <AvatarFallback className="text-lg sm:text-xl md:text-2xl font-semibold bg-primary/10 text-primary">
                {profile?.vorname?.[0]}{profile?.nachname?.[0]}
              </AvatarFallback>
            </Avatar>
            {isOwner && (
              <label 
                htmlFor="avatar-upload" 
                className="absolute -bottom-1 -right-1 h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-background border-2 border-background shadow-md flex items-center justify-center cursor-pointer hover:bg-muted transition-colors"
              >
                {isUploadingAvatar ? (
                  <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin text-muted-foreground" />
                ) : (
                  <Camera className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                )}
              </label>
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

        {/* Name and Info - Minimal and Clean */}
        <div className="space-y-1">
          {/* Name */}
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground tracking-tight">
            {profile?.vorname} {profile?.nachname}
          </h1>
          
          {/* Status Line - One clear line */}
          {statusLine && (
            <p className="text-sm sm:text-base text-foreground/80 font-medium">
              {statusLine}
            </p>
          )}
          
          {/* Location - Subtle */}
          {location && (
            <p className="text-sm text-muted-foreground flex items-center gap-1.5 pt-0.5">
              <MapPin className="h-3.5 w-3.5" />
              {location}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
