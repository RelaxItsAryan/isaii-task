import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { PageHeader } from "@/components/layout/PageHeader";
import { PillBadge } from "@/components/PillBadge";
import { Plus, X, ChevronLeft, ChevronRight, Check } from "lucide-react";
import { seedIfEmpty } from "@/lib/seed";
import { format, startOfMonth, endOfMonth, addMonths, subMonths, eachDayOfInterval, startOfWeek, endOfWeek, isSameDay, isSameMonth, parseISO } from "date-fns";
import toast from "react-hot-toast";

export const Route = createFileRoute("/_authenticated/tasks")({ component: TasksPage });

interface Task {
  id: string; title: string; description: string | null;
  due_date: string; priority: string; status: string;
  assigned_to: string | null; lead_id: string | null;
}

const PRIO_TONE: Record<string, "red" | "amber" | "cyan"> = { High: "red", Medium: "amber", Low: "cyan" };

function TasksPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [month, setMonth] = useState(new Date());
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data } = await supabase.from("tasks").select("*").order("due_date");
    setTasks((data as Task[]) ?? []);
    setLoading(false);
  };
  useEffect(() => { (async () => { if (user) await seedIfEmpty(user.id); load(); })(); }, [user]);

  const days = useMemo(() => eachDayOfInterval({
    start: startOfWeek(startOfMonth(month)), end: endOfWeek(endOfMonth(month)),
  }), [month]);

  const toggleDone = async (t: Task) => {
    const next = t.status === "Done" ? "Pending" : "Done";
    await supabase.from("tasks").update({ status: next }).eq("id", t.id);
    toast.success(next === "Done" ? "Marked done" : "Reopened");
    load();
  };

  return (
    <>
      <PageHeader
        breadcrumbs={["Forge", "Tasks & Follow-ups"]}
        title="Tasks & Follow-ups"
        subtitle={`${tasks.filter((t) => t.status === "Pending").length} pending`}
        action={
          <button onClick={() => setShowAdd(true)} className="inline-flex items-center gap-2 rounded-md bg-primary px-3.5 py-2 text-sm font-semibold text-white">
            <Plus size={18} /> Add Task
          </button>
        }
      />

      <div className="card-base mb-6 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold">{format(month, "MMMM yyyy")}</h2>
          <div className="flex gap-1">
            <button onClick={() => setMonth(subMonths(month, 1))} className="rounded-md border border-border p-1.5 hover:bg-muted"><ChevronLeft size={18} /></button>
            <button onClick={() => setMonth(new Date())} className="rounded-md border border-border px-3 py-1 text-xs">Today</button>
            <button onClick={() => setMonth(addMonths(month, 1))} className="rounded-md border border-border p-1.5 hover:bg-muted"><ChevronRight size={18} /></button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-px overflow-hidden rounded-md bg-border text-xs">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="bg-slate-50 px-2 py-1 font-semibold text-slate-500">{d}</div>
          ))}
          {days.map((d) => {
            const dayTasks = tasks.filter((t) => isSameDay(parseISO(t.due_date), d));
            const today = isSameDay(d, new Date());
            return (
              <div key={d.toISOString()} className={`min-h-[90px] bg-card p-1.5 ${isSameMonth(d, month) ? "" : "bg-slate-50/50 text-slate-400"}`}>
                <div className={`mb-1 inline-flex size-6 items-center justify-center rounded-full text-xs ${today ? "bg-primary text-white font-bold" : ""}`}>
                  {format(d, "d")}
                </div>
                {dayTasks.slice(0, 2).map((t) => (
                  <div key={t.id} className={`mb-0.5 truncate rounded px-1.5 py-0.5 text-[10px] font-medium ${t.priority === "High" ? "bg-rose-100 text-rose-700"
                      : t.priority === "Medium" ? "bg-amber-100 text-amber-700"
                        : "bg-cyan-100 text-cyan-700"
                    } ${t.status === "Done" ? "line-through opacity-60" : ""}`}>
                    {t.title}
                  </div>
                ))}
                {dayTasks.length > 2 && <div className="text-[10px] text-slate-400">+{dayTasks.length - 2}</div>}
              </div>
            );
          })}
        </div>
      </div>

      <div className="card-base overflow-hidden">
        <div className="border-b border-border px-5 py-3">
          <h2 className="text-base font-semibold">All Tasks</h2>
        </div>
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="w-10 px-4 py-3"></th>
                <th className="px-4 py-3">Task</th>
                <th className="px-4 py-3">Due</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="p-6 text-center text-slate-400">Loading…</td></tr>
              ) : tasks.length === 0 ? (
                <tr><td colSpan={5} className="p-6 text-center text-slate-400">No tasks yet.</td></tr>
              ) : tasks.map((t) => (
                <tr key={t.id} className="border-t border-border hover:bg-slate-50/60">
                  <td className="px-4 py-3">
                    <button onClick={() => toggleDone(t)}
                      className={`grid size-5 place-items-center rounded border ${t.status === "Done" ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-300 hover:border-primary"}`}>
                      {t.status === "Done" && <Check size={14} />}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className={`font-medium ${t.status === "Done" ? "text-slate-400 line-through" : "text-slate-800"}`}>{t.title}</div>
                    {t.description && <div className="text-xs text-slate-500">{t.description}</div>}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600">{format(parseISO(t.due_date), "MMM d, h:mm a")}</td>
                  <td className="px-4 py-3"><PillBadge tone={PRIO_TONE[t.priority] ?? "gray"}>{t.priority}</PillBadge></td>
                  <td className="px-4 py-3">
                    <PillBadge tone={t.status === "Done" ? "green" : t.status === "In Progress" ? "blue" : "gray"}>{t.status}</PillBadge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4" onClick={() => setShowAdd(false)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-xl bg-card p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold">New Task</h2>
              <button onClick={() => setShowAdd(false)} className="rounded-md p-1 hover:bg-muted"><X size={18} /></button>
            </div>
            <TaskForm onDone={() => { setShowAdd(false); load(); }} />
          </div>
        </div>
      )}
    </>
  );
}

function TaskForm({ onDone }: { onDone: () => void }) {
  const { user } = useAuth();
  const [f, setF] = useState({
    title: "", description: "", priority: "Medium", status: "Pending",
    due_date: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
  });
  return (
    <form onSubmit={async (e) => {
      e.preventDefault();
      const { error } = await supabase.from("tasks").insert({
        ...f, assigned_to: user?.id, due_date: new Date(f.due_date).toISOString(),
      });
      if (error) return toast.error(error.message);
      toast.success("Task created");
      onDone();
    }} className="space-y-3">
      <input required placeholder="Title" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })}
        className="w-full rounded-md border border-input px-3 py-2 text-sm" />
      <textarea placeholder="Description" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} rows={3}
        className="w-full rounded-md border border-input px-3 py-2 text-sm" />
      <input type="datetime-local" value={f.due_date} onChange={(e) => setF({ ...f, due_date: e.target.value })}
        className="w-full rounded-md border border-input px-3 py-2 text-sm" />
      <select value={f.priority} onChange={(e) => setF({ ...f, priority: e.target.value })}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
        {["High", "Medium", "Low"].map((x) => <option key={x}>{x}</option>)}
      </select>
      <button type="submit" className="w-full rounded-md bg-primary py-2.5 text-sm font-semibold text-white">Create Task</button>
    </form>
  );
}
