import { useState, useEffect, useRef } from "react";
import { supabase, roleInfo, allowedFor, canOpen, stampLogin, adminCall } from "./supabase.js";
import { MENTORS, mentorById, buildCrmContext, classifyInappropriate, logAi } from "./mentors.js";
import {
  LayoutDashboard, UserCircle, FileText, UserPlus, Kanban, BarChart3,
  ShieldAlert, Building2, Gauge, Briefcase, Coins, Settings, Menu, X,
  Phone, MessageCircle, Mail, Search, Bell, ChevronRight, ChevronDown,
  Flame, Clock, MapPin, Eye, EyeOff, Lock, AlertTriangle, CheckCircle2,
  TrendingUp, Users, Wallet, Star, Calendar, Filter, Plus, ArrowUpRight,
  ArrowDownRight, CircleDot, Ban, Download, Globe, Smartphone, Sun, Moon, Unlock, Send, Bot, Fingerprint, KeyRound, LogOut,
  Database, RefreshCw, Upload, Sparkle
} from "lucide-react";

/* ================================ TOKENS ================================= */
const T = {
  ink: "var(--ink)", inkSoft: "var(--inkSoft)", muted: "var(--muted)", faint: "var(--faint)",
  bone: "var(--bone)", paper: "var(--paper)", hair: "var(--hair)", hairSoft: "var(--hairSoft)",
  gold: "var(--gold)", goldBright: "var(--goldBright)", goldSoft: "var(--goldSoft)", goldEdge: "var(--goldEdge)",
  ok: "var(--ok)", okSoft: "var(--okSoft)", warn: "var(--warn)", warnSoft: "var(--warnSoft)",
  bad: "var(--bad)", badSoft: "var(--badSoft)", info: "var(--info)", infoSoft: "var(--infoSoft)",
  hero: "var(--hero)", side: "var(--side)", btnBg: "var(--btnBg)", btnFg: "var(--btnFg)",
  goldTint: "var(--goldTint)", wm: "var(--wm)", shadow: "var(--shadow)", shadowLg: "var(--shadowLg)",
};
const THEME_CSS = `
  [data-amber] {
    --ink:#2E263D; --inkSoft:#4B465C; --muted:#6E6B7B; --faint:#A5A2B2;
    --bone:#F4F5FA; --paper:#FFFFFF; --hair:#EAEAEF; --hairSoft:#F3F3F8;
    --gold:#8C57FF; --goldBright:#9B6BFF; --goldSoft:#F1EAFF; --goldEdge:#E4D7FF;
    --ok:#56CA00; --okSoft:#EAF8DD; --warn:#FFB400; --warnSoft:#FFF3DA;
    --bad:#FF4C51; --badSoft:#FFE6E7; --info:#16B1FF; --infoSoft:#E0F4FF;
    --hero:#2B2C40; --side:#FFFFFF; --btnBg:#8C57FF; --btnFg:#FFFFFF;
    --goldTint:#F7F3FF; --wm:rgba(140,87,255,.06);
    --shadow:0 2px 8px rgba(76,78,100,.10); --shadowLg:0 6px 24px rgba(76,78,100,.16);
    --sideText:#5B5769; --sideActiveText:#FFFFFF; --sideActiveBg:linear-gradient(72deg,#9168FF 0%,#8C57FF 100%); --sideBorder:#ECECF2; --sideBrand:#2E263D;
  }
  [data-amber="dark"] {
    --ink:#E7E3FC; --inkSoft:#D5D2E8; --muted:#A9A6C0; --faint:#6E6B8C;
    --bone:#28243D; --paper:#312D4B; --hair:#3B3759; --hairSoft:#353150;
    --gold:#9E72FF; --goldBright:#B492FF; --goldSoft:#3A335A; --goldEdge:#4D4673;
    --ok:#56CA00; --okSoft:#22300F; --warn:#FFB400; --warnSoft:#33290F;
    --bad:#FF4C51; --badSoft:#3A1B1D; --info:#16B1FF; --infoSoft:#0F2A3A;
    --hero:#232132; --side:#2B2940; --btnBg:#8C57FF; --btnFg:#FFFFFF;
    --goldTint:#2A2447; --wm:rgba(158,114,255,.08);
    --shadow:0 2px 8px rgba(0,0,0,.35); --shadowLg:0 6px 24px rgba(0,0,0,.5);
    --sideText:rgba(231,227,252,.72); --sideActiveText:#FFFFFF; --sideActiveBg:linear-gradient(72deg,#9168FF 0%,#8C57FF 100%); --sideBorder:rgba(255,255,255,.07); --sideBrand:#FFFFFF;
  }
  [data-amber] * { box-sizing: border-box; }
  [data-amber] button, [data-amber] select { transition: background .18s ease, border-color .18s ease, color .18s ease, transform .12s ease, box-shadow .18s ease; }
  [data-amber] button:hover { transform: translateY(-1px); }
  [data-amber] button:active { transform: translateY(0); }
  [data-amber] button:focus-visible, [data-amber] select:focus-visible { outline: 2px solid var(--goldBright); outline-offset: 2px; }
  [data-amber] ::selection { background: var(--goldSoft); }
  [data-amber] [style*="Plus Jakarta"] { font-weight: 800; letter-spacing: -0.015em; }
  @media (prefers-reduced-motion: reduce) { [data-amber] button { transition: none; } [data-amber] button:hover { transform: none; } }
  /* ===== full theme templates (base + accent) ===== */
  [data-accent="emerald"] {
    --gold:#1F6B52; --goldBright:#3D9474; --goldSoft:#E0EEE8; --goldEdge:#B9D8CB; --goldTint:#F2F9F6; --wm:rgba(31,107,82,.07);
    --bone:#EFF4F0; --paper:#FDFFFE; --hair:#DCE6DF; --hairSoft:#E9F0EB;
    --ink:#101713; --inkSoft:#3E4A43; --muted:#73847A; --faint:#A3B3A9;
    --side:#0C1511; --hero:#0C1511; --btnBg:#101713; --btnFg:#FFFFFF;
    --shadow:0 1px 2px rgba(16,23,19,.04), 0 6px 18px rgba(16,23,19,.05);
    --shadowLg:0 2px 4px rgba(16,23,19,.06), 0 16px 40px rgba(16,23,19,.10);
  }
  [data-amber="dark"][data-accent="emerald"] {
    --gold:#4CAE8A; --goldBright:#6FCBA8; --goldSoft:#152620; --goldEdge:#28473A; --goldTint:#121F1A; --wm:rgba(76,174,138,.07);
    --bone:#0E1512; --paper:#151F1A; --hair:#23312A; --hairSoft:#1C2922;
    --ink:#E4EFE9; --inkSoft:#AEC2B7; --muted:#7E938A; --faint:#54655D;
    --side:#091009; --hero:#091009; --btnBg:#E4EFE9; --btnFg:#101713;
    --shadow:0 1px 2px rgba(0,0,0,.3), 0 6px 18px rgba(0,0,0,.25);
    --shadowLg:0 2px 4px rgba(0,0,0,.4), 0 16px 40px rgba(0,0,0,.45);
  }
  [data-accent="sapphire"] {
    --gold:#2C4E78; --goldBright:#4A77A8; --goldSoft:#E2EAF3; --goldEdge:#BDCFE2; --goldTint:#F3F7FB; --wm:rgba(44,78,120,.07);
    --bone:#EFF2F6; --paper:#FDFEFF; --hair:#DCE3EB; --hairSoft:#E9EEF4;
    --ink:#101622; --inkSoft:#3E4858; --muted:#74808F; --faint:#A4AFBE;
    --side:#0B121E; --hero:#0B121E; --btnBg:#101622; --btnFg:#FFFFFF;
    --shadow:0 1px 2px rgba(16,22,34,.04), 0 6px 18px rgba(16,22,34,.05);
    --shadowLg:0 2px 4px rgba(16,22,34,.06), 0 16px 40px rgba(16,22,34,.10);
  }
  [data-amber="dark"][data-accent="sapphire"] {
    --gold:#6B9BCC; --goldBright:#8FB8E0; --goldSoft:#141E2B; --goldEdge:#293F58; --goldTint:#111A25; --wm:rgba(107,155,204,.07);
    --bone:#0D1219; --paper:#141B25; --hair:#222D3C; --hairSoft:#1B2530;
    --ink:#E5EBF3; --inkSoft:#AFBDCF; --muted:#7E8B9C; --faint:#535F6F;
    --side:#080D15; --hero:#080D15; --btnBg:#E5EBF3; --btnFg:#101622;
    --shadow:0 1px 2px rgba(0,0,0,.3), 0 6px 18px rgba(0,0,0,.25);
    --shadowLg:0 2px 4px rgba(0,0,0,.4), 0 16px 40px rgba(0,0,0,.45);
  }
  [data-accent="burgundy"] {
    --gold:#7C2D3E; --goldBright:#A8536A; --goldSoft:#F2E2E6; --goldEdge:#DEBDC6; --goldTint:#FAF4F6; --wm:rgba(124,45,62,.07);
    --bone:#F5F0F1; --paper:#FFFDFE; --hair:#E7DCDF; --hairSoft:#F0E8EA;
    --ink:#1A1114; --inkSoft:#4C3E43; --muted:#8B7980; --faint:#B8A8AE;
    --side:#170C10; --hero:#170C10; --btnBg:#1A1114; --btnFg:#FFFFFF;
    --shadow:0 1px 2px rgba(26,17,20,.04), 0 6px 18px rgba(26,17,20,.05);
    --shadowLg:0 2px 4px rgba(26,17,20,.06), 0 16px 40px rgba(26,17,20,.10);
  }
  [data-amber="dark"][data-accent="burgundy"] {
    --gold:#C26B82; --goldBright:#DA8FA3; --goldSoft:#281519; --goldEdge:#4A2832; --goldTint:#211115; --wm:rgba(194,107,130,.07);
    --bone:#140D0F; --paper:#1D1418; --hair:#2F2226; --hairSoft:#271A1E;
    --ink:#F0E4E8; --inkSoft:#C9B3BA; --muted:#967F87; --faint:#62525A;
    --side:#0F0709; --hero:#0F0709; --btnBg:#F0E4E8; --btnFg:#1A1114;
    --shadow:0 1px 2px rgba(0,0,0,.3), 0 6px 18px rgba(0,0,0,.25);
    --shadowLg:0 2px 4px rgba(0,0,0,.4), 0 16px 40px rgba(0,0,0,.45);
  }
`;
const DISPLAY = "'Plus Jakarta Sans', system-ui, sans-serif";
const UI = "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif";
const dubaiHour = () => { try { return parseInt(new Date().toLocaleString("en-US", { timeZone: "Asia/Dubai", hour: "2-digit", hour12: false }), 10) % 24; } catch (e) { return new Date().getHours(); } };
const greetWord = (h) => h >= 5 && h < 12 ? "Good morning" : h >= 12 && h < 17 ? "Good afternoon" : h >= 17 && h < 22 ? "Good evening" : "Good night";
const dubaiToday = () => { try { return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Dubai" }); } catch (e) { return new Date().toISOString().slice(0,10); } };
const firstName = (n) => (n || "there").trim().split(/\s+/)[0];
// Log a lead action to the activity trail (RLS: actor must be the signed-in user).
function logAction(action, lead, actorId, extra) {
  if (!actorId) return;
  try { supabase.from("lead_activity").insert({ lead_id: (lead && lead.id) || null, actor_id: actorId, action,
    detail: { client: lead && lead.client_name, lead_code: lead && lead.lead_code, ...(extra || {}) } }).then(() => {}, () => {}); } catch (e) {}
}

/* ================================ MOCK DATA ============================== */
const AGENTS = [
  { id: "a1", name: "Derya Altun", initials: "DA", deals: 7, pipeline: 41.2, conv: 18, resp: "11m", leads: 34, score: 92 },
  { id: "a2", name: "Omar Farouk", initials: "OF", deals: 5, pipeline: 28.6, conv: 14, resp: "26m", leads: 41, score: 81 },
  { id: "a3", name: "Lara Petrova", initials: "LP", deals: 4, pipeline: 22.1, conv: 12, resp: "19m", leads: 29, score: 76 },
  { id: "a4", name: "Bilal Hussain", initials: "BH", deals: 2, pipeline: 9.4, conv: 7, resp: "1h 12m", leads: 38, score: 54 },
];
const LEADS = [
  { id: "L-2418", name: "Mr. Vishal Kalantri", phone: "+91 98•• ••• 177", phoneFull: "+91 98204 41177",
    email: "v•••••@balaji.co.in", nationality: "India", residence: "Mumbai", budget: "AED 22–25M",
    purpose: "Golden Visa", area: "Palm Jumeirah", developer: "Nakheel", ptype: "Penthouse", ready: "Ready",
    beds: "4 BR", finance: "Cash", timeline: "1–2 months", lang: "English / Hindi", source: "Referral",
    temp: "Very Hot", status: "Negotiation", agent: "Derya Altun", next: "Today 4:30 PM", last: "Yesterday",
    score: 91 },
  { id: "L-2422", name: "Asim Noor", phone: "+971 58 ••• 7887", budget: "AED 6–7M", area: "Tilal Al Ghaf",
    ptype: "Villa", temp: "Hot", status: "Site Visit / Zoom Booked", agent: "Omar Farouk", next: "Tomorrow", score: 78 },
  { id: "L-2431", name: "Kamil Khan", phone: "+971 55 ••• 4449", budget: "AED 1.6M", area: "Downtown",
    ptype: "Apartment", temp: "Warm", status: "Investment Options Sent", agent: "Lara Petrova", next: "Fri", score: 64 },
  { id: "L-2433", name: "Diana Gunn", phone: "+44 77•• ••• 231", budget: "AED 3.2M", area: "Dubai Hills",
    ptype: "Townhouse", temp: "Hot", status: "Qualified", agent: "Derya Altun", next: "Today", score: 72 },
  { id: "L-2436", name: "Sergei Volkov", phone: "+7 91• ••• 4410", budget: "AED 12M", area: "Jumeirah Bay",
    ptype: "Villa", temp: "Warm", status: "Contacted", agent: "Omar Farouk", next: "Mon", score: 69 },
  { id: "L-2440", name: "Fatima Al Said", phone: "+971 50 ••• 9921", budget: "AED 4.5M", area: "MJL",
    ptype: "Apartment", temp: "Cold", status: "First Contact Pending", agent: "Bilal Hussain", next: "—", score: 41 },
];
const POOL = [
  { id: "L-2451", name: "Chen Wei", source: "Property Finder", budget: "AED 2.8M", lang: "Mandarin", area: "Business Bay", mins: 4 },
  { id: "L-2452", name: "Amara Okafor", source: "Meta Ads — PJA Launch", budget: "AED 5M+", lang: "English", area: "Palm Jebel Ali", mins: 11 },
  { id: "L-2453", name: "Hassan Raza", source: "Bayut", budget: "AED 1.2M", lang: "Urdu", area: "JVC", mins: 19 },
  { id: "L-2454", name: "Elena Markova", source: "WhatsApp Campaign", budget: "AED 9M", lang: "Russian", area: "Emaar Beachfront", mins: 32 },
];
const OPEN_LEADS = [
  { id: "L-2188", name: "Rashid Al Habtoor", project: "Palm Jebel Ali — Frond K", ptype: "Off-plan", budget: "AED 16M",
    days: 74, lastAgent: "Bilal Hussain", phone: "+971 50 ••• 2214", phoneFull: "+971 50 884 2214", email: "r•••••@gmail.com", emailFull: "rashid.alh@gmail.com" },
  { id: "L-2204", name: "Priya Venkatesh", project: "Jomana, MJL", ptype: "Off-plan", budget: "AED 3.1M",
    days: 68, lastAgent: "Omar Farouk", phone: "+91 99•• ••• 410", phoneFull: "+91 99021 76410", email: "p•••••@yahoo.com", emailFull: "priya.venk@yahoo.com" },
  { id: "L-2217", name: "Tom Beckett", project: "Dubai Hills Estate", ptype: "Ready", budget: "AED 4.4M",
    days: 66, lastAgent: "Lara Petrova", phone: "+44 79•• ••• 882", phoneFull: "+44 7912 334 882", email: "t•••••@outlook.com", emailFull: "tbeckett@outlook.com" },
  { id: "L-2225", name: "Noura Al Suwaidi", project: "Acres Phase 2", ptype: "Off-plan", budget: "AED 5.8M",
    days: 61, lastAgent: "Bilal Hussain", phone: "+971 55 ••• 7731", phoneFull: "+971 55 209 7731", email: "n•••••@hotmail.com", emailFull: "noura.sw@hotmail.com" },
];
const PIPE = [
  ["New Lead", 12], ["Assigned", 8], ["Contacted", 14], ["Qualified", 9],
  ["Options Sent", 7], ["Site Visit Booked", 5], ["Negotiation", 4], ["EOI Collected", 3], ["SPA Stage", 2],
];
const SUS = [
  { sev: "high", when: "Today 09:41", who: "Bilal Hussain", what: "Honeypot lead opened and phone revealed", meta: "Lead L-2399 (canary) · Chrome · 94.203.••.•• (Dubai)", action: "Account suspended pending review" },
  { sev: "high", when: "Yesterday 23:17", who: "Bilal Hussain", what: "47 leads viewed in 6 minutes", meta: "Velocity threshold ×9 · new device fingerprint", action: "Admin alerted · session terminated" },
  { sev: "med", when: "Yesterday 22:58", who: "Bilal Hussain", what: "Login from new device, off-hours", meta: "Windows · TOR exit node suspected", action: "2FA challenge passed · flagged" },
  { sev: "med", when: "Tue 14:22", who: "Omar Farouk", what: "Export attempt blocked", meta: "Tried CSV download on team list", action: "Blocked · logged · manager notified" },
  { sev: "low", when: "Mon 10:05", who: "Lara Petrova", what: "Bulk phone reveals (12 in 10 min)", meta: "Within campaign call-block window", action: "Auto-cleared · pattern consistent with call sprint" },
];
const PROJECTS = [
  { name: "Palm Jebel Ali — Beach Villas", dev: "Nakheel", price: "From AED 18.9M", type: "Villa", handover: "Q4 2027",
    plan: "80/20", yieldPct: "5.2%", score: 88, match: 96 },
  { name: "Jomana, Madinat Jumeirah Living", dev: "Meraas", price: "From AED 2.3M", type: "Apartment", handover: "Q2 2026",
    plan: "75/25", yieldPct: "6.1%", score: 84, match: 89 },
  { name: "Acres Phase 2", dev: "Meraas", price: "From AED 5.1M", type: "Villa", handover: "Q1 2028",
    plan: "70/30", yieldPct: "5.6%", score: 79, match: 82 },
  { name: "Emaar Beachfront — Seapoint", dev: "Emaar", price: "From AED 3.4M", type: "Apartment", handover: "Q3 2026",
    plan: "90/10", yieldPct: "5.9%", score: 81, match: 74 },
];
const SCORE_FACTORS = [
  ["Developer reputation", 12, 9.5], ["Location demand", 12, 9.0], ["Price vs market", 12, 8.0],
  ["Rental yield", 11, 7.5], ["Capital appreciation", 11, 9.0], ["Payment-plan quality", 10, 8.5],
  ["Resale liquidity", 10, 8.0], ["Supply risk", 8, 7.0], ["Service-charge risk", 7, 8.0], ["End-user demand", 7, 9.0],
];
const CANDIDATES = [
  { name: "Sara Mahmoud", role: "Senior Sales Agent", stage: "Offer Sent", src: "LinkedIn", lang: "Arabic / English", exp: "6 yrs · off-plan", fit: 92 },
  { name: "Viktor Ionescu", role: "Sales Agent", stage: "Final Interview", src: "Referral", lang: "Romanian / English", exp: "4 yrs · luxury resale", fit: 84 },
  { name: "Mei Lin", role: "Sales Agent (Mandarin)", stage: "Screening", src: "Bayt", lang: "Mandarin / English", exp: "3 yrs · CN investors", fit: 78 },
  { name: "Adeel Khan", role: "Telesales Executive", stage: "Applied", src: "Indeed", lang: "Urdu / English", exp: "2 yrs", fit: 61 },
];
const COMMISSIONS = [
  { deal: "D-118", client: "R. Mehta", project: "Jomana, MJL", value: 4.85, pct: 2, gross: 97000, agent: "Derya Altun", agentCut: 48500, status: "Paid", invoice: "Settled" },
  { deal: "D-119", client: "A. Mansouri", project: "PJA Frond M", value: 19.2, pct: 2, gross: 384000, agent: "Derya Altun", agentCut: 192000, status: "Pending", invoice: "Sent" },
  { deal: "D-120", client: "K. Osei", project: "Acres Ph. 2", value: 6.4, pct: 2, gross: 128000, agent: "Omar Farouk", agentCut: 57600, status: "Pending", invoice: "Draft" },
  { deal: "D-121", client: "T. Nakamura", project: "Seapoint", value: 3.4, pct: 2, gross: 68000, agent: "Lara Petrova", agentCut: 30600, status: "Paid", invoice: "Settled" },
];
const NAV = [
  ["live", "Leads (Live)", Database],
  ["admin", "Admin Dashboard", LayoutDashboard],
  ["users", "Users & Agents", Users],
  ["agent", "Agent Dashboard", UserCircle],
  ["assign", "Lead Assignment", UserPlus],
  ["pipeline", "Pipeline Board", Kanban],
  ["open", "Open Leads", Unlock],
  ["performance", "Agent Performance", BarChart3],
  ["security", "Suspicious Activity", ShieldAlert],
  ["matching", "Property Matching", Building2],
  ["score", "Investment Score", Gauge],
  ["careers", "Careers / Hiring", Briefcase],
  ["commission", "Commissions", Coins],
  ["settings", "Settings & Permissions", Settings],
];

// Role-aware screen titles: agents see friendly labels, not "Leads (Live)" / DB wording.
function screenLabel(screen, user) {
  const isAgent = user && user.role === "agent";
  if (screen === "live") return isAgent ? "My Leads" : "Leads (Live)";
  if (screen === "agent") return isAgent ? "My Dashboard" : "Agent Dashboard";
  const n = NAV.find(([k]) => k === screen);
  return n ? n[1] : "";
}

/* ================================= SHELL ================================= */
export default function App() {
  const [screen, setScreen] = useState("admin");
  const [navOpen, setNavOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const [user, setUser] = useState(null); // {name, role, email, roleLabel}
  const [authChecked, setAuthChecked] = useState(false);
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user && mounted) {
        const { data: prof } = await supabase.from("profiles").select("full_name, role, active").eq("id", session.user.id).single();
        if (prof && prof.active !== false) {
          const ri = roleInfo(prof.role);
          setUser({ name: prof.full_name || session.user.email, email: session.user.email, role: prof.role,
            roleLabel: ri.label, id: session.user.id, mustChangePw: !!prof.force_password_change });
          setScreen(ri.home === "agent" ? "agent" : "admin");
          stampLogin(session.user.id);
        }
      }
      if (mounted) setAuthChecked(true);
    })();
    return () => { mounted = false; };
  }, []);
  const signOut = async () => { await supabase.auth.signOut(); setUser(null); };
  const [accent, setAccent] = useState("gold");
  const ACCENTS = [["gold", "Violet", "#7C5CFA"], ["emerald", "Emerald", "#1F6B52"],
    ["sapphire", "Sapphire", "#2C4E78"], ["burgundy", "Burgundy", "#7C2D3E"]];
  const [narrow, setNarrow] = useState(typeof window !== "undefined" && window.innerWidth < 900);
  useEffect(() => {
    const f = () => setNarrow(window.innerWidth < 900);
    window.addEventListener("resize", f); return () => window.removeEventListener("resize", f);
  }, []);
  useEffect(() => {
    const l = document.createElement("link"); l.rel = "stylesheet";
    l.href = "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap";
    document.head.appendChild(l); return () => { try { document.head.removeChild(l); } catch (e) {} };
  }, []);
  const [filter, setFilter] = useState(null);
  const [detailId, setDetailId] = useState(null);
  const go = (s, f = null) => { setScreen(s); setFilter(f); setNavOpen(false); };
  const openLead = (id) => { setDetailId(id); setScreen("lead"); setFilter(null); setNavOpen(false); };
  // role guard — agents may only open their own surfaces
  useEffect(() => {
    if (user && !canOpen(user.role, screen)) {
      setScreen(roleInfo(user.role).home === "agent" ? "agent" : "admin");
    }
  }, [user, screen]);
  const SCREENS = {
    live: <LiveLeads user={user} filter={filter} go={go} openLead={openLead} />, users: <UsersAdmin user={user} />, admin: <AdminDash go={go} />, agent: <AgentDash go={go} user={user} openLead={openLead} />, lead: <LeadDetail leadId={detailId} user={user} go={go} />, open: <OpenLeads />,
    assign: <Assignment />, pipeline: <Pipeline go={go} />, performance: <Performance />,
    security: <SecurityLog />, matching: <Matching go={go} />, score: <ScorePage />,
    careers: <Careers />, commission: <Commission />, settings: <SettingsPage />,
  };
  return (
    <div data-amber={dark ? "dark" : "light"} data-accent={accent} style={{ fontFamily: UI, background: T.bone, minHeight: 600, display: "flex", color: T.ink,
      transition: "background .25s ease" }}>
      <style>{THEME_CSS}</style>
      {!user && <LoginFlow onLogin={(u) => { setUser(u); setScreen(u.home === "agent" ? "agent" : "admin"); }} dark={dark} setDark={setDark} />}
      {user && user.mustChangePw && <ForcedPasswordChange onDone={async () => {
        await supabase.from("profiles").update({ force_password_change: false }).eq("id", user.id);
        setUser({ ...user, mustChangePw: false });
      }} signOut={signOut} />}
      {/* sidebar */}
      {user && (!narrow || navOpen) && (
        <aside style={{ width: 232, background: T.side, color: "var(--sideText, #fff)", flexShrink: 0, display: "flex",
          flexDirection: "column", position: narrow ? "fixed" : "sticky", top: 0, height: narrow ? "100%" : "100vh", transition: "background .25s ease",
          borderRight: "1px solid var(--sideBorder, transparent)",
          zIndex: 50, boxShadow: narrow ? "0 0 60px rgba(0,0,0,.4)" : "none" }}>
          <div style={{ padding: "22px 20px 18px", borderBottom: "1px solid var(--sideBorder, rgba(140,87,255,.18))" }}>
            <div style={{ fontFamily: DISPLAY, fontSize: 19, letterSpacing: ".22em", color: "var(--sideBrand, #fff)", fontWeight: 500 }}>AMBER</div>
            <div style={{ fontFamily: DISPLAY, fontSize: 10.5, letterSpacing: ".42em", color: T.gold, marginTop: 3, fontWeight: 400 }}>HOMES</div>
          </div>
          <nav style={{ flex: 1, overflowY: "auto", padding: "12px 12px" }}>
            {NAV.filter(([k]) => user && canOpen(user.role, k)).map(([k, label0, Ic]) => {
              const label = screenLabel(k, user);
              const on = screen === k;
              return (
                <button key={k} onClick={() => go(k)} style={{ display: "flex", alignItems: "center", gap: 11,
                  width: "100%", textAlign: "left", background: on ? "var(--sideActiveBg, rgba(140,87,255,.16))" : "transparent",
                  border: "none", color: on ? "var(--sideActiveText, #fff)" : "var(--sideText, rgba(255,255,255,.66))",
                  padding: "10px 13px", borderRadius: 10, boxShadow: on ? "0 4px 10px rgba(140,87,255,.32)" : "none",
                  fontSize: 13, fontWeight: on ? 600 : 500, cursor: "pointer", fontFamily: UI, marginBottom: 3 }}>
                  <Ic size={16} /> {label}
                </button>
              );
            })}
          </nav>
          <div style={{ padding: "14px 20px", borderTop: "1px solid var(--sideBorder, rgba(255,255,255,.08))", fontSize: 11,
            color: "var(--sideText, rgba(255,255,255,.5))", lineHeight: 1.5, opacity: .9 }}>
            <span style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span>Signed in: <span style={{ color: T.gold, fontWeight: 600 }}>{user.name.split(" ")[0]} · {user.roleLabel}</span></span>
              <button onClick={signOut} title="Sign out" style={{ background: "none", border: "none",
                color: "var(--sideText, rgba(255,255,255,.45))", cursor: "pointer", padding: 2 }}><LogOut size={13} /></button>
            </span>
          </div>
        </aside>
      )}
      {user && narrow && navOpen && <div onClick={() => setNavOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", zIndex: 40 }} />}

      {/* main */}
      {user && <main style={{ flex: 1, minWidth: 0 }}>
        <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
          padding: narrow ? "12px 14px" : "14px 26px", background: T.paper, borderBottom: `1px solid ${T.hair}`,
          position: "sticky", top: 0, zIndex: 30 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {narrow && <button onClick={() => setNavOpen(true)} style={{ border: `1px solid ${T.hair}`, background: T.paper,
              borderRadius: 9, width: 36, height: 36, display: "grid", placeItems: "center", cursor: "pointer" }}><Menu size={18} /></button>}
            <div>
              <div style={{ fontFamily: DISPLAY, fontSize: narrow ? 16 : 19, letterSpacing: ".02em" }}>
                {screenLabel(screen, user)}</div>
              <div style={{ fontSize: 11, color: T.muted, letterSpacing: ".14em", textTransform: "uppercase" }}>Amber Homes Real Estate · Dubai</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {!narrow && <div style={{ display: "flex", alignItems: "center", gap: 8, border: `1px solid ${T.hair}`,
              borderRadius: 9, padding: "8px 12px", background: T.bone }}>
              <Search size={14} color={T.muted} />
              <span style={{ fontSize: 12.5, color: T.faint }}>Search leads, projects…</span></div>}
            <div style={{ display: "flex", alignItems: "center", gap: 6, border: `1px solid ${T.hair}`,
              background: T.paper, borderRadius: 9, padding: "0 10px", height: 36 }}>
              {ACCENTS.map(([k, label, hex]) => (
                <button key={k} onClick={() => setAccent(k)} title={label} style={{ width: 16, height: 16, borderRadius: 16,
                  background: hex, border: accent === k ? `2px solid ${T.ink}` : "2px solid transparent",
                  outlineOffset: 1, cursor: "pointer", padding: 0 }} />
              ))}
            </div>
            <button onClick={() => setDark(!dark)} title={dark ? "Switch to light" : "Switch to dark"}
              style={{ border: `1px solid ${T.hair}`, background: T.paper, borderRadius: 9,
              width: 36, height: 36, display: "grid", placeItems: "center", cursor: "pointer" }}>
              {dark ? <Sun size={16} color={T.goldBright} /> : <Moon size={16} color={T.inkSoft} />}
            </button>
            <NotifBell go={go} />
            <ProfileMenu user={user} dark={dark} setDark={setDark} accent={accent} setAccent={setAccent} ACCENTS={ACCENTS} signOut={signOut} />
          </div>
        </header>
        <div style={{ padding: narrow ? "16px 14px 70px" : "24px 26px 80px", maxWidth: 1200 }}>
          {SCREENS[screen]}
        </div>
        <AskAmber narrow={narrow} user={user} />
      </main>}
    </div>
  );
}

/* ============================== PRIMITIVES =============================== */
const card = { background: T.paper, border: `1px solid ${T.hairSoft}`, borderRadius: 12, boxShadow: T.shadow, transition: "background .25s ease, border-color .25s ease, box-shadow .25s ease" };
function SectionTitle({ children, right }) {
  return <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", margin: "26px 0 12px" }}>
    <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
      <span style={{ fontFamily: DISPLAY, fontSize: 17 }}>{children}</span>
      <span style={{ width: 38, height: 1, background: T.gold, display: "inline-block", transform: "translateY(-4px)" }} />
    </div>{right}</div>;
}
function Kpi({ label, value, sub, trend, gold }) {
  return <div style={{ ...card, padding: "16px 18px" }}>
    <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: ".12em", textTransform: "uppercase", color: T.muted }}>{label}</div>
    <div style={{ fontFamily: DISPLAY, fontSize: 28, marginTop: 6, color: gold ? T.gold : T.ink }}>{value}</div>
    {sub && <div style={{ fontSize: 11.5, color: trend === "up" ? T.ok : trend === "down" ? T.bad : T.muted, marginTop: 4,
      display: "flex", alignItems: "center", gap: 4 }}>
      {trend === "up" && <ArrowUpRight size={12} />}{trend === "down" && <ArrowDownRight size={12} />}{sub}</div>}
  </div>;
}
function Chip({ children, tone = "muted" }) {
  const m = { muted: [T.hairSoft, T.inkSoft], gold: [T.goldSoft, T.gold], ok: [T.okSoft, T.ok],
    warn: [T.warnSoft, T.warn], bad: [T.badSoft, T.bad], info: [T.infoSoft, T.info] };
  const [bg, fg] = m[tone] || m.muted;
  return <span style={{ background: bg, color: fg, borderRadius: 7, padding: "3px 9px", fontSize: 11,
    fontWeight: 600, whiteSpace: "nowrap" }}>{children}</span>;
}
function TempTag({ t }) {
  const tone = t === "Very Hot" ? "bad" : t === "Hot" ? "warn" : t === "Warm" ? "gold" : "muted";
  return <Chip tone={tone}>{t}</Chip>;
}
function Av({ name, size = 36, dark }) {
  const ini = name.split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  return <div style={{ width: size, height: size, borderRadius: size * 0.3, background: dark ? T.hero : T.goldSoft,
    color: dark ? T.goldBright : T.gold, display: "grid", placeItems: "center", fontFamily: DISPLAY,
    fontSize: size * 0.36, flexShrink: 0, border: `1px solid ${dark ? "transparent" : T.goldEdge}` }}>{ini}</div>;
}
function Bar({ pct, color = T.gold, h = 8 }) {
  return <div style={{ background: T.hairSoft, borderRadius: 8, height: h, overflow: "hidden" }}>
    <div style={{ width: pct + "%", height: "100%", background: color, borderRadius: 8 }} /></div>;
}
function GoldBtn({ children, ghost }) {
  return <button style={{ background: ghost ? "transparent" : T.btnBg, color: ghost ? T.ink : T.btnFg,
    border: `1px solid ${ghost ? T.hair : T.btnBg}`, borderRadius: 9, padding: "8px 15px", fontSize: 12.5,
    fontWeight: 600, cursor: "pointer", fontFamily: UI, display: "inline-flex", alignItems: "center", gap: 6 }}>{children}</button>;
}

