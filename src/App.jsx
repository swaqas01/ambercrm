import { useState, useEffect, useRef } from "react";
import {
  LayoutDashboard, UserCircle, FileText, UserPlus, Kanban, BarChart3,
  ShieldAlert, Building2, Gauge, Briefcase, Coins, Settings, Menu, X,
  Phone, MessageCircle, Mail, Search, Bell, ChevronRight, ChevronDown,
  Flame, Clock, MapPin, Eye, EyeOff, Lock, AlertTriangle, CheckCircle2,
  TrendingUp, Users, Wallet, Star, Calendar, Filter, Plus, ArrowUpRight,
  ArrowDownRight, CircleDot, Ban, Download, Globe, Smartphone, Sun, Moon, Unlock, Send, Bot, Fingerprint, KeyRound, LogOut
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
    --ink:#16140F; --inkSoft:#46423A; --muted:#8A8478; --faint:#B5AFA2;
    --bone:#F5F2EB; --paper:#FFFFFF; --hair:#E6E0D4; --hairSoft:#F0EBE1;
    --gold:#A8862C; --goldBright:#C9A648; --goldSoft:#F5EDD8; --goldEdge:#E2D2A4;
    --ok:#2E6B52; --okSoft:#E4EEE9; --warn:#A87420; --warnSoft:#F6ECD7;
    --bad:#A8402F; --badSoft:#F5E2DD; --info:#3D5A75; --infoSoft:#E5EBF1;
    --hero:#13110D; --side:#13110D; --btnBg:#16140F; --btnFg:#FFFFFF;
    --goldTint:#FFFDF6; --wm:rgba(168,134,44,.07);
    --shadow:0 1px 2px rgba(22,20,15,.04), 0 6px 18px rgba(22,20,15,.05);
    --shadowLg:0 2px 4px rgba(22,20,15,.06), 0 16px 40px rgba(22,20,15,.10);
  }
  [data-amber="dark"] {
    --ink:#F0EBDF; --inkSoft:#C7C0B0; --muted:#8E887A; --faint:#5E594E;
    --bone:#15130F; --paper:#1E1B16; --hair:#2E2A22; --hairSoft:#272318;
    --gold:#C9A648; --goldBright:#E0C06A; --goldSoft:#2E2817; --goldEdge:#4A3F1E;
    --ok:#5FA886; --okSoft:#1B2922; --warn:#D2A04A; --warnSoft:#2C2415;
    --bad:#D2705F; --badSoft:#2E1D19; --info:#7FA3C4; --infoSoft:#1C2530;
    --hero:#0E0C09; --side:#0E0C09; --btnBg:#F0EBDF; --btnFg:#16140F;
    --goldTint:#252013; --wm:rgba(201,166,72,.06);
    --shadow:0 1px 2px rgba(0,0,0,.3), 0 6px 18px rgba(0,0,0,.25);
    --shadowLg:0 2px 4px rgba(0,0,0,.4), 0 16px 40px rgba(0,0,0,.45);
  }
  [data-amber] * { box-sizing: border-box; }
  [data-amber] button, [data-amber] select { transition: background .18s ease, border-color .18s ease, color .18s ease, transform .12s ease, box-shadow .18s ease; }
  [data-amber] button:hover { transform: translateY(-1px); }
  [data-amber] button:active { transform: translateY(0); }
  [data-amber] button:focus-visible, [data-amber] select:focus-visible { outline: 2px solid var(--goldBright); outline-offset: 2px; }
  [data-amber] ::selection { background: var(--goldSoft); }
  [data-amber] [style*="Sora"] { font-weight: 300; letter-spacing: -0.01em; }
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
const DISPLAY = "'Sora', 'Helvetica Neue', sans-serif";
const UI = "'Instrument Sans', system-ui, -apple-system, sans-serif";

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
  ["admin", "Admin Dashboard", LayoutDashboard],
  ["agent", "Agent Dashboard", UserCircle],
  ["lead", "Lead Detail", FileText],
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

