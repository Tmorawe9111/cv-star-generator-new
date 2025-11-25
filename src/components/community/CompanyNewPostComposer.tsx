import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Image as ImageIcon,
  FileText,
  Loader2,
  Sparkles,
  Megaphone,
  Calendar,
  PartyPopper,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/hooks/useCompany";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { capitalizeFirst } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";

type PostVariant = "story" | "announcement" | "job";

interface MediaFile {
  file: File;
  preview: string;
  type: "image" | "video";
}

interface DocumentFile {
  file: File;
  name: string;
}

interface JobOption {
  id: string;
  title: string;
  city?: string | null;
  employment_type?: string | null;
}

interface CompanyNewPostComposerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultVariant?: PostVariant;
}

export default function CompanyNewPostComposer({
  open,
  onOpenChange,
  defaultVariant = "story",
}: CompanyNewPostComposerProps) {
  const { company } = useCompany();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [variant, setVariant] = useState<PostVariant>(defaultVariant);
  const [content, setContent] = useState("");
  const [media, setMedia] = useState<MediaFile[]>([]);
  const [documents, setDocuments] = useState<DocumentFile[]>([]);
  const [jobs, setJobs] = useState<JobOption[]>([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [ctaLabel, setCtaLabel] = useState("Jetzt informieren");
  const [ctaUrl, setCtaUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setVariant(defaultVariant);
      setSelectedJobId(null);
      setContent("");
      setMedia([]);
      setDocuments([]);
      setCtaLabel("Jetzt informieren");
      setCtaUrl("");
    }
  }, [open, defaultVariant]);

  useEffect(() => {
    if (!open || !company?.id) return;
    let cancelled = false;
    const loadJobs = async () => {
      setJobsLoading(true);
      try {
        const ACTIVE_STATUS = new Set([
          "published",
          "active",
          "aktiv",
          "online",
          "live",
          "running",
          "visible",
          "open",
        ]);

        const { data, error } = await supabase
          .from("job_posts")
          .select("id, title, city, employment_type, status, is_active")
          .eq("company_id", company.id)
          .order("created_at", { ascending: false });

        if (error) throw error;

        let activeJobs =
          data?.filter((job) => {
            if (!job) return false;
            if (job.is_active === true) return true;
            if (job.is_active === false) return false;
            const normalized = typeof job.status === "string" ? job.status.toLowerCase() : "";
            return normalized && ACTIVE_STATUS.has(normalized);
          }) ?? [];

        if (activeJobs.length === 0) {
          const { data: legacyJobs, error: legacyError } = await supabase
            .from("jobs")
            .select("id, title, city, employment_type, status, is_active")
            .eq("company_id", company.id)
            .order("created_at", { ascending: false });

          if (!legacyError) {
            activeJobs =
              legacyJobs?.filter((job) => {
                if (!job) return false;
                if (job.is_active === true) return true;
                const normalized = typeof job.status === "string" ? job.status.toLowerCase() : "";
                return normalized && ACTIVE_STATUS.has(normalized);
              }) ?? [];
          }
        }

        if (!cancelled) {
          setJobs(
            activeJobs.map((job) => ({
              id: job.id,
              title: job.title,
              city: job.city,
              employment_type: job.employment_type,
            }))
          );
        }
      } catch (error) {
        console.error("Error loading active jobs:", error);
        if (!cancelled) setJobs([]);
      } finally {
        if (!cancelled) setJobsLoading(false);
      }
    };
    loadJobs();
    return () => {
      cancelled = true;
    };
  }, [open, company?.id]);

  const handleClose = () => {
    if (isSubmitting) return;
    setContent("");
    setMedia((prev) => {
      prev.forEach((item) => URL.revokeObjectURL(item.preview));
      return [];
    });
    setDocuments([]);
    onOpenChange(false);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const mapped = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      type: file.type.startsWith("video") ? "video" : "image",
    }));
    setMedia((prev) => [...prev, ...mapped]);
  };

  const handleDocumentUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const mapped = files.map((file) => ({
      file,
      name: file.name,
    }));
    setDocuments((prev) => [...prev, ...mapped]);
  };

  const removeMedia = (index: number) => {
    setMedia((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const removeDocument = (index: number) => {
    setDocuments((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadFile = async (file: File, bucket: string, folder: string): Promise<string> => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${folder}/${company?.id || "company"}/${Date.now()}-${Math.random().toString(16).slice(2)}.${fileExt}`;
    const { error: uploadError } = await supabase.storage.from(bucket).upload(fileName, file);
    if (uploadError) throw uploadError;
    const {
      data: { publicUrl },
    } = supabase.storage.from(bucket).getPublicUrl(fileName);
    return publicUrl;
  };

  const isJobVariant = variant === "job";
  const isEventVariant = variant === "announcement";

  const canSubmit = useMemo(() => {
    if (isJobVariant) {
      return !!selectedJobId && !isSubmitting;
    }
    return (!!content.trim() || media.length > 0 || documents.length > 0) && !isSubmitting;
  }, [variant, selectedJobId, content, media.length, documents.length, isSubmitting]);

  const handleSubmit = async () => {
    if (!company?.id || !user?.id) {
      toast({
        title: "Nicht angemeldet",
        description: "Bitte melden Sie sich an, um zu posten.",
        variant: "destructive",
      });
      return;
    }

    if (isJobVariant && !selectedJobId) {
      toast({
        title: "Job auswählen",
        description: "Bitte wählen Sie eine Stelle aus, die hervorgehoben werden soll.",
        variant: "destructive",
      });
      return;
    }

    if (!content.trim() && media.length === 0 && documents.length === 0 && !isJobVariant) {
      toast({
        title: "Leerer Beitrag",
        description: "Bitte geben Sie einen Text ein oder fügen Sie Medien hinzu.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const mediaPayload = await Promise.all(
        media.map(async (item) => ({
          url: await uploadFile(
            item.file,
            "post-media",
            item.type === "video" ? "videos" : "images"
          ),
          type: item.type,
        }))
      );

      const documentsPayload = await Promise.all(
        documents.map(async (doc) => ({
          url: await uploadFile(doc.file, "post-documents", "files"),
          name: doc.name,
          type: doc.file.type || "document",
        }))
      );

      const finalContent =
        isJobVariant && !content.trim()
          ? "Wir haben eine neue Stelle veröffentlicht – jetzt informieren!"
          : capitalizeFirst(content.trim());

      const insertPayload: Record<string, any> = {
        author_id: company.id,
        author_type: "company",
        company_id: company.id,
        user_id: user.id,
        content: finalContent,
        media: mediaPayload,
        documents: documentsPayload,
        image_url: mediaPayload.length > 0 ? mediaPayload[0].url : null,
        post_type: isJobVariant ? "job" : isEventVariant ? "event" : "text",
        visibility: "CommunityAndCompanies", // Company posts are visible to everyone
        status: "published",
      };

      if (isJobVariant) {
        insertPayload.job_id = selectedJobId;
        insertPayload.applies_enabled = true;
        insertPayload.cta_label = ctaLabel.trim() || "Jetzt informieren";
        insertPayload.cta_url = ctaUrl.trim() || null;
      }

      const { data, error } = await supabase
        .from("posts")
        .insert(insertPayload)
        .select()
        .single();

      if (error) {
        console.error("Supabase error details:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          insertPayload
        });
        throw error;
      }

      toast({
        title: "Beitrag veröffentlicht",
        description: "Ihr Unternehmensbeitrag wurde erfolgreich erstellt.",
      });

      queryClient.invalidateQueries({ queryKey: ["home-feed"] });
      queryClient.invalidateQueries({ queryKey: ["clean-feed"] });

      handleClose();
    } catch (error: any) {
      console.error("Error creating company post:", error);
      toast({
        title: "Fehler",
        description: error?.message || "Der Beitrag konnte nicht erstellt werden.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Unternehmensbeitrag erstellen</DialogTitle>
          <DialogDescription>
            Teilen Sie Updates, Neuigkeiten oder heben Sie eine Stellenanzeige hervor – sichtbare Beiträge stärken Ihre Arbeitgebermarke.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <Tabs value={variant} onValueChange={(value) => setVariant(value as PostVariant)}>
            <TabsList className="grid grid-cols-3 gap-2 bg-muted/60 p-1 rounded-lg">
              <TabsTrigger value="story" className="flex items-center gap-2 text-xs sm:text-sm">
                <Sparkles className="h-4 w-4" />
                Update
              </TabsTrigger>
              <TabsTrigger value="announcement" className="flex items-center gap-2 text-xs sm:text-sm">
                <PartyPopper className="h-4 w-4" />
                Event/News
              </TabsTrigger>
              <TabsTrigger value="job" className="flex items-center gap-2 text-xs sm:text-sm">
                <Megaphone className="h-4 w-4" />
                Job Spotlight
              </TabsTrigger>
            </TabsList>

            <TabsContent value="story" className="space-y-4 pt-4">
              <Textarea
                placeholder="Was passiert gerade bei Ihnen im Unternehmen?"
                value={content}
                onChange={(event) => setContent(event.target.value)}
                className="min-h-[140px] resize-none"
              />
            </TabsContent>

            <TabsContent value="announcement" className="space-y-4 pt-4">
              <Textarea
                placeholder="Teilen Sie Events, Erfolge oder News aus Ihrem Unternehmen."
                value={content}
                onChange={(event) => setContent(event.target.value)}
                className="min-h-[140px] resize-none"
              />
            </TabsContent>

            <TabsContent value="job" className="space-y-4 pt-4">
              <Card className="p-4 bg-slate-50 border-slate-200 space-y-3">
                <div className="flex items-center gap-2">
                  <Megaphone className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-semibold">Job hervorheben</p>
                    <p className="text-xs text-muted-foreground">
                      Wählen Sie eine aktive Stelle aus, die im Feed prominent angezeigt werden soll.
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-wide text-muted-foreground">
                    Aktive Stellenanzeige
                  </label>
                  <ScrollArea className="max-h-44 rounded-md border bg-white">
                    <div className="divide-y">
                      {jobsLoading ? (
                        <div className="p-3 text-sm text-muted-foreground flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Stellen werden geladen …
                        </div>
                      ) : jobs.length === 0 ? (
                        <div className="p-3 text-sm text-muted-foreground">
                          Keine aktiven Stellen gefunden. Veröffentlichen Sie zuerst eine Stelle im Jobs-Bereich.
                        </div>
                      ) : (
                        <ToggleGroup
                          type="single"
                          value={selectedJobId ?? undefined}
                          onValueChange={(value) => setSelectedJobId(value || null)}
                          className="flex flex-col"
                        >
                          {jobs.map((job) => (
                            <ToggleGroupItem
                              key={job.id}
                              value={job.id}
                              className="flex flex-col items-start gap-1 p-3 text-left data-[state=on]:bg-primary/10 data-[state=on]:text-foreground"
                            >
                              <span className="text-sm font-medium">{job.title}</span>
                              <span className="text-xs text-muted-foreground">
                                {[job.city, job.employment_type].filter(Boolean).join(" • ")}
                              </span>
                            </ToggleGroupItem>
                          ))}
                        </ToggleGroup>
                      )}
                    </div>
                  </ScrollArea>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-wide text-muted-foreground">
                      Call-to-Action Label
                    </label>
                    <Input
                      value={ctaLabel}
                      onChange={(event) => setCtaLabel(event.target.value)}
                      placeholder="Jetzt bewerben"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-wide text-muted-foreground">
                      Call-to-Action Link (optional)
                    </label>
                    <Input
                      value={ctaUrl}
                      onChange={(event) => setCtaUrl(event.target.value)}
                      placeholder="https://"
                    />
                  </div>
                </div>
              </Card>

              <Textarea
                placeholder="Was macht diese Stelle besonders? Fügen Sie einen kurzen Teaser hinzu."
                value={content}
                onChange={(event) => setContent(event.target.value)}
                className="min-h-[120px] resize-none"
              />
            </TabsContent>
          </Tabs>

          <div className="space-y-3">
            {/* Media Preview */}
            {media.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {media.map((item, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={item.preview}
                      alt={`Upload ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg border"
                    />
                    <button
                      onClick={() => removeMedia(index)}
                      className="absolute top-2 right-2 rounded-full bg-background/80 p-1 text-muted-foreground opacity-0 group-hover:opacity-100 transition"
                      aria-label="Datei entfernen"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Documents */}
            {documents.length > 0 && (
              <div className="space-y-2">
                {documents.map((doc, index) => (
                  <div key={index} className="flex items-center justify-between rounded-lg border bg-muted p-2 text-sm">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <FileText className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                      <span className="truncate">{doc.name}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeDocument(index)}
                      className="h-8 w-8"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upload controls */}
          <div className="flex flex-wrap gap-3">
            <label className="cursor-pointer">
              <input
                type="file"
                accept="image/*,video/*"
                multiple
                className="hidden"
                onChange={handleImageUpload}
              />
              <Button variant="outline" type="button" size="sm">
                <ImageIcon className="h-4 w-4 mr-2" />
                Medien
              </Button>
            </label>

            <label className="cursor-pointer">
              <input
                type="file"
                accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
                multiple
                className="hidden"
                onChange={handleDocumentUpload}
              />
              <Button variant="outline" type="button" size="sm">
                <FileText className="h-4 w-4 mr-2" />
                Dokumente
              </Button>
            </label>

            {isJobVariant && selectedJobId && (
              <Badge variant="outline" className="inline-flex items-center gap-2">
                Job verknüpft
                <span className="text-xs text-muted-foreground">{jobs.find((job) => job.id === selectedJobId)?.title}</span>
              </Badge>
            )}
          </div>

          <div className="flex justify-between items-center pt-2">
            <div className="text-xs text-muted-foreground">
              Tipp: Authentische Einblicke mit Bildern oder kurzen Videos erzielen mehr Reichweite.
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
                Abbrechen
              </Button>
              <Button onClick={handleSubmit} disabled={!canSubmit}>
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Veröffentlichen
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