/* ============================ 1 ADMIN DASHBOARD ========================== */
function AdminDash({ go }) {
  const [leads, setLeads] = useState(null);
  const [acts, setActs] = useState([]);
  const [profs, setProfs] = useState([]);
  const [err, setErr] = useState("");
  useEffect(() => {
    (async () => {
      try {
        const [lr, ar, pr] = await Promise.all([
          supabase.from("leads").select("created_at,updated_at,status,temperature,is_open,assigned_agent,assigned_agent_name,current_owner,created_by,source,next_followup,deal_value,commission_value").limit(5000),
          supabase.from("lead_activity").select("actor_id,action,created_at").order("created_at", { ascending: false }).limit(5000),
          supabase.from("profiles").select("id,full_name,role").limit(500),
        ]);
        if (lr.error) { setErr("load"); setLeads([]); return; }
        setLeads(lr.data || []); setActs(ar.data || []); setProfs(pr.data || []);
      } catch (e) { setErr("load"); setLeads([]); }
    })();
  }, []);

  if (err) return <div style={{ ...card, padding: 22, borderColor: T.badSoft }}>
    <div style={{ fontWeight: 700, color: T.bad }}>Unable to load this section.</div>
    <div style={{ fontSize: 12.5, color: T.muted, marginTop: 4 }}>Please try again or contact admin.</div></div>;
  if (leads === null) return <div style={{ ...card, padding: 40, textAlign: "center", color: T.muted }}>Loading live data…</div>;

  const ymd = (iso) => { try { return new Date(iso).toLocaleDateString("en-CA", { timeZone: "Asia/Dubai" }); } catch (e) { return ""; } };
  const today = dubaiToday();
  const ym = today.slice(0, 7), yyyy = today.slice(0, 4);
  const qOf = (d) => Math.floor((parseInt((d || "").slice(5, 7) || "1", 10) - 1) / 3);
  const thisQ = qOf(today);
  const money = (n) => "AED " + Math.round(n || 0).toLocaleString();

  const inToday = (iso) => ymd(iso) === today;
  const inMonth = (iso) => ymd(iso).slice(0, 7) === ym;
  const inQuarter = (iso) => { const d = ymd(iso); return d.slice(0, 4) === yyyy && qOf(d) === thisQ; };
  const inYear = (iso) => ymd(iso).slice(0, 4) === yyyy;

  const L = leads;
  const won = L.filter((r) => r.status === "Closed Won");
  const cnt = (f) => L.filter(f).length;
  const sum = (arr, k) => arr.reduce((s, r) => s + (Number(r[k]) || 0), 0);
  const assignedTotal = cnt((r) => r.assigned_agent || r.current_owner || r.assigned_agent_name);
  const convOverall = assignedTotal ? (won.length / assignedTotal * 100) : 0;
  const wonMonth = won.filter((r) => inMonth(r.updated_at || r.created_at));
  const monthLeads = L.filter((r) => inMonth(r.created_at));
  const convMonth = monthLeads.length ? (wonMonth.length / monthLeads.length * 100) : 0;

  // contact activity from the audit trail
  const isCall = (a) => a === "call", isWa = (a) => a === "whatsapp", isView = (a) => a === "view_number" || a === "reveal_phone";
  const actCount = (pred, period) => acts.filter((x) => pred(x.action) && (period === "today" ? inToday(x.created_at) : inMonth(x.created_at))).length;

  // real security watch: velocity in the last 10 minutes, per actor
  const tenMinAgo = Date.now() - 10 * 60 * 1000;
  const recent = acts.filter((x) => new Date(x.created_at).getTime() >= tenMinAgo);
  const byActor = {};
  recent.forEach((x) => { (byActor[x.actor_id] = byActor[x.actor_id] || { view: 0, wa: 0, call: 0 }); if (isView(x.action)) byActor[x.actor_id].view++; else if (isWa(x.action)) byActor[x.actor_id].wa++; else if (isCall(x.action)) byActor[x.actor_id].call++; });
  const nameOf = (id) => (profs.find((p) => p.id === id) || {}).full_name || "Unknown user";
  const flags = [];
  Object.entries(byActor).forEach(([id, c]) => {
    if (c.view > 15) flags.push({ who: nameOf(id), reason: `${c.view} number reveals in 10 min`, sev: c.view > 30 ? "high" : "med", type: "view_number" });
    if (c.wa > 15) flags.push({ who: nameOf(id), reason: `${c.wa} WhatsApp clicks in 10 min`, sev: c.wa > 30 ? "high" : "med", type: "whatsapp" });
    if (c.call > 15) flags.push({ who: nameOf(id), reason: `${c.call} call clicks in 10 min`, sev: c.call > 30 ? "high" : "med", type: "call" });
  });

  // team performance by agent name (where the imported lead data lives), activity matched by account name
  const agentNames = [...new Set(L.map((r) => r.assigned_agent_name).filter(Boolean))];
  const perf = agentNames.map((nm) => {
    const mine = L.filter((r) => r.assigned_agent_name === nm);
    const w = mine.filter((r) => r.status === "Closed Won").length;
    const acc = profs.find((p) => (p.full_name || "").toLowerCase() === nm.toLowerCase());
    const accActs = acc ? acts.filter((x) => x.actor_id === acc.id && inMonth(x.created_at)) : null;
    return { nm, assigned: mine.length, won: w, conv: mine.length ? (w / mine.length * 100) : 0,
      hasAcc: !!acc,
      calls: accActs ? accActs.filter((x) => isCall(x.action)).length : null,
      wa: accActs ? accActs.filter((x) => isWa(x.action)).length : null,
      views: accActs ? accActs.filter((x) => isView(x.action)).length : null,
      overdue: mine.filter((r) => r.next_followup && r.next_followup < today && r.status !== "Closed Won" && r.status !== "Closed Lost").length };
  }).sort((a, b) => b.assigned - a.assigned);

  const bySource = Object.entries(L.reduce((m, r) => { const k = r.source || "Unknown"; m[k] = (m[k] || 0) + 1; return m; }, {})).sort((a, b) => b[1] - a[1]);
  const maxSrc = Math.max(1, ...bySource.map((s) => s[1]));

  const Stat = ({ label, value, sub, tone, onClick }) => (
    <button onClick={onClick} disabled={!onClick} style={{ ...card, padding: "14px 16px", textAlign: "left",
      cursor: onClick ? "pointer" : "default", border: `1px solid ${T.hair}`, background: T.paper, fontFamily: UI }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: T.muted }}>{label}</div>
      <div style={{ fontFamily: DISPLAY, fontSize: 24, marginTop: 5, color: tone === "gold" ? T.gold : tone === "bad" ? T.bad : tone === "ok" ? T.ok : T.ink }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: T.muted, marginTop: 3, display: "flex", alignItems: "center", gap: 3 }}>{sub}{onClick && <ChevronRight size={11} color={T.gold} />}</div>}
    </button>
  );
  const grid = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(135px,1fr))", gap: 10 };

  return <div>
    <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 14 }}>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: T.okSoft, color: T.ok,
        borderRadius: 8, padding: "4px 10px", fontSize: 11, fontWeight: 700 }}>
        <span style={{ width: 7, height: 7, borderRadius: 7, background: T.ok }} /> LIVE DATA</span>
      <span style={{ fontSize: 12.5, color: T.muted }}>{L.length} leads · {acts.length} activity events</span>
    </div>

    <SectionTitle>Leads</SectionTitle>
    <div style={grid}>
      <Stat label="Today" value={cnt((r) => inToday(r.created_at))} sub="new" onClick={() => go("live", { type: "all", label: "All leads" })} />
      <Stat label="This month" value={monthLeads.length} sub="new" />
      <Stat label="This quarter" value={cnt((r) => inQuarter(r.created_at))} sub="new" />
      <Stat label="This year" value={cnt((r) => inYear(r.created_at))} sub="new" />
      <Stat label="Total" value={L.length} sub="all leads" onClick={() => go("live", { type: "all", label: "All leads" })} />
      <Stat label="Unassigned" value={cnt((r) => !r.assigned_agent && !r.assigned_agent_name)} sub="to assign" onClick={() => go("live", { type: "unassigned", label: "Unassigned leads" })} />
      <Stat label="Open pool" value={cnt((r) => r.is_open)} tone="gold" onClick={() => go("live", { type: "open", label: "Open pool" })} />
      <Stat label="Hot" value={cnt((r) => r.temperature === "Hot")} tone="bad" onClick={() => go("live", { type: "temp", value: "Hot", label: "Hot leads" })} />
      <Stat label="Very Hot" value={cnt((r) => r.temperature === "Very Hot")} tone="bad" onClick={() => go("live", { type: "temp", value: "Very Hot", label: "Very Hot leads" })} />
      <Stat label="Due today" value={cnt((r) => r.next_followup && r.next_followup <= today && r.status !== "Closed Won" && r.status !== "Closed Lost")} tone="gold" onClick={() => go("live", { type: "due", label: "Follow-ups due" })} />
      <Stat label="Overdue" value={cnt((r) => r.next_followup && r.next_followup < today && r.status !== "Closed Won" && r.status !== "Closed Lost")} tone="bad" onClick={() => go("live", { type: "overdue", label: "Overdue follow-ups" })} />
    </div>

    <SectionTitle>Deals & commission</SectionTitle>
    <div style={grid}>
      <Stat label="Closed (month)" value={wonMonth.length} tone="ok" onClick={() => go("live", { type: "status", value: "Closed Won", label: "Closed Won" })} />
      <Stat label="Closed (quarter)" value={won.filter((r) => inQuarter(r.updated_at || r.created_at)).length} tone="ok" />
      <Stat label="Closed (year)" value={won.filter((r) => inYear(r.updated_at || r.created_at)).length} tone="ok" />
      <Stat label="Closed (total)" value={won.length} tone="ok" onClick={() => go("live", { type: "status", value: "Closed Won", label: "Closed Won" })} />
      <Stat label="Commission (month)" value={money(sum(wonMonth, "commission_value"))} tone="gold" />
      <Stat label="Commission (year)" value={money(sum(won.filter((r) => inYear(r.updated_at || r.created_at)), "commission_value"))} tone="gold" />
      <Stat label="Avg deal value" value={won.length ? money(sum(won, "deal_value") / won.length) : "AED 0"} />
      <Stat label="Pipeline value" value={money(sum(L.filter((r) => r.status !== "Closed Won" && r.status !== "Closed Lost" && r.status !== "Dead Lead"), "deal_value"))} />
    </div>

    <SectionTitle>Conversion</SectionTitle>
    <div style={grid}>
      <Stat label="Overall" value={convOverall.toFixed(1) + "%"} sub="won / assigned" tone="gold" />
      <Stat label="This month" value={convMonth.toFixed(1) + "%"} sub="won / new" />
      <Stat label="Won : assigned" value={`${won.length} : ${assignedTotal}`} />
    </div>

    <SectionTitle>Agent activity <span style={{ fontSize: 10.5, color: T.muted, fontWeight: 600 }}>· View Number / Call / WhatsApp clicks</span></SectionTitle>
    <div style={grid}>
      <Stat label="Calls today" value={actCount(isCall, "today")} />
      <Stat label="Calls (month)" value={actCount(isCall, "month")} />
      <Stat label="WhatsApp today" value={actCount(isWa, "today")} tone="ok" />
      <Stat label="WhatsApp (month)" value={actCount(isWa, "month")} tone="ok" />
      <Stat label="Reveals today" value={actCount(isView, "today")} />
      <Stat label="Reveals (month)" value={actCount(isView, "month")} />
    </div>

    <SectionTitle right={<button onClick={() => go("security")} style={{ background: "none", border: "none", color: T.bad,
      fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontFamily: UI }}>
      Open security <ChevronRight size={13} /></button>}>Security watch</SectionTitle>
    <div style={{ ...card, borderColor: flags.length ? T.badSoft : T.hair, overflow: "hidden" }}>
      {flags.length === 0 ? (
        <div style={{ padding: "18px 16px", display: "flex", alignItems: "center", gap: 10, color: T.muted, fontSize: 13 }}>
          <CheckCircle2 size={17} color={T.ok} /> No suspicious activity detected.</div>
      ) : flags.slice(0, 6).map((s, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 16px", borderTop: i ? `1px solid ${T.hairSoft}` : "none" }}>
          <AlertTriangle size={17} color={s.sev === "high" ? T.bad : T.warn} style={{ flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13.5, fontWeight: 600 }}>{s.reason}</div>
            <div style={{ fontSize: 11.5, color: T.muted, marginTop: 1 }}>{s.who} · just now</div>
          </div>
          <Chip tone={s.sev === "high" ? "bad" : "warn"}>{s.sev === "high" ? "High" : "Medium"}</Chip>
        </div>
      ))}
    </div>

    <SectionTitle>Team performance <span style={{ fontSize: 10.5, color: T.ok, fontWeight: 600 }}>· live</span></SectionTitle>
    <div style={{ ...card, overflow: "hidden" }}>
      <div style={{ overflowX: "auto" }}><div style={{ minWidth: 720 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.5fr 0.8fr 0.8fr 0.9fr 0.7fr 0.7fr 0.8fr", gap: 8, padding: "10px 16px",
          fontSize: 10, fontWeight: 700, letterSpacing: ".05em", textTransform: "uppercase", color: T.muted, borderBottom: `1px solid ${T.hair}`, background: T.bone }}>
          <span>Agent</span><span>Assigned</span><span>Closed</span><span>Conversion</span><span>Calls</span><span>WhatsApp</span><span>Overdue</span>
        </div>
        {perf.length === 0 ? <div style={{ padding: 22, textAlign: "center", color: T.muted, fontSize: 13 }}>No assigned leads yet.</div> :
          perf.map((p, i) => (
          <button key={p.nm} onClick={() => go("live", { type: "agent", value: p.nm, label: "Agent: " + p.nm })}
            style={{ display: "grid", gridTemplateColumns: "1.5fr 0.8fr 0.8fr 0.9fr 0.7fr 0.7fr 0.8fr", gap: 8, alignItems: "center",
              padding: "11px 16px", borderTop: i ? `1px solid ${T.hairSoft}` : "none", width: "100%", background: "none", border: "none", cursor: "pointer", fontFamily: UI, textAlign: "left", fontSize: 12.5 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}><Av name={p.nm} size={26} dark />
              <span style={{ fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.nm}</span></span>
            <span>{p.assigned}</span>
            <span style={{ color: p.won ? T.ok : T.ink }}>{p.won}</span>
            <span style={{ fontWeight: 700, color: p.conv >= 10 ? T.ok : T.ink }}>{p.conv.toFixed(0)}%</span>
            <span>{p.hasAcc ? p.calls : "—"}</span>
            <span>{p.hasAcc ? p.wa : "—"}</span>
            <span style={{ color: p.overdue ? T.bad : T.faint }}>{p.overdue}</span>
          </button>
        ))}
      </div></div>
    </div>
    <div style={{ fontSize: 11, color: T.faint, marginTop: 8, lineHeight: 1.5 }}>
      Calls / WhatsApp show for agents whose login name matches the lead's agent name. Once imported leads are linked to agent accounts, every agent's activity maps automatically.
    </div>

    <SectionTitle>Leads by source <span style={{ fontSize: 10.5, color: T.ok, fontWeight: 600 }}>· live</span></SectionTitle>
    <div style={{ ...card, padding: 18 }}>
      {bySource.length === 0 ? <div style={{ color: T.muted, fontSize: 12.5 }}>No leads yet.</div> :
        bySource.map(([s, c]) => (
        <button key={s} onClick={() => go("live", { type: "source", value: s, label: "Source: " + s })}
          style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10, width: "100%", background: "none", border: "none", cursor: "pointer", fontFamily: UI, padding: 0 }}>
          <span style={{ width: 140, fontSize: 12.5, color: T.inkSoft, textAlign: "left" }}>{s}</span>
          <div style={{ flex: 1 }}><Bar pct={(c / maxSrc) * 100} /></div>
          <span style={{ width: 36, textAlign: "right", fontSize: 12.5, fontWeight: 700 }}>{c}</span>
        </button>
      ))}
    </div>
  </div>;
}

