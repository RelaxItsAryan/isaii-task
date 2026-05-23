/**
 * One-time seed of realistic dummy data when DB is empty.
 * Assigns leads to current user (since they're the only auth.user initially).
 * Additional "team member" profiles get created as fake UUIDs in profiles only —
 * they appear in team views but can't log in (no auth.users row). For full RLS
 * fidelity we only link leads to real auth users to avoid FK issues, so all
 * seeded leads are assigned to the current user.
 */
import { supabase } from "@/integrations/supabase/client";

const TEAM = [
  { name: "Aryan Sharma", region: "North", role: "manager" as const },
  { name: "Priya Mehta", region: "West", role: "executive" as const },
  { name: "Rohan Gupta", region: "South", role: "executive" as const },
  { name: "Sneha Joshi", region: "East", role: "executive" as const },
  { name: "Vikram Singh", region: "North", role: "executive" as const },
];

const COMPANIES = [
  { c: "Tata Motors", i: "Automotive" },
  { c: "Bajaj Auto", i: "Automotive" },
  { c: "Hindustan Unilever", i: "FMCG" },
  { c: "Sun Pharma", i: "Pharma" },
  { c: "Larsen & Toubro", i: "Infrastructure" },
  { c: "Reliance Industries", i: "Infrastructure" },
  { c: "Mahindra & Mahindra", i: "Automotive" },
  { c: "Asian Paints", i: "FMCG" },
  { c: "Cipla", i: "Pharma" },
  { c: "Welspun India", i: "Textiles" },
  { c: "Aditya Birla Fashion", i: "Textiles" },
  { c: "ITC Limited", i: "FMCG" },
  { c: "Dr Reddy's Labs", i: "Pharma" },
  { c: "Ashok Leyland", i: "Automotive" },
  { c: "JSW Steel", i: "Infrastructure" },
  { c: "Lupin Pharma", i: "Pharma" },
  { c: "Vardhman Textiles", i: "Textiles" },
  { c: "Britannia Industries", i: "FMCG" },
  { c: "TVS Motor", i: "Automotive" },
  { c: "Ultratech Cement", i: "Infrastructure" },
  { c: "Marico", i: "FMCG" },
  { c: "Raymond Limited", i: "Textiles" },
];

const STAGES = ["New Lead", "Contacted", "Qualified", "Proposal Sent", "Closed Won", "Closed Lost"];
const PRIORITIES = ["Hot", "Warm", "Cold"];
const SOURCES = ["Cold Call", "LinkedIn", "Referral", "Trade Fair", "Website"];
const VALUES = [800000, 1200000, 2500000, 4500000, 6500000, 8000000, 12000000];

const FIRST = ["Rajesh", "Ananya", "Suresh", "Meera", "Karan", "Divya", "Amit", "Pooja", "Rahul", "Neha"];
const LAST = ["Iyer", "Kapoor", "Verma", "Nair", "Reddy", "Patel", "Shah", "Kulkarni", "Chopra", "Banerjee"];

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function randomPhone() { return "+91 " + Math.floor(70000 + Math.random() * 9999) + " " + Math.floor(10000 + Math.random() * 89999); }
function randomEmail(co: string) {
  return pick(FIRST).toLowerCase() + "@" + co.toLowerCase().replace(/[^a-z]/g, "").slice(0, 10) + ".com";
}
function daysAgo(d: number) { return new Date(Date.now() - d * 86400000).toISOString(); }

