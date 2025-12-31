import React, { useRef, useCallback, useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { 
  UserPlus, Heart, MessageCircle, Building2, ChevronRight, 
  Sparkles, Users, FileText, Briefcase, MapPin, ChevronLeft, X, CheckCircle2,
  WifiOff, RefreshCw
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useMyApplications } from '@/hooks/useMyApplications';
import { useConnections, type ConnectionState } from '@/hooks/useConnections';
import { useFollowCompany } from '@/hooks/useFollowCompany';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

// Haptic feedback helper
const triggerHaptic = (type: 'light' | 'medium' | 'heavy' = 'light') => {
  if ('vibrate' in navigator) {
    const patterns = { light: 10, medium: 25, heavy: 50 };
    navigator.vibrate(patterns[type]);
  }
};

// Online status hook
const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  return isOnline;
};

// Fisher-Yates shuffle algorithm
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

type Person = { 
  id: string; 
  vorname?: string | null; 
  nachname?: string | null; 
  avatar_url?: string | null;
  bio?: string | null;
  branche?: string | null;
  stadt?: string | null;
  ort?: string | null;
  status?: string | null;
  schule?: string | null;
  ausbildungsberuf?: string | null;
  ausbildungsbetrieb?: string | null;
  aktueller_beruf?: string | null;
  berufserfahrung?: any;
  schulbildung?: any;
  mutualConnections?: Array<{ id: string; avatar_url: string | null; name: string }>;
  mutualCount?: number;
  commonSchools?: string[];
  commonJobs?: Array<{ company: string; position: string }>;
};

type Company = { 
  id: string; 
  name: string; 
  logo_url?: string | null;
  industry?: string | null;
  city?: string | null;
};

type Post = {
  id: string;
  content: string;
  image_url?: string | null;
  user_id: string;
  created_at: string;
  likes_count?: number;
  comments_count?: number;
};

type Job = {
  id: string;
  title: string;
  company_id: string;
  location?: string | null;
  employment_type?: string | null;
  salary_min?: number | null;
  salary_max?: number | null;
};

// Section Header - Einheitlich (fixed height)
const SectionHeader: React.FC<{ 
  title: string; 
  icon: React.ReactNode; 
  onSeeAll?: () => void;
  seeAllText?: string;
}> = ({ title, icon, onSeeAll, seeAllText = 'Alle' }) => (
  <div className="flex items-center justify-between px-4 mb-2 h-7">
    <div className="flex items-center gap-1.5">
      <span className="flex items-center justify-center w-5 h-5">{icon}</span>
      <h2 className="text-base font-semibold text-gray-900 leading-none">{title}</h2>
    </div>
    {onSeeAll && (
      <button 
        onClick={onSeeAll}
        className="text-blue-500 text-xs font-medium flex items-center active:opacity-70"
      >
        {seeAllText} <ChevronRight className="h-3.5 w-3.5" />
      </button>
    )}
  </div>
);

