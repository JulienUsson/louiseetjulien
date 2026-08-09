"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Mail, Settings, Sparkles, Users } from "lucide-react";

import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/admin", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/admin/invites", label: "Invités", icon: Users },
  { href: "/admin/infos", label: "Informations", icon: Sparkles },
  { href: "/admin/emails", label: "Emails", icon: Mail },
  { href: "/admin/reglages", label: "Réglages", icon: Settings },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-2 pb-2">
      {LINKS.map(({ href, label, icon: Icon }) => {
        const active =
          href === "/admin" ? pathname === href : pathname.startsWith(href);

        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors",
              active
                ? "bg-rose-100 text-rose-700 font-medium"
                : "text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            <Icon className="size-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
