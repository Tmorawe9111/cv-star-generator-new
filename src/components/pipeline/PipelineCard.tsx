// Pipeline Card Component for individual candidate cards
import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Eye, User, Mail, Phone } from 'lucide-react';
import { PipelineItem } from '@/services/pipelineService';
import { useNavigate } from 'react-router-dom';
import { getProfileUrl } from '@/lib/profile-url';

interface PipelineCardProps {
  item: PipelineItem;
  isDragging?: boolean;
  disabled?: boolean;
}

export default function PipelineCard({ item, isDragging = false, disabled = false }: PipelineCardProps) {
  const navigate = useNavigate();
  const profile = item.profile;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({
    id: item.id,
    disabled: disabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging || isSortableDragging ? 0.5 : 1,
  };

  const handleViewProfile = () => {
    if (profile) {
      navigate(getProfileUrl(profile));
    }
  };

  const getDisplayName = () => {
    if (profile?.full_name) return profile.full_name;
    if (profile?.vorname && profile?.nachname) {
      return `${profile.vorname} ${profile.nachname}`;
    }
    if (profile?.vorname) return profile.vorname;
    return 'Unbekannt';
  };

  const getJobTitle = () => {
    if (profile?.aktueller_beruf) return profile.aktueller_beruf;
    if (profile?.ausbildungsberuf) return profile.ausbildungsberuf;
    return 'Beruf nicht angegeben';
  };

  const getInitials = () => {
    const name = getDisplayName();
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const getStatusBadge = () => {
    switch (profile?.status) {
      case 'schueler':
        return <Badge variant="outline" className="text-xs">Schüler</Badge>;
      case 'azubi':
        return <Badge variant="secondary" className="text-xs">Azubi</Badge>;
      case 'ausgelernt':
        return <Badge variant="default" className="text-xs">Ausgelernt</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow ${
        disabled ? 'opacity-50' : ''
      }`}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={profile?.avatar_url} alt={getDisplayName()} />
            <AvatarFallback className="text-sm">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-medium text-sm truncate">
                {getDisplayName()}
              </h4>
              {getStatusBadge()}
            </div>
            
            <p className="text-xs text-muted-foreground mb-2 truncate">
              {getJobTitle()}
            </p>
            
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <User className="h-3 w-3" />
              <span>Profil freigeschaltet</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-between mt-3 pt-3 border-t">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              <Mail className="h-3 w-3 mr-1" />
              Kontakt
            </Badge>
          </div>
          
          <Button
            size="sm"
            variant="ghost"
            onClick={handleViewProfile}
            className="h-7 px-2"
          >
            <Eye className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
