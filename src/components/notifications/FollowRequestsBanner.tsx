import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFollowRelations } from '@/hooks/useFollowRelations';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ChevronRight, Check, X } from 'lucide-react';

export function FollowRequestsBanner() {
  const navigate = useNavigate();
  const { companyFollowRequests, loading, acceptCompanyFollow, declineCompanyFollow } = useFollowRelations();
  const [isOpen, setIsOpen] = useState(false);

  const handleViewProfile = (companyId: string) => {
    setIsOpen(false);
    navigate(`/firma/${companyId}`);
  };

  if (companyFollowRequests.length === 0) return null;

  // Get first 3 for stacked avatars preview
  const previewRequests = companyFollowRequests.slice(0, 3);

  return (
    <>
      {/* Banner - Instagram Style */}
      <button
        onClick={() => setIsOpen(true)}
        className="w-full flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 rounded-xl border border-blue-100 transition-all mb-4"
      >
        {/* Stacked Avatars */}
        <div className="relative flex items-center">
          {previewRequests.map((req, index) => (
            <div
              key={req.id}
              className="relative"
              style={{
                marginLeft: index > 0 ? '-12px' : '0',
                zIndex: previewRequests.length - index,
              }}
            >
              <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                <AvatarImage src={req.company.logo_url || undefined} alt={req.company.name} />
                <AvatarFallback className="bg-blue-100 text-blue-600 text-xs font-semibold">
                  {req.company.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
          ))}
        </div>

        {/* Text */}
        <div className="flex-1 text-left">
          <p className="text-sm font-medium text-gray-900">
            Follow-Anfragen
          </p>
          <p className="text-xs text-gray-500">
            {companyFollowRequests.length === 1
              ? `${companyFollowRequests[0].company.name} möchte dir folgen`
              : `${companyFollowRequests.length} Unternehmen möchten dir folgen`}
          </p>
        </div>

        {/* Arrow */}
        <ChevronRight className="h-5 w-5 text-gray-400" />
      </button>

      {/* Follow Requests Sheet */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="bottom" className="max-h-[80vh] overflow-hidden flex flex-col">
          <SheetHeader className="shrink-0">
            <SheetTitle>Follow-Anfragen ({companyFollowRequests.length})</SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto py-4 space-y-3">
            {companyFollowRequests.map((req) => (
              <div
                key={req.id}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl"
              >
                {/* Clickable Avatar and Name - Navigate to Profile */}
                <button
                  onClick={() => handleViewProfile(req.company.id)}
                  className="flex items-center gap-3 flex-1 min-w-0 text-left hover:opacity-80 transition-opacity"
                >
                  <Avatar className="h-12 w-12 shrink-0">
                    <AvatarImage src={req.company.logo_url || undefined} alt={req.company.name} />
                    <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold">
                      {req.company.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate hover:underline">{req.company.name}</p>
                    {req.company.industry && (
                      <p className="text-xs text-gray-500 truncate">{req.company.industry}</p>
                    )}
                    <p className="text-xs text-blue-600 mt-0.5">Profil ansehen</p>
                  </div>
                </button>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 w-8 p-0 rounded-full"
                    onClick={() => declineCompanyFollow(req.id)}
                    disabled={loading}
                    title="Ablehnen"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    className="h-8 w-8 p-0 rounded-full bg-blue-600 hover:bg-blue-700"
                    onClick={() => acceptCompanyFollow(req.id, req.company.id)}
                    disabled={loading}
                    title="Annehmen"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

