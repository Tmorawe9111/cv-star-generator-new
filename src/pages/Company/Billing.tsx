import BillingOverview from "@/components/billing/BillingOverview";

export default function BillingPage() {
  return (
    <main className="min-h-screen bg-[#f4f6fb] px-4 py-6 md:px-8">
      <BillingOverview variant="page" />
    </main>
  );
}
