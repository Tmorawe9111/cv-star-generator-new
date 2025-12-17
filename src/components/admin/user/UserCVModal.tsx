import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Loader2, FileText, Mail, Phone, MapPin, Briefcase } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UserCVModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
}

interface CandidateProfile {
  id: string;
  full_name?: string;
  vorname?: string;
  nachname?: string;
  email?: string;
  phone?: string;
  cv_url?: string;
  bio?: string;
  location?: string;
  city?: string;
  title?: string;
  skills?: string[];
  experience_years?: number;
  education?: any[];
}

export function UserCVModal({ open, onOpenChange, userId }: UserCVModalProps) {
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<CandidateProfile | null>(null);

  useEffect(() => {
    if (!open || !userId) return;

    const loadProfile = async () => {
      setLoading(true);
      try {
        // ✅ profiles is source of truth
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .maybeSingle();

        if (profileError) throw profileError;

        if (profileData) {
          setProfile(profileData as any);
          return;
        }

        // Legacy fallback: candidates (should not be needed long-term)
        const { data: candidate, error: candidateError } = await supabase
          .from("candidates")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle();

        if (candidateError && candidateError.code !== "PGRST116") {
          throw candidateError;
        }

        setProfile(candidate as any);
      } catch (error: any) {
        console.error("CV Load Error:", error);
        toast.error("Fehler beim Laden des CVs");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [open, userId]);

  const handleDownload = async () => {
    if (!profile?.cv_url) {
      toast.error("Kein CV zum Herunterladen verfügbar");
      return;
    }

    try {
      // If cv_url is a Supabase storage path
      if (profile.cv_url.startsWith("http")) {
        window.open(profile.cv_url, "_blank");
      } else {
        // Download from Supabase storage
        const { data, error } = await supabase.storage
          .from("cvs")
          .download(profile.cv_url);

        if (error) throw error;

        const url = URL.createObjectURL(data);
        const a = document.createElement("a");
        a.href = url;
        a.download = `CV_${profile.full_name || profile.vorname || "candidate"}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      }

      toast.success("CV wird heruntergeladen");
    } catch (error: any) {
      console.error("Download Error:", error);
      toast.error("Fehler beim Herunterladen");
    }
  };

  const fullName = profile?.full_name || 
    (profile?.vorname && profile?.nachname ? `${profile.vorname} ${profile.nachname}` : null) ||
    profile?.vorname || 
    "Kandidat";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Lebenslauf: {fullName}</DialogTitle>
        </DialogHeader>
        
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : profile ? (
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={handleDownload} disabled={!profile.cv_url}>
                <Download className="h-4 w-4 mr-2" />
                CV herunterladen
              </Button>
            </div>

            {profile.cv_url ? (
              <div className="border rounded-lg overflow-hidden min-h-[600px]">
                {profile.cv_url.endsWith(".pdf") || profile.cv_url.includes("/cv/") ? (
                  <iframe
                    src={profile.cv_url}
                    className="w-full h-[600px]"
                    title="CV Preview"
                  />
                ) : (
                  <div className="p-8">
                    <div className="space-y-6">
                      {/* Header */}
                      <div className="border-b pb-4">
                        <h2 className="text-2xl font-bold">{fullName}</h2>
                        {profile.title && (
                          <p className="text-lg text-muted-foreground mt-1">{profile.title}</p>
                        )}
                      </div>

                      {/* Contact Info */}
                      <div className="space-y-2">
                        {profile.email && (
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span>{profile.email}</span>
                          </div>
                        )}
                        {profile.phone && (
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span>{profile.phone}</span>
                          </div>
                        )}
                        {(profile.location || profile.city) && (
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span>{profile.location || profile.city}</span>
                          </div>
                        )}
                        {profile.experience_years !== undefined && (
                          <div className="flex items-center gap-2 text-sm">
                            <Briefcase className="h-4 w-4 text-muted-foreground" />
                            <span>{profile.experience_years} Jahre Erfahrung</span>
                          </div>
                        )}
                      </div>

                      {/* Bio */}
                      {profile.bio && (
                        <div>
                          <h3 className="font-semibold mb-2">Über mich</h3>
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {profile.bio}
                          </p>
                        </div>
                      )}

                      {/* Skills */}
                      {profile.skills && profile.skills.length > 0 && (
                        <div>
                          <h3 className="font-semibold mb-2">Fähigkeiten</h3>
                          <div className="flex flex-wrap gap-2">
                            {profile.skills.map((skill, i) => (
                              <span
                                key={i}
                                className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Education */}
                      {profile.education && profile.education.length > 0 && (
                        <div>
                          <h3 className="font-semibold mb-2">Ausbildung</h3>
                          <div className="space-y-3">
                            {profile.education.map((edu: any, i: number) => (
                              <div key={i} className="border-l-2 border-primary pl-4">
                                <p className="font-medium">{edu.degree || edu.title}</p>
                                <p className="text-sm text-muted-foreground">
                                  {edu.institution}
                                </p>
                                {edu.year && (
                                  <p className="text-xs text-muted-foreground">{edu.year}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="border rounded-lg p-8 bg-muted/30 min-h-[600px] flex flex-col items-center justify-center">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center">
                  Kein CV hochgeladen
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="border rounded-lg p-8 bg-muted/30 min-h-[600px] flex items-center justify-center">
            <p className="text-muted-foreground text-center">
              Profil nicht gefunden
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
