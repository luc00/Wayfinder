import { useMemo, useState } from 'react';
import {
  LayoutGrid,
  List,
  Lock,
  Pencil,
  Play,
  Plus,
  Search,
} from 'lucide-react';
import type { Ticket, TicketCategory, TicketStatus, WayfinderProject } from '../types/wayfinder';
import { getNextTicketId, recomputeTicketStatuses } from '../utils/mapLogic';
import { CategoryBadge, StatusBadge } from './BadgeTags';
import { TicketEditorModal } from './TicketEditorModal';

interface MapTabProps {
  project: WayfinderProject;
  onClaimTicket: (ticketId: number) => void;
  onUpdateProject: (updater: (proj: WayfinderProject) => WayfinderProject) => void;
  onGoToSetup: () => void;
}

const COLUMNS: { status: TicketStatus; title: string; subtitle: string; dotColor: string }[] = [
  { status: 'FRONTIER', title: 'Frontier', subtitle: 'Pronti da lavorare', dotColor: 'bg-[#0EA5E9]' },
  { status: 'CLAIMED', title: 'Claimed', subtitle: 'Sessione attiva', dotColor: 'bg-[#EC4899]' },
  { status: 'BLOCKED', title: 'Blocked', subtitle: 'In attesa di prerequisiti', dotColor: 'bg-[#A1A1AA]' },
  { status: 'DONE', title: 'Done', subtitle: 'Completati', dotColor: 'bg-[#10B981]' },
];

const CATEGORY_FILTERS: ('ALL' | TicketCategory)[] = [
  'ALL',
  'RESEARCH',
  'GRILLING',
  'PROTOTYPE',
  'TASK',
];

