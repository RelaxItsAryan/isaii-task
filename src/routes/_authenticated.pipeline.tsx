import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { PageHeader } from "@/components/layout/PageHeader";
import { PillBadge, priorityTone } from "@/components/PillBadge";
import { InitialAvatar } from "@/components/InitialAvatar";
import { formatINR, relTime } from "@/lib/format";
import { Plus, X } from "lucide-react";
import toast from "react-hot-toast";
import {
  DndContext, type DragEndEvent, PointerSensor, useSensor, useSensors, useDraggable, useDroppable,
} from "@dnd-kit/core";
import { seedIfEmpty } from "@/lib/seed";

export const Route = createFileRoute("/_authenticated/pipeline")({ component: Pipeline });

interface Lead {
  id: string; company_name: string; contact_name: string; phone: string | null;
  email: string | null; industry: string | null; source: string | null;
  stage: string; priority: string; deal_value: number;
  assigned_to: string | null; notes: string | null;
  stage_changed_at: string; updated_at: string;
}
interface Prof { id: string; full_name: string; }

const STAGES = ["New Lead", "Contacted", "Qualified", "Proposal Sent", "Closed Won", "Closed Lost"];
const INDUSTRIES = ["Automotive", "FMCG", "Pharma", "Infrastructure", "Textiles"];
const SOURCES = ["Cold Call", "LinkedIn", "Referral", "Trade Fair", "Website"];

function DraggableCard({ lead, profilesById, onClick }: { lead: Lead; profilesById: Record<string, string>; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: lead.id });
  const days = Math.max(0, Math.floor((Date.now() - new Date(lead.stage_changed_at).getTime()) / 86400000));
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      style={{ transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined, opacity: isDragging ? 0.5 : 1 }}
      className="mb-2 rounded-lg border border-border bg-card p-3 shadow-sm transition hover:border-primary/40 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-2">
        <button
          onClick={onClick}
          className="text-left text-sm font-semibold text-slate-800 hover:text-primary"
        >
          {lead.company_name}
        </button>
        <PillBadge tone={priorityTone(lead.priority)} dot>{lead.priority}</PillBadge>
      </div>
      <p className="mt-0.5 text-xs text-slate-500">{lead.contact_name}</p>
      <div className="mt-2 flex items-center justify-between">
        <span className="text-sm font-bold text-slate-900">{formatINR(lead.deal_value)}</span>
        <span className="text-[10px] text-slate-400">{days}d in stage</span>
      </div>
      <div className="mt-2 flex items-center justify-between border-t border-border pt-2">
        <div className="flex items-center gap-1.5">
          <InitialAvatar name={profilesById[lead.assigned_to ?? ""] ?? "?"} size={20} />
          <span className="text-[11px] text-slate-500">{(profilesById[lead.assigned_to ?? ""] ?? "Unassigned").split(" ")[0]}</span>
        </div>
        <span className="text-[10px] text-slate-400">{relTime(lead.updated_at)}</span>
      </div>
      {/* drag handle covers whole card */}
      <div {...listeners} className="absolute inset-0 cursor-grab" style={{ position: "absolute" }} />
    </div>
  );
}

