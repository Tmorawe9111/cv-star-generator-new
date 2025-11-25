import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface FollowedCompanyCardProps {
  followId: string;
  companyId: string;
  companyName: string;
  logoUrl?: string;
  industry?: string;
  location?: string;
  onUnfollow: (followId: string) => void;
  loading?: boolean;
}

export function FollowedCompanyCard({
  followId,
  companyId,
  companyName,
  logoUrl,
  industry,
  location,
  onUnfollow,
  loading = false,
}: FollowedCompanyCardProps) {
  const navigate = useNavigate();
  
  return (
    <Card className="p-4">
      <div className="flex items-start gap-4">
        <Avatar className="h-14 w-14">
          <AvatarImage src={logoUrl || undefined} />
          <AvatarFallback>
            <Building2 className="h-6 w-6" />
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold truncate">{companyName}</h3>
            <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
              Folge ich
            </Badge>
          </div>
          
          {(industry || location) && (
            <p className="text-sm text-muted-foreground truncate">
              {[location, industry].filter(Boolean).join(' • ')}
            </p>
          )}

          <div className="flex gap-2 mt-3">
            <Button 
              size="sm" 
              variant="secondary"
              onClick={() => navigate(`/companies/${companyId}`)}
            >
              Profil
            </Button>
            <Button 
              size="sm"
              variant="outline"
              onClick={() => onUnfollow(followId)}
              disabled={loading}
            >
              Nicht mehr folgen
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
