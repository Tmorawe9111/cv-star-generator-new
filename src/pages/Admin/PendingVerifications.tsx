import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { CheckCircle, XCircle, Clock, Building2, Filter } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";
import { formatSupportCode } from "@/lib/support-code";

type PendingCompany = {
  id: string;
  name: string;
  primary_email: string;
  created_at: string;
  industry: string | null;
  location: string | null;
  website_url: string | null;
  contact_person: string | null;
  employee_count: number | null;
  support_code: string | null;
  support_code_verified_at: string | null;
};

const REJECTION_REASONS = [
  { value: "incomplete_info", label: "Unvollständige Informationen" },
  { value: "suspicious_activity", label: "Verdächtige Aktivität" },
  { value: "duplicate_account", label: "Doppeltes Konto" },
  { value: "invalid_business", label: "Ungültiges Unternehmen" },
  { value: "terms_violation", label: "Verstoß gegen AGB" },
  { value: "other", label: "Sonstiges" },
];

export default function PendingVerifications() {
  const queryClient = useQueryClient();
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<PendingCompany | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const { data: pendingCompanies = [], isLoading } = useQuery({
    queryKey: ["pending-verifications"],
    queryFn: async (): Promise<PendingCompany[]> => {
      console.log("Fetching pending companies...");
      const { data, error } = await supabase
        .from("companies")
        .select("id, name, primary_email, created_at, industry, location, website_url, contact_person, employee_count, support_code, support_code_verified_at")
        .eq("account_status", "pending")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching pending companies:", error);
        throw error;
      }
      console.log("Fetched pending companies:", data);
      return data || [];
    },
  });

  const verifyMutation = useMutation({
    mutationFn: async (companyId: string) => {
      console.log("Verifying company:", companyId);
      
      // First check if user has admin role
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("Nicht authentifiziert");
      }

      // Use RPC function to verify support code (which also sets account_status to active)
      const { data: verifyResult, error: verifyError } = await supabase
        .rpc('verify_support_code', {
          p_company_id: companyId,
          p_admin_user_id: user.id
        });

      if (verifyError) {
        console.error("Error verifying company:", verifyError);
        throw new Error(`Fehler: ${verifyError.message}`);
      }

      // If RPC returns false, company might not have a support code
      if (verifyResult === false) {
        // Fallback: update directly if RPC fails
        const { data, error } = await supabase
          .from("companies")
          .update({ 
            account_status: "active",
            support_code_verified_at: new Date().toISOString(),
            support_code_verified_by: user.id
          })
          .eq("id", companyId)
          .select();

        if (error) {
          console.error("Error verifying company:", error);
          throw new Error(`Fehler: ${error.message}`);
        }
        
        if (!data || data.length === 0) {
          throw new Error("Unternehmen konnte nicht aktualisiert werden");
        }
        
        console.log("Company verified successfully:", data);
        return data;
      }

      // Fetch updated company data
      const { data: updatedCompany, error: fetchError } = await supabase
        .from("companies")
        .select("*")
        .eq("id", companyId)
        .single();

      if (fetchError) {
        throw new Error(`Fehler beim Abrufen: ${fetchError.message}`);
      }

      return [updatedCompany];
    },
    onSuccess: (data) => {
      console.log("Verification successful, invalidating queries");
      queryClient.invalidateQueries({ queryKey: ["pending-verifications"] });
      queryClient.invalidateQueries({ queryKey: ["admin-companies"] });
      toast.success(`${data[0]?.name || 'Unternehmen'} wurde erfolgreich verifiziert`);
    },
    onError: (error: Error) => {
      console.error("Verification error:", error);
      toast.error(error.message || "Fehler beim Verifizieren");
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ companyId, reason }: { companyId: string; reason: string }) => {
      console.log("Rejecting company:", companyId, "Reason:", reason);
      
      // First check if user has admin role
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("Nicht authentifiziert");
      }

      const { data, error } = await supabase
        .from("companies")
        .update({ 
          account_status: "frozen",
          frozen_at: new Date().toISOString(),
          frozen_reason: reason
        })
        .eq("id", companyId)
        .select();

      if (error) {
        console.error("Error rejecting company:", error);
        throw new Error(`Fehler: ${error.message}`);
      }
      
      if (!data || data.length === 0) {
        throw new Error("Unternehmen konnte nicht aktualisiert werden");
      }
      
      console.log("Company rejected successfully:", data);
      return data;
    },
    onSuccess: (data) => {
      console.log("Rejection successful, invalidating queries");
      queryClient.invalidateQueries({ queryKey: ["pending-verifications"] });
      queryClient.invalidateQueries({ queryKey: ["admin-companies"] });
      setRejectDialogOpen(false);
      setSelectedCompany(null);
      setRejectionReason("");
      setCustomReason("");
      toast.success(`${data[0]?.name || 'Unternehmen'} wurde abgelehnt und eingefroren`);
    },
    onError: (error: Error) => {
      console.error("Rejection error:", error);
      toast.error(error.message || "Fehler beim Ablehnen");
    },
  });

  const handleReject = () => {
    if (!selectedCompany) return;
    
    let finalReason = "";
    if (rejectionReason === "other") {
      finalReason = customReason || "Sonstiger Grund (nicht angegeben)";
    } else {
      const reasonObj = REJECTION_REASONS.find(r => r.value === rejectionReason);
      finalReason = reasonObj?.label || "Nicht angegeben";
    }

    rejectMutation.mutate({ 
      companyId: selectedCompany.id, 
      reason: finalReason 
    });
  };

  const filteredCompanies = pendingCompanies.filter(company => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      company.name.toLowerCase().includes(search) ||
      company.primary_email?.toLowerCase().includes(search) ||
      company.industry?.toLowerCase().includes(search) ||
      company.location?.toLowerCase().includes(search)
    );
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Ausstehende Verifizierungen</h2>
        <p className="text-muted-foreground">
          Neue Unternehmensanmeldungen, die auf Freischaltung warten
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Wartende Unternehmen
              </CardTitle>
              <CardDescription>
                {filteredCompanies.length} {filteredCompanies.length === 1 ? "Unternehmen wartet" : "Unternehmen warten"} auf Verifizierung
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Suchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredCompanies.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {searchTerm ? "Keine Unternehmen gefunden" : "Keine ausstehenden Verifizierungen"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Unternehmen</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Support-Code</TableHead>
                  <TableHead>Branche</TableHead>
                  <TableHead>Standort</TableHead>
                  <TableHead>Angemeldet</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCompanies.map((company) => (
                  <TableRow key={company.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{company.name}</div>
                        {company.contact_person && (
                          <div className="text-sm text-muted-foreground">
                            Kontakt: {company.contact_person}
                          </div>
                        )}
                        {company.website_url && (
                          <a 
                            href={company.website_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline"
                          >
                            {company.website_url}
                          </a>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {company.primary_email}
                    </TableCell>
                    <TableCell>
                      {company.support_code ? (
                        <div className="flex flex-col gap-1">
                          <code className="text-xs font-mono bg-muted px-2 py-1 rounded">
                            {formatSupportCode(company.support_code)}
                          </code>
                          {company.support_code_verified_at && (
                            <span className="text-xs text-green-600">
                              ✓ Verifiziert
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {company.industry ? (
                        <Badge variant="outline">{company.industry}</Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {company.location || (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(company.created_at), {
                        addSuffix: true,
                        locale: de,
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => verifyMutation.mutate(company.id)}
                          disabled={verifyMutation.isPending}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Verifizieren
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            setSelectedCompany(company);
                            setRejectDialogOpen(true);
                          }}
                          disabled={rejectMutation.isPending}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Ablehnen
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unternehmen ablehnen</DialogTitle>
            <DialogDescription>
              Bitte wählen Sie einen Grund für die Ablehnung von "{selectedCompany?.name}".
              Das Konto wird eingefroren und kann später reaktiviert werden.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Ablehnungsgrund</Label>
              <Select value={rejectionReason} onValueChange={setRejectionReason}>
                <SelectTrigger id="reason">
                  <SelectValue placeholder="Grund auswählen..." />
                </SelectTrigger>
                <SelectContent>
                  {REJECTION_REASONS.map((reason) => (
                    <SelectItem key={reason.value} value={reason.value}>
                      {reason.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {rejectionReason === "other" && (
              <div className="space-y-2">
                <Label htmlFor="custom-reason">Bitte Grund angeben</Label>
                <Textarea
                  id="custom-reason"
                  placeholder="Geben Sie den Grund für die Ablehnung ein..."
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  rows={3}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRejectDialogOpen(false);
                setSelectedCompany(null);
                setRejectionReason("");
                setCustomReason("");
              }}
            >
              Abbrechen
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={!rejectionReason || (rejectionReason === "other" && !customReason.trim())}
            >
              Ablehnen & Einfrieren
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
