import { useCallback, useMemo, useState } from "react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { ProfileNote } from "@/types/profile";

function normalizeNote(value: unknown, index: number): ProfileNote | null {
  if (!value) return null;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    return { id: `legacy-${index}-${trimmed.length}`, content: trimmed, createdAt: "" };
  }
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    const contentRaw = record.content ?? record.note ?? record.text ?? record.body;
    const content =
      typeof contentRaw === "string"
        ? contentRaw.trim()
        : Array.isArray(contentRaw)
          ? contentRaw.join("\n")
          : String(contentRaw ?? "");
    if (!content) return null;
    const createdAtRaw = record.createdAt ?? record.created_at ?? record.timestamp ?? record.date;
    const createdAt =
      typeof createdAtRaw === "string" ? createdAtRaw : createdAtRaw ? String(createdAtRaw) : "";
    const authorIdRaw = record.authorId ?? record.author_id;
    const authorNameRaw = record.authorName ?? record.author ?? record.author_email ?? record.authorEmail;
    return {
      id: (typeof record.id === "string" && record.id) || `note-${index}-${content.length}`,
      content,
      createdAt,
      authorId: typeof authorIdRaw === "string" ? authorIdRaw : authorNameRaw ? String(authorIdRaw) : null,
      authorName: typeof authorNameRaw === "string" ? authorNameRaw : authorNameRaw ? String(authorNameRaw) : null,
    };
  }
  return null;
}

export function parseCandidateNotes(raw: unknown): ProfileNote[] {
  if (!raw) return [];
  let base: unknown[] = [];
  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (!trimmed) return [];
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) base = parsed;
      else if (parsed && typeof parsed === "object") base = Object.values(parsed as Record<string, unknown>);
      else base = [trimmed];
    } catch {
      base = trimmed
        .split(/\n{2,}/)
        .map((e) => e.trim())
        .filter(Boolean);
    }
  } else if (Array.isArray(raw)) {
    base = raw;
  } else if (typeof raw === "object") {
    base = Object.values(raw as Record<string, unknown>);
  }
  return base
    .map((entry, index) => normalizeNote(entry, index))
    .filter((n): n is ProfileNote => !!n)
    .sort((a, b) => {
      const aT = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bT = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bT - aT;
    });
}

function createNoteId(): string {
  return typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `note-${Date.now()}`;
}

export interface UseProfileNotesOptions {
  companyId: string | null | undefined;
  candidateId: string | null | undefined;
  rawNotes: string | null | undefined;
  userId: string | undefined;
  userDisplayName?: string | null;
  onNotesUpdated?: () => void;
}

export interface UseProfileNotesResult {
  notesList: ProfileNote[];
  newNote: string;
  setNewNote: (value: string) => void;
  addingNote: boolean;
  handleAddNote: () => Promise<void>;
  formatNoteDate: (value: string) => string;
}

export function useProfileNotes({
  companyId,
  candidateId,
  rawNotes,
  userId,
  userDisplayName,
  onNotesUpdated,
}: UseProfileNotesOptions): UseProfileNotesResult {
  const [newNote, setNewNote] = useState("");
  const [addingNote, setAddingNote] = useState(false);

  const notesList = useMemo(() => parseCandidateNotes(rawNotes ?? null), [rawNotes]);

  const updateCandidateRecord = useCallback(
    async (payload: Record<string, unknown>) => {
      if (!companyId || !candidateId) throw new Error("Missing company or candidate id");
      const { error } = await supabase
        .from("company_candidates")
        .update({
          ...payload,
          updated_at: new Date().toISOString(),
          last_touched_at: new Date().toISOString(),
        })
        .eq("company_id", companyId)
        .eq("candidate_id", candidateId);
      if (error) throw error;
    },
    [companyId, candidateId]
  );

  const handleAddNote = useCallback(async () => {
    const trimmed = newNote.trim();
    if (!trimmed) return;
    setAddingNote(true);
    try {
      const newEntry: ProfileNote = {
        id: createNoteId(),
        content: trimmed,
        createdAt: new Date().toISOString(),
        authorId: userId ?? null,
        authorName: userDisplayName ?? null,
      };
      const updatedNotes = [newEntry, ...notesList];
      await updateCandidateRecord({ notes: JSON.stringify(updatedNotes) });
      onNotesUpdated?.();
      setNewNote("");
      toast.success("Notiz hinzugefügt");
    } catch (error) {
      console.error("Error adding note:", error);
      toast.error("Notiz konnte nicht gespeichert werden");
    } finally {
      setAddingNote(false);
    }
  }, [newNote, notesList, userId, userDisplayName, updateCandidateRecord, onNotesUpdated]);

  const formatNoteDate = useCallback((value: string) => {
    if (!value) return "Datum unbekannt";
    try {
      return format(new Date(value), "dd.MM.yyyy HH:mm", { locale: de });
    } catch {
      return value;
    }
  }, []);

  return {
    notesList,
    newNote,
    setNewNote,
    addingNote,
    handleAddNote,
    formatNoteDate,
  };
}
