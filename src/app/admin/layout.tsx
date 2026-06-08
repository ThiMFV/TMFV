import Link from "next/link";
import { Suspense } from "react";
import { AppHeader } from "@/components/app-header";
import {
  Tag,
  Newspaper,
  Layers,
  Columns3,
  Activity,
  Users,
} from "lucide-react";

const NAV = [
  { href: "/admin", label: "Visão geral", icon: Layers },
  { href: "/admin/sectors", label: "Setores", icon: Columns3 },
  { href: "/admin/keywords", label: "Palavras-chave", icon: Tag },
  { href: "/admin/sources", label: "Fontes", icon: Newspaper },
  { href: "/admin/health", label: "Saúde das fontes", icon: Activity },
  { href: "/admin/users", label: "Usuários", icon: Users },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <Suspense fallback={<div className="h-14 border-b" />}>
        <AppHeader />
      </Suspense>
      <div className="container grid gap-6 py-6 md:grid-cols-[200px_minmax(0,1fr)]">
        <aside className="space-y-1">
          <h2 className="px-2 pb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Administração
          </h2>
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </aside>
        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
