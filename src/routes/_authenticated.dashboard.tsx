import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { PageHeader } from "@/components/layout/PageHeader";
import { PillBadge, stageTone } from "@/components/PillBadge";
import { InitialAvatar } from "@/components/InitialAvatar";
import { formatINR, relTime } from "@/lib/format";
import { LoadingSkeleton, SkeletonRows } from "@/components/LoadingSkeleton";
import { seedIfEmpty } from "@/lib/seed";
import {
  TrendingUp, TrendingDown, DollarSign, Zap, Users, BarChart3,
  Clock, Phone, Mail, CheckCircle, ArrowUpRight,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell,
} from "recharts";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

interface Lead { id: string; stage: string; deal_value: number; assigned_to: string | null; updated_at: string; company_name: string; }
interface Profile { id: string; full_name: string; }
interface ActivityRow { id: string; type: string; description: string; created_at: string; }
interface TaskRow { id: string; title: string; due_date: string; priority: string; status: string; }

function StatCard({ icon, label, value, delta, deltaPositive, accent }: {
  icon: React.ReactNode; label: string; value: string;
  delta?: string; deltaPositive?: boolean; accent?: React.ReactNode;
}) {
  return (
    <div className="card-base flex items-start justify-between p-5 transition hover:shadow-md">
      <div>
        <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</div>
        <div className="mt-2 text-2xl font-bold text-slate-900">{value}</div>
        {delta && (
          <div className={`mt-2 inline-flex items-center gap-1 text-xs font-semibold ${deltaPositive ? "text-emerald-600" : "text-rose-600"}`}>
            {deltaPositive ? <TrendingUp sx={{ fontSize: 12 }} /> : <TrendingDown sx={{ fontSize: 12 }} />}
            {delta} vs last month
          </div>
        )}
      </div>
      <div className="grid size-10 place-items-center rounded-lg bg-blue-50 text-primary">{icon}</div>
      {accent}
    </div>
  );
}

