import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Sparkles } from "lucide-react";
import confetti from "canvas-confetti";
import { PLANS, type PlanKey } from "@/lib/billing-v2/plans";
import { TOKEN_PACKS } from "@/lib/billing-v2/stripe-prices";

interface PurchaseSuccessModalProps {
  open: boolean;
  onClose: () => void;
  type: "tokens" | "plan";
  tokenAmount?: number;
  planKey?: PlanKey;
}

export function PurchaseSuccessModal({
  open,
  onClose,
  type,
  tokenAmount,
  planKey,
}: PurchaseSuccessModalProps) {
  const [countdown, setCountdown] = useState(10);

  // Trigger confetti animation when modal opens
  useEffect(() => {
    if (open) {
      // Reset countdown
      setCountdown(10);

      // Trigger confetti
      const duration = 3000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

      function randomInRange(min: number, max: number) {
        return Math.random() * (max - min) + min;
      }

      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);

        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        });
      }, 250);

      return () => clearInterval(interval);
    }
  }, [open]);

  // Auto-close countdown
  useEffect(() => {
    if (!open) return;

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [open, onClose]);

  const getMessage = () => {
    if (type === "tokens" && tokenAmount) {
      return {
        title: "🎉 Glückwunsch!",
        message: `Sie haben ${tokenAmount} neue Token erhalten, um weitere Kandidaten freizuschalten!`,
      };
    }

    if (type === "plan" && planKey) {
      const plan = PLANS[planKey];
      return {
        title: "🎉 Plan-Upgrade erfolgreich!",
        message: `Sie sind nun im "${plan.label}" Plan von BeVisiblle und haben ganz neue Möglichkeiten, Talente zu entdecken!`,
      };
    }

    return {
      title: "🎉 Erfolgreich!",
      message: "Ihr Kauf war erfolgreich!",
    };
  };

  const { title, message } = getMessage();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-0 overflow-hidden border-0 shadow-2xl [&>button]:hidden">
        <div className="relative bg-white p-12 text-center">
          {/* Success Icon with Sparkles - Apple Style */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              {/* Large green circle with checkmark */}
              <div className="w-24 h-24 rounded-full bg-green-500 flex items-center justify-center shadow-lg animate-in zoom-in duration-500">
                <CheckCircle2 className="h-14 w-14 text-white" strokeWidth={2.5} />
              </div>
              
              {/* Four yellow sparkles around the circle */}
              <Sparkles className="h-6 w-6 text-yellow-400 absolute -top-1 -left-1 animate-pulse" style={{ animationDelay: '0s' }} />
              <Sparkles className="h-6 w-6 text-yellow-400 absolute -top-1 -right-1 animate-pulse" style={{ animationDelay: '0.25s' }} />
              <Sparkles className="h-6 w-6 text-yellow-400 absolute -bottom-1 -left-1 animate-pulse" style={{ animationDelay: '0.5s' }} />
              <Sparkles className="h-6 w-6 text-yellow-400 absolute -bottom-1 -right-1 animate-pulse" style={{ animationDelay: '0.75s' }} />
            </div>
          </div>

          {/* Title - Apple Style Typography */}
          <h2 className="text-3xl font-semibold text-gray-900 mb-4 tracking-tight">
            {title}
          </h2>

          {/* Message - Apple Style */}
          <p className="text-base text-gray-600 mb-8 leading-relaxed max-w-sm mx-auto">
            {message}
          </p>

          {/* CTA Button - Apple Style */}
          <div className="flex flex-col gap-3">
            <Button
              onClick={onClose}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-6 text-base font-medium shadow-sm transition-all"
              size="lg"
            >
              Weiter
            </Button>

            {/* Countdown - Subtle */}
            <p className="text-xs text-gray-400 mt-2">
              Schließt automatisch in {countdown} Sekunden
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

