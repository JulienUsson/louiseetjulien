/** Carton « Save the Date », affiché seul ou glissé dans l'enveloppe. */
export function SaveTheDateCard({
  coupleNames = "Louise & Julien",
  dateLabel,
  footer = "Pensez à réserver cette date !",
  children,
}: {
  coupleNames?: string;
  dateLabel: string;
  footer?: string;
  children?: React.ReactNode;
}) {
  const [first, second] = coupleNames.split(/\s*&\s*/);

  return (
    <div className="bg-card border border-orange-200 rounded-sm shadow-xl p-8 md:p-10 text-center font-serif">
      <div className="text-orange-400 text-sm tracking-[0.3em] uppercase mb-4">
        Save the Date
      </div>
      <div className="w-16 h-px bg-orange-300 mx-auto mb-6" />

      <h1 className="text-3xl md:text-4xl text-foreground font-light mb-2">
        {first}
      </h1>
      {second && (
        <>
          <div className="text-orange-400 text-2xl mb-2">&amp;</div>
          <h1 className="text-3xl md:text-4xl text-foreground font-light mb-6">
            {second}
          </h1>
        </>
      )}

      <div className="w-16 h-px bg-orange-300 mx-auto mb-6" />
      <p className="text-muted-foreground text-sm leading-relaxed mb-4">
        Nous avons la joie de vous annoncer notre mariage le
      </p>
      <p className="text-foreground font-medium text-2xl mt-4 mb-1">
        {dateLabel}
      </p>

      {children}

      <div className="w-16 h-px bg-orange-300 mx-auto mt-6 mb-4" />
      <p className="text-rose-600 text-xs tracking-wider uppercase">{footer}</p>
    </div>
  );
}