export async function seedIfEmpty(currentUserId: string) {
  const { count } = await supabase.from("leads").select("id", { count: "exact", head: true });
  if ((count ?? 0) > 0) return;

  // Insert pseudo team profiles. We can't make auth.users for them, so we
  // generate UUIDs and insert into profiles only. They won't be FK-linked
  // anywhere (since profiles.id FK to auth.users would block this).
  // To avoid the FK constraint, we skip extra teammates and use the current user
  // as the sole assignee. The dashboard "team performance" will still display
  // the current user; in a real deployment, additional teammates sign up.
  // Update current user's profile name to "Aryan Sharma" if blank.
  const { data: me } = await supabase.from("profiles").select("full_name").eq("id", currentUserId).maybeSingle();
  if (!me?.full_name) {
    await supabase.from("profiles").update({ full_name: "Aryan Sharma", region: "North" }).eq("id", currentUserId);
  }

  // Seed leads
  const leadsPayload = COMPANIES.map((co, idx) => {
    const stage = idx < 4 ? "New Lead" : idx < 9 ? "Contacted" : idx < 13 ? "Qualified"
      : idx < 17 ? "Proposal Sent" : idx < 20 ? "Closed Won" : "Closed Lost";
    return {
      company_name: co.c,
      contact_name: `${pick(FIRST)} ${pick(LAST)}`,
      phone: randomPhone(),
      email: randomEmail(co.c),
      industry: co.i,
      source: pick(SOURCES),
      stage,
      priority: pick(PRIORITIES),
      deal_value: pick(VALUES),
      assigned_to: currentUserId,
      notes: `Initial discussion around bulk supply for ${co.c}'s ${co.i.toLowerCase()} division.`,
      stage_changed_at: daysAgo(Math.floor(Math.random() * 12)),
      updated_at: daysAgo(Math.floor(Math.random() * 5)),
      created_at: daysAgo(Math.floor(Math.random() * 30) + 5),
    };
  });
  await supabase.from("leads").insert(leadsPayload);

  // Seed clients (existing converted customers)
  await supabase.from("clients").insert([
    { company_name: "Bharat Forge", industry: "Automotive", annual_value: 24500000, health_status: "Green", contact_name: "Manish Khanna", phone: randomPhone(), email: "manish@bharatforge.com", assigned_to: currentUserId, notes: "Quarterly review scheduled." },
    { company_name: "Godrej Industries", industry: "FMCG", annual_value: 18200000, health_status: "Green", contact_name: "Sunita Rao", phone: randomPhone(), email: "sunita@godrej.com", assigned_to: currentUserId, notes: "Renewing contract next month." },
    { company_name: "Glenmark Pharma", industry: "Pharma", annual_value: 9800000, health_status: "Yellow", contact_name: "Vivek Saxena", phone: randomPhone(), email: "vivek@glenmark.com", assigned_to: currentUserId, notes: "Some delivery delays — needs attention." },
    { company_name: "Arvind Mills", industry: "Textiles", annual_value: 6500000, health_status: "Green", contact_name: "Kavita Joshi", phone: randomPhone(), email: "kavita@arvind.com", assigned_to: currentUserId },
  ]);

  // Tasks
  const today = new Date();
  await supabase.from("tasks").insert([
    { title: "Demo call with Tata Motors", description: "Walk-through of new product catalog", assigned_to: currentUserId, priority: "High", status: "Pending", due_date: new Date(today.getTime() + 86400000).toISOString() },
    { title: "Send proposal to L&T", assigned_to: currentUserId, priority: "High", status: "Pending", due_date: new Date(today.getTime() + 2 * 86400000).toISOString() },
    { title: "Follow-up with Sun Pharma procurement", assigned_to: currentUserId, priority: "Medium", status: "Pending", due_date: new Date(today.getTime() + 86400000).toISOString() },
    { title: "Quarterly review — Bharat Forge", assigned_to: currentUserId, priority: "Medium", status: "Pending", due_date: new Date(today.getTime() + 5 * 86400000).toISOString() },
    { title: "Cold call — Welspun India", assigned_to: currentUserId, priority: "Low", status: "Pending", due_date: new Date(today.getTime() + 3 * 86400000).toISOString() },
    { title: "Send renewal contract to Godrej", assigned_to: currentUserId, priority: "High", status: "Pending", due_date: new Date(today.getTime() + 7 * 86400000).toISOString() },
  ]);

  // Activities
  await supabase.from("activities").insert([
    { type: "call", description: "Aryan called Reliance Industries about Q3 supply", created_by: currentUserId, created_at: daysAgo(0) },
    { type: "email", description: "Proposal sent to L&T procurement team", created_by: currentUserId, created_at: daysAgo(0) },
    { type: "won", description: "Closed deal with Asian Paints — ₹45L contract", created_by: currentUserId, created_at: daysAgo(1) },
    { type: "call", description: "Discovery call scheduled with Mahindra", created_by: currentUserId, created_at: daysAgo(1) },
    { type: "email", description: "Quote shared with TVS Motor", created_by: currentUserId, created_at: daysAgo(2) },
    { type: "won", description: "Britannia signed annual contract ₹65L", created_by: currentUserId, created_at: daysAgo(3) },
    { type: "call", description: "Pre-demo prep with JSW Steel", created_by: currentUserId, created_at: daysAgo(4) },
    { type: "email", description: "Follow-up with Marico procurement", created_by: currentUserId, created_at: daysAgo(5) },
  ]);

  // Notifications
  await supabase.from("notifications").insert([
    { user_id: currentUserId, type: "info", message: "New lead Tata Motors assigned to you" },
    { user_id: currentUserId, type: "warn", message: "Follow-up due tomorrow: Sun Pharma" },
    { user_id: currentUserId, type: "success", message: "Deal closed: Asian Paints ₹45L" },
    { user_id: currentUserId, type: "info", message: "Target achievement at 78% for May" },
  ]);
}
