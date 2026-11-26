import { useRef, useState } from 'react';
import {
  Check,
  Download,
  FolderPlus,
  Pencil,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import type { AIModelTarget, WayfinderProject, WayfinderStore } from '../types/wayfinder';
import { parseImportedStoreJson, serializeStoreForExport } from '../utils/storage';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  store: WayfinderStore;
  onSelectProject: (projectId: string) => void;
  onCreateProject: (name: string, withDemo: boolean) => void;
  onRenameProject: (projectId: string, newName: string) => void;
  onDeleteProject: (projectId: string) => void;
  onImportProjects: (projects: WayfinderProject[], targetAi?: AIModelTarget) => void;
}

export function ProjectModal({
  isOpen,
  onClose,
  store,
  onSelectProject,
  onCreateProject,
  onRenameProject,
  onDeleteProject,
  onImportProjects,
}: ProjectModalProps) {
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    onCreateProject(newName.trim(), false);
    setNewName('');
  }

  function handleSaveRename(projectId: string) {
    if (editingName.trim()) {
      onRenameProject(projectId, editingName.trim());
    }
    setEditingId(null);
  }

  function handleDownloadExport() {
    const json = serializeStoreForExport(store);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wayfinder-studio-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function handleImportRaw(raw: string) {
    setImportError(null);
    setImportSuccess(null);
    const result = parseImportedStoreJson(raw);
    if (!result.ok) {
      setImportError(result.error);
      return;
    }
    onImportProjects(result.projects, result.targetAi);
    setImportText('');
    setImportSuccess(
      `Importati ${result.projects.length} progett${result.projects.length === 1 ? 'o' : 'i'} con successo.`
    );
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        handleImportRaw(reader.result);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="project-modal-title"
    >
      <div className="w-full max-w-2xl max-h-[88vh] flex flex-col rounded-[28px] bg-white border-2 border-[#111111] shadow-[0_20px_50px_rgba(0,0,0,0.25)] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-black/10 bg-[#FAFAFA]">
          <div className="flex items-center gap-2.5">
            <h2 id="project-modal-title" className="text-lg font-bold text-[#111111]">
              Gestione Progetti &amp; Backup JSON
            </h2>
            <span className="font-hand text-xl font-bold text-[#EC4899] -rotate-2 hidden sm:inline">
              backup locale!
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Chiudi gestione progetti"
            className="p-2 rounded-full text-zinc-600 hover:text-[#111111] hover:bg-black/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          {/* Crea nuovo progetto */}
          <form onSubmit={handleCreate} className="space-y-2">
            <label htmlFor="new-project-name" className="block text-xs font-bold text-[#111111]">
              Crea un nuovo progetto
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                id="new-project-name"
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Es. App Gestione Spese, CLI Backup..."
                className="flex-1 rounded-full bg-[#FAFAFA] border-2 border-black/15 px-4 py-2 text-sm text-[#111111] placeholder:text-zinc-400 focus:outline-none focus:border-[#111111]"
              />
              <button
                type="submit"
                disabled={!newName.trim()}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#111111] hover:bg-zinc-800 disabled:opacity-40 text-white px-5 py-2 text-sm font-semibold transition-all whitespace-nowrap shrink-0 cursor-pointer"
              >
                <FolderPlus className="w-4 h-4" aria-hidden="true" />
                Crea Progetto
              </button>
            </div>
          </form>

          {/* Elenco progetti */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-zinc-600">
                Progetti salvati ({store.projects.length})
              </h3>
              <button
                type="button"
                onClick={() => onCreateProject('Clone Locale di Loom (Copia)', true)}
                className="text-xs font-semibold text-[#1E78FF] hover:text-[#1D4ED8] transition-colors cursor-pointer"
              >
                + Ripristina Progetto Demo
              </button>
            </div>

            <div className="divide-y divide-black/10 rounded-2xl border-2 border-black/10 bg-[#FAFAFA] overflow-hidden">
              {store.projects.map((proj) => {
                const isActive = proj.id === store.activeProjectId;
                const isEditing = editingId === proj.id;
                const doneCount = proj.tickets.filter((t) => t.status === 'DONE').length;

                return (
                  <div
                    key={proj.id}
                    className={`flex flex-wrap items-center justify-between gap-3 px-4 py-3 ${
                      isActive ? 'bg-[#EFF6FF]' : 'bg-white'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            aria-label={`Nuovo nome per ${proj.name}`}
                            className="w-full rounded-full bg-white border-2 border-[#111111] px-3 py-1 text-sm text-[#111111] focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveRename(proj.id)}
                            aria-label="Conferma rinomina"
                            className="p-1.5 rounded-full bg-[#10B981] text-white hover:bg-[#059669] cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            aria-label="Annulla rinomina"
                            className="p-1.5 rounded-full bg-zinc-200 text-[#111111] hover:bg-zinc-300 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            onSelectProject(proj.id);
                            onClose();
                          }}
                          className="text-left min-w-0 cursor-pointer group"
                        >
                          <div className="text-sm font-bold text-[#111111] group-hover:text-[#1E78FF] truncate">
                            {proj.name}
                          </div>
                          <div className="text-xs text-zinc-500 tabular-nums">
                            {doneCount}/{proj.tickets.length} ticket completati · {proj.fog.length} fog
                            {isActive ? ' · Attivo' : ''}
                          </div>
                        </button>
                      )}
                    </div>

                    {!isEditing && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        {!isActive && (
                          <button
                            type="button"
                            onClick={() => {
                              onSelectProject(proj.id);
                              onClose();
                            }}
                            className="rounded-full bg-[#111111] hover:bg-zinc-800 px-3 py-1 text-xs font-semibold text-white transition-colors cursor-pointer"
                          >
                            Apri
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(proj.id);
                            setEditingName(proj.name);
                          }}
                          aria-label={`Rinomina ${proj.name}`}
                          className="p-1.5 rounded-full text-zinc-500 hover:text-[#111111] hover:bg-black/5 transition-colors cursor-pointer"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        {store.projects.length > 1 && (
                          <>
                            {confirmDeleteId === proj.id ? (
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    onDeleteProject(proj.id);
                                    setConfirmDeleteId(null);
                                  }}
                                  className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-600 hover:bg-red-500 text-white cursor-pointer"
                                >
                                  Conferma
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteId(null)}
                                  className="px-2 py-1 rounded-full text-xs text-zinc-600 hover:text-[#111111] cursor-pointer"
                                >
                                  No
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(proj.id)}
                                aria-label={`Elimina ${proj.name}`}
                                className="p-1.5 rounded-full text-zinc-500 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Export / Import */}
          <div className="border-t border-black/10 pt-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-[#111111]">
                  Esporta o Importa Stato (JSON)
                </h3>
                <p className="text-xs text-zinc-600">
                  Salva una copia completa di progetti, pilastri e ticket o ripristinala su un altro dispositivo.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadExport}
                  className="inline-flex items-center gap-2 rounded-full bg-white hover:bg-zinc-50 border-2 border-[#111111] px-3.5 py-1.5 text-xs font-semibold text-[#111111] transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" aria-hidden="true" />
                  Esporta JSON
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-2 rounded-full bg-white hover:bg-zinc-50 border-2 border-[#111111] px-3.5 py-1.5 text-xs font-semibold text-[#111111] transition-all cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" aria-hidden="true" />
                  Carica File JSON
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/json,.json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            </div>

            <div className="space-y-2">
              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                rows={3}
                placeholder="Oppure incolla qui il JSON esportato in precedenza..."
                className="w-full rounded-2xl bg-[#FAFAFA] border-2 border-black/10 p-3 text-xs font-mono text-[#111111] placeholder:text-zinc-400 focus:outline-none focus:border-[#111111]"
              />
              {importError && (
                <p className="text-xs font-semibold text-red-600" role="alert">
                  {importError}
                </p>
              )}
              {importSuccess && (
                <p className="text-xs font-semibold text-[#047857]" role="status">
                  {importSuccess}
                </p>
              )}
              <div className="flex justify-end">
                <button
                  type="button"
                  disabled={!importText.trim()}
                  onClick={() => handleImportRaw(importText)}
                  className="rounded-full bg-[#111111] hover:bg-zinc-800 disabled:opacity-40 px-4 py-1.5 text-xs font-semibold text-white transition-all cursor-pointer"
                >
                  Importa da Testo JSON
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
