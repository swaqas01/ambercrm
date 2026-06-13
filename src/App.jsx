import { useState, useEffect, useRef } from "react";
import { supabase, roleInfo, allowedFor, canOpen, stampLogin, adminCall } from "./supabase.js";
import { MENTORS, mentorById, buildCrmContext, classifyInappropriate, categorize, logAi, fetchKnowledge, pickKnowledge } from "./mentors.js";
import {
  BookOpen, Pencil, Trash2, Save, Check,
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
  ["deals", "Deals", Coins],
  ["projects", "Projects", Building2],
  ["ailogs", "Ask Amber Logs", Sparkle],
  ["kb", "AI Knowledge Base", BookOpen],
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
  const [recovery, setRecovery] = useState(typeof window !== "undefined" && /type=recovery/.test(window.location.hash || ""));
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => { if (event === "PASSWORD_RECOVERY") setRecovery(true); });
    return () => { try { sub.subscription.unsubscribe(); } catch (e) {} };
  }, []);
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!/type=recovery/.test(typeof window !== "undefined" ? (window.location.hash || "") : "")) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user && mounted) {
          const { data: prof } = await supabase.from("profiles").select("full_name, role, active, force_password_change, first_login, password_expires_at").eq("id", session.user.id).single();
          if (prof && prof.active !== false) {
            const ri = roleInfo(prof.role);
            const expired = !!(prof.password_expires_at && new Date(prof.password_expires_at).getTime() < Date.now());
            setUser({ name: prof.full_name || session.user.email, email: session.user.email, role: prof.role,
              roleLabel: ri.label, id: session.user.id, mustChangePw: !!prof.force_password_change || !!prof.first_login || expired });
            setScreen(ri.home === "agent" ? "agent" : "admin");
            stampLogin(session.user.id);
          } else if (prof && prof.active === false) { await supabase.auth.signOut(); }
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
  const [dealDetailId, setDealDetailId] = useState(null);
  const openDeal = (id) => { setDealDetailId(id); setScreen("dealdetail"); setNavOpen(false); };
  // role guard — agents may only open their own surfaces
  useEffect(() => {
    if (user && !canOpen(user.role, screen)) {
      setScreen(roleInfo(user.role).home === "agent" ? "agent" : "admin");
    }
  }, [user, screen]);
  const SCREENS = {
    live: <LiveLeads user={user} filter={filter} go={go} openLead={openLead} />, users: <UsersAdmin user={user} />, admin: <AdminDash go={go} />, agent: <AgentDash go={go} user={user} openLead={openLead} />, lead: <LeadDetail leadId={detailId} user={user} go={go} />, open: <OpenLeads />, kb: <KnowledgeBase user={user} />, projects: <Projects user={user} go={go} />, ailogs: <AiLogs user={user} go={go} />, deals: <Deals user={user} go={go} openDeal={openDeal} />, dealdetail: <DealDetail dealId={dealDetailId} user={user} go={go} />,
    assign: <Assignment />, pipeline: <Pipeline go={go} />, performance: <Performance />,
    security: <SecurityLog go={go} />, matching: <Matching go={go} />, score: <ScorePage />,
    careers: <Careers />, commission: <Commission />, settings: <SettingsPage />,
  };
  return (
    <div data-amber={dark ? "dark" : "light"} data-accent={accent} style={{ fontFamily: UI, background: T.bone, minHeight: 600, display: "flex", color: T.ink,
      transition: "background .25s ease" }}>
      <style>{THEME_CSS}</style>
      {recovery && <ResetPassword onDone={() => { setRecovery(false); try { window.history.replaceState(null, "", window.location.pathname); } catch (e) {} }} />}
      {!recovery && !user && <LoginFlow onLogin={(u) => { setUser(u); setScreen(u.home === "agent" ? "agent" : "admin"); }} dark={dark} setDark={setDark} />}
      {!recovery && user && user.mustChangePw && <ForcedPasswordChange onDone={() => setUser({ ...user, mustChangePw: false })} signOut={signOut} />}
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
  const [deals, setDeals] = useState(null);
  useEffect(() => { (async () => { const { data } = await supabase.from("deals").select("status,deal_type,project,agent_id,property_value,gross_commission,net_commission,final_net,agent_commission,submitted_at,decided_at,created_at,accounts_status,deleted").neq("status", "cancelled").limit(5000); setDeals(data || []); })(); }, []);
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

  const D = (deals || []).filter((x) => !x.deleted);
  const dApproved = D.filter((d) => d.status === "approved");
  const dPending = D.filter((d) => ["submitted", "pending_review"].includes(d.status));
  const apprMonth = dApproved.filter((d) => inMonth(d.decided_at));
  const apprQ = dApproved.filter((d) => inQuarter(d.decided_at));
  const apprYear = dApproved.filter((d) => inYear(d.decided_at));
  const subToday = D.filter((d) => (d.submitted_at && inToday(d.submitted_at)) || (d.status !== "draft" && inToday(d.created_at)));
  const sumD = (arr, k) => arr.reduce((s, r) => s + (Number(r[k]) || 0), 0);
  const byType = (t) => dApproved.filter((d) => d.deal_type === t).length;
  const projMap = {}; dApproved.forEach((d) => { if (d.project) projMap[d.project] = (projMap[d.project] || 0) + 1; });
  const topProjects = Object.entries(projMap).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const convDeals = D.length ? Math.round(dApproved.length / D.length * 100) : 0;

  return <div>
    <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 14 }}>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: T.okSoft, color: T.ok,
        borderRadius: 8, padding: "4px 10px", fontSize: 11, fontWeight: 700 }}>
        <span style={{ width: 7, height: 7, borderRadius: 7, background: T.ok }} /> LIVE DATA</span>
      <span style={{ fontSize: 12.5, color: T.muted }}>{L.length} leads · {acts.length} activity events</span>
    </div>

    {deals !== null && <div style={{ marginBottom: 18 }}>
      <SectionTitle right={dPending.length ? <button onClick={() => go("deals")} style={{ background: "none", border: "none", color: T.gold, fontWeight: 700, cursor: "pointer", fontFamily: UI, fontSize: 12.5 }}>{dPending.length} pending →</button> : null}>Deal analytics</SectionTitle>
      <div style={grid}>
        <Stat label="Submitted today" value={subToday.length} onClick={() => go("deals")} />
        <Stat label="Pending approval" value={dPending.length} tone={dPending.length ? "gold" : null} onClick={() => go("deals")} />
        <Stat label="Approved · month" value={apprMonth.length} tone="ok" />
        <Stat label="Approved · quarter" value={apprQ.length} />
        <Stat label="Approved · year" value={apprYear.length} />
      </div>
      <div style={{ ...grid, marginTop: 10 }}>
        <Stat label="Value · month" value={money(sumD(apprMonth, "property_value"))} />
        <Stat label="Value · quarter" value={money(sumD(apprQ, "property_value"))} />
        <Stat label="Value · year" value={money(sumD(apprYear, "property_value"))} />
        <Stat label="Gross comm · month" value={money(sumD(apprMonth, "gross_commission"))} />
      </div>
      <div style={{ ...grid, marginTop: 10 }}>
        <Stat label="Net to Amber · month" value={money(sumD(apprMonth, "final_net"))} tone="gold" />
        <Stat label="Agent payable · month" value={money(sumD(apprMonth, "agent_commission"))} />
        <Stat label="Sales / Rental" value={byType("Sales") + " / " + byType("Rental")} sub="approved" />
        <Stat label="Approved conversion" value={convDeals + "%"} sub="approved / all deals" />
      </div>
      {topProjects.length > 0 && <div style={{ ...card, padding: 14, marginTop: 10 }}>
        <SectionMini>Approved deals by project</SectionMini>
        {topProjects.map(([p, n]) => <div key={p} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", fontSize: 12.5, borderBottom: `1px solid ${T.hairSoft}` }}><span style={{ color: T.inkSoft }}>{p}</span><b>{n}</b></div>)}
      </div>}
      <div style={{ fontSize: 11, color: T.faint, marginTop: 8 }}>Only approved deals count as final closed deals; pending deals are shown separately and excluded from totals.</div>
    </div>}

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
  const [modal, setModal] = useState(null); // 'target' | 'focus' | 'plan'
  const [planText, setPlanText] = useState("");
  const [planBusy, setPlanBusy] = useState(false);
  const [planErr, setPlanErr] = useState("");
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

  const overdue = mine.filter((l) => l.next_followup && l.next_followup < today && l.status !== "Closed Won" && l.status !== "Closed Lost");
  const runPlan = async () => {
    setModal("plan"); setPlanBusy(true); setPlanErr(""); setPlanText("");
    try {
      const ctx = await buildCrmContext(user); // own leads only
      const snap = `My snapshot: ${mine.length} leads, ${hot.length} hot/very-hot, ${dueToday.length} follow-ups due today, ${overdue.length} overdue, ${notContacted.length} new and not yet contacted.`;
      const prompt = "[PLAN MY DAY] You are my sales coach. Using ONLY my own CRM data in the context, build my action plan for TODAY.\n" + snap +
        "\nGive me, in plain text with short lines and no markdown symbols:\n" +
        "1) Top 3 priorities for today, most important first.\n" +
        "2) Exactly which leads to contact and in what order (use their real names from my data), and whether to CALL or WHATSAPP each.\n" +
        "3) Any overdue follow-ups I must clear first.\n" +
        "4) If I have no leads or nothing urgent, tell me concretely how to generate activity today — cold calls, message my network, ask admin for open leads, post a property update, add new prospects to the CRM. No leads means no excuses.\n" +
        "5) End with one short motivational line.\n" +
        "Keep it tight and practical. Do not invent leads, names, or numbers that are not in my data.";
      const mentor = mentorById("ambreen_ai") || MENTORS[0];
      const res = await fetch("/api/ai", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mentor: mentor.id, crmContext: ctx, messages: [{ role: "user", content: prompt }] }) });
      const data = await res.json();
      if (data.error) { setPlanErr("Plan My Day is temporarily unavailable. Please try again."); }
      else {
        const reply = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n").trim();
        setPlanText(reply || "Please try again.");
        logAi({ user, mentor, question: "[Plan my day] " + snap, responseSum: reply, fullResponse: reply, category: "follow_up", model: data.model, status: "success", tokensIn: data.usage && data.usage.input_tokens, tokensOut: data.usage && data.usage.output_tokens });
      }
    } catch (e) { setPlanErr("Plan My Day is temporarily unavailable. Please try again."); }
    finally { setPlanBusy(false); }
  };

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
        <button onClick={runPlan} style={{ flex: "1 1 200px", background: T.btnBg, color: T.btnFg, border: "none",
          borderRadius: 14, padding: "14px 18px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: UI,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}><Sparkle size={17} /> Plan my day</button>
        <button onClick={() => go("projects")} style={{ flex: "1 1 160px", background: T.paper, color: T.ink, border: `1px solid ${T.hair}`,
          borderRadius: 14, padding: "14px 18px", fontSize: 13.5, fontWeight: 700, cursor: "pointer", fontFamily: UI,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}><Building2 size={16} color={T.gold} /> Project knowledge</button>
        <button onClick={() => go("deals")} style={{ flex: "1 1 160px", background: T.paper, color: T.ink, border: `1px solid ${T.hair}`,
          borderRadius: 14, padding: "14px 18px", fontSize: 13.5, fontWeight: 700, cursor: "pointer", fontFamily: UI,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}><Coins size={16} color={T.gold} /> My closed deals</button>
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
    {modal === "plan" && <Modal title="Plan my day" onClose={() => setModal(null)}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <Sparkle size={16} color={T.gold} />
        <span style={{ fontSize: 12, color: T.muted }}>AI plan from Ask Amber — based only on your own leads.</span>
        {!planBusy && <button onClick={runPlan} style={{ ...miniBtn(), marginLeft: "auto", padding: "5px 10px", fontSize: 11 }}><RefreshCw size={12} /> Regenerate</button>}
      </div>
      {planBusy ? <div style={{ textAlign: "center", padding: "26px 10px", color: T.muted }}>
          <div style={{ width: 26, height: 26, border: `3px solid ${T.hairSoft}`, borderTopColor: T.gold, borderRadius: "50%", margin: "0 auto 12px", animation: "spin 0.8s linear infinite" }} />
          Building your plan…<style>{"@keyframes spin{to{transform:rotate(360deg)}}"}</style></div>
        : planErr ? <div style={{ ...card, padding: 14, borderColor: T.badSoft, color: T.bad, fontSize: 13 }}>{planErr}</div>
        : <div style={{ fontSize: 13.5, color: T.ink, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{planText}</div>}
      {!planBusy && !planErr && (dueToday.length > 0 || notContacted.length > 0) && <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${T.hairSoft}` }}>
        <FocusList title="Follow-ups due — tap to open" items={dueToday} go={go} onClose={() => setModal(null)} />
        <FocusList title="Not yet contacted — tap to open" items={notContacted} go={go} onClose={() => setModal(null)} />
      </div>}
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
  const [showDeal, setShowDeal] = useState(false);
  const [comments, setComments] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [agents, setAgents] = useState([]);
  const [err, setErr] = useState("");
  const [err2, setErr2] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [sched, setSched] = useState(false);
  const [schedDate, setSchedDate] = useState("");
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [reOpen, setReOpen] = useState(false);
  const [reTo, setReTo] = useState("");
  const [reReason, setReReason] = useState("");
  const me = user;
  const isAdmin = user && (user.role === "master_admin" || user.role === "admin");
  const canReassign = isAdmin;

  // Field groups (data-driven so view + edit stay in sync).
  const GROUPS = {
    contact: [["client_name", "Client name", "text"], ["phone", "Phone", "text"], ["whatsapp", "WhatsApp", "text"], ["email", "Email", "text"]],
    profile: [["nationality", "Nationality", "text"], ["country_residence", "Country of residence", "text"], ["language", "Language", "text"]],
    invest: [["budget", "Budget", "text"], ["purpose", "Purpose", "select", ["Investment", "Personal use", "Both", "Not sure"]],
      ["area", "Area", "text"], ["project", "Project", "text"], ["developer", "Developer", "text"],
      ["property_type", "Property type", "select", ["Apartment", "Villa", "Townhouse", "Penthouse", "Plot", "Commercial", "Other"]],
      ["ready_offplan", "Ready / Off-plan", "select", ["Off-plan", "Ready", "Either"]],
      ["finance", "Finance", "select", ["Cash", "Mortgage", "Not decided"]], ["timeline", "Timeline", "text"]],
    meta: [["status", "Status", "select", ["New", "Contacted", "Qualified", "Viewing scheduled", "Negotiation", "Offer made", "Closed Won", "Closed Lost", "On hold"]],
      ["temperature", "Temperature", "select", ["Very Hot", "Hot", "Warm", "Cold"]],
      ["last_contacted", "Last contact", "date"], ["next_followup", "Next follow-up", "date"],
      ["source", "Source", "text"]],
  };
  const ALL_KEYS = [].concat(...Object.values(GROUPS)).map((d) => d[0]);
  const AGENT_KEYS = ALL_KEYS.filter((k) => k !== "source");   // agents cannot change source (DB also blocks it)
  const LABELS = {}; [].concat(...Object.values(GROUPS)).forEach((d) => { LABELS[d[0]] = d[1]; });
  const isAssignedAgent = user && user.role === "agent" && lead && (lead.assigned_agent === user.id || lead.created_by === user.id);
  const canEditAll = isAdmin;
  const canEdit = canEditAll || isAssignedAgent;
  const editableKeys = canEditAll ? ALL_KEYS : AGENT_KEYS;

  const loadAll = async () => {
    if (!leadId) { setErr("none"); return; }
    setErr("");
    const { data: l, error } = await supabase.from("leads").select("*").eq("id", leadId).single();
    if (error || !l) { setErr("load"); return; }
    setLead(l);
    if (isAdmin) { setRevealed(true); logAction("view", l, me && me.id); }
    if (isAdmin) {
      const { data: ag } = await supabase.from("profiles").select("id, full_name, role, active").eq("active", true).order("full_name");
      setAgents(ag || []);
    }
    const [{ data: cs }, { data: ts }] = await Promise.all([
      supabase.from("lead_comments").select("*, author:profiles!lead_comments_author_id_fkey(full_name, role)").eq("lead_id", leadId).eq("deleted", false).order("created_at", { ascending: false }),
      supabase.from("lead_activity").select("*, actor:profiles!lead_activity_actor_id_fkey(full_name, role)").eq("lead_id", leadId).order("created_at", { ascending: false }).limit(60),
    ]);
    setComments(cs || []); setTimeline(ts || []);
  };
  useEffect(() => { loadAll(); }, [leadId]);

  const loadTimeline = async () => {
    const { data: ts } = await supabase.from("lead_activity").select("*, actor:profiles!lead_activity_actor_id_fkey(full_name, role)").eq("lead_id", lead.id).order("created_at", { ascending: false }).limit(60);
    setTimeline(ts || []);
  };

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
  const agentNameFor = (id) => { if (!id) return null; if (me && id === me.id) return me.name; const a = agents.find((x) => x.id === id); return a ? a.full_name : null; };
  const agentDisplay = lead.assigned_agent ? (agentNameFor(lead.assigned_agent) || lead.assigned_agent_name || "Assigned agent") : (lead.assigned_agent_name || "Unassigned");
  const statusText = lead.is_open ? "Open" : (lead.status || "New");

  const startEdit = () => { setForm({ ...lead }); setErr2(""); setEditing(true); };
  const setF = (k, v) => setForm((s) => ({ ...s, [k]: v }));
  const saveEdit = async () => {
    setSaving(true); setErr2("");
    const changes = {};
    editableKeys.forEach((k) => { const nv = form[k] == null ? null : form[k]; const ov = lead[k] == null ? null : lead[k];
      if (String(nv || "") !== String(ov || "")) changes[k] = nv === "" ? null : nv; });
    if (Object.keys(changes).length === 0) { setEditing(false); setSaving(false); return; }
    const { error } = await supabase.from("leads").update(changes).eq("id", lead.id);
    if (error) { setErr2("Could not save: " + error.message); setSaving(false); return; }
    for (const k of Object.keys(changes)) {
      await supabase.from("lead_activity").insert({ lead_id: lead.id, actor_id: me.id, action: "field_change",
        detail: { field: k, label: LABELS[k] || k, from: lead[k] || null, to: changes[k] || null } });
    }
    if (canEditAll) {
      await supabase.from("admin_audit").insert({ action: "lead_edited", performed_by: me.id,
        old_value: Object.fromEntries(Object.keys(changes).map((k) => [k, lead[k] || null])), new_value: changes, detail: lead.client_name });
    }
    setLead((l) => ({ ...l, ...changes })); setEditing(false); setSaving(false); loadTimeline();
  };

  const doReassign = async () => {
    if (!reTo) { setErr2("Choose an agent or option."); return; }
    const makeOpen = reTo === "__open";
    const newId = (makeOpen || reTo === "__unassigned") ? null : reTo;
    const upd = { assigned_agent: newId, current_owner: newId, is_open: makeOpen,
      original_agent: lead.original_agent || lead.assigned_agent || newId || null };
    const newName = makeOpen ? "Open Leads pool" : (newId ? (agentNameFor(newId) || "agent") : "Unassigned");
    const { error } = await supabase.from("leads").update(upd).eq("id", lead.id);
    if (error) { setErr2("Reassign failed: " + error.message); return; }
    await supabase.from("lead_ownership_history").insert({ lead_id: lead.id, from_agent: lead.assigned_agent || null, to_agent: newId, reason: reReason || null, changed_by: me.id });
    await supabase.from("lead_activity").insert({ lead_id: lead.id, actor_id: me.id, action: makeOpen ? "make_open" : "reassign", detail: { from: agentDisplay, to: newName, reason: reReason || null } });
    await supabase.from("admin_audit").insert({ action: "lead_reassigned", performed_by: me.id, affected_user: newId, old_value: { agent: agentDisplay }, new_value: { agent: newName }, detail: lead.client_name });
    if (newId) await supabase.from("notifications").insert({ user_id: newId, kind: "lead_assigned", title: "New lead assigned to you", body: lead.client_name + " — " + (lead.project || lead.area || "new lead"), link_screen: "live" });
    if (lead.assigned_agent && lead.assigned_agent !== newId) await supabase.from("notifications").insert({ user_id: lead.assigned_agent, kind: "system", title: "A lead was reassigned", body: lead.client_name + " is no longer assigned to you", link_screen: "live" });
    setReOpen(false); setReReason(""); setReTo(""); loadAll();
  };

  const addComment = async () => {
    if (!newComment.trim() || !me) return;
    const body = newComment.trim();
    const { data, error } = await supabase.from("lead_comments").insert({ lead_id: lead.id, author_id: me.id, body })
      .select("*, author:profiles!lead_comments_author_id_fkey(full_name, role)").single();
    if (error) return;
    setComments((c) => [data, ...c]); setNewComment("");
    logAction("comment", lead, me.id, { note: body.slice(0, 80) }); loadTimeline();
  };
  const delComment = async (c) => {
    await supabase.from("lead_comments").update({ deleted: true }).eq("id", c.id);
    setComments((cs) => cs.filter((x) => x.id !== c.id));
  };
  const saveSchedule = async () => {
    if (!schedDate) return;
    await supabase.from("leads").update({ next_followup: schedDate }).eq("id", lead.id);
    setLead((l) => ({ ...l, next_followup: schedDate }));
    logAction("schedule", lead, me && me.id, { next_followup: schedDate });
    setSched(false); loadTimeline();
  };

  const ACT_LABEL = { view_number: "Viewed number", reveal_phone: "Viewed number", call: "Called", whatsapp: "WhatsApp", schedule: "Scheduled follow-up",
    comment: "Commented", lead_created: "Lead created", lead_created_ai: "Lead created (AI)", status_change: "Status changed", assign: "Assigned",
    reassign: "Reassigned", make_open: "Moved to Open Leads", field_change: "Updated", lead_edited: "Edited details", make_open_bulk: "Moved to open", view: "Viewed" };
  const when = (t) => { const d = (Date.now() - new Date(t)) / 6e4; if (d < 1) return "just now"; if (d < 60) return Math.round(d) + "m ago"; if (d < 1440) return Math.round(d / 60) + "h ago"; return new Date(t).toLocaleDateString(); };
  const actText = (t) => {
    if (t.action === "field_change" && t.detail) return "Updated " + (t.detail.label || t.detail.field) + (t.detail.to ? ' → "' + String(t.detail.to).slice(0, 40) + '"' : " (cleared)");
    if (t.action === "reassign" && t.detail) return "Reassigned: " + (t.detail.from || "—") + " → " + (t.detail.to || "—") + (t.detail.reason ? ' · "' + t.detail.reason + '"' : "");
    if (t.action === "make_open") return "Moved to Open Leads" + (t.detail && t.detail.reason ? ' · "' + t.detail.reason + '"' : "");
    return (ACT_LABEL[t.action] || t.action) + (t.detail && t.detail.note ? ' — "' + t.detail.note + '"' : "");
  };

  const inp = { width: "100%", border: `1px solid ${T.hair}`, borderRadius: 8, padding: "7px 9px", fontSize: 12.5, fontFamily: UI, outline: "none", color: T.ink, background: T.paper, boxSizing: "border-box" };
  const HeaderItem = ({ k, v }) => <div><div style={{ fontSize: 9.5, letterSpacing: ".1em", textTransform: "uppercase", color: "rgba(255,255,255,.55)" }}>{k}</div>
    <div style={{ fontSize: 13, color: "#fff", marginTop: 2, fontWeight: 600 }}>{v}</div></div>;

  // One field: shows an editable control in edit mode (if permitted), else the value with a clean "Not added yet".
  const FieldRow = ({ def }) => {
    const [key, label, type, opts] = def;
    const canThis = editing && editableKeys.includes(key);
    const val = lead[key];
    return <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: `1px solid ${T.hairSoft}`, fontSize: 13, gap: 12 }}>
      <span style={{ color: T.muted, flexShrink: 0 }}>{label}</span>
      {canThis ? (
        type === "select" ? <select value={form[key] || ""} onChange={(e) => setF(key, e.target.value)} style={{ ...inp, maxWidth: 200 }}>
          <option value="">—</option>{opts.map((o) => <option key={o} value={o}>{o}</option>)}</select>
        : <input type={type === "date" ? "date" : "text"} value={form[key] || ""} onChange={(e) => setF(key, e.target.value)} style={{ ...inp, maxWidth: 200 }} />
      ) : <span style={{ fontWeight: 600, textAlign: "right", color: val ? T.ink : T.faint }}>{val || "Not added yet"}</span>}
    </div>;
  };
  const Btn = ({ icon: Ic, label, onClick, tone }) => <button onClick={onClick} style={{ flex: 1, minWidth: 84, display: "flex", flexDirection: "column",
    alignItems: "center", gap: 5, padding: "12px 8px", borderRadius: 12, border: `1px solid ${tone === "ok" ? T.ok : tone === "gold" ? T.goldEdge : T.hair}`,
    background: tone === "ok" ? T.okSoft : tone === "gold" ? T.goldSoft : T.paper, color: tone === "ok" ? T.ok : tone === "gold" ? T.gold : T.ink, cursor: "pointer", fontFamily: UI, fontSize: 11.5, fontWeight: 700 }}>
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
            <span style={{ fontSize: 10.5, fontWeight: 700, background: "rgba(255,255,255,.14)", color: "#fff", borderRadius: 6, padding: "2px 8px" }}>{statusText}</span>
            {(lead.temperature === "Hot" || lead.temperature === "Very Hot") && <span style={{ fontSize: 10.5, fontWeight: 700, background: "rgba(225,90,80,.25)", color: "#ffd9d5", borderRadius: 6, padding: "2px 8px" }}>{lead.temperature}</span>}
          </div>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(110px,1fr))", gap: 12, marginTop: 16 }}>
        <HeaderItem k="Assigned agent" v={agentDisplay} />
        <HeaderItem k="Source" v={lead.source || "—"} />
        <HeaderItem k="Last contact" v={lead.last_contacted || "—"} />
        <HeaderItem k="Created" v={lead.created_on || (lead.created_at ? new Date(lead.created_at).toLocaleDateString() : "—")} />
      </div>
    </div>

    {/* action buttons */}
    <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
      {!revealed && <Btn icon={Eye} label="View Number" onClick={reveal} />}
      {revealed && lead.phone && <Btn icon={Phone} label="Call" onClick={() => { logAction("call", lead, me && me.id); window.location.href = "tel:" + digits(lead.phone); }} />}
      {lead.phone && <Btn icon={MessageCircle} label="WhatsApp" tone="ok" onClick={() => { logAction("whatsapp", lead, me && me.id); window.open("https://wa.me/" + digits(lead.phone), "_blank"); }} />}
      <Btn icon={Calendar} label="Schedule" onClick={() => { setSchedDate(lead.next_followup || ""); setSched(true); }} />
      {canReassign && <Btn icon={UserPlus} label="Change Agent" tone="gold" onClick={() => { setReTo(lead.assigned_agent || ""); setReReason(""); setErr2(""); setReOpen(true); }} />}
      {canEdit && <Btn icon={editing ? X : Pencil} label={editing ? "Cancel" : "Edit details"} tone="gold" onClick={() => editing ? setEditing(false) : startEdit()} />}
      {canEdit && lead.status !== "Closed Won" && <Btn icon={Coins} label="Close deal" tone="ok" onClick={() => setShowDeal(true)} />}
    </div>

    {showDeal && <DealSubmit lead={lead} user={user} onClose={() => setShowDeal(false)} onDone={() => { setShowDeal(false); go("deals"); }} />}

    {editing && <div style={{ ...card, padding: "12px 16px", marginTop: 12, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", background: T.goldSoft, borderColor: T.goldEdge }}>
      <span style={{ fontSize: 12.5, color: T.ink, fontWeight: 600 }}>Editing mode — {canEditAll ? "you can edit all fields" : "you can edit your lead's details"}. Changes are logged.</span>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={() => setEditing(false)} style={{ ...miniBtn() }}>Cancel</button>
        <button onClick={saveEdit} disabled={saving} style={{ background: T.btnBg, color: T.btnFg, border: "none", borderRadius: 9, padding: "8px 16px", fontSize: 12.5, fontWeight: 700, cursor: "pointer", fontFamily: UI, display: "flex", alignItems: "center", gap: 6, opacity: saving ? .7 : 1 }}><Save size={14} /> {saving ? "Saving…" : "Save changes"}</button>
      </div>
    </div>}
    {err2 && <div style={{ ...card, padding: "10px 14px", marginTop: 10, borderColor: T.badSoft, color: T.bad, fontSize: 12.5 }}>{err2}</div>}

    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 14, marginTop: 14 }}>
      {/* contact + status */}
      <div style={{ ...card, padding: 16 }}>
        <SectionMini>Contact information</SectionMini>
        {revealed ? GROUPS.contact.map((d) => <FieldRow key={d[0]} def={d} />)
          : <><FieldRow def={["client_name", "Client name", "text"]} />
              <div style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: `1px solid ${T.hairSoft}`, fontSize: 13 }}><span style={{ color: T.muted }}>Phone</span><span style={{ fontWeight: 600 }}>•••••• (View Number)</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: `1px solid ${T.hairSoft}`, fontSize: 13 }}><span style={{ color: T.muted }}>WhatsApp</span><span style={{ fontWeight: 600 }}>••••••</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: `1px solid ${T.hairSoft}`, fontSize: 13 }}><span style={{ color: T.muted }}>Email</span><span style={{ fontWeight: 600 }}>••••••</span></div></>}
        <div style={{ height: 14 }} />
        <SectionMini>Lead status</SectionMini>
        {GROUPS.meta.filter((d) => canEditAll || d[0] !== "source").map((d) => <FieldRow key={d[0]} def={d} />)}
      </div>
      {/* client profile + investment */}
      <div style={{ ...card, padding: 16 }}>
        <SectionMini>Client profile</SectionMini>
        {GROUPS.profile.map((d) => <FieldRow key={d[0]} def={d} />)}
        <div style={{ height: 14 }} />
        <SectionMini>Investment requirement</SectionMini>
        {GROUPS.invest.map((d) => <FieldRow key={d[0]} def={d} />)}
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
            <div style={{ fontSize: 13, fontWeight: 600 }}>{actText(t)}</div>
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

    {reOpen && <Modal title="Change assigned agent" onClose={() => setReOpen(false)}>
      <div style={{ fontSize: 12.5, color: T.muted, marginBottom: 10 }}>Current: <b style={{ color: T.ink }}>{agentDisplay}</b></div>
      <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: T.muted }}>Assign to</span>
      <select value={reTo} onChange={(e) => setReTo(e.target.value)} style={{ width: "100%", border: `1px solid ${T.hair}`, borderRadius: 10, padding: "10px 12px", fontSize: 13, fontFamily: UI, color: T.ink, background: T.paper, boxSizing: "border-box", marginTop: 5, marginBottom: 12 }}>
        <option value="">— Select —</option>
        <option value="__unassigned">Unassigned (no agent)</option>
        <option value="__open">Move to Open Leads pool</option>
        <optgroup label="Agents">
          {agents.filter((a) => ["agent", "admin", "sales_manager", "master_admin"].includes(a.role)).map((a) => <option key={a.id} value={a.id}>{a.full_name} · {roleLabel(a.role)}</option>)}
        </optgroup>
      </select>
      <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: T.muted }}>Reason (optional)</span>
      <textarea value={reReason} onChange={(e) => setReReason(e.target.value)} rows={2} placeholder="e.g. language match, workload balance, agent left"
        style={{ width: "100%", border: `1px solid ${T.hair}`, borderRadius: 10, padding: "10px 12px", fontSize: 13, fontFamily: UI, outline: "none", color: T.ink, background: T.bone, boxSizing: "border-box", marginTop: 5, marginBottom: 12, resize: "vertical" }} />
      <button onClick={doReassign} style={{ width: "100%", background: T.btnBg, color: T.btnFg, border: "none",
        borderRadius: 10, padding: "12px", fontSize: 13.5, fontWeight: 700, cursor: "pointer", fontFamily: UI }}>Save reassignment</button>
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
function SecurityLog({ go }) {
  const [ai, setAi] = useState(null);
  const [authRows, setAuthRows] = useState(null);
  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("auth_logs").select("email, event, status, reason, ip, device, created_at").order("created_at", { ascending: false }).limit(100);
      setAuthRows(data || []);
    })();
  }, []);
  useEffect(() => {
    (async () => {
      const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
      const { data } = await supabase.from("ai_logs").select("user_name, status, inappropriate, non_work, flagged, denied_reason, created_at").gte("created_at", since).limit(2000);
      const rows = data || [];
      const byUser = {}; rows.forEach((r) => { if (r.flagged) byUser[r.user_name] = (byUser[r.user_name] || 0) + 1; });
      setAi({
        inappropriate: rows.filter((r) => r.inappropriate).length,
        nonwork: rows.filter((r) => r.non_work).length,
        refused: rows.filter((r) => r.status === "refused").length,
        errors: rows.filter((r) => r.status === "error").length,
        denied: rows.filter((r) => r.denied_reason).length,
        repeatUsers: Object.entries(byUser).filter(([, n]) => n >= 3).map(([u]) => u),
      });
    })();
  }, []);
  return <div>
    <div style={{ ...card, padding: 16, marginBottom: 14, borderColor: ai && (ai.inappropriate || ai.nonwork) ? T.badSoft : T.hair }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
        <div style={{ fontSize: 13.5, fontWeight: 800, color: T.ink, display: "flex", alignItems: "center", gap: 8 }}><Sparkle size={16} color={T.gold} /> Ask Amber misuse — last 24h</div>
        {go && <button onClick={() => go("ailogs")} style={{ ...miniBtn(), padding: "6px 11px", fontSize: 11.5 }}>Open Ask Amber Logs <ChevronRight size={12} /></button>}
      </div>
      {ai === null ? <div style={{ color: T.muted, fontSize: 12.5 }}>Loading AI activity…</div> : <>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 10 }}>
          <Kpi label="Inappropriate Qs" value={ai.inappropriate} tone={ai.inappropriate ? "bad" : null} />
          <Kpi label="Non-work Qs" value={ai.nonwork} tone={ai.nonwork ? "warn" : null} />
          <Kpi label="Permission-denied" value={ai.denied} />
          <Kpi label="AI errors" value={ai.errors} />
        </div>
        {ai.repeatUsers.length > 0 && <div style={{ marginTop: 12, background: T.badSoft, borderRadius: 10, padding: "10px 13px", fontSize: 12.5, color: T.bad, fontWeight: 600 }}>
          <AlertTriangle size={13} style={{ verticalAlign: "-2px", marginRight: 5 }} /> Flagged for repeated misuse (3+ in 24h): {ai.repeatUsers.join(", ")}</div>}
      </>}
    </div>
    {authRows !== null && <div style={{ ...card, padding: 16, marginBottom: 14 }}>
      <div style={{ fontSize: 13.5, fontWeight: 800, color: T.ink, display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}><ShieldAlert size={16} color={T.gold} /> Authentication events</div>
      {(() => {
        const since = Date.now() - 24 * 3600 * 1000;
        const last24 = authRows.filter((r) => new Date(r.created_at).getTime() > since);
        const c = (f) => last24.filter(f).length;
        const lbl = { login_attempt: "Login attempt", login_success: "Login success", login_failed: "Login failed", account_inactive: "Inactive account", "2fa_sent": "2FA code sent", "2fa_success": "2FA verified", "2fa_failed": "2FA failed", "2fa_expired": "2FA expired", password_changed: "Password changed", forgot_requested: "Forgot password", reset_success: "Reset success", admin_reset: "Admin reset", account_locked: "Account locked" };
        return <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 10, marginBottom: 14 }}>
            <Kpi label="Failed logins (24h)" value={c((r) => r.event === "login_failed")} tone={c((r) => r.event === "login_failed") ? "warn" : null} />
            <Kpi label="2FA failures (24h)" value={c((r) => r.event === "2fa_failed")} tone={c((r) => r.event === "2fa_failed") ? "warn" : null} />
            <Kpi label="Codes sent (24h)" value={c((r) => r.event === "2fa_sent")} />
            <Kpi label="Password changes (24h)" value={c((r) => r.event === "password_changed")} />
          </div>
          {authRows.length === 0 ? <div style={{ color: T.muted, fontSize: 12.5 }}>No authentication events recorded yet.</div> :
          <div style={{ overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead><tr style={{ textAlign: "left", color: T.muted }}>
              <th style={{ padding: "6px 8px", fontWeight: 700 }}>When</th><th style={{ padding: "6px 8px", fontWeight: 700 }}>Email</th>
              <th style={{ padding: "6px 8px", fontWeight: 700 }}>Event</th><th style={{ padding: "6px 8px", fontWeight: 700 }}>Status</th>
              <th style={{ padding: "6px 8px", fontWeight: 700 }}>IP / device</th></tr></thead>
            <tbody>{authRows.slice(0, 40).map((r, i) => (
              <tr key={i} style={{ borderTop: `1px solid ${T.hair}` }}>
                <td style={{ padding: "6px 8px", color: T.muted, whiteSpace: "nowrap" }}>{new Date(r.created_at).toLocaleString()}</td>
                <td style={{ padding: "6px 8px" }}>{r.email || "—"}</td>
                <td style={{ padding: "6px 8px" }}>{lbl[r.event] || r.event}{r.reason ? <span style={{ color: T.faint }}> · {r.reason}</span> : null}</td>
                <td style={{ padding: "6px 8px" }}><span style={{ color: r.status === "ok" ? T.ok : r.status === "fail" ? T.bad : T.muted, fontWeight: 700 }}>{r.status || "—"}</span></td>
                <td style={{ padding: "6px 8px", color: T.faint, maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.ip || "—"}{r.device ? " · " + r.device.slice(0, 40) : ""}</td>
              </tr>))}</tbody>
          </table></div>}
        </>;
      })()}
    </div>}
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

/* ===================== AI KNOWLEDGE BASE (MASTER ADMIN) =================== */
const KB_CATEGORIES = ["Company Overview","Awards and Recognition","Developer Relationships","Services","Sales Scripts","WhatsApp Templates","Area Knowledge","Project Knowledge","Developer Knowledge","Investment Guidance","Golden Visa Guidance","Internal Policies","CRM Usage","Objection Handling","Compliance / Do Not Say","Market Updates","FAQs","Agent Training"];
const KB_VIS = [["all","All mentors"],["agent_ok","Agent AI allowed"],["ambreen_ai","Ambreen AI only"],["saad_ai","Saad AI only"],["ibrahim_ai","Ibrahim AI only"],["admin_only","Master/Admin AI only"]];
const visLabel = (v) => (KB_VIS.find((x) => x[0] === v) || ["", v])[1];
const kbInp = { width: "100%", padding: "9px 11px", borderRadius: 9, border: `1px solid ${T.hair}`, background: T.paper, color: T.ink, fontSize: 13, fontFamily: UI, boxSizing: "border-box" };

function KbEditor({ item, onSave, onCancel, saving, err }) {
  const seed = item === "new"
    ? { title: "", category: "Company Overview", content: "", visibility: "all", priority: 2, status: "active", source: "", tags: "", review_date: "" }
    : { title: item.title || "", category: item.category || "Company Overview", content: item.content || "", visibility: item.visibility || "all", priority: item.priority || 2, status: item.status || "active", source: item.source || "", tags: item.tags || "", review_date: item.review_date || "" };
  const [f, setF] = useState(seed);
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));
  const lbl = { fontSize: 11, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 5, display: "block" };
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,15,25,.55)", zIndex: 80, display: "grid", placeItems: "center", padding: 16 }} onClick={onCancel}>
      <div onClick={(e) => e.stopPropagation()} style={{ ...card, width: "min(640px, 96vw)", maxHeight: "92vh", overflowY: "auto", padding: 22 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontFamily: DISPLAY, fontSize: 18, fontWeight: 800, color: T.ink }}>{item === "new" ? "Add knowledge item" : "Edit knowledge item"}</div>
          <button onClick={onCancel} style={{ background: "none", border: "none", color: T.muted, cursor: "pointer", padding: 4 }}><X size={18} /></button>
        </div>
        <div style={{ marginBottom: 12 }}><label style={lbl}>Title</label>
          <input value={f.title} onChange={(e) => set("title", e.target.value)} style={kbInp} placeholder="e.g. Palm Jebel Ali Payment Plan 2026" /></div>
        <div style={{ display: "flex", gap: 12, marginBottom: 12, flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 200px" }}><label style={lbl}>Category</label>
            <select value={f.category} onChange={(e) => set("category", e.target.value)} style={kbInp}>{KB_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}</select></div>
          <div style={{ flex: "1 1 200px" }}><label style={lbl}>Visibility</label>
            <select value={f.visibility} onChange={(e) => set("visibility", e.target.value)} style={kbInp}>{KB_VIS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
        </div>
        <div style={{ marginBottom: 12 }}><label style={lbl}>Content (what the AI should know / say)</label>
          <textarea value={f.content} onChange={(e) => set("content", e.target.value)} rows={6} style={{ ...kbInp, resize: "vertical", lineHeight: 1.5 }} placeholder="Write verified, careful wording. Avoid unverified awards, rankings, ROI guarantees." /></div>
        <div style={{ display: "flex", gap: 12, marginBottom: 12, flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 140px" }}><label style={lbl}>Priority</label>
            <select value={f.priority} onChange={(e) => set("priority", e.target.value)} style={kbInp}><option value={1}>High</option><option value={2}>Normal</option><option value={3}>Low</option></select></div>
          <div style={{ flex: "1 1 140px" }}><label style={lbl}>Status</label>
            <select value={f.status} onChange={(e) => set("status", e.target.value)} style={kbInp}><option value="active">Active</option><option value="inactive">Inactive</option></select></div>
          <div style={{ flex: "1 1 160px" }}><label style={lbl}>Review date (optional)</label>
            <input type="date" value={f.review_date || ""} onChange={(e) => set("review_date", e.target.value)} style={kbInp} /></div>
        </div>
        <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 200px" }}><label style={lbl}>Source / reference (optional)</label>
            <input value={f.source} onChange={(e) => set("source", e.target.value)} style={kbInp} placeholder="e.g. Developer email, Q1 market report" /></div>
          <div style={{ flex: "1 1 200px" }}><label style={lbl}>Tags (comma separated, optional)</label>
            <input value={f.tags} onChange={(e) => set("tags", e.target.value)} style={kbInp} placeholder="palm jebel ali, nakheel, payment plan" /></div>
        </div>
        {err && <div style={{ background: T.badSoft, color: T.bad, padding: "9px 12px", borderRadius: 9, fontSize: 12.5, marginBottom: 12 }}>{err}</div>}
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onCancel} style={{ padding: "10px 16px", borderRadius: 9, border: `1px solid ${T.hair}`, background: T.paper, color: T.ink, cursor: "pointer", fontWeight: 600, fontFamily: UI }}>Cancel</button>
          <button onClick={() => onSave(f)} disabled={saving} style={{ padding: "10px 18px", borderRadius: 9, border: "none", background: T.btnBg, color: T.btnFg, cursor: saving ? "default" : "pointer", fontWeight: 700, fontFamily: UI, opacity: saving ? .7 : 1, display: "flex", alignItems: "center", gap: 7 }}><Save size={15} /> {saving ? "Saving…" : "Save item"}</button>
        </div>
      </div>
    </div>
  );
}

function KnowledgeBase({ user }) {
  const [items, setItems] = useState(null);
  const [q, setQ] = useState("");
  const [catF, setCatF] = useState("");
  const [visF, setVisF] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [editing, setEditing] = useState(null);   // item object | "new" | null
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const load = async () => {
    setItems(null);
    const { data, error } = await supabase.from("ai_knowledge").select("*")
      .eq("deleted", false).order("priority", { ascending: true }).order("updated_at", { ascending: false });
    setItems(error ? [] : (data || []));
  };
  useEffect(() => { load(); }, []);

  const audit = async (action, item, oldVal) => {
    try {
      await supabase.from("admin_audit").insert({ action, performed_by: user.id,
        old_value: oldVal || null,
        new_value: item ? { title: item.title, category: item.category, status: item.status, visibility: item.visibility } : null,
        detail: (item && item.title) || "" });
    } catch (e) {}
  };

  const save = async (form) => {
    setSaving(true); setErr("");
    if (!form.title.trim() || !form.content.trim()) { setErr("Title and content are required."); setSaving(false); return; }
    try {
      const row = { title: form.title.trim(), category: form.category, content: form.content.trim(),
        visibility: form.visibility, priority: Number(form.priority) || 2, status: form.status,
        source: form.source || null, tags: form.tags || null, review_date: form.review_date || null,
        updated_by: user.id, updated_at: new Date().toISOString() };
      if (editing === "new") {
        row.added_by = user.id;
        const { error } = await supabase.from("ai_knowledge").insert(row);
        if (error) throw error;
        await audit("kb_created", row);
      } else {
        const { error } = await supabase.from("ai_knowledge").update(row).eq("id", editing.id);
        if (error) throw error;
        await audit("kb_edited", row, { title: editing.title, category: editing.category, status: editing.status, visibility: editing.visibility });
      }
      setEditing(null); await load();
    } catch (e) { setErr("Save failed. The Knowledge Base is editable by Master Admin only."); }
    finally { setSaving(false); }
  };

  const toggleStatus = async (it) => {
    const ns = it.status === "active" ? "inactive" : "active";
    await supabase.from("ai_knowledge").update({ status: ns, updated_by: user.id, updated_at: new Date().toISOString() }).eq("id", it.id);
    await audit(ns === "active" ? "kb_activated" : "kb_deactivated", it);
    load();
  };
  const softDelete = async (it) => {
    if (!window.confirm(`Soft-delete "${it.title}"?\n\nIt will be hidden from Ask Amber and from this list, but the data is retained for audit.`)) return;
    await supabase.from("ai_knowledge").update({ deleted: true, status: "inactive", updated_by: user.id, updated_at: new Date().toISOString() }).eq("id", it.id);
    await audit("kb_deleted", it);
    load();
  };

  const today = dubaiToday();
  const all = items || [];
  const activeCount = all.filter((i) => i.status === "active").length;
  const dueCount = all.filter((i) => i.review_date && i.review_date <= today && i.status === "active").length;
  const filtered = all.filter((it) =>
    (showInactive || it.status === "active") &&
    (!catF || it.category === catF) &&
    (!visF || it.visibility === visF) &&
    (!q || (it.title + " " + it.content + " " + (it.tags || "")).toLowerCase().includes(q.toLowerCase())));

  const catColor = (c) => /do not say|compliance/i.test(c) ? T.bad : /award|recognition|developer relation/i.test(c) ? T.gold : T.info;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 18 }}>
        <div>
          <div style={{ fontFamily: DISPLAY, fontSize: 23, fontWeight: 800, color: T.ink, display: "flex", alignItems: "center", gap: 10 }}><BookOpen size={22} color={T.gold} /> AI Knowledge Base</div>
          <div style={{ color: T.muted, fontSize: 13, marginTop: 4 }}>Verified Amber Homes knowledge that powers Ask Amber. Master Admin only — agents cannot see or edit this.</div>
        </div>
        <button onClick={() => { setErr(""); setEditing("new"); }} style={{ padding: "11px 18px", borderRadius: 10, border: "none", background: T.btnBg, color: T.btnFg, cursor: "pointer", fontWeight: 700, fontFamily: UI, display: "flex", alignItems: "center", gap: 8, boxShadow: T.shadow }}><Plus size={16} /> Add knowledge</button>
      </div>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
        {[["Total items", all.length, T.ink], ["Active", activeCount, T.ok], ["Due for review", dueCount, dueCount ? T.warn : T.muted]].map(([l, v, c]) => (
          <div key={l} style={{ ...card, padding: "12px 16px", minWidth: 120 }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: c, fontFamily: DISPLAY }}>{v}</div>
            <div style={{ fontSize: 11.5, color: T.muted, fontWeight: 600 }}>{l}</div>
          </div>
        ))}
      </div>

      <div style={{ ...card, padding: 14, marginBottom: 14, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: "1 1 220px" }}>
          <Search size={15} color={T.faint} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)" }} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search title, content, tags…" style={{ ...kbInp, paddingLeft: 33 }} />
        </div>
        <select value={catF} onChange={(e) => setCatF(e.target.value)} style={{ ...kbInp, width: "auto", flex: "0 1 200px" }}><option value="">All categories</option>{KB_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}</select>
        <select value={visF} onChange={(e) => setVisF(e.target.value)} style={{ ...kbInp, width: "auto", flex: "0 1 180px" }}><option value="">All visibility</option>{KB_VIS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
        <button onClick={() => setShowInactive((s) => !s)} style={{ padding: "9px 13px", borderRadius: 9, border: `1px solid ${showInactive ? T.gold : T.hair}`, background: showInactive ? T.goldSoft : T.paper, color: showInactive ? T.gold : T.muted, cursor: "pointer", fontSize: 12.5, fontWeight: 600, fontFamily: UI, display: "flex", alignItems: "center", gap: 6 }}>{showInactive ? <Eye size={14} /> : <EyeOff size={14} />} Inactive</button>
      </div>

      {items === null ? (
        <div style={{ ...card, padding: 40, textAlign: "center", color: T.muted }}>Loading knowledge…</div>
      ) : filtered.length === 0 ? (
        <div style={{ ...card, padding: 40, textAlign: "center", color: T.muted }}>No knowledge items match. {all.length === 0 && "Run migration 07 in Supabase to seed the starter items, or add one above."}</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map((it) => {
            const due = it.review_date && it.review_date <= today;
            const inactive = it.status !== "active";
            return (
              <div key={it.id} style={{ ...card, padding: 16, opacity: inactive ? .62 : 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
                  <div style={{ flex: "1 1 300px", minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
                      {it.priority === 1 && <Star size={14} color={T.gold} fill={T.gold} />}
                      <span style={{ fontWeight: 700, fontSize: 14.5, color: T.ink }}>{it.title}</span>
                      <span style={{ fontSize: 10.5, fontWeight: 700, padding: "2px 8px", borderRadius: 999, background: catColor(it.category) + "1A", color: catColor(it.category) }}>{it.category}</span>
                      {inactive && <span style={{ fontSize: 10.5, fontWeight: 700, padding: "2px 8px", borderRadius: 999, background: T.hairSoft, color: T.muted }}>Inactive</span>}
                      {due && !inactive && <span style={{ fontSize: 10.5, fontWeight: 700, padding: "2px 8px", borderRadius: 999, background: T.warnSoft, color: T.warn, display: "flex", alignItems: "center", gap: 3 }}><Clock size={11} /> Review due</span>}
                    </div>
                    <div style={{ fontSize: 13, color: T.inkSoft, lineHeight: 1.5, marginBottom: 8 }}>{it.content}</div>
                    <div style={{ fontSize: 11, color: T.faint, display: "flex", gap: 12, flexWrap: "wrap" }}>
                      <span><Eye size={11} style={{ verticalAlign: "-1px" }} /> {visLabel(it.visibility)}</span>
                      {it.tags && <span># {it.tags}</span>}
                      {it.source && <span>Source: {it.source}</span>}
                      <span>Updated {(it.updated_at || "").slice(0, 10)}</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                    <button onClick={() => { setErr(""); setEditing(it); }} title="Edit" style={{ width: 34, height: 34, borderRadius: 8, border: `1px solid ${T.hair}`, background: T.paper, color: T.inkSoft, cursor: "pointer", display: "grid", placeItems: "center" }}><Pencil size={15} /></button>
                    <button onClick={() => toggleStatus(it)} title={inactive ? "Activate" : "Deactivate"} style={{ width: 34, height: 34, borderRadius: 8, border: `1px solid ${T.hair}`, background: T.paper, color: inactive ? T.ok : T.warn, cursor: "pointer", display: "grid", placeItems: "center" }}>{inactive ? <Check size={15} /> : <EyeOff size={15} />}</button>
                    <button onClick={() => softDelete(it)} title="Soft-delete" style={{ width: 34, height: 34, borderRadius: 8, border: `1px solid ${T.hair}`, background: T.paper, color: T.bad, cursor: "pointer", display: "grid", placeItems: "center" }}><Trash2 size={15} /></button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editing && <KbEditor item={editing} onSave={save} onCancel={() => setEditing(null)} saving={saving} err={err} />}
    </div>
  );
}

/* =========================== PROJECTS MODULE ============================= */
const PROJ_STATUS = [["active", "Active", "ok"], ["upcoming", "Upcoming", "info"], ["sold_out", "Sold out", "warn"], ["inactive", "Inactive", "muted"]];
const projStatusMeta = (s) => PROJ_STATUS.find((x) => x[0] === s) || ["active", s, "info"];
const FILE_KINDS = [["brochure", "Brochure"], ["floorplan", "Floor plan"], ["paymentplan", "Payment plan"], ["pricelist", "Price list"], ["image", "Image"], ["other", "Other"]];
const fileKindLabel = (k) => (FILE_KINDS.find((x) => x[0] === k) || [k, k])[1];
const pInp = { width: "100%", padding: "9px 11px", borderRadius: 9, border: `1px solid ${T.hair}`, background: T.paper, color: T.ink, fontSize: 13, fontFamily: UI, boxSizing: "border-box" };

function ProjectEditor({ project, user, onSaved, onCancel }) {
  const isNew = project === "new";
  const seed = isNew
    ? { name: "", developer: "", area: "", property_type: "", starting_price: "", payment_plan: "", handover_date: "", commission_pct: "", unit_types: "", bedroom_options: "", selling_points: "", investment_points: "", risks_notes: "", golden_visa: "", target_client: "", status: "active", launch_date: "", talking_points: "", do_not_say: "", agent_visible: true, review_date: "" }
    : { ...project, launch_date: project.launch_date || "", review_date: project.review_date || "" };
  const [f, setF] = useState(seed);
  const [files, setFiles] = useState([]);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [busyFile, setBusyFile] = useState(false);
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));
  const lbl = { fontSize: 11, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 5, display: "block" };

  const loadFiles = async (pid) => { const { data } = await supabase.from("project_files").select("*").eq("project_id", pid).order("created_at", { ascending: true }); setFiles(data || []); };
  useEffect(() => { if (!isNew && project.id) loadFiles(project.id); }, []);

  const save = async () => {
    setSaving(true); setErr("");
    if (!f.name.trim()) { setErr("Project name is required."); setSaving(false); return; }
    const row = {}; ["name", "developer", "area", "property_type", "starting_price", "payment_plan", "handover_date", "commission_pct", "unit_types", "bedroom_options", "selling_points", "investment_points", "risks_notes", "golden_visa", "target_client", "status", "talking_points", "do_not_say", "agent_visible"].forEach((k) => { row[k] = f[k] === "" ? null : f[k]; });
    row.launch_date = f.launch_date || null; row.review_date = f.review_date || null;
    row.updated_by = user.id; row.updated_at = new Date().toISOString();
    try {
      let pid = isNew ? null : project.id;
      if (isNew) {
        row.added_by = user.id;
        const { data, error } = await supabase.from("projects").insert(row).select("id").single();
        if (error) throw error; pid = data.id;
        await supabase.from("admin_audit").insert({ action: "project_added", performed_by: user.id, new_value: { name: row.name }, detail: row.name });
      } else {
        const { error } = await supabase.from("projects").update(row).eq("id", project.id);
        if (error) throw error;
        await supabase.from("admin_audit").insert({ action: "project_edited", performed_by: user.id, new_value: { name: row.name, status: row.status }, detail: row.name });
      }
      onSaved();
    } catch (e) { setErr("Save failed. Projects are editable by Master Admin only. " + (e.message || "")); }
    finally { setSaving(false); }
  };

  const addFileByUrl = async (kind, name, url, internal) => {
    if (!url.trim() || !name.trim() || isNew) return;
    await supabase.from("project_files").insert({ project_id: project.id, kind, file_name: name.trim(), url: url.trim(), internal_only: internal, uploaded_by: user.id });
    await supabase.from("admin_audit").insert({ action: "brochure_uploaded", performed_by: user.id, detail: project.name + " · " + name });
    loadFiles(project.id);
  };
  const uploadFile = async (kind, file, internal) => {
    if (isNew || !file) return; setBusyFile(true); setErr("");
    try {
      const path = project.id + "/" + kind + "-" + Date.now() + "-" + file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const { error: upErr } = await supabase.storage.from("project-files").upload(path, file, { upsert: false });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("project-files").getPublicUrl(path);
      await supabase.from("project_files").insert({ project_id: project.id, kind, file_name: file.name, url: pub.publicUrl, internal_only: internal, uploaded_by: user.id });
      await supabase.from("admin_audit").insert({ action: "brochure_uploaded", performed_by: user.id, detail: project.name + " · " + file.name });
      loadFiles(project.id);
    } catch (e) { setErr("Upload failed: " + (e.message || "") + " — If this persists, create a PUBLIC Storage bucket named 'project-files' in Supabase, or paste a file link instead."); }
    finally { setBusyFile(false); }
  };
  const delFile = async (fileRow) => { await supabase.from("project_files").delete().eq("id", fileRow.id); loadFiles(project.id); };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,15,25,.55)", zIndex: 80, display: "grid", placeItems: "center", padding: 16 }} onClick={onCancel}>
      <div onClick={(e) => e.stopPropagation()} style={{ ...card, width: "min(720px, 96vw)", maxHeight: "92vh", overflowY: "auto", padding: 22 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontFamily: DISPLAY, fontSize: 18, fontWeight: 800, color: T.ink }}>{isNew ? "Add project" : "Edit project"}</div>
          <button onClick={onCancel} style={{ background: "none", border: "none", color: T.muted, cursor: "pointer", padding: 4 }}><X size={18} /></button>
        </div>
        <div style={{ marginBottom: 12 }}><label style={lbl}>Project name *</label><input value={f.name} onChange={(e) => set("name", e.target.value)} style={pInp} placeholder="e.g. Palm Jebel Ali — Coral Collection" /></div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
          <div style={{ flex: "1 1 200px" }}><label style={lbl}>Developer</label><input value={f.developer || ""} onChange={(e) => set("developer", e.target.value)} style={pInp} /></div>
          <div style={{ flex: "1 1 200px" }}><label style={lbl}>Area</label><input value={f.area || ""} onChange={(e) => set("area", e.target.value)} style={pInp} /></div>
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
          <div style={{ flex: "1 1 160px" }}><label style={lbl}>Property type</label>
            <select value={f.property_type || ""} onChange={(e) => set("property_type", e.target.value)} style={pInp}><option value="">—</option>{["Apartment", "Villa", "Townhouse", "Penthouse", "Plot", "Commercial", "Mixed"].map((o) => <option key={o}>{o}</option>)}</select></div>
          <div style={{ flex: "1 1 160px" }}><label style={lbl}>Starting price</label><input value={f.starting_price || ""} onChange={(e) => set("starting_price", e.target.value)} style={pInp} placeholder="e.g. AED 2.8M" /></div>
          <div style={{ flex: "1 1 160px" }}><label style={lbl}>Handover</label><input value={f.handover_date || ""} onChange={(e) => set("handover_date", e.target.value)} style={pInp} placeholder="e.g. Q4 2027" /></div>
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
          <div style={{ flex: "1 1 160px" }}><label style={lbl}>Unit types</label><input value={f.unit_types || ""} onChange={(e) => set("unit_types", e.target.value)} style={pInp} placeholder="1–4 BR, villas" /></div>
          <div style={{ flex: "1 1 160px" }}><label style={lbl}>Bedroom options</label><input value={f.bedroom_options || ""} onChange={(e) => set("bedroom_options", e.target.value)} style={pInp} placeholder="Studio–5 BR" /></div>
          <div style={{ flex: "1 1 160px" }}><label style={lbl}>Commission % (internal)</label><input value={f.commission_pct || ""} onChange={(e) => set("commission_pct", e.target.value)} style={pInp} /></div>
        </div>
        <div style={{ marginBottom: 12 }}><label style={lbl}>Payment plan</label><textarea value={f.payment_plan || ""} onChange={(e) => set("payment_plan", e.target.value)} rows={2} style={{ ...pInp, resize: "vertical" }} placeholder="e.g. 20% down, 50% during construction, 30% on handover" /></div>
        <div style={{ marginBottom: 12 }}><label style={lbl}>Key selling points</label><textarea value={f.selling_points || ""} onChange={(e) => set("selling_points", e.target.value)} rows={2} style={{ ...pInp, resize: "vertical" }} /></div>
        <div style={{ marginBottom: 12 }}><label style={lbl}>Investment points</label><textarea value={f.investment_points || ""} onChange={(e) => set("investment_points", e.target.value)} rows={2} style={{ ...pInp, resize: "vertical" }} /></div>
        <div style={{ marginBottom: 12 }}><label style={lbl}>Risks / notes</label><textarea value={f.risks_notes || ""} onChange={(e) => set("risks_notes", e.target.value)} rows={2} style={{ ...pInp, resize: "vertical" }} /></div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
          <div style={{ flex: "1 1 200px" }}><label style={lbl}>Golden Visa relevance</label><input value={f.golden_visa || ""} onChange={(e) => set("golden_visa", e.target.value)} style={pInp} /></div>
          <div style={{ flex: "1 1 200px" }}><label style={lbl}>Target client profile</label><input value={f.target_client || ""} onChange={(e) => set("target_client", e.target.value)} style={pInp} /></div>
        </div>
        <div style={{ marginBottom: 12 }}><label style={lbl}>Approved talking points (for Ask Amber)</label><textarea value={f.talking_points || ""} onChange={(e) => set("talking_points", e.target.value)} rows={2} style={{ ...pInp, resize: "vertical" }} /></div>
        <div style={{ marginBottom: 12 }}><label style={lbl}>Do-not-say notes</label><textarea value={f.do_not_say || ""} onChange={(e) => set("do_not_say", e.target.value)} rows={2} style={{ ...pInp, resize: "vertical" }} placeholder="e.g. don't quote prices, don't promise ROI" /></div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 12, alignItems: "flex-end" }}>
          <div style={{ flex: "1 1 140px" }}><label style={lbl}>Status</label><select value={f.status} onChange={(e) => set("status", e.target.value)} style={pInp}>{PROJ_STATUS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
          <div style={{ flex: "1 1 140px" }}><label style={lbl}>Launch date</label><input type="date" value={f.launch_date || ""} onChange={(e) => set("launch_date", e.target.value)} style={pInp} /></div>
          <div style={{ flex: "1 1 140px" }}><label style={lbl}>Review date</label><input type="date" value={f.review_date || ""} onChange={(e) => set("review_date", e.target.value)} style={pInp} /></div>
          <button onClick={() => set("agent_visible", !f.agent_visible)} style={{ flex: "0 1 auto", padding: "9px 13px", borderRadius: 9, border: `1px solid ${f.agent_visible ? T.ok : T.hair}`, background: f.agent_visible ? T.okSoft : T.paper, color: f.agent_visible ? T.ok : T.muted, cursor: "pointer", fontWeight: 700, fontFamily: UI, fontSize: 12.5, display: "flex", alignItems: "center", gap: 6 }}>{f.agent_visible ? <Eye size={14} /> : <EyeOff size={14} />} {f.agent_visible ? "Visible to agents" : "Hidden from agents"}</button>
        </div>

        {/* files (existing projects only) */}
        {!isNew && <div style={{ marginTop: 6, marginBottom: 14, ...card, padding: 14 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: T.ink, marginBottom: 10 }}>Files & brochures</div>
          {files.length === 0 ? <div style={{ fontSize: 12, color: T.muted, marginBottom: 10 }}>No files yet.</div> :
            files.map((fl) => <div key={fl.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: `1px solid ${T.hairSoft}`, fontSize: 12.5 }}>
              <FileText size={14} color={T.gold} /><span style={{ fontWeight: 600 }}>{fl.file_name}</span>
              <span style={{ fontSize: 10.5, color: T.muted, background: T.hairSoft, borderRadius: 6, padding: "1px 7px" }}>{fileKindLabel(fl.kind)}</span>
              {fl.internal_only && <span style={{ fontSize: 10, color: T.warn, fontWeight: 700 }}>Internal</span>}
              <a href={fl.url} target="_blank" rel="noreferrer" style={{ marginLeft: "auto", fontSize: 11.5, color: T.info, textDecoration: "none", fontWeight: 600 }}>Open</a>
              <button onClick={() => delFile(fl)} style={{ background: "none", border: "none", color: T.bad, cursor: "pointer", padding: 2 }}><Trash2 size={13} /></button>
            </div>)}
          <FileAdder onUrl={addFileByUrl} onUpload={uploadFile} busy={busyFile} />
        </div>}

        {err && <div style={{ background: T.badSoft, color: T.bad, padding: "9px 12px", borderRadius: 9, fontSize: 12.5, marginBottom: 12 }}>{err}</div>}
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onCancel} style={{ padding: "10px 16px", borderRadius: 9, border: `1px solid ${T.hair}`, background: T.paper, color: T.ink, cursor: "pointer", fontWeight: 600, fontFamily: UI }}>Close</button>
          <button onClick={save} disabled={saving} style={{ padding: "10px 18px", borderRadius: 9, border: "none", background: T.btnBg, color: T.btnFg, cursor: saving ? "default" : "pointer", fontWeight: 700, fontFamily: UI, opacity: saving ? .7 : 1, display: "flex", alignItems: "center", gap: 7 }}><Save size={15} /> {saving ? "Saving…" : "Save project"}</button>
        </div>
        {isNew && <div style={{ fontSize: 11, color: T.faint, marginTop: 10 }}>Save the project first, then re-open it to upload brochures and files.</div>}
      </div>
    </div>
  );
}

function FileAdder({ onUrl, onUpload, busy }) {
  const [kind, setKind] = useState("brochure");
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [internal, setInternal] = useState(false);
  return (
    <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${T.hairSoft}` }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 8 }}>
        <select value={kind} onChange={(e) => setKind(e.target.value)} style={{ ...pInp, width: "auto" }}>{FILE_KINDS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
        <button onClick={() => setInternal((s) => !s)} style={{ padding: "8px 11px", borderRadius: 8, border: `1px solid ${internal ? T.warn : T.hair}`, background: internal ? T.warnSoft : T.paper, color: internal ? T.warn : T.muted, cursor: "pointer", fontSize: 11.5, fontWeight: 600, fontFamily: UI }}>{internal ? "Internal only" : "Visible to agents"}</button>
        <label style={{ fontSize: 11.5, color: T.info, fontWeight: 600, cursor: busy ? "default" : "pointer", display: "inline-flex", alignItems: "center", gap: 5 }}>
          <Upload size={13} /> {busy ? "Uploading…" : "Upload file"}
          <input type="file" disabled={busy} onChange={(e) => { if (e.target.files[0]) onUpload(kind, e.target.files[0], internal); e.target.value = ""; }} style={{ display: "none" }} />
        </label>
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="File name (for link)" style={{ ...pInp, flex: "1 1 140px" }} />
        <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="…or paste a file link (URL)" style={{ ...pInp, flex: "1 1 180px" }} />
        <button onClick={() => { onUrl(kind, name, url, internal); setName(""); setUrl(""); }} disabled={!name.trim() || !url.trim()} style={{ padding: "9px 14px", borderRadius: 8, border: "none", background: T.btnBg, color: T.btnFg, cursor: "pointer", fontWeight: 700, fontFamily: UI, fontSize: 12.5, opacity: (!name.trim() || !url.trim()) ? .5 : 1 }}>Add link</button>
      </div>
    </div>
  );
}

function Projects({ user, go }) {
  const isAdmin = user && (user.role === "master_admin" || user.role === "admin");
  const [projects, setProjects] = useState(null);
  const [q, setQ] = useState("");
  const [devF, setDevF] = useState("");
  const [areaF, setAreaF] = useState("");
  const [typeF, setTypeF] = useState("");
  const [editing, setEditing] = useState(null);
  const [expand, setExpand] = useState({});

  const load = async () => {
    setProjects(null);
    const { data, error } = await supabase.from("projects").select("*, files:project_files(*)").eq("deleted", false).order("updated_at", { ascending: false });
    setProjects(error ? [] : (data || []));
  };
  useEffect(() => { load(); }, []);

  const toggleStatus = async (p) => {
    const ns = p.status === "inactive" ? "active" : "inactive";
    await supabase.from("projects").update({ status: ns, updated_by: user.id, updated_at: new Date().toISOString() }).eq("id", p.id);
    await supabase.from("admin_audit").insert({ action: "project_deactivated", performed_by: user.id, new_value: { status: ns }, detail: p.name });
    load();
  };
  const softDelete = async (p) => {
    if (!window.confirm('Soft-delete "' + p.name + '"? It will be hidden from agents and Ask Amber. (Data is retained.)')) return;
    await supabase.from("projects").update({ deleted: true, updated_by: user.id, updated_at: new Date().toISOString() }).eq("id", p.id);
    await supabase.from("admin_audit").insert({ action: "project_deleted", performed_by: user.id, detail: p.name });
    load();
  };
  const download = async (p, fl) => {
    try {
      await supabase.from("file_downloads").insert({ user_id: user.id, user_name: user.name, user_role: user.role, project_id: p.id, file_name: fl.file_name });
    } catch (e) {}
    window.open(fl.url, "_blank");
  };

  const all = projects || [];
  const devs = [...new Set(all.map((p) => p.developer).filter(Boolean))].sort();
  const areas = [...new Set(all.map((p) => p.area).filter(Boolean))].sort();
  const types = [...new Set(all.map((p) => p.property_type).filter(Boolean))].sort();
  const today = dubaiToday();
  const filtered = all.filter((p) =>
    (!devF || p.developer === devF) && (!areaF || p.area === areaF) && (!typeF || p.property_type === typeF) &&
    (!q || (p.name + " " + (p.developer || "") + " " + (p.area || "") + " " + (p.selling_points || "")).toLowerCase().includes(q.toLowerCase())));

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 18 }}>
        <div>
          <div style={{ fontFamily: DISPLAY, fontSize: 23, fontWeight: 800, color: T.ink, display: "flex", alignItems: "center", gap: 10 }}><Building2 size={22} color={T.gold} /> Projects</div>
          <div style={{ color: T.muted, fontSize: 13, marginTop: 4 }}>{isAdmin ? "Add projects, upload brochures, and control what agents can see. Ask Amber uses active projects." : "Approved Amber Homes projects. Download brochures and ask Ask Amber about any project."}</div>
        </div>
        {isAdmin && <button onClick={() => setEditing("new")} style={{ padding: "11px 18px", borderRadius: 10, border: "none", background: T.btnBg, color: T.btnFg, cursor: "pointer", fontWeight: 700, fontFamily: UI, display: "flex", alignItems: "center", gap: 8, boxShadow: T.shadow }}><Plus size={16} /> Add project</button>}
      </div>

      <div style={{ ...card, padding: 14, marginBottom: 14, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: "1 1 200px" }}>
          <Search size={15} color={T.faint} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)" }} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search projects…" style={{ ...pInp, paddingLeft: 33 }} />
        </div>
        <select value={devF} onChange={(e) => setDevF(e.target.value)} style={{ ...pInp, width: "auto", flex: "0 1 160px" }}><option value="">All developers</option>{devs.map((d) => <option key={d}>{d}</option>)}</select>
        <select value={areaF} onChange={(e) => setAreaF(e.target.value)} style={{ ...pInp, width: "auto", flex: "0 1 150px" }}><option value="">All areas</option>{areas.map((a) => <option key={a}>{a}</option>)}</select>
        <select value={typeF} onChange={(e) => setTypeF(e.target.value)} style={{ ...pInp, width: "auto", flex: "0 1 150px" }}><option value="">All types</option>{types.map((t) => <option key={t}>{t}</option>)}</select>
      </div>

      {projects === null ? <div style={{ ...card, padding: 40, textAlign: "center", color: T.muted }}>Loading projects…</div>
        : filtered.length === 0 ? <div style={{ ...card, padding: 40, textAlign: "center", color: T.muted }}>No projects {all.length === 0 ? "yet. " + (isAdmin ? "Add one above, after running migration 08 in Supabase." : "have been added yet.") : "match your filters."}</div>
        : <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(320px,1fr))", gap: 14 }}>
          {filtered.map((p) => {
            const sm = projStatusMeta(p.status);
            const due = p.review_date && p.review_date <= today;
            const visFiles = (p.files || []).filter((fl) => isAdmin || !fl.internal_only);
            const open = expand[p.id];
            return (
              <div key={p.id} style={{ ...card, padding: 16, opacity: p.status === "inactive" ? .6 : 1, display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                  <div style={{ fontWeight: 800, fontSize: 15.5, color: T.ink, fontFamily: DISPLAY }}>{p.name}</div>
                  <Chip tone={sm[2]}>{sm[1]}</Chip>
                </div>
                <div style={{ fontSize: 12, color: T.muted, marginTop: 4 }}>{[p.developer, p.area, p.property_type].filter(Boolean).join(" · ") || "—"}</div>
                <div style={{ display: "flex", gap: 14, marginTop: 10, flexWrap: "wrap", fontSize: 12 }}>
                  {p.starting_price && <div><div style={{ color: T.faint, fontSize: 10 }}>FROM</div><div style={{ fontWeight: 700 }}>{p.starting_price}</div></div>}
                  {p.handover_date && <div><div style={{ color: T.faint, fontSize: 10 }}>HANDOVER</div><div style={{ fontWeight: 700 }}>{p.handover_date}</div></div>}
                  {p.bedroom_options && <div><div style={{ color: T.faint, fontSize: 10 }}>UNITS</div><div style={{ fontWeight: 700 }}>{p.bedroom_options}</div></div>}
                </div>
                {p.selling_points && <div style={{ fontSize: 12.5, color: T.inkSoft, marginTop: 10, lineHeight: 1.5, display: open ? "block" : "-webkit-box", WebkitLineClamp: open ? "none" : 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{p.selling_points}</div>}
                {open && <div style={{ marginTop: 10, fontSize: 12.5, color: T.inkSoft, lineHeight: 1.55 }}>
                  {p.payment_plan && <div style={{ marginBottom: 6 }}><b style={{ color: T.ink }}>Payment plan:</b> {p.payment_plan}</div>}
                  {p.investment_points && <div style={{ marginBottom: 6 }}><b style={{ color: T.ink }}>Investment:</b> {p.investment_points}</div>}
                  {p.golden_visa && <div style={{ marginBottom: 6 }}><b style={{ color: T.ink }}>Golden Visa:</b> {p.golden_visa}</div>}
                  {p.target_client && <div style={{ marginBottom: 6 }}><b style={{ color: T.ink }}>Target client:</b> {p.target_client}</div>}
                  {p.risks_notes && <div style={{ marginBottom: 6 }}><b style={{ color: T.ink }}>Risks/notes:</b> {p.risks_notes}</div>}
                  {p.talking_points && <div style={{ marginBottom: 6 }}><b style={{ color: T.ink }}>Talking points:</b> {p.talking_points}</div>}
                </div>}
                {(p.selling_points || p.payment_plan || p.investment_points) && <button onClick={() => setExpand((s) => ({ ...s, [p.id]: !s[p.id] }))} style={{ alignSelf: "flex-start", marginTop: 8, background: "none", border: "none", color: T.gold, fontSize: 11.5, fontWeight: 700, cursor: "pointer", fontFamily: UI }}>{open ? "Show less" : "More details"}</button>}

                {visFiles.length > 0 && <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginTop: 12 }}>
                  {visFiles.map((fl) => <button key={fl.id} onClick={() => download(p, fl)} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 11px", borderRadius: 8, border: `1px solid ${T.hair}`, background: T.bone, color: T.ink, cursor: "pointer", fontSize: 11.5, fontWeight: 600, fontFamily: UI }}>
                    <Download size={13} color={T.gold} /> {fileKindLabel(fl.kind)}{fl.internal_only ? " (int.)" : ""}</button>)}
                </div>}

                <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  {due && <span style={{ fontSize: 10.5, fontWeight: 700, padding: "2px 8px", borderRadius: 999, background: T.warnSoft, color: T.warn, display: "flex", alignItems: "center", gap: 3 }}><Clock size={11} /> Review due</span>}
                  {isAdmin && <div style={{ display: "flex", gap: 6, marginLeft: "auto" }}>
                    <button onClick={() => setEditing(p)} title="Edit" style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${T.hair}`, background: T.paper, color: T.inkSoft, cursor: "pointer", display: "grid", placeItems: "center" }}><Pencil size={14} /></button>
                    <button onClick={() => toggleStatus(p)} title={p.status === "inactive" ? "Activate" : "Deactivate"} style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${T.hair}`, background: T.paper, color: p.status === "inactive" ? T.ok : T.warn, cursor: "pointer", display: "grid", placeItems: "center" }}>{p.status === "inactive" ? <Check size={14} /> : <EyeOff size={14} />}</button>
                    <button onClick={() => softDelete(p)} title="Delete" style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${T.hair}`, background: T.paper, color: T.bad, cursor: "pointer", display: "grid", placeItems: "center" }}><Trash2 size={14} /></button>
                  </div>}
                </div>
              </div>
            );
          })}
        </div>}

      {!isAdmin && filtered.length > 0 && <div style={{ fontSize: 11.5, color: T.faint, marginTop: 14 }}>Tip: open Ask Amber and ask about any project here — e.g. "What should I say to a client about {filtered[0].name}?"</div>}
      {editing && <ProjectEditor project={editing} user={user} onSaved={() => { setEditing(null); load(); }} onCancel={() => setEditing(null)} />}
    </div>
  );
}

/* ===================== ASK AMBER LOGS (Master Admin) ===================== */
const AILOG_CATS = [["crm", "CRM"], ["dubai_re", "Dubai RE"], ["sales", "Sales"], ["follow_up", "Follow-up"], ["project", "Project"], ["drafting", "Drafting"], ["inappropriate", "Inappropriate"], ["non_work", "Non-work"], ["personal", "Personal"], ["sexual", "Sexual"], ["other", "Other"]];
const aiCatLabel = (c) => (AILOG_CATS.find((x) => x[0] === c) || [c, c || "—"])[1];

function AiLogs({ user }) {
  const [logs, setLogs] = useState(null);
  const [q, setQ] = useState("");
  const [userF, setUserF] = useState("");
  const [mentorF, setMentorF] = useState("");
  const [statusF, setStatusF] = useState("");
  const [flagF, setFlagF] = useState("");
  const [catF, setCatF] = useState("");
  const [range, setRange] = useState("30");
  const [expand, setExpand] = useState({});

  const load = async () => {
    setLogs(null);
    const { data, error } = await supabase.from("ai_logs").select("*").order("created_at", { ascending: false }).limit(800);
    setLogs(error ? [] : (data || []));
  };
  useEffect(() => { load(); }, []);

  const all = logs || [];
  const users = [...new Set(all.map((l) => l.user_name).filter(Boolean))].sort();
  const now = Date.now();
  const cutoff = range === "all" ? 0 : now - Number(range) * 24 * 3600 * 1000;
  const filtered = all.filter((l) => {
    if (cutoff && new Date(l.created_at).getTime() < cutoff) return false;
    if (userF && l.user_name !== userF) return false;
    if (mentorF && l.mentor_id !== mentorF) return false;
    if (statusF && l.status !== statusF) return false;
    if (catF && l.category !== catF) return false;
    if (flagF === "flagged" && !l.flagged) return false;
    if (flagF === "inappropriate" && !l.inappropriate) return false;
    if (flagF === "non_work" && !l.non_work) return false;
    if (flagF === "clean" && l.flagged) return false;
    if (q) { const s = q.toLowerCase(); if (![l.question, l.user_name, l.user_email].some((v) => (v || "").toLowerCase().includes(s))) return false; }
    return true;
  });

  const flaggedCount = filtered.filter((l) => l.flagged).length;
  const when = (t) => new Date(t).toLocaleString("en-GB", { timeZone: "Asia/Dubai", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  const stTone = (s) => s === "refused" ? "bad" : s === "error" ? "warn" : "ok";
  const stLabel = (s) => s === "success" ? "Answered" : s === "refused" ? "Refused" : s === "error" ? "Error" : s;

  const exportCsv = () => {
    const head = ["When", "User", "Email", "Role", "Mentor", "Status", "Category", "Inappropriate", "NonWork", "Model", "TokensIn", "TokensOut", "Question", "Response"];
    const esc = (v) => '"' + String(v == null ? "" : v).replace(/"/g, '""') + '"';
    const rows = filtered.map((l) => [when(l.created_at), l.user_name, l.user_email, l.user_role, l.mentor_name, stLabel(l.status), aiCatLabel(l.category), l.inappropriate ? "yes" : "no", l.non_work ? "yes" : "no", l.model, l.tokens_in, l.tokens_out, l.question, l.full_response || l.response_sum].map(esc).join(","));
    const csv = head.map(esc).join(",") + "\n" + rows.join("\n");
    const blob = new Blob([csv], { type: "text/csv" }); const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "ask-amber-logs.csv"; a.click(); URL.revokeObjectURL(url);
  };

  const sel = { padding: "8px 10px", borderRadius: 9, border: `1px solid ${T.hair}`, background: T.paper, color: T.ink, fontSize: 12.5, fontFamily: UI };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
        <div>
          <div style={{ fontFamily: DISPLAY, fontSize: 23, fontWeight: 800, color: T.ink, display: "flex", alignItems: "center", gap: 10 }}><Sparkle size={21} color={T.gold} /> Ask Amber Logs</div>
          <div style={{ color: T.muted, fontSize: 13, marginTop: 4 }}>Every Ask Amber question across the team — who asked what, and anything flagged as non-work.</div>
        </div>
        <button onClick={exportCsv} disabled={!filtered.length} style={{ ...miniBtn(), opacity: filtered.length ? 1 : .5 }}><Download size={13} /> Export CSV</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 10, marginBottom: 14 }}>
        <Kpi label="Questions (range)" value={filtered.length} />
        <Kpi label="Flagged (range)" value={flaggedCount} tone={flaggedCount ? "bad" : null} />
        <Kpi label="Refused" value={filtered.filter((l) => l.status === "refused").length} />
        <Kpi label="Errors" value={filtered.filter((l) => l.status === "error").length} />
      </div>

      <div style={{ ...card, padding: 12, marginBottom: 14, display: "flex", gap: 9, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: "1 1 200px" }}>
          <Search size={15} color={T.faint} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)" }} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search question, name, email…" style={{ ...sel, paddingLeft: 33, width: "100%", boxSizing: "border-box" }} />
        </div>
        <select value={range} onChange={(e) => setRange(e.target.value)} style={sel}><option value="1">Today</option><option value="7">7 days</option><option value="30">30 days</option><option value="all">All time</option></select>
        <select value={userF} onChange={(e) => setUserF(e.target.value)} style={sel}><option value="">All users</option>{users.map((u) => <option key={u}>{u}</option>)}</select>
        <select value={mentorF} onChange={(e) => setMentorF(e.target.value)} style={sel}><option value="">All mentors</option><option value="ambreen_ai">Ambreen AI</option><option value="saad_ai">Saad AI</option><option value="ibrahim_ai">Ibrahim AI</option></select>
        <select value={statusF} onChange={(e) => setStatusF(e.target.value)} style={sel}><option value="">Any status</option><option value="success">Answered</option><option value="refused">Refused</option><option value="error">Error</option></select>
        <select value={flagF} onChange={(e) => setFlagF(e.target.value)} style={sel}><option value="">All</option><option value="flagged">Flagged</option><option value="inappropriate">Inappropriate</option><option value="non_work">Non-work</option><option value="clean">Clean only</option></select>
        <select value={catF} onChange={(e) => setCatF(e.target.value)} style={sel}><option value="">All categories</option>{AILOG_CATS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
      </div>

      {logs === null ? <div style={{ ...card, padding: 40, textAlign: "center", color: T.muted }}>Loading logs…</div>
        : filtered.length === 0 ? <div style={{ ...card, padding: 40, textAlign: "center", color: T.muted }}>No questions match these filters.</div>
        : <div style={{ display: "grid", gap: 10 }}>
          {filtered.map((l) => {
            const open = expand[l.id];
            return (
              <div key={l.id} style={{ ...card, padding: 14, borderColor: l.flagged ? T.badSoft : T.hair }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <Av name={l.user_name || "User"} size={28} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{l.user_name || "User"} <span style={{ fontWeight: 500, color: T.faint, fontSize: 11 }}>· {roleLabel(l.user_role)}</span></div>
                    <div style={{ fontSize: 11, color: T.muted }}>{l.user_email || "—"}</div>
                  </div>
                  <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    <Chip tone="info">{l.mentor_name || l.mentor_id}</Chip>
                    <Chip tone={stTone(l.status)}>{stLabel(l.status)}</Chip>
                    {l.category && <Chip tone={l.inappropriate || l.non_work ? "bad" : "gold"}>{aiCatLabel(l.category)}</Chip>}
                    <span style={{ fontSize: 10.5, color: T.faint }}>{when(l.created_at)}</span>
                  </div>
                </div>
                <div style={{ fontSize: 13, color: T.ink, marginTop: 9, lineHeight: 1.5 }}><b style={{ color: T.muted, fontWeight: 600 }}>Q:</b> {l.question}</div>
                {open && <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${T.hairSoft}` }}>
                  <div style={{ fontSize: 12.5, color: T.inkSoft, lineHeight: 1.55, whiteSpace: "pre-wrap" }}><b style={{ color: T.muted, fontWeight: 600 }}>A:</b> {l.full_response || l.response_sum || (l.status === "refused" ? "[Refused — " + (l.refusal_reason || "non-work") + "]" : "—")}</div>
                  <div style={{ fontSize: 10.5, color: T.faint, marginTop: 8, display: "flex", gap: 12, flexWrap: "wrap" }}>
                    {l.model && <span>Model: {l.model}</span>}
                    {(l.tokens_in || l.tokens_out) && <span>Tokens: {l.tokens_in || 0} in / {l.tokens_out || 0} out</span>}
                    {l.flagged && <span style={{ color: T.bad }}>Flagged: {l.flag_category}</span>}
                    {l.device && <span title={l.device}>Device: {(l.device || "").slice(0, 40)}…</span>}
                  </div>
                </div>}
                <button onClick={() => setExpand((s) => ({ ...s, [l.id]: !s[l.id] }))} style={{ marginTop: 6, background: "none", border: "none", color: T.gold, fontSize: 11.5, fontWeight: 700, cursor: "pointer", fontFamily: UI }}>{open ? "Hide details" : "Show response & details"}</button>
              </div>
            );
          })}
        </div>}
      <div style={{ fontSize: 11, color: T.faint, marginTop: 12 }}>Newest first · up to 800 recent questions. Flagged rows are highlighted. IP capture requires server-side logging (not enabled); device is the browser agent string.</div>
    </div>
  );
}

