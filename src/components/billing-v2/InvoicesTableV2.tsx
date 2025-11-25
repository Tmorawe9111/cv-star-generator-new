import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import type { InvoiceRowV2 } from "@/lib/billing-v2/types";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { Download } from "lucide-react";

interface InvoicesTableV2Props {
  rows: InvoiceRowV2[];
}

export function InvoicesTableV2({ rows }: InvoicesTableV2Props) {
  return (
    <Card className="rounded-2xl border-none shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle>Rechnungen</CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <EmptyState text="Noch keine Rechnungen vorhanden." />
        ) : (
          <div className="overflow-x-auto">
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
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{formatDate(row.period_start ?? row.created_at)}</TableCell>
                    <TableCell>
                      {formatDate(row.period_start)} – {formatDate(row.period_end)}
                    </TableCell>
                    <TableCell>{formatCurrency(row.total_cents ?? 0, "EUR")}</TableCell>
                    <TableCell>{row.status ?? "unbekannt"}</TableCell>
                    <TableCell className="text-right">
                      {row.invoice_pdf || row.hosted_invoice_url ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-blue-600 hover:text-blue-700"
                          asChild
                        >
                          <a href={row.invoice_pdf ?? row.hosted_invoice_url ?? undefined} target="_blank" rel="noopener noreferrer">
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
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function formatDate(value: string | null) {
  if (!value) return "—";
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

export default InvoicesTableV2;
