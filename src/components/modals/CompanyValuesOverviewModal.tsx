import { useState, useEffect } from 'react';
import { useCompany } from '@/hooks/useCompany';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, CheckCircle2, AlertCircle } from 'lucide-react';
import { CompanyValuesEditModal } from './CompanyValuesEditModal';
import { CompanyRoleExpectationsEditModal } from './CompanyRoleExpectationsEditModal';
import { CompanyInterviewEditModal } from './CompanyInterviewEditModal';

interface CompanyValuesOverviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
}

export function CompanyValuesOverviewModal({ open, onOpenChange, onComplete }: CompanyValuesOverviewModalProps) {
  const { company } = useCompany();
  const [valuesCompleted, setValuesCompleted] = useState(false);
  const [interviewCompleted, setInterviewCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showValuesModal, setShowValuesModal] = useState(false);
  const [showRoleExpectationsModal, setShowRoleExpectationsModal] = useState(false);
  const [showInterviewModal, setShowInterviewModal] = useState(false);

  useEffect(() => {
    if (open && company?.id) {
      loadCompletionStatus();
    }
  }, [open, company?.id]);

  const loadCompletionStatus = async () => {
    if (!company?.id) return;

    try {
      const { data } = await supabase
        .from('companies')
        .select('values_completed, interview_questions_completed')
        .eq('id', company.id)
        .single();

      if (data) {
        setValuesCompleted(data.values_completed || false);
        setInterviewCompleted(data.interview_questions_completed || false);
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

  const handleRoleExpectationsComplete = () => {
    setShowRoleExpectationsModal(false);
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
            <DialogTitle className="text-lg">Werte & Erwartungen</DialogTitle>
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
                    <h3 className="font-semibold text-sm mb-1">Unternehmenswerte</h3>
                    <p className="text-xs text-muted-foreground">5 Fragen zu Ihren Werten</p>
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

              {/* Role Expectations Card */}
              <Card 
                className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => setShowRoleExpectationsModal(true)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm mb-1">Erwartungen an Mitarbeitende</h3>
                    <p className="text-xs text-muted-foreground">5 Fragen zu Ihren Erwartungen</p>
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
                    <p className="text-xs text-muted-foreground">5 Fragen für Bewerber</p>
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
      <CompanyValuesEditModal
        open={showValuesModal}
        onOpenChange={setShowValuesModal}
        onComplete={handleValuesComplete}
      />

      {/* Role Expectations Edit Modal */}
      <CompanyRoleExpectationsEditModal
        open={showRoleExpectationsModal}
        onOpenChange={setShowRoleExpectationsModal}
        onComplete={handleRoleExpectationsComplete}
      />

      {/* Interview Edit Modal */}
      <CompanyInterviewEditModal
        open={showInterviewModal}
        onOpenChange={setShowInterviewModal}
        onComplete={handleInterviewComplete}
      />
    </>
  );
}

