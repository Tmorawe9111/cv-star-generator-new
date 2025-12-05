import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface AccountRequiredDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobTitle?: string;
  companyName?: string;
}

export function AccountRequiredDialog({
  open,
  onOpenChange,
  jobTitle,
  companyName,
}: AccountRequiredDialogProps) {
  const navigate = useNavigate();

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-[600px] p-0 gap-0 overflow-hidden sm:rounded-2xl">
        {/* Apple-Style Content */}
        <div className="bg-white">
          {/* Header - Minimalistisch mit Logo */}
          <div className="px-8 sm:px-12 pt-12 sm:pt-16 pb-8 sm:pb-10">
            <div className="flex flex-col items-center text-center space-y-6">
              {/* Logo */}
              <div className="flex items-center justify-center">
                <img 
                  src="/assets/Logo_visiblle-2.svg" 
                  alt="BeVisiblle" 
                  className="h-16 w-16 sm:h-20 sm:w-20"
                />
              </div>
              
              {/* Title - Apple Typography */}
              <AlertDialogHeader className="space-y-3 px-0">
                <AlertDialogTitle className="text-3xl sm:text-4xl font-semibold text-gray-900 tracking-tight leading-tight">
                  Account erforderlich
                </AlertDialogTitle>
                <AlertDialogDescription className="text-base sm:text-lg text-gray-600 max-w-md leading-relaxed">
                  Um sich auf diese Stelle zu bewerben, benötigen Sie einen Account mit vollständigem Lebenslauf.
                </AlertDialogDescription>
              </AlertDialogHeader>

              {/* Job Info - Subtle Card */}
              {jobTitle && companyName && (
                <div className="mt-2 w-full max-w-md bg-gray-50/50 rounded-2xl border border-gray-100 px-6 py-5">
                  <p className="text-[11px] uppercase tracking-widest text-gray-500 mb-2 font-medium">
                    Stelle
                  </p>
                  <p className="text-lg sm:text-xl font-semibold text-gray-900 leading-tight mb-1">
                    {jobTitle}
                  </p>
                  <p className="text-sm text-gray-600">
                    {companyName}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Info Section - Minimalistisch */}
          <div className="px-8 sm:px-12 pb-8">
            <div className="max-w-md mx-auto">
              <div className="bg-gray-50/30 rounded-xl border border-gray-100 px-5 py-4">
                <p className="text-sm text-gray-600 leading-relaxed">
                  Erstellen Sie Ihren Lebenslauf in wenigen Minuten und werden Sie von passenden Unternehmen gefunden.
                </p>
              </div>
            </div>
          </div>

          {/* Buttons - Apple Style */}
          <div className="px-8 sm:px-12 pb-8 sm:pb-10 pt-2">
            <div className="max-w-md mx-auto space-y-3">
              {/* Primary Action */}
              <AlertDialogAction asChild>
                <Button
                  className="w-full h-12 sm:h-14 text-base sm:text-lg font-medium bg-[#5170ff] hover:bg-[#4260ef] text-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
                  onClick={() => {
                    onOpenChange(false);
                    // Save current job ID to return after registration
                    const currentPath = window.location.pathname;
                    navigate(`/cv-generator?returnTo=${encodeURIComponent(currentPath)}`);
                  }}
                >
                  Account erstellen
                </Button>
              </AlertDialogAction>

              {/* Secondary Actions */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  variant="outline"
                  className="flex-1 h-12 sm:h-14 text-base font-medium border-gray-300 hover:bg-gray-50 rounded-xl transition-all duration-200"
                  onClick={() => {
                    onOpenChange(false);
                    // Save current job ID to return after login
                    const currentPath = window.location.pathname;
                    navigate(`/auth?returnTo=${encodeURIComponent(currentPath)}`);
                  }}
                >
                  Bereits einen Account?
                </Button>
                <AlertDialogCancel asChild>
                  <Button 
                    variant="ghost" 
                    className="flex-1 h-12 sm:h-14 text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-all duration-200"
                  >
                    Abbrechen
                  </Button>
                </AlertDialogCancel>
              </div>
            </div>
          </div>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}

