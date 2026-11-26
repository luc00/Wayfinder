import { ArrowRight } from 'lucide-react';
import type { AIModelTarget, SafeZoneStats, WayfinderProject } from '../types/wayfinder';

interface HomeTabProps {
  activeProject: WayfinderProject;
  targetAi: AIModelTarget;
  stats: SafeZoneStats;
  onOpenMap: () => void;
  onStartNewProject: () => void;
  onOpenSetup: () => void;
  onChangeTargetAi: (ai: AIModelTarget) => void;
}

const WORKFLOW_STEPS = [
  {
    number: '01',
    accent: 'bg-[#F3E8FF] border-[#A855F7]/40',
    tagColor: 'text-[#7E22CE]',
    title: 'Grilling iniziale (prima di scrivere codice)',
    body: 'Inserisci un’idea ancora vaga e ottieni un prompt di intervista “in ampiezza”. Lo incolli su Gemini, ChatGPT, Claude o Grok per farti fare 5–7 domande mirate su obiettivo, vincoli, rischi e cosa evitare.',
  },
  {
    number: '02',
    accent: 'bg-[#FEFCE8] border-[#EAB308]/50',
    tagColor: 'text-[#A16207]',
    title: 'I 4 Pilastri della Mappa',
    body: 'Trasformi le risposte in quattro punti fermi salvati qui: Destination (cosa deve esistere alla fine), Decisions (scelte già confermate), Fog (domande ancora aperte) e Out of Scope (funzioni escluse dalla versione attuale).',
  },
  {
    number: '03',
    accent: 'bg-[#EFF6FF] border-[#3B82F6]/40',
    tagColor: 'text-[#1D4ED8]',
    title: 'Ticket autonomi e Frontiera',
    body: 'Generi una lista di micro-ticket (Research, Grilling, Prototype, Task) collegati da dipendenze. Wayfinder calcola automaticamente quali ticket sono bloccati e quali si trovano in Frontier, cioè pronti per essere eseguiti.',
  },
  {
    number: '04',
    accent: 'bg-[#ECFDF5] border-[#10B981]/45',
    tagColor: 'text-[#047857]',
    title: 'Esecuzione: 1 Ticket = 1 Chat Fresca',
    body: 'Quando fai Claim su un ticket in Frontier, l’app assembla un prompt autocontenuto con la sola Destination essenziale, le decisioni pertinenti e l’output dei prerequisiti. Esegui in una chat vuota, incolli il riassunto finale e sblocchi il passo successivo.',
  },
];

const AI_MODELS: AIModelTarget[] = ['Gemini', 'ChatGPT', 'Claude', 'Grok'];

