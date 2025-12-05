import React from 'react';
import { Phone, Mail, MapPin, Calendar, Car } from 'lucide-react';

export interface CVData {
  vorname?: string;
  nachname?: string;
  telefon?: string;
  email?: string;
  strasse?: string;
  hausnummer?: string;
  plz?: string;
  ort?: string;
  geburtsdatum?: Date | string;
  profilbild?: File | string;
  avatar_url?: string;
  has_drivers_license?: boolean;
  driver_license_class?: string;
  status?: 'schueler' | 'azubi' | 'fachkraft';
  branche?: 'handwerk' | 'it' | 'gesundheit' | 'buero' | 'verkauf' | 'gastronomie' | 'bau';
  ueberMich?: string;
  schulbildung?: Array<{
    schulform: string;
    name: string;
    ort: string;
    zeitraum_von: string;
    zeitraum_bis: string;
    beschreibung?: string;
  }>;
  berufserfahrung?: Array<{
    titel: string;
    unternehmen: string;
    ort: string;
    zeitraum_von: string;
    zeitraum_bis: string;
    beschreibung?: string;
    abschluss?: string; // Abschluss bei Ausbildungen
  }>;
  sprachen?: Array<{
    sprache: string;
    niveau: string;
  }>;
  faehigkeiten?: string[];
  qualifikationen?: Array<{
    name: string;
    beschreibung?: string;
  }>;
  zertifikate?: Array<{
    name: string;
    anbieter?: string;
    datum?: string;
  }>;
  weiterbildung?: Array<{
    titel: string;
    anbieter: string;
    ort?: string;
    zeitraum_von?: string;
    zeitraum_bis?: string;
    beschreibung?: string;
  }>;
  interessen?: string[];
}

export interface CVLayoutProps {
  data: CVData;
  className?: string;
}

export const formatDate = (date: Date | string | undefined) => {
  if (!date) return '';
  return new Intl.DateTimeFormat('de-DE').format(new Date(date));
};

