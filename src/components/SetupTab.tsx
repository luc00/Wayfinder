import { useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  ListPlus,
  Plus,
  Sparkles,
  Trash2,
  Wand2,
} from 'lucide-react';
import type { AIModelTarget, Ticket, WayfinderProject } from '../types/wayfinder';
import {
  getNextTicketId,
  parseGrillingNotes,
  parseTicketsJson,
  recomputeTicketStatuses,
} from '../utils/mapLogic';
import {
  AI_MODEL_LINKS,
  buildGrillingPrompt,
  buildMapCreationPrompt,
} from '../utils/promptBuilder';
import { CopyButton } from './CopyButton';

interface SetupTabProps {
  project: WayfinderProject;
  targetAi: AIModelTarget;
  onUpdateProject: (updater: (proj: WayfinderProject) => WayfinderProject) => void;
  onGoToMap: () => void;
}

export function SetupTab({
  project,
  targetAi,
  onUpdateProject,
  onGoToMap,
}: SetupTabProps) {
  const [grillingPromptVisible, setGrillingPromptVisible] = useState(false);
  const [mapPromptVisible, setMapPromptVisible] = useState(false);

  const [newDecision, setNewDecision] = useState('');
  const [newFog, setNewFog] = useState('');
  const [newOutOfScope, setNewOutOfScope] = useState('');

  const [grillingParseStatus, setGrillingParseStatus] = useState<string | null>(null);
  const [jsonInput, setJsonInput] = useState('');
  const [importMode, setImportMode] = useState<'append' | 'replace'>('append');
  const [jsonFeedback, setJsonFeedback] = useState<{
    type: 'error' | 'success';
    message: string;
  } | null>(null);

  const grillingPrompt = buildGrillingPrompt(project.vagueIdea, targetAi);
  const mapCreationPrompt = buildMapCreationPrompt(project, targetAi);
  const aiLink = AI_MODEL_LINKS[targetAi];

  function handleApplyGrillingNotes() {
    if (!project.grillingNotes.trim()) {
      setGrillingParseStatus('Incolla prima il riepilogo o le note ricevute dall’AI.');
      return;
    }
    const parsed = parseGrillingNotes(project.grillingNotes);
    onUpdateProject((prev) => {
      const mergedDecisions = [...prev.decisions];
      for (const d of parsed.decisions) {
        if (!mergedDecisions.includes(d)) mergedDecisions.push(d);
      }
      const mergedFog = [...prev.fog];
      for (const f of parsed.fog) {
        if (!mergedFog.includes(f)) mergedFog.push(f);
      }
      const mergedOut = [...prev.outOfScope];
      for (const o of parsed.outOfScope) {
        if (!mergedOut.includes(o)) mergedOut.push(o);
      }
      return {
        ...prev,
        destination: parsed.destination || prev.destination,
        decisions: mergedDecisions,
        fog: mergedFog,
        outOfScope: mergedOut,
        updatedAt: new Date().toISOString(),
      };
    });

    const parts: string[] = [];
    if (parsed.destination) parts.push('Destination aggiornata');
    if (parsed.decisions.length > 0) parts.push(`${parsed.decisions.length} decisioni`);
    if (parsed.fog.length > 0) parts.push(`${parsed.fog.length} fog`);
    if (parsed.outOfScope.length > 0) parts.push(`${parsed.outOfScope.length} esclusioni`);

    setGrillingParseStatus(
      parts.length > 0
        ? `Estratti nei pilastri: ${parts.join(', ')}.`
        : 'Nessun elemento riconosciuto nel testo incollato.'
    );
  }

  function addItem(field: 'decisions' | 'fog' | 'outOfScope', value: string, clear: () => void) {
    const trimmed = value.trim();
    if (!trimmed) return;
    onUpdateProject((prev) => {
      if (prev[field].includes(trimmed)) return prev;
      return {
        ...prev,
        [field]: [...prev[field], trimmed],
        updatedAt: new Date().toISOString(),
      };
    });
    clear();
  }

  function removeItem(field: 'decisions' | 'fog' | 'outOfScope', index: number) {
    onUpdateProject((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
      updatedAt: new Date().toISOString(),
    }));
  }

  function promoteFogToDecision(index: number) {
    const fogText = project.fog[index];
    if (!fogText) return;
    onUpdateProject((prev) => ({
      ...prev,
      fog: prev.fog.filter((_, i) => i !== index),
      decisions: prev.decisions.includes(fogText) ? prev.decisions : [...prev.decisions, fogText],
      updatedAt: new Date().toISOString(),
    }));
  }

  function handleImportTicketsJson() {
    setJsonFeedback(null);
    const startId = importMode === 'replace' ? 1 : getNextTicketId(project.tickets);
    const parsed = parseTicketsJson(jsonInput, startId);
    if (!parsed.ok) {
      setJsonFeedback({ type: 'error', message: parsed.error });
      return;
    }

    onUpdateProject((prev) => {
      const nextTickets: Ticket[] =
        importMode === 'replace'
          ? parsed.tickets
          : recomputeTicketStatuses([...prev.tickets, ...parsed.tickets]);
      return {
        ...prev,
        tickets: nextTickets,
        activeTicketId: importMode === 'replace' ? null : prev.activeTicketId,
        updatedAt: new Date().toISOString(),
      };
    });

    setJsonInput('');
    setJsonFeedback({
      type: 'success',
      message: `${parsed.tickets.length} ticket ${
        parsed.tickets.length === 1 ? 'importato' : 'importati'
      } con successo nella Mappa.`,
    });
  }

  return (
    <div className="space-y-8">
      {/* Sezione 1: Idea iniziale & Generatore Prompt di Grilling */}
      <section className="rounded-[28px] bg-white border border-black/10 shadow-[0_12px_32px_rgba(0,0,0,0.12)] p-6 sm:p-8 space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#111111]">
                1. Grilling &amp; Esplorazione Breadth-First
              </h1>
              <span className="font-hand text-xl font-bold text-[#A855F7] -rotate-2 hidden sm:inline">
                intervista prima!
              </span>
            </div>
            <p className="text-sm text-zinc-600">
              Parti da un’idea grezza, fatti intervistare in ampiezza dall’AI per chiarire architettura e vincoli, poi fissa i 4 pilastri della Map.
            </p>
          </div>
          <a
            href={aiLink.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full bg-white hover:bg-zinc-50 border-2 border-[#111111] px-4 py-2 text-xs font-semibold text-[#111111] shadow-[0_4px_12px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all whitespace-nowrap shrink-0"
          >
            <span>{aiLink.label}</span>
            <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
          </a>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sinistra: Idea vaga + genera prompt grilling */}
          <div className="space-y-3">
            <label htmlFor="vague-idea-input" className="block text-xs font-bold text-[#111111]">
              Idea iniziale del progetto
            </label>
            <textarea
              id="vague-idea-input"
              rows={5}
              value={project.vagueIdea}
              onChange={(e) =>
                onUpdateProject((prev) => ({
                  ...prev,
                  vagueIdea: e.target.value,
                  updatedAt: new Date().toISOString(),
                }))
              }
              placeholder="Es. Voglio creare un clone locale di Loom per registrare schermo e webcam..."
              className="w-full rounded-2xl bg-[#FAFAFA] border-2 border-black/10 p-3.5 text-sm text-[#111111] placeholder:text-zinc-400 focus:outline-none focus:border-[#111111] leading-relaxed"
            />
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setGrillingPromptVisible(true)}
                className="inline-flex items-center gap-2 rounded-full bg-[#111111] hover:bg-zinc-800 text-white px-5 py-2.5 text-sm font-semibold shadow-[0_6px_16px_rgba(0,0,0,0.18)] hover:-translate-y-0.5 transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-[#FACC15]" aria-hidden="true" />
                <span>Genera Prompt di Grilling ({targetAi})</span>
              </button>
              {grillingPromptVisible && (
                <CopyButton
                  text={grillingPrompt}
                  label="Copia Prompt di Grilling"
                  variant="secondary"
                />
              )}
            </div>

            {grillingPromptVisible && (
              <div className="mt-3 rounded-2xl bg-[#111111] text-zinc-100 p-4 space-y-2 border-2 border-[#111111]">
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span>Prompt ottimizzato per {targetAi}</span>
                  <span className="font-mono tabular-nums">
                    {grillingPrompt.length} caratteri
                  </span>
                </div>
                <pre className="text-xs font-mono text-zinc-100 whitespace-pre-wrap break-words max-h-56 overflow-y-auto leading-relaxed">
                  {grillingPrompt}
                </pre>
              </div>
            )}
          </div>

          {/* Destra: Incolla risposte Grilling */}
          <div className="space-y-3">
            <label htmlFor="grilling-notes-input" className="block text-xs font-bold text-[#111111]">
              Incolla il riepilogo o le note dal Grilling
            </label>
            <textarea
              id="grilling-notes-input"
              rows={5}
              value={project.grillingNotes}
              onChange={(e) =>
                onUpdateProject((prev) => ({
                  ...prev,
                  grillingNotes: e.target.value,
                  updatedAt: new Date().toISOString(),
                }))
              }
              placeholder={`Incolla qui le risposte dell'AI con sezioni tipo:\nDestination: ...\nDecisions:\n- ...\nFog:\n- ...\nOut of Scope:\n- ...`}
              className="w-full rounded-2xl bg-[#FAFAFA] border-2 border-black/10 p-3.5 text-sm text-[#111111] placeholder:text-zinc-400 focus:outline-none focus:border-[#111111] leading-relaxed"
            />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleApplyGrillingNotes}
                className="inline-flex items-center gap-2 rounded-full bg-white hover:bg-zinc-50 border-2 border-[#111111] text-[#111111] px-5 py-2.5 text-sm font-semibold shadow-[0_4px_14px_rgba(0,0,0,0.1)] hover:-translate-y-0.5 transition-all cursor-pointer"
              >
                <Wand2 className="w-4 h-4 text-[#A855F7]" aria-hidden="true" />
                <span>Estrai nei 4 Pilastri</span>
              </button>
              {grillingParseStatus && (
                <p className="text-xs font-semibold text-[#047857]" role="status">
                  {grillingParseStatus}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Sezione 2: I 4 Pilastri della Mappa come Sticker / Post-it */}
      <section className="rounded-[28px] bg-white border border-black/10 shadow-[0_12px_32px_rgba(0,0,0,0.12)] p-6 sm:p-8 space-y-5">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-[#111111]">
              2. I 4 Pilastri della Mappa
            </h2>
            <p className="text-sm text-zinc-600 mt-0.5">
              Post-it strutturali del tuo progetto: ogni sessione riceverà solo il contesto essenziale estratto da qui.
            </p>
          </div>
          <span className="font-hand text-2xl font-bold text-[#1E78FF] rotate-1">
            stato esterno ↓
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Pilastro 1: Destination (Azzurro pastello) */}
          <div className="rounded-[24px] bg-[#EFF6FF] border-2 border-[#3B82F6]/35 p-5 space-y-3 shadow-[0_6px_16px_rgba(59,130,246,0.08)]">
            <div className="flex items-center justify-between">
              <label htmlFor="pillar-destination" className="text-sm font-bold text-[#111111]">
                Destination (Obiettivo finale)
              </label>
              <span className="font-hand text-base font-bold text-[#1D4ED8]">traguardo</span>
            </div>
            <textarea
              id="pillar-destination"
              rows={4}
              value={project.destination}
              onChange={(e) =>
                onUpdateProject((prev) => ({
                  ...prev,
                  destination: e.target.value,
                  updatedAt: new Date().toISOString(),
                }))
              }
              placeholder="Descrivi l'artefatto concreto funzionante che vuoi ottenere..."
              className="w-full rounded-2xl bg-white border border-black/10 p-3 text-sm text-[#111111] placeholder:text-zinc-400 focus:outline-none focus:border-[#111111] leading-relaxed"
            />
          </div>

          {/* Pilastro 2: Decisions Taken (Menta / Smeraldo pastello) */}
          <div className="rounded-[24px] bg-[#ECFDF5] border-2 border-[#10B981]/40 p-5 space-y-3 flex flex-col shadow-[0_6px_16px_rgba(16,185,129,0.08)]">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#111111]">
                Decisions Taken (Decisioni confermate)
              </h3>
              <span className="rounded-full bg-white border border-black/10 px-2.5 py-0.5 text-xs font-mono font-bold text-[#047857] tabular-nums">
                {project.decisions.length}
              </span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newDecision}
                onChange={(e) => setNewDecision(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addItem('decisions', newDecision, () => setNewDecision(''));
                  }
                }}
                aria-label="Nuova decisione confermata"
                placeholder="Aggiungi vincolo o scelta già fissata..."
                className="flex-1 rounded-full bg-white border border-black/15 px-4 py-2 text-sm text-[#111111] placeholder:text-zinc-400 focus:outline-none focus:border-[#111111]"
              />
              <button
                type="button"
                onClick={() => addItem('decisions', newDecision, () => setNewDecision(''))}
                aria-label="Aggiungi decisione"
                className="w-10 h-10 rounded-full bg-[#111111] hover:bg-zinc-800 text-white flex items-center justify-center shrink-0 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <ul className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {project.decisions.length === 0 ? (
                <li className="text-xs text-zinc-600 py-2">
                  Nessuna decisione confermata. Le scelte chiuse nei ticket verranno salvate qui automaticamente.
                </li>
              ) : (
                project.decisions.map((item, idx) => (
                  <li
                    key={`${idx}-${item.slice(0, 12)}`}
                    className="flex items-start justify-between gap-2 rounded-2xl bg-white border border-black/10 px-3.5 py-2.5 text-xs text-[#111111]"
                  >
                    <span className="leading-relaxed">{item}</span>
                    <button
                      type="button"
                      onClick={() => removeItem('decisions', idx)}
                      aria-label={`Rimuovi decisione: ${item}`}
                      className="p-1 text-zinc-400 hover:text-red-600 shrink-0 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>

          {/* Pilastro 3: Fog (Post-it giallo) */}
          <div className="rounded-[24px] bg-[#FEFCE8] border-2 border-[#EAB308]/50 p-5 space-y-3 flex flex-col shadow-[0_6px_16px_rgba(234,179,8,0.1)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-[#111111]">
                  Fog (Punti oscuri / Domande aperte)
                </h3>
                <span className="font-hand text-base font-bold text-[#B45309]">da chiarire!</span>
              </div>
              <span className="rounded-full bg-white border border-black/10 px-2.5 py-0.5 text-xs font-mono font-bold text-[#A16207] tabular-nums">
                {project.fog.length}
              </span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newFog}
                onChange={(e) => setNewFog(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addItem('fog', newFog, () => setNewFog(''));
                  }
                }}
                aria-label="Nuovo punto oscuro o domanda aperta"
                placeholder="Cosa non è ancora chiaro?"
                className="flex-1 rounded-full bg-white border border-black/15 px-4 py-2 text-sm text-[#111111] placeholder:text-zinc-400 focus:outline-none focus:border-[#111111]"
              />
              <button
                type="button"
                onClick={() => addItem('fog', newFog, () => setNewFog(''))}
                aria-label="Aggiungi fog"
                className="w-10 h-10 rounded-full bg-[#111111] hover:bg-zinc-800 text-white flex items-center justify-center shrink-0 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <ul className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {project.fog.length === 0 ? (
                <li className="text-xs text-zinc-600 py-2">
                  Nessuna Fog aperta: tutti i requisiti critici sono chiariti.
                </li>
              ) : (
                project.fog.map((item, idx) => (
                  <li
                    key={`${idx}-${item.slice(0, 12)}`}
                    className="flex items-start justify-between gap-2 rounded-2xl bg-white border border-black/10 px-3.5 py-2.5 text-xs text-[#111111]"
                  >
                    <span className="leading-relaxed">{item}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => promoteFogToDecision(idx)}
                        title="Sposta nelle Decisioni confermate"
                        aria-label={`Risolvi fog in decisione: ${item}`}
                        className="p-1 text-zinc-400 hover:text-[#10B981] cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeItem('fog', idx)}
                        aria-label={`Rimuovi fog: ${item}`}
                        className="p-1 text-zinc-400 hover:text-red-600 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>

          {/* Pilastro 4: Out of Scope (Rosa/Magenta pop tenue) */}
          <div className="rounded-[24px] bg-[#FDF2F8] border-2 border-[#EC4899]/35 p-5 space-y-3 flex flex-col shadow-[0_6px_16px_rgba(236,72,153,0.08)]">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#111111]">
                Out of Scope (Esclusioni)
              </h3>
              <span className="rounded-full bg-white border border-black/10 px-2.5 py-0.5 text-xs font-mono font-bold text-[#BE185D] tabular-nums">
                {project.outOfScope.length}
              </span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newOutOfScope}
                onChange={(e) => setNewOutOfScope(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addItem('outOfScope', newOutOfScope, () => setNewOutOfScope(''));
                  }
                }}
                aria-label="Nuova esclusione out of scope"
                placeholder="Cosa NON fare ora per evitare over-engineering..."
                className="flex-1 rounded-full bg-white border border-black/15 px-4 py-2 text-sm text-[#111111] placeholder:text-zinc-400 focus:outline-none focus:border-[#111111]"
              />
              <button
                type="button"
                onClick={() => addItem('outOfScope', newOutOfScope, () => setNewOutOfScope(''))}
                aria-label="Aggiungi esclusione"
                className="w-10 h-10 rounded-full bg-[#111111] hover:bg-zinc-800 text-white flex items-center justify-center shrink-0 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <ul className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {project.outOfScope.length === 0 ? (
                <li className="text-xs text-zinc-600 py-2">
                  Nessuna esclusione impostata. Aggiungi cosa evitare per mantenere i prompt focalizzati.
                </li>
              ) : (
                project.outOfScope.map((item, idx) => (
                  <li
                    key={`${idx}-${item.slice(0, 12)}`}
                    className="flex items-start justify-between gap-2 rounded-2xl bg-white border border-black/10 px-3.5 py-2.5 text-xs text-[#111111]"
                  >
                    <span className="leading-relaxed">{item}</span>
                    <button
                      type="button"
                      onClick={() => removeItem('outOfScope', idx)}
                      aria-label={`Rimuovi esclusione: ${item}`}
                      className="p-1 text-zinc-400 hover:text-red-600 shrink-0 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      </section>

      {/* Sezione 3: Genera Prompt Creazione Mappa & Import JSON */}
      <section className="rounded-[28px] bg-white border border-black/10 shadow-[0_12px_32px_rgba(0,0,0,0.12)] p-6 sm:p-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-[#111111]">
              3. Popola la Mappa con Ticket Autonomi
            </h2>
            <p className="text-sm text-zinc-600 mt-0.5">
              Genera il prompt di scomposizione dai tuoi 4 pilastri e incolla il JSON restituito dall’AI per creare i ticket.
            </p>
          </div>
          <button
            type="button"
            onClick={onGoToMap}
            className="inline-flex items-center gap-1.5 rounded-full bg-white hover:bg-zinc-50 border-2 border-[#111111] px-4 py-2 text-xs font-semibold text-[#111111] shadow-[0_4px_12px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all cursor-pointer"
          >
            <span>Vai alla Mappa ({project.tickets.length})</span>
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setMapPromptVisible(true)}
                className="inline-flex items-center gap-2 rounded-full bg-[#111111] hover:bg-zinc-800 text-white px-5 py-2.5 text-sm font-semibold shadow-[0_6px_16px_rgba(0,0,0,0.18)] hover:-translate-y-0.5 transition-all cursor-pointer"
              >
                <ListPlus className="w-4 h-4 text-[#0EA5E9]" aria-hidden="true" />
                <span>Genera Prompt Creazione Mappa</span>
              </button>
              {mapPromptVisible && (
                <CopyButton
                  text={mapCreationPrompt}
                  label="Copia Prompt Mappa"
                  variant="secondary"
                />
              )}
            </div>

            {mapPromptVisible ? (
              <div className="rounded-2xl bg-[#111111] text-zinc-100 p-4 space-y-2 border-2 border-[#111111]">
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span>Prompt JSON strutturato ({targetAi})</span>
                  <span className="font-mono tabular-nums">
                    {mapCreationPrompt.length} caratteri
                  </span>
                </div>
                <pre className="text-xs font-mono text-zinc-100 whitespace-pre-wrap break-words max-h-64 overflow-y-auto leading-relaxed">
                  {mapCreationPrompt}
                </pre>
              </div>
            ) : (
              <p className="text-xs text-zinc-600 rounded-2xl border-2 border-dashed border-black/15 bg-[#FAFAFA] p-5">
                Clicca &ldquo;Genera Prompt Creazione Mappa&rdquo; per ottenere un prompt pronto da incollare su {targetAi}. L’AI ti restituirà un JSON con i ticket e le relative dipendenze.
              </p>
            )}
          </div>

          <div className="space-y-3">
            <label htmlFor="tickets-json-input" className="block text-xs font-bold text-[#111111]">
              Incolla qui il JSON dei ticket generato dall’AI
            </label>
            <textarea
              id="tickets-json-input"
              rows={6}
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder={`[\n  {\n    "id": 1,\n    "title": "Verifica API",\n    "description": "...",\n    "category": "RESEARCH",\n    "dependencies": []\n  }\n]`}
              className="w-full rounded-2xl bg-[#FAFAFA] border-2 border-black/10 p-3.5 text-xs font-mono text-[#111111] placeholder:text-zinc-400 focus:outline-none focus:border-[#111111]"
            />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-4 text-xs font-medium text-zinc-700">
                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="importMode"
                    checked={importMode === 'append'}
                    onChange={() => setImportMode('append')}
                    className="accent-[#111111]"
                  />
                  <span>Aggiungi</span>
                </label>
                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="importMode"
                    checked={importMode === 'replace'}
                    onChange={() => setImportMode('replace')}
                    className="accent-[#111111]"
                  />
                  <span>Sostituisci esistenti</span>
                </label>
              </div>
              <button
                type="button"
                onClick={handleImportTicketsJson}
                className="inline-flex items-center gap-2 rounded-full bg-[#10B981] hover:bg-[#059669] text-white border-2 border-[#059669] px-5 py-2 text-sm font-semibold shadow-[0_4px_14px_rgba(16,185,129,0.25)] hover:-translate-y-0.5 transition-all cursor-pointer"
              >
                <span>Importa Ticket nella Mappa</span>
              </button>
            </div>
            {jsonFeedback && (
              <p
                role={jsonFeedback.type === 'error' ? 'alert' : 'status'}
                className={`text-xs font-semibold ${
                  jsonFeedback.type === 'error' ? 'text-red-600' : 'text-[#047857]'
                }`}
              >
                {jsonFeedback.message}
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