/* ================================= SHELL ================================= */
export default function App() {
  const [screen, setScreen] = useState("admin");
  const [navOpen, setNavOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const [user, setUser] = useState(null); // {name, role, email}
  const [accent, setAccent] = useState("gold");
  const ACCENTS = [["gold", "Amber Gold", "#B08D2F"], ["emerald", "Emerald", "#1F6B52"],
    ["sapphire", "Sapphire", "#2C4E78"], ["burgundy", "Burgundy", "#7C2D3E"]];
  const [narrow, setNarrow] = useState(typeof window !== "undefined" && window.innerWidth < 900);
  useEffect(() => {
    const f = () => setNarrow(window.innerWidth < 900);
    window.addEventListener("resize", f); return () => window.removeEventListener("resize", f);
  }, []);
  useEffect(() => {
    const l = document.createElement("link"); l.rel = "stylesheet";
    l.href = "https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600&family=Instrument+Sans:wght@400;500;600;700&display=swap";
    document.head.appendChild(l); return () => { try { document.head.removeChild(l); } catch (e) {} };
  }, []);
  const go = (s) => { setScreen(s); setNavOpen(false); };
  const SCREENS = {
    admin: <AdminDash go={go} />, agent: <AgentDash go={go} />, lead: <LeadDetail />, open: <OpenLeads />,
    assign: <Assignment />, pipeline: <Pipeline go={go} />, performance: <Performance />,
    security: <SecurityLog />, matching: <Matching go={go} />, score: <ScorePage />,
    careers: <Careers />, commission: <Commission />, settings: <SettingsPage />,
  };
  return (
    <div data-amber={dark ? "dark" : "light"} data-accent={accent} style={{ fontFamily: UI, background: T.bone, minHeight: 600, display: "flex", color: T.ink,
      transition: "background .25s ease" }}>
      <style>{THEME_CSS}</style>
      {!user && <LoginFlow onLogin={(u) => { setUser(u); setScreen(u.role === "Agent" ? "agent" : "admin"); }} dark={dark} setDark={setDark} />}
      {/* sidebar */}
      {user && (!narrow || navOpen) && (
        <aside style={{ width: 232, background: T.side, color: "#fff", flexShrink: 0, display: "flex",
          flexDirection: "column", position: narrow ? "fixed" : "sticky", top: 0, height: narrow ? "100%" : "100vh", transition: "background .25s ease",
          zIndex: 50, boxShadow: narrow ? "0 0 60px rgba(0,0,0,.5)" : "none" }}>
          <div style={{ padding: "22px 20px 18px", borderBottom: "1px solid rgba(212,175,92,.22)" }}>
            <div style={{ fontFamily: DISPLAY, fontSize: 19, letterSpacing: ".22em", color: "#fff", fontWeight: 500 }}>AMBER</div>
            <div style={{ fontFamily: DISPLAY, fontSize: 10.5, letterSpacing: ".42em", color: T.goldBright, marginTop: 3, fontWeight: 400 }}>LEAD DESK</div>
          </div>
          <nav style={{ flex: 1, overflowY: "auto", padding: "12px 10px" }}>
            {NAV.map(([k, label, Ic]) => {
              const on = screen === k;
              return (
                <button key={k} onClick={() => go(k)} style={{ display: "flex", alignItems: "center", gap: 11,
                  width: "100%", textAlign: "left", background: on ? "rgba(212,175,92,.13)" : "transparent",
                  border: "none", borderLeft: `2px solid ${on ? T.goldBright : "transparent"}`,
                  color: on ? T.goldBright : "rgba(255,255,255,.66)", padding: "10px 12px", borderRadius: "0 8px 8px 0",
                  fontSize: 13, fontWeight: on ? 600 : 500, cursor: "pointer", fontFamily: UI, marginBottom: 2 }}>
                  <Ic size={16} /> {label}
                </button>
              );
            })}
          </nav>
          <div style={{ padding: "14px 20px", borderTop: "1px solid rgba(255,255,255,.08)", fontSize: 11,
            color: "rgba(255,255,255,.4)", lineHeight: 1.5 }}>
            Clickable prototype · mock data<br />
            <span style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 4 }}>
              <span>Signed in: <span style={{ color: T.goldBright }}>{user.name.split(" ")[0]} · {user.role}</span></span>
              <button onClick={() => setUser(null)} title="Sign out" style={{ background: "none", border: "none",
                color: "rgba(255,255,255,.45)", cursor: "pointer", padding: 2 }}><LogOut size={13} /></button>
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
                {NAV.find(([k]) => k === screen)[1]}</div>
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
            <button style={{ position: "relative", border: `1px solid ${T.hair}`, background: T.paper, borderRadius: 9,
              width: 36, height: 36, display: "grid", placeItems: "center", cursor: "pointer" }}>
              <Bell size={16} color={T.inkSoft} />
              <span style={{ position: "absolute", top: 7, right: 7, width: 7, height: 7, borderRadius: 7, background: T.bad }} />
            </button>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: T.hero, color: T.goldBright,
              display: "grid", placeItems: "center", fontFamily: DISPLAY, fontSize: 14 }}>S</div>
          </div>
        </header>
        <div style={{ padding: narrow ? "16px 14px 70px" : "24px 26px 80px", maxWidth: 1200 }}>
          {SCREENS[screen]}
        </div>
        <AiChat narrow={narrow} />
      </main>}
    </div>
  );
}

