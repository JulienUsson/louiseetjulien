import Link from "next/link";
import { Heart, LogOut } from "lucide-react";

import { logout } from "@/app/admin/actions";
import { AdminNav } from "@/components/admin/admin-nav";
import { Button } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth";

export const metadata = { title: "Back-office — Louise & Julien" };

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link href="/admin" className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-full bg-rose-100">
              <Heart className="size-4 text-rose-600" />
            </span>
            <span className="font-serif text-lg">Louise &amp; Julien</span>
          </Link>

          <form action={logout}>
            <Button variant="ghost" size="sm" type="submit">
              <LogOut className="size-4" />
              <span className="hidden sm:inline">Déconnexion</span>
            </Button>
          </form>
        </div>
        <AdminNav />
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