/* ============================ DEALS MODULE =============================== */
const DEAL_STATUS = [["draft", "Draft", "muted"], ["submitted", "Submitted", "info"], ["pending_review", "Pending review", "warn"], ["approved", "Approved", "ok"], ["rejected", "Rejected", "bad"], ["needs_correction", "Needs correction", "warn"], ["cancelled", "Cancelled", "muted"]];
const dealStatusMeta = (s) => DEAL_STATUS.find((x) => x[0] === s) || [s, s, "muted"];
const DOC_TYPES = [["kyc", "KYC form"], ["passport", "Passport copy"], ["emirates_id", "Emirates ID"], ["booking_form", "Booking form"], ["spa_contract", "SPA / Contract"], ["tenancy_contract", "Tenancy contract"], ["payment_proof", "Payment proof"], ["buyer_form", "Buyer form"], ["seller_form", "Seller form"], ["landlord_form", "Landlord form"], ["tenant_form", "Tenant form"], ["commission_agreement", "Commission agreement"], ["agency_agreement", "Agency agreement"], ["other", "Other"]];
const docTypeLabel = (t) => (DOC_TYPES.find((x) => x[0] === t) || [t, t])[1];
const numv = (v) => { const n = parseFloat(String(v == null ? "" : v).replace(/[^0-9.]/g, "")); return isNaN(n) ? 0 : n; };
const aed = (n) => "AED " + Math.round(numv(n)).toLocaleString();
const dealNoFmt = (d) => "D" + String(d.deal_no || 0).padStart(3, "0");

