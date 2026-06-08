"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function RefreshButton({ sectorSlug }: { sectorSlug?: string }) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);

  const onClick = async () => {
    try {
      setBusy(true);
      await fetch("/api/ingest/run", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sector: sectorSlug }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button onClick={onClick} disabled={busy} size="sm" className="gap-2">
      <RefreshCw className={"h-4 w-4 " + (busy ? "animate-spin" : "")} />
      Atualizar Agora
    </Button>
  );
}
