import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

export default function CreateAdmin() {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const preEmail = params.get("email");
    const prePass = params.get("password");
    if (preEmail && prePass && !loading && !email && !password) {
      setEmail(preEmail);
      setPassword(prePass);
      setTimeout(() => {
        const form = document.querySelector("form");
        form?.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
      }, 0);
    }
  }, [loading, email, password]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({ title: "Fehlende Angaben", description: "Bitte E-Mail und Passwort eingeben." });
      return;
    }
    setLoading(true);
    try {
      // Versuche zuerst die Edge Function
      const { data, error } = await supabase.functions.invoke("admin-user-actions", {
        body: { action: "create_admin", email, password },
      });
      
      if (error) {
        // Fallback: Versuche User zu erstellen und Rolle direkt zuzuweisen
        console.warn("Edge Function failed, trying direct approach", error);
        
        // 1. Erstelle User
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });
        
        if (signUpError) throw signUpError;
        
        if (!signUpData.user) {
          throw new Error("User creation failed");
        }
        
        // 2. Weise Admin-Rolle zu (mit RPC oder direkt)
        const { error: roleError } = await supabase
          .from("user_roles")
          .insert({ user_id: signUpData.user.id, role: "admin" });
        
        if (roleError) {
          // Wenn das auch fehlschlägt, zeige Anleitung
          throw new Error("Rolle konnte nicht zugewiesen werden. Bitte manuell in Supabase zuweisen.");
        }
        
        toast({ 
          title: "Admin erstellt", 
          description: "Bitte bestätige deine E-Mail und logge dich dann ein." 
        });
        navigate("/auth", { replace: true });
        return;
      }
      
      // Auto-Login und Redirect ins Admin-Panel
      const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
      if (signInErr) {
        toast({ title: "Erstellt – Login nötig", description: "Bitte manuell einloggen: /auth" });
      } else {
        toast({ title: "SuperAdmin erstellt", description: `Eingeloggt als ${email}` });
        navigate("/admin", { replace: true });
      }
      setEmail("");
      setPassword("");
    } catch (err: any) {
      console.error("Create admin error", err);
      const message = err?.message || err?.error || "Unbekannter Fehler";
      toast({ 
        title: "Fehler beim Erstellen", 
        description: `${String(message)}. Siehe MANUAL_ADMIN_SETUP.sql für manuelle Anleitung.`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-8">
      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>SuperAdmin anlegen</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-Mail</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Passwort</Label>
              <Input id="password" type="text" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <div className="pt-2">
              <Button type="submit" disabled={loading}>
                {loading ? "Wird erstellt..." : "SuperAdmin erstellen"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
