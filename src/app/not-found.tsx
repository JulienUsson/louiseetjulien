import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="bg-wedding min-h-screen flex flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="font-serif">
        <p className="text-orange-500 text-xs tracking-[0.3em] uppercase">
          Oups
        </p>
        <h1 className="mt-3 text-3xl font-light">Cette page n&apos;existe pas</h1>
      </div>
      <p className="max-w-md text-sm text-muted-foreground">
        Le lien est peut-être incomplet, ou le code a été mal recopié.
        Vérifie-le, ou écris-nous et on te renverra ton invitation.
      </p>
      <Button asChild>
        <Link href="/">Retour à l&apos;accueil</Link>
      </Button>
    </main>
  );
}
