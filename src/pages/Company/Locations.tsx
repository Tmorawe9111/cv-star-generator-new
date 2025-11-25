import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LocationsManager } from '@/components/Company/locations';
import { UpgradePlanModalV2 } from '@/components/billing-v2/UpgradePlanModalV2';
import { useCompany } from '@/hooks/useCompany';
import type { PlanKey } from '@/lib/billing-v2/plans';

export default function CompanyLocations() {
  const navigate = useNavigate();
  const { company } = useCompany();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const currentPlan = (company?.active_plan_id || company?.plan_type || 'free') as PlanKey;

  return (
    <div className="p-6 md:p-8 min-h-screen bg-gray-50/50">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => navigate(-1)}
        className="mb-6 -ml-2 text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Zurück
      </Button>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto">
        <LocationsManager onUpgradeClick={() => setShowUpgradeModal(true)} />
      </div>

      {/* Upgrade Modal */}
      <UpgradePlanModalV2
        open={showUpgradeModal}
        onOpenChange={setShowUpgradeModal}
        currentPlan={currentPlan}
        onSelectPlan={(plan) => {
          setShowUpgradeModal(false);
          navigate('/unternehmen/abrechnung');
        }}
      />
    </div>
  );
}

