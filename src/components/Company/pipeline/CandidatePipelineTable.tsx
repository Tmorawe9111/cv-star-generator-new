import React, { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CompanyCandidateItem } from "./CandidatePipelineCard";
import { CandidateNotesDialog } from "./CandidateNotesDialog";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { MoreHorizontal } from "lucide-react";

interface StageDef { key: string; title: string }

interface Props {
  items: CompanyCandidateItem[];
  stages: StageDef[];
  onStageChange: (rowId: string, newStage: string) => void;
  onOpen: (profileId: string) => void;
  onRemove: (rowId: string) => void;
  onSelectionChange?: (selected: string[]) => void;
}

export const CandidatePipelineTable: React.FC<Props> = ({ items, stages, onStageChange, onOpen, onRemove: _onRemove, onSelectionChange }) => {
  const [notesFor, setNotesFor] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  useEffect(() => { onSelectionChange?.(selected); }, [selected, onSelectionChange]);
  return (
    <div className="w-full">
      <div className="w-full overflow-x-auto">
        <Table className="min-w-[1000px]">
          <TableHeader className="sticky top-0 z-10 bg-background">
            <TableRow>
              <TableHead className="sticky left-0 z-20 bg-background" style={{ width: 84 }}>
                <Checkbox
                  checked={items.length > 0 && selected.length === items.length}
                  onCheckedChange={(c) => {
                    if (c) setSelected(items.map(i => i.id));
                    else setSelected([]);
                  }}
                  aria-label="Alle auswählen"
                />
              </TableHead>
              <TableHead className="sticky left-[84px] z-20 bg-background">Name</TableHead>
              <TableHead>Job Title</TableHead>
              <TableHead>Job Stage</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Sucht</TableHead>
              <TableHead style={{ width: 220 }}>Aktionen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((it) => {
              const p = it.profiles;
              if (!p) return null;
              const initials = `${p.vorname?.[0] ?? "?"}${p.nachname?.[0] ?? ""}`;
              return (
            <TableRow key={it.id}>
              <TableCell className="sticky left-0 z-10 bg-background" style={{ width: 84 }}>
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={selected.includes(it.id)}
                    onCheckedChange={(c) => {
                      setSelected((prev) => c ? Array.from(new Set([...prev, it.id])) : prev.filter(id => id !== it.id));
                    }}
                    aria-label="Zeile auswählen"
                  />
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={p.avatar_url || ""} />
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                </div>
              </TableCell>
              <TableCell className="sticky left-[84px] z-10 bg-background">
                <button className="text-primary hover:underline font-medium truncate" onClick={() => onOpen(p.id)}>
                  {p.vorname} {p.nachname}
                </button>
              </TableCell>
                  <TableCell className="text-muted-foreground truncate">{p.headline || p.branche || "-"}</TableCell>
                  <TableCell>
                    <Select value={it.stage} onValueChange={(v) => onStageChange(it.id, v)}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="z-[60] bg-popover">
                        {stages.map(s => (
                          <SelectItem key={s.key} value={s.key}>{s.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="truncate">{p.ort || "-"}</TableCell>
                  <TableCell>
                    {(() => {
                      if (!p.job_search_preferences || p.job_search_preferences.length === 0) {
                        return <span className="text-muted-foreground text-sm">Nicht angegeben</span>;
                      }
                      
                      const prefs = p.job_search_preferences;
                      let label = "";
                      let bgClass = "";
                      let textClass = "";
                      let borderClass = "";
                      let dotColor = "";
                      
                      if (prefs.includes("Praktikum") && prefs.includes("Ausbildung")) {
                        label = "Praktikum & Ausbildung";
                        bgClass = "bg-amber-50 dark:bg-amber-950";
                        textClass = "text-amber-700 dark:text-amber-300";
                        borderClass = "border-amber-200 dark:border-amber-800";
                        dotColor = "bg-amber-500";
                      } else if (prefs.includes("Ausbildung")) {
                        label = "Ausbildung";
                        bgClass = "bg-green-50 dark:bg-green-950";
                        textClass = "text-green-700 dark:text-green-300";
                        borderClass = "border-green-200 dark:border-green-800";
                        dotColor = "bg-green-500";
                      } else if (prefs.includes("Praktikum")) {
                        label = "Praktikum";
                        bgClass = "bg-red-50 dark:bg-red-950";
                        textClass = "text-red-700 dark:text-red-300";
                        borderClass = "border-red-200 dark:border-red-800";
                        dotColor = "bg-red-500";
                      } else if (prefs.includes("Nach der Ausbildung einen Job")) {
                        label = "Job nach Ausbildung";
                        bgClass = "bg-blue-50 dark:bg-blue-950";
                        textClass = "text-blue-700 dark:text-blue-300";
                        borderClass = "border-blue-200 dark:border-blue-800";
                        dotColor = "bg-blue-500";
                      } else if (prefs.includes("Ausbildungsplatzwechsel")) {
                        label = "Ausbildungsplatzwechsel";
                        bgClass = "bg-purple-50 dark:bg-purple-950";
                        textClass = "text-purple-700 dark:text-purple-300";
                        borderClass = "border-purple-200 dark:border-purple-800";
                        dotColor = "bg-purple-500";
                      } else {
                        label = prefs.join(", ");
                        bgClass = "bg-slate-50 dark:bg-slate-950";
                        textClass = "text-slate-700 dark:text-slate-300";
                        borderClass = "border-slate-200 dark:border-slate-800";
                        dotColor = "bg-slate-500";
                      }
                      
                      return (
                        <div className={`flex items-center gap-2 p-1.5 rounded-md border min-w-fit ${bgClass} ${borderClass}`}>
                          <div className={`h-2 w-2 rounded-full ${dotColor}`} />
                          <span className={`text-xs font-medium whitespace-nowrap ${textClass}`}>{label}</span>
                        </div>
                      );
                    })()}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="secondary" onClick={() => setNotesFor(it.candidate_id)}>Notizen</Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="icon" variant="ghost" aria-label="Weitere Aktionen">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="z-[70] bg-popover">
                          <DropdownMenuLabel>Aktionen</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuLabel>Stage wechseln</DropdownMenuLabel>
                          {stages.map(s => (
                            <DropdownMenuItem key={s.key} onClick={() => onStageChange(it.id, s.key)}>
                              {s.title}
                            </DropdownMenuItem>
                          ))}
                          <DropdownMenuItem onClick={() => setNotesFor(it.candidate_id)}>Notizen anzeigen</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      {notesFor && (
        <CandidateNotesDialog open={!!notesFor} onOpenChange={(o) => !o && setNotesFor(null)} candidateId={notesFor} />
      )}
    </div>
  );
};
