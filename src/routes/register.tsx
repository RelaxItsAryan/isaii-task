import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth, type AppRole } from "@/contexts/AuthContext";
import { Cog, RotateCw } from "lucide-react";
import toast from "react-hot-toast";

export const Route = createFileRoute("/register")({ component: RegisterPage });

function RegisterPage() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<AppRole>("executive");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    setLoading(true);
    const { error } = await signUp(email, password, fullName, role);
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Account created — signing you in…");
    setTimeout(() => navigate({ to: "/dashboard" }), 800);
  };

  return (
    <div 
      className="flex min-h-screen items-center justify-center px-4 relative overflow-hidden"
      style={{
        backgroundImage: 'url("https://th.bing.com/th/id/OIP.0Q9HZTn3iXQnHyU5jlA_3wHaEb?w=294&h=180&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" />
      <div className="relative z-10 w-full max-w-md rounded-xl bg-card/95 p-8 shadow-2xl backdrop-blur-sm border border-white/10">
        <div className="mb-6 flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-lg bg-primary text-white">
            <Cog size={20} />
          </div>
          <div>
            <div className="text-lg font-bold text-slate-900">Forge</div>
            <div className="text-xs text-slate-500">Create your account</div>
          </div>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Full name</label>
            <input
              required value={fullName} onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-md border border-input px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
              placeholder="Aryan Sharma"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
            <input
              type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-input px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Password</label>
            <input
              type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-input px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
              placeholder="Min. 6 characters"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Role</label>
            <select
              value={role} onChange={(e) => setRole(e.target.value as AppRole)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
            >
              <option value="admin">Admin</option>
              <option value="manager">BDA Manager</option>
              <option value="executive">BDA Executive</option>
            </select>
          </div>
          <button
            type="submit" disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-primary py-2.5 text-sm font-semibold text-white hover:opacity-95 disabled:opacity-60"
          >
            {loading && <RotateCw className="animate-spin" size={16} />}
            Create account
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-primary hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
