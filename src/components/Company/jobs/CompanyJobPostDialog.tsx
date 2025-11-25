import React from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/hooks/useCompany";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

const CompanyJobPostDialog: React.FC<Props> = ({ open, onOpenChange }) => {
  const { company } = useCompany();
  const { toast } = useToast();
  const [title, setTitle] = React.useState("");
  const [location, setLocation] = React.useState("");
  const [link, setLink] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const reset = () => {
    setTitle("");
    setLocation("");
    setLink("");
    setDescription("");
  };

  const handlePost = async () => {
    if (!title.trim() || !company?.id) return;
    setIsSubmitting(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth.user;
      if (!user) throw new Error("Nicht angemeldet");

      const parts: string[] = [];
      parts.push(`Stellenangebot: ${title.trim()}${location.trim() ? " – " + location.trim() : ""}`);
      if (description.trim()) parts.push(description.trim());
      if (link.trim()) parts.push(`Jetzt bewerben: ${link.trim()}`);
      const content = parts.join("\n\n");

      const { error } = await supabase.from("posts").insert({
        content: content,
        user_id: user.id,
      });
      if (error) throw error;

      toast({ title: "Job veröffentlicht", description: "Ihr Job-Posting wurde erfolgreich erstellt." });
      reset();
      onOpenChange(false);
    } catch (e: any) {
      console.error(e);
      toast({ title: "Fehler", description: "Job-Posting konnte nicht erstellt werden.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !isSubmitting && onOpenChange(v)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Job posten</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input placeholder="Jobtitel* (z. B. Auszubildende:r Kaufmann/-frau)" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Input placeholder="Ort (optional)" value={location} onChange={(e) => setLocation(e.target.value)} />
          <Input placeholder="Bewerbungslink (optional)" value={link} onChange={(e) => setLink(e.target.value)} />
          <Textarea placeholder="Beschreibung (optional)" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>Abbrechen</Button>
          <Button onClick={handlePost} disabled={!title.trim() || isSubmitting}>Veröffentlichen</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CompanyJobPostDialog;
