import type { ReactNode } from "react";

type Tone = "blue" | "green" | "amber" | "red" | "gray" | "violet" | "cyan";

const TONES: Record<Tone, string> = {
  blue: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
  green: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  amber: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  red: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
  gray: "bg-slate-100 text-slate-700 ring-1 ring-slate-200",
  violet: "bg-violet-50 text-violet-700 ring-1 ring-violet-200",
  cyan: "bg-cyan-50 text-cyan-700 ring-1 ring-cyan-200",
};
const DOTS: Record<Tone, string> = {
  blue: "bg-blue-500", green: "bg-emerald-500", amber: "bg-amber-500",
  red: "bg-rose-500", gray: "bg-slate-400", violet: "bg-violet-500", cyan: "bg-cyan-500",
};

export function PillBadge({ tone = "gray", children, dot = false }: { tone?: Tone; children: ReactNode; dot?: boolean }) {
  return (
    <span className={`badge ${TONES[tone]}`}>
      {dot && <span className={`inline-block size-1.5 rounded-full ${DOTS[tone]}`} />}
      {children}
    </span>
  );
}

export function stageTone(stage: string): Tone {
  return stage === "New Lead" ? "gray"
    : stage === "Contacted" ? "blue"
    : stage === "Qualified" ? "violet"
    : stage === "Proposal Sent" ? "amber"
    : stage === "Closed Won" ? "green"
    : stage === "Closed Lost" ? "red" : "gray";
}

export function priorityTone(p: string): Tone {
  return p === "Hot" ? "red" : p === "Warm" ? "amber" : "cyan";
}

export function healthTone(h: string): Tone {
  return h === "Green" ? "green" : h === "Yellow" ? "amber" : "red";
}
