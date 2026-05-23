import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { PageHeader } from "@/components/layout/PageHeader";
import { InitialAvatar } from "@/components/InitialAvatar";
import { supabase } from "@/integrations/supabase/client";
import toast from "react-hot-toast";

export const Route = createFileRoute("/_authenticated/settings")({ component: SettingsPage });

function SettingsPage() {
  const { profile, refreshProfile, user, role } = useAuth();
  const [full, setFull] = useState(profile?.full_name ?? "");
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [region, setRegion] = useState(profile?.region ?? "North");

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const { error } = await supabase.from("profiles")
      .update({ full_name: full, phone, region }).eq("id", user.id);
    if (error) return toast.error(error.message);
    toast.success("Profile updated");
    await refreshProfile();
  };

  return (
    <>
      <PageHeader breadcrumbs={["Forge", "Settings"]} title="Settings" subtitle="Manage your profile and preferences." />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="card-base p-6 lg:col-span-1">
          <div className="flex flex-col items-center text-center">
            <InitialAvatar name={profile?.full_name || "User"} size={88} />
            <h3 className="mt-3 font-semibold">{profile?.full_name}</h3>
            <p className="text-xs text-slate-500">{profile?.email}</p>
            <span className="badge mt-3 bg-blue-50 text-blue-700 ring-1 ring-blue-200">
              {(role ?? "executive").replace(/^./, (c) => c.toUpperCase())}
            </span>
          </div>
        </div>

        <form onSubmit={save} className="card-base space-y-4 p-6 lg:col-span-2">
          <h3 className="text-base font-semibold">Profile</h3>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Full name</label>
            <input value={full} onChange={(e) => setFull(e.target.value)} className="w-full rounded-md border border-input px-3 py-2 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Phone</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full rounded-md border border-input px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Region</label>
              <select value={region} onChange={(e) => setRegion(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                {["North", "South", "East", "West"].map((x) => <option key={x}>{x}</option>)}
              </select>
            </div>
          </div>
          <button className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white">Save changes</button>
        </form>
      </div>
    </>
  );
}