function Column({ stage, leads, profilesById, onSelect }: { stage: string; leads: Lead[]; profilesById: Record<string, string>; onSelect: (l: Lead) => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  const total = leads.reduce((s, l) => s + Number(l.deal_value), 0);
  return (
    <div className="flex w-72 shrink-0 flex-col rounded-lg bg-slate-50 p-3">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-bold uppercase tracking-wide text-slate-600">{stage}</h3>
          <span className="badge bg-white text-slate-600 ring-1 ring-border">{leads.length}</span>
        </div>
        <span className="text-[10px] font-semibold text-slate-400">{formatINR(total)}</span>
      </div>
      <div
        ref={setNodeRef}
        className={`relative min-h-[200px] flex-1 rounded-lg p-1 transition ${isOver ? "bg-blue-100/50 ring-2 ring-primary/30" : ""}`}
      >
        {leads.map((l) => (
          <div key={l.id} className="relative">
            <DraggableCard lead={l} profilesById={profilesById} onClick={() => onSelect(l)} />
          </div>
        ))}
        {leads.length === 0 && <div className="py-6 text-center text-xs text-slate-400">Drop leads here</div>}
      </div>
    </div>
  );
}

function LeadForm({ onSubmit, onClose, profiles, initial }: {
  onSubmit: (data: Partial<Lead>) => Promise<void>; onClose: () => void;
  profiles: Prof[]; initial?: Partial<Lead>;
}) {
  const [f, setF] = useState<Partial<Lead>>({
    company_name: "", contact_name: "", phone: "", email: "",
    industry: "Automotive", source: "LinkedIn", priority: "Warm",
    deal_value: 0, stage: "New Lead", notes: "", ...initial,
  });
  return (
    <form
      onSubmit={async (e) => { e.preventDefault(); await onSubmit(f); onClose(); }}
      className="space-y-3"
    >
      {[
        { k: "company_name", l: "Company Name", req: true },
        { k: "contact_name", l: "Contact Name", req: true },
        { k: "phone", l: "Phone" },
        { k: "email", l: "Email", t: "email" },
      ].map((x) => (
        <div key={x.k}>
          <label className="mb-1 block text-xs font-medium text-slate-600">{x.l}</label>
          <input
            type={x.t ?? "text"} required={x.req}
            value={(f as any)[x.k] ?? ""}
            onChange={(e) => setF({ ...f, [x.k]: e.target.value })}
            className="w-full rounded-md border border-input px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>
      ))}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Industry</label>
          <select value={f.industry ?? ""} onChange={(e) => setF({ ...f, industry: e.target.value })}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
            {INDUSTRIES.map((i) => <option key={i}>{i}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Source</label>
          <select value={f.source ?? ""} onChange={(e) => setF({ ...f, source: e.target.value })}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
            {SOURCES.map((i) => <option key={i}>{i}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Deal Value (₹)</label>
          <input type="number" value={f.deal_value ?? 0} onChange={(e) => setF({ ...f, deal_value: Number(e.target.value) })}
            className="w-full rounded-md border border-input px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Priority</label>
          <select value={f.priority ?? "Warm"} onChange={(e) => setF({ ...f, priority: e.target.value })}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
            {["Hot", "Warm", "Cold"].map((i) => <option key={i}>{i}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Stage</label>
          <select value={f.stage ?? "New Lead"} onChange={(e) => setF({ ...f, stage: e.target.value })}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
            {STAGES.map((i) => <option key={i}>{i}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Assigned To</label>
          <select value={f.assigned_to ?? ""} onChange={(e) => setF({ ...f, assigned_to: e.target.value })}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
            <option value="">— Unassigned —</option>
            {profiles.map((p) => <option key={p.id} value={p.id}>{p.full_name}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Notes</label>
        <textarea value={f.notes ?? ""} onChange={(e) => setF({ ...f, notes: e.target.value })} rows={3}
          className="w-full rounded-md border border-input px-3 py-2 text-sm" />
      </div>
      <button type="submit" className="w-full rounded-md bg-primary py-2.5 text-sm font-semibold text-white hover:opacity-95">
        Save Lead
      </button>
    </form>
  );
}

function Pipeline() {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [profiles, setProfiles] = useState<Prof[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [selected, setSelected] = useState<Lead | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const load = async () => {
    const [{ data: l }, { data: p }] = await Promise.all([
      supabase.from("leads").select("*").order("updated_at", { ascending: false }),
      supabase.from("profiles").select("id,full_name"),
    ]);
    setLeads((l as Lead[]) ?? []);
    setProfiles((p as Prof[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { (async () => { if (user) await seedIfEmpty(user.id); load(); })(); }, [user]);

  const profilesById = Object.fromEntries(profiles.map((p) => [p.id, p.full_name]));

  const onDragEnd = async (e: DragEndEvent) => {
    const leadId = e.active.id as string;
    const newStage = e.over?.id as string | undefined;
    if (!newStage || !STAGES.includes(newStage)) return;
    const lead = leads.find((l) => l.id === leadId);
    if (!lead || lead.stage === newStage) return;
    setLeads((prev) => prev.map((l) => l.id === leadId ? { ...l, stage: newStage, stage_changed_at: new Date().toISOString() } : l));
    const { error } = await supabase.from("leads")
      .update({ stage: newStage, stage_changed_at: new Date().toISOString() })
      .eq("id", leadId);
    if (error) { toast.error("Could not update stage"); load(); return; }
    await supabase.from("activities").insert({
      type: newStage === "Closed Won" ? "won" : "stage",
      description: `${lead.company_name} moved to ${newStage}`,
      lead_id: leadId, created_by: user?.id ?? null,
    });
    toast.success(`Moved to ${newStage}`);
  };

  const addLead = async (data: Partial<Lead>) => {
    const payload = { ...data, assigned_to: data.assigned_to || user?.id || null } as any;
    const { error } = await supabase.from("leads").insert(payload);
    if (error) { toast.error(error.message); return; }
    toast.success("Lead added");
    load();
  };

  const updateLead = async (data: Partial<Lead>) => {
    if (!selected) return;
    const { error } = await supabase.from("leads").update(data).eq("id", selected.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Lead updated");
    load();
  };

  return (
    <>
      <PageHeader
        breadcrumbs={["Forge", "Lead Pipeline"]}
        title="Lead Pipeline"
        subtitle="Drag cards between stages to update."
        action={
          <button onClick={() => setShowAdd(true)} className="inline-flex items-center gap-2 rounded-md bg-primary px-3.5 py-2 text-sm font-semibold text-white hover:opacity-95">
            <Plus size={18} /> Add Lead
          </button>
        }
      />

      {loading ? (
        <div className="text-sm text-slate-400">Loading pipeline…</div>
      ) : (
        <DndContext sensors={sensors} onDragEnd={onDragEnd}>
          <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-thin">
            {STAGES.map((s) => (
              <Column
                key={s} stage={s}
                leads={leads.filter((l) => l.stage === s)}
                profilesById={profilesById}
                onSelect={setSelected}
              />
            ))}
          </div>
        </DndContext>
      )}

      {(showAdd || selected) && (
        <div className="fixed inset-0 z-50 flex" onClick={() => { setShowAdd(false); setSelected(null); }}>
          <div className="flex-1 bg-slate-900/40" />
          <div onClick={(e) => e.stopPropagation()} className="flex h-full w-full max-w-md flex-col bg-card shadow-2xl">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="text-base font-semibold">{selected ? "Edit Lead" : "Add New Lead"}</h2>
              <button onClick={() => { setShowAdd(false); setSelected(null); }} className="rounded-md p-1 hover:bg-muted">
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 scrollbar-thin">
              <LeadForm
                profiles={profiles}
                initial={selected ?? undefined}
                onClose={() => { setShowAdd(false); setSelected(null); }}
                onSubmit={selected ? updateLead : addLead}
              />
              {selected && (
                <div className="mt-6 border-t border-border pt-4">
                  <h3 className="mb-2 text-xs font-bold uppercase text-slate-500">Quick info</h3>
                  <dl className="space-y-1.5 text-xs">
                    <div className="flex justify-between"><dt className="text-slate-500">Phone</dt><dd>{selected.phone ?? "—"}</dd></div>
                    <div className="flex justify-between"><dt className="text-slate-500">Email</dt><dd>{selected.email ?? "—"}</dd></div>
                    <div className="flex justify-between"><dt className="text-slate-500">Source</dt><dd>{selected.source ?? "—"}</dd></div>
                    <div className="flex justify-between"><dt className="text-slate-500">Created</dt><dd>{relTime(selected.updated_at)}</dd></div>
                  </dl>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
