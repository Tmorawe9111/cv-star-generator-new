import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useCompany } from "@/hooks/useCompany";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { UnifiedCandidateCard } from "@/components/candidate/UnifiedCandidateCard";
import CandidateProfilePreviewModal from "@/components/candidate/CandidateProfilePreviewModal";
import { Search, SlidersHorizontal } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { searchCandidates, unlockCandidate } from "@/lib/api/applications";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { sanitizePreviewProfile } from "@/utils/sanitizePreviewProfile";

const parseJsonField = (field: any) => {
  if (!field) return null;
  if (typeof field === "string") {
    try {
      return JSON.parse(field);
    } catch {
      return field;
    }
  }
  return field;
};

export default function CandidateSearch() {
  const { company } = useCompany();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProfile, setSelectedProfile] = useState<any>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [dismissedCandidateIds, setDismissedCandidateIds] = useState<Set<string>>(new Set());
  const [unlockedCandidateIds, setUnlockedCandidateIds] = useState<Set<string>>(new Set());

  const { data: candidates, isLoading, refetch } = useQuery({
    queryKey: ["search-candidates", company?.id, searchQuery],
    queryFn: async () => {
      if (!company?.id) return [];

      const result = await searchCandidates({
        companyId: company.id,
        searchText: searchQuery || undefined,
        limit: 50,
        offset: 0,
      });

      return result;
    },
    enabled: !!company?.id,
  });

  const loadUnlockedCandidateIds = async (companyId: string) => {
    try {
      const { data, error } = await supabase
        .from("company_candidates")
        .select("candidate_id")
        .eq("company_id", companyId)
        .not("unlocked_at", "is", null);

      if (error) throw error;
      setUnlockedCandidateIds(new Set((data || []).map((row) => row.candidate_id)));
    } catch (error) {
      console.error("Error loading unlocked candidate ids:", error);
    }
  };

  useEffect(() => {
    if (company?.id) {
      loadUnlockedCandidateIds(company.id);
    }
  }, [company?.id]);

  const handleUnlock = async (candidateId: string) => {
    if (!company?.id) return;

    try {
      await unlockCandidate({
        companyId: company.id,
        candidateId,
      });

      toast({
        title: "Profil freigeschaltet",
        description: "Sie können nun die Kontaktdaten einsehen.",
      });

      await Promise.all([refetch(), loadUnlockedCandidateIds(company.id)]);
      navigate(`/company/profile/${candidateId}`, {
        state: {
          from: { pathname: location.pathname, search: location.search },
          label: "Kandidatensuche",
        },
      });
    } catch (error: any) {
      toast({
        title: "Fehler",
        description: error.message || "Profil konnte nicht freigeschaltet werden.",
        variant: "destructive",
      });
    }
  };

  const handleViewProfile = async (profile: any) => {
    setPreviewOpen(true);
    setLoadingProfile(true);

    const initialUnlocked = profile.is_unlocked || false;
    const initialPreview = sanitizePreviewProfile({ ...profile }, initialUnlocked);
    setSelectedProfile(initialPreview);

    try {
      const { data: fullProfile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", profile.id)
        .single();

      if (error) throw error;

      const parsedProfile = {
        ...fullProfile,
        berufserfahrung: parseJsonField(fullProfile.berufserfahrung) || [],
        schulbildung: parseJsonField(fullProfile.schulbildung) || [],
        faehigkeiten: parseJsonField(fullProfile.faehigkeiten) || [],
        sprachkenntnisse: parseJsonField(fullProfile.sprachkenntnisse) || [],
        sprachen: parseJsonField(fullProfile.sprachen) || [],
        languages: parseJsonField(fullProfile.languages) || [],
      };

      let isUnlocked = profile.is_unlocked || false;
      if (!isUnlocked && company?.id) {
        const { data: unlockData } = await supabase
          .from("company_candidates")
          .select("unlocked_at")
          .eq("company_id", company.id)
          .eq("candidate_id", parsedProfile.user_id || parsedProfile.id)
          .not("unlocked_at", "is", null)
          .maybeSingle();

        isUnlocked = !!unlockData;
      }

      const sanitizedProfile = sanitizePreviewProfile(parsedProfile, isUnlocked);
      setSelectedProfile(sanitizedProfile);
    } catch (error: any) {
      console.error("Error loading profile:", error);
      toast({
        title: "Fehler",
        description: "Profil konnte nicht geladen werden.",
        variant: "destructive",
      });
    } finally {
      setLoadingProfile(false);
    }
  };

  const visibleCandidates = (candidates || []).filter((candidate: any) => {
    if (dismissedCandidateIds.has(candidate.id)) {
      return false;
    }
    const candidateKey = candidate.user_id || candidate.id;
    if (candidateKey && unlockedCandidateIds.has(candidateKey)) {
      return false;
    }
    return true;
  });

  const handleMarkNotFit = async (candidateId: string) => {
    setDismissedCandidateIds((prev) => {
      const next = new Set(prev);
      next.add(candidateId);
      return next;
    });
    setPreviewOpen(false);
    toast({
      title: "Kandidat ausgeblendet",
      description: "Dieser Kandidat wird nicht mehr angezeigt.",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1600px] mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Kandidatensuche</h1>
          <p className="text-muted-foreground">Finden Sie passende Kandidaten für Ihre offenen Stellen</p>
        </div>

        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Nach Kandidaten suchen (Skills, Standort, Fachrichtung...)"
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button variant="outline">
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : visibleCandidates.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Keine Kandidaten gefunden. Versuchen Sie eine andere Suche.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5">
            {visibleCandidates.map((candidate: any) => (
              <UnifiedCandidateCard
                key={candidate.id}
                candidate={{
                  id: candidate.id,
                  full_name: candidate.full_name,
                  email: candidate.email,
                  phone: candidate.phone,
                  city: candidate.city,
                  country: candidate.country,
                  skills: candidate.skills || [],
                  profile_image: candidate.profile_image,
                  experience_years: candidate.experience_years,
                  bio_short: candidate.bio_short,
                }}
                onViewDetails={() => handleViewProfile(candidate)}
                onUnlock={() => handleUnlock(candidate.id)}
                isUnlocked={candidate.is_unlocked}
              />
            ))}
          </div>
        )}
      </div>

      <CandidateProfilePreviewModal
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        profile={selectedProfile}
        isUnlocked={selectedProfile?.is_unlocked}
        isLoading={loadingProfile}
        onUnlockSuccess={() => {
          refetch();
          if (selectedProfile?.id) {
            const profileId = selectedProfile.id;
            setPreviewOpen(false);
            navigate(`/company/profile/${profileId}`, {
              state: {
                from: { pathname: location.pathname, search: location.search },
                label: "Kandidatensuche",
              },
            });
          }
        }}
        onMarkNotFit={
          selectedProfile?.id
            ? () => handleMarkNotFit(selectedProfile.id)
            : undefined
        }
      />
    </div>
  );
}
