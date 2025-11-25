import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Check, X, Clock, UserCheck } from "lucide-react";
import { useCompanyEmploymentRequests, useUpdateEmploymentRequest, EmploymentRequest } from "@/hooks/useEmploymentRequests";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CompanyProfile } from "@/types/company";

interface EmploymentRequestsCardProps {
  company: CompanyProfile | null;
  onAfterChange?: () => void;
}

export function EmploymentRequestsCard({ company, onAfterChange }: EmploymentRequestsCardProps) {
  const { data: requests = [] } = useCompanyEmploymentRequests(company?.id);
  const updateRequest = useUpdateEmploymentRequest();
  const { toast } = useToast();

  const handleRequestResponse = async (requestId: string, status: 'accepted' | 'declined') => {
    // This function is now handled by the mutation hook
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" />Wartend</Badge>;
      case 'accepted':
        return <Badge variant="default" className="gap-1 bg-green-100 text-green-700"><Check className="h-3 w-3" />Angenommen</Badge>;
      case 'declined':
        return <Badge variant="destructive" className="gap-1"><X className="h-3 w-3" />Abgelehnt</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const pendingCount = requests.filter(req => req.status === 'pending').length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center">
            <UserCheck className="h-5 w-5 mr-2" />
            Beschäftigungsanträge ({requests.length})
          </span>
          {pendingCount > 0 && (
            <Badge variant="default" className="bg-orange-100 text-orange-700">
              {pendingCount} wartend
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {requests.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            Noch keine Beschäftigungsanträge eingegangen
          </p>
        ) : (
          <div className="space-y-3">
            {requests.map((request) => (
              <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    {request.user_profile?.avatar_url ? (
                      <AvatarImage src={request.user_profile.avatar_url} />
                    ) : (
                      <AvatarFallback>
                        {request.user_profile?.vorname?.charAt(0)?.toUpperCase() || "U"}
                        {request.user_profile?.nachname?.charAt(0)?.toUpperCase() || ""}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">
                        {request.user_profile?.vorname} {request.user_profile?.nachname}
                      </p>
                      {getStatusBadge(request.status)}
                    </div>
                    {request.user_profile?.headline && (
                      <p className="text-sm text-muted-foreground">
                        {request.user_profile.headline}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Beantragt am {new Date(request.created_at).toLocaleDateString('de-DE')}
                    </p>
                  </div>
                </div>
                
                {request.status === 'pending' && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="default"
                      className="bg-green-600 hover:bg-green-700"
                      disabled={updateRequest.isPending}
                      onClick={() => updateRequest.mutate({ requestId: request.id, status: 'accepted' })}
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Annehmen
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={updateRequest.isPending}
                      onClick={() => updateRequest.mutate({ requestId: request.id, status: 'declined' })}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Ablehnen
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}