import { useState } from 'react';
import { Trash2, X } from 'lucide-react';
import type { Ticket, TicketCategory, TicketStatus } from '../types/wayfinder';

interface TicketEditorModalProps {
  isOpen: boolean;
  ticket: Ticket | null;
  existingTickets: Ticket[];
  onClose: () => void;
  onSave: (data: {
    title: string;
    description: string;
    category: TicketCategory;
    dependencies: number[];
    output: string;
    status?: TicketStatus;
  }) => void;
  onDelete?: (ticketId: number) => void;
}

const CATEGORIES: TicketCategory[] = ['RESEARCH', 'GRILLING', 'PROTOTYPE', 'TASK'];

export function TicketEditorModal({
  isOpen,
  ticket,
  existingTickets,
  onClose,
  onSave,
  onDelete,
}: TicketEditorModalProps) {
  const [title, setTitle] = useState(ticket?.title ?? '');
  const [description, setDescription] = useState(ticket?.description ?? '');
  const [category, setCategory] = useState<TicketCategory>(ticket?.category ?? 'TASK');
  const [dependencies, setDependencies] = useState<number[]>(ticket?.dependencies ?? []);
  const [output, setOutput] = useState(ticket?.output ?? '');
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!isOpen) return null;

  const availableDeps = existingTickets.filter((t) => (ticket ? t.id !== ticket.id : true));

  function toggleDep(depId: number) {
    setDependencies((prev) =>
      prev.includes(depId) ? prev.filter((id) => id !== depId) : [...prev, depId]
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError('Il titolo del ticket è obbligatorio.');
      return;
    }
    onSave({
      title: title.trim(),
      description: description.trim(),
      category,
      dependencies,
      output: output.trim(),
    });
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ticket-editor-title"
    >
      <div className="w-full max-w-xl max-h-[90vh] flex flex-col rounded-[28px] bg-white border-2 border-[#111111] shadow-[0_20px_50px_rgba(0,0,0,0.25)] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-black/10 bg-[#FAFAFA]">
          <h2 id="ticket-editor-title" className="text-lg font-bold text-[#111111]">
            {ticket ? `Modifica Ticket #${ticket.id}` : 'Nuovo Ticket sulla Mappa'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Chiudi editor ticket"
            className="p-2 rounded-full text-zinc-600 hover:text-[#111111] hover:bg-black/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="ticket-title" className="block text-xs font-bold text-[#111111]">
              Titolo del Ticket
            </label>
            <input
              id="ticket-title"
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setError(null);
              }}
              placeholder="Es. Prototipo MediaRecorder + overlay webcam"
              className="w-full rounded-full bg-[#FAFAFA] border-2 border-black/15 px-4 py-2 text-sm text-[#111111] placeholder:text-zinc-400 focus:outline-none focus:border-[#111111]"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="ticket-category" className="block text-xs font-bold text-[#111111]">
              Categoria
            </label>
            <select
              id="ticket-category"
              value={category}
              onChange={(e) => setCategory(e.target.value as TicketCategory)}
              className="w-full rounded-full bg-[#FAFAFA] border-2 border-black/15 px-4 py-2 text-sm font-semibold text-[#111111] focus:outline-none focus:border-[#111111]"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="ticket-description" className="block text-xs font-bold text-[#111111]">
              Descrizione breve &amp; Criterio di completamento
            </label>
            <textarea
              id="ticket-description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Cosa deve produrre questo ticket in una singola sessione?"
              className="w-full rounded-2xl bg-[#FAFAFA] border-2 border-black/15 p-3 text-sm text-[#111111] placeholder:text-zinc-400 focus:outline-none focus:border-[#111111]"
            />
          </div>

          {availableDeps.length > 0 && (
            <div className="space-y-1.5">
              <span className="block text-xs font-bold text-[#111111]">
                Dipendenze (seleziona i ticket prerequisiti)
              </span>
              <div className="max-h-32 overflow-y-auto rounded-2xl bg-[#FAFAFA] border-2 border-black/10 p-2 space-y-1">
                {availableDeps.map((dep) => {
                  const checked = dependencies.includes(dep.id);
                  return (
                    <label
                      key={dep.id}
                      className="flex items-center gap-2 px-2.5 py-1 rounded-xl hover:bg-black/5 text-xs text-[#111111] cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleDep(dep.id)}
                        className="accent-[#111111]"
                      />
                      <span className="font-mono font-bold text-zinc-500">#{dep.id}</span>
                      <span className="truncate">{dep.title}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {ticket && (
            <div className="space-y-1.5">
              <label htmlFor="ticket-output" className="block text-xs font-bold text-[#111111]">
                Output / Risultato salvato
              </label>
              <textarea
                id="ticket-output"
                rows={3}
                value={output}
                onChange={(e) => setOutput(e.target.value)}
                placeholder="Riassunto o esito prodotto dall'AI..."
                className="w-full rounded-2xl bg-[#FAFAFA] border-2 border-black/15 p-3 text-sm text-[#111111] placeholder:text-zinc-400 focus:outline-none focus:border-[#111111]"
              />
            </div>
          )}

          {error && (
            <p className="text-xs font-semibold text-red-600" role="alert">
              {error}
            </p>
          )}

          <div className="pt-3 border-t border-black/10 flex flex-wrap items-center justify-between gap-3">
            <div>
              {ticket && onDelete && (
                <>
                  {confirmDelete ? (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          onDelete(ticket.id);
                          onClose();
                        }}
                        className="px-3.5 py-1.5 rounded-full bg-red-600 hover:bg-red-500 text-white text-xs font-semibold cursor-pointer"
                      >
                        Conferma Elimina
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(false)}
                        className="px-2.5 py-1.5 text-xs text-zinc-600 hover:text-[#111111] cursor-pointer"
                      >
                        Annulla
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Elimina</span>
                    </button>
                  )}
                </>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-full bg-white hover:bg-zinc-50 border-2 border-black/20 px-4 py-2 text-[#111111] text-sm font-semibold transition-all cursor-pointer"
              >
                Annulla
              </button>
              <button
                type="submit"
                className="rounded-full bg-[#111111] hover:bg-zinc-800 px-5 py-2 text-white text-sm font-semibold shadow-[0_4px_12px_rgba(0,0,0,0.16)] transition-all cursor-pointer"
              >
                {ticket ? 'Salva Modifiche' : 'Crea Ticket'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
