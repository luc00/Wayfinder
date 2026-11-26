import { createDemoProject } from '../data/demoProject';
import type { AIModelTarget, MainTab, WayfinderProject, WayfinderStore } from '../types/wayfinder';
import { recomputeTicketStatuses } from './mapLogic';

export const STORAGE_KEY = 'wayfinder-studio-store-v1';

const VALID_MODELS: AIModelTarget[] = ['Gemini', 'ChatGPT', 'Claude', 'Grok'];
const VALID_TABS: MainTab[] = ['home', 'setup', 'map', 'workspace'];

export function createInitialStore(): WayfinderStore {
  const demo = createDemoProject();
  return {
    projects: [demo],
    activeProjectId: demo.id,
    targetAi: 'Gemini',
    activeTab: 'home',
  };
}

export function loadStoreFromStorage(): WayfinderStore {
  if (typeof window === 'undefined' || !window.localStorage) {
    return createInitialStore();
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return createInitialStore();

    const parsed = JSON.parse(raw) as Partial<WayfinderStore>;
    if (!Array.isArray(parsed.projects) || parsed.projects.length === 0) {
      return createInitialStore();
    }

    const sanitizedProjects = parsed.projects.map((p) => ({
      ...p,
      decisions: Array.isArray(p.decisions) ? p.decisions : [],
      fog: Array.isArray(p.fog) ? p.fog : [],
      outOfScope: Array.isArray(p.outOfScope) ? p.outOfScope : [],
      tickets: Array.isArray(p.tickets) ? recomputeTicketStatuses(p.tickets) : [],
      activeTicketId: typeof p.activeTicketId === 'number' ? p.activeTicketId : null,
    }));

    const activeExists = sanitizedProjects.some((p) => p.id === parsed.activeProjectId);

    return {
      projects: sanitizedProjects,
      activeProjectId: activeExists ? (parsed.activeProjectId as string) : sanitizedProjects[0].id,
      targetAi: VALID_MODELS.includes(parsed.targetAi as AIModelTarget)
        ? (parsed.targetAi as AIModelTarget)
        : 'Gemini',
      activeTab: VALID_TABS.includes(parsed.activeTab as MainTab)
        ? (parsed.activeTab as MainTab)
        : 'home',
    };
  } catch {
    return createInitialStore();
  }
}

export function saveStoreToStorage(store: WayfinderStore): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // Ignore storage quota issues silently
  }
}

export function serializeStoreForExport(store: WayfinderStore): string {
  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      version: 1,
      store,
    },
    null,
    2
  );
}

export function parseImportedStoreJson(
  rawJson: string
): { ok: true; projects: WayfinderProject[]; targetAi?: AIModelTarget } | { ok: false; error: string } {
  try {
    const parsed = JSON.parse(rawJson.trim()) as Record<string, unknown>;
    const candidateStore =
      typeof parsed.store === 'object' && parsed.store !== null
        ? (parsed.store as Record<string, unknown>)
        : parsed;

    // Support importing either a full store or a single project object
    if (Array.isArray(candidateStore.projects) && candidateStore.projects.length > 0) {
      const projects = (candidateStore.projects as WayfinderProject[]).map((p) => ({
        ...p,
        id: p.id || `imp-${Date.now().toString(36)}`,
        name: p.name || 'Progetto Importato',
        decisions: Array.isArray(p.decisions) ? p.decisions : [],
        fog: Array.isArray(p.fog) ? p.fog : [],
        outOfScope: Array.isArray(p.outOfScope) ? p.outOfScope : [],
        tickets: Array.isArray(p.tickets) ? recomputeTicketStatuses(p.tickets) : [],
        activeTicketId: typeof p.activeTicketId === 'number' ? p.activeTicketId : null,
        updatedAt: p.updatedAt || new Date().toISOString(),
      }));
      const targetAi = VALID_MODELS.includes(candidateStore.targetAi as AIModelTarget)
        ? (candidateStore.targetAi as AIModelTarget)
        : undefined;
      return { ok: true, projects, targetAi };
    }

    if (typeof candidateStore.name === 'string' && Array.isArray(candidateStore.tickets)) {
      const single = candidateStore as unknown as WayfinderProject;
      return {
        ok: true,
        projects: [
          {
            ...single,
            id: single.id || `imp-${Date.now().toString(36)}`,
            decisions: Array.isArray(single.decisions) ? single.decisions : [],
            fog: Array.isArray(single.fog) ? single.fog : [],
            outOfScope: Array.isArray(single.outOfScope) ? single.outOfScope : [],
            tickets: recomputeTicketStatuses(single.tickets),
            activeTicketId: typeof single.activeTicketId === 'number' ? single.activeTicketId : null,
            updatedAt: single.updatedAt || new Date().toISOString(),
          },
        ],
      };
    }

    return {
      ok: false,
      error: 'Formato JSON non riconosciuto. Esporta prima un backup valido da LLM-Attention-Degradation-Helper.',
    };
  } catch {
    return {
      ok: false,
      error: 'Il file o testo JSON contiene errori di sintassi.',
    };
  }
}
