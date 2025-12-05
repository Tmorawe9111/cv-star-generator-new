import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, CheckCircle2, AlertCircle } from 'lucide-react';
import { ValuesEditModal } from './ValuesEditModal';
import { InterviewEditModal } from './InterviewEditModal';

interface ValuesOverviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
}

export function ValuesOverviewModal({ open, onOpenChange, onComplete }: ValuesOverviewModalProps) {
  const { user } = useAuth();
  const [valuesCompleted, setValuesCompleted] = useState(false);
  const [interviewCompleted, setInterviewCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showValuesModal, setShowValuesModal] = useState(false);
  const [showInterviewModal, setShowInterviewModal] = useState(false);

  useEffect(() => {
    if (open && user?.id) {
      loadCompletionStatus();
    }
  }, [open, user?.id]);

  const loadCompletionStatus = async () => {
    if (!user?.id) return;

    try {
      const { data } = await supabase
        .from('profiles')
        .select('values_completed, interview_completed')
        .eq('id', user.id)
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

  const handleValuesComplete = () => {
    setShowValuesModal(false);
    loadCompletionStatus();
    if (onComplete) {
      onComplete();
    }
  };

  const handleInterviewComplete = () => {
    setShowInterviewModal(false);
    loadCompletionStatus();
    if (onComplete) {
      onComplete();
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg">Werte & Interviewfragen</DialogTitle>
          </DialogHeader>
          
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="space-y-3 py-2">
              {/* Values Card */}
              <Card 
                className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => setShowValuesModal(true)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm mb-1">Werte & Arbeitsweise</h3>
                    <p className="text-xs text-muted-foreground">8 Fragen zu deinen Werten</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {valuesCompleted ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Vollständig
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 text-xs">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Unvollständig
                      </Badge>
                    )}
                  </div>
                </div>
              </Card>

              {/* Interview Card */}
              <Card 
                className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => setShowInterviewModal(true)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm mb-1">Interviewfragen</h3>
                    <p className="text-xs text-muted-foreground">5 branchenrelevante Fragen</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {interviewCompleted ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Vollständig
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 text-xs">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Unvollständig
                      </Badge>
                    )}
                  </div>
                </div>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Values Edit Modal */}
      <ValuesEditModal
        open={showValuesModal}
        onOpenChange={setShowValuesModal}
        onComplete={handleValuesComplete}
      />

      {/* Interview Edit Modal */}
      <InterviewEditModal
        open={showInterviewModal}
        onOpenChange={setShowInterviewModal}
        onComplete={handleInterviewComplete}
      />
    </>
  );
}

