import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProfileCard } from "@/components/profile/ProfileCard";
import { MapPin, Users, Calendar, ChevronRight, Pause, Play, Archive } from "lucide-react";
import { useState } from "react";

interface Need {
  id: string;
  name: string;
  employment_type: string;
  radius_km: number;
  start_date?: string;
  seniority?: string;
  visibility: 'active' | 'paused' | 'archived';
  created_at: string;
  location_city?: string;
  must_skills_count?: number;
  nice_skills_count?: number;
  target_groups?: string[];
}

interface TopMatch {
  id: string;
  name: string;
  vorname: string;
  nachname: string;
  avatar_url?: string;
  headline?: string;
  ort?: string;
  city?: string;
  skills?: string[];
  seeking?: string;
  fs?: string;
  role?: string;
  match_score: number;
  match_breakdown?: any;
}

interface NeedCardProps {
  need: Need;
  topMatches: TopMatch[];
  onViewAllMatches: (needId: string) => void;
  onToggleVisibility: (needId: string, visibility: 'active' | 'paused') => void;
  onArchive: (needId: string) => void;
}

export function NeedCard({ need, topMatches, onViewAllMatches, onToggleVisibility, onArchive }: NeedCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getEmploymentTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      'apprenticeship': 'Ausbildung',
      'full_time': 'Vollzeit',
      'part_time': 'Teilzeit',
      'internship': 'Praktikum'
    };
    return types[type] || type;
  };

  const getSeniorityLabel = (seniority?: string) => {
    const levels: Record<string, string> = {
      'entry': 'Einsteiger',
      'junior': 'Junior',
      'senior': 'Senior',
      'expert': 'Experte'
    };
    return seniority ? levels[seniority] || seniority : '';
  };

  const getVisibilityColor = (visibility: string) => {
    switch (visibility) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'paused': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'archived': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getVisibilityLabel = (visibility: string) => {
    switch (visibility) {
      case 'active': return 'Aktiv';
      case 'paused': return 'Pausiert';
      case 'archived': return 'Archiviert';
      default: return visibility;
    }
  };

  return (
    <Card className="relative">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold mb-2">{need.name}</CardTitle>
            
            <div className="flex flex-wrap gap-2 mb-3">
              <Badge variant="secondary" className="text-xs">
                <Users className="h-3 w-3 mr-1" />
                {getEmploymentTypeLabel(need.employment_type)}
              </Badge>
              
              {need.seniority && (
                <Badge variant="outline" className="text-xs">
                  {getSeniorityLabel(need.seniority)}
                </Badge>
              )}
              
              <Badge variant="outline" className="text-xs">
                <MapPin className="h-3 w-3 mr-1" />
                {need.radius_km}km Umkreis
              </Badge>
              
              {need.start_date && (
                <Badge variant="outline" className="text-xs">
                  <Calendar className="h-3 w-3 mr-1" />
                  {new Date(need.start_date).toLocaleDateString('de-DE')}
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <span>Must: {need.must_skills_count || 0}</span>
              <span>•</span>
              <span>Nice: {need.nice_skills_count || 0}</span>
              {need.target_groups && need.target_groups.length > 0 && (
                <>
                  <span>•</span>
                  <span>{need.target_groups.join(', ')}</span>
                </>
              )}
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <Badge className={`text-xs ${getVisibilityColor(need.visibility)}`}>
              {getVisibilityLabel(need.visibility)}
            </Badge>
            <div className="flex gap-1">
              {need.visibility === 'active' ? (
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => onToggleVisibility(need.id, 'paused')}
                  className="h-8 w-8 p-0"
                  title="Pausieren"
                >
                  <Pause className="h-4 w-4" />
                </Button>
              ) : need.visibility === 'paused' ? (
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => onToggleVisibility(need.id, 'active')}
                  className="h-8 w-8 p-0"
                  title="Aktivieren"
                >
                  <Play className="h-4 w-4" />
                </Button>
              ) : null}
              
              {need.visibility !== 'archived' && (
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => onArchive(need.id)}
                  className="h-8 w-8 p-0"
                  title="Archivieren"
                >
                  <Archive className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Top 4 Matches */}
        {topMatches.length > 0 ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm">Top Matches</h4>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => onViewAllMatches(need.id)}
                className="text-xs text-primary hover:text-primary/80"
              >
                Alle anzeigen
                <ChevronRight className="h-3 w-3 ml-1" />
              </Button>
            </div>

            {isExpanded ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {topMatches.map((match) => (
                  <div key={match.id} className="relative">
                    <ProfileCard
                      profile={{
                        ...match,
                        name: `${match.vorname} ${match.nachname}`,
                        city: match.ort,
                        skills: match.skills || [],
                        seeking: match.headline || '',
                        fs: null,
                        role: match.headline || ''
                      }}
                      variant="search"
                    />
                    <div className="absolute top-2 right-2">
                      <Badge variant="secondary" className="text-xs font-bold">
                        {match.match_score}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex -space-x-2 items-center">
                {topMatches.slice(0, 3).map((match, index) => (
                  <div 
                    key={match.id} 
                    className="relative w-10 h-10 rounded-full border-2 border-background overflow-hidden bg-muted"
                    style={{ zIndex: 10 - index }}
                  >
                    {match.avatar_url ? (
                      <img 
                        src={match.avatar_url} 
                        alt={`${match.vorname} ${match.nachname}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                        {match.vorname?.[0]}{match.nachname?.[0]}
                      </div>
                    )}
                  </div>
                ))}
                
                {topMatches.length > 3 && (
                  <div className="w-10 h-10 rounded-full border-2 border-background bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground">
                    +{topMatches.length - 3}
                  </div>
                )}
                
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="ml-3 text-xs"
                >
                  {isExpanded ? 'Weniger' : 'Mehr'} anzeigen
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-4 text-muted-foreground">
            <p className="text-sm">Noch keine Matches gefunden</p>
            <p className="text-xs mt-1">Matches werden kontinuierlich aktualisiert</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}