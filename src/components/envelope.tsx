"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
import confetti from "canvas-confetti";
import { X } from "lucide-react";

type CardState = "closed" | "shaking" | "exiting" | "open";

/**
 * Enveloppe animée reprise de la SPA d'origine : on clique, elle tremble,
 * s'ouvre, lâche des confettis et laisse sortir le carton.
 *
 * Le carton est positionné en absolu et centré sur l'enveloppe : une fois
 * sorti, il déborde largement sous elle. On mesure ce débordement pour le
 * réserver en padding, sinon le carton recouvre ce qui suit dans la page.
 */
export function Envelope({ children }: { children: ReactNode }) {
  const [cardState, setCardState] = useState<CardState>("closed");
  const [overflowBelow, setOverflowBelow] = useState(0);

  const boxRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const isOpen = cardState === "open";
  const isClosed = cardState === "closed" || cardState === "shaking";

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  // Le ResizeObserver déclenche son callback dès l'observation : il fournit la
  // mesure initiale autant que les suivantes (rotation, changement de police).
  useEffect(() => {
    const box = boxRef.current;
    const card = cardRef.current;
    if (!isOpen || !box || !card) return;

    const observer = new ResizeObserver(() => {
      setOverflowBelow(
        Math.max(0, card.offsetHeight / 2 - box.offsetHeight / 2),
      );
    });
    observer.observe(box);
    observer.observe(card);

    return () => observer.disconnect();
  }, [isOpen]);

  const open = () => {
    if (cardState !== "closed") return;

    setCardState("shaking");
    timers.current.push(
      setTimeout(() => {
        setCardState("exiting");
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.7 },
          colors: ["#f97316", "#f472b6", "#fbbf24", "#fb7185", "#ffffff"],
        });
      }, 800),
      setTimeout(() => setCardState("open"), 1800),
    );
  };

  const close = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setOverflowBelow(0);
    setCardState("closed");
  };

  return (
    <div className="flex flex-col items-center">
      <div
        className={`relative select-none transition-[padding] duration-700 ease-in-out ${
          cardState === "closed" ? "cursor-pointer" : ""
        }`}
        style={{ paddingBottom: overflowBelow }}
        onClick={open}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            open();
          }
        }}
        role={cardState === "closed" ? "button" : undefined}
        tabIndex={cardState === "closed" ? 0 : undefined}
        aria-label={cardState === "closed" ? "Ouvrir l'enveloppe" : undefined}
      >
        <div
          ref={boxRef}
          className="relative w-[320px] h-[220px] md:w-[400px] md:h-[260px]"
          style={
            cardState === "shaking"
              ? { animation: "shake 0.4s ease-in-out infinite" }
              : cardState === "closed"
                ? { animation: "wiggle 2s ease-in-out infinite" }
                : undefined
          }
        >
          {/* Rabat supérieur */}
          <div
            className={`absolute top-0 left-0 w-full origin-top transition-transform duration-700 ease-in-out z-20 ${
              isClosed
                ? "[transform:rotateX(0deg)]"
                : "[transform:rotateX(180deg)]"
            }`}
            style={{ transformStyle: "preserve-3d", perspective: "1000px" }}
          >
            <div className="w-0 h-0 border-l-[160px] md:border-l-[200px] border-r-[160px] md:border-r-[200px] border-t-[110px] md:border-t-[130px] border-l-transparent border-r-transparent border-t-orange-300 drop-shadow-sm" />
          </div>

          {/* Masque : le carton reste caché dans l'enveloppe avant l'ouverture */}
          <div
            className={`absolute inset-0 z-30 transition-[clip-path] duration-700 ease-in-out ${
              isOpen
                ? "[clip-path:inset(-600px_-20px_-600px_-20px)]"
                : "[clip-path:inset(-600px_-20px_0px_-20px)]"
            }`}
          >
            <div
              ref={cardRef}
              className={`absolute left-1/2 top-1/2 -translate-x-1/2 w-[280px] md:w-[340px] transition-all ease-in-out ${
                isClosed
                  ? "translate-y-[0%] opacity-0 duration-500 pointer-events-none"
                  : cardState === "exiting"
                    ? "-translate-y-[120%] opacity-100 duration-1000"
                    : "-translate-y-1/2 opacity-100 duration-1000"
              }`}
            >
              {children}
            </div>
          </div>

          {/* Corps de l'enveloppe */}
          <div className="absolute inset-0 bg-gradient-to-b from-orange-100 to-orange-200 rounded-b-md shadow-2xl border border-orange-300 overflow-hidden z-10">
            <div className="absolute inset-0 bg-gradient-to-t from-orange-200/50 to-transparent" />
            <div className="absolute inset-0 flex items-end justify-center">
              <div className="w-0 h-0 border-l-[160px] md:border-l-[200px] border-r-[160px] md:border-r-[200px] border-b-[140px] md:border-b-[170px] border-l-transparent border-r-transparent border-b-orange-300/40" />
            </div>
            <div
              className={`absolute bottom-4 left-1/2 -translate-x-1/2 transition-opacity duration-300 ${isClosed ? "opacity-100" : "opacity-0"}`}
            >
              <p className="text-orange-800/60 text-xs tracking-wide animate-pulse">
                Clique pour ouvrir
              </p>
            </div>
          </div>

          {/* Sceau en forme de cœur, au-dessus du rabat */}
          <div
            className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[25] transition-opacity duration-300 ${isClosed ? "opacity-100" : "opacity-0"}`}
          >
            <div className="w-16 h-16 md:w-18 md:h-18 bg-rose-400 rounded-full flex items-center justify-center shadow-lg">
              <svg
                className="w-8 h-8 md:w-9 md:h-9 text-white"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {isOpen && (
        <button
          type="button"
          onClick={close}
          className="mt-6 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs tracking-wide uppercase text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="size-3.5" />
          Refermer l&apos;enveloppe
        </button>
      )}
    </div>
  );
}
