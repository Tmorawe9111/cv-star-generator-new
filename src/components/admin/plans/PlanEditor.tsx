import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, Eye, Plus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PlanTemplate } from "@/lib/plan-templates";

interface PlanEditorProps {
  planId: string | null;
  isCreating: boolean;
  onSave: () => void;
  onCancel: () => void;
  templateData?: PlanTemplate["template"];
}

export function PlanEditor({ planId, isCreating, onSave, onCancel, templateData }: PlanEditorProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    id: "",
    name: "",
    price_monthly_cents: 0,
    price_yearly_cents: 0,
    included_tokens: 0,
    included_jobs: 0,
    included_seats: 1,
    included_locations: 1,
    max_locations: null as number | null,
    token_price_cents: 1800,
    max_additional_tokens_per_month: null as number | null,
    ai_level: "none",
    active: true,
    sort_order: 0,
    highlight: false,
    description: "",
    stripe_price_id_monthly: "",
    stripe_price_id_yearly: "",
    max_active_jobs: null as number | null,
    features: [] as string[],
  });

  // Load existing plan if editing
  const { data: existingPlan, isLoading } = useQuery({
    queryKey: ["plan", planId],
    queryFn: async () => {
      if (!planId || isCreating) return null;
      const { data, error } = await supabase
        .from("subscription_plans")
        .select("*")
        .eq("id", planId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!planId && !isCreating,
  });

  // Load template data if provided
  useEffect(() => {
    if (templateData && isCreating) {
      setFormData({
        id: "",
        name: templateData.name,
        price_monthly_cents: templateData.price_monthly_cents,
        price_yearly_cents: templateData.price_yearly_cents,
        included_tokens: templateData.included_tokens,
        included_jobs: templateData.included_jobs,
        included_seats: templateData.included_seats,
        included_locations: templateData.included_locations,
        max_locations: templateData.max_locations,
        token_price_cents: templateData.token_price_cents,
        max_additional_tokens_per_month: templateData.max_additional_tokens_per_month,
        ai_level: templateData.ai_level,
        active: true,
        sort_order: 0,
        highlight: templateData.highlight,
        description: templateData.description,
        stripe_price_id_monthly: "",
        stripe_price_id_yearly: "",
        max_active_jobs: templateData.max_active_jobs,
        features: templateData.features,
      });
    }
  }, [templateData, isCreating]);

  useEffect(() => {
    if (existingPlan) {
      // Parse features - can be array, object, or null
      let features: string[] = [];
      if (existingPlan.features) {
        if (Array.isArray(existingPlan.features)) {
          features = existingPlan.features;
        } else if (typeof existingPlan.features === 'object') {
          // If it's an object, convert to array of values or keys
          features = Object.values(existingPlan.features).filter(v => typeof v === 'string') as string[];
        }
      }

      setFormData({
        id: existingPlan.id || "",
        name: existingPlan.name || "",
        price_monthly_cents: existingPlan.price_monthly_cents || 0,
        price_yearly_cents: existingPlan.price_yearly_cents || 0,
        included_tokens: existingPlan.included_tokens || 0,
        included_jobs: existingPlan.included_jobs || 0,
        included_seats: existingPlan.included_seats || 1,
        included_locations: existingPlan.included_locations || 1,
        max_locations: existingPlan.max_locations,
        token_price_cents: existingPlan.token_price_cents || 1800,
        max_additional_tokens_per_month: existingPlan.max_additional_tokens_per_month,
        ai_level: existingPlan.ai_level || "none",
        active: existingPlan.active !== false,
        sort_order: existingPlan.sort_order || 0,
        highlight: existingPlan.highlight || false,
        description: existingPlan.description || "",
        stripe_price_id_monthly: existingPlan.stripe_price_id_monthly || "",
        stripe_price_id_yearly: existingPlan.stripe_price_id_yearly || "",
        max_active_jobs: existingPlan.max_active_jobs,
        features: features,
      });
    }
  }, [existingPlan, isCreating]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      // Validate required fields
      if (!formData.id || !formData.name) {
        throw new Error("Plan-ID und Name sind erforderlich");
      }

      // Validate prices
      if (formData.price_monthly_cents < 0 || formData.price_yearly_cents < 0) {
        throw new Error("Preise dürfen nicht negativ sein");
      }

      // Validate limits
      if (formData.included_tokens < 0 || formData.included_seats < 1 || formData.included_locations < 1) {
        throw new Error("Limits müssen gültig sein (Tokens >= 0, Seats >= 1, Standorte >= 1)");
      }

      const dataToSave = {
        ...formData,
        max_locations: formData.max_locations === 0 ? null : formData.max_locations,
        max_additional_tokens_per_month: formData.max_additional_tokens_per_month === 0 ? null : formData.max_additional_tokens_per_month,
        max_active_jobs: formData.max_active_jobs === 0 ? null : formData.max_active_jobs,
        features: formData.features.length > 0 ? formData.features : [],
      };

      if (isCreating) {
        const { data, error } = await supabase
          .from("subscription_plans")
          .insert([dataToSave])
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from("subscription_plans")
          .update(dataToSave)
          .eq("id", planId)
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription-plans"] });
      queryClient.invalidateQueries({ queryKey: ["plan", planId] });
      onSave();
    },
    onError: (error: Error) => {
      toast({
        title: "Fehler",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateField = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const formatPrice = (cents: number) => {
    return `€${(cents / 100).toFixed(2)}`;
  };

  if (isLoading) {
    return <div>Lade Plan...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onCancel}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold">
            {isCreating ? "Neuen Plan erstellen" : `Plan bearbeiten: ${formData.name}`}
          </h2>
          <p className="text-muted-foreground">
            {isCreating ? "Erstelle einen neuen Abonnement-Plan" : "Bearbeite Plan-Details"}
          </p>
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general">Allgemein</TabsTrigger>
          <TabsTrigger value="prices">Preise</TabsTrigger>
          <TabsTrigger value="limits">Limits</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="preview">Vorschau</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Allgemeine Informationen</CardTitle>
              <CardDescription>Grundlegende Plan-Details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="id">Plan-ID *</Label>
                <Input
                  id="id"
                  value={formData.id}
                  onChange={(e) => updateField("id", e.target.value)}
                  placeholder="z.B. basic, growth, enterprise"
                  disabled={!isCreating}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Eindeutige ID für den Plan (nur bei Erstellung änderbar)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Plan-Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  placeholder="z.B. Basic, Growth, Enterprise"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Beschreibung</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  placeholder="Kurze Beschreibung des Plans"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sort_order">Sortierung</Label>
                  <Input
                    id="sort_order"
                    type="number"
                    value={formData.sort_order}
                    onChange={(e) => updateField("sort_order", parseInt(e.target.value) || 0)}
                  />
                  <p className="text-xs text-muted-foreground">Niedrigere Zahl = weiter oben</p>
                </div>

                <div className="flex items-center justify-between pt-6">
                  <div>
                    <Label htmlFor="highlight">Als empfohlen markieren</Label>
                    <p className="text-xs text-muted-foreground">Zeigt "Empfohlen" Badge</p>
                  </div>
                  <Switch
                    id="highlight"
                    checked={formData.highlight}
                    onCheckedChange={(checked) => updateField("highlight", checked)}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div>
                  <Label htmlFor="active">Plan aktiv</Label>
                  <p className="text-xs text-muted-foreground">Inaktive Pläne werden nicht angezeigt</p>
                </div>
                <Switch
                  id="active"
                  checked={formData.active}
                  onCheckedChange={(checked) => updateField("active", checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="prices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Preise</CardTitle>
              <CardDescription>Monatliche und jährliche Preise</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price_monthly_cents">Preis Monatlich (in Cent) *</Label>
                  <Input
                    id="price_monthly_cents"
                    type="number"
                    value={formData.price_monthly_cents}
                    onChange={(e) => updateField("price_monthly_cents", parseInt(e.target.value) || 0)}
                    placeholder="37900"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Aktuell: {formatPrice(formData.price_monthly_cents)}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price_yearly_cents">Preis Jährlich (in Cent) *</Label>
                  <Input
                    id="price_yearly_cents"
                    type="number"
                    value={formData.price_yearly_cents}
                    onChange={(e) => updateField("price_yearly_cents", parseInt(e.target.value) || 0)}
                    placeholder="379000"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Aktuell: {formatPrice(formData.price_yearly_cents)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div className="space-y-2">
                  <Label htmlFor="stripe_price_id_monthly">Stripe Price ID (Monatlich)</Label>
                  <Input
                    id="stripe_price_id_monthly"
                    value={formData.stripe_price_id_monthly}
                    onChange={(e) => updateField("stripe_price_id_monthly", e.target.value)}
                    placeholder="price_xxxxx"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stripe_price_id_yearly">Stripe Price ID (Jährlich)</Label>
                  <Input
                    id="stripe_price_id_yearly"
                    value={formData.stripe_price_id_yearly}
                    onChange={(e) => updateField("stripe_price_id_yearly", e.target.value)}
                    placeholder="price_xxxxx"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="limits" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Limits & Quotas</CardTitle>
              <CardDescription>Token, Jobs, Seats, Standorte</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="included_tokens">Inkludierte Tokens *</Label>
                  <Input
                    id="included_tokens"
                    type="number"
                    value={formData.included_tokens}
                    onChange={(e) => updateField("included_tokens", parseInt(e.target.value) || 0)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="token_price_cents">Token-Preis (in Cent) *</Label>
                  <Input
                    id="token_price_cents"
                    type="number"
                    value={formData.token_price_cents}
                    onChange={(e) => updateField("token_price_cents", parseInt(e.target.value) || 1800)}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Aktuell: {formatPrice(formData.token_price_cents)} pro Token
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max_additional_tokens_per_month">Max. Zusatz-Tokens/Monat</Label>
                  <Input
                    id="max_additional_tokens_per_month"
                    type="number"
                    value={formData.max_additional_tokens_per_month || ""}
                    onChange={(e) => {
                      const val = e.target.value === "" ? null : parseInt(e.target.value);
                      updateField("max_additional_tokens_per_month", val);
                    }}
                    placeholder="Leer = unbegrenzt"
                  />
                  <p className="text-xs text-muted-foreground">
                    {formData.max_additional_tokens_per_month === null 
                      ? "Unbegrenzt" 
                      : `${formData.max_additional_tokens_per_month} Tokens`}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max_active_jobs">Max. Aktive Jobs</Label>
                  <Input
                    id="max_active_jobs"
                    type="number"
                    value={formData.max_active_jobs || ""}
                    onChange={(e) => {
                      const val = e.target.value === "" ? null : parseInt(e.target.value);
                      updateField("max_active_jobs", val);
                    }}
                    placeholder="Leer = unbegrenzt"
                  />
                  <p className="text-xs text-muted-foreground">
                    {formData.max_active_jobs === null ? "Unbegrenzt" : `${formData.max_active_jobs} Jobs`}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="included_seats">Inkludierte Seats *</Label>
                  <Input
                    id="included_seats"
                    type="number"
                    value={formData.included_seats}
                    onChange={(e) => updateField("included_seats", parseInt(e.target.value) || 1)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="included_locations">Inkludierte Standorte *</Label>
                  <Input
                    id="included_locations"
                    type="number"
                    value={formData.included_locations}
                    onChange={(e) => updateField("included_locations", parseInt(e.target.value) || 1)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max_locations">Max. Standorte</Label>
                  <Input
                    id="max_locations"
                    type="number"
                    value={formData.max_locations || ""}
                    onChange={(e) => {
                      const val = e.target.value === "" ? null : parseInt(e.target.value);
                      updateField("max_locations", val);
                    }}
                    placeholder="Leer = unbegrenzt"
                  />
                  <p className="text-xs text-muted-foreground">
                    {formData.max_locations === null ? "Unbegrenzt" : `${formData.max_locations} Standorte`}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="included_jobs">Inkludierte Jobs</Label>
                  <Input
                    id="included_jobs"
                    type="number"
                    value={formData.included_jobs}
                    onChange={(e) => updateField("included_jobs", parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="features" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Features & AI-Level</CardTitle>
              <CardDescription>AI-Level und Feature-Liste</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="ai_level">AI-Level</Label>
                <Select
                  value={formData.ai_level}
                  onValueChange={(value) => updateField("ai_level", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Kein AI</SelectItem>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="advanced">Erweitert</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <Label>Features</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newFeatures = [...formData.features, ""];
                      updateField("features", newFeatures);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Feature hinzufügen
                  </Button>
                </div>

                {formData.features.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground border rounded-lg">
                    <p>Keine Features hinzugefügt</p>
                    <p className="text-sm mt-1">Klicken Sie auf "Feature hinzufügen" um Features zu erstellen</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {formData.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input
                          value={feature}
                          onChange={(e) => {
                            const newFeatures = [...formData.features];
                            newFeatures[index] = e.target.value;
                            updateField("features", newFeatures);
                          }}
                          placeholder="z.B. CRM & Export-Funktion"
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            const newFeatures = formData.features.filter((_, i) => i !== index);
                            updateField("features", newFeatures);
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {formData.features.length > 0 && (
                  <div className="pt-2">
                    <p className="text-xs text-muted-foreground">
                      {formData.features.length} Feature{formData.features.length !== 1 ? "s" : ""} hinzugefügt
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Plan-Vorschau</CardTitle>
              <CardDescription>So wird der Plan angezeigt</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold">{formData.name || "Plan Name"}</h3>
                  {formData.highlight && (
                    <Badge variant="default">
                      <Eye className="h-3 w-3 mr-1" />
                      Empfohlen
                    </Badge>
                  )}
                </div>

                {formData.description && (
                  <p className="text-muted-foreground">{formData.description}</p>
                )}

                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <div className="text-sm text-muted-foreground">Preis (Monat)</div>
                    <div className="text-xl font-bold">{formatPrice(formData.price_monthly_cents)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Preis (Jahr)</div>
                    <div className="text-xl font-bold">{formatPrice(formData.price_yearly_cents)}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Tokens</div>
                    <div className="font-semibold">{formData.included_tokens}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Jobs</div>
                    <div className="font-semibold">
                      {formData.max_active_jobs === null ? "∞" : formData.max_active_jobs}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Seats</div>
                    <div className="font-semibold">{formData.included_seats}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Standorte</div>
                    <div className="font-semibold">
                      {formData.max_locations === null ? "∞" : formData.max_locations}
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="text-sm text-muted-foreground">Token-Preis</div>
                  <div className="font-semibold">{formatPrice(formData.token_price_cents)}</div>
                </div>

                <div className="pt-2">
                  <div className="text-sm text-muted-foreground">AI-Level</div>
                  <Badge variant="outline">{formData.ai_level}</Badge>
                </div>

                {formData.features.length > 0 && (
                  <div className="pt-4 border-t">
                    <div className="text-sm text-muted-foreground mb-2">Features</div>
                    <ul className="space-y-1">
                      {formData.features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-2 text-sm">
                          <span className="text-primary">•</span>
                          <span>{feature || "(Leer)"}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-4 pt-6 border-t">
        <Button variant="outline" onClick={onCancel}>
          Abbrechen
        </Button>
        <Button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending || !formData.id || !formData.name}
        >
          <Save className="h-4 w-4 mr-2" />
          {saveMutation.isPending ? "Wird gespeichert..." : isCreating ? "Plan erstellen" : "Änderungen speichern"}
        </Button>
      </div>
    </div>
  );
}