export function HomeTab({
  activeProject,
  targetAi,
  stats,
  onOpenMap,
  onStartNewProject,
  onOpenSetup,
  onChangeTargetAi,
}: HomeTabProps) {
  return (
    <div className="max-w-4xl mx-auto py-6 sm:py-10 space-y-10">
      {/* Card Hero principale (NO due box QR centrali: spazio dedicato al contenuto di Wayfinder) */}
      <section className="relative rounded-[28px] bg-white border border-black/10 shadow-[0_12px_32px_rgba(0,0,0,0.12)] p-7 sm:p-11 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="font-hand text-2xl font-bold text-[#1E78FF] -rotate-2 inline-block">
            anti-context-rot workflow!
          </span>
          <span className="font-mono text-xs font-semibold text-zinc-500 tabular-nums">
            Safe Zone &lt; 15% contesto
          </span>
        </div>

        <h1
          className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#111111] leading-[1.08]"
          style={{ textWrap: 'balance' }}
        >
          Usa l’AI senza farle perdere il filo.
        </h1>

        <p className="text-base sm:text-lg text-zinc-600 leading-relaxed max-w-2xl">
          LLM-Attention-Degradation-Helper sposta la memoria del tuo progetto fuori dalla chat. Scomponi un’idea complessa in piccoli ticket autonomi e genera prompt essenziali da incollare in una chat nuova per ogni singolo passo, su Gemini, ChatGPT, Claude o Grok.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="button"
            onClick={onOpenMap}
            className="inline-flex items-center gap-2 rounded-full bg-[#111111] hover:bg-zinc-800 text-white px-6 py-3 text-sm font-semibold shadow-[0_6px_18px_rgba(0,0,0,0.2)] hover:-translate-y-0.5 transition-all whitespace-nowrap cursor-pointer"
          >
            <span>Apri la Mappa</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={onStartNewProject}
            className="inline-flex items-center rounded-full bg-white hover:bg-zinc-50 text-[#111111] border-2 border-[#111111] px-6 py-2.5 text-sm font-semibold shadow-[0_4px_14px_rgba(0,0,0,0.1)] hover:-translate-y-0.5 transition-all whitespace-nowrap cursor-pointer"
          >
            Inizia un nuovo progetto
          </button>
        </div>
      </section>

      {/* Perché serve */}
      <section className="rounded-[28px] bg-white border border-black/10 shadow-[0_12px_32px_rgba(0,0,0,0.1)] p-7 sm:p-10 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#111111]">
            Perché non basta una sola chat
          </h2>
          <span className="font-hand text-xl font-bold text-[#EC4899] rotate-2 hidden sm:inline">
            stop context rot!
          </span>
        </div>

        <div className="space-y-4 text-[15px] sm:text-base text-zinc-600 leading-relaxed max-w-2xl">
          <p>
            Quando una conversazione con un modello AI supera qualche decina di messaggi, l’attenzione si degrada (<em>context rot</em>): l’AI dimentica i vincoli fissati all’inizio, ridiscute scelte già prese e introduce codice o complessità non richiesta.
          </p>
          <p>
            L’alternativa è aprire ogni volta una chat vuota, ma rispiegare tutto da zero a mano è lento e impreciso. LLM-Attention-Degradation-Helper fa da ponte: conserva decisioni, dubbi ed esclusioni in locale nel tuo browser e prepara ogni volta un prompt pulito che resta sotto il 12–15% del contesto.
          </p>
        </div>
      </section>

      {/* Cosa fa nello specifico */}
      <section className="rounded-[28px] bg-white border border-black/10 shadow-[0_12px_32px_rgba(0,0,0,0.1)] p-7 sm:p-10 space-y-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#111111]">
              Cosa fa nello specifico
            </h2>
            <p className="text-sm sm:text-base text-zinc-600 mt-1">
              Quattro passaggi concreti dalla prima idea al completamento.
            </p>
          </div>
          <span className="font-hand text-2xl font-bold text-[#10B981] -rotate-2">
            4 step chiari ↓
          </span>
        </div>

        <ol className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {WORKFLOW_STEPS.map((step) => (
            <li
              key={step.number}
              className={`rounded-[22px] border-2 p-5 space-y-2 ${step.accent}`}
            >
              <span className={`font-mono text-xs font-bold tabular-nums ${step.tagColor}`}>
                STEP {step.number}
              </span>
              <h3 className="text-base font-bold text-[#111111]">{step.title}</h3>
              <p className="text-sm text-zinc-700 leading-relaxed">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Stato attuale e modelli supportati */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="rounded-[28px] bg-white border border-black/10 shadow-[0_12px_32px_rgba(0,0,0,0.1)] p-6 sm:p-7 space-y-4">
          <h2 className="text-base font-bold text-[#111111]">
            Progetto attualmente carico
          </h2>
          <p className="text-sm text-zinc-600 leading-relaxed">
            <span className="text-[#111111] font-semibold">{activeProject.name}</span> —{' '}
            <span className="tabular-nums font-medium">
              {stats.doneTickets} su {stats.totalTickets} ticket completati
            </span>
            ,{' '}
            <span className="tabular-nums font-medium text-[#0369A1]">
              {stats.frontierTickets} pronti in Frontier
            </span>
            ,{' '}
            <span className="tabular-nums font-medium text-[#A16207]">
              {stats.fogCount} in Fog
            </span>
            .
          </p>
          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            <button
              type="button"
              onClick={onOpenMap}
              className="rounded-full bg-[#111111] hover:bg-zinc-800 text-white px-4 py-2 text-xs font-semibold transition-all hover:-translate-y-0.5 cursor-pointer"
            >
              Vai alla Mappa
            </button>
            <button
              type="button"
              onClick={onOpenSetup}
              className="rounded-full bg-white hover:bg-zinc-50 text-[#111111] border border-black/20 px-4 py-2 text-xs font-semibold transition-all hover:-translate-y-0.5 cursor-pointer"
            >
              Modifica i 4 Pilastri
            </button>
          </div>
        </div>

        <div className="rounded-[28px] bg-white border border-black/10 shadow-[0_12px_32px_rgba(0,0,0,0.1)] p-6 sm:p-7 space-y-4">
          <h2 className="text-base font-bold text-[#111111]">
            Modello AI di destinazione
          </h2>
          <p className="text-sm text-zinc-600 leading-relaxed">
            Scegli quale AI usi di solito per adattare automaticamente la struttura dei prompt esportati.
          </p>
          <div
            className="inline-flex flex-wrap items-center gap-1 rounded-full bg-[#F4F4F5] border border-black/10 p-1"
            role="group"
            aria-label="Seleziona modello AI predefinito"
          >
            {AI_MODELS.map((model) => (
              <button
                key={model}
                type="button"
                onClick={() => onChangeTargetAi(model)}
                aria-pressed={targetAi === model}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  targetAi === model
                    ? 'bg-[#111111] text-white shadow-sm'
                    : 'text-zinc-600 hover:text-[#111111]'
                }`}
              >
                {model}
              </button>
            ))}
          </div>
        </div>
      </section>

      <footer className="text-center text-xs text-zinc-500 pb-6">
        LLM-Attention-Degradation-Helper · Stato salvato localmente nel browser · Export/Import JSON incluso
      </footer>
    </div>
  );
}
