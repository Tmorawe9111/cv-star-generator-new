import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Check, Loader2 } from 'lucide-react';
import { PLANS, PLAN_ORDER, getPriceLabel, type PlanKey, type PlanInterval } from '@/lib/billing-v2/plans';

interface Step1PlanSelectionProps {
  selectedPlan: 'free' | 'basic' | 'growth' | 'bevisiblle';
  selectedInterval: PlanInterval;
  onPlanSelected: (plan: 'free' | 'basic' | 'growth' | 'bevisiblle', interval: PlanInterval) => void;
  onNext: () => void;
  loading: boolean;
}

export function Step1PlanSelection({
  selectedPlan,
  selectedInterval,
  onPlanSelected,
  onNext,
  loading,
}: Step1PlanSelectionProps) {
  const [interval, setInterval] = useState<PlanInterval>(selectedInterval);

  // Filter out free and enterprise plans
  const availablePlans = PLAN_ORDER.filter(
    key => key !== 'free' && key !== 'enterprise' && PLANS[key].showCheckout
  ) as Array<'basic' | 'growth' | 'bevisiblle'>;

  return (
    <div className="flex flex-col h-full space-y-8 overflow-hidden">
      {/* Header */}
      <div className="text-center space-y-3 flex-shrink-0">
        <h2 className="text-3xl font-light text-gray-900 tracking-tight">
          Wählen Sie Ihren Plan
        </h2>
        <p className="text-lg text-gray-600 leading-relaxed">
          Starten Sie kostenlos oder wählen Sie einen Plan, der zu Ihrem Unternehmen passt
        </p>
      </div>

      <div className="flex-1 flex flex-col space-y-6 min-h-0 overflow-hidden">
        {/* Interval Toggle */}
        <div className="flex items-center justify-center flex-shrink-0">
          <div className="inline-flex items-center gap-1 p-1 bg-gray-100 rounded-lg">
            <Button
              variant={interval === 'month' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setInterval('month')}
              className={`px-6 ${interval === 'month' ? '' : 'text-gray-700 hover:bg-gray-200 active:bg-gray-300'}`}
            >
              Monatlich
            </Button>
            <Button
              variant={interval === 'year' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setInterval('year')}
              className={`px-6 ${interval === 'year' ? '' : 'text-gray-700 hover:bg-gray-200 active:bg-gray-300'}`}
            >
              Jährlich
              <span className="ml-2 text-xs font-medium text-green-600">sparen</span>
            </Button>
          </div>
        </div>

        {/* Plans - Scrollable if needed */}
        <div className="flex-1 overflow-y-auto min-h-0 pr-2 space-y-6">
          {/* Free Plan Option */}
          <div className="flex justify-center">
            <Card className="p-8 border border-dashed border-gray-300 hover:border-blue-500 hover:bg-gray-50 transition-all duration-300 ease-out rounded-xl cursor-pointer max-w-md w-full shadow-sm hover:shadow-md">
              <div className="text-center space-y-5">
                <h3 className="text-2xl font-light text-gray-900">Kostenlos starten</h3>
                <p className="text-5xl font-light text-gray-900">0€</p>
                <p className="text-base text-gray-600 leading-relaxed">
                  Testen Sie alle Features kostenlos
                </p>
                <Button
                  onClick={() => onPlanSelected('free', interval)}
                  variant="outline"
                  className="w-full border-gray-300 bg-white text-gray-900 hover:bg-gray-50 hover:border-gray-400 active:bg-gray-100"
                  disabled={loading}
                >
                  Kostenlos starten
                </Button>
              </div>
            </Card>
          </div>

          {/* Paid Plans Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {availablePlans.map(planKey => {
          const plan = PLANS[planKey];
          const price = plan.prices[interval];
          const isSelected = selectedPlan === planKey;

          return (
            <Card
              key={planKey}
              className={`p-8 relative transition-all duration-300 ease-out rounded-xl ${
                isSelected
                  ? 'border-2 border-blue-600 shadow-md bg-blue-50/30'
                  : 'border border-gray-200 hover:border-gray-300 hover:shadow-sm hover:scale-[1.02] active:scale-[0.98]'
              }`}
            >
              {isSelected && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-4 py-1.5 rounded-full text-xs font-medium shadow-sm">
                  Ausgewählt
                </div>
              )}

              <div className="space-y-5">
                <div>
                  <h3 className="text-2xl font-light text-gray-900 mb-3">{plan.label}</h3>
                  <div className="mt-2">
                    <span className="text-4xl font-light text-gray-900">{getPriceLabel(price)}</span>
                    <span className="text-gray-500 text-lg">/{interval === 'month' ? 'Monat' : 'Jahr'}</span>
                  </div>
                  {interval === 'year' && (
                    <p className="text-sm text-gray-500 mt-2">
                      {getPriceLabel(price / 12)}/Monat
                    </p>
                  )}
                </div>

                <ul className="space-y-2 text-sm">
                  {plan.features.slice(0, 4).map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                    <Button
                      onClick={() => onPlanSelected(planKey, interval)}
                      variant={isSelected ? 'default' : 'outline'}
                      className={`w-full ${!isSelected ? 'border-gray-300 bg-white text-gray-900 hover:bg-gray-50 hover:border-gray-400 active:bg-gray-100' : ''}`}
                      disabled={loading}
                    >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Wird geladen...
                    </>
                  ) : (
                    isSelected ? 'Ausgewählt' : 'Plan wählen'
                  )}
                </Button>
              </div>
            </Card>
          );
        })}
          </div>
        </div>

        {/* Continue Button (for free plan) - Always visible */}
        {selectedPlan === 'free' && (
          <div className="flex-shrink-0 flex justify-center pt-4 border-t border-gray-200">
            <Button
              onClick={onNext}
              size="lg"
              className="px-8"
            >
              Weiter
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

