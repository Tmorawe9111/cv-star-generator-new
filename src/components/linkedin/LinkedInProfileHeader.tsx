import React, { useState, useRef } from 'react';
import { Camera, MapPin, Loader2, Users } from 'lucide-react';
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
  actionButtons?: React.ReactNode;
  connectionCount?: number;
  mutualConnections?: Array<{ id: string; avatar_url: string | null; name: string }>;
  mutualCount?: number;
}

export const LinkedInProfileHeader: React.FC<LinkedInProfileHeaderProps> = ({
  profile,
  isEditing,
  onProfileUpdate,
  onStartEdit,
  onCancelEdit,
  onSave,
  isSaving = false,
  actionButtons,
  connectionCount,
  mutualConnections = [],
  mutualCount = 0
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

  // Parse date string (format: "YYYY-MM" or "YYYY" or empty)
  const parseDate = (dateStr: string): { year: number; month: number } | null => {
    if (!dateStr || dateStr === 'heute' || dateStr === '0000') return null;
    
    const parts = dateStr.split('-');
    const year = parseInt(parts[0] || '0');
    const month = parts[1] ? parseInt(parts[1]) : 1;
    
    if (isNaN(year) || year === 0) return null;
    return { year, month: isNaN(month) ? 1 : month };
  };

  // Check if a date is in the future (current/ongoing)
  const isFutureOrCurrent = (dateStr: string): boolean => {
    if (!dateStr || dateStr === 'heute' || dateStr === '') return true;
    const date = parseDate(dateStr);
    if (!date) return false;
    
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    
    // If year is in the future, it's current
    if (date.year > currentYear) return true;
    // If same year and month is in the future or current, it's current
    if (date.year === currentYear && date.month >= currentMonth) return true;
    
    return false;
  };

  // Get sort value for a job/education
  const getSortValue = (item: {
    zeitraum_von: string;
    zeitraum_bis: string;
  }): { isCurrent: boolean; value: number } => {
    const isCurrent = !item.zeitraum_bis || item.zeitraum_bis === 'heute' || item.zeitraum_bis === '' || isFutureOrCurrent(item.zeitraum_bis);
    const vonDate = parseDate(item.zeitraum_von);
    const bisDate = parseDate(item.zeitraum_bis);

    if (isCurrent) {
      // Current items: sort by start date (most recent first)
      if (vonDate) {
        return { 
          isCurrent: true, 
          value: vonDate.year * 10000 + vonDate.month * 100
        };
      }
      return { isCurrent: true, value: 0 };
    }

    // Past items: sort by end date (most recent first)
    if (bisDate) {
      return { 
        isCurrent: false, 
        value: bisDate.year * 10000 + bisDate.month * 100 
      };
    }

    // If no end date, sort by start date
    if (vonDate) {
      return { 
        isCurrent: false, 
        value: vonDate.year * 10000 + vonDate.month * 100 
      };
    }

    return { isCurrent: false, value: 0 };
  };

  // Get the latest experience and education
  const getLatestExperience = (experiences: any[]) => {
    if (!experiences || experiences.length === 0) return null;
    
    const sorted = [...experiences]
      .map((item) => ({ item, sort: getSortValue(item) }))
      .sort((a, b) => {
        // Current items always come first
        if (a.sort.isCurrent && !b.sort.isCurrent) return -1;
        if (!a.sort.isCurrent && b.sort.isCurrent) return 1;
        
        // Both current: sort descending (most recent start first)
        if (a.sort.isCurrent && b.sort.isCurrent) {
          return b.sort.value - a.sort.value;
        }
        
        // Both past: sort descending (most recent first)
        return b.sort.value - a.sort.value;
      });
    
    return sorted.length > 0 ? sorted[0].item : null;
  };

  const getLatestEducation = (education: any[]) => {
    if (!education || education.length === 0) return null;
    
    const sorted = [...education]
      .map((item) => ({ item, sort: getSortValue(item) }))
      .sort((a, b) => {
        // Current items always come first
        if (a.sort.isCurrent && !b.sort.isCurrent) return -1;
        if (!a.sort.isCurrent && b.sort.isCurrent) return 1;
        
        // Both current: sort descending (most recent start first)
        if (a.sort.isCurrent && b.sort.isCurrent) {
          return b.sort.value - a.sort.value;
        }
        
        // Both past: sort descending (most recent first)
        return b.sort.value - a.sort.value;
      });
    
    return sorted.length > 0 ? sorted[0].item : null;
  };

  // Get the status label and info line based on user status
  const getProfileInfo = (p: any) => {
    if (!p) return { statusLine: '', location: '', latestExperience: null, latestEducation: null };
    
    const branche = p.branche || '';
    const ort = p.ort || '';
    
    // Get latest experience and education using sorting logic
    const latestExperience = getLatestExperience(p.berufserfahrung || []);
    const latestEducation = getLatestEducation(p.schulbildung || []);
    
    // Get current/latest job from berufserfahrung (for status line)
    const currentJob = latestExperience || p.berufserfahrung?.[0]; // Fallback to first entry
    
    switch (p.status) {
      case 'schueler':
        // Schüler: "Schüler • Interessiert an [Branche]"
        const schuelerBranche = formatBranche(branche);
        return {
          statusLine: schuelerBranche ? `Schüler • Interessiert an ${schuelerBranche}` : 'Schüler',
          location: ort,
          latestExperience,
          latestEducation
        };
        
      case 'azubi':
        // "Ausbildung bei [Firma] • [Branche]"
        const azubiFirma = currentJob?.unternehmen || p.ausbildungsbetrieb || '';
        const azubiBranche = formatBranche(branche);
        if (azubiFirma && azubiBranche) {
          return {
            statusLine: `Ausbildung bei ${azubiFirma} • ${azubiBranche}`,
            location: ort,
            latestExperience,
            latestEducation
          };
        } else if (azubiFirma) {
          return {
            statusLine: `Ausbildung bei ${azubiFirma}`,
            location: ort,
            latestExperience,
            latestEducation
          };
        } else if (azubiBranche) {
          return {
            statusLine: `Ausbildung • ${azubiBranche}`,
            location: ort,
            latestExperience,
            latestEducation
          };
        }
        return {
          statusLine: 'In Ausbildung',
          location: ort,
          latestExperience,
          latestEducation
        };
        
      case 'ausgelernt':
        // Fachkraft: "[Position] bei [Firma] • [Branche]"
        const position = currentJob?.position || currentJob?.titel || p.aktueller_beruf || '';
        const firma = currentJob?.unternehmen || '';
        const fachkraftBranche = formatBranche(branche);
        
        if (position && firma && fachkraftBranche) {
          return {
            statusLine: `${position} bei ${firma} • ${fachkraftBranche}`,
            location: ort,
            latestExperience,
            latestEducation
          };
        } else if (position && firma) {
          return {
            statusLine: `${position} bei ${firma}`,
            location: ort,
            latestExperience,
            latestEducation
          };
        } else if (position && fachkraftBranche) {
          return {
            statusLine: `${position} • ${fachkraftBranche}`,
            location: ort,
            latestExperience,
            latestEducation
          };
        } else if (firma && fachkraftBranche) {
          return {
            statusLine: `${firma} • ${fachkraftBranche}`,
            location: ort,
            latestExperience,
            latestEducation
          };
        } else if (position) {
          return {
            statusLine: position,
            location: ort,
            latestExperience,
            latestEducation
          };
        } else if (fachkraftBranche) {
          return {
            statusLine: fachkraftBranche,
            location: ort,
            latestExperience,
            latestEducation
          };
        }
        return {
          statusLine: 'Fachkraft',
          location: ort,
          latestExperience,
          latestEducation
        };
        
      default:
        return {
          statusLine: formatBranche(branche) || '',
          location: ort,
          latestExperience,
          latestEducation
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

  const { statusLine, location, latestExperience, latestEducation } = getProfileInfo(profile);
  const coverUrl = profile?.cover_image_url || profile?.cover_url || profile?.titelbild_url;

  // Format date as MM.YYYY (German format)
  const formatMonthYear = (date: Date | string | undefined) => {
    if (!date) return '';
    
    // Handle string formats: "YYYY-MM" or "YYYY"
    if (typeof date === 'string') {
      if (date === 'heute' || date === '') return '';
      
      const parts = date.split('-');
      const year = parseInt(parts[0] || '0');
      
      if (isNaN(year) || year === 0) return '';
      
      // If only year provided (format: "YYYY")
      if (parts.length === 1) {
        return year.toString();
      }
      
      // If month and year provided (format: "YYYY-MM")
      const month = parseInt(parts[1] || '1');
      if (isNaN(month) || month < 1 || month > 12) return year.toString();
      
      return `${String(month).padStart(2, '0')}.${year}`;
    }
    
    // Handle Date object
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${month}.${year}`;
  };

  // Format experience/education display text
  const formatExperienceText = (exp: any) => {
    if (!exp) return null;
    const position = exp.titel || exp.position || '';
    const company = exp.unternehmen || exp.firma || '';
    const abschluss = exp.abschluss || '';
    const from = formatMonthYear(exp.zeitraum_von);
    const to = exp.zeitraum_bis && exp.zeitraum_bis !== 'heute' && exp.zeitraum_bis !== '' 
      ? formatMonthYear(exp.zeitraum_bis) 
      : 'Heute';
    
    let baseText = '';
    if (position && company) {
      baseText = `${position} bei ${company}`;
    } else if (position) {
      baseText = position;
    } else if (company) {
      baseText = company;
    } else {
      return null;
    }
    
    // Add Abschluss if available
    if (abschluss) {
      baseText += ` • ${abschluss}`;
    }
    
    return `${baseText} (${from} - ${to})`;
  };

  const formatEducationText = (edu: any) => {
    if (!edu) return null;
    // Schulbildung uses 'name' for school name and 'schulform' for degree/type
    const school = edu.name || edu.schule || edu.schulname || '';
    const degree = edu.schulform || edu.abschluss || edu.abschlussart || '';
    const from = formatMonthYear(edu.zeitraum_von);
    const to = edu.zeitraum_bis && edu.zeitraum_bis !== 'heute' && edu.zeitraum_bis !== '' 
      ? formatMonthYear(edu.zeitraum_bis) 
      : 'Heute';
    
    if (school && degree) {
      return `${degree} an ${school} (${from} - ${to})`;
    } else if (school) {
      return `${school} (${from} - ${to})`;
    } else if (degree) {
      return `${degree} (${from} - ${to})`;
    }
    return null;
  };

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
          
          {/* Latest Experience - Under branche */}
          {latestExperience && (() => {
            const expText = formatExperienceText(latestExperience);
            return expText ? (
              <p className="text-sm text-muted-foreground mt-1">
                {expText}
              </p>
            ) : null;
          })()}
          
          {/* Latest Education - Always shown if available */}
          {latestEducation && (() => {
            const eduText = formatEducationText(latestEducation);
            return eduText ? (
              <p className="text-sm text-muted-foreground mt-1">
                {eduText}
              </p>
            ) : null;
          })()}
          
          {/* Location - Subtle */}
          {location && (
            <p className="text-sm text-muted-foreground flex items-center gap-1.5 pt-1">
              <MapPin className="h-3.5 w-3.5" />
              {location}
            </p>
          )}
        </div>

        {/* Connection Stats & Mutual Connections - Apple Style */}
        <div className="mt-5 space-y-3.5">
          {/* Connection Count - Clean Apple Style */}
          {connectionCount !== undefined && connectionCount > 0 && (
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center h-8 w-8 rounded-full bg-muted/50">
                <Users className="h-4 w-4 text-muted-foreground" strokeWidth={2} />
              </div>
              <div className="flex flex-col gap-0">
                <span className="text-[13px] font-semibold text-foreground tracking-tight">
                  {connectionCount} {connectionCount === 1 ? 'Kontakt' : 'Kontakte'}
                </span>
                <span className="text-[11px] text-muted-foreground/70 font-normal">
                  Verbindungen
                </span>
              </div>
            </div>
          )}

          {/* Mutual Connections - Apple Style with subtle divider */}
          {!isOwner && mutualCount > 0 && mutualConnections.length > 0 && (
            <div className="flex flex-col gap-2.5 pt-3 border-t border-border/40">
              <div className="flex items-start gap-3.5">
                {/* Overlapping Avatars - Refined Apple Style */}
                <div className="flex -space-x-2.5 flex-shrink-0">
                  {mutualConnections.slice(0, 3).map((mutual, idx) => (
                    <Avatar 
                      key={mutual.id} 
                      className="h-9 w-9 border-2 border-background ring-1 ring-border/30 shadow-sm hover:ring-border/50 transition-all"
                      style={{ zIndex: 3 - idx }}
                    >
                      <AvatarImage src={mutual.avatar_url ?? undefined} alt={mutual.name} className="object-cover" />
                      <AvatarFallback className="text-[11px] font-semibold bg-gradient-to-br from-muted to-muted/80 text-foreground">
                        {mutual.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                  {mutualCount > 3 && (
                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-muted to-muted/80 border-2 border-background ring-1 ring-border/30 flex items-center justify-center shadow-sm">
                      <span className="text-[11px] font-semibold text-foreground">+{mutualCount - 3}</span>
                    </div>
                  )}
                </div>
                {/* Text - Clean Typography */}
                <div className="flex flex-col gap-1 flex-1 min-w-0">
                  <span className="text-[14px] text-foreground font-semibold tracking-tight leading-tight">
                    {mutualCount === 1 ? 'Gemeinsamer Kontakt' : `${mutualCount} gemeinsame Kontakte`}
                  </span>
                  {mutualConnections.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {mutualConnections.slice(0, 2).map((mutual, idx) => (
                        <span key={mutual.id} className="text-[12px] text-muted-foreground font-medium tracking-tight">
                          {mutual.name}{idx < Math.min(mutualConnections.length, 2) - 1 && ','}
                        </span>
                      ))}
                      {mutualCount > 2 && (
                        <span className="text-[12px] text-muted-foreground/70 font-normal tracking-tight">
                          und {mutualCount - 2} weitere
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons - Follow/Message/Unfollow */}
        {actionButtons && !isOwner && (
          <div className="mt-4 flex flex-wrap gap-2">
            {actionButtons}
          </div>
        )}
      </div>
    </div>
  );
};
