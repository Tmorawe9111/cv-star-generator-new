import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Key, Loader2, Copy, ShieldCheck } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { useCompany } from "@/hooks/useCompany";
import { useQuery } from "@tanstack/react-query";

interface UnlockCodeInputProps {
  onSuccess?: () => void;
}

export function UnlockCodeInput({ onSuccess }: UnlockCodeInputProps) {
  const { toast } = useToast();
  const { company } = useCompany();
  const [showDialog, setShowDialog] = useState(false);
  const [code, setCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch support code
  const { data: supportCode, isLoading: isLoadingCode, error: supportCodeError } = useQuery({
    queryKey: ["company-support-code", company?.id],
    queryFn: async () => {
      if (!company?.id) {
        console.log("[UnlockCodeInput] No company ID");
        return null;
      }
      
      console.log("[UnlockCodeInput] Fetching support code for company:", company.id);
      
      const { data, error } = await supabase.rpc("get_company_support_code", {
        p_company_id: company.id,
      });

      console.log("[UnlockCodeInput] RPC response:", { data, error });

      if (error) {
        console.error("[UnlockCodeInput] Error fetching support code:", error);
        console.error("[UnlockCodeInput] Error details:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        });
        // Try to generate a code if fetching fails
        try {
          const { data: generatedData, error: generateError } = await supabase.rpc("generate_company_support_code", {
            p_company_id: company.id,
          });
          if (!generateError && generatedData) {
            console.log("[UnlockCodeInput] Generated new code:", generatedData);
            return generatedData;
          }
        } catch (genErr) {
          console.error("[UnlockCodeInput] Error generating code:", genErr);
        }
        return null;
      }
      
      console.log("[UnlockCodeInput] Support code received:", data);
      
      // If data is null or empty, try to generate one
      if (!data || data === '') {
        console.log("[UnlockCodeInput] Code is empty, generating new one...");
        try {
          const { data: generatedData, error: generateError } = await supabase.rpc("generate_company_support_code", {
            p_company_id: company.id,
          });
          if (!generateError && generatedData) {
            console.log("[UnlockCodeInput] Generated new code:", generatedData);
            return generatedData;
          }
        } catch (genErr) {
          console.error("[UnlockCodeInput] Error generating code:", genErr);
        }
      }
      
      return data;
    },
    enabled: !!company?.id,
    retry: 1,
  });

  const handleCopyCode = () => {
    if (supportCode) {
      navigator.clipboard.writeText(supportCode);
      toast({
        title: "Code kopiert",
        description: "Der Support-Code wurde in die Zwischenablage kopiert.",
      });
    }
  };

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
      const { data, error } = await supabase.rpc("redeem_unlock_code", {
        p_code: code.trim(),
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: "Code eingelöst",
          description: data.message || "Ihr Unternehmensprofil wurde freigeschaltet.",
        });
        setCode("");
        setShowDialog(false);
        onSuccess?.();
        
        // Refresh company data
        window.location.reload();
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

  return (
    <>
      <DropdownMenuItem
        onClick={() => setShowDialog(true)}
        className="flex cursor-pointer items-center justify-between px-4 py-3 text-sm"
      >
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4" />
          <span>Support-Code</span>
        </div>
        {isLoadingCode ? (
          <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
        ) : supportCode ? (
          <code className="text-xs font-mono bg-muted px-2 py-0.5 rounded">
            {supportCode}
          </code>
        ) : null}
      </DropdownMenuItem>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Support-Code</DialogTitle>
            <DialogDescription>
              Ihr persönlicher Support-Code. Teilen Sie diesen Code mit dem Support, um Hilfe zu erhalten.
            </DialogDescription>
          </DialogHeader>
          
          {/* Support Code Display */}
          <div className="py-4 space-y-4">
            <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <ShieldCheck className="h-4 w-4" />
                <span>Ihr Support-Code:</span>
              </div>
              {isLoadingCode ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Code wird geladen...</span>
                </div>
              ) : supportCode ? (
                <>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-xl font-mono bg-background px-4 py-3 rounded border text-center">
                      {supportCode}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyCode}
                      className="gap-2"
                    >
                      <Copy className="h-4 w-4" />
                      Kopieren
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Dieser Code ist eindeutig für Ihr Unternehmen. Teilen Sie ihn mit dem Support, wenn Sie Hilfe benötigen.
                  </p>
                </>
              ) : supportCodeError ? (
                <div className="space-y-2">
                  <p className="text-sm text-red-600">Fehler beim Laden des Codes.</p>
                  <p className="text-xs text-muted-foreground">
                    {supportCodeError instanceof Error ? supportCodeError.message : "Unbekannter Fehler"}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Force refetch
                      window.location.reload();
                    }}
                  >
                    Erneut versuchen
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Code konnte nicht geladen werden.</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Force refetch
                      window.location.reload();
                    }}
                  >
                    Erneut versuchen
                  </Button>
                </div>
              )}
            </div>

            {/* Unlock Code Input (for redeeming unlock codes) */}
            <div className="pt-4 border-t space-y-2">
              <label className="text-sm font-medium">Freigabe-Code einlösen</label>
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="z.B. SUPPORT2024"
                className="font-mono text-lg"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !isSubmitting) {
                    handleRedeem();
                  }
                }}
                disabled={isSubmitting}
              />
              <p className="text-xs text-muted-foreground">
                Geben Sie hier einen Freigabe-Code ein, den Sie vom Support erhalten haben.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)} disabled={isSubmitting}>
              Schließen
            </Button>
            {code && (
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
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

