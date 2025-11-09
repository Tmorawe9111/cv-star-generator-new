import { Fragment } from "react";
import { CandidateCard, type CandidateCardData, type PrimaryAction, type SecondaryAction } from "./CandidateCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

export type CandidateListVariant = "new" | "unlocked" | "planned";

export interface CandidateListItem extends CandidateCardData {
  badgeLabel?: string;
  badgeTone?: "accent" | "info";
}

interface CandidateListProps {
  items: CandidateListItem[];
  loading?: boolean;
  variant: CandidateListVariant;
  primaryActionFactory?: (candidate: CandidateListItem) => PrimaryAction | undefined;
  secondaryActionFactory?: (candidate: CandidateListItem) => SecondaryAction | undefined;
  rejectActionFactory?: (candidate: CandidateListItem) => SecondaryAction | undefined;
  onViewProfile?: (candidateId: string) => void;
  onDownloadCv?: (candidateId: string) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

function ListSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {Array.from({ length: 4 }).map((_, index) => (
        <Skeleton key={index} className="h-64 rounded-2xl" />
      ))}
    </div>
  );
}

export function CandidateList({
  items,
  loading,
  variant,
  primaryActionFactory,
  secondaryActionFactory,
  rejectActionFactory,
  onViewProfile,
  onDownloadCv,
  onLoadMore,
  hasMore,
}: CandidateListProps) {
  if (loading && !items.length) {
    return <ListSkeleton />;
  }

  if (!loading && !items.length) {
    const emptyMessages: Record<CandidateListVariant, { title: string; subtitle: string }> = {
      new: {
        title: "Keine neuen Bewerbungen",
        subtitle: "Sobald neue Bewerbungen eingehen, erscheinen sie hier automatisch.",
      },
      unlocked: {
        title: "Derzeit keine freigeschalteten Profile ohne Termin",
        subtitle: "Schalten Sie ein Profil frei oder planen Sie neue Gespräche.",
      },
      planned: {
        title: "Keine Interviews geplant",
        subtitle: "Planen Sie ein Gespräch, um es hier zu sehen.",
      },
    };

    const content = emptyMessages[variant];
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center">
        <p className="text-base font-semibold text-slate-800">{content.title}</p>
        <p className="mt-2 text-sm text-muted-foreground">{content.subtitle}</p>
      </div>
    );
  }

  return (
    <Fragment>
      <div className="grid gap-4 md:grid-cols-2">
        {items.map(candidate => (
          <CandidateCard
            key={candidate.id}
            data={candidate}
            badge={candidate.badgeLabel ? { label: candidate.badgeLabel, tone: candidate.badgeTone ?? "info" } : undefined}
            primaryAction={primaryActionFactory?.(candidate)}
            secondaryAction={secondaryActionFactory?.(candidate)}
            rejectAction={rejectActionFactory?.(candidate)}
            onViewProfile={onViewProfile}
            onDownloadCv={onDownloadCv}
          />
        ))}
      </div>
      {hasMore && (
        <div className="mt-6 flex justify-center">
          <Button variant="outline" onClick={onLoadMore} disabled={loading}>
            Mehr laden
          </Button>
        </div>
      )}
    </Fragment>
  );
}
