import { BookOpen, FolderKanban } from 'lucide-react';
import type { AIModelTarget, MainTab, SafeZoneStats, WayfinderProject } from '../types/wayfinder';

interface HeaderProps {
  projects: WayfinderProject[];
  activeProject: WayfinderProject;
  targetAi: AIModelTarget;
  activeTab: MainTab;
  stats: SafeZoneStats;
  onSelectProject: (projectId: string) => void;
  onOpenProjectModal: () => void;
  onChangeTargetAi: (ai: AIModelTarget) => void;
  onChangeTab: (tab: MainTab) => void;
  onOpenGuide: () => void;
}

const AI_MODELS: AIModelTarget[] = ['Gemini', 'ChatGPT', 'Claude', 'Grok'];

export function Header({
  projects,
  activeProject,
  targetAi,
  activeTab,
  stats,
  onSelectProject,
  onOpenProjectModal,
  onChangeTargetAi,
  onChangeTab,
  onOpenGuide,
}: HeaderProps) {
  const claimedTicket = activeProject.tickets.find((t) => t.status === 'CLAIMED');
  const totalSegments = Math.max(stats.totalTickets, 5);
  const filledSegments =
    stats.totalTickets === 0
      ? 0
      : Math.round((stats.doneTickets / stats.totalTickets) * totalSegments);

  return (
    <header className="relative z-20 pt-4 sm:pt-5 pb-2">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 space-y-4">
        {/* Riga superiore: Pillole bianche flottanti sul cielo azzurro */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Gruppo sinistro: Brand + Selettore Progetto */}
          <div className="flex flex-wrap items-center gap-2.5 min-w-0 max-w-full">
            <button
              type="button"
              onClick={() => onChangeTab('home')}
              className="inline-flex items-center gap-2 rounded-full bg-white text-[#111111] border border-black/10 pl-1.5 pr-3.5 py-1.5 text-xs sm:text-sm font-bold tracking-tight shadow-[0_4px_14px_rgba(0,0,0,0.12)] hover:-translate-y-0.5 hover:shadow-lg transition-all whitespace-nowrap shrink-0 max-w-full cursor-pointer"
            >
              <span className="w-9 h-6 rounded-full bg-black overflow-hidden flex items-center justify-center shrink-0 border border-black/15">
                <img
                  src="/assets/aistudio/download_077fdd56.jpg"
                  alt=""
                  className="w-full h-full object-cover object-center"
                />
              </span>
              <span className="truncate">LLM-Attention-Degradation-Helper</span>
            </button>

            <div className="inline-flex items-center gap-1.5 rounded-full bg-white border border-black/10 pl-3 pr-1.5 py-1 shadow-[0_4px_14px_rgba(0,0,0,0.12)] min-w-0 max-w-full">
              <label htmlFor="active-project-select" className="sr-only">
                Seleziona progetto attivo
              </label>
              <select
                id="active-project-select"
                value={activeProject.id}
                onChange={(e) => onSelectProject(e.target.value)}
                className="max-w-[160px] sm:max-w-[200px] truncate bg-transparent text-xs sm:text-sm font-semibold text-[#111111] focus:outline-none cursor-pointer py-1"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={onOpenProjectModal}
                aria-label="Gestisci progetti ed esporta o importa JSON"
                className="inline-flex items-center gap-1 rounded-full bg-[#F4F4F5] hover:bg-[#111111] hover:text-white text-[#111111] px-2.5 py-1 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <FolderKanban className="w-3.5 h-3.5" aria-hidden="true" />
                <span>JSON</span>
              </button>
            </div>
          </div>

          {/* Gruppo destro: Widget Safe Zone hardware/sticker + AI Target + Guida */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Widget Pillola Safe Zone stile hardware/sticker */}
            <div
              className="inline-flex items-center gap-2 rounded-full bg-white border border-black/10 px-3 py-1.5 shadow-[0_4px_14px_rgba(0,0,0,0.12)]"
              title="Avanzamento mappa e livello di incertezza (Fog)"
            >
              <span className="font-hand text-base font-bold text-[#1E78FF] leading-none">
                Safe Zone!
              </span>
              <div className="hidden sm:flex items-center gap-0.5" aria-hidden="true">
                {Array.from({ length: Math.min(totalSegments, 8) }).map((_, idx) => (
                  <span
                    key={idx}
                    className={`w-2 h-3 rounded-[3px] border border-black/15 ${
                      idx < filledSegments ? 'bg-[#10B981]' : 'bg-[#F4F4F5]'
                    }`}
                  />
                ))}
              </div>
              <span className="font-mono text-xs font-bold text-[#111111] tabular-nums">
                {stats.doneTickets}/{stats.totalTickets}
              </span>
              <span className="text-black/20" aria-hidden="true">
                |
              </span>
              <span
                className={`font-mono text-xs font-semibold tabular-nums ${
                  stats.fogCount > 3 ? 'text-[#D97706]' : 'text-zinc-600'
                }`}
              >
                Fog {stats.fogCount}
              </span>
            </div>

            {/* Selettore AI a pillola */}
            <div
              className="inline-flex items-center rounded-full bg-white border border-black/10 p-1 shadow-[0_4px_14px_rgba(0,0,0,0.12)]"
              role="group"
              aria-label="Modello AI target"
            >
              {AI_MODELS.map((model) => {
                const active = targetAi === model;
                return (
                  <button
                    key={model}
                    type="button"
                    onClick={() => onChangeTargetAi(model)}
                    aria-pressed={active}
                    className={`px-2.5 sm:px-3 py-1 rounded-full text-xs font-semibold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                      active
                        ? 'bg-[#111111] text-white shadow-sm'
                        : 'text-[#111111]/70 hover:text-[#111111]'
                    }`}
                  >
                    {model}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={onOpenGuide}
              className="inline-flex items-center gap-1.5 rounded-full bg-white text-[#111111] border border-black/10 px-3.5 py-2 text-xs font-semibold shadow-[0_4px_14px_rgba(0,0,0,0.12)] hover:-translate-y-0.5 hover:shadow-lg transition-all whitespace-nowrap shrink-0 cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5 text-[#1E78FF]" aria-hidden="true" />
              <span>Guida</span>
            </button>
          </div>
        </div>

        {/* Dock flottante Tab Navigation stile "Everything amo" */}
        <div className="flex justify-center">
          <nav
            className="inline-flex items-center gap-0.5 sm:gap-1 rounded-full bg-white/95 backdrop-blur border border-black/10 p-1 sm:p-1.5 shadow-[0_8px_24px_rgba(0,0,0,0.14)] overflow-x-auto max-w-full"
            role="tablist"
            aria-label="Sezioni LLM-Attention-Degradation-Helper"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'home'}
              onClick={() => onChangeTab('home')}
              className={`px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'home'
                  ? 'bg-[#111111] text-white shadow-sm'
                  : 'text-[#111111]/75 hover:text-[#111111] hover:bg-black/5'
              }`}
            >
              Home
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'setup'}
              onClick={() => onChangeTab('setup')}
              className={`px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'setup'
                  ? 'bg-[#111111] text-white shadow-sm'
                  : 'text-[#111111]/75 hover:text-[#111111] hover:bg-black/5'
              }`}
            >
              <span className="sm:hidden">1. Setup</span>
              <span className="hidden sm:inline">1. Grilling &amp; Setup</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'map'}
              onClick={() => onChangeTab('map')}
              className={`px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'map'
                  ? 'bg-[#111111] text-white shadow-sm'
                  : 'text-[#111111]/75 hover:text-[#111111] hover:bg-black/5'
              }`}
            >
              <span className="sm:hidden">2. Mappa</span>
              <span className="hidden sm:inline">2. La Mappa</span>
              <span
                className={`ml-1.5 font-mono text-[11px] tabular-nums ${
                  activeTab === 'map' ? 'text-[#7DD3FC]' : 'text-[#0284C7]'
                }`}
              >
                {stats.frontierTickets}
              </span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'workspace'}
              onClick={() => onChangeTab('workspace')}
              className={`px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'workspace'
                  ? 'bg-[#111111] text-white shadow-sm'
                  : 'text-[#111111]/75 hover:text-[#111111] hover:bg-black/5'
              }`}
            >
              <span className="sm:hidden">3. Sessione</span>
              <span className="hidden sm:inline">3. Session Workspace</span>
              {claimedTicket ? (
                <span
                  className={`ml-1.5 font-mono text-[11px] tabular-nums ${
                    activeTab === 'workspace' ? 'text-[#FDE047]' : 'text-[#BE185D]'
                  }`}
                >
                  #{claimedTicket.id}
                </span>
              ) : null}
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
}