/* ============================ 2 AGENT DASHBOARD ========================== */
function AgentDash({ go, user, openLead }) {
  const [rows, setRows] = useState(null);
  const [acts, setActs] = useState([]);
  const [err, setErr] = useState("");
  const [modal, setModal] = useState(null); // 'target' | 'focus'
  const TARGET = 4; // monthly deals target (placeholder until a manager sets a real one)
  useEffect(() => {
    (async () => {
      const { data: { user: au } } = await supabase.auth.getUser();
      const uid = au?.id;
      const [lr, ar] = await Promise.all([
        supabase.from("leads").select("id, client_name, phone, project, area, budget, status, temperature, next_followup, last_contacted, is_open, assigned_agent, current_owner, created_by, deal_value, commission_value").limit(2000),
        supabase.from("lead_activity").select("action, created_at").eq("actor_id", uid).order("created_at", { ascending: false }).limit(400),
      ]);
      if (lr.error) { setErr("Unable to load your dashboard. Please try again or contact admin."); setRows([]); return; }
      const mine = (lr.data || []).filter((l) => l.assigned_agent === uid || l.current_owner === uid || l.created_by === uid);
      setRows(mine); setActs(ar.data || []);
    })();
  }, []);

  const h = dubaiHour();
  const today = dubaiToday();
  const mine = rows || [];
  const dueToday = mine.filter((l) => l.next_followup && l.next_followup <= today && l.status !== "Closed Won" && l.status !== "Closed Lost");
  const hot = mine.filter((l) => l.temperature === "Hot" || l.temperature === "Very Hot");
  const closedWon = mine.filter((l) => l.status === "Closed Won");
  const notContacted = mine.filter((l) => !l.last_contacted && l.status !== "Closed Won" && l.status !== "Closed Lost");
  const active = mine.filter((l) => l.status !== "Closed Won" && l.status !== "Closed Lost");
  const conv = mine.length ? Math.round(closedWon.length / mine.length * 100) : 0;
  const commission = closedWon.reduce((s, l) => s + (Number(l.commission_value) || 0), 0);

  // real follow-up streak: consecutive days (ending today/yesterday) with >=1 logged action
  const days = new Set(acts.map((a) => { try { return new Date(a.created_at).toLocaleDateString("en-CA", { timeZone: "Asia/Dubai" }); } catch (e) { return ""; } }));
  let streak = 0; { let d = new Date();
    for (let i = 0; i < 60; i++) { const ds = d.toLocaleDateString("en-CA", { timeZone: "Asia/Dubai" });
      if (days.has(ds)) streak++; else if (i > 0) break; else if (!days.has(ds)) { /* allow today empty */ } d.setDate(d.getDate() - 1); } }

  const pct = Math.min(100, Math.round(closedWon.length / TARGET * 100));
  const topHot = hot[0];

  // circular progress ring
  const R = 46, C = 2 * Math.PI * R, off = C * (1 - pct / 100);
  const Ring = () => (
    <svg width="116" height="116" viewBox="0 0 116 116">
      <circle cx="58" cy="58" r={R} fill="none" stroke={T.hairSoft} strokeWidth="10" />
      <circle cx="58" cy="58" r={R} fill="none" stroke={T.gold} strokeWidth="10" strokeLinecap="round"
        strokeDasharray={C} strokeDashoffset={off} transform="rotate(-90 58 58)" />
      <text x="58" y="54" textAnchor="middle" fontFamily={DISPLAY} fontSize="26" fill={T.ink}>{pct}%</text>
      <text x="58" y="72" textAnchor="middle" fontSize="9.5" fill={T.muted} style={{ letterSpacing: ".1em" }}>OF TARGET</text>
    </svg>
  );

  const Stat = ({ label, value, sub, tone, onClick }) => (
    <button onClick={onClick} style={{ ...card, padding: "15px 17px", textAlign: "left", cursor: "pointer",
      border: `1px solid ${T.hair}`, background: T.paper, fontFamily: UI }}>
      <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: T.muted }}>{label}</div>
      <div style={{ fontFamily: DISPLAY, fontSize: 27, marginTop: 5, color: tone === "gold" ? T.gold : tone === "bad" ? T.bad : T.ink }}>{value}</div>
      <div style={{ fontSize: 11.5, color: T.muted, marginTop: 3, display: "flex", alignItems: "center", gap: 4 }}>{sub} <ChevronRight size={12} color={T.gold} /></div>
    </button>
  );

  return <div>
    {/* greeting banner */}
    <div style={{ ...card, padding: "18px 20px", display: "flex", alignItems: "center", justifyContent: "space-between",
      flexWrap: "wrap", gap: 14, background: T.hero, border: "none", boxShadow: T.shadowLg }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <Av name={user?.name || "Agent"} size={46} />
        <div>
          <div style={{ fontFamily: DISPLAY, fontSize: 20, color: "#fff" }}>{greetWord(h)}, {firstName(user?.name)} 👋</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,.6)" }}>
            {new Date().toLocaleDateString("en-GB", { timeZone: "Asia/Dubai", weekday: "long", day: "numeric", month: "long" })}
            {mine.length ? ` · ${dueToday.length} follow-up${dueToday.length === 1 ? "" : "s"} due` : ""}</div>
        </div>
      </div>
    </div>

    {err && <div style={{ ...card, padding: 14, marginTop: 14, borderColor: T.badSoft, color: T.bad, fontSize: 13 }}>{err}</div>}

    {rows === null ? (
      <div style={{ ...card, padding: 40, marginTop: 14, textAlign: "center", color: T.muted }}>Loading your dashboard…</div>
    ) : (<>
      {/* streak + plan my day */}
      <div style={{ display: "flex", gap: 12, marginTop: 14, flexWrap: "wrap" }}>
        <div style={{ ...card, padding: "14px 18px", display: "flex", alignItems: "center", gap: 11, flex: "1 1 200px" }}>
          <Flame size={22} color={streak > 0 ? T.gold : T.faint} />
          <div><div style={{ fontFamily: DISPLAY, fontSize: 18 }}>{streak > 0 ? `${streak} day${streak === 1 ? "" : "s"}` : "Start today"}</div>
            <div style={{ fontSize: 10.5, color: T.muted, letterSpacing: ".08em", textTransform: "uppercase" }}>Follow-up streak</div></div>
        </div>
        <button onClick={() => setModal("focus")} style={{ flex: "1 1 200px", background: T.btnBg, color: T.btnFg, border: "none",
          borderRadius: 14, padding: "14px 18px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: UI,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}><Sparkle size={17} /> Plan my day</button>
      </div>

      {/* target ring + this-month gradient card */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 14, marginTop: 14 }}>
        <div style={{ ...card, padding: 18, display: "flex", alignItems: "center", gap: 16 }}>
          <Ring />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: T.muted }}>Monthly target</div>
            <div style={{ fontFamily: DISPLAY, fontSize: 20, marginTop: 3 }}>{closedWon.length} <span style={{ color: T.muted, fontSize: 14 }}>/ {TARGET} deals</span></div>
            <div style={{ fontSize: 11.5, color: T.muted, marginTop: 4, lineHeight: 1.4 }}>
              {closedWon.length >= TARGET ? "Target smashed — keep going! 🎉" : `${TARGET - closedWon.length} more to hit your goal.`}</div>
            <button onClick={() => setModal("target")} style={{ ...miniBtn(), marginTop: 8, padding: "5px 10px", fontSize: 11 }}>Details</button>
          </div>
        </div>
        <div style={{ borderRadius: 16, padding: 20, background: `linear-gradient(135deg, ${T.gold}, ${T.goldBright})`, color: "#fff", boxShadow: T.shadowLg }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 10.5, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", opacity: .85 }}>
            <Wallet size={14} /> {commission > 0 ? "Commission this month" : "This month"}</div>
          <div style={{ fontFamily: DISPLAY, fontSize: 30, marginTop: 8 }}>
            {commission > 0 ? "AED " + Math.round(commission).toLocaleString() : closedWon.length + (closedWon.length === 1 ? " deal won" : " deals won")}</div>
          <div style={{ fontSize: 12, opacity: .9, marginTop: 4 }}>{active.length} active · {hot.length} hot in your pipeline</div>
          {topHot && <div style={{ marginTop: 12, background: "rgba(255,255,255,.16)", borderRadius: 10, padding: "9px 12px", fontSize: 12, lineHeight: 1.45 }}>
            💡 Close <b>{topHot.client_name}</b>{topHot.project ? ` (${topHot.project})` : ""} to move toward your target.</div>}
        </div>
      </div>

      {/* quick stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 12, marginTop: 14 }}>
        <Stat label="My Leads" value={mine.length} sub="view all" onClick={() => go("live")} />
        <Stat label="Due Today" value={dueToday.length} sub={dueToday.length ? "follow up now" : "all clear"} tone={dueToday.length ? "bad" : null} onClick={() => go("live", { type: "due", label: "Due today" })} />
        <Stat label="Hot Leads" value={hot.length} sub="prioritise" tone="gold" onClick={() => go("live", { type: "hot", label: "Hot & Very Hot" })} />
        <Stat label="Conversion" value={conv + "%"} sub="won / total" onClick={() => setModal("target")} />
      </div>

      {mine.length === 0 ? (
        <div style={{ ...card, padding: 44, marginTop: 18, textAlign: "center" }}>
          <UserCircle size={28} color={T.faint} style={{ marginBottom: 10 }} />
          <div style={{ fontWeight: 700, fontSize: 15 }}>No leads assigned yet</div>
          <div style={{ fontSize: 12.5, color: T.muted, marginTop: 4, maxWidth: 340, marginInline: "auto", lineHeight: 1.5 }}>
            When your manager assigns leads to you — or you add your own — they'll appear here and in My Leads.</div>
          <button onClick={() => go("live")} style={{ marginTop: 14, background: T.btnBg, color: T.btnFg, border: "none",
            borderRadius: 10, padding: "10px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: UI }}>Go to My Leads</button>
        </div>
      ) : (<>
        <SectionTitle right={<button onClick={() => go("live")} style={{ background: "none", border: "none", color: T.gold,
          fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: UI, display: "flex", alignItems: "center", gap: 3 }}>
          All my leads <ChevronRight size={13} /></button>}>Today's focus</SectionTitle>
        <div style={{ display: "grid", gap: 10 }}>
          {(dueToday.length ? dueToday : mine).slice(0, 5).map((l) => (
            <div key={l.id} onClick={() => openLead && openLead(l.id)} style={{ ...card, padding: "13px 15px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", cursor: "pointer" }}>
              <Av name={l.client_name} />
              <div style={{ flex: 1, minWidth: 150 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>{l.client_name}</span>
                  {(l.temperature === "Hot" || l.temperature === "Very Hot") && <Chip tone="bad">{l.temperature}</Chip>}
                </div>
                <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>{[l.area, l.project, l.budget].filter(Boolean).join(" · ") || "—"}</div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {l.phone && <a href={`https://wa.me/${String(l.phone).replace(/\D/g, "")}`} target="_blank" rel="noreferrer"
                  onClick={(e) => { e.stopPropagation(); logAction("whatsapp", l, user && user.id); }}
                  style={{ width: 34, height: 34, borderRadius: 9, background: T.okSoft, display: "grid", placeItems: "center", textDecoration: "none" }}>
                  <MessageCircle size={15} color={T.ok} /></a>}
                {l.phone && <a href={`tel:${String(l.phone).replace(/\D/g, "")}`}
                  onClick={(e) => { e.stopPropagation(); logAction("call", l, user && user.id); }}
                  style={{ width: 34, height: 34, borderRadius: 9, background: T.bone, border: `1px solid ${T.hair}`, display: "grid", placeItems: "center", textDecoration: "none" }}>
                  <Phone size={14} color={T.inkSoft} /></a>}
              </div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 11, color: T.faint, marginTop: 10 }}>The full team leaderboard lives on the manager dashboard. Here you see your own progress only.</div>
      </>)}
    </>)}

    {modal === "target" && <Modal title="My month" onClose={() => setModal(null)}>
      <div style={{ display: "grid", gap: 10 }}>
        <Row k="Closed won (this month)" v={closedWon.length} />
        <Row k="Monthly target" v={TARGET + " deals"} />
        <Row k="Active leads" v={active.length} />
        <Row k="Hot / Very hot" v={hot.length} />
        <Row k="Conversion" v={conv + "%"} />
        {commission > 0 && <Row k="Commission (won)" v={"AED " + Math.round(commission).toLocaleString()} />}
      </div>
      <div style={{ fontSize: 11.5, color: T.faint, marginTop: 12, lineHeight: 1.5 }}>
        Your monthly target is a default for now — ask your manager to set your real target and commission tracking will appear here.</div>
    </Modal>}
    {modal === "focus" && <Modal title="Plan my day" onClose={() => setModal(null)}>
      <FocusList title="Follow-ups due" items={dueToday} go={go} onClose={() => setModal(null)} />
      <FocusList title="Not yet contacted" items={notContacted} go={go} onClose={() => setModal(null)} />
      {dueToday.length + notContacted.length === 0 && <div style={{ color: T.muted, fontSize: 13, textAlign: "center", padding: 16 }}>Nothing urgent right now. 🎉</div>}
    </Modal>}
  </div>;
}
function FocusList({ title, items, go, onClose }) {
  if (!items.length) return null;
  return <div style={{ marginBottom: 12 }}>
    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: T.muted, marginBottom: 6 }}>{title} · {items.length}</div>
    {items.slice(0, 6).map((l) => (
      <div key={l.id} style={{ display: "flex", alignItems: "center", gap: 9, padding: "8px 0", borderBottom: `1px solid ${T.hairSoft}` }}>
        <Av name={l.client_name} size={26} />
        <span style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{l.client_name}</span>
        {l.phone && <a href={`https://wa.me/${String(l.phone).replace(/\D/g, "")}`} target="_blank" rel="noreferrer"
          style={{ fontSize: 11.5, color: T.ok, fontWeight: 700, textDecoration: "none" }}>WhatsApp</a>}
      </div>
    ))}
  </div>;
}

/* ============================= 3 LEAD DETAIL ============================= */
function LeadDetail({ leadId, user, go }) {
  const [lead, setLead] = useState(null);
  const [comments, setComments] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [err, setErr] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [sched, setSched] = useState(false);
  const [schedDate, setSchedDate] = useState("");
  const me = user;
  const isAdmin = user && (user.role === "master_admin" || user.role === "admin");

  const loadAll = async () => {
    if (!leadId) { setErr("none"); return; }
    setErr("");
    const { data: l, error } = await supabase.from("leads").select("*").eq("id", leadId).single();
    if (error || !l) { setErr("load"); return; }
    setLead(l);
    if (isAdmin) setRevealed(true);
    const [{ data: cs }, { data: ts }] = await Promise.all([
      supabase.from("lead_comments").select("*, author:profiles!lead_comments_author_id_fkey(full_name, role)").eq("lead_id", leadId).eq("deleted", false).order("created_at", { ascending: false }),
      supabase.from("lead_activity").select("*, actor:profiles!lead_activity_actor_id_fkey(full_name, role)").eq("lead_id", leadId).order("created_at", { ascending: false }).limit(60),
    ]);
    setComments(cs || []); setTimeline(ts || []);
  };
  useEffect(() => { loadAll(); }, [leadId]);

  if (err === "none") return <div style={{ ...card, padding: 40, textAlign: "center" }}>
    <FileText size={26} color={T.faint} style={{ marginBottom: 10 }} />
    <div style={{ fontWeight: 700 }}>No lead selected</div>
    <div style={{ fontSize: 12.5, color: T.muted, marginTop: 4 }}>Open a lead from {user && user.role === "agent" ? "My Leads" : "Leads"} to see its full detail.</div>
    <button onClick={() => go("live")} style={{ marginTop: 14, ...miniBtn() }}>Go to leads</button></div>;
  if (err === "load") return <div style={{ ...card, padding: 30, textAlign: "center", borderColor: T.badSoft }}>
    <div style={{ fontWeight: 700, color: T.bad }}>Unable to load this lead.</div>
    <div style={{ fontSize: 12.5, color: T.muted, marginTop: 4 }}>Please try again or contact admin.</div>
    <button onClick={() => go("live")} style={{ marginTop: 14, ...miniBtn() }}>Back to leads</button></div>;
  if (!lead) return <div style={{ ...card, padding: 40, textAlign: "center", color: T.muted }}>Loading lead…</div>;

  const leadIdFmt = lead.lead_no ? "L" + String(lead.lead_no).padStart(3, "0") : (lead.lead_code || "—");
  const digits = (p) => String(p || "").replace(/\D/g, "");
  const reveal = () => { setRevealed(true); logAction("view_number", lead, me && me.id); };

  const addComment = async () => {
    if (!newComment.trim() || !me) return;
    const body = newComment.trim();
    const { data, error } = await supabase.from("lead_comments").insert({ lead_id: lead.id, author_id: me.id, body })
      .select("*, author:profiles!lead_comments_author_id_fkey(full_name, role)").single();
    if (error) return;
    setComments((c) => [data, ...c]); setNewComment("");
    logAction("comment", lead, me.id, { note: body.slice(0, 80) });
    loadTimeline();
  };
  const delComment = async (c) => {
    await supabase.from("lead_comments").update({ deleted: true }).eq("id", c.id);
    setComments((cs) => cs.filter((x) => x.id !== c.id));
  };
  const loadTimeline = async () => {
    const { data: ts } = await supabase.from("lead_activity").select("*, actor:profiles!lead_activity_actor_id_fkey(full_name, role)").eq("lead_id", lead.id).order("created_at", { ascending: false }).limit(60);
    setTimeline(ts || []);
  };
  const saveSchedule = async () => {
    if (!schedDate) return;
    await supabase.from("leads").update({ next_followup: schedDate }).eq("id", lead.id);
    setLead((l) => ({ ...l, next_followup: schedDate }));
    logAction("schedule", lead, me && me.id, { next_followup: schedDate });
    setSched(false); loadTimeline();
  };

  const ACT_LABEL = { view_number: "Viewed number", reveal_phone: "Viewed number", call: "Called", whatsapp: "WhatsApp", schedule: "Scheduled follow-up",
    comment: "Commented", lead_created: "Lead created", lead_created_ai: "Lead created (AI)", status_change: "Status changed", assign: "Assigned", make_open: "Made open", view: "Viewed" };
  const when = (t) => { const d = (Date.now() - new Date(t)) / 6e4; if (d < 1) return "just now"; if (d < 60) return Math.round(d) + "m ago"; if (d < 1440) return Math.round(d / 60) + "h ago"; return new Date(t).toLocaleDateString(); };

  const HeaderItem = ({ k, v }) => <div><div style={{ fontSize: 9.5, letterSpacing: ".1em", textTransform: "uppercase", color: "rgba(255,255,255,.5)" }}>{k}</div>
    <div style={{ fontSize: 13, color: "#fff", marginTop: 2, fontWeight: 600 }}>{v}</div></div>;
  const Field = ({ k, v }) => <div style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: `1px solid ${T.hairSoft}`, fontSize: 13, gap: 12 }}>
    <span style={{ color: T.muted, flexShrink: 0 }}>{k}</span><span style={{ fontWeight: 600, textAlign: "right" }}>{v || "—"}</span></div>;
  const Btn = ({ icon: Ic, label, onClick, tone }) => <button onClick={onClick} style={{ flex: 1, minWidth: 86, display: "flex", flexDirection: "column",
    alignItems: "center", gap: 5, padding: "12px 8px", borderRadius: 12, border: `1px solid ${tone === "ok" ? T.ok : T.hair}`,
    background: tone === "ok" ? T.okSoft : T.paper, color: tone === "ok" ? T.ok : T.ink, cursor: "pointer", fontFamily: UI, fontSize: 11.5, fontWeight: 700 }}>
    <Ic size={17} /> {label}</button>;

  return <div>
    <button onClick={() => go("live")} style={{ ...miniBtn(), marginBottom: 12 }}>← Back to {user && user.role === "agent" ? "My Leads" : "Leads"}</button>

    {/* header */}
    <div style={{ ...card, padding: "18px 20px", background: T.hero, border: "none", boxShadow: T.shadowLg }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
        <Av name={lead.client_name} size={48} />
        <div style={{ flex: 1, minWidth: 180 }}>
          <div style={{ fontFamily: DISPLAY, fontSize: 21, color: "#fff" }}>{lead.client_name}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: T.goldBright }}>{leadIdFmt}</span>
            <span style={{ fontSize: 10.5, fontWeight: 700, background: "rgba(255,255,255,.14)", color: "#fff", borderRadius: 6, padding: "2px 8px" }}>{lead.is_open ? "Open" : lead.status}</span>
            {(lead.temperature === "Hot" || lead.temperature === "Very Hot") && <span style={{ fontSize: 10.5, fontWeight: 700, background: "rgba(225,90,80,.25)", color: "#ffd9d5", borderRadius: 6, padding: "2px 8px" }}>{lead.temperature}</span>}
          </div>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(110px,1fr))", gap: 12, marginTop: 16 }}>
        <HeaderItem k="Assigned agent" v={lead.assigned_agent_name || "Unassigned"} />
        <HeaderItem k="Source" v={lead.source || "—"} />
        <HeaderItem k="Last contact" v={lead.last_contacted || "—"} />
        <HeaderItem k="Created" v={lead.created_on || (lead.created_at ? new Date(lead.created_at).toLocaleDateString() : "—")} />
      </div>
    </div>

    {/* action buttons */}
    <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
      {!revealed && <Btn icon={Eye} label="View Number" onClick={reveal} />}
      {revealed && lead.phone && <Btn icon={Phone} label="Call" tone="" onClick={() => { logAction("call", lead, me && me.id); window.location.href = "tel:" + digits(lead.phone); }} />}
      {lead.phone && <Btn icon={MessageCircle} label="WhatsApp" tone="ok" onClick={() => { logAction("whatsapp", lead, me && me.id); window.open("https://wa.me/" + digits(lead.phone), "_blank"); }} />}
      <Btn icon={Calendar} label="Schedule" onClick={() => { setSchedDate(lead.next_followup || ""); setSched(true); }} />
    </div>

    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 14, marginTop: 14 }}>
      {/* main info */}
      <div style={{ ...card, padding: 16 }}>
        <SectionMini>Main information</SectionMini>
        <Field k="Customer" v={lead.client_name} />
        <Field k="Lead ID" v={leadIdFmt} />
        <Field k="Assigned agent" v={lead.assigned_agent_name || "Unassigned"} />
        <Field k="Source" v={lead.source} />
        <Field k="Status" v={lead.is_open ? "Open" : lead.status} />
        <Field k="Temperature" v={lead.temperature} />
        <Field k="Last contact" v={lead.last_contacted} />
        <Field k="Phone" v={revealed ? (lead.phone || "—") : "•••••• (View Number)"} />
        <Field k="WhatsApp" v={revealed ? (lead.whatsapp || lead.phone || "—") : "••••••"} />
        <Field k="Email" v={revealed ? (lead.email || "—") : "••••••"} />
      </div>
      {/* client profile + investment */}
      <div style={{ ...card, padding: 16 }}>
        <SectionMini>Client profile</SectionMini>
        <Field k="Nationality" v={lead.nationality} />
        <Field k="Country of residence" v={lead.country_residence} />
        <Field k="Language" v={lead.language} />
        <div style={{ height: 14 }} />
        <SectionMini>Investment requirement</SectionMini>
        <Field k="Budget" v={lead.budget} />
        <Field k="Purpose" v={lead.purpose} />
        <Field k="Area" v={lead.area} />
        <Field k="Project" v={lead.project} />
        <Field k="Developer" v={lead.developer} />
        <Field k="Property type" v={lead.property_type} />
        <Field k="Ready / Off-plan" v={lead.ready_offplan} />
        <Field k="Finance" v={lead.finance} />
        <Field k="Timeline" v={lead.timeline} />
      </div>
    </div>

    {/* comments */}
    <SectionTitle>Comments</SectionTitle>
    <div style={{ ...card, padding: 16 }}>
      <div style={{ display: "flex", gap: 8 }}>
        <input value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Add a comment…"
          onKeyDown={(e) => { if (e.key === "Enter") addComment(); }}
          style={{ flex: 1, border: `1px solid ${T.hair}`, borderRadius: 10, padding: "10px 12px", fontSize: 13, fontFamily: UI, outline: "none", color: T.ink, background: T.bone }} />
        <button onClick={addComment} disabled={!newComment.trim()} style={{ background: T.btnBg, color: T.btnFg, border: "none", borderRadius: 10,
          padding: "0 16px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: UI, opacity: newComment.trim() ? 1 : .5 }}>Post</button>
      </div>
      <div style={{ marginTop: 14 }}>
        {comments.length === 0 ? <div style={{ color: T.muted, fontSize: 12.5, padding: "8px 0" }}>No comments yet.</div> :
          comments.map((c) => (
          <div key={c.id} style={{ padding: "10px 0", borderBottom: `1px solid ${T.hairSoft}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Av name={c.author?.full_name || "User"} size={24} />
              <span style={{ fontSize: 12.5, fontWeight: 700 }}>{c.author?.full_name || "User"}</span>
              <span style={{ fontSize: 10, color: T.faint }}>{roleLabel(c.author?.role)}</span>
              <span style={{ fontSize: 10, color: T.faint, marginLeft: "auto" }}>{when(c.created_at)}</span>
              {(isAdmin || c.author_id === (me && me.id)) && <button onClick={() => delComment(c)} title="Delete"
                style={{ background: "none", border: "none", color: T.faint, cursor: "pointer", padding: 2 }}><X size={13} /></button>}
            </div>
            <div style={{ fontSize: 13, color: T.inkSoft, marginTop: 5, marginLeft: 32, lineHeight: 1.5 }}>{c.body}</div>
          </div>
        ))}
      </div>
    </div>

    {/* activity timeline */}
    <SectionTitle>Activity timeline</SectionTitle>
    <div style={{ ...card, padding: 16 }}>
      {timeline.length === 0 ? <div style={{ color: T.muted, fontSize: 12.5 }}>No activity recorded yet.</div> :
        timeline.map((t, i) => (
        <div key={t.id} style={{ display: "flex", gap: 11, paddingBottom: i === timeline.length - 1 ? 0 : 14 }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ width: 9, height: 9, borderRadius: 9, background: T.gold, marginTop: 3 }} />
            {i !== timeline.length - 1 && <div style={{ width: 2, flex: 1, background: T.hairSoft, marginTop: 3 }} />}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{ACT_LABEL[t.action] || t.action}{t.detail && t.detail.note ? ` — "${t.detail.note}"` : ""}</div>
            <div style={{ fontSize: 11, color: T.muted, marginTop: 1 }}>{t.actor?.full_name || "System"} · {roleLabel(t.actor?.role)} · {when(t.created_at)}</div>
          </div>
        </div>
      ))}
    </div>

    {sched && <Modal title="Schedule follow-up" onClose={() => setSched(false)}>
      <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: T.muted }}>Next follow-up date</span>
      <input type="date" value={schedDate} onChange={(e) => setSchedDate(e.target.value)}
        style={{ width: "100%", border: `1px solid ${T.hair}`, borderRadius: 10, padding: "10px 12px", fontSize: 13, fontFamily: UI, outline: "none", color: T.ink, background: T.bone, boxSizing: "border-box", marginTop: 5, marginBottom: 12 }} />
      <button onClick={saveSchedule} disabled={!schedDate} style={{ width: "100%", background: T.btnBg, color: T.btnFg, border: "none",
        borderRadius: 10, padding: "12px", fontSize: 13.5, fontWeight: 700, cursor: "pointer", fontFamily: UI, opacity: schedDate ? 1 : .5 }}>Save follow-up</button>
    </Modal>}
  </div>;
}
function SectionMini({ children }) { return <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase", color: T.gold, marginBottom: 8 }}>{children}</div>; }

function Assignment() {
  const [method, setMethod] = useState("Round-robin");
  return <div>
    <div style={{ ...card, padding: 16, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
      <span style={{ fontSize: 12.5, fontWeight: 600, color: T.inkSoft }}>Assignment method</span>
      {["Manual", "Round-robin", "By language", "By budget", "By project", "By performance"].map((m) => (
        <button key={m} onClick={() => setMethod(m)} style={{ border: `1px solid ${method === m ? T.gold : T.hair}`,
          background: method === m ? T.goldSoft : T.paper, color: method === m ? T.gold : T.inkSoft, borderRadius: 8,
          padding: "6px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: UI }}>{m}</button>
      ))}
    </div>

    <SectionTitle right={<Chip tone="warn">SLA: first contact 30 min</Chip>}>Unassigned pool · 4</SectionTitle>
    <div style={{ display: "grid", gap: 10 }}>
      {POOL.map((p) => (
        <div key={p.id} style={{ ...card, padding: "14px 16px", display: "flex", alignItems: "center", gap: 13, flexWrap: "wrap" }}>
          <Av name={p.name} />
          <div style={{ flex: 1, minWidth: 170 }}>
            <div style={{ fontWeight: 600, fontSize: 14 }}>{p.name}</div>
            <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>{p.source} · {p.area} · {p.budget} · {p.lang}</div>
          </div>
          <Chip tone={p.mins > 25 ? "bad" : p.mins > 10 ? "warn" : "ok"}>{p.mins} min in pool</Chip>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <select style={{ border: `1px solid ${T.hair}`, borderRadius: 9, padding: "8px 10px", fontSize: 12.5,
              fontFamily: UI, background: T.paper, color: T.ink, cursor: "pointer" }}>
              <option>Suggested: {p.lang === "Mandarin" ? "— hire pending —" : p.lang === "Russian" ? "Lara Petrova" : p.lang === "Urdu" ? "Bilal Hussain" : "Derya Altun"}</option>
              {AGENTS.map((a) => <option key={a.id}>{a.name}</option>)}
            </select>
            <GoldBtn>Assign</GoldBtn>
          </div>
        </div>
      ))}
    </div>

    <SectionTitle>Reassignment queue</SectionTitle>
    <div style={{ ...card, overflow: "hidden" }}>
      {[["L-2440 · Fatima Al Said", "No first contact in 4h 12m (SLA 30 min)", "Bilal Hussain → pool", "bad"],
        ["L-2436 · Sergei Volkov", "Transfer requested by agent — pending approval", "Omar Farouk → Lara Petrova", "warn"]].map(([l, why, move, tone], i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 16px",
          borderTop: i ? `1px solid ${T.hairSoft}` : "none", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: 13.5, fontWeight: 600 }}>{l}</div>
            <div style={{ fontSize: 11.5, color: T.muted, marginTop: 1 }}>{why}</div>
          </div>
          <Chip tone={tone}>{move}</Chip>
          <div style={{ display: "flex", gap: 8 }}>
            <GoldBtn>Approve</GoldBtn><GoldBtn ghost>Reject</GoldBtn>
          </div>
        </div>
      ))}
    </div>
  </div>;
}

/* ============================ 5 PIPELINE BOARD =========================== */
function Pipeline({ go }) {
  return <div>
    {filter && go && (
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
        <button onClick={() => go("admin")} style={{ ...miniBtn() }}>← Dashboard</button>
        <span style={{ fontSize: 12.5, color: T.muted }}>Dashboard <span style={{ color: T.faint }}>›</span> Leads <span style={{ color: T.faint }}>›</span> <b style={{ color: T.ink }}>{filter.label}</b></span>
        <span style={{ background: T.goldSoft, color: T.gold, borderRadius: 8, padding: "3px 10px", fontSize: 11.5, fontWeight: 700 }}>
          {filtered.length} {filtered.length === 1 ? "lead" : "leads"}</span>
      </div>
    )}
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
      <div style={{ fontSize: 12.5, color: T.muted }}>64 active leads · AED 101M weighted</div>
      <div style={{ display: "flex", gap: 8 }}>
        <GoldBtn ghost><Filter size={13} /> Filter</GoldBtn><GoldBtn><Plus size={14} /> New lead</GoldBtn>
      </div>
    </div>
    <div style={{ overflowX: "auto", marginTop: 14, paddingBottom: 8 }}>
      <div style={{ display: "flex", gap: 12, minWidth: 1100 }}>
        {PIPE.map(([stage, n], col) => (
          <div key={stage} style={{ width: 195, flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: T.inkSoft }}>{stage}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: T.gold }}>{n}</span>
            </div>
            <div style={{ height: 2, background: col >= 6 ? T.gold : T.hair, marginBottom: 10, borderRadius: 2 }} />
            {LEADS.slice(0, Math.min(2, Math.max(1, 3 - (col % 3)))).map((l, i) => (
              <div key={stage + i} onClick={() => go("lead")} style={{ ...card, padding: "11px 12px", marginBottom: 8, cursor: "pointer" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 12.5, fontWeight: 600 }}>{LEADS[(col + i) % LEADS.length].name.split(" ").slice(-2).join(" ")}</span>
                  {((col + i) % 3 === 0) && <Flame size={12} color={T.bad} />}
                </div>
                <div style={{ fontSize: 11, color: T.muted, marginTop: 3 }}>{LEADS[(col + i) % LEADS.length].area} · {LEADS[(col + i) % LEADS.length].budget}</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 7 }}>
                  <Av name={LEADS[(col + i) % LEADS.length].agent || "A"} size={20} />
                  <span style={{ fontSize: 10.5, color: T.faint }}>{["2d", "5h", "1d", "3d"][((col + i) % 4)]} in stage</span>
                </div>
              </div>
            ))}
            <button style={{ width: "100%", border: `1px dashed ${T.hair}`, background: "transparent", color: T.faint,
              borderRadius: 9, padding: 7, fontSize: 11.5, cursor: "pointer", fontFamily: UI }}>+ Add</button>
          </div>
        ))}
      </div>
    </div>
  </div>;
}

/* =========================== 6 AGENT PERFORMANCE ========================= */
function Performance() {
  return <div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 12 }}>
      <Kpi label="Team conversion" value="13.2%" sub="+1.8 pts vs last month" trend="up" />
      <Kpi label="Avg response" value="24 min" sub="target 30 min" trend="up" />
      <Kpi label="Follow-up compliance" value="87%" sub="missed: 14 this month" />
      <Kpi label="Closed value (Q)" value="AED 33.9M" gold />
    </div>
    <SectionTitle>Agent leaderboard · June</SectionTitle>
    <div style={{ ...card, overflow: "hidden" }}>
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1.4fr", gap: 8, padding: "10px 16px",
        fontSize: 10.5, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: T.muted,
        borderBottom: `1px solid ${T.hair}` }}>
        <span>Agent</span><span>Leads</span><span>Closed</span><span>Conv.</span><span>Response</span><span>Performance</span>
      </div>
      {AGENTS.map((a, i) => (
        <div key={a.id} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1.4fr", gap: 8,
          alignItems: "center", padding: "13px 16px", borderTop: i ? `1px solid ${T.hairSoft}` : "none" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontFamily: DISPLAY, fontSize: 15, color: i === 0 ? T.gold : T.faint, width: 16 }}>{i + 1}</span>
            <Av name={a.name} size={30} dark={i === 0} />
            <span style={{ fontSize: 13, fontWeight: 600 }}>{a.name}</span>
          </div>
          <span style={{ fontSize: 13 }}>{a.leads}</span>
          <span style={{ fontSize: 13 }}>{a.deals}</span>
          <span style={{ fontSize: 13, fontWeight: 600 }}>{a.conv}%</span>
          <span style={{ fontSize: 13, color: a.resp.includes("h") ? T.bad : T.inkSoft }}>{a.resp}</span>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ flex: 1 }}><Bar pct={a.score} color={a.score > 70 ? T.gold : T.bad} h={7} /></div>
            <span style={{ fontSize: 12, fontWeight: 700, color: a.score > 70 ? T.ink : T.bad, width: 22 }}>{a.score}</span>
          </div>
        </div>
      ))}
    </div>
    <SectionTitle>Coaching flags</SectionTitle>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 12 }}>
      {[["Bilal Hussain", "Response time 1h 12m — 4× team average. 9 leads at First Contact Pending.", "bad"],
        ["Lara Petrova", "Strong conversion but 5 hot leads idle 3+ days — risk of cooling.", "warn"],
        ["Omar Farouk", "Export attempt this week — reminded of data policy. Pipeline healthy.", "warn"]].map(([who, note, tone], i) => (
        <div key={i} style={{ ...card, padding: 14, borderLeft: `3px solid ${tone === "bad" ? T.bad : T.warn}` }}>
          <div style={{ fontWeight: 600, fontSize: 13 }}>{who}</div>
          <div style={{ fontSize: 12, color: T.inkSoft, marginTop: 4, lineHeight: 1.5 }}>{note}</div>
        </div>
      ))}
    </div>
  </div>;
}

/* ========================= 7 SUSPICIOUS ACTIVITY ========================= */
function SecurityLog() {
  return <div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 12 }}>
      <Kpi label="Open alerts" value="3" sub="1 high severity" trend="down" />
      <Kpi label="Honeypot triggers" value="1" sub="this month" />
      <Kpi label="Blocked exports" value="4" sub="all logged" />
      <Kpi label="New devices (7d)" value="6" sub="2 unverified" />
    </div>

    <SectionTitle right={<GoldBtn ghost><Download size={13} /> Audit report</GoldBtn>}>Alert stream</SectionTitle>
    <div style={{ display: "grid", gap: 10 }}>
      {SUS.map((s, i) => (
        <div key={i} style={{ ...card, padding: "15px 17px", borderLeft: `3px solid ${s.sev === "high" ? T.bad : s.sev === "med" ? T.warn : T.hair}` }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div style={{ display: "flex", gap: 12 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: s.sev === "high" ? T.badSoft : s.sev === "med" ? T.warnSoft : T.hairSoft,
                display: "grid", placeItems: "center", flexShrink: 0 }}>
                {s.sev === "high" ? <ShieldAlert size={16} color={T.bad} /> : s.sev === "med" ? <AlertTriangle size={15} color={T.warn} /> : <Eye size={15} color={T.muted} />}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{s.what}</div>
                <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>{s.who} · {s.when}</div>
                <div style={{ fontSize: 11.5, color: T.faint, marginTop: 4, display: "flex", alignItems: "center", gap: 5 }}>
                  <Globe size={11} /> {s.meta}</div>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <Chip tone={s.sev === "high" ? "bad" : s.sev === "med" ? "warn" : "muted"}>
                {s.sev === "high" ? "High" : s.sev === "med" ? "Medium" : "Low"}</Chip>
              <div style={{ fontSize: 11.5, color: T.ok, marginTop: 6, display: "flex", alignItems: "center", gap: 4, justifyContent: "flex-end" }}>
                <CheckCircle2 size={12} /> {s.action}</div>
            </div>
          </div>
          {s.sev === "high" && <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <GoldBtn><Ban size={13} /> Keep suspended</GoldBtn>
            <GoldBtn ghost>Restore access</GoldBtn>
            <GoldBtn ghost><Eye size={13} /> Full audit trail</GoldBtn>
          </div>}
        </div>
      ))}
    </div>
  </div>;
}

/* ========================== 8 PROPERTY MATCHING ========================== */
function Matching({ go }) {
  return <div>
    <div style={{ ...card, padding: 16, display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
      <Av name="Mr. Vishal Kalantri" dark />
      <div style={{ flex: 1, minWidth: 200 }}>
        <div style={{ fontWeight: 600, fontSize: 14 }}>Matching for: Mr. Vishal Kalantri</div>
        <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>AED 22–25M · Penthouse/Villa · Palm Jumeirah preference · Golden Visa · Cash · 1–2 months</div>
      </div>
      <GoldBtn ghost onClick={() => go && go("lead")}><Filter size={13} /> Edit criteria</GoldBtn>
    </div>

    <SectionTitle>Matches · ranked</SectionTitle>
    <div style={{ display: "grid", gap: 12 }}>
      {PROJECTS.map((p, i) => (
        <div key={p.name} style={{ ...card, padding: "16px 18px", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap",
          borderColor: i === 0 ? T.goldEdge : T.hair, background: i === 0 ? T.goldTint : T.paper }}>
          <div style={{ width: 52, textAlign: "center" }}>
            <div style={{ fontFamily: DISPLAY, fontSize: 26, color: i === 0 ? T.gold : T.inkSoft }}>{p.match}</div>
            <div style={{ fontSize: 9, letterSpacing: ".1em", textTransform: "uppercase", color: T.faint, fontWeight: 700 }}>Match</div>
          </div>
          <div style={{ width: 1, alignSelf: "stretch", background: T.hairSoft }} />
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap" }}>
              <span style={{ fontSize: 15, fontWeight: 600 }}>{p.name}</span>
              {i === 0 && <Chip tone="gold">Best fit</Chip>}
            </div>
            <div style={{ fontSize: 12, color: T.muted, marginTop: 3 }}>
              {p.dev} · {p.type} · {p.price} · Handover {p.handover} · Plan {p.plan} · Yield {p.yieldPct}</div>
            <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
              {["Budget ✓", "Golden Visa ✓", p.type === "Villa" ? "Type ✓" : "Type ~", i < 2 ? "Area ✓" : "Area ~"].map((t) => (
                <Chip key={t} tone={t.includes("✓") ? "ok" : "muted"}>{t}</Chip>))}
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 9.5, letterSpacing: ".1em", textTransform: "uppercase", color: T.faint, fontWeight: 700 }}>Amber Score</div>
            <div style={{ fontFamily: DISPLAY, fontSize: 22, color: T.gold }}>{p.score}</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            <GoldBtn><MessageCircle size={13} /> Share via WhatsApp</GoldBtn>
            <GoldBtn ghost>Attach to lead</GoldBtn>
          </div>
        </div>
      ))}
    </div>
  </div>;
}

/* ======================== 9 AMBER INVESTMENT SCORE ======================= */
function ScorePage() {
  const total = SCORE_FACTORS.reduce((s, [, w, v]) => s + (w * v) / 10, 0);
  return <div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(290px,1fr))", gap: 14 }}>
      <div style={{ ...card, padding: 22, background: T.hero, border: "none", color: "#fff", textAlign: "center", boxShadow: T.shadowLg }}>
        <div style={{ fontSize: 10.5, letterSpacing: ".22em", textTransform: "uppercase", color: "rgba(255,255,255,.55)" }}>Amber Investment Score</div>
        <div style={{ fontFamily: DISPLAY, fontSize: 64, color: T.goldBright, lineHeight: 1.1, marginTop: 8 }}>{Math.round(total)}</div>
        <div style={{ fontFamily: DISPLAY, fontSize: 15, letterSpacing: ".14em", color: "#fff", marginTop: 2 }}>STRONG</div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,.6)", marginTop: 12, lineHeight: 1.55 }}>
          Palm Jebel Ali — Beach Villas<br />Nakheel · From AED 18.9M · Q4 2027</div>
        <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 16, fontSize: 11, color: "rgba(255,255,255,.55)" }}>
          <span>85–100 Prime</span><span style={{ color: T.goldBright }}>70–84 Strong</span><span>55–69 Fair</span><span>&lt;55 Caution</span>
        </div>
      </div>
      <div style={{ ...card, padding: 18 }}>
        <div style={{ fontFamily: DISPLAY, fontSize: 15, marginBottom: 13 }}>Factor breakdown</div>
        {SCORE_FACTORS.map(([f, w, v]) => (
          <div key={f} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 9 }}>
            <span style={{ width: 150, fontSize: 11.5, color: T.inkSoft }}>{f}</span>
            <span style={{ width: 30, fontSize: 10.5, color: T.faint }}>{w}%</span>
            <div style={{ flex: 1 }}><Bar pct={v * 10} color={v >= 8.5 ? T.gold : v >= 7 ? T.goldBright : T.warn} h={7} /></div>
            <span style={{ width: 24, textAlign: "right", fontSize: 12, fontWeight: 700 }}>{v}</span>
          </div>
        ))}
        <div style={{ fontSize: 10.5, color: T.faint, marginTop: 10, lineHeight: 1.5 }}>
          Weights are admin-tunable in Settings. The score is a decision aid, not financial advice.</div>
      </div>
    </div>
    <SectionTitle>Compare projects</SectionTitle>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))", gap: 12 }}>
      {PROJECTS.map((p) => (
        <div key={p.name} style={{ ...card, padding: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.3, paddingRight: 8 }}>{p.name}</div>
            <div style={{ fontFamily: DISPLAY, fontSize: 24, color: p.score >= 85 ? T.gold : T.inkSoft }}>{p.score}</div>
          </div>
          <div style={{ fontSize: 11, color: T.muted, marginTop: 4 }}>{p.dev} · {p.handover}</div>
          <div style={{ marginTop: 10 }}><Bar pct={p.score} /></div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: T.muted, marginTop: 7 }}>
            <span>Yield {p.yieldPct}</span><span>Plan {p.plan}</span>
          </div>
        </div>
      ))}
    </div>
  </div>;
}

/* =========================== 10 CAREERS / HIRING ========================= */
function Careers() {
  const stages = ["Applied", "Screening", "Final Interview", "Offer Sent", "Hired"];
  return <div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 12 }}>
      <Kpi label="Open roles" value="3" sub="2 sales · 1 telesales" />
      <Kpi label="Active candidates" value="14" sub="+5 this week" trend="up" />
      <Kpi label="Avg time to hire" value="18 days" />
      <Kpi label="Offer acceptance" value="80%" gold />
    </div>
    <SectionTitle right={<GoldBtn><Plus size={14} /> Add candidate</GoldBtn>}>Hiring pipeline</SectionTitle>
    <div style={{ ...card, padding: 14, display: "flex", gap: 0, overflowX: "auto" }}>
      {stages.map((s, i) => (
        <div key={s} style={{ flex: 1, minWidth: 110, textAlign: "center", position: "relative" }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase",
            color: i <= 3 ? T.ink : T.faint }}>{s}</div>
          <div style={{ fontFamily: DISPLAY, fontSize: 22, color: i <= 3 ? T.gold : T.faint, marginTop: 4 }}>
            {[6, 4, 2, 1, 1][i]}</div>
          {i < stages.length - 1 && <ChevronRight size={14} color={T.faint}
            style={{ position: "absolute", right: -7, top: "50%", transform: "translateY(-50%)" }} />}
        </div>
      ))}
    </div>
    <SectionTitle>Candidates</SectionTitle>
    <div style={{ display: "grid", gap: 10 }}>
      {CANDIDATES.map((c) => (
        <div key={c.name} style={{ ...card, padding: "14px 16px", display: "flex", alignItems: "center", gap: 13, flexWrap: "wrap" }}>
          <Av name={c.name} />
          <div style={{ flex: 1, minWidth: 180 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span style={{ fontWeight: 600, fontSize: 14 }}>{c.name}</span>
              <Chip tone={c.stage === "Offer Sent" ? "gold" : c.stage === "Final Interview" ? "info" : "muted"}>{c.stage}</Chip>
            </div>
            <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>{c.role} · {c.exp} · {c.lang} · via {c.src}</div>
          </div>
          <div style={{ textAlign: "center", width: 56 }}>
            <div style={{ fontFamily: DISPLAY, fontSize: 20, color: c.fit >= 80 ? T.gold : T.inkSoft }}>{c.fit}</div>
            <div style={{ fontSize: 9, letterSpacing: ".1em", textTransform: "uppercase", color: T.faint, fontWeight: 700 }}>Fit</div>
          </div>
          <div style={{ display: "flex", gap: 7 }}><GoldBtn ghost>CV</GoldBtn><GoldBtn>Advance</GoldBtn></div>
        </div>
      ))}
    </div>
  </div>;
}

/* =========================== 11 COMMISSION TRACKING ====================== */
function Commission() {
  return <div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 12 }}>
      <Kpi label="Gross commission (Q)" value="AED 677K" gold />
      <Kpi label="Paid out" value="AED 79.1K" sub="2 deals settled" />
      <Kpi label="Pending" value="AED 512K" sub="2 invoices open" trend="up" />
      <Kpi label="Company share" value="AED 348.3K" />
    </div>
    <SectionTitle right={<GoldBtn ghost><Download size={13} /> Export (admin)</GoldBtn>}>Closed deals</SectionTitle>
    <div style={{ ...card, overflow: "hidden" }}>
      <div style={{ overflowX: "auto" }}>
        <div style={{ minWidth: 760 }}>
          <div style={{ display: "grid", gridTemplateColumns: "0.8fr 1.2fr 1.5fr 0.9fr 1fr 1.3fr 1fr 0.9fr", gap: 8,
            padding: "10px 16px", fontSize: 10.5, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase",
            color: T.muted, borderBottom: `1px solid ${T.hair}` }}>
            <span>Deal</span><span>Client</span><span>Project</span><span>Value</span><span>Gross 2%</span><span>Agent</span><span>Agent cut</span><span>Status</span>
          </div>
          {COMMISSIONS.map((c, i) => (
            <div key={c.deal} style={{ display: "grid", gridTemplateColumns: "0.8fr 1.2fr 1.5fr 0.9fr 1fr 1.3fr 1fr 0.9fr",
              gap: 8, alignItems: "center", padding: "13px 16px", borderTop: i ? `1px solid ${T.hairSoft}` : "none", fontSize: 12.5 }}>
              <span style={{ fontWeight: 700, color: T.gold }}>{c.deal}</span>
              <span>{c.client}</span>
              <span style={{ color: T.inkSoft }}>{c.project}</span>
              <span style={{ fontWeight: 600 }}>AED {c.value}M</span>
              <span style={{ fontWeight: 600 }}>AED {(c.gross / 1000).toFixed(0)}K</span>
              <span>{c.agent}</span>
              <span>AED {(c.agentCut / 1000).toFixed(1)}K</span>
              <Chip tone={c.status === "Paid" ? "ok" : "warn"}>{c.status}</Chip>
            </div>
          ))}
        </div>
      </div>
    </div>
    <SectionTitle>Agent payouts · June</SectionTitle>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12 }}>
      {[["Derya Altun", 240.5, "1 paid · 1 pending"], ["Omar Farouk", 57.6, "pending invoice"], ["Lara Petrova", 30.6, "paid"]].map(([n, v, s]) => (
        <div key={n} style={{ ...card, padding: 16, display: "flex", alignItems: "center", gap: 12 }}>
          <Av name={n} dark />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 13.5 }}>{n}</div>
            <div style={{ fontSize: 11, color: T.muted }}>{s}</div>
          </div>
          <div style={{ fontFamily: DISPLAY, fontSize: 18, color: T.gold }}>AED {v}K</div>
        </div>
      ))}
    </div>
  </div>;
}

/* ======================== 12 SETTINGS & PERMISSIONS ====================== */
function SettingsPage() {
  const roles = ["Owner", "Manager", "Agent", "Marketing", "Accounts"];
  const perms = [
    ["View all leads", [1, 0.5, 0, 0, 0.5]],
    ["See unmasked contacts", [1, 0.5, 0.5, 0, 0.5]],
    ["Assign / reassign", [1, 0.5, 0, 0, 0]],
    ["Export / bulk download", [1, 0.5, 0, 0.5, 0.5]],
    ["Delete leads", [1, 0, 0, 0, 0]],
    ["View audit logs", [1, 0.5, 0, 0, 0]],
    ["Manage users", [1, 0, 0, 0, 0]],
    ["Commission & invoices", [1, 0.5, 0.5, 0, 1]],
  ];
  const cell = (v) => v === 1 ? <CheckCircle2 size={15} color={T.ok} /> : v === 0.5
    ? <span style={{ fontSize: 10, fontWeight: 700, color: T.warn }}>Scoped</span>
    : <Ban size={13} color={T.faint} />;
  return <div>
    <SectionTitle>Role permissions <span style={{ fontSize: 11, color: T.faint, fontFamily: UI }}>· deny by default</span></SectionTitle>
    <div style={{ ...card, overflow: "hidden" }}>
      <div style={{ overflowX: "auto" }}>
        <div style={{ minWidth: 640 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.8fr repeat(5, 1fr)", gap: 8, padding: "11px 16px",
            fontSize: 10.5, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: T.muted,
            borderBottom: `1px solid ${T.hair}`, background: T.bone }}>
            <span>Permission</span>{roles.map((r) => <span key={r} style={{ textAlign: "center" }}>{r}</span>)}
          </div>
          {perms.map(([p, vals], i) => (
            <div key={p} style={{ display: "grid", gridTemplateColumns: "1.8fr repeat(5, 1fr)", gap: 8, alignItems: "center",
              padding: "12px 16px", borderTop: i ? `1px solid ${T.hairSoft}` : "none", fontSize: 12.5 }}>
              <span style={{ fontWeight: 500 }}>{p}</span>
              {vals.map((v, j) => <div key={j} style={{ display: "grid", placeItems: "center" }}>{cell(v)}</div>)}
            </div>
          ))}
        </div>
      </div>
    </div>

    <SectionTitle>Security policies</SectionTitle>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))", gap: 12 }}>
      {[["Two-factor authentication", "Required for all roles", true, Lock],
        ["Phone masking", "Reveal on click · every reveal logged", true, EyeOff],
        ["Idle auto-logout", "After 15 minutes", true, Clock],
        ["Screen watermark", "Viewer name + timestamp on lead screens", true, ShieldAlert],
        ["Honeypot leads", "3 canary leads active", true, Flame],
        ["Velocity alerts", "Flag >20 lead views / 10 min", true, TrendingUp],
        ["Agent exports", "Blocked — admin approval required", true, Ban],
        ["Device approval", "New devices require admin verification", false, Smartphone]].map(([t, d, on, Ic]) => (
        <div key={t} style={{ ...card, padding: 15, display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: on ? T.goldSoft : T.hairSoft,
            display: "grid", placeItems: "center", flexShrink: 0 }}><Ic size={15} color={on ? T.gold : T.faint} /></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{t}</div>
            <div style={{ fontSize: 11, color: T.muted, marginTop: 1 }}>{d}</div>
          </div>
          <div style={{ width: 36, height: 21, borderRadius: 20, background: on ? T.gold : T.hair, position: "relative",
            cursor: "pointer", flexShrink: 0 }}>
            <div style={{ position: "absolute", top: 2.5, left: on ? 18 : 3, width: 16, height: 16, borderRadius: 16,
              background: on ? T.goldBright : T.paper, transition: "left .15s" }} />
          </div>
        </div>
      ))}
    </div>

    <SectionTitle>Users</SectionTitle>
    <div style={{ ...card, overflow: "hidden" }}>
      {[...AGENTS.map((a) => ({ n: a.name, r: "Agent", s: a.name === "Bilal Hussain" ? "Suspended" : "Active" })),
        { n: "Ambreen Qureshi", r: "Manager", s: "Active" }, { n: "Saad Waqas", r: "Owner", s: "Active" }].map((u, i) => (
        <div key={u.n} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px",
          borderTop: i ? `1px solid ${T.hairSoft}` : "none" }}>
          <Av name={u.n} size={32} dark={u.r === "Owner"} />
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{u.n}</span>
            <span style={{ fontSize: 11.5, color: T.muted, marginLeft: 8 }}>{u.r}</span>
          </div>
          <Chip tone={u.s === "Active" ? "ok" : "bad"}>{u.s}</Chip>
          <GoldBtn ghost>{u.s === "Suspended" ? "Review" : "Manage"}</GoldBtn>
        </div>
      ))}
    </div>
  </div>;
}

/* ============================= OPEN LEADS ================================ */
function OpenLeads() {
  const [revealed, setRevealed] = useState({});
  const toggle = (id, kind) => setRevealed((r) => ({ ...r, [id + kind]: !r[id + kind] }));
  return <div>
    <div style={{ ...card, padding: "15px 18px", display: "flex", gap: 12, alignItems: "flex-start",
      borderLeft: `3px solid ${T.gold}` }}>
      <Unlock size={17} color={T.gold} style={{ flexShrink: 0, marginTop: 2 }} />
      <div style={{ fontSize: 12.5, color: T.inkSoft, lineHeight: 1.6 }}>
        <b style={{ color: T.ink }}>Open pool rule:</b> any lead not closed within <b style={{ color: T.gold }}>60 days</b> of
        assignment is automatically released here, visible to <b>all agents</b>. Name and project are open; phone and
        email stay masked until revealed — <b>every reveal is logged</b> with agent, time, and device. First agent to
        log a meaningful contact claims the lead.
      </div>
    </div>

    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 12, marginTop: 14 }}>
      <Kpi label="Open leads" value={OPEN_LEADS.length} sub="auto-released at 60 days" />
      <Kpi label="Combined budget" value="AED 29.3M" gold />
      <Kpi label="Reveals this week" value="11" sub="all logged" />
      <Kpi label="Reclaimed & closed" value="3" sub="last 90 days" trend="up" />
    </div>

    <SectionTitle right={<Chip tone="gold">Visible to all agents</Chip>}>Open list</SectionTitle>
    <div style={{ ...card, overflow: "hidden" }}>
      <div style={{ overflowX: "auto" }}>
        <div style={{ minWidth: 880 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1.7fr 0.8fr 0.9fr 0.9fr 1.5fr 1.5fr 1fr", gap: 8,
            padding: "10px 16px", fontSize: 10.5, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase",
            color: T.muted, borderBottom: `1px solid ${T.hair}`, background: T.bone }}>
            <span>Client</span><span>Project</span><span>Type</span><span>Budget</span><span>Age</span>
            <span>Phone</span><span>Email</span><span>Action</span>
          </div>
          {OPEN_LEADS.map((l, i) => (
            <div key={l.id} style={{ display: "grid", gridTemplateColumns: "1.5fr 1.7fr 0.8fr 0.9fr 0.9fr 1.5fr 1.5fr 1fr",
              gap: 8, alignItems: "center", padding: "13px 16px", borderTop: i ? `1px solid ${T.hairSoft}` : "none", fontSize: 12.5 }}>
              <div>
                <div style={{ fontWeight: 600 }}>{l.name}</div>
                <div style={{ fontSize: 10.5, color: T.faint }}>{l.id} · was {l.lastAgent}</div>
              </div>
              <span style={{ color: T.inkSoft }}>{l.project}</span>
              <Chip tone={l.ptype === "Off-plan" ? "gold" : "muted"}>{l.ptype}</Chip>
              <span style={{ fontWeight: 600 }}>{l.budget}</span>
              <Chip tone={l.days > 70 ? "bad" : "warn"}>{l.days}d</Chip>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <span style={{ fontSize: 12 }}>{revealed[l.id + "p"] ? l.phoneFull : l.phone}</span>
                <button onClick={() => toggle(l.id, "p")} title="Reveal is logged" style={{ border: `1px solid ${T.goldEdge}`,
                  background: T.goldSoft, color: T.gold, borderRadius: 7, padding: "2px 7px", fontSize: 10, fontWeight: 700,
                  cursor: "pointer", fontFamily: UI, display: "inline-flex", alignItems: "center", gap: 3 }}>
                  {revealed[l.id + "p"] ? <EyeOff size={10} /> : <Eye size={10} />}{revealed[l.id + "p"] ? "Hide" : "Reveal"}</button>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <span style={{ fontSize: 12 }}>{revealed[l.id + "e"] ? l.emailFull : l.email}</span>
                <button onClick={() => toggle(l.id, "e")} title="Reveal is logged" style={{ border: `1px solid ${T.goldEdge}`,
                  background: T.goldSoft, color: T.gold, borderRadius: 7, padding: "2px 7px", fontSize: 10, fontWeight: 700,
                  cursor: "pointer", fontFamily: UI, display: "inline-flex", alignItems: "center", gap: 3 }}>
                  {revealed[l.id + "e"] ? <EyeOff size={10} /> : <Eye size={10} />}{revealed[l.id + "e"] ? "Hide" : "Reveal"}</button>
              </div>
              <GoldBtn><Phone size={12} /> Claim</GoldBtn>
            </div>
          ))}
        </div>
      </div>
    </div>
    <div style={{ fontSize: 11, color: T.faint, marginTop: 10 }}>
      Reveals on open leads are rate-limited and velocity-monitored like all contact data — mass-revealing triggers a security alert.
    </div>
  </div>;
}

/* ========================= AI CHAT (ALL USERS) =========================== */
function AskAmber({ narrow, user }) {
  const [open, setOpen] = useState(false);
  const [mentor, setMentor] = useState(null);     // chosen mentor object
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [ctx, setCtx] = useState(null);
  const boxRef = useRef(null);
  useEffect(() => { if (boxRef.current) boxRef.current.scrollTop = boxRef.current.scrollHeight; }, [msgs, busy]);

  const pick = async (m) => {
    setMentor(m);
    setMsgs([{ role: "assistant", text: m.greeting }]);
    setCtx(await buildCrmContext(user)); // fetch permitted CRM context once per session
  };
  const reset = () => { setMentor(null); setMsgs([]); setInput(""); };

  const send = async (q) => {
    const text = (q != null ? q : input).trim();
    if (!text || busy || !mentor) return;
    setInput("");
    // client-side guard: refuse obvious non-work content without calling the model
    const cat = classifyInappropriate(text);
    if (cat) {
      const refusal = { ambreen_ai: "Nice try, but Ask Amber is for work — not gossip or time-pass. Ask me about your leads, follow-ups or deals.",
        saad_ai: "This is not work-related. Ask me about your leads, clients, deals, CRM or Dubai real estate.",
        ibrahim_ai: "Let's keep it work-related. I can help you with clients, WhatsApp replies, leads, follow-ups or CRM questions." }[mentor.id];
      setMsgs((m) => [...m, { role: "user", text }, { role: "assistant", text: refusal }]);
      logAi({ user, mentor, question: text, responseSum: "[refused: " + cat + "]", status: "refused", flagCategory: cat });
      return;
    }
    const next = [...msgs, { role: "user", text }];
    setMsgs(next); setBusy(true);
    try {
      const res = await fetch("/api/ai", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mentor: mentor.id, crmContext: ctx,
          messages: next.slice(-12).map((m) => ({ role: m.role === "user" ? "user" : "assistant", content: m.text })) }) });
      const data = await res.json();
      if (data.error) {
        setMsgs((m) => [...m, { role: "assistant", text: "Ask Amber is temporarily unavailable. Please try again." }]);
        logAi({ user, mentor, question: text, status: "error" });
      } else {
        const reply = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n").trim();
        setMsgs((m) => [...m, { role: "assistant", text: reply || "Please try again." }]);
        logAi({ user, mentor, question: text, responseSum: reply, model: data.model, status: "success" });
      }
    } catch (e) {
      setMsgs((m) => [...m, { role: "assistant", text: "Ask Amber is temporarily unavailable. Please try again." }]);
      logAi({ user, mentor, question: text, status: "error" });
    } finally { setBusy(false); }
  };

  // floating launcher
  if (!open) return (
    <button onClick={() => setOpen(true)} title="Ask Amber — your AI sales mentor" style={{ position: "fixed", right: 20, bottom: 20, zIndex: 60,
      display: "flex", alignItems: "center", gap: 9, padding: "12px 16px", borderRadius: 999, border: `1px solid ${T.goldEdge}`,
      cursor: "pointer", background: T.hero, color: "#fff", boxShadow: T.shadowLg, fontFamily: UI }}>
      <span style={{ width: 26, height: 26, borderRadius: 8, background: "rgba(212,175,92,.18)", display: "grid", placeItems: "center" }}>
        <Sparkle size={15} color={T.goldBright} /></span>
      <span style={{ fontWeight: 700, fontSize: 13.5 }}>Ask Amber</span></button>
  );

  const panel = narrow ? { position: "fixed", inset: 0, borderRadius: 0 }
    : { position: "fixed", right: 20, bottom: 20, width: 400, height: "min(640px, 86vh)", borderRadius: 18 };

  return (
    <div style={{ ...panel, zIndex: 65, background: T.paper, border: `1px solid ${T.hair}`, boxShadow: T.shadowLg,
      display: "flex", flexDirection: "column", overflow: "hidden", fontFamily: UI }}>
      {/* header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 16px", background: T.hero }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {mentor ? <img src={mentor.avatar} alt="" style={{ width: 34, height: 34, borderRadius: 10, objectFit: "cover" }} />
            : <span style={{ width: 32, height: 32, borderRadius: 10, background: "rgba(212,175,92,.15)", display: "grid", placeItems: "center" }}><Sparkle size={17} color={T.goldBright} /></span>}
          <div>
            <div style={{ color: "#fff", fontFamily: DISPLAY, fontSize: 14.5 }}>{mentor ? mentor.name : "Ask Amber"}</div>
            <div style={{ color: "rgba(255,255,255,.55)", fontSize: 10.5 }}>{mentor ? "Your AI sales mentor" : "Choose your mentor"}</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {mentor && <button onClick={reset} title="Switch mentor" style={hdrBtn()}><Users size={14} color="#fff" /></button>}
          <button onClick={() => { setOpen(false); }} title="Close" style={hdrBtn()}><X size={15} color="#fff" /></button>
        </div>
      </div>

      {!mentor ? (
        /* mentor selection */
        <div style={{ flex: 1, overflowY: "auto", padding: 18, background: T.bone }}>
          <div style={{ fontFamily: DISPLAY, fontSize: 17, color: T.ink }}>Choose your Amber AI Mentor</div>
          <div style={{ fontSize: 12.5, color: T.muted, margintop: 2, marginBottom: 16 }}>Select who you want guidance from today.</div>
          <div style={{ display: "grid", gap: 12 }}>
            {MENTORS.map((m) => (
              <div key={m.id} style={{ ...card, padding: 14, display: "flex", alignItems: "center", gap: 13 }}>
                <img src={m.avatar} alt={m.name} style={{ width: 52, height: 52, borderRadius: 13, objectFit: "cover", flexShrink: 0, border: `2px solid ${m.accent}` }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{m.name}</div>
                  <div style={{ fontSize: 11.5, color: T.muted, marginTop: 2, lineHeight: 1.4 }}>{m.desc}</div>
                </div>
                <button onClick={() => pick(m)} style={{ flexShrink: 0, background: T.btnBg, color: T.btnFg, border: "none",
                  borderRadius: 9, padding: "8px 13px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: UI }}>Choose</button>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 10.5, color: T.faint, marginTop: 14, lineHeight: 1.5, textAlign: "center" }}>
            Ask Amber is a work-only assistant for CRM, leads, clients and Dubai real estate.</div>
        </div>
      ) : (<>
        <div ref={boxRef} style={{ flex: 1, overflowY: "auto", padding: 14, background: T.bone }}>
          {msgs.map((m, i) => (
            <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", marginBottom: 9 }}>
              <div style={{ maxWidth: "88%", background: m.role === "user" ? T.btnBg : T.paper,
                color: m.role === "user" ? T.btnFg : T.ink, border: m.role === "user" ? "none" : `1px solid ${T.hair}`,
                borderRadius: 13, padding: "9px 12px", fontSize: 12.8, lineHeight: 1.55, whiteSpace: "pre-wrap",
                boxShadow: m.role === "user" ? "none" : T.shadow }}>{m.text}</div>
            </div>
          ))}
          {busy && <div style={{ fontSize: 12, color: T.muted, padding: "4px 2px" }}>{mentor.name} is thinking…</div>}
        </div>
        {msgs.filter((m) => m.role === "user").length === 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, padding: "0 14px 10px", background: T.bone }}>
            {["What should I focus on today?", "Show me my hot leads", "Draft a WhatsApp follow-up"].map((s) => (
              <button key={s} onClick={() => send(s)} style={{ border: `1px solid ${T.goldEdge}`, background: T.goldSoft, color: T.gold,
                borderRadius: 9, padding: "6px 11px", fontSize: 11.5, fontWeight: 600, cursor: "pointer", fontFamily: UI }}>{s}</button>))}
          </div>
        )}
        <div style={{ display: "flex", gap: 8, padding: 11, borderTop: `1px solid ${T.hair}`, background: T.paper }}>
          <button onClick={reset} title="New chat" style={{ ...miniBtn(), padding: "0 11px" }}>New</button>
          <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") send(); }}
            placeholder={"Ask " + mentor.name.replace(" AI", "") + "…"} style={{ flex: 1, border: `1px solid ${T.hair}`, borderRadius: 11, padding: "10px 12px",
              fontSize: 12.8, fontFamily: UI, outline: "none", color: T.ink, background: T.bone }} />
          <button onClick={() => send()} disabled={!input.trim() || busy} style={{ border: "none", borderRadius: 11, width: 40, height: 40,
            display: "grid", placeItems: "center", cursor: "pointer", background: T.btnBg, color: T.btnFg, opacity: (!input.trim() || busy) ? .5 : 1 }}>
            <Send size={16} /></button>
        </div>
      </>)}
    </div>
  );
}
function hdrBtn() { return { border: "none", background: "rgba(255,255,255,.14)", borderRadius: 9, width: 30, height: 30,
  display: "grid", placeItems: "center", cursor: "pointer" }; }

function LoginFlow({ onLogin, dark, setDark }) {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const submitCreds = async () => {
    setErr("");
    const mail = email.trim().toLowerCase();
    if (!mail.includes("@")) { setErr("Enter your work email."); return; }
    if (pw.length < 4) { setErr("Enter your password."); return; }
    setBusy(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: mail, password: pw });
      if (error) { setBusy(false); setErr("Email or password is incorrect."); return; }
      const { data: prof } = await supabase.from("profiles")
        .select("full_name, role, active, force_password_change").eq("id", data.user.id).single();
      if (!prof) { setBusy(false); setErr("No profile found for this account. Contact your admin."); return; }
      if (prof.active === false) { setBusy(false); setErr("This account has been deactivated. Contact your administrator."); return; }
      const ri = roleInfo(prof.role);
      setBusy(false);
      stampLogin(data.user.id);
      onLogin({ name: prof.full_name || data.user.email, email: data.user.email, role: prof.role, roleLabel: ri.label,
        home: ri.home, id: data.user.id, mustChangePw: !!prof.force_password_change });
    } catch (e) { setBusy(false); setErr("Could not reach the server. Check your connection."); }
  };

  const inputS = { width: "100%", border: `1px solid ${T.hair}`, borderRadius: 11, padding: "12px 14px",
    fontSize: 14, fontFamily: UI, outline: "none", color: T.ink, background: T.bone, boxSizing: "border-box" };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "grid", placeItems: "center", padding: 18,
      fontFamily: UI, overflowY: "auto",
      background: "radial-gradient(1100px 600px at 78% -8%, rgba(196,154,74,.22), transparent 60%), linear-gradient(160deg, #0b1320 0%, #0e1828 42%, #111d2f 100%)" }}>

      {/* premium architectural backdrop — CSS/SVG only, no logo, no external imagery */}
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
        <svg viewBox="0 0 1440 900" preserveAspectRatio="xMidYMax slice" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.5 }}>
          <defs>
            <linearGradient id="tower" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1b2a40" /><stop offset="100%" stopColor="#0b1320" />
            </linearGradient>
            <linearGradient id="towerLit" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#243755" /><stop offset="100%" stopColor="#0d1626" />
            </linearGradient>
          </defs>
          {/* skyline silhouette */}
          <g>
            <rect x="120" y="520" width="70" height="380" fill="url(#tower)" />
            <rect x="210" y="430" width="60" height="470" fill="url(#towerLit)" />
            <rect x="290" y="560" width="80" height="340" fill="url(#tower)" />
            <polygon points="700,150 726,250 726,900 674,900 674,250" fill="url(#towerLit)" />
            <rect x="660" y="250" width="80" height="650" fill="url(#towerLit)" opacity="0.5" />
            <rect x="780" y="470" width="64" height="430" fill="url(#tower)" />
            <rect x="858" y="380" width="72" height="520" fill="url(#towerLit)" />
            <rect x="946" y="540" width="60" height="360" fill="url(#tower)" />
            <rect x="1020" y="440" width="78" height="460" fill="url(#towerLit)" />
            <rect x="1112" y="560" width="66" height="340" fill="url(#tower)" />
            <rect x="1192" y="500" width="70" height="400" fill="url(#towerLit)" />
            <rect x="40" y="600" width="64" height="300" fill="url(#tower)" />
          </g>
        </svg>
        {/* subtle window lights */}
        <div style={{ position: "absolute", inset: 0, background:
          "radial-gradient(2px 2px at 715px 320px, rgba(212,175,92,.5), transparent), radial-gradient(2px 2px at 705px 420px, rgba(212,175,92,.35), transparent), radial-gradient(2px 2px at 885px 460px, rgba(212,175,92,.4), transparent), radial-gradient(2px 2px at 1050px 520px, rgba(212,175,92,.3), transparent)" }} />
        {/* darkening vignette so the card pops */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(8,14,24,.2) 0%, rgba(8,14,24,.55) 100%)" }} />
      </div>

      <button onClick={() => setDark(!dark)} style={{ position: "absolute", top: 16, right: 16,
        border: "1px solid rgba(255,255,255,.18)", background: "rgba(255,255,255,.06)", borderRadius: 9, width: 36, height: 36,
        display: "grid", placeItems: "center", cursor: "pointer", zIndex: 2 }}>
        {dark ? <Sun size={16} color="#E6C46B" /> : <Moon size={16} color="#cdd6e4" />}</button>

      <div style={{ width: "100%", maxWidth: 410, position: "relative", zIndex: 2 }}>
        {/* brand — text only, no logo */}
        <div style={{ textAlign: "center", marginBottom: 22 }}>
          <div style={{ fontFamily: DISPLAY, fontSize: 27, letterSpacing: ".04em", color: "#fff", fontWeight: 500, lineHeight: 1.15 }}>
            Amber Homes Real Estate</div>
          <div style={{ width: 38, height: 2, background: "linear-gradient(90deg, transparent, #C49A4A, transparent)", margin: "12px auto 0" }} />
        </div>

        <div style={{ background: T.paper, border: `1px solid ${T.hair}`, borderRadius: 18, boxShadow: "0 30px 80px rgba(0,0,0,.5)", padding: "28px 26px" }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: T.ink }}>Sign in to access your CRM dashboard.</div>
          <div style={{ fontSize: 12.5, color: T.muted, marginTop: 5, marginBottom: 20 }}>
            Use your Amber Homes work email and password.</div>
          <label style={{ display: "block", marginBottom: 12 }}>
            <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: T.muted }}>Work email</span>
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@amberhomes.ae"
              autoComplete="username" onKeyDown={(e) => { if (e.key === "Enter") submitCreds(); }} style={{ ...inputS, marginTop: 6 }} />
          </label>
          <label style={{ display: "block", marginBottom: 6 }}>
            <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: T.muted }}>Password</span>
            <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="••••••••"
              autoComplete="current-password" onKeyDown={(e) => { if (e.key === "Enter") submitCreds(); }}
              style={{ ...inputS, marginTop: 6 }} />
          </label>
          <div style={{ textAlign: "right", marginBottom: 14 }}>
            <button onClick={async () => { if (!email.includes("@")) { setErr("Enter your email first, then tap reset."); return; }
              const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase());
              setErr(error ? "Could not send reset email." : "Password reset link sent to your email."); }}
              style={{ background: "none", border: "none", color: T.gold, fontSize: 11.5, fontWeight: 600,
              cursor: "pointer", fontFamily: UI }}>Forgot password?</button></div>
          {err && <div style={{ color: err.includes("sent") ? T.ok : T.bad, fontSize: 12, fontWeight: 600, marginBottom: 10 }}>{err}</div>}
          <button onClick={submitCreds} disabled={busy} style={{ width: "100%", background: T.btnBg, color: T.btnFg,
            border: "none", borderRadius: 11, padding: "13px", fontSize: 14, fontWeight: 700, cursor: "pointer",
            fontFamily: UI, opacity: busy ? .6 : 1 }}>{busy ? "Signing in…" : "Sign in"}</button>
        </div>

        <div style={{ marginTop: 16, textAlign: "center" }}>
          <div style={{ fontSize: 11.5, color: "rgba(255,255,255,.62)", lineHeight: 1.5 }}>
            Your dashboard access is based on your assigned role.</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,.4)", marginTop: 6 }}>
            Accounts are created by your Master Admin. Trouble signing in? Contact your administrator.</div>
        </div>
      </div>
    </div>
  );
}

function LiveLeads({ user, filter, go, openLead }) {
  const isAgent = user && user.role === "agent";
  const [leads, setLeads] = useState(null);   // null = loading
  const [err, setErr] = useState("");
  const [q, setQ] = useState("");
  const [tab, setTab] = useState("all");
  const [revealed, setRevealed] = useState({});
  const [showAdd, setShowAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [me, setMe] = useState(null);

  const load = async () => {
    setErr("");
    const { data: { user: au } } = await supabase.auth.getUser();
    setMe(au);
    const { data, error } = await supabase.from("leads")
      .select("id, lead_code, client_name, phone, email, project, area, budget, assigned_agent_name, assigned_agent, current_owner, created_by, status, temperature, is_open, next_followup, last_contacted, created_on")
      .order("created_on", { ascending: false }).limit(2000);
    if (error) { setErr(isAgent ? "Unable to load your leads. Please try again or contact admin." : ("Couldn't load leads: " + error.message)); setLeads([]); return; }
    let rows = data || [];
    // Agents: show only leads actually assigned to or created by them (RLS also returns the open pool — exclude that here).
    if (isAgent && au) rows = rows.filter((l) => l.assigned_agent === au.id || l.current_owner === au.id || l.created_by === au.id);
    setLeads(rows);
  };
  useEffect(() => { load(); }, []);

  const today = dubaiToday();
  const maskPhone = (p) => { if (!p) return "—"; const s = String(p); return s.slice(0, 5) + " ••• " + s.slice(-2); };
  const digits = (p) => String(p || "").replace(/\D/g, "");
  const reveal = async (l) => {
    setRevealed((r) => ({ ...r, [l.id]: true }));
    if (me) logAction("view_number", l, me.id);
  };

  const matchFilter = (l) => {
    if (!filter) return true;
    switch (filter.type) {
      case "unassigned": return !l.assigned_agent_name;
      case "temp":       return l.temperature === filter.value;
      case "status":     return l.status === filter.value;
      case "open":       return l.is_open === true;
      case "source":     return (l.source || "Unknown") === filter.value;
      case "agent":      return (l.assigned_agent_name || "Unassigned") === filter.value;
      case "hot":        return l.temperature === "Hot" || l.temperature === "Very Hot";
      case "due":        return l.next_followup && l.next_followup <= today && l.status !== "Closed Won" && l.status !== "Closed Lost";
      case "overdue":    return l.next_followup && l.next_followup < today && l.status !== "Closed Won" && l.status !== "Closed Lost";
      default:           return true;
    }
  };
  const TABS = ["all", "New", "Hot", "Very Hot", "Warm", "Cold", "Follow-up due", "Overdue", "Closed Won", "Closed Lost"];
  const matchTab = (l) => {
    switch (tab) {
      case "all": return true;
      case "Follow-up due": return l.next_followup && l.next_followup <= today && l.status !== "Closed Won" && l.status !== "Closed Lost";
      case "Overdue": return l.next_followup && l.next_followup < today && l.status !== "Closed Won" && l.status !== "Closed Lost";
      case "Hot": case "Very Hot": case "Warm": case "Cold": return l.temperature === tab;
      default: return l.status === tab;
    }
  };
  const filtered = (leads || []).filter(matchFilter).filter(matchTab).filter((l) => {
    if (!q.trim()) return true;
    const s = q.toLowerCase();
    return [l.client_name, l.project, l.area, l.assigned_agent_name, l.lead_code, l.status].some((v) => (v || "").toLowerCase().includes(s));
  });

  return <div>
    {filter && go && (
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
        <button onClick={() => go(isAgent ? "agent" : "admin")} style={{ ...miniBtn() }}>← {isAgent ? "Dashboard" : "Dashboard"}</button>
        <span style={{ fontSize: 12.5, color: T.muted }}>{isAgent ? "My Dashboard" : "Dashboard"} <span style={{ color: T.faint }}>›</span> {isAgent ? "My Leads" : "Leads"} <span style={{ color: T.faint }}>›</span> <b style={{ color: T.ink }}>{filter.label}</b></span>
        <span style={{ background: T.goldSoft, color: T.gold, borderRadius: 8, padding: "3px 10px", fontSize: 11.5, fontWeight: 700 }}>
          {filtered.length} {filtered.length === 1 ? "lead" : "leads"}</span>
      </div>
    )}
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
        {isAgent ? (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: T.goldSoft, color: T.gold,
            borderRadius: 8, padding: "4px 10px", fontSize: 11, fontWeight: 700 }}>
            <UserCircle size={12} /> {leads === null ? "Loading…" : `${leads.length} ${leads.length === 1 ? "lead" : "leads"}`}</span>
        ) : (<>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: T.okSoft, color: T.ok,
            borderRadius: 8, padding: "4px 10px", fontSize: 11, fontWeight: 700 }}>
            <span style={{ width: 7, height: 7, borderRadius: 7, background: T.ok }} /> LIVE DATABASE</span>
          <span style={{ fontSize: 12.5, color: T.muted }}>{leads === null ? "Loading…" : `${leads.length} leads`}</span>
        </>)}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={load} style={{ ...miniBtn() }}><RefreshCw size={13} /> Refresh</button>
        {!isAgent && <button onClick={() => setShowImport(true)} style={{ ...miniBtn() }}><Upload size={13} /> Import file</button>}
        <button onClick={() => setShowAdd(true)} style={{ background: T.btnBg, color: T.btnFg, border: "none",
          borderRadius: 9, padding: "8px 14px", fontSize: 12.5, fontWeight: 700, cursor: "pointer", fontFamily: UI,
          display: "inline-flex", alignItems: "center", gap: 6 }}><Plus size={14} /> Add lead</button>
      </div>
    </div>

    {err && <div style={{ ...card, padding: 14, marginTop: 14, borderColor: T.badSoft, color: T.bad, fontSize: 13 }}>{err}</div>}

    <div style={{ ...card, padding: "10px 14px", marginTop: 14, display: "flex", alignItems: "center", gap: 9 }}>
      <Search size={15} color={T.muted} />
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={isAgent ? "Search my leads…" : "Search name, project, area, agent…"}
        style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontSize: 13, fontFamily: UI, color: T.ink }} />
      {q && <span style={{ fontSize: 11.5, color: T.muted }}>{filtered.length} match</span>}
    </div>

    {/* status tabs */}
    <div style={{ display: "flex", gap: 7, marginTop: 12, overflowX: "auto", paddingBottom: 3 }}>
      {TABS.map((t) => (
        <button key={t} onClick={() => setTab(t)} style={{ flexShrink: 0, border: `1px solid ${tab === t ? T.gold : T.hair}`,
          background: tab === t ? T.goldSoft : T.paper, color: tab === t ? T.gold : T.muted, borderRadius: 999,
          padding: "6px 13px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: UI }}>
          {t === "all" ? "All" : t}</button>
      ))}
    </div>

    {leads === null ? (
      <div style={{ ...card, padding: 40, marginTop: 14, textAlign: "center", color: T.muted }}>Loading your leads…</div>
    ) : leads.length === 0 ? (
      <div style={{ ...card, padding: 44, marginTop: 14, textAlign: "center" }}>
        <UserCircle size={26} color={T.faint} style={{ marginBottom: 10 }} />
        <div style={{ fontWeight: 700, fontSize: 15 }}>{isAgent ? "No leads assigned yet" : "No leads yet"}</div>
        <div style={{ fontSize: 12.5, color: T.muted, marginTop: 4, maxWidth: 360, marginInline: "auto", lineHeight: 1.5 }}>
          {isAgent ? "When your manager assigns leads to you — or you add your own with the button above — they'll appear here."
                   : "Import a CSV or use Add lead above to get started."}</div>
      </div>
    ) : filtered.length === 0 ? (
      <div style={{ ...card, padding: 36, marginTop: 14, textAlign: "center", color: T.muted, fontSize: 13 }}>No leads match this filter.</div>
    ) : (
      <div style={{ ...card, overflow: "hidden", marginTop: 14 }}>
        <div style={{ overflowX: "auto" }}>
          <div style={{ minWidth: isAgent ? 820 : 880 }}>
            <div style={{ display: "grid", gridTemplateColumns: isAgent ? "1.5fr 1.3fr 1fr 1.2fr 0.9fr 1fr" : "0.7fr 1.4fr 1.3fr 1.3fr 1.1fr 1.2fr 0.9fr", gap: 8,
              padding: "10px 16px", fontSize: 10.5, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase",
              color: T.muted, borderBottom: `1px solid ${T.hair}`, background: T.bone }}>
              {isAgent ? <><span>Client</span><span>Project</span><span>Budget</span><span>Next follow-up</span><span>Status</span><span>Contact</span></>
                       : <><span>Code</span><span>Client</span><span>Project</span><span>Phone</span><span>Area</span><span>Agent</span><span>Status</span></>}
            </div>
            {filtered.map((l, i) => (isAgent ? (
              <div key={l.id} onClick={() => openLead && openLead(l.id)} style={{ display: "grid", gridTemplateColumns: "1.5fr 1.3fr 1fr 1.2fr 0.9fr 1fr",
                gap: 8, alignItems: "center", padding: "12px 16px", borderTop: i ? `1px solid ${T.hairSoft}` : "none", fontSize: 12.5, cursor: "pointer" }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>{l.client_name}
                    {(l.temperature === "Hot" || l.temperature === "Very Hot") && <span style={{ width: 7, height: 7, borderRadius: 7, background: T.bad }} />}</div>
                  <div style={{ fontSize: 10.5, color: T.faint }}>{l.area || "—"}</div>
                </div>
                <span style={{ color: T.inkSoft }}>{l.project || "—"}</span>
                <span style={{ color: T.inkSoft }}>{l.budget || "—"}</span>
                <span style={{ color: l.next_followup && l.next_followup < today ? T.bad : T.inkSoft, fontSize: 12 }}>
                  {l.next_followup || "—"}</span>
                <Chip tone={l.is_open ? "gold" : l.temperature === "Hot" || l.temperature === "Very Hot" ? "bad" : "info"}>{l.is_open ? "Open" : l.status}</Chip>
                <span style={{ display: "flex", gap: 6 }}>
                  {l.phone && <a href={`https://wa.me/${digits(l.phone)}`} target="_blank" rel="noreferrer" title="WhatsApp"
                    onClick={(e) => { e.stopPropagation(); logAction("whatsapp", l, me && me.id); }}
                    style={{ width: 30, height: 30, borderRadius: 8, background: T.okSoft, display: "grid", placeItems: "center", textDecoration: "none" }}>
                    <MessageCircle size={14} color={T.ok} /></a>}
                  {l.phone && <a href={`tel:${digits(l.phone)}`} title="Call"
                    onClick={(e) => { e.stopPropagation(); logAction("call", l, me && me.id); }}
                    style={{ width: 30, height: 30, borderRadius: 8, background: T.bone, border: `1px solid ${T.hair}`, display: "grid", placeItems: "center", textDecoration: "none" }}>
                    <Phone size={13} color={T.inkSoft} /></a>}
                </span>
              </div>
            ) : (
              <div key={l.id} onClick={() => openLead && openLead(l.id)} style={{ display: "grid", gridTemplateColumns: "0.7fr 1.4fr 1.3fr 1.3fr 1.1fr 1.2fr 0.9fr",
                gap: 8, alignItems: "center", padding: "12px 16px", borderTop: i ? `1px solid ${T.hairSoft}` : "none", fontSize: 12.5, cursor: "pointer" }}>
                <span style={{ fontWeight: 700, color: T.gold, fontSize: 11 }}>{l.lead_code}</span>
                <span style={{ fontWeight: 600 }}>{l.client_name}</span>
                <span style={{ color: T.inkSoft }}>{l.project || "—"}</span>
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 12 }}>{revealed[l.id] ? l.phone : maskPhone(l.phone)}</span>
                  {!revealed[l.id] && <button onClick={(e) => { e.stopPropagation(); reveal(l); }} title="Reveal is logged"
                    style={{ border: `1px solid ${T.goldEdge}`, background: T.goldSoft, color: T.gold, borderRadius: 6,
                      padding: "2px 6px", fontSize: 9.5, fontWeight: 700, cursor: "pointer", fontFamily: UI }}>Reveal</button>}
                </span>
                <span style={{ color: T.inkSoft }}>{l.area || "—"}</span>
                <span>{l.assigned_agent_name || <span style={{ color: T.faint }}>unassigned</span>}</span>
                <Chip tone={l.is_open ? "gold" : "info"}>{l.is_open ? "Open" : l.status}</Chip>
              </div>
            )))}
          </div>
        </div>
      </div>
    )}
    <div style={{ fontSize: 11, color: T.faint, marginTop: 10 }}>
      {isAgent ? "These are your leads only. Tap WhatsApp or call to reach a client directly."
               : "This screen reads your real database. Phone reveals are written to the activity log. What each person sees is enforced by row-level security."}
    </div>

    {showAdd && <AddLeadModal me={me} user={user} onClose={() => setShowAdd(false)} onSaved={() => { setShowAdd(false); load(); }} />}
    {showImport && <ImportModal me={me} onClose={() => setShowImport(false)} onDone={() => { setShowImport(false); load(); }} />}
  </div>;
}
function miniBtn() { return { background: T.paper, color: T.ink, border: `1px solid ${T.hair}`, borderRadius: 9,
  padding: "8px 13px", fontSize: 12.5, fontWeight: 600, cursor: "pointer", fontFamily: UI,
  display: "inline-flex", alignItems: "center", gap: 6 }; }