/* ============================== PRIMITIVES =============================== */
const card = { background: T.paper, border: `1px solid ${T.hair}`, borderRadius: 14, boxShadow: T.shadow, transition: "background .25s ease, border-color .25s ease" };
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
  return <div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 12 }}>
      <Kpi label="Total Leads" value="247" sub="+38 this month" trend="up" />
      <Kpi label="Pipeline Value" value="AED 101M" sub="weighted by stage" gold />
      <Kpi label="Unassigned Pool" value="4" sub="oldest 32 min" trend="down" />
      <Kpi label="Hot / Very Hot" value="19" sub="6 inactive 3+ days" />
      <Kpi label="Closed Won (Q)" value="18" sub="AED 33.9M value" trend="up" />
    </div>

    <SectionTitle right={<button onClick={() => go("security")} style={{ background: "none", border: "none", color: T.bad,
      fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontFamily: UI }}>
      View all <ChevronRight size={13} /></button>}>Security watch</SectionTitle>
    <div style={{ ...card, borderColor: T.badSoft, overflow: "hidden" }}>
      {SUS.slice(0, 2).map((s, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 16px",
          borderTop: i ? `1px solid ${T.hairSoft}` : "none" }}>
          <AlertTriangle size={17} color={s.sev === "high" ? T.bad : T.warn} style={{ flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13.5, fontWeight: 600 }}>{s.what}</div>
            <div style={{ fontSize: 11.5, color: T.muted, marginTop: 1 }}>{s.who} · {s.when} · {s.action}</div>
          </div>
          <Chip tone={s.sev === "high" ? "bad" : "warn"}>{s.sev === "high" ? "High" : "Medium"}</Chip>
        </div>
      ))}
    </div>

    <SectionTitle>Leads by source</SectionTitle>
    <div style={{ ...card, padding: 18 }}>
      {[["Property Finder", 34], ["Meta Ads", 26], ["Referral", 16], ["Bayut", 12], ["WhatsApp Campaign", 8], ["Roadshow", 4]].map(([s, p]) => (
        <div key={s} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
          <span style={{ width: 140, fontSize: 12.5, color: T.inkSoft }}>{s}</span>
          <div style={{ flex: 1 }}><Bar pct={p * 2.4} /></div>
          <span style={{ width: 36, textAlign: "right", fontSize: 12.5, fontWeight: 700 }}>{p}%</span>
        </div>
      ))}
    </div>

    <SectionTitle right={<button onClick={() => go("performance")} style={{ background: "none", border: "none", color: T.muted,
      fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontFamily: UI }}>
      Full report <ChevronRight size={13} /></button>}>Agent performance</SectionTitle>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12 }}>
      {AGENTS.map((a) => (
        <div key={a.id} style={{ ...card, padding: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Av name={a.name} dark />
            <div><div style={{ fontWeight: 600, fontSize: 13.5 }}>{a.name}</div>
              <div style={{ fontSize: 11, color: T.muted }}>{a.leads} leads · {a.deals} closed</div></div>
          </div>
          <div style={{ marginTop: 12 }}><Bar pct={a.score} color={a.score > 70 ? T.gold : T.bad} /></div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 7, fontSize: 11.5, color: T.muted }}>
            <span>AED {a.pipeline}M pipeline</span><span style={{ fontWeight: 700, color: a.score > 70 ? T.ink : T.bad }}>{a.score}</span>
          </div>
        </div>
      ))}
    </div>
  </div>;
}

/* ============================ 2 AGENT DASHBOARD ========================== */
function AgentDash({ go }) {
  return <div>
    <div style={{ ...card, padding: "18px 20px", display: "flex", alignItems: "center", justifyContent: "space-between",
      flexWrap: "wrap", gap: 14, background: T.hero, border: "none", boxShadow: T.shadowLg }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <Av name="Derya Altun" size={46} />
        <div>
          <div style={{ fontFamily: DISPLAY, fontSize: 19, color: "#fff" }}>Good morning, Derya</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,.6)" }}>Thursday 11 June · 3 follow-ups due · 1 site visit</div>
        </div>
      </div>
      <div style={{ textAlign: "right" }}>
        <div style={{ fontSize: 10.5, letterSpacing: ".12em", textTransform: "uppercase", color: "rgba(255,255,255,.5)" }}>Commission estimate</div>
        <div style={{ fontFamily: DISPLAY, fontSize: 24, color: T.goldBright }}>AED 240,500</div>
      </div>
    </div>

    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 12, marginTop: 14 }}>
      <Kpi label="My Leads" value="34" />
      <Kpi label="Due Today" value="3" sub="1 overdue" trend="down" />
      <Kpi label="Hot Leads" value="6" gold />
      <Kpi label="Monthly Target" value="71%" sub="AED 8.5M of 12M" trend="up" />
    </div>

    <SectionTitle>Today's focus</SectionTitle>
    <div style={{ display: "grid", gap: 10 }}>
      {LEADS.filter((l) => l.agent === "Derya Altun").map((l) => (
        <div key={l.id} onClick={() => go("lead")} style={{ ...card, padding: "14px 16px", cursor: "pointer",
          display: "flex", alignItems: "center", gap: 13, flexWrap: "wrap" }}>
          <Av name={l.name} />
          <div style={{ flex: 1, minWidth: 160 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span style={{ fontWeight: 600, fontSize: 14 }}>{l.name}</span><TempTag t={l.temp} /></div>
            <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>{l.area} · {l.ptype} · {l.budget}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <Chip tone="info">{l.status}</Chip>
            <div style={{ fontSize: 11.5, color: l.next === "Today" || (l.next || "").includes("Today") ? T.bad : T.muted, marginTop: 5,
              display: "flex", alignItems: "center", gap: 4, justifyContent: "flex-end" }}><Clock size={12} /> {l.next}</div>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {[Phone, MessageCircle, Mail].map((Ic, i) => (
              <button key={i} onClick={(e) => e.stopPropagation()} style={{ width: 32, height: 32, borderRadius: 9,
                border: `1px solid ${T.hair}`, background: i === 1 ? T.okSoft : T.paper, display: "grid",
                placeItems: "center", cursor: "pointer" }}><Ic size={14} color={i === 1 ? T.ok : T.inkSoft} /></button>
            ))}
          </div>
        </div>
      ))}
    </div>

    <SectionTitle>My week</SectionTitle>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 12 }}>
      <Kpi label="Conversion" value="18%" sub="team avg 13%" trend="up" />
      <Kpi label="Avg response" value="11 min" sub="target 30 min" trend="up" />
      <Kpi label="Missed follow-ups" value="1" sub="this week" />
      <Kpi label="Site visits" value="2" sub="1 today, 4:30 PM" />
    </div>
  </div>;
}

