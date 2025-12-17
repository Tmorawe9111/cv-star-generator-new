import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Key, Loader2, CheckCircle2, Copy, ShieldCheck } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { formatSupportCode } from "@/lib/support-code";

interface AdminCompanyAccessCodeInputProps {
  companyId: string;
}

export function AdminCompanyAccessCodeInput({ companyId }: AdminCompanyAccessCodeInputProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [code, setCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch company to get support_code
  const { data: company } = useQuery({
    queryKey: ["admin-company", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("support_code, support_code_verified_at")
        .eq("id", companyId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  // Check if admin already has access
  const { data: hasAccess, refetch: refetchAccess } = useQuery({
    queryKey: ["admin-company-access", companyId, user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      const { data, error } = await supabase.rpc("admin_has_company_access", {
        p_admin_id: user.id,
        p_company_id: companyId,
      });

      if (error) {
        console.error("Error checking access:", error);
        return false;
      }
      return data === true;
    },
    enabled: !!user?.id && !!companyId,
  });

  const handleRedeem = async () => {
    if (!code.trim()) {
      toast({
        title: "Fehler",
        description: "Bitte geben Sie einen Code ein",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.rpc("grant_admin_company_access", {
        p_code: code.trim(),
        p_company_id: companyId,
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: "Zugriff gewährt",
          description: data.message || "Sie haben jetzt erweiterte Funktionen für dieses Unternehmen.",
        });
        setCode("");
        setShowDialog(false);
        refetchAccess();
        queryClient.invalidateQueries({ queryKey: ["admin-company-access", companyId] });
      } else {
        toast({
          title: "Fehler",
          description: data?.message || "Ungültiger Code",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Error redeeming code:", error);
      toast({
        title: "Fehler",
        description: error.message || "Fehler beim Einlösen des Codes",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopySupportCode = () => {
    if (company?.support_code) {
      navigator.clipboard.writeText(company.support_code);
      toast({
        title: "Code kopiert",
        description: "Der Support-Code wurde in die Zwischenablage kopiert.",
      });
    }
  };

  return (
    <>
      {hasAccess ? (
        <Badge variant="default" className="bg-green-500">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Erweiterter Zugriff aktiv
        </Badge>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowDialog(true)}
          className="gap-2"
        >
          <Key className="h-4 w-4" />
          Freigabe-Code eingeben
        </Button>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Freigabe-Code eingeben</DialogTitle>
            <DialogDescription>
              Geben Sie den Zugriffs-Code ein, um erweiterte Funktionen für dieses Unternehmen zu nutzen (Zahlungen ändern, Tokens erhöhen, etc.)
            </DialogDescription>
          </DialogHeader>
          
          {/* Support-Code Anzeige */}
          {company?.support_code && (
            <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <ShieldCheck className="h-4 w-4" />
                <span>Support-Code für dieses Unternehmen:</span>
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-lg font-mono bg-background px-3 py-2 rounded border">
                  {formatSupportCode(company.support_code)}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopySupportCode}
                  className="gap-2"
                >
                  <Copy className="h-4 w-4" />
                  Kopieren
                </Button>
              </div>
              {company.support_code_verified_at && (
                <Badge variant="outline" className="text-xs text-green-600 border-green-600 w-fit">
                  ✓ Verifiziert
                </Badge>
              )}
            </div>
          )}

          <div className="py-4 space-y-2">
            <label className="text-sm font-medium">Zugriffs-Code eingeben</label>
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="z.B. ADMIN2024"
              className="font-mono text-lg"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !isSubmitting) {
                  handleRedeem();
                }
              }}
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground">
              Geben Sie den Admin-Zugriffs-Code ein, den Sie im Support-Panel erstellt haben.
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)} disabled={isSubmitting}>
              Abbrechen
            </Button>
            <Button onClick={handleRedeem} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Einlösen...
                </>
              ) : (
                "Code einlösen"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

