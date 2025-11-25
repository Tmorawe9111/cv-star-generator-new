import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/hooks/useCompany";
import TokenPurchaseModal from "@/components/billing/TokenPurchaseModal";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, ExternalLink, Sparkles, Download } from "lucide-react";

interface CompanyBillingInfo {
  id: string;
  plan_name: string | null;
  available_tokens: number | null;
  active_tokens: number | null;
  monthly_tokens: number | null;
  auto_topup_enabled: boolean | null;
  auto_topup_package: "t15" | "t45" | "t100" | null;
  stripe_customer_id?: string | null;
}

interface PurchaseRow {
  id: string;
  created_at: string;
  kind: string;
  package_code: string | null;
  amount_total_cents: number;
  currency: string | null;
  status: string | null;
}

interface InvoiceRow {
  id: string;
  period_start: string | null;
  period_end: string | null;
  total_cents: number | null;
  hosted_invoice_url: string | null;
  invoice_pdf: string | null;
  status: string | null;
  created_at: string;
}

type InvoiceFilterRange = "30" | "90" | "365" | "all";
type TokenPackageId = "t15" | "t45" | "t100";

type BillingOverviewVariant = "page" | "embedded";

type BillingOverviewProps = {
  variant?: BillingOverviewVariant;
};

const AUTO_TOPUP_OPTIONS: Array<{ id: TokenPackageId; label: string }> = [
  { id: "t15", label: "15 Tokens" },
  { id: "t45", label: "45 Tokens" },
  { id: "t100", label: "100 Tokens" },
];

