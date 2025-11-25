import React, { useEffect, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type FeedSortOption = "relevant" | "newest";

export const FeedSortBar: React.FC = () => {
  const [sort, setSort] = useState<FeedSortOption>("relevant");

  useEffect(() => {
    const saved = (localStorage.getItem("feed_sort") as FeedSortOption) || "relevant";
    setSort(saved);
  }, []);

  const onChange = (value: FeedSortOption) => {
    setSort(value);
    localStorage.setItem("feed_sort", value);
    window.dispatchEvent(new CustomEvent('feed-sort-changed', { detail: value }));
    // Hinweis: Sortierung war bisher nur UI – jetzt wird sie serverseitig genutzt
  };

  return (
    <div className="flex items-center justify-between gap-2 w-full">
      <div className="text-muted-foreground text-xs shrink-0">Feed-Ansicht:</div>
      <div className="min-w-0 flex-1">
        <Select value={sort} onValueChange={(v) => onChange(v as FeedSortOption)}>
          <SelectTrigger className="h-7 text-xs border-0 bg-transparent shadow-none p-0 h-auto">
            <SelectValue placeholder="Relevanteste zuerst" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="relevant">Relevanteste zuerst</SelectItem>
            <SelectItem value="newest">Neueste zuerst</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default FeedSortBar;
