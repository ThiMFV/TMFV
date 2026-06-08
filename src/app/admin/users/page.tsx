import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function UsersAdmin() {
  const users = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Usuários</h1>
        <p className="text-sm text-muted-foreground">
          Papéis: <strong>Admin</strong> (gestão total), <strong>Analista</strong>{" "}
          (curadoria de notícias), <strong>Leitor</strong> (visualização).
          Integração com Auth.js fica como próximo passo.
        </p>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>Cadastrados</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead className="text-xs uppercase tracking-wider text-muted-foreground">
              <tr className="text-left">
                <th className="pb-2">Email</th>
                <th className="pb-2">Nome</th>
                <th className="pb-2">Papel</th>
                <th className="pb-2">Ativo</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="py-2 font-mono">{u.email}</td>
                  <td className="py-2">{u.name ?? "—"}</td>
                  <td className="py-2">
                    <Badge variant="info">{u.role}</Badge>
                  </td>
                  <td className="py-2">
                    <Badge variant={u.active ? "success" : "muted"}>
                      {u.active ? "ativo" : "inativo"}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