// Commission math, shared by form + detail.
function calcDeal(f, agentPct) {
  const pv = numv(f.property_value), cp = numv(f.commission_pct);
  const gross = pv * cp / 100;
  const vat = f.vat_applies ? gross * 0.05 : 0;
  const ext = numv(f.external_split) + numv(f.referral_fee) + numv(f.other_deductions);
  const net = Math.max(0, gross - ext);
  const apct = numv(agentPct);
  const agentComm = net * apct / 100;
  const amberNet = net - agentComm;
  return { gross, vat, ext, net, apct, agentComm, amberNet };
}

const dInp = { width: "100%", padding: "9px 11px", borderRadius: 9, border: `1px solid ${T.hair}`, background: T.paper, color: T.ink, fontSize: 13, fontFamily: UI, boxSizing: "border-box" };
const dLbl = { fontSize: 11, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 5, display: "block" };

function DealSubmit({ lead, user, existing, onClose, onDone }) {
  const [step, setStep] = useState(1);
  const [dealId, setDealId] = useState(existing ? existing.id : null);
  const [docs, setDocs] = useState([]);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState("");
  const [err, setErr] = useState("");
  const [profilePct, setProfilePct] = useState({ sales: null, rental: null });
  const [f, setF] = useState(existing ? {
    deal_type: existing.deal_type || "Sales", transaction_side: existing.transaction_side || "", area: existing.area || "", project: existing.project || "",
    developer: existing.developer || "", property_type: existing.property_type || "", unit_no: existing.unit_no || "", bedrooms: existing.bedrooms || "",
    property_value: existing.property_value || "", ready_offplan: existing.ready_offplan || "", commission_pct: existing.commission_pct || "2",
    vat_applies: !!existing.vat_amount, external_split: existing.external_split || "", referral_fee: existing.referral_fee || "", other_deductions: existing.other_deductions || "",
    sole_agent: existing.sole_agent !== false, participants: existing.participants || [],
  } : {
    deal_type: "Sales", transaction_side: "", area: lead.area || "", project: lead.project || "", developer: lead.developer || "",
    property_type: lead.property_type || "", unit_no: "", bedrooms: "", property_value: lead.deal_value || "", ready_offplan: lead.ready_offplan || "",
    commission_pct: "2", vat_applies: false, external_split: "", referral_fee: "", other_deductions: "", sole_agent: true, participants: [],
  });
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));

  useEffect(() => { (async () => {
    const { data } = await supabase.from("profiles").select("sales_commission_pct, rental_commission_pct").eq("id", user.id).single();
    if (data) setProfilePct({ sales: data.sales_commission_pct, rental: data.rental_commission_pct });
  })(); }, []);
  useEffect(() => { if (dealId) loadDocs(dealId); }, [dealId]);
  const loadDocs = async (id) => { const { data } = await supabase.from("deal_documents").select("*").eq("deal_id", id).order("created_at", { ascending: true }); setDocs(data || []); };

  const agentPct = f.deal_type === "Rental" ? profilePct.rental : profilePct.sales;
  const c = calcDeal(f, agentPct);

  const buildRow = (status) => ({
    lead_id: lead.id, agent_id: user.id, created_by: user.id, client_name: lead.client_name, lead_source: lead.source || null,
    deal_type: f.deal_type, transaction_side: f.transaction_side || null, area: f.area || null, project: f.project || null, developer: f.developer || null,
    property_type: f.property_type || null, unit_no: f.unit_no || null, bedrooms: f.bedrooms || null, property_value: numv(f.property_value) || null,
    ready_offplan: f.ready_offplan || null, commission_pct: numv(f.commission_pct) || null, gross_commission: c.gross || null, vat_amount: c.vat || null,
    net_commission: c.net || null, agent_commission_pct: agentPct == null ? null : numv(agentPct), agent_commission: c.agentComm || null,
    company_share: c.amberNet || null, external_split: numv(f.external_split) || null, referral_fee: numv(f.referral_fee) || null,
    other_deductions: numv(f.other_deductions) || null, final_net: c.amberNet || null, sole_agent: !!f.sole_agent, participants: f.participants || [],
    status, updated_at: new Date().toISOString(),
  });

  const ensureDraft = async () => {
    if (dealId) { await supabase.from("deals").update(buildRow("draft")).eq("id", dealId); return dealId; }
    const { data, error } = await supabase.from("deals").insert(buildRow("draft")).select("id").single();
    if (error) throw error;
    setDealId(data.id);
    await supabase.from("deal_activity").insert({ deal_id: data.id, actor_id: user.id, action: "deal_created", detail: {} });
    await supabase.from("admin_audit").insert({ action: "deal_draft_created", performed_by: user.id, detail: lead.client_name });
    return data.id;
  };

  const goStep = async (n) => {
    setErr("");
    if (n === 4 && !dealId) { // need a deal id to attach documents
      setBusy(true);
      try { await ensureDraft(); } catch (e) { setErr("Could not start the deal: " + (e.message || "")); setBusy(false); return; }
      setBusy(false);
    }
    setStep(n);
  };

  const safeName = (s) => String(s).replace(/[^a-zA-Z0-9._-]/g, "_");
  const uploadDoc = async (docType, file) => {
    if (!file) return; setUploading(docType); setErr("");
    try {
      const id = await ensureDraft();
      const path = id + "/" + docType + "-" + Date.now() + "-" + safeName(file.name);
      const { error } = await supabase.storage.from("deal-docs").upload(path, file, { upsert: false });
      if (error) throw error;
      await supabase.from("deal_documents").insert({ deal_id: id, doc_type: docType, file_name: file.name, storage_path: path, uploaded_by: user.id });
      await supabase.from("deal_activity").insert({ deal_id: id, actor_id: user.id, action: "document_uploaded", detail: { doc: docTypeLabel(docType), file: file.name } });
      loadDocs(id);
    } catch (e) { setErr("Upload failed: " + (e.message || "") + " — If this persists, ask Master Admin to create a PRIVATE Storage bucket named 'deal-docs'."); }
    finally { setUploading(""); }
  };
  const delDoc = async (d) => {
    if (d.storage_path) { try { await supabase.storage.from("deal-docs").remove([d.storage_path]); } catch (e) {} }
    await supabase.from("deal_documents").delete().eq("id", d.id);
    loadDocs(dealId);
  };

  const has = (type) => docs.some((d) => d.doc_type === type);
  const missingDocs = () => {
    const m = []; const isDirect = f.transaction_side === "Direct";
    if (!has("kyc")) m.push("Please upload KYC form before submitting.");
    if (!has("passport") && !has("emirates_id")) m.push("Please upload Passport or Emirates ID before submitting.");
    if (isDirect) { if (!has("booking_form")) m.push("Please upload Booking Form before submitting."); }
    else if (f.deal_type === "Sales") { if (!has("booking_form") && !has("spa_contract")) m.push("Please upload Booking Form or Contract (SPA) before submitting."); }
    else if (f.deal_type === "Rental") { if (!has("tenancy_contract") && !has("booking_form")) m.push("Please upload Tenancy Contract or Booking Form before submitting."); }
    return m;
  };

  const submit = async () => {
    setBusy(true); setErr("");
    try {
      const id = await ensureDraft();
      const miss = missingDocs();
      if (miss.length) { setErr(miss[0]); setStep(4); setBusy(false); return; }
      if (!numv(f.property_value)) { setErr("Please enter the property / transaction value."); setStep(1); setBusy(false); return; }
      const row = buildRow("submitted"); row.submitted_at = new Date().toISOString();
      const { error } = await supabase.from("deals").update(row).eq("id", id);
      if (error) throw error;
      await supabase.from("deal_activity").insert({ deal_id: id, actor_id: user.id, action: "submitted", detail: { value: numv(f.property_value) } });
      await supabase.from("notifications").insert({ user_id: null, kind: "deal", title: "New deal submitted for approval", body: `${user.name} submitted a ${f.deal_type} deal for ${lead.client_name} (${aed(f.property_value)}).`, link_screen: "deals" });
      await supabase.from("admin_audit").insert({ action: "deal_submitted", performed_by: user.id, new_value: { value: numv(f.property_value), type: f.deal_type }, detail: lead.client_name });
      onDone && onDone();
    } catch (e) { setErr("Submit failed: " + (e.message || "")); }
    finally { setBusy(false); }
  };

  const addPart = () => setF((s) => ({ ...s, sole_agent: false, participants: [...s.participants, { name: "", internal: true, role: "Co-agent", split_pct: "", split_amount: "", notes: "" }] }));
  const setPart = (i, k, v) => setF((s) => { const p = [...s.participants]; p[i] = { ...p[i], [k]: v }; return { ...s, participants: p }; });
  const rmPart = (i) => setF((s) => { const p = s.participants.filter((_, j) => j !== i); return { ...s, participants: p, sole_agent: p.length === 0 }; });

  const STEPS = ["Property", "Client", "Commission", "Documents", "Review"];
  const Stepper = () => <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
    {STEPS.map((s, i) => <button key={s} onClick={() => goStep(i + 1)} style={{ flex: "1 1 auto", minWidth: 64, padding: "7px 6px", borderRadius: 8, border: `1px solid ${step === i + 1 ? T.gold : T.hair}`, background: step === i + 1 ? T.goldSoft : (step > i + 1 ? T.okSoft : T.paper), color: step === i + 1 ? T.gold : (step > i + 1 ? T.ok : T.muted), fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: UI }}>{i + 1}. {s}</button>)}
  </div>;
  const Money = ({ k, v, strong }) => <div style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: `1px solid ${T.hairSoft}`, fontSize: 13 }}>
    <span style={{ color: T.muted }}>{k}</span><span style={{ fontWeight: strong ? 800 : 600, color: strong ? T.gold : T.ink }}>{v}</span></div>;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,15,25,.55)", zIndex: 90, display: "grid", placeItems: "center", padding: 16 }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ ...card, width: "min(680px, 96vw)", maxHeight: "94vh", overflowY: "auto", padding: 22 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <div style={{ fontFamily: DISPLAY, fontSize: 19, fontWeight: 800, color: T.ink }}>Close deal — {lead.client_name}</div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: T.muted, cursor: "pointer", padding: 4 }}><X size={18} /></button>
        </div>
        <div style={{ fontSize: 12, color: T.muted, marginBottom: 14 }}>Submitting sends this for Admin approval — it won't be a final closed deal until approved.</div>
        <Stepper />

        {step === 1 && <div>
          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            {["Sales", "Rental"].map((t) => <button key={t} onClick={() => set("deal_type", t)} style={{ flex: 1, padding: "11px", borderRadius: 10, border: `1px solid ${f.deal_type === t ? T.gold : T.hair}`, background: f.deal_type === t ? T.goldSoft : T.paper, color: f.deal_type === t ? T.gold : T.ink, fontWeight: 700, cursor: "pointer", fontFamily: UI }}>{t} deal</button>)}
          </div>
          <div style={{ marginBottom: 12 }}><label style={dLbl}>Transaction side</label>
            <select value={f.transaction_side} onChange={(e) => set("transaction_side", e.target.value)} style={dInp}><option value="">—</option>{["Buyer", "Seller", "Landlord", "Tenant", "Direct", "Co-broker"].map((o) => <option key={o}>{o}</option>)}</select></div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
            <div style={{ flex: "1 1 180px" }}><label style={dLbl}>Location / area *</label><input value={f.area} onChange={(e) => set("area", e.target.value)} style={dInp} /></div>
            <div style={{ flex: "1 1 180px" }}><label style={dLbl}>Project *</label><input value={f.project} onChange={(e) => set("project", e.target.value)} style={dInp} /></div>
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
            <div style={{ flex: "1 1 180px" }}><label style={dLbl}>Developer</label><input value={f.developer} onChange={(e) => set("developer", e.target.value)} style={dInp} /></div>
            <div style={{ flex: "1 1 140px" }}><label style={dLbl}>Property type *</label><select value={f.property_type} onChange={(e) => set("property_type", e.target.value)} style={dInp}><option value="">—</option>{["Apartment", "Villa", "Townhouse", "Penthouse", "Plot", "Commercial", "Other"].map((o) => <option key={o}>{o}</option>)}</select></div>
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
            <div style={{ flex: "1 1 120px" }}><label style={dLbl}>Unit no.</label><input value={f.unit_no} onChange={(e) => set("unit_no", e.target.value)} style={dInp} /></div>
            <div style={{ flex: "1 1 120px" }}><label style={dLbl}>Bedrooms</label><input value={f.bedrooms} onChange={(e) => set("bedrooms", e.target.value)} style={dInp} /></div>
            <div style={{ flex: "1 1 120px" }}><label style={dLbl}>Ready / Off-plan</label><select value={f.ready_offplan} onChange={(e) => set("ready_offplan", e.target.value)} style={dInp}><option value="">—</option><option>Ready</option><option>Off-plan</option></select></div>
          </div>
          <div style={{ marginBottom: 4 }}><label style={dLbl}>Property / transaction value (AED) *</label><input value={f.property_value} onChange={(e) => set("property_value", e.target.value)} style={dInp} placeholder="e.g. 2800000" /></div>
        </div>}

        {step === 2 && <div>
          <div style={{ ...card, padding: 14, background: T.bone }}>
            <Money k="Client" v={lead.client_name} />
            <Money k="Lead ID" v={lead.lead_no ? "L" + String(lead.lead_no).padStart(3, "0") : (lead.lead_code || "—")} />
            <Money k="Assigned agent" v={user.name} />
            <Money k="Lead source" v={lead.source || "—"} />
            <Money k="Current status" v={lead.is_open ? "Open" : (lead.status || "—")} />
          </div>
          <div style={{ marginTop: 14 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <label style={{ ...dLbl, marginBottom: 0 }}>Other agents involved?</label>
              <button onClick={addPart} style={{ ...miniBtn(), padding: "6px 11px", fontSize: 11.5 }}><Plus size={12} /> Add participant</button>
            </div>
            {f.participants.length === 0 ? <div style={{ fontSize: 12.5, color: T.muted, padding: "8px 0" }}>None — you are the sole closing agent.</div> :
              f.participants.map((p, i) => <div key={i} style={{ ...card, padding: 12, marginBottom: 8 }}>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
                  <input value={p.name} onChange={(e) => setPart(i, "name", e.target.value)} placeholder="Agent / broker name" style={{ ...dInp, flex: "1 1 150px" }} />
                  <select value={p.internal ? "internal" : "external"} onChange={(e) => setPart(i, "internal", e.target.value === "internal")} style={{ ...dInp, width: "auto" }}><option value="internal">Internal</option><option value="external">External</option></select>
                  <button onClick={() => rmPart(i)} style={{ background: "none", border: "none", color: T.bad, cursor: "pointer", padding: 6 }}><Trash2 size={14} /></button>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <input value={p.role} onChange={(e) => setPart(i, "role", e.target.value)} placeholder="Role" style={{ ...dInp, flex: "1 1 110px" }} />
                  <input value={p.split_pct} onChange={(e) => setPart(i, "split_pct", e.target.value)} placeholder="Split %" style={{ ...dInp, flex: "1 1 80px" }} />
                  <input value={p.split_amount} onChange={(e) => setPart(i, "split_amount", e.target.value)} placeholder="Split AED" style={{ ...dInp, flex: "1 1 100px" }} />
                </div>
              </div>)}
          </div>
        </div>}

        {step === 3 && <div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
            <div style={{ flex: "1 1 150px" }}><label style={dLbl}>Property value (AED)</label><input value={f.property_value} onChange={(e) => set("property_value", e.target.value)} style={dInp} /></div>
            <div style={{ flex: "1 1 120px" }}><label style={dLbl}>Commission %</label><input value={f.commission_pct} onChange={(e) => set("commission_pct", e.target.value)} style={dInp} /></div>
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
            <div style={{ flex: "1 1 120px" }}><label style={dLbl}>External / co-broker split (AED)</label><input value={f.external_split} onChange={(e) => set("external_split", e.target.value)} style={dInp} /></div>
            <div style={{ flex: "1 1 110px" }}><label style={dLbl}>Referral fee (AED)</label><input value={f.referral_fee} onChange={(e) => set("referral_fee", e.target.value)} style={dInp} /></div>
            <div style={{ flex: "1 1 110px" }}><label style={dLbl}>Other deductions (AED)</label><input value={f.other_deductions} onChange={(e) => set("other_deductions", e.target.value)} style={dInp} /></div>
          </div>
          <button onClick={() => set("vat_applies", !f.vat_applies)} style={{ marginBottom: 12, padding: "8px 12px", borderRadius: 9, border: `1px solid ${f.vat_applies ? T.gold : T.hair}`, background: f.vat_applies ? T.goldSoft : T.paper, color: f.vat_applies ? T.gold : T.muted, cursor: "pointer", fontSize: 12.5, fontWeight: 600, fontFamily: UI }}>VAT applies (5%): {f.vat_applies ? "Yes" : "No"}</button>
          <div style={{ ...card, padding: 14, background: T.bone }}>
            <Money k="Gross commission" v={aed(c.gross)} />
            {f.vat_applies && <Money k="VAT (5%, informational)" v={aed(c.vat)} />}
            <Money k="Less external / deductions" v={"− " + aed(c.ext)} />
            <Money k="Net commission to Amber Homes" v={aed(c.net)} />
            <Money k={"Your commission (" + (agentPct == null ? "set by admin" : agentPct + "%") + ")"} v={agentPct == null ? "—" : aed(c.agentComm)} />
            <Money k="Final net to Amber Homes" v={aed(c.amberNet)} strong />
          </div>
          <div style={{ fontSize: 11, color: T.faint, marginTop: 8, lineHeight: 1.5 }}>Your commission % is set by Admin on your profile{agentPct == null ? " (not set yet — Admin will confirm on approval)" : ""}. You can't change it here; Admin can adjust the final commission during review.</div>
        </div>}

        {step === 4 && <div>
          <div style={{ fontSize: 12.5, color: T.muted, marginBottom: 12 }}>Upload required documents. Stored privately — only you and Admin can open them.</div>
          {!dealId ? <div style={{ ...card, padding: 16, textAlign: "center", color: T.muted }}>Preparing upload…</div> : <>
            {docs.length > 0 && <div style={{ ...card, padding: 12, marginBottom: 12 }}>
              {docs.map((d) => <div key={d.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: `1px solid ${T.hairSoft}`, fontSize: 12.5 }}>
                <FileText size={14} color={T.gold} /><span style={{ fontWeight: 600 }}>{docTypeLabel(d.doc_type)}</span><span style={{ color: T.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.file_name}</span>
                <button onClick={() => delDoc(d)} style={{ marginLeft: "auto", background: "none", border: "none", color: T.bad, cursor: "pointer", padding: 2 }}><Trash2 size={13} /></button>
              </div>)}
            </div>}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))", gap: 8 }}>
              {DOC_TYPES.map(([v, l]) => <label key={v} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 11px", borderRadius: 9, border: `1px dashed ${has(v) ? T.ok : T.hair}`, background: has(v) ? T.okSoft : T.paper, color: has(v) ? T.ok : T.inkSoft, cursor: uploading ? "default" : "pointer", fontSize: 11.5, fontWeight: 600 }}>
                {has(v) ? <Check size={13} /> : <Upload size={13} />} {uploading === v ? "Uploading…" : l}
                <input type="file" disabled={!!uploading} onChange={(e) => { if (e.target.files[0]) uploadDoc(v, e.target.files[0]); e.target.value = ""; }} style={{ display: "none" }} />
              </label>)}
            </div>
            <div style={{ fontSize: 11.5, color: T.faint, marginTop: 12, lineHeight: 1.5 }}>Required: KYC + (Passport or Emirates ID) + {f.transaction_side === "Direct" ? "Booking form" : f.deal_type === "Sales" ? "Booking form or SPA/Contract" : "Tenancy contract or Booking form"}.</div>
          </>}
        </div>}

        {step === 5 && <div>
          <div style={{ ...card, padding: 14, marginBottom: 12 }}>
            <Money k="Deal type" v={f.deal_type + (f.transaction_side ? " · " + f.transaction_side : "")} />
            <Money k="Property" v={[f.project, f.area, f.property_type].filter(Boolean).join(" · ") || "—"} />
            <Money k="Value" v={aed(f.property_value)} />
            <Money k="Gross commission" v={aed(c.gross)} />
            <Money k="Net to Amber Homes" v={aed(c.net)} />
            <Money k="Your commission" v={agentPct == null ? "set by admin" : aed(c.agentComm)} />
            <Money k="Documents uploaded" v={docs.length + " file" + (docs.length === 1 ? "" : "s")} />
          </div>
          {missingDocs().length > 0 && <div style={{ ...card, padding: 12, marginBottom: 12, borderColor: T.badSoft, color: T.bad, fontSize: 12.5 }}>{missingDocs()[0]}</div>}
        </div>}

        {err && <div style={{ background: T.badSoft, color: T.bad, padding: "9px 12px", borderRadius: 9, fontSize: 12.5, margin: "12px 0" }}>{err}</div>}
        <div style={{ display: "flex", gap: 10, justifyContent: "space-between", marginTop: 16, flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 8 }}>
            {step > 1 && <button onClick={() => goStep(step - 1)} style={{ padding: "10px 16px", borderRadius: 9, border: `1px solid ${T.hair}`, background: T.paper, color: T.ink, cursor: "pointer", fontWeight: 600, fontFamily: UI }}>Back</button>}
            {dealId && <button onClick={async () => { try { await ensureDraft(); onDone && onDone(); } catch (e) { setErr("Could not save draft."); } }} style={{ padding: "10px 14px", borderRadius: 9, border: `1px solid ${T.hair}`, background: T.paper, color: T.muted, cursor: "pointer", fontWeight: 600, fontFamily: UI, fontSize: 12.5 }}>Save draft</button>}
          </div>
          {step < 5 ? <button onClick={() => goStep(step + 1)} disabled={busy} style={{ padding: "10px 20px", borderRadius: 9, border: "none", background: T.btnBg, color: T.btnFg, cursor: "pointer", fontWeight: 700, fontFamily: UI, opacity: busy ? .6 : 1 }}>{busy ? "…" : "Next"}</button>
            : <button onClick={submit} disabled={busy} style={{ padding: "10px 22px", borderRadius: 9, border: "none", background: T.btnBg, color: T.btnFg, cursor: "pointer", fontWeight: 700, fontFamily: UI, display: "flex", alignItems: "center", gap: 7, opacity: busy ? .6 : 1 }}><Check size={15} /> {busy ? "Submitting…" : "Submit for approval"}</button>}
        </div>
      </div>
    </div>
  );
}