// Format date as MM.YYYY (German format for CV periods)
// Accepts: Date object, "YYYY-MM" string, "YYYY" string, or undefined
export const formatMonthYear = (date: Date | string | undefined) => {
  if (!date) return '';
  
  // Handle string formats: "YYYY-MM" or "YYYY"
  if (typeof date === 'string') {
    // Check if it's "heute" or empty
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

// Get current date formatted as DD.MM.YYYY
export const getCurrentDateFormatted = () => {
  return new Intl.DateTimeFormat('de-DE').format(new Date());
};

// Signature block component
export const SignatureBlock: React.FC<{ 
  vorname?: string; 
  nachname?: string; 
  ort?: string;
  className?: string;
}> = ({ vorname, nachname, ort, className = '' }) => {
  const fullName = `${vorname || ''} ${nachname || ''}`.trim();
  const location = ort || '';
  const date = getCurrentDateFormatted();
  
  return (
    <div className={`text-xs text-gray-600 ${className}`}>
      <div className="mb-6">
        {location}, {date}
      </div>
      <div className="mb-2 border-b border-gray-400" style={{ width: '150px' }} />
      <div className="font-medium text-gray-800">
        {fullName || 'Vorname Nachname'}
      </div>
    </div>
  );
};

export const getBrancheTitle = (branche?: string) => {
  switch (branche) {
    case 'handwerk': return 'Handwerk';
    case 'it': return 'IT';
    case 'gesundheit': return 'Gesundheit';
    case 'buero': return 'Büro & Verwaltung';
    case 'verkauf': return 'Verkauf & Handel';
    case 'gastronomie': return 'Gastronomie & Service';
    case 'bau': return 'Bau & Architektur';
    default: return '';
  }
};

export const getStatusTitle = (status?: string) => {
  switch (status) {
    case 'schueler': return 'Schüler/in';
    case 'azubi': return 'Auszubildende/r';
    case 'fachkraft': return 'Fachkraft';
    default: return '';
  }
};

export const getBrancheColors = (branche?: string) => {
  switch (branche) {
    case 'handwerk':
      return {
        primary: '25 95% 53%', // Orange HSL
        secondary: '25 100% 97%', // Light orange
        accent: '25 100% 45%', // Darker orange
        text: '25 95% 45%'
      };
    case 'it':
      return {
        primary: '217 91% 60%', // Blue HSL  
        secondary: '217 100% 97%', // Light blue
        accent: '217 91% 50%', // Darker blue
        text: '217 91% 50%'
      };
    case 'gesundheit':
      return {
        primary: '142 71% 45%', // Green HSL
        secondary: '142 100% 97%', // Light green
        accent: '142 71% 35%', // Darker green
        text: '142 71% 35%'
      };
    case 'buero':
      return {
        primary: '240 100% 60%', // Purple HSL
        secondary: '240 100% 97%', // Light purple
        accent: '240 100% 50%', // Darker purple
        text: '240 100% 50%'
      };
    case 'verkauf':
      return {
        primary: '348 83% 47%', // Red HSL
        secondary: '348 100% 97%', // Light red
        accent: '348 83% 37%', // Darker red
        text: '348 83% 37%'
      };
    case 'gastronomie':
      return {
        primary: '45 93% 47%', // Yellow HSL
        secondary: '45 100% 97%', // Light yellow
        accent: '45 93% 37%', // Darker yellow
        text: '45 93% 37%'
      };
    case 'bau':
      return {
        primary: '30 81% 47%', // Brown HSL
        secondary: '30 100% 97%', // Light brown
        accent: '30 81% 37%', // Darker brown
        text: '30 81% 37%'
      };
    default:
      return {
        primary: '220 13% 13%', // Default primary
        secondary: '220 13% 95%',
        accent: '220 13% 20%',
        text: '220 13% 20%'
      };
  }
};

export const LanguageBars: React.FC<{ niveau: string; branche?: string }> = ({ niveau, branche }) => {
  // Remove the progress bars - just return the niveau text
  return (
    <span className="text-sm text-muted-foreground font-medium">
      {niveau}
    </span>
  );
};

export const ContactInfo: React.FC<{ data: CVData; isLight?: boolean }> = ({ data, isLight = false }) => {
  const textColor = isLight ? 'text-white/90' : 'text-muted-foreground';
  
  return (
    <div className={`flex flex-wrap gap-4 text-sm ${textColor}`}>
      {data.telefon && (
        <div className="flex items-center gap-2">
          <Phone className="h-4 w-4 flex-shrink-0" />
          <span>{data.telefon}</span>
        </div>
      )}
      {data.email && (
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 flex-shrink-0" />
          <span>{data.email}</span>
        </div>
      )}
      {(data.strasse && data.ort) && (
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 flex-shrink-0" />
          <span>{data.strasse} {data.hausnummer}, {data.plz} {data.ort}</span>
        </div>
      )}
      {data.geburtsdatum && (
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 flex-shrink-0" />
          <span>{formatDate(data.geburtsdatum)}</span>
        </div>
      )}
      {data.has_drivers_license && data.driver_license_class && (
        <div className="flex items-center gap-2">
          <Car className="h-4 w-4 flex-shrink-0" />
          <span>Führerschein {data.driver_license_class}</span>
        </div>
      )}
    </div>
  );
};

export const ProfileImage: React.FC<{ 
  profilbild?: File | string; 
  avatar_url?: string;
  size?: 'sm' | 'md' | 'lg' | 'full';
  className?: string;
}> = ({ profilbild, avatar_url, size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24', 
    lg: 'w-32 h-32',
    full: 'w-full h-full'
  };
  
  const imageUrl = profilbild || avatar_url;
  if (!imageUrl) return null;
  
  // Check if imageUrl is a valid File/Blob object before creating object URL
  const getImageSrc = () => {
    if (typeof imageUrl === 'string') {
      return imageUrl;
    }
    
    // Check if it's a File object (has the required properties)
    if (imageUrl && typeof imageUrl === 'object' && 'type' in imageUrl && 'size' in imageUrl) {
      try {
        return URL.createObjectURL(imageUrl as File);
      } catch (error) {
        console.warn('Failed to create object URL for image:', error);
        return null;
      }
    }
    
    // If it's neither a string nor a valid File object, return null
    return null;
  };

  const imageSrc = getImageSrc();
  if (!imageSrc) return null;
  
  return (
    <div className={`${sizeClasses[size]} overflow-hidden bg-muted flex-shrink-0 ${className}`}>
      <img
        src={imageSrc}
        alt="Profilbild"
        className="w-full h-full object-cover"
      />
    </div>
  );
};

export const SkillTags: React.FC<{ skills: string[]; branche?: string }> = ({ skills, branche }) => {
  const colors = getBrancheColors(branche);
  
  return (
    <div className="flex flex-wrap gap-2">
      {skills.map((skill, index) => (
        <span
          key={index}
          className={`bg-[hsl(${colors.secondary})] text-[hsl(${colors.text})] px-3 py-1 rounded-full text-sm font-medium`}
        >
          {skill}
        </span>
      ))}
    </div>
  );
};