export function BillingOverview({ variant = "page" }: BillingOverviewProps) {
  const { company } = useCompany();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const companyId = company?.id ?? null;

  const [showTokenModal, setShowTokenModal] = useState(false);
  const [invoiceFilter, setInvoiceFilter] = useState<InvoiceFilterRange>("90");
  const [billingPortalLoading, setBillingPortalLoading] = useState(false);

  useEffect(() => {
    const listener = () => setShowTokenModal(true);
    window.addEventListener("billing:open-token-modal", listener);
    return () => window.removeEventListener("billing:open-token-modal", listener);
  }, []);

  const {
    data: companyInfo,
    isLoading: loadingCompany,
    isError: companyError,
  } = useQuery<CompanyBillingInfo | null>({
    queryKey: ["company-billing-info", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("id, plan_name, available_tokens, active_tokens, monthly_tokens, auto_topup_enabled, auto_topup_package, stripe_customer_id")
        .eq("id", companyId)
        .maybeSingle();
      if (error) throw error;
      return data as CompanyBillingInfo | null;
    },
  });

  const { data: purchases, isLoading: loadingPurchases } = useQuery<PurchaseRow[]>({
    queryKey: ["company-purchases", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("purchases")
        .select("id, created_at, kind, package_code, amount_total_cents, currency, status")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data as PurchaseRow[]) ?? [];
    },
  });

  const { data: invoices, isLoading: loadingInvoices } = useQuery<InvoiceRow[]>({
    queryKey: ["company-invoices", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select("id, created_at, period_start, period_end, total_cents, hosted_invoice_url, invoice_pdf, status")
        .eq("company_id", companyId)
        .order("period_start", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data as InvoiceRow[]) ?? [];
    },
  });

  const filteredInvoices = useMemo(() => {
    if (!invoices) return [];
    if (invoiceFilter === "all") return invoices;

    const days = Number(invoiceFilter);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    return invoices.filter((invoice) => {
      const start = invoice.period_start ? new Date(invoice.period_start) : invoice.created_at ? new Date(invoice.created_at) : null;
      if (!start) return true;
      return start >= cutoff;
    });
  }, [invoices, invoiceFilter]);

  const effectiveCompanyId = companyInfo?.id || companyId || "";
  const displayedAvailableTokens = useMemo(() => {
    if (companyInfo?.available_tokens != null) return companyInfo.available_tokens;
    if (companyInfo?.active_tokens != null) return companyInfo.active_tokens;
    if (company?.active_tokens != null) return company.active_tokens;
    return 0;
  }, [companyInfo?.available_tokens, companyInfo?.active_tokens, company?.active_tokens]);

  const displayedMonthlyTokens = useMemo(() => {
    if (companyInfo?.monthly_tokens != null) return companyInfo.monthly_tokens;
    if (company?.seats != null) {
      const base = Number(company.seats);
      if (!Number.isNaN(base)) {
        return base * 10;
      }
    }
    return 0;
  }, [companyInfo?.monthly_tokens, company?.seats]);

  const displayedPlanName = useMemo(() => {
    if (companyInfo?.plan_name) return companyInfo.plan_name;
    if (company?.plan_type) return company.plan_type;
    return "Starter";
  }, [companyInfo?.plan_name, company?.plan_type]);

  const handleOpenBillingPortal = async () => {
    if (!effectiveCompanyId) return;
    setBillingPortalLoading(true);
    try {
      const response = await fetch("/api/stripe/create-billing-portal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ companyId: effectiveCompanyId }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.error || "Das Abrechnungsportal konnte nicht geöffnet werden.");
      }

      const data = await response.json();
      if (!data?.url) {
        throw new Error("Keine Weiterleitungs-URL erhalten.");
      }

      window.location.href = data.url;
    } catch (error: any) {
      setBillingPortalLoading(false);
      toast({
        title: "Abrechnungsportal",
        description: error?.message ?? "Bitte versuchen Sie es erneut.",
        variant: "destructive",
      });
    }
  };

  const handleToggleAutoTopup = async (value: boolean) => {
    if (!companyInfo) return;
    try {
      const { error } = await supabase
        .from("companies")
        .update({ auto_topup_enabled: value })
        .eq("id", companyInfo.id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["company-billing-info", companyId] });
      toast({
        title: "Automatisches Aufladen",
        description: value ? "Automatisches Tokens-Aufladen aktiviert." : "Automatisches Tokens-Aufladen deaktiviert.",
      });
    } catch (error: any) {
      toast({
        title: "Fehler",
        description: error?.message ?? "Einstellung konnte nicht gespeichert werden.",
        variant: "destructive",
      });
    }
  };

  const handleAutoTopupPackageChange = async (value: TokenPackageId) => {
    if (!companyInfo) return;
    try {
      const { error } = await supabase
        .from("companies")
        .update({ auto_topup_package: value })
        .eq("id", companyInfo.id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["company-billing-info", companyId] });
      toast({
        title: "Paket gespeichert",
        description: `Automatisches Paket auf ${AUTO_TOPUP_OPTIONS.find((o) => o.id === value)?.label ?? value} gesetzt.`,
      });
    } catch (error: any) {
      toast({
        title: "Fehler",
        description: error?.message ?? "Paket konnte nicht gespeichert werden.",
        variant: "destructive",
      });
    }
  };

  const renderLoadingState = () => (
    <div className="space-y-4">
      <Skeleton className="h-40 rounded-2xl" />
      <Skeleton className="h-36 rounded-2xl" />
      <Skeleton className="h-64 rounded-2xl" />
      <Skeleton className="h-64 rounded-2xl" />
    </div>
  );

  if (companyError) {
    return (
      <Card className="border-destructive/50 bg-destructive/10">
        <CardHeader>
          <CardTitle>Fehler beim Laden der Abrechnungsdaten</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Bitte laden Sie die Seite neu oder wenden Sie sich an den Support.
          </p>
        </CardContent>
      </Card>
    );
  }

  const containerClasses =
    variant === "page"
      ? "mx-auto grid max-w-6xl gap-6"
      : "grid gap-6";

  return (
    <div className={containerClasses}>
      {variant === "page" ? (
        <header className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-blue-500" />
            <span className="text-sm font-semibold uppercase tracking-wide text-blue-500">Tokens &amp; Abrechnung</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Überblick und Käufe</h1>
          <p className="text-sm text-muted-foreground">
            Behalten Sie Ihr Token-Guthaben im Blick, kaufen Sie zusätzliche Pakete oder verwalten Sie Ihr Abonnement im Stripe-Portal.
          </p>
        </header>
      ) : (
        <header className="flex flex-col gap-1">
          <h2 className="text-xl font-semibold text-gray-900">Tokens &amp; Abrechnung</h2>
          <p className="text-sm text-muted-foreground">
            Kaufen Sie zusätzliche Tokens oder verwalten Sie Ihr Stripe-Abonnement direkt hier.
          </p>
        </header>
      )}

      {loadingCompany && !companyInfo ? (
        renderLoadingState()
      ) : (
        <>
          <section className="grid gap-6 lg:grid-cols-[2fr,1fr]">
            <Card className="rounded-2xl border-none shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center justify-between">
                  <span>Token-Übersicht</span>
                  <Badge variant="secondary">Aktuell</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-3">
                  <StatTile label="Verfügbare Tokens" value={displayedAvailableTokens} emphasis />
                  <StatTile label="Monatliches Kontingent" value={displayedMonthlyTokens} />
                  <StatTile label="Plan" value={displayedPlanName} />
                </div>

                <div className="flex flex-col gap-3 md:flex-row">
                  <Button className="flex-1" size="lg" onClick={() => setShowTokenModal(true)}>
                    Zusätzliche Tokens kaufen
                  </Button>
                  <Button
                    className="flex-1"
                    variant="outline"
                    size="lg"
                    onClick={handleOpenBillingPortal}
                    disabled={billingPortalLoading}
                  >
                    {billingPortalLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Portal wird geöffnet…
                      </>
                    ) : (
                      <>
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Abrechnungsportal öffnen
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-none shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle>Automatisches Aufladen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-xl bg-blue-50 p-3 text-sm text-blue-700">
                  <div className="max-w-[75%]">
                    Aktivieren Sie das automatische Aufladen, damit Ihr Team niemals ohne Tokens dasteht.
                  </div>
                  <Switch
                    checked={Boolean(companyInfo?.auto_topup_enabled)}
                    onCheckedChange={handleToggleAutoTopup}
                  />
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Token-Paket</p>
                  <Select
                    value={companyInfo?.auto_topup_package ?? "t45"}
                    onValueChange={(value) => handleAutoTopupPackageChange(value as TokenPackageId)}
                    disabled={!companyInfo?.auto_topup_enabled}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Paket auswählen" />
                    </SelectTrigger>
                    <SelectContent>
                      {AUTO_TOPUP_OPTIONS.map((option) => (
                        <SelectItem key={option.id} value={option.id}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Wird ausgelöst, sobald das Guthaben auf 0 Tokens fällt.
                  </p>
                </div>
              </CardContent>
            </Card>
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <Card className="rounded-2xl border-none shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle>Letzte Käufe</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {loadingPurchases ? (
                  <Skeleton className="h-40 rounded-xl" />
                ) : purchases && purchases.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Datum</TableHead>
                        <TableHead>Typ</TableHead>
                        <TableHead>Produkt</TableHead>
                        <TableHead>Betrag</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {purchases.map((purchase) => (
                        <TableRow key={purchase.id}>
                          <TableCell>{formatDate(purchase.created_at)}</TableCell>
                          <TableCell className="capitalize">{purchase.kind === "tokens" ? "Tokens" : purchase.kind}</TableCell>
                          <TableCell>{purchase.package_code ?? "–"}</TableCell>
                          <TableCell>{formatCurrency(purchase.amount_total_cents, purchase.currency ?? "EUR")}</TableCell>
                          <TableCell>
                            <Badge variant={purchase.status === "paid" ? "default" : "secondary"}>
                              {purchase.status ?? "unbekannt"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <EmptyState text="Noch keine Käufe erfasst." />
                )}
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-none shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-3">
                  <CardTitle>Rechnungen</CardTitle>
                  <Select value={invoiceFilter} onValueChange={(value: InvoiceFilterRange) => setInvoiceFilter(value)}>
                    <SelectTrigger className="w-[180px] text-xs">
                      <SelectValue placeholder="Zeitraum" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">Letzte 30 Tage</SelectItem>
                      <SelectItem value="90">Letzte 3 Monate</SelectItem>
                      <SelectItem value="365">Letzte 12 Monate</SelectItem>
                      <SelectItem value="all">Gesamte Historie</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {loadingInvoices ? (
                  <Skeleton className="h-40 rounded-xl" />
                ) : filteredInvoices.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Rechnungsdatum</TableHead>
                        <TableHead>Zeitraum</TableHead>
                        <TableHead>Betrag</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Download</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredInvoices.map((invoice) => (
                        <TableRow key={invoice.id}>
                          <TableCell>{formatDate(invoice.period_start ?? invoice.created_at)}</TableCell>
                          <TableCell>
                            {formatDate(invoice.period_start ?? invoice.created_at)} – {formatDate(invoice.period_end ?? invoice.created_at)}
                          </TableCell>
                          <TableCell>{formatCurrency(invoice.total_cents ?? 0, "EUR")}</TableCell>
                          <TableCell>
                            <Badge variant={invoice.status === "paid" ? "default" : "secondary"}>
                              {invoice.status ?? "unbekannt"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {invoice.invoice_pdf || invoice.hosted_invoice_url ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-blue-600 hover:text-blue-700"
                                asChild
                              >
                                <a
                                  href={invoice.invoice_pdf ?? invoice.hosted_invoice_url ?? undefined}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <Download className="h-4 w-4" />
                                </a>
                              </Button>
                            ) : (
                              <span className="text-xs text-muted-foreground">Nicht verfügbar</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <EmptyState text="Noch keine Rechnungen vorhanden." />
                )}
              </CardContent>
            </Card>
          </section>
        </>
      )}

      <TokenPurchaseModal
        open={showTokenModal && Boolean(effectiveCompanyId)}
        companyId={effectiveCompanyId}
        onClose={() => setShowTokenModal(false)}
      />
    </div>
  );
}

function StatTile({ label, value, emphasis = false }: { label: string; value: string | number; emphasis?: boolean }) {
  return (
    <div className={`rounded-2xl border bg-white p-4 shadow-sm ${emphasis ? "border-blue-200" : "border-border"}`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-gray-900">{value}</p>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border/60 bg-white p-6 text-sm text-muted-foreground">
      <span>{text}</span>
    </div>
  );
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "–";
  try {
    return new Date(value).toLocaleDateString("de-DE");
  } catch {
    return "–";
  }
}

function formatCurrency(valueCents: number, currency: string): string {
  const amount = valueCents / 100;
  return amount.toLocaleString("de-DE", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  });
}

export default BillingOverview;
