import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFollowRelations } from '@/hooks/useFollowRelations';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ChevronRight, Check, X, UserPlus } from 'lucide-react';
import { useIsMobile } from '@/hooks/useIsMobile';

export function FollowRequestsBanner() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { companyFollowRequests, loading, acceptCompanyFollow, declineCompanyFollow } = useFollowRelations();
  const [isOpen, setIsOpen] = useState(false);

  const handleViewProfile = (companyId: string) => {
    setIsOpen(false);
    navigate(`/companies/${companyId}`);
  };

  const hasRequests = companyFollowRequests.length > 0;
  
  if (!hasRequests) return null;

  const previewRequests = companyFollowRequests.slice(0, 3);

  // Shared content for both mobile sheet and desktop dialog
  const RequestsList = () => (
    <div className="space-y-2">
      {companyFollowRequests.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <UserPlus className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-lg font-medium">Keine neuen Anfragen</p>
          <p className="text-sm text-muted-foreground mt-1">
            Du hast alle Follow-Anfragen bearbeitet
          </p>
        </div>
      ) : (
        companyFollowRequests.map((req) => (
          <div
            key={req.id}
            className="flex items-center gap-4 p-4 bg-muted/30 hover:bg-muted/50 rounded-2xl transition-colors"
          >
            <button
              onClick={() => handleViewProfile(req.company.id)}
              className="flex items-center gap-4 flex-1 min-w-0 text-left group"
            >
              <Avatar className="h-14 w-14 shrink-0 ring-2 ring-background shadow-md">
                <AvatarImage src={req.company.logo_url || undefined} alt={req.company.name} />
                <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 font-semibold text-primary">
                  {req.company.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[15px] truncate group-hover:text-primary transition-colors">
                  {req.company.name}
                </p>
                {req.company.industry && (
                  <p className="text-sm text-muted-foreground truncate">{req.company.industry}</p>
                )}
                {req.company.main_location && (
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{req.company.main_location}</p>
                )}
              </div>
            </button>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                size="sm"
                variant="outline"
                className="h-9 w-9 p-0 rounded-full border-2 hover:bg-destructive/10 hover:border-destructive hover:text-destructive transition-all"
                onClick={() => declineCompanyFollow(req.id)}
                disabled={loading}
                title="Ablehnen"
              >
                <X className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                className="h-9 w-9 p-0 rounded-full bg-primary hover:bg-primary/90 shadow-md transition-all hover:scale-105"
                onClick={() => acceptCompanyFollow(req.id, req.company.id)}
                disabled={loading}
                title="Annehmen"
              >
                <Check className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))
      )}
    </div>
  );

  return (
    <>
      {/* Banner - Apple Style */}
      <button
        onClick={() => setIsOpen(true)}
        className="w-full flex items-center gap-4 p-4 bg-gradient-to-r from-primary/5 to-primary/10 hover:from-primary/10 hover:to-primary/15 rounded-2xl border border-primary/10 transition-all mb-4 group"
      >
        {/* Stacked Avatars */}
        <div className="relative flex items-center">
          {previewRequests.map((req, index) => (
            <div
              key={req.id}
              className="relative"
              style={{
                marginLeft: index > 0 ? '-10px' : '0',
                zIndex: previewRequests.length - index,
              }}
            >
              <Avatar className="h-11 w-11 border-[3px] border-background shadow-md ring-1 ring-primary/10">
                <AvatarImage src={req.company.logo_url || undefined} alt={req.company.name} />
                <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary text-xs font-semibold">
                  {req.company.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
          ))}
        </div>

        {/* Text */}
        <div className="flex-1 text-left">
          <p className="text-[15px] font-semibold text-foreground">
            Follow-Anfragen
          </p>
          <p className="text-sm text-muted-foreground">
            {companyFollowRequests.length === 1
              ? `${companyFollowRequests[0].company.name} möchte dir folgen`
              : `${companyFollowRequests.length} Unternehmen möchten dir folgen`}
          </p>
        </div>

        {/* Arrow */}
        <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
      </button>

      {/* Mobile: Sheet from bottom */}
      {isMobile ? (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetContent side="bottom" className="max-h-[85vh] overflow-hidden flex flex-col rounded-t-3xl">
            <SheetHeader className="shrink-0 text-left pb-4">
              <SheetTitle className="text-xl">Follow-Anfragen</SheetTitle>
              <SheetDescription>
                {companyFollowRequests.length} {companyFollowRequests.length === 1 ? 'Unternehmen möchte' : 'Unternehmen möchten'} dir folgen
              </SheetDescription>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto -mx-6 px-6">
              <RequestsList />
            </div>
          </SheetContent>
        </Sheet>
      ) : (
        /* Desktop: Centered Dialog */
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden rounded-2xl">
            <DialogHeader className="p-6 pb-4 border-b">
              <DialogTitle className="text-xl font-semibold">Follow-Anfragen</DialogTitle>
              <DialogDescription>
                {companyFollowRequests.length} {companyFollowRequests.length === 1 ? 'Unternehmen möchte' : 'Unternehmen möchten'} dir folgen
              </DialogDescription>
            </DialogHeader>
            <div className="max-h-[60vh] overflow-y-auto p-6 pt-4">
              <RequestsList />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

