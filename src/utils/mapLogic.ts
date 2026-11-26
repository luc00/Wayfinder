import type {
  SafeZoneStats,
  Ticket,
  TicketCategory,
  TicketStatus,
  WayfinderProject,
} from '../types/wayfinder';

const VALID_CATEGORIES: TicketCategory[] = ['RESEARCH', 'GRILLING', 'PROTOTYPE', 'TASK'];

export function recomputeTicketStatuses(tickets: Ticket[]): Ticket[] {
  const statusMap = new Map<number, TicketStatus>();
  for (const t of tickets) {
    statusMap.set(t.id, t.status);
  }

  return tickets.map((ticket) => {
    if (ticket.status === 'DONE' || ticket.status === 'CLAIMED') {
      return ticket;
    }

    const validDeps = ticket.dependencies.filter((depId) => statusMap.has(depId) && depId !== ticket.id);
    const hasPendingDependency = validDeps.some((depId) => statusMap.get(depId) !== 'DONE');

    const nextStatus: TicketStatus = hasPendingDependency ? 'BLOCKED' : 'FRONTIER';
    if (nextStatus === ticket.status && validDeps.length === ticket.dependencies.length) {
      return ticket;
    }
    return {
      ...ticket,
      dependencies: validDeps,
      status: nextStatus,
    };
  });
}

export function claimTicketInProject(
  project: WayfinderProject,
  ticketId: number
): WayfinderProject {
  const target = project.tickets.find((t) => t.id === ticketId);
  if (!target || target.status === 'DONE' || target.status === 'BLOCKED') {
    return project;
  }

  const updatedTickets = project.tickets.map((t) => {
    if (t.id === ticketId) {
      return { ...t, status: 'CLAIMED' as const };
    }
    // Release any previously claimed ticket back to FRONTIER so 1 ticket = 1 fresh session
    if (t.status === 'CLAIMED') {
      return { ...t, status: 'FRONTIER' as const };
    }
    return t;
  });

  return {
    ...project,
    tickets: recomputeTicketStatuses(updatedTickets),
    activeTicketId: ticketId,
    updatedAt: new Date().toISOString(),
  };
}

export function releaseTicketInProject(
  project: WayfinderProject,
  ticketId: number
): WayfinderProject {
  const updatedTickets = project.tickets.map((t) =>
    t.id === ticketId && t.status === 'CLAIMED'
      ? { ...t, status: 'FRONTIER' as const }
      : t
  );

  return {
    ...project,
    tickets: recomputeTicketStatuses(updatedTickets),
    activeTicketId: project.activeTicketId === ticketId ? null : project.activeTicketId,
    updatedAt: new Date().toISOString(),
  };
}

export interface NewTicketInput {
  title: string;
  description: string;
  category: TicketCategory;
  dependencies?: number[];
}

export function getNextTicketId(tickets: Ticket[]): number {
  if (tickets.length === 0) return 1;
  return Math.max(...tickets.map((t) => t.id)) + 1;
}

export function completeTicketInProject(
  project: WayfinderProject,
  ticketId: number,
  options: {
    summary: string;
    decisionToAdd?: string;
    newTickets?: NewTicketInput[];
    newFogs?: string[];
    resolvedFogIndices?: number[];
  }
): WayfinderProject {
  const target = project.tickets.find((t) => t.id === ticketId);
  if (!target) return project;

  const trimmedSummary = options.summary.trim();
  const now = new Date().toISOString();

  let updatedTickets: Ticket[] = project.tickets.map((t) =>
    t.id === ticketId
      ? {
          ...t,
          status: 'DONE' as const,
          output: trimmedSummary || t.output,
          completedAt: now,
        }
      : t
  );

  let nextId = getNextTicketId(updatedTickets);
  if (options.newTickets && options.newTickets.length > 0) {
    const added: Ticket[] = options.newTickets
      .filter((nt) => nt.title.trim().length > 0)
      .map((nt) => {
        const id = nextId++;
        return {
          id,
          title: nt.title.trim(),
          description: nt.description.trim() || 'Ticket emerso durante la sessione di lavoro.',
          category: VALID_CATEGORIES.includes(nt.category) ? nt.category : 'TASK',
          status: 'FRONTIER' as const,
          dependencies: nt.dependencies ?? [],
          output: '',
          createdAt: now,
        };
      });
    updatedTickets = [...updatedTickets, ...added];
  }

  updatedTickets = recomputeTicketStatuses(updatedTickets);

  const decisionText = (options.decisionToAdd ?? trimmedSummary).trim();
  const nextDecisions = [...project.decisions];
  if (decisionText) {
    const formattedDecision = `[#${target.id} ${target.title}] ${decisionText}`;
    if (!nextDecisions.includes(formattedDecision)) {
      nextDecisions.push(formattedDecision);
    }
  }

  const resolvedSet = new Set(options.resolvedFogIndices ?? []);
  const remainingFog = project.fog.filter((_, idx) => !resolvedSet.has(idx));
  const incomingFogs = (options.newFogs ?? [])
    .map((f) => f.trim())
    .filter((f) => f.length > 0 && !remainingFog.includes(f));

  return {
    ...project,
    tickets: updatedTickets,
    decisions: nextDecisions,
    fog: [...remainingFog, ...incomingFogs],
    activeTicketId: project.activeTicketId === ticketId ? null : project.activeTicketId,
    updatedAt: now,
  };
}

