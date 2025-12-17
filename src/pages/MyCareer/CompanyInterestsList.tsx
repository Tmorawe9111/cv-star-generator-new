import { useMemo, useState } from "react";
import { useCompanyInterests } from "@/hooks/useCompanyInterests";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Building2, CheckCircle2, X, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface CompanyInterestsListProps {
  searchQuery: string;
}

export function CompanyInterestsList({ searchQuery }: CompanyInterestsListProps) {
  const { data: interests, isLoading } = useCompanyInterests();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [processingRequestId, setProcessingRequestId] = useState<string | null>(null);

  const handleConfirmRequest = async (requestId: string) => {
    if (processingRequestId) return;
    setProcessingRequestId(requestId);
    try {
      const { data, error } = await supabase.rpc('confirm_company_interest_request', {
        p_request_id: requestId,
      });

      if (error) throw error;

      if (data?.success) {
        toast.success(
          data.already_unlocked 
            ? 'Profil war bereits freigeschaltet'
            : `Interesse-Anfrage bestätigt. ${data.tokens_spent} Tokens wurden abgebucht.`
        );
        // Refetch interests
        queryClient.invalidateQueries({ queryKey: ["company-interests"] });
      } else {
        toast.error(data?.message || 'Fehler beim Bestätigen der Anfrage');
      }
    } catch (error: any) {
      console.error('Error confirming interest request:', error);
      toast.error(error?.message || 'Fehler beim Bestätigen der Anfrage');
    } finally {
      setProcessingRequestId(null);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    if (processingRequestId) return;
    setProcessingRequestId(requestId);
    try {
      const { data, error } = await supabase.rpc('reject_company_interest_request', {
        p_request_id: requestId,
      });

      if (error) throw error;

      if (data?.success) {
        toast.success('Interesse-Anfrage wurde abgelehnt');
        // Refetch interests
        queryClient.invalidateQueries({ queryKey: ["company-interests"] });
      } else {
        toast.error(data?.message || 'Fehler beim Ablehnen der Anfrage');
      }
    } catch (error: any) {
      console.error('Error rejecting interest request:', error);
      toast.error(error?.message || 'Fehler beim Ablehnen der Anfrage');
    } finally {
      setProcessingRequestId(null);
    }
  };

  const filteredInterests = useMemo(() => {
    if (!interests) return [];

    let filtered = interests;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.company?.name?.toLowerCase().includes(query) ||
          item.company?.industry?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [interests, searchQuery]);

  if (isLoading) {
    return <div className="text-center py-12">Laden...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Filter Button */}
      <div className="flex gap-2">
        <Button variant="default" size="sm" className="rounded-full">
          Alle ({filteredInterests.length})
        </Button>
      </div>

      {/* Interests List */}
      {filteredInterests.length === 0 ? (
        <Card className="p-12 text-center">
          <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">
            Noch keine Unternehmen haben Interesse an dir gezeigt
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Unternehmen können dich basierend auf deinem Profil und Bewerbungen freischalten
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredInterests.map((interest) => (
            <Card
              key={interest.id}
              className={`p-6 transition-shadow ${
                interest.request_status === 'pending' 
                  ? '' 
                  : 'hover:shadow-md cursor-pointer'
              }`}
              onClick={() => {
                if (interest.request_status !== 'pending') {
                  navigate(`/companies/${interest.company_id}`);
                }
              }}
            >
              <div className="flex items-start gap-4">
                {/* Company Logo */}
                <Avatar className="h-16 w-16 rounded-lg">
                  <AvatarImage src={interest.company?.logo_url} />
                  <AvatarFallback className="rounded-lg">
                    {interest.company?.name?.charAt(0)}
                  </AvatarFallback>
                </Avatar>

                {/* Company Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg mb-1 hover:text-primary">
                    {interest.company?.name}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    {interest.company?.industry}
                  </p>

                  {/* Date and Badge */}
                  <div className="flex items-center gap-3 flex-wrap">
                    {interest.request_status === 'pending' ? (
                      <>
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
                          Ausstehend
                        </Badge>
                        {interest.created_at && (
                          <span className="text-sm text-muted-foreground">
                            vor {formatDistanceToNow(new Date(interest.created_at), { locale: de })}
                          </span>
                        )}
                        {interest.token_cost && (
                          <span className="text-sm text-muted-foreground">
                            • {interest.token_cost} Tokens werden abgebucht
                          </span>
                        )}
                      </>
                    ) : (
                      <>
                        <Badge variant="default" className="bg-green-600">
                          Interessiert
                        </Badge>
                        {interest.unlocked_at && (
                          <span className="text-sm text-muted-foreground">
                            vor {formatDistanceToNow(new Date(interest.unlocked_at), { locale: de })}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  {interest.request_status === 'pending' && interest.request_id ? (
                    <>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleConfirmRequest(interest.request_id!);
                        }}
                        disabled={processingRequestId === interest.request_id}
                      >
                        {processingRequestId === interest.request_id ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Wird verarbeitet...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Bestätigen
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRejectRequest(interest.request_id!);
                        }}
                        disabled={processingRequestId === interest.request_id}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Ablehnen
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/companies/${interest.company_id}`);
                      }}
                    >
                      Profil ansehen
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
