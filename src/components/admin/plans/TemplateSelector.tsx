import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PLAN_TEMPLATES, PlanTemplate } from "@/lib/plan-templates";
import { Sparkles, Users, Briefcase, MapPin, Coins, Check } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface TemplateSelectorProps {
  onSelectTemplate: (template: PlanTemplate["template"]) => void;
  onCancel: () => void;
}

export function TemplateSelector({ onSelectTemplate, onCancel }: TemplateSelectorProps) {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  const formatPrice = (cents: number) => {
    if (cents === 0) return "Kostenlos / Auf Anfrage";
    return `€${(cents / 100).toFixed(2)}`;
  };

  const formatUnlimited = (value: number | null) => {
    if (value === null || value === -1) return "∞";
    return value.toString();
  };

  const getCategoryLabel = (category: PlanTemplate["category"]) => {
    const labels = {
      starter: "Starter",
      growth: "Wachstum",
      enterprise: "Enterprise",
      custom: "Custom",
    };
    return labels[category];
  };

  const getCategoryColor = (category: PlanTemplate["category"]) => {
    const colors = {
      starter: "bg-blue-100 text-blue-800",
      growth: "bg-green-100 text-green-800",
      enterprise: "bg-purple-100 text-purple-800",
      custom: "bg-gray-100 text-gray-800",
    };
    return colors[category];
  };

  const selectedTemplate = selectedTemplateId
    ? PLAN_TEMPLATES.find((t) => t.id === selectedTemplateId)
    : null;

  const handleSelect = () => {
    if (selectedTemplate) {
      onSelectTemplate(selectedTemplate.template);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Plan-Template auswählen</h2>
        <p className="text-muted-foreground">
          Wählen Sie ein Template als Basis für Ihren neuen Plan
        </p>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">Alle</TabsTrigger>
          <TabsTrigger value="starter">Starter</TabsTrigger>
          <TabsTrigger value="growth">Wachstum</TabsTrigger>
          <TabsTrigger value="enterprise">Enterprise</TabsTrigger>
        </TabsList>

        {(["all", "starter", "growth", "enterprise"] as const).map((category) => (
          <TabsContent key={category} value={category} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {PLAN_TEMPLATES.filter(
                (t) => category === "all" || t.category === category
              ).map((template) => (
                <Card
                  key={template.id}
                  className={`cursor-pointer transition-all hover:shadow-lg ${
                    selectedTemplateId === template.id
                      ? "ring-2 ring-primary border-primary"
                      : ""
                  }`}
                  onClick={() => setSelectedTemplateId(template.id)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                        <CardDescription className="mt-1">
                          {template.description}
                        </CardDescription>
                      </div>
                      <Badge className={getCategoryColor(template.category)}>
                        {getCategoryLabel(template.category)}
                      </Badge>
                    </div>
                    {selectedTemplateId === template.id && (
                      <div className="flex items-center gap-2 mt-2 text-primary">
                        <Check className="h-4 w-4" />
                        <span className="text-sm font-medium">Ausgewählt</span>
                      </div>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <div className="text-muted-foreground">Preis (Monat)</div>
                        <div className="font-semibold">
                          {formatPrice(template.template.price_monthly_cents)}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Preis (Jahr)</div>
                        <div className="font-semibold">
                          {formatPrice(template.template.price_yearly_cents)}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t text-sm">
                      <div className="flex items-center gap-2">
                        <Coins className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="text-muted-foreground">Tokens</div>
                          <div className="font-semibold">
                            {formatUnlimited(template.template.included_tokens)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="text-muted-foreground">Jobs</div>
                          <div className="font-semibold">
                            {formatUnlimited(template.template.max_active_jobs)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="text-muted-foreground">Seats</div>
                          <div className="font-semibold">
                            {formatUnlimited(template.template.included_seats)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="text-muted-foreground">Standorte</div>
                          <div className="font-semibold">
                            {formatUnlimited(template.template.included_locations)}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t">
                      <div className="flex items-center gap-2 text-sm">
                        <Sparkles className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">AI-Level:</span>
                        <Badge variant="outline">{template.template.ai_level}</Badge>
                      </div>
                    </div>

                    {template.template.features.length > 0 && (
                      <div className="pt-2 border-t">
                        <div className="text-xs text-muted-foreground mb-1">
                          {template.template.features.length} Features
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {template.template.features.slice(0, 2).map((feature, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {feature.substring(0, 30)}
                              {feature.length > 30 ? "..." : ""}
                            </Badge>
                          ))}
                          {template.template.features.length > 2 && (
                            <Badge variant="secondary" className="text-xs">
                              +{template.template.features.length - 2}
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {selectedTemplate && (
        <div className="sticky bottom-0 bg-background border-t p-4 flex items-center justify-between shadow-lg">
          <div>
            <div className="font-medium">Template ausgewählt: {selectedTemplate.name}</div>
            <div className="text-sm text-muted-foreground">
              Sie können alle Werte nach dem Laden anpassen
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onCancel}>
              Abbrechen
            </Button>
            <Button onClick={handleSelect}>
              Template verwenden
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