export function calculateSafeZoneStats(project: WayfinderProject): SafeZoneStats {
  const totalTickets = project.tickets.length;
  const doneTickets = project.tickets.filter((t) => t.status === 'DONE').length;
  const frontierTickets = project.tickets.filter((t) => t.status === 'FRONTIER').length;
  const claimedTickets = project.tickets.filter((t) => t.status === 'CLAIMED').length;
  const blockedTickets = project.tickets.filter((t) => t.status === 'BLOCKED').length;
  const fogCount = project.fog.length;
  const completionPercent =
    totalTickets === 0 ? 0 : Math.round((doneTickets / totalTickets) * 100);

  let healthLabel: SafeZoneStats['healthLabel'] = 'Pronto al Lavoro';
  if (fogCount > 3 && frontierTickets === 0) {
    healthLabel = 'Attenzione Fog';
  } else if (claimedTickets <= 1 && (frontierTickets > 0 || doneTickets === totalTickets)) {
    healthLabel = 'Safe Zone Ottimale';
  }

  return {
    totalTickets,
    doneTickets,
    frontierTickets,
    claimedTickets,
    blockedTickets,
    fogCount,
    completionPercent,
    healthLabel,
  };
}

export interface ParsedTicketsResult {
  ok: true;
  tickets: Ticket[];
}

export interface ParsedTicketsError {
  ok: false;
  error: string;
}

export function parseTicketsJson(
  rawInput: string,
  startingId = 1
): ParsedTicketsResult | ParsedTicketsError {
  const trimmed = rawInput.trim();
  if (!trimmed) {
    return { ok: false, error: 'Incolla prima il JSON generato dall’AI.' };
  }

  // Strip optional markdown code fences
  const cleaned = trimmed
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    return {
      ok: false,
      error: 'JSON non valido. Assicurati di incollare solo l’array JSON o l’oggetto { "tickets": [...] }.',
    };
  }

  const rawList = Array.isArray(parsed)
    ? parsed
    : typeof parsed === 'object' && parsed !== null && Array.isArray((parsed as { tickets?: unknown }).tickets)
      ? (parsed as { tickets: unknown[] }).tickets
      : null;

  if (!rawList || rawList.length === 0) {
    return {
      ok: false,
      error: 'Il JSON non contiene alcun ticket valido (atteso array o campo "tickets").',
    };
  }

  const now = new Date().toISOString();
  const idRemap = new Map<number, number>();

  rawList.forEach((item, index) => {
    const obj = item as Record<string, unknown>;
    const rawId = typeof obj?.id === 'number' && Number.isFinite(obj.id) ? obj.id : index + 1;
    idRemap.set(rawId, startingId + index);
  });

  const built: Ticket[] = [];
  for (let i = 0; i < rawList.length; i++) {
    const item = rawList[i];
    if (typeof item !== 'object' || item === null) {
      return { ok: false, error: `Elemento #${i + 1} non è un oggetto valido.` };
    }
    const obj = item as Record<string, unknown>;
    const title = typeof obj.title === 'string' ? obj.title.trim() : '';
    if (!title) {
      return { ok: false, error: `Il ticket alla posizione ${i + 1} non ha un campo "title".` };
    }

    const description =
      typeof obj.description === 'string' ? obj.description.trim() : '';

    const rawCategory =
      typeof obj.category === 'string' ? obj.category.trim().toUpperCase() : 'TASK';
    const category: TicketCategory = VALID_CATEGORIES.includes(rawCategory as TicketCategory)
      ? (rawCategory as TicketCategory)
      : 'TASK';

    const rawDeps = Array.isArray(obj.dependencies)
      ? obj.dependencies
          .map((d) => (typeof d === 'number' ? d : Number(d)))
          .filter((d) => Number.isFinite(d))
      : [];

    const assignedId = startingId + i;
    const mappedDeps = rawDeps
      .map((d) => idRemap.get(d) ?? d)
      .filter((d) => d !== assignedId);

    built.push({
      id: assignedId,
      title,
      description,
      category,
      status: mappedDeps.length > 0 ? 'BLOCKED' : 'FRONTIER',
      dependencies: Array.from(new Set(mappedDeps)),
      output: '',
      createdAt: now,
    });
  }

  return { ok: true, tickets: recomputeTicketStatuses(built) };
}