/* ============================= 3 LEAD DETAIL ============================= */
function LeadDetail() {
  const [revealed, setRevealed] = useState(false);
  const L = LEADS[0];
  const wmRows = Array.from({ length: 14 });
  return <div style={{ position: "relative" }}>
    {/* signature: live security watermark */}
    <div aria-hidden style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 5 }}>
      {wmRows.map((_, i) => (
        <div key={i} style={{ position: "absolute", top: i * 120 - 40, left: -100, right: -100,
          transform: "rotate(-18deg)", whiteSpace: "nowrap", fontSize: 13, letterSpacing: ".22em",
          color: T.wm, fontWeight: 700, userSelect: "none" }}>
          {"DERYA ALTUN · derya@amberhomes.ae · 11 JUN 2026 09:42 ··· ".repeat(6)}
        </div>
      ))}
    </div>

    <div style={{ position: "relative", zIndex: 10 }}>
      <div style={{ ...card, padding: 20 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 14 }}>
            <Av name={L.name} size={54} dark />
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <span style={{ fontFamily: DISPLAY, fontSize: 22 }}>{L.name}</span>
                <TempTag t={L.temp} /><Chip tone="info">{L.status}</Chip>
              </div>
              <div style={{ fontSize: 12, color: T.muted, marginTop: 4 }}>
                {L.id} · Assigned to {L.agent} · Source: {L.source} · Last contact {L.last}</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <GoldBtn><Phone size={14} /> Call</GoldBtn>
            <GoldBtn><MessageCircle size={14} /> WhatsApp</GoldBtn>
            <GoldBtn ghost><Calendar size={14} /> Schedule</GoldBtn>
          </div>
        </div>

        {/* masked contact with reveal */}
        <div style={{ marginTop: 18, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 10 }}>
          <div style={{ background: T.bone, borderRadius: 11, padding: "12px 14px", border: `1px solid ${T.hair}` }}>
            <div style={{ fontSize: 10.5, letterSpacing: ".1em", textTransform: "uppercase", color: T.muted, fontWeight: 600 }}>Phone</div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 4 }}>
              <span style={{ fontSize: 15, fontWeight: 600, letterSpacing: ".02em" }}>{revealed ? L.phoneFull : L.phone}</span>
              <button onClick={() => setRevealed(!revealed)} style={{ display: "flex", alignItems: "center", gap: 5,
                border: `1px solid ${T.goldEdge}`, background: T.goldSoft, color: T.gold, borderRadius: 8,
                padding: "4px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: UI }}>
                {revealed ? <EyeOff size={12} /> : <Eye size={12} />} {revealed ? "Hide" : "Reveal"}</button>
            </div>
            {revealed && <div style={{ fontSize: 10.5, color: T.warn, marginTop: 6, display: "flex", alignItems: "center", gap: 4 }}>
              <Lock size={11} /> Reveal logged · 09:42 · this device</div>}
          </div>
          <div style={{ background: T.bone, borderRadius: 11, padding: "12px 14px", border: `1px solid ${T.hair}` }}>
            <div style={{ fontSize: 10.5, letterSpacing: ".1em", textTransform: "uppercase", color: T.muted, fontWeight: 600 }}>Email</div>
            <div style={{ fontSize: 15, fontWeight: 600, marginTop: 4 }}>{L.email}</div>
          </div>
        </div>

        {/* profile grid */}
        <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 9 }}>
          {[["Nationality", L.nationality], ["Residence", L.residence], ["Budget", L.budget], ["Purpose", L.purpose],
            ["Preferred area", L.area], ["Developer", L.developer], ["Type", `${L.ptype} · ${L.beds}`], ["Ready / Off-plan", L.ready],
            ["Finance", L.finance], ["Timeline", L.timeline], ["Language", L.lang], ["Next follow-up", L.next]].map(([k, v]) => (
            <div key={k} style={{ padding: "9px 11px", borderRadius: 9, border: `1px solid ${T.hairSoft}` }}>
              <div style={{ fontSize: 9.5, letterSpacing: ".1em", textTransform: "uppercase", color: T.faint, fontWeight: 700 }}>{k}</div>
              <div style={{ fontSize: 12.5, fontWeight: 600, marginTop: 2 }}>{v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* options shared + timeline */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(290px,1fr))", gap: 14, marginTop: 14 }}>
        <div style={{ ...card, padding: 16 }}>
          <div style={{ fontFamily: DISPLAY, fontSize: 15, marginBottom: 10 }}>Options shared</div>
          {PROJECTS.slice(0, 2).map((p) => (
            <div key={p.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "10px 12px", borderRadius: 10, background: T.bone, marginBottom: 8 }}>
              <div><div style={{ fontSize: 13, fontWeight: 600 }}>{p.name}</div>
                <div style={{ fontSize: 11, color: T.muted }}>{p.dev} · {p.price}</div></div>
              <div style={{ fontFamily: DISPLAY, fontSize: 18, color: T.gold }}>{p.score}</div>
            </div>
          ))}
          <button style={{ width: "100%", border: `1px dashed ${T.goldEdge}`, background: "transparent", color: T.gold,
            borderRadius: 10, padding: "9px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: UI }}>
            + Attach property option</button>
        </div>
        <div style={{ ...card, padding: 16 }}>
          <div style={{ fontFamily: DISPLAY, fontSize: 15, marginBottom: 10 }}>Activity</div>
          {[["Today 09:42", "Phone revealed — Derya Altun", Lock],
            ["Yesterday 17:20", "WhatsApp: payment plan sent · client reviewing", MessageCircle],
            ["Mon 11:05", "Zoom meeting · shortlisted 2 penthouses", Calendar],
            ["Last Fri", "Status → Negotiation", CircleDot]].map(([t, w, Ic], i) => (
            <div key={i} style={{ display: "flex", gap: 10, marginBottom: 11 }}>
              <div style={{ width: 26, height: 26, borderRadius: 8, background: T.hairSoft, display: "grid",
                placeItems: "center", flexShrink: 0 }}><Ic size={12} color={T.inkSoft} /></div>
              <div><div style={{ fontSize: 12.5 }}>{w}</div>
                <div style={{ fontSize: 10.5, color: T.faint }}>{t}</div></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>;
}

/* ============================ 4 LEAD ASSIGNMENT ========================== */
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
function AiChat({ narrow }) {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState([{ role: "assistant",
    text: "Ask me anything about the desk — \u201cshow me Derya's performance\u201d, \u201chow many off-plan leads per agent?\u201d, or \u201cfind me open leads for Palm Jebel Ali\u201d." }]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const boxRef = useRef(null);
  useEffect(() => { if (boxRef.current) boxRef.current.scrollTop = boxRef.current.scrollHeight; }, [msgs, busy]);

  const DATA_CTX = JSON.stringify({
    agents: AGENTS.map((a) => ({ name: a.name, activeLeads: a.leads, closedDeals: a.deals, pipelineAEDm: a.pipeline,
      conversionPct: a.conv, avgResponse: a.resp, performanceScore: a.score,
      offPlanAssigned: { "Derya Altun": 5, "Omar Farouk": 2, "Lara Petrova": 3, "Bilal Hussain": 4 }[a.name] })),
    assignedLeads: LEADS.map((l) => ({ name: l.name, agent: l.agent, status: l.status, temp: l.temp, area: l.area,
      type: l.ptype, budget: l.budget })),
    openLeads: OPEN_LEADS.map((l) => ({ name: l.name, project: l.project, type: l.ptype, budget: l.budget,
      daysOld: l.days, previousAgent: l.lastAgent })),
    commissionsQ: COMMISSIONS.map((c) => ({ deal: c.deal, project: c.project, valueAEDm: c.value, agent: c.agent, status: c.status })),
    rules: "Leads unclosed for 60 days auto-release to the Open Leads pool, visible to all agents; contact reveals are logged.",
  });

  const send = async (q) => {
    const text = (q != null ? q : input).trim();
    if (!text || busy) return;
    const next = [...msgs, { role: "user", text }];
    setMsgs(next); setInput(""); setBusy(true);
    try {
      const res = await fetch("/api/ai", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system: "You are the AI assistant inside Amber Lead Desk, a Dubai real-estate CRM. Answer from this live desk data only: " + DATA_CTX +
            " Be concise and concrete: give numbers, short lines, name names. For performance questions summarise the agent's stats. " +
            "For distribution questions give per-agent counts. For find-me-leads questions list matching leads (name, project, budget, age) and remind that reveals are logged. " +
            "Plain text only, no markdown symbols. If asked something outside the data, say what the desk doesn't track.",
          messages: next.slice(-12).map((m) => ({ role: m.role === "user" ? "user" : "assistant", content: m.text })) }),
      });
      const data = await res.json();
      const reply = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n").trim();
      setMsgs((m) => [...m, { role: "assistant", text: reply || "Hmm, I didn't get a response — try again." }]);
    } catch (e) {
      setMsgs((m) => [...m, { role: "assistant", text: "I couldn't reach the AI just now — check the connection and that ANTHROPIC_API_KEY is set in Vercel." }]);
    } finally { setBusy(false); }
  };

  if (!open) return (
    <button onClick={() => setOpen(true)} title="Ask the desk" style={{ position: "fixed", right: 20, bottom: 20, zIndex: 60,
      width: 54, height: 54, borderRadius: 16, border: `1px solid ${T.goldEdge}`, cursor: "pointer",
      background: T.hero, color: T.goldBright, display: "grid", placeItems: "center", boxShadow: T.shadowLg }}>
      <Bot size={24} /></button>
  );

  const panel = narrow ? { position: "fixed", inset: 0, borderRadius: 0 }
    : { position: "fixed", right: 20, bottom: 20, width: 390, height: "min(600px, 82vh)", borderRadius: 18 };
  const sugg = ["Show me Derya's performance", "Off-plan leads per agent?", "Open leads for Palm Jebel Ali"];
  return (
    <div style={{ ...panel, zIndex: 65, background: T.paper, border: `1px solid ${T.hair}`, boxShadow: T.shadowLg,
      display: "flex", flexDirection: "column", overflow: "hidden", fontFamily: UI }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 16px",
        background: T.hero }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: "rgba(212,175,92,.15)", display: "grid",
            placeItems: "center" }}><Bot size={17} color={T.goldBright} /></div>
          <div>
            <div style={{ color: "#fff", fontFamily: DISPLAY, fontSize: 14 }}>Desk AI</div>
            <div style={{ color: "rgba(255,255,255,.55)", fontSize: 10.5 }}>Answers scoped to your role</div>
          </div>
        </div>
        <button onClick={() => setOpen(false)} style={{ border: "none", background: "rgba(255,255,255,.14)", borderRadius: 9,
          width: 30, height: 30, display: "grid", placeItems: "center", cursor: "pointer" }}><X size={15} color="#fff" /></button>
      </div>
      <div ref={boxRef} style={{ flex: 1, overflowY: "auto", padding: 14, background: T.bone }}>
        {msgs.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", marginBottom: 9 }}>
            <div style={{ maxWidth: "88%", background: m.role === "user" ? T.btnBg : T.paper,
              color: m.role === "user" ? T.btnFg : T.ink, border: m.role === "user" ? "none" : `1px solid ${T.hair}`,
              borderRadius: 13, padding: "9px 12px", fontSize: 12.8, lineHeight: 1.55, whiteSpace: "pre-wrap",
              boxShadow: m.role === "user" ? "none" : T.shadow }}>{m.text}</div>
          </div>
        ))}
        {busy && <div style={{ fontSize: 12, color: T.muted, padding: "4px 2px" }}>Thinking…</div>}
      </div>
      {msgs.filter((m) => m.role === "user").length === 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, padding: "0 14px 10px", background: T.bone }}>
          {sugg.map((s) => <button key={s} onClick={() => send(s)} style={{ border: `1px solid ${T.goldEdge}`,
            background: T.goldSoft, color: T.gold, borderRadius: 9, padding: "6px 11px", fontSize: 11.5, fontWeight: 600,
            cursor: "pointer", fontFamily: UI }}>{s}</button>)}
        </div>
      )}
      <div style={{ display: "flex", gap: 8, padding: 11, borderTop: `1px solid ${T.hair}`, background: T.paper }}>
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") send(); }}
          placeholder="Ask the desk…" style={{ flex: 1, border: `1px solid ${T.hair}`, borderRadius: 11, padding: "10px 12px",
            fontSize: 12.8, fontFamily: UI, outline: "none", color: T.ink, background: T.bone }} />
        <button onClick={() => send()} disabled={!input.trim() || busy} style={{ border: "none", borderRadius: 11,
          width: 40, height: 40, display: "grid", placeItems: "center", cursor: "pointer",
          background: input.trim() && !busy ? T.gold : T.faint }}><Send size={16} color="#fff" /></button>
      </div>
    </div>
  );
}