function DealDetail({ dealId, user, go }) {
  const isAdmin = user && (user.role === "master_admin" || user.role === "admin");
  const [deal, setDeal] = useState(null);
  const [docs, setDocs] = useState([]);
  const [acts, setActs] = useState([]);
  const [err, setErr] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [ov, setOv] = useState(null); // commission override buffer

  const load = async () => {
    const { data: d, error } = await supabase.from("deals").select("*").eq("id", dealId).single();
    if (error || !d) { setErr("load"); return; }
    setDeal(d); setNote(d.admin_notes || "");
    const [{ data: dd }, { data: aa }] = await Promise.all([
      supabase.from("deal_documents").select("*").eq("deal_id", dealId).order("created_at"),
      supabase.from("deal_activity").select("*, actor:profiles!deal_activity_actor_id_fkey(full_name, role)").eq("deal_id", dealId).order("created_at", { ascending: false }).limit(60),
    ]);
    setDocs(dd || []); setActs(aa || []);
  };
  useEffect(() => { load(); }, [dealId]);

  if (err === "load") return <div style={{ ...card, padding: 30, textAlign: "center" }}><div style={{ fontWeight: 700, color: T.bad }}>Unable to load this deal.</div><button onClick={() => go("deals")} style={{ ...miniBtn(), marginTop: 12 }}>Back to deals</button></div>;
  if (!deal) return <div style={{ ...card, padding: 40, textAlign: "center", color: T.muted }}>Loading deal…</div>;
  const sm = dealStatusMeta(deal.status);
  const when = (t) => new Date(t).toLocaleString("en-GB", { timeZone: "Asia/Dubai", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

  const downloadDoc = async (d) => {
    try {
      if (d.storage_path) {
        const { data, error } = await supabase.storage.from("deal-docs").createSignedUrl(d.storage_path, 120);
        if (error) throw error;
        await supabase.from("deal_activity").insert({ deal_id: deal.id, actor_id: user.id, action: "document_downloaded", detail: { doc: docTypeLabel(d.doc_type) } });
        window.open(data.signedUrl, "_blank");
      } else if (d.url) { window.open(d.url, "_blank"); }
    } catch (e) { setErr("Could not open document: " + (e.message || "")); }
  };

  const decide = async (status) => {
    setBusy(true); setErr("");
    const upd = { status, reviewer_id: user.id, decided_at: new Date().toISOString(), admin_notes: note || null, updated_at: new Date().toISOString() };
    if (status === "approved") { upd.accounts_status = "Pending Accounts"; }
    if (status === "needs_correction") { upd.correction_note = note || null; }
    if (status === "rejected") { upd.correction_note = note || null; }
    const { error } = await supabase.from("deals").update(upd).eq("id", deal.id);
    if (error) { setErr("Action failed: " + error.message); setBusy(false); return; }
    await supabase.from("deal_activity").insert({ deal_id: deal.id, actor_id: user.id, action: status === "approved" ? "approved" : status === "rejected" ? "rejected" : "correction_requested", detail: { note: note || null } });
    await supabase.from("admin_audit").insert({ action: "deal_" + (status === "needs_correction" ? "correction_requested" : status), performed_by: user.id, affected_user: deal.agent_id, new_value: { status }, detail: deal.client_name });
    if (status === "approved" && deal.lead_id) {
      await supabase.from("leads").update({ status: "Closed Won", is_open: false }).eq("id", deal.lead_id);
      await supabase.from("lead_activity").insert({ lead_id: deal.lead_id, actor_id: user.id, action: "status_change", detail: { to: "Closed Won", via: "deal " + dealNoFmt(deal) } });
    }
    const titles = { approved: "Deal approved", rejected: "Deal rejected", needs_correction: "Deal needs correction" };
    await supabase.from("notifications").insert({ user_id: deal.agent_id, kind: "deal", title: titles[status],
      body: dealNoFmt(deal) + " · " + deal.client_name + (note ? " — " + note : ""), link_screen: "deals" });
    load(); setBusy(false);
  };

  const saveOverride = async () => {
    setBusy(true);
    const upd = { agent_commission_pct: numv(ov.agent_commission_pct), agent_commission: numv(ov.agent_commission), final_net: numv(ov.final_net), company_share: numv(ov.final_net), updated_at: new Date().toISOString() };
    const { error } = await supabase.from("deals").update(upd).eq("id", deal.id);
    if (!error) {
      await supabase.from("deal_activity").insert({ deal_id: deal.id, actor_id: user.id, action: "commission_changed", detail: { agent_pct: upd.agent_commission_pct, agent: upd.agent_commission, net: upd.final_net } });
      await supabase.from("admin_audit").insert({ action: "deal_commission_changed", performed_by: user.id, old_value: { agent: deal.agent_commission, net: deal.final_net }, new_value: { agent: upd.agent_commission, net: upd.final_net }, detail: deal.client_name });
    }
    setOv(null); load(); setBusy(false);
  };

  const Money = ({ k, v, strong }) => <div style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: `1px solid ${T.hairSoft}`, fontSize: 13 }}>
    <span style={{ color: T.muted }}>{k}</span><span style={{ fontWeight: strong ? 800 : 600, color: strong ? T.gold : T.ink }}>{v}</span></div>;
  const canDecide = isAdmin && ["submitted", "pending_review", "needs_correction"].includes(deal.status);

  return <div>
    <button onClick={() => go("deals")} style={{ ...miniBtn(), marginBottom: 12 }}>← Back to deals</button>
    <div style={{ ...card, padding: "18px 20px", background: T.hero, border: "none", boxShadow: T.shadowLg }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <div>
          <div style={{ fontFamily: DISPLAY, fontSize: 21, color: "#fff" }}>{deal.client_name} <span style={{ fontSize: 13, color: T.goldBright }}>{dealNoFmt(deal)}</span></div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,.7)", marginTop: 3 }}>{[deal.deal_type, deal.project, deal.area].filter(Boolean).join(" · ")}</div>
        </div>
        <Chip tone={sm[2]}>{sm[1]}</Chip>
      </div>
    </div>

    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 14, marginTop: 14 }}>
      <div style={{ ...card, padding: 16 }}>
        <SectionMini>Property details</SectionMini>
        <Money k="Location" v={deal.area || "—"} /><Money k="Project" v={deal.project || "—"} /><Money k="Developer" v={deal.developer || "—"} />
        <Money k="Type" v={deal.property_type || "—"} /><Money k="Unit" v={deal.unit_no || "—"} /><Money k="Value" v={aed(deal.property_value)} />
        <Money k="Sales / Rental" v={deal.deal_type || "—"} /><Money k="Ready / Off-plan" v={deal.ready_offplan || "—"} />
      </div>
      <div style={{ ...card, padding: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <SectionMini>Commission</SectionMini>
          {isAdmin && !ov && <button onClick={() => setOv({ agent_commission_pct: deal.agent_commission_pct || "", agent_commission: deal.agent_commission || "", final_net: deal.final_net || "" })} style={{ ...miniBtn(), padding: "4px 9px", fontSize: 10.5 }}>Override</button>}
        </div>
        <Money k="Property value" v={aed(deal.property_value)} /><Money k={"Commission % (" + (deal.commission_pct || 0) + "%)"} v={aed(deal.gross_commission)} />
        {deal.vat_amount ? <Money k="VAT (5%)" v={aed(deal.vat_amount)} /> : null}
        {deal.external_split ? <Money k="External split" v={"− " + aed(deal.external_split)} /> : null}
        <Money k="Net to Amber Homes" v={aed(deal.net_commission)} />
        {ov ? <div style={{ marginTop: 8 }}>
          <label style={dLbl}>Agent %</label><input value={ov.agent_commission_pct} onChange={(e) => setOv({ ...ov, agent_commission_pct: e.target.value })} style={dInp} />
          <label style={{ ...dLbl, marginTop: 8 }}>Agent commission (AED)</label><input value={ov.agent_commission} onChange={(e) => setOv({ ...ov, agent_commission: e.target.value })} style={dInp} />
          <label style={{ ...dLbl, marginTop: 8 }}>Final net to Amber (AED)</label><input value={ov.final_net} onChange={(e) => setOv({ ...ov, final_net: e.target.value })} style={dInp} />
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}><button onClick={saveOverride} disabled={busy} style={{ background: T.btnBg, color: T.btnFg, border: "none", borderRadius: 8, padding: "8px 14px", fontWeight: 700, cursor: "pointer", fontFamily: UI, fontSize: 12.5 }}>Save</button><button onClick={() => setOv(null)} style={{ ...miniBtn() }}>Cancel</button></div>
        </div> : <>
          <Money k={"Agent commission (" + (deal.agent_commission_pct == null ? "—" : deal.agent_commission_pct + "%") + ")"} v={deal.agent_commission == null ? "set by admin" : aed(deal.agent_commission)} />
          <Money k="Final net to Amber Homes" v={aed(deal.final_net)} strong />
        </>}
      </div>
    </div>

    {(deal.participants && deal.participants.length > 0) ? <><SectionTitle>Participants</SectionTitle><div style={{ ...card, padding: 16 }}>
      <div style={{ fontSize: 12.5, marginBottom: 6 }}>Closing agent: <b>{deal.client_name ? (deal.agent_name || "Submitting agent") : ""}</b></div>
      {deal.participants.map((p, i) => <div key={i} style={{ display: "flex", gap: 10, padding: "6px 0", borderBottom: `1px solid ${T.hairSoft}`, fontSize: 12.5, flexWrap: "wrap" }}>
        <span style={{ fontWeight: 600 }}>{p.name || "—"}</span><Chip tone={p.internal ? "info" : "warn"}>{p.internal ? "Internal" : "External"}</Chip><span style={{ color: T.muted }}>{p.role}</span>
        {p.split_pct && <span style={{ color: T.muted }}>{p.split_pct}%</span>}{p.split_amount && <span style={{ color: T.muted }}>{aed(p.split_amount)}</span>}</div>)}
    </div></> : null}

    <SectionTitle>Documents</SectionTitle>
    <div style={{ ...card, padding: 16 }}>
      {docs.length === 0 ? <div style={{ fontSize: 12.5, color: T.muted }}>No documents uploaded.</div> :
        docs.map((d) => <div key={d.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", borderBottom: `1px solid ${T.hairSoft}`, fontSize: 12.5 }}>
          <FileText size={15} color={T.gold} /><span style={{ fontWeight: 600 }}>{docTypeLabel(d.doc_type)}</span>
          <span style={{ color: T.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.file_name}</span>
          <button onClick={() => downloadDoc(d)} style={{ marginLeft: "auto", ...miniBtn(), padding: "5px 10px", fontSize: 11 }}><Download size={12} /> Open</button>
        </div>)}
      <div style={{ fontSize: 11, color: T.faint, marginTop: 10 }}>Required: KYC + Passport/Emirates ID + {deal.transaction_side === "Direct" ? "Booking form" : deal.deal_type === "Rental" ? "Tenancy/Booking" : "Booking/SPA"}.</div>
    </div>

    {isAdmin && <><SectionTitle>Admin review</SectionTitle><div style={{ ...card, padding: 16 }}>
      <label style={dLbl}>Admin notes / reason</label>
      <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} style={{ ...dInp, resize: "vertical" }} placeholder="Notes shown to the agent on correction/rejection" />
      {canDecide ? <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
        <button onClick={() => decide("approved")} disabled={busy} style={{ background: T.ok, color: "#fff", border: "none", borderRadius: 9, padding: "10px 18px", fontWeight: 700, cursor: "pointer", fontFamily: UI, display: "flex", alignItems: "center", gap: 6 }}><Check size={15} /> Approve</button>
        <button onClick={() => decide("needs_correction")} disabled={busy} style={{ background: T.warnSoft, color: T.warn, border: `1px solid ${T.warn}`, borderRadius: 9, padding: "10px 16px", fontWeight: 700, cursor: "pointer", fontFamily: UI }}>Request correction</button>
        <button onClick={() => decide("rejected")} disabled={busy} style={{ background: T.badSoft, color: T.bad, border: `1px solid ${T.bad}`, borderRadius: 9, padding: "10px 16px", fontWeight: 700, cursor: "pointer", fontFamily: UI }}>Reject</button>
      </div> : <div style={{ fontSize: 12, color: T.muted, marginTop: 10 }}>This deal is {sm[1].toLowerCase()}. {deal.status === "approved" ? "Accounts status: " + (deal.accounts_status || "—") + "." : ""}</div>}
    </div></>}

    <SectionTitle>Activity timeline</SectionTitle>
    <div style={{ ...card, padding: 16 }}>
      {acts.length === 0 ? <div style={{ color: T.muted, fontSize: 12.5 }}>No activity yet.</div> :
        acts.map((t, i) => <div key={t.id} style={{ display: "flex", gap: 11, paddingBottom: i === acts.length - 1 ? 0 : 14 }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}><div style={{ width: 9, height: 9, borderRadius: 9, background: T.gold, marginTop: 3 }} />{i !== acts.length - 1 && <div style={{ width: 2, flex: 1, background: T.hairSoft, marginTop: 3 }} />}</div>
          <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 600, textTransform: "capitalize" }}>{String(t.action).replace(/_/g, " ")}{t.detail && t.detail.note ? ' — "' + t.detail.note + '"' : ""}</div>
            <div style={{ fontSize: 11, color: T.muted, marginTop: 1 }}>{t.actor?.full_name || "System"} · {when(t.created_at)}</div></div>
        </div>)}
    </div>
    {err && <div style={{ ...card, padding: 12, marginTop: 12, borderColor: T.badSoft, color: T.bad, fontSize: 12.5 }}>{err}</div>}
  </div>;
}

