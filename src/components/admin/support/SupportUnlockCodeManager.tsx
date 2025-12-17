import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Copy, Plus, Trash2, CheckCircle2, XCircle } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface UnlockCode {
  id: string;
  code: string;
  created_by: string;
  expires_at: string | null;
  max_uses: number;
  current_uses: number;
  is_active: boolean;
  notes: string | null;
  created_at: string;
}

export function SupportUnlockCodeManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [deleteCodeId, setDeleteCodeId] = useState<string | null>(null);
  
  const [newCode, setNewCode] = useState({
    code: "",
    company_id: null as string | null,
    expires_at: "",
    max_uses: "1",
    notes: "",
  });

  // Fetch all unlock codes
  const { data: codes, isLoading } = useQuery({
    queryKey: ["admin-company-access-codes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_company_access_codes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as UnlockCode[];
    },
  });

  // Create code mutation
  const createMutation = useMutation({
    mutationFn: async (codeData: {
      code: string;
      expires_at?: string | null;
      max_uses: number;
      notes?: string | null;
    }) => {
      const { data, error } = await supabase
        .from("admin_company_access_codes")
        .insert({
          code: codeData.code.toUpperCase().trim(),
          expires_at: codeData.expires_at || null,
          max_uses: codeData.max_uses,
          notes: codeData.notes || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-company-access-codes"] });
      toast({
        title: "Code erstellt",
        description: "Der Zugriffs-Code wurde erfolgreich erstellt. Sie können ihn jetzt im Unternehmensprofil eingeben.",
      });
      setShowCreateDialog(false);
      setNewCode({
        code: "",
        company_id: null,
        expires_at: "",
        max_uses: "1",
        notes: "",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Fehler",
        description: error.message || "Fehler beim Erstellen des Codes",
        variant: "destructive",
      });
    },
  });

  // Delete code mutation
  const deleteMutation = useMutation({
    mutationFn: async (codeId: string) => {
      const { error } = await supabase
        .from("admin_company_access_codes")
        .delete()
        .eq("id", codeId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-company-access-codes"] });
      toast({
        title: "Code gelöscht",
        description: "Der Code wurde erfolgreich gelöscht.",
      });
      setDeleteCodeId(null);
    },
    onError: (error: any) => {
      toast({
        title: "Fehler",
        description: error.message || "Fehler beim Löschen des Codes",
        variant: "destructive",
      });
    },
  });

  const handleCreate = () => {
    if (!newCode.code.trim()) {
      toast({
        title: "Fehler",
        description: "Bitte geben Sie einen Code ein",
        variant: "destructive",
      });
      return;
    }

    createMutation.mutate({
      code: newCode.code,
      company_id: newCode.company_id || null,
      expires_at: newCode.expires_at || null,
      max_uses: parseInt(newCode.max_uses) || 1,
      notes: newCode.notes || null,
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Kopiert",
      description: "Code wurde in die Zwischenablage kopiert",
    });
  };

  if (isLoading) {
    return <div className="text-center py-12">Laden...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Admin-Zugriffs-Codes</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Erstellen Sie Codes, die Sie in Unternehmensprofilen eingeben können, um erweiterte Funktionen zu nutzen (Zahlungen ändern, Tokens erhöhen, etc.)
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Neuer Code
        </Button>
      </div>

      {/* Codes List */}
      <div className="space-y-4">
        {codes && codes.length > 0 ? (
          codes.map((code) => (
            <Card key={code.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <code className="text-lg font-mono font-semibold bg-gray-100 px-3 py-1 rounded">
                        {code.code}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(code.code)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      {code.is_active ? (
                        <Badge variant="default" className="bg-green-500">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Aktiv
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <XCircle className="h-3 w-3 mr-1" />
                          Inaktiv
                        </Badge>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Verwendungen:</span>
                        <p className="font-medium">
                          {code.current_uses} / {code.max_uses}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Erstellt:</span>
                        <p className="font-medium">
                          {format(new Date(code.created_at), "dd.MM.yyyy HH:mm", { locale: de })}
                        </p>
                      </div>
                      {code.expires_at && (
                        <div>
                          <span className="text-muted-foreground">Läuft ab:</span>
                          <p className="font-medium">
                            {format(new Date(code.expires_at), "dd.MM.yyyy HH:mm", { locale: de })}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    {code.notes && (
                      <div className="mt-3 text-sm">
                        <span className="text-muted-foreground">Notizen:</span>
                        <p className="mt-1">{code.notes}</p>
                      </div>
                    )}
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteCodeId(code.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">
                Noch keine Codes erstellt
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Neuen Zugriffs-Code erstellen</DialogTitle>
            <DialogDescription>
              Erstellen Sie einen Code, den Sie in Unternehmensprofilen eingeben können, um erweiterte Funktionen zu nutzen
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="code">Code *</Label>
              <Input
                id="code"
                value={newCode.code}
                onChange={(e) => setNewCode({ ...newCode, code: e.target.value.toUpperCase() })}
                placeholder="z.B. SUPPORT2024"
                className="font-mono"
              />
            </div>
            
            <div>
              <Label htmlFor="max_uses">Max. Verwendungen</Label>
              <Input
                id="max_uses"
                type="number"
                value={newCode.max_uses}
                onChange={(e) => setNewCode({ ...newCode, max_uses: e.target.value })}
                min="1"
              />
            </div>
            
            <div>
              <Label htmlFor="expires_at">Ablaufdatum (optional)</Label>
              <Input
                id="expires_at"
                type="datetime-local"
                value={newCode.expires_at}
                onChange={(e) => setNewCode({ ...newCode, expires_at: e.target.value })}
              />
            </div>
            
            <div>
              <Label htmlFor="notes">Notizen (optional)</Label>
              <Input
                id="notes"
                value={newCode.notes}
                onChange={(e) => setNewCode({ ...newCode, notes: e.target.value })}
                placeholder="Interne Notizen zum Code"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              Code erstellen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteCodeId} onOpenChange={() => setDeleteCodeId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Code löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Möchten Sie diesen Code wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteCodeId && deleteMutation.mutate(deleteCodeId)}
              className="bg-red-600 hover:bg-red-700"
            >
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

