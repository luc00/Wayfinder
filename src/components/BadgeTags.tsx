import {
  CheckCircle2,
  Compass,
  FlaskConical,
  HelpCircle,
  Lock,
  Play,
  Search,
  Wrench,
} from 'lucide-react';
import type { TicketCategory, TicketStatus } from '../types/wayfinder';

const CATEGORY_CONFIG: Record<
  TicketCategory,
  { label: string; classes: string; icon: typeof Search }
> = {
  RESEARCH: {
    label: 'RESEARCH',
    classes: 'bg-[#E0F2FE] text-[#0369A1] border-[#0EA5E9]',
    icon: Search,
  },
  GRILLING: {
    label: 'GRILLING',
    classes: 'bg-[#F3E8FF] text-[#7E22CE] border-[#A855F7]',
    icon: HelpCircle,
  },
  PROTOTYPE: {
    label: 'PROTOTYPE',
    classes: 'bg-[#FEF08A] text-[#111111] border-[#EAB308]',
    icon: FlaskConical,
  },
  TASK: {
    label: 'TASK',
    classes: 'bg-[#DCFCE7] text-[#15803D] border-[#22C55E]',
    icon: Wrench,
  },
};

const STATUS_CONFIG: Record<
  TicketStatus,
  { label: string; classes: string; icon: typeof Compass }
> = {
  FRONTIER: {
    label: 'FRONTIER',
    classes: 'bg-[#DBEAFE] text-[#1D4ED8] border-[#3B82F6]',
    icon: Compass,
  },
  CLAIMED: {
    label: 'CLAIMED',
    classes: 'bg-[#FCE7F3] text-[#BE185D] border-[#EC4899]',
    icon: Play,
  },
  BLOCKED: {
    label: 'BLOCKED',
    classes: 'bg-[#F4F4F5] text-[#52525B] border-black/15',
    icon: Lock,
  },
  DONE: {
    label: 'DONE',
    classes: 'bg-[#10B981] text-white border-[#059669]',
    icon: CheckCircle2,
  },
};

export function CategoryBadge({ category }: { category: TicketCategory }) {
  const cfg = CATEGORY_CONFIG[category];
  const Icon = cfg.icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-mono font-semibold tracking-wide border whitespace-nowrap shrink-0 ${cfg.classes}`}
    >
      <Icon className="w-3 h-3 shrink-0" aria-hidden="true" />
      {cfg.label}
    </span>
  );
}

export function StatusBadge({ status }: { status: TicketStatus }) {
  const cfg = STATUS_CONFIG[status];
  const Icon = cfg.icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-mono font-semibold tracking-wide border whitespace-nowrap shrink-0 ${cfg.classes}`}
    >
      <Icon className="w-3 h-3 shrink-0" aria-hidden="true" />
      {cfg.label}
    </span>
  );
}
