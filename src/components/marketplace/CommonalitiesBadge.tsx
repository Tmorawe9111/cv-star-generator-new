import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Users, GraduationCap, Heart, Briefcase } from 'lucide-react';

interface CommonalitiesBadgeProps {
  mutualConnections?: Array<{ id: string; avatar_url: string | null; name: string }>;
  mutualCount?: number;
  commonSchools?: string[];
  commonValues?: string[];
  commonJobs?: Array<{ company: string; position: string }>;
  type?: 'person' | 'company';
}

export function CommonalitiesBadge({
  mutualConnections = [],
  mutualCount = 0,
  commonSchools = [],
  commonValues = [],
  commonJobs = [],
  type = 'person'
}: CommonalitiesBadgeProps) {
  const reasons: string[] = [];

  // Add mutual connections/followers
  if (mutualCount > 0) {
    if (type === 'company') {
      reasons.push(`${mutualCount} ${mutualCount === 1 ? 'gemeinsamer' : 'gemeinsame'} Follower`);
    } else {
      reasons.push(`${mutualCount} ${mutualCount === 1 ? 'gemeinsamer' : 'gemeinsame'} Kontakt${mutualCount === 1 ? '' : 'e'}`);
    }
  }

  // Add common schools
  if (commonSchools.length > 0) {
    reasons.push(`Gleiche Schule: ${commonSchools[0]}`);
  }

  // Add common values
  if (commonValues.length > 0) {
    reasons.push(`Gleiche Werte: ${commonValues.slice(0, 2).join(', ')}`);
  }

  // Add common jobs
  if (commonJobs.length > 0) {
    const job = commonJobs[0];
    reasons.push(`Gleicher Job: ${job.position} bei ${job.company}`);
  }

  // Show demo text if no commonalities found
  if (reasons.length === 0 && mutualConnections.length === 0) {
    return (
      <div className="flex flex-col gap-2 mt-2">
        <div className="text-xs text-muted-foreground/70 italic">
          Gemeinsame Kontakte / Interesse (Werte)
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 mt-2">
      {/* Mutual Connections Avatars */}
      {mutualConnections.length > 0 ? (
        <div className="flex items-center gap-2">
          <div className="flex -space-x-2">
            {mutualConnections.slice(0, 3).map((mutual) => (
              <Avatar key={mutual.id} className="h-6 w-6 border-2 border-background">
                <AvatarImage src={mutual.avatar_url || undefined} alt={mutual.name} />
                <AvatarFallback className="text-[10px]">
                  {mutual.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            ))}
          </div>
          {mutualCount > 3 && (
            <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
              +{mutualCount - 3}
            </Badge>
          )}
          <span className="text-xs text-muted-foreground">
            {mutualCount === 1 ? 'gemeinsamer Kontakt' : `${mutualCount} gemeinsame Kontakte`}
          </span>
        </div>
      ) : (
        <div className="text-xs text-muted-foreground/70 italic">
          Gemeinsame Kontakte / Interesse (Werte)
        </div>
      )}

      {/* Reasons Badges */}
      {reasons.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {reasons.slice(0, 2).map((reason, idx) => {
            let icon = <Users className="h-3 w-3" />;
            if (reason.includes('Schule')) icon = <GraduationCap className="h-3 w-3" />;
            else if (reason.includes('Werte')) icon = <Heart className="h-3 w-3" />;
            else if (reason.includes('Job')) icon = <Briefcase className="h-3 w-3" />;

            return (
              <Badge key={idx} variant="outline" className="text-[10px] px-2 py-0.5 h-5 flex items-center gap-1">
                {icon}
                {reason}
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
}

