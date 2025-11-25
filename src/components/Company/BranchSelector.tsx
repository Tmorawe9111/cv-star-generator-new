import { Card } from "@/components/ui/card";
import { BRANCHES } from "@/lib/branches";

interface BranchSelectorProps {
  selectedBranches: string[];
  onSelectionChange: (branches: string[]) => void;
  error?: string;
}

// Use centralized branch definitions
const branches = BRANCHES.map(branch => ({
  key: branch.key,
  emoji: branch.emoji || '',
  title: branch.label,
  desc: branch.desc || ''
}));

export function BranchSelector({ selectedBranches, onSelectionChange, error }: BranchSelectorProps) {
  const toggleBranch = (branchKey: string) => {
    if (selectedBranches.includes(branchKey)) {
      onSelectionChange(selectedBranches.filter(b => b !== branchKey));
    } else {
      onSelectionChange([...selectedBranches, branchKey]);
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-lg font-semibold mb-1">Branchen</h3>
        <p className="text-sm text-muted-foreground">In welchen Bereichen suchen Sie?</p>
        {error && (
          <p className="text-sm text-destructive font-medium mt-1">{error}</p>
        )}
      </div>
      
      <div className="grid grid-cols-4 gap-2">
        {branches.map((branch) => (
          <Card 
            key={branch.key}
            className={`p-3 cursor-pointer transition-all hover:shadow-sm ${
              selectedBranches.includes(branch.key)
                ? 'ring-2 ring-primary bg-primary/5' 
                : error 
                  ? 'border-destructive ring-1 ring-destructive/20 hover:bg-accent/50'
                  : 'hover:bg-accent/50'
            }`}
            onClick={() => toggleBranch(branch.key)}
          >
            <div className="text-center">
              <div className="text-xl mb-1">{branch.emoji}</div>
              <h4 className="font-medium text-xs mb-1">{branch.title}</h4>
              <p className="text-[11px] text-muted-foreground leading-tight">{branch.desc}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}