/* ---- Add Lead: validation + duplicate check + autocomplete + AI extract ---- */
const DUBAI_AREAS = ["Palm Jumeirah","Palm Jebel Ali","Dubai Hills Estate","Downtown Dubai","Business Bay","Dubai Marina","Jumeirah Village Circle","JVC","Jumeirah Village Triangle","JVT","Arabian Ranches","Arabian Ranches 2","Arabian Ranches 3","Dubai Creek Harbour","Emaar South","Dubai South","Dubai Islands","Damac Hills","Damac Hills 2","Tilal Al Ghaf","Mohammed Bin Rashid City","MBR City","District One","City Walk","Nad Al Sheba","Meydan","Jumeirah Golf Estates","Emirates Living","Springs","Meadows","The Lakes","Bluewaters","Madinat Jumeirah Living","Rashid Yachts and Marina"];
const DUBAI_PROJECTS = ["Palm Jebel Ali","Dubai Hills Estate","Emaar South","The Valley","Rashid Yachts and Marina","Dubai Creek Harbour","City Walk","Madinat Jumeirah Living","Nad Al Sheba Gardens","District One","Damac Lagoons","Damac Hills","Sobha Hartland","Sobha One","Sobha Reserve","Tilal Al Ghaf","Arabian Ranches 3","Expo City","Dubai Islands","Bay Villas","Bluewaters Residences","Jumeirah Living"];
const normPhone = (p) => { if (!p) return ""; let d = String(p).replace(/[^\d+]/g, ""); if (d.startsWith("00")) d = "+" + d.slice(2); else if (!d.startsWith("+")) d = "+" + d; return d; };

