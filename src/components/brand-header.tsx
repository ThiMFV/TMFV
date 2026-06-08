import { RefreshButton } from "@/components/refresh-button";

export function BrandHeader({ sector }: { sector?: { name: string; slug: string } }) {
  return (
    <div className="border-b bg-card">
      <div className="mx-auto flex max-w-[1480px] items-center justify-between px-6 py-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-md bg-gradient-to-br from-brand-600 to-brand-800 shadow-sm" />
            <div className="leading-tight">
              <div className="text-lg font-bold tracking-tight text-foreground">
                LORINVEST
              </div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Intelligence
              </div>
            </div>
          </div>
          {sector && (
            <>
              <div className="h-8 w-px bg-border" />
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">
                  Setor
                </div>
                <div className="text-sm font-semibold">{sector.name}</div>
              </div>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <RefreshButton sectorSlug={sector?.slug} />
        </div>
      </div>
    </div>
  );
}
