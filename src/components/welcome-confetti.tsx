"use client";

import { useEffect } from "react";
import confetti from "canvas-confetti";

/**
 * Rejoue les confettis de l'ouverture de l'enveloppe à l'arrivée sur la page
 * d'un invité — mêmes couleurs, même sensation de carton qu'on décachette.
 */
export function WelcomeConfetti() {
  useEffect(() => {
    // Respecte les préférences système : pas d'animation imposée.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const timer = setTimeout(() => {
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.7 },
        colors: ["#f97316", "#f472b6", "#fbbf24", "#fb7185", "#ffffff"],
      });
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  return null;
}
