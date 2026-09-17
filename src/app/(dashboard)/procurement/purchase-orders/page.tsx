"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DeprecatedPurchaseOrdersPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/procurement/project-materials");
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-50 p-12 text-center text-xs text-walnut">
      Redirecting to Project Materials...
    </div>
  );
}
