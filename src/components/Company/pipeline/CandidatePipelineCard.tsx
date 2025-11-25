import React, { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Mail, Phone, FileText, Search } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CandidateNotesDialog } from "./CandidateNotesDialog";
export interface PipelineProfile {
  id: string;
  vorname: string;
  nachname: string;
  ort?: string;
  branche?: string;
  avatar_url?: string;
  headline?: string;
  email?: string;
  telefon?: string;
  cv_url?: string;
  skills?: string[];
  job_search_preferences?: string[];
}

export interface CompanyCandidateItem {
  id: string; // company_candidates.id
  candidate_id: string;
  stage: string;
  unlocked_at: string | null;
  profiles: PipelineProfile | null;
}

interface StageDef { key: string; title: string }

interface Props {
  item: CompanyCandidateItem;
  onOpen: (profileId: string) => void;
  onRemove?: (rowId: string) => void;
  onStageChange?: (rowId: string, newStage: string) => void;
  stages?: StageDef[];
}

export const CandidatePipelineCard: React.FC<Props> = ({ item, onOpen, onRemove: _onRemove, onStageChange, stages }) => {
  const p = item.profiles;
  const [selectedStage, setSelectedStage] = useState<string>(item.stage);
  const [notesOpen, setNotesOpen] = useState(false);
  if (!p) return null;
  const initials = `${p.vorname?.[0] ?? "?"}${p.nachname?.[0] ?? ""}`;

const hasEmail = !!p.email;
const hasPhone = !!p.telefon;

const statusInfo = useMemo(() => {
  if (!p.job_search_preferences || p.job_search_preferences.length === 0) {
    return null;
  }
  
  const prefs = p.job_search_preferences;
  let label = "Sucht: ";
  let bgClass = "";
  let textClass = "";
  let borderClass = "";
  
  if (prefs.includes("Praktikum") && prefs.includes("Ausbildung")) {
    label += "Praktikum & Ausbildung";
    bgClass = "bg-amber-50 dark:bg-amber-950";
    textClass = "text-amber-700 dark:text-amber-300";
    borderClass = "border-amber-200 dark:border-amber-800";
  } else if (prefs.includes("Ausbildung")) {
    label += "Ausbildung";
    bgClass = "bg-green-50 dark:bg-green-950";
    textClass = "text-green-700 dark:text-green-300";
    borderClass = "border-green-200 dark:border-green-800";
  } else if (prefs.includes("Praktikum")) {
    label += "Praktikum";
    bgClass = "bg-red-50 dark:bg-red-950";
    textClass = "text-red-700 dark:text-red-300";
    borderClass = "border-red-200 dark:border-red-800";
  } else if (prefs.includes("Nach der Ausbildung einen Job")) {
    label += "Job nach Ausbildung";
    bgClass = "bg-blue-50 dark:bg-blue-950";
    textClass = "text-blue-700 dark:text-blue-300";
    borderClass = "border-blue-200 dark:border-blue-800";
  } else if (prefs.includes("Ausbildungsplatzwechsel")) {
    label += "Ausbildungsplatzwechsel";
    bgClass = "bg-purple-50 dark:bg-purple-950";
    textClass = "text-purple-700 dark:text-purple-300";
    borderClass = "border-purple-200 dark:border-purple-800";
  } else {
    // Join all preferences if none of the specific combinations
    label += prefs.join(", ");
    bgClass = "bg-slate-50 dark:bg-slate-950";
    textClass = "text-slate-700 dark:text-slate-300";
    borderClass = "border-slate-200 dark:border-slate-800";
  }
  
  return { label, bgClass, textClass, borderClass };
}, [p.job_search_preferences]);


  const handleEmail = () => {
    if (p.email) window.location.href = `mailto:${p.email}`;
  };
  const handlePhone = () => {
    if (p.telefon) window.location.href = `tel:${p.telefon}`;
  };
  const handleCV = () => {
    if (p.cv_url) {
      window.open(p.cv_url, "_blank", "noopener");
    } else {
      window.location.href = `/company/profile/${p.id}#cv`;
    }
  };

  return (
    <Card className="relative p-3 space-y-3 cursor-grab select-none rounded-xl border border-border/70 shadow-sm bg-card">
      {/* Prominent Job Search Status Banner */}
      {statusInfo && (
        <div className={`flex items-center gap-2 p-2 rounded-lg border ${statusInfo.bgClass} ${statusInfo.borderClass}`}>
          <Search className={`h-4 w-4 ${statusInfo.textClass}`} />
          <span className={`text-sm font-medium ${statusInfo.textClass}`}>
            {statusInfo.label}
          </span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={p.avatar_url || ""} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <div className="font-medium truncate text-primary hover:underline cursor-pointer" onClick={() => onOpen(p.id)}>
            {p.vorname} {p.nachname}
          </div>
          <div className="text-sm text-muted-foreground truncate">{p.headline || p.branche || "Ausbildungsbereich"}</div>
        </div>
      </div>


      {/* Quick actions */}
      <TooltipProvider>
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="icon" variant="secondary" className="h-8 w-8" aria-label="E-Mail" onClick={handleEmail} disabled={!hasEmail}>
                <Mail className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            {!hasEmail && <TooltipContent>Keine E-Mail hinterlegt</TooltipContent>}
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="icon" variant="secondary" className="h-8 w-8" aria-label="Telefon" onClick={handlePhone} disabled={!hasPhone}>
                <Phone className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            {!hasPhone && <TooltipContent>Keine Telefonnummer hinterlegt</TooltipContent>}
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="icon" variant="secondary" className="h-8 w-8" aria-label="CV" onClick={handleCV}>
                <FileText className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>CV ansehen/downloaden</TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>

      {/* Meta */}
      <div className="flex items-center gap-2 flex-wrap">
        {p.ort && <Badge variant="outline">{p.ort}</Badge>}
        {p.branche && <Badge variant="outline">{p.branche}</Badge>}
      </div>
      {Array.isArray(p.skills) && p.skills.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          {p.skills.slice(0, 8).map((skill) => (
            <Badge key={skill} variant="secondary">{skill}</Badge>
          ))}
        </div>
      )}


      {/* Footer */}
      <div className="flex items-center gap-2 flex-wrap">
        {stages && onStageChange && (
          <Select
            value={selectedStage}
            onValueChange={(v) => {
              setSelectedStage(v);
              onStageChange(item.id, v);
            }}
          >
            <SelectTrigger className="h-8 w-[180px]">
              <SelectValue placeholder="Stage wählen" />
            </SelectTrigger>
            <SelectContent className="z-[60] bg-popover border border-border shadow-md">
              {stages.map((s) => (
                <SelectItem key={s.key} value={s.key}>{s.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Button size="sm" variant="secondary" onClick={() => setNotesOpen(true)}>Notizen</Button>

      </div>

      <CandidateNotesDialog open={notesOpen} onOpenChange={setNotesOpen} candidateId={item.candidate_id} />
    </Card>
  );
};