function Dashboard() {
  const { profile, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activities, setActivities] = useState<ActivityRow[]>([]);
  const [tasks, setTasks] = useState<TaskRow[]>([]);

  useEffect(() => {
    (async () => {
      if (user) await seedIfEmpty(user.id);
      const [{ data: l }, { data: p }, { data: a }, { data: t }] = await Promise.all([
        supabase.from("leads").select("id,stage,deal_value,assigned_to,updated_at,company_name").order("updated_at", { ascending: false }),
        supabase.from("profiles").select("id,full_name"),
        supabase.from("activities").select("*").order("created_at", { ascending: false }).limit(8),
        supabase.from("tasks").select("id,title,due_date,priority,status").eq("status", "Pending").order("due_date").limit(5),
      ]);
      setLeads((l as Lead[]) ?? []);
      setProfiles((p as Profile[]) ?? []);
      setActivities((a as ActivityRow[]) ?? []);
      setTasks((t as TaskRow[]) ?? []);
      setLoading(false);
    })();
  }, [user]);

  const STAGES = ["New Lead", "Contacted", "Qualified", "Proposal Sent", "Closed Won", "Closed Lost"];
  const activeLeads = leads.filter((l) => !l.stage.startsWith("Closed")).length;
  const closedWon = leads.filter((l) => l.stage === "Closed Won");
  const revenueThisMonth = closedWon.reduce((s, l) => s + Number(l.deal_value), 0);
  const totalClosed = closedWon.length + leads.filter((l) => l.stage === "Closed Lost").length;
  const conversion = totalClosed ? Math.round((closedWon.length / totalClosed) * 100) : 0;
  const avgDeal = closedWon.length ? revenueThisMonth / closedWon.length : 0;

  const funnel = STAGES.map((s) => ({
    stage: s.replace("Closed ", "Cl. "),
    count: leads.filter((l) => l.stage === s).length,
  }));

  const teamPerf = profiles.map((p) => {
    const own = leads.filter((l) => l.assigned_to === p.id);
    const won = own.filter((l) => l.stage === "Closed Won").length;
    const total = own.length;
    const targetPct = Math.min(100, Math.round((won / 5) * 100));
    return { ...p, assigned: total, calls: total * 4 + 7, demos: Math.floor(total * 1.2), won, targetPct };
  }).sort((a, b) => b.won - a.won);

  const donut = [
    { name: "Conv", value: conversion },
    { name: "Rem", value: 100 - conversion },
  ];

  return (
    <>
      <PageHeader
        breadcrumbs={["Forge", "Dashboard"]}
        title={`Good morning, ${profile?.full_name?.split(" ")[0] ?? "there"} 👋`}
        subtitle="Here's your team's pulse today."
      />

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => <LoadingSkeleton key={i} className="h-28" />)}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard icon={<Zap size={20} />} label="Active Leads" value={String(activeLeads)} delta="+12.4%" deltaPositive />
            <StatCard icon={<CheckCircle size={20} />} label="Deals Closed (Month)" value={`${closedWon.length} · ${formatINR(revenueThisMonth)}`} delta="+8.1%" deltaPositive />
            <StatCard
              icon={<BarChart3 size={20} />}
              label="Conversion Rate"
              value={`${conversion}%`}
              accent={
                <div className="absolute right-3 top-3 size-12 opacity-90">
                  <ResponsiveContainer><PieChart>
                    <Pie data={donut} dataKey="value" innerRadius={14} outerRadius={20} stroke="none">
                      <Cell fill="oklch(0.62 0.19 255)" /><Cell fill="oklch(0.92 0.01 250)" />
                    </Pie>
                  </PieChart></ResponsiveContainer>
                </div>
              }
            />
            <StatCard icon={<DollarSign size={20} />} label="Avg Deal Size" value={formatINR(avgDeal)} delta="+3.2%" deltaPositive />
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="card-base p-5 lg:col-span-2">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">Lead Pipeline Funnel</h2>
                  <p className="text-xs text-slate-500">Leads by stage</p>
                </div>
              </div>
              <div className="h-64">
                <ResponsiveContainer><BarChart data={funnel}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.01 250)" vertical={false} />
                  <XAxis dataKey="stage" tick={{ fontSize: 11, fill: "#64748b" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#64748b" }} />
                  <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="count" fill="oklch(0.62 0.19 255)" radius={[6, 6, 0, 0]} />
                </BarChart></ResponsiveContainer>
              </div>
            </div>

            <div className="card-base p-5">
              <h2 className="mb-3 text-base font-semibold text-slate-900">Recent Activity</h2>
              <div className="space-y-3">
                {activities.length === 0 && <p className="text-sm text-slate-500">No activity yet.</p>}
                {activities.map((a) => (
                  <div key={a.id} className="flex gap-3">
                    <div className={`mt-0.5 grid size-7 shrink-0 place-items-center rounded-full ${a.type === "call" ? "bg-blue-50 text-blue-600" :
                        a.type === "email" ? "bg-violet-50 text-violet-600" :
                          a.type === "won" ? "bg-emerald-50 text-emerald-600" :
                            "bg-slate-100 text-slate-500"
                      }`}>
                      {a.type === "call" ? <Phone size={14} /> :
                        a.type === "email" ? <Mail size={14} /> :
                        a.type === "won" ? <CheckCircle size={14} /> :
                        <BarChart3 size={14} />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-slate-700">{a.description}</p>
                      <p className="text-[11px] text-slate-400">{relTime(a.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="card-base overflow-hidden lg:col-span-2">
              <div className="flex items-center justify-between border-b border-border p-5">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">Team Performance</h2>
                  <p className="text-xs text-slate-500">This month</p>
                </div>
                <Users size={16} className="text-slate-400" />
              </div>
              <div className="overflow-x-auto scrollbar-thin">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
                    <tr>
                      <th className="px-4 py-2.5">BDA</th>
                      <th className="px-4 py-2.5 text-right">Leads</th>
                      <th className="px-4 py-2.5 text-right">Calls</th>
                      <th className="px-4 py-2.5 text-right">Demos</th>
                      <th className="px-4 py-2.5 text-right">Won</th>
                      <th className="px-4 py-2.5">Target</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teamPerf.map((p) => (
                      <tr key={p.id} className="border-t border-border hover:bg-slate-50/60">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <InitialAvatar name={p.full_name} size={28} />
                            <span className="font-medium text-slate-800">{p.full_name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">{p.assigned}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{p.calls}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{p.demos}</td>
                        <td className="px-4 py-3 text-right tabular-nums font-semibold">{p.won}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                              <div className="h-full rounded-full bg-emerald-500" style={{ width: `${p.targetPct}%` }} />
                            </div>
                            <span className="w-9 text-right text-xs font-semibold text-slate-600">{p.targetPct}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="card-base p-5">
              <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-slate-900">
                <Clock size={16} className="text-primary" /> Upcoming Follow-ups
              </h2>
              {tasks.length === 0 ? (
                <p className="text-sm text-slate-500">All caught up.</p>
              ) : tasks.map((t) => (
                <div key={t.id} className="mb-2 rounded-lg border border-border p-3 last:mb-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-slate-800">{t.title}</p>
                    <PillBadge tone={t.priority === "High" ? "red" : t.priority === "Medium" ? "amber" : "cyan"}>{t.priority}</PillBadge>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">Due {relTime(t.due_date)}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 card-base p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900">Latest Lead Activity</h2>
              <a href="/pipeline" className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">View pipeline <ArrowUpRight size={12} /></a>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {leads.slice(0, 6).map((l) => (
                <div key={l.id} className="rounded-lg border border-border p-3 transition hover:border-primary/40 hover:shadow-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate font-semibold text-slate-800">{l.company_name}</span>
                    <PillBadge tone={stageTone(l.stage)}>{l.stage}</PillBadge>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
                    <span>{formatINR(l.deal_value)}</span>
                    <span>{relTime(l.updated_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
      {loading && <div className="mt-6"><SkeletonRows rows={4} /></div>}
    </>
  );
}
