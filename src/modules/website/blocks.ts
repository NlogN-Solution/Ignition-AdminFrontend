/**
 * The block vocabulary.
 *
 * Every type here renders through a component the public site already has —
 * that is what makes moving the guides behind an editor tractable rather than
 * a rewrite. Adding a type needs no migration: `content_blocks.data` is JSONB
 * and the renderer switches on `block_type`.
 */

import type { LucideIcon } from "lucide-react";
import {
  AlignLeft,
  BarChart3,
  CircleHelp,
  Component,
  Info,
  LayoutGrid,
  List,
  ListChecks,
  Megaphone,
  Milestone,
} from "lucide-react";

export const BLOCK_TYPES = [
  "prose",
  "cards",
  "timeline",
  "checklist",
  "faq",
  "callout",
  "stats",
  "list",
  "cta",
  "component",
] as const;

export type BlockType = (typeof BLOCK_TYPES)[number];

export interface BlockMeta {
  label: string;
  icon: LucideIcon;
  /** What the public site renders this with. */
  rendersWith: string;
  description: string;
}

export const BLOCK_META: Record<BlockType, BlockMeta> = {
  prose: {
    label: "Prose",
    icon: AlignLeft,
    rendersWith: "BlogSection",
    description: "Headed paragraphs, optionally with bullet points.",
  },
  cards: {
    label: "Cards",
    icon: LayoutGrid,
    rendersWith: "topic / requirement grids",
    description: "A grid of titled cards, each optionally linking somewhere.",
  },
  timeline: {
    label: "Timeline",
    icon: Milestone,
    rendersWith: "components/ui/Timeline",
    description: "Ordered stages with a title and detail each.",
  },
  checklist: {
    label: "Checklist",
    icon: ListChecks,
    rendersWith: "components/ui/Checklist",
    description: "Tickable items the reader keeps between visits.",
  },
  faq: {
    label: "FAQ",
    icon: CircleHelp,
    rendersWith: "components/ui/Accordion + faqSchema()",
    description: "Question and answer pairs. Also emitted as FAQ structured data.",
  },
  callout: {
    label: "Callout",
    icon: Info,
    rendersWith: "notice components",
    description: "A short notice — a caveat, a policy, a link to the authority.",
  },
  stats: {
    label: "Stats",
    icon: BarChart3,
    rendersWith: "why-uk cards",
    description: "Figures with a label and a source.",
  },
  list: {
    label: "List",
    icon: List,
    rendersWith: "commonMistakes",
    description: "A plain bulleted list under an optional heading.",
  },
  cta: {
    label: "Call to action",
    icon: Megaphone,
    rendersWith: "hub CTAs",
    description: "A title, a line of intro, and up to two buttons.",
  },
  component: {
    label: "Interactive",
    icon: Component,
    rendersWith: "allowlisted component",
    description: "An interactive tool — the calculator, the quiz, the explorer.",
  },
};

/**
 * Interactive slots an editor may place.
 *
 * The allowlist lives here and in the landing rather than in the database, so
 * no editor can name an arbitrary component into a page. Anything not on this
 * list renders as nothing.
 */
export const COMPONENT_KEYS = [
  { key: "eligibility-calculator", label: "Eligibility calculator" },
  { key: "cost-calculator", label: "Cost calculator" },
  { key: "course-explorer", label: "Course explorer" },
  { key: "career-quiz", label: "Career quiz" },
  { key: "interview-practice", label: "Interview practice" },
  { key: "compare-board", label: "Compare board" },
  { key: "nepal-cost-table", label: "Nepal cost table" },
] as const;

/** A new block of each type starts here. */
export function emptyBlockData(type: BlockType): Record<string, unknown> {
  switch (type) {
    case "prose":
      return { heading: "", paragraphs: [""], points: [] };
    case "cards":
      return { heading: "", items: [{ title: "", body: "" }] };
    case "timeline":
      // `TimelineStage` — components/ui/Timeline.tsx:6-11.
      return { heading: "", stages: [{ label: "", description: "", meta: "" }] };
    case "checklist":
      // `ChecklistItem` — components/ui/Checklist.tsx:12. The block's own `id`
      // is the storage key the ticks persist under, so it must not change once
      // a page is live or every reader loses their progress.
      return { id: "", label: "", items: [{ id: "", label: "", detail: "" }] };
    case "faq":
      // `AccordionItem` — components/ui/Accordion.tsx:15. No id: the question
      // is the key.
      return { heading: "", items: [{ question: "", answer: "" }] };
    case "callout":
      // components/ui/Callout.tsx:14 knows two tones and no others.
      return { text: "", tone: "info", href: "", linkLabel: "" };
    case "stats":
      // `WhyUkPoint` — data/home/why-uk.ts:25-45.
      return { items: [{ id: "", tone: "blue", stat: "", statNote: "", title: "", body: "", source: "" }] };
    case "list":
      return { heading: "", items: [""] };
    case "cta":
      return { title: "", intro: "", primary: { label: "", href: "" } };
    case "component":
      return { key: COMPONENT_KEYS[0].key, props: {} };
  }
}

/** A one-line summary for the collapsed rail. */
export function blockSummary(type: BlockType, data: Record<string, unknown>): string {
  const first = (value: unknown): string =>
    Array.isArray(value) && value.length > 0 ? String((value[0] as Record<string, unknown>)?.title ?? value[0] ?? "") : "";

  const firstLabel = (value: unknown): string =>
    Array.isArray(value) && value.length > 0 ? String((value[0] as Record<string, unknown>)?.label ?? "") : "";

  switch (type) {
    case "prose":
      return String(data.heading || first(data.paragraphs) || "Empty");
    case "cards":
      return String(data.heading || first(data.items) || "Empty");
    case "timeline":
      return String(data.heading || firstLabel(data.stages) || "Empty");
    case "checklist":
      return String(data.label || "Empty");
    case "faq": {
      const items = (data.items as { question?: string }[] | undefined) ?? [];
      return items.length ? `${items.length} question${items.length === 1 ? "" : "s"}` : "Empty";
    }
    case "callout":
      return String(data.text || "Empty");
    case "stats": {
      const items = (data.items as { stat?: string }[] | undefined) ?? [];
      if (!items.length) return "Empty";
      return items[0].stat ? `${items[0].stat} +${items.length - 1}`.replace(" +0", "") : `${items.length} figures`;
    }
    case "list":
      return String(data.heading || first(data.items) || "Empty");
    case "cta":
      return String(data.title || "Empty");
    case "component":
      return COMPONENT_KEYS.find((entry) => entry.key === data.key)?.label ?? String(data.key ?? "Empty");
  }
}
