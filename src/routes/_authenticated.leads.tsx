import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { PageHeader } from "@/components/layout/PageHeader";
import { PillBadge, stageTone, priorityTone } from "@/components/PillBadge";
import { InitialAvatar } from "@/components/InitialAvatar";
import { formatINR, relTime } from "@/lib/format";
import { Download, Search, Trash2, Edit } from "lucide-react";
import { seedIfEmpty } from "@/lib/seed";
import toast from "react-hot-toast";

export const Route = createFileRoute("/_authenticated/leads")({ component: LeadsTable });

const STAGES = ["All", "New Lead", "Contacted", "Qualified", "Proposal Sent", "Closed Won", "Closed Lost"];
const PRIORITIES = ["All", "Hot", "Warm", "Cold"];

interface Lead {
  id: string; company_name: string; contact_name: string; phone: string | null;
  email: string | null; stage: string; priority: string; deal_value: number;
  assigned_to: string | null; updated_at: string;
}

function LeadsTable() {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [stage, setStage] = useState("All");
  const [prio, setPrio] = useState("All");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const load = async () => {
    const [{ data: l }, { data: p }] = await Promise.all([
      supabase.from("leads").select("id,company_name,contact_name,phone,email,stage,priority,deal_value,assigned_to,updated_at").order("updated_at", { ascending: false }),
      supabase.from("profiles").select("id,full_name"),
    ]);
    setLeads((l as Lead[]) ?? []);
    setProfiles(Object.fromEntries(((p ?? []) as { id: string; full_name: string }[]).map((x) => [x.id, x.full_name])));
    setLoading(false);
  };
  useEffect(() => { (async () => { if (user) await seedIfEmpty(user.id); load(); })(); }, [user]);

  const filtered = useMemo(() => leads.filter((l) =>
    (stage === "All" || l.stage === stage) &&
    (prio === "All" || l.priority === prio) &&
    (q === "" || l.company_name.toLowerCase().includes(q.toLowerCase()) || l.contact_name.toLowerCase().includes(q.toLowerCase()))
  ), [leads, stage, prio, q]);

  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  const exportCSV = () => {
    const rows = [
      ["ID", "Company", "Contact", "Phone", "Stage", "Priority", "Deal Value", "Assigned", "Updated"],
      ...filtered.map((l) => [
        l.id.slice(0, 8), l.company_name, l.contact_name, l.phone ?? "",
        l.stage, l.priority, l.deal_value, profiles[l.assigned_to ?? ""] ?? "", l.updated_at,
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `forge-leads-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported CSV");
  };

  const del = async (id: string) => {
    if (!confirm("Delete this lead?")) return;
    const { error } = await supabase.from("leads").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Lead deleted");
    load();
  };

  const changeStage = async (id: string, newStage: string) => {
    await supabase.from("leads").update({ stage: newStage, stage_changed_at: new Date().toISOString() }).eq("id", id);
    toast.success("Stage updated");
    load();
  };

  return (
    <>
      <PageHeader
        breadcrumbs={["Forge", "All Leads"]}
        title="All Leads"
        subtitle={`${filtered.length} leads`}
        action={
          <button onClick={exportCSV} className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3.5 py-2 text-sm font-semibold text-slate-700 hover:bg-muted">
            <Download size={18} /> Export CSV
          </button>
        }
      />

      <div className="card-base mb-4 flex flex-wrap items-center gap-3 p-3">
        <div className="relative min-w-64 flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }}
            placeholder="Search company or contact…"
            className="w-full rounded-md border border-input py-2 pl-9 pr-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary" />
        </div>
        <select value={stage} onChange={(e) => { setStage(e.target.value); setPage(1); }}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm">
          {STAGES.map((s) => <option key={s}>{s}</option>)}
        </select>
        <select value={prio} onChange={(e) => { setPrio(e.target.value); setPage(1); }}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm">
          {PRIORITIES.map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>

      <div className="card-base overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Company</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Stage</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3 text-right">Deal Value</th>
                <th className="px-4 py-3">Assigned</th>
                <th className="px-4 py-3">Last Activity</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={10} className="p-6 text-center text-slate-400">Loading…</td></tr>
              ) : paged.length === 0 ? (
                <tr><td colSpan={10} className="p-10 text-center text-slate-400">No leads match your filters.</td></tr>
              ) : paged.map((l) => (
                <tr key={l.id} className="border-t border-border hover:bg-slate-50/60">
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">#{l.id.slice(0, 6)}</td>
                  <td className="px-4 py-3 font-semibold text-slate-800">{l.company_name}</td>
                  <td className="px-4 py-3 text-slate-600">{l.contact_name}</td>
                  <td className="px-4 py-3 text-slate-500">{l.phone}</td>
                  <td className="px-4 py-3">
                    <select value={l.stage} onChange={(e) => changeStage(l.id, e.target.value)}
                      className="rounded-md border border-input bg-transparent px-2 py-1 text-xs">
                      {STAGES.slice(1).map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3"><PillBadge tone={priorityTone(l.priority)} dot>{l.priority}</PillBadge></td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums">{formatINR(l.deal_value)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <InitialAvatar name={profiles[l.assigned_to ?? ""] ?? "?"} size={22} />
                      <span className="text-xs text-slate-600">{(profiles[l.assigned_to ?? ""] ?? "—").split(" ")[0]}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">{relTime(l.updated_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button title="View in pipeline" onClick={() => window.location.href = "/pipeline"} className="rounded p-1 text-slate-500 hover:bg-muted hover:text-primary">
                        <Edit size={18} />
                      </button>
                      <button title="Delete" onClick={() => del(l.id)} className="rounded p-1 text-slate-500 hover:bg-rose-50 hover:text-rose-600">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border bg-slate-50/50 px-4 py-2 text-xs text-slate-500">
            <span>Page {page} of {totalPages}</span>
            <div className="flex gap-1">
              <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}
                className="rounded border border-border px-3 py-1 disabled:opacity-40">Prev</button>
              <button disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}
                className="rounded border border-border px-3 py-1 disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* hidden ref to satisfy stage tone import */}
      <span className="hidden">{stageTone("New Lead")}</span>
    </>
  );
}
