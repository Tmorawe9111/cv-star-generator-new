import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit3, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { ValuesOverviewModal } from '@/components/modals/ValuesOverviewModal';

interface ValuesAndInterviewCardProps {
  profileId: string;
  isEditing?: boolean;
}

export function ValuesAndInterviewCard({ profileId, isEditing = false }: ValuesAndInterviewCardProps) {
  const [valuesCompleted, setValuesCompleted] = useState(false);
  const [interviewCompleted, setInterviewCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    loadCompletionStatus();
  }, [profileId]);

  const loadCompletionStatus = async () => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('values_completed, interview_completed')
        .eq('id', profileId)
        .single();

      if (data) {
        setValuesCompleted(data.values_completed || false);
        setInterviewCompleted(data.interview_completed || false);
      }
    } catch (error) {
      console.error('Error loading completion status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleModalComplete = () => {
    setModalOpen(false);
    loadCompletionStatus();
  };

  const isComplete = valuesCompleted && interviewCompleted;

  if (loading) {
    return null;
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold">
              Werte & Interviewfragen
            </CardTitle>
            {isComplete ? (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs h-5">
                <CheckCircle2 className="h-2.5 w-2.5 mr-1" />
                Vollständig
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 text-xs h-5">
                <AlertCircle className="h-2.5 w-2.5 mr-1" />
                Unvollständig
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Werte-Fragen</span>
            {valuesCompleted ? (
              <CheckCircle2 className="h-3 w-3 text-green-600" />
            ) : (
              <AlertCircle className="h-3 w-3 text-yellow-600" />
            )}
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Interviewfragen</span>
            {interviewCompleted ? (
              <CheckCircle2 className="h-3 w-3 text-green-600" />
            ) : (
              <AlertCircle className="h-3 w-3 text-yellow-600" />
            )}
          </div>

          {isEditing && (
            <Button
              variant="outline"
              className="w-full mt-3 h-8 text-xs"
              onClick={() => setModalOpen(true)}
            >
              <Edit3 className="h-3 w-3 mr-1.5" />
              {isComplete ? 'Bearbeiten' : 'Jetzt ausfüllen'}
            </Button>
          )}

          {!isEditing && !isComplete && (
            <p className="text-xs text-muted-foreground mt-2">
              Vervollständige für bessere Matches.
            </p>
          )}
        </CardContent>
      </Card>

      {isEditing && (
        <ValuesOverviewModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          onComplete={handleModalComplete}
        />
      )}
    </>
  );
}

