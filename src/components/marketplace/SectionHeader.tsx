import React from "react";
import { ChevronRight } from "lucide-react";

export interface SectionHeaderProps {
  title: string;
  icon: React.ReactNode;
  onSeeAll?: () => void;
  seeAllText?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  icon,
  onSeeAll,
  seeAllText = "Alle",
}) => (
  <div className="flex items-center justify-between px-4 mb-2 h-7">
    <div className="flex items-center gap-1.5">
      <span className="flex items-center justify-center w-5 h-5">{icon}</span>
      <h2 className="text-base font-semibold text-gray-900 leading-none">
        {title}
      </h2>
    </div>
    {onSeeAll && (
      <button
        onClick={onSeeAll}
        className="text-blue-500 text-xs font-medium flex items-center active:opacity-70"
      >
        {seeAllText} <ChevronRight className="h-3.5 w-3.5" />
      </button>
    )}
  </div>
);