function AddLeadModal({ onClose, onSaved, me, user }) {
  const isAgent = user && user.role === "agent";
  const [mode, setMode] = useState("manual"); // manual | ai
  const [aiText, setAiText] = useState(""); const [aiBusy, setAiBusy] = useState(false); const [aiErr, setAiErr] = useState("");
  const [f, setF] = useState({ client_name: "", phone: "", email: "", project: "", area: "", budget: "",
    property_type: "", ready_offplan: "", purpose: "", nationality: "", followup_note: "",
    assigned_agent_name: isAgent ? (user.name || "") : "" });
  const [busy, setBusy] = useState(false); const [err, setErr] = useState("");
  const [dup, setDup] = useState(null); // pending duplicate, requires confirm
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));

  const extract = async () => {
    if (!aiText.trim()) return; setAiBusy(true); setAiErr("");
    try {
      const res = await fetch("/api/ai", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system: "Extract real-estate lead fields from the user's text. Reply with ONLY a JSON object, no prose, with keys: client_name, phone, email, area, project, budget, property_type, ready_offplan, purpose, nationality, followup_note. Use empty string for anything not present. budget should keep currency like 'AED 8,000,000'. ready_offplan should be 'Off-plan' or 'Ready' or ''.",
          messages: [{ role: "user", content: aiText.slice(0, 4000) }] }) });
      const data = await res.json();
      if (data.error) { setAiErr("AI not available: " + data.error); setAiBusy(false); return; }
      let txt = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("").trim();
      txt = txt.replace(/^```json/i, "").replace(/```$/, "").trim();
      const j = JSON.parse(txt);
      setF((s) => ({ ...s, ...Object.fromEntries(Object.entries(j).map(([k, v]) => [k, v || ""])),
        assigned_agent_name: isAgent ? (user.name || "") : (j.assigned_agent_name || s.assigned_agent_name) }));
      setMode("manual"); // show the filled form for review
    } catch (e) { setAiErr("Couldn't read AI response. Try again or enter manually."); }
    setAiBusy(false);
  };

  const doInsert = async (overrideDup) => {
    setBusy(true); setErr("");
    const phone = normPhone(f.phone);
    // duplicate check (phone or email)
    if (!overrideDup) {
      let dq = supabase.from("leads").select("lead_code, client_name, phone, email").limit(1);
      const ors = [`phone.eq.${phone}`]; if (f.email.trim()) ors.push(`email.eq.${f.email.trim()}`);
      const { data: hit } = await supabase.from("leads").select("lead_code, client_name, phone, email")
        .or(ors.join(",")).limit(1);
      if (hit && hit.length) {
        if (isAgent) { setBusy(false); setErr("A lead with this phone/email already exists (" + hit[0].lead_code + "). Ask an admin to add it."); return; }
        setDup(hit[0]); setBusy(false); return;
      }
    }
    const code = "L-" + Math.random().toString(36).slice(2, 7).toUpperCase();
    const { data: ins, error } = await supabase.from("leads").insert({
      lead_code: code, client_name: f.client_name.trim(), phone, whatsapp: phone, email: f.email.trim() || null,
      project: f.project.trim() || null, area: f.area.trim() || null, budget: f.budget.trim() || null,
      property_type: f.property_type.trim() || null, ready_offplan: f.ready_offplan.trim() || null,
      purpose: f.purpose.trim() || null, nationality: f.nationality.trim() || null, followup_note: f.followup_note.trim() || null,
      assigned_agent_name: f.assigned_agent_name.trim() || null, source: "Manual", status: "New", temperature: "Cold",
    }).select("id").single();
    if (error) { setBusy(false); setErr(error.message); return; }
    // audit
    if (me && ins) supabase.from("lead_activity").insert({ lead_id: ins.id, actor_id: me.id,
      action: aiUsed ? "lead_created_ai" : "lead_created", detail: { lead_code: code } }).then(() => {});
    setBusy(false); onSaved();
  };
  const [aiUsed] = useState(false);

  const save = () => {
    if (!f.client_name.trim()) { setErr("Client name is required."); return; }
    if (!normPhone(f.phone) || normPhone(f.phone).length < 7) { setErr("Phone number is required to create a lead."); return; }
    setDup(null); doInsert(false);
  };

  const inp = { width: "100%", border: `1px solid ${T.hair}`, borderRadius: 10, padding: "10px 12px", fontSize: 13,
    fontFamily: UI, outline: "none", color: T.ink, background: T.bone, boxSizing: "border-box", marginTop: 5 };
  const field = (lbl, k, opts = {}) => (
    <label style={{ display: "block", marginBottom: 10 }}>
      <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: T.muted }}>{lbl}</span>
      <input value={f[k]} onChange={(e) => set(k, e.target.value)} list={opts.list}
        placeholder={opts.ph || ""} disabled={opts.disabled}
        onBlur={opts.norm ? () => set(k, normPhone(f[k])) : undefined}
        style={{ ...inp, opacity: opts.disabled ? .6 : 1 }} />
    </label>
  );

  return <Modal title="Add lead" onClose={onClose}>
    <div style={{ display: "flex", gap: 6, marginBottom: 14, background: T.bone, borderRadius: 10, padding: 4 }}>
      {[["manual", "Manual"], ["ai", "✨ Add with AI"]].map(([m, lbl]) => (
        <button key={m} onClick={() => setMode(m)} style={{ flex: 1, border: "none", borderRadius: 8, padding: "8px",
          fontSize: 12.5, fontWeight: 700, cursor: "pointer", fontFamily: UI,
          background: mode === m ? T.paper : "transparent", color: mode === m ? T.ink : T.muted,
          boxShadow: mode === m ? T.shadow : "none" }}>{lbl}</button>
      ))}
    </div>

    {mode === "ai" ? <>
      <div style={{ fontSize: 12.5, color: T.muted, marginBottom: 8, lineHeight: 1.5 }}>
        Paste messy client info — AI extracts the fields, then you review before saving.</div>
      <textarea value={aiText} onChange={(e) => setAiText(e.target.value)} rows={5}
        placeholder="e.g. Ahmed Khan, +971501234567, wants off-plan villa in Palm Jebel Ali, budget AED 8M, investment, Pakistani, call back next week"
        style={{ ...inp, resize: "vertical", fontFamily: UI }} />
      {aiErr && <div style={{ color: T.bad, fontSize: 12, fontWeight: 600, margin: "8px 0" }}>{aiErr}</div>}
      <button onClick={extract} disabled={aiBusy || !aiText.trim()} style={{ width: "100%", marginTop: 10, background: T.btnBg,
        color: T.btnFg, border: "none", borderRadius: 10, padding: "12px", fontSize: 13.5, fontWeight: 700,
        cursor: "pointer", fontFamily: UI, opacity: (aiBusy || !aiText.trim()) ? .5 : 1 }}>
        {aiBusy ? "Extracting…" : "Extract lead → review"}</button>
      <div style={{ fontSize: 10.5, color: T.faint, marginTop: 8, lineHeight: 1.5 }}>
        AI fills the form for you to check — nothing saves without your confirmation. Requires the AI key set in Vercel.</div>
    </> : <>
      <datalist id="areas">{DUBAI_AREAS.map((a) => <option key={a} value={a} />)}</datalist>
      <datalist id="projects">{DUBAI_PROJECTS.map((p) => <option key={p} value={p} />)}</datalist>
      {field("Client name *", "client_name")}
      {field("Phone * (required)", "phone", { norm: true, ph: "+9715…" })}
      {field("Email", "email", { ph: "optional" })}
      {field("Area", "area", { list: "areas", ph: "type or pick" })}
      {field("Project", "project", { list: "projects", ph: "type or pick" })}
      {field("Budget", "budget", { ph: "AED …" })}
      {field("Property type", "property_type", { ph: "Villa / Apartment …" })}
      {field("Ready / Off-plan", "ready_offplan", { ph: "Off-plan / Ready" })}
      {field("Purpose", "purpose", { ph: "Investment / End-use" })}
      {field("Nationality", "nationality")}
      {field("Follow-up note", "followup_note")}
      {field(isAgent ? "Assigned to (you)" : "Assign to (agent name)", "assigned_agent_name", { disabled: isAgent })}
      {err && <div style={{ color: T.bad, fontSize: 12.5, fontWeight: 600, marginBottom: 8 }}>{err}</div>}
      {dup && <div style={{ ...card, padding: 12, marginBottom: 10, borderColor: T.warnSoft, background: T.warnSoft }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: T.warn }}>Possible duplicate lead found</div>
        <div style={{ fontSize: 11.5, color: T.inkSoft, marginTop: 3 }}>{dup.lead_code} · {dup.client_name} · {dup.phone}</div>
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <button onClick={() => { setDup(null); doInsert(true); }} style={{ ...miniBtn(), borderColor: T.warn, color: T.warn }}>Create anyway</button>
          <button onClick={() => setDup(null)} style={{ ...miniBtn() }}>Cancel</button>
        </div>
      </div>}
      {!dup && <button onClick={save} disabled={busy} style={{ width: "100%", background: T.btnBg, color: T.btnFg, border: "none",
        borderRadius: 10, padding: "12px", fontSize: 13.5, fontWeight: 700, cursor: "pointer", fontFamily: UI, opacity: busy ? .6 : 1 }}>
        {busy ? "Saving…" : "Save to database"}</button>}
    </>}
  </Modal>;
}

