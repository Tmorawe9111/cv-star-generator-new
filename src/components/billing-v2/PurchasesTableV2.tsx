import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import type { PurchaseRowV2 } from "@/lib/billing-v2/types";
import { TOKEN_PACKS } from "@/lib/billing-v2/stripe-prices";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PurchasesTableV2Props {
  rows: PurchaseRowV2[];
}

export function PurchasesTableV2({ rows }: PurchasesTableV2Props) {
  const handleDownloadInvoice = async (purchase: PurchaseRowV2) => {
    try {
      // Get invoice from Stripe
      const { data, error } = await supabase.functions.invoke('download-invoice', {
        body: {
          purchaseId: purchase.id,
          companyId: purchase.company_id,
        },
      });

      if (error) throw error;

      if (data?.invoiceUrl) {
        window.open(data.invoiceUrl, '_blank');
      } else if (data?.pdfUrl) {
        // Download PDF directly
        const link = document.createElement('a');
        link.href = data.pdfUrl;
        link.download = `rechnung-${format(new Date(purchase.created_at), 'yyyy-MM-dd')}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        toast.error('Rechnung nicht verfügbar');
      }
    } catch (error: any) {
      console.error('Error downloading invoice:', error);
      toast.error('Rechnung konnte nicht heruntergeladen werden');
    }
  };

  return (
    <Card className="rounded-2xl border-none shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle>Letzte Käufe</CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <EmptyState text="Noch keine Käufe erfasst." />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Datum</TableHead>
                  <TableHead>Typ</TableHead>
                  <TableHead>Produkt</TableHead>
                  <TableHead>Betrag</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{formatDate(row.created_at)}</TableCell>
                    <TableCell className="capitalize">{row.kind === "tokens" ? "Tokens" : row.kind}</TableCell>
                    <TableCell>
                      {row.kind === "tokens" && row.package_code
                        ? `${TOKEN_PACKS[row.package_code as keyof typeof TOKEN_PACKS]?.amount || row.package_code} Token`
                        : row.package_code ?? "—"}
                    </TableCell>
                    <TableCell>{formatCurrency(row.amount_total_cents, row.currency ?? "EUR")}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        row.status === "paid" || row.status === "complete"
                          ? "bg-green-100 text-green-800"
                          : row.status === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-gray-100 text-gray-800"
                      }`}>
                        {row.status ?? "unbekannt"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownloadInvoice(row)}
                        className="h-8 w-8 p-0"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function formatDate(value: string) {
  try {
    return format(new Date(value), "dd.MM.yyyy", { locale: de });
  } catch {
    return "—";
  }
}

function formatCurrency(valueCents: number, currency: string) {
  return (valueCents / 100).toLocaleString("de-DE", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  });
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border/60 bg-muted/20 p-6 text-center text-sm text-muted-foreground">
      {text}
    </div>
  );
}

export default PurchasesTableV2;
