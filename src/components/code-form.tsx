"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { normalizeCode } from "@/lib/code-format";

/**
 * Rattrapage pour l'invité qui a perdu son lien mais a gardé le carton :
 * il saisit son code et retombe sur sa page.
 */
export function CodeForm() {
  const router = useRouter();
  const [code, setCode] = useState("");

  return (
    <form
      className="w-full max-w-sm text-center"
      onSubmit={(event) => {
        event.preventDefault();
        const normalized = normalizeCode(code);
        if (normalized) router.push(`/i/${normalized}`);
      }}
    >
      <label
        htmlFor="code"
        className="block text-sm text-muted-foreground mb-3"
      >
        Tu as reçu un code personnel ?
      </label>
      <div className="flex gap-2">
        <Input
          id="code"
          value={code}
          onChange={(event) => setCode(event.target.value)}
          placeholder="Ex. AB3D5FH7KM"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          className="bg-card tracking-widest uppercase"
        />
        <Button type="submit" disabled={!normalizeCode(code)}>
          Entrer
        </Button>
      </div>
    </form>
  );
}
