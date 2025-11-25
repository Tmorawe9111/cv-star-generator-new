import { Check } from 'lucide-react';

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
}

export function ProgressBar({ currentStep, totalSteps }: ProgressBarProps) {
  return (
    <div className="flex items-center justify-between w-full px-2">
      {Array.from({ length: totalSteps }, (_, i) => {
        const step = i + 1;
        const isCompleted = step < currentStep;
        const isCurrent = step === currentStep;
        
        return (
          <div key={i} className="flex items-center flex-1">
            <div className="flex flex-col items-center w-full">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ease-out ${
                  isCompleted
                    ? 'bg-blue-600 text-white shadow-sm'
                    : isCurrent
                    ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-200 ring-offset-1 scale-105'
                    : 'bg-gray-50 text-gray-400 border border-gray-200'
                }`}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5" strokeWidth={2.5} />
                ) : (
                  <span className={isCurrent ? 'text-white font-medium' : 'text-gray-400'}>{step}</span>
                )}
              </div>
            </div>
            {i < totalSteps - 1 && (
              <div
                className={`flex-1 h-0.5 mx-4 rounded-full transition-all duration-300 ease-out ${
                  isCompleted || isCurrent ? 'bg-blue-600' : 'bg-gray-100'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

