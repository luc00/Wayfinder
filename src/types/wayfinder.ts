export type AIModelTarget = 'Gemini' | 'ChatGPT' | 'Claude' | 'Grok';

export type TicketCategory = 'RESEARCH' | 'GRILLING' | 'PROTOTYPE' | 'TASK';

export type TicketStatus = 'FRONTIER' | 'BLOCKED' | 'CLAIMED' | 'DONE';

export type MainTab = 'home' | 'setup' | 'map' | 'workspace';

export interface Ticket {
  id: number;
  title: string;
  description: string;
  category: TicketCategory;
  status: TicketStatus;
  dependencies: number[];
  output: string;
  createdAt: string;
  completedAt?: string;
}

export interface WayfinderProject {
  id: string;
  name: string;
  vagueIdea: string;
  grillingNotes: string;
  destination: string;
  decisions: string[];
  fog: string[];
  outOfScope: string[];
  tickets: Ticket[];
  activeTicketId: number | null;
  updatedAt: string;
}

export interface WayfinderStore {
  projects: WayfinderProject[];
  activeProjectId: string;
  targetAi: AIModelTarget;
  activeTab: MainTab;
}

export interface SafeZoneStats {
  totalTickets: number;
  doneTickets: number;
  frontierTickets: number;
  claimedTickets: number;
  blockedTickets: number;
  fogCount: number;
  completionPercent: number;
  healthLabel: 'Safe Zone Ottimale' | 'Attenzione Fog' | 'Pronto al Lavoro';
}
