import { Envelope } from "./Envelope";

export function SaveTheDate() {
  return (
    <Envelope>
      <div className="bg-white border border-amber-200 rounded-sm shadow-xl p-8 md:p-10 text-center font-serif">
        <div className="text-amber-400 text-sm tracking-[0.3em] uppercase mb-4">
          Save the Date
        </div>
        <div className="w-16 h-px bg-amber-300 mx-auto mb-6"></div>
        <h1 className="text-3xl md:text-4xl text-gray-800 font-light mb-2">
          Louise
        </h1>
        <div className="text-amber-400 text-2xl mb-2">&amp;</div>
        <h1 className="text-3xl md:text-4xl text-gray-800 font-light mb-6">
          Julien
        </h1>
        <div className="w-16 h-px bg-amber-300 mx-auto mb-6"></div>
        <p className="text-gray-600 text-sm leading-relaxed mb-4">
          Nous avons la joie de vous annoncer notre mariage le
        </p>
        <p className="text-gray-800 font-medium text-2xl mt-4 mb-1">
          10 Juillet 2027
        </p>
        <p className="text-gray-600 text-sm mt-4">Plus de détails à venir...</p>
        <div className="w-16 h-px bg-amber-300 mx-auto mt-6 mb-4"></div>
        <p className="text-amber-600 text-xs tracking-wider uppercase">
          Pensez à Réserver cette date !
        </p>
      </div>
    </Envelope>
  );
}