function CommissionSettings({ user }) {
  const [agents, setAgents] = useState(null);
  const [edit, setEdit] = useState({});
  const [saved, setSaved] = useState("");
  const load = async () => {
    const { data } = await supabase.from("profiles").select("id, full_name, role, active, sales_commission_pct, rental_commission_pct, company_split_pct, commission_notes, commission_active").order("full_name");
    setAgents((data || []).filter((a) => ["agent", "sales_manager", "admin"].includes(a.role)));
  };
  useEffect(() => { load(); }, []);
  const save = async (a) => {
    const e = edit[a.id] || {};
    const upd = { sales_commission_pct: e.sales == null ? a.sales_commission_pct : numv(e.sales), rental_commission_pct: e.rental == null ? a.rental_commission_pct : numv(e.rental),
      company_split_pct: e.company == null ? a.company_split_pct : numv(e.company), commission_notes: e.notes == null ? a.commission_notes : e.notes };
    const { error } = await supabase.from("profiles").update(upd).eq("id", a.id);
    if (!error) { await supabase.from("admin_audit").insert({ action: "agent_commission_set", performed_by: user.id, affected_user: a.id, new_value: upd, detail: a.full_name }); setSaved(a.id); setTimeout(() => setSaved(""), 1500); load(); }
  };
  if (agents === null) return <div style={{ ...card, padding: 30, textAlign: "center", color: T.muted }}>Loading agents…</div>;
  return <div>
    <div style={{ fontSize: 12.5, color: T.muted, marginBottom: 12 }}>Set each agent's share of the net company commission. Agents can't see or change these — they're used automatically when a deal is submitted.</div>
    <div style={{ display: "grid", gap: 10 }}>
      {agents.map((a) => { const e = edit[a.id] || {}; const setE = (k, v) => setEdit((s) => ({ ...s, [a.id]: { ...s[a.id], [k]: v } }));
        return <div key={a.id} style={{ ...card, padding: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}><Av name={a.full_name} size={28} /><div style={{ fontWeight: 700, fontSize: 13.5 }}>{a.full_name}</div><Chip tone="info">{roleLabel(a.role)}</Chip>{saved === a.id && <span style={{ color: T.ok, fontSize: 11.5, fontWeight: 700 }}>Saved ✓</span>}</div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 110px" }}><label style={dLbl}>Sales %</label><input value={e.sales != null ? e.sales : (a.sales_commission_pct ?? "")} onChange={(ev) => setE("sales", ev.target.value)} style={dInp} placeholder="e.g. 50" /></div>
            <div style={{ flex: "1 1 110px" }}><label style={dLbl}>Rental %</label><input value={e.rental != null ? e.rental : (a.rental_commission_pct ?? "")} onChange={(ev) => setE("rental", ev.target.value)} style={dInp} placeholder="e.g. 45" /></div>
            <div style={{ flex: "1 1 110px" }}><label style={dLbl}>Company split %</label><input value={e.company != null ? e.company : (a.company_split_pct ?? "")} onChange={(ev) => setE("company", ev.target.value)} style={dInp} /></div>
            <div style={{ flex: "2 1 180px" }}><label style={dLbl}>Notes</label><input value={e.notes != null ? e.notes : (a.commission_notes || "")} onChange={(ev) => setE("notes", ev.target.value)} style={dInp} /></div>
            <button onClick={() => save(a)} style={{ alignSelf: "flex-end", background: T.btnBg, color: T.btnFg, border: "none", borderRadius: 9, padding: "9px 16px", fontWeight: 700, cursor: "pointer", fontFamily: UI, fontSize: 12.5 }}>Save</button>
          </div>
        </div>; })}
    </div>
  </div>;
}

function Deals({ user, go, openDeal }) {
  const isAdmin = user && (user.role === "master_admin" || user.role === "admin");
  const [deals, setDeals] = useState(null);
  const [tab, setTab] = useState("approvals"); // admin: approvals | commissions
  const [statusF, setStatusF] = useState(isAdmin ? "pending" : "");
  const [agentF, setAgentF] = useState("");
  const [typeF, setTypeF] = useState("");
  const load = async () => {
    setDeals(null);
    const { data, error } = await supabase.from("deals").select("*").neq("status", "cancelled").order("created_at", { ascending: false }).limit(1000);
    setDeals(error ? [] : (data || []));
  };
  useEffect(() => { load(); }, []);
  const all = (deals || []).filter((d) => !d.deleted);
  const agents = [...new Set(all.map((d) => d.client_name && d.agent_id).filter(Boolean))];
  const when = (t) => new Date(t).toLocaleDateString("en-GB", { timeZone: "Asia/Dubai", day: "2-digit", month: "short", year: "2-digit" });

  const matchStatus = (d) => {
    if (!statusF) return true;
    if (statusF === "pending") return ["submitted", "pending_review"].includes(d.status);
    return d.status === statusF;
  };
  const filtered = all.filter(matchStatus).filter((d) => (!typeF || d.deal_type === typeF) && (!agentF || d.agent_id === agentF));

  // Agent view (My Closed Deals)
  if (!isAdmin) {
    const mine = all; // RLS already returns only the agent's own deals
    const group = (s) => mine.filter((d) => s === "pending" ? ["submitted", "pending_review"].includes(d.status) : d.status === s);
    return <div>
      <div style={{ fontFamily: DISPLAY, fontSize: 23, fontWeight: 800, color: T.ink, marginBottom: 4 }}>My Closed Deals</div>
      <div style={{ color: T.muted, fontSize: 13, marginBottom: 16 }}>Deals you've submitted and their approval status. Estimated commission becomes final once Admin approves.</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 10, marginBottom: 16 }}>
        <Kpi label="Pending" value={group("pending").length} tone="warn" />
        <Kpi label="Approved" value={group("approved").length} tone="ok" />
        <Kpi label="Needs correction" value={group("needs_correction").length} tone={group("needs_correction").length ? "bad" : null} />
        <Kpi label="Rejected" value={group("rejected").length} />
      </div>
      {deals === null ? <div style={{ ...card, padding: 40, textAlign: "center", color: T.muted }}>Loading…</div>
        : mine.length === 0 ? <div style={{ ...card, padding: 40, textAlign: "center", color: T.muted }}>No deals yet. Open one of your leads and tap <b>Close deal</b> to submit one.</div>
        : <div style={{ display: "grid", gap: 10 }}>
          {mine.map((d) => { const sm = dealStatusMeta(d.status); return <div key={d.id} onClick={() => openDeal(d.id)} style={{ ...card, padding: 14, cursor: "pointer" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
              <div><span style={{ fontWeight: 700 }}>{d.client_name}</span> <span style={{ color: T.gold, fontSize: 11, fontWeight: 700 }}>{dealNoFmt(d)}</span>
                <div style={{ fontSize: 11.5, color: T.muted, marginTop: 2 }}>{[d.deal_type, d.project, d.area].filter(Boolean).join(" · ")} · {when(d.created_at)}</div></div>
              <Chip tone={sm[2]}>{sm[1]}</Chip>
            </div>
            <div style={{ display: "flex", gap: 16, marginTop: 10, fontSize: 12, flexWrap: "wrap" }}>
              <div><span style={{ color: T.faint }}>Value </span><b>{aed(d.property_value)}</b></div>
              <div><span style={{ color: T.faint }}>{d.status === "approved" ? "Approved comm. " : "Est. commission "}</span><b>{d.agent_commission == null ? "—" : aed(d.agent_commission)}</b></div>
            </div>
            {d.status === "needs_correction" && d.correction_note && <div style={{ marginTop: 10, background: T.warnSoft, color: T.warn, borderRadius: 8, padding: "8px 11px", fontSize: 12 }}>Correction needed: {d.correction_note}</div>}
            {d.status === "rejected" && d.correction_note && <div style={{ marginTop: 10, background: T.badSoft, color: T.bad, borderRadius: 8, padding: "8px 11px", fontSize: 12 }}>Reason: {d.correction_note}</div>}
          </div>; })}
        </div>}
    </div>;
  }

  // Admin view
  return <div>
    <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
      <button onClick={() => setTab("approvals")} style={{ padding: "9px 16px", borderRadius: 9, border: `1px solid ${tab === "approvals" ? T.gold : T.hair}`, background: tab === "approvals" ? T.goldSoft : T.paper, color: tab === "approvals" ? T.gold : T.muted, fontWeight: 700, cursor: "pointer", fontFamily: UI, fontSize: 13 }}>Deal Approvals</button>
      <button onClick={() => setTab("commissions")} style={{ padding: "9px 16px", borderRadius: 9, border: `1px solid ${tab === "commissions" ? T.gold : T.hair}`, background: tab === "commissions" ? T.goldSoft : T.paper, color: tab === "commissions" ? T.gold : T.muted, fontWeight: 700, cursor: "pointer", fontFamily: UI, fontSize: 13 }}>Agent commissions</button>
    </div>
    {tab === "commissions" ? <CommissionSettings user={user} /> : <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 10, marginBottom: 14 }}>
        <Kpi label="Pending approval" value={all.filter((d) => ["submitted", "pending_review"].includes(d.status)).length} tone="warn" />
        <Kpi label="Approved" value={all.filter((d) => d.status === "approved").length} tone="ok" />
        <Kpi label="Needs correction" value={all.filter((d) => d.status === "needs_correction").length} />
        <Kpi label="Rejected" value={all.filter((d) => d.status === "rejected").length} />
      </div>
      <div style={{ ...card, padding: 12, marginBottom: 14, display: "flex", gap: 9, flexWrap: "wrap" }}>
        <select value={statusF} onChange={(e) => setStatusF(e.target.value)} style={{ ...dInp, width: "auto" }}><option value="">All statuses</option><option value="pending">Pending approval</option>{DEAL_STATUS.filter(([v]) => !["cancelled"].includes(v)).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
        <select value={typeF} onChange={(e) => setTypeF(e.target.value)} style={{ ...dInp, width: "auto" }}><option value="">All types</option><option>Sales</option><option>Rental</option></select>
      </div>
      {deals === null ? <div style={{ ...card, padding: 40, textAlign: "center", color: T.muted }}>Loading deals…</div>
        : filtered.length === 0 ? <div style={{ ...card, padding: 40, textAlign: "center", color: T.muted }}>No deals {all.length === 0 ? "submitted yet." : "match these filters."}</div>
        : <div style={{ display: "grid", gap: 10 }}>
          {filtered.map((d) => { const sm = dealStatusMeta(d.status); return <div key={d.id} onClick={() => openDeal(d.id)} style={{ ...card, padding: 14, cursor: "pointer" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
              <div><span style={{ fontWeight: 700 }}>{d.client_name}</span> <span style={{ color: T.gold, fontSize: 11, fontWeight: 700 }}>{dealNoFmt(d)}</span>
                <div style={{ fontSize: 11.5, color: T.muted, marginTop: 2 }}>{[d.deal_type, d.project, d.area, d.property_type].filter(Boolean).join(" · ")}</div></div>
              <Chip tone={sm[2]}>{sm[1]}</Chip>
            </div>
            <div style={{ display: "flex", gap: 16, marginTop: 10, fontSize: 12, flexWrap: "wrap" }}>
              <div><span style={{ color: T.faint }}>Value </span><b>{aed(d.property_value)}</b></div>
              <div><span style={{ color: T.faint }}>Gross </span><b>{aed(d.gross_commission)}</b></div>
              <div><span style={{ color: T.faint }}>Net to Amber </span><b>{aed(d.final_net || d.net_commission)}</b></div>
              <div><span style={{ color: T.faint }}>Submitted </span>{d.submitted_at ? when(d.submitted_at) : "—"}</div>
            </div>
            {["submitted", "pending_review"].includes(d.status) && <div style={{ marginTop: 8, fontSize: 11.5, color: T.gold, fontWeight: 700 }}>Tap to review & approve →</div>}
          </div>; })}
        </div>}
    </>}
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
  const [kb, setKb] = useState([]);                // Amber Homes knowledge (loaded once per session)
  const boxRef = useRef(null);
  useEffect(() => { if (boxRef.current) boxRef.current.scrollTop = boxRef.current.scrollHeight; }, [msgs, busy]);

  const pick = async (m) => {
    setMentor(m);
    setMsgs([{ role: "assistant", text: m.greeting }]);
    setCtx(await buildCrmContext(user)); // fetch permitted CRM context once per session
    fetchKnowledge(user).then(setKb).catch(() => setKb([])); // verified company knowledge
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
    const picked = pickKnowledge(text, kb, mentor.id); // relevant verified knowledge for THIS question
    try {
      const res = await fetch("/api/ai", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mentor: mentor.id, crmContext: ctx, knowledge: picked.text,
          messages: next.slice(-12).map((m) => ({ role: m.role === "user" ? "user" : "assistant", content: m.text })) }) });
      const data = await res.json();
      if (data.error) {
        setMsgs((m) => [...m, { role: "assistant", text: "Ask Amber is temporarily unavailable. Please try again." }]);
        logAi({ user, mentor, question: text, status: "error" });
      } else {
        const reply = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n").trim();
        const sources = picked.used && picked.used.length
          ? picked.used.filter((u) => !/do not say|compliance/i.test(u.title)).slice(0, 3).map((u) => u.title)
          : [];
        setMsgs((m) => [...m, { role: "assistant", text: reply || "Please try again.", sources }]);
        logAi({ user, mentor, question: text, responseSum: reply, fullResponse: reply, category: categorize(text), model: data.model, status: "success", tokensIn: data.usage && data.usage.input_tokens, tokensOut: data.usage && data.usage.output_tokens });
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
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: m.role === "user" ? "flex-end" : "flex-start", marginBottom: 9 }}>
              <div style={{ maxWidth: "88%", background: m.role === "user" ? T.btnBg : T.paper,
                color: m.role === "user" ? T.btnFg : T.ink, border: m.role === "user" ? "none" : `1px solid ${T.hair}`,
                borderRadius: 13, padding: "9px 12px", fontSize: 12.8, lineHeight: 1.55, whiteSpace: "pre-wrap",
                boxShadow: m.role === "user" ? "none" : T.shadow }}>{m.text}</div>
              {m.sources && m.sources.length > 0 && (
                <div style={{ maxWidth: "88%", marginTop: 4, fontSize: 10.5, color: T.faint, display: "flex", alignItems: "center", gap: 4, paddingLeft: 2 }}>
                  <BookOpen size={11} /> Based on: {m.sources.join(" · ")}
                </div>
              )}
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
  const [stage, setStage] = useState("creds");   // creds | twofa | setpw
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [code, setCode] = useState("");
  const [npw, setNpw] = useState(""); const [npw2, setNpw2] = useState("");
  const [err, setErr] = useState(""); const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  useEffect(() => { if (resendIn <= 0) return; const t = setTimeout(() => setResendIn((s) => s - 1), 1000); return () => clearTimeout(t); }, [resendIn]);

  const friendly = (reason) => ({
    bad_credentials: "Incorrect email or password.",
    email_unconfirmed: "Your account isn't activated yet. Please contact your administrator.",
    inactive: "Your account is inactive. Please contact admin.",
    no_profile: "No profile found for this account. Contact your admin.",
    email_send_failed: "We couldn't send your verification code. Please try again in a moment.",
    too_soon: "Please wait a few seconds before requesting another code.",
    expired: "Your verification code has expired. Please request a new code.",
    invalid: "Invalid verification code.",
    locked: "Too many incorrect codes. Please sign in again to get a new code.",
    missing: "Please fill in all fields.",
    server: "Something went wrong. Please try again.",
    server_unconfigured: "Sign-in is temporarily unavailable. Please contact your administrator.",
  }[reason] || "Something went wrong. Please try again.");

  const api = async (action, body) => {
    const r = await fetch("/api/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, ...body }) });
    return r.json();
  };
  const fetchProfileAndFinish = async (uid) => {
    const { data: prof } = await supabase.from("profiles").select("full_name, role, active").eq("id", uid).single();
    if (!prof) { setErr("No profile found for this account. Contact your admin."); setBusy(false); return; }
    if (prof.active === false) { await supabase.auth.signOut(); setErr("Your account is inactive. Please contact admin."); setBusy(false); return; }
    const ri = roleInfo(prof.role); stampLogin(uid);
    onLogin({ name: prof.full_name || email, email, role: prof.role, roleLabel: ri.label, home: ri.home, id: uid, mustChangePw: false });
  };
  const establish = async (token_hash, mustChange) => {
    const { data, error } = await supabase.auth.verifyOtp({ token_hash, type: "magiclink" });
    if (error || !data?.user) { setErr("Could not complete sign-in. Please try again."); setBusy(false); return; }
    if (mustChange) { setStage("setpw"); setBusy(false); setNote("For your security, please set a new password to continue."); return; }
    await fetchProfileAndFinish(data.user.id);
  };

  const submitCreds = async () => {
    setErr(""); setNote(""); const mail = email.trim().toLowerCase();
    if (!mail.includes("@")) { setErr("Enter your work email."); return; }
    if (!pw) { setErr("Enter your password."); return; }
    setBusy(true); setEmail(mail);
    try {
      const res = await api("start", { email: mail, password: pw });
      if (!res.ok) { setErr(friendly(res.reason)); setBusy(false); return; }
      if (res.needs2fa) { setStage("twofa"); setBusy(false); setResendIn(30); setCode(""); setNote("Enter the 4-digit code we emailed to " + mail + "."); return; }
      await establish(res.token_hash, res.mustChange);
    } catch (e) { setErr("Could not reach the server. Check your connection."); setBusy(false); }
  };
  const submitCode = async () => {
    setErr(""); if (!/^\d{4}$/.test(code.trim())) { setErr("Enter the 4-digit code from your email."); return; }
    setBusy(true);
    try {
      const res = await api("verify_2fa", { email, code: code.trim() });
      if (!res.ok) { setErr(friendly(res.reason)); setBusy(false); if (res.reason === "locked" || res.reason === "expired") { setStage("creds"); setCode(""); setPw(""); } return; }
      await establish(res.token_hash, res.mustChange);
    } catch (e) { setErr("Could not reach the server. Check your connection."); setBusy(false); }
  };
  const resend = async () => {
    if (resendIn > 0) return; setErr("");
    try { const res = await api("resend", { email }); if (res.ok) { setResendIn(30); setNote("A new code is on its way to " + email + "."); } else setErr(friendly(res.reason)); }
    catch (e) { setErr("Could not reach the server."); }
  };
  const submitNewPw = async () => {
    setErr(""); if (npw.length < 8) { setErr("Use at least 8 characters."); return; }
    if (npw !== npw2) { setErr("Passwords don't match."); return; }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: npw });
    if (error) { setErr("Could not update your password. Please try again."); setBusy(false); return; }
    try { const { data: { session } } = await supabase.auth.getSession();
      await fetch("/api/auth", { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + (session?.access_token || "") }, body: JSON.stringify({ action: "after_password_change" }) }); } catch (e) {}
    const { data: { user } } = await supabase.auth.getUser();
    if (user) await fetchProfileAndFinish(user.id); else { setErr("Please sign in again."); setBusy(false); setStage("creds"); }
  };

  const inputS = { width: "100%", border: `1px solid ${T.hair}`, borderRadius: 11, padding: "12px 14px",
    fontSize: 14, fontFamily: UI, outline: "none", color: T.ink, background: T.bone, boxSizing: "border-box" };
  const lab = { fontSize: 10.5, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: T.muted };
  const primaryBtn = { width: "100%", background: T.btnBg, color: T.btnFg, border: "none", borderRadius: 11, padding: "13px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: UI, opacity: busy ? .6 : 1 };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "grid", placeItems: "center", padding: 18,
      fontFamily: UI, overflowY: "auto",
      background: "radial-gradient(1100px 600px at 78% -8%, rgba(196,154,74,.22), transparent 60%), linear-gradient(160deg, #0b1320 0%, #0e1828 42%, #111d2f 100%)" }}>
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
        <svg viewBox="0 0 1440 900" preserveAspectRatio="xMidYMax slice" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.5 }}>
          <defs>
            <linearGradient id="tower" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#1b2a40" /><stop offset="100%" stopColor="#0b1320" /></linearGradient>
            <linearGradient id="towerLit" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#243755" /><stop offset="100%" stopColor="#0d1626" /></linearGradient>
          </defs>
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
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(8,14,24,.2) 0%, rgba(8,14,24,.55) 100%)" }} />
      </div>

      <button onClick={() => setDark(!dark)} style={{ position: "absolute", top: 16, right: 16,
        border: "1px solid rgba(255,255,255,.18)", background: "rgba(255,255,255,.06)", borderRadius: 9, width: 36, height: 36,
        display: "grid", placeItems: "center", cursor: "pointer", zIndex: 2 }}>
        {dark ? <Sun size={16} color="#E6C46B" /> : <Moon size={16} color="#cdd6e4" />}</button>

      <div style={{ width: "100%", maxWidth: 410, position: "relative", zIndex: 2 }}>
        <div style={{ textAlign: "center", marginBottom: 22 }}>
          <div style={{ fontFamily: DISPLAY, fontSize: 27, letterSpacing: ".04em", color: "#fff", fontWeight: 500, lineHeight: 1.15 }}>Amber Homes Real Estate</div>
          <div style={{ width: 38, height: 2, background: "linear-gradient(90deg, transparent, #C49A4A, transparent)", margin: "12px auto 0" }} />
        </div>

        <div style={{ background: T.paper, border: `1px solid ${T.hair}`, borderRadius: 18, boxShadow: "0 30px 80px rgba(0,0,0,.5)", padding: "28px 26px" }}>
          {stage === "creds" && <>
            <div style={{ fontSize: 18, fontWeight: 700, color: T.ink }}>Sign in to access your CRM dashboard.</div>
            <div style={{ fontSize: 12.5, color: T.muted, marginTop: 5, marginBottom: 20 }}>Use your Amber Homes work email and password.</div>
            <label style={{ display: "block", marginBottom: 12 }}><span style={lab}>Work email</span>
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@amberhomes.ae" autoComplete="username" onKeyDown={(e) => { if (e.key === "Enter") submitCreds(); }} style={{ ...inputS, marginTop: 6 }} /></label>
            <label style={{ display: "block", marginBottom: 6 }}><span style={lab}>Password</span>
              <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="••••••••" autoComplete="current-password" onKeyDown={(e) => { if (e.key === "Enter") submitCreds(); }} style={{ ...inputS, marginTop: 6 }} /></label>
            <div style={{ textAlign: "right", marginBottom: 14 }}>
              <button onClick={async () => { setErr(""); setNote(""); const mail = email.trim().toLowerCase(); if (!mail.includes("@")) { setErr("Enter your email first, then tap reset."); return; }
                const { error } = await supabase.auth.resetPasswordForEmail(mail, { redirectTo: window.location.origin });
                try { await supabase.from("auth_logs").insert({ email: mail, event: "forgot_requested", status: error ? "fail" : "ok" }); } catch (e) {}
                if (error) setErr("Could not send the reset email. Please try again."); else setNote("If that email exists, a reset link has been sent. Check your inbox."); }}
                style={{ background: "none", border: "none", color: T.gold, fontSize: 11.5, fontWeight: 600, cursor: "pointer", fontFamily: UI }}>Forgot password?</button></div>
            {err && <div style={{ color: T.bad, fontSize: 12, fontWeight: 600, marginBottom: 10 }}>{err}</div>}
            {note && <div style={{ color: T.ok, fontSize: 12, fontWeight: 600, marginBottom: 10 }}>{note}</div>}
            <button onClick={submitCreds} disabled={busy} style={primaryBtn}>{busy ? "Signing in…" : "Sign in"}</button>
          </>}

          {stage === "twofa" && <>
            <div style={{ fontSize: 18, fontWeight: 700, color: T.ink }}>Enter your verification code</div>
            <div style={{ fontSize: 12.5, color: T.muted, marginTop: 5, marginBottom: 18 }}>{note || ("We emailed a 4-digit code to " + email + ".")}</div>
            <input value={code} onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, "").slice(0, 4))} placeholder="• • • •" inputMode="numeric" autoComplete="one-time-code" onKeyDown={(e) => { if (e.key === "Enter") submitCode(); }}
              style={{ ...inputS, textAlign: "center", fontSize: 26, letterSpacing: 14, fontWeight: 700 }} />
            {err && <div style={{ color: T.bad, fontSize: 12, fontWeight: 600, margin: "10px 0" }}>{err}</div>}
            <button onClick={submitCode} disabled={busy} style={{ ...primaryBtn, marginTop: 14 }}>{busy ? "Verifying…" : "Verify & continue"}</button>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12 }}>
              <button onClick={() => { setStage("creds"); setErr(""); setCode(""); }} style={{ background: "none", border: "none", color: T.muted, fontSize: 11.5, cursor: "pointer", fontFamily: UI }}>← Back</button>
              <button onClick={resend} disabled={resendIn > 0} style={{ background: "none", border: "none", color: resendIn > 0 ? T.faint : T.gold, fontSize: 11.5, fontWeight: 600, cursor: resendIn > 0 ? "default" : "pointer", fontFamily: UI }}>{resendIn > 0 ? `Resend code in ${resendIn}s` : "Resend code"}</button>
            </div>
          </>}

          {stage === "setpw" && <>
            <div style={{ fontSize: 18, fontWeight: 700, color: T.ink }}>Set your password</div>
            <div style={{ fontSize: 12.5, color: T.muted, marginTop: 5, marginBottom: 18 }}>{note || "Please choose a new password to continue."}</div>
            <input type="password" placeholder="New password (min 8 characters)" value={npw} onChange={(e) => setNpw(e.target.value)} style={{ ...inputS, marginBottom: 10 }} />
            <input type="password" placeholder="Confirm new password" value={npw2} onChange={(e) => setNpw2(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") submitNewPw(); }} style={{ ...inputS, marginBottom: 10 }} />
            {err && <div style={{ color: T.bad, fontSize: 12, fontWeight: 600, marginBottom: 10 }}>{err}</div>}
            <button onClick={submitNewPw} disabled={busy} style={primaryBtn}>{busy ? "Saving…" : "Save & continue"}</button>
          </>}
        </div>

        <div style={{ marginTop: 16, textAlign: "center" }}>
          <div style={{ fontSize: 11.5, color: "rgba(255,255,255,.62)", lineHeight: 1.5 }}>Your dashboard access is based on your assigned role.</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,.4)", marginTop: 6 }}>Accounts are created by your Master Admin. Trouble signing in? Contact your administrator.</div>
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
      .select("id, lead_code, lead_no, client_name, phone, whatsapp, email, project, area, budget, assigned_agent_name, assigned_agent, current_owner, created_by, status, temperature, source, is_open, next_followup, last_contacted, created_on")
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
                   : "Import an Excel or CSV file, or use Add lead above to get started."}</div>
      </div>
    ) : filtered.length === 0 ? (
      <div style={{ ...card, padding: 36, marginTop: 14, textAlign: "center", color: T.muted, fontSize: 13 }}>No leads match this filter.</div>
    ) : (
      <div style={{ ...card, overflow: "hidden", marginTop: 14 }}>
        <div style={{ overflowX: "auto" }}>
          <div style={{ minWidth: isAgent ? 820 : 1680 }}>
            <div style={{ display: "grid", gridTemplateColumns: isAgent ? "1.5fr 1.3fr 1fr 1.2fr 0.9fr 1fr" : "0.6fr 1.2fr 1.1fr 1.15fr 1.15fr 1.35fr 0.9fr 1fr 0.8fr 0.85fr 0.9fr 0.9fr", gap: 8,
              padding: "10px 16px", fontSize: 10.5, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase",
              color: T.muted, borderBottom: `1px solid ${T.hair}`, background: T.bone }}>
              {isAgent ? <><span>Client</span><span>Project</span><span>Budget</span><span>Next follow-up</span><span>Status</span><span>Contact</span></>
                       : <><span>Code</span><span>Client</span><span>Project</span><span>Phone</span><span>WhatsApp</span><span>Email</span><span>Area</span><span>Agent</span><span>Status</span><span>Temp</span><span>Source</span><span>Last / Created</span></>}
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
              <div key={l.id} onClick={() => openLead && openLead(l.id)} style={{ display: "grid", gridTemplateColumns: "0.6fr 1.2fr 1.1fr 1.15fr 1.15fr 1.35fr 0.9fr 1fr 0.8fr 0.85fr 0.9fr 0.9fr",
                gap: 8, alignItems: "center", padding: "12px 16px", borderTop: i ? `1px solid ${T.hairSoft}` : "none", fontSize: 12, cursor: "pointer" }}>
                <span style={{ fontWeight: 700, color: T.gold, fontSize: 10.5 }}>{l.lead_code || (l.lead_no ? "L" + String(l.lead_no).padStart(3, "0") : "—")}</span>
                <span style={{ fontWeight: 600 }}>{l.client_name}</span>
                <span style={{ color: T.inkSoft }}>{l.project || "—"}</span>
                <span style={{ fontSize: 11.5 }}>{l.phone || <span style={{ color: T.faint }}>—</span>}</span>
                <span style={{ fontSize: 11.5 }}>{l.whatsapp || l.phone || <span style={{ color: T.faint }}>—</span>}</span>
                <span style={{ fontSize: 11.5, color: l.email ? T.inkSoft : T.faint, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.email || "No email"}</span>
                <span style={{ color: T.inkSoft }}>{l.area || "—"}</span>
                <span style={{ color: l.assigned_agent_name ? T.ink : T.faint }}>{l.assigned_agent_name || "Unassigned"}</span>
                <Chip tone={l.is_open ? "gold" : "info"}>{l.is_open ? "Open" : l.status}</Chip>
                <span style={{ fontSize: 11 }}><Chip tone={l.temperature === "Hot" || l.temperature === "Very Hot" ? "bad" : l.temperature === "Warm" ? "warn" : "info"}>{l.temperature || "—"}</Chip></span>
                <span style={{ color: T.inkSoft, fontSize: 11 }}>{l.source || "—"}</span>
                <span style={{ fontSize: 10.5, color: T.faint, lineHeight: 1.35 }}>
                  {l.last_contacted ? <span>LC {l.last_contacted}</span> : <span>LC —</span>}<br />
                  {l.created_on || (l.created_at ? new Date(l.created_at).toLocaleDateString() : "—")}</span>
              </div>
            )))}
          </div>
        </div>
      </div>
    )}
    <div style={{ fontSize: 11, color: T.faint, marginTop: 10 }}>
      {isAgent ? "These are your leads only. Tap WhatsApp or call to reach a client directly."
               : "Master Admin sees full client contact details. What each person sees is enforced by row-level security; agent reveals are logged."}
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

