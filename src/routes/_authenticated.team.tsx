import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { PageHeader } from "@/components/layout/PageHeader";
import { PillBadge } from "@/components/PillBadge";
import { InitialAvatar } from "@/components/InitialAvatar";
import { Mail, Phone, MapPin, UserPlus, ShieldAlert } from "lucide-react";
import { format } from "date-fns";

export const Route = createFileRoute("/_authenticated/team")({ component: TeamPage });

interface TeamMember {
  id: string; full_name: string; email: string; phone: string | null;
  region: string | null; avatar_url: string | null; status: string; join_date: string;
}
interface RoleRow { user_id: string; role: string; }

function TeamPage() {
  const { role } = useAuth();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [roles, setRoles] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data: m }, { data: r }] = await Promise.all([
        supabase.from("profiles").select("*"),
        supabase.from("user_roles").select("user_id,role"),
      ]);
      setMembers((m as TeamMember[]) ?? []);
      setRoles(Object.fromEntries(((r ?? []) as RoleRow[]).map((x) => [x.user_id, x.role])));
      setLoading(false);
    })();
  }, []);

  if (role !== "admin") {
    return (
      <>
        <PageHeader breadcrumbs={["Forge", "Team Management"]} title="Team Management" />
        <div className="card-base flex items-center gap-3 p-6">
          <ShieldAlert className="size-5 text-amber-500" />
          <p className="text-sm text-slate-700">This area is restricted to admins.</p>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        breadcrumbs={["Forge", "Team Management"]}
        title="Team Management"
        subtitle={`${members.length} team members`}
        action={
          <button className="inline-flex items-center gap-2 rounded-md bg-primary px-3.5 py-2 text-sm font-semibold text-white">
            <UserPlus className="size-4" /> Invite Member
          </button>
        }
      />

      {loading ? (
        <div className="text-sm text-slate-400">Loading…</div>
      ) : (
        <div className="card-base overflow-hidden">
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Member</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Region</th>
                  <th className="px-4 py-3">Joined</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m.id} className="border-t border-border hover:bg-slate-50/60">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <InitialAvatar name={m.full_name} size={36} />
                        <div className="font-medium text-slate-800">{m.full_name || "—"}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <PillBadge tone={roles[m.id] === "admin" ? "violet" : roles[m.id] === "manager" ? "blue" : "gray"}>
                        {(roles[m.id] ?? "executive").replace(/^./, (c) => c.toUpperCase())}
                      </PillBadge>
                    </td>
                    <td className="px-4 py-3 text-slate-600"><span className="inline-flex items-center gap-1.5"><Mail className="size-3 text-slate-400" />{m.email}</span></td>
                    <td className="px-4 py-3 text-slate-600">{m.phone ? <span className="inline-flex items-center gap-1.5"><Phone className="size-3 text-slate-400" />{m.phone}</span> : "—"}</td>
                    <td className="px-4 py-3 text-slate-600"><span className="inline-flex items-center gap-1.5"><MapPin className="size-3 text-slate-400" />{m.region ?? "—"}</span></td>
                    <td className="px-4 py-3 text-xs text-slate-500">{format(new Date(m.join_date), "MMM d, yyyy")}</td>
                    <td className="px-4 py-3"><PillBadge tone={m.status === "Active" ? "green" : "gray"} dot>{m.status}</PillBadge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