/* ---- Import file (CSV) → Supabase ---- */
function ImportModal({ onClose, onDone, me }) {
  const [rows, setRows] = useState(null); const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(""); const [done, setDone] = useState(0);
  const parseCsv = (text) => {
    const lines = text.split(/\r?\n/).filter((l) => l.trim());
    if (!lines.length) return [];
    const split = (l) => { const out = []; let cur = "", inq = false;
      for (let i = 0; i < l.length; i++) { const c = l[i];
        if (c === '"') inq = !inq; else if (c === "," && !inq) { out.push(cur); cur = ""; } else cur += c; }
      out.push(cur); return out.map((s) => s.trim().replace(/^"|"$/g, "")); };
    const hdr = split(lines[0]).map((h) => h.toLowerCase());
    const pick = (cells, names) => { for (const n of names) { const idx = hdr.findIndex((h) => h.includes(n)); if (idx >= 0 && cells[idx]) return cells[idx]; } return null; };
    return lines.slice(1).map((l) => { const c = split(l);
      return { client_name: pick(c, ["customer", "name", "client"]) || "Unknown",
        phone: pick(c, ["mobile", "phone", "whatsapp"]), email: pick(c, ["email"]),
        project: pick(c, ["property type", "project"]), area: pick(c, ["location", "area"]),
        assigned_agent_name: pick(c, ["agent"]) }; });
  };
  const onFile = (e) => { const file = e.target.files[0]; if (!file) return;
    const r = new FileReader(); r.onload = () => { try { setRows(parseCsv(String(r.result))); setErr(""); }
      catch (x) { setErr("Couldn't read that file. Use a .csv export."); } }; r.readAsText(file); };
  const run = async () => {
    if (!rows || !rows.length) return; setBusy(true); setErr(""); let n = 0;
    for (let i = 0; i < rows.length; i += 50) {
      const batch = rows.slice(i, i + 50).map((x, j) => ({
        lead_code: "L-" + Date.now().toString(36).slice(-4) + (i + j),
        client_name: x.client_name, phone: x.phone ? "+" + String(x.phone).replace(/\D/g, "") : null,
        whatsapp: x.phone ? "+" + String(x.phone).replace(/\D/g, "") : null, email: x.email || null,
        project: x.project || null, area: x.area || null, assigned_agent_name: x.assigned_agent_name || null,
        source: "Import", status: "New", temperature: "Cold" }));
      const { error } = await supabase.from("leads").insert(batch);
      if (error) { setErr(error.message); setBusy(false); return; }
      n += batch.length; setDone(n);
    }
    setBusy(false); onDone();
  };
  return <Modal title="Import leads from file" onClose={onClose}>
    <div style={{ fontSize: 12.5, color: T.muted, marginBottom: 12, lineHeight: 1.5 }}>
      Upload a <b>.csv</b> file. Columns are auto-detected (customer/name, mobile/phone, email, property type/project, location/area, agent).
      For Excel, use File → Save As → CSV first.</div>
    <input type="file" accept=".csv,text/csv" onChange={onFile} style={{ fontSize: 13, marginBottom: 12 }} />
    {rows && <div style={{ ...card, padding: 12, marginBottom: 12, fontSize: 12.5 }}>
      Found <b>{rows.length}</b> rows. First: {rows[0]?.client_name} · {rows[0]?.project || "—"}</div>}
    {err && <div style={{ color: T.bad, fontSize: 12, fontWeight: 600, marginBottom: 8 }}>{err}</div>}
    {busy && <div style={{ fontSize: 12.5, color: T.muted, marginBottom: 8 }}>Importing… {done} saved</div>}
    <button onClick={run} disabled={!rows || busy} style={{ width: "100%", background: T.btnBg, color: T.btnFg, border: "none",
      borderRadius: 10, padding: "12px", fontSize: 13.5, fontWeight: 700, cursor: rows ? "pointer" : "default",
      fontFamily: UI, opacity: (!rows || busy) ? .5 : 1 }}>{busy ? "Importing…" : `Import ${rows ? rows.length : ""} leads`}</button>
  </Modal>;
}