export interface ParsedGrillingData {
  destination?: string;
  decisions: string[];
  fog: string[];
  outOfScope: string[];
}

export function parseGrillingNotes(rawText: string): ParsedGrillingData {
  const lines = rawText
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  let currentSection: 'none' | 'destination' | 'decisions' | 'fog' | 'outOfScope' = 'none';
  let destinationParts: string[] = [];
  const decisions: string[] = [];
  const fog: string[] = [];
  const outOfScope: string[] = [];

  for (const line of lines) {
    const lower = line.toLowerCase().replace(/^[#*>\-\d.\s]+/, '');
    if (
      lower.startsWith('destination') ||
      lower.startsWith('obiettivo finale')
    ) {
      currentSection = 'destination';
      const inline = line.split(':').slice(1).join(':').trim();
      if (inline) destinationParts.push(inline);
      continue;
    }
    if (
      lower.startsWith('decisions') ||
      lower.startsWith('decisioni')
    ) {
      currentSection = 'decisions';
      const inline = line.split(':').slice(1).join(':').trim();
      if (inline) decisions.push(inline);
      continue;
    }
    if (
      lower.startsWith('fog') ||
      lower.startsWith('punti oscuri') ||
      lower.startsWith('domande aperte')
    ) {
      currentSection = 'fog';
      const inline = line.split(':').slice(1).join(':').trim();
      if (inline) fog.push(inline);
      continue;
    }
    if (
      lower.startsWith('out of scope') ||
      lower.startsWith('esclusioni')
    ) {
      currentSection = 'outOfScope';
      const inline = line.split(':').slice(1).join(':').trim();
      if (inline) outOfScope.push(inline);
      continue;
    }

    const cleanBullet = line.replace(/^[-*•\d.)\s]+/, '').trim();
    if (!cleanBullet) continue;

    if (currentSection === 'destination') {
      destinationParts.push(cleanBullet);
    } else if (currentSection === 'decisions') {
      decisions.push(cleanBullet);
    } else if (currentSection === 'fog') {
      fog.push(cleanBullet);
    } else if (currentSection === 'outOfScope') {
      outOfScope.push(cleanBullet);
    } else {
      // Unlabeled bullets default to decisions
      decisions.push(cleanBullet);
    }
  }

  return {
    destination: destinationParts.length > 0 ? destinationParts.join(' ') : undefined,
    decisions,
    fog,
    outOfScope,
  };
}

export interface ParsedSummaryHints {
  outcome: string;
  fogs: string[];
  ticketTitles: string[];
}

export function parseAiSummaryBlock(rawSummary: string): ParsedSummaryHints {
  const lines = rawSummary
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  const outcomeLines: string[] = [];
  const fogs: string[] = [];
  const ticketTitles: string[] = [];

  for (const line of lines) {
    const clean = line.replace(/^[-*•\s]+/, '');
    const lower = clean.toLowerCase();

    if (lower.startsWith('fog:') || lower.startsWith('nuovo fog:') || lower.startsWith('domanda:')) {
      const content = clean.split(':').slice(1).join(':').trim();
      if (content && !/^nessun/i.test(content)) fogs.push(content);
    } else if (
      lower.startsWith('nuovo ticket:') ||
      lower.startsWith('ticket:') ||
      lower.startsWith('prossimo ticket:')
    ) {
      const content = clean.split(':').slice(1).join(':').trim();
      if (content && !/^nessun/i.test(content)) ticketTitles.push(content);
    } else {
      outcomeLines.push(clean);
    }
  }

  return {
    outcome: outcomeLines.join(' ').trim(),
    fogs,
    ticketTitles,
  };
}