/* ============================== LOGIN FLOW =============================== */
function LoginFlow({ onLogin, dark, setDark }) {
  const [step, setStep] = useState("creds");      // creds | otp
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [code, setCode] = useState(["", "", "", ""]);
  const [err, setErr] = useState("");
  const [pending, setPending] = useState(null);   // user awaiting 2FA
  const [busy, setBusy] = useState(false);
  const DEMO = [
    { email: "saad@amberhomes.ae", name: "Saad Waqas", role: "Owner" },
    { email: "ambreen@amberhomes.ae", name: "Ambreen Qureshi", role: "Manager" },
    { email: "derya@amberhomes.ae", name: "Derya Altun", role: "Agent" },
  ];
  const mask = (e) => { const [a, b] = e.split("@"); return a[0] + "•••" + a.slice(-1) + "@" + b; };

  const submitCreds = (demoUser) => {
    setErr("");
    const u = demoUser || DEMO.find((d) => d.email.toLowerCase() === email.trim().toLowerCase())
      || (email.includes("@") ? { email: email.trim(), name: email.split("@")[0], role: "Agent" } : null);
    if (!u) { setErr("Enter your work email — your email is your username."); return; }
    if (!demoUser && pw.length < 4) { setErr("Enter your password."); return; }
    setPending(u); setStep("otp"); setCode(["", "", "", ""]);
  };
  const setDigit = (i, v) => {
    if (!/^\d?$/.test(v)) return;
    const c = [...code]; c[i] = v; setCode(c);
    if (v && i < 3) { const n = document.getElementById("otp" + (i + 1)); if (n) n.focus(); }
    if (c.every((d) => d !== "")) verify(c);
  };
  const verify = (c) => {
    setBusy(true); setErr("");
    setTimeout(() => { setBusy(false);
      if ((c || code).join("").length === 4) onLogin(pending);
      else setErr("That code didn't match. A new one has been sent.");
    }, 450);
  };
  const passkey = () => {
    setBusy(true); setErr("");
    setTimeout(() => { setBusy(false); onLogin(pending || DEMO[0]); }, 700);
  };

  const inputS = { width: "100%", border: `1px solid ${T.hair}`, borderRadius: 11, padding: "12px 14px",
    fontSize: 14, fontFamily: UI, outline: "none", color: T.ink, background: T.bone, boxSizing: "border-box" };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, background: T.bone, display: "grid",
      placeItems: "center", padding: 18, fontFamily: UI, overflowY: "auto" }}>
      <button onClick={() => setDark(!dark)} style={{ position: "absolute", top: 16, right: 16,
        border: `1px solid ${T.hair}`, background: T.paper, borderRadius: 9, width: 36, height: 36,
        display: "grid", placeItems: "center", cursor: "pointer" }}>
        {dark ? <Sun size={16} color={T.goldBright} /> : <Moon size={16} color={T.inkSoft} />}</button>

      <div style={{ width: "100%", maxWidth: 400 }}>
        {/* brand */}
        <div style={{ textAlign: "center", marginBottom: 22 }}>
          <div style={{ width: 54, height: 54, borderRadius: 16, margin: "0 auto 12px", display: "grid",
            placeItems: "center", background: T.hero, boxShadow: T.shadowLg }}>
            <span style={{ fontFamily: DISPLAY, fontSize: 22, color: T.goldBright, fontWeight: 500 }}>A</span></div>
          <div style={{ fontFamily: DISPLAY, fontSize: 20, letterSpacing: ".2em", color: T.ink, fontWeight: 500 }}>AMBER</div>
          <div style={{ fontFamily: DISPLAY, fontSize: 10, letterSpacing: ".42em", color: T.gold, marginTop: 3 }}>LEAD DESK</div>
        </div>

        <div style={{ background: T.paper, border: `1px solid ${T.hair}`, borderRadius: 18, boxShadow: T.shadowLg, padding: "26px 24px" }}>
          {step === "creds" ? (<>
            <div style={{ fontSize: 17, fontWeight: 600, color: T.ink }}>Sign in</div>
            <div style={{ fontSize: 12.5, color: T.muted, marginTop: 4, marginBottom: 18 }}>
              Your work email is your username. One login for every role — your dashboard is decided by your account.</div>
            <label style={{ display: "block", marginBottom: 12 }}>
              <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: T.muted }}>Email (username)</span>
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@amberhomes.ae"
                autoComplete="username" style={{ ...inputS, marginTop: 6 }} />
            </label>
            <label style={{ display: "block", marginBottom: 6 }}>
              <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: T.muted }}>Password</span>
              <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="••••••••"
                autoComplete="current-password" onKeyDown={(e) => { if (e.key === "Enter") submitCreds(); }}
                style={{ ...inputS, marginTop: 6 }} />
            </label>
            <div style={{ textAlign: "right", marginBottom: 14 }}>
              <button style={{ background: "none", border: "none", color: T.gold, fontSize: 11.5, fontWeight: 600,
                cursor: "pointer", fontFamily: UI }}>Forgot password?</button></div>
            {err && <div style={{ color: T.bad, fontSize: 12, fontWeight: 600, marginBottom: 10 }}>{err}</div>}
            <button onClick={() => submitCreds()} style={{ width: "100%", background: T.btnBg, color: T.btnFg,
              border: "none", borderRadius: 11, padding: "13px", fontSize: 14, fontWeight: 600, cursor: "pointer",
              fontFamily: UI }}>Continue</button>
            <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "16px 0" }}>
              <div style={{ flex: 1, height: 1, background: T.hairSoft }} />
              <span style={{ fontSize: 10.5, color: T.faint, letterSpacing: ".08em" }}>OR</span>
              <div style={{ flex: 1, height: 1, background: T.hairSoft }} />
            </div>
            <button onClick={passkey} style={{ width: "100%", background: "transparent", color: T.ink,
              border: `1px solid ${T.goldEdge}`, borderRadius: 11, padding: "12px", fontSize: 13.5, fontWeight: 600,
              cursor: "pointer", fontFamily: UI, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <Fingerprint size={17} color={T.gold} /> {busy ? "Waiting for Face ID / Touch ID…" : "Sign in with a passkey"}</button>
            <div style={{ fontSize: 10.5, color: T.faint, textAlign: "center", marginTop: 8, lineHeight: 1.5 }}>
              A passkey uses your device's Face ID, fingerprint, or PIN. No password, no code — and it can't be phished.</div>
          </>) : (<>
            <button onClick={() => setStep("creds")} style={{ background: "none", border: "none", color: T.muted,
              fontSize: 12, cursor: "pointer", fontFamily: UI, padding: 0, marginBottom: 12 }}>← Back</button>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 38, height: 38, borderRadius: 11, background: T.goldSoft, display: "grid", placeItems: "center" }}>
                <Mail size={17} color={T.gold} /></div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 600, color: T.ink }}>Check your email</div>
                <div style={{ fontSize: 12, color: T.muted }}>We sent a 4-digit code to <b style={{ color: T.ink }}>{mask(pending.email)}</b></div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "center", margin: "22px 0 6px" }}>
              {code.map((d, i) => (
                <input key={i} id={"otp" + i} value={d} onChange={(e) => setDigit(i, e.target.value)}
                  inputMode="numeric" maxLength={1} autoFocus={i === 0}
                  style={{ width: 54, height: 60, textAlign: "center", fontSize: 24, fontFamily: DISPLAY,
                    border: `1.5px solid ${d ? T.gold : T.hair}`, borderRadius: 12, outline: "none",
                    color: T.ink, background: T.bone }} />
              ))}
            </div>
            <div style={{ textAlign: "center", fontSize: 11.5, color: T.muted, marginBottom: 14 }}>
              Code expires in 5 minutes · <button style={{ background: "none", border: "none", color: T.gold,
                fontWeight: 600, cursor: "pointer", fontFamily: UI, fontSize: 11.5, padding: 0 }}>Resend</button></div>
            {err && <div style={{ color: T.bad, fontSize: 12, fontWeight: 600, marginBottom: 10, textAlign: "center" }}>{err}</div>}
            <button onClick={() => verify()} disabled={busy} style={{ width: "100%", background: T.btnBg, color: T.btnFg,
              border: "none", borderRadius: 11, padding: "13px", fontSize: 14, fontWeight: 600, cursor: "pointer",
              fontFamily: UI, opacity: busy ? .6 : 1 }}>{busy ? "Verifying…" : "Verify & sign in"}</button>
            <button onClick={passkey} style={{ width: "100%", marginTop: 10, background: "transparent", color: T.ink,
              border: `1px solid ${T.goldEdge}`, borderRadius: 11, padding: "11px", fontSize: 13, fontWeight: 600,
              cursor: "pointer", fontFamily: UI, display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
              <KeyRound size={15} color={T.gold} /> Use passkey instead</button>
          </>)}
        </div>

        {/* demo quick logins */}
        <div style={{ marginTop: 16, textAlign: "center" }}>
          <div style={{ fontSize: 10.5, letterSpacing: ".12em", textTransform: "uppercase", color: T.faint, fontWeight: 700, marginBottom: 8 }}>
            Prototype demo — sign in as</div>
          <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
            {DEMO.map((d) => (
              <button key={d.email} onClick={() => submitCreds(d)} style={{ border: `1px solid ${T.hair}`,
                background: T.paper, color: T.inkSoft, borderRadius: 9, padding: "7px 13px", fontSize: 12,
                fontWeight: 600, cursor: "pointer", fontFamily: UI }}>
                {d.name.split(" ")[0]} · <span style={{ color: T.gold }}>{d.role}</span></button>
            ))}
          </div>
          <div style={{ fontSize: 10.5, color: T.faint, marginTop: 10 }}>In the demo, any 4 digits work as the code.</div>
          <div style={{ fontSize: 9.5, color: T.faint, marginTop: 6, opacity: .7 }}>Live · auto-deploy connected ✓ · build 2026-06-13</div>
        </div>
      </div>
    </div>
  );
}