function Modal({ title, children, onClose }) {
  return <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 80,
    display: "grid", placeItems: "center", padding: 16 }}>
    <div onClick={(e) => e.stopPropagation()} style={{ background: T.paper, borderRadius: 16, boxShadow: T.shadowLg,
      width: "100%", maxWidth: 420, maxHeight: "86vh", overflowY: "auto", padding: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <span style={{ fontFamily: DISPLAY, fontSize: 17 }}>{title}</span>
        <button onClick={onClose} style={{ border: "none", background: T.bone, borderRadius: 8, width: 30, height: 30,
          display: "grid", placeItems: "center", cursor: "pointer" }}><X size={15} color={T.inkSoft} /></button>
      </div>
      {children}
    </div>
  </div>;
}

/* ===================== PROFILE MENU (the "S" box) ======================== */
function ProfileMenu({ user, dark, setDark, accent, setAccent, ACCENTS, signOut }) {
  const [open, setOpen] = useState(false);
  const [modal, setModal] = useState(null); // 'profile' | 'settings' | 'password'
  const [details, setDetails] = useState(null);
  const ini = (user?.name || "S").trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  useEffect(() => {
    if ((modal === "profile" || modal === "settings") && !details && user?.id) {
      (async () => {
        const today = dubaiToday();
        const { data: p } = await supabase.from("profiles").select("phone, department, job_title, last_login, created_at, active, twofa_required").eq("id", user.id).single();
        const { data: ls } = await supabase.from("leads").select("status, next_followup, assigned_agent, current_owner, created_by").limit(2000);
        const mine = (ls || []).filter((l) => l.assigned_agent === user.id || l.current_owner === user.id || l.created_by === user.id);
        setDetails({ ...(p || {}), assigned: mine.length,
          closed: mine.filter((l) => l.status === "Closed Won").length,
          due: mine.filter((l) => l.next_followup && l.next_followup <= today && l.status !== "Closed Won" && l.status !== "Closed Lost").length });
      })();
    }
  }, [modal]);
  return <>
    <div style={{ position: "relative" }}>
      <button onClick={() => setOpen(!open)} style={{ width: 36, height: 36, borderRadius: 10, background: T.hero,
        color: T.goldBright, display: "grid", placeItems: "center", fontFamily: DISPLAY, fontSize: 14, border: "none",
        cursor: "pointer" }}>{ini}</button>
      {open && <>
        <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 70 }} />
        <div style={{ position: "absolute", right: 0, top: 44, width: 244, background: T.paper, border: `1px solid ${T.hair}`,
          borderRadius: 14, boxShadow: T.shadowLg, zIndex: 71, overflow: "hidden", fontFamily: UI }}>
          <div style={{ padding: "14px 16px", background: T.hero, color: "#fff" }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>{user?.name}</div>
            <div style={{ fontSize: 11.5, color: "rgba(255,255,255,.6)", marginTop: 1 }}>{user?.email}</div>
            <span style={{ display: "inline-block", marginTop: 7, fontSize: 10.5, fontWeight: 700, background: "rgba(212,175,92,.18)",
              color: T.goldBright, borderRadius: 7, padding: "2px 9px" }}>{user?.roleLabel}</span>
          </div>
          <div style={{ padding: 6 }}>
            {[["Profile", "profile"], ["Settings", "settings"], ["Change password", "password"]].map(([lbl, m]) => (
              <button key={m} onClick={() => { setModal(m); setOpen(false); }} style={menuItem()}>{lbl}</button>
            ))}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px" }}>
              <span style={{ fontSize: 13, color: T.ink }}>Theme</span>
              <div style={{ display: "flex", gap: 5 }}>
                {ACCENTS.map(([k, label, hex]) => (
                  <button key={k} onClick={() => setAccent(k)} title={label} style={{ width: 15, height: 15, borderRadius: 15,
                    background: hex, border: accent === k ? `2px solid ${T.ink}` : "2px solid transparent", cursor: "pointer", padding: 0 }} />
                ))}
              </div>
            </div>
            <button onClick={() => setDark(!dark)} style={menuItem()}>{dark ? "Light mode" : "Dark mode"}</button>
            <div style={{ height: 1, background: T.hairSoft, margin: "5px 8px" }} />
            <button onClick={signOut} style={{ ...menuItem(), color: T.bad, fontWeight: 600 }}>Log out</button>
          </div>
        </div>
      </>}
    </div>
    {modal === "password" && <ChangePasswordModal onClose={() => setModal(null)} />}
    {modal === "profile" && <Modal title="My profile" onClose={() => { setModal(null); }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
        <Av name={user?.name || "Agent"} size={54} />
        <div>
          <div style={{ fontFamily: DISPLAY, fontSize: 18 }}>{user?.name}</div>
          <span style={{ display: "inline-block", marginTop: 4, fontSize: 10.5, fontWeight: 700, background: T.goldSoft,
            color: T.gold, borderRadius: 7, padding: "2px 9px" }}>{user?.roleLabel}</span>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 14 }}>
        {[["Assigned", details?.assigned], ["Closed", details?.closed], ["Due", details?.due]].map(([k, v]) => (
          <div key={k} style={{ ...card, padding: "10px 8px", textAlign: "center" }}>
            <div style={{ fontFamily: DISPLAY, fontSize: 22 }}>{details ? (v ?? 0) : "—"}</div>
            <div style={{ fontSize: 10, color: T.muted, textTransform: "uppercase", letterSpacing: ".06em" }}>{k}</div>
          </div>))}
      </div>
      <Row k="Email" v={user?.email} />
      <Row k="Phone" v={details?.phone || "—"} />
      <Row k="Role" v={user?.roleLabel} />
      <Row k="Department" v={details?.department || "—"} />
      <Row k="Job title" v={details?.job_title || "—"} />
      <Row k="Status" v={details?.active === false ? "Inactive" : "Active"} />
      <Row k="Joined" v={details?.created_at ? new Date(details.created_at).toLocaleDateString() : "—"} />
      <Row k="Last login" v={details?.last_login ? new Date(details.last_login).toLocaleString() : "—"} />
      <div style={{ marginTop: 14, fontSize: 11, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: T.muted }}>Preferred theme</div>
      <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
        {ACCENTS.map(([k, label, hex]) => (
          <button key={k} onClick={() => setAccent(k)} style={{ display: "flex", alignItems: "center", gap: 6,
            border: `1px solid ${accent === k ? T.gold : T.hair}`, background: accent === k ? T.goldSoft : T.paper,
            borderRadius: 9, padding: "6px 10px", fontSize: 11.5, fontWeight: 600, cursor: "pointer", fontFamily: UI }}>
            <span style={{ width: 12, height: 12, borderRadius: 12, background: hex }} /> {label}</button>))}
        <button onClick={() => setDark(!dark)} style={{ ...miniBtn() }}>{dark ? "Light mode" : "Dark mode"}</button>
      </div>
      <button onClick={() => setModal("password")} style={{ ...miniBtn(), width: "100%", justifyContent: "center", marginTop: 14 }}>
        <Lock size={13} /> Change password</button>
      <div style={{ fontSize: 11, color: T.faint, marginTop: 10, lineHeight: 1.5 }}>
        To update your name, phone, role or team, contact your administrator.</div>
    </Modal>}
    {modal === "settings" && <Modal title="Settings" onClose={() => setModal(null)}>
      <SettingsBlock title="Appearance">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 0" }}>
          <span style={{ fontSize: 13 }}>Dark mode</span>
          <button onClick={() => setDark(!dark)} style={{ ...miniBtn() }}>{dark ? "On" : "Off"}</button></div>
        <div style={{ fontSize: 12.5, marginTop: 8, marginBottom: 8, color: T.muted }}>Accent theme</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{ACCENTS.map(([k, label, hex]) => (
          <button key={k} onClick={() => setAccent(k)} style={{ display: "flex", alignItems: "center", gap: 6,
            border: `1px solid ${accent === k ? T.gold : T.hair}`, background: accent === k ? T.goldSoft : T.paper,
            borderRadius: 9, padding: "6px 10px", fontSize: 11.5, fontWeight: 600, cursor: "pointer", fontFamily: UI }}>
            <span style={{ width: 12, height: 12, borderRadius: 12, background: hex }} /> {label}</button>))}</div>
      </SettingsBlock>
      <SettingsBlock title="Security">
        <button onClick={() => setModal("password")} style={{ ...miniBtn(), width: "100%", justifyContent: "center" }}>
          <Lock size={13} /> Change password</button>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0 2px" }}>
          <span style={{ fontSize: 13 }}>Two-factor authentication</span>
          <Chip tone={details?.twofa_required ? "gold" : "muted"}>{details?.twofa_required ? "Required — set up on device" : "Not enabled"}</Chip></div>
        <Row k="Last login" v={details?.last_login ? new Date(details.last_login).toLocaleString() : "—"} />
      </SettingsBlock>
      <SettingsBlock title="Notifications">
        {[["New lead assigned", true], ["Follow-up reminders", true], ["Lead reassigned / opened", true]].map(([l, on]) => (
          <div key={l} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 0" }}>
            <span style={{ fontSize: 12.5 }}>{l}</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: on ? T.ok : T.faint }}>{on ? "On" : "Off"}</span></div>))}
        <div style={{ fontSize: 10.5, color: T.faint, marginTop: 4 }}>Notification preferences are on by default. Per-channel controls arrive with the alerts module.</div>
      </SettingsBlock>
      <SettingsBlock title="Account">
        <Row k="Name" v={user?.name} /><Row k="Email" v={user?.email} /><Row k="Role" v={user?.roleLabel} />
      </SettingsBlock>
      <button onClick={signOut} style={{ width: "100%", background: T.badSoft, color: T.bad, border: `1px solid ${T.bad}`,
        borderRadius: 10, padding: "11px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: UI, marginTop: 6 }}>Log out</button>
    </Modal>}
  </>;
}
function menuItem() { return { width: "100%", textAlign: "left", background: "none", border: "none", padding: "9px 12px",
  fontSize: 13, color: T.ink, cursor: "pointer", fontFamily: UI, borderRadius: 8 }; }
function Row({ k, v }) { return <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0",
  borderBottom: `1px solid ${T.hairSoft}`, fontSize: 13 }}><span style={{ color: T.muted }}>{k}</span><b>{v}</b></div>; }
function SettingsBlock({ title, children }) {
  return <div style={{ marginBottom: 16 }}>
    <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase", color: T.gold, marginBottom: 8 }}>{title}</div>
    <div style={{ ...card, padding: "10px 14px" }}>{children}</div>
  </div>;
}