export function MapTab({
  project,
  onClaimTicket,
  onUpdateProject,
  onGoToSetup,
}: MapTabProps) {
  const [viewMode, setViewMode] = useState<'columns' | 'list'>('columns');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | TicketCategory>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | TicketStatus>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [editorState, setEditorState] = useState<{
    open: boolean;
    ticket: Ticket | null;
  }>({ open: false, ticket: null });

  const ticketMap = useMemo(() => {
    const map = new Map<number, Ticket>();
    for (const t of project.tickets) map.set(t.id, t);
    return map;
  }, [project.tickets]);

  const filteredTickets = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return project.tickets.filter((t) => {
      if (categoryFilter !== 'ALL' && t.category !== categoryFilter) return false;
      if (viewMode === 'list' && statusFilter !== 'ALL' && t.status !== statusFilter) {
        return false;
      }
      if (q) {
        const hay = `#${t.id} ${t.title} ${t.description} ${t.output}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [project.tickets, categoryFilter, statusFilter, viewMode, searchQuery]);

  function handleSaveTicket(data: {
    title: string;
    description: string;
    category: TicketCategory;
    dependencies: number[];
    output: string;
  }) {
    onUpdateProject((prev) => {
      if (editorState.ticket) {
        const updated = prev.tickets.map((t) =>
          t.id === editorState.ticket!.id
            ? {
                ...t,
                title: data.title,
                description: data.description,
                category: data.category,
                dependencies: data.dependencies,
                output: data.output,
              }
            : t
        );
        return {
          ...prev,
          tickets: recomputeTicketStatuses(updated),
          updatedAt: new Date().toISOString(),
        };
      }

      const newTicket: Ticket = {
        id: getNextTicketId(prev.tickets),
        title: data.title,
        description: data.description,
        category: data.category,
        status: data.dependencies.length > 0 ? 'BLOCKED' : 'FRONTIER',
        dependencies: data.dependencies,
        output: data.output,
        createdAt: new Date().toISOString(),
      };
      return {
        ...prev,
        tickets: recomputeTicketStatuses([...prev.tickets, newTicket]),
        updatedAt: new Date().toISOString(),
      };
    });
  }

  function handleDeleteTicket(ticketId: number) {
    onUpdateProject((prev) => {
      const remaining = prev.tickets
        .filter((t) => t.id !== ticketId)
        .map((t) => ({
          ...t,
          dependencies: t.dependencies.filter((d) => d !== ticketId),
        }));
      return {
        ...prev,
        tickets: recomputeTicketStatuses(remaining),
        activeTicketId: prev.activeTicketId === ticketId ? null : prev.activeTicketId,
        updatedAt: new Date().toISOString(),
      };
    });
  }

  function renderTicketCard(ticket: Ticket) {
    const depLabels = ticket.dependencies.map((depId) => {
      const dep = ticketMap.get(depId);
      return {
        id: depId,
        done: dep?.status === 'DONE',
      };
    });

    return (
      <article
        key={ticket.id}
        className="rounded-[22px] bg-white border-2 border-black/10 shadow-[0_6px_18px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(0,0,0,0.12)] transition-all p-4 flex flex-col gap-3"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-mono text-xs font-bold text-[#111111] tabular-nums">
              #{ticket.id}
            </span>
            <CategoryBadge category={ticket.category} />
            {viewMode === 'list' && <StatusBadge status={ticket.status} />}
          </div>
          <button
            type="button"
            onClick={() => setEditorState({ open: true, ticket })}
            aria-label={`Modifica ticket #${ticket.id} ${ticket.title}`}
            className="p-1.5 rounded-full text-zinc-500 hover:text-[#111111] hover:bg-zinc-100 transition-colors shrink-0 cursor-pointer"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-1.5">
          <h3 className="text-sm font-bold text-[#111111] leading-snug">
            {ticket.title}
          </h3>
          {ticket.description && (
            <p className="text-xs text-zinc-600 leading-relaxed line-clamp-3">
              {ticket.description}
            </p>
          )}
        </div>

        {depLabels.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono text-zinc-600">
            <Lock className="w-3 h-3 text-zinc-500 shrink-0" aria-hidden="true" />
            <span>Richiede:</span>
            {depLabels.map((dep) => (
              <span
                key={dep.id}
                className={
                  dep.done
                    ? 'text-[#059669] line-through font-semibold'
                    : 'text-[#B45309] font-bold'
                }
              >
                #{dep.id}
              </span>
            ))}
          </div>
        )}

        {ticket.output && (
          <div className="rounded-2xl bg-[#ECFDF5] border border-[#10B981]/30 px-3 py-2 text-xs text-[#065F46] leading-relaxed">
            <span className="text-[11px] font-bold block mb-0.5">
              Output salvato
            </span>
            <p className="line-clamp-3">{ticket.output}</p>
          </div>
        )}

        {(ticket.status === 'FRONTIER' || ticket.status === 'CLAIMED') && (
          <div className="pt-1">
            <button
              type="button"
              onClick={() => onClaimTicket(ticket.id)}
              className={`w-full inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-xs font-semibold shadow-[0_4px_12px_rgba(0,0,0,0.14)] hover:-translate-y-0.5 transition-all cursor-pointer ${
                ticket.status === 'CLAIMED'
                  ? 'bg-[#EC4899] hover:bg-[#DB2777] text-white'
                  : 'bg-[#111111] hover:bg-zinc-800 text-white'
              }`}
            >
              <Play className="w-3.5 h-3.5" aria-hidden="true" />
              <span>
                {ticket.status === 'CLAIMED' ? 'Apri Sessione Attiva' : 'Claim & Lavora'}
              </span>
            </button>
          </div>
        )}
      </article>
    );
  }

  return (
    <div className="space-y-6">
      {/* Intestazione della Mappa */}
      <div className="rounded-[28px] bg-white border border-black/10 shadow-[0_12px_32px_rgba(0,0,0,0.12)] p-6 sm:p-7 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#111111]">
              La Mappa &amp; Frontiera di Esecuzione
            </h1>
            <span className="font-hand text-xl font-bold text-[#1E78FF] -rotate-2 hidden sm:inline">
              scegli 1 ticket!
            </span>
          </div>
          <p className="text-sm text-zinc-600">
            Seleziona un ticket in <span className="font-mono font-semibold text-[#1D4ED8]">FRONTIER</span> per avviare una chat fresca dedicata senza context rot.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setEditorState({ open: true, ticket: null })}
          className="inline-flex items-center gap-2 rounded-full bg-[#111111] hover:bg-zinc-800 text-white px-5 py-2.5 text-sm font-semibold shadow-[0_6px_16px_rgba(0,0,0,0.18)] hover:-translate-y-0.5 transition-all whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          <span>Nuovo Ticket</span>
        </button>
      </div>

      {/* Filtri & Toggle Vista */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[24px] bg-white border border-black/10 shadow-[0_8px_22px_rgba(0,0,0,0.08)] p-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap items-center gap-1 p-1 rounded-full bg-[#F4F4F5] border border-black/10">
            {CATEGORY_FILTERS.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  categoryFilter === cat
                    ? 'bg-[#111111] text-white shadow-sm'
                    : 'text-zinc-600 hover:text-[#111111]'
                }`}
              >
                {cat === 'ALL' ? 'Tutte' : cat}
              </button>
            ))}
          </div>

          {viewMode === 'list' && (
            <select
              aria-label="Filtra per stato"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'ALL' | TicketStatus)}
              className="rounded-full bg-[#F4F4F5] border border-black/15 px-3 py-1.5 text-xs font-semibold text-[#111111] focus:outline-none focus:border-[#111111]"
            >
              <option value="ALL">Tutti gli stati</option>
              <option value="FRONTIER">FRONTIER</option>
              <option value="CLAIMED">CLAIMED</option>
              <option value="BLOCKED">BLOCKED</option>
              <option value="DONE">DONE</option>
            </select>
          )}
        </div>

        <div className="flex items-center gap-2 flex-1 sm:flex-initial justify-end">
          <div className="relative flex-1 sm:w-56">
            <Search
              className="w-3.5 h-3.5 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Cerca ticket nella mappa"
              placeholder="Cerca ticket..."
              className="w-full rounded-full bg-[#FAFAFA] border border-black/15 pl-9 pr-3.5 py-1.5 text-xs text-[#111111] placeholder:text-zinc-400 focus:outline-none focus:border-[#111111]"
            />
          </div>

          <div
            className="flex items-center p-1 rounded-full bg-[#F4F4F5] border border-black/10 shrink-0"
            role="group"
            aria-label="Modalità visualizzazione mappa"
          >
            <button
              type="button"
              onClick={() => setViewMode('columns')}
              aria-pressed={viewMode === 'columns'}
              aria-label="Vista a colonne"
              className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                viewMode === 'columns'
                  ? 'bg-[#111111] text-white'
                  : 'text-zinc-500 hover:text-[#111111]'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              aria-pressed={viewMode === 'list'}
              aria-label="Vista a lista"
              className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-[#111111] text-white'
                  : 'text-zinc-500 hover:text-[#111111]'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Contenuto Board o Empty State */}
      {project.tickets.length === 0 ? (
        <div className="rounded-[28px] bg-white border-2 border-dashed border-black/15 shadow-[0_12px_32px_rgba(0,0,0,0.08)] p-10 text-center space-y-4">
          <h2 className="text-lg font-bold text-[#111111]">
            La Mappa di questo progetto è ancora vuota
          </h2>
          <p className="text-sm text-zinc-600 max-w-md mx-auto">
            Inizia in Grilling &amp; Setup per generare i ticket automaticamente con l’AI oppure crea manualmente il primo ticket.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={onGoToSetup}
              className="rounded-full bg-white hover:bg-zinc-50 border-2 border-[#111111] px-5 py-2 text-sm font-semibold text-[#111111] transition-all cursor-pointer"
            >
              Vai a Grilling &amp; Setup
            </button>
            <button
              type="button"
              onClick={() => setEditorState({ open: true, ticket: null })}
              className="rounded-full bg-[#111111] hover:bg-zinc-800 px-5 py-2 text-sm font-semibold text-white transition-all cursor-pointer"
            >
              Crea Primo Ticket
            </button>
          </div>
        </div>
      ) : viewMode === 'columns' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
          {COLUMNS.map((col) => {
            const colTickets = filteredTickets.filter((t) => t.status === col.status);
            return (
              <section
                key={col.status}
                aria-label={`Colonna ${col.title}`}
                className="rounded-[28px] bg-white/90 backdrop-blur border border-black/10 shadow-[0_10px_28px_rgba(0,0,0,0.09)] p-4 space-y-3 min-h-[240px]"
              >
                <div className="flex items-center justify-between px-1 pb-2.5 border-b border-black/10">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${col.dotColor}`} aria-hidden="true" />
                    <div>
                      <h2 className="text-sm font-bold text-[#111111]">{col.title}</h2>
                      <p className="text-[11px] text-zinc-500">{col.subtitle}</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-[#F4F4F5] border border-black/10 px-2.5 py-0.5 font-mono text-xs font-bold text-[#111111] tabular-nums">
                    {colTickets.length}
                  </span>
                </div>

                {colTickets.length === 0 ? (
                  <p className="text-xs text-zinc-500 text-center py-8">
                    Nessun ticket in {col.title}
                  </p>
                ) : (
                  <div className="space-y-3">{colTickets.map(renderTicketCard)}</div>
                )}
              </section>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTickets.length === 0 ? (
            <p className="col-span-full text-sm text-zinc-600 text-center py-8 rounded-[28px] bg-white border border-black/10">
              Nessun ticket corrisponde ai filtri selezionati.
            </p>
          ) : (
            filteredTickets.map(renderTicketCard)
          )}
        </div>
      )}

      {editorState.open && (
        <TicketEditorModal
          isOpen={editorState.open}
          ticket={editorState.ticket}
          existingTickets={project.tickets}
          onClose={() => setEditorState({ open: false, ticket: null })}
          onSave={handleSaveTicket}
          onDelete={handleDeleteTicket}
        />
      )}
    </div>
  );
}
