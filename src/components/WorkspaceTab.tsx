import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  Play,
  Plus,
  RotateCcw,
  ShieldCheck,
  Trash2,
  Wand2,
} from 'lucide-react';
import type {
  AIModelTarget,
  TicketCategory,
  WayfinderProject,
} from '../types/wayfinder';
import {
  completeTicketInProject,
  parseAiSummaryBlock,
  type NewTicketInput,
} from '../utils/mapLogic';
import { AI_MODEL_LINKS, buildTicketSessionPrompt } from '../utils/promptBuilder';
import { CategoryBadge, StatusBadge } from './BadgeTags';
import { CopyButton } from './CopyButton';

interface WorkspaceTabProps {
  project: WayfinderProject;
  targetAi: AIModelTarget;
  onClaimTicket: (ticketId: number) => void;
  onReleaseTicket: (ticketId: number) => void;
  onUpdateProject: (updater: (proj: WayfinderProject) => WayfinderProject) => void;
  onGoToMap: () => void;
}

export function WorkspaceTab({
  project,
  targetAi,
  onClaimTicket,
  onReleaseTicket,
  onUpdateProject,
  onGoToMap,
}: WorkspaceTabProps) {
  const claimedTicket = useMemo(
    () =>
      project.tickets.find((t) => t.id === project.activeTicketId && t.status === 'CLAIMED') ??
      project.tickets.find((t) => t.status === 'CLAIMED') ??
      null,
    [project.tickets, project.activeTicketId]
  );

  const frontierTickets = useMemo(
    () => project.tickets.filter((t) => t.status === 'FRONTIER'),
    [project.tickets]
  );

  const [includeAllDecisions, setIncludeAllDecisions] = useState(false);
  const [summaryInput, setSummaryInput] = useState('');
  const [customDecision, setCustomDecision] = useState('');
  const [pendingNewTickets, setPendingNewTickets] = useState<NewTicketInput[]>([]);
  const [newTicketTitle, setNewTicketTitle] = useState('');
  const [newTicketCategory, setNewTicketCategory] = useState<TicketCategory>('TASK');
  const [pendingNewFogs, setPendingNewFogs] = useState<string[]>([]);
  const [newFogText, setNewFogText] = useState('');
  const [resolvedFogIndices, setResolvedFogIndices] = useState<number[]>([]);
  const [completionBanner, setCompletionBanner] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    setSummaryInput('');
    setCustomDecision('');
    setPendingNewTickets([]);
    setPendingNewFogs([]);
    setResolvedFogIndices([]);
    setValidationError(null);
  }, [claimedTicket?.id]);

  const promptPackage = useMemo(() => {
    if (!claimedTicket) return null;
    return buildTicketSessionPrompt(project, claimedTicket, targetAi, includeAllDecisions);
  }, [project, claimedTicket, targetAi, includeAllDecisions]);

  function handleExtractSummaryHints() {
    if (!summaryInput.trim()) return;
    const hints = parseAiSummaryBlock(summaryInput);
    if (hints.outcome && !customDecision.trim()) {
      setCustomDecision(hints.outcome);
    }
    if (hints.fogs.length > 0) {
      setPendingNewFogs((prev) => Array.from(new Set([...prev, ...hints.fogs])));
    }
    if (hints.ticketTitles.length > 0) {
      setPendingNewTickets((prev) => [
        ...prev,
        ...hints.ticketTitles.map((title) => ({
          title,
          description: `Emerso durante la chiusura del ticket #${claimedTicket?.id}.`,
          category: 'TASK' as TicketCategory,
          dependencies: [],
        })),
      ]);
    }
  }

  function handleAddPendingTicket() {
    if (!newTicketTitle.trim()) return;
    setPendingNewTickets((prev) => [
      ...prev,
      {
        title: newTicketTitle.trim(),
        description: `Emerso durante il ticket #${claimedTicket?.id}.`,
        category: newTicketCategory,
        dependencies: [],
      },
    ]);
    setNewTicketTitle('');
  }

  function handleAddPendingFog() {
    if (!newFogText.trim()) return;
    const trimmed = newFogText.trim();
    if (!pendingNewFogs.includes(trimmed)) {
      setPendingNewFogs((prev) => [...prev, trimmed]);
    }
    setNewFogText('');
  }

  function toggleResolvedFog(index: number) {
    setResolvedFogIndices((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  }

  function handleCompleteTicket(e: React.FormEvent) {
    e.preventDefault();
    if (!claimedTicket) return;

    if (!summaryInput.trim() && !customDecision.trim()) {
      setValidationError(
        'Incolla il riassunto restituito dall’AI o scrivi l’esito ottenuto prima di completare il ticket.'
      );
      return;
    }

    const beforeFrontierIds = new Set(
      project.tickets.filter((t) => t.status === 'FRONTIER').map((t) => t.id)
    );

    const updatedProject = completeTicketInProject(project, claimedTicket.id, {
      summary: summaryInput.trim() || customDecision.trim(),
      decisionToAdd: customDecision.trim() || summaryInput.trim(),
      newTickets: pendingNewTickets,
      newFogs: pendingNewFogs,
      resolvedFogIndices,
    });

    const newlyUnlocked = updatedProject.tickets.filter(
      (t) => t.status === 'FRONTIER' && !beforeFrontierIds.has(t.id)
    );

    onUpdateProject(() => updatedProject);

    const unlockedMsg =
      newlyUnlocked.length > 0
        ? ` ${
            newlyUnlocked.length === 1
              ? 'Sbloccato 1 nuovo ticket'
              : `Sbloccati ${newlyUnlocked.length} nuovi ticket`
          } in Frontier (${newlyUnlocked.map((t) => `#${t.id}`).join(', ')}).`
        : '';

    setCompletionBanner(
      `Ticket #${claimedTicket.id} completato e salvato nelle Decisioni.${unlockedMsg}`
    );
  }

  // Empty state: nessun ticket in CLAIMED
  if (!claimedTicket || !promptPackage) {
    return (
      <div className="space-y-6">
        {completionBanner && (
          <div
            role="status"
            className="rounded-[24px] bg-[#DCFCE7] border-2 border-[#10B981] p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 shadow-[0_8px_22px_rgba(16,185,129,0.15)]"
          >
            <div className="flex items-center gap-2.5 text-sm font-semibold text-[#065F46]">
              <CheckCircle2 className="w-5 h-5 text-[#10B981] shrink-0" aria-hidden="true" />
              <span>{completionBanner}</span>
            </div>
            <button
              type="button"
              onClick={onGoToMap}
              className="rounded-full bg-[#111111] hover:bg-zinc-800 px-4 py-1.5 text-xs font-semibold text-white transition-all cursor-pointer"
            >
              Torna alla Mappa
            </button>
          </div>
        )}

        <div className="rounded-[28px] bg-white border border-black/10 shadow-[0_12px_32px_rgba(0,0,0,0.12)] p-6 sm:p-8 space-y-6">
          <div className="max-w-xl space-y-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#111111]">
              Session Workspace — 1 Ticket = 1 Chat Fresca
            </h1>
            <p className="text-sm text-zinc-600 leading-relaxed">
              Nessun ticket è attualmente in lavorazione (<span className="font-mono font-semibold text-[#BE185D]">CLAIMED</span>). Scegli un ticket pronto dalla <span className="font-mono font-semibold text-[#1D4ED8]">FRONTIER</span> qui sotto per generare il prompt autonomo.
            </p>
          </div>

          {frontierTickets.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-black/15 bg-[#FAFAFA] p-6 text-center space-y-3">
              <p className="text-sm text-zinc-600">
                Non ci sono ticket in Frontier al momento. Controlla la Mappa o crea nuovi ticket.
              </p>
              <button
                type="button"
                onClick={onGoToMap}
                className="inline-flex items-center gap-2 rounded-full bg-[#111111] hover:bg-zinc-800 px-5 py-2 text-sm font-semibold text-white transition-all cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                <span>Vai alla Mappa</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                Ticket pronti in Frontier ({frontierTickets.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {frontierTickets.map((t) => (
                  <div
                    key={t.id}
                    className="rounded-[22px] bg-[#FAFAFA] border-2 border-black/10 p-4 flex flex-col justify-between gap-3 hover:-translate-y-0.5 hover:shadow-md transition-all"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#111111] tabular-nums">
                          #{t.id}
                        </span>
                        <CategoryBadge category={t.category} />
                      </div>
                      <h3 className="text-sm font-bold text-[#111111]">{t.title}</h3>
                      {t.description && (
                        <p className="text-xs text-zinc-600 line-clamp-2">{t.description}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setCompletionBanner(null);
                        onClaimTicket(t.id);
                      }}
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-[#111111] hover:bg-zinc-800 px-4 py-2 text-xs font-semibold text-white transition-all cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Claim &amp; Lavora</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Banner Safe Zone stile Sticker Pop */}
      <div className="rounded-[24px] bg-[#FEF08A] border-2 border-[#111111] shadow-[0_8px_22px_rgba(0,0,0,0.12)] p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-[#111111] text-white flex items-center justify-center shrink-0 mt-0.5">
            <ShieldCheck className="w-5 h-5" aria-hidden="true" />
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-[#111111]">
                Regola Safe Zone: apri una NUOVA chat vuota su {targetAi}
              </h2>
              <span className="font-hand text-xl font-bold text-[#1E78FF] -rotate-2">
                chat nuova!
              </span>
            </div>
            <p className="text-xs text-[#111111]/85 leading-relaxed">
              Non riutilizzare chat vecchie. Questo prompt autocontenuto occupa circa{' '}
              <span className="font-mono font-bold tabular-nums">
                ~{promptPackage.estimatedTokens} token
              </span>{' '}
              ({promptPackage.includedDecisionsCount}/{promptPackage.totalDecisionsCount} decisioni incluse), mantenendo il contesto sotto il 12–15% ed evitando il context rot.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onReleaseTicket(claimedTicket.id)}
          className="inline-flex items-center gap-1.5 rounded-full bg-white hover:bg-zinc-100 border-2 border-[#111111] px-4 py-2 text-xs font-semibold text-[#111111] transition-all whitespace-nowrap shrink-0 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Rilascia in Frontier</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Colonna Sinistra: Prompt Autonomo & Link AI */}
        <div className="lg:col-span-7 space-y-4">
          <section className="rounded-[28px] bg-white border border-black/10 shadow-[0_12px_32px_rgba(0,0,0,0.12)] p-6 space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-bold text-[#111111] tabular-nums">
                    Ticket #{claimedTicket.id}
                  </span>
                  <CategoryBadge category={claimedTicket.category} />
                  <StatusBadge status={claimedTicket.status} />
                </div>
                <h1 className="text-lg sm:text-xl font-bold text-[#111111]">
                  {claimedTicket.title}
                </h1>
              </div>

              <label className="inline-flex items-center gap-2 text-xs font-medium text-zinc-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includeAllDecisions}
                  onChange={(e) => setIncludeAllDecisions(e.target.checked)}
                  className="accent-[#111111]"
                />
                <span>Includi tutte le decisioni</span>
              </label>
            </div>

            {claimedTicket.description && (
              <p className="text-sm text-zinc-700 leading-relaxed">
                {claimedTicket.description}
              </p>
            )}

            {/* Prompt Box stile terminale hardware */}
            <div className="rounded-2xl bg-[#111111] text-zinc-100 p-4 space-y-3 border-2 border-[#111111]">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span>Prompt Autonomo pronto per {targetAi}</span>
                <span className="font-mono tabular-nums text-[#FACC15]">
                  ~{promptPackage.estimatedTokens} token
                </span>
              </div>
              <pre className="text-xs font-mono text-zinc-100 whitespace-pre-wrap break-words max-h-[380px] overflow-y-auto leading-relaxed">
                {promptPackage.prompt}
              </pre>
            </div>

            {/* Azioni Copia & Apri Chat Fresca */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <CopyButton
                text={promptPackage.prompt}
                label={`Copia Prompt per ${targetAi}`}
              />

              <div className="flex flex-wrap items-center gap-2">
                {(['Gemini', 'ChatGPT', 'Claude', 'Grok'] as AIModelTarget[]).map((model) => {
                  const link = AI_MODEL_LINKS[model];
                  const isSelected = model === targetAi;
                  return (
                    <a
                      key={model}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold border-2 transition-all whitespace-nowrap hover:-translate-y-0.5 ${
                        isSelected
                          ? 'bg-white text-[#111111] border-[#111111] shadow-[0_4px_12px_rgba(0,0,0,0.1)]'
                          : 'bg-[#FAFAFA] text-zinc-600 border-black/15 hover:text-[#111111] hover:border-[#111111]'
                      }`}
                    >
                      <span>{model}</span>
                      <ExternalLink className="w-3 h-3 opacity-70" aria-hidden="true" />
                    </a>
                  );
                })}
              </div>
            </div>
          </section>
        </div>

        {/* Colonna Destra: Chiusura Ticket & Aggiornamento Mappa */}
        <div className="lg:col-span-5">
          <form
            onSubmit={handleCompleteTicket}
            className="rounded-[28px] bg-white border border-black/10 shadow-[0_12px_32px_rgba(0,0,0,0.12)] p-6 space-y-4"
          >
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#111111]">
                Chiusura Ticket &amp; Aggiornamento Mappa
              </h2>
              <p className="text-xs text-zinc-600 mt-1">
                Incolla il blocco riassuntivo finale restituito dall’AI per chiudere il ticket, salvare la decisione e sbloccare i ticket dipendenti.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="ai-summary-textarea"
                  className="text-xs font-bold text-[#111111]"
                >
                  Riassunto finale dell’AI
                </label>
                <button
                  type="button"
                  onClick={handleExtractSummaryHints}
                  disabled={!summaryInput.trim()}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#1E78FF] hover:text-[#1D4ED8] disabled:opacity-40 cursor-pointer"
                >
                  <Wand2 className="w-3 h-3" aria-hidden="true" />
                  <span>Estrai suggerimenti</span>
                </button>
              </div>
              <textarea
                id="ai-summary-textarea"
                rows={4}
                value={summaryInput}
                onChange={(e) => {
                  setSummaryInput(e.target.value);
                  setValidationError(null);
                }}
                placeholder="Incolla qui il riassunto compatto (max 10 righe) prodotto dall'AI alla fine della chat..."
                className="w-full rounded-2xl bg-[#FAFAFA] border-2 border-black/10 p-3 text-sm text-[#111111] placeholder:text-zinc-400 focus:outline-none focus:border-[#111111]"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="decision-summary-input"
                className="block text-xs font-bold text-[#111111]"
              >
                Decisione da salvare nella Mappa (opzionale)
              </label>
              <input
                id="decision-summary-input"
                type="text"
                value={customDecision}
                onChange={(e) => {
                  setCustomDecision(e.target.value);
                  setValidationError(null);
                }}
                placeholder="Es. Confermato AudioContext merge + WebM VP9..."
                className="w-full rounded-full bg-[#FAFAFA] border-2 border-black/10 px-4 py-2 text-sm text-[#111111] placeholder:text-zinc-400 focus:outline-none focus:border-[#111111]"
              />
            </div>

            {project.fog.length > 0 && (
              <div className="space-y-1.5 pt-2 border-t border-black/10">
                <span className="block text-xs font-bold text-[#111111]">
                  Fog esistenti risolte in questa sessione
                </span>
                <div className="space-y-1.5 max-h-28 overflow-y-auto">
                  {project.fog.map((fogItem, idx) => (
                    <label
                      key={`${idx}-${fogItem.slice(0, 10)}`}
                      className="flex items-start gap-2 text-xs text-zinc-700 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={resolvedFogIndices.includes(idx)}
                        onChange={() => toggleResolvedFog(idx)}
                        className="mt-0.5 accent-[#10B981]"
                      />
                      <span className="leading-snug">{fogItem}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2 pt-2 border-t border-black/10">
              <span className="block text-xs font-bold text-[#111111]">
                Nuovi Ticket emersi (opzionale)
              </span>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTicketTitle}
                  onChange={(e) => setNewTicketTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddPendingTicket();
                    }
                  }}
                  aria-label="Titolo nuovo ticket emerso"
                  placeholder="Titolo nuovo ticket..."
                  className="flex-1 min-w-0 rounded-full bg-[#FAFAFA] border border-black/15 px-3 py-1.5 text-xs text-[#111111] placeholder:text-zinc-400 focus:outline-none focus:border-[#111111]"
                />
                <select
                  aria-label="Categoria nuovo ticket"
                  value={newTicketCategory}
                  onChange={(e) => setNewTicketCategory(e.target.value as TicketCategory)}
                  className="rounded-full bg-[#FAFAFA] border border-black/15 px-2.5 py-1.5 text-xs font-semibold text-[#111111] focus:outline-none focus:border-[#111111]"
                >
                  <option value="TASK">TASK</option>
                  <option value="RESEARCH">RESEARCH</option>
                  <option value="GRILLING">GRILLING</option>
                  <option value="PROTOTYPE">PROTOTYPE</option>
                </select>
                <button
                  type="button"
                  onClick={handleAddPendingTicket}
                  aria-label="Aggiungi nuovo ticket emerso"
                  className="w-8 h-8 rounded-full bg-[#111111] hover:bg-zinc-800 text-white flex items-center justify-center shrink-0 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
              {pendingNewTickets.length > 0 && (
                <ul className="space-y-1">
                  {pendingNewTickets.map((nt, idx) => (
                    <li
                      key={`${idx}-${nt.title}`}
                      className="flex items-center justify-between gap-2 rounded-full bg-[#F4F4F5] border border-black/10 px-3 py-1 text-xs text-[#111111]"
                    >
                      <span className="truncate">
                        <span className="font-mono font-bold mr-1.5">[{nt.category}]</span>
                        {nt.title}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setPendingNewTickets((prev) => prev.filter((_, i) => i !== idx))
                        }
                        aria-label={`Rimuovi ticket ${nt.title}`}
                        className="text-zinc-500 hover:text-red-600 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="space-y-2 pt-2 border-t border-black/10">
              <span className="block text-xs font-bold text-[#111111]">
                Nuove Fog / Domande aperte emerse (opzionale)
              </span>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newFogText}
                  onChange={(e) => setNewFogText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddPendingFog();
                    }
                  }}
                  aria-label="Nuova fog emersa"
                  placeholder="Nuovo dubbio da chiarire..."
                  className="flex-1 min-w-0 rounded-full bg-[#FAFAFA] border border-black/15 px-3 py-1.5 text-xs text-[#111111] placeholder:text-zinc-400 focus:outline-none focus:border-[#111111]"
                />
                <button
                  type="button"
                  onClick={handleAddPendingFog}
                  aria-label="Aggiungi nuova fog"
                  className="w-8 h-8 rounded-full bg-[#111111] hover:bg-zinc-800 text-white flex items-center justify-center shrink-0 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
              {pendingNewFogs.length > 0 && (
                <ul className="space-y-1">
                  {pendingNewFogs.map((fg, idx) => (
                    <li
                      key={`${idx}-${fg}`}
                      className="flex items-center justify-between gap-2 rounded-full bg-[#FEFCE8] border border-[#EAB308]/40 px-3 py-1 text-xs text-[#854D0E]"
                    >
                      <span className="truncate">{fg}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setPendingNewFogs((prev) => prev.filter((_, i) => i !== idx))
                        }
                        aria-label={`Rimuovi fog ${fg}`}
                        className="text-zinc-500 hover:text-red-600 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {validationError && (
              <p className="text-xs font-semibold text-red-600" role="alert">
                {validationError}
              </p>
            )}

            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-[#10B981] hover:bg-[#059669] border-2 border-[#059669] px-5 py-3 text-sm font-semibold text-white shadow-[0_6px_18px_rgba(16,185,129,0.28)] hover:-translate-y-0.5 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
              <span>Completa Ticket e Aggiorna Decisioni</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
