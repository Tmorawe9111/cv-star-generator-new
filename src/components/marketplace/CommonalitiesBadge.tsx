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

// Test data for mutual connections (remove when real data is available)
const TEST_MUTUAL_CONNECTIONS = [
  { id: '1', avatar_url: 'https://i.pravatar.cc/150?img=1', name: 'Sarah M.' },
  { id: '2', avatar_url: 'https://i.pravatar.cc/150?img=2', name: 'Tom K.' },
  { id: '3', avatar_url: 'https://i.pravatar.cc/150?img=3', name: 'Lisa R.' },
  { id: '4', avatar_url: 'https://i.pravatar.cc/150?img=4', name: 'Max B.' },
];

export function CommonalitiesBadge({
  mutualConnections = [],
  mutualCount = 0,
  commonSchools = [],
  commonValues = [],
  commonJobs = [],
  type = 'person'
}: CommonalitiesBadgeProps) {
  // Use test data if no real connections but mutualCount > 0 (for testing)
  const displayConnections = mutualConnections.length > 0 
    ? mutualConnections.slice(0, 4)
    : (mutualCount > 0 ? TEST_MUTUAL_CONNECTIONS.slice(0, Math.min(mutualCount, 4)) : []);
  
  const displayCount = mutualCount > 0 ? mutualCount : (displayConnections.length > 0 ? displayConnections.length : 0);

  return (
    <div className="flex flex-col gap-3 mt-2 min-h-[80px]">
      {/* Mutual Connections - Instagram Style */}
      {displayConnections.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2.5">
              {displayConnections.slice(0, 3).map((mutual) => (
                <Avatar 
                  key={mutual.id} 
                  className="h-8 w-8 border-2 border-white ring-1 ring-gray-200/50 shadow-sm"
                >
                  <AvatarImage src={mutual.avatar_url || undefined} alt={mutual.name} />
                  <AvatarFallback className="text-[11px] font-medium bg-gray-100 text-gray-700">
                    {mutual.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              ))}
            </div>
            {displayCount > 3 && (
              <div className="h-8 w-8 rounded-full bg-gray-100 border-2 border-white ring-1 ring-gray-200/50 flex items-center justify-center shadow-sm">
                <span className="text-[11px] font-semibold text-gray-700">+{displayCount - 3}</span>
              </div>
            )}
            <span className="text-[13px] text-gray-600 font-medium tracking-[-0.01em] ml-1">
              {displayCount === 1 ? 'gemeinsamer Kontakt' : `${displayCount} gemeinsame Kontakte`}
            </span>
          </div>
          
          {/* Names below avatars - Instagram style: 2 names + "und x weitere" */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            {displayConnections.slice(0, 2).map((mutual, idx) => (
              <span key={mutual.id} className="text-[12px] text-gray-700 font-medium tracking-[-0.01em]">
                {mutual.name}{idx < Math.min(displayConnections.length, 2) - 1 && ','}
              </span>
            ))}
            {displayCount > 2 && (
              <span className="text-[12px] text-gray-500 font-light tracking-[-0.01em]">
                und {displayCount - 2} weitere gemeinsame Kontakte
              </span>
            )}
            {displayCount === 2 && displayConnections.length === 2 && (
              <span className="text-[12px] text-gray-500 font-light tracking-[-0.01em]">
                gemeinsame Kontakte
              </span>
            )}
            {displayCount === 1 && displayConnections.length === 1 && (
              <span className="text-[12px] text-gray-500 font-light tracking-[-0.01em]">
                gemeinsamer Kontakt
              </span>
            )}
          </div>
        </div>
      )}

      {/* Common Schools & Jobs - Apple/Airbnb Style Badges */}
      <div className="flex flex-wrap gap-2">
        {commonSchools.length > 0 && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-[10px] border bg-blue-50/60 border-blue-200/50 transition-all hover:shadow-sm">
            <GraduationCap className="h-[13px] w-[13px] text-blue-600" strokeWidth={2} />
            <div className="flex flex-col gap-0">
              <span className="text-[11px] text-gray-500 font-light leading-tight tracking-[-0.01em]">
                Gleiche Schule
              </span>
              <span className="text-[12px] text-gray-800 font-medium leading-tight tracking-[-0.01em]">
                {commonSchools[0]}
              </span>
            </div>
          </div>
        )}

        {commonJobs.length > 0 && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-[10px] border bg-purple-50/60 border-purple-200/50 transition-all hover:shadow-sm">
            <Briefcase className="h-[13px] w-[13px] text-purple-600" strokeWidth={2} />
            <div className="flex flex-col gap-0">
              <span className="text-[11px] text-gray-500 font-light leading-tight tracking-[-0.01em]">
                Gleiche Firma
              </span>
              <span className="text-[12px] text-gray-800 font-medium leading-tight tracking-[-0.01em]">
                {commonJobs[0].company}
              </span>
            </div>
          </div>
        )}

        {commonValues.length > 0 && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-[10px] border bg-pink-50/60 border-pink-200/50 transition-all hover:shadow-sm">
            <Heart className="h-[13px] w-[13px] text-pink-600" strokeWidth={2} />
            <span className="text-[12px] text-gray-800 font-medium tracking-[-0.01em]">
              Gleiche Werte: {commonValues.slice(0, 2).join(', ')}
            </span>
          </div>
        )}
      </div>

      {/* Empty state */}
      {displayConnections.length === 0 && commonSchools.length === 0 && commonJobs.length === 0 && commonValues.length === 0 && (
        <div className="text-[12px] text-gray-500/70 font-light tracking-[-0.01em]">
          Gemeinsame Kontakte / Interesse (Werte)
        </div>
      )}
    </div>
  );
}

