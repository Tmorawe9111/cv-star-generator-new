import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Crown, Plus, Zap } from "lucide-react";

interface Quota {
  company_id: string;
  included_needs: number;
  need_credits: number;
  used_needs: number;
  remaining_needs: number;
}

interface QuotaBannerProps {
  quota: Quota;
  packageName?: string;
  onUpgrade: () => void;
  onPurchaseExtra: () => void;
}

export function QuotaBanner({ quota, packageName = "Starter", onUpgrade, onPurchaseExtra }: QuotaBannerProps) {
  const totalAvailable = quota.included_needs + quota.need_credits;
  const usagePercentage = totalAvailable > 0 ? (quota.used_needs / totalAvailable) * 100 : 0;
  
  const getStatusColor = () => {
    if (quota.remaining_needs === 0) return "text-red-600 bg-red-50 border-red-200";
    if (quota.remaining_needs <= 1) return "text-yellow-600 bg-yellow-50 border-yellow-200";
    return "text-green-600 bg-green-50 border-green-200";
  };

  const getStatusMessage = () => {
    if (quota.remaining_needs === 0) {
      return "Alle Anforderungsprofile aufgebraucht";
    }
    if (quota.remaining_needs === 1) {
      return "Noch 1 Anforderungsprofil verfügbar";
    }
    return `Noch ${quota.remaining_needs} Anforderungsprofile verfügbar`;
  };

  const getProgressColor = () => {
    if (usagePercentage >= 90) return "bg-red-500";
    if (usagePercentage >= 70) return "bg-yellow-500";
    return "bg-green-500";
  };

  return (
    <Card className={`border-2 ${getStatusColor()}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Crown className="h-5 w-5" />
            <div>
              <h3 className="font-semibold text-sm">Anforderungsprofile</h3>
              <p className="text-xs text-muted-foreground">
                {packageName} Paket
              </p>
            </div>
          </div>
          
          <Badge variant="outline" className="font-mono">
            {quota.used_needs} / {totalAvailable}
          </Badge>
        </div>

        <div className="space-y-3">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">{getStatusMessage()}</span>
              <span className="text-xs text-muted-foreground">
                {Math.round(usagePercentage)}% genutzt
              </span>
            </div>
            <Progress 
              value={usagePercentage} 
              className="h-2"
            />
          </div>

          {/* Breakdown */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Im Paket enthalten:</span>
              <span className="font-medium ml-2">{quota.included_needs}</span>
            </div>
            {quota.need_credits > 0 && (
              <div>
                <span className="text-muted-foreground">Extra Credits:</span>
                <span className="font-medium ml-2">{quota.need_credits}</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            {quota.remaining_needs === 0 ? (
              <>
                <Button size="sm" onClick={onPurchaseExtra} className="flex-1">
                  <Plus className="h-4 w-4 mr-2" />
                  +1 Need (29€)
                </Button>
                <Button size="sm" variant="outline" onClick={onUpgrade} className="flex-1">
                  <Zap className="h-4 w-4 mr-2" />
                  Upgrade
                </Button>
              </>
            ) : quota.remaining_needs <= 1 ? (
              <Button size="sm" variant="outline" onClick={onUpgrade} className="w-full">
                <Crown className="h-4 w-4 mr-2" />
                Für mehr Needs upgraden
              </Button>
            ) : (
              <Button size="sm" variant="ghost" onClick={onUpgrade} className="w-full text-xs">
                Professional Paket: 10 Needs für 99€/Monat
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}