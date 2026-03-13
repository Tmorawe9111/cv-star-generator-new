/**
 * Profilbild-Avatar – nutzt echte Fotos statt Comic-SVGs
 * name: "Klaus B." → männliches Bild, "Sara N." → weibliches Bild
 * Gleicher Name = immer gleiches Bild
 */
import { getProfileImageForName, getProfileImageByIndex } from '@/config/profileImages';

interface ProfileAvatarProps {
  /** Name für deterministische Zuordnung (z.B. "Klaus B.", "Maria K.") */
  name?: string;
  /** Fallback wenn kein Name: Index 0-10 für die 11 Bilder */
  index?: number;
  size?: number;
  style?: React.CSSProperties;
  className?: string;
}

export function ProfileAvatar({ name, index = 0, size = 40, style = {}, className = '' }: ProfileAvatarProps) {
  const src = name ? getProfileImageForName(name) : getProfileImageByIndex(index);
  return (
    <img
      src={src}
      alt={name ? `Profilbild von ${name}` : 'Profilbild'}
      width={size}
      height={size}
      style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', display: 'block', flexShrink: 0, ...style }}
      className={className}
    />
  );
}
