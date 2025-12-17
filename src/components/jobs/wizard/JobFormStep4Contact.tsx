import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useJobForm } from "@/contexts/JobFormContext";
import { useCompany } from "@/hooks/useCompany";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function JobFormStep4Contact() {
  const { formData, setFormData, nextStep, prevStep } = useJobForm();
  const { company } = useCompany();
  const companyId = company?.id ?? null;
  const [selectedContactUserId, setSelectedContactUserId] = useState<string>("");
  
  const form = useForm({
    defaultValues: {
      contact_person_name: formData.contact_person_name,
      contact_person_email: formData.contact_person_email,
      contact_person_phone: formData.contact_person_phone,
      contact_person_role: formData.contact_person_role,
      contact_person_photo_url: (formData as any).contact_person_photo_url || "",
    },
  });

  const roleLabel = (role: string | null | undefined) => {
    const r = String(role || "").toLowerCase();
    if (r === "owner") return "Superadmin";
    if (r === "admin") return "Admin";
    if (r === "recruiter") return "Recruiter";
    if (r === "marketing") return "Marketing";
    if (r === "viewer") return "Betrachter";
    return role || "";
  };

  const { data: contacts, isLoading: contactsLoading } = useQuery({
    queryKey: ["company-team-contacts", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      if (!companyId) return [] as Array<any>;
      const { data: cu, error: cuErr } = await supabase
        .from("company_users")
        .select("user_id, role, accepted_at")
        .eq("company_id", companyId)
        .not("accepted_at", "is", null);
      if (cuErr) throw cuErr;
      const rows = (cu as any[]) || [];
      const userIds = Array.from(new Set(rows.map((r) => r.user_id).filter(Boolean))) as string[];
      if (userIds.length === 0) return [];
      const { data: profiles, error: pErr } = await supabase
        .from("profiles")
        .select("id, vorname, nachname, email, telefon, avatar_url")
        .in("id", userIds);
      if (pErr) throw pErr;
      const pMap = new Map((profiles as any[]).map((p) => [p.id, p]));
      return rows
        .map((r) => {
          const p = pMap.get(r.user_id);
          const name = [p?.vorname, p?.nachname].filter(Boolean).join(" ").trim();
          return {
            user_id: r.user_id,
            role: r.role,
            name: name || p?.email || r.user_id,
            email: p?.email || "",
            phone: p?.telefon || "",
            avatar_url: p?.avatar_url || "",
          };
        })
        // Usually you don't want "Betrachter" as public contact, but keep Marketing possible
        .filter((x) => String(x.role || "").toLowerCase() !== "viewer");
    },
    staleTime: 30_000,
  });

  const applyContact = (userId: string) => {
    setSelectedContactUserId(userId);
    const c = (contacts || []).find((x) => x.user_id === userId);
    if (!c) return;

    const next = {
      contact_person_name: c.name || "",
      contact_person_email: c.email || "",
      contact_person_phone: c.phone || "",
      contact_person_role: roleLabel(c.role) || "",
      contact_person_photo_url: c.avatar_url || "",
    };

    form.setValue("contact_person_name", next.contact_person_name, { shouldDirty: true });
    form.setValue("contact_person_email", next.contact_person_email, { shouldDirty: true });
    form.setValue("contact_person_phone", next.contact_person_phone, { shouldDirty: true });
    form.setValue("contact_person_role", next.contact_person_role, { shouldDirty: true });
    form.setValue("contact_person_photo_url" as any, next.contact_person_photo_url, { shouldDirty: true });
    setFormData(next as any);
  };

  const onSubmit = (data: any) => {
    setFormData(data);
    nextStep();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Kontaktinformationen</h2>
        <p className="text-muted-foreground">
          Diese Informationen werden Bewerbern angezeigt
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Keep photo URL in form state even though it's not directly editable */}
          <input type="hidden" {...form.register("contact_person_photo_url")} />

          <FormItem>
            <FormLabel>Ansprechpartner aus Team auswählen (empfohlen)</FormLabel>
            <div className="grid gap-2">
              <Select
                value={selectedContactUserId}
                onValueChange={(v) => {
                  if (!v) return;
                  applyContact(v);
                }}
                disabled={contactsLoading || !contacts || contacts.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder={contactsLoading ? "Lade Team…" : "Teammitglied auswählen"} />
                </SelectTrigger>
                <SelectContent>
                  {(contacts || []).map((c) => (
                    <SelectItem key={c.user_id} value={c.user_id}>
                      {c.name} {c.role ? `· ${roleLabel(c.role)}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Wählen Sie einen Ansprechpartner, um Name/E‑Mail/Telefon automatisch zu übernehmen. Sie können die Felder darunter jederzeit anpassen.
              </FormDescription>
            </div>
          </FormItem>

          <FormField
            control={form.control}
            name="contact_person_name"
            rules={{ required: "Name ist erforderlich" }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name der Kontaktperson *</FormLabel>
                <FormControl>
                  <Input placeholder="Max Mustermann" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="contact_person_email"
            rules={{ 
              required: "E-Mail ist erforderlich",
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: "Ungültige E-Mail-Adresse"
              }
            }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>E-Mail-Adresse *</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="max@unternehmen.de" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="contact_person_phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telefonnummer (optional)</FormLabel>
                <FormControl>
                  <Input type="tel" placeholder="+49 123 456789" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="contact_person_role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Position/Rolle (optional)</FormLabel>
                <FormControl>
                  <Input placeholder="Personalleiter" {...field} />
                </FormControl>
                <FormDescription>
                  z.B. Personalleiter, Geschäftsführer, HR Manager
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-between pt-4">
            <Button type="button" variant="outline" onClick={prevStep} size="lg">
              Zurück
            </Button>
            <Button type="submit" size="lg">
              Weiter
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
