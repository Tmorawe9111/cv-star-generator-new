import React from "react";
import AdminAuthGate from "@/components/admin/AdminAuthGate";
import { SupportUnlockCodeManager } from "@/components/admin/support/SupportUnlockCodeManager";

export default function SupportPage() {
  return (
    <AdminAuthGate>
      <div className="px-3 sm:px-6 py-6 max-w-[1200px] mx-auto">
        <SupportUnlockCodeManager />
      </div>
    </AdminAuthGate>
  );
}