function ChangePasswordModal({ onClose }) {
  const [cur, setCur] = useState(""); const [pw, setPw] = useState(""); const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false); const [msg, setMsg] = useState(""); const [ok, setOk] = useState(false);
  const save = async () => {
    if (!cur) { setMsg("Enter your current password."); return; }
    if (pw.length < 8) { setMsg("New password must be at least 8 characters."); return; }
    if (pw !== pw2) { setMsg("New passwords don't match."); return; }
    setBusy(true); setMsg("");
    // verify current password by re-authenticating
    const { data: { user: au } } = await supabase.auth.getUser();
    const { error: authErr } = await supabase.auth.signInWithPassword({ email: au.email, password: cur });
    if (authErr) { setBusy(false); setMsg("Current password is incorrect."); return; }
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) { setMsg("Couldn't update password. Please try again."); return; }
    setOk(true); setMsg("Password updated successfully.");
    setTimeout(onClose, 1300);
  };
  const inp = { width: "100%", border: `1px solid ${T.hair}`, borderRadius: 10, padding: "10px 12px", fontSize: 13,
    fontFamily: UI, outline: "none", color: T.ink, background: T.bone, boxSizing: "border-box", marginTop: 5, marginBottom: 10 };
  return <Modal title="Change password" onClose={onClose}>
    <input type="password" placeholder="Current password" value={cur} onChange={(e) => setCur(e.target.value)} style={inp} />
    <input type="password" placeholder="New password" value={pw} onChange={(e) => setPw(e.target.value)} style={inp} />
    <input type="password" placeholder="Confirm new password" value={pw2} onChange={(e) => setPw2(e.target.value)} style={inp} />
    <div style={{ fontSize: 11, color: T.faint, marginBottom: 10 }}>At least 8 characters. Use a mix of letters, numbers and symbols.</div>
    {msg && <div style={{ color: ok ? T.ok : T.bad, fontSize: 12, fontWeight: 600, marginBottom: 10 }}>{msg}</div>}
    <button onClick={save} disabled={busy} style={{ width: "100%", background: T.btnBg, color: T.btnFg, border: "none",
      borderRadius: 10, padding: "12px", fontSize: 13.5, fontWeight: 700, cursor: "pointer", fontFamily: UI, opacity: busy ? .6 : 1 }}>
      {busy ? "Saving…" : "Update password"}</button>
  </Modal>;
}

/* ===================== NOTIFICATIONS (the red dot) ======================= */
function NotifBell({ go }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const load = async () => {
    const { data } = await supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(30);
    setItems(data || []);
  };
  useEffect(() => { load(); }, []);
  const unread = items.filter((n) => !n.read).length;
  const markAll = async () => {
    const ids = items.filter((n) => !n.read).map((n) => n.id);
    if (!ids.length) return;
    await supabase.from("notifications").update({ read: true }).in("id", ids);
    setItems((it) => it.map((n) => ({ ...n, read: true })));
  };
  const markOne = async (n) => {
    if (n.read) return;
    await supabase.from("notifications").update({ read: true }).eq("id", n.id);
    setItems((it) => it.map((x) => x.id === n.id ? { ...x, read: true } : x));
  };
  const ago = (t) => { const d = (Date.now() - new Date(t)) / 6e4; if (d < 60) return Math.max(1, Math.round(d)) + "m";
    if (d < 1440) return Math.round(d / 60) + "h"; return Math.round(d / 1440) + "d"; };
  return <div style={{ position: "relative" }}>
    <button onClick={() => { setOpen(!open); if (!open) load(); }} style={{ position: "relative", border: `1px solid ${T.hair}`,
      background: T.paper, borderRadius: 9, width: 36, height: 36, display: "grid", placeItems: "center", cursor: "pointer" }}>
      <Bell size={16} color={T.inkSoft} />
      {unread > 0 && <span style={{ position: "absolute", top: 5, right: 5, minWidth: 15, height: 15, borderRadius: 15,
        background: T.bad, color: "#fff", fontSize: 9, fontWeight: 800, display: "grid", placeItems: "center", padding: "0 3px" }}>{unread}</span>}
    </button>
    {open && <>
      <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 70 }} />
      <div style={{ position: "absolute", right: 0, top: 44, width: 320, maxWidth: "90vw", background: T.paper,
        border: `1px solid ${T.hair}`, borderRadius: 14, boxShadow: T.shadowLg, zIndex: 71, overflow: "hidden", fontFamily: UI }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 15px", borderBottom: `1px solid ${T.hair}` }}>
          <span style={{ fontWeight: 700, fontSize: 14 }}>Notifications</span>
          {unread > 0 && <button onClick={markAll} style={{ background: "none", border: "none", color: T.gold,
            fontSize: 11.5, fontWeight: 700, cursor: "pointer", fontFamily: UI }}>Mark all read</button>}
        </div>
        <div style={{ maxHeight: 360, overflowY: "auto" }}>
          {items.length === 0 ? <div style={{ padding: 26, textAlign: "center", color: T.muted, fontSize: 12.5 }}>No notifications yet.</div> :
            items.map((n) => (
            <button key={n.id} onClick={() => { markOne(n); if (n.link_screen && go) { go(n.link_screen); setOpen(false); } }}
              style={{ display: "flex", gap: 10, width: "100%", textAlign: "left", padding: "11px 15px", background: n.read ? "transparent" : T.goldSoft,
                border: "none", borderBottom: `1px solid ${T.hairSoft}`, cursor: "pointer", fontFamily: UI }}>
              <span style={{ width: 7, height: 7, borderRadius: 7, background: n.read ? T.hair : T.gold, marginTop: 5, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12.8, fontWeight: 600, color: T.ink }}>{n.title}</div>
                {n.body && <div style={{ fontSize: 11.5, color: T.muted, marginTop: 1, lineHeight: 1.4 }}>{n.body}</div>}
                <div style={{ fontSize: 10, color: T.faint, marginTop: 3 }}>{ago(n.created_at)} ago</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </>}
  </div>;
}

/* ===================== FORCED FIRST-LOGIN PASSWORD CHANGE ================= */
function ForcedPasswordChange({ onDone, signOut }) {
  const [pw, setPw] = useState(""); const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false); const [msg, setMsg] = useState("");
  const save = async () => {
    if (pw.length < 8) { setMsg("Use at least 8 characters."); return; }
    if (pw !== pw2) { setMsg("Passwords don't match."); return; }
    setBusy(true); setMsg("");
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) { setMsg("Error: " + error.message); return; }
    onDone();
  };
  const inp = { width: "100%", border: `1px solid ${T.hair}`, borderRadius: 10, padding: "11px 13px", fontSize: 14,
    fontFamily: UI, outline: "none", color: T.ink, background: T.bone, boxSizing: "border-box", marginBottom: 10 };
  return <div style={{ position: "fixed", inset: 0, zIndex: 110, background: T.bone, display: "grid", placeItems: "center", padding: 18, fontFamily: UI }}>
    <div style={{ width: "100%", maxWidth: 380, background: T.paper, border: `1px solid ${T.hair}`, borderRadius: 18, boxShadow: T.shadowLg, padding: 26 }}>
      <div style={{ fontWeight: 800, fontSize: 18 }}>Set your password</div>
      <div style={{ fontSize: 12.5, color: T.muted, marginTop: 4, marginBottom: 18 }}>
        For security, please choose your own password before continuing.</div>
      <input type="password" placeholder="New password" value={pw} onChange={(e) => setPw(e.target.value)} style={inp} />
      <input type="password" placeholder="Confirm password" value={pw2} onChange={(e) => setPw2(e.target.value)} style={inp} />
      {msg && <div style={{ color: T.bad, fontSize: 12, fontWeight: 600, marginBottom: 10 }}>{msg}</div>}
      <button onClick={save} disabled={busy} style={{ width: "100%", background: T.btnBg, color: T.btnFg, border: "none",
        borderRadius: 11, padding: "12px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: UI, opacity: busy ? .6 : 1 }}>
        {busy ? "Saving…" : "Save & continue"}</button>
      <button onClick={signOut} style={{ width: "100%", marginTop: 8, background: "none", border: "none", color: T.muted,
        fontSize: 12, cursor: "pointer", fontFamily: UI }}>Sign out instead</button>
    </div>
  </div>;
}

/* ========================= USERS & AGENTS (Master Admin) ================= */
const ROLE_OPTIONS = [["agent","Agent"],["sales_manager","Sales Manager"],["admin","Admin"],["marketing","Marketing"],["accounts","Accounts"],["master_admin","Master Admin"]];
const roleLabel = (r) => (ROLE_OPTIONS.find(([k]) => k === r) || [r, r])[1];

function UsersAdmin({ user }) {
  const [users, setUsers] = useState(null);
  const [err, setErr] = useState("");
  const [q, setQ] = useState(""); const [roleFilter, setRoleFilter] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const [edit, setEdit] = useState(null);

  const load = async () => {
    setErr("");
    const r = await adminCall("list_users", {});
    if (r.error) { setErr(r.error); setUsers([]); return; }
    setUsers(r.users || []);
  };
  useEffect(() => { load(); }, []);

  if (user?.role !== "master_admin")
    return <div style={{ ...card, padding: 30, textAlign: "center" }}>
      <Lock size={24} color={T.faint} style={{ marginBottom: 8 }} />
      <div style={{ fontWeight: 700 }}>Master Admin only</div>
      <div style={{ fontSize: 12.5, color: T.muted, marginTop: 4 }}>You don't have permission to manage users.</div></div>;

  const filtered = (users || []).filter((u) => {
    if (roleFilter !== "all" && u.role !== roleFilter) return false;
    if (!q.trim()) return true; const s = q.toLowerCase();
    return [u.full_name, u.email, u.phone, u.department].some((v) => (v || "").toLowerCase().includes(s));
  });

  return <div>
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: T.okSoft, color: T.ok,
          borderRadius: 8, padding: "4px 10px", fontSize: 11, fontWeight: 700 }}>
          <Users size={12} /> {users === null ? "Loading…" : `${users.length} users`}</span>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={load} style={{ ...miniBtn() }}><RefreshCw size={13} /> Refresh</button>
        <button onClick={() => setShowAdd(true)} style={{ background: T.btnBg, color: T.btnFg, border: "none",
          borderRadius: 9, padding: "8px 14px", fontSize: 12.5, fontWeight: 700, cursor: "pointer", fontFamily: UI,
          display: "inline-flex", alignItems: "center", gap: 6 }}><UserPlus size={14} /> Add new user</button>
      </div>
    </div>

    {err && <div style={{ ...card, padding: 14, marginTop: 14, borderColor: T.badSoft, color: T.bad, fontSize: 13 }}>
      {err.includes("SERVICE_ROLE") ? "User management needs the SUPABASE_SERVICE_ROLE_KEY set in Vercel (Settings → Environment Variables), then redeploy." : err}</div>}

    <div style={{ ...card, padding: "10px 14px", marginTop: 14, display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap" }}>
      <Search size={15} color={T.muted} />
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email, phone…"
        style={{ flex: 1, minWidth: 140, border: "none", outline: "none", background: "transparent", fontSize: 13, fontFamily: UI, color: T.ink }} />
      <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} style={{ border: `1px solid ${T.hair}`,
        borderRadius: 8, padding: "6px 10px", fontSize: 12.5, fontFamily: UI, background: T.paper, color: T.ink }}>
        <option value="all">All roles</option>
        {ROLE_OPTIONS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
      </select>
    </div>

    {users === null ? <div style={{ ...card, padding: 40, marginTop: 14, textAlign: "center", color: T.muted }}>Loading users…</div> :
      <div style={{ ...card, overflow: "hidden", marginTop: 14 }}>
        <div style={{ overflowX: "auto" }}>
          <div style={{ minWidth: 820 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1.2fr 1fr 0.8fr 0.7fr 1fr", gap: 8, padding: "10px 16px",
              fontSize: 10.5, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: T.muted,
              borderBottom: `1px solid ${T.hair}`, background: T.bone }}>
              <span>Name</span><span>Role</span><span>Status</span><span>Leads</span><span>Last login</span><span>Actions</span>
            </div>
            {filtered.map((u, i) => (
              <div key={u.id} style={{ display: "grid", gridTemplateColumns: "1.6fr 1.2fr 1fr 0.8fr 0.7fr 1fr", gap: 8,
                alignItems: "center", padding: "12px 16px", borderTop: i ? `1px solid ${T.hairSoft}` : "none", fontSize: 12.5 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                  <Av name={u.full_name || u.email} size={30} dark />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{u.full_name || "—"}</div>
                    <div style={{ fontSize: 10.5, color: T.faint, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{u.email}</div>
                  </div>
                </div>
                <Chip tone={u.role === "master_admin" ? "gold" : u.role === "agent" ? "info" : "muted"}>{roleLabel(u.role)}</Chip>
                <Chip tone={u.active ? "ok" : "bad"}>{u.active ? "Active" : "Inactive"}</Chip>
                <span>{u.assigned_leads}{u.open_leads ? ` (${u.open_leads} open)` : ""}</span>
                <span style={{ fontSize: 11, color: T.muted }}>{u.last_login ? new Date(u.last_login).toLocaleDateString() : "never"}</span>
                <button onClick={() => setEdit(u)} style={{ ...miniBtn(), justifySelf: "start" }}>Manage</button>
              </div>
            ))}
          </div>
        </div>
      </div>}
    <div style={{ fontSize: 11, color: T.faint, marginTop: 10 }}>
      Creating a user makes a real login. First login forces a password change. All actions are recorded in the admin audit log.
    </div>

    {showAdd && <AddUserModal onClose={() => setShowAdd(false)} onSaved={() => { setShowAdd(false); load(); }} />}
    {edit && <ManageUserModal u={edit} users={users} onClose={() => setEdit(null)} onChanged={() => { setEdit(null); load(); }} />}
  </div>;
}

function AddUserModal({ onClose, onSaved }) {
  const [f, setF] = useState({ full_name: "", email: "", phone: "", role: "agent", department: "", job_title: "",
    password: "", password2: "", lead_scope: "own", twofa: true, status: "active", notes: "" });
  const [busy, setBusy] = useState(false); const [err, setErr] = useState(""); const [ok, setOk] = useState(null);
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));
  const gen = () => { const p = "Amber" + Math.random().toString(36).slice(2, 8) + "!"; set("password", p); set("password2", p); };
  const save = async () => {
    if (!f.full_name.trim()) { setErr("Full name is required."); return; }
    if (!f.email.includes("@")) { setErr("Valid email is required."); return; }
    if (f.password.length < 8) { setErr("Initial password must be at least 8 characters."); return; }
    if (f.password !== f.password2) { setErr("Passwords don't match."); return; }
    setBusy(true); setErr("");
    const r = await adminCall("create_user", f);
    setBusy(false);
    if (r.error) { setErr(r.error); return; }
    setOk({ email: f.email, password: f.password });
  };
  const inp = { width: "100%", border: `1px solid ${T.hair}`, borderRadius: 10, padding: "10px 12px", fontSize: 13,
    fontFamily: UI, outline: "none", color: T.ink, background: T.bone, boxSizing: "border-box", marginTop: 5 };
  const L = (lbl, k, opts = {}) => <label style={{ display: "block", marginBottom: 10 }}>
    <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: T.muted }}>{lbl}</span>
    <input value={f[k]} onChange={(e) => set(k, e.target.value)} type={opts.type || "text"} placeholder={opts.ph || ""} style={inp} /></label>;

  if (ok) return <Modal title="User created ✓" onClose={onSaved}>
    <div style={{ fontSize: 13, color: T.inkSoft, lineHeight: 1.6, marginBottom: 12 }}>
      Share these credentials securely. They'll be asked to set their own password on first login.</div>
    <div style={{ ...card, padding: 14, background: T.bone }}>
      <Row k="Email" v={ok.email} /><Row k="Temp password" v={ok.password} />
    </div>
    <button onClick={() => navigator.clipboard && navigator.clipboard.writeText(`Email: ${ok.email}\nPassword: ${ok.password}`)}
      style={{ ...miniBtn(), width: "100%", justifyContent: "center", marginTop: 12 }}>Copy credentials</button>
    <button onClick={onSaved} style={{ width: "100%", background: T.btnBg, color: T.btnFg, border: "none", borderRadius: 10,
      padding: "12px", fontSize: 13.5, fontWeight: 700, cursor: "pointer", fontFamily: UI, marginTop: 8 }}>Done</button>
  </Modal>;

  return <Modal title="Add new user" onClose={onClose}>
    {L("Full name *", "full_name")}
    {L("Email *", "email", { type: "email", ph: "name@amberhomes.ae" })}
    {L("Phone", "phone", { ph: "optional" })}
    <label style={{ display: "block", marginBottom: 10 }}>
      <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: T.muted }}>Role *</span>
      <select value={f.role} onChange={(e) => set("role", e.target.value)} style={inp}>
        {ROLE_OPTIONS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></label>
    {L("Department / team", "department")}
    {L("Job title", "job_title")}
    <label style={{ display: "block", marginBottom: 10 }}>
      <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: T.muted }}>Lead access scope</span>
      <select value={f.lead_scope} onChange={(e) => set("lead_scope", e.target.value)} style={inp}>
        <option value="own">Own leads only</option><option value="team">Team leads</option><option value="all">All leads</option></select></label>
    <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
      <div style={{ flex: 1 }}>{L("Initial password *", "password", { type: "text" })}</div>
      <button onClick={gen} style={{ ...miniBtn(), marginBottom: 10 }}>Generate</button>
    </div>
    {L("Confirm password *", "password2", { type: "text" })}
    <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, marginBottom: 10, cursor: "pointer" }}>
      <input type="checkbox" checked={f.twofa} onChange={(e) => set("twofa", e.target.checked)} /> Require 2FA setup (recommended)</label>
    {L("Notes", "notes")}
    {err && <div style={{ color: T.bad, fontSize: 12.5, fontWeight: 600, marginBottom: 8 }}>{err}</div>}
    <button onClick={save} disabled={busy} style={{ width: "100%", background: T.btnBg, color: T.btnFg, border: "none",
      borderRadius: 10, padding: "12px", fontSize: 13.5, fontWeight: 700, cursor: "pointer", fontFamily: UI, opacity: busy ? .6 : 1 }}>
      {busy ? "Creating…" : "Create user"}</button>
    <div style={{ fontSize: 10.5, color: T.faint, marginTop: 8, lineHeight: 1.5 }}>
      First login forces a password change. Full TOTP 2FA enrollment is completed by the user on their device.</div>
  </Modal>;
}

function ManageUserModal({ u, users, onClose, onChanged }) {
  const [role, setRole] = useState(u.role);
  const [busy, setBusy] = useState(""); const [msg, setMsg] = useState("");
  const [pw, setPw] = useState(""); const [deact, setDeact] = useState(false);
  const [leadAction, setLeadAction] = useState("open"); const [reassignTo, setReassignTo] = useState("");
  const others = (users || []).filter((x) => x.id !== u.id && x.active);

  const changeRole = async () => { setBusy("role"); setMsg("");
    const r = await adminCall("set_role", { id: u.id, role, oldRole: u.role });
    setBusy(""); setMsg(r.error || "Role updated."); if (!r.error) setTimeout(onChanged, 800); };
  const resetPw = async () => { if (pw.length < 8) { setMsg("Password must be 8+ characters."); return; }
    setBusy("pw"); setMsg(""); const r = await adminCall("reset_password", { id: u.id, password: pw, force: true });
    setBusy(""); setMsg(r.error || "Password reset. User must change it on next login."); };
  const reactivate = async () => { setBusy("act"); const r = await adminCall("set_active", { id: u.id, active: true });
    setBusy(""); setMsg(r.error || "Reactivated."); if (!r.error) setTimeout(onChanged, 800); };
  const doDeactivate = async () => { setBusy("act"); setMsg("");
    const target = others.find((x) => x.id === reassignTo);
    const r = await adminCall("set_active", { id: u.id, active: false, reason: "Deactivated by Master Admin",
      leadAction, reassignTo: leadAction === "reassign" ? reassignTo : null,
      reassignName: leadAction === "reassign" && target ? target.full_name : null, userName: u.full_name });
    setBusy(""); setMsg(r.error || `Deactivated. ${r.affected || 0} lead(s) handled.`); if (!r.error) setTimeout(onChanged, 1000); };

  const inp = { width: "100%", border: `1px solid ${T.hair}`, borderRadius: 10, padding: "10px 12px", fontSize: 13,
    fontFamily: UI, outline: "none", color: T.ink, background: T.bone, boxSizing: "border-box", marginTop: 5 };
  return <Modal title={u.full_name || u.email} onClose={onClose}>
    <Row k="Email" v={u.email} /><Row k="Status" v={u.active ? "Active" : "Inactive"} />
    <Row k="Assigned leads" v={u.assigned_leads} /><Row k="Last login" v={u.last_login ? new Date(u.last_login).toLocaleString() : "never"} />

    <div style={{ marginTop: 16, fontSize: 11, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: T.muted }}>Role</div>
    <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
      <select value={role} onChange={(e) => setRole(e.target.value)} style={{ ...inp, marginTop: 0 }}>
        {ROLE_OPTIONS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
      <button onClick={changeRole} disabled={busy === "role" || role === u.role} style={{ ...miniBtn(), opacity: role === u.role ? .5 : 1 }}>
        {busy === "role" ? "…" : "Update"}</button>
    </div>

    <div style={{ marginTop: 16, fontSize: 11, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: T.muted }}>Reset password</div>
    <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
      <input value={pw} onChange={(e) => setPw(e.target.value)} placeholder="New temp password" style={{ ...inp, marginTop: 0 }} />
      <button onClick={resetPw} disabled={busy === "pw"} style={{ ...miniBtn() }}>{busy === "pw" ? "…" : "Reset"}</button>
    </div>

    <div style={{ height: 1, background: T.hairSoft, margin: "18px 0 14px" }} />
    {u.active ? (!deact ?
      <button onClick={() => setDeact(true)} style={{ width: "100%", background: T.badSoft, color: T.bad, border: `1px solid ${T.bad}`,
        borderRadius: 10, padding: "11px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: UI }}>Deactivate user</button> :
      <div style={{ ...card, padding: 14, background: T.badSoft, borderColor: T.bad }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.bad, marginBottom: 8 }}>What happens to this user's active leads?</div>
        {[["open", "Move all to Open Leads pool"], ["reassign", "Reassign to another agent"], ["block", "Keep assigned, just block access"]].map(([k, l]) => (
          <label key={k} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, marginBottom: 6, cursor: "pointer" }}>
            <input type="radio" checked={leadAction === k} onChange={() => setLeadAction(k)} /> {l}</label>
        ))}
        {leadAction === "reassign" && <select value={reassignTo} onChange={(e) => setReassignTo(e.target.value)} style={{ ...inp }}>
          <option value="">Select agent…</option>{others.map((o) => <option key={o.id} value={o.id}>{o.full_name || o.email}</option>)}</select>}
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <button onClick={doDeactivate} disabled={busy === "act" || (leadAction === "reassign" && !reassignTo)}
            style={{ flex: 1, background: T.bad, color: "#fff", border: "none", borderRadius: 10, padding: "11px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: UI }}>
            {busy === "act" ? "Working…" : "Confirm deactivation"}</button>
          <button onClick={() => setDeact(false)} style={{ ...miniBtn() }}>Cancel</button>
        </div>
      </div>
    ) : <button onClick={reactivate} disabled={busy === "act"} style={{ width: "100%", background: T.okSoft, color: T.ok,
      border: `1px solid ${T.ok}`, borderRadius: 10, padding: "11px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: UI }}>
      {busy === "act" ? "…" : "Reactivate user"}</button>}

    {msg && <div style={{ color: msg.toLowerCase().includes("error") || msg.includes("must be") ? T.bad : T.ok, fontSize: 12.5, fontWeight: 600, marginTop: 12, textAlign: "center" }}>{msg}</div>}
  </Modal>;
}