// Card für "Für dich" - Apple/Instagram Style
const ForYouCard: React.FC<{ 
  item: Person | Company; 
  type: 'person' | 'company';
  onAction: () => void;
  actionLabel: string;
  actionDone?: boolean;
  index: number;
}> = ({ item, type, onAction, actionLabel, actionDone, index }) => {
  const isPerson = type === 'person';
  const person = item as Person;
  const company = item as Company;
  
  const name = isPerson 
    ? `${person.vorname ?? ''} ${person.nachname ?? ''}`.trim() || 'Unbekannt'
    : company.name;
  const branche = isPerson ? person.branche : company.industry;
  const stadt = isPerson ? (person.ort || person.stadt) : company.city;
  const imageUrl = isPerson ? person.avatar_url : company.logo_url;
  const linkTo = isPerson ? `/u/${person.id}` : `/companies/${company.id}`;
  
  // Get status info for person
  const getStatusInfo = () => {
    if (!isPerson) return null;
    if (person.status === 'schueler') {
      const schoolName = person.schule || (Array.isArray(person.schulbildung) && person.schulbildung.length > 0 
        ? (person.schulbildung[0]?.name || person.schulbildung[0]?.schule) 
        : null);
      if (schoolName) {
        const text = `Schüler (an ${schoolName})`;
        return text.length > 28 ? text.substring(0, 25) + '...' : text;
      }
      return 'Schüler';
    }
    if (person.status === 'azubi') {
      if (person.ausbildungsbetrieb) {
        const text = `Azubi bei ${person.ausbildungsbetrieb}`;
        return text.length > 28 ? text.substring(0, 25) + '...' : text;
      }
      return 'Azubi';
    }
    if (person.status === 'ausgelernt' || person.status === 'fachkraft') {
      const jobTitle = person.aktueller_beruf || (Array.isArray(person.berufserfahrung) && person.berufserfahrung.length > 0 
        ? (person.berufserfahrung[0]?.position || person.berufserfahrung[0]?.titel)
        : null);
      const company = Array.isArray(person.berufserfahrung) && person.berufserfahrung.length > 0 
        ? (person.berufserfahrung[0]?.unternehmen || person.berufserfahrung[0]?.company)
        : person.ausbildungsbetrieb;
      
      if (jobTitle && company) {
        const text = `${jobTitle} bei ${company}`;
        return text.length > 28 ? text.substring(0, 25) + '...' : text;
      }
      if (jobTitle) return jobTitle.length > 28 ? jobTitle.substring(0, 25) + '...' : jobTitle;
    }
    return branche || null;
  };
  
  const statusInfo = getStatusInfo();
  const mutualCount = isPerson 
    ? (person.mutualCount || [3, 7, 2, 5, 4, 8, 6, 9, 1, 11][index % 10])
    : [3, 7, 2, 5, 4, 8, 6, 9, 1, 11][index % 10];
  const mutualNames = isPerson && person.mutualConnections
    ? person.mutualConnections.slice(0, 2).map(c => c.name)
    : ['Sarah M.', 'Tom K.'].slice(0, Math.min(mutualCount, 2));
  // Only use avatars for the first 2 contacts (matching the names displayed)
  const mutualAvatars = isPerson && person.mutualConnections
    ? person.mutualConnections.slice(0, 2).map(c => c.avatar_url)
    : DEMO_AVATARS.slice(0, Math.min(mutualCount, 2));

  // Gradient colors
  const gradients = [
    'from-amber-500/10 via-orange-500/5 to-red-500/10',
    'from-emerald-500/10 via-teal-500/5 to-cyan-500/10',
    'from-violet-500/10 via-purple-500/5 to-pink-500/10',
    'from-blue-500/10 via-indigo-500/5 to-violet-500/10',
    'from-rose-500/10 via-pink-500/5 to-fuchsia-500/10',
  ];
  const gradient = gradients[index % 5];

  return (
    <div className={cn(
      "min-w-[156px] w-[156px] h-[280px] rounded-[20px] p-3 flex flex-col relative overflow-hidden",
      "bg-gradient-to-br", gradient,
      "border border-white/60 shadow-[0_2px_20px_-4px_rgba(0,0,0,0.1)]",
      "backdrop-blur-sm transition-all duration-300 active:scale-[0.98]"
    )}>
      {/* Shine effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent pointer-events-none" />
      
      <Link to={linkTo} className="flex flex-col items-center relative z-10 flex-1">
        {/* Avatar - Fixed position */}
        <div className="relative mb-2 h-[56px] flex items-center justify-center">
          {isPerson ? (
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full opacity-20 blur-sm" />
              <Avatar className="h-14 w-14 ring-2 ring-white shadow-lg">
                <AvatarImage src={imageUrl ?? undefined} className="object-cover" />
                <AvatarFallback className="text-lg font-bold bg-gradient-to-br from-blue-100 to-purple-100 text-gray-700">
                  {name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
          ) : (
            <div className="relative">
              <div className="h-14 w-14 rounded-2xl bg-white flex items-center justify-center overflow-hidden shadow-lg ring-1 ring-black/5">
                {imageUrl ? (
                  <img src={imageUrl} alt={name} className="h-full w-full object-cover" />
                ) : (
                  <Building2 className="h-7 w-7 text-gray-400" />
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Name - Fixed height, max 2 lines */}
        <div className="h-[32px] w-full flex items-center justify-center mb-0.5">
          <p className="font-semibold text-[13px] text-gray-900 line-clamp-2 text-center leading-tight px-1">
            {name}
          </p>
        </div>
        
        {/* Status/Branche - Fixed height */}
        <div className="h-[14px] w-full flex items-center justify-center mb-0.5">
          {statusInfo ? (
            <p className="text-[10px] text-gray-600 truncate w-full text-center leading-tight px-1" title={statusInfo}>
              {statusInfo}
            </p>
          ) : branche ? (
            <p className="text-[10px] text-gray-600 truncate w-full text-center leading-tight px-1">
              {branche}
            </p>
          ) : (
            <div className="h-[14px]" />
          )}
        </div>
        
        {/* Standort - Fixed height */}
        <div className="h-[14px] w-full flex items-center justify-center">
          {stadt ? (
            <p className="text-[10px] text-gray-400 truncate w-full text-center flex items-center justify-center gap-0.5 px-1">
              <MapPin className="h-2.5 w-2.5 shrink-0" />
              <span className="truncate">{stadt}</span>
            </p>
          ) : (
            <div className="h-[14px]" />
          )}
        </div>
      </Link>
      
      {/* Gemeinsame Kontakte / Mitarbeiter - Fixed position at bottom */}
      <div className="h-[50px] flex items-center justify-center mt-auto mb-2 relative z-10 w-full">
        {mutualCount > 0 ? (
          <OverlappingAvatars 
            avatars={mutualAvatars} 
            count={mutualCount}
            label={isPerson ? '' : `${mutualCount} Mitarbeiter`}
            type={isPerson ? 'mutual' : 'employees'}
            names={isPerson ? mutualNames : []}
          />
        ) : (
          <div className="h-[50px]" />
        )}
      </div>

      {/* Button - Fixed position at bottom */}
      <div className="relative z-10 h-[36px] flex items-center">
        <Button 
          size="sm" 
          onClick={onAction}
          disabled={actionDone}
          className={cn(
            "w-full h-9 text-xs rounded-full font-semibold shadow-lg active:scale-95 transition-all",
            actionDone 
              ? "bg-gray-100/80 text-gray-500 shadow-none" 
              : "bg-black hover:bg-gray-800 text-white shadow-black/20"
          )}
        >
          {actionDone ? '✓' : actionLabel}
        </Button>
      </div>
    </div>
  );
};

// Placeholder avatars for demo
const DEMO_AVATARS = [
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
];

// Overlapping Avatars Component - fixed height for alignment with names (centered)
// Shows actual avatars of the 2 contacts that are mentioned by name
const OverlappingAvatars: React.FC<{ 
  avatars: (string | null)[]; 
  count: number;
  label: string;
  type?: 'mutual' | 'employees';
  names?: string[];
}> = ({ avatars, count, label, type = 'mutual', names = [] }) => {
  const displayNames = names.slice(0, 2);
  const remainingCount = count > 2 ? count - 2 : 0;
  
  // Use actual avatars for the first 2 contacts (matching the names)
  // Only show avatars that correspond to the displayed names
  const displayAvatars = avatars.slice(0, Math.min(2, displayNames.length));
  
  return (
    <div className="flex flex-col items-center gap-1.5 h-[50px] justify-center w-full">
      <div className="flex -space-x-1.5 justify-center">
        {displayAvatars.map((url, i) => (
          <Avatar key={i} className="h-5 w-5 border-[1.5px] border-white ring-0.5 ring-gray-200/50">
            <AvatarImage src={url || undefined} className="object-cover" />
            <AvatarFallback className="text-[8px] bg-gray-200">
              {displayNames[i] ? displayNames[i].slice(0, 2).toUpperCase() : 'U'}
            </AvatarFallback>
          </Avatar>
        ))}
        {/* Show third avatar indicator if there are more than 2 contacts */}
        {count > 2 && (
          <div className="h-5 w-5 rounded-full bg-gray-100 border-[1.5px] border-white ring-0.5 ring-gray-200/50 flex items-center justify-center">
            <span className="text-[8px] font-semibold text-gray-600">+{remainingCount}</span>
          </div>
        )}
      </div>
      {type === 'mutual' && count > 0 ? (
        <div className="flex flex-wrap items-center justify-center gap-x-1 gap-y-0.5 text-center px-1">
          {displayNames.map((name, idx) => (
            <span key={idx} className="text-[9px] text-gray-700 font-medium leading-none">
              {name}{idx < displayNames.length - 1 && ','}
            </span>
          ))}
          {remainingCount > 0 && (
            <span className="text-[9px] text-gray-500 font-light leading-none">
              und {remainingCount} weitere gemeinsame Kontakte
            </span>
          )}
          {count === 1 && displayNames.length === 1 && (
            <span className="text-[9px] text-gray-500 font-light leading-none">
              gemeinsamer Kontakt
            </span>
          )}
          {count === 2 && displayNames.length === 2 && (
            <span className="text-[9px] text-gray-500 font-light leading-none">
              gemeinsame Kontakte
            </span>
          )}
        </div>
      ) : (
        count > 0 && (
          <span className="text-[9px] text-gray-500 leading-none text-center">
            {label || (count > 1 ? `${count} gemeinsame` : '1 gemeinsamer')}
          </span>
        )
      )}
    </div>
  );
};

// Neue Person Card - Apple/Instagram Style
const PersonCard: React.FC<{ 
  person: Person; 
  onConnect: () => void; 
  status: ConnectionState;
  index?: number;
}> = ({ person, onConnect, status, index = 0 }) => {
  const name = `${person.vorname ?? ''} ${person.nachname ?? ''}`.trim() || 'Unbekannt';
  const isConnected = status === 'accepted';
  const isPending = status === 'pending';
  
  // Use real mutual connections or test data
  const mutualConnections = person.mutualConnections || [];
  const mutualCount = person.mutualCount || (mutualConnections.length > 0 ? mutualConnections.length : [4, 2, 6, 3, 8, 5, 1, 7, 9, 3][index % 10]);
  const mutualNames = mutualConnections.length > 0 
    ? mutualConnections.slice(0, 2).map(c => c.name)
    : ['Sarah M.', 'Tom K.'].slice(0, Math.min(mutualCount, 2));
  // Only use avatars for the first 2 contacts (matching the names displayed)
  const mutualAvatars = mutualConnections.length > 0
    ? mutualConnections.slice(0, 2).map(c => c.avatar_url)
    : DEMO_AVATARS.slice(0, Math.min(mutualCount, 2));

  // Get status-specific info
  const getStatusInfo = () => {
    if (person.status === 'schueler') {
      const schoolName = person.schule || (Array.isArray(person.schulbildung) && person.schulbildung.length > 0 
        ? (person.schulbildung[0]?.name || person.schulbildung[0]?.schule) 
        : null);
      if (schoolName) {
        const text = `Schüler (an ${schoolName})`;
        return text.length > 28 ? text.substring(0, 25) + '...' : text;
      }
      return 'Schüler';
    }
    if (person.status === 'azubi') {
      if (person.ausbildungsbetrieb) {
        const text = `Azubi bei ${person.ausbildungsbetrieb}`;
        return text.length > 28 ? text.substring(0, 25) + '...' : text;
      }
      if (person.ausbildungsberuf) {
        return `Azubi (${person.ausbildungsberuf})`;
      }
      return 'Azubi';
    }
    if (person.status === 'ausgelernt' || person.status === 'fachkraft') {
      const jobTitle = person.aktueller_beruf || (Array.isArray(person.berufserfahrung) && person.berufserfahrung.length > 0 
        ? (person.berufserfahrung[0]?.position || person.berufserfahrung[0]?.titel || person.berufserfahrung[0]?.beruf)
        : null);
      const company = Array.isArray(person.berufserfahrung) && person.berufserfahrung.length > 0 
        ? (person.berufserfahrung[0]?.unternehmen || person.berufserfahrung[0]?.company)
        : person.ausbildungsbetrieb;
      
      if (jobTitle && company) {
        const text = `${jobTitle} bei ${company}`;
        return text.length > 28 ? text.substring(0, 25) + '...' : text;
      }
      if (jobTitle) {
        const text = jobTitle;
        return text.length > 28 ? text.substring(0, 25) + '...' : text;
      }
      if (person.branche) {
        return person.branche;
      }
    }
    return person.branche || null;
  };
  
  const statusInfo = getStatusInfo();
  const location = person.ort || person.stadt;

  // Gradient colors based on index for variety
  const gradients = [
    'from-violet-500/10 via-purple-500/5 to-fuchsia-500/10',
    'from-blue-500/10 via-cyan-500/5 to-teal-500/10',
    'from-rose-500/10 via-pink-500/5 to-red-500/10',
    'from-amber-500/10 via-orange-500/5 to-yellow-500/10',
    'from-emerald-500/10 via-green-500/5 to-lime-500/10',
  ];
  const gradient = gradients[index % 5];

  return (
    <div className={cn(
      "min-w-[156px] w-[156px] h-[280px] rounded-[20px] p-3 flex flex-col relative overflow-hidden",
      "bg-gradient-to-br", gradient,
      "border border-white/60 shadow-[0_2px_20px_-4px_rgba(0,0,0,0.1)]",
      "backdrop-blur-sm transition-all duration-300 active:scale-[0.98]"
    )}>
      {/* Subtle shine effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent pointer-events-none" />
      
      <Link to={`/u/${person.id}`} className="flex flex-col items-center relative z-10 flex-1">
        {/* Avatar - Fixed position */}
        <div className="relative mb-2 h-[56px] flex items-center justify-center">
          <div className="absolute -inset-1 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full opacity-20 blur-sm" />
          <Avatar className="h-14 w-14 ring-2 ring-white shadow-lg">
            <AvatarImage src={person.avatar_url ?? undefined} className="object-cover" />
            <AvatarFallback className="text-lg font-bold bg-gradient-to-br from-blue-100 to-purple-100 text-gray-700">
              {name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>
        
        {/* Name - Fixed height, max 2 lines */}
        <div className="h-[32px] w-full flex items-center justify-center mb-0.5">
          <p className="font-semibold text-[13px] text-gray-900 line-clamp-2 text-center leading-tight px-1">
            {name}
          </p>
        </div>
        
        {/* Status/Branche - Fixed height */}
        <div className="h-[14px] w-full flex items-center justify-center mb-0.5">
          {statusInfo ? (
            <p className="text-[10px] text-gray-600 truncate w-full text-center leading-tight px-1" title={statusInfo}>
              {statusInfo}
            </p>
          ) : person.branche ? (
            <p className="text-[10px] text-gray-600 truncate w-full text-center leading-tight px-1">
              {person.branche}
            </p>
          ) : (
            <div className="h-[14px]" />
          )}
        </div>
        
        {/* Standort - Fixed height */}
        <div className="h-[14px] w-full flex items-center justify-center">
          {location ? (
            <p className="text-[10px] text-gray-400 truncate w-full text-center flex items-center justify-center gap-0.5 px-1">
              <MapPin className="h-2.5 w-2.5 shrink-0" />
              <span className="truncate">{location}</span>
            </p>
          ) : (
            <div className="h-[14px]" />
          )}
        </div>
      </Link>
      
      {/* Gemeinsame Kontakte - Fixed position at bottom */}
      <div className="h-[50px] flex items-center justify-center mt-auto mb-2 relative z-10 w-full">
        {mutualCount > 0 ? (
          <OverlappingAvatars 
            avatars={mutualAvatars} 
            count={mutualCount} 
            label="" 
            type="mutual"
            names={mutualNames}
          />
        ) : (
          <div className="h-[50px]" />
        )}
      </div>

      {/* Button - Fixed position at bottom */}
      <div className="relative z-10 h-[36px] flex items-center">
        {!isConnected && !isPending ? (
          <Button 
            size="sm" 
            onClick={onConnect}
            className="w-full h-9 text-xs rounded-full bg-black hover:bg-gray-800 text-white font-semibold shadow-lg shadow-black/20 active:scale-95 transition-all"
          >
            Vernetzen
          </Button>
        ) : (
          <Button 
            size="sm" 
            variant="secondary"
            disabled
            className="w-full h-9 text-xs rounded-full bg-gray-100/80 text-gray-500 font-medium"
          >
            {isPending ? 'Angefragt' : 'Vernetzt ✓'}
          </Button>
        )}
      </div>
    </div>
  );
};

// Neue Company Card - Apple/Instagram Style
const CompanyCard: React.FC<{ 
  company: Company;
  index?: number;
}> = ({ company, index = 0 }) => {
  const { isFollowing, toggleFollow, loading } = useFollowCompany(company.id);
  
  const employeeCounts = [24, 8, 156, 42, 15, 67, 5, 89, 31, 12];
  const employeeCount = employeeCounts[index % 10];

  // Gradient colors based on index
  const gradients = [
    'from-blue-500/10 via-indigo-500/5 to-violet-500/10',
    'from-teal-500/10 via-emerald-500/5 to-green-500/10',
    'from-orange-500/10 via-amber-500/5 to-yellow-500/10',
    'from-pink-500/10 via-rose-500/5 to-red-500/10',
    'from-cyan-500/10 via-sky-500/5 to-blue-500/10',
  ];
  const gradient = gradients[index % 5];
  
  return (
    <div className={cn(
      "min-w-[156px] w-[156px] h-[280px] rounded-[20px] p-3 flex flex-col relative overflow-hidden",
      "bg-gradient-to-br", gradient,
      "border border-white/60 shadow-[0_2px_20px_-4px_rgba(0,0,0,0.1)]",
      "backdrop-blur-sm transition-all duration-300 active:scale-[0.98]"
    )}>
      {/* Subtle shine effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent pointer-events-none" />
      
      <Link to={`/companies/${company.id}`} className="flex flex-col items-center relative z-10 flex-1">
        {/* Logo - Fixed position */}
        <div className="relative mb-2 h-[56px] flex items-center justify-center">
          <div className="h-14 w-14 rounded-2xl bg-white flex items-center justify-center overflow-hidden shadow-lg ring-1 ring-black/5">
            {company.logo_url ? (
              <img src={company.logo_url} alt={company.name} className="h-full w-full object-cover" />
            ) : (
              <Building2 className="h-7 w-7 text-gray-400" />
            )}
          </div>
        </div>
        
        {/* Name - Fixed height, max 2 lines */}
        <div className="h-[32px] w-full flex items-center justify-center mb-0.5">
          <p className="font-semibold text-[13px] text-gray-900 line-clamp-2 text-center leading-tight px-1">
            {company.name}
          </p>
        </div>
        
        {/* Industry - Fixed height */}
        <div className="h-[14px] w-full flex items-center justify-center mb-0.5">
          {company.industry ? (
            <p className="text-[10px] text-gray-600 truncate w-full text-center leading-tight px-1">
              {company.industry}
            </p>
          ) : (
            <div className="h-[14px]" />
          )}
        </div>
        
        {/* Standort - Fixed height */}
        <div className="h-[14px] w-full flex items-center justify-center">
          {company.city ? (
            <p className="text-[10px] text-gray-400 truncate w-full text-center flex items-center justify-center gap-0.5 px-1">
              <MapPin className="h-2.5 w-2.5 shrink-0" />
              <span className="truncate">{company.city}</span>
            </p>
          ) : (
            <div className="h-[14px]" />
          )}
        </div>
      </Link>
      
      {/* Mitarbeiter - Fixed position at bottom */}
      <div className="h-[50px] flex items-center justify-center mt-auto mb-2 relative z-10 w-full">
        <OverlappingAvatars 
          avatars={DEMO_AVATARS} 
          count={employeeCount} 
          label={`${employeeCount} Mitarbeiter`} 
          type="employees" 
        />
      </div>

      {/* Button - Fixed position at bottom */}
      <div className="relative z-10 h-[36px] flex items-center">
        <Button 
          size="sm" 
          onClick={toggleFollow}
          disabled={loading}
          className={cn(
            "w-full h-9 text-xs rounded-full font-semibold shadow-lg active:scale-95 transition-all",
            isFollowing 
              ? "bg-gray-100/80 text-gray-600 shadow-none" 
              : "bg-black hover:bg-gray-800 text-white shadow-black/20"
          )}
        >
          {isFollowing ? 'Gefolgt ✓' : 'Folgen'}
        </Button>
      </div>
    </div>
  );
};

// Post Card für Slider mit Like-Funktion
const PostCardSlider: React.FC<{ 
  post: Post; 
  author?: { name: string; avatar_url: string | null };
  onLike?: (postId: string, liked: boolean) => void;
  onComment?: (post: Post) => void;
  isLiked?: boolean;
}> = ({ post, author, onLike, onComment, isLiked = false }) => {
  const [liked, setLiked] = React.useState(isLiked);
  const [likesCount, setLikesCount] = React.useState(post.likes_count || 0);

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const newLiked = !liked;
    setLiked(newLiked);
    setLikesCount(prev => newLiked ? prev + 1 : prev - 1);
    onLike?.(post.id, newLiked);
  };

  const handleComment = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onComment?.(post);
  };

  return (
    <div className="min-w-[280px] max-w-[280px] h-[200px] bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col">
      <div className="flex items-center gap-2 mb-2">
        <Avatar className="h-8 w-8">
          <AvatarImage src={author?.avatar_url ?? undefined} />
          <AvatarFallback className="text-xs">{(author?.name || 'U').slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-xs text-gray-900 truncate">{author?.name || 'Unbekannt'}</p>
          <p className="text-[10px] text-gray-500">
            {new Date(post.created_at).toLocaleDateString('de-DE')}
          </p>
        </div>
      </div>
      <p className="text-sm text-gray-700 line-clamp-4 flex-1 leading-relaxed">{post.content}</p>
      <div className="flex items-center gap-4 mt-2 pt-2 border-t border-gray-50 text-xs">
        <button 
          onClick={handleLike}
          className={cn(
            "flex items-center gap-1 transition-all active:scale-90",
            liked ? "text-red-500" : "text-gray-500 hover:text-red-400"
          )}
        >
          <Heart className={cn("h-4 w-4 transition-transform", liked && "fill-current scale-110")} /> {likesCount}
        </button>
        <button 
          onClick={handleComment}
          className="flex items-center gap-1 text-gray-500 hover:text-blue-500 transition-colors active:scale-90"
        >
          <MessageCircle className="h-4 w-4" /> {post.comments_count || 0}
        </button>
      </div>
    </div>
  );
};

// Job Card - Apple Style mit Bewerben Button
const JobCard: React.FC<{ 
  job: Job; 
  companyName?: string; 
  companyLogo?: string | null;
  onApply?: (job: Job) => void;
  application?: { created_at?: string | null; unlocked_at?: string | null; status?: string | null } | null;
}> = ({ job, companyName, companyLogo, onApply, application }) => {
  const gradients = [
    'from-blue-500/10 via-indigo-500/5 to-violet-500/10',
    'from-emerald-500/10 via-teal-500/5 to-cyan-500/10',
    'from-orange-500/10 via-amber-500/5 to-yellow-500/10',
    'from-rose-500/10 via-pink-500/5 to-red-500/10',
  ];
  const gradient = gradients[Math.floor(Math.random() * gradients.length)];

  return (
    <div className={cn(
      "min-w-[180px] w-[180px] h-[200px] rounded-[20px] p-3 flex flex-col relative overflow-hidden",
      "bg-gradient-to-br", gradient,
      "border border-white/60 shadow-[0_2px_20px_-4px_rgba(0,0,0,0.1)]",
      "backdrop-blur-sm"
    )}>
      <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent pointer-events-none" />
      
      <Link to={`/stelle/${job.id}`} className="flex flex-col relative z-10 flex-1">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center overflow-hidden shadow-md ring-1 ring-black/5 shrink-0">
            {companyLogo ? (
              <img src={companyLogo} alt="" className="h-full w-full object-cover" />
            ) : (
              <Briefcase className="h-5 w-5 text-gray-400" />
            )}
          </div>
          <p className="text-[10px] text-gray-600 truncate flex-1">{companyName || 'Unternehmen'}</p>
        </div>
        <p className="font-semibold text-[13px] text-gray-900 line-clamp-2 leading-tight mb-2">{job.title}</p>
        
        {/* Standort & Details - aligned */}
        <div className="space-y-1 mt-auto">
          <p className="text-[10px] text-gray-500 flex items-center gap-1">
            <MapPin className="h-2.5 w-2.5 shrink-0" /> 
            <span className="truncate">{job.location || 'Flexibel'}</span>
          </p>
          <div className="flex items-center gap-2">
            {job.employment_type && (
              <span className="text-[9px] bg-black/5 text-gray-600 px-2 py-0.5 rounded-full">
                {job.employment_type}
              </span>
            )}
            {(job.salary_min || job.salary_max) && (
              <span className="text-[9px] bg-green-500/10 text-green-700 px-2 py-0.5 rounded-full">
                {job.salary_min && job.salary_max 
                  ? `${Math.round(job.salary_min/1000)}k - ${Math.round(job.salary_max/1000)}k €`
                  : job.salary_max 
                    ? `bis ${Math.round(job.salary_max/1000)}k €`
                    : `ab ${Math.round(job.salary_min!/1000)}k €`
                }
              </span>
            )}
          </div>
        </div>
      </Link>
      
      {/* Bewerben Button */}
      <div className="mt-auto pt-2 relative z-10">
        {application ? (
          <Button
            size="sm"
            variant="outline"
            className="w-full h-9 text-[11px] rounded-full border-green-200 bg-green-50 text-green-900 hover:bg-green-50 pointer-events-none"
          >
            Beworben am{" "}
            {application.created_at ? new Date(application.created_at).toLocaleDateString("de-DE") : "—"}
          </Button>
        ) : (
          <Button 
            size="sm"
            onClick={(e) => { e.preventDefault(); onApply?.(job); }}
            className="w-full h-9 text-xs rounded-full bg-black hover:bg-gray-800 text-white font-semibold shadow-lg shadow-black/20 active:scale-95 transition-all"
          >
            Bewerben
          </Button>
        )}
      </div>
    </div>
  );
};

// Dummy Jobs für Demo
const DUMMY_JOBS: Job[] = [
  { id: 'demo-1', title: 'Frontend Developer (React)', company_id: 'demo', location: 'Berlin', employment_type: 'Vollzeit', salary_min: 55000, salary_max: 75000 },
  { id: 'demo-2', title: 'UX/UI Designer', company_id: 'demo', location: 'München', employment_type: 'Vollzeit', salary_min: 50000, salary_max: 70000 },
  { id: 'demo-3', title: 'Product Manager', company_id: 'demo', location: 'Hamburg', employment_type: 'Vollzeit', salary_min: 65000, salary_max: 90000 },
  { id: 'demo-4', title: 'Backend Engineer (Node.js)', company_id: 'demo', location: 'Remote', employment_type: 'Vollzeit', salary_min: 60000, salary_max: 85000 },
  { id: 'demo-5', title: 'Marketing Manager', company_id: 'demo', location: 'Frankfurt', employment_type: 'Teilzeit', salary_min: 40000, salary_max: 55000 },
  { id: 'demo-6', title: 'Data Analyst', company_id: 'demo', location: 'Köln', employment_type: 'Vollzeit', salary_min: 48000, salary_max: 65000 },
];


export default function MarketplaceMobile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: myApplications } = useMyApplications();
  const { getStatuses, requestConnection } = useConnections();
  const [statusMap, setStatusMap] = React.useState<Record<string, ConnectionState>>({});
  const [authors, setAuthors] = React.useState<Record<string, { name: string; avatar_url: string | null }>>({});
  const [companyMap, setCompanyMap] = React.useState<Record<string, { name: string; logo_url: string | null }>>({});
  const postsScrollRef = useRef<HTMLDivElement>(null);
  const [postIndex, setPostIndex] = React.useState(0);
  const [applyJob, setApplyJob] = React.useState<Job | null>(null);
  const [applySuccess, setApplySuccess] = React.useState(false);

  const applicationsByJobId = (myApplications || []).reduce((acc: Record<string, any>, app: any) => {
    acc[app.job_id] = app;
    return acc;
  }, {});
  
  // Pull-to-refresh state
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const startX = useRef(0);
  
  // Online status
  const isOnline = useOnlineStatus();
  const [commentPost, setCommentPost] = React.useState<Post | null>(null);
  const [commentText, setCommentText] = React.useState('');
  
  // Session ID for randomization - changes on page reload
  const [sessionId] = React.useState(() => Math.random().toString(36).slice(2));

  // Fetch People (Users) - randomized per session with mutual connections
  const peopleQuery = useQuery<Person[]>({
    queryKey: ['mp-people-mobile', sessionId, user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      // Load profiles with all needed fields
      let { data, error } = await supabase
        .from('profiles')
        .select('id, vorname, nachname, avatar_url, bio, branche, stadt, ort, status, schule, ausbildungsberuf, ausbildungsbetrieb, aktueller_beruf, berufserfahrung, schulbildung')
        .limit(50);
      
      // If some fields don't exist, try without them
      if (error && error.code === '42703') {
        const result = await supabase
          .from('profiles')
          .select('id, vorname, nachname, avatar_url, bio, branche, ort, status')
          .limit(50);
        data = result.data;
        error = result.error;
      }
      
      if (error) {
        console.error('Error fetching profiles:', error);
        return [];
      }
      
      const filtered = (data || []).filter((p: any) => (p.vorname || p.nachname) && p.id !== user.id);
      
      // Load current user's connections for mutual matching
      const { data: currentConnections } = await supabase
        .from('connections')
        .select('requester_id, addressee_id')
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
        .eq('status', 'accepted');
      
      const currentUserConnectionIds = new Set(
        (currentConnections || []).map(c => 
          c.requester_id === user.id ? c.addressee_id : c.requester_id
        )
      );
      
      // Enrich profiles with mutual connections
      const enrichedProfiles = await Promise.all(filtered.map(async (profile: any) => {
        const enriched: Person = { ...profile };
        
        // Find mutual connections
        const { data: profileConnections } = await supabase
          .from('connections')
          .select('requester_id, addressee_id')
          .or(`requester_id.eq.${profile.id},addressee_id.eq.${profile.id}`)
          .eq('status', 'accepted');
        
        const profileConnectionIds = new Set(
          (profileConnections || []).map((c: any) => 
            c.requester_id === profile.id ? c.addressee_id : c.requester_id
          )
        );
        
        const mutualIds = Array.from(currentUserConnectionIds).filter(id => 
          profileConnectionIds.has(id) && id !== profile.id && id !== user.id
        );
        
        if (mutualIds.length > 0) {
          const { data: mutualProfiles } = await supabase
            .from('profiles')
            .select('id, vorname, nachname, avatar_url')
            .in('id', mutualIds.slice(0, 3));
          
          enriched.mutualConnections = (mutualProfiles || []).map((p: any) => ({
            id: p.id,
            avatar_url: p.avatar_url,
            name: `${p.vorname || ''} ${p.nachname || ''}`.trim() || 'Unbekannt'
          }));
          enriched.mutualCount = mutualIds.length;
        }
        
        return enriched;
      }));
      
      return shuffleArray(enrichedProfiles).slice(0, 20) as Person[];
    },
  });

  // Fetch Companies - randomized per session
  const companiesQuery = useQuery<Company[]>({
    queryKey: ['mp-companies-mobile', sessionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('companies')
        .select('id, name, logo_url, industry, city')
        .limit(30);
      if (error) return [];
      return shuffleArray(data || []).slice(0, 15) as Company[];
    },
  });

  // Fetch Posts with likes and comments count
  const postsQuery = useQuery<Post[]>({
    queryKey: ['mp-posts-mobile', sessionId],
    queryFn: async () => {
      const { data: postsData, error } = await supabase
        .from('posts')
        .select('id, content, image_url, user_id, created_at')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error || !postsData) return [];

      const postIds = postsData.map(p => p.id);
      
      // Get likes count
      const { data: likesData } = await supabase
        .from('post_likes')
        .select('post_id')
        .in('post_id', postIds);
      
      // Get comments count
      const { data: commentsData } = await supabase
        .from('post_comments')
        .select('post_id')
        .in('post_id', postIds);

      const likesMap: Record<string, number> = {};
      const commentsMap: Record<string, number> = {};
      
      (likesData || []).forEach((l: any) => {
        likesMap[l.post_id] = (likesMap[l.post_id] || 0) + 1;
      });
      (commentsData || []).forEach((c: any) => {
        commentsMap[c.post_id] = (commentsMap[c.post_id] || 0) + 1;
      });

      return postsData.map(p => ({
        ...p,
        likes_count: likesMap[p.id] || 0,
        comments_count: commentsMap[p.id] || 0,
      })) as Post[];
    },
  });

  // Fetch Jobs - randomized per session
  const jobsQuery = useQuery<Job[]>({
    queryKey: ['mp-jobs-mobile', sessionId, user?.id],
    queryFn: async () => {
      // If user is logged in, use branch-filtered jobs
      if (user?.id) {
        const { data, error } = await supabase
          .rpc('get_jobs_by_branch', {
            p_viewer_id: user.id,
            p_limit: 20,
            p_offset: 0
          });
        
        if (error) {
          console.warn('[MarketplaceMobile] get_jobs_by_branch error, falling back:', error);
          // Fall through to regular query
        } else if (data && data.length > 0) {
          // Transform to match Job type
          const transformed = data.map((job: any) => ({
            id: job.id,
            title: job.title,
            company_id: job.company_id,
            location: null, // Will be loaded separately if needed
            employment_type: null,
            salary_min: null,
            salary_max: null,
          }));
          return shuffleArray(transformed).slice(0, 10) as Job[];
        }
      }
      
      // Fallback: Regular query for non-logged-in users
      const { data, error } = await supabase
        .from('job_posts')
        .select('id, title, company_id, location, employment_type, salary_min, salary_max')
        .eq('status', 'active')
        .limit(20);
      if (error) return [];
      return shuffleArray(data || []).slice(0, 10) as Job[];
    },
  });

  // Fetch authors for posts
  React.useEffect(() => {
    if (!postsQuery.data || postsQuery.data.length === 0) return;
    const ids = Array.from(new Set(postsQuery.data.map(p => p.user_id)));
    if (ids.length === 0) return;
    (async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, vorname, nachname, avatar_url')
        .in('id', ids);
      if (data) {
        const map: Record<string, { name: string; avatar_url: string | null }> = {};
        (data as any[]).forEach((p) => {
          map[p.id] = { 
            name: [p.vorname, p.nachname].filter(Boolean).join(' ') || 'Unbekannt', 
            avatar_url: p.avatar_url ?? null 
          };
        });
        setAuthors(map);
      }
    })();
  }, [postsQuery.data]);

  // Fetch company info for jobs
  React.useEffect(() => {
    if (!jobsQuery.data || jobsQuery.data.length === 0) return;
    const ids = Array.from(new Set(jobsQuery.data.map(j => j.company_id)));
    if (ids.length === 0) return;
    (async () => {
      const { data } = await supabase
        .from('companies')
        .select('id, name, logo_url')
        .in('id', ids);
      if (data) {
        const map: Record<string, { name: string; logo_url: string | null }> = {};
        (data as any[]).forEach((c) => {
          map[c.id] = { name: c.name, logo_url: c.logo_url ?? null };
        });
        setCompanyMap(map);
      }
    })();
  }, [jobsQuery.data]);

  // Load connection statuses
  React.useEffect(() => {
    if (!user || !peopleQuery.data || peopleQuery.data.length === 0) return;
    const ids = peopleQuery.data.map(p => p.id).filter(id => id !== user.id);
    if (ids.length === 0) return;
    (async () => {
      try {
        const statuses = await getStatuses(ids);
        setStatusMap(statuses);
      } catch (e) {
        console.error(e);
      }
    })();
  }, [user, peopleQuery.data, getStatuses]);

  // Load followed companies
  React.useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id)
        .eq('status', 'accepted');
      if (data) {
        setFollowedCompanyIds(new Set(data.map(f => f.following_id)));
      }
    })();
  }, [user]);

  // Pull-to-refresh handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const target = e.target as unknown as HTMLElement;
    // If touch starts inside a horizontal scroller, never start pull-to-refresh
    if (target?.closest?.('[data-hscroll="true"]')) {
      startY.current = 0;
      startX.current = 0;
      return;
    }

    if (containerRef.current?.scrollTop === 0) {
      startY.current = e.touches[0].clientY;
      startX.current = e.touches[0].clientX;
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const target = e.target as unknown as HTMLElement;
    // If touch is happening inside a horizontal scroller, let it scroll horizontally
    if (target?.closest?.('[data-hscroll="true"]')) {
      // Reset pull distance when in horizontal scroll area
      if (pullDistance > 0) {
        setPullDistance(0);
      }
      return;
    }

    if (containerRef.current?.scrollTop === 0 && !isRefreshing) {
      const currentY = e.touches[0].clientY;
      const currentX = e.touches[0].clientX;

      const dy = currentY - startY.current;
      const dx = currentX - startX.current;

      // If user is swiping horizontally, do not trigger pull-to-refresh
      if (Math.abs(dx) > Math.abs(dy) + 6) {
        setPullDistance(0);
        return;
      }

      if (dy > 0 && dy < 150) {
        // small deadzone to reduce accidental pulls while swiping
        if (dy < 6) return;
        setPullDistance(dy);
      }
    }
  }, [isRefreshing, pullDistance]);

  const handleTouchEnd = useCallback(async () => {
    if (pullDistance > 80 && !isRefreshing) {
      setIsRefreshing(true);
      triggerHaptic('medium');
      
      // Refresh all queries
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['mp-people-mobile'] }),
        queryClient.invalidateQueries({ queryKey: ['mp-companies-mobile'] }),
        queryClient.invalidateQueries({ queryKey: ['mp-posts-mobile'] }),
        queryClient.invalidateQueries({ queryKey: ['mp-jobs-mobile'] }),
      ]);
      
      // Generate new session ID for fresh random order
      setTimeout(() => {
        setIsRefreshing(false);
        setPullDistance(0);
        toast({ title: '✨ Aktualisiert!' });
      }, 800);
    } else {
      setPullDistance(0);
    }
  }, [pullDistance, isRefreshing, queryClient]);

  const onConnect = async (targetId: string) => {
    if (!user) {
      window.location.href = '/anmelden';
      return;
    }
    
    // Optimistic update
    setStatusMap(prev => ({ ...prev, [targetId]: 'pending' }));
    triggerHaptic('light');
    toast({ title: '✨ Anfrage gesendet' });
    
    try {
      await requestConnection(targetId);
    } catch (e) {
      // Revert on error
      setStatusMap(prev => ({ ...prev, [targetId]: 'none' }));
      toast({ title: 'Fehler', variant: 'destructive' });
    }
  };

  // Like a post with haptic + optimistic update
  const handleLikePost = async (postId: string, liked: boolean) => {
    if (!user) {
      toast({ title: 'Bitte anmelden', variant: 'destructive' });
      return;
    }
    
    // Haptic feedback
    triggerHaptic('light');
    try {
      if (liked) {
        await supabase.from('post_likes').insert({ post_id: postId, user_id: user.id });
      } else {
        await supabase.from('post_likes').delete().eq('post_id', postId).eq('user_id', user.id);
      }
    } catch (e) {
      console.error('Like error:', e);
    }
  };

  // Submit comment
  const handleSubmitComment = async () => {
    if (!user || !commentPost || !commentText.trim()) return;
    try {
      await supabase.from('post_comments').insert({
        post_id: commentPost.id,
        user_id: user.id,
        content: commentText.trim(),
      });
      toast({ title: '💬 Kommentar gepostet!' });
      setCommentText('');
      setCommentPost(null);
    } catch (e) {
      toast({ title: 'Fehler', variant: 'destructive' });
    }
  };

  // Filter out already connected/pending people
  const connectedOrPendingIds = new Set(
    Object.entries(statusMap)
      .filter(([_, status]) => status === 'accepted' || status === 'pending')
      .map(([id]) => id)
  );
  
  const allPeople = (peopleQuery.data || []).filter(p => 
    p.id !== user?.id && !connectedOrPendingIds.has(p.id)
  );
  
  // Filter out followed companies
  const [followedCompanyIds, setFollowedCompanyIds] = React.useState<Set<string>>(new Set());
  
  const allCompanies = (companiesQuery.data || []).filter(c => !followedCompanyIds.has(c.id));
  const posts = postsQuery.data || [];
  const jobs = jobsQuery.data || [];

  // Track scroll position for dots
  React.useEffect(() => {
    const el = postsScrollRef.current;
    if (!el) return;
    const handleScroll = () => {
      const idx = Math.round(el.scrollLeft / 296);
      setPostIndex(idx);
    };
    el.addEventListener('scroll', handleScroll);
    return () => el.removeEventListener('scroll', handleScroll);
  }, [posts]);

  // "Für dich" - Mix aus Personen und Unternehmen (erste 3 von jedem)
  const forYouPeople = allPeople.slice(0, 3);
  const forYouCompanies = allCompanies.slice(0, 3);
  const forYouItems: { item: Person | Company; type: 'person' | 'company' }[] = [];
  let pIdx = 0, cIdx = 0;
  while (forYouItems.length < 6 && (pIdx < forYouPeople.length || cIdx < forYouCompanies.length)) {
    if (pIdx < forYouPeople.length) forYouItems.push({ item: forYouPeople[pIdx++], type: 'person' });
    if (forYouItems.length < 6 && cIdx < forYouCompanies.length) forYouItems.push({ item: forYouCompanies[cIdx++], type: 'company' });
  }

  // Unternehmen ab Index 3 (nicht in "Für dich")
  const companiesSection = allCompanies.slice(3);
  
  // Personen ab Index 3 (nicht in "Für dich")
  const peopleSection = allPeople.slice(3);

  return (
    <div 
      ref={containerRef}
      className="h-[100dvh] bg-gray-50/50 pb-24 overflow-y-auto"
      style={{ 
        WebkitOverflowScrolling: 'touch',
        touchAction: 'pan-y'
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Offline Banner */}
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-gray-900 text-white py-2 px-4 flex items-center justify-center gap-2 text-sm animate-in slide-in-from-top">
          <WifiOff className="h-4 w-4" />
          <span>Keine Verbindung</span>
        </div>
      )}

      {/* Pull-to-refresh indicator */}
      <div 
        className="flex items-center justify-center overflow-hidden transition-all duration-200"
        style={{ height: isRefreshing ? 60 : Math.min(pullDistance, 80) }}
      >
        <div className={cn(
          "flex items-center gap-2 text-gray-500 text-sm",
          isRefreshing && "animate-pulse"
        )}>
          <RefreshCw className={cn("h-5 w-5", isRefreshing && "animate-spin")} />
          <span>{isRefreshing ? 'Aktualisiere...' : pullDistance > 80 ? 'Loslassen' : 'Runterziehen'}</span>
        </div>
      </div>

      {/* Header */}
      <div className={cn(
        "bg-white pt-4 pb-5 px-4 transition-transform duration-200",
        !isOnline && "mt-10"
      )}>
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="h-4 w-4 text-blue-500" />
          <span className="text-xs font-medium text-blue-500">Entdecken</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Marketplace</h1>
        <p className="text-sm text-gray-500">Personen, Unternehmen & mehr</p>
      </div>

      {/* 1. Für dich */}
      <div className="mt-5">
        <SectionHeader 
          title="Für dich" 
          icon={<Sparkles className="h-5 w-5 text-yellow-500" />}
          onSeeAll={() => {}}
          seeAllText="Weitere"
        />
        <div
          data-hscroll="true"
          className="overflow-x-auto scroll-smooth"
          style={{ 
            WebkitOverflowScrolling: 'touch',
            touchAction: 'pan-x',
            overscrollBehaviorX: 'contain',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}
        >
          <div className="flex gap-3 px-4 pb-2" style={{ width: 'max-content' }}>
            {forYouItems.length > 0 ? forYouItems.map(({ item, type }, index) => (
              <div 
                key={item.id}
                className="animate-in fade-in slide-in-from-right-4 duration-300"
                style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'backwards' }}
              >
                <ForYouCard 
                  item={item}
                  type={type}
                  index={index}
                  onAction={() => type === 'person' ? onConnect(item.id) : {}}
                  actionLabel={type === 'person' ? 'Vernetzen' : 'Folgen'}
                  actionDone={type === 'person' && statusMap[item.id] === 'accepted'}
                />
              </div>
            )) : (
              <p className="text-sm text-gray-400 px-2">Keine Vorschläge</p>
            )}
          </div>
        </div>
      </div>

      {/* 2. Unternehmen */}
      {allCompanies.length > 0 && (
        <div className="mt-6">
          <SectionHeader 
            title="Unternehmen" 
            icon={<Building2 className="h-5 w-5 text-blue-500" />}
            onSeeAll={() => {}}
          />
          <div
            data-hscroll="true"
            className="overflow-x-auto scroll-smooth"
            style={{ 
              WebkitOverflowScrolling: 'touch',
              touchAction: 'pan-x',
              overscrollBehaviorX: 'contain',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none'
            }}
          >
            <div className="flex gap-3 px-4 pb-2" style={{ width: 'max-content' }}>
              {allCompanies.slice(0, 8).map((company, idx) => (
                <div 
                  key={company.id}
                  className="animate-in fade-in slide-in-from-right-4 duration-300"
                  style={{ animationDelay: `${idx * 50}ms`, animationFillMode: 'backwards' }}
                >
                  <CompanyCard company={company} index={idx} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. Beiträge - Swipeable Cards */}
      <div className="mt-6">
        <SectionHeader 
          title="Beiträge" 
          icon={<FileText className="h-5 w-5 text-green-500" />}
        />
        {posts.length > 0 ? (
          <div className="relative px-4">
            {/* Swipeable Container */}
            <div 
              ref={postsScrollRef}
              data-hscroll="true"
              className="overflow-x-auto snap-x snap-mandatory scroll-smooth"
              style={{ 
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                WebkitOverflowScrolling: 'touch',
                touchAction: 'pan-x',
                overscrollBehaviorX: 'contain'
              }}
            >
              <style>{`
                [data-hscroll="true"]::-webkit-scrollbar {
                  display: none;
                }
              `}</style>
              <div className="flex gap-3" style={{ width: `${posts.slice(0, 5).length * 296}px` }}>
                {posts.slice(0, 5).map((post, idx) => (
                  <div key={post.id} className="snap-center shrink-0">
                    <PostCardSlider 
                      post={post} 
                      author={authors[post.user_id]} 
                      onLike={handleLikePost}
                      onComment={(p) => setCommentPost(p)}
                    />
                  </div>
                ))}
              </div>
            </div>
            {/* Dots Indicator */}
            <div className="flex justify-center gap-1.5 mt-3">
              {posts.slice(0, 5).map((_, idx) => (
                <div 
                  key={idx} 
                  className={cn(
                    "h-1.5 rounded-full transition-all",
                    idx === postIndex ? "w-4 bg-blue-500" : "w-1.5 bg-gray-300"
                  )}
                />
              ))}
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-400 px-4">Keine Beiträge</p>
        )}
        {posts.length > 0 && (
          <div className="px-4 mt-3 flex justify-end">
            <Link to="/community">
              <Button variant="ghost" size="sm" className="text-blue-500 text-sm font-medium">
                Mehr Beiträge <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* 4. Jobs - mit Dummy-Fallback */}
      <div className="mt-6">
        <SectionHeader 
          title="Jobs für dich" 
          icon={<Briefcase className="h-5 w-5 text-purple-500" />}
          onSeeAll={() => {}}
          seeAllText="Alle Jobs"
        />
        <div
          data-hscroll="true"
          className="overflow-x-auto scroll-smooth"
          style={{ 
            WebkitOverflowScrolling: 'touch',
            touchAction: 'pan-x',
            overscrollBehaviorX: 'contain',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}
        >
          <div className="flex gap-3 px-4 pb-2" style={{ width: 'max-content' }}>
            {(jobs.length > 0 ? jobs : DUMMY_JOBS).slice(0, 6).map((job) => (
              <JobCard 
                key={job.id} 
                job={job} 
                companyName={companyMap[job.company_id]?.name || (job.id.startsWith('demo') ? 'Top Unternehmen' : undefined)}
                companyLogo={companyMap[job.company_id]?.logo_url}
                application={applicationsByJobId[job.id] ?? null}
                onApply={(j) => setApplyJob(j)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* 5. Personen (User) */}
      <div className="mt-6">
        <SectionHeader 
          title="Personen" 
          icon={<Users className="h-5 w-5 text-pink-500" />}
          onSeeAll={() => {}}
        />
        <div
          data-hscroll="true"
          className="overflow-x-auto scroll-smooth"
          style={{ 
            WebkitOverflowScrolling: 'touch',
            touchAction: 'pan-x',
            overscrollBehaviorX: 'contain',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}
        >
          <div className="flex gap-3 px-4 pb-2" style={{ width: 'max-content' }}>
            {peopleQuery.isLoading ? (
              [1,2,3,4].map(i => (
                <div key={i} className="min-w-[160px] w-[160px] h-[200px] bg-white rounded-2xl p-3 animate-pulse">
                  <div className="h-14 w-14 rounded-full bg-gray-200 mx-auto mb-2" />
                  <div className="h-4 w-20 bg-gray-200 rounded mx-auto mb-2" />
                  <div className="h-3 w-16 bg-gray-200 rounded mx-auto" />
                </div>
              ))
            ) : allPeople.length > 0 ? (
              allPeople.slice(0, 10).map((person, idx) => (
                <div 
                  key={person.id}
                  className="animate-in fade-in slide-in-from-right-4 duration-300"
                  style={{ animationDelay: `${idx * 50}ms`, animationFillMode: 'backwards' }}
                >
                  <PersonCard 
                    person={person}
                    index={idx}
                    onConnect={() => onConnect(person.id)}
                    status={statusMap[person.id] ?? 'none'}
                  />
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-400">Noch keine Nutzer registriert</p>
            )}
          </div>
        </div>
      </div>

      {/* 6. Gruppen - Coming Soon */}
      <div className="mt-6 px-4">
        <SectionHeader title="Gruppen" icon={<Users className="h-5 w-5 text-purple-500" />} />
        <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-3 flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
            <Users className="h-5 w-5 text-purple-500" />
          </div>
          <div className="text-left">
            <p className="font-medium text-gray-900 text-sm">Gruppen kommen bald!</p>
            <p className="text-xs text-gray-500">Tausche dich mit Gleichgesinnten aus.</p>
          </div>
        </div>
      </div>

      {/* Bottom Spacer */}
      <div className="h-20" />

      {/* Apply Job Dialog */}
      <Dialog open={!!applyJob && !applySuccess} onOpenChange={(open) => !open && setApplyJob(null)}>
        <DialogContent className="max-w-[360px] max-h-[85vh] rounded-3xl p-0 flex flex-col overflow-hidden">
          {/* Header - fixed */}
          <div className="p-5 pb-3 border-b border-gray-100">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-center">Bewerben</DialogTitle>
              <DialogDescription className="text-center text-gray-500 mt-1 text-sm">
                Alle Details zur Stelle
              </DialogDescription>
            </DialogHeader>
          </div>
          
          {/* Scrollable Content */}
          {applyJob && (
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* Job Header */}
              <div className="flex items-start gap-3">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center shadow-sm shrink-0">
                  {companyMap[applyJob.company_id]?.logo_url ? (
                    <img src={companyMap[applyJob.company_id].logo_url!} alt="" className="h-full w-full object-cover rounded-2xl" />
                  ) : (
                    <Briefcase className="h-7 w-7 text-gray-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-base text-gray-900 leading-tight">{applyJob.title}</p>
                  <p className="text-sm text-gray-600 mt-0.5">
                    {companyMap[applyJob.company_id]?.name || 'Top Unternehmen'}
                  </p>
                </div>
              </div>

              {/* Quick Info Badges */}
              <div className="flex flex-wrap gap-2">
                {applyJob.location && (
                  <span className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full">
                    <MapPin className="h-3 w-3" /> {applyJob.location}
                  </span>
                )}
                {applyJob.employment_type && (
                  <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full">
                    <Briefcase className="h-3 w-3" /> {applyJob.employment_type}
                  </span>
                )}
                {(applyJob.salary_min || applyJob.salary_max) && (
                  <span className="inline-flex items-center gap-1 text-xs bg-green-50 text-green-700 px-3 py-1.5 rounded-full">
                    💰 {applyJob.salary_min && applyJob.salary_max 
                      ? `${Math.round(applyJob.salary_min/1000)}k - ${Math.round(applyJob.salary_max/1000)}k €/Jahr`
                      : applyJob.salary_max 
                        ? `bis ${Math.round(applyJob.salary_max/1000)}k €/Jahr`
                        : `ab ${Math.round(applyJob.salary_min!/1000)}k €/Jahr`
                    }
                  </span>
                )}
              </div>

              {/* Details Section */}
              <div className="space-y-3 pt-2">
                <h4 className="font-semibold text-sm text-gray-900">Details</h4>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">Standort</p>
                    <p className="text-sm font-medium text-gray-900">{applyJob.location || 'Flexibel'}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">Anstellung</p>
                    <p className="text-sm font-medium text-gray-900">{applyJob.employment_type || 'Vollzeit'}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">Gehalt</p>
                    <p className="text-sm font-medium text-gray-900">
                      {applyJob.salary_min && applyJob.salary_max 
                        ? `${Math.round(applyJob.salary_min/1000)}k - ${Math.round(applyJob.salary_max/1000)}k €`
                        : 'Nach Vereinbarung'
                      }
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">Start</p>
                    <p className="text-sm font-medium text-gray-900">Ab sofort</p>
                  </div>
                </div>
              </div>

              {/* What we offer */}
              <div className="space-y-3 pt-2">
                <h4 className="font-semibold text-sm text-gray-900">Das erwartet dich</h4>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-xs">✓</span>
                    Flexibles Arbeiten & Home Office
                  </li>
                  <li className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-xs">✓</span>
                    Weiterbildungsbudget
                  </li>
                  <li className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-xs">✓</span>
                    Modernes Equipment
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* Fixed Footer */}
          <div className="p-5 pt-3 border-t border-gray-100 bg-white">
            <Button 
              onClick={() => {
                setApplySuccess(true);
                setTimeout(() => {
                  setApplySuccess(false);
                  setApplyJob(null);
                  toast({ 
                    title: '🎉 Bewerbung gesendet!', 
                    description: 'Das Unternehmen wird sich bei dir melden.' 
                  });
                }, 1500);
              }}
              className="w-full h-12 rounded-full bg-black hover:bg-gray-800 text-white font-semibold text-base shadow-lg"
            >
              Jetzt bewerben
            </Button>
            <button 
              onClick={() => setApplyJob(null)}
              className="w-full mt-2 text-sm text-gray-500 py-2"
            >
              Abbrechen
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={applySuccess} onOpenChange={() => {}}>
        <DialogContent className="max-w-[300px] rounded-3xl p-8 text-center">
          <div className="flex flex-col items-center">
            <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Bewerbung gesendet!</h3>
            <p className="text-sm text-gray-500">
              Viel Erfolg! 🍀
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Comment Dialog */}
      <Dialog open={!!commentPost} onOpenChange={(open) => !open && setCommentPost(null)}>
        <DialogContent className="max-w-[360px] rounded-3xl p-0 flex flex-col">
          <div className="p-5 border-b border-gray-100">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold">Kommentieren</DialogTitle>
            </DialogHeader>
          </div>
          
          {commentPost && (
            <div className="p-5 space-y-4">
              {/* Original Post Preview */}
              <div className="bg-gray-50 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={authors[commentPost.user_id]?.avatar_url ?? undefined} />
                    <AvatarFallback className="text-[10px]">U</AvatarFallback>
                  </Avatar>
                  <p className="text-xs font-medium text-gray-700">{authors[commentPost.user_id]?.name || 'Unbekannt'}</p>
                </div>
                <p className="text-sm text-gray-600 line-clamp-2">{commentPost.content}</p>
              </div>

              {/* Comment Input */}
              <div>
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Schreibe einen Kommentar..."
                  className="w-full h-24 p-3 text-sm border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoFocus
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button 
                  variant="ghost"
                  onClick={() => setCommentPost(null)}
                  className="flex-1 h-11 rounded-full"
                >
                  Abbrechen
                </Button>
                <Button 
                  onClick={handleSubmitComment}
                  disabled={!commentText.trim()}
                  className="flex-1 h-11 rounded-full bg-black hover:bg-gray-800 text-white font-semibold disabled:opacity-50"
                >
                  Posten
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
