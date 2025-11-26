import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { subscribeOpenPostComposer, notifyComposerOpened, notifyComposerClosed } from "@/lib/event-bus";
import { Loader2, Image as ImageIcon, FileText, X, Clock, ChevronDown } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { capitalizeFirst, cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useIsMobile } from "@/hooks/useIsMobile";

interface MediaFile {
  file: File;
  preview?: string;
  type: 'image' | 'video';
}

interface DocumentFile {
  file: File;
  name: string;
}

export default function NewPostComposer() {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState("");
  const [media, setMedia] = useState<MediaFile[]>([]);
  const [documents, setDocuments] = useState<DocumentFile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [visibility, setVisibility] = useState<"CommunityAndCompanies" | "CommunityOnly" | "ConnectionsOnly">("CommunityAndCompanies");
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mediaInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsubscribe = subscribeOpenPostComposer(() => {
      if (user) {
        setIsOpen(true);
        notifyComposerOpened();
        // Focus textarea after a short delay to ensure it's rendered
        setTimeout(() => {
          textareaRef.current?.focus();
        }, 100);
      } else {
        toast({
          title: "Anmeldung erforderlich",
          description: "Bitte melde dich an, um einen Beitrag zu erstellen.",
          variant: "destructive",
        });
      }
    });
    return unsubscribe;
  }, [user, toast]);

  const handleClose = () => {
    setIsOpen(false);
    notifyComposerClosed();
    setContent("");
    setMedia([]);
    setDocuments([]);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newMedia = files.map(file => ({
      file,
      preview: file.type.startsWith('video/') ? undefined : URL.createObjectURL(file),
      type: file.type.startsWith('video/') ? 'video' : 'image',
    }));
    setMedia(prev => [...prev, ...newMedia]);
  };

  const handleDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newDocs = files.map(file => ({
      file,
      name: file.name,
    }));
    setDocuments(prev => [...prev, ...newDocs]);
  };

  const removeMedia = (index: number) => {
    setMedia(prev => {
      const item = prev[index];
      if (item.preview) {
        URL.revokeObjectURL(item.preview);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const removeDocument = (index: number) => {
    setDocuments(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFile = async (file: File, bucket: string, folder: string): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${folder}/${user!.id}/${Date.now()}.${fileExt}`;
    
    const { error: uploadError, data } = await supabase.storage
      .from(bucket)
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const handleSubmit = async () => {
    if (!content.trim() && media.length === 0 && documents.length === 0) {
      toast({
        title: "Leerer Beitrag",
        description: "Bitte füge Text, Bilder oder Dokumente hinzu.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload media files
      const mediaUrls = await Promise.all(
        media.map(m => uploadFile(m.file, 'post-media', 'images'))
      );

      // Upload documents
      const documentUrls = await Promise.all(
        documents.map(d => uploadFile(d.file, 'post-documents', 'docs'))
      );

      // Create post with auto-capitalization
      const mediaUrl = mediaUrls.length > 0 ? mediaUrls[0] : null;
      const mediaArray = mediaUrls.length > 0 
        ? mediaUrls.map((url, index) => ({ 
            url, 
            type: media[index]?.type || 'image' 
          }))
        : [];
      
      const { error } = await supabase.from("posts").insert({
        content: capitalizeFirst(content.trim()),
        user_id: user!.id,
        author_id: user!.id,
        author_type: 'user',
        image_url: mediaUrl,
        media: mediaArray,
        documents: documentUrls.map(url => ({ url, name: '', type: 'document' })),
        visibility: visibility === "ConnectionsOnly" ? "Community" : visibility === "CommunityOnly" ? "Community" : "CommunityAndCompanies",
        status: 'published',
      });

      if (error) throw error;

      toast({
        title: "Beitrag erstellt",
        description: "Dein Beitrag wurde erfolgreich veröffentlicht.",
      });

      // Invalidate queries to refresh feed
      queryClient.invalidateQueries({ queryKey: ["clean-feed"] });
      queryClient.invalidateQueries({ queryKey: ["home-feed"] });

      handleClose();
    } catch (error: any) {
      console.error("Error creating post:", error);
      toast({
        title: "Fehler",
        description: "Der Beitrag konnte nicht erstellt werden.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const canPost = content.trim().length > 0 || media.length > 0 || documents.length > 0;

  const getVisibilityLabel = () => {
    switch (visibility) {
      case "CommunityAndCompanies":
        return "Alle";
      case "CommunityOnly":
        return "User Community";
      case "ConnectionsOnly":
        return "Nur Kontakte";
      default:
        return "Alle";
    }
  };

  // Header Component
  const Header = (
    <div className="flex items-center justify-between px-4 py-3 border-b border-border">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <button
          onClick={handleClose}
          className="p-1 hover:bg-muted/50 rounded-full transition-colors shrink-0"
          aria-label="Schließen"
        >
          <X className="h-5 w-5" />
        </button>
        
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarImage src={profile?.avatar_url || undefined} alt={`${profile?.vorname ?? 'Unbekannt'} Avatar`} />
          <AvatarFallback>
            {profile?.vorname && profile?.nachname
              ? `${profile.vorname[0]}${profile.nachname[0]}`
              : "U"}
          </AvatarFallback>
        </Avatar>

        <Select value={visibility} onValueChange={(v) => setVisibility(v as typeof visibility)}>
          <SelectTrigger className="h-auto p-0 border-0 bg-transparent shadow-none hover:bg-transparent focus:ring-0 text-sm font-medium gap-1">
            <SelectValue>{getVisibilityLabel()}</SelectValue>
            <ChevronDown className="h-4 w-4 opacity-50" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="CommunityAndCompanies">Alle</SelectItem>
            <SelectItem value="ConnectionsOnly">Nur Kontakte</SelectItem>
            <SelectItem value="CommunityOnly">User Community</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          className="p-2 hover:bg-muted/50 rounded-full transition-colors"
          aria-label="Planen"
        >
          <Clock className="h-5 w-5 text-muted-foreground" />
        </button>
        
        <Button
          onClick={handleSubmit}
          disabled={!canPost || isSubmitting}
          size="sm"
          className={cn(
            "rounded-full px-4",
            !canPost && "bg-muted text-muted-foreground"
          )}
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Posten"
          )}
        </Button>
      </div>
    </div>
  );

  // Action Bar Component (above keyboard on mobile)
  const ActionBar = (
    <div className="flex items-center gap-4 px-4 py-3 border-t border-border bg-background">
      <label className="cursor-pointer">
        <input
          ref={mediaInputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          className="hidden"
          onChange={handleImageUpload}
        />
        <button
          type="button"
          className="p-2 hover:bg-muted/50 rounded-full transition-colors"
          aria-label="Galerie öffnen"
          onClick={() => mediaInputRef.current?.click()}
        >
          <ImageIcon className="h-6 w-6 text-muted-foreground" />
        </button>
      </label>

      <label className="cursor-pointer">
        <input
          ref={documentInputRef}
          type="file"
          accept="application/pdf,image/jpeg,image/png,image/jpg"
          multiple
          className="hidden"
          onChange={handleDocumentUpload}
        />
        <button
          type="button"
          className="p-2 hover:bg-muted/50 rounded-full transition-colors"
          aria-label="Dokumente hinzufügen"
          onClick={() => documentInputRef.current?.click()}
        >
          <FileText className="h-6 w-6 text-muted-foreground" />
        </button>
      </label>
    </div>
  );

  // Content Component
  const Content = (
    <>
      {Header}
      
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 px-4 py-6">
          <Textarea
            ref={textareaRef}
            placeholder="Was möchtest du teilen?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[200px] md:min-h-[300px] resize-none border-0 focus-visible:ring-0 text-base p-0"
            autoFocus
          />

          {/* Media Preview */}
          {media.length > 0 && (
            <div className="grid grid-cols-2 gap-2 mt-4">
              {media.map((m, i) => (
                <div key={i} className="relative group">
                  {m.type === 'video' ? (
                    <video
                      src={URL.createObjectURL(m.file)}
                      className="w-full h-32 object-cover rounded-lg"
                      controls
                    />
                  ) : (
                    <img
                      src={m.preview}
                      alt={`Upload ${i + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                  )}
                  <button
                    onClick={() => removeMedia(i)}
                    className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Documents List */}
          {documents.length > 0 && (
            <div className="space-y-2 mt-4">
              {documents.map((doc, i) => (
                <div key={i} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-sm truncate">{doc.name}</span>
                  </div>
                  <button
                    onClick={() => removeDocument(i)}
                    className="p-1 hover:bg-destructive/10 rounded"
                  >
                    <X className="h-4 w-4 text-destructive" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Bar - only on mobile */}
        {isMobile && ActionBar}
      </div>
    </>
  );

  // Mobile: Use Sheet (fullscreen bottom sheet)
  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={handleClose}>
        <SheetContent 
          side="bottom" 
          className="h-[75vh] p-0 flex flex-col [&>button]:hidden"
        >
          {Content}
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop: Use Dialog
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] p-0 max-h-[85vh] flex flex-col [&>button]:hidden">
        {Content}
        
        {/* Desktop Action Buttons */}
        <div className="px-6 py-4 border-t border-border flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <label className="cursor-pointer">
              <input
                ref={mediaInputRef}
                type="file"
                accept="image/*,video/*"
                multiple
                className="hidden"
                onChange={handleImageUpload}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => mediaInputRef.current?.click()}
              >
                <ImageIcon className="h-4 w-4 mr-2" />
                Galerie
              </Button>
            </label>

            <label className="cursor-pointer">
              <input
                ref={documentInputRef}
                type="file"
                accept="application/pdf,image/jpeg,image/png,image/jpg"
                multiple
                className="hidden"
                onChange={handleDocumentUpload}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => documentInputRef.current?.click()}
              >
                <FileText className="h-4 w-4 mr-2" />
                Dokumente
              </Button>
            </label>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Abbrechen
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
