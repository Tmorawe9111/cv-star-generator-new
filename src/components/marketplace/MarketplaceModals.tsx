import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Briefcase, MapPin } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { CheckCircle2 } from "lucide-react";
import { triggerHaptic } from "@/hooks/useMarketplaceActions";
import type { MarketplacePost, MarketplaceJob } from "@/types/marketplace";

export interface MarketplaceModalsProps {
  applyJob: MarketplaceJob | null;
  applySuccess: boolean;
  onApplyJobChange: (job: MarketplaceJob | null) => void;
  onApplySuccessChange: (v: boolean) => void;
  companyMap: Record<string, { name: string; logo_url: string | null }>;
  commentPost: MarketplacePost | null;
  commentText: string;
  onCommentPostChange: (post: MarketplacePost | null) => void;
  onCommentTextChange: (text: string) => void;
  onSubmitComment: () => void;
  authors: Record<string, { name: string; avatar_url: string | null }>;
}

export const MarketplaceModals: React.FC<MarketplaceModalsProps> = ({
  applyJob,
  applySuccess,
  onApplyJobChange,
  onApplySuccessChange,
  companyMap,
  commentPost,
  commentText,
  onCommentPostChange,
  onCommentTextChange,
  onSubmitComment,
  authors,
}) => {
  const handleApplySubmit = () => {
    onApplySuccessChange(true);
    triggerHaptic("medium");
    setTimeout(() => {
      onApplySuccessChange(false);
      onApplyJobChange(null);
      toast({
        title: "🎉 Bewerbung gesendet!",
        description: "Das Unternehmen wird sich bei dir melden.",
      });
    }, 1500);
  };

  return (
    <>
      {/* Apply Job Dialog */}
      <Dialog
        open={!!applyJob && !applySuccess}
        onOpenChange={(open) => !open && onApplyJobChange(null)}
      >
        <DialogContent className="max-w-[360px] max-h-[85vh] rounded-3xl p-0 flex flex-col overflow-hidden">
          <div className="p-5 pb-3 border-b border-gray-100">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-center">
                Bewerben
              </DialogTitle>
              <DialogDescription className="text-center text-gray-500 mt-1 text-sm">
                Alle Details zur Stelle
              </DialogDescription>
            </DialogHeader>
          </div>

          {applyJob && (
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="flex items-start gap-3">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center shadow-sm shrink-0">
                  {companyMap[applyJob.company_id]?.logo_url ? (
                    <img
                      src={companyMap[applyJob.company_id].logo_url!}
                      alt=""
                      className="h-full w-full object-cover rounded-2xl"
                    />
                  ) : (
                    <Briefcase className="h-7 w-7 text-gray-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-base text-gray-900 leading-tight">
                    {applyJob.title}
                  </p>
                  <p className="text-sm text-gray-600 mt-0.5">
                    {companyMap[applyJob.company_id]?.name || "Top Unternehmen"}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {applyJob.location && (
                  <span className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full">
                    <MapPin className="h-3 w-3" /> {applyJob.location}
                  </span>
                )}
                {applyJob.employment_type && (
                  <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full">
                    <Briefcase className="h-3 w-3" /> {applyJob.employment_type}
                  </span>
                )}
                {(applyJob.salary_min || applyJob.salary_max) && (
                  <span className="inline-flex items-center gap-1 text-xs bg-green-50 text-green-700 px-3 py-1.5 rounded-full">
                    💰{" "}
                    {applyJob.salary_min && applyJob.salary_max
                      ? `${Math.round(applyJob.salary_min / 1000)}k - ${Math.round(applyJob.salary_max / 1000)}k €/Jahr`
                      : applyJob.salary_max
                        ? `bis ${Math.round(applyJob.salary_max / 1000)}k €/Jahr`
                        : `ab ${Math.round((applyJob.salary_min ?? 0) / 1000)}k €/Jahr`
                    }
                  </span>
                )}
              </div>

              <div className="space-y-3 pt-2">
                <h4 className="font-semibold text-sm text-gray-900">Details</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">
                      Standort
                    </p>
                    <p className="text-sm font-medium text-gray-900">
                      {applyJob.location || "Flexibel"}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">
                      Anstellung
                    </p>
                    <p className="text-sm font-medium text-gray-900">
                      {applyJob.employment_type || "Vollzeit"}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">
                      Gehalt
                    </p>
                    <p className="text-sm font-medium text-gray-900">
                      {applyJob.salary_min && applyJob.salary_max
                        ? `${Math.round(applyJob.salary_min / 1000)}k - ${Math.round(applyJob.salary_max / 1000)}k €`
                        : "Nach Vereinbarung"}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">
                      Start
                    </p>
                    <p className="text-sm font-medium text-gray-900">
                      Ab sofort
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <h4 className="font-semibold text-sm text-gray-900">
                  Das erwartet dich
                </h4>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-xs">
                      ✓
                    </span>
                    Flexibles Arbeiten & Home Office
                  </li>
                  <li className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-xs">
                      ✓
                    </span>
                    Weiterbildungsbudget
                  </li>
                  <li className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-xs">
                      ✓
                    </span>
                    Modernes Equipment
                  </li>
                </ul>
              </div>
            </div>
          )}

          <div className="p-5 pt-3 border-t border-gray-100 bg-white">
            <Button
              onClick={handleApplySubmit}
              className="w-full h-12 rounded-full bg-black hover:bg-gray-800 text-white font-semibold text-base shadow-lg"
            >
              Jetzt bewerben
            </Button>
            <button
              onClick={() => onApplyJobChange(null)}
              className="w-full mt-2 text-sm text-gray-500 py-2"
            >
              Abbrechen
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={applySuccess} onOpenChange={() => {}}>
        <DialogContent className="max-w-[300px] rounded-3xl p-8 text-center">
          <div className="flex flex-col items-center">
            <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Bewerbung gesendet!
            </h3>
            <p className="text-sm text-gray-500">Viel Erfolg! 🍀</p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Comment Dialog */}
      <Dialog
        open={!!commentPost}
        onOpenChange={(open) => !open && onCommentPostChange(null)}
      >
        <DialogContent className="max-w-[360px] rounded-3xl p-0 flex flex-col">
          <div className="p-5 border-b border-gray-100">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold">
                Kommentieren
              </DialogTitle>
            </DialogHeader>
          </div>

          {commentPost && (
            <div className="p-5 space-y-4">
              <div className="bg-gray-50 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage
                      src={
                        authors[commentPost.user_id]?.avatar_url ?? undefined
                      }
                    />
                    <AvatarFallback className="text-[10px]">U</AvatarFallback>
                  </Avatar>
                  <p className="text-xs font-medium text-gray-700">
                    {authors[commentPost.user_id]?.name || "Unbekannt"}
                  </p>
                </div>
                <p className="text-sm text-gray-600 line-clamp-2">
                  {commentPost.content}
                </p>
              </div>

              <div>
                <textarea
                  value={commentText}
                  onChange={(e) => onCommentTextChange(e.target.value)}
                  placeholder="Schreibe einen Kommentar..."
                  className="w-full h-24 p-3 text-sm border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoFocus
                />
              </div>

              <div className="flex gap-3">
                <Button
                  variant="ghost"
                  onClick={() => onCommentPostChange(null)}
                  className="flex-1 h-11 rounded-full"
                >
                  Abbrechen
                </Button>
                <Button
                  onClick={onSubmitComment}
                  disabled={!commentText.trim()}
                  className="flex-1 h-11 rounded-full bg-black hover:bg-gray-800 text-white font-semibold disabled:opacity-50"
                >
                  Posten
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
