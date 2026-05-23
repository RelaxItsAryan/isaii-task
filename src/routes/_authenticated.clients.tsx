import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { PageHeader } from "@/components/layout/PageHeader";
import { PillBadge, healthTone } from "@/components/PillBadge";
import { InitialAvatar } from "@/components/InitialAvatar";
import { formatINR } from "@/lib/format";
import { Building2, Phone, Mail, Plus, X } from "lucide-react";
import { seedIfEmpty } from "@/lib/seed";
import { EmptyState } from "@/components/ui/EmptyState";
import toast from "react-hot-toast";

export const Route = createFileRoute("/_authenticated/clients")({ component: Clients });

interface Client {
  id: string; company_name: string; industry: string | null;
  annual_value: number; health_status: string; contact_name: string | null;
  phone: string | null; email: string | null; notes: string | null;
  assigned_to: string | null;
}

function Clients() {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Client | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const load = async () => {
    const [{ data: c }, { data: p }] = await Promise.all([
      supabase.from("clients").select("*").order("annual_value", { ascending: false }),
      supabase.from("profiles").select("id,full_name"),
    ]);
    setClients((c as Client[]) ?? []);
    setProfiles(Object.fromEntries(((p ?? []) as { id: string; full_name: string }[]).map((x) => [x.id, x.full_name])));
    setLoading(false);
  };
  useEffect(() => { (async () => { if (user) await seedIfEmpty(user.id); load(); })(); }, [user]);

  const total = clients.reduce((s, c) => s + Number(c.annual_value), 0);

  return (
    <>
      <PageHeader
        breadcrumbs={["Forge", "Clients"]}
        title="Client Management"
        subtitle={`${clients.length} active clients · ${formatINR(total)} annual book value`}
        action={
          <button onClick={() => setShowAdd(true)} className="inline-flex items-center gap-2 rounded-md bg-primary px-3.5 py-2 text-sm font-semibold text-white hover:opacity-95">
            <Plus size={18} /> Add Client
          </button>
        }
      />

      {loading ? (
        <div className="text-sm text-slate-400">Loading…</div>
      ) : clients.length === 0 ? (
        <EmptyState icon={<Building2 size={32} />} title="No clients yet" description="Convert closed-won leads or add directly." />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {clients.map((c) => (
            <div key={c.id} className="card-base p-5 transition hover:shadow-md">
              <div className="flex items-start gap-3">
                <InitialAvatar name={c.company_name} size={44} />
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-slate-900">{c.company_name}</h3>
                    <PillBadge tone={healthTone(c.health_status)} dot>{c.health_status}</PillBadge>
                  </div>
                  <PillBadge tone="blue">{c.industry ?? "—"}</PillBadge>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <div className="text-slate-500">Annual value</div>
                  <div className="mt-0.5 text-base font-bold text-slate-900">{formatINR(c.annual_value)}</div>
                </div>
                <div>
                  <div className="text-slate-500">Account owner</div>
                  <div className="mt-0.5 flex items-center gap-1.5">
                    <InitialAvatar name={profiles[c.assigned_to ?? ""] ?? "?"} size={20} />
                    <span className="text-xs font-medium">{profiles[c.assigned_to ?? ""] ?? "—"}</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-3 border-t border-border pt-3 text-xs text-slate-500">
                {c.phone && <span className="inline-flex items-center gap-1"><Phone size={12} /> {c.phone}</span>}
                {c.email && <span className="inline-flex items-center gap-1 truncate"><Mail size={12} /> {c.email}</span>}
              </div>
              <button onClick={() => setSelected(c)}
                className="mt-4 w-full rounded-md border border-border py-1.5 text-xs font-semibold text-slate-700 hover:bg-muted">
                View Details
              </button>
            </div>
          ))}
        </div>
      )}

      {(selected || showAdd) && (
        <div className="fixed inset-0 z-50 flex" onClick={() => { setSelected(null); setShowAdd(false); }}>
          <div className="flex-1 bg-slate-900/40" />
          <div onClick={(e) => e.stopPropagation()} className="flex h-full w-full max-w-md flex-col bg-card shadow-2xl">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="text-base font-semibold">{selected ? selected.company_name : "Add Client"}</h2>
              <button onClick={() => { setSelected(null); setShowAdd(false); }} className="rounded-md p-1 hover:bg-muted">
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 scrollbar-thin">
              {selected ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <InitialAvatar name={selected.company_name} size={56} />
                    <div>
                      <PillBadge tone="blue">{selected.industry ?? "—"}</PillBadge>
                      <div className="mt-1 text-xl font-bold">{formatINR(selected.annual_value)}/yr</div>
                    </div>
                  </div>
                  <dl className="space-y-2 rounded-lg border border-border p-3 text-sm">
                    <div className="flex justify-between"><dt className="text-slate-500">Contact</dt><dd className="font-medium">{selected.contact_name ?? "—"}</dd></div>
                    <div className="flex justify-between"><dt className="text-slate-500">Phone</dt><dd>{selected.phone ?? "—"}</dd></div>
                    <div className="flex justify-between"><dt className="text-slate-500">Email</dt><dd className="truncate">{selected.email ?? "—"}</dd></div>
                    <div className="flex justify-between"><dt className="text-slate-500">Owner</dt><dd>{profiles[selected.assigned_to ?? ""] ?? "—"}</dd></div>
                    <div className="flex justify-between"><dt className="text-slate-500">Health</dt><dd><PillBadge tone={healthTone(selected.health_status)} dot>{selected.health_status}</PillBadge></dd></div>
                  </dl>
                  {selected.notes && (
                    <div>
                      <h4 className="mb-1 text-xs font-semibold uppercase text-slate-500">Notes</h4>
                      <p className="rounded-md bg-slate-50 p-3 text-sm">{selected.notes}</p>
                    </div>
                  )}
                  <div>
                    <h4 className="mb-2 text-xs font-semibold uppercase text-slate-500">Recent timeline</h4>
                    <ul className="space-y-2 border-l-2 border-blue-200 pl-3 text-sm">
                      <li><div className="font-medium">Quarterly review completed</div><div className="text-xs text-slate-400">3 days ago</div></li>
                      <li><div className="font-medium">Contract renewed for 2026</div><div className="text-xs text-slate-400">2 weeks ago</div></li>
                      <li><div className="font-medium">Onboarding finished</div><div className="text-xs text-slate-400">2 months ago</div></li>
                    </ul>
                  </div>
                </div>
              ) : (
                <ClientForm onDone={() => { setShowAdd(false); load(); toast.success("Client added"); }} />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ClientForm({ onDone }: { onDone: () => void }) {
  const { user } = useAuth();
  const [f, setF] = useState({ company_name: "", industry: "Automotive", annual_value: 1000000, contact_name: "", phone: "", email: "", health_status: "Green" });
  return (
    <form onSubmit={async (e) => {
      e.preventDefault();
      const { error } = await supabase.from("clients").insert({ ...f, assigned_to: user?.id });
      if (error) return toast.error(error.message);
      onDone();
    }} className="space-y-3">
      <input required placeholder="Company name" value={f.company_name} onChange={(e) => setF({ ...f, company_name: e.target.value })}
        className="w-full rounded-md border border-input px-3 py-2 text-sm" />
      <input required placeholder="Contact name" value={f.contact_name} onChange={(e) => setF({ ...f, contact_name: e.target.value })}
        className="w-full rounded-md border border-input px-3 py-2 text-sm" />
      <input placeholder="Phone" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })}
        className="w-full rounded-md border border-input px-3 py-2 text-sm" />
      <input type="email" placeholder="Email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })}
        className="w-full rounded-md border border-input px-3 py-2 text-sm" />
      <div className="grid grid-cols-2 gap-3">
        <select value={f.industry} onChange={(e) => setF({ ...f, industry: e.target.value })}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm">
          {["Automotive", "FMCG", "Pharma", "Infrastructure", "Textiles"].map((x) => <option key={x}>{x}</option>)}
        </select>
        <select value={f.health_status} onChange={(e) => setF({ ...f, health_status: e.target.value })}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm">
          {["Green", "Yellow", "Red"].map((x) => <option key={x}>{x}</option>)}
        </select>
      </div>
      <input type="number" placeholder="Annual value (₹)" value={f.annual_value} onChange={(e) => setF({ ...f, annual_value: Number(e.target.value) })}
        className="w-full rounded-md border border-input px-3 py-2 text-sm" />
      <button type="submit" className="w-full rounded-md bg-primary py-2.5 text-sm font-semibold text-white">Save Client</button>
    </form>
  );
}
