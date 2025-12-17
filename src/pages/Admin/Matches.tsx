import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Target } from "lucide-react";

export default function MatchesPage() {
  const { data: matches, isLoading } = useQuery({
    queryKey: ["admin-matches"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("candidate_match_cache")
        .select(`
          *,
          candidate:candidates(id, full_name, email),
          job:job_id(title, company:companies!job_posts_company_id_fkey(name))
        `)
        .order("score", { ascending: false })
        .limit(50);

      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="px-3 sm:px-6 py-6 max-w-[1400px] mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Matching</h1>
        <p className="text-muted-foreground">
          Übersicht über alle Kandidaten-Matches
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Top Matches
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kandidat</TableHead>
                <TableHead>Stelle</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Typ</TableHead>
                <TableHead>Erstellt</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    Lädt...
                  </TableCell>
                </TableRow>
              ) : matches && matches.length > 0 ? (
                matches.map((match) => (
                  <TableRow key={match.id}>
                    <TableCell>
                      {(match.candidate as any)?.full_name || "Unbekannt"}
                    </TableCell>
                    <TableCell>
                      {(match.job as any)?.title || "Unbekannt"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          Number(match.score) > 80
                            ? "default"
                            : Number(match.score) > 60
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {Number(match.score).toFixed(0)}%
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={match.is_explore ? "outline" : "default"}>
                        {match.is_explore ? "Explore" : "Standard"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(match.created_at).toLocaleDateString("de-DE")}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Keine Matches gefunden
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
