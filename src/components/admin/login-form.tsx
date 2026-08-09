"use client";

import { useActionState } from "react";
import { Heart, Loader2 } from "lucide-react";

import { login, type LoginState } from "@/app/admin/login/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(
    login,
    {},
  );

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <div className="mx-auto mb-2 flex size-11 items-center justify-center rounded-full bg-rose-100">
          <Heart className="size-5 text-rose-600" />
        </div>
        <CardTitle className="font-serif text-2xl font-normal">
          Back-office
        </CardTitle>
        <CardDescription>Réservé à Louise & Julien</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              autoFocus
              required
            />
          </div>

          {state.error && (
            <p className="text-sm text-destructive" role="alert">
              {state.error}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={pending}>
            {pending && <Loader2 className="size-4 animate-spin" />}
            Se connecter
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
