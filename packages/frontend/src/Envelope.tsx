import { type ReactNode, useState } from "react";
import confetti from "canvas-confetti";

type CardState = "closed" | "shaking" | "exiting" | "open";

interface EnvelopeProps {
  children: ReactNode;
}

export function Envelope({ children }: EnvelopeProps) {
  const [cardState, setCardState] = useState<CardState>("closed");

  const handleClick = () => {
    if (cardState === "closed") {
      setCardState("shaking");
      setTimeout(() => {
        setCardState("exiting");
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.7 },
          colors: ["#f59e0b", "#f472b6", "#fbbf24", "#fb7185", "#ffffff"],
        });
      }, 800);
      setTimeout(() => setCardState("open"), 1800);
    }
  };

  return (
    <div
      className={`relative select-none ${cardState === "closed" ? "cursor-pointer" : ""}`}
      onClick={handleClick}
    >
      {/* Envelope */}
      <div
        className="relative w-[320px] h-[220px] md:w-[400px] md:h-[260px]"
        style={
          cardState === "shaking"
            ? { animation: "shake 0.4s ease-in-out infinite" }
            : cardState === "closed"
              ? { animation: "wiggle 2s ease-in-out infinite" }
              : undefined
        }
      >
        {/* Envelope flap (top triangle) */}
        <div
          className={`absolute top-0 left-0 w-full origin-top transition-transform duration-700 ease-in-out z-20 ${
            cardState === "exiting" || cardState === "open"
              ? "[transform:rotateX(180deg)]"
              : "[transform:rotateX(0deg)]"
          }`}
          style={{ transformStyle: "preserve-3d", perspective: "1000px" }}
        >
          <div className="w-0 h-0 border-l-[160px] md:border-l-[200px] border-r-[160px] md:border-r-[200px] border-t-[110px] md:border-t-[130px] border-l-transparent border-r-transparent border-t-amber-300 drop-shadow-sm"></div>
        </div>

        {/* Clip container for exit animation */}
        <div
          className={`absolute inset-0 z-30 transition-[clip-path] duration-700 ease-in-out ${
            cardState === "open"
              ? "[clip-path:inset(-600px_-20px_-600px_-20px)]"
              : "[clip-path:inset(-600px_-20px_0px_-20px)]"
          }`}
        >
          {/* Card content */}
          <div
            className={`absolute left-1/2 top-1/2 -translate-x-1/2 w-[280px] md:w-[340px] transition-all ease-in-out ${
              cardState === "closed" || cardState === "shaking"
                ? "translate-y-[0%] opacity-0 duration-500 pointer-events-none"
                : cardState === "exiting"
                  ? "-translate-y-[120%] opacity-100 duration-1000"
                  : "-translate-y-1/2 opacity-100 duration-1000"
            }`}
          >
            {children}
          </div>
        </div>

        {/* Envelope body */}
        <div className="absolute inset-0 bg-gradient-to-b from-amber-100 to-amber-200 rounded-b-md shadow-2xl border border-amber-300 overflow-hidden z-10">
          {/* Inner shadow/texture */}
          <div className="absolute inset-0 bg-gradient-to-t from-amber-200/50 to-transparent"></div>
          {/* Envelope bottom flap (decorative V) */}
          <div className="absolute inset-0 flex items-end justify-center">
            <div className="w-0 h-0 border-l-[160px] md:border-l-[200px] border-r-[160px] md:border-r-[200px] border-b-[140px] md:border-b-[170px] border-l-transparent border-r-transparent border-b-amber-300/40"></div>
          </div>
          {/* Hint text */}
          <div
            className={`absolute bottom-4 left-1/2 -translate-x-1/2 transition-opacity duration-300 ${cardState === "closed" || cardState === "shaking" ? "opacity-100" : "opacity-0"}`}
          >
            <p className="text-amber-700/60 text-xs tracking-wide animate-pulse">
              Cliquez pour ouvrir
            </p>
          </div>
        </div>

        {/* Heart seal - above flap (z-[25] > z-20) */}
        <div
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[25] transition-opacity duration-300 ${cardState === "closed" || cardState === "shaking" ? "opacity-100" : "opacity-0"}`}
        >
          <div className="w-16 h-16 md:w-18 md:h-18 bg-rose-400 rounded-full flex items-center justify-center shadow-lg">
            <svg
              className="w-8 h-8 md:w-9 md:h-9 text-white"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
