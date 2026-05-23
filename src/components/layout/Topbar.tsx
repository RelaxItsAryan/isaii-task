import { Bell, Search, LogOut, User, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { InitialAvatar } from "@/components/InitialAvatar";
import { supabase } from "@/integrations/supabase/client";
import { relTime } from "@/lib/format";
import { useNavigate } from "@tanstack/react-router";
import toast from "react-hot-toast";

interface Notif { id: string; message: string; type: string; is_read: boolean; created_at: string; }

export function Topbar() {
  const { profile, signOut, user } = useAuth();
  const navigate = useNavigate();
  const [openNotif, setOpenNotif] = useState(false);
  const [openUser, setOpenUser] = useState(false);
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const ref = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("notifications").select("*").eq("user_id", user.id)
      .order("created_at", { ascending: false }).limit(15);
    setNotifs((data as Notif[]) ?? []);
  };

  useEffect(() => { load(); }, [user]);
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpenNotif(false);
      if (userRef.current && !userRef.current.contains(e.target as Node)) setOpenUser(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const unread = notifs.filter((n) => !n.is_read).length;

  const markAll = async () => {
    if (!user) return;
    await supabase.from("notifications").update({ is_read: true }).eq("user_id", user.id);
    load();
  };

  return (
    <header className="flex h-14 items-center gap-4 border-b border-border bg-card px-6">
      <div className="relative flex-1 max-w-xl">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          placeholder="Search leads, clients, tasks…"
          className="w-full rounded-md border border-input bg-background py-2 pl-9 pr-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
        />
      </div>

      <div className="relative" ref={ref}>
        <button
          onClick={() => setOpenNotif((o) => !o)}
          className="relative grid size-9 place-items-center rounded-md hover:bg-muted"
        >
          <Bell size={20} className="text-slate-600" />
          {unread > 0 && (
            <span className="absolute -right-1 -top-1 grid min-w-[18px] place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white">
              {unread}
            </span>
          )}
        </button>
        {openNotif && (
          <div className="absolute right-0 top-12 z-50 w-80 overflow-hidden rounded-lg border border-border bg-card shadow-lg">
            <div className="flex items-center justify-between border-b border-border p-3">
              <span className="text-sm font-semibold">Notifications</span>
              <button onClick={markAll} className="text-xs text-primary hover:underline">Mark all read</button>
            </div>
            <div className="max-h-96 overflow-y-auto scrollbar-thin">
              {notifs.length === 0 ? (
                <div className="p-6 text-center text-sm text-slate-500">No notifications yet</div>
              ) : notifs.map((n) => (
                <div key={n.id} className={`border-b border-border p-3 text-sm ${n.is_read ? "" : "bg-blue-50/50"}`}>
                  <p className="text-slate-700">{n.message}</p>
                  <p className="mt-1 text-[11px] text-slate-400">{relTime(n.created_at)}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="relative" ref={userRef}>
        <button
          onClick={() => setOpenUser((o) => !o)}
          className="flex items-center gap-2 rounded-md p-1 pr-2 hover:bg-muted"
        >
          <InitialAvatar name={profile?.full_name || "User"} size={32} />
          <div className="hidden text-left leading-tight md:block">
            <div className="text-sm font-medium text-slate-800">{profile?.full_name ?? "User"}</div>
            <div className="text-[11px] text-slate-500">{profile?.email}</div>
          </div>
          <ChevronDown size={16} className="text-slate-400" />
        </button>
        {openUser && (
          <div className="absolute right-0 top-12 z-50 w-56 overflow-hidden rounded-lg border border-border bg-card shadow-lg">
            <button
              onClick={() => { setOpenUser(false); navigate({ to: "/settings" }); }}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
            >
              <User size={18} /> Profile & Settings
            </button>
            <button
              onClick={async () => { await signOut(); toast.success("Signed out"); navigate({ to: "/login" }); }}
              className="flex w-full items-center gap-2 border-t border-border px-3 py-2 text-sm text-rose-600 hover:bg-rose-50"
            >
              <LogOut size={18} /> Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
