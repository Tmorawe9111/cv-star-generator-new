import React from 'react';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Image as ImageIcon, Calendar as CalendarIcon, FileText, BarChart3, Briefcase } from 'lucide-react';
import { useCompany } from '@/hooks/useCompany';
import CompanyNewPostComposer from '@/components/community/CompanyNewPostComposer';

type ComposerVariant = "story" | "announcement" | "job";

const CompanyComposerTeaser: React.FC = () => {
  const { company } = useCompany();
  const [composerState, setComposerState] = React.useState<{
    open: boolean;
    variant: ComposerVariant;
  }>({
    open: false,
    variant: "story",
  });

  const initials = company?.name ? company.name.slice(0, 2).toUpperCase() : 'C';

  const openComposer = (variant: ComposerVariant) => {
    setComposerState({ open: true, variant });
  };

  return (
    <>
      <Card className="p-4 md:p-5 w-full">
        <div className="flex flex-col gap-3">
          {/* Zeile 1: Avatar + Eingabeleiste */}
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={company?.logo_url || undefined} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <button
              className="flex-1 text-left text-muted-foreground hover:text-foreground transition-colors h-10 px-4 rounded-full border"
              onClick={() => openComposer("story")}
              aria-label="Was möchten Sie posten?"
            >
              Was möchten Sie posten?
            </button>
          </div>

          {/* Zeile 2: Fünf Auswahlmöglichkeiten */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            <Button variant="ghost" size="sm" onClick={() => openComposer("story")} className="justify-center">
              <ImageIcon className="h-4 w-4 mr-1" /> Bild/Video
            </Button>
            <Button variant="ghost" size="sm" onClick={() => openComposer("announcement")} className="justify-center">
              <CalendarIcon className="h-4 w-4 mr-1" /> Event
            </Button>
            <Button variant="ghost" size="sm" onClick={() => openComposer("story")} className="justify-center">
              <FileText className="h-4 w-4 mr-1" /> Dokument
            </Button>
            <Button variant="ghost" size="sm" onClick={() => openComposer("announcement")} className="justify-center">
              <BarChart3 className="h-4 w-4 mr-1" /> Umfrage
            </Button>
            <Button variant="ghost" size="sm" onClick={() => openComposer("job")} className="justify-center">
              <Briefcase className="h-4 w-4 mr-1" /> Job
            </Button>
          </div>
        </div>
      </Card>

      <CompanyNewPostComposer
        open={composerState.open}
        onOpenChange={(next) => setComposerState((prev) => ({ ...prev, open: next }))}
        defaultVariant={composerState.variant}
      />
    </>
  );
};

export default CompanyComposerTeaser;
