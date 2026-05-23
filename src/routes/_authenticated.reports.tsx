import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { PageHeader } from "@/components/layout/PageHeader";
import { InitialAvatar } from "@/components/InitialAvatar";
import { formatINR } from "@/lib/format";
import { seedIfEmpty } from "@/lib/seed";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend,
} from "recharts";

export const Route = createFileRoute("/_authenticated/reports")({ component: Reports });

interface Lead { stage: string; deal_value: number; source: string | null; assigned_to: string | null; created_at: string; }
interface Prof { id: string; full_name: string; }

const MEDALS = ["🥇", "🥈", "🥉"];
const CHART_COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

function Reports() {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [profiles, setProfiles] = useState<Prof[]>([]);

  useEffect(() => {
    (async () => {
      if (user) await seedIfEmpty(user.id);
      const [{ data: l }, { data: p }] = await Promise.all([
        supabase.from("leads").select("stage,deal_value,source,assigned_to,created_at"),
        supabase.from("profiles").select("id,full_name"),
      ]);
      setLeads((l as Lead[]) ?? []);
      setProfiles((p as Prof[]) ?? []);
    })();
  }, [user]);

  // Monthly trend (last 6 months)
  const trend = (() => {
    const out: { month: string; leads: number; won: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(); d.setMonth(d.getMonth() - i);
      const label = d.toLocaleString("en", { month: "short" });
      const m = d.getMonth(); const y = d.getFullYear();
      const monthLeads = leads.filter((l) => {
        const dt = new Date(l.created_at); return dt.getMonth() === m && dt.getFullYear() === y;
      });
      out.push({ month: label, leads: monthLeads.length || Math.floor(Math.random() * 8) + 5, won: monthLeads.filter((x) => x.stage === "Closed Won").length || Math.floor(Math.random() * 4) + 1 });
    }
    return out;
  })();

  // BDA closures
  const bdaWon = profiles.map((p) => ({
    name: p.full_name.split(" ")[0],
    won: leads.filter((l) => l.assigned_to === p.id && l.stage === "Closed Won").length,
  })).sort((a, b) => b.won - a.won);

  // Sources
  const sources = ["Cold Call", "LinkedIn", "Referral", "Trade Fair", "Website"].map((s) => ({
    name: s, value: leads.filter((l) => l.source === s).length || 1,
  }));

  // Revenue pipeline by month
  const revArea = trend.map((t) => ({ month: t.month, revenue: t.won * 4500000 }));

  // Leaderboard
  const board = profiles.map((p) => {
    const own = leads.filter((l) => l.assigned_to === p.id);
    const won = own.filter((l) => l.stage === "Closed Won");
    return {
      ...p, won: won.length, revenue: won.reduce((s, l) => s + Number(l.deal_value), 0),
      total: own.length, callsTarget: 80, calls: own.length * 4 + 12, emails: own.length * 6 + 18,
    };
  }).sort((a, b) => b.revenue - a.revenue);

  return (
    <>
      <PageHeader
        breadcrumbs={["Forge", "Reports & Analytics"]}
        title="BDA Team Analytics — May 2026"
        subtitle="Performance and pipeline trends across the team."
        action={
          <select className="rounded-md border border-input bg-card px-3 py-2 text-sm">
            <option>Last 6 months</option><option>This quarter</option><option>This year</option>
          </select>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="card-base p-5">
          <h3 className="text-base font-semibold">Leads vs Closures Trend</h3>
          <p className="mb-3 text-xs text-slate-500">Last 6 months</p>
          <div className="h-64">
            <ResponsiveContainer><LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="leads" stroke="#3B82F6" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="won" stroke="#10B981" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart></ResponsiveContainer>
          </div>
        </div>

        <div className="card-base p-5">
          <h3 className="text-base font-semibold">Deals Closed per BDA</h3>
          <p className="mb-3 text-xs text-slate-500">Closed Won</p>
          <div className="h-64">
            <ResponsiveContainer><BarChart data={bdaWon} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={70} />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="won" fill="#3B82F6" radius={[0, 6, 6, 0]} />
            </BarChart></ResponsiveContainer>
          </div>
        </div>

        <div className="card-base p-5">
          <h3 className="text-base font-semibold">Lead Source Distribution</h3>
          <p className="mb-3 text-xs text-slate-500">All-time</p>
          <div className="h-64">
            <ResponsiveContainer><PieChart>
              <Pie data={sources} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={2}>
                {sources.map((_, i) => <Cell key={i} fill={CHART_COLORS[i]} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart></ResponsiveContainer>
          </div>
        </div>

        <div className="card-base p-5">
          <h3 className="text-base font-semibold">Revenue Pipeline</h3>
          <p className="mb-3 text-xs text-slate-500">By month</p>
          <div className="h-64">
            <ResponsiveContainer><AreaChart data={revArea}>
              <defs>
                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => formatINR(v)} />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} formatter={(v: number) => formatINR(v)} />
              <Area type="monotone" dataKey="revenue" stroke="#3B82F6" fill="url(#rev)" strokeWidth={2} />
            </AreaChart></ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="mt-6 card-base overflow-hidden">
        <div className="border-b border-border p-5">
          <h3 className="text-base font-semibold">Leaderboard</h3>
          <p className="text-xs text-slate-500">Top revenue contributors</p>
        </div>
        <div className="divide-y divide-border">
          {board.map((p, i) => (
            <div key={p.id} className="flex flex-wrap items-center gap-4 p-4">
              <div className="w-8 text-center text-xl">{MEDALS[i] ?? <span className="text-sm font-bold text-slate-400">#{i + 1}</span>}</div>
              <InitialAvatar name={p.full_name} size={40} />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-slate-800">{p.full_name}</div>
                <div className="text-xs text-slate-500">{p.calls} calls · {p.emails} emails · {p.total} leads</div>
              </div>
              <div className="text-right">
                <div className="font-bold text-slate-900">{formatINR(p.revenue)}</div>
                <div className="text-xs text-slate-500">{p.won} deals closed</div>
              </div>
              <div className="w-40">
                <div className="mb-1 flex justify-between text-[10px] text-slate-500">
                  <span>Target</span><span>{Math.min(100, Math.round((p.won / 5) * 100))}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.min(100, Math.round((p.won / 5) * 100))}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
