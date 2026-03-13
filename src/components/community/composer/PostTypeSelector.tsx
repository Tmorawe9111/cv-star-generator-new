import { cn } from "@/lib/utils";
import { POST_TEMPLATES } from "@/config/postTemplates";
import type { PostType } from "@/types/community";

interface PostTypeSelectorProps {
  selectedType: PostType | null;
  onSelect: (type: PostType | null) => void;
}

export function PostTypeSelector({ selectedType, onSelect }: PostTypeSelectorProps) {
  return (
    <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
      <div className="flex gap-2 py-2 min-w-max">
        {POST_TEMPLATES.map((t) => (
          <button
            key={t.type}
            type="button"
            onClick={() => onSelect(selectedType === t.type ? null : t.type)}
            className={cn(
              "flex flex-col items-center gap-1 px-3 py-2 rounded-lg border text-sm font-medium whitespace-nowrap transition-colors",
              selectedType === t.type
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-muted/30 text-muted-foreground hover:bg-muted"
            )}
          >
            <span className="text-lg">{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
