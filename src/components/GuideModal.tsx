import { BookOpen, Compass, Layers, ShieldCheck, Sparkles, X } from 'lucide-react';

interface GuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GuideModal({ isOpen, onClose }: GuideModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="guide-modal-title"
    >
      <div className="w-full max-w-2xl max-h-[88vh] flex flex-col rounded-[28px] bg-white border-2 border-[#111111] shadow-[0_20px_50px_rgba(0,0,0,0.25)] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-black/10 bg-[#EFF6FF]">
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-5 h-5 text-[#1E78FF]" aria-hidden="true" />
            <h2 id="guide-modal-title" className="text-lg font-bold text-[#111111]">
              Come funziona LLM-Attention-Degradation-Helper
            </h2>
            <span className="font-hand text-xl font-bold text-[#1E78FF] -rotate-2 hidden sm:inline">
              guida rapida!
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Chiudi guida"
            className="p-2 rounded-full text-zinc-600 hover:text-[#111111] hover:bg-black/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6 text-sm text-zinc-700 leading-relaxed">
          <section className="rounded-2xl bg-[#FEFCE8] border-2 border-[#EAB308]/50 p-4 space-y-2">
            <div className="flex items-center gap-2 text-[#111111] font-bold text-base">
              <ShieldCheck className="w-4 h-4 text-[#059669] shrink-0" aria-hidden="true" />
              <h3>Cos’è il Context Rot e perché la Safe Zone (12–15%)</h3>
            </div>
            <p>
              Quando una chat con Gemini, ChatGPT, Claude o Grok diventa molto lunga, l’attenzione del modello si degrada (<em>context rot</em>): dimentica vincoli iniziali, reintroduce codice scartato e produce allucinazioni.
            </p>
            <p>
              Il metodo Wayfinder mantiene lo stato del progetto fuori dalla chat — qui dentro la tua <strong className="text-[#111111]">Map</strong> — e genera un prompt minimale e autocontenuto per lavorare <strong className="text-[#1D4ED8]">1 singolo Ticket = 1 Chat Fresca</strong>, restando sempre sotto il 12–15% della finestra di contesto.
            </p>
          </section>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-2xl bg-[#FAFAFA] border border-black/10 p-4 space-y-1.5">
              <h4 className="font-bold text-[#111111] flex items-center gap-2">
                <Compass className="w-4 h-4 text-[#1E78FF]" aria-hidden="true" />
                Frontier &amp; Claim
              </h4>
              <p className="text-xs text-zinc-600 leading-relaxed">
                I ticket senza dipendenze pendenti si trovano in <span className="font-mono font-semibold text-[#1D4ED8]">FRONTIER</span> (pronti da lavorare). Quando clicchi <strong className="text-[#111111]">Claim &amp; Lavora</strong>, il ticket passa in <span className="font-mono font-semibold text-[#BE185D]">CLAIMED</span> e apre il workspace dedicato.
              </p>
            </div>

            <div className="rounded-2xl bg-[#FAFAFA] border border-black/10 p-4 space-y-1.5">
              <h4 className="font-bold text-[#111111] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#A855F7]" aria-hidden="true" />
                Grilling Breadth-First
              </h4>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Prima di scrivere codice, usa il <strong className="text-[#111111]">Prompt di Grilling</strong> per farti intervistare in ampiezza dall’AI e fissare i 4 pilastri: Destination, Decisions, Fog e Out of Scope.
              </p>
            </div>

            <div className="rounded-2xl bg-[#FAFAFA] border border-black/10 p-4 space-y-1.5">
              <h4 className="font-bold text-[#111111] flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#0EA5E9]" aria-hidden="true" />
                Fog &amp; Out of Scope
              </h4>
              <p className="text-xs text-zinc-600 leading-relaxed">
                La <span className="font-mono font-semibold text-[#111111]">Fog</span> raccoglie dubbi e incognite ancora aperte. L’<span className="font-mono font-semibold text-[#111111]">Out of Scope</span> protegge ogni sessione dall’over-engineering indicando all’AI cosa ignorare.
              </p>
            </div>

            <div className="rounded-2xl bg-[#FAFAFA] border border-black/10 p-4 space-y-1.5">
              <h4 className="font-bold text-[#111111]">Flusso in 4 Passi</h4>
              <ol className="text-xs text-zinc-600 space-y-1 list-decimal list-inside">
                <li>Definisci idea e 4 pilastri in <strong className="text-[#111111]">Grilling &amp; Setup</strong>.</li>
                <li>Genera o aggiungi ticket nella <strong className="text-[#111111]">Mappa</strong>.</li>
                <li>Fai <strong className="text-[#111111]">Claim</strong> di un ticket Frontier e incolla il prompt in una <strong className="text-[#111111]">nuova chat</strong>.</li>
                <li>Incolla il riassunto finale per salvare le decisioni e sbloccare i ticket dipendenti.</li>
              </ol>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-black/10 bg-[#FAFAFA] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-[#111111] hover:bg-zinc-800 px-6 py-2 text-white text-sm font-semibold shadow-[0_4px_14px_rgba(0,0,0,0.18)] hover:-translate-y-0.5 transition-all cursor-pointer"
          >
            Ho capito, inizia
          </button>
        </div>
      </div>
    </div>
  );
}
