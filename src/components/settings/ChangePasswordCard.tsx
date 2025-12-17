import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Lock } from "lucide-react";

function isStrongPassword(password: string) {
  return password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password);
}

type ChangePasswordCardProps = {
  title?: string;
  description?: string;
};

export function ChangePasswordCard({
  title = "Passwort ändern",
  description = "Ändern oder setzen Sie Ihr Passwort (z.B. wenn Sie bisher per Magic-Link eingeloggt waren).",
}: ChangePasswordCardProps) {
  const { toast } = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const validationError = useMemo(() => {
    if (!newPassword && !confirmPassword) return null;
    if (newPassword && !isStrongPassword(newPassword)) {
      return "Passwort muss mindestens 8 Zeichen, einen Großbuchstaben und eine Zahl enthalten.";
    }
    if (confirmPassword && newPassword !== confirmPassword) {
      return "Passwörter stimmen nicht überein.";
    }
    return null;
  }, [newPassword, confirmPassword]);

  const handleSubmit = async () => {
    if (!newPassword || !confirmPassword) {
      toast({
        title: "Fehlende Angaben",
        description: "Bitte neues Passwort und Bestätigung ausfüllen.",
        variant: "destructive",
      });
      return;
    }
    if (!isStrongPassword(newPassword)) {
      toast({
        title: "Passwort zu schwach",
        description: "Mindestens 8 Zeichen, 1 Großbuchstabe, 1 Zahl.",
        variant: "destructive",
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwörter stimmen nicht überein",
        description: "Bitte überprüfen Sie die Eingaben.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      // Optional: re-authenticate if current password was provided
      if (currentPassword.trim()) {
        const { data: userData } = await supabase.auth.getUser();
        const email = userData.user?.email;
        if (email) {
          const { error: reauthError } = await supabase.auth.signInWithPassword({
            email,
            password: currentPassword,
          });
          if (reauthError) {
            throw new Error("Aktuelles Passwort ist falsch.");
          }
        }
      }

      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        throw new Error(error.message || "Passwort konnte nicht aktualisiert werden.");
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast({
        title: "Passwort aktualisiert",
        description: "Ihr Passwort wurde erfolgreich geändert.",
      });
    } catch (e: any) {
      toast({
        title: "Fehler",
        description: e?.message || "Passwort konnte nicht aktualisiert werden.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Lock className="h-5 w-5" />
          <CardTitle>{title}</CardTitle>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="current-password">Aktuelles Passwort (optional)</Label>
          <div className="relative">
            <Input
              id="current-password"
              type={showCurrent ? "text" : "password"}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Aktuelles Passwort"
              autoComplete="current-password"
              disabled={submitting}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
              onClick={() => setShowCurrent((s) => !s)}
              disabled={submitting}
              aria-label="Aktuelles Passwort anzeigen/verbergen"
            >
              {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Wenn Sie bisher per Magic‑Link eingeloggt waren, können Sie das Feld leer lassen und ein neues Passwort setzen.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="new-password">Neues Passwort</Label>
            <div className="relative">
              <Input
                id="new-password"
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="mind. 8 Zeichen"
                autoComplete="new-password"
                disabled={submitting}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                onClick={() => setShowNew((s) => !s)}
                disabled={submitting}
                aria-label="Neues Passwort anzeigen/verbergen"
              >
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Passwort bestätigen</Label>
            <div className="relative">
              <Input
                id="confirm-password"
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Passwort wiederholen"
                autoComplete="new-password"
                disabled={submitting}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                onClick={() => setShowConfirm((s) => !s)}
                disabled={submitting}
                aria-label="Passwort bestätigen anzeigen/verbergen"
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>

        {validationError ? (
          <p className="text-sm text-destructive">{validationError}</p>
        ) : (
          <p className="text-xs text-muted-foreground">
            Regeln: mindestens 8 Zeichen, 1 Großbuchstabe, 1 Zahl.
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <Button onClick={handleSubmit} disabled={submitting} className="sm:w-auto">
            {submitting ? "Speichern..." : "Passwort speichern"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}