/* ---- Import file (CSV or Excel) → Supabase ---- */
function ImportModal({ onClose, onDone, me }) {
  const [rows, setRows] = useState(null); const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(""); const [done, setDone] = useState(0); const [fileName, setFileName] = useState("");

  // Find a value in a header-keyed row object by fuzzy column-name match (case-insensitive).
  const pickFrom = (obj, names) => {
    const keys = Object.keys(obj);
    for (const n of names) {
      const k = keys.find((key) => key.toLowerCase().trim().includes(n));
      if (k && obj[k] != null && String(obj[k]).trim()) return String(obj[k]).trim();
    }
    return null;
  };
  // Map any header-keyed row (from CSV or Excel) to our lead fields.
  const mapRow = (obj) => ({
    client_name: pickFrom(obj, ["customer", "name", "client"]) || "Unknown",
    phone: pickFrom(obj, ["mobile", "phone", "whatsapp", "contact"]),
    email: pickFrom(obj, ["email", "mail"]),
    project: pickFrom(obj, ["property type", "project", "property"]),
    area: pickFrom(obj, ["location", "area", "community"]),
    assigned_agent_name: pickFrom(obj, ["agent", "assigned"]),
  });

  // CSV → array of header-keyed objects (quote-aware).
  const parseCsvToObjects = (text) => {
    const lines = text.split(/\r?\n/).filter((l) => l.trim());
    if (!lines.length) return [];
    const split = (l) => { const out = []; let cur = "", inq = false;
      for (let i = 0; i < l.length; i++) { const c = l[i];
        if (c === '"') inq = !inq; else if (c === "," && !inq) { out.push(cur); cur = ""; } else cur += c; }
      out.push(cur); return out.map((s) => s.trim().replace(/^"|"$/g, "")); };
    const hdr = split(lines[0]);
    return lines.slice(1).map((l) => { const c = split(l); const o = {}; hdr.forEach((h, i) => { o[h] = c[i]; }); return o; });
  };

  const onFile = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    setErr(""); setRows(null); setFileName(file.name);
    const name = file.name.toLowerCase();
    try {
      let records;
      if (name.endsWith(".xlsx") || name.endsWith(".xls") || name.endsWith(".xlsm")) {
        const XLSX = await import("xlsx");                 // loaded only when an Excel file is chosen
        const wb = XLSX.read(await file.arrayBuffer(), { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];            // first sheet
        records = XLSX.utils.sheet_to_json(ws, { defval: "" });
      } else if (name.endsWith(".csv") || name.endsWith(".txt")) {
        records = parseCsvToObjects(await file.text());
      } else {
        setErr("Unsupported file. Upload a .xlsx, .xls or .csv file."); return;
      }
      const mapped = records.map(mapRow).filter((r) => (r.client_name && r.client_name !== "Unknown") || r.phone || r.email);
      if (!mapped.length) { setErr("No rows found. Make sure the first row has column headers (name, phone, email, etc.)."); return; }
      setRows(mapped);
    } catch (x) { setErr("Couldn't read that file. Use a .xlsx or .csv export with a header row."); }
  };

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
      Upload an <b>Excel (.xlsx)</b> or <b>.csv</b> file. The first row must be column headers — they're auto-detected
      (customer/name, mobile/phone, email, property type/project, location/area, agent). For Excel, the first sheet is used.</div>
    <input type="file" accept=".xlsx,.xls,.xlsm,.csv,.txt,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv" onChange={onFile} style={{ fontSize: 13, marginBottom: 12 }} />
    {rows && <div style={{ ...card, padding: 12, marginBottom: 12, fontSize: 12.5 }}>
      Found <b>{rows.length}</b> rows{fileName ? ` in ${fileName}` : ""}. First: {rows[0]?.client_name} · {rows[0]?.project || "—"}</div>}
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
    if (error) { setBusy(false); setMsg("Could not update your password. Please try again."); return; }
    try { const { data: { session } } = await supabase.auth.getSession();
      await fetch("/api/auth", { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + (session?.access_token || "") }, body: JSON.stringify({ action: "after_password_change" }) }); } catch (e) {}
    setBusy(false); onDone();
  };
  const inp = { width: "100%", border: `1px solid ${T.hair}`, borderRadius: 10, padding: "11px 13px", fontSize: 14,
    fontFamily: UI, outline: "none", color: T.ink, background: T.bone, boxSizing: "border-box", marginBottom: 10 };
  return <div style={{ position: "fixed", inset: 0, zIndex: 110, background: T.bone, display: "grid", placeItems: "center", padding: 18, fontFamily: UI }}>
    <div style={{ width: "100%", maxWidth: 380, background: T.paper, border: `1px solid ${T.hair}`, borderRadius: 18, boxShadow: T.shadowLg, padding: 26 }}>
      <div style={{ fontWeight: 800, fontSize: 18 }}>Set your password</div>
      <div style={{ fontSize: 12.5, color: T.muted, marginTop: 4, marginBottom: 18 }}>For security, please choose a new password before continuing.</div>
      <input type="password" placeholder="New password (min 8 characters)" value={pw} onChange={(e) => setPw(e.target.value)} style={inp} />
      <input type="password" placeholder="Confirm password" value={pw2} onChange={(e) => setPw2(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") save(); }} style={inp} />
      {msg && <div style={{ color: T.bad, fontSize: 12, fontWeight: 600, marginBottom: 10 }}>{msg}</div>}
      <button onClick={save} disabled={busy} style={{ width: "100%", background: T.btnBg, color: T.btnFg, border: "none",
        borderRadius: 11, padding: "12px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: UI, opacity: busy ? .6 : 1 }}>{busy ? "Saving…" : "Save & continue"}</button>
      <button onClick={signOut} style={{ width: "100%", marginTop: 8, background: "none", border: "none", color: T.muted, fontSize: 12, cursor: "pointer", fontFamily: UI }}>Sign out instead</button>
    </div>
  </div>;
}

function ResetPassword({ onDone }) {
  const [pw, setPw] = useState(""); const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false); const [msg, setMsg] = useState(""); const [done, setDone] = useState(false);
  const save = async () => {
    if (pw.length < 8) { setMsg("Use at least 8 characters."); return; }
    if (pw !== pw2) { setMsg("Passwords don't match."); return; }
    setBusy(true); setMsg("");
    const { error } = await supabase.auth.updateUser({ password: pw });
    if (error) { setBusy(false); setMsg("Reset link expired or invalid. Please request a new password reset."); return; }
    try { const { data: { session } } = await supabase.auth.getSession();
      await fetch("/api/auth", { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + (session?.access_token || "") }, body: JSON.stringify({ action: "after_password_change" }) });
      await supabase.from("auth_logs").insert({ email: session?.user?.email || null, event: "reset_success", status: "ok" }); } catch (e) {}
    await supabase.auth.signOut();
    setBusy(false); setDone(true);
  };
  const inp = { width: "100%", border: `1px solid ${T.hair}`, borderRadius: 10, padding: "11px 13px", fontSize: 14,
    fontFamily: UI, outline: "none", color: T.ink, background: T.bone, boxSizing: "border-box", marginBottom: 10 };
  return <div style={{ position: "fixed", inset: 0, zIndex: 115, background: "linear-gradient(160deg,#0b1320,#111d2f)", display: "grid", placeItems: "center", padding: 18, fontFamily: UI }}>
    <div style={{ width: "100%", maxWidth: 390, background: T.paper, border: `1px solid ${T.hair}`, borderRadius: 18, boxShadow: T.shadowLg, padding: 28 }}>
      {done ? <>
        <div style={{ fontWeight: 800, fontSize: 18, color: T.ok }}>Password updated</div>
        <div style={{ fontSize: 13, color: T.muted, marginTop: 6, marginBottom: 18 }}>Your password has been changed. You can now sign in with your new password.</div>
        <button onClick={onDone} style={{ width: "100%", background: T.btnBg, color: T.btnFg, border: "none", borderRadius: 11, padding: "12px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: UI }}>Go to sign in</button>
      </> : <>
        <div style={{ fontWeight: 800, fontSize: 19 }}>Create a new password</div>
        <div style={{ fontSize: 12.5, color: T.muted, marginTop: 5, marginBottom: 18 }}>Choose a new password for your Amber Homes account.</div>
        <input type="password" placeholder="New password (min 8 characters)" value={pw} onChange={(e) => setPw(e.target.value)} style={inp} />
        <input type="password" placeholder="Confirm new password" value={pw2} onChange={(e) => setPw2(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") save(); }} style={inp} />
        {msg && <div style={{ color: T.bad, fontSize: 12, fontWeight: 600, marginBottom: 10 }}>{msg}</div>}
        <button onClick={save} disabled={busy} style={{ width: "100%", background: T.btnBg, color: T.btnFg, border: "none", borderRadius: 11, padding: "12px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: UI, opacity: busy ? .6 : 1 }}>{busy ? "Saving…" : "Update password"}</button>
        <button onClick={onDone} style={{ width: "100%", marginTop: 8, background: "none", border: "none", color: T.muted, fontSize: 12, cursor: "pointer", fontFamily: UI }}>Back to sign in</button>
      </>}
    </div>
  </div>;
}

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
  const repairLogin = async () => { setBusy("rep"); setMsg("");
    const r = await adminCall("repair_account", { id: u.id, password: pw || undefined, forceChange: true });
    setBusy(""); setMsg(r.error || "Login repaired: email confirmed, account unlocked, one-time password change required next login."); if (!r.error) setTimeout(onChanged, 1000); };
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
    <button onClick={repairLogin} disabled={busy === "rep"} style={{ width: "100%", marginTop: 8, background: T.hairSoft, color: T.ink, border: `1px solid ${T.hair}`, borderRadius: 10, padding: "9px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: UI }}>{busy === "rep" ? "Repairing…" : "Repair login access (confirm email · unlock · force one-time change)"}</button>
    <div style={{ fontSize: 11, color: T.faint, marginTop: 5 }}>Use this if a user is stuck on “incorrect password” or locked out. Type a temp password above to set one, or leave it blank to keep their current password.</div>

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
