import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useCompany } from "@/hooks/useCompany";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CandidateNotesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidateId: string;
}

interface NoteRow {
  id: string;
  body: string;
  created_at: string;
  created_by: string;
}

export const CandidateNotesDialog: React.FC<CandidateNotesDialogProps> = ({ open, onOpenChange, candidateId }) => {
  const { company } = useCompany();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState<NoteRow[]>([]);
  const [newNote, setNewNote] = useState("");

  const loadNotes = async () => {
    if (!company) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("candidate_notes")
      .select("id, body, created_at, created_by")
      .eq("company_id", company.id)
      .eq("candidate_id", candidateId)
      .order("created_at", { ascending: false });
    if (error) {
      toast({ title: "Fehler beim Laden", description: error.message, variant: "destructive" });
    } else {
      setNotes((data as any) || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (open) loadNotes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, company?.id, candidateId]);

  const addNote = async () => {
    if (!company) return;
    const body = newNote.trim();
    if (!body) {
      toast({ title: "Bitte Text eingeben", description: "Die Notiz darf nicht leer sein." });
      return;
    }
    const { data: authData } = await supabase.auth.getUser();
    const user = authData.user;
    if (!user) {
      toast({ title: "Nicht angemeldet", description: "Bitte melden Sie sich an.", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("candidate_notes").insert({
      company_id: company.id,
      candidate_id: candidateId,
      body,
      created_by: user.id,
    } as any);
    if (error) {
      toast({ title: "Fehler beim Speichern", description: error.message, variant: "destructive" });
    } else {
      setNewNote("");
      await loadNotes();
      toast({ title: "Notiz gespeichert" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Notizen</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Neue Notiz hinzufügen..."
              rows={3}
            />
            <div className="flex justify-end">
              <Button size="sm" onClick={addNote}>Speichern</Button>
            </div>
          </div>
          <Separator />
          <div>
            <h3 className="text-sm font-medium mb-2">Vergangene Notizen</h3>
            <ScrollArea className="h-64 pr-3">
              {loading ? (
                <div className="text-sm text-muted-foreground">Laden...</div>
              ) : notes.length === 0 ? (
                <div className="text-sm text-muted-foreground">Noch keine Notizen vorhanden.</div>
              ) : (
                <ul className="space-y-3">
                  {notes.map((n) => (
                    <li key={n.id} className="rounded-md border p-3 bg-card">
                      <div className="text-sm whitespace-pre-wrap">{n.body}</div>
                      <div className="mt-2 text-xs text-muted-foreground">
                        {new Date(n.created_at).toLocaleString()}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
