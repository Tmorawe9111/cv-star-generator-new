import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useJobForm } from "@/contexts/JobFormContext";
import { Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/hooks/useCompany";
import { BRANCHES } from "@/lib/branches";

export function JobFormStep1({ isEditMode = false }: { isEditMode?: boolean }) {
  const { formData, setFormData, nextStep } = useJobForm();
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const { company } = useCompany();
  const [locations, setLocations] = useState<
    { id: string; name: string; city: string | null; postal_code: string | null }[]
  >([]);
  
  const form = useForm({
    defaultValues: {
      title: formData.title,
      industry: formData.industry,
      city: formData.city,
      employment_type: formData.employment_type,
      start_date: formData.start_date,
    },
  });

  // Lade verfügbare Standorte der Firma für das Dropdown
  useEffect(() => {
    if (!company?.id) return;

    (async () => {
      const { data, error } = await supabase
        .from("company_locations")
        .select("id, name, city, postal_code")
        .eq("company_id", company.id)
        .eq("is_active", true)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error loading company locations for job form", error);
        return;
      }

      setLocations((data || []) as any);
    })();
  }, [company?.id]);

  const handleAISuggest = async () => {
    const title = form.watch('title');
    const industry = form.watch('industry');
    
    if (!title || !industry) {
      toast.error('Bitte gib zuerst Jobtitel und Branche ein');
      return;
    }

    setIsLoadingAI(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-suggest-job-title', {
        body: { title, industry },
      });

      if (error) throw error;

      if (data?.suggestions) {
        toast.success('AI-Vorschläge erhalten!');
      }
    } catch (error: any) {
      console.error('AI suggest error:', error);
      toast.error(error.message || 'Fehler beim Laden der Vorschläge');
    } finally {
      setIsLoadingAI(false);
    }
  };

  const onSubmit = (data: any) => {
    setFormData(data);
    nextStep();
  };

  // Get tomorrow's date for minimum start_date
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Basisinformationen</h2>
          <p className="text-muted-foreground">
            {isEditMode 
              ? "Diese Felder können nicht bearbeitet werden" 
              : "Grundlegende Details zur Stelle"}
          </p>
        </div>
        {!isEditMode && (
          <Button
            type="button"
            variant="outline"
            onClick={handleAISuggest}
            disabled={isLoadingAI}
            size="sm"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            {isLoadingAI ? 'Lädt...' : 'AI-Hilfe'}
          </Button>
        )}
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="title"
            rules={{ required: "Jobtitel ist erforderlich" }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Jobtitel</FormLabel>
                <FormControl>
                  <Input
                    placeholder="z.B. Ausbildung zum Elektroniker (m/w/d)"
                    disabled={isEditMode}
                    {...field}
                    className="text-base h-12"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="industry"
            rules={{ required: "Branche ist erforderlich" }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Branche</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  value={field.value}
                  disabled={isEditMode}
                >
                  <FormControl>
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Branche auswählen..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {BRANCHES.map((branch) => (
                      <SelectItem key={branch.key} value={branch.key}>
                        {branch.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="city"
            rules={{ required: "Standort ist erforderlich" }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Standort</FormLabel>
                {locations.length > 0 ? (
                  <FormControl>
                    <Select
                      disabled={isEditMode}
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Standort auswählen..." />
                      </SelectTrigger>
                      <SelectContent>
                        {locations.map((loc) => {
                          const labelParts = [];
                          if (loc.name) labelParts.push(loc.name);
                          const cityLine = [loc.postal_code, loc.city]
                            .filter(Boolean)
                            .join(" ");
                          if (cityLine) labelParts.push(cityLine);
                          const label = labelParts.join(" • ");

                          return (
                            <SelectItem key={loc.id} value={loc.name || cityLine || loc.id}>
                              {label || "Unbenannter Standort"}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </FormControl>
                ) : (
                  <FormControl>
                    <Input
                      placeholder="z.B. Berlin"
                      disabled={isEditMode}
                      {...field}
                      className="text-base h-12"
                    />
                  </FormControl>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="employment_type"
            rules={{ required: "Anstellungsart ist erforderlich" }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Anstellungsart</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  value={field.value}
                  disabled={isEditMode}
                >
                  <FormControl>
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Anstellungsart wählen..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="apprenticeship">Ausbildung</SelectItem>
                    <SelectItem value="fulltime">Vollzeit</SelectItem>
                    <SelectItem value="parttime">Teilzeit</SelectItem>
                    <SelectItem value="internship">Praktikum</SelectItem>
                    <SelectItem value="temporary">Zeitarbeit</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="start_date"
            rules={{ required: "Startdatum ist erforderlich" }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Gewünschtes Startdatum</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    min={minDate}
                    disabled={isEditMode}
                    {...field}
                    className="text-base h-12"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end pt-4">
            <Button type="submit" size="lg">
              {isEditMode ? 'Weiter (Nur-Ansicht)' : 'Weiter'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
