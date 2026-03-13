import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { ProfileNote } from "@/types/profile";

export interface ProfileNotesProps {
  notesList: ProfileNote[];
  newNote: string;
  addingNote: boolean;
  formatNoteDate: (value: string) => string;
  onNewNoteChange: (value: string) => void;
  onAddNote: () => Promise<void>;
  renderActionButtons: (placement: "notes") => React.ReactNode;
}

export function ProfileNotes({
  notesList,
  newNote,
  addingNote,
  formatNoteDate,
  onNewNoteChange,
  onAddNote,
  renderActionButtons,
}: ProfileNotesProps) {
  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">Notizen</p>
      {notesList.length === 0 ? (
        <p className="text-sm text-muted-foreground">Noch keine Notizen hinterlegt.</p>
      ) : (
        <div className="max-h-64 space-y-3 overflow-auto pr-1">
          {notesList.map((note) => (
            <div key={note.id} className="rounded-md border bg-muted/40 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                <span>{formatNoteDate(note.createdAt)}</span>
                {note.authorName && <span>{note.authorName}</span>}
              </div>
              <p className="mt-2 whitespace-pre-line text-sm text-foreground">{note.content}</p>
            </div>
          ))}
        </div>
      )}
      <Textarea
        value={newNote}
        onChange={(e) => onNewNoteChange(e.target.value)}
        placeholder="Neue Notiz hinzufügen..."
        rows={3}
      />
      <div className="flex flex-wrap items-center justify-between gap-2">
        {renderActionButtons("notes")}
        <Button size="sm" onClick={onAddNote} disabled={addingNote || !newNote.trim()}>
          {addingNote ? "Speichere..." : "Notiz hinzufügen"}
        </Button>
      </div>
    </div>
  );
}
